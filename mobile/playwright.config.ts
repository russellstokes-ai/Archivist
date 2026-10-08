import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./e2e',
  timeout:60_000,
  expect:{timeout:10_000},
  fullyParallel:false,
  workers:1,
  retries:0,
  reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],
  use:{
    baseURL:'http://127.0.0.1:4173',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
  },
  projects:[
    {name:'phone',use:{...devices['Pixel 7']}},
    {name:'fold',use:{viewport:{width:904,height:1104},deviceScaleFactor:1,isMobile:true,hasTouch:true}},
  ],
  webServer:{
    command:'rm -rf .e2e-dist && npx expo export --platform web --output-dir .e2e-dist && python3 -m http.server 4173 --bind 127.0.0.1 --directory .e2e-dist',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:false,
    timeout:180_000,
  },
});
