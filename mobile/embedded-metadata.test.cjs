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
  epub.file('OEBPS/content.opf','<package><metadata><dc:title>Dune</dc:title><dc:creator>Herbert, Frank</dc:creator><dc:publisher>Chilton</dc:publisher><dc:language>en</dc:language><dc:identifier>urn:isbn:9780441172719</dc:identifier><meta property="belongs-to-collection">Dune</meta><meta property="group-position">1</meta></metadata></package>');
  let fields=await extractEmbeddedMetadataFromBase64(await epub.generateAsync({type:'base64'}),'epub');
  assert.equal(fields.title,'Dune');
  assert.equal(fields.author,'Frank Herbert');
  assert.equal(fields.series,'Dune');
  assert.equal(fields.seriesNumber,1);
  assert.equal(fields.publisher,'Chilton');
  assert.equal(fields.language,'en');
  assert.equal(fields.isbn,'9780441172719');

  const comic=new JSZip();
  comic.file('ComicInfo.xml','<ComicInfo><Title>Preludes &amp; Nocturnes</Title><Series>Sandman</Series><Number>1</Number><Volume>2</Volume><Writer>Neil Gaiman, Terry Pratchett</Writer><Penciller>Sam Kieth</Penciller><AlternateSeries>The Sandman</AlternateSeries><Publisher>DC</Publisher><Genre>Fantasy</Genre><Year>1989</Year><Month>1</Month><Day>1</Day><StoryArc>Preludes &amp; Nocturnes</StoryArc><Characters>Dream, John Constantine</Characters><Teams>The Endless</Teams><PageCount>32</PageCount></ComicInfo>');
  fields=await extractEmbeddedMetadataFromBase64(await comic.generateAsync({type:'base64'}),'cbz');
  assert.equal(fields.title,'Preludes & Nocturnes');
  assert.equal(fields.series,'Sandman');
  assert.equal(fields.seriesNumber,1);
  assert.equal(fields.author,'Neil Gaiman & Terry Pratchett');
  assert.equal(fields.publisher,'DC');
  assert.equal(fields.comicIssueNumber,'1');
  assert.equal(fields.comicVolume,2);
  assert.equal(fields.seriesNumber,1,'ComicInfo Number is the issue order; Volume must not overwrite it');
  assert.deepEqual(fields.comicSeriesAliases,['The Sandman']);
  assert.deepEqual(fields.comicCreators,[{name:'Neil Gaiman',roles:['Writer']},{name:'Terry Pratchett',roles:['Writer']},{name:'Sam Kieth',roles:['Penciller']}]);
  assert.deepEqual(fields.comicStoryArcs,['Preludes & Nocturnes']);
  assert.deepEqual(fields.comicCharacters,['Dream','John Constantine']);
  assert.equal(fields.comicPageCount,32);
  assert.equal(fields.comicCoverDate,'1989-01-01');

  console.log('PASS: embedded EPUB and rich ComicInfo metadata are extracted without media rendering');
})().catch(error=>{console.error(error);process.exitCode=1});
