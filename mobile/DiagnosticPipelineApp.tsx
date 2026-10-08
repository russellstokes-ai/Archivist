import React,{useEffect,useRef,useState} from 'react';
import {SafeAreaView,ScrollView,Text,TouchableOpacity,View,Switch} from 'react-native';
import {documentDirectory,getInfoAsync,makeDirectoryAsync,writeAsStringAsync,readAsStringAsync,downloadAsync,deleteAsync} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  pickLocalFolder,scanLocalFolders,enrichLocalEmbeddedMetadata,
  enrichLocalBoundedArchiveEvidence,enrichLocalBookMetadataOnline,enrichLocalBookCovers,
  type LocalBook,type LocalFolder,
} from './localLibrary';
import {synchronizeLocalMetadataCooperative} from './metadataSync';
import {fastAudioProbeUris} from './audioProbePlan';
import {groupLocalWorks} from './localWorks';
import {cacheRequiredWorkArtwork} from './dualCoverPipeline';
import {replaceLocalStageBooks,loadLocalStageBooks} from './localStageStore';
import {partitionLocalBooksByPublication,localWorksForReview} from './publicationPipeline';

type StageResult={stage:string;milliseconds:number;ok:boolean;details?:unknown;error?:string};
type Diagnostic={schema:string;startedAt:string;finishedAt?:string;cancelled?:boolean;selectedFolder?:string;steps:StageResult[];events:Array<{atMs:number;stage:string;message:string}>;grouping?:Array<{key:string;title:string;files:number;format:string;sampleNames:string[]}>;sourceDiagnostics?:unknown;failure?:string;limitations:string[]};
const checkpointPath=documentDirectory?documentDirectory+'archivist-pipeline-diagnostics-checkpoint.json':'';
const BG='#07151c',INK='#f5f0e8',ACCENT='#68c7b4';
const fullName=(uri:string)=>{try{return decodeURIComponent(uri).split('/').pop()||uri}catch{return uri}};
export default function DiagnosticApp(){
  const [folder,setFolder]=useState<LocalFolder|null>(null);
  const [busy,setBusy]=useState(false);
  const [online,setOnline]=useState(false);
  const [stage,setStage]=useState('Choose a library');
  const [seconds,setSeconds]=useState(0);
  const [lines,setLines]=useState<string[]>([]);
  const [report,setReport]=useState<Diagnostic|null>(null);
  const [checkpoint,setCheckpoint]=useState<Diagnostic|null>(null);
  const cancelled=useRef(false);
  const active=useRef(false);
  const startTime=useRef(0);
  const events=useRef<Diagnostic['events']>([]);
  const steps=useRef<StageResult[]>([]);
  const lastHeartbeat=useRef(0);
  const maxHeartbeatLag=useRef(0);
  const lastProgress=useRef(0);
  const activeStage=useRef('Idle');
  const currentReport=useRef<Diagnostic|null>(null);
  const lastCheckpoint=useRef(0);
  const checkpointPending=useRef<Promise<void>>(Promise.resolve());
  const lastStallWarning=useRef(0);
  const persistCheckpoint=(force=false)=>{
    const current=currentReport.current;
    if(!current||!checkpointPath)return;
    const now=Date.now();
    if(!force&&now-lastCheckpoint.current<2500)return;
    lastCheckpoint.current=now;
    const snapshot={...current,steps:[...steps.current],events:[...events.current],finishedAt:current.finishedAt||undefined};
    checkpointPending.current=checkpointPending.current.catch(()=>undefined).then(()=>writeAsStringAsync(checkpointPath,JSON.stringify(snapshot))).catch(()=>undefined);
  };
  useEffect(()=>{
    if(checkpointPath){void readAsStringAsync(checkpointPath).then(raw=>setCheckpoint(JSON.parse(raw) as Diagnostic)).catch(()=>undefined);}
    const timer=setInterval(()=>{
      if(!active.current)return;
      const now=Date.now();
      if(lastHeartbeat.current)maxHeartbeatLag.current=Math.max(maxHeartbeatLag.current,now-lastHeartbeat.current-500);
      lastHeartbeat.current=now;
      setSeconds(Math.floor((now-startTime.current)/1000));
      const idle=now-lastProgress.current;
      if(idle>4000){
        setStage(activeStage.current+' · no progress for '+Math.round(idle/1000)+'s');
        if(now-lastStallWarning.current>4000){
          lastStallWarning.current=now;
          events.current.push({atMs:now-startTime.current,stage:activeStage.current,message:'NO PROGRESS '+idle+'ms; operation still pending'});
        }
      }
      persistCheckpoint();
    },500);
    return()=>clearInterval(timer);
  },[]);
  const note=(name:string,msg:string)=>{
    const elapsed=Date.now()-startTime.current;
    activeStage.current=name;lastProgress.current=Date.now();
    events.current.push({atMs:elapsed,stage:name,message:msg});
    if(events.current.length>1400)events.current.shift();
    setStage(name);
    setLines(previous=>[...previous.slice(-40),Math.round(elapsed/1000)+'s  '+name+': '+msg]);
    persistCheckpoint();
  };
  const timed=async<T,>(label:string,job:()=>Promise<T>,describe:(value:T)=>unknown=()=>undefined):Promise<T>=>{
    const begin=Date.now();note(label,'started');
    try{
      const result=await job();
      const elapsed=Date.now()-begin;
      steps.current.push({stage:label,milliseconds:elapsed,ok:true,details:describe(result)});
      note(label,'finished in '+elapsed+' ms');
      return result;
    }catch(error){
      const elapsed=Date.now()-begin;
      steps.current.push({stage:label,milliseconds:elapsed,ok:false,error:String((error as Error)?.message||error)});
      note(label,'failed: '+String((error as Error)?.message||error));
      throw error;
    }
  };
  const selectFolder=async()=>{
    try{
      const picked=await pickLocalFolder();
      if(picked){setFolder(picked);setReport(null);setStage('Ready');setLines(['Folder selected. Media files will not be modified.']);}
    }catch(error){setLines(['Folder picker: '+String(error)]);}
  };
  const run=async()=>{
    if(active.current||!folder)return;
    active.current=true;cancelled.current=false;setBusy(true);setReport(null);setSeconds(0);setLines([]);
    setCheckpoint(null);lastStallWarning.current=0;lastCheckpoint.current=0;
    startTime.current=Date.now();lastProgress.current=startTime.current;lastHeartbeat.current=0;maxHeartbeatLag.current=0;
    events.current=[];steps.current=[];
    let finalBooks:LocalBook[]=[];
    const diagnostic:Diagnostic={
      schema:'archivist-actual-pipeline-diagnostic-v1',
      startedAt:new Date().toISOString(),
      selectedFolder:folder.uri,
      steps:steps.current,events:events.current,
      limitations:[
        'Runs Test 21 scanner, grouping, audio metadata extraction, archive metadata and local persistence functions inside an isolated Android app package.',
        'Reads media through the Android SAF picker; never renames, moves, modifies or deletes selected media.',
        'Local catalogue writes are made only to this separate diagnostic app private database.',
        'No access to existing Archivist user database or metadata provider keys.',
        'Online phase uses Open Library without authentication only when explicitly enabled.',
        'Report auto-checkpoints to this independent app private storage every few seconds so the last operation survives a force-close.',
        'Windows SMB scan times are a reference only and should not be compared directly with Android SAF stage timings.',
        'Progress watchdog records stalls but native DocumentsProvider reads may not be interruptible immediately.',
      ],
    };
    currentReport.current=diagnostic;
    persistCheckpoint(true);
    try{
      const result=await timed('01 Android discovery and file properties',()=>scanLocalFolders(
        [folder],p=>note('01 Android discovery and file properties',
          'phase='+p.phase+' visited='+p.entriesVisited+' media='+p.found),
        {},[],{deferEmbeddedCovers:true,deferEmbeddedMetadata:true,shouldContinue:()=>!cancelled.current}
      ),r=>({physicalFiles:r.books.length,logicalWorks:r.diagnostics?.logicalWorks,
        nativeDirectoryQueries:r.diagnostics?.nativeDirectoryQueries,
        fallbackDirectoryReads:r.diagnostics?.fallbackDirectoryReads,
        legacyDirectoryReads:r.diagnostics?.legacyDirectoryReads,
        perFileStats:r.diagnostics?.perFileStats,elapsedMs:r.diagnostics?.elapsedMs,skipped:r.skipped,truncated:r.truncated}));
      diagnostic.sourceDiagnostics=result.diagnostics;
      finalBooks=result.books;
      if(cancelled.current)return;
      await timed('02 Grouping before metadata',async()=>groupLocalWorks(finalBooks),
        works=>({logicalWorks:works.length,physicalFiles:finalBooks.length,multiFileWorks:works.filter(w=>w.files>1).length}));
      if(cancelled.current)return;
      await timed('03 Stage database save',async()=>{
        await replaceLocalStageBooks(finalBooks);return loadLocalStageBooks();
      },saved=>({persistedFiles:saved.length}));
      if(cancelled.current)return;
      const sampledAudioUris=fastAudioProbeUris(groupLocalWorks(finalBooks));
      note('04 Bounded embedded audio metadata','eligible audio samples='+sampledAudioUris.size);
      const embedded=await timed('04 Bounded embedded audio metadata',()=>enrichLocalEmbeddedMetadata(finalBooks,{
        fastAudioProperties:true,itemTimeoutMs:1200,batchSize:8,concurrency:1,maxConsecutiveTimeouts:3,
        shouldInspect:book=>book.format==='Audio'&&!book.embeddedMetadata&&sampledAudioUris.has(book.uri),
        shouldContinue:()=>!cancelled.current,
        onBatch:(_books,p)=>note('04 Bounded embedded audio metadata',
          'processed='+p.processed+'/'+p.total+' attempted='+p.attempted+' timeouts='+p.timedOut+' skipped='+p.skipped),
      }),r=>({attempted:r.attempted,processed:r.processed,timedOut:r.timedOut,skipped:r.skipped,updated:r.updated}));
      finalBooks=embedded.books;
      if(cancelled.current)return;
      const synced=await timed('05 Metadata and work regrouping',()=>synchronizeLocalMetadataCooperative(finalBooks,{shouldContinue:()=>!cancelled.current}),
        r=>({changed:r.updated,audioGroups:r.audioGroups,files:r.books.length}));
      finalBooks=synced.books;
      if(cancelled.current)return;
      const archive=await timed('06 Bounded comic and EPUB metadata',()=>enrichLocalBoundedArchiveEvidence(finalBooks,{
        batchSize:4,shouldContinue:()=>!cancelled.current,
        onBatch:(_books,p)=>note('06 Bounded comic and EPUB metadata',
          'processed='+p.processed+'/'+p.total+' blocked='+p.blocked),
      }),r=>({attempted:r.attempted,processed:r.processed,blocked:r.blocked,updated:r.updated}));
      finalBooks=archive.books;
      if(cancelled.current)return;
      if(online){
        const groups=groupLocalWorks(finalBooks);
        const eligible=groups.filter(w=>w.format==='Audio'||w.format==='EPUB'||w.format==='PDF').slice(0,16);
        const selected=eligible.map(w=>w.tracks[0]);
        await timed('07 Online Open Library sample (16 works max)',()=>enrichLocalBookMetadataOnline(selected,{
          openLibraryEnabled:true,concurrency:2,batchSize:4,
          shouldContinue:()=>!cancelled.current,
          onBatch:(_books,p)=>note('07 Online Open Library sample (16 works max)',
            'attempted='+p.attempted+' matched='+p.matched+' review='+p.review),
        }),r=>({attempted:r.attempted,matched:r.matched,review:r.review}));
      }
      if(cancelled.current)return;
      await timed('08 Cover/work grouping without network downloads',()=>cacheRequiredWorkArtwork(finalBooks,{
        documentDirectory,
        makeDirectoryAsync,downloadAsync,getInfoAsync,deleteAsync,
      },{shouldContinue:()=>!cancelled.current}),r=>({
        works:r.works,libraryReady:r.libraryReady,livingReady:r.livingReady,attemptedDownloads:r.attemptedDownloads,
      }));
      if(cancelled.current)return;
      const recovered=await timed('09 Local cover recovery',()=>enrichLocalBookCovers(finalBooks,{
        itemTimeoutMs:8000,batchSize:8,maxConsecutiveTimeouts:3,
        shouldContinue:()=>!cancelled.current,
        onBatch:(_books,p)=>note('09 Local cover recovery',
          'attempted='+p.attempted+' updated='+p.updated+' timeouts='+p.timedOut+' skipped='+p.skipped+' current='+String(p.current||'')),
      }),r=>({attempted:r.attempted,updated:r.updated,timedOut:r.timedOut,skipped:r.skipped}));
      finalBooks=recovered.books;
      if(cancelled.current)return;
      await timed('10 Publication gate and Needs Attention',async()=>{
        const partition=partitionLocalBooksByPublication(finalBooks);
        const review=localWorksForReview(finalBooks);
        return {partition,review};
      },r=>({publishedFiles:r.partition.published.length,stagedFiles:r.partition.staged.length,
        publishableWorks:[...r.partition.assessments.values()].filter(a=>a.ready).length,
        worksNeedingAttention:r.review.filter(w=>w.needsReview).length,
        blockerCounts:r.review.reduce((acc,item)=>{if(item.needsReview)acc[item.reviewReason||'unclassified']=(acc[item.reviewReason||'unclassified']||0)+1;return acc;},{} as Record<string,number>)}));
      if(cancelled.current)return;
      await timed('11 Final isolated database write',async()=>{await replaceLocalStageBooks(finalBooks);return loadLocalStageBooks();},
        saved=>({savedFiles:saved.length}));
      const works=groupLocalWorks(finalBooks);
      diagnostic.grouping=works.map(w=>({
        key:w.key,title:w.title,files:w.files,format:w.format,
        sampleNames:w.tracks.slice(0,5).map(t=>fullName(t.uri))
      }));
      note('Completed','physical files='+finalBooks.length+' logical works='+works.length);
    }catch(error){
      diagnostic.failure=String((error as Error)?.stack||(error as Error)?.message||error);
    }finally{
      diagnostic.cancelled=cancelled.current;
      diagnostic.finishedAt=new Date().toISOString();
      diagnostic.steps.push({stage:'JS UI heartbeat',milliseconds:maxHeartbeatLag.current,ok:true,
        details:{maxLagBeyond500ms:maxHeartbeatLag.current,elapsedMs:Date.now()-startTime.current}});
      persistCheckpoint(true);
      await checkpointPending.current.catch(()=>undefined);
      const saved={...diagnostic,steps:[...diagnostic.steps],events:[...diagnostic.events]};
      setReport(saved);setCheckpoint(saved);
      setBusy(false);active.current=false;
    }
  };
  const exportReport=async()=>{
    const available=report||currentReport.current||checkpoint;
    if(!available||!documentDirectory)return;
    try{
      const path=documentDirectory+'archivist-pipeline-diagnostic-'+Date.now()+'.json';
      const snapshot={...available,steps:busy?[...steps.current]:[...available.steps],events:busy?[...events.current]:[...available.events],exportedWhileRunning:busy};
      await writeAsStringAsync(path,JSON.stringify(snapshot,null,2));
      await Sharing.shareAsync(path,{mimeType:'application/json',dialogTitle:'Share Archivist pipeline diagnostics'});
    }catch(error){setLines(prev=>[...prev,'Export failed: '+String(error)]);}
  };
  const btn=(label:string,onPress:()=>void,disabled=false)=><TouchableOpacity
    key={label} disabled={disabled} onPress={onPress} style={{padding:14,marginVertical:6,borderRadius:10,
      backgroundColor:disabled?'#39464a':ACCENT,alignItems:'center'}}>
    <Text style={{color:disabled?'#bac1c1':'#07151c',fontWeight:'700'}}>{label}</Text>
  </TouchableOpacity>;
  return <SafeAreaView style={{flex:1,backgroundColor:BG}}>
    <ScrollView contentContainerStyle={{padding:22,paddingBottom:60,gap:8}}>
      <Text style={{fontSize:25,color:INK,fontWeight:'800'}}>Archivist Pipeline Diagnostics</Text>
      <Text style={{color:ACCENT,fontSize:12,fontWeight:'700'}}>INDEPENDENT APP • READ-ONLY MEDIA • TEST 21 LOGIC</Text>
      <Text style={{color:INK}}>This uses Archivist's real scanning and metadata code. It cannot access or reset the installed Archivist app or its database.</Text>
      {btn('1 — Choose audiobook or comic folder',()=>void selectFolder(),busy)}
      <Text style={{color:'#c0d0d0'}}>{folder?.name||'No folder chosen'}</Text>
      <View style={{flexDirection:'row',gap:14,alignItems:'center'}}>
        <Switch value={online} onValueChange={setOnline} disabled={busy}/>
        <Text style={{color:INK,flex:1}}>Also test Open Library online matching (up to 16 works; optional)</Text>
      </View>
      {btn('2 — Run real preparation pipeline',()=>void run(),busy||!folder)}
      {busy?btn('Cancel after current operation',()=>{cancelled.current=true;note('Cancel','requested');}):null}
      {btn(busy?'3 — Export partial JSON report':'3 — Export JSON report',()=>void exportReport(),!(busy||report||checkpoint))}
      <Text style={{color:ACCENT,fontWeight:'700'}}>Stage: {stage}</Text>
      <Text style={{color:INK}}>Elapsed: {seconds}s</Text>
      <Text style={{color:'#a7b8bc',fontSize:12}}>If a stage stalls, export a partial report immediately; a checkpoint is also saved in this separate app for next launch.</Text>
      {lines.map((line,i)=><Text key={i} style={{color:'#c6d1d1',fontSize:12}}>{line}</Text>)}
    </ScrollView>
  </SafeAreaView>;
}
