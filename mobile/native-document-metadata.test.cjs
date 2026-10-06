const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');

const native={
  scanReads:0,
  async startTreeScan(){return 'scan-1';},
  async readTreeScanBatch(){
    this.scanReads++;
    if(this.scanReads>1)return {items:[],done:true,visited:2,found:2,errors:0};
    return {
      items:[
        {uri:'content://provider/tree/primary%3ABooks/document/primary%3ABooks%2FDune.epub',documentId:'primary:Books/Dune.epub',name:'Dune.epub',parentId:'primary:Books',mimeType:'application/epub+zip',size:12345,modified:1700000000000,role:'media',format:'EPUB'},
        {uri:'content://provider/tree/primary%3ABooks/document/primary%3ABooks%2FSaga.cbz',documentId:'primary:Books/Saga.cbz',name:'Saga.cbz',parentId:'primary:Books',mimeType:'application/zip',size:54321,modified:1700000001000,role:'media',format:'Comic'},
        {uri:'',documentId:'',name:'',parentId:'primary:Books',mimeType:'',size:2,modified:0,role:'directory-context',format:'mixed'},
        {uri:'',documentId:'',name:'',parentId:'primary:Books',mimeType:'',size:0,modified:0,role:'directory-end',format:''},
      ],
      done:true,visited:2,found:2,errors:0,
    };
  },
  async cancelTreeScan(){return true;},
  async readDocumentMetadataBatch(items){
    assert.equal(items.length,2);
    return items.map(item=>item.format==='EPUB'?{
      uri:item.uri,
      title:'Dune',
      author:'Frank Herbert',
      series:'Dune',
      seriesIndex:1,
      genre:'Science Fiction',
      publisher:'Ace',
      year:1965,
      isbn:'9780441172719',
      identifiers:['9780441172719','urn:uuid:dune'],
    }:{
      uri:item.uri,
      title:'Saga',
      author:'Brian K. Vaughan',
      series:'Saga',
      seriesIndex:1,
      genre:'Science Fiction',
      publisher:'Image Comics',
      year:2012,
    });
  },
};

const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='react-native')return {Platform:{OS:'android'},NativeModules:{ArchivistLibrary:native}};
  if(request==='expo-file-system/legacy')return {
    StorageAccessFramework:{},
    async getInfoAsync(){return {exists:false};},
    async readAsStringAsync(){return '';},
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {deepScanLocalTracks,scanLocalFolders}=require('./localLibrary.ts');

(async()=>{
  const root='content://provider/tree/primary%3ABooks';
  const result=await scanLocalFolders([{id:root,uri:root,name:'Books',status:'Ready',itemCount:0}]);
  assert.equal(result.books.length,2);

  const dune=result.books.find(book=>book.format==='EPUB');
  assert.equal(dune.title,'Dune');
  assert.equal(dune.author,'Frank Herbert');
  assert.equal(dune.series,'Dune');
  assert.equal(dune.seriesIndex,1);
  assert.equal(dune.publisher,'Ace');
  assert.equal(dune.publishedYear,1965);
  assert.equal(dune.isbn,'9780441172719');
  assert.equal(dune.identifiers.includes('urn:uuid:dune'),true);
  assert.equal(dune.metadataSource,'embedded');
  assert.equal(dune.identificationConfidence,'high');
  assert.equal(dune.needsReview,false);
  assert.equal(dune.sourceUri,root);

  const comic=result.books.find(book=>book.format==='Comic');
  assert.equal(comic.title,'Saga');
  assert.equal(comic.author,'Brian K. Vaughan');
  assert.equal(comic.series,'Saga');
  assert.equal(comic.seriesIndex,1);
  assert.equal(comic.publisher,'Image Comics');
  assert.equal(comic.publishedYear,2012);
  assert.equal(comic.metadataSource,'embedded');
  assert.equal(comic.needsReview,false);

  const deep=await deepScanLocalTracks([{
    id:99,
    uri:dune.uri,
    title:'Unknown',
    author:'',
    series:'',
    genre:'',
    format:'EPUB',
    space:'Books',
    available:true,
    coverShape:'portrait',
    metadataSource:'path',
    identificationConfidence:'low',
    needsReview:true,
    reviewReason:'Unknown',
  }]);
  assert.equal(deep[0].title,'Dune','deep scan must re-read embedded metadata for one selected work');
  assert.equal(deep[0].author,'Frank Herbert');
  assert.equal(deep[0].isbn,'9780441172719');
  assert.equal(deep[0].needsReview,false);

  const source=fs.readFileSync(__dirname+'/android/app/src/main/java/app/archivist/reader/ArchivistLibraryModule.kt','utf8');
  assert(source.includes('fun readDocumentMetadataBatch'),'Android scanner must expose bounded document metadata extraction');
  assert(source.includes('metadataTextLimit = 2 * 1024 * 1024'),'Embedded metadata reads must stay capped at 2 MB');
  assert(source.includes('metadataArchiveEntryLimit = 20000'),'Archive traversal must have a hard entry limit');
  assert(source.includes('META-INF/container.xml'),'EPUB metadata must resolve the package document from container.xml');
  assert(source.includes('ComicInfo.xml'),'Comic archives must inspect ComicInfo.xml');
  assert(source.includes('Archive(input)'),'CBR metadata must reuse the bounded junrar reader');
  assert(source.includes('cbtMetadata'),'CBT metadata must be handled without extracting the archive');
  assert.equal(source.includes('ScanEntry(documentUri.toString(), name, parentId'),false,'Native scan entries must retain documentId');

  console.log('PASS: native scanner applies bounded embedded EPUB/comic metadata before online enrichment');
})().catch(error=>{console.error(error);process.exitCode=1});
