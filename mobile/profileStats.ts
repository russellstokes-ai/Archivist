export type VerifiedProfileStats = {
  name: string;
  owner: boolean;
  works: number;
  formats: number;
  series: number;
  startedAudio: number;
  completedAudio: number;
  inProgressAudio: number;
  startedReading: number;
  completedReading: number;
  inProgressReading: number;
  inProgress: number;
  completed: number;
  rated?: number;
  favourites?: number;
  averageRating?: number;
  bestStreak?: number;
  activeDays?: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  category?: string;
};

export type ProgressionPathId = 'Reading'|'Listening'|'Library'|'Ritual';
export type ProgressionLevel = {
  level:number;
  xp:number;
  levelStartXp:number;
  nextLevelXp:number;
  progress:number;
  title:string;
};
export type ArchivistProgression = {
  overall:ProgressionLevel;
  paths:Record<ProgressionPathId,ProgressionLevel>;
  totalXp:number;
  unlockedAchievements:number;
};

function achievement(id: string, title: string, description: string, progress: number, target: number): Achievement {
  return {id,title,description,progress:Math.max(0,progress),target,unlocked:progress>=target};
}

export function achievementsFor(stats: VerifiedProfileStats): Achievement[] {
  const totalStarted = stats.startedAudio + stats.startedReading;
  const totalInProgress = stats.inProgressAudio + stats.inProgressReading;
  const balancedFormats = (stats.completedAudio>0?1:0)+(stats.completedReading>0?1:0);
  return [
    achievement('first-shelf','First shelf','Add your first work to Archivist.',stats.works,1),
    achievement('format-explorer','Format explorer','Build a library across three different media formats.',stats.formats,3),
    achievement('series-keeper','Series keeper','Catalogue five distinct series.',stats.series,5),
    achievement('first-finish','First finish','Finish your first book, comic or audiobook.',stats.completed,1),
    achievement('ten-finished','Ten finished','Finish ten works.',stats.completed,10),
    achievement('curator','Curator','Build a library of 100 works.',stats.works,100),
    achievement('deep-archive','Deep archive','Build a library of 1,000 works.',stats.works,1000),
    ...tiers('collection','The growing library','Library',stats.works,[5,10,25,50,250,500,2000,5000],'works collected'),
    ...tiers('collection-deep','Archivist shelves','Library',stats.works,[75,150,300,750,1500,3000,7500,10000],'works in the archive'),
    ...tiers('finished','Stories completed','Reading',stats.completed,[3,5,25,50,100,250,500,1000,2000],'works finished'),
    ...tiers('starter','First chapters','Reading',totalStarted,[1,5,10,25,50,100,250,500],'works started'),
    ...tiers('active-stack','In the stack','Reading',totalInProgress,[1,3,5,10,20,40],'works currently in progress'),
    ...tiers('reader','Between the pages','Reading',stats.completedReading,[1,5,10,25,50,100,250,500],'books or comics finished'),
    ...tiers('listener','A world in your ears','Listening',stats.completedAudio,[1,5,10,25,50,100,250,500],'audiobooks finished'),
    ...tiers('audio-start','Pressed play','Listening',stats.startedAudio,[1,3,10,25,50,100,250],'audiobooks started'),
    ...tiers('reading-start','Opened the cover','Reading',stats.startedReading,[1,3,10,25,50,100,250],'books or comics started'),
    ...tiers('rating','Your considered opinion','Library',stats.rated||0,[1,5,10,25,50,100,250,500],'works rated'),
    ...tiers('favourite','Worth keeping close','Library',stats.favourites||0,[1,5,10,25,50,100,250],'favourites chosen'),
    ...tiers('series','Following the thread','Library',stats.series,[1,3,10,25,50,100,250],'series collected'),
    ...tiers('format','Many forms','Library',stats.formats,[1,2,3,4,5],'formats represented'),
    ...tiers('balance','Across the shelf','Library',balancedFormats,[2],'media habits balanced'),
    ...tiers('streak','A daily ritual','Daily ritual',stats.bestStreak||0,[2,3,5,7,10,14,21,30,45,60,90,120,180,270,365,500,730],'consecutive active days'),
    ...tiers('days','Time well spent','Daily ritual',stats.activeDays||0,[1,3,7,14,30,60,100,180,250,365,500,730,1000,1500],'active days in total'),
    ...tiers('daily-spark','The daily spark','Daily ritual',stats.activeDays||0,[2,5,10,20,40,80,160,320],'active reading days'),
  ];
}

