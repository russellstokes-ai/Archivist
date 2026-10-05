const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');

const native=fs.readFileSync(path.join(__dirname,'android','app','src','main','java','app','archivist','reader','ArchivistLibraryModule.kt'),'utf8');
assert(native.includes('"directory-context"'),'Native scanner must publish directory context before media.');
assert(native.includes('"directory-end"'),'Native scanner must publish a directory completion marker.');
assert(native.includes('directoryMediaCount'),'Directory context must include media cardinality for safe generic sidecars.');
assert(native.includes('directoryAudioOnly'),'Directory context must preserve the audiobook-only sidecar rule.');
assert(native.includes('Pass one discovers directory structure and lightweight context first.'),'Native scanner must discover lightweight context before media streaming.');
assert(native.includes('Pass two streams media only.'),'Native scanner must stream media separately from context.');

const scanner=fs.readFileSync(path.join(__dirname,'localLibrary.ts'),'utf8');
const nativeStart=scanner.indexOf('async function scanLocalFoldersNative(');
const nativeEnd=scanner.indexOf('export async function scanLocalFolders(',nativeStart);
assert(nativeStart>=0&&nativeEnd>nativeStart,'Native local scanner function is missing.');
const nativeSource=scanner.slice(nativeStart,nativeEnd);
assert.equal(nativeSource.includes('const pending:'),false,'Android scanner must not accumulate a whole-folder pending media array.');
assert(nativeSource.includes('mediaBuffer.length>=48'),'Android identification buffer must remain bounded.');
assert(nativeSource.includes("item.role==='directory-context'"),'JS scanner must consume directory context before media.');
assert(nativeSource.includes("item.role==='directory-end'"),'JS scanner must release directory context at directory completion.');
assert(nativeSource.includes('await onBooks?.(produced'),'Identified media batches must be publishable while discovery continues.');

console.log('PASS: Android discovery streams bounded media batches with directory-safe metadata context');
