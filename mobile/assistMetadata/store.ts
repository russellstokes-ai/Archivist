import {metadataDatabase} from '../scannerVNext/metadataWrites';
import type {ScannerDatabase} from '../scannerVNext/store';
import type {MetadataWork,WorkFields,createMetadataStore} from '../scannerVNext/fieldEvidence';
import type {Candidate} from '../scannerVNext/search';
import {rankAssistCandidates} from './core';
import {METADATA_FIELDS,validatedFields} from './fields';
import {hasGenre} from './genres';
import {initEvidence,appendEvidence,loadEvidence,type EvidenceSource} from './evidenceLedger';
import {loadNeighbourContext,selectNeighbourCandidate} from './neighbours';
import {resolve} from './resolver';
import {selectDeepCandidate} from './deepEvidence';
import {loadDeepProof} from './deepEvidenceStore';
const IDENTITY=new Set<string>(['title','author','series','seriesNumber','isbn','asin']);
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw Error('Metadata cancelled');};
export async function createAssistMetadataStore(db:ScannerDatabase,base:Awaited<ReturnType<typeof createMetadataStore>>){
 db=metadataDatabase(db);
 await initEvidence(db);
 async function observe(tx:ScannerDatabase,work:MetadataWork,fields:WorkFields,source:EvidenceSource,detail:string){
  for(const [field,raw]of Object.entries(fields))if(typeof raw==='string')await appendEvidence(tx,{itemId:work.workId,field:field as keyof WorkFields,raw,value:raw.normalize('NFKC').trim(),source,detail,extractorVersion:1,time:Date.now(),tier:source==='verified-id'?'verified':source==='filename'?'suggestion':'corroborated',fileRevision:work.revision});
 }
 async function mutate(id:string,revision:number,edit:(work:MetadataWork,tx:ScannerDatabase)=>void|Promise<void>,signal?:AbortSignal){
  check(signal);let next:MetadataWork|undefined;
  await db.withExclusiveTransactionAsync(async tx=>{
   check(signal);const row=await tx.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_metadata WHERE work_id=?',id);
   if(!row)throw Error('Unknown work');const current=JSON.parse(row.payload) as MetadataWork;
   if(current.workId!==id||current.revision!==revision)throw Error('Stale metadata revision');
   const existingEvidence=await loadEvidence(tx,id);
   for(const [key,value]of Object.entries(current.fields))if(value!==undefined&&!existingEvidence.some(o=>o.field===key&&!o.supersededBy))await observe(tx,current,{[key]:value},current.manual[key]?'manual':current.fieldSources?.[key]==='embedded'?'embedded':'filename','initial:'+key);
   await edit(current,tx);current.fields=validatedFields(current.fields);current.revision++;
   check(signal);await tx.runAsync('UPDATE scanner_vnext_metadata SET revision=?,payload=? WHERE work_id=?',current.revision,JSON.stringify(current),id);check(signal);next=current;
  });return next!;
 }
 return {...base,
  confirmIdentity:(id:string,revision:number,signal?:AbortSignal)=>mutate(id,revision,work=>{if(!work.fields.title?.trim()||!(work.fields.author?.trim()||work.fields.publisher?.trim()))throw Error('A title and creator or publisher are required');work.identityConfirmed=true;},signal),
  evidence:(id:string)=>loadEvidence(db,id),
  saveManual:(id:string,patch:WorkFields,revision:number,signal?:AbortSignal)=>mutate(id,revision,async(work,tx)=>{
   for(const [key,value]of Object.entries(validatedFields(patch))){
    if((IDENTITY.has(key)||key==='publisher'&&!work.fields.author?.trim())&&work.fields[key as keyof WorkFields]!==value){work.identityConfirmed=false;work.identification=undefined;}
    work.fields[key as keyof WorkFields]=value;work.manual[key]=true;
   }
   await observe(tx,work,validatedFields(patch),'manual','user');
  },signal),
  accept:(id:string,candidate:Candidate,revision:number,options:{confirmIdentityConflicts?:boolean;signal?:AbortSignal}={})=>mutate(id,revision,async(work,tx)=>{
   const ranked=rankAssistCandidates(work.fields,[candidate])[0];
   if(ranked.conflicts.length&&!options.confirmIdentityConflicts)throw Error('Candidate conflict requires confirmation');
   if(candidate.anthology)throw Error('Anthology cannot identify an individual story');
   const fields=validatedFields(Object.fromEntries(Object.entries(candidate.fields).map(([k,v])=>[k==='coverUrl'?'coverUri':k,v])));
   if(fields.genre&&!hasGenre(fields.genre))delete fields.genre;
   const normal=(s?:string)=>(s||'').replace(/[-\s]/g,'').toUpperCase();
   // Provider-supplied fields cannot corroborate the same provider on a later
   // lookup. Retain the independently observed clues for the write decision.
   const priorEvidence=await loadEvidence(tx,id);
   const independent=resolve(priorEvidence.filter(o=>['manual','embedded','filename'].includes(o.source)),Object.fromEntries(Object.entries(work.fields).filter(([key])=>work.manual[key])) as WorkFields).fields;
   const independentlyRanked=rankAssistCandidates(independent,[candidate])[0];
   const exact=[independent.isbn,independent.asin].filter(Boolean).some(id=>[...candidate.identifiers,candidate.fields.isbn,candidate.fields.asin].filter(Boolean).some(other=>normal(id)===normal(other)));
   const neighbour=independentlyRanked.automaticEligible?null:await loadNeighbourContext(tx,{...work,fields:independent});
   const deep=await loadDeepProof(tx,id,revision);
   const rung=independentlyRanked.automaticEligible?(exact?'R1':'R2'):selectNeighbourCandidate({...work,fields:independent},[candidate],neighbour)?'R3':deep&&selectDeepCandidate(independent,[candidate],deep)?'R4':undefined;
   if(rung==='R4'&&deep){await observe(tx,work,deep.fields,'deep','local-pages-v1');await tx.runAsync('UPDATE assist_deep_evidence SET revision=? WHERE work_id=? AND revision=?',revision+1,id,revision);}
   if(rung==='R3'&&neighbour)await observe(tx,work,neighbour.fields,'neighbour','anchors:'+neighbour.anchors.join(','));
   await observe(tx,work,fields,exact&&!ranked.conflicts.length?'verified-id':'provider',candidate.provider+':'+candidate.id);
   const locks:WorkFields={};for(const [key,value]of Object.entries(work.fields))if(work.manual[key])locks[key as keyof WorkFields]=value;
   const resolved=resolve(await loadEvidence(tx,id),locks);
   work.fields=resolved.fields;work.provenance=resolved.provenance;
   work.identification={rung,provider:candidate.provider,candidateId:candidate.id,conflicts:[...new Set([...ranked.conflicts,...independentlyRanked.conflicts,...resolved.conflicts])],selectedAt:Date.now()};
   if(!work.fields.title?.trim()||!(work.fields.author?.trim()||work.fields.publisher?.trim()))throw Error('A title and creator or publisher are required');
   work.identityConfirmed=!!rung&&!work.identification.conflicts.length;
  },options.signal),
  setResolvedArtwork:(id:string,from:string,to:string,revision:number,signal?:AbortSignal)=>mutate(id,revision,work=>{
   if(work.fields.coverUri!==from||!to.startsWith('file:///'))throw Error('Stale artwork resolution');
   work.fields.coverUri=to;
  },signal),
  restorePortable:(id:string,fields:WorkFields,manual:Record<string,boolean|undefined>,revision:number,signal?:AbortSignal)=>mutate(id,revision,async(work,tx)=>{
   const validated=validatedFields(fields);
   if(!validated.title||!(validated.author||validated.publisher))throw Error('Portable identity is incomplete');
   if(Object.values(work.manual).some(Boolean))throw Error('Existing local manual decisions cannot be replaced by an imported record');
   for(const key of Object.keys(manual))if(!(METADATA_FIELDS as readonly string[]).includes(key)||typeof manual[key]!=='boolean')throw Error('Invalid portable field lock');
   work.fields=validated;work.manual={...manual};work.identityConfirmed=true;
   await observe(tx,work,validated,'embedded','verified-legacy-recovery');
  },signal),
 };
}
export type AssistMetadataStore=Awaited<ReturnType<typeof createAssistMetadataStore>>;
