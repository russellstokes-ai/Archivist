const fs=require('fs');
const vm=require('vm');
const ts=require('typescript');
function load(path){const src=fs.readFileSync(path,'utf8');const out=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const mod={exports:{}};vm.runInNewContext(`(function(require,module,exports){${out}\n})(require,module,module.exports)`,{require,module:mod,exports:mod.exports});return mod.exports;}
const x=load(__dirname+'/librarySources.ts');
const assert=(v,m)=>{if(!v)throw Error(m)};
const online=x.sourceIdentity({source:'server',server:'https://home.example/',serverWorkId:42,space:'Main',title:'Book'});
const downloaded=x.sourceIdentity({source:'downloaded',server:'https://home.example',serverWorkId:42,space:'Main',title:'Book'});
const local=x.sourceIdentity({source:'local',localKey:'asset:file:///book.epub',space:'Main',title:'Book'});
assert(online.canonicalKey===downloaded.canonicalKey,'online/downloaded canonical identity must match');
assert(local.canonicalKey!==online.canonicalKey,'local copy must not be merged by title');
const all=x.dedupeForAll([{...downloaded,space:'Main'},{...online,space:'Main'},{...local,space:'Device'}]);
assert(all.length===2,'All must suppress downloaded duplicate while online server copy exists');
assert(all.some(i=>i.source==='downloaded'),'All must prefer the downloaded copy for reliable offline playback');
assert(!all.some(i=>i.source==='server'),'All must not return duplicate remote work when local copy is ready');
const fallback=x.dedupeForAll([{...downloaded,space:'Main',available:false},{...online,space:'Main',available:true}]);
assert(fallback.length===1&&fallback[0].source==='server','An unavailable downloaded copy must not hide an available server work');
const offlineLocalMissing=x.dedupeForAll([{...online,space:'Main',available:true},{...downloaded,space:'Main',available:true,localWork:{available:false}}]);
assert(offlineLocalMissing.length===1&&offlineLocalMissing[0].source==='server','Actually unavailable local media must fall back to server even if the display wrapper marks it available');
const partial={...downloaded,available:true,localWork:{available:true,offlineIncomplete:true}};
const partialServerReady=x.dedupeForAll([partial,{...online,available:true,reachable:true}]);
assert(partialServerReady[0].source==='server',
  'proven reachable complete work must outrank partial downloaded chapters');
const staleServer=x.dedupeForAll([partial,{...online,available:true}]);
assert(staleServer[0].source==='downloaded',
  'stale server catalogue availability is not proof it can be reached offline');
const partialDisconnected=x.dedupeForAll([{...online,available:false},partial]);
assert(partialDisconnected[0].source==='downloaded',
  'verified partial local chapter must remain usable without the server');
const bothUnusable=x.dedupeForAll([{...online,available:false},{...downloaded,available:true,localWork:{available:false}}]);
assert(bothUnusable[0].source==='server'&&bothUnusable[0].available===false,
  'when nothing is playable, never select a ghost downloaded file');
const disconnected=x.dedupeForAll([{...online,space:'Main',available:false},{...downloaded,space:'Main',available:true}]);
assert(disconnected.length===1&&disconnected[0].source==='downloaded','Local media must win when server is unavailable');
const serverFirst=x.dedupeForAll([{...online,space:'Main'},{...downloaded,space:'Main'}]);
assert(serverFirst[0].source==='downloaded','Offline-first playback must not depend on item insertion order');
assert(x.spacesForSource([{...downloaded,space:'Offline'},{...local,space:'Device'}],'downloaded').join(',')==='Offline','source spaces');
assert(x.matchesSource('downloaded','local')===true,'On this device must include offline server downloads');
assert(x.matchesSource('server','local')===false,'On this device must not include remote-only server content');
assert(x.sourceLabel('local')==='On this device'&&x.sourceLabel('downloaded')==='On this device','local and downloaded content must share the physical On this device label');
assert(x.sourceLabel('server')==='Archivist Server','remote-only content must use the Archivist Server label');
assert(x.normalizeSpaceSelection([{...local,space:'Device'}],'local','Missing')==='','invalid space must reset');
console.log('library-sources.test.cjs passed');
