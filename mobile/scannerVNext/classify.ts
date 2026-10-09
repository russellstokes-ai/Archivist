import type {AssetKind,Disposition} from './types';

const audio = new Set(['mp3','m4a','m4b','aac','flac','opus','ogg','wav','wma']);
const comic = new Set(['cbz','cbr','cbt']);
const unreadableBooks = new Set(['mobi','azw','azw3','fb2','lit']);
const artwork = new Set(['jpg','jpeg','png','gif','webp','heic']);
const sidecar = new Set(['opf','xml','nfo','cue','json','txt']);
const genericMime = new Set(['','application/octet-stream','binary/octet-stream']);
const zipMime = new Set(['application/zip','application/x-zip-compressed']);
const rarMime = new Set(['application/x-rar-compressed','application/vnd.rar']);

export function classifyAsset(input:{name:string;mimeType?:string;signature?:Uint8Array}):Disposition {
  const ext = input.name.toLowerCase().match(/\.([^./\\]+)$/)?.[1] || '';
  const mime = (input.mimeType || '').split(';')[0].trim().toLowerCase();
  let kind:AssetKind='unknown';
  let state:Disposition['state']='unsupported';
  let reason='unsupported-format';
  if(audio.has(ext)){kind='audio';state='candidate';reason='audio-content-unconfirmed';}
  else if(ext==='epub'){kind='ebook';state='candidate';reason='epub-candidate';}
  else if(comic.has(ext)){kind='comic';state='candidate';reason='comic-archive-candidate';}
  else if(ext==='pdf'){kind='document';state='ambiguous';reason='pdf-needs-content-evidence';}
  else if(ext==='zip'){kind='archive';state='ambiguous';reason='zip-needs-content-evidence';}
  else if(unreadableBooks.has(ext)){kind='ebook';reason='ebook-reader-unsupported';}
  else if(ext==='cb7'){kind='comic';reason='comic-reader-unsupported';}
  else if(artwork.has(ext)){kind='artwork';state='candidate';reason='local-artwork-candidate';}
  else if(sidecar.has(ext)){kind='sidecar';state='candidate';reason='local-clue-candidate';}
  else if(!ext){
    if(mime.startsWith('audio/')){kind='audio';state='candidate';reason='audio-mime-content-unconfirmed';}
    else if(mime==='application/pdf'){kind='document';state='ambiguous';reason='pdf-needs-content-evidence';}
    else if(mime==='application/epub+zip'){kind='ebook';state='candidate';reason='epub-candidate';}
    else if(zipMime.has(mime)){kind='archive';state='ambiguous';reason='zip-needs-content-evidence';}
    else if(mime.startsWith('image/')){kind='artwork';state='candidate';reason='local-artwork-candidate';}
  }
  if(state==='candidate'&&!genericMime.has(mime)){
    const consistent = kind==='audio' ? mime.startsWith('audio/') || mime==='application/ogg' || mime==='application/mp4'
      : kind==='ebook' ? mime==='application/epub+zip' || zipMime.has(mime)
      : kind==='comic' ? (ext==='cbr'?rarMime.has(mime):ext==='cbt'?mime==='application/x-tar':zipMime.has(mime))
      : kind==='artwork' ? mime.startsWith('image/')
      : kind==='sidecar' ? mime.startsWith('text/') || ['application/json','application/xml','application/oebps-package+xml'].includes(mime)
      : true;
    if(!consistent){kind='unknown';state='ambiguous';reason='mime-extension-conflict';}
  }
  const bytes = input.signature;
  if(bytes && bytes.length>=4 && state==='candidate' && ['comic','ebook'].includes(kind)){
    const zip=bytes[0]===0x50&&bytes[1]===0x4b&&((bytes[2]===3&&bytes[3]===4)||(bytes[2]===5&&bytes[3]===6));
    const rar=bytes[0]===0x52&&bytes[1]===0x61&&bytes[2]===0x72&&bytes[3]===0x21;
    if((ext==='cbz'||ext==='epub')&&!zip || ext==='cbr'&&!rar){state='ambiguous';reason='signature-extension-conflict';}
  }
  return {state,kind,reason,audiobookConfirmed:false};
}
