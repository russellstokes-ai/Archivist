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
import {setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';
import {WebView} from 'react-native-webview';
import {request, validateServer as checkServer, readerNavigationAllowed, setupStatus, RequestError, Session} from './connection';
import {Playback, PlaybackState, Chapter} from './playback';
import {reorder} from './queue';
import {LocalBook, LocalFolder, LocalMetadataOverride, LocalScanProgress, LocalSortHistory, LocalSortPreview, applyLocalSortCopies, pickLocalFolder, previewLocalSort, removeLocalSortCopies, scanLocalFolders} from './localLibrary';
import {LocalReaderDocument, buildLocalReaderDocument, readerHostBridgeSource} from './localReader';
import {groupLocalWorks, LocalWork} from './localWorks';
import {Achievement, achievementsFor, clampProgress, VerifiedProfileStats} from './profileStats';
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
type Tab = 'shelf' | 'library' | 'player' | 'reader' | 'atlas' | 'insights' | 'profile' | 'settings';
type ShelfSectionId = 'continue' | 'favourites' | 'smart' | 'collections' | 'series' | 'library';
type ShelfSectionPref = {id:ShelfSectionId;title:string;visible:boolean};
type ThemeMode = 'system' | 'light' | 'dark';
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
const defaultShelfSections:ShelfSectionPref[] = [
  {id:'continue',title:'Continue',visible:true},
  {id:'favourites',title:'Favourites',visible:true},
  {id:'smart',title:'Smart Shelves',visible:true},
  {id:'collections',title:'Collections',visible:true},
  {id:'series',title:'Series',visible:true},
  {id:'library',title:'From your library',visible:true},
];

function validateServer(raw: string) {
  return checkServer(raw, __DEV__);
}

function palette(mode: ThemeMode, system: string | null | undefined): Palette {
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return {
    ink: dark ? '#F5F5F5' : '#111111',
    paper: dark ? '#000000' : '#FFFFFF',
    muted: dark ? '#A0A0A0' : '#6B6B6B',
    line: dark ? '#252525' : '#E8E8E8',
    card: dark ? '#111111' : '#F7F7F7',
    raised: dark ? '#181818' : '#FFFFFF',
    sage: '#47736F',
    gold: '#B99A68',
    ivory: '#FFFFFF',
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
        (disabled || pressed) && {opacity: disabled ? 0.38 : 0.78},
      ]}
      onPress={onPress}>
      <Text style={[styles.buttonText, tone === 'quiet' && styles.buttonQuietText, tone === 'danger' && styles.buttonDangerText]}>{label}</Text>
    </Pressable>
  );
}

type UiIconName = 'play'|'pause'|'more'|'close'|'back'|'shelf'|'library'|'atlas'|'insights'|'settings'|'filter'|'grid'|'list'|'skipBack'|'skipForward'|'bookmark'|'moon'|'queue'|'search'|'minus'|'plus'|'fit'|'chevronUp'|'chevronDown'|'zoomIn'|'zoomOut';

function UiIcon({name,color,size=18}:{name:UiIconName;color:string;size?:number}) {
  const stroke=Math.max(2,Math.round(size/8));
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
  const up=name==='chevronUp';
  return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',width:size*.58,height:stroke,borderRadius:stroke,backgroundColor:color,left:size*.08,top:size*.45,transform:[{rotate:up?'-42deg':'42deg'}]}}/>
    <View style={{position:'absolute',width:size*.58,height:stroke,borderRadius:stroke,backgroundColor:color,right:size*.08,top:size*.45,transform:[{rotate:up?'42deg':'-42deg'}]}}/>
  </View>;
}

