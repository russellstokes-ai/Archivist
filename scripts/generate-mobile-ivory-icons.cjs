// Package the approved, unmodified emblem on the owner's warm ivory background.
const sharp=require('sharp'),path=require('node:path');
const root=path.resolve(__dirname,'..'),background='#F4EBDD';
async function icon(file,size){
 const mark=await sharp(path.join(root,'branding/archivist-emblem-master.png')).resize(Math.round(size*.78),Math.round(size*.78),{fit:'contain'}).png().toBuffer();
 const canvas=sharp({create:{width:size,height:size,channels:4,background}}).composite([{input:mark,gravity:'centre'}]);
 await(file.endsWith('.webp')?canvas.webp({lossless:true}):canvas.png()).toFile(path.join(root,file));
}
(async()=>{
 await icon('mobile/assets/icon.png',1024);
 for(const [density,size]of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192}))
  for(const name of ['ic_launcher','ic_launcher_round'])await icon(`mobile/android/app/src/main/res/mipmap-${density}/${name}.webp`,size);
 console.log('Packaged warm ivory mobile icons; master, adaptive foreground and splash artwork unchanged.');
})().catch(error=>{console.error(error);process.exitCode=1});
