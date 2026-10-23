import type {ScannerDatabase} from '../scannerVNext/store';
import type {DeepProof} from './deepEvidence';
export function deepSourceKey(item:any):string|null{
 const assets=item?.entry?.assets;if(!Array.isArray(assets)||assets.length!==1)return null;
 const a=assets[0];if(typeof item?.source?.rootUri!=='string'||typeof a?.documentId!=='string'||!Number.isSafeInteger(a.size)||a.size<=0||!Number.isSafeInteger(a.modified)||a.modified<=0)return null;
 const key=JSON.stringify([item.source.rootUri,a.assetId||'',a.documentId,a.disposition?.container||'',a.size,a.modified]);return key.length<=12000?key:null;
}
async function currentSourceKey(db:ScannerDatabase,id:string){
 const exists=await db.getFirstAsync<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name='scanner_vnext_catalogue'");if(!exists)return null;
 const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);try{return row?deepSourceKey(JSON.parse(row.payload)):null;}catch{return null;}
}
export async function initDeepEvidence(db:ScannerDatabase){await db.execAsync('CREATE TABLE IF NOT EXISTS assist_deep_evidence(work_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL);');}
export async function loadDeepProof(db:ScannerDatabase,id:string,revision:number):Promise<DeepProof|null>{
 const exists=await db.getFirstAsync<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name='assist_deep_evidence'");if(!exists)return null;
 const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM assist_deep_evidence WHERE work_id=? AND revision=? AND length(payload)<=32768',id,revision);
 if(!row)return null;const source=await currentSourceKey(db,id);if(!source)return null;try{const value=JSON.parse(row.payload);return value.sourceKey===source&& typeof value.text==='string'&&value.text.length<=16384&&(!value.coverHash||typeof value.coverHash==='string'&&/^[a-f0-9]{16}$/.test(value.coverHash))&&value.fields&&value.covers?value:null;}catch{return null;}
}
export async function saveDeepProof(db:ScannerDatabase,id:string,revision:number,proof:DeepProof,signal?:AbortSignal){
 const payload=JSON.stringify(proof);if(!proof.sourceKey)throw Error('Unbound deep evidence');if(payload.length>32768)throw Error('Deep evidence budget');
 await db.withExclusiveTransactionAsync(async tx=>{
  if(signal?.aborted)throw Error('Deep evidence cancelled');const current=await tx.getFirstAsync<{revision:number}>('SELECT revision FROM scanner_vnext_metadata WHERE work_id=?',id);if(current?.revision!==revision||proof.sourceKey!==await currentSourceKey(tx,id))throw Error('Stale deep evidence');
  await tx.runAsync('INSERT INTO assist_deep_evidence VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',id,revision,payload);
 });
}
