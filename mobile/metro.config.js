const {getDefaultConfig} = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
if (!config.resolver.assetExts.includes('html')) config.resolver.assetExts.push('html');
// Explicit owner-approved three-fix sources, also checked by npm run typecheck.
config.transformer.babelTransformerPath = require.resolve('./threeFixes/metroTransformer.cjs');
config.cacheVersion = (config.cacheVersion || '') + ':' + require('./threeFixes/source.cjs').cacheKey;
module.exports = config;
