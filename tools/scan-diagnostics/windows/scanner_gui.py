"""Archivist Scanner Diagnostics for Windows — read-only, standard-library GUI."""
import json
import os
import queue
import re
import threading
import time
import traceback
import zipfile
from collections import Counter, defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk

VERSION = "1.0.0"
AUDIO = {".mp3", ".m4a", ".m4b", ".flac", ".ogg", ".opus", ".aac", ".wav", ".wma", ".aiff"}
COMICS = {".cbz", ".cbr", ".cbt"}
BOOKS = {".epub", ".pdf", ".mobi", ".azw", ".azw3"}
SIDECARS = {".opf", ".nfo", ".json", ".xml"}
MAX_RECORDS = 250_000
MAX_SAMPLES = 500
SLOW_MS = 1000
HANG_MS = 4000


def kind_of(name):
    ext = os.path.splitext(name)[1].lower()
    if ext in AUDIO:
        return "audio"
    if ext in COMICS:
        return "comic"
    if ext == ".pdf":
        return "pdf_ambiguous"
    if ext in BOOKS:
        return "ebook"
    if ext in SIDECARS:
        return "sidecar"
    return "other"


def looks_chapter(name):
    stem = os.path.splitext(name)[0]
    return bool(re.search(r"(?i)(?:^(?:chapter|ch|part|pt|track|disc|cd)\s*[-_.#:]?\s*\d+|\b(?:chapter|part|track|disc)\s*[-_.#:]?\s*\d+\b|^\d{1,4}[-_.\s])", stem))


def candidate_groups(entries):
    """Folder-based clues only. NOT Archivist's actual grouping algorithm."""
    buckets = defaultdict(list)
    for e in entries:
        if e.get("kind") == "audio":
            buckets[("audio", e["parent"])].append(e)
        elif e.get("kind") in ("comic", "pdf_ambiguous"):
            buckets[("comic_or_pdf", e["parent"])].append(e)
    groups = []
    for (kind, folder), files in buckets.items():
        chapter_count = sum(looks_chapter(x["name"]) for x in files)
        groups.append({
            "kind": kind, "folder": folder, "files": len(files),
            "chapterLikeFiles": chapter_count,
            "candidate": ("multipart_audio_folder" if kind == "audio" and len(files) > 1
                          and chapter_count >= 2 else "mixed_or_single"),
            "sampleFilenames": [x["name"] for x in files[:12]],
            "note": "Folder-based hypothesis, not the actual Archivist work count.",
        })
    return sorted(groups, key=lambda x: (-x["files"], x["folder"]))


def utc_now():
    return datetime.now(timezone.utc).isoformat()


