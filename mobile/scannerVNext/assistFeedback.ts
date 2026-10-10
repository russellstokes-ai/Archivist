import type {AssistState} from './assist';
export function assistFeedback(state:AssistState):string{
 switch(state.state){
  case 'pending':return 'Looking for this book…';
  case 'error':return state.result?.issues.some(issue=>issue.endsWith(':unconfigured'))?'A search provider needs setup. Enable Open Library or configure Google Books in Metadata settings.':'Search could not finish. Check your connection, then tap Assist to retry.';
  case 'offline':return 'Online metadata is switched off. Enable it in Metadata settings to use Assist.';
  case 'disabled':return 'Enable a book search provider in Metadata settings to use Assist.';
  case 'needs-clues':return 'Add a title or author, save, then tap Assist.';
  case 'no-match':return 'No close match found. Check the title or author, save, then retry Assist.';
  case 'accepted':return 'Match applied. Available details and cover have been filled in.';
  case 'cancelled':case 'stale':return 'Search stopped because the details changed. Save, then retry Assist.';
  default:return state.result?.candidates.length?'Choose the matching book below.':'No matching book returned. Check the title or author and retry.';
 }
}
