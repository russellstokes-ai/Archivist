const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(__dirname,'.scanner-native-test-'));
const binary=name=>process.env.SCANNER_TEST_JAVA_HOME?path.join(process.env.SCANNER_TEST_JAVA_HOME,'bin',name+(process.platform==='win32'?'.exe':'')):name;
try{
 const compile=spawnSync(binary('javac'),['--release','17','-d',tmp,path.join(__dirname,'android/app/src/main/java/app/archivist/reader/MetadataRecoveryPolicy.java'),path.join(__dirname,'test-support/MetadataRecoveryPolicyTest.java')],{encoding:'utf8',timeout:30000});
 assert.equal(compile.status,0,compile.error?.message||compile.stdout+compile.stderr);
 const run=spawnSync(binary('java'),['-cp',tmp,'app.archivist.reader.MetadataRecoveryPolicyTest'],{encoding:'utf8',timeout:15000});
 assert.equal(run.status,0,run.error?.message||run.stdout+run.stderr);console.log(run.stdout.trim());
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
