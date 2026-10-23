package app.archivist.reader;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import java.io.*;
import android.system.Os;
import java.security.MessageDigest;

/** Runs only inside the finite native worker pool; never decodes on the UI thread. */
public final class ScannerArtworkReader {
  private static final int MAX_BYTES=4194304,MAX_FILES=2048,MAX_THUMB_BYTES=1048576;
  private static final long MAX_CACHE_BYTES=268435456;
  public static final class Artwork {
    public final String uri,sha256,thumbnailUri;public final int bytes,width,height,thumbnailWidth,thumbnailHeight;
    Artwork(File file,String hash,int bytes,int width,int height,File thumbnail,int thumbnailWidth,int thumbnailHeight){this.uri=Uri.fromFile(file).toString();this.sha256=hash;this.bytes=bytes;this.width=width;this.height=height;this.thumbnailUri=Uri.fromFile(thumbnail).toString();this.thumbnailWidth=thumbnailWidth;this.thumbnailHeight=thumbnailHeight;}
  }
  private ScannerArtworkReader(){}
  private static final class Thumbnail {final File file;final int width,height;Thumbnail(File file,int width,int height){this.file=file;this.width=width;this.height=height;}}
  private static Thumbnail thumbnail(File source,File cache,String hash,ScannerTaskPool.Token token)throws Exception{
    File destination=new File(cache,hash+".thumb.jpg");if(destination.isFile()){BitmapFactory.Options known=new BitmapFactory.Options();known.inJustDecodeBounds=true;BitmapFactory.decodeFile(destination.getAbsolutePath(),known);if(destination.length()>0&&destination.length()<=MAX_THUMB_BYTES&&known.outWidth>0&&known.outHeight>0&&Math.max(known.outWidth,known.outHeight)<=512)return new Thumbnail(destination,known.outWidth,known.outHeight);destination.delete();}
    BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(source.getAbsolutePath(),bounds);token.check();
    int sample=1;while(Math.max((bounds.outWidth+sample-1)/sample,(bounds.outHeight+sample-1)/sample)>512)sample*=2;
    BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=sample;options.inPreferredConfig=Bitmap.Config.RGB_565;
    Bitmap decoded=BitmapFactory.decodeFile(source.getAbsolutePath(),options);if(decoded==null)throw new IOException("Artwork thumbnail decode failed");
    Bitmap scaled=null;File temporary=File.createTempFile("art-thumb-",".tmp",cache);
    try{
      token.check();int targetWidth=decoded.getWidth(),targetHeight=decoded.getHeight();float scale=Math.min(1f,512f/Math.max(targetWidth,targetHeight));
      if(scale<1f){scaled=Bitmap.createScaledBitmap(decoded,Math.max(1,Math.round(targetWidth*scale)),Math.max(1,Math.round(targetHeight*scale)),true);}
      Bitmap output=scaled==null?decoded:scaled;try(FileOutputStream stream=new FileOutputStream(temporary)){if(!output.compress(Bitmap.CompressFormat.JPEG,82,stream))throw new IOException("Artwork thumbnail encode failed");stream.flush();stream.getFD().sync();}
      token.check();if(temporary.length()<1||temporary.length()>MAX_THUMB_BYTES)throw new IOException("Artwork thumbnail byte budget exceeded");
      BitmapFactory.Options verify=new BitmapFactory.Options();verify.inJustDecodeBounds=true;BitmapFactory.decodeFile(temporary.getAbsolutePath(),verify);token.check();
      if(verify.outWidth<1||verify.outHeight<1||Math.max(verify.outWidth,verify.outHeight)>512)throw new IOException("Artwork thumbnail verification failed");
      synchronized(ScannerArtworkReader.class){ensureCapacity(cache,hash,0,0);Os.rename(temporary.getAbsolutePath(),destination.getAbsolutePath());}temporary=null;return new Thumbnail(destination,verify.outWidth,verify.outHeight);
    }finally{decoded.recycle();if(scaled!=null)scaled.recycle();if(temporary!=null)temporary.delete();}
  }
  private static boolean managedCacheName(String name,String hash){return name.equals(hash+".png")||name.equals(hash+".jpg")||name.equals(hash+".thumb.jpg");}
  /** Evicts only old hash-named generated covers and their thumbnails, never inputs or temp files. */
  private static void ensureCapacity(File cache,String protectedHash,long additionalBytes,int additionalFiles)throws IOException{
    File[] files=cache.listFiles();if(files==null)throw new IOException("Artwork cache unavailable");long bytes=0;for(File file:files)bytes+=file.length();int count=files.length;
    while(count+additionalFiles>MAX_FILES||bytes+additionalBytes>MAX_CACHE_BYTES){
      java.util.TreeMap<String,Long> oldest=new java.util.TreeMap<>();for(File file:files){String name=file.getName();String hash=null;if(name.matches("[a-f0-9]{64}\\.png")||name.matches("[a-f0-9]{64}\\.jpg"))hash=name.substring(0,64);else if(name.matches("[a-f0-9]{64}\\.thumb\\.jpg"))hash=name.substring(0,64);if(hash!=null&&!hash.equals(protectedHash)){Long seen=oldest.get(hash);if(seen==null||file.lastModified()<seen)oldest.put(hash,file.lastModified());}}
      if(oldest.isEmpty())throw new IOException("Artwork cache file or byte budget exceeded");String victim=null;long modified=Long.MAX_VALUE;for(java.util.Map.Entry<String,Long> entry:oldest.entrySet())if(entry.getValue()<modified){victim=entry.getKey();modified=entry.getValue();}if(victim==null)throw new IOException("Artwork cache budget exceeded");
      boolean removed=false;for(File file:files)if(managedCacheName(file.getName(),victim)){long size=file.length();if(file.delete()){count--;bytes-=size;removed=true;}}if(!removed)throw new IOException("Artwork cache eviction failed");files=cache.listFiles();if(files==null)throw new IOException("Artwork cache unavailable");
    }
  }
  private static boolean cachedFullValid(File file,int width,int height){if(!file.isFile()||file.length()<1)return false;BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(file.getAbsolutePath(),bounds);return bounds.outWidth==width&&bounds.outHeight==height;}
  public static Artwork read(ScannerBoundedIO.Opener opener,File cache,ScannerTaskPool.Token token)throws Exception{
    token.check();if(!cache.isDirectory()&&!cache.mkdirs())throw new IOException("Artwork cache unavailable");
    File temporary=File.createTempFile("artwork-",".tmp",cache);int total=0;
    try{
      MessageDigest digest=MessageDigest.getInstance("SHA-256");byte[] buffer=new byte[8192];
      try(InputStream input=opener.open(token);OutputStream output=new FileOutputStream(temporary)){
        if(input==null)throw new IOException("Artwork source unavailable");token.check();
        while(true){token.check();int count=input.read(buffer,0,Math.min(buffer.length,MAX_BYTES-total+1));token.check();if(count<0)break;if(count==0)throw new IOException("Artwork stream made no progress");total+=count;if(total>MAX_BYTES)throw new IOException("Artwork byte budget exceeded");digest.update(buffer,0,count);output.write(buffer,0,count);}
      }
      token.check();if(total<24)throw new IOException("Artwork is too short");
      boolean png,jpeg;try(RandomAccessFile file=new RandomAccessFile(temporary,"r")){byte[] signature=new byte[8];file.readFully(signature);png=signature[0]==(byte)137&&signature[1]==80&&signature[2]==78&&signature[3]==71&&signature[4]==13&&signature[5]==10&&signature[6]==26&&signature[7]==10;file.seek(total-2);jpeg=signature[0]==(byte)255&&signature[1]==(byte)216&&file.readUnsignedByte()==255&&file.readUnsignedByte()==217;}
      if(!png&&!jpeg)throw new IOException("Unsupported or corrupt artwork");
      BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(temporary.getAbsolutePath(),bounds);token.check();
      int width=bounds.outWidth,height=bounds.outHeight;if(width<64||height<64||(long)width*height>16777216)throw new IOException("Artwork pixel budget exceeded");
      BitmapFactory.Options decode=new BitmapFactory.Options();decode.inPreferredConfig=Bitmap.Config.RGB_565;
      Bitmap bitmap=BitmapFactory.decodeFile(temporary.getAbsolutePath(),decode);if(bitmap==null)throw new IOException("Artwork cannot be decoded");try{token.check();if(bitmap.getWidth()!=width||bitmap.getHeight()!=height)throw new IOException("Artwork dimensions changed");}finally{bitmap.recycle();}
      StringBuilder hash=new StringBuilder();for(byte value:digest.digest())hash.append(String.format(java.util.Locale.ROOT,"%02x",value&255));File destination=new File(cache,hash+(png?".png":".jpg"));
      synchronized(ScannerArtworkReader.class){
        token.check();boolean reuse=cachedFullValid(destination,width,height);if(reuse){if(!temporary.delete())throw new IOException("Artwork staging cleanup failed");}else{if(destination.exists()&&!destination.delete())throw new IOException("Artwork cache replacement failed");File thumb=new File(cache,hash+".thumb.jpg");int filesNeeded=thumb.isFile()?0:1;ensureCapacity(cache,hash.toString(),thumb.isFile()?0:MAX_THUMB_BYTES,filesNeeded);Os.rename(temporary.getAbsolutePath(),destination.getAbsolutePath());}temporary=null;
      }
      token.check();Thumbnail thumb=thumbnail(destination,cache,hash.toString(),token);token.check();return new Artwork(destination,hash.toString(),total,width,height,thumb.file,thumb.width,thumb.height);
    }finally{if(temporary!=null)temporary.delete();}
  }
}
