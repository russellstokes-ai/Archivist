export type ScanPhase='discovering'|'reading-metadata'|'matching'|'checking-duplicates'|'covers'|'online-books'|'online-comics'|'preparing'|'complete';

export type LibraryPreparationJobKind='prepare'|'refresh';
export type LibraryPreparationJobPhase='discovery'|'enrichment';
export type LibraryPreparationJob={
  kind:LibraryPreparationJobKind;
  signature:string;
  phase:LibraryPreparationJobPhase;
  startedAt?:string;
};
export type LibraryPreparationCheckpoint={
  signature:string;
  completedAt?:string;
  activeJob?:LibraryPreparationJob;
};

function cleanCheckpointText(value:unknown){return typeof value==='string'?value.trim():'';}

export function sanitizeLibraryPreparationCheckpoint(value:unknown):LibraryPreparationCheckpoint{
  const raw=value&&typeof value==='object'?value as any:{};
  const signature=cleanCheckpointText(raw.signature);
  const completedAt=cleanCheckpointText(raw.completedAt)||undefined;
  const job=raw.activeJob&&typeof raw.activeJob==='object'?raw.activeJob as any:undefined;
  const kind:LibraryPreparationJobKind|undefined=job?.kind==='prepare'||job?.kind==='refresh'?job.kind:undefined;
  const phase:LibraryPreparationJobPhase|undefined=job?.phase==='discovery'||job?.phase==='enrichment'?job.phase:undefined;
  const jobSignature=cleanCheckpointText(job?.signature);
  const startedAt=cleanCheckpointText(job?.startedAt)||undefined;
  const activeJob=kind&&phase&&jobSignature?{kind,phase,signature:jobSignature,startedAt}:undefined;
  return {signature,completedAt,activeJob};
}

export function beginLibraryPreparation(
  current:LibraryPreparationCheckpoint|unknown,
  job:{kind:LibraryPreparationJobKind;signature:string;startedAt?:string},
):LibraryPreparationCheckpoint{
  const checkpoint=sanitizeLibraryPreparationCheckpoint(current);
  return {
    ...checkpoint,
    activeJob:{kind:job.kind,signature:cleanCheckpointText(job.signature),phase:'discovery',startedAt:cleanCheckpointText(job.startedAt)||undefined},
  };
}

export function markLibraryDiscoveryCommitted(current:LibraryPreparationCheckpoint|unknown):LibraryPreparationCheckpoint{
  const checkpoint=sanitizeLibraryPreparationCheckpoint(current);
  return checkpoint.activeJob?{...checkpoint,activeJob:{...checkpoint.activeJob,phase:'enrichment'}}:checkpoint;
}

export function cancelLibraryPreparation(current:LibraryPreparationCheckpoint|unknown):LibraryPreparationCheckpoint{
  const checkpoint=sanitizeLibraryPreparationCheckpoint(current);
  return {...checkpoint,activeJob:undefined};
}

export function failLibraryPreparation(current:LibraryPreparationCheckpoint|unknown):LibraryPreparationCheckpoint{
  const checkpoint=sanitizeLibraryPreparationCheckpoint(current);
  return {...checkpoint,activeJob:undefined};
}

export function completeLibraryPreparation(
  current:LibraryPreparationCheckpoint|unknown,
  signature:string,
  completedAt=new Date().toISOString(),
):LibraryPreparationCheckpoint{
  const checkpoint=sanitizeLibraryPreparationCheckpoint(current);
  return {...checkpoint,signature:cleanCheckpointText(signature),completedAt,activeJob:undefined};
}

export function shouldResumeLibraryPreparation(current:LibraryPreparationCheckpoint|unknown,currentSignature:string){
  const checkpoint=sanitizeLibraryPreparationCheckpoint(current);
  return !!checkpoint.activeJob&&!!cleanCheckpointText(currentSignature)&&checkpoint.activeJob.signature===cleanCheckpointText(currentSignature);
}

export class ScanCommitGate {
  private generation=0;
  begin(){this.generation+=1;return this.generation;}
  isCurrent(generation:number){return generation===this.generation;}
  invalidate(){this.generation+=1;return this.generation;}
  current(){return this.generation;}
}

export function scanStatusCopy(input:{
  phase:ScanPhase;
  currentFolder?:string;
  entriesVisited:number;
  found:number;
  review:number;
  publishedCount:number;
  processed?:number;
  total?:number;
}){
  const place=input.currentFolder?' · '+input.currentFolder:'';
  const count=input.total&&input.total>0
    ? Math.min(input.processed||0,input.total)+' of '+input.total
    : input.entriesVisited+' checked';
  const progress=count+' · '+input.found+' found · '+input.review+' need review'+place;
  if(input.publishedCount>0){
    return {
      title:'Refreshing your library',
      detail:progress+'. Your current '+input.publishedCount+' item'+(input.publishedCount===1?'':'s')+' remain available until the refresh is complete.',
    };
  }
  return {
    title:input.phase==='preparing'||input.phase==='checking-duplicates'?'Preparing your library':'Building your library',
    detail:progress+'. New items will appear together when this scan is complete.',
  };
}

export function scanFailureCopy(hasPublishedCatalogue:boolean){
  return hasPublishedCatalogue
    ? 'Scan could not finish. Your existing library is unchanged.'
    : 'Scan could not finish. The folder is still saved; tap Refresh to try again.';
}
