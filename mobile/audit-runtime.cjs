const {spawnSync}=require('node:child_process');
require('./harden-forge.cjs');
require('./harden-braces.cjs');
const result=spawnSync('npm',['audit','--omit=dev','--json'],{encoding:'utf8'});
if(result.error)throw result.error;
let report;
try{report=JSON.parse(result.stdout);}catch{throw Error('Could not read npm audit report');}
if(report.error||!report.vulnerabilities)throw Error('npm audit did not produce a valid report');
const reviewed=new Map([
  ['https://github.com/advisories/GHSA-86w9-cpqp-85rv','local forge signature mitigation and malformed-signature regression passed'],
  ['https://github.com/advisories/GHSA-vfj7-8cjw-p6xm','upstream braces PR #72 depth/cycle mitigation and malicious nested-pattern regression passed'],
]);
const findings=new Map();
function visit(name,seen=new Set()){
 if(seen.has(name))return;seen.add(name);
 for(const via of report.vulnerabilities[name]?.via||[]){
  if(typeof via==='string')visit(via,seen);
  else if(['high','critical'].includes(via.severity))findings.set(via.url,via);
 }
}
for(const name of Object.keys(report.vulnerabilities))visit(name);
for(const [url,finding] of findings){
 const mitigation=reviewed.get(url);
 if(mitigation){console.log('Reviewed advisory: '+url+' — '+mitigation+'.');}
 else {console.error(finding);process.exitCode=1;}
}
console.log(JSON.stringify(report.metadata.vulnerabilities));
if(!process.exitCode)console.log('No unmitigated high/critical findings. Moderate findings remain recorded in npm audit.');

