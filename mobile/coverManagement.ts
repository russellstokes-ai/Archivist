export const MAX_MANUAL_COVER_BYTES=25*1024*1024;

export type CoverFileInfo={exists?:boolean;size?:number};
export type CoverFileOps={
  documentDirectory?:string|null;
  makeDirectoryAsync:(uri:string,options?:{intermediates?:boolean})=>Promise<unknown>;
  copyAsync:(copy:{from:string;to:string})=>Promise<unknown>;
  getInfoAsync:(uri:string)=>Promise<CoverFileInfo>;
  deleteAsync:(uri:string,options?:{idempotent?:boolean})=>Promise<unknown>;
  now?:()=>number;
};

export type PickerCoverAsset={uri:string;fileName?:string|null;fileSize?:number};
export type PickerCoverResult={canceled?:boolean;assets?:PickerCoverAsset[]|null};

export function pickedCoverAsset(result:PickerCoverResult|null|undefined){
  if(!result||result.canceled||!Array.isArray(result.assets)||result.assets.length!==1)return null;
  const asset=result.assets[0];
  if(!asset||typeof asset.uri!=='string'||!asset.uri.trim())return null;
  return asset;
}

export function verifiedCoverSize(reported:number|undefined,info:CoverFileInfo|null|undefined){
  const sizes:number[]=[];
  if(Number.isFinite(reported)&&Number(reported)>=0)sizes.push(Number(reported));
  if(info?.exists&&Number.isFinite(info.size)&&Number(info.size)>=0)sizes.push(Number(info.size));
  return sizes.length?Math.max(...sizes):undefined;
}

export function coverSizeError(size:number|undefined){
  if(size===undefined)return 'Archivist could not verify this image size. Choose another cover image.';
  if(size>MAX_MANUAL_COVER_BYTES)return 'Choose a cover image smaller than 25 MB.';
  return '';
}

export function rankLocalCoverCandidates(currentCoverUri:string|undefined,candidates:string[]|undefined){
  const unique:string[]=[];
  const seen=new Set<string>();
  for(const value of candidates||[]){
    const uri=String(value||'').trim();
    if(!uri||seen.has(uri))continue;
    seen.add(uri);unique.push(uri);
  }
  if(currentCoverUri&&seen.has(currentCoverUri)){
    return [currentCoverUri,...unique.filter(uri=>uri!==currentCoverUri)];
  }
  return unique;
}

function coverExtension(fileName:string|undefined,uri:string){
  const candidate=(fileName||uri.split('?')[0].split('/').pop()||'cover.jpg').toLowerCase();
  const ext=(candidate.match(/\.([a-z0-9]{2,5})$/)?.[1]||'jpg').replace(/[^a-z0-9]/g,'')||'jpg';
  return ext;
}

export async function inspectPickedCover(uri:string,reportedSize:number|undefined,ops:Pick<CoverFileOps,'getInfoAsync'>){
  const info=await ops.getInfoAsync(uri).catch(()=>null);
  const size=verifiedCoverSize(reportedSize,info);
  const error=coverSizeError(size);
  return {size,error};
}

export async function persistManualCover(
  uri:string,
  fileName:string|undefined,
  reportedSize:number|undefined,
  ops:CoverFileOps,
){
  if(!ops.documentDirectory)throw Error('Archivist storage is unavailable.');
  const sourceInfo=await ops.getInfoAsync(uri).catch(()=>null);
  const sourceSize=verifiedCoverSize(reportedSize,sourceInfo);
  const sourceError=coverSizeError(sourceSize);
  if(sourceError)throw Error(sourceError);

  const directory=ops.documentDirectory+'covers/';
  await ops.makeDirectoryAsync(directory,{intermediates:true});
  const stamp=ops.now?.()??Date.now();
  const extension=coverExtension(fileName,uri);
  let target='';
  for(let attempt=0;attempt<100;attempt+=1){
    const suffix=attempt===0?'':'-'+attempt;
    const candidate=directory+'manual-cover-'+stamp+suffix+'.'+extension;
    const existing=await ops.getInfoAsync(candidate).catch(()=>null);
    if(!existing?.exists){target=candidate;break;}
  }
  if(!target)throw Error('Could not reserve safe cover storage.');
  let copied=false;
  try{
    await ops.copyAsync({from:uri,to:target});
    copied=true;
    const targetInfo=await ops.getInfoAsync(target).catch(()=>null);
    if(!targetInfo?.exists)throw Error('Saved cover could not be verified.');
    const targetSize=verifiedCoverSize(undefined,targetInfo);
    const targetError=coverSizeError(targetSize);
    if(targetError)throw Error(targetError);
    if(sourceSize!==undefined&&targetSize!==undefined&&sourceSize!==targetSize){
      throw Error('Saved cover size did not match the selected image.');
    }
    return target;
  }catch(error){
    if(copied)await ops.deleteAsync(target,{idempotent:true}).catch(()=>undefined);
    throw error;
  }
}
