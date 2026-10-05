export const LIVING_BOOK_GEOMETRY = Object.freeze({
  bookWidth:342,
  pageWidth:171,
  pageHeight:238,
  coverWidth:171,
  coverHeight:244,
  pageInsetY:3,
  spineX:171,
  spineOverlap:3,
  gutterWidth:14,
  closedTranslateX:-85.5,
  openTranslateX:0,
  internalRevealStart:0.035,
  internalRevealEnd:0.30,
  leafRevealStart:0.88,
  leafRevealEnd:0.97,
  leafEnvelopePad:18,
  depthOffsets:[1,2,3] as const,
});

export const LIVING_BOOK_MOTION = Object.freeze({
  coverProgress:[0,.08,.55,1] as const,
  coverAngles:['0deg','-12deg','-104deg','-180deg'] as const,
  leftPageProgress:[0,.10,.46,1] as const,
  leftPageAngles:['176deg','164deg','82deg','0deg'] as const,
  shadowProgress:[0,.18,1] as const,
  shadowScale:[.49,.58,1] as const,
  shadowOpacity:[.11,.14,.19] as const,
});

export type LivingBookDepthLayer={
  side:'left'|'right';
  offset:number;
  top:number;
  bottom:number;
};

export function livingBookDepthLayers():LivingBookDepthLayer[]{
  const g=LIVING_BOOK_GEOMETRY;
  return g.depthOffsets.flatMap(offset=>[
    {side:'left' as const,offset,top:g.pageInsetY+offset,bottom:g.pageInsetY-offset},
    {side:'right' as const,offset,top:g.pageInsetY+offset,bottom:g.pageInsetY-offset},
  ]);
}

function clamp01(value:number){return Math.max(0,Math.min(1,Number(value)||0));}
function range(value:number,start:number,end:number){
  const p=clamp01(value);
  if(p<=start)return 0;
  if(p>=end)return 1;
  return (p-start)/(end-start);
}

/** Pure frame model used by regression tests and native Animated keyframes. */
export function livingBookVisualFrame(progress:number){
  const p=clamp01(progress);
  return {
    progress:p,
    internalReveal:range(p,LIVING_BOOK_GEOMETRY.internalRevealStart,LIVING_BOOK_GEOMETRY.internalRevealEnd),
    leafReveal:range(p,LIVING_BOOK_GEOMETRY.leafRevealStart,LIVING_BOOK_GEOMETRY.leafRevealEnd),
    shadowScale:LIVING_BOOK_MOTION.shadowScale[0]+(1-LIVING_BOOK_MOTION.shadowScale[0])*p,
    shadowTranslateX:LIVING_BOOK_GEOMETRY.closedTranslateX*(1-p),
  };
}

export function livingBookGeometryIsLevel(){
  const g=LIVING_BOOK_GEOMETRY;
  const layers=livingBookDepthLayers();
  return g.bookWidth===g.pageWidth*2
    && g.coverWidth===g.pageWidth
    && g.pageInsetY*2+g.pageHeight===g.coverHeight
    && g.spineOverlap>=2
    && g.gutterWidth>=g.spineOverlap*3
    && g.leafEnvelopePad>=12
    && layers.every(layer=>layer.top+layer.bottom===g.pageInsetY*2);
}
