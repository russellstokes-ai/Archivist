// Reverse only the exact owner-requested repairs, preserving earlier locks.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
module.exports=function(file,text){
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/v1/OWNER_BUGPASS_2026-10-17.json'),'utf8'));
 const entry=manifest.files[file];if(!entry)return text;
 if(hash(text)!==entry.current)text=require('./discovery-original-source.cjs')(file,text);
 if(manifest.schema!==1||manifest.release_approved!==false||manifest.installed_apk_approved!==false||hash(text)!==entry.current)throw Error('Unreviewed owner repair: '+file);
 for(const change of [...entry.changes].reverse()){
  if(typeof change.old!=='string'||typeof change.new!=='string'||!change.new.length||text.split(change.new).length!==2)throw Error('Non-reversible owner repair: '+file);
  text=text.replace(change.new,change.old);
 }
 if(hash(text)!==entry.previous)throw Error('Earlier source changed: '+file);
 return text;
};
