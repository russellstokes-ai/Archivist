import type {PopulationJob} from '../assistMetadata/jobQueue';
export type CoverJobPorts={load:(id:string)=>Promise<{revision:number}|null>;enqueue:(id:string,revision:number)=>Promise<unknown>;acquire:(id:string,revision:number)=>Promise<boolean>;commit:(id:string,revision:number)=>Promise<boolean>;finish:(job:PopulationJob,state:PopulationJob['state'],reason?:string)=>Promise<unknown>};

export async function processCoverJob(job:PopulationJob,ports:CoverJobPorts):Promise<void>{
 const current=await ports.load(job.itemId);if(!current){await ports.finish(job,'blocked','unavailable');return;}
 if(current.revision>job.revision){await ports.enqueue(job.itemId,current.revision);return;}
 if(current.revision<job.revision){await ports.finish(job,'blocked','stale-catalogue');return;}
 const acquired=await ports.acquire(job.itemId,job.revision);if(!acquired){await ports.finish(job,'retry','cover-unavailable');return;}
 const latest=await ports.load(job.itemId);if(!latest||latest.revision!==job.revision){if(latest&&latest.revision>job.revision)await ports.enqueue(job.itemId,latest.revision);else await ports.finish(job,'blocked','stale-catalogue');return;}
 const committed=await ports.commit(job.itemId,job.revision);await ports.finish(job,committed?'done':'retry',committed?'ready':'stale-catalogue');
}

