const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');

const assetRaw=fs.readFileSync(__dirname+'/assets/motion/book-loader.json','utf8');
const asset=JSON.parse(assetRaw);
const sha=crypto.createHash('sha256').update(assetRaw).digest('hex');
assert.equal(sha,'3343c116823f2aa6cfce375af417630353b42fc06bab63a333b60e4769ac84c6','Supplied Book Loader must be preserved byte-for-byte');
assert.deepEqual([asset.w,asset.h,asset.fr,asset.ip,asset.op],[300,300,60,0,240],'Uploaded animation metadata changed');
assert.equal(asset.nm,'book pagination');
const loader=fs.readFileSync(__dirname+'/ArchivistBookLoader.tsx','utf8');
assert.match(loader,/BOOK_LOADER_ARTWORK_SCALE=1\.35/,'Transparent margins require larger visible artwork');
for(const pair of ["inline:52","compact:64","standard:76","reader:144","startup:96"])assert(loader.includes(pair),'Missing explicit loader size '+pair);
assert.match(loader,/reduceMotion/);
assert.match(loader,/autoPlay=\{!reduceMotion\} loop=\{!reduceMotion\}/,'Reduced Motion must pause the approved book illustration');
assert.match(loader,/progress=\{reduceMotion\?0\.5:undefined\}/,'Keep a static approved book frame, not a generic Unicode placeholder');
assert(!loader.includes('▤'),'No substitute decorative glyphs permitted');
assert.match(loader,/require\('\.\/assets\/motion\/book-loader\.json'\)/);
assert.match(loader,/accessibilityRole="progressbar"/);
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const pdf=fs.readFileSync(__dirname+'/LocalPdfReader.tsx','utf8');
assert.equal((app.match(/<ArchivistBookLoader/g)||[]).length,8,'Every app spinner must use the Book Loader');
assert.equal((pdf.match(/<ArchivistBookLoader/g)||[]).length,1,'Native PDF spinner must use the Book Loader');
assert(!app.includes('ActivityIndicator') && !pdf.includes('ActivityIndicator'),'Circular ActivityIndicator remains');
for(const label of ['Scanning local library','Loading audio playback','Opening local reader','Opening server reader','Loading reader statistics','Checking duplicate files','Opening Archivist library','Rendering PDF page']){
 assert((app+pdf).includes('label="'+label+'"'),'Missing loading scenario: '+label);
}
assert.match(app,/reduceMotion=\{reduceMotion\} onPosition=/,'PDF loader must honour reduced motion');
console.log('PASS: exact supplied Book Loader, enlarged artwork, nine loading states, reduced motion, and no circular spinners');
