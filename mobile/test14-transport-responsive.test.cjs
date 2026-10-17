'use strict';
// Geometry acceptance for both original and compact row. Detect real overflow,
// collapsing below 48dp and unapproved central control changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync(__dirname+'/App.tsx','utf8');
const styles=new Map();
for(const name of ['transport','transportNarrow','transportEdgeButton','skipButton',
  'playButton','transportEdgeButtonNarrow','skipButtonNarrow']){
 const match=css.match(new RegExp('  '+name+': \\{([^}]+)\\}'));
 assert(match,'Missing original or responsive '+name+' style');
 const numbers={};
 for(const field of ['width','height','gap']){const value=match[1].match(new RegExp('(?:^|,)'+field+':(\\d+)'));if(value)numbers[field]=Number(value[1]);}
 styles.set(name,numbers);
}
assert.equal(styles.get('playButton').width,80,'The central approved 80dp circle never shrinks');
assert.equal(styles.get('playButton').height,80);
assert.equal(styles.get('transportEdgeButtonNarrow').width,48);
assert.equal(styles.get('skipButtonNarrow').width,48);
assert.equal(styles.get('transportNarrow').gap,2);
const required=compact=>(compact?2*48+2*48:2*styles.get('transportEdgeButton').width+
  2*styles.get('skipButton').width)+80+4*(compact?styles.get('transportNarrow').gap:styles.get('transport').gap);
assert.equal(required(false),328);
assert.equal(required(true),280);
for(const width of [320,328,340,355,356,359,360,400,512]){
 const compact=width<356;
 const horizontalPadding=width<360?14:16; // App playerScreenNarrow/Phone
 const available=width-2*horizontalPadding;
 assert(required(compact)<=available,'Transport overflows '+width+'dp viewport: needs '+required(compact)+' of '+available);
}
assert(css.includes('styles.transport,width<356&&styles.transportNarrow'));
assert.equal((css.match(/width<356&&styles.transportEdgeButtonNarrow/g)||[]).length,2);
assert.equal((css.match(/width<356&&styles.skipButtonNarrow/g)||[]).length,2);
for(const key of ['back15','forward15'])
 assert(css.includes('skipButtonPulse.'+key+'} size={width<356?46:52}'),
  'Original 52dp skip Lottie must only reduce art size on narrow controls');
assert(!css.includes('transportNarrow: {flexWrap'), 'Do not reflow the approved transport into two rows');
const previous=require('../scripts/test14-app-exception.cjs');
const crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..'),bytes=Buffer.from(css);
const sha=crypto.createHash('sha1').update('blob '+bytes.length+'\\0').update(bytes).digest('hex');
assert(previous(root,sha),'Both reversible App exceptions must restore the exact original protected blob');
console.log('PASS: 320/356/360dp safe transport, 48dp hit targets, immutable 80dp circle, vector artwork and chained source locks');