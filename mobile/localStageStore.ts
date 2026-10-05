import * as SQLite from 'expo-sqlite';
import type {LocalBook} from './localLibrary';
import type {LocalEnrichmentCache,LocalEnrichmentCacheEntry} from './localEnrichment';

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
        payload TEXT NOT NULL,
        scan_generation TEXT NOT NULL,
        ordinal INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS local_assets_generation_idx ON local_assets(scan_generation);
      CREATE INDEX IF NOT EXISTS local_assets_ordinal_idx ON local_assets(ordinal);
      CREATE TABLE IF NOT EXISTS local_enrichment (
        fingerprint TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_stage_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    return db;
  })();
  return databasePromise;
}

function parseJSON<T>(value:unknown):T|null{
  if(typeof value!=='string'||!value)return null;
  try{return JSON.parse(value) as T;}catch{return null;}
}

export async function loadLocalStage(){
  const db=await database();
  const [assetRows,enrichmentRows]=await Promise.all([
    db.getAllAsync<{payload:string}>('SELECT payload FROM local_assets ORDER BY ordinal ASC'),
    db.getAllAsync<{fingerprint:string;payload:string}>('SELECT fingerprint,payload FROM local_enrichment'),
  ]);
  const books:LocalBook[]=[];
  for(const row of assetRows){
    const book=parseJSON<LocalBook>(row.payload);
    if(book?.uri)books.push(book);
  }
  const cache:LocalEnrichmentCache={};
  for(const row of enrichmentRows){
    const entry=parseJSON<LocalEnrichmentCacheEntry>(row.payload);
    if(entry?.fingerprint)cache[row.fingerprint]=entry;
  }
  return {books,cache};
}

export async function localStageHasAssets(){
  const db=await database();
  const row=await db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM local_assets');
  return Number(row?.count||0)>0;
}

export async function replaceLocalStageBooks(books:LocalBook[]){
  const db=await database();
  const generation=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const updatedAt=Date.now();
  await db.withExclusiveTransactionAsync(async txn=>{
    const statement=await txn.prepareAsync(`
      INSERT INTO local_assets(uri,payload,scan_generation,ordinal,updated_at)
      VALUES ($uri,$payload,$generation,$ordinal,$updatedAt)
      ON CONFLICT(uri) DO UPDATE SET
        payload=excluded.payload,
        scan_generation=excluded.scan_generation,
        ordinal=excluded.ordinal,
        updated_at=excluded.updated_at
    `);
    try{
      for(let index=0;index<books.length;index++){
        const book=books[index];
        if(!book.uri)continue;
        await statement.executeAsync({
          $uri:book.uri,
          $payload:JSON.stringify(book),
          $generation:generation,
          $ordinal:index,
          $updatedAt:updatedAt,
        });
      }
    }finally{
      await statement.finalizeAsync();
    }
    await txn.runAsync('DELETE FROM local_assets WHERE scan_generation <> ?',generation);
    await txn.runAsync(
      `INSERT INTO local_stage_meta(key,value) VALUES ('last_scan_generation',?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      generation,
    );
  });
}

export async function upsertLocalStageBooks(books:LocalBook[]){
  if(!books.length)return;
  const db=await database();
  const updatedAt=Date.now();
  await db.withExclusiveTransactionAsync(async txn=>{
    const statement=await txn.prepareAsync(`
      UPDATE local_assets
      SET payload=$payload,updated_at=$updatedAt
      WHERE uri=$uri
    `);
    try{
      for(const book of books){
        if(!book.uri)continue;
        await statement.executeAsync({
          $uri:book.uri,
          $payload:JSON.stringify(book),
          $updatedAt:updatedAt,
        });
      }
    }finally{
      await statement.finalizeAsync();
    }
  });
}

export async function upsertLocalEnrichmentEntries(entries:LocalEnrichmentCacheEntry[]){
  if(!entries.length)return;
  const db=await database();
  const updatedAt=Date.now();
  await db.withExclusiveTransactionAsync(async txn=>{
    const statement=await txn.prepareAsync(`
      INSERT INTO local_enrichment(fingerprint,payload,updated_at)
      VALUES ($fingerprint,$payload,$updatedAt)
      ON CONFLICT(fingerprint) DO UPDATE SET
        payload=excluded.payload,
        updated_at=excluded.updated_at
    `);
    try{
      for(const entry of entries){
        await statement.executeAsync({
          $fingerprint:entry.fingerprint,
          $payload:JSON.stringify(entry),
          $updatedAt:updatedAt,
        });
      }
    }finally{
      await statement.finalizeAsync();
    }
  });
}

export async function replaceLocalEnrichmentCache(cache:LocalEnrichmentCache){
  const db=await database();
  const entries=Object.values(cache);
  const updatedAt=Date.now();
  await db.withExclusiveTransactionAsync(async txn=>{
    await txn.runAsync('DELETE FROM local_enrichment');
    const statement=await txn.prepareAsync(`
      INSERT INTO local_enrichment(fingerprint,payload,updated_at)
      VALUES ($fingerprint,$payload,$updatedAt)
    `);
    try{
      for(const entry of entries){
        await statement.executeAsync({
          $fingerprint:entry.fingerprint,
          $payload:JSON.stringify(entry),
          $updatedAt:updatedAt,
        });
      }
    }finally{
      await statement.finalizeAsync();
    }
  });
}

export async function migrateLegacyLocalStage(books:LocalBook[],cache:LocalEnrichmentCache){
  const db=await database();
  const marker=await db.getFirstAsync<{value:string}>(
    "SELECT value FROM local_stage_meta WHERE key='legacy_migrated'",
  );
  if(marker?.value==='1')return;
  if(books.length)await replaceLocalStageBooks(books);
  if(Object.keys(cache).length)await replaceLocalEnrichmentCache(cache);
  await db.runAsync(
    `INSERT INTO local_stage_meta(key,value) VALUES ('legacy_migrated','1')
     ON CONFLICT(key) DO UPDATE SET value='1'`,
  );
}
