import type {ScannerDatabase} from './store';
import type {GroupingProposal} from './grouping';
import {reconcileIdentities,type IdentifiedGroup} from './identity';

export type GroupingSnapshot={revision:number;groups:IdentifiedGroup[]};
export async function createGroupingStore(db:ScannerDatabase,newId:()=>string){
  await db.execAsync('CREATE TABLE IF NOT EXISTS scanner_vnext_grouping(source_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL);');
  const read=async(database:ScannerDatabase,sourceId:string):Promise<GroupingSnapshot>=>{
    const row=await database.getFirstAsync<{revision:number;payload:string}>('SELECT revision,payload FROM scanner_vnext_grouping WHERE source_id=?',sourceId);
    return row?{revision:row.revision,groups:JSON.parse(row.payload)}:{revision:0,groups:[]};
  };
  return {
    loadGrouping:(sourceId:string)=>read(db,sourceId),
    async commitGrouping(sourceId:string,proposals:GroupingProposal[],expectedRevision:number,signal?:AbortSignal):Promise<GroupingSnapshot>{
      let result:GroupingSnapshot|undefined;
      const check=()=>{if(signal?.aborted)throw new Error('Scan cancelled');};
      check();
      await db.withExclusiveTransactionAsync(async tx=>{
        check();const previous=await read(tx,sourceId);
        if(previous.revision!==expectedRevision)throw new Error('Stale grouping revision');
        if(proposals.reduce((total,g)=>total+g.parts.length,0)>100000)throw new Error('Grouping entry limit exceeded');
        for(const proposal of proposals)for(const part of proposal.parts){
          check();const stored=await tx.getFirstAsync<{source_id:string}>('SELECT source_id FROM scanner_vnext_assets WHERE asset_id=?',part.assetId);
          if(stored?.source_id!==sourceId)throw new Error('Asset outside selected source');
        }
        const groups=reconcileIdentities(proposals,previous.groups,newId);
        const assigned=new Set(groups.flatMap(g=>g.parts.map(p=>p.assetId)));
        // Missing source entries remain staged and visible; a rescan is not authority to delete a work.
        for(const prior of previous.groups){
          const missing=prior.parts.filter(p=>!assigned.has(p.assetId));
          if(!missing.length)continue;
          const active=groups.find(g=>g.editionId===prior.editionId);
          if(active){active.parts.push(...missing);active.needsAttention=true;active.issues.push('source-parts-missing');}
          else groups.push({...prior,parts:missing,needsAttention:true,issues:[...prior.issues.filter(i=>i!=='source-parts-missing'),'source-parts-missing']});
        }
        const payload=JSON.stringify(groups);
        result={revision:previous.revision+1,groups:JSON.parse(payload)};check();
        await tx.runAsync('INSERT INTO scanner_vnext_grouping VALUES(?,?,?) ON CONFLICT(source_id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',sourceId,result.revision,payload);check();
      });
      return result!;
    }
  };
}
