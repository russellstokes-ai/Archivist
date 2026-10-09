import {fetch as expoFetch} from 'expo/fetch';
import {readBoundedJson,type JsonRequest} from './providers';
import {ProviderRequestError} from './search';
export const requestProviderJson:JsonRequest=async(url,signal)=>{
 try{return await readBoundedJson(await expoFetch(url,{signal,headers:{Accept:'application/json'}}),signal);}
 catch(error){if(signal?.aborted)throw new Error('Provider request cancelled');if(error instanceof ProviderRequestError)throw error;throw new Error('Provider response unavailable or invalid');}
};
