const fs=require('fs'),ts=require('typescript'),assert=require('assert/strict'),JSZip=require('jszip');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,p);
const {createEmbeddedCopy}=require('./assistMetadata/embeddedCopy.ts');
(async()=>{
 const z=new JSZip();z.file('page1.jpg',new Uint8Array([1,2,3]));z.file('ComicInfo.xml','<ComicInfo><Title>Old</Title><Custom>Keep</Custom></ComicInfo>');
 const source=await z.generateAsync({type:'uint8array'}),original=source.slice();const result=await createEmbeddedCopy(source,'cbz',{title:'New & <Book>',author:'Writer'}),out=await JSZip.loadAsync(result);
 assert.deepEqual(source,original);assert.deepEqual(await out.file('page1.jpg').async('uint8array'),new Uint8Array([1,2,3]));const text=await out.file('ComicInfo.xml').async('string');assert(text.includes('New &amp; &lt;Book&gt;'));assert(text.includes('<Custom>Keep</Custom>'));
 const epub=new JSZip();epub.file('mimetype','application/epub+zip',{compression:'STORE'});epub.file('META-INF/container.xml','<container><rootfiles><rootfile full-path="OEBPS/package.opf"/></rootfiles></container>');epub.file('OEBPS/package.opf','<package xmlns="http://www.idpf.org/2007/opf"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Old</dc:title><dc:identifier id="uid">original-id</dc:identifier></metadata><manifest/><spine/></package>');epub.file('OEBPS/chapter.xhtml','<html>Original text</html>');
 const e=await createEmbeddedCopy(await epub.generateAsync({type:'uint8array'}),'epub',{title:'New EPUB',author:'Writer'});assert.equal(Buffer.from(e).readUInt16LE(8),0,'mimetype must be first and uncompressed');assert.equal(Buffer.from(e).toString('utf8',30,38),'mimetype');const ez=await JSZip.loadAsync(e);assert((await ez.file('OEBPS/package.opf').async('string')).includes('original-id'));assert.equal(await ez.file('OEBPS/chapter.xhtml').async('string'),'<html>Original text</html>');
 const opf=await epub.file('OEBPS/package.opf').async('string');
 epub.file('OEBPS/package.opf',opf.replace('</metadata>','<dc:creator id="illustrator">Illustrator</dc:creator><meta refines="#illustrator" property="role" scheme="marc:relators">ill</meta></metadata>'));
 await assert.rejects(createEmbeddedCopy(await epub.generateAsync({type:'uint8array'}),'epub',{author:'Writer'}),/contributor role/i,'EPUB3 illustrator credit must not be rewritten as author');
 epub.file('OEBPS/package.opf',opf);
 await assert.rejects(createEmbeddedCopy(await epub.generateAsync({type:'uint8array'}),'epub',{title:''}),/title/i,'Export must retain a valid EPUB title');
 epub.file('META-INF/encryption.xml','<encryption/>');await assert.rejects(createEmbeddedCopy(await epub.generateAsync({type:'uint8array'}),'epub',{}),/Encrypted/);
 z.file('ComicInfo.xml','<!DOCTYPE ComicInfo [<!ENTITY x SYSTEM "file:///secret">]><ComicInfo/>');await assert.rejects(createEmbeddedCopy(await z.generateAsync({type:'uint8array'}),'cbz',{}),/Unsupported/);
 console.log('PASS: verified EPUB/CBZ copies preserve source bytes, chapters/images and IDs; escaped metadata, stored mimetype, encrypted/XML rejection');
})().catch(e=>{console.error(e);process.exitCode=1});
