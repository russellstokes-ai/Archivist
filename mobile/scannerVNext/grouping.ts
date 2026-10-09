import type {AssetKind} from './types';

export type GroupingAsset={assetId:string;sourceId:string;relativePath:string;kind:AssetKind};
export type GroupingEvidence={title?:string;author?:string;edition?:string;disc?:number;track?:number;manualWorkId?:string;manualEditionId?:string;provenance:'embedded'|'sidecar'|'manual_metadata'|'human_confirmed'|'unknown'};
export type OrderedPart={assetId:string;relativePath:string;disc?:number;track?:number};
export type GroupingProposal={key:string;title?:string;author?:string;priorWorkId?:string;priorEditionId?:string;parts:OrderedPart[];needsAttention:boolean;issues:string[];evidence:'manual'|'bibliographic'|'path'|'unknown'};
const normalize=(value:string)=>value.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const validNumber=(value:number|undefined)=>typeof value==='number'&&Number.isInteger(value)&&value>=1?value:undefined;
const natural=new Intl.Collator('en',{numeric:true,sensitivity:'base'});

function pathEvidence(asset:GroupingAsset){
  const segments=asset.relativePath.replace(/\\/g,'/').split('/');
  const filename=segments.pop()??'';const stem=filename.replace(/\.[^.]+$/,'');
  let folder=segments.at(-1)??'';let disc:number|undefined;let track:number|undefined;
  const root=stem.match(/^(.+?)\s+-\s+(\d+)\s+-\s+(.+)$/);
  if(root){return {key:JSON.stringify([asset.sourceId,segments.map(normalize),normalize(root[1])]),title:root[1],track:Number(root[2]),evidence:'path' as const};}
  const discFolder=folder.match(/^(?:disc|disk|cd|part)\s*(\d+)$/i);
  const namedDisc=folder.match(/^(.+?)\s+(?:disc|disk|cd)\s*(\d+)$/i);
  if(discFolder){disc=Number(discFolder[1]);segments.pop();folder=segments.at(-1)??'';}
  else if(namedDisc){disc=Number(namedDisc[2]);folder=namedDisc[1];segments[segments.length-1]=folder;}
  // A book index and a distinct part index must both be present before collapsing sibling part folders.
  const nested=folder.match(/^(.+\[\d+(?:\.\d+)?\].+?)\s+\[(\d+)\]$/);
  const pair=stem.match(/\[(\d+)-(\d+)\]$/);
  if(nested&&pair&&normalize(stem).startsWith(normalize(nested[1]))&&Number(pair[1])===Number(nested[2])){
    folder=nested[1];disc=Number(pair[1]);track=Number(pair[2]);segments[segments.length-1]=folder;
  }
  const chapter=stem.match(/(?:^|\b)(?:chapter|track)\s*(\d+)\b/i);
  const numbered=stem.match(/^(\d+)\s*[-._ ]/);
  const compressedPart=stem.match(/^(.+[a-z])P(\d+)$/i);
  if(track===undefined)track=chapter?Number(chapter[1]):compressedPart?Number(compressedPart[2]):disc!==undefined&&numbered?Number(numbered[1]):undefined;
  if(folder&&(chapter||disc!==undefined||nested&&pair))return {key:JSON.stringify([asset.sourceId,segments.map(normalize)]),title:folder,disc,track,evidence:'path' as const};
  if(folder&&compressedPart)return {key:JSON.stringify([asset.sourceId,segments.map(normalize),normalize(compressedPart[1])]),title:folder,disc,track,evidence:'path' as const};
  return {key:JSON.stringify(['asset',asset.assetId]),title:undefined,disc,track,evidence:'unknown' as const};
}

export function orderParts(parts:OrderedPart[]):OrderedPart[]{
  return [...parts].sort((a,b)=>(a.disc??1)-(b.disc??1)||(a.track??Number.MAX_SAFE_INTEGER)-(b.track??Number.MAX_SAFE_INTEGER)||natural.compare(a.relativePath,b.relativePath)||a.assetId.localeCompare(b.assetId));
}

export function groupCandidates(assets:GroupingAsset[],evidence:Record<string,GroupingEvidence>={}):GroupingProposal[]{
  const seen=new Set<string>();const groups=new Map<string,GroupingProposal>();
  const numbers=new Map<string,Set<string>>();
  for(const asset of assets){
    if(!asset.assetId||!asset.sourceId)throw new Error('Immutable asset and source IDs are required');
    if(seen.has(asset.assetId))throw new Error('Duplicate asset ID');seen.add(asset.assetId);
    const clue=evidence[asset.assetId];const inferred=asset.kind==='audio'?pathEvidence(asset):{key:JSON.stringify(['asset',asset.assetId]),title:undefined,evidence:'unknown' as const,disc:undefined,track:undefined};
    const manual=clue?.provenance==='human_confirmed'&&clue.manualWorkId;
    const bibliographic=!manual&&clue?.title?.trim()&&clue.author?.trim()&&clue.provenance!=='unknown';
    const key=manual?JSON.stringify(['manual',clue.manualWorkId,clue.manualEditionId??'unresolved-edition'])
      :bibliographic?JSON.stringify(['bibliographic',asset.sourceId,asset.kind,normalize(clue.title!),normalize(clue.author!),clue.edition?.trim()?normalize(clue.edition):inferred.key]):inferred.key;
    let group=groups.get(key);
    if(!group){
      group={key,title:manual||bibliographic?clue?.title:inferred.title,author:clue?.author,priorWorkId:manual?clue?.manualWorkId:undefined,priorEditionId:manual?clue?.manualEditionId:undefined,parts:[],needsAttention:!manual,issues:[],evidence:manual?'manual':bibliographic?'bibliographic':inferred.evidence};
      if(!manual)group.issues.push(bibliographic?'edition-and-identity-review-required':inferred.evidence==='path'?'path-only-grouping-provisional':'insufficient-grouping-evidence');
      if(manual&&!clue?.manualEditionId){group.needsAttention=true;group.issues.push('manual-edition-unresolved');}
      groups.set(key,group);
    }
    const disc=validNumber(clue?.disc)??inferred.disc;const track=validNumber(clue?.track)??inferred.track;
    if(asset.kind==='audio'&&track===undefined&&inferred.evidence==='path'){
      group.needsAttention=true;if(!group.issues.includes('missing-part-number'))group.issues.push('missing-part-number');
    }
    const numberKey=JSON.stringify([disc??1,track]);
    const groupNumbers=numbers.get(key)??new Set<string>();numbers.set(key,groupNumbers);
    if(track!==undefined&&groupNumbers.has(numberKey)){
      group.needsAttention=true;if(!group.issues.includes('duplicate-part-number'))group.issues.push('duplicate-part-number');
    }
    if(track!==undefined)groupNumbers.add(numberKey);
    group.parts.push({assetId:asset.assetId,relativePath:asset.relativePath,disc,track});
  }
  return [...groups.values()].map(group=>({...group,parts:orderParts(group.parts)})).sort((a,b)=>a.key.localeCompare(b.key));
}
