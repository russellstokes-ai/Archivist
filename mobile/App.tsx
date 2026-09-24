import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
  ActivityIndicator,
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
import {request, validateServer as checkServer, readerNavigationAllowed, Session} from './connection';
import {Playback, PlaybackState, Chapter} from './playback';
import {SavedQueue, reorder} from './queue';

type Book = {id: number; title: string; author: string; series: string; format: string; space: string; available: boolean};
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

function Client() {
  const systemScheme = useColorScheme();
  const {width} = useWindowDimensions();
  const [theme, setTheme] = useState<ThemeMode>('system');
  const p = useMemo(() => palette(theme, systemScheme), [theme, systemScheme]);
  const [session, setSession] = useState<Session | null>(null);
  const [server, setServer] = useState('');
  const [key, setKey] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [reading, setReading] = useState<Book | null>(null);
  const [playing, setPlaying] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shelf');
  const player = useAudioPlayer(null);
  const audio = useAudioPlayerStatus(player);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playerPanel, setPlayerPanel] = useState<'speed'|'sleep'|'queue'|null>(null);
  const [queuedBooks, setQueuedBooks] = useState<Book[]>([]);
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
    try {
      const origin = validateServer(server);
      const data = await request({server: origin, token: ''}, '/session', 'POST', {token: key});
      if (typeof data.token !== 'string' || !data.token) throw Error('Invalid server session response');
      const next = {server: origin, token: String(data.token)};
      await request(next, '/api/me');
      await SecureStore.setItemAsync(storageKey, JSON.stringify(next));
      setKey('');
      setSession(next);
      setActiveTab('shelf');
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
    setQueuedBooks([]); setSpace('');
  }

  async function playBook(book: Book) {
    if (!session) return;
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

  function openBook(book: Book) {
    if (!book.available) {
      setError('This file is currently unavailable.');
      return;
    }
    setError('');
    if (book.format === 'Audio') playBook(book);
    else {
      setReading(book);
      setActiveTab('reader');
    }
  }

  function Cover({book, large = false}: {book: Book; large?: boolean}) {
    return (
      <View style={[styles.cover, large && styles.coverLarge, {backgroundColor: p.ink}]}>
        <Text style={[styles.coverMark, {color: p.gold}]}>{coverInitials(book.title)}</Text>
        <Text numberOfLines={large ? 4 : 3} style={[styles.coverTitle, {color: p.ivory}]}>{book.title}</Text>
      </View>
    );
  }

  function Login() {
    return (
      <SafeAreaView style={[styles.screen, {backgroundColor: p.paper}]}>
        <ScrollView contentContainerStyle={styles.login}>
          <Text style={[styles.logo, {color: p.ink}]}>Archivist</Text>
          <Text style={[styles.tagline, {color: p.gold}]}>YOUR LIBRARY. YOURS.</Text>
          <Text style={[styles.loginCopy, {color: p.muted}]}>Connect to your own server. Privacy stays the default, not an upgrade.</Text>
          <TextInput accessibilityLabel="Server address" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={server} onChangeText={setServer} placeholder="https://books.example.com" placeholderTextColor={p.muted} style={[styles.input, {color: p.ink, borderColor: p.line, backgroundColor: p.card}]} />
          <TextInput accessibilityLabel="Profile access key" secureTextEntry autoCapitalize="none" autoCorrect={false} value={key} onChangeText={setKey} placeholder="Profile access key" placeholderTextColor={p.muted} style={[styles.input, {color: p.ink, borderColor: p.line, backgroundColor: p.card}]} />
          <Button label={busy ? 'Connecting...' : 'Connect'} onPress={() => void signIn()} disabled={busy} />
          {error ? <Text accessibilityRole="alert" style={[styles.error, {color: p.gold}]}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  function Shelf() {
    return (
      <View style={[styles.content, {flex: 1}]}>
        <Text style={[styles.title, {color: p.ink}]}>Shelf</Text>
        <TextInput accessibilityLabel="Search your library" value={query} onChangeText={setQuery} placeholder="Search titles" placeholderTextColor={p.muted} style={[styles.input, {color: p.ink, borderColor: p.line, backgroundColor: p.card}]} />
        <ScrollView horizontal style={{flexGrow: 0}} contentContainerStyle={{gap: 8}}>
          {['', ...spaces].map(name => <Button key={name} label={name || 'All spaces'} tone={space===name?'primary':'quiet'} onPress={()=>setSpace(name)} />)}
        </ScrollView>
        {shelfLoading ? <ActivityIndicator accessibilityLabel="Loading library" /> : null}
        <FlatList
          key={shelfColumns}
          data={books}
          keyExtractor={b => String(b.id)}
          numColumns={shelfColumns}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={!shelfLoading ? <Text style={[styles.empty, {color: p.muted}]}>No matching books. Add and scan folders in server settings.</Text> : null}
          renderItem={({item}) => (
            <View style={[styles.book, {maxWidth: `${100 / shelfColumns}%`}]}><Pressable accessibilityRole="button" accessibilityLabel={item.title + ', ' + item.format} onPress={() => openBook(item)}>
              <Cover book={item} />
              <Text numberOfLines={2} style={[styles.bookTitle, {color: p.ink}]}>{item.title}</Text>
              <Text style={[styles.meta, {color: p.muted}]}>{item.format} - {item.space}{item.author ? ' - '+item.author : ''}{item.series ? ' - '+item.series : ''}</Text>
            </Pressable>{item.format==='Audio' ? <Button label="Add to queue" tone="quiet" disabled={!queueReady || queueBusy} onPress={()=>void queueStore?.edit(old=>old.some(b=>b.id===item.id)?old:[...old,item])} /> : null}
            {owner?<Button label="Edit details" tone="quiet" onPress={()=>{setEditing(item);setEditTitle(item.title);setEditAuthor(item.author||'');setEditSeries(item.series||'');}}/>:null}</View>
          )}
        />
        {editing ? <View style={{gap:8}}><TextInput accessibilityLabel="Corrected title" value={editTitle} onChangeText={setEditTitle} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
          <TextInput accessibilityLabel="Author" value={editAuthor} onChangeText={setEditAuthor} placeholder="Author" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
          <TextInput accessibilityLabel="Series" value={editSeries} onChangeText={setEditSeries} placeholder="Series" placeholderTextColor={p.muted} style={[styles.input,{color:p.ink,borderColor:p.line}]} />
          <Button label="Save details" disabled={busy} onPress={()=>{
          if(!session)return;setBusy(true);request(session,'/api/assets/'+editing.id+'/metadata','PATCH',{title:editTitle,author:editAuthor,series:editSeries}).then(()=>{setBooks(old=>old.map(b=>b.id===editing.id?{...b,title:editTitle.trim(),author:editAuthor.trim(),series:editSeries.trim()}:b));setEditing(null);}).catch(e=>setError(e.message)).finally(()=>setBusy(false));
        }}/><Button label="Cancel" tone="quiet" onPress={()=>setEditing(null)}/></View>:null}
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
              <View style={[styles.progressFill, {backgroundColor: p.gold, width: `${audioProgress * 100}%`}]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={[styles.meta, {color: p.muted}]}>{formatTime(playback?.seconds || 0)}</Text>
              <Text style={[styles.meta, {color: p.muted}]}>{formatTime(playback?.duration || 0)}</Text>
            </View>
            <View style={styles.transport}>
              <Button label="-15" tone="quiet" onPress={() => void controller.seek((playback?.seconds || 0)-15)} />
              <Pressable accessibilityRole="button" accessibilityLabel={playback?.playing?'Pause':'Play'} disabled={playback?.loading} style={[styles.playButton, {backgroundColor: p.sage}]} onPress={() => controller.toggle()}>
                <Text style={styles.playButtonText}>{playback?.loading ? 'Loading' : playback?.playing ? 'Pause' : 'Play'}</Text>
              </Pressable>
              <Button label="+30" tone="quiet" onPress={() => void controller.seek((playback?.seconds || 0)+30)} />
            </View>
            <View style={styles.toolRow}>
              <Button label={(playback?.speed || 1)+'x'} tone="quiet" onPress={() => setPlayerPanel(playerPanel==='speed'?null:'speed')} />
              <Button label={playback?.sleepAt ? 'Sleep on' : 'Sleep'} tone="quiet" onPress={() => setPlayerPanel(playerPanel==='sleep'?null:'sleep')} />
              <Button label="Tracks / Queue" tone="quiet" onPress={() => setPlayerPanel(playerPanel==='queue'?null:'queue')} />
            </View>
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
              <Button label="Reload queue" disabled={queueBusy} tone="quiet" onPress={()=>void queueStore?.reload()}/>
              {queuedBooks.map((book,index)=><View key={book.id} style={{gap:8}}><Button label={book.title} disabled={queueBusy || !book.available} onPress={()=>{void playBook(book).then(()=>{if(controller.state.playing)void queueStore?.edit(items=>items.filter(b=>b.id!==book.id));});}} />
                <View style={styles.toolRow}>
                  <Button label="Move up" disabled={queueBusy || index===0} tone="quiet" onPress={()=>void queueStore?.edit(items=>reorder(items,items.findIndex(b=>b.id===book.id),-1))}/>
                  <Button label="Move down" disabled={queueBusy || index===queuedBooks.length-1} tone="quiet" onPress={()=>void queueStore?.edit(items=>reorder(items,items.findIndex(b=>b.id===book.id),1))}/>
                  <Button label="Remove" disabled={queueBusy} tone="quiet" onPress={()=>void queueStore?.edit(items=>items.filter(b=>b.id!==book.id))}/>
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
    if (!session || !reading) {
      return (
        <View style={styles.content}>
          <Text style={[styles.title, {color: p.ink}]}>Reader</Text>
          <Text style={[styles.empty, {color: p.muted}]}>Open an EPUB, PDF or comic from Shelf.</Text>
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

  function Atlas() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, {color: p.ink}]}>Atlas</Text>
        <View style={[styles.atlasPanel, {backgroundColor: p.card, borderColor: p.line}]}>
          {['Authors', 'Series', 'Works', 'Editions', 'Profiles'].map((label, index) => (
            <View key={label} style={[styles.atlasNode, {left: 22 + (index % 2) * 155, top: 28 + index * 54, borderColor: p.sage, backgroundColor: p.raised}]}>
              <Text style={[styles.atlasText, {color: p.ink}]}>{label}</Text>
            </View>
          ))}
          <View style={[styles.atlasLine, {backgroundColor: p.line, top: 82, left: 112, width: 136, transform: [{rotate: '19deg'}]}]} />
          <View style={[styles.atlasLine, {backgroundColor: p.line, top: 178, left: 112, width: 146, transform: [{rotate: '-16deg'}]}]} />
        </View>
        <Text style={[styles.empty, {color: p.muted}]}>This is the product slot for the Obsidian-quality media universe. The graph engine, filters and layout physics are still release work.</Text>
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
        <Text style={[styles.meta, {color: p.muted}]}>{session?.server}</Text>
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
          <Button label="Preview visible shelf" disabled={busy || books.length===0} tone="quiet" onPress={()=>void previewSort(books.map(b=>b.id))}/>
          <Button label="Preview all library items" disabled={busy} tone="quiet" onPress={()=>void previewSort([])}/>
          <Button label="Apply pending safe moves" disabled={busy} onPress={()=>void applySortBatch()}/>
          {moveStatus?<Text style={[styles.meta,{color:p.gold}]}>{moveStatus}</Text>:null}
        </View>:null}
        <Button label="Sign out" tone="gold" onPress={() => void signOut()} />
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

  if (!session) return Login();

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
        <Text style={[styles.headerMeta, {color: p.muted}]}>{books.length} items</Text>
      </View>
      {error ? <Text accessibilityRole="alert" style={[styles.error, {color: p.gold}]}>{error}</Text> : null}
      <View style={styles.tabBody}>
        {CurrentTab()}
      </View>
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
  cover: {aspectRatio: 2 / 3, borderRadius: 6, justifyContent: 'space-between', padding: 12},
  coverLarge: {width: 230, alignSelf: 'center'},
  coverMark: {fontFamily: 'serif', fontSize: 38, fontWeight: '700'},
  coverTitle: {fontFamily: 'serif', fontSize: 20},
  bookTitle: {fontSize: 15, fontWeight: '700'},
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
  atlasPanel: {height: 360, borderWidth: 1, borderRadius: 8, overflow: 'hidden'},
  atlasNode: {position: 'absolute', width: 132, minHeight: 44, borderWidth: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center'},
  atlasText: {fontWeight: '700'},
  atlasLine: {position: 'absolute', height: 2},
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
});
