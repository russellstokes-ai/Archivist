import JSZip from 'jszip';
import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
const limit=64*1024*1024;
function xml(text:string){
 if(text.length>2*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('Unsupported metadata XML');
 let invalid=false;
 const doc=new DOMParser({errorHandler:{warning:()=>{invalid=true;},error:()=>{invalid=true;},fatalError:()=>{invalid=true;}}}).parseFromString(text,'application/xml');
 if(invalid||!doc.documentElement)throw Error('Invalid metadata XML');return doc;
}
/** Creates and verifies an archive. Original replacement requires the native rollback journal. */
export async function createEmbeddedCopy(bytes:Uint8Array,format:'epub'|'cbz',fields:WorkFields):Promise<Uint8Array>{
 if(bytes.length>limit)throw Error('Metadata copy supports files up to 64 MB');
 const zip=await JSZip.loadAsync(bytes),entries=Object.values(zip.files);
 if(entries.length>5000)throw Error('Archive entry limit');
 let expanded=0;
 for(const entry of entries){
  const unsafe=(entry as any).unsafeOriginalName||entry.name;
  if(unsafe!==entry.name||unsafe.startsWith('/')||/[\\\u0000:]/.test(unsafe)||unsafe.split('/').includes('..'))throw Error('Unsafe archive path');
  const size=(entry as any)._data?.uncompressedSize||0;expanded+=size;
  if(size>32*1024*1024||expanded>128*1024*1024)throw Error('Archive expansion limit');
 }
 if(entries.some(x=>/^META-INF\/(?:encryption|signatures)\.xml$/i.test(x.name)))throw Error('Encrypted or signed EPUB cannot be rewritten');
 await JSZip.loadAsync(bytes,{checkCRC32:true});
 let target='ComicInfo.xml',doc:ReturnType<typeof xml>,parent:any;
 const dc='http://purl.org/dc/elements/1.1/';
 if(format==='epub'){
  if(await zip.file('mimetype')?.async('string')!=='application/epub+zip')throw Error('Invalid EPUB mimetype');
  const container=zip.file('META-INF/container.xml');if(!container)throw Error('EPUB container missing');
  const containerDoc=xml(await container.async('string'));
  const roots=containerDoc.getElementsByTagNameNS('*','rootfile');
  if(roots.length!==1)throw Error('Multiple EPUB renditions require manual editing');
  target=roots[0].getAttribute('full-path')||'';const opf=zip.file(target);if(!opf)throw Error('EPUB package missing');
  doc=xml(await opf.async('string'));parent=doc.getElementsByTagNameNS('http://www.idpf.org/2007/opf','metadata')[0]||doc.getElementsByTagName('metadata')[0];if(!parent)throw Error('EPUB metadata missing');
 }else{
  const existing=entries.filter(x=>/(^|\/)ComicInfo\.xml$/i.test(x.name));if(existing.length>1)throw Error('Ambiguous comic metadata');
  if(existing[0])target=existing[0].name;
  doc=xml(existing[0]?await existing[0].async('string'):'<?xml version="1.0" encoding="utf-8"?><ComicInfo/>');parent=doc.documentElement;
  if(parent.nodeName!=='ComicInfo')throw Error('Invalid comic metadata root');
 }
 const mapping:Partial<Record<keyof WorkFields,string>>=format==='epub'?{title:'title',author:'creator',description:'description',publisher:'publisher',language:'language',genre:'subject',publishedYear:'date'}:{title:'Title',author:'Writer',description:'Summary',publisher:'Publisher',language:'LanguageISO',genre:'Genre',series:'Series',seriesNumber:'Number',publishedYear:'Year'};
 for(const [key,tag] of Object.entries(mapping)){
  const value=fields[key as keyof WorkFields];if(typeof value!=='string')continue;
  if(format==='epub'&&key==='title'&&!value.trim())throw Error('EPUB title cannot be empty');
  if(value.length>16384||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw Error('Invalid metadata text');
  const nodes=Array.from(parent.childNodes as ArrayLike<any>).filter(n=>n.nodeType===1&&(format==='epub'?n.namespaceURI===dc&&n.localName===tag:n.nodeName===tag));
  // Preserve creator IDs/refinements and additional contributors in EPUB.
  if(format==='epub'&&nodes.length>1)throw Error('Multiple EPUB metadata values require manual editing');
  if(format==='epub'&&tag==='creator'&&nodes[0]){
   const role=nodes[0].getAttributeNS('http://www.idpf.org/2007/opf','role');
   const id=nodes[0].getAttribute('id');
   const refinements=Array.from(parent.childNodes as ArrayLike<any>).filter(n=>n.nodeType===1&&n.localName==='meta'&&id&&n.getAttribute('refines')==='#'+id&&n.getAttribute('property')==='role');
   if(role&&role!=='aut'||refinements.some(n=>n.textContent.trim()!=='aut'))throw Error('EPUB contributor role requires manual editing');
  }
  if(nodes.length){nodes[0].textContent=value;for(const n of nodes.slice(1))parent.removeChild(n);}
  else if(value){const node=format==='epub'?doc.createElementNS(dc,'dc:'+tag):doc.createElement(tag);node.textContent=value;parent.appendChild(node);}
 }
 const output=new JSZip();if(format==='epub')output.file('mimetype','application/epub+zip',{compression:'STORE'});
 // Retain the loaded compressed entries. Re-inserting decompressed image bytes
 // forced a full recompression of every comic page on every metadata save.
 // JSZip 3 reuses a compressed block when its compression method is unchanged.
 for(const entry of entries){
  if(entry.name===target||format==='epub'&&entry.name==='mimetype')continue;
  const magic=(entry as any)._data?.compression?.magic;
  if(!entry.dir&&magic!=='\x00\x00'&&magic!=='\x08\x00')throw Error('Unsupported ZIP compression');
  entry.options.compression=magic==='\x08\x00'?'DEFLATE':'STORE';
  output.files[entry.name]=entry;
 }
 output.file(target,new XMLSerializer().serializeToString(doc));
 const result=await output.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
 if(result.length>limit)throw Error('Metadata copy exceeds 64 MB');
 const verified=await JSZip.loadAsync(result,{checkCRC32:true});
 if(await verified.file(target)?.async('string')!==new XMLSerializer().serializeToString(doc))throw Error('Metadata copy verification failed');
 for(const entry of entries){if(entry.dir||entry.name===target)continue;const a=await entry.async('uint8array'),b=await verified.file(entry.name)?.async('uint8array');if(!b||a.length!==b.length||a.some((v,i)=>v!==b[i]))throw Error('Archive content changed');}
 return result;
}
