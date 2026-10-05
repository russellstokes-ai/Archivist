export type ScanPhase='discovering'|'reading-metadata'|'matching'|'checking-duplicates'|'covers'|'online-books'|'online-comics'|'preparing'|'complete';

export class ScanCommitGate {
  private generation=0;
  begin(){this.generation+=1;return this.generation;}
  isCurrent(generation:number){return generation===this.generation;}
  invalidate(){this.generation+=1;return this.generation;}
  current(){return this.generation;}
}

export function scanStatusCopy(input:{
  phase:ScanPhase;
  currentFolder?:string;
  entriesVisited:number;
  found:number;
  review:number;
  publishedCount:number;
}){
  const place=input.currentFolder?' · '+input.currentFolder:'';
  const count=('processed' in input&&'total' in input&&(input as any).total>0)
    ? Math.min((input as any).processed||0,(input as any).total)+' of '+(input as any).total
    : input.entriesVisited+' checked';
  const progress=count+' · '+input.found+' found · '+input.review+' need review'+place;
  if(input.publishedCount>0){
    return {
      title:'Refreshing your library',
      detail:progress+'. Your current '+input.publishedCount+' item'+(input.publishedCount===1?'':'s')+' remain available until the refresh is complete.',
    };
  }
  return {
    title:input.phase==='preparing'||input.phase==='checking-duplicates'?'Preparing your library':'Building your library',
    detail:progress+'. New items will appear together when this scan is complete.',
  };
}

export function scanFailureCopy(hasPublishedCatalogue:boolean){
  return hasPublishedCatalogue
    ? 'Scan could not finish. Your existing library is unchanged.'
    : 'Scan could not finish. The folder is still saved; tap Refresh to try again.';
}
