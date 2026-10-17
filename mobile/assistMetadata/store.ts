import {metadataDatabase} from '../scannerVNext/metadataWrites';
import type {ScannerDatabase} from '../scannerVNext/store';
import type {MetadataWork,WorkFields,createMetadataStore} from '../scannerVNext/fieldEvidence';
import type {Candidate} from '../scannerVNext/search';
import {rankAssistCandidates} from './core';
import {METADATA_FIELDS,validatedFields} from './fields';
const IDENTITY=new Set<string>(['title','author','series','seriesNumber','isbn','asin']);
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw Error('Metadata cancelled');};
export async function createAssistMetadataStore(db:ScannerDatabase,base:Awaited<ReturnType<typeof createMetadataStore>>){
 db=metadataDatabase(db);
 async function mutate(id:string,revision:number,edit:(work:MetadataWork)=>void,signal?:AbortSignal){
  check(signal);let next:MetadataWork|undefined;
  await db.withExclusiveTransactionAsync(async tx=>{
   check(signal);const row=await tx.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_metadata WHERE work_id=?',id);
   if(!row)throw Error('Unknown work');const current=JSON.parse(row.payload) as MetadataWork;
   if(current.workId!==id||current.revision!==revision)throw Error('Stale metadata revision');
   edit(current);current.fields=validatedFields(current.fields);current.revision++;
   check(signal);await tx.runAsync('UPDATE scanner_vnext_metadata SET revision=?,payload=? WHERE work_id=?',current.revision,JSON.stringify(current),id);check(signal);next=current;
  });return next!;
 }
 return {...base,
  saveManual:(id:string,patch:WorkFields,revision:number,signal?:AbortSignal)=>mutate(id,revision,work=>{
   for(const [key,value]of Object.entries(validatedFields(patch))){
    if(IDENTITY.has(key)&&work.fields[key as keyof WorkFields]!==value)work.identityConfirmed=false;
    work.fields[key as keyof WorkFields]=value;work.manual[key]=true;
   }
  },signal),
  accept:(id:string,candidate:Candidate,revision:number,options:{confirmIdentityConflicts?:boolean;signal?:AbortSignal}={})=>mutate(id,revision,work=>{
   const ranked=rankAssistCandidates(work.fields,[candidate])[0];
   if(ranked.conflicts.length&&!options.confirmIdentityConflicts)throw Error('Candidate conflict requires confirmation');
   if(candidate.anthology)throw Error('Anthology cannot identify an individual story');
   const fields=validatedFields(Object.fromEntries(Object.entries(candidate.fields).map(([k,v])=>[k==='coverUrl'?'coverUri':k,v])));
   for(const [key,value]of Object.entries(fields)){
    if(!value)continue;const identity=IDENTITY.has(key);
    if(work.manual[key]&&!(identity&&options.confirmIdentityConflicts))continue;
    if(!identity&&work.fields[key as keyof WorkFields]?.trim())continue;
    work.fields[key as keyof WorkFields]=value;
   }
   if(!work.fields.title?.trim()||!work.fields.author?.trim())throw Error('A title and creator are required');
   work.identityConfirmed=true;
  },options.signal),
  setResolvedArtwork:(id:string,from:string,to:string,revision:number,signal?:AbortSignal)=>mutate(id,revision,work=>{
   if(work.fields.coverUri!==from||!to.startsWith('file:///'))throw Error('Stale artwork resolution');
   work.fields.coverUri=to;
  },signal),
  restorePortable:(id:string,fields:WorkFields,manual:Record<string,boolean|undefined>,revision:number,signal?:AbortSignal)=>mutate(id,revision,work=>{
   const validated=validatedFields(fields);
   if(!validated.title||!validated.author)throw Error('Portable identity is incomplete');
   if(Object.values(work.manual).some(Boolean))throw Error('Existing local manual decisions cannot be replaced by an imported record');
   for(const key of Object.keys(manual))if(!(METADATA_FIELDS as readonly string[]).includes(key)||typeof manual[key]!=='boolean')throw Error('Invalid portable field lock');
   work.fields=validated;work.manual={...manual};work.identityConfirmed=true;
  },signal),
 };
}
export type AssistMetadataStore=Awaited<ReturnType<typeof createAssistMetadataStore>>;
