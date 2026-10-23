import type {WorkFields} from '../scannerVNext/fieldEvidence';
type Field=keyof WorkFields;
const audio:Field[]=['title','author','genre','publishedYear'];
const comic:Field[]=['title','author','description','publisher','language','genre','series','seriesNumber','publishedYear'];
/** Only fields actually written and verified by the current format writers. */
export const writableFields:Record<string,readonly Field[]>={
 mp3:[...audio,'publisher'],aac:[...audio,'publisher'],m4a:[...audio,'description'],m4b:[...audio,'description'],
 flac:audio,ogg:audio,opus:audio,wav:audio,wma:audio,
 epub:['title','author','description','publisher','language','genre','publishedYear'],
 pdf:['title','author','genre','publishedYear','publisher','series','seriesNumber','isbn','description'],
 cbz:comic,zip:comic,cbr:comic,cbt:comic,
};
export function fileMetadataFields(path:string){return writableFields[path.toLowerCase().split('.').pop()||'']??[];}
