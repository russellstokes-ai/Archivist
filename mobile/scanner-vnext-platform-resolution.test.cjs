const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {resolve}=require('metro-resolver');
function target(origin,specifier,platform){
 const context={originModulePath:path.join(__dirname,origin),sourceExts:['js','jsx','json','ts','tsx'],assetExts:new Set(),preferNativePlatform:platform!=='web',mainFields:['react-native','browser','main'],getPackageForModule:()=>null,
  fileSystemLookup(file){try{const stat=fs.statSync(file);return {exists:true,type:stat.isDirectory()?'d':'f',realPath:fs.realpathSync(file)};}catch{return {exists:false};}},doesFileExist:fs.existsSync};
 return resolve(context,specifier,platform).filePath;
}
for(const platform of ['android','ios','web']){
 for(const name of ['runtime','store','nativeAccess','providers'])assert.equal(target('scannerVNext/entry.ts','./'+name,platform),path.join(__dirname,'scannerVNext',name+'.ts'),'Shared '+name+' must retain its core exports on '+platform);
 assert.equal(target('App.tsx','./scannerVNext/runtimeFactory',platform),path.join(__dirname,'scannerVNext',platform==='web'?'runtimeFactory.ts':'runtimeFactory.native.ts'));
}
console.log('PASS: actual Metro resolver keeps shared scanner exports on Android/iOS/web and selects only the explicit platform factory');
