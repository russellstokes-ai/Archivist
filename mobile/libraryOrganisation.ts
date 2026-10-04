import {LibrarySource} from './librarySources';

export type SmartShelfField='source'|'format'|'author'|'series'|'genre'|'space'|'readingState'|'rating'|'favourite'|'available';
export type SmartShelfOperator='equals'|'not-equals'|'contains'|'at-least'|'is-true'|'is-false';
export type SmartShelfRule={kind:'rule';field:SmartShelfField;operator:SmartShelfOperator;value:string};
export type SmartShelfRuleGroup={kind:'group';mode:'all'|'any';children:Array<SmartShelfRule|SmartShelfRuleGroup>};

export type SmartShelfDefinition = {
  id: string;
  name: string;
  source: LibrarySource;
  format: string;
  author: string;
  series: string;
  genre: string;
  space: string;
  readingState: '' | 'not-started' | 'in-progress' | 'finished';
  minimumRating: number;
  favouriteOnly: boolean;
  availableOnly: boolean;
  sort: 'title' | 'author' | 'series' | 'format' | 'progress' | 'rating';
  rules?: SmartShelfRuleGroup;
  createdAt: string;
};

export type LibraryCollection = {
  id: string;
  name: string;
  canonicalKeys: string[];
  createdAt: string;
};

type OrganisableWork = {
  source: 'local' | 'server' | 'downloaded';
  canonicalKey: string;
  title: string;
  author: string;
  series: string;
  genre: string;
  format: string;
  space: string;
  available: boolean;
  readingState: '' | 'not-started' | 'in-progress' | 'finished';
  rating: number;
  favourite: boolean;
};

const fields:SmartShelfField[]=['source','format','author','series','genre','space','readingState','rating','favourite','available'];
const operators:SmartShelfOperator[]=['equals','not-equals','contains','at-least','is-true','is-false'];

export function newOrganisationId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptySmartShelfRules(mode:'all'|'any'='all'):SmartShelfRuleGroup {
  return {kind:'group',mode,children:[]};
}

export function smartShelfRule(field:SmartShelfField='genre',operator:SmartShelfOperator='equals',value=''):SmartShelfRule {
  return {kind:'rule',field,operator,value};
}

export type SmartShelfPreset = {
  id:'currently-reading'|'not-started'|'favourites'|'highly-rated'|'downloaded';
  label:string;
  description:string;
  sort:SmartShelfDefinition['sort'];
  rules:SmartShelfRuleGroup;
};

export function smartShelfPresets():SmartShelfPreset[] {
  return [
    {id:'currently-reading',label:'Currently reading',description:'Works you have already started.',sort:'progress',rules:{kind:'group',mode:'all',children:[smartShelfRule('readingState','equals','in-progress')]}},
    {id:'not-started',label:'Not started',description:'Unread and unplayed works ready for later.',sort:'title',rules:{kind:'group',mode:'all',children:[smartShelfRule('readingState','equals','not-started')]}},
    {id:'favourites',label:'Favourites',description:'Everything you have marked as a favourite.',sort:'rating',rules:{kind:'group',mode:'all',children:[smartShelfRule('favourite','is-true','')]}},
    {id:'highly-rated',label:'Highly rated',description:'Works rated 8 or above.',sort:'rating',rules:{kind:'group',mode:'all',children:[smartShelfRule('rating','at-least','8')]}},
    {id:'downloaded',label:'Available offline',description:'Server works saved on this device.',sort:'title',rules:{kind:'group',mode:'all',children:[smartShelfRule('source','equals','downloaded')]}},
  ];
}

