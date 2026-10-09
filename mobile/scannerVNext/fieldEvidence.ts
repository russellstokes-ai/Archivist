import type {ScannerDatabase} from './store';
import {rankCandidates,type Candidate,type SearchFields,type SearchCache,type SearchResult} from './search';
export type WorkFields=SearchFields&Partial<Record<'genre'|'coverUri'|'description'|'publisher'|'narrator'|'publishedYear',string>>;
export type MetadataWork={workId:string;revision:number;fields:WorkFields;manual:Record<string,boolean|undefined>;identityConfirmed:boolean;partIds:string[]};
const fields=['title','author','series','seriesNumber','isbn','asin','language','genre','coverUri','description','publisher','narrator','publishedYear'] as const;
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Metadata save cancelled');};
function validate(value:MetadataWork){
 if(!value.workId||value.workId.length>128||!Number.isSafeInteger(value.revision)||value.revision<0||value.partIds.length>100000||new Set(value.partIds).size!==value.partIds.length||value.partIds.some(id=>typeof id!=='string'||!id||id.length>128))throw new Error('Invalid work metadata identity');
 for(const [key,data] of Object.entries(value.fields))if(!fields.includes(key as typeof fields[number])||typeof data!=='string'||data.length>(key==='description'?4096:key==='coverUri'?2048:512))throw new Error('Invalid metadata field');
}
export async function createMetadataStore(db:ScannerDatabase){
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_metadata(work_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL);');
 const load=async(database:ScannerDatabase,id:string):Promise<MetadataWork|null>=>{const row=await database.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_metadata WHERE work_id=?',id);if(!row)return null;const value=JSON.parse(row.payload);validate(value);return value;};
 const write=async(database:ScannerDatabase,value:MetadataWork)=>{validate(value);await database.runAsync('INSERT INTO scanner_vnext_metadata VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',value.workId,value.revision,JSON.stringify(value));};
 async function mutate(id:string,expected:number,action:(work:MetadataWork)=>void,signal?:AbortSignal){
  check(signal);let updated:MetadataWork|undefined;await db.withExclusiveTransactionAsync(async tx=>{check(signal);const work=await load(tx,id);if(!work)throw new Error('Unknown work');if(work.revision!==expected)throw new Error('Stale metadata revision');action(work);work.revision++;check(signal);await write(tx,work);check(signal);updated=work;});return updated!;
 }
 return {
  get:(id:string)=>load(db,id),
  updateMembership:(id:string,partIds:string[],expected:number,signal?:AbortSignal)=>mutate(id,expected,work=>{work.partIds=[...partIds];work.identityConfirmed=false;},signal),
  async ensure(value:MetadataWork){validate(value);let result:MetadataWork|undefined;await db.withExclusiveTransactionAsync(async tx=>{result=await load(tx,value.workId)??value;if(result===value)await write(tx,value);});return result!;},
  saveManual:(id:string,patch:WorkFields,expected:number,signal?:AbortSignal)=>mutate(id,expected,work=>{for(const [key,value] of Object.entries(patch)){if(value===undefined)continue;if(!fields.includes(key as typeof fields[number])||typeof value!=='string')throw new Error('Unknown manual field');const next=value.trim();if(['title','author','series','seriesNumber','isbn','asin'].includes(key)&&work.fields[key as keyof WorkFields]!==next)work.identityConfirmed=false;(work.fields as Record<string,string>)[key]=next;work.manual[key]=!!next;}},signal),
  accept:(id:string,candidate:Candidate,expected:number,options:{confirmIdentityConflicts?:boolean;signal?:AbortSignal}={})=>mutate(id,expected,work=>{
   const ranked=rankCandidates(work.fields,[candidate])[0];if(ranked.conflicts.length&&!options.confirmIdentityConflicts)throw new Error('Candidate conflict requires confirmation');
   if(candidate.anthology)throw new Error('Anthology cannot identify an individual story');
   for(const [key,value] of Object.entries(candidate.fields)){
    const target=key==='coverUrl'?'coverUri':key;if(!fields.includes(target as typeof fields[number])||typeof value!=='string'||!value.trim())continue;
    const identity=['title','author','series','seriesNumber','isbn','asin'].includes(target);
    if(work.manual[target]&&!(identity&&options.confirmIdentityConflicts))continue;
    if(!identity&&work.fields[target as keyof WorkFields])continue;
    (work.fields as Record<string,string>)[target]=value.trim();
   }
   work.identityConfirmed=true;
  },options.signal),
 };
}
function validResult(value:SearchResult){
 if(!value||!['review','no-match','offline','disabled','pending'].includes(value.state)||!Array.isArray(value.candidates)||value.candidates.length>200||!Array.isArray(value.issues))throw new Error('Invalid cached search');
 for(const row of value.candidates){if(!row.candidate||typeof row.candidate.id!=='string'||typeof row.candidate.provider!=='string'||!Number.isFinite(row.score)||!Array.isArray(row.conflicts)||typeof row.automaticEligible!=='boolean'||!Array.isArray(row.candidate.identifiers))throw new Error('Invalid cached candidate');for(const field of Object.values(row.candidate.fields))if(typeof field!=='string'||field.length>4096)throw new Error('Cached candidate field budget');}
}
export async function createSearchCache(db:ScannerDatabase):Promise<SearchCache>{
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_search_cache(cache_key TEXT PRIMARY KEY,payload TEXT NOT NULL,touched INTEGER NOT NULL);');
 return {
  async load(key){const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_search_cache WHERE cache_key=? AND length(payload)<=524288',key);if(!row)return null;try{const value=JSON.parse(row.payload);if(!Number.isFinite(value.expires))return null;validResult(value.value);return value;}catch{return null;}},
  async save(key,value,signal){check(signal);validResult(value.value);if(key.length>8192||!Number.isFinite(value.expires)||JSON.stringify(value).length>524288)throw new Error('Search cache budget');await db.withExclusiveTransactionAsync(async tx=>{check(signal);await tx.runAsync('INSERT INTO scanner_vnext_search_cache VALUES(?,?,?) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,touched=excluded.touched',key,JSON.stringify(value),Date.now());check(signal);await tx.runAsync('DELETE FROM scanner_vnext_search_cache WHERE rowid IN (SELECT rowid FROM scanner_vnext_search_cache ORDER BY touched DESC,rowid DESC LIMIT -1 OFFSET 2000)');check(signal);});},
 };
}
