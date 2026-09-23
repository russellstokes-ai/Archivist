import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import {setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';
import {WebView} from 'react-native-webview';

type Session = {server: string; token: string};
type Book = {id: number; title: string; format: string; space: string; available: boolean};
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
  const u = new URL(raw.trim());
  const dev = __DEV__ && ['localhost', '127.0.0.1', '10.0.2.2'].includes(u.hostname);
  if (u.protocol !== 'https:' && !(dev && u.protocol === 'http:')) throw Error('Use your HTTPS server address.');
  if (u.username || u.password || u.search || u.hash || u.pathname !== '/') throw Error('Enter the server origin without a path or credentials.');
  return u.origin;
}

async function request(session: Session, path: string, method = 'GET', data?: unknown) {
  const response = await fetch(session.server + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + session.token,
      'Content-Type': 'application/json',
      'X-Archivist-Action': '1',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || 'Server request failed');
  return result;
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
  const audioProgress = audio.duration ? Math.min(1, audio.currentTime / audio.duration) : 0;

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
    const timeout = setTimeout(() => {
      request(session, '/api/books?q=' + encodeURIComponent(query))
        .then(data => {
          if (!cancelled) setBooks(data);
        })
        .catch(e => {
          if (!cancelled) setError(e.message);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [session, query]);

  async function chooseTheme(next: ThemeMode) {
    setTheme(next);
    await SecureStore.setItemAsync(themeKey, next);
  }

  async function signIn() {
    setBusy(true);
    setError('');
    try {
      const origin = validateServer(server);
      const res = await fetch(origin + '/session', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Archivist-Action': '1'},
        body: JSON.stringify({token: key}),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || 'Sign-in failed');
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
    player.pause();
    player.setActiveForLockScreen(false);
    setReading(null);
    setPlaying(null);
    try {
      await fetch(session.server + '/logout', {method: 'POST', headers: {Authorization: 'Bearer ' + session.token, 'X-Archivist-Action': '1'}});
    } catch {
      setError('Local sign-out complete. Server session revocation could not be confirmed.');
    }
    await SecureStore.deleteItemAsync(storageKey);
    setSession(null);
    setBooks([]);
  }

  function playBook(book: Book) {
    if (!session) return;
    if (!book.available) {
      setError('This file is currently unavailable.');
      return;
    }
    setError('');
    try {
      player.replace({uri: session.server + '/api/assets/' + book.id, headers: {Authorization: 'Bearer ' + session.token}});
      player.setActiveForLockScreen(true, {title: book.title, albumTitle: book.space});
      player.play();
      setPlaying(book);
      setActiveTab('player');
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
      <View style={styles.content}>
        <Text style={[styles.title, {color: p.ink}]}>Shelf</Text>
        <TextInput accessibilityLabel="Search your library" value={query} onChangeText={setQuery} placeholder="Search titles" placeholderTextColor={p.muted} style={[styles.input, {color: p.ink, borderColor: p.line, backgroundColor: p.card}]} />
        <FlatList
          data={books}
          keyExtractor={b => String(b.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={<Text style={[styles.empty, {color: p.muted}]}>No matching books. Add and scan folders in server settings.</Text>}
          renderItem={({item}) => (
            <Pressable accessibilityRole="button" accessibilityLabel={item.title + ', ' + item.format} onPress={() => openBook(item)} style={styles.book}>
              <Cover book={item} />
              <Text numberOfLines={2} style={[styles.bookTitle, {color: p.ink}]}>{item.title}</Text>
              <Text style={[styles.meta, {color: p.muted}]}>{item.format} - {item.space}</Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  function Player() {
    const current = playing ?? books.find(book => book.format === 'Audio') ?? null;
    return (
      <ScrollView contentContainerStyle={styles.playerScreen}>
        <Text style={[styles.title, {color: p.ink}]}>Player</Text>
        {current ? (
          <>
            <Cover book={current} large />
            <Text style={[styles.nowTitle, {color: p.ink}]}>{current.title}</Text>
            <Text style={[styles.meta, {color: p.muted}]}>{current.space}</Text>
            <View style={[styles.progressTrack, {backgroundColor: p.line}]}>
              <View style={[styles.progressFill, {backgroundColor: p.gold, width: `${audioProgress * 100}%`}]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={[styles.meta, {color: p.muted}]}>{formatTime(audio.currentTime)}</Text>
              <Text style={[styles.meta, {color: p.muted}]}>{formatTime(audio.duration)}</Text>
            </View>
            <View style={styles.transport}>
              <Button label="-15" tone="quiet" onPress={() => void player.seekTo(Math.max(0, audio.currentTime - 15))} />
              <Pressable accessibilityRole="button" style={[styles.playButton, {backgroundColor: p.sage}]} onPress={() => audio.playing ? player.pause() : player.play()}>
                <Text style={styles.playButtonText}>{audio.playing ? 'Pause' : 'Play'}</Text>
              </Pressable>
              <Button label="+30" tone="quiet" onPress={() => void player.seekTo(Math.min(audio.duration || audio.currentTime + 30, audio.currentTime + 30))} />
            </View>
            <View style={styles.toolRow}>
              <Button label="1.0x" tone="quiet" onPress={() => setError('Speed control is reserved for the release player.')} />
              <Button label="Sleep" tone="quiet" onPress={() => setError('Sleep timer is reserved for the release player.')} />
              <Button label="Queue" tone="quiet" onPress={() => setError('Chapters and queue are reserved for the release player.')} />
            </View>
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
          <Text style={[styles.empty, {color: p.muted}]}>Open an EPUB, PDF or comic from Shelf. Font, theme and page controls are staged here for the final reader.</Text>
        </View>
      );
    }
    return (
      <View style={styles.readerScreen}>
        <View style={[styles.readerBar, {borderBottomColor: p.line, backgroundColor: p.paper}]}>
          <Pressable accessibilityRole="button" onPress={() => setReading(null)} style={styles.readerBack}>
            <Text style={[styles.readerAction, {color: p.sage}]}>Shelf</Text>
          </Pressable>
          <Text numberOfLines={1} style={[styles.readerTitle, {color: p.ink}]}>{reading.title}</Text>
          <Pressable accessibilityRole="button" onPress={() => setError('Reader controls are staged for the full reader.')} style={styles.readerBack}>
            <Text style={[styles.readerAction, {color: p.sage}]}>Aa</Text>
          </Pressable>
        </View>
        <WebView
          key={session.token + reading.id}
          source={{uri: session.server + '/reader.html?asset=' + reading.id, headers: {Authorization: 'Bearer ' + session.token}}}
          incognito
          originWhitelist={[session.server]}
          onShouldStartLoadWithRequest={r => {
            try {
              return new URL(r.url).origin === session.server;
            } catch {
              return false;
            }
          }}
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
        <Button label="Sign out" tone="gold" onPress={() => void signOut()} />
      </ScrollView>
    );
  }

  function CurrentTab() {
    if (activeTab === 'shelf') return <Shelf />;
    if (activeTab === 'player') return <Player />;
    if (activeTab === 'reader') return <Reader />;
    if (activeTab === 'atlas') return <Atlas />;
    return <Settings />;
  }

  if (restoring) {
    return (
      <SafeAreaView style={[styles.screen, {backgroundColor: p.paper}]}>
        <ActivityIndicator accessibilityLabel="Restoring session" />
      </SafeAreaView>
    );
  }

  if (!session) return <Login />;

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
        <CurrentTab />
      </View>
      {playing ? (
        <Pressable accessibilityRole="button" onPress={() => setActiveTab('player')} style={[styles.miniPlayer, {backgroundColor: p.ink}]}>
          <View style={[styles.miniCover, {backgroundColor: p.gold}]}><Text style={{color: '#0f2a36', fontWeight: '700'}}>{coverInitials(playing.title)}</Text></View>
          <View style={{flex: 1}}>
            <Text numberOfLines={1} style={[styles.miniTitle, {color: p.ivory}]}>{playing.title}</Text>
            <Text style={[styles.miniMeta, {color: '#c8d4d2'}]}>{formatTime(audio.currentTime)} - {audio.playing ? 'Playing' : 'Paused'}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => audio.playing ? player.pause() : player.play()} style={styles.miniButton}>
            <Text style={styles.miniButtonText}>{audio.playing ? 'Pause' : 'Play'}</Text>
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
  toolRow: {flexDirection: 'row', gap: 8, justifyContent: 'space-between'},
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
