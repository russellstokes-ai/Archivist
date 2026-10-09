import type {ScannerDatabase} from './store';
import type {HeaderClues} from './clues';

export type AssetFingerprint={documentId:string;size:number|null;modified:number|null};
const VERSION='header-1',BUDGET='header64k';
function key(fingerprint:AssetFingerprint):string|null{
  if(!fingerprint||typeof fingerprint.documentId!=='string'||!fingerprint.documentId||fingerprint.documentId.length>16384)throw new Error('Invalid clue fingerprint');
  if(fingerprint.size===null||fingerprint.modified===null||fingerprint.modified===0)return null;
  if(!Number.isSafeInteger(fingerprint.size)||fingerprint.size<0||!Number.isSafeInteger(fingerprint.modified)||fingerprint.modified<0)throw new Error('Invalid clue fingerprint');
  return JSON.stringify([fingerprint.documentId,fingerprint.size,fingerprint.modified]);
}
function validate(value:HeaderClues){
  if(!value||value.readerVersion!==VERSION||value.provenance!=='embedded')throw new Error('Invalid clue reader version or provenance');
  if(!['parsed','partial','unresolved'].includes(value.status)||typeof value.reason!=='string'||value.reason.length>128||!value.fields||Array.isArray(value.fields))throw new Error('Invalid clue cache result');
  for(const [field,data] of Object.entries(value.fields)){
    if(['title','album','author','genre'].includes(field)){if(typeof data!=='string'||data.length>4096)throw new Error('Clue field budget exceeded');}
    else if(['track','disc'].includes(field)){if(!Number.isSafeInteger(data)||Number(data)<1||Number(data)>100000)throw new Error('Invalid clue part number');}
    else throw new Error('Unknown embedded clue field');
  }
  if(JSON.stringify(value).length>32768)throw new Error('Clue cache payload budget exceeded');
}
function check(signal?:AbortSignal){if(signal?.aborted)throw new Error('Clue cache write cancelled');}
export async function createClueCache(db:ScannerDatabase){
  // Manual edits are held elsewhere. Cache eviction never touches user state.
  await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_clue_cache(asset_id TEXT NOT NULL,fingerprint TEXT NOT NULL,reader TEXT NOT NULL,budget TEXT NOT NULL,payload TEXT NOT NULL,touched INTEGER NOT NULL,PRIMARY KEY(asset_id,fingerprint,reader,budget));');
  return {
    async load(assetId:string,fingerprint:AssetFingerprint):Promise<HeaderClues|null>{
      const fingerprintKey=key(fingerprint);if(fingerprintKey===null)return null;
      const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_clue_cache WHERE asset_id=? AND fingerprint=? AND reader=? AND budget=? AND length(payload)<=32768',assetId,fingerprintKey,VERSION,BUDGET);
      if(!row)return null;
      let result:HeaderClues;try{result=JSON.parse(row.payload);validate(result);}catch{return null;}
      await db.runAsync('UPDATE scanner_vnext_clue_cache SET touched=? WHERE asset_id=? AND fingerprint=? AND reader=? AND budget=?',Date.now(),assetId,fingerprintKey,VERSION,BUDGET);
      return result;
    },
    async save(assetId:string,fingerprint:AssetFingerprint,result:HeaderClues,signal?:AbortSignal):Promise<boolean>{
      check(signal);if(!assetId)throw new Error('Clue asset identity required');validate(result);
      const fingerprintKey=key(fingerprint);if(fingerprintKey===null)return false;
      await db.withExclusiveTransactionAsync(async tx=>{
        check(signal);
        await tx.runAsync('INSERT INTO scanner_vnext_clue_cache VALUES(?,?,?,?,?,?) ON CONFLICT(asset_id,fingerprint,reader,budget) DO UPDATE SET payload=excluded.payload,touched=excluded.touched',assetId,fingerprintKey,VERSION,BUDGET,JSON.stringify(result),Date.now());
        check(signal);
        await tx.runAsync('DELETE FROM scanner_vnext_clue_cache WHERE rowid IN (SELECT rowid FROM scanner_vnext_clue_cache ORDER BY touched DESC,rowid DESC LIMIT -1 OFFSET 2000)');
        check(signal);
      });
      return true;
    }
  };
}
