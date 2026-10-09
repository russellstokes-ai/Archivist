import * as SQLite from 'expo-sqlite';
import {createScannerStore, type ScannerDatabase} from './store';

// Additive tables share the existing database without modifying legacy user state.
export async function openScannerStore(newId:()=>string){
  const db=await SQLite.openDatabaseAsync('archivist-local.db');
  const port=(database:SQLite.SQLiteDatabase):ScannerDatabase=>({
    execAsync:sql=>database.execAsync(sql),
    runAsync:(sql,...params)=>database.runAsync(sql,...params),
    getFirstAsync:<T>(sql:string,...params:(string|number|null)[])=>database.getFirstAsync<T>(sql,...params),
    withExclusiveTransactionAsync:action=>database.withExclusiveTransactionAsync(tx=>action(port(tx)))
  });
  return createScannerStore(port(db),newId);
}
