import type {MetadataWork,WorkFields} from '../scannerVNext/fieldEvidence';
import {fileMetadataFields} from './formatCapabilities';
export type FileSnapshot={root:string;uri:string;path:string;fingerprint:string;original:string;fields:WorkFields};
export type ChangePlan={version:1;itemId:string;revision:number;file:FileSnapshot;operations:{field:keyof WorkFields;oldValue?:string;newValue:string;observation:string}[];multipart:boolean;omittedFields?:(keyof WorkFields)[]};
export function writeEligibility(work:MetadataWork,issues:string[],multipart:boolean):string|null{
 if(!work.identityConfirmed||!work.identification?.rung||!['R1','R2'].includes(work.identification.rung)||work.identification.conflicts.length)return 'identity-needs-evidence';
 if(issues.some(x=>['duplicate-part-number','overlapping-group-needs-review','source-parts-missing','source-discovery-incomplete','manual-edition-unresolved'].includes(x)))return 'source-review-required';
 if(multipart&&issues.some(x=>['path-only-grouping-provisional','insufficient-grouping-evidence'].includes(x)))return 'source-review-required';
 return null;
}
export function planChanges(work:MetadataWork,file:FileSnapshot,multipart=false):ChangePlan{
 if(!/^[a-f0-9]{64}$/.test(file.fingerprint)||!file.original.startsWith('file:'))throw Error('A verified source snapshot is required');
 const operations:ChangePlan['operations']=[];
 const supported=fileMetadataFields(file.path),omittedFields:(keyof WorkFields)[]=[];
 for(const [field,value]of Object.entries(work.fields)){
  if(field==='coverUri'||typeof value!=='string'||file.fields[field as keyof WorkFields]===value)continue;
  if(!supported.includes(field as keyof WorkFields)||!value.trim()){omittedFields.push(field as keyof WorkFields);continue;}
  const observation=work.provenance?.[field as keyof WorkFields]||(work.manual[field]?'manual:'+work.workId+':'+work.revision:undefined);
  if(!observation)continue;
  operations.push({field:field as keyof WorkFields,oldValue:file.fields[field as keyof WorkFields],newValue:value,observation});
 }
 return {version:1,itemId:work.workId,revision:work.revision,file,operations,multipart,omittedFields};
}
export function plannedFields(plan:ChangePlan):WorkFields{
 if(plan.version!==1||!plan.itemId||!Number.isSafeInteger(plan.revision)||!/^[a-f0-9]{64}$/.test(plan.file.fingerprint))throw Error('Invalid metadata change plan');
 const fields:WorkFields={};for(const op of plan.operations){if(op.field==='coverUri'||!op.observation)throw Error('Invalid metadata operation');fields[op.field]=op.newValue;}return fields;
}
