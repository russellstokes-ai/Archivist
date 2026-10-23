import type {WorkFields} from '../scannerVNext/fieldEvidence';
import type {Observation,EvidenceSource} from './evidenceLedger';
const priority:Record<EvidenceSource,number>={manual:6,'verified-id':5,embedded:4,provider:3,deep:2,neighbour:1,filename:0};
const normal=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export function resolve(observations:Observation[],locks:WorkFields){
 const fields:WorkFields={...locks},provenance:Partial<Record<keyof WorkFields,string>>={},conflicts:(keyof WorkFields)[]=[];
 const active=observations.filter(o=>!o.supersededBy).sort((a,b)=>priority[b.source]-priority[a.source]||b.time-a.time||a.id.localeCompare(b.id));
 for(const o of active){
  if(Object.prototype.hasOwnProperty.call(locks,o.field))continue;
  if(!Object.prototype.hasOwnProperty.call(provenance,o.field)){fields[o.field]=o.value;provenance[o.field]=o.id;continue;}
  const winner=active.find(x=>x.id===provenance[o.field])!;
  if(priority[winner.source]===priority[o.source]&&normal(winner.value)!==normal(o.value)&&!conflicts.includes(o.field))conflicts.push(o.field);
 }
 return {fields,provenance,conflicts};
}
