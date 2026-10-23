package app.archivist.reader;

import android.graphics.*;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import com.google.android.gms.tasks.Tasks;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import java.io.*;
import java.util.*;

/** Read-only R4 lane. One quarantinable worker, at most three 1600px pages.
 * A stuck decoder/OCR task retains its worker and bitmap; no replacement loop.
 * Text and image hashes stay on-device; only bibliographic clues leave the app.
 */
public final class ScannerDeepReader {
 public static final class Facts {public String text="",coverHash="";public int pageCount;}
 private ScannerDeepReader(){}
 public static Facts read(ScannerBoundedIO.SeekableOpener opener,String container,ScannerTaskPool.Token token)throws Exception{
  Facts facts=new Facts();
  if("pdf".equals(container)){
   try(FileInputStream stream=opener.open(token);ParcelFileDescriptor descriptor=ParcelFileDescriptor.dup(stream.getFD());PdfRenderer renderer=new PdfRenderer(descriptor)){
    token.check();facts.pageCount=renderer.getPageCount();
    for(int n=0;n<Math.min(3,facts.pageCount);n++){
     token.check();try(PdfRenderer.Page page=renderer.openPage(n)){
      double scale=Math.min(1.0,1600.0/Math.max(page.getWidth(),page.getHeight()));
      int w=Math.max(1,(int)(page.getWidth()*scale)),h=Math.max(1,(int)(page.getHeight()*scale));
      Bitmap image=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);
      try{image.eraseColor(Color.WHITE);page.render(image,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);token.check();if(n==0)facts.coverHash=hash(image);facts.text=bounded(facts.text+"\n"+ocr(image,token));}finally{image.recycle();}
     }
    }
   }
  }else if(Arrays.asList("cbz","zip","epub","cb7").contains(container)){
   ScannerArchiveReader.PageEvidence evidence=ScannerArchiveReader.readEvidencePages(opener,token);
   facts.text=bounded(evidence.text);
   for(byte[] bytes:evidence.images){
    token.check();Bitmap image=decode(bytes);
    try{if(facts.coverHash.isEmpty())facts.coverHash=hash(image);facts.text=bounded(facts.text+"\n"+ocr(image,token));facts.pageCount++;}finally{image.recycle();}
   }
  }else throw new IOException("Deep page reader unavailable for this container");
  token.check();return facts;
 }
 private static String bounded(String value){return value.length()>16384?value.substring(0,16384):value;}
 private static String ocr(Bitmap bitmap,ScannerTaskPool.Token token)throws Exception{
  token.check();try(TextRecognizer reader=TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)){
   // Do not recycle input while ML Kit still owns it. The outer native pool
   // reports a deadline and quarantines this lane if the engine never returns.
   String text=Tasks.await(reader.process(InputImage.fromBitmap(bitmap,0))).getText();token.check();return bounded(text);
  }
 }
 private static Bitmap decode(byte[] bytes)throws IOException{
  if(bytes==null||bytes.length>4194304)throw new IOException("Image byte budget");
  BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(bytes,0,bytes.length,bounds);
  if(bounds.outWidth<128||bounds.outHeight<128||(long)bounds.outWidth*bounds.outHeight>16777216)throw new IOException("Image dimensions unsupported");
  BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=1;while(Math.max(bounds.outWidth,bounds.outHeight)/options.inSampleSize>1600)options.inSampleSize*=2;
  Bitmap bitmap=BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);if(bitmap==null)throw new IOException("Image decode failed");return bitmap;
 }
 public static String hashFile(File file,ScannerTaskPool.Token token)throws Exception{
  if(file.length()>4194304)throw new IOException("Image byte budget");byte[] bytes;
  try(InputStream input=new FileInputStream(file);ByteArrayOutputStream out=new ByteArrayOutputStream()){
   byte[] buffer=new byte[8192];int n;while((n=input.read(buffer))!=-1){token.check();if(n==0||out.size()+n>4194304)throw new IOException("Image byte budget");out.write(buffer,0,n);}bytes=out.toByteArray();
  }
  Bitmap bitmap=decode(bytes);try{return hash(bitmap);}finally{bitmap.recycle();}
 }
 /** 64-bit difference hash; flat/placeholder images do not yield evidence. */
 private static String hash(Bitmap source){
  Bitmap small=Bitmap.createScaledBitmap(source,9,8,true);try{
   int[] pixels=new int[72],gray=new int[72];small.getPixels(pixels,0,9,0,0,9,8);long sum=0,squares=0,bits=0;
   for(int i=0;i<72;i++){int p=pixels[i];gray[i]=(Color.red(p)*299+Color.green(p)*587+Color.blue(p)*114)/1000;sum+=gray[i];squares+=(long)gray[i]*gray[i];}
   if(squares/72.0-Math.pow(sum/72.0,2)<100)return "";
   for(int y=0;y<8;y++)for(int x=0;x<8;x++)bits=(bits<<1)|(gray[y*9+x]>gray[y*9+x+1]?1L:0L);
   return String.format(Locale.ROOT,"%016x",bits);
  }finally{if(small!=source)small.recycle();}
 }
}
