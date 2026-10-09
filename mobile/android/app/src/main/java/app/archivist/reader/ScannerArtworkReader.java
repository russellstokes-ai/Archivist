package app.archivist.reader;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;

/** Runs only inside the finite native worker pool; never decodes on the UI thread. */
public final class ScannerArtworkReader {
  private static final int MAX_BYTES=4194304,MAX_FILES=2048;
  private static final long MAX_CACHE_BYTES=268435456;
  public static final class Artwork {
    public final String uri,sha256;public final int bytes,width,height;
    Artwork(File file,String hash,int bytes,int width,int height){this.uri=Uri.fromFile(file).toString();this.sha256=hash;this.bytes=bytes;this.width=width;this.height=height;}
  }
  private ScannerArtworkReader(){}
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
        token.check();File[] files=cache.listFiles();if(files==null||files.length>MAX_FILES)throw new IOException("Artwork cache file budget exceeded");long bytes=0;for(File file:files){bytes+=file.length();if(bytes>MAX_CACHE_BYTES)throw new IOException("Artwork cache byte budget exceeded");}
        Files.move(temporary.toPath(),destination.toPath(),StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);temporary=null;
      }
      token.check();return new Artwork(destination,hash.toString(),total,width,height);
    }finally{if(temporary!=null)temporary.delete();}
  }
}
