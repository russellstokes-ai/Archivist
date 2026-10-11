const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const names=['book-loader','books-stack','headphones','pause-play','waveform','achievement-badge','crown','trophy','level-up-confetti','firework-burst'];
for(const name of names){
 const doc=JSON.parse(fs.readFileSync(path.join(__dirname,'assets/motion',name+'.json'),'utf8'));
 assert.equal(doc.fr,30);assert.equal(doc.w,256);assert.equal(doc.h,256);assert.deepEqual(doc.assets,[]);
 assert.ok(doc.layers.length);assert.ok(doc.layers.every(layer=>layer.ty===4&&Array.isArray(layer.shapes)&&layer.shapes.length>=2));
 assert.ok(doc.layers.every(layer=>layer.ks&&layer.ks.s&&layer.ks.o&&layer.ks.p));
}
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const native=fs.readFileSync(__dirname+'/MotionGlyph.tsx','utf8');
assert.ok(app.includes('<MotionGlyph name="book-loader"'),'Scanning indicator must use Lottie without changing scan core');
assert.ok(app.includes('<MotionTransportIcon playing={isPlaying}'),'Player must follow real playback state');
assert.ok(app.includes('name="waveform" size={22} active={appActive&&isPlaying}'),'Waveform must stop when not playing/offscreen');
assert.ok(native.includes('if(reduceMotion){ref.current?.reset();ref.current?.pause();return;}'),'Reduced Motion must stop decorative loops');
assert.ok(native.includes('autoPlay={active&&!reduceMotion}')&&native.includes('loop={loop&&!reduceMotion}'),'Motion must be controlled');
assert.equal(fs.existsSync(path.join(__dirname,'assets/motion/open-book.json')),false);
console.log('PASS: ten local Lottie sources, scanner/player/award hooks and Reduced Motion');
