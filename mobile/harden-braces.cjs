'use strict';

const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'node_modules','braces');
const pkgPath=path.join(root,'package.json');
if(!fs.existsSync(pkgPath))throw Error('braces is not installed');
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
if(pkg.version!=='3.0.3')throw Error('Review harden-braces.cjs for braces '+pkg.version+' before continuing.');

function patch(file,operations){
  const target=path.join(root,file);
  let source=fs.readFileSync(target,'utf8');
  for(const [before,after] of operations){
    if(source.includes(after))continue;
    if(!source.includes(before))throw Error('Unexpected braces '+file+' source; refusing an unreviewed patch.');
    source=source.replace(before,after);
  }
  fs.writeFileSync(target,source);
}

patch('lib/constants.js',[
  ["module.exports = {\n  MAX_LENGTH: 10000,","module.exports = {\n  MAX_DEPTH: 100,\n  MAX_LENGTH: 10000,"],
]);

patch('lib/parse.js',[
  ["const {\n  MAX_LENGTH,","const {\n  MAX_DEPTH,\n  MAX_LENGTH,"],
  ["  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;\n  if (input.length > max) {",
   "  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;\n  const maxDepth = Number.isFinite(opts.maxDepth) ? Math.min(MAX_DEPTH, opts.maxDepth) : MAX_DEPTH;\n  if (input.length > max) {"],
  ["  let index = 0;\n  let depth = 0;\n  let value;","  let index = 0;\n  let depth = 0;\n  let nesting = 0;\n  let value;"],
  ["    if (value === CHAR_LEFT_PARENTHESES) {\n      block = push({ type: 'paren', nodes: [] });",
   "    if (value === CHAR_LEFT_PARENTHESES) {\n      if (nesting + 1 > maxDepth) {\n        throw new SyntaxError(\`Input depth (\${nesting + 1}), exceeds max depth (\${maxDepth})\`);\n      }\n      nesting++;\n      block = push({ type: 'paren', nodes: [] });"],
  ["      block = stack.pop();\n      push({ type: 'text', value });\n      block = stack[stack.length - 1];",
   "      block = stack.pop();\n      push({ type: 'text', value });\n      nesting--;\n      block = stack[stack.length - 1];"],
  ["    if (value === CHAR_LEFT_CURLY_BRACE) {\n      depth++;",
   "    if (value === CHAR_LEFT_CURLY_BRACE) {\n      if (nesting + 1 > maxDepth) {\n        throw new SyntaxError(\`Input depth (\${nesting + 1}), exceeds max depth (\${maxDepth})\`);\n      }\n      nesting++;\n      depth++;"],
  ["      push({ type, value });\n      depth--;\n\n      block = stack[stack.length - 1];",
   "      push({ type, value });\n      depth--;\n      nesting--;\n\n      block = stack[stack.length - 1];"],
]);

patch('lib/compile.js',[
  ["const utils = require('./utils');","const utils = require('./utils');\nconst { MAX_DEPTH } = require('./constants');"],
  ["const compile = (ast, options = {}) => {\n  const walk = (node, parent = {}) => {",
   "const compile = (ast, options = {}) => {\n  const maxDepth = Number.isFinite(options.maxDepth) ? Math.min(MAX_DEPTH, options.maxDepth) : MAX_DEPTH;\n\n  const walk = (node, parent = {}, depth = 0) => {\n    if (node.nodes && depth > maxDepth) {\n      throw new RangeError(\`AST depth (\${depth}), exceeds max depth (\${maxDepth})\`);\n    }"],
  ["        output += walk(child, node);","        output += walk(child, node, child.nodes ? depth + 1 : depth);"],
  ["  return walk(ast);","  return walk(ast, {}, ast.type === 'root' ? 0 : 1);"],
]);

