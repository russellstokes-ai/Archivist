import {test,expect,type Page} from '@playwright/test';

const cover='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII=';

function readyWork(id:number,uri:string,title:string,author:string,format:string,genre:string,series=''){
  return {
    id,uri,title,author,series,genre,format,space:format==='Comic'?'Comics':format==='Audio'?'Audiobooks':'Books',
    available:true,identificationState:'accepted',identificationConfidence:'high',needsReview:false,reviewReason:'',
    metadataSource:'manual',metadataProvenance:{title:'manual',author:'manual',genre:'manual'},
    coverUri:cover,libraryCoverUri:cover,livingBookCoverUri:cover,livingBookCoverSource:'manual',livingBookCoverConfidence:1,
  };
}

const seededStage=[
  readyWork(1,'file:///library/Dune.epub','Dune','Frank Herbert','EPUB','Science Fiction','Dune'),
  readyWork(2,'file:///library/Sandman.cbz','The Sandman','Neil Gaiman','Comic','Fantasy','The Sandman'),
  readyWork(3,'file:///library/Project-Hail-Mary.m4b','Project Hail Mary','Andy Weir','Audio','Science Fiction',''),
  {
    ...readyWork(4,'file:///library/unsorted.epub','Unsorted book','','EPUB','',''),
    identificationState:'unresolved',identificationConfidence:'low',needsReview:true,reviewReason:'Author needs review',
  },
];

async function seed(page:Page){
  await page.addInitScript(({stage})=>{
    localStorage.clear();
    localStorage.setItem('archivist.localStage.web.v1',JSON.stringify(stage));
    localStorage.setItem('archivist.metadata.settings.v1',JSON.stringify({
      onlineEnabled:true,automaticEnrichment:true,applyHighConfidence:true,
      books:{enabled:true,openLibrary:true,googleBooks:false},
      comics:{enabled:true,metron:false},
    }));
    localStorage.setItem('archivist.librarySetupPrepared.v1',JSON.stringify({signature:'e2e-seed',completedAt:'2026-10-08T00:00:00Z'}));
  },{stage:seededStage});
}

async function openLibrary(page:Page){
  await page.goto('/');
  await expect(page.getByRole('tab',{name:'Library'})).toBeVisible({timeout:20_000});
  await page.getByRole('tab',{name:'Library'}).click();
  await expect(page.getByLabel('Search your library')).toBeVisible();
}

test.beforeEach(async({page})=>{
  await seed(page);
  await page.route('https://openlibrary.org/**',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/search.json')){
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        docs:[{
          key:'/works/OL123W',
          title:'Dune Messiah',
          author_name:['Frank Herbert'],
          first_publish_year:1969,
          subject:['Science Fiction'],
          series:['Dune #2'],
          publisher:['Ace'],
          isbn:['9780441172696'],
        }],
      })});
      return;
    }
    if(url.pathname==='/works/OL123W.json'){
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        description:'The second novel in the Dune sequence.',
        subjects:['Science Fiction'],
        series:['Dune #2'],
      })});
      return;
    }
    await route.fulfill({status:404,contentType:'application/json',body:'{}'});
  });
});

