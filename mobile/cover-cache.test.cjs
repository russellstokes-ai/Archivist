const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');

function loadCoverCache(options={}){
  let source=fs.readFileSync(__dirname+'/coverCache.ts','utf8').replace('10_000','8');
  const out=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const calls={cancel:0,download:0,image:[],moves:[],deletes:[]};
  const root='file://docs/archivist-covers/';
  const fsMock={
    documentDirectory:'file://docs/',
    async getInfoAsync(uri){
      if(uri===root)return {exists:true};
      if(uri.endsWith('.download'))return {exists:true,size:4096};
      return {exists:false};
    },
    async makeDirectoryAsync(){},
    async deleteAsync(uri){calls.deletes.push(uri);},
    createDownloadResumable(_remote,temp,_opts,onProgress){
      return {
        async cancelAsync(){calls.cancel++;},
        async downloadAsync(){
          calls.download++;
          if(options.neverDownload)return new Promise(()=>{});
          onProgress?.({totalBytesWritten:4096,totalBytesExpectedToWrite:4096});
          return {uri:temp,status:200,headers:{}};
        },
      };
    },
    async moveAsync(args){calls.moves.push(args);},
  };
  const rnMock={
    Image:{
      getSize(uri,success,failure){
        calls.image.push(uri);
        if(options.neverImage)return;
        if(options.badImage)return failure?.(Error('bad image'));
        success(600,1000);
      },
    },
  };
  const mod={exports:{}};
  const req=id=>{
    if(id==='expo-file-system/legacy')return fsMock;
    if(id==='react-native')return rnMock;
    return require(id);
  };
  vm.runInNewContext('(function(require,module,exports){'+out+'\n})(req,module,module.exports)',{
    req,require:req,module:mod,exports:mod.exports,setTimeout,clearTimeout,Promise,Error,
  });
  return {x:mod.exports,calls};
}

(async()=>{
  const hanging=loadCoverCache({neverDownload:true});
  const started=Date.now();
  await assert.rejects(
    hanging.x.cacheRemoteCover('dune','https://covers.example/dune.jpg'),
    /timed out|cancelled/i,
  );
  assert(Date.now()-started<500,'cover timeout regression test should terminate promptly');
  assert.equal(hanging.calls.cancel,1,'timed-out native download must be cancelled');
  assert.equal(hanging.calls.deletes.some(uri=>uri.endsWith('.download')),true,'timed-out partial cover must be removed');

  const normal=loadCoverCache();
  const portrait=await normal.x.cachePortraitCover('dune','https://covers.example/dune.jpg');
  assert.equal(portrait.width,600);
  assert.equal(portrait.height,1000);
  assert.equal(portrait.aspectRatio,.6);
  assert.equal(normal.calls.image.length,1);
  assert.equal(normal.calls.image[0].startsWith('file://docs/archivist-covers/'),true,'dimension probe must inspect the cached local file, not the remote host');
  assert.equal(normal.calls.image[0].startsWith('https://'),false);

  const dimensions=loadCoverCache({neverImage:true});
  await assert.rejects(dimensions.x.imageDimensions('file://local.jpg',5),/timed out/i);

  const source=fs.readFileSync(__dirname+'/coverCache.ts','utf8');
  assert(source.includes('maxCoverBytes=12*1024*1024'),'cover downloads must retain a hard size ceiling');
  assert(source.includes('task.cancelAsync()'),'cover timeout/oversize handling must cancel the native transfer');
  assert.equal(source.includes('imageDimensions(remoteUri)'),false,'remote image dimension probes must stay removed');

  console.log('PASS: cover caching cancels stalled downloads and probes dimensions locally');
})().catch(error=>{console.error(error);process.exitCode=1});
