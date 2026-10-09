import {NativeModules,Platform} from 'react-native';
import {NativeSourceAccess} from './nativeAccess';
import type {ScannerNativePort} from './nativeAccess';
import {NativeHeaderReader,type NativeHeaderPort} from './nativeClues';
import {NativeArchiveReader,type NativeArchivePort} from './nativeArchive';
import {NativeArtworkReader,type NativeArtworkPort} from './nativeArtwork';

export function createAndroidSourceAccess():NativeSourceAccess {
  const port=NativeModules.ArchivistScanner as ScannerNativePort|undefined;
  if(Platform.OS!=='android'||!port||typeof port.beginScope!=='function'||typeof port.queryChildren!=='function'||typeof port.cancelScope!=='function')throw new Error('Android scanner bridge is unavailable');
  return new NativeSourceAccess(port);
}

export function createAndroidClueReader():NativeHeaderReader {
  const port=NativeModules.ArchivistScanner as NativeHeaderPort|undefined;
  if(Platform.OS!=='android'||!port||typeof port.beginScope!=='function'||typeof port.readHeader!=='function'||typeof port.cancelScope!=='function')throw new Error('Android scanner header bridge is unavailable');
  return new NativeHeaderReader(port);
}
export function createAndroidArchiveReader():NativeArchiveReader {
  const port=NativeModules.ArchivistScanner as NativeArchivePort|undefined;
  if(Platform.OS!=='android'||!port||typeof port.beginScope!=='function'||typeof port.readArchiveClues!=='function'||typeof port.cancelScope!=='function')throw new Error('Android scanner archive bridge is unavailable');
  return new NativeArchiveReader(port);
}
export function createAndroidArtworkReader():NativeArtworkReader {
  const port=NativeModules.ArchivistScanner as NativeArtworkPort|undefined;
  if(Platform.OS!=='android'||!port||typeof port.beginScope!=='function'||typeof port.readArtwork!=='function'||typeof port.cancelScope!=='function')throw new Error('Android scanner artwork bridge is unavailable');
  return new NativeArtworkReader(port);
}
