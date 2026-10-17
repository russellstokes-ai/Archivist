import {readCbtImages,type ArchiveImage} from './archiveReader';
declare const require:any;
const imageName=(name:string)=>/\.(jpe?g|png|gif|webp)$/i.test(name);
const mime=(name:string)=>name.toLowerCase().endsWith('.png')?'image/png':name.toLowerCase().endsWith('.webp')?'image/webp':name.toLowerCase().endsWith('.gif')?'image/gif':'image/jpeg';

// Isolated native CBT adapter; original archive reader is byte-locked.
/** Index CBT/TAR on Android's worker, read only the selected page across JS.
 * iOS retains the existing bounded full-TAR fallback. All native tokens close.
 */
export async function openCbtPages(uri:string):Promise<{
  pageCount:number;
  loadPage:(index:number)=>Promise<ArchiveImage>;
  dispose?:()=>Promise<void>;
}>{
  const native=require('react-native').NativeModules?.ArchivistArchive;
  if(native?.openTar&&native?.readTarEntry&&native?.closeTar){
    const opened:{token:string;entries:Array<{name:string;offset:number;size:number}>}=await native.openTar(uri);
    if(!opened?.token||!Array.isArray(opened.entries))throw Error('CBT reader returned an invalid archive index.');
    let closed=false;
    const dispose=async()=>{if(closed)return;closed=true;await native.closeTar(opened.token);};
    const pages=opened.entries.filter(entry=>imageName(entry.name)&&
      !/(^|\/)__MACOSX\//i.test(entry.name)&&
      Number.isSafeInteger(entry.offset)&&entry.offset>=512&&
      Number.isSafeInteger(entry.size)&&entry.size>0&&entry.size<=16*1024*1024)
      .sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).slice(0,500);
    if(!pages.length){await dispose();throw Error('No readable comic pages found.');}
    return {
      pageCount:pages.length,dispose,
      loadPage:async index=>{
        if(closed)throw Error('CBT reader is closed.');
        const page=pages[Math.max(0,Math.min(pages.length-1,Math.floor(index)))];
        return {name:page.name,mime:mime(page.name),
          base64:await native.readTarEntry(opened.token,page.offset,page.size)};
      },
    };
  }
  // Non-Android fallback uses the original implementation unchanged.
  const images=await readCbtImages(uri);
  if(!images.length)throw Error('No readable comic pages found.');
  return {pageCount:images.length,loadPage:async index=>
    images[Math.max(0,Math.min(images.length-1,Math.floor(index)))]};
}

