import type {MetadataWork,WorkFields} from '../scannerVNext/fieldEvidence';
import {METADATA_FIELDS,validatedFields} from './fields';
export type PortableMember={path:string;bytes:number;sha256:string};
export type PortableRecord={schema:1;kind:'archivist-work';portableId:string;savedAt:number;revision:number;fields:WorkFields;manual:Record<string,boolean|undefined>;members:PortableMember[];artwork?:{mime:string;base64:string;sha256:string}};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function safeRelativePath(value:unknown):value is string{
 return typeof value==='string'&&value.length>0&&value.length<=4096&&!/[\\\u0000:]/.test(value)&&!value.startsWith('/')&&!value.split('/').some(x=>!x||x==='.'||x==='..');
}
export function validatePortableRecord(raw:unknown):PortableRecord{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid portable metadata');
 const x=raw as Record<string,any>;
 if(Object.keys(x).some(k=>!['schema','kind','portableId','savedAt','revision','fields','manual','members','artwork'].includes(k)))throw Error('Unexpected portable metadata field');
 if(x.schema!==1||x.kind!=='archivist-work'||!uuid.test(x.portableId)||!Number.isSafeInteger(x.savedAt)||x.savedAt<0||!Number.isSafeInteger(x.revision)||x.revision<0)throw Error('Invalid portable metadata version');
 const fields=validatedFields(x.fields);
 if(!fields.title||!(fields.author||fields.publisher)||fields.coverUri!==undefined)throw Error('Portable identity or private cover reference invalid');
 if(!x.manual||typeof x.manual!=='object'||Array.isArray(x.manual))throw Error('Invalid portable locks');
 for(const [k,v]of Object.entries(x.manual))if(!(METADATA_FIELDS as readonly string[]).includes(k)||typeof v!=='boolean')throw Error('Invalid portable field lock');
 if(!Array.isArray(x.members)||!x.members.length||x.members.length>1000)throw Error('Invalid portable member count');
 const paths=new Set<string>();
 for(const m of x.members){
  if(!m||Object.keys(m).some(k=>!['path','bytes','sha256'].includes(k))||!safeRelativePath(m.path)||paths.has(m.path)||!Number.isSafeInteger(m.bytes)||m.bytes<0||!/^[a-f0-9]{64}$/.test(m.sha256))throw Error('Invalid portable member');
  paths.add(m.path);
 }
 if(x.artwork){
  const art=x.artwork;if(Object.keys(art).some(k=>!['mime','base64','sha256'].includes(k))||!['image/jpeg','image/png','image/webp'].includes(art.mime)||typeof art.base64!=='string'||art.base64.length>5592408||!art.base64.length||art.base64.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(art.base64)||!/^[a-f0-9]{64}$/.test(art.sha256))throw Error('Invalid portable artwork');
 }
 return {...x,fields} as PortableRecord;
}
export function portableMatches(record:PortableRecord,members:PortableMember[]):boolean{
 if(record.members.length!==members.length)return false;
 const keys=(items:PortableMember[])=>items.map(m=>JSON.stringify([m.path,m.bytes,m.sha256])).sort();
 return JSON.stringify(keys(record.members))===JSON.stringify(keys(members));
}
export function makePortableFields(work:Pick<MetadataWork,'fields'|'manual'>){
 const fields=validatedFields(work.fields);delete fields.coverUri;
 const manual=Object.fromEntries(Object.entries(work.manual).filter(([key,value])=>(METADATA_FIELDS as readonly string[]).includes(key)&&typeof value==='boolean'));
 return {fields,manual};
}
