/**
 * Primary genre taxonomy used by provider enrichment and Atlas.
 * Provider subject lists mix genre, audience, geography, topics and cataloguing
 * metadata; never promote an arbitrary subject to a primary genre.
 *
 * Specific genre families outrank broad Fiction/Non-fiction and age bands.
 * An unresolved genre remains empty rather than being guessed.
 */
type GenreRule={genre:string;score:number;match:(text:string)=>boolean};
const contains=(text:string,term:string)=>(' '+text+' ').includes(' '+term+' ');
const genreRules:GenreRule[]=[
  {genre:'Science Fiction',score:100,match:t=>/\b(science fiction|sci fi|scifi|space opera|cyberpunk|dystopi\w*|hard science fiction|speculative science fiction)\b/.test(t)},
  {genre:'Historical Fiction',score:98,match:t=>/\bhistorical fiction\b/.test(t)||(/\bfiction historical\b/.test(t)&&!/\bmystery\b/.test(t))},
  {genre:'Fantasy',score:95,match:t=>/\b(fantasy|high fantasy|epic fantasy|urban fantasy|sword and sorcery)\b/.test(t)},
  {genre:'Graphic Novels',score:94,match:t=>/\b(graphic novels?|comics?|manga|superhero comics?)\b/.test(t)},
  {genre:'Memoir',score:93,match:t=>/\b(memoirs?|personal memoirs?|autobiograph\w*)\b/.test(t)},
  {genre:'Mystery',score:91,match:t=>/\b(myster(y|ies)|detective fiction|whodunnit)\b/.test(t)},
  {genre:'Thriller',score:90,match:t=>/\b(thrillers?|suspense fiction)\b/.test(t)},
  {genre:'Horror',score:89,match:t=>/\b(horror|ghost stories)\b/.test(t)},
  {genre:'Romance',score:88,match:t=>/\b(romance|romantic fiction|love stories)\b/.test(t)},
  {genre:'Crime',score:87,match:t=>/\b(crime fiction|true crime|noir fiction)\b/.test(t)},
  {genre:'Literary Fiction',score:86,match:t=>/\b(literary fiction|literary novels?)\b/.test(t)},
  {genre:'Biography',score:85,match:t=>/\b(biograph\w*|life stories)\b/.test(t)},
  {genre:'Psychology',score:82,match:t=>/\bpsycholog\w*\b/.test(t)},
  {genre:'Philosophy',score:81,match:t=>/\bphilosoph\w*\b/.test(t)},
  {genre:'Economics',score:80,match:t=>/\beconomics?\b/.test(t)},
  {genre:'Finance',score:79,match:t=>/\b(finance|financial planning|personal finance|investing)\b/.test(t)},
  {genre:'Business',score:78,match:t=>/\b(business|management|entrepreneurship)\b/.test(t)},
  {genre:'Technology',score:77,match:t=>/\b(technology|computer science|programming|software engineering)\b/.test(t)},
  {genre:'Science',score:76,match:t=>/^(?:science|natural sciences|popular science)(?:\s|$)/.test(t)||/\b(scientific discoveries|astrophysics|astronomy|biology|chemistry|physics)\b/.test(t)},
  {genre:'History',score:75,match:t=>/^history(?:\s|$)/.test(t)&&!/^history of\b/.test(t)},
  {genre:'Self-help',score:73,match:t=>/\b(self help|personal growth|self improvement)\b/.test(t)},
  {genre:'Poetry',score:72,match:t=>/\b(poetry|poems|verse)\b/.test(t)},
  {genre:'Travel',score:71,match:t=>/\b(travel|travelogues?|travel writing)\b/.test(t)},
  {genre:'Humour',score:70,match:t=>/\b(humour|humor|comedy)\b/.test(t)},
  {genre:'Adventure',score:60,match:t=>/\b(adventure fiction|adventure stories|action adventure)\b/.test(t)},
  {genre:'Classics',score:58,match:t=>/^(?:classics|classic literature|literary classics)$/.test(t)},
  {genre:'Young Adult',score:35,match:t=>/\b(young adult|teen fiction|ya fiction)\b/.test(t)},
  {genre:'Children',score:34,match:t=>/\b(children s literature|children s fiction|juvenile fiction|picture books)\b/.test(t)},
  {genre:'Non-fiction',score:18,match:t=>/^(?:non fiction|nonfiction|non fiction general)$/.test(t)},
  {genre:'Fiction',score:15,match:t=>/^(?:fiction|fiction general|general fiction|novels)$/.test(t)},
];

function normalized(value:unknown){
  return String(value??'').normalize('NFKD').toLowerCase()
    .replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

const scoreFor=(text:string)=>{
  if(!text)return undefined;
  let winning:GenreRule|undefined;
  for(const rule of genreRules)if(rule.match(text)&&(!winning||rule.score>winning.score))winning=rule;
  return winning;
};

export function canonicalPrimaryGenre(value:unknown):string|undefined{
  return scoreFor(normalized(value))?.genre;
}

export function selectPrimaryGenre(subjects:unknown):string|undefined{
  const values=Array.isArray(subjects)?subjects:[subjects];
  let winner:GenreRule|undefined;
  for(const subject of values){
    const current=scoreFor(normalized(subject));
    if(current&&(!winner||current.score>winner.score))winner=current;
  }
  return winner?.genre;
}

export function genreIsSpecific(value:unknown):boolean{
  const genre=canonicalPrimaryGenre(value);
  return !!genre&&!['Fiction','Non-fiction','Young Adult','Children','Classics'].includes(genre);
}
