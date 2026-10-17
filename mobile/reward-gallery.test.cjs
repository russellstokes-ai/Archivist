const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {stripTypeScriptTypes}=require('node:module');
(async()=>{
 const src=stripTypeScriptTypes(fs.readFileSync(path.join(__dirname,'rewardGallery.ts'),'utf8'),{mode:'transform'});
 const {rewardCabinetEntries}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
 const rows=[
  {id:'collection-5',title:'The growing library · 5',category:'Library',description:'Five',progress:18,target:5,unlocked:true},
  {id:'collection-10',title:'The growing library · 10',category:'Library',description:'Ten',progress:18,target:10,unlocked:true},
  {id:'collection-25',title:'The growing library · 25',category:'Library',description:'Twenty-five',progress:18,target:25,unlocked:false},
  {id:'listener-3',title:'A world in your ears · 3',category:'Listening',description:'Three',progress:0,target:3,unlocked:false},
  {id:'listener-5',title:'A world in your ears · 5',category:'Listening',description:'Five',progress:0,target:5,unlocked:false},
  {id:'first-finish',title:'First finish',description:'Finish one',progress:1,target:1,unlocked:true}
 ];
 const original=JSON.stringify(rows),g=rewardCabinetEntries(rows);
 assert.equal(g.length,3);assert.equal(g[0].title,'The growing library');
 assert.equal(g[0].target,10);assert.equal(g[0].earnedTiers,2);assert.equal(g[0].totalTiers,3);
 assert.equal(g[0].nextTier.id,'collection-25');assert.equal(g[1].target,3);
 assert.equal(g[1].nextTier,undefined);assert.equal(g[2].title,'First finish');
 assert.equal(JSON.stringify(rows),original);assert.equal(rewardCabinetEntries([]).length,0);
 assert.equal(rewardCabinetEntries([...rows].reverse()).length,3);
 const many=Array.from({length:500},(_,i)=>({id:'many-'+(i+1),title:'Many · '+(i+1),category:'Library',progress:25,target:i+1,unlocked:i<25}));
 assert.equal(rewardCabinetEntries(many).length,1);
 assert.equal(rewardCabinetEntries(many)[0].nextTier.target,26);
 console.log('PASS: all earned medals retained, up to 500 tiers per compact cabinet family');
})().catch(e=>{console.error(e);process.exitCode=1});
