export type MetadataSource = 'manual'|'embedded'|'sidecar'|'path'|'online';
export type MetadataConfidence = 'high'|'medium'|'low';

export type ResolvableMetadata = {
  title?: string;
  author?: string;
  series?: string;
  seriesNumber?: number;
  genre?: string;
  publishedYear?: number;
  narrator?: string;
  publisher?: string;
  isbn?: string;
  asin?: string;
  language?: string;
  description?: string;
};

export type MetadataCandidate = {
  source: MetadataSource;
  confidence: MetadataConfidence;
  fields: ResolvableMetadata;
};

export type MetadataConflict = {
  field: keyof ResolvableMetadata;
  chosen: unknown;
  alternatives: Array<{value: unknown; source: MetadataSource; score: number}>;
};

export type MetadataResolution = {
  fields: ResolvableMetadata;
  provenance: Partial<Record<keyof ResolvableMetadata, MetadataSource>>;
  confidence: Partial<Record<keyof ResolvableMetadata, MetadataConfidence>>;
  conflicts: MetadataConflict[];
};

const sourceWeight:Record<MetadataSource,number>={
  manual:100,
  embedded:90,
  sidecar:85,
  path:65,
  online:60,
};
const confidenceWeight:Record<MetadataConfidence,number>={high:20,medium:10,low:0};

function present(value:unknown){
  return value!==undefined&&value!==null&&String(value).trim()!=='';
}
function normal(value:unknown){
  return String(value??'').trim().toLowerCase().replace(/\s+/g,' ').replace(/[’']/g,"'");
}
function fieldConfidence(score:number):MetadataConfidence{
  return score>=100?'high':score>=75?'medium':'low';
}

export function resolveMetadataCandidates(candidates:MetadataCandidate[]):MetadataResolution {
  const fields:ResolvableMetadata={};
  const provenance:MetadataResolution['provenance']={};
  const confidence:MetadataResolution['confidence']={};
  const conflicts:MetadataConflict[]=[];
  const keys:Array<keyof ResolvableMetadata>=[
    'title','author','series','seriesNumber','genre','publishedYear','narrator','publisher','isbn','asin','language','description',
  ];

  for(const field of keys){
    const values=candidates.flatMap(candidate=>{
      const value=candidate.fields[field];
      if(!present(value))return [];
      return [{value,source:candidate.source,score:sourceWeight[candidate.source]+confidenceWeight[candidate.confidence]}];
    });
    if(!values.length)continue;

    const consensus=new Map<string,number>();
    for(const item of values){
      const key=normal(item.value);
      consensus.set(key,(consensus.get(key)||0)+1);
    }
    const ranked=values.map(item=>({...item,score:item.score+Math.min(15,Math.max(0,(consensus.get(normal(item.value))||1)-1)*5)}))
      .sort((a,b)=>b.score-a.score);
    const chosen=ranked[0];
    (fields as any)[field]=chosen.value;
    provenance[field]=chosen.source;
    confidence[field]=fieldConfidence(chosen.score);

    const alternatives=ranked.filter(item=>normal(item.value)!==normal(chosen.value));
    if(alternatives.length&&alternatives[0].score>=chosen.score-15){
      conflicts.push({field,chosen:chosen.value,alternatives});
    }
  }

  return {fields,provenance,confidence,conflicts};
}

export function metadataNeedsReview(resolution:MetadataResolution){
  if(!present(resolution.fields.title))return true;
  if(!present(resolution.fields.author))return true;
  return resolution.conflicts.some(conflict=>{
    const important=['title','author','series','seriesNumber','isbn','asin'];
    return important.includes(String(conflict.field));
  });
}
