export type Session = {server: string; token: string};
export type SetupStatus = {configured: boolean};
export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
function isPrivateHTTPHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '::1') return true;
  const parts = host.split('.');
  if (parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part))) {
    const octets = parts.map(Number);
    if (octets.some(octet => octet < 0 || octet > 255)) return false;
    const [a, b] = octets;
    return a === 10
      || a === 127
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 100 && b >= 64 && b <= 127);
  }
  return /^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host);
}

export function validateServer(raw: string, development = false): string {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { throw Error('Enter a complete server address.'); }
  const developmentLocal = development && ['localhost', '127.0.0.1', '10.0.2.2'].includes(u.hostname);
  const privateHTTP = u.protocol === 'http:' && isPrivateHTTPHost(u.hostname);
  if (u.protocol !== 'https:' && !privateHTTP && !(developmentLocal && u.protocol === 'http:')) {
    throw Error('Use HTTPS for public servers. HTTP is allowed only for a private LAN or Tailscale IP address.');
  }
  if (u.username || u.password || u.search || u.hash || u.pathname !== '/') throw Error('Enter the Archivist server origin only, for example https://books.example.com.');
  return u.origin;
}
export async function request(session: Session, path: string, method = 'GET', data?: unknown, timeoutMs = 15000) {
  if (!path.startsWith('/api/') && !['/session', '/logout', '/setup/status'].includes(path)) throw Error('Invalid API path');
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), Math.max(1000, Math.min(timeoutMs, 300000)));
  try {
    let response: Response;
    try {
      response = await fetch(session.server + path, {
      method, redirect: 'error', signal: abort.signal,
      headers: {Authorization: 'Bearer ' + session.token, 'Content-Type': 'application/json', 'X-Archivist-Action': '1'},
      body: data === undefined ? undefined : JSON.stringify(data),
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw Error('Archivist server timed out. Check the address, HTTPS certificate, and that the server is running.');
      throw Error('Could not reach the Archivist server. Check the address and network connection.');
    }
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw Error('This address did not return an Archivist API response.');
    const result = await response.json();
    if (!response.ok) throw new RequestError(result.error || 'Request failed', response.status);
    return result;
  } finally { clearTimeout(timer); }
}
export async function setupStatus(server: string): Promise<SetupStatus> {
  const result = await request({server, token: ''}, '/setup/status') as SetupStatus;
  if (typeof result.configured !== 'boolean') throw Error('This address did not return Archivist setup status.');
  return result;
}
export function readerNavigationAllowed(raw: string, server: string): boolean {
  try { const u = new URL(raw); return u.origin === server && ['/reader.html', '/'].includes(u.pathname); } catch { return false; }
}
