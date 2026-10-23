package app.archivist.reader;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.CancellationException;

/** Bounded selected-member access to the bundled 7-Zip-JBinding engine. */
public final class ScannerSevenZipReader {
 private static final long MAX_ARCHIVE_BYTES=256L*1024*1024;
 private static final int MAX_ENTRIES=10000,MAX_LISTED_IMAGES=500,MAX_ENTRY_NAME_CHARS=1024,MAX_METADATA_BYTES=262144,MAX_IMAGE_BYTES=16*1024*1024;
 private ScannerSevenZipReader(){}

 public static final class Failure extends IOException {
  public final String reason;
  Failure(String reason,Throwable cause){super(reason,cause);this.reason=reason;}
  Failure(String reason){super(reason);this.reason=reason;}
 }
 private interface Work<T>{T run(Archive archive)throws Exception;}
 private static final class Archive {
  final Object raf,inStream,inArchive,simple;final Class<?> itemType;final Object[] items;
  Archive(Object raf,Object inStream,Object inArchive,Object simple,Class<?> itemType,Object[] items){this.raf=raf;this.inStream=inStream;this.inArchive=inArchive;this.simple=simple;this.itemType=itemType;this.items=items;}
  public void close(){closeObject(inArchive);closeObject(inStream);closeObject(raf);}
 }

 public static List<String> listImages(File file,ScannerTaskPool.Token token)throws Exception{
  return withArchive(file,token,archive->{ArrayList<String> names=new ArrayList<>();Set<String> seen=new HashSet<>();for(Object item:archive.items){token.check();if(isFolder(archive,item))continue;String name=path(archive,item);if(!isSafeEntryName(name)||name.toLowerCase(Locale.ROOT).startsWith("__macosx/")||!isImageName(name))continue;if(!seen.add(name))throw new Failure("7z-image-ambiguous");names.add(name);if(names.size()>MAX_LISTED_IMAGES)throw new Failure("7z-image-list-budget");}names.sort(Comparator.comparing((String value)->value.toLowerCase(Locale.ROOT)).thenComparing(value->value));return names;});
 }

 /** Extracts an explicitly selected image, capped at 16 MiB. */
 public static byte[] readImage(File file,String name,ScannerTaskPool.Token token)throws Exception{return readImage(file,name,token,MAX_IMAGE_BYTES);}

 public static byte[] readImage(File file,String name,ScannerTaskPool.Token token,int byteLimit)throws Exception{
  if(byteLimit<1||byteLimit>MAX_IMAGE_BYTES||!isSafeEntryName(name)||name.toLowerCase(Locale.ROOT).startsWith("__macosx/")||!isImageName(name))throw new Failure("7z-entry-invalid");
  return withArchive(file,token,archive->{Object selected=null;for(Object item:archive.items){token.check();if(isFolder(archive,item))continue;if(name.equals(path(archive,item))){if(selected!=null)throw new Failure("7z-entry-ambiguous");selected=item;}}if(selected==null)throw new Failure("7z-entry-missing");if(isEncrypted(archive,selected))throw new Failure("7z-entry-encrypted");return extract(archive,selected,token,byteLimit);});
 }

 /** Returns the first safe, sorted JPG/JPEG/PNG member capped at 4 MiB. */
 public static byte[] readCover(File file,ScannerTaskPool.Token token)throws Exception{
  return withArchive(file,token,archive->{ArrayList<Object> candidates=new ArrayList<>();Set<String> seen=new HashSet<>();for(Object item:archive.items){token.check();if(isFolder(archive,item))continue;String name=path(archive,item),lower=name.toLowerCase(Locale.ROOT);if(!isSafeEntryName(name)||lower.startsWith("__macosx/")||!lower.matches(".*\\.(jpg|jpeg|png)$"))continue;if(!seen.add(name))throw new Failure("7z-image-ambiguous");candidates.add(item);}candidates.sort(Comparator.comparing((Object item)->safeSortPath(archive,item).toLowerCase(Locale.ROOT)).thenComparing(item->safeSortPath(archive,item)));if(candidates.isEmpty())throw new Failure("7z-cover-missing");Object selected=candidates.get(0);if(isEncrypted(archive,selected))throw new Failure("7z-entry-encrypted");return extract(archive,selected,token,4*1024*1024);});
 }

