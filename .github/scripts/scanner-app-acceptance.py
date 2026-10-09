"""Actual app/SAF onboarding check using generated, public-safe playable media.

This is the first integrated gate, not authorization to release an APK. Further
large-library, recovery, Assist/provider and canonical screenshot gates stay open.
"""
import pathlib,subprocess,time,xml.etree.ElementTree as ET,re,json,struct,zlib,sys
out=pathlib.Path('scanner-app-results');out.mkdir(exist_ok=True)
package='app.archivist.reader.scanneracceptance'
def run(*args,timeout=30):
    return subprocess.run(args,check=True,capture_output=True,timeout=timeout).stdout
def adb(*args):return run('adb',*args)
def png(rgb):
    def chunk(name,data):return struct.pack('>I',len(data))+name+data+struct.pack('>I',zlib.crc32(name+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',100,150,8,2,0,0,0))+chunk(b'IDAT',zlib.compress((b'\0'+bytes(rgb)*100)*150))+chunk(b'IEND',b'')
def tag(fields):
    frames=b''
    for key,value in fields.items():
        body=b'\3'+value.encode();frames+=key.encode()+struct.pack('>I',len(body))+b'\0\0'+body
    n=len(frames);return b'ID3\3\0\0'+bytes([(n>>21)&127,(n>>14)&127,(n>>7)&127,n&127])+frames
fixture=out/'ScannerAcceptance';fixture.mkdir(exist_ok=True)
seed=out/'seed.mp3'
run('ffmpeg','-v','error','-f','lavfi','-i','anullsrc=r=22050:cl=mono','-t','1','-codec:a','libmp3lame','-write_xing','0','-id3v2_version','0','-y',str(seed))
audio=seed.read_bytes()
for work in range(1,19):
    title=f'Generated Work {work:02d}';folder=fixture/title/'Disc 1';folder.mkdir(parents=True,exist_ok=True)
    (folder/'cover.png').write_bytes(png([40+work*4,80,100]))
    for part in range(1,20):
        (folder/f'Chapter {part:02d}.mp3').write_bytes(tag({'TIT2':f'Chapter {part:02d}','TALB':title,'TPE1':'Generated Writer','TCON':'Space opera','TRCK':str(part),'TPOS':'1'})+audio)
adb('push',str(fixture),'/sdcard/Download/')
adb('install','--no-streaming','-r',sys.argv[1]);adb('logcat','-c')
adb('shell','am','start','-W','-n',package+'/app.archivist.reader.MainActivity')
events=[]
def snapshot(name=None):
    adb('shell','uiautomator','dump','/sdcard/scanner-window.xml');raw=adb('exec-out','cat','/sdcard/scanner-window.xml')
    root=ET.fromstring(raw)
    if name:(out/(name+'.xml')).write_bytes(raw);(out/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
    return list(root.iter('node'))
def labels(nodes):return [(n.get('text',''),n.get('content-desc','')) for n in nodes if n.get('text') or n.get('content-desc')]
def tap(label,timeout=25,scroll=False):
    end=time.monotonic()+timeout
    while time.monotonic()<end:
        nodes=snapshot()
        for node in nodes:
            if node.get('text','').casefold()==label.casefold() or node.get('content-desc','').casefold()==label.casefold():
                bounds=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
                if len(bounds)==4 and bounds[2]>bounds[0] and bounds[3]>bounds[1]:
                    adb('shell','input','tap',str((bounds[0]+bounds[2])//2),str((bounds[1]+bounds[3])//2));events.append({'tap':label,'time':time.time()});return
        if scroll:adb('shell','input','swipe','550','1700','550','700','400')
        time.sleep(.3)
    snapshot('failed');raise AssertionError('Visible control missing: '+label+'; observed '+repr(labels(nodes)))
def metrics():
    log=adb('logcat','-d','-v','brief').decode(errors='replace');(out/'logcat.log').write_text(log)
    values=[]
    for line in log.splitlines():
        if 'ScannerVNextAcceptance' in line and '{' in line:
            try:values.append(json.loads(line[line.index('{'):]))
            except json.JSONDecodeError:pass
    return values
try:
    tap('Add a folder',scroll=True)
    nodes=snapshot('picker')
    if not any(n.get('text')=='ScannerAcceptance' for n in nodes):
        if not any(n.get('text')=='Downloads' for n in nodes):
            for name in ['Show roots','Navigate up']:
                if any(n.get('content-desc')==name for n in nodes):tap(name);break
        tap('Downloads')
    tap('ScannerAcceptance');tap('Use this folder');tap('Allow')
    snapshot('onboarding-source');tap('Prepare library',scroll=True)
    deadline=time.monotonic()+150
    while time.monotonic()<deadline:
        values=metrics()
        if values:break
        time.sleep(1)
    assert values,'No completed fresh runtime metrics'
    cold=values[-1]
    assert cold['files']==342 and cold['works']==18 and cold['published']==18 and cold['review']==0,cold
    assert cold['complete'] and cold['maxHeartbeatLag']<250,cold
    tap('Keep current layout',scroll=True);tap('Library');snapshot('phone-library-light')
    tap('Atlas');snapshot('phone-atlas-light')
    observed=labels(snapshot())
    assert any('Science Fiction' in text or 'Science Fiction' in description for text,description in observed),observed
    # Restart the real application; durable publication must remain represented.
    adb('shell','am','force-stop',package);adb('shell','am','start','-W','-n',package+'/app.archivist.reader.MainActivity');time.sleep(3)
    tap('Library');snapshot('phone-library-restart')
    observed=labels(snapshot());assert any('Generated Work' in text or 'Generated Work' in description for text,description in observed),observed
    adb('shell','dumpsys','meminfo',package);(out/'meminfo.txt').write_bytes(adb('shell','dumpsys','meminfo',package))
    # Capture responsive canonical surfaces at Fold open/closed widths.
    for mode,size,density in [('fold-open','1840x2208','320'),('fold-closed','904x2316','420')]:
        adb('shell','wm','size',size);adb('shell','wm','density',density);time.sleep(2)
        for tab in ['Library','Shelf','Atlas','Stats']:
            tap(tab);snapshot(mode+'-'+tab.lower()+'-light')
    (out/'first-integrated-gate.json').write_text(json.dumps({'passed':True,'cold':cold,'events':events,'scope':'actual app onboarding, SAF picker, 342 generated playable files, 18 construction-labelled works/publications, Atlas genre, process restart and responsive surface captures','releaseApproved':False,'remaining':'warm/cancel/permission loss/Assist, larger-library profiling and canonical screenshot comparisons'},indent=2))
except BaseException:
    (out/'events.json').write_text(json.dumps(events,indent=2));metrics();snapshot('failure');raise
finally:
    adb('shell','wm','size','reset');adb('shell','wm','density','reset')
