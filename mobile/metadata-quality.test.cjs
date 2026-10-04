const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,file);

const {
  applyResolvedLocalMetadata,
  inferLocalBookMetadata,
  isGenericMediaTitle,
  sanitizeDiscoveredMetadata,
}=require('./libraryIntelligence.ts');
const {resolveMetadataCandidates}=require('./metadataResolution.ts');

const genrePath=inferLocalBookMetadata(
  'content://root/document/primary:Books%2FScience%20Fiction%2FFrank%20Herbert%2FDune%2FDune%20Messiah.epub',
  'EPUB',
);
assert.equal(genrePath.title,'Dune Messiah');
assert.equal(genrePath.author,'Frank Herbert');
assert.equal(genrePath.series,'Dune');
assert.equal(genrePath.genre,'Science Fiction');
assert.equal(genrePath.needsReview,false);

const indexedAudio=inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%20Saga%2F01%20-%20Dune%2FPart%2036.mp3',
  'Audio',
  {siblingMediaCount:36},
);
assert.equal(indexedAudio.title,'Dune');
assert.equal(indexedAudio.author,'Frank Herbert');
assert.equal(indexedAudio.series,'Dune Saga');
assert.equal(indexedAudio.seriesNumber,1);
assert.equal(indexedAudio.needsReview,false);

const numberedTrack=inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FAndy%20Weir%2FProject%20Hail%20Mary%2F01%20-%20Opening.mp3',
  'Audio',
  {siblingMediaCount:24},
);
assert.equal(numberedTrack.title,'Project Hail Mary');
assert.equal(numberedTrack.author,'Andy Weir');
assert.equal(numberedTrack.needsReview,false);

assert.equal(isGenericMediaTitle('Part 36','Audio',36),true);
assert.equal(isGenericMediaTitle('Track 03','Audio',36),true);
assert.equal(isGenericMediaTitle('01 - Opening','Audio',36),true);
assert.equal(isGenericMediaTitle('Dune','Audio',36),false);

const cleaned=sanitizeDiscoveredMetadata(
  {title:'Part 36',author:'Unknown Artist',genre:'Unclassified',series:'Unknown'},
  'Audio',
  'Dune',
  36,
);
assert.equal(cleaned.title,undefined);
assert.equal(cleaned.author,undefined);
assert.equal(cleaned.genre,undefined);
assert.equal(cleaned.series,undefined);

const base=inferLocalBookMetadata(
  'content://root/document/primary:Audiobooks%2FFrank%20Herbert%2FDune%2FPart%2036.mp3',
  'Audio',
  {siblingMediaCount:36},
);
const embedded=sanitizeDiscoveredMetadata(
  {title:'Part 36',author:'Frank Herbert',genre:'Sci-Fi'},
  'Audio',
  base.title,
  36,
);
const resolved=resolveMetadataCandidates([
  {source:'path',confidence:base.confidence,fields:{title:base.title,author:base.author,series:base.series,seriesNumber:base.seriesNumber,genre:base.genre}},
  {source:'embedded',confidence:'high',fields:embedded},
]);
const published=applyResolvedLocalMetadata(base,resolved);
assert.equal(published.title,'Dune');
assert.equal(published.author,'Frank Herbert');
assert.equal(published.genre,'Science Fiction');
assert.equal(published.needsReview,false);

const scanSource=fs.readFileSync(__dirname+'/localLibrary.ts','utf8');
assert.match(scanSource,/inferLocalBookMetadata\(child, format, \{siblingMediaCount:/,'scan must provide sibling context for multi-track audiobook identity');
assert.match(scanSource,/sanitizeDiscoveredMetadata\(embeddedRawFields, format, identity\.title/,'scan must reject low-quality embedded placeholders');
assert.match(scanSource,/identity = applyResolvedLocalMetadata\(identity, resolvedMetadata\)/,'scan must publish the resolver result rather than only recording provenance');

const genreOnly=inferLocalBookMetadata(
  'content://root/document/primary:Books%2FScience%20Fiction%2FDune%2FDune%20Messiah.epub',
  'EPUB',
);
assert.equal(genreOnly.genre,'Science Fiction');
assert.notEqual(genreOnly.author,'Science Fiction');

console.log('PASS: Sprint 6 rejects track placeholders, uses folder hierarchy, infers safe genres and publishes resolved identity');
