export type SheetDismissGesture={dx:number;dy:number;vy:number};

export function shouldCaptureSheetDismiss(gesture:SheetDismissGesture){
  return gesture.dy>8 && Math.abs(gesture.dy)>Math.abs(gesture.dx);
}

export function shouldDismissSheet(gesture:SheetDismissGesture){
  return gesture.dy>56 || gesture.vy>0.7;
}
