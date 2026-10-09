const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
const source=path.join(__dirname,'android/app/src/main/java/app/archivist/reader/ScannerTaskPool.java');
assert.ok(fs.existsSync(source),'Native scanner needs a bounded worker pool, not only a JS timeout');
const boundedIO=path.join(path.dirname(source),'ScannerBoundedIO.java');
assert.ok(fs.existsSync(boundedIO),'Native metadata reads must enforce byte budgets and close their streams');
const tmp=fs.mkdtempSync(path.join(__dirname,'.scanner-native-test-'));
const javaHome=process.env.SCANNER_TEST_JAVA_HOME;
const binary=name=>javaHome?path.join(javaHome,'bin',name+(process.platform==='win32'?'.exe':'')):name;
try{
 const compile=spawnSync(binary('javac'),['--release','17','-d',tmp,source,boundedIO,path.join(__dirname,'test-support/ScannerTaskPoolTest.java')],{encoding:'utf8',timeout:30000});
 assert.equal(compile.status,0,compile.error?.message||compile.stdout+compile.stderr);
 const run=spawnSync(binary('java'),['-cp',tmp,'app.archivist.reader.ScannerTaskPoolTest'],{encoding:'utf8',timeout:15000});
 assert.equal(run.status,0,run.error?.message||run.stdout+run.stderr);console.log(run.stdout.trim());
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
