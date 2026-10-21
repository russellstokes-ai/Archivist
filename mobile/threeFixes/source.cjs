'use strict';
// The original accepted sources stay immutable. These two owner-authorised
// source patches are explicit, SHA-bound and shared by Metro, tsc and repair tests.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const patches=new Map([
 [path.resolve(__dirname,'../App.tsx'),require('./appSource.cjs')],
 [path.resolve(__dirname,'../scannerVNext/runtime.ts'),require('./runtimeSource.cjs')],
]);
function effectiveSource(filename,source){return patches.get(path.resolve(filename))?.apply(source)??source;}
function manifests(){return [...patches].map(([file,patch])=>({file,...patch.applyWithManifest(fs.readFileSync(file,'utf8'))}));}
const cacheKey=crypto.createHash('sha256').update(['appSource.cjs','runtimeSource.cjs','source.cjs'].map(file=>fs.readFileSync(path.join(__dirname,file),'utf8')).join('\n')).digest('hex');
module.exports={effectiveSource,manifests,cacheKey,isPatched:filename=>patches.has(path.resolve(filename))};
