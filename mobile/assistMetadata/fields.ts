import type {WorkFields} from '../scannerVNext/fieldEvidence';
export const METADATA_FIELDS=['title','author','series','seriesNumber','isbn','asin','language','genre','coverUri','description','publisher','narrator','publishedYear','subtitle','publicationDate','pageCount','durationSeconds'] as const;
export function validatedFields(value:unknown):WorkFields{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid metadata fields');
 const out:WorkFields={};
 for(const [key,val]of Object.entries(value)){
  if(!(METADATA_FIELDS as readonly string[]).includes(key)||typeof val!=='string'||val.length>(key==='description'?4096:key==='coverUri'?2048:512)||/[\u0000]/.test(val))throw Error('Invalid metadata field');
  const value=val.trim();
  if(value&&['pageCount','durationSeconds'].includes(key)&&(!/^\d+(?:\.\d+)?$/.test(value)||!Number.isFinite(Number(value))||Number(value)<=0||Number(value)>1e9||key==='pageCount'&&!Number.isInteger(Number(value))))throw Error('Invalid metadata quantity');
  out[key as keyof WorkFields]=value;
 }
 return out;
}
