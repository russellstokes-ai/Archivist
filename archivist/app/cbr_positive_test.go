package main

import (
	"bytes"
	"context"
	"encoding/binary"
	"hash/crc32"
	"os"
	"testing"
)

// A tiny uncompressed RAR4 fixture keeps archive decoding tests self-contained.
func TestStoredRARPages(t *testing.T) {
	var archive bytes.Buffer
	archive.Write([]byte{'R', 'a', 'r', '!', 0x1a, 7, 0})
	header := func(kind byte, flags uint16, body []byte) {
		var h bytes.Buffer
		h.WriteByte(kind)
		binary.Write(&h, binary.LittleEndian, flags)
		binary.Write(&h, binary.LittleEndian, uint16(7+len(body)))
		h.Write(body)
		binary.Write(&archive, binary.LittleEndian, uint16(crc32.ChecksumIEEE(h.Bytes())))
		archive.Write(h.Bytes())
	}
	header(0x73, 0, make([]byte, 6))
	content := []byte("test image payload")
	for _, name := range []string{"10.png", "2.png"} {
		var b bytes.Buffer
		binary.Write(&b, binary.LittleEndian, uint32(len(content)))
		binary.Write(&b, binary.LittleEndian, uint32(len(content)))
		b.WriteByte(3)
		binary.Write(&b, binary.LittleEndian, crc32.ChecksumIEEE(content))
		binary.Write(&b, binary.LittleEndian, uint32(0))
		b.WriteByte(20)
		b.WriteByte(0x30)
		binary.Write(&b, binary.LittleEndian, uint16(len(name)))
		binary.Write(&b, binary.LittleEndian, uint32(0100644))
		b.WriteString(name)
		header(0x74, 0x8000, b.Bytes())
		archive.Write(content)
	}
	header(0x7b, 0, nil)
	f, e := os.CreateTemp(t.TempDir(), "*.cbr")
	if e != nil {
		t.Fatal(e)
	}
	defer f.Close()
	f.Write(archive.Bytes())
	names, _, e := readRAR(context.Background(), f, "")
	if e != nil {
		t.Fatal(e)
	}
	if len(names) != 2 || names[0] != "2.png" {
		t.Fatal(names)
	}
	_, data, e := readRAR(context.Background(), f, "2.png")
	if e != nil || !bytes.Equal(data, content) {
		t.Fatal(e, string(data))
	}
}
