import JSZip from 'jszip';
import {EncodingType, readAsStringAsync} from 'expo-file-system/legacy';

export type LocalReaderDocument = {
  html?: string;
  uri?: string;
};

const imageExt = /\.(jpe?g|png|gif|webp)$/i;
const textExt = /\.(xhtml|html|htm)$/i;

export async function buildLocalReaderDocument(uri: string, format: string, title: string): Promise<LocalReaderDocument> {
  if (format === 'PDF') return {uri};
  if (format === 'Comic') return {html: await comicHtml(uri, title)};
  if (format === 'EPUB') return {html: await epubHtml(uri, title)};
  return {uri};
}

async function comicHtml(uri: string, title: string) {
  const zip = await zipFromUri(uri);
  const pages = Object.values(zip.files)
    .filter(file => !file.dir && imageExt.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
  const images = await Promise.all(pages.slice(0, 250).map(async page => {
    const base64 = await page.async('base64');
    return `<img class="comic-page" src="data:${mime(page.name)};base64,${base64}" alt="${escapeHtml(page.name)}">`;
  }));
  return shell(title, images.join('\n') || '<p>No readable comic pages found.</p>', 'comic');
}

async function epubHtml(uri: string, title: string) {
  const zip = await zipFromUri(uri);
  const docs = Object.values(zip.files)
    .filter(file => !file.dir && textExt.test(file.name))
    .sort((a, b) => scoreEpubPath(a.name) - scoreEpubPath(b.name));
  const parts = await Promise.all(docs.slice(0, 80).map(async file => {
    const raw = await file.async('text');
    return `<section>${sanitizeEpubHtml(raw)}</section>`;
  }));
  return shell(title, parts.join('\n') || '<p>No readable EPUB text found.</p>', 'epub');
}

async function zipFromUri(uri: string) {
  const data = await readAsStringAsync(uri, {encoding: EncodingType.Base64});
  return JSZip.loadAsync(data, {base64: true});
}

function shell(title: string, body: string, mode: 'comic' | 'epub') {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
body{margin:0;background:#f8f7f2;color:#0f2a36;font:18px/1.65 system-ui,-apple-system,Segoe UI,sans-serif}
header{position:sticky;top:0;background:#f8f7f2ee;backdrop-filter:blur(12px);padding:12px 16px;border-bottom:1px solid #d9dfdc;font-weight:800}
main{padding:16px;max-width:760px;margin:auto}
.comic main{max-width:none;padding:0;overflow:hidden}.comic img{display:block;max-width:100%;height:auto;margin:0 auto 12px;background:#111;transition:transform .22s ease;transform-origin:center center}.comic img.focused{transform:scale(2.35);cursor:zoom-out}
.epub section{margin-bottom:28px}.epub img{max-width:100%;height:auto}h1,h2,h3{line-height:1.2}
</style></head><body class="${mode}"><header>${escapeHtml(title)}</header><main>${body}</main>${mode === 'comic' ? comicFocusScript() : ''}</body></html>`;
}

function comicFocusScript() {
  return `<script>
(() => {
  let lastTap = 0;
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function focusImage(img, x, y) {
    const rect = img.getBoundingClientRect();
    const px = clamp(((x - rect.left) / rect.width) * 100, 0, 100);
    const py = clamp(((y - rect.top) / rect.height) * 100, 0, 100);
    const active = img.classList.contains('focused');
    document.querySelectorAll('.comic-page.focused').forEach(page => page.classList.remove('focused'));
    if (active) return;
    img.style.transformOrigin = px + '% ' + py + '%';
    img.classList.add('focused');
    setTimeout(() => img.scrollIntoView({block: 'center', inline: 'center', behavior: 'smooth'}), 40);
  }
  document.addEventListener('dblclick', event => {
    const img = event.target.closest && event.target.closest('.comic-page');
    if (img) { event.preventDefault(); focusImage(img, event.clientX, event.clientY); }
  });
  document.addEventListener('touchend', event => {
    const now = Date.now();
    const touch = event.changedTouches && event.changedTouches[0];
    const img = event.target.closest && event.target.closest('.comic-page');
    if (img && touch && now - lastTap < 320) {
      event.preventDefault();
      focusImage(img, touch.clientX, touch.clientY);
    }
    lastTap = now;
  }, {passive: false});
})();
</script>`;
}

function sanitizeEpubHtml(raw: string) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(src|href)=["'](?!data:|#)[^"']*["']/gi, '');
}

function scoreEpubPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.includes('nav') || lower.includes('toc')) return 9000;
  if (lower.includes('cover')) return 8000;
  return 0;
}

function mime(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
}
