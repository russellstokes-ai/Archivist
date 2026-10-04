const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const load=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='expo-file-system/legacy')return {
    documentDirectory:null,
    EncodingType:{Base64:'base64'},
    async getInfoAsync(){return {exists:false}},
    async makeDirectoryAsync(){},
    async readAsStringAsync(){return ''},
    async writeAsStringAsync(){},
  };
  return load.call(this,request,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowSyntheticDefaultImports:true},
}).outputText,file);

const JSZip=require('jszip');
const {extractArchiveCoverFromBase64,extractID3PictureFromBase64,extractMP4PictureFromBase64}=require('./coverDiscovery.ts');

function syncsafe(n){return [(n>>21)&127,(n>>14)&127,(n>>7)&127,n&127]}
function id3Frame(id,data){
  const size=Buffer.alloc(4);size.writeUInt32BE(data.length);
  return Buffer.concat([Buffer.from(id),size,Buffer.from([0,0]),data]);
}
function atom(type,payload){
  const t=Buffer.isBuffer(type)?type:Buffer.from(type,'latin1');
  const size=Buffer.alloc(4);size.writeUInt32BE(8+payload.length);
  return Buffer.concat([size,t,payload]);
}
function mp4Data(payload){
  return atom('data',Buffer.concat([Buffer.alloc(8),payload]));
}

(async()=>{
  const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,1,2,3,4,0xff,0xd9]);
  const png=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1,2,3,4]);

  const epub=new JSZip();
  epub.file('META-INF/container.xml','<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>');
  epub.file('OEBPS/content.opf','<package><metadata><meta name="cover" content="cover-image"/></metadata><manifest><item id="cover-image" href="images/front.jpg" media-type="image/jpeg"/></manifest></package>');
  epub.file('OEBPS/images/front.jpg',jpeg);
  let cover=await extractArchiveCoverFromBase64(await epub.generateAsync({type:'base64'}),'epub');
  assert.ok(cover);
  assert.equal(cover.extension,'jpg');
  assert.equal(Buffer.from(cover.base64,'base64').subarray(0,3).toString('hex'),'ffd8ff');

  const cbz=new JSZip();
  cbz.file('pages/002.jpg',jpeg);
  cbz.file('pages/001.png',png);
  cover=await extractArchiveCoverFromBase64(await cbz.generateAsync({type:'base64'}),'cbz');
  assert.ok(cover);
  assert.equal(cover.extension,'png','comic fallback should use the natural first page');

  const apic=Buffer.concat([
    Buffer.from([0]),
    Buffer.from('image/jpeg'),
    Buffer.from([0,3,0]),
    jpeg,
  ]);
  const apicFrame=id3Frame('APIC',apic);
  const tag=Buffer.concat([Buffer.from('ID3'),Buffer.from([3,0,0,...syncsafe(apicFrame.length)]),apicFrame]);
  cover=extractID3PictureFromBase64(tag.toString('base64'));
  assert.ok(cover);
  assert.equal(cover.extension,'jpg');

  const covr=atom('covr',mp4Data(jpeg));
  cover=extractMP4PictureFromBase64(covr.toString('base64'));
  assert.ok(cover);
  assert.equal(cover.extension,'jpg');

  console.log('PASS: embedded EPUB, comic, MP3 and M4B artwork discovery');
})().catch(error=>{console.error(error);process.exitCode=1});
