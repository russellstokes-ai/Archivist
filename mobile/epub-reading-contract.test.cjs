const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {stripTypeScriptTypes}=require('node:module');
const {DOMParser}=require('@xmldom/xmldom');
const src=fs.readFileSync(path.join(__dirname,'epubContent.ts'),'utf8');
const js=stripTypeScriptTypes(src,{mode:'transform'})
 .replace(/^import\s+\{DOMParser\}\s+from\s+['"]@xmldom\/xmldom['"];?/m,'')
 .replace(/^export\s+/gm,'');
const buildEpubContent=new Function('DOMParser',js+'\nreturn buildEpubContent;')(DOMParser);
const entry=(name,data)=>({name,dir:false,async:async(kind)=>kind==='text'?data:Buffer.from(data).toString('base64')});
const fixture=chapter=>{const files=Object.create(null);for(const [name,data] of Object.entries({
 'META-INF/container.xml':'<?xml version="1.0"?><container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>',
 'OPS/book.opf':'<?xml version="1.0"?><package><manifest><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>',
 'OPS/chapter.xhtml':chapter
 }))files[name]=entry(name,data);return {files};};
(async()=>{
 const content=await buildEpubContent(fixture('<html><body><h1>First chapter</h1><p>Safe &amp; ready</p><script>unsafe()</script></body></html>'));
 assert.match(content,/First chapter/);assert.match(content,/Safe &amp; ready/);assert(!content.includes('unsafe()'));
 await assert.rejects(buildEpubContent(fixture('<html><body><math><mi>x</mi></math></body></html>')),/MathML.*unsupported/);
 await assert.rejects(buildEpubContent(fixture('<html><body><svg><rect/></svg></body></html>')),/SVG content is unsupported/);
 const app=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8'),reader=fs.readFileSync(path.join(__dirname,'localReader.ts'),'utf8');
 assert(reader.includes("format === 'EPUB'"));assert(reader.includes("message.command==='goto'"));
 assert(reader.includes("post({type:'reader-ready'"));assert(app.includes('setLocalReadingProgress(current=>'));
 console.log('PASS: real EPUB package/spine/sanitizer fixture, reader routing, paging and saved position source contracts; physical Fold check still open');
})().catch(e=>{console.error(e);process.exitCode=1});
