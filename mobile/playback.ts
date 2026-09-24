import {RequestError} from './connection';
export type Track = {id: number; title: string; available: boolean};
export type Position = {asset: number; seconds: number; revision: number; complete: boolean};
export type Chapter = {title: string; start: number; end: number};
export type PlaybackState = {tracks: Track[]; index: number; seconds: number; duration: number; playing: boolean; loading: boolean; speed: number; sleepAt: number | null; error: string; completed: boolean};
type API = (path: string, method?: string, data?: unknown) => Promise<any>;
export type AudioPort = {
  load(track: Track, seconds: number): Promise<void>;
  play(): void; pause(): void; seek(seconds: number): Promise<void>; speed(rate: number): void;
  sleep?(seconds: number): void;
};

export class Playback {
  state: PlaybackState = {tracks: [], index: 0, seconds: 0, duration: 0, playing: false, loading: false, speed: 1, sleepAt: null, error: '', completed: false};
  private progressURL = '';
  private revision = 0;
  private complete = false;
  private blocked = false;
  private saves: Promise<void> = Promise.resolve();
  private generation = 0;
  private advancing = false;
  private lastSave = 0;
  private sleepExpired = false;
  constructor(private api: API, private audio: AudioPort, private changed: (state: PlaybackState) => void) {}
  private emit() { this.changed({...this.state}); }
  private fail(e: unknown) { this.state.error = e instanceof Error ? e.message : String(e); this.emit(); }
  async open(asset: number) {
    const generation = ++this.generation;
    if(this.state.sleepAt===null)this.sleepExpired=false;
    this.audio.pause();
    await this.save();
    if (generation !== this.generation) return;
    this.state.tracks=[];this.progressURL='';
    this.state.loading = true; this.state.playing = false; this.state.error = ''; this.state.completed=false; this.emit();
    try {
      const context = await this.api('/api/assets/' + asset + '/listening');
      if (!/^\/api\/(assets|editions)\/\d+\/(listening-progress|progress)$/.test(context.progressURL)) throw Error('Invalid playback context');
      const point: Position = await this.api(context.progressURL);
      if (generation !== this.generation) return;
      if (!Array.isArray(context.tracks) || !context.tracks.length) throw Error('No audio tracks');
      this.state.tracks = context.tracks;
      this.progressURL = context.progressURL; this.revision = point.revision; this.blocked = false;
      this.complete = point.complete;
      const index = point.complete ? 0 : Math.max(0, context.tracks.findIndex((t: Track) => t.id === point.asset));
      await this.load(index, point.complete ? 0 : point.seconds, generation);
    } catch (e) { if (generation === this.generation) { this.state.loading = false; this.fail(e); } }
  }
  private async load(index: number, seconds = 0, generation = this.generation) {
    const track = this.state.tracks[index];
    if (!track?.available) throw Error('Track unavailable. Your saved position has been retained.');
    this.state.loading = true; this.state.playing = false; this.emit();
    await this.audio.load(track, Math.max(0, seconds));
    if (generation !== this.generation) return;
    this.state.index = index; this.state.seconds = Math.max(0, seconds); this.complete = false;
    this.state.completed = false;
    this.state.loading = false; this.audio.speed(this.state.speed);
    if(this.sleepExpired || (this.state.sleepAt!==null && Date.now()>=this.state.sleepAt)){this.tick();}
    else {this.audio.play();this.state.playing=true;}
    this.lastSave = Date.now(); this.emit();
  }
  save(): Promise<void> {
    const track = this.state.tracks[this.state.index];
    if (!track || !this.progressURL || this.state.loading || this.blocked) return this.saves;
    const url = this.progressURL, generation = this.generation;
    const snapshot = {asset: track.id, seconds: this.state.seconds, complete: this.complete};
    this.saves = this.saves.then(async () => {
      if (this.blocked || url !== this.progressURL) return;
      try {
        const result: Position = await this.api(url, 'PUT', {...snapshot, revision: this.revision});
        this.revision = result.revision;
      } catch (e) {
        if (e instanceof RequestError && [401,403,409].includes(e.status)) { this.blocked = true; this.audio.pause(); this.state.playing = false; }
        if (generation === this.generation) this.fail(e);
      }
    });
    return this.saves;
  }
  async select(index: number) {
    if (this.state.loading || this.blocked || index < 0 || index >= this.state.tracks.length) return;
    const generation=this.generation;
    this.audio.pause(); await this.save();
    if (this.blocked || generation!==this.generation) return;
    try { await this.load(index,0,generation); } catch (e) { if(generation===this.generation){this.state.loading=false; this.state.playing=false; this.fail(e);} }
  }
  update(seconds: number, duration: number, playing: boolean, finished: boolean, error?: string | null) {
    if (this.state.loading || !this.state.tracks.length) return;
    this.state.seconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
    this.state.duration = Math.max(0, Number.isFinite(duration) ? duration : 0);
    const paused = this.state.playing && !playing;
    this.state.playing = playing;
    if (error) this.state.error = error;
    this.tick(); this.emit();
    if (paused || Date.now() - this.lastSave >= 10000) { this.lastSave=Date.now(); void this.save(); }
    if (finished && !this.advancing && !this.complete && !this.sleepExpired) {
      this.advancing=true;
      const last = this.state.index === this.state.tracks.length-1;
      this.complete=last;
      void this.save().then(async()=> {
        if (!this.blocked) {
          if (!last) await this.select(this.state.index+1);
          else { this.state.completed=true;this.state.playing=false;this.emit(); }
        }
      }).finally(()=> {this.advancing=false;});
    }
  }
  toggle() {
    if (this.state.loading || !this.state.tracks.length || this.blocked) return;
    this.sleepExpired=false;
    if (this.state.playing) { this.audio.pause(); this.state.playing=false; void this.save(); }
    else if (this.complete) { void this.select(0); return; }
    else { this.audio.play(); this.state.playing=true; }
    this.emit();
  }
  async seek(seconds: number) {
    if (this.state.loading || !this.state.tracks.length) return;
    const target=Math.max(0,Math.min(this.state.duration || Infinity,seconds));
    try { await this.audio.seek(target); this.state.seconds=target; this.complete=false; this.emit(); await this.save(); } catch(e) { this.fail(e); }
  }
  setSpeed(rate: number) {
    if (!Number.isFinite(rate) || rate<0.5 || rate>3) return;
    try { this.audio.speed(rate); this.state.speed=rate; this.emit(); } catch(e) {this.fail(e);}
  }
  sleep(minutes: number) {
    if(!Number.isFinite(minutes) || minutes<0 || minutes>1440)return;
    try {
      if(minutes>0 && !this.audio.sleep)throw Error('Native sleep timer is unavailable in this build.');
      this.audio.sleep?.(minutes*60);
      this.sleepExpired=false;
      this.state.sleepAt=minutes>0 ? Date.now()+minutes*60000 : null;this.emit();
    }catch(e){this.fail(e);}
  }
  tick() {
    if (this.state.sleepAt!==null && Date.now()>=this.state.sleepAt) {
      this.sleepExpired=true;this.state.sleepAt=null;this.audio.sleep?.(0);this.audio.pause();this.state.playing=false;void this.save();this.emit();
    }
  }
  async stop() { ++this.generation;this.audio.sleep?.(0);this.audio.pause();await this.save();this.state.tracks=[];this.progressURL='';this.state.playing=false;this.state.sleepAt=null;this.emit(); }
}
