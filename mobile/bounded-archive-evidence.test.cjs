const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const original=Module._load;
let platform='android',calls=0,mode='comic';
Module._load=function(name,parent,isMain){
  if(name==='react-native')return {
    Platform:{get OS(){return platform}},
    NativeModules:{ArchivistArchive:{
      readBoundedArchiveEvidence:async(uri,ext)=>{
        calls++;
        if(mode==='timeout')throw Object.assign(Error('deadline'),{code:'operation-timeout'});
        if(mode==='blocked')throw Object.assign(Error('ComicInfo exceeds budget'),{code:'metadata-too-large'});
        if(mode==='epub')return {
          metadataKind:'opf',
          metadataText:'<package><metadata><dc:title xmlns:dc="dc">Dune</dc:title><dc:creator xmlns:dc="dc">Frank Herbert</dc:creator></metadata></package>',
          coverName:'OPS/cover.jpg',
          coverMime:'image/jpeg',
          coverBase64:'AQID',
        };
        return {
          metadataKind:'xml',
          metadataText:'<ComicInfo><Title>Dune</Title><Series>Dune</Series><Number>1</Number><Writer>Frank Herbert</Writer></ComicInfo>',
          coverName:'001.jpg',
          coverMime:'image/jpeg',
          coverBase64:'BAUG',
        };
      },
    }},
  };
  return original.call(this,name,parent,isMain);
};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);

const {readBoundedArchiveEvidence}=require('./boundedArchiveEvidence.ts');

(async()=>{
  const comic=await readBoundedArchiveEvidence('content://comic.cbz','cbz');
  assert.equal(comic.status,'ok');
  assert.equal(comic.fields.title,'Dune');
  assert.equal(comic.fields.series,'Dune');
  assert.equal(String(comic.fields.comicIssueNumber),'1');
  assert.equal(comic.coverUri,'data:image/jpeg;base64,BAUG');
  assert.equal(calls,1);

  const cbt=await readBoundedArchiveEvidence('content://comic.cbt','cbt');
  assert.equal(cbt.status,'ok');
  assert.equal(cbt.fields.title,'Dune');
  const cbr=await readBoundedArchiveEvidence('content://comic.cbr','cbr');
  assert.equal(cbr.status,'ok');
  assert.equal(cbr.fields.series,'Dune');

  mode='epub';
  const epub=await readBoundedArchiveEvidence('content://book.epub','epub');
  assert.equal(epub.status,'ok');
  assert.equal(epub.fields.title,'Dune');
  assert.equal(epub.fields.author,'Frank Herbert');
  assert.equal(epub.coverUri,'data:image/jpeg;base64,AQID');
  assert.equal(calls,2);

  mode='blocked';
  const blocked=await readBoundedArchiveEvidence('content://oversized.cbz','cbz');
  assert.equal(blocked.status,'blocked');
  assert.equal(blocked.code,'metadata-too-large');
  assert.match(blocked.reason,/exceeds budget/i);

  mode='timeout';
  await assert.rejects(
    readBoundedArchiveEvidence('content://stalled.cbz','cbz'),
    error=>error.code==='operation-timeout',
    'watchdog timeout must propagate so the scanner can trip its circuit breaker',
  );

  const beforeUnsupported=calls;
  const unsupported=await readBoundedArchiveEvidence('content://book.pdf','pdf');
  assert.equal(unsupported.status,'unsupported');
  assert.equal(calls,beforeUnsupported,'unsupported formats must never be opened');

  platform='ios';
  const ios=await readBoundedArchiveEvidence('file:///book.epub','epub');
  assert.equal(ios.status,'unsupported','until a bounded iOS reader exists, normal preparation must not fall back to whole-file JS parsing');
  assert.equal(calls,beforeUnsupported);

  console.log('PASS: bounded archive adapter parses selected evidence, propagates watchdogs and never falls back to full-file reads');
})().catch(error=>{console.error(error);process.exitCode=1});
