import type {ScannerDatabase} from './store';
export type LegacyRecord={uri:string;workKey?:string;id?:number;[field:string]:unknown};
export async function createLegacyMigration(db:ScannerDatabase,newId:()=>string){
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_legacy(record_id TEXT PRIMARY KEY,uri TEXT NOT NULL UNIQUE,payload TEXT NOT NULL);');
 const get=async(uri:string):Promise<{recordId:string;book:LegacyRecord;progress:Record<string,unknown>}|null>=>{const row=await db.getFirstAsync<{record_id:string;payload:string}>('SELECT record_id,payload FROM scanner_vnext_legacy WHERE uri=?',uri);return row?{recordId:row.record_id,...JSON.parse(row.payload)}:null;};
 return {get,
  async preserve(books:LegacyRecord[],progress:Record<string,unknown>,signal?:AbortSignal){
   const check=()=>{if(signal?.aborted)throw new Error('Migration cancelled');};check();if(books.length>100000)throw new Error('Legacy migration budget');let created=0;
   // A durable private snapshot is recovery authority, not fresh grouping evidence.
   // Never infer confirmed work boundaries from a historical scanner's workKey.
   for(let offset=0;offset<books.length;offset+=128){check();await db.withExclusiveTransactionAsync(async tx=>{
    for(const book of books.slice(offset,offset+128)){check();if(typeof book.uri!=='string'||!book.uri||book.uri.length>16384||JSON.stringify(book).length>65536)throw new Error('Invalid legacy record');
     const existing=await tx.getFirstAsync('SELECT record_id FROM scanner_vnext_legacy WHERE uri=?',book.uri);if(existing)continue;
     const preserved:Record<string,unknown>={};for(const key of [book.uri,book.workKey,String(book.id??'')])if(key&&Object.prototype.hasOwnProperty.call(progress,key))preserved[key]=progress[key];
     const payload=JSON.stringify({book,progress:preserved});if(payload.length>196608)throw new Error('Legacy progress budget');await tx.runAsync('INSERT INTO scanner_vnext_legacy VALUES(?,?,?)',newId(),book.uri,payload);created++;check();
    }
   });await new Promise<void>(resolve=>setTimeout(resolve,0));}
   return {records:books.length,created};
  }
 };
}
