const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

const file=fs.readFileSync(path.join(__dirname,'readerAccessErrors.ts'),'utf8');
const js=ts.transpileModule(file,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,
}}).outputText;
const exported={};
vm.runInNewContext(js,{exports:exported,module:{exports:exported}});
const {comicWebViewFailure}=exported;
assert.equal(typeof comicWebViewFailure,'function');

const origin=comicWebViewFailure({
  code:-1,description:'net::ERR_ACCESS_DENIED',
  url:'https://appassets.androidplatform.net/reader.html',
},'local');
assert.match(origin,/embedded comic reader.*blocked/i,
  'A synthetic WebView origin block must not be misreported as revoked SAF access');
assert.match(origin,/retry/i);
assert.doesNotMatch(origin,/Reconnect its original folder/i);

const content=comicWebViewFailure({
  code:-1,description:'net::ERR_ACCESS_DENIED',
  url:'content://com.provider/tree/library/book.cbt',
},'local');
assert.match(content,/Reconnect its original folder/i);

const fileError=comicWebViewFailure({
  description:'ERR_FILE_NOT_FOUND',
  url:'file:///storage/emulated/0/Private/Issue.cbr',
},'local');
assert.match(fileError,/Reconnect its original folder/i);

const unknown=comicWebViewFailure({code:-1,description:'net::ERR_ACCESS_DENIED'},'local');
assert.match(unknown,/could not access its pages/i,
  'Unknown failing origin must use neutral, actionable diagnostics');

const server=comicWebViewFailure({
  code:-1,description:'Permission denied',
  url:'https://private.example/secret?sessionKey=private',
},'server');
assert.match(server,/server session and library access/i);

const disconnected=comicWebViewFailure({
  description:'net::ERR_INTERNET_DISCONNECTED',
  url:'https://private.example/audio?token=private',
},'server');
assert.match(disconnected,/connection was interrupted/i);

for(const message of [origin,content,fileError,unknown,server,disconnected]){
  for(const secret of ['/storage/emulated/0/Private','com.provider','private.example','sessionKey','token=']){
    assert(!message.includes(secret),'Comic error must never leak user paths/hosts/credentials');
  }
}
assert(!file.includes('console.log(')&&!file.includes('console.error('),'Errors must not log private media URIs');
console.log('PASS: comic reader explains origin blocking vs missing SAF access without exposing media paths');
