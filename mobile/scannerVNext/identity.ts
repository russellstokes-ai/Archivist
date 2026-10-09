import type {GroupingProposal} from './grouping';

export type IdentifiedGroup=GroupingProposal & {workId:string;editionId:string;lineage:{workId:string;editionId:string}[]};

export function reconcileIdentities(proposals:GroupingProposal[],prior:IdentifiedGroup[],newId:()=>string):IdentifiedGroup[]{
  const previous=new Map<string,IdentifiedGroup>();
  for(const group of prior)for(const part of group.parts)previous.set(part.assetId,group);
  const assigned=new Set<string>();
  return proposals.map(proposal=>{
    const ancestors=new Map<string,IdentifiedGroup>();
    for(const part of proposal.parts){
      if(assigned.has(part.assetId))throw new Error('Asset assigned more than once');assigned.add(part.assetId);
      const saved=previous.get(part.assetId);
      if(saved){
        if(saved.evidence==='manual'&&proposal.evidence!=='manual')throw new Error('Manual grouping is protected');
        ancestors.set(saved.editionId,saved);
      }
    }
    const original=ancestors.size===1?[...ancestors.values()][0]:undefined;
    const members=new Set(proposal.parts.map(p=>p.assetId));
    const unchangedMembership=original&&original.parts.length===proposal.parts.length&&original.parts.every(p=>members.has(p.assetId));
    const workId=proposal.priorWorkId??(unchangedMembership?original.workId:newId());
    const editionId=proposal.priorEditionId??(unchangedMembership?original.editionId:newId());
    const changed=ancestors.size>0&&!unchangedMembership&&proposal.evidence!=='manual';
    return {...proposal,workId,editionId,needsAttention:proposal.needsAttention||changed,issues:changed?[...proposal.issues,'identity-reconciliation-required']:proposal.issues,
      lineage:[...ancestors.values()].map(g=>({workId:g.workId,editionId:g.editionId}))};
  });
}
