import type {ClueAsset} from './collectClues';
export type ArchiveClues={status:'parsed'|'unresolved';reason:string;bytesRead:number;provenance:'embedded';fields:Partial<Record<'title'|'author'|'genre'|'series',string>>};
export interface NativeArchivePort {
 beginScope(rootUri:string):Promise<{scope:string;rootDocumentId:string}>;
 cancelScope(scope:string):Promise<unknown>;
 readArchiveClues(scope:string,documentId:string):Promise<ArchiveClues&{state:string}>;
}
const check=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Archive clue request cancelled');};
export class NativeArchiveReader {
 constructor(private readonly native:NativeArchivePort){}
 async read(asset:ClueAsset,signal?:AbortSignal):Promise<ArchiveClues>{
  check(signal);const scope=await this.native.beginScope(asset.source.rootUri);let closing:Promise<unknown>|undefined;
  const close=()=>closing??(closing=this.native.cancelScope(scope.scope));const abort=()=>{void close().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
  try{
   check(signal);const value=await this.native.readArchiveClues(scope.scope,asset.documentId);check(signal);
   if(value.state!=='ok')throw new Error('Native archive '+value.state);
   if(!['parsed','unresolved'].includes(value.status)||typeof value.reason!=='string'||value.reason.length>128||!Number.isSafeInteger(value.bytesRead)||value.bytesRead<0||value.bytesRead>8388608||value.provenance!=='embedded'||!value.fields||Array.isArray(value.fields))throw new Error('Invalid native archive result');
   for(const [key,field] of Object.entries(value.fields))if(!['title','author','genre','series'].includes(key)||typeof field!=='string'||field.length>4096)throw new Error('Invalid native archive field');
   return {status:value.status,reason:value.reason,bytesRead:value.bytesRead,provenance:value.provenance,fields:{...value.fields}};
  }finally{signal?.removeEventListener('abort',abort);await close();}
 }
}
