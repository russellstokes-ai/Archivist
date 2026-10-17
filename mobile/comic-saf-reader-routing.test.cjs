const assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(mod,p)=>mod._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,p);
const {comicContainerFromUri,effectiveLocalReaderFormat}=require('./comicSourceFormat.ts');
for(const [uri,type] of [
 ['content://com.android.externalstorage.documents/document/primary%3AComics%2F2000AD%20Annual%201978.CBR','cbr'],
 ['content://provider/document/path%252Fissue%252Ecbz','cbz'],
 ['content://documents/tree/comics/1960.CbT','cbt'],
 ['content://provider/document/raw%3A%2Farchive%2Fannual.PDF','pdf'],
 ['file:///storage/emulated/0/Read/Novel.EPUB','epub'],
 ['content://provider/documents/311222','unknown'],
]){
 assert.equal(comicContainerFromUri(uri),type,uri);
}
assert.equal(effectiveLocalReaderFormat('Unsupported','content://example/document%2F2000AD.cbr'),'Comic');
assert.equal(effectiveLocalReaderFormat('Unsupported','content://example/document%2Fcomic.pdf'),'PDF');
assert.equal(effectiveLocalReaderFormat('Comic','file:///comics/issue.pdf'),'PDF');
assert.equal(effectiveLocalReaderFormat('Comic','content://provider/documents/311222'),'Comic');
assert.equal(effectiveLocalReaderFormat('Audio','content://example/document%2Ffake.cbz'),'Audio');
assert.equal(effectiveLocalReaderFormat('EPUB','file:///book.epub'),'EPUB');
assert.equal(effectiveLocalReaderFormat('Unsupported','content://provider/document/311222'),'Unsupported',
 'Opaque unrecognised types must not be silently published/claimed supported');
const original=fs.readFileSync(__dirname+'/localReader.ts','utf8');
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
assert(original.includes('comicContainerFromUri(uri)')&&original.includes('tarComicDocument(uri,title,initialPage)'),
 'Native comic archive routing must use decoded SAF identity');
assert(app.includes('effectiveLocalReaderFormat('),
 'User selected reader must route declared Unsupported comic file to actual decoder');
console.log('PASS: encoded/double-encoded SAF CBR/CBZ/CBT, comic PDFs, reader-only fallback and no scanner publication changes');
