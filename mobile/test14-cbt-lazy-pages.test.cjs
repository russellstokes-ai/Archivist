const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),ts=require('typescript');
const load=Module._load;
let opened=0,read=[],closed=0;
Module._load=function(name,parent,isMain){
 if(name==='react-native')return{NativeModules:{ArchivistArchive:{
  openTar:async()=>{opened++;return {token:'fixture',entries:[
    {name:'010.jpg',offset:1024,size:3},{name:'002.png',offset:1536,size:2},
    {name:'notes.txt',offset:2048,size:50},
  ]}},
  readTarEntry:async(token,offset,size)=>{read.push([token,offset,size]);return 'AQID'},
  closeTar:async()=>{closed++},
 }}};
 if(name==='expo-file-system/legacy')return {cacheDirectory:'file:///cache/',deleteAsync:async()=>{},
   EncodingType:{Base64:'base64'},getInfoAsync:async()=>({exists:true,size:100}),
   readAsStringAsync:async()=>{throw Error('Whole archive must not be read in native mode')}};
 return load.call(this,name,parent,isMain);
};
require.extensions['.ts']=(mod,path)=>mod._compile(ts.transpileModule(fs.readFileSync(path,'utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
}).outputText,path);
(async()=>{
 const {openCbtPages}=require('./nativeCbtPages.ts');
 const book=await openCbtPages('content://provider/document/123');
 assert.equal(book.pageCount,2);
 assert.equal((await book.loadPage(0)).name,'002.png');
 assert.equal((await book.loadPage(1)).name,'010.jpg');
 assert.deepEqual(read,[['fixture',1536,2],['fixture',1024,3]]);
 assert.equal(opened,1);
 await book.dispose();await book.dispose();
 assert.equal(closed,1,'Native tar file must be closed exactly once');
 await assert.rejects(()=>book.loadPage(0),/closed/);
 const reader=fs.readFileSync(__dirname+'/localReader.ts','utf8');
 assert(reader.includes("if(ext==='cbt')return tarComicDocument"));
 assert(reader.includes("try{return await tarComicDocument(uri,title,initialPage);}catch{}"));
 assert(reader.includes('const pages=await openCbtPages(uri);'));
 const canonical=require('../scripts/repair-original-source.cjs')('mobile/localReader.ts');
 assert(canonical.includes('function shell(')&&canonical.includes('speechFocusBrowserSource'));
 console.log('PASS: Android CBT pages streamed lazily, sorted, native token closed and canonical Comic Focus HTML intact');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{Module._load=load});
