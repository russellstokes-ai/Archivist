const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8');

assert.ok(
  source.includes("disabled={busy || !server.trim() || !key.trim()}"),
  'Server Connect must stay disabled until both server address and access key are present'
);
assert.ok(
  source.includes('serverNotice?<Text accessibilityLiveRegion="polite"'),
  'Server discovery/connection notice must be announced politely'
);
assert.equal(
  source.includes('{error ? <Text accessibilityRole="alert" style={[styles.error, {color:p.danger}]}>{error}</Text> : null}'),
  false,
  'Server setup must not duplicate the global error surface'
);

assert.equal(
  (source.match(/<View style=\{\{flex:1,minWidth:0\}\}>/g)||[]).length>=3,
  true,
  'Onboarding step copy must be allowed to wrap without overflowing compact layouts'
);

assert.ok(
  source.includes("layoutTier==='compact'&&{alignItems:'flex-start',flexWrap:'wrap'}"),
  'Server source rows must wrap on compact phones'
);
assert.ok(
  source.includes("layoutTier==='compact'&&{width:'100%',justifyContent:'flex-start'}"),
  'Server source row actions must move to their own compact row'
);
assert.ok(
  source.includes("style={[styles.settingsInlineInput,{flex:0,width:'100%',color:p.ink,backgroundColor:p.card}]}"),
  'Vertically stacked server-folder fields must not flex into neighbouring Settings content'
);
assert.ok(
  source.includes("layoutTier==='compact'&&{flexWrap:'wrap',alignItems:'stretch'}"),
  'Family-user add controls must wrap safely on compact phones'
);
assert.ok(
  source.includes("layoutTier==='compact'&&{flex:0,width:'100%'}"),
  'Family-user input must take a bounded full-width compact row'
);
assert.ok(
  source.includes("householdUsers.map(user=><View key={user.id} style={[styles.settingsListRow,{borderBottomColor:p.line},layoutTier==='compact'&&{alignItems:'flex-start'}]}><View style={{flex:1,minWidth:0}}>"),
  'Long family-user names must shrink and wrap without colliding with their action'
);
for (const label of ['Reduced motion','Increased contrast','Larger interface text']) {
  assert.ok(
    source.includes('<View style={styles.settingsRow}><View style={{flex:1,minWidth:0}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>'+label+'</Text>'),
    label+' copy must remain shrinkable beside its switch at large text sizes'
  );
}

assert.ok(
  source.includes('{localFolderNotice?<Text accessibilityLiveRegion="polite"'),
  'Local-folder status changes must be announced'
);
assert.ok(
  source.includes('{moveStatus?<Text accessibilityLiveRegion="polite"'),
  'Safe-organisation status changes must be announced'
);
assert.ok(
  source.includes('{privacyDataNotice?<Text accessibilityLiveRegion="polite"'),
  'Backup/restore status changes must be announced'
);
assert.ok(
  source.includes('{error ? <View accessibilityLiveRegion="assertive"'),
  'Global error banner must announce errors assertively'
);
assert.ok(
  source.includes('{localScanning&&scanProgress?<View accessibilityLiveRegion="polite"'),
  'Shelf scan progress must announce state changes without stealing focus'
);

console.log('PASS: final release polish protects compact Settings, onboarding wrapping and live edge-state accessibility');