patch('lib/stringify.js',[
  ["const utils = require('./utils');","const utils = require('./utils');\nconst { MAX_DEPTH } = require('./constants');"],
  ["module.exports = (ast, options = {}) => {\n  const stringify = (node, parent = {}) => {",
   "module.exports = (ast, options = {}) => {\n  const maxDepth = Number.isFinite(options.maxDepth) ? Math.min(MAX_DEPTH, options.maxDepth) : MAX_DEPTH;\n\n  const stringify = (node, parent = {}, depth = 0) => {\n    if (node.nodes && depth > maxDepth) {\n      throw new RangeError(\`AST depth (\${depth}), exceeds max depth (\${maxDepth})\`);\n    }"],
  ["        output += stringify(child);","        output += stringify(child, undefined, child.nodes ? depth + 1 : depth);"],
  ["  return stringify(ast);","  return stringify(ast, {}, ast.type === 'root' ? 0 : 1);"],
]);

patch('lib/expand.js',[
  ["const utils = require('./utils');","const utils = require('./utils');\nconst { MAX_DEPTH } = require('./constants');"],
  ["const expand = (ast, options = {}) => {\n  const rangeLimit = options.rangeLimit === undefined ? 1000 : options.rangeLimit;\n\n  const walk = (node, parent = {}) => {",
   "const queueOwner = node => {\n  if (node.type === 'brace' || node.type === 'root' || !node.parent) return node;\n  const seen = new Set();\n  while (node.type !== 'brace' && node.type !== 'root' && node.parent) {\n    if (seen.has(node)) throw new RangeError('AST parent chain contains a cycle');\n    seen.add(node);\n    node = node.parent;\n  }\n  return node;\n};\n\nconst expand = (ast, options = {}) => {\n  const rangeLimit = options.rangeLimit === undefined ? 1000 : options.rangeLimit;\n  const maxDepth = Number.isFinite(options.maxDepth) ? Math.min(MAX_DEPTH, options.maxDepth) : MAX_DEPTH;\n\n  const walk = (node, parent = {}, depth = 0) => {\n    if (node.nodes && depth > maxDepth) {\n      throw new RangeError(\`AST depth (\${depth}), exceeds max depth (\${maxDepth})\`);\n    }"],
  ["    let p = parent;\n    let q = parent.queue;\n\n    while (p.type !== 'brace' && p.type !== 'root' && p.parent) {\n      p = p.parent;\n      q = p.queue;\n    }",
   "    const q = queueOwner(parent).queue;"],
  ["    let queue = node.queue;\n    let block = node;\n\n    while (block.type !== 'brace' && block.type !== 'root' && block.parent) {\n      block = block.parent;\n      queue = block.queue;\n    }",
   "    const queue = queueOwner(node).queue;"],
  ["        walk(child, node);","        walk(child, node, child.nodes ? depth + 1 : depth);"],
  ["  return utils.flatten(walk(ast));","  return utils.flatten(walk(ast, {}, ast.type === 'root' ? 0 : 1));"],
]);

// Regression tests for CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm.
const braces=require('braces');
const parse=require('braces/lib/parse');
const compile=require('braces/lib/compile');
const expand=require('braces/lib/expand');
const stringify=require('braces/lib/stringify');

const malicious='{'.repeat(101)+'a,b'+'}'.repeat(101);
let rejected=false;
try{braces(malicious);}catch(error){rejected=/max depth/i.test(String(error&&error.message));}
if(!rejected)throw Error('braces depth mitigation regression failed for nested input');

let ast={type:'text',value:'a'};
for(let i=0;i<101;i++)ast={type:'brace',nodes:[ast]};
ast={type:'root',nodes:[ast]};
for(const [name,fn] of [['compile',compile],['expand',expand],['stringify',stringify]]){
  let safe=false;
  try{fn(ast);}catch(error){safe=/max depth/i.test(String(error&&error.message));}
  if(!safe)throw Error('braces '+name+' AST depth mitigation regression failed');
}

if(braces('a/{b,c}/d').join(',')!=='a/(b|c)/d')throw Error('braces normal-pattern regression failed');
if(parse('{{a,b},c}',{maxDepth:2}).type!=='root')throw Error('braces maxDepth option regression failed');

console.log('PASS: braces 3.0.3 hardened against CVE-2026-93687 nested-pattern stack exhaustion');
