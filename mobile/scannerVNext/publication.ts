import type {ScannerDatabase} from './store';
import type {MetadataWork} from './fieldEvidence';
import type {ArtworkResult} from './artwork';
import {normalizeGenre,type GenreDecision,meaningfulGenre} from './genre';
export type PublishedWork=MetadataWork&{genre:GenreDecision;artwork:ArtworkResult;publishedAt:number};
export async function createPublicationStore(db:ScannerDatabase){
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_published(work_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS scanner_vnext_staged(work_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL);');
 const load=async(id:string):Promise<PublishedWork|null>=>{const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_published WHERE work_id=?',id);return row?JSON.parse(row.payload):null;};
 return {load,
  async publish(work:MetadataWork,artwork:ArtworkResult,signal?:AbortSignal):Promise<{state:'published'|'staged'|'stale';reasons:string[]}>{
   const check=()=>{if(signal?.aborted)throw new Error('Publication cancelled');};check();
   const genre=normalizeGenre(work.fields.genre?[{value:work.fields.genre,source:work.manual.genre?'manual':'provider'}]:[]),reasons:string[]=[];
   if(!work.identityConfirmed||!work.fields.title?.trim()||!work.fields.author?.trim())reasons.push('identity-needs-review');if(!meaningfulGenre(genre))reasons.push('meaningful-genre-required');
   if(artwork.state!=='ready'||!artwork.uri||!/^(file|content):\/\//.test(artwork.uri)||!Number.isSafeInteger(artwork.bytes)||artwork.bytes!<1||artwork.bytes!>4194304||!Number.isSafeInteger(artwork.width)||!Number.isSafeInteger(artwork.height)||artwork.width!<64||artwork.height!<64||artwork.width!*artwork.height!>16777216)reasons.push('artwork-not-ready');if(!work.partIds.length)reasons.push('no-source-parts');
   let state:'published'|'staged'|'stale'='stale';
   await db.withExclusiveTransactionAsync(async tx=>{check();const current=await tx.getFirstAsync<{revision:number}>('SELECT revision FROM scanner_vnext_metadata WHERE work_id=?',work.workId);if(current?.revision!==work.revision)return;
    if(reasons.length){await tx.runAsync('INSERT INTO scanner_vnext_staged VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',work.workId,work.revision,JSON.stringify({work,genre,artwork,reasons}));state='staged';}
    else{const published:PublishedWork={...work,fields:{...work.fields,genre:genre.label,coverUri:artwork.uri},genre,artwork,publishedAt:Date.now()};await tx.runAsync('INSERT INTO scanner_vnext_published VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',work.workId,work.revision,JSON.stringify(published));check();await tx.runAsync('DELETE FROM scanner_vnext_staged WHERE work_id=?',work.workId);state='published';}check();
   });return {state,reasons};
  }
 };
}
