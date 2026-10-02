const {withAndroidManifest,withDangerousMod}=require('expo/config-plugins');
const fs=require('node:fs');
const path=require('node:path');

const AUTO_META='com.google.android.gms.car.application';

module.exports=function withAndroidAuto(config){
  config=withAndroidManifest(config,next=>{
    const application=next.modResults?.manifest?.application?.[0];
    if(!application) throw new Error('Android manifest application node is missing.');
    application['meta-data']=application['meta-data']||[];
    const exists=application['meta-data'].some(item=>item?.$?.['android:name']===AUTO_META);
    if(!exists){
      application['meta-data'].push({
        $:{
          'android:name':AUTO_META,
          'android:resource':'@xml/automotive_app_desc'
        }
      });
    }
    return next;
  });

  return withDangerousMod(config,['android',async next=>{
    const xmlDir=path.join(next.modRequest.platformProjectRoot,'app','src','main','res','xml');
    fs.mkdirSync(xmlDir,{recursive:true});
    const target=path.join(xmlDir,'automotive_app_desc.xml');
    fs.writeFileSync(target,
      '<?xml version="1.0" encoding="utf-8"?>\n<automotiveApp>\n  <uses name="media"/>\n</automotiveApp>\n'
    );
    return next;
  }]);
};
