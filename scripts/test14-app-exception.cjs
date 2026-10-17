// Validate exactly reversible owner-requested Test 14 Atlas/rewards App changes.
// Canonical and earlier approved App exceptions remain independently immutable.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function test14AppException(root,actual){
 const next=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_APP_EXCEPTION_2026-10-17.json'),'utf8'));
 const previous=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/APP_LOGIC_EXCEPTION_2026-10-16.json'),'utf8'));
 if(next.schema_version!==1 || next.path!=='mobile/App.tsx' ||
    next.release_approved!==false || next.installed_apk_approved!==false ||
    next.previous_approved_git_blob_sha!==previous.approved_git_blob_sha ||
    !Array.isArray(next.changes) ||
    next.changes.length!==14) return false;
 let source=fs.readFileSync(path.join(root,'mobile/App.tsx'),'utf8');
 // Apply any owner-directed follow-on responsive layout exception strictly
 // in reverse, then enforce the original 14-patch baseline as before.
 const follow=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_TRANSPORT_APP_EXCEPTION_2026-10-17.json'),'utf8'));
 const saf=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_SAF_APP_EXCEPTION_2026-10-17.json'),'utf8'));
 if(actual!==next.approved_git_blob_sha){
   let transportBlob=actual;
   if(actual===saf.approved_git_blob_sha){
     if(saf.schema_version!==1||saf.path!=='mobile/App.tsx'||
        saf.previous_approved_git_blob_sha!==follow.approved_git_blob_sha||
        saf.release_approved!==false||saf.installed_apk_approved!==false||
        saf.changes.length!==3)return false;
     for(const {old,new:replacement} of [...saf.changes].reverse()){
       if(typeof old!=='string'||typeof replacement!=='string'||
          !old.length||!replacement.length||source.split(replacement).length!==2)return false;
       source=source.replace(replacement,old);
     }
     const bytes=Buffer.from(source,'utf8');
     transportBlob=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
     if(transportBlob!==follow.approved_git_blob_sha)return false;
   }
   if(follow.schema_version!==1||follow.path!=='mobile/App.tsx'||
      follow.previous_approved_git_blob_sha!==next.approved_git_blob_sha||
      follow.release_approved!==false||follow.installed_apk_approved!==false||
      follow.approved_git_blob_sha!==transportBlob||follow.changes.length!==8)return false;
   for(const {old,new:replacement} of [...follow.changes].reverse()){
     if(typeof old!=='string'||typeof replacement!=='string'||
        !old.length||!replacement.length||source.split(replacement).length!==2)return false;
     source=source.replace(replacement,old);
   }
   const previousBytes=Buffer.from(source,'utf8');
   const previousSha=crypto.createHash('sha1').update('blob '+previousBytes.length+'\0').update(previousBytes).digest('hex');
   if(previousSha!==next.approved_git_blob_sha)return false;
 }
 for(const {old,new:replacement} of [...next.changes].reverse()){
   if(typeof old!=='string'||typeof replacement!=='string'||
      !old.length||!replacement.length || source.split(replacement).length!==2) return false;
   source=source.replace(replacement,old);
 }
 const bytes=Buffer.from(source,'utf8');
 return crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes)
   .digest('hex')===previous.approved_git_blob_sha;
};
