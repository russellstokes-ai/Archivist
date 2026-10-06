import {publicationYear} from './libraryIntelligence';
import {DataRing,genreColour,genreColours,ChartItem} from './LibraryCharts';
import {AmbientGlow,LivingBookCanvas} from './LivingBookCanvas';
import {LivingBookCoverSession,lockLivingBookCoverSession,resolveLivingBookCover} from './livingBookCover';
import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
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
  Vibration,
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
import {deepScanLocalTracks, LocalBook, LocalFolder, LocalMetadataOverride, LocalScanProgress, LocalSortHistory, pickLocalFolder, removeLocalSortCopies, scanLocalFolders} from './localLibrary';
import {LocalWorkSortPreview, applyLocalWorkSortCopies, previewLocalWorkSort} from './localWorkSort';
import {LocalReaderDocument, buildLocalReaderDocument, readerHostBridgeSource} from './localReader';
import {groupLocalWorks, LocalWork} from './localWorks';
import {enrichLocalCatalogue, LocalEnrichmentCache, LocalEnrichmentProgress, publishableLocalWork} from './localEnrichment';
import {MetadataMatch, searchBookMetadata} from './metadataLookup';
import {cachePortraitCover} from './coverCache';
import {Achievement, achievementsFor, clampProgress, localDay, streakStats, VerifiedProfileStats} from './profileStats';
import {AtlasKind, buildAtlasRelationship} from './atlas';
import {AtlasUniverseNode, buildAtlasUniverse} from './atlasUniverse';
import {possibleLocalDuplicateGroups} from './duplicates';
import {normalizeLibrarySummary, normalizeServerWork} from './serverCompatibility';
import {deletePersistedJSON, getPersistedJSON, setPersistedJSON} from './stateStore';
import {abandonLocalStageScan, beginLocalStageScan, commitLocalStageScan, loadLocalStage, migrateLegacyLocalStage, removeLocalStageBooks, replaceLocalEnrichmentCache, stageLocalScanBooks, upsertLocalEnrichmentEntries, upsertLocalStageBooks} from './localStageStore';
import {LibrarySource, WorkSource, dedupeForAll, matchesSource, normalizeSpaceSelection, sourceIdentity, sourceLabel, spacesForSource} from './librarySources';
import {SmartShelfDefinition, SmartShelfField, SmartShelfOperator, SmartShelfRule, SmartShelfRuleGroup, LibraryCollection, addGroupAtPath, addRuleAtPath, applySmartShelf, collectionWorks, emptySmartShelfRules, legacyRules, newOrganisationId, removeRuleNode, replaceRuleNode, sanitizeCollections, sanitizeSmartShelves, toggleCollectionWork} from './libraryOrganisation';
import {PlayerBookmark, TrackOrderMap, ChapterOverrideMap, LivingBookMotion, LivingBookMotionEvent, addBookmark, applyTrackOrder, initialLivingBookMotion, mergeChapter, moveTrackOrder, reduceLivingBookMotion, removeBookmark, renameChapter, sanitizeBookmarks, sanitizeChapterOverrides, sanitizeTrackOrders, setChapterBoundary, splitChapter} from './playerExperience';
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
  publishedYear?: number;
  publisher?: string;
  seriesIndex?: number;
  isbn?: string;
  identifiers?: string[];
  format: string;
  space: string;
  available: boolean;
  uri?: string;
  identificationConfidence?: 'high' | 'medium' | 'low';
  needsReview?: boolean;
  reviewReason?: string;
  coverShape?: 'portrait' | 'square';
  coverUri?: string;
  livingBookCoverUri?: string;
  livingBookCoverSource?: 'embedded' | 'open-library' | 'google-books' | 'manual' | 'jacket' | 'none';
  livingBookCoverConfidence?: number;
  metadataProvider?: 'open-library' | 'google-books';
  metadataProviderId?: string;
  metadataSource?: 'path' | 'sidecar' | 'manual' | 'embedded' | 'online' | 'legacy';
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
type Tab = 'shelf' | 'library' | 'player' | 'reader' | 'atlas' | 'insights' | 'profile' | 'settings';
type ShelfSectionId = 'continue' | 'formats' | 'favourites' | 'smart' | 'collections' | 'series' | 'library';
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
const localEnrichmentKey = 'archivist.localEnrichment.v1';
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
  {id:'formats',title:'Browse by format',visible:true},
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
    ink: dark ? '#F3F0E8' : '#111111',
    paper: dark ? '#07111D' : '#FFFFFF',
    muted: dark ? '#A9B4C5' : '#6B6B6B',
    line: dark ? '#26364A' : '#E8E8E8',
    card: dark ? '#0B1725' : '#F7F7F7',
    raised: dark ? '#0E1C2C' : '#FFFFFF',
    sage: '#47736F',
    gold: dark ? '#E3BC67' : '#B99A68',
    ivory: dark ? '#F3F0E8' : '#FFFFFF',
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

