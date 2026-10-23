const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
let names=['page10.jpg','page2.png'],closed=[],reads=[];
const bridge={open:async()=>({token:'archive',names}),close:async token=>{closed.push(token)},read:async(token,name)=>{reads.push([token,name]);return 'YWJj'}};
const original=Module._load;Module._load=function(id,...args){return id==='react-native'?{NativeModules:{ArchivistSevenZip:bridge}}:original.call(this,id,...args)};
const {openCb7Pages}=require('./nativeCb7Pages.ts');
(async()=>{
 const book=await openCb7Pages('content://provider/book');assert.equal(book.pageCount,2);
 assert.equal((await book.loadPage(0)).name,'page2.png');assert.equal((await book.loadPage(99)).name,'page10.jpg');
 assert.deepEqual(reads,[['archive','page2.png'],['archive','page10.jpg']]);
 await assert.rejects(book.loadPage(NaN),/Invalid/);await book.dispose();await book.dispose();assert.deepEqual(closed,['archive']);
 await assert.rejects(book.loadPage(0),/closed/);
 for(const invalid of [[],['../cover.jpg'],['page.jpg','page.jpg'],Array(501).fill('a.jpg'),['C:/cover.jpg']]){
  names=invalid;const before=closed.length;await assert.rejects(openCb7Pages('file:///book.cb7'),/invalid archive index/);assert.equal(closed.length,before+1);
 }
 const {comicContainerFromUri,readerFormatFromContainer,comicContainerFromDocument}=require('./comicSourceFormat.ts');
 assert.equal(comicContainerFromUri('content://x/Book%252Ecb7'),'cb7');assert.equal(readerFormatFromContainer('Unknown','cb7'),'Comic');
 assert.equal(await comicContainerFromDocument('content://x/42',async()=> 'cb7'),'cb7');
 const {classifyAsset}=require('./scannerVNext/classify.ts');
 assert.equal(classifyAsset({name:'book.cb7',mimeType:'application/x-7z-compressed'}).state,'candidate');
 assert.equal(classifyAsset({name:'42',signature:Uint8Array.from([55,122,188,175,39,28,0,4])}).container,'cb7');
 assert.equal(classifyAsset({name:'book.cb7',signature:Uint8Array.from([1,2,3,4,5,6])}).state,'ambiguous');
 console.log('PASS: CB7 selected-page adapter, natural ordering, bounded index, cleanup and scanner classification');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{Module._load=original});
