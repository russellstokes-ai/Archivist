import importlib.util
import os
import tempfile
import threading
import unittest
from pathlib import Path

location=Path(__file__).with_name("scanner_gui.py")
spec=importlib.util.spec_from_file_location("archivist_windows_scanner",str(location))
app=importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


class ScannerTests(unittest.TestCase):
    def test_formats_and_chapters(self):
        self.assertEqual(app.kind_of("Track01.MP3"),"audio")
        self.assertEqual(app.kind_of("Issue 01.CBZ"),"comic")
        self.assertEqual(app.kind_of("Comics.pdf"),"pdf_ambiguous")
        self.assertTrue(app.looks_chapter("001 - opening.mp3"))
        self.assertTrue(app.looks_chapter("Chapter 12.m4b"))
        self.assertFalse(app.looks_chapter("The Big Sleep.m4b"))

    def test_read_only_workload_and_export_structure(self):
        with tempfile.TemporaryDirectory() as root:
            book=Path(root)/"Author"/"Book 1"
            comic=Path(root)/"Comics"
            book.mkdir(parents=True)
            comic.mkdir()
            (book/"01 - Prologue.mp3").write_bytes(b"ID3"+b"x"*48)
            (book/"02 - Chapter 1.mp3").write_bytes(b"ID3"+b"x"*48)
            (comic/"Series 001.cbz").write_bytes(b"not-archive")
            paths=[book/"01 - Prologue.mp3",book/"02 - Chapter 1.mp3",comic/"Series 001.cbz"]
            originals={str(p):p.read_bytes() for p in paths}
            report=app.Collector()
            report.reset(root,True)
            app.scan(report,threading.Event(),__import__("queue").SimpleQueue())
            result=report.snapshot()
            self.assertEqual(result["counts"]["audio"],2)
            self.assertEqual(result["counts"]["comic"],1)
            self.assertEqual(result["counts"]["directoriesScanned"],4)
            self.assertEqual(result["counts"]["mediaSamples"],3)
            self.assertTrue(result["finished"])
            self.assertEqual(len(result["groupingCandidates"]),2)
            self.assertTrue(all(p.read_bytes()==originals[str(p)] for p in paths))
            self.assertTrue(any(item["error"] for item in result["metadataSamples"] if item["kind"]=="comic"))

    def test_cancelled_before_work_does_not_mutate(self):
        with tempfile.TemporaryDirectory() as root:
            report=app.Collector()
            report.reset(root,False)
            event=threading.Event()
            event.set()
            app.scan(report,event,__import__("queue").SimpleQueue())
            result=report.snapshot()
            self.assertTrue(result["cancelRequested"])
            self.assertTrue(result["finished"])


if __name__=="__main__":
    unittest.main()
