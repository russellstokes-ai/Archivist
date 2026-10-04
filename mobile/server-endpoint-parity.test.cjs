const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const app=fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8');
const connection=fs.readFileSync(path.join(__dirname,'connection.ts'),'utf8');
const serverFiles=[
  'main.go','activity.go','catalogue.go','duplicates.go','filemoves.go',
  'preferences.go','profile.go','progress.go','sessions.go','household.go','organise.go'
];
const server=serverFiles.map(name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8')).join('\n');

const pairs=[
  ['/api/activity','GET /api/activity'],
  ['/api/books','GET /api/books'],
  ['/api/continue','GET /api/continue'],
  ['/api/library-summary','GET /api/library-summary'],
  ['/api/duplicate-candidates','GET /api/duplicate-candidates'],
  ['/api/duplicate-candidates/verify','POST /api/duplicate-candidates/verify'],
  ['/api/file-moves','GET /api/file-moves'],
  ['/api/file-moves/preview-template-batch','POST /api/file-moves/preview-template-batch'],
  ['/api/file-moves/apply-batch','POST /api/file-moves/apply-batch'],
  ['/api/preferences','GET /api/preferences'],
  ['/api/profile-stats','GET /api/profile-stats'],
  ['/api/profiles','GET /api/profiles'],
  ['/api/sources','GET /api/sources'],
  ['/api/works','GET /api/works'],
  ['/api/me','GET /api/me'],
];

for(const [mobilePath,serverRoute] of pairs){
  assert.ok(app.includes(mobilePath),'Mobile no longer references expected API path '+mobilePath);
  assert.ok(server.includes(serverRoute),'Server route missing for mobile API path '+mobilePath+' (expected '+serverRoute+')');
}

assert.ok(app.includes("'/session'"),'Mobile session endpoint missing');
assert.ok(server.includes('r.URL.Path == "/session"') && server.includes('r.Method == "POST"'),'Server POST /session handler missing');
assert.ok(app.includes("'/logout'"),'Mobile logout endpoint missing');
assert.ok(server.includes('r.URL.Path == "/logout"') && server.includes('r.Method == "POST"'),'Server POST /logout handler missing');

assert.ok(app.includes("'/api/works/'+work.id+'/preference'"),'Mobile work-preference endpoint missing');
assert.ok(server.includes('PUT /api/works/{id}/preference'),'Server work-preference handler missing');
assert.ok(app.includes("'/api/sources/'+source.id+'/scan'"),'Mobile source-scan endpoint missing');
assert.ok(server.includes('POST /api/sources/{id}/scan'),'Server source-scan handler missing');
assert.ok(app.includes("'/api/profiles/'+id"),'Mobile profile mutation endpoint missing');
assert.ok(server.includes('DELETE /api/profiles/{id}'),'Server profile deletion handler missing');

assert.ok(app.includes("request(session,'/api/profiles','POST'"),'Mobile profile creation endpoint missing');
assert.ok(server.includes('POST /api/profiles'),'Server profile creation handler missing');
assert.ok(app.includes("sourceAction('/api/sources',{"),'Mobile source creation endpoint missing');
assert.ok(server.includes('POST /api/sources'),'Server source creation handler missing');
assert.ok(server.includes('GET /api/assets/{id}'),'Server artwork/media asset handler missing');
assert.ok(connection.includes("'X-Archivist-Action': '1'"),'Mobile mutating/session requests must carry the server action header, including logout');

console.log('PASS: mobile API calls remain covered by the bundled Archivist server surface');
