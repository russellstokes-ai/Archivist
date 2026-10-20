package app.archivist.reader;

import java.io.File;
import java.util.*;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.images.AndroidArtwork;

/** Edits a private working copy only. Caller must verify media and journal original replacement. */
public final class AudioMetadataWriter {
 private AudioMetadataWriter(){}
 public static void write(File copy,Map<String,String> fields,boolean multipart,byte[] cover,String mime)throws Exception{
  org.jaudiotagger.tag.TagOptionSingleton options=org.jaudiotagger.tag.TagOptionSingleton.getInstance();
  options.setAndroid(true);options.setPreserveFileIdentity(true);
  options.setWavOptions(org.jaudiotagger.audio.wav.WavOptions.READ_ID3_UNLESS_ONLY_INFO_AND_SYNC);
  options.setWavSaveOptions(org.jaudiotagger.audio.wav.WavSaveOptions.SAVE_BOTH_AND_SYNC);
  if(copy.getName().toLowerCase(java.util.Locale.ROOT).endsWith(".aac")){Id3MetadataWriter.write(copy,fields,multipart,cover,mime);return;}
  if(copy.getName().toLowerCase(java.util.Locale.ROOT).endsWith(".mp3")){Id3MetadataWriter.write(copy,fields,multipart,cover,mime);return;}
  if(copy.getName().toLowerCase(java.util.Locale.ROOT).matches(".*\\.m4[ab]$")){Mp4MetadataWriter.write(copy,fields,multipart,cover,mime);return;}
  AudioFile audio=AudioFileIO.read(copy);
  int duration=audio.getAudioHeader().getTrackLength();
  Tag tag=audio.getTagOrCreateAndSetDefault();
  Map<FieldKey,String> updates=new LinkedHashMap<>();
  add(updates,FieldKey.ALBUM,fields.get("title"));
  if(!multipart)add(updates,FieldKey.TITLE,fields.get("title"));
  add(updates,FieldKey.ARTIST,fields.get("author"));
  add(updates,FieldKey.ALBUM_ARTIST,fields.get("author"));
  add(updates,FieldKey.GENRE,fields.get("genre"));
  add(updates,FieldKey.YEAR,fields.get("publishedYear"));
  for(Map.Entry<FieldKey,String> e:updates.entrySet())tag.setField(e.getKey(),e.getValue());
  if(cover!=null){
   if(cover.length==0||cover.length>4194304||!("image/jpeg".equals(mime)||"image/png".equals(mime)))throw new IllegalArgumentException("Unsupported artwork");
   AndroidArtwork artwork=new AndroidArtwork();artwork.setBinaryData(cover);artwork.setMimeType(mime);artwork.setPictureType(3);artwork.setDescription("Cover");tag.setField(artwork);
  }
  audio.commit();AudioFile reread=AudioFileIO.read(copy);
  if(Math.abs(reread.getAudioHeader().getTrackLength()-duration)>1)throw new IllegalStateException("Audio duration changed");
  for(Map.Entry<FieldKey,String> e:updates.entrySet())if(!e.getValue().equals(reread.getTag().getFirst(e.getKey())))throw new IllegalStateException("Metadata verification failed: "+e.getKey());
  if(cover!=null&&!reread.getTag().getArtworkList().stream().anyMatch(a->Arrays.equals(a.getBinaryData(),cover)))throw new IllegalStateException("Artwork verification failed");
 }
 private static void add(Map<FieldKey,String> fields,FieldKey key,String value){if(value!=null&&!value.trim().isEmpty()){if(value.length()>4096||value.indexOf(0)>=0)throw new IllegalArgumentException("Invalid metadata");fields.put(key,value.trim());}}
}
