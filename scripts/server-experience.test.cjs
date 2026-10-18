const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Node {
 constructor(tag,text=''){this.tag=tag;this.textContent=text;this.children=[];this.classList={toggle(){}};}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=items}
 setAttribute(name,value){this[name]=value}
 addEventListener(){}
}
const nodes=new Map(),calls=[];
const $=id=>{if(!nodes.has(id))nodes.set(id,new Node('div'));return nodes.get(id)};
const context={$,element:(t,s)=>new Node(t,s),document:{createTextNode:s=>s},window:{addEventListener(){},activeServerWork:{id:1,title:'Audio'}},
 currentProfile:{owner:true},page:'shelf',listening:null,playbackAudio:{addEventListener(){},paused:true,currentTime:20,duration:100,playbackRate:1,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true}},
 api:async url=>{calls.push(url);return url.includes('library-summary')?{reading:[{name:'finished',count:2}]}:url.includes('activity')?[{title:'Audio',kind:'Listening',updatedAt:1}]:[{id:1,title:'Audio'}]},
 workCard:work=>new Node('book',work.title),coverFor:()=>new Node('cover'),message:msg=>{throw Error(msg)},loadBooks:()=>{},saveListening:async()=>{},loadListeningTrack:async()=>{}};
vm.createContext(context);vm.runInContext(fs.readFileSync('web/experience.js','utf8'),context);
(async()=>{
 await context.loadExperience('shelf');
 assert.equal($('shelf-continue').children[0].textContent,'Audio');
 assert(calls.some(url=>url.includes('reading=in-progress')));
 assert(calls.some(url=>url.includes('sort=recent')));
 await context.loadExperience('stats');assert.equal($('stats-activity').children.length,1);
 context.listening={title:'Audio',index:0,tracks:[{title:'One',available:true},{title:'Offline',available:false}]};
 context.renderListening();
 const transport=$('player-controls').children[0];transport.children[0].onclick();assert.equal(context.playbackAudio.currentTime,5);
 transport.children[2].onclick();assert.equal(context.playbackAudio.currentTime,35);
 const chapters=$('player-controls').children.find(n=>n['aria-label']==='Audiobook chapter');
 assert.equal(chapters.children[1].disabled,true);
 const speed=$('player-controls').children.find(n=>n['aria-label']==='Playback speed');speed.value='1.5';speed.onchange();assert.equal(context.playbackAudio.playbackRate,1.5);
 console.log('PASS: Shelf loads personal progress, Stats renders activity, player seeks, changes speed and disables missing chapters');
})().catch(e=>{console.error(e);process.exitCode=1});
