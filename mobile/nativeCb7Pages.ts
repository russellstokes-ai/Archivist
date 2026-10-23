import type {ArchiveImage} from './archiveReader';
declare const require:any;

/** Read one selected page at a time; native sessions own their private staging files. */
export async function openCb7Pages(uri:string):Promise<{
  pageCount:number;loadPage:(index:number)=>Promise<ArchiveImage>;dispose:()=>Promise<void>;
}>{
  const native=require('react-native').NativeModules?.ArchivistSevenZip;
  if(!native?.open||!native?.read||!native?.close)throw Error('CB7 reading is unavailable on this device.');
  const opened=await native.open(uri);
  if(typeof opened?.token!=='string'||!opened.token)throw Error('CB7 reader returned an invalid archive index.');
  let closed=false;
  const dispose=async()=>{if(closed)return;closed=true;await native.close(opened.token);};
  const safe=(name:unknown):name is string=>typeof name==='string'&&name.length>0&&
    !/[\\:\0]/.test(name)&&!name.split('/').some(part=>!part||part==='.'||part==='..')&&
    !/^__MACOSX\//i.test(name)&&/\.(jpe?g|png|gif|webp)$/i.test(name);
  if(!Array.isArray(opened.names)||!opened.names.length||opened.names.length>500||
    !opened.names.every(safe)||new Set(opened.names).size!==opened.names.length){
    await dispose();throw Error('CB7 reader returned an invalid archive index.');
  }
  const names:string[]=[...opened.names].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  return {pageCount:names.length,dispose,loadPage:async index=>{
    if(closed)throw Error('CB7 reader is closed.');
    if(!Number.isFinite(index))throw Error('Invalid comic page.');
    const name=names[Math.max(0,Math.min(names.length-1,Math.floor(index)))];
    const base64=await native.read(opened.token,name);
    if(closed)throw Error('CB7 reader is closed.');
    if(typeof base64!=='string'||!base64.length||base64.length>Math.ceil(16*1024*1024/3)*4)
      throw Error('CB7 reader returned an invalid page.');
    const extension=name.toLowerCase().split('.').pop();
    return {name,mime:extension==='png'?'image/png':extension==='gif'?'image/gif':extension==='webp'?'image/webp':'image/jpeg',base64};
  }};
}
