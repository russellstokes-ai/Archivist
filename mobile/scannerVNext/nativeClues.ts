import type {ClueAsset,ClueReader} from './collectClues';
export interface NativeHeaderPort {
  beginScope(rootUri:string):Promise<{scope:string;rootDocumentId:string}>;
  cancelScope(scope:string):Promise<unknown>;
  readHeader(scope:string,documentId:string,byteBudget:number):Promise<{state:string;reason?:string;base64?:string;bytesRead?:number;budgetReached?:boolean;metadataStatus?:string}>;
}
function check(signal?:AbortSignal){if(signal?.aborted)throw new Error('Native clue request cancelled');}
function decodeBase64(value:string,length:number):Uint8Array {
  if(value.length!==Math.ceil(length/3)*4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new Error('Invalid native header base64');
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',bytes=new Uint8Array(length);let accumulated=0,bits=0,offset=0;
  for(let i=0;i<value.length&&value[i]!=='=';i++){
    accumulated=(accumulated<<6)|alphabet.indexOf(value[i]);bits+=6;
    if(bits>=8){bits-=8;if(offset>=length)throw new Error('Invalid native header length');bytes[offset++]=(accumulated>>bits)&255;accumulated&=(1<<bits)-1;}
  }
  if(offset!==length||accumulated!==0)throw new Error('Invalid native header base64 padding');return bytes;
}
export class NativeHeaderReader implements ClueReader {
  constructor(private readonly native:NativeHeaderPort){}
  async readHeader(asset:ClueAsset,byteBudget:number,signal?:AbortSignal){
    if(!Number.isInteger(byteBudget)||byteBudget<1||byteBudget>65536)throw new RangeError('Header budget must be 1..65536');
    check(signal);const scope=await this.native.beginScope(asset.source.rootUri);
    let closing:Promise<unknown>|undefined;const close=()=>closing??(closing=this.native.cancelScope(scope.scope));
    const abort=()=>{void close().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
    try{
      check(signal);const result=await this.native.readHeader(scope.scope,asset.documentId,byteBudget);check(signal);
      if(result.state!=='ok')throw new Error('Native header '+result.state+(result.reason?': '+result.reason:''));
      if(!Number.isInteger(result.bytesRead)||result.bytesRead!<0||result.bytesRead!>byteBudget||typeof result.base64!=='string'||typeof result.budgetReached!=='boolean'||result.metadataStatus!=='header-only')throw new Error('Invalid native header result');
      return {bytes:decodeBase64(result.base64,result.bytesRead!),budgetReached:result.budgetReached};
    }finally{signal?.removeEventListener('abort',abort);await close();}
  }
}
