import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import {SavedQueue, reorder} from './queue';
import {LocalBook, LocalFolder, LocalMetadataOverride, LocalScanProgress, LocalSortHistory, LocalSortPreview, applyLocalSortCopies, pickLocalFolder, previewLocalSort, removeLocalSortCopies, scanLocalFolders} from './localLibrary';
import {LocalReaderDocument, buildLocalReaderDocument} from './localReader';
import {groupLocalWorks, LocalWork} from './localWorks';
import {Achievement, achievementsFor, clampProgress, VerifiedProfileStats} from './profileStats';
import {AtlasKind, buildAtlasRelationship} from './atlas';
import {possibleLocalDuplicateGroups} from './duplicates';
import {buildLegacyAtlasRelationship, normalizeAtlasRelationship, normalizeLibrarySummary, normalizeServerWork} from './serverCompatibility';
import {getPersistedJSON, setPersistedJSON} from './stateStore';
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
type ServerAtlasRelationship = {
  kind: AtlasKind;
  value: string;
  workCount: number;
  works: ServerWork[];
  authors: SummaryItem[];
  series: SummaryItem[];
  genres?: SummaryItem[];
  formats: SummaryItem[];
  spaces: SummaryItem[];
  availability?: SummaryItem[];
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
type Tab = 'shelf' | 'library' | 'player' | 'reader' | 'atlas' | 'insights' | 'profile' | 'settings';
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

function validateServer(raw: string) {
  return checkServer(raw, __DEV__);
}

function palette(mode: ThemeMode, system: string | null | undefined): Palette {
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return {
    ink: dark ? '#f8f7f2' : '#0f2a36',
    paper: dark ? '#081318' : '#f8f7f2',
    muted: dark ? '#9fb3b0' : '#627672',
    line: dark ? '#203840' : '#d9dfdc',
    card: dark ? '#0d2027' : '#fffdfa',
    raised: dark ? '#132b34' : '#ffffff',
    sage: '#397076',
    gold: '#c6a374',
    ivory: '#f8f7f2',
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

function Button({label, onPress, disabled, tone = 'primary'}: {label: string; onPress: () => void; disabled?: boolean; tone?: 'primary' | 'quiet' | 'gold'}) {
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
        (disabled || pressed) && {opacity: disabled ? 0.45 : 0.78},
      ]}
      onPress={onPress}>
      <Text style={[styles.buttonText, tone === 'quiet' && styles.buttonQuietText]}>{label}</Text>
    </Pressable>
  );
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
  const [theme, setTheme] = useState<ThemeMode>('system');
  const p = useMemo(() => palette(theme, systemScheme), [theme, systemScheme]);
  const [session, setSession] = useState<Session | null>(null);
  const [recoverableSession, setRecoverableSession] = useState<Session | null>(null);
  const [server, setServer] = useState('');
  const [key, setKey] = useState('');
  const [serverPanelOpen, setServerPanelOpen] = useState(false);
  const [serverNotice, setServerNotice] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [serverWorks, setServerWorks] = useState<ServerWork[]>([]);
  const [continueWorks, setContinueWorks] = useState<ServerWork[]>([]);
  const [serverSummary, setServerSummary] = useState<LibrarySummary | null>(null);
  const [serverProfileStats, setServerProfileStats] = useState<VerifiedProfileStats | null>(null);
  const [serverPreferences,setServerPreferences]=useState<Record<number,PersonalPreference>>({});
  const [localPreferences,setLocalPreferences]=useState<Record<string,PersonalPreference>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [atlasFocus,setAtlasFocus]=useState<{kind:AtlasKind;value:string}|null>(null);
  const [serverAtlasRelationship,setServerAtlasRelationship]=useState<ServerAtlasRelationship|null>(null);
  const [atlasLoading,setAtlasLoading]=useState(false);
  const [atlasCompatibility,setAtlasCompatibility]=useState(false);
  const [duplicatePanelOpen,setDuplicatePanelOpen]=useState(false);
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
  const [playing, setPlaying] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shelf');
  const player = useAudioPlayer(null);
  const audio = useAudioPlayerStatus(player);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playerPanel, setPlayerPanel] = useState<'speed'|'sleep'|'queue'|null>(null);
  const [playerProgressWidth,setPlayerProgressWidth]=useState(1);
  const [localSpeed, setLocalSpeed] = useState(1);
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
  const [queueReady,setQueueReady]=useState(false);
  const [queueBusy,setQueueBusy]=useState(false);
  const [chapters,setChapters]=useState<Chapter[]>([]);
  const [chapterError,setChapterError]=useState('');
  const queueStore=useMemo(()=>{
    if(!session)return null;
    const store=new SavedQueue<Book>((path,method,data)=>request(session,path,method,data),()=>{setQueuedBooks([...store.items]);setQueueReady(store.ready);setQueueBusy(store.busy);},setError);
    return store;
  },[session]);
  useEffect(()=>{setQueueReady(false);setQueueBusy(false);setQueuedBooks([]);void queueStore?.reload();return()=>queueStore?.dispose();},[queueStore]);
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
  const shelfColumns = width >= 900 ? 5 : width >= 700 ? 4 : width >= 520 ? 3 : 2;
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
  const localAudioProgress = !session && audio.duration ? Math.min(1, audio.currentTime / audio.duration) : 0;
  const displayedProgress = session ? audioProgress : localAudioProgress;
  const localWorks = useMemo(() => {
    if (session) return [] as LocalWork[];
    const local = books.filter((book): book is Book & {uri: string} => !!book.uri) as LocalBook[];
    const downloaded=Object.values(offlineWorks).map(offlineToLocalWork);
    return [...groupLocalWorks(local),...downloaded];
  }, [books, offlineWorks, session]);

  const localPersonalWorks = useMemo(() => localWorks.map(work => {
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
  }),[localAudioCompleted,localPreferences,localReadingComplete,localReadingProgress,localWorkProgress,localWorks]);

  const localAtlasRelationship = useMemo(() =>
    !session && atlasFocus ? buildAtlasRelationship(localPersonalWorks,atlasFocus.kind,atlasFocus.value) : null,
    [atlasFocus,localPersonalWorks,session],
  );

  const localDuplicateGroups = useMemo(() => {
    if(session)return [];
    const local=books.filter((book):book is Book & {uri:string}=>!!book.uri) as LocalBook[];
    return possibleLocalDuplicateGroups(local);
  },[books,session]);


  const localProfileStats = useMemo<VerifiedProfileStats>(() => {
    const audioWorks = localWorks.filter(work => work.format === 'Audio');
    const readingWorks = localWorks.filter(work => work.format !== 'Audio');

    const startedAudio = audioWorks.filter(work => {
      const point = localWorkProgress[work.key];
      return !!point && (point.seconds > 0 || !!point.complete || !!localAudioCompleted[work.key]);
    }).length;
    const completedAudio = audioWorks.filter(work =>
      !!localAudioCompleted[work.key] || !!localWorkProgress[work.key]?.complete
    ).length;
    const inProgressAudio = audioWorks.filter(work => {
      const point=localWorkProgress[work.key];
      return !!point && !point.complete && point.seconds>0;
    }).length;

    const startedReading = readingWorks.filter(work => work.tracks.some(track =>
      !!track.uri && (
        Object.prototype.hasOwnProperty.call(localReadingProgress, track.uri) ||
        !!localReadingComplete[track.uri]
      )
    )).length;
    const completedReading = readingWorks.filter(work => work.tracks.some(track =>
      !!track.uri && !!localReadingComplete[track.uri]
    )).length;
    const inProgressReading = readingWorks.filter(work => work.tracks.some(track => {
      if(!track.uri)return false;
      const page=localReadingProgress[track.uri] || 0;
      const currentComplete=localReadingCurrentComplete[track.uri] ?? !!localReadingComplete[track.uri];
      return page>0 && !currentComplete;
    })).length;

    return {
      name: 'On this device',
      owner: false,
      works: localWorks.length,
      formats: new Set(localWorks.map(work => work.format).filter(Boolean)).size,
      series: new Set(localWorks.map(work => work.series).filter(Boolean)).size,
      startedAudio,
      completedAudio,
      inProgressAudio,
      startedReading,
      completedReading,
      inProgressReading,
      inProgress: inProgressAudio + inProgressReading,
      completed: completedAudio + completedReading,
      rated: localWorks.filter(work=>(localPreferences[work.key]?.rating||0)>0).length,
      favourites: localWorks.filter(work=>!!localPreferences[work.key]?.favourite).length,
      averageRating: (()=>{const values=localWorks.map(work=>localPreferences[work.key]?.rating||0).filter(Boolean);return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;})(),
    };
  }, [localAudioCompleted, localPreferences, localReadingComplete, localReadingCurrentComplete, localReadingProgress, localWorkProgress, localWorks]);

  const profileStats = session ? serverProfileStats : localProfileStats;
  const profileAchievements = useMemo(() => profileStats ? achievementsFor(profileStats) : [], [profileStats]);

  useEffect(()=>{
    if(!profileStats)return;
    const key=session ? session.server+'|'+profileStats.name : 'local';
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
  },[profileAchievements,profileStats,session]);

  const availabilityMatches = (available: boolean) =>
    availabilityFilter === 'all' || (availabilityFilter === 'available' ? available : !available);

  const visibleBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter(book => {
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
  }, [authorFilter, availabilityFilter, books, formatFilter, genreFilter, query, reviewOnly, seriesFilter, space, unknownAuthorOnly]);

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
    const count = (values: string[]) => {
      const totals = new Map<string, number>();
      for (const value of values.map(v => v.trim()).filter(Boolean)) totals.set(value, (totals.get(value) || 0) + 1);
      return [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
    };
    if (session && serverSummary) {
      const authors: Array<[string,number]> = serverSummary.authors.map(item => [item.name,item.count]);
      if (serverSummary.unknownAuthors > 0) authors.push(['Unknown author',serverSummary.unknownAuthors]);
      const prefs=Object.values(serverPreferences);
      return {
        formats: serverSummary.formats.map(item => [item.name,item.count] as [string,number]),
        authors,
        series: serverSummary.series.map(item => [item.name,item.count] as [string,number]),
        genres: (serverSummary.genres || []).map(item => [item.name,item.count] as [string,number]),
        spaces: serverSummary.spaces.map(item => [item.name,item.count] as [string,number]),
        status: serverSummary.availability.map(item => [item.name,item.count] as [string,number]),
        reading: serverSummary.reading?.length
          ? serverSummary.reading.map(item=>[item.name,item.count] as [string,number])
          : count(prefs.map(item=>item.state==='finished'?'Finished':item.state==='in-progress'?'In progress':'Not started')),
        ratings: serverSummary.ratings?.length
          ? serverSummary.ratings.map(item=>[item.name,item.count] as [string,number])
          : count(prefs.map(item=>ratingLabel(item.rating||0))),
        favourites: serverSummary.favourites?.length
          ? serverSummary.favourites.map(item=>[item.name,item.count] as [string,number])
          : prefs.some(item=>item.favourite)?[['Favourites',prefs.filter(item=>item.favourite).length] as [string,number]]:[],
      };
    }
    const items = localPersonalWorks;
    return {
      formats: count(items.map(item => item.format)),
      authors: count(items.map(item => item.author || 'Unknown author')),
      series: count(items.map(item => item.series).filter(Boolean)),
      genres: count(items.map(item => item.genre).filter(Boolean)),
      spaces: count(items.map(item => item.space)),
      status: [
        ['Available', items.filter(item => item.available).length] as [string, number],
        ['Unavailable', items.filter(item => !item.available).length] as [string, number],
      ].filter(([, total]) => total > 0),
      reading: count(items.map(item=>item.readingState==='finished'?'Finished':item.readingState==='in-progress'?'In progress':'Not started')),
      ratings: count(items.map(item=>ratingLabel(item.rating||0))),
      favourites: items.some(item=>item.favourite)?[['Favourites',items.filter(item=>item.favourite).length] as [string,number]]:[],
    };
  }, [localPersonalWorks, serverPreferences, serverSummary, session]);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', s => controller.update(s.currentTime,s.duration,s.playing,s.didJustFinish,s.error));
    const lifecycle = AppState.addEventListener('change', state => {
      controller.tick();
      void controller.save();
      if(state!=='active')void pauseActiveOfflineDownload();
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
    const next=queueRef.current[0];
    setPlaying(next);
    void controller.open(next.id).then(()=>{if(controller.state.playing)void queueStore?.edit(items=>items.filter(b=>b.id!==next.id));});
  }, [playback?.completed, controller, queueStore]);

  useEffect(() => {
    if (session || !audio.didJustFinish) return;
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
  }, [audio.didJustFinish, session, activeLocalWork, localWorkIndex, localWorks]);

  const activeAsset=playback?.tracks[playback.index]?.id;
  useEffect(()=>{
    let cancelled=false;setChapters([]);setChapterError('');
    if(session && activeAsset)request(session,'/api/assets/'+activeAsset+'/chapters').then(items=>{if(!cancelled)setChapters(items);}).catch(e=>{if(!cancelled)setChapterError(e.message);});
    return()=>{cancelled=true;};
  },[session,activeAsset]);

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
      setBooks(normalized);
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
          setBooks(assets as Book[]);
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
    return()=>{cancelled=true;};
  }, [activeTab, playback?.completed, session]);

  useEffect(()=>{
    if(!session || !atlasFocus){
      setServerAtlasRelationship(null);
      setAtlasLoading(false);
      setAtlasCompatibility(false);
      return;
    }
    let cancelled=false;
    setAtlasLoading(true);
    setAtlasCompatibility(false);
    request(session,'/api/atlas-relationships?kind='+encodeURIComponent(atlasFocus.kind)+'&value='+encodeURIComponent(atlasFocus.value))
      .then(data=>{
        if(cancelled)return;
        setServerAtlasRelationship(normalizeAtlasRelationship(data));
      })
      .catch(e=>{
        if(cancelled)return;
        if(e instanceof RequestError && e.status===400){
          setServerAtlasRelationship(buildLegacyAtlasRelationship(serverWorks,atlasFocus.kind,atlasFocus.value));
          setAtlasCompatibility(true);
          return;
        }
        setError(e.message);
      })
      .finally(()=>{if(!cancelled)setAtlasLoading(false);});
    return()=>{cancelled=true;};
  },[atlasFocus,serverWorks,session]);

  useEffect(() => {
    if (session || !playing?.uri || !audio.currentTime) return;
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
  }, [audio.currentTime, activeLocalWork, localWorkIndex, playing?.uri, session]);

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
    if (session || restoring || !localOverridesReady || !localCatalogReady || !localFolders.length || books.length || localScanning) return;
    void rescanLocalFolders();
  }, [books.length, localCatalogReady, localFolders, localOverridesReady, localScanning, restoring, session]);

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
    setBooks(assets as Book[]);
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
      const next = await request(session,serverAssetsPath(books.length,200)) as Book[];
      setBooks(current => {
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
    setSession(null);
    setRecoverableSession(null);
    setBooks([]);
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
    setQueuedBooks([]); setSpace('');
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
      setBooks(result.books);
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
      setBooks(result.books);
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
    if (!session) {
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
    if (!book.available) {
      setError('This file is currently unavailable.');
      return;
    }
    setError('');
    try {
      setPlaying(book);
      setActiveTab('player');
      await controller.open(book.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function previewLocalSortBatch() {
    const previews = previewLocalSort(visibleBooks.filter(book => book.uri) as LocalBook[], sortTemplate);
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

  function openBook(book: Book) {
    if (!book.available) {
      setError('This file is currently unavailable.');
      return;
    }
    setError('');
    setReaderLoadError('');
    if (book.format === 'Audio') playBook(book);
    else if (!session) {
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
      const downloaded=await downloadOfflineWork(
        session,
        work,
        tracks as OfflineServerTrack[],
        (written,total)=>setOfflineProgress(total>0 ? Math.min(100,Math.round(written/total*100))+'%' : formatBytes(written)),
        {
          checkpoint:offlineCheckpoints[checkpointKey],
          onCheckpoint:checkpoint=>saveOfflineCheckpoint(checkpointKey,checkpoint),
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
      };
      await queueStore?.edit(old => old.some(book => book.id === item.id) ? old : [...old,item]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openLocalWork(work: LocalWork) {
    if (!work.available) { setError('This work is currently unavailable.'); return; }
    if (work.format === 'Audio') { void playLocalWork(work); return; }
    const first = work.tracks.find(track => track.available);
    if (first) openBook({...first,localWorkKey:work.key});
  }

  function openServerWorkTrack(work: ServerWork, track: WorkTrack) {
    setWorkPicker(null);
    const item: Book = {
      id:track.id,title:work.title,author:work.author,series:work.series,genre:work.genre || '',
      format:track.format,space:work.space,available:track.available,serverWorkId:work.id,
      coverShape:track.format==='Audio'?'square':'portrait',
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
        await playBook({id:first.id,title:work.title,author:work.author,series:work.series,genre:work.genre || '',format:'Audio',space:work.space,available:true,coverShape:'square',serverWorkId:work.id});
        return;
      }
      const editions = new Set(available.map(track => track.edition));
      if (editions.size === 1) {
        const first = available[0];
        openBook({id:first.id,title:work.title,author:work.author,series:work.series,genre:work.genre || '',format:first.format,space:work.space,available:true,serverWorkId:work.id,coverShape:first.format==='Audio'?'square':'portrait'});
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
    const square = coverShape === 'square' || format === 'Audio';
    const imageSource = session && serverPath
      ? {uri: session.server + serverPath, headers: {Authorization: 'Bearer ' + session.token}}
      : coverUri ? {uri: coverUri} : null;
    const [coverFailed, setCoverFailed] = useState(false);
    useEffect(() => setCoverFailed(false), [imageSource?.uri]);
    return (
      <View style={[styles.cover, square && styles.coverSquare, large && styles.coverLarge, square && large && styles.coverLargeSquare, {backgroundColor: p.ink}]}>
        <Text numberOfLines={1} style={[styles.coverFormat, {color: p.gold}]}>{format.toUpperCase()}</Text>
        <Text numberOfLines={large ? 4 : 3} style={[styles.coverTitle, {color: p.ivory}]}>{title}</Text>
        {imageSource && !coverFailed ? (
          <Image accessible={false} source={imageSource} resizeMode="cover" style={styles.coverImage} onError={() => setCoverFailed(true)} />
        ) : null}
      </View>
    );
  }

  function Cover({book, large = false}: {book: Book; large?: boolean}) {
    return <Artwork
      title={book.title}
      format={book.format}
      coverShape={book.coverShape}
      coverUri={book.coverUri}
      serverPath={session ? '/api/assets/' + book.id + '/cover' : undefined}
      large={large}
    />;
  }

  function MiniArtwork({book}: {book: Book}) {
    const source = session
      ? {uri: session.server + '/api/assets/' + book.id + '/cover', headers: {Authorization: 'Bearer ' + session.token}}
      : book.coverUri ? {uri: book.coverUri} : null;
    const [failed,setFailed]=useState(false);
    useEffect(()=>setFailed(false),[source?.uri]);
    return (
      <View style={[styles.miniCover,{backgroundColor:p.gold}]}>
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
          {serverNotice ? <Text style={[styles.meta, {color: p.gold}]}>{serverNotice}</Text> : null}
          {error ? <Text accessibilityRole="alert" style={[styles.error, {color: p.gold}]}>{error}</Text> : null}
      </View>
    );
  }

  async function finishOnboarding() {
    setOnboardingDone(true);
    await SecureStore.setItemAsync(onboardingDoneKey, '1');
  }

  function LibrarySwitcher({vertical = false}: {vertical?: boolean}) {
    const names = ['', ...spaces];
    return (
      <View style={vertical ? styles.libraryRailList : styles.libraryChipsRow}>
        {names.map(name => (
          <Pressable
            key={name || 'all'}
            accessibilityRole="button"
            accessibilityState={{selected: space === name}}
            onPress={() => {setSpace(name);setReviewOnly(false);setAvailabilityFilter('all');setFormatFilter('');setAuthorFilter('');setSeriesFilter('');setGenreFilter('');setUnknownAuthorOnly(false);}}
            style={[
              styles.libraryChoice,
              vertical && styles.libraryChoiceVertical,
              {borderColor: p.line, backgroundColor: space === name ? p.sage : p.card},
            ]}>
            <Text numberOfLines={1} style={{color: space === name ? p.ivory : p.ink, fontWeight: '700'}}>
              {name || 'All books'}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  function OnboardingGuide() {
    if (session || onboardingDone) return null;
    const reviewCount = session ? (serverSummary?.needsReview ?? books.filter(book => book.needsReview).length) : books.filter(book => book.needsReview).length;
    const hasFolder = localFolders.length > 0;
    const hasBooks = books.length > 0;
    return (
      <View style={[styles.onboardingCard, {backgroundColor: p.card, borderColor: p.line}]}>
        <Text style={[styles.onboardingEyebrow, {color: p.gold}]}>START HERE</Text>
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
              {localScanning && scanProgress ? `Scanning ${scanProgress.currentFolder}: ${scanProgress.found} found, ${scanProgress.review} need review` : hasBooks ? `${books.length} items found` : 'Scanning starts immediately after you choose a folder.'}
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
          {item.needsReview ? <View style={[styles.reviewPill,{borderColor:p.gold}]}><Text style={{color:p.gold,fontSize:11,fontWeight:'800'}}>Needs review</Text></View> : null}
          <Text style={[styles.meta,{color:p.muted}]}>{item.format} · {item.space}{item.author ? ' · '+item.author : ''}{item.series ? ' · '+item.series : ''}{item.genre ? ' · '+item.genre : ''}</Text>
        </Pressable>
        {(session ? owner : true) ? <Button label="Edit details" tone="quiet" onPress={()=>beginEdit(item)} /> : null}
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
              <Text style={{fontSize:20,color:full||half?p.gold:p.muted,opacity:half?0.55:1}}>★</Text>
            </Pressable>;
          })}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={favourite?'Remove favourite':'Add favourite'} onPress={onFavourite} style={{padding:5}}>
          <Text style={{fontSize:22,color:favourite?p.gold:p.muted}}>{favourite?'♥':'♡'}</Text>
        </Pressable>
      </View>
      {rating>0?<Text style={[styles.meta,{color:p.gold}]}>{ratingLabel(rating)}</Text>:null}
    </View>;
  }

  function WorkQuickAction({label,accessibilityLabel,onPress,disabled}:{
    label:string;accessibilityLabel?:string;onPress:()=>void;disabled?:boolean;
  }) {
    return <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{disabled:!!disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed})=>[styles.workQuickAction,{borderColor:p.line},(pressed||disabled)&&{opacity:disabled?.42:.62}]}>
      <Text numberOfLines={1} style={[styles.workQuickActionText,{color:p.sage}]}>{label}</Text>
    </Pressable>;
  }

  function LocalWorkCard({work}: {work: LocalWork}) {
    const downloaded=Object.values(offlineWorks).find(item=>'offline:'+item.key===work.key);
    const personal=localPreferences[work.key] || {rating:0,favourite:false};
    return (
      <View style={styles.book}>
        <Pressable accessibilityRole="button" accessibilityLabel={work.title + ', ' + work.format} onPress={()=>openLocalWork(work)}>
          <Artwork title={work.title} format={work.format} coverShape={work.coverShape} coverUri={work.coverUri} />
          <Text numberOfLines={2} style={[styles.bookTitle,{color:p.ink}]}>{work.title}</Text>
          {work.needsReview ? <View style={[styles.reviewPill,{borderColor:p.gold}]}><Text style={{color:p.gold,fontSize:11,fontWeight:'800'}}>Needs review</Text></View> : null}
          <Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>
            {work.author || 'Unknown author'}{work.series ? ' · '+work.series : ''}{work.genre ? ' · '+work.genre : ''}{work.files>1 ? ' · '+work.files+' files' : ''}
          </Text>
        </Pressable>
        <PersonalControls rating={personal.rating||0} favourite={!!personal.favourite}
          onRating={rating=>void saveLocalPreference(work,{...personal,rating:personal.rating===rating?0:rating})}
          onFavourite={()=>void saveLocalPreference(work,{...personal,favourite:!personal.favourite})} />
        {(work.format==='Audio'||downloaded) ? <View style={styles.workQuickRow}>
          {work.format==='Audio' ? <WorkQuickAction label="＋ Queue" accessibilityLabel={'Add '+work.title+' to queue'} onPress={()=>void addLocalWorkQueue(work)} /> : null}
          {downloaded ? <WorkQuickAction label="✓ Offline" accessibilityLabel={'Remove offline download of '+work.title} disabled={offlineBusyId===downloaded.workId} onPress={()=>void removeServerDownload(downloaded)} /> : null}
        </View> : null}
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
        <View style={styles.workQuickRow}>
          {work.format==='Audio' ? <WorkQuickAction label="＋ Queue" accessibilityLabel={'Add '+work.title+' to queue'} disabled={!queueReady||queueBusy} onPress={()=>void queueServerWork(work)} /> : null}
          {downloaded
            ? <WorkQuickAction label={'✓ Offline · '+formatBytes(downloaded.bytes)} accessibilityLabel={'Remove download · '+formatBytes(downloaded.bytes)} disabled={downloading} onPress={()=>void removeServerDownload(downloaded)} />
            : <WorkQuickAction label={downloading ? '↓ '+offlineProgress : checkpoint ? '↻ Resume' : '↓ Offline'} accessibilityLabel={checkpoint?'Resume download of '+work.title:'Download '+work.title+' for offline use'} disabled={offlineBusyId!==null} onPress={()=>void downloadServerWork(work)} />}
        </View>
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
        <Text style={[styles.playerEyebrow,{color:p.gold}]}>FINISHED</Text>
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

  function ContinueCard({
    title,author,format,coverUri,serverPath,onPress,action='Open',
  }: {
    title:string;author:string;format:string;coverUri?:string;serverPath?:string;onPress:()=>void;action?:string;
  }) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={action+' '+title+', '+(author||format)} onPress={onPress} style={({pressed})=>[styles.continueCard,pressed&&styles.cardPressed]}>
        <Artwork title={title} format={format} coverShape={format==='Audio'?'square':'portrait'} coverUri={coverUri} serverPath={serverPath} />
        <Text numberOfLines={2} style={[styles.continueTitle,{color:p.ink}]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.meta,{color:p.muted}]}>{author || format}</Text>
      </Pressable>
    );
  }

  function Shelf() {
    const wideLibraries = width >= 760 && spaces.length > 0;
    const reviewCount = session ? (serverSummary?.needsReview ?? books.filter(book => book.needsReview).length) : books.filter(book => book.needsReview).length;
    const continuing = session ? continueWorks : localContinueWorks;
    const shelfWorks = session ? visibleServerWorks : visibleLocalWorks;
    const seriesCounts = new Map<string,number>();
    for (const work of shelfWorks) if (work.series) seriesCounts.set(work.series,(seriesCounts.get(work.series)||0)+1);
    const seriesOptions = [...seriesCounts.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,10);
    const libraryMode = activeTab === 'library';
    const allLibraryWorks: Array<LocalWork | ServerWork> = session ? serverWorks : localPersonalWorks;
    const activeLibraryWorks: Array<LocalWork | ServerWork> = session ? visibleServerWorks : visibleLocalWorks;
    const formatOptions = [...new Set(allLibraryWorks.map(work=>work.format).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const libraryFilterCount =
      (formatFilter ? 1 : 0) +
      (readingFilter ? 1 : 0) +
      (favouriteOnly ? 1 : 0) +
      (availabilityFilter !== 'all' ? 1 : 0) +
      (authorFilter ? 1 : 0) +
      (seriesFilter ? 1 : 0) +
      (genreFilter ? 1 : 0) +
      (unknownAuthorOnly ? 1 : 0) +
      (ratingFilter > 0 ? 1 : 0);

    const smartInProgress: Array<LocalWork | ServerWork> = session
      ? serverWorks.filter(work => serverPreferences[work.id]?.state === 'in-progress')
      : localPersonalWorks.filter(work => work.readingState === 'in-progress');
    const smartFavourites: Array<LocalWork | ServerWork> = session
      ? serverWorks.filter(work => !!serverPreferences[work.id]?.favourite)
      : localPersonalWorks.filter(work => !!work.favourite);
    const smartUnread: Array<LocalWork | ServerWork> = session
      ? serverWorks.filter(work => (serverPreferences[work.id]?.state || 'not-started') === 'not-started')
      : localPersonalWorks.filter(work => work.readingState === 'not-started');

    const seriesMap = new Map<string,{count:number;work:LocalWork|ServerWork}>();
    for (const work of allLibraryWorks) {
      if (!work.series) continue;
      const current=seriesMap.get(work.series);
      if (current) current.count += 1;
      else seriesMap.set(work.series,{count:1,work});
    }
    const seriesOptions = [...seriesMap.entries()]
      .map(([name,value])=>({name,count:value.count,work:value.work}))
      .sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name))
      .slice(0,10);

    const clearLibraryFilters = () => {
      setQuery('');
      setAvailabilityFilter('all');
      setFormatFilter('');
      setAuthorFilter('');
      setSeriesFilter('');
      setGenreFilter('');
      setReadingFilter('');
      setRatingFilter(0);
      setFavouriteOnly(false);
      setUnknownAuthorOnly(false);
      setReviewOnly(false);
    };

    const openSmartShelf = (kind:'progress'|'favourites'|'unread') => {
      clearLibraryFilters();
      if (kind === 'progress') setReadingFilter('in-progress');
      if (kind === 'favourites') setFavouriteOnly(true);
      if (kind === 'unread') setReadingFilter('not-started');
      setActiveTab('library');
    };

    function ShelfFeatureCard({
      title,caption,count,work,onPress,
    }: {
      title:string;caption:string;count:number;work?:LocalWork|ServerWork;onPress:()=>void;
    }) {
      return <Pressable
        accessibilityRole="button"
        accessibilityLabel={title+', '+count+' works'}
        onPress={onPress}
        style={({pressed})=>[
          styles.shelfFeatureCard,
          {borderColor:p.line,backgroundColor:p.card},
          pressed&&styles.cardPressed,
        ]}>
        <View style={[styles.shelfFeatureArt,{backgroundColor:p.raised}]}>
          {work ? <Artwork
            title={work.title}
            format={work.format}
            coverShape={'coverShape' in work ? work.coverShape : work.format==='Audio'?'square':'portrait'}
            coverUri={'coverUri' in work ? work.coverUri : undefined}
            serverPath={session && 'id' in work ? '/api/works/'+work.id+'/cover' : undefined}
          /> : <Text style={[styles.shelfFeatureFallback,{color:p.muted}]}>A</Text>}
        </View>
        <View style={{flex:1,minWidth:0}}>
          <Text numberOfLines={1} style={[styles.shelfFeatureTitle,{color:p.ink}]}>{title}</Text>
          <Text numberOfLines={2} style={[styles.meta,{color:p.muted}]}>{caption}</Text>
        </View>
        <Text style={[styles.shelfFeatureCount,{color:p.sage}]}>{count}</Text>
      </Pressable>;
    }

    function LibraryFilterPill({
      label,selected,onPress,count,
    }: {
      label:string;selected:boolean;onPress:()=>void;count?:number;
    }) {
      return <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{selected}}
        onPress={onPress}
        style={({pressed})=>[
          styles.libraryFilterPill,
          {borderColor:selected?p.sage:p.line,backgroundColor:selected?p.sage:p.card},
          pressed&&{opacity:.72},
        ]}>
        <Text style={[styles.libraryFilterText,{color:selected?p.ivory:p.ink}]}>{label}</Text>
        {typeof count==='number' ? <Text style={[styles.libraryFilterCount,{color:selected?p.ivory:p.muted}]}>{count}</Text> : null}
      </Pressable>;
    }
    return (
      <View style={styles.shelfShell}>
        {wideLibraries ? <View style={[styles.libraryRail,{borderRightColor:p.line,backgroundColor:p.card}]}>
          <Text style={[styles.libraryRailTitle,{color:p.ink}]}>Libraries</Text>
          <LibrarySwitcher vertical />
          {!session ? <Pressable accessibilityRole="button" onPress={() => void addLocalFolder()} style={styles.libraryRailAdd}><Text style={{color:p.sage,fontWeight:'800'}}>+ Add folder</Text></Pressable> : null}
        </View> : null}
        <View style={[styles.content, {flex: 1}]}>
        <View style={styles.pageHeading}>
          <View>
            <Text style={[styles.pageEyebrow,{color:p.gold}]}>{libraryMode ? 'COLLECTION' : 'YOUR LIBRARY'}</Text>
            <Text style={[styles.title, {color: p.ink}]}>{libraryMode ? 'Library' : 'Shelf'}</Text>
          </View>
          {libraryMode ? <Text style={[styles.headerMeta,{color:p.muted}]}>{session ? (serverSummary?.total ?? serverWorks.length) : localWorks.length} works</Text> : null}
        </View>
        {!libraryMode ? <OnboardingGuide /> : null}
        {!libraryMode && !session && onboardingDone ? <View style={[styles.librarySummary,{backgroundColor:p.card,borderColor:p.line}]}>
          <View style={{flex:1}}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Your libraries</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{localFolders.length} folder${localFolders.length === 1 ? '' : 's'} · ${books.length} items${reviewCount ? ` · ${reviewCount} need review` : ''}</Text>
          </View>
          <Button label={localScanning ? 'Scanning…' : 'Add folder'} disabled={localScanning} tone="quiet" onPress={() => void addLocalFolder()} />
        </View> : null}
        {!wideLibraries && spaces.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryChips}><LibrarySwitcher /></ScrollView> : null}
        {reviewCount>0 && !reviewOnly ? <View style={[styles.reviewBanner,{backgroundColor:p.card,borderColor:p.gold}]}>
          <Text style={[styles.meta,{color:p.ink,flex:1}]}>{reviewCount} file{reviewCount===1?'':'s'} need a quick metadata check before automatic organising.</Text>
          <Button label={'Review '+reviewCount} tone="quiet" onPress={() => {setReviewOnly(true);setQuery('');}} />
        </View> : null}
        {reviewOnly ? <View style={[styles.reviewBanner,{backgroundColor:p.card,borderColor:p.gold}]}>
          <Text style={[styles.meta,{color:p.ink,flex:1}]}>Reviewing uncertain files. Corrections are preserved on future scans.</Text>
          <Button label="Back to Shelf" tone="quiet" onPress={() => setReviewOnly(false)} />
        </View> : null}
        {localScanning && scanProgress ? <View style={[styles.scanBanner,{backgroundColor:p.ink}]}>
          <ActivityIndicator accessibilityLabel="Scanning local library" color={p.ivory} />
          <View style={{flex:1}}>
            <Text style={{color:p.ivory,fontWeight:'800'}}>Scanning {scanProgress.currentFolder || 'library'}…</Text>
            <Text style={{color:'#c8d4d2'}}>{scanProgress.entriesVisited} checked · {scanProgress.found} books found · {scanProgress.review} need review</Text>
          </View>
        </View> : null}
        {localFolderNotice ? <Text style={[styles.meta,{color:p.gold}]}>{localFolderNotice}</Text> : null}
        {libraryMode ? <>
          <View style={styles.libraryToolbar}>
            <View style={[styles.librarySearchShell,{borderColor:p.line,backgroundColor:p.card}]}>
              <Text style={[styles.librarySearchIcon,{color:p.muted}]}>⌕</Text>
              <TextInput
                accessibilityLabel="Search your library"
                value={query}
                onChangeText={value=>{
                  setQuery(value);
                  setAvailabilityFilter('all');
                  setAuthorFilter('');
                  setSeriesFilter('');
                  setGenreFilter('');
                  setUnknownAuthorOnly(false);
                }}
                placeholder="Search title, author, series or genre"
                placeholderTextColor={p.muted}
                style={[styles.librarySearchInput,{color:p.ink}]}
              />
              {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={()=>setQuery('')} style={styles.librarySearchClear}>
                <Text style={[styles.librarySearchClearText,{color:p.muted}]}>×</Text>
              </Pressable> : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryFilterRow}>
              <LibraryFilterPill label="All" selected={!formatFilter} onPress={()=>setFormatFilter('')} count={allLibraryWorks.length} />
              {formatOptions.map(format=><LibraryFilterPill
                key={format}
                label={format==='Audio'?'Audiobooks':format}
                selected={formatFilter===format}
                onPress={()=>setFormatFilter(formatFilter===format?'':format)}
                count={allLibraryWorks.filter(work=>work.format===format).length}
              />)}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryFilterRow}>
              <LibraryFilterPill label="In progress" selected={readingFilter==='in-progress'} onPress={()=>setReadingFilter(readingFilter==='in-progress'?'':'in-progress')} />
              <LibraryFilterPill label="Favourites" selected={favouriteOnly} onPress={()=>setFavouriteOnly(!favouriteOnly)} />
              <LibraryFilterPill label="Available" selected={availabilityFilter==='available'} onPress={()=>setAvailabilityFilter(availabilityFilter==='available'?'all':'available')} />
              <LibraryFilterPill label="Unknown author" selected={unknownAuthorOnly} onPress={()=>setUnknownAuthorOnly(!unknownAuthorOnly)} />
            </ScrollView>

            <View style={styles.libraryResultRow}>
              <Text style={[styles.libraryResultText,{color:p.muted}]}>
                {activeLibraryWorks.length} shown · {allLibraryWorks.length} total
              </Text>
              {libraryFilterCount || query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear library filters" onPress={clearLibraryFilters} hitSlop={8}>
                <Text style={[styles.libraryClearFilters,{color:p.sage}]}>Clear filters</Text>
              </Pressable> : null}
            </View>
          </View>

          {shelfLoading ? <ActivityIndicator accessibilityLabel="Loading library" /> : null}
          {reviewOnly ? (
            <FlatList
              key={'review-'+shelfColumns}
              style={styles.libraryList}
              data={visibleBooks}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={7}
              removeClippedSubviews
              keyExtractor={b => 'asset-'+b.id}
              numColumns={shelfColumns}
              contentContainerStyle={styles.grid}
              ListEmptyComponent={<Text style={[styles.empty,{color:p.muted}]}>Nothing needs review.</Text>}
              renderItem={({item}) => <RawAssetCard item={item} />}
              onEndReachedThreshold={0.55}
              onEndReached={()=>void loadMoreServerBooks()}
              ListFooterComponent={session && serverBooksLoadingMore ? <ActivityIndicator accessibilityLabel="Loading more review files" /> : null}
            />
          ) : session ? (
            <FlatList
              key={'server-works-'+shelfColumns}
              style={styles.libraryList}
              data={visibleServerWorks}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={7}
              removeClippedSubviews
              keyExtractor={work => 'work-'+work.id}
              numColumns={shelfColumns}
              contentContainerStyle={styles.grid}
              ListEmptyComponent={!shelfLoading ? <Text style={[styles.empty,{color:p.muted}]}>No matching works. Add and scan folders in Settings.</Text> : null}
              renderItem={({item}) => <ServerWorkCard work={item} />}
              onEndReachedThreshold={0.55}
              onEndReached={()=>void loadMoreServerWorks()}
              ListFooterComponent={serverLoadingMore ? <ActivityIndicator accessibilityLabel="Loading more works" /> : null}
            />
          ) : (
            <FlatList
              key={'local-works-'+shelfColumns}
              style={styles.libraryList}
              data={visibleLocalWorks}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={7}
              removeClippedSubviews
              keyExtractor={work => work.key}
              numColumns={shelfColumns}
              contentContainerStyle={styles.grid}
              ListEmptyComponent={!shelfLoading ? <Text style={[styles.empty,{color:p.muted}]}>{localFolders.length?'No matching works.':'No books yet. Add folders to build your local library.'}</Text> : null}
              renderItem={({item}) => <LocalWorkCard work={item} />}
            />
          )}
        </> : <ScrollView
          style={styles.shelfVerticalScroll}
          contentContainerStyle={styles.shelfHomeContent}
          showsVerticalScrollIndicator={false}>
          {!reviewOnly && continuing.length ? <View style={styles.shelfSection}>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Continue</Text>
                <Text style={[styles.meta,{color:p.muted}]}>Pick up exactly where you left off</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueRow}>
              {session ? continueWorks.map(work => <ContinueCard
                key={'continue-server-'+work.id}
                title={work.title}
                author={work.author}
                format={work.format}
                serverPath={'/api/works/'+work.id+'/cover'}
                onPress={()=>void openServerWork(work)}
              />) : localContinueWorks.map(work => <ContinueCard
                key={'continue-local-'+work.key}
                title={work.title}
                author={work.author}
                format={work.format}
                coverUri={work.coverUri}
                onPress={()=>openLocalWork(work)}
              />)}
            </ScrollView>
          </View> : null}

          {(smartInProgress.length || smartFavourites.length || smartUnread.length) ? <View style={styles.shelfSection}>
            <View>
              <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Smart shelves</Text>
              <Text style={[styles.meta,{color:p.muted}]}>Useful views built quietly from your own library</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfFeatureRow}>
              {smartInProgress.length ? <ShelfFeatureCard
                title="In progress"
                caption="Books and audiobooks already under way"
                count={smartInProgress.length}
                work={smartInProgress[0]}
                onPress={()=>openSmartShelf('progress')}
              /> : null}
              {smartFavourites.length ? <ShelfFeatureCard
                title="Favourites"
                caption="The titles you have marked to keep close"
                count={smartFavourites.length}
                work={smartFavourites[0]}
                onPress={()=>openSmartShelf('favourites')}
              /> : null}
              {smartUnread.length ? <ShelfFeatureCard
                title="Unread"
                caption="Something new for the next quiet hour"
                count={smartUnread.length}
                work={smartUnread[0]}
                onPress={()=>openSmartShelf('unread')}
              /> : null}
            </ScrollView>
          </View> : null}

          {seriesOptions.length ? <View style={styles.shelfSection}>
            <View>
              <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Series</Text>
              <Text style={[styles.meta,{color:p.muted}]}>Return to a world, not a file list</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfFeatureRow}>
              {seriesOptions.map(series=><ShelfFeatureCard
                key={series.name}
                title={series.name}
                caption={series.count+' title'+(series.count===1?'':'s')}
                count={series.count}
                work={series.work}
                onPress={()=>{
                  clearLibraryFilters();
                  setSeriesFilter(series.name);
                  setActiveTab('library');
                }}
              />)}
            </ScrollView>
          </View> : null}

          {allLibraryWorks.length ? <View style={styles.shelfSection}>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Your library</Text>
                <Text style={[styles.meta,{color:p.muted}]}>A small window into the full collection</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Open full library" onPress={()=>{clearLibraryFilters();setActiveTab('library')}} hitSlop={8}>
                <Text style={[styles.sectionLink,{color:p.sage}]}>See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueRow}>
              {session ? serverWorks.slice(0,10).map(work => <ContinueCard
                key={'shelf-server-'+work.id}
                action="Open"
                title={work.title}
                author={work.author}
                format={work.format}
                serverPath={'/api/works/'+work.id+'/cover'}
                onPress={()=>void openServerWork(work)}
              />) : localPersonalWorks.slice(0,10).map(work => <ContinueCard
                key={'shelf-local-'+work.key}
                action="Open"
                title={work.title}
                author={work.author}
                format={work.format}
                coverUri={work.coverUri}
                onPress={()=>openLocalWork(work)}
              />)}
            </ScrollView>
          </View> : !shelfLoading && onboardingDone ? <View style={[styles.shelfEmpty,{borderColor:p.line}]}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>A quiet shelf, for now</Text>
            <Text style={[styles.empty,{color:p.muted}]}>Add a library folder and Archivist will build your collection here.</Text>
            {!session ? <Button label="Add your first folder" onPress={()=>void addLocalFolder()} /> : <Button label="Open Library settings" tone="quiet" onPress={()=>setActiveTab('settings')} />}
          </View> : null}

          {allLibraryWorks.length ? <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse full library"
            onPress={()=>{clearLibraryFilters();setActiveTab('library')}}
            style={({pressed})=>[styles.browseLibrary,{borderColor:p.line,backgroundColor:p.card},pressed&&styles.cardPressed]}>
            <View style={{flex:1}}>
              <Text style={[styles.browseLibraryTitle,{color:p.ink}]}>Browse the full library</Text>
              <Text style={[styles.meta,{color:p.muted}]}>Search, filter and manage every title</Text>
            </View>
            <Text style={[styles.browseArrow,{color:p.sage}]}>›</Text>
          </Pressable> : null}

          <View style={styles.shelfSignature}>
            <View style={[styles.shelfRule,{backgroundColor:p.sage}]} />
            <Text style={[styles.shelfSignatureText,{color:p.muted}]}>Your library. Yours.</Text>
          </View>
        </ScrollView>}
        <WorkPickerPanel />
        {editing ? <Modal transparent animationType="fade" visible onRequestClose={()=>!busy&&setEditing(null)}>
          <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS==='ios'?'padding':undefined}>
            <View style={styles.modalBackdrop}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
                <View accessibilityViewIsModal accessibilityLabel={'Edit details for '+editing.title} style={[styles.modalCard,{backgroundColor:p.card,borderColor:p.line}]}>
                  <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Review details</Text>
                  {editing.reviewReason ? <Text style={[styles.meta,{color:p.muted}]}>{editing.reviewReason}</Text> : null}
                  <TextInput accessibilityLabel="Corrected title" value={editTitle} onChangeText={setEditTitle} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
                  <TextInput accessibilityLabel="Author" value={editAuthor} onChangeText={setEditAuthor} placeholder="Author" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
                  <TextInput accessibilityLabel="Series" value={editSeries} onChangeText={setEditSeries} placeholder="Series" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
                  <TextInput accessibilityLabel="Genre" value={editGenre} onChangeText={setEditGenre} placeholder="Genre" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
                  <View style={styles.toolRow}>
                    <Button label="Save details" disabled={busy || !editTitle.trim()} onPress={()=>{
                      const title=editTitle.trim(),author=editAuthor.trim(),seriesName=editSeries.trim(),genre=editGenre.trim();
                      if(!title)return;
                      setBusy(true);setError('');
                      if(session){
                        request(session,'/api/assets/'+editing.id+'/metadata','PATCH',{title,author,series:seriesName,genre})
                          .then(()=>{setBooks(old=>old.map(b=>b.id===editing.id?{...b,title,author,series:seriesName,genre,needsReview:false,reviewReason:'',metadataSource:'manual',identificationConfidence:'high'}:b));setEditing(null);})
                          .catch(e=>setError(e.message)).finally(()=>setBusy(false));
                      }else if(editing.uri){
                        const next={...localMetadataOverrides,[editing.uri]:{title,author,series:seriesName,genre}};
                        setLocalMetadataOverrides(next);
                        setPersistedJSON(localMetadataOverridesKey, next)
                          .then(()=>{
                            setBooks(old=>{
                              const updated=old.map(b=>b.uri===editing.uri?{...b,title,author,series:seriesName,genre,needsReview:false,reviewReason:'',metadataSource:'manual' as const,identificationConfidence:'high' as const}:b);
                              void setPersistedJSON(localCatalogKey,updated);
                              return updated;
                            });
                            setEditing(null);
                          })
                          .catch(e=>setError(e.message)).finally(()=>setBusy(false));
                      }else{
                        setBusy(false);
                      }
                    }}/>
                    <Button label="Cancel" tone="quiet" disabled={busy} onPress={()=>setEditing(null)}/>
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>:null}
        </View>
      </View>
    );
  }

  function Player() {
    const current = playing;
    const position = session ? playback?.seconds || 0 : audio.currentTime || 0;
    const duration = session ? playback?.duration || 0 : audio.duration || 0;
    const isPlaying = session ? !!playback?.playing : !!audio.playing;
    const speed = session ? playback?.speed || 1 : localSpeed;
    const currentChapterIndex = chapters.findIndex(chapter => position >= chapter.start && (chapter.end <= chapter.start || position < chapter.end));
    const currentChapter = currentChapterIndex >= 0 ? chapters[currentChapterIndex] : null;
    const remaining = Math.max(0, duration - position);
    const nativeSleepSupported = typeof (player as typeof player & {setSleepTimer?: (seconds:number)=>void}).setSleepTimer === 'function';

    function seekTo(seconds: number) {
      const target = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, seconds));
      if (session) void controller.seek(target);
      else void player.seekTo(target);
    }

    function setPlayerSpeed(rate: number) {
      if (session) controller.setSpeed(rate);
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
      <ScrollView contentContainerStyle={styles.playerScreen}>
        <View style={styles.playerHeading}>
          <View>
            <Text style={[styles.playerEyebrow, {color:p.gold}]}>NOW PLAYING</Text>
            <Text style={[styles.title, {color: p.ink}]}>Listen</Text>
          </View>
          {current ? <Text style={[styles.meta,{color:p.muted}]}>{speed}×</Text> : null}
        </View>
        {current ? (
          <>
            <View style={[styles.playerArtworkFrame,{backgroundColor:p.card,borderColor:p.line}]}>
              <Cover book={{...current, coverShape:'square'}} large />
            </View>
            <View style={styles.playerIdentity}>
              <Text numberOfLines={2} style={[styles.nowTitle, {color: p.ink}]}>{current.title}</Text>
              <Text numberOfLines={2} style={[styles.playerByline, {color: p.muted}]}>
                {[current.author, current.series, current.space].filter(Boolean).join(' · ')}
              </Text>
              {currentChapter ? <Text numberOfLines={1} style={[styles.playerChapter,{color:p.sage}]}>
                Chapter {currentChapterIndex + 1} of {chapters.length} · {currentChapter.title}
              </Text> : null}
            </View>

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
                <View style={[styles.progressFill, {backgroundColor: p.gold, width: `${displayedProgress * 100}%`}]} />
              </View>
            </Pressable>
            <View style={styles.timeRow}>
              <Text style={[styles.playerTime, {color: p.ink}]}>{formatTime(position)}</Text>
              <Text style={[styles.meta, {color: p.muted}]}>−{formatTime(remaining)}</Text>
              <Text style={[styles.playerTime, {color: p.ink}]}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.transport}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back 15 seconds" onPress={() => seekTo(position - 15)} style={[styles.skipButton,{borderColor:p.line,backgroundColor:p.card}]}>
                <Text style={[styles.skipMain,{color:p.ink}]}>15</Text>
                <Text style={[styles.skipMeta,{color:p.muted}]}>back</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                disabled={session ? playback?.loading : false}
                style={({pressed})=>[styles.playButton,{backgroundColor:p.sage,transform:[{scale:pressed?0.97:1}]}]}
                onPress={() => session ? controller.toggle() : isPlaying ? player.pause() : player.play()}>
                <Text style={styles.playButtonGlyph}>{session && playback?.loading ? '…' : isPlaying ? 'Ⅱ' : '▶'}</Text>
                <Text style={styles.playButtonCaption}>{session && playback?.loading ? 'Loading' : isPlaying ? 'Pause' : 'Play'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Forward 30 seconds" onPress={() => seekTo(position + 30)} style={[styles.skipButton,{borderColor:p.line,backgroundColor:p.card}]}>
                <Text style={[styles.skipMain,{color:p.ink}]}>30</Text>
                <Text style={[styles.skipMeta,{color:p.muted}]}>forward</Text>
              </Pressable>
            </View>

            <View style={[styles.playerTools,{backgroundColor:p.card,borderColor:p.line}]}>
              <Pressable accessibilityRole="button" accessibilityLabel={'Playback speed '+speed+' times'} accessibilityState={{expanded:playerPanel==='speed'}} onPress={() => setPlayerPanel(playerPanel==='speed'?null:'speed')} style={styles.playerTool}>
                <Text style={[styles.playerToolValue,{color:p.ink}]}>{speed}×</Text>
                <Text style={[styles.playerToolLabel,{color:p.muted}]}>Speed</Text>
              </Pressable>
              {session && nativeSleepSupported ? <Pressable accessibilityRole="button" accessibilityLabel="Sleep timer" accessibilityState={{expanded:playerPanel==='sleep'}} onPress={() => setPlayerPanel(playerPanel==='sleep'?null:'sleep')} style={[styles.playerTool,styles.playerToolBorder,{borderColor:p.line}]}>
                <Text style={[styles.playerToolValue,{color:p.ink}]}>{playback?.sleepAt ? 'On' : '—'}</Text>
                <Text style={[styles.playerToolLabel,{color:p.muted}]}>Sleep</Text>
              </Pressable> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={'Queue, '+queuedBooks.length+' item'+(queuedBooks.length===1?'':'s')} accessibilityState={{expanded:playerPanel==='queue'}} onPress={() => setPlayerPanel(playerPanel==='queue'?null:'queue')} style={[styles.playerTool,styles.playerToolBorder,{borderColor:p.line}]}>
                <Text style={[styles.playerToolValue,{color:p.ink}]}>{queuedBooks.length}</Text>
                <Text style={[styles.playerToolLabel,{color:p.muted}]}>Queue</Text>
              </Pressable>
            </View>

            {playback?.error ? <Text accessibilityRole="alert" style={[styles.playerNotice,{color:p.gold,borderColor:p.gold}]}>{playback.error}</Text> : null}

            {playerPanel==='speed' ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Playback speed</Text>
              <View style={styles.toolRow}>{[0.75,1,1.25,1.5,1.75,2].map(rate=><Button key={rate} label={rate+'×'} tone={rate===speed?'primary':'quiet'} onPress={()=>setPlayerSpeed(rate)} />)}</View>
            </View> : null}

            {playerPanel==='sleep' && session && nativeSleepSupported ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Sleep timer</Text>
              <View style={styles.toolRow}>{[0,15,30,45,60].map(minutes=><Button key={minutes} label={minutes?minutes+' min':'Off'} tone="quiet" onPress={()=>controller.sleep(minutes)} />)}</View>
            </View> : null}

            {playerPanel==='queue' ? <View style={[styles.playerPanel,{backgroundColor:p.card,borderColor:p.line}]}>
              {session ? <>
                <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Chapters</Text>
                {chapterError?<Text accessibilityRole="alert" style={{color:p.gold}}>{chapterError}</Text>:chapters.length===0?<Text style={{color:p.muted}}>No embedded chapters</Text>:null}
                {chapters.map((chapter,index)=><Pressable key={index} accessibilityRole="button" accessibilityLabel={'Chapter '+(index+1)+', '+chapter.title+', '+formatTime(chapter.start)} onPress={()=>seekTo(chapter.start)} style={[styles.chapterRow,currentChapterIndex===index && {backgroundColor:p.raised}]}>
                  <Text style={[styles.chapterIndex,{color:p.gold}]}>{index+1}</Text>
                  <View style={{flex:1}}>
                    <Text numberOfLines={1} style={{color:p.ink,fontWeight:currentChapterIndex===index?'800':'600'}}>{chapter.title}</Text>
                    <Text style={[styles.meta,{color:p.muted}]}>{formatTime(chapter.start)}</Text>
                  </View>
                </Pressable>)}
                {playback?.tracks && playback.tracks.length > 1 ? <>
                  <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Files</Text>
                  {playback.tracks.map((track,index)=><Button key={track.id} label={(index+1)+'. '+track.title} disabled={!track.available || playback.loading} tone={index===playback.index?'primary':'quiet'} onPress={()=>void controller.select(index)} />)}
                </> : null}
              </> : null}
              {!session && activeLocalWork && activeLocalWork.tracks.length > 1 ? <>
                <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Files</Text>
                {activeLocalWork.tracks.map((track,index)=><Button
                  key={track.uri}
                  label={(index+1)+'. '+track.title}
                  disabled={!track.available}
                  tone={index===localWorkIndex?'primary':'quiet'}
                  onPress={()=>void loadLocalWorkTrack(activeLocalWork,index,0)}
                />)}
              </> : null}
              <View style={styles.queueHeader}>
                <Text style={[styles.playerPanelTitle,{color:p.ink}]}>Up next</Text>
                {session ? <Button label="Refresh" disabled={queueBusy} tone="quiet" onPress={()=>void queueStore?.reload()}/> : null}
              </View>
              {!queuedBooks.length ? <Text style={[styles.meta,{color:p.muted}]}>Nothing queued. Add audiobooks from Shelf.</Text> : null}
              {queuedBooks.map((book,index)=><View key={(book.localWorkKey || book.uri || '') + book.id} style={[styles.queueBook,{borderColor:p.line}]}>
                <Pressable accessibilityRole="button" style={{flex:1}} onPress={()=>{void playBook(book).then(()=>{if(session && controller.state.playing)void queueStore?.edit(items=>items.filter(b=>b.id!==book.id));});}}>
                  <Text numberOfLines={1} style={{color:p.ink,fontWeight:'800'}}>{book.title}</Text>
                  <Text style={[styles.meta,{color:p.muted}]}>#{index+1}{book.author ? ' · '+book.author : ''}</Text>
                </Pressable>
                <View style={styles.queueActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={'Move '+book.title+' up in queue'} disabled={queueBusy || index===0} onPress={()=>session ? void queueStore?.edit(items=>reorder(items,items.findIndex(b=>b.id===book.id),-1)) : void updateLocalQueue(reorder(queuedBooks, queuedBooks.findIndex(b=>b.uri===book.uri), -1))}><Text style={{color:index===0?p.muted:p.sage,fontWeight:'900'}}>↑</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={'Move '+book.title+' down in queue'} disabled={queueBusy || index===queuedBooks.length-1} onPress={()=>session ? void queueStore?.edit(items=>reorder(items,items.findIndex(b=>b.id===book.id),1)) : void updateLocalQueue(reorder(queuedBooks, queuedBooks.findIndex(b=>b.uri===book.uri), 1))}><Text style={{color:index===queuedBooks.length-1?p.muted:p.sage,fontWeight:'900'}}>↓</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={'Remove '+book.title+' from queue'} disabled={queueBusy} onPress={()=>session ? void queueStore?.edit(items=>items.filter(b=>b.id!==book.id)) : void updateLocalQueue(queuedBooks.filter(b=>b.uri!==book.uri))}><Text style={{color:p.gold,fontWeight:'800'}}>Remove</Text></Pressable>
                </View>
              </View>)}
            </View> : null}
          </>
        ) : (
          <View style={[styles.playerEmpty,{backgroundColor:p.card,borderColor:p.line}]}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Nothing playing</Text>
            <Text style={[styles.empty, {color: p.muted}]}>Choose an audiobook from Shelf. Archivist will remember where you stopped.</Text>
            <Button label="Go to Shelf" tone="quiet" onPress={()=>setActiveTab('shelf')} />
          </View>
        )}
      </ScrollView>
    );
  }

  function Reader() {
    const closeReader=()=>{setReading(null);setLocalReader(null);setReaderLoadError('');setReaderLoading(false);setActiveTab('shelf');};
    const readerBar=<View style={[styles.readerBar, {borderBottomColor: p.line, backgroundColor: p.paper}]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to Shelf" onPress={closeReader} style={styles.readerBack}>
        <Text style={[styles.readerAction, {color: p.sage}]}>Shelf</Text>
      </Pressable>
      <View style={styles.readerHeading}>
        <Text numberOfLines={1} style={[styles.readerTitle, {color: p.ink}]}>{reading?.title || 'Reader'}</Text>
        {reading?<Text style={[styles.readerFormat,{color:p.muted}]}>{reading.format}</Text>:null}
      </View>
    </View>;
    if (!reading) {
      return (
        <View style={styles.content}>
          <Text style={[styles.title, {color: p.ink}]}>Reader</Text>
          <Text style={[styles.empty, {color: p.muted}]}>{session ? 'Open an EPUB, PDF or comic from Shelf.' : 'Open an EPUB, PDF or comic from Shelf.'}</Text>
        </View>
      );
    }
    if (!session) {
      return (
        <View style={styles.readerScreen}>
          {readerBar}
          {readerLoading ? <View style={styles.readerLoading}><ActivityIndicator accessibilityLabel="Opening local reader" /><Text style={[styles.meta,{color:p.muted}]}>Opening {reading.format}…</Text></View> : readerLoadError ? (
            <View style={[styles.readerFailure,{backgroundColor:p.card,borderColor:p.line}]}>
              <Text accessibilityRole="alert" style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Couldn’t open this book</Text>
              <Text style={[styles.meta,{color:p.muted}]}>{readerLoadError}</Text>
              <Button label="Back to Shelf" tone="quiet" onPress={closeReader} />
            </View>
          ) : localReader?.html ? (
            <WebView
              originWhitelist={['*']}
              source={{html: localReader.html}}
              onMessage={event => {
                if (!reading?.uri) return;
                try {
                  const message = JSON.parse(event.nativeEvent.data);
                  if (message?.type !== 'reader-position' || !Number.isInteger(message.page) || message.page < 0) return;
                  setLocalReadingProgress(current => {
                    if (current[reading.uri!] === message.page) return current;
                    const next = {...current, [reading.uri!]: message.page};
                    setPersistedJSON(localReadingProgressKey, next).catch(() => undefined);
                    return next;
                  });
                  if (typeof message.complete === 'boolean') {
                    setLocalReadingCurrentComplete(current => {
                      if (current[reading.uri!] === message.complete) return current;
                      const next={...current,[reading.uri!]:message.complete};
                      setPersistedJSON(localReadingCurrentCompleteKey, next).catch(()=>undefined);
                      return next;
                    });
                  }
                  if (message.complete === true) {
                    if(!localReadingComplete[reading.uri!] && reading.localWorkKey){
                      setRatingPrompt({title:reading.title,localWorkKey:reading.localWorkKey});
                    }
                    setLocalReadingComplete(current => {
                      if (current[reading.uri!]) return current;
                      const next = {...current, [reading.uri!]: true};
                      setPersistedJSON(localReadingCompleteKey, next).catch(() => undefined);
                      return next;
                    });
                  }
                } catch {}
              }}
            />
          ) : localReader?.uri ? (
            <WebView originWhitelist={['content://*', 'file://*']} source={{uri: localReader.uri}} allowFileAccess />
          ) : <Text style={[styles.empty, {color: p.muted, padding: 16}]}>Unable to open this file.</Text>}
        </View>
      );
    }
    return (
      <View style={styles.readerScreen}>
        {readerBar}
        <WebView
          key={session.token + reading.id + ':' + readerReloadKey}
          source={{uri: session.server + '/reader.html?asset=' + reading.id, headers: {Authorization: 'Bearer ' + session.token}}}
          incognito
          originWhitelist={[session.server]}
          onShouldStartLoadWithRequest={r => readerNavigationAllowed(r.url, session.server)}
          mixedContentMode="never"
          onLoadStart={()=>{setReaderLoading(true);setReaderLoadError('');}}
          onLoadEnd={()=>setReaderLoading(false)}
          onMessage={event=>{
            try{
              const message=JSON.parse(event.nativeEvent.data);
              if(message?.type==='archivist-reader-ready'){
                setReaderLoading(false);
                setReaderLoadError('');
              }
              if(message?.type==='archivist-reader-complete' && reading.serverWorkId){
                setRatingPrompt({title:reading.title,serverWorkId:reading.serverWorkId});
              }
            }catch{}
          }}
          onHttpError={e => {
            const message='Reader request failed: '+e.nativeEvent.statusCode;
            setReaderLoadError(message);setReaderLoading(false);setError(message);
          }}
          onError={e => {
            const message=e.nativeEvent.description || 'Reader failed to load.';
            setReaderLoadError(message);setReaderLoading(false);setError(message);
          }}
          allowFileAccess={false}
          javaScriptCanOpenWindowsAutomatically={false}
          setSupportMultipleWindows={false}
        />
        {readerLoading?<View pointerEvents="none" style={[styles.readerOverlay,{backgroundColor:p.paper}]}><ActivityIndicator accessibilityLabel="Opening server reader" /><Text style={[styles.meta,{color:p.muted}]}>Opening {reading.format}…</Text></View>:null}
        {readerLoadError?<View style={[styles.readerErrorOverlay,{backgroundColor:p.card,borderColor:p.line}]}>
          <Text accessibilityRole="alert" style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Reader needs attention</Text>
          <Text style={[styles.meta,{color:p.muted}]}>{readerLoadError}</Text>
          <View style={styles.toolRow}>
            <Button label="Retry" onPress={()=>{setReaderLoadError('');setReaderLoading(true);setReaderReloadKey(key=>key+1);}} />
            <Button label="Back to Shelf" tone="quiet" onPress={closeReader} />
          </View>
        </View>:null}
      </View>
    );
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
    setActiveTab('shelf');
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
    const relation=session?serverAtlasRelationship:localAtlasRelationship;
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="Back to Atlas" tone="quiet" onPress={()=>setAtlasFocus(null)} />
        <View style={[styles.atlasFocusHero,{backgroundColor:p.card,borderColor:p.line}]}>
          <Text style={[styles.playerEyebrow,{color:p.gold}]}>{atlasFocus.kind==='space'?'FOLDER':atlasFocus.kind.toUpperCase()}</Text>
          <Text style={[styles.title,{color:p.ink,marginBottom:0}]}>{atlasFocus.value}</Text>
          <Text style={[styles.meta,{color:p.muted}]}>
            {relation ? relation.workCount+' work'+(relation.workCount===1?'':'s') : 'Loading relationships…'}
          </Text>
        </View>
        {atlasLoading ? <ActivityIndicator accessibilityLabel="Loading Atlas relationships" /> : null}
        {atlasCompatibility ? <Text style={[styles.meta,{color:p.gold}]}>Your server is an older Archivist version, so this relationship is calculated from the works currently loaded on your phone. Update the server for complete Atlas links.</Text> : null}
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
            {session ? serverAtlasRelationship?.works.map(work=><Pressable key={work.id} accessibilityRole="button" onPress={()=>void openServerWork(work)} style={[styles.atlasWorkRow,{borderColor:p.line,backgroundColor:p.card}]}>
              <View style={{flex:1}}>
                <Text style={[styles.bookTitle,{color:p.ink}]}>{work.title}</Text>
                <Text style={[styles.meta,{color:p.muted}]}>{work.series || work.author || work.genre || work.format} · {work.format}</Text>
              </View>
              <Text style={{color:p.sage,fontWeight:'900'}}>Open</Text>
            </Pressable>) : localAtlasRelationship?.works.map(work=><Pressable key={work.key} accessibilityRole="button" onPress={()=>openLocalWork(work)} style={[styles.atlasWorkRow,{borderColor:p.line,backgroundColor:p.card}]}>
              <View style={{flex:1}}>
                <Text style={[styles.bookTitle,{color:p.ink}]}>{work.title}</Text>
                <Text style={[styles.meta,{color:p.muted}]}>{work.series || work.author || work.genre || work.format} · {work.format}</Text>
              </View>
              <Text style={{color:p.sage,fontWeight:'900'}}>Open</Text>
            </Pressable>)}
          </View>
          {relation.workCount>relation.works.length ? <Text style={[styles.meta,{color:p.muted}]}>Showing {relation.works.length} of {relation.workCount} works here. Shelf can show the full set.</Text>:null}
          <Button label="View all on Shelf" onPress={()=>atlasSelect(atlasFocus.kind,atlasFocus.value)} />
        </>:null}
      </ScrollView>
    );
  }

  function AtlasUniverse() {
    const nodes:Array<{kind:AtlasKind;value:string;count:number}>=[];
    const add=(kind:AtlasKind,item?:[string,number])=>{if(item?.[0]&&item[1]>0)nodes.push({kind,value:item[0],count:item[1]});};
    add('author',atlas.authors[0]);
    add('series',atlas.series[0]);
    add('genre',atlas.genres[0]);
    add('reading',atlas.reading[0]);
    add('format',atlas.formats[0]);
    add('rating',atlas.ratings.find(([,count])=>count>0));
    add('favourite',atlas.favourites[0]);
    add('space',atlas.spaces[0]);
    const visible=nodes.slice(0,8);
    const graphW=Math.max(300,Math.min(width-40,720));
    const graphH=width>=700?470:390;
    const center={x:graphW/2,y:graphH/2};
    const nodeW=width>=700?122:94;
    const nodeH=width>=700?62:54;
    const positions=[
      {x:.13,y:.22},{x:.50,y:.11},{x:.86,y:.22},{x:.91,y:.55},
      {x:.70,y:.84},{x:.36,y:.87},{x:.09,y:.62},{x:.24,y:.43},
    ];
    return (
      <View accessibilityLabel="Atlas connected library graph" style={[styles.atlasUniverse,{width:graphW,height:graphH,backgroundColor:p.card,borderColor:p.line}]}>
        {visible.map((node,index)=>{
          const pt={x:graphW*positions[index].x,y:graphH*positions[index].y};
          const dx=pt.x-center.x,dy=pt.y-center.y;
          const distance=Math.sqrt(dx*dx+dy*dy);
          const angle=Math.atan2(dy,dx);
          return <View key={'line-'+node.kind+'-'+node.value} pointerEvents="none" style={[styles.atlasLine,{left:center.x,top:center.y,width:distance,backgroundColor:p.line,transformOrigin:'left center',transform:[{rotate:angle+'rad'}]}]} />;
        })}
        <View style={[styles.atlasCenterNode,{left:center.x-52,top:center.y-52,backgroundColor:p.ink,borderColor:p.gold}]}>
          <Text style={[styles.atlasCenterMark,{color:p.gold}]}>A</Text>
          <Text style={[styles.atlasCenterTitle,{color:p.ivory}]}>Library</Text>
          <Text style={[styles.atlasCenterCount,{color:'#c8d4d2'}]}>{session ? (serverSummary?.total ?? serverWorks.length) : localWorks.length} works</Text>
        </View>
        {visible.map((node,index)=>{
          const pt={x:graphW*positions[index].x,y:graphH*positions[index].y};
          const label=node.kind==='space'?'Folder':node.kind.charAt(0).toUpperCase()+node.kind.slice(1);
          return <Pressable
            key={node.kind+'-'+node.value}
            accessibilityRole="button"
            accessibilityLabel={label+' '+node.value+', '+node.count+' works'}
            onPress={()=>setAtlasFocus({kind:node.kind,value:node.value})}
            style={({pressed})=>[
              styles.atlasUniverseNode,
              {left:pt.x-nodeW/2,top:pt.y-nodeH/2,width:nodeW,minHeight:nodeH,backgroundColor:p.raised,borderColor:node.kind==='genre'||node.kind==='series'?p.gold:p.line},
              pressed&&styles.cardPressed,
            ]}>
            <View style={[styles.atlasNodeAccent,{backgroundColor:node.kind==='genre'||node.kind==='series'?p.gold:p.sage}]} />
            <Text numberOfLines={1} style={[styles.atlasNodeKind,{color:p.muted}]}>{label}</Text>
            <Text numberOfLines={1} style={[styles.atlasNodeValue,{color:p.ink}]}>{node.value}</Text>
            <Text style={[styles.atlasNodeCount,{color:p.muted}]}>{node.count}</Text>
          </Pressable>;
        })}
        {!visible.length ? <View style={styles.atlasEmptyUniverse}>
          <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Your Atlas will grow here</Text>
          <Text style={[styles.empty,{color:p.muted,textAlign:'center'}]}>Add books and Archivist will connect authors, series, genres and reading history automatically.</Text>
        </View> : null}
      </View>
    );
  }

  function AtlasChipSection({title,kind,items}: {title:string;kind:AtlasKind;items:Array<[string,number]>}) {
    if(!items.length)return null;
    return <View style={styles.atlasChipSection}>
      <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.atlasExploreRow}>
        {items.slice(0,12).map(([name,count])=><Pressable
          key={kind+'-'+name}
          accessibilityRole="button"
          accessibilityLabel={title+' '+name+', '+count}
          onPress={()=>setAtlasFocus({kind,value:name})}
          style={({pressed})=>[styles.atlasExploreChip,{borderColor:p.line,backgroundColor:p.card},pressed&&styles.cardPressed]}>
          <Text numberOfLines={1} style={[styles.atlasExploreName,{color:p.ink}]}>{name}</Text>
          <Text style={[styles.atlasExploreCount,{color:p.muted}]}>{count}</Text>
        </Pressable>)}
      </ScrollView>
    </View>;
  }

  function Atlas() {
    if(atlasFocus)return <AtlasRelationshipView />;
    return (
      <ScrollView contentContainerStyle={[styles.content,styles.atlasScreen]}>
        <View style={styles.pageHeading}>
          <View>
            <Text style={[styles.pageEyebrow,{color:p.gold}]}>CONNECTED LIBRARY</Text>
            <Text style={[styles.title,{color:p.ink}]}>Atlas</Text>
          </View>
          <Text style={[styles.headerMeta,{color:p.muted}]}>Tap a node</Text>
        </View>
        <Text style={[styles.atlasIntro,{color:p.muted}]}>Follow the threads through your authors, series, genres and reading life.</Text>
        <AtlasUniverse />
        <AtlasChipSection title="Authors" kind="author" items={atlas.authors} />
        <AtlasChipSection title="Series" kind="series" items={atlas.series} />
        <AtlasChipSection title="Genres" kind="genre" items={atlas.genres} />
        <AtlasChipSection title="Reading" kind="reading" items={atlas.reading} />
        <AtlasChipSection title="Ratings" kind="rating" items={atlas.ratings} />
      </ScrollView>
    );
  }

  function Profile() {
    const stats=profileStats;
    const unlocked=profileAchievements.filter(item=>item.unlocked).length;
    return (
      <ScrollView contentContainerStyle={[styles.content,styles.insightsScreen]}>
        <View style={styles.pageHeading}>
          <View>
            <Text style={[styles.pageEyebrow,{color:p.gold}]}>YOUR READING LIFE</Text>
            <Text style={[styles.title,{color:p.ink,marginBottom:0}]}>Insights</Text>
          </View>
          <View style={[styles.profileMonogram,{backgroundColor:p.ink}]}>
            <Text style={[styles.profileMonogramText,{color:p.gold}]}>{(stats?.name || 'A').trim().charAt(0).toUpperCase() || 'A'}</Text>
          </View>
        </View>
        <Text style={[styles.atlasIntro,{color:p.muted}]}>
          {stats ? `${stats.completed} completed · ${stats.inProgress} in progress · ${stats.favourites || 0} favourites` : 'Your reading and listening history, in one calm view.'}
        </Text>

        {profileLoading && session ? <ActivityIndicator accessibilityLabel="Loading profile statistics" /> : null}
        {!stats && !profileLoading ? <Text style={[styles.empty,{color:p.muted}]}>Profile statistics are unavailable.</Text> : null}

        {stats ? <>
          <Text style={[styles.sectionTitle,{color:p.ink}]}>Your library</Text>
          <View style={styles.profileStatsGrid}>
            {[
              ['Works',stats.works],
              ['In progress',stats.inProgress],
              ['Completed',stats.completed],
              ['Formats',stats.formats],
              ['Series',stats.series],
              ['Favourites',stats.favourites || 0],
              ['Rated',stats.rated || 0],
              ['Achievements',unlocked],
            ].map(([label,value])=><View key={String(label)} style={[styles.profileStatCard,{backgroundColor:p.card,borderColor:p.line}]}>
              <Text style={[styles.profileStatValue,{color:p.ink}]}>{value}</Text>
              <Text style={[styles.profileStatLabel,{color:p.muted}]}>{label}</Text>
            </View>)}
          </View>

          {(stats.rated || 0)>0 ? <View style={[styles.profileBreakdown,{backgroundColor:p.card,borderColor:p.line}]}>
            <View style={styles.profileBreakdownRow}>
              <Text style={[styles.meta,{color:p.ink,fontWeight:'800'}]}>Your ratings</Text>
              <Text style={[styles.meta,{color:p.gold,fontWeight:'900'}]}>{ratingLabel(stats.averageRating || 0)} average · {stats.favourites || 0} favourite{(stats.favourites||0)===1?'':'s'}</Text>
            </View>
          </View> : null}
          <View style={[styles.profileBreakdown,{backgroundColor:p.card,borderColor:p.line}]}>
            <View style={styles.profileBreakdownRow}>
              <Text style={[styles.meta,{color:p.ink,fontWeight:'800'}]}>Listening</Text>
              <Text style={[styles.meta,{color:p.muted}]}>{stats.completedAudio} finished · {stats.inProgressAudio} in progress</Text>
            </View>
            <View style={[styles.profileDivider,{backgroundColor:p.line}]} />
            <View style={styles.profileBreakdownRow}>
              <Text style={[styles.meta,{color:p.ink,fontWeight:'800'}]}>Reading</Text>
              <Text style={[styles.meta,{color:p.muted}]}>{stats.completedReading} finished · {stats.inProgressReading} in progress</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle,{color:p.ink}]}>Achievements</Text>
          <Text style={[styles.empty,{color:p.muted}]}>{unlocked} of {profileAchievements.length} earned. Only verified library and progress data counts.</Text>
          <View style={{gap:10}}>
            {profileAchievements.map(item=>{
              const ratio=clampProgress(item.progress,item.target);
              return <View key={item.id} style={[styles.achievementCard,{backgroundColor:p.card,borderColor:item.unlocked?p.gold:p.line}]}>
                <View style={styles.achievementHeader}>
                  <View style={{flex:1,gap:2}}>
                    <Text style={[styles.achievementTitle,{color:p.ink}]}>{item.title}</Text>
                    <Text style={[styles.meta,{color:p.muted}]}>{item.description}</Text>
                  </View>
                  <Text style={[styles.achievementState,{color:item.unlocked?p.gold:p.muted}]}>{item.unlocked?'Earned':item.progress+' / '+item.target}</Text>
                </View>
                <View style={[styles.achievementTrack,{backgroundColor:p.line}]}>
                  <View style={[styles.achievementFill,{backgroundColor:item.unlocked?p.gold:p.sage,width:`${Math.round(ratio*100)}%`}]} />
                </View>
              </View>;
            })}
          </View>
        </> : null}
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
                <Text style={[styles.meta,{color:p.gold,fontWeight:'900'}]}>{result.exact.reduce((n,set)=>n+set.items.length,0)} files confirmed in exact duplicate sets</Text>
                {result.exact.map(set=><View key={set.sha256} style={[styles.duplicateExact,{borderColor:p.gold}]}>
                  <Text style={[styles.meta,{color:p.ink,fontWeight:'800'}]}>Exact SHA-256 match · {set.items.length} files</Text>
                  {set.items.map(item=><Text key={item.id} numberOfLines={2} style={[styles.meta,{color:p.muted}]}>• {item.path}</Text>)}
                </View>)}
                {result.unique.length?<Text style={[styles.meta,{color:p.muted}]}>{result.unique.length} candidate file{result.unique.length===1?'':'s'} proved unique.</Text>:null}
                {result.errors.map(item=><Text key={'err-'+item.id} style={[styles.meta,{color:p.gold}]}>File {item.id}: {item.error}</Text>)}
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
    if(session || !books.length)return null;
    return (
      <View style={[styles.setupPanel,{backgroundColor:p.card,borderColor:p.line}]}>
        <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Organise local files</Text>
        <Text style={[styles.meta,{color:p.muted}]}>Preview first. Archivist copies into the organised layout and leaves originals untouched until you choose to clean up the copy history.</Text>
        <View style={styles.segment}>
          {[
            ['author-title','Author / Title'],
            ['author-series-title','Author / Series / Title'],
            ['format-author-title','Format / Author / Title'],
          ].map(([id,label])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:sortTemplate===id}} onPress={()=>setSortTemplate(id)} style={[styles.segmentItem,{borderColor:p.line,backgroundColor:sortTemplate===id?p.sage:p.card}]}><Text style={{color:sortTemplate===id?p.ivory:p.ink,textAlign:'center'}}>{label}</Text></Pressable>)}
        </View>
        <Button label="Preview visible local items" disabled={visibleBooks.length===0} tone="quiet" onPress={previewLocalSortBatch}/>
        <Button label="Copy organised files" disabled={busy || localMovePreviews.every(item=>item.state!=='ready')} onPress={()=>void applyLocalSortBatch()}/>
        {moveStatus?<Text accessibilityLiveRegion="polite" style={[styles.meta,{color:p.gold}]}>{moveStatus}</Text>:null}
        {localMovePreviews.slice(0,20).map(item=><View key={item.id} style={[styles.sourceRow,{borderColor:p.line}]}>
          <Text style={{color:p.ink,fontWeight:'700'}}>{item.title}</Text>
          <Text style={{color:p.muted}}>From: {item.from}</Text>
          <Text style={{color:item.state==='conflict'||item.state==='review'?p.gold:p.muted}}>To: {item.to}</Text>
          <Text style={{color:item.state==='review'?p.gold:p.muted}}>{item.state==='review'?'Review metadata before organising':item.state}</Text>
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
          {partial.length?<Text style={[styles.meta,{color:p.gold}]}>{partial.length} paused or interrupted download{partial.length===1?'':'s'} · {formatBytes(offlineStorage?.partialBytes||0)} partial data</Text>:null}
          {offlineStorage?.missingFiles?<Text style={[styles.meta,{color:p.gold}]}>{offlineStorage.missingFiles} missing downloaded file{offlineStorage.missingFiles===1?'':'s'} detected</Text>:null}
        </View>
      </View>
      <View style={styles.toolRow}>
        <Button label={offlineStorageBusy?'Checking…':'Refresh storage'} disabled={offlineStorageBusy||offlineBusyId!==null} tone="quiet" onPress={()=>void refreshOfflineStorage()} />
        <Button label="Clean up storage" disabled={offlineStorageBusy||offlineBusyId!==null} tone="quiet" onPress={()=>void cleanupDownloads()} />
      </View>
      {offlineProgress?<Text accessibilityLiveRegion="polite" style={[styles.meta,{color:p.gold}]}>{offlineProgress}</Text>:null}
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
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, {color: p.ink}]}>Settings</Text>
        <Text style={[styles.sectionTitle, {color: p.ink}]}>Appearance</Text>
        <View style={styles.segment}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map(mode => (
            <Pressable key={mode} accessibilityRole="button" accessibilityState={{selected:theme===mode}} onPress={() => void chooseTheme(mode)} style={[styles.segmentItem, {borderColor: p.line, backgroundColor: theme === mode ? p.sage : p.card}]}>
              <Text style={{color: theme === mode ? p.ivory : p.ink}}>{mode[0].toUpperCase() + mode.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.sectionTitle,{color:p.ink}]}>Library health</Text>
        <Text style={[styles.meta,{color:p.muted}]}>Review possible duplicate files without making destructive changes.</Text>
        {(!session || owner)?<Button label="Review duplicates" tone="quiet" onPress={()=>void openDuplicateReview()} />:null}
        <DuplicateReviewPanel />
        <LocalSortingPanel />
        <OfflineDownloadsPanel />
        <Text style={[styles.sectionTitle, {color: p.ink}]}>Server</Text>
        {session ? <Text style={[styles.meta, {color: p.muted}]}>{session.server}</Text> : recoverableSession ? (
          <View style={[styles.serverRecovery,{backgroundColor:p.card,borderColor:p.line}]}>
            <Text style={{color:p.ink,fontWeight:'800'}}>Saved server offline</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{recoverableSession.server}</Text>
            <Text style={[styles.meta,{color:p.muted}]}>Your local library remains available. Retry without re-entering your access key.</Text>
            <View style={styles.toolRow}>
              <Button label={busy?'Retrying…':'Retry server'} disabled={busy} onPress={()=>void retrySavedServer()} />
              <Button label="Forget saved server" disabled={busy} tone="quiet" onPress={()=>void forgetSavedServer()} />
            </View>
          </View>
        ) : <Text style={[styles.meta, {color: p.muted}]}>No server connected. Your phone library works locally.</Text>}
        {!session && !recoverableSession ? (serverPanelOpen ? <ServerConnect /> : <Button label="Add server" tone="quiet" onPress={() => setServerPanelOpen(true)} />) : null}
        {owner ? <View style={{gap:10}}>
          <Text style={[styles.sectionTitle,{color:p.ink}]}>Family users</Text>
          <Text style={[styles.meta,{color:p.muted}]}>Users can browse, read, listen, rate, favourite and download. Only Admin can manage files, metadata, users or server settings.</Text>
          <TextInput accessibilityLabel="New user name" value={newUserName} onChangeText={setNewUserName} placeholder="Name" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
          <Button label={busy?'Creating…':'Add user'} disabled={busy||!newUserName.trim()} tone="quiet" onPress={()=>void createFamilyUser()} />
          {newUserKey?<View style={[styles.serverRecovery,{backgroundColor:p.card,borderColor:p.gold}]}>
            <Text style={{color:p.ink,fontWeight:'800'}}>User access key — shown once</Text>
            <Text style={[styles.meta,{color:p.muted}]}>Give this key to the family member when they connect the Archivist server.</Text>
            <Text selectable style={{color:p.gold,fontWeight:'800'}}>{newUserKey}</Text>
            <Button label="Hide key" tone="quiet" onPress={()=>setNewUserKey('')} />
          </View>:null}
          {householdUsers.map(user=><View key={user.id} style={[styles.sourceRow,{borderColor:p.line}]}>
            <View style={{flex:1}}>
              <Text style={{color:p.ink,fontWeight:'800'}}>{user.name}</Text>
              <Text style={[styles.meta,{color:p.muted}]}>{user.revoked?'Revoked':'User · whole library'}</Text>
            </View>
            {!user.revoked?<Button label="Revoke" tone="quiet" disabled={busy} onPress={()=>void revokeFamilyUser(user.id)} />:null}
          </View>)}
          <Text style={[styles.sectionTitle,{color:p.ink}]}>Source folders</Text>
          {sources.map(s=><View key={s.id} style={{gap:6}}><Text style={{color:p.ink}}>{s.space}</Text><Text style={{color:p.muted}}>{s.path}</Text><Text style={{color:p.muted}}>{s.status}</Text><Button label="Scan folder" disabled={busy} tone="quiet" onPress={()=>void sourceAction('/api/sources/'+s.id+'/scan')}/><Button label="Remove folder" disabled={busy} tone="quiet" onPress={()=>void removeSource(s.id)}/></View>)}
          <TextInput accessibilityLabel="Folder on server" value={folderPath} onChangeText={setFolderPath} placeholder="/media/books" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]}/>
          <TextInput accessibilityLabel="Library space" value={folderSpace} onChangeText={setFolderSpace} style={[styles.input,{color:p.ink,borderColor:p.line}]}/>
          <Button label="Add folder" disabled={busy || !folderPath.trim()} onPress={()=>void sourceAction('/api/sources',{path:folderPath,space:folderSpace})}/>
          <Text style={[styles.sectionTitle,{color:p.ink}]}>Safe file sorting</Text>
          <Text style={[styles.meta,{color:p.muted}]}>Preview first. Archivist verifies data before removing originals; unresolved moves block scans until applied or reviewed.</Text>
          <View style={styles.segment}>
            {[
              ['author-title','Author / Title'],
              ['author-series-title','Author / Series / Title'],
              ['format-author-title','Format / Author / Title'],
            ].map(([id,label])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:sortTemplate===id}} onPress={()=>setSortTemplate(id)} style={[styles.segmentItem,{borderColor:p.line,backgroundColor:sortTemplate===id?p.sage:p.card}]}><Text style={{color:sortTemplate===id?p.ivory:p.ink,textAlign:'center'}}>{label}</Text></Pressable>)}
          </View>
          <Button label="Preview matching files" disabled={busy || shelfLoading} tone="quiet" onPress={()=>void previewLibrary(false)}/>
          <Button label="Preview entire library" disabled={busy} tone="quiet" onPress={()=>void previewLibrary(true)}/>
          <Button label="Apply pending safe moves" disabled={busy} onPress={()=>void applySortBatch()}/>
          {moveStatus?<Text style={[styles.meta,{color:p.gold}]}>{moveStatus}</Text>:null}
        </View>:null}
        {session ? <Button label="Sign out" tone="gold" onPress={() => void signOut()} /> : null}
      </ScrollView>
    );
  }

  function CurrentTab() {
    if (activeTab === 'shelf' || activeTab === 'library') return Shelf();
    if (activeTab === 'player') return Player();
    if (activeTab === 'reader') return Reader();
    if (activeTab === 'atlas') return Atlas();
    if (activeTab === 'insights' || activeTab === 'profile') return Profile();
    return Settings();
  }

  if (restoring) {
    return (
      <SafeAreaView style={[styles.screen, {backgroundColor: p.paper}]}>
        <ActivityIndicator accessibilityLabel="Restoring session" />
      </SafeAreaView>
    );
  }

  const tabs: Array<{id: Tab; label: string; icon: string}> = [
    {id: 'shelf', label: 'Shelf', icon: '⌂'},
    {id: 'library', label: 'Library', icon: '▦'},
    {id: 'atlas', label: 'Atlas', icon: '✦'},
    {id: 'insights', label: 'Insights', icon: '◌'},
  ];

  return (
    <SafeAreaView style={[styles.screen, {backgroundColor: p.paper}]}>
      <View style={[styles.appHeader, {borderBottomColor: p.line,backgroundColor:p.paper}]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Shelf" onPress={()=>setActiveTab('shelf')} style={styles.brandLockup}>
          <Text style={[styles.logoSmall, {color: p.ink}]}>Archivist</Text>
          <Text style={[styles.brandTagline,{color:p.muted}]}>YOUR LIBRARY. YOURS.</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <View accessibilityLabel={session?'Server connected':'Local library'} style={[styles.connectionDot,{backgroundColor:session?p.sage:p.gold}]} />
          <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={()=>setActiveTab('settings')} style={({pressed})=>[styles.headerButton,{borderColor:p.line,backgroundColor:p.card},pressed&&styles.cardPressed]}>
            <Text style={[styles.headerButtonText,{color:p.ink}]}>⚙</Text>
          </Pressable>
        </View>
      </View>
      {error ? <View style={[styles.errorBanner,{borderColor:p.gold,backgroundColor:p.card}]}>
        <Text accessibilityRole="alert" style={[styles.error, {color: p.gold,flex:1}]}>{error}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss error" hitSlop={8} onPress={()=>setError('')} style={styles.errorDismiss}>
          <Text style={{color:p.gold,fontSize:20,fontWeight:'900'}}>×</Text>
        </Pressable>
      </View> : null}
      <View style={styles.tabBody}>
        {CurrentTab()}
      </View>
      <CelebrationOverlay
        active={celebrating || !!achievementCelebration}
        title={achievementCelebration ? achievementCelebration.title : undefined}
        copy={achievementCelebration ? achievementCelebration.description : undefined}
      />
      <RatingPromptPanel />
      {playing ? (
        <View style={[styles.miniPlayer, {backgroundColor: p.ink}]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Open player for '+playing.title}
            onPress={() => setActiveTab('player')}
            style={styles.miniPlayerMain}>
            <MiniArtwork book={playing} />
            <View style={{flex: 1}}>
              <Text numberOfLines={1} style={[styles.miniTitle, {color: p.ivory}]}>{playing.title}</Text>
              <Text style={[styles.miniMeta, {color: '#c8d4d2'}]}>{formatTime(session ? playback?.seconds || 0 : audio.currentTime || 0)} · {(session ? playback?.playing : audio.playing) ? 'Playing' : 'Paused'}</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={(session ? playback?.playing : audio.playing) ? 'Pause '+playing.title : 'Play '+playing.title}
            hitSlop={6}
            onPress={() => session ? controller.toggle() : audio.playing ? player.pause() : player.play()}
            style={styles.miniButton}>
            <Text style={styles.miniButtonText}>{(session ? playback?.playing : audio.playing) ? 'Pause' : 'Play'}</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={[styles.tabBar, {backgroundColor: p.card, borderTopColor: p.line}]}>
        {tabs.map(tab => (
          <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{selected: activeTab === tab.id}} onPress={() => setActiveTab(tab.id)} style={({pressed})=>[styles.tab,pressed&&{opacity:.68}]}>
            <View style={[styles.tabIconWrap,activeTab===tab.id&&{backgroundColor:p.raised}]}>
              <Text style={[styles.tabIcon,{color:activeTab===tab.id?p.sage:p.muted}]}>{tab.icon}</Text>
            </View>
            <Text style={[styles.tabText, {color: activeTab === tab.id ? p.ink : p.muted}]}>{tab.label}</Text>
          </Pressable>
        ))}
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
  appHeader: {minHeight: 68, paddingHorizontal: 20, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  brandLockup: {gap:1},
  brandTagline: {fontSize:8,fontWeight:'800',letterSpacing:2.2},
  headerActions: {flexDirection:'row',alignItems:'center',gap:10},
  connectionDot: {width:7,height:7,borderRadius:4},
  headerButton: {width:40,height:40,borderRadius:20,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center'},
  headerButtonText: {fontSize:17,fontWeight:'600'},
  pageHeading: {flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:16},
  pageEyebrow: {fontSize:10,fontWeight:'900',letterSpacing:2.4,marginBottom:3},
  sectionHeadingRow: {flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  sectionLink: {fontSize:13,fontWeight:'800'},
  cardPressed: {opacity:.72,transform:[{scale:.985}]},
  shelfEmpty: {borderWidth:StyleSheet.hairlineWidth,borderRadius:16,padding:18,gap:10},
  browseLibrary: {borderWidth:StyleSheet.hairlineWidth,borderRadius:14,paddingHorizontal:16,paddingVertical:14,flexDirection:'row',alignItems:'center',gap:14},
  browseLibraryTitle: {fontSize:15,fontWeight:'800'},
  browseArrow: {fontSize:30,fontWeight:'300',lineHeight:30},
  shelfSignature: {alignItems:'center',gap:9,paddingVertical:10},
  shelfRule: {width:26,height:1},
  shelfSignatureText: {fontFamily:'serif',fontSize:13,fontStyle:'italic'},
  headerMeta: {fontSize: 13},
  content: {padding: 20, gap: 18},
  setupPanel: {borderWidth: 1, borderRadius: 8, padding: 14, gap: 12},
  shelfShell: {flex: 1, flexDirection: 'row'},

  shelfVerticalScroll: {flex:1,marginHorizontal:-20},
  shelfHomeContent: {paddingHorizontal:20,paddingBottom:116,gap:24},
  shelfFeatureRow: {gap:12,paddingRight:20},
  shelfFeatureCard: {width:238,minHeight:104,borderWidth:StyleSheet.hairlineWidth,borderRadius:18,padding:10,flexDirection:'row',alignItems:'center',gap:12},
  shelfFeatureArt: {width:58,height:78,borderRadius:10,overflow:'hidden',justifyContent:'center'},
  shelfFeatureFallback: {fontFamily:'serif',fontSize:28,textAlign:'center'},
  shelfFeatureTitle: {fontFamily:'serif',fontSize:18,fontWeight:'700',marginBottom:3},
  shelfFeatureCount: {fontSize:12,fontWeight:'900',alignSelf:'flex-start',paddingTop:2},
  libraryToolbar: {gap:12},
  librarySearchShell: {minHeight:50,borderWidth:StyleSheet.hairlineWidth,borderRadius:16,flexDirection:'row',alignItems:'center',paddingHorizontal:14},
  librarySearchIcon: {fontSize:21,width:28,textAlign:'left'},
  librarySearchInput: {flex:1,fontSize:16,paddingVertical:12},
  librarySearchClear: {width:34,height:34,alignItems:'center',justifyContent:'center'},
  librarySearchClearText: {fontSize:24,lineHeight:26,fontWeight:'400'},
  libraryFilterRow: {gap:8,paddingRight:18},
  libraryFilterPill: {minHeight:34,borderWidth:StyleSheet.hairlineWidth,borderRadius:999,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:7},
  libraryFilterText: {fontSize:12,fontWeight:'800'},
  libraryFilterCount: {fontSize:11,fontWeight:'800'},
  libraryResultRow: {minHeight:28,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  libraryResultText: {fontSize:12,fontWeight:'600'},
  libraryClearFilters: {fontSize:12,fontWeight:'900'},
  libraryList: {flex:1,marginHorizontal:-7},
  libraryRail: {width: 190, borderRightWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10},
  libraryRailTitle: {fontSize: 13, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4},
  libraryRailList: {gap: 8},
  libraryRailAdd: {paddingVertical: 12, paddingHorizontal: 8},
  libraryChoice: {borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, minHeight: 40, justifyContent: 'center'},
  libraryChoiceVertical: {borderRadius: 8, minHeight: 44},
  libraryChips: {gap: 8, paddingBottom: 2},
  libraryChipsRow: {flexDirection: 'row', gap: 8},
  librarySummary: {borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center'},
  reviewBanner: {borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center'},
  shelfSection: {gap:8},
  continueRow: {gap:14,paddingRight:20},
  continueCard: {width:142,gap:7},
  continueTitle: {fontSize:14,fontWeight:'800'},
  seriesRow: {gap:8,paddingRight:6},
  seriesChip: {minWidth:140,maxWidth:220,borderWidth:1,borderRadius:12,paddingHorizontal:12,paddingVertical:10,gap:2},
  scanBanner: {borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12},
  onboardingCard: {borderWidth: 1, borderRadius: 16, padding: 16, gap: 14},
  onboardingEyebrow: {fontSize: 11, fontWeight: '900', letterSpacing: 2},
  onboardingStep: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  onboardingNumber: {width: 28, height: 28, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', color: '#f8f7f2', fontWeight: '900', overflow: 'hidden'},
  onboardingStepTitle: {fontSize: 15, fontWeight: '800', marginBottom: 2},
  sourceRow: {borderWidth: 1, borderRadius: 8, padding: 12, gap: 4},
  tabBody: {flex: 1},
  title: {fontFamily: 'serif', fontSize: 38, lineHeight:44, letterSpacing:-0.6, marginBottom: 2},
  sectionTitle: {fontFamily:'serif',fontSize: 20, fontWeight: '700', marginTop: 10},
  input: {padding: 14, borderWidth: 1, borderRadius: 8, fontSize: 16},
  button: {backgroundColor: '#397076', borderRadius: 8, paddingHorizontal: 14, minHeight: 46, justifyContent: 'center', alignItems: 'center'},
  buttonGold: {backgroundColor: '#c6a374'},
  buttonQuiet: {backgroundColor: 'transparent', borderWidth: 1, borderColor: '#397076'},
  buttonText: {color: '#f8f7f2', fontSize: 15, fontWeight: '700'},
  buttonQuietText: {color: '#397076'},
  error: {paddingHorizontal: 16, paddingVertical: 8},
  errorBanner: {marginHorizontal:12,marginTop:8,borderWidth:1,borderRadius:10,flexDirection:'row',alignItems:'center'},
  errorDismiss: {width:44,height:44,alignItems:'center',justifyContent:'center'},
  grid: {paddingBottom: 110},
  empty: {fontSize: 15, lineHeight: 22},
  book: {flex: 1, maxWidth: '50%', paddingHorizontal: 7, paddingVertical: 10, gap: 7},
  workQuickRow: {flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:1},
  workQuickAction: {borderWidth:StyleSheet.hairlineWidth,borderRadius:999,paddingHorizontal:9,minHeight:30,justifyContent:'center',maxWidth:'100%'},
  workQuickActionText: {fontSize:11,fontWeight:'800'},
  cover: {aspectRatio: 2 / 3, borderRadius: 10, justifyContent: 'space-between', padding: 12, overflow: 'hidden'},
  coverImage: {position:'absolute',top:0,right:0,bottom:0,left:0,width:'100%',height:'100%'},
  coverSquare: {aspectRatio: 1},
  coverLarge: {width: 230, alignSelf: 'center'},
  coverLargeSquare: {width: 230, height: 230},
  coverFormat: {fontSize: 11, fontWeight: '900', letterSpacing: 1.6},
  coverTitle: {fontFamily: 'serif', fontSize: 20},
  bookTitle: {fontSize: 15, fontWeight: '700'},
  reviewPill: {alignSelf:'flex-start', borderWidth:1, borderRadius:999, paddingHorizontal:8, paddingVertical:3},
  editorCard: {borderWidth:1,borderRadius:14,padding:14,gap:10},
  serverRecovery: {borderWidth:1,borderRadius:14,padding:14,gap:10},
  offlineSummary: {borderWidth:1,borderRadius:14,padding:14,flexDirection:'row',gap:12,alignItems:'center'},
  ratingPromptBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.48)',alignItems:'center',justifyContent:'center',padding:24},
  ratingPromptCard: {width:'100%',maxWidth:420,borderWidth:1,borderRadius:18,padding:18,gap:10},
  modalKeyboard: {flex:1},
  modalBackdrop: {flex:1,backgroundColor:'rgba(0,0,0,.48)',alignItems:'center',justifyContent:'center',padding:20},
  modalScroll: {flexGrow:1,width:'100%',alignItems:'center',justifyContent:'center',paddingVertical:20},
  modalCard: {width:'100%',maxWidth:520,borderWidth:1,borderRadius:18,padding:18,gap:10},
  meta: {fontSize: 13, lineHeight: 19},
  playerScreen: {padding: 18, gap: 16, paddingBottom: 120, maxWidth: 680, width:'100%', alignSelf:'center'},
  playerHeading: {flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},
  playerEyebrow: {fontSize:11,fontWeight:'900',letterSpacing:2},
  playerArtworkFrame: {alignSelf:'center',borderWidth:1,borderRadius:24,padding:10,shadowColor:'#000',shadowOpacity:0.12,shadowRadius:18,elevation:5},
  playerIdentity: {alignItems:'center',gap:5,paddingHorizontal:10},
  nowTitle: {fontFamily: 'serif', fontSize: 30, textAlign: 'center', marginTop: 4},
  playerByline: {fontSize:14,lineHeight:20,textAlign:'center'},
  playerChapter: {fontSize:13,fontWeight:'800',textAlign:'center',marginTop:3},
  progressHitArea: {paddingVertical:10},
  progressTrack: {height: 7, borderRadius: 999, overflow: 'hidden'},
  progressFill: {height: 7, borderRadius: 999},
  timeRow: {flexDirection: 'row', justifyContent: 'space-between',alignItems:'center',marginTop:-8},
  playerTime: {fontSize:13,fontVariant:['tabular-nums'],fontWeight:'700'},
  transport: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22,marginVertical:4},
  skipButton: {width:64,height:64,borderRadius:32,borderWidth:1,alignItems:'center',justifyContent:'center'},
  skipMain: {fontSize:17,fontWeight:'900',lineHeight:19},
  skipMeta: {fontSize:10,fontWeight:'700',textTransform:'uppercase'},
  playButton: {width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center',shadowColor:'#000',shadowOpacity:0.18,shadowRadius:12,elevation:5},
  playButtonGlyph: {color:'#f8f7f2',fontSize:24,fontWeight:'900',lineHeight:28},
  playButtonCaption: {color:'#f8f7f2',fontSize:10,fontWeight:'800',textTransform:'uppercase',letterSpacing:0.6},
  playButtonText: {color: '#f8f7f2', fontSize: 17, fontWeight: '800'},
  playerTools: {borderWidth:1,borderRadius:14,flexDirection:'row',overflow:'hidden'},
  playerTool: {flex:1,minHeight:68,alignItems:'center',justifyContent:'center',padding:8},
  playerToolBorder: {borderLeftWidth:StyleSheet.hairlineWidth},
  playerToolValue: {fontSize:16,fontWeight:'900'},
  playerToolLabel: {fontSize:11,fontWeight:'700',marginTop:2},
  playerPanel: {borderWidth:1,borderRadius:14,padding:14,gap:10},
  playerPanelTitle: {fontSize:16,fontWeight:'900'},
  playerNotice: {borderWidth:1,borderRadius:10,padding:12},
  chapterRow: {flexDirection:'row',alignItems:'center',gap:10,padding:10,borderRadius:10},
  chapterIndex: {width:24,textAlign:'center',fontWeight:'900'},
  queueHeader: {flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  queueBook: {borderTopWidth:StyleSheet.hairlineWidth,paddingVertical:10,flexDirection:'row',gap:10,alignItems:'center'},
  queueActions: {flexDirection:'row',gap:14,alignItems:'center'},
  playerEmpty: {borderWidth:1,borderRadius:16,padding:18,gap:12},
  toolRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between'},
  readerScreen: {flex: 1,position:'relative'},
  readerBar: {minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center',paddingRight:72},
  readerBack: {width: 72, minHeight:54, alignItems: 'center', justifyContent: 'center'},
  readerAction: {fontWeight: '700'},
  readerHeading: {flex:1,alignItems:'center',justifyContent:'center',minWidth:0},
  readerTitle: {width:'100%', textAlign: 'center', fontWeight: '700'},
  readerFormat: {fontSize:10,fontWeight:'800',letterSpacing:1.1,textTransform:'uppercase',marginTop:1},
  readerLoading: {flex:1,alignItems:'center',justifyContent:'center',gap:10,padding:24},
  readerFailure: {margin:18,borderWidth:1,borderRadius:16,padding:18,gap:12},
  readerOverlay: {position:'absolute',top:54,left:0,right:0,bottom:0,zIndex:20,alignItems:'center',justifyContent:'center',gap:10,opacity:0.94},
  readerErrorOverlay: {position:'absolute',left:18,right:18,top:82,zIndex:30,borderWidth:1,borderRadius:16,padding:18,gap:12},
  atlasScreen: {paddingBottom:120},
  atlasIntro: {fontFamily:'serif',fontSize:17,lineHeight:25,maxWidth:620},
  atlasUniverse: {alignSelf:'center',borderWidth:StyleSheet.hairlineWidth,borderRadius:28,overflow:'hidden',position:'relative',marginVertical:4},
  atlasLine: {position:'absolute',height:StyleSheet.hairlineWidth,opacity:.75},
  atlasCenterNode: {position:'absolute',width:104,height:104,borderRadius:52,borderWidth:1.5,alignItems:'center',justifyContent:'center',zIndex:4},
  atlasCenterMark: {fontFamily:'serif',fontSize:27,fontWeight:'800',lineHeight:29},
  atlasCenterTitle: {fontFamily:'serif',fontSize:16,fontWeight:'700'},
  atlasCenterCount: {fontSize:10,fontWeight:'700',marginTop:2},
  atlasUniverseNode: {position:'absolute',borderWidth:StyleSheet.hairlineWidth,borderRadius:18,paddingHorizontal:10,paddingVertical:8,justifyContent:'center',zIndex:5,shadowColor:'#000',shadowOpacity:.06,shadowRadius:8,elevation:2},
  atlasNodeAccent: {position:'absolute',left:9,top:9,width:5,height:5,borderRadius:3},
  atlasNodeKind: {fontSize:8,fontWeight:'900',letterSpacing:1,textTransform:'uppercase',paddingLeft:9},
  atlasNodeValue: {fontFamily:'serif',fontSize:13,fontWeight:'700',marginTop:1},
  atlasNodeCount: {fontSize:9,fontWeight:'700',marginTop:1},
  atlasEmptyUniverse: {position:'absolute',left:32,right:32,top:'35%',alignItems:'center',gap:7},
  atlasChipSection: {gap:9},
  atlasExploreRow: {gap:8,paddingRight:20},
  atlasExploreChip: {minWidth:110,maxWidth:190,borderWidth:StyleSheet.hairlineWidth,borderRadius:999,paddingHorizontal:13,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:8},
  atlasExploreName: {fontSize:13,fontWeight:'800',flexShrink:1},
  atlasExploreCount: {fontSize:11,fontWeight:'800'},
  atlasGroup: {borderWidth: 1, borderRadius: 8, padding: 12, gap: 10},
  atlasRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36},
  atlasText: {fontWeight: '700'},
  atlasBarTrack: {flex: 1, height: 8, borderRadius: 999, overflow: 'hidden'},
  atlasBarFill: {height: 8, borderRadius: 999},
  segment: {flexDirection: 'row', gap: 8},
  segmentItem: {flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center'},
  miniPlayer: {minHeight: 66, marginHorizontal: 12, marginBottom: 8, borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8},
  miniPlayerMain: {flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:10,padding:2},
  miniCover: {width: 42, height: 42, borderRadius: 5, alignItems: 'center', justifyContent: 'center'},
  miniCoverImage: {position:'absolute',top:0,right:0,bottom:0,left:0,width:'100%',height:'100%'},
  miniCoverLabel: {color:'#0f2a36',fontSize:8,fontWeight:'900',letterSpacing:0.6},
  miniTitle: {fontWeight: '800'},
  miniMeta: {fontSize: 12},
  miniButton: {minWidth:64,minHeight:44,paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#f8f7f2',alignItems:'center',justifyContent:'center'},
  miniButtonText: {color: '#f8f7f2', fontWeight: '700'},
  tabBar: {minHeight: 70, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row',paddingHorizontal:8,paddingTop:5},
  tab: {flex: 1, alignItems: 'center', justifyContent: 'center',gap:1},
  tabIconWrap: {width:34,height:26,borderRadius:13,alignItems:'center',justifyContent:'center'},
  tabIcon: {fontSize:16,fontWeight:'700'},
  tabText: {fontSize: 10, fontWeight: '800',letterSpacing:.2},
  celebration: {position:'absolute', left:0, right:0, top:0, bottom:0, alignItems:'center', justifyContent:'center', zIndex:50},
  celebrationParticle: {position:'absolute', fontSize:28, color:'#c6a374', fontWeight:'900'},
  celebrationBadge: {backgroundColor:'#0f2a36', borderRadius:18, paddingHorizontal:20, paddingVertical:16, alignItems:'center', shadowColor:'#000', shadowOpacity:0.22, shadowRadius:14, elevation:10},
  celebrationTitle: {color:'#f8f7f2', fontSize:20, fontWeight:'900'},
  celebrationCopy: {color:'#c8d4d2', fontSize:13, marginTop:3},
  insightsScreen: {paddingBottom:120},
  profileHero: {borderWidth:0,borderRadius:0,padding:0,flexDirection:'row',alignItems:'center',gap:14},
  profileMonogram: {width:50,height:50,borderRadius:25,alignItems:'center',justifyContent:'center'},
  profileMonogramText: {fontFamily:'serif',fontSize:28,fontWeight:'800'},
  profileStatsGrid: {flexDirection:'row',flexWrap:'wrap',gap:8},
  profileStatCard: {width:'31%',minWidth:96,borderWidth:0,borderRadius:12,padding:12,gap:3},
  profileStatValue: {fontFamily:'serif',fontSize:26,fontWeight:'700'},
  profileStatLabel: {fontSize:12,fontWeight:'700'},
  profileBreakdown: {borderWidth:0,borderRadius:12,padding:14,gap:10},
  profileBreakdownRow: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},
  profileDivider: {height:StyleSheet.hairlineWidth},
  achievementCard: {borderWidth:StyleSheet.hairlineWidth,borderRadius:12,padding:14,gap:10},
  achievementHeader: {flexDirection:'row',alignItems:'flex-start',gap:12},
  achievementTitle: {fontSize:15,fontWeight:'900'},
  achievementState: {fontSize:12,fontWeight:'900'},
  achievementTrack: {height:6,borderRadius:999,overflow:'hidden'},
  achievementFill: {height:'100%',borderRadius:999},
  atlasFocusHero: {borderWidth:1,borderRadius:18,padding:16,gap:5},
  atlasRelationGroup: {borderWidth:1,borderRadius:14,padding:14,gap:10},
  atlasChipWrap: {flexDirection:'row',flexWrap:'wrap',gap:8},
  atlasRelationChip: {borderWidth:1,borderRadius:999,paddingHorizontal:11,paddingVertical:8,flexDirection:'row',gap:7,alignItems:'center'},
  atlasWorkRow: {borderWidth:1,borderRadius:12,padding:12,flexDirection:'row',alignItems:'center',gap:10},
  duplicatePanel: {borderWidth:1,borderRadius:16,padding:14,gap:12},
  duplicateGroup: {borderWidth:1,borderRadius:12,padding:12,gap:7},
  duplicateExact: {borderWidth:1,borderRadius:10,padding:10,gap:4},
});
