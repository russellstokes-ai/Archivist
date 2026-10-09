package app.archivist.reader;

import java.io.*;

public final class ScannerBoundedIO {
  public interface Opener { InputStream open(ScannerTaskPool.Token token) throws Exception; }
  public interface SeekableOpener { FileInputStream open(ScannerTaskPool.Token token) throws Exception; }
  public static final class Header {
    public final byte[] bytes;public final boolean budgetReached;public final long offset;
    Header(byte[] bytes,boolean budgetReached){this(bytes,budgetReached,-1);}
    Header(byte[] bytes,boolean budgetReached,long offset){this.bytes=bytes;this.budgetReached=budgetReached;this.offset=offset;}
  }
  private ScannerBoundedIO(){}
  /** Own the stream before checking cancellation, so a late successful open is still closed. */
  public static Header readHeader(Opener opener,int byteBudget,ScannerTaskPool.Token token)throws Exception{
    if(byteBudget<1||byteBudget>65536)throw new IllegalArgumentException("Header budget must be 1..65536 bytes");
    token.check();
    try(InputStream input=opener.open(token)){
      if(input==null)throw new IOException("Provider returned no readable stream");
      return readOwned(input,byteBudget,token);
    }
  }
  /** A non-seekable provider is an explicit failure; never copy or skip whole media. */
  public static Header readRange(SeekableOpener opener,long offset,int byteBudget,ScannerTaskPool.Token token)throws Exception{
    if(offset<0||offset>8796093022208L)throw new IllegalArgumentException("Invalid metadata seek offset");
    if(byteBudget<1||byteBudget>65536)throw new IllegalArgumentException("Range budget must be 1..65536 bytes");
    token.check();
    try(FileInputStream input=opener.open(token)){
      if(input==null)throw new IOException("Provider returned no readable descriptor");
      token.check();input.getChannel().position(offset);token.check();
      Header result=readOwned(input,byteBudget,token);return new Header(result.bytes,result.budgetReached,offset);
    }
  }
  private static Header readOwned(InputStream input,int byteBudget,ScannerTaskPool.Token token)throws Exception{
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
