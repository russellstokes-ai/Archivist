import {TAXONOMY,normalizeGenre} from './genre';
// Stable taxonomy IDs and stored labels preserve existing Atlas data.
const labels:Record<string,string>={'science-fiction':'Sci-Fi','crime-mystery':'Crime & Mystery','thriller-suspense':'Thrillers & Suspense','children-ya':'Children & Young Adult','biography-memoir':'Biography & Memoir','philosophy-religion':'Philosophy & Religion','humour-comedy':'Humour & Comedy','educational-reference':'Education & Reference'};
export const GENRE_CHOICES=TAXONOMY.map(genre=>({...genre,value:genre.label,label:labels[genre.id]??genre.label}));
export function genreChoiceLabel(value:string){const genre=normalizeGenre(value?[{value,source:'manual'}]:[]);return GENRE_CHOICES.find(option=>option.id===genre.id)?.label??'Choose genre';}
