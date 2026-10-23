const fs=require('fs'),path=require('path'),crypto=require('crypto'),ts=require('typescript'),assert=require('assert/strict');
const lock=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/scanner-vnext/CANONICAL_PROCESS_LOCK.json'))),file=ts.createSourceFile('App.tsx',require('../scripts/discovery-original-source.cjs')('mobile/App.tsx',fs.readFileSync(path.join(__dirname,'App.tsx'),'utf8')),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),seen={};
function visit(node){
  if(ts.isFunctionDeclaration(node)&&lock.sha256[node.name?.text]){
    const name=node.name.text;
    let protectedBody=node.getText(file);
    if(name==='LibrarySettingsTools'){
      // Reconstruct the exact original canonical function before hashing:
      // ONLY the user-authorised visual loading indicator may change.
      // Do not update CANONICAL_PROCESS_LOCK.json or rebaseline any function.
      const replacement='<ArchivistBookLoader label="Scanning local library" size="compact" reduceMotion={reduceMotion}/>';
      const canonical='<ActivityIndicator accessibilityLabel="Scanning local library" color={p.sage}/>';
      assert.equal(protectedBody.split(replacement).length-1,1,'Approved book loader missing or duplicated inside protected Settings');
      protectedBody=protectedBody.replace(replacement,canonical);
    }
    seen[name]=crypto.createHash('sha256').update(protectedBody).digest('hex');
  }
  ts.forEachChild(node,visit);
}visit(file);assert.deepEqual(seen,lock.sha256,'Accepted onboarding/review process changed');console.log('PASS: accepted scanner integration, onboarding and direct review remain locked');
