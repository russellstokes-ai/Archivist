import type {ScannerDatabase} from '../scannerVNext/store';
export type PopulationStage='identify'|'cover'|'write';
export type PopulationJob={itemId:string;revision:number;generation?:number;stage:PopulationStage;state:'pending'|'running'|'done'|'retry'|'needs-clues'|'blocked';attempts:number;nextAttemptAt:number;reason?:string};
export async function createPopulationQueue(db:ScannerDatabase){
 await db.execAsync('CREATE TABLE IF NOT EXISTS assist_jobs(item_id TEXT NOT NULL,stage TEXT NOT NULL,revision INTEGER NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(item_id,stage));');
 const load=async(itemId:string,stage:PopulationStage,port=db):Promise<PopulationJob|null>=>{const row=await port.getFirstAsync<{payload:string}>('SELECT payload FROM assist_jobs WHERE item_id=? AND stage=?',itemId,stage);return row?JSON.parse(row.payload):null;};
 const save=async(j:PopulationJob,port=db)=>port.runAsync('INSERT INTO assist_jobs VALUES(?,?,?,?) ON CONFLICT(item_id,stage) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',j.itemId,j.stage,j.revision,JSON.stringify(j));
 return {load,
  async next(stage:PopulationStage):Promise<PopulationJob|null>{const row=await db.getFirstAsync<{payload:string}>("SELECT payload FROM assist_jobs WHERE stage=? AND json_extract(payload,'$.state') IN ('pending','retry','running') AND json_extract(payload,'$.nextAttemptAt')<=? ORDER BY rowid LIMIT 1",stage,Date.now());return row?JSON.parse(row.payload):null;},
  async enqueue(itemId:string,revision:number,stage:PopulationStage,force=false){
   let result:PopulationJob|undefined;
   await db.withExclusiveTransactionAsync(async tx=>{
    const old=await load(itemId,stage,tx);
    if(old&&(old.revision>revision||old.revision===revision&&!force)){result=old;return;}
    result={itemId,revision,generation:(old?.generation??0)+1,stage,state:'pending',attempts:0,nextAttemptAt:0};await save(result,tx);
   });return result!;
  },
  async nextWake(stage:PopulationStage):Promise<number|null>{const row=await db.getFirstAsync<{time:number|null}>("SELECT min(json_extract(payload,'$.nextAttemptAt')) AS time FROM assist_jobs WHERE stage=? AND json_extract(payload,'$.state') IN ('pending','retry','running')",stage);return row?.time??null;},
  async summary(stage:PopulationStage):Promise<Record<string,number>>{const row=await db.getFirstAsync<{payload:string}>("SELECT json_group_object(state,count) AS payload FROM (SELECT json_extract(payload,'$.state') AS state,count(*) AS count FROM assist_jobs WHERE stage=? GROUP BY state)",stage);return JSON.parse(row?.payload||'{}');},
  async start(itemId:string,stage:PopulationStage):Promise<PopulationJob|null>{let result:PopulationJob|null=null;await db.withExclusiveTransactionAsync(async tx=>{const j=await load(itemId,stage,tx);if(!j||['done','needs-clues','blocked'].includes(j.state)||j.nextAttemptAt>Date.now())return;j.state='running';j.attempts++;await save(j,tx);result=j;});return result;},
  async finish(job:PopulationJob,state:PopulationJob['state'],reason?:string){
   await db.withExclusiveTransactionAsync(async tx=>{
    const current=await load(job.itemId,job.stage,tx);if(current?.revision!==job.revision||current.attempts!==job.attempts||(current.generation??0)!==(job.generation??0))return;
    if(state==='retry'&&job.attempts>=5)state='blocked';
    await save({...job,state,reason,nextAttemptAt:state==='retry'?Date.now()+Math.min(3600000,30000*2**Math.min(job.attempts,7)):0},tx);
   });
  }
 };
}
