/**
 * Narrow error mapping for comic WebView failures. Never leak source URI,
 * provider credentials or private filesystem paths into an error toast.
 * A WebView-origin error is not evidence that the SAF permission was revoked.
 */
export type ReaderWebError = {code?:number;description?:string;url?:string};

export function comicWebViewFailure(event:ReaderWebError,source:'local'|'server'):string {
  const detail=String(event.description||'');
  const reportedURL=String(event.url||'');
  const blocked=/(?:ERR_ACCESS_DENIED|ERR_FILE_NOT_FOUND|ERR_FILE_ACCESS_DENIED|access denied|permission denied)/i.test(detail);
  const appAssetsOrigin=/^https:\/\/appassets\.androidplatform\.net(?:[\/?#]|$)/i.test(reportedURL);
  const localFileURI=/^(?:content|file):\/\//i.test(reportedURL);

  if(blocked&&source==='local'&&appAssetsOrigin){
    return 'The embedded comic reader was blocked while loading its page. Retry the comic. If the error continues, report a reader loading problem; reconnecting the library folder may not help.';
  }
  if(blocked&&source==='local'&&localFileURI){
    return 'The device cannot access this comic file. Reconnect its original folder in Library sources, then try again.';
  }
  if(blocked){
    return source==='local'
      ? 'This comic reader could not access its pages. Try again; if it persists, check the original library folder permission.'
      : 'The server comic reader was denied access. Check your server session and library access, then retry.';
  }
  if(/(?:ERR_CONNECTION|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_TIMED_OUT)/i.test(detail)&&source==='server'){
    return 'The comic server connection was interrupted. Reconnect to your server and retry.';
  }
  return source==='local'
    ? 'This comic could not be displayed. Try opening it again.'
    : 'This server comic could not be displayed. Check the server connection and retry.';
}
