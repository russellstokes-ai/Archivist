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


def diagnostic342():
    """342 actual tracks across 12 known works; target the 69 loose groups in
    the Test23 diagnostic, NOT an invented 85-work success fixture.

    This creates 12 human-defined audiobooks in a selected Android SAF tree:
    some tracks are in nested CD folders, others live at the source root;
    embedded TALB sometimes says "Chapter 03"/"Disc 2" instead of the book.
    """
    root=OUT/"diagnostic342"
    count=0
    cases=[]
    art=OUT/"embedded-cover.png"
    # A real embedded PNG for a subset of the books: other works intentionally
    # lack artwork to exercise the same publication/cache problem seen on-device.
    subprocess.run([
        "ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
        "-f","lavfi","-i","color=c=0x173745:s=256x384:d=1",
        "-frames:v","1",str(art)
    ],check=True,timeout=35)
    cover=art.read_bytes()
    from mutagen.id3 import APIC
    for work in range(12):
        book=f"QA Book {work+1:02d}"
        author=f"QA Author {work//4+1:02d}"
        # 11 books x 28 plus 1 x 34 = 342 tracks total.
        total=34 if work==11 else 28
        category=(
            "normal-book-folder" if work<3 else
            "split-disc-subfolders" if work<7 else
            "root-level-multipart" if work<9 else
            "series-nesting-with-discs"
        )
        for part in range(1,total+1):
            if work<3:
                directory=root/author/book
                stem=f"{part:03d} - Chapter {part:02d}"
            elif work<7:
                directory=root/author/book/("CD 01" if part<=14 else "CD 02")
                stem=f"{(part-1)%14+1:02d} - Chapter {(part-1)%14+1:02d}"
            elif work<9:
                # Files are loose directly beneath the user-selected library,
                # but the stable title in each filename denotes their book.
                directory=root
                stem=f"{book} - Part {part:02d}"
            else:
                directory=root/author/"QA Series"/book/("Part 1" if part<=14 else "Part 2")
                stem=f"{part:03d} - Track {part:02d}"
            directory.mkdir(parents=True,exist_ok=True)
            dest=directory/(stem+".mp3")
            shutil.copyfile(template,dest)
            # Actual deliberately polluted Windows/Android media properties.
            if part%13==0:album=""
            elif part%11==0:album=f"Disc {part//14+1}"
            elif part%7==0:album=f"Chapter {part:02d}"
            elif part%5==0:album=book+" (Disc 2)"
            else:album=book
            tags=ID3()
            tags.add(TIT2(encoding=3,text=stem))
            if album:tags.add(TALB(encoding=3,text=album))
            if part%9!=0:tags.add(TPE1(encoding=3,text=author))
            tags.add(TRCK(encoding=3,text=str(part)))
            tags.add(TPOS(encoding=3,text="1" if part<=14 else "2"))
            if work<4 and part==1:
                tags.add(APIC(encoding=3,mime="image/png",type=3,
                              desc="Cover",data=cover))
            tags.save(dest,v2_version=3)
            count+=1
        cases.append({"ordinal":work+1,"chapters":total,"layout":category,
                      "expected_book":book,"embedded_cover":work<4})
    art.unlink(missing_ok=True)
    assert count==342,count
    return {"profile":"diagnostic342","physical_mp3":342,
            "expected_logical_works":12,"real_decodable_mp3":True,
            "has_actual_id3_tags":True,"has_embedded_artwork":True,
            "layouts":"normal folders; nested discs; loose root chapters; nested series parts",
            "purpose":"Reproduce the app's 342-discovered / 89-group / 69-single-file diagnostic class",
            "work_sizes":cases}

try:
    manifests=[make("grouped"),make("split-discs"),diagnostic342()]
    template.unlink()
    (OUT/"manifest.json").write_text(json.dumps({"profiles":manifests},indent=2)+"\n")
    for entry in manifests:print("FIXTURE",json.dumps(entry))
except Exception as exc:
    print("FAILED to produce real MP3 fixtures",repr(exc),file=sys.stderr)
    raise
