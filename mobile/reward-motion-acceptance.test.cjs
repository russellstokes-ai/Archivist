const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const ts=require('typescript');
const vm=require('node:vm');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const manifest=JSON.parse(read('assets/motion/rewards/SOURCE_MANIFEST.json'));
const required={
  'books-stack':'11c7602bf99323a43c6b9a1abb37ee61061b1ea2b2bc77b0abdecef4dc11af8a',
  headphones:'5ff7875d245e73ed160e37f4e36fc4c83b61b993764b392691185c7371739b8d',
  trophy:'dd68917c8057179f19f7ded62b3a474d01dd8daf3ea02d5d92c8790f539b8e6f',
  crown:'b3d250e102393cbfb6095f2b7e67e62b3ccf067d0ed1660e42fb8307938577da',
  'level-confetti':'4191579d863c2334859f45086ee544826f6fd4a687ddc533ca2907c0079e10d9',
  badge:'cff72e0202982a1503bdba29b500a3fa072b463992203dc9385bd6201140adba',
  firework:'0475d55289d34ae990967e4abcbdbcd56434894dd0d904348928e17b515d84a6',
};
assert.deepEqual(Object.keys(manifest).sort(),Object.keys(required).sort());
for(const [key,hash]of Object.entries(required)){
  const raw=read('assets/motion/rewards/'+key+'-original.json');
  const source=JSON.parse(raw);
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),hash,'Original source changed: '+key);
  assert.equal(manifest[key].sha256,hash);
  assert(manifest[key].page.startsWith('https://lottiefiles.com/free-animation/'));
  assert(source.layers.length>=1);
  assert.equal(source.w,manifest[key].width);
  assert.equal(source.h,manifest[key].height);
  assert.equal(source.fr,manifest[key].fps);
  assert.equal(source.op,manifest[key].last);
  assert.equal(source.ip,manifest[key].first);
}

const reward=read('rewardMotion.ts');
const compiled=ts.transpileModule(reward,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
vm.runInNewContext(compiled,{exports});
const {motionForAchievement,motionForLevelUp,rewardPresentationMs}=exports;
const item=(id,category)=>({id,category,title:id,description:'Verified achievement',unlocked:true,progress:1,target:1});
for(const id of ['reader-1','reading-start-3','finished-25','collection-50','series-5']){
  assert.equal(motionForAchievement(item(id,'Reading')).kind,'books-stack','Books and comics: '+id);
}
for(const id of ['listener-1','listener-10','audio-start-25']){
  assert.equal(motionForAchievement(item(id,'Listening')).kind,'headphones','Audiobook: '+id);
}
assert.equal(motionForAchievement(item('first-finish','Other')).kind,'trophy');
assert.equal(motionForAchievement(item('format-3','Library')).kind,'badge');
assert.equal(motionForAchievement(item('daily-spark-5','Daily ritual')).kind,'badge');
assert.equal(motionForAchievement(item('deep-archive','Other')).kind,'crown');
assert(motionForAchievement(item('deep-archive','Other')).firework);
assert(!motionForAchievement(item('reader-1','Reading')).firework);
assert.equal(motionForLevelUp(3).kind,'level-confetti');
assert(motionForLevelUp(3).levelConfetti===false,'Do not double-render confetti');
assert.equal(motionForLevelUp(3).firework,false);
assert.equal(motionForLevelUp(10).kind,'crown');
assert(motionForLevelUp(10).levelConfetti);
assert.equal(motionForLevelUp(25).firework,true);

assert.equal(rewardPresentationMs('headphones'),3000);
assert.equal(rewardPresentationMs('level-confetti'),3000);
assert.equal(rewardPresentationMs('books-stack'),4460,'4-second original cannot reach final at native pace in 3 seconds');
assert.equal(rewardPresentationMs('crown'),5502,'Do not accelerate 5.042s source');
const overlay=read('AchievementRewardOverlay.tsx');
assert(overlay.includes('loop={false}')&&overlay.includes('speed={1}'),'Main Lotties must play once at source pace');
assert(overlay.includes('progress={reducedMotion?0.96:mainFinished?0.999:undefined}'),'Hold final frame');
assert(overlay.includes('onAnimationFinish={(cancelled)=>{if(!cancelled)setMainFinished(true)}'));
assert(overlay.includes('REWARD_FADE_MS'),'Shared fade');
assert(overlay.includes('(folded?144:136):(folded?112:96)'),'Fixed phone/Fold sizes independent of source');
assert.equal((overlay.match(/source=\{CONFETTI\}/g)||[]).length,1);
assert.equal((overlay.match(/source=\{FIREWORK\}/g)||[]).length,1);
assert(overlay.includes('fireworkVisible&&!reducedMotion'));
assert(overlay.includes('event.levelConfetti&&confettiVisible&&!reducedMotion'));
assert(overlay.includes('REWARD_OPTICAL_SCALE'));

const app=read('App.tsx');
assert(app.includes("import {AchievementRewardOverlay} from './AchievementRewardOverlay'"));
assert(app.includes("eventKey={levelUpCelebration?'level-'+levelUpCelebration.level"));
assert(app.includes("achievementCelebration?'achievement-'+achievementCelebration.id:null}"));
assert(app.includes("source:sourceFilter,level"));
assert(app.includes("previous?.source===sourceFilter&&level>previous.level"));
assert(app.includes("if(!achievementCelebration||levelUpCelebration)return"));
assert(app.includes("folded={foldLayout} reducedMotion={reduceMotion}"));
const cards=['styles.rewardTrophyCard','styles.rewardMedalWrap','styles.rewardMedal','styles.rewardTrophyTrack','styles.rewardTrophyGrid'];
for(const c of cards)assert(app.includes(c),'Permanent rewards UI missing: '+c);
assert(!app.includes("active={celebrating || !!achievementCelebration}"),'Old generic animation must not duplicate reward animation');
assert(!overlay.includes('Open Book'),'Rejected art must not return');

console.log('PASS: exact seven Lottie source hashes, category routes, prestige restraint, native speed, final frame, 3-second minimum, phone/Fold sizing, canonical medal UI');
