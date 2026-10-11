import type {Achievement} from './profileStats';

export type RewardMotionKind='books-stack'|'headphones'|'trophy'|'crown'|'badge'|'level-confetti';
export type RewardPresentation={kind:RewardMotionKind;major:boolean;firework:boolean;levelConfetti:boolean;title:string;description:string};

/** Presentation only: categorisation does not change achievement IDs, XP or ledger. */
export function motionForAchievement(item:Achievement):RewardPresentation {
  const id=String(item.id||'');
  const category=item.category||'Other';
  const number=Number(id.match(/-(\d+)$/)?.[1]||0);
  const prestige=id==='deep-archive'||id==='curator'||
    (id.startsWith('collection-')&&number>=1000)||
    (id.startsWith('finished-')&&number>=500)||
    (id.startsWith('reader-')&&number>=250)||
    (id.startsWith('listener-')&&number>=250)||
    (id.startsWith('streak-')&&number>=365);
  const meaningful=id==='ten-finished'||id==='format-explorer'||
    (id.startsWith('finished-')&&number>=100)||
    (id.startsWith('collection-')&&number>=500);
  let kind:RewardMotionKind='badge';
  if(prestige)kind='crown';
  else if(id==='first-finish'||meaningful)kind='trophy';
  else if(category==='Listening'||id.startsWith('listener-')||id.startsWith('audio-'))kind='headphones';
  else if(category==='Reading'||id.startsWith('reading-')||id.startsWith('collection')||
    id.startsWith('series')||id.startsWith('active-stack')||id.startsWith('starter')||
    id==='first-shelf'||id==='series-keeper')kind='books-stack';
  else if(category==='Library'&&(/collection|shelf|archive|series/.test(id)))kind='books-stack';
  return {kind,major:prestige||meaningful,firework:prestige||meaningful,levelConfetti:false,
    title:item.title,description:item.description};
}

export function motionForLevelUp(level:number):RewardPresentation {
  const safe=Math.max(1,Math.floor(level));
  const prestige=[10,25,40,60].includes(safe);
  const major=prestige||safe%5===0;
  return {
    kind:prestige?'crown':'level-confetti',
    major,
    firework:[25,40,60].includes(safe),
    levelConfetti:prestige,
    title:'Level '+safe+' unlocked',
    description:prestige?'A new chapter in your Archivist journey.':'Your reading life has reached a new level.',
  };
}

export const REWARD_BASE_DISPLAY_MS=3000;
export const REWARD_FADE_MS=260;
export const REWARD_FINAL_FRAME_HOLD_MS=200;

/** Keep the native animation speed and real last frame; never truncate 4–5s sources. */
export const REWARD_SOURCE_DURATION_MS:Record<RewardMotionKind,number>={
  'books-stack':4000,
  headphones:500,
  trophy:4000,
  crown:5042,
  badge:4037,
  'level-confetti':1667,
};

export function rewardPresentationMs(kind:RewardMotionKind){
  return Math.max(REWARD_BASE_DISPLAY_MS,Math.ceil(REWARD_SOURCE_DURATION_MS[kind])+REWARD_FINAL_FRAME_HOLD_MS+REWARD_FADE_MS);
}
