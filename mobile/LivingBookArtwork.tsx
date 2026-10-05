import React, {useState} from 'react';
import {Animated,View,Text,StyleSheet} from 'react-native';
import {LIVING_BOOK_GEOMETRY as G,LIVING_BOOK_MOTION as M,livingBookDepthLayers} from './livingBookGeometry';

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

  // Every visual layer derives from the same normalized hinge value.
  const internalOpacity=open.interpolate({
    inputRange:[0,G.internalRevealStart,G.internalRevealEnd,1],
    outputRange:[0,0,1,1],
    extrapolate:'clamp',
  });
  const leafGate=open.interpolate({
    inputRange:[0,G.leafRevealStart,G.leafRevealEnd,1],
    outputRange:[0,0,1,1],
    extrapolate:'clamp',
  });
  const leftPageAngle=open.interpolate({
    inputRange:[...M.leftPageProgress],
    outputRange:[...M.leftPageAngles],
    extrapolate:'clamp',
  });
  const coverAngle=open.interpolate({
    inputRange:[...M.coverProgress],
    outputRange:[...M.coverAngles],
    extrapolate:'clamp',
  });
  const turnOpacity=Animated.multiply(
    leafGate,
    turn.interpolate({inputRange:[0,.04,.94,1],outputRange:[0,1,1,0],extrapolate:'clamp'}),
  );

  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={event=>setAvailableWidth(Math.max(1,event.nativeEvent.layout.width))} style={[s.stage,{height:320*scale}]}>
    <View pointerEvents="none" style={[s.stage,{maxWidth:undefined,transform:[{scale}]}]}>
      <AmbientGlow color={glowColor} size={520} strength={glowStrength}/>

      {/* A flat, footprint-anchored shadow replaces native shadows on rotating views. */}
      <Animated.View style={[s.groundShadow,{
        opacity:open.interpolate({inputRange:[...M.shadowProgress],outputRange:[...M.shadowOpacity],extrapolate:'clamp'}),
        transformOrigin:'right center',
        transform:[
          {translateX:open.interpolate({inputRange:[0,1],outputRange:[G.closedTranslateX,G.openTranslateX]})},
          {scaleX:open.interpolate({inputRange:[...M.shadowProgress],outputRange:[...M.shadowScale],extrapolate:'clamp'})},
        ],
      } as any]}/>

      <Animated.View style={[s.book,{
        transform:[{translateX:open.interpolate({inputRange:[0,1],outputRange:[G.closedTranslateX,G.openTranslateX]})}],
      }]}>
        {/* Static spread may clip to the hardcover silhouette; turning leaves never live here. */}
        <Animated.View style={[s.baseSpread,{opacity:internalOpacity}]}>
          <View style={[s.coverBacking,{left:0}]}/>
          <View style={[s.coverBacking,{right:0}]}/>
          {livingBookDepthLayers().map(layer=><View key={layer.side+'-'+layer.offset} style={[
            s.pageEdge,
            {
              top:layer.top,
              bottom:layer.bottom,
              left:layer.side==='left'?0:G.spineX-G.spineOverlap,
              width:layer.side==='left'?G.pageWidth:G.pageWidth+G.spineOverlap,
              opacity:.48-layer.offset*.07,
            },
          ]}/>)}
          <View style={[s.binding,{left:G.spineX-4}]}/>
          <View style={[s.page,s.rightPage,{right:0}]}>{page(1)}</View>
          <View pointerEvents="none" style={s.gutter}>
            <View style={s.gutterLeftShadow}/>
            <View style={s.gutterLeftHighlight}/>
            <View style={s.gutterCrease}/>
            <View style={s.gutterRightHighlight}/>
            <View style={s.gutterRightShadow}/>
          </View>
        </Animated.View>

        {/* Two-sided cover: the front never pops out at the 90-degree hinge crossing. */}
        <Animated.View pointerEvents="none" style={[s.coverLeaf,{
          transformOrigin:'left center',
          transform:[{perspective:1400},{rotateY:coverAngle}],
        } as any]}>
          <View style={s.coverFrontFace}>{coverArt}<View style={s.coverSpineShade}/></View>
          <View style={[s.coverInsideFace,{transform:[{rotateY:'180deg'}]}]}><View style={s.insidePanel}/><View style={s.coverSpineShade}/></View>
        </Animated.View>

        {/* The left page sits above the inside cover only after the book reveals it. */}
        <Animated.View style={[s.page,s.leftPage,{opacity:internalOpacity,transformOrigin:'right center',transform:[
          {perspective:1400},
          {rotateY:leftPageAngle},
        ]} as any]}>{page(0)}</Animated.View>

        {/* Oversized, unclipped envelope prevents perspective turns being cut at the top/edges. */}
        <View pointerEvents="none" style={s.leafEnvelope}>
          {!skipping?<Animated.View style={[s.leafPage,{
            right:G.leafEnvelopePad,
            opacity:turnOpacity,
            transformOrigin:'left center',
            transform:[
              {perspective:1300},
              {translateX:turn.interpolate({inputRange:[0,.5,1],outputRange:[0,-4,0]})},
              {scaleX:turn.interpolate({inputRange:[0,.48,.52,1],outputRange:[1,.88,.88,1]})},
              {rotateY:turn.interpolate({inputRange:[0,.46,.54,1],outputRange:['0deg','-78deg','-102deg','-180deg']})},
            ],
          } as any]}>{page(1)}<View style={s.leafHingeShade}/></Animated.View>:null}
          {skipping?Array.from({length:leafCount},(_,i)=>{
            const leafOpacity=Animated.multiply(
              leafGate,
              skip.interpolate({inputRange:[i,i+.01,i+.98,i+1],outputRange:[0,1,1,0],extrapolate:'clamp'}),
            );
            return <Animated.View key={i} style={[s.leafPage,{
              left:direction===-1?G.leafEnvelopePad:undefined,
              right:direction===1?G.leafEnvelopePad:undefined,
              zIndex:9-i,
              opacity:leafOpacity,
              transformOrigin:direction===1?'left center':'right center',
              transform:[{perspective:1200},{rotateY:skip.interpolate({inputRange:[i,i+1],outputRange:['0deg',direction===1?'-180deg':'180deg'],extrapolate:'clamp'})}],
            } as any]}>{page(direction===1?1:0)}<View style={s.leafHingeShade}/></Animated.View>;
          }):null}
        </View>
      </Animated.View>
    </View>
  </View>;
}

