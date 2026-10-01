from pathlib import Path
p = Path("mobile/App.tsx")
s = p.read_text()
old = "playback?.tracks.length||0:activeLocalWork?.tracks.length||0"
new = "playback?.tracks?.length||0:activeLocalWork?.tracks?.length||0"
if old not in s:
    raise SystemExit("expected Sprint 3 type-fix target not found")
p.write_text(s.replace(old, new, 1))
