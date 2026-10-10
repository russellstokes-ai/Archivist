import type {LocalBook,LocalFolder,LocalMetadataOverride,LocalScanResult,LocalScanProgress} from '../localLibrary';
import type {LocalWork} from '../localWorks';
import type {ScannerDatabase} from './store';
import type {Source,SourceAccess} from './types';
import {createScannerPipeline,type PipelineWork,type PipelineAsset} from './pipeline';
import {createAssistController} from './assist';
import type {SearchService} from './search';
import type {WorkFields,MetadataWork} from './fieldEvidence';
import type {ArtworkResult} from './artwork';
import {createLegacyMigration} from './migration';
import type {GroupingEvidence} from './grouping';
import {normalizeGenre} from './genre';
export type ScannerBook=LocalBook&{scannerWorkId:string;scannerEditionId:string;scannerPublished:boolean;scannerOrder:number;scannerLegacyKey?:string;scannerDocumentKey?:string};
type Policy={online:boolean;automatic:boolean;explicit?:boolean;retry?:boolean};
export type RuntimePorts={access:SourceAccess;clues?:(source:Source,assets:PipelineAsset[],signal?:AbortSignal)=>Promise<WorkFields>;identityProof?:(assets:PipelineAsset[],fields:WorkFields)=>boolean;artwork:(source:Source,assets:PipelineAsset[],work:MetadataWork,signal?:AbortSignal)=>Promise<ArtworkResult>;search:Pick<SearchService,'search'>&Partial<Pick<SearchService,'more'>>};
export async function createCatalogueRuntime(db:ScannerDatabase,newId:()=>string,ports:RuntimePorts){
 let manualInputs=new Map<string,LocalMetadataOverride>();
 const pipeline=await createScannerPipeline(db,newId,{...ports,groupingEvidence(source,assets){const evidence:Record<string,GroupingEvidence>={};for(const asset of assets){const manual=manualInputs.get(documentUri(source.rootUri,asset.documentId));if(manual?.title?.trim()&&manual.author?.trim())evidence[asset.assetId]={title:manual.title,author:manual.author,provenance:'manual_metadata'};}return evidence;}}),assist=await createAssistController(db,pipeline.metadata,ports.search),migration=await createLegacyMigration(db,newId);
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_catalogue(work_id TEXT PRIMARY KEY,source_id TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS scanner_vnext_ui_ids(uri TEXT PRIMARY KEY,ui_id INTEGER NOT NULL UNIQUE);');
 await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_physical_docs(physical_key TEXT PRIMARY KEY,work_id TEXT NOT NULL);');
 const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Scan cancelled');};
 const load=async(id:string):Promise<{source:Source;entry:PipelineWork&{artworkAssets?:PipelineAsset[]};legacyKey?:string}|null>=>{const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM scanner_vnext_catalogue WHERE work_id=?',id);return row?JSON.parse(row.payload):null;};
 const persist=async(source:Source,entry:PipelineWork,legacyKey?:string)=>db.runAsync('INSERT INTO scanner_vnext_catalogue VALUES(?,?,?) ON CONFLICT(work_id) DO UPDATE SET source_id=excluded.source_id,payload=excluded.payload',entry.work.workId,source.id,JSON.stringify({source,entry,legacyKey}));
 async function uiId(uri:string,key:string){let value=0;await db.withExclusiveTransactionAsync(async tx=>{const old=await tx.getFirstAsync<{ui_id:number}>('SELECT ui_id FROM scanner_vnext_ui_ids WHERE uri=?',key);if(old){value=old.ui_id;return;}const legacy=await tx.getFirstAsync<{ui_id:number}>('SELECT ui_id FROM scanner_vnext_ui_ids WHERE uri=?',uri);if(legacy){value=legacy.ui_id;await tx.runAsync('UPDATE scanner_vnext_ui_ids SET uri=? WHERE uri=?',key,uri);return;}const max=await tx.getFirstAsync<{value:number}>('SELECT COALESCE(MAX(ui_id),0) AS value FROM scanner_vnext_ui_ids');value=(max?.value??0)+1;await tx.runAsync('INSERT INTO scanner_vnext_ui_ids VALUES(?,?)',key,value);});return value;}
 async function refresh(id:string,signal?:AbortSignal):Promise<ScannerBook[]>{
  check(signal);const stored=await load(id),work=await pipeline.metadata.get(id);if(!stored||!work)throw new Error('Unknown scanner work');
  let artwork:ArtworkResult={state:'missing'};try{artwork=await ports.artwork(stored.source,[...stored.entry.assets,...(stored.entry.artworkAssets??[])],work,signal);}catch{check(signal);artwork={state:'invalid',issues:['artwork-unavailable']};}
  const unsafe=stored.entry.assets.some(a=>['unsupported','unreadable'].includes(a.disposition.state))||stored.entry.issues.some(x=>['duplicate-part-number','manual-edition-unresolved','source-discovery-incomplete','source-parts-missing','overlapping-group-needs-review'].includes(x));
  check(signal);await pipeline.publication.publish(unsafe?{...work,identityConfirmed:false}:work,artwork,signal);check(signal);const published=await pipeline.publication.load(id),display=published??{...work,fields:{...work.fields,...(artwork.state==='ready'?{coverUri:artwork.uri}:{}),genre:normalizeGenre(work.fields.genre?[{value:work.fields.genre,source:work.manual.genre?'manual':'embedded'}]:[]).label??work.fields.genre}};
  const attention=!published||published.revision!==work.revision||stored.entry.issues.some(x=>!['path-only-grouping-provisional','insufficient-grouping-evidence','edition-and-identity-review-required','meaningful-genre-required'].includes(x));
  const books:ScannerBook[]=[];
  for(let order=0;order<stored.entry.assets.length;order++){check(signal);const asset=stored.entry.assets[order],fields=display.fields,uri=documentUri(stored.source.rootUri,asset.documentId),kind=asset.disposition.kind;
   books.push({id:await uiId(uri,physicalKey(stored.source.rootUri,asset.documentId)),scannerDocumentKey:physicalKey(stored.source.rootUri,asset.documentId),uri,title:fields.title||'Unresolved work',author:fields.author||'',series:fields.series||'',genre:fields.genre||'',seriesNumber:number(fields.seriesNumber),publishedYear:number(fields.publishedYear),narrator:fields.narrator,publisher:fields.publisher,isbn:fields.isbn,asin:fields.asin,language:fields.language,description:fields.description,coverUri:fields.coverUri,rootUri:stored.source.rootUri,space:stored.source.name,format:kind==='audio'?'Audio':kind==='comic'?'Comic':kind==='ebook'?(asset.name.toLowerCase().endsWith('.epub')?'EPUB':'Kindle'):kind==='document'?'PDF':'Unsupported',fileSize:asset.size,modificationTime:asset.modified,available:asset.present!==false&&asset.readable!==false&&asset.disposition.state!=='unsupported'&&asset.disposition.state!=='unreadable',workKey:id,editionKey:stored.entry.editionId,scannerWorkId:id,scannerEditionId:stored.entry.editionId,scannerOrder:order,scannerPublished:!!published,scannerLegacyKey:stored.legacyKey,needsReview:attention,reviewReason:attention?(stored.entry.issues.filter(x=>!work.identityConfirmed||!['path-only-grouping-provisional','insufficient-grouping-evidence','edition-and-identity-review-required'].includes(x)).join(' · ')||'Review identity, genre or artwork.'):'',metadataSource:Object.values(display.manual).some(Boolean)?'manual':'embedded',identificationConfidence:published?'high':'low',coverShape:kind==='audio'?'square':'portrait'});
  }return books;
 }
 return {assist,metadata:pipeline.metadata,refresh,
  async enrich(books:LocalBook[],policy:Policy,onRows:(rows:ScannerBook[])=>Promise<void>,signal?:AbortSignal){
   if(!policy.online||!policy.automatic)return;
   const ids=[...new Set(books.filter(book=>!(book as ScannerBook).scannerPublished).map(book=>(book as ScannerBook).scannerWorkId).filter(Boolean))];
   for(const id of ids){check(signal);const cancel=()=>assist.cancel(id);signal?.addEventListener('abort',cancel,{once:true});
    try{const result=await assist.search(id,policy),state=await result.completion;check(signal);if(state.state==='accepted')await onRows(await refresh(id,signal));}
    catch(error){check(signal);}finally{signal?.removeEventListener('abort',cancel);}
    await new Promise<void>(resolve=>setTimeout(resolve,0));
   }
  },
  async save(id:string,patch:WorkFields,policy:Policy){const work=await pipeline.metadata.get(id);if(!work)throw new Error('Unknown scanner work');return assist.save(id,patch,work.revision,policy);},
  async confirm(id:string){const work=await pipeline.metadata.get(id);if(!work)throw new Error('Unknown scanner work');return pipeline.metadata.confirmIdentity(id,work.revision);},
  async scan(folders:LocalFolder[],previous:LocalBook[],overrides:Record<string,LocalMetadataOverride>,policy:Policy,options:{signal?:AbortSignal;progress?:(value:LocalScanProgress)=>void;legacyKeys?:Map<string,string>;progressSnapshot?:Record<string,unknown>}={}):Promise<LocalScanResult>{
   const started=Date.now();let heartbeat=Date.now(),maxHeartbeatLag=0;const heartbeatTimer=setInterval(()=>{const now=Date.now();maxHeartbeatLag=Math.max(maxHeartbeatLag,now-heartbeat-50);heartbeat=now;},50);
   try{
   check(options.signal);manualInputs=new Map(previous.filter(book=>book.metadataSource==='manual').map(book=>[book.uri,toFields(book) as LocalMetadataOverride]));for(const [uri,patch]of Object.entries(overrides))manualInputs.set(uri,patch);await migration.preserve(previous.map(book=>({...book})),options.progressSnapshot??{},options.signal);
   // Reserve existing UI IDs so playback and reading references remain stable.
   for(const book of previous){if(Number.isSafeInteger(book.id)&&book.id>0)await db.runAsync('INSERT OR IGNORE INTO scanner_vnext_ui_ids VALUES(?,?)',book.uri,book.id);}
   const priorByUri=new Map(previous.map(book=>[book.uri,book]));const oldUrisByKey=new Map<string,string[]>();for(const [uri,key]of options.legacyKeys??[]){const list=oldUrisByKey.get(key)??[];list.push(uri);oldUrisByKey.set(key,list);}
   const books:ScannerBook[]=[],updated:LocalFolder[]=[];let visited=0,skipped=0,truncated=false,review=0,identified=0;
   for(const folder of folders){check(options.signal);const source={id:folder.uri,rootUri:folder.uri,name:folder.name};const result=await pipeline.scan(source,{signal:options.signal,progress:value=>options.progress?.({phase:'discovering',currentFolder:folder.name,entriesVisited:visited+(value.visited??0),found:books.length,review})});visited+=result.summary.visited;skipped+=result.summary.rejected;truncated ||= !result.summary.complete;
    const allAssets=await pipeline.store.listAssets(source.id),directoryOwners=new Map<string,Set<string>>(),artByDirectory=new Map<string,PipelineAsset[]>();
    for(const entry of result.works)for(const asset of entry.assets){const dir=asset.relativePath.replace(/\/[^/]+$/,''),owners=directoryOwners.get(dir)??new Set();owners.add(entry.work.workId);directoryOwners.set(dir,owners);}
    for(const asset of allAssets)if(asset.disposition.kind==='artwork'){const dir=asset.relativePath.replace(/\/[^/]+$/,''),list=artByDirectory.get(dir)??[];if(list.length<8)list.push(asset);artByDirectory.set(dir,list);}
    for(const entry of result.works){check(options.signal);
     const physicalKeys=entry.assets.map(a=>physicalKey(source.rootUri,a.documentId)).sort();
     const existing=await db.getFirstAsync<{ids:string}>('SELECT json_group_array(DISTINCT work_id) AS ids FROM scanner_vnext_physical_docs WHERE physical_key IN (SELECT value FROM json_each(?))',JSON.stringify(physicalKeys));
     const aliases:string[]=JSON.parse(existing?.ids??'[]');
     if(aliases.length===1&&aliases[0]!==entry.work.workId){const prior=await load(aliases[0]);if(prior){const priorKeys=prior.entry.assets.map(a=>physicalKey(prior.source.rootUri,a.documentId)).sort();if(JSON.stringify(priorKeys)===JSON.stringify(physicalKeys)){const primary=await pipeline.metadata.get(aliases[0]);if(primary){entry.work=primary;entry.editionId=prior.entry.editionId;}}else entry.issues.push('overlapping-group-needs-review');}}
     else if(aliases.length>1)entry.issues.push('overlapping-group-needs-review');
     await db.withExclusiveTransactionAsync(async tx=>{check(options.signal);for(const key of physicalKeys)await tx.runAsync('INSERT OR IGNORE INTO scanner_vnext_physical_docs VALUES(?,?)',key,entry.work.workId);check(options.signal);});
     const uris=entry.assets.map(a=>documentUri(source.rootUri,a.documentId)),legacyKeys=new Set(uris.map(uri=>options.legacyKeys?.get(uri)).filter((key):key is string=>!!key));
     let legacyKey:string|undefined;
     if(legacyKeys.size===1){const key=[...legacyKeys][0],priorUris=oldUrisByKey.get(key)??[],currentUris=new Set(uris);if(priorUris.length===uris.length&&priorUris.every(uri=>currentUris.has(uri)))legacyKey=key;}
     const stored=await load(entry.work.workId);legacyKey=stored?.legacyKey??legacyKey;
     if(!stored){const patches=uris.map(uri=>overrides[uri]??(priorByUri.get(uri)?.metadataSource==='manual'?priorByUri.get(uri):undefined)).filter(Boolean);if(patches.length&&patches.every(p=>JSON.stringify(toFields(p as LocalMetadataOverride))===JSON.stringify(toFields(patches[0] as LocalMetadataOverride)))){const patch=toFields(patches[0] as LocalMetadataOverride);entry.work=await pipeline.metadata.saveManual(entry.work.workId,patch,entry.work.revision);}
      if(!patches.length&&ports.identityProof?.(entry.assets,entry.work.fields))entry.work=await pipeline.metadata.confirmIdentity(entry.work.workId,entry.work.revision);
     }
     // Companion art is evidence for this work only when its parent is unambiguous.
     const dirs=new Set(entry.assets.map(a=>a.relativePath.replace(/\/[^/]+$/,'')));
     const uniqueDirs=[...dirs].filter(dir=>directoryOwners.get(dir)?.size===1);
     const companion=uniqueDirs.flatMap(dir=>artByDirectory.get(dir)??[]).slice(0,8);
     const withArtwork={...entry,assets:entry.assets};await persist(source,withArtwork,legacyKey);
     // The native adapter receives companions separately; they never become book parts.
     if(companion.length)await db.runAsync('UPDATE scanner_vnext_catalogue SET payload=? WHERE work_id=?',JSON.stringify({source,entry:{...withArtwork,artworkAssets:companion},legacyKey}),entry.work.workId);
     const projected=await refresh(entry.work.workId,options.signal);books.push(...projected);if(projected.some(b=>b.needsReview))review++;else identified++;
     options.progress?.({phase:'preparing',currentFolder:folder.name,entriesVisited:visited,found:books.length,review});await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    updated.push({...folder,itemCount:result.works.length,status:result.summary.complete?'Ready':'Needs attention',scannedAt:new Date().toISOString()});
   }
   const unique=new Map<string,ScannerBook>();for(const book of books){const key=book.scannerDocumentKey??book.uri,old=unique.get(key);if(!old||!old.available&&book.available)unique.set(key,book);}const logical=projectScannerWorks([...unique.values()],()=>[]);review=logical.filter(work=>work.needsReview).length;identified=logical.length-review;console.info('ScannerVNextAcceptance',JSON.stringify({scope:'fresh-runtime',elapsedMs:Date.now()-started,maxHeartbeatLag,files:unique.size,works:logical.length,published:logical.filter(work=>work.tracks.some(track=>(track as ScannerBook).scannerPublished)).length,review,visited,complete:!truncated}));return {folders:updated,books:[...unique.values()],skipped,truncated,...(truncated?{truncatedReason:'entry-limit' as const}:{}),identified,review,entriesVisited:visited};
   }finally{clearInterval(heartbeatTimer);}
  }
 };
}
export function documentUri(root:string,id:string){return root.split('/document/')[0]+'/document/'+encodeURIComponent(id);}
function physicalKey(root:string,id:string){return JSON.stringify([new URL(root).host,id]);}
const number=(value?:string)=>value?.trim()&&Number.isFinite(Number(value))?Number(value):undefined;
export function toFields(value:LocalMetadataOverride):WorkFields{const fields:WorkFields={};for(const key of ['title','author','series','seriesNumber','genre','publishedYear','narrator','publisher','isbn','asin','language','description','coverUri']as const){const item=value[key];if(item!==undefined)(fields as Record<string,string>)[key]=String(item);}return fields;}
export function projectScannerWorks(books:LocalBook[],legacy:(books:LocalBook[])=>LocalWork[]):LocalWork[]{
 const groups=new Map<string,ScannerBook[]>(),old:LocalBook[]=[];
 for(const book of books){const fresh=book as ScannerBook;if(!fresh.scannerWorkId){old.push(book);continue;}const list=groups.get(fresh.scannerWorkId)??[];list.push(fresh);groups.set(fresh.scannerWorkId,list);}
 return [...legacy(old),...[...groups].map(([id,rows])=>{const tracks=rows.sort((a,b)=>a.scannerOrder-b.scannerOrder),first=tracks[0];return {key:first.scannerLegacyKey??'scanner:'+id,logicalWorkKey:id,source:'local' as const,title:first.title,author:first.author,series:first.series,genre:first.genre,seriesNumber:first.seriesNumber,publishedYear:first.publishedYear,format:first.format,space:first.space,available:tracks.some(b=>b.available),files:tracks.length,tracks,needsReview:tracks.some(b=>b.needsReview),reviewReason:tracks.find(b=>b.needsReview)?.reviewReason??'',coverUri:first.coverUri,coverShape:first.coverShape??'portrait'};})];
}
