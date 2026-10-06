export type LivingBookCoverSource='embedded'|'open-library'|'google-books'|'manual'|'jacket'|'none';
export type LivingBookCoverCandidate={
  uri:string;
  source:Exclude<LivingBookCoverSource,'jacket'|'none'>;
  width?:number;
  height?:number;
  confidence:number;
  exactIdentifier?:boolean;
  sameWork?:boolean;
};
export type LivingBookCoverDecision={
  kind:'portrait'|'jacket'|'placeholder';
  uri?:string;
  source:LivingBookCoverSource;
  confidence:number;
  aspectRatio?:number;
};

export function isPortraitLivingBookCover(candidate:Pick<LivingBookCoverCandidate,'width'|'height'>){
  const width=Number(candidate.width)||0,height=Number(candidate.height)||0;
  if(width<=0||height<=0)return false;
  const ratio=width/height;
  return ratio>=0.48&&ratio<=0.80;
}

function candidateScore(candidate:LivingBookCoverCandidate){
  let score=Math.max(0,Math.min(1,Number(candidate.confidence)||0));
  if(candidate.exactIdentifier)score+=0.20;
  else if(candidate.sameWork)score+=0.08;
  return score;
}

export function chooseLivingBookCover(input:{
  editionCoverUri?:string;
  candidates?:LivingBookCoverCandidate[];
  minimumConfidence?:number;
}):LivingBookCoverDecision{
  const minimum=input.minimumConfidence??0.88;
  const candidates=(input.candidates||[])
    .filter(candidate=>candidate.uri&&isPortraitLivingBookCover(candidate))
    .map(candidate=>({candidate,score:candidateScore(candidate)}))
    .filter(item=>item.score>=minimum)
    .sort((a,b)=>b.score-a.score||Number(!!b.candidate.exactIdentifier)-Number(!!a.candidate.exactIdentifier));
  if(candidates.length){
    const chosen=candidates[0].candidate;
    return {kind:'portrait',uri:chosen.uri,source:chosen.source,confidence:Math.min(1,candidates[0].score),aspectRatio:(chosen.width||0)/(chosen.height||1)};
  }
  if(input.editionCoverUri)return {kind:'jacket',uri:input.editionCoverUri,source:'jacket',confidence:1};
  return {kind:'placeholder',source:'none',confidence:0};
}

/** Keep the same physical cover texture for the whole listening session. */
export function lockLivingBookCover(current:LivingBookCoverDecision|undefined,next:LivingBookCoverDecision){
  return current||next;
}


export type ResolvedLivingBookCoverInput={
  format:string;
  editionCoverUri?:string;
  editionCoverShape?:'portrait'|'square';
  livingBookCoverUri?:string;
  livingBookCoverSource?:LivingBookCoverSource;
  livingBookCoverConfidence?:number;
};

/**
 * Production resolver for the physical book texture.
 * Explicit, already-validated portrait artwork wins. Audio edition artwork is
 * never stretched to portrait; it becomes the centre of a generated jacket.
 */
export function resolveLivingBookCover(input:ResolvedLivingBookCoverInput):LivingBookCoverDecision{
  const livingUri=String(input.livingBookCoverUri||'').trim();
  const livingSource=input.livingBookCoverSource||'none';
  const confidence=Math.max(0,Math.min(1,Number(input.livingBookCoverConfidence)||0));

  if(livingUri&&livingSource==='jacket'){
    return {kind:'jacket',uri:livingUri,source:'jacket',confidence:confidence||1};
  }
  if(livingUri&&livingSource!=='none'&&(confidence>=0.88||livingSource==='manual'||livingSource==='embedded')){
    return {kind:'portrait',uri:livingUri,source:livingSource,confidence:confidence||1};
  }

  const edition=String(input.editionCoverUri||'').trim();
  if(input.format==='Audio'){
    return edition
      ? {kind:'jacket',uri:edition,source:'jacket',confidence:1}
      : {kind:'placeholder',source:'none',confidence:0};
  }
  if(edition&&input.editionCoverShape==='portrait'){
    return {kind:'portrait',uri:edition,source:'embedded',confidence:1};
  }
  return {kind:'placeholder',source:'none',confidence:0};
}

export type LivingBookCoverSession={
  key:string;
  decision:LivingBookCoverDecision;
};

export function lockLivingBookCoverSession(
  current:LivingBookCoverSession|undefined,
  key:string,
  next:LivingBookCoverDecision,
):LivingBookCoverSession{
  if(current&&current.key===key)return current;
  return {key,decision:next};
}
