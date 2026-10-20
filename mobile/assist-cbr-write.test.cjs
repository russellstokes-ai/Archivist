const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
const {createRarMetadataCopy}=require('./assistMetadata/rarCopy.ts');
function crc(b){let n=0xffffffff;for(const v of b){n^=v;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;}
function block(type,flags,rest){const h=Buffer.alloc(7+rest.length);h[2]=type;h.writeUInt16LE(flags,3);h.writeUInt16LE(h.length,5);rest.copy(h,7);h.writeUInt16LE(crc(h.subarray(2))&65535);return h;}
function file(name,data,flags=0x8000){const n=Buffer.from(name),rest=Buffer.alloc(25+n.length);rest.writeUInt32LE(data.length);rest.writeUInt32LE(data.length,4);rest[8]=2;rest.writeUInt32LE(crc(data),9);rest[17]=20;rest[18]=0x30;rest.writeUInt16LE(n.length,19);rest.writeUInt32LE(32,21);n.copy(rest,25);return Buffer.concat([block(0x74,flags,rest),data]);}
const signature=Buffer.from('526172211a0700','hex'),main=block(0x73,0,Buffer.alloc(6)),end=block(0x7b,0,Buffer.alloc(0));
(async()=>{const page=file('001.jpg',Buffer.from([255,216,1,2,255,217]));const input=Buffer.concat([signature,main,page,end]),before=Buffer.from(input);
const output=Buffer.from(await createRarMetadataCopy(input,{title:'Comic',publisher:'IPC',publishedYear:'1978'}));assert.deepEqual(input,before);assert(output.includes(page));assert(output.includes(Buffer.from('<Title>Comic</Title>')));assert(output.subarray(0,7).equals(signature));
const repeat=Buffer.from(await createRarMetadataCopy(output,{title:'Updated'}));assert(repeat.includes(page));assert.equal(repeat.toString().split('ComicInfo.xml').length,2);assert(repeat.includes(Buffer.from('<Publisher>IPC</Publisher>')));
const corrupt=Buffer.from(input);corrupt[22]^=1;await assert.rejects(()=>createRarMetadataCopy(corrupt,{}),/CRC/);
await assert.rejects(()=>createRarMetadataCopy(input.subarray(0,input.length-1),{}),/Truncated|end/);
const encrypted=Buffer.concat([signature,block(0x73,0x80,Buffer.alloc(6)),page,end]);await assert.rejects(()=>createRarMetadataCopy(encrypted,{}),/Unsupported/);
const duplicate=Buffer.concat([signature,main,file('ComicInfo.xml',Buffer.from('<ComicInfo/>')),file('ComicInfo.xml',Buffer.from('<ComicInfo/>')),page,end]);await assert.rejects(()=>createRarMetadataCopy(duplicate,{}),/Ambiguous/);
if(process.env.CBR_FIXTURE_OUT){fs.writeFileSync(process.env.CBR_FIXTURE_OUT,repeat);}
console.log('PASS CBR metadata roundtrip, page byte preservation, no conversion, duplicates and corruption rejection');})().catch(e=>{console.error(e);process.exitCode=1});
