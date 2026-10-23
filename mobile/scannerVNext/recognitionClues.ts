import type {EmbeddedFields} from './clues';
import type {GroupingEvidence} from './grouping';
import type {WorkFields} from './fieldEvidence';
const clean=(v:string)=>v.normalize('NFKC').replace(/\s+/g,' ').trim();
const normal=(v:string)=>clean(v).toLowerCase();
const generic=(v:string)=>/^(?:unknown(?: album| artist)?|audiobook|audio book|various(?: artists)?|untitled|album|book|disc\s*\d+|cd\s*\d+)$/i.test(clean(v));
/** A rendition stays inside its book directory, with CD subdirectories folded.
 * Album artist identifies the work; track artist may identify a performer. */
export function audioGroupingEvidence(fields:EmbeddedFields,path:string,container:string):GroupingEvidence|undefined {
 const title=fields.album?.trim(),author=(fields.albumAuthor||fields.author)?.trim();
 if(!title||!author||generic(title)||generic(author))return undefined;
 const parts=path.replace(/\\/g,'/').split('/');parts.pop();
 const leaf=parts.at(-1)||'',disc=leaf.match(/^(?:cd|disc|disk|part)[\s_-]*(\d+)$/i);
 if(disc)parts.pop();
 const named=parts.at(-1)?.match(/^(.+?)\s+(?:disc|disk|cd)[\s_-]*(\d+)$/i);
 if(named)parts[parts.length-1]=named[1];
 // No album-only coalescing of complete M4B files or unrelated editions.
 const scope=container==='m4b'&&!disc&&!named?path:parts.join('/');
 return {title,author,track:fields.track,disc:fields.disc??(disc?Number(disc[1]):named?Number(named[2]):undefined),edition:JSON.stringify([normal(scope),normal(title),normal(author),normal(fields.narrator||'')]),provenance:'embedded'};
}
/** Filename guesses remain low-confidence: a year in an annual's cover title
 * is not assumed to be its publication year. Embedded fields override these. */
export function comicFilenameClues(filename:string):WorkFields {
 let title=clean(filename.replace(/\.[^.]+$/,'').replace(/_/g,' '));
 const year=title.match(/[([]((?:18|19|20)\d{2})[)\]]/);
 title=clean(title.replace(/[([](?:digital|digital[- ]?comic|scan|scanned|c2c|retail|fixed)[)\]]/gi,'').replace(/[([](?:18|19|20)\d{2}[)\]]/g,''));
 const annual=title.match(/^(.*?)\s+annual\s+((?:18|19|20)\d{2})$/i);
 if(annual)return {title,series:clean(annual[1]+' Annual'),seriesNumber:annual[2],...(year?{publishedYear:year[1]}:{})};
 const numbered=title.match(/^(.+?)\s+(?:(?:#|issue\s*|no\.?\s*)\s*)?(\d{1,6}(?:\.\d+)?[A-Za-z]?)$/i);
 if(numbered&&!/\b(?:vol(?:ume)?\.?|book)\s*$/i.test(numbered[1]))return {title,series:clean(numbered[1]),seriesNumber:numbered[2],...(year?{publishedYear:year[1]}:{})};
 return {title,...(year?{publishedYear:year[1]}:{})};
}

/** Infer only repeated numeric comic filenames in a named folder. The folder
 * remains a filename clue, never a verified series or an author. */
export function siblingComicClues(assets:{assetId:string;relativePath:string;kind:string}[]):Map<string,WorkFields> {
 const buckets=new Map<string,{id:string;number:string}[]>();
 for(const a of assets){if(a.kind!=='comic')continue;const p=a.relativePath.replace(/\\/g,'/').split('/'),file=p.pop()||'';const m=file.match(/^(?:#|issue[ _-]*)?(\d{1,6})\.(?:cbz|cbr|cb7|cbt|zip|rar|7z|tar)$/i);if(!m||!p.length)continue;const key=p.join('/');const rows=buckets.get(key)||[];rows.push({id:a.assetId,number:m[1]});buckets.set(key,rows);}
 const out=new Map<string,WorkFields>();
 for(const [path,rows]of buckets){const series=clean(path.split('/').at(-1)||'');if(rows.length<2||new Set(rows.map(r=>Number(r.number))).size!==rows.length||/^(?:comics|downloads|books|library|unknown)$/i.test(series))continue;for(const row of rows)out.set(row.id,{title:series+' '+row.number,series,seriesNumber:row.number});}
 return out;
}
