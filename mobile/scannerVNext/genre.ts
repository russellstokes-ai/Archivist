export const TAXONOMY_VERSION='archivist-genre-1';
export const TAXONOMY=[
 ['fantasy','Fantasy'],['science-fiction','Science Fiction'],['historical-fiction','Historical Fiction'],['crime-mystery','Crime/Mystery'],['thriller-suspense','Thriller/Suspense'],['horror','Horror'],['romance','Romance'],['literary-fiction','Literary Fiction'],['children-ya',"Children's/YA"],['biography-memoir','Biography/Memoir'],['history','History'],['politics-current-affairs','Politics & Current Affairs'],['science-nature','Science & Nature'],['business-economics','Business & Economics'],['technology','Technology'],['health-wellbeing','Health & Wellbeing'],['personal-development','Personal Development'],['philosophy-religion','Philosophy/Religion'],['travel-adventure','Travel & Adventure'],['sports','Sports'],['arts-culture','Arts & Culture'],['humour-comedy','Humour/Comedy'],['educational-reference','Educational/Reference']
].map(([id,label])=>({id,label}));
export type GenreEvidence={value:string;source:'manual'|'embedded'|'sidecar'|'provider';recordId?:string};
export type GenreDecision={version:string;state:'confirmed'|'unresolved';id?:string;label?:string;manual:boolean;evidence:GenreEvidence[];suggestions:string[];unmatched:string[]};
const clean=(value:string)=>value.normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
// Audited aliases name content categories, never containers, codecs or abbreviations.
const aliases:Record<string,string>={
 'space opera':'science-fiction','military science fiction':'science-fiction','science fiction military':'science-fiction','sci fi':'science-fiction','cyberpunk':'science-fiction','dystopian science fiction':'science-fiction',
 'dark fantasy':'fantasy','epic fantasy':'fantasy','urban fantasy':'fantasy','high fantasy':'fantasy','fantasy epic':'fantasy',
 'detective fiction':'crime-mystery','mystery':'crime-mystery','crime':'crime-mystery','thriller':'thriller-suspense','suspense':'thriller-suspense',
 'gothic horror':'horror','supernatural horror':'horror','historical romance':'romance','young adult':'children-ya','childrens fiction':'children-ya','juvenile fiction':'children-ya',
 'biography':'biography-memoir','memoir':'biography-memoir','autobiography':'biography-memoir','military history':'history','world history':'history',
 'politics':'politics-current-affairs','current affairs':'politics-current-affairs','science':'science-nature','nature':'science-nature','business':'business-economics','economics':'business-economics',
 'computing':'technology','computer science':'technology','health':'health-wellbeing','wellbeing':'health-wellbeing','self help':'personal-development',
 'philosophy':'philosophy-religion','religion':'philosophy-religion','travel':'travel-adventure','adventure':'travel-adventure','sport':'sports','art':'arts-culture','music':'arts-culture','humor':'humour-comedy','humour':'humour-comedy','comedy':'humour-comedy','education':'educational-reference','reference':'educational-reference'
};
for(const item of TAXONOMY){aliases[clean(item.id)]=item.id;aliases[clean(item.label)]=item.id;}
export function normalizeGenre(evidence:GenreEvidence[]):GenreDecision{
 if(evidence.length>128||evidence.some(x=>typeof x.value!=='string'||x.value.length>4096||!['manual','embedded','sidecar','provider'].includes(x.source)))throw new Error('Genre evidence budget');
 const manual=evidence.filter(x=>x.source==='manual');const active=manual.length?manual:evidence;
 const ids=new Set<string>(),unmatched:string[]=[];
 for(const item of active){const key=clean(item.value);let id=aliases[key];
  // Hierarchical provider labels may start with generic Fiction/Nonfiction.
  if(!id){const segments=item.value.split(/\s*[/>;]\s*/).filter(Boolean).map(clean).filter(x=>x!=='fiction'&&x!=='nonfiction');const mapped=new Set(segments.map(x=>aliases[x]).filter(Boolean));if(mapped.size===1)id=[...mapped][0];else for(const match of mapped)ids.add(match);}
  if(id)ids.add(id);else if(item.value.trim())unmatched.push(item.value);
 }
 const result:GenreDecision={version:TAXONOMY_VERSION,state:'unresolved',manual:manual.length>0,evidence:evidence.map(x=>({...x})),suggestions:[...ids].slice(0,5),unmatched};
 if(ids.size===1){result.state='confirmed';result.id=[...ids][0];result.label=TAXONOMY.find(x=>x.id===result.id)!.label;}return result;
}
export function meaningfulGenre(value:GenreDecision){return value.version===TAXONOMY_VERSION&&value.state==='confirmed'&&TAXONOMY.some(x=>x.id===value.id&&x.label===value.label)&&value.evidence.length>0;}
