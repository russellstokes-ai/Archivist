import type {Candidate} from '../scannerVNext/search';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
import {canonicalText,rankAssistCandidates} from './core';
export type DeepProof={text:string;coverHash?:string;sourceKey?:string;fields:WorkFields;covers:Record<string,number>};
function validISBN(s:string){return /^97[89]\d{10}$/.test(s)?[...s].reduce((n,c,i)=>n+Number(c)*(i%2?3:1),0)%10===0:/^\d{9}[\dX]$/.test(s)&&[...s].reduce((n,c,i)=>n+(c==='X'?10:Number(c))*(10-i),0)%11===0;}
/** Explicit labels only. OCR text is a search clue, never authoritative metadata. */
export function textEvidence(raw:string):WorkFields{
 const text=raw.slice(0,16384).normalize('NFKC'),fields:WorkFields={},ids=new Set<string>();
 for(const m of text.matchAll(/\bISBN(?:[- ]1[03])?\s*:?\s*((?:[\dXx][ -]*){10,13})/g)){const id=m[1].replace(/[ -]/g,'').toUpperCase();if(validISBN(id))ids.add(id);}
 if(ids.size===1)fields.isbn=[...ids][0];
 for(const [label,key]of [['Title','title'],['Author|Written by','author'],['Series','series'],['Publisher|Published by','publisher'],['Issue|Number','seriesNumber']] as const){
  const matches=[...text.matchAll(new RegExp('(?:^|\\n)\\s*(?:'+label+')\\s*:\\s*([^\\n]{2,200})','gi'))].map(m=>m[1].trim());
  if(matches.length&&new Set(matches.map(canonicalText)).size===1)fields[key]=matches[0];
 }
 const years=new Set([...text.matchAll(/(?:copyright|©)\s*(?:\([cC]\)\s*)?((?:18|19|20)\d{2})/gi)].map(m=>m[1]));if(years.size===1)fields.publishedYear=[...years][0];
 return fields;
}
export function coverDistance(a:string,b:string):number|null{
 if(!/^[a-f0-9]{16}$/.test(a)||!/^[a-f0-9]{16}$/.test(b))return null;
 let count=0;for(let i=0;i<16;i++){let bits=parseInt(a[i],16)^parseInt(b[i],16);while(bits){count+=bits&1;bits>>=1;}}return count;
}
const appears=(text:string,value?:string)=>!!value&&canonicalText(value).length>=5&&canonicalText(text).includes(canonicalText(value));
export function selectDeepCandidate(independent:WorkFields,candidates:Candidate[],proof:DeepProof):Candidate|null{
 if(!proof||typeof proof.text!=='string'||proof.text.length>16384||!proof.fields||!proof.covers)return null;
 const eligible=candidates.filter(c=>{
  if(c.relatedMatch||c.anthology||rankAssistCandidates(independent,[c])[0].conflicts.length)return false;
  const id=proof.fields.isbn,exact=!!id&&[...c.identifiers,c.fields.isbn].some(v=>v?.replace(/[ -]/g,'').toUpperCase()===id);
  // ISBN must be independently supported by title printed on the page.
  if(exact&&appears(proof.text,c.fields.title))return true;
  const distance=proof.covers[c.provider+'|'+c.id];if(!Number.isInteger(distance)||distance<0||distance>4)return false;
  // Visual agreement needs the existing filename/embedded title AND a separate
  // creator/publisher printed in the file. Never identify from the cover alone.
  const title=!!independent.title&&canonicalText(independent.title)===canonicalText(c.fields.title)&&appears(proof.text,c.fields.title);
  const series=!!independent.series&&canonicalText(independent.series)===canonicalText(c.fields.series)&&!!independent.seriesNumber&&independent.seriesNumber===c.fields.seriesNumber;
  return (title||series)&&(appears(proof.text,c.fields.author)||appears(proof.text,c.fields.publisher));
 });
 const unique=new Map(eligible.map(c=>[c.provider+'|'+c.id,c]));return unique.size===1?[...unique.values()][0]:null;
}
