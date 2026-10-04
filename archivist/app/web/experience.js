// APK-parity browser surfaces. Heavy rendering remains client-side so the Pi stays a quiet media/database server.
function experienceWorkRow(work){
  const button=workCard(work);button.classList.add('experience-book');return button;
}
function fillExperienceRow(id,items,empty){
  const box=$(id);if(!box)return;box.replaceChildren();
  if(!items.length){const state=element('p',empty);state.className='experience-empty';box.append(state);return}
  for(const work of items.slice(0,8))box.append(experienceWorkRow(work));
}
async function loadShelfExperience(){
  const [continuing,works]=await Promise.all([api('./api/continue'),api('./api/works?limit=200&offset=0')]);
  fillExperienceRow('shelf-continue',continuing,'Nothing in progress yet.');
  fillExperienceRow('shelf-favourites',works.filter(work=>work.favourite),'Favourite a book and it will appear here.');
  const next=works.filter(work=>work.state==='not-started'&&work.available).sort((a,b)=>(b.rating||0)-(a.rating||0)||String(a.title).localeCompare(String(b.title)));
  fillExperienceRow('shelf-next',next,'Add more books to build your next-up shelf.');
  const series=new Map();
  for(const work of works){if(!work.series)continue;if(!series.has(work.series))series.set(work.series,[]);series.get(work.series).push(work)}
  const groups=[...series.entries()].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0])).slice(0,4);
  const seriesBox=$('shelf-series');seriesBox.replaceChildren();
  if(!groups.length){seriesBox.append(element('p','Series will appear here as metadata is discovered.'));return}
  for(const [name,items] of groups){
    const block=element('section');block.className='series-block';
    const heading=element('div');heading.className='section-heading';heading.append(element('h3',name),element('span',items.length+' works'));block.append(heading);
    const row=element('div');row.className='experience-row';for(const work of items.slice(0,6))row.append(experienceWorkRow(work));block.append(row);seriesBox.append(block);
  }
}
function formatDuration(seconds){
  const minutes=Math.round(Math.max(0,seconds||0)/60);
  if(minutes<60)return minutes+' min';
  const h=Math.floor(minutes/60),m=minutes%60;return h+'h '+(m?m+'m':'');
}
async function loadInsightsExperience(){
  const [activity,works,summary]=await Promise.all([api('./api/activity?limit=200'),api('./api/works?limit=200&offset=0'),api('./api/library-summary')]);
  const seconds=activity.reduce((sum,item)=>sum+Math.max(0,Number(item.activeSeconds||0)),0);
  const finished=works.filter(work=>work.state==='finished').length;
  const activeDays=new Set(activity.map(item=>new Date(Number(item.updatedAt||0)*1000).toISOString().slice(0,10))).size;
  const ratings=works.map(work=>Number(work.rating||0)).filter(Boolean);
  const avgRating=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length/2).toFixed(1):'—';
  const metrics=$('insights-metrics');metrics.replaceChildren();
  for(const [label,value,copy] of [
    ['Finished',String(finished),'Works completed'],
    ['Reading time',formatDuration(seconds),'Recorded reading + listening'],
    ['Active days',String(activeDays),'Days with recorded activity'],
    ['Average rating',avgRating==='—'?avgRating:avgRating+'★','Across rated works'],
  ]){
    const card=element('article');card.className='insight-metric';card.append(element('strong',value),element('span',label),element('small',copy));metrics.append(card);
  }
  const formats=$('insights-formats');formats.replaceChildren();
  const total=Math.max(1,Number(summary.total||0));
  for(const item of (summary.formats||[])){
    const row=element('div');row.className='insight-bar-row';row.append(element('span',item.name));
    const track=element('div');track.className='insight-bar';const fill=element('i');fill.style.width=Math.max(3,Math.round(item.count/total*100))+'%';track.append(fill);
    row.append(track,element('strong',String(item.count)));formats.append(row);
  }
  const recent=$('insights-recent');recent.replaceChildren();
  if(!activity.length)recent.append(element('p','Reading and listening activity will appear here.'));
  for(const item of activity.slice(0,10)){
    const row=element('article');row.className='activity-row';
    row.append(element('strong',item.title),element('span',[item.kind,item.author,formatDuration(item.activeSeconds)].filter(Boolean).join(' · ')),element('small',new Date(item.updatedAt*1000).toLocaleString()));
    recent.append(row);
  }
  const highlights=$('insights-highlights');highlights.replaceChildren();
  const authorCounts=new Map();for(const work of works){if(work.author)authorCounts.set(work.author,(authorCounts.get(work.author)||0)+1)}
  const topAuthor=[...authorCounts.entries()].sort((a,b)=>b[1]-a[1])[0];
  const favouriteCount=works.filter(work=>work.favourite).length;
  const inProgress=works.filter(work=>work.state==='in-progress').length;
  for(const [label,value] of [['Most collected author',topAuthor?topAuthor[0]:'—'],['Favourites',String(favouriteCount)],['In progress',String(inProgress)],['Library',String(summary.total||0)+' works']]){
    const row=element('div');row.className='highlight-row';row.append(element('span',label),element('strong',value));highlights.append(row);
  }
}
window.loadShelfExperience=loadShelfExperience;
window.loadInsightsExperience=loadInsightsExperience;
