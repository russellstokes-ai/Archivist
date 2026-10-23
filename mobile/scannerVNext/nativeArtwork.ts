import type {ClueAsset} from './collectClues';
import type {ArtworkResult} from './artwork';
import {selectBestCover} from './coverSelection';
type NativeArtwork={state:string;uri?:string;sha256?:string;bytes?:number;width?:number;height?:number;thumbnailUri?:string;thumbnailWidth?:number;thumbnailHeight?:number};
export interface NativeArtworkPort {
 beginScope(rootUri:string):Promise<{scope:string;rootDocumentId:string}>;
 cancelScope(scope:string):Promise<unknown>;
 readArtwork(scope:string,documentId:string):Promise<NativeArtwork>;
 readPrivateArtwork?(scope:string,fileUri:string):Promise<NativeArtwork>;
 readEmbeddedArtwork?(scope:string,documentId:string,container:string):Promise<NativeArtwork>;
}
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Artwork request cancelled');};
export class NativeArtworkReader {
 constructor(private native:NativeArtworkPort){}
 async read(asset:ClueAsset,options:{manualUri?:string;privateUri?:string;embeddedContainer?:string;signal?:AbortSignal}={}):Promise<ArtworkResult>{
  const privateUri=options.manualUri??options.privateUri;
  check(options.signal);if(privateUri&&(!privateUri.startsWith('file:///')||privateUri.length>2048||!this.native.readPrivateArtwork))throw new Error('Private manual artwork required');
  const scope=await this.native.beginScope(asset.source.rootUri);let closing:Promise<unknown>|undefined;const close=()=>closing??(closing=this.native.cancelScope(scope.scope));const abort=()=>{void close().catch(()=>{});};options.signal?.addEventListener('abort',abort,{once:true});
  try{
   check(options.signal);if(options.embeddedContainer&&!this.native.readEmbeddedArtwork)throw new Error('Embedded artwork reader unavailable');
   const value=privateUri?await this.native.readPrivateArtwork!(scope.scope,privateUri):options.embeddedContainer?await this.native.readEmbeddedArtwork!(scope.scope,asset.documentId,options.embeddedContainer):await this.native.readArtwork(scope.scope,asset.documentId);check(options.signal);
   if(value.state!=='ok')throw new Error('Native artwork unavailable');
   if(!value.uri?.startsWith('file:///')||value.uri.length>2048||!value.sha256||!/^[a-f0-9]{64}$/.test(value.sha256)||!Number.isSafeInteger(value.bytes)||value.bytes!<1||value.bytes!>4194304||!Number.isSafeInteger(value.width)||!Number.isSafeInteger(value.height)||value.width!<64||value.height!<64||value.width!*value.height!>16777216)throw new Error('Invalid native artwork');
   const selected=selectBestCover([{uri:value.uri,manual:!!options.manualUri,exactEdition:true,placeholder:!options.manualUri&&/placeholder|no[-_ ]?cover|missing[-_ ]?cover/i.test(asset.name),width:value.width!,height:value.height!,bytes:value.bytes!,sha256:value.sha256!}]);
   if(!selected)throw new Error('Invalid native artwork');
   if(!value.thumbnailUri?.startsWith('file:///')||value.thumbnailUri.length>2048||!Number.isSafeInteger(value.thumbnailWidth)||value.thumbnailWidth!<1||value.thumbnailWidth!>512||!Number.isSafeInteger(value.thumbnailHeight)||value.thumbnailHeight!<1||value.thumbnailHeight!>512)throw new Error('Invalid native artwork thumbnail');
   return {state:'ready',uri:options.manualUri??value.uri,thumbnailUri:value.thumbnailUri,thumbnailWidth:value.thumbnailWidth,thumbnailHeight:value.thumbnailHeight,sha256:value.sha256,manual:!!options.manualUri,bytes:value.bytes,width:value.width,height:value.height};
  }finally{options.signal?.removeEventListener('abort',abort);await close();}
 }
}
