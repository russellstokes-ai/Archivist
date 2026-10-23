import type {MetadataWork,WorkFields} from '../scannerVNext/fieldEvidence';
import type {ScannerDatabase} from '../scannerVNext/store';
import type {Candidate} from '../scannerVNext/search';
import {canonicalText,canonicalIssue,rankAssistCandidates} from './core';
export type Neighbour={scope:string;work:MetadataWork};
export type NeighbourContext={fields:WorkFields;anchors:string[];minYear:number;maxYear:number};
const issue=(v?:string)=>v&&/^\d+$/.test(v)?Number(v):NaN;
export function neighbourContext(target:MetadataWork,scope:string,peers:Neighbour[]):NeighbourContext|null {
 const n=issue(target.fields.seriesNumber);if(!scope||!target.fields.series||!Number.isSafeInteger(n)||n<1)return null;
 const eligible=peers.filter(p=>p.scope===scope&&p.work.workId!==target.workId&&p.work.identityConfirmed&&['R1','R2'].includes(p.work.identification?.rung||'')&&!p.work.identification?.conflicts.length&&canonicalText(p.work.fields.series)===canonicalText(target.fields.series));
 const left=eligible.filter(p=>issue(p.work.fields.seriesNumber)===n-1),right=eligible.filter(p=>issue(p.work.fields.seriesNumber)===n+1);
 if(left.length!==1||right.length!==1)return null;
 const a=left[0].work,b=right[0].work,publisher=a.fields.publisher;
 if(!publisher||canonicalText(publisher)!==canonicalText(b.fields.publisher))return null;
 if(target.fields.publisher&&canonicalText(target.fields.publisher)!==canonicalText(publisher))return null;
 const y1=Number(a.fields.publishedYear),y2=Number(b.fields.publishedYear);
 if(!Number.isInteger(y1)||!Number.isInteger(y2)||y1<1800||y2<y1||y2-y1>2)return null;
 return {fields:{series:target.fields.series,seriesNumber:target.fields.seriesNumber,publisher},anchors:[a.workId,b.workId],minYear:y1,maxYear:y2};
}
export function selectNeighbourCandidate(work:MetadataWork,candidates:Candidate[],context:NeighbourContext|null):Candidate|null {
 if(!context)return null;
 const matches=candidates.filter(c=>!c.relatedMatch&&!c.anthology&&canonicalText(c.fields.series)===canonicalText(context.fields.series)&&canonicalIssue(c.fields.seriesNumber)===canonicalIssue(context.fields.seriesNumber)&&canonicalText(c.fields.publisher)===canonicalText(context.fields.publisher)&&Number(c.fields.publishedYear)>=context.minYear&&Number(c.fields.publishedYear)<=context.maxYear&&!rankAssistCandidates(work.fields,[c])[0].conflicts.length);
 // Multiple issue records may represent different editions; don't guess.
 const unique=new Map(matches.map(c=>[c.provider+'|'+c.id,c]));return unique.size===1?[...unique.values()][0]:null;
}
export async function loadNeighbourContext(db:ScannerDatabase,work:MetadataWork):Promise<NeighbourContext|null> {
 if(!work.fields.series||!work.fields.seriesNumber)return null;
 const table=await db.getFirstAsync<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name='scanner_vnext_catalogue'");if(!table)return null;
 const row=await db.getFirstAsync<{payload:string;source_id:string}>('SELECT payload,source_id FROM scanner_vnext_catalogue WHERE work_id=?',work.workId);if(!row)return null;
 const scope=(payload:string,source:string)=>{try{const assets=JSON.parse(payload).entry.assets;if(assets.length!==1||assets[0].disposition?.kind!=='comic')return '';const path=assets[0].relativePath.replace(/\\/g,'/');return JSON.stringify([source,path.slice(0,path.lastIndexOf('/')+1)]);}catch{return '';}};
 const targetScope=scope(row.payload,row.source_id);if(!targetScope)return null;
 const rows=await db.getFirstAsync<{rows:string}>("SELECT json_group_array(json_object('catalogue',c.payload,'metadata',m.payload,'source',c.source_id)) AS rows FROM scanner_vnext_catalogue c JOIN scanner_vnext_metadata m ON m.work_id=c.work_id WHERE c.source_id=? AND json_extract(m.payload,'$.identityConfirmed')=1 AND json_extract(m.payload,'$.fields.series')=?",row.source_id,work.fields.series);
 const peers:Neighbour[]=JSON.parse(rows?.rows||'[]').map((r:{catalogue:string;metadata:string;source:string})=>({scope:scope(r.catalogue,r.source),work:JSON.parse(r.metadata)}));
 return neighbourContext(work,targetScope,peers);
}
