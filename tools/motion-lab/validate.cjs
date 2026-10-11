const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../mobile/assets/motion');
const files=['book-loader','books-stack','headphones','pause-play','waveform','achievement-badge','crown','trophy','level-up-confetti','firework-burst'];
for(const name of files){
 const doc=JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
 assert.match(doc.v,/^5\./);
 assert.equal(doc.fr,30);assert.equal(doc.w,256);assert.equal(doc.h,256);
 assert.equal(doc.layers.length>0,true);assert.deepEqual(doc.assets,[]);
 for(const layer of doc.layers){assert.equal(layer.ty,4);assert.equal(layer.ip,0);assert.equal(layer.op,90);assert.ok(Array.isArray(layer.shapes));assert.ok(layer.ks.s && layer.ks.p && layer.ks.o);}
}
assert.equal(fs.existsSync(path.join(dir,'open-book.json')),false,'Rejected Open Book must not ship');
console.log('PASS: '+files.length+' self-contained local Lottie assets');
