const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync:exec}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'archivist-repro-'));
try{
  const env={...process.env,SOURCE_DATE_EPOCH:'1700000000',TZ:'Pacific/Honolulu'};
  const first=path.join(temp,'first.zip'),second=path.join(temp,'second.zip');
  exec('sh',[root+'/scripts/package-ha-repository.sh',first],{env});
  exec('python3',['-c',`import zipfile,sys
with zipfile.ZipFile(sys.argv[1]) as z:
 assert all(i.date_time == (2023,11,14,22,13,20) for i in z.infolist()), 'archive timestamps must use SOURCE_DATE_EPOCH in UTC'
 assert z.namelist() == sorted(z.namelist()), 'archive entries must be stably ordered'
`,first]);
  exec('sh',[root+'/scripts/package-ha-repository.sh',second],{env:{...env,TZ:'Europe/London'}});
  assert.deepEqual(fs.readFileSync(first),fs.readFileSync(second),'same source and epoch must yield identical ZIP bytes across timezones');
  console.log('PASS: HA repository ZIP reproducible across timezones with fixed source epoch');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
