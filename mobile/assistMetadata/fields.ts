import type {WorkFields} from '../scannerVNext/fieldEvidence';
export const METADATA_FIELDS=['title','author','series','seriesNumber','isbn','asin','language','genre','coverUri','description','publisher','narrator','publishedYear'] as const;
export function validatedFields(value:unknown):WorkFields{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid metadata fields');
 const out:WorkFields={};
 for(const [key,val]of Object.entries(value)){
  if(!(METADATA_FIELDS as readonly string[]).includes(key)||typeof val!=='string'||val.length>(key==='description'?4096:key==='coverUri'?2048:512)||/[\u0000]/.test(val))throw Error('Invalid metadata field');
  out[key as keyof WorkFields]=val.trim();
 }
 return out;
}