const s=StyleSheet.create({
  stage:{width:390,maxWidth:'100%',height:320,alignSelf:'center',alignItems:'center',justifyContent:'center'},
  book:{width:G.bookWidth,height:G.coverHeight,position:'relative',overflow:'visible'},
  baseSpread:{position:'absolute',left:0,top:0,width:G.bookWidth,height:G.coverHeight,overflow:'hidden',zIndex:2},
  coverBacking:{position:'absolute',top:0,width:G.coverWidth,height:G.coverHeight,backgroundColor:'#183337',borderRadius:5},
  binding:{position:'absolute',top:0,bottom:0,width:8,backgroundColor:'#183337',opacity:.88,zIndex:1},
  groundShadow:{position:'absolute',width:G.bookWidth-14,height:14,bottom:28,backgroundColor:'#000',borderRadius:170},
  fallbackCover:{flex:1,padding:16,borderWidth:1,borderColor:'#B99A68',margin:7,justifyContent:'space-between',backgroundColor:'#183337'},
  fallbackKicker:{color:'#B99A68',fontSize:7,letterSpacing:2,textAlign:'center'},
  fallbackTitle:{fontFamily:'ArchivistEditorial',color:'#F1EAD5',fontSize:23,lineHeight:27,textAlign:'center'},
  fallbackAuthor:{color:'#BDB99E',fontSize:9,textAlign:'center'},
  pageEdge:{position:'absolute',backgroundColor:'#c8c2ad',borderBottomWidth:.7,borderColor:'#aaa38e',zIndex:1},
  page:{position:'absolute',top:G.pageInsetY,width:G.pageWidth,height:G.pageHeight,backgroundColor:'#eee9d5',borderWidth:.5,borderColor:'#cec9b5',overflow:'hidden',zIndex:2},
  leftPage:{left:0,zIndex:6,backfaceVisibility:'hidden',borderRightWidth:0,borderTopRightRadius:2,borderBottomRightRadius:2},
  rightPage:{width:G.pageWidth+G.spineOverlap,borderLeftWidth:0,borderTopLeftRadius:2,borderBottomLeftRadius:2},
  pageContent:{flex:1,paddingHorizontal:14,paddingTop:11},
  runningHead:{fontFamily:'ArchivistEditorial',fontSize:5.5,lineHeight:7.5,color:'#696555',textAlign:'center'},
  chapter:{fontFamily:'ArchivistEditorial',fontSize:7.5,lineHeight:9.5,color:'#575344',marginTop:9,textAlign:'center'},
  pageNumber:{position:'absolute',bottom:9,alignSelf:'center',fontSize:5.5,color:'#77715f'},
  gutter:{position:'absolute',left:G.spineX-G.gutterWidth/2,top:G.pageInsetY,bottom:G.pageInsetY,width:G.gutterWidth,zIndex:7,overflow:'hidden'},
  gutterLeftShadow:{position:'absolute',left:0,top:0,bottom:0,width:G.gutterWidth/2,backgroundColor:'rgba(58,48,24,.075)'},
  gutterLeftHighlight:{position:'absolute',left:G.gutterWidth/2-4,top:0,bottom:0,width:3,backgroundColor:'rgba(255,252,232,.16)'},
  gutterCrease:{position:'absolute',left:G.gutterWidth/2-.5,top:0,bottom:0,width:1,backgroundColor:'rgba(48,38,19,.24)'},
  gutterRightHighlight:{position:'absolute',left:G.gutterWidth/2+1,top:0,bottom:0,width:3,backgroundColor:'rgba(255,252,232,.13)'},
  gutterRightShadow:{position:'absolute',right:0,top:0,bottom:0,width:G.gutterWidth/2,backgroundColor:'rgba(58,48,24,.055)'},
  coverLeaf:{position:'absolute',right:0,top:0,width:G.coverWidth,height:G.coverHeight,zIndex:5,overflow:'visible'},
  coverFrontFace:{...StyleSheet.absoluteFillObject,overflow:'hidden',backgroundColor:'#183337',borderRadius:6,backfaceVisibility:'hidden'},
  coverInsideFace:{...StyleSheet.absoluteFillObject,overflow:'hidden',backgroundColor:'#29484A',borderRadius:6,backfaceVisibility:'hidden',borderWidth:1,borderColor:'rgba(185,154,104,.24)',padding:10},
  insidePanel:{flex:1,borderWidth:1,borderColor:'rgba(241,234,213,.12)',borderRadius:3,backgroundColor:'rgba(0,0,0,.05)'},
  coverSpineShade:{position:'absolute',left:0,top:0,bottom:0,width:7,backgroundColor:'rgba(0,0,0,.11)'},
  leafEnvelope:{position:'absolute',left:-G.leafEnvelopePad,top:-G.leafEnvelopePad,width:G.bookWidth+G.leafEnvelopePad*2,height:G.coverHeight+G.leafEnvelopePad*2,overflow:'visible',zIndex:8},
  leafPage:{position:'absolute',top:G.leafEnvelopePad+G.pageInsetY,width:G.pageWidth,height:G.pageHeight,backgroundColor:'#eee9d5',borderWidth:.5,borderColor:'#cec9b5',overflow:'hidden',zIndex:6,backfaceVisibility:'visible'},
  leafHingeShade:{position:'absolute',left:0,top:0,bottom:0,width:6,backgroundColor:'rgba(55,45,20,.10)'},
});
