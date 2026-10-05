export type AchievementLike={
  id:string;
  unlocked:boolean;
  progress?:number;
  target?:number;
};

export type AchievementAwardRecord={
  id:string;
  earnedAt:string;
  celebrationShownAt?:string;
};

export type AchievementLedger={
  version:1;
  records:Record<string,AchievementAwardRecord>;
};

export const emptyAchievementLedger=():AchievementLedger=>({version:1,records:{}});

function cleanTime(value:unknown){
  if(typeof value!=='string'||!value.trim())return '';
  const time=Date.parse(value);
  return Number.isFinite(time)?new Date(time).toISOString():'';
}

export function sanitizeAchievementLedger(value:unknown):AchievementLedger{
  if(!value||typeof value!=='object'||Array.isArray(value))return emptyAchievementLedger();
  const raw=value as any;
  const source=raw.version===1&&raw.records&&typeof raw.records==='object'?raw.records:raw;
  const records:Record<string,AchievementAwardRecord>={};
  for(const [key,item] of Object.entries(source as Record<string,unknown>)){
    if(!item||typeof item!=='object'||Array.isArray(item))continue;
    const id=String((item as any).id||key||'').trim();
    const earnedAt=cleanTime((item as any).earnedAt);
    if(!id||!earnedAt)continue;
    const shown=cleanTime((item as any).celebrationShownAt);
    records[id]={id,earnedAt,...(shown?{celebrationShownAt:shown}:{})};
  }
  return {version:1,records};
}

export function mergeAchievementLedgers(a:AchievementLedger,b:AchievementLedger):AchievementLedger{
  const left=sanitizeAchievementLedger(a),right=sanitizeAchievementLedger(b);
  const records={...left.records};
  for(const [id,incoming] of Object.entries(right.records)){
    const current=records[id];
    if(!current){records[id]={...incoming};continue;}
    const earnedAt=current.earnedAt<=incoming.earnedAt?current.earnedAt:incoming.earnedAt;
    const shown=[current.celebrationShownAt,incoming.celebrationShownAt].filter(Boolean).sort()[0];
    records[id]={id,earnedAt,...(shown?{celebrationShownAt:shown}:{})};
  }
  return {version:1,records};
}

export function reconcileAchievementLedger(
  achievements:AchievementLike[],
  current:AchievementLedger,
  options:{now?:string;suppressNew?:boolean;suppressIds?:string[]}={},
){
  const now=cleanTime(options.now)||new Date().toISOString();
  const ledger=sanitizeAchievementLedger(current);
  const suppress=new Set(options.suppressIds||['first-shelf']);
  const newlyEarned:string[]=[];
  let changed=false;
  for(const item of achievements){
    if(!item?.unlocked||!String(item.id||'').trim())continue;
    const id=String(item.id);
    if(ledger.records[id])continue;
    const celebrationShownAt=options.suppressNew||suppress.has(id)?now:undefined;
    ledger.records[id]={id,earnedAt:now,...(celebrationShownAt?{celebrationShownAt}:{})};
    if(!celebrationShownAt)newlyEarned.push(id);
    changed=true;
  }
  return {ledger,newlyEarned,changed};
}

export function pendingAchievementIds(achievements:AchievementLike[],ledger:AchievementLedger){
  const unlocked=new Set(achievements.filter(item=>item.unlocked).map(item=>item.id));
  return Object.values(sanitizeAchievementLedger(ledger).records)
    .filter(record=>unlocked.has(record.id)&&!record.celebrationShownAt)
    .sort((a,b)=>a.earnedAt.localeCompare(b.earnedAt)||a.id.localeCompare(b.id))
    .map(record=>record.id);
}

export function claimAchievementCelebration(
  achievements:AchievementLike[],
  current:AchievementLedger,
  nowInput?:string,
){
  const now=cleanTime(nowInput)||new Date().toISOString();
  const ledger=sanitizeAchievementLedger(current);
  const id=pendingAchievementIds(achievements,ledger)[0];
  if(!id)return {ledger,id:null as string|null,changed:false};
  const record=ledger.records[id];
  ledger.records[id]={...record,celebrationShownAt:now};
  return {ledger,id,changed:true};
}

export function markUnlockedAchievementsShown(
  achievements:AchievementLike[],
  current:AchievementLedger,
  nowInput?:string,
){
  return reconcileAchievementLedger(achievements,current,{now:nowInput,suppressNew:true}).ledger;
}
