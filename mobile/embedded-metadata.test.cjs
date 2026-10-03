const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return {EncodingType:{Base64:'base64'},async getInfoAsync(){return {exists:true,size:1}},async readAsStringAsync(){return ''}};
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowSyntheticDefaultImports:true},
}).outputText,file);

const JSZip=require('jszip');
const {extractEmbeddedMetadataFromBase64}=require('./embeddedMetadata.ts');

(async()=>{
  const epub=new JSZip();
  epub.file('META-INF/container.xml','<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>');
  epub.file('OEBPS/content.opf','<package><metadata><dc:title>Dune</dc:title><dc:creator>Herbert, Frank</dc:creator><dc:publisher>Chilton</dc:publisher><dc:language>en</dc:language><meta name="calibre:series" content="Dune"/><meta name="calibre:series_index" content="1"/></metadata></package>');
  let fields=await extractEmbeddedMetadataFromBase64(await epub.generateAsync({type:'base64'}),'epub');
  assert.equal(fields.title,'Dune');
  assert.equal(fields.author,'Frank Herbert');
  assert.equal(fields.series,'Dune');
  assert.equal(fields.seriesNumber,1);
  assert.equal(fields.publisher,'Chilton');
  assert.equal(fields.language,'en');

  const comic=new JSZip();
  comic.file('ComicInfo.xml','<ComicInfo><Title>Preludes &amp; Nocturnes</Title><Series>Sandman</Series><Number>1</Number><Writer>Neil Gaiman</Writer><Publisher>DC</Publisher><Genre>Fantasy</Genre></ComicInfo>');
  fields=await extractEmbeddedMetadataFromBase64(await comic.generateAsync({type:'base64'}),'cbz');
  assert.equal(fields.title,'Preludes & Nocturnes');
  assert.equal(fields.series,'Sandman');
  assert.equal(fields.seriesNumber,1);
  assert.equal(fields.author,'Neil Gaiman');
  assert.equal(fields.publisher,'DC');

  console.log('PASS: embedded EPUB and ComicInfo metadata are extracted without media rendering');
})().catch(error=>{console.error(error);process.exitCode=1});
