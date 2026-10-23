package app.archivist.reader;

import java.io.ByteArrayOutputStream;
import java.io.RandomAccessFile;
import net.sf.sevenzipjbinding.ExtractOperationResult;
import net.sf.sevenzipjbinding.IInArchive;
import net.sf.sevenzipjbinding.ISequentialOutStream;
import net.sf.sevenzipjbinding.SevenZip;
import net.sf.sevenzipjbinding.impl.RandomAccessFileInStream;
import net.sf.sevenzipjbinding.simple.ISimpleInArchiveItem;

/** Compile-only contract check for the cached Android 7-Zip-JBinding API. */
final class ScannerSevenZipApiCompileTest {
 static IInArchive open(RandomAccessFile source)throws Exception{return SevenZip.openInArchive(null,new RandomAccessFileInStream(source));}
 static byte[] extract(ISimpleInArchiveItem item,ScannerTaskPool.Token token)throws Exception{
  ByteArrayOutputStream output=new ByteArrayOutputStream();ISequentialOutStream sink=data->{token.check();output.write(data,0,data.length);return data.length;};
  if(item.isFolder()||item.isEncrypted()||item.getPath()==null||item.getSize()==null)throw new IllegalStateException("Invalid entry");
  if(item.extractSlow(sink)!=ExtractOperationResult.OK)throw new IllegalStateException("Extraction failed");return output.toByteArray();
 }
}