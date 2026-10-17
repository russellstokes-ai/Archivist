// Validate exactly reversible owner-requested Test 14 Atlas/rewards App changes.
// Canonical and earlier approved App exceptions remain independently immutable.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function test14AppException(root,actual){
 const next=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_APP_EXCEPTION_2026-10-17.json'),'utf8'));
 const previous=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/APP_LOGIC_EXCEPTION_2026-10-16.json'),'utf8'));
 if(next.schema_version!==1 || next.path!=='mobile/App.tsx' ||
    next.release_approved!==false || next.installed_apk_approved!==false ||
    next.previous_approved_git_blob_sha!==previous.approved_git_blob_sha ||
    next.approved_git_blob_sha!==actual || !Array.isArray(next.changes) ||
    next.changes.length!==10) return false;
 let source=fs.readFileSync(path.join(root,'mobile/App.tsx'),'utf8');
 for(const {old,new:replacement} of [...next.changes].reverse()){
   if(typeof old!=='string'||typeof replacement!=='string'||
      !old.length||!replacement.length || source.split(replacement).length!==2) return false;
   source=source.replace(replacement,old);
 }
 const bytes=Buffer.from(source,'utf8');
 return crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes)
   .digest('hex')===previous.approved_git_blob_sha;
};
