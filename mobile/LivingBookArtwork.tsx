import React from 'react';
import {Animated,View,Text,StyleSheet} from 'react-native';

/** Layered translucent discs work on native and web without a raster glow asset. */
export function AmbientGlow({color='#47736F',size=520,strength=1}:{color?:string;size?:number;strength?:number}){
  return <View pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',width:size,height:size,left:'50%',top:0,marginLeft:-size/2}}>{Array.from({length:24},(_,i)=>{const inset=i*size/64;return <View key={i} style={{position:'absolute',left:inset,top:inset,right:inset,bottom:inset,borderRadius:size,backgroundColor:color,opacity:.009*strength}}/>})}</View>;
}

export function LivingBookArtwork({title,author,chapter,number=1,open,turn,skip,direction,skipping,cover}:{title:string;author:string;chapter?:string;number?:number;open:Animated.Value;turn:Animated.Value;skip:Animated.Value;direction:1|-1;skipping:boolean;cover:React.ReactNode}){
  const page=(side:number)=><View style={s.pageContent}><Text numberOfLines={1} style={s.runningHead}>{title.toUpperCase()}</Text><Text numberOfLines={2} style={s.chapter}>{chapter||title}</Text><View style={{gap:3,marginTop:8}}>{Array.from({length:29},(_,i)=><View key={i} style={{height:1,backgroundColor:'#5C594B',opacity:.4,width:(i%8===7?56:i%5===0?89:96)+'%' as any,marginTop:i%8===0?4:0}}/>)}</View><Text style={s.pageNumber}>{Math.max(1,number*2+side)}</Text></View>;
  return <View accessibilityLabel="Living book artwork" style={s.stage}>
    <AmbientGlow size={440} strength={1.1}/>
    <View style={s.shadow}/>
    <Animated.View style={[s.book,{transform:[{perspective:1200},{rotateX:'9deg'},{scale:open.interpolate({inputRange:[0,1],outputRange:[.92,1]})}]}]}>
      <View style={s.binding}/>
      {[3,2,1].map(i=><View key={i} style={[s.pageEdge,{top:i*2,bottom:-i*2,left:3-i,right:3-i}]}/>)}
      <View style={[s.page,{left:0}]}>{page(0)}</View><View style={[s.page,{right:0}]}>{page(1)}</View>
      <View pointerEvents="none" style={s.gutter}/>
      {!skipping?<Animated.View pointerEvents="none" style={[s.page,s.leaf,{right:0,opacity:turn.interpolate({inputRange:[0,.02,.98,1],outputRange:[0,1,1,0]}),transformOrigin:'left center',transform:[{perspective:900},{rotateY:turn.interpolate({inputRange:[0,1],outputRange:['0deg','-180deg']})}]} as any]}>{page(1)}</Animated.View>:null}
      {skipping?[0,1,2].map(i=><Animated.View key={i} pointerEvents="none" style={[s.page,s.leaf,{left:direction===-1?0:undefined,right:direction===1?0:undefined,zIndex:7-i,opacity:skip.interpolate({inputRange:[i,i+.01,i+.98,i+1],outputRange:[0,1,1,0],extrapolate:'clamp'}),transformOrigin:direction===1?'left center':'right center',transform:[{perspective:900},{rotateY:skip.interpolate({inputRange:[i,i+1],outputRange:['0deg',direction===1?'-180deg':'180deg'],extrapolate:'clamp'})}]} as any]}>{page(direction===1?1:0)}</Animated.View>):null}
      <Animated.View pointerEvents="none" style={[s.front,{opacity:open.interpolate({inputRange:[0,.55,.85,1],outputRange:[1,1,0,0]}),transformOrigin:'left center',transform:[{perspective:900},{rotateY:open.interpolate({inputRange:[0,1],outputRange:['0deg','-180deg']})}]} as any]}>{cover||<View style={{flex:1,padding:14,borderWidth:1,borderColor:'#B99A68',margin:7,justifyContent:'space-between'}}><Text style={{color:'#B99A68',fontSize:7,letterSpacing:2,textAlign:'center'}}>ARCHIVIST</Text><Text numberOfLines={5} style={{fontFamily:'ArchivistEditorial',color:'#F1EAD5',fontSize:22,lineHeight:26,textAlign:'center'}}>{title}</Text><Text style={{color:'#BDB99E',fontSize:9,textAlign:'center'}}>{author}</Text></View>}</Animated.View>
    </Animated.View>
  </View>;
}
const s=StyleSheet.create({
 stage:{width:340,maxWidth:'100%',height:290,alignSelf:'center',alignItems:'center',justifyContent:'center'},
 book:{width:306,height:216,position:'relative'},binding:{position:'absolute',left:-6,right:-6,top:0,bottom:-10,backgroundColor:'#183337',borderRadius:2},
 shadow:{position:'absolute',width:290,height:18,bottom:28,backgroundColor:'#000',opacity:.22,borderRadius:150,boxShadow:'0px 10px 24px rgba(0,0,0,.25)'},
 pageEdge:{position:'absolute',backgroundColor:'#c6c1ac',borderBottomWidth:1,borderColor:'#a8a28d'},
 page:{position:'absolute',top:0,width:153,height:216,backgroundColor:'#eee9d5',borderWidth:.5,borderColor:'#cec9b5',overflow:'hidden'},
 pageContent:{flex:1,paddingHorizontal:13,paddingTop:10},runningHead:{fontFamily:'ArchivistEditorial',fontSize:5,lineHeight:7,color:'#696555',textAlign:'center'},chapter:{fontFamily:'ArchivistEditorial',fontSize:7,lineHeight:9,color:'#575344',marginTop:9,textAlign:'center'},pageNumber:{position:'absolute',bottom:9,alignSelf:'center',fontSize:5,color:'#77715f'},
 gutter:{position:'absolute',left:147,top:0,bottom:0,width:12,backgroundColor:'rgba(74,63,34,.08)',borderLeftWidth:2,borderRightWidth:1,borderColor:'rgba(74,63,34,.12)',zIndex:3},
 leaf:{zIndex:5,backfaceVisibility:'visible',boxShadow:'-3px 0px 8px rgba(55,45,20,.15)'},front:{position:'absolute',right:0,top:-2,width:153,height:222,overflow:'hidden',backgroundColor:'#183337',zIndex:10,backfaceVisibility:'hidden'}
});
