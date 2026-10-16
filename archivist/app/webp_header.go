package main

import (
    "bytes"
    "encoding/binary"
    "errors"
)

// webpCanvasDimensions inspects the bounded RIFF / VP8 family headers only.
// It does NOT inflate untrusted WebP pixels or depend on native C libraries.
// Valid formats: VP8 (lossy), VP8L (lossless), VP8X (extended/animated).
// Unknown, truncated, inconsistent or out-of-bounds headers fail closed.
func webpCanvasDimensions(data []byte) (int, int, error) {
    bad:=errors.New("invalid or truncated WebP image")
    if len(data)<30 || !bytes.Equal(data[:4],[]byte("RIFF")) ||
        !bytes.Equal(data[8:12],[]byte("WEBP")) {
        return 0,0,bad
    }
    declared:=uint64(binary.LittleEndian.Uint32(data[4:8]))+8
    if declared>uint64(len(data)) || declared<30 {
        return 0,0,bad
    }
    chunkLen:=uint64(binary.LittleEndian.Uint32(data[16:20]))
    if chunkLen>declared-20 || chunkLen>uint64(len(data)-20) {
        return 0,0,bad
    }
    body:=data[20:20+int(chunkLen)]
    var width,height int
    switch string(data[12:16]) {
    case "VP8 ":
        // Key frame signature 0x9d 0x01 0x2a; dimensions are 14-bit.
        if len(body)<10 || body[0]&1!=0 || !bytes.Equal(body[3:6],[]byte{0x9d,0x01,0x2a}) {
            return 0,0,bad
        }
        width=int(binary.LittleEndian.Uint16(body[6:8])&0x3fff)
        height=int(binary.LittleEndian.Uint16(body[8:10])&0x3fff)
    case "VP8L":
        // Lossless image signature, packed 14-bit width/height minus one.
        if len(body)<5 || body[0]!=0x2f {return 0,0,bad}
        width=1+int(body[1])+(int(body[2]&0x3f)<<8)
        height=1+int(body[2]>>6)+(int(body[3])<<2)+(int(body[4]&0x0f)<<10)
    case "VP8X":
        // Extended canvas fields are 24-bit little-endian, each minus one.
        if len(body)<10 {return 0,0,bad}
        width=1+int(body[4])+(int(body[5])<<8)+(int(body[6])<<16)
        height=1+int(body[7])+(int(body[8])<<8)+(int(body[9])<<16)
    default:
        return 0,0,bad
    }
    if !safeCoverDimensions(width,height) {
        return 0,0,errors.New("WebP dimensions exceed safe memory limits")
    }
    return width,height,nil
}
