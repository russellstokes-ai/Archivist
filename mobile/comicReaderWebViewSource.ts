/**
 * The comic reader HTML and all its scripts/styles are bundled in-memory;
 * individual comic pages arrive via the existing native message bridge.
 * Android WebView can refuse a synthetic loadDataWithBaseURL origin on some
 * devices. If this happens, retry the SAME HTML via an opaque data URI.
 *
 * No content:// or file:// access is granted to the WebView, and we do not
 * change the original comic HTML, speech-focus, zoom or page-turn logic.
 */
export function comicReaderWebViewSource(html:string,dataFallback=false):
  {html:string;baseUrl:string}|{uri:string} {
  if(dataFallback){
    return {uri:'data:text/html;charset=utf-8,'+encodeURIComponent(html)};
  }
  return {html,baseUrl:'https://appassets.androidplatform.net/'};
}
