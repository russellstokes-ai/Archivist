import {decodedPathParts} from './libraryIntelligence';

type ProbeTrack={uri:string;embeddedMetadata?:unknown;needsReview?:boolean;author?:string;title?:string};
type ProbeWork<T extends ProbeTrack>={format:string;tracks:T[]};
const chapterPattern=/^(?:\d{1,4}(?:\s*[-._:]|\s+)|(?:chapter|ch|part|pt|track|disc|disk|cd|scene|section)\s*[-._:#]?\s*\d{1,4}\b|\b.+\b(?:chapter|part|disc|track)\s*\d{1,4}\b)/i;

/** Select *file-level* probes from provisional, already-grouped audio works.
 * Inspect all entries where grouping is ambiguous; do not sacrifice correctness
 * for speed by sampling a mixed collection as if it were one audiobook.
 */
export function fastAudioProbeUris<T extends ProbeTrack>(works:ProbeWork<T>[]):Set<string>{
  const selected=new Set<string>();
  for(const work of works){
    if(work.format!=='Audio'||!work.tracks.length)continue;
    const tracks=work.tracks;
    const titles=tracks.map(track=>{
      const path=decodedPathParts(track.uri);
      return (path[path.length-1]||'').replace(/\.[^.]+$/,'');
    });
    const chapterish=titles.filter(title=>chapterPattern.test(title)).length;
    const strongMultipart=tracks.length>=4&&chapterish>=Math.ceil(tracks.length*.6);
    // For ambiguous directories, including collections of standalone .m4b,
    // inspect every unresolved asset rather than assuming a book boundary.
    const positions=strongMultipart&&tracks.length>3
      ? [0,Math.floor((tracks.length-1)/2),tracks.length-1]
      : tracks.map((_,index)=>index);
    for(const index of new Set(positions)){
      const track=tracks[index];
      if(!track.embeddedMetadata&&(track.needsReview||!String(track.author||'').trim()||!String(track.title||'').trim()))
        selected.add(track.uri);
    }
  }
  return selected;
}
