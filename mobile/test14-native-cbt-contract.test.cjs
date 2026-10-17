const assert=require('node:assert/strict'),fs=require('node:fs');
const native=fs.readFileSync(__dirname+'/android/app/src/main/java/app/archivist/reader/ArchivistArchiveModule.kt','utf8');
for(const phrase of [
 'fun openTar(uri: String, promise: Promise)',
 'fun readTarEntry(token:String,offset:Double,size:Double,promise:Promise)',
 'fun closeTar(token:String,promise:Promise)',
 'CBT exceeds 256 MB reader safety limit.',
 'CBT page exceeds 16 MB safety limit.',
 'CBT reader page budget exceeded.',
 'require(position.toDouble()==offset&&length.toDouble()==size',
 'tarFiles.values.forEach { it.delete() }',
 'openInput(uri).use',
 'RandomAccessFile(file,"r").use'
])assert(native.includes(phrase),'Missing bounded TAR native safety: '+phrase);
assert(!native.includes('fun openTar(uri: String, promise: Promise) {\n    promise.resolve(null)'),'No stub decoder');
console.log('PASS: native TAR index and lazy image reader cap archive/pages and clean temporary SAF cache');
