'use strict';
const ts=require('typescript'),path=require('node:path'),fs=require('node:fs');
const {effectiveSource,isPatched,manifests}=require('./source.cjs');
const root=path.resolve(__dirname,'..'),configPath=path.join(root,'tsconfig.json');
const raw=ts.readConfigFile(configPath,ts.sys.readFile);
if(raw.error)throw Error(ts.flattenDiagnosticMessageText(raw.error.messageText,'\n'));
const parsed=ts.parseJsonConfigFileContent(raw.config,ts.sys,root);
const options={...parsed.options,noEmit:true};
const host=ts.createCompilerHost(options),readSource=host.getSourceFile.bind(host);
host.getSourceFile=(file,languageVersion,onError,shouldCreate)=>isPatched(file)
 ?ts.createSourceFile(file,effectiveSource(file,fs.readFileSync(file,'utf8')),languageVersion,true)
 :readSource(file,languageVersion,onError,shouldCreate);
const program=ts.createProgram({rootNames:parsed.fileNames,options,host});
const diagnostics=[...parsed.errors,...ts.getPreEmitDiagnostics(program)];
if(diagnostics.length){
 console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
 process.exitCode=1;
}else{
 for(const item of manifests())console.log('EffectiveSource',path.relative(root,item.file),item.effectiveGitBlob,'exact edits',item.edits.length);
 console.log('PASS: the same effective application/runtime sources used by Metro pass the full TypeScript program.');
}