function sanitizeRule(raw:any,depth=0):SmartShelfRule|SmartShelfRuleGroup|null {
  if(!raw||typeof raw!=='object'||depth>4)return null;
  if(raw.kind==='group'){
    const children=Array.isArray(raw.children)?raw.children.slice(0,30).map((item:any)=>sanitizeRule(item,depth+1)).filter(Boolean) as Array<SmartShelfRule|SmartShelfRuleGroup>:[];
    return {kind:'group',mode:raw.mode==='any'?'any':'all',children};
  }
  if(raw.kind==='rule'&&fields.includes(raw.field)){
    const operator:SmartShelfOperator=operators.includes(raw.operator)?raw.operator:'equals';
    return {kind:'rule',field:raw.field,operator,value:String(raw.value??'').slice(0,500)};
  }
  return null;
}

export function sanitizeRuleGroup(raw:unknown):SmartShelfRuleGroup|undefined {
  const rule=sanitizeRule(raw);
  return rule?.kind==='group'?rule:undefined;
}

export function legacyRules(shelf:Pick<SmartShelfDefinition,'source'|'format'|'author'|'series'|'genre'|'space'|'readingState'|'minimumRating'|'favouriteOnly'|'availableOnly'>,mode:'all'|'any'='all'):SmartShelfRuleGroup {
  const children:SmartShelfRule[]=[];
  if(shelf.source!=='all')children.push(smartShelfRule('source','equals',shelf.source));
  if(shelf.format)children.push(smartShelfRule('format','equals',shelf.format));
  if(shelf.author)children.push(smartShelfRule('author','equals',shelf.author));
  if(shelf.series)children.push(smartShelfRule('series','equals',shelf.series));
  if(shelf.genre)children.push(smartShelfRule('genre','equals',shelf.genre));
  if(shelf.space)children.push(smartShelfRule('space','equals',shelf.space));
  if(shelf.readingState)children.push(smartShelfRule('readingState','equals',shelf.readingState));
  if(shelf.minimumRating>0)children.push(smartShelfRule('rating','at-least',String(shelf.minimumRating)));
  if(shelf.favouriteOnly)children.push(smartShelfRule('favourite','is-true',''));
  if(shelf.availableOnly)children.push(smartShelfRule('available','is-true',''));
  return {kind:'group',mode,children};
}

export function sanitizeSmartShelves(value: unknown): SmartShelfDefinition[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw: any) => {
    if (!raw || typeof raw !== 'object' || !String(raw.id || '').trim() || !String(raw.name || '').trim()) return [];
    const source: LibrarySource = ['all', 'local', 'server', 'downloaded'].includes(raw.source) ? raw.source : 'all';
    const sort: SmartShelfDefinition['sort'] = ['title', 'author', 'series', 'format', 'progress', 'rating'].includes(raw.sort) ? raw.sort : 'title';
    return [{
      id: String(raw.id), name: String(raw.name).trim(), source,
      format: String(raw.format || ''), author: String(raw.author || ''), series: String(raw.series || ''),
      genre: String(raw.genre || ''), space: String(raw.space || ''), readingState: ['not-started','in-progress','finished'].includes(raw.readingState) ? raw.readingState : '',
      minimumRating: Math.max(0, Math.min(10, Number(raw.minimumRating) || 0)),
      favouriteOnly: !!raw.favouriteOnly, availableOnly: !!raw.availableOnly, sort,
      rules:sanitizeRuleGroup(raw.rules),
      createdAt: String(raw.createdAt || new Date(0).toISOString()),
    }];
  });
}

export function sanitizeCollections(value: unknown): LibraryCollection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw: any) => {
    if (!raw || typeof raw !== 'object' || !String(raw.id || '').trim() || !String(raw.name || '').trim()) return [];
    const canonicalKeys:string[] = Array.isArray(raw.canonicalKeys) ? raw.canonicalKeys.map((item:unknown)=>String(item)).filter((item:string)=>!!item) : [];
    return [{
      id: String(raw.id), name: String(raw.name).trim(),
      canonicalKeys: [...new Set<string>(canonicalKeys)],
      createdAt: String(raw.createdAt || new Date(0).toISOString()),
    }];
  });
}

function textValue(work:OrganisableWork,field:SmartShelfField):string {
  if(field==='rating')return String(work.rating);
  if(field==='favourite')return String(work.favourite);
  if(field==='available')return String(work.available);
  return String(work[field]??'');
}

