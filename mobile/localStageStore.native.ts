import * as SQLite from 'expo-sqlite';
import type {LocalBook} from './localLibrary';

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

export async function replaceLocalStageBooks(books:LocalBook[]){
  const db=await database();
  const now=Date.now();
  await db.withExclusiveTransactionAsync(async txn=>{
    await txn.runAsync('DELETE FROM local_assets');
    const statement=await txn.prepareAsync(`
      INSERT INTO local_assets(uri,root_uri,payload,ordinal,updated_at)
      VALUES ($uri,$rootUri,$payload,$ordinal,$updatedAt)
    `);
    try{
      for(let index=0;index<books.length;index++){
        const book=books[index];
        if(!book.uri)continue;
        await statement.executeAsync({
          $uri:book.uri,
          $rootUri:book.rootUri||'',
          $payload:JSON.stringify(book),
          $ordinal:index,
          $updatedAt:now,
        });
      }
    }finally{
      await statement.finalizeAsync();
    }
  });
}

export async function upsertLocalStageBooks(books:LocalBook[]){
  if(!books.length)return;
  const db=await database();
  const now=Date.now();
  await db.withExclusiveTransactionAsync(async txn=>{
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
  });
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
