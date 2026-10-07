import {NativeModules,Platform} from 'react-native';
import {LocalMetadataFields,parseLocalSidecar} from './libraryIntelligence';

export type BoundedArchiveEvidenceResult =
  | {status:'ok';fields:LocalMetadataFields;coverUri?:string;coverName?:string}
  | {status:'blocked';fields:LocalMetadataFields;code:string;reason:string}
  | {status:'unsupported';fields:LocalMetadataFields;code:'unsupported';reason:string};

type NativeArchiveEvidence={
  metadataKind?:'opf'|'xml'|string;
  metadataText?:string;
  coverName?:string;
  coverMime?:string;
  coverBase64?:string;
};

const supported=new Set(['epub','cbz','zip']);

function cleanExtension(value:string){
  return String(value||'').trim().toLowerCase().replace(/^\./,'');
}
function cleanMime(value:string|undefined,name:string|undefined){
  const mime=String(value||'').trim().toLowerCase();
  if(/^image\/(jpeg|png|webp|gif)$/.test(mime))return mime;
  const lower=String(name||'').toLowerCase();
  if(lower.endsWith('.png'))return'image/png';
  if(lower.endsWith('.webp'))return'image/webp';
  if(lower.endsWith('.gif'))return'image/gif';
  return'image/jpeg';
}
function errorCode(error:any){
  return String(error?.code||error?.userInfo?.code||'archive-probe-failed').trim()||'archive-probe-failed';
}
function errorMessage(error:any){
  return String(error?.message||error||'Archive evidence could not be read safely.').trim()||'Archive evidence could not be read safely.';
}

/**
 * Fast preparation adapter for bounded archive evidence.
 *
 * Deliberately Android-only until an equivalent bounded iOS range reader exists.
 * It never calls JSZip, readAsStringAsync or the reader-oriented openZip bridge.
 */
export async function readBoundedArchiveEvidence(uri:string,extension:string):Promise<BoundedArchiveEvidenceResult>{
  const ext=cleanExtension(extension);
  if(!supported.has(ext))return {status:'unsupported',fields:{},code:'unsupported',reason:'This format has no bounded ZIP evidence reader.'};
  if(Platform.OS!=='android')return {status:'unsupported',fields:{},code:'unsupported',reason:'Bounded archive preparation is not available on this platform yet.'};

  const native=NativeModules?.ArchivistArchive;
  if(!native?.readBoundedArchiveEvidence)return {status:'unsupported',fields:{},code:'unsupported',reason:'Bounded archive preparation is unavailable in this build.'};

  try{
    const raw:NativeArchiveEvidence=await native.readBoundedArchiveEvidence(uri,ext);
    const metadataText=String(raw?.metadataText||'');
    const metadataKind=raw?.metadataKind==='opf'?'opf':'xml';
    const fields=metadataText?parseLocalSidecar(metadataText,metadataKind):{};
    const base64=String(raw?.coverBase64||'').trim();
    const coverName=String(raw?.coverName||'').trim()||undefined;
    const coverUri=base64?'data:'+cleanMime(raw?.coverMime,coverName)+';base64,'+base64:undefined;
    return {status:'ok',fields,coverUri,coverName};
  }catch(error:any){
    const code=errorCode(error);
    if(code==='operation-timeout')throw error;
    return {status:'blocked',fields:{},code,reason:errorMessage(error)};
  }
}
