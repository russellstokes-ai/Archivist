import {metadataWrite} from './scannerVNext/metadataWrites';
import * as SQLite from 'expo-sqlite';
import type {LocalBook} from './localLibrary';

export type LocalStageWriteProgress={stage:'waiting'|'saving'|'committed';processed:number;total:number};
export type LocalStageWriteOptions={shouldContinue?:()=>boolean;onProgress?:(progress:LocalStageWriteProgress)=>void};

const databaseName='archivist-local.db';
let databasePromise:Promise<SQLite.SQLiteDatabase>|null=null;

async function database(){
  if(databasePromise)return databasePromise;
  databasePromise=(async()=>{
    const db=await SQLite.openDatabaseAsync(databaseName);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS local_assets (
        uri TEXT PRIMARY KEY NOT NULL,
        root_uri TEXT NOT NULL DEFAULT '',
        payload TEXT NOT NULL,
        ordinal INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS local_assets_ordinal_idx ON local_assets(ordinal);
      CREATE INDEX IF NOT EXISTS local_assets_root_idx ON local_assets(root_uri);
      CREATE TABLE IF NOT EXISTS local_stage_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    return db;
  })();
  return databasePromise;
}

function parseBook(value:unknown):LocalBook|null{
  if(typeof value!=='string'||!value)return null;
  try{
    const book=JSON.parse(value) as LocalBook;
    return book?.uri?book:null;
  }catch{return null;}
}

export async function loadLocalStageBooks():Promise<LocalBook[]>{
  const db=await database();
  const rows=await db.getAllAsync<{payload:string}>('SELECT payload FROM local_assets ORDER BY ordinal ASC');
  const books:LocalBook[]=[];
  for(const row of rows){
    const book=parseBook(row.payload);
    if(book)books.push(book);
  }
  return books;
}

export async function localStageHasAssets(){
  const db=await database();
  const row=await db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM local_assets');
  return Number(row?.count||0)>0;
}

export async function replaceLocalStageBooks(books:LocalBook[],options:LocalStageWriteOptions={}){
  const checkCurrent=()=>{
    if(options.shouldContinue?.()===false)throw new Error('Catalogue save cancelled');
  };
  const total=books.reduce((count,book)=>count+(book.uri?1:0),0);
  // Progress is observational: a UI callback must not roll back a valid save or
  // report a failed save after SQLite has already committed it.
  const report=(stage:LocalStageWriteProgress['stage'],processed:number)=>{
    try{options.onProgress?.({stage,processed,total});}catch{/* observer only */}
  };
  checkCurrent();
  report('waiting',0);
  const db=await database();
  checkCurrent();
  const now=Date.now();
  await metadataWrite(async()=>{
    // A cancelled operation may have spent time behind another database write.
    // Check again before opening the transaction, not just before enqueueing.
    checkCurrent();
    await db.withExclusiveTransactionAsync(async txn=>{
      checkCurrent();
      await txn.runAsync('DELETE FROM local_assets');
      checkCurrent();
      let processed=0;
      let values:Array<string|number>=[];
      let placeholders:string[]=[];
      report('saving',0);
      const flush=async()=>{
        if(!placeholders.length)return;
        checkCurrent();
        await txn.runAsync(
          'INSERT INTO local_assets(uri,root_uri,payload,ordinal,updated_at) VALUES '+placeholders.join(','),
          ...values,
        );
        processed+=placeholders.length;
        values=[];placeholders=[];
        checkCurrent();
        report('saving',processed);
        // Let queued UI cancellation run between bounded native writes while
        // retaining this transaction and the metadata queue's ownership.
        await new Promise<void>(resolve=>setTimeout(resolve,0));
        checkCurrent();
      };
      for(let index=0;index<books.length;index++){
        checkCurrent();
        const book=books[index];
        if(!book.uri)continue;
        values.push(book.uri,book.rootUri||'',JSON.stringify(book),index,now);
        placeholders.push('(?,?,?,?,?)');
        // 64 rows / 320 parameters: below SQLite's conservative bind limit.
        if(placeholders.length===64)await flush();
      }
      await flush();
      checkCurrent();
    });
  });
  // Never detach a timed-out write from the queue. Completion means the actual
  // transaction settled successfully, not merely that its rows were submitted.
  report('committed',total);
}

export async function upsertLocalStageBooks(books:LocalBook[]){
  if(!books.length)return;
  const db=await database();
  const now=Date.now();
  await metadataWrite(()=>db.withExclusiveTransactionAsync(async txn=>{
    const statement=await txn.prepareAsync(`
      INSERT INTO local_assets(uri,root_uri,payload,ordinal,updated_at)
      VALUES ($uri,$rootUri,$payload,COALESCE((SELECT ordinal FROM local_assets WHERE uri=$uri),(SELECT COALESCE(MAX(ordinal),-1)+1 FROM local_assets)),$updatedAt)
      ON CONFLICT(uri) DO UPDATE SET
        root_uri=excluded.root_uri,
        payload=excluded.payload,
        updated_at=excluded.updated_at
    `);
    try{
      for(const book of books){
        if(!book.uri)continue;
        await statement.executeAsync({
          $uri:book.uri,
          $rootUri:book.rootUri||'',
          $payload:JSON.stringify(book),
          $updatedAt:now,
        });
      }
    }finally{
      await statement.finalizeAsync();
    }
  }));
}

export async function migrateLegacyLocalStage(books:LocalBook[]){
  const db=await database();
  const marker=await db.getFirstAsync<{value:string}>("SELECT value FROM local_stage_meta WHERE key='legacy_migrated'");
  if(marker?.value==='1')return;
  if(books.length)await replaceLocalStageBooks(books);
  await db.runAsync(`
    INSERT INTO local_stage_meta(key,value) VALUES ('legacy_migrated','1')
    ON CONFLICT(key) DO UPDATE SET value='1'
  `);
}
