/** Outer-stage fit only: the canonical Living Book renderer is never modified. */
export type LivingBookStageViewport={
  width:number;height:number;fold:boolean;topInset?:number;bottomInset?:number;embedded?:boolean;
};
export const LIVING_BOOK_STAGE_RATIO=340/290;
export function livingBookStageSize(v:LivingBookStageViewport){
  const screenWidth=Math.max(240,Number.isFinite(v.width)?v.width:340);
  const screenHeight=Math.max(400,Number.isFinite(v.height)?v.height:740);
  // 48dp Fold margins, 32dp column gutter, >=250dp reserved for transport.
  // At phone widths, keep the original hero/title/navigation content in view.
  const horizontal=v.fold
    ?Math.max(205,Math.min(440,screenWidth-48-32-250))
    :Math.max(205,Math.min(420,screenWidth-32));
  const vertical=Math.max(196,Math.min(v.fold?395:365,
    screenHeight-(v.topInset||0)-(v.bottomInset||0)-(v.fold?174:v.embedded?405:425)));
  const width=Math.round(Math.min(horizontal,vertical*LIVING_BOOK_STAGE_RATIO));
  return {width,height:Math.round(width/LIVING_BOOK_STAGE_RATIO)};
}
