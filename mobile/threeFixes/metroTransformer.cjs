'use strict';
const {createRequire}=require('node:module');
// Resolve from the installed Expo package, not an assumed hoisted dependency.
// This selects the same upstream transformer version that Expo itself uses.
const expoRequire=createRequire(require.resolve('expo/metro-config'));
const upstream=expoRequire('@expo/metro-config/babel-transformer');
const {effectiveSource}=require('./source.cjs');
// Preserve Expo's platform/caller options; only replace the two exact inputs.
module.exports={...upstream,transform:args=>upstream.transform({...args,src:effectiveSource(args.filename,args.src)})};
