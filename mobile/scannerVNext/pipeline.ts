import type {ScannerDatabase} from './store';
import {createScannerStore} from './store';
import type {Source,SourceAccess,DiscoveredEntry,DiscoverySummary} from './types';
import {discoverSource} from './discovery';
import {groupCandidates,type GroupingEvidence} from './grouping';
import {createGroupingStore} from './groupingStore';
import {createMetadataStore,type MetadataWork,type WorkFields} from './fieldEvidence';
import {createPublicationStore} from './publication';
import {normalizeGenre} from './genre';
export type PipelineAsset=DiscoveredEntry&{assetId:string;present?:boolean};
export type PipelineWork={work:MetadataWork;editionId:string;assets:PipelineAsset[];needsAttention:boolean;issues:string[]};
export type AssetInspection={disposition:DiscoveredEntry['disposition'];fields:WorkFields;grouping?:GroupingEvidence};
export type PipelineProgress=Partial<DiscoverySummary>&{phase?:'discovering'|'preparing';processed?:number;total?:number};
export async function createScannerPipeline(db:ScannerDatabase,newId:()=>string,ports:{access:SourceAccess;inspect?:(source:Source,asset:PipelineAsset,signal?:AbortSignal)=>Promise<AssetInspection>;groupingEvidence?:(source:Source,assets:PipelineAsset[])=>Record<string,GroupingEvidence>;clues?:(source:Source,assets:PipelineAsset[],signal?:AbortSignal)=>Promise<WorkFields>}){
 const store=await createScannerStore(db,newId),grouping=await createGroupingStore(db,newId),metadata=await createMetadataStore(db),publication=await createPublicationStore(db);
 let running=false;
 return {metadata,publication,store,
  async scan(source:Source,options:{signal?:AbortSignal;progress?:(summary:PipelineProgress)=>void}={}):Promise<{summary:DiscoverySummary;works:PipelineWork[]}>{
   if(running)throw new Error('Scanner already running');running=true;
   const check=()=>{if(options.signal?.aborted)throw new Error('Scan cancelled');};
   try{
    const resumed=await store.beginScan(source.id),seen=new Set<string>(resumed.seen);
    const summary=await discoverSource(source,ports.access,{...store,async saveBatch(id,entries,checkpoint,signal){await store.saveBatch(id,entries,checkpoint,signal);for(const entry of entries)seen.add(entry.documentId);options.progress?.({visited:checkpoint.visited,accounted:checkpoint.accounted});}},{...options,...(resumed.checkpoint?{cursor:resumed.checkpoint.cursor,resume:{...resumed.checkpoint,seen:resumed.seen}}:{})});check();
    const assets=await store.listAssets(source.id),byId=new Map(assets.map(a=>[a.assetId,a])),prior=await grouping.loadGrouping(source.id),evidence:Record<string,GroupingEvidence>=ports.groupingEvidence?.(source,assets)??{};
    // Reconstruct counters across checkpoint resumes from the committed set.
    summary.candidates=summary.ambiguous=summary.unsupported=summary.unreadable=summary.rejected=summary.directories=0;
    for(const asset of assets.filter(a=>seen.has(a.documentId))){const key=({candidate:'candidates',ambiguous:'ambiguous',unsupported:'unsupported',unreadable:'unreadable',rejected:'rejected',directory:'directories'} as const)[asset.disposition.state];summary[key]++;}
    const inspected=new Map<string,WorkFields>();let inspectionPaused=false;
    const toInspect=assets.filter(asset=>seen.has(asset.documentId)&&!['directory','rejected','unreadable'].includes(asset.disposition.state)&&!['artwork','sidecar'].includes(asset.disposition.kind));
    if(ports.inspect)for(const [index,asset] of toInspect.entries()){
     check();if(inspectionPaused)continue;
     options.progress?.({...summary,phase:'preparing',processed:index,total:toInspect.length});
     try{const value=await ports.inspect(source,asset,options.signal);check();asset.disposition=value.disposition;inspected.set(asset.assetId,value.fields);if(!evidence[asset.assetId]&&value.grouping)evidence[asset.assetId]=value.grouping;
      await db.runAsync('UPDATE scanner_vnext_assets SET payload=? WHERE asset_id=?',JSON.stringify(asset),asset.assetId);
     }catch(error){check();const reason=String((error as {code?:string})?.code||'')+' '+String((error as Error)?.message||error);if(/circuit.open|queue.full|timeout|timed.out/i.test(reason))inspectionPaused=true;}
     options.progress?.({...summary,phase:'preparing',processed:index+1,total:toInspect.length});await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    for(const group of prior.groups)if(group.evidence==='manual')for(const part of group.parts)evidence[part.assetId]={manualWorkId:group.workId,manualEditionId:group.editionId,provenance:'human_confirmed'};
    const present=assets.filter(a=>seen.has(a.documentId)&&!['directory','rejected'].includes(a.disposition.state)&&!['artwork','sidecar','directory'].includes(a.disposition.kind)&&!(a.disposition.state==='unsupported'&&a.disposition.kind==='unknown'));
    const proposals=groupCandidates(present.map(a=>({assetId:a.assetId,sourceId:source.id,relativePath:a.relativePath,kind:a.disposition.kind})),evidence);
    const excluded=new Set(assets.filter(a=>seen.has(a.documentId)&&a.disposition.state==='unsupported'&&a.disposition.kind==='unknown').map(a=>a.assetId));
    const next=await grouping.commitGrouping(source.id,proposals,prior.revision,options.signal,excluded);check();const works:PipelineWork[]=[];let readsPaused=false;
    for(const group of next.groups){check();const members=group.parts.map(p=>byId.get(p.assetId)).filter((a):a is PipelineAsset=>!!a).map(a=>({...a,present:seen.has(a.documentId)})),issues=[...group.issues];let clues:WorkFields={};
     const existing=await metadata.get(group.workId);
     const local=members.map(a=>inspected.get(a.assetId));
     if(local.length&&local.every(Boolean)){for(const key of Object.keys(local[0]!) as (keyof WorkFields)[]){const value=local[0]![key];if(local.every(fields=>fields![key]===value))clues[key]=value;}}
     else if(!existing&&ports.clues&&!readsPaused&&!inspectionPaused&&members.some(a=>seen.has(a.documentId))){try{clues=await ports.clues(source,members,options.signal);check();}catch(error){check();issues.push('bounded-clues-unavailable');if(error instanceof Error&&/circuit-open|queue-full/.test(error.message))readsPaused=true;}}
     const defaults:WorkFields={title:group.title??members[0]?.name.replace(/\.[^.]+$/,'')??'Unresolved work',author:group.author,...clues};
     const allowed=['title','author','series','seriesNumber','isbn','asin','language','genre','coverUri','description','publisher','narrator','publishedYear'];
     for(const [key,value] of Object.entries(defaults)){if(value===undefined){delete defaults[key as keyof WorkFields];continue;}if(!allowed.includes(key)||typeof value!=='string'||value.length>(key==='description'?4096:key==='coverUri'?2048:512)){delete defaults[key as keyof WorkFields];issues.push('invalid-clue-field');}}
     let work=await metadata.ensure({workId:group.workId,revision:0,fields:defaults,fieldSources:Object.fromEntries(Object.keys(defaults).map(key=>[key,key in clues?'embedded':'filename'])),manual:{},identityConfirmed:group.evidence==='manual',partIds:group.parts.map(p=>p.assetId)});
     if(JSON.stringify([...work.partIds].sort())!==JSON.stringify(group.parts.map(p=>p.assetId).sort()))work=await metadata.updateMembership(work.workId,group.parts.map(p=>p.assetId),work.revision,options.signal);
     const published=await publication.load(work.workId);const genre=normalizeGenre(work.fields.genre?[{value:work.fields.genre,source:work.manual.genre?'manual':'embedded'}]:[]);
     if(genre.state!=='confirmed')issues.push('meaningful-genre-required');if(!summary.complete)issues.push('source-discovery-incomplete');if(members.some(a=>!seen.has(a.documentId)))issues.push('source-parts-missing');
     works.push({work,editionId:group.editionId,assets:members,needsAttention:!published||published.revision!==work.revision||issues.length>0,issues});
     options.progress?.({...summary});await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    return {summary,works};
   }finally{running=false;}
  }
 };
}
