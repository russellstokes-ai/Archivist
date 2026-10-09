import type {createAndroidCatalogueRuntime as NativeFactory} from './androidRuntime.native';
// Metro uses runtimeFactory.native on device; web must not load native SQLite.
export function createAndroidCatalogueRuntime(..._args:Parameters<typeof NativeFactory>):ReturnType<typeof NativeFactory>{
 return Promise.reject(new Error('The fresh scanner currently requires Android device folders.'));
}
