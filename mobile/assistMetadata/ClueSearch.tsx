import React,{useEffect,useRef,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
export function AssistClueSearch({workId,online,search,onResult,onCancel,colors}:{workId:string;online:boolean;search:(text:string)=>Promise<unknown>;onResult:(value:any)=>void;onCancel:()=>void;colors:{ink:string;muted:string;line:string;raised:string}}){
 const [text,setText]=useState(''),[status,setStatus]=useState('');
 const generation=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null),active=useRef('');
 const handlers=useRef({search,onResult,onCancel});handlers.current={search,onResult,onCancel};
 const run=async(value:string)=>{
  if(timer.current)clearTimeout(timer.current);const query=value.trim();
  if(!online||query.length<3||query.length>512||active.current===query)return;
  const ticket=++generation.current;active.current=query;setStatus('Searching…');
  try{const result=await handlers.current.search(query);if(ticket===generation.current){handlers.current.onResult(result);setStatus('');}}
  catch{if(ticket===generation.current)setStatus('Search unavailable. Try again.');}
  finally{if(ticket===generation.current)active.current='';}
 };
 useEffect(()=>{setText('');setStatus('');active.current='';return()=>{++generation.current;if(timer.current)clearTimeout(timer.current);handlers.current.onCancel();};},[workId]);
 useEffect(()=>{if(!online){++generation.current;active.current='';if(timer.current)clearTimeout(timer.current);handlers.current.onCancel();setStatus('Online metadata is off.');}},[online]);
 return <View style={{gap:5}}>
  <Text style={{color:colors.ink,fontSize:13,fontWeight:'600'}}>Search clues</Text>
  <TextInput accessibilityLabel="Archivist Assist search clues" value={text} maxLength={512} autoCorrect={false} returnKeyType="search" placeholder="Title, creator, ISBN or annual…" placeholderTextColor={colors.muted}
   onChangeText={value=>{++generation.current;active.current='';handlers.current.onCancel();setText(value);setStatus('');if(timer.current)clearTimeout(timer.current);if(value.trim().length>=3&&online)timer.current=setTimeout(()=>void run(value),700);}}
   onSubmitEditing={()=>void run(text)} style={{color:colors.ink,backgroundColor:colors.raised,borderColor:colors.line,borderWidth:1,borderRadius:10,minHeight:44,paddingHorizontal:12,paddingVertical:10}}/>
  {status?<Text accessibilityLiveRegion="polite" style={{color:colors.muted,fontSize:12}}>{status}</Text>:null}
 </View>;
}
