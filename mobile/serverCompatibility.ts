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

export function normalizeServerWork<T extends CompatibleServerWork>(work:T):T & {genre:string}{
  return {...work,genre:typeof work.genre==='string'?work.genre:''};
}

export function normalizeLibrarySummary(value:CompatibleLibrarySummary):CompatibleLibrarySummary & {genres:CompatibleCount[]}{
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
