#!/usr/bin/env python3
"""Test an unmodified historical Archivist APK with the real Android folder picker.

This deliberately exercises the PRE-Test23 onboarding button "Prepare library".
All data is genuine MP3/ID3 files in Android /sdcard/Documents, not mocked
catalogue records. UI book counts are reported verbatim, without inferring
that "Needs Attention" necessarily equals the full work count.
"""
import importlib.util,json,os,sys,time,traceback
from pathlib import Path
from datetime import datetime,timezone
script=Path(__file__).with_name("android-media-acceptance.py")
spec=importlib.util.spec_from_file_location("native_qa_driver",str(script))
driver=importlib.util.module_from_spec(spec)
spec.loader.exec_module(driver)
RELEASE=os.environ.get("ACCEPTANCE_RELEASE","unknown")
PROFILE="diagnostic342"
OUT=Path("android-acceptance-results")/PROFILE
OUT.mkdir(parents=True,exist_ok=True)
def collect_ui():
    root=driver.dump()
    return root,driver.labels(root)
def capture(label):
    root=driver.view(OUT,label)
    return root,driver.labels(root)
def run(apk):
    summary={"release":RELEASE,"test_mode":"legacy Prepare library","status":"running",
             "expected_mp3_files":342,"known_logical_works":12}
    started=time.monotonic()
    try:
        manifest=json.loads((Path("android-media-fixtures")/"manifest.json").read_text())
        assert any(x.get("profile")==PROFILE and x.get("physical_mp3")==342 for x in manifest["profiles"])
        driver.adb("wait-for-device",timeout=100)
        driver.adb("install","--no-streaming","-r",apk,timeout=160)
        driver.adb("shell","pm","clear",driver.PKG,timeout=35)
        folder=driver.copy_fixture(PROFILE,OUT)
        driver.adb("shell","am","start","-W","-n",driver.ACTIVITY,timeout=45)
        time.sleep(9)
        capture("app-open")
        driver.picker_select(folder,OUT)
        _,titles=capture("before-prepare")
        summary["before_prepare_visible"]=titles[-30:]
        driver.tap_label("Prepare library",timeout=30)
        scan_started=time.monotonic()
        last_signature=""
        last_change=time.monotonic()
        stable_count=0
        while time.monotonic()-scan_started<510:
            root,titles=collect_ui()
            signature="|".join(titles)
            if signature!=last_signature:
                last_signature=signature;last_change=time.monotonic()
            clickable=[x for x in driver.nodes(root) if x.get("clickable")=="true" and x.get("enabled")!="false"]
            actions="|".join((x.get("text","")+" "+x.get("content-desc","")).lower() for x in clickable)
            import re
            review=re.search(r"review\s+(\d+)\s+books?",actions)
            finished=bool(review) or ("organise files" in actions) or ("keep current layout" in actions)
            elapsed=time.monotonic()-scan_started
            if int(elapsed)%24<5:
                driver.screenshot(OUT/("preparation-"+str(int(elapsed)).zfill(4)+"s.png"))
                print(f"SCANNING {RELEASE} {elapsed:.0f}s: "+repr(titles[-20:])[:1300],flush=True)
            if finished:
                stable_count+=1
                if stable_count>=2:
                    summary.update({"status":"completed","preparation_seconds":round(elapsed,1),
                                    "review_count":int(review.group(1)) if review else 0,
                                    "observed_review_action":review.group(0) if review else "no review action",
                                    "visible_after_preparation":titles[-50:]})
                    capture("identify-complete")
                    # Historically some books were published immediately. An
                    # observed review count of 12 is evidence, NOT a claim that
                    # the full library contains precisely 12 without inspecting
                    # the published and staged work tables separately.
                    summary["review_equals_twelve"]=summary["review_count"]==12
                    break
            else:stable_count=0
            if time.monotonic()-last_change>175:
                summary.update({"status":"stalled","reason":"No observable UI change for 175s",
                                "elapsed_seconds":round(elapsed,1)})
                capture("WATCHDOG-unchanged")
                break
            time.sleep(3)
        else:summary.update({"status":"timeout","reason":"Prepare library exceeded 510 seconds"})
        if summary["status"]=="completed" and summary["review_count"]!=12:
            summary["status"]="count-different"
            summary["reason"]="Android displayed "+str(summary["review_count"])+" reviewed books; expected source contains 12 works"
        print("HISTORICAL_ANDROID_RESULT "+json.dumps({k:v for k,v in summary.items() if not k.startswith("visible")}),flush=True)
    except Exception as exc:
        summary.update({"status":"error","reason":str(exc),"traceback":traceback.format_exc()[-2700:]})
        print("HISTORICAL_ANDROID_ERROR "+str(exc),flush=True)
        try:capture("failure")
        except Exception:pass
    finally:
        summary["total_seconds"]=round(time.monotonic()-started,1)
        try:
            log=driver.adb("logcat","-d","-t","1200",timeout=28,check=False)
            (OUT/"logcat.txt").write_text(log.stdout[-150000:])
        except Exception as e:summary["logcat_error"]=str(e)
        (OUT/"result.json").write_text(json.dumps(summary,indent=2)+"\n")
        (Path("android-acceptance-results")/"summary.json").write_text(json.dumps(summary,indent=2)+"\n")
    return 0 if summary.get("status")=="completed" else 1
if __name__=="__main__":
    if len(sys.argv)!=2:sys.exit("Usage: android-historical-acceptance.py <release APK>")
    sys.exit(run(sys.argv[1]))
