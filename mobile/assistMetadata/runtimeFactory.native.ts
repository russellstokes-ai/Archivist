// Metro selects this Android/native entry point; the web entry remains separate.
// Re-export only the user-authorised Assist/metadata runtime in this directory.
export {createAndroidCatalogueRuntime} from './runtime.native';
