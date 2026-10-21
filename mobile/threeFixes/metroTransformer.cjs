'use strict';
const upstream=require('@expo/metro-config/babel-transformer');
const {effectiveSource}=require('./source.cjs');
// Preserve Expo's platform/caller options; only replace the two exact inputs.
module.exports={...upstream,transform:args=>upstream.transform({...args,src:effectiveSource(args.filename,args.src)})};
