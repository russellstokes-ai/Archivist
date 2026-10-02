export type InsightWork={
  key:string;
  canonicalKey:string;
  title:string;
  author:string;
  format:string;
  readingState:'not-started'|'in-progress'|'finished';
  rating:number;
  favourite:boolean;
};
export type InsightAnnotation={id:string;workKey:string;page:number;kind:'highlight'|'note';text:string;note?:string;createdAt:string};
export type ProfileActivity={id:number;workId:number;title:string;author:string;kind:'Listening'|'Reading';startedAt:number;updatedAt:number;activeSeconds:number;events:number;completed:boolean};
export type InsightGoal={completedTarget:number;annotationTarget:number};
export const defaultInsightGoal:InsightGoal={completedTarget:12,annotationTarget:24};

export function sanitizeInsightGoal(raw:unknown):InsightGoal{
  const value=(raw&&typeof raw==='object'?raw:{}) as any;
  return {
    completedTarget:Math.max(1,Math.min(1000,Math.round(Number(value.completedTarget)||defaultInsightGoal.completedTarget))),
    annotationTarget:Math.max(1,Math.min(5000,Math.round(Number(value.annotationTarget)||defaultInsightGoal.annotationTarget))),
  };
}

export function buildInsights(works:InsightWork[],annotations:InsightAnnotation[],activity:ProfileActivity[],goal:InsightGoal){
  const completed=works.filter(work=>work.readingState==='finished').length;
  const inProgress=works.filter(work=>work.readingState==='in-progress').length;
  const rated=works.filter(work=>work.rating>0);
  const favourites=works.filter(work=>work.favourite).length;
  const listeningSeconds=activity.filter(item=>item.kind==='Listening').reduce((sum,item)=>sum+Math.max(0,item.activeSeconds||0),0);
  const activeDays=new Set(activity.map(item=>new Date(item.updatedAt*1000).toISOString().slice(0,10))).size;
  const byKey=new Map(works.flatMap(work=>[[work.key,work],[work.canonicalKey,work]] as Array<[string,InsightWork]>));
  const recentAnnotations=[...annotations].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,24).map(annotation=>({
    ...annotation,
    work:byKey.get(annotation.workKey),
  }));
  const recentActivity=[...activity].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,30);
  return {
    completed,inProgress,rated:rated.length,favourites,
    averageRating:rated.length?rated.reduce((sum,work)=>sum+work.rating,0)/rated.length:0,
    listeningSeconds,activeDays,annotationCount:annotations.length,
    completedGoal:{value:completed,target:goal.completedTarget,progress:Math.min(1,completed/goal.completedTarget)},
    annotationGoal:{value:annotations.length,target:goal.annotationTarget,progress:Math.min(1,annotations.length/goal.annotationTarget)},
    recentAnnotations,recentActivity,
  };
}
