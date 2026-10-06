const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

const app=read('App.tsx');
const local=read('localLibrary.ts');
const sync=read('metadataSync.ts');
const native=read('android/app/src/main/java/app/archivist/reader/ArchivistLibraryModule.kt');
const manifest=read('android/app/src/main/AndroidManifest.xml');

const pipelineStart=app.indexOf('async function enrichPublishedLocalLibrary');
const pipelineEnd=app.indexOf('async function enrichPublishedLocalEmbeddedMetadata',pipelineStart);
if(pipelineStart<0||pipelineEnd<0)throw new Error('Unable to isolate normal library preparation pipeline');
const normalPipeline=app.slice(pipelineStart,pipelineEnd);

if(normalPipeline.includes('enrichPublishedLocalEmbeddedMetadata('))throw new Error('Normal Scan/Prepare must not deep-read embedded metadata');
if(normalPipeline.includes('enrichPublishedLocalCovers('))throw new Error('Normal Scan/Prepare must not extract embedded covers');
if(!normalPipeline.includes('enrichPublishedLocalBookMetadata('))throw new Error('Normal preparation must retain online book enrichment');
if(!normalPipeline.includes('applyLocalPublicationState('))throw new Error('Normal preparation must retain the publication gate');

for(const marker of [
  'async function deepScanLocalFile',
  'enrichLocalEmbeddedMetadata([target]',
  'itemTimeoutMs:7000',
  'maxConsecutiveTimeouts:1',
  'concurrency:1',
  'Deep scan file',
  "'Deep scan'",
]){
  if(!app.includes(marker))throw new Error('Missing Deep Scan contract: '+marker);
}

for(const marker of [
  'MediaStore.getMediaUri(context, documentUri)',
  'MediaStore.MediaColumns.TITLE',
  'MediaStore.Audio.AudioColumns.ALBUM',
  'MediaStore.Audio.AudioColumns.ARTIST',
  'session.cancellationSignal',
]){
  if(!native.includes(marker))throw new Error('Missing cheap Android media-detail contract: '+marker);
}
if(manifest.includes('android.permission.READ_MEDIA_AUDIO'))throw new Error('Shallow scan must not require broad READ_MEDIA_AUDIO permission');

for(const marker of ['quickTitle?:string','quickAlbum?:string','quickArtist?:string','workTitleHint:quickAlbum||undefined']){
  if(!local.includes(marker))throw new Error('Native quick details are not consumed: '+marker);
}
if(!sync.includes("book.workTitleHint||book.embeddedMetadata?.workTitle"))throw new Error('Root audiobooks must group from indexed album identity');

console.log('PASS: Test 14 uses shallow normal preparation and explicit bounded per-file Deep Scan');
