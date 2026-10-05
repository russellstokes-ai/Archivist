import React, {useState} from 'react';
import {Animated,View,Text,StyleSheet} from 'react-native';
import {LIVING_BOOK_GEOMETRY as G,livingBookDepthLayers} from './livingBookGeometry';

/** Layered translucent discs work on native and web without a raster glow asset. */
export function AmbientGlow({color='#47736F',size=520,strength=1}:{color?:string;size?:number;strength?:number}){
  return <View pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',width:size,height:size,left:'50%',top:0,marginLeft:-size/2}}>{Array.from({length:24},(_,i)=>{const inset=i*size/64;return <View key={i} style={{position:'absolute',left:inset,top:inset,right:inset,bottom:inset,borderRadius:size,backgroundColor:color,opacity:.009*strength}}/>})}</View>;
}

export function LivingBookArtwork({title,author,chapter,number=1,open,turn,skip,skipPages=3,direction,skipping,cover,glowColor='#2F8B86',glowStrength=.72}:{title:string;author:string;chapter?:string;number?:number;open:Animated.Value;turn:Animated.Value;skip:Animated.Value;skipPages?:number;direction:1|-1;skipping:boolean;cover:React.ReactNode;glowColor?:string;glowStrength?:number}){
  const [availableWidth,setAvailableWidth]=useState(390);
  const scale=Math.min(1,availableWidth/354);
  const page=(side:number)=><View style={s.pageContent}><Text numberOfLines={1} style={s.runningHead}>{title.toUpperCase()}</Text><Text numberOfLines={2} style={s.chapter}>{chapter||title}</Text><View style={{gap:3,marginTop:8}}>{Array.from({length:29},(_,i)=><View key={i} style={{height:1,backgroundColor:'#5C594B',opacity:.4,width:(i%8===7?56:i%5===0?89:96)+'%' as any,marginTop:i%8===0?4:0}}/>)}</View><Text style={s.pageNumber}>{Math.max(1,number*2+side)}</Text></View>;
  const coverArt=cover||<View style={s.fallbackCover}><Text style={s.fallbackKicker}>ARCHIVIST</Text><Text numberOfLines={5} style={s.fallbackTitle}>{title}</Text><Text style={s.fallbackAuthor}>{author}</Text></View>;
  const leafCount=Math.max(1,Math.min(6,Math.round(skipPages)));
  const internalOpacity=open.interpolate({
    inputRange:[0,G.internalRevealStart,G.internalRevealEnd,1],
    outputRange:[0,0,1,1],
    extrapolate:'clamp',
  });
  const leftPageAngle=open.interpolate({
    inputRange:[0,.12,.48,1],
    outputRange:['174deg','160deg','82deg','0deg'],
    extrapolate:'clamp',
  });
  const coverAngle=open.interpolate({
    inputRange:[0,.08,.55,1],
    outputRange:['0deg','-12deg','-104deg','-180deg'],
    extrapolate:'clamp',
  });
  const turnOpacity=Animated.multiply(
    open,
    turn.interpolate({inputRange:[0,.05,.9,1],outputRange:[0,.98,.98,0],extrapolate:'clamp'}),
  );
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={event=>setAvailableWidth(Math.max(1,event.nativeEvent.layout.width))} style={[s.stage,{height:320*scale}]}>
    <View pointerEvents="none" style={[s.stage,{maxWidth:undefined,transform:[{scale}]}]}>
      <AmbientGlow color={glowColor} size={520} strength={glowStrength}/>
      <Animated.View style={[s.shadow,{
        opacity:open.interpolate({inputRange:[0,.12,1],outputRange:[.16,.2,.24],extrapolate:'clamp'}),
        transform:[
          {translateX:open.interpolate({inputRange:[0,1],outputRange:[G.closedTranslateX,0]})},
          {scaleX:open.interpolate({inputRange:[0,1],outputRange:[.52,1]})},
        ],
      }]}/>
      <Animated.View style={[s.book,{
        transform:[{translateX:open.interpolate({inputRange:[0,1],outputRange:[G.closedTranslateX,G.openTranslateX]})}],
      }]}>
        <Animated.View style={[s.internalClip,{opacity:internalOpacity}]}>
          <View style={[s.coverBacking,{left:0}]}/>
          <View style={[s.coverBacking,{right:0}]}/>
          {livingBookDepthLayers().map(layer=><View key={layer.side+'-'+layer.offset} style={[
            s.pageEdge,
            {
              top:layer.top,
              bottom:layer.bottom,
              left:layer.side==='left'?0:G.spineX,
              width:G.pageWidth,
              opacity:.48-layer.offset*.07,
            },
          ]}/>)}
          <View style={[s.binding,{left:G.spineX-4}]}/>
          <View style={[s.page,{right:0}]}>{page(1)}</View>
          <Animated.View style={[s.page,{left:0,backfaceVisibility:'hidden',transformOrigin:'right center',transform:[
            {perspective:1400},
            {rotateY:leftPageAngle},
          ]}]}>{page(0)}</Animated.View>
          <View pointerEvents="none" style={s.gutter}/>
          {!skipping?<Animated.View pointerEvents="none" style={[s.page,s.leaf,{right:0,opacity:turnOpacity,transformOrigin:'left center',transform:[
            {perspective:1300},
            {translateX:turn.interpolate({inputRange:[0,.5,1],outputRange:[0,-4,0]})},
            {scaleX:turn.interpolate({inputRange:[0,.48,.52,1],outputRange:[1,.88,.88,1]})},
            {rotateY:turn.interpolate({inputRange:[0,.46,.54,1],outputRange:['0deg','-78deg','-102deg','-180deg']})},
          ]} as any]}>{page(1)}</Animated.View>:null}
          {skipping?Array.from({length:leafCount},(_,i)=>{
            const leafOpacity=Animated.multiply(
              open,
              skip.interpolate({inputRange:[i,i+.01,i+.98,i+1],outputRange:[0,1,1,0],extrapolate:'clamp'}),
            );
            return <Animated.View key={i} pointerEvents="none" style={[s.page,s.leaf,{
              left:direction===-1?0:undefined,
              right:direction===1?0:undefined,
              zIndex:9-i,
              opacity:leafOpacity,
              transformOrigin:direction===1?'left center':'right center',
              transform:[{perspective:1200},{rotateY:skip.interpolate({inputRange:[i,i+1],outputRange:['0deg',direction===1?'-180deg':'180deg'],extrapolate:'clamp'})}],
            } as any]}>{page(direction===1?1:0)}</Animated.View>;
          }):null}
        </Animated.View>
        <Animated.View pointerEvents="none" style={[s.front,{
          transformOrigin:'left center',
          transform:[{perspective:1300},{rotateY:coverAngle}],
        } as any]}>{coverArt}</Animated.View>
      </Animated.View>
    </View>
  </View>;
}

