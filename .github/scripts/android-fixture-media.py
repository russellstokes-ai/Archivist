#!/usr/bin/env python3
"""Generate real, decodable MP3/ID3 audiobook fixtures for an Android SAF scan.

No scanner mocks, no private media, no artificial database rows.
Two 227-file suites intentionally cover two different physical directory layouts.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

from mutagen.id3 import ID3, TALB, TIT2, TPE1, TRCK, TPOS

OUT=Path(sys.argv[1] if len(sys.argv)>1 else "android-media-fixtures").resolve()
OUT.mkdir(parents=True,exist_ok=True)
template=OUT/"seed-audio.mp3"
subprocess.run([
    "ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
    "-f","lavfi","-i","anullsrc=r=22050:cl=mono",
    "-t","0.4","-c:a","libmp3lame","-q:a","9",str(template)
],check=True,timeout=35)

def make(profile:str):
    root=OUT/profile
    count=0
    stats=[]
    for work in range(12):
        book=f"Novel {work+1:02d}"
        author=f"Author {work+1:02d}"
        total=18 if work==11 else 19
        for part in range(1,total+1):
            if profile=="grouped":
                directory=root/author/book
                name=f"{part:02d} - Chapter {part:02d}.mp3"
            else:
                # Non-uniform disc layouts are common in real media collections.
                # Distinct physical subdirectories belong to ONE logical work.
                # This explicitly tests the split that a 12-book/227-file
                # synthetic unit fixture with perfect folders did not catch.
                disc="CD 1" if part<=10 else "CD 2"
                directory=root/author/book/disc
                name=f"{part:02d} - Chapter {part:02d}.mp3"
            directory.mkdir(parents=True,exist_ok=True)
            dest=directory/name
            shutil.copyfile(template,dest)
            if part<=3:album=book
            elif part<=6:album=book+" (Disc 2)"
            elif part<=10:album=f"Chapter {part:02d}"
            elif part<=12:album=f"Disc {2 if part==11 else 3}"
            elif part<=14:album=""
            else:album=book
            tags=ID3()
            tags.add(TIT2(encoding=3,text=f"Chapter {part:02d}"))
            if album: tags.add(TALB(encoding=3,text=album))
            if part%7!=0:tags.add(TPE1(encoding=3,text=author))
            tags.add(TRCK(encoding=3,text=str(part)))
            tags.add(TPOS(encoding=3,text="1" if part<=10 else "2"))
            tags.save(dest,v2_version=3)
            count+=1
        stats.append({"ordinal":work+1,"chapters":total,"expected_works":1})
    assert count==227,count
    return {"profile":profile,"physical_mp3":count,"expected_logical_works":12,
            "real_decodable_mp3":True,"has_actual_id3_tags":True,
            "folders":"author/book" if profile=="grouped" else "author/book/CD 1 or CD 2",
            "work_sizes":stats}

try:
    manifests=[make("grouped"),make("split-discs")]
    template.unlink()
    (OUT/"manifest.json").write_text(json.dumps({"profiles":manifests},indent=2)+"\n")
    for entry in manifests:print("FIXTURE",json.dumps(entry))
except Exception as exc:
    print("FAILED to produce real MP3 fixtures",repr(exc),file=sys.stderr)
    raise
