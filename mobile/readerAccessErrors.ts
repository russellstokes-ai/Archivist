/**
 * Narrow error mapping for comic WebView failures. Never leak source URI,
 * provider credentials or private filesystem paths into an error toast.
 */
export type ReaderWebError = {code?:number;description?:string;url?:string};

export function comicWebViewFailure(event:ReaderWebError,source:'local'|'server'):string {
  const detail=String(event.description||'');
  const blocked=/(?:ERR_ACCESS_DENIED|ERR_FILE_NOT_FOUND|ERR_FILE_ACCESS_DENIED|access denied|permission denied)/i.test(detail);
  if(blocked){
    return source==='local'
      ? 'Android denied access to this comic reader. Try opening it again. If this persists, reconnect its original folder in Library sources.'
      : 'The server denied access to this comic. Check the server connection and your library permissions, then retry.';
  }
  return source==='local'
    ? 'This comic could not be displayed. Try opening it again.'
    : 'This server comic could not be displayed. Check the server connection and retry.';
}
