import type {ClueAsset} from './collectClues';
import type {ArtworkResult} from './artwork';
type NativeArtwork={state:string;uri?:string;sha256?:string;bytes?:number;width?:number;height?:number};
export interface NativeArtworkPort {
 beginScope(rootUri:string):Promise<{scope:string;rootDocumentId:string}>;
 cancelScope(scope:string):Promise<unknown>;
 readArtwork(scope:string,documentId:string):Promise<NativeArtwork>;
 readPrivateArtwork?(scope:string,fileUri:string):Promise<NativeArtwork>;
}
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Artwork request cancelled');};
export class NativeArtworkReader {
 constructor(private native:NativeArtworkPort){}
 async read(asset:ClueAsset,options:{manualUri?:string;signal?:AbortSignal}={}):Promise<ArtworkResult>{
  check(options.signal);if(options.manualUri&&(!options.manualUri.startsWith('file:///')||options.manualUri.length>2048||!this.native.readPrivateArtwork))throw new Error('Private manual artwork required');
  const scope=await this.native.beginScope(asset.source.rootUri);let closing:Promise<unknown>|undefined;const close=()=>closing??(closing=this.native.cancelScope(scope.scope));const abort=()=>{void close().catch(()=>{});};options.signal?.addEventListener('abort',abort,{once:true});
  try{
   check(options.signal);const value=options.manualUri?await this.native.readPrivateArtwork!(scope.scope,options.manualUri):await this.native.readArtwork(scope.scope,asset.documentId);check(options.signal);
   if(value.state!=='ok')throw new Error('Native artwork unavailable');
   if(!value.uri?.startsWith('file:///')||value.uri.length>2048||!value.sha256||!/^[a-f0-9]{64}$/.test(value.sha256)||!Number.isSafeInteger(value.bytes)||value.bytes!<1||value.bytes!>4194304||!Number.isSafeInteger(value.width)||!Number.isSafeInteger(value.height)||value.width!<64||value.height!<64||value.width!*value.height!>16777216)throw new Error('Invalid native artwork');
   return {state:'ready',uri:options.manualUri??value.uri,manual:!!options.manualUri,bytes:value.bytes,width:value.width,height:value.height};
  }finally{options.signal?.removeEventListener('abort',abort);await close();}
 }
}