type UiIconName = 'play'|'pause'|'more'|'close'|'edit'|'back'|'shelf'|'library'|'atlas'|'insights'|'settings'|'filter'|'grid'|'list'|'skipBack'|'skipForward'|'bookmark'|'moon'|'queue'|'search'|'minus'|'plus'|'fit'|'chevronUp'|'chevronDown'|'zoomIn'|'zoomOut'|'bookOpen'|'clock'|'calendar'|'flame'|'target'|'layers'|'gauge'|'pin';

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
  if(name==='edit')return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',left:size*.15,top:size*.47,width:size*.70,height:Math.max(1,stroke*.78),borderRadius:stroke,backgroundColor:color,transform:[{rotate:'-42deg'}]}}/>
    <View style={{position:'absolute',left:size*.10,bottom:size*.10,width:size*.20,height:size*.20,borderLeftWidth:Math.max(1,stroke*.7),borderBottomWidth:Math.max(1,stroke*.7),borderColor:color,transform:[{rotate:'3deg'}]}}/>
  </View>;
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
  const up=name==='chevronUp';
  return <View style={{width:size,height:size,position:'relative'}}>
    <View style={{position:'absolute',width:size*.58,height:stroke,borderRadius:stroke,backgroundColor:color,left:size*.08,top:size*.45,transform:[{rotate:up?'-42deg':'42deg'}]}}/>
    <View style={{position:'absolute',width:size*.58,height:stroke,borderRadius:stroke,backgroundColor:color,right:size*.08,top:size*.45,transform:[{rotate:up?'42deg':'-42deg'}]}}/>
  </View>;
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
  const [readerStatsSection,setReaderStatsSection]=useState<'Overview'|'Time'|'Books'|'Genres'|'Formats'|'Places'>('Overview');
  const [atlasFocus,setAtlasFocus]=useState<{kind:AtlasKind;value:string}|null>(null);
  const [atlasListMode,setAtlasListMode]=useState(false);
  const [atlasBreakdown,setAtlasBreakdown]=useState<'Genre'|'Format'|'Published year'>('Genre');
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
  const [ritualDays,setRitualDays]=useState<Record<string,number>>({});
  const [ritualReady,setRitualReady]=useState(false);
  const [awardCategory,setAwardCategory]=useState('All');
  const [ritualToday,setRitualToday]=useState(localDay());
  const ritual=useMemo(()=>streakStats(ritualDays,ritualToday),[ritualDays,ritualToday]);
  const [achievementCelebration,setAchievementCelebration]=useState<Achievement|null>(null);
  const [ratingPrompt,setRatingPrompt]=useState<RatingPrompt|null>(null);
  const achievementBaseline=useRef<{key:string;ids:Set<string>}|null>(null);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<LibrarySource>('all');
  const [librarySort,setLibrarySort]=useState<LibrarySort>('title');
  const [libraryView,setLibraryView]=useState<'grid'|'list'>('grid');
  const [workMenu,setWorkMenu]=useState<UnifiedWork|null>(null);
  const [quickActionsWorkKey,setQuickActionsWorkKey]=useState('');
  const suppressWorkOpenRef=useRef('');
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
  const [livingBookMotion,setLivingBookMotion]=useState<LivingBookMotion>(()=>initialLivingBookMotion(false));
  const livingBookMotionRef=useRef<LivingBookMotion>(livingBookMotion);
  livingBookMotionRef.current=livingBookMotion;
  const livingBookGeneration=useRef(0);
  const livingBookPageLoop=useRef<ReturnType<typeof setTimeout>|null>(null);
  const livingBookSettleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const livingBookCoverSessionRef=useRef<LivingBookCoverSession|undefined>(undefined);
  const skipTurnAnim=useRef(new Animated.Value(0)).current;
  const [skipDirection,setSkipDirection]=useState<1|-1>(1);
  const [skipTurning,setSkipTurning]=useState(false);
  const skipGeneration=useRef(0);
  function turnThreePages(direction:1|-1){
    if(reduceMotion||!playbackVisible||livingBookMotionRef.current.phase!=='open')return;
    stopLivingBookPageLoop();
    const motion=transitionLivingBook({type:'turn-request'});
    if(motion.phase!=='turning')return;
    const generation=++skipGeneration.current;
    skipTurnAnim.stopAnimation();skipTurnAnim.setValue(0);setSkipDirection(direction);setSkipTurning(true);
    Animated.timing(skipTurnAnim,{toValue:3,duration:780,useNativeDriver:true}).start(({finished})=>{
      if(!finished||generation!==skipGeneration.current)return;
      transitionLivingBook({type:'turn-complete'});
      scheduleLivingBookSettle(()=>{
        if(generation!==skipGeneration.current)return;
        skipTurnAnim.setValue(0);
        setSkipTurning(false);
        const next=transitionLivingBook({type:'settle-complete'});
        if(next.phase==='closing')animateLivingBookCoverClose();
      });
    });
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
  const [workPicker,setWorkPicker]=useState<WorkPicker|null>(null);
  const [editTitle,setEditTitle]=useState('');
  const [editAuthor,setEditAuthor]=useState('');
  const [editSeries,setEditSeries]=useState('');
  const [editGenre,setEditGenre]=useState('');
  const [editPublishedYear,setEditPublishedYear]=useState('');
  const [editPublisher,setEditPublisher]=useState('');
  const [editSeriesIndex,setEditSeriesIndex]=useState('');
  const [editIsbn,setEditIsbn]=useState('');
  const [metadataMatches,setMetadataMatches]=useState<MetadataMatch[]>([]);
  const [metadataMatchLoading,setMetadataMatchLoading]=useState(false);
  const [metadataMatchMode,setMetadataMatchMode]=useState<''|'search'|'deep'>('');
  const [metadataSearchNote,setMetadataSearchNote]=useState('');
  const [selectedMetadataMatch,setSelectedMetadataMatch]=useState<MetadataMatch|null>(null);
  const [sortTemplate,setSortTemplate]=useState('author-title');
  const [moveStatus,setMoveStatus]=useState('');
  const [localMovePreviews,setLocalMovePreviews]=useState<LocalWorkSortPreview[]>([]);
  const [localSortHistory,setLocalSortHistory]=useState<LocalSortHistory[]>([]);
  const [localMetadataOverrides,setLocalMetadataOverrides]=useState<Record<string, LocalMetadataOverride>>({});
  const [localOverridesReady,setLocalOverridesReady]=useState(false);
  const [localEnrichmentCache,setLocalEnrichmentCache]=useState<LocalEnrichmentCache>({});
  const [localEnrichmentReady,setLocalEnrichmentReady]=useState(false);
  const [localEnrichmentProgress,setLocalEnrichmentProgress]=useState<LocalEnrichmentProgress|null>(null);
  const localEnrichmentGeneration=useRef(0);
  const localEnrichmentActive=useRef(false);
  const startupEnrichmentStarted=useRef(false);
  const [localCatalogReady,setLocalCatalogReady]=useState(false);
  const [offlineWorks,setOfflineWorks]=useState<Record<string,OfflineServerWork>>({});
  const [offlineCheckpoints,setOfflineCheckpoints]=useState<Record<string,OfflineDownloadCheckpoint>>({});
  const [offlineStorage,setOfflineStorage]=useState<OfflineStorageSummary|null>(null);
  const [offlineStorageBusy,setOfflineStorageBusy]=useState(false);
  const [offlineBusyId,setOfflineBusyId]=useState<number|null>(null);
  const [offlineProgress,setOfflineProgress]=useState('');
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
  const playbackVisible = activeTab==='player' && appActive && !!playing;
  function lockedLivingBookCover(book:Book){
    const serverEdition=book.source==='server'&&session
      ? session.server+'/api/assets/'+book.id+'/cover'
      : undefined;
    const next=resolveLivingBookCover({
      format:book.format,
      editionCoverUri:book.coverUri||serverEdition,
      editionCoverShape:book.coverShape,
      livingBookCoverUri:book.livingBookCoverUri,
      livingBookCoverSource:book.livingBookCoverSource,
      livingBookCoverConfidence:book.livingBookCoverConfidence,
    });
    const key=[
      book.source||'local',
      book.originServer||session?.server||'device',
      book.localWorkKey||book.serverWorkId||book.id,
    ].join('|');
    const locked=lockLivingBookCoverSession(livingBookCoverSessionRef.current,key,next);
    livingBookCoverSessionRef.current=locked;
    return locked.decision;
  }
  useEffect(()=>{if(!playing)livingBookCoverSessionRef.current=undefined;},[playing]);

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
      const readingNow=appActive&&activeTab==='reader'&&!!reading&&!readerLoading&&!readerLoadError;
      if(!audioAdvanced&&!readingNow)return;
      setRitualDays(current=>current[day]>=60?current:{...current,[day]:Math.min(60,(current[day]||0)+15)});
    },15000);
    return()=>clearInterval(timer);
  },[ritualReady,playbackIsPlaying,appActive,activeTab,reading,readerLoading,readerLoadError]);


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

  function transitionLivingBook(event:LivingBookMotionEvent){
    const next=reduceLivingBookMotion(livingBookMotionRef.current,event);
    livingBookMotionRef.current=next;
    setLivingBookMotion(next);
    return next;
  }

  function stopLivingBookPageLoop(){
    if(livingBookPageLoop.current!==null){
      clearTimeout(livingBookPageLoop.current);
      livingBookPageLoop.current=null;
    }
  }

  function clearLivingBookSettle(){
    if(livingBookSettleTimer.current!==null){
      clearTimeout(livingBookSettleTimer.current);
      livingBookSettleTimer.current=null;
    }
  }

  function scheduleLivingBookSettle(callback:()=>void){
    clearLivingBookSettle();
    if(reduceMotion){callback();return;}
    livingBookSettleTimer.current=setTimeout(()=>{
      livingBookSettleTimer.current=null;
      callback();
    },180);
  }

  function animateLivingBookCoverClose(){
    const generation=++livingBookGeneration.current;
    bookOpenAnim.stopAnimation(value=>{
      if(generation!==livingBookGeneration.current)return;
      if(reduceMotion){
        bookOpenAnim.setValue(0);
        transitionLivingBook({type:'close-complete'});
        return;
      }
      Animated.timing(bookOpenAnim,{
        toValue:0,
        duration:Math.max(180,Math.round(value*1500)),
        useNativeDriver:true,
      }).start(({finished})=>{
        if(finished&&generation===livingBookGeneration.current)transitionLivingBook({type:'close-complete'});
      });
    });
  }

  function animateLivingBookOpen(){
    stopLivingBookPageLoop();
    clearLivingBookSettle();
    const next=transitionLivingBook({type:'play-request'});
    if(next.phase!=='opening')return;
    const generation=++livingBookGeneration.current;
    bookOpenAnim.stopAnimation(value=>{
      if(generation!==livingBookGeneration.current)return;
      if(reduceMotion){
        bookOpenAnim.setValue(1);
        transitionLivingBook({type:'open-complete'});
        return;
      }
      Animated.timing(bookOpenAnim,{
        toValue:1,
        duration:Math.max(180,Math.round((1-value)*1500)),
        useNativeDriver:true,
      }).start(({finished})=>{
        if(finished&&generation===livingBookGeneration.current)transitionLivingBook({type:'open-complete'});
      });
    });
  }

  function animateLivingBookClose(){
    stopLivingBookPageLoop();
    const next=transitionLivingBook({type:'pause-request'});
    if(next.phase==='turning'||next.phase==='settling')return;
    if(next.phase==='closing')animateLivingBookCoverClose();
  }

  function animateLivingBookPageTurn(){
    stopLivingBookPageLoop();
    if(reduceMotion||livingBookMotionRef.current.phase!=='open')return;
    const next=transitionLivingBook({type:'turn-request'});
    if(next.phase!=='turning')return;
    const generation=++livingBookGeneration.current;
    pageTurnAnim.stopAnimation();
    pageTurnAnim.setValue(0);
    Animated.timing(pageTurnAnim,{toValue:1,duration:1900,useNativeDriver:true}).start(({finished})=>{
      if(!finished||generation!==livingBookGeneration.current)return;
      transitionLivingBook({type:'turn-complete'});
      scheduleLivingBookSettle(()=>{
        if(generation!==livingBookGeneration.current)return;
        const settled=transitionLivingBook({type:'settle-complete'});
        pageTurnAnim.setValue(0);
        if(settled.phase==='closing')animateLivingBookCoverClose();
      });
    });
  }

  useEffect(()=>{
    if(!playing){
      ++livingBookGeneration.current;
      ++skipGeneration.current;
      stopLivingBookPageLoop();
      clearLivingBookSettle();
      bookOpenAnim.stopAnimation();bookOpenAnim.setValue(0);
      pageTurnAnim.stopAnimation();pageTurnAnim.setValue(0);
      skipTurnAnim.stopAnimation();skipTurnAnim.setValue(0);setSkipTurning(false);
      transitionLivingBook({type:'restore',playing:false});
      return;
    }
    transitionLivingBook({type:'visibility-change',visible:playbackVisible});
    const phase=livingBookMotionRef.current.phase;
    if(playbackIsPlaying&&(phase==='closed'||phase==='closing'))animateLivingBookOpen();
    if(!playbackIsPlaying&&phase!=='closed'&&phase!=='closing')animateLivingBookClose();
  },[playbackIsPlaying,playbackVisible,playing?.id,reduceMotion]);

  useEffect(()=>{
    stopLivingBookPageLoop();
    if(!playbackVisible||!playbackIsPlaying||reduceMotion||livingBookMotion.phase!=='open')return;
    livingBookPageLoop.current=setTimeout(()=>{
      livingBookPageLoop.current=null;
      animateLivingBookPageTurn();
    },7200);
    return()=>stopLivingBookPageLoop();
  },[livingBookMotion.phase,playbackIsPlaying,playbackVisible,reduceMotion]);

  const allPhoneWorks = useMemo(() => {
    const local = localBooks.filter((book): book is Book & {uri: string} => !!book.uri) as LocalBook[];
    return groupLocalWorks(local);
  }, [localBooks]);
  const phoneWorks = useMemo(() => allPhoneWorks.filter(publishableLocalWork), [allPhoneWorks]);
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
  useEffect(()=>{
    if(activeTab!=='atlas')return;
    const viewWidth=Math.min(width-48,480),viewHeight=viewWidth;
    const scale=Math.max(.18,Math.min(1.08,Math.min(viewWidth/atlasUniverse.width,viewHeight/atlasUniverse.height)*.78));
    setAtlasTransform({x:(viewWidth-atlasUniverse.width*scale)/2,y:(viewHeight-atlasUniverse.height*scale)/2,scale});
  },[activeTab,width,foldLayout,atlasUniverse.width,atlasUniverse.height]);
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

  const profileAchievements = useMemo(() => profileStats ? achievementsFor({...profileStats,bestStreak:ritual.bestStreak,activeDays:ritual.activeDays}) : [], [profileStats,ritual.bestStreak,ritual.activeDays]);
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
    const timer=setTimeout(()=>setAchievementCelebration(null),1900);
    return()=>clearTimeout(timer);
  },[profileAchievements,profileStats,ritualReady,session,sourceFilter]);

  useEffect(()=>{if(!achievementCelebration)return;const timer=setTimeout(()=>setAchievementCelebration(null),3200);return()=>clearTimeout(timer);},[achievementCelebration]);

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
    void (async()=>{
      try{
        let stage=await loadLocalStage();
        if(!stage.books.length && !Object.keys(stage.cache).length){
          const [legacyBooks,legacyCache]=await Promise.all([
            getPersistedJSON<Book[]>(localCatalogKey).catch(()=>null),
            getPersistedJSON<LocalEnrichmentCache>(localEnrichmentKey).catch(()=>null),
          ]);
          const books=Array.isArray(legacyBooks)
            ? legacyBooks.filter((book):book is Book & {uri:string}=>!!book?.uri).map(book=>({...book,genre:book.genre||''}) as LocalBook)
            : [];
          const cache=legacyCache&&typeof legacyCache==='object'?legacyCache:{};
          if(books.length||Object.keys(cache).length){
            await migrateLegacyLocalStage(books,cache);
            stage={books,cache};
            void Promise.all([
              deletePersistedJSON(localCatalogKey),
              deletePersistedJSON(localEnrichmentKey),
            ]).catch(()=>undefined);
          }
        }
        const normalized=stage.books.map(book=>({...book,genre:book.genre||''}));
        setLocalBooks(normalized.map(book=>({...book,source:'local' as const})));
        setSpaces([...new Set(normalized.map(book=>book.space).filter(Boolean))]);
        setLocalEnrichmentCache(stage.cache);
      }catch{
        // A database failure must not make the rest of the app unusable.
        // The next explicit rescan can rebuild the local stage.
      }finally{
        setLocalCatalogReady(true);
        setLocalEnrichmentReady(true);
      }
    })();
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

  useEffect(()=>{
    if(restoring||!localCatalogReady||!localEnrichmentReady||localScanning||!localBooks.length||startupEnrichmentStarted.current)return;
    startupEnrichmentStarted.current=true;
    void runLocalEnrichment(localBooks.filter((book):book is Book & {uri:string}=>!!book.uri) as LocalBook[],localEnrichmentCache);
  },[localCatalogReady,localEnrichmentReady,localScanning,localBooks.length,restoring]);

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

  async function runLocalEnrichment(catalogue:LocalBook[],cacheSeed:LocalEnrichmentCache=localEnrichmentCache){
    const generation=++localEnrichmentGeneration.current;
    if(!catalogue.length){
      localEnrichmentActive.current=false;
      await replaceLocalEnrichmentCache({});
      if(generation!==localEnrichmentGeneration.current)return;
      setLocalEnrichmentCache({});
      setLocalEnrichmentProgress(null);
      return;
    }
    localEnrichmentActive.current=true;
    const total=groupLocalWorks(catalogue).length;
    setLocalEnrichmentProgress({total,processed:0,published:0,attention:0,currentTitle:''});
    const pendingBooks=new Map<string,LocalBook>();
    const pendingEntries=new Map<string,LocalEnrichmentCache[keyof LocalEnrichmentCache]>();
    const flushDeltas=async()=>{
      if(generation!==localEnrichmentGeneration.current)return;
      const books=[...pendingBooks.values()];
      const entries=[...pendingEntries.values()];
      pendingBooks.clear();
      pendingEntries.clear();
      await upsertLocalStageBooks(books);
      await upsertLocalEnrichmentEntries(entries);
    };
    try{
      const result=await enrichLocalCatalogue(catalogue,cacheSeed,async(progress,delta)=>{
        if(generation!==localEnrichmentGeneration.current)return;
        for(const book of delta.books)if(book.uri)pendingBooks.set(book.uri,book);
        pendingEntries.set(delta.entry.fingerprint,delta.entry);
        const checkpoint=progress.processed===progress.total||progress.processed%24===0;
        if(checkpoint)await flushDeltas();
        if(progress.processed===1||progress.processed===progress.total||progress.processed%8===0){
          setLocalEnrichmentProgress(progress);
        }
      });
      if(generation!==localEnrichmentGeneration.current)return;
      await flushDeltas();
      await replaceLocalEnrichmentCache(result.cache);
      const next=result.books.map(book=>({...book,source:'local' as const}));
      setLocalBooks(next);
      setLocalEnrichmentCache(result.cache);
      setSpaces([...new Set(result.books.map(book=>book.space).filter(Boolean))]);
      if(result.progress.published>0&&celebrationEligible){
        setCelebrating(true);
        setCelebrationEligible(false);
        void SecureStore.setItemAsync(firstLibraryCelebratedKey,'1');
        setTimeout(()=>setCelebrating(false),1900);
      }
    }catch(error){
      if(generation===localEnrichmentGeneration.current)setError((error as Error).message);
    }finally{
      if(generation===localEnrichmentGeneration.current){
        localEnrichmentActive.current=false;
        setLocalEnrichmentProgress(null);
      }
    }
  }
  async function scanFoldersIntoStage(
    folders:LocalFolder[],
    options:{replaceSources?:string[];forceMetadata?:boolean}={},
  ){
    const generation=await beginLocalStageScan();
    const uiPending:LocalBook[]=[];
    const replaceSet=new Set((options.replaceSources||[]).filter(Boolean));
    const reuse=new Map<string,LocalBook>();
    for(const book of localBooks){
      if(book.uri)reuse.set(book.uri,book as LocalBook);
    }
    const scanSpaces=new Set<string>(
      options.replaceSources
        ? localBooks.filter(book=>!replaceSet.has((book as LocalBook).sourceUri||'')).map(book=>book.space).filter(Boolean)
        : [],
    );
    let ordinal=0;
    let lastUiPublish=0;
    let firstUiPublish=true;
    const publishUiBatch=(force=false)=>{
      const now=Date.now();
      if(!uiPending.length)return;
      if(!force&&!firstUiPublish&&(uiPending.length<192||now-lastUiPublish<900))return;
      const current=uiPending.splice(0,uiPending.length).map(book=>({...book,source:'local' as const}));
      lastUiPublish=now;
      setLocalBooks(previous=>{
        if(firstUiPublish){
          firstUiPublish=false;
          if(!options.replaceSources)return current;
          const preserved=previous.filter(book=>!replaceSet.has((book as LocalBook).sourceUri||''));
          return [...preserved,...current];
        }
        return [...previous,...current];
      });
      setSpaces([...scanSpaces]);
    };
    try{
      const result=await scanLocalFolders(
        folders,
        setScanProgress,
        localMetadataOverrides,
        async batch=>{
          if(!batch.length)return;
          await stageLocalScanBooks(generation,batch,ordinal);
          ordinal+=batch.length;
          for(const book of batch){
            uiPending.push(book);
            if(book.space)scanSpaces.add(book.space);
          }
          publishUiBatch(false);
        },
        {reuse,forceMetadata:!!options.forceMetadata},
      );
      publishUiBatch(true);
      await commitLocalStageScan(generation,options.replaceSources);
      const committed=await loadLocalStage();
      setLocalBooks(committed.books.map(book=>({...book,source:'local' as const})));
      setLocalEnrichmentCache(committed.cache);
      setSpaces([...new Set(committed.books.map(book=>book.space).filter(Boolean))]);
      return {result,committedBooks:committed.books};
    }catch(error){
      await abandonLocalStageScan(generation).catch(()=>undefined);
      const committed=await loadLocalStage().catch(()=>({books:[] as LocalBook[],cache:{} as LocalEnrichmentCache}));
      setLocalBooks(committed.books.map(book=>({...book,source:'local' as const})));
      setLocalEnrichmentCache(committed.cache);
      setSpaces([...new Set(committed.books.map(book=>book.space).filter(Boolean))]);
      throw error;
    }
  }

  async function addLocalFolder() {
    setError('');
    setLocalFolderNotice('');
    try {
      const picked = await pickLocalFolder();
      if (!picked) {
        setLocalFolderNotice('Folder selection cancelled.');
        return;
      }
      const existing=localFolders.find(folder=>folder.uri===picked.uri);
      const folders=existing
        ? localFolders.map(folder=>folder.uri===picked.uri?{...folder,...picked,status:'Ready to scan'}:folder)
        : [...localFolders,{...picked,status:'Ready to scan',itemCount:0}];
      setLocalFolders(folders);
      setLocalMovePreviews([]);
      await setPersistedJSON(localFoldersKey,folders);
      setLocalFolderNotice(
        existing
          ? `${picked.name} is ready to scan.`
          : `${picked.name} added. Add another folder or connect a server, then scan when you are ready.`,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function rescanLocalFolders(forceMetadata=false) {
    if (!localFolders.length) return;
    const hadPreviousScan=localFolders.some(folder=>!!folder.scannedAt);
    setError('');
    setLocalScanning(true);
    try {
      setScanProgress({phase:'discovering',currentFolder:localFolders[0]?.name||'Library',entriesVisited:0,found:0,review:0});
      const {result,committedBooks}=await scanFoldersIntoStage(localFolders,{forceMetadata});
      setLocalFolders(result.folders);
      setLocalMovePreviews([]);
      await setPersistedJSON(localFoldersKey,result.folders);
      void runLocalEnrichment(committedBooks,localEnrichmentCache);
      const reused=committedBooks.filter(book=>book.scanReused).length;
      const grouped=groupLocalWorks(committedBooks).length;
      setLocalFolderNotice(
        forceMetadata
          ? `Full rescan complete · ${committedBooks.length} media files · ${grouped} works rechecked${result.skipped ? ` · ${result.skipped} folders or entries unreadable` : ''}.`
          : hadPreviousScan
            ? `Library refreshed · ${committedBooks.length} media files · ${grouped} works · ${reused} unchanged · ${Math.max(0,committedBooks.length-reused)} changed or new${result.skipped ? ` · ${result.skipped} folders or entries unreadable` : ''}.`
            : `Scan complete · ${committedBooks.length} media files found · ${grouped} works grouped${result.skipped ? ` · ${result.skipped} folders or entries unreadable` : ''}.`,
      );
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
      coverShape: work.coverShape,
      livingBookCoverUri: work.livingBookCoverUri,
      livingBookCoverSource: work.livingBookCoverSource,
      livingBookCoverConfidence: work.livingBookCoverConfidence,
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
    const previews = previewLocalWorkSort(allPhoneWorks, sortTemplate);
    setLocalMovePreviews(previews);
    const ready = previews.filter(item => item.state === 'ready').length;
    const conflicts = previews.filter(item => item.state === 'conflict').length;
    const review = previews.filter(item => item.state === 'review').length;
    const same = previews.filter(item => item.state === 'same').length;
    setMoveStatus(`${ready} works ready; ${review} need metadata review; ${conflicts} conflicts; ${same} already organised.`);
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
      const result = await applyLocalWorkSortCopies(ready);
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

  function OnboardingGuide() {
    if (onboardingDone) return null;
    const reviewCount = localEnrichmentProgress ? 0 : localBooks.filter(book => book.needsReview).length;
    const hasFolder = localFolders.length > 0;
    const scanHasRun = localFolders.some(folder=>!!folder.scannedAt);
    const localWorkCount=allPhoneWorks.length;
    const readyCount=phoneWorks.length;
    const hasUsableLibrary=!!session||scanHasRun||readyCount>0;
    const scanBusy=localScanning||!!localEnrichmentProgress;
    return (
      <View style={[styles.onboardingCard,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <Text style={[styles.onboardingEyebrow,{color:p.sage}]}>SETUP</Text>
        <Text style={[styles.onboardingTitle,{color:p.ink}]}>Build your library</Text>
        <Text style={[styles.onboardingIntro,{color:p.muted}]}>Add all the folders you want to use, and optionally connect your Archivist server. Nothing is scanned until you choose Scan folders.</Text>

        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber,{color:hasFolder||session?p.sage:p.muted}]}>01</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Choose your sources</Text>
            <Text style={[styles.meta,{color:p.muted}]}>
              {[
                hasFolder?`${localFolders.length} device folder${localFolders.length===1?'':'s'} added`:'',
                session?'Archivist server connected':'',
              ].filter(Boolean).join(' · ') || 'Add one or more device folders, connect a server, or use both.'}
            </Text>
            {localFolders.map(folder=><Text key={folder.uri} numberOfLines={1} style={[styles.meta,{color:p.muted}]}>• {folder.name}</Text>)}
          </View>
        </View>
        <View style={styles.toolRow}>
          <Button label={hasFolder?'Add another folder':'Add folder'} tone="quiet" disabled={localScanning} onPress={()=>void addLocalFolder()} />
          {!session?<Button label={serverPanelOpen?'Hide server setup':'Connect server'} tone="quiet" disabled={busy} onPress={()=>setServerPanelOpen(value=>!value)} />:null}
        </View>
        {!session&&serverPanelOpen?<ServerConnect/>:null}

        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber,{color:scanHasRun||(!hasFolder&&!!session)?p.sage:p.muted}]}>02</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Scan your device folders</Text>
            <Text style={[styles.meta,{color:p.muted}]}>
              {localScanning&&scanProgress
                ? `Scanning ${scanProgress.currentFolder}: ${scanProgress.found} files found`
                : localEnrichmentProgress
                  ? `Identifying ${localEnrichmentProgress.processed} of ${localEnrichmentProgress.total} works · ${localEnrichmentProgress.published} ready`
                  : scanHasRun
                    ? `${localBooks.length} media files found · ${localWorkCount} works grouped · ${readyCount} ready`
                    : hasFolder
                      ? 'Your folders are ready. Start the scan when you have finished adding sources.'
                      : session
                        ? 'Your server already uses its own indexed catalogue and metadata; no phone scan is required.'
                        : 'Add at least one device folder to run a local scan.'}
            </Text>
          </View>
        </View>
        {hasFolder?<Button label={scanBusy?'Scanning & identifying…':scanHasRun?'Scan folders again':`Scan ${localFolders.length} folder${localFolders.length===1?'':'s'}`} disabled={scanBusy} onPress={()=>void rescanLocalFolders(false)} />:null}

        <View style={styles.onboardingStep}>
          <Text style={[styles.onboardingNumber,{color:(scanHasRun||session)&&!scanBusy?p.sage:p.muted}]}>03</Text>
          <View style={{flex:1}}>
            <Text style={[styles.onboardingStepTitle,{color:p.ink}]}>Review only what needs attention</Text>
            <Text style={[styles.meta,{color:p.muted}]}>
              {scanBusy
                ? 'Archivist is still identifying works and resolving artwork.'
                : reviewCount
                  ? `${reviewCount} item${reviewCount===1?'':'s'} need a quick check before they can enter the local Library.`
                  : scanHasRun
                    ? 'Everything found in the local scan is either ready or already resolved.'
                    : session
                      ? 'Server metadata comes from the server catalogue. Local review only applies to device folders you scan.'
                      : 'Review appears after the local scan.'}
            </Text>
          </View>
        </View>
        {!scanBusy&&reviewCount>0?<Button label={`Review ${reviewCount} item${reviewCount===1?'':'s'}`} onPress={()=>{setError('');setReviewOnly(true);setQuery('');setActiveTab('library')}} />:null}
        {hasUsableLibrary&&!scanBusy?<Button label="Enter my library" tone={reviewCount>0?'quiet':'primary'} onPress={()=>void finishOnboarding()} />:null}
        {localFolderNotice?<Text accessibilityLiveRegion="polite" style={[styles.meta,{color:p.sage}]}>{localFolderNotice}</Text>:null}
      </View>
    );
  }

  function beginEdit(item: Book) {
    const work=item.source==='server'?undefined:localWorkForBook(item);
    const workIsbn=work?.tracks.map(track=>track.isbn||'').find(Boolean);
    setEditing(item);
    setEditTitle(work?.title || item.title);
    setEditAuthor(work?.author || item.author || '');
    setEditSeries(work?.series || item.series || '');
    setEditGenre(work?.genre || item.genre || '');
    const year=work?.publishedYear || item.publishedYear;
    setEditPublishedYear(year ? String(year) : '');
    setEditPublisher(work?.publisher || item.publisher || '');
    const seriesIndex=work?.seriesIndex ?? item.seriesIndex;
    setEditSeriesIndex(seriesIndex !== undefined ? String(seriesIndex) : '');
    setEditIsbn(workIsbn || item.isbn || '');
    setMetadataMatches([]);
    setMetadataMatchMode('');
    setMetadataSearchNote('');
    setSelectedMetadataMatch(null);
  }

  function localWorkForBook(item:Book|null){
    if(!item?.uri)return undefined;
    return allPhoneWorks.find(work=>work.tracks.some(track=>track.uri===item.uri));
  }

  async function searchEditingMetadata(deep=false){
    if(!editing?.uri)return;
    const work=localWorkForBook(editing);
    if(!work)return;
    setMetadataMatchLoading(true);
    setMetadataMatchMode(deep?'deep':'search');
    setMetadataSearchNote(deep?'Deep scanning this book…':'Searching metadata sources…');
    setSelectedMetadataMatch(null);
    try{
      let evidenceWork=work;
      if(deep){
        const rescanned=await deepScanLocalTracks(work.tracks);
        evidenceWork=groupLocalWorks(rescanned)[0]||work;
        if(evidenceWork.title&&evidenceWork.title.toLowerCase()!=='untitled')setEditTitle(evidenceWork.title);
        if(evidenceWork.author)setEditAuthor(evidenceWork.author);
        if(evidenceWork.series)setEditSeries(evidenceWork.series);
        if(evidenceWork.genre)setEditGenre(evidenceWork.genre);
        if(evidenceWork.publishedYear)setEditPublishedYear(String(evidenceWork.publishedYear));
        if(evidenceWork.publisher)setEditPublisher(evidenceWork.publisher);
        if(evidenceWork.seriesIndex!==undefined)setEditSeriesIndex(String(evidenceWork.seriesIndex));
        const embeddedIsbn=evidenceWork.tracks.map(track=>track.isbn||'').find(Boolean);
        if(embeddedIsbn)setEditIsbn(embeddedIsbn);
      }
      const strongDeep=deep&&!evidenceWork.needsReview&&!!evidenceWork.title&&evidenceWork.title.toLowerCase()!=='untitled';
      const title=(strongDeep?evidenceWork.title:editTitle.trim()||evidenceWork.title).trim();
      const author=(strongDeep?evidenceWork.author:editAuthor.trim()||evidenceWork.author).trim();
      const seriesName=(strongDeep?evidenceWork.series:editSeries.trim()||evidenceWork.series).trim();
      const year=Number((strongDeep&&evidenceWork.publishedYear)||editPublishedYear)||undefined;
      const identifiers=[...new Set([
        editIsbn.trim(),
        ...evidenceWork.tracks.flatMap(track=>[track.isbn||'',...(track.identifiers||[])]),
      ].filter(Boolean))];
      const isbn=identifiers.find(value=>{
        const normalized=String(value).toUpperCase().replace(/[^0-9X]/g,'');
        return normalized.length===10||normalized.length===13;
      });
      if(!title||title.toLowerCase()==='untitled'){
        setMetadataMatches([]);
        setMetadataSearchNote('Add a title, or use Deep Scan to look for embedded identity first.');
        return;
      }
      const matches=await searchBookMetadata({
        title,
        author:author||undefined,
        series:seriesName||undefined,
        publishedYear:year,
        isbn,
        identifiers:identifiers.length?identifiers:undefined,
      },0.35);
      setMetadataMatches(matches);
      setMetadataSearchNote(
        matches.length
          ? (deep
              ? `Deep scan found ${matches.length} possible metadata match${matches.length===1?'':'es'}. Nothing changes until you choose one and save.`
              : `Found ${matches.length} possible metadata match${matches.length===1?'':'es'}. Nothing changes until you choose one and save.`)
          : (deep
              ? 'Deep scan completed, but no useful online match was found. You can still edit the details manually.'
              : 'No useful online match was found. Try Deep Scan or edit the details manually.')
      );
    }catch(e){
      setMetadataMatches([]);
      setMetadataSearchNote((e as Error).message||'Metadata search failed.');
    }finally{
      setMetadataMatchLoading(false);
    }
  }

  function useMetadataMatch(match:MetadataMatch){
    setSelectedMetadataMatch(match);
    setEditTitle(match.title||editTitle);
    setEditAuthor(match.authors?.[0]||editAuthor);
    if(match.series?.[0])setEditSeries(match.series[0]);
    if(match.genres?.[0])setEditGenre(match.genres[0]);
    if(match.publishedYear)setEditPublishedYear(String(match.publishedYear));
    if(match.publisher)setEditPublisher(match.publisher);
    const matchedIsbn=[...(match.isbns||[]),...(match.identifiers||[])].find(value=>{
      const normalized=String(value).toUpperCase().replace(/[^0-9X]/g,'');
      return normalized.length===10||normalized.length===13;
    });
    if(matchedIsbn)setEditIsbn(matchedIsbn);
  }

  async function removeLocalWorkFromArchivist(work:LocalWork){
    const uris=work.tracks.map(track=>track.uri).filter(Boolean);
    if(!uris.length)return;
    setBusy(true);setError('');
    try{
      await removeLocalStageBooks(work.tracks);
      const removeSet=new Set(uris);
      const nextBooks=localBooks.filter(book=>!book.uri||!removeSet.has(book.uri));
      setLocalBooks(nextBooks);
      const nextOverrides={...localMetadataOverrides};
      for(const uri of uris)delete nextOverrides[uri];
      setLocalMetadataOverrides(nextOverrides);
      await setPersistedJSON(localMetadataOverridesKey,nextOverrides);
      const nextPreferences={...localPreferences};
      delete nextPreferences[work.key];
      setLocalPreferences(nextPreferences);
      await setPersistedJSON(localPreferencesKey,nextPreferences);
      setQuickActionsWorkKey('');
      setLocalFolderNotice(`Removed “${work.title}” from Archivist. Source files were left untouched and it will stay hidden unless the source file changes.`);
      void runLocalEnrichment(nextBooks.filter((book):book is Book & {uri:string}=>!!book.uri) as LocalBook[],localEnrichmentCache);
    }catch(e){
      setError((e as Error).message);
    }finally{
      setBusy(false);
    }
  }

  function confirmRemoveLocalWork(work:LocalWork){
    Alert.alert(
      'Remove from Archivist?',
      `“${work.title}” will be removed from Archivist’s local index. The source file${work.files===1?'':'s'} will stay on your device.`,
      [
        {text:'Cancel',style:'cancel'},
        {text:'Remove',style:'destructive',onPress:()=>void removeLocalWorkFromArchivist(work)},
      ],
    );
  }

  function RawAssetCard({item}: {item: Book}) {
    const canEdit=item.source!=='server'||owner;
    const work=item.source==='server'?undefined:localWorkForBook(item);
    const displayTitle=work?.title||item.title||'Unidentified item';
    const displayAuthor=work?.author||item.author||'Unknown author';
    const reviewReason=work?.reviewReason||item.reviewReason||'Archivist needs you to confirm this work.';
    return (
      <View style={[styles.reviewAssetCard,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <MiniArtwork book={item}/>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Review '+displayTitle}
          onPress={()=>canEdit?beginEdit(item):openBook(item)}
          style={({pressed})=>[styles.reviewAssetCopy,pressed&&{opacity:.72}]}>
          <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{displayTitle}</Text>
          <Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{reviewReason}</Text>
          <Text numberOfLines={1} style={[styles.metadataConfidence,{color:p.sage}]}>
            {[item.format,displayAuthor,work?.files&&work.files>1?work.files+' files':'',item.space].filter(Boolean).join(' · ')}
          </Text>
        </Pressable>
        <Button label={canEdit?'Review':'Open'} onPress={()=>canEdit?beginEdit(item):openBook(item)} />
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
    const quickOpen=quickActionsWorkKey===work.canonicalKey&&work.source==='local'&&!!work.localWork;
    const toggleSelected=()=>setSelectedWorkKeys(current=>current.includes(work.canonicalKey)?current.filter(key=>key!==work.canonicalKey):[...current,work.canonicalKey]);
    const pressWork=()=>{
      if(suppressWorkOpenRef.current===work.canonicalKey){
        suppressWorkOpenRef.current='';
        return;
      }
      if(quickOpen){setQuickActionsWorkKey('');return;}
      selecting?toggleSelected():openUnifiedWork(work);
    };
    const longPressWork=()=>{
      if(work.source==='local'&&work.localWork){
        suppressWorkOpenRef.current=work.canonicalKey;
        Vibration.vibrate(12);
        setQuickActionsWorkKey(work.canonicalKey);
        return;
      }
      if(!selected)setSelectedWorkKeys(current=>[...current,work.canonicalKey]);
    };
    return <Pressable
      accessibilityRole="button"
      accessibilityLabel={work.title+', '+sourceLabel(work.source)}
      accessibilityState={{selected}}
      accessibilityHint={work.source==='local'?'Open. Long press for Edit and Delete.':selecting?'Toggle selection.':'Open. Long press to select.'}
      onPress={pressWork}
      onLongPress={longPressWork}
      style={({pressed})=>[
        styles.unifiedCard,
        list&&styles.unifiedCardList,
        selected&&[styles.unifiedCardSelected,{borderColor:p.sage,backgroundColor:p.card}],
        quickOpen&&styles.unifiedCardQuickOpen,
        pressed&&styles.cardPressed,
      ]}>
      <View style={[styles.unifiedCoverWrap,list&&styles.unifiedCoverWrapList]}>
        <Artwork title={work.title} format={work.format} coverShape={work.format==='Audio'?'square':'portrait'} coverUri={work.coverUri} serverPath={serverPath}/>
        {work.source==='downloaded'?<View style={[styles.offlineBadge,{backgroundColor:p.sage}]}><Text style={styles.offlineBadgeText}>SAVED</Text></View>:null}
        {quickOpen&&work.localWork?<View style={styles.coverQuickActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Edit '+work.title}
            onPress={event=>{
              event.stopPropagation();
              const first=work.localWork?.tracks[0];
              if(first)beginEdit({...first,source:'local'});
              setQuickActionsWorkKey('');
            }}
            style={({pressed})=>[styles.coverQuickButton,pressed&&{opacity:.72}]}>
            <UiIcon name="edit" color="#FFFFFF" size={18}/>
            <Text style={styles.coverQuickText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Delete '+work.title+' from Archivist'}
            onPress={event=>{event.stopPropagation();if(work.localWork)confirmRemoveLocalWork(work.localWork);}}
            style={({pressed})=>[styles.coverQuickButton,pressed&&{opacity:.72}]}>
            <UiIcon name="close" color="#FFFFFF" size={18}/>
            <Text style={styles.coverQuickText}>Delete</Text>
          </Pressable>
        </View>:null}
        {!quickOpen?<Pressable
          accessibilityRole="button"
          accessibilityLabel={'More actions for '+work.title}
          hitSlop={8}
          onPress={event=>{event.stopPropagation();setWorkMenu(work)}}
          style={[styles.moreButton,{backgroundColor:'rgba(0,0,0,.48)'},list&&styles.moreButtonList]}>
          <UiIcon name="more" color="#FFFFFF" size={16}/>
        </Pressable>:null}
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
            <SheetAction label={personal.favourite?'Remove favourite':'Add favourite'} onPress={setFav}/>
            {work.format==='Audio'&&local?<SheetAction label="Add to queue" onPress={()=>{close();void addLocalWorkQueue(local);}}/>:null}
            {work.format==='Audio'&&remote?<SheetAction label="Add to queue" onPress={()=>{close();void queueServerWork(remote);}}/>:null}
            {remote&&!downloaded?<SheetAction label="Download for offline" disabled={offlineBusyId!==null} onPress={()=>{close();void downloadServerWork(remote);}}/>:null}
            {downloaded?<SheetAction label={'Remove download · '+formatBytes(downloaded.bytes)} disabled={offlineBusyId!==null} onPress={()=>{close();void removeServerDownload(downloaded);}}/>:null}
            <SheetAction label="Select" onPress={()=>{setSelectedWorkKeys(current=>current.includes(work.canonicalKey)?current:[...current,work.canonicalKey]);close();}}/>
            <SheetAction label="Add to collection" onPress={()=>{setCollectionTarget(work);setOrganisationModal('add-to-collection');close();}}/>
            {local?.tracks[0]?<SheetAction label="Edit details" onPress={()=>{beginEdit({...local.tracks[0],source:work.source,originServer:local.originServer,serverWorkId:local.originWorkId});close();}}/>:null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>;
  }
  function MetadataEditorPanel(){
    if(!editing)return null;
    const save=async()=>{
      const title=editTitle.trim(),author=editAuthor.trim(),seriesName=editSeries.trim(),genre=editGenre.trim();
      const publishedYear=Number(editPublishedYear)||undefined;
      const publisher=editPublisher.trim();
      const seriesIndex=Number(editSeriesIndex);
      const normalizedSeriesIndex=Number.isFinite(seriesIndex)&&editSeriesIndex.trim()!==''?seriesIndex:undefined;
      const isbn=editIsbn.trim();
      if(!title)return;
      setBusy(true);setError('');
      try{
        if(editing.source==='server'){
          if(!session || (editing.originServer&&editing.originServer!==session.server) || !owner)throw Error('Reconnect to the correct server as an admin to edit this file.');
          await request(session,'/api/assets/'+editing.id+'/metadata','PATCH',{title,author,series:seriesName,genre});
          setServerBooks(old=>old.map(b=>b.id===editing.id?{...b,title,author,series:seriesName,genre,needsReview:false,reviewReason:'',metadataSource:'manual',identificationConfidence:'high'}:b));
          setEditing(null);
          return;
        }
        if(!editing.uri)return;
        const work=localWorkForBook(editing);
        const targets=work?.tracks.length?work.tracks:[editing as LocalBook];
        const uris=new Set(targets.map(track=>track.uri).filter(Boolean));
        let portraitUri:string|undefined;
        if(selectedMetadataMatch?.coverUri){
          try{
            const cached=await cachePortraitCover(
              'manual-'+selectedMetadataMatch.provider+'-'+selectedMetadataMatch.providerId,
              selectedMetadataMatch.coverUri,
            );
            portraitUri=cached.uri;
          }catch{
            // Metadata choice remains valid even if artwork cannot be cached now.
          }
        }
        const identifiers=[...new Set([
          isbn,
          ...(selectedMetadataMatch?.isbns||[]),
          ...(selectedMetadataMatch?.identifiers||[]),
        ].filter(Boolean))];
        const override:LocalMetadataOverride={
          title,author,series:seriesName,genre,
          ...(publishedYear?{publishedYear}:{}),
          ...(publisher?{publisher}:{}),
          ...(normalizedSeriesIndex!==undefined?{seriesIndex:normalizedSeriesIndex}:{}),
          ...(isbn?{isbn}:{}),
          ...(identifiers.length?{identifiers}:{}),
        };
        const nextOverrides={...localMetadataOverrides};
        for(const uri of uris)nextOverrides[uri]=override;
        setLocalMetadataOverrides(nextOverrides);
        await setPersistedJSON(localMetadataOverridesKey,nextOverrides);

        let changed:LocalBook[]=[];
        const updated=localBooks.map(book=>{
          if(!book.uri||!uris.has(book.uri))return book;
          const audio=book.format==='Audio';
          const coverUpdates=portraitUri
            ? audio
              ? {
                  livingBookCoverUri:portraitUri,
                  livingBookCoverSource:selectedMetadataMatch?.provider,
                  livingBookCoverConfidence:selectedMetadataMatch?.confidence,
                  ...(!book.coverUri?{coverUri:portraitUri,coverShape:'portrait' as const}:{}),
                }
              : {
                  coverUri:portraitUri,
                  coverShape:'portrait' as const,
                  livingBookCoverUri:portraitUri,
                  livingBookCoverSource:selectedMetadataMatch?.provider,
                  livingBookCoverConfidence:selectedMetadataMatch?.confidence,
                }
            : {};
          const next:LocalBook={
            ...(book as LocalBook),
            title,author,series:seriesName,genre,publishedYear,publisher,
            seriesIndex:normalizedSeriesIndex,isbn:isbn||book.isbn,
            identifiers:identifiers.length?identifiers:book.identifiers,
            needsReview:false,reviewReason:'',
            metadataSource:'manual',
            identificationConfidence:'high',
            metadataProvider:selectedMetadataMatch?.provider||book.metadataProvider,
            metadataProviderId:selectedMetadataMatch?.providerId||book.metadataProviderId,
            ...coverUpdates,
          };
          changed.push(next);
          return {...book,...next,source:'local' as const};
        });
        await upsertLocalStageBooks(changed);
        setLocalBooks(updated);
        setEditing(null);
        setMetadataMatches([]);
        setSelectedMetadataMatch(null);
        void runLocalEnrichment(updated.filter((book):book is Book & {uri:string}=>!!book.uri) as LocalBook[],localEnrichmentCache);
      }catch(e){
        setError((e as Error).message);
      }finally{
        setBusy(false);
      }
    };
    return <Modal transparent animationType="slide" visible onRequestClose={()=>!busy&&!metadataMatchLoading&&setEditing(null)}>
      <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS==='ios'?'padding':undefined}>
        <View style={styles.modalBackdrop}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
          <View accessibilityViewIsModal accessibilityLabel={'Edit details for '+editing.title} style={[styles.modalCard,{backgroundColor:p.card,borderColor:p.line}]}>
            <Text style={[styles.playerEyebrow,{color:p.sage}]}>METADATA</Text>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{editing.needsReview?'Review details':'Edit book'}</Text>
            {editing.reviewReason?<Text style={[styles.meta,{color:p.muted}]}>{editing.reviewReason}</Text>:null}
            <TextInput accessibilityLabel="Corrected title" value={editTitle} onChangeText={setEditTitle} placeholder="Title" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Author" value={editAuthor} onChangeText={setEditAuthor} placeholder="Author" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Series" value={editSeries} onChangeText={setEditSeries} placeholder="Series" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <View style={styles.metadataInlineFields}>
              <TextInput accessibilityLabel="Series number" value={editSeriesIndex} onChangeText={setEditSeriesIndex} keyboardType="decimal-pad" placeholder="Series #" placeholderTextColor={p.muted} style={[styles.input,styles.metadataInlineInput,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
              <TextInput accessibilityLabel="Publication year" value={editPublishedYear} onChangeText={setEditPublishedYear} keyboardType="number-pad" placeholder="Year" placeholderTextColor={p.muted} style={[styles.input,styles.metadataInlineInput,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            </View>
            <TextInput accessibilityLabel="Publisher" value={editPublisher} onChangeText={setEditPublisher} placeholder="Publisher" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="ISBN" value={editIsbn} onChangeText={setEditIsbn} autoCapitalize="characters" placeholder="ISBN" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>
            <TextInput accessibilityLabel="Genre" value={editGenre} onChangeText={setEditGenre} placeholder="Genre" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line,backgroundColor:p.raised}]}/>

            {editing.source!=='server'?<View style={[styles.metadataTools,{borderTopColor:p.line}]}>
              <Text style={[styles.meta,{color:p.muted}]}>Find a different edition, or Deep Scan just this book to re-read its embedded file metadata before searching. Neither changes your library until you choose a match and save.</Text>
              <View style={styles.toolRow}>
                <Button label={metadataMatchLoading&&metadataMatchMode==='search'?'Searching…':'Find Better Match'} tone="quiet" disabled={busy||metadataMatchLoading} onPress={()=>void searchEditingMetadata(false)}/>
                <Button label={metadataMatchLoading&&metadataMatchMode==='deep'?'Deep scanning…':'Deep Scan'} tone="quiet" disabled={busy||metadataMatchLoading} onPress={()=>void searchEditingMetadata(true)}/>
              </View>
              {metadataSearchNote?<Text style={[styles.meta,{color:p.muted}]}>{metadataSearchNote}</Text>:null}
              {metadataMatches.map(match=>{
                const chosen=selectedMetadataMatch?.provider===match.provider&&selectedMetadataMatch?.providerId===match.providerId;
                const details=[
                  match.authors?.[0]||'',
                  match.publisher||'',
                  match.publishedYear?String(match.publishedYear):'',
                ].filter(Boolean).join(' · ');
                return <Pressable
                  key={match.provider+':'+match.providerId}
                  accessibilityRole="button"
                  accessibilityLabel={'Use metadata match '+match.title}
                  onPress={()=>useMetadataMatch(match)}
                  style={({pressed})=>[styles.metadataCandidate,{borderTopColor:p.line,backgroundColor:chosen?p.raised:'transparent'},pressed&&{opacity:.72}]}>
                  <View style={{flex:1,minWidth:0}}>
                    <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{match.title}</Text>
                    {details?<Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{details}</Text>:null}
                    <Text style={[styles.metadataConfidence,{color:chosen?p.sage:p.muted}]}>{Math.round(match.confidence*100)}% match · {match.provider==='google-books'?'Google Books':'Open Library'}</Text>
                  </View>
                  <Text style={{color:p.sage,fontWeight:'700'}}>{chosen?'Selected':'Use'}</Text>
                </Pressable>;
              })}
            </View>:null}

            <Button label="Save details" disabled={busy||metadataMatchLoading||!editTitle.trim()} onPress={()=>void save()}/>
            <Button label="Cancel" tone="quiet" disabled={busy||metadataMatchLoading} onPress={()=>setEditing(null)}/>
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
          <Pressable accessibilityRole="switch" accessibilityState={{checked:item.visible}} accessibilityLabel={(item.visible?'Hide ':'Show ')+item.title} onPress={()=>toggle(item.id)} style={[styles.visibilityToggle,{backgroundColor:item.visible?p.sage:p.line}]}><View pointerEvents="none" style={[styles.visibilityThumb,{backgroundColor:p.ivory,transform:[{translateX:item.visible?16:0}]}]}/></Pressable>
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
    const formatGroups=[...new Set(base.map(work=>work.format).filter(Boolean))]
      .sort((a,b)=>{
        const order=(value:string)=>value==='Audio'?0:value==='Ebook'?1:value==='Comic'?2:value==='PDF'?3:4;
        return order(a)-order(b)||a.localeCompare(b);
      })
      .map(name=>({name,total:base.filter(work=>work.format===name).length,works:base.filter(work=>work.format===name).slice(0,4)}));
    const localReview=localEnrichmentProgress?0:localBooks.filter(book=>book.needsReview).length;
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
      if(item.id==='formats'&&!formatGroups.length)return null;
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
        {item.id==='formats'?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionRow}>
          {formatGroups.map(({name,total,works})=><Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={'Browse '+name+', '+total+' work'+(total===1?'':'s')}
            onPress={()=>{clearLibraryFilters();setFormatFilter(name);setLibrarySort(name==='Audio'?'progress':'title');setActiveTab('library')}}
            style={({pressed})=>[styles.collectionTile,pressed&&styles.cardPressed]}>
            <View style={styles.collectionCollage}>
              {works.slice(0,3).map((work,index)=><View key={work.key} style={[styles.collectionMiniCover,{left:index*24,top:index===1?2:index===2?5:7,zIndex:3-index,transform:[{rotate:index===0?'-5deg':index===2?'5deg':'0deg'}]}]}>{workArtwork(work)}</View>)}
              {!works.length?<View style={[styles.collectionEmptyMark,{backgroundColor:p.card}]}><Text style={[styles.emptyMark,{color:p.muted}]}>{name.slice(0,1)}</Text></View>:null}
            </View>
            <Text numberOfLines={2} style={[styles.collectionName,{color:p.ink}]}>{name}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{total} work{total===1?'':'s'}</Text>
          </Pressable>)}
        </ScrollView>:null}
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

      {reviewCount>0?<Pressable accessibilityRole="button" accessibilityLabel={reviewCount+' metadata item'+(reviewCount===1?'':'s')+' need review'} onPress={()=>{setError('');setReviewOnly(true);setActiveTab('library')}} style={[styles.reviewBanner,{borderTopColor:p.line,borderBottomColor:p.line}]}>
        <View style={styles.reviewBannerCopy}>
          <Text maxFontSizeMultiplier={1.15} style={[styles.reviewBannerTitle,{color:p.ink}]}>Metadata review</Text>
          <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={[styles.reviewBannerMeta,{color:p.muted}]}>{reviewCount} item{reviewCount===1?'':'s'} need{reviewCount===1?'s':''} a quick check</Text>
        </View>
        <Text maxFontSizeMultiplier={1.15} style={[styles.reviewBannerAction,{color:p.sage}]}>Review</Text>
      </Pressable>:null}

      {localScanning&&scanProgress?<View style={[styles.scanBanner,{backgroundColor:p.card}]}>
        <ActivityIndicator accessibilityLabel="Scanning local library" color={p.sage}/>
        <View style={{flex:1}}><Text style={{color:p.ink,fontWeight:'600'}}>Scanning {scanProgress.currentFolder||'library'}…</Text><Text style={{color:p.muted}}>{scanProgress.entriesVisited} checked · {scanProgress.found} found</Text></View>
      </View>:null}

      {!localScanning&&localEnrichmentProgress?<View style={[styles.scanBanner,{backgroundColor:p.card}]}>
        <ActivityIndicator accessibilityLabel="Preparing local library" color={p.sage}/>
        <View style={{flex:1}}><Text style={{color:p.ink,fontWeight:'600'}}>Preparing your library…</Text><Text style={{color:p.muted}}>{localEnrichmentProgress.published} ready · {localEnrichmentProgress.processed} of {localEnrichmentProgress.total} checked</Text></View>
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
        {availableSpaces.length>1?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.libraryChipsScroll} contentContainerStyle={styles.libraryChips}><LibrarySwitcher/></ScrollView>:null}
      </View>

      <View style={[styles.shelfUtilityRow,{borderTopColor:p.line}]}>
        <Pressable accessibilityRole="button" onPress={()=>setActiveTab('library')} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>Browse library</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>{setOrganisationName('');setSmartShelfRules(emptySmartShelfRules());setSmartShelfAdvanced(false);setOrganisationModal('smart-shelf')}} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>New Smart Shelf</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>setOrganisationModal('manage')} style={styles.shelfUtilityAction}><Text style={{color:p.ink,fontWeight:'600'}}>Manage collections</Text></Pressable>
      </View>

      <WorkActionSheet/><OrganisationPanel/><ShelfManagePanel/><MetadataEditorPanel/>
    </ScrollView>;
  }

  function Library(){
    const wide=width>=600;
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
      {!wide?<><SourceSwitcher/>{availableSpaces.length>1?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.libraryChipsScroll} contentContainerStyle={styles.libraryChips}><LibrarySwitcher/></ScrollView>:null}</>:null}
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
          <Pressable accessibilityRole="button" accessibilityState={{selected:!formatFilter}} onPress={()=>setFormatFilter('')} style={styles.libraryFormatTab}>
            <Text maxFontSizeMultiplier={1.15} style={[styles.libraryFormatText,{color:!formatFilter?p.ink:p.muted,fontWeight:!formatFilter?'700':'500'}]}>All</Text>
            <View pointerEvents="none" style={[styles.libraryFormatMarker,{backgroundColor:p.sage,opacity:!formatFilter?1:0}]}/>
          </Pressable>
          {formatOptions.map(format=><Pressable key={format} accessibilityRole="button" accessibilityState={{selected:formatFilter===format}} onPress={()=>setFormatFilter(formatFilter===format?'':format)} style={styles.libraryFormatTab}>
            <Text maxFontSizeMultiplier={1.15} style={[styles.libraryFormatText,{color:formatFilter===format?p.ink:p.muted,fontWeight:formatFilter===format?'700':'500'}]}>{format}</Text>
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
        <Button label="Apply" onPress={()=>setLibraryFiltersOpen(false)}/><Button label="Save as Smart Shelf" tone="quiet" onPress={()=>{setLibraryFiltersOpen(false);setOrganisationName('');setSmartShelfRules(emptySmartShelfRules());setSmartShelfAdvanced(false);setOrganisationModal('smart-shelf')}}/>
      </View></ScrollView></View></Modal>:null}
    </View>;
    return wide?<View style={styles.libraryTwoPane}><View style={[styles.libraryRail,layoutTier==='fold'&&styles.libraryRailFold,{backgroundColor:p.paper,borderRightColor:p.line}]}><Text style={[styles.libraryRailTitle,{color:p.muted}]}>SOURCES</Text><SourceSwitcher vertical/><Text style={[styles.libraryRailTitle,{color:p.muted,marginTop:20}]}>SPACES</Text><LibrarySwitcher vertical/><Pressable accessibilityRole="button" onPress={()=>void addLocalFolder()} style={styles.libraryRailAdd}><Text maxFontSizeMultiplier={1.15} style={{color:p.sage,fontSize:12.5,lineHeight:18,fontWeight:'600'}}>Add device folder</Text></Pressable></View>{main}</View>:main;
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
    const livingCover=current?lockedLivingBookCover(current):null;

    async function togglePlayback(){
      if(isPlaying){
        animateLivingBookClose();
        if(serverPlayer){controller.toggle();return;}
        player.pause();
        await persistLocalPlaybackPosition(position);
        return;
      }
      animateLivingBookOpen();
      if(serverPlayer){controller.toggle();return;}
      player.play();
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
          <Pressable accessibilityRole="button" accessibilityLabel="Close player" onPress={()=>setActiveTab('shelf')} style={styles.iconButton}><UiIcon name="chevronDown" color={p.ink} size={22}/></Pressable><Text style={[styles.playerEyebrow,{color:p.ink}]}>NOW PLAYING</Text>
          {current ? <Text style={[styles.meta,{color:p.muted,fontWeight:'600'}]}>{speed}×</Text> : null}
        </View>
        {current ? (
          <View style={[styles.playerAdaptive,foldLayout&&styles.playerAdaptiveWide]}>
            <View style={styles.playerHeroColumn}>
            <LivingBookCanvas
              title={current.title}
              author={current.author}
              chapter={currentChapter?.title}
              number={Math.max(1,currentChapterIndex+1)}
              phase={livingBookMotion.phase}
              direction={skipDirection}
              skipping={skipTurning}
              reduceMotion={reduceMotion}
              coverUri={livingCover?.uri}
              coverMode={livingCover?.kind==='jacket'?'jacket':livingCover?.kind==='portrait'?'portrait':'fallback'}
              coverHeaders={current.source==='server'&&session?{Authorization:'Bearer '+session.token}:undefined}
            />
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
            <View style={{flexDirection:'row',justifyContent:'space-between',gap:12,marginBottom:8}}><Text numberOfLines={1} style={{color:p.ink,flex:1,fontSize:13}}>{currentChapter?.title||'Listening'}</Text><Text style={{color:p.muted,fontSize:13}}>{Math.round(displayedProgress*100)}%</Text></View>

            <Pressable
              accessibilityRole="adjustable"
              accessibilityLabel="Playback position"
              accessibilityHint="Tap to seek, or swipe up and down with a screen reader to move by 30 seconds"
              accessibilityValue={{min:0,max:Math.max(1,Math.round(duration)),now:Math.round(position),text:formatTime(position)+' of '+formatTime(duration)}}
              accessibilityActions={[{name:'increment',label:'Forward 30 seconds'},{name:'decrement',label:'Back 30 seconds'}]}
              onAccessibilityAction={event=>{
                if(event.nativeEvent.actionName==='increment'){seekTo(position+30);turnThreePages(1);}
                if(event.nativeEvent.actionName==='decrement'){seekTo(position-30);turnThreePages(-1);}
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
              <Pressable accessibilityRole="button" accessibilityLabel="Back 15 seconds" onPress={()=>{seekTo(position-15);turnThreePages(-1);}} style={[styles.skipButton,{backgroundColor:p.card,borderRadius:48}]}>
                <UiIcon name="skipBack" color={p.ink} size={32}/>
                <Text pointerEvents="none" style={[styles.skipNumber,{color:p.ink}]}>15</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                disabled={serverPlayer ? playback?.loading : false}
                style={({pressed})=>[styles.playButton,{backgroundColor:p.paper==='#07111D'?'#F1EEE4':'#182C29',transform:[{scale:pressed?0.97:1}]}]}
                onPress={()=>void togglePlayback()}>
                {serverPlayer && playback?.loading ? <ActivityIndicator color="#FFFFFF"/> : <UiIcon name={isPlaying?'pause':'play'} color={p.paper==='#07111D'?'#182C29':'#FFFFFF'} size={27}/>}
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Forward 30 seconds" onPress={()=>{seekTo(position+30);turnThreePages(1);}} style={styles.skipButton}>
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

  function Reader() {
    const closeReader=()=>{setReading(null);setLocalReader(null);setReaderLoadError('');setReaderLoading(false);setReaderToolsOpen(false);setReaderChromeVisible(true);setActiveTab('shelf');};
    const readerBar=<View style={[styles.readerBar,{backgroundColor:p.paper}]}><Pressable accessibilityRole="button" accessibilityLabel="Back to Shelf" onPress={closeReader} style={styles.readerBack}><UiIcon name="back" color={p.ink} size={21}/></Pressable><View style={styles.readerHeading}><Text numberOfLines={1} style={[styles.readerTitle,{color:p.ink}]}>{reading?.title || 'Reader'}</Text>{reading?<Text style={[styles.readerFormat,{color:p.muted}]}>{reading.format}</Text>:null}</View><Pressable accessibilityRole="button" accessibilityLabel="Reader tools" onPress={()=>setReaderToolsOpen(true)} style={styles.readerToolsButton}><Text style={[styles.readerToolGlyph,{color:p.ink}]}>Aa</Text></Pressable></View>;
    if(!reading)return <View style={styles.readerEmpty}><Text style={[styles.emptyMark,{color:p.sage}]}>A</Text><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Reader</Text><Text style={[styles.empty,{color:p.muted,textAlign:'center'}]}>Open an EPUB, PDF or comic from Shelf.</Text></View>;
    const localReaderMode=reading.source!=='server';
    if(localReaderMode){
      const localPdf=reading.format==='PDF'&&!!reading.uri&&Platform.OS==='android';
      return <View style={styles.readerScreen}>{readerChromeVisible?readerBar:null}{localPdf?<LocalPdfReader uri={reading.uri!} title={reading.title} initialPage={localReadingProgress[reading.uri!]||0} requestedPage={readerRequestedPage} paper={p.paper} ink={p.ink} muted={p.muted} line={p.line} sage={p.sage} onPosition={(page,count,complete)=>handleReaderMessage(JSON.stringify({type:'reader-position',page,count,complete}))}/>:readerLoading?<View style={styles.readerLoading}><ActivityIndicator accessibilityLabel="Opening local reader"/><Text style={[styles.meta,{color:p.muted}]}>Opening {reading.format}…</Text></View>:readerLoadError?<View style={styles.readerFailure}><Text accessibilityRole="alert" style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Couldn’t open this book</Text><Text style={[styles.meta,{color:p.muted}]}>{readerLoadError}</Text><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View>:localReader?.html?<WebView ref={readerWebRef} originWhitelist={['*']} source={{html:localReader.html}} onLoadEnd={()=>sendReaderCommand('appearance',{value:readerAppearance})} onMessage={event=>handleReaderMessage(event.nativeEvent.data)}/>:localReader?.uri?<WebView ref={readerWebRef} originWhitelist={['content://*','file://*']} source={{uri:localReader.uri}} allowFileAccess/>:<Text style={[styles.empty,{color:p.muted,padding:16}]}>Unable to open this file.</Text>}<ReaderTools/></View>;
    }
    if(!session||(reading.originServer&&reading.originServer!==session.server))return <View style={styles.readerScreen}>{readerChromeVisible?readerBar:null}<View style={styles.readerFailure}><Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Server reader unavailable</Text><Text style={[styles.meta,{color:p.muted}]}>Reconnect to the server that owns this title, or open its downloaded copy.</Text><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View><ReaderTools/></View>;
    return <View style={styles.readerScreen}>{readerChromeVisible?readerBar:null}<WebView ref={readerWebRef} key={session.token+reading.id+':'+readerReloadKey} source={{uri:session.server+'/reader.html?asset='+reading.id,headers:{Authorization:'Bearer '+session.token}}} incognito originWhitelist={[session.server]} onShouldStartLoadWithRequest={r=>readerNavigationAllowed(r.url,session.server)} mixedContentMode="never" injectedJavaScriptBeforeContentLoaded={readerHostBridgeSource()} onLoadStart={()=>{setReaderLoading(true);setReaderLoadError('')}} onLoadEnd={()=>{setReaderLoading(false);sendReaderCommand('appearance',{value:readerAppearance})}} onMessage={event=>handleReaderMessage(event.nativeEvent.data)} onHttpError={e=>{const message='Reader request failed: '+e.nativeEvent.statusCode;setReaderLoadError(message);setReaderLoading(false);setError(message)}} onError={e=>{const message=e.nativeEvent.description||'Reader failed to load.';setReaderLoadError(message);setReaderLoading(false);setError(message)}} allowFileAccess={false} javaScriptCanOpenWindowsAutomatically={false} setSupportMultipleWindows={false}/>{readerLoading?<View pointerEvents="none" style={[styles.readerOverlay,{backgroundColor:p.paper}]}><ActivityIndicator accessibilityLabel="Opening server reader"/><Text style={[styles.meta,{color:p.muted}]}>Opening {reading.format}…</Text></View>:null}{readerLoadError?<View style={[styles.readerErrorOverlay,{backgroundColor:p.paper}]}><Text accessibilityRole="alert" style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Reader needs attention</Text><Text style={[styles.meta,{color:p.muted}]}>{readerLoadError}</Text><View style={styles.toolRow}><Button label="Retry" onPress={()=>{setReaderLoadError('');setReaderLoading(true);setReaderReloadKey(key=>key+1)}}/><Button label="Back to Shelf" tone="quiet" onPress={closeReader}/></View></View>:null}<ReaderTools/></View>;
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
        <Button label="Back to Atlas" tone="quiet" onPress={()=>setAtlasFocus(null)} />
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
      const nextScale=Math.max(.18,Math.min(2.25,gesture.baseScale*(distance/gesture.distance)));
      const ratio=nextScale/gesture.baseScale;
      setAtlasTransform({x:gesture.focusX-(gesture.focusX-gesture.baseX)*ratio,y:gesture.focusY-(gesture.focusY-gesture.baseY)*ratio,scale:nextScale});
      return;
    }
    if(gesture.mode==='pinch')return;
    const point=touches[0]||event.nativeEvent;
    setAtlasTransform(current=>({...current,x:gesture.baseX+(point.locationX-gesture.startX),y:gesture.baseY+(point.locationY-gesture.startY)}));
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
    setAtlasNodeId(node.id);
    const viewWidth=Math.max(286,Math.min(1244,width-36)),viewHeight=width>=900?620:foldLayout?580:500;
    const scale=Math.max(.82,atlasTransform.scale);
    animateAtlasTransform({scale,x:viewWidth/2-node.x*scale,y:viewHeight/2-node.y*scale});
  }

  function AtlasEdgeView({from,to,kind}:{from:AtlasUniverseNode;to:AtlasUniverseNode;kind:string}){
    const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;
    return <View pointerEvents="none" style={[styles.atlasUniverseEdge,{left:from.x,top:from.y,width:length,height:1/atlasTransform.scale,opacity:atlasNodeId?(from.id===atlasNodeId||to.id===atlasNodeId?.65:.08):.3,backgroundColor:atlasNodeColor(from),transformOrigin:'left center',transform:[{rotateZ:angle+'deg'}]}]}/>;
  }

  function AtlasUniverseNodeView({node}:{node:AtlasUniverseNode}){
    if(!atlasNodeVisible(node))return null;
    const selected=node.id===atlasNodeId;
    const connected=!atlasNodeId||selected||atlasUniverse.edges.some(edge=>(edge.from===atlasNodeId&&edge.to===node.id)||(edge.to===atlasNodeId&&edge.from===node.id));
    const zoom=atlasTransform.scale,hit=44/zoom;
    const dot=(node.kind==='genre'?8:node.kind==='author'?6:node.kind==='work'?4:5)/zoom;
    return <Pressable accessibilityRole="button" accessibilityLabel={node.kind+' '+node.label} onPress={()=>setAtlasNodeId(node.id)} style={{position:'absolute',left:node.x-hit/2,top:node.y-hit/2,width:hit,height:hit,alignItems:'center',justifyContent:'center',opacity:connected?1:.22}}>
      {selected?<View pointerEvents="none" style={{position:'absolute',width:70,height:70,borderRadius:35,backgroundColor:p.sage,opacity:.16}}/>:null}
      <View style={{width:dot,height:dot,borderRadius:dot/2,backgroundColor:atlasNodeColor(node),boxShadow:selected?'0px 0px 18px rgba(71,115,111,.7)':'none'}}/>
      {(selected||node.kind==='genre'||zoom>.55)?<Text numberOfLines={2} style={{position:'absolute',top:hit/2+10/zoom,left:(hit-144/zoom)/2,width:144/zoom,minWidth:144/zoom,flexShrink:0,textAlign:'center',fontSize:12/zoom,lineHeight:16/zoom,color:selected?p.ink:p.muted,fontWeight:selected?'700':'400'}}>{node.label}</Text>:null}
    </Pressable>;
  }

  function AtlasInspector(){
    const node=atlasSelectedNode;if(!node)return null;
    const work=node.kind==='work'?atlasUniverseWorks.find(item=>item.key===node.workKey):undefined;
    const collection=node.kind==='collection'?collections.find(item=>item.id===node.collectionId):undefined;
    const connected=atlasUniverse.edges.filter(edge=>edge.from===node.id||edge.to===node.id).length;
    return <View style={[styles.atlasInspector,{backgroundColor:foldLayout?p.paper:p.raised},foldLayout?styles.atlasInspectorWide:styles.atlasInspectorMobile,foldLayout&&{borderLeftColor:p.line}]}>
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
    const ringSize=Math.min(width-48,480);
    const viewHeight=ringSize;
    const breakdownCounts=new Map<string,number>();
    for(const work of atlasUniverseWorks){const label=atlasBreakdown==='Genre'?(work.genre||'Unclassified'):atlasBreakdown==='Format'?work.format:work.publishedYear?String(work.publishedYear):'Not recorded';breakdownCounts.set(label,(breakdownCounts.get(label)||0)+1);}
    const breakdown:ChartItem[]=[...breakdownCounts].sort((a,b)=>b[1]-a[1]).map(([label,count],index)=>({label,count,color:atlasBreakdown==='Genre'?genreColour(label):genreColours[index%genreColours.length]}));
    return (
      <ScrollView contentContainerStyle={styles.atlasScreen} keyboardShouldPersistTaps="handled">
        <View style={styles.pageHeadingRow}>
          <View style={{flex:1}}>
            <Text maxFontSizeMultiplier={1.15} style={[styles.atlasTitle,{color:p.ink}]}>Atlas</Text>
            <Text style={[styles.pageSubtitle,{color:p.muted}]}>A living map of the books, people, series and ideas in your library.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={atlasListMode?'Show Atlas universe':'Show Atlas list'} onPress={()=>setAtlasListMode(value=>!value)} style={styles.headerAction}>
            <UiIcon name={atlasListMode?'atlas':'list'} color={p.muted} size={22}/>
          </Pressable>
        </View>

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

          <View style={[styles.atlasUniverseLayout]}>
            <View style={[styles.atlasViewport,{height:viewHeight,width:ringSize,alignSelf:'center',minHeight:viewHeight,flexBasis:'auto',flexShrink:0,backgroundColor:p.paper}]}
              onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true}
              onResponderGrant={atlasGestureStart} onResponderMove={atlasGestureMove}
              onResponderRelease={()=>{atlasGesture.current=null}} onResponderTerminate={()=>{atlasGesture.current=null}}>
              <AmbientGlow size={600} strength={.55}/><View pointerEvents="none" style={{position:'absolute',left:'50%',top:0,marginLeft:-ringSize/2,zIndex:2}}><DataRing size={ringSize} items={[{label:'Genre',count:1,color:'#bc8880'},{label:'Format',count:1,color:'#6ca8b2'},{label:'Published year',count:1,color:'#9ba5b2'}]} ink={p.ink} muted={p.muted} track={p.line} thickness={14}/></View><View style={styles.atlasViewportTools}>
                <Pressable accessibilityRole="button" accessibilityLabel="Fit Atlas" onPress={atlasResetView} style={[styles.atlasToolButton,{backgroundColor:p.raised}]}><UiIcon name="fit" color={p.ink} size={18}/></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={()=>animateAtlasTransform({...atlasTransform,scale:Math.max(.18,atlasTransform.scale-.15)},180)} style={[styles.iconButton,styles.atlasZoomButton,{backgroundColor:p.raised}]}><UiIcon name="zoomOut" color={p.ink} size={18}/></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={()=>animateAtlasTransform({...atlasTransform,scale:Math.min(2.25,atlasTransform.scale+.15)},180)} style={[styles.iconButton,styles.atlasZoomButton,{backgroundColor:p.raised}]}><UiIcon name="zoomIn" color={p.ink} size={18}/></Pressable>
              </View>

              <View style={[styles.atlasUniverseCanvas,{width:atlasUniverse.width,height:atlasUniverse.height,left:atlasTransform.x,top:atlasTransform.y,transform:[{scale:atlasTransform.scale}],transformOrigin:'top left'} as any]}>
                {renderedEdges.map(edge=>{const from=nodeMap.get(edge.from),to=nodeMap.get(edge.to);return from&&to?<AtlasEdgeView key={edge.id} from={from} to={to} kind={edge.kind}/>:null})}
                {renderedNodes.map(node=><AtlasUniverseNodeView key={node.id} node={node}/>)}
              </View>

              
              {atlasUniverse.hiddenWorks?<View style={[styles.atlasClusterNotice,{backgroundColor:p.paper}]}><Text style={[styles.meta,{color:p.muted}]}>A stable sample is shown for smooth navigation · {atlasUniverse.hiddenWorks} more works remain available through search and clusters.</Text></View>:null}
            </View>
            <AtlasInspector/>
          </View>

          <View style={{flexDirection:'row',gap:8,justifyContent:'center',marginTop:12}}>{(['Genre','Format','Published year'] as const).map(label=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected:atlasBreakdown===label}} onPress={()=>setAtlasBreakdown(label)} style={{minHeight:44,paddingHorizontal:14,justifyContent:'center',borderRadius:24,borderWidth:1,borderColor:atlasBreakdown===label?p.sage:p.line,backgroundColor:atlasBreakdown===label?p.card:'transparent'}}><Text style={{color:atlasBreakdown===label?p.ink:p.muted}}>{label}</Text></Pressable>)}</View>
          <View style={{padding:20,borderRadius:24,borderWidth:1,borderColor:p.line,backgroundColor:p.raised,gap:14,marginTop:16}}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{atlasBreakdown}</Text><Text style={[styles.meta,{color:p.muted}]}>Your library, in perspective</Text>
            {breakdown.map(item=><View key={item.label} style={{gap:7}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:p.ink}}>{item.label}</Text><Text style={{color:p.muted}}>{item.count} · {Math.round(item.count/Math.max(1,atlasUniverseWorks.length)*100)}%</Text></View><View style={{height:5,borderRadius:3,backgroundColor:p.line}}><View style={{height:5,borderRadius:3,width:`${item.count/Math.max(1,atlasUniverseWorks.length)*100}%`,backgroundColor:item.color}}/></View></View>)}
            {!breakdown.length?<Text style={{color:p.muted}}>Add books to reveal your library’s patterns.</Text>:null}
            {atlasBreakdown==='Published year'?<Text style={[styles.meta,{color:p.muted}]}>Dates come from recorded metadata. Books without a verified publication date are grouped as not recorded.</Text>:null}
          </View><Text style={[styles.atlasHint,{color:p.muted}]}>Pinch, pan and explore</Text>
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
    const darkStats=p.paper==='#07111D';
    const statsPalette={
      canvas:darkStats?'#07111D':'#F7F7F5',
      panel:darkStats?'#0B1725':'#FFFFFF',
      panelRaised:darkStats?'#0E1C2C':'#FAFAF8',
      line:darkStats?'#26364A':'#D9D7D0',
      ink:darkStats?'#F3F0E8':'#111316',
      muted:darkStats?'#A9B4C5':'#68717D',
      gold:darkStats?'#E3BC67':'#A67C2E',
      goldSoft:darkStats?'#7F6841':'#EADDBF',
      blue:darkStats?'#8FB5D1':'#6C8EA8',
      blueDeep:darkStats?'#435B78':'#98AABD',
      teal:darkStats?'#89C7CB':'#6EA3A5',
      mint:darkStats?'#73DDB0':'#4FA97F',
    };
    const currentYear=new Date().getFullYear();
    const completed=summary.completed;
    const completedGoal=Math.max(1,summary.completedGoal.target);
    const progressRemaining=Math.max(0,completedGoal-completed);
    const progressPercent=Math.min(100,Math.round(completed/completedGoal*100));
    const totalActivitySeconds=summary.recentActivity.reduce((sum,item)=>sum+Math.max(0,item.activeSeconds||0),0);
    const minutesRead=Math.round(totalActivitySeconds/60);
    const activeDays=Math.max(summary.activeDays,ritual.activeDays);
    const metricCards=[
      {label:'Books read',value:completed,icon:'bookOpen' as UiIconName},
      {label:'Minutes read',value:minutesRead.toLocaleString(),icon:'clock' as UiIconName},
      {label:'Reading days',value:activeDays,icon:'calendar' as UiIconName},
      {label:'Day streak',value:ritual.currentStreak,icon:'flame' as UiIconName},
    ];

    const hourTotals=Array.from({length:24},()=>0);
    for(const item of summary.recentActivity){
      const date=new Date(item.updatedAt*1000);
      hourTotals[date.getHours()]+=Math.max(0,item.activeSeconds||0);
    }
    const peakHour=hourTotals.reduce((best,value,index)=>value>hourTotals[best]?index:best,0);
    const peakValue=hourTotals[peakHour]||0;
    const peakEnd=(peakHour+3)%24;
    const displayHour=(hour:number)=>hour===0?'12':hour>12?String(hour-12):String(hour);
    const peakRange=peakValue?(displayHour(peakHour)+'–'+displayHour(peakEnd)+' '+(peakHour>=12?'PM':'AM')):'—';
    const peakShare=totalActivitySeconds?Math.round(peakValue/totalActivitySeconds*100):0;
    const maxHour=Math.max(1,...hourTotals);

    const recentDays=Array.from({length:7},(_,index)=>{
      const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()-6+index);
      return {date,key:localDay(date),label:date.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3)};
    });
    const heatRows=Array.from({length:12},(_,row)=>recentDays.map(day=>{
      let seconds=0;
      for(const item of summary.recentActivity){
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
    for(const item of summary.recentActivity){
      const genre=workById.get(item.workId)?.genre||'Other';
      genreTime.set(genre,(genreTime.get(genre)||0)+Math.max(0,item.activeSeconds||0));
    }
    const genreTimeItems:ChartItem[]=[...genreTime].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,seconds],index)=>({label,count:Math.max(1,Math.round(seconds/60)),color:chartColours[index%chartColours.length]}));
    const genreItems=genreTimeItems.length?genreTimeItems:genreCounts;
    const genreTotal=genreItems.reduce((sum,item)=>sum+item.count,0);
    const formatsTotal=formatItems.reduce((sum,item)=>sum+item.count,0);
    const statTabs=['Overview','Time','Books','Genres','Formats','Places'] as const;
    const selectedReaderStatsSection=readerStatsSection as string;

    const Legend=({items,total}:{items:ChartItem[];total:number})=><View style={styles.statsLegend}>
      {items.slice(0,6).map(item=><View key={item.label} style={styles.statsLegendRow}>
        <View style={[styles.statsLegendDot,{backgroundColor:item.color}]}/>
        <Text numberOfLines={1} style={[styles.statsLegendName,{color:statsPalette.muted}]}>{item.label}</Text>
        <Text style={[styles.statsLegendCount,{color:statsPalette.ink}]}>{item.count}</Text>
        <Text style={[styles.statsLegendPercent,{color:statsPalette.muted}]}>{Math.round(item.count/Math.max(1,total)*100)}%</Text>
      </View>)}
    </View>;

    const CardHeader=({title,subtitle,icon}:{title:string;subtitle:string;icon:UiIconName})=><View style={styles.statsCardHeader}>
      <View style={[styles.statsIconOrb,{borderColor:statsPalette.line,backgroundColor:statsPalette.panelRaised}]}><UiIcon name={icon} color={statsPalette.gold} size={19}/></View>
      <View style={{flex:1,minWidth:0}}>
        <Text style={[styles.statsCardTitle,{color:statsPalette.ink}]}>{title}</Text>
        <Text style={[styles.statsCardSubtitle,{color:statsPalette.muted}]}>{subtitle}</Text>
      </View>
      <View style={{transform:[{rotate:'-90deg'}]}}><UiIcon name="chevronDown" color={statsPalette.muted} size={16}/></View>
    </View>;

    const rhythmCard=<View style={[styles.statsHeroCard,{backgroundColor:statsPalette.panel,borderColor:statsPalette.line}]}>
      <View style={styles.statsRhythmTop}>
        <CardHeader title="Reading Rhythm" subtitle="When and how you read" icon="clock"/>
        <View style={[styles.statsMiniSegment,{borderColor:statsPalette.line,backgroundColor:statsPalette.canvas}]}>
          {['Time','Day','Month'].map((label,index)=><View key={label} style={[styles.statsMiniSegmentItem,index===0&&{borderColor:statsPalette.gold,backgroundColor:statsPalette.panelRaised}]}>
            <Text style={{color:index===0?statsPalette.ink:statsPalette.muted,fontSize:10.5,fontWeight:index===0?'600':'500'}}>{label}</Text>
          </View>)}
        </View>
      </View>
      <View style={[styles.statsRhythmBody,width>=600&&styles.statsRhythmBodyWide]}>
        <View style={[styles.statsRhythmDial,{width:width>=600?250:176,height:width>=600?250:176}]}>
          {hourTotals.map((value,index)=>{
            const size=width>=600?250:176;
            const ring=index%2===0?size/2-15:size/2-26;
            const angle=index/24*Math.PI*2-Math.PI/2;
            const intensity=value/maxHour;
            return <View key={'outer-'+index} style={{
              position:'absolute',
              left:size/2+Math.cos(angle)*ring-5,
              top:size/2+Math.sin(angle)*ring-12,
              width:10,
              height:24,
              borderRadius:3,
              backgroundColor:value?statsPalette.gold:statsPalette.blueDeep,
              opacity:value?0.30+intensity*.70:.35,
              transform:[{rotate:(index/24*360)+'deg'}],
            }}/>;
          })}
          {hourTotals.map((value,index)=>{
            const size=width>=600?250:176;
            const ring=size/2-47;
            const angle=index/24*Math.PI*2-Math.PI/2;
            const intensity=value/maxHour;
            return <View key={'inner-'+index} style={{
              position:'absolute',
              left:size/2+Math.cos(angle)*ring-3,
              top:size/2+Math.sin(angle)*ring-9,
              width:6,
              height:18,
              borderRadius:2,
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
              const bg=value?statsPalette.gold:statsPalette.panelRaised;
              return <View key={index} style={[styles.statsHeatCell,{backgroundColor:bg,borderColor:statsPalette.line,opacity:value?0.28+ratio*.72:1}]}/>;
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
      </View>
    </View>;

    const readingProgressCard=<View style={[styles.statsDashboardCard,{backgroundColor:statsPalette.panel,borderColor:statsPalette.line}]}>
      <CardHeader title="Reading Progress" subtitle="Annual reading goal" icon="target"/>
      <View style={styles.statsCardBody}>
        <DataRing size={116} value={String(completed)} label={'of '+completedGoal+' books'} items={[{label:'Read',count:completed,color:statsPalette.gold},{label:'Remaining',count:progressRemaining,color:statsPalette.blueDeep}]} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={12}/>
        <View style={styles.statsCardSide}>
          <Text style={[styles.statsPercent,{color:statsPalette.gold}]}>{progressPercent}%</Text>
          <View style={[styles.statsProgressTrack,{backgroundColor:statsPalette.blueDeep}]}><View style={[styles.statsProgressFill,{backgroundColor:statsPalette.gold,width:(progressPercent+'%') as any}]}/></View>
          <View style={styles.statsStatusLine}><View style={[styles.statsSmallDot,{backgroundColor:statsPalette.blue}]}/><Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>{progressRemaining} books to go</Text></View>
          <View style={styles.statsStatusLine}><View style={[styles.statsSmallDot,{backgroundColor:statsPalette.mint}]}/><Text style={[styles.statsStatusText,{color:statsPalette.mint}]}>{progressPercent>=75?'On track':'Keep going'}</Text></View>
        </View>
      </View>
    </View>;

    const formatCard=<View style={[styles.statsDashboardCard,{backgroundColor:statsPalette.panel,borderColor:statsPalette.line}]}>
      <CardHeader title="Format Breakdown" subtitle="How you read" icon="bookOpen"/>
      <View style={styles.statsCardBody}>
        <DataRing size={116} value={String(stats?.works||formatsTotal)} label="books" items={formatItems} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={12}/>
        {formatItems.length?<Legend items={formatItems} total={formatsTotal}/>:<Text style={[styles.meta,{color:statsPalette.muted,flex:1}]}>Add format metadata to reveal your mix.</Text>}
      </View>
    </View>;

    const genreCard=<View style={[styles.statsDashboardCard,{backgroundColor:statsPalette.panel,borderColor:statsPalette.line}]}>
      <CardHeader title="Genre Reading Time" subtitle="Time spent in each genre" icon="layers"/>
      <View style={styles.statsCardBody}>
        <DataRing size={116} value={genreTimeItems.length?minutesRead.toLocaleString():String(genreTotal)} label={genreTimeItems.length?'minutes':'books'} items={genreItems} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={12}/>
        {genreItems.length?<Legend items={genreItems} total={genreTotal}/>:<Text style={[styles.meta,{color:statsPalette.muted,flex:1}]}>Genre activity will appear as you read.</Text>}
      </View>
    </View>;

    const paceCard=<View style={[styles.statsDashboardCard,{backgroundColor:statsPalette.panel,borderColor:statsPalette.line}]}>
      <CardHeader title="Reading Pace" subtitle="Your reading speed" icon="gauge"/>
      <View style={styles.statsCardBody}>
        <DataRing size={116} value="—" label="wpm" items={[{label:'Pace',count:1,color:statsPalette.gold},{label:'Track',count:1,color:statsPalette.blue}]} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={12}/>
        <View style={styles.statsCardSide}>
          <Text style={[styles.statsPaceDelta,{color:statsPalette.gold}]}>Not tracked</Text>
          <Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>Archivist does not infer words-per-minute without reliable timing.</Text>
        </View>
      </View>
    </View>;

    const placesCard=<View style={[styles.statsDashboardCard,{backgroundColor:statsPalette.panel,borderColor:statsPalette.line}]}>
      <CardHeader title="Where You Read" subtitle="Your favourite reading spots" icon="pin"/>
      <View style={styles.statsCardBody}>
        <DataRing size={116} value="Private" label="places" items={[{label:'Private',count:1,color:statsPalette.goldSoft},{label:'Untracked',count:1,color:statsPalette.blueDeep}]} ink={statsPalette.ink} muted={statsPalette.muted} track={statsPalette.line} thickness={12}/>
        <View style={styles.statsCardSide}><Text style={[styles.statsStatusText,{color:statsPalette.muted}]}>Location is not collected. Place tracking remains private and opt-in.</Text></View>
      </View>
    </View>;

    const streakCard=<View style={[styles.statsDashboardCard,{backgroundColor:statsPalette.panel,borderColor:statsPalette.line}]}>
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
    </View>;

    const overviewCards=<View style={styles.statsCardsGrid}>{readingProgressCard}{formatCard}{genreCard}{paceCard}{placesCard}{streakCard}</View>;

    return <ScrollView style={{backgroundColor:statsPalette.canvas}} contentContainerStyle={styles.statsScreen}>
      <View style={styles.statsTopRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Shelf" hitSlop={8} onPress={()=>setActiveTab('shelf')} style={[styles.statsBackButton,{borderColor:statsPalette.line,backgroundColor:statsPalette.panel}]}>
          <UiIcon name="back" color={statsPalette.ink} size={20}/>
        </Pressable>
        <View style={{flex:1,minWidth:0}}>
          <Text maxFontSizeMultiplier={1.2} style={[styles.statsTitle,{color:statsPalette.ink}]}>Reader Stats</Text>
          <Text style={[styles.statsSubtitle,{color:statsPalette.muted}]}>Your reading journey</Text>
        </View>
        <View accessibilityLabel={'Statistics year '+currentYear} style={[styles.statsYearPill,{borderColor:statsPalette.goldSoft,backgroundColor:statsPalette.panel}]}>
          <Text style={[styles.statsYearText,{color:statsPalette.ink}]}>{currentYear}</Text>
          <UiIcon name="chevronDown" color={statsPalette.muted} size={14}/>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.statsTabs}>
        {statTabs.map(tab=>{
          const selected=selectedReaderStatsSection===tab;
          return <Pressable key={tab} accessibilityRole="tab" accessibilityState={{selected}} onPress={()=>setReaderStatsSection(tab)} style={[styles.statsTab,selected&&{borderColor:statsPalette.gold,backgroundColor:statsPalette.panel}]}>
            <Text style={[styles.statsTabText,{color:selected?statsPalette.ink:statsPalette.muted}]}>{tab}</Text>
          </Pressable>;
        })}
      </ScrollView>

      <View style={styles.statsMetricRow}>
        {metricCards.map(card=><View key={card.label} style={[styles.statsMetricCard,{backgroundColor:statsPalette.panel,borderColor:statsPalette.line}]}>
          <View style={[styles.statsMetricIcon,{borderColor:statsPalette.line,backgroundColor:statsPalette.panelRaised}]}><UiIcon name={card.icon} color={statsPalette.gold} size={18}/></View>
          <View style={{flex:1,minWidth:0}}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.72} style={[styles.statsMetricValue,{color:statsPalette.ink}]}>{card.value}</Text>
            <Text numberOfLines={2} style={[styles.statsMetricLabel,{color:statsPalette.muted}]}>{card.label}</Text>
          </View>
          {card.label==='Day streak'?<UiIcon name="chevronDown" color={statsPalette.muted} size={14}/>:null}
        </View>)}
      </View>

      {readerStatsSection==='Overview'?<>{rhythmCard}{overviewCards}</>:null}
      {readerStatsSection==='Time'?rhythmCard:null}
      {readerStatsSection==='Books'?<View style={styles.statsCardsGrid}>{readingProgressCard}{paceCard}{streakCard}</View>:null}
      {readerStatsSection==='Genres'?<View style={styles.statsCardsGrid}>{genreCard}</View>:null}
      {readerStatsSection==='Formats'?<View style={styles.statsCardsGrid}>{formatCard}</View>:null}
      {readerStatsSection==='Places'?<View style={styles.statsCardsGrid}>{placesCard}</View>:null}

      {profileLoading&&session?<ActivityIndicator accessibilityLabel="Loading reader statistics" color={statsPalette.gold}/>:null}
    </ScrollView>;
  }

  function Profile() {
    return <Insights/>;
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
        <Button label="Preview local works" disabled={localBooks.length===0} tone="quiet" onPress={previewLocalSortBatch}/>
        <Button label="Copy organised files" disabled={busy || localMovePreviews.every(item=>item.state!=='ready')} onPress={()=>void applyLocalSortBatch()}/>
        {moveStatus?<Text accessibilityLiveRegion="polite" style={[styles.meta,{color:p.sage}]}>{moveStatus}</Text>:null}
        {localMovePreviews.slice(0,20).map(item=><View key={item.id} style={[styles.sourceRow,{borderColor:p.line}]}>
          <Text style={{color:p.ink,fontWeight:'700'}}>{item.title}</Text>
          <Text style={{color:p.muted}}>{item.files} file{item.files===1?'':'s'} · {item.author||'Unknown author'}</Text>
          <Text style={{color:item.state==='conflict'?p.danger:item.state==='review'?p.sage:p.muted}}>To: {item.to}</Text>
          <Text style={{color:item.state==='review'?p.sage:p.muted}}>{item.state==='review'?(item.reason||'Review metadata before organising'):item.state==='conflict'?(item.reason||'Resolve destination conflict'):item.state}</Text>
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

  function Settings() {
    const connected=!!session;
    return (
      <ScrollView contentContainerStyle={styles.settingsScreen}>
        <View style={styles.pageHeadingRow}>
          <View style={{flex:1}}>
            <Text maxFontSizeMultiplier={1.15} style={[styles.settingsTitle,{color:p.ink}]}>Settings</Text>
            <Text style={[styles.pageSubtitle,{color:p.muted}]}>Your app, library and optional server.</Text>
          </View>
        </View>

        <View style={[styles.settingsColumns,width>=900&&styles.settingsColumnsWide]}>
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
              <Text style={[styles.settingsSectionTitle,{color:p.muted}]}>LIBRARY & METADATA</Text>
              <View style={styles.settingsRow}>
                <View style={{flex:1,minWidth:0}}>
                  <Text style={[styles.bookTitle,{color:p.ink}]}>On this device</Text>
                  <Text style={[styles.meta,{color:p.muted}]}>{localFolders.length} folder{localFolders.length===1?'':'s'} · {phoneWorks.length} book{phoneWorks.length===1?'':'s'} ready</Text>
                </View>
              </View>
              <View style={styles.settingsInlineActions}>
                <Pressable accessibilityRole="button" disabled={localScanning} onPress={()=>void addLocalFolder()} style={styles.settingsTextAction}><Text style={{color:localScanning?p.muted:p.sage,fontWeight:'600'}}>Add folder</Text></Pressable>
                {localFolders.length?<Pressable accessibilityRole="button" disabled={localScanning} onPress={()=>void rescanLocalFolders(false)} style={styles.settingsTextAction}><Text style={{color:localScanning?p.muted:p.sage,fontWeight:'600'}}>Refresh</Text></Pressable>:null}
                {localFolders.length?<Pressable accessibilityRole="button" disabled={localScanning} onPress={()=>void rescanLocalFolders(true)} style={styles.settingsTextAction}><Text style={{color:localScanning?p.muted:p.muted,fontWeight:'600'}}>Full rescan</Text></Pressable>:null}
              </View>
              {localFolders.map(folder=><View key={folder.uri} style={[styles.settingsListRow,{borderBottomColor:p.line}]}>
                <View style={{flex:1,minWidth:0}}>
                  <Text numberOfLines={1} style={[styles.bookTitle,{color:p.ink}]}>{folder.name}</Text>
                  <Text numberOfLines={1} style={[styles.meta,{color:p.muted}]}>{folder.itemCount} files · {folder.status}</Text>
                </View>
              </View>)}
              {localFolderNotice?<Text accessibilityLiveRegion="polite" style={[styles.meta,{color:p.sage}]}>{localFolderNotice}</Text>:null}
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
      <SafeAreaView style={[styles.screen,{backgroundColor:p.paper}]}>
        <View style={styles.restoreScreen}>
          <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Pressable accessibilityRole="button" accessibilityLabel="Open Reader Stats" onPress={()=>setActiveTab('insights')} style={{width:44,height:44,borderRadius:22,backgroundColor:p.card,borderWidth:1,borderColor:p.line,alignItems:'center',justifyContent:'center'}}><Text style={{color:p.ink,fontSize:17}}>{(profileStats?.name||'A').trim().charAt(0).toUpperCase()}</Text></Pressable><Text style={[styles.logoSmall,{color:p.ink}]}>Archivist</Text></View>
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
    {id:'player',label:'Now',icon:'bookOpen'},
    {id:'atlas',label:'Atlas',icon:'atlas'},
    {id:'insights',label:'Stats',icon:'insights'},
  ];

  return (
    <SafeAreaView style={[styles.screen, {backgroundColor:activeTab==='profile'?(theme==='dark'||(theme==='system'&&systemScheme==='dark')?'#07111D':'#F7F7F5'):p.paper}]}><AmbientGlow size={Math.max(480,width)} strength={(theme==='dark'||(theme==='system'&&systemScheme==='dark'))?.6:.22}/>
      {activeTab!=='reader'&&activeTab!=='player'&&activeTab!=='insights'&&activeTab!=='profile'?<View style={styles.appHeader}>
        <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Pressable accessibilityRole="button" accessibilityLabel="Open Reader Stats" onPress={()=>setActiveTab('insights')} style={{width:44,height:44,borderRadius:22,backgroundColor:p.card,borderWidth:1,borderColor:p.line,alignItems:'center',justifyContent:'center'}}><Text style={{color:p.ink,fontSize:17}}>{(profileStats?.name||'A').trim().charAt(0).toUpperCase()}</Text></Pressable><Text style={[styles.logoSmall,{color:p.ink}]}>Archivist</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={activeTab==='settings'?'Close Settings':'Settings'} onPress={()=>setActiveTab(activeTab==='settings'?'shelf':'settings')} style={styles.settingsButton}>
          <UiIcon name={activeTab==='settings'?'close':'settings'} color={p.muted} size={21}/>
        </Pressable>
      </View>:null}
      {error ? <View style={[styles.errorBanner,{borderTopColor:p.danger,borderBottomColor:p.danger}]}>
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
        reduceMotion={reduceMotion} paper={p.paper} ink={p.ink} muted={p.muted}
        active={celebrating || !!achievementCelebration}
        title={achievementCelebration ? achievementCelebration.title : undefined}
        copy={achievementCelebration ? achievementCelebration.description : undefined}
      />
      <RatingPromptPanel />
      {playing && activeTab!=='player' && activeTab!=='reader' ? (
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
      {activeTab!=='reader'&&activeTab!=='profile'&&activeTab!=='settings'?<View style={[styles.tabBar,{backgroundColor:p.paper,borderTopColor:p.line}]}>
        {tabs.map(tab=>{
          const selected=activeTab===tab.id;
          return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{selected}} onPress={()=>setActiveTab(tab.id)} style={styles.tab}>
            <View pointerEvents="none" style={[styles.tabIndicator,{backgroundColor:tab.id==='insights'?p.gold:p.sage,opacity:selected?1:0}]}/>
            <UiIcon name={tab.icon} color={selected?(tab.id==='insights'?p.gold:p.sage):p.muted} size={22}/>
            <Text style={[styles.tabText,{color:selected?(tab.id==='insights'?p.gold:p.sage):p.muted}]}>{tab.label}</Text>
          </Pressable>;
        })}
      </View>:null}
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ArchivistEditorial: require('./assets/fonts/LibreCaslonText.ttf')});
  const system = useColorScheme();
  if (!fontsLoaded && !fontError) return <View accessibilityLabel="Opening Archivist" style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:system==='dark'?'#07111D':'#FFFFFF'}}><ActivityIndicator color="#47736F" /></View>;
  return <SafeAreaProvider><Client /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  screen: {flex: 1},
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
  libraryRail: {width:208,borderRightWidth:StyleSheet.hairlineWidth,paddingHorizontal:16,paddingTop:24,paddingBottom:20,gap:6},
  libraryRailFold: {width:164,paddingHorizontal:12,paddingTop:20},
  libraryRailTitle: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.4,marginBottom:2},
  libraryRailList: {gap:2},
  libraryRailAdd: {minHeight:40,paddingHorizontal:10,justifyContent:'center'},
  libraryChoice: {borderWidth: 0, borderRadius: 999, paddingHorizontal: 13, minHeight: 40, justifyContent: 'center'},
  libraryChoiceVertical: {borderRadius: 10, minHeight: 44},
  libraryChipsScroll: {flexGrow:0,minHeight:46,maxHeight:50},
  libraryChips: {gap:8,paddingVertical:2,minHeight:46},
  libraryChipsRow: {flexDirection: 'row', gap: 20},
  librarySpaceTab: {minHeight:44,justifyContent:'center',position:'relative',paddingHorizontal:1},
  librarySpaceTabVertical: {minHeight:42,paddingHorizontal:10},
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
  continueRow: {gap:12,paddingRight:6},
  continueCard: {width:132,gap:6},
  continueTitle: {fontSize:14,fontWeight:'800'},
  seriesChip: {minWidth:140,maxWidth:220,borderWidth:0,borderRadius:12,paddingHorizontal:14,paddingVertical:12,gap:2},
  scanBanner: {borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12},
  onboardingCard: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:12},
  onboardingEyebrow: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.5},
  onboardingTitle: {fontFamily:'ArchivistEditorial',fontSize:20,lineHeight:25,fontWeight:'500',letterSpacing:-.15},
  onboardingIntro: {fontSize:13,lineHeight:19,maxWidth:560},
  onboardingStep: {flexDirection:'row',gap:12,alignItems:'flex-start',paddingVertical:2},
  onboardingNumber: {width:24,fontSize:11,lineHeight:18,fontWeight:'700',letterSpacing:.7,textAlign:'left'},
  onboardingStepTitle: {fontSize:13.5,lineHeight:18,fontWeight:'600',marginBottom:2},
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
  errorBanner: {marginHorizontal:18,marginTop:4,borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,borderRadius:0,flexDirection:'row',alignItems:'center'},
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
  bookTitle: {fontSize:13.5,lineHeight:18,fontWeight:'600'},
  reviewPill: {alignSelf:'flex-start', borderWidth:1, borderRadius:999, paddingHorizontal:8, paddingVertical:3},
  editorCard: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:16,gap:10},
  metadataInlineFields: {flexDirection:'row',gap:8},
  metadataInlineInput: {flex:1,minWidth:0},
  metadataTools: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:12,marginTop:2,gap:9},
  metadataCandidate: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:12},
  metadataConfidence: {fontSize:11.5,lineHeight:16,fontWeight:'600',marginTop:2},
  serverRecovery: {borderWidth:0,borderRadius:14,padding:16,gap:10},
  offlineSummary: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,flexDirection:'row',gap:12,alignItems:'center'},
  ratingPromptBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.46)',alignItems:'center',justifyContent:'center',padding:24},
  ratingPromptCard: {width:'100%',maxWidth:400,borderWidth:0,borderRadius:18,padding:18,gap:9},
  modalKeyboard: {flex:1},
  modalBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.46)',alignItems:'center',justifyContent:'center',padding:20},
  modalScroll: {flexGrow:1,width:'100%',alignItems:'center',justifyContent:'center',paddingVertical:20},
  modalCard: {width:'100%',maxWidth:520,borderWidth:0,borderRadius:18,padding:18,gap:9},
  meta: {fontSize: 13, lineHeight: 19},
  playerScreen: {paddingHorizontal:18,paddingTop:12,gap:14,paddingBottom:96,maxWidth:1120,width:'100%',alignSelf:'center'},
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
  playerIdentity: {alignItems:'center',gap:4,paddingHorizontal:8,maxWidth:620},
  playerStatusRow: {flexDirection:'row',flexWrap:'wrap',justifyContent:'center',alignItems:'center',gap:8,minHeight:20},
  playerSourcePill: {borderWidth:0,minHeight:28,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},
  playerStatusText: {fontSize:11,lineHeight:16},
  playerStatusAction: {minHeight:36,justifyContent:'center',paddingHorizontal:2},
  nowTitle: {fontFamily:'ArchivistEditorial',fontSize:25,lineHeight:30,fontWeight:'500',textAlign:'center',marginTop:0,letterSpacing:-.2,maxWidth:620},
  nowTitleCompact: {fontSize:22,lineHeight:27},
  nowTitleFold: {fontSize:24,lineHeight:29},
  playerByline: {fontSize:13,lineHeight:18,textAlign:'center'},
  playerChapter: {fontSize:12,lineHeight:17,fontWeight:'600',textAlign:'center',marginTop:2},
  progressHitArea: {paddingVertical:10},
  progressTrack: {height:4,borderRadius:999,overflow:'hidden'},
  progressFill: {height:4,borderRadius:999},
  timeRow: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:-6},
  playerTime: {fontSize:12,fontVariant:['tabular-nums'],fontWeight:'500'},
  transport: {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:28,marginVertical:6},
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
  playerEmpty: {borderWidth:0,padding:32,gap:10,alignItems:'center',justifyContent:'center',minHeight:260,maxWidth:420,alignSelf:'center'},
  toolRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between'},
  readerScreen: {flex:1,position:'relative'},
  readerBar: {position:'absolute',left:0,right:0,top:0,zIndex:25,minHeight:44,flexDirection:'row',alignItems:'center',paddingHorizontal:2,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'rgba(127,127,127,.16)'},
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
  tabBar: {height:60,borderTopWidth:StyleSheet.hairlineWidth,flexDirection:'row'},
  tab: {flex:1,alignItems:'center',justifyContent:'center',gap:2,position:'relative'},
  tabIndicator: {position:'absolute',top:0,width:18,height:2,borderRadius:1},
  tabText: {fontSize:9.5,lineHeight:12,fontWeight:'600'},
  celebration: {position:'absolute', left:0, right:0, top:0, bottom:0, alignItems:'center', justifyContent:'center', zIndex:50},
  celebrationParticle: {position:'absolute',fontSize:28,color:'#B99A68',fontWeight:'700'},
  celebrationBadge: {backgroundColor:'#111111',borderRadius:18,width:'86%',maxWidth:400,paddingHorizontal:24,paddingVertical:28,alignItems:'center',shadowColor:'#000',shadowOpacity:.18,shadowRadius:14,elevation:8},
  celebrationTitle: {color:'#F5F5F5',fontSize:18,lineHeight:23,fontWeight:'600'},
  celebrationCopy: {color:'#A0A0A0',fontSize:12.5,lineHeight:18,marginTop:3},
  profileScreen: {paddingHorizontal:18,paddingTop:18,paddingBottom:100,gap:22,maxWidth:920,width:'100%',alignSelf:'center'},
  settingsScreen: {paddingHorizontal:18,paddingTop:18,paddingBottom:100,gap:22,maxWidth:1060,width:'100%',alignSelf:'center'},
  settingsTitle: {fontFamily:'ArchivistEditorial',fontSize:30,lineHeight:36,fontWeight:'500',letterSpacing:-.4},
  settingsColumns: {gap:22},
  settingsColumnsWide: {flexDirection:'row',alignItems:'flex-start',gap:36},
  settingsColumn: {flex:1,minWidth:0,gap:22},
  settingsSection: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:14,gap:10},
  settingsSectionTitle: {fontSize:9.5,lineHeight:13,fontWeight:'700',letterSpacing:1.45},
  settingsRow: {minHeight:46,flexDirection:'row',alignItems:'center',gap:12},
  settingsStatusDot: {width:8,height:8,borderRadius:4},
  settingsTextAction: {minHeight:38,paddingHorizontal:2,alignItems:'center',justifyContent:'center'},
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
  atlasNodeMonogram: {fontFamily:'sans-serif-medium',fontSize:15,fontWeight:'700'},
  atlasNodeCount: {fontSize:10,fontWeight:'900',marginTop:2},
  atlasNodeSourceDot: {position:'absolute',right:4,bottom:4,width:8,height:8,borderRadius:4,borderWidth:1,borderColor:'#f8f7f2'},
  atlasViewportTools: {position:'absolute',right:8,top:8,zIndex:20,flexDirection:'row',gap:4},
  atlasZoomButton: {borderWidth:0},
  atlasToolButton: {minHeight:38,paddingHorizontal:10,borderRadius:8,alignItems:'center',justifyContent:'center'},
  atlasFindButton: {height:46,paddingHorizontal:16,borderRadius:12,alignItems:'center',justifyContent:'center'},
  atlasFindText: {color:'#FFFFFF',fontSize:14,fontWeight:'600'},
  atlasClusterNotice: {position:'absolute',left:10,bottom:10,maxWidth:320,borderWidth:0,borderRadius:0,paddingHorizontal:6,paddingVertical:4,opacity:.88},
  atlasInspector: {borderWidth:0,padding:14,gap:8,zIndex:25},
  atlasInspectorMobile: {position:'absolute',left:12,right:12,bottom:12,borderTopLeftRadius:20,borderTopRightRadius:20,shadowColor:'#000',shadowOpacity:.10,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:5},
  atlasInspectorWide: {width:236,minHeight:220,alignSelf:'stretch',borderLeftWidth:StyleSheet.hairlineWidth,borderRadius:0,paddingHorizontal:18},

  atlasScreen: {paddingHorizontal:18,paddingTop:18,paddingBottom:100,gap:16,maxWidth:1280,width:'100%',alignSelf:'center'},
  atlasTitle: {fontFamily:'ArchivistEditorial',fontSize:30,lineHeight:36,fontWeight:'500',letterSpacing:-.4},
  atlasFocusTitle: {fontFamily:'ArchivistEditorial',fontSize:28,lineHeight:34,fontWeight:'500',letterSpacing:-.35},
  atlasListAlternative: {gap:0},
  atlasHint: {fontSize:10.5,lineHeight:15,textAlign:'center',letterSpacing:.2},
  insightsScreen: {paddingHorizontal:18,paddingTop:18,paddingBottom:100,gap:24,maxWidth:1120,width:'100%',alignSelf:'center'},
  insightsTitle: {fontFamily:'ArchivistEditorial',fontSize:30,lineHeight:36,fontWeight:'500',letterSpacing:-.4},
  sourceSwitcherScroll: {flexGrow:0,minHeight:48,maxHeight:52},
  sourceSwitcher: {flexDirection:'row',gap:20,paddingRight:14,paddingVertical:2,minHeight:48,alignItems:'stretch'},
  sourceSwitcherVertical: {gap:0},
  sourceTab: {minHeight:46,justifyContent:'center',position:'relative',paddingHorizontal:1},
  sourceTabVertical: {paddingHorizontal:10,minHeight:42},
  sourceTabText: {fontSize:13},
  sourceTabCount: {fontSize:11,fontWeight:'600'},
  sourceTabMarker: {position:'absolute',left:0,right:0,bottom:1,height:2,borderRadius:2},
  sourceTabMarkerVertical: {position:'absolute',left:0,top:10,bottom:10,width:3,borderRadius:3},
  shelfContent: {paddingHorizontal:18,paddingTop:20,paddingBottom:120,gap:32,maxWidth:1280,width:'100%',alignSelf:'center'},
  shelfContentFold: {paddingHorizontal:24,paddingTop:22,gap:34},
  shelfEditorialHeader: {flexDirection:'row',alignItems:'flex-start',gap:16,paddingTop:2,paddingBottom:0},
  shelfEditorialHeaderFold: {paddingTop:0},
  shelfKicker: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:2.2,marginBottom:7},
  shelfGreeting: {fontFamily:'ArchivistEditorial',fontSize:34,lineHeight:40,fontWeight:'500',letterSpacing:-.55},
  shelfGreetingCompact: {fontSize:30,lineHeight:36},
  shelfGreetingFold: {fontSize:36,lineHeight:42},
  shelfEditorialSubtitle: {fontFamily:'sans-serif',fontSize:14,lineHeight:20,fontStyle:'italic',marginTop:3,maxWidth:320},
  shelfBrowseBand: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,gap:8},
  shelfBrowseLabel: {fontSize:9,lineHeight:12,fontWeight:'700',letterSpacing:1.8},
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
  shelfUtilityAction: {minHeight:40,paddingHorizontal:0,paddingRight:8,justifyContent:'center'},
  brandSignature: {fontSize:10,fontWeight:'700',letterSpacing:3,textAlign:'center',marginTop:8},
  designedEmpty: {borderWidth:0,padding:28,gap:10,alignItems:'center',justifyContent:'center',minHeight:180},
  emptyMark: {fontFamily:'serif',fontSize:34,fontWeight:'800'},
  skeletonRow: {flexDirection:'row',gap:12,overflow:'hidden'},
  skeletonCard: {width:132,height:198,borderRadius:12,opacity:0.45},
  unifiedCard: {flex:1,minWidth:0,gap:6,position:'relative'},
  unifiedCardQuickOpen: {transform:[{scale:.985}]},
  unifiedCardList: {flexDirection:'row',alignItems:'center',gap:14,paddingVertical:10},
  unifiedCardSelected: {borderWidth:1,borderRadius:12,padding:4},
  unifiedCoverWrap: {position:'relative'},
  unifiedCoverWrapList: {width:68},
  coverQuickActions: {position:'absolute',top:0,right:0,bottom:0,left:0,zIndex:8,backgroundColor:'rgba(4,12,20,.68)',borderRadius:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,padding:8},
  coverQuickButton: {minWidth:62,minHeight:48,borderRadius:12,backgroundColor:'rgba(0,0,0,.42)',alignItems:'center',justifyContent:'center',gap:4,paddingHorizontal:10},
  coverQuickText: {color:'#FFFFFF',fontSize:11.5,lineHeight:15,fontWeight:'700'},
  unifiedCardCopy: {gap:2,minWidth:0,paddingHorizontal:1},
  unifiedListMeta: {flexDirection:'row',alignItems:'center',gap:6,marginTop:2},
  workSourceDot: {width:5,height:5,borderRadius:3},
  workSource: {fontSize:11,fontWeight:'500',flexShrink:1},
  workRating: {fontSize:11,fontWeight:'600',marginLeft:'auto'},
  moreButton: {position:'absolute',right:4,top:4,width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',opacity:.9},
  moreButtonList: {right:4,top:4},
  offlineBadge: {position:'absolute',left:7,bottom:7,borderRadius:999,paddingHorizontal:7,paddingVertical:4},
  offlineBadgeText: {color:'#F8F7F2',fontSize:9,fontWeight:'900',letterSpacing:0.8},
  cardPressed: {opacity:0.72},
  actionSheet: {width:'100%',maxWidth:620,borderWidth:0,borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,gap:9,alignSelf:'center'},
  actionSheetFold: {width:420,maxWidth:420,height:'100%',borderTopLeftRadius:24,borderBottomLeftRadius:24,borderTopRightRadius:0,paddingHorizontal:22,paddingVertical:24,alignSelf:'flex-end'},
  sheetBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.46)',justifyContent:'flex-end',padding:12},
  sheetBackdropFold: {justifyContent:'center',alignItems:'flex-end',padding:0},
  sheetScroll: {flexGrow:1,justifyContent:'flex-end'},
  sheetHandle: {width:36,height:3,borderRadius:2,backgroundColor:'#9aa9a6',alignSelf:'center',marginBottom:6,opacity:.5},
  sheetHandleFold: {display:'none'},
  sheetHeader: {flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:4},
  sheetTitle: {fontFamily:'sans-serif-medium',fontSize:18,lineHeight:23,fontWeight:'500'},
  sheetCloseButton: {width:40,height:40,borderRadius:10,alignItems:'center',justifyContent:'center',marginTop:-5,marginRight:-5},
  sheetActionList: {marginTop:2},
  sheetAction: {minHeight:46,borderBottomWidth:StyleSheet.hairlineWidth,justifyContent:'center',paddingVertical:10},
  sheetActionText: {fontSize:13.5,lineHeight:19,fontWeight:'500'},

  manageRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:8},
  visibilityToggle: {width:40,height:24,borderRadius:12,padding:3,alignItems:'flex-start',justifyContent:'center'},
  visibilityThumb: {width:18,height:18,borderRadius:9,shadowColor:'#000',shadowOpacity:.14,shadowRadius:2,shadowOffset:{width:0,height:1},elevation:2},
  orderButton: {width:44,height:44,alignItems:'center',justifyContent:'center'},
  libraryTwoPane: {flex:1,flexDirection:'row'},
  libraryMain: {flex:1,paddingHorizontal:18,paddingTop:18,gap:14},
  libraryMainFold: {paddingHorizontal:24,paddingTop:20,gap:16},
  libraryMainWide: {paddingHorizontal:28,paddingTop:24,gap:18},
  libraryCatalogueHeader: {gap:2,paddingBottom:2},
  libraryKicker: {fontSize:10,lineHeight:14,fontWeight:'700',letterSpacing:2.0},
  libraryTitle: {fontFamily:'ArchivistEditorial',fontSize:36,lineHeight:44,fontWeight:'500',letterSpacing:-.4},
  libraryTitleCompact: {fontSize:32,lineHeight:40},
  libraryTitleFold: {fontSize:40,lineHeight:48},
  librarySearchRow: {flexDirection:'row',alignItems:'center',gap:6},
  librarySearchShell: {flex:1,minHeight:44,borderRadius:10,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:12},
  librarySearch: {flex:1,borderWidth:0,minHeight:44,paddingHorizontal:0,fontSize:14},
  libraryUtilityButton: {width:44,height:44,borderRadius:10,alignItems:'center',justifyContent:'center',position:'relative'},
  libraryFilterCount: {position:'absolute',right:3,top:2,minWidth:16,height:16,borderRadius:8,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
  libraryFilterCountText: {color:'#FFFFFF',fontSize:9,fontWeight:'700'},
  libraryFormatTabs: {gap:22,paddingRight:18,minHeight:42,paddingVertical:1,alignItems:'stretch'},
  libraryFormatTab: {minHeight:40,justifyContent:'center',position:'relative'},
  libraryFormatText: {fontSize:13,lineHeight:18},
  libraryFormatMarker: {position:'absolute',left:0,right:0,bottom:1,height:2,borderRadius:2},
  libraryToolbar: {flexDirection:'row',alignItems:'center',gap:8},
  quickFilters: {gap:4,paddingRight:8},
  quickFilter: {borderWidth:0,borderRadius:10,minHeight:40,paddingHorizontal:10,alignItems:'center',justifyContent:'center'},
  toolbarButton: {borderWidth:0,borderRadius:10,minHeight:40,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},
  librarySelectionBar: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,minHeight:52,flexDirection:'row',alignItems:'center',gap:8,paddingVertical:6},
  librarySelectionAction: {minHeight:40,paddingHorizontal:6,alignItems:'center',justifyContent:'center'},
  unifiedGrid: {paddingBottom:120,gap:16,paddingTop:2},
  unifiedGridRow: {gap:10},
  unifiedList: {paddingBottom:120,gap:4},
  selectionToolbar: {borderWidth:1,borderRadius:14,padding:10,flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'},
  selectionCount: {fontSize:13,fontWeight:'900'},
  reviewQueue: {gap:10,paddingBottom:10},
  reviewAssetCard: {borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,paddingHorizontal:2,flexDirection:'row',alignItems:'center',gap:12},
  reviewAssetCopy: {flex:1,minWidth:0,gap:2},
  filterLabel: {fontSize:10,fontWeight:'900',letterSpacing:1.4,marginTop:6},
  filterWrap: {flexDirection:'row',flexWrap:'wrap',gap:7},
  filterChip: {borderWidth:0,borderRadius:9,minHeight:38,paddingHorizontal:11,alignItems:'center',justifyContent:'center'},
  duplicatePanel: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,gap:10},
  duplicateGroup: {borderWidth:0,borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:12,gap:7},
  duplicateExact: {borderWidth:0,borderLeftWidth:2,paddingLeft:10,paddingVertical:6,gap:4},
  ruleGroup: {borderWidth:0,borderLeftWidth:2,paddingLeft:12,paddingVertical:8,gap:8},
  ruleRow: {borderTopWidth:StyleSheet.hairlineWidth,paddingTop:8,flexDirection:'row',flexWrap:'wrap',gap:6,alignItems:'center'},
  ruleToken: {borderWidth:0,borderRadius:8,minHeight:36,paddingHorizontal:9,alignItems:'center',justifyContent:'center'},
  ruleInput: {borderWidth:0,borderRadius:9,minHeight:38,paddingHorizontal:10,flexGrow:1,minWidth:92},
  ruleRemove: {width:34,height:34,alignItems:'center',justifyContent:'center'},
  statsScreen: {paddingHorizontal:16,paddingTop:10,paddingBottom:112,gap:12,maxWidth:980,width:'100%',alignSelf:'center'},
  statsTopRow: {minHeight:64,flexDirection:'row',alignItems:'center',gap:12},
  statsBackButton: {width:44,height:44,borderRadius:22,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center'},
  statsTitle: {fontFamily:'ArchivistEditorial',fontSize:29,lineHeight:35,fontWeight:'500',letterSpacing:-.25},
  statsSubtitle: {fontSize:11.5,lineHeight:16,fontWeight:'500',marginTop:1},
  statsYearPill: {minWidth:78,height:40,borderRadius:20,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  statsYearText: {fontSize:12.5,lineHeight:18,fontWeight:'500',fontVariant:['tabular-nums']},
  statsTabs: {gap:2,paddingBottom:1,minWidth:'100%',justifyContent:'space-between'},
  statsTab: {minHeight:44,minWidth:66,borderRadius:22,borderWidth:StyleSheet.hairlineWidth,borderColor:'transparent',paddingHorizontal:12,alignItems:'center',justifyContent:'center'},
  statsTabText: {fontFamily:'ArchivistEditorial',fontSize:12,lineHeight:17,fontWeight:'500'},
  statsMetricRow: {flexDirection:'row',gap:6},
  statsMetricCard: {flex:1,minWidth:0,minHeight:74,borderRadius:15,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:9,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:7},
  statsMetricIcon: {width:34,height:34,borderRadius:17,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center',flexShrink:0},
  statsMetricValue: {fontFamily:'ArchivistEditorial',fontSize:17,lineHeight:21,fontWeight:'500',fontVariant:['tabular-nums']},
  statsMetricLabel: {fontSize:9.5,lineHeight:12.5,fontWeight:'500',marginTop:1},
  statsHeroCard: {borderRadius:20,borderWidth:StyleSheet.hairlineWidth,padding:14,gap:12},
  statsRhythmTop: {flexDirection:'row',alignItems:'flex-start',gap:10},
  statsCardHeader: {flex:1,flexDirection:'row',alignItems:'center',gap:9,minWidth:0},
  statsIconOrb: {width:38,height:38,borderRadius:19,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center',flexShrink:0},
  statsCardTitle: {fontFamily:'ArchivistEditorial',fontSize:16,lineHeight:20,fontWeight:'500',letterSpacing:-.05},
  statsCardSubtitle: {fontSize:9.8,lineHeight:13.5,fontWeight:'500',marginTop:1},
  statsMiniSegment: {height:38,borderRadius:19,borderWidth:StyleSheet.hairlineWidth,flexDirection:'row',padding:2,alignItems:'center'},
  statsMiniSegmentItem: {height:32,minWidth:48,borderRadius:16,borderWidth:StyleSheet.hairlineWidth,borderColor:'transparent',paddingHorizontal:8,alignItems:'center',justifyContent:'center'},
  statsRhythmBody: {flexDirection:'row',alignItems:'center',gap:12},
  statsRhythmBodyWide: {gap:28},
  statsRhythmDial: {position:'relative',alignItems:'center',justifyContent:'center',flexShrink:0},
  statsRhythmDialInner: {width:'57%',height:'57%',borderRadius:999,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center',padding:8},
  statsDialKicker: {fontSize:9,lineHeight:11.5,fontWeight:'500',textAlign:'center'},
  statsDialValue: {fontFamily:'ArchivistEditorial',fontSize:18,lineHeight:22,fontWeight:'500',marginVertical:2},
  statsDialMeta: {fontSize:8.5,lineHeight:11,textAlign:'center'},
  statsClockTop: {position:'absolute',top:2,fontFamily:'ArchivistEditorial',fontSize:10.5},
  statsClockRight: {position:'absolute',right:2,fontFamily:'ArchivistEditorial',fontSize:10.5},
  statsClockBottom: {position:'absolute',bottom:2,fontFamily:'ArchivistEditorial',fontSize:10.5},
  statsClockLeft: {position:'absolute',left:2,fontFamily:'ArchivistEditorial',fontSize:10.5},
  statsHeatmapWrap: {flex:1,minWidth:0,gap:2},
  statsHeatHeader: {flexDirection:'row',alignItems:'center',gap:3,marginBottom:2},
  statsHeatDay: {flex:1,textAlign:'center',fontSize:8,lineHeight:10,fontWeight:'600'},
  statsHeatRow: {flexDirection:'row',alignItems:'center',gap:3},
  statsHeatTime: {width:34,fontSize:7.5,lineHeight:9.5,fontWeight:'500'},
  statsHeatCell: {flex:1,height:10,borderRadius:3,borderWidth:StyleSheet.hairlineWidth},
  statsHeatLegend: {flexDirection:'row',alignItems:'center',gap:4,marginTop:6},
  statsHeatLegendDot: {width:8,height:8,borderRadius:4},
  statsHeatLegendText: {fontSize:7.8,lineHeight:10.5},
  statsCardsGrid: {flexDirection:'row',flexWrap:'wrap',gap:10},
  statsDashboardCard: {width:'48.5%',minWidth:154,borderRadius:18,borderWidth:StyleSheet.hairlineWidth,padding:13,gap:12,flexGrow:1,flexBasis:180},
  statsCardBody: {flexDirection:'row',alignItems:'center',gap:10},
  statsCardSide: {flex:1,minWidth:0,gap:7},
  statsLegend: {flex:1,minWidth:0,gap:5},
  statsLegendRow: {flexDirection:'row',alignItems:'center',gap:5,minWidth:0},
  statsLegendDot: {width:7,height:7,borderRadius:4,flexShrink:0},
  statsLegendName: {flex:1,minWidth:0,fontSize:8.5,lineHeight:11},
  statsLegendCount: {fontSize:8.5,lineHeight:11,fontWeight:'600',fontVariant:['tabular-nums']},
  statsLegendPercent: {width:25,textAlign:'right',fontSize:8.3,lineHeight:11,fontVariant:['tabular-nums']},
  statsPercent: {fontFamily:'ArchivistEditorial',fontSize:19,lineHeight:23,fontWeight:'500'},
  statsProgressTrack: {height:10,borderRadius:5,overflow:'hidden'},
  statsProgressFill: {height:'100%',borderRadius:5},
  statsStatusLine: {flexDirection:'row',alignItems:'center',gap:6},
  statsSmallDot: {width:9,height:9,borderRadius:5},
  statsStatusText: {fontSize:9.5,lineHeight:13,fontWeight:'500'},
  statsPaceDelta: {fontFamily:'ArchivistEditorial',fontSize:16,lineHeight:20,fontWeight:'500'},
  statsStreakTop: {flexDirection:'row',alignItems:'stretch',gap:12},
  statsStreakValue: {fontFamily:'ArchivistEditorial',fontSize:17,lineHeight:22,fontWeight:'500'},
  statsVerticalRule: {width:StyleSheet.hairlineWidth},
  statsWeekDots: {flexDirection:'row',justifyContent:'space-between',gap:5,paddingTop:4},
  statsWeekDay: {flex:1,alignItems:'center',gap:5},
  statsWeekDot: {width:17,height:17,borderRadius:9,borderWidth:StyleSheet.hairlineWidth},
  statsWeekLabel: {fontSize:8.5,lineHeight:11,fontWeight:'600'},
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
  insightGoalInput: {width:54,borderWidth:0,borderBottomWidth:StyleSheet.hairlineWidth,borderRadius:0,minHeight:36,paddingHorizontal:4,textAlign:'center',fontSize:13,fontWeight:'600',fontVariant:['tabular-nums']},
  insightActivityRow: {borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:12,flexDirection:'row',gap:10,alignItems:'center'},
  activityMarker: {width:7,height:7,borderRadius:4},
  annotationHubCard: {borderWidth:0,borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:14,gap:7},
  insightAchievementStrip: {flexDirection:'row',gap:18,paddingRight:18},
  insightAchievementEditorial: {width:108,alignItems:'center',gap:6},
  insightAchievementBadge: {width:56,height:56,borderRadius:28,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  insightAchievementMonogram: {fontFamily:'sans-serif-medium',fontSize:20,fontWeight:'500'},
  insightAchievement: {borderWidth:0,padding:11,minWidth:140,flexGrow:1},

});
