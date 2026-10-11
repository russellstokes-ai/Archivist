/** One-time library celebration gate. The scanner itself is intentionally untouched. */
export type FirstLibraryCelebrationGate={
  observedEmptyScan:boolean;eligible:boolean;scanRunning:boolean;prepared:boolean;
  catalogueReady:boolean;restoring:boolean;publishedWorks:number;alreadyClaiming:boolean;
  anotherCelebrationActive:boolean;
};
export function shouldCelebrateFirstLibrary(g:FirstLibraryCelebrationGate):boolean{
  return g.observedEmptyScan&&g.eligible&&!g.scanRunning&&g.prepared&&
    g.catalogueReady&&!g.restoring&&g.publishedWorks>0&&!g.alreadyClaiming&&!g.anotherCelebrationActive;
}
