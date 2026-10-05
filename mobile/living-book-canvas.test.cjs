const fs=require('node:fs'),assert=require('node:assert/strict');

const canvas=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');

assert(canvas.includes('const W=174,H=256,N=64'),'Living Book must retain the 64-strip reference mesh');
assert(canvas.includes('const base=direction===1?4+progress:5-progress'),'turning sheet must start/end on the exact right/left page planes');
assert(canvas.includes('surface(right,rigid(0,4))'),'settled right page must remain on z=4');
assert(canvas.includes('surface(left,rigid(PI*opening,5)'),'settled left page must remain on z=5');
assert(canvas.includes('if(direction===1){page+=2;left=back;right=texture(false,page+1);}'),'forward turn must preserve the moving back texture as the settled left page');
assert(canvas.includes('right=back;left=texture(false,page)'),'reverse turn must preserve the moving back texture as the settled right page');
assert(canvas.includes('for(let j=0;j<6;j++)surface(liner'),'physical book must retain at least six visible paper layers');
assert(canvas.includes('duration=skipping?780:1900'),'normal turn timing must stay ~1900 ms while seek cues remain quicker');
assert(canvas.includes('(now-transitionStart)/1500'),'cover open/close timing must stay ~1500 ms');
assert(canvas.includes("phase==='settling'&&activeTurn)turn=1"),'settling must hold the final moving sheet frame');
assert(canvas.includes("if(previous==='settling'||previous==='turning')commitTurn()"),'logical page advancement must occur after the settling phase');
assert(canvas.includes("opening=(phase==='closed'||phase==='closing')?0:1"),'renderer remount must choose a stable physical pose rather than replay an in-flight open');
assert(canvas.includes("turn=(phase==='turning'||phase==='settling')?1:0"),'renderer remount during a turn must resume at the landed sheet instead of spawning a phantom page');
assert(canvas.includes('androidLayerType="hardware"'),'Android Canvas WebView must remain hardware accelerated');
assert(canvas.includes("coverMode==='jacket'"),'Canvas renderer must preserve the audiobook portrait-jacket fallback');
assert.equal(canvas.includes('rotateY'),false,'Canvas renderer must not regress to flat rotateY page animation');

assert(app.includes("import {LivingBookCanvas} from './LivingBookCanvas';"),'Now Playing must use the Canvas Living Book renderer');
assert(app.includes('<LivingBookCanvas'),'Player must render the Canvas Living Book');
assert.equal(app.includes('<LivingBookArtwork'),false,'obsolete flat renderer must stay out of the Player');


assert.equal(app.includes('function LivingBookCoverTexture('),false,'dead nested Living Book cover component must stay removed');
const coverEffectStart=canvas.indexOf('void coverSource(props.coverUri,props.coverHeaders)');
const coverEffectEnd=canvas.indexOf('return()=>{live=false;};',coverEffectStart);
const coverEffect=canvas.slice(coverEffectStart,coverEffectEnd+80);
assert.equal(coverEffect.includes('props.phase'),false,'page/phase updates must not reload physical cover artwork');
assert.equal(coverEffect.includes('props.number'),false,'chapter/page updates must not reload physical cover artwork');
assert(canvas.includes("[ready,props.coverUri,props.coverMode,JSON.stringify(props.coverHeaders||{})]"),'cover materialization must depend only on cover identity/auth, not playback progress');

console.log('PASS: Living Book Canvas preserves mesh physics, landing continuity and production Player wiring');
