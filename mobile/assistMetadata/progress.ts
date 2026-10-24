export function populationMessage(enabled:boolean,counts:Record<string,number>){
 const total=Object.values(counts).reduce((sum,count)=>sum+count,0);
 if(!total)return '';
 const done=(counts.done||0)+(counts['needs-clues']||0)+(counts.blocked||0);
 const waiting=(counts.pending||0)+(counts.running||0)+(counts.retry||0);
 if(!enabled&&waiting)return `Population paused. ${done} of ${total} items processed; your progress is saved.`;
 if(waiting)return `${done} of ${total} items processed.${counts.retry?` ${counts.retry} waiting to retry automatically.`:''} Covers and file updates run separately.`;
 return `Population complete. ${counts.done||0} identified; ${counts['needs-clues']||0} need more clues.${counts.blocked?` ${counts.blocked} could not be processed.`:''} Covers and file updates run separately.`;
}

export function populationMeter(counts:Record<string,number>){
 const total=Object.values(counts).reduce((sum,count)=>sum+count,0);
 const identified=counts.done||0,unresolved=(counts['needs-clues']||0)+(counts.blocked||0);
 const processed=identified+unresolved,retrying=counts.retry||0;
 const waiting=(counts.pending||0)+(counts.running||0)+retrying;
 return {total,processed,identified,unresolved,retrying,waiting,percent:total?Math.floor(processed/total*100):0,complete:total>0&&waiting===0};
}
