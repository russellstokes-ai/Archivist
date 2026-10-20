import app.archivist.reader.RarMetadataVerifier;
import java.io.File;
import java.nio.charset.StandardCharsets;
public class RarHarness {
 public static void main(String[] args)throws Exception{
  RarMetadataVerifier.verify(new File(args[0]),new File(args[1]));
  String xml=new String(RarMetadataVerifier.readMetadata(new File(args[1]),"ComicInfo.xml"),StandardCharsets.UTF_8);
  if(!xml.contains("<Title>Updated</Title>")||!xml.contains("<Genre>Science Fiction</Genre>")||!xml.contains("<Year>1978</Year>"))throw new AssertionError("Metadata did not round-trip");
  System.out.println("PASS independent Junrar extraction, page hashes and metadata readback");
 }
}