function tiers(id:string,title:string,category:string,progress:number,targets:number[],unit:string):Achievement[]{
  return targets.map(target=>({...achievement(`${id}-${target}`,`${title} · ${target}`,`${target} ${unit}.`,progress,target),category}));
}

export function localDay(date=new Date()):string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

// Calendar ordinals avoid daylight-saving days being 23 or 25 hours long.
export function streakStats(secondsByDay:Record<string,number>,today=localDay()){
  const ordinal=(day:string)=>{const [y,m,d]=day.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;};
  const days=Object.entries(secondsByDay).filter(([day,seconds])=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&day<=today&&seconds>=60).map(([day])=>ordinal(day)).sort((a,b)=>a-b);
  let bestStreak=0,run=0,previous=-Infinity;
  for(const day of days){run=day===previous+1?run+1:1;bestStreak=Math.max(bestStreak,run);previous=day;}
  return {bestStreak,currentStreak:previous>=ordinal(today)-1?run:0,activeDays:days.length,todaySeconds:Math.min(60,secondsByDay[today]||0)};
}

export function clampProgress(progress: number, target: number) {
  if (target <= 0) return 1;
  return Math.max(0,Math.min(1,progress/target));
}

function progressionFloor(level:number){
  const step=Math.max(0,Math.floor(level)-1);
  return Math.round(step*260+70*Math.pow(step,1.72));
}

function overallTitle(level:number){
  if(level>=60)return 'Master Archivist';
  if(level>=40)return 'Senior Archivist';
  if(level>=25)return 'Archivist';
  if(level>=15)return 'Curator';
  if(level>=10)return 'Collector';
  if(level>=5)return 'Explorer';
  return 'Reader';
}

function pathTitle(path:ProgressionPathId,level:number){
  const bands=level>=25?3:level>=12?2:level>=5?1:0;
  const titles:Record<ProgressionPathId,string[]> = {
    Reading:['Page Turner','Story Keeper','Deep Reader','Literary Scholar'],
    Listening:['Listener','Story Listener','Audio Voyager','Master Listener'],
    Library:['Collector','Shelf Keeper','Curator','Archive Keeper'],
    Ritual:['Starter','Steady Reader','Ritual Keeper','Reading Constant'],
  };
  return titles[path][bands];
}

export function levelFromXp(rawXp:number,title:(level:number)=>string=overallTitle):ProgressionLevel{
  const xp=Math.max(0,Math.round(Number.isFinite(rawXp)?rawXp:0));
  let level=1;
  while(level<999&&xp>=progressionFloor(level+1))level++;
  const levelStartXp=progressionFloor(level);
  const nextLevelXp=progressionFloor(level+1);
  return {level,xp,levelStartXp,nextLevelXp,progress:clampProgress(xp-levelStartXp,nextLevelXp-levelStartXp),title:title(level)};
}

export function progressionFor(stats:VerifiedProfileStats):ArchivistProgression{
  const readingXp=Math.round(Math.max(0,stats.completedReading)*160+Math.max(0,stats.startedReading)*28);
  const listeningXp=Math.round(Math.max(0,stats.completedAudio)*160+Math.max(0,stats.startedAudio)*28);
  const libraryXp=Math.round(
    // Library growth matters, but passive importing must not outrank actually reading.
    Math.sqrt(Math.max(0,stats.works))*70+
    Math.max(0,stats.series)*22+
    Math.max(0,stats.formats)*55+
    Math.max(0,stats.favourites||0)*6+
    Math.max(0,stats.rated||0)*5
  );
  const ritualXp=Math.round(Math.max(0,stats.activeDays||0)*40+Math.max(0,stats.bestStreak||0)*55);
  const unlockedAchievements=achievementsFor(stats).filter(item=>item.unlocked).length;
  const totalXp=readingXp+listeningXp+libraryXp+ritualXp+unlockedAchievements*18;
  return {
    overall:levelFromXp(totalXp,overallTitle),
    paths:{
      Reading:levelFromXp(readingXp,level=>pathTitle('Reading',level)),
      Listening:levelFromXp(listeningXp,level=>pathTitle('Listening',level)),
      Library:levelFromXp(libraryXp,level=>pathTitle('Library',level)),
      Ritual:levelFromXp(ritualXp,level=>pathTitle('Ritual',level)),
    },
    totalXp,
    unlockedAchievements,
  };
}

