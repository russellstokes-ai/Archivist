const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const root='content://provider/tree/primary%3ABooks';
const native={
  reads:0,
  async startTreeScan(){return 'scan-art';},
  async readTreeScanBatch(){
    this.reads++;
    if(this.reads>1)return {items:[],done:true,visited:7,found:2,errors:0};
    return {
      items:[
        {uri:root+'/document/primary%3ABooks%2FDune.jpg',documentId:'primary:Books/Dune.jpg',name:'Dune.jpg',parentId:'primary:Books',mimeType:'image/jpeg',size:1000,modified:10,role:'artwork',format:''},
        {uri:root+'/document/primary%3ABooks%2FFoundation.png',documentId:'primary:Books/Foundation.png',name:'Foundation.png',parentId:'primary:Books',mimeType:'image/png',size:1000,modified:11,role:'artwork',format:''},
        {uri:root+'/document/primary%3ABooks%2Fcover.jpg',documentId:'primary:Books/cover.jpg',name:'cover.jpg',parentId:'primary:Books',mimeType:'image/jpeg',size:1000,modified:12,role:'artwork',format:''},
        {uri:root+'/document/primary%3ABooks%2Fauthor.jpg',documentId:'primary:Books/author.jpg',name:'author.jpg',parentId:'primary:Books',mimeType:'image/jpeg',size:1000,modified:13,role:'artwork',format:''},
        {uri:'',documentId:'',name:'',parentId:'primary:Books',mimeType:'',size:2,modified:0,role:'directory-context',format:'mixed'},
        {uri:root+'/document/primary%3ABooks%2FDune.epub',documentId:'primary:Books/Dune.epub',name:'Dune.epub',parentId:'primary:Books',mimeType:'application/epub+zip',size:2000,modified:20,role:'media',format:'EPUB'},
        {uri:root+'/document/primary%3ABooks%2FFoundation.epub',documentId:'primary:Books/Foundation.epub',name:'Foundation.epub',parentId:'primary:Books',mimeType:'application/epub+zip',size:2200,modified:21,role:'media',format:'EPUB'},
        {uri:'',documentId:'',name:'',parentId:'primary:Books',mimeType:'',size:0,modified:0,role:'directory-end',format:''},
      ],
      done:true,visited:7,found:2,errors:0,
    };
  },
  async cancelTreeScan(){return true;},
  async readDocumentMetadataBatch(items){
    return items.map(item=>({uri:item.uri,title:item.name.replace(/\.epub$/i,''),author:'Author'}));
  },
};

const original=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'android'},NativeModules:{ArchivistLibrary:native}};
  if(request==='expo-file-system/legacy')return {
    StorageAccessFramework:{},
    async getInfoAsync(){return {exists:false};},
    async readAsStringAsync(){return '';},
  };
  return original.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {scanLocalFolders}=require('./localLibrary.ts');

(async()=>{
  const result=await scanLocalFolders([{id:root,uri:root,name:'Books',status:'Ready',itemCount:0}]);
  assert.equal(result.books.length,2);
  const dune=result.books.find(book=>book.title==='Dune');
  const foundation=result.books.find(book=>book.title==='Foundation');
  assert.equal(dune.coverUri,root+'/document/primary%3ABooks%2FDune.jpg','same-stem JPG must win for Dune');
  assert.equal(foundation.coverUri,root+'/document/primary%3ABooks%2FFoundation.png','same-stem PNG must win for Foundation');
  assert.notEqual(dune.coverUri,root+'/document/primary%3ABooks%2Fcover.jpg','generic cover must not override a same-stem cover');
  assert.notEqual(foundation.coverUri,root+'/document/primary%3ABooks%2Fauthor.jpg','unrelated images must never become covers');

  const kotlin=fs.readFileSync(__dirname+'/android/app/src/main/java/app/archivist/reader/ArchivistLibraryModule.kt','utf8');
  assert(kotlin.includes('return "artwork" to ""'),'native scanner must expose image candidates beyond cover/folder names');
  assert.equal(kotlin.includes('if (stem == "cover" || stem == "folder") return "artwork"'),false,'native scanner must not filter out same-stem artwork');

  console.log('PASS: native scanner discovers same-stem artwork without misapplying unrelated or generic images');
})().catch(error=>{console.error(error);process.exitCode=1});
