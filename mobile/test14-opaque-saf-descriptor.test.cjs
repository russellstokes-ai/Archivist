const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {comicContainerFromDocument,comicContainerFromUri,readerFormatFromContainer}=require('./comicSourceFormat.ts');
(async()=>{
 const opaque='content://provider/document/41122';assert.equal(comicContainerFromUri(opaque),'unknown');
 for(const [kind,format] of [['cbr','Comic'],['cbz','Comic'],['cbt','Comic'],['pdf','PDF'],['epub','EPUB']]){
   assert.equal(readerFormatFromContainer('Unsupported',await comicContainerFromDocument(opaque,async()=>kind)),format);
 }
 assert.equal(readerFormatFromContainer('Comic','pdf'),'PDF');
 for(const fake of ['application/zip',null,undefined,'file.cbz',{},'rar']){
   assert.equal(await comicContainerFromDocument(opaque,async()=>fake),'unknown');
 }
 assert.equal(await comicContainerFromDocument(opaque,async()=>{throw Error('revoked');}),'unknown');
 assert.equal(await comicContainerFromDocument(opaque,()=>new Promise(()=>{}),1),'unknown');
 assert.equal(await comicContainerFromDocument('content://example/document%2Fannual.CBR',async()=>{throw Error('unexpected query');}),'cbr');
 const native=fs.readFileSync(__dirname+'/android/app/src/main/java/app/archivist/reader/ArchivistArchiveModule.kt','utf8');
 assert(native.includes('fun readerContainer(uri: String, promise: Promise)'));
 assert(native.includes('resolver.query(parsed, arrayOf(OpenableColumns.DISPLAY_NAME)'));
 assert(native.includes('resolver.getType(parsed)'));
 assert(native.includes('thread(name = "archivist-reader-descriptor")'));
 assert(native.includes('else -> "unknown" // generic ZIP/RAR and octet-stream remain ambiguous'));
 assert(!native.includes('promise.resolve(name)'), 'Never return user filenames to JS');
 console.log('PASS: bounded opaque SAF descriptor, strongly typed enum and no private filenames');
})().catch(e=>{console.error(e);process.exitCode=1;});