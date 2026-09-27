import {AtlasKind, buildAtlasRelationship} from './atlas';

export type CompatibleCount={name:string;count:number};

export type CompatibleServerWork={
  id:number;
  title:string;
  author:string;
  series:string;
  genre?:string;
  format:string;
  space:string;
  editions:number;
  files:number;
  available:boolean;
  rating?:number;
  favourite?:boolean;
  state?:'not-started'|'in-progress'|'finished';
};

export type CompatibleLibrarySummary={
  total:number;
  formats:CompatibleCount[];
  spaces:CompatibleCount[];
  authors:CompatibleCount[];
  unknownAuthors:number;
  needsReview:number;
  series:CompatibleCount[];
  genres?:CompatibleCount[];
  availability:CompatibleCount[];
  reading?:CompatibleCount[];
  ratings?:CompatibleCount[];
  favourites?:CompatibleCount[];
};

export type CompatibleAtlasRelationship={
  kind:AtlasKind;
  value:string;
  workCount:number;
  works:CompatibleServerWork[];
  authors:CompatibleCount[];
  series:CompatibleCount[];
  genres?:CompatibleCount[];
  formats:CompatibleCount[];
  spaces:CompatibleCount[];
  availability?:CompatibleCount[];
  reading?:CompatibleCount[];
  ratings?:CompatibleCount[];
  favourites?:CompatibleCount[];
};

function countArray(value:unknown):CompatibleCount[]{
  return Array.isArray(value)
    ? value.filter(item=>item && typeof item.name==='string' && Number.isFinite(item.count))
        .map(item=>({name:item.name,count:Number(item.count)}))
    : [];
}

export function normalizeServerWork<T extends CompatibleServerWork>(work:T):T & {genre:string;rating:number;favourite:boolean;state:'not-started'|'in-progress'|'finished'}{
  const state=work.state==='finished'||work.state==='in-progress'?'state' in work?work.state:'not-started':'not-started';
  return {
    ...work,
    genre:typeof work.genre==='string'?work.genre:'',
    rating:Number.isFinite(work.rating)?Math.max(0,Math.min(10,Number(work.rating))):0,
    favourite:!!work.favourite,
    state:state as 'not-started'|'in-progress'|'finished',
  };
}

export function normalizeLibrarySummary(value:CompatibleLibrarySummary):CompatibleLibrarySummary & {genres:CompatibleCount[];reading:CompatibleCount[];ratings:CompatibleCount[];favourites:CompatibleCount[]}{
  return {
    ...value,
    formats:countArray(value.formats),
    spaces:countArray(value.spaces),
    authors:countArray(value.authors),
    series:countArray(value.series),
    genres:countArray(value.genres),
    availability:countArray(value.availability),
    reading:countArray(value.reading),
    ratings:countArray(value.ratings),
    favourites:countArray(value.favourites),
  };
}

export function normalizeAtlasRelationship(value:CompatibleAtlasRelationship):CompatibleAtlasRelationship & {genres:CompatibleCount[];availability:CompatibleCount[];reading:CompatibleCount[];ratings:CompatibleCount[];favourites:CompatibleCount[]}{
  return {
    ...value,
    works:Array.isArray(value.works)?value.works.map(normalizeServerWork):[],
    authors:countArray(value.authors),
    series:countArray(value.series),
    genres:countArray(value.genres),
    formats:countArray(value.formats),
    spaces:countArray(value.spaces),
    availability:countArray(value.availability),
    reading:countArray(value.reading),
    ratings:countArray(value.ratings),
    favourites:countArray(value.favourites),
  };
}

export function buildLegacyAtlasRelationship(
  works:CompatibleServerWork[],
  kind:AtlasKind,
  value:string,
):CompatibleAtlasRelationship & {genres:CompatibleCount[];availability:CompatibleCount[];reading:CompatibleCount[];ratings:CompatibleCount[];favourites:CompatibleCount[]}{
  const normalized=works.map(normalizeServerWork);
  return buildAtlasRelationship(normalized,kind,value);
}
