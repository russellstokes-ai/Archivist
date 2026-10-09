const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
assert.ok(fs.existsSync(__dirname+'/scannerVNext/clues.ts'),'Bounded embedded clue reader must exist');
const {parseHeaderClues}=require('./scannerVNext/clues.ts');
function sync(n){return [n>>21&127,n>>14&127,n>>7&127,n&127];}
function id3(fields,version=3){
 const frames=Object.entries(fields).map(([id,text])=>{const payload=Buffer.concat([Buffer.from([3]),Buffer.from(text)]),header=Buffer.alloc(10);header.write(id,0);if(version===4)Buffer.from(sync(payload.length)).copy(header,4);else header.writeUInt32BE(payload.length,4);return Buffer.concat([header,payload]);});
 const body=Buffer.concat(frames);return Buffer.concat([Buffer.from([73,68,51,version,0,0,...sync(body.length)]),body]);
}
for(const version of [3,4]){
 const got=parseHeaderClues(id3({TIT2:'A chapter',TALB:'A novel',TPE1:'An author',TCON:'Fantasy',TRCK:'2/41',TPOS:'1/2'},version),'mp3');
 assert.equal(got.fields.title,'A chapter');assert.equal(got.fields.album,'A novel');assert.equal(got.fields.author,'An author');assert.equal(got.fields.genre,'Fantasy');assert.equal(got.fields.track,2);assert.equal(got.fields.disc,1);assert.equal(got.status,'parsed');assert.equal(got.provenance,'embedded');
}
const unicode=id3({TIT2:'Café 日本語'});assert.equal(parseHeaderClues(unicode,'mp3').fields.title,'Café 日本語');
const utf16=id3({TIT2:'xxxxxxxxxxxx'});utf16[20]=1;Buffer.from([255,254,66,0,111,0,111,0,107,0,0,0]).copy(utf16,21);assert.equal(parseHeaderClues(utf16,'mp3').fields.title,'Book');
const truncated=id3({TIT2:'A novel'}).subarray(0,22);assert.equal(parseHeaderClues(truncated,'mp3').status,'partial');
const oversized=id3({TIT2:'A novel'});oversized.writeUInt32BE(0x7fffffff,14);assert.equal(parseHeaderClues(oversized,'mp3').status,'partial');
const unsync=id3({TIT2:'A novel'});unsync[5]=128;assert.equal(parseHeaderClues(unsync,'mp3').reason,'id3-flags-require-special-reader');
assert.throws(()=>parseHeaderClues(Buffer.alloc(65537),'mp3'),/budget/);
function atom(type,body){const h=Buffer.alloc(8);h.writeUInt32BE(body.length+8);Buffer.from(type,'latin1').copy(h,4);return Buffer.concat([h,body]);}
function data(text){return atom('data',Buffer.concat([Buffer.from([0,0,0,1,0,0,0,0]),Buffer.from(text)]));}
const mp4=Buffer.concat([atom('ftyp',Buffer.from('M4B ')),atom('moov',atom('udta',atom('meta',Buffer.concat([Buffer.alloc(4),atom('ilst',Buffer.concat([atom('\xa9nam',data('A novel')),atom('\xa9ART',data('An author')),atom('\xa9gen',data('Science Fiction'))]))]))))]);
const found=parseHeaderClues(mp4,'m4b');assert.equal(found.fields.title,'A novel');assert.equal(found.fields.author,'An author');assert.equal(found.fields.genre,'Science Fiction');assert.equal(found.status,'parsed');
assert.equal(parseHeaderClues(atom('ftyp',Buffer.from('M4B ')),'m4a').reason,'mp4-index-not-in-header');
assert.equal(parseHeaderClues(Buffer.from([0,0,0,2,109,111,111,118]),'m4b').status,'partial');
assert.equal(parseHeaderClues(Buffer.alloc(64),'flac').status,'unresolved');
console.log('PASS: bounded ID3v2.3/v2.4 and MP4 clues retain provenance and reject oversized, truncated and unsupported metadata without claiming a complete parse');
