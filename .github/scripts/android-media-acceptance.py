#!/usr/bin/env python3
"""Drive the *installed Android APK* through SAF and library setup.

No mocked backend, React web view, injected stage DB or test-specific app build.
Capture native UI hierarchy/screenshots + optional rooted catalogue diagnostics.
"""
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import time
import traceback
import xml.etree.ElementTree as ET
from datetime import datetime,timezone
from pathlib import Path

PKG="app.archivist.reader"
ACTIVITY=PKG+"/.MainActivity"
MEDIA=Path(os.environ.get("MEDIA_FIXTURES","android-media-fixtures")).resolve()
OUT=Path(os.environ.get("ACCEPTANCE_OUT","android-acceptance-results")).resolve()
OUT.mkdir(parents=True,exist_ok=True)
MAX_STAGE_S=int(os.environ.get("MAX_STAGE_SECONDS","520"))
NO_PROGRESS_S=int(os.environ.get("NO_PROGRESS_SECONDS","150"))
# Start with the 342-file case from the actual user's scanner diagnostic.
# The smaller suites remain selectable with FIXTURE_PROFILES=grouped,split-discs.
PROFILES=os.environ.get("FIXTURE_PROFILES","diagnostic342").split(",")

def command(args,timeout=45,check=True,text=True):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                     timeout=timeout,check=False,text=text)
    if check and p.returncode:
        raise RuntimeError("Command failed "+str(args)+"\n"+str(p.stdout)[-900:]+"\n"+str(p.stderr)[-900:])
    return p
def adb(*args,timeout=45,check=True,text=True):
    return command(["adb",*args],timeout=timeout,check=check,text=text)
def log(message):
    print(datetime.now(timezone.utc).strftime("%H:%M:%S")+" "+message,flush=True)
def screenshot(target:Path,subdir=""):
    target.parent.mkdir(parents=True,exist_ok=True)
    p=adb("exec-out","screencap","-p",timeout=25,text=False,check=False)
    if p.returncode==0 and p.stdout.startswith(b"\x89PNG"):
        target.write_bytes(p.stdout)
def dump():
    for attempt in range(3):
        try:
            d=adb("shell","uiautomator","dump","--compressed","/sdcard/archivist-ui.xml",timeout=26,check=False)
            if d.returncode!=0:
                log("UIA dump failed "+str(d.returncode)+" stdout="+repr(d.stdout[-250:])+
                    " stderr="+repr(d.stderr[-250:]))
                time.sleep(0.8)
                continue
            xml=adb("exec-out","cat","/sdcard/archivist-ui.xml",timeout=12).stdout
            if not xml.lstrip().startswith("<?xml") and not xml.lstrip().startswith("<hierarchy"):
                log("UIA dump not XML, prefix="+repr(xml[:340])+"; command="+repr(d.stdout[-300:]))
                time.sleep(0.8)
                continue
            return ET.fromstring(xml)
        except Exception as exc:
            log("UI dump retry: "+str(exc)[:170])
            time.sleep(1)
    raise RuntimeError("Android accessibility hierarchy unavailable")
def nodes(root):
    return [dict(n.attrib) for n in root.iter("node")]
def labels(root):
    out=[]
    for n in nodes(root):
        text=n.get("text","").strip()
        label=n.get("content-desc","").strip()
        if text or label:
            out.append((text or label).replace("\n"," ")[:150])
    return out
def nodes_matching(root,query,exact=False):
    q=query.lower()
    result=[]
    for n in nodes(root):
        name=(n.get("text","")+" "+n.get("content-desc","")).lower().strip()
        if (name==q if exact else q in name) and n.get("bounds"):
            result.append(n)
    return result
def bounds(node):
    numbers=list(map(int,re.findall(r"\d+",node.get("bounds",""))))
    if len(numbers)!=4:return None
    x1,y1,x2,y2=numbers
    return (x1,y1,x2,y2) if x2>x1 and y2>y1 else None