test('published Library filters use the real controls and shared predicate',async({page},testInfo)=>{
  await openLibrary(page);
  await expect(page.getByText('Dune',{exact:true})).toBeVisible();
  await expect(page.getByText('The Sandman',{exact:true})).toBeVisible();
  await expect(page.getByText('Project Hail Mary',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'Comic',exact:true}).click();
  await expect(page.getByText('The Sandman',{exact:true})).toBeVisible();
  await expect(page.getByText('Dune',{exact:true})).toHaveCount(0);

  await page.getByRole('button',{name:'All',exact:true}).click();
  await page.getByRole('button',{name:/^Filters/}).click();
  await expect(page.getByText('Filter & sort',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Frank Herbert',exact:true}).click();
  await page.getByRole('button',{name:'Apply',exact:true}).click();
  await expect(page.getByText('Dune',{exact:true})).toBeVisible();
  await expect(page.getByText('The Sandman',{exact:true})).toHaveCount(0);

  await page.getByRole('button',{name:/^Filters/}).click();
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await page.getByRole('button',{name:'Apply',exact:true}).click();
  await expect(page.getByText('The Sandman',{exact:true})).toBeVisible();

  await page.getByLabel('Search your library').fill('Sandman');
  await expect(page.getByText('The Sandman',{exact:true})).toBeVisible();
  await expect(page.getByText('Dune',{exact:true})).toHaveCount(0);
  await page.getByLabel('Search your library').fill('');
  await expect(page.getByText('Dune',{exact:true})).toBeVisible();

  await page.screenshot({path:testInfo.outputPath('library-canonical.png'),fullPage:true});
});

test('Needs Attention save, restore, Smart Search and acceptance use the production workflow',async({page},testInfo)=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:/1 book need review/i})).toBeVisible({timeout:20_000});
  await page.getByRole('button',{name:/1 book need review/i}).click();
  await expect(page.getByRole('button',{name:'Edit details for Unsorted book'})).toBeVisible();
  await page.getByRole('button',{name:'Edit details for Unsorted book'}).click();

  await expect(page.getByLabel('Corrected title')).toBeVisible();
  await page.getByLabel('Corrected title').fill('Dune Messiah');
  await page.getByLabel('Author').fill('Frank Herbert');
  const saveButton=page.getByRole('button',{name:'Save',exact:true});
  const hitLayers=await saveButton.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    return {
      target:{x,y,width:rect.width,height:rect.height},
      hit:document.elementsFromPoint(x,y).slice(0,9).map(node=>{
        const el=node as HTMLElement;
        const r=el.getBoundingClientRect(),style=getComputedStyle(el);
        return {tag:el.tagName,role:el.getAttribute('role'),label:el.getAttribute('aria-label'),
          className:String(el.className||'').slice(0,120),text:(el.textContent||'').trim().slice(0,80),
          parent:el.parentElement?.getAttribute('aria-label')||'',position:style.position,zIndex:style.zIndex,
          pointerEvents:style.pointerEvents,overflow:style.overflow,opacity:style.opacity,
          rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]};
      }),
    };
  });
  console.log('METADATA_EDITOR_SAVE_HIT_TEST',JSON.stringify(hitLayers));
  await saveButton.click();
  await expect(page.getByText(/Search clues saved/)).toBeVisible();
  await page.getByRole('button',{name:'Close',exact:true}).click();

  await page.reload();
  await expect(page.getByRole('button',{name:/1 book need review/i})).toBeVisible({timeout:20_000});
  await page.getByRole('button',{name:/1 book need review/i}).click();
  await page.getByRole('button',{name:'Edit details for Dune Messiah'}).click();
  await expect(page.getByLabel('Corrected title')).toHaveValue('Dune Messiah');
  await expect(page.getByLabel('Author')).toHaveValue('Frank Herbert');

  await page.getByRole('button',{name:'Smart Search',exact:true}).click();
  await expect(page.getByText(/Smart Search found 1 possible match/)).toBeVisible({timeout:15_000});
  await page.getByText('Use this book →',{exact:true}).click();
  await expect(page.getByText(/Details filled\. Review and Save/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Accept & Save',exact:true})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('metadata-editor-candidate.png'),fullPage:true});

  await page.getByRole('button',{name:'Accept & Save',exact:true}).click();
  await expect(page.getByText('Accepted and saved to your Library.')).toBeVisible({timeout:15_000});
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Done',exact:true}).click();

  await expect(page.getByText('Dune Messiah',{exact:true})).toBeVisible();
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('archivist.localStage.web.v1')||'[]'));
  const saved=persisted.find((book:any)=>book.uri==='file:///library/unsorted.epub');
  expect(saved?.identificationState).toBe('accepted');
  expect(saved?.needsReview).toBe(false);
});
