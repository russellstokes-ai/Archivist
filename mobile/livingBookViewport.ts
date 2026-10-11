/** Responsive OUTER stage size only. Never change LivingBookCanvas rendererHtml/physics. */
export type LivingBookViewport={width:number;height:number};
const BASE_WIDTH=340,BASE_HEIGHT=290;
export function calculateLivingBookViewport(screenWidth:number,screenHeight:number,twoColumn:boolean):LivingBookViewport{
  const w=Math.max(320,Number.isFinite(screenWidth)?screenWidth:340);
  const h=Math.max(540,Number.isFinite(screenHeight)?screenHeight:740);
  const horizontalInsets=twoColumn?48:(w<360?28:32);
  // Existing Fold controls require >=250dp and 32dp between the original columns.
  const widthAllowance=twoColumn?w-horizontalInsets-32-250:w-horizontalInsets;
  // Reserve space for existing titles, timeline, transport, navigation and insets.
  const heightAllowance=twoColumn?Math.min(405,h*0.55):Math.max(265,Math.min(365,h*0.41));
  const cap=twoColumn?480:430;
  const width=Math.floor(Math.max(1,Math.min(widthAllowance,cap,heightAllowance*BASE_WIDTH/BASE_HEIGHT)));
  return {width,height:Math.round(width*BASE_HEIGHT/BASE_WIDTH)};
}
