// Run with Playwright available on NODE_PATH. Fixtures never touch a real library.
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const web=path.resolve(__dirname,'../web');
const screenshotDir=process.env.ARCHIVIST_SCREENSHOTS;
const works=[
  {title:'The Will of the Many',author:'James Islington',format:'Audio'},
  {title:'Piranesi',author:'Susanna Clarke',format:'Ebook'},
  {title:'The Left Hand of Darkness',author:'Ursula K. Le Guin',format:'Ebook'},
  {title:'A Wizard of Earthsea',author:'Ursula K. Le Guin',format:'Audio'},
  {title:'The Long Way to a Small, Angry Planet: An Unusually Long Title for Layout Verification',author:'Becky Chambers',format:'Audio'},
  {title:'Collected Stories',author:'Unknown author',format:'Comic'},
  {title:'A Room of One’s Own',author:'Virginia Woolf',format:'Ebook'},
  {title:'The Odyssey',author:'Homer',format:'Physical'},
  {title:'Invisible Cities',author:'Italo Calvino',format:'Ebook'},
].map((w,i)=>({...w,id:i+1,available:i!==7,space:'My library',files:1,editions:1}));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(web,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(web+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch(process.env.ARCHIVIST_BROWSER_CHANNEL?{channel:process.env.ARCHIVIST_BROWSER_CHANNEL,headless:true}:{headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    let failBooks=false,delayBooks=0,empty=false;
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(!url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/setup/'))return route.continue();
      let data=[];
      if(url.pathname.endsWith('/cover'))return route.fulfill({status:404,body:''});
      if(url.pathname==='/api/me')data={id:1,name:'Reader',owner:true,admin:true,ingress:true};
      if(url.pathname==='/api/library-summary')data={total:empty?0:works.length,formats:['Ebook','Audio','Comic','Physical'].map(name=>({name,count:works.filter(w=>w.format===name).length})),spaces:[{name:'My library',count:9}],authors:[{name:'Ursula K. Le Guin',count:2}]};
      if(url.pathname==='/api/works'){
        const fail=failBooks,delay=delayBooks;
        if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
        if(fail)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Server temporarily unavailable.'})});
        data=empty?[]:works.filter(w=>(!url.searchParams.get('format')||w.format===url.searchParams.get('format'))&&(!url.searchParams.get('q')||(w.title+' '+w.author).toLowerCase().includes(url.searchParams.get('q').toLowerCase())));
      }
      if(url.pathname==='/api/atlas-relationships')data={workCount:2,works:works.filter(w=>w.author===url.searchParams.get('value'))};
      if(url.pathname==='/api/sources')data=[{id:1,space:'My library',path:'/media/Library',status:'Ready',works:9,audiobooks:3,ebooks:4,comics:1,watchMinutes:60}];
      if(url.pathname==='/api/folders')data={path:'/media',parent:'/',folders:[{name:'Library',path:'/media/Library'},{name:'Audiobooks',path:'/media/Audiobooks'}]};
      if(url.pathname==='/api/server-info')data={address:'https://library.example',configured:true,sources:1,sessions:1,databaseBytes:4096,activeJobs:0};
      return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
    });
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.getByRole('button',{name:'Library',exact:true}).click();
    await page.locator('.book').first().waitFor();
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('.book').count(),9);
    const bindings=await page.locator('.cover').evaluateAll(nodes=>nodes.map(n=>n.dataset.binding));
    for(const [name,width,height,theme] of [['desktop-dark',1440,1100,'dark'],['desktop-16x9-dark',1920,1080,'dark'],['desktop-qhd-light',2560,1440,'light'],['phone-dark',390,844,'dark'],['fold-light',720,950,'light'],['desktop-light',1440,1100,'light']]){
      await page.setViewportSize({width,height});await page.selectOption('#theme',theme);
      await page.mouse.move(0,0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' horizontal overflow');
      const columns=await page.locator('#books').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length);
      assert.equal(columns,width<600?2:width<1200?4:width<1600?5:6,name+' catalogue columns');
      assert.equal(await page.locator('.cover-fallback').evaluateAll(nodes=>nodes.every(node=>node.querySelector('strong').getBoundingClientRect().bottom<=node.querySelector('.cover-imprint').getBoundingClientRect().top)),true,name+' fallback title overlaps imprint');
      if(width>=1600){
        const mainWidth=await page.locator('main').evaluate(node=>node.getBoundingClientRect().width);
        assert.ok(mainWidth>=1500,name+' should use the large 16:9 canvas, got '+mainWidth);
      }
      if(screenshotDir){fs.mkdirSync(screenshotDir,{recursive:true});await page.screenshot({path:path.join(screenshotDir,name+'.png'),fullPage:true,animations:'disabled'})}
    }
    await page.getByRole('button',{name:'Audio 3',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.book').length===3);
    assert.equal(await page.getByRole('button',{name:'Audio 3',exact:true}).getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:'All 9',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.book').length===9);
    assert.deepEqual(await page.locator('.cover').evaluateAll(nodes=>nodes.map(n=>n.dataset.binding)),bindings,'fallback bindings are stable');
    await page.fill('#search','no-such-title');await page.getByText('No books found',{exact:true}).waitFor();
    await page.locator('.empty-state button').click();await page.locator('.book').first().waitFor();
    failBooks=true;await page.fill('#search','Piranesi');await page.getByText('Your library couldn’t load',{exact:true}).waitFor();
    failBooks=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.locator('.book').first().waitFor();
    assert.equal(await page.locator('.book').count(),1);
    delayBooks=400;await page.fill('#search','Earthsea');await page.locator('.skeleton').first().waitFor();
    assert.equal(await page.locator('#books').getAttribute('aria-busy'),'true');
    await page.waitForFunction(()=>document.querySelector('#books').getAttribute('aria-busy')==='false');delayBooks=0;
    await page.getByRole('button',{name:'Shelf',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Shelf overflow');
    await page.getByRole('button',{name:'Stats',exact:true}).click();
    await page.locator('#insights-metrics').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Stats overflow');
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    await page.setViewportSize({width:1920,height:1080});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'16:9 settings overflow');
    assert.ok(await page.locator('main').evaluate(node=>node.getBoundingClientRect().width)>=1500,'16:9 settings should use wide desktop canvas');
    if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,'settings-16x9.png'),fullPage:true,animations:'disabled'});
    for(const tabName of ['Organisation','Household','Server']){
      await page.getByRole('tab',{name:tabName,exact:true}).click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'16:9 '+tabName+' settings overflow');
    }
    await page.getByRole('tab',{name:'Organisation',exact:true}).click();
    if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,'organisation-16x9.png'),fullPage:true,animations:'disabled'});
    await page.getByRole('tab',{name:'Library & storage',exact:true}).click();
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'settings overflow');
    if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,'settings-phone.png'),fullPage:true,animations:'disabled'});
    await page.getByRole('button',{name:'Browse server folders',exact:true}).click();
    await page.getByRole('button',{name:'Use folder',exact:true}).first().waitFor();
    assert.equal(await page.locator('#picker').isVisible(),true);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#picker').isVisible(),false);
    await page.getByRole('tab',{name:'Server',exact:true}).click();await page.getByText('https://library.example',{exact:false}).waitFor();
    if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,'server-settings-phone.png'),fullPage:true,animations:'disabled'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'server settings overflow');
    await page.locator('#nav [data-page="atlas"]').click();
    await page.locator('.universe-node').first().waitFor();
    assert.ok(await page.locator('.universe-edge').count()>0,'Atlas contains connected edges');
    await page.setViewportSize({width:1920,height:1080});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'16:9 Atlas overflow');
    const atlasColumns=await page.locator('.atlas-space').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length);
    assert.equal(atlasColumns,2,'16:9 Atlas keeps graph and inspector side by side');
    if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,'atlas-16x9.png'),fullPage:true,animations:'disabled'});
    await page.locator('#atlas-in').click();
    assert.ok((await page.locator('#atlas-camera').getAttribute('transform')).includes('scale(1.2)'),'Atlas zoom');
    await page.locator('#atlas-fit').click();
    await page.locator('#atlas-search').fill('Ursula');
    await page.locator('#atlas-search').press('Enter');
    await page.locator('#atlas-inspector').getByText('2 connected works',{exact:true}).waitFor();
    assert.equal(await page.locator('#atlas-inspector button').count(),2,'canonical author relationships');
    assert.ok(await page.locator('.universe-edge.connected').count()>0,'selected edges highlighted');
    assert.deepEqual(errors,[],'uncaught browser errors');
    console.log('PASS: responsive phone/Fold/desktop/16:9 layouts, both themes, stable fallback covers, live filtering, empty state, failed request/retry, loading, settings and folder modal.');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
