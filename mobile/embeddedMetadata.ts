import JSZip from 'jszip';
import {EncodingType, getInfoAsync, readAsStringAsync} from 'expo-file-system/legacy';
import {LocalMetadataFields, parseLocalSidecar} from './libraryIntelligence';

const maxEmbeddedArchiveBytes = 64 * 1024 * 1024;

export async function extractEmbeddedMetadata(uri:string, extension:string, knownInfo?:{exists?:boolean;size?:number}):Promise<LocalMetadataFields> {
  const ext=extension.toLowerCase();
  if(ext!=='epub'&&ext!=='cbz'&&ext!=='zip')return {};
  try{
    const info=knownInfo || await getInfoAsync(uri);
    if(info.exists===false)return {};
    if(typeof info.size==='number'&&info.size>maxEmbeddedArchiveBytes)return {};
    const base64=await readAsStringAsync(uri,{encoding:EncodingType.Base64});
    return extractEmbeddedMetadataFromBase64(base64,ext);
  }catch{
    return {};
  }
}

export async function extractEmbeddedMetadataFromBase64(base64:string, extension:string):Promise<LocalMetadataFields> {
  if(!base64)return {};
  try{
    const zip=await JSZip.loadAsync(base64,{base64:true});
    const ext=extension.toLowerCase();
    if(ext==='epub'){
      let opfPath='';
      const container=zip.file('META-INF/container.xml');
      if(container){
        const xml=await container.async('text');
        const match=xml.match(/full-path\s*=\s*["']([^"']+\.opf)["']/i);
        if(match)opfPath=match[1];
      }
      const opf=(opfPath&&zip.file(opfPath))||Object.values(zip.files).find(file=>!file.dir&&/\.opf$/i.test(file.name));
      if(!opf)return {};
      return parseLocalSidecar(await opf.async('text'),'opf');
    }
    const comic=Object.values(zip.files).find(file=>!file.dir&&/(^|\/)ComicInfo\.xml$/i.test(file.name));
    if(!comic)return {};
    return parseLocalSidecar(await comic.async('text'),'xml');
  }catch{
    return {};
  }
}
