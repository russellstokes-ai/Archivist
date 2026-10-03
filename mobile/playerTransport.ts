export const PLAYER_SKIP = {small: {seconds: 15, pages: 3}, large: {seconds: 30, pages: 6}} as const;

export function seekTarget(seconds: number, duration: number): number {
  const end = Number.isFinite(duration) && duration > 0 ? duration : 0;
  return Math.min(end, Math.max(0, Number.isFinite(seconds) ? seconds : 0));
}

type SeekRequest = {
  key: string;
  current: number;
  duration: number;
  delta?: number;
  target?: number;
  seek: (seconds: number) => Promise<void>;
  persist: (seconds: number) => Promise<void>;
  isCurrent: () => boolean;
  onError: (error: unknown) => void;
};

/** Accumulate rapid taps immediately; serialize native seeks and save the final target. */
export class PlayerSeekQueue {
  private key = '';
  private version = 0;
  private intended: number | null = null;
  private pending: {request: SeekRequest; target: number; version: number} | null = null;
  private running = false;

  reset(key: string) {
    this.key = key;
    this.version++;
    this.intended = null;
    this.pending = null;
  }

  request(request: SeekRequest): number | null {
    if (!request.isCurrent() || !Number.isFinite(request.duration) || request.duration <= 0) return null;
    if (request.key !== this.key) this.reset(request.key);
    const base = this.intended ?? request.current;
    const target = seekTarget(request.target ?? (base + (request.delta ?? 0)), request.duration);
    if (target === base) return null;
    this.intended = target;
    this.pending = {request, target, version: this.version};
    void this.drain();
    return target;
  }

  private async drain() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.pending) {
        const item = this.pending;
        this.pending = null;
        const valid = () => item.version === this.version && item.request.isCurrent();
        if (!valid()) continue;
        try {
          await item.request.seek(item.target);
          if (valid() && !this.pending) await item.request.persist(item.target);
        } catch (error) {
          if (valid()) {
            this.pending = null;
            item.request.onError(error);
          }
        }
      }
    } finally {
      this.running = false;
      this.intended = null;
    }
  }
}
