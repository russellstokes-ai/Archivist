import type {createAndroidCatalogueRuntime as NativeFactory} from './runtime.native';
export function createAndroidCatalogueRuntime(..._args:Parameters<typeof NativeFactory>):ReturnType<typeof NativeFactory>{
 return Promise.reject(new Error('Local Assist and library persistence require Android document access.'));
}
