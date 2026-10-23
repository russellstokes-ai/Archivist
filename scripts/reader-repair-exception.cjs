// Validate a single exact, reversible user-requested reader content repair.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=function(root,file,actual,original){
 const e=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/READER_REPAIR_EXCEPTION_2026-10-16.json')));
 if(file!=='mobile/localReader.ts'||e.path!==file||e.release_approved!==false||e.original_git_blob_sha!==original)return false;
 let content=fs.readFileSync(path.join(root,file),'utf8');
 const test14=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_READER_DISPATCH_EXCEPTION_2026-10-17.json')));
 const cbt=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_CBT_READER_EXCEPTION_2026-10-17.json')));
 // Exact CB7 dispatch delta for the owner's requested format support; retain all previous locks.
 const cb7=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/DISCOVERY_CB7_READER_EXCEPTION_2026-10-23.json')));
 const blob=text=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');
 if(cb7.schema_version!==1||cb7.path!==file||cb7.release_approved!==false||cb7.installed_apk_approved!==false||
    cb7.previous_approved_git_blob_sha!==cbt.approved_git_blob_sha||cb7.approved_git_blob_sha!==actual||cb7.changes.length!==1)return false;
 for(const change of [...cb7.changes].reverse()){
   if(typeof change.old!=='string'||typeof change.new!=='string'||!change.new||content.split(change.new).length!==2)return false;
   content=content.replace(change.new,change.old);
 }
 if(blob(content)!==cb7.previous_approved_git_blob_sha)return false;
 actual=blob(content);
 if(cbt.schema_version!==1||cbt.path!==file||
    cbt.previous_approved_git_blob_sha!==test14.approved_git_blob_sha||
    cbt.release_approved!==false||cbt.installed_apk_approved!==false||
    cbt.changes.length!==4||cbt.approved_git_blob_sha!==actual)return false;
 for(const change of [...cbt.changes].reverse()){
   if(typeof change.old!=='string'||typeof change.new!=='string'||
      !change.new.length||content.split(change.new).length!==2)return false;
   content=content.replace(change.new,change.old);
 }
 const cbtReversed=Buffer.from(content);
 if(crypto.createHash('sha1').update('blob '+cbtReversed.length+'\0').update(cbtReversed).digest('hex')!==test14.approved_git_blob_sha)return false;
 if(test14.path!==file||test14.previous_approved_git_blob_sha!==e.approved_git_blob_sha||
    test14.release_approved!==false||test14.installed_apk_approved!==false||
    test14.changes.length!==2)return false;
 for(const change of [...test14.changes].reverse()){
   if(content.split(change.new).length!==2)return false;
   content=content.replace(change.new,change.old);
 }
 const previousBytes=Buffer.from(content);
 if(crypto.createHash('sha1').update('blob '+previousBytes.length+'\0').update(previousBytes).digest('hex')!==e.approved_git_blob_sha)return false;
 for(const change of [...e.changes].reverse()){if(content.split(change.new).length!==2)return false;content=content.replace(change.new,change.old);}
 const bytes=Buffer.from(content);return crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')===original;
};
