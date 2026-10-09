import {meaningfulGenre,type GenreDecision} from './genre';
export type CatalogueRow={workId:string;editionId:string;revision:number;published:boolean;title:string;genre:GenreDecision;parts:string[];secondaryGenres?:GenreDecision[]};
export function buildPublishedGenreCounts(rows:CatalogueRow[]){
 const works=new Map<string,CatalogueRow>();for(const row of rows){if(!row.published)continue;if(!meaningfulGenre(row.genre))throw new Error('Published work requires meaningful genre');const previous=works.get(row.workId);if(previous&&previous.revision===row.revision&&previous.genre.id!==row.genre.id)throw new Error('Conflicting published work genres');if(!previous||row.revision>previous.revision)works.set(row.workId,row);}
 const primary:Record<string,number>={},secondary:Record<string,number>={};for(const row of works.values()){primary[row.genre.id!]=(primary[row.genre.id!]??0)+1;for(const id of new Set((row.secondaryGenres??[]).filter(meaningfulGenre).map(x=>x.id!)))secondary[id]=(secondary[id]??0)+1;}
 return {total:works.size,primary,secondary,coverage:works.size?1:0};
}
export function projectCatalogue(rows:CatalogueRow[]){
 const works=new Map<string,CatalogueRow>(),staged=new Map<string,CatalogueRow>();for(const row of rows){const previous=works.get(row.workId);if(!row.published&&(!staged.has(row.workId)||row.revision>staged.get(row.workId)!.revision))staged.set(row.workId,row);if(!previous||row.published&&!previous.published||row.published===previous.published&&row.revision>previous.revision)works.set(row.workId,row);}
 return [...works.values()].map(row=>{const pending=staged.get(row.workId),stagedRevision=pending&&pending.revision>=row.revision?pending:undefined;return {...row,stagedRevision,needsAttention:!row.published||!meaningfulGenre(row.genre)||!!stagedRevision};});
}
