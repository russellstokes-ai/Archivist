const assert=require('node:assert/strict');const fs=require('node:fs');const Module=require('node:module');const ts=require('typescript');
const load=Module._load;Module._load=function(req,p,i){if(req==='expo-file-system/legacy')return{EncodingType:{Base64:'base64'},getInfoAsync:async()=>({exists:true,size:1}),readAsStringAsync:async()=>''};return load.call(this,req,p,i)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {parseTarImages}=require('./archiveReader.ts');
function entry(name,bytes,declared=bytes.length){const h=Buffer.alloc(512);Buffer.from(name).copy(h);Buffer.from(declared.toString(8).padStart(11,'0')+'\0').copy(h,124);h.fill(32,148,156);h[156]=48;Buffer.from('ustar\0').copy(h,257);let sum=0;for(const b of h)sum+=b;Buffer.from(sum.toString(8).padStart(6,'0')+'\0 ').copy(h,148);return Buffer.concat([h,Buffer.from(bytes),Buffer.alloc((512-(bytes.length%512))%512)]);}
let tar=Buffer.concat([entry('010.jpg',[4,5]),entry('002.png',[1,2,3]),Buffer.alloc(1024)]);let pages=parseTarImages(new Uint8Array(tar));assert.equal(pages.length,2);assert.equal(pages[0].name,'002.png');assert.equal(pages[0].base64,'AQID');
const huge=Buffer.concat([entry('huge.jpg',[],70*1024*1024),Buffer.alloc(1024)]);assert.throws(()=>parseTarImages(new Uint8Array(huge)),/64 MB safety limit/);
console.log('archive-reader.test.cjs passed');
