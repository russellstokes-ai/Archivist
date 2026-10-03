export type RecommendationFamily='books'|'comics'|'audio';

export type RecommendationWorkLike={
  key:string;
  title:string;
  author:string;
  series:string;
  genre:string;
  format:string;
  available:boolean;
  readingState:'not-started'|'in-progress'|'finished';
  rating:number;
  favourite:boolean;
};

export type RecommendationResult<T>={
  family:RecommendationFamily;
  works:T[];
  personalised:boolean;
  signalCount:number;
};

function familyFor(format:string):RecommendationFamily|null{
  const value=String(format||'').trim().toLowerCase();
  if(value==='audio'||value==='audiobook')return 'audio';
  if(value==='comic'||value==='cbz'||value==='cbr'||value==='cbt')return 'comics';
  if(value==='epub'||value==='ebook'||value==='book')return 'books';
  return null;
}

function clean(value:string){return String(value||'').trim().toLowerCase();}

function add(map:Map<string,number>,value:string,score:number){
  const key=clean(value);
  if(!key||score<=0)return;
  map.set(key,(map.get(key)||0)+score);
}

function engagementScore(work:RecommendationWorkLike){
  let score=0;
  if(work.readingState==='in-progress')score+=4;
  if(work.readingState==='finished')score+=3;
  if(work.favourite)score+=3;
  if((work.rating||0)>=6)score+=Math.max(0,(work.rating-5)*.7);
  return score;
}

function resultFor<T extends RecommendationWorkLike>(items:T[],family:RecommendationFamily,limit:number):RecommendationResult<T>{
  const familyItems=items.filter(item=>familyFor(item.format)===family);
  const signals=familyItems.filter(item=>engagementScore(item)>0);
  const genres=new Map<string,number>(),authors=new Map<string,number>(),series=new Map<string,number>();
  for(const work of signals){
    const strength=engagementScore(work);
    add(genres,work.genre,strength);
    add(authors,work.author,strength);
    add(series,work.series,strength);
  }

  const candidates=familyItems.filter(item=>item.available&&item.readingState==='not-started');
  const scored=candidates.map(work=>{
    const genre=genres.get(clean(work.genre))||0;
    const author=authors.get(clean(work.author))||0;
    const seriesAffinity=series.get(clean(work.series))||0;
    const personal=genre*2.8+author*2.1+seriesAffinity*3.2;
    const librarySignal=(work.favourite?2:0)+Math.max(0,(work.rating||0)-5)*.35;
    return {work,score:personal+librarySignal,personal};
  }).sort((a,b)=>b.score-a.score||b.personal-a.personal||b.work.rating-a.work.rating||a.work.title.localeCompare(b.work.title));

  const selected:T[]=[];
  const authorsUsed=new Map<string,number>(),seriesUsed=new Map<string,number>();
  const pool=[...scored];
  while(selected.length<Math.max(0,limit)&&pool.length){
    let bestIndex=0,bestAdjusted=-Infinity;
    for(let index=0;index<pool.length;index++){
      const entry=pool[index];
      const author=clean(entry.work.author),seriesName=clean(entry.work.series);
      const diversityPenalty=(authorsUsed.get(author)||0)*2.5+(seriesName?(seriesUsed.get(seriesName)||0)*3.5:0);
      const adjusted=entry.score-diversityPenalty;
      if(adjusted>bestAdjusted){bestAdjusted=adjusted;bestIndex=index;}
    }
    const [chosen]=pool.splice(bestIndex,1);
    selected.push(chosen.work);
    const author=clean(chosen.work.author),seriesName=clean(chosen.work.series);
    if(author)authorsUsed.set(author,(authorsUsed.get(author)||0)+1);
    if(seriesName)seriesUsed.set(seriesName,(seriesUsed.get(seriesName)||0)+1);
  }

  return {family,works:selected,personalised:signals.length>=2,signalCount:signals.length};
}

export function shelfRecommendations<T extends RecommendationWorkLike>(items:T[],limit=5){
  const safeLimit=Math.max(1,Math.min(5,Math.floor(limit)||5));
  return {
    books:resultFor(items,'books',safeLimit),
    comics:resultFor(items,'comics',safeLimit),
    audio:resultFor(items,'audio',safeLimit),
  };
}

export function recommendationFamily(format:string){return familyFor(format);}
