import type {LocalBook} from './localLibrary';
import {isGenericMediaTitle} from './libraryIntelligence';

const normal=(value:unknown)=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');

// Publication concerns identity, not completeness or disagreements about optional
// series metadata. Chapter titles are not competing audiobook identities.
export function workIdentityStatus(tracks:LocalBook[],title:string,format:string,canonicalConfidence?:string){
  const generic=(value:unknown)=>isGenericMediaTitle(String(value||''),format,tracks.length);
  const trustworthy=canonicalConfidence==='high'||canonicalConfidence==='medium'||tracks.some(track=>{
    const source=track.metadataProvenance?.title||track.metadataSource;
    const confidence=track.metadataFieldConfidence?.title;
    const candidate=track.embeddedMetadata?.workTitle||track.title;
    return normal(candidate)===normal(title)&&(
      source==='manual'||source==='embedded'||source==='sidecar'||source==='online'
      ||confidence==='high'||confidence==='medium'||!track.needsReview
    );
  });
  const conflict=tracks.some(track=>(track.metadataConflicts||[]).some(item=>{
    if(!['title','author','isbn','asin'].includes(item.field))return false;
    if(track.metadataProvenance?.[item.field]==='manual')return false;
    if(item.field==='title'&&format==='Audio'){
      if(generic(item.chosen))return false;
      const album=track.embeddedMetadata?.workTitle;
      if(album&&normal(album)===normal(title)&&normal(track.title)!==normal(album))return false;
      return (item.alternatives||[]).some(alternative=>!generic(alternative.value));
    }
    return true;
  }));
  return {ambiguous:generic(title)||!trustworthy||conflict,conflict};
}
