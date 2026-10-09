import type {Source} from './types';
import type {AssetFingerprint} from './clueCache';
import {parseHeaderClues,type HeaderClues} from './clues';

export type ClueAsset={assetId:string;documentId:string;name:string;source:Source;size:number|null;modified:number|null};
export interface ClueReader {readHeader(asset:ClueAsset,byteBudget:number,signal?:AbortSignal):Promise<{bytes:Uint8Array;budgetReached:boolean}>}
export interface ClueCache {
  load(assetId:string,fingerprint:AssetFingerprint):Promise<HeaderClues|null>;
  save(assetId:string,fingerprint:AssetFingerprint,result:HeaderClues,signal?:AbortSignal):Promise<boolean>;
}
export type WorkClues={samples:{assetId:string;clues:HeaderClues;source:'cache'|'read'}[];issues:{assetId:string;reason:string;detail:string}[];bytesRead:number;skippedAssets:number};
function check(signal?:AbortSignal){if(signal?.aborted)throw new Error('Clue collection cancelled');}
export async function collectWorkClues(assets:ClueAsset[],reader:ClueReader,cache:ClueCache,options:{maxAssets?:number;maxBytes?:number;signal?:AbortSignal}={}):Promise<WorkClues>{
  const maxAssets=options.maxAssets??2,maxBytes=options.maxBytes??131072;
  if(!Number.isInteger(maxAssets)||maxAssets<1||maxAssets>16||!Number.isInteger(maxBytes)||maxBytes<1||maxBytes>8388608||assets.length>100000)throw new RangeError('Invalid work clue budget');
  const result:WorkClues={samples:[],issues:[],bytesRead:0,skippedAssets:assets.length};
  // First/last ordered parts provide limited corroboration without reopening every track.
  const selected=assets.length>maxAssets&&maxAssets>1?[...assets.slice(0,maxAssets-1),assets[assets.length-1]]:assets.slice(0,maxAssets);
  for(const asset of selected){
    check(options.signal);
    if(!asset.assetId||!asset.documentId)throw new Error('Clue asset identity required');
    const fingerprint={documentId:asset.documentId,size:asset.size,modified:asset.modified};
    const uncertain=asset.size===null||asset.modified===null||asset.modified===0;
    if(uncertain)result.issues.push({assetId:asset.assetId,reason:'fingerprint-uncertain',detail:'Provider fingerprint cannot safely identify cached content'});
    const cached=uncertain?null:await cache.load(asset.assetId,fingerprint);check(options.signal);
    if(cached){result.samples.push({assetId:asset.assetId,clues:cached,source:'cache'});result.skippedAssets--;continue;}
    const budget=Math.min(65536,maxBytes-result.bytesRead);if(budget<=0)break;
    let header;
    try{header=await reader.readHeader(asset,budget,options.signal);}
    catch(error){
      check(options.signal);result.skippedAssets--;
      const detail=(error instanceof Error?error.message:'Provider read failed').slice(0,4096);
      result.issues.push({assetId:asset.assetId,reason:'clue-read-failed',detail});
      if(/circuit-open|queue-full/.test(detail))break;
      continue;
    }
    check(options.signal);
    if(!header||!(header.bytes instanceof Uint8Array)||header.bytes.length>budget||typeof header.budgetReached!=='boolean')throw new Error('Provider header exceeded work byte budget or returned invalid data');
    result.bytesRead+=header.bytes.length;result.skippedAssets--;
    const clues=parseHeaderClues(header.bytes,asset.name.split('.').pop()??'');
    // The cache's budget class is header64k. A shorter, exhausted probe must not
    // conceal metadata that a later normal-budget read could discover.
    check(options.signal);if(!uncertain&&(budget===65536||!header.budgetReached))await cache.save(asset.assetId,fingerprint,clues,options.signal);check(options.signal);
    result.samples.push({assetId:asset.assetId,clues,source:'read'});
    if(header.budgetReached)result.issues.push({assetId:asset.assetId,reason:'header-budget-reached',detail:'Later metadata may require an explicit bounded seek or deeper read'});
    // A selected work remains cancellable between its bounded probes.
    await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  return result;
}
