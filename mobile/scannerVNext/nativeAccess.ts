import type {Source,SourceEntry,SourceAccess,DiscoveryBatch,DiscoveryIssue} from './types';

export type NativeEntry=Omit<SourceEntry,'relativePath'>;
export type NativePage={state:string;reason?:string;entries?:NativeEntry[];nextOffset?:number|null};
export interface ScannerNativePort {
  beginScope(rootUri:string):Promise<{scope:string;rootDocumentId:string}>;
  queryChildren(scope:string,parentId:string,offset:number,limit:number):Promise<NativePage>;
  cancelScope(scope:string):Promise<unknown>;
}
type Child={id:string;path:string};
type Frame=Child & {offset:number;done:boolean;children:Child[]};
type Continuation={version:1;sourceId:string;rootUri:string;rootId:string;frames:Frame[]};
const MAX_CURSOR=1024*1024,MAX_DEPTH=256;
const cancelled=()=>new Error('Scanner request cancelled');
function check(signal?:AbortSignal){if(signal?.aborted)throw cancelled();}
function validId(value:unknown):value is string{return typeof value==='string'&&value.length>0&&value.length<=16384;}
function validName(value:unknown):value is string{return typeof value==='string'&&value.length>0&&value.length<=2048&&!/[\\/:]/.test(value)&&value!=='.'&&value!=='..';}
function validPath(value:unknown):value is string{return typeof value==='string'&&(value===''||value.split('/').every(validName));}
function child(value:unknown):value is Child{const v=value as Child;return !!v&&validId(v.id)&&validPath(v.path);}
function decode(source:Source,cursor:string|null):Continuation|null{
  if(cursor===null)return null;
  if(cursor.length>MAX_CURSOR)throw new Error('Traversal cursor budget exceeded');
  let state:Continuation;try{state=JSON.parse(cursor);}catch{throw new Error('Invalid traversal cursor');}
  if(!state||state.version!==1||state.sourceId!==source.id||state.rootUri!==source.rootUri)throw new Error('Traversal cursor does not match selected source');
  if(!validId(state.rootId)||!Array.isArray(state.frames)||state.frames.length>MAX_DEPTH||state.frames.some(f=>!child(f)||!Number.isInteger(f.offset)||f.offset<0||f.offset>100000||typeof f.done!=='boolean'||!Array.isArray(f.children)||f.children.length>128||!f.children.every(child)))throw new Error('Invalid traversal cursor frames');
  if(state.frames.length&&(state.frames[0].id!==state.rootId||state.frames[0].path!==''))throw new Error('Invalid traversal cursor root');
  if(new Set(state.frames.map(f=>f.id)).size!==state.frames.length)throw new Error('Invalid traversal cursor cycle');
  return state;
}
function frame(value:Child):Frame{return {...value,offset:0,done:false,children:[]};}
function advance(state:Continuation){
  while(state.frames.length){
    const current=state.frames[state.frames.length-1];
    if(current.children.length){
      if(state.frames.length>=MAX_DEPTH)throw new Error('Traversal depth budget exceeded');
      state.frames.push(frame(current.children.shift()!));
    }else if(current.done)state.frames.pop();else break;
  }
}
function encode(state:Continuation):string|null{
  advance(state);if(!state.frames.length)return null;
  const cursor=JSON.stringify(state);if(cursor.length>MAX_CURSOR)throw new Error('Traversal cursor budget exceeded');return cursor;
}

/** Fresh SAF traversal. Every batch owns one native scope; its immutable cursor is
 * saved with assets by DiscoveryStore and survives process death without a native handle.
 * DFS keeps pending children bounded to one page per ancestor. Provider ordering must
 * be stable during a scan; changing source contents requires a new scan.
 */
export class NativeSourceAccess implements SourceAccess {
  constructor(private readonly native:ScannerNativePort){}
  async nextBatch(source:Source,cursor:string|null,limit:number,signal?:AbortSignal):Promise<DiscoveryBatch>{
    if(!Number.isInteger(limit)||limit<1||limit>128)throw new RangeError('Batch limit must be 1..128');
    check(signal);let state=decode(source,cursor);
    const scope=await this.native.beginScope(source.rootUri);
    let closing:Promise<unknown>|undefined;
    const close=()=>closing??(closing=this.native.cancelScope(scope.scope));
    const abort=()=>{void close().catch(()=>{});};
    signal?.addEventListener('abort',abort,{once:true});
    try{
      check(signal);
      if(!validId(scope.rootDocumentId))throw new Error('Invalid provider root');
      if(state&&state.rootId!==scope.rootDocumentId)throw new Error('Traversal cursor source root changed');
      state??={version:1,sourceId:source.id,rootUri:source.rootUri,rootId:scope.rootDocumentId,frames:[frame({id:scope.rootDocumentId,path:''})]};
      advance(state);
      if(!state.frames.length)return {entries:[],nextCursor:null};
      const current=state.frames[state.frames.length-1];
      let page:NativePage;
      try{
        page=await this.native.queryChildren(scope.scope,current.id,current.offset,limit);check(signal);
        if(page.state!=='ok')throw new Error('Native provider '+page.state+(page.reason?': '+page.reason:''));
      }catch(error){
        check(signal);
        // Exhausted workers affect the whole source. Keep its previous checkpoint for retry.
        const message=error instanceof Error?error.message:'Provider query failed';
        if(state.frames.length===1||/circuit-open|queue-full|cancelled/.test(message))throw error;
        current.done=true;current.children=[];
        return {entries:[],nextCursor:encode(state),issues:[{reason:'directory-unreadable',detail:(current.path+': '+message).slice(0,4096)}]};
      }
      if(!Array.isArray(page.entries)||page.entries.length>limit||!(page.nextOffset===null||Number.isInteger(page.nextOffset)&&page.nextOffset!>current.offset&&page.nextOffset!<=100000))throw new Error('Invalid provider pagination or no progress');
      if(page.nextOffset!==null&&(page.entries.length===0||page.nextOffset!==current.offset+page.entries.length))throw new Error('Provider pagination made no progress');
      const entries:SourceEntry[]=[],issues:DiscoveryIssue[]=[];
      const ancestors=new Set(state.frames.map(f=>f.id));const children=new Set<string>();
      for(const entry of page.entries){
        if(!entry||!validId(entry.documentId)||!validName(entry.name)||typeof entry.directory!=='boolean'||entry.mimeType!==undefined&&(typeof entry.mimeType!=='string'||entry.mimeType.length>256)||[entry.size,entry.modified].some(n=>n!==undefined&&(!Number.isFinite(n)||n<0)))throw new Error('Invalid provider entry name or metadata');
        const relativePath=current.path?current.path+'/'+entry.name:entry.name;
        entries.push({...entry,relativePath});
        if(entry.directory){
          if(ancestors.has(entry.documentId))issues.push({reason:'directory-cycle',detail:relativePath.slice(0,4096)});
          else if(!children.has(entry.documentId)){current.children.push({id:entry.documentId,path:relativePath});children.add(entry.documentId);}
        }
      }
      current.done=page.nextOffset===null;current.offset=page.nextOffset??current.offset+entries.length;
      check(signal);return {entries,nextCursor:encode(state),...(issues.length?{issues}:{})};
    }finally{signal?.removeEventListener('abort',abort);await close();}
  }
}
