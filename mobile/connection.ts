export type Session = {server: string; token: string};
export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function validateServer(raw: string, development = false): string {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { throw Error('Enter a complete HTTPS server address.'); }
  const local = development && ['localhost', '127.0.0.1', '10.0.2.2'].includes(u.hostname);
  if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) throw Error('Use HTTPS with a trusted certificate. The Home Assistant HTTP port is not a secure mobile endpoint.');
  if (u.username || u.password || u.search || u.hash || u.pathname !== '/') throw Error('Enter the Archivist server origin, not a Home Assistant sidebar URL.');
  return u.origin;
}
export async function request(session: Session, path: string, method = 'GET', data?: unknown) {
  if (!path.startsWith('/api/') && !['/session', '/logout'].includes(path)) throw Error('Invalid API path');
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(session.server + path, {
      method, redirect: 'error', signal: abort.signal,
      headers: {Authorization: 'Bearer ' + session.token, 'Content-Type': 'application/json', 'X-Archivist-Action': '1'},
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw Error('This address did not return an Archivist API response.');
    const result = await response.json();
    if (!response.ok) throw new RequestError(result.error || 'Request failed', response.status);
    return result;
  } finally { clearTimeout(timer); }
}
export function readerNavigationAllowed(raw: string, server: string): boolean {
  try { const u = new URL(raw); return u.origin === server && ['/reader.html', '/'].includes(u.pathname); } catch { return false; }
}
