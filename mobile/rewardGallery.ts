import type {Achievement} from './profileStats';
/** Display only representative family medals; preserve each underlying earned tier. */
export type RewardCabinetItem=Achievement&{
  familyKey:string;earnedTiers:number;totalTiers:number;nextTier?:Achievement;
};
export function rewardCabinetEntries(achievements:readonly Achievement[]):RewardCabinetItem[]{
  const families=new Map<string,Achievement[]>();
  for(const item of achievements){
    const tier=/^(.+)-(\d+)$/.exec(item.id),key=tier?tier[1]:item.id;
    const group=families.get(key)||[];group.push(item);families.set(key,group);
  }
  return [...families].map(([familyKey,items])=>{
    const sorted=[...items].sort((a,b)=>a.target-b.target||a.id.localeCompare(b.id));
    const earned=sorted.filter(item=>item.unlocked);
    const featured=earned.length?earned[earned.length-1]:sorted[0];
    const nextTier=sorted.find(item=>!item.unlocked&&item.target>featured.target);
    const title=/^(.+?)\s*·\s*[\d,]+$/.exec(featured.title)?.[1]||featured.title;
    return {...featured,title,familyKey,earnedTiers:earned.length,totalTiers:sorted.length,...(nextTier?{nextTier}:{})};
  });
}