class Collector:
    def __init__(self):
        self.lock = threading.RLock()
        self.reset("", True)

    def reset(self, root, sample):
        with self.lock:
            self.root = root
            self.sample = sample
            self.started_at = utc_now()
            self.started_monotonic = time.monotonic()
            self.ended_at = None
            self.entries = []
            self.folder_timings = []
            self.file_timings = []
            self.sample_timings = []
            self.errors = []
            self.warnings = []
            self.counters = Counter()
            self.active = {"operation": "idle", "path": "", "started": 0}
            self.max_operation_ms = 0
            self.cancelled = False
            self.finished = False

    def operation(self, name, path):
        with self.lock:
            self.active = {"operation": name, "path": path, "started": time.monotonic()}

    def end_operation(self, elapsed):
        with self.lock:
            self.max_operation_ms = max(self.max_operation_ms, round(elapsed * 1000))
            self.active = {"operation": "idle", "path": "", "started": 0}

    def add_entry(self, item):
        with self.lock:
            if len(self.entries) >= MAX_RECORDS:
                return False
            self.entries.append(item)
            self.counters["entries"] += 1
            self.counters[item.get("kind", "other")] += 1
            return True

    def add_folder(self, item):
        with self.lock:
            self.folder_timings.append(item)
            self.counters["directoriesScanned"] += 1
            if item["elapsedMs"] >= SLOW_MS:
                self.counters["slowFolders1s"] += 1

    def add_file_timing(self, path, elapsed, op):
        ms = round(elapsed * 1000, 2)
        with self.lock:
            self.counters[op + "Attempts"] += 1
            self.counters[op + "TotalMs"] += ms
            if ms >= SLOW_MS:
                self.counters[op + "Slow1s"] += 1
            if ms >= 100 or len(self.file_timings) < 30:
                self.file_timings.append({"path": path, "operation": op, "ms": ms})

    def add_error(self, path, operation, exc):
        with self.lock:
            self.errors.append({"path": path, "operation": operation, "error": str(exc)[:350]})
            self.counters["errors"] += 1

    def finish(self, cancelled):
        with self.lock:
            self.finished = True
            self.cancelled = cancelled
            self.ended_at = utc_now()
            self.active = {"operation": "idle", "path": "", "started": 0}

    def snapshot(self):
        with self.lock:
            ongoing_ms = (round((time.monotonic() - self.active["started"]) * 1000)
                          if self.active["started"] else 0)
            root = self.root
            entries = list(self.entries)
            folders = list(self.folder_timings)
            files = list(self.file_timings)
            samples = list(self.sample_timings)
            errors = list(self.errors)
            counters = dict(self.counters)
            active = dict(self.active)
            complete = self.finished
            warnings = list(self.warnings)
            cancelled = self.cancelled
            start = self.started_at
            end = self.ended_at
            sampled = self.sample
            max_ms = self.max_operation_ms
            elapsed_ms = round((time.monotonic()-self.started_monotonic)*1000)
        return {
            "schema": "archivist-windows-scanner-diagnostic-v1",
            "app": "Archivist Scanner Diagnostics Windows", "version": VERSION,
            "readOnly": True, "source": "Windows filesystem (local, mapped drive or UNC)",
            "scope": root, "startedAt": start, "snapshotAt": utc_now(), "endedAt": end,
            "finished": complete, "cancelRequested": cancelled,
            "elapsedMs": elapsed_ms, "sampleHeaders": sampled,
            "counts": counters, "activeOperation": active,
            "activeOperationElapsedMs": ongoing_ms,
            "maxCompletedOperationMs": max_ms,
            "entries": entries, "folderTimings": folders,
            "slowFileOperations": sorted(files, key=lambda v: -v["ms"])[:1000],
            "metadataSamples": samples, "errors": errors, "warnings": warnings,
            "groupingCandidates": candidate_groups(entries),
            "limitations": [
                "Folder-group candidates are hypotheses; the exact Archivist TypeScript grouping engine is not executed.",
                "Windows filesystem latency does not measure Android SAF latency.",
                "Windows cannot forcibly interrupt a blocked SMB system call. Export Partial Report remains available.",
                "No server, app, media file, archive or catalogue is modified.",
                "Filenames and paths are included: review for personal information before sharing.",
            ],
        }


def quick_probe(path, name):
    """Read only a small byte window. For ZIP comics, read ComicInfo.xml only if small."""
    kind = kind_of(name)
    ext = os.path.splitext(name)[1].lower()
    with open(path, "rb") as f:
        header = f.read(4096)
    result = {"signature": header[:16].hex(), "bytesRead": len(header)}
    if kind == "audio":
        result["id3Header"] = header.startswith(b"ID3")
        result["mp4Container"] = b"ftyp" in header[:64]
        result["flacHeader"] = header.startswith(b"fLaC")
    if ext in (".cbz", ".epub"):
        # ZIP central directory lookup is a realistic Android archive-metadata stall candidate.
        with zipfile.ZipFile(path) as z:
            members = z.namelist()
            result["archiveMembers"] = len(members)
            metadata = next((m for m in members if m.lower().endswith("/comicinfo.xml") or m.lower() == "comicinfo.xml"), None)
            if metadata:
                info = z.getinfo(metadata)
                result["comicInfoBytes"] = info.file_size
                if info.file_size <= 128 * 1024:
                    xml = z.read(metadata).decode("utf-8", "replace")
                    def tag(key):
                        m = re.search(r"<" + key + r">\s*(.*?)\s*</" + key + r">", xml, re.I | re.S)
                        return m.group(1).strip()[:120] if m else ""
                    result["comicInfo"] = {k: tag(k) for k in ("Series", "Number", "Volume", "Title", "Writer")}
    return result


