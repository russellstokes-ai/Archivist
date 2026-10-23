import type {ScannerDatabase} from '../scannerVNext/store';
// Explicit allowlist excludes credentials, document grants, covers and backup paths.
const allowed=new Set(('id sourceId work workId itemId assetId editionId revision fields manual fieldSources provenance identification identityConfirmed partIds rung provider candidateId conflicts selectedAt entry assets parts groups issues needsAttention evidence title author series seriesNumber isbn asin language genre publisher narrator publishedYear relativePath disposition state kind reason disc track source detail field raw value tier fileRevision extractorVersion time supersededBy stage attempts nextAttemptAt generation present name size').split(' '));
export function diagnosticValue(value:unknown,depth=0):unknown {
 if(depth>12)return '[depth limit]';
 if(typeof value==='string')return value.replace(/(?:https?|content|file):\/\/[^\s"<>]+/gi,'[address removed]').replace(/[A-Z]:[\\/][^\s"<>]+/gi,'[path removed]').replace(/(?:^|\s)\/(?:storage|data|sdcard|Users|home)\/[^\s"<>]+/g,' [path removed]').slice(0,1024);
 if(value===null||typeof value==='number'||typeof value==='boolean')return value;
 if(Array.isArray(value))return value.slice(0,1000).map(v=>diagnosticValue(v,depth+1));
 if(typeof value==='object')return Object.fromEntries(Object.entries(value as Record<string,unknown>).filter(([k])=>allowed.has(k)).map(([k,v])=>[k,diagnosticValue(v,depth+1)]));
 return undefined;
}
export async function collectAssistDiagnostics(db:ScannerDatabase,appVersion:string){
 const sections:Record<string,unknown>={};
 // Read only: no runtime startup, network requests, hashing or queue mutations.
 for(const [name,table]of Object.entries({catalogue:'scanner_vnext_catalogue',metadata:'scanner_vnext_metadata',grouping:'scanner_vnext_grouping',jobs:'assist_jobs',evidence:'assist_evidence'})){
  const exists=await db.getFirstAsync<{name:string}>('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?',table);
  if(!exists){sections[name]={available:false};continue;}
  const count=await db.getFirstAsync<{total:number}>(`SELECT count(*) AS total FROM ${table}`);
  const projection=name==='evidence'?"json_set(payload,'$.id',id,'$.supersededBy',superseded_by) AS payload":name==='grouping'?"json_object('sourceId',source_id,'groups',json(payload)) AS payload":'payload';
  const result=await db.getFirstAsync<{rows:string}>(`SELECT json_group_array(payload) AS rows FROM (SELECT ${projection} FROM ${table} ORDER BY rowid DESC LIMIT 500)`);
  const rows:unknown[]=JSON.parse(result?.rows||'[]').map((payload:string)=>{try{return diagnosticValue(JSON.parse(payload));}catch{return {reason:'invalid stored JSON'};}});
  sections[name]={total:count?.total??0,included:rows.length,truncated:(count?.total??0)>rows.length,rows};
 }
 const receipts=await db.getFirstAsync<{name:string}>('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?','scanner_vnext_file_writes');
 if(receipts){const result=await db.getFirstAsync<{rows:string}>("SELECT json_group_array(json_object('workId',work_id,'state',state)) AS rows FROM (SELECT work_id,state FROM scanner_vnext_file_writes ORDER BY rowid DESC LIMIT 500)");sections.fileWrites=JSON.parse(result?.rows||'[]');}
 return {schema:'archivist-assist-diagnostics-v1',appVersion,createdAt:new Date().toISOString(),notes:'Contains library names and relative filenames. Addresses, credentials, book contents and covers are excluded. Latest 500 records per section; arrays limited to 1000 and text to 1024 characters. Live queues may change during export. Provider responses not retained in evidence are not included.',sections};
}