 public static byte[] readComicInfo(File file,ScannerTaskPool.Token token)throws Exception{
  return withArchive(file,token,archive->{Object selected=null;for(Object item:archive.items){token.check();if(isFolder(archive,item))continue;String name=path(archive,item),normalized=name==null?"":name.replace('\\','/').toLowerCase(Locale.ROOT);if(!normalized.matches("(?:.*/)?comicinfo\\.xml"))continue;if(!isSafeEntryName(name))throw new Failure("7z-entry-unsafe");if(selected!=null)throw new Failure("7z-metadata-ambiguous");selected=item;}if(selected==null)throw new Failure("archive-metadata-missing");if(isEncrypted(archive,selected))throw new Failure("7z-entry-encrypted");return extract(archive,selected,token,MAX_METADATA_BYTES);});
 }

 /** Reads at most two sorted comic images without staging or reopening the archive per image. */
 public static List<byte[]> readFirstImages(File file,ScannerTaskPool.Token token,int maxPages,int totalLimit)throws Exception{
  if(maxPages<1||maxPages>2||totalLimit<1||totalLimit>4*1024*1024)throw new Failure("7z-page-budget");
  return withArchive(file,token,archive->{ArrayList<Object> candidates=new ArrayList<>();Set<String> seen=new HashSet<>();for(Object item:archive.items){token.check();if(isFolder(archive,item))continue;String name=path(archive,item),lower=name.toLowerCase(Locale.ROOT);if(!isSafeEntryName(name)||lower.startsWith("__macosx/")||!lower.matches(".*\\.(jpg|jpeg|png)$"))continue;if(!seen.add(name))throw new Failure("7z-image-ambiguous");candidates.add(item);}candidates.sort(Comparator.comparing((Object item)->safeSortPath(archive,item).toLowerCase(Locale.ROOT)).thenComparing(item->safeSortPath(archive,item)));ArrayList<byte[]> result=new ArrayList<>();int used=0;for(Object item:candidates){token.check();if(result.size()>=maxPages)break;if(isEncrypted(archive,item))throw new Failure("7z-entry-encrypted");byte[] bytes=extract(archive,item,token,totalLimit-used);result.add(bytes);used+=bytes.length;}return result;});
 }

