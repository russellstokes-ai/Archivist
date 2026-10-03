const {withAndroidManifest,withDangerousMod}=require('expo/config-plugins');
const fs=require('node:fs');
const path=require('node:path');

const AUTO_META='com.google.android.gms.car.application';
const AUTO_SERVICE='.ArchivistAutoService';

module.exports=function withAndroidAuto(config){
  config=withAndroidManifest(config,next=>{
    const application=next.modResults?.manifest?.application?.[0];
    if(!application) throw new Error('Android manifest application node is missing.');

    application['meta-data']=application['meta-data']||[];
    if(!application['meta-data'].some(item=>item?.$?.['android:name']===AUTO_META)){
      application['meta-data'].push({
        $:{
          'android:name':AUTO_META,
          'android:resource':'@xml/automotive_app_desc'
        }
      });
    }

    application.service=application.service||[];
    if(!application.service.some(item=>item?.$?.['android:name']===AUTO_SERVICE)){
      application.service.push({
        $:{
          'android:name':AUTO_SERVICE,
          'android:exported':'true',
          'android:foregroundServiceType':'mediaPlayback',
          'android:label':'@string/app_name'
        },
        'intent-filter':[{
          action:[
            {$:{'android:name':'androidx.media3.session.MediaLibraryService'}},
            {$:{'android:name':'android.media.browse.MediaBrowserService'}}
          ]
        }]
      });
    }
    return next;
  });

  return withDangerousMod(config,['android',async next=>{
    const xmlDir=path.join(next.modRequest.platformProjectRoot,'app','src','main','res','xml');
    fs.mkdirSync(xmlDir,{recursive:true});
    fs.writeFileSync(
      path.join(xmlDir,'automotive_app_desc.xml'),
      '<?xml version="1.0" encoding="utf-8"?>\n<automotiveApp>\n  <uses name="media"/>\n</automotiveApp>\n'
    );
    return next;
  }]);
};
