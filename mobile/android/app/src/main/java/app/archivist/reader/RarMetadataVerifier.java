package app.archivist.reader;

import com.github.junrar.Archive;
import com.github.junrar.rarfile.FileHeader;
import java.io.*;
import java.security.MessageDigest;
import java.util.*;

/** Decompression-only validation; the independent container writer lives in rarCopy.ts. */
public final class RarMetadataVerifier {
 private static final long ENTRY=64L*1024*1024,TOTAL=256L*1024*1024;
 private static String name(FileHeader h){return h.getFileName().replace('\\','/');}
 private static boolean metadata(String n){return n.matches("(?i)(.*/)?ComicInfo\\.xml");}
 public static byte[] readMetadata(File file,String expected)throws Exception{
  try(Archive archive=new Archive(file)){
   for(FileHeader h:archive.getFileHeaders())if(metadata(name(h))){
    if(!name(h).equals(expected)||h.getFullUnpackSize()>2*1024*1024)throw new IOException("Ambiguous RAR metadata");
    ByteArrayOutputStream output=new ByteArrayOutputStream();try(InputStream input=archive.getInputStream(h)){byte[] b=new byte[32768];int n;while((n=input.read(b))!=-1){if(output.size()+n>2*1024*1024)throw new IOException("Metadata limit");output.write(b,0,n);}}return output.toByteArray();
   }
  }throw new IOException("Metadata entry missing");
 }
 private static Map<String,String> fingerprints(File file)throws Exception{
  Map<String,String> result=new TreeMap<>();long total=0;
  try(Archive archive=new Archive(file)){
   int count=0;for(FileHeader h:archive.getFileHeaders()){
    if(++count>5000||h.isEncrypted())throw new IOException("Unsupported RAR entry");String name=name(h);if(h.isDirectory()||metadata(name))continue;
    if(h.getFullUnpackSize()<0||h.getFullUnpackSize()>ENTRY)throw new IOException("RAR entry limit");
    MessageDigest hash=MessageDigest.getInstance("SHA-256");long size=0;
    try(InputStream in=archive.getInputStream(h)){byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1){size+=n;total+=n;if(size>ENTRY||total>TOTAL)throw new IOException("RAR expansion limit");hash.update(b,0,n);}}
    if(size!=h.getFullUnpackSize()||result.put(name,size+":"+Arrays.toString(hash.digest()))!=null)throw new IOException("RAR payload mismatch");
   }
  }if(result.isEmpty())throw new IOException("RAR has no content");return result;
 }
 public static void verify(File original,File updated)throws Exception{
  if(!fingerprints(original).equals(fingerprints(updated)))throw new IOException("RAR contents changed");
  byte[] xml=readMetadata(updated,"ComicInfo.xml");if(xml.length==0)throw new IOException("Metadata missing");
 }
}

