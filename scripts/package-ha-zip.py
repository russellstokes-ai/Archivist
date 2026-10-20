#!/usr/bin/env python3
"""Stable HA source ZIP: fixed UTC time, ordering and portable file modes."""
import datetime
import os
from pathlib import Path
import subprocess
import sys
import zipfile

stage, output, *members = sys.argv[1:]
root = Path(__file__).resolve().parent.parent
epoch = int(os.environ.get('SOURCE_DATE_EPOCH') or subprocess.check_output(
    ['git', '-C', str(root), 'log', '-1', '--format=%ct'], text=True).strip())
if not 315532800 <= epoch <= 4354819199:
    raise SystemExit('SOURCE_DATE_EPOCH must fit the ZIP date range (1980–2107)')
stamp = datetime.datetime.fromtimestamp(epoch, datetime.timezone.utc).timetuple()[:6]
stage = Path(stage)
files = []
for member in members:
    source = stage / member
    files.extend(source.rglob('*') if source.is_dir() else [source])
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for source in sorted(set(files), key=lambda p: p.relative_to(stage).as_posix()):
        if source.is_symlink():
            raise SystemExit('Refusing symlink in HA package: ' + str(source))
        if not source.is_file():
            continue
        info = zipfile.ZipInfo(source.relative_to(stage).as_posix(), stamp)
        info.create_system = 3
        info.external_attr = (0o100755 if source.stat().st_mode & 0o111 else 0o100644) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, source.read_bytes(), compresslevel=9)