function CelebrationOverlay({active,title='Your library is alive',copy='Archivist found your first books.'}: {active: boolean;title?: string;copy?: string}) {
  const burst = useRef(new Animated.Value(0)).current;
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
  }, [active, burst]);
  if (!active) return null;
  const particles = ['✦','•','✧','•','✦','✧','•','✦','•','✧','✦','•'];
  return (
    <View pointerEvents="none" style={styles.celebration}>
      {particles.map((mark, index) => {
        const angle = (index / particles.length) * Math.PI * 2;
        const distance = 86 + (index % 3) * 22;
        return (
          <Animated.Text
            key={index}
            style={[
              styles.celebrationParticle,
              {
                opacity: burst,
                transform: [
                  {translateX: burst.interpolate({inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance]})},
                  {translateY: burst.interpolate({inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance]})},
                  {scale: burst.interpolate({inputRange: [0, 0.25, 1], outputRange: [0.4, 1.15, 0.85]})},
                ],
              },
            ]}>
            {mark}
          </Animated.Text>
        );
      })}
      <Animated.View style={[styles.celebrationBadge, {opacity: burst, transform: [{scale: burst.interpolate({inputRange:[0,0.3,1], outputRange:[0.75,1.04,1]})}]}]}>
        <Text style={styles.celebrationTitle}>{title}</Text>
        <Text style={styles.celebrationCopy}>{copy}</Text>
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
  const p = useMemo(() => palette(theme, systemScheme), [theme, systemScheme]);
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
  const [atlasFocus,setAtlasFocus]=useState<{kind:AtlasKind;value:string}|null>(null);
  const [atlasListMode,setAtlasListMode]=useState(false);
  const [atlasSearch,setAtlasSearch]=useState('');
  const [atlasNodeId,setAtlasNodeId]=useState('');
  const [atlasTransform,setAtlasTransform]=useState({x:0,y:0,scale:.62});
  const atlasGesture=useRef<{mode:'pan'|'pinch';startX:number;startY:number;baseX:number;baseY:number;baseScale:number;distance:number;focusX:number;focusY:number}|null>(null);
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
  const [celebrationEligible, setCelebrationEligible] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [achievementCelebration,setAchievementCelebration]=useState<Achievement|null>(null);
  const [ratingPrompt,setRatingPrompt]=useState<RatingPrompt|null>(null);
  const achievementBaseline=useRef<{key:string;ids:Set<string>}|null>(null);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<LibrarySource>('all');
  const [librarySort,setLibrarySort]=useState<'title'|'author'|'rating'>('title');
  const [libraryView,setLibraryView]=useState<'grid'|'list'>('grid');
  const [workMenu,setWorkMenu]=useState<UnifiedWork|null>(null);
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
  const [shelfManageOpen,setShelfManageOpen]=useState(false);
  const [shelfSections,setShelfSections]=useState<ShelfSectionPref[]>(defaultShelfSections);
  const [renameTarget,setRenameTarget]=useState<{kind:'shelf'|'collection';id:string}|null>(null);
  const shelfScrollRef=useRef<ScrollView|null>(null);
  const libraryListRef=useRef<any>(null);
  const shelfScrollOffset=useRef(0);
  const libraryScrollOffset=useRef(0);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all'|'available'|'unavailable'>('all');
  const [formatFilter, setFormatFilter] = useState('');
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
  const [readerPage,setReaderPage]=useState(0);
  const [readerCount,setReaderCount]=useState(0);
  const [readerSelection,setReaderSelection]=useState('');
  const [readerSearch,setReaderSearch]=useState('');
  const [readerSearchCount,setReaderSearchCount]=useState<number|null>(null);
  const [readerRequestedPage,setReaderRequestedPage]=useState<number|null>(null);
  const [readerNote,setReaderNote]=useState('');
  const [playing, setPlaying] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shelf');
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
  const [reduceMotion,setReduceMotion]=useState(false);
  const [appActive,setAppActive]=useState(AppState.currentState==='active');
  const bookOpenAnim=useRef(new Animated.Value(0)).current;
  const pageTurnAnim=useRef(new Animated.Value(0)).current;
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
  const [workPicker,setWorkPicker]=useState<WorkPicker|null>(null);
  const [editTitle,setEditTitle]=useState('');
  const [editAuthor,setEditAuthor]=useState('');
  const [editSeries,setEditSeries]=useState('');
  const [editGenre,setEditGenre]=useState('');
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
  const loadCancel = useRef<(() => void) | null>(null);
  const wideLayout = width >= 700;
  const compactLayout = width < 430;
  const shelfColumns = width >= 1000 ? 6 : width >= 760 ? 4 : width >= 520 ? 3 : 2;
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
  const playbackVisible = activeTab==='player' && appActive && !!playing;

  useEffect(()=>{
    const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduceMotion);
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
    Animated.timing(bookOpenAnim,{toValue:motion==='closed'?0:1,duration:reduceMotion?0:520,useNativeDriver:true}).start();

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
      return {...identity,title:work.title,author:work.author,series:work.series,genre:work.genre,format:work.format,space:work.space,available:work.available,files:work.files,editions:1,readingState:work.readingState,rating:work.rating,favourite:work.favourite,coverUri:work.coverUri,localWork:work};
    });
    const downloaded:UnifiedWork[] = downloadedPersonalWorks.flatMap(work => {
      if(!work.originServer || !work.originWorkId)return [];
      const identity=sourceIdentity({source:'downloaded',server:work.originServer,serverWorkId:work.originWorkId,space:work.space,title:work.title});
      return [{...identity,title:work.title,author:work.author,series:work.series,genre:work.genre,format:work.format,space:work.space,available:true,files:work.files,editions:1,readingState:work.readingState,rating:work.rating,favourite:work.favourite,coverUri:work.coverUri,localWork:work,server:work.originServer,serverWorkId:work.originWorkId}];
    });
    const remote:UnifiedWork[] = session ? serverWorks.map(work => {
      const identity=sourceIdentity({source:'server',server:session.server,serverWorkId:work.id,space:work.space,title:work.title});
      const pref=serverPreferences[work.id] || {rating:work.rating||0,favourite:!!work.favourite,state:work.state||'not-started' as ReadingState};
      return {...identity,title:work.title,author:work.author,series:work.series,genre:work.genre||'',format:work.format,space:work.space,available:work.available,files:work.files,editions:work.editions,readingState:pref.state||'not-started',rating:pref.rating||0,favourite:!!pref.favourite,serverWork:work,server:session.server,serverWorkId:work.id};
    }) : [];
    return [...phone,...downloaded,...remote];
  },[downloadedPersonalWorks,phonePersonalWorks,serverPreferences,serverWorks,session]);

  const sourceCounts = useMemo(() => ({
    all: dedupeForAll(sourceWorks).length,
    local: sourceWorks.filter(item=>item.source==='local').length,
    server: sourceWorks.filter(item=>item.source==='server').length,
    downloaded: sourceWorks.filter(item=>item.source==='downloaded').length,
  }),[sourceWorks]);

  const availableSpaces = useMemo(() => spacesForSource(sourceWorks, sourceFilter), [sourceFilter,sourceWorks]);
  useEffect(()=>{const next=normalizeSpaceSelection(sourceWorks,sourceFilter,space);if(next!==space)setSpace(next);},[sourceFilter,sourceWorks,space]);


  const atlasRelationshipWorks=useMemo<UnifiedWork[]>(()=>sourceFilter==='all'?dedupeForAll(sourceWorks):sourceWorks.filter((item:UnifiedWork)=>matchesSource(item.source,sourceFilter)),[sourceFilter,sourceWorks]);
  const unifiedAtlasRelationship=useMemo(()=>atlasFocus?buildAtlasRelationship<UnifiedWork>(atlasRelationshipWorks,atlasFocus.kind,atlasFocus.value):null,[atlasFocus,atlasRelationshipWorks]);
  const atlasUniverseWorks=useMemo(()=>atlasRelationshipWorks.filter(work=>!space||work.space===space),[atlasRelationshipWorks,space]);
  const atlasUniverse=useMemo(()=>buildAtlasUniverse(atlasUniverseWorks,collections,readerAnnotations),[atlasUniverseWorks,collections,readerAnnotations]);
  const atlasSelectedNode=useMemo(()=>atlasUniverse.nodes.find(node=>node.id===atlasNodeId)||null,[atlasNodeId,atlasUniverse]);

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
  const localProfileStats=useMemo(()=>statsFromUnified(sourceWorks.filter(work=>work.source==='local'),'On this device'),[sourceWorks]);
  const downloadedProfileStats=useMemo(()=>statsFromUnified(sourceWorks.filter(work=>work.source==='downloaded'),'Downloaded'),[sourceWorks]);
  const combinedProfileStats=useMemo(()=>statsFromUnified(allUnifiedWorks,'All libraries'),[allUnifiedWorks]);
  const profileStats = sourceFilter==='server' && session ? serverProfileStats
    : sourceFilter==='local' ? localProfileStats
    : sourceFilter==='downloaded' ? downloadedProfileStats
    : combinedProfileStats;

  const profileAchievements = useMemo(() => profileStats ? achievementsFor(profileStats) : [], [profileStats]);
  const insightWorks=useMemo(()=>sourceFilter==='all'?allUnifiedWorks:sourceWorks.filter(work=>matchesSource(work.source,sourceFilter)),[allUnifiedWorks,sourceFilter,sourceWorks]);
  const insightSummary=useMemo(()=>buildInsights(insightWorks,readerAnnotations,sourceFilter==='local'||sourceFilter==='downloaded'?[]:serverActivity,insightGoal),[insightGoal,insightWorks,readerAnnotations,serverActivity,sourceFilter]);

  useEffect(()=>{
    if(!profileStats)return;
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
    const timer=setTimeout(()=>setAchievementCelebration(null),1900);
    return()=>clearTimeout(timer);
  },[profileAchievements,profileStats,session,sourceFilter]);

  const availabilityMatches = (available: boolean) =>
    availabilityFilter === 'all' || (availabilityFilter === 'available' ? available : !available);

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
      if (formatFilter && book.format !== formatFilter) return false;
      if (authorFilter && book.author !== authorFilter) return false;
      if (seriesFilter && book.series !== seriesFilter) return false;
      if (genreFilter && book.genre !== genreFilter) return false;
      if (unknownAuthorOnly && !!book.author) return false;
      if (!availabilityMatches(book.available)) return false;
      if (!q) return true;
      return [book.title, book.author, book.series, book.genre || '', book.format, book.space].some(value => value.toLowerCase().includes(q));
    });
  }, [authorFilter, availabilityFilter, formatFilter, genreFilter, query, reviewAssetPool, reviewOnly, seriesFilter, space, unknownAuthorOnly]);

  const visibleUnifiedWorks = useMemo(() => {
    const q=query.trim().toLowerCase();
    const base=sourceFilter==='all' ? dedupeForAll(sourceWorks) : sourceWorks.filter(item=>matchesSource(item.source,sourceFilter));
    const activeCollection=collectionFilter?collections.find(item=>item.id===collectionFilter):undefined;
    const collectionKeys=activeCollection?new Set(activeCollection.canonicalKeys):null;
    return base.filter(work=>{
      if(collectionKeys && !collectionKeys.has(work.canonicalKey))return false;
      if(space && work.space!==space)return false;
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
  },[authorFilter,availabilityFilter,collectionFilter,collections,favouriteOnly,formatFilter,genreFilter,query,ratingFilter,readingFilter,seriesFilter,sourceFilter,sourceWorks,space,unknownAuthorOnly]);


  const sortedUnifiedWorks = useMemo(() => [...visibleUnifiedWorks].sort((a,b)=>{
    if(librarySort==='rating')return b.rating-a.rating || a.title.localeCompare(b.title);
    if(librarySort==='author')return (a.author||'').localeCompare(b.author||'') || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  }),[librarySort,visibleUnifiedWorks]);

  const smartShelfRows=useMemo(()=>smartShelves.map(shelf=>({shelf,works:applySmartShelf(allUnifiedWorks,shelf).slice(0,12)})),[allUnifiedWorks,smartShelves]);
  const collectionRows=useMemo(()=>collections.map(collection=>({collection,works:collectionWorks(allUnifiedWorks,collection).slice(0,12)})),[allUnifiedWorks,collections]);
  const selectedWorks=useMemo(()=>{const wanted=new Set(selectedWorkKeys);return allUnifiedWorks.filter(work=>wanted.has(work.canonicalKey));},[allUnifiedWorks,selectedWorkKeys]);

  async function persistSmartShelves(next:SmartShelfDefinition[]){setSmartShelves(next);await setPersistedJSON(smartShelvesKey,next);}
  async function persistCollections(next:LibraryCollection[]){setCollections(next);await setPersistedJSON(collectionsKey,next);}
  function clearLibraryFilters(){setQuery('');setSpace('');setFormatFilter('');setAuthorFilter('');setSeriesFilter('');setGenreFilter('');setReadingFilter('');setRatingFilter(0);setFavouriteOnly(false);setUnknownAuthorOnly(false);setAvailabilityFilter('all');setCollectionFilter('');}
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
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(()=>undefined);
    SecureStore.getItemAsync(onboardingDoneKey).then(value => {
      setOnboardingDone(value === '1');
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
        reviewOnly ? request(session, serverAssetsPath(0,200)) : Promise.resolve([]),
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
          setServerBooksHasMore(reviewOnly && (assets as Book[]).length === 200);
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
  }, [authorFilter, availabilityFilter, favouriteOnly, formatFilter, genreFilter, ratingFilter, readingFilter, reviewOnly, session, query, seriesFilter, space, unknownAuthorOnly]);

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

  async function rescanLocalFolders() {
    if (!localFolders.length) return;
    setError('');
    setLocalScanning(true);
    try {
      setScanProgress({phase: 'discovering', currentFolder: localFolders[0]?.name || 'Library', entriesVisited: 0, found: 0, review: 0});
      const result = await scanLocalFolders(localFolders, setScanProgress, localMetadataOverrides);
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
    setActiveTab('player');

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
        setActiveTab('player');
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
      setActiveTab('player');
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
    setReaderPage(book.uri ? (localReadingProgress[book.uri]||0) : 0);setReaderCount(0);setReaderSelection('');setReaderSearch('');setReaderSearchCount(null);setReaderRequestedPage(null);setReaderToolsOpen(false);
    if (book.format === 'Audio') playBook(book);
    else if (book.source!=='server') {
      if (!book.uri) return;
      setReading(book);
      setActiveTab('reader');
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
      setReaderLoading(true);
      setActiveTab('reader');
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
    title,format,coverShape,coverUri,serverPath,large=false,
  }: {
    title:string;format:string;coverShape?:'portrait'|'square';coverUri?:string;serverPath?:string;large?:boolean;
  }) {
    const square = coverShape ? coverShape === 'square' : format === 'Audio';
    const imageSource = session && serverPath
      ? {uri: session.server + serverPath, headers: {Authorization: 'Bearer ' + session.token}}
      : coverUri ? {uri: coverUri} : null;
    const [coverFailed, setCoverFailed] = useState(false);
    useEffect(() => setCoverFailed(false), [imageSource?.uri]);
    return (
      <View style={[styles.cover, square && styles.coverSquare, large && styles.coverLarge, square && large && styles.coverLargeSquare, {backgroundColor:p.card}]}>
        {imageSource && !coverFailed ? (
          <Image accessible={false} source={imageSource} resizeMode="cover" style={styles.coverImage} onError={() => setCoverFailed(true)} />
        ) : (
          <View style={styles.coverFallback}>
            <Text style={[styles.coverFallbackMark,{color:p.muted}]}>A</Text>
            <View style={styles.coverFallbackCopy}>
              <Text numberOfLines={1} style={[styles.coverFormat,{color:p.sage}]}>{format.toUpperCase()}</Text>
              <Text maxFontSizeMultiplier={1.1} numberOfLines={large ? 3 : 2} style={[styles.coverTitle,{color:p.ink},large&&styles.coverTitleLarge]}>{title}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  function Cover({book, large = false}: {book: Book; large?: boolean}) {
    return <Artwork
      title={book.title}
      format={book.format}
      coverShape={book.coverShape}
      coverUri={book.coverUri}
      serverPath={session && book.source==='server' ? '/api/assets/' + book.id + '/cover' : undefined}
      large={large}
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
      <View style={{gap: 12}}>
          <Text style={[styles.sectionTitle, {color: p.ink}]}>Add Server</Text>
          <Text style={[styles.loginCopy, {color: p.muted, textAlign: 'left'}]}>Connect a private Archivist server when you want a shared household library. Your phone library keeps working locally.</Text>
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
            onPress={() => {setSpace(name);setReviewOnly(false);setAvailabilityFilter('all');setFormatFilter('');setAuthorFilter('');setSeriesFilter('');setGenreFilter('');setUnknownAuthorOnly(false);}}
            style={({pressed})=>[
              styles.librarySpaceTab,
              vertical&&styles.librarySpaceTabVertical,
              pressed&&{opacity:.62},
            ]}>
            <Text numberOfLines={1} style={[styles.librarySpaceText,{color:selected?p.ink:p.muted,fontWeight:selected?'700':'500'}]}>
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

  function OnboardingGuide() {
    if (session || onboardingDone) return null;
    const reviewCount = localBooks.filter(book => book.needsReview).length;
    const hasFolder = localFolders.length > 0;
    const hasBooks = localBooks.length > 0;
    return (
      <View style={[styles.onboardingCard, {backgroundColor: p.card, borderColor: p.line}]}>
        <Text style={[styles.onboardingEyebrow,{color:p.sage}]}>START HERE</Text>
        <Text style={[styles.sectionTitle, {color: p.ink, marginTop: 0}]}>Build your library in three simple steps</Text>
        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber, {backgroundColor: hasFolder ? p.sage : p.ink}]}>1</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle, {color:p.ink}]}>Choose where your books live</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{hasFolder ? `${localFolders.length} folder${localFolders.length === 1 ? '' : 's'} added` : 'Pick a Books, Comics or Audiobooks folder. You can add more later.'}</Text>
          </View>
        </View>
        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber, {backgroundColor: hasBooks ? p.sage : hasFolder ? p.ink : p.line}]}>2</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Archivist finds and identifies everything</Text>
            <Text style={[styles.meta,{color:p.muted}]}>
              {localScanning && scanProgress ? `Scanning ${scanProgress.currentFolder}: ${scanProgress.found} found, ${scanProgress.review} need review` : hasBooks ? `${localBooks.length} items found` : 'Scanning starts immediately after you choose a folder.'}
            </Text>
          </View>
        </View>
        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber, {backgroundColor: hasBooks && reviewCount === 0 ? p.sage : hasBooks ? p.ink : p.line}]}>3</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Review only what needs attention</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{!hasBooks ? 'Archivist keeps confident matches out of your way.' : reviewCount ? `${reviewCount} item${reviewCount === 1 ? '' : 's'} need a quick check.` : 'Everything found so far looks good.'}</Text>
          </View>
        </View>
        {!hasFolder ? <Button label={localScanning ? 'Scanning…' : 'Choose a folder'} disabled={localScanning} onPress={() => void addLocalFolder()} /> : null}
        {hasFolder && !hasBooks ? <Button label={localScanning ? 'Scanning…' : 'Scan again'} disabled={localScanning} onPress={() => void rescanLocalFolders()} /> : null}
        {hasBooks && reviewCount > 0 ? <Button label={`Review ${reviewCount} uncertain item${reviewCount === 1 ? '' : 's'}`} tone="quiet" onPress={() => {setReviewOnly(true); setQuery('');}} /> : null}
        {hasBooks ? <Button label="Enter my library" onPress={() => void finishOnboarding()} /> : null}
      </View>
    );
  }

  function beginEdit(item: Book) {
    setEditing(item);
    setEditTitle(item.title);
    setEditAuthor(item.author || '');
    setEditSeries(item.series || '');
    setEditGenre(item.genre || '');
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
    return <View style={{gap:5,marginTop:7}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <View accessibilityLabel={'Personal rating '+ratingLabel(rating)} style={{flexDirection:'row'}}>
          {[1,2,3,4,5].map(star=>{
            const full=rating>=star*2,half=rating===star*2-1;
            return <Pressable
              key={star}
              accessibilityRole="button"
              accessibilityLabel={'Rate '+(star-0.5)+' or '+star+' stars'}
              onPress={event=>onRating((star-1)*2+(event.nativeEvent.locationX<13?1:2))}
              style={{width:26,height:30,alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:20,color:full||half?p.sage:p.muted,opacity:half?0.55:1}}>★</Text>
            </Pressable>;
          })}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={favourite?'Remove favourite':'Add favourite'} onPress={onFavourite} style={{padding:5}}>
          <Text style={{fontSize:22,color:favourite?p.sage:p.muted}}>{favourite?'♥':'♡'}</Text>
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
      {id:'server',label:'Server',count:sourceCounts.server,show:!!session},
      {id:'downloaded',label:'Downloaded',count:sourceCounts.downloaded,show:sourceCounts.downloaded>0},
    ];
    const body=options.filter(item=>item.show).map(item=>{
      const selected=sourceFilter===item.id;
      return <Pressable
        key={item.id}
        accessibilityRole="button"
        accessibilityState={{selected}}
        onPress={()=>{setSourceFilter(item.id);setCollectionFilter('')}}
        style={({pressed})=>[
          styles.sourceTab,
          vertical&&styles.sourceTabVertical,
          pressed&&{opacity:.62},
        ]}>
        <View style={{flexDirection:'row',alignItems:'baseline',gap:7,minWidth:0}}>
          <Text numberOfLines={1} style={[styles.sourceTabText,{color:selected?p.ink:p.muted,fontWeight:selected?'700':'500'}]}>{item.label}</Text>
          <Text style={[styles.sourceTabCount,{color:selected?p.sage:p.muted}]}>{item.count}</Text>
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
      : <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.sourceSwitcher}>{body}</ScrollView>;
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
          style={[styles.moreButton,{backgroundColor:p.paper},list&&styles.moreButtonList]}>
          <UiIcon name="more" color={p.muted} size={18}/>
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

  function WorkActionSheet(){
    if(!workMenu)return null;
    const work=workMenu;
    const local=work.localWork;
    const remote=work.serverWork;
    const personal=local ? (localPreferences[local.key]||{rating:local.rating||0,favourite:local.favourite||false}) : remote ? (serverPreferences[remote.id]||{rating:work.rating,favourite:work.favourite,state:work.readingState}) : {rating:0,favourite:false};
    const downloaded=remote?downloadedServerWork(remote):undefined;
    const setFav=()=>{
      if(local)void saveLocalPreference(local,{...personal,favourite:!personal.favourite});
      else if(remote)void saveServerPreference(remote,{...personal,favourite:!personal.favourite});
      setWorkMenu(null);
    };
    return <Modal transparent animationType="slide" visible onRequestClose={()=>setWorkMenu(null)}>
      <Pressable style={styles.sheetBackdrop} onPress={()=>setWorkMenu(null)}>
        <Pressable accessibilityViewIsModal accessibilityLabel={'Actions for '+work.title} style={[styles.actionSheet,{backgroundColor:p.card,borderColor:p.line}]} onPress={()=>undefined}>
          <View style={styles.sheetHandle}/>
          <Text numberOfLines={2} style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{work.title}</Text>
          <Text style={[styles.meta,{color:p.muted}]}>{work.author||'Unknown author'} · {sourceLabel(work.source)}</Text>
          <Button label={work.format==='Audio'?'Listen':'Open'} onPress={()=>openUnifiedWork(work)}/>
          <Button label={personal.favourite?'Remove favourite':'Add favourite'} tone="quiet" onPress={setFav}/>
          {work.format==='Audio'&&local?<Button label="Add to queue" tone="quiet" onPress={()=>{setWorkMenu(null);void addLocalWorkQueue(local);}}/>:null}
          {work.format==='Audio'&&remote?<Button label="Add to queue" tone="quiet" onPress={()=>{setWorkMenu(null);void queueServerWork(remote);}}/>:null}
          {remote && !downloaded?<Button label="Download for offline" tone="quiet" disabled={offlineBusyId!==null} onPress={()=>{setWorkMenu(null);void downloadServerWork(remote);}}/>:null}
          {downloaded?<Button label={'Remove download · '+formatBytes(downloaded.bytes)} tone="quiet" disabled={offlineBusyId!==null} onPress={()=>{setWorkMenu(null);void removeServerDownload(downloaded);}}/>:null}
          <Button label="Add to collection" tone="quiet" onPress={()=>{setCollectionTarget(work);setOrganisationModal('add-to-collection');setWorkMenu(null);}}/>
          {local?.tracks[0] ? <Button label="Edit details" tone="quiet" onPress={()=>{beginEdit({...local.tracks[0],source:work.source,originServer:local.originServer,serverWorkId:local.originWorkId});setWorkMenu(null);}}/> : null}
          <Button label="Close" tone="quiet" onPress={()=>setWorkMenu(null)}/>
        </Pressable>
      </Pressable>
    </Modal>;
  }

  function MetadataEditorPanel(){
    if(!editing)return null;
    const save=()=>{
      const title=editTitle.trim(),author=editAuthor.trim(),seriesName=editSeries.trim(),genre=editGenre.trim();
      if(!title)return;
      setBusy(true);setError('');
      if(editing.source==='server'){
        if(!session || (editing.originServer&&editing.originServer!==session.server) || !owner){setBusy(false);setError('Reconnect to the correct server as an admin to edit this file.');return;}
        request(session,'/api/assets/'+editing.id+'/metadata','PATCH',{title,author,series:seriesName,genre})
          .then(()=>{setServerBooks(old=>old.map(b=>b.id===editing.id?{...b,title,author,series:seriesName,genre,needsReview:false,reviewReason:'',metadataSource:'manual',identificationConfidence:'high'}:b));setEditing(null);})
          .catch(e=>setError(e.message)).finally(()=>setBusy(false));
      }else if(editing.uri){
        const next={...localMetadataOverrides,[editing.uri]:{title,author,series:seriesName,genre}};
        setLocalMetadataOverrides(next);
        setPersistedJSON(localMetadataOverridesKey,next)
          .then(()=>{
            setLocalBooks(old=>{
              const updated=old.map(b=>b.uri===editing.uri?{...b,title,author,series:seriesName,genre,needsReview:false,reviewReason:'',metadataSource:'manual' as const,identificationConfidence:'high' as const}:b);
              void setPersistedJSON(localCatalogKey,updated);
              return updated;
            });
            setEditing(null);
          })
          .catch(e=>setError(e.message)).finally(()=>setBusy(false));
      }else setBusy(false);
    };
    return <Modal transparent animationType="slide" visible onRequestClose={()=>!busy&&setEditing(null)}>
      <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS==='ios'?'padding':undefined}>
        <View style={styles.modalBackdrop}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
          <View accessibilityViewIsModal accessibilityLabel={'Edit details for '+editing.title} style={[styles.modalCard,{backgroundColor:p.card,borderColor:p.line}]}>
            <Text style={[styles.playerEyebrow,{color:p.sage}]}>METADATA REVIEW</Text>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Review details</Text>
            {editing.reviewReason?<Text style={[styles.meta,{color:p.muted}]}>{editing.reviewReason}</Text>:null}
            <TextInput accessibilityLabel="Corrected title" value={editTitle} onChangeText={setEditTitle} placeholder="Title" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Author" value={editAuthor} onChangeText={setEditAuthor} placeholder="Author" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Series" value={editSeries} onChangeText={setEditSeries} placeholder="Series" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Genre" value={editGenre} onChangeText={setEditGenre} placeholder="Genre" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <Button label="Save details" disabled={busy||!editTitle.trim()} onPress={save}/>
            <Button label="Cancel" tone="quiet" disabled={busy} onPress={()=>setEditing(null)}/>
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
      <View style={styles.sheetBackdrop}><ScrollView contentContainerStyle={styles.sheetScroll} keyboardShouldPersistTaps="handled">
        <View accessibilityViewIsModal style={[styles.actionSheet,{backgroundColor:p.card,borderColor:p.line}]}>
          <View style={styles.sheetHandle}/>
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
    return <Modal transparent animationType="slide" visible onRequestClose={()=>setShelfManageOpen(false)}><View style={styles.sheetBackdrop}>
      <View accessibilityViewIsModal accessibilityLabel="Customise Shelf" style={[styles.actionSheet,{backgroundColor:p.card,borderColor:p.line}]}>
        <View style={styles.sheetHandle}/><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Customise Shelf</Text>
        <Text style={[styles.meta,{color:p.muted}]}>Choose what appears and arrange it around the way you use your library.</Text>
        {shelfSections.map((item,index)=><View key={item.id} style={[styles.manageRow,{borderColor:p.line}]}>
          <Pressable accessibilityRole="switch" accessibilityState={{checked:item.visible}} onPress={()=>toggle(item.id)} style={[styles.visibilityToggle,{backgroundColor:item.visible?p.sage:p.line}]}><Text style={{color:p.ivory,fontWeight:'900'}}>{item.visible?'ON':'OFF'}</Text></Pressable>
          <Text style={[styles.bookTitle,{color:p.ink,flex:1}]}>{item.title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={'Move '+item.title+' up'} disabled={index===0} onPress={()=>move(index,-1)} style={styles.orderButton}><UiIcon name="chevronUp" color={index===0?p.muted:p.ink} size={17}/></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Move '+item.title+' down'} disabled={index===shelfSections.length-1} onPress={()=>move(index,1)} style={styles.orderButton}><UiIcon name="chevronDown" color={index===shelfSections.length-1?p.muted:p.ink} size={17}/></Pressable>
        </View>)}
        <Button label="Done" onPress={()=>setShelfManageOpen(false)}/>
      </View>
    </View></Modal>;
  }

  function Shelf(){
    const base:UnifiedWork[]=(sourceFilter==='all'?allUnifiedWorks:sourceWorks.filter((item:UnifiedWork)=>matchesSource(item.source,sourceFilter))).filter((work:UnifiedWork)=>!space||work.space===space);
    const continuing=base.filter((work:UnifiedWork)=>work.readingState==='in-progress').slice(0,12);
    const favourites=base.filter((work:UnifiedWork)=>work.favourite).slice(0,12);
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

    const seriesCounts=new Map<string,number>();for(const work of base)if(work.series)seriesCounts.set(work.series,(seriesCounts.get(work.series)||0)+1);
    const seriesGroups=[...seriesCounts.entries()]
      .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
      .slice(0,10)
      .map(([name,total])=>({name,total,works:base.filter(work=>work.series===name).slice(0,4)}));
    const localReview=localBooks.filter(book=>book.needsReview).length;
    const serverReview=session?(serverSummary?.needsReview||0):0;
    const reviewCount=sourceFilter==='local'?localReview:sourceFilter==='server'?serverReview:sourceFilter==='downloaded'?0:localReview+serverReview;
    const serverPathFor=(work:UnifiedWork)=>work.source==='server'&&work.serverWork&&session&&(!work.server||work.server===session.server)?'/api/works/'+work.serverWork.id+'/cover':undefined;
    const workArtwork=(work:UnifiedWork)=><Artwork title={work.title} format={work.format} coverShape={work.format==='Audio'?'square':'portrait'} coverUri={work.coverUri} serverPath={serverPathFor(work)}/>;
    const renderWorks=(works:UnifiedWork[])=>works.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.curatedRow}>{works.map(work=><View key={work.key} style={styles.curatedCardWrap}><UnifiedWorkCard work={work}/></View>)}</ScrollView>:null;
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
      if(item.id==='library'&&!base.length)return null;
      return <View key={item.id} style={styles.shelfSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{item.title}</Text>
          {item.id==='library'?<Pressable accessibilityRole="button" onPress={()=>setActiveTab('library')} style={styles.sectionLink}><Text style={{color:p.sage,fontWeight:'600'}}>See all</Text></Pressable>:null}
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
                style={[styles.smartShelfCover,{
                  left:index*30,
                  zIndex:10-index,
                  transform:[{rotate:index===0?'-4deg':index===3?'4deg':'0deg'}],
                }]}>
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
              {!works.length?<View style={[styles.collectionEmptyMark,{backgroundColor:p.card}]}><Text style={[styles.emptyMark,{color:p.muted}]}>A</Text></View>:null}
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
            onPress={()=>{clearLibraryFilters();setSeriesFilter(name);setActiveTab('library')}}
            style={({pressed})=>[styles.seriesTile,pressed&&styles.cardPressed]}>
            <View style={styles.seriesCoverStack}>
              {works.slice(0,3).map((work,index)=><View
                key={work.key}
                style={[styles.seriesCover,{
                  left:index*34,
                  top:index===1?3:index===2?6:0,
                  zIndex:10-index,
                }]}>
                {workArtwork(work)}
              </View>)}
              {!works.length?<View style={[styles.seriesEmpty,{borderColor:p.line}]}/>:null}
            </View>
            <Text numberOfLines={2} style={[styles.seriesName,{color:p.ink}]}>{name}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{total} work{total===1?'':'s'}</Text>
          </Pressable>)}
        </ScrollView>:null}

        {item.id==='library'?renderWorks(base.slice(0,12)):null}
      </View>;
    };

    return <ScrollView
      ref={shelfScrollRef}
      onScroll={e=>{shelfScrollOffset.current=e.nativeEvent.contentOffset.y}}
      scrollEventThrottle={120}
      onContentSizeChange={()=>{if(shelfScrollOffset.current>0)shelfScrollRef.current?.scrollTo({y:shelfScrollOffset.current,animated:false})}}
      contentContainerStyle={[styles.shelfContent,foldLayout&&styles.shelfContentFold]}>
      <View style={[styles.shelfEditorialHeader,foldLayout&&styles.shelfEditorialHeaderFold]}>
        <View style={{flex:1,minWidth:0}}>
          <Text style={[styles.shelfKicker,{color:p.sage}]}>YOUR LIBRARY</Text>
          <Text maxFontSizeMultiplier={1.15} style={[styles.shelfGreeting,{color:p.ink},layoutTier==='compact'&&styles.shelfGreetingCompact,layoutTier==='fold'&&styles.shelfGreetingFold]}>{shelfGreeting}</Text>
          <Text style={[styles.shelfEditorialSubtitle,{color:p.muted}]}>Stories make a kinder world.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Customise Shelf" onPress={()=>setShelfManageOpen(true)} style={styles.headerAction}>
          <Text style={{color:p.muted,fontWeight:'600'}}>Arrange</Text>
        </Pressable>
      </View>

      <OnboardingGuide/>

      {reviewCount>0?<Pressable accessibilityRole="button" onPress={()=>{setReviewOnly(true);setActiveTab('library')}} style={[styles.reviewBanner,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <View style={{flex:1}}><Text style={[styles.bookTitle,{color:p.ink}]}>{reviewCount} item{reviewCount===1?'':'s'} need a metadata check</Text><Text style={[styles.meta,{color:p.muted}]}>Review uncertain matches before organising files.</Text></View>
        <Text style={{color:p.sage,fontWeight:'700'}}>Review</Text>
      </Pressable>:null}

      {localScanning&&scanProgress?<View style={[styles.scanBanner,{backgroundColor:p.card}]}>
        <ActivityIndicator accessibilityLabel="Scanning local library" color={p.sage}/>
        <View style={{flex:1}}><Text style={{color:p.ink,fontWeight:'600'}}>Scanning {scanProgress.currentFolder||'library'}…</Text><Text style={{color:p.muted}}>{scanProgress.entriesVisited} checked · {scanProgress.found} found</Text></View>
      </View>:null}

      {!base.length&&!shelfLoading?<View style={styles.designedEmpty}>
        <Text style={[styles.emptyMark,{color:p.sage}]}>A</Text>
        <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Your Shelf is waiting</Text>
        <Text style={[styles.meta,{color:p.muted,textAlign:'center'}]}>{localFolders.length||session?'No works match this source or Space.':'Choose a folder and Archivist will begin building your library.'}</Text>
        {!localFolders.length?<Button label="Choose a folder" onPress={()=>void addLocalFolder()}/>:null}
      </View>:null}

      {shelfLoading?<View style={styles.skeletonRow}>{[0,1,2,3].map(i=><View key={i} style={[styles.skeletonCard,{backgroundColor:p.card}]}/>)}</View>:null}
      {shelfSections.map(section)}

      <View style={[styles.shelfBrowseBand,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <Text style={[styles.shelfBrowseLabel,{color:p.muted}]}>BROWSE</Text>
        <SourceSwitcher/>
        {availableSpaces.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryChips}><LibrarySwitcher/></ScrollView>:null}
      </View>

      <View style={[styles.shelfUtilityRow,{borderTopColor:p.line}]}>
        <Pressable accessibilityRole="button" onPress={()=>setActiveTab('library')} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>Browse library</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>{setOrganisationName('');setSmartShelfRules(emptySmartShelfRules());setSmartShelfAdvanced(false);setOrganisationModal('smart-shelf')}} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>New Smart Shelf</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>setOrganisationModal('manage')} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>Manage collections</Text></Pressable>
      </View>

      <Text style={[styles.brandSignature,{color:p.muted}]}>YOUR LIBRARY. YOURS.</Text>
      <WorkActionSheet/><OrganisationPanel/><ShelfManagePanel/><MetadataEditorPanel/>
    </ScrollView>;
  }

  function Library(){
    const wide=width>=760;
    const columns=libraryView==='list'?1:(width>=1180?6:width>=940?5:width>=600?4:2);
    const filtersActive=[space,formatFilter,authorFilter,seriesFilter,genreFilter,readingFilter,ratingFilter?String(ratingFilter):'',favouriteOnly?'fav':'',unknownAuthorOnly?'unknown':'',availabilityFilter!=='all'?availabilityFilter:'',collectionFilter].filter(Boolean).length;
    const formatOptions=[...new Set(allUnifiedWorks.map(work=>work.format).filter(Boolean))].sort();
    const authorOptions:string[]=Array.from(new Set<string>(allUnifiedWorks.map((work:UnifiedWork)=>work.author).filter((value:string)=>!!value))).sort().slice(0,20);
    const seriesOptions:string[]=Array.from(new Set<string>(allUnifiedWorks.map((work:UnifiedWork)=>work.series).filter((value:string)=>!!value))).sort().slice(0,20);
    const genreOptions:string[]=Array.from(new Set<string>(allUnifiedWorks.map((work:UnifiedWork)=>work.genre).filter((value:string)=>!!value))).sort().slice(0,20);
    const favouriteSelected=()=>{for(const work of selectedWorks){if(work.localWork)void saveLocalPreference(work.localWork,{...(localPreferences[work.localWork.key]||{rating:work.rating,favourite:work.favourite}),favourite:true});else if(work.serverWork)void saveServerPreference(work.serverWork,{...(serverPreferences[work.serverWork.id]||{rating:work.rating,favourite:work.favourite,state:work.readingState}),favourite:true});}setSelectedWorkKeys([])};
    const ReviewList=()=>reviewOnly?<View style={styles.reviewQueue}><View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Metadata review</Text><Text style={[styles.meta,{color:p.muted}]}>{visibleBooks.length} item{visibleBooks.length===1?'':'s'} need attention</Text></View><Button label="Done reviewing" tone="quiet" onPress={()=>setReviewOnly(false)}/></View>{visibleBooks.map(item=><RawAssetCard key={(item.source||'local')+'-'+item.id+'-'+(item.uri||'')} item={item}/>) }{!visibleBooks.length?<Text style={[styles.empty,{color:p.muted}]}>Nothing needs review.</Text>:null}</View>:null;
    const main=<View style={[styles.libraryMain,(layoutTier==='fold'||wide)&&styles.libraryMainFold,wide&&styles.libraryMainWide]}>
      <View style={styles.libraryCatalogueHeader}>
        <Text style={[styles.libraryKicker,{color:p.sage}]}>COLLECTION</Text>
        <View style={styles.pageHeadingRow}>
          <View style={{flex:1}}>
            <Text maxFontSizeMultiplier={1.15} style={[styles.libraryTitle,{color:p.ink},layoutTier==='compact'&&styles.libraryTitleCompact,layoutTier==='fold'&&styles.libraryTitleFold]}>Library</Text>
            <Text style={[styles.pageSubtitle,{color:p.muted}]}>{sortedUnifiedWorks.length} work{sortedUnifiedWorks.length===1?'':'s'}{filtersActive?' · '+filtersActive+' filter'+(filtersActive===1?'':'s')+' active':''}</Text>
          </View>
        </View>
      </View>
      {!wide?<><SourceSwitcher/>{availableSpaces.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryChips}><LibrarySwitcher/></ScrollView>:null}</>:null}
      {selectedWorkKeys.length?<View style={[styles.librarySelectionBar,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <Text style={[styles.bookTitle,{color:p.ink,flex:1}]}>{selectedWorkKeys.length} selected</Text>
        <Pressable accessibilityRole="button" onPress={()=>setOrganisationModal('add-to-collection')} style={styles.librarySelectionAction}><Text style={{color:p.ink,fontWeight:'600'}}>Collection</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={favouriteSelected} style={styles.librarySelectionAction}><Text style={{color:p.ink,fontWeight:'600'}}>Favourite</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>setSelectedWorkKeys([])} style={styles.librarySelectionAction}><Text style={{color:p.sage,fontWeight:'700'}}>Done</Text></Pressable>
      </View>:<>
        <View style={styles.librarySearchRow}>
          <View style={[styles.librarySearchShell,{backgroundColor:p.card}]}>
            <UiIcon name="search" color={p.muted} size={19}/>
            <TextInput accessibilityLabel="Search your library" value={query} onChangeText={setQuery} placeholder="Search books, authors, series or genres" placeholderTextColor={p.muted} style={[styles.librarySearch,{color:p.ink}]}/>
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
          <Pressable accessibilityRole="button" accessibilityState={{selected:!formatFilter}} onPress={()=>setFormatFilter('')} style={styles.libraryFormatTab}>
            <Text style={[styles.libraryFormatText,{color:!formatFilter?p.ink:p.muted,fontWeight:!formatFilter?'700':'500'}]}>All</Text>
            <View pointerEvents="none" style={[styles.libraryFormatMarker,{backgroundColor:p.sage,opacity:!formatFilter?1:0}]}/>
          </Pressable>
          {formatOptions.map(format=><Pressable key={format} accessibilityRole="button" accessibilityState={{selected:formatFilter===format}} onPress={()=>setFormatFilter(formatFilter===format?'':format)} style={styles.libraryFormatTab}>
            <Text style={[styles.libraryFormatText,{color:formatFilter===format?p.ink:p.muted,fontWeight:formatFilter===format?'700':'500'}]}>{format}</Text>
            <View pointerEvents="none" style={[styles.libraryFormatMarker,{backgroundColor:p.sage,opacity:formatFilter===format?1:0}]}/>
          </Pressable>)}
        </ScrollView>:null}
      </>}
      <ReviewList/>
      {!reviewOnly?<FlatList
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
      <WorkActionSheet/><OrganisationPanel/><MetadataEditorPanel/>
      {libraryFiltersOpen?<Modal transparent animationType="slide" visible onRequestClose={()=>setLibraryFiltersOpen(false)}><View style={styles.sheetBackdrop}><ScrollView contentContainerStyle={styles.sheetScroll}><View accessibilityViewIsModal accessibilityLabel="Library filters" style={[styles.actionSheet,{backgroundColor:p.card,borderColor:p.line}]}><View style={styles.sheetHandle}/><View style={styles.sectionHeader}><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Filter & sort</Text><Pressable accessibilityRole="button" onPress={clearLibraryFilters}><Text style={{color:p.sage,fontWeight:'800'}}>Reset</Text></Pressable></View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>SORT</Text><View style={styles.segment}>{(['title','author','rating'] as const).map(sort=><Pressable key={sort} accessibilityRole="button" accessibilityState={{selected:librarySort===sort}} onPress={()=>setLibrarySort(sort)} style={[styles.segmentItem,{backgroundColor:librarySort===sort?p.card:'transparent'}]}><Text style={{color:librarySort===sort?p.sage:p.muted,fontWeight:librarySort===sort?'700':'500'}}>{sort[0].toUpperCase()+sort.slice(1)}</Text></Pressable>)}</View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>READING STATE</Text><View style={styles.filterWrap}>{(['','not-started','in-progress','finished'] as const).map(state=><Pressable key={state||'any'} accessibilityRole="button" accessibilityState={{selected:readingFilter===state}} onPress={()=>setReadingFilter(state)} style={[styles.filterChip,{backgroundColor:readingFilter===state?p.card:'transparent'}]}><Text style={{color:readingFilter===state?p.sage:p.muted,fontWeight:readingFilter===state?'700':'500'}}>{state?state.replace('-',' '):'Any'}</Text></Pressable>)}</View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>AVAILABILITY</Text><View style={styles.filterWrap}>{(['all','available','unavailable'] as const).map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:availabilityFilter===value}} onPress={()=>setAvailabilityFilter(value)} style={[styles.filterChip,{backgroundColor:availabilityFilter===value?p.card:'transparent'}]}><Text style={{color:availabilityFilter===value?p.sage:p.muted,fontWeight:availabilityFilter===value?'700':'500'}}>{value[0].toUpperCase()+value.slice(1)}</Text></Pressable>)}</View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>PERSONAL</Text><View style={styles.filterWrap}><Pressable accessibilityRole="button" accessibilityState={{selected:favouriteOnly}} onPress={()=>setFavouriteOnly(!favouriteOnly)} style={[styles.filterChip,{backgroundColor:favouriteOnly?p.card:'transparent'}]}><Text style={{color:favouriteOnly?p.sage:p.muted,fontWeight:favouriteOnly?'700':'500'}}>Favourites</Text></Pressable>{[0,2,4,6,8,10].map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:ratingFilter===value}} onPress={()=>setRatingFilter(value)} style={[styles.filterChip,{backgroundColor:ratingFilter===value?p.card:'transparent'}]}><Text style={{color:ratingFilter===value?p.sage:p.muted,fontWeight:ratingFilter===value?'700':'500'}}>{value?ratingLabel(value):'Any rating'}</Text></Pressable>)}</View>
        <Text style={[styles.filterLabel,{color:p.muted}]}>AUTHOR</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}><Pressable accessibilityRole="button" accessibilityState={{selected:!authorFilter}} onPress={()=>setAuthorFilter('')} style={[styles.filterChip,{backgroundColor:!authorFilter?p.card:'transparent'}]}><Text style={{color:p.ink}}>Any</Text></Pressable>{authorOptions.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:authorFilter===value}} onPress={()=>setAuthorFilter(value)} style={[styles.filterChip,{backgroundColor:authorFilter===value?p.card:'transparent'}]}><Text style={{color:p.ink}}>{value}</Text></Pressable>)}</ScrollView>
        <Text style={[styles.filterLabel,{color:p.muted}]}>SERIES</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}><Pressable accessibilityRole="button" accessibilityState={{selected:!seriesFilter}} onPress={()=>setSeriesFilter('')} style={[styles.filterChip,{backgroundColor:!seriesFilter?p.card:'transparent'}]}><Text style={{color:p.ink}}>Any</Text></Pressable>{seriesOptions.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:seriesFilter===value}} onPress={()=>setSeriesFilter(value)} style={[styles.filterChip,{backgroundColor:seriesFilter===value?p.card:'transparent'}]}><Text style={{color:p.ink}}>{value}</Text></Pressable>)}</ScrollView>
        <Text style={[styles.filterLabel,{color:p.muted}]}>GENRE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}><Pressable accessibilityRole="button" accessibilityState={{selected:!genreFilter}} onPress={()=>setGenreFilter('')} style={[styles.filterChip,{backgroundColor:!genreFilter?p.card:'transparent'}]}><Text style={{color:p.ink}}>Any</Text></Pressable>{genreOptions.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:genreFilter===value}} onPress={()=>setGenreFilter(value)} style={[styles.filterChip,{backgroundColor:genreFilter===value?p.card:'transparent'}]}><Text style={{color:p.ink}}>{value}</Text></Pressable>)}</ScrollView>
        <Button label="Apply" onPress={()=>setLibraryFiltersOpen(false)}/><Button label="Save as Smart Shelf" tone="quiet" onPress={()=>{setLibraryFiltersOpen(false);setOrganisationName('');setSmartShelfRules(emptySmartShelfRules());setSmartShelfAdvanced(false);setOrganisationModal('smart-shelf')}}/>
      </View></ScrollView></View></Modal>:null}
    </View>;
    return wide?<View style={styles.libraryTwoPane}><View style={[styles.libraryRail,{backgroundColor:p.paper,borderRightColor:p.line}]}><Text style={[styles.libraryRailTitle,{color:p.muted}]}>SOURCES</Text><SourceSwitcher vertical/><Text style={[styles.libraryRailTitle,{color:p.muted,marginTop:24}]}>SPACES</Text><LibrarySwitcher vertical/><Pressable accessibilityRole="button" onPress={()=>void addLocalFolder()} style={styles.libraryRailAdd}><Text style={{color:p.sage,fontWeight:'600'}}>Add device folder</Text></Pressable></View>{main}</View>:main;
  }

  function LivingBook({book,chapterTitle,chapterNumber}:{book:Book;chapterTitle?:string;chapterNumber?:number}){
    const coverShift=bookOpenAnim.interpolate({inputRange:[0,1],outputRange:[0,-146]});
    const coverTurn=bookOpenAnim.interpolate({inputRange:[0,1],outputRange:['0deg','-138deg']});
    const spreadScale=bookOpenAnim.interpolate({inputRange:[0,1],outputRange:[.92,1]});
    const shadowOpacity=bookOpenAnim.interpolate({inputRange:[0,1],outputRange:[.08,.18]});
    const turningShift=pageTurnAnim.interpolate({inputRange:[0,1],outputRange:[0,-146]});
    const turningRotate=pageTurnAnim.interpolate({inputRange:[0,1],outputRange:['0deg','-152deg']});
    const pageTone=p.paper==='#000000'?'#111111':'#FAF8F2';
    const lineTone=p.paper==='#000000'?'#303030':'#DDDAD2';
    return <View accessibilityLabel="Living book artwork" style={styles.livingBookStage}>
      <Animated.View pointerEvents="none" style={[styles.livingBookShadow,{backgroundColor:'#000',opacity:shadowOpacity}]}/>
      <Animated.View style={[styles.livingBookSpread,{transform:[{scale:spreadScale}]}]}>
        <View style={[styles.livingBookStaticPage,styles.livingBookLeftPage,{backgroundColor:pageTone,borderColor:p.line}]}>
          <View style={[styles.livingBookInnerSpine,{backgroundColor:p.sage,opacity:.28}]}/>
          <View style={styles.livingBookInsetArt}><Cover book={{...book,coverShape:'portrait'}}/></View>
          <Text numberOfLines={1} style={[styles.livingBookPageCaption,{color:p.muted}]}>{book.series||'ARCHIVIST'}</Text>
          <Text style={[styles.livingBookPageNumber,{color:p.muted}]}>ARCHIVIST</Text>
        </View>
        <View style={[styles.livingBookStaticPage,styles.livingBookRightPage,{backgroundColor:pageTone,borderColor:p.line}]}>
          <Text style={[styles.livingBookPageKicker,{color:p.sage}]}>NOW PLAYING</Text>
          <Text numberOfLines={3} style={[styles.livingBookPageTitle,{color:p.ink}]}>{book.title}</Text>
          <View style={[styles.livingBookPageRule,{backgroundColor:p.line}]}/>
          <Text numberOfLines={2} style={[styles.livingBookPageAuthor,{color:p.muted}]}>{book.author||'Unknown author'}</Text>
          <Text numberOfLines={3} style={[styles.livingBookPageQuote,{color:p.ink}]}>{chapterTitle||'A story worth returning to.'}</Text>
          <Text style={[styles.livingBookPageNumber,{color:p.muted}]}>{chapterNumber?'CH '+String(chapterNumber).padStart(2,'0'):'LISTEN'}</Text>
        </View>
        <Animated.View pointerEvents="none" style={[styles.livingBookTurningPage,{backgroundColor:pageTone,borderColor:p.line,transform:[{perspective:1400},{translateX:turningShift},{rotateY:turningRotate}]}]}>
          {[0,1,2,3,4].map(line=><View key={'t'+line} style={[styles.livingBookPageLine,{backgroundColor:lineTone,width:line===0?'56%':'78%'}]}/>)}
        </Animated.View>
        <Animated.View style={[styles.livingBookFrontCover,{transform:[{perspective:1400},{translateX:coverShift},{rotateY:coverTurn}]}]}>
          <View style={styles.livingBookCoverArt}><Cover book={{...book,coverShape:'portrait'}}/></View>
        </Animated.View>
        <View pointerEvents="none" style={[styles.livingBookCentreLine,{backgroundColor:p.line}]}/>
      </Animated.View>
    </View>;
  }

  function Player() {
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
      <ScrollView contentContainerStyle={[styles.playerScreen,foldLayout&&styles.playerScreenFold]}>
        <View style={styles.playerHeading}>
          <Text style={[styles.playerEyebrow,{color:p.sage}]}>LIVING BOOK</Text>
          {current ? <Text style={[styles.meta,{color:p.muted,fontWeight:'600'}]}>{speed}×</Text> : null}
        </View>
        {current ? (
          <View style={[styles.playerAdaptive,foldLayout&&styles.playerAdaptiveWide]}>
            <View style={styles.playerHeroColumn}>
            <LivingBook book={current} chapterTitle={currentChapter?.title} chapterNumber={currentChapterIndex>=0?currentChapterIndex+1:undefined}/>
            <View style={styles.playerIdentity}>
              <Text maxFontSizeMultiplier={1.12} numberOfLines={2} style={[styles.nowTitle,{color:p.ink},layoutTier==='compact'&&styles.nowTitleCompact,layoutTier==='fold'&&styles.nowTitleFold]}>{current.title}</Text>
              <Text numberOfLines={2} style={[styles.playerByline, {color: p.muted}]}>
                {[current.author, current.series, current.space].filter(Boolean).join(' · ')}
              </Text>
              {currentChapter ? <Text numberOfLines={1} style={[styles.playerChapter,{color:p.sage}]}>
                Chapter {currentChapterIndex + 1} of {effectiveChapters.length} · {currentChapter.title}
              </Text> : null}
            </View>
            <View style={styles.playerStatusRow}>
              <Text style={[styles.playerStatusText,{color:p.muted}]}>{current.source==='server'?'Server':current.source==='downloaded'?'Downloaded':'On this device'}</Text>
              {offlineCopy?<Text style={[styles.playerStatusText,{color:p.sage}]}>Available offline</Text>:null}
              {current.source==='server'&&currentServerWork&&!offlineCopy?<Pressable accessibilityRole="button" disabled={offlineBusyId===currentServerWork.id} onPress={()=>void downloadServerWork(currentServerWork)} style={styles.playerStatusAction}><Text style={[styles.playerStatusText,{color:p.sage,fontWeight:'600'}]}>{offlineBusyId===currentServerWork.id?'Downloading…':'Download'}</Text></Pressable>:null}
            </View>
            </View>
            <View style={styles.playerControlColumn}>

            <Pressable
              accessibilityRole="adjustable"
              accessibilityLabel="Playback position"
              accessibilityHint="Tap to seek, or swipe up and down with a screen reader to move by 30 seconds"
              accessibilityValue={{min:0,max:Math.max(1,Math.round(duration)),now:Math.round(position),text:formatTime(position)+' of '+formatTime(duration)}}
              accessibilityActions={[{name:'increment',label:'Forward 30 seconds'},{name:'decrement',label:'Back 30 seconds'}]}
              onAccessibilityAction={event=>{
                if(event.nativeEvent.actionName==='increment')seekTo(position+30);
                if(event.nativeEvent.actionName==='decrement')seekTo(position-30);
              }}
              onLayout={event=>setPlayerProgressWidth(Math.max(1,event.nativeEvent.layout.width))}
              onPress={event => {
                if (!duration) return;
                const location = event.nativeEvent.locationX;
                seekTo((location / Math.max(1,playerProgressWidth)) * duration);
              }}
              style={[styles.progressHitArea,{maxWidth:560,alignSelf:'center',width:'100%'}]}>
              <View style={[styles.progressTrack, {backgroundColor: p.line}]}>
                <View style={[styles.progressFill, {backgroundColor: p.sage, width: `${displayedProgress * 100}%`}]} />
              </View>
            </Pressable>
            <View style={styles.timeRow}>
              <Text style={[styles.playerTime,{color:p.muted}]}>{formatTime(position)}</Text>
              <Text style={[styles.playerTime,{color:p.muted}]}>−{formatTime(remaining)}</Text>
            </View>

            <View style={styles.transport}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back 15 seconds" onPress={()=>seekTo(position-15)} style={styles.skipButton}>
                <UiIcon name="skipBack" color={p.ink} size={32}/>
                <Text pointerEvents="none" style={[styles.skipNumber,{color:p.ink}]}>15</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                disabled={serverPlayer ? playback?.loading : false}
                style={({pressed})=>[styles.playButton,{backgroundColor:p.sage,transform:[{scale:pressed?0.97:1}]}]}
                onPress={()=>void togglePlayback()}>
                {serverPlayer && playback?.loading ? <ActivityIndicator color="#FFFFFF"/> : <UiIcon name={isPlaying?'pause':'play'} color="#FFFFFF" size={27}/>} 
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Forward 30 seconds" onPress={()=>seekTo(position+30)} style={styles.skipButton}>
                <UiIcon name="skipForward" color={p.ink} size={32}/>
                <Text pointerEvents="none" style={[styles.skipNumber,{color:p.ink}]}>30</Text>
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
        ) : (
          <View style={styles.playerEmpty}>
            <Text style={[styles.emptyMark,{color:p.sage}]}>A</Text>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Nothing playing</Text>
            <Text style={[styles.empty,{color:p.muted,textAlign:'center'}]}>Choose an audiobook from Shelf. Archivist will remember where you stopped.</Text>
            <Button label="Go to Shelf" tone="quiet" onPress={()=>setActiveTab('shelf')}/>
          </View>
        )}
      </ScrollView>
    );
  }

  function ReaderTools(){
    if(!reading)return null;const workKey=readerWorkKey(reading);const bookmarks=workReaderBookmarks(readerBookmarks,workKey);const annotations=workReaderAnnotations(readerAnnotations,workKey);
    const updateScale=(delta:number)=>void persistReaderAppearance({...readerAppearance,scale:Math.max(.78,Math.min(1.5,readerAppearance.scale+delta))});
    return <Modal transparent animationType="slide" visible={readerToolsOpen} onRequestClose={()=>setReaderToolsOpen(false)}><View style={styles.sheetBackdrop}><ScrollView contentContainerStyle={styles.sheetScroll} keyboardShouldPersistTaps="handled"><View accessibilityViewIsModal accessibilityLabel="Reader tools" style={[styles.actionSheet,{backgroundColor:p.card,borderColor:p.line}]}>
      <View style={styles.sheetHandle}/>
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

  function Reader() {
    const closeReader=()=>{setReading(null);setLocalReader(null);setReaderLoadError('');setReaderLoading(false);setReaderToolsOpen(false);setActiveTab('shelf');};
    const readerBar=<View style={[styles.readerBar,{backgroundColor:p.paper}]}><Pressable accessibilityRole="button" accessibilityLabel="Back to Shelf" onPress={closeReader} style={styles.readerBack}><UiIcon name="back" color={p.ink} size={21}/></Pressable><View style={styles.readerHeading}><Text numberOfLines={1} style={[styles.readerTitle,{color:p.ink}]}>{reading?.title || 'Reader'}</Text>{reading?<Text style={[styles.readerFormat,{color:p.muted}]}>{reading.format}</Text>:null}</View><Pressable accessibilityRole="button" accessibilityLabel="Reader tools" onPress={()=>setReaderToolsOpen(true)} style={styles.readerToolsButton}><Text style={[styles.readerToolGlyph,{color:p.ink}]}>Aa</Text></Pressable></View>;
    if(!reading)return <View style={styles.readerEmpty}><Text style={[styles.emptyMark,{color:p.sage}]}>A</Text><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Reader</Text><Text style={[styles.empty,{color:p.muted,textAlign:'center'}]}>Open an EPUB, PDF or comic from Shelf.</Text></View>;
    const localReaderMode=reading.source!=='server';
    if(localReaderMode){
      const localPdf=reading.format==='PDF'&&!!reading.uri&&Platform.OS==='android';
      return <View style={styles.readerScreen}>{readerBar}{localPdf?<LocalPdfReader uri={reading.uri!} title={reading.title} initialPage={localReadingProgress[reading.uri!]||0} requestedPage={readerRequestedPage} paper={p.paper} ink={p.ink} muted={p.muted} line={p.line} sage={p.sage} onPosition={(page,count,complete)=>handleReaderMessage(JSON.stringify({type:'reader-position',page,count,complete}))}/>:readerLoading?<View style={styles.readerLoading}><ActivityIndicator accessibilityLabel="Opening local reader"/><Text style={[styles.meta,{color:p.muted}]}>Opening {reading.format}…</Text></View>:readerLoadError?<View style={styles.readerFailure}><Text accessibilityRole="alert" style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Couldn’t open this book</Text><Text style={[styles.meta,{color:p.muted}]}>{readerLoadError}</Text><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View>:localReader?.html?<WebView ref={readerWebRef} originWhitelist={['*']} source={{html:localReader.html}} onLoadEnd={()=>sendReaderCommand('appearance',{value:readerAppearance})} onMessage={event=>handleReaderMessage(event.nativeEvent.data)}/>:localReader?.uri?<WebView ref={readerWebRef} originWhitelist={['content://*','file://*']} source={{uri:localReader.uri}} allowFileAccess/>:<Text style={[styles.empty,{color:p.muted,padding:16}]}>Unable to open this file.</Text>}<ReaderTools/></View>;
    }
    if(!session||(reading.originServer&&reading.originServer!==session.server))return <View style={styles.readerScreen}>{readerBar}<View style={styles.readerFailure}><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Server reader unavailable</Text><Text style={[styles.meta,{color:p.muted}]}>Reconnect to the server that owns this title, or open its downloaded copy.</Text><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View><ReaderTools/></View>;
    return <View style={styles.readerScreen}>{readerBar}<WebView ref={readerWebRef} key={session.token+reading.id+':'+readerReloadKey} source={{uri:session.server+'/reader.html?asset='+reading.id,headers:{Authorization:'Bearer '+session.token}}} incognito originWhitelist={[session.server]} onShouldStartLoadWithRequest={r=>readerNavigationAllowed(r.url,session.server)} mixedContentMode="never" injectedJavaScriptBeforeContentLoaded={readerHostBridgeSource()} onLoadStart={()=>{setReaderLoading(true);setReaderLoadError('')}} onLoadEnd={()=>{setReaderLoading(false);sendReaderCommand('appearance',{value:readerAppearance})}} onMessage={event=>handleReaderMessage(event.nativeEvent.data)} onHttpError={e=>{const message='Reader request failed: '+e.nativeEvent.statusCode;setReaderLoadError(message);setReaderLoading(false);setError(message)}} onError={e=>{const message=e.nativeEvent.description||'Reader failed to load.';setReaderLoadError(message);setReaderLoading(false);setError(message)}} allowFileAccess={false} javaScriptCanOpenWindowsAutomatically={false} setSupportMultipleWindows={false}/>{readerLoading?<View pointerEvents="none" style={[styles.readerOverlay,{backgroundColor:p.paper}]}><ActivityIndicator accessibilityLabel="Opening server reader"/><Text style={[styles.meta,{color:p.muted}]}>Opening {reading.format}…</Text></View>:null}{readerLoadError?<View style={[styles.readerErrorOverlay,{backgroundColor:p.paper}]}><Text accessibilityRole="alert" style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Reader needs attention</Text><Text style={[styles.meta,{color:p.muted}]}>{readerLoadError}</Text><View style={styles.toolRow}><Button label="Retry" onPress={()=>{setReaderLoadError('');setReaderLoading(true);setReaderReloadKey(key=>key+1)}}/><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View></View>:null}<ReaderTools/></View>;
  }

  function atlasSelect(kind: AtlasKind, value: string) {
    setReviewOnly(false);
    setQuery('');
    setSpace('');
    setAvailabilityFilter('all');
    setFormatFilter('');
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
      <View style={[styles.atlasGroup, {borderColor: p.line, backgroundColor: p.card}]}>
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
        <Button label="Back to Atlas" tone="quiet" onPress={()=>setAtlasFocus(null)} />
        <View style={[styles.atlasFocusHero,{backgroundColor:p.card,borderColor:p.line}]}>
          <Text style={[styles.playerEyebrow,{color:p.sage}]}>{atlasFocus.kind==='space'?'FOLDER':atlasFocus.kind.toUpperCase()}</Text>
          <Text style={[styles.title,{color:p.ink,marginBottom:0}]}>{atlasFocus.value}</Text>
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
    const viewWidth=Math.max(286,Math.min(1244,width-36));
    const viewHeight=width>=760?640:540;
    const scale=Math.max(.34,Math.min(1.08,Math.min(viewWidth/atlasUniverse.width,viewHeight/atlasUniverse.height)*.94));
    animateAtlasTransform({x:(viewWidth-atlasUniverse.width*scale)/2,y:(viewHeight-atlasUniverse.height*scale)/2,scale});
  }

  function atlasGestureStart(event:any){
    const touches=event.nativeEvent.touches||[];
    if(touches.length>=2){
      const [a,b]=touches;
      const dx=a.locationX-b.locationX,dy=a.locationY-b.locationY;
      atlasGesture.current={mode:'pinch',startX:0,startY:0,baseX:atlasTransform.x,baseY:atlasTransform.y,baseScale:atlasTransform.scale,distance:Math.max(1,Math.hypot(dx,dy)),focusX:(a.locationX+b.locationX)/2,focusY:(a.locationY+b.locationY)/2};
      return;
    }
    const point=touches[0]||event.nativeEvent;
    atlasGesture.current={mode:'pan',startX:point.locationX||0,startY:point.locationY||0,baseX:atlasTransform.x,baseY:atlasTransform.y,baseScale:atlasTransform.scale,distance:0,focusX:0,focusY:0};
  }

  function atlasGestureMove(event:any){
    const gesture=atlasGesture.current;if(!gesture)return;
    const touches=event.nativeEvent.touches||[];
    if(touches.length>=2){
      const [a,b]=touches;
      const dx=a.locationX-b.locationX,dy=a.locationY-b.locationY;
      const distance=Math.max(1,Math.hypot(dx,dy));
      if(gesture.mode!=='pinch'){atlasGestureStart(event);return;}
      const nextScale=Math.max(.34,Math.min(2.25,gesture.baseScale*(distance/gesture.distance)));
      const ratio=nextScale/gesture.baseScale;
      setAtlasTransform({x:gesture.focusX-(gesture.focusX-gesture.baseX)*ratio,y:gesture.focusY-(gesture.focusY-gesture.baseY)*ratio,scale:nextScale});
      return;
    }
    if(gesture.mode==='pinch')return;
    const point=touches[0]||event.nativeEvent;
    setAtlasTransform(current=>({...current,x:gesture.baseX+(point.locationX-gesture.startX),y:gesture.baseY+(point.locationY-gesture.startY)}));
  }

  function atlasNodeColor(node:AtlasUniverseNode){
    if(node.kind==='author')return p.ink;
    if(node.kind==='note')return p.raised;
    if(node.kind==='genre')return p.paper;
    if(node.kind==='series'||node.kind==='collection')return p.card;
    return p.paper;
  }

  function atlasNodeVisible(node:AtlasUniverseNode){
    const scale=atlasTransform.scale;
    if(scale<.52)return node.kind==='genre'||node.kind==='collection';
    if(scale<.76)return node.kind!=='work'&&node.kind!=='note';
    return true;
  }

  function atlasSearchGo(){
    const q=atlasSearch.trim().toLowerCase();if(!q)return;
    const node=atlasUniverse.nodes.find(item=>item.label.toLowerCase().includes(q)||item.subtitle?.toLowerCase().includes(q));
    if(!node)return;
    setAtlasNodeId(node.id);
    const viewWidth=Math.max(286,Math.min(1244,width-36)),viewHeight=width>=760?620:520;
    const scale=Math.max(.82,atlasTransform.scale);
    animateAtlasTransform({scale,x:viewWidth/2-node.x*scale,y:viewHeight/2-node.y*scale});
  }

  function AtlasEdgeView({from,to,kind}:{from:AtlasUniverseNode;to:AtlasUniverseNode;kind:string}){
    const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;
    return <View pointerEvents="none" style={[styles.atlasUniverseEdge,{left:from.x,top:from.y,width:length,opacity:kind==='genre'?.24:.14,backgroundColor:p.line,transform:[{rotateZ:angle+'deg'}]}]}/>;
  }

  function AtlasUniverseNodeView({node}:{node:AtlasUniverseNode}){
    if(!atlasNodeVisible(node))return null;
    const selected=node.id===atlasNodeId;
    const q=atlasSearch.trim().toLowerCase();
    const searchMatch=!q||node.label.toLowerCase().includes(q)||!!node.subtitle?.toLowerCase().includes(q);
    const work=node.kind==='work'?atlasUniverseWorks.find(item=>item.key===node.workKey):undefined;
    const size=node.kind==='genre'?96:node.kind==='author'?58:node.kind==='work'?72:node.kind==='series'?62:node.kind==='collection'?70:42;
    const common={left:node.x-size/2,top:node.y-size/2,width:size,minHeight:size,opacity:searchMatch?1:.24,borderColor:selected?p.sage:p.line,backgroundColor:atlasNodeColor(node)};
    return <Pressable accessibilityRole="button" accessibilityLabel={node.kind+' '+node.label} onPress={()=>setAtlasNodeId(node.id)} style={[
      styles.atlasUniverseNode,common,node.kind==='genre'&&styles.atlasGenreNode,node.kind==='author'&&styles.atlasAuthorNode,node.kind==='series'&&styles.atlasSeriesNode,node.kind==='work'&&styles.atlasWorkNode,node.kind==='collection'&&styles.atlasCollectionNode,selected&&styles.atlasUniverseNodeSelected,
    ]}>
      {node.kind==='work'&&node.coverUri?<Image source={{uri:node.coverUri}} style={styles.atlasNodeCover}/>:null}
      {node.kind==='author'?<Text style={[styles.atlasNodeMonogram,{color:p.paper}]}>{node.label.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')}</Text>:null}
      {node.kind==='series'?<View style={styles.atlasSeriesGlyph}><View style={[styles.atlasSeriesSpine,{height:28,backgroundColor:p.line}]}/><View style={[styles.atlasSeriesSpine,{height:34,backgroundColor:p.muted,opacity:.45}]}/><View style={[styles.atlasSeriesSpine,{height:40,backgroundColor:p.sage}]}/></View>:null}
      {node.kind==='collection'?<View style={styles.atlasCollectionGlyph}><View style={[styles.atlasCollectionSheet,{left:0,top:6,borderColor:p.line}]}/><View style={[styles.atlasCollectionSheet,{left:7,top:3,borderColor:p.line}]}/><View style={[styles.atlasCollectionSheet,{left:14,top:0,borderColor:p.sage}]}/></View>:null}
      {node.kind==='note'?<View style={[styles.atlasNoteGlyph,{borderColor:p.line}]}><View style={[styles.atlasNoteLine,{backgroundColor:p.muted,width:'72%'}]}/><View style={[styles.atlasNoteLine,{backgroundColor:p.muted,width:'54%'}]}/></View>:null}
      {node.kind!=='author'&&node.kind!=='series'&&node.kind!=='collection'&&node.kind!=='note'&&!(node.kind==='work'&&node.coverUri)?<Text numberOfLines={node.kind==='genre'?2:3} style={[styles.atlasNodeLabel,{color:p.ink}]}>{node.label}</Text>:null}
      {(node.kind==='series'||node.kind==='collection'||node.kind==='note')?<Text numberOfLines={2} style={[styles.atlasNodeLabel,styles.atlasNodeCaption,{color:p.ink}]}>{node.label}</Text>:null}
      {node.kind==='genre'?<Text style={[styles.atlasNodeCount,{color:p.muted}]}>{node.count}</Text>:null}
      {node.kind==='work'&&work?.source==='downloaded'?<View style={[styles.atlasNodeSourceDot,{backgroundColor:p.sage}]}/>:null}
    </Pressable>;
  }

  function AtlasInspector(){
    const node=atlasSelectedNode;if(!node)return null;
    const work=node.kind==='work'?atlasUniverseWorks.find(item=>item.key===node.workKey):undefined;
    const collection=node.kind==='collection'?collections.find(item=>item.id===node.collectionId):undefined;
    const connected=atlasUniverse.edges.filter(edge=>edge.from===node.id||edge.to===node.id).length;
    return <View style={[styles.atlasInspector,{backgroundColor:width>=760?p.paper:p.raised},width>=760?styles.atlasInspectorWide:styles.atlasInspectorMobile,width>=760&&{borderLeftColor:p.line}]}>
      <View style={styles.sectionHeader}><View style={{flex:1,minWidth:0}}><Text style={[styles.playerEyebrow,{color:p.sage}]}>{node.kind.toUpperCase()}</Text><Text numberOfLines={2} style={[styles.sectionTitle,{color:p.ink,marginTop:2}]}>{node.label}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close Atlas inspector" onPress={()=>setAtlasNodeId('')} style={styles.iconButton}><UiIcon name="close" color={p.muted} size={17}/></Pressable></View>
      {node.subtitle?<Text style={[styles.meta,{color:p.muted}]}>{node.subtitle}</Text>:null}
      <Text style={[styles.meta,{color:p.muted}]}>{connected} connection{connected===1?'':'s'}{node.source?' · '+sourceLabel(node.source as WorkSource):''}</Text>
      <View style={styles.toolRow}>
        {work?<Button label="Open" onPress={()=>openUnifiedWork(work)}/>:null}
        {node.relationKind&&node.relationValue?<Button label="Explore" onPress={()=>setAtlasFocus({kind:node.relationKind as AtlasKind,value:node.relationValue!})}/>:null}
        {collection?<Button label="Open collection" onPress={()=>openCollection(collection)}/>:null}
      </View>
    </View>;
  }

  function Atlas() {
    if(atlasFocus)return <AtlasRelationshipView />;
    const renderedNodes=atlasUniverse.nodes.filter(atlasNodeVisible);
    const renderedIds=new Set(renderedNodes.map(node=>node.id));
    const renderedEdges=atlasUniverse.edges.filter(edge=>renderedIds.has(edge.from)&&renderedIds.has(edge.to));
    const nodeMap=new Map(atlasUniverse.nodes.map(node=>[node.id,node]));
    const viewHeight=width>=760?640:540;
    return (
      <ScrollView contentContainerStyle={styles.atlasScreen} keyboardShouldPersistTaps="handled">
        <View style={styles.pageHeadingRow}>
          <View style={{flex:1}}>
            <Text style={[styles.title,{color:p.ink,marginBottom:2}]}>Atlas</Text>
            <Text style={[styles.pageSubtitle,{color:p.muted}]}>A living map of the books, people, series and ideas in your library.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={atlasListMode?'Show Atlas universe':'Show Atlas list'} onPress={()=>setAtlasListMode(value=>!value)} style={styles.headerAction}>
            <UiIcon name={atlasListMode?'atlas':'list'} color={p.muted} size={22}/>
          </Pressable>
        </View>

        <SourceSwitcher/>
        {availableSpaces.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryChips}><LibrarySwitcher/></ScrollView>:null}

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
            <TextInput value={atlasSearch} onChangeText={setAtlasSearch} onSubmitEditing={atlasSearchGo} returnKeyType="search" placeholder="Find a title, person, series, collection or tag" placeholderTextColor={p.muted} style={[styles.atlasSearchInput,{color:p.ink,backgroundColor:p.card}]}/>
            <Pressable accessibilityRole="button" accessibilityLabel="Find in Atlas" onPress={atlasSearchGo} style={styles.atlasSearchButton}><UiIcon name="search" color={p.ink} size={20}/></Pressable>
          </View>

          <View style={[styles.atlasUniverseLayout,width>=760&&styles.atlasUniverseLayoutWide]}>
            <View style={[styles.atlasViewport,{height:viewHeight,backgroundColor:p.paper}]}
              onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true}
              onResponderGrant={atlasGestureStart} onResponderMove={atlasGestureMove}
              onResponderRelease={()=>{atlasGesture.current=null}} onResponderTerminate={()=>{atlasGesture.current=null}}>
              <View style={styles.atlasViewportTools}>
                <Pressable accessibilityRole="button" accessibilityLabel="Fit Atlas" onPress={atlasResetView} style={[styles.atlasToolButton,{backgroundColor:p.raised}]}><UiIcon name="fit" color={p.ink} size={18}/></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={()=>animateAtlasTransform({...atlasTransform,scale:Math.max(.34,atlasTransform.scale-.15)},180)} style={[styles.iconButton,styles.atlasZoomButton,{backgroundColor:p.raised}]}><UiIcon name="zoomOut" color={p.ink} size={18}/></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={()=>animateAtlasTransform({...atlasTransform,scale:Math.min(2.25,atlasTransform.scale+.15)},180)} style={[styles.iconButton,styles.atlasZoomButton,{backgroundColor:p.raised}]}><UiIcon name="zoomIn" color={p.ink} size={18}/></Pressable>
              </View>

              <View style={[styles.atlasUniverseCanvas,{width:atlasUniverse.width,height:atlasUniverse.height,left:atlasTransform.x,top:atlasTransform.y,transform:[{scale:atlasTransform.scale}],transformOrigin:'top left'} as any]}>
                {renderedEdges.map(edge=>{const from=nodeMap.get(edge.from),to=nodeMap.get(edge.to);return from&&to?<AtlasEdgeView key={edge.id} from={from} to={to} kind={edge.kind}/>:null})}
                {renderedNodes.map(node=><AtlasUniverseNodeView key={node.id} node={node}/>)}
              </View>

              {width<760?<AtlasInspector/>:null}
              {atlasUniverse.hiddenWorks?<View style={[styles.atlasClusterNotice,{backgroundColor:p.paper}]}><Text style={[styles.meta,{color:p.muted}]}>A stable sample is shown for smooth navigation · {atlasUniverse.hiddenWorks} more works remain available through search and clusters.</Text></View>:null}
            </View>
            {width>=760?<AtlasInspector/>:null}
          </View>

          <Text style={[styles.atlasHint,{color:p.muted}]}>Pinch, pan and explore</Text>
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
        <TextInput accessibilityLabel={title+' target'} keyboardType="number-pad" value={draft} onChangeText={onDraft} style={[styles.insightGoalInput,{color:p.ink,backgroundColor:p.card}]}/>
      </View>
      <View style={[styles.achievementTrack,{backgroundColor:p.line}]}><View style={[styles.achievementFill,{backgroundColor:p.sage,width:`${Math.round(progress*100)}%`}]} /></View>
    </View>;
  }

  function Insights(){
    const summary=insightSummary;
    const listeningHours=summary.listeningSeconds/3600;
    const listeningLabel=listeningHours<10?listeningHours.toFixed(1)+'h':Math.round(listeningHours)+'h';
    const lead=summary.completed
      ? `${summary.completed} finished · ${summary.activeDays} active day${summary.activeDays===1?'':'s'} · ${summary.annotationCount} saved idea${summary.annotationCount===1?'':'s'}`
      : 'Your reading and listening history will build here as you use Archivist.';
    const metrics:Array<[string,string|number]>=[
      ['Finished',summary.completed],
      ['In progress',summary.inProgress],
      ['Listening',listeningLabel],
      ['Active days',summary.activeDays],
      ['Notes',summary.annotationCount],
      ['Average rating',summary.rated?ratingLabel(summary.averageRating):'—'],
    ];
    const today=new Date();today.setHours(0,0,0,0);
    const activityWeek=Array.from({length:7},(_,index)=>{
      const date=new Date(today);date.setDate(today.getDate()-(6-index));
      const next=new Date(date);next.setDate(date.getDate()+1);
      const from=date.getTime()/1000,to=next.getTime()/1000;
      const items=summary.recentActivity.filter(item=>item.updatedAt>=from&&item.updatedAt<to);
      const seconds=items.reduce((total,item)=>total+Math.max(0,item.activeSeconds||0),0);
      return {key:date.toISOString().slice(0,10),label:date.toLocaleDateString(undefined,{weekday:'short'}).slice(0,1),seconds,events:items.reduce((total,item)=>total+item.events,0)};
    });
    const maxDaySeconds=Math.max(1,...activityWeek.map(day=>day.seconds));
    return <ScrollView contentContainerStyle={styles.insightsScreen}>
      <View style={styles.pageHeadingRow}>
        <View style={{flex:1}}>
          <Text style={[styles.title,{color:p.ink,marginBottom:2}]}>Insights</Text>
          <Text style={[styles.pageSubtitle,{color:p.muted}]}>A private record of how your library is becoming part of your life.</Text>
        </View>
      </View>

      <SourceSwitcher/>

      <View style={styles.insightEditorialHero}>
        <Text style={[styles.insightEditorialKicker,{color:p.sage}]}>YOUR READING LIFE</Text>
        <Text style={[styles.insightEditorialTitle,{color:p.ink}]}>{lead}</Text>
      </View>

      <View style={[styles.insightStatStrip,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        {metrics.map(([label,value])=><View key={label} style={[styles.insightStat,width>=760&&styles.insightStatWide]}>
          <Text style={[styles.insightStatValue,{color:p.ink}]}>{value}</Text>
          <Text style={[styles.insightStatLabel,{color:p.muted}]}>{label}</Text>
        </View>)}
      </View>

      <View style={styles.insightRhythmSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Last 7 days</Text>
          <Text style={[styles.meta,{color:p.muted}]}>{activityWeek.reduce((total,day)=>total+day.events,0)} update{activityWeek.reduce((total,day)=>total+day.events,0)===1?'':'s'}</Text>
        </View>
        <View style={styles.insightRhythmChart}>
          {activityWeek.map(day=>{
            const active=day.seconds>0;
            const barHeight=active?Math.max(10,Math.round((day.seconds/maxDaySeconds)*72)):3;
            return <View key={day.key} style={styles.insightRhythmDay}>
              <View style={styles.insightRhythmBarArea}>
                <View style={[styles.insightRhythmBar,{height:barHeight,backgroundColor:active?p.sage:p.line,opacity:active?1:.7}]}/>
              </View>
              <Text style={[styles.insightRhythmLabel,{color:p.muted}]}>{day.label}</Text>
            </View>;
          })}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Goals</Text>
        <Pressable accessibilityRole="button" onPress={()=>void saveInsightGoals()} style={styles.sectionLink}><Text style={{color:p.sage,fontWeight:'600'}}>Save</Text></Pressable>
      </View>
      <View style={styles.insightGoalGrid}>
        <InsightGoalCard title="Finish works" value={summary.completedGoal.value} target={summary.completedGoal.target} progress={summary.completedGoal.progress} draft={goalDraft.completed} onDraft={value=>setGoalDraft(current=>({...current,completed:value}))}/>
        <InsightGoalCard title="Capture ideas" value={summary.annotationGoal.value} target={summary.annotationGoal.target} progress={summary.annotationGoal.progress} draft={goalDraft.annotations} onDraft={value=>setGoalDraft(current=>({...current,annotations:value}))}/>
      </View>

      <Text style={[styles.sectionTitle,{color:p.ink,marginTop:4}]}>Recent activity</Text>
      <View>
        {summary.recentActivity.length?summary.recentActivity.slice(0,12).map(item=><View key={item.id} style={[styles.insightActivityRow,{borderColor:p.line}]}>
          <View style={[styles.activityMarker,{backgroundColor:p.sage}]}/>
          <View style={{flex:1,minWidth:0}}>
            <Text numberOfLines={1} style={[styles.bookTitle,{color:p.ink}]}>{item.title}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{item.kind} · {new Date(item.updatedAt*1000).toLocaleDateString()} · {item.events} update{item.events===1?'':'s'}</Text>
          </View>
          {item.kind==='Listening'&&item.activeSeconds>0?<Text style={[styles.meta,{color:p.sage,fontWeight:'600'}]}>{Math.max(1,Math.round(item.activeSeconds/60))}m</Text>:null}
        </View>):<Text style={[styles.empty,{color:p.muted}]}>{session&&sourceFilter!=='local'&&sourceFilter!=='downloaded'?'Activity will appear as you read and listen.':'Local history stays private on this device; current progress and notes are shown below.'}</Text>}
      </View>

      <Text style={[styles.sectionTitle,{color:p.ink}]}>Annotation hub</Text>
      <View>
        {summary.recentAnnotations.length?summary.recentAnnotations.slice(0,12).map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>item.work&&openUnifiedWork(item.work as UnifiedWork)} style={[styles.annotationHubCard,{borderBottomColor:p.line}]}>
          <View style={styles.profileBreakdownRow}><Text style={[styles.playerEyebrow,{color:p.sage}]}>{item.kind.toUpperCase()} · PAGE {item.page+1}</Text><Text style={[styles.meta,{color:p.muted}]}>{new Date(item.createdAt).toLocaleDateString()}</Text></View>
          <Text numberOfLines={3} style={[styles.readerQuote,{color:p.ink,borderColor:p.sage}]}>{item.text}</Text>
          {item.note?<Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{item.note}</Text>:null}
          <Text numberOfLines={1} style={[styles.meta,{color:p.sage,fontWeight:'600'}]}>{item.work?.title||'Saved annotation'}</Text>
        </Pressable>):<Text style={[styles.empty,{color:p.muted}]}>Highlights and notes from the Reader will collect here automatically.</Text>}
      </View>

      <Text style={[styles.sectionTitle,{color:p.ink}]}>Achievements</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insightAchievementStrip}>
        {profileAchievements.slice(0,8).map(item=><View key={item.id} style={styles.insightAchievementEditorial}>
          <View style={[styles.insightAchievementBadge,{borderColor:item.unlocked?p.gold:p.line,backgroundColor:'transparent'}]}>
            <Text style={[styles.insightAchievementMonogram,{color:item.unlocked?p.gold:p.muted}]}>{item.title.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink,textAlign:'center'}]}>{item.title}</Text>
          <Text style={[styles.meta,{color:item.unlocked?p.gold:p.muted,textAlign:'center'}]}>{item.unlocked?'Earned':item.progress+' / '+item.target}</Text>
        </View>)}
      </ScrollView>
    </ScrollView>;
  }

  function Profile() {
    const stats=profileStats;
    const unlocked=profileAchievements.filter(item=>item.unlocked).length;
    const metrics=stats?[
      ['Works',stats.works],
      ['In progress',stats.inProgress],
      ['Completed',stats.completed],
      ['Favourites',stats.favourites||0],
      ['Rated',stats.rated||0],
      ['Achievements',unlocked],
    ]:[];
    return (
      <ScrollView contentContainerStyle={styles.profileScreen}>
        <View style={styles.profileHero}>
          <View style={[styles.profileMonogram,{backgroundColor:p.ink}]}>
            <Text style={[styles.profileMonogramText,{color:p.paper}]}>{(stats?.name||'A').trim().charAt(0).toUpperCase()||'A'}</Text>
          </View>
          <View style={{flex:1,gap:3}}>
            <Text style={[styles.title,{color:p.ink,marginBottom:0}]}>{stats?.name||'Profile'}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{session?(stats?.owner?'Admin':'User'):'Local library on this device'}</Text>
          </View>
        </View>

        {profileLoading&&session?<ActivityIndicator accessibilityLabel="Loading profile statistics" color={p.sage}/>:null}
        {!stats&&!profileLoading?<Text style={[styles.empty,{color:p.muted}]}>Profile statistics are unavailable.</Text>:null}

        {stats?<>
          <View style={[styles.profileMetricStrip,{borderTopColor:p.line,borderBottomColor:p.line}]}>
            {metrics.map(([label,value])=><View key={String(label)} style={[styles.profileMetric,width>=760&&styles.profileMetricWide]}>
              <Text style={[styles.profileMetricValue,{color:p.ink}]}>{value}</Text>
              <Text style={[styles.profileMetricLabel,{color:p.muted}]}>{label}</Text>
            </View>)}
          </View>

          <Text style={[styles.sectionTitle,{color:p.ink,marginTop:2}]}>Your library</Text>
          {(stats.rated||0)>0?<View style={[styles.profileDetailRow,{borderBottomColor:p.line}]}>
            <Text style={[styles.bookTitle,{color:p.ink}]}>Ratings</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{ratingLabel(stats.averageRating||0)} average · {stats.favourites||0} favourite{(stats.favourites||0)===1?'':'s'}</Text>
          </View>:null}
          <View style={[styles.profileDetailRow,{borderBottomColor:p.line}]}>
            <Text style={[styles.bookTitle,{color:p.ink}]}>Listening</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{stats.completedAudio} finished · {stats.inProgressAudio} in progress</Text>
          </View>
          <View style={[styles.profileDetailRow,{borderBottomColor:p.line}]}>
            <Text style={[styles.bookTitle,{color:p.ink}]}>Reading</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{stats.completedReading} finished · {stats.inProgressReading} in progress</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Achievements</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{unlocked} of {profileAchievements.length}</Text>
          </View>
          <View style={styles.profileAchievementList}>
            {profileAchievements.map(item=>{
              const ratio=clampProgress(item.progress,item.target);
              return <View key={item.id} style={[styles.profileAchievementRow,{borderBottomColor:p.line}]}>
                <View style={[styles.profileAchievementBadge,{borderColor:item.unlocked?p.gold:p.line}]}>
                  <Text style={[styles.profileAchievementInitial,{color:item.unlocked?p.gold:p.muted}]}>{item.title.trim().charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{flex:1,gap:3}}>
                  <View style={styles.profileBreakdownRow}>
                    <Text style={[styles.bookTitle,{color:p.ink}]}>{item.title}</Text>
                    <Text style={[styles.meta,{color:item.unlocked?p.gold:p.muted}]}>{item.unlocked?'Earned':item.progress+' / '+item.target}</Text>
                  </View>
                  <Text style={[styles.meta,{color:p.muted}]}>{item.description}</Text>
                  <View style={[styles.achievementTrack,{backgroundColor:p.line}]}>
                    <View style={[styles.achievementFill,{backgroundColor:item.unlocked?p.gold:p.sage,width:(Math.round(ratio*100)+'%') as any}]} />
                  </View>
                </View>
              </View>;
            })}
          </View>
        </>:null}
      </ScrollView>
    );
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
      <View style={[styles.duplicatePanel,{backgroundColor:p.card,borderColor:p.line}]}>
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
      <View style={[styles.setupPanel,{backgroundColor:p.card,borderColor:p.line}]}>
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

  function OfflineDownloadsPanel(){
    const completed=Object.values(offlineWorks).sort((a,b)=>b.downloadedAt.localeCompare(a.downloadedAt));
    const partial=Object.values(offlineCheckpoints).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    const used=offlineStorage?.actualBytes ?? completed.reduce((sum,item)=>sum+Math.max(0,item.bytes||0),0);
    const capacity=offlineStorage?.capacityBytes || 0;
    const free=offlineStorage?.freeBytes || 0;
    return <View style={{gap:10}}>
      <Text style={[styles.sectionTitle,{color:p.ink}]}>Offline downloads</Text>
      <View style={[styles.offlineSummary,{backgroundColor:p.card,borderColor:p.line}]}>
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

  function Settings() {
    const connected=!!session;
    return (
      <ScrollView contentContainerStyle={styles.settingsScreen}>
        <View style={styles.pageHeadingRow}>
          <View style={{flex:1}}>
            <Text style={[styles.title,{color:p.ink}]}>Settings</Text>
            <Text style={[styles.pageSubtitle,{color:p.muted}]}>Your app, library and optional server.</Text>
          </View>
        </View>

        <View style={[styles.settingsColumns,width>=760&&styles.settingsColumnsWide]}>
          <View style={styles.settingsColumn}>
            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>APPEARANCE</Text>
              <View style={styles.settingsRow}>
                <View style={{flex:1}}>
                  <Text style={[styles.bookTitle,{color:p.ink}]}>Theme</Text>
                  <Text style={[styles.meta,{color:p.muted}]}>Follow the device or choose a fixed appearance.</Text>
                </View>
              </View>
              <View style={styles.segment}>
                {(['system','light','dark'] as ThemeMode[]).map(mode=>(
                  <Pressable key={mode} accessibilityRole="button" accessibilityState={{selected:theme===mode}} onPress={()=>void chooseTheme(mode)} style={[styles.segmentItem,{backgroundColor:theme===mode?p.card:'transparent'}]}>
                    <Text style={{color:theme===mode?p.sage:p.muted,fontWeight:theme===mode?'700':'500'}}>{mode[0].toUpperCase()+mode.slice(1)}</Text>
                    <View pointerEvents="none" style={[styles.segmentMarker,{backgroundColor:p.sage,opacity:theme===mode?1:0}]}/>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>LIBRARY HEALTH</Text>
              <View style={styles.settingsRow}>
                <View style={{flex:1}}>
                  <Text style={[styles.bookTitle,{color:p.ink}]}>Duplicate review</Text>
                  <Text style={[styles.meta,{color:p.muted}]}>Find possible copies without deleting or changing files.</Text>
                </View>
                {(!session||owner)?<Pressable accessibilityRole="button" onPress={()=>void openDuplicateReview()} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'600'}}>Review</Text></Pressable>:null}
              </View>
              <DuplicateReviewPanel/>
            </View>

            <LocalSortingPanel/>
            <OfflineDownloadsPanel/>
          </View>

          <View style={styles.settingsColumn}>
            <View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>SERVER</Text>
              <View style={styles.settingsRow}>
                <View style={[styles.settingsStatusDot,{backgroundColor:connected?p.sage:recoverableSession?p.danger:p.line}]}/>
                <View style={{flex:1,minWidth:0}}>
                  <Text style={[styles.bookTitle,{color:p.ink}]}>{connected?'Connected':recoverableSession?'Server offline':'No server connected'}</Text>
                  <Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{connected?session?.server:recoverableSession?.server||'Archivist works fully with the library on this device.'}</Text>
                </View>
              </View>

              {recoverableSession&&!session?<View style={styles.settingsInlineActions}>
                <Pressable accessibilityRole="button" onPress={()=>void retrySavedServer()} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'600'}}>{busy?'Retrying…':'Retry server'}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={()=>void forgetSavedServer()} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.muted,fontWeight:'600'}}>Forget</Text></Pressable>
              </View>:null}

              {!session&&!recoverableSession?(serverPanelOpen?<ServerConnect/>:<Pressable accessibilityRole="button" onPress={()=>setServerPanelOpen(true)} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'600'}}>Add server</Text></Pressable>):null}
            </View>

            {owner?<View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>FAMILY USERS</Text>
              <Text style={[styles.meta,{color:p.muted}]}>Users can browse, read, listen, rate, favourite and download. Only Admin can manage files, metadata, users or server settings.</Text>
              <View style={styles.settingsAddRow}>
                <TextInput accessibilityLabel="New user name" value={newUserName} onChangeText={setNewUserName} placeholder="Name" placeholderTextColor={p.muted} style={[styles.settingsInlineInput,{color:p.ink,backgroundColor:p.card}]}/>
                <Pressable accessibilityRole="button" disabled={busy||!newUserName.trim()} onPress={()=>void createFamilyUser()} style={[styles.settingsAddButton,{opacity:busy||!newUserName.trim()?.38:1}]}><Text style={{color:p.sage,fontWeight:'600'}}>{busy?'Creating…':'Add user'}</Text></Pressable>
              </View>

              {newUserKey?<View style={[styles.settingsKeyReveal,{backgroundColor:p.card}]}>
                <Text style={[styles.bookTitle,{color:p.ink}]}>User access key — shown once</Text>
                <Text selectable style={[styles.settingsKeyText,{color:p.sage}]}>{newUserKey}</Text>
                <Pressable accessibilityRole="button" onPress={()=>setNewUserKey('')} style={styles.settingsTextAction}><Text style={{color:p.muted,fontWeight:'600'}}>Hide key</Text></Pressable>
              </View>:null}

              {householdUsers.map(user=><View key={user.id} style={[styles.settingsListRow,{borderBottomColor:p.line}]}>
                <View style={{flex:1}}>
                  <Text style={[styles.bookTitle,{color:p.ink}]}>{user.name}</Text>
                  <Text style={[styles.meta,{color:p.muted}]}>{user.revoked?'Revoked':'User · whole library'}</Text>
                </View>
                {!user.revoked?<Pressable accessibilityRole="button" onPress={()=>void revokeFamilyUser(user.id)} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.danger,fontWeight:'600'}}>Revoke</Text></Pressable>:null}
              </View>)}
            </View>:null}

            {owner?<View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>SOURCE FOLDERS</Text>
              {sources.map(s=><View key={s.id} style={[styles.settingsListRow,{borderBottomColor:p.line}]}>
                <View style={{flex:1,minWidth:0}}>
                  <Text style={[styles.bookTitle,{color:p.ink}]}>{s.space}</Text>
                  <Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{s.path}</Text>
                  <Text style={[styles.meta,{color:s.status==='ok'?p.sage:p.muted}]}>{s.status}</Text>
                </View>
                <View style={styles.settingsRowActions}>
                  <Pressable accessibilityRole="button" onPress={()=>void sourceAction('/api/sources/'+s.id+'/scan')} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'600'}}>Scan</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={()=>void removeSource(s.id)} disabled={busy} style={styles.settingsTextAction}><Text style={{color:p.danger,fontWeight:'600'}}>Remove</Text></Pressable>
                </View>
              </View>)}
              <View style={styles.settingsAddFolder}>
                <TextInput accessibilityLabel="Folder on server" value={folderPath} onChangeText={setFolderPath} placeholder="/media/books" placeholderTextColor={p.muted} style={[styles.settingsInlineInput,{color:p.ink,backgroundColor:p.card}]}/>
                <TextInput accessibilityLabel="Library space" value={folderSpace} onChangeText={setFolderSpace} placeholder="Space" placeholderTextColor={p.muted} style={[styles.settingsInlineInput,{color:p.ink,backgroundColor:p.card}]}/>
                <Button label="Add folder" disabled={busy||!folderPath.trim()} onPress={()=>void sourceAction('/api/sources',{path:folderPath,space:folderSpace})}/>
              </View>
            </View>:null}

            {owner?<View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>SAFE FILE SORTING</Text>
              <Text style={[styles.meta,{color:p.muted}]}>Preview first. Archivist verifies data before removing originals; unresolved moves block scans until applied or reviewed.</Text>
              <View style={styles.segment}>
                {[
                  ['author-title','Author / Title'],
                  ['author-series-title','Author / Series / Title'],
                  ['format-author-title','Format / Author / Title'],
                ].map(([id,label])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:sortTemplate===id}} onPress={()=>setSortTemplate(id)} style={[styles.segmentItem,{backgroundColor:sortTemplate===id?p.card:'transparent'}]}><Text style={{color:sortTemplate===id?p.sage:p.muted,textAlign:'center',fontWeight:sortTemplate===id?'700':'500'}}>{label}</Text></Pressable>)}
              </View>
              <View style={styles.settingsInlineActions}>
                <Pressable accessibilityRole="button" disabled={busy||shelfLoading} onPress={()=>void previewLibrary(false)} style={styles.settingsTextAction}><Text style={{color:p.sage,fontWeight:'600'}}>Preview matching</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void previewLibrary(true)} style={styles.settingsTextAction}><Text style={{color:p.muted,fontWeight:'600'}}>Preview all</Text></Pressable>
              </View>
              <Button label="Apply pending safe moves" disabled={busy} onPress={()=>void applySortBatch()}/>
              {moveStatus?<Text style={[styles.meta,{color:p.sage}]}>{moveStatus}</Text>:null}
            </View>:null}

            {session?<View style={[styles.settingsSection,{borderTopColor:p.line}]}>
              <Pressable accessibilityRole="button" onPress={()=>void signOut()} style={styles.settingsDangerRow}><Text style={{color:p.danger,fontWeight:'600'}}>Sign out</Text></Pressable>
            </View>:null}
          </View>
        </View>
      </ScrollView>
    );
  }

  function CurrentTab() {
    if (activeTab === 'shelf') return Shelf();
    if (activeTab === 'library') return Library();
    if (activeTab === 'player') return Player();
    if (activeTab === 'reader') return Reader();
    if (activeTab === 'atlas') return Atlas();
    if (activeTab === 'insights') return Insights();
    if (activeTab === 'profile') return Profile();
    return Settings();
  }

  if (restoring) {
    return (
      <SafeAreaView style={[styles.screen, {backgroundColor: p.paper}]}>
        <ActivityIndicator accessibilityLabel="Restoring session" />
      </SafeAreaView>
    );
  }

  const tabs: Array<{id: Tab; label: string; icon: UiIconName}> = [
    {id:'shelf',label:'Shelf',icon:'shelf'},
    {id:'library',label:'Library',icon:'library'},
    {id:'atlas',label:'Atlas',icon:'atlas'},
    {id:'insights',label:'Insights',icon:'insights'},
  ];

  return (
    <SafeAreaView style={[styles.screen, {backgroundColor: p.paper}]}>
      <View style={styles.appHeader}>
        <Text style={[styles.logoSmall,{color:p.ink}]}>Archivist</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
          <Text style={[styles.headerMeta,{color:p.muted}]}>{sourceCounts.all} works</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={()=>setActiveTab('settings')} style={styles.settingsButton}><UiIcon name="settings" color={p.muted} size={22}/></Pressable>
        </View>
      </View>
      {error ? <View style={[styles.errorBanner,{backgroundColor:p.dangerSoft}]}>
        <Text accessibilityRole="alert" style={[styles.error,{color:p.danger,flex:1}]}>{error}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss error" hitSlop={8} onPress={()=>setError('')} style={styles.errorDismiss}>
          <UiIcon name="close" color={p.danger} size={18}/>
        </Pressable>
      </View> : null}
      <Animated.View style={[styles.tabBody,{
        opacity:tabTransition,
        transform:[{translateY:tabTransition.interpolate({inputRange:[0,1],outputRange:[reduceMotion?0:6,0]})}],
      }]}>
        {CurrentTab()}
      </Animated.View>
      <CelebrationOverlay
        active={celebrating || !!achievementCelebration}
        title={achievementCelebration ? achievementCelebration.title : undefined}
        copy={achievementCelebration ? achievementCelebration.description : undefined}
      />
      <RatingPromptPanel />
      {playing ? (
        <View style={[styles.miniPlayer,{backgroundColor:p.card,borderTopColor:p.line}]}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Open player for '+playing.title} onPress={()=>setActiveTab('player')} style={styles.miniPlayerMain}>
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
      ):null}
      <View style={[styles.tabBar,{backgroundColor:p.paper,borderTopColor:p.line}]}>
        {tabs.map(tab=>{
          const selected=activeTab===tab.id;
          return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{selected}} onPress={()=>setActiveTab(tab.id)} style={styles.tab}>
            <View pointerEvents="none" style={[styles.tabIndicator,{backgroundColor:p.sage,opacity:selected?1:0}]}/>
            <UiIcon name={tab.icon} color={selected?p.sage:p.muted} size={22}/>
            <Text style={[styles.tabText,{color:selected?p.sage:p.muted}]}>{tab.label}</Text>
          </Pressable>;
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><Client /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  login: {flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14},
  logo: {fontFamily: 'serif', fontSize: 46, textAlign: 'center'},
  logoSmall: {fontFamily: 'serif', fontSize: 26},
  tagline: {fontSize: 12, letterSpacing: 4, textAlign: 'center', fontWeight: '700'},
  loginCopy: {fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 8},
  appHeader: {height:56,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  headerMeta: {fontSize:12,fontWeight:'500'},
  headerSettings: {borderWidth:0},
  settingsButton: {width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22},
  content: {paddingHorizontal:18,paddingTop:22,paddingBottom:120,gap:18,maxWidth:1120,width:'100%',alignSelf:'center'},
  setupPanel: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:18,gap:12},
  shelfShell: {flex: 1, flexDirection: 'row'},
  libraryRail: {width:208,borderRightWidth:StyleSheet.hairlineWidth,paddingHorizontal:16,paddingTop:28,paddingBottom:22,gap:8},
  libraryRailTitle: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:1.5,marginBottom:3},
  libraryRailList: {gap:2},
  libraryRailAdd: {minHeight:44,paddingHorizontal:12,justifyContent:'center'},
  libraryChoice: {borderWidth: 0, borderRadius: 999, paddingHorizontal: 13, minHeight: 40, justifyContent: 'center'},
  libraryChoiceVertical: {borderRadius: 10, minHeight: 44},
  libraryChips: {gap: 8, paddingBottom: 2},
  libraryChipsRow: {flexDirection: 'row', gap: 20},
  librarySpaceTab: {minHeight:42,justifyContent:'center',position:'relative',paddingHorizontal:1},
  librarySpaceTabVertical: {minHeight:44,paddingHorizontal:12},
  librarySpaceText: {fontSize:13},
  librarySpaceMarker: {position:'absolute',left:0,right:0,bottom:0,height:2,borderRadius:2},
  librarySpaceMarkerVertical: {position:'absolute',left:0,top:10,bottom:10,width:3,borderRadius:3},
  librarySummary: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,flexDirection:'row',gap:12,alignItems:'center'},
  reviewBanner: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,borderRadius:0,paddingVertical:11,paddingHorizontal:0,flexDirection:'row',gap:12,alignItems:'center'},
  shelfSection: {gap:8},
  continueRow: {gap:12,paddingRight:6},
  continueCard: {width:132,gap:6},
  continueTitle: {fontSize:14,fontWeight:'800'},
  seriesChip: {minWidth:140,maxWidth:220,borderWidth:0,borderRadius:12,paddingHorizontal:14,paddingVertical:12,gap:2},
  scanBanner: {borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12},
  onboardingCard: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:18,gap:14},
  onboardingEyebrow: {fontSize: 11, fontWeight: '900', letterSpacing: 2},
  onboardingStep: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  onboardingNumber: {width: 28, height: 28, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', color: '#f8f7f2', fontWeight: '900', overflow: 'hidden'},
  onboardingStepTitle: {fontSize: 15, fontWeight: '800', marginBottom: 2},
  sourceRow: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:12,gap:4},
  tabBody: {flex: 1},
  title: {fontFamily: 'serif', fontSize: 36, lineHeight: 41, fontWeight: '500', marginBottom: 2, letterSpacing:-0.4},
  sectionTitle: {fontFamily:'sans-serif-medium',fontSize:18,lineHeight:23,fontWeight:'500',marginTop:8,letterSpacing:-0.1},
  input: {paddingHorizontal:14,paddingVertical:12,borderWidth:0,borderRadius:12,fontSize:16},
  button: {backgroundColor: '#47736F', borderRadius: 12, paddingHorizontal: 18, minHeight: 48, justifyContent: 'center', alignItems: 'center'},
  buttonGold: {backgroundColor:'#B99A68'},
  buttonQuiet: {backgroundColor:'transparent',borderWidth:0},
  buttonDanger: {backgroundColor:'transparent',borderWidth:0},
  buttonText: {color:'#FFFFFF',fontSize:15,lineHeight:20,fontWeight:'600'},
  buttonQuietText: {color:'#47736F'},
  buttonDangerText: {color:'#A94F4F'},
  error: {paddingHorizontal: 16, paddingVertical: 8},
  errorBanner: {marginHorizontal:12,marginTop:8,borderWidth:0,borderRadius:12,flexDirection:'row',alignItems:'center'},
  errorDismiss: {width:44,height:44,alignItems:'center',justifyContent:'center'},
  grid: {paddingBottom: 110},
  empty: {fontSize: 15, lineHeight: 22},
  book: {flex: 1, maxWidth: '50%', padding: 8, gap: 7},
  cover: {aspectRatio:2/3,borderRadius:10,overflow:'hidden',shadowColor:'#000',shadowOpacity:.08,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:2},
  coverImage: {position:'absolute',top:0,right:0,bottom:0,left:0,width:'100%',height:'100%'},
  coverSquare: {aspectRatio: 1},
  coverLarge: {width: 230, alignSelf: 'center'},
  coverLargeSquare: {width: 230, height: 230},
  coverFallback: {flex:1,padding:10,justifyContent:'space-between'},
  coverFallbackMark: {fontFamily:'serif',fontSize:20,lineHeight:24,opacity:.5},
  coverFallbackCopy: {gap:4},
  coverFormat: {fontSize:9,lineHeight:12,fontWeight:'700',letterSpacing:1.4},
  coverTitle: {fontFamily:'sans-serif-medium',fontSize:13,lineHeight:17,fontWeight:'500'},
  coverTitleLarge: {fontSize:16,lineHeight:21},
  bookTitle: {fontSize: 14.5, lineHeight:19, fontWeight: '700'},
  reviewPill: {alignSelf:'flex-start', borderWidth:1, borderRadius:999, paddingHorizontal:8, paddingVertical:3},
  editorCard: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:10},
  serverRecovery: {borderWidth:0,borderRadius:14,padding:16,gap:10},
  offlineSummary: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:16,flexDirection:'row',gap:12,alignItems:'center'},
  ratingPromptBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.48)',alignItems:'center',justifyContent:'center',padding:24},
  ratingPromptCard: {width:'100%',maxWidth:420,borderWidth:0,borderRadius:18,padding:20,gap:10},
  modalKeyboard: {flex:1},
  modalBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.48)',alignItems:'center',justifyContent:'center',padding:20},
  modalScroll: {flexGrow:1,width:'100%',alignItems:'center',justifyContent:'center',paddingVertical:20},
  modalCard: {width:'100%',maxWidth:520,borderWidth:0,borderRadius:18,padding:20,gap:10},
  meta: {fontSize: 13, lineHeight: 19},
  playerScreen: {paddingHorizontal:18,paddingTop:16,gap:18,paddingBottom:120,maxWidth:1120,width:'100%',alignSelf:'center'},
  playerScreenFold: {paddingHorizontal:24,paddingTop:16,gap:18},
  livingBookStage: {height:360,width:420,maxWidth:'100%',alignSelf:'center',alignItems:'center',justifyContent:'center',position:'relative'},
  livingBookShadow: {position:'absolute',width:342,height:42,borderRadius:171,top:282,transform:[{scaleY:.32}],shadowColor:'#000',shadowOpacity:.20,shadowRadius:28,elevation:5},
  livingBookSpread: {width:330,height:246,position:'relative'},
  livingBookStaticPage: {position:'absolute',top:2,width:163,height:240,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:18,paddingTop:22,gap:10,overflow:'hidden'},
  livingBookLeftPage: {left:2,borderTopLeftRadius:14,borderBottomLeftRadius:14,borderTopRightRadius:3,borderBottomRightRadius:3,alignItems:'center'},
  livingBookRightPage: {left:165,borderTopRightRadius:14,borderBottomRightRadius:14,borderTopLeftRadius:3,borderBottomLeftRadius:3},
  livingBookInnerSpine: {position:'absolute',right:0,top:8,bottom:8,width:3,borderRadius:2},
  livingBookPageLine: {height:3,borderRadius:3,opacity:.8},
  livingBookTurningPage: {position:'absolute',left:165,top:2,width:163,height:240,borderWidth:StyleSheet.hairlineWidth,borderTopRightRadius:14,borderBottomRightRadius:14,paddingHorizontal:20,paddingTop:36,gap:15,zIndex:4,backfaceVisibility:'hidden'},
  livingBookFrontCover: {position:'absolute',left:165,top:0,width:163,zIndex:7,shadowColor:'#000',shadowOpacity:.22,shadowRadius:22,shadowOffset:{width:0,height:11},elevation:9,backfaceVisibility:'hidden'},
  livingBookCoverArt: {width:163,overflow:'hidden',borderRadius:10},
  livingBookCentreLine: {position:'absolute',left:163,top:8,bottom:8,width:2,zIndex:8,opacity:.72},
  livingBookInsetArt: {width:104,marginTop:2,shadowColor:'#000',shadowOpacity:.12,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:2},
  livingBookPageCaption: {fontSize:8,lineHeight:11,fontWeight:'700',letterSpacing:1.2,marginTop:1},
  livingBookPageKicker: {fontSize:7,lineHeight:10,fontWeight:'700',letterSpacing:1.35,marginTop:10},
  livingBookPageTitle: {fontFamily:'serif',fontSize:18,lineHeight:21,fontWeight:'500',textAlign:'center',marginTop:3},
  livingBookPageRule: {height:1,width:42,alignSelf:'center',marginVertical:2},
  livingBookPageAuthor: {fontSize:9,lineHeight:13,textAlign:'center'},
  livingBookPageQuote: {fontFamily:'serif',fontSize:12,lineHeight:17,fontStyle:'italic',textAlign:'center',marginTop:6},
  livingBookPageNumber: {position:'absolute',bottom:10,alignSelf:'center',fontSize:7,lineHeight:10,fontWeight:'600',letterSpacing:.8},
  playerHeading: {minHeight:34,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  playerAdaptive: {gap:22},
  playerAdaptiveWide: {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:36,paddingVertical:4},
  playerHeroColumn: {gap:10,alignItems:'center',flexShrink:1,maxWidth:420},
  playerControlColumn: {flex:1,minWidth:260,maxWidth:520,gap:14,justifyContent:'center'},
  playerEyebrow: {fontSize:11,lineHeight:14,fontWeight:'700',letterSpacing:1.6},
  playerArtworkFrame: {alignSelf:'center',borderWidth:0,borderRadius:18,padding:0,shadowColor:'#000',shadowOpacity:0.14,shadowRadius:22,shadowOffset:{width:0,height:10},elevation:5},
  playerIdentity: {alignItems:'center',gap:5,paddingHorizontal:10},
  playerStatusRow: {flexDirection:'row',flexWrap:'wrap',justifyContent:'center',alignItems:'center',gap:12,minHeight:28},
  playerSourcePill: {borderWidth:0,minHeight:28,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},
  playerStatusText: {fontSize:11,lineHeight:16},
  playerStatusAction: {minHeight:36,justifyContent:'center',paddingHorizontal:2},
  nowTitle: {fontFamily:'sans-serif-medium',fontSize:25,lineHeight:30,fontWeight:'500',textAlign:'center',marginTop:0,letterSpacing:-.2,maxWidth:620},
  nowTitleCompact: {fontSize:22,lineHeight:27},
  nowTitleFold: {fontSize:24,lineHeight:29},
  playerByline: {fontSize:14,lineHeight:20,textAlign:'center'},
  playerChapter: {fontSize:13,fontWeight:'800',textAlign:'center',marginTop:3},
  progressHitArea: {paddingVertical:10},
  progressTrack: {height:4,borderRadius:999,overflow:'hidden'},
  progressFill: {height:4,borderRadius:999},
  timeRow: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:-6},
  playerTime: {fontSize:12,fontVariant:['tabular-nums'],fontWeight:'500'},
  transport: {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:34,marginVertical:12},
  skipButton: {width:58,height:58,borderRadius:29,borderWidth:0,alignItems:'center',justifyContent:'center',position:'relative'},
  skipNumber: {position:'absolute',fontSize:9,lineHeight:11,fontWeight:'700',fontVariant:['tabular-nums']},
  skipMain: {fontSize:17,fontWeight:'900',lineHeight:19},
  skipMeta: {fontSize:10,fontWeight:'700',textTransform:'uppercase'},
  playButton: {width:80,height:80,borderRadius:40,alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.17,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:5},
  playButtonGlyph: {color:'#f8f7f2',fontSize:24,fontWeight:'900',lineHeight:28},
  playButtonCaption: {color:'#f8f7f2',fontSize:10,fontWeight:'800',textTransform:'uppercase',letterSpacing:0.6},
  playButtonText: {color: '#f8f7f2', fontSize: 17, fontWeight: '800'},
  playerTools: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',justifyContent:'space-between',gap:2,paddingVertical:9},
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
  queueIconButton: {width:38,height:38,alignItems:'center',justifyContent:'center'},
  iconButton: {width:38,height:38,alignItems:'center',justifyContent:'center',borderRadius:19},
  structureRow: {borderBottomWidth:StyleSheet.hairlineWidth,minHeight:50,flexDirection:'row',alignItems:'center',gap:8,paddingVertical:6},
  structureChapter: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,gap:8},
  boundaryRow: {flexDirection:'row',gap:12,flexWrap:'wrap'},
  playerEmpty: {borderWidth:0,padding:32,gap:10,alignItems:'center',justifyContent:'center',minHeight:260,maxWidth:420,alignSelf:'center'},
  toolRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between'},
  readerScreen: {flex:1,position:'relative'},
  readerBar: {minHeight:48,flexDirection:'row',alignItems:'center',paddingHorizontal:2},
  readerToolsButton: {width:46,minHeight:46,alignItems:'center',justifyContent:'center'},
  searchRow:{flexDirection:'row',alignItems:'center',gap:6},
  filterPill:{borderWidth:0,borderRadius:10,minHeight:38,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},
  readerSheetHeader: {flexDirection:'row',alignItems:'center',gap:12,paddingBottom:8},
  readerSheetClose: {width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  readerSearchInput: {flex:1,minHeight:44,borderWidth:0,borderRadius:11,paddingHorizontal:14,fontSize:15},
  readerSearchButton: {width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  readerToolBlock: {gap:10,paddingVertical:15,borderTopWidth:StyleSheet.hairlineWidth},
  readerAppearanceHeader: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  readerScaleControl: {flexDirection:'row',alignItems:'center',gap:6},
  readerScaleButton: {width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'},
  readerScaleValue: {minWidth:48,textAlign:'center',fontSize:13,fontVariant:['tabular-nums'],fontWeight:'600'},
  readerThemeTabs: {flexDirection:'row',gap:4},
  readerThemeTab: {flex:1,minHeight:42,borderRadius:10,alignItems:'center',justifyContent:'center',position:'relative'},
  readerThemeMarker: {position:'absolute',left:14,right:14,bottom:3,height:2,borderRadius:2},
  readerToolSectionHeader: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  readerBookmarkAction: {minHeight:40,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:4},
  readerSavedAction: {minHeight:38,paddingHorizontal:5,alignItems:'center',justifyContent:'center'},
  readerSavedRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:12},
  readerQuote: {borderLeftWidth:3,paddingLeft:10,fontStyle:'italic',lineHeight:20},
  readerBack: {width:48,minHeight:48,alignItems:'center',justifyContent:'center'},
  readerAction: {fontWeight:'600'},
  readerToolGlyph: {fontFamily:'serif',fontSize:18,fontWeight:'500'},
  readerHeading: {flex:1,alignItems:'center',justifyContent:'center',minWidth:0},
  readerTitle: {width:'100%',textAlign:'center',fontSize:13,fontWeight:'600'},
  readerFormat: {fontSize:9,fontWeight:'600',letterSpacing:1,textTransform:'uppercase',marginTop:1},
  readerLoading: {flex:1,alignItems:'center',justifyContent:'center',gap:10,padding:24},
  readerEmpty: {flex:1,alignItems:'center',justifyContent:'center',gap:10,padding:32,maxWidth:420,width:'100%',alignSelf:'center'},
  readerFailure: {margin:28,borderWidth:0,padding:22,gap:12,maxWidth:520,alignSelf:'center'},
  readerOverlay: {position:'absolute',top:48,left:0,right:0,bottom:0,zIndex:20,alignItems:'center',justifyContent:'center',gap:10,opacity:.96},
  readerErrorOverlay: {position:'absolute',left:24,right:24,top:78,zIndex:30,borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:18,gap:12},
  atlasGroup: {borderWidth: 1, borderRadius: 8, padding: 12, gap: 10},
  atlasRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36},
  atlasText: {fontWeight: '700'},
  atlasBarTrack: {flex: 1, height: 8, borderRadius: 999, overflow: 'hidden'},
  atlasBarFill: {height: 8, borderRadius: 999},
  segment: {flexDirection:'row',gap:4},
  segmentItem: {flex:1,borderWidth:0,borderRadius:10,minHeight:44,paddingHorizontal:10,alignItems:'center',justifyContent:'center',position:'relative'},
  segmentMarker: {position:'absolute',left:12,right:12,bottom:3,height:2,borderRadius:2},
  miniPlayer: {minHeight:64,marginHorizontal:12,marginBottom:8,borderRadius:14,borderTopWidth:StyleSheet.hairlineWidth,padding:8,flexDirection:'row',alignItems:'center',gap:10,shadowColor:'#000',shadowOpacity:.06,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:2},
  miniPlayerMain: {flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:10,padding:2},
  miniCover: {width:42,height:42,borderRadius:6,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  miniCoverImage: {position:'absolute',top:0,right:0,bottom:0,left:0,width:'100%',height:'100%'},
  miniCoverLabel: {color:'#FFFFFF',fontSize:8,fontWeight:'700',letterSpacing:.7},
  miniTitle: {fontSize:13,fontWeight:'600'},
  miniMeta: {fontSize:11},
  miniButton: {width:44,height:44,borderRadius:22,borderWidth:0,alignItems:'center',justifyContent:'center'},
  miniButtonText: {fontWeight:'600'},
  tabBar: {height:68,borderTopWidth:StyleSheet.hairlineWidth,flexDirection:'row'},
  tab: {flex:1,alignItems:'center',justifyContent:'center',gap:3,position:'relative'},
  tabIndicator: {position:'absolute',top:0,width:20,height:2,borderRadius:2},
  tabText: {fontSize:10,lineHeight:13,fontWeight:'600'},
  celebration: {position:'absolute', left:0, right:0, top:0, bottom:0, alignItems:'center', justifyContent:'center', zIndex:50},
  celebrationParticle: {position:'absolute', fontSize:28, color:'#c6a374', fontWeight:'900'},
  celebrationBadge: {backgroundColor:'#0f2a36', borderRadius:18, paddingHorizontal:20, paddingVertical:16, alignItems:'center', shadowColor:'#000', shadowOpacity:0.22, shadowRadius:14, elevation:10},
  celebrationTitle: {color:'#f8f7f2', fontSize:20, fontWeight:'900'},
  celebrationCopy: {color:'#c8d4d2', fontSize:13, marginTop:3},
  profileScreen: {paddingHorizontal:18,paddingTop:22,paddingBottom:120,gap:26,maxWidth:920,width:'100%',alignSelf:'center'},
  settingsScreen: {paddingHorizontal:18,paddingTop:22,paddingBottom:120,gap:24,maxWidth:1180,width:'100%',alignSelf:'center'},
  settingsColumns: {gap:24},
  settingsColumnsWide: {flexDirection:'row',alignItems:'flex-start',gap:40},
  settingsColumn: {flex:1,minWidth:0,gap:24},
  settingsSection: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:16,gap:12},
  settingsSectionTitle: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:1.5},
  settingsRow: {minHeight:50,flexDirection:'row',alignItems:'center',gap:12},
  settingsStatusDot: {width:8,height:8,borderRadius:4},
  settingsTextAction: {minHeight:40,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},
  settingsInlineActions: {flexDirection:'row',alignItems:'center',gap:18,flexWrap:'wrap'},
  settingsAddRow: {flexDirection:'row',alignItems:'center',gap:8},
  settingsInlineInput: {flex:1,minHeight:44,borderWidth:0,borderRadius:11,paddingHorizontal:13,fontSize:15},
  settingsAddButton: {minHeight:44,paddingHorizontal:6,alignItems:'center',justifyContent:'center'},
  settingsKeyReveal: {borderRadius:12,padding:14,gap:8},
  settingsKeyText: {fontSize:13,lineHeight:18,fontWeight:'600'},
  settingsListRow: {borderBottomWidth:StyleSheet.hairlineWidth,minHeight:58,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:12},
  settingsRowActions: {flexDirection:'row',alignItems:'center',gap:10},
  settingsAddFolder: {gap:8},
  settingsDangerRow: {minHeight:44,alignItems:'flex-start',justifyContent:'center'},
  profileHero: {borderWidth:0,paddingVertical:6,flexDirection:'row',alignItems:'center',gap:16},
  profileMonogram: {width:58,height:58,borderRadius:29,alignItems:'center',justifyContent:'center'},
  profileMonogramText: {fontFamily:'serif',fontSize:28,fontWeight:'500'},
  profileMetricStrip: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',flexWrap:'wrap',paddingVertical:18,rowGap:18},
  profileMetric: {width:'33.333%',minWidth:105,gap:2},
  profileMetricWide: {width:'16.666%',minWidth:90},
  profileMetricValue: {fontFamily:'serif',fontSize:27,lineHeight:31,fontWeight:'500'},
  profileMetricLabel: {fontSize:12,lineHeight:17,fontWeight:'500'},
  profileDetailRow: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:16},
  profileBreakdownRow: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},
  profileDivider: {height:StyleSheet.hairlineWidth},
  profileAchievementList: {gap:0},
  profileAchievementRow: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,flexDirection:'row',alignItems:'center',gap:14},
  profileAchievementBadge: {width:50,height:50,borderRadius:25,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  profileAchievementInitial: {fontFamily:'serif',fontSize:21,fontWeight:'500'},
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
  atlasSearchRow: {flexDirection:'row',alignItems:'center',gap:6},
  atlasSearchInput: {flex:1,minHeight:44,borderWidth:0,borderRadius:11,paddingHorizontal:14,fontSize:15},
  atlasSearchButton: {width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  atlasUniverseLayout: {position:'relative',gap:0},
  atlasUniverseLayoutWide: {flexDirection:'row',alignItems:'stretch'},
  atlasViewport: {flex:1,borderWidth:0,borderRadius:0,overflow:'hidden',position:'relative',minWidth:0},
  atlasUniverseCanvas: {position:'absolute'},
  atlasUniverseEdge: {position:'absolute',height:1},
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
  atlasNodeMonogram: {fontFamily:'serif',fontSize:16,fontWeight:'900'},
  atlasNodeCount: {fontSize:10,fontWeight:'900',marginTop:2},
  atlasNodeSourceDot: {position:'absolute',right:4,bottom:4,width:8,height:8,borderRadius:4,borderWidth:1,borderColor:'#f8f7f2'},
  atlasViewportTools: {position:'absolute',right:12,top:12,zIndex:20,flexDirection:'row',gap:6},
  atlasZoomButton: {borderWidth:0},
  atlasToolButton: {minHeight:38,paddingHorizontal:12,borderRadius:10,alignItems:'center',justifyContent:'center'},
  atlasFindButton: {height:46,paddingHorizontal:16,borderRadius:12,alignItems:'center',justifyContent:'center'},
  atlasFindText: {color:'#FFFFFF',fontSize:14,fontWeight:'600'},
  atlasClusterNotice: {position:'absolute',left:12,bottom:12,maxWidth:320,borderWidth:0,borderRadius:10,paddingHorizontal:10,paddingVertical:7},
  atlasInspector: {borderWidth:0,padding:16,gap:8,zIndex:25},
  atlasInspectorMobile: {position:'absolute',left:12,right:12,bottom:12,borderTopLeftRadius:20,borderTopRightRadius:20,shadowColor:'#000',shadowOpacity:.10,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:5},
  atlasInspectorWide: {width:280,minHeight:220,alignSelf:'stretch',borderLeftWidth:StyleSheet.hairlineWidth,borderRadius:0,paddingHorizontal:20},

  atlasScreen: {paddingHorizontal:18,paddingTop:22,paddingBottom:120,gap:20,maxWidth:1280,width:'100%',alignSelf:'center'},
  atlasListAlternative: {gap:4},
  atlasHint: {fontSize:11,lineHeight:16,textAlign:'center',letterSpacing:.2},
  insightsScreen: {paddingHorizontal:18,paddingTop:22,paddingBottom:120,gap:28,maxWidth:1120,width:'100%',alignSelf:'center'},
  sourceSwitcher: {flexDirection:'row',gap:22,paddingRight:14,minHeight:44,alignItems:'stretch'},
  sourceSwitcherVertical: {gap:2},
  sourceTab: {minHeight:44,justifyContent:'center',position:'relative',paddingHorizontal:1},
  sourceTabVertical: {paddingHorizontal:12,minHeight:46},
  sourceTabText: {fontSize:13},
  sourceTabCount: {fontSize:11,fontWeight:'600'},
  sourceTabMarker: {position:'absolute',left:0,right:0,bottom:1,height:2,borderRadius:2},
  sourceTabMarkerVertical: {position:'absolute',left:0,top:10,bottom:10,width:3,borderRadius:3},
  shelfContent: {paddingHorizontal:18,paddingTop:20,paddingBottom:120,gap:32,maxWidth:1280,width:'100%',alignSelf:'center'},
  shelfContentFold: {paddingHorizontal:24,paddingTop:22,gap:34},
  shelfEditorialHeader: {flexDirection:'row',alignItems:'flex-start',gap:16,paddingTop:2,paddingBottom:0},
  shelfEditorialHeaderFold: {paddingTop:0},
  shelfKicker: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:2.2,marginBottom:7},
  shelfGreeting: {fontFamily:'serif',fontSize:34,lineHeight:40,fontWeight:'500',letterSpacing:-.55},
  shelfGreetingCompact: {fontSize:30,lineHeight:36},
  shelfGreetingFold: {fontSize:36,lineHeight:42},
  shelfEditorialSubtitle: {fontFamily:'serif',fontSize:14,lineHeight:20,fontStyle:'italic',marginTop:3,maxWidth:320},
  shelfBrowseBand: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:10},
  shelfBrowseLabel: {fontSize:9,lineHeight:12,fontWeight:'700',letterSpacing:1.8},
  pageHeadingRow: {flexDirection:'row',alignItems:'flex-start',gap:12},
  pageSubtitle: {fontSize:14,lineHeight:21,marginTop:2,fontWeight:'400'},
  headerAction: {borderWidth:0,borderRadius:10,minHeight:44,paddingHorizontal:8,alignItems:'center',justifyContent:'center'},
  sectionHeader: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  sectionLink: {minHeight:44,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},
  curatedRow: {gap:18,paddingRight:24},
  curatedCardWrap: {width:136},
  shelfHero: {borderRadius:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:16,paddingHorizontal:0,flexDirection:'row',gap:16,alignItems:'center',overflow:'hidden',minHeight:168},
  shelfHeroFold: {paddingVertical:18,gap:20,minHeight:184},
  shelfHeroWide: {paddingVertical:20,gap:24,minHeight:198},
  shelfHeroArtwork: {width:104,minWidth:104},
  shelfHeroArtworkFold: {width:120,minWidth:120},
  shelfHeroArtworkWide: {width:132,minWidth:132},
  shelfHeroCopy: {flex:1,minWidth:0,gap:8,paddingVertical:4},
  shelfHeroEyebrow: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:1.4},
  shelfHeroTitle: {fontFamily:'sans-serif-medium',fontSize:24,lineHeight:29,fontWeight:'500',letterSpacing:-.2},
  shelfHeroTitleCompact: {fontSize:21,lineHeight:26},
  shelfHeroTitleFold: {fontSize:25,lineHeight:30},
  shelfHeroAuthor: {fontSize:14,lineHeight:21},
  shelfHeroResume: {fontSize:12,lineHeight:17,fontWeight:'700',letterSpacing:.15},
  shelfHeroFooter: {marginTop:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
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
  smartShelfName: {fontFamily:'serif',fontSize:18,lineHeight:23,fontWeight:'500'},
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
  shelfUtilityRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:18,flexDirection:'row',flexWrap:'wrap',gap:10},
  shelfUtilityAction: {minHeight:44,paddingHorizontal:4,paddingRight:14,justifyContent:'center'},
  brandSignature: {fontSize:10,fontWeight:'700',letterSpacing:3,textAlign:'center',marginTop:8},
  designedEmpty: {borderWidth:0,padding:28,gap:10,alignItems:'center',justifyContent:'center',minHeight:180},
  emptyMark: {fontFamily:'serif',fontSize:34,fontWeight:'800'},
  skeletonRow: {flexDirection:'row',gap:12,overflow:'hidden'},
  skeletonCard: {width:132,height:198,borderRadius:12,opacity:0.45},
  unifiedCard: {flex:1,minWidth:0,gap:7,position:'relative'},
  unifiedCardList: {flexDirection:'row',alignItems:'center',gap:14,paddingVertical:10},
  unifiedCardSelected: {borderWidth:1,borderRadius:12,padding:4},
  unifiedCoverWrap: {position:'relative'},
  unifiedCoverWrapList: {width:68},
  unifiedCardCopy: {gap:3,minWidth:0,paddingHorizontal:1},
  unifiedListMeta: {flexDirection:'row',alignItems:'center',gap:6,marginTop:2},
  workSourceDot: {width:5,height:5,borderRadius:3},
  workSource: {fontSize:11,fontWeight:'500',flexShrink:1},
  workRating: {fontSize:11,fontWeight:'600',marginLeft:'auto'},
  moreButton: {position:'absolute',right:4,top:4,minWidth:36,minHeight:36,borderRadius:18,alignItems:'center',justifyContent:'center',opacity:.78},
  moreButtonList: {right:4,top:4},
  offlineBadge: {position:'absolute',left:7,bottom:7,borderRadius:999,paddingHorizontal:7,paddingVertical:4},
  offlineBadgeText: {color:'#F8F7F2',fontSize:9,fontWeight:'900',letterSpacing:0.8},
  cardPressed: {opacity:0.72},
  actionSheet: {width:'100%',maxWidth:620,borderWidth:0,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,gap:10,alignSelf:'center'},
  sheetBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.52)',justifyContent:'flex-end',padding:12},
  sheetScroll: {flexGrow:1,justifyContent:'flex-end'},
  sheetHandle: {width:42,height:4,borderRadius:999,backgroundColor:'#9aa9a6',alignSelf:'center',marginBottom:6,opacity:0.65},
  manageRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:8},
  visibilityToggle: {width:44,height:28,borderRadius:14,alignItems:'center',justifyContent:'center'},
  orderButton: {width:38,height:38,alignItems:'center',justifyContent:'center'},
  libraryTwoPane: {flex:1,flexDirection:'row'},
  libraryMain: {flex:1,paddingHorizontal:18,paddingTop:18,gap:14},
  libraryMainFold: {paddingHorizontal:24,paddingTop:20,gap:16},
  libraryMainWide: {paddingHorizontal:28,paddingTop:24,gap:18},
  libraryCatalogueHeader: {gap:4,paddingBottom:2},
  libraryKicker: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:2.0},
  libraryTitle: {fontFamily:'sans-serif-medium',fontSize:30,lineHeight:36,fontWeight:'500',letterSpacing:-.4},
  libraryTitleCompact: {fontSize:28,lineHeight:34},
  libraryTitleFold: {fontSize:32,lineHeight:38},
  librarySearchRow: {flexDirection:'row',alignItems:'center',gap:8},
  librarySearchShell: {flex:1,minHeight:46,borderRadius:10,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:13},
  librarySearch: {flex:1,borderWidth:0,minHeight:46,paddingHorizontal:0,fontSize:15},
  libraryUtilityButton: {width:44,height:44,borderRadius:10,alignItems:'center',justifyContent:'center',position:'relative'},
  libraryFilterCount: {position:'absolute',right:3,top:2,minWidth:16,height:16,borderRadius:8,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
  libraryFilterCountText: {color:'#FFFFFF',fontSize:9,fontWeight:'700'},
  libraryFormatTabs: {gap:24,paddingRight:18,minHeight:40,alignItems:'stretch'},
  libraryFormatTab: {minHeight:40,justifyContent:'center',position:'relative'},
  libraryFormatText: {fontSize:13,lineHeight:18},
  libraryFormatMarker: {position:'absolute',left:0,right:0,bottom:1,height:2,borderRadius:2},
  libraryToolbar: {flexDirection:'row',alignItems:'center',gap:8},
  quickFilters: {gap:4,paddingRight:8},
  quickFilter: {borderWidth:0,borderRadius:10,minHeight:40,paddingHorizontal:10,alignItems:'center',justifyContent:'center'},
  toolbarButton: {borderWidth:0,borderRadius:10,minHeight:40,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},
  librarySelectionBar: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,minHeight:52,flexDirection:'row',alignItems:'center',gap:8,paddingVertical:6},
  librarySelectionAction: {minHeight:40,paddingHorizontal:6,alignItems:'center',justifyContent:'center'},
  unifiedGrid: {paddingBottom:120,gap:18,paddingTop:4},
  unifiedGridRow: {gap:12},
  unifiedList: {paddingBottom:120,gap:4},
  selectionToolbar: {borderWidth:1,borderRadius:14,padding:10,flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'},
  selectionCount: {fontSize:13,fontWeight:'900'},
  reviewQueue: {gap:10,paddingBottom:10},
  filterLabel: {fontSize:10,fontWeight:'900',letterSpacing:1.4,marginTop:6},
  filterWrap: {flexDirection:'row',flexWrap:'wrap',gap:7},
  filterChip: {borderWidth:0,borderRadius:9,minHeight:38,paddingHorizontal:11,alignItems:'center',justifyContent:'center'},
  duplicatePanel: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:12},
  duplicateGroup: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:12,gap:7},
  duplicateExact: {borderWidth:0,borderLeftWidth:2,paddingLeft:10,paddingVertical:6,gap:4},
  ruleGroup: {borderWidth:0,borderLeftWidth:2,paddingLeft:12,paddingVertical:8,gap:8},
  ruleRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:8,flexDirection:'row',flexWrap:'wrap',gap:6,alignItems:'center'},
  ruleToken: {borderWidth:0,borderRadius:8,minHeight:36,paddingHorizontal:9,alignItems:'center',justifyContent:'center'},
  ruleInput: {borderWidth:0,borderRadius:9,minHeight:38,paddingHorizontal:10,flexGrow:1,minWidth:92},
  ruleRemove: {width:34,height:34,alignItems:'center',justifyContent:'center'},
  insightEditorialHero: {paddingVertical:8,gap:8,maxWidth:760},
  insightEditorialKicker: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:1.5},
  insightEditorialTitle: {fontFamily:'serif',fontSize:26,lineHeight:33,fontWeight:'500',letterSpacing:-.2},
  insightStatStrip: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',flexWrap:'wrap',paddingVertical:18,rowGap:18},
  insightStat: {width:'33.333%',minWidth:110,gap:2},
  insightStatWide: {width:'16.666%',minWidth:96},
  insightStatValue: {fontFamily:'serif',fontSize:28,lineHeight:32,fontWeight:'500'},
  insightStatLabel: {fontSize:12,lineHeight:17,fontWeight:'500'},
  insightRhythmSection: {gap:12},
  insightRhythmChart: {height:108,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:8,paddingHorizontal:2},
  insightRhythmDay: {flex:1,height:'100%',alignItems:'center',justifyContent:'flex-end',gap:7},
  insightRhythmBarArea: {height:76,width:'100%',alignItems:'center',justifyContent:'flex-end'},
  insightRhythmBar: {width:12,maxWidth:18,borderRadius:9},
  insightRhythmLabel: {fontSize:10,lineHeight:13,fontWeight:'600'},
  insightGoalGrid: {gap:0},
  insightGoalCard: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:12},
  insightGoalEdit: {flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:8},
  insightGoalInput: {width:62,borderWidth:0,borderRadius:9,minHeight:38,paddingHorizontal:8,textAlign:'center',fontWeight:'600',fontVariant:['tabular-nums']},
  insightActivityRow: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:13,flexDirection:'row',gap:12,alignItems:'center'},
  activityMarker: {width:7,height:7,borderRadius:4},
  annotationHubCard: {borderWidth:0,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:8},
  insightAchievementStrip: {flexDirection:'row',gap:20,paddingRight:18},
  insightAchievementEditorial: {width:116,alignItems:'center',gap:7},
  insightAchievementBadge: {width:64,height:64,borderRadius:32,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  insightAchievementMonogram: {fontFamily:'serif',fontSize:26,fontWeight:'500'},
  insightAchievement: {borderWidth:0,padding:11,minWidth:140,flexGrow:1},

});
