'use strict';
// Preserve the physically accepted baseline hashes. Discovery changes are
// explicit, reviewable deltas, not a claim of new physical acceptance.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
module.exports=(file,text)=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/v1/DISCOVERY_SOURCE_EXCEPTIONS.json'),'utf8'));
 text=text.replace(/\r\n/g,'\n');const entry=manifest.files[file];if(!entry)return text;
 if(manifest.schema!==1||manifest.release_approved!==false||manifest.installed_apk_approved!==false||hash(text)!==entry.current)throw Error('Unrecorded Discovery source change: '+file);
 for(const change of [...entry.changes].reverse()){
  if(typeof change.old!=='string'||typeof change.new!=='string'||!change.new||text.split(change.new).length!==2)throw Error('Non-reversible Discovery delta: '+file);
  text=text.replace(change.new,change.old);
 }
 if(hash(text)!==entry.previous)throw Error('Discovery changed the protected baseline: '+file);
 return text;
};
