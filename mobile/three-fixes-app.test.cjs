'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {test}=require('node:test');
const filename=path.join(__dirname,'App.tsx');
const original=fs.readFileSync(filename,'utf8');
const patchPath=path.join(__dirname,'threeFixes','appSource.cjs');
const app=fs.existsSync(patchPath)?require(patchPath).apply(original):original;
function section(text,start,end){const a=text.indexOf(start);assert.ok(a>=0,'missing '+start);const b=text.indexOf(end,a+start.length);assert.ok(b>a,'missing end '+end);return text.slice(a,b);}
// Bounded source locations help identify the precise handlers under test without
// dumping the full application or any runtime/private library information.
for(const name of ['chooseProfilePhoto','saveProfileAvatar','PageHeader','PageToolbar','Shelf','Atlas','Profile']){
 const pattern=new RegExp('(?:async )?function '+name+'\\(');const match=pattern.exec(original);
 if(match)console.log('Three-fix source location:',name,'line',original.slice(0,match.index).split('\n').length);
}
test('Profile hero exposes a substantial Change photo action below its ring',()=>{
 const hero=section(app,'<View style={[styles.profileIdentityHero,','<View style={styles.profileIdentityCopy}>');
 assert.ok(hero.includes('Change photo'),'the main avatar needs its own visible change action');
 assert.ok(hero.indexOf('Change photo')>hero.indexOf('profileIdentityLevelBadge'),'action belongs beneath the complete ring');
 assert.ok(hero.includes('minHeight:48'),'retain an accessible button target');
});
test('photo selection has an app-owned preview and explicit commit/cancel, not native crop',()=>{
 assert.ok(app.includes('ProfilePhotoPreview'),'render the shared confirmation sheet');
 assert.ok(app.includes('profilePhotoDraft'),'selection must be staged before persistence');
 const choose=section(app,'async function chooseProfilePhoto()', '\n  function ');
 assert.ok(!choose.includes('allowsEditing:true'),'do not reopen the unconfirmable native crop editor');
 assert.ok(choose.includes('setProfilePhotoDraft'),'a picker selection is only a draft');
 assert.ok(!choose.includes('await persistPickedProfilePhoto'),'selection cannot save immediately');
});
test('Shelf and Atlas action rows are inside one compact header group',()=>{
 assert.ok(app.includes('testID="shelf-page-header-group"'),'Shelf header/action must be grouped');
 assert.ok(app.includes('testID="atlas-page-header-group"'),'Atlas header/action must be grouped');
});
test('final catalogue save receives the scan generation and real write progress',()=>{
 const finalize=section(app,'async function finaliseLocalScan(', '\n  async function checkpointLocalEnrichment');
 assert.ok(finalize.includes('shouldContinue:()=>scanCommitGate.isCurrent(generation)'),'cancelled queued writes must be rejected');
 assert.ok(finalize.includes('onProgress:'),'waiting/saving/committed events must reach the scan interface');
 assert.ok(finalize.includes('progress.stage'),'the visible operation must reflect queue wait versus saving');
});
