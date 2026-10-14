const assert=require('node:assert/strict');
const fs=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');

let platformOS='ios';
let nativeArchiveEnabled=false;
let extractedFiles=[];
const deleted=[];
const unarchiveCalls=[];
const load=Module._load;

Module._load=function(req,p,i){
  if(req==='expo-file-system/legacy')return{
    cacheDirectory:'file:///cache/',
    EncodingType:{Base64:'base64'},
    getInfoAsync:async()=>({exists:true,size:1}),
    readAsStringAsync:async uri=>{
      if(String(uri).endsWith('/002.png'))return 'AQID';
      if(String(uri).endsWith('/010.jpg'))return 'BAU=';
      return '';
    },
    deleteAsync:async(uri,options)=>{deleted.push([uri,options]);},
  };
  if(req==='react-native')return{
    Platform:{get OS(){return platformOS;}},
    NativeModules:nativeArchiveEnabled?{
      ArchivistArchive:{
        readRarImages:async()=>[{name:'001.jpg',mime:'image/jpeg',base64:'AQI='}],
      },
    }:{},
  };
  if(req==='react-native-unarchive')return{
    unarchive:async(archivePath,outputPath)=>{
      unarchiveCalls.push([archivePath,outputPath]);
      return{
        outputPath,
        files:extractedFiles.map(file=>({...file,path:outputPath+'/'+file.name,relativePath:file.name})),
      };
    },
  };
  return load.call(this,req,p,i);
};

require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,f);

const {parseTarImages,readCbrImages}=require('./archiveReader.ts');

function entry(name,bytes,declared=bytes.length){
  const h=Buffer.alloc(512);
  Buffer.from(name).copy(h);
  Buffer.from(declared.toString(8).padStart(11,'0')+'\0').copy(h,124);
  h.fill(32,148,156);
  h[156]=48;
  Buffer.from('ustar\0').copy(h,257);
  let sum=0;
  for(const b of h)sum+=b;
  Buffer.from(sum.toString(8).padStart(6,'0')+'\0 ').copy(h,148);
  return Buffer.concat([h,Buffer.from(bytes),Buffer.alloc((512-(bytes.length%512))%512)]);
}

(async()=>{
  let tar=Buffer.concat([entry('010.jpg',[4,5]),entry('002.png',[1,2,3]),Buffer.alloc(1024)]);
  let pages=parseTarImages(new Uint8Array(tar));
  assert.equal(pages.length,2);
  assert.equal(pages[0].name,'002.png');
  assert.equal(pages[0].base64,'AQID');

  const huge=Buffer.concat([entry('huge.jpg',[],70*1024*1024),Buffer.alloc(1024)]);
  assert.throws(()=>parseTarImages(new Uint8Array(huge)),/64 MB safety limit/);

  platformOS='android';
  nativeArchiveEnabled=true;
  pages=await readCbrImages('content://comic.cbr');
  assert.equal(pages.length,1);
  assert.equal(pages[0].name,'001.jpg');
  assert.equal(unarchiveCalls.length,0,'Android must keep the existing native CBR bridge');

  platformOS='ios';
  nativeArchiveEnabled=false;
  extractedFiles=[
    {name:'010.jpg',size:2},
    {name:'002.png',size:3},
    {name:'notes.txt',size:10},
  ];
  pages=await readCbrImages('file:///Documents/My%20Comic.cbr');
  assert.deepEqual(pages.map(page=>page.name),['002.png','010.jpg']);
  assert.deepEqual(pages.map(page=>page.base64),['AQID','BAU=']);
  assert.equal(unarchiveCalls.length,1);
  assert.equal(unarchiveCalls[0][0],'/Documents/My Comic.cbr');
  assert.match(unarchiveCalls[0][1],/^\/cache\/archivist-cbr-/);
  assert.equal(deleted.length,1);
  assert.match(deleted[0][0],/^file:\/\/\/cache\/archivist-cbr-/);
  assert.equal(deleted[0][1]?.idempotent,true);

  extractedFiles=[{name:'huge.jpg',size:65*1024*1024}];
  await assert.rejects(()=>readCbrImages('file:///Documents/Huge.cbr'),/64 MB safety limit/);
  assert.equal(deleted.length,2,'iOS extraction cache must be cleaned after safety rejection');

  console.log('PASS: archive reader enforces TAR limits and CBR works through Android native + iOS extraction paths');
})().catch(error=>{console.error(error);process.exitCode=1;});
