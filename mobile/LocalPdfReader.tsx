import React,{useEffect,useRef,useState} from 'react';
import {Animated,Image,NativeModules,Pressable,Text,View,useWindowDimensions} from 'react-native';
import {ArchivistBookLoader} from './ArchivistBookLoader';
import {openPdfSession,pdfSessionReducer,visiblePdfImage,safePdfPage} from './pdfDocumentSession';

type Props={uri:string;title:string;initialPage:number;requestedPage?:number|null;paper:string;ink:string;muted:string;line:string;sage:string;reduceMotion?:boolean;onPosition:(page:number,count:number,complete:boolean)=>void};
export default function LocalPdfReader({uri,title,initialPage,requestedPage,paper,ink,muted,line,sage,reduceMotion=false,onPosition}:Props){
  const {width}=useWindowDimensions();
  const module=NativeModules.ArchivistArchive;
  const [session,setSession]=useState(()=>openPdfSession(uri,initialPage,1));
  const generationRef=useRef(1);
  const renderSeq=useRef(0);
  const onPositionRef=useRef(onPosition);
  onPositionRef.current=onPosition;
  const turn=useRef(new Animated.Value(0)).current;
  const renderWidth=Math.round(Math.min(1600,Math.max(600,width*1.75)));
  // Mask the old document immediately on the first render with a new URI,
  // even before React schedules the lifecycle reset effect.
  const active=session.uri===uri?session:openPdfSession(uri,initialPage,session.generation+1);
  const {count,loading,error}=active;
  // Keep the saved page internally while the document is uncounted, but
  // display a disabled first-page control until native paging succeeds.
  const page=count>0?active.page:0;
  const preferredPage=requestedPage===null||requestedPage===undefined?null:
    (count?Math.min(count-1,safePdfPage(requestedPage)):safePdfPage(requestedPage));
  const appliedRequest=useRef('');
  const requestSignature=preferredPage===null?'':uri+'|'+active.generation+'|'+requestedPage;
  const requestPending=!!requestSignature&&!!count&&appliedRequest.current!==requestSignature;
  const image=requestPending&&preferredPage!==page?'':visiblePdfImage(active,uri,page,renderWidth);
  const latest=useRef({uri,page,width:renderWidth});
  latest.current={uri,page,width:renderWidth};

  useEffect(()=>{
    let live=true;
    const generation=++generationRef.current;
    renderSeq.current++;
    turn.stopAnimation();
    turn.setValue(0);
    setSession(s=>pdfSessionReducer(s,{type:'open',uri,initialPage,generation}));
    if(!module?.pdfPageCount){
      setSession(s=>pdfSessionReducer(s,{type:'count-error',uri,generation,
        message:'Offline PDF paging requires the Archivist Android reader module.'}));
      return ()=>{live=false};
    }
    Promise.resolve().then(()=>module.pdfPageCount(uri)).then((value:number)=>{
      if(!live)return;
      const count=Number(value);
      setSession(s=>pdfSessionReducer(s,{type:'count',uri,generation,
        total:Number.isFinite(count)?Math.max(0,Math.floor(count)):0}));
    }).catch((e:any)=>{
      if(live)setSession(s=>pdfSessionReducer(s,{type:'count-error',uri,generation,
        message:e?.message||'Unable to open PDF.'}));
    });
    return ()=>{live=false};
  },[uri,module,turn]);

  useEffect(()=>{
    if(!requestPending||preferredPage===null||active.uri!==uri)return;
    // requestedPage is a one-time seek instruction. Later manual page turns
    // must not snap back to the old prop value.
    appliedRequest.current=requestSignature;
    if(preferredPage!==page)setSession(s=>pdfSessionReducer(s,{
      type:'page',uri,generation:active.generation,page:preferredPage,
    }));
  },[requestPending,requestSignature,preferredPage,count,uri,active.generation,active.uri]);

  useEffect(()=>{
    if(!count||active.uri!==uri||!module?.renderPdfPage)return;
    // A new requested position takes precedence over rendering the old page.
    if(requestPending&&preferredPage!==page)return;
    let live=true;
    const generation=active.generation;
    const request=++renderSeq.current;
    setSession(s=>pdfSessionReducer(s,{type:'render-start',uri,generation,page,request}));
    Promise.resolve().then(()=>module.renderPdfPage(uri,page,renderWidth)).then((result:any)=>{
      if(!live||renderSeq.current!==request||latest.current.uri!==uri||
         latest.current.page!==page||latest.current.width!==renderWidth)return;
      const base64=String(result?.base64||'');
      if(!base64)throw Error('Unable to render PDF page.');
      setSession(s=>pdfSessionReducer(s,{type:'render-success',uri,generation,page,
        request,width:renderWidth,dataUri:'data:image/png;base64,'+base64}));
      onPositionRef.current(page,count,page>=count-1);
    }).catch((e:any)=>{
      if(live&&renderSeq.current===request&&latest.current.uri===uri&&
         latest.current.page===page){
        setSession(s=>pdfSessionReducer(s,{type:'render-error',uri,generation,page,request,
          message:e?.message||'Unable to render PDF page.'}));
      }
    });
    return ()=>{live=false};
  },[uri,active.uri,active.generation,page,count,renderWidth,module,requestPending,preferredPage]);

  const move=(delta:number)=>{
    if(!count||active.uri!==uri)return;
    const next=Math.max(0,Math.min(count-1,page+delta));
    if(next===page)return;
    const generation=active.generation;
    Animated.sequence([
      Animated.timing(turn,{toValue:delta>0?1:-1,duration:120,useNativeDriver:true}),
      Animated.timing(turn,{toValue:0,duration:1,useNativeDriver:true}),
    ]).start(({finished})=>{
      if(!finished||latest.current.uri!==uri||latest.current.page!==page)return;
      setSession(s=>pdfSessionReducer(s,{type:'page',uri,generation,page:next}));
    });
  };
  return <View style={{flex:1,backgroundColor:paper}}>
    <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:10,overflow:'hidden'}}>
      {image?<Animated.View style={{maxWidth:'100%',maxHeight:'100%',transform:[{perspective:1200},{rotateY:turn.interpolate({inputRange:[-1,0,1],outputRange:['8deg','0deg','-8deg']})},{translateX:turn.interpolate({inputRange:[-1,0,1],outputRange:[18,0,-18]})}],opacity:turn.interpolate({inputRange:[-1,0,1],outputRange:[.72,1,.72]})}}><Image source={{uri:image}} resizeMode="contain" accessibilityLabel={`${title}, page ${page+1}`} style={{width:Math.min(width-20,900),height:'100%',minHeight:200}}/></Animated.View>:null}
      {loading?<View style={{position:'absolute',alignItems:'center',gap:8}}><ArchivistBookLoader label="Rendering PDF page" size="reader" reduceMotion={reduceMotion}/><Text style={{color:muted}}>Rendering page…</Text></View>:null}
      {error?<Text accessibilityRole="alert" style={{color:ink,padding:20,textAlign:'center'}}>{error}</Text>:null}
    </View>
    <View style={{minHeight:58,borderTopWidth:1,borderColor:line,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:18,paddingHorizontal:14}}>
      <Pressable disabled={page<=0} accessibilityRole="button" accessibilityLabel="Previous PDF page" onPress={()=>move(-1)} style={{padding:12,opacity:page<=0?.35:1}}><Text style={{color:sage,fontWeight:'900'}}>Previous</Text></Pressable>
      <Text style={{color:muted,fontWeight:'800'}}>{count?`${page+1} / ${count}`:'—'}</Text>
      <Pressable disabled={!count||page>=count-1} accessibilityRole="button" accessibilityLabel="Next PDF page" onPress={()=>move(1)} style={{padding:12,opacity:!count||page>=count-1?.35:1}}><Text style={{color:sage,fontWeight:'900'}}>Next</Text></Pressable>
    </View>
  </View>;
}
