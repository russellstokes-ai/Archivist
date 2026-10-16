const fs=require('fs'),path=require('path'),crypto=require('crypto');
const hash=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
module.exports=function(file){
 const root=path.resolve(__dirname,'..');
 const record=file==='mobile/localReader.ts'?'READER_REPAIR_EXCEPTION_2026-10-16.json':'LIVING_WRAPPER_REPAIR_EXCEPTION_2026-10-16.json';
 const e=JSON.parse(fs.readFileSync(path.join(root,'docs/v1',record)));let text=fs.readFileSync(path.join(root,file),'utf8');
 if(e.path!==file||hash(text)!==e.approved_git_blob_sha)throw Error('Unexpected source outside exact repair exception');
 for(const change of [...e.changes].reverse()){if(text.split(change.new).length!==2)throw Error('Non-reversible repair');text=text.replace(change.new,change.old);}
 if(hash(text)!==e.original_git_blob_sha)throw Error('Original source protection failed');return text;
};
