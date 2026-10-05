export const LIVING_BOOK_GEOMETRY = Object.freeze({
  bookWidth:342,
  pageWidth:171,
  pageHeight:238,
  coverWidth:171,
  coverHeight:244,
  pageInsetY:3,
  spineX:171,
  closedTranslateX:-85.5,
  openTranslateX:0,
  internalRevealStart:0.055,
  internalRevealEnd:0.16,
  depthOffsets:[1,2,3] as const,
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

export function livingBookGeometryIsLevel(){
  const g=LIVING_BOOK_GEOMETRY;
  const layers=livingBookDepthLayers();
  return g.bookWidth===g.pageWidth*2
    && g.coverWidth===g.pageWidth
    && g.pageInsetY*2+g.pageHeight===g.coverHeight
    && layers.every(layer=>layer.top+layer.bottom===g.pageInsetY*2);
}
