'use strict';
// Exact, reversible owner-approved edits against the protected App source.
// Used by BOTH Metro and the effective-source TypeScript/regression checks.
// No file writes, process execution, network access or runtime monkey-patching.
const crypto=require('node:crypto');
const baseGitBlob='5ec933dc6a0fa013cb370c72971d293c32a64ca6';
function gitBlob(text){const bytes=Buffer.from(text,'utf8');return crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');}
function once(text,before,after,label){if(!before||text.split(before).length!==2)throw Error('Three-fix source anchor is not unique: '+label);return text.replace(before,()=>after);}
function applyWithManifest(input){
 let code=input.replace(/\r\n/g,'\n');
 if(gitBlob(code)!==baseGitBlob)throw Error('App source changed. Rebase and review the three-fix patch before building.');
 const edits=[];
 const edit=(label,before,after)=>{code=once(code,before,after,label);edits.push({label,before,after});};
 const scope=(label,start,end,change)=>{const from=code.indexOf(start),to=code.indexOf(end,from+start.length);if(from<0||to<from)throw Error('Missing scoped source block: '+label);const before=code.slice(from,to);edit(label,before,change(before));};
 edit('three-fix imports',"import React,", "import {ProfilePhotoPreview} from './ProfilePhotoPreview';\nimport {commitProfilePhoto,validateProfilePhoto,type ProfilePhotoDraft} from './profilePhotoCommit';\nimport {CompactPageHeader} from './CompactPageHeader';\nimport React,");
 scope('verified private photo copy','async function persistPickedProfilePhoto(', '\n}',body=>{
  return once(body,"  await copyAsync({from:uri,to:target});\n  return target;",`  try{
    await copyAsync({from:uri,to:target});
    const info=await getInfoAsync(target);
    if(!info.exists||info.isDirectory||!Number.isFinite(info.size)||info.size<1||info.size>15*1024*1024)throw new Error('The photo could not be stored. Choose an image smaller than 15 MB.');
    return target;
  }catch(error){
    await deleteAsync(target,{idempotent:true}).catch(()=>undefined);
    throw error;
  }`,'private photo copy verification');
 });
 edit('profile draft state',"  const avatarColours=",`  const [profilePhotoDraft,setProfilePhotoDraft]=useState<ProfilePhotoDraft|null>(null);
  const [profilePhotoSaving,setProfilePhotoSaving]=useState(false);
  const [profilePhotoPicking,setProfilePhotoPicking]=useState(false);
  const [profilePhotoError,setProfilePhotoError]=useState('');
  const profilePhotoBusyRef=useRef(false),profilePhotoGenerationRef=useRef(0);
  useEffect(()=>()=>{profilePhotoGenerationRef.current++;},[]);

  const avatarColours=`);
 scope('photo select and confirm','  async function chooseProfilePhoto(){','\n  function openProfileMenu()',()=>`  async function chooseProfilePhoto(){
    if(profilePhotoBusyRef.current)return;
    profilePhotoBusyRef.current=true;
    const generation=++profilePhotoGenerationRef.current;
    setProfilePhotoPicking(true);setError('');setProfilePhotoError('');
    try{
      const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:false,quality:.9,selectionLimit:1});
      if(generation!==profilePhotoGenerationRef.current||result.canceled||!result.assets?.length)return;
      const asset=result.assets[0];
      const draft:ProfilePhotoDraft={uri:asset.uri,fileName:asset.fileName,fileSize:asset.fileSize};
      validateProfilePhoto(draft);
      setProfilePhotoDraft(draft);
    }catch(e){if(generation===profilePhotoGenerationRef.current)setError((e as Error).message);}
    finally{if(generation===profilePhotoGenerationRef.current){profilePhotoBusyRef.current=false;setProfilePhotoPicking(false);}}
  }

  async function confirmProfilePhoto(){
    if(!profilePhotoDraft||profilePhotoBusyRef.current)return;
    profilePhotoBusyRef.current=true;setProfilePhotoSaving(true);setProfilePhotoError('');
    const generation=profilePhotoGenerationRef.current;
    try{
      const next=await commitProfilePhoto(profilePhotoDraft,profileAvatar,{
        copy:draft=>persistPickedProfilePhoto(draft.uri,draft.fileName),
        save:next=>setPersistedJSON(profileAvatarKey,next),
        remove:async uri=>{if(documentDirectory&&uri.startsWith(documentDirectory+'profile/'))await deleteAsync(uri,{idempotent:true});},
        shouldContinue:()=>generation===profilePhotoGenerationRef.current,
      });
      if(generation!==profilePhotoGenerationRef.current)return;
      setProfileAvatar(next);setProfilePhotoDraft(null);
    }catch(e){if(generation===profilePhotoGenerationRef.current)setProfilePhotoError((e as Error).message||'Photo could not be saved. Your previous photo is unchanged.');}
    finally{if(generation===profilePhotoGenerationRef.current){profilePhotoBusyRef.current=false;setProfilePhotoSaving(false);}}
  }
`);
 scope('profile hero action and confirmation','  function Profile() {','\n  function Rewards() {',body=>{
  body=once(body,'    return <ScrollView','    return <><ScrollView','profile modal sibling opening');
  body=once(body,'        <View style={styles.profileIdentityRing}>','        <View style={{alignItems:\'center\',gap:10}}><View style={styles.profileIdentityRing}>','profile ring column');
  body=once(body,'        </View>\n        <View style={styles.profileIdentityCopy}>',`        </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" accessibilityState={{disabled:profilePhotoPicking||profilePhotoSaving}} disabled={profilePhotoPicking||profilePhotoSaving} onPress={()=>void chooseProfilePhoto()} style={({pressed})=>({minHeight:48,minWidth:112,paddingHorizontal:12,paddingVertical:12,borderRadius:12,borderWidth:1,borderColor:p.gold,backgroundColor:p.card,alignItems:'center',justifyContent:'center',opacity:(profilePhotoPicking||profilePhotoSaving)?0.5:pressed?0.75:1})}>
            <Text style={{color:p.ink,fontSize:14,fontWeight:'700'}}>Change photo</Text>
          </Pressable>
        </View>
        <View style={styles.profileIdentityCopy}>`,'visible photo action');
  body=once(body,`            <Button label={profileAvatar.photoUri?'Change photo':'Choose photo'} tone="quiet" onPress={()=>void chooseProfilePhoto()}/>\n`,'','remove duplicate inconspicuous photo link');
  body=once(body,'    </ScrollView>;',`    </ScrollView>
      {profilePhotoDraft?<ProfilePhotoPreview key={profilePhotoDraft.uri} draft={profilePhotoDraft} saving={profilePhotoSaving} error={profilePhotoError} reduceMotion={reduceMotion} palette={{background:p.raised,ink:p.ink,muted:p.muted,accent:p.gold,line:p.line,danger:p.danger}} onUse={()=>void confirmProfilePhoto()} onCancel={()=>{if(!profilePhotoBusyRef.current){setProfilePhotoDraft(null);setProfilePhotoError('');}}}/>:null}
    </>;`,'visible use-photo confirmation');
  return body;
 });
 edit('compact Shelf header',`      <PageHeader title="Shelf" subtitle={shelfGreeting+' Pick up where you left off.'}/>
      <PageToolbar>
        <Pressable accessibilityRole="button" accessibilityLabel="Customise Shelf" onPress={()=>setShelfManageOpen(true)} style={styles.headerAction}>
          <UiIcon name="settings" color={p.sage} size={17}/><Text style={[styles.headerActionText,{color:p.sage}]}>Arrange</Text>
        </Pressable>
      </PageToolbar>`,`      <CompactPageHeader testID="shelf-page-header-group" width={width} largeText={accessibilityPrefs.largeText} header={<PageHeader title="Shelf" subtitle={shelfGreeting+' Pick up where you left off.'}/>}>
        <Pressable accessibilityRole="button" accessibilityLabel="Customise Shelf" onPress={()=>setShelfManageOpen(true)} style={styles.headerAction}>
          <UiIcon name="settings" color={p.sage} size={17}/><Text style={[styles.headerActionText,{color:p.sage}]}>Arrange</Text>
        </Pressable>
      </CompactPageHeader>`);
 edit('compact Atlas header',`        <PageHeader
          title="Atlas"
          subtitle="Characters, stories and ideas — your reading universe."
        />
        <PageToolbar>
          <Pressable accessibilityRole="button" accessibilityLabel={atlasListMode?'Show Atlas universe':'Show Atlas list'} onPress={()=>setAtlasListMode(value=>!value)} style={styles.headerAction}>
            <UiIcon name={atlasListMode?'atlas':'list'} color={p.sage} size={17}/><Text style={[styles.headerActionText,{color:p.sage}]}>{atlasListMode?'Universe':'List'}</Text>
          </Pressable>
        </PageToolbar>`,`        <CompactPageHeader testID="atlas-page-header-group" width={width} largeText={accessibilityPrefs.largeText} header={<PageHeader title="Atlas" subtitle="Characters, stories and ideas — your reading universe."/>}>
          <Pressable accessibilityRole="button" accessibilityLabel={atlasListMode?'Show Atlas universe':'Show Atlas list'} onPress={()=>setAtlasListMode(value=>!value)} style={styles.headerAction}>
            <UiIcon name={atlasListMode?'atlas':'list'} color={p.sage} size={17}/><Text style={[styles.headerActionText,{color:p.sage}]}>{atlasListMode?'Universe':'List'}</Text>
          </Pressable>
        </CompactPageHeader>`);
 edit('scan ownership and slow-operation feedback','  const scanFrame=()=>',`  const activeScanOwnerRef=useRef<number|null>(null);
  useEffect(()=>{
    if(!localScanning||!scanProgress)return;
    const pending=scanProgress;
    const timer=setTimeout(()=>{
      if(activeScanOwnerRef.current===null)return;
      setLocalFolderNotice('Refresh is still waiting at '+(pending.currentFolder||scanPhaseLabel(pending.phase))+'. You can cancel; the previous committed library is retained.');
      console.warn('ArchivistScanWaiting',{phase:pending.phase,processed:pending.processed??0,total:pending.total??0});
    },30000);
    return()=>clearTimeout(timer);
  },[localScanning,scanProgress?.phase,scanProgress?.currentFolder,scanProgress?.processed,scanProgress?.found]);
  const scanFrame=()=>`);
 scope('scan generation ownership','  const beginLocalScan=()=>{','\n  const reportLocalScan=',body=>once(body,'    const generation=scanCommitGate.begin();','    const generation=scanCommitGate.begin();\n    activeScanOwnerRef.current=generation;','own the actual running scan'));
 scope('operation transitions are never count-throttled','  const reportLocalScan=(generation:number)=>{','\n  const endLocalScan=',()=>`  const reportLocalScan=(generation:number)=>{
    let last=0,lastOperation='';
    return (progress:LocalScanProgress)=>{
      const now=Date.now(),operation=progress.phase+'|'+progress.currentFolder;
      if(scanCommitGate.isCurrent(generation)&&(operation!==lastOperation||now-last>=150)){
        last=now;lastOperation=operation;setScanProgress(progress);
      }
    };
  };`);
 scope('release scan only after actual settlement','  const endLocalScan=(generation:number)=>{','\n  const recordLibraryRefreshWarning=',()=>`  const endLocalScan=(generation:number)=>{
    if(activeScanOwnerRef.current!==generation)return;
    activeScanOwnerRef.current=null;
    libraryRefreshRunningRef.current=false;
    setLocalScanning(false);
    setScanProgress(null);
  };`);
 scope('safe cancellation without a second overlapping scan','  const cancelLibraryRefresh=()=>{','\n\n  async function finaliseLocalScan(',()=>`  const cancelLibraryRefresh=()=>{
    if(!libraryRefreshRunningRef.current&&!activeLibraryProgress)return;
    scanCommitGate.invalidate();
    setEnrichmentProgress(null);
    if(activeScanOwnerRef.current===null){setLocalScanning(false);setScanProgress(null);}
    else setScanProgress(current=>current?{...current,currentFolder:'Cancelling the current operation safely…'}:null);
    setLocalFolderNotice(activeScanOwnerRef.current===null?'Refresh cancelled · the last committed library was kept.':'Cancelling refresh safely · the current operation must settle before another scan can start.');
    setMetadataSettingsNotice('Metadata refresh cancelled.');
  };`);
 scope('observable cancellation-aware baseline commit','  async function finaliseLocalScan(','\n  async function checkpointLocalEnrichment',body=>{
  body=once(body,`    const baselinePersisted=await replaceLocalStageBooks(result.books)
      .then(()=>true)
      .catch(error=>{recordLibraryRefreshWarning('Catalogue database',error);return false;});`,`    const baselinePersisted=await replaceLocalStageBooks(result.books,{
      shouldContinue:()=>scanCommitGate.isCurrent(generation),
      onProgress:progress=>{
        if(!scanCommitGate.isCurrent(generation))return;
        const operation=progress.stage==='waiting'?'Waiting for the catalogue database':progress.stage==='committed'?'Catalogue saved':'Saving library rows';
        setScanProgress({phase:'preparing',currentFolder:operation,entriesVisited:result.entriesVisited,found:result.books.length,review:result.review,processed:progress.processed,total:progress.total});
      },
    })
      .then(()=>true)
      .catch(error=>{if(!scanCommitGate.isCurrent(generation))return false;recordLibraryRefreshWarning('Catalogue database',error);throw error;});`,'final save options');
  body=once(body,'    setScanProgress(null);',`    setScanProgress({phase:'complete',currentFolder:'Catalogue saved',entriesVisited:result.entriesVisited,found:result.books.length,review:result.review,processed:result.books.length,total:result.books.length});
    await scanFrame();
    if(!scanCommitGate.isCurrent(generation))return null;
    setScanProgress(null);`,'complete only after durable save');
  return body;
 });
 scope('stale enrichment cannot replace newer catalogue','  async function checkpointLocalEnrichment(','\n  async function enrichPublishedLocalLibrary',body=>once(body,'replaceLocalStageBooks(books)','replaceLocalStageBooks(books,{shouldContinue:()=>scanCommitGate.isCurrent(generation)})','checkpoint generation guard'));
 scope('final enrichment save keeps its generation','  async function enrichPublishedLocalLibrary(','\n  async function enrichPublishedLocalEmbeddedMetadata',body=>once(body,'replaceLocalStageBooks(currentBooks)','replaceLocalStageBooks(currentBooks,{shouldContinue:()=>scanCommitGate.isCurrent(generation)})','final enrichment generation guard'));
 let restored=code;
 for(const change of [...edits].reverse())restored=once(restored,change.after,change.before,'reverse '+change.label);
 if(restored!==input.replace(/\r\n/g,'\n')||gitBlob(restored)!==baseGitBlob)throw Error('The three-fix patch changed code outside its exact edit manifest.');
 return {code,edits,baseGitBlob,effectiveGitBlob:gitBlob(code)};
}
module.exports={baseGitBlob,gitBlob,applyWithManifest,apply:input=>applyWithManifest(input).code};
