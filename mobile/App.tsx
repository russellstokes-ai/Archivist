import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  FlatList,
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
import {LocalBook, LocalFolder, LocalScanProgress, LocalSortHistory, LocalSortPreview, applyLocalSortCopies, pickLocalFolder, previewLocalSort, removeLocalSortCopies, scanLocalFolders} from './localLibrary';
import {LocalReaderDocument, buildLocalReaderDocument} from './localReader';

type Book = {
  id: number;
  title: string;
  author: string;
  series: string;
  format: string;
  space: string;
  available: boolean;
  uri?: string;
  identificationConfidence?: 'high' | 'medium' | 'low';
  needsReview?: boolean;
  reviewReason?: string;
  coverShape?: 'portrait' | 'square';
};
type MoveBatchResult = {ok: number; failed: number; items: Array<{asset?: number; error?: string; move?: {id: string; asset: number; from: string; to: string; state: string}}>};
type Tab = 'shelf' | 'player' | 'reader' | 'atlas' | 'settings';
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
const localQueueKey = 'archivist.localQueue';
const localSortHistoryKey = 'archivist.localSortHistory';
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

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function coverInitials(title: string) {
  return title.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]?.toUpperCase()).join('') || 'A';
}

function Button({label, onPress, disabled, tone = 'primary'}: {label: string; onPress: () => void; disabled?: boolean; tone?: 'primary' | 'quiet' | 'gold'}) {
  return (
    <Pressable
      accessibilityRole="button"
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

function CelebrationOverlay({active}: {active: boolean}) {
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
        <Text style={styles.celebrationTitle}>Your library is alive</Text>
        <Text style={styles.celebrationCopy}>Archivist found your first books.</Text>
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
  const [server, setServer] = useState('');
  const [key, setKey] = useState('');
  const [serverPanelOpen, setServerPanelOpen] = useState(false);
  const [serverNotice, setServerNotice] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [localFolders, setLocalFolders] = useState<LocalFolder[]>([]);
  const [localFolderNotice, setLocalFolderNotice] = useState('');
  const [localScanning, setLocalScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<LocalScanProgress | null>(null);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [celebrationEligible, setCelebrationEligible] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [reading, setReading] = useState<Book | null>(null);
  const [localReader, setLocalReader] = useState<LocalReaderDocument | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [playing, setPlaying] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shelf');
  const player = useAudioPlayer(null);
  const audio = useAudioPlayerStatus(player);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playerPanel, setPlayerPanel] = useState<'speed'|'sleep'|'queue'|null>(null);
  const [queuedBooks, setQueuedBooks] = useState<Book[]>([]);
  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});
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
  const [sources,setSources]=useState<Array<{id:number;space:string;path:string;status:string}>>([]);
  const [folderPath,setFolderPath]=useState('');
  const [folderSpace,setFolderSpace]=useState('My library');
  const [editing,setEditing]=useState<Book|null>(null);
  const [editTitle,setEditTitle]=useState('');
  const [editAuthor,setEditAuthor]=useState('');
  const [editSeries,setEditSeries]=useState('');
  const [sortTemplate,setSortTemplate]=useState('author-title');
  const [moveStatus,setMoveStatus]=useState('');
  const [localMovePreviews,setLocalMovePreviews]=useState<LocalSortPreview[]>([]);
  const [localSortHistory,setLocalSortHistory]=useState<LocalSortHistory[]>([]);
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
  const visibleBooks = useMemo(() => {
    if (session) return books;
    const q = query.trim().toLowerCase();
    return books.filter(book => {
      if (space && book.space !== space) return false;
      if (reviewOnly && !book.needsReview) return false;
      if (!q) return true;
      return [book.title, book.author, book.series, book.format, book.space].some(value => value.toLowerCase().includes(q));
    });
  }, [books, query, reviewOnly, session, space]);
  const atlas = useMemo(() => {
    const count = (values: string[]) => {
      const totals = new Map<string, number>();
      for (const value of values.map(v => v.trim()).filter(Boolean)) totals.set(value, (totals.get(value) || 0) + 1);
      return [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
    };
    return {
      formats: count(books.map(book => book.format)),
      authors: count(books.map(book => book.author || 'Unknown author')),
      series: count(books.map(book => book.series).filter(Boolean)),
      spaces: count(books.map(book => book.space)),
      status: [
        ['Available', books.filter(book => book.available).length] as [string, number],
        ['Unavailable', books.filter(book => !book.available).length] as [string, number],
      ].filter(([, total]) => total > 0),
    };
  }, [books]);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', s => controller.update(s.currentTime,s.duration,s.playing,s.didJustFinish,s.error));
    const lifecycle = AppState.addEventListener('change', () => { controller.tick(); void controller.save(); });
    const timer = setInterval(() => controller.tick(),1000);
    return () => { subscription.remove(); lifecycle.remove(); clearInterval(timer); loadCancel.current?.(); void controller.stop(); };
  }, [controller, player]);

  useEffect(() => {
    if (!playback?.completed || !queueRef.current.length) return;
    const next=queueRef.current[0];
    setPlaying(next);
    void controller.open(next.id).then(()=>{if(controller.state.playing)void queueStore?.edit(items=>items.filter(b=>b.id!==next.id));});
  }, [playback?.completed, controller, queueStore]);

  useEffect(() => {
    if (session || !audio.didJustFinish || !queueRef.current.length) return;
    const [next, ...rest] = queueRef.current;
    void updateLocalQueue(rest).then(() => playBook(next));
  }, [audio.didJustFinish, session]);

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
    SecureStore.getItemAsync(localFoldersKey).then(value => {
      if (!value) return;
      const saved = JSON.parse(value) as LocalFolder[];
      if (Array.isArray(saved)) setLocalFolders(saved);
    }).catch(() => undefined);
    SecureStore.getItemAsync(localProgressKey).then(value => {
      if (value) setLocalProgress(JSON.parse(value));
    }).catch(() => undefined);
    SecureStore.getItemAsync(localQueueKey).then(value => {
      if (value) setQueuedBooks(JSON.parse(value));
    }).catch(() => undefined);
    SecureStore.getItemAsync(localSortHistoryKey).then(value => {
      if (value) setLocalSortHistory(JSON.parse(value));
    }).catch(() => undefined);
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
        await request(saved, '/api/me');
        setSession(saved);
      })
      .catch(e => setError(String(e.message || e)))
      .finally(() => setRestoring(false));
    setAudioModeAsync({playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix'}).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setShelfLoading(true);
    const timeout = setTimeout(() => {
      request(session, '/api/books?q=' + encodeURIComponent(query) + '&space=' + encodeURIComponent(space))
        .then(data => {
          if (!cancelled) setBooks(data);
        })
        .catch(e => {
          if (!cancelled) setError(e.message);
        }).finally(() => { if (!cancelled) setShelfLoading(false); });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [session, query, space]);

  useEffect(() => {
    if (!session) { setSpaces([]); return; }
    let cancelled=false;
    request(session,'/api/me').then(profile=>{if(!cancelled)setOwner(profile.owner);}).catch(e=>setError(e.message));
    request(session,'/api/sources').then(items => { if(!cancelled) {setSources(items);setSpaces([...new Set<string>(items.map((s: {space:string})=>s.space))]);} }).catch(e=>setError(e.message));
    return () => {cancelled=true;};
  }, [session]);

  useEffect(() => {
    if (session || !playing?.uri || !audio.currentTime) return;
    const timer = setTimeout(() => {
      const next = {...localProgress, [playing.uri!]: audio.currentTime};
      setLocalProgress(next);
      SecureStore.setItemAsync(localProgressKey, JSON.stringify(next)).catch(() => undefined);
    }, 750);
    return () => clearTimeout(timer);
  }, [audio.currentTime, localProgress, playing, session]);

  useEffect(() => {
    if (session || restoring || !localFolders.length || books.length || localScanning) return;
    void rescanLocalFolders();
  }, [books.length, localFolders, localScanning, restoring, session]);

  async function chooseTheme(next: ThemeMode) {
    setTheme(next);
    await SecureStore.setItemAsync(themeKey, next);
  }

  async function refreshSourcesAndShelf() {
    if(!session)return;
    const items=await request(session,'/api/sources');setSources(items);setSpaces([...new Set<string>(items.map((s:{space:string})=>s.space))]);
    const shelf=await request(session,'/api/books?q='+encodeURIComponent(query)+'&space='+encodeURIComponent(space));setBooks(shelf);
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

  async function previewSort(assetIds: number[]) {
    if(!session)return;setBusy(true);setError('');setMoveStatus('Preparing safe move previews...');
    try {
      const result = await request(session,'/api/file-moves/preview-template-batch','POST',{assets:assetIds,template:sortTemplate}) as MoveBatchResult;
      setMoveStatus(describeBatch(result,'ready to move'));
    } catch(e) {setError((e as Error).message);setMoveStatus('');} finally {setBusy(false);}
  }

  async function applySortBatch() {
    if(!session)return;setBusy(true);setError('');setMoveStatus('Applying pending safe moves...');
    try {
      const result = await request(session,'/api/file-moves/apply-batch','POST',{ids:[]}) as MoveBatchResult;
      setMoveStatus(describeBatch(result,'moved'));
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
    setBooks([]);
    setOwner(false);
    setSources([]);
    setQueuedBooks([]); setSpace('');
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
      const result = await scanLocalFolders(folders, setScanProgress);
      setLocalFolders(result.folders);
      setBooks(result.books);
      setLocalMovePreviews([]);
      setSpaces([...new Set(result.books.map(book => book.space))]);
      await SecureStore.setItemAsync(localFoldersKey, JSON.stringify(result.folders));
      setLocalFolderNotice(`${result.books.length} found · ${result.identified} confidently identified · ${result.review} need review${result.skipped ? ` · ${result.skipped} folders unreadable` : ''}${result.truncated ? ' · first 5,000 shown' : ''}.`);
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
      const result = await scanLocalFolders(localFolders, setScanProgress);
      setLocalFolders(result.folders);
      setBooks(result.books);
      setLocalMovePreviews([]);
      setSpaces([...new Set(result.books.map(book => book.space))]);
      await SecureStore.setItemAsync(localFoldersKey, JSON.stringify(result.folders));
      setLocalFolderNotice(`${result.books.length} found · ${result.identified} confidently identified · ${result.review} need review${result.skipped ? ` · ${result.skipped} folders unreadable` : ''}${result.truncated ? ' · first 5,000 shown' : ''}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLocalScanning(false);
      setScanProgress(null);
    }
  }

  async function playBook(book: Book) {
    if (!session) {
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
    const same = previews.filter(item => item.state === 'same').length;
    setMoveStatus(`${ready} ready; ${conflicts} conflicts; ${same} already organised.`);
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
      await SecureStore.setItemAsync(localSortHistoryKey, JSON.stringify(history));
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
      await SecureStore.setItemAsync(localSortHistoryKey, JSON.stringify(next));
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
    if (book.format === 'Audio') playBook(book);
    else if (!session) {
      if (!book.uri) return;
      setReading(book);
      setActiveTab('reader');
      setReaderLoading(true);
      setLocalReader(null);
      buildLocalReaderDocument(book.uri, book.format, book.title).then(setLocalReader).catch(e => setError(e.message)).finally(() => setReaderLoading(false));
    }
    else {
      setReading(book);
      setActiveTab('reader');
    }
  }

  async function addLocalQueue(book: Book) {
    if (!book.uri) return;
    const next = queuedBooks.some(item => item.uri === book.uri) ? queuedBooks : [...queuedBooks, book];
    setQueuedBooks(next);
    await SecureStore.setItemAsync(localQueueKey, JSON.stringify(next));
  }

  async function updateLocalQueue(next: Book[]) {
    setQueuedBooks(next);
    await SecureStore.setItemAsync(localQueueKey, JSON.stringify(next));
  }

  function Cover({book, large = false}: {book: Book; large?: boolean}) {
    const square = book.coverShape === 'square' || book.format === 'Audio';
    return (
      <View style={[styles.cover, square && styles.coverSquare, large && styles.coverLarge, square && large && styles.coverLargeSquare, {backgroundColor: p.ink}]}>
        <Text style={[styles.coverMark, {color: p.gold}]}>{coverInitials(book.title)}</Text>
        <Text numberOfLines={large ? 4 : 3} style={[styles.coverTitle, {color: p.ivory}]}>{book.title}</Text>
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
            onPress={() => {setSpace(name); setReviewOnly(false);}}
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
    const reviewCount = books.filter(book => book.needsReview).length;
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

  function Shelf() {
    const wideLibraries = width >= 760 && spaces.length > 0;
    const reviewCount = books.filter(book => book.needsReview).length;
    return (
      <View style={styles.shelfShell}>
        {wideLibraries ? <View style={[styles.libraryRail,{borderRightColor:p.line,backgroundColor:p.card}]}>
          <Text style={[styles.libraryRailTitle,{color:p.ink}]}>Libraries</Text>
          <LibrarySwitcher vertical />
          {!session ? <Pressable accessibilityRole="button" onPress={() => void addLocalFolder()} style={styles.libraryRailAdd}><Text style={{color:p.sage,fontWeight:'800'}}>+ Add folder</Text></Pressable> : null}
        </View> : null}
        <View style={[styles.content, {flex: 1}]}>
        <Text style={[styles.title, {color: p.ink}]}>Shelf</Text>
        <OnboardingGuide />
        {!session && onboardingDone ? <View style={[styles.librarySummary,{backgroundColor:p.card,borderColor:p.line}]}>
          <View style={{flex:1}}>
            <Text style={[styles.sectionTitle,{color:p.ink,marginTop:0}]}>Your libraries</Text>
            <Text style={[styles.meta,{color:p.muted}]}>{localFolders.length} folder${localFolders.length === 1 ? '' : 's'} · ${books.length} items${reviewCount ? ` · ${reviewCount} need review` : ''}</Text>
          </View>
          <Button label={localScanning ? 'Scanning…' : 'Add folder'} disabled={localScanning} tone="quiet" onPress={() => void addLocalFolder()} />
        </View> : null}
        {!wideLibraries && spaces.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.libraryChips}><LibrarySwitcher /></ScrollView> : null}
        {reviewOnly ? <View style={[styles.reviewBanner,{backgroundColor:p.card,borderColor:p.gold}]}>
          <Text style={[styles.meta,{color:p.ink,flex:1}]}>Showing only items Archivist could not identify confidently.</Text>
          <Button label="Show all" tone="quiet" onPress={() => setReviewOnly(false)} />
        </View> : null}
        {localScanning && scanProgress ? <View style={[styles.scanBanner,{backgroundColor:p.ink}]}>
          <ActivityIndicator color={p.ivory} />
          <View style={{flex:1}}>
            <Text style={{color:p.ivory,fontWeight:'800'}}>Scanning {scanProgress.currentFolder || 'library'}…</Text>
            <Text style={{color:'#c8d4d2'}}>{scanProgress.entriesVisited} checked · {scanProgress.found} books found · {scanProgress.review} need review</Text>
          </View>
        </View> : null}
        {localFolderNotice ? <Text style={[styles.meta,{color:p.gold}]}>{localFolderNotice}</Text> : null}
        <TextInput accessibilityLabel="Search your library" value={query} onChangeText={setQuery} placeholder="Search title, author or series" placeholderTextColor={p.muted} style={[styles.input, {color: p.ink, borderColor: p.line, backgroundColor: p.card}]} />
        {shelfLoading ? <ActivityIndicator accessibilityLabel="Loading library" /> : null}
        <FlatList
          key={shelfColumns}
          data={visibleBooks}
          keyExtractor={b => String(b.id)}
          numColumns={shelfColumns}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={!shelfLoading ? <Text style={[styles.empty, {color: p.muted}]}>{session ? 'No matching books. Add and scan folders in Settings.' : localFolders.length ? 'No matching local items.' : 'No books yet. Add folders to build your local library.'}</Text> : null}
          renderItem={({item}) => (
            <View style={[styles.book, {maxWidth: `${100 / shelfColumns}%`}]}><Pressable accessibilityRole="button" accessibilityLabel={item.title + ', ' + item.format} onPress={() => openBook(item)}>
              <Cover book={item} />
              <Text numberOfLines={2} style={[styles.bookTitle, {color: p.ink}]}>{item.title}</Text>
              {item.needsReview ? <View style={[styles.reviewPill,{borderColor:p.gold}]}><Text style={{color:p.gold,fontSize:11,fontWeight:'800'}}>Needs review</Text></View> : null}
              <Text style={[styles.meta, {color: p.muted}]}>{item.format} - {item.space}{item.author ? ' - '+item.author : ''}{item.series ? ' - '+item.series : ''}</Text>
            </Pressable>{item.format==='Audio' ? <Button label="Add to queue" tone="quiet" disabled={session ? (!queueReady || queueBusy) : false} onPress={()=>session ? void queueStore?.edit(old=>old.some(b=>b.id===item.id)?old:[...old,item]) : void addLocalQueue(item)} /> : null}
            {owner?<Button label="Edit details" tone="quiet" onPress={()=>{setEditing(item);setEditTitle(item.title);setEditAuthor(item.author||'');setEditSeries(item.series||'');}}/>:null}</View>
          )}
        />
        {!session && books.length ? <View style={[styles.setupPanel, {backgroundColor: p.card, borderColor: p.line}]}>
          <Text style={[styles.sectionTitle, {color: p.ink, marginTop: 0}]}>Local sorting</Text>
          <View style={styles.segment}>
            {[
              ['author-title','Author / Title'],
              ['author-series-title','Author / Series / Title'],
              ['format-author-title','Format / Author / Title'],
            ].map(([id,label])=><Pressable key={id} accessibilityRole="button" onPress={()=>setSortTemplate(id)} style={[styles.segmentItem,{borderColor:p.line,backgroundColor:sortTemplate===id?p.sage:p.card}]}><Text style={{color:sortTemplate===id?p.ivory:p.ink,textAlign:'center'}}>{label}</Text></Pressable>)}
          </View>
          <Button label="Preview visible local items" disabled={visibleBooks.length===0} tone="quiet" onPress={previewLocalSortBatch}/>
          <Button label="Copy organised files" disabled={busy || localMovePreviews.every(item => item.state !== 'ready')} onPress={() => void applyLocalSortBatch()}/>
          {moveStatus ? <Text style={[styles.meta,{color:p.gold}]}>{moveStatus}</Text> : null}
          {localMovePreviews.slice(0, 20).map(item => <View key={item.id} style={[styles.sourceRow, {borderColor: p.line}]}>
            <Text style={{color:p.ink, fontWeight:'700'}}>{item.title}</Text>
            <Text style={{color:p.muted}}>From: {item.from}</Text>
            <Text style={{color:item.state==='conflict'?p.gold:p.muted}}>To: {item.to}</Text>
            <Text style={{color:p.muted}}>{item.state}</Text>
          </View>)}
          {localMovePreviews.length > 20 ? <Text style={[styles.meta,{color:p.muted}]}>Showing first 20 of {localMovePreviews.length} proposed moves.</Text> : null}
          {localSortHistory.length ? <Text style={[styles.sectionTitle, {color:p.ink}]}>Copy history</Text> : null}
          {localSortHistory.slice(0, 3).map(item => <View key={item.id} style={[styles.sourceRow, {borderColor:p.line}]}>
            <Text style={{color:p.ink, fontWeight:'700'}}>{new Date(item.createdAt).toLocaleString()}</Text>
            <Text style={{color:p.muted}}>{item.copied.length} copied; {item.failed.length} failed</Text>
            <Button label="Remove copied files" disabled={busy || item.copied.length===0} tone="quiet" onPress={() => void recoverLocalSort(item)} />
          </View>)}
        </View> : null}
        {editing ? <View style={{gap:8}}><TextInput accessibilityLabel="Corrected title" value={editTitle} onChangeText={setEditTitle} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
          <TextInput accessibilityLabel="Author" value={editAuthor} onChangeText={setEditAuthor} placeholder="Author" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
          <TextInput accessibilityLabel="Series" value={editSeries} onChangeText={setEditSeries} placeholder="Series" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
          <Button label="Save details" disabled={busy} onPress={()=>{
          if(!session)return;setBusy(true);request(session,'/api/assets/'+editing.id+'/metadata','PATCH',{title:editTitle,author:editAuthor,series:editSeries}).then(()=>{setBooks(old=>old.map(b=>b.id===editing.id?{...b,title:editTitle.trim(),author:editAuthor.trim(),series:editSeries.trim()}:b));setEditing(null);}).catch(e=>setError(e.message)).finally(()=>setBusy(false));
        }}/><Button label="Cancel" tone="quiet" onPress={()=>setEditing(null)}/></View>:null}
        </View>
      </View>
    );
  }

  function Player() {
    const current = playing;
    return (
      <ScrollView contentContainerStyle={styles.playerScreen}>
        <Text style={[styles.title, {color: p.ink}]}>Player</Text>
        {current ? (
          <>
            <Cover book={current} large />
            <Text style={[styles.nowTitle, {color: p.ink}]}>{current.title}</Text>
            <Text style={[styles.meta, {color: p.muted}]}>{current.space}{current.author ? ' - '+current.author : ''}{current.series ? ' - '+current.series : ''}</Text>
            <View style={[styles.progressTrack, {backgroundColor: p.line}]}>
              <View style={[styles.progressFill, {backgroundColor: p.gold, width: `${displayedProgress * 100}%`}]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={[styles.meta, {color: p.muted}]}>{formatTime(session ? playback?.seconds || 0 : audio.currentTime || 0)}</Text>
              <Text style={[styles.meta, {color: p.muted}]}>{formatTime(session ? playback?.duration || 0 : audio.duration || 0)}</Text>
            </View>
            <View style={styles.transport}>
              <Button label="-15" tone="quiet" onPress={() => session ? void controller.seek((playback?.seconds || 0)-15) : void player.seekTo((audio.currentTime || 0)-15)} />
              <Pressable accessibilityRole="button" accessibilityLabel={(session ? playback?.playing : audio.playing)?'Pause':'Play'} disabled={session ? playback?.loading : false} style={[styles.playButton, {backgroundColor: p.sage}]} onPress={() => session ? controller.toggle() : audio.playing ? player.pause() : player.play()}>
                <Text style={styles.playButtonText}>{session && playback?.loading ? 'Loading' : (session ? playback?.playing : audio.playing) ? 'Pause' : 'Play'}</Text>
              </Pressable>
              <Button label="+30" tone="quiet" onPress={() => session ? void controller.seek((playback?.seconds || 0)+30) : void player.seekTo((audio.currentTime || 0)+30)} />
            </View>
            {session ? <View style={styles.toolRow}>
              <Button label={(playback?.speed || 1)+'x'} tone="quiet" onPress={() => setPlayerPanel(playerPanel==='speed'?null:'speed')} />
              <Button label={playback?.sleepAt ? 'Sleep on' : 'Sleep'} tone="quiet" onPress={() => setPlayerPanel(playerPanel==='sleep'?null:'sleep')} />
              <Button label="Tracks / Queue" tone="quiet" onPress={() => setPlayerPanel(playerPanel==='queue'?null:'queue')} />
            </View> : <Text style={[styles.meta,{color:p.muted}]}>Playing from this phone.</Text>}
            {playback?.error ? <Text accessibilityRole="alert" style={{color:p.gold}}>{playback.error}</Text> : null}
            {playerPanel==='speed' ? <View style={styles.toolRow}>{[0.75,1,1.25,1.5,1.75,2].map(rate=><Button key={rate} label={rate+'x'} tone={rate===playback?.speed?'primary':'quiet'} onPress={()=>controller.setSpeed(rate)} />)}</View> : null}
            {playerPanel==='sleep' ? <View style={styles.toolRow}>{[0,15,30,45,60].map(minutes=><Button key={minutes} label={minutes?minutes+' min':'Off'} tone="quiet" onPress={()=>controller.sleep(minutes)} />)}</View> : null}
            {playerPanel==='queue' ? <View style={{gap:8}}>
              <Text style={{color:p.ink}}>Chapters</Text>
              {chapterError?<Text style={{color:p.gold}}>{chapterError}</Text>:chapters.length===0?<Text style={{color:p.muted}}>No embedded chapters</Text>:null}
              {chapters.map((chapter,index)=><Button key={index} label={formatTime(chapter.start)+' '+chapter.title} tone="quiet" onPress={()=>void controller.seek(chapter.start)} />)}
              <Text style={{color:p.ink}}>Tracks</Text>
              {playback?.tracks.map((track,index)=><Button key={track.id} label={(index+1)+'. '+track.title} disabled={!track.available || playback.loading} tone={index===playback.index?'primary':'quiet'} onPress={()=>void controller.select(index)} />)}
              <Text style={{color:p.ink}}>Queued books</Text>
              {session ? <Button label="Reload queue" disabled={queueBusy} tone="quiet" onPress={()=>void queueStore?.reload()}/> : null}
              {queuedBooks.map((book,index)=><View key={book.id} style={{gap:8}}><Button label={book.title} disabled={queueBusy || !book.available} onPress={()=>{void playBook(book).then(()=>{if(controller.state.playing)void queueStore?.edit(items=>items.filter(b=>b.id!==book.id));});}} />
                <View style={styles.toolRow}>
                  <Button label="Move up" disabled={queueBusy || index===0} tone="quiet" onPress={()=>session ? void queueStore?.edit(items=>reorder(items,items.findIndex(b=>b.id===book.id),-1)) : void updateLocalQueue(reorder(queuedBooks, queuedBooks.findIndex(b=>b.uri===book.uri), -1))}/>
                  <Button label="Move down" disabled={queueBusy || index===queuedBooks.length-1} tone="quiet" onPress={()=>session ? void queueStore?.edit(items=>reorder(items,items.findIndex(b=>b.id===book.id),1)) : void updateLocalQueue(reorder(queuedBooks, queuedBooks.findIndex(b=>b.uri===book.uri), 1))}/>
                  <Button label="Remove" disabled={queueBusy} tone="quiet" onPress={()=>session ? void queueStore?.edit(items=>items.filter(b=>b.id!==book.id)) : void updateLocalQueue(queuedBooks.filter(b=>b.uri!==book.uri))}/>
                </View></View>)}
            </View> : null}
          </>
        ) : (
          <Text style={[styles.empty, {color: p.muted}]}>Choose an audiobook from Shelf to start playback.</Text>
        )}
      </ScrollView>
    );
  }

  function Reader() {
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
          <View style={[styles.readerBar, {borderBottomColor: p.line, backgroundColor: p.paper}]}>
            <Pressable accessibilityRole="button" onPress={() => {setReading(null);setLocalReader(null);setActiveTab('shelf');}} style={styles.readerBack}>
              <Text style={[styles.readerAction, {color: p.sage}]}>Shelf</Text>
            </Pressable>
            <Text numberOfLines={1} style={[styles.readerTitle, {color: p.ink}]}>{reading.title}</Text>
          </View>
          {readerLoading ? <ActivityIndicator accessibilityLabel="Opening local reader" /> : localReader?.html ? (
            <WebView originWhitelist={['*']} source={{html: localReader.html}} />
          ) : localReader?.uri ? (
            <WebView originWhitelist={['content://*', 'file://*']} source={{uri: localReader.uri}} allowFileAccess />
          ) : <Text style={[styles.empty, {color: p.muted, padding: 16}]}>Unable to open this file.</Text>}
        </View>
      );
    }
    return (
      <View style={styles.readerScreen}>
        <View style={[styles.readerBar, {borderBottomColor: p.line, backgroundColor: p.paper}]}>
          <Pressable accessibilityRole="button" onPress={() => {setReading(null);setActiveTab('shelf');}} style={styles.readerBack}>
            <Text style={[styles.readerAction, {color: p.sage}]}>Shelf</Text>
          </Pressable>
          <Text numberOfLines={1} style={[styles.readerTitle, {color: p.ink}]}>{reading.title}</Text>
        </View>
        <WebView
          key={session.token + reading.id}
          source={{uri: session.server + '/reader.html?asset=' + reading.id, headers: {Authorization: 'Bearer ' + session.token}}}
          incognito
          originWhitelist={[session.server]}
          onShouldStartLoadWithRequest={r => readerNavigationAllowed(r.url, session.server)}
          mixedContentMode="never"
          onHttpError={e => setError('Reader request failed: '+e.nativeEvent.statusCode)}
          onError={e => setError(e.nativeEvent.description)}
          allowFileAccess={false}
          javaScriptCanOpenWindowsAutomatically={false}
          setSupportMultipleWindows={false}
        />
      </View>
    );
  }

  function atlasSelect(kind: 'format' | 'author' | 'series' | 'space' | 'status', value: string) {
    if (kind === 'space') {
      setSpace(value);
      setQuery('');
    } else if (kind === 'status') {
      setQuery(value === 'Unavailable' ? 'Unavailable' : '');
    } else {
      setQuery(value === 'Unknown author' ? '' : value);
    }
    setActiveTab('shelf');
  }

  function AtlasGroup({title, items, kind}: {title: string; items: Array<[string, number]>; kind: 'format' | 'author' | 'series' | 'space' | 'status'}) {
    const max = Math.max(1, ...items.map(([, total]) => total));
    return (
      <View style={[styles.atlasGroup, {borderColor: p.line, backgroundColor: p.card}]}>
        <Text style={[styles.sectionTitle, {color: p.ink, marginTop: 0}]}>{title}</Text>
        {items.length ? items.map(([name, total]) => (
          <Pressable key={title + name} accessibilityRole="button" onPress={() => atlasSelect(kind, name)} style={styles.atlasRow}>
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

  function Atlas() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, {color: p.ink}]}>Atlas</Text>
        <Text style={[styles.empty, {color: p.muted}]}>Tap any row to focus the Shelf. Genre is currently represented by media format until richer metadata is available.</Text>
        <AtlasGroup title="Genres" kind="format" items={atlas.formats} />
        <AtlasGroup title="Authors" kind="author" items={atlas.authors} />
        <AtlasGroup title="Series" kind="series" items={atlas.series} />
        <AtlasGroup title="Folders" kind="space" items={atlas.spaces} />
        <AtlasGroup title="Reading State" kind="status" items={atlas.status} />
      </ScrollView>
    );
  }

  function Settings() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, {color: p.ink}]}>Settings</Text>
        <Text style={[styles.sectionTitle, {color: p.ink}]}>Appearance</Text>
        <View style={styles.segment}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map(mode => (
            <Pressable key={mode} accessibilityRole="button" onPress={() => void chooseTheme(mode)} style={[styles.segmentItem, {borderColor: p.line, backgroundColor: theme === mode ? p.sage : p.card}]}>
              <Text style={{color: theme === mode ? p.ivory : p.ink}}>{mode[0].toUpperCase() + mode.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.sectionTitle, {color: p.ink}]}>Server</Text>
        {session ? <Text style={[styles.meta, {color: p.muted}]}>{session.server}</Text> : <Text style={[styles.meta, {color: p.muted}]}>No server connected. Your phone library works locally.</Text>}
        {!session ? (serverPanelOpen ? <ServerConnect /> : <Button label="Add server" tone="quiet" onPress={() => setServerPanelOpen(true)} />) : null}
        {owner ? <View style={{gap:10}}>
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
            ].map(([id,label])=><Pressable key={id} accessibilityRole="button" onPress={()=>setSortTemplate(id)} style={[styles.segmentItem,{borderColor:p.line,backgroundColor:sortTemplate===id?p.sage:p.card}]}><Text style={{color:sortTemplate===id?p.ivory:p.ink,textAlign:'center'}}>{label}</Text></Pressable>)}
          </View>
          <Button label="Preview visible shelf" disabled={busy || visibleBooks.length===0} tone="quiet" onPress={()=>void previewSort(visibleBooks.map(b=>b.id))}/>
          <Button label="Preview all library items" disabled={busy} tone="quiet" onPress={()=>void previewSort([])}/>
          <Button label="Apply pending safe moves" disabled={busy} onPress={()=>void applySortBatch()}/>
          {moveStatus?<Text style={[styles.meta,{color:p.gold}]}>{moveStatus}</Text>:null}
        </View>:null}
        {session ? <Button label="Sign out" tone="gold" onPress={() => void signOut()} /> : null}
      </ScrollView>
    );
  }

  function CurrentTab() {
    if (activeTab === 'shelf') return Shelf();
    if (activeTab === 'player') return Player();
    if (activeTab === 'reader') return Reader();
    if (activeTab === 'atlas') return Atlas();
    return Settings();
  }

  if (restoring) {
    return (
      <SafeAreaView style={[styles.screen, {backgroundColor: p.paper}]}>
        <ActivityIndicator accessibilityLabel="Restoring session" />
      </SafeAreaView>
    );
  }

  const tabs: Array<{id: Tab; label: string}> = [
    {id: 'shelf', label: 'Shelf'},
    {id: 'player', label: 'Player'},
    {id: 'reader', label: 'Reader'},
    {id: 'atlas', label: 'Atlas'},
    {id: 'settings', label: 'Settings'},
  ];

  return (
    <SafeAreaView style={[styles.screen, {backgroundColor: p.paper}]}>
      <View style={[styles.appHeader, {borderBottomColor: p.line}]}>
        <Text style={[styles.logoSmall, {color: p.ink}]}>Archivist</Text>
        <Text style={[styles.headerMeta, {color: p.muted}]}>{session ? `${books.length} items` : `${books.length} local items`}</Text>
      </View>
      {error ? <Text accessibilityRole="alert" style={[styles.error, {color: p.gold}]}>{error}</Text> : null}
      <View style={styles.tabBody}>
        {CurrentTab()}
      </View>
      <CelebrationOverlay active={celebrating} />
      {playing ? (
        <Pressable accessibilityRole="button" onPress={() => setActiveTab('player')} style={[styles.miniPlayer, {backgroundColor: p.ink}]}>
          <View style={[styles.miniCover, {backgroundColor: p.gold}]}><Text style={{color: '#0f2a36', fontWeight: '700'}}>{coverInitials(playing.title)}</Text></View>
          <View style={{flex: 1}}>
            <Text numberOfLines={1} style={[styles.miniTitle, {color: p.ivory}]}>{playing.title}</Text>
            <Text style={[styles.miniMeta, {color: '#c8d4d2'}]}>{formatTime(audio.currentTime)} - {audio.playing ? 'Playing' : 'Paused'}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => controller.toggle()} style={styles.miniButton}>
            <Text style={styles.miniButtonText}>{playback?.playing ? 'Pause' : 'Play'}</Text>
          </Pressable>
        </Pressable>
      ) : null}
      <View style={[styles.tabBar, {backgroundColor: p.card, borderTopColor: p.line}]}>
        {tabs.map(tab => (
          <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{selected: activeTab === tab.id}} onPress={() => setActiveTab(tab.id)} style={styles.tab}>
            <Text style={[styles.tabText, {color: activeTab === tab.id ? p.sage : p.muted}]}>{tab.label}</Text>
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
  appHeader: {height: 58, paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headerMeta: {fontSize: 13},
  content: {padding: 16, gap: 14},
  setupPanel: {borderWidth: 1, borderRadius: 8, padding: 14, gap: 12},
  shelfShell: {flex: 1, flexDirection: 'row'},
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
  scanBanner: {borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12},
  onboardingCard: {borderWidth: 1, borderRadius: 16, padding: 16, gap: 14},
  onboardingEyebrow: {fontSize: 11, fontWeight: '900', letterSpacing: 2},
  onboardingStep: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  onboardingNumber: {width: 28, height: 28, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', color: '#f8f7f2', fontWeight: '900', overflow: 'hidden'},
  onboardingStepTitle: {fontSize: 15, fontWeight: '800', marginBottom: 2},
  sourceRow: {borderWidth: 1, borderRadius: 8, padding: 12, gap: 4},
  tabBody: {flex: 1},
  title: {fontFamily: 'serif', fontSize: 34, marginBottom: 2},
  sectionTitle: {fontSize: 17, fontWeight: '700', marginTop: 10},
  input: {padding: 14, borderWidth: 1, borderRadius: 8, fontSize: 16},
  button: {backgroundColor: '#397076', borderRadius: 8, paddingHorizontal: 14, minHeight: 46, justifyContent: 'center', alignItems: 'center'},
  buttonGold: {backgroundColor: '#c6a374'},
  buttonQuiet: {backgroundColor: 'transparent', borderWidth: 1, borderColor: '#397076'},
  buttonText: {color: '#f8f7f2', fontSize: 15, fontWeight: '700'},
  buttonQuietText: {color: '#397076'},
  error: {paddingHorizontal: 16, paddingVertical: 8},
  grid: {paddingBottom: 110},
  empty: {fontSize: 15, lineHeight: 22},
  book: {flex: 1, maxWidth: '50%', padding: 8, gap: 7},
  cover: {aspectRatio: 2 / 3, borderRadius: 8, justifyContent: 'space-between', padding: 12, overflow: 'hidden'},
  coverSquare: {aspectRatio: 1},
  coverLarge: {width: 230, alignSelf: 'center'},
  coverLargeSquare: {width: 230, height: 230},
  coverMark: {fontFamily: 'serif', fontSize: 38, fontWeight: '700'},
  coverTitle: {fontFamily: 'serif', fontSize: 20},
  bookTitle: {fontSize: 15, fontWeight: '700'},
  reviewPill: {alignSelf:'flex-start', borderWidth:1, borderRadius:999, paddingHorizontal:8, paddingVertical:3},
  meta: {fontSize: 13, lineHeight: 19},
  playerScreen: {padding: 18, gap: 14, paddingBottom: 120},
  nowTitle: {fontFamily: 'serif', fontSize: 28, textAlign: 'center', marginTop: 4},
  progressTrack: {height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 8},
  progressFill: {height: 6, borderRadius: 999},
  timeRow: {flexDirection: 'row', justifyContent: 'space-between'},
  transport: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14},
  playButton: {width: 104, height: 58, borderRadius: 999, alignItems: 'center', justifyContent: 'center'},
  playButtonText: {color: '#f8f7f2', fontSize: 17, fontWeight: '800'},
  toolRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between'},
  readerScreen: {flex: 1},
  readerBar: {height: 50, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center'},
  readerBack: {width: 72, alignItems: 'center', justifyContent: 'center'},
  readerAction: {fontWeight: '700'},
  readerTitle: {flex: 1, textAlign: 'center', fontWeight: '700'},
  atlasGroup: {borderWidth: 1, borderRadius: 8, padding: 12, gap: 10},
  atlasRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36},
  atlasText: {fontWeight: '700'},
  atlasBarTrack: {flex: 1, height: 8, borderRadius: 999, overflow: 'hidden'},
  atlasBarFill: {height: 8, borderRadius: 999},
  segment: {flexDirection: 'row', gap: 8},
  segmentItem: {flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center'},
  miniPlayer: {minHeight: 66, marginHorizontal: 12, marginBottom: 8, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10},
  miniCover: {width: 42, height: 42, borderRadius: 5, alignItems: 'center', justifyContent: 'center'},
  miniTitle: {fontWeight: '800'},
  miniMeta: {fontSize: 12},
  miniButton: {paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#f8f7f2'},
  miniButtonText: {color: '#f8f7f2', fontWeight: '700'},
  tabBar: {height: 62, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row'},
  tab: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  tabText: {fontSize: 12, fontWeight: '800'},
  celebration: {position:'absolute', left:0, right:0, top:0, bottom:0, alignItems:'center', justifyContent:'center', zIndex:50},
  celebrationParticle: {position:'absolute', fontSize:28, color:'#c6a374', fontWeight:'900'},
  celebrationBadge: {backgroundColor:'#0f2a36', borderRadius:18, paddingHorizontal:20, paddingVertical:16, alignItems:'center', shadowColor:'#000', shadowOpacity:0.22, shadowRadius:14, elevation:10},
  celebrationTitle: {color:'#f8f7f2', fontSize:20, fontWeight:'900'},
  celebrationCopy: {color:'#c8d4d2', fontSize:13, marginTop:3},
});
