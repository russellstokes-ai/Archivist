// Real-media regression. JAVA, FFMPEG and AUDIO_TAGGER_JAR may point at pinned local tools.
const fs=require('fs'),cp=require('child_process'),path=require('path'),os=require('os'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'archivist-audio-'));
const ff=process.env.FFMPEG||'ffmpeg',java=process.env.JAVA||'java',javac=process.env.JAVAC||'javac',jar=process.env.AUDIO_TAGGER_JAR;
if(!jar)throw Error('AUDIO_TAGGER_JAR is required');
const run=(cmd,args)=>cp.execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
try{
 const source=path.join(root,'android/app/src/main/java/app/archivist/reader');
 run(javac,['-cp',jar,'-d',temp,...['Id3MetadataWriter','Mp4MetadataWriter','AudioMetadataWriter'].map(n=>path.join(source,n+'.java')),path.join(__dirname,'AudioMetadataHarness.java')]);
 const formats={mp3:['libmp3lame','mp3'],m4a:['aac','ipod'],m4b:['aac','ipod'],aac:['aac','adts'],flac:['flac','flac'],ogg:['libvorbis','ogg'],opus:['libopus','opus'],wav:['pcm_s16le','wav'],wma:['wmav2','asf']};
 const write=file=>run(java,['-cp',temp+path.delimiter+jar,'AudioMetadataHarness',file]);
 const audio=file=>run(ff,['-v','error','-i',file,'-map','0:a','-f','hash','-hash','sha256','-']);
 const chapters=file=>run(ff,['-v','error','-i',file,'-f','ffmetadata','-']).split('[CHAPTER]').slice(1);
 for(const [ext,[codec,format]]of Object.entries(formats)){const file=path.join(temp,'sample.'+ext);run(ff,['-v','error','-y','-f','lavfi','-i','sine=frequency=440:duration=2','-c:a',codec,'-f',format,file]);const before=audio(file);write(file);assert.equal(audio(file),before,ext+' audio changed');console.log('PASS '+ext+' tag round-trip and identical decoded audio');}
 const description=path.join(temp,'chapters.txt');fs.writeFileSync(description,';FFMETADATA1\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=0\nEND=1000\ntitle=Opening\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=1000\nEND=2000\ntitle=Second chapter\n');
 for(const ext of ['mp3','m4b']){const file=path.join(temp,'chaptered.'+ext);run(ff,['-v','error','-y','-i',path.join(temp,'sample.'+ext),'-i',description,'-map_metadata','1','-map_chapters','1','-c','copy',file]);const before=chapters(file),hash=audio(file);assert.equal(before.length,2);write(file);assert.deepEqual(chapters(file),before);assert.equal(audio(file),hash);write(file);assert.deepEqual(chapters(file),before);assert.equal(audio(file),hash);console.log('PASS '+ext+' chapter names, times and audio preserved across repeated writes');}
}finally{fs.rmSync(temp,{recursive:true,force:true});}
