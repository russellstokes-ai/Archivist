'use strict';
const {gitBlob}=require('./appSource.cjs');
const baseGitBlob='0c03113482ac1581d41e73882845369bd43d9003';
function applyWithManifest(input){
 let code=input.replace(/\r\n/g,'\n');
 if(gitBlob(code)!==baseGitBlob)throw Error('Scanner runtime changed. Review the exact three-fix patch before compiling.');
 const edits=[];
 const edit=(label,before,after)=>{if(!before||code.split(before).length!==2)throw Error('Nonunique runtime repair anchor: '+label);code=code.replace(before,()=>after);edits.push({label,before,after});};
 edit('reuse bounded native task isolation',"import {normalizeGenre} from './genre';","import {normalizeGenre} from './genre';\nimport {BoundedTasks} from './tasks';");
 edit('one artwork lane per runtime',' let manualInputs=',` // This lane survives rescans: an abandoned native request retains its slot.
 const preparationArtwork=new BoundedTasks({slots:1,queueCapacity:0,deadlineMs:5000});
 let manualInputs=`);
 edit('bounded optional artwork preparation',' async function refresh(',` async function prepareArtwork(source:Source,assets:PipelineAsset[],work:MetadataWork,signal?:AbortSignal):Promise<ArtworkResult>{
  check(signal);
  let started=false;
  const generation=preparationArtwork.snapshot().generation;
  const cancel=()=>{if(started)preparationArtwork.cancelGeneration();};
  signal?.addEventListener('abort',cancel,{once:true});
  try{
   const outcome=await preparationArtwork.run(async inner=>{
    started=true;check(signal);
    return ports.artwork(source,assets,work,inner);
   },generation);
   check(signal);
   if(outcome.state==='ok')return outcome.value;
   if(outcome.state==='timeout'||outcome.state==='error')console.warn('ScannerArtworkIncomplete',{state:outcome.state});
   return {state:'invalid',issues:['artwork-'+outcome.state]};
  }finally{signal?.removeEventListener('abort',cancel);}
 }
 async function refresh(`);
 edit('refresh operation observer','async function refresh(id:string,signal?:AbortSignal):Promise<ScannerBook[]>{','async function refresh(id:string,signal?:AbortSignal,operation?:(label:string)=>void):Promise<ScannerBook[]>{');
 edit('metadata read status','  check(signal);const stored=await load(id),work=await pipeline.metadata.get(id);',"  check(signal);operation?.('Loading saved metadata');const stored=await load(id),work=await pipeline.metadata.get(id);");
 edit('artwork status before wait',"  let artwork:ArtworkResult={state:'missing'};try{","  operation?.('Checking cover artwork');\n  let artwork:ArtworkResult={state:'missing'};try{");
 edit('artwork deadline without replacement workers','await ports.artwork(stored.source,[...stored.entry.assets,...(stored.entry.artworkAssets??[])],work,signal)','await prepareArtwork(stored.source,[...stored.entry.assets,...(stored.entry.artworkAssets??[])],work,signal)');
 edit('publication status before wait','  check(signal);await pipeline.publication.publish',"  check(signal);operation?.('Saving publication state');await pipeline.publication.publish");
 edit('identity projection status','  const books:ScannerBook[]=[];',"  operation?.('Preparing reading positions');\n  const books:ScannerBook[]=[];");
 edit('real source work totals','    for(const entry of result.works){check(options.signal);',`    let prepared=0;
    const reportPreparing=(operation:string)=>options.progress?.({phase:'preparing',currentFolder:operation+' · '+folder.name,entriesVisited:visited,found:books.length,review,processed:prepared,total:result.works.length});
    for(const entry of result.works){check(options.signal);reportPreparing('Checking comic identity');`);
 edit('catalogue preparation status','const withArtwork={...entry,assets:entry.assets};await persist(source,withArtwork,legacyKey);',"const withArtwork={...entry,assets:entry.assets};reportPreparing('Saving prepared details');await persist(source,withArtwork,legacyKey);");
 edit('observe the awaited refresh','const projected=await refresh(entry.work.workId,options.signal);','const projected=await refresh(entry.work.workId,options.signal,reportPreparing);');
 edit('advance after real completion',"options.progress?.({phase:'preparing',currentFolder:folder.name,entriesVisited:visited,found:books.length,review});","prepared++;reportPreparing('Prepared comics');");
 let restored=code;
 for(const {before,after,label}of [...edits].reverse()){
  if(restored.split(after).length!==2)throw Error('Cannot reverse runtime repair: '+label);
  restored=restored.replace(after,()=>before);
 }
 if(restored!==input.replace(/\r\n/g,'\n')||gitBlob(restored)!==baseGitBlob)throw Error('Runtime repair escaped its exact manifest.');
 return {code,edits,baseGitBlob,effectiveGitBlob:gitBlob(code)};
}
module.exports={baseGitBlob,applyWithManifest,apply:input=>applyWithManifest(input).code};
