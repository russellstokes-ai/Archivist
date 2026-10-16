// Deterministic packaging of Russell's approved emblem; no artwork alterations.
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const master = path.join(root, 'branding/archivist-emblem-master.png');
async function asset(file, size, fraction = 1, opaque = false) {
  const inset = Math.round(size * fraction);
  const mark = await sharp(master).resize(inset, inset, {fit:'contain'}).png().toBuffer();
  const canvas = sharp({create:{width:size,height:size,channels:4,background:opaque ? '#072632' : '#00000000'}})
    .composite([{input:mark,gravity:'centre'}]);
  const target = path.join(root,file);
  await (file.endsWith('.webp') ? canvas.webp({lossless:true}) : canvas.png()).toFile(target);
}
(async()=>{
  for (const file of ['archivist/logo.png','web/assets/archivist-primary-logo.png','archivist/app/web/assets/archivist-primary-logo.png']) await asset(file,512);
  for (const file of ['web/assets/archivist-app-icon.png','archivist/app/web/assets/archivist-app-icon.png']) await asset(file,512);
  await asset('archivist/icon.png',256);
  await asset('mobile/assets/icon.png',1024,0.78,true);
  await asset('mobile/assets/adaptive-icon.png',1024,0.60);
  await asset('mobile/assets/splash-icon.png',1024);
  for (const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})) {
    for (const name of ['ic_launcher','ic_launcher_round']) await asset(`mobile/android/app/src/main/res/mipmap-${density}/${name}.webp`,size,0.78,true);
    await asset(`mobile/android/app/src/main/res/drawable-${density}/splashscreen_logo.png`,size*6);
  }
  console.log('Replaced all 22 existing brand images; generated adaptive and splash sources.');
})().catch(e=>{console.error(e);process.exit(1)});
