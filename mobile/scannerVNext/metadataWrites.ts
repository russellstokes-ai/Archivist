import type {ScannerDatabase} from './store';

const busy=(error:unknown)=>/\bSQLITE_(?:BUSY|LOCKED)\b|database (?:table )?is locked/i.test(String((error as {message?:unknown})?.message??error));
export function createWriteQueue(sleep:(ms:number)=>Promise<void>=ms=>new Promise(resolve=>setTimeout(resolve,ms))){
 let tail:Promise<unknown>=Promise.resolve();
 return function write<T>(operation:()=>Promise<T>):Promise<T>{
  const result=tail.catch(()=>undefined).then(async()=>{
   const delays=[50,150,350,750];
   for(let attempt=0;;attempt++){
    try{return await operation();}
    catch(error){if(!busy(error)||attempt>=delays.length)throw error;await sleep(delays[attempt]);}
   }
  });
  tail=result;return result;
 };
}
// All metadata/cache/publication and UI catalogue writers share the same lane.
// Retry whole transactions only: Expo rolls back failed exclusive transactions.
export const metadataWrite=createWriteQueue();
const ports=new WeakMap<ScannerDatabase,ScannerDatabase>();
export function metadataDatabase(db:ScannerDatabase):ScannerDatabase{
 const existing=ports.get(db);if(existing)return existing;
 const port:ScannerDatabase={
  execAsync:sql=>metadataWrite(()=>db.execAsync(sql)),
  runAsync:(sql,...params)=>metadataWrite(()=>db.runAsync(sql,...params)),
  getFirstAsync:<T>(sql:string,...params:(string|number|null)[])=>db.getFirstAsync<T>(sql,...params),
  withExclusiveTransactionAsync:action=>metadataWrite(()=>db.withExclusiveTransactionAsync(action)),
 };
 ports.set(db,port);ports.set(port,port);return port;
}
