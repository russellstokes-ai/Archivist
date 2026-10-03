import {publicationYear} from './libraryIntelligence';
import {DataRing,genreColour,genreColours,ChartItem} from './LibraryCharts';
import {AmbientGlow,LivingBookArtwork} from './LivingBookArtwork';
import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import {useFonts} from 'expo-font';
import {setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';
import {WebView} from 'react-native-webview';
import {request, validateServer as checkServer, readerNavigationAllowed, setupStatus, RequestError, Session} from './connection';
import {Playback, PlaybackState, Chapter} from './playback';
import {reorder} from './queue';
import {LocalBook, LocalFolder, LocalMetadataOverride, LocalScanProgress, LocalSortHistory, LocalSortPreview, applyLocalSortCopies, pickLocalFolder, previewLocalSort, removeLocalSortCopies, scanLocalFolders} from './localLibrary';
import {LocalReaderDocument, buildLocalReaderDocument, readerHostBridgeSource} from './localReader';
import {groupLocalWorks, LocalWork} from './localWorks';
import {Achievement, achievementsFor, clampProgress, localDay, progressionFor, streakStats, VerifiedProfileStats} from './profileStats';
import {AtlasKind, buildAtlasRelationship} from './atlas';
import {AtlasUniverseNode, buildAtlasUniverse} from './atlasUniverse';
import {possibleLocalDuplicateGroups} from './duplicates';
import {normalizeLibrarySummary, normalizeServerWork} from './serverCompatibility';
import {getPersistedJSON, setPersistedJSON} from './stateStore';
import {LibrarySource, WorkSource, dedupeForAll, matchesSource, normalizeSpaceSelection, sourceIdentity, sourceLabel, spacesForSource} from './librarySources';
import {SmartShelfDefinition, SmartShelfField, SmartShelfOperator, SmartShelfRule, SmartShelfRuleGroup, LibraryCollection, addGroupAtPath, addRuleAtPath, applySmartShelf, collectionWorks, emptySmartShelfRules, legacyRules, newOrganisationId, removeRuleNode, replaceRuleNode, sanitizeCollections, sanitizeSmartShelves, toggleCollectionWork} from './libraryOrganisation';
import {PlayerBookmark, TrackOrderMap, ChapterOverrideMap, addBookmark, applyTrackOrder, mergeChapter, moveTrackOrder, playerMotionState, removeBookmark, renameChapter, sanitizeBookmarks, sanitizeChapterOverrides, sanitizeTrackOrders, setChapterBoundary, splitChapter} from './playerExperience';
import {ReaderAnnotation, ReaderAppearance, ReaderBookmark, addReaderAnnotation, defaultReaderAppearance, sanitizeReaderAnnotations, sanitizeReaderAppearance, sanitizeReaderBookmarks, toggleReaderBookmark, workReaderAnnotations, workReaderBookmarks} from './readerExperience';
import {ProfileActivity, buildInsights, defaultInsightGoal, sanitizeInsightGoal} from './insights';
import {shelfRecommendations} from './shelfRecommendations';
import {MetadataGapFilter, matchesMetadataGap, metadataGapCounts} from './libraryMaintenance';
import LocalPdfReader from './LocalPdfReader';
import {
  cleanupOfflineStorage,
  downloadOfflineWork,
  inspectOfflineStorage,
  isOfflineDownloadPaused,
  OfflineDownloadCheckpoint,
  OfflineServerTrack,
  OfflineServerWork,
  OfflineStorageSummary,
  offlineToLocalWork,
  pauseActiveOfflineDownload,
  removeOfflineCheckpoint,
  removeOfflineWork,
} from './offlineLibrary';

type Book = {
  id: number;
  title: string;
  author: string;
  series: string;
  genre?: string;
  publishedYear?: number;
  format: string;
  space: string;
  available: boolean;
  uri?: string;
  identificationConfidence?: 'high' | 'medium' | 'low';
  needsReview?: boolean;
  reviewReason?: string;
  coverShape?: 'portrait' | 'square';
  coverUri?: string;
  metadataSource?: 'path' | 'sidecar' | 'manual' | 'embedded' | 'legacy';
  localWorkKey?: string;
  serverWorkId?: number;
  source?: WorkSource;
  originServer?: string;
};
type RatingPrompt = {title:string;localWorkKey?:string;serverWorkId?:number};
type MoveBatchResult = {ok: number; failed: number; items: Array<{asset?: number; error?: string; move?: {id: string; asset: number; from: string; to: string; state: string}}>};
type ServerWork = {
  id: number;
  title: string;
  author: string;
  series: string;
  genre?: string;
  publishedYear?: number;
  format: string;
  space: string;
  editions: number;
  files: number;
  available: boolean;
  rating?: number;
  favourite?: boolean;
  state?: ReadingState;
};
type WorkTrack = {id: number; title: string; format: string; edition: number; available: boolean; name?: string; size?: number};
type ReadingState = 'not-started'|'in-progress'|'finished';
type PersonalPreference = {workId?:number;rating:number;favourite:boolean;state?:ReadingState};
type HouseholdUser = {id:number;name:string;revoked:boolean;role?:'user'};
type SummaryItem = {name: string; count: number};
type LibrarySummary = {
  total: number;
  formats: SummaryItem[];
  spaces: SummaryItem[];
  authors: SummaryItem[];
  unknownAuthors: number;
  needsReview: number;
  series: SummaryItem[];
  genres?: SummaryItem[];
  availability: SummaryItem[];
  reading?: SummaryItem[];
  ratings?: SummaryItem[];
  favourites?: SummaryItem[];
};
type DuplicateCandidate = {
  id:number;
  title:string;
  author:string;
  format:string;
  space:string;
  path:string;
  size:number;
  reviewed:boolean;
};
type DuplicateCandidateGroup = {
  size:number;
  reason:string;
  items:DuplicateCandidate[];
};
type DuplicateVerification = {
  exact:Array<{sha256:string;items:DuplicateCandidate[]}>;
  unique:DuplicateCandidate[];
  errors:Array<{id:number;error:string}>;
};
type LocalWorkProgress = {uri: string; seconds: number; complete?: boolean};
type WorkPicker = {work: ServerWork; tracks: WorkTrack[]};
type PersonalLocalWork = LocalWork & {readingState:ReadingState;rating:number;favourite:boolean};
type UnifiedWork = {
  source: WorkSource;
  key: string;
  canonicalKey: string;
  title: string;
  author: string;
  series: string;
  genre: string;
  publishedYear?: number;
  format: string;
  space: string;
  available: boolean;
  files: number;
  editions: number;
  readingState: ReadingState;
  rating: number;
  favourite: boolean;
  coverUri?: string;
  localWork?: PersonalLocalWork;
  serverWork?: ServerWork;
  server?: string;
  serverWorkId?: number;
};
type LibrarySort = 'title'|'author'|'series'|'format'|'progress'|'rating';
type LibraryFormatFamily = ''|'books'|'comics'|'audio'|'pdf';
type Tab = 'shelf' | 'library' | 'now' | 'player' | 'reader' | 'atlas' | 'insights' | 'profile' | 'rewards' | 'settings';
type ShelfSectionId = 'continue' | 'favourites' | 'smart' | 'collections' | 'series';
type ShelfSectionPref = {id:ShelfSectionId;title:string;visible:boolean};
type ThemeMode = 'system' | 'light' | 'dark';
type AccessibilityPreferences = {reduceMotion:boolean;highContrast:boolean;largeText:boolean};
type ProfileAvatarConfig = {initials:string;color:string;photoUri?:string};
type Palette = {
  ink: string;
  paper: string;
  muted: string;
  line: string;
  card: string;
  raised: string;
  sage: string;
  gold: string;
  ivory: string;
  danger: string;
  dangerSoft: string;
};

const storageKey = 'archivist.session';
const themeKey = 'archivist.theme';
const accessibilityPreferencesKey = 'archivist.accessibility.v1';
const localFoldersKey = 'archivist.localFolders';
const localProgressKey = 'archivist.localProgress';
const localReadingProgressKey = 'archivist.localReadingProgress';
const localReadingCompleteKey = 'archivist.localReadingComplete.v1';
const localReadingCurrentCompleteKey = 'archivist.localReadingCurrentComplete.v1';
const localWorkProgressKey = 'archivist.localWorkProgress.v1';
const localAudioCompletedKey = 'archivist.localAudioCompleted.v1';
const localQueueKey = 'archivist.localQueue';
const localSortHistoryKey = 'archivist.localSortHistory';
const localMetadataOverridesKey = 'archivist.localMetadataOverrides.v1';
const localCatalogKey = 'archivist.localCatalog.v1';
const offlineWorksKey = 'archivist.offlineWorks.v1';
const offlineCheckpointsKey = 'archivist.offlineCheckpoints.v1';
const localPreferencesKey = 'archivist.localPreferences.v1';
const onboardingDoneKey = 'archivist.onboardingDone.v2';
const shelfServerPromptKey = 'archivist.shelfServerPrompt.v1';
const firstLibraryCelebratedKey = 'archivist.firstLibraryCelebrated.v1';
const smartShelvesKey = 'archivist.smartShelves.v1';
const collectionsKey = 'archivist.collections.v1';
const shelfSectionsKey = 'archivist.shelfSections.v1';
const playerBookmarksKey = 'archivist.playerBookmarks.v1';
const trackOrdersKey = 'archivist.trackOrders.v1';
const chapterOverridesKey = 'archivist.chapterOverrides.v1';
const readerBookmarksKey = 'archivist.readerBookmarks.v1';
const readerAnnotationsKey = 'archivist.readerAnnotations.v1';
const readerAppearanceKey = 'archivist.readerAppearance.v1';
const insightGoalKey = 'archivist.insightGoal.v1';
const profileAvatarKey = 'archivist.profileAvatar.v1';
const lastReadingKey = 'archivist.lastReading.v1';
const lastPlayingKey = 'archivist.lastPlaying.v1';
const defaultShelfSections:ShelfSectionPref[] = [
  {id:'continue',title:'Continue',visible:true},
  {id:'favourites',title:'Favourites',visible:true},
  {id:'smart',title:'Smart Shelves',visible:true},
  {id:'collections',title:'Collections',visible:true},
  {id:'series',title:'Series',visible:true},
];

function validateServer(raw: string) {
  return checkServer(raw, __DEV__);
}

function palette(mode: ThemeMode, system: string | null | undefined, highContrast=false): Palette {
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return {
    ink: dark ? '#F5F5F5' : '#171410',
    paper: dark ? '#000000' : '#FBFAF7',
    muted: dark ? (highContrast?'#C7C7C7':'#A0A0A0') : (highContrast?'#4D463D':'#6D675E'),
    line: dark ? (highContrast?'#4A4A4A':'#252525') : (highContrast?'#C6B9A5':'#E3DDD2'),
    card: dark ? '#111111' : '#F4F0E8',
    raised: dark ? '#181818' : '#FFFDF9',
    sage: dark ? '#47736F' : '#557B76',
    gold: dark ? '#B99A68' : '#A67A2F',
    ivory: dark ? '#FFFFFF' : '#FFFDF7',
    danger: dark ? '#DE8585' : '#A94F4F',
    dangerSoft: dark ? '#351F20' : '#F4E1DF',
  };
}

function formatBytes(bytes:number) {
  if(!Number.isFinite(bytes) || bytes<=0)return '0 B';
  const units=['B','KB','MB','GB','TB'];
  let value=bytes,index=0;
  while(value>=1024 && index<units.length-1){value/=1024;index++;}
  return (index===0?Math.round(value):value.toFixed(value>=10?1:2))+' '+units[index];
}

function ratingLabel(rating:number) {
  const labels=['Unrated','½★','1★','1½★','2★','2½★','3★','3½★','4★','4½★','5★'];
  return labels[Math.max(0,Math.min(10,Math.round(rating||0)))];
}

function ratingFromLabel(label:string) {
  return ['Unrated','½★','1★','1½★','2★','2½★','3★','3½★','4★','4½★','5★'].indexOf(label);
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function Button({label, onPress, disabled, tone = 'primary'}: {label: string; onPress: () => void; disabled?: boolean; tone?: 'primary' | 'quiet' | 'gold' | 'danger'}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled:!!disabled}}
      disabled={disabled}
      style={({pressed}) => [
        styles.button,
        tone === 'quiet' && styles.buttonQuiet,
        tone === 'gold' && styles.buttonGold,
        tone === 'danger' && styles.buttonDanger,
        (disabled || pressed) && {opacity: disabled ? 0.38 : 0.88, transform:[{scale:pressed&&!disabled?0.98:1}]},
      ]}
      onPress={onPress}>
      <Text style={[styles.buttonText, tone === 'quiet' && styles.buttonQuietText, tone === 'danger' && styles.buttonDangerText]}>{label}</Text>
    </Pressable>
  );
}

type UiIconName = 'play'|'pause'|'more'|'close'|'back'|'shelf'|'library'|'atlas'|'insights'|'settings'|'filter'|'grid'|'list'|'skipBack'|'skipForward'|'trackBack'|'trackForward'|'bookmark'|'moon'|'queue'|'search'|'minus'|'plus'|'fit'|'chevronUp'|'chevronDown'|'zoomIn'|'zoomOut'|'bookOpen'|'clock'|'calendar'|'flame'|'target'|'layers'|'gauge'|'pin'|'edit'|'refresh'|'download';

function RatingStarMark({color,opacity=1,size=20}:{color:string;opacity?:number;size?:number}) {
  const k=size/20;
  return <View pointerEvents="none" style={{width:size,height:size,opacity,position:'relative'}}>
    <View style={{
      position:'absolute',left:size/2,top:size*.33,width:0,height:0,
      borderRightWidth:10*k,borderRightColor:'transparent',
      borderBottomWidth:7*k,borderBottomColor:color,
      borderLeftWidth:10*k,borderLeftColor:'transparent',
      transform:[{rotate:'35deg'}],
    }}>
      <View style={{
        position:'absolute',top:-4.5*k,left:-6.5*k,width:0,height:0,
        borderLeftWidth:3*k,borderLeftColor:'transparent',
        borderRightWidth:3*k,borderRightColor:'transparent',
        borderBottomWidth:8*k,borderBottomColor:color,
        transform:[{rotate:'-35deg'}],
      }}/>
      <View style={{
        position:'absolute',top:.3*k,left:-10.5*k,width:0,height:0,
        borderRightWidth:10*k,borderRightColor:'transparent',
        borderBottomWidth:7*k,borderBottomColor:color,
        borderLeftWidth:10*k,borderLeftColor:'transparent',
        transform:[{rotate:'-70deg'}],
      }}/>
    </View>
  </View>;
}

function UiIcon({name,color,size=18}:{name:UiIconName;color:string;size?:number}) {
  const stroke=size*1.75/24;
  if(name==='play')return <View style={{width:0,height:0,borderTopWidth:size*.36,borderBottomWidth:size*.36,borderLeftWidth:size*.58,borderTopColor:'transparent',borderBottomColor:'transparent',borderLeftColor:color,marginLeft:size*.08}}/>;
  if(name==='pause')return <View style={{width:size,height:size,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:size*.18}}><View style={{width:stroke*1.45,height:size*.68,borderRadius:stroke,backgroundColor:color}}/><View style={{width:stroke*1.45,height:size*.68,borderRadius:stroke,backgroundColor:color}}/></View>;
  if(name==='more')return <View style={{width:size,height:size,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:size*.12}}>{[0,1,2].map(index=><View key={index} style={{width:stroke*1.35,height:stroke*1.35,borderRadius:stroke,backgroundColor:color}}/>)}</View>;
  if(name==='close')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}><View style={{position:'absolute',width:size*.78,height:stroke,borderRadius:stroke,backgroundColor:color,transform:[{rotate:'45deg'}]}}/><View style={{position:'absolute',width:size*.78,height:stroke,borderRadius:stroke,backgroundColor:color,transform:[{rotate:'-45deg'}]}}/></View>;
  if(name==='back')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{position:'absolute',width:size*.55,height:stroke,borderRadius:stroke,backgroundColor:color,left:size*.16,top:size*.31,transform:[{rotate:'-42deg'}]}}/>
    <View style={{position:'absolute',width:size*.55,height:stroke,borderRadius:stroke,backgroundColor:color,left:size*.16,bottom:size*.31,transform:[{rotate:'42deg'}]}}/>
  </View>;
  if(name==='shelf')return <View style={{width:size,height:size,position:'relative'}}>
    {[0,.26,.52].map((offset,index)=><View key={index} style={{position:'absolute',left:size*(.12+offset),bottom:size*.18,width:size*.18,height:size*(index===1?.56:.66),borderWidth:Math.max(1,stroke*.65),borderColor:color,borderRadius:2}}/>)}
    <View style={{position:'absolute',left:size*.08,right:size*.08,bottom:size*.08,height:Math.max(1,stroke*.65),backgroundColor:color,borderRadius:2}}/>
  </View>;
  if(name==='library')return <View style={{width:size,height:size,position:'relative'}}>
    {[0,1].flatMap(row=>[0,1].map(col=><View key={row+'-'+col} style={{position:'absolute',left:size*(.12+col*.43),top:size*(.12+row*.43),width:size*.32,height:size*.32,borderWidth:Math.max(1,stroke*.65),borderColor:color,borderRadius:3}}/>))}
  </View>;
  if(name==='atlas')return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',left:size*.22,top:size*.23,width:size*.48,height:Math.max(1,stroke*.55),backgroundColor:color,transform:[{rotate:'28deg'}]}}/>
    <View style={{position:'absolute',left:size*.31,top:size*.49,width:size*.42,height:Math.max(1,stroke*.55),backgroundColor:color,transform:[{rotate:'-34deg'}]}}/>
    {[{l:.12,t:.12},{l:.68,t:.33},{l:.26,t:.68}].map((n,index)=><View key={index} style={{position:'absolute',left:size*n.l,top:size*n.t,width:size*.22,height:size*.22,borderRadius:size*.11,borderWidth:Math.max(1,stroke*.65),borderColor:color,backgroundColor:'transparent'}}/>)}
  </View>;
  if(name==='insights')return <View style={{width:size,height:size,position:'relative',flexDirection:'row',alignItems:'flex-end',justifyContent:'center',gap:size*.10,paddingBottom:size*.12}}>
    {[.38,.62,.82].map((h,index)=><View key={index} style={{width:size*.17,height:size*h,borderRadius:2,backgroundColor:color,opacity:index===2?1:.72}}/>)}
  </View>;
  if(name==='settings')return <View style={{width:size,height:size,position:'relative'}}>
    {[.24,.5,.76].map((top,index)=><React.Fragment key={index}><View style={{position:'absolute',left:size*.08,right:size*.08,top:size*top,height:Math.max(1,stroke*.55),backgroundColor:color,borderRadius:2}}/><View style={{position:'absolute',top:size*(top-.09),left:size*([.28,.58,.40][index]),width:size*.18,height:size*.18,borderRadius:size*.09,borderWidth:Math.max(1,stroke*.55),borderColor:color,backgroundColor:'transparent'}}/></React.Fragment>)}
  </View>;
  if(name==='filter')return <View style={{width:size,height:size,position:'relative'}}>
    {[.2,.5,.8].map((top,index)=><React.Fragment key={index}><View style={{position:'absolute',left:size*.08,right:size*.08,top:size*top,height:Math.max(1,stroke*.55),backgroundColor:color,borderRadius:2}}/><View style={{position:'absolute',top:size*(top-.08),left:size*([.24,.58,.38][index]),width:size*.16,height:size*.16,borderRadius:size*.08,borderWidth:Math.max(1,stroke*.55),borderColor:color,backgroundColor:'transparent'}}/></React.Fragment>)}
  </View>;
  if(name==='grid')return <View style={{width:size,height:size,position:'relative'}}>
    {[0,1].flatMap(row=>[0,1].map(col=><View key={row+'-'+col} style={{position:'absolute',left:size*(.10+col*.46),top:size*(.10+row*.46),width:size*.34,height:size*.34,borderWidth:Math.max(1,stroke*.55),borderColor:color,borderRadius:2}}/>))}
  </View>;
  if(name==='list')return <View style={{width:size,height:size,position:'relative'}}>
    {[.18,.48,.78].map((top,index)=><React.Fragment key={index}><View style={{position:'absolute',left:size*.08,top:size*(top-.02),width:size*.12,height:size*.12,borderRadius:2,backgroundColor:color}}/><View style={{position:'absolute',left:size*.30,right:size*.08,top:size*top,height:Math.max(1,stroke*.55),backgroundColor:color,borderRadius:2}}/></React.Fragment>)}
  </View>;
  if(name==='skipBack'||name==='skipForward')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{position:'absolute',width:size*.72,height:size*.72,borderWidth:Math.max(1,stroke*.58),borderColor:color,borderRadius:size*.36,borderLeftColor:name==='skipBack'?color:'transparent',borderRightColor:name==='skipForward'?color:'transparent'}}/>
    <View style={{position:'absolute',left:name==='skipBack'?size*.02:undefined,right:name==='skipForward'?size*.02:undefined,top:size*.12,width:0,height:0,borderTopWidth:size*.12,borderBottomWidth:size*.12,borderTopColor:'transparent',borderBottomColor:'transparent',borderRightWidth:name==='skipBack'?size*.18:0,borderRightColor:name==='skipBack'?color:'transparent',borderLeftWidth:name==='skipForward'?size*.18:0,borderLeftColor:name==='skipForward'?color:'transparent'}}/>
  </View>;
  if(name==='trackBack'||name==='trackForward')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{position:'absolute',left:name==='trackBack'?size*.16:undefined,right:name==='trackForward'?size*.16:undefined,top:size*.20,width:Math.max(1,stroke*.8),height:size*.60,borderRadius:2,backgroundColor:color}}/>
    <View style={{width:0,height:0,borderTopWidth:size*.25,borderBottomWidth:size*.25,borderTopColor:'transparent',borderBottomColor:'transparent',borderRightWidth:name==='trackBack'?size*.38:0,borderRightColor:name==='trackBack'?color:'transparent',borderLeftWidth:name==='trackForward'?size*.38:0,borderLeftColor:name==='trackForward'?color:'transparent',marginLeft:name==='trackBack'?size*.08:0,marginRight:name==='trackForward'?size*.08:0}}/>
  </View>;
  if(name==='bookmark')return <View style={{width:size,height:size,position:'relative',alignItems:'center'}}>
    <View style={{width:size*.52,height:size*.72,borderWidth:Math.max(1,stroke*.58),borderColor:color,borderBottomWidth:0,borderTopLeftRadius:3,borderTopRightRadius:3}}/>
    <View style={{position:'absolute',bottom:size*.10,width:size*.36,height:size*.36,borderLeftWidth:Math.max(1,stroke*.58),borderBottomWidth:Math.max(1,stroke*.58),borderColor:color,transform:[{rotate:'-45deg'}]}}/>
  </View>;
  if(name==='moon')return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',left:size*.15,top:size*.10,width:size*.68,height:size*.68,borderRadius:size*.34,borderWidth:Math.max(1,stroke*.58),borderColor:color}}/>
    <View style={{position:'absolute',left:size*.36,top:size*.02,width:size*.58,height:size*.58,borderRadius:size*.29,backgroundColor:'transparent',borderLeftWidth:Math.max(2,stroke*1.4),borderLeftColor:color,transform:[{rotate:'18deg'}]}}/>
  </View>;
  if(name==='queue')return <View style={{width:size,height:size,position:'relative'}}>
    {[.18,.46,.74].map((top,index)=><React.Fragment key={index}><View style={{position:'absolute',left:size*.08,top:size*top,width:size*.50,height:Math.max(1,stroke*.55),backgroundColor:color,borderRadius:2}}/><View style={{position:'absolute',right:size*.08,top:size*(top-.09),width:size*.18,height:size*.18,borderRadius:size*.09,borderWidth:Math.max(1,stroke*.55),borderColor:color}}/></React.Fragment>)}
  </View>;
  if(name==='bookOpen')return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',left:size*.10,top:size*.18,width:size*.36,height:size*.62,borderWidth:Math.max(1,stroke*.55),borderColor:color,borderTopLeftRadius:5,borderBottomLeftRadius:5,borderTopRightRadius:2,borderBottomRightRadius:2}}/>
    <View style={{position:'absolute',right:size*.10,top:size*.18,width:size*.36,height:size*.62,borderWidth:Math.max(1,stroke*.55),borderColor:color,borderTopRightRadius:5,borderBottomRightRadius:5,borderTopLeftRadius:2,borderBottomLeftRadius:2}}/>
    <View style={{position:'absolute',left:size*.49,top:size*.22,bottom:size*.16,width:Math.max(1,stroke*.55),backgroundColor:color,opacity:.85}}/>
  </View>;
  if(name==='clock')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{width:size*.72,height:size*.72,borderRadius:size*.36,borderWidth:Math.max(1,stroke*.6),borderColor:color}}/>
    <View style={{position:'absolute',width:Math.max(1,stroke*.75),height:size*.20,backgroundColor:color,top:size*.28,borderRadius:2}}/>
    <View style={{position:'absolute',width:size*.18,height:Math.max(1,stroke*.75),backgroundColor:color,left:size*.49,top:size*.47,borderRadius:2,transform:[{rotate:'24deg'}]}}/>
  </View>;
  if(name==='calendar')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{width:size*.72,height:size*.66,borderRadius:4,borderWidth:Math.max(1,stroke*.58),borderColor:color,marginTop:size*.08}}/>
    <View style={{position:'absolute',left:size*.22,right:size*.22,top:size*.37,height:Math.max(1,stroke*.5),backgroundColor:color}}/>
    <View style={{position:'absolute',left:size*.30,top:size*.12,width:Math.max(1,stroke*.7),height:size*.18,borderRadius:2,backgroundColor:color}}/>
    <View style={{position:'absolute',right:size*.30,top:size*.12,width:Math.max(1,stroke*.7),height:size*.18,borderRadius:2,backgroundColor:color}}/>
  </View>;
  if(name==='flame')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{width:size*.52,height:size*.68,borderRadius:size*.28,borderWidth:Math.max(1,stroke*.6),borderColor:color,transform:[{rotate:'8deg'}]}}/>
    <View style={{position:'absolute',top:size*.06,width:size*.18,height:size*.34,borderLeftWidth:Math.max(1,stroke*.6),borderLeftColor:color,transform:[{rotate:'24deg'}]}}/>
  </View>;
  if(name==='target')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{width:size*.76,height:size*.76,borderRadius:size*.38,borderWidth:Math.max(1,stroke*.52),borderColor:color}}/>
    <View style={{position:'absolute',width:size*.44,height:size*.44,borderRadius:size*.22,borderWidth:Math.max(1,stroke*.52),borderColor:color}}/>
    <View style={{position:'absolute',width:size*.14,height:size*.14,borderRadius:size*.07,backgroundColor:color}}/>
  </View>;
  if(name==='layers')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    {[0,1,2].map(index=><View key={index} style={{position:'absolute',width:size*.58,height:size*.32,borderWidth:Math.max(1,stroke*.52),borderColor:color,transform:[{rotate:'45deg'},{translateY:(index-1)*size*.16}]}}/>)}
  </View>;
  if(name==='gauge')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{width:size*.76,height:size*.38,borderTopLeftRadius:size*.38,borderTopRightRadius:size*.38,borderWidth:Math.max(1,stroke*.58),borderBottomWidth:0,borderColor:color,marginTop:size*.22}}/>
    <View style={{position:'absolute',width:size*.30,height:Math.max(1,stroke*.75),backgroundColor:color,left:size*.48,top:size*.48,borderRadius:2,transform:[{rotate:'-48deg'}]}}/>
  </View>;
  if(name==='pin')return <View style={{width:size,height:size,position:'relative',alignItems:'center'}}>
    <View style={{width:size*.54,height:size*.68,borderTopLeftRadius:size*.27,borderTopRightRadius:size*.27,borderBottomLeftRadius:size*.28,borderBottomRightRadius:size*.28,borderWidth:Math.max(1,stroke*.58),borderColor:color,transform:[{rotate:'45deg'}],marginTop:size*.08}}/>
    <View style={{position:'absolute',top:size*.25,width:size*.16,height:size*.16,borderRadius:size*.08,borderWidth:Math.max(1,stroke*.5),borderColor:color}}/>
  </View>;
  if(name==='search')return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',left:size*.08,top:size*.06,width:size*.62,height:size*.62,borderWidth:Math.max(1,stroke*.6),borderColor:color,borderRadius:size*.31}}/>
    <View style={{position:'absolute',right:size*.03,bottom:size*.10,width:size*.38,height:Math.max(1,stroke*.6),backgroundColor:color,borderRadius:2,transform:[{rotate:'45deg'}]}}/>
  </View>;
  if(name==='minus'||name==='plus')return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <View style={{position:'absolute',width:size*.62,height:Math.max(1,stroke*.6),backgroundColor:color,borderRadius:2}}/>
    {name==='plus'?<View style={{position:'absolute',height:size*.62,width:Math.max(1,stroke*.6),backgroundColor:color,borderRadius:2}}/>:null}
  </View>;
  if(name==='fit')return <View style={{width:size,height:size,position:'relative'}}>
    {[
      {left:size*.08,top:size*.08,borderLeftWidth:Math.max(1,stroke*.55),borderTopWidth:Math.max(1,stroke*.55)},
      {right:size*.08,top:size*.08,borderRightWidth:Math.max(1,stroke*.55),borderTopWidth:Math.max(1,stroke*.55)},
      {left:size*.08,bottom:size*.08,borderLeftWidth:Math.max(1,stroke*.55),borderBottomWidth:Math.max(1,stroke*.55)},
      {right:size*.08,bottom:size*.08,borderRightWidth:Math.max(1,stroke*.55),borderBottomWidth:Math.max(1,stroke*.55)},
    ].map((corner,index)=><View key={index} style={{position:'absolute',width:size*.28,height:size*.28,borderColor:color,...corner}}/>)}
  </View>;
  if(name==='zoomIn'||name==='zoomOut')return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',left:size*.08,top:size*.06,width:size*.62,height:size*.62,borderWidth:stroke,borderColor:color,borderRadius:size*.31,alignItems:'center',justifyContent:'center'}}>
      <View style={{position:'absolute',width:size*.28,height:stroke,borderRadius:stroke,backgroundColor:color}}/>
      {name==='zoomIn'?<View style={{position:'absolute',height:size*.28,width:stroke,borderRadius:stroke,backgroundColor:color}}/>:null}
    </View>
    <View style={{position:'absolute',right:size*.02,bottom:size*.09,width:size*.38,height:stroke,borderRadius:stroke,backgroundColor:color,transform:[{rotate:'45deg'}]}}/>
  </View>;
  if(name==='edit')return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',left:size*.16,top:size*.18,width:size*.58,height:Math.max(1,stroke*.62),borderRadius:2,backgroundColor:color,transform:[{rotate:'-42deg'}]}}/>
    <View style={{position:'absolute',right:size*.13,top:size*.10,width:size*.18,height:size*.18,borderWidth:Math.max(1,stroke*.55),borderColor:color,transform:[{rotate:'45deg'}]}}/>
    <View style={{position:'absolute',left:size*.11,bottom:size*.14,width:size*.24,height:size*.18,borderLeftWidth:Math.max(1,stroke*.55),borderBottomWidth:Math.max(1,stroke*.55),borderColor:color}}/>
  </View>;
  if(name==='refresh')return <View style={{width:size,height:size,position:'relative',alignItems:'center',justifyContent:'center'}}>
    <View style={{width:size*.68,height:size*.68,borderRadius:size*.34,borderWidth:Math.max(1,stroke*.58),borderColor:color,borderLeftColor:'transparent'}}/>
    <View style={{position:'absolute',right:size*.08,top:size*.13,width:0,height:0,borderTopWidth:size*.11,borderBottomWidth:size*.11,borderLeftWidth:size*.16,borderTopColor:'transparent',borderBottomColor:'transparent',borderLeftColor:color,transform:[{rotate:'18deg'}]}}/>
  </View>;
  if(name==='download')return <View style={{width:size,height:size,position:'relative',alignItems:'center'}}>
    <View style={{position:'absolute',top:size*.10,width:Math.max(1,stroke*.7),height:size*.48,backgroundColor:color,borderRadius:2}}/>
    <View style={{position:'absolute',top:size*.38,width:size*.28,height:size*.28,borderRightWidth:Math.max(1,stroke*.65),borderBottomWidth:Math.max(1,stroke*.65),borderColor:color,transform:[{rotate:'45deg'}]}}/>
    <View style={{position:'absolute',left:size*.16,right:size*.16,bottom:size*.10,height:Math.max(1,stroke*.65),backgroundColor:color,borderRadius:2}}/>
  </View>;
  const up=name==='chevronUp';
  return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',width:size*.58,height:stroke,borderRadius:stroke,backgroundColor:color,left:size*.08,top:size*.45,transform:[{rotate:up?'-42deg':'42deg'}]}}/>
    <View style={{position:'absolute',width:size*.58,height:stroke,borderRadius:stroke,backgroundColor:color,right:size*.08,top:size*.45,transform:[{rotate:up?'42deg':'-42deg'}]}}/>
  </View>;
}

function ArchivistLogo({size=44,opacity=1}:{size?:number;opacity?:number}={}) {
  return <Image accessible={false} source={require('./assets/icon.png')} resizeMode="contain" style={{width:size,height:size,borderRadius:Math.max(8,size*.22),opacity}}/>;
}

function CelebrationOverlay({active,title='Your library is alive',copy='Archivist found your first books.',reduceMotion=false,paper='#111111',ink='#F5F5F5',muted='#A0A0A0'}: {active: boolean;title?: string;copy?: string;reduceMotion?:boolean;paper?:string;ink?:string;muted?:string}) {
  const burst = useRef(new Animated.Value(0)).current;
  const sparks=useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      burst.setValue(0);
      return;
    }
    burst.setValue(0);
    Animated.sequence([
      Animated.timing(burst, {toValue: 1, duration: 520, useNativeDriver: true}),
      Animated.delay(850),
      Animated.timing(burst, {toValue: 0, duration: 420, useNativeDriver: true}),
    ]).start();
    return()=>{burst.stopAnimation();sparks.stopAnimation();};
  }, [active, burst,sparks,reduceMotion,title]);
  if (!active) return null;
  const particles = reduceMotion?[]:Array.from({length:24},(_,i)=>i%3===0?'✦':'·');
  return (
    <View pointerEvents="none" accessibilityLiveRegion="polite" style={styles.celebration}>
      {particles.map((mark, index) => {
        const angle = (index / particles.length) * Math.PI * 2;
        const distance = 138 + (index % 4) * 28;
        return (
          <Animated.Text
            key={index}
            style={[
              styles.celebrationParticle,
              {
                opacity: burst,
                transform: [
                  {translateX: sparks.interpolate({inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance]})},
                  {translateY: sparks.interpolate({inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance]})},
                  {scale: sparks.interpolate({inputRange: [0, 0.25, 1], outputRange: [0.4, 1.15, 0.85]})},
                ],
              },
            ]}>
            {mark}
          </Animated.Text>
        );
      })}
      <Animated.View pointerEvents="none" style={{position:'absolute',width:440,height:440,opacity:burst}}><AmbientGlow color="#B99A68" size={440} strength={2}/></Animated.View>
      <Animated.View style={[styles.celebrationBadge, {backgroundColor:paper,borderWidth:1,borderColor:'#B99A68',opacity: burst, transform: [{scale: burst.interpolate({inputRange:[0,0.3,1], outputRange:reduceMotion?[1,1,1]:[0.96,1.01,1]})}]}]}>
        <Text style={{color:'#B99A68',fontSize:11,letterSpacing:2,marginBottom:12}}>A MOMENT TO REMEMBER</Text>
        <UiIcon name="bookmark" color="#B99A68" size={32}/>
        <Text style={[styles.celebrationTitle,{color:ink,fontFamily:'ArchivistEditorial',fontSize:24,lineHeight:30,textAlign:'center',marginTop:12}]}>{title}</Text>
        <Text style={[styles.celebrationCopy,{color:muted,textAlign:'center'}]}>{copy}</Text>
      </Animated.View>
    </View>
  );
}

function Client() {
  const systemScheme = useColorScheme();
  const {width} = useWindowDimensions();
  const layoutTier = width < 430 ? 'compact' : width < 600 ? 'phone' : width < 760 ? 'fold' : 'wide';
  const foldLayout = width >= 600;
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [accessibilityPrefs,setAccessibilityPrefs]=useState<AccessibilityPreferences>({reduceMotion:false,highContrast:false,largeText:false});
  const p = useMemo(() => palette(theme, systemScheme,accessibilityPrefs.highContrast), [theme, systemScheme,accessibilityPrefs.highContrast]);
  const darkMode=p.paper==='#000000';
  const ambientHaloColor=darkMode?'#2F8B86':'#C99A43';
  const ambientHaloStrength=darkMode?.95:.48;
  const interfaceHaloColor=darkMode?null:p.gold;
  const [session, setSession] = useState<Session | null>(null);
  const [recoverableSession, setRecoverableSession] = useState<Session | null>(null);
  const [server, setServer] = useState('');
  const [key, setKey] = useState('');
  const [serverPanelOpen, setServerPanelOpen] = useState(false);
  const [serverNotice, setServerNotice] = useState('');
  const [localBooks, setLocalBooks] = useState<Book[]>([]);
  const [serverBooks, setServerBooks] = useState<Book[]>([]);
  const [serverWorks, setServerWorks] = useState<ServerWork[]>([]);
  const [continueWorks, setContinueWorks] = useState<ServerWork[]>([]);
  const [serverSummary, setServerSummary] = useState<LibrarySummary | null>(null);
  const [serverProfileStats, setServerProfileStats] = useState<VerifiedProfileStats | null>(null);
  const [serverPreferences,setServerPreferences]=useState<Record<number,PersonalPreference>>({});
  const [localPreferences,setLocalPreferences]=useState<Record<string,PersonalPreference>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [serverActivity,setServerActivity]=useState<ProfileActivity[]>([]);
  const [insightGoal,setInsightGoal]=useState(defaultInsightGoal);
  const [goalDraft,setGoalDraft]=useState({completed:String(defaultInsightGoal.completedTarget),annotations:String(defaultInsightGoal.annotationTarget)});
  const [readerStatsPeriod,setReaderStatsPeriod]=useState<'Day'|'Week'|'Month'>('Week');
  const [profileMenuOpen,setProfileMenuOpen]=useState(false);
  const [profileMenuMounted,setProfileMenuMounted]=useState(false);
  const profileMenuAnim=useRef(new Animated.Value(0)).current;
  const interfacePulse=useRef(new Animated.Value(0)).current;
  const [profileAvatar,setProfileAvatar]=useState<ProfileAvatarConfig>({initials:'',color:'#47736F'});
  const [atlasFocus,setAtlasFocus]=useState<{kind:AtlasKind;value:string}|null>(null);
  const [atlasListMode,setAtlasListMode]=useState(false);
  const [atlasBreakdown,setAtlasBreakdown]=useState<'Genre'|'Format'|'Published year'|null>(null);
  const atlasBreakdownAnim=useRef(new Animated.Value(0)).current;
  const atlasInspectorAnim=useRef(new Animated.Value(0)).current;
  const atlasPulse=useRef(new Animated.Value(0)).current;
  const [atlasSearch,setAtlasSearch]=useState('');
  const [atlasNodeId,setAtlasNodeId]=useState('');
  const [atlasTransform,setAtlasTransform]=useState({x:0,y:0,scale:.62});
  const atlasGesture=useRef<{mode:'pan'|'pinch';startX:number;startY:number;baseX:number;baseY:number;baseScale:number;distance:number;focusX:number;focusY:number;moved:boolean}|null>(null);
  const [duplicatePanelOpen,setDuplicatePanelOpen]=useState(false);
  const [duplicateScope,setDuplicateScope]=useState<'local'|'server'>('local');
  const [duplicateLoading,setDuplicateLoading]=useState(false);
  const [serverDuplicateGroups,setServerDuplicateGroups]=useState<DuplicateCandidateGroup[]>([]);
  const [duplicateResults,setDuplicateResults]=useState<Record<string,DuplicateVerification>>({});
  const [serverHasMore, setServerHasMore] = useState(false);
  const [serverLoadingMore, setServerLoadingMore] = useState(false);
  const [serverBooksHasMore, setServerBooksHasMore] = useState(false);
  const [serverBooksLoadingMore, setServerBooksLoadingMore] = useState(false);
  const [localFolders, setLocalFolders] = useState<LocalFolder[]>([]);
  const [localFolderNotice, setLocalFolderNotice] = useState('');
  const [localScanning, setLocalScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<LocalScanProgress | null>(null);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [shelfServerPromptHidden,setShelfServerPromptHidden]=useState(false);
  const [celebrationEligible, setCelebrationEligible] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [ritualDays,setRitualDays]=useState<Record<string,number>>({});
  const [ritualReady,setRitualReady]=useState(false);
  const [awardCategory,setAwardCategory]=useState('All');
  const [ritualToday,setRitualToday]=useState(localDay());
  const ritual=useMemo(()=>streakStats(ritualDays,ritualToday),[ritualDays,ritualToday]);
  const [achievementCelebration,setAchievementCelebration]=useState<Achievement|null>(null);
  const [recentAchievementId,setRecentAchievementId]=useState<string|null>(null);
  const [ratingPrompt,setRatingPrompt]=useState<RatingPrompt|null>(null);
  const achievementBaseline=useRef<{key:string;ids:Set<string>}|null>(null);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<LibrarySource>('all');
  const [librarySort,setLibrarySort]=useState<LibrarySort>('title');
  const [libraryView,setLibraryView]=useState<'grid'|'list'>('grid');
  const [workMenu,setWorkMenu]=useState<UnifiedWork|null>(null);
  const [workDetails,setWorkDetails]=useState<UnifiedWork|null>(null);
  const [smartShelves,setSmartShelves]=useState<SmartShelfDefinition[]>([]);
  const [collections,setCollections]=useState<LibraryCollection[]>([]);
  const [organisationModal,setOrganisationModal]=useState<'smart-shelf'|'new-collection'|'manage'|'add-to-collection'|null>(null);
  const [organisationName,setOrganisationName]=useState('');
  const [smartShelfRules,setSmartShelfRules]=useState<SmartShelfRuleGroup>(emptySmartShelfRules());
  const [smartShelfAdvanced,setSmartShelfAdvanced]=useState(false);
  const [collectionTarget,setCollectionTarget]=useState<UnifiedWork|null>(null);
  const [selectedWorkKeys,setSelectedWorkKeys]=useState<string[]>([]);
  const [collectionFilter,setCollectionFilter]=useState('');
  const [libraryFiltersOpen,setLibraryFiltersOpen]=useState(false);
  const [librarySourcesOpen,setLibrarySourcesOpen]=useState(false);
  const [libraryManageOpen,setLibraryManageOpen]=useState(false);
  const [metadataGapFilter,setMetadataGapFilter]=useState<MetadataGapFilter>('');
  const [libraryFolderExact,setLibraryFolderExact]=useState(false);
  const [shelfManageOpen,setShelfManageOpen]=useState(false);
  const [shelfSections,setShelfSections]=useState<ShelfSectionPref[]>(defaultShelfSections);
  const [renameTarget,setRenameTarget]=useState<{kind:'shelf'|'collection';id:string}|null>(null);
  const shelfScrollRef=useRef<ScrollView|null>(null);
  const libraryListRef=useRef<any>(null);
  const shelfScrollOffset=useRef(0);
  const libraryScrollOffset=useRef(0);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all'|'available'|'unavailable'>('all');
  const [formatFilter, setFormatFilter] = useState('');
  const [libraryFormatFamily,setLibraryFormatFamily]=useState<LibraryFormatFamily>('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [readingFilter,setReadingFilter]=useState<''|ReadingState>('');
  const [ratingFilter,setRatingFilter]=useState(0);
  const [favouriteOnly,setFavouriteOnly]=useState(false);
  const [unknownAuthorOnly, setUnknownAuthorOnly] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [reading, setReading] = useState<Book | null>(null);
  const [localReader, setLocalReader] = useState<LocalReaderDocument | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerLoadError,setReaderLoadError]=useState('');
  const [readerReloadKey,setReaderReloadKey]=useState(0);
  const readerWebRef=useRef<WebView|null>(null);
  const [readerBookmarks,setReaderBookmarks]=useState<ReaderBookmark[]>([]);
  const [readerAnnotations,setReaderAnnotations]=useState<ReaderAnnotation[]>([]);
  const [readerAppearance,setReaderAppearance]=useState<ReaderAppearance>(defaultReaderAppearance);
  const [readerToolsOpen,setReaderToolsOpen]=useState(false);
  const [readerChromeVisible,setReaderChromeVisible]=useState(true);
  const [readerPage,setReaderPage]=useState(0);
  const [readerCount,setReaderCount]=useState(0);
  const [readerSelection,setReaderSelection]=useState('');
  const [readerSearch,setReaderSearch]=useState('');
  const [readerSearchCount,setReaderSearchCount]=useState<number|null>(null);
  const [readerRequestedPage,setReaderRequestedPage]=useState<number|null>(null);
  const [readerNote,setReaderNote]=useState('');
  const [playing, setPlaying] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shelf');
  const [liveMode,setLiveMode]=useState<'player'|'reader'>('player');
  const [lastReading,setLastReading]=useState<Book|null>(null);
  const [lastPlaying,setLastPlaying]=useState<Book|null>(null);
  const tabTransition=useRef(new Animated.Value(1)).current;
  const player = useAudioPlayer(null);
  const audio = useAudioPlayerStatus(player);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playerPanel, setPlayerPanel] = useState<'speed'|'sleep'|'queue'|'bookmarks'|'chapters'|'structure'|null>(null);
  const [playerProgressWidth,setPlayerProgressWidth]=useState(1);
  const [localSpeed, setLocalSpeed] = useState(1);
  const [playerBookmarks,setPlayerBookmarks]=useState<PlayerBookmark[]>([]);
  const [trackOrders,setTrackOrders]=useState<TrackOrderMap>({});
  const [chapterOverrides,setChapterOverrides]=useState<ChapterOverrideMap>({});
  const [chapterEditIndex,setChapterEditIndex]=useState<number|null>(null);
  const [chapterEditTitle,setChapterEditTitle]=useState('');
  const [systemReduceMotion,setSystemReduceMotion]=useState(false);
  const reduceMotion=systemReduceMotion||accessibilityPrefs.reduceMotion;
  const [appActive,setAppActive]=useState(AppState.currentState==='active');
  useEffect(()=>{
    interfacePulse.stopAnimation();interfacePulse.setValue(0);
    if(reduceMotion||!appActive)return;
    const loop=Animated.loop(Animated.timing(interfacePulse,{toValue:1,duration:1800,useNativeDriver:true}),{resetBeforeIteration:true});
    loop.start();
    return()=>{loop.stop();interfacePulse.setValue(0);};
  },[appActive,interfacePulse,reduceMotion]);
  const bookOpenAnim=useRef(new Animated.Value(0)).current;
  const pageTurnAnim=useRef(new Animated.Value(0)).current;
  const skipTurnAnim=useRef(new Animated.Value(0)).current;
  const [skipDirection,setSkipDirection]=useState<1|-1>(1);
  const [skipTurning,setSkipTurning]=useState(false);
  const [skipPageCount,setSkipPageCount]=useState(3);
  const skipGeneration=useRef(0);
  function turnPages(pages:number,direction:1|-1){
    if(reduceMotion||!playbackVisible)return;
    const count=Math.max(1,Math.min(5,Math.round(pages)));
    const generation=++skipGeneration.current;
    skipTurnAnim.stopAnimation();skipTurnAnim.setValue(0);setSkipDirection(direction);setSkipPageCount(count);setSkipTurning(true);
    Animated.timing(skipTurnAnim,{toValue:count,duration:count>=5?1040:780,useNativeDriver:true}).start(({finished})=>{if(finished&&generation===skipGeneration.current)setSkipTurning(false);});
  }

  const [queuedBooks, setQueuedBooks] = useState<Book[]>([]);
  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});
  const [localWorkProgress, setLocalWorkProgress] = useState<Record<string, LocalWorkProgress>>({});
  const [localAudioCompleted, setLocalAudioCompleted] = useState<Record<string, boolean>>({});
  const [activeLocalWork, setActiveLocalWork] = useState<LocalWork | null>(null);
  const [localWorkIndex, setLocalWorkIndex] = useState(0);
  const [localReadingProgress, setLocalReadingProgress] = useState<Record<string, number>>({});
  const [localReadingComplete, setLocalReadingComplete] = useState<Record<string, boolean>>({});
  const [localReadingCurrentComplete, setLocalReadingCurrentComplete] = useState<Record<string, boolean>>({});
  const queueRef = useRef(queuedBooks); queueRef.current=queuedBooks;
  const queueReady=true;
  const queueBusy=false;
  const [chapters,setChapters]=useState<Chapter[]>([]);
  const [chapterError,setChapterError]=useState('');
  const [space, setSpace] = useState('');
  const [spaces, setSpaces] = useState<string[]>([]);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [owner,setOwner]=useState(false);
  const [householdUsers,setHouseholdUsers]=useState<HouseholdUser[]>([]);
  const [newUserName,setNewUserName]=useState('');
  const [newUserKey,setNewUserKey]=useState('');
  const [sources,setSources]=useState<Array<{id:number;space:string;path:string;status:string}>>([]);
  const [folderPath,setFolderPath]=useState('');
  const [folderSpace,setFolderSpace]=useState('My library');
  const [editing,setEditing]=useState<Book|null>(null);
  const [editingUris,setEditingUris]=useState<string[]>([]);
  const [workPicker,setWorkPicker]=useState<WorkPicker|null>(null);
  const [editTitle,setEditTitle]=useState('');
  const [editAuthor,setEditAuthor]=useState('');
  const [editSeries,setEditSeries]=useState('');
  const [editGenre,setEditGenre]=useState('');
  const [editYear,setEditYear]=useState('');
  const [editCoverUri,setEditCoverUri]=useState('');
  const [sortTemplate,setSortTemplate]=useState('author-title');
  const [moveStatus,setMoveStatus]=useState('');
  const [localMovePreviews,setLocalMovePreviews]=useState<LocalSortPreview[]>([]);
  const [localSortHistory,setLocalSortHistory]=useState<LocalSortHistory[]>([]);
  const [localMetadataOverrides,setLocalMetadataOverrides]=useState<Record<string, LocalMetadataOverride>>({});
  const [localOverridesReady,setLocalOverridesReady]=useState(false);
  const [localCatalogReady,setLocalCatalogReady]=useState(false);
  const [offlineWorks,setOfflineWorks]=useState<Record<string,OfflineServerWork>>({});
  const [offlineCheckpoints,setOfflineCheckpoints]=useState<Record<string,OfflineDownloadCheckpoint>>({});
  const [offlineStorage,setOfflineStorage]=useState<OfflineStorageSummary|null>(null);
  const [offlineStorageBusy,setOfflineStorageBusy]=useState(false);
  const [offlineBusyId,setOfflineBusyId]=useState<number|null>(null);
  const [offlineProgress,setOfflineProgress]=useState('');
  const [privacyBackupText,setPrivacyBackupText]=useState('');
  const [privacyRestoreText,setPrivacyRestoreText]=useState('');
  const [privacyDataNotice,setPrivacyDataNotice]=useState('');
  const loadCancel = useRef<(() => void) | null>(null);
  const controller = useMemo(() => new Playback(
    (path, method, data) => {
      const current = sessionRef.current;
      if (!current) return Promise.reject(Error('Sign in again.'));
      return request(current, path, method, data);
    },
    {
      load: (track, seconds) => new Promise<void>((resolve, reject) => {
        loadCancel.current?.();
        const current = sessionRef.current;
        if (!current) { reject(Error('Sign in again.')); return; }
        let done = false, seeking = false;
        const finish = (error?: Error) => {
          if (done) return;
          done = true; clearTimeout(timeout); listener.remove(); loadCancel.current = null;
          if (error) reject(error); else resolve();
        };
        const timeout = setTimeout(() => finish(Error('Audio loading timed out. Check server connectivity and format support.')), 30000);
        const listener = player.addListener('playbackStatusUpdate', status => {
          if (status.error) { finish(Error(status.error)); return; }
          if (!status.isLoaded || seeking || done) return;
          seeking = true;
          void player.seekTo(Math.min(seconds, status.duration || seconds)).then(() => finish(), e => finish(e));
        });
        loadCancel.current = () => finish(Error('Playback changed.'));
        try {
          player.replace({uri: current.server + '/api/assets/' + track.id, headers: {Authorization: 'Bearer ' + current.token}});
          player.setActiveForLockScreen(true, {title: track.title, albumTitle: 'Archivist'});
        } catch (e) { finish(e as Error); }
      }),
      play: () => player.play(), pause: () => player.pause(),
      seek: seconds => player.seekTo(seconds), speed: rate => player.setPlaybackRate(rate),
      sleep: seconds => {
        const native=player as typeof player & {setSleepTimer?: (seconds:number)=>void};
        if(typeof native.setSleepTimer!=='function'){
          if(seconds>0)throw Error('Sleep needs an Archivist native build; Expo Go does not include it.');
          return;
        }
        native.setSleepTimer(seconds);
      },
    }, setPlayback,
  ), [player]);
  const audioProgress = playback?.duration ? Math.min(1, playback.seconds / playback.duration) : 0;
  const serverPlaybackActive = playing?.source==='server';
  const localAudioProgress = !serverPlaybackActive && audio.duration ? Math.min(1, audio.currentTime / audio.duration) : 0;
  const displayedProgress = serverPlaybackActive ? audioProgress : localAudioProgress;
  const playbackIsPlaying = serverPlaybackActive ? !!playback?.playing : !!audio.playing;
  const playbackVisible = (activeTab==='player'||(activeTab==='now'&&liveMode==='player')) && appActive && !!playing;
  useEffect(()=>{if(!playbackVisible||reduceMotion){++skipGeneration.current;skipTurnAnim.stopAnimation();setSkipTurning(false);}},[playbackVisible,reduceMotion]);
  useEffect(()=>{let live=true;getPersistedJSON<Record<string,number>>('archivist.dailyRitual.v1').then(value=>{if(live){setRitualDays(value&&typeof value==='object'?value:{});setRitualReady(true);}});return()=>{live=false;};},[]);
  useEffect(()=>{
    if(!ritualReady)return;
    setPersistedJSON('archivist.dailyRitual.v1',ritualDays).catch(()=>undefined);
  },[ritualDays,ritualReady]);
  const ritualAudioPosition=useRef(audio.currentTime);
  const ritualAudioLatest=useRef(audio.currentTime);ritualAudioLatest.current=audio.currentTime;
  useEffect(()=>{
    if(!ritualReady)return;
    ritualAudioPosition.current=ritualAudioLatest.current;
    const timer=setInterval(()=>{
      const day=localDay();setRitualToday(day);
      const audioAdvanced=playbackIsPlaying&&ritualAudioLatest.current>ritualAudioPosition.current;
      ritualAudioPosition.current=ritualAudioLatest.current;
      const readingNow=appActive&&(activeTab==='reader'||(activeTab==='now'&&liveMode==='reader'))&&!!reading&&!readerLoading&&!readerLoadError;
      if(!audioAdvanced&&!readingNow)return;
      setRitualDays(current=>current[day]>=60?current:{...current,[day]:Math.min(60,(current[day]||0)+15)});
    },15000);
    return()=>clearInterval(timer);
  },[ritualReady,playbackIsPlaying,appActive,activeTab,liveMode,reading,readerLoading,readerLoadError]);


  useEffect(()=>{
    const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduceMotion);
    return()=>subscription.remove();
  },[]);

  useEffect(()=>{
    tabTransition.stopAnimation();
    if(reduceMotion){tabTransition.setValue(1);return;}
    tabTransition.setValue(0);
    Animated.timing(tabTransition,{toValue:1,duration:220,useNativeDriver:true}).start();
  },[activeTab,reduceMotion,tabTransition]);

  useEffect(()=>{
    const motion=playerMotionState({playing:playbackIsPlaying,visible:playbackVisible,reduceMotion});
    bookOpenAnim.stopAnimation();
    Animated.timing(bookOpenAnim,{toValue:playbackVisible&&playbackIsPlaying?1:0,duration:reduceMotion?0:(playbackIsPlaying?680:560),useNativeDriver:true}).start();

    if(motion!=='turning'){
      pageTurnAnim.stopAnimation(value=>{
        if(reduceMotion || value<=0.01){pageTurnAnim.setValue(0);return;}
        Animated.timing(pageTurnAnim,{
          toValue:1,
          duration:Math.max(120,Math.round((1-value)*620)),
          useNativeDriver:true,
        }).start(()=>pageTurnAnim.setValue(0));
      });
      return;
    }

    pageTurnAnim.stopAnimation();
    pageTurnAnim.setValue(0);
    const loop=Animated.loop(Animated.sequence([
      Animated.delay(7200),
      Animated.timing(pageTurnAnim,{toValue:1,duration:620,useNativeDriver:true}),
      Animated.timing(pageTurnAnim,{toValue:0,duration:0,useNativeDriver:true}),
      Animated.delay(900),
    ]));
    loop.start();
    return()=>loop.stop();
  },[activeTab,appActive,bookOpenAnim,pageTurnAnim,playbackIsPlaying,playbackVisible,reduceMotion]);
  const phoneWorks = useMemo(() => {
    const local = localBooks.filter((book): book is Book & {uri: string} => !!book.uri) as LocalBook[];
    return groupLocalWorks(local);
  }, [localBooks]);
  const downloadedWorks = useMemo(() => Object.values(offlineWorks).map(offlineToLocalWork), [offlineWorks]);
  const localWorks = useMemo(() => [...phoneWorks, ...downloadedWorks], [phoneWorks, downloadedWorks]);

  const personaliseLocalWorks = (items: LocalWork[]): PersonalLocalWork[] => items.map(work => {
    let readingState:ReadingState='not-started';
    if(work.format==='Audio'){
      const point=localWorkProgress[work.key];
      if(localAudioCompleted[work.key] || point?.complete)readingState='finished';
      else if((point?.seconds||0)>0)readingState='in-progress';
    }else{
      const finished=work.tracks.some(track=>!!track.uri && !!localReadingComplete[track.uri]);
      const started=work.tracks.some(track=>!!track.uri && (localReadingProgress[track.uri]||0)>0);
      readingState=finished?'finished':started?'in-progress':'not-started';
    }
    const pref=localPreferences[work.key] || {rating:0,favourite:false};
    return {...work,readingState,rating:pref.rating||0,favourite:!!pref.favourite};
  });
  const phonePersonalWorks = useMemo(() => personaliseLocalWorks(phoneWorks), [localAudioCompleted,localPreferences,localReadingComplete,localReadingProgress,localWorkProgress,phoneWorks]);
  const downloadedPersonalWorks = useMemo(() => personaliseLocalWorks(downloadedWorks), [downloadedWorks,localAudioCompleted,localPreferences,localReadingComplete,localReadingProgress,localWorkProgress]);
  const localPersonalWorks = useMemo(() => [...phonePersonalWorks,...downloadedPersonalWorks], [downloadedPersonalWorks,phonePersonalWorks]);

  const sourceWorks = useMemo<UnifiedWork[]>(() => {
    const phone:UnifiedWork[] = phonePersonalWorks.map(work => {
      const identity=sourceIdentity({source:'local',localKey:work.key,space:work.space,title:work.title});
      return {...identity,title:work.title,author:work.author,series:work.series,genre:work.genre,publishedYear:work.publishedYear,format:work.format,space:work.space,available:work.available,files:work.files,editions:1,readingState:work.readingState,rating:work.rating,favourite:work.favourite,coverUri:work.coverUri,localWork:work};
    });
    const downloaded:UnifiedWork[] = downloadedPersonalWorks.flatMap(work => {
      if(!work.originServer || !work.originWorkId)return [];
      const identity=sourceIdentity({source:'downloaded',server:work.originServer,serverWorkId:work.originWorkId,space:work.space,title:work.title});
      return [{...identity,title:work.title,author:work.author,series:work.series,genre:work.genre,publishedYear:work.publishedYear,format:work.format,space:work.space,available:true,files:work.files,editions:1,readingState:work.readingState,rating:work.rating,favourite:work.favourite,coverUri:work.coverUri,localWork:work,server:work.originServer,serverWorkId:work.originWorkId}];
    });
    const remote:UnifiedWork[] = session ? serverWorks.map(work => {
      const identity=sourceIdentity({source:'server',server:session.server,serverWorkId:work.id,space:work.space,title:work.title});
      const pref=serverPreferences[work.id] || {rating:work.rating||0,favourite:!!work.favourite,state:work.state||'not-started' as ReadingState};
      return {...identity,title:work.title,author:work.author,series:work.series,genre:work.genre||'',publishedYear:publicationYear(work.publishedYear),format:work.format,space:work.space,available:work.available,files:work.files,editions:work.editions,readingState:pref.state||'not-started',rating:pref.rating||0,favourite:!!pref.favourite,serverWork:work,server:session.server,serverWorkId:work.id};
    }) : [];
    return [...phone,...downloaded,...remote];
  },[downloadedPersonalWorks,phonePersonalWorks,serverPreferences,serverWorks,session]);

  const sourceCounts = useMemo(() => ({
    all: dedupeForAll(sourceWorks).length,
    local: sourceWorks.filter(item=>matchesSource(item.source,'local')).length,
    server: sourceWorks.filter(item=>item.source==='server').length,
    downloaded: sourceWorks.filter(item=>item.source==='downloaded').length,
  }),[sourceWorks]);

  const availableSpaces = useMemo(() => spacesForSource(sourceWorks, sourceFilter), [sourceFilter,sourceWorks]);
  useEffect(()=>{const next=normalizeSpaceSelection(sourceWorks,sourceFilter,space);if(next!==space)setSpace(next);},[sourceFilter,sourceWorks,space]);


  const atlasRelationshipWorks=useMemo<UnifiedWork[]>(()=>sourceFilter==='all'?dedupeForAll(sourceWorks):sourceWorks.filter((item:UnifiedWork)=>matchesSource(item.source,sourceFilter)),[sourceFilter,sourceWorks]);
  const unifiedAtlasRelationship=useMemo(()=>atlasFocus?buildAtlasRelationship<UnifiedWork>(atlasRelationshipWorks,atlasFocus.kind,atlasFocus.value):null,[atlasFocus,atlasRelationshipWorks]);
  const atlasUniverseWorks=useMemo(()=>atlasRelationshipWorks.filter(work=>!space||work.space===space),[atlasRelationshipWorks,space]);
  const atlasUniverse=useMemo(()=>buildAtlasUniverse(atlasUniverseWorks,collections,readerAnnotations),[atlasUniverseWorks,collections,readerAnnotations]);
  useEffect(()=>{
    if(activeTab!=='atlas')return;
    const viewWidth=Math.min(width-48,480),viewHeight=viewWidth;
    const scale=Math.max(.18,Math.min(1.08,Math.min(viewWidth/atlasUniverse.width,viewHeight/atlasUniverse.height)*.78));
    setAtlasTransform({x:(viewWidth-atlasUniverse.width*scale)/2,y:(viewHeight-atlasUniverse.height*scale)/2,scale});
  },[activeTab,width,foldLayout,atlasUniverse.width,atlasUniverse.height]);
  const atlasSelectedNode=useMemo(()=>atlasUniverse.nodes.find(node=>node.id===atlasNodeId)||null,[atlasNodeId,atlasUniverse]);

  useEffect(()=>{
    if(activeTab!=='atlas'){
      setAtlasBreakdown(null);
      setAtlasNodeId('');
      atlasBreakdownAnim.stopAnimation();
      atlasBreakdownAnim.setValue(0);
      atlasInspectorAnim.stopAnimation();
      atlasInspectorAnim.setValue(0);
      atlasPulse.stopAnimation();
      atlasPulse.setValue(0);
      return;
    }
  },[activeTab,atlasBreakdownAnim,atlasInspectorAnim,atlasPulse]);

  useEffect(()=>{
    atlasPulse.stopAnimation();
    atlasPulse.setValue(0);
    if(reduceMotion||activeTab!=='atlas'||(!atlasNodeId&&!atlasBreakdown))return;
    const atlasPulseLoop=Animated.loop(Animated.timing(atlasPulse,{toValue:1,duration:1800,useNativeDriver:true}),{resetBeforeIteration:true});
    atlasPulseLoop.start();
    return ()=>{atlasPulseLoop.stop();atlasPulse.setValue(0);};
  },[activeTab,atlasBreakdown,atlasNodeId,atlasPulse,reduceMotion]);

  const localDuplicateGroups = useMemo(() => {
    const local=localBooks.filter((book):book is Book & {uri:string}=>!!book.uri) as LocalBook[];
    return possibleLocalDuplicateGroups(local);
  },[localBooks]);


  function statsFromUnified(items:UnifiedWork[],name:string):VerifiedProfileStats{
    const completedAudio=items.filter(work=>work.format==='Audio'&&work.readingState==='finished').length;
    const inProgressAudio=items.filter(work=>work.format==='Audio'&&work.readingState==='in-progress').length;
    const startedAudio=completedAudio+inProgressAudio;
    const completedReading=items.filter(work=>work.format!=='Audio'&&work.readingState==='finished').length;
    const inProgressReading=items.filter(work=>work.format!=='Audio'&&work.readingState==='in-progress').length;
    const startedReading=completedReading+inProgressReading;
    const ratings=items.map(work=>work.rating||0).filter(Boolean);
    return {
      name,owner:false,works:items.length,
      formats:new Set(items.map(work=>work.format).filter(Boolean)).size,
      series:new Set(items.map(work=>work.series).filter(Boolean)).size,
      startedAudio,completedAudio,inProgressAudio,startedReading,completedReading,inProgressReading,
      inProgress:inProgressAudio+inProgressReading,completed:completedAudio+completedReading,
      rated:ratings.length,favourites:items.filter(work=>work.favourite).length,
      averageRating:ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:0,
    };
  }
  const allUnifiedWorks=useMemo(()=>dedupeForAll(sourceWorks),[sourceWorks]);
  const localProfileStats=useMemo(()=>statsFromUnified(sourceWorks.filter(work=>matchesSource(work.source,'local')),'On this device'),[sourceWorks]);
  const downloadedProfileStats=useMemo(()=>statsFromUnified(sourceWorks.filter(work=>work.source==='downloaded'),'Downloaded'),[sourceWorks]);
  const combinedProfileStats=useMemo(()=>statsFromUnified(allUnifiedWorks,'All libraries'),[allUnifiedWorks]);
  const profileStats = sourceFilter==='server' && session ? serverProfileStats
    : sourceFilter==='local' ? localProfileStats
    : sourceFilter==='downloaded' ? downloadedProfileStats
    : combinedProfileStats;

  const profileAchievements = useMemo(() => profileStats ? achievementsFor({...profileStats,bestStreak:ritual.bestStreak,activeDays:ritual.activeDays}) : [], [profileStats,ritual.bestStreak,ritual.activeDays]);
  const profileProgression = useMemo(() => profileStats ? progressionFor({...profileStats,bestStreak:ritual.bestStreak,activeDays:ritual.activeDays}) : null, [profileStats,ritual.bestStreak,ritual.activeDays]);
  const insightWorks=useMemo(()=>sourceFilter==='all'?allUnifiedWorks:sourceWorks.filter(work=>matchesSource(work.source,sourceFilter)),[allUnifiedWorks,sourceFilter,sourceWorks]);
  const insightSummary=useMemo(()=>buildInsights(insightWorks,readerAnnotations,sourceFilter==='local'||sourceFilter==='downloaded'?[]:serverActivity,insightGoal),[insightGoal,insightWorks,readerAnnotations,serverActivity,sourceFilter]);

  useEffect(()=>{
    if(!profileStats||!ritualReady)return;
    const key=sourceFilter+'|'+(session?.server||'device')+'|'+profileStats.name;
    const unlocked=new Set(profileAchievements.filter(item=>item.unlocked).map(item=>item.id));
    const baseline=achievementBaseline.current;
    if(!baseline || baseline.key!==key){
      achievementBaseline.current={key,ids:unlocked};
      return;
    }
    const newly=profileAchievements.find(item=>item.unlocked && item.id!=='first-shelf' && !baseline.ids.has(item.id));
    achievementBaseline.current={key,ids:unlocked};
    if(!newly)return;
    setAchievementCelebration(newly);
    setRecentAchievementId(newly.id);
    const timer=setTimeout(()=>setAchievementCelebration(null),1900);
    return()=>clearTimeout(timer);
  },[profileAchievements,profileStats,ritualReady,session,sourceFilter]);

  useEffect(()=>{if(!achievementCelebration)return;const timer=setTimeout(()=>setAchievementCelebration(null),3200);return()=>clearTimeout(timer);},[achievementCelebration]);
  useEffect(()=>{if(!recentAchievementId)return;const timer=setTimeout(()=>setRecentAchievementId(null),15000);return()=>clearTimeout(timer);},[recentAchievementId]);

  const availabilityMatches = (available: boolean) =>
    availabilityFilter === 'all' || (availabilityFilter === 'available' ? available : !available);
  const libraryFormatFamilyMatches=(format:string)=>{
    if(!libraryFormatFamily)return true;
    const value=String(format||'').trim().toLowerCase();
    if(libraryFormatFamily==='books')return value==='epub'||value==='ebook'||value==='book';
    if(libraryFormatFamily==='comics')return value==='comic'||value==='cbz'||value==='cbr'||value==='cbt';
    if(libraryFormatFamily==='audio')return value==='audio'||value==='audiobook';
    return value==='pdf';
  };

  const reviewAssetPool = useMemo(() => {
    if(sourceFilter==='server')return serverBooks;
    if(sourceFilter==='downloaded')return [] as Book[];
    if(sourceFilter==='local')return localBooks;
    return [...localBooks,...serverBooks];
  },[localBooks,serverBooks,sourceFilter]);

  const visibleBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviewAssetPool.filter(book => {
      if (space && book.space !== space) return false;
      if (reviewOnly && !book.needsReview) return false;
      if (metadataGapFilter && !matchesMetadataGap(book,metadataGapFilter)) return false;
      if (!libraryFormatFamilyMatches(book.format)) return false;
      if (formatFilter && book.format !== formatFilter) return false;
      if (authorFilter && book.author !== authorFilter) return false;
      if (seriesFilter && book.series !== seriesFilter) return false;
      if (genreFilter && book.genre !== genreFilter) return false;
      if (unknownAuthorOnly && !!book.author) return false;
      if (!availabilityMatches(book.available)) return false;
      if (!q) return true;
      return [book.title, book.author, book.series, book.genre || '', book.format, book.space].some(value => value.toLowerCase().includes(q));
    });
  }, [authorFilter, availabilityFilter, formatFilter, genreFilter, libraryFormatFamily, metadataGapFilter, query, reviewAssetPool, reviewOnly, seriesFilter, space, unknownAuthorOnly]);

  const visibleUnifiedWorks = useMemo(() => {
    const q=query.trim().toLowerCase();
    const base=sourceFilter==='all' ? dedupeForAll(sourceWorks) : sourceWorks.filter(item=>libraryFolderExact?item.source===sourceFilter:matchesSource(item.source,sourceFilter));
    const activeCollection=collectionFilter?collections.find(item=>item.id===collectionFilter):undefined;
    const collectionKeys=activeCollection?new Set(activeCollection.canonicalKeys):null;
    return base.filter(work=>{
      if(collectionKeys && !collectionKeys.has(work.canonicalKey))return false;
      if(space && work.space!==space)return false;
      if(metadataGapFilter && !matchesMetadataGap(work,metadataGapFilter))return false;
      if(!libraryFormatFamilyMatches(work.format))return false;
      if(formatFilter && work.format!==formatFilter)return false;
      if(authorFilter && work.author!==authorFilter)return false;
      if(seriesFilter && work.series!==seriesFilter)return false;
      if(genreFilter && work.genre!==genreFilter)return false;
      if(unknownAuthorOnly && !!work.author)return false;
      if(readingFilter && work.readingState!==readingFilter)return false;
      if(ratingFilter>0 && work.rating!==ratingFilter)return false;
      if(favouriteOnly && !work.favourite)return false;
      if(!availabilityMatches(work.available))return false;
      if(q && ![work.title,work.author,work.series,work.genre,work.format,work.space].some(value=>value.toLowerCase().includes(q)))return false;
      return true;
    });
  },[authorFilter,availabilityFilter,collectionFilter,collections,favouriteOnly,formatFilter,genreFilter,libraryFolderExact,libraryFormatFamily,metadataGapFilter,query,ratingFilter,readingFilter,seriesFilter,sourceFilter,sourceWorks,space,unknownAuthorOnly]);


  const sortedUnifiedWorks = useMemo(() => [...visibleUnifiedWorks].sort((a,b)=>{
    if(librarySort==='rating')return b.rating-a.rating || a.title.localeCompare(b.title);
    if(librarySort==='author')return (a.author||'').localeCompare(b.author||'') || a.title.localeCompare(b.title);
    if(librarySort==='series')return (a.series||'').localeCompare(b.series||'') || a.title.localeCompare(b.title);
    if(librarySort==='format')return a.format.localeCompare(b.format) || a.title.localeCompare(b.title);
    if(librarySort==='progress'){
      const rank=(work:UnifiedWork)=>work.readingState==='in-progress'?0:work.readingState==='not-started'?1:2;
      return rank(a)-rank(b) || a.title.localeCompare(b.title);
    }
    return a.title.localeCompare(b.title);
  }),[librarySort,visibleUnifiedWorks]);

  const smartShelfRows=useMemo(()=>smartShelves.map(shelf=>({shelf,works:applySmartShelf(allUnifiedWorks,shelf).slice(0,12)})),[allUnifiedWorks,smartShelves]);
  const collectionRows=useMemo(()=>collections.map(collection=>({collection,works:collectionWorks(allUnifiedWorks,collection).slice(0,12)})),[allUnifiedWorks,collections]);
  const selectedWorks=useMemo(()=>{const wanted=new Set(selectedWorkKeys);return allUnifiedWorks.filter(work=>wanted.has(work.canonicalKey));},[allUnifiedWorks,selectedWorkKeys]);

  async function persistSmartShelves(next:SmartShelfDefinition[]){setSmartShelves(next);await setPersistedJSON(smartShelvesKey,next);}
  async function persistCollections(next:LibraryCollection[]){setCollections(next);await setPersistedJSON(collectionsKey,next);}
  function clearLibraryFilters(){setQuery('');setSpace('');setLibraryFolderExact(false);setFormatFilter('');setLibraryFormatFamily('');setAuthorFilter('');setSeriesFilter('');setGenreFilter('');setReadingFilter('');setRatingFilter(0);setFavouriteOnly(false);setUnknownAuthorOnly(false);setAvailabilityFilter('all');setCollectionFilter('');setMetadataGapFilter('');}
  function openSmartShelf(shelf:SmartShelfDefinition){clearLibraryFilters();setSourceFilter(shelf.source);setSpace(shelf.space);setFormatFilter(shelf.format);setAuthorFilter(shelf.author);setSeriesFilter(shelf.series);setGenreFilter(shelf.genre);setReadingFilter(shelf.readingState);setRatingFilter(shelf.minimumRating);setFavouriteOnly(shelf.favouriteOnly);setAvailabilityFilter(shelf.availableOnly?'available':'all');setLibrarySort(shelf.sort);setActiveTab('library');}
  function openCollection(collection:LibraryCollection){clearLibraryFilters();setSourceFilter('all');setCollectionFilter(collection.id);setActiveTab('library');}
  async function createSmartShelf(){
    const name=organisationName.trim();if(!name)return;
    const base={id:newOrganisationId('shelf'),name,source:sourceFilter,format:formatFilter,author:authorFilter,series:seriesFilter,genre:genreFilter,space,readingState:readingFilter,minimumRating:ratingFilter,favouriteOnly,availableOnly:availabilityFilter==='available',sort:librarySort,createdAt:new Date().toISOString()};
    const rules=smartShelfRules.children.length?smartShelfRules:legacyRules(base);
    await persistSmartShelves([{...base,rules},...smartShelves]);setOrganisationName('');setSmartShelfRules(emptySmartShelfRules());setSmartShelfAdvanced(false);setOrganisationModal(null);
  }
  async function createCollection(){const name=organisationName.trim();if(!name)return;const keys=collectionTarget?[collectionTarget.canonicalKey]:selectedWorks.map(work=>work.canonicalKey);const next=[{id:newOrganisationId('collection'),name,canonicalKeys:[...new Set(keys)],createdAt:new Date().toISOString()},...collections];await persistCollections(next);setOrganisationName('');setCollectionTarget(null);setSelectedWorkKeys([]);setOrganisationModal(null);}
  async function toggleWorkInCollection(collection:LibraryCollection,work:UnifiedWork){await persistCollections(collections.map(item=>item.id===collection.id?toggleCollectionWork(item,work.canonicalKey):item));}
  async function addSelectedToCollection(collection:LibraryCollection){const wanted=selectedWorks.map(work=>work.canonicalKey);const keys=[...new Set([...collection.canonicalKeys,...wanted])];await persistCollections(collections.map(item=>item.id===collection.id?{...item,canonicalKeys:keys}:item));setSelectedWorkKeys([]);setOrganisationModal(null);}
  async function removeSmartShelf(id:string){await persistSmartShelves(smartShelves.filter(item=>item.id!==id));}
  async function removeCollection(id:string){await persistCollections(collections.filter(item=>item.id!==id));}
  function beginRename(kind:'shelf'|'collection',id:string,name:string){setRenameTarget({kind,id});setOrganisationName(name);setOrganisationModal('manage');}
  async function applyRename(){const name=organisationName.trim();if(!renameTarget||!name)return;if(renameTarget.kind==='shelf')await persistSmartShelves(smartShelves.map(item=>item.id===renameTarget.id?{...item,name}:item));else await persistCollections(collections.map(item=>item.id===renameTarget.id?{...item,name}:item));setRenameTarget(null);setOrganisationName('');}


  const visibleLocalWorks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return localPersonalWorks.filter(work => {
      if (space && work.space !== space) return false;
      if (formatFilter && work.format !== formatFilter) return false;
      if (authorFilter && work.author !== authorFilter) return false;
      if (seriesFilter && work.series !== seriesFilter) return false;
      if (genreFilter && work.genre !== genreFilter) return false;
      if (unknownAuthorOnly && !!work.author) return false;
      if (readingFilter && work.readingState!==readingFilter) return false;
      if (ratingFilter>0 && work.rating!==ratingFilter) return false;
      if (favouriteOnly && !work.favourite) return false;
      if (!availabilityMatches(work.available)) return false;
      if (q && ![work.title,work.author,work.series,work.genre,work.format,work.space].some(value => value.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [authorFilter, availabilityFilter, favouriteOnly, formatFilter, genreFilter, localPersonalWorks, query, ratingFilter, readingFilter, seriesFilter, space, unknownAuthorOnly]);

  const visibleServerWorks = useMemo(() => serverWorks.filter(work => {
    const pref=serverPreferences[work.id] || {rating:0,favourite:false,state:'not-started' as ReadingState};
    return availabilityMatches(work.available) &&
      (!formatFilter || work.format === formatFilter) &&
      (!authorFilter || work.author === authorFilter) &&
      (!seriesFilter || work.series === seriesFilter) &&
      (!genreFilter || work.genre === genreFilter) &&
      (!readingFilter || pref.state===readingFilter) &&
      (!ratingFilter || pref.rating===ratingFilter) &&
      (!favouriteOnly || pref.favourite) &&
      (!unknownAuthorOnly || !work.author);
  }), [authorFilter, availabilityFilter, favouriteOnly, formatFilter, genreFilter, ratingFilter, readingFilter, seriesFilter, serverPreferences, serverWorks, unknownAuthorOnly]);

  const localContinueWorks = useMemo(() => localWorks.filter(work => {
    if (space && work.space !== space) return false;
    if (work.format === 'Audio') {
      const point = localWorkProgress[work.key];
      return !!point && !point.complete && point.seconds > 0;
    }
    return work.tracks.some(track => {
      if(!track.uri)return false;
      const page=localReadingProgress[track.uri] || 0;
      const currentComplete=localReadingCurrentComplete[track.uri] ?? !!localReadingComplete[track.uri];
      return page>0 && !currentComplete;
    });
  }).slice(0, 12), [localReadingComplete, localReadingCurrentComplete, localReadingProgress, localWorkProgress, localWorks, space]);

  const atlas = useMemo(() => {
    const count=(values:string[])=>{const totals=new Map<string,number>();for(const value of values.map(v=>v.trim()).filter(Boolean))totals.set(value,(totals.get(value)||0)+1);return [...totals.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,16);};
    const items:UnifiedWork[]=sourceFilter==='all'?allUnifiedWorks:sourceWorks.filter((item:UnifiedWork)=>matchesSource(item.source,sourceFilter));
    return {
      formats:count(items.map(item=>item.format)),authors:count(items.map(item=>item.author||'Unknown author')),
      series:count(items.map(item=>item.series).filter(Boolean)),genres:count(items.map(item=>item.genre).filter(Boolean)),
      spaces:count(items.map(item=>item.space)),
      status:[['Available',items.filter(item=>item.available).length] as [string,number],['Unavailable',items.filter(item=>!item.available).length] as [string,number]].filter(([,total])=>total>0),
      reading:count(items.map(item=>item.readingState==='finished'?'Finished':item.readingState==='in-progress'?'In progress':'Not started')),
      ratings:count(items.map(item=>ratingLabel(item.rating||0))),
      favourites:items.some(item=>item.favourite)?[['Favourites',items.filter(item=>item.favourite).length] as [string,number]]:[],
    };
  },[allUnifiedWorks,sourceFilter,sourceWorks]);


  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', s => controller.update(s.currentTime,s.duration,s.playing,s.didJustFinish,s.error));
    const lifecycle = AppState.addEventListener('change', state => {
      setAppActive(state==='active');
      controller.tick();
      void controller.save();
      if(state!=='active'){void pauseActiveOfflineDownload();void persistLocalPlaybackPosition();}
    });
    const timer = setInterval(() => controller.tick(),1000);
    return () => { subscription.remove(); lifecycle.remove(); clearInterval(timer); loadCancel.current?.(); void controller.stop(); };
  }, [controller, player]);

  useEffect(() => {
    if(!session || !playback?.completed || !playing?.serverWorkId)return;
    const work=serverWorks.find(item=>item.id===playing.serverWorkId);
    if(work)setRatingPrompt({title:work.title,serverWorkId:work.id});
  }, [playback?.completed]);

  useEffect(() => {
    if (!playback?.completed || !queueRef.current.length) return;
    const [next,...rest]=queueRef.current;
    void updateLocalQueue(rest).then(()=>playBook(next));
  }, [playback?.completed]);

  useEffect(() => {
    if (playing?.source==='server' || !audio.didJustFinish) return;
    if (activeLocalWork && localWorkIndex < activeLocalWork.tracks.length - 1) {
      void loadLocalWorkTrack(activeLocalWork, localWorkIndex + 1, 0);
      return;
    }
    if (activeLocalWork) {
      if(!localAudioCompleted[activeLocalWork.key]){
        setRatingPrompt({title:activeLocalWork.title,localWorkKey:activeLocalWork.key});
      }
      setLocalWorkProgress(current => {
        const last = activeLocalWork.tracks[localWorkIndex];
        const next = {...current, [activeLocalWork.key]: {uri:last?.uri || '', seconds:0, complete:true}};
        setPersistedJSON(localWorkProgressKey, next).catch(() => undefined);
        return next;
      });
      setLocalAudioCompleted(current => {
        if(current[activeLocalWork.key])return current;
        const next={...current,[activeLocalWork.key]:true};
        setPersistedJSON(localAudioCompletedKey, next).catch(()=>undefined);
        return next;
      });
    }
    if (!queueRef.current.length) return;
    const [next, ...rest] = queueRef.current;
    const nextWork = next.localWorkKey ? localWorks.find(work => work.key === next.localWorkKey) : undefined;
    void updateLocalQueue(rest).then(() => nextWork ? playLocalWork(nextWork) : playBook(next));
  }, [audio.didJustFinish, playing?.source, activeLocalWork, localWorkIndex, localWorks]);

  const activeAsset=playback?.tracks[playback.index]?.id;
  useEffect(()=>{
    let cancelled=false;setChapters([]);setChapterError('');
    if(session && playing?.source==='server' && activeAsset){
      request(session,'/api/assets/'+activeAsset+'/chapters').then(items=>{if(!cancelled)setChapters(items);}).catch(e=>{if(!cancelled)setChapterError(e.message);});
    }else if(playing?.source==='downloaded'&&activeLocalWork){
      const downloaded=Object.values(offlineWorks).find(item=>item.server===activeLocalWork.originServer&&item.workId===activeLocalWork.originWorkId);
      const currentUri=activeLocalWork.tracks[localWorkIndex]?.uri;
      const sourceTrack=downloaded?.tracks.find(track=>track.uri===currentUri);
      if(sourceTrack&&!cancelled)setChapters(downloaded?.chaptersByTrackId?.[String(sourceTrack.id)]||[]);
    }
    return()=>{cancelled=true;};
  },[session,activeAsset,playing?.source,activeLocalWork,localWorkIndex,offlineWorks]);

  useEffect(() => {
    SecureStore.getItemAsync(themeKey).then(value => {
      if (value === 'system' || value === 'light' || value === 'dark') setTheme(value);
    }).catch(() => undefined);
    getPersistedJSON<AccessibilityPreferences>(accessibilityPreferencesKey).then(value => {
      if(value&&typeof value==='object')setAccessibilityPrefs({reduceMotion:!!value.reduceMotion,highContrast:!!value.highContrast,largeText:!!value.largeText});
    }).catch(()=>undefined);
    getPersistedJSON<LocalFolder[]>(localFoldersKey).then(saved => {
      if (Array.isArray(saved)) setLocalFolders(saved);
    }).catch(() => undefined);
    getPersistedJSON<Book[]>(localCatalogKey).then(saved => {
      if (!Array.isArray(saved)) return;
      const normalized=saved.map(book=>({...book,genre:book.genre || ''}));
      setLocalBooks(normalized.map(book=>({...book,source:'local' as const})));
      setSpaces([...new Set(normalized.map(book=>book.space).filter(Boolean))]);
    }).catch(() => undefined).finally(() => setLocalCatalogReady(true));
    getPersistedJSON<Record<string, OfflineServerWork>>(offlineWorksKey).then(value => {
      if (value && typeof value === 'object') setOfflineWorks(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, OfflineDownloadCheckpoint>>(offlineCheckpointsKey).then(value => {
      if (value && typeof value === 'object') setOfflineCheckpoints(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, PersonalPreference>>(localPreferencesKey).then(value => {
      if (value && typeof value === 'object') setLocalPreferences(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, number>>(localProgressKey).then(value => {
      if (value && typeof value === 'object') setLocalProgress(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, LocalWorkProgress>>(localWorkProgressKey).then(value => {
      if (value && typeof value === 'object') setLocalWorkProgress(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, boolean>>(localAudioCompletedKey).then(value => {
      if (value && typeof value === 'object') setLocalAudioCompleted(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, number>>(localReadingProgressKey).then(value => {
      if (value && typeof value === 'object') setLocalReadingProgress(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, boolean>>(localReadingCompleteKey).then(value => {
      if (value && typeof value === 'object') setLocalReadingComplete(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, boolean>>(localReadingCurrentCompleteKey).then(value => {
      if (value && typeof value === 'object') setLocalReadingCurrentComplete(value);
    }).catch(() => undefined);
    getPersistedJSON<Book[]>(localQueueKey).then(value => {
      if (Array.isArray(value)) setQueuedBooks(value);
    }).catch(() => undefined);
    getPersistedJSON<LocalSortHistory[]>(localSortHistoryKey).then(value => {
      if (Array.isArray(value)) setLocalSortHistory(value);
    }).catch(() => undefined);
    getPersistedJSON<Record<string, LocalMetadataOverride>>(localMetadataOverridesKey).then(value => {
      if (value && typeof value === 'object') setLocalMetadataOverrides(value);
    }).catch(() => undefined).finally(() => setLocalOverridesReady(true));
    getPersistedJSON<SmartShelfDefinition[]>(smartShelvesKey).then(value => setSmartShelves(sanitizeSmartShelves(value))).catch(() => undefined);
    getPersistedJSON<LibraryCollection[]>(collectionsKey).then(value => setCollections(sanitizeCollections(value))).catch(() => undefined);
    getPersistedJSON<ShelfSectionPref[]>(shelfSectionsKey).then(value => {
      if(!Array.isArray(value))return;
      const byId=new Map(value.filter(item=>item&&defaultShelfSections.some(base=>base.id===item.id)).map(item=>[item.id,item]));
      setShelfSections(defaultShelfSections.map(base=>({...base,...byId.get(base.id)})).sort((a,b)=>{const ai=value.findIndex(item=>item.id===a.id),bi=value.findIndex(item=>item.id===b.id);return (ai<0?999:ai)-(bi<0?999:bi);}));
    }).catch(() => undefined);
    getPersistedJSON<PlayerBookmark[]>(playerBookmarksKey).then(value=>setPlayerBookmarks(sanitizeBookmarks(value))).catch(()=>undefined);
    getPersistedJSON<TrackOrderMap>(trackOrdersKey).then(value=>setTrackOrders(sanitizeTrackOrders(value))).catch(()=>undefined);
    getPersistedJSON<ChapterOverrideMap>(chapterOverridesKey).then(value=>setChapterOverrides(sanitizeChapterOverrides(value))).catch(()=>undefined);
    getPersistedJSON<ReaderBookmark[]>(readerBookmarksKey).then(value=>setReaderBookmarks(sanitizeReaderBookmarks(value))).catch(()=>undefined);
    getPersistedJSON<ReaderAnnotation[]>(readerAnnotationsKey).then(value=>setReaderAnnotations(sanitizeReaderAnnotations(value))).catch(()=>undefined);
    getPersistedJSON<ReaderAppearance>(readerAppearanceKey).then(value=>setReaderAppearance(sanitizeReaderAppearance(value))).catch(()=>undefined);
    getPersistedJSON(insightGoalKey).then(value=>{const goal=sanitizeInsightGoal(value);setInsightGoal(goal);setGoalDraft({completed:String(goal.completedTarget),annotations:String(goal.annotationTarget)});}).catch(()=>undefined);
    getPersistedJSON<ProfileAvatarConfig>(profileAvatarKey).then(value=>{if(value&&typeof value==='object')setProfileAvatar({initials:String(value.initials||'').slice(0,2).toUpperCase(),color:String(value.color||'#47736F'),photoUri:typeof value.photoUri==='string'?value.photoUri:undefined});}).catch(()=>undefined);
    getPersistedJSON<Book>(lastReadingKey).then(value=>{if(value&&typeof value==='object')setLastReading(value);}).catch(()=>undefined);
    getPersistedJSON<Book>(lastPlayingKey).then(value=>{if(value&&typeof value==='object')setLastPlaying(value);}).catch(()=>undefined);
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduceMotion).catch(()=>undefined);
    SecureStore.getItemAsync(onboardingDoneKey).then(value => {
      setOnboardingDone(value === '1');
    }).catch(() => undefined);
    SecureStore.getItemAsync(shelfServerPromptKey).then(value => {
      setShelfServerPromptHidden(value === '1');
    }).catch(() => undefined);
    SecureStore.getItemAsync(firstLibraryCelebratedKey).then(value => {
      setCelebrationEligible(value !== '1');
    }).catch(() => undefined);
    SecureStore.getItemAsync(storageKey)
      .then(async value => {
        if (!value) return;
        const saved = JSON.parse(value) as Session;
        validateServer(saved.server);
        setServer(saved.server);
        try {
          await request(saved, '/api/me');
          setSession(saved);
          setRecoverableSession(null);
        } catch (e) {
          if (e instanceof RequestError && e.status === 401) {
            await SecureStore.deleteItemAsync(storageKey);
            setRecoverableSession(null);
            setServerPanelOpen(true);
            setError('Your saved server session expired. Enter your access key to reconnect.');
          } else {
            setRecoverableSession(saved);
            setError('Your saved server is currently unreachable. Your local library is still available; retry the server from Settings.');
          }
        }
      })
      .catch(e => setError(String(e.message || e)))
      .finally(() => setRestoring(false));
    setAudioModeAsync({playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix'}).catch(e => setError(e.message));
  }, []);

  async function fetchServerPreferences(current:Session):Promise<PersonalPreference[]> {
    try{
      return await request(current,'/api/preferences') as PersonalPreference[];
    }catch(e){
      // Compatibility only: current servers page personal state with works.
      if(e instanceof RequestError && (e.status===403 || e.status===404))return [];
      throw e;
    }
  }

  function preferencesFromWorks(items:ServerWork[]){
    const out:Record<number,PersonalPreference>={};
    for(const work of items){
      out[work.id]={workId:work.id,rating:work.rating||0,favourite:!!work.favourite,state:work.state||'not-started'};
    }
    return out;
  }

  function serverWorksPath(offset = 0, limit = 100) {
    const params = new URLSearchParams({
      q: query,
      space,
      format: formatFilter,
      author: authorFilter,
      series: seriesFilter,
      genre: genreFilter,
      limit: String(limit),
      offset: String(offset),
    });
    if (unknownAuthorOnly) params.set('unknownAuthor','1');
    if (availabilityFilter !== 'all') params.set('availability',availabilityFilter);
    if (readingFilter) params.set('reading',readingFilter);
    if (ratingFilter>0) params.set('rating',String(ratingFilter));
    if (favouriteOnly) params.set('favourite','1');
    return '/api/works?' + params.toString();
  }

  function serverAssetsPath(offset = 0, limit = 500, allLibrary = false) {
    const params = new URLSearchParams({
      q: allLibrary ? '' : query,
      space: allLibrary ? '' : space,
      format: allLibrary ? '' : formatFilter,
      author: allLibrary ? '' : authorFilter,
      series: allLibrary ? '' : seriesFilter,
      genre: allLibrary ? '' : genreFilter,
      limit: String(limit),
      offset: String(offset),
    });
    if (!allLibrary && reviewOnly) params.set('review','1');
    if (!allLibrary && unknownAuthorOnly) params.set('unknownAuthor','1');
    if (!allLibrary && availabilityFilter !== 'all') params.set('availability',availabilityFilter);
    return '/api/books?' + params.toString();
  }

  useEffect(() => {
    if (!session) {
      setServerWorks([]);
      setContinueWorks([]);
      setServerSummary(null);
      setServerHasMore(false);
      setServerBooksHasMore(false);
      return;
    }
    let cancelled = false;
    setShelfLoading(true);
    setServerHasMore(false);
    const timeout = setTimeout(() => {
      Promise.all([
        (reviewOnly||!!metadataGapFilter) ? request(session, serverAssetsPath(0,200)) : Promise.resolve([]),
        request(session, serverWorksPath(0,100)),
        request(session, '/api/continue?space=' + encodeURIComponent(space)),
        request(session, '/api/library-summary'),
        request(session, '/api/profile-stats'),
      ])
        .then(([assets, works, continuing, summary, stats]) => {
          if (cancelled) return;
          const normalizedWorks=(works as ServerWork[]).map(normalizeServerWork) as ServerWork[];
          const normalizedSummary=normalizeLibrarySummary(summary);
          setServerBooks((assets as Book[]).map(book=>({...book,source:'server' as const})));
          setServerBooksHasMore((reviewOnly||!!metadataGapFilter) && (assets as Book[]).length === 200);
          setServerWorks(normalizedWorks);
          setServerHasMore(normalizedWorks.length === 100);
          setContinueWorks((continuing as ServerWork[]).map(normalizeServerWork) as ServerWork[]);
          setServerSummary(normalizedSummary);
          setServerProfileStats(stats);
          setServerPreferences(preferencesFromWorks(normalizedWorks));
          const hasPagedPersonal=Array.isArray((summary as LibrarySummary).reading) &&
            Array.isArray((summary as LibrarySummary).ratings) &&
            Array.isArray((summary as LibrarySummary).favourites);
          if(!hasPagedPersonal){
            void fetchServerPreferences(session).then(preferences=>{
              if(cancelled)return;
              const prefMap:Record<number,PersonalPreference>={};
              for(const pref of preferences)if(pref.workId)prefMap[pref.workId]=pref;
              setServerPreferences(prefMap);
            }).catch(e=>{if(!cancelled)setError(e.message);});
          }
        })
        .catch(e => {
          if (!cancelled) setError(e.message);
        }).finally(() => { if (!cancelled) setShelfLoading(false); });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [authorFilter, availabilityFilter, favouriteOnly, formatFilter, genreFilter, metadataGapFilter, ratingFilter, readingFilter, reviewOnly, session, query, seriesFilter, space, unknownAuthorOnly]);

  useEffect(() => {
    if (!session) { setSpaces([]); return; }
    let cancelled=false;
    request(session,'/api/me').then(profile=>{
      if(cancelled)return;
      const isAdmin=!!(profile.admin ?? profile.owner);
      setOwner(isAdmin);
      if(isAdmin)request(session,'/api/profiles').then(items=>{if(!cancelled)setHouseholdUsers(items);}).catch(e=>setError(e.message));
    }).catch(e=>setError(e.message));
    request(session,'/api/sources').then(items => { if(!cancelled) {setSources(items);setSpaces([...new Set<string>(items.map((s: {space:string})=>s.space))]);} }).catch(e=>setError(e.message));
    return () => {cancelled=true;};
  }, [session]);

  useEffect(() => {
    if (!session) {
      setServerProfileStats(null);
      setProfileLoading(false);
      return;
    }
    if (activeTab !== 'profile' && activeTab !== 'insights') return;
    let cancelled=false;
    setProfileLoading(true);
    request(session,'/api/profile-stats')
      .then(stats=>{if(!cancelled)setServerProfileStats(stats);})
      .catch(e=>{if(!cancelled)setError(e.message);})
      .finally(()=>{if(!cancelled)setProfileLoading(false);});
    if(activeTab==='insights')request(session,'/api/activity?limit=100')
      .then(items=>{if(!cancelled)setServerActivity(items as ProfileActivity[]);})
      .catch(e=>{if(!cancelled)setError(e.message);});
    return()=>{cancelled=true;};
  }, [activeTab, playback?.completed, session]);


  useEffect(() => {
    if (playing?.source==='server' || !playing?.uri || !audio.currentTime) return;
    const timer = setTimeout(() => {
      const seconds = audio.currentTime;
      setLocalProgress(current => {
        const next = {...current, [playing.uri!]: seconds};
        setPersistedJSON(localProgressKey, next).catch(() => undefined);
        return next;
      });
      if (activeLocalWork) {
        const track = activeLocalWork.tracks[localWorkIndex];
        if (track?.uri) {
          setLocalWorkProgress(current => {
            const next = {...current, [activeLocalWork.key]: {uri:track.uri, seconds, complete:!!current[activeLocalWork.key]?.complete}};
            setPersistedJSON(localWorkProgressKey, next).catch(() => undefined);
            return next;
          });
        }
      }
    }, 750);
    return () => clearTimeout(timer);
  }, [audio.currentTime, activeLocalWork, localWorkIndex, playing?.source, playing?.uri]);

  useEffect(() => {
    if (!session || activeTab !== 'shelf') return;
    let cancelled=false;
    request(session,'/api/continue?space='+encodeURIComponent(space))
      .then(items=>{if(!cancelled)setContinueWorks((items as ServerWork[]).map(normalizeServerWork));})
      .catch(e=>{if(!cancelled)setError(e.message);});
    return()=>{cancelled=true;};
  }, [activeTab, session, space]);

  useEffect(() => {
    const completed=Object.fromEntries(
      Object.entries(localWorkProgress).filter(([,point])=>!!point?.complete).map(([key])=>[key,true])
    ) as Record<string,boolean>;
    const additions=Object.keys(completed).filter(key=>!localAudioCompleted[key]);
    if(!additions.length)return;
    setLocalAudioCompleted(current=>{
      const next={...current,...completed};
      setPersistedJSON(localAudioCompletedKey, next).catch(()=>undefined);
      return next;
    });
  },[localAudioCompleted,localWorkProgress]);

  useEffect(() => {
    if (restoring || !localOverridesReady || !localCatalogReady || !localFolders.length || localBooks.length || localScanning) return;
    void rescanLocalFolders();
  }, [localBooks.length, localCatalogReady, localFolders, localOverridesReady, localScanning, restoring]);

  useEffect(()=>{
    if(activeTab!=='settings')return;
    void refreshOfflineStorage();
  },[activeTab,offlineWorks]);

  async function chooseTheme(next: ThemeMode) {
    setTheme(next);
    await SecureStore.setItemAsync(themeKey, next);
  }

  async function saveAccessibilityPreferences(next:AccessibilityPreferences){
    setAccessibilityPrefs(next);
    await setPersistedJSON(accessibilityPreferencesKey,next);
  }

  async function refreshSourcesAndShelf() {
    if(!session)return;
    const [items, assets, works, continuing, summary, stats]=await Promise.all([
      request(session,'/api/sources'),
      reviewOnly ? request(session,serverAssetsPath(0,200)) : Promise.resolve([]),
      request(session,serverWorksPath(0,100)),
      request(session,'/api/continue?space='+encodeURIComponent(space)),
      request(session,'/api/library-summary'),
      request(session,'/api/profile-stats'),
    ]);
    const normalizedWorks=(works as ServerWork[]).map(normalizeServerWork) as ServerWork[];
    setSources(items);
    setSpaces([...new Set<string>(items.map((s:{space:string})=>s.space))]);
    setServerBooks((assets as Book[]).map(book=>({...book,source:'server' as const})));
    setServerBooksHasMore(reviewOnly && (assets as Book[]).length===200);
    setServerWorks(normalizedWorks);
    setServerHasMore(normalizedWorks.length===100);
    setContinueWorks((continuing as ServerWork[]).map(normalizeServerWork) as ServerWork[]);
    setServerSummary(normalizeLibrarySummary(summary));
    setServerProfileStats(stats);
    setServerPreferences(preferencesFromWorks(normalizedWorks));
  }

  async function loadMoreServerWorks() {
    if (!session || !serverHasMore || serverLoadingMore || shelfLoading) return;
    setServerLoadingMore(true);
    try {
      const next = (await request(session,serverWorksPath(serverWorks.length,100)) as ServerWork[]).map(normalizeServerWork) as ServerWork[];
      setServerWorks(current => {
        const seen=new Set(current.map(work=>work.id));
        return [...current,...next.filter(work=>!seen.has(work.id))];
      });
      setServerPreferences(current=>({...current,...preferencesFromWorks(next)}));
      setServerHasMore(next.length===100);
    } catch(e) {
      setError((e as Error).message);
    } finally {
      setServerLoadingMore(false);
    }
  }

  async function loadMoreServerBooks() {
    if (!session || !serverBooksHasMore || serverBooksLoadingMore || shelfLoading) return;
    setServerBooksLoadingMore(true);
    try {
      const next = await request(session,serverAssetsPath(serverBooks.length,200)) as Book[];
      setServerBooks(current => {
        const seen=new Set(current.map(book=>book.id));
        return [...current,...next.filter(book=>!seen.has(book.id))];
      });
      setServerBooksHasMore(next.length===200);
    } catch(e) {
      setError((e as Error).message);
    } finally {
      setServerBooksLoadingMore(false);
    }
  }

  async function sourceAction(path: string, data?: unknown) {
    if(!session)return;setBusy(true);setError('');
    try {
      await request(session,path,'POST',data);
      await refreshSourcesAndShelf();
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  }

  async function removeSource(id: number) {
    if(!session)return;setBusy(true);setError('');
    try {
      await request(session,'/api/sources/'+id,'DELETE');
      await refreshSourcesAndShelf();
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  }


  function describeBatch(result: MoveBatchResult, success: string) {
    const firstError = result.items.find(item => item.error)?.error;
    return `${result.ok} ${success}; ${result.failed} need review${firstError ? ': ' + firstError : ''}`;
  }

  async function fetchAllAssetIDs(allLibrary: boolean) {
    if (!session) return [] as number[];
    const ids: number[] = [];
    for (let offset=0; ; offset+=500) {
      const page = await request(session,serverAssetsPath(offset,500,allLibrary)) as Book[];
      ids.push(...page.map(book=>book.id));
      setMoveStatus(`Reading library… ${ids.length} files found`);
      if (page.length < 500) break;
    }
    return ids;
  }

  async function previewAssetIDs(assetIds: number[]) {
    if (!session || !assetIds.length) return {ok:0,failed:0,items:[]} as MoveBatchResult;
    const total: MoveBatchResult={ok:0,failed:0,items:[]};
    const batchSize=25;
    for (let i=0;i<assetIds.length;i+=batchSize) {
      setMoveStatus(`Preparing safe previews… ${Math.min(i+batchSize,assetIds.length)} / ${assetIds.length}`);
      const result = await request(
        session,'/api/file-moves/preview-template-batch','POST',
        {assets:assetIds.slice(i,i+batchSize),template:sortTemplate},120000,
      ) as MoveBatchResult;
      total.ok+=result.ok; total.failed+=result.failed; total.items.push(...result.items);
    }
    return total;
  }

  async function previewSort(assetIds: number[]) {
    if(!session)return;
    setBusy(true);setError('');setMoveStatus('Preparing safe move previews...');
    try {
      const result = await previewAssetIDs(assetIds);
      setMoveStatus(assetIds.length ? describeBatch(result,'ready to move') : 'No matching files to preview.');
    } catch(e) {setError((e as Error).message);setMoveStatus('');} finally {setBusy(false);}
  }

  async function previewLibrary(allLibrary: boolean) {
    if(!session)return;
    setBusy(true);setError('');setMoveStatus('Reading library…');
    try {
      const ids=await fetchAllAssetIDs(allLibrary);
      if(!ids.length){setMoveStatus('No files to preview.');return;}
      const result=await previewAssetIDs(ids);
      setMoveStatus(describeBatch(result,'ready to move'));
    } catch(e) {setError((e as Error).message);setMoveStatus('');} finally {setBusy(false);}
  }

  async function fetchPendingMoveIDs() {
    if(!session)return [] as string[];
    const ids:string[]=[];
    for(let offset=0;;offset+=500){
      const page=await request(session,'/api/file-moves?state=pending&limit=500&offset='+offset) as Array<{id:string}>;
      ids.push(...page.map(move=>move.id));
      if(page.length<500)break;
    }
    return ids;
  }

  async function applySortBatch() {
    if(!session)return;
    setBusy(true);setError('');setMoveStatus('Reading pending safe moves...');
    try {
      const ids=await fetchPendingMoveIDs();
      if(!ids.length){setMoveStatus('No pending safe moves.');return;}
      const total:MoveBatchResult={ok:0,failed:0,items:[]};
      const batchSize=10;
      for(let i=0;i<ids.length;i+=batchSize){
        setMoveStatus(`Applying safe moves… ${Math.min(i+batchSize,ids.length)} / ${ids.length}`);
        const result=await request(
          session,'/api/file-moves/apply-batch','POST',{ids:ids.slice(i,i+batchSize)},120000,
        ) as MoveBatchResult;
        total.ok+=result.ok;total.failed+=result.failed;total.items.push(...result.items);
      }
      setMoveStatus(describeBatch(total,'moved'));
      await refreshSourcesAndShelf();
    } catch(e) {setError((e as Error).message);setMoveStatus('');} finally {setBusy(false);}
  }

  async function signIn() {
    setBusy(true);
    setError('');
    setServerNotice('');
    try {
      const origin = validateServer(server);
      const setup = await setupStatus(origin);
      if (!setup.configured) throw Error('Open this server address in a browser and create owner access first. Then return here and connect.');
      const data = await request({server: origin, token: ''}, '/session', 'POST', {token: key});
      if (typeof data.token !== 'string' || !data.token) throw Error('Invalid server session response');
      const next = {server: origin, token: String(data.token)};
      await request(next, '/api/me');
      await SecureStore.setItemAsync(storageKey, JSON.stringify(next));
      setKey('');
      setSession(next);
      setRecoverableSession(null);
      setServerPanelOpen(false);
      setActiveTab('shelf');
    } catch (e) {
      if (e instanceof RequestError && e.status === 401) setError('That access key was not accepted by this Archivist server.');
      else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function checkServerAddress() {
    setBusy(true);
    setError('');
    setServerNotice('');
    try {
      const origin = validateServer(server);
      const setup = await setupStatus(origin);
      setServerNotice(setup.configured ? 'Server found. Enter your access key to connect.' : 'Server found. Create owner access in the server web page first.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function retrySavedServer() {
    if(!recoverableSession)return;
    setBusy(true);setError('');setServerNotice('');
    try{
      await request(recoverableSession,'/api/me');
      setSession(recoverableSession);
      setRecoverableSession(null);
      setActiveTab('shelf');
    }catch(e){
      if(e instanceof RequestError && e.status===401){
        await SecureStore.deleteItemAsync(storageKey);
        setServer(recoverableSession.server);
        setRecoverableSession(null);
        setServerPanelOpen(true);
        setError('Your saved server session expired. Enter your access key to reconnect.');
      }else{
        setError((e as Error).message);
      }
    }finally{setBusy(false);}
  }

  async function forgetSavedServer() {
    await SecureStore.deleteItemAsync(storageKey);
    setRecoverableSession(null);
    setServer('');
    setServerNotice('');
    setError('');
  }

  async function signOut() {
    if (!session) return;
    loadCancel.current?.();
    await controller.stop();
    player.setActiveForLockScreen(false);
    setReading(null);
    setPlaying(null);
    try {
      await request(session, '/logout', 'POST');
    } catch {
      setError('Local sign-out complete. Server session revocation could not be confirmed.');
    }
    await SecureStore.deleteItemAsync(storageKey);
    const leavingServer=session.server;
    await updateLocalQueue(queuedBooks.filter(book=>!(book.source==='server' && book.originServer===leavingServer)));
    setSession(null);
    setRecoverableSession(null);
    setServerBooks([]);
    setServerWorks([]);
    setContinueWorks([]);
    setServerSummary(null);
    setServerProfileStats(null);
    setProfileLoading(false);
    setServerHasMore(false);
    setServerLoadingMore(false);
    setServerBooksHasMore(false);
    setServerBooksLoadingMore(false);
    setServerDuplicateGroups([]);
    setDuplicateResults({});
    setDuplicatePanelOpen(false);
    setOwner(false);
    setHouseholdUsers([]);
    setServerPreferences({});
    setSources([]);
    setSpace('');
  }

  async function saveServerPreference(work:ServerWork,next:PersonalPreference){
    if(!session)return;
    const previous=serverPreferences[work.id] || {rating:work.rating||0,favourite:!!work.favourite,state:work.state||'not-started'};
    const optimistic={...next,workId:work.id,state:next.state||previous.state};
    setServerPreferences(current=>({...current,[work.id]:optimistic}));
    setServerWorks(current=>current.map(item=>item.id===work.id?{...item,rating:optimistic.rating,favourite:optimistic.favourite}:item));
    try{
      await request(session,'/api/works/'+work.id+'/preference','PUT',{rating:optimistic.rating||0,favourite:!!optimistic.favourite});
      const [stats,summary]=await Promise.all([
        request(session,'/api/profile-stats'),
        request(session,'/api/library-summary'),
      ]);
      setServerProfileStats(stats);
      setServerSummary(normalizeLibrarySummary(summary));
    }catch(e){
      setServerPreferences(current=>({...current,[work.id]:previous}));
      setServerWorks(current=>current.map(item=>item.id===work.id?{...item,rating:previous.rating,favourite:previous.favourite}:item));
      setError((e as Error).message);
    }
  }

  async function saveLocalPreference(work:LocalWork,next:PersonalPreference){
    const updated={...localPreferences,[work.key]:next};
    if((next.rating||0)===0&&!next.favourite)delete updated[work.key];
    setLocalPreferences(updated);
    try{await setPersistedJSON(localPreferencesKey,updated);}catch(e){setError((e as Error).message);}
  }

  async function refreshUsers(){
    if(!session||!owner)return;
    try{setHouseholdUsers(await request(session,'/api/profiles') as HouseholdUser[]);}catch(e){setError((e as Error).message);}
  }

  async function createFamilyUser(){
    if(!session||!owner||!newUserName.trim())return;
    setBusy(true);setError('');setNewUserKey('');
    try{
      const result=await request(session,'/api/profiles','POST',{name:newUserName.trim()});
      setNewUserName('');
      setNewUserKey(String(result.key||''));
      await refreshUsers();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }

  async function revokeFamilyUser(id:number){
    if(!session||!owner)return;
    setBusy(true);setError('');
    try{await request(session,'/api/profiles/'+id,'DELETE');await refreshUsers();}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }

  async function addLocalFolder() {
    setError('');
    setLocalFolderNotice('');
    setLocalScanning(true);
    try {
      const picked = await pickLocalFolder();
      if (!picked) {
        setLocalFolderNotice('Folder selection cancelled.');
        return;
      }
      const folders = localFolders.some(folder => folder.uri === picked.uri) ? localFolders : [...localFolders, picked];
      setScanProgress({phase: 'discovering', currentFolder: picked.name, entriesVisited: 0, found: 0, review: 0});
      const result = await scanLocalFolders(folders, setScanProgress, localMetadataOverrides);
      setLocalFolders(result.folders);
      setLocalBooks(result.books.map(book=>({...book,source:'local' as const})));
      setLocalMovePreviews([]);
      setSpaces([...new Set(result.books.map(book => book.space))]);
      await Promise.all([
        setPersistedJSON(localFoldersKey, result.folders),
        setPersistedJSON(localCatalogKey, result.books),
      ]);
      const limitNotice=result.truncatedReason==='entry-limit' ? ' · scan safety limit reached' : result.truncated ? ' · first 10,000 books shown' : '';
      setLocalFolderNotice(`${result.books.length} found · ${result.identified} confidently identified · ${result.review} need review${result.skipped ? ` · ${result.skipped} folders unreadable` : ''}${limitNotice}.`);
      if (result.books.length && celebrationEligible) {
        setCelebrating(true);
        setCelebrationEligible(false);
        void SecureStore.setItemAsync(firstLibraryCelebratedKey, '1');
        setTimeout(() => setCelebrating(false), 1900);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLocalScanning(false);
      setScanProgress(null);
    }
  }

  async function rescanLocalFolders(overrides:Record<string,LocalMetadataOverride>=localMetadataOverrides) {
    if (!localFolders.length) return;
    setError('');
    setLocalScanning(true);
    try {
      setScanProgress({phase: 'discovering', currentFolder: localFolders[0]?.name || 'Library', entriesVisited: 0, found: 0, review: 0});
      const result = await scanLocalFolders(localFolders, setScanProgress, overrides);
      setLocalFolders(result.folders);
      setLocalBooks(result.books.map(book=>({...book,source:'local' as const})));
      setLocalMovePreviews([]);
      setSpaces([...new Set(result.books.map(book => book.space))]);
      await Promise.all([
        setPersistedJSON(localFoldersKey, result.folders),
        setPersistedJSON(localCatalogKey, result.books),
      ]);
      const limitNotice=result.truncatedReason==='entry-limit' ? ' · scan safety limit reached' : result.truncated ? ' · first 10,000 books shown' : '';
      setLocalFolderNotice(`${result.books.length} found · ${result.identified} confidently identified · ${result.review} need review${result.skipped ? ` · ${result.skipped} folders unreadable` : ''}${limitNotice}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLocalScanning(false);
      setScanProgress(null);
    }
  }

  function playbackWorkKey(book:Book|null){
    if(!book)return '';
    if((book.source==='server'||book.source==='downloaded')&&book.originServer&&book.serverWorkId){
      return sourceIdentity({source:book.source,server:book.originServer,serverWorkId:book.serverWorkId,title:book.title,space:book.space}).canonicalKey;
    }
    if(book.localWorkKey)return sourceIdentity({source:'local',localKey:book.localWorkKey,title:book.title,space:book.space}).canonicalKey;
    return book.uri?'asset:'+book.uri:'book:'+book.id+':'+book.title;
  }

  async function savePlayerBookmarks(next:PlayerBookmark[]){
    setPlayerBookmarks(next);await setPersistedJSON(playerBookmarksKey,next);
  }
  async function addCurrentBookmark(seconds:number){
    const workKey=playbackWorkKey(playing);if(!workKey)return;
    await savePlayerBookmarks(addBookmark(playerBookmarks,{workKey,seconds,label:'Bookmark'}));
  }
  async function deletePlayerBookmark(id:string){await savePlayerBookmarks(removeBookmark(playerBookmarks,id));}
  async function saveTrackOrder(workKey:string,order:string[]){const next={...trackOrders,[workKey]:order};setTrackOrders(next);await setPersistedJSON(trackOrdersKey,next);}
  async function saveChapterOverride(workKey:string,nextChapters:Chapter[]|null){
    const next={...chapterOverrides};if(nextChapters?.length)next[workKey]=nextChapters;else delete next[workKey];setChapterOverrides(next);await setPersistedJSON(chapterOverridesKey,next);
  }
  function orderedLocalWork(work:LocalWork){
    const key=sourceIdentity({source:work.originServer?'downloaded':'local',localKey:work.key,server:work.originServer,serverWorkId:work.originWorkId,title:work.title,space:work.space}).canonicalKey;
    return {...work,tracks:applyTrackOrder(work.tracks,trackOrders[key],track=>track.uri||String(track.id))};
  }

  async function persistLocalPlaybackPosition(seconds=audio.currentTime){
    if(playing?.source==='server'||!playing?.uri)return;
    const safe=Math.max(0,Number(seconds)||0);
    const progress={...localProgress,[playing.uri]:safe};
    setLocalProgress(progress);await setPersistedJSON(localProgressKey,progress);
    if(activeLocalWork){
      const track=activeLocalWork.tracks[localWorkIndex];
      if(track?.uri){
        const workProgress={...localWorkProgress,[activeLocalWork.key]:{uri:track.uri,seconds:safe,complete:!!localWorkProgress[activeLocalWork.key]?.complete}};
        setLocalWorkProgress(workProgress);await setPersistedJSON(localWorkProgressKey,workProgress);
      }
    }
  }

  async function loadLocalWorkTrack(work: LocalWork, index: number, seconds = 0) {
    const track = work.tracks[index];
    if (!track?.uri || !track.available) throw Error('This audiobook file is unavailable.');
    loadCancel.current?.();
    setError('');
    setActiveLocalWork(work);
    setLocalWorkIndex(index);
    setLocalWorkProgress(current => {
      const previous=current[work.key];
      const next={...current,[work.key]:{uri:track.uri,seconds,complete:false}};
      if(previous?.uri===track.uri && previous?.seconds===seconds && previous?.complete===false)return current;
      setPersistedJSON(localWorkProgressKey, next).catch(()=>undefined);
      return next;
    });
    const display: Book = {
      ...track,
      title: work.title,
      author: work.author,
      series: work.series,
      coverUri: work.coverUri,
      coverShape: 'square',
      localWorkKey: work.key,
      source: work.originServer ? 'downloaded' : 'local',
      originServer: work.originServer,
      serverWorkId: work.originWorkId,
    };
    setPlaying(display);
    setLastPlaying(display);
    void setPersistedJSON(lastPlayingKey,display).catch(()=>undefined);
    setLiveMode('player');
    setActiveTab('now');

    await new Promise<void>((resolve, reject) => {
      let done = false;
      let seeking = false;
      const finish = (error?: Error) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        listener.remove();
        loadCancel.current = null;
        if (error) reject(error); else resolve();
      };
      const timeout = setTimeout(() => finish(Error('Audio loading timed out.')), 30000);
      const listener = player.addListener('playbackStatusUpdate', status => {
        if (status.error) { finish(Error(status.error)); return; }
        if (!status.isLoaded || seeking || done) return;
        seeking = true;
        void player.seekTo(Math.min(Math.max(0, seconds), status.duration || Math.max(0, seconds))).then(() => finish(), e => finish(e));
      });
      loadCancel.current = () => finish(Error('Playback changed.'));
      try {
        player.replace({uri: track.uri});
        player.setActiveForLockScreen(true, {
          title: work.title,
          artist: work.author || undefined,
          albumTitle: work.series || 'Archivist',
        });
      } catch (e) {
        finish(e as Error);
      }
    });
    player.setPlaybackRate(localSpeed);
    player.play();
  }

  async function playLocalWork(work: LocalWork) {
    work=orderedLocalWork(work);
    if (!work.available || !work.tracks.length) {
      setError('This audiobook is currently unavailable.');
      return;
    }
    try {
      await controller.stop();
      const saved = localWorkProgress[work.key];
      const savedIndex = saved && !saved.complete ? work.tracks.findIndex(track => track.uri === saved.uri) : -1;
      const index = savedIndex >= 0 ? savedIndex : 0;
      await loadLocalWorkTrack(work, index, saved && !saved.complete ? saved.seconds : 0);
    } catch (e) {
      if ((e as Error).message !== 'Playback changed.') setError((e as Error).message);
    }
  }

  async function playBook(book: Book) {
    if (book.source!=='server') {
      if (book.localWorkKey) {
        const work = localWorks.find(item => item.key === book.localWorkKey);
        if (work) { await playLocalWork(work); return; }
      }
      if (!book.uri) return;
      setError('');
      try {
        loadCancel.current?.();
        await controller.stop();
        setPlaying(book);
        setLastPlaying(book);
        void setPersistedJSON(lastPlayingKey,book).catch(()=>undefined);
        setLiveMode('player');
        setActiveTab('now');
        player.replace({uri: book.uri});
        player.setActiveForLockScreen(true, {title: book.title, albumTitle: 'Archivist'});
        if (localProgress[book.uri]) await player.seekTo(localProgress[book.uri]);
        player.play();
      } catch (e) {
        setError((e as Error).message);
      }
      return;
    }
    if (!session || (book.originServer && book.originServer!==session.server)) { setError('This title belongs to a different or unavailable server. Use its downloaded copy or reconnect to that server in Settings.'); return; }
    if (!book.available) {
      setError('This file is currently unavailable.');
      return;
    }
    setError('');
    try {
      setPlaying(book);
      setLastPlaying(book);
      void setPersistedJSON(lastPlayingKey,book).catch(()=>undefined);
      setLiveMode('player');
      setActiveTab('now');
      await controller.open(book.id);
      const order=trackOrders[playbackWorkKey(book)]?.map(Number).filter(Number.isFinite);
      if(order?.length)controller.setTrackOrder(order);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function previewLocalSortBatch() {
    const previews = previewLocalSort(localBooks.filter(book => book.uri) as LocalBook[], sortTemplate);
    setLocalMovePreviews(previews);
    const ready = previews.filter(item => item.state === 'ready').length;
    const conflicts = previews.filter(item => item.state === 'conflict').length;
    const review = previews.filter(item => item.state === 'review').length;
    const same = previews.filter(item => item.state === 'same').length;
    setMoveStatus(`${ready} ready; ${review} need metadata review; ${conflicts} conflicts; ${same} already organised.`);
  }

  async function applyLocalSortBatch() {
    const ready = localMovePreviews.filter(item => item.state === 'ready');
    if (!ready.length) {
      setMoveStatus('No ready local moves to apply.');
      return;
    }
    setBusy(true);
    setError('');
    setMoveStatus('Copying organised files...');
    try {
      const result = await applyLocalSortCopies(ready);
      const entry: LocalSortHistory = {id: String(Date.now()), createdAt: new Date().toISOString(), copied: result.copied, failed: result.failed};
      const history = [entry, ...localSortHistory].slice(0, 20);
      setLocalSortHistory(history);
      await setPersistedJSON(localSortHistoryKey, history);
      setMoveStatus(`${result.copied.length} copied; ${result.failed.length} need review${result.failed[0] ? ': ' + result.failed[0].error : ''}. Originals were left in place.`);
      await rescanLocalFolders();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function recoverLocalSort(history: LocalSortHistory) {
    setBusy(true);
    setError('');
    setMoveStatus('Removing copied files...');
    try {
      const result = await removeLocalSortCopies(history);
      const next = localSortHistory.filter(item => item.id !== history.id);
      setLocalSortHistory(next);
      await setPersistedJSON(localSortHistoryKey, next);
      setMoveStatus(`${result.copied.length} copied files removed; ${result.failed.length} need review${result.failed[0] ? ': ' + result.failed[0].error : ''}.`);
      await rescanLocalFolders();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function readerWorkKey(book:Book|null){return playbackWorkKey(book);}
  function sendReaderCommand(command:string,payload:Record<string,unknown>={}){readerWebRef.current?.postMessage(JSON.stringify({type:'reader-command',command,...payload}));}
  async function persistReaderBookmarks(next:ReaderBookmark[]){setReaderBookmarks(next);await setPersistedJSON(readerBookmarksKey,next);}
  async function persistReaderAnnotations(next:ReaderAnnotation[]){setReaderAnnotations(next);await setPersistedJSON(readerAnnotationsKey,next);}
  async function persistReaderAppearance(next:ReaderAppearance){setReaderAppearance(next);await setPersistedJSON(readerAppearanceKey,next);sendReaderCommand('appearance',{value:next});}
  async function toggleCurrentReaderBookmark(){const workKey=readerWorkKey(reading);if(!workKey)return;await persistReaderBookmarks(toggleReaderBookmark(readerBookmarks,workKey,readerPage));}
  async function saveCurrentReaderAnnotation(kind:'highlight'|'note'){
    const workKey=readerWorkKey(reading);const text=readerSelection.trim();if(!workKey||!text)return;
    const next=addReaderAnnotation(readerAnnotations,{workKey,page:readerPage,kind,text,note:kind==='note'?readerNote:undefined});
    await persistReaderAnnotations(next);setReaderNote('');
  }
  function handleReaderMessage(raw:string){
    if(!reading)return;
    try{
      const message=JSON.parse(raw);
      if(message?.type==='reader-position'||message?.type==='reader-ready'){
        if(Number.isInteger(message.page)&&message.page>=0)setReaderPage(message.page);
        if(Number.isInteger(message.count)&&message.count>=0)setReaderCount(message.count);
      }
      if(message?.type==='reader-selection')setReaderSelection(String(message.text||'').slice(0,4000));
      if(message?.type==='reader-chrome-toggle')setReaderChromeVisible(value=>!value);
      if(message?.type==='reader-search-results')setReaderSearchCount(Math.max(0,Number(message.count)||0));
      if(message?.type==='archivist-reader-ready'){setReaderLoading(false);setReaderLoadError('');}
      if((message?.type==='archivist-reader-complete'||message?.complete===true)&&reading.serverWorkId&&reading.source==='server')setRatingPrompt({title:reading.title,serverWorkId:reading.serverWorkId});
      if(message?.type==='reader-position'&&reading.uri){
        const page=Number(message.page);if(Number.isInteger(page)&&page>=0){
          setLocalReadingProgress(current=>{if(current[reading.uri!]===page)return current;const next={...current,[reading.uri!]:page};void setPersistedJSON(localReadingProgressKey,next);return next;});
          if(typeof message.complete==='boolean')setLocalReadingCurrentComplete(current=>{if(current[reading.uri!]===message.complete)return current;const next={...current,[reading.uri!]:message.complete};void setPersistedJSON(localReadingCurrentCompleteKey,next);return next;});
          if(message.complete===true){if(!localReadingComplete[reading.uri!]&&reading.localWorkKey)setRatingPrompt({title:reading.title,localWorkKey:reading.localWorkKey});setLocalReadingComplete(current=>{if(current[reading.uri!])return current;const next={...current,[reading.uri!]:true};void setPersistedJSON(localReadingCompleteKey,next);return next;});}
        }
      }
    }catch{}
  }

  function openBook(book: Book) {
    if (!book.available) {
      setError('This file is currently unavailable.');
      return;
    }
    setError('');
    setReaderLoadError('');
    setReaderPage(book.uri ? (localReadingProgress[book.uri]||0) : 0);setReaderCount(0);setReaderSelection('');setReaderSearch('');setReaderSearchCount(null);setReaderRequestedPage(null);setReaderToolsOpen(false);setReaderChromeVisible(true);
    if (book.format === 'Audio') playBook(book);
    else if (book.source!=='server') {
      if (!book.uri) return;
      setReading(book);
      setLastReading(book);
      void setPersistedJSON(lastReadingKey,book).catch(()=>undefined);
      setLiveMode('reader');
      setActiveTab('now');
      setReaderLoading(true);
      setLocalReader(null);
      buildLocalReaderDocument(book.uri, book.format, book.title, localReadingProgress[book.uri] || 0)
        .then(setLocalReader)
        .catch(e => {setReaderLoadError(e.message);setError(e.message);})
        .finally(() => setReaderLoading(false));
    }
    else {
      if(!session){setError('Server is unavailable. Download this title for offline use or reconnect in Settings.');return;}
      setReading(book);
      setLastReading(book);
      void setPersistedJSON(lastReadingKey,book).catch(()=>undefined);
      setReaderLoading(true);
      setLiveMode('reader');
      setActiveTab('now');
    }
  }

  async function addLocalWorkQueue(work: LocalWork) {
    const first = work.tracks[0];
    if (!first?.uri) return;
    const item: Book = {
      ...first,
      title: work.title,
      author: work.author,
      series: work.series,
      coverUri: work.coverUri,
      coverShape: 'square',
      localWorkKey: work.key,
      source: work.originServer ? 'downloaded' : 'local',
      originServer: work.originServer,
      serverWorkId: work.originWorkId,
    };
    const next = queuedBooks.some(existing => existing.localWorkKey === work.key)
      ? queuedBooks
      : [...queuedBooks, item];
    setQueuedBooks(next);
    await setPersistedJSON(localQueueKey, next);
  }

  function downloadedServerWork(work: ServerWork) {
    if(!session)return undefined;
    return offlineWorks[session.server+'|'+work.id];
  }

  async function saveOfflineCheckpoint(key:string, checkpoint:OfflineDownloadCheckpoint|null){
    setOfflineCheckpoints(current=>{
      const next={...current};
      if(checkpoint)next[key]=checkpoint;else delete next[key];
      void setPersistedJSON(offlineCheckpointsKey,next);
      return next;
    });
  }

  async function refreshOfflineStorage(){
    setOfflineStorageBusy(true);
    try{setOfflineStorage(await inspectOfflineStorage(offlineWorks,Object.values(offlineCheckpoints)));}
    catch(e){setError((e as Error).message);}
    finally{setOfflineStorageBusy(false);}
  }

  async function cleanupDownloads(){
    if(offlineBusyId!==null)return;
    setOfflineStorageBusy(true);setError('');
    try{
      const result=await cleanupOfflineStorage(offlineWorks,Object.values(offlineCheckpoints));
      setOfflineWorks(result.retained);
      await setPersistedJSON(offlineWorksKey,result.retained);
      setOfflineProgress('Cleaned '+result.removedWorks.length+' broken download'+(result.removedWorks.length===1?'':'s')+' and '+result.removedOrphans+' orphan folder'+(result.removedOrphans===1?'':'s')+'.');
      setOfflineStorage(await inspectOfflineStorage(result.retained,Object.values(offlineCheckpoints)));
    }catch(e){setError((e as Error).message);}
    finally{setOfflineStorageBusy(false);}
  }

  async function discardPartialDownload(checkpoint:OfflineDownloadCheckpoint){
    if(offlineBusyId!==null)return;
    setOfflineStorageBusy(true);setError('');
    try{
      await removeOfflineCheckpoint(checkpoint);
      await saveOfflineCheckpoint(checkpoint.key,null);
      setOfflineProgress('Partial download removed.');
      setOfflineStorage(await inspectOfflineStorage(offlineWorks,Object.values(offlineCheckpoints)));
    }catch(e){setError((e as Error).message);}
    finally{setOfflineStorageBusy(false);}
  }

  async function downloadServerWork(work: ServerWork) {
    if(!session || offlineBusyId!==null)return;
    const checkpointKey=session.server+'|'+work.id;
    setError('');
    setOfflineBusyId(work.id);
    setOfflineProgress(offlineCheckpoints[checkpointKey]?'Resuming…':'Preparing download…');
    try{
      const tracks=await request(session,'/api/works/'+work.id+'/tracks') as WorkTrack[];
      const chapterPairs=await Promise.all(tracks.filter(track=>track.available&&track.format==='Audio').map(async track=>{
        try{return [String(track.id),await request(session,'/api/assets/'+track.id+'/chapters') as Chapter[]] as const;}catch{return [String(track.id),[] as Chapter[]] as const;}
      }));
      const chaptersByTrackId=Object.fromEntries(chapterPairs.filter(([,items])=>items.length));
      const downloaded=await downloadOfflineWork(
        session,
        work,
        tracks as OfflineServerTrack[],
        (written,total)=>setOfflineProgress(total>0 ? Math.min(100,Math.round(written/total*100))+'%' : formatBytes(written)),
        {
          checkpoint:offlineCheckpoints[checkpointKey],
          onCheckpoint:checkpoint=>saveOfflineCheckpoint(checkpointKey,checkpoint),
          chaptersByTrackId,
        },
      );
      setOfflineWorks(current=>{
        const next={...current,[downloaded.key]:downloaded};
        void setPersistedJSON(offlineWorksKey,next);
        return next;
      });
      setOfflineProgress('Downloaded · '+formatBytes(downloaded.bytes));
      setOfflineStorage(await inspectOfflineStorage({...offlineWorks,[downloaded.key]:downloaded},Object.values(offlineCheckpoints).filter(item=>item.key!==downloaded.key)));
    }catch(e){
      if(isOfflineDownloadPaused(e)){
        setOfflineProgress('Paused · tap Resume download');
      }else{
        setError((e as Error).message);
        setOfflineProgress('Download interrupted · tap Resume download');
      }
    }finally{
      setOfflineBusyId(null);
    }
  }

  async function removeServerDownload(downloaded: OfflineServerWork) {
    if(offlineBusyId!==null)return;
    setOfflineBusyId(downloaded.workId);
    setError('');
    try{
      await removeOfflineWork(downloaded);
      const next={...offlineWorks};
      delete next[downloaded.key];
      setOfflineWorks(next);
      await setPersistedJSON(offlineWorksKey,next);
      setOfflineProgress('');
      setOfflineStorage(await inspectOfflineStorage(next,Object.values(offlineCheckpoints)));
    }catch(e){
      setError((e as Error).message);
    }finally{
      setOfflineBusyId(null);
    }
  }

  async function queueServerWork(work: ServerWork) {
    if (!session || work.format !== 'Audio') return;
    try {
      const tracks = await request(session, '/api/works/' + work.id + '/tracks') as WorkTrack[];
      const first = tracks.find(track => track.available && track.format === 'Audio');
      if (!first) throw Error('No available audio files for this audiobook.');
      const item: Book = {
        id:first.id,title:work.title,author:work.author,series:work.series,genre:work.genre || '',
        format:'Audio',space:work.space,available:true,coverShape:'square',serverWorkId:work.id,
        source:'server',originServer:session.server,
      };
      const next=queuedBooks.some(book=>book.source==='server' && book.originServer===item.originServer && book.id===item.id) ? queuedBooks : [...queuedBooks,item];
      await updateLocalQueue(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openLocalWork(work: LocalWork) {
    if (!work.available) { setError('This work is currently unavailable.'); return; }
    if (work.format === 'Audio') { void playLocalWork(work); return; }
    const first = work.tracks.find(track => track.available);
    if (first) openBook({...first,localWorkKey:work.key,source:work.originServer?'downloaded':'local',originServer:work.originServer,serverWorkId:work.originWorkId});
  }

  function openServerWorkTrack(work: ServerWork, track: WorkTrack) {
    setWorkPicker(null);
    const item: Book = {
      id:track.id,title:work.title,author:work.author,series:work.series,genre:work.genre || '',
      format:track.format,space:work.space,available:track.available,serverWorkId:work.id,
      coverShape:track.format==='Audio'?'square':'portrait',source:'server',originServer:session?.server,
    };
    if (track.format === 'Audio') void playBook(item);
    else openBook(item);
  }

  async function openServerWork(work: ServerWork) {
    if (!session || !work.available) {
      setError('This work is currently unavailable.');
      return;
    }
    setError('');
    try {
      const tracks = await request(session, '/api/works/' + work.id + '/tracks') as WorkTrack[];
      const available = tracks.filter(track => track.available);
      if (!available.length) throw Error('No readable files are currently available for this work.');
      if (work.format === 'Audio' || available.every(track => track.format === 'Audio')) {
        const first = available.find(track => track.format === 'Audio')!;
        await playBook({id:first.id,title:work.title,author:work.author,series:work.series,genre:work.genre || '',format:'Audio',space:work.space,available:true,coverShape:'square',serverWorkId:work.id,source:'server',originServer:session.server});
        return;
      }
      const editions = new Set(available.map(track => track.edition));
      if (editions.size === 1) {
        const first = available[0];
        openBook({id:first.id,title:work.title,author:work.author,series:work.series,genre:work.genre || '',format:first.format,space:work.space,available:true,serverWorkId:work.id,coverShape:first.format==='Audio'?'square':'portrait',source:'server',originServer:session.server});
        return;
      }
      setWorkPicker({work,tracks:available});
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function addLocalQueue(book: Book) {
    if (!book.uri) return;
    const next = queuedBooks.some(item => item.uri === book.uri) ? queuedBooks : [...queuedBooks, book];
    setQueuedBooks(next);
    await setPersistedJSON(localQueueKey, next);
  }

  async function updateLocalQueue(next: Book[]) {
    setQueuedBooks(next);
    await setPersistedJSON(localQueueKey, next);
  }

  function Artwork({
    title,format,coverShape,coverUri,serverPath,large=false,fill=false,
  }: {
    title:string;format:string;coverShape?:'portrait'|'square';coverUri?:string;serverPath?:string;large?:boolean;fill?:boolean;
  }) {
    const square = coverShape ? coverShape === 'square' : format === 'Audio';
    const imageSource = session && serverPath
      ? {uri: session.server + serverPath, headers: {Authorization: 'Bearer ' + session.token}}
      : coverUri ? {uri: coverUri} : null;
    const [coverFailed, setCoverFailed] = useState(false);
    useEffect(() => setCoverFailed(false), [imageSource?.uri]);
    return (
      <View style={[styles.cover, square && styles.coverSquare, large && styles.coverLarge, square && large && styles.coverLargeSquare, fill&&styles.coverFill, {backgroundColor:p.card}]}>
        {imageSource && !coverFailed ? (
          <Image accessible={false} source={imageSource} resizeMode="cover" style={styles.coverImage} onError={() => setCoverFailed(true)} />
        ) : (
          <View style={styles.coverFallback}>
            <ArchivistLogo size={22} opacity={.50}/>
            <View style={styles.coverFallbackCopy}>
              <Text numberOfLines={1} style={[styles.coverFormat,{color:p.sage}]}>{format.toUpperCase()}</Text>
              <Text maxFontSizeMultiplier={1.1} numberOfLines={large ? 3 : 2} style={[styles.coverTitle,{color:p.ink},large&&styles.coverTitleLarge]}>{title}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  function Cover({book, large = false,fill=false}: {book: Book; large?: boolean;fill?:boolean}) {
    return <Artwork
      title={book.title}
      format={book.format}
      coverShape={book.coverShape}
      coverUri={book.coverUri}
      serverPath={session && book.source==='server' ? '/api/assets/' + book.id + '/cover' : undefined}
      large={large}
      fill={fill}
    />;
  }

  function MiniArtwork({book}: {book: Book}) {
    const source = session && book.source==='server'
      ? {uri: session.server + '/api/assets/' + book.id + '/cover', headers: {Authorization: 'Bearer ' + session.token}}
      : book.coverUri ? {uri: book.coverUri} : null;
    const [failed,setFailed]=useState(false);
    useEffect(()=>setFailed(false),[source?.uri]);
    return (
      <View style={[styles.miniCover,{backgroundColor:'#111111'}]}>
        <Text numberOfLines={1} style={styles.miniCoverLabel}>{book.format.toUpperCase()}</Text>
        {source && !failed ? <Image accessible={false} source={source} resizeMode="cover" style={styles.miniCoverImage} onError={()=>setFailed(true)} /> : null}
      </View>
    );
  }

  function ServerConnect() {
    return (
      <View style={styles.serverConnect}>
          <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>OPTIONAL SERVER</Text>
          <Text style={[styles.serverConnectTitle,{color:p.ink}]}>Add a server</Text>
          <Text style={[styles.serverConnectCopy,{color:p.muted}]}>Connect a private Archivist server for household sharing and remote storage. Your library on this device continues to work without it.</Text>
          <TextInput accessibilityLabel="Server address" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={server} onChangeText={setServer} placeholder="https://books.example.com" placeholderTextColor={p.muted} style={[styles.input, {color: p.ink, borderColor: p.line, backgroundColor: p.card}]} />
          <TextInput accessibilityLabel="Profile access key" secureTextEntry autoCapitalize="none" autoCorrect={false} value={key} onChangeText={setKey} placeholder="Profile access key" placeholderTextColor={p.muted} style={[styles.input, {color: p.ink, borderColor: p.line, backgroundColor: p.card}]} />
          <Button label={busy ? 'Checking...' : 'Check server'} onPress={() => void checkServerAddress()} disabled={busy || !server.trim()} tone="quiet" />
          <Button label={busy ? 'Connecting...' : 'Connect'} onPress={() => void signIn()} disabled={busy} />
          {serverNotice?<Text style={[styles.meta,{color:p.sage}]}>{serverNotice}</Text>:null}
          {error ? <Text accessibilityRole="alert" style={[styles.error, {color:p.danger}]}>{error}</Text> : null}
      </View>
    );
  }

  async function finishOnboarding() {
    setOnboardingDone(true);
    await SecureStore.setItemAsync(onboardingDoneKey, '1');
  }

  async function useArchivistLocallyOnly(){
    setShelfServerPromptHidden(true);
    await SecureStore.setItemAsync(shelfServerPromptKey,'1');
  }

  function connectServerFromShelf(){
    setServerPanelOpen(true);
    setActiveTab('settings');
  }

  function LibrarySwitcher({vertical = false}: {vertical?: boolean}) {
    const names = ['', ...availableSpaces];
    return (
      <View style={vertical ? styles.libraryRailList : styles.libraryChipsRow}>
        {names.map(name => {
          const selected=space===name;
          return <Pressable
            key={name || 'all'}
            accessibilityRole="button"
            accessibilityState={{selected}}
            onPress={() => {setSpace(name);setLibraryFolderExact(false);setReviewOnly(false);setAvailabilityFilter('all');setFormatFilter('');setLibraryFormatFamily('');setAuthorFilter('');setSeriesFilter('');setGenreFilter('');setUnknownAuthorOnly(false);}}
            style={({pressed})=>[
              styles.librarySpaceTab,
              vertical&&styles.librarySpaceTabVertical,
              pressed&&{opacity:.62},
            ]}>
            <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={[styles.librarySpaceText,{color:selected?p.ink:p.muted,fontWeight:selected?'700':'500'}]}>
              {name || 'All spaces'}
            </Text>
            <View pointerEvents="none" style={[
              vertical?styles.librarySpaceMarkerVertical:styles.librarySpaceMarker,
              {backgroundColor:p.sage,opacity:selected?1:0},
            ]}/>
          </Pressable>;
        })}
      </View>
    );
  }

  function LibrarySourceNavigator({compact=false}:{compact?:boolean}){
    const choose=(nextSource:LibrarySource,nextSpace='',exact=false)=>{
      setSourceFilter(nextSource);
      setSpace(nextSpace);
      setLibraryFolderExact(exact);
      setCollectionFilter('');
      setReviewOnly(false);
      if(compact)setLibrarySourcesOpen(false);
    };
    const selected=(nextSource:LibrarySource,nextSpace='',exact=false)=>
      sourceFilter===nextSource&&space===nextSpace&&libraryFolderExact===exact;
    const localFolderCount=(folder:LocalFolder)=>sourceWorks.filter(work=>work.source==='local'&&work.space===folder.name).length;
    const serverFolderCount=(folder:{space:string})=>sourceWorks.filter(work=>work.source==='server'&&work.space===folder.space).length;
    const Row=({label,count,detail,active,onPress,icon='library'}:{label:string;count?:number;detail?:string;active:boolean;onPress:()=>void;icon?:UiIconName})=><Pressable
      accessibilityRole="button"
      accessibilityState={{selected:active}}
      onPress={onPress}
      style={({pressed})=>[styles.libraryTreeRow,active&&{backgroundColor:p.card},pressed&&{opacity:.68}]}>
      <View style={[styles.libraryTreeIcon,{backgroundColor:active?p.raised:'transparent'}]}><UiIcon name={icon} color={active?p.sage:p.muted} size={16}/></View>
      <View style={{flex:1,minWidth:0}}>
        <Text numberOfLines={1} style={[styles.libraryTreeLabel,{color:active?p.ink:p.muted,fontWeight:active?'700':'500'}]}>{label}</Text>
        {detail?<Text numberOfLines={1} style={[styles.libraryTreeDetail,{color:p.muted}]}>{detail}</Text>:null}
      </View>
      {typeof count==='number'?<Text style={[styles.libraryTreeCount,{color:active?p.sage:p.muted}]}>{count}</Text>:null}
    </Pressable>;

    return <View style={styles.librarySourceTree}>
      <Row label="All Library" count={sourceCounts.all} active={selected('all')} onPress={()=>choose('all')} icon="library"/>

      <Text style={[styles.libraryTreeGroupLabel,{color:p.muted}]}>ON THIS DEVICE</Text>
      <Row label="On this device" count={sourceCounts.local} active={selected('local')} onPress={()=>choose('local')} icon="shelf"/>
      <View style={styles.libraryTreeChildren}>
        {localFolders.map(folder=><Row key={folder.id||folder.uri} label={folder.name} count={localFolderCount(folder)} detail={folder.status||undefined} active={selected('local',folder.name,true)} onPress={()=>choose('local',folder.name,true)} icon="bookOpen"/>)}
        {sourceCounts.downloaded>0?<Row label="Offline downloads" count={sourceCounts.downloaded} detail="Saved from Archivist Server" active={selected('downloaded')} onPress={()=>choose('downloaded')} icon="bookmark"/>:null}
        {!localFolders.length&&sourceCounts.downloaded===0?<Text style={[styles.libraryTreeEmpty,{color:p.muted}]}>No device folders added.</Text>:null}
      </View>
      <Pressable accessibilityRole="button" onPress={()=>{if(compact)setLibrarySourcesOpen(false);void addLocalFolder();}} style={styles.libraryTreeAdd}><UiIcon name="plus" color={p.sage} size={15}/><Text style={[styles.libraryTreeAddText,{color:p.sage}]}>Add device folder</Text></Pressable>

      {session||recoverableSession?<>
        <Text style={[styles.libraryTreeGroupLabel,{color:p.muted}]}>ARCHIVIST SERVER</Text>
        {session?<Row label="On Archivist Server" count={sourceCounts.server} active={selected('server')} onPress={()=>choose('server')} icon="atlas"/>:
          <Row label="Archivist Server" detail="Server offline" active={false} onPress={()=>{if(compact)setLibrarySourcesOpen(false);setActiveTab('settings')}} icon="atlas"/>}
        {session?<View style={styles.libraryTreeChildren}>
          {sources.map(source=><Row key={source.id} label={source.space||source.path.split(/[\\/]/).filter(Boolean).pop()||'Server folder'} count={serverFolderCount(source)} detail={source.path} active={selected('server',source.space,true)} onPress={()=>choose('server',source.space,true)} icon="bookOpen"/>)}
          {!sources.length?<Text style={[styles.libraryTreeEmpty,{color:p.muted}]}>No server folders reported.</Text>:null}
        </View>:null}
      </>:null}
    </View>;
  }

  function OnboardingGuide() {
    if (session || recoverableSession || onboardingDone) return null;
    const reviewCount = localBooks.filter(book => book.needsReview).length;
    const hasFolder = localFolders.length > 0;
    const hasBooks = localBooks.length > 0;
    return (
      <View style={[styles.onboardingCard,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <Text style={[styles.onboardingEyebrow,{color:p.sage}]}>SETUP</Text>
        <Text style={[styles.onboardingTitle,{color:p.ink}]}>Build your Shelf</Text>
        <Text style={[styles.onboardingIntro,{color:p.muted}]}>Add media from this device, connect your private Archivist Server, or use both. Archivist keeps the Shelf focused on what you want to read or listen to next.</Text>

        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber,{color:hasFolder?p.sage:p.muted}]}>01</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Choose where your media lives</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{hasFolder ? `${localFolders.length} device folder${localFolders.length===1?'':'s'} added` : shelfServerPromptHidden ? 'Add a Books, Comics or Audiobooks folder. Server prompts are hidden on Shelf.' : 'Add a device folder or connect an Archivist Server. You can add the other later.'}</Text>
          </View>
        </View>

        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber,{color:hasBooks?p.sage:p.muted}]}>02</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Archivist scans and identifies it</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{localScanning&&scanProgress ? `Scanning ${scanProgress.currentFolder}: ${scanProgress.found} found, ${scanProgress.review} need review` : hasBooks ? `${localBooks.length} items found` : 'Scanning starts immediately after you add a folder.'}</Text>
          </View>
        </View>

        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber,{color:hasBooks&&reviewCount===0?p.sage:p.muted}]}>03</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Review only what needs attention</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{!hasBooks ? 'Confident matches stay out of your way.' : reviewCount ? `${reviewCount} item${reviewCount===1?'':'s'} need a quick check.` : 'Everything found so far looks good.'}</Text>
          </View>
        </View>

        {!hasFolder?<View style={styles.shelfSetupActions}>
          <View style={styles.shelfSetupAction}><Button label={localScanning?'Scanning…':'Add a folder'} disabled={localScanning} onPress={()=>void addLocalFolder()}/></View>
          {!shelfServerPromptHidden?<View style={styles.shelfSetupAction}><Button label="Connect to Archivist Server" tone="quiet" onPress={connectServerFromShelf}/></View>:null}
        </View>:null}
        {!hasFolder&&!shelfServerPromptHidden?<Pressable accessibilityRole="button" onPress={()=>void useArchivistLocallyOnly()} style={styles.shelfLocalOnlyAction}><Text style={[styles.meta,{color:p.muted,fontWeight:'600'}]}>Use Archivist locally only</Text></Pressable>:null}

        {hasFolder&&!hasBooks?<Button label={localScanning?'Scanning…':'Scan again'} disabled={localScanning} onPress={()=>void rescanLocalFolders()}/>:null}
        {hasBooks&&reviewCount>0?<Button label={`Review ${reviewCount} uncertain item${reviewCount===1?'':'s'}`} tone="quiet" onPress={()=>{setReviewOnly(true);setQuery('');setActiveTab('library')}}/>:null}
        {hasBooks?<Button label="Finish setup" onPress={()=>void finishOnboarding()}/>:null}
      </View>
    );
  }

  function beginEdit(item: Book, uris:string[] = item.uri?[item.uri]:[]) {
    setEditing(item);
    setEditingUris(uris.filter(Boolean));
    setEditTitle(item.title);
    setEditAuthor(item.author || '');
    setEditSeries(item.series || '');
    setEditGenre(item.genre || '');
    setEditYear(item.publishedYear ? String(item.publishedYear) : '');
    setEditCoverUri(item.coverUri || '');
  }

  function RawAssetCard({item}: {item: Book}) {
    return (
      <View style={styles.book}>
        <Pressable accessibilityRole="button" accessibilityLabel={item.title + ', ' + item.format} onPress={() => openBook(item)}>
          <Cover book={item} />
          <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{item.title}</Text>
          {item.needsReview ? <View style={[styles.reviewPill,{borderColor:p.sage}]}><Text style={{color:p.sage,fontSize:11,fontWeight:'800'}}>Needs review</Text></View> : null}
          <Text style={[styles.meta,{color:p.muted}]}>{item.format} · {item.space}{item.author ? ' · '+item.author : ''}{item.series ? ' · '+item.series : ''}{item.genre ? ' · '+item.genre : ''}</Text>
        </Pressable>
        {(item.source!=='server' || owner) ? <Button label="Edit details" tone="quiet" onPress={()=>beginEdit(item)} /> : null}
      </View>
    );
  }

  function PersonalControls({rating,favourite,onRating,onFavourite}:{
    rating:number;favourite:boolean;onRating:(rating:number)=>void;onFavourite:()=>void;
  }) {
    return <View style={styles.personalControls}>
      <Text style={[styles.personalControlLabel,{color:p.muted}]}>YOUR RATING</Text>
      <View style={styles.personalControlRow}>
        <View accessibilityLabel={'Personal rating '+ratingLabel(rating)} style={styles.ratingStars}>
          {[1,2,3,4,5].map(star=>{
            const full=rating>=star*2,half=rating===star*2-1;
            return <Pressable
              key={star}
              accessibilityRole="button"
              accessibilityLabel={'Rate '+(star-0.5)+' or '+star+' stars'}
              onPress={event=>onRating((star-1)*2+(event.nativeEvent.locationX<22?1:2))}
              style={({pressed})=>[styles.ratingStarButton,pressed&&{opacity:.72,transform:[{scale:.96}]}]}>
              <RatingStarMark color={full||half?p.sage:p.muted} opacity={half?.55:1} size={20}/>
            </Pressable>;
          })}
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{selected:favourite}} accessibilityLabel={favourite?'Remove favourite':'Add favourite'} onPress={onFavourite} style={styles.favouriteTextAction}>
          <Text style={{color:favourite?p.sage:p.muted,fontSize:12.5,lineHeight:18,fontWeight:'600'}}>{favourite?'Favourited':'Favourite'}</Text>
        </Pressable>
      </View>
      {rating>0?<Text style={[styles.meta,{color:p.sage}]}>{ratingLabel(rating)}</Text>:null}
    </View>;
  }
  function LocalWorkCard({work}: {work: LocalWork}) {
    const downloaded=Object.values(offlineWorks).find(item=>'offline:'+item.key===work.key);
    const personal=localPreferences[work.key] || {rating:0,favourite:false};
    return (
      <View style={styles.book}>
        <Pressable accessibilityRole="button" accessibilityLabel={work.title + ', ' + work.format} onPress={()=>openLocalWork(work)}>
          <Artwork title={work.title} format={work.format} coverShape={work.coverShape} coverUri={work.coverUri} />
          <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{work.title}</Text>
          {work.needsReview ? <View style={[styles.reviewPill,{borderColor:p.sage}]}><Text style={{color:p.sage,fontSize:11,fontWeight:'800'}}>Needs review</Text></View> : null}
          <Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>
            {work.author || 'Unknown author'}{work.series ? ' · '+work.series : ''}{work.genre ? ' · '+work.genre : ''}{work.files>1 ? ' · '+work.files+' files' : ''}
          </Text>
        </Pressable>
        <PersonalControls rating={personal.rating||0} favourite={!!personal.favourite}
          onRating={rating=>void saveLocalPreference(work,{...personal,rating:personal.rating===rating?0:rating})}
          onFavourite={()=>void saveLocalPreference(work,{...personal,favourite:!personal.favourite})} />
        {work.format==='Audio' ? <Button label="Add to queue" tone="quiet" onPress={()=>void addLocalWorkQueue(work)} /> : null}
        {downloaded ? <Button label="Remove download" tone="quiet" disabled={offlineBusyId===downloaded.workId} onPress={()=>void removeServerDownload(downloaded)} /> : null}
      </View>
    );
  }

  function ServerWorkCard({work}: {work: ServerWork}) {
    const downloaded=downloadedServerWork(work);
    const downloading=offlineBusyId===work.id;
    const checkpoint=session?offlineCheckpoints[session.server+'|'+work.id]:undefined;
    const personal=serverPreferences[work.id] || {rating:0,favourite:false,state:'not-started' as ReadingState};
    return (
      <View style={styles.book}>
        <Pressable accessibilityRole="button" accessibilityLabel={work.title + ', ' + work.format} onPress={()=>void openServerWork(work)}>
          <Artwork title={work.title} format={work.format} coverShape={work.format==='Audio'?'square':'portrait'} serverPath={'/api/works/'+work.id+'/cover'} />
          <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{work.title}</Text>
          <Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>
            {work.author || 'Unknown author'}{work.series ? ' · '+work.series : ''}{work.genre ? ' · '+work.genre : ''}{work.files>1 ? ' · '+work.files+' files' : ''}{work.editions>1 ? ' · '+work.editions+' editions' : ''}
          </Text>
        </Pressable>
        <PersonalControls rating={personal.rating||0} favourite={!!personal.favourite}
          onRating={rating=>void saveServerPreference(work,{...personal,rating:personal.rating===rating?0:rating})}
          onFavourite={()=>void saveServerPreference(work,{...personal,favourite:!personal.favourite})} />
        {work.format==='Audio' ? <Button label="Add to queue" tone="quiet" disabled={!queueReady||queueBusy} onPress={()=>void queueServerWork(work)} /> : null}
        {downloaded
          ? <Button label={'Remove download · '+formatBytes(downloaded.bytes)} tone="quiet" disabled={downloading} onPress={()=>void removeServerDownload(downloaded)} />
          : <Button label={downloading ? 'Downloading '+offlineProgress : checkpoint ? 'Resume download' : 'Download for offline'} tone="quiet" disabled={offlineBusyId!==null} onPress={()=>void downloadServerWork(work)} />}
      </View>
    );
  }

  function RatingPromptPanel() {
    if(!ratingPrompt)return null;
    const local=ratingPrompt.localWorkKey?localWorks.find(work=>work.key===ratingPrompt.localWorkKey):undefined;
    const server=ratingPrompt.serverWorkId?serverWorks.find(work=>work.id===ratingPrompt.serverWorkId):undefined;
    const personal=local
      ? (localPreferences[local.key] || {rating:0,favourite:false})
      : server ? (serverPreferences[server.id] || {rating:0,favourite:false,state:'finished' as ReadingState}) : {rating:0,favourite:false};
    return <Modal transparent animationType="fade" visible onRequestClose={()=>setRatingPrompt(null)}>
      <View style={styles.ratingPromptBackdrop}>
      <View accessibilityViewIsModal accessibilityLabel={'Rate '+ratingPrompt.title} style={[styles.ratingPromptCard,{backgroundColor:p.card,borderColor:p.line}]}>
        <Text style={[styles.playerEyebrow,{color:p.sage}]}>FINISHED</Text>
        <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>How was it?</Text>
        <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{ratingPrompt.title}</Text>
        <PersonalControls
          rating={personal.rating||0}
          favourite={!!personal.favourite}
          onRating={rating=>{
            const next={...personal,rating:personal.rating===rating?0:rating};
            if(local)void saveLocalPreference(local,next);
            else if(server)void saveServerPreference(server,next);
          }}
          onFavourite={()=>{
            const next={...personal,favourite:!personal.favourite};
            if(local)void saveLocalPreference(local,next);
            else if(server)void saveServerPreference(server,next);
          }}
        />
        <Button label="Done" onPress={()=>setRatingPrompt(null)} />
        <Button label="Not now" tone="quiet" onPress={()=>setRatingPrompt(null)} />
      </View>
      </View>
    </Modal>;
  }

  function WorkPickerPanel() {
    if (!workPicker) return null;
    const choices = workPicker.tracks.filter((track,index,all)=>all.findIndex(item=>item.edition===track.edition)===index);
    return (
      <Modal transparent animationType="fade" visible onRequestClose={()=>setWorkPicker(null)}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal accessibilityLabel={'Choose edition for '+workPicker.work.title} style={[styles.modalCard,{backgroundColor:p.card,borderColor:p.line}]}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{workPicker.work.title}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>Choose an edition to open.</Text>
            {choices.map(track=><Button
              key={track.edition}
              label={(track.format==='Audio'?'Listen':'Open')+' · '+track.format}
              tone="quiet"
              onPress={()=>openServerWorkTrack(workPicker.work,track)}
            />)}
            <Button label="Cancel" tone="quiet" onPress={()=>setWorkPicker(null)} />
          </View>
        </View>
      </Modal>
    );
  }

  function openUnifiedWork(work: UnifiedWork) {
    setWorkMenu(null);
    if (work.localWork) { openLocalWork(work.localWork); return; }
    if (work.serverWork) { void openServerWork(work.serverWork); }
  }

  function ContinueCard({
    title,author,format,coverUri,serverPath,onPress,
  }: {
    title:string;author:string;format:string;coverUri?:string;serverPath?:string;onPress:()=>void;
  }) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={'Continue '+title+', '+(author||format)} onPress={onPress} style={styles.continueCard}>
        <Artwork title={title} format={format} coverShape={format==='Audio'?'square':'portrait'} coverUri={coverUri} serverPath={serverPath} />
        <Text numberOfLines={2} style={[styles.continueTitle,{color:p.ink}]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.meta,{color:p.muted}]}>{author || format}</Text>
      </Pressable>
    );
  }

  async function saveShelfSections(next:ShelfSectionPref[]){
    setShelfSections(next);
    await setPersistedJSON(shelfSectionsKey,next);
  }

  function SourceSwitcher({vertical=false}:{vertical?:boolean}){
    const options:Array<{id:LibrarySource;label:string;count:number;show:boolean}>=[
      {id:'all',label:'All library',count:sourceCounts.all,show:true},
      {id:'local',label:'On this device',count:sourceCounts.local,show:true},
      {id:'server',label:'Archivist Server',count:sourceCounts.server,show:!!session},
      {id:'downloaded',label:'Downloaded',count:sourceCounts.downloaded,show:sourceCounts.downloaded>0},
    ];
    const body=options.filter(item=>item.show).map(item=>{
      const selected=sourceFilter===item.id;
      return <Pressable
        key={item.id}
        accessibilityRole="button"
        accessibilityState={{selected}}
        onPress={()=>{setSourceFilter(item.id);setSpace('');setLibraryFolderExact(false);setCollectionFilter('')}}
        style={({pressed})=>[
          styles.sourceTab,
          vertical&&styles.sourceTabVertical,
          pressed&&{opacity:.62},
        ]}>
        <View style={{flexDirection:'row',alignItems:'baseline',gap:7,minWidth:0}}>
          <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={[styles.sourceTabText,{color:selected?p.ink:p.muted,fontWeight:selected?'700':'500'}]}>{item.label}</Text>
          <Text maxFontSizeMultiplier={1.15} style={[styles.sourceTabCount,{color:selected?p.sage:p.muted}]}>{item.count}</Text>
        </View>
        <View
          pointerEvents="none"
          style={[
            vertical?styles.sourceTabMarkerVertical:styles.sourceTabMarker,
            {backgroundColor:p.sage,opacity:selected?1:0},
          ]}
        />
      </Pressable>;
    });
    return vertical
      ? <View style={styles.sourceSwitcherVertical}>{body}</View>
      : <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceSwitcherScroll} contentContainerStyle={styles.sourceSwitcher}>{body}</ScrollView>;
  }

  function UnifiedWorkCard({work,list=false}:{work:UnifiedWork;list?:boolean}){
    const serverPath=work.source==='server' && work.serverWork && session && (!work.server || work.server===session.server) ? '/api/works/'+work.serverWork.id+'/cover' : undefined;
    const selected=selectedWorkKeys.includes(work.canonicalKey);
    const selecting=selectedWorkKeys.length>0;
    const toggleSelected=()=>setSelectedWorkKeys(current=>current.includes(work.canonicalKey)?current.filter(key=>key!==work.canonicalKey):[...current,work.canonicalKey]);
    return <Pressable
      accessibilityRole="button"
      accessibilityLabel={work.title+', '+sourceLabel(work.source)}
      accessibilityState={{selected}}
      accessibilityHint={selecting?'Toggle selection.':'Open. Long press to select.'}
      onPress={()=>selecting?toggleSelected():openUnifiedWork(work)}
      onLongPress={()=>{if(!selected)setSelectedWorkKeys(current=>[...current,work.canonicalKey]);}}
      style={({pressed})=>[
        styles.unifiedCard,
        list&&styles.unifiedCardList,
        selected&&[styles.unifiedCardSelected,{borderColor:p.sage,backgroundColor:p.card}],
        pressed&&styles.cardPressed,
      ]}>
      <View style={[styles.unifiedCoverWrap,list&&styles.unifiedCoverWrapList]}>
        <Artwork title={work.title} format={work.format} coverShape={work.format==='Audio'?'square':'portrait'} coverUri={work.coverUri} serverPath={serverPath}/>
        {work.source==='downloaded'?<View style={[styles.offlineBadge,{backgroundColor:p.sage}]}><Text style={styles.offlineBadgeText}>SAVED</Text></View>:null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'More actions for '+work.title}
          hitSlop={8}
          onPress={event=>{event.stopPropagation();setWorkMenu(work)}}
          style={[styles.moreButton,{backgroundColor:'rgba(0,0,0,.48)'},list&&styles.moreButtonList]}>
          <UiIcon name="more" color="#FFFFFF" size={16}/>
        </Pressable>
      </View>
      <View style={[styles.unifiedCardCopy,list&&{flex:1}]}>
        <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{work.title}</Text>
        <Text numberOfLines={1} style={[styles.meta,{color:p.muted}]}>{work.author||'Unknown author'}</Text>
        {list?<View style={styles.unifiedListMeta}>
          <View style={[styles.workSourceDot,{backgroundColor:work.source==='downloaded'?p.sage:p.muted}]}/>
          <Text numberOfLines={1} style={[styles.workSource,{color:p.muted}]}>{sourceLabel(work.source)} · {work.format}{work.series?' · '+work.series:''}</Text>
          {work.rating>0?<Text style={[styles.workRating,{color:p.muted}]}>{ratingLabel(work.rating)}</Text>:null}
        </View>:null}
      </View>
    </Pressable>;
  }

  function SheetAction({label,onPress,disabled=false,tone='default'}:{label:string;onPress:()=>void;disabled?:boolean;tone?:'default'|'destructive'}){
    return <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed})=>[styles.sheetAction,{borderBottomColor:p.line},disabled&&{opacity:.38},pressed&&!disabled&&{opacity:.72}]}>
      <Text style={[styles.sheetActionText,{color:tone==='destructive'?p.danger:p.ink}]}>{label}</Text>
    </Pressable>;
  }

  function WorkActionSheet(){
    if(!workMenu)return null;
    const work=workMenu;
    const local=work.localWork;
    const remote=work.serverWork;
    const personal=local ? (localPreferences[local.key]||{rating:local.rating||0,favourite:local.favourite||false}) : remote ? (serverPreferences[remote.id]||{rating:work.rating,favourite:work.favourite,state:work.readingState}) : {rating:0,favourite:false};
    const downloaded=remote?downloadedServerWork(remote):undefined;
    const close=()=>setWorkMenu(null);
    const setFav=()=>{
      if(local)void saveLocalPreference(local,{...personal,favourite:!personal.favourite});
      else if(remote)void saveServerPreference(remote,{...personal,favourite:!personal.favourite});
      close();
    };
    return <Modal transparent animationType="slide" visible onRequestClose={close}>
      <Pressable style={[styles.sheetBackdrop,foldLayout&&styles.sheetBackdropFold]} onPress={close}>
        <Pressable accessibilityViewIsModal accessibilityLabel={'Actions for '+work.title} style={[styles.actionSheet,foldLayout&&styles.actionSheetFold,{backgroundColor:p.card,borderColor:p.line}]} onPress={()=>undefined}>
          <View style={[styles.sheetHandle,foldLayout&&styles.sheetHandleFold]}/>
          <View style={styles.sheetHeader}>
            <View style={{flex:1,minWidth:0}}>
              <Text maxFontSizeMultiplier={1.15} numberOfLines={2} style={[styles.sheetTitle,{color:p.ink}]}>{work.title}</Text>
              <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={[styles.meta,{color:p.muted}]}>{work.author||'Unknown author'} · {sourceLabel(work.source)}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close actions" onPress={close} style={styles.sheetCloseButton}><UiIcon name="close" color={p.muted} size={18}/></Pressable>
          </View>
          <Button label={work.format==='Audio'?'Listen':'Open'} onPress={()=>openUnifiedWork(work)}/>
          <View style={styles.sheetActionList}>
            <SheetAction label="Work details" onPress={()=>{setWorkDetails(work);close();}}/>
            <SheetAction label={personal.favourite?'Remove favourite':'Add favourite'} onPress={setFav}/>
            {work.format==='Audio'&&local?<SheetAction label="Add to queue" onPress={()=>{close();void addLocalWorkQueue(local);}}/>:null}
            {work.format==='Audio'&&remote?<SheetAction label="Add to queue" onPress={()=>{close();void queueServerWork(remote);}}/>:null}
            {remote&&!downloaded?<SheetAction label="Download for offline" disabled={offlineBusyId!==null} onPress={()=>{close();void downloadServerWork(remote);}}/>:null}
            {downloaded?<SheetAction label={'Remove download · '+formatBytes(downloaded.bytes)} disabled={offlineBusyId!==null} onPress={()=>{close();void removeServerDownload(downloaded);}}/>:null}
            <SheetAction label="Add to collection" onPress={()=>{setCollectionTarget(work);setOrganisationModal('add-to-collection');close();}}/>
            {local?.tracks[0]?<SheetAction label="Edit details & cover" onPress={()=>{beginEdit({...local.tracks[0],title:work.title,author:work.author,series:work.series,genre:work.genre,publishedYear:work.publishedYear,coverUri:work.coverUri,source:work.source,originServer:local.originServer,serverWorkId:local.originWorkId},local.tracks.map(track=>track.uri));close();}}/>:null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>;
  }
  function WorkDetailsPanel(){
    if(!workDetails)return null;
    const work=workDetails;
    const local=work.localWork;
    const remote=work.serverWork;
    const localTrack=local?.tracks[0];
    const serverPath=remote&&session&&(!work.server||work.server===session.server)?'/api/works/'+remote.id+'/cover':undefined;
    const personal=local?(localPreferences[local.key]||{rating:work.rating||0,favourite:work.favourite||false})
      :remote?(serverPreferences[remote.id]||{rating:work.rating||0,favourite:work.favourite||false,state:work.readingState})
      :{rating:work.rating||0,favourite:work.favourite||false};
    const downloaded=remote?downloadedServerWork(remote):undefined;
    const matchingServerSources=remote?sources.filter(source=>source.space===work.space):[];
    const progressCopy=(()=>{
      if(work.readingState==='finished')return 'Finished';
      if(work.readingState==='not-started')return 'Not started';
      if(local&&work.format==='Audio'){
        const seconds=localWorkProgress[local.key]?.seconds||0;
        return seconds>0?'In progress · '+formatTime(seconds):'In progress';
      }
      if(local){
        const page=Math.max(0,...local.tracks.map(track=>track.uri?(localReadingProgress[track.uri]||0):0));
        return page>0?'In progress · page '+(page+1):'In progress';
      }
      return 'In progress';
    })();
    const provenance=localTrack?.metadataSource==='manual'?'Manual override'
      :localTrack?.metadataSource==='sidecar'?'Sidecar metadata'
      :localTrack?.metadataSource==='path'?'Filename / folder scan'
      :remote?'Archivist Server catalogue'
      :'Scanned metadata';
    const close=()=>setWorkDetails(null);
    const setFav=()=>{
      if(local)void saveLocalPreference(local,{...personal,favourite:!personal.favourite});
      else if(remote)void saveServerPreference(remote,{...personal,favourite:!personal.favourite});
    };
    const editLocal=()=>{
      if(!localTrack)return;
      beginEdit({...localTrack,title:work.title,author:work.author,series:work.series,genre:work.genre,publishedYear:work.publishedYear,coverUri:work.coverUri,source:work.source,originServer:local?.originServer,serverWorkId:local?.originWorkId},local?.tracks.map(track=>track.uri)||[]);
      close();
    };
    const openServerManagement=()=>{
      clearLibraryFilters();
      setSourceFilter('server');
      setQuery(work.title);
      setActiveTab('library');
      setLibraryManageOpen(true);
      close();
    };
    const refreshMetadata=()=>{
      if(local){void rescanLocalFolders();close();return;}
      if(remote&&owner&&matchingServerSources.length===1){void sourceAction('/api/sources/'+matchingServerSources[0].id+'/scan');close();return;}
      openServerManagement();
    };
    return <Modal transparent animationType="slide" visible onRequestClose={close}>
      <View style={[styles.sheetBackdrop,foldLayout&&styles.sheetBackdropFold]}>
        <ScrollView contentContainerStyle={styles.workDetailsScroll}>
          <View accessibilityViewIsModal accessibilityLabel={'Work details for '+work.title} style={[styles.workDetailsSheet,{backgroundColor:p.paper,borderColor:p.line}]}>
            <View style={[styles.sheetHandle,foldLayout&&styles.sheetHandleFold]}/>
            <View style={styles.sheetHeader}>
              <View><Text style={[styles.playerEyebrow,{color:p.sage}]}>WORK DETAILS</Text><Text style={[styles.meta,{color:p.muted}]}>{sourceLabel(work.source)}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close work details" onPress={close} style={styles.sheetCloseButton}><UiIcon name="close" color={p.muted} size={18}/></Pressable>
            </View>
            <View style={[styles.workDetailsHero,foldLayout&&styles.workDetailsHeroFold]}>
              <View style={[styles.workDetailsCover,work.format==='Audio'&&styles.workDetailsCoverSquare]}><Artwork title={work.title} format={work.format} coverShape={work.format==='Audio'?'square':'portrait'} coverUri={work.coverUri} serverPath={serverPath} fill/></View>
              <View style={styles.workDetailsIdentity}>
                <Text maxFontSizeMultiplier={1.18} style={[styles.workDetailsTitle,{color:p.ink}]}>{work.title}</Text>
                <Text style={[styles.workDetailsAuthor,{color:p.muted}]}>{work.author||'Unknown author'}</Text>
                {work.series?<Text style={[styles.meta,{color:p.muted}]}>{work.series}</Text>:null}
                <View style={styles.workDetailsTags}>
                  {[work.format,work.genre,work.publishedYear?String(work.publishedYear):''].filter(Boolean).map(value=><View key={String(value)} style={[styles.workDetailsTag,{borderColor:p.line}]}><Text style={[styles.workDetailsTagText,{color:p.muted}]}>{value}</Text></View>)}
                </View>
                <Text style={[styles.meta,{color:p.sage}]}>{progressCopy}</Text>
                {personal.rating?<Text style={[styles.meta,{color:p.gold}]}>{ratingLabel(personal.rating)}</Text>:null}
              </View>
            </View>

            <View style={[styles.workDetailsFacts,{borderTopColor:p.line,borderBottomColor:p.line}]}>
              {[
                ['Location',work.space||sourceLabel(work.source)],
                ['Metadata',provenance],
                ['Files',String(work.files)],
                ['Editions',String(work.editions)],
                ['Availability',work.available?'Available':'Unavailable'],
                ['Cover',work.coverUri||serverPath?'Artwork available':'Fallback cover'],
              ].map(([label,value])=><View key={label} style={styles.workDetailsFact}><Text style={[styles.workDetailsFactLabel,{color:p.muted}]}>{label}</Text><Text numberOfLines={2} style={[styles.workDetailsFactValue,{color:p.ink}]}>{value}</Text></View>)}
            </View>

            <Button label={work.format==='Audio'?'Listen':'Open'} onPress={()=>{close();openUnifiedWork(work)}}/>
            <View style={styles.workDetailsActionGrid}>
              <Pressable accessibilityRole="button" onPress={setFav} style={[styles.workDetailsAction,{borderColor:p.line}]}><UiIcon name="bookmark" color={personal.favourite?p.gold:p.sage} size={18}/><Text style={[styles.workDetailsActionText,{color:p.ink}]}>{personal.favourite?'Favourited':'Favourite'}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={()=>{setCollectionTarget(work);setOrganisationModal('add-to-collection');close();}} style={[styles.workDetailsAction,{borderColor:p.line}]}><UiIcon name="library" color={p.sage} size={18}/><Text style={[styles.workDetailsActionText,{color:p.ink}]}>Collection</Text></Pressable>
              {localTrack?<Pressable accessibilityRole="button" onPress={editLocal} style={[styles.workDetailsAction,{borderColor:p.line}]}><UiIcon name="edit" color={p.sage} size={18}/><Text style={[styles.workDetailsActionText,{color:p.ink}]}>Edit metadata & cover</Text></Pressable>
                :remote&&owner?<Pressable accessibilityRole="button" onPress={openServerManagement} style={[styles.workDetailsAction,{borderColor:p.line}]}><UiIcon name="edit" color={p.sage} size={18}/><Text style={[styles.workDetailsActionText,{color:p.ink}]}>Manage metadata</Text></Pressable>:null}
              <Pressable accessibilityRole="button" onPress={refreshMetadata} style={[styles.workDetailsAction,{borderColor:p.line}]}><UiIcon name="refresh" color={p.sage} size={18}/><Text style={[styles.workDetailsActionText,{color:p.ink}]}>Refresh metadata & cover</Text></Pressable>
              {remote&&!downloaded?<Pressable accessibilityRole="button" disabled={offlineBusyId!==null} onPress={()=>{void downloadServerWork(remote);close();}} style={[styles.workDetailsAction,{borderColor:p.line,opacity:offlineBusyId!==null ? .45 : 1}]}><UiIcon name="download" color={p.sage} size={18}/><Text style={[styles.workDetailsActionText,{color:p.ink}]}>Download</Text></Pressable>:null}
              {downloaded?<Pressable accessibilityRole="button" disabled={offlineBusyId!==null} onPress={()=>{void removeServerDownload(downloaded);close();}} style={[styles.workDetailsAction,{borderColor:p.line,opacity:offlineBusyId!==null ? .45 : 1}]}><UiIcon name="close" color={p.danger} size={18}/><Text style={[styles.workDetailsActionText,{color:p.danger}]}>Remove download</Text></Pressable>:null}
            </View>
            {local&&local.tracks.length>1?<View style={[styles.workDetailsTrackSummary,{borderTopColor:p.line}]}><Text style={[styles.settingsSectionTitle,{color:p.muted}]}>FILES IN THIS WORK</Text>{local.tracks.slice(0,8).map((track,index)=><View key={track.uri} style={styles.workDetailsTrackRow}><Text numberOfLines={1} style={[styles.meta,{color:p.ink,flex:1}]}>{index+1}. {track.title}</Text><Text style={[styles.meta,{color:p.muted}]}>{track.format}</Text></View>)}{local.tracks.length>8?<Text style={[styles.meta,{color:p.muted}]}>+ {local.tracks.length-8} more files</Text>:null}</View>:null}
          </View>
        </ScrollView>
      </View>
    </Modal>;
  }

  function MetadataEditorPanel(){
    if(!editing)return null;
    const localEdit=editing.source!=='server'&&!!editing.uri;
    const targets=editingUris.length?editingUris:(editing.uri?[editing.uri]:[]);
    const save=()=>{
      const title=editTitle.trim(),author=editAuthor.trim(),seriesName=editSeries.trim(),genre=editGenre.trim();
      const yearText=editYear.trim();
      const publishedYear=/^\d{4}$/.test(yearText)?Number(yearText):undefined;
      const coverUri=editCoverUri.trim();
      if(!title)return;
      setBusy(true);setError('');
      if(editing.source==='server'){
        if(!session || (editing.originServer&&editing.originServer!==session.server) || !owner){setBusy(false);setError('Reconnect to the correct server as an admin to edit this file.');return;}
        request(session,'/api/assets/'+editing.id+'/metadata','PATCH',{title,author,series:seriesName,genre})
          .then(()=>{setServerBooks(old=>old.map(b=>b.id===editing.id?{...b,title,author,series:seriesName,genre,needsReview:false,reviewReason:'',metadataSource:'manual',identificationConfidence:'high'}:b));setEditing(null);setEditingUris([]);})
          .catch(e=>setError(e.message)).finally(()=>setBusy(false));
      }else if(editing.uri){
        const override:LocalMetadataOverride={title,author,series:seriesName,genre,publishedYear,coverUri:coverUri||undefined};
        const next={...localMetadataOverrides};
        for(const uri of targets)next[uri]=override;
        setLocalMetadataOverrides(next);
        setPersistedJSON(localMetadataOverridesKey,next)
          .then(()=>{
            setLocalBooks(old=>{
              const wanted=new Set(targets);
              const updated=old.map(b=>(b.uri?wanted.has(b.uri):false)?{...b,title,author,series:seriesName,genre,publishedYear,coverUri:coverUri||b.coverUri,needsReview:false,reviewReason:'',metadataSource:'manual' as const,identificationConfidence:'high' as const}:b);
              void setPersistedJSON(localCatalogKey,updated);
              return updated;
            });
            setEditing(null);setEditingUris([]);
          })
          .catch(e=>setError(e.message)).finally(()=>setBusy(false));
      }else setBusy(false);
    };
    const restoreScanned=async()=>{
      if(!localEdit||!targets.length||busy)return;
      setBusy(true);setError('');
      try{
        const next={...localMetadataOverrides};
        for(const uri of targets)delete next[uri];
        setLocalMetadataOverrides(next);
        await setPersistedJSON(localMetadataOverridesKey,next);
        setEditing(null);setEditingUris([]);
        await rescanLocalFolders(next);
      }catch(e){setError((e as Error).message);}
      finally{setBusy(false);}
    };
    return <Modal transparent animationType="slide" visible onRequestClose={()=>{if(!busy){setEditing(null);setEditingUris([])}}}>
      <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS==='ios'?'padding':undefined}>
        <View style={styles.modalBackdrop}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
          <View accessibilityViewIsModal accessibilityLabel={'Edit details for '+editing.title} style={[styles.modalCard,{backgroundColor:p.card,borderColor:p.line}]}>
            <Text style={[styles.playerEyebrow,{color:p.sage}]}>METADATA & COVER</Text>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Review details</Text>
            {targets.length>1?<Text style={[styles.meta,{color:p.muted}]}>Changes apply to all {targets.length} files in this grouped work.</Text>:null}
            {editing.reviewReason?<Text style={[styles.meta,{color:p.muted}]}>{editing.reviewReason}</Text>:null}
            <TextInput accessibilityLabel="Corrected title" value={editTitle} onChangeText={setEditTitle} placeholder="Title" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Author" value={editAuthor} onChangeText={setEditAuthor} placeholder="Author" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Series" value={editSeries} onChangeText={setEditSeries} placeholder="Series" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Genre" value={editGenre} onChangeText={setEditGenre} placeholder="Genre" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            {localEdit?<TextInput accessibilityLabel="Publication year" keyboardType="number-pad" maxLength={4} value={editYear} onChangeText={setEditYear} placeholder="Publication year" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>:null}
            {localEdit?<View style={styles.metadataCoverEditor}>
              <View style={styles.metadataCoverPreview}><Artwork title={editTitle||editing.title} format={editing.format} coverShape={editing.coverShape} coverUri={editCoverUri||editing.coverUri}/></View>
              <View style={{flex:1,gap:6}}><Text style={[styles.bookTitle,{color:p.ink}]}>Cover artwork</Text><Text style={[styles.meta,{color:p.muted}]}>Archivist normally finds companion cover files during scanning. Paste a local/content/HTTPS image URI only when you want a manual override.</Text></View>
            </View>:null}
            {localEdit?<TextInput accessibilityLabel="Cover image URI" autoCapitalize="none" autoCorrect={false} value={editCoverUri} onChangeText={setEditCoverUri} placeholder="Cover image URI (optional)" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>:null}
            {!localEdit?<Text style={[styles.meta,{color:p.muted}]}>Server cover art is refreshed from the source file or companion artwork during a server scan; this editor changes textual metadata only.</Text>:null}
            <Button label="Save details" disabled={busy||!editTitle.trim()} onPress={save}/>
            {localEdit?<Button label="Use scanned metadata & cover" tone="quiet" disabled={busy} onPress={()=>void restoreScanned()}/>:null}
            <Button label="Cancel" tone="quiet" disabled={busy} onPress={()=>{setEditing(null);setEditingUris([])}}/>
          </View>
        </ScrollView></View>
      </KeyboardAvoidingView>
    </Modal>;
  }

  const smartShelfFields:SmartShelfField[]=['source','format','author','series','genre','space','readingState','rating','favourite','available'];
  const ruleOperators:SmartShelfOperator[]=['equals','not-equals','contains','at-least','is-true','is-false'];
  function nextIn<T>(values:T[],value:T){const index=values.indexOf(value);return values[(index+1+values.length)%values.length];}
  function editSmartRule(path:number[],rule:SmartShelfRule){setSmartShelfRules(current=>replaceRuleNode(current,path,rule));}
  function SmartRuleGroupEditor({group,path=[]}:{group:SmartShelfRuleGroup;path?:number[]}){
    return <View style={[styles.ruleGroup,{borderColor:p.line,backgroundColor:path.length?p.raised:'transparent'}]}>
      <View style={styles.sectionHeader}><Text style={[styles.meta,{color:p.ink,fontWeight:'900'}]}>Match {group.mode==='all'?'ALL':'ANY'}</Text><Button label={group.mode==='all'?'ALL':'ANY'} tone="quiet" onPress={()=>setSmartShelfRules(current=>replaceRuleNode(current,path,{...group,mode:group.mode==='all'?'any':'all'}))}/></View>
      {group.children.map((child,index)=>{
        const childPath=[...path,index];
        if(child.kind==='group')return <View key={childPath.join('.')}><SmartRuleGroupEditor group={child} path={childPath}/><Button label="Remove group" tone="quiet" onPress={()=>setSmartShelfRules(current=>removeRuleNode(current,childPath))}/></View>;
        const boolOp=child.operator==='is-true'||child.operator==='is-false';
        return <View key={childPath.join('.')} style={[styles.ruleRow,{borderColor:p.line}]}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Change rule field from '+child.field} onPress={()=>editSmartRule(childPath,{...child,field:nextIn(smartShelfFields,child.field)})} style={[styles.ruleToken,{borderColor:p.line}]}><Text style={{color:p.ink,fontWeight:'800'}}>{child.field}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Change rule operator from '+child.operator} onPress={()=>editSmartRule(childPath,{...child,operator:nextIn(ruleOperators,child.operator)})} style={[styles.ruleToken,{borderColor:p.line}]}><Text style={{color:p.ink,fontWeight:'800'}}>{child.operator}</Text></Pressable>
          {!boolOp?<TextInput accessibilityLabel={'Rule value '+child.field} value={child.value} onChangeText={value=>editSmartRule(childPath,{...child,value})} placeholder="Value" placeholderTextColor={p.muted} style={[styles.ruleInput,{color:p.ink,borderColor:p.line}]}/>:null}
          <Pressable accessibilityRole="button" accessibilityLabel="Remove rule" onPress={()=>setSmartShelfRules(current=>removeRuleNode(current,childPath))} style={styles.ruleRemove}><UiIcon name="close" color={p.muted} size={16}/></Pressable>
        </View>;
      })}
      <View style={styles.toolRow}><Button label="Add rule" tone="quiet" onPress={()=>setSmartShelfRules(current=>addRuleAtPath(current,path))}/>{path.length<3?<Button label="Add group" tone="quiet" onPress={()=>setSmartShelfRules(current=>addGroupAtPath(current,path))}/>:null}</View>
    </View>;
  }

  function OrganisationPanel(){
    if(!organisationModal)return null;
    const close=()=>{setOrganisationModal(null);setOrganisationName('');setCollectionTarget(null);setRenameTarget(null)};
    return <Modal transparent animationType="slide" visible onRequestClose={close}>
      <View style={[styles.sheetBackdrop,foldLayout&&styles.sheetBackdropFold]}><ScrollView contentContainerStyle={styles.sheetScroll} keyboardShouldPersistTaps="handled">
        <View accessibilityViewIsModal style={[styles.actionSheet,foldLayout&&styles.actionSheetFold,{backgroundColor:p.card,borderColor:p.line}]}>
          <View style={[styles.sheetHandle,foldLayout&&styles.sheetHandleFold]}/>
          {organisationModal==='smart-shelf'?<>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Save Smart Shelf</Text>
            <Text style={[styles.meta,{color:p.muted}]}>Start with the filters you are using now, or build nested ALL / ANY rules for a shelf that updates itself.</Text>
            <TextInput accessibilityLabel="Smart Shelf name" value={organisationName} onChangeText={setOrganisationName} placeholder="Shelf name" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]}/>
            <View style={styles.toolRow}><Button label="Use current filters" tone="quiet" onPress={()=>setSmartShelfRules(legacyRules({source:sourceFilter,format:formatFilter,author:authorFilter,series:seriesFilter,genre:genreFilter,space,readingState:readingFilter,minimumRating:ratingFilter,favouriteOnly,availableOnly:availabilityFilter==='available'}))}/><Button label={smartShelfAdvanced?'Simple':'Advanced rules'} tone="quiet" onPress={()=>setSmartShelfAdvanced(value=>!value)}/></View>
            {smartShelfAdvanced?<SmartRuleGroupEditor group={smartShelfRules}/>:<Text style={[styles.meta,{color:p.muted}]}>{smartShelfRules.children.length?smartShelfRules.children.length+' rule'+(smartShelfRules.children.length===1?'':'s')+' configured.':'No advanced rules yet; current filters will be used.'}</Text>}
            <Button label="Save Smart Shelf" disabled={!organisationName.trim()} onPress={()=>void createSmartShelf()}/>
          </>:null}
          {organisationModal==='new-collection'?<>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>New collection</Text>
            <TextInput accessibilityLabel="Collection name" value={organisationName} onChangeText={setOrganisationName} placeholder="Collection name" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]}/>
            <Button label="Create collection" disabled={!organisationName.trim()} onPress={()=>void createCollection()}/>
          </>:null}
          {organisationModal==='add-to-collection'?<>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Add to collection</Text>
            {!collections.length?<Text style={[styles.meta,{color:p.muted}]}>Create your first collection.</Text>:collections.map(collection=><Button key={collection.id} label={collection.name} tone="quiet" onPress={()=>collectionTarget?void toggleWorkInCollection(collection,collectionTarget).then(close):void addSelectedToCollection(collection)}/>) }
            <Button label="New collection" tone="quiet" onPress={()=>{setOrganisationModal('new-collection');setOrganisationName('')}}/>
          </>:null}
          {organisationModal==='manage'?<>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Manage shelves & collections</Text>
            {renameTarget?<>
              <TextInput accessibilityLabel="New name" value={organisationName} onChangeText={setOrganisationName} placeholder="Name" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]}/>
              <Button label="Save name" disabled={!organisationName.trim()} onPress={()=>void applyRename()}/>
            </>:<>
              {smartShelves.map(item=><View key={item.id} style={[styles.manageRow,{borderColor:p.line}]}><Text numberOfLines={1} style={[styles.bookTitle,{color:p.ink,flex:1}]}>{item.name}</Text><Button label="Rename" tone="quiet" onPress={()=>beginRename('shelf',item.id,item.name)}/><Button label="Delete" tone="quiet" onPress={()=>void removeSmartShelf(item.id)}/></View>)}
              {collections.map(item=><View key={item.id} style={[styles.manageRow,{borderColor:p.line}]}><Text numberOfLines={1} style={[styles.bookTitle,{color:p.ink,flex:1}]}>{item.name}</Text><Button label="Rename" tone="quiet" onPress={()=>beginRename('collection',item.id,item.name)}/><Button label="Delete" tone="quiet" onPress={()=>void removeCollection(item.id)}/></View>)}
              {!smartShelves.length&&!collections.length?<Text style={[styles.meta,{color:p.muted}]}>Nothing to manage yet.</Text>:null}
            </>}
          </>:null}
          <Button label="Close" tone="quiet" onPress={close}/>
        </View>
      </ScrollView></View>
    </Modal>;
  }

  function ShelfManagePanel(){
    if(!shelfManageOpen)return null;
    const move=(index:number,direction:-1|1)=>{const target=index+direction;if(target<0||target>=shelfSections.length)return;const next=[...shelfSections];[next[index],next[target]]=[next[target],next[index]];void saveShelfSections(next)};
    const toggle=(id:ShelfSectionId)=>void saveShelfSections(shelfSections.map(item=>item.id===id?{...item,visible:!item.visible}:item));
    return <Modal transparent animationType="slide" visible onRequestClose={()=>setShelfManageOpen(false)}><View style={[styles.sheetBackdrop,foldLayout&&styles.sheetBackdropFold]}>
      <View accessibilityViewIsModal accessibilityLabel="Customise Shelf" style={[styles.actionSheet,foldLayout&&styles.actionSheetFold,{backgroundColor:p.card,borderColor:p.line}]}>
        <View style={[styles.sheetHandle,foldLayout&&styles.sheetHandleFold]}/><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Customise Shelf</Text>
        <Text style={[styles.meta,{color:p.muted}]}>Choose what appears and arrange it around the way you use your library.</Text>
        {shelfSections.map((item,index)=><View key={item.id} style={[styles.manageRow,{borderColor:p.line}]}>
          <Pressable accessibilityRole="switch" accessibilityState={{checked:item.visible}} accessibilityLabel={(item.visible?'Hide ':'Show ')+item.title} hitSlop={10} onPress={()=>toggle(item.id)} style={[styles.visibilityToggle,{backgroundColor:item.visible?p.sage:p.line}]}><View pointerEvents="none" style={[styles.visibilityThumb,{backgroundColor:p.ivory,transform:[{translateX:item.visible?16:0}]}]}/></Pressable>
          <Text style={[styles.bookTitle,{color:p.ink,flex:1}]}>{item.title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={'Move '+item.title+' up'} disabled={index===0} onPress={()=>move(index,-1)} style={styles.orderButton}><UiIcon name="chevronUp" color={index===0?p.muted:p.ink} size={17}/></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Move '+item.title+' down'} disabled={index===shelfSections.length-1} onPress={()=>move(index,1)} style={styles.orderButton}><UiIcon name="chevronDown" color={index===shelfSections.length-1?p.muted:p.ink} size={17}/></Pressable>
        </View>)}
        <Button label="Done" onPress={()=>setShelfManageOpen(false)}/>
      </View>
    </View></Modal>;
  }

  const avatarColours=['#47736F','#2F8B86','#6B7698','#8B6F47','#7D586E','#536A7D'];
  const avatarInitials=(profileAvatar.initials||String(profileStats?.name||'Reader').trim().split(/\s+/).map(part=>part[0]||'').join('').slice(0,2)||'R').toUpperCase();

  async function saveProfileAvatar(next:ProfileAvatarConfig){
    const cleaned={initials:String(next.initials||'').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase(),color:avatarColours.includes(next.color)?next.color:'#47736F',photoUri:typeof next.photoUri==='string'&&next.photoUri.trim()?next.photoUri.trim():undefined};
    setProfileAvatar(cleaned);
    try{await setPersistedJSON(profileAvatarKey,cleaned);}catch(e){setError((e as Error).message);}
  }

  function openProfileMenu(){
    setProfileMenuMounted(true);setProfileMenuOpen(true);profileMenuAnim.stopAnimation();
    if(reduceMotion){profileMenuAnim.setValue(1);return;}
    profileMenuAnim.setValue(0);
    Animated.spring(profileMenuAnim,{toValue:1,damping:20,stiffness:220,mass:.68,useNativeDriver:true}).start();
  }

  function closeProfileMenu(after?:()=>void){
    setProfileMenuOpen(false);profileMenuAnim.stopAnimation();
    if(reduceMotion){profileMenuAnim.setValue(0);setProfileMenuMounted(false);after?.();return;}
    Animated.timing(profileMenuAnim,{toValue:0,duration:180,useNativeDriver:true}).start(()=>{setProfileMenuMounted(false);after?.();});
  }

  function ProfileAvatarButton({size=42}:{size?:number}={}){
    const avatarColor=profileAvatar.color||'#47736F';
    const ringSize=size+10;
    const level=profileProgression?.overall.level||1;
    const levelProgress=profileProgression?.overall.progress||0;
    const ringItems:ChartItem[]=[
      {label:'Level progress',count:Math.max(.001,levelProgress),color:p.gold},
      {label:'Remaining',count:Math.max(.001,1-levelProgress),color:darkMode?'#2A2A2A':'#D8CDBA'},
    ];
    return <View style={[styles.profileAvatarButtonWrap,{width:ringSize,height:ringSize}]}>
      {profileMenuOpen?<Animated.View pointerEvents="none" style={[styles.profileAvatarHalo,{borderRadius:ringSize/2,backgroundColor:interfaceHaloColor||avatarColor,opacity:interfacePulse.interpolate({inputRange:[0,1],outputRange:[darkMode?.36:.28,0]}),transform:[{scale:interfacePulse.interpolate({inputRange:[0,1],outputRange:[1,1.38]})}]}]}/>:null}
      <View pointerEvents="none" style={styles.profileAvatarLevelRing}><DataRing size={ringSize} items={ringItems} ink={p.ink} muted={p.muted} track={p.line} thickness={3} opacity={1}/></View>
      <Pressable accessibilityRole="button" accessibilityLabel={profileMenuOpen?'Close profile menu':'Open profile menu'} accessibilityState={{expanded:profileMenuOpen}} onPress={profileMenuOpen?()=>closeProfileMenu():openProfileMenu} style={[styles.profileAvatarButton,{width:size,height:size,borderRadius:size/2,backgroundColor:avatarColor,overflow:'hidden'}]}>
        {profileAvatar.photoUri?<Image source={{uri:profileAvatar.photoUri}} resizeMode="cover" style={{width:size,height:size}}/>:<Text maxFontSizeMultiplier={1.1} style={[styles.profileAvatarInitials,{fontSize:Math.max(13,size*.36)}]}>{avatarInitials}</Text>}
      </Pressable>
      <View pointerEvents="none" style={[styles.profileAvatarLevelBadge,{backgroundColor:darkMode?'#0B1725':'#FFF8E9',borderColor:p.gold}]}>
        <Text style={[styles.profileAvatarLevelText,{color:p.gold}]}>{level}</Text>
      </View>
    </View>;
  }

  function PageHeader({title,subtitle}:{title:string;subtitle:string}){
    return <View style={styles.standardPageHeader}>
      <View style={styles.standardPageHeaderCopy}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.standardPageTitle,accessibilityPrefs.largeText&&styles.standardPageTitleLarge,{color:p.ink}]}>{title}</Text>
        <Text maxFontSizeMultiplier={1.35} style={[styles.standardPageSubtitle,accessibilityPrefs.largeText&&styles.standardPageSubtitleLarge,{color:p.muted}]}>{subtitle}</Text>
      </View>
    </View>;
  }

  function PageToolbar({children,align='end'}:{children:React.ReactNode;align?:'start'|'end'|'center'}){
    return <View style={[styles.pageHeaderToolbar,align==='start'&&styles.pageHeaderToolbarStart,align==='center'&&styles.pageHeaderToolbarCenter]}>{children}</View>;
  }

  function ProfileMenu(){
    const unlocked=profileAchievements.filter(item=>item.unlocked).length;
    const menuItems=[
      {id:'profile' as Tab,label:'Profile',copy:'Identity, avatar and reading summary',icon:'bookmark' as UiIconName,tone:'#54C6B8'},
      {id:'rewards' as Tab,label:'Rewards',copy:'Milestones and achievements',icon:'target' as UiIconName,tone:'#E3BC67'},
      {id:'settings' as Tab,label:'Settings',copy:'App, library and server',icon:'settings' as UiIconName,tone:'#7AA7E8'},
    ];
    return <Modal transparent visible={profileMenuMounted} animationType="none" onRequestClose={()=>closeProfileMenu()}>
      <View style={styles.profileMenuLayer}>
        <Animated.View pointerEvents="box-none" style={[styles.profileMenuBackdropLayer,{opacity:profileMenuAnim}]}><Pressable accessibilityRole="button" accessibilityLabel="Close profile menu" onPress={()=>closeProfileMenu()} style={styles.profileMenuBackdrop}/></Animated.View>
        <Animated.View style={[styles.profileMenu,{backgroundColor:p.raised,borderColor:p.line,opacity:profileMenuAnim,transform:[{translateX:profileMenuAnim.interpolate({inputRange:[0,1],outputRange:[12,0]})},{translateY:profileMenuAnim.interpolate({inputRange:[0,1],outputRange:[-10,0]})},{scale:profileMenuAnim.interpolate({inputRange:[0,1],outputRange:[.92,1]})}]}]}>
          <View style={styles.profileMenuIdentity}>
            <View style={[styles.profileMenuAvatar,{backgroundColor:profileAvatar.color||'#47736F',overflow:'hidden'}]}>{profileAvatar.photoUri?<Image source={{uri:profileAvatar.photoUri}} resizeMode="cover" style={styles.profileMenuAvatarImage}/>:<Text style={styles.profileMenuAvatarText}>{avatarInitials}</Text>}</View>
            <View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={[styles.profileMenuName,{color:p.ink}]}>{profileStats?.name||'Reader'}</Text><Text style={[styles.profileMenuMeta,{color:p.muted}]}>Level {profileProgression?.overall.level||1} · {profileProgression?.overall.title||'Reader'} · {unlocked} unlocked</Text></View>
          </View>
          {menuItems.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>closeProfileMenu(()=>setActiveTab(item.id))} style={({pressed})=>[styles.profileMenuItem,{borderTopColor:p.line,opacity:pressed?0.72:1}]}>
            <View style={[styles.profileMenuIcon,{backgroundColor:item.tone+'20',borderColor:item.tone+'55'}]}><UiIcon name={item.icon} color={item.tone} size={18}/></View>
            <View style={{flex:1,minWidth:0}}><Text style={[styles.profileMenuItemTitle,{color:p.ink}]}>{item.label}</Text><Text style={[styles.profileMenuItemCopy,{color:p.muted}]}>{item.copy}</Text></View>
            <View style={{transform:[{rotate:'-90deg'}]}}><UiIcon name="chevronDown" color={item.tone} size={15}/></View>
          </Pressable>)}
        </Animated.View>
      </View>
    </Modal>;
  }

  function Shelf(){
    // Shelf is deliberately personal/content-led. Folder and source organisation lives in Library.
    const base:UnifiedWork[]=allUnifiedWorks;
    const continuing=base.filter(work=>work.readingState==='in-progress').slice(0,12);
    const favourites=base.filter(work=>work.favourite).slice(0,12);
    const recommendationLimit=foldLayout?5:3;
    const recommendations=shelfRecommendations(base,recommendationLimit);
    const recommendationRows=[
      {id:'books',title:'Books for you',result:recommendations.books,icon:'bookOpen' as UiIconName},
      {id:'comics',title:'Comics for you',result:recommendations.comics,icon:'layers' as UiIconName},
      {id:'audio',title:'Audiobooks for you',result:recommendations.audio,icon:'play' as UiIconName},
    ];
    const primaryContinue=continuing[0];
    const hour=new Date().getHours();
    const shelfGreeting=hour<12?'Good morning.':hour<18?'Good afternoon.':'Good evening.';
    const primaryResumeLabel=(()=>{
      if(!primaryContinue?.localWork)return primaryContinue?'Ready when you are.':'';
      if(primaryContinue.format==='Audio'){
        const seconds=localWorkProgress[primaryContinue.localWork.key]?.seconds||0;
        return seconds>0?'Resume at '+formatTime(seconds):'Continue listening';
      }
      const pages=primaryContinue.localWork.tracks
        .map(track=>track.uri?(localReadingProgress[track.uri]||0):0)
        .filter(value=>value>0);
      return pages.length?'Resume at page '+(Math.max(...pages)+1):'Continue reading';
    })();

    const seriesGroups=[...new Set(base.map(work=>work.series).filter(Boolean))]
      .map(name=>{
        const works=base.filter(work=>work.series===name);
        const relevance=works.reduce((score,work)=>score+(work.readingState==='in-progress'?5:0)+(work.favourite?3:0)+(work.readingState==='not-started'?1:0),0);
        return {name,total:works.length,works:works.slice(0,4),relevance};
      })
      .filter(group=>group.total>1)
      .sort((a,b)=>b.relevance-a.relevance||b.total-a.total||a.name.localeCompare(b.name))
      .slice(0,8);

    const localReview=localBooks.filter(book=>book.needsReview).length;
    const serverReview=session?(serverSummary?.needsReview||0):0;
    const reviewCount=localReview+serverReview;
    const serverPathFor=(work:UnifiedWork)=>work.source==='server'&&work.serverWork&&session&&(!work.server||work.server===session.server)?'/api/works/'+work.serverWork.id+'/cover':undefined;
    const workArtwork=(work:UnifiedWork)=><Artwork title={work.title} format={work.format} coverShape={work.format==='Audio'?'square':'portrait'} coverUri={work.coverUri} serverPath={serverPathFor(work)}/>;
    const renderWorks=(works:UnifiedWork[])=>works.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.curatedRow}>{works.map(work=><View key={work.key} style={styles.curatedCardWrap}><UnifiedWorkCard work={work}/></View>)}</ScrollView>:null;

    const openLibraryBrowse=({family='',source='all'}:{family?:LibraryFormatFamily;source?:LibrarySource})=>{
      clearLibraryFilters();
      setSourceFilter(source);
      setLibraryFormatFamily(family);
      setLibrarySort(family==='audio'?'progress':'title');
      setReviewOnly(false);
      setActiveTab('library');
    };
    const familyCount=(family:LibraryFormatFamily)=>base.filter(work=>{
      const value=String(work.format||'').trim().toLowerCase();
      if(family==='books')return value==='epub'||value==='ebook'||value==='book';
      if(family==='comics')return value==='comic'||value==='cbz'||value==='cbr'||value==='cbt';
      if(family==='audio')return value==='audio'||value==='audiobook';
      if(family==='pdf')return value==='pdf';
      return true;
    }).length;
    const browseContent=[
      {label:'Books',family:'books' as LibraryFormatFamily,icon:'bookOpen' as UiIconName,count:familyCount('books')},
      {label:'Comics',family:'comics' as LibraryFormatFamily,icon:'layers' as UiIconName,count:familyCount('comics')},
      {label:'Audiobooks',family:'audio' as LibraryFormatFamily,icon:'play' as UiIconName,count:familyCount('audio')},
      {label:'PDFs',family:'pdf' as LibraryFormatFamily,icon:'library' as UiIconName,count:familyCount('pdf')},
    ];

    const continueHero=primaryContinue?<Pressable
      accessibilityRole="button"
      accessibilityLabel={'Continue '+primaryContinue.title}
      onPress={()=>openUnifiedWork(primaryContinue)}
      style={({pressed})=>[styles.shelfHero,foldLayout&&styles.shelfHeroFold,width>=900&&styles.shelfHeroWide,{borderTopColor:p.line,borderBottomColor:p.line},pressed&&styles.cardPressed]}>
      <View style={[styles.shelfHeroArtwork,foldLayout&&styles.shelfHeroArtworkFold,width>=900&&styles.shelfHeroArtworkWide]}>{workArtwork(primaryContinue)}</View>
      <View style={styles.shelfHeroCopy}>
        <Text style={[styles.shelfHeroEyebrow,{color:p.sage}]}>{primaryContinue.format==='Audio'?'CONTINUE LISTENING':'CONTINUE READING'}</Text>
        <Text maxFontSizeMultiplier={1.12} numberOfLines={3} style={[styles.shelfHeroTitle,{color:p.ink},layoutTier==='compact'&&styles.shelfHeroTitleCompact,layoutTier==='fold'&&styles.shelfHeroTitleFold]}>{primaryContinue.title}</Text>
        <Text numberOfLines={1} style={[styles.shelfHeroAuthor,{color:p.muted}]}>{primaryContinue.author||'Unknown author'}{primaryContinue.series?' · '+primaryContinue.series:''}</Text>
        {primaryResumeLabel?<Text numberOfLines={1} style={[styles.shelfHeroResume,{color:p.sage}]}>{primaryResumeLabel}</Text>:null}
        <View style={styles.shelfHeroFooter}>
          <Text style={[styles.shelfHeroMeta,{color:p.muted}]}>{primaryContinue.format} · {sourceLabel(primaryContinue.source)}</Text>
          <View style={[styles.shelfHeroAction,{backgroundColor:p.sage}]}>
            {primaryContinue.format==='Audio'?<UiIcon name="play" color="#FFFFFF" size={18}/>:<Text style={styles.shelfHeroActionText}>Open</Text>}
          </View>
        </View>
      </View>
    </Pressable>:null;

    const section=(item:ShelfSectionPref)=>{
      if(!item.visible)return null;
      if(item.id==='continue'&&!continuing.length)return null;
      if(item.id==='favourites'&&!favourites.length)return null;
      if(item.id==='smart'&&!smartShelfRows.length)return null;
      if(item.id==='collections'&&!collectionRows.length)return null;
      if(item.id==='series'&&!seriesGroups.length)return null;
      return <View key={item.id} style={styles.shelfSection}>
        <View style={styles.sectionHeader}>
          <View style={{flex:1,minWidth:0}}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{item.title}</Text>
            {item.id==='smart'?<Text style={[styles.shelfSectionHint,{color:p.muted}]}>Automatic shelves that update from your rules.</Text>:null}
          </View>
        </View>

        {item.id==='continue'?<>{continueHero}{continuing.length>1?renderWorks(continuing.slice(1)):null}</>:null}
        {item.id==='favourites'?renderWorks(favourites):null}

        {item.id==='smart'?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.smartShelfRow}>
          {smartShelfRows.map(({shelf,works})=><Pressable
            key={shelf.id}
            accessibilityRole="button"
            accessibilityLabel={shelf.name+', '+works.length+(works.length===12?'+':'')+' matches'}
            onPress={()=>openSmartShelf(shelf)}
            onLongPress={()=>beginRename('shelf',shelf.id,shelf.name)}
            style={({pressed})=>[styles.smartShelfTile,pressed&&styles.cardPressed]}>
            <View style={styles.smartShelfPreview}>
              {works.slice(0,4).map((work,index)=><View
                key={work.key}
                style={[styles.smartShelfCover,{left:index*30,zIndex:10-index,transform:[{rotate:index===0?'-4deg':index===3?'4deg':'0deg'}]}]}>
                {workArtwork(work)}
              </View>)}
              {!works.length?<View style={[styles.smartShelfEmpty,{borderColor:p.line}]}>
                <View style={[styles.smartShelfEmptySpine,{backgroundColor:p.sage}]}/>
                <View style={[styles.smartShelfEmptySpine,{backgroundColor:p.line,height:50}]}/>
                <View style={[styles.smartShelfEmptySpine,{backgroundColor:p.line,height:42}]}/>
              </View>:null}
              <View style={[styles.smartShelfBase,{backgroundColor:p.ink}]}/>
            </View>
            <Text numberOfLines={2} style={[styles.smartShelfName,{color:p.ink}]}>{shelf.name}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{works.length}{works.length===12?'+':''} matches</Text>
          </Pressable>)}
        </ScrollView>:null}

        {item.id==='collections'?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionRow}>
          {collectionRows.map(({collection,works})=><Pressable
            key={collection.id}
            accessibilityRole="button"
            onPress={()=>openCollection(collection)}
            onLongPress={()=>beginRename('collection',collection.id,collection.name)}
            style={({pressed})=>[styles.collectionTile,pressed&&styles.cardPressed]}>
            <View style={styles.collectionCollage}>
              {works.slice(0,3).map((work,index)=><View key={work.key} style={[styles.collectionMiniCover,{left:index*24,top:index===1?2:index===2?5:7,zIndex:3-index,transform:[{rotate:index===0?'-5deg':index===2?'5deg':'0deg'}]}]}>{workArtwork(work)}</View>)}
              {!works.length?<View style={[styles.collectionEmptyMark,{backgroundColor:p.card}]}><UiIcon name="library" color={p.muted} size={24}/></View>:null}
            </View>
            <Text numberOfLines={2} style={[styles.collectionName,{color:p.ink}]}>{collection.name}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{works.length} work{works.length===1?'':'s'}</Text>
          </Pressable>)}
        </ScrollView>:null}

        {item.id==='series'?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seriesRow}>
          {seriesGroups.map(({name,total,works})=><Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={name+', '+total+' work'+(total===1?'':'s')}
            onPress={()=>{clearLibraryFilters();setSourceFilter('all');setSeriesFilter(name);setActiveTab('library')}}
            style={({pressed})=>[styles.seriesTile,pressed&&styles.cardPressed]}>
            <View style={styles.seriesCoverStack}>
              {works.slice(0,3).map((work,index)=><View key={work.key} style={[styles.seriesCover,{left:index*34,top:index===1?3:index===2?6:0,zIndex:10-index}]}>{workArtwork(work)}</View>)}
              {!works.length?<View style={[styles.seriesEmpty,{borderColor:p.line}]}/>:null}
            </View>
            <Text numberOfLines={2} style={[styles.seriesName,{color:p.ink}]}>{name}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{total} work{total===1?'':'s'}</Text>
          </Pressable>)}
        </ScrollView>:null}
      </View>;
    };

    const hasConfiguredSource=localFolders.length>0||!!session||!!recoverableSession;
    const showStandaloneEmpty=!base.length&&!shelfLoading&&(onboardingDone||hasConfiguredSource);
    const emptyCopy=recoverableSession&&!session
      ? 'Your saved Archivist Server is currently offline. Add a device folder or retry the server from Settings.'
      : hasConfiguredSource
        ? 'Your connected sources do not contain any works yet. Add or scan a folder, or check your Archivist Server.'
        : 'Add media from this device or connect an Archivist Server to begin.';

    return <ScrollView
      ref={shelfScrollRef}
      onScroll={e=>{shelfScrollOffset.current=e.nativeEvent.contentOffset.y}}
      scrollEventThrottle={120}
      onContentSizeChange={()=>{if(shelfScrollOffset.current>0)shelfScrollRef.current?.scrollTo({y:shelfScrollOffset.current,animated:false})}}
      contentContainerStyle={[styles.shelfContent,width>=600&&styles.shelfContentFold,width>=940&&styles.shelfContentWide]}>
      <PageHeader title="Shelf" subtitle={shelfGreeting+' Pick up where you left off.'}/>
      <PageToolbar>
        <Pressable accessibilityRole="button" accessibilityLabel="Customise Shelf" onPress={()=>setShelfManageOpen(true)} style={styles.headerAction}><Text style={{color:p.muted,fontWeight:'600'}}>Arrange</Text></Pressable>
      </PageToolbar>

      <OnboardingGuide/>

      {shelfSections.find(item=>item.id==='continue')?section(shelfSections.find(item=>item.id==='continue') as ShelfSectionPref):null}

      {recommendationRows.map(row=>row.result.works.length?<View key={row.id} style={styles.shelfRecommendationSection}>
        <View style={styles.shelfRecommendationHeader}>
          <View style={[styles.shelfRecommendationIcon,{backgroundColor:p.card}]}><UiIcon name={row.icon} color={p.gold} size={17}/></View>
          <View style={{flex:1,minWidth:0}}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{row.title}</Text>
            <Text numberOfLines={1} style={[styles.shelfSectionHint,{color:p.muted}]}>{row.result.personalised?'Based on your reading, ratings and favourites.':'From your collection while Archivist learns your taste.'}</Text>
          </View>
        </View>
        {renderWorks(row.result.works)}
      </View>:null)}

      {reviewCount>0?<Pressable accessibilityRole="button" accessibilityLabel={reviewCount+' metadata item'+(reviewCount===1?'':'s')+' need review'} onPress={()=>{clearLibraryFilters();setReviewOnly(true);setActiveTab('library')}} style={[styles.reviewBanner,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <View style={styles.reviewBannerCopy}>
          <Text maxFontSizeMultiplier={1.15} style={[styles.reviewBannerTitle,{color:p.ink}]}>Metadata review</Text>
          <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={[styles.reviewBannerMeta,{color:p.muted}]}>{reviewCount} item{reviewCount===1?'':'s'} need{reviewCount===1?'s':''} a quick check</Text>
        </View>
        <Text maxFontSizeMultiplier={1.15} style={[styles.reviewBannerAction,{color:p.sage}]}>Review</Text>
      </Pressable>:null}

      {localScanning&&scanProgress?<View style={[styles.scanBanner,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <ActivityIndicator accessibilityLabel="Scanning local library" color={p.sage}/>
        <View style={{flex:1}}><Text style={{color:p.ink,fontWeight:'600'}}>Scanning {scanProgress.currentFolder||'library'}…</Text><Text style={{color:p.muted}}>{scanProgress.entriesVisited} checked · {scanProgress.found} found</Text></View>
      </View>:null}

      {showStandaloneEmpty?<View style={styles.designedEmpty}>
        <ArchivistLogo size={46}/>
        <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Your Shelf is waiting</Text>
        <Text style={[styles.meta,{color:p.muted,textAlign:'center'}]}>{emptyCopy}</Text>
        {!localFolders.length?<Button label="Add a folder" onPress={()=>void addLocalFolder()}/>:null}
        {!session&&!recoverableSession&&!shelfServerPromptHidden?<Button label="Connect to Archivist Server" tone="quiet" onPress={connectServerFromShelf}/>:null}
      </View>:null}

      {shelfLoading?<View style={styles.skeletonRow}>{[0,1,2,3].map(i=><View key={i} style={[styles.skeletonCard,{backgroundColor:p.card}]}/>)}</View>:null}
      {shelfSections.filter(item=>item.id!=='continue').map(section)}

      <View style={[styles.shelfBrowseBand,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <View>
          <Text style={[styles.shelfBrowseLabel,{color:p.muted}]}>BROWSE LIBRARY</Text>
          <Text style={[styles.shelfBrowseCopy,{color:p.muted}]}>Jump into the full catalogue by content type.</Text>
        </View>
        <View style={styles.shelfBrowseShortcutGrid}>
          {browseContent.map(item=><Pressable key={item.label} accessibilityRole="button" accessibilityLabel={'Browse '+item.label+' in Library'} onPress={()=>openLibraryBrowse({family:item.family})} style={({pressed})=>[styles.shelfBrowseShortcut,{borderColor:p.line,opacity:pressed?0.68:1}]}>
            <View style={[styles.shelfBrowseShortcutIcon,{backgroundColor:p.card}]}><UiIcon name={item.icon} color={p.sage} size={18}/></View>
            <View style={{flex:1,minWidth:0}}><Text style={[styles.shelfBrowseShortcutTitle,{color:p.ink}]}>{item.label}</Text><Text style={[styles.shelfBrowseShortcutMeta,{color:p.muted}]}>{item.count} work{item.count===1?'':'s'}</Text></View>
            <View style={{transform:[{rotate:'-90deg'}]}}><UiIcon name="chevronDown" color={p.muted} size={15}/></View>
          </Pressable>)}
        </View>

        {session?<View style={styles.shelfStorageShortcuts}>
          <Text style={[styles.shelfBrowseLabel,{color:p.muted}]}>STORAGE</Text>
          <View style={styles.shelfStorageShortcutRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Browse content on this device" onPress={()=>openLibraryBrowse({source:'local'})} style={({pressed})=>[styles.shelfStorageShortcut,{borderColor:p.line,opacity:pressed?0.68:1}]}>
              <View style={[styles.workSourceDot,{backgroundColor:p.sage}]}/><Text style={[styles.shelfStorageShortcutText,{color:p.ink}]}>On this device</Text><Text style={[styles.shelfStorageShortcutCount,{color:p.muted}]}>{sourceCounts.local}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Browse content on Archivist Server" onPress={()=>openLibraryBrowse({source:'server'})} style={({pressed})=>[styles.shelfStorageShortcut,{borderColor:p.line,opacity:pressed?0.68:1}]}>
              <View style={[styles.workSourceDot,{backgroundColor:p.gold}]}/><Text style={[styles.shelfStorageShortcutText,{color:p.ink}]}>On Archivist Server</Text><Text style={[styles.shelfStorageShortcutCount,{color:p.muted}]}>{sourceCounts.server}</Text>
            </Pressable>
          </View>
        </View>:null}
      </View>

      <View style={[styles.shelfUtilityRow,{borderTopColor:p.line}]}>
        <Pressable accessibilityRole="button" onPress={()=>openLibraryBrowse({})} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>Browse all Library</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>{setOrganisationName('');setSmartShelfRules(emptySmartShelfRules());setSmartShelfAdvanced(false);setOrganisationModal('smart-shelf')}} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>New Smart Shelf</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>setOrganisationModal('manage')} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>Manage collections</Text></Pressable>
      </View>

      <WorkActionSheet/><OrganisationPanel/><ShelfManagePanel/><MetadataEditorPanel/>
    </ScrollView>;
  }

  function Library(){
    const wide=width>=600;
    const columns=libraryView==='list'?1:(width>=1180?6:width>=940?5:width>=600?4:2);
    const filtersActive=[space,formatFilter,libraryFormatFamily,authorFilter,seriesFilter,genreFilter,readingFilter,ratingFilter?String(ratingFilter):'',favouriteOnly?'fav':'',unknownAuthorOnly?'unknown':'',availabilityFilter!=='all'?availabilityFilter:'',collectionFilter,metadataGapFilter].filter(Boolean).length;
    const formatOptions=[...new Set(allUnifiedWorks.map(work=>work.format).filter(Boolean))].sort();
    const selectedLocationLabel=sourceFilter==='downloaded'?'Offline downloads'
      : libraryFolderExact&&space?space
      : sourceFilter==='local'?'On this device'
      : sourceFilter==='server'?'On Archivist Server'
      : space||'All Library';
    const authorOptions:string[]=Array.from(new Set<string>(allUnifiedWorks.map((work:UnifiedWork)=>work.author).filter((value:string)=>!!value))).sort().slice(0,20);
    const seriesOptions:string[]=Array.from(new Set<string>(allUnifiedWorks.map((work:UnifiedWork)=>work.series).filter((value:string)=>!!value))).sort().slice(0,20);
    const genreOptions:string[]=Array.from(new Set<string>(allUnifiedWorks.map((work:UnifiedWork)=>work.genre).filter((value:string)=>!!value))).sort().slice(0,20);
    const favouriteSelected=()=>{for(const work of selectedWorks){if(work.localWork)void saveLocalPreference(work.localWork,{...(localPreferences[work.localWork.key]||{rating:work.rating,favourite:work.favourite}),favourite:true});else if(work.serverWork)void saveServerPreference(work.serverWork,{...(serverPreferences[work.serverWork.id]||{rating:work.rating,favourite:work.favourite,state:work.readingState}),favourite:true});}setSelectedWorkKeys([])};
    const maintenanceMode=reviewOnly||!!metadataGapFilter;
    const maintenanceTitle=reviewOnly?'Metadata review':metadataGapFilter==='author'?'Missing authors':metadataGapFilter==='series'?'Missing series':metadataGapFilter==='genre'?'Missing genres':'Missing device covers';
    const MaintenanceList=()=>maintenanceMode?<View style={styles.reviewQueue}><View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{maintenanceTitle}</Text><Text style={[styles.meta,{color:p.muted}]}>{visibleBooks.length} file{visibleBooks.length===1?'':'s'} in this maintenance view</Text></View><Button label="Done" tone="quiet" onPress={()=>{setReviewOnly(false);setMetadataGapFilter('')}}/></View>{visibleBooks.map(item=><RawAssetCard key={(item.source||'local')+'-'+item.id+'-'+(item.uri||'')} item={item}/>) }{!visibleBooks.length?<Text style={[styles.empty,{color:p.muted}]}>Nothing needs attention in this view.</Text>:null}{serverBooksHasMore?<Text style={[styles.meta,{color:p.muted}]}>Showing the first 200 matching server files. Refine the source, folder or search to narrow the maintenance set.</Text>:null}</View>:null;
    const main=<View style={[styles.libraryMain,(layoutTier==='fold'||wide)&&styles.libraryMainFold,wide&&styles.libraryMainWide]}>
      <View style={styles.libraryCatalogueHeader}>
        <PageHeader title="Library" subtitle="Every book. In its place."/>
        <View style={styles.libraryHeaderSummary}>
          <Text style={[styles.pageHeaderMeta,{color:p.muted}]}>{maintenanceMode?visibleBooks.length:sortedUnifiedWorks.length} {maintenanceMode?'file':'work'}{(maintenanceMode?visibleBooks.length:sortedUnifiedWorks.length)===1?'':'s'}{filtersActive?' · '+filtersActive+' filter'+(filtersActive===1?'':'s')+' active':''}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Manage Library scanning metadata and organisation" onPress={()=>setLibraryManageOpen(true)} style={styles.libraryManageAction}>
            <UiIcon name="more" color={p.sage} size={17}/><Text style={[styles.libraryManageActionText,{color:p.sage}]}>Manage</Text>
          </Pressable>
        </View>
      </View>
      {!wide?<Pressable accessibilityRole="button" accessibilityLabel={'Sources and folders, '+selectedLocationLabel} onPress={()=>setLibrarySourcesOpen(true)} style={[styles.libraryMobileSourceButton,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <View style={[styles.libraryTreeIcon,{backgroundColor:p.card}]}><UiIcon name="shelf" color={p.sage} size={17}/></View>
        <View style={{flex:1,minWidth:0}}><Text style={[styles.libraryMobileSourceKicker,{color:p.muted}]}>SOURCES & FOLDERS</Text><Text numberOfLines={1} style={[styles.libraryMobileSourceLabel,{color:p.ink}]}>{selectedLocationLabel}</Text></View>
        <View style={{transform:[{rotate:'-90deg'}]}}><UiIcon name="chevronDown" color={p.muted} size={16}/></View>
      </Pressable>:null}
      {selectedWorkKeys.length?<View style={[styles.librarySelectionBar,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <Text style={[styles.bookTitle,{color:p.ink,flex:1}]}>{selectedWorkKeys.length} selected</Text>
        <Pressable accessibilityRole="button" onPress={()=>setOrganisationModal('add-to-collection')} style={styles.librarySelectionAction}><Text style={{color:p.ink,fontWeight:'600'}}>Collection</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={favouriteSelected} style={styles.librarySelectionAction}><Text style={{color:p.ink,fontWeight:'600'}}>Favourite</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>setSelectedWorkKeys([])} style={styles.librarySelectionAction}><Text style={{color:p.sage,fontWeight:'700'}}>Done</Text></Pressable>
      </View>:<>
        <View style={styles.librarySearchRow}>
          <View style={[styles.librarySearchShell,{backgroundColor:p.card}]}>
            <UiIcon name="search" color={p.muted} size={19}/>
            <TextInput maxFontSizeMultiplier={1.15} accessibilityLabel="Search your library" value={query} onChangeText={setQuery} placeholder="Search books, authors, series or genres" placeholderTextColor={p.muted} style={[styles.librarySearch,{color:p.ink}]}/>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={'Filters'+(filtersActive?', '+filtersActive+' active':'')} onPress={()=>setLibraryFiltersOpen(true)} style={[styles.libraryUtilityButton,{backgroundColor:filtersActive?p.card:'transparent'}]}>
            <UiIcon name="filter" color={filtersActive?p.sage:p.muted} size={21}/>
            {filtersActive?<View style={[styles.libraryFilterCount,{backgroundColor:p.sage}]}><Text style={styles.libraryFilterCountText}>{filtersActive}</Text></View>:null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={libraryView==='grid'?'Switch to list':'Switch to grid'} onPress={()=>setLibraryView(libraryView==='grid'?'list':'grid')} style={styles.libraryUtilityButton}>
            <UiIcon name={libraryView==='grid'?'list':'grid'} color={p.muted} size={21}/>
          </Pressable>
        </View>
        {formatOptions.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryFormatTabs}>
          <Pressable accessibilityRole="button" accessibilityState={{selected:!formatFilter&&!libraryFormatFamily}} onPress={()=>{setFormatFilter('');setLibraryFormatFamily('')}} style={styles.libraryFormatTab}>
            <Text maxFontSizeMultiplier={1.15} style={[styles.libraryFormatText,{color:!formatFilter&&!libraryFormatFamily?p.ink:p.muted,fontWeight:!formatFilter&&!libraryFormatFamily?'700':'500'}]}>All</Text>
            <View pointerEvents="none" style={[styles.libraryFormatMarker,{backgroundColor:p.sage,opacity:!formatFilter&&!libraryFormatFamily?1:0}]}/>
          </Pressable>
          {formatOptions.map(format=><Pressable key={format} accessibilityRole="button" accessibilityState={{selected:!libraryFormatFamily&&formatFilter===format}} onPress={()=>{setLibraryFormatFamily('');setFormatFilter(formatFilter===format?'':format)}} style={styles.libraryFormatTab}>
            <Text maxFontSizeMultiplier={1.15} style={[styles.libraryFormatText,{color:formatFilter===format?p.ink:p.muted,fontWeight:formatFilter===format?'700':'500'}]}>{format}</Text>
            <View pointerEvents="none" style={[styles.libraryFormatMarker,{backgroundColor:p.sage,opacity:formatFilter===format?1:0}]}/>
          </Pressable>)}
        </ScrollView>:null}
      </>}
      <MaintenanceList/>
      {!maintenanceMode?<FlatList
        ref={libraryListRef}
        key={'unified-'+libraryView+'-'+columns}
        data={sortedUnifiedWorks}
        keyExtractor={work=>work.key}
        numColumns={columns}
        initialNumToRender={18}
        maxToRenderPerBatch={18}
        windowSize={7}
        contentContainerStyle={libraryView==='grid'?styles.unifiedGrid:styles.unifiedList}
        columnWrapperStyle={columns>1?styles.unifiedGridRow:undefined}
        renderItem={({item})=><UnifiedWorkCard work={item} list={libraryView==='list'}/>} 
        ListEmptyComponent={!shelfLoading?<View style={styles.designedEmpty}><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>No matching works</Text><Text style={[styles.meta,{color:p.muted,textAlign:'center'}]}>Clear filters or choose another source or Space.</Text><Button label="Clear filters" tone="quiet" onPress={clearLibraryFilters}/></View>:null}
        onScroll={e=>{libraryScrollOffset.current=e.nativeEvent.contentOffset.y}}
        scrollEventThrottle={120}
        onContentSizeChange={()=>{if(libraryScrollOffset.current>0)libraryListRef.current?.scrollToOffset?.({offset:libraryScrollOffset.current,animated:false})}}
      />:null}
      <WorkActionSheet/><OrganisationPanel/><MetadataEditorPanel/><LibraryManagementPanel/>
      {librarySourcesOpen?<Modal transparent animationType="slide" visible onRequestClose={()=>setLibrarySourcesOpen(false)}>
        <Pressable style={[styles.sheetBackdrop,foldLayout&&styles.sheetBackdropFold]} onPress={()=>setLibrarySourcesOpen(false)}>
          <Pressable accessibilityViewIsModal accessibilityLabel="Library sources and folders" style={[styles.actionSheet,foldLayout&&styles.actionSheetFold,{backgroundColor:p.paper,borderColor:p.line}]} onPress={()=>undefined}>
            <View style={[styles.sheetHandle,foldLayout&&styles.sheetHandleFold]}/>
            <View style={styles.sheetHeader}><View style={{flex:1}}><Text style={[styles.sheetTitle,{color:p.ink}]}>Sources & folders</Text><Text style={[styles.meta,{color:p.muted}]}>Choose where the catalogue is physically stored.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close sources and folders" onPress={()=>setLibrarySourcesOpen(false)} style={styles.sheetCloseButton}><UiIcon name="close" color={p.muted} size={18}/></Pressable></View>
            <ScrollView contentContainerStyle={styles.librarySourceSheetBody}><LibrarySourceNavigator compact/></ScrollView>
          </Pressable>
        </Pressable>
      </Modal>:null}
      {libraryFiltersOpen?<Modal transparent animationType="slide" visible onRequestClose={()=>setLibraryFiltersOpen(false)}><View style={[styles.sheetBackdrop,foldLayout&&styles.sheetBackdropFold]}><ScrollView contentContainerStyle={styles.sheetScroll}><View accessibilityViewIsModal accessibilityLabel="Library filters" style={[styles.actionSheet,foldLayout&&styles.actionSheetFold,{backgroundColor:p.card,borderColor:p.line}]}><View style={[styles.sheetHandle,foldLayout&&styles.sheetHandleFold]}/><View style={styles.sectionHeader}><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Filter & sort</Text><Pressable accessibilityRole="button" onPress={clearLibraryFilters}><Text style={{color:p.sage,fontWeight:'800'}}>Reset</Text></Pressable></View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>SORT</Text><View style={styles.filterWrap}>{([
          ['title','Title'],
          ['author','Author'],
          ['series','Series'],
          ['format','Format'],
          ['progress','Progress'],
          ['rating','Rating'],
        ] as const).map(([sort,label])=><Pressable key={sort} accessibilityRole="button" accessibilityState={{selected:librarySort===sort}} onPress={()=>setLibrarySort(sort)} style={[styles.filterChip,{backgroundColor:librarySort===sort?p.card:'transparent'}]}><Text style={{color:librarySort===sort?p.sage:p.muted,fontWeight:librarySort===sort?'700':'500'}}>{label}</Text></Pressable>)}</View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>READING STATE</Text><View style={styles.filterWrap}>{(['','not-started','in-progress','finished'] as const).map(state=><Pressable key={state||'any'} accessibilityRole="button" accessibilityState={{selected:readingFilter===state}} onPress={()=>setReadingFilter(state)} style={[styles.filterChip,{backgroundColor:readingFilter===state?p.card:'transparent'}]}><Text style={{color:readingFilter===state?p.sage:p.muted,fontWeight:readingFilter===state?'700':'500'}}>{state?state.replace('-',' '):'Any'}</Text></Pressable>)}</View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>AVAILABILITY</Text><View style={styles.filterWrap}>{(['all','available','unavailable'] as const).map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:availabilityFilter===value}} onPress={()=>setAvailabilityFilter(value)} style={[styles.filterChip,{backgroundColor:availabilityFilter===value?p.card:'transparent'}]}><Text style={{color:availabilityFilter===value?p.sage:p.muted,fontWeight:availabilityFilter===value?'700':'500'}}>{value[0].toUpperCase()+value.slice(1)}</Text></Pressable>)}</View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>PERSONAL</Text><View style={styles.filterWrap}><Pressable accessibilityRole="button" accessibilityState={{selected:favouriteOnly}} onPress={()=>setFavouriteOnly(!favouriteOnly)} style={[styles.filterChip,{backgroundColor:favouriteOnly?p.card:'transparent'}]}><Text style={{color:favouriteOnly?p.sage:p.muted,fontWeight:favouriteOnly?'700':'500'}}>Favourites</Text></Pressable>{[0,2,4,6,8,10].map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:ratingFilter===value}} onPress={()=>setRatingFilter(value)} style={[styles.filterChip,{backgroundColor:ratingFilter===value?p.card:'transparent'}]}><Text style={{color:ratingFilter===value?p.sage:p.muted,fontWeight:ratingFilter===value?'700':'500'}}>{value?ratingLabel(value):'Any rating'}</Text></Pressable>)}</View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>AUTHOR</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}><Pressable accessibilityRole="button" accessibilityState={{selected:!authorFilter}} onPress={()=>setAuthorFilter('')} style={[styles.filterChip,{backgroundColor:!authorFilter?p.card:'transparent'}]}><Text style={{color:p.ink}}>Any</Text></Pressable>{authorOptions.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:authorFilter===value}} onPress={()=>setAuthorFilter(value)} style={[styles.filterChip,{backgroundColor:authorFilter===value?p.card:'transparent'}]}><Text style={{color:p.ink}}>{value}</Text></Pressable>)}</ScrollView>
        <Text style={[styles.filterLabel,{color:p.muted}]}>SERIES</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}><Pressable accessibilityRole="button" accessibilityState={{selected:!seriesFilter}} onPress={()=>setSeriesFilter('')} style={[styles.filterChip,{backgroundColor:!seriesFilter?p.card:'transparent'}]}><Text style={{color:p.ink}}>Any</Text></Pressable>{seriesOptions.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:seriesFilter===value}} onPress={()=>setSeriesFilter(value)} style={[styles.filterChip,{backgroundColor:seriesFilter===value?p.card:'transparent'}]}><Text style={{color:p.ink}}>{value}</Text></Pressable>)}</ScrollView>
        <Text style={[styles.filterLabel,{color:p.muted}]}>GENRE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}><Pressable accessibilityRole="button" accessibilityState={{selected:!genreFilter}} onPress={()=>setGenreFilter('')} style={[styles.filterChip,{backgroundColor:!genreFilter?p.card:'transparent'}]}><Text style={{color:p.ink}}>Any</Text></Pressable>{genreOptions.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:genreFilter===value}} onPress={()=>setGenreFilter(value)} style={[styles.filterChip,{backgroundColor:genreFilter===value?p.card:'transparent'}]}><Text style={{color:p.ink}}>{value}</Text></Pressable>)}</ScrollView>
        <Text style={[styles.filterLabel,{color:p.muted}]}>METADATA GAPS</Text><View style={styles.filterWrap}>{([
          ['','Any metadata'],
          ['author','Missing author'],
          ['series','Missing series'],
          ['genre','Missing genre'],
          ['cover','Missing device cover'],
        ] as Array<[MetadataGapFilter,string]>).map(([gap,label])=><Pressable key={gap||'all-metadata'} accessibilityRole="button" accessibilityState={{selected:metadataGapFilter===gap}} onPress={()=>{setReviewOnly(false);setMetadataGapFilter(gap)}} style={[styles.filterChip,{backgroundColor:metadataGapFilter===gap?p.card:'transparent'}]}><Text style={{color:metadataGapFilter===gap?p.sage:p.muted,fontWeight:metadataGapFilter===gap?'700':'500'}}>{label}</Text></Pressable>)}</View>
        <Button label="Apply" onPress={()=>setLibraryFiltersOpen(false)}/><Button label="Save as Smart Shelf" tone="quiet" onPress={()=>{setLibraryFiltersOpen(false);setOrganisationName('');setSmartShelfRules(emptySmartShelfRules());setSmartShelfAdvanced(false);setOrganisationModal('smart-shelf')}}/>
      </View></ScrollView></View></Modal>:null}
    </View>;
    return wide?<View style={styles.libraryTwoPane}><ScrollView style={[styles.libraryRail,layoutTier==='fold'&&styles.libraryRailFold,{backgroundColor:'transparent',borderRightColor:p.line}]} contentContainerStyle={styles.libraryRailContent} showsVerticalScrollIndicator={false}><LibrarySourceNavigator/></ScrollView>{main}</View>:main;
  }

  function LiveMediaEmpty({mode,lastTitle,onResume}:{mode:'player'|'reader';lastTitle?:string;onResume?:()=>void}) {
    const playerMode=mode==='player';
    return <View style={styles.liveMediaEmpty}>
      <ArchivistLogo size={46}/>
      <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{playerMode?'Nothing playing':'Reader'}</Text>
      <Text style={[styles.empty,{color:p.muted,textAlign:'center'}]}>{playerMode
        ? (lastTitle?'Resume your most recent audiobook, or choose another from Shelf.':'Choose an audiobook from Shelf. Archivist will remember where you stopped.')
        : (lastTitle?'Resume your most recent book or comic, or choose another from Shelf.':'Open an EPUB, PDF or comic from Shelf.')}</Text>
      {lastTitle&&onResume?<Button label={'Resume '+lastTitle} onPress={onResume}/>:null}
      <Button label="Go to Shelf" tone="quiet" onPress={()=>setActiveTab('shelf')}/>
    </View>;
  }

  function Player({embedded=false}:{embedded?:boolean}={}) {
    const current = playing;
    const serverPlayer = current?.source==='server';
    const position = serverPlayer ? playback?.seconds || 0 : audio.currentTime || 0;
    const duration = serverPlayer ? playback?.duration || 0 : audio.duration || 0;
    const isPlaying = serverPlayer ? !!playback?.playing : !!audio.playing;
    const speed = serverPlayer ? playback?.speed || 1 : localSpeed;
    const workKey=playbackWorkKey(current);
    const effectiveChapters=chapterOverrides[workKey]?.length?chapterOverrides[workKey]:chapters;
    const currentChapterIndex = effectiveChapters.findIndex(chapter => position >= chapter.start && (chapter.end <= chapter.start || position < chapter.end));
    const currentChapter = currentChapterIndex >= 0 ? effectiveChapters[currentChapterIndex] : null;
    const currentBookmarks=playerBookmarks.filter(item=>item.workKey===workKey);
    const remaining = Math.max(0, duration - position);
    const nativeSleepSupported = typeof (player as typeof player & {setSleepTimer?: (seconds:number)=>void}).setSleepTimer === 'function';
    const currentServerWork=current?.serverWorkId?serverWorks.find(work=>work.id===current.serverWorkId):undefined;
    const offlineCopy=currentServerWork?downloadedServerWork(currentServerWork):current?.source==='downloaded'?Object.values(offlineWorks).find(item=>item.server===current.originServer&&item.workId===current.serverWorkId):undefined;
    if(embedded&&!current)return <LiveMediaEmpty mode="player" lastTitle={lastPlaying?.title} onResume={lastPlaying?()=>void playBook(lastPlaying):undefined}/>;

    async function togglePlayback(){
      if(serverPlayer){controller.toggle();return;}
      if(isPlaying){player.pause();await persistLocalPlaybackPosition(position);}else player.play();
    }
    async function moveCurrentTrack(index:number,direction:-1|1){
      if(!workKey)return;
      if(serverPlayer&&playback?.tracks){const order=moveTrackOrder(playback.tracks,index,direction,track=>String(track.id));controller.setTrackOrder(order.map(Number));await saveTrackOrder(workKey,order);return;}
      if(activeLocalWork){const order=moveTrackOrder(activeLocalWork.tracks,index,direction,track=>track.uri||String(track.id));const currentUri=activeLocalWork.tracks[localWorkIndex]?.uri;const next={...activeLocalWork,tracks:applyTrackOrder(activeLocalWork.tracks,order,track=>track.uri||String(track.id))};setActiveLocalWork(next);setLocalWorkIndex(Math.max(0,next.tracks.findIndex(track=>track.uri===currentUri)));await saveTrackOrder(workKey,order);}
    }

    function seekTo(seconds: number) {
      const target = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, seconds));
      if (serverPlayer) void controller.seek(target);
      else void player.seekTo(target);
    }

    function jumpChapter(direction:-1|1){
      if(effectiveChapters.length){
        let targetIndex=currentChapterIndex;
        if(direction<0){
          const currentStart=currentChapter?.start||0;
          targetIndex=position-currentStart>5?Math.max(0,currentChapterIndex):Math.max(0,currentChapterIndex-1);
        }else{
          targetIndex=Math.min(effectiveChapters.length-1,Math.max(0,currentChapterIndex)+1);
        }
        const chapter=effectiveChapters[targetIndex];
        if(chapter){seekTo(chapter.start);turnPages(5,direction);return;}
      }
      seekTo(position+(direction*60));
      turnPages(5,direction);
    }

    function setPlayerSpeed(rate: number) {
      if (serverPlayer) controller.setSpeed(rate);
      else {
        try {
          player.setPlaybackRate(rate);
          setLocalSpeed(rate);
        } catch (e) {
          setError((e as Error).message);
        }
      }
    }

    return (
      <ScrollView style={embedded?styles.liveHubScroll:undefined} contentContainerStyle={[styles.playerScreen,foldLayout&&styles.playerScreenFold,!current&&styles.playerScreenEmpty,embedded&&styles.playerScreenEmbedded]}>
        {!embedded?<View style={styles.playerHeading}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close player" onPress={()=>setActiveTab('shelf')} style={styles.iconButton}><UiIcon name="chevronDown" color={p.ink} size={22}/></Pressable>
          <Text style={[styles.playerEyebrow,{color:p.ink,flex:1}]}>NOW PLAYING</Text>
          {current ? <Text style={[styles.meta,{color:p.muted,fontWeight:'600'}]}>{speed}×</Text> : null}
        </View>:null}
        {current ? (
          <>
          {embedded?<View style={styles.playerLiveKicker}><Text style={[styles.playerEyebrow,{color:p.ink}]}>NOW PLAYING</Text><Text style={[styles.playerLiveMeta,{color:p.muted}]}>{current.source==='downloaded'?'Downloaded · Offline':current.source==='server'?'Streaming · '+speed+'×':'On device · '+speed+'×'}</Text></View>:null}
          <View style={[styles.playerAdaptive,foldLayout&&styles.playerAdaptiveWide]}>
            <View style={styles.playerHeroColumn}>
            <LivingBookArtwork title={current.title} author={current.author} chapter={currentChapter?.title} number={Math.max(1,currentChapterIndex+1)} open={bookOpenAnim} turn={pageTurnAnim} skip={skipTurnAnim} skipPages={skipPageCount} direction={skipDirection} skipping={skipTurning} glowColor={ambientHaloColor} glowStrength={darkMode?.72:.46} cover={(current.coverUri||current.source==='server')?<Cover book={current} fill/>:null}/>
            <View style={styles.playerIdentity}>
              <Text maxFontSizeMultiplier={1.12} numberOfLines={2} style={[styles.nowTitle,{color:p.ink},layoutTier==='compact'&&styles.nowTitleCompact,layoutTier==='fold'&&styles.nowTitleFold]}>{current.title}</Text>
              {current.author?<Text numberOfLines={1} style={[styles.playerByline,{color:p.muted}]}>By {current.author}</Text>:null}
              {current.series?<Text numberOfLines={1} style={[styles.playerSeries,{color:p.muted}]}>{current.series}</Text>:null}
            </View>
            <View style={styles.playerStatusRow}>
              <Text style={[styles.playerStatusText,{color:p.muted}]}>{current.source==='server'?'Server':current.source==='downloaded'?'Downloaded':'On this device'}</Text>
              {offlineCopy?<Text style={[styles.playerStatusText,{color:p.sage}]}>Available offline</Text>:null}
              {current.source==='server'&&currentServerWork&&!offlineCopy?<Pressable accessibilityRole="button" disabled={offlineBusyId===currentServerWork.id} onPress={()=>void downloadServerWork(currentServerWork)} style={styles.playerStatusAction}><Text style={[styles.playerStatusText,{color:p.sage,fontWeight:'600'}]}>{offlineBusyId===currentServerWork.id?'Downloading…':'Download'}</Text></Pressable>:null}
            </View>
            </View>
            <View style={styles.playerControlColumn}>
            <View style={{flexDirection:'row',justifyContent:'space-between',gap:12,marginBottom:8}}><Text numberOfLines={1} style={{color:p.ink,flex:1,fontSize:13}}>{currentChapter?.title||'Listening'}</Text><Text style={{color:p.muted,fontSize:13}}>{Math.round(displayedProgress*100)}%</Text></View>

            <Pressable
              accessibilityRole="adjustable"
              accessibilityLabel="Playback position"
              accessibilityHint="Tap to seek, or swipe up and down with a screen reader to move by 30 seconds"
              accessibilityValue={{min:0,max:Math.max(1,Math.round(duration)),now:Math.round(position),text:formatTime(position)+' of '+formatTime(duration)}}
              accessibilityActions={[{name:'increment',label:'Forward 30 seconds'},{name:'decrement',label:'Back 30 seconds'}]}
              onAccessibilityAction={event=>{
                if(event.nativeEvent.actionName==='increment'){seekTo(position+30);turnPages(3,1);}
                if(event.nativeEvent.actionName==='decrement'){seekTo(position-30);turnPages(3,-1);}
              }}
              onLayout={event=>setPlayerProgressWidth(Math.max(1,event.nativeEvent.layout.width))}
              onPress={event => {
                if (!duration) return;
                const location = event.nativeEvent.locationX;
                seekTo((location / Math.max(1,playerProgressWidth)) * duration);
              }}
              style={[styles.progressHitArea,{maxWidth:560,alignSelf:'center',width:'100%'}]}>
              <View style={[styles.progressTrack, {backgroundColor:p.card,height:24,borderRadius:14,overflow:'visible'}]}>
                <View style={[styles.progressFill, {backgroundColor:'rgba(71,115,111,.20)',borderRadius:14,width: `${displayedProgress * 100}%`}]} /><View pointerEvents="none" style={{position:'absolute',left:`${displayedProgress*100}%`,marginLeft:-12,top:0,width:24,height:24,borderRadius:12,backgroundColor:p.ink}}/>
              </View>
            </Pressable>
            <View style={styles.timeRow}>
              <Text style={[styles.playerTime,{color:p.muted}]}>{formatTime(position)}</Text>
              <Text style={[styles.playerTime,{color:p.muted}]}>−{formatTime(remaining)}</Text>
            </View>

            <View style={styles.transport}>
              <Pressable accessibilityRole="button" accessibilityLabel={effectiveChapters.length?'Previous chapter':'Back 60 seconds'} onPress={()=>jumpChapter(-1)} style={[styles.transportEdgeButton,{backgroundColor:p.card}]}>
                <UiIcon name="trackBack" color={p.ink} size={27}/>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Back 15 seconds" onPress={()=>{seekTo(position-15);turnPages(3,-1);}} style={[styles.skipButton,{backgroundColor:p.card}]}>
                <UiIcon name="skipBack" color={p.ink} size={30}/>
                <Text pointerEvents="none" style={[styles.skipNumber,{color:p.ink}]}>15</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                disabled={serverPlayer ? playback?.loading : false}
                style={({pressed})=>[styles.playButton,{backgroundColor:p.paper==='#000000'?'#F1EEE4':'#182C29',transform:[{scale:pressed?0.97:1}]}]}
                onPress={()=>void togglePlayback()}>
                {serverPlayer && playback?.loading ? <ActivityIndicator color="#FFFFFF"/> : <UiIcon name={isPlaying?'pause':'play'} color={p.paper==='#000000'?'#182C29':'#FFFFFF'} size={29}/>}
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Forward 30 seconds" onPress={()=>{seekTo(position+30);turnPages(3,1);}} style={[styles.skipButton,{backgroundColor:p.card}]}>
                <UiIcon name="skipForward" color={p.ink} size={30}/>
                <Text pointerEvents="none" style={[styles.skipNumber,{color:p.ink}]}>30</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={effectiveChapters.length?'Next chapter':'Forward 60 seconds'} onPress={()=>jumpChapter(1)} style={[styles.transportEdgeButton,{backgroundColor:p.card}]}>
                <UiIcon name="trackForward" color={p.ink} size={27}/>
              </Pressable>
            </View>

            <View style={[styles.playerTools,{borderTopColor:p.line}]}>
              <Pressable accessibilityRole="button" accessibilityLabel={'Playback speed '+speed+' times'} accessibilityState={{expanded:playerPanel==='speed'}} onPress={()=>setPlayerPanel(playerPanel==='speed'?null:'speed')} style={styles.playerTool}>
                <Text style={[styles.playerSpeedGlyph,{color:playerPanel==='speed'?p.sage:p.ink}]}>{speed}×</Text><Text style={[styles.playerToolLabel,{color:p.muted}]}>Speed</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={'Bookmarks, '+currentBookmarks.length} accessibilityState={{expanded:playerPanel==='bookmarks'}} onPress={()=>setPlayerPanel(playerPanel==='bookmarks'?null:'bookmarks')} style={styles.playerTool}>
                <View style={styles.playerToolIconWrap}><UiIcon name="bookmark" color={playerPanel==='bookmarks'?p.sage:p.ink} size={21}/>{currentBookmarks.length?<Text style={[styles.playerToolBadge,{color:p.muted}]}>{currentBookmarks.length}</Text>:null}</View><Text style={[styles.playerToolLabel,{color:p.muted}]}>Bookmark</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={'Chapters, '+effectiveChapters.length} accessibilityState={{expanded:playerPanel==='chapters'}} onPress={()=>setPlayerPanel(playerPanel==='chapters'?null:'chapters')} style={styles.playerTool}>
                <View style={styles.playerToolIconWrap}><UiIcon name="list" color={playerPanel==='chapters'?p.sage:p.ink} size={21}/></View><Text style={[styles.playerToolLabel,{color:p.muted}]}>Chapters</Text>
              </Pressable>
              {serverPlayer&&nativeSleepSupported?<Pressable accessibilityRole="button" accessibilityLabel="Sleep timer" accessibilityState={{expanded:playerPanel==='sleep'}} onPress={()=>setPlayerPanel(playerPanel==='sleep'?null:'sleep')} style={styles.playerTool}>
                <View style={styles.playerToolIconWrap}><UiIcon name="moon" color={playerPanel==='sleep'?p.sage:p.ink} size={21}/></View><Text style={[styles.playerToolLabel,{color:p.muted}]}>Sleep</Text>
              </Pressable>:null}
              <Pressable accessibilityRole="button" accessibilityLabel={'Queue, '+queuedBooks.length+' item'+(queuedBooks.length===1?'':'s')} accessibilityState={{expanded:playerPanel==='queue'}} onPress={()=>setPlayerPanel(playerPanel==='queue'?null:'queue')} style={styles.playerTool}>
                <View style={styles.playerToolIconWrap}><UiIcon name="queue" color={playerPanel==='queue'?p.sage:p.ink} size={21}/>{queuedBooks.length?<Text style={[styles.playerToolBadge,{color:p.muted}]}>{queuedBooks.length}</Text>:null}</View><Text style={[styles.playerToolLabel,{color:p.muted}]}>Queue</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Edit audiobook structure" accessibilityState={{expanded:playerPanel==='structure'}} onPress={()=>setPlayerPanel(playerPanel==='structure'?null:'structure')} style={styles.playerTool}>
                <View style={styles.playerToolIconWrap}><UiIcon name="more" color={playerPanel==='structure'?p.sage:p.ink} size={21}/></View><Text style={[styles.playerToolLabel,{color:p.muted}]}>More</Text>
              </Pressable>
            </View>

            {playback?.error?<Text accessibilityRole="alert" style={[styles.playerNotice,{color:p.danger,backgroundColor:p.dangerSoft}]}>{playback.error}</Text>:null}

            {playerPanel==='speed' ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Playback speed</Text>
              <View style={styles.toolRow}>{[0.75,1,1.25,1.5,1.75,2].map(rate=><Button key={rate} label={rate+'×'} tone={rate===speed?'primary':'quiet'} onPress={()=>setPlayerSpeed(rate)} />)}</View>
            </View> : null}

            {playerPanel==='sleep' && serverPlayer && nativeSleepSupported ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Sleep timer</Text>
              <View style={styles.toolRow}>{[0,15,30,45,60].map(minutes=><Button key={minutes} label={minutes?minutes+' min':'Off'} tone="quiet" onPress={()=>controller.sleep(minutes)} />)}</View>
            </View> : null}

            {playerPanel==='bookmarks' ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              <View style={styles.queueHeader}><Text style={[styles.playerPanelTitle,{color:p.ink}]}>Bookmarks</Text><Button label="Add here" onPress={()=>void addCurrentBookmark(position)}/></View>
              {!currentBookmarks.length?<Text style={[styles.meta,{color:p.muted}]}>No bookmarks yet. Add one at any point you want to return to.</Text>:currentBookmarks.map(mark=><View key={mark.id} style={[styles.chapterRow,{borderBottomWidth:1,borderBottomColor:p.line}]}><Pressable style={{flex:1}} onPress={()=>seekTo(mark.seconds)}><Text style={{color:p.ink,fontWeight:'800'}}>{mark.label}</Text><Text style={[styles.meta,{color:p.muted}]}>{formatTime(mark.seconds)}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={'Delete bookmark at '+formatTime(mark.seconds)} onPress={()=>void deletePlayerBookmark(mark.id)}><Text style={{color:p.sage,fontWeight:'800'}}>Delete</Text></Pressable></View>)}
            </View> : null}

            {playerPanel==='chapters' ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              <View style={styles.queueHeader}><Text style={[styles.playerPanelTitle,{color:p.ink}]}>Chapters</Text><Text style={[styles.meta,{color:p.muted}]}>{effectiveChapters.length}</Text></View>
              {chapterError?<Text accessibilityRole="alert" style={{color:p.sage}}>{chapterError}</Text>:!effectiveChapters.length?<Text style={{color:p.muted}}>No chapters are available for this file.</Text>:null}
              {effectiveChapters.map((chapter,index)=><Pressable key={index} accessibilityRole="button" accessibilityLabel={'Chapter '+(index+1)+', '+chapter.title+', '+formatTime(chapter.start)} onPress={()=>seekTo(chapter.start)} style={[styles.chapterRow,currentChapterIndex===index&&{backgroundColor:p.raised}]}><Text style={[styles.chapterIndex,{color:p.sage}]}>{index+1}</Text><View style={{flex:1}}><Text numberOfLines={1} style={{color:p.ink,fontWeight:currentChapterIndex===index?'800':'600'}}>{chapter.title}</Text><Text style={[styles.meta,{color:p.muted}]}>{formatTime(chapter.start)}{chapter.end>chapter.start?' – '+formatTime(chapter.end):''}</Text></View></Pressable>)}
            </View> : null}

            {playerPanel==='structure' ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Audiobook structure</Text><Text style={[styles.meta,{color:p.muted}]}>Corrections are stored by Archivist. Your original audio files are never rewritten.</Text>
              {((serverPlayer?playback?.tracks:activeLocalWork?.tracks)?.length||0)>1?<><Text style={[styles.filterLabel,{color:p.muted}]}>FILE ORDER</Text>{(serverPlayer?playback?.tracks||[]:activeLocalWork?.tracks||[]).map((track:any,index:number)=><View key={String(track.id||track.uri)} style={[styles.structureRow,{borderColor:p.line}]}><Text numberOfLines={1} style={[styles.bookTitle,{color:p.ink,flex:1}]}>{index+1}. {track.title}</Text><Pressable disabled={index===0} onPress={()=>void moveCurrentTrack(index,-1)}><Text style={{color:index===0?p.muted:p.sage,fontWeight:'900',padding:8}}>Up</Text></Pressable><Pressable disabled={index===(serverPlayer?playback?.tracks?.length||0:activeLocalWork?.tracks?.length||0)-1} onPress={()=>void moveCurrentTrack(index,1)}><Text style={{color:p.sage,fontWeight:'900',padding:8}}>Down</Text></Pressable></View>)}</>:null}
              {effectiveChapters.length?<><View style={styles.queueHeader}><Text style={[styles.filterLabel,{color:p.muted}]}>CHAPTER EDITOR</Text>{chapterOverrides[workKey]?<Pressable onPress={()=>void saveChapterOverride(workKey,null)}><Text style={{color:p.sage,fontWeight:'800'}}>Reset embedded</Text></Pressable>:null}</View>{effectiveChapters.map((chapter,index)=><View key={index} style={[styles.structureChapter,{borderColor:p.line}]}><View style={{flex:1}}>{chapterEditIndex===index?<TextInput value={chapterEditTitle} onChangeText={setChapterEditTitle} autoFocus style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>:<><Text style={[styles.bookTitle,{color:p.ink}]}>{chapter.title}</Text><Text style={[styles.meta,{color:p.muted}]}>{formatTime(chapter.start)} – {formatTime(chapter.end)}</Text></>}</View>{chapterEditIndex===index?<Pressable onPress={()=>{void saveChapterOverride(workKey,renameChapter(effectiveChapters,index,chapterEditTitle));setChapterEditIndex(null)}}><Text style={{color:p.sage,fontWeight:'800'}}>Save</Text></Pressable>:<Pressable onPress={()=>{setChapterEditIndex(index);setChapterEditTitle(chapter.title)}}><Text style={{color:p.sage,fontWeight:'800'}}>Rename</Text></Pressable>}<Pressable disabled={index!==currentChapterIndex} onPress={()=>void saveChapterOverride(workKey,splitChapter(effectiveChapters,index,position))}><Text style={{color:index===currentChapterIndex?p.sage:p.muted,fontWeight:'800'}}>Split here</Text></Pressable>{index<effectiveChapters.length-1?<Pressable onPress={()=>void saveChapterOverride(workKey,mergeChapter(effectiveChapters,index))}><Text style={{color:p.sage,fontWeight:'800'}}>Merge next</Text></Pressable>:null}{index>0?<View style={styles.boundaryRow}><Pressable onPress={()=>void saveChapterOverride(workKey,setChapterBoundary(effectiveChapters,index,chapter.start-5))}><Text style={{color:p.muted,fontWeight:'800'}}>−5s start</Text></Pressable><Pressable onPress={()=>void saveChapterOverride(workKey,setChapterBoundary(effectiveChapters,index,chapter.start+5))}><Text style={{color:p.muted,fontWeight:'800'}}>+5s start</Text></Pressable></View>:null}</View>)}</>:null}
            </View> : null}

            {playerPanel==='queue' ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              <View style={styles.queueHeader}>
                <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Up next</Text>
                <Text style={[styles.meta,{color:p.muted}]}>{queuedBooks.length} queued</Text>
              </View>
              {!queuedBooks.length ? <Text style={[styles.meta,{color:p.muted}]}>Nothing queued. Add audiobooks from Shelf.</Text> : null}
              {queuedBooks.map((book,index)=><View key={(book.originServer||'device')+'|'+(book.serverWorkId||book.localWorkKey||book.uri||book.id)} style={[styles.queueBook,{borderColor:p.line}]}>
                <Pressable accessibilityRole="button" style={{flex:1}} onPress={()=>{void updateLocalQueue(queuedBooks.filter((_,itemIndex)=>itemIndex!==index)).then(()=>playBook(book));}}>
                  <Text numberOfLines={1} style={{color:p.ink,fontWeight:'800'}}>{book.title}</Text>
                  <Text style={[styles.meta,{color:p.muted}]}>#{index+1}{book.author ? ' · '+book.author : ''} · {book.source==='server'?'Server':book.source==='downloaded'?'Downloaded':'Device'}</Text>
                </Pressable>
                <View style={styles.queueActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={'Move '+book.title+' up in queue'} disabled={index===0} onPress={()=>void updateLocalQueue(reorder(queuedBooks,index,-1))} style={styles.queueIconButton}><UiIcon name="chevronUp" color={index===0?p.muted:p.sage} size={17}/></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={'Move '+book.title+' down in queue'} disabled={index===queuedBooks.length-1} onPress={()=>void updateLocalQueue(reorder(queuedBooks,index,1))} style={styles.queueIconButton}><UiIcon name="chevronDown" color={index===queuedBooks.length-1?p.muted:p.sage} size={17}/></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={'Remove '+book.title+' from queue'} onPress={()=>void updateLocalQueue(queuedBooks.filter((_,itemIndex)=>itemIndex!==index))}><Text style={{color:p.sage,fontWeight:'800'}}>Remove</Text></Pressable>
                </View>
              </View>)}
            </View> : null}
            </View>
          </View>
          </>
        ) : (
          <View style={styles.playerEmpty}>
            <ArchivistLogo size={46}/>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Nothing playing</Text>
            <Text style={[styles.empty,{color:p.muted,textAlign:'center'}]}>{lastPlaying?'Resume your most recent audiobook, or choose another from Shelf.':'Choose an audiobook from Shelf. Archivist will remember where you stopped.'}</Text>
            {lastPlaying?<Button label={'Resume '+lastPlaying.title} onPress={()=>void playBook(lastPlaying)}/>:null}
            <Button label="Go to Shelf" tone="quiet" onPress={()=>setActiveTab('shelf')}/>
          </View>
        )}
      </ScrollView>
    );
  }

  function ReaderTools(){
    if(!reading)return null;const workKey=readerWorkKey(reading);const bookmarks=workReaderBookmarks(readerBookmarks,workKey);const annotations=workReaderAnnotations(readerAnnotations,workKey);
    const updateScale=(delta:number)=>void persistReaderAppearance({...readerAppearance,scale:Math.max(.78,Math.min(1.5,readerAppearance.scale+delta))});
    return <Modal transparent animationType="slide" visible={readerToolsOpen} onRequestClose={()=>setReaderToolsOpen(false)}><View style={[styles.sheetBackdrop,foldLayout&&styles.sheetBackdropFold]}><ScrollView contentContainerStyle={styles.sheetScroll} keyboardShouldPersistTaps="handled"><View accessibilityViewIsModal accessibilityLabel="Reader tools" style={[styles.actionSheet,foldLayout&&styles.actionSheetFold,{backgroundColor:p.card,borderColor:p.line}]}>
      <View style={[styles.sheetHandle,foldLayout&&styles.sheetHandleFold]}/>
      <View style={styles.readerSheetHeader}>
        <View style={{flex:1}}>
          <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Reader</Text>
          <Text style={[styles.meta,{color:p.muted}]}>{readerCount?`Page ${readerPage+1} of ${readerCount}`:`Page ${readerPage+1}`}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close Reader tools" onPress={()=>setReaderToolsOpen(false)} style={styles.readerSheetClose}><UiIcon name="close" color={p.muted} size={19}/></Pressable>
      </View>
      <View style={[styles.readerToolBlock,{borderTopColor:p.line}]}>
        <Text style={[styles.filterLabel,{color:p.muted}]}>SEARCH</Text>
        <View style={styles.searchRow}>
          <TextInput value={readerSearch} onChangeText={setReaderSearch} placeholder="Find in this book" placeholderTextColor={p.muted} returnKeyType="search" onSubmitEditing={()=>{setReaderSearchCount(null);sendReaderCommand('search',{query:readerSearch})}} style={[styles.readerSearchInput,{color:p.ink,backgroundColor:p.raised}]}/>
          <Pressable accessibilityRole="button" accessibilityLabel="Find in book" onPress={()=>{setReaderSearchCount(null);sendReaderCommand('search',{query:readerSearch})}} style={styles.readerSearchButton}><UiIcon name="search" color={p.ink} size={20}/></Pressable>
        </View>
        {readerSearchCount!==null?<Text style={[styles.meta,{color:p.muted}]}>{readerSearchCount} match{readerSearchCount===1?'':'es'}</Text>:null}
      </View>
      <View style={[styles.readerToolBlock,{borderTopColor:p.line}]}>
        <View style={styles.readerAppearanceHeader}>
          <Text style={[styles.filterLabel,{color:p.muted,marginTop:0}]}>TEXT SIZE</Text>
          <View style={styles.readerScaleControl}>
            <Pressable accessibilityRole="button" accessibilityLabel="Smaller text" onPress={()=>updateScale(-.08)} style={styles.readerScaleButton}><UiIcon name="minus" color={p.ink} size={17}/></Pressable>
            <Text style={[styles.readerScaleValue,{color:p.ink}]}>{Math.round(readerAppearance.scale*100)}%</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Larger text" onPress={()=>updateScale(.08)} style={styles.readerScaleButton}><UiIcon name="plus" color={p.ink} size={17}/></Pressable>
          </View>
        </View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>PAGE</Text>
        <View style={styles.readerThemeTabs}>
          {(['system','paper','sepia','dark'] as ReaderAppearance['theme'][]).map(theme=>{
            const selected=readerAppearance.theme===theme;
            return <Pressable key={theme} accessibilityRole="button" accessibilityState={{selected}} onPress={()=>void persistReaderAppearance({...readerAppearance,theme})} style={[styles.readerThemeTab,{backgroundColor:selected?p.raised:'transparent'}]}>
              <Text style={{color:selected?p.sage:p.muted,fontWeight:selected?'700':'500',textTransform:'capitalize'}}>{theme}</Text>
              <View pointerEvents="none" style={[styles.readerThemeMarker,{backgroundColor:p.sage,opacity:selected?1:0}]}/>
            </Pressable>;
          })}
        </View>
      </View>
      <View style={[styles.readerToolBlock,{borderTopColor:p.line}]}>
        <View style={styles.readerToolSectionHeader}>
          <Text style={[styles.filterLabel,{color:p.muted,marginTop:0}]}>BOOKMARKS</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={bookmarks.some(item=>item.page===readerPage)?'Remove current bookmark':'Bookmark current page'} onPress={()=>void toggleCurrentReaderBookmark()} style={styles.readerBookmarkAction}>
            <UiIcon name="bookmark" color={bookmarks.some(item=>item.page===readerPage)?p.sage:p.ink} size={20}/>
            <Text style={{color:bookmarks.some(item=>item.page===readerPage)?p.sage:p.ink,fontWeight:'600'}}>{bookmarks.some(item=>item.page===readerPage)?'Remove':'Add page'}</Text>
          </Pressable>
        </View>
        {bookmarks.length?bookmarks.map(item=><View key={item.id} style={[styles.readerSavedRow,{borderColor:p.line}]}>
          <Text style={[styles.bookTitle,{color:p.ink,flex:1}]}>Page {item.page+1}</Text>
          <Pressable accessibilityRole="button" onPress={()=>{setReaderRequestedPage(item.page);sendReaderCommand('goto',{page:item.page})}} style={styles.readerSavedAction}><Text style={{color:p.sage,fontWeight:'600'}}>Go</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={()=>void persistReaderBookmarks(readerBookmarks.filter(saved=>saved.id!==item.id))} style={styles.readerSavedAction}><Text style={{color:p.muted,fontWeight:'600'}}>Remove</Text></Pressable>
        </View>):<Text style={[styles.meta,{color:p.muted}]}>No bookmarks yet.</Text>}
      </View>
      <View style={[styles.readerToolBlock,{borderTopColor:p.line}]}><Text style={[styles.filterLabel,{color:p.muted,marginTop:0}]}>HIGHLIGHTS & NOTES</Text>{readerSelection?<><Text numberOfLines={4} style={[styles.readerQuote,{color:p.ink,borderColor:p.line}]}>{readerSelection}</Text><View style={styles.toolRow}><Button label="Highlight" tone="quiet" onPress={()=>void saveCurrentReaderAnnotation('highlight')}/></View><TextInput value={readerNote} onChangeText={setReaderNote} placeholder="Add a note to this selection" placeholderTextColor={p.muted} multiline style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised,minHeight:72}]}/><Button label="Save note" disabled={!readerNote.trim()} onPress={()=>void saveCurrentReaderAnnotation('note')}/></>:<Text style={[styles.meta,{color:p.muted}]}>Select text in the book to highlight it or attach a note.</Text>}{annotations.map(item=><View key={item.id} style={[styles.readerSavedRow,{borderColor:p.line}]}><View style={{flex:1}}><Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{item.text}</Text><Text style={[styles.meta,{color:p.muted}]}>Page {item.page+1} · {item.kind}{item.note?` · ${item.note}`:''}</Text></View><Pressable onPress={()=>void persistReaderAnnotations(readerAnnotations.filter(saved=>saved.id!==item.id))}><Text style={{color:p.muted,fontWeight:'800'}}>Remove</Text></Pressable></View>)}</View>
    </View></ScrollView></View></Modal>;
  }

  function Reader({embedded=false}:{embedded?:boolean}={}) {
    const closeReader=()=>{setReading(null);setLocalReader(null);setReaderLoadError('');setReaderLoading(false);setReaderToolsOpen(false);setReaderChromeVisible(true);setActiveTab('shelf');};
    const readerBar=<View style={[styles.readerBar,{backgroundColor:p.paper}]}>{!embedded?<Pressable accessibilityRole="button" accessibilityLabel="Back to Shelf" onPress={closeReader} style={styles.readerBack}><UiIcon name="back" color={p.ink} size={21}/></Pressable>:null}<View style={styles.readerHeading}><Text numberOfLines={1} style={[styles.readerTitle,{color:p.ink}]}>{reading?.title || 'Reader'}</Text>{reading?<Text style={[styles.readerFormat,{color:p.muted}]}>{reading.format}</Text>:null}</View><Pressable accessibilityRole="button" accessibilityLabel="Reader tools" onPress={()=>setReaderToolsOpen(true)} style={styles.readerToolsButton}><Text style={[styles.readerToolGlyph,{color:p.ink}]}>Aa</Text></Pressable></View>;
    if(!reading)return <LiveMediaEmpty mode="reader" lastTitle={lastReading?.title} onResume={lastReading?()=>openBook(lastReading):undefined}/>;
    const localReaderMode=reading.source!=='server';
    if(localReaderMode){
      const localPdf=reading.format==='PDF'&&!!reading.uri&&Platform.OS==='android';
      return <View style={styles.readerScreen}>{readerChromeVisible?readerBar:null}{localPdf?<LocalPdfReader uri={reading.uri!} title={reading.title} initialPage={localReadingProgress[reading.uri!]||0} requestedPage={readerRequestedPage} paper={p.paper} ink={p.ink} muted={p.muted} line={p.line} sage={p.sage} onPosition={(page,count,complete)=>handleReaderMessage(JSON.stringify({type:'reader-position',page,count,complete}))}/>:readerLoading?<View style={styles.readerLoading}><ActivityIndicator accessibilityLabel="Opening local reader"/><Text style={[styles.meta,{color:p.muted}]}>Opening {reading.format}…</Text></View>:readerLoadError?<View style={styles.readerFailure}><Text accessibilityRole="alert" style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Couldn’t open this book</Text><Text style={[styles.meta,{color:p.muted}]}>{readerLoadError}</Text><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View>:localReader?.html?<WebView ref={readerWebRef} originWhitelist={['*']} source={{html:localReader.html}} onLoadEnd={()=>sendReaderCommand('appearance',{value:readerAppearance})} onMessage={event=>handleReaderMessage(event.nativeEvent.data)}/>:localReader?.uri?<WebView ref={readerWebRef} originWhitelist={['content://*','file://*']} source={{uri:localReader.uri}} allowFileAccess/>:<Text style={[styles.empty,{color:p.muted,padding:16}]}>Unable to open this file.</Text>}<ReaderTools/></View>;
    }
    if(!session||(reading.originServer&&reading.originServer!==session.server))return <View style={styles.readerScreen}>{readerChromeVisible?readerBar:null}<View style={styles.readerFailure}><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Server reader unavailable</Text><Text style={[styles.meta,{color:p.muted}]}>Reconnect to the server that owns this title, or open its downloaded copy.</Text><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View><ReaderTools/></View>;
    return <View style={styles.readerScreen}>{readerChromeVisible?readerBar:null}<WebView ref={readerWebRef} key={session.token+reading.id+':'+readerReloadKey} source={{uri:session.server+'/reader.html?asset='+reading.id,headers:{Authorization:'Bearer '+session.token}}} incognito originWhitelist={[session.server]} onShouldStartLoadWithRequest={r=>readerNavigationAllowed(r.url,session.server)} mixedContentMode="never" injectedJavaScriptBeforeContentLoaded={readerHostBridgeSource()} onLoadStart={()=>{setReaderLoading(true);setReaderLoadError('')}} onLoadEnd={()=>{setReaderLoading(false);sendReaderCommand('appearance',{value:readerAppearance})}} onMessage={event=>handleReaderMessage(event.nativeEvent.data)} onHttpError={e=>{const message='Reader request failed: '+e.nativeEvent.statusCode;setReaderLoadError(message);setReaderLoading(false);setError(message)}} onError={e=>{const message=e.nativeEvent.description||'Reader failed to load.';setReaderLoadError(message);setReaderLoading(false);setError(message)}} allowFileAccess={false} javaScriptCanOpenWindowsAutomatically={false} setSupportMultipleWindows={false}/>{readerLoading?<View pointerEvents="none" style={[styles.readerOverlay,{backgroundColor:p.paper}]}><ActivityIndicator accessibilityLabel="Opening server reader"/><Text style={[styles.meta,{color:p.muted}]}>Opening {reading.format}…</Text></View>:null}{readerLoadError?<View style={[styles.readerErrorOverlay,{backgroundColor:p.paper}]}><Text accessibilityRole="alert" style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Reader needs attention</Text><Text style={[styles.meta,{color:p.muted}]}>{readerLoadError}</Text><View style={styles.toolRow}><Button label="Retry" onPress={()=>{setReaderLoadError('');setReaderLoading(true);setReaderReloadKey(key=>key+1)}}/><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View></View>:null}<ReaderTools/></View>;
  }

  function LiveHub(){
    const audioLive=!!playing;
    const readerLive=!!reading;
    return <View style={styles.liveHub}>
      <View style={styles.liveHubTop}>
        <View style={[styles.liveHubSegment,{backgroundColor:p.card,borderColor:p.line}]}>
          {(['player','reader'] as const).map(mode=>{
            const selected=liveMode===mode;
            const available=mode==='player'?(audioLive||!!lastPlaying):(readerLive||!!lastReading);
            return <Pressable
              key={mode}
              accessibilityRole="tab"
              accessibilityState={{selected}}
              accessibilityLabel={mode==='player'?'Player':'Reader'}
              onPress={()=>setLiveMode(mode)}
              style={[styles.liveHubSegmentItem,selected&&{backgroundColor:p.raised,borderColor:p.sage}]}>
              <UiIcon name={mode==='player'?'play':'bookOpen'} color={selected?p.sage:p.muted} size={18}/>
              <Text style={[styles.liveHubSegmentText,{color:selected?p.ink:p.muted}]}>{mode==='player'?'Player':'Reader'}</Text>
              {available?<View style={[styles.liveHubDot,{backgroundColor:mode==='player'&&playbackIsPlaying?p.gold:p.sage}]}/>:null}
            </Pressable>;
          })}
        </View>
      </View>
      <View style={styles.liveHubBody}>
        {liveMode==='player'?<Player embedded/>:<Reader embedded/>}
      </View>
    </View>;
  }

  function atlasSelect(kind: AtlasKind, value: string) {
    setReviewOnly(false);
    setQuery('');
    setSpace('');
    setAvailabilityFilter('all');
    setFormatFilter('');
    setLibraryFormatFamily('');
    setAuthorFilter('');
    setSeriesFilter('');
    setGenreFilter('');
    setReadingFilter('');
    setRatingFilter(0);
    setFavouriteOnly(false);
    setUnknownAuthorOnly(false);
    if (kind === 'space') {
      setSpace(value);
    } else if (kind === 'status') {
      setAvailabilityFilter(value === 'Unavailable' ? 'unavailable' : 'available');
    } else if (kind === 'format') {
      setFormatFilter(value);
    } else if (kind === 'genre') {
      setGenreFilter(value);
    } else if (kind === 'series') {
      setSeriesFilter(value);
    } else if (kind === 'author' && value === 'Unknown author') {
      setUnknownAuthorOnly(true);
    } else if (kind === 'author') {
      setAuthorFilter(value);
    } else if (kind === 'reading') {
      setReadingFilter(value==='Finished'?'finished':value==='In progress'?'in-progress':'not-started');
    } else if (kind === 'rating') {
      setRatingFilter(Math.max(0,ratingFromLabel(value)));
    } else if (kind === 'favourite') {
      setFavouriteOnly(true);
    }
    setActiveTab('library');
  }

  function AtlasGroup({title, items, kind}: {title: string; items: Array<[string, number]>; kind: AtlasKind}) {
    const max = Math.max(1, ...items.map(([, total]) => total));
    return (
      <View style={[styles.atlasGroup,{borderTopColor:p.line}]}>
        <Text style={[styles.sectionTitle, {color: p.ink, marginTop: 0}]}>{title}</Text>
        {items.length ? items.map(([name, total]) => (
          <Pressable key={title + name} accessibilityRole="button" onPress={() => setAtlasFocus({kind,value:name})} style={styles.atlasRow}>
            <Text numberOfLines={1} style={[styles.atlasText, {color: p.ink}]}>{name}</Text>
            <View style={[styles.atlasBarTrack, {backgroundColor: p.line}]}>
              <View style={[styles.atlasBarFill, {backgroundColor: p.sage, width: `${Math.max(8, (total / max) * 100)}%`}]} />
            </View>
            <Text style={[styles.meta, {color: p.muted, width: 32, textAlign: 'right'}]}>{total}</Text>
          </Pressable>
        )) : <Text style={[styles.empty, {color: p.muted}]}>No data yet.</Text>}
      </View>
    );
  }

  function AtlasConnectionGroup({title,kind,items}: {title:string;kind:AtlasKind;items:SummaryItem[]}) {
    if(!items.length || atlasFocus?.kind===kind)return null;
    return (
      <View style={[styles.atlasRelationGroup,{backgroundColor:p.card,borderColor:p.line}]}>
        <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{title}</Text>
        <View style={styles.atlasChipWrap}>
          {items.map(item=><Pressable key={kind+'-'+item.name} accessibilityRole="button" onPress={()=>setAtlasFocus({kind,value:item.name})} style={[styles.atlasRelationChip,{borderColor:p.line}]}>
            <Text style={{color:p.ink,fontWeight:'800'}}>{item.name}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{item.count}</Text>
          </Pressable>)}
        </View>
      </View>
    );
  }

  function AtlasRelationshipView() {
    if(!atlasFocus)return null;
    const relation=unifiedAtlasRelationship;
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={atlasFocus.value} subtitle={(atlasFocus.kind==='space'?'Folder':atlasFocus.kind)+' · Atlas relationship'}/>
        <PageToolbar align="start">
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Atlas" onPress={()=>setAtlasFocus(null)} style={styles.headerAction}><UiIcon name="back" color={p.muted} size={20}/></Pressable>
        </PageToolbar>
        <View style={[styles.atlasFocusHero,{backgroundColor:p.card,borderColor:p.line}]}>
          <Text style={[styles.playerEyebrow,{color:p.sage}]}>{atlasFocus.kind==='space'?'FOLDER':atlasFocus.kind.toUpperCase()}</Text>
          <Text maxFontSizeMultiplier={1.15} style={[styles.atlasFocusTitle,{color:p.ink}]}>{atlasFocus.value}</Text>
          <Text style={[styles.meta,{color:p.muted}]}>{relation ? relation.workCount+' work'+(relation.workCount===1?'':'s') : 'No matching works'}</Text>
        </View>
        {relation ? <>
          <AtlasConnectionGroup title="Authors" kind="author" items={relation.authors} />
          <AtlasConnectionGroup title="Series" kind="series" items={relation.series} />
          <AtlasConnectionGroup title="Genres" kind="genre" items={relation.genres || []} />
          <AtlasConnectionGroup title="Formats" kind="format" items={relation.formats} />
          <AtlasConnectionGroup title="Folders" kind="space" items={relation.spaces} />
          <AtlasConnectionGroup title="Availability" kind="status" items={relation.availability || []} />
          <AtlasConnectionGroup title="Reading state" kind="reading" items={relation.reading || []} />
          <AtlasConnectionGroup title="Ratings" kind="rating" items={relation.ratings || []} />
          <AtlasConnectionGroup title="Favourites" kind="favourite" items={relation.favourites || []} />
          <Text style={[styles.sectionTitle,{color:p.ink}]}>Works</Text>
          <View style={{gap:8}}>
            {relation.works.map(work=><Pressable key={work.key} accessibilityRole="button" onPress={()=>openUnifiedWork(work)} style={[styles.atlasWorkRow,{borderColor:p.line,backgroundColor:p.card}]}>
              <View style={{flex:1}}>
                <Text style={[styles.bookTitle,{color:p.ink}]}>{work.title}</Text>
                <Text style={[styles.meta,{color:p.muted}]}>{work.series || work.author || work.genre || work.format} · {work.format} · {sourceLabel(work.source)}</Text>
              </View>
              <Text style={{color:p.sage,fontWeight:'900'}}>Open</Text>
            </Pressable>)}
          </View>
          <Button label="View all in Library" onPress={()=>atlasSelect(atlasFocus.kind,atlasFocus.value)} />
        </>:null}
      </ScrollView>
    );
  }

  function animateAtlasTransform(target:{x:number;y:number;scale:number},duration=420){
    if(reduceMotion){setAtlasTransform(target);return;}
    const start={...atlasTransform};
    const started=Date.now();
    const frame=()=>{
      const raw=Math.min(1,(Date.now()-started)/duration);
      const t=1-Math.pow(1-raw,3);
      setAtlasTransform({
        x:start.x+(target.x-start.x)*t,
        y:start.y+(target.y-start.y)*t,
        scale:start.scale+(target.scale-start.scale)*t,
      });
      if(raw<1)requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function atlasResetView(){
    const viewWidth=Math.min(width-48,480);
    const viewHeight=viewWidth;
    const scale=Math.max(.18,Math.min(1.08,Math.min(viewWidth/atlasUniverse.width,viewHeight/atlasUniverse.height)*.78));
    animateAtlasTransform({x:(viewWidth-atlasUniverse.width*scale)/2,y:(viewHeight-atlasUniverse.height*scale)/2,scale});
  }

  function atlasGestureStart(event:any){
    const touches=event.nativeEvent.touches||[];
    if(touches.length>=2){
      const [a,b]=touches;
      const dx=a.locationX-b.locationX,dy=a.locationY-b.locationY;
      atlasGesture.current={mode:'pinch',startX:0,startY:0,baseX:atlasTransform.x,baseY:atlasTransform.y,baseScale:atlasTransform.scale,distance:Math.max(1,Math.hypot(dx,dy)),focusX:(a.locationX+b.locationX)/2,focusY:(a.locationY+b.locationY)/2,moved:true};
      return;
    }
    const point=touches[0]||event.nativeEvent;
    atlasGesture.current={mode:'pan',startX:point.locationX||0,startY:point.locationY||0,baseX:atlasTransform.x,baseY:atlasTransform.y,baseScale:atlasTransform.scale,distance:0,focusX:0,focusY:0,moved:false};
  }

  function atlasGestureMove(event:any){
    const gesture=atlasGesture.current;if(!gesture)return;
    const touches=event.nativeEvent.touches||[];
    if(touches.length>=2){
      const [a,b]=touches;
      const dx=a.locationX-b.locationX,dy=a.locationY-b.locationY;
      const distance=Math.max(1,Math.hypot(dx,dy));
      if(gesture.mode!=='pinch'){atlasGestureStart(event);return;}
      const nextScale=Math.max(.18,Math.min(2.25,gesture.baseScale*(distance/gesture.distance)));
      const ratio=nextScale/gesture.baseScale;
      setAtlasTransform({x:gesture.focusX-(gesture.focusX-gesture.baseX)*ratio,y:gesture.focusY-(gesture.focusY-gesture.baseY)*ratio,scale:nextScale});
      return;
    }
    if(gesture.mode==='pinch')return;
    const point=touches[0]||event.nativeEvent;
    const dx=(point.locationX||0)-gesture.startX,dy=(point.locationY||0)-gesture.startY;
    if(Math.hypot(dx,dy)>7)gesture.moved=true;
    if(!gesture.moved)return;
    setAtlasTransform(current=>({...current,x:gesture.baseX+dx,y:gesture.baseY+dy}));
  }

  function atlasSelectNearestNodeAt(viewX:number,viewY:number){
    const candidates=atlasUniverse.nodes.filter(atlasNodeVisible);
    let nearest:AtlasUniverseNode|null=null,nearestDistance=Infinity;
    for(const node of candidates){
      const x=atlasTransform.x+node.x*atlasTransform.scale;
      const y=atlasTransform.y+node.y*atlasTransform.scale;
      const distance=Math.hypot(x-viewX,y-viewY);
      if(distance<nearestDistance){nearest=node;nearestDistance=distance;}
    }
    const selectionRadius=foldLayout?30:26;
    if(nearest&&nearestDistance<=selectionRadius)selectAtlasNode(nearest.id);
  }

  function atlasGestureEnd(event:any){
    const gesture=atlasGesture.current;
    atlasGesture.current=null;
    if(!gesture||gesture.mode!=='pan'||gesture.moved)return;
    const point=event.nativeEvent;
    atlasSelectNearestNodeAt(point.locationX||0,point.locationY||0);
  }

  function atlasNodeColor(node:AtlasUniverseNode){
    if(node.kind==='genre')return genreColour(node.label);
    const linked=atlasUniverse.edges.find(edge=>edge.to===node.id&&edge.kind==='genre');
    const hub=linked&&atlasUniverse.nodes.find(item=>item.id===linked.from);
    if(hub)return genreColour(hub.label);
    if(node.kind==='author')return p.ink;
    if(node.kind==='note')return p.raised;
    if(node.kind==='series'||node.kind==='collection')return p.card;
    return p.paper;
  }

  function atlasNodeVisible(node:AtlasUniverseNode){return true;}

  function atlasSearchGo(){
    const q=atlasSearch.trim().toLowerCase();if(!q)return;
    const node=atlasUniverse.nodes.find(item=>item.label.toLowerCase().includes(q)||item.subtitle?.toLowerCase().includes(q));
    if(!node)return;
    focusAtlasNode(node.id);
  }

  function AtlasEdgeView({from,to,kind}:{from:AtlasUniverseNode;to:AtlasUniverseNode;kind:string}){
    const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;
    return <View pointerEvents="none" style={[styles.atlasUniverseEdge,{left:from.x,top:from.y,width:length,height:1/atlasTransform.scale,opacity:atlasNodeId?(from.id===atlasNodeId||to.id===atlasNodeId?.65:.08):.3,backgroundColor:atlasNodeColor(from),transformOrigin:'left center',transform:[{rotateZ:angle+'deg'}]}]}/>;
  }

  function AtlasUniverseNodeView({node}:{node:AtlasUniverseNode}){
    if(!atlasNodeVisible(node))return null;
    const selected=node.id===atlasNodeId;
    const connected=!atlasNodeId||selected||atlasUniverse.edges.some(edge=>(edge.from===atlasNodeId&&edge.to===node.id)||(edge.to===atlasNodeId&&edge.from===node.id));
    const zoom=atlasTransform.scale,hit=48/zoom;
    const colour=atlasNodeColor(node);
    const dot=(node.kind==='genre'?18:node.kind==='author'?7:node.kind==='work'?4:5.5)/zoom;
    const genreHub=node.kind==='genre';
    return <View pointerEvents="none" style={{position:'absolute',left:node.x-hit/2,top:node.y-hit/2,width:hit,height:hit,alignItems:'center',justifyContent:'center',opacity:connected?1:.20}}>
      {selected?<Animated.View pointerEvents="none" style={{position:'absolute',width:58/zoom,height:58/zoom,borderRadius:40/zoom,backgroundColor:colour,opacity:atlasPulse.interpolate({inputRange:[0,1],outputRange:[.34,0]}),transform:[{scale:atlasPulse.interpolate({inputRange:[0,1],outputRange:[1,1.38]})}]}}/>:genreHub?<View pointerEvents="none" style={{position:'absolute',width:38/zoom,height:38/zoom,borderRadius:40/zoom,backgroundColor:colour,opacity:.12}}/>:null}
      <View style={{width:dot,height:dot,borderRadius:dot/2,backgroundColor:colour,borderWidth:genreHub?1/zoom:0,borderColor:genreHub?'rgba(255,255,255,.55)':'transparent',boxShadow:selected?'0px 0px 22px '+colour:genreHub?'0px 0px 12px '+colour:'none'}}/>
      {(selected||genreHub||zoom>.60)?<View pointerEvents="none" style={{position:'absolute',top:hit/2+(genreHub?13:10)/zoom,left:(hit-150/zoom)/2,width:150/zoom,minWidth:150/zoom,alignItems:'center'}}>
        <Text numberOfLines={2} style={{paddingHorizontal:genreHub?7/zoom:0,paddingVertical:genreHub?3/zoom:0,borderRadius:999,borderWidth:genreHub?StyleSheet.hairlineWidth:0,borderColor:genreHub?colour:'transparent',backgroundColor:genreHub?(p.paper==='#000000'?'rgba(7,17,29,.82)':'rgba(255,255,255,.86)'):'transparent',textAlign:'center',fontSize:(genreHub?11.5:11)/zoom,lineHeight:(genreHub?15:14)/zoom,color:genreHub?colour:(selected?p.ink:p.muted),fontWeight:selected||genreHub?'600':'400'}}>{node.label}</Text>
      </View>:null}
    </View>;
  }

  function selectAtlasNode(nextId:string){
    if(!nextId)return;
    if(reduceMotion){setAtlasNodeId(nextId);atlasInspectorAnim.setValue(1);return;}
    if(nextId===atlasNodeId){
      atlasInspectorAnim.stopAnimation();
      atlasInspectorAnim.setValue(.92);
      Animated.spring(atlasInspectorAnim,{toValue:1,damping:19,stiffness:210,mass:.68,useNativeDriver:true}).start();
      return;
    }
    if(!atlasNodeId){
      setAtlasNodeId(nextId);
      atlasInspectorAnim.setValue(0);
      Animated.spring(atlasInspectorAnim,{toValue:1,damping:20,stiffness:185,mass:.72,useNativeDriver:true}).start();
      return;
    }
    Animated.timing(atlasInspectorAnim,{toValue:0,duration:130,useNativeDriver:true}).start(()=>{
      setAtlasNodeId(nextId);
      atlasInspectorAnim.setValue(0);
      Animated.spring(atlasInspectorAnim,{toValue:1,damping:20,stiffness:185,mass:.72,useNativeDriver:true}).start();
    });
  }

  function dismissAtlasNode(){
    if(!atlasNodeId)return;
    if(reduceMotion){atlasInspectorAnim.setValue(0);setAtlasNodeId('');return;}
    Animated.timing(atlasInspectorAnim,{toValue:0,duration:170,useNativeDriver:true}).start(()=>setAtlasNodeId(''));
  }

  function focusAtlasNode(nodeId:string){
    const node=atlasUniverse.nodes.find(item=>item.id===nodeId);
    if(!node)return;
    selectAtlasNode(nodeId);
    const viewWidth=Math.max(286,Math.min(1244,width-36)),viewHeight=width>=900?620:foldLayout?580:500;
    const scale=Math.max(.82,atlasTransform.scale);
    animateAtlasTransform({scale,x:viewWidth/2-node.x*scale,y:viewHeight/2-node.y*scale});
  }

  function AtlasInspector(){
    const node=atlasSelectedNode;if(!node)return null;
    const work=node.kind==='work'?atlasUniverseWorks.find(item=>item.key===node.workKey):undefined;
    const collection=node.kind==='collection'?collections.find(item=>item.id===node.collectionId):undefined;
    const connected=atlasUniverse.edges.filter(edge=>edge.from===node.id||edge.to===node.id).length;
    const accent=atlasNodeColor(node);
    const icon:UiIconName=node.kind==='series'?'layers':node.kind==='collection'?'shelf':node.kind==='author'?'bookmark':node.kind==='note'?'bookmark':'bookOpen';
    return <View style={[styles.atlasInspector,{backgroundColor:p.paper==='#000000'?'rgba(9,20,29,.96)':'rgba(255,252,245,.97)',borderColor:p.line}]}>
      <View pointerEvents="none" style={[styles.atlasInspectorAccent,{backgroundColor:accent}]}/>
      <View style={styles.atlasInspectorHeader}>
        <View style={[styles.atlasInspectorIcon,{backgroundColor:p.card,borderColor:accent}]}><UiIcon name={icon} color={accent} size={19}/></View>
        <View style={{flex:1,minWidth:0}}>
          <Text style={[styles.atlasInspectorKicker,{color:accent}]}>{node.kind.toUpperCase()}</Text>
          <Text numberOfLines={2} style={[styles.atlasInspectorTitle,{color:p.ink}]}>{node.label}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close Atlas details" onPress={dismissAtlasNode} style={styles.atlasInspectorClose}><UiIcon name="close" color={p.muted} size={17}/></Pressable>
      </View>
      {node.subtitle?<Text numberOfLines={2} style={[styles.atlasInspectorSubtitle,{color:p.muted}]}>{node.subtitle}</Text>:null}
      <View style={styles.atlasInspectorMetaRow}>
        <View style={[styles.atlasInspectorMetaChip,{backgroundColor:p.card}]}><Text style={[styles.atlasInspectorMetaText,{color:p.ink}]}>{connected} connection{connected===1?'':'s'}</Text></View>
        {node.source?<View style={[styles.atlasInspectorMetaChip,{backgroundColor:p.card}]}><Text style={[styles.atlasInspectorMetaText,{color:p.muted}]}>{sourceLabel(node.source as WorkSource)}</Text></View>:null}
      </View>
      {(work||node.relationKind&&node.relationValue||collection)?<View style={styles.atlasInspectorActions}>
        {work?<Button label="Open" tone="quiet" onPress={()=>openUnifiedWork(work)}/>:null}
        {node.relationKind&&node.relationValue?<Button label="Explore" tone="quiet" onPress={()=>setAtlasFocus({kind:node.relationKind as AtlasKind,value:node.relationValue!})}/>:null}
        {collection?<Button label="Open collection" tone="quiet" onPress={()=>openCollection(collection)}/>:null}
      </View>:null}
    </View>;
  }

  function selectAtlasBreakdown(next:'Genre'|'Format'|'Published year'){
    if(reduceMotion){setAtlasBreakdown(next);atlasBreakdownAnim.setValue(1);return;}
    if(next===atlasBreakdown){
      atlasBreakdownAnim.stopAnimation();
      atlasBreakdownAnim.setValue(.90);
      Animated.spring(atlasBreakdownAnim,{toValue:1,damping:18,stiffness:210,mass:.65,useNativeDriver:false}).start();
      return;
    }
    if(!atlasBreakdown){
      setAtlasBreakdown(next);
      atlasBreakdownAnim.setValue(0);
      Animated.spring(atlasBreakdownAnim,{toValue:1,damping:19,stiffness:185,mass:.72,useNativeDriver:false}).start();
      return;
    }
    Animated.timing(atlasBreakdownAnim,{toValue:0,duration:150,useNativeDriver:false}).start(()=>{
      setAtlasBreakdown(next);
      atlasBreakdownAnim.setValue(0);
      Animated.spring(atlasBreakdownAnim,{toValue:1,damping:19,stiffness:185,mass:.72,useNativeDriver:false}).start();
    });
  }

  function Atlas() {
    if(atlasFocus)return <AtlasRelationshipView />;
    const renderedNodes=atlasUniverse.nodes.filter(atlasNodeVisible);
    const renderedIds=new Set(renderedNodes.map(node=>node.id));
    const renderedEdges=atlasUniverse.edges.filter(edge=>renderedIds.has(edge.from)&&renderedIds.has(edge.to));
    const nodeMap=new Map(atlasUniverse.nodes.map(node=>[node.id,node]));
    const ringSize=Math.min(width-(width>=600?48:28),width>=940?720:width>=600?620:520);
    const viewHeight=ringSize;
    const breakdownMode=atlasBreakdown||'Genre';
    const breakdownCounts=new Map<string,number>();
    for(const work of atlasUniverseWorks){const label=breakdownMode==='Genre'?(work.genre||'Unclassified'):breakdownMode==='Format'?work.format:work.publishedYear?String(work.publishedYear):'Not recorded';breakdownCounts.set(label,(breakdownCounts.get(label)||0)+1);}
    const rawBreakdown:ChartItem[]=[...breakdownCounts].sort((a,b)=>b[1]-a[1]).map(([label,count],index)=>({label,count,color:breakdownMode==='Genre'?genreColour(label):breakdownMode==='Format'?['#62AFC1','#5F8FE3','#8C68D8','#69B99B','#98A6B9'][index%5]:['#98A6B9','#778BC2','#62AFC1','#7BA8A1','#B68B62'][index%5]}));
    const visibleBreakdown=rawBreakdown.slice(0,7);
    const overflowBreakdown=rawBreakdown.slice(7);
    const overflowCount=overflowBreakdown.reduce((sum,item)=>sum+item.count,0);
    const breakdown:ChartItem[]=overflowCount?[...visibleBreakdown,{label:'Other',count:overflowCount,color:p.muted}]:visibleBreakdown;
    const atlasRingItems:ChartItem[]=[
      {label:'Genre',count:1,color:atlasBreakdown==='Genre'?'#E2736B':'#7A4D50'},
      {label:'Format',count:1,color:atlasBreakdown==='Format'?'#62AFC1':'#385F78'},
      {label:'Year',count:1,color:atlasBreakdown==='Published year'?'#A78BC7':'#5A526F'},
    ];

    const universeDegrees=new Map<string,number>();
    const workGenre=new Map<string,string>();
    const adjacentWorks=new Map<string,Set<string>>();
    for(const edge of atlasUniverse.edges){
      universeDegrees.set(edge.from,(universeDegrees.get(edge.from)||0)+1);
      universeDegrees.set(edge.to,(universeDegrees.get(edge.to)||0)+1);
      const from=nodeMap.get(edge.from),to=nodeMap.get(edge.to);
      if(edge.kind==='genre'){
        if(from?.kind==='genre'&&to?.kind==='work')workGenre.set(to.id,from.id);
        if(to?.kind==='genre'&&from?.kind==='work')workGenre.set(from.id,to.id);
      }
      const connector=from&&['author','series','collection'].includes(from.kind)&&to?.kind==='work'?from:to&&['author','series','collection'].includes(to.kind)&&from?.kind==='work'?to:null;
      const work=connector===from?to:connector===to?from:null;
      if(connector&&work?.kind==='work'){
        const set=adjacentWorks.get(connector.id)||new Set<string>();
        set.add(work.id);adjacentWorks.set(connector.id,set);
      }
    }
    const bridgeNodeIds=[...adjacentWorks.entries()].filter(([,works])=>{
      const genres=new Set([...works].map(id=>workGenre.get(id)).filter(Boolean));
      return genres.size>1;
    }).map(([id])=>id);
    const universeMajorNodes=atlasUniverse.nodes.filter(node=>['work','author','series','collection'].includes(node.kind));
    const mostConnectedNode=universeMajorNodes.slice().sort((a,b)=>(universeDegrees.get(b.id)||0)-(universeDegrees.get(a.id)||0)||b.count-a.count)[0]||null;
    const largestConstellation=atlasUniverse.nodes.filter(node=>node.kind==='genre').slice().sort((a,b)=>b.count-a.count)[0]||null;
    const deepestSeries=atlasUniverse.nodes.filter(node=>node.kind==='series').slice().sort((a,b)=>b.count-a.count)[0]||null;
    const universeStats=[
      {label:'Nodes',value:atlasUniverse.nodes.length,copy:'mapped entities'},
      {label:'Connections',value:atlasUniverse.edges.length,copy:'relationship links'},
      {label:'Constellations',value:atlasUniverse.nodes.filter(node=>node.kind==='genre').length,copy:'genre clusters'},
      {label:'Bridges',value:bridgeNodeIds.length,copy:'cross-cluster connectors'},
      {label:'Series',value:atlasUniverse.nodes.filter(node=>node.kind==='series').length,copy:'series networks'},
      {label:'Collections',value:atlasUniverse.nodes.filter(node=>node.kind==='collection').length,copy:'collection networks'},
      {label:'Authors',value:atlasUniverse.nodes.filter(node=>node.kind==='author').length,copy:'author nodes'},
      {label:'Genres',value:new Set(atlasUniverseWorks.map(work=>String(work.genre||'').trim()).filter(Boolean)).size,copy:'recorded genres'},
    ];
    return (
      <ScrollView contentContainerStyle={[styles.atlasScreen,width>=600&&styles.atlasScreenFold,width>=940&&styles.atlasScreenWide]} keyboardShouldPersistTaps="handled">
        <PageHeader
          title="Atlas"
          subtitle="Characters, stories and ideas — your reading universe."
        />
        <PageToolbar>
          <Pressable accessibilityRole="button" accessibilityLabel={atlasListMode?'Show Atlas universe':'Show Atlas list'} onPress={()=>setAtlasListMode(value=>!value)} style={styles.headerAction}><UiIcon name={atlasListMode?'atlas':'list'} color={p.muted} size={22}/></Pressable>
        </PageToolbar>

        {atlasListMode?<SourceSwitcher/>:null}
        {atlasListMode&&availableSpaces.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryChips}><LibrarySwitcher/></ScrollView>:null}

        {atlasListMode?<View style={styles.atlasListAlternative}>
          <AtlasGroup title="Reading state" kind="reading" items={atlas.reading} />
          <AtlasGroup title="Ratings" kind="rating" items={atlas.ratings} />
          <AtlasGroup title="Favourites" kind="favourite" items={atlas.favourites} />
          <AtlasGroup title="Formats" kind="format" items={atlas.formats} />
          <AtlasGroup title="Authors" kind="author" items={atlas.authors} />
          <AtlasGroup title="Series" kind="series" items={atlas.series} />
          <AtlasGroup title="Genres" kind="genre" items={atlas.genres} />
          <AtlasGroup title="Folders" kind="space" items={atlas.spaces} />
          <AtlasGroup title="Availability" kind="status" items={atlas.status} />
        </View>:<>
          <View style={styles.atlasSearchRow}>
            <TextInput maxFontSizeMultiplier={1.15} value={atlasSearch} onChangeText={setAtlasSearch} onSubmitEditing={atlasSearchGo} returnKeyType="search" placeholder="Find a title, person, series, collection or tag" placeholderTextColor={p.muted} style={[styles.atlasSearchInput,{color:p.ink}]}/>
            <Pressable accessibilityRole="button" accessibilityLabel="Find in Atlas" onPress={atlasSearchGo} style={styles.atlasSearchButton}><UiIcon name="search" color={p.ink} size={20}/></Pressable>
          </View>

          <View style={styles.atlasConstellationStage}>
            <View style={[styles.atlasViewport,{height:viewHeight,width:ringSize,alignSelf:'center',minHeight:viewHeight,flexBasis:'auto',flexShrink:0,backgroundColor:'transparent'}]}
              onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true}
              onResponderGrant={atlasGestureStart} onResponderMove={atlasGestureMove}
              onResponderRelease={atlasGestureEnd} onResponderTerminate={()=>{atlasGesture.current=null}}>
              <View pointerEvents="none" style={styles.atlasConstellationGlow}><AmbientGlow color={ambientHaloColor} size={Math.max(680,ringSize*1.35)} strength={darkMode?.72:.52}/></View>
              <View pointerEvents="none" style={[styles.atlasRingLayer,{width:ringSize,height:ringSize}]}>
                <DataRing size={ringSize} items={atlasRingItems} ink={p.ink} muted={p.muted} track={p.line} thickness={22}/>
                {atlasBreakdown?<Animated.View style={[styles.atlasSelectedRingPulse,{width:ringSize-8,height:ringSize-8,borderRadius:(ringSize-8)/2,borderColor:atlasBreakdown==='Genre'?'#E2736B':atlasBreakdown==='Format'?'#62AFC1':'#A78BC7',opacity:atlasPulse.interpolate({inputRange:[0,1],outputRange:[.22,0]}),transform:[{scale:atlasPulse.interpolate({inputRange:[0,1],outputRange:[1,1.035]})}]}]}/>:null}
                <View style={[styles.atlasInnerRing,{width:ringSize-42,height:ringSize-42,borderRadius:(ringSize-42)/2,borderColor:p.line}]}/>
              </View>

              <View style={[styles.atlasUniverseCanvas,{width:atlasUniverse.width,height:atlasUniverse.height,left:atlasTransform.x,top:atlasTransform.y,transform:[{scale:atlasTransform.scale}],transformOrigin:'top left'} as any]}>
                {renderedEdges.map(edge=>{const from=nodeMap.get(edge.from),to=nodeMap.get(edge.to);return from&&to?<AtlasEdgeView key={edge.id} from={from} to={to} kind={edge.kind}/>:null})}
                {renderedNodes.map(node=><AtlasUniverseNodeView key={node.id} node={node}/>)}
              </View>

              <View style={styles.atlasViewportTools}>
                <Pressable accessibilityRole="button" accessibilityLabel="Fit Atlas" onPress={atlasResetView} style={[styles.atlasToolButton,{backgroundColor:p.raised}]}><UiIcon name="fit" color={p.ink} size={18}/></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={()=>animateAtlasTransform({...atlasTransform,scale:Math.max(.18,atlasTransform.scale-.15)},180)} style={[styles.iconButton,styles.atlasZoomButton,{backgroundColor:p.raised}]}><UiIcon name="zoomOut" color={p.ink} size={18}/></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={()=>animateAtlasTransform({...atlasTransform,scale:Math.min(2.25,atlasTransform.scale+.15)},180)} style={[styles.iconButton,styles.atlasZoomButton,{backgroundColor:p.raised}]}><UiIcon name="zoomIn" color={p.ink} size={18}/></Pressable>
              </View>

              <Pressable accessibilityRole="button" accessibilityState={{selected:atlasBreakdown==='Genre'}} accessibilityLabel="Show genre breakdown" onPress={()=>selectAtlasBreakdown('Genre')} style={[styles.atlasRingControl,styles.atlasRingControlGenre,{borderColor:atlasBreakdown==='Genre'?'#E2736B':'#8F5753',backgroundColor:p.paper==='#000000'?'rgba(25,29,38,.92)':'rgba(255,255,255,.94)'}]}>
                {atlasBreakdown==='Genre'?<Animated.View pointerEvents="none" style={[styles.atlasRingControlPulse,{borderColor:'#FF9A92',backgroundColor:'rgba(255,154,146,.14)',opacity:atlasPulse.interpolate({inputRange:[0,1],outputRange:[.48,0]}),transform:[{scale:atlasPulse.interpolate({inputRange:[0,1],outputRange:[1,1.26]})}]}]}/>:null}
                <UiIcon name="bookOpen" color="#E2736B" size={19}/>
                <Text style={[styles.atlasRingControlLabel,{color:'#E2736B'}]}>GENRE</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{selected:atlasBreakdown==='Format'}} accessibilityLabel="Show format breakdown" onPress={()=>selectAtlasBreakdown('Format')} style={[styles.atlasRingControl,styles.atlasRingControlFormat,{borderColor:atlasBreakdown==='Format'?'#62AFC1':'#466F78',backgroundColor:p.paper==='#000000'?'rgba(25,29,38,.92)':'rgba(255,255,255,.94)'}]}>
                {atlasBreakdown==='Format'?<Animated.View pointerEvents="none" style={[styles.atlasRingControlPulse,{borderColor:'#88D7E8',backgroundColor:'rgba(136,215,232,.14)',opacity:atlasPulse.interpolate({inputRange:[0,1],outputRange:[.48,0]}),transform:[{scale:atlasPulse.interpolate({inputRange:[0,1],outputRange:[1,1.26]})}]}]}/>:null}
                <UiIcon name="layers" color="#62AFC1" size={19}/>
                <Text style={[styles.atlasRingControlLabel,{color:'#62AFC1'}]}>FORMAT</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{selected:atlasBreakdown==='Published year'}} accessibilityLabel="Show publication year breakdown" onPress={()=>selectAtlasBreakdown('Published year')} style={[styles.atlasRingControl,styles.atlasRingControlYear,{borderColor:atlasBreakdown==='Published year'?'#A78BC7':'#6F6086',backgroundColor:p.paper==='#000000'?'rgba(25,29,38,.92)':'rgba(255,255,255,.94)'}]}>
                {atlasBreakdown==='Published year'?<Animated.View pointerEvents="none" style={[styles.atlasRingControlPulse,{borderColor:'#C7A6EE',backgroundColor:'rgba(199,166,238,.14)',opacity:atlasPulse.interpolate({inputRange:[0,1],outputRange:[.48,0]}),transform:[{scale:atlasPulse.interpolate({inputRange:[0,1],outputRange:[1,1.26]})}]}]}/>:null}
                <UiIcon name="calendar" color="#A78BC7" size={19}/>
                <Text style={[styles.atlasRingControlLabel,{color:'#A78BC7'}]}>YEAR</Text>
              </Pressable>

              {atlasUniverse.hiddenWorks?<View style={[styles.atlasClusterNotice,{backgroundColor:p.paper}]}><Text style={[styles.meta,{color:p.muted}]}>A stable sample is shown for smooth navigation · {atlasUniverse.hiddenWorks} more works remain available through search and clusters.</Text></View>:null}
            </View>
            {atlasNodeId?<Animated.View style={[
              styles.atlasInspectorReveal,
              foldLayout?styles.atlasInspectorRevealWide:styles.atlasInspectorRevealMobile,
              {opacity:atlasInspectorAnim,transform:[
                {translateY:atlasInspectorAnim.interpolate({inputRange:[0,1],outputRange:[foldLayout?-8:18,0]})},
                {translateX:atlasInspectorAnim.interpolate({inputRange:[0,1],outputRange:[foldLayout?18:0,0]})},
                {scale:atlasInspectorAnim.interpolate({inputRange:[0,1],outputRange:[.96,1]})},
              ]}
            ]}><AtlasInspector/></Animated.View>:null}
          </View>

          {atlasBreakdown?<Animated.View style={[styles.atlasBreakdownReveal,{maxHeight:atlasBreakdownAnim.interpolate({inputRange:[0,1],outputRange:[0,520]}),opacity:atlasBreakdownAnim}]}>
            <Animated.View style={[styles.atlasBreakdownSheet,{borderColor:p.line,backgroundColor:p.paper==='#000000'?'rgba(11,23,37,.96)':'rgba(255,255,255,.96)',opacity:atlasBreakdownAnim,transform:[{translateY:atlasBreakdownAnim.interpolate({inputRange:[0,1],outputRange:[14,0]})}]}]}>
            <View style={styles.atlasBreakdownHandle}><View style={[styles.atlasBreakdownHandleBar,{backgroundColor:p.muted}]}/></View>
            <View style={styles.atlasBreakdownHeader}>
              <Animated.View style={[styles.atlasBreakdownBadge,{borderColor:atlasBreakdown==='Genre'?'#E2736B':atlasBreakdown==='Format'?'#62AFC1':'#A78BC7',backgroundColor:p.card}]}>
                <UiIcon name={atlasBreakdown==='Genre'?'bookOpen':atlasBreakdown==='Format'?'layers':'calendar'} color={atlasBreakdown==='Genre'?'#E2736B':atlasBreakdown==='Format'?'#62AFC1':'#A78BC7'} size={22}/>
              </Animated.View>
              <View style={{flex:1,minWidth:0}}>
                <Text style={[styles.atlasBreakdownTitle,{color:p.ink}]}>{atlasBreakdown==='Published year'?'Year':atlasBreakdown}</Text>
                <Text style={[styles.atlasBreakdownSubtitle,{color:p.muted}]}>Breakdown of your library</Text>
              </View>
            </View>
            <View style={styles.atlasBreakdownRows}>
              {breakdown.map(item=>{
                const percent=Math.round(item.count/Math.max(1,atlasUniverseWorks.length)*100);
                return <View key={item.label} style={styles.atlasBreakdownRow}>
                  <View style={[styles.atlasBreakdownDot,{backgroundColor:item.color}]}/>
                  <Text numberOfLines={1} style={[styles.atlasBreakdownName,{color:p.ink}]}>{item.label}</Text>
                  <View style={[styles.atlasBreakdownTrack,{backgroundColor:p.card}]}>
                    <Animated.View style={[styles.atlasBreakdownFill,{width:(percent+'%') as any,backgroundColor:item.color}]}/>
                  </View>
                  <Text style={[styles.atlasBreakdownCount,{color:p.ink}]}>{item.count}</Text>
                  <Text style={[styles.atlasBreakdownPercent,{color:p.muted}]}>{percent}%</Text>
                </View>;
              })}
              {!breakdown.length?<Text style={[styles.meta,{color:p.muted}]}>Add books to reveal your library’s patterns.</Text>:null}
            </View>
            {atlasBreakdown==='Published year'?<Text style={[styles.atlasBreakdownNote,{color:p.muted}]}>Dates come from recorded metadata. Books without a verified publication date are grouped as not recorded.</Text>:null}
            </Animated.View>
          </Animated.View>:null}

          <Animated.View style={[styles.atlasUniverseStats,{borderTopColor:p.line,transform:[{translateY:atlasBreakdown||atlasNodeId?8:0}]}]}>
            <View style={styles.atlasUniverseStatsHeader}>
              <View style={{flex:1,minWidth:0}}>
                <Text style={[styles.atlasUniverseStatsTitle,{color:p.ink}]}>Universe Stats</Text>
                <Text style={[styles.atlasUniverseStatsCopy,{color:p.muted}]}>The structure and relationships inside your library.</Text>
              </View>
              <Text style={[styles.atlasUniverseStatsTotal,{color:p.sage}]}>{atlasUniverseWorks.length} works</Text>
            </View>
            <View style={styles.atlasUniverseStatsGrid}>
              {universeStats.map(item=><View key={item.label} style={[styles.atlasUniverseStat,width>=760&&styles.atlasUniverseStatWide,{borderBottomColor:p.line}]}>
                <Text style={[styles.atlasUniverseStatValue,{color:p.ink}]}>{item.value}</Text>
                <Text style={[styles.atlasUniverseStatLabel,{color:p.muted}]}>{item.label}</Text>
                <Text style={[styles.atlasUniverseStatCopy,{color:p.muted}]}>{item.copy}</Text>
              </View>)}
            </View>
            <View style={[styles.atlasUniverseHighlights,{borderTopColor:p.line}]}>
              <Text style={[styles.atlasUniverseHighlightsKicker,{color:p.muted}]}>UNIVERSE HIGHLIGHTS</Text>
              {[
                {label:'Most connected',node:mostConnectedNode,value:mostConnectedNode?mostConnectedNode.label:'—',meta:mostConnectedNode?(universeDegrees.get(mostConnectedNode.id)||0)+' links':'No relationships yet'},
                {label:'Largest constellation',node:largestConstellation,value:largestConstellation?largestConstellation.label:'—',meta:largestConstellation?largestConstellation.count+' works':'No genre clusters yet'},
                {label:'Deepest series',node:deepestSeries,value:deepestSeries?deepestSeries.label:'—',meta:deepestSeries?deepestSeries.count+' works':'No series yet'},
              ].map(item=><Pressable key={item.label} disabled={!item.node} accessibilityRole={item.node?'button':undefined} accessibilityLabel={item.node?'Focus '+item.label+' '+item.value:undefined} onPress={()=>item.node&&focusAtlasNode(item.node.id)} style={({pressed})=>[styles.atlasUniverseHighlightRow,{borderBottomColor:p.line,opacity:pressed ? .72 : 1}]}>
                <Text style={[styles.atlasUniverseHighlightLabel,{color:p.muted}]}>{item.label}</Text>
                <View style={{flex:1,minWidth:0}}>
                  <Text numberOfLines={1} style={[styles.atlasUniverseHighlightValue,{color:p.ink}]}>{item.value}</Text>
                  <Text style={[styles.atlasUniverseHighlightMeta,{color:p.muted}]}>{item.meta}</Text>
                </View>
                {item.node?<View style={{transform:[{rotate:'-90deg'}]}}><UiIcon name="chevronDown" color={p.muted} size={15}/></View>:null}
              </Pressable>)}
            </View>
          </Animated.View>

          <Text style={[styles.atlasHint,{color:p.muted}]}>{atlasBreakdown?'Pinch, pan and explore':'Choose Genre, Format or Year to reveal the library breakdown'}</Text>
        </>}
      </ScrollView>
    );
  }

  async function saveInsightGoals(){
    const next=sanitizeInsightGoal({completedTarget:Number(goalDraft.completed),annotationTarget:Number(goalDraft.annotations)});
    setInsightGoal(next);setGoalDraft({completed:String(next.completedTarget),annotations:String(next.annotationTarget)});
    await setPersistedJSON(insightGoalKey,next);
  }

  function InsightGoalCard({title,value,target,progress,draft,onDraft}:{title:string;value:number;target:number;progress:number;draft:string;onDraft:(value:string)=>void}){
    return <View style={[styles.insightGoalCard,{borderBottomColor:p.line}]}>
      <View style={styles.profileBreakdownRow}>
        <View style={{flex:1}}>
          <Text style={[styles.bookTitle,{color:p.ink}]}>{title}</Text>
          <Text style={[styles.meta,{color:p.muted}]}>{value} of {target}</Text>
        </View>
        <TextInput maxFontSizeMultiplier={1.15} accessibilityLabel={title+' target'} keyboardType="number-pad" value={draft} onChangeText={onDraft} style={[styles.insightGoalInput,{color:p.ink,borderBottomColor:p.line}]}/>
      </View>
      <View style={[styles.achievementTrack,{backgroundColor:p.line}]}><View style={[styles.achievementFill,{backgroundColor:p.sage,width:`${Math.round(progress*100)}%`}]} /></View>
    </View>;
  }

  function Insights(){
    const summary=insightSummary;
    const stats=profileStats;
    const darkStats=p.paper==='#000000';
    const statsPalette={
      canvas:darkStats?'#07111D':'#F7F7F5',
      panel:darkStats?'#0B1725':'#FFFFFF',
      panelRaised:darkStats?'#0E1C2C':'#FAFAF8',
      line:darkStats?'#26364A':'#D9D7D0',
      ink:darkStats?'#F3F0E8':'#111316',
      muted:darkStats?'#A9B4C5':'#68717D',
      gold:darkStats?'#E3BC67':'#A67C2E',
      goldSoft:darkStats?'#8F7446':'#E6D7B6',
      blue:darkStats?'#8FB5D1':'#6C8EA8',
      blueDeep:darkStats?'#435B78':'#98AABD',
      teal:darkStats?'#89C7CB':'#6EA3A5',
      mint:darkStats?'#73DDB0':'#4FA97F',
    };

    const activitySource=(sourceFilter==='local'||sourceFilter==='downloaded')?[]:serverActivity;
    const statsNow=new Date();
    const statsPeriodStart=new Date(statsNow);
    statsPeriodStart.setHours(0,0,0,0);
    if(readerStatsPeriod==='Week'){
      const mondayOffset=(statsPeriodStart.getDay()+6)%7;
      statsPeriodStart.setDate(statsPeriodStart.getDate()-mondayOffset);
    }else if(readerStatsPeriod==='Month'){
      statsPeriodStart.setDate(1);
    }
    const periodStartMs=statsPeriodStart.getTime();
    const periodEndMs=statsNow.getTime();
    const inStatsPeriod=(date:Date)=>{
      const value=date.getTime();
      return Number.isFinite(value)&&value>=periodStartMs&&value<=periodEndMs;
    };
    const periodActivity=[...activitySource].filter(item=>inStatsPeriod(new Date(item.updatedAt*1000))).sort((a,b)=>b.updatedAt-a.updatedAt);
    const periodLabel=readerStatsPeriod==='Day'?'Today':readerStatsPeriod==='Week'?'This week':'This month';

    const completedGoal=Math.max(1,summary.completedGoal.target);
    const completed=new Set(periodActivity.filter(item=>item.completed).map(item=>item.workId)).size;
    const progressRemaining=Math.max(0,completedGoal-completed);
    const progressPercent=Math.min(100,Math.round(completed/completedGoal*100));
    const totalActivitySeconds=periodActivity.reduce((sum,item)=>sum+Math.max(0,item.activeSeconds||0),0);
    const minutesRead=Math.round(totalActivitySeconds/60);
    const ritualScopeDays=Object.entries(ritualDays).filter(([day,seconds])=>seconds>=60&&inStatsPeriod(new Date(day+'T12:00:00'))).length;
    const activeDays=periodActivity.length
      ? new Set(periodActivity.map(item=>localDay(new Date(item.updatedAt*1000)))).size
      : ritualScopeDays;
    const paceMinutes=activeDays?Math.round(minutesRead/activeDays):0;
    const sessionSeconds=periodActivity.map(item=>Math.max(0,item.activeSeconds||0)).filter(Boolean);
    const longestSessionMinutes=sessionSeconds.length?Math.max(1,Math.round(Math.max(...sessionSeconds)/60)):0;

    const metricCards=[
      {label:'Books read',value:completed,icon:'bookOpen' as UiIconName},
      {label:'Minutes read',value:minutesRead.toLocaleString(),icon:'clock' as UiIconName},
      {label:'Longest read',value:(longestSessionMinutes||0)+' min',icon:'gauge' as UiIconName},
      {label:'Reading days',value:activeDays,icon:'calendar' as UiIconName},
      {label:'Day streak',value:ritual.currentStreak,icon:'flame' as UiIconName},
    ];

    const hourTotals=Array.from({length:24},()=>0);
    const dayTotals=Array.from({length:7},()=>0);
    const monthTotals=Array.from({length:12},()=>0);
    for(const item of periodActivity){
      const date=new Date(item.updatedAt*1000);
      const seconds=Math.max(0,item.activeSeconds||0);
      hourTotals[date.getHours()]+=seconds;
      dayTotals[(date.getDay()+6)%7]+=seconds;
      monthTotals[date.getMonth()]+=seconds;
    }
    const peakHour=hourTotals.reduce((best,value,index)=>value>hourTotals[best]?index:best,0);
    const peakValue=hourTotals[peakHour]||0;
    const peakEnd=(peakHour+3)%24;
    const displayHour=(hour:number)=>hour===0?'12':hour>12?String(hour-12):String(hour);
    const peakRange=peakValue?(displayHour(peakHour)+'–'+displayHour(peakEnd)+' '+(peakHour>=12?'PM':'AM')):'—';
    const peakShare=totalActivitySeconds?Math.round(peakValue/totalActivitySeconds*100):0;
    const maxHour=Math.max(1,...hourTotals);
    const maxDay=Math.max(1,...dayTotals);
    const maxMonth=Math.max(1,...monthTotals);
    const averageSessionMinutes=sessionSeconds.length?Math.max(1,Math.round(sessionSeconds.reduce((sum,value)=>sum+value,0)/sessionSeconds.length/60)):0;
    const weekdayLabels=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const peakDayIndex=dayTotals.reduce((best,value,index)=>value>dayTotals[best]?index:best,0);
    const mostActiveDay=dayTotals[peakDayIndex]?weekdayLabels[peakDayIndex]:'—';
    const peakMonthIndex=monthTotals.reduce((best,value,index)=>value>monthTotals[best]?index:best,0);
    const mostActiveMonth=monthTotals[peakMonthIndex]?new Date(2000,peakMonthIndex,1).toLocaleDateString(undefined,{month:'long'}):'—';

    const startedWorks=insightWorks.filter(work=>work.readingState!=='not-started');
    const finishedWorks=insightWorks.filter(work=>work.readingState==='finished');
    const completionRate=startedWorks.length?Math.round(finishedWorks.length/startedWorks.length*100):0;
    const inProgressCount=insightWorks.filter(work=>work.readingState==='in-progress').length;
    const ratedFinished=finishedWorks.filter(work=>work.rating>0);
    const finishedAverageRating=ratedFinished.length?ratedFinished.reduce((sum,work)=>sum+work.rating,0)/ratedFinished.length:0;
    const favouritesCount=insightWorks.filter(work=>work.favourite).length;
    const favouritesRatio=insightWorks.length?Math.round(favouritesCount/insightWorks.length*100):0;

    const seriesGroups=new Map<string,UnifiedWork[]>();
    for(const work of insightWorks){
      const series=String(work.series||'').trim();
      if(!series)continue;
      seriesGroups.set(series,[...(seriesGroups.get(series)||[]),work]);
    }
    const trackedSeries=[...seriesGroups.values()].filter(items=>items.length>1);
    const completedSeries=trackedSeries.filter(items=>items.every(work=>work.readingState==='finished')).length;
    const seriesCompletionRate=trackedSeries.length?Math.round(completedSeries/trackedSeries.length*100):0;

    const periodAnnotations=readerAnnotations.filter(item=>inStatsPeriod(new Date(item.createdAt)));
    const highlightCount=periodAnnotations.filter(item=>item.kind==='highlight').length;
    const noteCount=periodAnnotations.filter(item=>item.kind==='note').length;

    const finishMonthSets=Array.from({length:12},()=>new Set<number>());
    for(const item of periodActivity){
      if(!item.completed)continue;
      finishMonthSets[new Date(item.updatedAt*1000).getMonth()].add(item.workId);
    }
    const finishesByMonth=finishMonthSets.map(items=>items.size);
    const maxMonthlyFinishes=Math.max(1,...finishesByMonth);

    const activeDateKeys=new Set<string>();
    for(const item of periodActivity)activeDateKeys.add(new Date(item.updatedAt*1000).toISOString().slice(0,10));
    for(const [day,seconds] of Object.entries(ritualDays)){
      if(seconds<60||!inStatsPeriod(new Date(day+'T12:00:00')))continue;
      activeDateKeys.add(day);
    }
    const consistencyEnd=new Date(statsNow);
    const consistencyStart=new Date(statsPeriodStart);
    consistencyStart.setHours(0,0,0,0);
    consistencyEnd.setHours(0,0,0,0);
    const trackedCalendarDays=Math.max(1,Math.floor((consistencyEnd.getTime()-consistencyStart.getTime())/86400000)+1);
    const consistencyPercent=Math.min(100,Math.round(activeDateKeys.size/trackedCalendarDays*100));

    const completionRows=(field:'format'|'genre')=>{
      const grouped=new Map<string,{total:number;finished:number}>();
      for(const work of insightWorks){
        const label=String(work[field]||'').trim()||'Other';
        const current=grouped.get(label)||{total:0,finished:0};
        current.total+=1;
        if(work.readingState==='finished')current.finished+=1;
        grouped.set(label,current);
      }
      return [...grouped].sort((a,b)=>b[1].total-a[1].total).slice(0,5).map(([label,value])=>({
        label,total:value.total,finished:value.finished,percent:value.total?Math.round(value.finished/value.total*100):0,
      }));
    };
    const formatCompletionRows=completionRows('format');
    const genreCompletionRows=completionRows('genre');

    const anchorDate=new Date(statsNow);
    anchorDate.setHours(0,0,0,0);
    const recentDays=Array.from({length:7},(_,index)=>{
      const date=new Date(anchorDate);date.setDate(date.getDate()-6+index);
      return {date,key:localDay(date),label:date.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3)};
    });
    const heatRows=Array.from({length:12},(_,row)=>recentDays.map(day=>{
      let seconds=0;
      for(const item of periodActivity){
        const date=new Date(item.updatedAt*1000);
        if(localDay(date)!==day.key)continue;
        const hour=date.getHours();
        if(hour>=row*2&&hour<row*2+2)seconds+=Math.max(0,item.activeSeconds||0);
      }
      return seconds;
    }));
    const heatMax=Math.max(1,...heatRows.flat());

    const chartColours=[statsPalette.gold,statsPalette.blue,statsPalette.goldSoft,statsPalette.blueDeep,statsPalette.teal,'#5D718D'];
    const formatItems:ChartItem[]=atlas.formats.slice(0,6).map(([label,count],index)=>({label,count,color:chartColours[index%chartColours.length]}));
    const genreCounts:ChartItem[]=atlas.genres.slice(0,6).map(([label,count],index)=>({label,count,color:chartColours[index%chartColours.length]}));
    const workById=new Map(serverWorks.map(work=>[work.id,work]));
    const genreTime=new Map<string,number>();
    for(const item of periodActivity){
      const genre=workById.get(item.workId)?.genre||'Other';
      genreTime.set(genre,(genreTime.get(genre)||0)+Math.max(0,item.activeSeconds||0));
    }
    const genreTimeItems:ChartItem[]=[...genreTime].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,seconds],index)=>({label,count:Math.max(1,Math.round(seconds/60)),color:chartColours[index%chartColours.length]}));
    const genreItems=genreTimeItems.length?genreTimeItems:genreCounts;
    const genreTotal=genreItems.reduce((sum,item)=>sum+item.count,0);
    const formatsTotal=formatItems.reduce((sum,item)=>sum+item.count,0);

    const Legend=({items,total}:{items:ChartItem[];total:number})=><View style={styles.statsLegend}>
      {items.slice(0,6).map(item=><View key={item.label} style={styles.statsLegendRow}>
        <View style={[styles.statsLegendDot,{backgroundColor:item.color}]}/>
        <Text numberOfLines={1} style={[styles.statsLegendName,{color:statsPalette.muted}]}>{item.label}</Text>
        <Text style={[styles.statsLegendCount,{color:statsPalette.ink}]}>{item.count}</Text>
        <Text style={[styles.statsLegendPercent,{color:statsPalette.muted}]}>{Math.round(item.count/Math.max(1,total)*100)}%</Text>
      </View>)}
    </View>;

    const DetailMetric=({label,value,meta}:{label:string;value:string;meta?:string})=><View style={styles.statsDetailMetric}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.75} style={[styles.statsDetailValue,{color:statsPalette.ink}]}>{value}</Text>
      <Text style={[styles.statsDetailLabel,{color:statsPalette.muted}]}>{label}</Text>
      {meta?<Text style={[styles.statsDetailMeta,{color:statsPalette.muted}]}>{meta}</Text>:null}
    </View>;

    const CompletionRows=({items}:{items:Array<{label:string;total:number;finished:number;percent:number}>})=><View style={styles.statsCompletionRows}>
      {items.map(item=><View key={item.label} style={styles.statsCompletionRow}>
        <View style={styles.statsCompletionCopy}>
          <Text numberOfLines={1} style={[styles.statsCompletionLabel,{color:statsPalette.muted}]}>{item.label}</Text>
          <Text style={[styles.statsCompletionValue,{color:statsPalette.ink}]}>{item.finished}/{item.total}</Text>
        </View>
        <View style={[styles.statsCompletionTrack,{backgroundColor:statsPalette.panelRaised}]}>
          <View style={[styles.statsCompletionFill,{backgroundColor:statsPalette.teal,width:(item.percent+'%') as any}]}/>
        </View>
        <Text style={[styles.statsCompletionPercent,{color:statsPalette.muted}]}>{item.percent}%</Text>
      </View>)}
    </View>;

    const CardHeader=({title,subtitle,icon}:{title:string;subtitle:string;icon:UiIconName})=><View style={styles.statsCardHeader}>
      <View style={[styles.statsIconOrb,{backgroundColor:statsPalette.panelRaised}]}><UiIcon name={icon} color={statsPalette.gold} size={19}/></View>
      <View style={{flex:1,minWidth:0}}>
        <Text style={[styles.statsCardTitle,{color:statsPalette.ink}]}>{title}</Text>
        <Text style={[styles.statsCardSubtitle,{color:statsPalette.muted}]}>{subtitle}</Text>
      </View>
    </View>;

    const timeRhythm=<View style={[styles.statsRhythmBody,width>=700&&styles.statsRhythmBodyWide]}>
      <View style={[styles.statsRhythmDial,{width:width>=700?246:194,height:width>=700?246:194}]}>
        {hourTotals.map((value,index)=>{
          const size=width>=700?246:194;
          const ring=index%2===0?size/2-15:size/2-26;
          const angle=index/24*Math.PI*2-Math.PI/2;
          const intensity=value/maxHour;
          return <View key={'outer-'+index} style={{
            position:'absolute',
            left:size/2+Math.cos(angle)*ring-5,
            top:size/2+Math.sin(angle)*ring-12,
            width:10,height:24,borderRadius:3,
            backgroundColor:value?statsPalette.gold:statsPalette.blueDeep,
            opacity:value?0.30+intensity*.70:.35,
            transform:[{rotate:(index/24*360)+'deg'}],
          }}/>;
        })}
        {hourTotals.map((value,index)=>{
          const size=width>=700?246:194;
          const ring=size/2-47;
          const angle=index/24*Math.PI*2-Math.PI/2;
          const intensity=value/maxHour;
          return <View key={'inner-'+index} style={{
            position:'absolute',
            left:size/2+Math.cos(angle)*ring-3,
            top:size/2+Math.sin(angle)*ring-9,
            width:6,height:18,borderRadius:2,
            backgroundColor:value?statsPalette.goldSoft:statsPalette.blueDeep,
            opacity:value?0.24+intensity*.60:.26,
            transform:[{rotate:(index/24*360)+'deg'}],
          }}/>;
        })}
        <Text style={[styles.statsClockTop,{color:statsPalette.ink}]}>24</Text>
        <Text style={[styles.statsClockRight,{color:statsPalette.ink}]}>6</Text>
        <Text style={[styles.statsClockBottom,{color:statsPalette.ink}]}>12</Text>
        <Text style={[styles.statsClockLeft,{color:statsPalette.ink}]}>18</Text>
        <View style={[styles.statsRhythmDialInner,{borderColor:statsPalette.line,backgroundColor:statsPalette.canvas}]}>
          <Text style={[styles.statsDialKicker,{color:statsPalette.muted}]}>Peak</Text>
          <Text style={[styles.statsDialKicker,{color:statsPalette.muted}]}>Reading Hours</Text>
          <Text style={[styles.statsDialValue,{color:statsPalette.ink}]}>{peakRange}</Text>
          <Text style={[styles.statsDialMeta,{color:statsPalette.muted}]}>{peakShare}% of</Text>
          <Text style={[styles.statsDialMeta,{color:statsPalette.muted}]}>your reading</Text>
        </View>
      </View>
      <View style={styles.statsHeatmapWrap}>
        <View style={styles.statsHeatHeader}>
          <View style={{width:34}}/>
          {recentDays.map(day=><Text key={day.key} style={[styles.statsHeatDay,{color:statsPalette.muted}]}>{day.label}</Text>)}
        </View>
        {heatRows.map((row,rowIndex)=><View key={rowIndex} style={styles.statsHeatRow}>
          <Text style={[styles.statsHeatTime,{color:statsPalette.muted}]}>{rowIndex===0?'12 AM':rowIndex===3?'6 AM':rowIndex===6?'12 PM':rowIndex===9?'6 PM':''}</Text>
          {row.map((value,index)=>{
            const ratio=value/heatMax;
            return <View key={index} style={[styles.statsHeatCell,{backgroundColor:value?statsPalette.gold:statsPalette.panelRaised,borderColor:statsPalette.line,opacity:value?0.28+ratio*.72:1}]}/>;
          })}
        </View>)}
        <View style={styles.statsHeatLegend}>
          <View style={[styles.statsHeatLegendDot,{backgroundColor:statsPalette.blueDeep,opacity:.6}]}/><View style={[styles.statsHeatLegendDot,{backgroundColor:statsPalette.blueDeep}]}/>
          <Text style={[styles.statsHeatLegendText,{color:statsPalette.muted}]}>Less reading</Text>
          <View style={{flex:1}}/>
          <View style={[styles.statsHeatLegendDot,{backgroundColor:statsPalette.gold,opacity:.45}]}/><View style={[styles.statsHeatLegendDot,{backgroundColor:statsPalette.gold,opacity:.72}]}/><View style={[styles.statsHeatLegendDot,{backgroundColor:statsPalette.gold}]}/>
          <Text style={[styles.statsHeatLegendText,{color:statsPalette.muted}]}>More reading</Text>
        </View>
      </View>
    </View>;

    const dayRhythm=<View style={styles.statsRhythmBars}>
      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label,index)=><View key={label} style={styles.statsRhythmBarRow}>
        <Text style={[styles.statsRhythmBarLabel,{color:statsPalette.muted}]}>{label}</Text>
        <View style={[styles.statsRhythmTrack,{backgroundColor:statsPalette.panelRaised}]}>
          <View style={[styles.statsRhythmFill,{backgroundColor:statsPalette.gold,width:(Math.round(dayTotals[index]/maxDay*100)+'%') as any}]}/>
        </View>
        <Text style={[styles.statsRhythmBarValue,{color:statsPalette.ink}]}>{Math.round(dayTotals[index]/60)}m</Text>
      </View>)}
    </View>;

    const monthRhythm=<View style={styles.statsMonthGrid}>
      {Array.from({length:12},(_,index)=>{
        const label=new Date(2000,index,1).toLocaleDateString(undefined,{month:'short'});
        const ratio=monthTotals[index]/maxMonth;
        return <View key={label} style={styles.statsMonthCell}>
          <View style={[styles.statsMonthBarTrack,{backgroundColor:statsPalette.panelRaised}]}>
            <View style={[styles.statsMonthBarFill,{backgroundColor:statsPalette.gold,height:(Math.max(4,Math.round(ratio*100))+'%') as any,opacity:.35+ratio*.65}]}/>
          </View>
          <Text style={[styles.statsMonthLabel,{color:statsPalette.muted}]}>{label}</Text>
          <Text style={[styles.statsMonthValue,{color:statsPalette.ink}]}>{Math.round(monthTotals[index]/60)}m</Text>
        </View>;
      })}
    </View>;

    const rhythmCard=<View style={styles.statsHeroCard}>
      <View style={[styles.statsRhythmTop,width<520&&styles.statsRhythmTopCompact]}>
        <CardHeader title="Reading Rhythm" subtitle={'When and how you read · '+periodLabel} icon="clock"/>
        <View style={[styles.statsMiniSegment,{borderColor:statsPalette.line,backgroundColor:statsPalette.canvas}]}>
          {(['Day','Week','Month'] as const).map(label=>{
            const selected=readerStatsPeriod===label;
            return <Pressable key={label} accessibilityRole="button" accessibilityLabel={'Show '+label.toLowerCase()+' reading data'} accessibilityState={{selected}} onPress={()=>setReaderStatsPeriod(label)} style={[styles.statsMiniSegmentItem,selected&&{borderColor:statsPalette.gold,backgroundColor:statsPalette.panelRaised}]}>
              <Text style={{color:selected?statsPalette.ink:statsPalette.muted,fontSize:10.5,fontWeight:selected?'600':'500'}}>{label}</Text>
            </Pressable>;
          })}
        </View>
      </View>
      {timeRhythm}
    </View>;

    const readingProgressCard=<View style={[styles.statsDashboardCard,{borderTopColor:statsPalette.line}]}>
      <CardHeader title="Reading Progress" subtitle="Annual reading goal" icon="target"/>
      <View style={styles.statsCardBody}>
        <DataRing size={110} value={String(completed)} label={'of '+completedGoal+' books'} items={[{label:'Read',count:completed,color:statsPalette.gold},{label:'Remaining',count:progressRemaining,color:statsPalette.blueDeep}]} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={11}/>
        <View style={styles.statsCardSide}>
          <Text style={[styles.statsPercent,{color:statsPalette.gold}]}>{progressPercent}%</Text>
          <View style={[styles.statsProgressTrack,{backgroundColor:statsPalette.blueDeep}]}><View style={[styles.statsProgressFill,{backgroundColor:statsPalette.gold,width:(progressPercent+'%') as any}]}/></View>
          <View style={styles.statsStatusLine}><View style={[styles.statsSmallDot,{backgroundColor:statsPalette.blue}]}/><Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>{progressRemaining} books to go</Text></View>
          <View style={styles.statsStatusLine}><View style={[styles.statsSmallDot,{backgroundColor:statsPalette.mint}]}/><Text style={[styles.statsStatusText,{color:statsPalette.mint}]}>{progressPercent>=75?'On track':'Keep going'}</Text></View>
        </View>
      </View>
      <View style={styles.statsDetailGrid}>
        <DetailMetric label="Completion rate" value={completionRate+'%'} meta="of started works"/>
        <DetailMetric label="In progress" value={String(inProgressCount)} meta="currently active"/>
        <DetailMetric label="Series completed" value={trackedSeries.length?completedSeries+'/'+trackedSeries.length:'—'} meta={trackedSeries.length?seriesCompletionRate+'% of collected series':'No multi-book series yet'}/>
      </View>
      <View style={styles.statsFinishSection}>
        <Text style={[styles.statsMinorHeading,{color:statsPalette.muted}]}>Finishes by month · {periodLabel}</Text>
        <View style={styles.statsFinishMonths}>
          {finishesByMonth.map((value,index)=><View key={index} style={styles.statsFinishMonth}>
            <View style={[styles.statsFinishTrack,{backgroundColor:statsPalette.panelRaised}]}>
              <View style={[styles.statsFinishFill,{backgroundColor:statsPalette.gold,height:(Math.max(value?12:3,Math.round(value/maxMonthlyFinishes*100))+'%') as any,opacity:value?1:.25}]}/>
            </View>
            <Text style={[styles.statsFinishMonthLabel,{color:statsPalette.muted}]}>{new Date(2000,index,1).toLocaleDateString(undefined,{month:'narrow'})}</Text>
            <Text style={[styles.statsFinishMonthValue,{color:statsPalette.ink}]}>{value}</Text>
          </View>)}
        </View>
      </View>
    </View>;

    const formatCard=<View style={[styles.statsDashboardCard,width>=700&&styles.statsDashboardCardWide,{borderTopColor:statsPalette.line}]}>
      <CardHeader title="Format Breakdown" subtitle="How you read" icon="bookOpen"/>
      <View style={styles.statsCardBody}>
        <DataRing size={110} value={String(stats?.works||formatsTotal)} label="books" items={formatItems} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={11}/>
        {formatItems.length?<Legend items={formatItems} total={formatsTotal}/>:<Text style={[styles.meta,{color:statsPalette.muted,flex:1}]}>Add format metadata to reveal your mix.</Text>}
      </View>
      {formatCompletionRows.length?<View style={styles.statsSplitBlock}>
        <Text style={[styles.statsMinorHeading,{color:statsPalette.muted}]}>Completion by format</Text>
        <CompletionRows items={formatCompletionRows}/>
      </View>:null}
    </View>;

    const genreCard=<View style={[styles.statsDashboardCard,width>=700&&styles.statsDashboardCardWide,{borderTopColor:statsPalette.line}]}>
      <CardHeader title="Genre Reading Time" subtitle="Time spent in each genre" icon="layers"/>
      <View style={styles.statsCardBody}>
        <DataRing size={110} value={genreTimeItems.length?minutesRead.toLocaleString():String(genreTotal)} label={genreTimeItems.length?'minutes':'books'} items={genreItems} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={11}/>
        {genreItems.length?<Legend items={genreItems} total={genreTotal}/>:<Text style={[styles.meta,{color:statsPalette.muted,flex:1}]}>Genre activity will appear as you read.</Text>}
      </View>
      {genreCompletionRows.length?<View style={styles.statsSplitBlock}>
        <Text style={[styles.statsMinorHeading,{color:statsPalette.muted}]}>Completion by genre</Text>
        <CompletionRows items={genreCompletionRows}/>
      </View>:null}
    </View>;

    const paceTarget=Math.max(60,paceMinutes);
    const paceCard=<View style={[styles.statsDashboardCard,{borderTopColor:statsPalette.line}]}>
      <CardHeader title="Reading Pace" subtitle="Average on active reading days" icon="gauge"/>
      <View style={styles.statsCardBody}>
        <DataRing size={110} value={paceMinutes?String(paceMinutes):'—'} label="min / day" items={[{label:'Daily pace',count:paceMinutes,color:statsPalette.gold},{label:'Scale',count:Math.max(0,paceTarget-paceMinutes),color:statsPalette.blueDeep}]} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={11}/>
        <View style={styles.statsCardSide}>
          <Text style={[styles.statsPaceDelta,{color:statsPalette.gold}]}>{paceMinutes?paceMinutes+' min':'No activity yet'}</Text>
          <Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>Average reading and listening time across {activeDays} active day{activeDays===1?'':'s'}.</Text>
        </View>
      </View>
      <View style={styles.statsDetailGrid}>
        <DetailMetric label="Average session" value={averageSessionMinutes?averageSessionMinutes+' min':'—'}/>
        <DetailMetric label="Longest session" value={longestSessionMinutes?longestSessionMinutes+' min':'—'}/>
        <DetailMetric label="Most active day" value={mostActiveDay}/>
        <DetailMetric label="Most active month" value={mostActiveMonth}/>
      </View>
    </View>;

    const placesCard=<View style={[styles.statsDashboardCard,width>=700&&styles.statsDashboardCardWide,{borderTopColor:statsPalette.line}]}>
      <CardHeader title="Where You Read" subtitle="Your favourite reading spots" icon="pin"/>
      <View style={styles.statsCardBody}>
        <DataRing size={110} value="Private" label="places" items={[{label:'Private',count:1,color:statsPalette.goldSoft},{label:'Untracked',count:1,color:statsPalette.blueDeep}]} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={11}/>
        <View style={styles.statsCardSide}>
          <Text style={[styles.statsPaceDelta,{color:statsPalette.gold}]}>Location off</Text>
          <Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>Archivist does not collect location data. This section remains private unless an opt-in location feature is added.</Text>
        </View>
      </View>
    </View>;

    const streakCard=<View style={[styles.statsDashboardCard,width>=700&&styles.statsDashboardCardWide,{borderTopColor:statsPalette.line}]}>
      <CardHeader title="Reading Streaks" subtitle="Your consistency" icon="flame"/>
      <View style={styles.statsStreakTop}>
        <View style={{flex:1}}><Text style={[styles.statsStreakValue,{color:statsPalette.ink}]}>{ritual.currentStreak} days</Text><Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>Current streak</Text></View>
        <View style={[styles.statsVerticalRule,{backgroundColor:statsPalette.goldSoft}]}/>
        <View style={{flex:1}}><Text style={[styles.statsStreakValue,{color:statsPalette.ink}]}>{ritual.bestStreak} days</Text><Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>Longest streak</Text></View>
      </View>
      <View style={styles.statsWeekDots}>
        {recentDays.map(day=>{
          const active=(ritualDays[day.key]||0)>=60;
          return <View key={day.key} style={styles.statsWeekDay}><View style={[styles.statsWeekDot,{backgroundColor:active?statsPalette.gold:statsPalette.blueDeep,borderColor:active?statsPalette.gold:statsPalette.line}]}/><Text style={[styles.statsWeekLabel,{color:statsPalette.muted}]}>{day.label.slice(0,1)}</Text></View>;
        })}
      </View>
      <View style={styles.statsConsistencyRow}>
        <View>
          <Text style={[styles.statsConsistencyValue,{color:statsPalette.gold}]}>{consistencyPercent}%</Text>
          <Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>Reading consistency</Text>
        </View>
        <Text style={[styles.statsConsistencyCopy,{color:statsPalette.muted}]}>{activeDateKeys.size} active day{activeDateKeys.size===1?'':'s'} across {trackedCalendarDays} tracked calendar day{trackedCalendarDays===1?'':'s'}.</Text>
      </View>
    </View>;

    const tasteCard=<View style={[styles.statsDashboardCard,width>=700&&styles.statsDashboardCardWide,{borderTopColor:statsPalette.line}]}>
      <CardHeader title="Taste & Notes" subtitle="How you respond to what you read" icon="bookmark"/>
      <View style={styles.statsDetailGrid}>
        <DetailMetric label="Avg finished rating" value={ratedFinished.length?finishedAverageRating.toFixed(1)+' / 5':'—'} meta={ratedFinished.length?ratedFinished.length+' rated finish'+(ratedFinished.length===1?'':'es'):'No rated finishes yet'}/>
        <DetailMetric label="Favourites" value={favouritesRatio+'%'} meta={favouritesCount+' of '+insightWorks.length+' works'}/>
        <DetailMetric label="Annotations" value={String(periodAnnotations.length)} meta={noteCount+' notes'}/>
        <DetailMetric label="Highlights" value={String(highlightCount)} meta={periodLabel}/>
      </View>
    </View>;

    const primaryReadingCards=<View style={styles.statsPrimaryReadingStack}>
      {readingProgressCard}
      {paceCard}
    </View>;

    const breakdownCards=<View style={styles.statsDonutGrid}>
      {formatCard}
      {genreCard}
      {placesCard}
    </View>;

    const supportingCards=<View style={styles.statsSupportingGrid}>
      {streakCard}
      {tasteCard}
    </View>;

    return <ScrollView style={{backgroundColor:'transparent'}} contentContainerStyle={[styles.statsScreen,width>=600&&styles.statsScreenFold,width>=940&&styles.statsScreenWide]}>
      <PageHeader
        title="Reader Stats"
        subtitle="Your reading journey."
      />
      <View style={[styles.statsMetricRow,{borderTopColor:statsPalette.line,borderBottomColor:statsPalette.line}]}>
        {metricCards.map(card=><View key={card.label} style={[styles.statsMetricCard,width>=700?styles.statsMetricCardWide:styles.statsMetricCardPhone]}>
          <View style={[styles.statsMetricIcon,{backgroundColor:statsPalette.panelRaised}]}><UiIcon name={card.icon} color={statsPalette.gold} size={18}/></View>
          <View style={{flex:1,minWidth:0}}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.72} style={[styles.statsMetricValue,{color:statsPalette.ink}]}>{card.value}</Text>
            <Text numberOfLines={2} style={[styles.statsMetricLabel,{color:statsPalette.muted}]}>{card.label}</Text>
          </View>
        </View>)}
      </View>

      {rhythmCard}

      <View style={styles.statsSectionGroup}>
        <View style={styles.statsSectionHeading}>
          <Text style={[styles.statsSectionTitle,{color:statsPalette.ink}]}>Reading Breakdown</Text>
          <Text style={[styles.statsSectionCopy,{color:statsPalette.muted}]}>Progress, formats, genres, pace and reading context.</Text>
        </View>
        {primaryReadingCards}
        {breakdownCards}
      </View>

      <View style={styles.statsSectionGroup}>
        <View style={styles.statsSectionHeading}>
          <Text style={[styles.statsSectionTitle,{color:statsPalette.ink}]}>More Insights</Text>
          <Text style={[styles.statsSectionCopy,{color:statsPalette.muted}]}>Consistency, favourites, ratings and annotations.</Text>
        </View>
        {supportingCards}
      </View>

      {profileLoading&&session?<ActivityIndicator accessibilityLabel="Loading reader statistics" color={statsPalette.gold}/>:null}
    </ScrollView>;
  }

  function Profile() {
    const stats=profileStats;
    const overall=profileProgression?.overall||{level:1,xp:0,levelStartXp:0,nextLevelXp:330,progress:0,title:'Reader'};
    const identityRing:ChartItem[]=[
      {label:'Level progress',count:Math.max(.001,overall.progress),color:p.gold},
      {label:'Remaining',count:Math.max(.001,1-overall.progress),color:darkMode?'#29303A':'#D8CDBA'},
    ];
    const traits:string[]=[];
    const readDone=stats?.completedReading||0,listenDone=stats?.completedAudio||0;
    if(listenDone>readDone*1.35&&listenDone>=3)traits.push('Audio-first');
    else if(readDone>listenDone*1.35&&readDone>=3)traits.push('Page-led');
    else if(readDone>0&&listenDone>0)traits.push('Mixed-format reader');
    if((stats?.series||0)>=10)traits.push('Series keeper');
    if(ritual.bestStreak>=14)traits.push('Ritual reader');
    if((stats?.favourites||0)>=10)traits.push('Selective curator');
    if((stats?.formats||0)>=3)traits.push('Format explorer');
    if(!traits.length)traits.push('Building your archive');
    const profileTraits=traits.slice(0,4);
    const personalBests=[
      {label:'Best streak',value:ritual.bestStreak+' days',icon:'flame' as UiIconName},
      {label:'Active days',value:String(ritual.activeDays),icon:'calendar' as UiIconName},
      {label:'Listening',value:Math.round(insightSummary.listeningSeconds/3600)+' hr',icon:'play' as UiIconName},
      {label:'Avg rating',value:(stats?.averageRating||0)>0?(stats?.averageRating||0).toFixed(1)+'/10':'—',icon:'insights' as UiIconName},
    ];
    const goals=[
      {label:'Works completed',value:insightSummary.completedGoal.value,target:insightSummary.completedGoal.target,progress:insightSummary.completedGoal.progress,icon:'bookOpen' as UiIconName,tone:p.sage},
      {label:'Annotations',value:insightSummary.annotationGoal.value,target:insightSummary.annotationGoal.target,progress:insightSummary.annotationGoal.progress,icon:'bookmark' as UiIconName,tone:p.gold},
    ];
    const highlightedAchievements=[
      ...(recentAchievementId?profileAchievements.filter(item=>item.id===recentAchievementId):[]),
      ...profileAchievements.filter(item=>item.unlocked&&item.id!==recentAchievementId).sort((a,b)=>b.target-a.target),
    ].slice(0,3);
    const profileLinks=[
      {id:'rewards' as Tab,label:'Rewards',copy:'Level '+overall.level+' · '+(profileProgression?.unlockedAchievements||0)+' unlocked',icon:'target' as UiIconName,tone:'#E3BC67'},
      {id:'settings' as Tab,label:'Settings',copy:'Library, privacy and server',icon:'settings' as UiIconName,tone:'#7AA7E8'},
    ];
    return <ScrollView contentContainerStyle={[styles.profileHubScreen,width>=600&&styles.profileHubScreenFold,width>=940&&styles.profileHubScreenWide]}>
      <PageHeader title="Profile" subtitle="Your identity and reading life."/>

      <View style={[styles.profileIdentityHero,styles.profileIdentityHeroRich,{borderBottomColor:p.line}]}>
        <View style={styles.profileIdentityRing}>
          <DataRing size={112} items={identityRing} ink={p.ink} muted={p.muted} track={p.line} thickness={6} opacity={1}/>
          <View style={[styles.profileIdentityAvatar,styles.profileIdentityAvatarRing,{backgroundColor:profileAvatar.color||'#47736F',overflow:'hidden'}]}>{profileAvatar.photoUri?<Image source={{uri:profileAvatar.photoUri}} resizeMode="cover" style={styles.profileIdentityAvatarImage}/>:<Text style={styles.profileIdentityAvatarText}>{avatarInitials}</Text>}</View>
          <View style={[styles.profileIdentityLevelBadge,{backgroundColor:darkMode?'#0B1725':'#FFF8E9',borderColor:p.gold}]}><Text style={[styles.profileIdentityLevelText,{color:p.gold}]}>L{overall.level}</Text></View>
        </View>
        <View style={styles.profileIdentityCopy}>
          <Text style={[styles.profileIdentityKicker,{color:p.gold}]}>{overall.title.toUpperCase()}</Text>
          <Text style={[styles.profileIdentityName,{color:p.ink}]}>{stats?.name||'Reader'}</Text>
          <Text style={[styles.pageSubtitle,{color:p.muted}]}>{stats?.works||0} works · {stats?.completed||0} completed · {ritual.currentStreak} day streak</Text>
          <View style={styles.profileTraitRow}>{profileTraits.map(trait=><View key={trait} style={[styles.profileTraitChip,{backgroundColor:p.card,borderColor:p.line}]}><Text style={[styles.profileTraitText,{color:p.ink}]}>{trait}</Text></View>)}</View>
        </View>
      </View>

      <View style={[styles.profileHubSection,{borderTopColor:p.line}]}>
        <Text style={[styles.profileHubSectionTitle,{color:p.muted}]}>READING SNAPSHOT</Text>
        <View style={styles.profileSnapshotGrid}>
          {[
            ['Library',String(stats?.works||0)],
            ['Completed',String(stats?.completed||0)],
            ['Favourites',String(stats?.favourites||0)],
            ['Best streak',String(ritual.bestStreak)+' days'],
          ].map(([label,value])=><View key={label} style={[styles.profileSnapshotItem,width>=700&&styles.profileSnapshotItemWide]}><Text style={[styles.profileSnapshotValue,{color:p.ink}]}>{value}</Text><Text style={[styles.profileSnapshotLabel,{color:p.muted}]}>{label}</Text></View>)}
        </View>
      </View>

      <View style={[styles.profileHubSection,{borderTopColor:p.line}]}>
        <Text style={[styles.profileHubSectionTitle,{color:p.muted}]}>PERSONAL BESTS</Text>
        <View style={styles.profileBestGrid}>{personalBests.map(item=><View key={item.label} style={[styles.profileBestCard,{borderColor:p.line}]}>
          <View style={[styles.profileBestIcon,{backgroundColor:p.card}]}><UiIcon name={item.icon} color={p.gold} size={17}/></View>
          <Text style={[styles.profileBestValue,{color:p.ink}]}>{item.value}</Text>
          <Text style={[styles.profileBestLabel,{color:p.muted}]}>{item.label}</Text>
        </View>)}</View>
      </View>

      <View style={[styles.profileHubSection,{borderTopColor:p.line}]}>
        <Text style={[styles.profileHubSectionTitle,{color:p.muted}]}>CURRENT GOALS</Text>
        <View style={styles.profileGoalGrid}>{goals.map(goal=><View key={goal.label} style={[styles.profileGoalCard,{borderColor:p.line}]}>
          <View style={styles.profileGoalTop}><View style={[styles.profileBestIcon,{backgroundColor:p.card}]}><UiIcon name={goal.icon} color={goal.tone} size={17}/></View><Text style={[styles.profileGoalValue,{color:p.ink}]}>{goal.value} / {goal.target}</Text></View>
          <Text style={[styles.profileGoalLabel,{color:p.muted}]}>{goal.label}</Text>
          <View style={[styles.profileGoalTrack,{backgroundColor:p.line}]}><View style={[styles.profileGoalFill,{backgroundColor:goal.tone,width:(Math.round(goal.progress*100)+'%') as any}]}/></View>
        </View>)}</View>
      </View>

      {highlightedAchievements.length?<View style={[styles.profileHubSection,{borderTopColor:p.line}]}>
        <View style={styles.profileSectionHeadingRow}><Text style={[styles.profileHubSectionTitle,{color:p.muted}]}>{recentAchievementId?'RECENT MILESTONES':'MILESTONE HIGHLIGHTS'}</Text><Pressable accessibilityRole="button" onPress={()=>setActiveTab('rewards')}><Text style={[styles.meta,{color:p.gold,fontWeight:'700'}]}>View all</Text></Pressable></View>
        <View style={styles.profileMilestoneList}>{highlightedAchievements.map(item=><View key={item.id} style={[styles.profileMilestoneRow,{borderBottomColor:p.line}]}>
          <View style={[styles.profileMilestoneMedal,{borderColor:p.gold,backgroundColor:p.card}]}><UiIcon name={item.id.includes('streak')?'flame':item.id.includes('audio')||item.id.includes('listener')?'play':item.id.includes('series')?'layers':'target'} color={p.gold} size={18}/></View>
          <View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={[styles.bookTitle,{color:p.ink}]}>{item.title}</Text><Text numberOfLines={1} style={[styles.meta,{color:p.muted}]}>{item.description}</Text></View>
        </View>)}</View>
      </View>:null}

      <View style={[styles.profileHubSection,{borderTopColor:p.line}]}>
        <Text style={[styles.profileHubSectionTitle,{color:p.muted}]}>AVATAR</Text>
        <Text style={[styles.meta,{color:p.muted}]}>Choose up to two initials and an accent. Profile-photo support is prepared for the native picker pass; initials remain the reliable local fallback.</Text>
        <View style={styles.profileAvatarEditor}>
          <TextInput accessibilityLabel="Avatar initials" value={profileAvatar.initials} maxLength={2} autoCapitalize="characters" onChangeText={value=>void saveProfileAvatar({...profileAvatar,initials:value})} placeholder={avatarInitials} placeholderTextColor={p.muted} style={[styles.profileInitialInput,{color:p.ink,borderBottomColor:p.line}]}/>
          <View style={styles.profileAvatarPalette}>
            {avatarColours.map(color=><Pressable key={color} accessibilityRole="button" accessibilityLabel={'Use avatar colour '+color} accessibilityState={{selected:profileAvatar.color===color}} onPress={()=>void saveProfileAvatar({...profileAvatar,color})} style={[styles.profileAvatarSwatch,{backgroundColor:color,borderColor:profileAvatar.color===color?p.ink:'transparent'}]}/>)}
          </View>
        </View>
      </View>

      <View style={[styles.profileHubSection,{borderTopColor:p.line}]}>
        <Text style={[styles.profileHubSectionTitle,{color:p.muted}]}>MORE</Text>
        {profileLinks.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>setActiveTab(item.id)} style={({pressed})=>[styles.profileHubLink,{borderBottomColor:p.line,opacity:pressed?0.72:1}]}>
          <View style={[styles.profileHubLinkIcon,{backgroundColor:item.tone+'20'}]}><UiIcon name={item.icon} color={item.tone} size={18}/></View>
          <View style={{flex:1,minWidth:0}}><Text style={[styles.bookTitle,{color:p.ink}]}>{item.label}</Text><Text style={[styles.meta,{color:p.muted}]}>{item.copy}</Text></View>
          <View style={{transform:[{rotate:'-90deg'}]}}><UiIcon name="chevronDown" color={item.tone} size={16}/></View>
        </Pressable>)}
      </View>
    </ScrollView>;
  }

  function Rewards() {
    const categories=['All',...Array.from(new Set(profileAchievements.map(item=>item.category||'Other')))];
    const visible=profileAchievements
      .filter(item=>awardCategory==='All'||(item.category||'Other')===awardCategory)
      .sort((a,b)=>Number(b.unlocked)-Number(a.unlocked)||clampProgress(b.progress,b.target)-clampProgress(a.progress,a.target));
    const locked=profileAchievements.filter(item=>!item.unlocked).sort((a,b)=>clampProgress(b.progress,b.target)-clampProgress(a.progress,a.target));
    const nextUp=locked.slice(0,3);
    const recent=recentAchievementId?profileAchievements.find(item=>item.id===recentAchievementId):null;
    const overall=profileProgression?.overall||{level:1,xp:0,levelStartXp:0,nextLevelXp:330,progress:0,title:'Reader'};
    const xpIntoLevel=Math.max(0,overall.xp-overall.levelStartXp);
    const xpForLevel=Math.max(1,overall.nextLevelXp-overall.levelStartXp);
    const pathSpecs=[
      {id:'Reading' as const,icon:'bookOpen' as UiIconName,tone:p.sage},
      {id:'Listening' as const,icon:'play' as UiIconName,tone:darkMode?'#86A9C4':'#66859B'},
      {id:'Library' as const,icon:'shelf' as UiIconName,tone:p.gold},
      {id:'Ritual' as const,icon:'flame' as UiIconName,tone:darkMode?'#D58B68':'#A65F42'},
    ];
    const milestones=[
      {level:5,title:'Explorer',icon:'atlas' as UiIconName},
      {level:10,title:'Collector',icon:'library' as UiIconName},
      {level:15,title:'Curator',icon:'target' as UiIconName},
      {level:25,title:'Archivist',icon:'shelf' as UiIconName},
      {level:40,title:'Senior',icon:'layers' as UiIconName},
      {level:60,title:'Master',icon:'insights' as UiIconName},
    ];
    const nextMilestoneIndex=Math.max(0,milestones.findIndex(item=>overall.level<item.level));
    const rewardIcon=(item:Achievement):UiIconName=>{
      const id=item.id;
      if(id.includes('streak')||id.includes('daily-spark'))return 'flame';
      if(id.includes('days'))return 'calendar';
      if(id.includes('listener')||id.includes('audio'))return 'play';
      if(id.includes('reader')||id.includes('reading')||id.includes('finish'))return 'bookOpen';
      if(id.includes('series'))return 'layers';
      if(id.includes('format')||id.includes('balance'))return 'atlas';
      if(id.includes('rating'))return 'insights';
      if(id.includes('favourite'))return 'bookmark';
      if(id.includes('collection')||id.includes('shelf')||id.includes('archive')||id.includes('curator'))return 'shelf';
      if(id.includes('active-stack')||id.includes('starter'))return 'library';
      return 'target';
    };
    const rewardTone=(item:Achievement)=>{
      const category=item.category||'Other';
      if(category==='Reading')return p.sage;
      if(category==='Listening')return darkMode?'#86A9C4':'#66859B';
      if(category==='Daily ritual')return darkMode?'#D58B68':'#A65F42';
      if(category==='Library')return p.gold;
      return darkMode?'#A78BC7':'#806B9A';
    };
    const renderTrophy=(item:Achievement)=>{
      const progress=Math.round(clampProgress(item.progress,item.target)*100);
      const recentItem=recentAchievementId===item.id;
      const tone=rewardTone(item);
      const icon=rewardIcon(item);
      return <View key={item.id} style={[styles.rewardTrophyCard,width>=760&&styles.rewardTrophyCardWide,{borderColor:item.unlocked?p.gold:p.line,backgroundColor:item.unlocked?p.card:'transparent'}]}>
        <View style={styles.rewardTrophyTop}>
          <View style={styles.rewardMedalWrap}>
            {recentItem?<Animated.View pointerEvents="none" style={[styles.rewardPulseHalo,{backgroundColor:darkMode?tone:p.gold,opacity:interfacePulse.interpolate({inputRange:[0,1],outputRange:[darkMode?.42:.30,0]}),transform:[{scale:interfacePulse.interpolate({inputRange:[0,1],outputRange:[1,1.52]})}]}]}/>:null}
            <View style={[styles.rewardRibbon,styles.rewardRibbonLeft,{backgroundColor:item.unlocked?tone:p.line}]}/>
            <View style={[styles.rewardRibbon,styles.rewardRibbonRight,{backgroundColor:item.unlocked?tone:p.line}]}/>
            <View style={[styles.rewardMedal,{borderColor:item.unlocked?tone:p.line,backgroundColor:item.unlocked?(darkMode?'#151412':'#FFF9EC'):p.card}]}>
              <UiIcon name={icon} color={item.unlocked?tone:p.muted} size={22}/>
            </View>
          </View>
          <View style={{alignItems:'flex-end',gap:3}}>
            {recentItem?<Text style={[styles.rewardRecent,{color:p.gold}]}>RECENT</Text>:null}
            <Text style={[styles.rewardProgressLabel,{color:item.unlocked?p.gold:p.muted}]}>{item.unlocked?'UNLOCKED':progress+'%'}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={[styles.rewardTrophyTitle,{color:p.ink}]}>{item.title}</Text>
        <Text numberOfLines={2} style={[styles.rewardTrophyCopy,{color:p.muted}]}>{item.description}</Text>
        <View style={[styles.rewardTrophyTrack,{backgroundColor:p.line}]}><View style={[styles.rewardTrophyFill,{backgroundColor:item.unlocked?tone:p.muted,width:(progress+'%') as any}]}/></View>
      </View>;
    };
    const overallRing:ChartItem[]=[
      {label:'Level progress',count:Math.max(.001,overall.progress),color:p.gold},
      {label:'Remaining',count:Math.max(.001,1-overall.progress),color:darkMode?'#29303A':'#D8CDBA'},
    ];

    return <ScrollView contentContainerStyle={[styles.profileHubScreen,width>=600&&styles.profileHubScreenFold,width>=940&&styles.profileHubScreenWide]}>
      <PageHeader title="Rewards" subtitle="Build your archive. Keep your reading life moving."/>

      <View style={[styles.rewardsLevelHero,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <View style={styles.rewardsHeroRing}>
          <DataRing size={118} items={overallRing} ink={p.ink} muted={p.muted} track={p.line} thickness={7} opacity={1}/>
          <View pointerEvents="none" style={styles.rewardsHeroRingCenter}>
            <Text style={[styles.rewardsHeroLevelLabel,{color:p.muted}]}>LEVEL</Text>
            <Text style={[styles.rewardsHeroLevel,{color:p.gold}]}>{overall.level}</Text>
          </View>
        </View>
        <View style={styles.rewardsHeroCopy}>
          <Text style={[styles.rewardsHeroTitle,{color:p.ink}]}>{overall.title}</Text>
          <Text style={[styles.rewardsHeroMeta,{color:p.muted}]}>{xpIntoLevel.toLocaleString()} / {xpForLevel.toLocaleString()} XP to Level {overall.level+1}</Text>
          <View style={[styles.rewardsCompletionTrack,{backgroundColor:p.line}]}><View style={[styles.rewardsCompletionFill,{backgroundColor:p.gold,width:(Math.round(overall.progress*100)+'%') as any}]}/></View>
          <Text style={[styles.rewardsHeroFootnote,{color:p.muted}]}>{profileProgression?.unlockedAchievements||0} achievements unlocked · progression rewards reading, listening, curation and consistency.</Text>
        </View>
      </View>

      <View style={styles.rewardsSection}>
        <View style={styles.rewardsSectionHeading}>
          <View><Text style={[styles.rewardsSectionTitle,{color:p.ink}]}>Your progression</Text><Text style={[styles.meta,{color:p.muted}]}>Four paths grow independently as your habits change.</Text></View>
        </View>
        <View style={styles.rewardsPathGrid}>
          {pathSpecs.map(spec=>{
            const path=profileProgression?.paths[spec.id]||{level:1,xp:0,levelStartXp:0,nextLevelXp:330,progress:0,title:spec.id};
            const ring:ChartItem[]=[{label:'Progress',count:Math.max(.001,path.progress),color:spec.tone},{label:'Remaining',count:Math.max(.001,1-path.progress),color:p.line}];
            return <View key={spec.id} style={[styles.rewardsPathCard,{borderColor:p.line}]}>
              <View style={styles.rewardsPathTop}>
                <View style={styles.rewardsPathRing}><DataRing size={52} items={ring} ink={p.ink} muted={p.muted} track={p.line} thickness={4} opacity={1}/><View pointerEvents="none" style={styles.rewardsPathIcon}><UiIcon name={spec.icon} color={spec.tone} size={18}/></View></View>
                <View style={{flex:1,minWidth:0}}><Text style={[styles.rewardsPathName,{color:p.ink}]}>{spec.id}</Text><Text numberOfLines={1} style={[styles.rewardsPathTitle,{color:p.muted}]}>{path.title}</Text></View>
                <Text style={[styles.rewardsPathLevel,{color:spec.tone}]}>L{path.level}</Text>
              </View>
              <View style={[styles.rewardsPathTrack,{backgroundColor:p.line}]}><View style={[styles.rewardsPathFill,{backgroundColor:spec.tone,width:(Math.round(path.progress*100)+'%') as any}]}/></View>
            </View>;
          })}
        </View>
      </View>

      <View style={styles.rewardsSection}>
        <View style={styles.rewardsSectionHeading}><View><Text style={[styles.rewardsSectionTitle,{color:p.ink}]}>Milestones</Text><Text style={[styles.meta,{color:p.muted}]}>The long view of your Archivist journey.</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsMilestoneRail}>
          {milestones.map((milestone,index)=>{
            const complete=overall.level>=milestone.level;
            const current=!complete&&(nextMilestoneIndex===index||nextMilestoneIndex<0&&index===milestones.length-1);
            return <View key={milestone.level} style={styles.rewardsMilestoneItem}>
              {index>0?<View pointerEvents="none" style={[styles.rewardsMilestoneLine,{backgroundColor:complete?p.gold:p.line}]}/>:null}
              <View style={[styles.rewardsMilestoneMedal,{borderColor:complete||current?p.gold:p.line,backgroundColor:complete?p.card:'transparent'},current&&styles.rewardsMilestoneCurrent]}>
                <UiIcon name={milestone.icon} color={complete||current?p.gold:p.muted} size={19}/>
              </View>
              <Text style={[styles.rewardsMilestoneLevel,{color:complete?p.gold:p.ink}]}>Level {milestone.level}</Text>
              <Text numberOfLines={1} style={[styles.rewardsMilestoneTitle,{color:p.muted}]}>{milestone.title}</Text>
            </View>;
          })}
        </ScrollView>
      </View>

      {nextUp.length?<View style={styles.rewardsSection}>
        <View style={styles.rewardsSectionHeading}><View><Text style={[styles.rewardsSectionTitle,{color:p.ink}]}>Next up</Text><Text style={[styles.meta,{color:p.muted}]}>Closest achievements to your next unlocks.</Text></View></View>
        <View style={styles.rewardsNextGrid}>
          {nextUp.map(item=>{
            const progress=Math.round(clampProgress(item.progress,item.target)*100),tone=rewardTone(item);
            return <View key={item.id} style={[styles.rewardsNextCard,{borderColor:p.line}]}>
              <View style={[styles.rewardsNextIcon,{backgroundColor:p.card}]}><UiIcon name={rewardIcon(item)} color={tone} size={20}/></View>
              <View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={[styles.bookTitle,{color:p.ink}]}>{item.title}</Text><Text style={[styles.meta,{color:p.muted}]}>{progress}% complete</Text></View>
              <Text style={[styles.rewardsNextPercent,{color:tone}]}>{progress}%</Text>
            </View>;
          })}
        </View>
      </View>:null}

      {recent?<View style={styles.rewardsSection}>
        <View style={styles.rewardsSectionHeading}><View><Text style={[styles.rewardsSectionTitle,{color:p.ink}]}>Recently earned</Text><Text style={[styles.meta,{color:p.muted}]}>Your newest achievement.</Text></View></View>
        <View style={styles.rewardsRecentSpotlight}>{renderTrophy(recent)}</View>
      </View>:null}

      <View style={styles.rewardsSection}>
        <View style={styles.rewardsSectionHeading}><View><Text style={[styles.rewardsSectionTitle,{color:p.ink}]}>Trophy cabinet</Text><Text style={[styles.meta,{color:p.muted}]}>Every milestone has its own mark.</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.rewardsCategories}>
          {categories.map(category=><Pressable key={category} accessibilityRole="button" accessibilityState={{selected:awardCategory===category}} onPress={()=>setAwardCategory(category)} style={[styles.rewardsCategory,awardCategory===category&&{backgroundColor:p.card,borderColor:p.gold}]}><Text style={{color:awardCategory===category?p.ink:p.muted,fontWeight:awardCategory===category?'700':'500'}}>{category}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.rewardTrophyGrid}>{visible.map(renderTrophy)}</View>
      </View>
    </ScrollView>;
  }

  async function refreshDuplicateCandidates() {
    if(!session || !owner)return;
    setDuplicateLoading(true);setError('');
    try{
      const groups=await request(session,'/api/duplicate-candidates') as DuplicateCandidateGroup[];
      setServerDuplicateGroups(groups);
      setDuplicateResults({});
    }catch(e){setError((e as Error).message);}
    finally{setDuplicateLoading(false);}
  }

  async function openDuplicateReview() {
    setDuplicatePanelOpen(true);
    if(session && owner)await refreshDuplicateCandidates();
  }

  async function verifyDuplicateGroup(group:DuplicateCandidateGroup) {
    if(!session || !owner || group.items.length<2)return;
    setDuplicateLoading(true);setError('');
    try{
      const result=await request(
        session,'/api/duplicate-candidates/verify','POST',
        {ids:group.items.map(item=>item.id)},300000,
      ) as DuplicateVerification;
      setDuplicateResults(current=>({...current,[String(group.size)]:result}));
    }catch(e){setError((e as Error).message);}
    finally{setDuplicateLoading(false);}
  }

  function DuplicateReviewPanel() {
    if(!duplicatePanelOpen)return null;
    return (
      <View style={[styles.duplicatePanel,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <View style={styles.queueHeader}>
          <View style={{flex:1}}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Duplicate review</Text>
            <Text style={[styles.meta,{color:p.muted}]}>
              {session
                ? 'Candidates share the same byte size. Verification reads each file and compares SHA-256; nothing is changed or deleted.'
                : 'Local candidates share the same normalized title, author, series and format. They are possible duplicates, not byte-verified.'}
            </Text>
          </View>
          <Button label="Close" tone="quiet" onPress={()=>setDuplicatePanelOpen(false)} />
        </View>
        {duplicateLoading?<ActivityIndicator accessibilityLabel="Checking duplicate files" />:null}
        {session ? <>
          <Button label="Refresh candidates" tone="quiet" disabled={duplicateLoading} onPress={()=>void refreshDuplicateCandidates()} />
          {!serverDuplicateGroups.length && !duplicateLoading?<Text style={[styles.empty,{color:p.muted}]}>No same-size duplicate candidates found.</Text>:null}
          {serverDuplicateGroups.map(group=>{
            const result=duplicateResults[String(group.size)];
            return <View key={group.size} style={[styles.duplicateGroup,{borderColor:p.line}]}>
              <Text style={[styles.bookTitle,{color:p.ink}]}>{group.items.length} candidates · {formatBytes(group.size)}</Text>
              <Text style={[styles.meta,{color:p.muted}]}>{group.reason}</Text>
              {group.items.map(item=><Text key={item.id} numberOfLines={2} style={[styles.meta,{color:p.ink}]}>• {item.title} — {item.path}</Text>)}
              {!result?<Button label="Verify exact duplicates" tone="quiet" disabled={duplicateLoading} onPress={()=>void verifyDuplicateGroup(group)} />:null}
              {result?<>
                <Text style={[styles.meta,{color:p.sage,fontWeight:'700'}]}>{result.exact.reduce((n,set)=>n+set.items.length,0)} files confirmed in exact duplicate sets</Text>
                {result.exact.map(set=><View key={set.sha256} style={[styles.duplicateExact,{borderColor:p.sage}]}>
                  <Text style={[styles.meta,{color:p.ink,fontWeight:'800'}]}>Exact SHA-256 match · {set.items.length} files</Text>
                  {set.items.map(item=><Text key={item.id} numberOfLines={2} style={[styles.meta,{color:p.muted}]}>• {item.path}</Text>)}
                </View>)}
                {result.unique.length?<Text style={[styles.meta,{color:p.muted}]}>{result.unique.length} candidate file{result.unique.length===1?'':'s'} proved unique.</Text>:null}
                {result.errors.map(item=><Text key={'err-'+item.id} style={[styles.meta,{color:p.danger}]}>File {item.id}: {item.error}</Text>)}
              </>:null}
            </View>;
          })}
        </> : <>
          {!localDuplicateGroups.length?<Text style={[styles.empty,{color:p.muted}]}>No metadata-match duplicate candidates found.</Text>:null}
          {localDuplicateGroups.map(group=><View key={group.key} style={[styles.duplicateGroup,{borderColor:p.line}]}>
            <Text style={[styles.bookTitle,{color:p.ink}]}>{group.items[0].title} · {group.items.length} possible copies</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{group.reason}</Text>
            {group.items.map(item=><Text key={item.uri} numberOfLines={2} style={[styles.meta,{color:p.ink}]}>• {item.uri}</Text>)}
          </View>)}
        </>}
      </View>
    );
  }

  function LocalSortingPanel() {
    if(!localBooks.length)return null;
    return (
      <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
        <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Organise local files</Text>
        <Text style={[styles.meta,{color:p.muted}]}>Preview first. Archivist copies into the organised layout and leaves originals untouched until you choose to clean up the copy history.</Text>
        <View style={styles.segment}>
          {[
            ['author-title','Author / Title'],
            ['author-series-title','Author / Series / Title'],
            ['format-author-title','Format / Author / Title'],
          ].map(([id,label])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:sortTemplate===id}} onPress={()=>setSortTemplate(id)} style={[styles.segmentItem,{backgroundColor:sortTemplate===id?p.card:'transparent'}]}><Text style={{color:sortTemplate===id?p.sage:p.muted,textAlign:'center',fontWeight:sortTemplate===id?'700':'500'}}>{label}</Text></Pressable>)}
        </View>
        <Button label="Preview visible local items" disabled={localBooks.length===0} tone="quiet" onPress={previewLocalSortBatch}/>
        <Button label="Copy organised files" disabled={busy || localMovePreviews.every(item=>item.state!=='ready')} onPress={()=>void applyLocalSortBatch()}/>
        {moveStatus?<Text accessibilityLiveRegion="polite" style={[styles.meta,{color:p.sage}]}>{moveStatus}</Text>:null}
        {localMovePreviews.slice(0,20).map(item=><View key={item.id} style={[styles.sourceRow,{borderColor:p.line}]}>
          <Text style={{color:p.ink,fontWeight:'700'}}>{item.title}</Text>
          <Text style={{color:p.muted}}>From: {item.from}</Text>
          <Text style={{color:item.state==='conflict'?p.danger:item.state==='review'?p.sage:p.muted}}>To: {item.to}</Text>
          <Text style={{color:item.state==='review'?p.sage:p.muted}}>{item.state==='review'?'Review metadata before organising':item.state}</Text>
        </View>)}
        {localMovePreviews.length>20?<Text style={[styles.meta,{color:p.muted}]}>Showing first 20 of {localMovePreviews.length} proposed moves.</Text>:null}
        {localSortHistory.length?<Text style={[styles.sectionTitle,{color:p.ink}]}>Copy history</Text>:null}
        {localSortHistory.slice(0,3).map(item=><View key={item.id} style={[styles.sourceRow,{borderColor:p.line}]}>
          <Text style={{color:p.ink,fontWeight:'700'}}>{new Date(item.createdAt).toLocaleString()}</Text>
          <Text style={{color:p.muted}}>{item.copied.length} copied; {item.failed.length} failed</Text>
          <Button label="Remove copied files" disabled={busy || item.copied.length===0} tone="quiet" onPress={()=>void recoverLocalSort(item)} />
        </View>)}
      </View>
    );
  }

  function LibraryManagementPanel(){
    if(!libraryManageOpen)return null;
    const gaps=metadataGapCounts(allUnifiedWorks);
    const reviewCount=reviewAssetPool.filter(item=>item.needsReview).length;
    const localDuplicateCount=localDuplicateGroups.reduce((sum,group)=>sum+group.items.length,0);
    const openGap=(gap:MetadataGapFilter)=>{clearLibraryFilters();setReviewOnly(false);setMetadataGapFilter(gap);setLibraryManageOpen(false);};
    const openReview=()=>{clearLibraryFilters();setReviewOnly(true);setLibraryManageOpen(false);};
    return <Modal transparent animationType="slide" visible onRequestClose={()=>setLibraryManageOpen(false)}>
      <View style={[styles.sheetBackdrop,foldLayout&&styles.sheetBackdropFold]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.libraryManageScroll}>
          <View accessibilityViewIsModal accessibilityLabel="Library management" style={[styles.libraryManageSheet,{backgroundColor:p.paper,borderColor:p.line}]}>
            <View style={[styles.sheetHandle,foldLayout&&styles.sheetHandleFold]}/>
            <View style={styles.sheetHeader}>
              <View style={{flex:1,minWidth:0}}><Text style={[styles.sheetTitle,{color:p.ink}]}>Manage Library</Text><Text style={[styles.meta,{color:p.muted}]}>Scan, repair metadata and organise safely. Archivist previews file changes before applying them.</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close Library management" onPress={()=>setLibraryManageOpen(false)} style={styles.sheetCloseButton}><UiIcon name="close" color={p.muted} size={18}/></Pressable>
            </View>

            <View style={styles.libraryHealthGrid}>
              {[
                ['Needs review',reviewCount],
                ['Missing author',gaps.author],
                ['Missing series',gaps.series],
                ['Missing genre',gaps.genre],
              ].map(([label,value])=><View key={String(label)} style={[styles.libraryHealthMetric,{borderColor:p.line}]}><Text style={[styles.libraryHealthValue,{color:Number(value)>0?p.gold:p.sage}]}>{value}</Text><Text style={[styles.libraryHealthLabel,{color:p.muted}]}>{label}</Text></View>)}
            </View>

            <View style={[styles.libraryManageSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>SCAN & REPAIR</Text>
              <Text style={[styles.meta,{color:p.muted}]}>Rescanning refreshes embedded, sidecar and folder-derived details and covers. Anything still uncertain stays in review rather than being guessed.</Text>
              <View style={styles.toolRow}>
                <Button label={localScanning?'Scanning…':'Rescan device folders'} disabled={localScanning||!localFolders.length} onPress={()=>void rescanLocalFolders()}/>
                <Button label="Add device folder" tone="quiet" disabled={localScanning} onPress={()=>void addLocalFolder()}/>
              </View>
              {localScanning&&scanProgress?<View style={[styles.scanBanner,{borderTopColor:p.line,borderBottomColor:p.line}]}><ActivityIndicator accessibilityLabel="Scanning local library" color={p.sage}/><View style={{flex:1}}><Text style={{color:p.ink,fontWeight:'600'}}>Scanning {scanProgress.currentFolder||'library'}…</Text><Text style={{color:p.muted}}>{scanProgress.entriesVisited} checked · {scanProgress.found} found · {scanProgress.review} review</Text></View></View>:null}
              <View style={styles.libraryRepairList}>
                <Pressable accessibilityRole="button" onPress={openReview} style={[styles.libraryRepairRow,{borderBottomColor:p.line}]}><View style={{flex:1}}><Text style={[styles.bookTitle,{color:p.ink}]}>Review uncertain metadata</Text><Text style={[styles.meta,{color:p.muted}]}>Open the exact files Archivist could not identify confidently.</Text></View><Text style={[styles.libraryRepairCount,{color:reviewCount?p.gold:p.muted}]}>{reviewCount}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={()=>openGap('author')} style={[styles.libraryRepairRow,{borderBottomColor:p.line}]}><View style={{flex:1}}><Text style={[styles.bookTitle,{color:p.ink}]}>Fill missing authors</Text><Text style={[styles.meta,{color:p.muted}]}>Filter to unresolved author fields for quick editing.</Text></View><Text style={[styles.libraryRepairCount,{color:gaps.author?p.gold:p.muted}]}>{gaps.author}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={()=>openGap('series')} style={[styles.libraryRepairRow,{borderBottomColor:p.line}]}><View style={{flex:1}}><Text style={[styles.bookTitle,{color:p.ink}]}>Fill missing series</Text><Text style={[styles.meta,{color:p.muted}]}>Show files with no series metadata.</Text></View><Text style={[styles.libraryRepairCount,{color:gaps.series?p.gold:p.muted}]}>{gaps.series}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={()=>openGap('genre')} style={[styles.libraryRepairRow,{borderBottomColor:p.line}]}><View style={{flex:1}}><Text style={[styles.bookTitle,{color:p.ink}]}>Fill missing genres</Text><Text style={[styles.meta,{color:p.muted}]}>Show files with no genre metadata.</Text></View><Text style={[styles.libraryRepairCount,{color:gaps.genre?p.gold:p.muted}]}>{gaps.genre}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={()=>openGap('cover')} style={[styles.libraryRepairRow,{borderBottomColor:p.line}]}><View style={{flex:1}}><Text style={[styles.bookTitle,{color:p.ink}]}>Find missing device covers</Text><Text style={[styles.meta,{color:p.muted}]}>Check local and downloaded files without a stored cover.</Text></View><Text style={[styles.libraryRepairCount,{color:gaps.cover?p.gold:p.muted}]}>{gaps.cover}</Text></Pressable>
              </View>
            </View>

            <View style={[styles.libraryManageSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>ADVANCED ORGANISATION</Text>
              <Text style={[styles.meta,{color:p.muted}]}>For advanced users: choose a layout, preview proposed copies, then apply only ready items. Originals remain untouched until you explicitly clean up copy history.</Text>
              <LocalSortingPanel/>
              <View style={styles.settingsSubgroup}>
                <View style={styles.settingsRow}><View style={{flex:1}}><Text style={[styles.bookTitle,{color:p.ink}]}>Duplicate review</Text><Text style={[styles.meta,{color:p.muted}]}>{localDuplicateCount?localDuplicateCount+' local candidates found. ':''}Archivist never removes duplicate candidates automatically.</Text></View><Pressable accessibilityRole="button" onPress={()=>void openDuplicateReview()} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'700'}}>Check</Text></Pressable></View>
                <DuplicateReviewPanel/>
              </View>
            </View>

            {owner&&session?<View style={[styles.libraryManageSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>ARCHIVIST SERVER</Text>
              <Text style={[styles.meta,{color:p.muted}]}>Scan configured server folders here, then preview safe organisation before applying it.</Text>
              {sources.map(source=><View key={source.id} style={[styles.settingsListRow,{borderBottomColor:p.line}]}><View style={{flex:1,minWidth:0}}><Text style={[styles.bookTitle,{color:p.ink}]}>{source.space}</Text><Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{source.path}</Text><Text style={[styles.meta,{color:source.status==='ok'?p.sage:p.muted}]}>{source.status}</Text></View><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void sourceAction('/api/sources/'+source.id+'/scan')} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'700'}}>Scan</Text></Pressable></View>)}
              <View style={styles.segment}>{[['author-title','Author / Title'],['author-series-title','Author / Series / Title'],['format-author-title','Format / Author / Title']].map(([id,label])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:sortTemplate===id}} onPress={()=>setSortTemplate(id)} style={[styles.segmentItem,{backgroundColor:sortTemplate===id?p.card:'transparent'}]}><Text style={{color:sortTemplate===id?p.sage:p.muted,textAlign:'center',fontWeight:sortTemplate===id?'700':'500'}}>{label}</Text></Pressable>)}</View>
              <View style={styles.toolRow}><Button label="Preview matching server items" tone="quiet" disabled={busy||shelfLoading} onPress={()=>void previewLibrary(false)}/><Button label="Apply pending safe moves" disabled={busy} onPress={()=>void applySortBatch()}/></View>
              {moveStatus?<Text style={[styles.meta,{color:p.sage}]}>{moveStatus}</Text>:null}
            </View>:null}
          </View>
        </ScrollView>
      </View>
    </Modal>;
  }

  function OfflineDownloadsPanel(){
    const completed=Object.values(offlineWorks).sort((a,b)=>b.downloadedAt.localeCompare(a.downloadedAt));
    const partial=Object.values(offlineCheckpoints).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    const used=offlineStorage?.actualBytes ?? completed.reduce((sum,item)=>sum+Math.max(0,item.bytes||0),0);
    const capacity=offlineStorage?.capacityBytes || 0;
    const free=offlineStorage?.freeBytes || 0;
    return <View style={{gap:10}}>
      <Text style={[styles.sectionTitle,{color:p.ink}]}>Offline downloads</Text>
      <View style={[styles.offlineSummary,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <View style={{flex:1}}>
          <Text style={{color:p.ink,fontWeight:'900'}}>{completed.length} downloaded · {formatBytes(used)}</Text>
          <Text style={[styles.meta,{color:p.muted}]}>
            {capacity>0 ? formatBytes(free)+' free of '+formatBytes(capacity) : 'Stored in Archivist app storage'}
          </Text>
          {partial.length?<Text style={[styles.meta,{color:p.sage}]}>{partial.length} paused or interrupted download{partial.length===1?'':'s'} · {formatBytes(offlineStorage?.partialBytes||0)} partial data</Text>:null}
          {offlineStorage?.missingFiles?<Text style={[styles.meta,{color:p.danger}]}>{offlineStorage.missingFiles} missing downloaded file{offlineStorage.missingFiles===1?'':'s'} detected</Text>:null}
        </View>
      </View>
      <View style={styles.toolRow}>
        <Button label={offlineStorageBusy?'Checking…':'Refresh storage'} disabled={offlineStorageBusy||offlineBusyId!==null} tone="quiet" onPress={()=>void refreshOfflineStorage()} />
        <Button label="Clean up storage" disabled={offlineStorageBusy||offlineBusyId!==null} tone="quiet" onPress={()=>void cleanupDownloads()} />
      </View>
      {offlineProgress?<Text accessibilityLiveRegion="polite" style={[styles.meta,{color:p.sage}]}>{offlineProgress}</Text>:null}
      {partial.map(checkpoint=>{
        const connectedWork=session && checkpoint.server===session.server ? serverWorks.find(work=>work.id===checkpoint.workId) : undefined;
        return <View key={'partial-'+checkpoint.key} style={[styles.sourceRow,{borderColor:p.line}]}>
          <Text style={{color:p.ink,fontWeight:'800'}}>{checkpoint.title || 'Incomplete download'}</Text>
          <Text style={[styles.meta,{color:p.muted}]}>Paused/incomplete · {checkpoint.completedTrackIds.length} file{checkpoint.completedTrackIds.length===1?'':'s'} complete</Text>
          <Text numberOfLines={1} style={[styles.meta,{color:p.muted}]}>{checkpoint.server}</Text>
          <View style={styles.toolRow}>
            {connectedWork?<Button label="Resume" disabled={offlineBusyId!==null} onPress={()=>void downloadServerWork(connectedWork)} />:null}
            <Button label="Discard partial" disabled={offlineBusyId!==null||offlineStorageBusy} tone="quiet" onPress={()=>void discardPartialDownload(checkpoint)} />
          </View>
        </View>;
      })}
      {completed.map(item=><View key={'offline-'+item.key} style={[styles.sourceRow,{borderColor:p.line}]}>
        <Text style={{color:p.ink,fontWeight:'800'}}>{item.title}</Text>
        <Text style={[styles.meta,{color:p.muted}]}>{item.format} · {formatBytes(item.bytes)} · {new Date(item.downloadedAt).toLocaleDateString()}</Text>
        <Text numberOfLines={1} style={[styles.meta,{color:p.muted}]}>{item.server}</Text>
        <Button label="Remove download" disabled={offlineBusyId!==null} tone="quiet" onPress={()=>void removeServerDownload(item)} />
      </View>)}
      {!completed.length&&!partial.length?<Text style={[styles.meta,{color:p.muted}]}>Nothing stored offline yet. Use Download for offline on any server work.</Text>:null}
    </View>;
  }

  function createPrivacyBackup(){
    const snapshot={
      archivistBackup:1,
      createdAt:new Date().toISOString(),
      appVersion:'0.9.3',
      theme,
      accessibility:accessibilityPrefs,
      profileAvatar,
      insightGoal,
      readerAppearance,
      smartShelves,
      collections,
      shelfSections,
      playerBookmarks,
      readerBookmarks,
      readerAnnotations,
      localPreferences,
      ritualDays,
      localReadingProgress,
      localReadingComplete,
      localReadingCurrentComplete,
      localWorkProgress,
      localAudioCompleted,
    };
    setPrivacyBackupText(JSON.stringify(snapshot,null,2));
    setPrivacyDataNotice('Backup snapshot created locally. Server credentials and access keys are never included.');
  }

  async function restorePrivacyBackup(){
    setPrivacyDataNotice('');
    try{
      const raw=JSON.parse(privacyRestoreText);
      if(!raw||raw.archivistBackup!==1)throw Error('This is not an Archivist backup snapshot.');
      if(raw.theme==='system'||raw.theme==='light'||raw.theme==='dark')await chooseTheme(raw.theme);
      if(raw.accessibility&&typeof raw.accessibility==='object')await saveAccessibilityPreferences({reduceMotion:!!raw.accessibility.reduceMotion,highContrast:!!raw.accessibility.highContrast,largeText:!!raw.accessibility.largeText});
      if(raw.profileAvatar&&typeof raw.profileAvatar==='object')await saveProfileAvatar({initials:String(raw.profileAvatar.initials||''),color:String(raw.profileAvatar.color||'#47736F'),photoUri:typeof raw.profileAvatar.photoUri==='string'?raw.profileAvatar.photoUri:undefined});
      if(raw.insightGoal){const value=sanitizeInsightGoal(raw.insightGoal);setInsightGoal(value);setGoalDraft({completed:String(value.completedTarget),annotations:String(value.annotationTarget)});await setPersistedJSON(insightGoalKey,value);}
      if(raw.readerAppearance){const value=sanitizeReaderAppearance(raw.readerAppearance);setReaderAppearance(value);await setPersistedJSON(readerAppearanceKey,value);}
      if(Array.isArray(raw.smartShelves)){const value=sanitizeSmartShelves(raw.smartShelves);setSmartShelves(value);await setPersistedJSON(smartShelvesKey,value);}
      if(Array.isArray(raw.collections)){const value=sanitizeCollections(raw.collections);setCollections(value);await setPersistedJSON(collectionsKey,value);}
      if(Array.isArray(raw.shelfSections)){const allowed=new Set(defaultShelfSections.map(item=>item.id));const value=raw.shelfSections.filter((item:any)=>item&&allowed.has(item.id)).map((item:any)=>({id:item.id,title:String(item.title||''),visible:item.visible!==false}));if(value.length){setShelfSections(value);await setPersistedJSON(shelfSectionsKey,value);}}
      if(Array.isArray(raw.playerBookmarks)){const value=sanitizeBookmarks(raw.playerBookmarks);setPlayerBookmarks(value);await setPersistedJSON(playerBookmarksKey,value);}
      if(Array.isArray(raw.readerBookmarks)){const value=sanitizeReaderBookmarks(raw.readerBookmarks);setReaderBookmarks(value);await setPersistedJSON(readerBookmarksKey,value);}
      if(Array.isArray(raw.readerAnnotations)){const value=sanitizeReaderAnnotations(raw.readerAnnotations);setReaderAnnotations(value);await setPersistedJSON(readerAnnotationsKey,value);}
      if(raw.localPreferences&&typeof raw.localPreferences==='object'){setLocalPreferences(raw.localPreferences);await setPersistedJSON(localPreferencesKey,raw.localPreferences);}
      if(raw.ritualDays&&typeof raw.ritualDays==='object'){const value=Object.fromEntries(Object.entries(raw.ritualDays).filter(([key,value])=>/^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isFinite(Number(value))).map(([key,value])=>[key,Math.max(0,Math.min(60,Number(value)))]));setRitualDays(value);await setPersistedJSON('archivist.dailyRitual.v1',value);}
      if(raw.localReadingProgress&&typeof raw.localReadingProgress==='object'){setLocalReadingProgress(raw.localReadingProgress);await setPersistedJSON(localReadingProgressKey,raw.localReadingProgress);}
      if(raw.localReadingComplete&&typeof raw.localReadingComplete==='object'){setLocalReadingComplete(raw.localReadingComplete);await setPersistedJSON(localReadingCompleteKey,raw.localReadingComplete);}
      if(raw.localReadingCurrentComplete&&typeof raw.localReadingCurrentComplete==='object'){setLocalReadingCurrentComplete(raw.localReadingCurrentComplete);await setPersistedJSON(localReadingCurrentCompleteKey,raw.localReadingCurrentComplete);}
      if(raw.localWorkProgress&&typeof raw.localWorkProgress==='object'){setLocalWorkProgress(raw.localWorkProgress);await setPersistedJSON(localWorkProgressKey,raw.localWorkProgress);}
      if(raw.localAudioCompleted&&typeof raw.localAudioCompleted==='object'){setLocalAudioCompleted(raw.localAudioCompleted);await setPersistedJSON(localAudioCompletedKey,raw.localAudioCompleted);}
      setPrivacyDataNotice('Backup restored. Server credentials remain unchanged.');
      setPrivacyRestoreText('');
    }catch(e){setPrivacyDataNotice((e as Error).message||'Backup could not be restored.');}
  }

  function Settings() {
    const connected=!!session;
    const settingsTitleStyle=accessibilityPrefs.largeText?{fontSize:16.5,lineHeight:22}:undefined;
    const Toggle=({value,onPress,label}:{value:boolean;onPress:()=>void;label:string})=><Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{checked:value}} onPress={onPress} style={[styles.settingsToggle,{backgroundColor:value?p.gold:p.line,justifyContent:value?'flex-end':'flex-start'}]}><View style={[styles.settingsToggleKnob,{backgroundColor:darkMode?'#FFFFFF':'#FFFDF9'}]}/></Pressable>;
    const localStorageText=offlineStorage?formatBytes(offlineStorage.actualBytes||offlineStorage.trackedBytes):'Not measured';
    return (
      <ScrollView contentContainerStyle={[styles.settingsScreen,width>=600&&styles.settingsScreenFold,width>=940&&styles.settingsScreenWide]}>
        <PageHeader title="Settings" subtitle="Your library, privacy, accessibility and server."/>

        <View style={[styles.settingsColumns,width>=900&&styles.settingsColumnsWide]}>
          <View style={styles.settingsColumn}>
            <Text style={[styles.settingsColumnKicker,{color:p.muted}]}>LIBRARY & DATA</Text>

            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>LIBRARY & METADATA</Text>
              <View style={styles.settingsStatusPanel}>
                <View style={[styles.settingsStatusIcon,{backgroundColor:p.card}]}><UiIcon name="library" color={p.sage} size={18}/></View>
                <View style={{flex:1,minWidth:0}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>Local-first metadata</Text><Text style={[styles.meta,{color:p.muted}]}>Archivist reads embedded, sidecar, folder and connected-server metadata. No background internet metadata lookup is enabled.</Text></View>
              </View>

              <View style={styles.settingsSubgroup}>
                <View style={styles.settingsSubgroupHeading}><Text style={[styles.settingsSubgroupTitle,{color:p.ink}]}>Local folders</Text><Text style={[styles.meta,{color:p.muted}]}>{localFolders.length} folder{localFolders.length===1?'':'s'} · {localBooks.length} files</Text></View>
                {localFolders.map(folder=><View key={folder.uri} style={[styles.settingsListRow,{borderBottomColor:p.line}]}>
                  <View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>{folder.name}</Text><Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{folder.uri}</Text></View>
                </View>)}
                <View style={styles.settingsInlineActions}>
                  <Pressable accessibilityRole="button" disabled={localScanning} onPress={()=>void addLocalFolder()} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'700'}}>{localScanning?'Scanning…':'Add folder'}</Text></Pressable>
                  {localFolders.length?<Pressable accessibilityRole="button" disabled={localScanning} onPress={()=>void rescanLocalFolders()} style={styles.settingsTextAction}><Text style={{color:p.muted,fontWeight:'700'}}>Refresh metadata & covers</Text></Pressable>:null}
                </View>
                {localFolderNotice?<Text style={[styles.meta,{color:p.sage}]}>{localFolderNotice}</Text>:null}
              </View>

              <View style={styles.settingsSubgroup}>
                <View style={styles.settingsRow}>
                  <View style={{flex:1}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>Duplicate review</Text><Text style={[styles.meta,{color:p.muted}]}>Find possible copies without deleting or changing files.</Text></View>
                  {(!session||owner)?<Pressable accessibilityRole="button" onPress={()=>void openDuplicateReview()} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'700'}}>Review</Text></Pressable>:null}
                </View>
                <DuplicateReviewPanel/>
              </View>

              <LocalSortingPanel/>

              {owner?<View style={styles.settingsSubgroup}>
                <Text style={[styles.settingsSubgroupTitle,{color:p.ink}]}>Server source folders</Text>
                {sources.map(source=><View key={source.id} style={[styles.settingsListRow,{borderBottomColor:p.line}]}>
                  <View style={{flex:1,minWidth:0}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>{source.space}</Text><Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{source.path}</Text><Text style={[styles.meta,{color:source.status==='ok'?p.sage:p.muted}]}>{source.status}</Text></View>
                  <View style={styles.settingsRowActions}><Pressable accessibilityRole="button" onPress={()=>void sourceAction('/api/sources/'+source.id+'/scan')} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'700'}}>Scan</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>void removeSource(source.id)} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.danger,fontWeight:'700'}}>Remove</Text></Pressable></View>
                </View>)}
                <View style={styles.settingsAddFolder}><TextInput accessibilityLabel="Folder on server" value={folderPath} onChangeText={setFolderPath} placeholder="/media/books" placeholderTextColor={p.muted} style={[styles.settingsInlineInput,{color:p.ink,backgroundColor:p.card}]}/><TextInput accessibilityLabel="Library space" value={folderSpace} onChangeText={setFolderSpace} placeholder="Space" placeholderTextColor={p.muted} style={[styles.settingsInlineInput,{color:p.ink,backgroundColor:p.card}]}/><Button label="Add server folder" disabled={busy||!folderPath.trim()} onPress={()=>void sourceAction('/api/sources',{path:folderPath,space:folderSpace})}/></View>
              </View>:null}

              {owner?<View style={styles.settingsSubgroup}>
                <Text style={[styles.settingsSubgroupTitle,{color:p.ink}]}>Server safe sorting</Text>
                <Text style={[styles.meta,{color:p.muted}]}>Preview moves before Archivist applies them. Unresolved moves remain blocked for review.</Text>
                <View style={styles.segment}>{[['author-title','Author / Title'],['author-series-title','Author / Series / Title'],['format-author-title','Format / Author / Title']].map(([id,label])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:sortTemplate===id}} onPress={()=>setSortTemplate(id)} style={[styles.segmentItem,{backgroundColor:sortTemplate===id?p.card:'transparent'}]}><Text style={{color:sortTemplate===id?p.sage:p.muted,textAlign:'center',fontWeight:sortTemplate===id?'700':'500'}}>{label}</Text></Pressable>)}</View>
                <View style={styles.settingsInlineActions}><Pressable accessibilityRole="button" disabled={busy||shelfLoading} onPress={()=>void previewLibrary(false)} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'700'}}>Preview matching</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void previewLibrary(true)} style={styles.settingsTextAction}><Text style={{color:p.muted,fontWeight:'700'}}>Preview all</Text></Pressable></View>
                <Button label="Apply pending safe moves" disabled={busy} onPress={()=>void applySortBatch()}/>
                {moveStatus?<Text style={[styles.meta,{color:p.sage}]}>{moveStatus}</Text>:null}
              </View>:null}
            </View>

            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>OFFLINE & STORAGE</Text>
              <View style={styles.settingsStatusPanel}>
                <View style={[styles.settingsStatusIcon,{backgroundColor:p.card}]}><UiIcon name="layers" color={p.gold} size={18}/></View>
                <View style={{flex:1}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>{localStorageText} stored offline</Text><Text style={[styles.meta,{color:p.muted}]}>{offlineStorage?.items||0} complete download{offlineStorage?.items===1?'':'s'} · {offlineStorage?.incompleteWorks||0} incomplete</Text></View>
              </View>
              <OfflineDownloadsPanel/>
            </View>

            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>PRIVACY & DATA</Text>
              <View style={[styles.settingsPrivacyHero,{backgroundColor:p.card,borderColor:p.line}]}>
                <View style={[styles.settingsPrivacyMark,{borderColor:p.gold}]}><UiIcon name="bookmark" color={p.gold} size={20}/></View>
                <View style={{flex:1,minWidth:0}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>Local-first · private by default</Text><Text style={[styles.meta,{color:p.muted}]}>Reading history, profile settings and local library state stay on this device unless you explicitly connect an Archivist server. Backup snapshots never include server credentials.</Text></View>
              </View>
              <View style={styles.settingsRow}><View style={{flex:1}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>External metadata network access</Text><Text style={[styles.meta,{color:p.muted}]}>Off in this build. Scanning uses local/embedded metadata and connected Archivist server data.</Text></View><Text style={[styles.settingsStateLabel,{color:p.sage}]}>OFF</Text></View>
              <View style={styles.settingsSubgroup}>
                <Text style={[styles.settingsSubgroupTitle,{color:p.ink}]}>Backup & restore</Text>
                <Text style={[styles.meta,{color:p.muted}]}>Create a portable JSON snapshot of reading history and non-sensitive app settings, or paste one back to restore it.</Text>
                <View style={styles.settingsInlineActions}><Button label="Create backup snapshot" tone="quiet" onPress={createPrivacyBackup}/>{privacyBackupText?<Pressable accessibilityRole="button" onPress={()=>setPrivacyBackupText('')} style={styles.settingsTextAction}><Text style={{color:p.muted,fontWeight:'700'}}>Hide</Text></Pressable>:null}</View>
                {privacyBackupText?<Text selectable style={[styles.settingsBackupText,{color:p.ink,backgroundColor:p.card,borderColor:p.line}]}>{privacyBackupText}</Text>:null}
                <TextInput accessibilityLabel="Paste Archivist backup snapshot" multiline value={privacyRestoreText} onChangeText={setPrivacyRestoreText} placeholder="Paste backup JSON here" placeholderTextColor={p.muted} style={[styles.settingsRestoreInput,{color:p.ink,backgroundColor:p.card,borderColor:p.line}]}/>
                <Button label="Restore backup snapshot" disabled={!privacyRestoreText.trim()} onPress={()=>void restorePrivacyBackup()}/>
                {privacyDataNotice?<Text style={[styles.meta,{color:privacyDataNotice.includes('could not')||privacyDataNotice.includes('not an')?p.danger:p.sage}]}>{privacyDataNotice}</Text>:null}
              </View>
            </View>
          </View>

          <View style={styles.settingsColumn}>
            <Text style={[styles.settingsColumnKicker,{color:p.muted}]}>SERVER & ACCESS</Text>

            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>SERVER & FAMILY</Text>
              <View style={styles.settingsRow}>
                <View style={[styles.settingsStatusDot,{backgroundColor:connected?p.sage:recoverableSession?p.danger:p.line}]}/>
                <View style={{flex:1,minWidth:0}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>{connected?'Connected':recoverableSession?'Server offline':'No server connected'}</Text><Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{connected?session?.server:recoverableSession?.server||'Archivist works fully with the library on this device.'}</Text></View>
              </View>
              {recoverableSession&&!session?<View style={styles.settingsInlineActions}><Pressable accessibilityRole="button" onPress={()=>void retrySavedServer()} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'700'}}>{busy?'Retrying…':'Retry server'}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>void forgetSavedServer()} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.muted,fontWeight:'700'}}>Forget</Text></Pressable></View>:null}
              {!session&&!recoverableSession?(serverPanelOpen?<ServerConnect/>:<Pressable accessibilityRole="button" onPress={()=>setServerPanelOpen(true)} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'700'}}>Add server</Text></Pressable>):null}

              {owner?<View style={styles.settingsSubgroup}>
                <Text style={[styles.settingsSubgroupTitle,{color:p.ink}]}>Family users</Text>
                <Text style={[styles.meta,{color:p.muted}]}>Family users can browse, read, listen, rate, favourite and download. Only Admin manages files, metadata, users and server settings.</Text>
                <View style={styles.settingsAddRow}><TextInput accessibilityLabel="New user name" value={newUserName} onChangeText={setNewUserName} placeholder="Name" placeholderTextColor={p.muted} style={[styles.settingsInlineInput,{color:p.ink,backgroundColor:p.card}]}/><Pressable accessibilityRole="button" disabled={busy||!newUserName.trim()} onPress={()=>void createFamilyUser()} style={[styles.settingsAddButton,{opacity:busy||!newUserName.trim()?0.38:1}]}><Text style={{color:p.sage,fontWeight:'700'}}>{busy?'Creating…':'Add user'}</Text></Pressable></View>
                {newUserKey?<View style={[styles.settingsKeyReveal,{backgroundColor:p.card}]}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>User access key — shown once</Text><Text selectable style={[styles.settingsKeyText,{color:p.sage}]}>{newUserKey}</Text><Pressable accessibilityRole="button" onPress={()=>setNewUserKey('')} style={styles.settingsTextAction}><Text style={{color:p.muted,fontWeight:'700'}}>Hide key</Text></Pressable></View>:null}
                {householdUsers.map(user=><View key={user.id} style={[styles.settingsListRow,{borderBottomColor:p.line}]}><View style={{flex:1}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>{user.name}</Text><Text style={[styles.meta,{color:p.muted}]}>{user.revoked?'Revoked':'User · whole library'}</Text></View>{!user.revoked?<Pressable accessibilityRole="button" onPress={()=>void revokeFamilyUser(user.id)} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.danger,fontWeight:'700'}}>Revoke</Text></Pressable>:null}</View>)}
              </View>:null}

              {session?<Pressable accessibilityRole="button" onPress={()=>void signOut()} style={styles.settingsDangerRow}><Text style={{color:p.danger,fontWeight:'700'}}>Sign out</Text></Pressable>:null}
            </View>

            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>ACCESSIBILITY</Text>
              <View style={styles.settingsSubgroup}>
                <Text style={[styles.settingsSubgroupTitle,{color:p.ink}]}>Colour theme</Text>
                <View style={styles.segment}>{(['system','light','dark'] as ThemeMode[]).map(mode=><Pressable key={mode} accessibilityRole="button" accessibilityState={{selected:theme===mode}} onPress={()=>void chooseTheme(mode)} style={[styles.segmentItem,{backgroundColor:theme===mode?p.card:'transparent'}]}><Text style={{color:theme===mode?p.gold:p.muted,fontWeight:theme===mode?'700':'500'}}>{mode[0].toUpperCase()+mode.slice(1)}</Text><View pointerEvents="none" style={[styles.segmentMarker,{backgroundColor:p.gold,opacity:theme===mode?1:0}]}/></Pressable>)}</View>
              </View>
              <View style={styles.settingsRow}><View style={{flex:1}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>Reduced motion</Text><Text style={[styles.meta,{color:p.muted}]}>Disables decorative pulses, page motion and overlay transitions. Device Reduce Motion is always respected.</Text></View><Toggle label="Reduced motion" value={accessibilityPrefs.reduceMotion} onPress={()=>void saveAccessibilityPreferences({...accessibilityPrefs,reduceMotion:!accessibilityPrefs.reduceMotion})}/></View>
              <View style={styles.settingsRow}><View style={{flex:1}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>Increased contrast</Text><Text style={[styles.meta,{color:p.muted}]}>Strengthens secondary text and interface dividers in both themes.</Text></View><Toggle label="Increased contrast" value={accessibilityPrefs.highContrast} onPress={()=>void saveAccessibilityPreferences({...accessibilityPrefs,highContrast:!accessibilityPrefs.highContrast})}/></View>
              <View style={styles.settingsRow}><View style={{flex:1}}><Text style={[styles.bookTitle,settingsTitleStyle,{color:p.ink}]}>Larger interface text</Text><Text style={[styles.meta,{color:p.muted}]}>Increases shared headings and Settings/Profile labels while continuing to respect device font scaling.</Text></View><Toggle label="Larger interface text" value={accessibilityPrefs.largeText} onPress={()=>void saveAccessibilityPreferences({...accessibilityPrefs,largeText:!accessibilityPrefs.largeText})}/></View>
            </View>

            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>ABOUT ARCHIVIST</Text>
              <View style={styles.settingsAboutHero}><View style={[styles.settingsAboutMark,{borderColor:p.gold,backgroundColor:p.card}]}><ArchivistLogo size={40}/></View><View style={{flex:1}}><Text style={[styles.settingsAboutTitle,{color:p.ink}]}>Archivist</Text><Text style={[styles.meta,{color:p.muted}]}>Private media library · Android-first</Text></View></View>
              <View style={[styles.settingsInfoRow,{borderBottomColor:p.line}]}><Text style={[styles.meta,{color:p.muted}]}>App version</Text><Text style={[styles.settingsInfoValue,{color:p.ink}]}>0.9.3</Text></View>
              <View style={[styles.settingsInfoRow,{borderBottomColor:p.line}]}><Text style={[styles.meta,{color:p.muted}]}>Platform</Text><Text style={[styles.settingsInfoValue,{color:p.ink}]}>{Platform.OS}</Text></View>
              <View style={[styles.settingsInfoRow,{borderBottomColor:p.line}]}><Text style={[styles.meta,{color:p.muted}]}>Server</Text><Text numberOfLines={1} style={[styles.settingsInfoValue,{color:connected?p.sage:p.muted,maxWidth:'62%'}]}>{connected?session?.server:'Not connected'}</Text></View>
              <View style={[styles.settingsInfoRow,{borderBottomColor:p.line}]}><Text style={[styles.meta,{color:p.muted}]}>Server version</Text><Text style={[styles.settingsInfoValue,{color:p.muted}]}>{connected?'Not reported by server':'—'}</Text></View>
              <View style={[styles.settingsDiagnostics,{backgroundColor:p.card,borderColor:p.line}]}>
                <Text style={[styles.settingsSubgroupTitle,{color:p.ink}]}>Diagnostics</Text>
                <Text selectable style={[styles.settingsDiagnosticText,{color:p.muted}]}>Local folders: {localFolders.length}\nLocal files: {localBooks.length}\nServer works: {serverWorks.length}\nOffline stored: {localStorageText}\nTheme: {theme}\nReduce motion: {reduceMotion?'on':'off'}\nHigh contrast: {accessibilityPrefs.highContrast?'on':'off'}\nLarge text: {accessibilityPrefs.largeText?'on':'off'}</Text>
              </View>
              <Text style={[styles.meta,{color:p.muted}]}>Open-source and third-party licence notices are included with the packaged application.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  function CurrentTab() {
    if (activeTab === 'shelf') return Shelf();
    if (activeTab === 'library') return Library();
    if (activeTab === 'now') return LiveHub();
    if (activeTab === 'player') return Player();
    if (activeTab === 'reader') return Reader();
    if (activeTab === 'atlas') return Atlas();
    if (activeTab === 'insights') return Insights();
    if (activeTab === 'profile') return Profile();
    if (activeTab === 'rewards') return Rewards();
    return Settings();
  }

  if (restoring) {
    return (
      <SafeAreaView style={[styles.screen,{backgroundColor:p.paper}]}>
        <View style={styles.restoreScreen}>
          <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Pressable accessibilityRole="button" accessibilityLabel="Open Reader Stats" onPress={()=>setActiveTab('insights')} style={{width:44,height:44,borderRadius:22,backgroundColor:p.card,borderWidth:1,borderColor:p.line,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{profileStats?.name?<Text style={{color:p.ink,fontSize:17}}>{profileStats.name.trim().charAt(0).toUpperCase()}</Text>:<ArchivistLogo size={32}/>}</Pressable><Text style={[styles.logoSmall,{color:p.ink}]}>Archivist</Text></View>
          <View style={styles.restoreBody}>
            <View style={[styles.restoreKicker,{backgroundColor:p.line}]}/>
            <View style={[styles.restoreTitle,{backgroundColor:p.card}]}/>
            <View style={[styles.restoreHero,{backgroundColor:p.card}]}>
              <View style={[styles.restoreCover,{backgroundColor:p.raised}]}/>
              <View style={styles.restoreCopy}>
                <View style={[styles.restoreLine,{backgroundColor:p.line,width:'72%'}]}/>
                <View style={[styles.restoreLine,{backgroundColor:p.line,width:'54%'}]}/>
                <View style={[styles.restoreLine,{backgroundColor:p.line,width:'40%'}]}/>
              </View>
            </View>
            <View style={styles.restoreFooter}>
              <ActivityIndicator accessibilityLabel="Opening Archivist library" color={p.sage}/>
              <Text style={[styles.meta,{color:p.muted}]}>Opening your library…</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const tabs: Array<{id: Tab; label: string; icon: UiIconName}> = [
    {id:'shelf',label:'Shelf',icon:'shelf'},
    {id:'library',label:'Library',icon:'library'},
    {id:'now',label:'Now',icon:'bookOpen'},
    {id:'atlas',label:'Atlas',icon:'atlas'},
    {id:'insights',label:'Stats',icon:'insights'},
  ];

  return (
    <SafeAreaView style={[styles.screen,{backgroundColor:darkMode?'#07151C':'#FBFAF7'}]}><AmbientGlow color={ambientHaloColor} size={Math.max(1500,width*2.2)} strength={ambientHaloStrength}/>
      {error ? <View style={[styles.errorBanner,{borderTopColor:p.danger,borderBottomColor:p.danger,backgroundColor:p.paper==='#000000'?'#241416':'#FFF5F5'}]}>
        <Text accessibilityRole="alert" style={[styles.error,{color:p.danger,flex:1}]}>{error}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss error" hitSlop={8} onPress={()=>setError('')} style={styles.errorDismiss}>
          <UiIcon name="close" color={p.danger} size={18}/>
        </Pressable>
      </View> : null}
      <View pointerEvents="box-none" style={[styles.globalProfileCorner,{right:width>=940?28:width>=600?24:18}]}>
        <ProfileAvatarButton size={42}/>
      </View>
      <Animated.View style={[styles.tabBody,{
        opacity:tabTransition,
        transform:[{translateY:tabTransition.interpolate({inputRange:[0,1],outputRange:[reduceMotion?0:6,0]})}],
      }]}>
        {CurrentTab()}
      </Animated.View>
      <CelebrationOverlay
        reduceMotion={reduceMotion} paper={p.paper} ink={p.ink} muted={p.muted}
        active={celebrating || !!achievementCelebration}
        title={achievementCelebration ? achievementCelebration.title : undefined}
        copy={achievementCelebration ? achievementCelebration.description : undefined}
      />
      <ProfileMenu/>
      <WorkDetailsPanel/>
      <RatingPromptPanel />
      {playing && !(activeTab==='now'&&liveMode==='player') && activeTab!=='player' ? (
        <View style={[styles.miniPlayer,{backgroundColor:p.card,borderTopColor:p.line}]}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Open player for '+playing.title} onPress={()=>{setLiveMode('player');setActiveTab('now')}} style={styles.miniPlayerMain}>
            <MiniArtwork book={playing}/>
            <View style={{flex:1,minWidth:0}}>
              <Text numberOfLines={1} style={[styles.miniTitle,{color:p.ink}]}>{playing.title}</Text>
              <Text numberOfLines={1} style={[styles.miniMeta,{color:p.muted}]}>{formatTime(playing.source==='server'?playback?.seconds||0:audio.currentTime||0)} · {(playing.source==='server'?playback?.playing:audio.playing)?'Playing':'Paused'}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={(playing.source==='server'?playback?.playing:audio.playing)?'Pause '+playing.title:'Play '+playing.title} hitSlop={6} onPress={()=>playing.source==='server'?controller.toggle():audio.playing?player.pause():player.play()} style={[styles.miniButton,{backgroundColor:p.raised}]}>
            <UiIcon name={(playing.source==='server'?playback?.playing:audio.playing)?'pause':'play'} color={p.ink} size={20}/>
          </Pressable>
        </View>
      ) : !playing && (reading||lastReading) && !(activeTab==='now'&&liveMode==='reader') && activeTab!=='reader' ? (
        <View style={[styles.miniPlayer,{backgroundColor:p.card,borderTopColor:p.line}]}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Open reader for '+(reading||lastReading)!.title} onPress={()=>{if(!reading&&lastReading)openBook(lastReading);else{setLiveMode('reader');setActiveTab('now')}}} style={styles.miniPlayerMain}>
            <MiniArtwork book={(reading||lastReading)!}/>
            <View style={{flex:1,minWidth:0}}>
              <Text numberOfLines={1} style={[styles.miniTitle,{color:p.ink}]}>{(reading||lastReading)!.title}</Text>
              <Text numberOfLines={1} style={[styles.miniMeta,{color:p.muted}]}>{reading?.format||lastReading?.format||'Reader'} · {readerPage>0?'Page '+(readerPage+1):'Resume reading'}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Resume '+(reading||lastReading)!.title} onPress={()=>{if(!reading&&lastReading)openBook(lastReading);else{setLiveMode('reader');setActiveTab('now')}}} style={[styles.miniButton,{backgroundColor:p.raised}]}>
            <UiIcon name="bookOpen" color={p.ink} size={20}/>
          </Pressable>
        </View>
      ):null}
      {activeTab!=='reader'&&activeTab!=='player'?<View style={[styles.tabBar,{backgroundColor:darkMode?'#07111D':'#FBF8F1',borderTopColor:darkMode?'#26364A':'#DDD3C1'}]}>
        {tabs.map(tab=>{
          const selected=activeTab===tab.id;
          const centre=tab.id==='now';
          const accent=tab.id==='insights'?p.gold:p.sage;
          return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={centre?'Player and Reader':tab.label} accessibilityState={{selected}} onPress={()=>{if(centre){if(!playing&&reading)setLiveMode('reader');setActiveTab('now')}else setActiveTab(tab.id)}} style={[styles.tab,centre&&styles.tabCenter]}>
            <View pointerEvents="none" style={[styles.tabIndicator,{backgroundColor:accent,opacity:selected?1:0}]}/>
            {centre?<View style={[styles.tabCenterOrb,{backgroundColor:selected?p.sage:p.card,borderColor:selected?p.sage:p.line}]}><UiIcon name={tab.icon} color={selected?'#FFFFFF':p.ink} size={25}/></View>:<UiIcon name={tab.icon} color={selected?accent:p.muted} size={22}/>}
            <Text style={[styles.tabText,centre&&styles.tabCenterText,accessibilityPrefs.largeText&&styles.tabTextLarge,{color:selected?accent:p.muted}]}>{tab.label}</Text>
          </Pressable>;
        })}
      </View>:null}
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ArchivistEditorial: require('./assets/fonts/LibreCaslonText.ttf')});
  const system = useColorScheme();
  if (!fontsLoaded && !fontError) return <View accessibilityLabel="Opening Archivist" style={[styles.brandLaunch,{backgroundColor:system==='dark'?'#07151C':'#FBFAF7'}]}><ArchivistLogo size={88}/><Text style={[styles.brandLaunchWordmark,{color:system==='dark'?'#F5F5F5':'#171410'}]}>Archivist</Text><ActivityIndicator color={system==='dark'?'#B99A68':'#47736F'} /></View>;
  return <SafeAreaProvider><Client /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  brandLaunch: {flex:1,alignItems:'center',justifyContent:'center',gap:16},
  brandLaunchWordmark: {fontFamily:'serif',fontSize:30,lineHeight:38,fontWeight:'600',letterSpacing:.2},
  restoreScreen: {flex:1,paddingHorizontal:18,paddingTop:8},
  restoreBody: {flex:1,paddingTop:28,gap:18,maxWidth:760,width:'100%',alignSelf:'center'},
  restoreKicker: {width:68,height:8,borderRadius:4,opacity:.6},
  restoreTitle: {width:'42%',maxWidth:280,height:34,borderRadius:8,opacity:.72},
  restoreHero: {minHeight:180,borderRadius:18,padding:18,flexDirection:'row',alignItems:'center',gap:18,opacity:.8},
  restoreCover: {width:104,aspectRatio:1,borderRadius:8},
  restoreCopy: {flex:1,gap:12},
  restoreLine: {height:8,borderRadius:4,opacity:.72},
  restoreFooter: {flexDirection:'row',alignItems:'center',gap:10,marginTop:4},

  login: {flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14},
  logo: {fontFamily: 'ArchivistEditorial', fontSize: 46, textAlign: 'center'},
  logoSmall: {fontFamily:'ArchivistEditorial',fontSize:24,lineHeight:30,fontWeight:'500'},
  tagline: {fontSize: 12, letterSpacing: 4, textAlign: 'center', fontWeight: '700'},
  loginCopy: {fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 8},
  serverConnect: {gap:10,paddingVertical:2},
  serverConnectTitle: {fontFamily:'sans-serif-medium',fontSize:20,lineHeight:25,fontWeight:'500'},
  serverConnectCopy: {fontSize:13,lineHeight:19,maxWidth:560},
  appHeader: {height:52,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  headerMeta: {fontSize:12,fontWeight:'500'},
  headerSettings: {borderWidth:0},
  settingsButton: {width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:10},
  content: {paddingHorizontal:18,paddingTop:22,paddingBottom:120,gap:18,maxWidth:1120,width:'100%',alignSelf:'center'},
  setupPanel: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:18,gap:12},
  shelfShell: {flex: 1, flexDirection: 'row'},
  libraryRail: {width:148,borderRightWidth:StyleSheet.hairlineWidth,paddingHorizontal:7,paddingTop:8,paddingBottom:18,backgroundColor:'transparent'},
  libraryRailFold: {width:126,paddingHorizontal:5,paddingTop:8},
  libraryRailContent: {paddingBottom:28},
  libraryRailTitle: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.4,marginBottom:2},
  libraryRailList: {gap:2},
  libraryRailAdd: {minHeight:40,paddingHorizontal:10,justifyContent:'center'},
  librarySourceTree: {gap:3},
  libraryTreeGroupLabel: {fontSize:8,lineHeight:10,fontWeight:'800',letterSpacing:1.15,marginTop:13,marginBottom:2,paddingHorizontal:5},
  libraryTreeChildren: {paddingLeft:4,gap:1},
  libraryTreeRow: {minHeight:38,borderRadius:9,paddingHorizontal:4,paddingVertical:4,flexDirection:'row',alignItems:'center',gap:5},
  libraryTreeIcon: {width:24,height:24,borderRadius:12,alignItems:'center',justifyContent:'center',flexShrink:0},
  libraryTreeLabel: {fontSize:10.5,lineHeight:13},
  libraryTreeDetail: {fontSize:8,lineHeight:10.5,marginTop:1},
  libraryTreeCount: {fontSize:9.5,lineHeight:13,fontWeight:'700',fontVariant:['tabular-nums']},
  libraryTreeEmpty: {fontSize:9.5,lineHeight:14,paddingHorizontal:10,paddingVertical:7},
  libraryTreeAdd: {minHeight:38,flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:5,marginTop:2},
  libraryTreeAddText: {fontSize:10.5,lineHeight:13,fontWeight:'700'},
  libraryMobileSourceButton: {minHeight:58,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:7},
  libraryMobileSourceKicker: {fontSize:8,lineHeight:10.5,fontWeight:'800',letterSpacing:1.15},
  libraryMobileSourceLabel: {fontSize:12.5,lineHeight:17,fontWeight:'600',marginTop:1},
  librarySourceSheetBody: {paddingBottom:18},
  libraryHeaderSummary: {minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  libraryManageAction: {minHeight:44,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:4},
  libraryManageActionText: {fontSize:12.5,lineHeight:17,fontWeight:'700'},
  libraryManageScroll: {flexGrow:1,justifyContent:'flex-end',paddingTop:48},
  libraryManageSheet: {width:'100%',maxWidth:860,alignSelf:'center',maxHeight:'94%',borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:18,paddingBottom:28,gap:16},
  libraryHealthGrid: {flexDirection:'row',flexWrap:'wrap',gap:8},
  libraryHealthMetric: {minWidth:120,flexGrow:1,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:12,gap:2},
  libraryHealthValue: {fontFamily:'ArchivistEditorial',fontSize:25,lineHeight:30,fontWeight:'500'},
  libraryHealthLabel: {fontSize:10.5,lineHeight:14,fontWeight:'600'},
  libraryManageSection: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:16,gap:12},
  libraryRepairList: {gap:0},
  libraryRepairRow: {minHeight:62,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',gap:12,paddingVertical:9},
  libraryRepairCount: {fontSize:16,lineHeight:22,fontWeight:'700',fontVariant:['tabular-nums']},
  libraryChoice: {borderWidth: 0, borderRadius: 999, paddingHorizontal: 13, minHeight: 44, justifyContent: 'center'},
  libraryChoiceVertical: {borderRadius: 10, minHeight: 44},
  libraryChipsScroll: {flexGrow:0,minHeight:46,maxHeight:50},
  libraryChips: {gap:8,paddingVertical:2,minHeight:46},
  libraryChipsRow: {flexDirection: 'row', gap: 20},
  librarySpaceTab: {minHeight:44,justifyContent:'center',position:'relative',paddingHorizontal:1},
  librarySpaceTabVertical: {minHeight:44,paddingHorizontal:10},
  librarySpaceText: {fontSize:13},
  librarySpaceMarker: {position:'absolute',left:0,right:0,bottom:0,height:2,borderRadius:2},
  librarySpaceMarkerVertical: {position:'absolute',left:0,top:10,bottom:10,width:3,borderRadius:3},
  librarySummary: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,flexDirection:'row',gap:12,alignItems:'center'},
  reviewBanner: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,borderRadius:0,minHeight:48,paddingVertical:8,paddingHorizontal:0,flexDirection:'row',gap:12,alignItems:'center'},
  reviewBannerCopy: {flex:1,minWidth:0,flexDirection:'row',alignItems:'baseline',gap:10},
  reviewBannerTitle: {fontSize:12.5,lineHeight:18,fontWeight:'600'},
  reviewBannerMeta: {fontSize:12,lineHeight:17,flexShrink:1},
  reviewBannerAction: {fontSize:12.5,lineHeight:18,fontWeight:'600'},
  shelfSection: {gap:10},
  shelfSectionHint: {fontSize:10.5,lineHeight:15,marginTop:2},
  shelfRecommendationSection: {gap:9},
  shelfRecommendationHeader: {minHeight:42,flexDirection:'row',alignItems:'center',gap:10},
  shelfRecommendationIcon: {width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',flexShrink:0},
  continueRow: {gap:12,paddingRight:6},
  continueCard: {width:132,gap:6},
  continueTitle: {fontSize:14,fontWeight:'800'},
  seriesChip: {minWidth:140,maxWidth:220,borderWidth:0,borderRadius:12,paddingHorizontal:14,paddingVertical:12,gap:2},
  scanBanner: {borderRadius:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:10,paddingHorizontal:0,flexDirection:'row',alignItems:'center',gap:12},
  onboardingCard: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:12},
  onboardingEyebrow: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.5},
  onboardingTitle: {fontFamily:'ArchivistEditorial',fontSize:20,lineHeight:25,fontWeight:'500',letterSpacing:-.15},
  onboardingIntro: {fontSize:13,lineHeight:19,maxWidth:560},
  onboardingStep: {flexDirection:'row',gap:12,alignItems:'flex-start',paddingVertical:2},
  onboardingNumber: {width:24,fontSize:11,lineHeight:18,fontWeight:'700',letterSpacing:.7,textAlign:'left'},
  onboardingStepTitle: {fontSize:13.5,lineHeight:18,fontWeight:'600',marginBottom:2},
  shelfSetupActions: {flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'stretch'},
  shelfSetupAction: {minWidth:170,flexGrow:1},
  shelfLocalOnlyAction: {minHeight:40,alignSelf:'flex-start',justifyContent:'center',paddingRight:10},
  sourceRow: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:12,gap:4},
  tabBody: {flex: 1},
  title: {fontFamily:'ArchivistEditorial',fontSize:30,lineHeight:36,fontWeight:'500',marginBottom:2,letterSpacing:-.4},
  sectionTitle: {fontFamily:'ArchivistEditorial',fontSize:18,lineHeight:23,fontWeight:'500',marginTop:8,letterSpacing:-0.1},
  input: {paddingHorizontal:14,paddingVertical:12,borderWidth:0,borderRadius:12,fontSize:16},
  button: {backgroundColor: '#47736F', borderRadius: 12, paddingHorizontal: 18, minHeight: 48, justifyContent: 'center', alignItems: 'center'},
  buttonGold: {backgroundColor:'#B99A68'},
  buttonQuiet: {backgroundColor:'transparent',borderWidth:0},
  buttonDanger: {backgroundColor:'transparent',borderWidth:0},
  buttonText: {color:'#FFFFFF',fontSize:15,lineHeight:20,fontWeight:'600'},
  buttonQuietText: {color:'#47736F'},
  buttonDangerText: {color:'#A94F4F'},
  personalControls: {gap:5,marginTop:7},
  personalControlLabel: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.2},
  personalControlRow: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
  ratingStars: {flexDirection:'row',marginLeft:-6},
  ratingStarButton: {width:44,height:44,alignItems:'center',justifyContent:'center'},
  favouriteTextAction: {minHeight:44,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},

  error: {paddingHorizontal: 16, paddingVertical: 8},
  errorBanner: {position:'absolute',left:18,right:18,top:62,zIndex:70,elevation:10,borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,borderRadius:0,flexDirection:'row',alignItems:'center',shadowColor:'#000',shadowOpacity:.10,shadowRadius:8,shadowOffset:{width:0,height:3}},
  errorDismiss: {width:44,height:44,alignItems:'center',justifyContent:'center'},
  grid: {paddingBottom: 110},
  empty: {fontSize: 15, lineHeight: 22},
  book: {flex: 1, maxWidth: '50%', padding: 8, gap: 7},
  cover: {aspectRatio:2/3,borderRadius:10,overflow:'hidden',shadowColor:'#000',shadowOpacity:.08,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:2},
  coverImage: {position:'absolute',top:0,right:0,bottom:0,left:0,width:'100%',height:'100%'},
  coverSquare: {aspectRatio: 1},
  coverLarge: {width: 230, alignSelf: 'center'},
  coverLargeSquare: {width: 230, height: 230},
  coverFill: {width:'100%',height:'100%',borderRadius:0,shadowOpacity:0,elevation:0},
  coverFallback: {flex:1,padding:10,justifyContent:'space-between'},
  coverFallbackMark: {fontFamily:'serif',fontSize:20,lineHeight:24,opacity:.5},
  coverFallbackCopy: {gap:4},
  metadataCoverEditor: {flexDirection:'row',alignItems:'center',gap:14},
  metadataCoverPreview: {width:74},
  workDetailsScroll: {flexGrow:1,justifyContent:'flex-end',paddingTop:42},
  workDetailsSheet: {width:'100%',maxWidth:760,alignSelf:'center',maxHeight:'94%',borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:18,paddingBottom:28,gap:16},
  workDetailsHero: {flexDirection:'row',gap:18,alignItems:'flex-start'},
  workDetailsHeroFold: {gap:24},
  workDetailsCover: {width:126,aspectRatio:2/3,overflow:'hidden',borderRadius:12,flexShrink:0},
  workDetailsCoverSquare: {aspectRatio:1},
  workDetailsIdentity: {flex:1,minWidth:0,gap:6,paddingTop:2},
  workDetailsTitle: {fontFamily:'ArchivistEditorial',fontSize:26,lineHeight:32,fontWeight:'500',letterSpacing:-.35},
  workDetailsAuthor: {fontSize:14.5,lineHeight:20,fontWeight:'600'},
  workDetailsTags: {flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:3},
  workDetailsTag: {borderWidth:StyleSheet.hairlineWidth,borderRadius:999,paddingHorizontal:9,paddingVertical:5},
  workDetailsTagText: {fontSize:10.5,lineHeight:14,fontWeight:'600'},
  workDetailsFacts: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',flexWrap:'wrap',paddingVertical:12,rowGap:13},
  workDetailsFact: {width:'50%',paddingRight:12,gap:2},
  workDetailsFactLabel: {fontSize:9,lineHeight:12,fontWeight:'800',letterSpacing:1.1,textTransform:'uppercase'},
  workDetailsFactValue: {fontSize:12.5,lineHeight:17,fontWeight:'600'},
  workDetailsActionGrid: {flexDirection:'row',flexWrap:'wrap',gap:8},
  workDetailsAction: {minHeight:48,minWidth:150,flexGrow:1,borderWidth:StyleSheet.hairlineWidth,borderRadius:13,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:9},
  workDetailsActionText: {fontSize:12,lineHeight:16,fontWeight:'700',flexShrink:1},
  workDetailsTrackSummary: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:14,gap:7},
  workDetailsTrackRow: {minHeight:28,flexDirection:'row',alignItems:'center',gap:10},
  coverFormat: {fontSize:9,lineHeight:12,fontWeight:'700',letterSpacing:1.4},
  coverTitle: {fontFamily:'sans-serif-medium',fontSize:13,lineHeight:17,fontWeight:'500'},
  coverTitleLarge: {fontSize:16,lineHeight:21},
  bookTitle: {fontSize:13.5,lineHeight:18,fontWeight:'600'},
  reviewPill: {alignSelf:'flex-start', borderWidth:1, borderRadius:999, paddingHorizontal:8, paddingVertical:3},
  editorCard: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:10},
  serverRecovery: {borderWidth:0,borderRadius:14,padding:16,gap:10},
  offlineSummary: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,flexDirection:'row',gap:12,alignItems:'center'},
  ratingPromptBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.46)',alignItems:'center',justifyContent:'center',padding:24},
  ratingPromptCard: {width:'100%',maxWidth:400,borderWidth:0,borderRadius:18,padding:18,gap:9},
  modalKeyboard: {flex:1},
  modalBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.46)',alignItems:'center',justifyContent:'center',padding:20},
  modalScroll: {flexGrow:1,width:'100%',alignItems:'center',justifyContent:'center',paddingVertical:20},
  modalCard: {width:'100%',maxWidth:520,borderWidth:0,borderRadius:18,padding:18,gap:9},
  meta: {fontSize: 13, lineHeight: 19},
  playerScreen: {paddingHorizontal:18,paddingTop:8,gap:15,paddingBottom:96,maxWidth:1120,width:'100%',alignSelf:'center'},
  playerScreenEmpty: {flexGrow:1},
  playerScreenFold: {paddingHorizontal:24,paddingTop:12,gap:14},
  livingBookStage: {height:220,width:276,maxWidth:'100%',alignSelf:'center',alignItems:'center',justifyContent:'center',position:'relative'},
  livingBookShadow: {position:'absolute',width:202,height:28,borderRadius:101,top:178,transform:[{scaleY:.3}],shadowColor:'#000',shadowOpacity:.16,shadowRadius:18,elevation:4},
  livingBookSpread: {width:216,height:168,position:'relative'},
  livingBookStaticPage: {position:'absolute',top:2,width:106,height:162,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:10,paddingTop:14,gap:7,overflow:'hidden'},
  livingBookLeftPage: {left:2,borderTopLeftRadius:10,borderBottomLeftRadius:10,borderTopRightRadius:3,borderBottomRightRadius:3,alignItems:'center'},
  livingBookRightPage: {left:108,borderTopRightRadius:10,borderBottomRightRadius:10,borderTopLeftRadius:3,borderBottomLeftRadius:3},
  livingBookInnerSpine: {position:'absolute',right:0,top:8,bottom:8,width:3,borderRadius:2},
  livingBookPageLine: {height:3,borderRadius:3,opacity:.8},
  livingBookTurningPage: {position:'absolute',left:108,top:2,width:106,height:162,borderWidth:StyleSheet.hairlineWidth,borderTopRightRadius:10,borderBottomRightRadius:10,paddingHorizontal:12,paddingTop:24,gap:10,zIndex:4,backfaceVisibility:'hidden'},
  livingBookFrontCover: {position:'absolute',left:108,top:0,width:106,zIndex:7,shadowColor:'#000',shadowOpacity:.20,shadowRadius:14,shadowOffset:{width:0,height:7},elevation:7,backfaceVisibility:'hidden'},
  livingBookCoverArt: {width:106,overflow:'hidden',borderRadius:8},
  livingBookCentreLine: {position:'absolute',left:106,top:7,bottom:7,width:2,zIndex:8,opacity:.5},
  livingBookInsetArt: {width:76,marginTop:2,shadowColor:'#000',shadowOpacity:.10,shadowRadius:6,shadowOffset:{width:0,height:3},elevation:2},
  livingBookPageCaption: {fontSize:7,lineHeight:9,fontWeight:'700',letterSpacing:.9,marginTop:1},
  livingBookPageKicker: {fontSize:6,lineHeight:8,fontWeight:'700',letterSpacing:1.0,marginTop:6},
  livingBookPageTitle: {fontFamily:'sans-serif-medium',fontSize:10,lineHeight:13,fontWeight:'500',textAlign:'center',marginTop:2},
  livingBookPageRule: {height:1,width:42,alignSelf:'center',marginVertical:2},
  livingBookPageAuthor: {fontSize:7,lineHeight:10,textAlign:'center'},
  livingBookPageQuote: {fontFamily:'serif',fontSize:8,lineHeight:11,fontStyle:'italic',textAlign:'center',marginTop:3},
  livingBookPageNumber: {position:'absolute',bottom:6,alignSelf:'center',fontSize:6,lineHeight:8,fontWeight:'600',letterSpacing:.6},
  playerHeading: {minHeight:28,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  playerAdaptive: {gap:16},
  playerAdaptiveWide: {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:32,paddingVertical:2},
  playerHeroColumn: {gap:8,alignItems:'center',flexShrink:1,maxWidth:360},
  playerControlColumn: {flex:1,minWidth:250,maxWidth:500,gap:12,justifyContent:'center'},
  playerEyebrow: {fontSize:11,lineHeight:14,fontWeight:'700',letterSpacing:1.6},
  playerArtworkFrame: {alignSelf:'center',borderWidth:0,borderRadius:18,padding:0,shadowColor:'#000',shadowOpacity:0.14,shadowRadius:22,shadowOffset:{width:0,height:10},elevation:5},
  playerIdentity: {alignItems:'center',gap:5,paddingHorizontal:8,maxWidth:620},
  playerStatusRow: {flexDirection:'row',flexWrap:'wrap',justifyContent:'center',alignItems:'center',gap:8,minHeight:20},
  playerSourcePill: {borderWidth:0,minHeight:28,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},
  playerStatusText: {fontSize:11,lineHeight:16},
  playerStatusAction: {minHeight:36,justifyContent:'center',paddingHorizontal:2},
  nowTitle: {fontFamily:'ArchivistEditorial',fontSize:32,lineHeight:38,fontWeight:'500',textAlign:'center',marginTop:0,letterSpacing:-.32,maxWidth:620},
  nowTitleCompact: {fontSize:29,lineHeight:35},
  nowTitleFold: {fontSize:31,lineHeight:37},
  playerByline: {fontSize:14,lineHeight:20,textAlign:'center'},
  playerSeries: {fontSize:12,lineHeight:17,textAlign:'center'},
  playerChapter: {fontSize:12,lineHeight:17,fontWeight:'600',textAlign:'center',marginTop:2},
  progressHitArea: {paddingVertical:10},
  progressTrack: {height:4,borderRadius:999,overflow:'hidden'},
  progressFill: {height:4,borderRadius:999},
  timeRow: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:-6},
  playerTime: {fontSize:12,fontVariant:['tabular-nums'],fontWeight:'500'},
  transport: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,marginVertical:8,maxWidth:560,width:'100%',alignSelf:'center'},
  transportEdgeButton: {width:50,height:50,borderRadius:25,borderWidth:0,alignItems:'center',justifyContent:'center'},
  skipButton: {width:58,height:58,borderRadius:29,borderWidth:0,alignItems:'center',justifyContent:'center',position:'relative'},
  skipNumber: {position:'absolute',fontSize:9,lineHeight:11,fontWeight:'700',fontVariant:['tabular-nums']},
  skipMain: {fontSize:17,fontWeight:'900',lineHeight:19},
  skipMeta: {fontSize:10,fontWeight:'700',textTransform:'uppercase'},
  playButton: {width:80,height:80,borderRadius:40,alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.17,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:5},
  playButtonGlyph: {color:'#f8f7f2',fontSize:24,fontWeight:'900',lineHeight:28},
  playButtonCaption: {color:'#f8f7f2',fontSize:10,fontWeight:'800',textTransform:'uppercase',letterSpacing:0.6},
  playButtonText: {color: '#f8f7f2', fontSize: 17, fontWeight: '800'},
  playerTools: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,flexDirection:'row',justifyContent:'space-between',gap:2,paddingTop:7},
  playerTool: {flex:1,minHeight:56,alignItems:'center',justifyContent:'center',paddingHorizontal:2,paddingVertical:5,gap:3},
  playerToolBorder: {borderLeftWidth:0},
  playerToolIconWrap: {minHeight:24,alignItems:'center',justifyContent:'center',position:'relative'},
  playerToolBadge: {position:'absolute',right:-12,top:-5,fontSize:9,fontWeight:'600'},
  playerSpeedGlyph: {fontSize:16,lineHeight:22,fontWeight:'700',fontVariant:['tabular-nums']},
  playerToolValue: {fontSize:16,fontWeight:'700'},
  playerToolLabel: {fontSize:10,lineHeight:13,fontWeight:'500',marginTop:0},
  playerPanel: {borderWidth:0,borderRadius:16,padding:16,gap:12},
  playerPanelTitle: {fontSize:16,fontWeight:'900'},
  playerNotice: {borderWidth:0,borderRadius:12,padding:12},
  chapterRow: {flexDirection:'row',alignItems:'center',gap:10,padding:10,borderRadius:10},
  chapterIndex: {width:24,textAlign:'center',fontWeight:'900'},
  queueHeader: {flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  queueBook: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,flexDirection:'row',gap:10,alignItems:'center'},
  queueActions: {flexDirection:'row',gap:14,alignItems:'center'},
  queueIconButton: {width:44,height:44,alignItems:'center',justifyContent:'center'},
  iconButton: {width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:19},
  structureRow: {borderBottomWidth:StyleSheet.hairlineWidth,minHeight:50,flexDirection:'row',alignItems:'center',gap:8,paddingVertical:6},
  structureChapter: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,gap:8},
  boundaryRow: {flexDirection:'row',gap:12,flexWrap:'wrap'},
  playerEmpty: {flex:1,borderWidth:0,padding:32,gap:10,alignItems:'center',justifyContent:'center',minHeight:260,maxWidth:420,width:'100%',alignSelf:'center'},
  liveMediaEmpty: {flex:1,minHeight:0,paddingHorizontal:32,paddingBottom:32,gap:10,alignItems:'center',justifyContent:'center',maxWidth:420,width:'100%',alignSelf:'center'},
  toolRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between'},
  readerScreen: {flex:1,position:'relative'},
  readerBar: {position:'absolute',left:0,right:0,top:0,zIndex:25,minHeight:44,flexDirection:'row',alignItems:'center',paddingLeft:2,paddingRight:66,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'rgba(127,127,127,.16)'},
  readerToolsButton: {width:44,minHeight:44,alignItems:'center',justifyContent:'center'},
  searchRow:{flexDirection:'row',alignItems:'center',gap:6},
  filterPill:{borderWidth:0,borderRadius:10,minHeight:38,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},
  readerSheetHeader: {flexDirection:'row',alignItems:'center',gap:12,paddingBottom:8},
  readerSheetClose: {width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  readerSearchInput: {flex:1,minHeight:44,borderWidth:0,borderRadius:11,paddingHorizontal:14,fontSize:15},
  readerSearchButton: {width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  readerToolBlock: {gap:10,paddingVertical:14,borderTopWidth:StyleSheet.hairlineWidth},
  readerAppearanceHeader: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  readerScaleControl: {flexDirection:'row',alignItems:'center',gap:6},
  readerScaleButton: {width:44,height:44,borderRadius:19,alignItems:'center',justifyContent:'center'},
  readerScaleValue: {minWidth:48,textAlign:'center',fontSize:13,fontVariant:['tabular-nums'],fontWeight:'600'},
  readerThemeTabs: {flexDirection:'row',gap:4},
  readerThemeTab: {flex:1,minHeight:40,borderRadius:10,alignItems:'center',justifyContent:'center',position:'relative'},
  readerThemeMarker: {position:'absolute',left:14,right:14,bottom:3,height:2,borderRadius:2},
  readerToolSectionHeader: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  readerBookmarkAction: {minHeight:40,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:4},
  readerSavedAction: {minHeight:38,paddingHorizontal:5,alignItems:'center',justifyContent:'center'},
  readerSavedRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:12},
  readerQuote: {borderLeftWidth:3,paddingLeft:10,fontStyle:'italic',lineHeight:20},
  readerBack: {width:44,minHeight:44,alignItems:'center',justifyContent:'center'},
  readerAction: {fontWeight:'600'},
  readerToolGlyph: {fontFamily:'sans-serif-medium',fontSize:16,fontWeight:'500'},
  readerHeading: {flex:1,alignItems:'center',justifyContent:'center',minWidth:0},
  readerTitle: {width:'100%',textAlign:'center',fontSize:12.5,lineHeight:17,fontWeight:'600'},
  readerFormat: {fontSize:8.5,lineHeight:11,fontWeight:'600',letterSpacing:1.1,textTransform:'uppercase',marginTop:0},
  readerLoading: {flex:1,alignItems:'center',justifyContent:'center',gap:18,padding:24},
  readerLoadingPage: {width:'72%',maxWidth:360,aspectRatio:.72,borderWidth:StyleSheet.hairlineWidth,borderRadius:8,paddingHorizontal:24,paddingTop:34,gap:14},
  readerLoadingLine: {height:3,borderRadius:2},
  readerLoadingStatus: {flexDirection:'row',alignItems:'center',gap:10},
  readerEmpty: {flex:1,alignItems:'center',justifyContent:'center',gap:10,padding:32,maxWidth:420,width:'100%',alignSelf:'center'},
  readerFailure: {margin:28,borderWidth:0,padding:22,gap:12,maxWidth:520,alignSelf:'center'},
  readerOverlay: {position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:20,alignItems:'center',justifyContent:'center',gap:10,opacity:.96},
  readerErrorOverlay: {position:'absolute',left:24,right:24,top:64,zIndex:30,borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:10},
  atlasGroup: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderRadius:0,paddingVertical:16,gap:10},
  atlasRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36},
  atlasText: {fontWeight: '700'},
  atlasBarTrack: {flex:1,height:4,borderRadius:2,overflow:'hidden'},
  atlasBarFill: {height:4,borderRadius:2},
  segment: {flexDirection:'row',gap:4},
  segmentItem: {flex:1,borderWidth:0,borderRadius:10,minHeight:44,paddingHorizontal:10,alignItems:'center',justifyContent:'center',position:'relative'},
  segmentMarker: {position:'absolute',left:12,right:12,bottom:3,height:2,borderRadius:2},
  miniPlayer: {minHeight:64,marginHorizontal:12,marginBottom:8,borderRadius:18,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingHorizontal:16,paddingVertical:5,flexDirection:'row',alignItems:'center',gap:8},
  miniPlayerMain: {flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:9,padding:0},
  miniCover: {width:34,height:34,borderRadius:5,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  miniCoverImage: {position:'absolute',top:0,right:0,bottom:0,left:0,width:'100%',height:'100%'},
  miniCoverLabel: {color:'#FFFFFF',fontSize:8,fontWeight:'700',letterSpacing:.7},
  miniTitle: {fontSize:12.5,lineHeight:17,fontWeight:'600'},
  miniMeta: {fontSize:10.5,lineHeight:14},
  miniButton: {width:40,height:40,borderRadius:10,borderWidth:0,alignItems:'center',justifyContent:'center'},
  miniButtonText: {fontWeight:'600'},
  tabBar: {height:66,borderTopWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'stretch'},
  tab: {flex:1,alignItems:'center',justifyContent:'center',gap:2,position:'relative',minWidth:0},
  tabCenter: {paddingTop:1},
  tabCenterOrb: {width:46,height:46,borderRadius:23,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center',marginTop:-10,shadowColor:'#000',shadowOpacity:.12,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:4},
  tabCenterText: {marginTop:-2},
  tabTextLarge: {fontSize:11.5,lineHeight:14},
  liveHub: {flex:1,width:'100%'},
  liveHubTop: {minHeight:62,paddingHorizontal:18,paddingTop:10,paddingBottom:8,paddingRight:76,flexDirection:'row',alignItems:'center',justifyContent:'center'},
  liveHubSegment: {flex:1,maxWidth:320,height:44,borderRadius:22,borderWidth:StyleSheet.hairlineWidth,padding:3,flexDirection:'row',alignItems:'center'},
  liveHubSegmentItem: {flex:1,height:36,borderRadius:18,borderWidth:StyleSheet.hairlineWidth,borderColor:'transparent',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,position:'relative'},
  liveHubSegmentText: {fontSize:12,lineHeight:16,fontWeight:'600'},
  liveHubDot: {position:'absolute',right:10,top:8,width:6,height:6,borderRadius:3},
  liveHubBody: {flex:1,minHeight:0},
  liveHubScroll: {flex:1},
  playerScreenEmbedded: {paddingTop:0,paddingBottom:96},
  playerLiveKicker: {alignItems:'center',gap:4,paddingTop:2,paddingBottom:2},
  playerLiveMeta: {fontSize:10.5,lineHeight:14,fontWeight:'500'},
  tabIndicator: {position:'absolute',top:0,width:18,height:2,borderRadius:1},
  tabText: {fontSize:9.5,lineHeight:12,fontWeight:'600'},
  celebration: {position:'absolute', left:0, right:0, top:0, bottom:0, alignItems:'center', justifyContent:'center', zIndex:50},
  celebrationParticle: {position:'absolute',fontSize:28,color:'#B99A68',fontWeight:'700'},
  celebrationBadge: {backgroundColor:'#111111',borderRadius:18,width:'86%',maxWidth:400,paddingHorizontal:24,paddingVertical:28,alignItems:'center',shadowColor:'#000',shadowOpacity:.18,shadowRadius:14,elevation:8},
  celebrationTitle: {color:'#F5F5F5',fontSize:18,lineHeight:23,fontWeight:'600'},
  celebrationCopy: {color:'#A0A0A0',fontSize:12.5,lineHeight:18,marginTop:3},
  profileScreen: {paddingHorizontal:18,paddingTop:18,paddingBottom:100,gap:22,maxWidth:920,width:'100%',alignSelf:'center'},
  settingsScreen: {paddingHorizontal:18,paddingTop:10,paddingBottom:126,gap:20,maxWidth:980,width:'100%',alignSelf:'center'},
  settingsScreenFold: {paddingHorizontal:24,paddingTop:10},
  settingsScreenWide: {paddingHorizontal:28,paddingTop:10},
  settingsTitle: {fontFamily:'ArchivistEditorial',fontSize:32,lineHeight:39,fontWeight:'500',letterSpacing:-.32},
  settingsColumns: {gap:20},
  settingsColumnsWide: {flexDirection:'row',alignItems:'flex-start',gap:32},
  settingsColumn: {flex:1,minWidth:0,gap:20},
  settingsColumnKicker: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.6,paddingBottom:2},
  settingsSection: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:16,gap:12},
  settingsSectionTitle: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.45},
  settingsSubgroup: {gap:10,paddingTop:4},
  settingsSubgroupHeading: {flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12},
  settingsSubgroupTitle: {fontSize:13,lineHeight:18,fontWeight:'700'},
  settingsStatusPanel: {flexDirection:'row',alignItems:'center',gap:12,paddingVertical:4},
  settingsStatusIcon: {width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',flexShrink:0},
  settingsPrivacyHero: {borderWidth:StyleSheet.hairlineWidth,borderRadius:18,padding:14,flexDirection:'row',alignItems:'center',gap:12},
  settingsPrivacyMark: {width:42,height:42,borderRadius:21,borderWidth:1.25,alignItems:'center',justifyContent:'center',flexShrink:0},
  settingsStateLabel: {fontSize:10,lineHeight:13,fontWeight:'800',letterSpacing:1.1},
  settingsBackupText: {borderWidth:StyleSheet.hairlineWidth,borderRadius:12,padding:12,fontFamily:Platform.OS==='ios'?'Menlo':'monospace',fontSize:9.5,lineHeight:14,maxHeight:220},
  settingsRestoreInput: {minHeight:104,borderWidth:StyleSheet.hairlineWidth,borderRadius:12,padding:12,textAlignVertical:'top',fontFamily:Platform.OS==='ios'?'Menlo':'monospace',fontSize:10,lineHeight:15},
  settingsToggle: {width:46,height:26,borderRadius:13,padding:3,flexDirection:'row',alignItems:'center',flexShrink:0},
  settingsToggleKnob: {width:20,height:20,borderRadius:10,shadowColor:'#000',shadowOpacity:.12,shadowRadius:3,shadowOffset:{width:0,height:1},elevation:2},
  settingsAboutHero: {flexDirection:'row',alignItems:'center',gap:12,paddingVertical:2},
  settingsAboutMark: {width:48,height:48,borderRadius:14,borderWidth:1.25,alignItems:'center',justifyContent:'center'},
  settingsAboutMarkText: {fontFamily:'ArchivistEditorial',fontSize:25,lineHeight:30,fontWeight:'500'},
  settingsAboutTitle: {fontFamily:'ArchivistEditorial',fontSize:20,lineHeight:25,fontWeight:'500'},
  settingsInfoRow: {minHeight:42,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14},
  settingsInfoValue: {fontSize:11,lineHeight:15,fontWeight:'600',textAlign:'right'},
  settingsDiagnostics: {borderWidth:StyleSheet.hairlineWidth,borderRadius:14,padding:12,gap:7},
  settingsDiagnosticText: {fontFamily:Platform.OS==='ios'?'Menlo':'monospace',fontSize:9.5,lineHeight:15},
  settingsRow: {minHeight:46,flexDirection:'row',alignItems:'center',gap:12},
  settingsStatusDot: {width:8,height:8,borderRadius:4},
  settingsTextAction: {minHeight:44,paddingHorizontal:2,alignItems:'center',justifyContent:'center'},
  settingsInlineActions: {flexDirection:'row',alignItems:'center',gap:16,flexWrap:'wrap'},
  settingsAddRow: {flexDirection:'row',alignItems:'center',gap:8},
  settingsInlineInput: {flex:1,minHeight:44,borderWidth:0,borderRadius:11,paddingHorizontal:13,fontSize:15},
  settingsAddButton: {minHeight:44,paddingHorizontal:6,alignItems:'center',justifyContent:'center'},
  settingsKeyReveal: {borderRadius:12,padding:14,gap:8},
  settingsKeyText: {fontSize:13,lineHeight:18,fontWeight:'600'},
  settingsListRow: {borderBottomWidth:StyleSheet.hairlineWidth,minHeight:54,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:12},
  settingsRowActions: {flexDirection:'row',alignItems:'center',gap:10},
  settingsAddFolder: {gap:8},
  settingsDangerRow: {minHeight:44,alignItems:'flex-start',justifyContent:'center'},
  profileHero: {borderWidth:0,paddingVertical:4,flexDirection:'row',alignItems:'center',gap:14},
  profileTitle: {fontFamily:'ArchivistEditorial',fontSize:28,lineHeight:34,fontWeight:'500',letterSpacing:-.35},
  profileMonogram: {width:50,height:50,borderRadius:25,alignItems:'center',justifyContent:'center'},
  profileMonogramText: {fontFamily:'sans-serif-medium',fontSize:20,fontWeight:'500'},
  profileMetricStrip: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',flexWrap:'wrap',paddingVertical:16,rowGap:16},
  profileMetric: {width:'50%',minWidth:130,gap:2},
  profileMetricFold: {width:'33.333%',minWidth:105},
  profileMetricWide: {width:'16.666%',minWidth:90},
  profileMetricValue: {fontFamily:'sans-serif-medium',fontSize:23,lineHeight:28,fontWeight:'500'},
  profileMetricLabel: {fontSize:12,lineHeight:17,fontWeight:'500'},
  profileDetailRow: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:16},
  profileBreakdownRow: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},
  profileDivider: {height:StyleSheet.hairlineWidth},
  profileAchievementList: {gap:0},
  profileAchievementRow: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12},
  profileAchievementBadge: {width:44,height:44,borderRadius:22,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  profileAchievementInitial: {fontFamily:'sans-serif-medium',fontSize:17,fontWeight:'500'},
  achievementCard: {borderWidth:0,paddingVertical:14,gap:10},
  achievementHeader: {flexDirection:'row',alignItems:'flex-start',gap:12},
  achievementTitle: {fontSize:15,fontWeight:'600'},
  achievementState: {fontSize:12,fontWeight:'600'},
  achievementTrack: {height:6,borderRadius:999,overflow:'hidden'},
  achievementFill: {height:'100%',borderRadius:999},
  atlasFocusHero: {borderWidth:0,paddingVertical:10,gap:5},
  atlasRelationGroup: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:10},
  atlasChipWrap: {flexDirection:'row',flexWrap:'wrap',gap:8},
  atlasRelationChip: {borderWidth:0,borderRadius:10,paddingHorizontal:10,paddingVertical:8,flexDirection:'row',gap:7,alignItems:'center'},
  atlasWorkRow: {borderWidth:0,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:10},
  atlasSearchRow: {flexDirection:'row',alignItems:'center',gap:6,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'rgba(127,127,127,.24)'},
  atlasSearchInput: {flex:1,minHeight:44,borderWidth:0,borderRadius:0,paddingHorizontal:2,fontSize:14},
  atlasSearchButton: {width:44,height:44,borderRadius:0,alignItems:'center',justifyContent:'center'},
  atlasUniverseLayout: {position:'relative',gap:0},
  atlasConstellationStage: {position:'relative',alignItems:'center',justifyContent:'center'},
  atlasConstellationGlow: {position:'absolute',left:0,right:0,top:0,bottom:0,alignItems:'center',justifyContent:'center'},
  atlasRingLayer: {position:'absolute',left:0,top:0,alignItems:'center',justifyContent:'center',zIndex:1},
  atlasInnerRing: {position:'absolute',borderWidth:StyleSheet.hairlineWidth,opacity:.55},
  atlasSelectedRingPulse: {position:'absolute',borderWidth:1.5},
  atlasRingControlPulse: {position:'absolute',left:-5,right:-5,top:-5,bottom:-5,borderRadius:30,borderWidth:1.25},
  atlasRingControl: {position:'absolute',zIndex:30,minWidth:72,minHeight:48,borderRadius:24,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,shadowColor:'#000',shadowOpacity:.12,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:8},
  atlasRingControlGenre: {left:2,top:'42%'},
  atlasRingControlFormat: {right:2,top:'42%'},
  atlasRingControlYear: {bottom:2,alignSelf:'center'},
  atlasRingControlLabel: {fontSize:8,lineHeight:11,fontWeight:'700',letterSpacing:1.05},
  atlasInspectorReveal: {position:'absolute',zIndex:42,elevation:14},
  atlasInspectorRevealMobile: {left:10,right:10,bottom:10},
  atlasInspectorRevealWide: {right:14,top:64,width:310,maxWidth:'42%'},
  atlasBreakdownReveal: {width:'100%',overflow:'hidden'},
  atlasBreakdownSheet: {borderWidth:StyleSheet.hairlineWidth,borderRadius:28,paddingHorizontal:18,paddingBottom:18,paddingTop:8,gap:13,shadowColor:'#000',shadowOpacity:.12,shadowRadius:20,shadowOffset:{width:0,height:8},elevation:5},
  atlasBreakdownHandle: {height:8,alignItems:'center',justifyContent:'center'},
  atlasBreakdownHandleBar: {width:54,height:4,borderRadius:2,opacity:.55},
  atlasBreakdownHeader: {flexDirection:'row',alignItems:'center',gap:12},
  atlasBreakdownBadge: {width:50,height:50,borderRadius:25,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center'},
  atlasBreakdownTitle: {fontFamily:'ArchivistEditorial',fontSize:24,lineHeight:29,fontWeight:'500',letterSpacing:-.2},
  atlasBreakdownSubtitle: {fontSize:12,lineHeight:17,marginTop:1},
  atlasBreakdownRows: {gap:10},
  atlasBreakdownRow: {minHeight:28,flexDirection:'row',alignItems:'center',gap:9},
  atlasBreakdownDot: {width:12,height:12,borderRadius:6,flexShrink:0},
  atlasBreakdownName: {width:96,fontSize:12,lineHeight:17,fontWeight:'500'},
  atlasBreakdownTrack: {flex:1,height:8,borderRadius:4,overflow:'hidden'},
  atlasBreakdownFill: {height:'100%',borderRadius:4},
  atlasBreakdownCount: {width:34,textAlign:'right',fontSize:12,lineHeight:17,fontVariant:['tabular-nums']},
  atlasBreakdownPercent: {width:36,textAlign:'right',fontSize:11,lineHeight:16,fontVariant:['tabular-nums']},
  atlasBreakdownNote: {fontSize:9.5,lineHeight:14},
  atlasUniverseLayoutWide: {flexDirection:'row',alignItems:'stretch'},
  atlasViewport: {flex:1,borderWidth:0,borderRadius:999,overflow:'hidden',position:'relative',minWidth:0},
  atlasUniverseCanvas: {position:'absolute'},
  atlasUniverseEdge: {position:'absolute',height:1,shadowColor:'#7DA9C4',shadowOpacity:.18,shadowRadius:3},
  atlasUniverseNode: {position:'absolute',borderWidth:0,borderRadius:14,padding:5,alignItems:'center',justifyContent:'center',overflow:'visible',shadowColor:'#000',shadowOpacity:.06,shadowRadius:4,elevation:2},
  atlasUniverseNodeSelected: {borderWidth:2,shadowOpacity:.16,shadowRadius:9,elevation:5},
  atlasGenreNode: {borderRadius:48,padding:10,borderWidth:StyleSheet.hairlineWidth,shadowOpacity:.04,shadowRadius:12},
  atlasAuthorNode: {borderRadius:29,overflow:'hidden'},
  atlasSeriesNode: {borderRadius:10,paddingHorizontal:4,paddingTop:3,paddingBottom:12},
  atlasWorkNode: {borderRadius:7,padding:3,overflow:'hidden'},
  atlasCollectionNode: {borderRadius:14,paddingHorizontal:5,paddingTop:4,paddingBottom:12},
  atlasSeriesGlyph: {height:42,flexDirection:'row',alignItems:'flex-end',gap:3},
  atlasSeriesSpine: {width:7,borderRadius:2},
  atlasCollectionGlyph: {width:42,height:34,position:'relative'},
  atlasCollectionSheet: {position:'absolute',width:28,height:30,borderWidth:StyleSheet.hairlineWidth,borderRadius:4,backgroundColor:'transparent'},
  atlasNoteGlyph: {width:32,height:38,borderWidth:StyleSheet.hairlineWidth,borderRadius:4,paddingHorizontal:5,paddingTop:9,gap:5},
  atlasNoteLine: {height:2,borderRadius:2},
  atlasNodeCaption: {position:'absolute',top:'100%',marginTop:3,minWidth:72,maxWidth:92},
  atlasNodeCover: {position:'absolute',left:0,top:0,right:0,bottom:0,width:'100%',height:'100%'},
  atlasNodeLabel: {fontSize:9,fontWeight:'900',textAlign:'center',lineHeight:11},
  atlasNodeMonogram: {fontFamily:'sans-serif-medium',fontSize:15,fontWeight:'700'},
  atlasNodeCount: {fontSize:10,fontWeight:'900',marginTop:2},
  atlasNodeSourceDot: {position:'absolute',right:4,bottom:4,width:8,height:8,borderRadius:4,borderWidth:1,borderColor:'#f8f7f2'},
  atlasViewportTools: {position:'absolute',right:8,top:8,zIndex:20,flexDirection:'row',gap:4},
  atlasZoomButton: {borderWidth:0},
  atlasToolButton: {minHeight:44,paddingHorizontal:10,borderRadius:8,alignItems:'center',justifyContent:'center'},
  atlasFindButton: {height:46,paddingHorizontal:16,borderRadius:12,alignItems:'center',justifyContent:'center'},
  atlasFindText: {color:'#FFFFFF',fontSize:14,fontWeight:'600'},
  atlasClusterNotice: {position:'absolute',left:10,bottom:10,maxWidth:320,borderWidth:0,borderRadius:0,paddingHorizontal:6,paddingVertical:4,opacity:.88},
  atlasInspector: {borderWidth:StyleSheet.hairlineWidth,borderRadius:22,padding:16,gap:11,overflow:'hidden',shadowColor:'#000',shadowOpacity:.18,shadowRadius:22,shadowOffset:{width:0,height:10},elevation:14},
  atlasInspectorAccent: {position:'absolute',left:0,top:0,bottom:0,width:3},
  atlasInspectorHeader: {flexDirection:'row',alignItems:'center',gap:11},
  atlasInspectorIcon: {width:38,height:38,borderRadius:19,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center',flexShrink:0},
  atlasInspectorKicker: {fontSize:9,lineHeight:12,fontWeight:'800',letterSpacing:1.25},
  atlasInspectorTitle: {fontFamily:'ArchivistEditorial',fontSize:19,lineHeight:24,fontWeight:'500',marginTop:1},
  atlasInspectorSubtitle: {fontSize:11,lineHeight:16},
  atlasInspectorClose: {width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',flexShrink:0},
  atlasInspectorMetaRow: {flexDirection:'row',flexWrap:'wrap',gap:7},
  atlasInspectorMetaChip: {minHeight:28,borderRadius:14,paddingHorizontal:10,alignItems:'center',justifyContent:'center'},
  atlasInspectorMetaText: {fontSize:9.5,lineHeight:13,fontWeight:'600'},
  atlasInspectorActions: {flexDirection:'row',flexWrap:'wrap',gap:8,paddingTop:2},

  atlasScreen: {paddingHorizontal:18,paddingTop:10,paddingBottom:100,gap:16,maxWidth:1280,width:'100%',alignSelf:'center'},
  atlasScreenFold: {paddingHorizontal:24,paddingTop:10},
  atlasScreenWide: {paddingHorizontal:28,paddingTop:10},
  atlasTitle: {fontFamily:'ArchivistEditorial',fontSize:32,lineHeight:39,fontWeight:'500',letterSpacing:-.32},
  atlasFocusTitle: {fontFamily:'ArchivistEditorial',fontSize:28,lineHeight:34,fontWeight:'500',letterSpacing:-.35},
  atlasListAlternative: {gap:0},
  atlasUniverseStats: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:18,gap:16},
  atlasUniverseStatsHeader: {flexDirection:'row',alignItems:'flex-end',gap:12},
  atlasUniverseStatsTitle: {fontFamily:'ArchivistEditorial',fontSize:24,lineHeight:30,fontWeight:'500',letterSpacing:-.2},
  atlasUniverseStatsCopy: {fontSize:11,lineHeight:16,marginTop:2},
  atlasUniverseStatsTotal: {fontSize:11,lineHeight:16,fontWeight:'700',letterSpacing:.35,textTransform:'uppercase'},
  atlasUniverseStatsGrid: {flexDirection:'row',flexWrap:'wrap',alignItems:'stretch'},
  atlasUniverseStat: {width:'50%',minHeight:92,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:13,paddingHorizontal:9,justifyContent:'flex-start'},
  atlasUniverseStatWide: {width:'25%',minHeight:94},
  atlasUniverseStatValue: {fontFamily:'ArchivistEditorial',fontSize:25,lineHeight:30,fontWeight:'500',fontVariant:['tabular-nums']},
  atlasUniverseStatLabel: {fontSize:10.5,lineHeight:15,fontWeight:'700',marginTop:1},
  atlasUniverseStatCopy: {fontSize:9,lineHeight:13,marginTop:1,minHeight:26},
  atlasUniverseHighlights: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:14,gap:2},
  atlasUniverseHighlightsKicker: {fontSize:9,lineHeight:12,fontWeight:'700',letterSpacing:1.3,marginBottom:5},
  atlasUniverseHighlightRow: {minHeight:58,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',gap:12,paddingVertical:9},
  atlasUniverseHighlightLabel: {width:104,fontSize:9.5,lineHeight:13,fontWeight:'600'},
  atlasUniverseHighlightValue: {fontFamily:'ArchivistEditorial',fontSize:16,lineHeight:21,fontWeight:'500'},
  atlasUniverseHighlightMeta: {fontSize:9,lineHeight:13,marginTop:1},
  atlasHint: {fontSize:10.5,lineHeight:15,textAlign:'center',letterSpacing:.2},
  insightsScreen: {paddingHorizontal:18,paddingTop:18,paddingBottom:100,gap:24,maxWidth:1120,width:'100%',alignSelf:'center'},
  insightsTitle: {fontFamily:'ArchivistEditorial',fontSize:30,lineHeight:36,fontWeight:'500',letterSpacing:-.4},
  sourceSwitcherScroll: {flexGrow:0,minHeight:48,maxHeight:52},
  sourceSwitcher: {flexDirection:'row',gap:20,paddingRight:14,paddingVertical:2,minHeight:48,alignItems:'stretch'},
  sourceSwitcherVertical: {gap:0},
  sourceTab: {minHeight:46,justifyContent:'center',position:'relative',paddingHorizontal:1},
  sourceTabVertical: {paddingHorizontal:10,minHeight:44},
  sourceTabText: {fontSize:13},
  sourceTabCount: {fontSize:11,fontWeight:'600'},
  sourceTabMarker: {position:'absolute',left:0,right:0,bottom:1,height:2,borderRadius:2},
  sourceTabMarkerVertical: {position:'absolute',left:0,top:10,bottom:10,width:3,borderRadius:3},
  shelfContent: {paddingHorizontal:18,paddingTop:10,paddingBottom:120,gap:32,maxWidth:1280,width:'100%',alignSelf:'center'},
  shelfContentFold: {paddingHorizontal:24,paddingTop:10,gap:34},
  shelfContentWide: {paddingHorizontal:28,paddingTop:10,gap:34},
  shelfEditorialHeader: {flexDirection:'row',alignItems:'flex-start',gap:16,paddingTop:2,paddingBottom:0},
  shelfEditorialHeaderFold: {paddingTop:0},
  shelfKicker: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:2.2,marginBottom:7},
  shelfGreeting: {fontFamily:'ArchivistEditorial',fontSize:34,lineHeight:40,fontWeight:'500',letterSpacing:-.55},
  shelfGreetingCompact: {fontSize:30,lineHeight:36},
  shelfGreetingFold: {fontSize:36,lineHeight:42},
  shelfEditorialSubtitle: {fontFamily:'sans-serif',fontSize:14,lineHeight:20,fontStyle:'italic',marginTop:3,maxWidth:320},
  shelfBrowseBand: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,gap:12},
  shelfBrowseLabel: {fontSize:9,lineHeight:12,fontWeight:'700',letterSpacing:1.8},
  shelfBrowseCopy: {fontSize:10.5,lineHeight:15,marginTop:2},
  shelfBrowseShortcutGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:10,rowGap:10},
  shelfBrowseShortcut: {width:'48%',minWidth:150,flexGrow:1,minHeight:62,borderWidth:StyleSheet.hairlineWidth,borderRadius:16,paddingHorizontal:12,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:9},
  shelfBrowseShortcutIcon: {width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',flexShrink:0},
  shelfBrowseShortcutTitle: {fontSize:12.5,lineHeight:17,fontWeight:'700'},
  shelfBrowseShortcutMeta: {fontSize:9.5,lineHeight:13,marginTop:1},
  shelfStorageShortcuts: {gap:8,paddingTop:2},
  shelfStorageShortcutRow: {flexDirection:'row',flexWrap:'wrap',columnGap:10,rowGap:8},
  shelfStorageShortcut: {minWidth:170,flexGrow:1,minHeight:46,borderWidth:StyleSheet.hairlineWidth,borderRadius:14,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8},
  shelfStorageShortcutText: {fontSize:11.5,lineHeight:16,fontWeight:'600',flex:1},
  shelfStorageShortcutCount: {fontSize:10,lineHeight:14,fontWeight:'700',fontVariant:['tabular-nums']},
  standardPageHeader: {minHeight:66,flexDirection:'row',alignItems:'center',paddingRight:58},
  standardPageHeaderCopy: {flex:1,minWidth:0},
  standardPageTitle: {fontFamily:'ArchivistEditorial',fontSize:32,lineHeight:39,fontWeight:'500',letterSpacing:-.32},
  standardPageTitleLarge: {fontSize:36,lineHeight:43},
  standardPageSubtitle: {fontSize:14,lineHeight:20,marginTop:2,fontWeight:'400'},
  standardPageSubtitleLarge: {fontSize:16,lineHeight:23},
  pageHeaderToolbar: {minHeight:42,marginTop:-4,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',paddingRight:58},
  pageHeaderToolbarStart: {justifyContent:'flex-start'},
  pageHeaderToolbarCenter: {justifyContent:'center'},
  pageHeaderMeta: {fontSize:11.5,lineHeight:16,marginTop:-5},
  globalProfileCorner: {position:'absolute',top:10,zIndex:80,elevation:12},
  profileAvatarButtonWrap: {position:'relative',alignItems:'center',justifyContent:'center',flexShrink:0},
  profileAvatarHalo: {position:'absolute',left:0,right:0,top:0,bottom:0},
  profileAvatarLevelRing: {position:'absolute',left:0,top:0},
  profileAvatarButton: {alignItems:'center',justifyContent:'center',flexShrink:0,borderWidth:StyleSheet.hairlineWidth,borderColor:'rgba(255,255,255,.16)',shadowColor:'#000',shadowOpacity:.08,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:5},
  profileAvatarInitials: {color:'#FFFFFF',fontFamily:'sans-serif-medium',fontWeight:'600',letterSpacing:.2},
  profileAvatarLevelBadge: {position:'absolute',right:-1,bottom:-1,minWidth:17,height:17,borderRadius:9,borderWidth:1,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
  profileAvatarLevelText: {fontSize:8,lineHeight:10,fontWeight:'800',fontVariant:['tabular-nums']},
  profileMenuLayer: {flex:1,position:'relative'},
  profileMenuBackdropLayer: {position:'absolute',left:0,right:0,top:0,bottom:0},
  profileMenuBackdrop: {position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(0,0,0,.28)'},
  profileMenu: {position:'absolute',right:14,top:58,width:300,maxWidth:'88%',borderRadius:18,borderWidth:StyleSheet.hairlineWidth,padding:10,shadowColor:'#000',shadowOpacity:.2,shadowRadius:20,shadowOffset:{width:0,height:8},elevation:10},
  profileMenuIdentity: {flexDirection:'row',alignItems:'center',gap:11,padding:8,paddingBottom:12},
  profileMenuAvatar: {width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center'},
  profileMenuAvatarImage: {width:'100%',height:'100%'},
  profileMenuAvatarText: {color:'#FFFFFF',fontFamily:'sans-serif-medium',fontSize:17,fontWeight:'600'},
  profileMenuName: {fontFamily:'ArchivistEditorial',fontSize:18,lineHeight:22,fontWeight:'500'},
  profileMenuMeta: {fontSize:10.5,lineHeight:14,marginTop:2},
  profileMenuItem: {minHeight:58,borderTopWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:8,paddingVertical:7},
  profileMenuIcon: {width:34,height:34,borderRadius:17,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center'},
  profileMenuItemTitle: {fontSize:13,lineHeight:18,fontWeight:'600'},
  profileMenuItemCopy: {fontSize:9.5,lineHeight:13,marginTop:1},
  profileHubScreen: {paddingHorizontal:18,paddingTop:10,paddingBottom:126,gap:20,width:'100%',maxWidth:980,alignSelf:'center'},
  profileHubScreenFold: {paddingHorizontal:24,paddingTop:10},
  profileHubScreenWide: {paddingHorizontal:28,paddingTop:10},
  profileIdentityHero: {flexDirection:'row',alignItems:'center',gap:16,paddingTop:8,paddingBottom:18,borderBottomWidth:StyleSheet.hairlineWidth},
  profileIdentityHeroRich: {alignItems:'center',gap:18},
  profileIdentityRing: {width:112,height:112,position:'relative',alignItems:'center',justifyContent:'center',flexShrink:0},
  profileIdentityAvatar: {width:82,height:82,borderRadius:41,alignItems:'center',justifyContent:'center'},
  profileIdentityAvatarRing: {position:'absolute',width:78,height:78,borderRadius:39},
  profileIdentityLevelBadge: {position:'absolute',right:2,bottom:4,minWidth:28,height:22,borderRadius:11,borderWidth:1,alignItems:'center',justifyContent:'center',paddingHorizontal:6},
  profileIdentityLevelText: {fontSize:9.5,lineHeight:12,fontWeight:'800',fontVariant:['tabular-nums']},
  profileIdentityAvatarText: {color:'#FFFFFF',fontFamily:'ArchivistEditorial',fontSize:30,lineHeight:36,fontWeight:'500'},
  profileIdentityAvatarImage: {width:'100%',height:'100%'},
  profileIdentityCopy: {flex:1,minWidth:0,gap:4},
  profileIdentityKicker: {fontSize:9,lineHeight:12,fontWeight:'800',letterSpacing:1.3},
  profileIdentityName: {fontFamily:'ArchivistEditorial',fontSize:24,lineHeight:30,fontWeight:'500'},
  profileTraitRow: {flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:6},
  profileTraitChip: {minHeight:28,borderRadius:14,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:10,alignItems:'center',justifyContent:'center'},
  profileTraitText: {fontSize:9.5,lineHeight:13,fontWeight:'600'},
  profileBestGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:12,rowGap:12},
  profileBestCard: {width:'47%',minWidth:135,flexGrow:1,borderWidth:StyleSheet.hairlineWidth,borderRadius:16,padding:12,gap:5},
  profileBestIcon: {width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center'},
  profileBestValue: {fontFamily:'ArchivistEditorial',fontSize:20,lineHeight:24,fontWeight:'500'},
  profileBestLabel: {fontSize:9.5,lineHeight:13},
  profileGoalGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:12,rowGap:12},
  profileGoalCard: {width:'47%',minWidth:150,flexGrow:1,borderWidth:StyleSheet.hairlineWidth,borderRadius:16,padding:12,gap:7},
  profileGoalTop: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
  profileGoalValue: {fontFamily:'ArchivistEditorial',fontSize:18,lineHeight:22,fontWeight:'500',fontVariant:['tabular-nums']},
  profileGoalLabel: {fontSize:10,lineHeight:14},
  profileGoalTrack: {height:5,borderRadius:3,overflow:'hidden'},
  profileGoalFill: {height:'100%',borderRadius:3},
  profileSectionHeadingRow: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  profileMilestoneList: {gap:0},
  profileMilestoneRow: {minHeight:62,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',gap:11,paddingVertical:9},
  profileMilestoneMedal: {width:40,height:40,borderRadius:20,borderWidth:1.25,alignItems:'center',justifyContent:'center'},
  profileHubSection: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:16,gap:12},
  profileHubSectionTitle: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.45},
  profileInitialInput: {width:86,minHeight:44,borderWidth:0,borderBottomWidth:StyleSheet.hairlineWidth,fontFamily:'ArchivistEditorial',fontSize:22,lineHeight:28,textAlign:'center'},
  profileAvatarEditor: {gap:12},
  profileAvatarPalette: {flexDirection:'row',flexWrap:'wrap',gap:10},
  profileAvatarSwatch: {width:38,height:38,borderRadius:19,borderWidth:2},
  profileSnapshotGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:16,rowGap:14},
  profileSnapshotItem: {width:'46%',flexGrow:1},
  profileSnapshotItemWide: {width:'22%',minWidth:120},
  profileSnapshotValue: {fontFamily:'ArchivistEditorial',fontSize:22,lineHeight:27,fontWeight:'500'},
  profileSnapshotLabel: {fontSize:10,lineHeight:14,marginTop:2},
  profileHubLink: {minHeight:64,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:StyleSheet.hairlineWidth},
  profileHubLinkIcon: {width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
  rewardsLevelHero: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:20,flexDirection:'row',alignItems:'center',gap:20},
  rewardsHeroRing: {width:118,height:118,position:'relative',alignItems:'center',justifyContent:'center',flexShrink:0},
  rewardsHeroRingCenter: {position:'absolute',left:0,right:0,top:0,bottom:0,alignItems:'center',justifyContent:'center'},
  rewardsHeroLevelLabel: {fontSize:8.5,lineHeight:11,fontWeight:'800',letterSpacing:1.4},
  rewardsHeroLevel: {fontFamily:'ArchivistEditorial',fontSize:34,lineHeight:38,fontWeight:'500',fontVariant:['tabular-nums']},
  rewardsHeroCopy: {flex:1,minWidth:0,gap:7},
  rewardsHeroTitle: {fontFamily:'ArchivistEditorial',fontSize:26,lineHeight:32,fontWeight:'500',letterSpacing:-.2},
  rewardsHeroMeta: {fontSize:11,lineHeight:16,fontWeight:'600',fontVariant:['tabular-nums']},
  rewardsHeroFootnote: {fontSize:9.5,lineHeight:14,maxWidth:520},
  rewardsCompletionTrack: {height:6,borderRadius:3,overflow:'hidden',marginTop:2},
  rewardsCompletionFill: {height:'100%',borderRadius:3},
  rewardsSection: {gap:12,paddingTop:4},
  rewardsSectionHeading: {flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12},
  rewardsSectionTitle: {fontFamily:'ArchivistEditorial',fontSize:22,lineHeight:28,fontWeight:'500',letterSpacing:-.12},
  rewardsPathGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:12,rowGap:12},
  rewardsPathCard: {width:'48%',minWidth:150,flexGrow:1,borderWidth:StyleSheet.hairlineWidth,borderRadius:16,padding:12,gap:10},
  rewardsPathTop: {flexDirection:'row',alignItems:'center',gap:9},
  rewardsPathRing: {width:52,height:52,alignItems:'center',justifyContent:'center',position:'relative',flexShrink:0},
  rewardsPathIcon: {position:'absolute',left:0,right:0,top:0,bottom:0,alignItems:'center',justifyContent:'center'},
  rewardsPathName: {fontSize:12.5,lineHeight:17,fontWeight:'700'},
  rewardsPathTitle: {fontSize:9.5,lineHeight:13,marginTop:1},
  rewardsPathLevel: {fontFamily:'ArchivistEditorial',fontSize:18,lineHeight:22,fontWeight:'500'},
  rewardsPathTrack: {height:4,borderRadius:2,overflow:'hidden'},
  rewardsPathFill: {height:'100%',borderRadius:2},
  rewardsMilestoneRail: {paddingVertical:4,paddingRight:18,gap:0},
  rewardsMilestoneItem: {width:108,alignItems:'center',position:'relative',gap:4},
  rewardsMilestoneLine: {position:'absolute',height:1,left:-54,right:54,top:25},
  rewardsMilestoneMedal: {width:50,height:50,borderRadius:25,borderWidth:1.25,alignItems:'center',justifyContent:'center'},
  rewardsMilestoneCurrent: {borderWidth:2,transform:[{scale:1.06}]},
  rewardsMilestoneLevel: {fontSize:9.5,lineHeight:13,fontWeight:'700',marginTop:3},
  rewardsMilestoneTitle: {fontSize:9,lineHeight:12,maxWidth:100,textAlign:'center'},
  rewardsNextGrid: {gap:0,borderTopWidth:StyleSheet.hairlineWidth},
  rewardsNextCard: {minHeight:66,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',gap:11,paddingVertical:10},
  rewardsNextIcon: {width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},
  rewardsNextPercent: {fontSize:11,lineHeight:15,fontWeight:'800',fontVariant:['tabular-nums']},
  rewardsRecentSpotlight: {maxWidth:460},
  rewardsCategories: {gap:6,paddingRight:12},
  rewardsCategory: {minHeight:40,borderRadius:20,borderWidth:StyleSheet.hairlineWidth,borderColor:'transparent',paddingHorizontal:13,alignItems:'center',justifyContent:'center'},
  rewardTrophyGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:12,rowGap:12},
  rewardTrophyCard: {width:'48%',minWidth:148,flexGrow:1,borderWidth:StyleSheet.hairlineWidth,borderRadius:18,padding:13,gap:7,minHeight:188},
  rewardTrophyCardWide: {width:'31%',minWidth:190},
  rewardTrophyTop: {flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:10},
  rewardMedalWrap: {width:58,height:60,alignItems:'center',justifyContent:'flex-start',position:'relative'},
  rewardPulseHalo: {position:'absolute',top:0,width:48,height:48,borderRadius:24},
  rewardRibbon: {position:'absolute',top:38,width:13,height:20,borderBottomLeftRadius:2,borderBottomRightRadius:2},
  rewardRibbonLeft: {left:14,transform:[{rotate:'8deg'}]},
  rewardRibbonRight: {right:14,transform:[{rotate:'-8deg'}]},
  rewardMedal: {width:48,height:48,borderRadius:24,borderWidth:1.5,alignItems:'center',justifyContent:'center',zIndex:2},
  rewardRecent: {fontSize:8.5,lineHeight:11,fontWeight:'800',letterSpacing:1.1},
  rewardProgressLabel: {fontSize:9,lineHeight:12,fontWeight:'800',fontVariant:['tabular-nums']},
  rewardTrophyTitle: {fontFamily:'ArchivistEditorial',fontSize:16,lineHeight:20,fontWeight:'500'},
  rewardTrophyCopy: {fontSize:9.5,lineHeight:14,flexGrow:1},
  rewardTrophyTrack: {height:4,borderRadius:2,overflow:'hidden',marginTop:2},
  rewardTrophyFill: {height:'100%',borderRadius:2},
  pageHeadingRow: {flexDirection:'row',alignItems:'flex-start',gap:12},
  pageSubtitle: {fontSize:14,lineHeight:21,marginTop:2,fontWeight:'400'},
  headerAction: {borderWidth:0,borderRadius:10,minHeight:44,paddingHorizontal:8,alignItems:'center',justifyContent:'center'},
  sectionHeader: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  sectionLink: {minHeight:44,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},
  curatedRow: {gap:18,paddingRight:24},
  curatedCardWrap: {width:136},
  shelfHero: {borderRadius:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,paddingHorizontal:0,flexDirection:'row',gap:16,alignItems:'center',overflow:'hidden',minHeight:156},
  shelfHeroFold: {paddingVertical:16,gap:20,minHeight:168},
  shelfHeroWide: {paddingVertical:18,gap:24,minHeight:180},
  shelfHeroArtwork: {width:104,minWidth:104},
  shelfHeroArtworkFold: {width:120,minWidth:120},
  shelfHeroArtworkWide: {width:132,minWidth:132},
  shelfHeroCopy: {flex:1,minWidth:0,gap:6,paddingVertical:2},
  shelfHeroEyebrow: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.35},
  shelfHeroTitle: {fontFamily:'ArchivistEditorial',fontSize:24,lineHeight:29,fontWeight:'500',letterSpacing:-.2},
  shelfHeroTitleCompact: {fontSize:21,lineHeight:26},
  shelfHeroTitleFold: {fontSize:25,lineHeight:30},
  shelfHeroAuthor: {fontSize:14,lineHeight:21},
  shelfHeroResume: {fontSize:12,lineHeight:17,fontWeight:'700',letterSpacing:.15},
  shelfHeroFooter: {marginTop:4,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  shelfHeroMeta: {fontSize:12,lineHeight:17},
  shelfHeroAction: {minWidth:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center',paddingHorizontal:14},
  shelfHeroActionText: {color:'#FFFFFF',fontSize:13,fontWeight:'700'},
  smartShelfRow: {gap:24,paddingRight:24},
  smartShelfTile: {width:196,gap:6},
  smartShelfPreview: {height:136,position:'relative',marginBottom:8},
  smartShelfCover: {position:'absolute',top:4,width:78,overflow:'hidden',borderRadius:8,shadowColor:'#000',shadowOpacity:.14,shadowRadius:9,shadowOffset:{width:0,height:5},elevation:3},
  smartShelfBase: {position:'absolute',left:0,right:2,bottom:3,height:3,borderRadius:2,opacity:.9},
  smartShelfEmpty: {position:'absolute',left:8,right:18,bottom:8,height:82,borderBottomWidth:1,flexDirection:'row',alignItems:'flex-end',gap:7,paddingHorizontal:8},
  smartShelfEmptySpine: {width:18,height:60,borderRadius:3},
  smartShelfName: {fontFamily:'sans-serif-medium',fontSize:15,lineHeight:20,fontWeight:'500'},
  collectionRow: {gap:22,paddingRight:24},
  collectionTile: {width:166,gap:6},
  collectionCollage: {height:126,position:'relative',marginBottom:7},
  collectionMiniCover: {position:'absolute',width:70,overflow:'hidden',borderRadius:8,shadowColor:'#000',shadowOpacity:.13,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:3},
  collectionEmptyMark: {width:92,height:108,borderRadius:12,alignItems:'center',justifyContent:'center'},
  collectionName: {fontSize:15,lineHeight:20,fontWeight:'600'},
  seriesRow: {gap:20,paddingRight:20},
  seriesTile: {width:152,borderWidth:0,gap:5},
  seriesCoverStack: {height:108,position:'relative',marginBottom:6},
  seriesCover: {position:'absolute',width:64,overflow:'hidden',borderRadius:7,shadowColor:'#000',shadowOpacity:.09,shadowRadius:6,shadowOffset:{width:0,height:3},elevation:2},
  seriesEmpty: {position:'absolute',left:0,top:0,width:104,height:108,borderWidth:StyleSheet.hairlineWidth,borderRadius:10},
  seriesName: {fontFamily:'sans-serif-medium',fontSize:15,lineHeight:20,fontWeight:'500'},
  shelfUtilityRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:14,flexDirection:'row',flexWrap:'wrap',gap:16},
  shelfUtilityAction: {minHeight:44,paddingHorizontal:0,paddingRight:8,justifyContent:'center'},
  brandSignature: {fontSize:10,fontWeight:'700',letterSpacing:3,textAlign:'center',marginTop:8},
  designedEmpty: {borderWidth:0,padding:28,gap:10,alignItems:'center',justifyContent:'center',minHeight:180},
  emptyMark: {fontFamily:'serif',fontSize:34,fontWeight:'800'},
  skeletonRow: {flexDirection:'row',gap:12,overflow:'hidden'},
  skeletonCard: {width:132,height:198,borderRadius:12,opacity:0.45},
  unifiedCard: {flex:1,minWidth:0,gap:6,position:'relative'},
  unifiedCardList: {flexDirection:'row',alignItems:'center',gap:14,paddingVertical:10},
  unifiedCardSelected: {borderWidth:1,borderRadius:12,padding:4},
  unifiedCoverWrap: {position:'relative'},
  unifiedCoverWrapList: {width:68},
  unifiedCardCopy: {gap:2,minWidth:0,paddingHorizontal:1},
  unifiedListMeta: {flexDirection:'row',alignItems:'center',gap:6,marginTop:2},
  workSourceDot: {width:5,height:5,borderRadius:3},
  workSource: {fontSize:11,fontWeight:'500',flexShrink:1},
  workRating: {fontSize:11,fontWeight:'600',marginLeft:'auto'},
  moreButton: {position:'absolute',right:4,top:4,width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',opacity:.9},
  moreButtonList: {right:4,top:4},
  offlineBadge: {position:'absolute',left:7,bottom:7,borderRadius:999,paddingHorizontal:7,paddingVertical:4},
  offlineBadgeText: {color:'#F8F7F2',fontSize:9,fontWeight:'900',letterSpacing:0.8},
  cardPressed: {opacity:0.88},
  actionSheet: {width:'100%',maxWidth:620,borderWidth:0,borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,gap:9,alignSelf:'center'},
  actionSheetFold: {width:420,maxWidth:420,height:'100%',borderTopLeftRadius:24,borderBottomLeftRadius:24,borderTopRightRadius:0,paddingHorizontal:22,paddingVertical:24,alignSelf:'flex-end'},
  sheetBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.46)',justifyContent:'flex-end',padding:12},
  sheetBackdropFold: {justifyContent:'center',alignItems:'flex-end',padding:0},
  sheetScroll: {flexGrow:1,justifyContent:'flex-end'},
  sheetHandle: {width:36,height:3,borderRadius:2,backgroundColor:'#9aa9a6',alignSelf:'center',marginBottom:6,opacity:.5},
  sheetHandleFold: {display:'none'},
  sheetHeader: {flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:4},
  sheetTitle: {fontFamily:'sans-serif-medium',fontSize:18,lineHeight:23,fontWeight:'500'},
  sheetCloseButton: {width:44,height:44,borderRadius:10,alignItems:'center',justifyContent:'center',marginTop:-5,marginRight:-5},
  sheetActionList: {marginTop:2},
  sheetAction: {minHeight:46,borderBottomWidth:StyleSheet.hairlineWidth,justifyContent:'center',paddingVertical:10},
  sheetActionText: {fontSize:13.5,lineHeight:19,fontWeight:'500'},

  manageRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:8},
  visibilityToggle: {width:40,height:24,borderRadius:12,padding:3,alignItems:'flex-start',justifyContent:'center'},
  visibilityThumb: {width:18,height:18,borderRadius:9,shadowColor:'#000',shadowOpacity:.14,shadowRadius:2,shadowOffset:{width:0,height:1},elevation:2},
  orderButton: {width:44,height:44,alignItems:'center',justifyContent:'center'},
  libraryTwoPane: {flex:1,flexDirection:'row',backgroundColor:'transparent'},
  libraryMain: {flex:1,paddingHorizontal:18,paddingTop:10,gap:14},
  libraryMainFold: {paddingHorizontal:24,paddingTop:10,gap:16},
  libraryMainWide: {paddingHorizontal:28,paddingTop:10,gap:18},
  libraryCatalogueHeader: {gap:2,paddingBottom:2},
  libraryKicker: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:2.0},
  libraryTitle: {fontFamily:'ArchivistEditorial',fontSize:32,lineHeight:39,fontWeight:'500',letterSpacing:-.32},
  libraryTitleCompact: {fontSize:32,lineHeight:40},
  libraryTitleFold: {fontSize:40,lineHeight:48},
  librarySearchRow: {flexDirection:'row',alignItems:'center',gap:6},
  librarySearchShell: {flex:1,minHeight:44,borderRadius:10,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:12},
  librarySearch: {flex:1,borderWidth:0,minHeight:44,paddingHorizontal:0,fontSize:14},
  libraryUtilityButton: {width:44,height:44,borderRadius:10,alignItems:'center',justifyContent:'center',position:'relative'},
  libraryFilterCount: {position:'absolute',right:3,top:2,minWidth:16,height:16,borderRadius:8,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
  libraryFilterCountText: {color:'#FFFFFF',fontSize:9,fontWeight:'700'},
  libraryFormatTabs: {gap:22,paddingRight:18,minHeight:42,paddingVertical:1,alignItems:'stretch'},
  libraryFormatTab: {minHeight:44,justifyContent:'center',position:'relative'},
  libraryFormatText: {fontSize:13,lineHeight:18},
  libraryFormatMarker: {position:'absolute',left:0,right:0,bottom:1,height:2,borderRadius:2},
  libraryToolbar: {flexDirection:'row',alignItems:'center',gap:8},
  quickFilters: {gap:4,paddingRight:8},
  quickFilter: {borderWidth:0,borderRadius:10,minHeight:44,paddingHorizontal:10,alignItems:'center',justifyContent:'center'},
  toolbarButton: {borderWidth:0,borderRadius:10,minHeight:44,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},
  librarySelectionBar: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,minHeight:52,flexDirection:'row',alignItems:'center',gap:8,paddingVertical:6},
  librarySelectionAction: {minHeight:44,paddingHorizontal:6,alignItems:'center',justifyContent:'center'},
  unifiedGrid: {paddingBottom:120,gap:16,paddingTop:2},
  unifiedGridRow: {gap:10},
  unifiedList: {paddingBottom:120,gap:4},
  selectionToolbar: {borderWidth:1,borderRadius:14,padding:10,flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'},
  selectionCount: {fontSize:13,fontWeight:'900'},
  reviewQueue: {gap:10,paddingBottom:10},
  filterLabel: {fontSize:10,fontWeight:'900',letterSpacing:1.4,marginTop:6},
  filterWrap: {flexDirection:'row',flexWrap:'wrap',gap:7},
  filterChip: {borderWidth:0,borderRadius:9,minHeight:44,paddingHorizontal:11,alignItems:'center',justifyContent:'center'},
  duplicatePanel: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,gap:10},
  duplicateGroup: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:12,gap:7},
  duplicateExact: {borderWidth:0,borderLeftWidth:2,paddingLeft:10,paddingVertical:6,gap:4},
  ruleGroup: {borderWidth:0,borderLeftWidth:2,paddingLeft:12,paddingVertical:8,gap:8},
  ruleRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:8,flexDirection:'row',flexWrap:'wrap',gap:6,alignItems:'center'},
  ruleToken: {borderWidth:0,borderRadius:8,minHeight:44,paddingHorizontal:9,alignItems:'center',justifyContent:'center'},
  ruleInput: {borderWidth:0,borderRadius:9,minHeight:44,paddingHorizontal:10,flexGrow:1,minWidth:92},
  ruleRemove: {width:44,height:44,alignItems:'center',justifyContent:'center'},
  statsScreen: {paddingHorizontal:18,paddingTop:10,paddingBottom:126,gap:18,width:'100%'},
  statsScreenFold: {paddingHorizontal:24,gap:20},
  statsScreenWide: {paddingHorizontal:28,gap:22},
  statsTopRow: {minHeight:64,flexDirection:'row',alignItems:'center',gap:12},
  statsBackButton: {width:44,height:44,borderRadius:22,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center'},
  statsTitle: {fontFamily:'ArchivistEditorial',fontSize:32,lineHeight:39,fontWeight:'500',letterSpacing:-.32},
  statsSubtitle: {fontSize:12,lineHeight:17,fontWeight:'500',marginTop:1},
  statsYearPill: {minWidth:84,height:40,borderRadius:20,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  statsYearText: {fontSize:12.5,lineHeight:18,fontWeight:'600',fontVariant:['tabular-nums']},
  statsPeriodIconButton: {width:40,height:40,borderRadius:20,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center'},
  statsMetricRow: {flexDirection:'row',flexWrap:'wrap',borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:8,columnGap:8,rowGap:0},
  statsMetricCard: {minHeight:72,paddingHorizontal:2,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:9},
  statsMetricCardPhone: {width:'48.5%',flexGrow:1},
  statsMetricCardWide: {width:'19%',flexGrow:1},
  statsMetricIcon: {width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',flexShrink:0},
  statsMetricValue: {fontFamily:'ArchivistEditorial',fontSize:19,lineHeight:23,fontWeight:'500',fontVariant:['tabular-nums']},
  statsMetricLabel: {fontSize:10,lineHeight:13.5,fontWeight:'500',marginTop:1},
  statsHeroCard: {position:'relative',paddingTop:6,paddingBottom:8,gap:18},
  statsRhythmTop: {flexDirection:'row',alignItems:'flex-start',gap:12},
  statsRhythmTopCompact: {flexDirection:'column',alignItems:'stretch'},
  statsCardHeader: {flex:1,flexDirection:'row',alignItems:'center',gap:10,minWidth:0,minHeight:44},
  statsIconOrb: {width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',flexShrink:0},
  statsCardTitle: {fontFamily:'ArchivistEditorial',fontSize:18,lineHeight:22,fontWeight:'500',letterSpacing:-.08},
  statsCardSubtitle: {fontSize:10.2,lineHeight:14,fontWeight:'500',marginTop:1},
  statsMiniSegment: {height:40,borderRadius:20,borderWidth:StyleSheet.hairlineWidth,flexDirection:'row',padding:2,alignItems:'center',alignSelf:'flex-start'},
  statsMiniSegmentItem: {height:34,minWidth:50,borderRadius:17,borderWidth:StyleSheet.hairlineWidth,borderColor:'transparent',paddingHorizontal:9,alignItems:'center',justifyContent:'center'},
  statsRhythmBody: {flexDirection:'column',alignItems:'stretch',gap:20},
  statsRhythmBodyWide: {flexDirection:'row',alignItems:'center',gap:32},
  statsRhythmDial: {position:'relative',alignItems:'center',justifyContent:'center',flexShrink:0,alignSelf:'center'},
  statsRhythmDialInner: {width:'57%',height:'57%',borderRadius:999,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center',padding:8},
  statsDialKicker: {fontSize:9,lineHeight:11.5,fontWeight:'500',textAlign:'center'},
  statsDialValue: {fontFamily:'ArchivistEditorial',fontSize:18,lineHeight:22,fontWeight:'500',marginVertical:2},
  statsDialMeta: {fontSize:8.5,lineHeight:11,textAlign:'center'},
  statsClockTop: {position:'absolute',top:2,fontFamily:'ArchivistEditorial',fontSize:10.5},
  statsClockRight: {position:'absolute',right:2,fontFamily:'ArchivistEditorial',fontSize:10.5},
  statsClockBottom: {position:'absolute',bottom:2,fontFamily:'ArchivistEditorial',fontSize:10.5},
  statsClockLeft: {position:'absolute',left:2,fontFamily:'ArchivistEditorial',fontSize:10.5},
  statsHeatmapWrap: {flex:1,minWidth:0,gap:3},
  statsHeatHeader: {flexDirection:'row',alignItems:'center',gap:4,marginBottom:3},
  statsHeatDay: {flex:1,textAlign:'center',fontSize:8.5,lineHeight:11,fontWeight:'600'},
  statsHeatRow: {flexDirection:'row',alignItems:'center',gap:4},
  statsHeatTime: {width:34,fontSize:7.5,lineHeight:9.5,fontWeight:'500'},
  statsHeatCell: {flex:1,height:12,borderRadius:4,borderWidth:StyleSheet.hairlineWidth},
  statsHeatLegend: {flexDirection:'row',alignItems:'center',gap:4,marginTop:7},
  statsHeatLegendDot: {width:8,height:8,borderRadius:4},
  statsHeatLegendText: {fontSize:8,lineHeight:11},
  statsRhythmBars: {gap:10,paddingVertical:4},
  statsRhythmBarRow: {flexDirection:'row',alignItems:'center',gap:10},
  statsRhythmBarLabel: {width:30,fontSize:10,lineHeight:14,fontWeight:'600'},
  statsRhythmTrack: {flex:1,height:9,borderRadius:5,overflow:'hidden'},
  statsRhythmFill: {height:'100%',borderRadius:5},
  statsRhythmBarValue: {width:42,textAlign:'right',fontSize:10,lineHeight:14,fontWeight:'600',fontVariant:['tabular-nums']},
  statsMonthGrid: {flexDirection:'row',flexWrap:'wrap',gap:10,paddingVertical:4},
  statsMonthCell: {width:'22%',minWidth:64,flexGrow:1,alignItems:'center',gap:4},
  statsMonthBarTrack: {width:18,height:72,borderRadius:9,overflow:'hidden',justifyContent:'flex-end'},
  statsMonthBarFill: {width:'100%',borderRadius:9},
  statsMonthLabel: {fontSize:9,lineHeight:12,fontWeight:'600'},
  statsMonthValue: {fontSize:8.5,lineHeight:11,fontWeight:'500',fontVariant:['tabular-nums']},
  statsSectionGroup: {gap:16,paddingTop:4},
  statsSectionHeading: {gap:3,paddingTop:2,paddingBottom:6},
  statsSectionTitle: {fontFamily:'ArchivistEditorial',fontSize:22,lineHeight:28,fontWeight:'500',letterSpacing:-.16},
  statsSectionCopy: {fontSize:10.5,lineHeight:15,fontWeight:'400'},
  statsPrimaryReadingStack: {gap:22,alignItems:'stretch'},
  statsDonutGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:22,rowGap:22,alignItems:'stretch'},
  statsSupportingGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:22,rowGap:22,alignItems:'stretch'},
  statsCardsGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:22,rowGap:22},
  statsDashboardCard: {width:'100%',borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:18,paddingHorizontal:0,gap:16,flexGrow:1,alignSelf:'stretch'},
  statsDashboardCardWide: {width:'48%',flexBasis:300},
  statsCardBody: {flexDirection:'row',alignItems:'center',gap:14,minHeight:118},
  statsCardSide: {flex:1,minWidth:0,gap:8},
  statsLegend: {flex:1,minWidth:0,gap:6},
  statsLegendRow: {flexDirection:'row',alignItems:'center',gap:5,minWidth:0},
  statsLegendDot: {width:7,height:7,borderRadius:4,flexShrink:0},
  statsLegendName: {flex:1,minWidth:0,fontSize:9,lineHeight:12},
  statsLegendCount: {fontSize:9,lineHeight:12,fontWeight:'600',fontVariant:['tabular-nums']},
  statsLegendPercent: {width:28,textAlign:'right',fontSize:8.7,lineHeight:12,fontVariant:['tabular-nums']},
  statsPercent: {fontFamily:'ArchivistEditorial',fontSize:20,lineHeight:24,fontWeight:'500'},
  statsProgressTrack: {height:9,borderRadius:5,overflow:'hidden'},
  statsProgressFill: {height:'100%',borderRadius:5},
  statsStatusLine: {flexDirection:'row',alignItems:'center',gap:6},
  statsSmallDot: {width:9,height:9,borderRadius:5},
  statsStatusText: {fontSize:9.8,lineHeight:13.5,fontWeight:'500'},
  statsPaceDelta: {fontFamily:'ArchivistEditorial',fontSize:17,lineHeight:21,fontWeight:'500'},
  statsStreakTop: {flexDirection:'row',alignItems:'stretch',gap:12},
  statsStreakValue: {fontFamily:'ArchivistEditorial',fontSize:18,lineHeight:23,fontWeight:'500'},
  statsVerticalRule: {width:StyleSheet.hairlineWidth},
  statsWeekDots: {flexDirection:'row',justifyContent:'space-between',gap:5,paddingTop:4},
  statsWeekDay: {flex:1,alignItems:'center',gap:5},
  statsWeekDot: {width:18,height:18,borderRadius:9,borderWidth:StyleSheet.hairlineWidth},
  statsWeekLabel: {fontSize:8.5,lineHeight:11,fontWeight:'600'},
  statsDetailGrid: {flexDirection:'row',flexWrap:'wrap',columnGap:14,rowGap:14,paddingTop:4,alignItems:'flex-start'},
  statsDetailMetric: {width:'47%',minWidth:118,flexGrow:1,paddingVertical:2},
  statsDetailValue: {fontFamily:'ArchivistEditorial',fontSize:20,lineHeight:24,fontWeight:'500'},
  statsDetailLabel: {fontSize:9.5,lineHeight:13,fontWeight:'600',marginTop:2},
  statsDetailMeta: {fontSize:8.5,lineHeight:12,marginTop:1},
  statsMinorHeading: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:.55,textTransform:'uppercase'},
  statsFinishSection: {gap:10,paddingTop:4},
  statsFinishMonths: {height:92,flexDirection:'row',alignItems:'flex-end',gap:5},
  statsFinishMonth: {flex:1,height:'100%',alignItems:'center',justifyContent:'flex-end',gap:3},
  statsFinishTrack: {width:'72%',maxWidth:16,height:56,borderRadius:8,overflow:'hidden',justifyContent:'flex-end'},
  statsFinishFill: {width:'100%',borderRadius:8},
  statsFinishMonthLabel: {fontSize:7.5,lineHeight:10,fontWeight:'600'},
  statsFinishMonthValue: {fontSize:7.5,lineHeight:10,fontVariant:['tabular-nums']},
  statsSplitBlock: {gap:9,paddingTop:2},
  statsCompletionRows: {gap:7},
  statsCompletionRow: {flexDirection:'row',alignItems:'center',gap:8},
  statsCompletionCopy: {width:82,flexDirection:'row',alignItems:'center',gap:5},
  statsCompletionLabel: {flex:1,fontSize:8.8,lineHeight:12},
  statsCompletionValue: {fontSize:8.5,lineHeight:12,fontWeight:'600',fontVariant:['tabular-nums']},
  statsCompletionTrack: {flex:1,height:7,borderRadius:4,overflow:'hidden'},
  statsCompletionFill: {height:'100%',borderRadius:4},
  statsCompletionPercent: {width:30,textAlign:'right',fontSize:8.5,lineHeight:12,fontVariant:['tabular-nums']},
  statsConsistencyRow: {flexDirection:'row',alignItems:'center',gap:14,paddingTop:4},
  statsConsistencyValue: {fontFamily:'ArchivistEditorial',fontSize:22,lineHeight:27,fontWeight:'500'},
  statsConsistencyCopy: {flex:1,fontSize:9,lineHeight:13},
  insightEditorialHero: {paddingVertical:4,gap:6,maxWidth:760},
  insightEditorialKicker: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.45},
  insightEditorialTitle: {fontFamily:'ArchivistEditorial',fontSize:20,lineHeight:28,fontWeight:'400',letterSpacing:-.1},
  insightStatStrip: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',flexWrap:'wrap',paddingVertical:16,rowGap:16},
  insightStat: {width:'50%',minWidth:130,gap:2},
  insightStatFold: {width:'33.333%',minWidth:110},
  insightStatWide: {width:'16.666%',minWidth:96},
  insightStatValue: {fontFamily:'sans-serif-medium',fontSize:24,lineHeight:29,fontWeight:'500'},
  insightStatLabel: {fontSize:12,lineHeight:17,fontWeight:'500'},
  insightRhythmSection: {gap:12},
  insightRhythmChart: {height:96,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:8,paddingHorizontal:2},
  insightRhythmDay: {flex:1,height:'100%',alignItems:'center',justifyContent:'flex-end',gap:7},
  insightRhythmBarArea: {height:66,width:'100%',alignItems:'center',justifyContent:'flex-end'},
  insightRhythmBar: {width:8,maxWidth:12,borderRadius:4},
  insightRhythmLabel: {fontSize:10,lineHeight:13,fontWeight:'600'},
  insightGoalGrid: {gap:0},
  insightGoalCard: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,gap:10},
  insightGoalEdit: {flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:8},
  insightGoalInput: {width:58,borderWidth:0,borderBottomWidth:StyleSheet.hairlineWidth,borderRadius:0,minHeight:44,paddingHorizontal:4,textAlign:'center',fontSize:13,fontWeight:'600',fontVariant:['tabular-nums']},
  insightActivityRow: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,flexDirection:'row',gap:10,alignItems:'center'},
  activityMarker: {width:7,height:7,borderRadius:4},
  annotationHubCard: {borderWidth:0,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,gap:7},
  insightAchievementStrip: {flexDirection:'row',gap:18,paddingRight:18},
  insightAchievementEditorial: {width:108,alignItems:'center',gap:6},
  insightAchievementBadge: {width:56,height:56,borderRadius:28,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  insightAchievementMonogram: {fontFamily:'sans-serif-medium',fontSize:20,fontWeight:'500'},
  insightAchievement: {borderWidth:0,padding:11,minWidth:140,flexGrow:1},

});
