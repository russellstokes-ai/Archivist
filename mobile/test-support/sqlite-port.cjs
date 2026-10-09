const path=require('node:path'),{spawn}=require('node:child_process'),{createInterface}=require('node:readline');
module.exports=function sqlite(file){
 const child=spawn(process.env.SCANNER_TEST_PYTHON||'python3',[path.join(__dirname,'sqlite-bridge.py'),file]),pending=new Map();let id=0;
 createInterface({input:child.stdout}).on('line',line=>{const r=JSON.parse(line),p=pending.get(r.id);pending.delete(r.id);r.error?p.reject(Error(r.error)):p.resolve(r.value);});
 child.on('error',error=>{for(const p of pending.values())p.reject(error);});child.on('exit',code=>{for(const p of pending.values())p.reject(Error('SQLite bridge exited '+code));});
 const request=(operation,sql='',params=[])=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});child.stdin.write(JSON.stringify({id:key,operation,sql,params})+'\n');});
 const db={execAsync:sql=>request('exec',sql),runAsync:(sql,...args)=>request('run',sql,args),getFirstAsync:async(sql,...args)=>(await request('query',sql,args))[0]??null,async withExclusiveTransactionAsync(action){await request('run','BEGIN IMMEDIATE');try{const value=await action(db);await request('run','COMMIT');return value;}catch(e){await request('run','ROLLBACK');throw e;}},close:()=>request('close')};return db;
};
