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
 if(!work.identityConfirmed)reasons.push('Add a title and creator, or a comic series, issue and publisher, to help Assist identify this item.');
 // Missing enrichment is an automatic retry state, not a user identification task.
 reasons.push(...staged.filter(x=>!['identity-needs-review','meaningful-genre-required','artwork-not-ready'].includes(x)));
 return [...new Set(reasons.map(x=>messages[x]??x.replace(/-/g,' ')))];
}