 private static <T>T withArchive(File file,ScannerTaskPool.Token token,Work<T> work)throws Exception{
  token.check();if(file==null||!file.isFile())throw new Failure("7z-source-invalid");long size=file.length();if(size<8||size>MAX_ARCHIVE_BYTES)throw new Failure("7z-archive-budget");RandomAccessFile raf=null;Object inStream=null,inArchive=null;
  try{
   raf=new RandomAccessFile(file,"r");Class<?> inStreamType=Class.forName("net.sf.sevenzipjbinding.IInStream"),formatType=Class.forName("net.sf.sevenzipjbinding.ArchiveFormat"),inArchiveType=Class.forName("net.sf.sevenzipjbinding.IInArchive");Class<?> randomStreamType=Class.forName("net.sf.sevenzipjbinding.impl.RandomAccessFileInStream"),sevenZipType=Class.forName("net.sf.sevenzipjbinding.SevenZip");inStream=randomStreamType.getConstructor(RandomAccessFile.class).newInstance(raf);Method open=sevenZipType.getMethod("openInArchive",formatType,inStreamType);inArchive=open.invoke(null,null,inStream);token.check();Object simple=inArchiveType.getMethod("getSimpleInterface").invoke(inArchive);Class<?> simpleType=Class.forName("net.sf.sevenzipjbinding.simple.ISimpleInArchive"),itemType=Class.forName("net.sf.sevenzipjbinding.simple.ISimpleInArchiveItem");int itemCount=(Integer)simpleType.getMethod("getNumberOfItems").invoke(simple);if(itemCount<0||itemCount>MAX_ENTRIES)throw new Failure("7z-entry-budget");Object[] items=(Object[])simpleType.getMethod("getArchiveItems").invoke(simple);if(items==null||items.length!=itemCount)throw new Failure("7z-archive-invalid");token.check();return work.run(new Archive(raf,inStream,inArchive,simple,itemType,items));
  }catch(Failure|CancellationException error){throw error;}
  catch(ClassNotFoundException|NoSuchMethodException|LinkageError error){throw new Failure("7z-engine-unavailable",error);}
  catch(InvocationTargetException error){if(token.isCancelled())throw new CancellationException("Archive read cancelled");Throwable cause=unwrap(error.getCause());if(cause instanceof CancellationException)throw (CancellationException)cause;if(cause instanceof Failure)throw (Failure)cause;if(isEngineUnavailable(cause))throw new Failure("7z-engine-unavailable",cause);throw new Failure("7z-archive-invalid",cause);}
  catch(Exception error){if(token.isCancelled())throw new CancellationException("Archive read cancelled");if(isEngineUnavailable(error))throw new Failure("7z-engine-unavailable",error);throw new Failure("7z-archive-invalid",error);}
  finally{closeObject(inArchive);closeObject(inStream);closeObject(raf);}
 }
 private static byte[] extract(Archive archive,Object item,ScannerTaskPool.Token token,int limit)throws Exception{
  Long declared=(Long)archive.itemType.getMethod("getSize").invoke(item);if(declared==null||declared<1||declared>limit)throw new Failure("7z-entry-budget");ByteArrayOutputStream output=new ByteArrayOutputStream(declared.intValue());boolean[] exceeded={false};Class<?> outputType=Class.forName("net.sf.sevenzipjbinding.ISequentialOutStream");Object sink=Proxy.newProxyInstance(ScannerSevenZipReader.class.getClassLoader(),new Class<?>[]{outputType},new InvocationHandler(){public Object invoke(Object proxy,Method method,Object[] args){if("write".equals(method.getName())){token.check();byte[] chunk=(byte[])args[0];if(chunk==null||(long)output.size()+chunk.length>limit){exceeded[0]=true;return 0;}output.write(chunk,0,chunk.length);return chunk.length;}if("toString".equals(method.getName()))return "ScannerSevenZipBoundedOutput";if("hashCode".equals(method.getName()))return System.identityHashCode(proxy);if("equals".equals(method.getName()))return proxy==args[0];return null;}});Object result;
  try{result=archive.itemType.getMethod("extractSlow",outputType).invoke(item,sink);}catch(InvocationTargetException error){if(token.isCancelled())throw new CancellationException("Archive read cancelled");if(exceeded[0])throw new Failure("7z-entry-budget",unwrap(error.getCause()));throw error;}token.check();if(exceeded[0])throw new Failure("7z-entry-budget");if(!"OK".equals(String.valueOf(result)))throw new Failure("7z-extraction-invalid");byte[] bytes=output.toByteArray();if(bytes.length!=declared)throw new Failure("7z-extraction-invalid");return bytes;
 } private static boolean isFolder(Archive archive,Object item)throws Exception{return (Boolean)archive.itemType.getMethod("isFolder").invoke(item);}
 private static boolean isEncrypted(Archive archive,Object item)throws Exception{return (Boolean)archive.itemType.getMethod("isEncrypted").invoke(item);}
 private static String path(Archive archive,Object item)throws Exception{return (String)archive.itemType.getMethod("getPath").invoke(item);}
 private static String safeSortPath(Archive archive,Object item){try{return path(archive,item);}catch(Exception ignored){return "";}}
 private static boolean isImageName(String name){return name.toLowerCase(Locale.ROOT).matches(".*\\.(jpg|jpeg|png|gif|webp)$");}
 private static boolean isSafeEntryName(String name){if(name==null||name.isEmpty()||name.length()>MAX_ENTRY_NAME_CHARS||name.startsWith("/")||name.startsWith("\\")||name.indexOf('\\')>=0||name.indexOf(':')>=0||name.indexOf('\0')>=0)return false;for(int i=0;i<name.length();i++)if(Character.isISOControl(name.charAt(i)))return false;for(String part:name.split("/"))if(part.isEmpty()||part.equals(".")||part.equals(".."))return false;return true;}
 private static boolean isEngineUnavailable(Throwable error){for(Throwable current=error;current!=null;current=current.getCause()){String name=current.getClass().getName().toLowerCase(Locale.ROOT),message=String.valueOf(current.getMessage()).toLowerCase(Locale.ROOT);if(current instanceof LinkageError||name.contains("nativeinitialization")||message.contains("native library")||message.contains("native method")||message.contains("platform library"))return true;}return false;}
 private static Throwable unwrap(Throwable error){while(error instanceof InvocationTargetException||error instanceof java.lang.reflect.UndeclaredThrowableException){Throwable next=error instanceof InvocationTargetException?((InvocationTargetException)error).getCause():((java.lang.reflect.UndeclaredThrowableException)error).getUndeclaredThrowable();if(next==null||next==error)break;error=next;}return error;}
 private static void closeObject(Object value){if(value==null)return;try{value.getClass().getMethod("close").invoke(value);}catch(Exception ignored){}}
}