def scan(collector, cancelled, out_queue):
    root = collector.root
    folders = deque([(root, "")])
    visited = set()
    sampled_folders = defaultdict(int)
    try:
        while folders and not cancelled.is_set():
            folder, relative = folders.popleft()
            folder_key = os.path.normcase(os.path.abspath(folder))
            if folder_key in visited:
                continue
            visited.add(folder_key)
            collector.operation("list_directory", relative or ".")
            t0 = time.monotonic()
            items = []
            try:
                with os.scandir(folder) as it:
                    for entry in it:
                        if cancelled.is_set():
                            break
                        items.append(entry)
            except OSError as ex:
                collector.add_error(relative, "list_directory", ex)
            elapsed = time.monotonic() - t0
            collector.end_operation(elapsed)
            collector.add_folder({"path": relative or ".", "entries": len(items),
                                  "elapsedMs": round(elapsed * 1000, 2)})
            for entry in items:
                if cancelled.is_set():
                    break
                rel = os.path.join(relative, entry.name)
                collector.operation("file_attributes", rel)
                t0 = time.monotonic()
                try:
                    directory = entry.is_dir(follow_symlinks=False)
                    link = entry.is_symlink()
                    # Avoid stat() on non-media files except where needed for group evidence.
                    info = entry.stat(follow_symlinks=False) if not directory else None
                except OSError as ex:
                    collector.add_error(rel, "file_attributes", ex)
                    collector.end_operation(time.monotonic()-t0)
                    continue
                elapsed = time.monotonic()-t0
                collector.end_operation(elapsed)
                collector.add_file_timing(rel, elapsed, "attributes")
                category = "folder" if directory else kind_of(entry.name)
                if not collector.add_entry({
                    "name": entry.name, "relativePath": rel, "parent": relative or ".",
                    "kind": category, "directory": directory, "symlink": link,
                    "size": info.st_size if info else None,
                    "modified": int(info.st_mtime) if info else None,
                }):
                    collector.warnings.append("Maximum entry limit reached")
                    cancelled.set()
                    break
                if directory and not link:
                    folders.append((entry.path, rel))
                elif info and collector.sample and category in ("audio", "comic", "pdf_ambiguous", "ebook"):
                    cap = 3 if category == "audio" else 2
                    if sampled_folders[(relative, category)] >= cap or len(collector.sample_timings) >= MAX_SAMPLES:
                        continue
                    sampled_folders[(relative, category)] += 1
                    collector.operation("sample_media_header", rel)
                    started = time.monotonic()
                    details = {}
                    error = None
                    try:
                        details = quick_probe(entry.path, entry.name)
                    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile) as ex:
                        error = str(ex)[:300]
                    elapsed = time.monotonic() - started
                    collector.end_operation(elapsed)
                    with collector.lock:
                        collector.sample_timings.append({
                            "path": rel, "kind": category, "elapsedMs": round(elapsed*1000, 2),
                            "details": details, "error": error,
                        })
                        collector.counters["mediaSamples"] += 1
                        collector.counters["mediaSamplesMs"] += round(elapsed*1000, 2)
                        if elapsed >= 1:
                            collector.counters["slowMediaSamples1s"] += 1
            out_queue.put("update")
    except Exception:
        collector.add_error("", "scanner", traceback.format_exc()[-3000:])
    finally:
        collector.finish(cancelled.is_set())
        out_queue.put("finished")


