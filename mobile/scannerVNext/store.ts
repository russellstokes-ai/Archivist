import type {Source, DiscoveredEntry, DiscoveryCheckpoint, DiscoveryStore} from './types';

export interface ScannerDatabase {
  execAsync(sql:string):Promise<unknown>;
  runAsync(sql:string,...params:(string|number|null)[]):Promise<unknown>;
  getFirstAsync<T>(sql:string,...params:(string|number|null)[]):Promise<T|null>;
  withExclusiveTransactionAsync(action:(transaction:ScannerDatabase)=>Promise<void>):Promise<void>;
}

export async function createScannerStore(db:ScannerDatabase,newId:()=>string){
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS scanner_vnext_sources(id TEXT PRIMARY KEY,root_uri TEXT NOT NULL,name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS scanner_vnext_assets(asset_id TEXT PRIMARY KEY,source_id TEXT NOT NULL,document_id TEXT NOT NULL,payload TEXT NOT NULL,UNIQUE(source_id,document_id));
    CREATE TABLE IF NOT EXISTS scanner_vnext_checkpoints(source_id TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS scanner_vnext_issues(id TEXT PRIMARY KEY,source_id TEXT NOT NULL,reason TEXT NOT NULL,detail TEXT NOT NULL,cursor TEXT);
  `);
  const checkCancelled=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Scan cancelled');};
  const store:DiscoveryStore & {
    loadAsset(sourceId:string,documentId:string):Promise<(DiscoveredEntry & {assetId:string})|null>;
    loadCheckpoint(sourceId:string):Promise<DiscoveryCheckpoint|null>;
    listAssets(sourceId:string):Promise<(DiscoveredEntry & {assetId:string})[]>;
  }={
    async saveSource(source:Source){
      if(!source.id||!source.rootUri)throw new Error('Selected source grant is required');
      await db.withExclusiveTransactionAsync(async tx=>{
        const prior=await tx.getFirstAsync<{root_uri:string}>('SELECT root_uri FROM scanner_vnext_sources WHERE id=?',source.id);
        if(prior&&prior.root_uri!==source.rootUri)throw new Error('Source ID cannot be rebound to a different root');
        await tx.runAsync('INSERT INTO scanner_vnext_sources VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name',source.id,source.rootUri,source.name);
      });
    },
    async saveBatch(sourceId,entries,checkpoint,signal){
      checkCancelled(signal);
      await db.withExclusiveTransactionAsync(async tx=>{
        checkCancelled(signal);
        if(!await tx.getFirstAsync('SELECT id FROM scanner_vnext_sources WHERE id=?',sourceId))throw new Error('Unknown selected source');
        for(const entry of entries){
          checkCancelled(signal);
          if(!entry.documentId)throw new Error('Asset document ID is required');
          const prior=await tx.getFirstAsync<{asset_id:string}>('SELECT asset_id FROM scanner_vnext_assets WHERE source_id=? AND document_id=?',sourceId,entry.documentId);
          checkCancelled(signal);
          await tx.runAsync('INSERT INTO scanner_vnext_assets VALUES(?,?,?,?) ON CONFLICT(source_id,document_id) DO UPDATE SET payload=excluded.payload',prior?.asset_id??newId(),sourceId,entry.documentId,JSON.stringify(entry));
        }
        checkCancelled(signal);
        await tx.runAsync('INSERT INTO scanner_vnext_checkpoints VALUES(?,?) ON CONFLICT(source_id) DO UPDATE SET payload=excluded.payload',sourceId,JSON.stringify(checkpoint));
        checkCancelled(signal);
      });
    },
    async saveIssue(sourceId,issue){await db.runAsync('INSERT INTO scanner_vnext_issues VALUES(?,?,?,?,?)',newId(),sourceId,issue.reason,issue.detail,issue.cursor);},
    async loadAsset(sourceId,documentId){
      const row=await db.getFirstAsync<{asset_id:string;payload:string}>('SELECT asset_id,payload FROM scanner_vnext_assets WHERE source_id=? AND document_id=?',sourceId,documentId);
      return row?{...JSON.parse(row.payload),assetId:row.asset_id}:null;
    },
    async listAssets(sourceId){
      const assets:(DiscoveredEntry & {assetId:string})[]=[];let after=0;
      while(true){const row=await db.getFirstAsync<{payload:string}>('SELECT json_group_array(json_object(\'row\',rowid,\'id\',asset_id,\'data\',payload)) AS payload FROM (SELECT rowid,asset_id,payload FROM scanner_vnext_assets WHERE source_id=? AND rowid>? ORDER BY rowid LIMIT 128)',sourceId,after);const page: {row:number;id:string;data:string}[]=JSON.parse(row?.payload??'[]');if(!page.length)break;for(const value of page)assets.push({...JSON.parse(value.data),assetId:value.id});after=page[page.length-1].row;if(assets.length>100000)throw new Error('Source asset budget');await new Promise<void>(resolve=>setTimeout(resolve,0));}
      return assets;
    },
    async loadCheckpoint(sourceId){
      const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_checkpoints WHERE source_id=?',sourceId);
      return row?JSON.parse(row.payload):null;
    }
  };
  return store;
}
