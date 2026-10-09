#!/usr/bin/env python3
"""Native Android visual fallback for old APKs whose React animation blocks
UIAutomator accessibility dumps. Coordinates are scaled to emulator display.
Never call screenshots a passing test until the evidence has been inspected.
"""
import os,json,re,time,subprocess,sys,traceback
from pathlib import Path
APK=sys.argv[1]; LABEL=os.getenv("ACCEPTANCE_RELEASE","historical")
OUT=Path("android-acceptance-results");OUT.mkdir(exist_ok=True)
R=OUT/"diagnostic342";R.mkdir(exist_ok=True)
PKG="app.archivist.reader"
def adb(*args,timeout=35,check=True,binary=False):
 p=subprocess.run(["adb",*args],capture_output=True,timeout=timeout,
                  text=not binary)
 if check and p.returncode:raise RuntimeError("ADB "+str(args)+" failed: "+str(p.stderr)[-500:])
 return p.stdout
def snap(label):
 b=adb("exec-out","screencap","-p",timeout=30,binary=True)
 if b.startswith(b"\x89PNG"):(R/(label+".png")).write_bytes(b)
 print("ANDROID_VISUAL_SNAPSHOT",LABEL,label,flush=True)
def dims():
 x=adb("shell","wm","size")
 m=re.search(r"(\d+)x(\d+)",x)
 if not m:raise RuntimeError("Android display geometry unavailable")
 return int(m.group(1)),int(m.group(2))
def tap(rx,ry,label):
 w,h=dims();x=round(rx*w);y=round(ry*h)
 adb("shell","input","tap",str(x),str(y),timeout=15)
 print("ANDROID_VISUAL_TAP",LABEL,label,x,y,flush=True)
def stage(label,seconds=2):
 time.sleep(seconds);snap(label)
def run():
 started=time.monotonic()
 result={"release":LABEL,"apk":Path(APK).name,"mode":"real Android screenshot/coordinate fallback",
         "fixture_physical_files":342,"fixture_actual_works":12,"state":"running",
         "automated_UI_count_verified":False}
 try:
  adb("wait-for-device",timeout=90)
  print("INSTALL",adb("install","--no-streaming","-r",APK,timeout=150).strip(),flush=True)
  for item in ("window_animation_scale","transition_animation_scale","animator_duration_scale"):
   adb("shell","settings","put","global",item,"0",check=False)
  adb("shell","pm","clear",PKG,timeout=30)
  src=Path("android-media-fixtures/diagnostic342")
  assert len(list(src.rglob("*.mp3")))==342
  adb("shell","mkdir","-p","/sdcard/Documents/ArchivistQADiagnostic342")
  adb("push",str(src)+"/.","/sdcard/Documents/ArchivistQADiagnostic342/",timeout=180)
  adb("shell","am","start","-W","-n",PKG+"/.MainActivity",timeout=40)
  stage("01-older-app-open",10)
  tap(0.50,0.582,"Add a folder")
  stage("02-Android-folder-picker",4)
  # The Android SAF picker opens the device-root listing with Documents visible.
  tap(0.26,0.508,"Documents")
  stage("03-Documents-folder",3)
  tap(0.32,0.255,"ArchivistQADiagnostic342")
  stage("04-selected-342-MP3-folder",3)
  tap(0.50,0.922,"Use this folder")
  stage("05-Android-SAF-permission",2)
  tap(0.81,0.568,"ALLOW")
  stage("06-legacy-onboarding-folder-added",4)
  tap(0.50,0.77,"Prepare library")
  stage("07-after-Prepare-library-tap",2)
  for seconds in (10,30,60,100,160,240):
   # Pause to absolute elapsed time since Prepare was pressed.
   elapsed=time.monotonic()-started
   if seconds>elapsed:time.sleep(seconds-elapsed)
   snap("08-Prepare-library-elapsed-"+str(seconds)+"s")
  result["state"]="screenshots_captured_needs_visual_assessment"
 except Exception as e:
  result.update({"state":"infrastructure_error","error":str(e),
                 "traceback":traceback.format_exc()[-1600:]})
  try:snap("FAILED")
  except Exception:pass
 finally:
  result["total_elapsed_s"]=round(time.monotonic()-started,1)
  try:
   log=adb("logcat","-d","-t","1200",timeout=30,check=False)
   (R/"logcat.txt").write_text(log[-120000:])
  except Exception:pass
  (OUT/"summary.json").write_text(json.dumps(result,indent=2)+"\n")
  print("VISUAL_BASELINE_RESULT",json.dumps({k:v for k,v in result.items() if k!="traceback"}),flush=True)
 return 0 if result["state"]=="screenshots_captured_needs_visual_assessment" else 1
if __name__=="__main__":sys.exit(run())
