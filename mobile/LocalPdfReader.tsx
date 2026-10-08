import BookLoader from './BookLoader';
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Image,NativeModules,Pressable,Text,View,useWindowDimensions} from 'react-native';

type Props={uri:string;title:string;initialPage:number;requestedPage?:number|null;paper:string;ink:string;muted:string;line:string;sage:string;reduceMotion?:boolean;onPosition:(page:number,count:number,complete:boolean)=>void};
export default function LocalPdfReader({uri,title,initialPage,requestedPage,paper,ink,muted,line,sage,reduceMotion=false,onPosition}:Props){
  const {width}=useWindowDimensions();const [page,setPage]=useState(Math.max(0,initialPage));const [count,setCount]=useState(0);const [image,setImage]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const turn=useRef(new Animated.Value(0)).current;
  const module=NativeModules.ArchivistArchive;
  useEffect(()=>{let live=true;if(!module?.pdfPageCount){setError('Offline PDF paging requires the Archivist Android reader module.');setLoading(false);return;}module.pdfPageCount(uri).then((value:number)=>{if(!live)return;const total=Math.max(0,Number(value)||0);setCount(total);setPage(current=>Math.min(current,Math.max(0,total-1)));}).catch((e:any)=>{if(live){setError(e?.message||'Unable to open PDF.');setLoading(false);}});return()=>{live=false};},[uri,module]);
  useEffect(()=>{if(requestedPage===null||requestedPage===undefined||!count)return;setPage(Math.max(0,Math.min(count-1,requestedPage)));},[requestedPage,count]);
  useEffect(()=>{if(!count||!module?.renderPdfPage)return;let live=true;setLoading(true);setError('');module.renderPdfPage(uri,page,Math.round(Math.min(1600,Math.max(600,width*1.75)))).then((result:any)=>{if(!live)return;setImage('data:image/png;base64,'+String(result?.base64||''));setLoading(false);onPosition(page,count,page>=count-1);}).catch((e:any)=>{if(live){setError(e?.message||'Unable to render PDF page.');setLoading(false);}});return()=>{live=false};},[uri,page,count,width,module,onPosition]);
  const move=(delta:number)=>{const next=Math.max(0,Math.min(Math.max(0,count-1),page+delta));if(next===page)return;Animated.sequence([Animated.timing(turn,{toValue:delta>0?1:-1,duration:120,useNativeDriver:true}),Animated.timing(turn,{toValue:0,duration:1,useNativeDriver:true})]).start(()=>setPage(next));};
  return <View style={{flex:1,backgroundColor:paper}}>
    <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:10,overflow:'hidden'}}>
      {image?<Animated.View style={{maxWidth:'100%',maxHeight:'100%',transform:[{perspective:1200},{rotateY:turn.interpolate({inputRange:[-1,0,1],outputRange:['8deg','0deg','-8deg']})},{translateX:turn.interpolate({inputRange:[-1,0,1],outputRange:[18,0,-18]})}],opacity:turn.interpolate({inputRange:[-1,0,1],outputRange:[.72,1,.72]})}}><Image source={{uri:image}} resizeMode="contain" accessibilityLabel={`${title}, page ${page+1}`} style={{width:Math.min(width-20,900),height:'100%',minHeight:200}}/></Animated.View>:null}
      {loading?<View style={{position:'absolute',alignItems:'center',gap:8}}><BookLoader dark={paper==='#000000'} reduceMotion={reduceMotion} size={26} accessibilityLabel="Rendering PDF page"/><Text style={{color:muted}}>Rendering page…</Text></View>:null}
      {error?<Text accessibilityRole="alert" style={{color:ink,padding:20,textAlign:'center'}}>{error}</Text>:null}
    </View>
    <View style={{minHeight:58,borderTopWidth:1,borderColor:line,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:18,paddingHorizontal:14}}>
      <Pressable disabled={page<=0} accessibilityRole="button" accessibilityLabel="Previous PDF page" onPress={()=>move(-1)} style={{padding:12,opacity:page<=0?.35:1}}><Text style={{color:sage,fontWeight:'900'}}>Previous</Text></Pressable>
      <Text style={{color:muted,fontWeight:'800'}}>{count?`${page+1} / ${count}`:'—'}</Text>
      <Pressable disabled={!count||page>=count-1} accessibilityRole="button" accessibilityLabel="Next PDF page" onPress={()=>move(1)} style={{padding:12,opacity:!count||page>=count-1?.35:1}}><Text style={{color:sage,fontWeight:'900'}}>Next</Text></Pressable>
    </View>
  </View>;
}
