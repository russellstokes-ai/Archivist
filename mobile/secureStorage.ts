import {Platform} from 'react-native';
import * as NativeSecureStore from 'expo-secure-store';

type BrowserStorage={
  getItem:(key:string)=>string|null;
  setItem:(key:string,value:string)=>void;
  removeItem:(key:string)=>void;
};

function webSessionStorage():BrowserStorage|undefined{
  if(Platform.OS!=='web')return undefined;
  try{
    const storage=(globalThis as any)?.sessionStorage as BrowserStorage|undefined;
    return storage&&typeof storage.getItem==='function'&&typeof storage.setItem==='function'&&typeof storage.removeItem==='function'
      ? storage
      : undefined;
  }catch{
    return undefined;
  }
}

export async function getItemAsync(key:string):Promise<string|null>{
  if(Platform.OS==='web'){
    try{return webSessionStorage()?.getItem(key)??null;}catch{return null;}
  }
  return NativeSecureStore.getItemAsync(key);
}

export async function setItemAsync(key:string,value:string):Promise<void>{
  if(Platform.OS==='web'){
    const storage=webSessionStorage();
    if(!storage)return;
    try{storage.setItem(key,value);}catch{}
    return;
  }
  await NativeSecureStore.setItemAsync(key,value);
}

export async function deleteItemAsync(key:string):Promise<void>{
  if(Platform.OS==='web'){
    try{webSessionStorage()?.removeItem(key);}catch{}
    return;
  }
  await NativeSecureStore.deleteItemAsync(key);
}

// Explicit names for tests/callers that prefer the boundary to be obvious.
export const secureGetItemAsync=getItemAsync;
export const secureSetItemAsync=setItemAsync;
export const secureDeleteItemAsync=deleteItemAsync;
