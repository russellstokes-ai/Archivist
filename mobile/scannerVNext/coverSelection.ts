import {approvedArtworkUrl} from './artworkDownload';
export type CoverCandidate={uri:string;manual?:boolean;exactEdition?:boolean;placeholder?:boolean;width:number;height:number;bytes:number;sha256:string;priority?:number};
const placeholderPattern=/(?:placeholder|no[-_ ]?cover|default[-_ ]?(?:book|image)|missing[-_ ]?cover|blank[-_ ]?cover)/i;

export function validCoverCandidate(value:CoverCandidate):boolean{
 if(!value||typeof value.uri!=='string'||value.uri.length>2048)return false;
 const local=value.uri.startsWith('file:///');if(!local&&!approvedArtworkUrl(value.uri))return false;
 if(value.placeholder||!value.manual&&placeholderPattern.test(value.uri))return false;
 if(!Number.isSafeInteger(value.bytes)||value.bytes<1||value.bytes>4194304||!Number.isSafeInteger(value.width)||!Number.isSafeInteger(value.height)||value.width<64||value.height<64||value.width*value.height>16777216)return false;
 if(!value.manual&&(value.width/value.height<0.35||value.width/value.height>2.5))return false;
 return /^[a-f0-9]{64}$/.test(value.sha256);
}

export function isSensibleCoverCompanion(name:string):boolean{return /^(?:cover|front(?:cover)?|folder|album[ ._-]?art)(?:[ ._-].*)?\.(?:jpe?g|png)$/i.test(name);}

export function selectBestCover<T extends CoverCandidate>(values:T[]):T|undefined{
 if(values.length>32)throw Error('Cover candidate budget');
 const valid=values.filter(validCoverCandidate);if(!valid.length)return undefined;
 return valid.sort((a,b)=>Number(!!b.manual)-Number(!!a.manual)||Number(!!b.exactEdition)-Number(!!a.exactEdition)||b.width*b.height-a.width*a.height||(b.priority??0)-(a.priority??0)||a.uri.localeCompare(b.uri))[0];
}

export function coverCacheKey(uri:string|undefined,manual:boolean,identity?:{provider?:string;candidateId?:string},revision?:number){return JSON.stringify([uri||'',manual?'manual':identity?.provider&&identity.candidateId?[identity.provider,identity.candidateId]:['revision',revision??0]]);}

export type EditionCandidate={id:string;provider:string;fields:Record<string,string|undefined>;score?:number};
export function exactEditionCoverUrls(fields:Record<string,string|undefined>,identity:{provider?:string;candidateId?:string}|undefined,candidates:EditionCandidate[],manual=false):string[]{
 if(candidates.length>200)throw Error('Cover candidate budget');
 const chosen=identity?.provider&&identity.candidateId?candidates.find(x=>x.provider===identity.provider&&x.id===identity.candidateId):undefined;
 const anchors=[fields,...(chosen?[chosen.fields]:[])];const normalize=(v?:string)=>(v||'').normalize('NFKC').trim().replaceAll(' ','').toLowerCase();
 const url=(x:EditionCandidate)=>x.fields.coverUrl;const selected:EditionCandidate[]=[];
 if(chosen&&url(chosen)&&approvedArtworkUrl(url(chosen)!))selected.push(chosen);
 if(!manual)for(const candidate of candidates){if(candidate===chosen||!url(candidate)||!approvedArtworkUrl(url(candidate)!))continue;
  // Work-level identifier lists can span several editions. Only explicit candidate ISBN/ASIN fields prove a match.
  const shared=anchors.some(anchor=>['isbn','asin'].some(key=>!!candidate.fields[key]&&!!anchor[key]&&normalize(anchor[key])===normalize(candidate.fields[key])));if(!shared)continue;
  const edition=['title','author','series','seriesNumber','publisher','publishedYear'];if(edition.some(key=>fields[key]&&candidate.fields[key]&&normalize(fields[key])!==normalize(candidate.fields[key])))continue;
  if(chosen&&edition.some(key=>chosen.fields[key]&&candidate.fields[key]&&normalize(chosen.fields[key])!==normalize(candidate.fields[key])))continue;selected.push(candidate);
 }
 return [...new Set(selected.sort((a,b)=>Number(b===chosen)-Number(a===chosen)||(b.score??0)-(a.score??0)).map(x=>url(x)!))].slice(0,8);
}

