from pathlib import Path
p=Path("mobile/App.tsx")
s=p.read_text()
needle="  readerToolBlock: {gap:10,paddingVertical:8},"
insert="  searchRow:{flexDirection:'row',alignItems:'center',gap:8},\n  filterPill:{borderWidth:1,borderRadius:999,minHeight:38,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},\n"
if "  searchRow:" not in s:
    if needle not in s: raise SystemExit("reader style insertion point missing")
    s=s.replace(needle,insert+needle,1)
p.write_text(s)
