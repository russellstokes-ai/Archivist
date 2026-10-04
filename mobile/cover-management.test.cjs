const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');

require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {
  MAX_MANUAL_COVER_BYTES,
  coverSizeError,
  inspectPickedCover,
  persistManualCover,
  pickedCoverAsset,
  rankLocalCoverCandidates,
  verifiedCoverSize,
}=require('./coverManagement.ts');

assert.equal(MAX_MANUAL_COVER_BYTES,25*1024*1024);
assert.equal(coverSizeError(MAX_MANUAL_COVER_BYTES),'');
assert.match(coverSizeError(MAX_MANUAL_COVER_BYTES+1),/smaller than 25 MB/);
assert.match(coverSizeError(undefined),/could not verify/i);

assert.equal(pickedCoverAsset({canceled:true,assets:[{uri:'file:///ignored.jpg'}]}),null,'cancel must not produce a cover change');
assert.equal(pickedCoverAsset({canceled:false,assets:[]}),null);
assert.equal(pickedCoverAsset({canceled:false,assets:[{uri:''}]}),null);
assert.deepEqual(
  pickedCoverAsset({canceled:false,assets:[{uri:'file:///cover.jpg',fileName:'cover.jpg',fileSize:123}]}),
  {uri:'file:///cover.jpg',fileName:'cover.jpg',fileSize:123},
);

assert.equal(verifiedCoverSize(123,{exists:true,size:456}),123,'picker-reported size takes precedence');
assert.equal(verifiedCoverSize(undefined,{exists:true,size:456}),456);
assert.equal(verifiedCoverSize(undefined,{exists:false,size:456}),undefined);

assert.deepEqual(
  rankLocalCoverCandidates('file:///front.jpg',[
    'file:///cover.jpg','file:///front.jpg','file:///cover.jpg','', 'file:///folder.jpg',
  ]),
  ['file:///front.jpg','file:///cover.jpg','file:///folder.jpg'],
  'current scanned cover should lead while discovery ranking and de-duplication are preserved',
);
assert.deepEqual(
  rankLocalCoverCandidates('file:///manual.jpg',['file:///cover.jpg','file:///front.jpg']),
  ['file:///cover.jpg','file:///front.jpg'],
  'manual current cover should not be injected into the local alternatives list',
);

(async()=>{
  const oversizedUri='file:///oversized.jpg';
  let infoCalls=0;
  const inspected=await inspectPickedCover(oversizedUri,undefined,{
    async getInfoAsync(uri){infoCalls+=1;assert.equal(uri,oversizedUri);return {exists:true,size:MAX_MANUAL_COVER_BYTES+1};},
  });
  assert.equal(infoCalls,1);
  assert.match(inspected.error,/smaller than 25 MB/);

  const unknown=await inspectPickedCover('file:///unknown.jpg',undefined,{
    async getInfoAsync(){return {exists:true};},
  });
  assert.match(unknown.error,/could not verify/i);

  const valid=await inspectPickedCover('file:///valid.jpg',2*1024*1024,{
    async getInfoAsync(){return {exists:true,size:2*1024*1024};},
  });
  assert.equal(valid.error,'');
  assert.equal(valid.size,2*1024*1024);

  const dirs=[],copies=[],deletes=[];
  const source='file:///picker/cover.PNG';
  let target='';
  const ops={
    documentDirectory:'file:///app/Documents/',
    async makeDirectoryAsync(uri,options){dirs.push([uri,options]);},
    async copyAsync(copy){copies.push(copy);target=copy.to;},
    async getInfoAsync(uri){
      if(uri===source)return {exists:true,size:1024};
      if(uri===target)return {exists:true,size:1024};
      return {exists:false};
    },
    async deleteAsync(uri,options){deletes.push([uri,options]);},
    now:()=>123456,
  };
  const persisted=await persistManualCover(source,'Chosen.PNG',1024,ops);
  assert.equal(persisted,'file:///app/Documents/covers/manual-cover-123456.png');
  assert.deepEqual(dirs,[['file:///app/Documents/covers/',{intermediates:true}]]);
  assert.deepEqual(copies,[{from:source,to:persisted}]);
  assert.deepEqual(deletes,[]);

  let copiedOversize=false;
  await assert.rejects(
    ()=>persistManualCover('file:///huge.jpg','huge.jpg',undefined,{
      ...ops,
      async getInfoAsync(uri){
        if(uri==='file:///huge.jpg')return {exists:true,size:MAX_MANUAL_COVER_BYTES+1};
        return {exists:false};
      },
      async copyAsync(){copiedOversize=true;},
    }),
    /smaller than 25 MB/,
  );
  assert.equal(copiedOversize,false,'oversized covers must be rejected before copying');

  const cleanup=[];
  let mismatchTarget='';
  await assert.rejects(
    ()=>persistManualCover('file:///source.jpg','source.jpg',1000,{
      documentDirectory:'file:///app/Documents/',
      async makeDirectoryAsync(){},
      async copyAsync(copy){mismatchTarget=copy.to;},
      async getInfoAsync(uri){
        if(uri==='file:///source.jpg')return {exists:true,size:1000};
        if(uri===mismatchTarget)return {exists:true,size:999};
        return {exists:false};
      },
      async deleteAsync(uri){cleanup.push(uri);},
      now:()=>9,
    }),
    /did not match/,
  );
  assert.deepEqual(cleanup,['file:///app/Documents/covers/manual-cover-9.jpg'],'failed persisted cover must be cleaned up');

  await assert.rejects(
    ()=>persistManualCover('file:///source.jpg','source.jpg',1000,{
      ...ops,
      documentDirectory:null,
    }),
    /storage is unavailable/,
    'temporary picker URIs must never masquerade as durable manual covers',
  );

  console.log('PASS: cover management validates cancellation, ranking, 25 MB safety, durable copy verification and cleanup');
})().catch(error=>{console.error(error);process.exitCode=1;});
