from pathlib import Path
p = Path("mobile/App.tsx")
s = p.read_text()
replacements = [
    ("playback?.tracks.length||0:activeLocalWork?.tracks.length||0",
     "playback?.tracks?.length||0:activeLocalWork?.tracks?.length||0"),
    ("(serverPlayer?playback?.tracks:activeLocalWork?.tracks)?.length>1",
     "((serverPlayer?playback?.tracks:activeLocalWork?.tracks)?.length||0)>1"),
]
for old, new in replacements:
    if old in s:
        s = s.replace(old, new, 1)
p.write_text(s)