export function ruleMatches(work:OrganisableWork,rule:SmartShelfRule):boolean {
  const actual=textValue(work,rule.field);
  const expected=rule.value.trim();
  switch(rule.operator){
    case 'equals': return actual.localeCompare(expected,undefined,{sensitivity:'accent'})===0;
    case 'not-equals': return actual.localeCompare(expected,undefined,{sensitivity:'accent'})!==0;
    case 'contains': return actual.toLocaleLowerCase().includes(expected.toLocaleLowerCase());
    case 'at-least': return Number(actual)>=Number(expected||0);
    case 'is-true': return actual==='true';
    case 'is-false': return actual==='false';
  }
}

export function groupMatches(work:OrganisableWork,group:SmartShelfRuleGroup):boolean {
  if(!group.children.length)return true;
  const results=group.children.map(child=>child.kind==='group'?groupMatches(work,child):ruleMatches(work,child));
  return group.mode==='all'?results.every(Boolean):results.some(Boolean);
}

function getGroup(root:SmartShelfRuleGroup,path:number[]):SmartShelfRuleGroup|null {
  let current=root;
  for(const index of path){
    const child=current.children[index];
    if(!child||child.kind!=='group')return null;
    current=child;
  }
  return current;
}
function cloneGroup(group:SmartShelfRuleGroup):SmartShelfRuleGroup {
  return {kind:'group',mode:group.mode,children:group.children.map(child=>child.kind==='group'?cloneGroup(child):{...child})};
}
export function updateGroupAtPath(root:SmartShelfRuleGroup,path:number[],fn:(group:SmartShelfRuleGroup)=>void){
  const next=cloneGroup(root),group=getGroup(next,path);if(group)fn(group);return next;
}
export function addRuleAtPath(root:SmartShelfRuleGroup,path:number[],rule:SmartShelfRule=smartShelfRule()){
  return updateGroupAtPath(root,path,group=>{if(group.children.length<30)group.children.push(rule)});
}
export function addGroupAtPath(root:SmartShelfRuleGroup,path:number[]){
  return updateGroupAtPath(root,path,group=>{if(group.children.length<30)group.children.push(emptySmartShelfRules('all'))});
}
export function removeRuleNode(root:SmartShelfRuleGroup,path:number[]){
  if(!path.length)return root;
  const parent=path.slice(0,-1),index=path[path.length-1];
  return updateGroupAtPath(root,parent,group=>group.children.splice(index,1));
}
export function replaceRuleNode(root:SmartShelfRuleGroup,path:number[],node:SmartShelfRule|SmartShelfRuleGroup){
  if(!path.length)return node.kind==='group'?node:root;
  const parent=path.slice(0,-1),index=path[path.length-1];
  return updateGroupAtPath(root,parent,group=>{if(index>=0&&index<group.children.length)group.children[index]=node});
}

export function applySmartShelf<T extends OrganisableWork>(items: T[], shelf: SmartShelfDefinition): T[] {
  const ruleGroup=shelf.rules&&shelf.rules.children.length?shelf.rules:legacyRules(shelf);
  const filtered = items.filter(work => groupMatches(work,ruleGroup));
  return filtered.slice().sort((a, b) => {
    if (shelf.sort === 'rating') return b.rating - a.rating || a.title.localeCompare(b.title);
    if (shelf.sort === 'author') return (a.author || '').localeCompare(b.author || '') || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  });
}

export function collectionWorks<T extends {canonicalKey: string}>(items: T[], collection: LibraryCollection) {
  const wanted = new Set(collection.canonicalKeys);
  return items.filter(item => wanted.has(item.canonicalKey));
}

export function toggleCollectionWork(collection: LibraryCollection, canonicalKey: string): LibraryCollection {
  const keys = new Set(collection.canonicalKeys);
  if (keys.has(canonicalKey)) keys.delete(canonicalKey); else keys.add(canonicalKey);
  return {...collection, canonicalKeys: [...keys]};
}
