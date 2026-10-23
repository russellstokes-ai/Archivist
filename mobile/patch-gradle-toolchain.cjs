// React Native 0.83.10 ships Foojay 0.5, which references IBM_SEMERU removed in Gradle 9.
// Upstream compatibility: https://plugins.gradle.org/plugin/org.gradle.toolchains.foojay-resolver-convention/1.0.0
const fs=require('node:fs'),path=require('node:path');
const old='id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")';
const fixed='id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")';
function patch(text){
 if(text.split(fixed).length===2&&!text.includes(old))return text;
 if(text.split(old).length!==2)throw Error('React Native toolchain settings changed; review pinned Foojay compatibility before building');
 return text.replace(old,fixed);
}
if(require.main===module){
 const root=path.dirname(require.resolve('@react-native/gradle-plugin/package.json'));
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 if(version!=='0.83.10')throw Error('Review toolchain compatibility after React Native version change');
 const file=path.join(root,'settings.gradle.kts'),original=fs.readFileSync(file,'utf8'),next=patch(original);
 if(next!==original)fs.writeFileSync(file,next);
 console.log('React Native Gradle 9 toolchain compatibility verified');
}
module.exports=patch;
