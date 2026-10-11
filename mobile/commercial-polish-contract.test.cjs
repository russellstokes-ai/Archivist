// Source guard: commercial polish may enlarge the OUTER book only.
const assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync(__dirname+'/App.tsx','utf8');
const book=fs.readFileSync(__dirname+'/LivingBookCanvas.tsx','utf8');
assert.ok(app.includes('stageWidth={livingBookStageWidth}'),'Player must size the stage responsively');
assert.ok(app.includes('const bookColumnBudget = foldLayout ? width-48-32-250'),'Keep Fold controls in the viewport');
assert.ok(app.includes('const bookHeightBudget = height*(foldLayout ? 0.52 : 0.42)'),'Size book by height too');
assert.ok(book.includes('const stageHeight = Math.round(stageWidth*290/340)'),'Preserve stage ratio');
assert.ok(book.includes("function project(x,y,z)") && book.includes("function flex(progress)") &&
  book.includes("const duration=skipping?780:1900") &&
  book.includes("transitionTo=1") && book.includes("requestAnimationFrame(tick)"),
  'Do not modify the approved internal Living Book renderer or animation');
assert.ok(app.includes("SecureStore.setItemAsync(firstLibraryCelebratedKey,'1')"),
  'First-library completion must be persisted');
assert.ok(app.includes("setCelebrationEligible(done !== '1' && shown !== '1')"),
  'Existing libraries must not be celebrated as new installs');
assert.ok(app.includes("!localBooks.length || localScanning || libraryRefreshActive"),
  'Cancelled, unfinished and empty scans may not celebrate');
console.log('PASS: Living Book outer-only sizing and first-library observer contracts');
