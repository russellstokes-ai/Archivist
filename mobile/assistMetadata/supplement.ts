import type {Candidate} from '../scannerVNext/search';
import {canonicalText} from './core';
/** Fill gaps only; edition-specific facts require a shared ISBN/ASIN. */
export function supplementCandidate(chosen:Candidate,peers:Candidate[]):Candidate{
 const fields:Record<string,string|undefined>={...chosen.fields};
 const ids=(c:Candidate)=>[...c.identifiers,c.fields.isbn,c.fields.asin].filter(Boolean).map(s=>String(s).replace(/[-\s]/g,'').toUpperCase());
 const own=ids(chosen);
 const matching=peers.filter(c=>c!==chosen&&!c.anthology&&((own.length&&ids(c).some(id=>own.includes(id)))||
  !!fields.author&&canonicalText(c.fields.title)===canonicalText(fields.title)&&canonicalText(c.fields.author)===canonicalText(fields.author)));
 for(const key of ['genre','coverUrl','publishedYear','description','publisher','language','subtitle','publicationDate','pageCount','durationSeconds','narrator'] as const){
  if(fields[key])continue;
  const values=new Set(matching.filter(c=>key==='genre'||own.length&&ids(c).some(id=>own.includes(id))).map(c=>(c.fields as Record<string,string|undefined>)[key]).filter((v):v is string=>!!v));
  if(values.size===1)fields[key]=[...values][0];
 }
 return {...chosen,fields};
}
