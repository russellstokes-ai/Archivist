import type {ScannerDatabase} from '../scannerVNext/store';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
export type EvidenceSource='manual'|'verified-id'|'embedded'|'provider'|'filename'|'neighbour'|'deep';
export type Observation={id:string;itemId:string;field:keyof WorkFields;raw:string;value:string;source:EvidenceSource;detail:string;extractorVersion:number;time:number;tier:'verified'|'corroborated'|'suggestion';fileRevision:number;supersededBy?:string};
export type ObservationInput=Omit<Observation,'id'|'supersededBy'>;
export async function initEvidence(db:ScannerDatabase){
 await db.execAsync('CREATE TABLE IF NOT EXISTS assist_evidence(id INTEGER PRIMARY KEY AUTOINCREMENT,item_id TEXT NOT NULL,field TEXT NOT NULL,source TEXT NOT NULL,detail TEXT NOT NULL,value TEXT NOT NULL,file_revision INTEGER NOT NULL,payload TEXT NOT NULL,superseded_by INTEGER); CREATE INDEX IF NOT EXISTS assist_evidence_item ON assist_evidence(item_id,superseded_by);');
}
// Caller owns the metadata transaction: evidence and resolved values commit together.
export async function appendEvidence(db:ScannerDatabase,input:ObservationInput){
 const previous=await db.getFirstAsync<{id:number;value:string;file_revision:number}>('SELECT id,value,file_revision FROM assist_evidence WHERE item_id=? AND field=? AND source=? AND detail=? AND superseded_by IS NULL ORDER BY id DESC LIMIT 1',input.itemId,input.field,input.source,input.detail);
 if(previous?.value===input.value&&previous.file_revision===input.fileRevision)return String(previous.id);
 await db.runAsync('INSERT INTO assist_evidence(item_id,field,source,detail,value,file_revision,payload) VALUES(?,?,?,?,?,?,?)',input.itemId,input.field,input.source,input.detail,input.value,input.fileRevision,JSON.stringify(input));
 const row=await db.getFirstAsync<{id:number}>('SELECT last_insert_rowid() AS id');if(!row)throw Error('Evidence was not saved');
 await db.runAsync('UPDATE assist_evidence SET superseded_by=? WHERE item_id=? AND field=? AND source=? AND detail=? AND superseded_by IS NULL AND id<>?',row.id,input.itemId,input.field,input.source,input.detail,row.id);
 return String(row.id);
}
export async function loadEvidence(db:ScannerDatabase,id:string):Promise<Observation[]>{
 const row=await db.getFirstAsync<{items:string}>("SELECT json_group_array(json_object('id',id,'payload',payload,'supersededBy',superseded_by)) AS items FROM assist_evidence WHERE item_id=?",id);
 return JSON.parse(row?.items||'[]').map((r:{id:number;payload:string;supersededBy:number|null})=>({...JSON.parse(r.payload),id:String(r.id),...(r.supersededBy!==null?{supersededBy:String(r.supersededBy)}:{})}));
}
