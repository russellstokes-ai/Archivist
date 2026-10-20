// Validate a single exact, reversible user-requested reader content repair.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=function(root,file,actual,original){
 const e=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/READER_REPAIR_EXCEPTION_2026-10-16.json')));
 if(file!=='mobile/localReader.ts'||e.path!==file||e.release_approved!==false||e.original_git_blob_sha!==original||e.approved_git_blob_sha!==actual)return false;
 let content=fs.readFileSync(path.join(root,file),'utf8');
 for(const change of [...e.changes].reverse()){if(content.split(change.new).length!==2)return false;content=content.replace(change.new,change.old);}
 const bytes=Buffer.from(content);return crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')===original;
};
