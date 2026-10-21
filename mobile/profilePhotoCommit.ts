export type ProfilePhotoDraft={uri:string;fileName?:string|null;fileSize?:number};
export const PROFILE_PHOTO_MAX_BYTES=15*1024*1024;
export function validateProfilePhoto(draft:ProfilePhotoDraft){
  if(!draft.uri||! /^(?:file|content|blob|data):/i.test(draft.uri))throw new Error('Choose an image from your device.');
  if(draft.fileSize!==undefined&&(!Number.isFinite(draft.fileSize)||draft.fileSize<0||draft.fileSize>PROFILE_PHOTO_MAX_BYTES))throw new Error('Choose a profile photo smaller than 15 MB.');
}
/** The caller changes the displayed avatar only after this durable commit succeeds. */
export async function commitProfilePhoto<T extends {photoUri?:string}>(draft:ProfilePhotoDraft,current:T,ports:{
  copy:(draft:ProfilePhotoDraft)=>Promise<string>;
  save:(next:T&{photoUri:string})=>Promise<void>;
  remove:(uri:string)=>Promise<void>;
  shouldContinue?:()=>boolean;
}):Promise<T&{photoUri:string}>{
  validateProfilePhoto(draft);
  const check=()=>{if(ports.shouldContinue?.()===false)throw new Error('Photo change cancelled.');};
  check();
  let copied:string|undefined;
  try{
    copied=await ports.copy(draft);
    if(!copied)throw new Error('The selected photo could not be stored.');
    check();
    const next={...current,photoUri:copied};
    await ports.save(next);
    return next;
  }catch(error){
    // Only the new private copy belongs to this transaction. Never remove the
    // selected original or the previous avatar when a save/cancellation fails.
    if(copied&&copied!==draft.uri&&copied!==current.photoUri)await ports.remove(copied).catch(()=>undefined);
    throw error;
  }
}
