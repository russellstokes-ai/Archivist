"""Launch the real release APK; require visible canonical UI and capture crashes."""
import json,pathlib,re,subprocess,sys,time,xml.etree.ElementTree as ET

out=pathlib.Path('scanner-app-results');out.mkdir(exist_ok=True)
package='app.archivist.reader.scanneracceptance'
def adb(*args,check=True):
    value=subprocess.run(['adb',*args],capture_output=True,timeout=30)
    if check and value.returncode:raise RuntimeError(value.stderr.decode(errors='replace'))
    return value.stdout

adb('install','--no-streaming','-r',sys.argv[1])
adb('shell','am','force-stop',package);adb('logcat','-c')
start=adb('shell','am','start','-W','-n',package+'/app.archivist.reader.MainActivity')
(out/'launch-start.txt').write_bytes(start)
seen=[];ready=False
try:
    deadline=time.monotonic()+45
    while time.monotonic()<deadline:
        time.sleep(2)
        log=adb('logcat','-d','-v','threadtime').decode(errors='replace')
        (out/'launch-logcat.log').write_text(log)
        if 'FATAL EXCEPTION' in log or re.search(r'(?:ReactNativeJS|JavascriptException).*?(?:TypeError|ReferenceError|Error:)',log):
            raise AssertionError('Release startup reported a crash or JavaScript exception')
        adb('shell','uiautomator','dump','/sdcard/scanner-launch.xml',check=False)
        raw=adb('exec-out','cat','/sdcard/scanner-launch.xml',check=False)
        try:nodes=list(ET.fromstring(raw).iter('node'))
        except ET.ParseError:continue
        (out/'launch-ui.xml').write_bytes(raw)
        # A boot-time launcher ANR can cover a healthy app. Dismiss only the
        # observed Quickstep dialog, never an Archivist ANR or generic error.
        if any(n.get('text')=="Quickstep isn't responding" for n in nodes):
            close=next((n for n in nodes if n.get('resource-id')=='android:id/aerr_close' and n.get('text')=='Close app'),None)
            assert close is not None,'Launcher ANR dialog has no observed close control'
            bounds=list(map(int,re.findall(r'\d+',close.get('bounds',''))))
            assert len(bounds)==4,'Launcher dialog control has invalid bounds'
            adb('shell','input','tap',str((bounds[0]+bounds[2])//2),str((bounds[1]+bounds[3])//2))
            print('Closed observed Quickstep launcher ANR; app remains under test')
            continue
        seen=[n.get('text') or n.get('content-desc') for n in nodes if n.get('package')==package and (n.get('text') or n.get('content-desc'))]
        if any(re.search(r'Add a folder|Shelf|Library|Get started|Welcome|Archivist',label,re.I) for label in seen):
            ready=True;break
    assert ready,'No canonical app UI became visible; labels: '+repr(seen)
    # Catch a delayed startup exception and verify the process remains alive.
    time.sleep(8)
    assert adb('shell','pidof',package,check=False).strip(),'App process exited after displaying UI'
    log=adb('logcat','-d','-v','threadtime').decode(errors='replace')
    assert 'FATAL EXCEPTION' not in log,'Delayed release startup crash'
    (out/'launch-logcat.log').write_text(log)
    (out/'launch-ui.png').write_bytes(adb('exec-out','screencap','-p'))
    (out/'launch-result.json').write_text(json.dumps({'passed':True,'scope':'actual release APK launch and canonical UI visibility; not scanner/device acceptance','labels':seen},indent=2))
    print('PASS: release APK opens, shows canonical UI and remains alive')
except BaseException:
    log=adb('logcat','-d','-v','threadtime').decode(errors='replace')
    (out/'launch-logcat.log').write_text(log)
    (out/'launch-ui.png').write_bytes(adb('exec-out','screencap','-p'))
    lines=log.splitlines()
    relevant=[i for i,line in enumerate(lines) if re.search(r'FATAL EXCEPTION|ReactNativeJS|JavascriptException|AndroidRuntime|SoLoader|UnsatisfiedLinkError',line)]
    indices=set()
    for i in relevant:indices.update(range(max(0,i-2),min(len(lines),i+15)))
    print('\n'.join(lines[i] for i in sorted(indices)[-220:]))
    print('Observed app labels:',repr(seen))
    raise
