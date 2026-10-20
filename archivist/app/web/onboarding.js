// Derived from server state: safe across refreshes, browsers and interrupted scans.
function importGuidance(owner,sources,jobs,summary){
 if(!owner)return null;
 if(!sources.length)return {step:1,action:'folder',title:'Bring your library home',detail:'Choose a folder of books, comics or audiobooks. Archivist leaves your files where they are.',label:'Choose folder'};
 const latest=new Map();
 for(const job of jobs){if(!latest.has(Number(job.source_id)))latest.set(Number(job.source_id),job)}
 const relevant=sources.map(source=>latest.get(Number(source.id))).filter(Boolean);
 const active=relevant.find(job=>['queued','running','cancelling','committing'].includes(job.state));
 const failed=relevant.find(job=>['failed','cancelled'].includes(job.state));
 const total=Number(summary.total)||0;
 if(total>0)return {step:3,action:'library',title:total.toLocaleString('en-GB')+' books in your library',detail:active?'Another folder is still importing. Start reading now; discovery continues on the server.':failed?'Your existing library is available. Check the folder connection in Settings to finish the latest import.':'Start reading or listening. Missing details can improve in the background; nothing needs approving first.',label:'Open library'};
 if(active)return {step:2,action:'wait',title:'Finding your books',detail:'Reading your folders and local book details. You can leave this page; discovery continues on the server.',label:'View progress',job:active};
 if(failed)return {step:2,action:'retry',title:'Let’s check your folder',detail:'The import could not finish. Check that the folder is connected and readable, then try again.',label:'Check folder'};
 if(sources.some(source=>!latest.has(Number(source.id))))return {step:2,action:'scan',title:'Your folder is ready',detail:'Start discovery to find books, comics and audiobooks inside it.',label:'Start discovery'};
 return {step:2,action:'empty',title:'No supported books found yet',detail:'Check the folder path and file types. The scan report explains what was found and skipped.',label:'Check folders'};
}
