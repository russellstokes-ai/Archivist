const path=require('node:path'),{spawn}=require('node:child_process'),{createInterface}=require('node:readline');
module.exports=function sqlite(file){
 const child=spawn(process.env.SCANNER_TEST_PYTHON||'python3',[path.join(__dirname,'sqlite-bridge.py'),file]),pending=new Map();let id=0,closedError=null;
 createInterface({input:child.stdout}).on('line',line=>{const r=JSON.parse(line),p=pending.get(r.id);if(!p)return;pending.delete(r.id);r.error?p.reject(Error(r.error)):p.resolve(r.value);});
 const failed=error=>{closedError=error;for(const p of pending.values())p.reject(error);pending.clear();};
 child.on('error',failed);child.on('exit',code=>failed(Error('SQLite bridge exited '+code)));child.stdin.on('error',failed);
 const request=(operation,sql='',params=[])=>new Promise((resolve,reject)=>{if(closedError)return reject(closedError);const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(Error('SQLite bridge request timed out'));child.kill();},30000);pending.set(key,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});child.stdin.write(JSON.stringify({id:key,operation,sql,params})+'\n',error=>{if(error)failed(error)});});
 const db={execAsync:sql=>request('exec',sql),runAsync:(sql,...args)=>request('run',sql,args),getFirstAsync:async(sql,...args)=>(await request('query',sql,args))[0]??null,async withExclusiveTransactionAsync(action){await request('run','BEGIN IMMEDIATE');try{const value=await action(db);await request('run','COMMIT');return value;}catch(e){await request('run','ROLLBACK');throw e;}},close:()=>request('close')};return db;
};
