const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {readMp4IndexClues}=require('./scannerVNext/seekClues.ts');
function atom(type,data){const out=Buffer.alloc(8+data.length);out.writeUInt32BE(out.length);out.write(type,4,4,'latin1');data.copy(out,8);return out;}
const data=atom('data',Buffer.concat([Buffer.from([0,0,0,1,0,0,0,0]),Buffer.from('Generated Late Title')]));
const moov=atom('moov',atom('udta',atom('meta',Buffer.concat([Buffer.alloc(4),atom('ilst',atom('\xa9nam',data))]))));
const ftyp=atom('ftyp',Buffer.from('M4B '));const mdat=atom('mdat',Buffer.alloc(1024*1024));const media=Buffer.concat([ftyp,mdat,moov]);
(async()=>{
 let consumed=0;const reads=[];const reader={async readRange(offset,length){reads.push({offset,length});consumed+=length;return {bytes:media.subarray(offset,offset+length),budgetReached:offset+length<=media.length};}};
 const result=await readMp4IndexClues(media.length,reader);assert.equal(result.clues.fields.title,'Generated Late Title');assert.equal(result.clues.status,'parsed');assert.equal(result.bytesRead,consumed);assert.ok(consumed<1024);assert.ok(reads.every(r=>r.length<=65536));assert.ok(!reads.some(r=>r.offset>ftyp.length+16&&r.offset<ftyp.length+mdat.length));
 const bounded=await readMp4IndexClues(media.length,reader,{maxBytes:16});assert.equal(bounded.clues.status,'unresolved');assert.equal(bounded.clues.reason,'source-read-budget');assert.ok(bounded.bytesRead<=16);
 const corrupt=Buffer.alloc(16);corrupt.writeUInt32BE(4);assert.equal((await readMp4IndexClues(corrupt.length,{async readRange(o,n){return {bytes:corrupt.subarray(o,o+n),budgetReached:true};}})).clues.reason,'invalid-mp4-atom');
 const stop=new AbortController();await assert.rejects(()=>readMp4IndexClues(media.length,{async readRange(){stop.abort();return {bytes:media.subarray(0,16),budgetReached:true};}},{signal:stop.signal}),/cancel/i);
 await assert.rejects(()=>readMp4IndexClues(media.length,{async readRange(){return {bytes:new Uint8Array(65537),budgetReached:true};}}),/range|budget/i);
 let failed=await readMp4IndexClues(media.length,{async readRange(){throw Error('Nonseekable provider');}});assert.equal(failed.clues.status,'unresolved');assert.match(failed.clues.reason,/seek-read-failed/);
 assert.equal((await readMp4IndexClues(null,reader)).clues.reason,'unknown-file-size');
 console.log('PASS: late MP4 index clues skip media, enforce source/read/atom bounds, retain corrupt and nonseekable works and reject cancelled results');
})().catch(e=>{console.error(e);process.exitCode=1;});
