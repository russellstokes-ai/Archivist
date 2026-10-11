// Protect the user's approved Living Book: only TWO outer stage-size exceptions are allowed.
// Reversing them must produce the original entire df4c39b source byte-for-byte.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
let code=fs.readFileSync(path.join(__dirname,'LivingBookCanvas.tsx'),'utf8');
const prop="  /** Outer viewport only. The canonical physical book renderer and animation remain untouched. */\n  stageWidth?:number;\n";
const outer="  const externalWidth=props.stageWidth;\n  const responsiveStage=typeof externalWidth==='number'&&Number.isFinite(externalWidth)&&externalWidth>0\n    ? {width:externalWidth,height:externalWidth*290/340}\n    : undefined;\n  return <View accessibilityLabel=\"Living book artwork\" style={[styles.stage,responsiveStage]} pointerEvents=\"none\">";
const original='  return <View accessibilityLabel="Living book artwork" style={styles.stage} pointerEvents="none">';
assert.equal(code.split(prop).length,2,'exactly one approved outer size prop');
assert.equal(code.split(outer).length,2,'exactly one approved outer size wrapper');
code=code.replace(prop,'').replace(outer,original);
const blob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(code)+'\0').update(code).digest('hex');
assert.equal(blob,'bac9a25bd1e75df7dd3ee8ed914d3005e201a5e0',
 'Protected Living Book must match canonical df4c39b after reversing ONLY two approved outer sizing changes');
console.log('PASS: immutable Living Book renderer (full canonical Git blob), except two approved outer stage changes');
