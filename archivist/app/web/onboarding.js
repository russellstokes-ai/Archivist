// Derive guidance from server state so refreshes and other browsers resume safely.
function importGuidance(owner,sources,jobs,summary){
  if(!owner)return null;
  if(!sources.length)return {action:'folder',title:'Add your first library',detail:'Choose a folder on this server. Your original files stay unchanged.',label:'Choose folder'};
  const latest=new Map();
  for(const job of jobs){if(!latest.has(Number(job.source_id)))latest.set(Number(job.source_id),job)}
  const relevant=sources.map(source=>latest.get(Number(source.id))).filter(Boolean);
  const active=relevant.find(job=>['queued','running','cancelling','committing'].includes(job.state));
  if(active)return {action:'wait',title:'Importing your library',detail:(active.message||'Reading book details…')+' You can close this page; import continues on the server.',label:'View import',job:active};
  const failed=relevant.find(job=>['failed','cancelled'].includes(job.state));
  if(failed)return {action:'retry',title:'An import needs attention',detail:failed.message||'Check the folder connection, then retry.',label:'Check import'};
  if(Number(summary.reviewWorks)>0)return {action:'review',title:summary.reviewWorks+' books ready for review',detail:'Check identification and grouping in Assist, then publish to your Shelf. Original files stay unchanged.',label:'Review books'};
  if(Number(summary.total)>0)return null;
  if(sources.some(source=>!latest.has(Number(source.id))))return {action:'scan',title:'Ready to import',detail:'Start a scan beside your folder. Archivist reads local details first; online suggestions are optional.',label:'Start import'};
  return {action:'empty',title:'No books found in this import',detail:'Check that the selected folder contains supported book, comic or audiobook files.',label:'Check folders'};
}
