export type AssetKind = 'audio'|'ebook'|'comic'|'document'|'archive'|'artwork'|'sidecar'|'directory'|'unknown';
export type Disposition = {state:'candidate'|'ambiguous'|'unsupported'|'unreadable'|'rejected'|'directory';kind:AssetKind;reason:string;audiobookConfirmed:false};
export type Source = {id:string;rootUri:string;name:string};
export type SourceEntry = {documentId:string;relativePath:string;name:string;mimeType?:string;size?:number;modified?:number;directory?:boolean;readable?:boolean};
export type DiscoveredEntry = SourceEntry & {disposition:Disposition};
export type DiscoveryIssue = {reason:string;detail:string};
export type DiscoveryBatch = {entries:SourceEntry[];nextCursor:string|null;issues?:DiscoveryIssue[]};
export type DiscoveryCheckpoint = {cursor:string|null;visited:number;accounted:number;complete:boolean};
export interface SourceAccess {nextBatch(source:Source,cursor:string|null,limit:number,signal?:AbortSignal):Promise<DiscoveryBatch>}
export interface DiscoveryStore {
  saveSource(source:Source):Promise<void>;
  saveBatch(sourceId:string,entries:DiscoveredEntry[],checkpoint:DiscoveryCheckpoint,signal?:AbortSignal):Promise<void>;
  saveIssue(sourceId:string,issue:{reason:string;detail:string;cursor:string|null}):Promise<void>;
}
export type DiscoveryOptions = {maxEntries?:number;batchSize?:number;cursor?:string|null;signal?:AbortSignal};
export type DiscoverySummary = {visited:number;accounted:number;candidates:number;ambiguous:number;unsupported:number;unreadable:number;rejected:number;directories:number;duplicateEntries:number;complete:boolean;reason:string;nextCursor:string|null};