const s=StyleSheet.create({
  stage:{width:390,maxWidth:'100%',height:320,alignSelf:'center',alignItems:'center',justifyContent:'center'},
  book:{width:G.bookWidth,height:G.coverHeight,position:'relative'},
  internalClip:{position:'absolute',left:0,top:0,width:G.bookWidth,height:G.coverHeight,overflow:'hidden'},
  coverBacking:{position:'absolute',top:0,width:G.coverWidth,height:G.coverHeight,backgroundColor:'#183337',borderRadius:5,shadowColor:'#000',shadowOpacity:.12,shadowRadius:5,shadowOffset:{width:0,height:2}},
  binding:{position:'absolute',top:0,bottom:0,width:8,backgroundColor:'#183337',opacity:.88,zIndex:1},
  shadow:{position:'absolute',width:330,height:18,bottom:26,backgroundColor:'#000',borderRadius:165,shadowColor:'#000',shadowOpacity:.24,shadowRadius:22,shadowOffset:{width:0,height:10},elevation:4},
  fallbackCover:{flex:1,padding:16,borderWidth:1,borderColor:'#B99A68',margin:7,justifyContent:'space-between',backgroundColor:'#183337'},
  fallbackKicker:{color:'#B99A68',fontSize:7,letterSpacing:2,textAlign:'center'},
  fallbackTitle:{fontFamily:'ArchivistEditorial',color:'#F1EAD5',fontSize:23,lineHeight:27,textAlign:'center'},
  fallbackAuthor:{color:'#BDB99E',fontSize:9,textAlign:'center'},
  pageEdge:{position:'absolute',backgroundColor:'#c8c2ad',borderBottomWidth:.7,borderColor:'#aaa38e',zIndex:1},
  page:{position:'absolute',top:G.pageInsetY,width:G.pageWidth,height:G.pageHeight,backgroundColor:'#eee9d5',borderWidth:.5,borderColor:'#cec9b5',overflow:'hidden',zIndex:2},
  pageContent:{flex:1,paddingHorizontal:14,paddingTop:11},
  runningHead:{fontFamily:'ArchivistEditorial',fontSize:5.5,lineHeight:7.5,color:'#696555',textAlign:'center'},
  chapter:{fontFamily:'ArchivistEditorial',fontSize:7.5,lineHeight:9.5,color:'#575344',marginTop:9,textAlign:'center'},
  pageNumber:{position:'absolute',bottom:9,alignSelf:'center',fontSize:5.5,color:'#77715f'},
  gutter:{position:'absolute',left:G.spineX-6,top:G.pageInsetY,bottom:G.pageInsetY,width:12,backgroundColor:'rgba(74,63,34,.08)',borderLeftWidth:1,borderRightWidth:1,borderColor:'rgba(74,63,34,.11)',zIndex:4},
  leaf:{zIndex:6,backfaceVisibility:'visible',shadowColor:'#372D14',shadowOpacity:.14,shadowRadius:7,shadowOffset:{width:-3,height:0},elevation:5},
  front:{position:'absolute',right:0,top:0,width:G.coverWidth,height:G.coverHeight,overflow:'hidden',backgroundColor:'#183337',zIndex:12,backfaceVisibility:'hidden',borderRadius:6,shadowColor:'#000',shadowOpacity:.24,shadowRadius:18,shadowOffset:{width:0,height:9},elevation:8},
});
