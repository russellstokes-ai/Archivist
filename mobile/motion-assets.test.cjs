const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'assets/motion'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
assert.equal(manifest.baseline,'df4c39b44394d8c512ca0298bffa7f19da356490');
assert.equal(manifest.assets.length,10,'all 10 agreed animations must ship in the lab');
assert(!manifest.assets.some(item=>item.id==='open-book'),'rejected Open Book must remain excluded');
for(const item of manifest.assets){
  const data=JSON.parse(fs.readFileSync(path.join(dir,item.id+'.json'),'utf8'));
  assert.equal(data.fr,60);assert.equal(data.w,128);assert.equal(data.h,128);
  assert(data.layers.length>=5,'layered composition: '+item.id);
  assert(!data.assets?.length,'all assets must be local vector layers');
  for(const layer of data.layers){assert.equal(layer.ty,4);assert.equal(layer.shapes[0].ty,'gr');
    for(const key of ['o','r','p','s']){
      const prop=layer.ks[key];assert(prop.a===0||prop.a===1);
      if(prop.a===1){let t=-1;for(const v of prop.k){assert(v.t>t);t=v.t;}}
    }
  }
}
console.log('PASS: all ten local vector-only Archivist motion assets are structurally validated');