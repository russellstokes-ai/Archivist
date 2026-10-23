const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {validatedFields}=require('./assistMetadata/fields.ts');
const values={subtitle:'The continuation',publicationDate:'2020-09-03',pageCount:'280',durationSeconds:'8345'};
assert.deepEqual(validatedFields(values),values);
for(const value of ['-1','NaN','Infinity','0','10000000000','1e6'])assert.throws(()=>validatedFields({durationSeconds:value}),/quantity/);
assert.throws(()=>validatedFields({pageCount:'3.5'}),/quantity/);assert.deepEqual(validatedFields({pageCount:''}),{pageCount:''});
console.log('PASS: additional bibliographic fields persist without invalid measured quantities');
