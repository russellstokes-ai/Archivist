const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('web/manage.html'),js=read('web/manage.js'),css=read('web/manage.css');
for(const name of ['manage.html','manage.js','manage.css']){
  assert.equal(read('web/'+name),read('archivist/app/web/'+name),'packaged manager must match root web source: '+name);
}
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
for(const [,name] of js.matchAll(/\$\('([^']+)'\)/g))assert(ids.has(name),'manager JS refers to missing DOM id #'+name);
for(const token of ['id="catalogue"','id="editor"','id="candidate-search-form"','id="source-health"','id="jobs-health"','aria-live','role="search"']){
  assert(html.includes(token),'manager HTML missing '+token);
}
assert(js.includes("if(!me.owner)"),'server manager must hide admin controls from non-owners');
assert(js.includes("api('./api/library-health')"),'manager health panel must use live root availability diagnostics');
assert(js.includes('Storage unavailable'),'manager must distinguish missing NAS storage from stored catalogue flags');

assert(!js.includes('innerHTML'),'render external provider metadata only as text, not HTML');
assert(js.includes("encodeURIComponent(query)"),'encode optional provider searches');
assert(js.includes("candidate[key]"),'metadata candidates need per-field selection');
assert(css.includes('prefers-reduced-motion'),'manager must respect reduced motion');
assert(css.includes('max-width:590px'),'manager must have phone layout');
console.log('PASS: standalone manager structural, access-control and mirrored-file contracts');

// Also execute real selection event handlers against a minimal DOM.
require('./v1-manager-selection.test.cjs');

// Delayed-provider responses must never contaminate a different open editor.
require('./v1-manager-candidate-race.test.cjs');

// Grouped-book Assist must connect the existing editor without changing file review.
require('./v1-manager-assist.test.cjs');
