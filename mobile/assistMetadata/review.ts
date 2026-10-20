import type {MetadataWork} from '../scannerVNext/fieldEvidence';
import {hasGenre} from './genres';
const scanMetadata=new Set(['meaningful-genre-required','path-only-grouping-provisional','insufficient-grouping-evidence','edition-and-identity-review-required']);
const messages:Record<string,string>={
 'duplicate-part-number':'Multiple files share a part number. Check the chapter/file order before publishing.',
 'manual-edition-unresolved':'Check which edition these files belong to.',
 'source-discovery-incomplete':'The folder scan was incomplete. Reconnect the folder and scan again.',
 'source-parts-missing':'Some source files are missing. Reconnect the folder and check its contents.',
 'overlapping-group-needs-review':'These files overlap another library entry. Check the editions.',
 'artwork-not-ready':'The cover has not been saved locally yet.',
 'no-source-parts':'No source files are attached to this book.',
};
export function currentReview(work:MetadataWork,issues:string[]=[],staged:string[]=[]):string[]{
 const reasons=issues.filter(x=>!scanMetadata.has(x));
 if(!work.identityConfirmed)reasons.push('Confirm the book or comic details to approve this book’s identity and folder grouping.');
 if(!hasGenre(work.fields.genre))reasons.push(work.fields.genre?'Choose a recognised genre, such as Science Fiction, History or Humour/Comedy. The current label is not recognised.':'Assist has not found a reliable genre yet.');
 reasons.push(...staged.filter(x=>!['identity-needs-review','meaningful-genre-required'].includes(x)));
 return [...new Set(reasons.map(x=>messages[x]??x.replace(/-/g,' ')))];
}