class App:
    def __init__(self, root):
        self.root = root
        root.title("Archivist — Scanner Diagnostics (read-only)")
        root.geometry("850x655")
        root.minsize(700, 500)
        self.collector = Collector()
        self.messages = queue.SimpleQueue()
        self.cancelled = threading.Event()
        self.worker = None
        self.folder = tk.StringVar()
        self.sample = tk.BooleanVar(value=True)
        outer = ttk.Frame(root, padding=18)
        outer.pack(fill="both", expand=True)
        ttk.Label(outer, text="Archivist Scanner Diagnostics", font=("Segoe UI", 17, "bold")).pack(anchor="w")
        ttk.Label(outer, text="Read-only  |  Local folders, mapped drives or network shares  |  No Archivist app changes",
                  foreground="#39736b").pack(anchor="w", pady=(0, 15))
        row = ttk.Frame(outer)
        row.pack(fill="x")
        ttk.Label(row, text="Library folder:").pack(side="left")
        ttk.Entry(row, textvariable=self.folder).pack(side="left", fill="x", expand=True, padx=8)
        ttk.Button(row, text="Browse…", command=self.browse).pack(side="left")
        opt = ttk.Frame(outer)
        opt.pack(fill="x", pady=8)
        ttk.Checkbutton(opt, text="Sample a few media headers / comic metadata per folder (recommended)",
                        variable=self.sample).pack(side="left")
        actions = ttk.Frame(outer)
        actions.pack(fill="x", pady=(4, 10))
        self.start_button = ttk.Button(actions, text="Start Scan", command=self.start)
        self.start_button.pack(side="left", padx=(0, 8))
        self.cancel_button = ttk.Button(actions, text="Cancel", command=self.cancel, state="disabled")
        self.cancel_button.pack(side="left", padx=(0, 8))
        self.export_button = ttk.Button(actions, text="Export JSON Report", command=self.export, state="disabled")
        self.export_button.pack(side="left")
        self.line = ttk.Label(outer, text="Choose your audiobook or comic library and click Start Scan.",
                              font=("Segoe UI", 11))
        self.line.pack(anchor="w", pady=(8, 5))
        self.progress = ttk.Progressbar(outer, mode="indeterminate")
        self.progress.pack(fill="x")
        ttk.Label(outer, text="Diagnostics (updates during scanning):", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(12, 0))
        self.log = scrolledtext.ScrolledText(outer, height=15, font=("Consolas", 10), wrap="word", state="disabled")
        self.log.pack(fill="both", expand=True, pady=6)
        ttk.Label(outer, text="Network timeouts: Windows may leave a blocked SMB operation running. Cancel and export the partial report.\nReports contain real filenames and paths; review before sharing.",
                  foreground="#8b5d2b").pack(anchor="w")
        root.after(250, self.tick)

    def browse(self):
        selected = filedialog.askdirectory(mustexist=True, title="Choose an audiobook or comic library")
        if selected:
            self.folder.set(selected)

    def write(self, line):
        self.log.configure(state="normal")
        self.log.insert("end", line + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    def start(self):
        if self.worker and self.worker.is_alive():
            messagebox.showinfo("Scanner running", "Cancel the current scan before starting another.")
            return
        path = self.folder.get().strip().strip('"')
        if not path:
            messagebox.showerror("Folder required", "Enter or browse to a local folder, mapped drive or UNC share.")
            return
        self.cancelled.clear()
        self.messages = queue.SimpleQueue()
        self.collector.reset(os.path.abspath(path), self.sample.get())
        self.worker = threading.Thread(target=scan, args=(self.collector, self.cancelled, self.messages),
                                       daemon=True, name="archivist-diagnostic-scan")
        self.worker.start()
        self.start_button.configure(state="disabled")
        self.cancel_button.configure(state="normal")
        self.export_button.configure(state="normal")
        self.progress.start(12)
        self.write("Starting read-only scan: " + path)

    def cancel(self):
        self.cancelled.set()
        self.write("Cancellation requested. If network I/O is blocked, export the partial report now.")
        self.cancel_button.configure(state="disabled")

    def tick(self):
        try:
            while True:
                event = self.messages.get_nowait()
                if event == "finished":
                    self.progress.stop()
                    self.cancel_button.configure(state="disabled")
                    self.start_button.configure(state="normal")
                    self.write("Scan finished. Export JSON Report and upload the file in ChatGPT.")
        except queue.Empty:
            pass
        with self.collector.lock:
            c = dict(self.collector.counters)
            active = dict(self.collector.active)
            started = self.collector.started_monotonic
            scanning = bool(self.worker and self.worker.is_alive())
        active_ms = round((time.monotonic() - active["started"])*1000) if active["started"] else 0
        elapsed = round(time.monotonic()-started, 1)
        operation = active["operation"]
        self.line.configure(text=(
            "Files: %s  |  Audio: %s  |  Comics: %s  |  PDFs: %s  |  Folders: %s  |  Elapsed: %.1fs"
            % (c.get("entries",0), c.get("audio",0), c.get("comic",0), c.get("pdf_ambiguous",0),
               c.get("directoriesScanned",0), elapsed)
        ))
        if scanning:
            danger = "  **POSSIBLE HANG**" if active_ms >= HANG_MS else ""
            self.root.title("Archivist Diagnostics — " + operation + ": " + str(active_ms) + "ms" + danger)
        else:
            self.root.title("Archivist — Scanner Diagnostics (read-only)")
        self.root.after(250, self.tick)

    def export(self):
        data = self.collector.snapshot()
        target = filedialog.asksaveasfilename(
            title="Save diagnostic report", defaultextension=".json",
            filetypes=[("JSON report", "*.json")],
            initialfile="Archivist-Windows-Scanner-%s.json" % datetime.now().strftime("%Y%m%d-%H%M%S"))
        if not target:
            return
        try:
            with open(target, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            self.write("Report saved: " + target)
            messagebox.showinfo("Report exported", "Upload this JSON here for diagnosis.\n\nNo library files were changed.")
        except OSError as ex:
            messagebox.showerror("Export failed", str(ex))


def main():
    root = tk.Tk()
    try:
        ttk.Style().theme_use("vista")
    except tk.TclError:
        pass
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
