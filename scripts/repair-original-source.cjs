const fs=require('fs'),path=require('path'),crypto=require('crypto');
const hash=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
module.exports=function(file){
 const root=path.resolve(__dirname,'..');
 const record=file==='mobile/localReader.ts'?'READER_REPAIR_EXCEPTION_2026-10-16.json':'LIVING_WRAPPER_REPAIR_EXCEPTION_2026-10-16.json';
 const e=JSON.parse(fs.readFileSync(path.join(root,'docs/v1',record)));let text=fs.readFileSync(path.join(root,file),'utf8');
 if(file==='mobile/localReader.ts'){
  const next=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_READER_DISPATCH_EXCEPTION_2026-10-17.json'),'utf8'));
  const tar=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_CBT_READER_EXCEPTION_2026-10-17.json'),'utf8'));
  if(tar.schema_version!==1||tar.path!==file||tar.previous_approved_git_blob_sha!==next.approved_git_blob_sha||
     tar.release_approved!==false||tar.installed_apk_approved!==false||
     tar.changes.length!==4||hash(text)!==tar.approved_git_blob_sha)
    throw Error('Unreviewed Test 14 CBT native reader exception');
  for(const change of [...tar.changes].reverse()){
    if(typeof change.old!=='string'||typeof change.new!=='string'||
       !change.new.length||text.split(change.new).length!==2)
      throw Error('Non-reversible CBT reader routing');
    text=text.replace(change.new,change.old);
  }
  if(hash(text)!==next.approved_git_blob_sha)throw Error('Previous Test 14 reader source modified');
  if(next.path!==file||next.previous_approved_git_blob_sha!==e.approved_git_blob_sha||
     next.release_approved!==false||next.installed_apk_approved!==false||
     next.changes.length!==2||hash(text)!==next.approved_git_blob_sha)
    throw Error('Unreviewed Test 14 comic reader source');
  for(const change of [...next.changes].reverse()){
    if(text.split(change.new).length!==2)throw Error('Non-reversible Test 14 comic dispatch');
    text=text.replace(change.new,change.old);
  }
  if(hash(text)!==e.approved_git_blob_sha)throw Error('Previous protected reader source changed');
 }
 if(file==='mobile/LivingBookCanvas.tsx'){
  const next=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_LIVING_WRAPPER_EXCEPTION_2026-10-17.json'),'utf8'));
  const native=JSON.parse(fs.readFileSync(path.join(root,'docs/v1/TEST14_LIVING_STALE_CALLBACK_EXCEPTION_2026-10-17.json'),'utf8'));
  if(native.schema_version!==1||native.path!==file||
     native.previous_approved_git_blob_sha!==next.approved_git_blob_sha||
     native.release_approved!==false||native.installed_apk_approved!==false||
     native.changes.length!==6||hash(text)!==native.approved_git_blob_sha)
    throw Error('Unreviewed Living Book native lifecycle follow-on exception');
  for(const change of [...native.changes].reverse()){
    if(typeof change.old!=='string'||typeof change.new!=='string'||
       !change.new.length||text.split(change.new).length!==2)
      throw Error('Non-reversible Living Book native lifecycle follow-on');
    text=text.replace(change.new,change.old);
  }
  if(hash(text)!==next.approved_git_blob_sha)throw Error('Prior Living Book wrapper was modified');
  if(next.path!==file || next.previous_approved_git_blob_sha!==e.approved_git_blob_sha ||
     next.release_approved!==false || next.installed_apk_approved!==false ||
     hash(text)!==next.approved_git_blob_sha || next.changes.length!==2)
    throw Error('Unreviewed Test 14 Living Book source');
  for(const change of [...next.changes].reverse()){
   if(text.split(change.new).length!==2)throw Error('Non-reversible Test 14 Living Book wrapper');
   text=text.replace(change.new,change.old);
  }
  if(hash(text)!==e.approved_git_blob_sha)throw Error('Previous exact Living Book wrapper was modified');
 }

 if(e.path!==file||hash(text)!==e.approved_git_blob_sha)throw Error('Unexpected source outside exact repair exception');
 for(const change of [...e.changes].reverse()){if(text.split(change.new).length!==2)throw Error('Non-reversible repair');text=text.replace(change.new,change.old);}
 if(hash(text)!==e.original_git_blob_sha)throw Error('Original source protection failed');return text;
};
