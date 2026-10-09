package app.archivist.reader;

import java.io.*;

public final class ScannerBoundedIO {
  public interface Opener { InputStream open(ScannerTaskPool.Token token) throws Exception; }
  public static final class Header {
    public final byte[] bytes;public final boolean budgetReached;
    Header(byte[] bytes,boolean budgetReached){this.bytes=bytes;this.budgetReached=budgetReached;}
  }
  private ScannerBoundedIO(){}
  /** Own the stream before checking cancellation, so a late successful open is still closed. */
  public static Header readHeader(Opener opener,int byteBudget,ScannerTaskPool.Token token)throws Exception{
    if(byteBudget<1||byteBudget>65536)throw new IllegalArgumentException("Header budget must be 1..65536 bytes");
    token.check();
    try(InputStream input=opener.open(token)){
      if(input==null)throw new IOException("Provider returned no readable stream");
      token.check();ByteArrayOutputStream output=new ByteArrayOutputStream(Math.min(byteBudget,8192));byte[] buffer=new byte[Math.min(byteBudget,8192)];
      while(output.size()<byteBudget){
        token.check();int read=input.read(buffer,0,Math.min(buffer.length,byteBudget-output.size()));token.check();
        if(read<0)return new Header(output.toByteArray(),false);
        if(read==0)throw new IOException("Provider stream made no progress");
        output.write(buffer,0,read);
      }
      return new Header(output.toByteArray(),true);
    }
  }
}
