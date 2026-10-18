const fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const root=path.join(__dirname,'android/app/src/main/java/app/archivist/reader');
const app=fs.readFileSync(path.join(root,'MainApplication.kt'),'utf8');
assert.equal((app.match(/add\(ArchivistMetadataPackage\(\)\)/g)||[]).length,1,'Portable metadata bridge must be registered exactly once in the Android app');
const bridge=fs.readFileSync(path.join(root,'ArchivistMetadataModule.kt'),'utf8');
assert.match(bridge,/override fun getName\(\)="ArchivistMetadata"/);for(const method of ['createPortableId','exportRecord','restoreRecord','inspectArtwork'])assert(bridge.includes('@ReactMethod fun '+method));
console.log('PASS: Android app registers the portable metadata bridge and all required methods');
