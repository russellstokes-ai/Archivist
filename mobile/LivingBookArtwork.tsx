import React from 'react';
import {Animated,View,Text,StyleSheet} from 'react-native';

/** Layered translucent discs work on native and web without a raster glow asset. */
export function AmbientGlow({color='#47736F',size=520,strength=1}:{color?:string;size?:number;strength?:number}){
  return <View pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',width:size,height:size,left:'50%',top:0,marginLeft:-size/2}}>{Array.from({length:24},(_,i)=>{const inset=i*size/64;return <View key={i} style={{position:'absolute',left:inset,top:inset,right:inset,bottom:inset,borderRadius:size,backgroundColor:color,opacity:.009*strength}}/>})}</View>;
}

export function LivingBookArtwork({title,author,chapter,number=1,open,turn,skip,skipPages=3,direction,skipping,cover}:{title:string;author:string;chapter?:string;number?:number;open:Animated.Value;turn:Animated.Value;skip:Animated.Value;skipPages?:number;direction:1|-1;skipping:boolean;cover:React.ReactNode}){
  const page=(side:number)=><View style={s.pageContent}><Text numberOfLines={1} style={s.runningHead}>{title.toUpperCase()}</Text><Text numberOfLines={2} style={s.chapter}>{chapter||title}</Text><View style={{gap:3,marginTop:8}}>{Array.from({length:29},(_,i)=><View key={i} style={{height:1,backgroundColor:'#5C594B',opacity:.4,width:(i%8===7?56:i%5===0?89:96)+'%' as any,marginTop:i%8===0?4:0}}/>)}</View><Text style={s.pageNumber}>{Math.max(1,number*2+side)}</Text></View>;
  const coverArt=cover||<View style={s.fallbackCover}><Text style={s.fallbackKicker}>ARCHIVIST</Text><Text numberOfLines={5} style={s.fallbackTitle}>{title}</Text><Text style={s.fallbackAuthor}>{author}</Text></View>;
  const leafCount=Math.max(1,Math.min(5,Math.round(skipPages)));
  return <View accessibilityLabel="Living book artwork" style={s.stage}>
    <AmbientGlow color="#2F8B86" size={520} strength={.72}/>
    <View style={s.shadow}/>
    <Animated.View style={[s.closedCover,{opacity:open.interpolate({inputRange:[0,.18,.62,1],outputRange:[1,1,.18,0]}),transform:[{perspective:1000},{rotateX:'7deg'},{scale:open.interpolate({inputRange:[0,1],outputRange:[1,.88]})},{translateX:open.interpolate({inputRange:[0,1],outputRange:[0,34]})}]}]}>{coverArt}</Animated.View>
    <Animated.View style={[s.book,{opacity:open.interpolate({inputRange:[0,.12,.38,1],outputRange:[0,.08,1,1]}),transform:[{perspective:1200},{rotateX:'9deg'},{scale:open.interpolate({inputRange:[0,1],outputRange:[.88,1]})}]}]}>
      <View style={s.binding}/>
      {[3,2,1].map(i=><View key={i} style={[s.pageEdge,{top:i*2,bottom:-i*2,left:3-i,right:3-i}]}/>)}
      <View style={[s.page,{left:0}]}>{page(0)}</View><View style={[s.page,{right:0}]}>{page(1)}</View>
      <View pointerEvents="none" style={s.gutter}/>
      {!skipping?<Animated.View pointerEvents="none" style={[s.page,s.leaf,{right:0,opacity:turn.interpolate({inputRange:[0,.02,.98,1],outputRange:[0,1,1,0]}),transformOrigin:'left center',transform:[{perspective:900},{rotateY:turn.interpolate({inputRange:[0,1],outputRange:['0deg','-180deg']})}]} as any]}>{page(1)}</Animated.View>:null}
      {skipping?Array.from({length:leafCount},(_,i)=><Animated.View key={i} pointerEvents="none" style={[s.page,s.leaf,{left:direction===-1?0:undefined,right:direction===1?0:undefined,zIndex:9-i,opacity:skip.interpolate({inputRange:[i,i+.01,i+.98,i+1],outputRange:[0,1,1,0],extrapolate:'clamp'}),transformOrigin:direction===1?'left center':'right center',transform:[{perspective:900},{rotateY:skip.interpolate({inputRange:[i,i+1],outputRange:['0deg',direction===1?'-180deg':'180deg'],extrapolate:'clamp'})}]} as any]}>{page(direction===1?1:0)}</Animated.View>):null}
      <Animated.View pointerEvents="none" style={[s.front,{opacity:open.interpolate({inputRange:[0,.28,.92,1],outputRange:[0,1,1,0]}),transformOrigin:'left center',transform:[{perspective:900},{rotateY:open.interpolate({inputRange:[0,1],outputRange:['0deg','-180deg']})}]} as any]}>{coverArt}</Animated.View>
    </Animated.View>
  </View>;
}
const s=StyleSheet.create({
 stage:{width:390,maxWidth:'100%',height:320,alignSelf:'center',alignItems:'center',justifyContent:'center'},
 book:{width:342,height:238,position:'relative'},
 binding:{position:'absolute',left:-6,right:-6,top:0,bottom:-10,backgroundColor:'#183337',borderRadius:3},
 shadow:{position:'absolute',width:324,height:20,bottom:28,backgroundColor:'#000',opacity:.22,borderRadius:162,shadowColor:'#000',shadowOpacity:.25,shadowRadius:24,shadowOffset:{width:0,height:10},elevation:4},
 closedCover:{position:'absolute',width:174,height:246,borderRadius:8,overflow:'hidden',backgroundColor:'#183337',shadowColor:'#000',shadowOpacity:.24,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:7,zIndex:12},
 fallbackCover:{flex:1,padding:16,borderWidth:1,borderColor:'#B99A68',margin:7,justifyContent:'space-between',backgroundColor:'#183337'},
 fallbackKicker:{color:'#B99A68',fontSize:7,letterSpacing:2,textAlign:'center'},
 fallbackTitle:{fontFamily:'ArchivistEditorial',color:'#F1EAD5',fontSize:23,lineHeight:27,textAlign:'center'},
 fallbackAuthor:{color:'#BDB99E',fontSize:9,textAlign:'center'},
 pageEdge:{position:'absolute',backgroundColor:'#c6c1ac',borderBottomWidth:1,borderColor:'#a8a28d'},
 page:{position:'absolute',top:0,width:171,height:238,backgroundColor:'#eee9d5',borderWidth:.5,borderColor:'#cec9b5',overflow:'hidden'},
 pageContent:{flex:1,paddingHorizontal:14,paddingTop:11},
 runningHead:{fontFamily:'ArchivistEditorial',fontSize:5.5,lineHeight:7.5,color:'#696555',textAlign:'center'},
 chapter:{fontFamily:'ArchivistEditorial',fontSize:7.5,lineHeight:9.5,color:'#575344',marginTop:9,textAlign:'center'},
 pageNumber:{position:'absolute',bottom:9,alignSelf:'center',fontSize:5.5,color:'#77715f'},
 gutter:{position:'absolute',left:165,top:0,bottom:0,width:12,backgroundColor:'rgba(74,63,34,.08)',borderLeftWidth:2,borderRightWidth:1,borderColor:'rgba(74,63,34,.12)',zIndex:3},
 leaf:{zIndex:5,backfaceVisibility:'visible',shadowColor:'#372D14',shadowOpacity:.16,shadowRadius:8,shadowOffset:{width:-3,height:0},elevation:5},
 front:{position:'absolute',right:0,top:-3,width:171,height:244,overflow:'hidden',backgroundColor:'#183337',zIndex:10,backfaceVisibility:'hidden',borderTopRightRadius:5,borderBottomRightRadius:5}
});
