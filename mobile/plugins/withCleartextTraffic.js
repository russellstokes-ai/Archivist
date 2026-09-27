const {withAndroidManifest}=require('expo/config-plugins');

module.exports=function withCleartextTraffic(config){
  return withAndroidManifest(config, next => {
    const application=next.modResults?.manifest?.application?.[0];
    if(!application) throw new Error('Android manifest application node is missing.');
    application.$=application.$ || {};
    application.$['android:usesCleartextTraffic']='true';
    return next;
  });
};
