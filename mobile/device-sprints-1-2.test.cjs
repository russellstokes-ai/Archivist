const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('App.tsx','utf8');
const sheetSource=fs.readFileSync('sheetInteraction.ts','utf8');

assert.ok(source.includes("useSafeAreaInsets"),'Profile placement must use the actual device safe area');
assert.ok(source.includes("top:safeArea.top+(phoneLayout?8:10)"),'Profile avatar must sit below status icons on phones');
assert.ok(source.includes("const libraryFolderRailWidth=layoutTier==='fold'?136:160"),'Fold/wide Library rail must have readable width');
assert.ok(source.includes("maintenanceAssetCard")&&source.includes("maintenanceAssetCover")&&source.includes("maintenanceAssetReason"),'Needs-attention mode must use the compact mobile cleanup row');
assert.ok(source.includes("else if(atlasNodeId||atlasBreakdown)dismissAtlasNode()"),'Tapping empty Atlas space must clear selection');
assert.ok(source.includes("function DismissSheetHandle(")&&source.includes("shouldCaptureSheetDismiss")&&source.includes("shouldDismissSheet")&&sheetSource.includes("gesture.dy>56 || gesture.vy>0.7"),'Phone sheets must support deliberate downward dismissal');
assert.ok(source.includes('accessibilityHint="Tap or swipe down to close"'),'Sheet dismissal gesture needs an accessible equivalent');
for(const label of [
  'Close Customise Shelf','Close organisation panel','Close Library sources and folders',
  'Close Reader tools','Close work details','Close Library management'
]) assert.ok(source.includes('accessibilityLabel="'+label+'"'),'Missing tappable scrim: '+label);
assert.ok(source.includes('<View pointerEvents="box-none" style={modalSheetBackdrop}><View accessible={false} accessibilityViewIsModal={true} accessibilityLabel="Library filters"'),'Library filter shell must be pointer-transparent so only real sheet controls can receive taps');
assert.ok(source.includes("actionSheetStable: {height:'76%',minHeight:360,maxHeight:680,overflow:'hidden'}"),'Long sheets must use the stable commercial detent');
assert.ok(source.includes("sheetInnerScroll: {paddingBottom:8,gap:9}"),'Bounded sheets must scroll internally instead of moving the page');
assert.ok(source.includes("fontWeight:'600'")&&source.includes("librarySort===sort?p.sage:p.muted"),'Filter selection must not change text width/weight and trigger reflow');
assert.ok(source.includes("Alert.alert('Discard changes?'"),'Creation forms must protect unsaved work when dismissed');
assert.ok(source.includes('accessible={false} accessibilityViewIsModal={true}'),'Sheet surface must absorb scrim taps');
console.log('PASS: Sprints 1-2 device layout and commercial sheet behavior are locked.');
