import {DOMParser} from '@xmldom/xmldom';

type Entry={name:string;dir:boolean;async:(type:string)=>Promise<string>};
type Archive={files:Record<string,Entry>};
const maxText=4*1024*1024,maxOutput=24*1024*1024;
const allowed=new Set('p div section article span h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code em strong b i u s sub sup br hr table thead tbody tfoot tr td th caption dl dt dd figure figcaption a img ruby rt rp'.split(' '));
const discarded=new Set('script style head iframe frame frameset object embed svg math form input button textarea select option link meta base template noscript audio video source canvas'.split(' '));
const esc=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function localName(node:Node){return ((node as Element).localName||node.nodeName).split(':').pop()!.toLowerCase();}
function parse(raw:string,html=false){
  if(raw.length>maxText)throw Error('EPUB section exceeds the safe reader size limit.');
  if(/<!\s*(DOCTYPE|ENTITY)/i.test(raw)){
    // A plain HTML doctype is harmless; entity/internal/external declarations are not.
    raw=raw.replace(/<!DOCTYPE\s+[^<>\[\]]*>/ig,'');
    if(/<!\s*(DOCTYPE|ENTITY)/i.test(raw))throw Error('EPUB DOCTYPE/entity declarations are unsupported.');
  }
  let failed=false;
  const document=new DOMParser({errorHandler:{warning:()=>{},error:()=>{failed=true},fatalError:()=>{failed=true}}}).parseFromString(raw,html?'text/html':'application/xml');
  if(!document?.documentElement||(!html&&failed))throw Error('EPUB package XML is invalid.');
  return document;
}
function elements(doc:Document,name:string){return Array.from(doc.getElementsByTagName('*')).filter(n=>localName(n)===name);}
function resolvePath(base:string,href:string){
  let decoded:string;try{decoded=decodeURIComponent(href.split('#')[0]);}catch{throw Error('Invalid EPUB resource path.');}
  if(!decoded||/^[a-z][a-z0-9+.-]*:/i.test(decoded)||decoded.startsWith('/')||/[\\\x00-\x1f?]/.test(decoded))throw Error('Invalid EPUB resource path.');
  const parts=base.split('/').slice(0,-1);
  for(const part of decoded.split('/')){if(!part||part==='.')continue;if(part==='..'){if(!parts.length)throw Error('EPUB path escapes its archive.');parts.pop();}else parts.push(part);}
  return parts.join('/');
}
async function text(zip:Archive,name:string){const entry=zip.files[name];if(!entry||entry.dir)throw Error('EPUB content is missing: '+name);const raw=await entry.async('text');if(raw.length>maxText)throw Error('EPUB section exceeds the safe reader size limit.');return raw;}

/** Reconstruct content from a strict element/attribute allowlist, never serialize untrusted markup. */
export async function buildEpubContent(zip:Archive):Promise<string>{
  const container=parse(await text(zip,'META-INF/container.xml'));
  const root=elements(container,'rootfile')[0]?.getAttribute('full-path');if(!root)throw Error('EPUB package path is missing.');
  const packagePath=resolvePath('',root);const opf=parse(await text(zip,packagePath));
  const manifest=new Map(elements(opf,'item').map(el=>[el.getAttribute('id'),el]));
  const resourceTypes=new Map<string,string>();
  for(const item of manifest.values()){const href=item.getAttribute('href');if(href)resourceTypes.set(resolvePath(packagePath,href),item.getAttribute('media-type')||'');}
  const spine=elements(opf,'itemref');if(!spine.length)throw Error('EPUB reading order is missing.');
  const output:string[]=[];let total=0,nodes=0;
  const append=(s:string)=>{total+=s.length;if(total>maxOutput)throw Error('EPUB exceeds the safe reader size limit; no chapters were silently omitted.');output.push(s);};
  async function render(node:Node,base:string,depth:number):Promise<void>{
    if(++nodes>200000||depth>100)throw Error('EPUB content is too complex to render safely.');
    if(node.nodeType===3||node.nodeType===4){append(esc(node.nodeValue||''));return;}
    if(node.nodeType!==1)return;
    const tag=localName(node);
    if(tag==='math')throw Error('EPUB MathML content is unsupported; the reader will not omit it silently.');
    if(tag==='svg'){
      const images=Array.from((node as Element).getElementsByTagName('*'));
      if(images.length===1&&localName(images[0])==='image'){await render(images[0],base,depth+1);return;}
      throw Error('EPUB vector SVG content is unsupported; the reader will not omit it silently.');
    }
    if(discarded.has(tag))return;
    const el=node as Element;
    if(tag!=='image'&&!allowed.has(tag)){for(const child of Array.from(node.childNodes))await render(child,base,depth+1);return;}
    if(tag==='img'||tag==='image'){
      const href=el.getAttribute('src')||el.getAttribute('href')||el.getAttribute('xlink:href');if(!href)return;
      let name:string;try{name=resolvePath(base,href);}catch{return;}
      const entry=zip.files[name];if(!entry||entry.dir)throw Error('EPUB image is missing: '+name);
      const ext=name.split('.').pop()?.toLowerCase();const mime=resourceTypes.get(name)||(ext==='png'?'image/png':ext==='jpg'||ext==='jpeg'?'image/jpeg':ext==='gif'?'image/gif':ext==='webp'?'image/webp':'');
      if(!['image/png','image/jpeg','image/gif','image/webp'].includes(mime))throw Error('EPUB image format is unsupported: '+name);
      const data=await entry.async('base64');if(data.length>8*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))throw Error('EPUB image exceeds the safe reader limit or is invalid.');
      const valid=mime==='image/png'?data.startsWith('iVBORw0KGgo'):mime==='image/jpeg'?data.startsWith('/9j/'):mime==='image/gif'?data.startsWith('R0lGOD'):data.startsWith('UklGR');
      if(!valid)throw Error('EPUB image type does not match its content.');
      append('<img src="data:'+mime+';base64,'+data+'" alt="'+esc(el.getAttribute('alt')||'')+'">');return;
    }
    let attrs='';for(const key of ['title','lang','dir','colspan','rowspan']){const value=el.getAttribute(key);if(value&&((key!=='colspan'&&key!=='rowspan')||/^\d{1,3}$/.test(value)))attrs+=' '+key+'="'+esc(value)+'"';}
    append('<'+tag+attrs+'>');for(const child of Array.from(node.childNodes))await render(child,base,depth+1);if(tag!=='br'&&tag!=='hr')append('</'+tag+'>');
  }
  for(const ref of spine){
    const item=manifest.get(ref.getAttribute('idref'));if(!item)throw Error('EPUB spine references a missing manifest item.');
    const type=item.getAttribute('media-type');if(type!=='application/xhtml+xml'&&type!=='text/html')throw Error('EPUB spine content type is unsupported: '+type);
    const name=resolvePath(packagePath,item.getAttribute('href')||'');
    const document=parse(await text(zip,name),true);append('<section>');
    const body=elements(document,'body')[0]||document.documentElement;
    await render(body,name,0);append('</section>');
    await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  return output.join('');
}