def tap_node(node):
    box=bounds(node)
    if not box:raise RuntimeError("Accessibility node has no tap coordinates")
    x1,y1,x2,y2=box
    adb("shell","input","tap",str((x1+x2)//2),str((y1+y2)//2))
def tap_label(query,timeout=25,exact=False,optional=False):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        root=dump()
        hits=nodes_matching(root,query,exact)
        hits=[n for n in hits if n.get("enabled")!="false"]
        if hits:
            tap_node(hits[0])
            log("TAPPED "+query+" @ "+str(bounds(hits[0])))
            return True
        time.sleep(1.6)
    if optional:return False
    raise RuntimeError("Could not find Android control "+repr(query)+"; visible: "+repr(labels(root)[-65:]))
def view(out:Path,label:str):
    # Capture a native screenshot even when UiAutomator's "wait for idle"
    # fails on continuous React Native/Lottie animations.
    screenshot(out/(label+".png"))
    try:root=dump()
    except Exception as e:
        (out/(label+".hierarchy-error.txt")).write_text(str(e))
        raise
    (out/(label+".xml")).write_text(ET.tostring(root,encoding="unicode"))
    text=labels(root)
    log("SCREEN "+label+": "+repr(text[-35:])[:1400])
    return root
def tap_first(queries,timeout=20):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        root=dump()
        for q in queries:
            h=nodes_matching(root,q)
            if h:
                tap_node(h[0])
                log("TAPPED "+q+" @ "+str(bounds(h[0])))
                return q
        time.sleep(1.5)
    raise RuntimeError("Expected any of "+str(queries)+"; saw "+repr(labels(root)[-50:]))
def picker_select(folder_name,out):
    tap_label("Add a folder",timeout=35)
    time.sleep(2)
    root=view(out,"picker-open")
    if not nodes_matching(root,folder_name):
        # DocumentsUI defaults to Recent or Recents. Open the drawer and go
        # to Documents or the device storage before choosing the fixture.
        if not nodes_matching(root,"Documents"):
            tap_first(["Show roots","Show navigation drawer","Open navigation drawer","Browse"],timeout=14)
            time.sleep(1)
        root=view(out,"picker-roots")
        if nodes_matching(root,"Documents"):
            tap_label("Documents",timeout=16)
        elif nodes_matching(root,"Internal storage"):
            tap_label("Internal storage",timeout=16)
            tap_label("Documents",timeout=16)
        else:
            # Device label varies by Android image. Native UI artefact shows
            # which storage root was exposed; never inject a pre-granted URI.
            tap_first(["sdk_gphone","Pixel","Android","emulator"],timeout=10)
            tap_label("Documents",timeout=16)
    time.sleep(1)
    view(out,"picker-documents")
    tap_label(folder_name,timeout=23)
    time.sleep(1)
    root=view(out,"picker-fixture-selected")
    if not nodes_matching(root,"Use this folder"):
        # Some picker builds accept the folder only from inside it.
        if nodes_matching(root,folder_name):
            tap_label(folder_name,timeout=6)
            root=view(out,"picker-fixture-inside")
    tap_first(["Use this folder","USE THIS FOLDER","Select"],timeout=22)
    time.sleep(1)
    if tap_label("Allow",timeout=10,optional=True):
        time.sleep(1.5)
    view(out,"folder-selected")
def copy_fixture(profile,out):
    names={"grouped":"ArchivistQAGrouped","split-discs":"ArchivistQASplitDiscs",
           "diagnostic342":"ArchivistQADiagnostic342"}
    if profile not in names:raise ValueError("Unknown synthetic fixture: "+profile)
    dest=names[profile]
    source=MEDIA/profile
    files=list(source.rglob("*.mp3"))
    expected=342 if profile=="diagnostic342" else 227
    if len(files)!=expected:
        raise RuntimeError("Fixture has "+str(len(files))+" real audio files, expected "+str(expected))
    adb("shell","mkdir","-p","/sdcard/Documents/"+dest,timeout=20)
    p=adb("push",str(source)+"/.","/sdcard/Documents/"+dest+"/",timeout=180)
    log("Copied "+str(len(files))+" genuine MP3 files into Android Documents for "+profile+"; adb push: "+p.stdout[-330:])
    return dest
def request_page(profile,out,button,timeout=35):
    tap_label(button,timeout=timeout)
    view(out,button.replace(" ","-").lower()+"-started")
def trace_screen(profile,out,step,timeout=MAX_STAGE_S,settled_words=()):
    started=time.monotonic()
    lastChange=started
    lastShown=""
    lastCapture=0
    iteration=0
    while time.monotonic()-started<timeout:
        iteration+=1
        root=dump()
        texts=labels(root)
        signature="|".join(texts)
        if signature!=lastShown:
            lastShown=signature
            lastChange=time.monotonic()
        if iteration==1 or time.monotonic()-lastCapture>22:
            screenshot(out/(step+f"-{int(time.monotonic()-started):04d}s.png"))
            lastCapture=time.monotonic()
            log(step+" +"+str(int(time.monotonic()-started))+"s: "+repr(texts[-32:])[:1600])
        lower=signature.lower()
        # A heading saying "Identify Books & Covers" is always present, even
        # BEFORE stage 1 has finished. Require an ENABLED native button.
        targets=[n for n in nodes(root) if n.get("clickable")=="true"
                 and n.get("enabled")!="false"]
        available="|".join(n.get("text","")+" "+n.get("content-desc","") for n in targets).lower()
        stage1_done=step=="discovery" and "identify books & covers" in available
        stage2_done=step=="identification" and (
            "finish setup" in available
            or bool(re.search(r"review\s+\d+\s+books?",available)))
        if stage1_done or stage2_done:
            log(step+" settled after "+str(int(time.monotonic()-started))+"s")
            return {"seconds":round(time.monotonic()-started,1),"settled":True,"visible":texts}
        if time.monotonic()-lastChange>NO_PROGRESS_S:
            view(out,step+"-WATCHDOG-no-change")
            raise RuntimeError(step+" UI made no observable progress for "+str(NO_PROGRESS_S)+"s; last "+repr(texts[-25:]))
        time.sleep(4)
    view(out,step+"-TIMEOUT")
    raise RuntimeError(step+" exceeded "+str(timeout)+" seconds; "+repr(texts[-35:]))
def collect_native_catalogue(out):
    """Only synthetic-library data; build trace and aggregate counts, no secret device files."""
    result={"rooted":False}
    root=adb("root",timeout=15,check=False)
    if root.returncode!=0:
        result["reason"]="adb root unsupported by emulator image"
        return result
    time.sleep(3)
    adb("wait-for-device",timeout=25,check=False)
    p=adb("shell","ls","/data/user/0/"+PKG+"/databases",check=False)
    if p.returncode!=0 or "archivist-local.db" not in p.stdout:
        result["reason"]="native database not present/readable"
        return result
    result["rooted"]=True
    state="/data/user/0/"+PKG+"/files/archivist-state/archivist.scannerTrace.v1.json"
    traceTarget=out/"scanner-trace.json"
    pulled=adb("pull",state,str(traceTarget),timeout=30,check=False)
    if pulled.returncode==0 and traceTarget.exists():
        try:
            trace=json.loads(traceTarget.read_text())
            result["scanner_stages"]=[{
                "phase":entry.get("phase"),
                "elapsed_ms":entry.get("elapsedMs"),
                "physical_files":entry.get("counts",{}).get("physicalFiles"),
                "logical_works":entry.get("counts",{}).get("logicalWorks"),
                "audio_works":entry.get("counts",{}).get("audioWorks"),
                "review_works":entry.get("counts",{}).get("reviewFlaggedWorks"),
                "audio_group_identity":entry.get("counts",{}).get("audioGroupsByIdentity"),
                "counters":entry.get("counters")
            } for entry in trace if isinstance(entry,dict)]
        except Exception as e:result["scanner_trace_error"]=str(e)
    else:result["scanner_trace_missing"]=True
    dst=out/"catalogue"
    dst.mkdir(exist_ok=True)
    for name in ["archivist-local.db","archivist-local.db-wal","archivist-local.db-shm"]:
        adb("pull","/data/user/0/"+PKG+"/databases/"+name,str(dst/name),check=False,timeout=30)
    db=dst/"archivist-local.db"
    if not db.exists():return result
    try:
        with sqlite3.connect("file:"+str(db)+"?mode=ro",uri=True) as conn:
            rows=conn.execute("SELECT payload FROM local_assets ORDER BY ordinal").fetchall()
            assets=[json.loads(s[0]) for s in rows]
        byformat={}
        albums={}
        dirs={}
        for asset in assets:
            fmt=asset.get("format","")
            byformat[fmt]=byformat.get(fmt,0)+1
            emb=asset.get("embeddedMetadata") or {}
            title=emb.get("workTitle") or ""
            if title: albums[title]=albums.get(title,0)+1
            uri=asset.get("uri","")
            parent=uri.rsplit("/",1)[0]
            dirs[parent]=dirs.get(parent,0)+1
        # Never publish file paths, titles, embedded metadata, or full payloads.
        result.update({"physical_count":len(assets),"formats":byformat,
            "distinct_parent_paths":len(dirs),
            "parent_file_count_histogram":sorted(dirs.values()),
            "distinct_embedded_work_title_tags":len(albums),
            "works_needing_review_files":sum(bool(a.get("needsReview")) for a in assets)})
    except Exception as e:result["read_error"]=str(e)
    return result
def review_count(text):
    s="|".join(text)
    expressions=[r"review\s+(\d+)\s+books?",r"(\d+)\s+works?\s+need(?:s)?\s+review",
                 r"(\d+)\s+books?\s+need(?:s)?\s+review"]
    for p in expressions:
        m=re.search(p,s,re.I)
        if m:return int(m.group(1))
    return None
def inspect_editor(out):
    root=view(out,"library-after-identify")
    actions=nodes_matching(root,"Review ")
    if not actions:
        log("No review action in current view; metadata editor not accessible on this profile")
        return {"available":False}
    tap_node(actions[0])
    time.sleep(2)
    root=view(out,"needs-attention")
    choices=nodes_matching(root,"Edit details for")
    if not choices:
        log("No edit details button in native hierarchy; capture for investigation")
        return {"available":False}
    tap_node(choices[0])
    time.sleep(2)
    root=view(out,"metadata-editor")
    geometry={}
    for label in ["Smart Search","Save","Close"]:
        hits=nodes_matching(root,label)
        geometry[label]=[bounds(n) for n in hits]
    log("NATIVE EDITOR BUTTON GEOMETRY "+json.dumps(geometry))
    screenshot(out/"metadata-editor-actions.png")
    return {"available":True,"geometry":geometry}
def process_profile(profile,apk):
    out=OUT/profile
    out.mkdir(parents=True,exist_ok=True)
    log("=== Test 23 real Android fixture "+profile+" ===")
    expected=342 if profile=="diagnostic342" else 227
    result={"profile":profile,"apk":Path(apk).name,"status":"running",
            "expected_mp3_files":expected,"expected_logical_works":12}
    try:
        adb("shell","am","force-stop",PKG,check=False)
        adb("shell","pm","clear",PKG,timeout=35)
        folder=copy_fixture(profile,out)
        adb("shell","am","start","-W","-n",ACTIVITY,timeout=35)
        time.sleep(12)
        view(out,"app-open")
        picker_select(folder,out)
        request_page(profile,out,"Find Books")
        result["discovery"]=trace_screen(profile,out,"discovery",timeout=240,
                                         settled_words=("Identify Books & Covers",))
        request_page(profile,out,"Identify Books & Covers")
        result["identification"]=trace_screen(profile,out,"identification",timeout=MAX_STAGE_S,
                          settled_words=("Finish setup","Review 12 books","Review 24 books","Review 85 books"))
        root=view(out,"identify-complete")
        result["review_count"]=review_count(labels(root))
        result["editor"]=inspect_editor(out)
        result["status"]="finished"
        result["review_count_pass"]=result["review_count"] in (None,12)
        if result["review_count"] is not None and result["review_count"]!=12:
            result["status"]="failed"
            result["reason"]="Android UI reports "+str(result["review_count"])+" reviewed works; expected 12"
        if result["review_count"] is None:
            result["warning"]="No review count visible; native catalogue must be checked"
    except Exception as exc:
        result["status"]="failed"
        result["reason"]=str(exc)
        result["traceback"]=traceback.format_exc()[-2500:]
        log("FAIL "+profile+": "+str(exc)[:900])
        try:view(out,"failure")
        except Exception:pass
    finally:
        # Collect logcat whether pass, fail, freeze, or Android chooser trouble.
        p=adb("logcat","-d","-v","time","-t","1700",timeout=35,check=False)
        (out/"logcat.txt").write_text(p.stdout[-200000:])
        try:
            result["catalogue"]=collect_native_catalogue(out)
            stages=result["catalogue"].get("scanner_stages") or []
            # The privacy-safe stage trace reflects the actual shipped native
            # scanner's work-grouping algorithm, not our fixture filename guesses.
            if stages:
                result["native_stage_summary"]=stages
                last=stages[-1]
                result["final_native_work_count"]=last.get("logical_works")
                results_by_phase={record.get("phase"):record for record in stages}
                result["phase_works"]={name:entry.get("logical_works")
                                       for name,entry in results_by_phase.items()}
                result["phase_elapsed_ms"]={name:entry.get("elapsed_ms")
                                            for name,entry in results_by_phase.items()}
                discovery=results_by_phase.get("discovery",{})
                if discovery.get("physical_files")!=expected:
                    result["status"]="failed"
                    result["reason"]=("Native Find Books discovered "+
                       str(discovery.get("physical_files"))+" physical files, expected "+str(expected))
                if any(entry.get("logical_works")!=12 for entry in stages
                       if entry.get("phase") in ("discovery","audio","publish","finish")):
                    result["status"]="failed"
                    result["reason"]=("Native scanner incorrectly fragmented 12 known books at phases "+
                       str(result["phase_works"]))
                if not results_by_phase.get("finish"):
                    result["status"]="failed"
                    result["reason"]="Native Identify never reached the final finish checkpoint"
            else:
                result["status"]="failed"
                result["reason"]="No native scanner trace available; cannot claim actual media scan passed"
        except Exception as e:result["catalogue_error"]=str(e)
        (out/"result.json").write_text(json.dumps(result,indent=2,default=str)+"\n")
        log("RESULT "+profile+" "+json.dumps({k:v for k,v in result.items() if k not in ("traceback","discovery","identification")})[:2500])
    return result

def main():
    if len(sys.argv)<2:raise RuntimeError("Usage: android-media-acceptance.py <verified Test23.apk>")
    apk=sys.argv[1]
    manifest=json.loads((MEDIA/"manifest.json").read_text())
    log("EXPECTED INPUT "+json.dumps(manifest)[:1800])
    adb("wait-for-device",timeout=90)
    adb("install","--no-streaming","-r",apk,timeout=150)
    for setting in ("window_animation_scale","transition_animation_scale","animator_duration_scale"):
        adb("shell","settings","put","global",setting,"0",timeout=10,check=False)
    results=[]
    for profile in PROFILES:
        if profile not in ("grouped","split-discs","diagnostic342"):raise ValueError("Bad profile: "+profile)
        results.append(process_profile(profile,apk))
    summary={"apk":Path(apk).name,"results":[{
        "profile":r["profile"],"status":r["status"],"review_count":r.get("review_count"),
        "reason":r.get("reason"),"catalogue":r.get("catalogue")
    } for r in results]}
    (OUT/"summary.json").write_text(json.dumps(summary,indent=2)+"\n")
    log("FINAL DEVICE RESULT "+json.dumps(summary))
    if any(r["status"]!="finished" for r in results):sys.exit(1)

if __name__=="__main__":
    try:main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
