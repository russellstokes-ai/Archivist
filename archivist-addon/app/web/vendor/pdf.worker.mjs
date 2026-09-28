/**
 * @licstart The following is the entire license notice for the
 * JavaScript code in this page
 *
 * Copyright 2024 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @licend The above is the entire license notice for the
 * JavaScript code in this page
 */

/**
 * pdfjsVersion = 6.3.289
 * pdfjsBuild = 1c8020a7d
 */

;// ./src/shared/util.js
const isNodeJS = typeof process === "object" && process + "" === "[object process]" && !process.versions.nw && !(process.versions.electron && process.type && process.type !== "browser");
const BBOX_INIT = [Infinity, Infinity, -Infinity, -Infinity];
const F32_BBOX_INIT = new Float32Array(BBOX_INIT);
const FONT_IDENTITY_MATRIX = [0.001, 0, 0, 0.001, 0, 0];
const LINE_FACTOR = 1.35;
const LINE_DESCENT_FACTOR = 0.35;
const BASELINE_FACTOR = LINE_DESCENT_FACTOR / LINE_FACTOR;
const SVG_NS = "http://www.w3.org/2000/svg";
const RenderingIntentFlag = {
  ANY: 0x01,
  DISPLAY: 0x02,
  PRINT: 0x04,
  SAVE: 0x08,
  ANNOTATIONS_FORMS: 0x10,
  ANNOTATIONS_STORAGE: 0x20,
  ANNOTATIONS_DISABLE: 0x40,
  IS_EDITING: 0x80,
  OPLIST: 0x100
};
const AnnotationMode = (/* unused pure expression or super */ null && ({
  DISABLE: 0,
  ENABLE: 1,
  ENABLE_FORMS: 2,
  ENABLE_STORAGE: 3
}));
const AnnotationPrefix = "pdfjs_internal_id_";
const AnnotationEditorPrefix = "pdfjs_internal_editor_";
const AnnotationEditorType = {
  DISABLE: -1,
  NONE: 0,
  FREETEXT: 3,
  HIGHLIGHT: 9,
  STAMP: 13,
  INK: 15,
  POPUP: 16,
  SIGNATURE: 101,
  COMMENT: 102
};
const AnnotationEditorParamsType = (/* unused pure expression or super */ null && ({
  RESIZE: 1,
  CREATE: 2,
  FREETEXT_SIZE: 11,
  FREETEXT_COLOR: 12,
  FREETEXT_OPACITY: 13,
  INK_COLOR: 21,
  INK_THICKNESS: 22,
  INK_OPACITY: 23,
  INK_COLOR_AND_OPACITY: 24,
  HIGHLIGHT_COLOR: 31,
  HIGHLIGHT_THICKNESS: 32,
  HIGHLIGHT_FREE: 33,
  HIGHLIGHT_SHOW_ALL: 34,
  DRAW_STEP: 41
}));
const PermissionFlag = {
  PRINT: 0x04,
  MODIFY_CONTENTS: 0x08,
  COPY: 0x10,
  MODIFY_ANNOTATIONS: 0x20,
  FILL_INTERACTIVE_FORMS: 0x100,
  COPY_FOR_ACCESSIBILITY: 0x200,
  ASSEMBLE: 0x400,
  PRINT_HIGH_QUALITY: 0x800
};
const MeshFigureType = {
  TRIANGLES: 1,
  LATTICE: 2,
  PATCH: 3
};
const TextRenderingMode = {
  FILL: 0,
  STROKE: 1,
  FILL_STROKE: 2,
  INVISIBLE: 3,
  FILL_ADD_TO_PATH: 4,
  STROKE_ADD_TO_PATH: 5,
  FILL_STROKE_ADD_TO_PATH: 6,
  ADD_TO_PATH: 7,
  FILL_STROKE_MASK: 3,
  ADD_TO_PATH_FLAG: 4
};
const ImageKind = {
  GRAYSCALE_1BPP: 1,
  RGB_24BPP: 2,
  RGBA_32BPP: 3
};
const AnnotationType = {
  TEXT: 1,
  LINK: 2,
  FREETEXT: 3,
  LINE: 4,
  SQUARE: 5,
  CIRCLE: 6,
  POLYGON: 7,
  POLYLINE: 8,
  HIGHLIGHT: 9,
  UNDERLINE: 10,
  SQUIGGLY: 11,
  STRIKEOUT: 12,
  STAMP: 13,
  CARET: 14,
  INK: 15,
  POPUP: 16,
  FILEATTACHMENT: 17,
  SOUND: 18,
  MOVIE: 19,
  WIDGET: 20,
  SCREEN: 21,
  PRINTERMARK: 22,
  TRAPNET: 23,
  WATERMARK: 24,
  THREED: 25,
  REDACT: 26,
  RICHMEDIA: 27
};
const AnnotationReplyType = {
  GROUP: "Group",
  REPLY: "R"
};
const AnnotationRenditionOperation = {
  PLAY_OR_RESUME: 0,
  STOP: 1,
  PAUSE: 2,
  RESUME: 3,
  PLAY: 4
};
const AnnotationFlag = {
  INVISIBLE: 0x01,
  HIDDEN: 0x02,
  PRINT: 0x04,
  NOZOOM: 0x08,
  NOROTATE: 0x10,
  NOVIEW: 0x20,
  READONLY: 0x40,
  LOCKED: 0x80,
  TOGGLENOVIEW: 0x100,
  LOCKEDCONTENTS: 0x200
};
const AnnotationFieldFlag = {
  READONLY: 0x0000001,
  REQUIRED: 0x0000002,
  NOEXPORT: 0x0000004,
  MULTILINE: 0x0001000,
  PASSWORD: 0x0002000,
  NOTOGGLETOOFF: 0x0004000,
  RADIO: 0x0008000,
  PUSHBUTTON: 0x0010000,
  COMBO: 0x0020000,
  EDIT: 0x0040000,
  SORT: 0x0080000,
  FILESELECT: 0x0100000,
  MULTISELECT: 0x0200000,
  DONOTSPELLCHECK: 0x0400000,
  DONOTSCROLL: 0x0800000,
  COMB: 0x1000000,
  RICHTEXT: 0x2000000,
  RADIOSINUNISON: 0x2000000,
  COMMITONSELCHANGE: 0x4000000
};
const AnnotationBorderStyleType = {
  SOLID: 1,
  DASHED: 2,
  BEVELED: 3,
  INSET: 4,
  UNDERLINE: 5
};
const AnnotationActionEventType = {
  E: "Mouse Enter",
  X: "Mouse Exit",
  D: "Mouse Down",
  U: "Mouse Up",
  Fo: "Focus",
  Bl: "Blur",
  PO: "PageOpen",
  PC: "PageClose",
  PV: "PageVisible",
  PI: "PageInvisible",
  K: "Keystroke",
  F: "Format",
  V: "Validate",
  C: "Calculate"
};
const DocumentActionEventType = {
  WC: "WillClose",
  WS: "WillSave",
  DS: "DidSave",
  WP: "WillPrint",
  DP: "DidPrint"
};
const PageActionEventType = {
  O: "PageOpen",
  C: "PageClose"
};
const VerbosityLevel = {
  ERRORS: 0,
  WARNINGS: 1,
  INFOS: 5
};
const OPS = {
  dependency: 1,
  setLineWidth: 2,
  setLineCap: 3,
  setLineJoin: 4,
  setMiterLimit: 5,
  setDash: 6,
  setRenderingIntent: 7,
  setFlatness: 8,
  setGState: 9,
  save: 10,
  restore: 11,
  transform: 12,
  moveTo: 13,
  lineTo: 14,
  curveTo: 15,
  curveTo2: 16,
  curveTo3: 17,
  closePath: 18,
  rectangle: 19,
  stroke: 20,
  closeStroke: 21,
  fill: 22,
  eoFill: 23,
  fillStroke: 24,
  eoFillStroke: 25,
  closeFillStroke: 26,
  closeEOFillStroke: 27,
  endPath: 28,
  clip: 29,
  eoClip: 30,
  beginText: 31,
  endText: 32,
  setCharSpacing: 33,
  setWordSpacing: 34,
  setHScale: 35,
  setLeading: 36,
  setFont: 37,
  setTextRenderingMode: 38,
  setTextRise: 39,
  moveText: 40,
  setLeadingMoveText: 41,
  setTextMatrix: 42,
  nextLine: 43,
  showText: 44,
  showSpacedText: 45,
  nextLineShowText: 46,
  nextLineSetSpacingShowText: 47,
  setCharWidth: 48,
  setCharWidthAndBounds: 49,
  setStrokeColorSpace: 50,
  setFillColorSpace: 51,
  setStrokeColor: 52,
  setStrokeColorN: 53,
  setFillColor: 54,
  setFillColorN: 55,
  setStrokeGray: 56,
  setFillGray: 57,
  setStrokeRGBColor: 58,
  setFillRGBColor: 59,
  setStrokeCMYKColor: 60,
  setFillCMYKColor: 61,
  shadingFill: 62,
  beginInlineImage: 63,
  beginImageData: 64,
  endInlineImage: 65,
  paintXObject: 66,
  markPoint: 67,
  markPointProps: 68,
  beginMarkedContent: 69,
  beginMarkedContentProps: 70,
  endMarkedContent: 71,
  beginCompat: 72,
  endCompat: 73,
  paintFormXObjectBegin: 74,
  paintFormXObjectEnd: 75,
  beginGroup: 76,
  endGroup: 77,
  beginAnnotation: 80,
  endAnnotation: 81,
  paintImageMaskXObject: 83,
  paintImageMaskXObjectGroup: 84,
  paintImageXObject: 85,
  paintInlineImageXObject: 86,
  paintInlineImageXObjectGroup: 87,
  paintImageXObjectRepeat: 88,
  paintImageMaskXObjectRepeat: 89,
  paintSolidColorImageMask: 90,
  constructPath: 91,
  setStrokeTransparent: 92,
  setFillTransparent: 93,
  rawFillPath: 94
};
const DrawOPS = {
  moveTo: 0,
  lineTo: 1,
  curveTo: 2,
  quadraticCurveTo: 3,
  closePath: 4
};
const PasswordResponses = {
  NEED_PASSWORD: 1,
  INCORRECT_PASSWORD: 2
};
let verbosity = VerbosityLevel.WARNINGS;
function setVerbosityLevel(level) {
  if (Number.isInteger(level)) {
    verbosity = level;
  }
}
function getVerbosityLevel() {
  return verbosity;
}
function info(msg) {
  if (verbosity >= VerbosityLevel.INFOS) {
    console.info(`Info: ${msg}`);
  }
}
function warn(msg) {
  if (verbosity >= VerbosityLevel.WARNINGS) {
    console.warn(`Warning: ${msg}`);
  }
}
function unreachable(msg) {
  throw new Error(msg);
}
function assert(cond, msg) {
  if (!cond) {
    unreachable(msg);
  }
}
function _isValidProtocol(url) {
  switch (url?.protocol) {
    case "http:":
    case "https:":
    case "ftp:":
    case "mailto:":
    case "tel:":
      return true;
    default:
      return false;
  }
}
function createValidAbsoluteUrl(url, baseUrl = null, options = null) {
  if (!url) {
    return null;
  }
  if (options && typeof url === "string") {
    if (options.addDefaultProtocol && url.startsWith("www.")) {
      const dots = url.match(/\./g);
      if (dots?.length >= 2) {
        url = `http://${url}`;
      }
    }
    if (options.tryConvertEncoding) {
      try {
        url = stringToUTF8String(url);
      } catch {}
    }
  }
  const absoluteUrl = baseUrl ? URL.parse(url, baseUrl) : URL.parse(url);
  return _isValidProtocol(absoluteUrl) ? absoluteUrl : null;
}
function updateUrlHash(url, hash, allowRel = false) {
  const res = URL.parse(url);
  if (res) {
    res.hash = hash;
    return res.href;
  }
  if (allowRel && createValidAbsoluteUrl(url, "http://example.com")) {
    return url.split("#", 1)[0] + `${hash ? `#${hash}` : ""}`;
  }
  return "";
}
function stripPath(str) {
  return str.substring(str.lastIndexOf("/") + 1);
}
function shadow(obj, prop, value, nonSerializable = false) {
  Object.defineProperty(obj, prop, {
    value,
    enumerable: !nonSerializable,
    configurable: true,
    writable: false
  });
  return value;
}
const BaseException = function BaseExceptionClosure() {
  function BaseException(message, name) {
    this.message = message;
    this.name = name;
  }
  BaseException.prototype = new Error();
  BaseException.constructor = BaseException;
  return BaseException;
}();
class PasswordException extends BaseException {
  constructor(msg, code) {
    super(msg, "PasswordException");
    this.code = code;
  }
}
class UnknownErrorException extends BaseException {
  constructor(msg, details) {
    super(msg, "UnknownErrorException");
    this.details = details;
  }
}
class InvalidPDFException extends BaseException {
  constructor(msg) {
    super(msg, "InvalidPDFException");
  }
}
class ResponseException extends BaseException {
  constructor(msg, status, missing) {
    super(msg, "ResponseException");
    this.status = status;
    this.missing = missing;
  }
}
class FormatError extends BaseException {
  constructor(msg) {
    super(msg, "FormatError");
  }
}
class AbortException extends BaseException {
  constructor(msg) {
    super(msg, "AbortException");
  }
}
function bytesToString(bytes) {
  if (typeof bytes !== "object" || bytes?.length === undefined) {
    unreachable("Invalid argument for bytesToString");
  }
  const length = bytes.length;
  const MAX_ARGUMENT_COUNT = 8192;
  if (length < MAX_ARGUMENT_COUNT) {
    return String.fromCharCode.apply(null, bytes);
  }
  const strBuf = [];
  for (let i = 0; i < length; i += MAX_ARGUMENT_COUNT) {
    const chunkEnd = Math.min(i + MAX_ARGUMENT_COUNT, length);
    const chunk = bytes.subarray(i, chunkEnd);
    strBuf.push(String.fromCharCode.apply(null, chunk));
  }
  return strBuf.join("");
}
function stringToBytes(str) {
  if (typeof str !== "string") {
    unreachable("Invalid argument for stringToBytes");
  }
  const length = str.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; ++i) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}
class FeatureTest {
  static get isLittleEndian() {
    const buffer8 = new Uint8Array(4);
    buffer8[0] = 1;
    const view32 = new Uint32Array(buffer8.buffer, 0, 1);
    return shadow(this, "isLittleEndian", view32[0] === 1);
  }
  static get isOffscreenCanvasSupported() {
    return shadow(this, "isOffscreenCanvasSupported", typeof OffscreenCanvas !== "undefined");
  }
  static get isImageDecoderSupported() {
    return shadow(this, "isImageDecoderSupported", typeof ImageDecoder !== "undefined");
  }
  static get isFloat16ArraySupported() {
    return shadow(this, "isFloat16ArraySupported", typeof Float16Array !== "undefined");
  }
  static get isSanitizerSupported() {
    return shadow(this, "isSanitizerSupported", typeof Sanitizer !== "undefined");
  }
  static get platform() {
    const {
      platform,
      userAgent
    } = navigator;
    return shadow(this, "platform", {
      isAndroid: userAgent.includes("Android"),
      isLinux: platform.includes("Linux"),
      isMac: platform.includes("Mac"),
      isWindows: platform.includes("Win"),
      isFirefox: userAgent.includes("Firefox")
    });
  }
  static get isCanvasFilterSupported() {
    let ctx;
    if (this.isOffscreenCanvasSupported) {
      ctx = new OffscreenCanvas(1, 1).getContext("2d");
    }
    return shadow(this, "isCanvasFilterSupported", ctx?.filter !== undefined);
  }
  static get isAlphaColorInputSupported() {
    return shadow(this, "isAlphaColorInputSupported", false);
  }
  static get isBackdropFilterSupported() {
    return shadow(this, "isBackdropFilterSupported", typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "blur(1px)"));
  }
}
class Util {
  static get hexNums() {
    return shadow(this, "hexNums", Array.from({
      length: 256
    }, (_, n) => n.toString(16).padStart(2, "0")));
  }
  static makeHexColor(r, g, b) {
    return `#${this.hexNums[r]}${this.hexNums[g]}${this.hexNums[b]}`;
  }
  static transform(m1, m2) {
    return [m1[0] * m2[0] + m1[2] * m2[1], m1[1] * m2[0] + m1[3] * m2[1], m1[0] * m2[2] + m1[2] * m2[3], m1[1] * m2[2] + m1[3] * m2[3], m1[0] * m2[4] + m1[2] * m2[5] + m1[4], m1[1] * m2[4] + m1[3] * m2[5] + m1[5]];
  }
  static multiplyByDOMMatrix(m, md) {
    return [m[0] * md.a + m[2] * md.b, m[1] * md.a + m[3] * md.b, m[0] * md.c + m[2] * md.d, m[1] * md.c + m[3] * md.d, m[0] * md.e + m[2] * md.f + m[4], m[1] * md.e + m[3] * md.f + m[5]];
  }
  static applyTransform(p, m, pos = 0) {
    const p0 = p[pos];
    const p1 = p[pos + 1];
    p[pos] = p0 * m[0] + p1 * m[2] + m[4];
    p[pos + 1] = p0 * m[1] + p1 * m[3] + m[5];
  }
  static applyTransformToBezier(p, transform, pos = 0) {
    const m0 = transform[0];
    const m1 = transform[1];
    const m2 = transform[2];
    const m3 = transform[3];
    const m4 = transform[4];
    const m5 = transform[5];
    for (let i = 0; i < 6; i += 2) {
      const pI = p[pos + i];
      const pI1 = p[pos + i + 1];
      p[pos + i] = pI * m0 + pI1 * m2 + m4;
      p[pos + i + 1] = pI * m1 + pI1 * m3 + m5;
    }
  }
  static applyInverseTransform(p, m) {
    const p0 = p[0];
    const p1 = p[1];
    const d = m[0] * m[3] - m[1] * m[2];
    p[0] = (p0 * m[3] - p1 * m[2] + m[2] * m[5] - m[4] * m[3]) / d;
    p[1] = (-p0 * m[1] + p1 * m[0] + m[4] * m[1] - m[5] * m[0]) / d;
  }
  static axialAlignedBoundingBox(rect, transform, output) {
    const m0 = transform[0];
    const m1 = transform[1];
    const m2 = transform[2];
    const m3 = transform[3];
    const m4 = transform[4];
    const m5 = transform[5];
    const r0 = rect[0];
    const r1 = rect[1];
    const r2 = rect[2];
    const r3 = rect[3];
    let a0 = m0 * r0 + m4;
    let a2 = a0;
    let a1 = m0 * r2 + m4;
    let a3 = a1;
    let b0 = m3 * r1 + m5;
    let b2 = b0;
    let b1 = m3 * r3 + m5;
    let b3 = b1;
    if (m1 !== 0 || m2 !== 0) {
      const m1r0 = m1 * r0;
      const m1r2 = m1 * r2;
      const m2r1 = m2 * r1;
      const m2r3 = m2 * r3;
      a0 += m2r1;
      a3 += m2r1;
      a1 += m2r3;
      a2 += m2r3;
      b0 += m1r0;
      b3 += m1r0;
      b1 += m1r2;
      b2 += m1r2;
    }
    output[0] = Math.min(output[0], a0, a1, a2, a3);
    output[1] = Math.min(output[1], b0, b1, b2, b3);
    output[2] = Math.max(output[2], a0, a1, a2, a3);
    output[3] = Math.max(output[3], b0, b1, b2, b3);
  }
  static inverseTransform(m) {
    const d = m[0] * m[3] - m[1] * m[2];
    return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[4] * m[3]) / d, (m[4] * m[1] - m[5] * m[0]) / d];
  }
  static singularValueDecompose2dScale(matrix, output) {
    const m0 = matrix[0];
    const m1 = matrix[1];
    const m2 = matrix[2];
    const m3 = matrix[3];
    const a = m0 ** 2 + m1 ** 2;
    const b = m0 * m2 + m1 * m3;
    const c = m2 ** 2 + m3 ** 2;
    const first = (a + c) / 2;
    const second = Math.sqrt(first ** 2 - (a * c - b ** 2));
    output[0] = Math.sqrt(first + second || 1);
    output[1] = Math.sqrt(first - second || 1);
  }
  static normalizeRect(rect) {
    const r = rect.slice(0);
    if (rect[0] > rect[2]) {
      r[0] = rect[2];
      r[2] = rect[0];
    }
    if (rect[1] > rect[3]) {
      r[1] = rect[3];
      r[3] = rect[1];
    }
    return r;
  }
  static intersect(rect1, rect2) {
    const xLow = Math.max(Math.min(rect1[0], rect1[2]), Math.min(rect2[0], rect2[2]));
    const xHigh = Math.min(Math.max(rect1[0], rect1[2]), Math.max(rect2[0], rect2[2]));
    if (xLow > xHigh) {
      return null;
    }
    const yLow = Math.max(Math.min(rect1[1], rect1[3]), Math.min(rect2[1], rect2[3]));
    const yHigh = Math.min(Math.max(rect1[1], rect1[3]), Math.max(rect2[1], rect2[3]));
    if (yLow > yHigh) {
      return null;
    }
    return [xLow, yLow, xHigh, yHigh];
  }
  static pointBoundingBox(x, y, minMax) {
    minMax[0] = Math.min(minMax[0], x);
    minMax[1] = Math.min(minMax[1], y);
    minMax[2] = Math.max(minMax[2], x);
    minMax[3] = Math.max(minMax[3], y);
  }
  static rectBoundingBox(x0, y0, x1, y1, minMax) {
    minMax[0] = Math.min(minMax[0], x0, x1);
    minMax[1] = Math.min(minMax[1], y0, y1);
    minMax[2] = Math.max(minMax[2], x0, x1);
    minMax[3] = Math.max(minMax[3], y0, y1);
  }
  static #getExtremumOnCurve(x0, x1, x2, x3, y0, y1, y2, y3, t, minMax) {
    if (t <= 0 || t >= 1) {
      return;
    }
    const mt = 1 - t;
    const tt = t * t;
    const ttt = tt * t;
    const x = mt * (mt * (mt * x0 + 3 * t * x1) + 3 * tt * x2) + ttt * x3;
    const y = mt * (mt * (mt * y0 + 3 * t * y1) + 3 * tt * y2) + ttt * y3;
    minMax[0] = Math.min(minMax[0], x);
    minMax[1] = Math.min(minMax[1], y);
    minMax[2] = Math.max(minMax[2], x);
    minMax[3] = Math.max(minMax[3], y);
  }
  static #getExtremum(x0, x1, x2, x3, y0, y1, y2, y3, a, b, c, minMax) {
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) >= 1e-12) {
        this.#getExtremumOnCurve(x0, x1, x2, x3, y0, y1, y2, y3, -c / b, minMax);
      }
      return;
    }
    const delta = b ** 2 - 4 * c * a;
    if (delta < 0) {
      return;
    }
    const sqrtDelta = Math.sqrt(delta);
    const a2 = 2 * a;
    this.#getExtremumOnCurve(x0, x1, x2, x3, y0, y1, y2, y3, (-b + sqrtDelta) / a2, minMax);
    this.#getExtremumOnCurve(x0, x1, x2, x3, y0, y1, y2, y3, (-b - sqrtDelta) / a2, minMax);
  }
  static bezierBoundingBox(x0, y0, x1, y1, x2, y2, x3, y3, minMax) {
    minMax[0] = Math.min(minMax[0], x0, x3);
    minMax[1] = Math.min(minMax[1], y0, y3);
    minMax[2] = Math.max(minMax[2], x0, x3);
    minMax[3] = Math.max(minMax[3], y0, y3);
    this.#getExtremum(x0, x1, x2, x3, y0, y1, y2, y3, 3 * (-x0 + 3 * (x1 - x2) + x3), 6 * (x0 - 2 * x1 + x2), 3 * (x1 - x0), minMax);
    this.#getExtremum(x0, x1, x2, x3, y0, y1, y2, y3, 3 * (-y0 + 3 * (y1 - y2) + y3), 6 * (y0 - 2 * y1 + y2), 3 * (y1 - y0), minMax);
  }
}
function stringToUTF8String(str) {
  return decodeURIComponent(escape(str));
}
function utf8StringToString(str) {
  return unescape(encodeURIComponent(str));
}
function isArrayEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0, ii = arr1.length; i < ii; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
let NormalizeRegex = null;
let NormalizationMap = null;
function normalizeUnicode(str) {
  if (!NormalizeRegex) {
    NormalizeRegex = /([\u00a0\u00b5\u037e\u0eb3\u2000-\u200a\u202f\u2126\ufb00-\ufb04\ufb06\ufb20-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufba1\ufba4-\ufba9\ufbae-\ufbb1\ufbd3-\ufbdc\ufbde-\ufbe7\ufbea-\ufbf8\ufbfc\ufbfd\ufc00-\ufc5d\ufc64-\ufcf1\ufcf5-\ufd3d\ufd88\ufdf4\ufdfa\ufdfb\ufe71\ufe77\ufe79\ufe7b\ufe7d]+)|(\ufb05+)/gu;
    NormalizationMap = new Map([["ï¬…", "Å¿t"]]);
  }
  return str.replaceAll(NormalizeRegex, (_, p1, p2) => p1 ? p1.normalize("NFKC") : NormalizationMap.get(p2));
}
function getUuid() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return bytesToString(buf);
}
function _isValidExplicitDest(validRef, validName, dest) {
  if (!Array.isArray(dest) || dest.length < 2) {
    return false;
  }
  const [page, zoom, ...args] = dest;
  if (!validRef(page) && !Number.isInteger(page)) {
    return false;
  }
  if (!validName(zoom)) {
    return false;
  }
  const argsLen = args.length;
  let allowNull = true;
  switch (zoom.name) {
    case "XYZ":
      if (argsLen < 2 || argsLen > 3) {
        return false;
      }
      break;
    case "Fit":
    case "FitB":
      return argsLen === 0;
    case "FitH":
    case "FitBH":
    case "FitV":
    case "FitBV":
      if (argsLen > 1) {
        return false;
      }
      break;
    case "FitR":
      if (argsLen !== 4) {
        return false;
      }
      allowNull = false;
      break;
    default:
      return false;
  }
  for (const arg of args) {
    if (typeof arg === "number" || allowNull && arg === null) {
      continue;
    }
    return false;
  }
  return true;
}
const makeArr = () => [];
const makeMap = () => new Map();
const makeObj = () => Object.create(null);
const makeSet = () => new Set();
if (typeof Iterator.prototype.join !== "function") {
  Iterator.prototype.join = function (separator) {
    return [...this].join(separator);
  };
}

;// ./src/core/primitives.js

const CIRCULAR_REF = Symbol("CIRCULAR_REF");
const EOF = Symbol("EOF");
let CmdCache = Object.create(null);
let NameCache = Object.create(null);
let RefCache = Object.create(null);
function clearPrimitiveCaches() {
  CmdCache = Object.create(null);
  NameCache = Object.create(null);
  RefCache = Object.create(null);
}
class Name {
  constructor(name) {
    this.name = name;
  }
  static get(name) {
    return NameCache[name] ||= new Name(name);
  }
}
class Cmd {
  constructor(cmd) {
    this.cmd = cmd;
  }
  static get(cmd) {
    return CmdCache[cmd] ||= new Cmd(cmd);
  }
}
const nonSerializable = () => nonSerializable;
class Dict {
  __nonSerializable__ = nonSerializable;
  #map = new Map();
  objId = null;
  suppressEncryption = false;
  xref;
  constructor(xref = null) {
    this.xref = xref;
  }
  assignXref(newXref) {
    this.xref = newXref;
  }
  get size() {
    return this.#map.size;
  }
  #getValue(isAsync, key1, key2) {
    let value = this.#map.get(key1);
    if (value === undefined && key2 !== undefined) {
      value = this.#map.get(key2);
    }
    if (value instanceof Ref && this.xref) {
      return isAsync ? this.xref.fetchAsync(value, this.suppressEncryption) : this.xref.fetch(value, this.suppressEncryption);
    }
    return value;
  }
  get(key1, key2) {
    return this.#getValue(false, key1, key2);
  }
  async getAsync(key1, key2) {
    return this.#getValue(true, key1, key2);
  }
  getArray(key1, key2) {
    let value = this.#getValue(false, key1, key2);
    if (Array.isArray(value)) {
      value = value.slice();
      for (let i = 0, ii = value.length; i < ii; i++) {
        if (value[i] instanceof Ref && this.xref) {
          value[i] = this.xref.fetch(value[i], this.suppressEncryption);
        }
      }
    }
    return value;
  }
  getRaw(key) {
    return this.#map.get(key);
  }
  getKeys() {
    return this.#map.keys();
  }
  getRawValues() {
    return this.#map.values();
  }
  getRawEntries() {
    return this.#map.entries();
  }
  set(key, value) {
    this.#map.set(key, value);
  }
  setIfNotExists(key, value) {
    if (!this.has(key)) {
      this.set(key, value);
    }
  }
  setIfNumber(key, value) {
    if (typeof value === "number") {
      this.set(key, value);
    }
  }
  setIfArray(key, value) {
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      this.set(key, value);
    }
  }
  setIfDefined(key, value) {
    if (value !== undefined && value !== null) {
      this.set(key, value);
    }
  }
  setIfName(key, value) {
    if (typeof value === "string") {
      this.set(key, Name.get(value));
    } else if (value instanceof Name) {
      this.set(key, value);
    }
  }
  setIfDict(key, value) {
    if (value instanceof Dict) {
      this.set(key, value);
    }
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      yield [key, value instanceof Ref && this.xref ? this.xref.fetch(value, this.suppressEncryption) : value];
    }
  }
  static get empty() {
    const emptyDict = new Dict(null);
    emptyDict.set = (key, value) => {
      unreachable("Should not call `set` on the empty dictionary.");
    };
    return shadow(this, "empty", emptyDict);
  }
  static merge({
    xref,
    dictArray,
    mergeSubDicts = false
  }) {
    const mergedDict = new Dict(xref),
      properties = new Map();
    for (const dict of dictArray) {
      if (!(dict instanceof Dict)) {
        continue;
      }
      for (const [key, value] of dict.getRawEntries()) {
        const property = properties.getOrInsertComputed(key, makeArr);
        if (property.length && !(mergeSubDicts && value instanceof Dict)) {
          continue;
        }
        property.push(value);
      }
    }
    for (const [name, values] of properties) {
      if (values.length === 1 || !(values[0] instanceof Dict)) {
        mergedDict.set(name, values[0]);
        continue;
      }
      const subDict = new Dict(xref);
      for (const dict of values) {
        for (const [key, value] of dict.getRawEntries()) {
          subDict.setIfNotExists(key, value);
        }
      }
      if (subDict.size > 0) {
        mergedDict.set(name, subDict);
      }
    }
    properties.clear();
    return mergedDict.size > 0 ? mergedDict : Dict.empty;
  }
  clone() {
    const dict = new Dict(this.xref);
    for (const [key, value] of this.#map) {
      dict.set(key, value);
    }
    return dict;
  }
  delete(key) {
    this.#map.delete(key);
  }
}
class Ref {
  #str;
  constructor(str, num, gen) {
    this.#str = str;
    this.num = num;
    this.gen = gen;
  }
  toString() {
    return this.#str;
  }
  static fromString(str) {
    const ref = RefCache[str];
    if (ref) {
      return ref;
    }
    const m = /^(\d+)R(\d*)$/.exec(str);
    if (!m || m[1] === "0") {
      return null;
    }
    const num = parseInt(m[1], 10),
      gen = !m[2] ? 0 : parseInt(m[2], 10);
    return RefCache[str] = new Ref(str, num, gen);
  }
  static get(num, gen) {
    const str = gen === 0 ? `${num}R` : `${num}R${gen}`;
    return RefCache[str] ||= new Ref(str, num, gen);
  }
}
class RefSet {
  #set = new Set();
  constructor(parent = null) {
    if (parent) {
      for (const refStr of parent) {
        this.#set.add(refStr);
      }
    }
  }
  has(ref) {
    return this.#set.has(ref.toString());
  }
  put(ref) {
    this.#set.add(ref.toString());
  }
  remove(ref) {
    this.#set.delete(ref.toString());
  }
  [Symbol.iterator]() {
    return this.#set.keys();
  }
  clear() {
    this.#set.clear();
  }
}
class RefMap {
  #map = new Map();
  get size() {
    return this.#map.size;
  }
  get(ref) {
    return this.#map.get(ref.toString());
  }
  has(ref) {
    return this.#map.has(ref.toString());
  }
  put(ref, obj) {
    this.#map.set(ref.toString(), obj);
  }
  putAlias(ref, aliasRef) {
    this.#map.set(ref.toString(), this.get(aliasRef));
  }
  getOrPutComputed(ref, callback) {
    const map = this.#map,
      refStr = ref.toString();
    if (!map.has(refStr)) {
      map.set(refStr, callback(ref));
    }
    return map.get(refStr);
  }
  [Symbol.iterator]() {
    return this.#map.values();
  }
  clear() {
    this.#map.clear();
  }
  *values() {
    yield* this.#map.values();
  }
  *items() {
    for (const [ref, value] of this.#map) {
      yield [Ref.fromString(ref), value];
    }
  }
  *keys() {
    for (const ref of this.#map.keys()) {
      yield Ref.fromString(ref);
    }
  }
}
function isName(v, name) {
  return v instanceof Name && (name === undefined || v.name === name);
}
function isCmd(v, cmd) {
  return v instanceof Cmd && (cmd === undefined || v.cmd === cmd);
}
function isDict(v, type) {
  return v instanceof Dict && (type === undefined || isName(v.get("Type"), type));
}
function isRefsEqual(v1, v2) {
  return v1.num === v2.num && v1.gen === v2.gen;
}

;// ./src/core/base_stream.js

class BaseStream {
  get length() {
    unreachable("Abstract getter `length` accessed");
  }
  get isEmpty() {
    unreachable("Abstract getter `isEmpty` accessed");
  }
  get isDataLoaded() {
    return shadow(this, "isDataLoaded", true);
  }
  getByte() {
    unreachable("Abstract method `getByte` called");
  }
  getBytes(length) {
    unreachable("Abstract method `getBytes` called");
  }
  async getImageData(length, decoderOptions) {
    return this.getBytes(length, decoderOptions);
  }
  async asyncGetBytes() {
    unreachable("Abstract method `asyncGetBytes` called");
  }
  get isAsync() {
    return false;
  }
  get isAsyncDecoder() {
    return false;
  }
  get isImageStream() {
    return false;
  }
  get canAsyncDecodeImageFromBuffer() {
    return false;
  }
  async getTransferableImage(width, height) {
    return null;
  }
  peekByte() {
    const peekedByte = this.getByte();
    if (peekedByte !== -1) {
      this.pos--;
    }
    return peekedByte;
  }
  peekBytes(length) {
    const bytes = this.getBytes(length);
    this.pos -= bytes.length;
    return bytes;
  }
  getUint16() {
    const b0 = this.getByte();
    const b1 = this.getByte();
    if (b0 === -1 || b1 === -1) {
      return -1;
    }
    return (b0 << 8) + b1;
  }
  getInt32() {
    const b0 = this.getByte();
    const b1 = this.getByte();
    const b2 = this.getByte();
    const b3 = this.getByte();
    return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
  }
  getByteRange(begin, end) {
    unreachable("Abstract method `getByteRange` called");
  }
  getString(length) {
    return bytesToString(this.getBytes(length));
  }
  skip(n) {
    this.pos += n || 1;
  }
  reset() {
    unreachable("Abstract method `reset` called");
  }
  moveStart() {
    unreachable("Abstract method `moveStart` called");
  }
  makeSubStream(start, length, dict = null) {
    unreachable("Abstract method `makeSubStream` called");
  }
  clone() {
    unreachable("Abstract method `clone` called");
  }
  getBaseStreams() {
    return null;
  }
  getOriginalStream() {
    return this.stream?.getOriginalStream() || this;
  }
}

;// ./src/shared/css_utils.js
const CONTROL_CHAR_REGEXP = /\p{Cc}/u;
function isCSSString(str) {
  const quote = str[0];
  if (str.length < 2 || quote !== `"` && quote !== `'` || str.at(-1) !== quote) {
    return false;
  }
  const end = str.length - 1;
  for (let i = 1; i < end; i++) {
    const char = str[i];
    if (char === quote || CONTROL_CHAR_REGEXP.test(char)) {
      return false;
    }
    if (char === "\\") {
      if (++i >= end || CONTROL_CHAR_REGEXP.test(str[i])) {
        return false;
      }
    }
  }
  return true;
}
function serializeFontFamily(fontFamily) {
  if (isCSSString(fontFamily)) {
    return fontFamily;
  }
  const escaped = fontFamily.replaceAll(/["\\\p{Cc}]/gu, char => char === `"` || char === "\\" ? `\\${char}` : `\\${char.codePointAt(0).toString(16)} `);
  return `"${escaped}"`;
}

;// ./src/core/string_utils.js

function isAscii(str) {
  return typeof str === "string" && (!str || /^[\x00-\x7F]*$/.test(str));
}
function stringToAsciiOrUTF16BE(str) {
  return str === null || str === undefined || isAscii(str) ? str : stringToUTF16String(str, true);
}
function stringToUTF16HexString(str) {
  const buf = [];
  for (let i = 0, ii = str.length; i < ii; i++) {
    const char = str.charCodeAt(i);
    buf.push(Util.hexNums[char >> 8 & 0xff], Util.hexNums[char & 0xff]);
  }
  return buf.join("");
}
function stringToUTF16String(str, bigEndian = false) {
  const buf = [];
  if (bigEndian) {
    buf.push("\xFE\xFF");
  }
  for (let i = 0, ii = str.length; i < ii; i++) {
    const char = str.charCodeAt(i);
    buf.push(String.fromCharCode(char >> 8 & 0xff), String.fromCharCode(char & 0xff));
  }
  return buf.join("");
}
const PDFStringTranslateTable = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x2d8, 0x2c7, 0x2c6, 0x2d9, 0x2dd, 0x2db, 0x2da, 0x2dc, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x2022, 0x2020, 0x2021, 0x2026, 0x2014, 0x2013, 0x192, 0x2044, 0x2039, 0x203a, 0x2212, 0x2030, 0x201e, 0x201c, 0x201d, 0x2018, 0x2019, 0x201a, 0x2122, 0xfb01, 0xfb02, 0x141, 0x152, 0x160, 0x178, 0x17d, 0x131, 0x142, 0x153, 0x161, 0x17e, 0, 0x20ac];
const PDFStringTextDecoders = Object.create(null);
function stringToPDFString(str, keepEscapeSequence = false) {
  if (str[0] >= "\xEF") {
    let encoding;
    if (str[0] === "\xFE" && str[1] === "\xFF") {
      encoding = "utf-16be";
      if (str.length % 2 === 1) {
        str = str.slice(0, -1);
      }
    } else if (str[0] === "\xFF" && str[1] === "\xFE") {
      encoding = "utf-16le";
      if (str.length % 2 === 1) {
        str = str.slice(0, -1);
      }
    } else if (str[0] === "\xEF" && str[1] === "\xBB" && str[2] === "\xBF") {
      encoding = "utf-8";
    }
    if (encoding) {
      try {
        const decoder = PDFStringTextDecoders[encoding] ??= new TextDecoder(encoding, {
          fatal: true
        });
        const buffer = stringToBytes(str);
        const decoded = decoder.decode(buffer);
        if (keepEscapeSequence || !decoded.includes("\x1b")) {
          return decoded;
        }
        return decoded.replaceAll(/\x1b[^\x1b]*(?:\x1b|$)/g, "");
      } catch (ex) {
        warn(`stringToPDFString: "${ex}".`);
      }
    }
  }
  const strBuf = [];
  for (let i = 0, ii = str.length; i < ii; i++) {
    const charCode = str.charCodeAt(i);
    if (!keepEscapeSequence && charCode === 0x1b) {
      while (++i < ii && str.charCodeAt(i) !== 0x1b) {}
      continue;
    }
    const code = PDFStringTranslateTable[charCode];
    strBuf.push(code ? String.fromCharCode(code) : str.charAt(i));
  }
  return strBuf.join("");
}

;// ./src/core/core_utils.js





const PDF_VERSION_REGEXP = /^[1-9]\.\d$/;
const MAX_INT_32 = 2 ** 31 - 1;
const IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];
const RESOURCES_KEYS_OPERATOR_LIST = ["ColorSpace", "ExtGState", "Font", "Pattern", "Properties", "Shading", "XObject"];
const RESOURCES_KEYS_TEXT_CONTENT = ["ExtGState", "Font", "Properties", "XObject"];
function getLookupTableFactory(initializer, useArray = false) {
  let lookup;
  return function () {
    if (initializer) {
      lookup = useArray ? [] : Object.create(null);
      initializer(lookup);
      initializer = null;
    }
    return lookup;
  };
}
class MissingDataException extends BaseException {
  constructor(begin, end) {
    super(`Missing data [${begin}, ${end})`, "MissingDataException");
    this.begin = begin;
    this.end = end;
  }
}
class ParserEOFException extends BaseException {
  constructor(msg) {
    super(msg, "ParserEOFException");
  }
}
class XRefEntryException extends BaseException {
  constructor(msg) {
    super(msg, "XRefEntryException");
  }
}
class XRefParseException extends BaseException {
  constructor(msg) {
    super(msg, "XRefParseException");
  }
}
function arrayBuffersToBytes(arr) {
  const length = arr.length;
  if (length === 0) {
    return new Uint8Array(0);
  }
  if (length === 1) {
    return new Uint8Array(arr[0]);
  }
  let dataLength = 0;
  for (let i = 0; i < length; i++) {
    dataLength += arr[i].byteLength;
  }
  const data = new Uint8Array(dataLength);
  let pos = 0;
  for (let i = 0; i < length; i++) {
    const item = new Uint8Array(arr[i]);
    data.set(item, pos);
    pos += item.byteLength;
  }
  return data;
}
async function fetchBinaryData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file "${url}" with "${response.statusText}".`);
  }
  return response.bytes();
}
function getInheritableProperty({
  dict,
  key,
  getArray = false,
  stopWhenFound = true
}) {
  let values;
  const visited = new RefSet();
  while (dict instanceof Dict && !(dict.objId && visited.has(dict.objId))) {
    if (dict.objId) {
      visited.put(dict.objId);
    }
    const value = getArray ? dict.getArray(key) : dict.get(key);
    if (value !== undefined) {
      if (stopWhenFound) {
        return value;
      }
      (values ||= []).push(value);
    }
    dict = dict.get("Parent");
  }
  return values;
}
function getParentToUpdate(dict, ref, xref) {
  const visited = new RefSet();
  const firstDict = dict;
  const result = {
    dict: null,
    ref: null
  };
  while (dict instanceof Dict && !visited.has(ref)) {
    visited.put(ref);
    if (dict.has("T")) {
      break;
    }
    ref = dict.getRaw("Parent");
    if (!(ref instanceof Ref)) {
      return result;
    }
    dict = xref.fetch(ref);
  }
  if (dict instanceof Dict && dict !== firstDict) {
    result.dict = dict;
    result.ref = ref;
  }
  return result;
}
function deepCompare(a, b) {
  if (a === b) {
    return true;
  }
  if (a instanceof Ref && b instanceof Ref) {
    return isRefsEqual(a, b);
  }
  if (a instanceof Name && b instanceof Name) {
    return a.name === b.name;
  }
  if (a instanceof Dict && b instanceof Dict) {
    if (a.size !== b.size) {
      return false;
    }
    for (const [key, value1] of a.getRawEntries()) {
      const value2 = b.getRaw(key);
      if (value2 === undefined || !deepCompare(value1, value2)) {
        return false;
      }
    }
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, ii = a.length; i < ii; i++) {
      if (!deepCompare(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  return false;
}
const ROMAN_NUMBER_MAP = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM", "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
function toRomanNumerals(number, lowerCase = false) {
  assert(Number.isInteger(number) && number > 0, "The number should be a positive integer.");
  const roman = "M".repeat(number / 1000 | 0) + ROMAN_NUMBER_MAP[number % 1000 / 100 | 0] + ROMAN_NUMBER_MAP[10 + (number % 100 / 10 | 0)] + ROMAN_NUMBER_MAP[20 + number % 10];
  return lowerCase ? roman.toLowerCase() : roman;
}
function isWhiteSpace(ch) {
  return ch === 0x20 || ch === 0x09 || ch === 0x0d || ch === 0x0a;
}
function isBooleanArray(arr, len) {
  return Array.isArray(arr) && (len === null || arr.length === len) && arr.every(x => typeof x === "boolean");
}
function isNumberArray(arr, len) {
  if (Array.isArray(arr)) {
    return (len === null || arr.length === len) && arr.every(x => typeof x === "number");
  }
  return ArrayBuffer.isView(arr) && !(arr instanceof BigInt64Array || arr instanceof BigUint64Array) && (len === null || arr.length === len);
}
function lookupMatrix(arr, fallback) {
  return isNumberArray(arr, 6) ? arr : fallback;
}
function lookupRect(arr, fallback) {
  return isNumberArray(arr, 4) ? arr : fallback;
}
function lookupNormalRect(arr, fallback) {
  return isNumberArray(arr, 4) ? Util.normalizeRect(arr) : fallback;
}
function parseXFAPath(path) {
  const positionPattern = /^(.+)\[(\d+)\]$/;
  return path.split(".").map(component => {
    const m = component.match(positionPattern);
    if (m) {
      return {
        name: m[1],
        pos: parseInt(m[2], 10)
      };
    }
    return {
      name: component,
      pos: 0
    };
  });
}
function escapePDFName(str) {
  const buffer = [];
  let start = 0;
  for (let i = 0, ii = str.length; i < ii; i++) {
    const char = str.charCodeAt(i);
    if (char < 0x21 || char > 0x7e || char === 0x23 || char === 0x28 || char === 0x29 || char === 0x3c || char === 0x3e || char === 0x5b || char === 0x5d || char === 0x7b || char === 0x7d || char === 0x2f || char === 0x25) {
      if (start < i) {
        buffer.push(str.substring(start, i));
      }
      buffer.push(`#${char.toString(16).padStart(2, "0")}`);
      start = i + 1;
    }
  }
  if (buffer.length === 0) {
    return str;
  }
  if (start < str.length) {
    buffer.push(str.substring(start));
  }
  return buffer.join("");
}
function escapeString(str) {
  return str.replaceAll(/([()\\\n\r])/g, match => {
    if (match === "\n") {
      return "\\n";
    } else if (match === "\r") {
      return "\\r";
    }
    return `\\${match}`;
  });
}
function _collectJS(entry, xref, list, parents) {
  if (!entry) {
    return;
  }
  let parent = null;
  if (entry instanceof Ref) {
    if (parents.has(entry)) {
      return;
    }
    parent = entry;
    parents.put(parent);
    entry = xref.fetch(entry);
  }
  if (Array.isArray(entry)) {
    for (const element of entry) {
      _collectJS(element, xref, list, parents);
    }
  } else if (entry instanceof Dict) {
    if (isName(entry.get("S"), "JavaScript")) {
      const js = entry.get("JS");
      let code;
      if (js instanceof BaseStream) {
        code = js.getString();
      } else if (typeof js === "string") {
        code = js;
      }
      code &&= stringToPDFString(code, true).replaceAll("\x00", "");
      if (code) {
        list.push(code.trim());
      }
    }
    _collectJS(entry.getRaw("Next"), xref, list, parents);
  }
  if (parent) {
    parents.remove(parent);
  }
}
function collectActions(xref, dict, eventType) {
  const actions = new Map();
  const additionalActionsDicts = getInheritableProperty({
    dict,
    key: "AA",
    stopWhenFound: false
  });
  if (additionalActionsDicts) {
    for (let i = additionalActionsDicts.length - 1; i >= 0; i--) {
      const additionalActions = additionalActionsDicts[i];
      if (!(additionalActions instanceof Dict)) {
        continue;
      }
      for (const [key, rawActionDict] of additionalActions.getRawEntries()) {
        const action = eventType[key];
        if (!action) {
          continue;
        }
        const parents = new RefSet();
        const list = [];
        _collectJS(rawActionDict, xref, list, parents);
        if (list.length > 0) {
          actions.set(action, list);
        }
      }
    }
  }
  if (dict.has("A")) {
    const actionDict = dict.get("A");
    const parents = new RefSet();
    const list = [];
    _collectJS(actionDict, xref, list, parents);
    if (list.length > 0) {
      actions.set("Action", list);
    }
  }
  return actions.size ? actions : null;
}
const XMLEntities = {
  0x3c: "&lt;",
  0x3e: "&gt;",
  0x26: "&amp;",
  0x22: "&quot;",
  0x27: "&apos;"
};
function* codePointIter(str) {
  for (let i = 0, ii = str.length; i < ii; i++) {
    const char = str.codePointAt(i);
    if (char > 0xd7ff && (char < 0xe000 || char > 0xfffd)) {
      i++;
    }
    yield char;
  }
}
function encodeToXmlString(str) {
  const buffer = [];
  let start = 0;
  for (let i = 0, ii = str.length; i < ii; i++) {
    const char = str.codePointAt(i);
    if (0x20 <= char && char <= 0x7e) {
      const entity = XMLEntities[char];
      if (entity) {
        if (start < i) {
          buffer.push(str.substring(start, i));
        }
        buffer.push(entity);
        start = i + 1;
      }
    } else {
      if (start < i) {
        buffer.push(str.substring(start, i));
      }
      buffer.push(`&#x${char.toString(16).toUpperCase()};`);
      if (char > 0xffff) {
        i++;
      }
      start = i + 1;
    }
  }
  if (buffer.length === 0) {
    return str;
  }
  if (start < str.length) {
    buffer.push(str.substring(start));
  }
  return buffer.join("");
}
function validateFontName(fontFamily, mustWarn = false) {
  const m = /^("|').*("|')$/.exec(fontFamily);
  if (m && m[1] === m[2]) {
    const re = new RegExp(`[^\\\\]${m[1]}`);
    if (re.test(fontFamily.slice(1, -1))) {
      if (mustWarn) {
        warn(`FontFamily contains unescaped ${m[1]}: ${fontFamily}.`);
      }
      return false;
    }
    if (CONTROL_CHAR_REGEXP.test(fontFamily)) {
      if (mustWarn) {
        warn(`FontFamily contains control characters: ${fontFamily}.`);
      }
      return false;
    }
  } else {
    for (const ident of fontFamily.split(/[ \t]+/)) {
      if (/^(?:\d|-[\d-])/.test(ident) || !/^[\w\\-]+$/.test(ident)) {
        if (mustWarn) {
          warn(`FontFamily contains invalid <custom-ident>: ${fontFamily}.`);
        }
        return false;
      }
    }
  }
  return true;
}
function normalizeCSSFontFamily(fontFamily) {
  return fontFamily.replaceAll(/( +)(\d)?/g, (_, spaces, digit) => digit ?? " ");
}
function validateCSSFont(cssFontInfo) {
  const DEFAULT_CSS_FONT_OBLIQUE = "14";
  const DEFAULT_CSS_FONT_WEIGHT = "400";
  const CSS_FONT_WEIGHT_VALUES = new Set(["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000", "normal", "bold", "bolder", "lighter"]);
  const {
    fontFamily,
    fontWeight,
    italicAngle
  } = cssFontInfo;
  if (!validateFontName(fontFamily, true)) {
    return false;
  }
  const weight = fontWeight ? fontWeight.toString() : "";
  cssFontInfo.fontWeight = CSS_FONT_WEIGHT_VALUES.has(weight) ? weight : DEFAULT_CSS_FONT_WEIGHT;
  const angle = parseFloat(italicAngle);
  cssFontInfo.italicAngle = isNaN(angle) || angle < -90 || angle > 90 ? DEFAULT_CSS_FONT_OBLIQUE : italicAngle.toString();
  return true;
}
function recoverJsURL(str) {
  const URL_OPEN_METHODS = ["app.launchURL", "window.open", "xfa.host.gotoURL"];
  const regex = new RegExp("^\\s*(" + URL_OPEN_METHODS.join("|").replaceAll(".", "\\.") + ")\\((?:'|\")([^'\"]*)(?:'|\")(?:,\\s*(\\w+)\\)|\\))", "i");
  const jsUrl = regex.exec(str);
  if (jsUrl?.[2]) {
    return {
      url: jsUrl[2],
      newWindow: jsUrl[1] === "app.launchURL" && jsUrl[3] === "true"
    };
  }
  return null;
}
function numberToString(value) {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  const roundedValue = Math.round(value * 100);
  if (roundedValue % 100 === 0) {
    return (roundedValue / 100).toString();
  }
  if (roundedValue % 10 === 0) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}
function getNewAnnotationsMap(annotationStorage) {
  if (!annotationStorage) {
    return null;
  }
  const newAnnotationsByPage = new Map();
  for (const [key, value] of annotationStorage) {
    if (!key.startsWith(AnnotationEditorPrefix)) {
      continue;
    }
    newAnnotationsByPage.getOrInsertComputed(value.pageIndex, makeArr).push(value);
  }
  return newAnnotationsByPage.size > 0 ? newAnnotationsByPage : null;
}
function getModificationDate(date = new Date()) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const buffer = [date.getUTCFullYear().toString(), (date.getUTCMonth() + 1).toString().padStart(2, "0"), date.getUTCDate().toString().padStart(2, "0"), date.getUTCHours().toString().padStart(2, "0"), date.getUTCMinutes().toString().padStart(2, "0"), date.getUTCSeconds().toString().padStart(2, "0")];
  return buffer.join("");
}
function getRotationMatrix(rotation, width, height) {
  switch (rotation) {
    case 90:
      return [0, 1, -1, 0, width, 0];
    case 180:
      return [-1, 0, 0, -1, width, height];
    case 270:
      return [0, -1, 1, 0, 0, height];
    default:
      throw new Error("Invalid rotation");
  }
}
function getSizeInBytes(x) {
  return Math.ceil(Math.ceil(Math.log2(1 + x)) / 8);
}

;// ./external/qcms/qcms_utils.js
const ALPHA_MASK = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1 ? 0xff000000 : 0x000000ff;
const RGB_MASK = ~ALPHA_MASK;
class QCMS {
  static #memoryArray = null;
  static _memory = null;
  static _destBuffer = null;
  static _destOffset = 0;
  static _keepAlpha = false;
  static get _memoryArray() {
    const array = this.#memoryArray;
    if (array?.byteLength) {
      return array;
    }
    return this.#memoryArray = new Uint8Array(this._memory.buffer);
  }
}
function copy_result(ptr, len) {
  const {
    _destBuffer,
    _destOffset,
    _keepAlpha,
    _memoryArray
  } = QCMS;
  if (!_keepAlpha) {
    _destBuffer.set(_memoryArray.subarray(ptr, ptr + len), _destOffset);
    return;
  }
  const count = len >> 2;
  const destStart = _destBuffer.byteOffset + _destOffset;
  if (((destStart | ptr) & 3) === 0) {
    const dest32 = new Uint32Array(_destBuffer.buffer, destStart, count);
    const src32 = new Uint32Array(QCMS._memory.buffer, ptr, count);
    for (let i = 0; i < count; i++) {
      dest32[i] = dest32[i] & ALPHA_MASK | src32[i] & RGB_MASK;
    }
    return;
  }
  for (let i = ptr, ii = ptr + len, j = _destOffset; i < ii; i += 4, j += 4) {
    _destBuffer[j] = _memoryArray[i];
    _destBuffer[j + 1] = _memoryArray[i + 1];
    _destBuffer[j + 2] = _memoryArray[i + 2];
  }
}

;// ./external/qcms/qcms.js

const DataType = Object.freeze({
  RGB8: 0,
  "0": "RGB8",
  RGBA8: 1,
  "1": "RGBA8",
  BGRA8: 2,
  "2": "BGRA8",
  Gray8: 3,
  "3": "Gray8",
  GrayA8: 4,
  "4": "GrayA8",
  CMYK: 5,
  "5": "CMYK"
});
const Intent = Object.freeze({
  Perceptual: 0,
  "0": "Perceptual",
  RelativeColorimetric: 1,
  "1": "RelativeColorimetric",
  Saturation: 2,
  "2": "Saturation",
  AbsoluteColorimetric: 3,
  "3": "AbsoluteColorimetric"
});
function qcms_convert_array(transformer, src, add_alpha) {
  const ptr0 = passArray8ToWasm0(src, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  wasm.qcms_convert_array(transformer, ptr0, len0, add_alpha);
}
function qcms_convert_four(transformer, src1, src2, src3, src4) {
  const ret = wasm.qcms_convert_four(transformer, src1, src2, src3, src4);
  return ret >>> 0;
}
function qcms_convert_one(transformer, src) {
  const ret = wasm.qcms_convert_one(transformer, src);
  return ret >>> 0;
}
function qcms_convert_three(transformer, src1, src2, src3) {
  const ret = wasm.qcms_convert_three(transformer, src1, src2, src3);
  return ret >>> 0;
}
function qcms_drop_transformer(transformer) {
  wasm.qcms_drop_transformer(transformer);
}
function qcms_transformer_from_memory(mem, in_type, intent) {
  const ptr0 = passArray8ToWasm0(mem, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.qcms_transformer_from_memory(ptr0, len0, in_type, intent);
  return ret >>> 0;
}
function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbg___wbindgen_throw_344f42d3211c4765: function (arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    },
    __wbg_copy_result_0d15f3bf9d9012ae: function (arg0, arg1) {
      copy_result(arg0 >>> 0, arg1 >>> 0);
    },
    __wbindgen_init_externref_table: function () {
      const table = wasm.__wbindgen_externrefs;
      const offset = table.grow(4);
      table.set(0, undefined);
      table.set(offset + 0, undefined);
      table.set(offset + 1, null);
      table.set(offset + 2, true);
      table.set(offset + 3, false);
    }
  };
  return {
    __proto__: null,
    "./qcms_bg.js": import0
  };
}
function getStringFromWasm0(ptr, len) {
  return decodeText(ptr >>> 0, len);
}
let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
let cachedTextDecoder = new TextDecoder('utf-8', {
  ignoreBOM: true,
  fatal: true
});
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder('utf-8', {
      ignoreBOM: true,
      fatal: true
    });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
let WASM_VECTOR_LEN = 0;
let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
  wasmInstance = instance;
  wasm = instance.exports;
  wasmModule = module;
  cachedUint8ArrayMemory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}
async function __wbg_load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse = module.ok && expectedResponseType(module.type);
        if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return {
        instance,
        module
      };
    } else {
      return instance;
    }
  }
  function expectedResponseType(type) {
    switch (type) {
      case 'basic':
      case 'cors':
      case 'default':
        return true;
    }
    return false;
  }
}
function initSync(module) {
  if (wasm !== undefined) return wasm;
  if (module !== undefined) {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({
        module
      } = module);
    } else {
      console.warn('using deprecated parameters for `initSync()`; pass a single object instead');
    }
  }
  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}
async function __wbg_init(module_or_path) {
  if (wasm !== undefined) return wasm;
  if (module_or_path !== undefined) {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({
        module_or_path
      } = module_or_path);
    } else {
      console.warn('using deprecated parameters for the initialization function; pass a single object instead');
    }
  }
  const imports = __wbg_get_imports();
  if (typeof module_or_path === 'string' || typeof Request === 'function' && module_or_path instanceof Request || typeof URL === 'function' && module_or_path instanceof URL) {
    module_or_path = fetch(module_or_path);
  }
  const {
    instance,
    module
  } = await __wbg_load(await module_or_path, imports);
  return __wbg_finalize_init(instance, module);
}

;// ./src/shared/math_clamp.js
function MathClamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

;// ./src/core/colorspace.js



function resizeRgbImage(src, dest, w1, h1, w2, h2, alpha01) {
  const COMPONENTS = 3;
  alpha01 = alpha01 !== 1 ? 0 : alpha01;
  const xRatio = w1 / w2;
  const yRatio = h1 / h2;
  let newIndex = 0,
    oldIndex;
  const xScaled = new Uint16Array(w2);
  const w1Scanline = w1 * COMPONENTS;
  for (let i = 0; i < w2; i++) {
    xScaled[i] = Math.floor(i * xRatio) * COMPONENTS;
  }
  for (let i = 0; i < h2; i++) {
    const py = Math.floor(i * yRatio) * w1Scanline;
    for (let j = 0; j < w2; j++) {
      oldIndex = py + xScaled[j];
      dest[newIndex++] = src[oldIndex++];
      dest[newIndex++] = src[oldIndex++];
      dest[newIndex++] = src[oldIndex++];
      newIndex += alpha01;
    }
  }
}
function resizeRgbaImage(src, dest, w1, h1, w2, h2, alpha01) {
  const xRatio = w1 / w2;
  const yRatio = h1 / h2;
  let newIndex = 0;
  const xScaled = new Uint16Array(w2);
  if (alpha01 === 1) {
    for (let i = 0; i < w2; i++) {
      xScaled[i] = Math.floor(i * xRatio);
    }
    const src32 = new Uint32Array(src.buffer);
    const dest32 = new Uint32Array(dest.buffer);
    const rgbMask = FeatureTest.isLittleEndian ? 0x00ffffff : 0xffffff00;
    for (let i = 0; i < h2; i++) {
      const buf = src32.subarray(Math.floor(i * yRatio) * w1);
      for (let j = 0; j < w2; j++) {
        dest32[newIndex++] |= buf[xScaled[j]] & rgbMask;
      }
    }
  } else {
    const COMPONENTS = 4;
    const w1Scanline = w1 * COMPONENTS;
    for (let i = 0; i < w2; i++) {
      xScaled[i] = Math.floor(i * xRatio) * COMPONENTS;
    }
    for (let i = 0; i < h2; i++) {
      const buf = src.subarray(Math.floor(i * yRatio) * w1Scanline);
      for (let j = 0; j < w2; j++) {
        const oldIndex = xScaled[j];
        dest[newIndex++] = buf[oldIndex];
        dest[newIndex++] = buf[oldIndex + 1];
        dest[newIndex++] = buf[oldIndex + 2];
      }
    }
  }
}
function copyRgbaImage(src, dest, alpha01) {
  if (alpha01 === 1) {
    const src32 = new Uint32Array(src.buffer);
    const dest32 = new Uint32Array(dest.buffer);
    const rgbMask = FeatureTest.isLittleEndian ? 0x00ffffff : 0xffffff00;
    for (let i = 0, ii = src32.length; i < ii; i++) {
      dest32[i] |= src32[i] & rgbMask;
    }
  } else {
    let j = 0;
    for (let i = 0, ii = src.length; i < ii; i += 4) {
      dest[j++] = src[i];
      dest[j++] = src[i + 1];
      dest[j++] = src[i + 2];
    }
  }
}
function isDefaultDecodeHelper(decode, expectedLen) {
  if (!Array.isArray(decode)) {
    return true;
  }
  const decodeLen = decode.length;
  if (decodeLen < expectedLen) {
    warn("Decode map length is too short.");
    return true;
  }
  if (decodeLen > expectedLen) {
    info("Truncating too long decode map.");
    decode.length = expectedLen;
  }
  return false;
}
class ColorSpace {
  static #rgbBuf = new Uint8ClampedArray(3);
  constructor(name, numComps) {
    this.name = name;
    this.numComps = numComps;
  }
  getRgb(src, srcOffset, output = new Uint8ClampedArray(3)) {
    this.getRgbItem(src, srcOffset, output, 0);
    return output;
  }
  getRgbHex(src, srcOffset) {
    const buffer = this.getRgb(src, srcOffset, ColorSpace.#rgbBuf);
    return Util.makeHexColor(buffer[0], buffer[1], buffer[2]);
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    unreachable("Should not call ColorSpace.getRgbItem");
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    unreachable("Should not call ColorSpace.getRgbBuffer");
  }
  getRgbItems(src, count, dest, destOffset, alpha01) {
    const {
      numComps
    } = this;
    for (let i = 0, srcOffset = 0; i < count; i++, srcOffset += numComps) {
      this.getRgbItem(src, srcOffset, dest, destOffset);
      destOffset += 3 + alpha01;
    }
  }
  isPassthrough(bits) {
    return false;
  }
  isDefaultDecode(decode, bpc) {
    return ColorSpace.isDefaultDecode(decode, this.numComps);
  }
  fillRgb(dest, originalWidth, originalHeight, width, height, actualHeight, bpc, comps, alpha01) {
    const count = originalWidth * originalHeight;
    let rgbBuf = null;
    const numComponentColors = 1 << bpc;
    const needsResizing = originalHeight !== height || originalWidth !== width;
    if (this.isPassthrough(bpc)) {
      rgbBuf = comps;
    } else if (this.numComps === 1 && count > numComponentColors && this.name !== "DeviceGray" && this.name !== "DeviceRGB") {
      const allColors = bpc <= 8 ? new Uint8Array(numComponentColors) : new Uint16Array(numComponentColors);
      for (let i = 0; i < numComponentColors; i++) {
        allColors[i] = i;
      }
      const colorMap = new Uint8ClampedArray(numComponentColors * 3);
      this.getRgbBuffer(allColors, 0, numComponentColors, colorMap, 0, bpc, 0);
      if (!needsResizing) {
        let destPos = 0;
        for (let i = 0; i < count; ++i) {
          const key = comps[i] * 3;
          dest[destPos++] = colorMap[key];
          dest[destPos++] = colorMap[key + 1];
          dest[destPos++] = colorMap[key + 2];
          destPos += alpha01;
        }
      } else {
        rgbBuf = new Uint8Array(count * 3);
        let rgbPos = 0;
        for (let i = 0; i < count; ++i) {
          const key = comps[i] * 3;
          rgbBuf[rgbPos++] = colorMap[key];
          rgbBuf[rgbPos++] = colorMap[key + 1];
          rgbBuf[rgbPos++] = colorMap[key + 2];
        }
      }
    } else if (!needsResizing) {
      this.getRgbBuffer(comps, 0, width * actualHeight, dest, 0, bpc, alpha01);
    } else {
      rgbBuf = new Uint8ClampedArray(count * 3);
      this.getRgbBuffer(comps, 0, count, rgbBuf, 0, bpc, 0);
    }
    if (rgbBuf) {
      if (needsResizing) {
        resizeRgbImage(rgbBuf, dest, originalWidth, originalHeight, width, height, alpha01);
      } else {
        let destPos = 0,
          rgbPos = 0;
        for (let i = 0, ii = width * actualHeight; i < ii; i++) {
          dest[destPos++] = rgbBuf[rgbPos++];
          dest[destPos++] = rgbBuf[rgbPos++];
          dest[destPos++] = rgbBuf[rgbPos++];
          destPos += alpha01;
        }
      }
    }
  }
  get usesZeroToOneRange() {
    return shadow(this, "usesZeroToOneRange", true);
  }
  static isDefaultDecode(decode, numComps) {
    if (isDefaultDecodeHelper(decode, numComps * 2)) {
      return true;
    }
    for (let i = 0, ii = decode.length; i < ii; i += 2) {
      if (decode[i] !== 0 || decode[i + 1] !== 1) {
        return false;
      }
    }
    return true;
  }
}
class AlternateCS extends ColorSpace {
  constructor(numComps, base, tintFn) {
    super("Alternate", numComps);
    this.base = base;
    this.tintFn = tintFn;
    this.tmpBuf = new Float32Array(base.numComps);
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    const tmpBuf = this.tmpBuf;
    this.tintFn(src, srcOffset, tmpBuf, 0);
    this.base.getRgbItem(tmpBuf, 0, dest, destOffset);
  }
  getRgbItems(src, count, dest, destOffset, alpha01) {
    const {
      base,
      numComps,
      tintFn
    } = this;
    const baseNumComps = base.numComps;
    const tinted = new Float32Array(count * baseNumComps);
    for (let i = 0, srcOffset = 0, tintedOffset = 0; i < count; i++) {
      tintFn(src, srcOffset, tinted, tintedOffset);
      srcOffset += numComps;
      tintedOffset += baseNumComps;
    }
    base.getRgbItems(tinted, count, dest, destOffset, alpha01);
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    const tintFn = this.tintFn;
    const base = this.base;
    const scale = 1 / ((1 << bits) - 1);
    const baseNumComps = base.numComps;
    const usesZeroToOneRange = base.usesZeroToOneRange;
    const isPassthrough = (base.isPassthrough(8) || !usesZeroToOneRange) && alpha01 === 0;
    let pos = isPassthrough ? destOffset : 0;
    const baseBuf = isPassthrough ? dest : new Uint8ClampedArray(baseNumComps * count);
    const numComps = this.numComps;
    const scaled = new Float32Array(numComps);
    const tinted = new Float32Array(baseNumComps);
    let i, j;
    for (i = 0; i < count; i++) {
      for (j = 0; j < numComps; j++) {
        scaled[j] = src[srcOffset++] * scale;
      }
      tintFn(scaled, 0, tinted, 0);
      if (usesZeroToOneRange) {
        for (j = 0; j < baseNumComps; j++) {
          baseBuf[pos++] = tinted[j] * 255;
        }
      } else {
        base.getRgbItem(tinted, 0, baseBuf, pos);
        pos += baseNumComps;
      }
    }
    if (!isPassthrough) {
      base.getRgbBuffer(baseBuf, 0, count, dest, destOffset, 8, alpha01);
    }
  }
}
class PatternCS extends ColorSpace {
  constructor(baseCS) {
    super("Pattern", null);
    this.base = baseCS;
  }
  isDefaultDecode(decode, bpc) {
    unreachable("Should not call PatternCS.isDefaultDecode");
  }
}
class IndexedCS extends ColorSpace {
  #rgbLookup;
  constructor(base, highVal, lookup) {
    super("Indexed", 1);
    this.highVal = highVal;
    const count = highVal + 1;
    const length = base.numComps * count;
    const palette = new Uint8Array(length);
    if (lookup instanceof BaseStream) {
      palette.set(lookup.getBytes(length));
    } else if (typeof lookup === "string") {
      for (let i = 0; i < length; ++i) {
        palette[i] = lookup.charCodeAt(i);
      }
    } else {
      throw new FormatError(`IndexedCS - unrecognized lookup table: ${lookup}`);
    }
    this.#rgbLookup = new Uint8ClampedArray(count * 3);
    base.getRgbBuffer(palette, 0, count, this.#rgbLookup, 0, 8, 0);
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    const rgbLookup = this.#rgbLookup;
    const pos = MathClamp(Math.round(src[srcOffset]), 0, this.highVal) * 3;
    dest[destOffset] = rgbLookup[pos];
    dest[destOffset + 1] = rgbLookup[pos + 1];
    dest[destOffset + 2] = rgbLookup[pos + 2];
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    const {
      highVal
    } = this;
    const rgbLookup = this.#rgbLookup;
    for (let i = 0; i < count; ++i) {
      const pos = MathClamp(Math.round(src[srcOffset++]), 0, highVal) * 3;
      dest[destOffset++] = rgbLookup[pos];
      dest[destOffset++] = rgbLookup[pos + 1];
      dest[destOffset++] = rgbLookup[pos + 2];
      destOffset += alpha01;
    }
  }
  isDefaultDecode(decode, bpc) {
    if (isDefaultDecodeHelper(decode, 2)) {
      return true;
    }
    if (!Number.isInteger(bpc) || bpc < 1) {
      warn("Bits per component is not correct");
      return true;
    }
    return decode[0] === 0 && decode[1] === (1 << bpc) - 1;
  }
}
class DeviceGrayCS extends ColorSpace {
  constructor() {
    super("DeviceGray", 1);
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    const c = src[srcOffset] * 255;
    dest[destOffset] = dest[destOffset + 1] = dest[destOffset + 2] = c;
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    const scale = 255 / ((1 << bits) - 1);
    let j = srcOffset,
      q = destOffset;
    for (let i = 0; i < count; ++i) {
      const c = scale * src[j++];
      dest[q++] = c;
      dest[q++] = c;
      dest[q++] = c;
      q += alpha01;
    }
  }
}
class DeviceRgbCS extends ColorSpace {
  constructor() {
    super("DeviceRGB", 3);
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    dest[destOffset] = src[srcOffset] * 255;
    dest[destOffset + 1] = src[srcOffset + 1] * 255;
    dest[destOffset + 2] = src[srcOffset + 2] * 255;
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    if (bits === 8 && alpha01 === 0) {
      dest.set(src.subarray(srcOffset, srcOffset + count * 3), destOffset);
      return;
    }
    const scale = 255 / ((1 << bits) - 1);
    let j = srcOffset,
      q = destOffset;
    for (let i = 0; i < count; ++i) {
      dest[q++] = scale * src[j++];
      dest[q++] = scale * src[j++];
      dest[q++] = scale * src[j++];
      q += alpha01;
    }
  }
  isPassthrough(bits) {
    return bits === 8;
  }
}
class DeviceRgbaCS extends ColorSpace {
  constructor() {
    super("DeviceRGBA", 4);
  }
  isPassthrough(bits) {
    return bits === 8;
  }
  fillRgb(dest, originalWidth, originalHeight, width, height, actualHeight, bpc, comps, alpha01) {
    if (originalHeight !== height || originalWidth !== width) {
      resizeRgbaImage(comps, dest, originalWidth, originalHeight, width, height, alpha01);
    } else {
      copyRgbaImage(comps, dest, alpha01);
    }
  }
}
class DeviceCmykCS extends ColorSpace {
  constructor() {
    super("DeviceCMYK", 4);
  }
  #toRgb(src, srcOffset, srcScale, dest, destOffset) {
    const c = src[srcOffset] * srcScale;
    const m = src[srcOffset + 1] * srcScale;
    const y = src[srcOffset + 2] * srcScale;
    const k = src[srcOffset + 3] * srcScale;
    dest[destOffset] = 255 + c * (-4.387332384609988 * c + 54.48615194189176 * m + 18.82290502165302 * y + 212.25662451639585 * k + -285.2331026137004) + m * (1.7149763477362134 * m - 5.6096736904047315 * y + -17.873870861415444 * k - 5.497006427196366) + y * (-2.5217340131683033 * y - 21.248923337353073 * k + 17.5119270841813) + k * (-21.86122147463605 * k - 189.48180835922747);
    dest[destOffset + 1] = 255 + c * (8.841041422036149 * c + 60.118027045597366 * m + 6.871425592049007 * y + 31.159100130055922 * k + -79.2970844816548) + m * (-15.310361306967817 * m + 17.575251261109482 * y + 131.35250912493976 * k - 190.9453302588951) + y * (4.444339102852739 * y + 9.8632861493405 * k - 24.86741582555878) + k * (-20.737325471181034 * k - 187.80453709719578);
    dest[destOffset + 2] = 255 + c * (0.8842522430003296 * c + 8.078677503112928 * m + 30.89978309703729 * y - 0.23883238689178934 * k + -14.183576799673286) + m * (10.49593273432072 * m + 63.02378494754052 * y + 50.606957656360734 * k - 112.23884253719248) + y * (0.03296041114873217 * y + 115.60384449646641 * k + -193.58209356861505) + k * (-22.33816807309886 * k - 180.12613974708367);
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    this.#toRgb(src, srcOffset, 1, dest, destOffset);
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    const scale = 1 / ((1 << bits) - 1);
    for (let i = 0; i < count; i++) {
      this.#toRgb(src, srcOffset, scale, dest, destOffset);
      srcOffset += 4;
      destOffset += 3 + alpha01;
    }
  }
}
class CalGrayCS extends ColorSpace {
  constructor(whitePoint, blackPoint, gamma) {
    super("CalGray", 1);
    if (!whitePoint) {
      throw new FormatError("WhitePoint missing - required for color space CalGray");
    }
    [this.XW, this.YW, this.ZW] = whitePoint;
    [this.XB, this.YB, this.ZB] = blackPoint || [0, 0, 0];
    this.G = gamma || 1;
    if (this.XW < 0 || this.ZW < 0 || this.YW !== 1) {
      throw new FormatError(`Invalid WhitePoint components for ${this.name}, no fallback available`);
    }
    if (this.XB < 0 || this.YB < 0 || this.ZB < 0) {
      info(`Invalid BlackPoint for ${this.name}, falling back to default.`);
      this.XB = this.YB = this.ZB = 0;
    }
    if (this.XB !== 0 || this.YB !== 0 || this.ZB !== 0) {
      warn(`${this.name}, BlackPoint: XB: ${this.XB}, YB: ${this.YB}, ` + `ZB: ${this.ZB}, only default values are supported.`);
    }
    if (this.G < 1) {
      info(`Invalid Gamma: ${this.G} for ${this.name}, falling back to default.`);
      this.G = 1;
    }
  }
  #toRgb(src, srcOffset, dest, destOffset, scale) {
    const A = src[srcOffset] * scale;
    const AG = A ** this.G;
    const L = this.YW * AG;
    const val = Math.max(295.8 * L ** 0.3333333333333333 - 40.8, 0);
    dest[destOffset] = val;
    dest[destOffset + 1] = val;
    dest[destOffset + 2] = val;
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    this.#toRgb(src, srcOffset, dest, destOffset, 1);
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    const scale = 1 / ((1 << bits) - 1);
    for (let i = 0; i < count; ++i) {
      this.#toRgb(src, srcOffset, dest, destOffset, scale);
      srcOffset += 1;
      destOffset += 3 + alpha01;
    }
  }
}
class CalRGBCS extends ColorSpace {
  static #BRADFORD_SCALE_MATRIX = new Float32Array([0.8951, 0.2664, -0.1614, -0.7502, 1.7135, 0.0367, 0.0389, -0.0685, 1.0296]);
  static #BRADFORD_SCALE_INVERSE_MATRIX = new Float32Array([0.9869929, -0.1470543, 0.1599627, 0.4323053, 0.5183603, 0.0492912, -0.0085287, 0.0400428, 0.9684867]);
  static #SRGB_D65_XYZ_TO_RGB_MATRIX = new Float32Array([3.2404542, -1.5371385, -0.4985314, -0.9692660, 1.8760108, 0.0415560, 0.0556434, -0.2040259, 1.0572252]);
  static #FLAT_WHITEPOINT_MATRIX = new Float32Array([1, 1, 1]);
  static #tempNormalizeMatrix = new Float32Array(3);
  static #tempConvertMatrix1 = new Float32Array(3);
  static #tempConvertMatrix2 = new Float32Array(3);
  static #DECODE_L_CONSTANT = ((8 + 16) / 116) ** 3 / 8.0;
  constructor(whitePoint, blackPoint, gamma, matrix) {
    super("CalRGB", 3);
    if (!whitePoint) {
      throw new FormatError("WhitePoint missing - required for color space CalRGB");
    }
    const [XW, YW, ZW] = this.whitePoint = whitePoint;
    const [XB, YB, ZB] = this.blackPoint = blackPoint || new Float32Array(3);
    [this.GR, this.GG, this.GB] = gamma || new Float32Array([1, 1, 1]);
    [this.MXA, this.MYA, this.MZA, this.MXB, this.MYB, this.MZB, this.MXC, this.MYC, this.MZC] = matrix || new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    if (XW < 0 || ZW < 0 || YW !== 1) {
      throw new FormatError(`Invalid WhitePoint components for ${this.name}, no fallback available`);
    }
    if (XB < 0 || YB < 0 || ZB < 0) {
      info(`Invalid BlackPoint for ${this.name} [${XB}, ${YB}, ${ZB}], ` + "falling back to default.");
      this.blackPoint = new Float32Array(3);
    }
    if (this.GR < 0 || this.GG < 0 || this.GB < 0) {
      info(`Invalid Gamma [${this.GR}, ${this.GG}, ${this.GB}] for ` + `${this.name}, falling back to default.`);
      this.GR = this.GG = this.GB = 1;
    }
  }
  #matrixProduct(a, b, result) {
    result[0] = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    result[1] = a[3] * b[0] + a[4] * b[1] + a[5] * b[2];
    result[2] = a[6] * b[0] + a[7] * b[1] + a[8] * b[2];
  }
  #toFlat(sourceWhitePoint, LMS, result) {
    result[0] = LMS[0] * 1 / sourceWhitePoint[0];
    result[1] = LMS[1] * 1 / sourceWhitePoint[1];
    result[2] = LMS[2] * 1 / sourceWhitePoint[2];
  }
  #toD65(sourceWhitePoint, LMS, result) {
    const D65X = 0.95047;
    const D65Y = 1;
    const D65Z = 1.08883;
    result[0] = LMS[0] * D65X / sourceWhitePoint[0];
    result[1] = LMS[1] * D65Y / sourceWhitePoint[1];
    result[2] = LMS[2] * D65Z / sourceWhitePoint[2];
  }
  #sRGBTransferFunction(color) {
    if (color <= 0.0031308) {
      return MathClamp(12.92 * color, 0, 1);
    }
    if (color >= 0.99554525) {
      return 1;
    }
    return MathClamp((1 + 0.055) * color ** (1 / 2.4) - 0.055, 0, 1);
  }
  #decodeL(L) {
    if (L < 0) {
      return -this.#decodeL(-L);
    }
    if (L > 8.0) {
      return ((L + 16) / 116) ** 3;
    }
    return L * CalRGBCS.#DECODE_L_CONSTANT;
  }
  #compensateBlackPoint(sourceBlackPoint, XYZ_Flat, result) {
    if (sourceBlackPoint[0] === 0 && sourceBlackPoint[1] === 0 && sourceBlackPoint[2] === 0) {
      result[0] = XYZ_Flat[0];
      result[1] = XYZ_Flat[1];
      result[2] = XYZ_Flat[2];
      return;
    }
    const zeroDecodeL = this.#decodeL(0);
    const X_DST = zeroDecodeL;
    const X_SRC = this.#decodeL(sourceBlackPoint[0]);
    const Y_DST = zeroDecodeL;
    const Y_SRC = this.#decodeL(sourceBlackPoint[1]);
    const Z_DST = zeroDecodeL;
    const Z_SRC = this.#decodeL(sourceBlackPoint[2]);
    const X_Scale = (1 - X_DST) / (1 - X_SRC);
    const X_Offset = 1 - X_Scale;
    const Y_Scale = (1 - Y_DST) / (1 - Y_SRC);
    const Y_Offset = 1 - Y_Scale;
    const Z_Scale = (1 - Z_DST) / (1 - Z_SRC);
    const Z_Offset = 1 - Z_Scale;
    result[0] = XYZ_Flat[0] * X_Scale + X_Offset;
    result[1] = XYZ_Flat[1] * Y_Scale + Y_Offset;
    result[2] = XYZ_Flat[2] * Z_Scale + Z_Offset;
  }
  #normalizeWhitePointToFlat(sourceWhitePoint, XYZ_In, result) {
    if (sourceWhitePoint[0] === 1 && sourceWhitePoint[2] === 1) {
      result[0] = XYZ_In[0];
      result[1] = XYZ_In[1];
      result[2] = XYZ_In[2];
      return;
    }
    const LMS = result;
    this.#matrixProduct(CalRGBCS.#BRADFORD_SCALE_MATRIX, XYZ_In, LMS);
    const LMS_Flat = CalRGBCS.#tempNormalizeMatrix;
    this.#toFlat(sourceWhitePoint, LMS, LMS_Flat);
    this.#matrixProduct(CalRGBCS.#BRADFORD_SCALE_INVERSE_MATRIX, LMS_Flat, result);
  }
  #normalizeWhitePointToD65(sourceWhitePoint, XYZ_In, result) {
    const LMS = result;
    this.#matrixProduct(CalRGBCS.#BRADFORD_SCALE_MATRIX, XYZ_In, LMS);
    const LMS_D65 = CalRGBCS.#tempNormalizeMatrix;
    this.#toD65(sourceWhitePoint, LMS, LMS_D65);
    this.#matrixProduct(CalRGBCS.#BRADFORD_SCALE_INVERSE_MATRIX, LMS_D65, result);
  }
  #toRgb(src, srcOffset, dest, destOffset, scale) {
    const A = MathClamp(src[srcOffset] * scale, 0, 1);
    const B = MathClamp(src[srcOffset + 1] * scale, 0, 1);
    const C = MathClamp(src[srcOffset + 2] * scale, 0, 1);
    const AGR = A === 1 ? 1 : A ** this.GR;
    const BGG = B === 1 ? 1 : B ** this.GG;
    const CGB = C === 1 ? 1 : C ** this.GB;
    const X = this.MXA * AGR + this.MXB * BGG + this.MXC * CGB;
    const Y = this.MYA * AGR + this.MYB * BGG + this.MYC * CGB;
    const Z = this.MZA * AGR + this.MZB * BGG + this.MZC * CGB;
    const XYZ = CalRGBCS.#tempConvertMatrix1;
    XYZ[0] = X;
    XYZ[1] = Y;
    XYZ[2] = Z;
    const XYZ_Flat = CalRGBCS.#tempConvertMatrix2;
    this.#normalizeWhitePointToFlat(this.whitePoint, XYZ, XYZ_Flat);
    const XYZ_Black = CalRGBCS.#tempConvertMatrix1;
    this.#compensateBlackPoint(this.blackPoint, XYZ_Flat, XYZ_Black);
    const XYZ_D65 = CalRGBCS.#tempConvertMatrix2;
    this.#normalizeWhitePointToD65(CalRGBCS.#FLAT_WHITEPOINT_MATRIX, XYZ_Black, XYZ_D65);
    const SRGB = CalRGBCS.#tempConvertMatrix1;
    this.#matrixProduct(CalRGBCS.#SRGB_D65_XYZ_TO_RGB_MATRIX, XYZ_D65, SRGB);
    dest[destOffset] = this.#sRGBTransferFunction(SRGB[0]) * 255;
    dest[destOffset + 1] = this.#sRGBTransferFunction(SRGB[1]) * 255;
    dest[destOffset + 2] = this.#sRGBTransferFunction(SRGB[2]) * 255;
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    this.#toRgb(src, srcOffset, dest, destOffset, 1);
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    const scale = 1 / ((1 << bits) - 1);
    for (let i = 0; i < count; ++i) {
      this.#toRgb(src, srcOffset, dest, destOffset, scale);
      srcOffset += 3;
      destOffset += 3 + alpha01;
    }
  }
}
class LabCS extends ColorSpace {
  constructor(whitePoint, blackPoint, range) {
    super("Lab", 3);
    if (!whitePoint) {
      throw new FormatError("WhitePoint missing - required for color space Lab");
    }
    [this.XW, this.YW, this.ZW] = whitePoint;
    [this.amin, this.amax, this.bmin, this.bmax] = range || [-100, 100, -100, 100];
    [this.XB, this.YB, this.ZB] = blackPoint || [0, 0, 0];
    if (this.XW < 0 || this.ZW < 0 || this.YW !== 1) {
      throw new FormatError("Invalid WhitePoint components, no fallback available");
    }
    if (this.XB < 0 || this.YB < 0 || this.ZB < 0) {
      info("Invalid BlackPoint, falling back to default");
      this.XB = this.YB = this.ZB = 0;
    }
    if (this.amin > this.amax || this.bmin > this.bmax) {
      info("Invalid Range, falling back to defaults");
      this.amin = -100;
      this.amax = 100;
      this.bmin = -100;
      this.bmax = 100;
    }
  }
  #fn_g(x) {
    return x >= 6 / 29 ? x ** 3 : 108 / 841 * (x - 4 / 29);
  }
  #decode(value, high1, low2, high2) {
    return low2 + value * (high2 - low2) / high1;
  }
  #toRgb(src, srcOffset, maxVal, dest, destOffset) {
    let Ls = src[srcOffset];
    let as = src[srcOffset + 1];
    let bs = src[srcOffset + 2];
    if (maxVal !== false) {
      Ls = this.#decode(Ls, maxVal, 0, 100);
      as = this.#decode(as, maxVal, this.amin, this.amax);
      bs = this.#decode(bs, maxVal, this.bmin, this.bmax);
    }
    if (as > this.amax) {
      as = this.amax;
    } else if (as < this.amin) {
      as = this.amin;
    }
    if (bs > this.bmax) {
      bs = this.bmax;
    } else if (bs < this.bmin) {
      bs = this.bmin;
    }
    const M = (Ls + 16) / 116;
    const L = M + as / 500;
    const N = M - bs / 200;
    const X = this.XW * this.#fn_g(L);
    const Y = this.YW * this.#fn_g(M);
    const Z = this.ZW * this.#fn_g(N);
    let r, g, b;
    if (this.ZW < 1) {
      r = X * 3.1339 + Y * -1.617 + Z * -0.4906;
      g = X * -0.9785 + Y * 1.916 + Z * 0.0333;
      b = X * 0.072 + Y * -0.229 + Z * 1.4057;
    } else {
      r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
      g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
      b = X * 0.0557 + Y * -0.204 + Z * 1.057;
    }
    dest[destOffset] = Math.sqrt(r) * 255;
    dest[destOffset + 1] = Math.sqrt(g) * 255;
    dest[destOffset + 2] = Math.sqrt(b) * 255;
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    this.#toRgb(src, srcOffset, false, dest, destOffset);
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    const maxVal = (1 << bits) - 1;
    for (let i = 0; i < count; i++) {
      this.#toRgb(src, srcOffset, maxVal, dest, destOffset);
      srcOffset += 3;
      destOffset += 3 + alpha01;
    }
  }
  isDefaultDecode(decode, bpc) {
    return true;
  }
  get usesZeroToOneRange() {
    return shadow(this, "usesZeroToOneRange", false);
  }
}

;// ./src/core/icc_colorspace.js




function fetchSync(url) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, false);
  xhr.responseType = "arraybuffer";
  xhr.send(null);
  return xhr.response;
}
class IccColorSpace extends ColorSpace {
  #transformer;
  #convertPixel;
  static #useWasm = true;
  static #wasmUrl = null;
  static #finalizer = null;
  constructor(iccProfile, name, numComps) {
    if (!IccColorSpace.isUsable) {
      throw new Error("No ICC color space support");
    }
    super(name, numComps);
    let inType;
    switch (numComps) {
      case 1:
        inType = DataType.Gray8;
        this.#convertPixel = (src, srcOffset) => qcms_convert_one(this.#transformer, src[srcOffset] * 255);
        break;
      case 3:
        inType = DataType.RGB8;
        this.#convertPixel = (src, srcOffset) => qcms_convert_three(this.#transformer, src[srcOffset] * 255, src[srcOffset + 1] * 255, src[srcOffset + 2] * 255);
        break;
      case 4:
        inType = DataType.CMYK;
        this.#convertPixel = (src, srcOffset) => qcms_convert_four(this.#transformer, src[srcOffset] * 255, src[srcOffset + 1] * 255, src[srcOffset + 2] * 255, src[srcOffset + 3] * 255);
        break;
      default:
        throw new Error(`Unsupported number of components: ${numComps}`);
    }
    this.#transformer = qcms_transformer_from_memory(iccProfile, inType, Intent.Perceptual);
    if (!this.#transformer) {
      throw new Error("Failed to create ICC color space");
    }
    IccColorSpace.#finalizer ||= new FinalizationRegistry(transformer => {
      qcms_drop_transformer(transformer);
    });
    IccColorSpace.#finalizer.register(this, this.#transformer);
  }
  getRgbHex(src, srcOffset) {
    const color = this.#convertPixel(src, srcOffset);
    return Util.makeHexColor(color >> 16, color >> 8 & 0xff, color & 0xff);
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    const color = this.#convertPixel(src, srcOffset);
    dest[destOffset] = color >> 16;
    dest[destOffset + 1] = color >> 8 & 0xff;
    dest[destOffset + 2] = color & 0xff;
  }
  getRgbItems(src, count, dest, destOffset, alpha01) {
    const {
      numComps
    } = this;
    const length = count * numComps;
    const scaled = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      scaled[i] = src[i] * 255;
    }
    QCMS._destBuffer = dest;
    QCMS._destOffset = destOffset;
    QCMS._keepAlpha = alpha01 === 1;
    qcms_convert_array(this.#transformer, scaled, alpha01 === 1);
    QCMS._destBuffer = null;
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    src = src.subarray(srcOffset, srcOffset + count * this.numComps);
    if (bits !== 8) {
      const scale = 255 / ((1 << bits) - 1);
      for (let i = 0, ii = src.length; i < ii; i++) {
        src[i] *= scale;
      }
    }
    QCMS._destBuffer = dest;
    QCMS._destOffset = destOffset;
    QCMS._keepAlpha = alpha01 === 1 && dest.buffer !== src.buffer;
    qcms_convert_array(this.#transformer, src, alpha01 === 1);
    QCMS._destBuffer = null;
  }
  static setOptions({
    useWasm,
    useWorkerFetch,
    wasmUrl
  }) {
    if (!useWorkerFetch) {
      this.#useWasm = false;
      return;
    }
    this.#useWasm = useWasm;
    this.#wasmUrl = wasmUrl;
  }
  static get isUsable() {
    let isUsable = false;
    if (this.#useWasm) {
      if (this.#wasmUrl) {
        try {
          this._module = initSync({
            module: fetchSync(`${this.#wasmUrl}qcms_bg.wasm`)
          });
          isUsable = !!this._module;
          QCMS._memory = this._module.memory;
        } catch (e) {
          warn(`ICCBased color space: "${e}".`);
        }
      } else {
        warn("No ICC color space support due to missing `wasmUrl` API option");
      }
    }
    return shadow(this, "isUsable", isUsable);
  }
}
class CmykICCBasedCS extends IccColorSpace {
  static #iccUrl;
  constructor() {
    const iccProfile = new Uint8Array(fetchSync(`${CmykICCBasedCS.#iccUrl}CGATS001Compat-v2-micro.icc`));
    super(iccProfile, "DeviceCMYK", 4);
  }
  static setOptions({
    iccUrl
  }) {
    this.#iccUrl = iccUrl;
  }
  static get isUsable() {
    let isUsable = false;
    if (IccColorSpace.isUsable) {
      if (this.#iccUrl) {
        isUsable = true;
      } else {
        warn("No CMYK ICC profile support due to missing `iccUrl` API option");
      }
    }
    return shadow(this, "isUsable", isUsable);
  }
}

;// ./src/core/stream.js


class Stream extends BaseStream {
  constructor(arrayBuffer, start, length, dict) {
    super();
    this.bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    this.start = start || 0;
    this.pos = this.start;
    this.end = start + length || this.bytes.length;
    this.dict = dict;
  }
  get length() {
    return this.end - this.start;
  }
  get isEmpty() {
    return this.length === 0;
  }
  getByte() {
    return this.pos >= this.end ? -1 : this.bytes[this.pos++];
  }
  getBytes(length) {
    const pos = this.pos;
    const endPos = !length ? this.end : Math.min(pos + length, this.end);
    this.pos = endPos;
    return this.bytes.subarray(pos, endPos);
  }
  getByteRange(begin, end) {
    if (begin < 0) {
      begin = 0;
    }
    if (end > this.end) {
      end = this.end;
    }
    return this.bytes.subarray(begin, end);
  }
  reset() {
    this.pos = this.start;
  }
  moveStart() {
    this.start = this.pos;
  }
  makeSubStream(start, length, dict = null) {
    return new Stream(this.bytes.buffer, start, length, dict);
  }
  clone() {
    return new Stream(this.bytes.buffer, this.start, this.length, this.dict?.clone());
  }
}
class StringStream extends Stream {
  constructor(str, dict = null) {
    super(stringToBytes(str), NaN, NaN, dict);
  }
}
class NullStream extends Stream {
  constructor() {
    super(new Uint8Array(0));
  }
}

;// ./src/core/chunked_stream.js




class ChunkedStream extends Stream {
  progressiveDataLength = 0;
  _lastSuccessfulEnsureByteChunk = -1;
  _loadedChunks = new Set();
  constructor(length, chunkSize, manager) {
    super(new Uint8Array(length), 0, length, null);
    this.chunkSize = chunkSize;
    this.numChunks = Math.ceil(length / chunkSize);
    this.manager = manager;
  }
  getMissingChunks() {
    const chunks = [];
    for (let chunk = 0, n = this.numChunks; chunk < n; ++chunk) {
      if (!this._loadedChunks.has(chunk)) {
        chunks.push(chunk);
      }
    }
    return chunks;
  }
  get numChunksLoaded() {
    return this._loadedChunks.size;
  }
  get isDataLoaded() {
    return this.numChunksLoaded === this.numChunks;
  }
  onReceiveData(begin, chunk) {
    const chunkSize = this.chunkSize;
    if (begin % chunkSize !== 0) {
      throw new Error(`Bad begin offset: ${begin}`);
    }
    const end = begin + chunk.byteLength;
    if (end % chunkSize !== 0 && end !== this.bytes.length) {
      throw new Error(`Bad end offset: ${end}`);
    }
    this.bytes.set(new Uint8Array(chunk), begin);
    const beginChunk = Math.floor(begin / chunkSize);
    const endChunk = Math.floor((end - 1) / chunkSize) + 1;
    for (let curChunk = beginChunk; curChunk < endChunk; ++curChunk) {
      this._loadedChunks.add(curChunk);
    }
  }
  onReceiveProgressiveData(data) {
    let position = this.progressiveDataLength;
    const beginChunk = Math.floor(position / this.chunkSize);
    this.bytes.set(new Uint8Array(data), position);
    position += data.byteLength;
    this.progressiveDataLength = position;
    const endChunk = position >= this.end ? this.numChunks : Math.floor(position / this.chunkSize);
    for (let curChunk = beginChunk; curChunk < endChunk; ++curChunk) {
      this._loadedChunks.add(curChunk);
    }
  }
  ensureByte(pos) {
    if (pos < this.progressiveDataLength) {
      return;
    }
    const chunk = Math.floor(pos / this.chunkSize);
    if (chunk > this.numChunks) {
      return;
    }
    if (chunk === this._lastSuccessfulEnsureByteChunk) {
      return;
    }
    if (!this._loadedChunks.has(chunk)) {
      throw new MissingDataException(pos, pos + 1);
    }
    this._lastSuccessfulEnsureByteChunk = chunk;
  }
  ensureRange(begin, end) {
    if (begin >= end) {
      return;
    }
    if (end <= this.progressiveDataLength) {
      return;
    }
    const beginChunk = Math.floor(begin / this.chunkSize);
    if (beginChunk > this.numChunks) {
      return;
    }
    const endChunk = Math.min(Math.floor((end - 1) / this.chunkSize) + 1, this.numChunks);
    for (let chunk = beginChunk; chunk < endChunk; ++chunk) {
      if (!this._loadedChunks.has(chunk)) {
        throw new MissingDataException(begin, end);
      }
    }
  }
  nextEmptyChunk(beginChunk) {
    const numChunks = this.numChunks;
    for (let i = 0; i < numChunks; ++i) {
      const chunk = (beginChunk + i) % numChunks;
      if (!this._loadedChunks.has(chunk)) {
        return chunk;
      }
    }
    return null;
  }
  hasChunk(chunk) {
    return this._loadedChunks.has(chunk);
  }
  getByte() {
    const pos = this.pos;
    if (pos >= this.end) {
      return -1;
    }
    if (pos >= this.progressiveDataLength) {
      this.ensureByte(pos);
    }
    return this.bytes[this.pos++];
  }
  getBytes(length) {
    const pos = this.pos;
    const endPos = !length ? this.end : Math.min(pos + length, this.end);
    if (endPos > this.progressiveDataLength) {
      this.ensureRange(pos, endPos);
    }
    this.pos = endPos;
    return this.bytes.subarray(pos, endPos);
  }
  getByteRange(begin, end) {
    if (begin < 0) {
      begin = 0;
    }
    if (end > this.end) {
      end = this.end;
    }
    if (end > this.progressiveDataLength) {
      this.ensureRange(begin, end);
    }
    return this.bytes.subarray(begin, end);
  }
  makeSubStream(start, length, dict = null) {
    if (length) {
      if (start + length > this.progressiveDataLength) {
        this.ensureRange(start, start + length);
      }
    } else if (start >= this.progressiveDataLength) {
      this.ensureByte(start);
    }
    function ChunkedStreamSubstream() {}
    ChunkedStreamSubstream.prototype = Object.create(this);
    ChunkedStreamSubstream.prototype.getMissingChunks = function () {
      const chunkSize = this.chunkSize;
      const beginChunk = Math.floor(this.start / chunkSize);
      const endChunk = Math.floor((this.end - 1) / chunkSize) + 1;
      const missingChunks = [];
      for (let chunk = beginChunk; chunk < endChunk; ++chunk) {
        if (!this._loadedChunks.has(chunk)) {
          missingChunks.push(chunk);
        }
      }
      return missingChunks;
    };
    Object.defineProperty(ChunkedStreamSubstream.prototype, "isDataLoaded", {
      get() {
        return this.numChunksLoaded === this.numChunks || this.getMissingChunks().length === 0;
      },
      configurable: true
    });
    const subStream = new ChunkedStreamSubstream();
    subStream.pos = subStream.start = start;
    subStream.end = start + length || this.end;
    subStream.dict = dict;
    return subStream;
  }
  getBaseStreams() {
    return [this];
  }
}
class ChunkedStreamManager {
  #aborted = false;
  currRequestId = 0;
  _chunksNeededByRequest = new Map();
  #loadedStreamCapability = Promise.withResolvers();
  _promisesByRequest = new Map();
  _requestsByChunk = new Map();
  constructor(pdfStream, args) {
    this.length = args.length;
    this.chunkSize = args.rangeChunkSize;
    this.stream = new ChunkedStream(this.length, this.chunkSize, this);
    this.pdfStream = pdfStream;
    this.disableAutoFetch = args.disableAutoFetch;
    this.msgHandler = args.msgHandler;
  }
  async sendRequest(begin, end) {
    const rangeReader = this.pdfStream.getRangeReader(begin, end);
    let chunks = [];
    while (true) {
      const {
        value,
        done
      } = await rangeReader.read();
      if (this.#aborted) {
        chunks = null;
        return;
      }
      if (done) {
        break;
      }
      chunks.push(value);
    }
    if (chunks.length === 0 && this.disableAutoFetch) {
      return;
    }
    const data = arrayBuffersToBytes(chunks);
    chunks = null;
    this.onReceiveData({
      chunk: data.buffer,
      begin
    });
  }
  requestAllChunks(noFetch = false) {
    if (!noFetch) {
      const missingChunks = this.stream.getMissingChunks();
      this._requestChunks(missingChunks);
    }
    return this.#loadedStreamCapability.promise;
  }
  _requestChunks(chunks) {
    const requestId = this.currRequestId++;
    const chunksNeeded = new Set();
    this._chunksNeededByRequest.set(requestId, chunksNeeded);
    for (const chunk of chunks) {
      if (!this.stream.hasChunk(chunk)) {
        chunksNeeded.add(chunk);
      }
    }
    if (chunksNeeded.size === 0) {
      return Promise.resolve();
    }
    const capability = Promise.withResolvers();
    this._promisesByRequest.set(requestId, capability);
    const chunksToRequest = [];
    for (const chunk of chunksNeeded) {
      const requestIds = this._requestsByChunk.getOrInsertComputed(chunk, () => {
        chunksToRequest.push(chunk);
        return [];
      });
      requestIds.push(requestId);
    }
    if (chunksToRequest.length > 0) {
      const groupedChunksToRequest = this.groupChunks(chunksToRequest);
      for (const groupedChunk of groupedChunksToRequest) {
        const begin = groupedChunk.beginChunk * this.chunkSize;
        const end = Math.min(groupedChunk.endChunk * this.chunkSize, this.length);
        this.sendRequest(begin, end).catch(capability.reject);
      }
    }
    return capability.promise.catch(reason => {
      if (this.#aborted) {
        return;
      }
      throw reason;
    });
  }
  getStream() {
    return this.stream;
  }
  requestRange(begin, end) {
    end = Math.min(end, this.length);
    const beginChunk = this.getBeginChunk(begin);
    const endChunk = this.getEndChunk(end);
    const chunks = [];
    for (let chunk = beginChunk; chunk < endChunk; ++chunk) {
      chunks.push(chunk);
    }
    return this._requestChunks(chunks);
  }
  requestRanges(ranges = []) {
    const chunksToRequest = [];
    for (const range of ranges) {
      const beginChunk = this.getBeginChunk(range.begin);
      const endChunk = this.getEndChunk(range.end);
      for (let chunk = beginChunk; chunk < endChunk; ++chunk) {
        if (!chunksToRequest.includes(chunk)) {
          chunksToRequest.push(chunk);
        }
      }
    }
    chunksToRequest.sort((a, b) => a - b);
    return this._requestChunks(chunksToRequest);
  }
  groupChunks(chunks) {
    const groupedChunks = [];
    let beginChunk = -1;
    let prevChunk = -1;
    for (let i = 0, ii = chunks.length; i < ii; ++i) {
      const chunk = chunks[i];
      if (beginChunk < 0) {
        beginChunk = chunk;
      }
      if (prevChunk >= 0 && prevChunk + 1 !== chunk) {
        groupedChunks.push({
          beginChunk,
          endChunk: prevChunk + 1
        });
        beginChunk = chunk;
      }
      if (i + 1 === chunks.length) {
        groupedChunks.push({
          beginChunk,
          endChunk: chunk + 1
        });
      }
      prevChunk = chunk;
    }
    return groupedChunks;
  }
  onReceiveData(args) {
    const {
      chunkSize,
      length,
      stream
    } = this;
    const chunk = args.chunk;
    const isProgressive = args.begin === undefined;
    const begin = isProgressive ? stream.progressiveDataLength : args.begin;
    const end = begin + chunk.byteLength;
    const beginChunk = Math.floor(begin / chunkSize);
    const endChunk = end < length ? Math.floor(end / chunkSize) : Math.ceil(end / chunkSize);
    if (isProgressive) {
      stream.onReceiveProgressiveData(chunk);
    } else {
      stream.onReceiveData(begin, chunk);
    }
    if (stream.isDataLoaded) {
      this.#loadedStreamCapability.resolve(stream);
    }
    const loadedRequests = [];
    for (let curChunk = beginChunk; curChunk < endChunk; ++curChunk) {
      const requestIds = this._requestsByChunk.get(curChunk);
      if (!requestIds) {
        continue;
      }
      this._requestsByChunk.delete(curChunk);
      for (const requestId of requestIds) {
        const chunksNeeded = this._chunksNeededByRequest.get(requestId);
        if (chunksNeeded.has(curChunk)) {
          chunksNeeded.delete(curChunk);
        }
        if (chunksNeeded.size > 0) {
          continue;
        }
        loadedRequests.push(requestId);
      }
    }
    if (!this.disableAutoFetch && this._requestsByChunk.size === 0) {
      let nextEmptyChunk;
      if (stream.numChunksLoaded === 1) {
        const lastChunk = stream.numChunks - 1;
        if (!stream.hasChunk(lastChunk)) {
          nextEmptyChunk = lastChunk;
        }
      } else {
        nextEmptyChunk = stream.nextEmptyChunk(endChunk);
      }
      if (Number.isInteger(nextEmptyChunk)) {
        this._requestChunks([nextEmptyChunk]);
      }
    }
    for (const requestId of loadedRequests) {
      const capability = this._promisesByRequest.get(requestId);
      this._promisesByRequest.delete(requestId);
      capability.resolve();
    }
    this.msgHandler.send("DocProgress", {
      loaded: MathClamp(stream.numChunksLoaded * chunkSize, stream.progressiveDataLength, length),
      total: length
    });
  }
  getBeginChunk(begin) {
    return Math.floor(begin / this.chunkSize);
  }
  getEndChunk(end) {
    return Math.floor((end - 1) / this.chunkSize) + 1;
  }
  abort(reason) {
    this.#aborted = true;
    this.pdfStream?.cancelAllRequests(reason);
    for (const capability of this._promisesByRequest.values()) {
      capability.reject(reason);
    }
    this.#loadedStreamCapability.reject(reason);
  }
}

;// ./src/shared/image_utils.js

function convertToRGBA(params) {
  switch (params.kind) {
    case ImageKind.GRAYSCALE_1BPP:
      return convertBlackAndWhiteToRGBA(params);
    case ImageKind.RGB_24BPP:
      return convertRGBToRGBA(params);
  }
  return null;
}
function convertBlackAndWhiteToRGBA({
  src,
  srcPos = 0,
  dest,
  width,
  height,
  nonBlackColor = 0xffffffff,
  inverseDecode = false
}) {
  const black = FeatureTest.isLittleEndian ? 0xff000000 : 0x000000ff;
  const [zeroMapping, oneMapping] = inverseDecode ? [nonBlackColor, black] : [black, nonBlackColor];
  const widthInSource = width >> 3;
  const widthRemainder = width & 7;
  const xorMask = zeroMapping ^ oneMapping;
  const srcLength = src.length;
  dest = new Uint32Array(dest.buffer);
  let destPos = 0;
  for (let i = 0; i < height; ++i) {
    for (const max = srcPos + widthInSource; srcPos < max; ++srcPos, destPos += 8) {
      const elem = src[srcPos];
      dest[destPos] = zeroMapping ^ -(elem >> 7 & 1) & xorMask;
      dest[destPos + 1] = zeroMapping ^ -(elem >> 6 & 1) & xorMask;
      dest[destPos + 2] = zeroMapping ^ -(elem >> 5 & 1) & xorMask;
      dest[destPos + 3] = zeroMapping ^ -(elem >> 4 & 1) & xorMask;
      dest[destPos + 4] = zeroMapping ^ -(elem >> 3 & 1) & xorMask;
      dest[destPos + 5] = zeroMapping ^ -(elem >> 2 & 1) & xorMask;
      dest[destPos + 6] = zeroMapping ^ -(elem >> 1 & 1) & xorMask;
      dest[destPos + 7] = zeroMapping ^ -(elem & 1) & xorMask;
    }
    if (widthRemainder === 0) {
      continue;
    }
    const elem = srcPos < srcLength ? src[srcPos++] : 255;
    for (let j = 0; j < widthRemainder; ++j, ++destPos) {
      dest[destPos] = zeroMapping ^ -(elem >> 7 - j & 1) & xorMask;
    }
  }
  return {
    srcPos,
    destPos
  };
}
function convertRGBToRGBA({
  src,
  srcPos = 0,
  dest,
  destPos = 0,
  width,
  height
}) {
  let i = 0;
  const len = width * height * 3;
  const len32 = len >> 2;
  const src32 = new Uint32Array(src.buffer, srcPos, len32);
  const alphaMask = FeatureTest.isLittleEndian ? 0xff000000 : 0xff;
  if (FeatureTest.isLittleEndian) {
    for (; i < len32 - 2; i += 3, destPos += 4) {
      const s1 = src32[i],
        s2 = src32[i + 1],
        s3 = src32[i + 2];
      dest[destPos] = s1 | alphaMask;
      dest[destPos + 1] = s1 >>> 24 | s2 << 8 | alphaMask;
      dest[destPos + 2] = s2 >>> 16 | s3 << 16 | alphaMask;
      dest[destPos + 3] = s3 >>> 8 | alphaMask;
    }
    for (let j = i * 4, jj = srcPos + len; j < jj; j += 3) {
      dest[destPos++] = src[j] | src[j + 1] << 8 | src[j + 2] << 16 | alphaMask;
    }
  } else {
    for (; i < len32 - 2; i += 3, destPos += 4) {
      const s1 = src32[i],
        s2 = src32[i + 1],
        s3 = src32[i + 2];
      dest[destPos] = s1 | alphaMask;
      dest[destPos + 1] = s1 << 24 | s2 >>> 8 | alphaMask;
      dest[destPos + 2] = s2 << 16 | s3 >>> 16 | alphaMask;
      dest[destPos + 3] = s3 << 8 | alphaMask;
    }
    for (let j = i * 4, jj = srcPos + len; j < jj; j += 3) {
      dest[destPos++] = src[j] << 24 | src[j + 1] << 16 | src[j + 2] << 8 | alphaMask;
    }
  }
  return {
    srcPos: srcPos + len,
    destPos
  };
}
function grayToRGBA(src, dest) {
  if (FeatureTest.isLittleEndian) {
    for (let i = 0, ii = src.length; i < ii; i++) {
      dest[i] = src[i] * 0x10101 | 0xff000000;
    }
  } else {
    for (let i = 0, ii = src.length; i < ii; i++) {
      dest[i] = src[i] * 0x1010100 | 0x000000ff;
    }
  }
}

;// ./src/core/image_resizer.js



const MIN_IMAGE_DIM = 2048;
const MAX_IMAGE_DIM = 32768;
const MAX_ERROR = 128;
class ImageResizer {
  static #goodSquareLength = MIN_IMAGE_DIM;
  static #isImageDecoderSupported = FeatureTest.isImageDecoderSupported;
  constructor(imgData, isMask) {
    this._imgData = imgData;
    this._isMask = isMask;
  }
  static get canUseImageDecoder() {
    return shadow(this, "canUseImageDecoder", this.#isImageDecoderSupported ? ImageDecoder.isTypeSupported("image/bmp") : Promise.resolve(false));
  }
  static needsToBeResized(width, height) {
    if (width <= this.#goodSquareLength && height <= this.#goodSquareLength) {
      return false;
    }
    const {
      MAX_DIM
    } = this;
    if (width > MAX_DIM || height > MAX_DIM) {
      return true;
    }
    const area = width * height;
    if (this._hasMaxArea) {
      return area > this.MAX_AREA;
    }
    if (area < this.#goodSquareLength ** 2) {
      return false;
    }
    if (this._areGoodDims(width, height)) {
      this.#goodSquareLength = Math.max(this.#goodSquareLength, Math.floor(Math.sqrt(width * height)));
      return false;
    }
    this.#goodSquareLength = this._guessMax(this.#goodSquareLength, MAX_DIM, MAX_ERROR, 0);
    const maxArea = this.MAX_AREA = this.#goodSquareLength ** 2;
    return area > maxArea;
  }
  static getReducePower(width, height, maxArea = Infinity) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
      return 0;
    }
    const area = width * height;
    if (!this.needsToBeResized(width, height)) {
      if (area > maxArea) {
        return Math.ceil(Math.log2(area / maxArea));
      }
      return 0;
    }
    const {
      MAX_DIM,
      MAX_AREA
    } = this;
    const minFactor = Math.max(width / MAX_DIM, height / MAX_DIM, Math.sqrt(area / Math.min(maxArea, MAX_AREA)));
    return Math.max(0, Math.ceil(Math.log2(minFactor)));
  }
  static getReducePowerForJPX(width, height, componentsCount) {
    return this.getReducePower(width, height, 2 ** 30 / (componentsCount * 4));
  }
  static get MAX_DIM() {
    return shadow(this, "MAX_DIM", this._guessMax(MIN_IMAGE_DIM, MAX_IMAGE_DIM, 0, 1));
  }
  static get MAX_AREA() {
    this._hasMaxArea = true;
    return shadow(this, "MAX_AREA", this._guessMax(this.#goodSquareLength, this.MAX_DIM, MAX_ERROR, 0) ** 2);
  }
  static set MAX_AREA(area) {
    if (area >= 0) {
      this._hasMaxArea = true;
      shadow(this, "MAX_AREA", area);
    }
  }
  static setOptions({
    canvasMaxAreaInBytes = -1,
    isImageDecoderSupported = false
  }) {
    if (!this._hasMaxArea) {
      this.MAX_AREA = canvasMaxAreaInBytes >> 2;
    }
    this.#isImageDecoderSupported = isImageDecoderSupported;
  }
  static _areGoodDims(width, height) {
    try {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.fillRect(0, 0, 1, 1);
      const opacity = ctx.getImageData(0, 0, 1, 1).data[3];
      canvas.width = canvas.height = 1;
      return opacity !== 0;
    } catch {
      return false;
    }
  }
  static _guessMax(start, end, tolerance, defaultHeight) {
    while (start + tolerance + 1 < end) {
      const middle = Math.floor((start + end) / 2);
      const height = defaultHeight || middle;
      if (this._areGoodDims(middle, height)) {
        start = middle;
      } else {
        end = middle;
      }
    }
    return start;
  }
  static async createImage(imgData, isMask = false) {
    return new ImageResizer(imgData, isMask)._createImage();
  }
  async _createImage() {
    const {
      _imgData: imgData
    } = this;
    const {
      width,
      height
    } = imgData;
    if (width * height * 4 > MAX_INT_32) {
      const result = this.#rescaleImageData();
      if (result) {
        return result;
      }
    }
    const data = this._encodeBMP();
    let decoder, imagePromise;
    if (await ImageResizer.canUseImageDecoder) {
      decoder = new ImageDecoder({
        data,
        type: "image/bmp",
        preferAnimation: false,
        transfer: [data.buffer]
      });
      imagePromise = decoder.decode().catch(reason => {
        warn(`BMP image decoding failed: ${reason}`);
        return createImageBitmap(new Blob([this._encodeBMP().buffer], {
          type: "image/bmp"
        }));
      }).finally(() => {
        decoder.close();
      });
    } else {
      imagePromise = createImageBitmap(new Blob([data.buffer], {
        type: "image/bmp"
      }));
    }
    const {
      MAX_AREA,
      MAX_DIM
    } = ImageResizer;
    const minFactor = Math.max(width / MAX_DIM, height / MAX_DIM, Math.sqrt(width * height / MAX_AREA));
    const firstFactor = Math.max(minFactor, 2);
    const factor = Math.round(10 * (minFactor + 1.25)) / 10 / firstFactor;
    const N = Math.floor(Math.log2(factor));
    const steps = new Array(N + 2).fill(2);
    steps[0] = firstFactor;
    steps.splice(-1, 1, factor / (1 << N));
    let newWidth = width;
    let newHeight = height;
    const result = await imagePromise;
    let bitmap = result.image || result;
    for (const step of steps) {
      const prevWidth = newWidth;
      const prevHeight = newHeight;
      newWidth = Math.floor(newWidth / step);
      newHeight = Math.floor(newHeight / step);
      const canvas = new OffscreenCanvas(newWidth, newHeight);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0, prevWidth, prevHeight, 0, 0, newWidth, newHeight);
      bitmap.close();
      bitmap = canvas.transferToImageBitmap();
    }
    imgData.data = null;
    imgData.bitmap = bitmap;
    imgData.width = newWidth;
    imgData.height = newHeight;
    return imgData;
  }
  #rescaleImageData() {
    const {
      _imgData: imgData
    } = this;
    const {
      data,
      width,
      height,
      kind
    } = imgData;
    const rgbaSize = width * height * 4;
    const K = Math.ceil(Math.log2(rgbaSize / MAX_INT_32));
    const newWidth = width >> K;
    const newHeight = height >> K;
    let rgbaData;
    let maxHeight = height;
    try {
      rgbaData = new Uint8Array(rgbaSize);
    } catch {
      let n = Math.floor(Math.log2(rgbaSize + 1));
      while (true) {
        try {
          rgbaData = new Uint8Array(2 ** n - 1);
          break;
        } catch {
          n -= 1;
        }
      }
      maxHeight = Math.floor((2 ** n - 1) / (width * 4));
      const newSize = width * maxHeight * 4;
      if (newSize < rgbaData.length) {
        rgbaData = new Uint8Array(newSize);
      }
    }
    const src32 = new Uint32Array(rgbaData.buffer);
    const dest32 = new Uint32Array(newWidth * newHeight);
    let srcPos = 0;
    let newIndex = 0;
    const step = Math.ceil(height / maxHeight);
    const remainder = height % maxHeight === 0 ? height : height % maxHeight;
    for (let k = 0; k < step; k++) {
      const h = k < step - 1 ? maxHeight : remainder;
      ({
        srcPos
      } = convertToRGBA({
        kind,
        src: data,
        dest: src32,
        width,
        height: h,
        inverseDecode: this._isMask,
        srcPos
      }));
      for (let i = 0, ii = h >> K; i < ii; i++) {
        const buf = src32.subarray((i << K) * width);
        for (let j = 0; j < newWidth; j++) {
          dest32[newIndex++] = buf[j << K];
        }
      }
    }
    if (ImageResizer.needsToBeResized(newWidth, newHeight)) {
      imgData.data = dest32;
      imgData.width = newWidth;
      imgData.height = newHeight;
      imgData.kind = ImageKind.RGBA_32BPP;
      return null;
    }
    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true
    });
    ctx.putImageData(new ImageData(new Uint8ClampedArray(dest32.buffer), newWidth, newHeight), 0, 0);
    imgData.data = null;
    imgData.bitmap = canvas.transferToImageBitmap();
    imgData.width = newWidth;
    imgData.height = newHeight;
    return imgData;
  }
  _encodeBMP() {
    const {
      width,
      height,
      kind
    } = this._imgData;
    let data = this._imgData.data;
    let bitPerPixel;
    let colorTable = new Uint8Array(0);
    let maskTable = colorTable;
    let compression = 0;
    switch (kind) {
      case ImageKind.GRAYSCALE_1BPP:
        {
          bitPerPixel = 1;
          colorTable = new Uint8Array(this._isMask ? [255, 255, 255, 255, 0, 0, 0, 0] : [0, 0, 0, 0, 255, 255, 255, 255]);
          const rowLen = width + 7 >> 3;
          const rowSize = rowLen + 3 & -4;
          if (rowLen !== rowSize) {
            const newData = new Uint8Array(rowSize * height);
            let k = 0;
            for (let i = 0, ii = height * rowLen; i < ii; i += rowLen, k += rowSize) {
              newData.set(data.subarray(i, i + rowLen), k);
            }
            data = newData;
          }
          break;
        }
      case ImageKind.RGB_24BPP:
        {
          bitPerPixel = 24;
          if (width & 3) {
            const rowLen = 3 * width;
            const rowSize = rowLen + 3 & -4;
            const extraLen = rowSize - rowLen;
            const newData = new Uint8Array(rowSize * height);
            let k = 0;
            for (let i = 0, ii = height * rowLen; i < ii; i += rowLen) {
              const row = data.subarray(i, i + rowLen);
              for (let j = 0; j < rowLen; j += 3) {
                newData[k++] = row[j + 2];
                newData[k++] = row[j + 1];
                newData[k++] = row[j];
              }
              k += extraLen;
            }
            data = newData;
          } else {
            for (let i = 0, ii = data.length; i < ii; i += 3) {
              const tmp = data[i];
              data[i] = data[i + 2];
              data[i + 2] = tmp;
            }
          }
          break;
        }
      case ImageKind.RGBA_32BPP:
        bitPerPixel = 32;
        compression = 3;
        maskTable = new Uint8Array(4 + 4 + 4 + 4 + 52);
        const view = new DataView(maskTable.buffer);
        if (FeatureTest.isLittleEndian) {
          view.setUint32(0, 0x000000ff, true);
          view.setUint32(4, 0x0000ff00, true);
          view.setUint32(8, 0x00ff0000, true);
          view.setUint32(12, 0xff000000, true);
        } else {
          view.setUint32(0, 0xff000000, true);
          view.setUint32(4, 0x00ff0000, true);
          view.setUint32(8, 0x0000ff00, true);
          view.setUint32(12, 0x000000ff, true);
        }
        break;
      default:
        throw new Error("invalid format");
    }
    let i = 0;
    const headerLength = 40 + maskTable.length;
    const fileLength = 14 + headerLength + colorTable.length + data.length;
    const bmpData = new Uint8Array(fileLength);
    const view = new DataView(bmpData.buffer);
    view.setUint16(i, 0x4d42, true);
    i += 2;
    view.setUint32(i, fileLength, true);
    i += 4;
    view.setUint32(i, 0, true);
    i += 4;
    view.setUint32(i, 14 + headerLength + colorTable.length, true);
    i += 4;
    view.setUint32(i, headerLength, true);
    i += 4;
    view.setInt32(i, width, true);
    i += 4;
    view.setInt32(i, -height, true);
    i += 4;
    view.setUint16(i, 1, true);
    i += 2;
    view.setUint16(i, bitPerPixel, true);
    i += 2;
    view.setUint32(i, compression, true);
    i += 4;
    view.setUint32(i, 0, true);
    i += 4;
    view.setInt32(i, 0, true);
    i += 4;
    view.setInt32(i, 0, true);
    i += 4;
    view.setUint32(i, colorTable.length / 4, true);
    i += 4;
    view.setUint32(i, 0, true);
    i += 4;
    bmpData.set(maskTable, i);
    i += maskTable.length;
    bmpData.set(colorTable, i);
    i += colorTable.length;
    bmpData.set(data, i);
    return bmpData;
  }
}

;// ./src/core/decode_stream.js



const emptyBuffer = new Uint8Array(0);
class DecodeStream extends BaseStream {
  buffer = emptyBuffer;
  bufferLength = 0;
  eof = false;
  minBufferLength = 512;
  pos = 0;
  constructor(maybeMinBufferLength) {
    super();
    this._rawMinBufferLength = maybeMinBufferLength || 0;
    if (maybeMinBufferLength) {
      while (this.minBufferLength < maybeMinBufferLength) {
        this.minBufferLength *= 2;
      }
    }
  }
  readBlock() {
    unreachable("Abstract method `readBlock` called");
  }
  get isEmpty() {
    while (!this.eof && this.bufferLength === 0) {
      this.readBlock();
    }
    return this.bufferLength === 0;
  }
  ensureBuffer(requested) {
    const buffer = this.buffer;
    if (requested <= buffer.byteLength) {
      return buffer;
    }
    let size = this.minBufferLength;
    while (size < requested) {
      size *= 2;
    }
    const buffer2 = new Uint8Array(size);
    buffer2.set(buffer);
    return this.buffer = buffer2;
  }
  getByte() {
    const pos = this.pos;
    while (this.bufferLength <= pos) {
      if (this.eof) {
        return -1;
      }
      this.readBlock();
    }
    return this.buffer[this.pos++];
  }
  getBytes(length, decoderOptions = null) {
    const pos = this.pos;
    let end;
    if (length) {
      this.ensureBuffer(pos + length);
      end = pos + length;
      while (!this.eof && this.bufferLength < end) {
        this.readBlock(decoderOptions);
      }
      const bufEnd = this.bufferLength;
      if (end > bufEnd) {
        end = bufEnd;
      }
    } else {
      while (!this.eof) {
        this.readBlock(decoderOptions);
      }
      end = this.bufferLength;
    }
    this.pos = end;
    return this.buffer.subarray(pos, end);
  }
  async getImageData(length, decoderOptions) {
    if (!this.canAsyncDecodeImageFromBuffer) {
      return this.isAsyncDecoder ? this.decodeImage(null, length, decoderOptions) : this.getBytes(length, decoderOptions);
    }
    const data = await this.stream.asyncGetBytes();
    return this.decodeImage(data, length, decoderOptions);
  }
  async asyncGetBytesFromDecompressionStream(name) {
    this.stream.reset();
    const bytes = this.stream.isAsync ? await this.stream.asyncGetBytes() : this.stream.getBytes();
    try {
      const {
        readable,
        writable
      } = new DecompressionStream(name);
      const writer = writable.getWriter();
      await writer.ready;
      writer.write(bytes).then(async () => {
        await writer.ready;
        await writer.close();
      }).catch(() => {});
      const chunks = [];
      let totalLength = 0;
      for await (const chunk of readable) {
        chunks.push(chunk);
        totalLength += chunk.byteLength;
      }
      const data = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return {
        decompressed: data,
        compressed: bytes
      };
    } catch {
      return {
        decompressed: null,
        compressed: bytes
      };
    }
  }
  reset() {
    this.pos = 0;
  }
  makeSubStream(start, length, dict = null) {
    if (length === undefined) {
      while (!this.eof) {
        this.readBlock();
      }
    } else {
      const end = start + length;
      while (this.bufferLength <= end && !this.eof) {
        this.readBlock();
      }
    }
    return new Stream(this.buffer, start, length, dict);
  }
  clone() {
    while (!this.eof) {
      this.readBlock();
    }
    return new Stream(this.buffer, 0, this.bufferLength, this.dict?.clone());
  }
  getBaseStreams() {
    return this.stream ? this.stream.getBaseStreams() : null;
  }
}
class StreamsSequenceStream extends DecodeStream {
  constructor(streams, onError = null) {
    streams = streams.filter(s => s instanceof BaseStream && !s.isImageStream);
    let maybeLength = 0;
    for (const stream of streams) {
      maybeLength += stream instanceof DecodeStream ? stream._rawMinBufferLength : stream.length;
    }
    super(maybeLength);
    this.streams = streams;
    this._onError = onError;
  }
  readBlock() {
    const streams = this.streams;
    if (streams.length === 0) {
      this.eof = true;
      return;
    }
    const stream = streams.shift();
    let chunk;
    try {
      chunk = stream.getBytes();
    } catch (reason) {
      if (this._onError) {
        this._onError(reason, stream.dict?.objId);
        return;
      }
      throw reason;
    }
    const bufferLength = this.bufferLength;
    const newLength = bufferLength + chunk.length;
    const buffer = this.ensureBuffer(newLength);
    buffer.set(chunk, bufferLength);
    this.bufferLength = newLength;
  }
  getBaseStreams() {
    const baseStreamsBuf = [];
    for (const stream of this.streams) {
      const baseStreams = stream.getBaseStreams();
      if (baseStreams) {
        baseStreamsBuf.push(...baseStreams);
      }
    }
    return baseStreamsBuf.length > 0 ? baseStreamsBuf : null;
  }
}

;// ./src/core/colorspace_utils.js






class ColorSpaceUtils {
  static parse({
    cs,
    xref,
    resources = null,
    pdfFunctionFactory,
    globalColorSpaceCache,
    localColorSpaceCache,
    asyncIfNotCached = false
  }) {
    const options = {
      xref,
      resources,
      pdfFunctionFactory,
      globalColorSpaceCache,
      localColorSpaceCache
    };
    let csName, csRef, parsedCS;
    if (cs instanceof Ref) {
      csRef = cs;
      const cachedCS = globalColorSpaceCache.getByRef(csRef) || localColorSpaceCache.getByRef(csRef);
      if (cachedCS) {
        return cachedCS;
      }
      cs = xref.fetch(cs);
    }
    if (cs instanceof Name) {
      csName = cs.name;
      const cachedCS = localColorSpaceCache.getByName(csName);
      if (cachedCS) {
        return cachedCS;
      }
    }
    try {
      parsedCS = this.#parse(cs, options);
    } catch (ex) {
      if (asyncIfNotCached && !(ex instanceof MissingDataException)) {
        return Promise.reject(ex);
      }
      throw ex;
    }
    if (csName || csRef) {
      localColorSpaceCache.set(csName, csRef, parsedCS);
      if (csRef) {
        globalColorSpaceCache.set(null, csRef, parsedCS);
      }
    }
    return asyncIfNotCached ? Promise.resolve(parsedCS) : parsedCS;
  }
  static #subParse(cs, options) {
    const {
      globalColorSpaceCache
    } = options;
    let csRef;
    if (cs instanceof Ref) {
      csRef = cs;
      const cachedCS = globalColorSpaceCache.getByRef(csRef);
      if (cachedCS) {
        return cachedCS;
      }
    }
    const parsedCS = this.#parse(cs, options);
    if (csRef) {
      globalColorSpaceCache.set(null, csRef, parsedCS);
    }
    return parsedCS;
  }
  static #parse(cs, options) {
    const {
      xref,
      resources,
      pdfFunctionFactory,
      globalColorSpaceCache
    } = options;
    cs = xref.fetchIfRef(cs);
    if (cs instanceof Name) {
      switch (cs.name) {
        case "G":
        case "DeviceGray":
          return this.gray;
        case "RGB":
        case "DeviceRGB":
          return this.rgb;
        case "DeviceRGBA":
          return this.rgba;
        case "CMYK":
        case "DeviceCMYK":
          return this.cmyk;
        case "Pattern":
          return new PatternCS(null);
        default:
          if (resources instanceof Dict) {
            const colorSpaces = resources.get("ColorSpace");
            if (colorSpaces instanceof Dict) {
              const resourcesCS = colorSpaces.get(cs.name);
              if (resourcesCS) {
                if (resourcesCS instanceof Name) {
                  return this.#parse(resourcesCS, options);
                }
                cs = resourcesCS;
                break;
              }
            }
          }
          warn(`Unrecognized ColorSpace: ${cs.name}`);
          return this.gray;
      }
    }
    if (Array.isArray(cs)) {
      const mode = xref.fetchIfRef(cs[0]).name;
      let params, numComps, baseCS, whitePoint, blackPoint, gamma;
      switch (mode) {
        case "G":
        case "DeviceGray":
          return this.gray;
        case "RGB":
        case "DeviceRGB":
          return this.rgb;
        case "CMYK":
        case "DeviceCMYK":
          return this.cmyk;
        case "CalGray":
          params = xref.fetchIfRef(cs[1]);
          whitePoint = params.getArray("WhitePoint");
          blackPoint = params.getArray("BlackPoint");
          gamma = params.get("Gamma");
          return new CalGrayCS(whitePoint, blackPoint, gamma);
        case "CalRGB":
          params = xref.fetchIfRef(cs[1]);
          whitePoint = params.getArray("WhitePoint");
          blackPoint = params.getArray("BlackPoint");
          gamma = params.getArray("Gamma");
          const matrix = params.getArray("Matrix");
          return new CalRGBCS(whitePoint, blackPoint, gamma, matrix);
        case "ICCBased":
          const isRef = cs[1] instanceof Ref;
          if (isRef) {
            const cachedCS = globalColorSpaceCache.getByRef(cs[1]);
            if (cachedCS) {
              return cachedCS;
            }
          }
          const stream = xref.fetchIfRef(cs[1]);
          const dict = stream.dict;
          numComps = dict.get("N");
          if (IccColorSpace.isUsable) {
            try {
              const iccCS = new IccColorSpace(stream.getBytes(), "ICCBased", numComps);
              if (isRef) {
                globalColorSpaceCache.set(null, cs[1], iccCS);
              }
              return iccCS;
            } catch (ex) {
              if (ex instanceof MissingDataException) {
                throw ex;
              }
              warn(`ICCBased color space (${cs[1]}): "${ex}".`);
            }
          }
          const altRaw = dict.getRaw("Alternate");
          if (altRaw) {
            const altCS = this.#subParse(altRaw, options);
            if (altCS.numComps === numComps) {
              return altCS;
            }
            warn("ICCBased color space: Ignoring incorrect /Alternate entry.");
          }
          if (numComps === 1) {
            return this.gray;
          } else if (numComps === 3) {
            return this.rgb;
          } else if (numComps === 4) {
            return this.cmyk;
          }
          break;
        case "Pattern":
          baseCS = cs[1] || null;
          baseCS &&= this.#subParse(baseCS, options);
          return new PatternCS(baseCS);
        case "I":
        case "Indexed":
          baseCS = this.#subParse(cs[1], options);
          const hiVal = MathClamp(xref.fetchIfRef(cs[2]), 0, 255);
          const lookup = xref.fetchIfRef(cs[3]);
          return new IndexedCS(baseCS, hiVal, lookup);
        case "Separation":
        case "DeviceN":
          const name = xref.fetchIfRef(cs[1]);
          numComps = Array.isArray(name) ? name.length : 1;
          baseCS = this.#subParse(cs[2], options);
          const tintFn = pdfFunctionFactory.create(cs[3]);
          return new AlternateCS(numComps, baseCS, tintFn);
        case "Lab":
          params = xref.fetchIfRef(cs[1]);
          whitePoint = params.getArray("WhitePoint");
          blackPoint = params.getArray("BlackPoint");
          const range = params.getArray("Range");
          return new LabCS(whitePoint, blackPoint, range);
        default:
          warn(`Unimplemented ColorSpace object: ${mode}`);
          return this.gray;
      }
    }
    warn(`Unrecognized ColorSpace object: ${cs}`);
    return this.gray;
  }
  static get gray() {
    return shadow(this, "gray", new DeviceGrayCS());
  }
  static get rgb() {
    return shadow(this, "rgb", new DeviceRgbCS());
  }
  static get rgba() {
    return shadow(this, "rgba", new DeviceRgbaCS());
  }
  static get cmyk() {
    if (CmykICCBasedCS.isUsable) {
      try {
        return shadow(this, "cmyk", new CmykICCBasedCS());
      } catch {
        warn("CMYK fallback: DeviceCMYK");
      }
    }
    return shadow(this, "cmyk", new DeviceCmykCS());
  }
}

;// ./src/core/jpg.js




class JpegError extends BaseException {
  constructor(msg) {
    super(msg, "JpegError");
  }
}
class DNLMarkerError extends BaseException {
  constructor(message, scanLines) {
    super(message, "DNLMarkerError");
    this.scanLines = scanLines;
  }
}
class EOIMarkerError extends BaseException {
  constructor(msg) {
    super(msg, "EOIMarkerError");
  }
}
const dctZigZag = new Uint8Array([0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63]);
const dctCos1 = 4017;
const dctSin1 = 799;
const dctCos3 = 3406;
const dctSin3 = 2276;
const dctCos6 = 1567;
const dctSin6 = 3784;
const dctSqrt2 = 5793;
const dctSqrt1d2 = 2896;
function buildHuffmanTable(codeLengths, values) {
  let k = 0,
    i,
    j,
    length = 16;
  while (length > 0 && !codeLengths[length - 1]) {
    length--;
  }
  const code = [{
    children: [],
    index: 0
  }];
  let p = code[0],
    q;
  for (i = 0; i < length; i++) {
    for (j = 0; j < codeLengths[i]; j++) {
      p = code.pop();
      p.children[p.index] = values[k];
      while (p.index > 0) {
        p = code.pop();
      }
      p.index++;
      code.push(p);
      while (code.length <= i) {
        code.push(q = {
          children: [],
          index: 0
        });
        p.children[p.index] = q.children;
        p = q;
      }
      k++;
    }
    if (i + 1 < length) {
      code.push(q = {
        children: [],
        index: 0
      });
      p.children[p.index] = q.children;
      p = q;
    }
  }
  return code[0].children;
}
function getBlockBufferOffset(component, row, col) {
  return 64 * ((component.blocksPerLine + 1) * row + col);
}
function decodeScan(data, view, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive, parseDNLMarker = false) {
  const mcusPerLine = frame.mcusPerLine;
  const progressive = frame.progressive;
  const startOffset = offset;
  let bitsData = 0,
    bitsCount = 0;
  function readBit() {
    if (bitsCount > 0) {
      bitsCount--;
      return bitsData >> bitsCount & 1;
    }
    bitsData = data[offset++];
    if (bitsData === 0xff) {
      const nextByte = data[offset++];
      if (nextByte) {
        if (nextByte === 0xdc && parseDNLMarker) {
          offset += 2;
          const scanLines = view.getUint16(offset);
          offset += 2;
          if (scanLines > 0 && scanLines !== frame.scanLines) {
            throw new DNLMarkerError("Found DNL marker (0xFFDC) while parsing scan data", scanLines);
          }
        } else if (nextByte === 0xd9) {
          if (parseDNLMarker) {
            const maybeScanLines = blockRow * (frame.precision === 8 ? 8 : 0);
            if (maybeScanLines > 0 && Math.round(frame.scanLines / maybeScanLines) >= 5) {
              throw new DNLMarkerError("Found EOI marker (0xFFD9) while parsing scan data, " + "possibly caused by incorrect `scanLines` parameter", maybeScanLines);
            }
          }
          throw new EOIMarkerError("Found EOI marker (0xFFD9) while parsing scan data");
        }
        throw new JpegError(`unexpected marker ${(bitsData << 8 | nextByte).toString(16)}`);
      }
    }
    bitsCount = 7;
    return bitsData >>> 7;
  }
  function decodeHuffman(tree) {
    let node = tree;
    while (true) {
      node = node[readBit()];
      switch (typeof node) {
        case "number":
          return node;
        case "object":
          continue;
      }
      throw new JpegError("invalid huffman sequence");
    }
  }
  function receive(length) {
    let n = 0;
    while (length > 0) {
      n = n << 1 | readBit();
      length--;
    }
    return n;
  }
  function receiveAndExtend(length) {
    if (length === 1) {
      return readBit() === 1 ? 1 : -1;
    }
    const n = receive(length);
    if (n >= 1 << length - 1) {
      return n;
    }
    return n + (-1 << length) + 1;
  }
  function decodeBaseline(component, blockOffset) {
    const t = decodeHuffman(component.huffmanTableDC);
    const diff = t === 0 ? 0 : receiveAndExtend(t);
    component.blockData[blockOffset] = component.pred += diff;
    let k = 1;
    while (k < 64) {
      const rs = decodeHuffman(component.huffmanTableAC);
      const s = rs & 15,
        r = rs >> 4;
      if (s === 0) {
        if (r < 15) {
          break;
        }
        k += 16;
        continue;
      }
      k += r;
      const z = dctZigZag[k];
      component.blockData[blockOffset + z] = receiveAndExtend(s);
      k++;
    }
  }
  function decodeDCFirst(component, blockOffset) {
    const t = decodeHuffman(component.huffmanTableDC);
    const diff = t === 0 ? 0 : receiveAndExtend(t) << successive;
    component.blockData[blockOffset] = component.pred += diff;
  }
  function decodeDCSuccessive(component, blockOffset) {
    component.blockData[blockOffset] |= readBit() << successive;
  }
  let eobrun = 0;
  function decodeACFirst(component, blockOffset) {
    if (eobrun > 0) {
      eobrun--;
      return;
    }
    let k = spectralStart;
    const e = spectralEnd;
    while (k <= e) {
      const rs = decodeHuffman(component.huffmanTableAC);
      const s = rs & 15,
        r = rs >> 4;
      if (s === 0) {
        if (r < 15) {
          eobrun = receive(r) + (1 << r) - 1;
          break;
        }
        k += 16;
        continue;
      }
      k += r;
      const z = dctZigZag[k];
      component.blockData[blockOffset + z] = receiveAndExtend(s) * (1 << successive);
      k++;
    }
  }
  let successiveACState = 0,
    successiveACNextValue;
  function decodeACSuccessive(component, blockOffset) {
    let k = spectralStart;
    const e = spectralEnd;
    let r = 0;
    let s;
    let rs;
    while (k <= e) {
      const offsetZ = blockOffset + dctZigZag[k];
      const sign = component.blockData[offsetZ] < 0 ? -1 : 1;
      switch (successiveACState) {
        case 0:
          rs = decodeHuffman(component.huffmanTableAC);
          s = rs & 15;
          r = rs >> 4;
          if (s === 0) {
            if (r < 15) {
              eobrun = receive(r) + (1 << r);
              successiveACState = 4;
            } else {
              r = 16;
              successiveACState = 1;
            }
          } else {
            if (s !== 1) {
              throw new JpegError("invalid ACn encoding");
            }
            successiveACNextValue = receiveAndExtend(s);
            successiveACState = r ? 2 : 3;
          }
          continue;
        case 1:
        case 2:
          if (component.blockData[offsetZ]) {
            component.blockData[offsetZ] += sign * (readBit() << successive);
          } else {
            r--;
            if (r === 0) {
              successiveACState = successiveACState === 2 ? 3 : 0;
            }
          }
          break;
        case 3:
          if (component.blockData[offsetZ]) {
            component.blockData[offsetZ] += sign * (readBit() << successive);
          } else {
            component.blockData[offsetZ] = successiveACNextValue << successive;
            successiveACState = 0;
          }
          break;
        case 4:
          if (component.blockData[offsetZ]) {
            component.blockData[offsetZ] += sign * (readBit() << successive);
          }
          break;
      }
      k++;
    }
    if (successiveACState === 4) {
      eobrun--;
      if (eobrun === 0) {
        successiveACState = 0;
      }
    }
  }
  let blockRow = 0;
  function decodeMcu(component, decode, mcu, row, col) {
    const mcuRow = mcu / mcusPerLine | 0;
    const mcuCol = mcu % mcusPerLine;
    blockRow = mcuRow * component.v + row;
    const blockCol = mcuCol * component.h + col;
    const blockOffset = getBlockBufferOffset(component, blockRow, blockCol);
    decode(component, blockOffset);
  }
  function decodeBlock(component, decode, mcu) {
    blockRow = mcu / component.blocksPerLine | 0;
    const blockCol = mcu % component.blocksPerLine;
    const blockOffset = getBlockBufferOffset(component, blockRow, blockCol);
    decode(component, blockOffset);
  }
  const componentsLength = components.length;
  let component, i, j, k, n;
  let decodeFn;
  if (progressive) {
    if (spectralStart === 0) {
      decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
    } else {
      decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
    }
  } else {
    decodeFn = decodeBaseline;
  }
  let mcu = 0,
    fileMarker;
  const mcuExpected = componentsLength === 1 ? components[0].blocksPerLine * components[0].blocksPerColumn : mcusPerLine * frame.mcusPerColumn;
  let h, v;
  while (mcu <= mcuExpected) {
    const mcuToRead = resetInterval ? Math.min(mcuExpected - mcu, resetInterval) : mcuExpected;
    if (mcuToRead > 0) {
      for (i = 0; i < componentsLength; i++) {
        components[i].pred = 0;
      }
      eobrun = 0;
      if (componentsLength === 1) {
        component = components[0];
        for (n = 0; n < mcuToRead; n++) {
          decodeBlock(component, decodeFn, mcu);
          mcu++;
        }
      } else {
        for (n = 0; n < mcuToRead; n++) {
          for (i = 0; i < componentsLength; i++) {
            component = components[i];
            h = component.h;
            v = component.v;
            for (j = 0; j < v; j++) {
              for (k = 0; k < h; k++) {
                decodeMcu(component, decodeFn, mcu, j, k);
              }
            }
          }
          mcu++;
        }
      }
    }
    bitsCount = 0;
    fileMarker = findNextFileMarker(data, view, offset);
    if (!fileMarker) {
      break;
    }
    if (fileMarker.invalid) {
      const partialMsg = mcuToRead > 0 ? "unexpected" : "excessive";
      warn(`decodeScan - ${partialMsg} MCU data, current marker is: ${fileMarker.invalid}`);
      offset = fileMarker.offset;
    }
    if (fileMarker.marker >= 0xffd0 && fileMarker.marker <= 0xffd7) {
      offset += 2;
    } else {
      break;
    }
  }
  return offset - startOffset;
}
function quantizeAndInverse(component, blockBufferOffset, p) {
  const qt = component.quantizationTable,
    blockData = component.blockData;
  let v0, v1, v2, v3, v4, v5, v6, v7;
  let p0, p1, p2, p3, p4, p5, p6, p7;
  let t;
  if (!qt) {
    throw new JpegError("missing required Quantization Table.");
  }
  for (let row = 0; row < 64; row += 8) {
    p0 = blockData[blockBufferOffset + row];
    p1 = blockData[blockBufferOffset + row + 1];
    p2 = blockData[blockBufferOffset + row + 2];
    p3 = blockData[blockBufferOffset + row + 3];
    p4 = blockData[blockBufferOffset + row + 4];
    p5 = blockData[blockBufferOffset + row + 5];
    p6 = blockData[blockBufferOffset + row + 6];
    p7 = blockData[blockBufferOffset + row + 7];
    p0 *= qt[row];
    if ((p1 | p2 | p3 | p4 | p5 | p6 | p7) === 0) {
      t = dctSqrt2 * p0 + 512 >> 10;
      p[row] = t;
      p[row + 1] = t;
      p[row + 2] = t;
      p[row + 3] = t;
      p[row + 4] = t;
      p[row + 5] = t;
      p[row + 6] = t;
      p[row + 7] = t;
      continue;
    }
    p1 *= qt[row + 1];
    p2 *= qt[row + 2];
    p3 *= qt[row + 3];
    p4 *= qt[row + 4];
    p5 *= qt[row + 5];
    p6 *= qt[row + 6];
    p7 *= qt[row + 7];
    v0 = dctSqrt2 * p0 + 128 >> 8;
    v1 = dctSqrt2 * p4 + 128 >> 8;
    v2 = p2;
    v3 = p6;
    v4 = dctSqrt1d2 * (p1 - p7) + 128 >> 8;
    v7 = dctSqrt1d2 * (p1 + p7) + 128 >> 8;
    v5 = p3 << 4;
    v6 = p5 << 4;
    v0 = v0 + v1 + 1 >> 1;
    v1 = v0 - v1;
    t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
    v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
    v3 = t;
    v4 = v4 + v6 + 1 >> 1;
    v6 = v4 - v6;
    v7 = v7 + v5 + 1 >> 1;
    v5 = v7 - v5;
    v0 = v0 + v3 + 1 >> 1;
    v3 = v0 - v3;
    v1 = v1 + v2 + 1 >> 1;
    v2 = v1 - v2;
    t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
    v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
    v7 = t;
    t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
    v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
    v6 = t;
    p[row] = v0 + v7;
    p[row + 7] = v0 - v7;
    p[row + 1] = v1 + v6;
    p[row + 6] = v1 - v6;
    p[row + 2] = v2 + v5;
    p[row + 5] = v2 - v5;
    p[row + 3] = v3 + v4;
    p[row + 4] = v3 - v4;
  }
  for (let col = 0; col < 8; ++col) {
    p0 = p[col];
    p1 = p[col + 8];
    p2 = p[col + 16];
    p3 = p[col + 24];
    p4 = p[col + 32];
    p5 = p[col + 40];
    p6 = p[col + 48];
    p7 = p[col + 56];
    if ((p1 | p2 | p3 | p4 | p5 | p6 | p7) === 0) {
      t = dctSqrt2 * p0 + 8192 >> 14;
      if (t < -2040) {
        t = 0;
      } else if (t >= 2024) {
        t = 255;
      } else {
        t = t + 2056 >> 4;
      }
      blockData[blockBufferOffset + col] = t;
      blockData[blockBufferOffset + col + 8] = t;
      blockData[blockBufferOffset + col + 16] = t;
      blockData[blockBufferOffset + col + 24] = t;
      blockData[blockBufferOffset + col + 32] = t;
      blockData[blockBufferOffset + col + 40] = t;
      blockData[blockBufferOffset + col + 48] = t;
      blockData[blockBufferOffset + col + 56] = t;
      continue;
    }
    v0 = dctSqrt2 * p0 + 2048 >> 12;
    v1 = dctSqrt2 * p4 + 2048 >> 12;
    v2 = p2;
    v3 = p6;
    v4 = dctSqrt1d2 * (p1 - p7) + 2048 >> 12;
    v7 = dctSqrt1d2 * (p1 + p7) + 2048 >> 12;
    v5 = p3;
    v6 = p5;
    v0 = (v0 + v1 + 1 >> 1) + 4112;
    v1 = v0 - v1;
    t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
    v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
    v3 = t;
    v4 = v4 + v6 + 1 >> 1;
    v6 = v4 - v6;
    v7 = v7 + v5 + 1 >> 1;
    v5 = v7 - v5;
    v0 = v0 + v3 + 1 >> 1;
    v3 = v0 - v3;
    v1 = v1 + v2 + 1 >> 1;
    v2 = v1 - v2;
    t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
    v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
    v7 = t;
    t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
    v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
    v6 = t;
    p0 = v0 + v7;
    p7 = v0 - v7;
    p1 = v1 + v6;
    p6 = v1 - v6;
    p2 = v2 + v5;
    p5 = v2 - v5;
    p3 = v3 + v4;
    p4 = v3 - v4;
    if (p0 < 16) {
      p0 = 0;
    } else if (p0 >= 4080) {
      p0 = 255;
    } else {
      p0 >>= 4;
    }
    if (p1 < 16) {
      p1 = 0;
    } else if (p1 >= 4080) {
      p1 = 255;
    } else {
      p1 >>= 4;
    }
    if (p2 < 16) {
      p2 = 0;
    } else if (p2 >= 4080) {
      p2 = 255;
    } else {
      p2 >>= 4;
    }
    if (p3 < 16) {
      p3 = 0;
    } else if (p3 >= 4080) {
      p3 = 255;
    } else {
      p3 >>= 4;
    }
    if (p4 < 16) {
      p4 = 0;
    } else if (p4 >= 4080) {
      p4 = 255;
    } else {
      p4 >>= 4;
    }
    if (p5 < 16) {
      p5 = 0;
    } else if (p5 >= 4080) {
      p5 = 255;
    } else {
      p5 >>= 4;
    }
    if (p6 < 16) {
      p6 = 0;
    } else if (p6 >= 4080) {
      p6 = 255;
    } else {
      p6 >>= 4;
    }
    if (p7 < 16) {
      p7 = 0;
    } else if (p7 >= 4080) {
      p7 = 255;
    } else {
      p7 >>= 4;
    }
    blockData[blockBufferOffset + col] = p0;
    blockData[blockBufferOffset + col + 8] = p1;
    blockData[blockBufferOffset + col + 16] = p2;
    blockData[blockBufferOffset + col + 24] = p3;
    blockData[blockBufferOffset + col + 32] = p4;
    blockData[blockBufferOffset + col + 40] = p5;
    blockData[blockBufferOffset + col + 48] = p6;
    blockData[blockBufferOffset + col + 56] = p7;
  }
}
function buildComponentData(frame, component) {
  const blocksPerLine = component.blocksPerLine;
  const blocksPerColumn = component.blocksPerColumn;
  const computationBuffer = new Int16Array(64);
  for (let blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
    for (let blockCol = 0; blockCol < blocksPerLine; blockCol++) {
      const offset = getBlockBufferOffset(component, blockRow, blockCol);
      quantizeAndInverse(component, offset, computationBuffer);
    }
  }
  return component.blockData;
}
function findNextFileMarker(data, view, currentPos, startPos = currentPos) {
  const maxPos = data.length - 1;
  let newPos = startPos < currentPos ? startPos : currentPos;
  if (currentPos >= maxPos) {
    return null;
  }
  const currentMarker = view.getUint16(currentPos);
  if (currentMarker >= 0xffc0 && currentMarker <= 0xfffe) {
    return {
      invalid: null,
      marker: currentMarker,
      offset: currentPos
    };
  }
  let newMarker = view.getUint16(newPos);
  while (!(newMarker >= 0xffc0 && newMarker <= 0xfffe)) {
    if (++newPos >= maxPos) {
      return null;
    }
    newMarker = view.getUint16(newPos);
  }
  return {
    invalid: currentMarker.toString(16),
    marker: newMarker,
    offset: newPos
  };
}
function prepareComponents(frame) {
  const mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / frame.maxH);
  const mcusPerColumn = Math.ceil(frame.scanLines / 8 / frame.maxV);
  for (const component of frame.components) {
    const blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / frame.maxH);
    const blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines / 8) * component.v / frame.maxV);
    const blocksPerLineForMcu = mcusPerLine * component.h;
    const blocksPerColumnForMcu = mcusPerColumn * component.v;
    const blocksBufferSize = 64 * blocksPerColumnForMcu * (blocksPerLineForMcu + 1);
    component.blockData = new Int16Array(blocksBufferSize);
    component.blocksPerLine = blocksPerLine;
    component.blocksPerColumn = blocksPerColumn;
  }
  frame.mcusPerLine = mcusPerLine;
  frame.mcusPerColumn = mcusPerColumn;
}
function readDataBlock(data, view, offset) {
  const length = view.getUint16(offset);
  offset += 2;
  let endOffset = offset + length - 2;
  const fileMarker = findNextFileMarker(data, view, endOffset, offset);
  if (fileMarker?.invalid) {
    warn("readDataBlock - incorrect length, current marker is: " + fileMarker.invalid);
    endOffset = fileMarker.offset;
  }
  const array = data.subarray(offset, endOffset);
  return {
    appData: array,
    oldOffset: offset,
    newOffset: offset + array.length
  };
}
function skipData(data, view, offset) {
  const length = view.getUint16(offset);
  offset += 2;
  const endOffset = offset + length - 2;
  const fileMarker = findNextFileMarker(data, view, endOffset, offset);
  if (fileMarker?.invalid) {
    return fileMarker.offset;
  }
  return endOffset;
}
class JpegImage {
  constructor(options) {
    this._colorTransform = options?.colorTransform ?? -1;
  }
  static canUseImageDecoder(data, colorTransform = -1) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const info = {
      width: 0,
      height: 0,
      exifStart: 0,
      exifEnd: 0
    };
    let offset = 0;
    let numComponents = null;
    let fileMarker = view.getUint16(offset);
    offset += 2;
    if (fileMarker !== 0xffd8) {
      throw new JpegError("SOI not found");
    }
    fileMarker = view.getUint16(offset);
    offset += 2;
    markerLoop: while (fileMarker !== 0xffd9) {
      switch (fileMarker) {
        case 0xffe1:
          const {
            appData,
            oldOffset,
            newOffset
          } = readDataBlock(data, view, offset);
          offset = newOffset;
          if (appData[0] === 0x45 && appData[1] === 0x78 && appData[2] === 0x69 && appData[3] === 0x66 && appData[4] === 0 && appData[5] === 0) {
            if (info.exifStart) {
              throw new JpegError("Duplicate EXIF-blocks found.");
            }
            info.exifStart = oldOffset + 6;
            info.exifEnd = newOffset;
          }
          fileMarker = view.getUint16(offset);
          offset += 2;
          continue;
        case 0xffc0:
        case 0xffc1:
        case 0xffc2:
          info.height = view.getUint16(offset + (2 + 1));
          info.width = view.getUint16(offset + (2 + 1 + 2));
          numComponents = data[offset + (2 + 1 + 2 + 2)];
          break markerLoop;
        case 0xffff:
          if (data[offset] !== 0xff) {
            offset--;
          }
          break;
      }
      offset = skipData(data, view, offset);
      fileMarker = view.getUint16(offset);
      offset += 2;
    }
    if (numComponents === 4) {
      return null;
    }
    if (numComponents === 3 && colorTransform === 0) {
      return null;
    }
    return info;
  }
  parse(data, {
    dnlScanLines = null
  } = {}) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const maxOffset = data.length - 1;
    let offset = 0;
    let jfif = null;
    let adobe = null;
    let frame, resetInterval;
    let numSOSMarkers = 0;
    const quantizationTables = [];
    const huffmanTablesAC = [],
      huffmanTablesDC = [];
    let fileMarker = view.getUint16(offset);
    offset += 2;
    if (fileMarker !== 0xffd8) {
      throw new JpegError("SOI not found");
    }
    fileMarker = view.getUint16(offset);
    offset += 2;
    markerLoop: while (fileMarker !== 0xffd9) {
      let i, j, l;
      switch (fileMarker) {
        case 0xffe0:
        case 0xffe1:
        case 0xffe2:
        case 0xffe3:
        case 0xffe4:
        case 0xffe5:
        case 0xffe6:
        case 0xffe7:
        case 0xffe8:
        case 0xffe9:
        case 0xffea:
        case 0xffeb:
        case 0xffec:
        case 0xffed:
        case 0xffee:
        case 0xffef:
        case 0xfffe:
          const {
            appData,
            newOffset
          } = readDataBlock(data, view, offset);
          offset = newOffset;
          if (fileMarker === 0xffe0) {
            if (appData[0] === 0x4a && appData[1] === 0x46 && appData[2] === 0x49 && appData[3] === 0x46 && appData[4] === 0) {
              jfif = {
                version: {
                  major: appData[5],
                  minor: appData[6]
                },
                densityUnits: appData[7],
                xDensity: appData[8] << 8 | appData[9],
                yDensity: appData[10] << 8 | appData[11],
                thumbWidth: appData[12],
                thumbHeight: appData[13],
                thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
              };
            }
          }
          if (fileMarker === 0xffee) {
            if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6f && appData[3] === 0x62 && appData[4] === 0x65) {
              adobe = {
                version: appData[5] << 8 | appData[6],
                flags0: appData[7] << 8 | appData[8],
                flags1: appData[9] << 8 | appData[10],
                transformCode: appData[11]
              };
            }
          }
          break;
        case 0xffdb:
          const quantizationTablesLength = view.getUint16(offset);
          offset += 2;
          const quantizationTablesEnd = quantizationTablesLength + offset - 2;
          let z;
          while (offset < quantizationTablesEnd) {
            const quantizationTableSpec = data[offset++];
            const tableData = new Uint16Array(64);
            if (quantizationTableSpec >> 4 === 0) {
              for (j = 0; j < 64; j++) {
                z = dctZigZag[j];
                tableData[z] = data[offset++];
              }
            } else if (quantizationTableSpec >> 4 === 1) {
              for (j = 0; j < 64; j++) {
                z = dctZigZag[j];
                tableData[z] = view.getUint16(offset);
                offset += 2;
              }
            } else {
              throw new JpegError("DQT - invalid table spec");
            }
            quantizationTables[quantizationTableSpec & 15] = tableData;
          }
          break;
        case 0xffc0:
        case 0xffc1:
        case 0xffc2:
          if (frame) {
            throw new JpegError("Only single frame JPEGs supported");
          }
          offset += 2;
          frame = {};
          frame.extended = fileMarker === 0xffc1;
          frame.progressive = fileMarker === 0xffc2;
          frame.precision = data[offset++];
          const sofScanLines = view.getUint16(offset);
          offset += 2;
          frame.scanLines = dnlScanLines || sofScanLines;
          frame.samplesPerLine = view.getUint16(offset);
          offset += 2;
          frame.components = [];
          frame.componentIds = {};
          const componentsCount = data[offset++];
          let maxH = 0,
            maxV = 0;
          for (i = 0; i < componentsCount; i++) {
            const componentId = data[offset];
            const h = data[offset + 1] >> 4;
            const v = data[offset + 1] & 15;
            if (maxH < h) {
              maxH = h;
            }
            if (maxV < v) {
              maxV = v;
            }
            const qId = data[offset + 2];
            l = frame.components.push({
              h,
              v,
              quantizationId: qId,
              quantizationTable: null
            });
            frame.componentIds[componentId] = l - 1;
            offset += 3;
          }
          frame.maxH = maxH;
          frame.maxV = maxV;
          prepareComponents(frame);
          break;
        case 0xffc4:
          const huffmanLength = view.getUint16(offset);
          offset += 2;
          for (i = 2; i < huffmanLength;) {
            const huffmanTableSpec = data[offset++];
            const codeLengths = new Uint8Array(16);
            let codeLengthSum = 0;
            for (j = 0; j < 16; j++, offset++) {
              codeLengthSum += codeLengths[j] = data[offset];
            }
            const huffmanValues = new Uint8Array(codeLengthSum);
            for (j = 0; j < codeLengthSum; j++, offset++) {
              huffmanValues[j] = data[offset];
            }
            i += 17 + codeLengthSum;
            (huffmanTableSpec >> 4 === 0 ? huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
          }
          break;
        case 0xffdd:
          offset += 2;
          resetInterval = view.getUint16(offset);
          offset += 2;
          break;
        case 0xffda:
          const parseDNLMarker = ++numSOSMarkers === 1 && !dnlScanLines;
          offset += 2;
          const selectorsCount = data[offset++],
            components = [];
          for (i = 0; i < selectorsCount; i++) {
            const index = data[offset++];
            const componentIndex = frame.componentIds[index];
            const component = frame.components[componentIndex];
            component.index = index;
            const tableSpec = data[offset++];
            component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
            component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
            components.push(component);
          }
          const spectralStart = data[offset++],
            spectralEnd = data[offset++],
            successiveApproximation = data[offset++];
          try {
            const processed = decodeScan(data, view, offset, frame, components, resetInterval, spectralStart, spectralEnd, successiveApproximation >> 4, successiveApproximation & 15, parseDNLMarker);
            offset += processed;
          } catch (ex) {
            if (ex instanceof DNLMarkerError) {
              warn(`${ex.message} -- attempting to re-parse the JPEG image.`);
              return this.parse(data, {
                dnlScanLines: ex.scanLines
              });
            } else if (ex instanceof EOIMarkerError) {
              warn(`${ex.message} -- ignoring the rest of the image data.`);
              break markerLoop;
            }
            throw ex;
          }
          break;
        case 0xffdc:
          offset += 4;
          break;
        case 0xffff:
          if (data[offset] !== 0xff) {
            offset--;
          }
          break;
        default:
          const nextFileMarker = findNextFileMarker(data, view, offset - 2, offset - 3);
          if (nextFileMarker?.invalid) {
            warn("JpegImage.parse - unexpected data, current marker is: " + nextFileMarker.invalid);
            offset = nextFileMarker.offset;
            break;
          }
          if (!nextFileMarker || offset >= maxOffset) {
            warn("JpegImage.parse - reached the end of the image data " + "without finding an EOI marker (0xFFD9).");
            break markerLoop;
          }
          throw new JpegError("JpegImage.parse - unknown marker: " + fileMarker.toString(16));
      }
      if (offset < maxOffset) {
        fileMarker = view.getUint16(offset);
        offset += 2;
      } else {
        fileMarker = 0;
      }
    }
    if (!frame) {
      throw new JpegError("JpegImage.parse - no frame data found.");
    }
    this.width = frame.samplesPerLine;
    this.height = frame.scanLines;
    this.jfif = jfif;
    this.adobe = adobe;
    this.components = [];
    for (const component of frame.components) {
      const quantizationTable = quantizationTables[component.quantizationId];
      if (quantizationTable) {
        component.quantizationTable = quantizationTable;
      }
      this.components.push({
        index: component.index,
        output: buildComponentData(frame, component),
        scaleX: component.h / frame.maxH,
        scaleY: component.v / frame.maxV,
        blocksPerLine: component.blocksPerLine,
        blocksPerColumn: component.blocksPerColumn
      });
    }
    this.numComponents = this.components.length;
    return undefined;
  }
  #getLinearizedBlockData(width, height) {
    const scaleX = this.width / width,
      scaleY = this.height / height;
    let component, componentScaleX, componentScaleY, blocksPerScanline;
    let x, y, i, j, k;
    let index;
    let offset = 0;
    let output;
    const numComponents = this.components.length;
    const dataLength = width * height * numComponents;
    const data = new Uint8ClampedArray(dataLength);
    const xScaleBlockOffset = new Uint32Array(width);
    const mask3LSB = 0xfffffff8;
    let lastComponentScaleX;
    for (i = 0; i < numComponents; i++) {
      component = this.components[i];
      componentScaleX = component.scaleX * scaleX;
      componentScaleY = component.scaleY * scaleY;
      offset = i;
      output = component.output;
      blocksPerScanline = component.blocksPerLine + 1 << 3;
      if (componentScaleX !== lastComponentScaleX) {
        for (x = 0; x < width; x++) {
          j = 0 | x * componentScaleX;
          xScaleBlockOffset[x] = (j & mask3LSB) << 3 | j & 7;
        }
        lastComponentScaleX = componentScaleX;
      }
      for (y = 0; y < height; y++) {
        j = 0 | y * componentScaleY;
        index = blocksPerScanline * (j & mask3LSB) | (j & 7) << 3;
        for (x = 0; x < width; x++) {
          data[offset] = output[index + xScaleBlockOffset[x]];
          offset += numComponents;
        }
      }
    }
    return data;
  }
  get _isColorConversionNeeded() {
    if (this.adobe) {
      return !!this.adobe.transformCode;
    }
    if (this.numComponents === 3) {
      if (this._colorTransform === 0) {
        return false;
      } else if (this.components[0].index === 0x52 && this.components[1].index === 0x47 && this.components[2].index === 0x42) {
        return false;
      }
      return true;
    }
    if (this._colorTransform === 1) {
      return true;
    }
    return false;
  }
  _convertYccToRgb(data) {
    let Y, Cb, Cr;
    for (let i = 0, ii = data.length; i < ii; i += 3) {
      Y = data[i];
      Cb = data[i + 1];
      Cr = data[i + 2];
      data[i] = Y - 179.456 + 1.402 * Cr;
      data[i + 1] = Y + 135.459 - 0.344 * Cb - 0.714 * Cr;
      data[i + 2] = Y - 226.816 + 1.772 * Cb;
    }
    return data;
  }
  _convertYccToRgba(data, out) {
    for (let i = 0, j = 0, ii = data.length; i < ii; i += 3, j += 4) {
      const Y = data[i];
      const Cb = data[i + 1];
      const Cr = data[i + 2];
      out[j] = Y - 179.456 + 1.402 * Cr;
      out[j + 1] = Y + 135.459 - 0.344 * Cb - 0.714 * Cr;
      out[j + 2] = Y - 226.816 + 1.772 * Cb;
      out[j + 3] = 255;
    }
    return out;
  }
  _convertYcckToRgb(data) {
    this._convertYcckToCmyk(data);
    return this._convertCmykToRgb(data);
  }
  _convertYcckToRgba(data) {
    this._convertYcckToCmyk(data);
    return this._convertCmykToRgba(data);
  }
  _convertYcckToCmyk(data) {
    let Y, Cb, Cr;
    for (let i = 0, ii = data.length; i < ii; i += 4) {
      Y = data[i];
      Cb = data[i + 1];
      Cr = data[i + 2];
      data[i] = 434.456 - Y - 1.402 * Cr;
      data[i + 1] = 119.541 - Y + 0.344 * Cb + 0.714 * Cr;
      data[i + 2] = 481.816 - Y - 1.772 * Cb;
    }
    return data;
  }
  _convertCmykToRgb(data) {
    const count = data.length / 4;
    ColorSpaceUtils.cmyk.getRgbBuffer(data, 0, count, data, 0, 8, 0);
    return data.subarray(0, count * 3);
  }
  _convertCmykToRgba(data) {
    ColorSpaceUtils.cmyk.getRgbBuffer(data, 0, data.length / 4, data, 0, 8, 1);
    if (ColorSpaceUtils.cmyk instanceof DeviceCmykCS) {
      for (let i = 3, ii = data.length; i < ii; i += 4) {
        data[i] = 255;
      }
    }
    return data;
  }
  getData({
    width,
    height,
    forceRGBA = false,
    forceRGB = false
  }) {
    if (this.numComponents > 4) {
      throw new JpegError("Unsupported color mode");
    }
    const data = this.#getLinearizedBlockData(width, height);
    if (this.numComponents === 1 && (forceRGBA || forceRGB)) {
      const len = data.length * (forceRGBA ? 4 : 3);
      const rgbaData = new Uint8ClampedArray(len);
      let offset = 0;
      if (forceRGBA) {
        grayToRGBA(data, new Uint32Array(rgbaData.buffer));
      } else {
        for (const grayColor of data) {
          rgbaData[offset++] = grayColor;
          rgbaData[offset++] = grayColor;
          rgbaData[offset++] = grayColor;
        }
      }
      return rgbaData;
    } else if (this.numComponents === 3 && this._isColorConversionNeeded) {
      if (forceRGBA) {
        const rgbaData = new Uint8ClampedArray(data.length / 3 * 4);
        return this._convertYccToRgba(data, rgbaData);
      }
      return this._convertYccToRgb(data);
    } else if (this.numComponents === 4) {
      if (this._isColorConversionNeeded) {
        if (forceRGBA) {
          return this._convertYcckToRgba(data);
        }
        if (forceRGB) {
          return this._convertYcckToRgb(data);
        }
        return this._convertYcckToCmyk(data);
      } else if (forceRGBA) {
        return this._convertCmykToRgba(data);
      } else if (forceRGB) {
        return this._convertCmykToRgb(data);
      }
    }
    return data;
  }
}

;// ./src/core/jpeg_stream.js





class JpegStream extends DecodeStream {
  static #isImageDecoderSupported = FeatureTest.isImageDecoderSupported;
  constructor(stream, maybeLength, params) {
    super(maybeLength);
    this.stream = stream;
    this.dict = stream.dict;
    this.maybeLength = maybeLength;
    this.params = params;
  }
  static get canUseImageDecoder() {
    return shadow(this, "canUseImageDecoder", this.#isImageDecoderSupported ? ImageDecoder.isTypeSupported("image/jpeg") : Promise.resolve(false));
  }
  static setOptions({
    isImageDecoderSupported = false
  }) {
    this.#isImageDecoderSupported = isImageDecoderSupported;
  }
  get bytes() {
    return shadow(this, "bytes", this.stream.getBytes(this.maybeLength));
  }
  ensureBuffer(requested) {}
  readBlock() {
    this.decodeImage();
  }
  get jpegOptions() {
    const jpegOptions = {
      colorTransform: undefined
    };
    if (this.params instanceof Dict) {
      const colorTransform = this.params.get("ColorTransform");
      if (Number.isInteger(colorTransform)) {
        jpegOptions.colorTransform = colorTransform;
      }
    }
    return shadow(this, "jpegOptions", jpegOptions);
  }
  #skipUselessBytes(data) {
    for (let i = 0, ii = data.length - 1; i < ii; i++) {
      if (data[i] === 0xff && data[i + 1] === 0xd8) {
        if (i > 0) {
          data = data.subarray(i);
        }
        break;
      }
    }
    return data;
  }
  decodeImage(bytes) {
    if (this.eof) {
      return this.buffer;
    }
    bytes = this.#skipUselessBytes(bytes || this.bytes);
    const jpegImage = new JpegImage(this.jpegOptions);
    jpegImage.parse(bytes);
    const data = jpegImage.getData({
      width: this.drawWidth,
      height: this.drawHeight,
      forceRGBA: this.forceRGBA,
      forceRGB: this.forceRGB
    });
    this.buffer = data;
    this.bufferLength = data.length;
    this.eof = true;
    return this.buffer;
  }
  get canAsyncDecodeImageFromBuffer() {
    return this.stream.isAsync;
  }
  async getTransferableImage(width, height) {
    if (!(await JpegStream.canUseImageDecoder)) {
      return null;
    }
    const jpegOptions = this.jpegOptions;
    let decoder;
    try {
      const bytes = this.canAsyncDecodeImageFromBuffer && (await this.stream.asyncGetBytes()) || this.bytes;
      if (!bytes) {
        return null;
      }
      let data = this.#skipUselessBytes(bytes);
      const useImageDecoder = JpegImage.canUseImageDecoder(data, jpegOptions.colorTransform);
      if (!useImageDecoder) {
        return null;
      }
      const {
        width: frameWidth,
        height: frameHeight
      } = useImageDecoder;
      const reducePower = ImageResizer.getReducePower(frameWidth, frameHeight);
      if ((frameWidth !== width || frameHeight !== height) && (reducePower || !frameHeight)) {
        return null;
      }
      if (useImageDecoder.exifStart) {
        data = data.slice();
        data.fill(0x00, useImageDecoder.exifStart, useImageDecoder.exifEnd);
      }
      const init = {
        data,
        type: "image/jpeg",
        preferAnimation: false
      };
      if (reducePower) {
        const factor = 2 ** reducePower;
        init.desiredWidth = Math.ceil(frameWidth / factor);
        init.desiredHeight = Math.ceil(frameHeight / factor);
      }
      decoder = new ImageDecoder(init);
      return (await decoder.decode()).image;
    } catch (reason) {
      warn(`getTransferableImage - failed: "${reason}".`);
      return null;
    } finally {
      decoder?.close();
    }
  }
  get isImageStream() {
    return true;
  }
}

;// ./src/core/operator_list.js

function addState(parentState, pattern, checkFn, iterateFn, processFn) {
  let state = parentState;
  for (let i = 0, ii = pattern.length - 1; i < ii; i++) {
    const item = pattern[i];
    state = state[item] ||= [];
  }
  state[pattern.at(-1)] = {
    checkFn,
    iterateFn,
    processFn
  };
}
const InitialState = [];
addState(InitialState, [OPS.save, OPS.transform, OPS.paintInlineImageXObject, OPS.restore], null, function iterateInlineImageGroup(context, i) {
  const fnArray = context.fnArray;
  const iFirstSave = context.iCurr - 3;
  const pos = (i - iFirstSave) % 4;
  switch (pos) {
    case 0:
      return fnArray[i] === OPS.save;
    case 1:
      return fnArray[i] === OPS.transform;
    case 2:
      return fnArray[i] === OPS.paintInlineImageXObject;
    case 3:
      return fnArray[i] === OPS.restore;
  }
  throw new Error(`iterateInlineImageGroup - invalid pos: ${pos}`);
}, function foundInlineImageGroup(context, i) {
  const MIN_IMAGES_IN_INLINE_IMAGES_BLOCK = 10;
  const MAX_IMAGES_IN_INLINE_IMAGES_BLOCK = 200;
  const MAX_WIDTH = 1000;
  const IMAGE_PADDING = 1;
  const fnArray = context.fnArray,
    argsArray = context.argsArray;
  const curr = context.iCurr;
  const iFirstSave = curr - 3;
  const iFirstTransform = curr - 2;
  const iFirstPIIXO = curr - 1;
  const count = Math.min(Math.floor((i - iFirstSave) / 4), MAX_IMAGES_IN_INLINE_IMAGES_BLOCK);
  if (count < MIN_IMAGES_IN_INLINE_IMAGES_BLOCK) {
    return i - (i - iFirstSave) % 4;
  }
  let maxX = 0;
  const map = [];
  let maxLineHeight = 0;
  let currentX = IMAGE_PADDING,
    currentY = IMAGE_PADDING;
  for (let q = 0; q < count; q++) {
    const transform = argsArray[iFirstTransform + (q << 2)];
    const img = argsArray[iFirstPIIXO + (q << 2)][0];
    if (currentX + img.width > MAX_WIDTH) {
      maxX = Math.max(maxX, currentX);
      currentY += maxLineHeight + 2 * IMAGE_PADDING;
      currentX = 0;
      maxLineHeight = 0;
    }
    map.push({
      transform,
      x: currentX,
      y: currentY,
      w: img.width,
      h: img.height
    });
    currentX += img.width + 2 * IMAGE_PADDING;
    maxLineHeight = Math.max(maxLineHeight, img.height);
  }
  const imgWidth = Math.max(maxX, currentX) + IMAGE_PADDING;
  const imgHeight = currentY + maxLineHeight + IMAGE_PADDING;
  const imgData = new Uint8Array(imgWidth * imgHeight * 4);
  const imgRowSize = imgWidth << 2;
  for (let q = 0; q < count; q++) {
    const data = argsArray[iFirstPIIXO + (q << 2)][0].data;
    const rowSize = map[q].w << 2;
    let dataOffset = 0;
    let offset = map[q].x + map[q].y * imgWidth << 2;
    imgData.set(data.subarray(0, rowSize), offset - imgRowSize);
    for (let k = 0, kk = map[q].h; k < kk; k++) {
      imgData.set(data.subarray(dataOffset, dataOffset + rowSize), offset);
      dataOffset += rowSize;
      offset += imgRowSize;
    }
    imgData.set(data.subarray(dataOffset - rowSize, dataOffset), offset);
    while (offset >= 0) {
      data[offset - 4] = data[offset];
      data[offset - 3] = data[offset + 1];
      data[offset - 2] = data[offset + 2];
      data[offset - 1] = data[offset + 3];
      data[offset + rowSize] = data[offset + rowSize - 4];
      data[offset + rowSize + 1] = data[offset + rowSize - 3];
      data[offset + rowSize + 2] = data[offset + rowSize - 2];
      data[offset + rowSize + 3] = data[offset + rowSize - 1];
      offset -= imgRowSize;
    }
  }
  const img = {
    width: imgWidth,
    height: imgHeight
  };
  if (context.isOffscreenCanvasSupported) {
    const canvas = new OffscreenCanvas(imgWidth, imgHeight);
    const ctx = canvas.getContext("2d");
    ctx.putImageData(new ImageData(new Uint8ClampedArray(imgData.buffer), imgWidth, imgHeight), 0, 0);
    img.bitmap = canvas.transferToImageBitmap();
    img.data = null;
  } else {
    img.kind = ImageKind.RGBA_32BPP;
    img.data = imgData;
  }
  fnArray.splice(iFirstSave, count * 4, OPS.paintInlineImageXObjectGroup);
  argsArray.splice(iFirstSave, count * 4, [img, map]);
  return iFirstSave + 1;
});
addState(InitialState, [OPS.save, OPS.transform, OPS.paintImageMaskXObject, OPS.restore], null, function iterateImageMaskGroup(context, i) {
  const fnArray = context.fnArray;
  const iFirstSave = context.iCurr - 3;
  const pos = (i - iFirstSave) % 4;
  switch (pos) {
    case 0:
      return fnArray[i] === OPS.save;
    case 1:
      return fnArray[i] === OPS.transform;
    case 2:
      return fnArray[i] === OPS.paintImageMaskXObject;
    case 3:
      return fnArray[i] === OPS.restore;
  }
  throw new Error(`iterateImageMaskGroup - invalid pos: ${pos}`);
}, function foundImageMaskGroup(context, i) {
  const MIN_IMAGES_IN_MASKS_BLOCK = 10;
  const MAX_IMAGES_IN_MASKS_BLOCK = 100;
  const MAX_SAME_IMAGES_IN_MASKS_BLOCK = 1000;
  const fnArray = context.fnArray,
    argsArray = context.argsArray;
  const curr = context.iCurr;
  const iFirstSave = curr - 3;
  const iFirstTransform = curr - 2;
  const iFirstPIMXO = curr - 1;
  let count = Math.floor((i - iFirstSave) / 4);
  if (count < MIN_IMAGES_IN_MASKS_BLOCK) {
    return i - (i - iFirstSave) % 4;
  }
  let isSameImage = false;
  let iTransform, transformArgs;
  const firstPIMXOArg0 = argsArray[iFirstPIMXO][0];
  const firstTransformArg0 = argsArray[iFirstTransform][0],
    firstTransformArg1 = argsArray[iFirstTransform][1],
    firstTransformArg2 = argsArray[iFirstTransform][2],
    firstTransformArg3 = argsArray[iFirstTransform][3];
  if (firstTransformArg1 === firstTransformArg2) {
    isSameImage = true;
    iTransform = iFirstTransform + 4;
    let iPIMXO = iFirstPIMXO + 4;
    for (let q = 1; q < count; q++, iTransform += 4, iPIMXO += 4) {
      transformArgs = argsArray[iTransform];
      if (argsArray[iPIMXO][0] !== firstPIMXOArg0 || transformArgs[0] !== firstTransformArg0 || transformArgs[1] !== firstTransformArg1 || transformArgs[2] !== firstTransformArg2 || transformArgs[3] !== firstTransformArg3) {
        if (q < MIN_IMAGES_IN_MASKS_BLOCK) {
          isSameImage = false;
        } else {
          count = q;
        }
        break;
      }
    }
  }
  if (isSameImage) {
    count = Math.min(count, MAX_SAME_IMAGES_IN_MASKS_BLOCK);
    const positions = new Float32Array(count * 2);
    iTransform = iFirstTransform;
    for (let q = 0; q < count; q++, iTransform += 4) {
      transformArgs = argsArray[iTransform];
      positions[q << 1] = transformArgs[4];
      positions[(q << 1) + 1] = transformArgs[5];
    }
    fnArray.splice(iFirstSave, count * 4, OPS.paintImageMaskXObjectRepeat);
    argsArray.splice(iFirstSave, count * 4, [firstPIMXOArg0, firstTransformArg0, firstTransformArg1, firstTransformArg2, firstTransformArg3, positions]);
  } else {
    count = Math.min(count, MAX_IMAGES_IN_MASKS_BLOCK);
    const images = [];
    for (let q = 0; q < count; q++) {
      transformArgs = argsArray[iFirstTransform + (q << 2)];
      const maskParams = argsArray[iFirstPIMXO + (q << 2)][0];
      images.push({
        data: maskParams.data,
        width: maskParams.width,
        height: maskParams.height,
        interpolate: maskParams.interpolate,
        count: maskParams.count,
        transform: transformArgs
      });
    }
    fnArray.splice(iFirstSave, count * 4, OPS.paintImageMaskXObjectGroup);
    argsArray.splice(iFirstSave, count * 4, [images]);
  }
  return iFirstSave + 1;
});
addState(InitialState, [OPS.save, OPS.transform, OPS.paintImageXObject, OPS.restore], function (context) {
  const argsArray = context.argsArray;
  const iFirstTransform = context.iCurr - 2;
  return argsArray[iFirstTransform][1] === 0 && argsArray[iFirstTransform][2] === 0;
}, function iterateImageGroup(context, i) {
  const fnArray = context.fnArray,
    argsArray = context.argsArray;
  const iFirstSave = context.iCurr - 3;
  const pos = (i - iFirstSave) % 4;
  switch (pos) {
    case 0:
      return fnArray[i] === OPS.save;
    case 1:
      if (fnArray[i] !== OPS.transform) {
        return false;
      }
      const iFirstTransform = context.iCurr - 2;
      const firstTransformArg0 = argsArray[iFirstTransform][0];
      const firstTransformArg3 = argsArray[iFirstTransform][3];
      if (argsArray[i][0] !== firstTransformArg0 || argsArray[i][1] !== 0 || argsArray[i][2] !== 0 || argsArray[i][3] !== firstTransformArg3) {
        return false;
      }
      return true;
    case 2:
      if (fnArray[i] !== OPS.paintImageXObject) {
        return false;
      }
      const iFirstPIXO = context.iCurr - 1;
      const firstPIXOArg0 = argsArray[iFirstPIXO][0];
      if (argsArray[i][0] !== firstPIXOArg0) {
        return false;
      }
      return true;
    case 3:
      return fnArray[i] === OPS.restore;
  }
  throw new Error(`iterateImageGroup - invalid pos: ${pos}`);
}, function (context, i) {
  const MIN_IMAGES_IN_BLOCK = 3;
  const MAX_IMAGES_IN_BLOCK = 1000;
  const fnArray = context.fnArray,
    argsArray = context.argsArray;
  const curr = context.iCurr;
  const iFirstSave = curr - 3;
  const iFirstTransform = curr - 2;
  const iFirstPIXO = curr - 1;
  const firstPIXOArg0 = argsArray[iFirstPIXO][0];
  const firstTransformArg0 = argsArray[iFirstTransform][0];
  const firstTransformArg3 = argsArray[iFirstTransform][3];
  const count = Math.min(Math.floor((i - iFirstSave) / 4), MAX_IMAGES_IN_BLOCK);
  if (count < MIN_IMAGES_IN_BLOCK) {
    return i - (i - iFirstSave) % 4;
  }
  const positions = new Float32Array(count * 2);
  let iTransform = iFirstTransform;
  for (let q = 0; q < count; q++, iTransform += 4) {
    const transformArgs = argsArray[iTransform];
    positions[q << 1] = transformArgs[4];
    positions[(q << 1) + 1] = transformArgs[5];
  }
  const args = [firstPIXOArg0, firstTransformArg0, firstTransformArg3, positions];
  fnArray.splice(iFirstSave, count * 4, OPS.paintImageXObjectRepeat);
  argsArray.splice(iFirstSave, count * 4, args);
  return iFirstSave + 1;
});
addState(InitialState, [OPS.beginText, OPS.setFont, OPS.setTextMatrix, OPS.showText, OPS.endText], null, function iterateShowTextGroup(context, i) {
  const fnArray = context.fnArray,
    argsArray = context.argsArray;
  const iFirstSave = context.iCurr - 4;
  const pos = (i - iFirstSave) % 5;
  switch (pos) {
    case 0:
      return fnArray[i] === OPS.beginText;
    case 1:
      return fnArray[i] === OPS.setFont;
    case 2:
      return fnArray[i] === OPS.setTextMatrix;
    case 3:
      if (fnArray[i] !== OPS.showText) {
        return false;
      }
      const iFirstSetFont = context.iCurr - 3;
      const firstSetFontArg0 = argsArray[iFirstSetFont][0];
      const firstSetFontArg1 = argsArray[iFirstSetFont][1];
      if (argsArray[i][0] !== firstSetFontArg0 || argsArray[i][1] !== firstSetFontArg1) {
        return false;
      }
      return true;
    case 4:
      return fnArray[i] === OPS.endText;
  }
  throw new Error(`iterateShowTextGroup - invalid pos: ${pos}`);
}, function (context, i) {
  const MIN_CHARS_IN_BLOCK = 3;
  const MAX_CHARS_IN_BLOCK = 1000;
  const fnArray = context.fnArray,
    argsArray = context.argsArray;
  const curr = context.iCurr;
  const iFirstBeginText = curr - 4;
  const iFirstSetFont = curr - 3;
  const iFirstSetTextMatrix = curr - 2;
  const iFirstShowText = curr - 1;
  const iFirstEndText = curr;
  const firstSetFontArg0 = argsArray[iFirstSetFont][0];
  const firstSetFontArg1 = argsArray[iFirstSetFont][1];
  let count = Math.min(Math.floor((i - iFirstBeginText) / 5), MAX_CHARS_IN_BLOCK);
  if (count < MIN_CHARS_IN_BLOCK) {
    return i - (i - iFirstBeginText) % 5;
  }
  let iFirst = iFirstBeginText;
  if (iFirstBeginText >= 4 && fnArray[iFirstBeginText - 4] === fnArray[iFirstSetFont] && fnArray[iFirstBeginText - 3] === fnArray[iFirstSetTextMatrix] && fnArray[iFirstBeginText - 2] === fnArray[iFirstShowText] && fnArray[iFirstBeginText - 1] === fnArray[iFirstEndText] && argsArray[iFirstBeginText - 4][0] === firstSetFontArg0 && argsArray[iFirstBeginText - 4][1] === firstSetFontArg1) {
    count++;
    iFirst -= 5;
  }
  let iEndText = iFirst + 4;
  for (let q = 1; q < count; q++) {
    fnArray.splice(iEndText, 3);
    argsArray.splice(iEndText, 3);
    iEndText += 2;
  }
  return iEndText + 1;
});
addState(InitialState, [OPS.save, OPS.transform, OPS.constructPath, OPS.restore], context => {
  const argsArray = context.argsArray;
  const iFirstConstructPath = context.iCurr - 1;
  const op = argsArray[iFirstConstructPath][0];
  if (op !== OPS.stroke && op !== OPS.closeStroke && op !== OPS.fillStroke && op !== OPS.eoFillStroke && op !== OPS.closeFillStroke && op !== OPS.closeEOFillStroke) {
    return true;
  }
  const iFirstTransform = context.iCurr - 2;
  const transform = argsArray[iFirstTransform];
  return transform[0] === 1 && transform[1] === 0 && transform[2] === 0 && transform[3] === 1;
}, () => false, (context, i) => {
  const {
    fnArray,
    argsArray
  } = context;
  const curr = context.iCurr;
  const iFirstSave = curr - 3;
  const iFirstTransform = curr - 2;
  const iFirstConstructPath = curr - 1;
  const args = argsArray[iFirstConstructPath];
  const transform = argsArray[iFirstTransform];
  const [, [buffer], minMax] = args;
  if (minMax) {
    const newBBox = F32_BBOX_INIT.slice();
    Util.axialAlignedBoundingBox(minMax, transform, newBBox);
    minMax.set(newBBox);
    for (let k = 0, kk = buffer.length; k < kk;) {
      switch (buffer[k++]) {
        case DrawOPS.moveTo:
        case DrawOPS.lineTo:
          Util.applyTransform(buffer, transform, k);
          k += 2;
          break;
        case DrawOPS.curveTo:
          Util.applyTransformToBezier(buffer, transform, k);
          k += 6;
          break;
      }
    }
  }
  fnArray.splice(iFirstSave, 4, OPS.constructPath);
  argsArray.splice(iFirstSave, 4, args);
  return iFirstSave + 1;
});
class NullOptimizer {
  constructor(queue) {
    this.queue = queue;
  }
  _optimize() {}
  push(fn, args) {
    this.queue.fnArray.push(fn);
    this.queue.argsArray.push(args);
    this._optimize();
  }
  flush() {}
  reset() {}
}
class QueueOptimizer extends NullOptimizer {
  constructor(queue) {
    super(queue);
    this.state = null;
    this.context = {
      iCurr: 0,
      fnArray: queue.fnArray,
      argsArray: queue.argsArray,
      isOffscreenCanvasSupported: OperatorList.isOffscreenCanvasSupported
    };
    this.match = null;
    this.lastProcessed = 0;
  }
  _optimize() {
    const fnArray = this.queue.fnArray;
    let i = this.lastProcessed,
      ii = fnArray.length;
    let state = this.state;
    let match = this.match;
    if (!state && !match && i + 1 === ii && !InitialState[fnArray[i]]) {
      this.lastProcessed = ii;
      return;
    }
    const context = this.context;
    while (i < ii) {
      if (match) {
        const iterate = (0, match.iterateFn)(context, i);
        if (iterate) {
          i++;
          continue;
        }
        i = (0, match.processFn)(context, i + 1);
        ii = fnArray.length;
        match = null;
        state = null;
        if (i >= ii) {
          break;
        }
      }
      state = (state || InitialState)[fnArray[i]];
      if (!state || Array.isArray(state)) {
        i++;
        continue;
      }
      context.iCurr = i;
      i++;
      if (state.checkFn && !(0, state.checkFn)(context)) {
        state = null;
        continue;
      }
      match = state;
      state = null;
    }
    this.state = state;
    this.match = match;
    this.lastProcessed = i;
  }
  flush() {
    while (this.match) {
      const length = this.queue.fnArray.length;
      this.lastProcessed = (0, this.match.processFn)(this.context, length);
      this.match = null;
      this.state = null;
      this._optimize();
    }
  }
  reset() {
    this.state = null;
    this.match = null;
    this.lastProcessed = 0;
  }
}
class OperatorList {
  static CHUNK_SIZE = 1000;
  static CHUNK_SIZE_ABOUT = this.CHUNK_SIZE - 5;
  static isOffscreenCanvasSupported = false;
  constructor(intent = 0, streamSink) {
    this._streamSink = streamSink;
    this.fnArray = [];
    this.argsArray = [];
    this.optimizer = streamSink && !(intent & RenderingIntentFlag.OPLIST) ? new QueueOptimizer(this) : new NullOptimizer(this);
    this.dependencies = new Set();
    this._totalLength = 0;
    this.weight = 0;
    this._resolved = streamSink ? null : Promise.resolve();
  }
  static setOptions({
    isOffscreenCanvasSupported
  }) {
    this.isOffscreenCanvasSupported = isOffscreenCanvasSupported;
  }
  get length() {
    return this.argsArray.length;
  }
  get ready() {
    return this._resolved || this._streamSink.ready;
  }
  get totalLength() {
    return this._totalLength + this.length;
  }
  addOp(fn, args) {
    this.optimizer.push(fn, args);
    this.weight++;
    if (this._streamSink) {
      if (this.weight >= OperatorList.CHUNK_SIZE) {
        this.flush();
      } else if (this.weight >= OperatorList.CHUNK_SIZE_ABOUT && (fn === OPS.restore || fn === OPS.endText)) {
        this.flush();
      }
    }
  }
  addImageOps(fn, args, optionalContent, hasMask = false) {
    if (hasMask) {
      this.addOp(OPS.save);
      this.addOp(OPS.setGState, [[["SMask", false]]]);
    }
    if (optionalContent !== undefined) {
      this.addOp(OPS.beginMarkedContentProps, ["OC", optionalContent]);
    }
    this.addOp(fn, args);
    if (optionalContent !== undefined) {
      this.addOp(OPS.endMarkedContent, []);
    }
    if (hasMask) {
      this.addOp(OPS.restore);
    }
  }
  addDependency(dependency) {
    if (this.dependencies.has(dependency)) {
      return;
    }
    this.dependencies.add(dependency);
    this.addOp(OPS.dependency, [dependency]);
  }
  addDependencies(dependencies) {
    for (const dependency of dependencies) {
      this.addDependency(dependency);
    }
  }
  addOpList(opList) {
    if (!(opList instanceof OperatorList)) {
      warn('addOpList - ignoring invalid "opList" parameter.');
      return;
    }
    for (const dependency of opList.dependencies) {
      this.dependencies.add(dependency);
    }
    for (let i = 0, ii = opList.length; i < ii; i++) {
      this.addOp(opList.fnArray[i], opList.argsArray[i]);
    }
  }
  getIR() {
    return {
      fnArray: this.fnArray,
      argsArray: this.argsArray,
      length: this.length
    };
  }
  get _transfers() {
    const transfers = [];
    const {
      fnArray,
      argsArray,
      length
    } = this;
    for (let i = 0; i < length; i++) {
      switch (fnArray[i]) {
        case OPS.paintInlineImageXObject:
        case OPS.paintInlineImageXObjectGroup:
        case OPS.paintImageMaskXObject:
          {
            const {
              bitmap,
              data
            } = argsArray[i][0];
            if (bitmap || data?.buffer) {
              transfers.push(bitmap || data.buffer);
            }
            break;
          }
        case OPS.constructPath:
          {
            const [, [data], minMax] = argsArray[i];
            if (data) {
              transfers.push(data.buffer, minMax.buffer);
            }
            break;
          }
        case OPS.paintFormXObjectBegin:
          const [matrix, bbox] = argsArray[i];
          if (matrix) {
            transfers.push(matrix.buffer);
          }
          if (bbox) {
            transfers.push(bbox.buffer);
          }
          break;
        case OPS.setTextMatrix:
          transfers.push(argsArray[i][0].buffer);
          break;
      }
    }
    return transfers;
  }
  flush(lastChunk = false, separateAnnots = null) {
    this.optimizer.flush();
    const length = this.length;
    this._totalLength += length;
    this._streamSink.enqueue({
      fnArray: this.fnArray,
      argsArray: this.argsArray,
      lastChunk,
      separateAnnots,
      length
    }, 1, this._transfers);
    this.dependencies.clear();
    this.fnArray.length = 0;
    this.argsArray.length = 0;
    this.weight = 0;
    this.optimizer.reset();
  }
}
class CheckedOperatorList extends OperatorList {
  needsIsolation = false;
  hasSoftMask = false;
  addOp(fn, args) {
    if (!this.needsIsolation || !this.hasSoftMask) {
      if (fn === OPS.beginGroup) {
        this.needsIsolation ||= args[0].needsIsolation;
        this.hasSoftMask ||= args[0].hasSoftMask;
      } else if (fn === OPS.setGState) {
        for (const [key, val] of args[0]) {
          if (key === "BM" && val !== "source-over") {
            this.needsIsolation = true;
          } else if (key === "SMask" && val !== false) {
            this.needsIsolation = true;
            this.hasSoftMask = true;
          }
        }
      }
    }
    super.addOp(fn, args);
  }
}

;// ./src/core/pattern.js





const ShadingType = {
  FUNCTION_BASED: 1,
  AXIAL: 2,
  RADIAL: 3,
  FREE_FORM_MESH: 4,
  LATTICE_FORM_MESH: 5,
  COONS_PATCH_MESH: 6,
  TENSOR_PATCH_MESH: 7
};
const MAX_SAMPLED_COLOR_COMPONENTS = 1 << 16;
function getColorConversionBatchSize(count, numComps) {
  return MathClamp(Math.floor(MAX_SAMPLED_COLOR_COMPONENTS / numComps), 1, count);
}
class Pattern {
  static #hasGPU = false;
  constructor() {
    unreachable("Cannot initialize Pattern.");
  }
  static setOptions({
    hasGPU
  }) {
    this.#hasGPU = hasGPU;
  }
  static parseShading(shading, xref, res, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache) {
    const dict = shading instanceof BaseStream ? shading.dict : shading;
    const type = dict.get("ShadingType");
    try {
      switch (type) {
        case ShadingType.FUNCTION_BASED:
          return new FunctionBasedShading(dict, xref, res, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache);
        case ShadingType.AXIAL:
        case ShadingType.RADIAL:
          return new RadialAxialShading(dict, xref, res, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache);
        case ShadingType.FREE_FORM_MESH:
        case ShadingType.LATTICE_FORM_MESH:
        case ShadingType.COONS_PATCH_MESH:
        case ShadingType.TENSOR_PATCH_MESH:
          return new MeshShading(shading, xref, res, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache);
        default:
          throw new FormatError("Unsupported ShadingType: " + type);
      }
    } catch (ex) {
      if (ex instanceof MissingDataException) {
        throw ex;
      }
      warn(ex);
      return new DummyShading();
    }
  }
}
class BaseShading {
  static SMALL_NUMBER = 1e-6;
  getIR() {
    unreachable("Abstract method `getIR` called.");
  }
}
class RadialAxialShading extends BaseShading {
  constructor(dict, xref, resources, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache) {
    super();
    this.shadingType = dict.get("ShadingType");
    let coordsLen = 0;
    if (this.shadingType === ShadingType.AXIAL) {
      coordsLen = 4;
    } else if (this.shadingType === ShadingType.RADIAL) {
      coordsLen = 6;
    }
    this.coordsArr = dict.getArray("Coords");
    if (!isNumberArray(this.coordsArr, coordsLen)) {
      throw new FormatError("RadialAxialShading: Invalid /Coords array.");
    }
    const cs = ColorSpaceUtils.parse({
      cs: dict.getRaw("CS") || dict.getRaw("ColorSpace"),
      xref,
      resources,
      pdfFunctionFactory,
      globalColorSpaceCache,
      localColorSpaceCache
    });
    this.bbox = lookupNormalRect(dict.getArray("BBox"), null);
    let t0 = 0.0,
      t1 = 1.0;
    const domainArr = dict.getArray("Domain");
    if (isNumberArray(domainArr, 2)) {
      [t0, t1] = domainArr;
    }
    let extendStart = false,
      extendEnd = false;
    const extendArr = dict.getArray("Extend");
    if (isBooleanArray(extendArr, 2)) {
      [extendStart, extendEnd] = extendArr;
    }
    this.extendStart = extendStart;
    this.extendEnd = extendEnd;
    const fnObj = dict.getRaw("Function");
    const fn = pdfFunctionFactory.create(fnObj, true);
    const NUMBER_OF_SAMPLES = 840;
    const step = (t1 - t0) / NUMBER_OF_SAMPLES;
    const colorStops = this.colorStops = [];
    if (t0 >= t1 || step <= 0) {
      info("Bad shading domain.");
      return;
    }
    const {
      numComps
    } = cs;
    const ratio = new Float32Array(1);
    const batchSize = getColorConversionBatchSize(NUMBER_OF_SAMPLES, numComps);
    const comps = new Float32Array(batchSize * numComps);
    const rgb = new Uint8ClampedArray(NUMBER_OF_SAMPLES * 3);
    for (let start = 0; start < NUMBER_OF_SAMPLES; start += batchSize) {
      const count = Math.min(batchSize, NUMBER_OF_SAMPLES - start);
      for (let i = 0, offset = 0; i < count; i++, offset += numComps) {
        ratio[0] = t0 + (start + i) * step;
        fn(ratio, 0, comps, offset);
      }
      cs.getRgbItems(comps, count, rgb, start * 3, 0);
    }
    let iBase = 0;
    let rBase = rgb[0],
      gBase = rgb[1],
      bBase = rgb[2];
    colorStops.push([0, Util.makeHexColor(rBase, gBase, bBase)]);
    let iPrev = 1;
    let rPrev = rgb[3],
      gPrev = rgb[4],
      bPrev = rgb[5];
    let maxSlopeR = rPrev - rBase + 1;
    let maxSlopeG = gPrev - gBase + 1;
    let maxSlopeB = bPrev - bBase + 1;
    let minSlopeR = rPrev - rBase - 1;
    let minSlopeG = gPrev - gBase - 1;
    let minSlopeB = bPrev - bBase - 1;
    for (let i = 2; i < NUMBER_OF_SAMPLES; i++) {
      const rgbOffset = i * 3;
      const r = rgb[rgbOffset],
        g = rgb[rgbOffset + 1],
        b = rgb[rgbOffset + 2];
      const run = i - iBase;
      maxSlopeR = Math.min(maxSlopeR, (r - rBase + 1) / run);
      maxSlopeG = Math.min(maxSlopeG, (g - gBase + 1) / run);
      maxSlopeB = Math.min(maxSlopeB, (b - bBase + 1) / run);
      minSlopeR = Math.max(minSlopeR, (r - rBase - 1) / run);
      minSlopeG = Math.max(minSlopeG, (g - gBase - 1) / run);
      minSlopeB = Math.max(minSlopeB, (b - bBase - 1) / run);
      const slopesExist = minSlopeR <= maxSlopeR && minSlopeG <= maxSlopeG && minSlopeB <= maxSlopeB;
      if (!slopesExist) {
        const cssColor = Util.makeHexColor(rPrev, gPrev, bPrev);
        colorStops.push([iPrev / NUMBER_OF_SAMPLES, cssColor]);
        maxSlopeR = r - rPrev + 1;
        maxSlopeG = g - gPrev + 1;
        maxSlopeB = b - bPrev + 1;
        minSlopeR = r - rPrev - 1;
        minSlopeG = g - gPrev - 1;
        minSlopeB = b - bPrev - 1;
        iBase = iPrev;
        rBase = rPrev;
        gBase = gPrev;
        bBase = bPrev;
      }
      iPrev = i;
      rPrev = r;
      gPrev = g;
      bPrev = b;
    }
    colorStops.push([1, Util.makeHexColor(rPrev, gPrev, bPrev)]);
    const background = dict.has("Background") ? cs.getRgbHex(dict.get("Background"), 0) : "transparent";
    if (!extendStart) {
      colorStops.unshift([0, background]);
      colorStops[1][0] += BaseShading.SMALL_NUMBER;
    }
    if (!extendEnd) {
      colorStops.at(-1)[0] -= BaseShading.SMALL_NUMBER;
      colorStops.push([1, background]);
    }
    this.colorStops = colorStops;
  }
  getIR() {
    const {
      coordsArr,
      shadingType
    } = this;
    let type, p0, p1, r0, r1;
    if (shadingType === ShadingType.AXIAL) {
      p0 = [coordsArr[0], coordsArr[1]];
      p1 = [coordsArr[2], coordsArr[3]];
      r0 = null;
      r1 = null;
      type = "axial";
    } else if (shadingType === ShadingType.RADIAL) {
      p0 = [coordsArr[0], coordsArr[1]];
      p1 = [coordsArr[3], coordsArr[4]];
      r0 = coordsArr[2];
      r1 = coordsArr[5];
      type = "radial";
    } else {
      unreachable(`getPattern type unknown: ${shadingType}`);
    }
    return ["RadialAxial", type, this.bbox, this.colorStops, p0, p1, r0, r1];
  }
}
function meshUpdateBounds(self) {
  let minX = self.coords[0][0],
    minY = self.coords[0][1],
    maxX = minX,
    maxY = minY;
  for (let i = 1, ii = self.coords.length; i < ii; i++) {
    const x = self.coords[i][0],
      y = self.coords[i][1];
    minX = minX > x ? x : minX;
    minY = minY > y ? y : minY;
    maxX = maxX < x ? x : maxX;
    maxY = maxY < y ? y : maxY;
  }
  self.bounds = [minX, minY, maxX, maxY];
}
function meshPackData(self) {
  let i, j, ii;
  const coords = self.coords;
  const coordsPacked = new Float32Array(coords.length * 2);
  for (i = 0, j = 0, ii = coords.length; i < ii; i++) {
    const xy = coords[i];
    coordsPacked[j++] = xy[0];
    coordsPacked[j++] = xy[1];
  }
  self.coords = coordsPacked;
  const colors = self.colors;
  const colorsPacked = new Uint8Array(colors.length * 4);
  for (i = 0, j = 0, ii = colors.length; i < ii; i++) {
    const c = colors[i];
    colorsPacked[j++] = c[0];
    colorsPacked[j++] = c[1];
    colorsPacked[j++] = c[2];
    j++;
  }
  self.colors = colorsPacked;
  for (const figure of self.figures) {
    figure.coords = new Uint32Array(figure.coords);
    figure.colors = new Uint32Array(figure.colors);
  }
}
function buildMeshVertexData(coords, colors, figures) {
  let vertexCount = 0;
  for (const figure of figures) {
    if (figure.type === MeshFigureType.TRIANGLES) {
      vertexCount += figure.coords.length;
    } else if (figure.type === MeshFigureType.LATTICE) {
      const vpr = figure.verticesPerRow;
      vertexCount += (Math.floor(figure.coords.length / vpr) - 1) * (vpr - 1) * 6;
    }
  }
  const posData = new Float32Array(vertexCount * 2);
  const colData = new Uint8Array(vertexCount * 4);
  let pOff = 0,
    cOff = 0;
  const addVertex = (pi, ci) => {
    posData[pOff++] = coords[pi * 2];
    posData[pOff++] = coords[pi * 2 + 1];
    colData[cOff++] = colors[ci * 4];
    colData[cOff++] = colors[ci * 4 + 1];
    colData[cOff++] = colors[ci * 4 + 2];
    cOff++;
  };
  for (const figure of figures) {
    const ps = figure.coords;
    const cs = figure.colors;
    if (figure.type === MeshFigureType.TRIANGLES) {
      for (let i = 0, ii = ps.length; i < ii; i++) {
        addVertex(ps[i], cs[i]);
      }
    } else if (figure.type === MeshFigureType.LATTICE) {
      const vpr = figure.verticesPerRow;
      const rows = Math.floor(ps.length / vpr) - 1;
      const cols = vpr - 1;
      for (let i = 0; i < rows; i++) {
        let q = i * vpr;
        for (let j = 0; j < cols; j++, q++) {
          addVertex(ps[q], cs[q]);
          addVertex(ps[q + 1], cs[q + 1]);
          addVertex(ps[q + vpr], cs[q + vpr]);
          addVertex(ps[q + vpr + 1], cs[q + vpr + 1]);
          addVertex(ps[q + 1], cs[q + 1]);
          addVertex(ps[q + vpr], cs[q + vpr]);
        }
      }
    }
  }
  return {
    posData,
    colData,
    vertexCount
  };
}
class FunctionBasedShading extends BaseShading {
  static MAX_STEP_COUNT = 512;
  constructor(dict, xref, resources, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache) {
    super();
    this.bbox = lookupNormalRect(dict.getArray("BBox"), null);
    const cs = ColorSpaceUtils.parse({
      cs: dict.getRaw("CS") || dict.getRaw("ColorSpace"),
      xref,
      resources,
      pdfFunctionFactory,
      globalColorSpaceCache,
      localColorSpaceCache
    });
    this.background = dict.has("Background") ? cs.getRgb(dict.get("Background"), 0) : null;
    const fnObj = dict.getRaw("Function");
    if (!fnObj) {
      throw new FormatError("FunctionBasedShading: missing /Function");
    }
    const fn = pdfFunctionFactory.create(fnObj, true);
    const [x0, x1, y0, y1] = lookupRect(dict.getArray("Domain"), [0, 1, 0, 1]);
    const matrix = lookupMatrix(dict.getArray("Matrix"), IDENTITY_MATRIX);
    this.bounds = BBOX_INIT.slice();
    Util.axialAlignedBoundingBox([x0, y0, x1, y1], matrix, this.bounds);
    const bboxW = this.bounds[2] - this.bounds[0];
    const bboxH = this.bounds[3] - this.bounds[1];
    const stepsX = MathClamp(Math.ceil(bboxW), 1, FunctionBasedShading.MAX_STEP_COUNT);
    const stepsY = MathClamp(Math.ceil(bboxH), 1, FunctionBasedShading.MAX_STEP_COUNT);
    const verticesPerRow = stepsX + 1;
    const totalVertices = (stepsY + 1) * verticesPerRow;
    const coords = this.coords = new Float32Array(totalVertices * 2);
    const colors = this.colors = new Uint8ClampedArray(totalVertices * 4);
    const {
      numComps
    } = cs;
    const xyBuf = new Float32Array(2);
    const batchSize = getColorConversionBatchSize(totalVertices, numComps);
    const comps = new Float32Array(batchSize * numComps);
    const rangeX = (x1 - x0) / stepsX;
    const rangeY = (y1 - y0) / stepsY;
    const halfStepX = rangeX / 2;
    const halfStepY = rangeY / 2;
    let coordOffset = 0;
    let compOffset = 0;
    let batchCount = 0;
    let colorOffset = 0;
    for (let row = 0; row <= stepsY; row++) {
      const yDomain = y0 + rangeY * row;
      xyBuf[1] = row === stepsY ? yDomain - halfStepY : yDomain;
      for (let col = 0; col <= stepsX; col++) {
        const xDomain = x0 + rangeX * col;
        xyBuf[0] = col === stepsX ? xDomain - halfStepX : xDomain;
        fn(xyBuf, 0, comps, compOffset);
        compOffset += numComps;
        batchCount++;
        coords[coordOffset] = xDomain;
        coords[coordOffset + 1] = yDomain;
        Util.applyTransform(coords, matrix, coordOffset);
        coordOffset += 2;
        if (batchCount === batchSize) {
          cs.getRgbItems(comps, batchCount, colors, colorOffset, 1);
          colorOffset += batchCount * 4;
          compOffset = batchCount = 0;
        }
      }
    }
    if (batchCount > 0) {
      cs.getRgbItems(comps, batchCount, colors, colorOffset, 1);
    }
    const ps = new Uint32Array(totalVertices);
    for (let i = 0; i < totalVertices; i++) {
      ps[i] = i;
    }
    this.figures = [{
      type: MeshFigureType.LATTICE,
      coords: ps,
      colors: new Uint32Array(ps),
      verticesPerRow
    }];
  }
  getIR() {
    const {
      posData,
      colData,
      vertexCount
    } = buildMeshVertexData(this.coords, this.colors, this.figures);
    return ["Mesh", ShadingType.FUNCTION_BASED, posData, colData, vertexCount, this.bounds, this.bbox, this.background];
  }
}
class MeshStreamReader {
  constructor(stream, context) {
    this.stream = stream;
    this.context = context;
    this.buffer = 0;
    this.bufferLength = 0;
    const numComps = context.numComps;
    this.tmpCompsBuf = new Float32Array(numComps);
    const csNumComps = context.colorSpace.numComps;
    this.tmpCsCompsBuf = context.colorFn ? new Float32Array(csNumComps) : this.tmpCompsBuf;
  }
  get hasData() {
    if (this.stream.end) {
      return this.stream.pos < this.stream.end;
    }
    if (this.bufferLength > 0) {
      return true;
    }
    const nextByte = this.stream.getByte();
    if (nextByte < 0) {
      return false;
    }
    this.buffer = nextByte;
    this.bufferLength = 8;
    return true;
  }
  readBits(n) {
    const {
      stream
    } = this;
    let {
      buffer,
      bufferLength
    } = this;
    if (n === 32) {
      if (bufferLength === 0) {
        return stream.getInt32() >>> 0;
      }
      buffer = buffer << 24 | stream.getByte() << 16 | stream.getByte() << 8 | stream.getByte();
      const nextByte = stream.getByte();
      this.buffer = nextByte & (1 << bufferLength) - 1;
      return (buffer << 8 - bufferLength | (nextByte & 0xff) >> bufferLength) >>> 0;
    }
    if (n === 8 && bufferLength === 0) {
      return stream.getByte();
    }
    while (bufferLength < n) {
      buffer = buffer << 8 | stream.getByte();
      bufferLength += 8;
    }
    bufferLength -= n;
    this.bufferLength = bufferLength;
    this.buffer = buffer & (1 << bufferLength) - 1;
    return buffer >> bufferLength;
  }
  align() {
    this.buffer = 0;
    this.bufferLength = 0;
  }
  readFlag() {
    return this.readBits(this.context.bitsPerFlag);
  }
  readCoordinate() {
    const {
      bitsPerCoordinate,
      decode
    } = this.context;
    const xi = this.readBits(bitsPerCoordinate);
    const yi = this.readBits(bitsPerCoordinate);
    const scale = bitsPerCoordinate < 32 ? 1 / ((1 << bitsPerCoordinate) - 1) : 2.3283064365386963e-10;
    return [xi * scale * (decode[1] - decode[0]) + decode[0], yi * scale * (decode[3] - decode[2]) + decode[2]];
  }
  readComponents() {
    const {
      bitsPerComponent,
      colorFn,
      colorSpace,
      decode,
      numComps
    } = this.context;
    const scale = bitsPerComponent < 32 ? 1 / ((1 << bitsPerComponent) - 1) : 2.3283064365386963e-10;
    const components = this.tmpCompsBuf;
    for (let i = 0, j = 4; i < numComps; i++, j += 2) {
      const ci = this.readBits(bitsPerComponent);
      components[i] = ci * scale * (decode[j + 1] - decode[j]) + decode[j];
    }
    const color = this.tmpCsCompsBuf;
    colorFn?.(components, 0, color, 0);
    return colorSpace.getRgb(color, 0);
  }
}
let bCache = null;
function getB(count) {
  return (bCache ??= new Map()).getOrInsertComputed(count, () => Array.from({
    length: count + 1
  }, (_, i) => {
    const t = i / count,
      t_ = 1 - t;
    return new Float32Array([t_ ** 3, 3 * t * t_ ** 2, 3 * t ** 2 * t_, t ** 3]);
  }));
}
function clearPatternCaches() {
  bCache?.clear();
}
class MeshShading extends BaseShading {
  static MIN_SPLIT_PATCH_CHUNKS_AMOUNT = 3;
  static MAX_SPLIT_PATCH_CHUNKS_AMOUNT = 20;
  static TRIANGLE_DENSITY = 20;
  constructor(stream, xref, resources, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache) {
    super();
    if (!(stream instanceof BaseStream)) {
      throw new FormatError("Mesh data is not a stream");
    }
    const dict = stream.dict;
    this.shadingType = dict.get("ShadingType");
    this.bbox = lookupNormalRect(dict.getArray("BBox"), null);
    const cs = ColorSpaceUtils.parse({
      cs: dict.getRaw("CS") || dict.getRaw("ColorSpace"),
      xref,
      resources,
      pdfFunctionFactory,
      globalColorSpaceCache,
      localColorSpaceCache
    });
    this.background = dict.has("Background") ? cs.getRgb(dict.get("Background"), 0) : null;
    const fnObj = dict.getRaw("Function");
    const fn = fnObj ? pdfFunctionFactory.create(fnObj, true) : null;
    this.coords = [];
    this.colors = [];
    this.figures = [];
    const decodeContext = {
      bitsPerCoordinate: dict.get("BitsPerCoordinate"),
      bitsPerComponent: dict.get("BitsPerComponent"),
      bitsPerFlag: dict.get("BitsPerFlag"),
      decode: dict.getArray("Decode"),
      colorFn: fn,
      colorSpace: cs,
      numComps: fn ? 1 : cs.numComps
    };
    const reader = new MeshStreamReader(stream, decodeContext);
    let patchMesh = false;
    switch (this.shadingType) {
      case ShadingType.FREE_FORM_MESH:
        this._decodeType4Shading(reader);
        break;
      case ShadingType.LATTICE_FORM_MESH:
        const verticesPerRow = dict.get("VerticesPerRow") | 0;
        if (verticesPerRow < 2) {
          throw new FormatError("Invalid VerticesPerRow");
        }
        this._decodeType5Shading(reader, verticesPerRow);
        break;
      case ShadingType.COONS_PATCH_MESH:
        this._decodeType6Shading(reader);
        patchMesh = true;
        break;
      case ShadingType.TENSOR_PATCH_MESH:
        this._decodeType7Shading(reader);
        patchMesh = true;
        break;
      default:
        unreachable("Unsupported mesh type.");
        break;
    }
    if (patchMesh) {
      this._updateBounds();
      for (let i = 0, ii = this.figures.length; i < ii; i++) {
        this._buildFigureFromPatch(i);
      }
    }
    this._updateBounds();
    this._packData();
  }
  _decodeType4Shading(reader) {
    const coords = this.coords;
    const colors = this.colors;
    const operators = [];
    const ps = [];
    let verticesLeft = 0;
    while (reader.hasData) {
      const f = reader.readFlag();
      const coord = reader.readCoordinate();
      const color = reader.readComponents();
      if (verticesLeft === 0) {
        if (!(0 <= f && f <= 2)) {
          throw new FormatError("Unknown type4 flag");
        }
        switch (f) {
          case 0:
            verticesLeft = 3;
            break;
          case 1:
            ps.push(ps.at(-2), ps.at(-1));
            verticesLeft = 1;
            break;
          case 2:
            ps.push(ps.at(-3), ps.at(-1));
            verticesLeft = 1;
            break;
        }
        operators.push(f);
      }
      ps.push(coords.length);
      coords.push(coord);
      colors.push(color);
      verticesLeft--;
      reader.align();
    }
    this.figures.push({
      type: MeshFigureType.TRIANGLES,
      coords: new Int32Array(ps),
      colors: new Int32Array(ps)
    });
  }
  _decodeType5Shading(reader, verticesPerRow) {
    const coords = this.coords;
    const colors = this.colors;
    const ps = [];
    while (reader.hasData) {
      const coord = reader.readCoordinate();
      const color = reader.readComponents();
      ps.push(coords.length);
      coords.push(coord);
      colors.push(color);
    }
    this.figures.push({
      type: MeshFigureType.LATTICE,
      coords: new Int32Array(ps),
      colors: new Int32Array(ps),
      verticesPerRow
    });
  }
  _decodeType6Shading(reader) {
    const coords = this.coords;
    const colors = this.colors;
    const ps = new Int32Array(16);
    const cs = new Int32Array(4);
    while (reader.hasData) {
      const f = reader.readFlag();
      if (!(0 <= f && f <= 3)) {
        throw new FormatError("Unknown type6 flag");
      }
      const pi = coords.length;
      for (let i = 0, ii = f !== 0 ? 8 : 12; i < ii; i++) {
        coords.push(reader.readCoordinate());
      }
      const ci = colors.length;
      for (let i = 0, ii = f !== 0 ? 2 : 4; i < ii; i++) {
        colors.push(reader.readComponents());
      }
      let tmp1, tmp2, tmp3, tmp4;
      switch (f) {
        case 0:
          ps[12] = pi + 3;
          ps[13] = pi + 4;
          ps[14] = pi + 5;
          ps[15] = pi + 6;
          ps[8] = pi + 2;
          ps[11] = pi + 7;
          ps[4] = pi + 1;
          ps[7] = pi + 8;
          ps[0] = pi;
          ps[1] = pi + 11;
          ps[2] = pi + 10;
          ps[3] = pi + 9;
          cs[2] = ci + 1;
          cs[3] = ci + 2;
          cs[0] = ci;
          cs[1] = ci + 3;
          break;
        case 1:
          tmp1 = ps[12];
          tmp2 = ps[13];
          tmp3 = ps[14];
          tmp4 = ps[15];
          ps[12] = tmp4;
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = tmp3;
          ps[11] = pi + 3;
          ps[4] = tmp2;
          ps[7] = pi + 4;
          ps[0] = tmp1;
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          tmp1 = cs[2];
          tmp2 = cs[3];
          cs[2] = tmp2;
          cs[3] = ci;
          cs[0] = tmp1;
          cs[1] = ci + 1;
          break;
        case 2:
          tmp1 = ps[15];
          tmp2 = ps[11];
          ps[12] = ps[3];
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = ps[7];
          ps[11] = pi + 3;
          ps[4] = tmp2;
          ps[7] = pi + 4;
          ps[0] = tmp1;
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          tmp1 = cs[3];
          cs[2] = cs[1];
          cs[3] = ci;
          cs[0] = tmp1;
          cs[1] = ci + 1;
          break;
        case 3:
          ps[12] = ps[0];
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = ps[1];
          ps[11] = pi + 3;
          ps[4] = ps[2];
          ps[7] = pi + 4;
          ps[0] = ps[3];
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          cs[2] = cs[0];
          cs[3] = ci;
          cs[0] = cs[1];
          cs[1] = ci + 1;
          break;
      }
      ps[5] = coords.length;
      coords.push([(-4 * coords[ps[0]][0] - coords[ps[15]][0] + 6 * (coords[ps[4]][0] + coords[ps[1]][0]) - 2 * (coords[ps[12]][0] + coords[ps[3]][0]) + 3 * (coords[ps[13]][0] + coords[ps[7]][0])) / 9, (-4 * coords[ps[0]][1] - coords[ps[15]][1] + 6 * (coords[ps[4]][1] + coords[ps[1]][1]) - 2 * (coords[ps[12]][1] + coords[ps[3]][1]) + 3 * (coords[ps[13]][1] + coords[ps[7]][1])) / 9]);
      ps[6] = coords.length;
      coords.push([(-4 * coords[ps[3]][0] - coords[ps[12]][0] + 6 * (coords[ps[2]][0] + coords[ps[7]][0]) - 2 * (coords[ps[0]][0] + coords[ps[15]][0]) + 3 * (coords[ps[4]][0] + coords[ps[14]][0])) / 9, (-4 * coords[ps[3]][1] - coords[ps[12]][1] + 6 * (coords[ps[2]][1] + coords[ps[7]][1]) - 2 * (coords[ps[0]][1] + coords[ps[15]][1]) + 3 * (coords[ps[4]][1] + coords[ps[14]][1])) / 9]);
      ps[9] = coords.length;
      coords.push([(-4 * coords[ps[12]][0] - coords[ps[3]][0] + 6 * (coords[ps[8]][0] + coords[ps[13]][0]) - 2 * (coords[ps[0]][0] + coords[ps[15]][0]) + 3 * (coords[ps[11]][0] + coords[ps[1]][0])) / 9, (-4 * coords[ps[12]][1] - coords[ps[3]][1] + 6 * (coords[ps[8]][1] + coords[ps[13]][1]) - 2 * (coords[ps[0]][1] + coords[ps[15]][1]) + 3 * (coords[ps[11]][1] + coords[ps[1]][1])) / 9]);
      ps[10] = coords.length;
      coords.push([(-4 * coords[ps[15]][0] - coords[ps[0]][0] + 6 * (coords[ps[11]][0] + coords[ps[14]][0]) - 2 * (coords[ps[12]][0] + coords[ps[3]][0]) + 3 * (coords[ps[2]][0] + coords[ps[8]][0])) / 9, (-4 * coords[ps[15]][1] - coords[ps[0]][1] + 6 * (coords[ps[11]][1] + coords[ps[14]][1]) - 2 * (coords[ps[12]][1] + coords[ps[3]][1]) + 3 * (coords[ps[2]][1] + coords[ps[8]][1])) / 9]);
      this.figures.push({
        type: MeshFigureType.PATCH,
        coords: new Int32Array(ps),
        colors: new Int32Array(cs)
      });
    }
  }
  _decodeType7Shading(reader) {
    const coords = this.coords;
    const colors = this.colors;
    const ps = new Int32Array(16);
    const cs = new Int32Array(4);
    while (reader.hasData) {
      const f = reader.readFlag();
      if (!(0 <= f && f <= 3)) {
        throw new FormatError("Unknown type7 flag");
      }
      const pi = coords.length;
      for (let i = 0, ii = f !== 0 ? 12 : 16; i < ii; i++) {
        coords.push(reader.readCoordinate());
      }
      const ci = colors.length;
      for (let i = 0, ii = f !== 0 ? 2 : 4; i < ii; i++) {
        colors.push(reader.readComponents());
      }
      let tmp1, tmp2, tmp3, tmp4;
      switch (f) {
        case 0:
          ps[12] = pi + 3;
          ps[13] = pi + 4;
          ps[14] = pi + 5;
          ps[15] = pi + 6;
          ps[8] = pi + 2;
          ps[9] = pi + 13;
          ps[10] = pi + 14;
          ps[11] = pi + 7;
          ps[4] = pi + 1;
          ps[5] = pi + 12;
          ps[6] = pi + 15;
          ps[7] = pi + 8;
          ps[0] = pi;
          ps[1] = pi + 11;
          ps[2] = pi + 10;
          ps[3] = pi + 9;
          cs[2] = ci + 1;
          cs[3] = ci + 2;
          cs[0] = ci;
          cs[1] = ci + 3;
          break;
        case 1:
          tmp1 = ps[12];
          tmp2 = ps[13];
          tmp3 = ps[14];
          tmp4 = ps[15];
          ps[12] = tmp4;
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = tmp3;
          ps[9] = pi + 9;
          ps[10] = pi + 10;
          ps[11] = pi + 3;
          ps[4] = tmp2;
          ps[5] = pi + 8;
          ps[6] = pi + 11;
          ps[7] = pi + 4;
          ps[0] = tmp1;
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          tmp1 = cs[2];
          tmp2 = cs[3];
          cs[2] = tmp2;
          cs[3] = ci;
          cs[0] = tmp1;
          cs[1] = ci + 1;
          break;
        case 2:
          tmp1 = ps[15];
          tmp2 = ps[11];
          ps[12] = ps[3];
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = ps[7];
          ps[9] = pi + 9;
          ps[10] = pi + 10;
          ps[11] = pi + 3;
          ps[4] = tmp2;
          ps[5] = pi + 8;
          ps[6] = pi + 11;
          ps[7] = pi + 4;
          ps[0] = tmp1;
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          tmp1 = cs[3];
          cs[2] = cs[1];
          cs[3] = ci;
          cs[0] = tmp1;
          cs[1] = ci + 1;
          break;
        case 3:
          ps[12] = ps[0];
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = ps[1];
          ps[9] = pi + 9;
          ps[10] = pi + 10;
          ps[11] = pi + 3;
          ps[4] = ps[2];
          ps[5] = pi + 8;
          ps[6] = pi + 11;
          ps[7] = pi + 4;
          ps[0] = ps[3];
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          cs[2] = cs[0];
          cs[3] = ci;
          cs[0] = cs[1];
          cs[1] = ci + 1;
          break;
      }
      this.figures.push({
        type: MeshFigureType.PATCH,
        coords: new Int32Array(ps),
        colors: new Int32Array(cs)
      });
    }
  }
  _buildFigureFromPatch(index) {
    const figure = this.figures[index];
    assert(figure.type === MeshFigureType.PATCH, "Unexpected patch mesh figure");
    const coords = this.coords,
      colors = this.colors;
    const pi = figure.coords;
    const ci = figure.colors;
    const figureMinX = Math.min(coords[pi[0]][0], coords[pi[3]][0], coords[pi[12]][0], coords[pi[15]][0]);
    const figureMinY = Math.min(coords[pi[0]][1], coords[pi[3]][1], coords[pi[12]][1], coords[pi[15]][1]);
    const figureMaxX = Math.max(coords[pi[0]][0], coords[pi[3]][0], coords[pi[12]][0], coords[pi[15]][0]);
    const figureMaxY = Math.max(coords[pi[0]][1], coords[pi[3]][1], coords[pi[12]][1], coords[pi[15]][1]);
    let splitXBy = Math.ceil((figureMaxX - figureMinX) * MeshShading.TRIANGLE_DENSITY / (this.bounds[2] - this.bounds[0]));
    splitXBy = MathClamp(splitXBy, MeshShading.MIN_SPLIT_PATCH_CHUNKS_AMOUNT, MeshShading.MAX_SPLIT_PATCH_CHUNKS_AMOUNT);
    let splitYBy = Math.ceil((figureMaxY - figureMinY) * MeshShading.TRIANGLE_DENSITY / (this.bounds[3] - this.bounds[1]));
    splitYBy = MathClamp(splitYBy, MeshShading.MIN_SPLIT_PATCH_CHUNKS_AMOUNT, MeshShading.MAX_SPLIT_PATCH_CHUNKS_AMOUNT);
    const verticesPerRow = splitXBy + 1;
    const figureCoords = new Int32Array((splitYBy + 1) * verticesPerRow);
    const figureColors = new Int32Array((splitYBy + 1) * verticesPerRow);
    let k = 0;
    const cl = new Uint8Array(3),
      cr = new Uint8Array(3);
    const c0 = colors[ci[0]],
      c1 = colors[ci[1]],
      c2 = colors[ci[2]],
      c3 = colors[ci[3]];
    const bRow = getB(splitYBy),
      bCol = getB(splitXBy);
    for (let row = 0; row <= splitYBy; row++) {
      cl[0] = (c0[0] * (splitYBy - row) + c2[0] * row) / splitYBy | 0;
      cl[1] = (c0[1] * (splitYBy - row) + c2[1] * row) / splitYBy | 0;
      cl[2] = (c0[2] * (splitYBy - row) + c2[2] * row) / splitYBy | 0;
      cr[0] = (c1[0] * (splitYBy - row) + c3[0] * row) / splitYBy | 0;
      cr[1] = (c1[1] * (splitYBy - row) + c3[1] * row) / splitYBy | 0;
      cr[2] = (c1[2] * (splitYBy - row) + c3[2] * row) / splitYBy | 0;
      for (let col = 0; col <= splitXBy; col++, k++) {
        if ((row === 0 || row === splitYBy) && (col === 0 || col === splitXBy)) {
          continue;
        }
        let x = 0,
          y = 0;
        let q = 0;
        for (let i = 0; i <= 3; i++) {
          for (let j = 0; j <= 3; j++, q++) {
            const m = bRow[row][i] * bCol[col][j];
            x += coords[pi[q]][0] * m;
            y += coords[pi[q]][1] * m;
          }
        }
        figureCoords[k] = coords.length;
        coords.push([x, y]);
        figureColors[k] = colors.length;
        const newColor = new Uint8Array(3);
        newColor[0] = (cl[0] * (splitXBy - col) + cr[0] * col) / splitXBy | 0;
        newColor[1] = (cl[1] * (splitXBy - col) + cr[1] * col) / splitXBy | 0;
        newColor[2] = (cl[2] * (splitXBy - col) + cr[2] * col) / splitXBy | 0;
        colors.push(newColor);
      }
    }
    figureCoords[0] = pi[0];
    figureColors[0] = ci[0];
    figureCoords[splitXBy] = pi[3];
    figureColors[splitXBy] = ci[1];
    figureCoords[verticesPerRow * splitYBy] = pi[12];
    figureColors[verticesPerRow * splitYBy] = ci[2];
    figureCoords[verticesPerRow * splitYBy + splitXBy] = pi[15];
    figureColors[verticesPerRow * splitYBy + splitXBy] = ci[3];
    this.figures[index] = {
      type: MeshFigureType.LATTICE,
      coords: figureCoords,
      colors: figureColors,
      verticesPerRow
    };
  }
  _updateBounds() {
    meshUpdateBounds(this);
  }
  _packData() {
    meshPackData(this);
  }
  getIR() {
    const {
      posData,
      colData,
      vertexCount
    } = buildMeshVertexData(this.coords, this.colors, this.figures);
    return ["Mesh", this.shadingType, posData, colData, vertexCount, this.bounds, this.bbox, this.background];
  }
}
class DummyShading extends BaseShading {
  getIR() {
    return ["Dummy"];
  }
}
function getTilingPatternIR(operatorList, dict, color, needsIsolation = true) {
  const matrix = lookupMatrix(dict.getArray("Matrix"), IDENTITY_MATRIX);
  const bbox = lookupNormalRect(dict.getArray("BBox"), null);
  if (!bbox || bbox[2] - bbox[0] === 0 || bbox[3] - bbox[1] === 0) {
    throw new FormatError(`Invalid getTilingPatternIR /BBox array.`);
  }
  const xstep = dict.get("XStep");
  if (typeof xstep !== "number") {
    throw new FormatError(`Invalid getTilingPatternIR /XStep value.`);
  }
  const ystep = dict.get("YStep");
  if (typeof ystep !== "number") {
    throw new FormatError(`Invalid getTilingPatternIR /YStep value.`);
  }
  const paintType = dict.get("PaintType");
  if (!Number.isInteger(paintType)) {
    throw new FormatError(`Invalid getTilingPatternIR /PaintType value.`);
  }
  const tilingType = dict.get("TilingType");
  if (!Number.isInteger(tilingType)) {
    throw new FormatError(`Invalid getTilingPatternIR /TilingType value.`);
  }
  return ["TilingPattern", color, operatorList, matrix, bbox, xstep, ystep, paintType, tilingType, needsIsolation];
}

;// ./src/core/binary_cmap.js


function hexToInt(a, size) {
  let n = 0;
  for (let i = 0; i <= size; i++) {
    n = n << 8 | a[i];
  }
  return n >>> 0;
}
function hexToStr(a, size) {
  if (size === 1) {
    return String.fromCharCode(a[0], a[1]);
  }
  if (size === 3) {
    return String.fromCharCode(a[0], a[1], a[2], a[3]);
  }
  return String.fromCharCode(...a.subarray(0, size + 1));
}
function addHex(a, b, size) {
  let c = 0;
  for (let i = size; i >= 0; i--) {
    c += a[i] + b[i];
    a[i] = c & 255;
    c >>= 8;
  }
}
function incHex(a, size) {
  let c = 1;
  for (let i = size; i >= 0 && c > 0; i--) {
    c += a[i];
    a[i] = c & 255;
    c >>= 8;
  }
}
const MAX_NUM_SIZE = 16;
const MAX_ENCODED_NUM_SIZE = 19;
class BinaryCMapStream extends Stream {
  tmpBuf = new Uint8Array(MAX_ENCODED_NUM_SIZE);
  constructor(data) {
    super(data, 0, data.length, null);
  }
  readNumber() {
    let n = 0;
    let last;
    do {
      const b = this.getByte();
      if (b < 0) {
        throw new FormatError("unexpected EOF in bcmap");
      }
      last = !(b & 0x80);
      n = n << 7 | b & 0x7f;
    } while (!last);
    return n;
  }
  readSigned() {
    const n = this.readNumber();
    return n & 1 ? ~(n >>> 1) : n >>> 1;
  }
  readHex(num, size) {
    num.set(this.getBytes(size + 1));
  }
  readHexNumber(num, size) {
    let last;
    const stack = this.tmpBuf;
    let sp = 0;
    do {
      const b = this.getByte();
      if (b < 0) {
        throw new FormatError("unexpected EOF in bcmap");
      }
      last = !(b & 0x80);
      stack[sp++] = b & 0x7f;
    } while (!last);
    let i = size,
      buffer = 0,
      bufferSize = 0;
    while (i >= 0) {
      while (bufferSize < 8 && stack.length > 0) {
        buffer |= stack[--sp] << bufferSize;
        bufferSize += 7;
      }
      num[i] = buffer & 255;
      i--;
      buffer >>= 8;
      bufferSize -= 8;
    }
  }
  readHexSigned(num, size) {
    this.readHexNumber(num, size);
    const sign = num[size] & 1 ? 255 : 0;
    let c = 0;
    for (let i = 0; i <= size; i++) {
      c = (c & 1) << 8 | num[i];
      num[i] = c >> 1 ^ sign;
    }
  }
  readString() {
    const len = this.readNumber(),
      buf = new Array(len);
    for (let i = 0; i < len; i++) {
      buf[i] = this.readNumber();
    }
    return String.fromCharCode(...buf);
  }
}
class BinaryCMapReader {
  async process(data, cMap, extend) {
    const stream = new BinaryCMapStream(data);
    const header = stream.getByte();
    cMap.vertical = !!(header & 1);
    let useCMap = null;
    const start = new Uint8Array(MAX_NUM_SIZE);
    const end = new Uint8Array(MAX_NUM_SIZE);
    const char = new Uint8Array(MAX_NUM_SIZE);
    const charCode = new Uint8Array(MAX_NUM_SIZE);
    const tmp = new Uint8Array(MAX_NUM_SIZE);
    let code;
    let b;
    while ((b = stream.getByte()) >= 0) {
      const type = b >> 5;
      if (type === 7) {
        switch (b & 0x1f) {
          case 0:
            stream.readString();
            break;
          case 1:
            useCMap = stream.readString();
            break;
        }
        continue;
      }
      const sequence = !!(b & 0x10);
      const dataSize = b & 15;
      if (dataSize + 1 > MAX_NUM_SIZE) {
        throw new Error("BinaryCMapReader.process: Invalid dataSize.");
      }
      const ucs2DataSize = 1;
      const subitemsCount = stream.readNumber();
      switch (type) {
        case 0:
          stream.readHex(start, dataSize);
          stream.readHexNumber(end, dataSize);
          addHex(end, start, dataSize);
          cMap.addCodespaceRange(dataSize + 1, hexToInt(start, dataSize), hexToInt(end, dataSize));
          for (let i = 1; i < subitemsCount; i++) {
            incHex(end, dataSize);
            stream.readHexNumber(start, dataSize);
            addHex(start, end, dataSize);
            stream.readHexNumber(end, dataSize);
            addHex(end, start, dataSize);
            cMap.addCodespaceRange(dataSize + 1, hexToInt(start, dataSize), hexToInt(end, dataSize));
          }
          break;
        case 1:
          stream.readHex(start, dataSize);
          stream.readHexNumber(end, dataSize);
          addHex(end, start, dataSize);
          stream.readNumber();
          for (let i = 1; i < subitemsCount; i++) {
            incHex(end, dataSize);
            stream.readHexNumber(start, dataSize);
            addHex(start, end, dataSize);
            stream.readHexNumber(end, dataSize);
            addHex(end, start, dataSize);
            stream.readNumber();
          }
          break;
        case 2:
          stream.readHex(char, dataSize);
          code = stream.readNumber();
          cMap.mapOne(hexToInt(char, dataSize), code);
          for (let i = 1; i < subitemsCount; i++) {
            incHex(char, dataSize);
            if (!sequence) {
              stream.readHexNumber(tmp, dataSize);
              addHex(char, tmp, dataSize);
            }
            code = stream.readSigned() + (code + 1);
            cMap.mapOne(hexToInt(char, dataSize), code);
          }
          break;
        case 3:
          stream.readHex(start, dataSize);
          stream.readHexNumber(end, dataSize);
          addHex(end, start, dataSize);
          code = stream.readNumber();
          cMap.mapCidRange(hexToInt(start, dataSize), hexToInt(end, dataSize), code);
          for (let i = 1; i < subitemsCount; i++) {
            incHex(end, dataSize);
            if (!sequence) {
              stream.readHexNumber(start, dataSize);
              addHex(start, end, dataSize);
            } else {
              start.set(end);
            }
            stream.readHexNumber(end, dataSize);
            addHex(end, start, dataSize);
            code = stream.readNumber();
            cMap.mapCidRange(hexToInt(start, dataSize), hexToInt(end, dataSize), code);
          }
          break;
        case 4:
          stream.readHex(char, ucs2DataSize);
          stream.readHex(charCode, dataSize);
          cMap.mapOne(hexToInt(char, ucs2DataSize), hexToStr(charCode, dataSize));
          for (let i = 1; i < subitemsCount; i++) {
            incHex(char, ucs2DataSize);
            if (!sequence) {
              stream.readHexNumber(tmp, ucs2DataSize);
              addHex(char, tmp, ucs2DataSize);
            }
            incHex(charCode, dataSize);
            stream.readHexSigned(tmp, dataSize);
            addHex(charCode, tmp, dataSize);
            cMap.mapOne(hexToInt(char, ucs2DataSize), hexToStr(charCode, dataSize));
          }
          break;
        case 5:
          stream.readHex(start, ucs2DataSize);
          stream.readHexNumber(end, ucs2DataSize);
          addHex(end, start, ucs2DataSize);
          stream.readHex(charCode, dataSize);
          cMap.mapBfRange(hexToInt(start, ucs2DataSize), hexToInt(end, ucs2DataSize), hexToStr(charCode, dataSize));
          for (let i = 1; i < subitemsCount; i++) {
            incHex(end, ucs2DataSize);
            if (!sequence) {
              stream.readHexNumber(start, ucs2DataSize);
              addHex(start, end, ucs2DataSize);
            } else {
              start.set(end);
            }
            stream.readHexNumber(end, ucs2DataSize);
            addHex(end, start, ucs2DataSize);
            stream.readHex(charCode, dataSize);
            cMap.mapBfRange(hexToInt(start, ucs2DataSize), hexToInt(end, ucs2DataSize), hexToStr(charCode, dataSize));
          }
          break;
        default:
          throw new Error(`BinaryCMapReader.process - unknown type: ${type}`);
      }
    }
    if (useCMap) {
      return extend(useCMap);
    }
    return cMap;
  }
}

;// ./src/core/ascii_85_stream.js


class Ascii85Stream extends DecodeStream {
  #input = new Uint8Array(5);
  constructor(str, maybeLength) {
    if (maybeLength) {
      maybeLength *= 0.8;
    }
    super(maybeLength);
    this.stream = str;
    this.dict = str.dict;
  }
  readBlock() {
    const TILDA_CHAR = 0x7e;
    const Z_LOWER_CHAR = 0x7a;
    const EOF = -1;
    const str = this.stream;
    let c = str.getByte();
    while (isWhiteSpace(c)) {
      c = str.getByte();
    }
    if (c === EOF || c === TILDA_CHAR) {
      this.eof = true;
      return;
    }
    const bufferLength = this.bufferLength;
    let buffer, i;
    if (c === Z_LOWER_CHAR) {
      buffer = this.ensureBuffer(bufferLength + 4);
      buffer.fill(0, bufferLength, bufferLength + 4);
      this.bufferLength += 4;
    } else {
      const input = this.#input;
      input[0] = c;
      for (i = 1; i < 5; ++i) {
        c = str.getByte();
        while (isWhiteSpace(c)) {
          c = str.getByte();
        }
        input[i] = c;
        if (c === EOF || c === TILDA_CHAR) {
          break;
        }
      }
      buffer = this.ensureBuffer(bufferLength + i - 1);
      this.bufferLength += i - 1;
      if (i < 5) {
        input.fill(0x21 + 84, i, 5);
        this.eof = true;
      }
      let t = 0;
      for (i = 0; i < 5; ++i) {
        t = t * 85 + (input[i] - 0x21);
      }
      for (i = 3; i >= 0; --i) {
        buffer[bufferLength + i] = t & 0xff;
        t >>= 8;
      }
    }
  }
}

;// ./src/core/ascii_hex_stream.js

class AsciiHexStream extends DecodeStream {
  constructor(str, maybeLength) {
    if (maybeLength) {
      maybeLength *= 0.5;
    }
    super(maybeLength);
    this.stream = str;
    this.dict = str.dict;
    this.firstDigit = -1;
  }
  readBlock() {
    const UPSTREAM_BLOCK_SIZE = 8000;
    const bytes = this.stream.getBytes(UPSTREAM_BLOCK_SIZE);
    if (!bytes.length) {
      this.eof = true;
      return;
    }
    const maxDecodeLength = bytes.length + 1 >> 1;
    const buffer = this.ensureBuffer(this.bufferLength + maxDecodeLength);
    let bufferLength = this.bufferLength;
    let firstDigit = this.firstDigit;
    for (const ch of bytes) {
      let digit;
      if (ch >= 0x30 && ch <= 0x39) {
        digit = ch & 0x0f;
      } else if (ch >= 0x41 && ch <= 0x46 || ch >= 0x61 && ch <= 0x66) {
        digit = (ch & 0x0f) + 9;
      } else if (ch === 0x3e) {
        this.eof = true;
        break;
      } else {
        continue;
      }
      if (firstDigit < 0) {
        firstDigit = digit;
      } else {
        buffer[bufferLength++] = firstDigit << 4 | digit;
        firstDigit = -1;
      }
    }
    if (firstDigit >= 0 && this.eof) {
      buffer[bufferLength++] = firstDigit << 4;
      firstDigit = -1;
    }
    this.firstDigit = firstDigit;
    this.bufferLength = bufferLength;
  }
}

;// ./external/brotli/decode.js
let Options;
let makeBrotliDecode = () => {
  const MAX_HUFFMAN_TABLE_SIZE = Int32Array.from([256, 402, 436, 468, 500, 534, 566, 598, 630, 662, 694, 726, 758, 790, 822, 854, 886, 920, 952, 984, 1016, 1048, 1080]);
  const CODE_LENGTH_CODE_ORDER = Int32Array.from([1, 2, 3, 4, 0, 5, 17, 6, 16, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  const DISTANCE_SHORT_CODE_INDEX_OFFSET = Int32Array.from([0, 3, 2, 1, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3]);
  const DISTANCE_SHORT_CODE_VALUE_OFFSET = Int32Array.from([0, 0, 0, 0, -1, 1, -2, 2, -3, 3, -1, 1, -2, 2, -3, 3]);
  const FIXED_TABLE = Int32Array.from([0x020000, 0x020004, 0x020003, 0x030002, 0x020000, 0x020004, 0x020003, 0x040001, 0x020000, 0x020004, 0x020003, 0x030002, 0x020000, 0x020004, 0x020003, 0x040005]);
  const BLOCK_LENGTH_OFFSET = Int32Array.from([1, 5, 9, 13, 17, 25, 33, 41, 49, 65, 81, 97, 113, 145, 177, 209, 241, 305, 369, 497, 753, 1265, 2289, 4337, 8433, 16625]);
  const BLOCK_LENGTH_N_BITS = Int32Array.from([2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 7, 8, 9, 10, 11, 12, 13, 24]);
  const INSERT_LENGTH_N_BITS = Int16Array.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x02, 0x02, 0x03, 0x03, 0x04, 0x04, 0x05, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0C, 0x0E, 0x18]);
  const COPY_LENGTH_N_BITS = Int16Array.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x02, 0x02, 0x03, 0x03, 0x04, 0x04, 0x05, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x18]);
  const CMD_LOOKUP = new Int16Array(2816);
  unpackCommandLookupTable(CMD_LOOKUP);
  function log2floor(i) {
    let result = -1;
    let step = 16;
    let v = i;
    while (step > 0) {
      let next = v >> step;
      if (next !== 0) {
        result += step;
        v = next;
      }
      step = step >> 1;
    }
    return result + v;
  }
  function calculateDistanceAlphabetSize(npostfix, ndirect, maxndistbits) {
    return 16 + ndirect + 2 * (maxndistbits << npostfix);
  }
  function calculateDistanceAlphabetLimit(s, maxDistance, npostfix, ndirect) {
    if (maxDistance < ndirect + (2 << npostfix)) {
      return makeError(s, -23);
    }
    const offset = (maxDistance - ndirect >> npostfix) + 4;
    const ndistbits = log2floor(offset) - 1;
    const group = ndistbits - 1 << 1 | offset >> ndistbits & 1;
    return (group - 1 << npostfix) + (1 << npostfix) + ndirect + 16;
  }
  function unpackCommandLookupTable(cmdLookup) {
    const insertLengthOffsets = new Int32Array(24);
    const copyLengthOffsets = new Int32Array(24);
    copyLengthOffsets[0] = 2;
    for (let i = 0; i < 23; ++i) {
      insertLengthOffsets[i + 1] = insertLengthOffsets[i] + (1 << INSERT_LENGTH_N_BITS[i]);
      copyLengthOffsets[i + 1] = copyLengthOffsets[i] + (1 << COPY_LENGTH_N_BITS[i]);
    }
    for (let cmdCode = 0; cmdCode < 704; ++cmdCode) {
      let rangeIdx = cmdCode >> 6;
      let distanceContextOffset = -4;
      if (rangeIdx >= 2) {
        rangeIdx -= 2;
        distanceContextOffset = 0;
      }
      const insertCode = (0x29850 >> rangeIdx * 2 & 0x3) << 3 | cmdCode >> 3 & 7;
      const copyCode = (0x26244 >> rangeIdx * 2 & 0x3) << 3 | cmdCode & 7;
      const copyLengthOffset = copyLengthOffsets[copyCode];
      const distanceContext = distanceContextOffset + Math.min(copyLengthOffset, 5) - 2;
      const index = cmdCode * 4;
      cmdLookup[index] = INSERT_LENGTH_N_BITS[insertCode] | COPY_LENGTH_N_BITS[copyCode] << 8;
      cmdLookup[index + 1] = insertLengthOffsets[insertCode];
      cmdLookup[index + 2] = copyLengthOffsets[copyCode];
      cmdLookup[index + 3] = distanceContext;
    }
  }
  function decodeWindowBits(s) {
    const largeWindowEnabled = s.isLargeWindow;
    s.isLargeWindow = 0;
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    if (readFewBits(s, 1) === 0) {
      return 16;
    }
    let n = readFewBits(s, 3);
    if (n !== 0) {
      return 17 + n;
    }
    n = readFewBits(s, 3);
    if (n !== 0) {
      if (n === 1) {
        if (largeWindowEnabled === 0) {
          return -1;
        }
        s.isLargeWindow = 1;
        if (readFewBits(s, 1) === 1) {
          return -1;
        }
        n = readFewBits(s, 6);
        if (n < 10 || n > 30) {
          return -1;
        }
        return n;
      }
      return 8 + n;
    }
    return 17;
  }
  function attachDictionaryChunk(s, data) {
    if (s.runningState !== 1) {
      return makeError(s, -24);
    }
    if (s.cdNumChunks === 0) {
      s.cdChunks = new Array(16);
      s.cdChunkOffsets = new Int32Array(16);
      s.cdBlockBits = -1;
    }
    if (s.cdNumChunks === 15) {
      return makeError(s, -27);
    }
    s.cdChunks[s.cdNumChunks] = data;
    s.cdNumChunks++;
    s.cdTotalSize += data.length;
    s.cdChunkOffsets[s.cdNumChunks] = s.cdTotalSize;
    return 0;
  }
  function initState(s) {
    if (s.runningState !== 0) {
      return makeError(s, -26);
    }
    s.blockTrees = new Int32Array(3091);
    s.blockTrees[0] = 7;
    s.distRbIdx = 3;
    let result = calculateDistanceAlphabetLimit(s, 0x7FFFFFFC, 3, 120);
    if (result < 0) {
      return result;
    }
    const maxDistanceAlphabetLimit = result;
    s.distExtraBits = new Int8Array(maxDistanceAlphabetLimit);
    s.distOffset = new Int32Array(maxDistanceAlphabetLimit);
    result = initBitReader(s);
    if (result < 0) {
      return result;
    }
    s.runningState = 1;
    return 0;
  }
  function close(s) {
    if (s.runningState === 0) {
      return makeError(s, -25);
    }
    if (s.runningState > 0) {
      s.runningState = 11;
    }
    return 0;
  }
  function decodeVarLenUnsignedByte(s) {
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    if (readFewBits(s, 1) !== 0) {
      const n = readFewBits(s, 3);
      if (n === 0) {
        return 1;
      }
      return readFewBits(s, n) + (1 << n);
    }
    return 0;
  }
  function decodeMetaBlockLength(s) {
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    s.inputEnd = readFewBits(s, 1);
    s.metaBlockLength = 0;
    s.isUncompressed = 0;
    s.isMetadata = 0;
    if (s.inputEnd !== 0 && readFewBits(s, 1) !== 0) {
      return 0;
    }
    const sizeNibbles = readFewBits(s, 2) + 4;
    if (sizeNibbles === 7) {
      s.isMetadata = 1;
      if (readFewBits(s, 1) !== 0) {
        return makeError(s, -6);
      }
      const sizeBytes = readFewBits(s, 2);
      if (sizeBytes === 0) {
        return 0;
      }
      for (let i = 0; i < sizeBytes; ++i) {
        if (s.bitOffset >= 16) {
          s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
          s.bitOffset -= 16;
        }
        const bits = readFewBits(s, 8);
        if (bits === 0 && i + 1 === sizeBytes && sizeBytes > 1) {
          return makeError(s, -8);
        }
        s.metaBlockLength += bits << i * 8;
      }
    } else {
      for (let i = 0; i < sizeNibbles; ++i) {
        if (s.bitOffset >= 16) {
          s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
          s.bitOffset -= 16;
        }
        const bits = readFewBits(s, 4);
        if (bits === 0 && i + 1 === sizeNibbles && sizeNibbles > 4) {
          return makeError(s, -8);
        }
        s.metaBlockLength += bits << i * 4;
      }
    }
    s.metaBlockLength++;
    if (s.inputEnd === 0) {
      s.isUncompressed = readFewBits(s, 1);
    }
    return 0;
  }
  function readSymbol(tableGroup, tableIdx, s) {
    let offset = tableGroup[tableIdx];
    const v = s.accumulator32 >>> s.bitOffset;
    offset += v & 0xFF;
    const bits = tableGroup[offset] >> 16;
    const sym = tableGroup[offset] & 0xFFFF;
    if (bits <= 8) {
      s.bitOffset += bits;
      return sym;
    }
    offset += sym;
    const mask = (1 << bits) - 1;
    offset += (v & mask) >>> 8;
    s.bitOffset += (tableGroup[offset] >> 16) + 8;
    return tableGroup[offset] & 0xFFFF;
  }
  function readBlockLength(tableGroup, tableIdx, s) {
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    const code = readSymbol(tableGroup, tableIdx, s);
    const n = BLOCK_LENGTH_N_BITS[code];
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    return BLOCK_LENGTH_OFFSET[code] + (n <= 16 ? readFewBits(s, n) : readManyBits(s, n));
  }
  function moveToFront(v, index) {
    let i = index;
    const value = v[i];
    while (i > 0) {
      v[i] = v[i - 1];
      i--;
    }
    v[0] = value;
  }
  function inverseMoveToFrontTransform(v, vLen) {
    const mtf = new Int32Array(256);
    for (let i = 0; i < 256; ++i) {
      mtf[i] = i;
    }
    for (let i = 0; i < vLen; ++i) {
      const index = v[i] & 0xFF;
      v[i] = mtf[index];
      if (index !== 0) {
        moveToFront(mtf, index);
      }
    }
  }
  function readHuffmanCodeLengths(codeLengthCodeLengths, numSymbols, codeLengths, s) {
    let symbol = 0;
    let prevCodeLen = 8;
    let repeat = 0;
    let repeatCodeLen = 0;
    let space = 32768;
    const table = new Int32Array(33);
    const tableIdx = table.length - 1;
    buildHuffmanTable(table, tableIdx, 5, codeLengthCodeLengths, 18);
    while (symbol < numSymbols && space > 0) {
      if (s.halfOffset > 2030) {
        const result = readMoreInput(s);
        if (result < 0) {
          return result;
        }
      }
      if (s.bitOffset >= 16) {
        s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
        s.bitOffset -= 16;
      }
      const p = s.accumulator32 >>> s.bitOffset & 31;
      s.bitOffset += table[p] >> 16;
      const codeLen = table[p] & 0xFFFF;
      if (codeLen < 16) {
        repeat = 0;
        codeLengths[symbol++] = codeLen;
        if (codeLen !== 0) {
          prevCodeLen = codeLen;
          space -= 32768 >> codeLen;
        }
      } else {
        const extraBits = codeLen - 14;
        let newLen = 0;
        if (codeLen === 16) {
          newLen = prevCodeLen;
        }
        if (repeatCodeLen !== newLen) {
          repeat = 0;
          repeatCodeLen = newLen;
        }
        const oldRepeat = repeat;
        if (repeat > 0) {
          repeat -= 2;
          repeat = repeat << extraBits;
        }
        if (s.bitOffset >= 16) {
          s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
          s.bitOffset -= 16;
        }
        repeat += readFewBits(s, extraBits) + 3;
        const repeatDelta = repeat - oldRepeat;
        if (symbol + repeatDelta > numSymbols) {
          return makeError(s, -2);
        }
        for (let i = 0; i < repeatDelta; ++i) {
          codeLengths[symbol++] = repeatCodeLen;
        }
        if (repeatCodeLen !== 0) {
          space -= repeatDelta << 15 - repeatCodeLen;
        }
      }
    }
    if (space !== 0) {
      return makeError(s, -18);
    }
    codeLengths.fill(0, symbol, numSymbols);
    return 0;
  }
  function checkDupes(s, symbols, length) {
    for (let i = 0; i < length - 1; ++i) {
      for (let j = i + 1; j < length; ++j) {
        if (symbols[i] === symbols[j]) {
          return makeError(s, -7);
        }
      }
    }
    return 0;
  }
  function readSimpleHuffmanCode(alphabetSizeMax, alphabetSizeLimit, tableGroup, tableIdx, s) {
    const codeLengths = new Int32Array(alphabetSizeLimit);
    const symbols = new Int32Array(4);
    const maxBits = 1 + log2floor(alphabetSizeMax - 1);
    const numSymbols = readFewBits(s, 2) + 1;
    for (let i = 0; i < numSymbols; ++i) {
      if (s.bitOffset >= 16) {
        s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
        s.bitOffset -= 16;
      }
      const symbol = readFewBits(s, maxBits);
      if (symbol >= alphabetSizeLimit) {
        return makeError(s, -15);
      }
      symbols[i] = symbol;
    }
    const result = checkDupes(s, symbols, numSymbols);
    if (result < 0) {
      return result;
    }
    let histogramId = numSymbols;
    if (numSymbols === 4) {
      histogramId += readFewBits(s, 1);
    }
    switch (histogramId) {
      case 1:
        codeLengths[symbols[0]] = 1;
        break;
      case 2:
        codeLengths[symbols[0]] = 1;
        codeLengths[symbols[1]] = 1;
        break;
      case 3:
        codeLengths[symbols[0]] = 1;
        codeLengths[symbols[1]] = 2;
        codeLengths[symbols[2]] = 2;
        break;
      case 4:
        codeLengths[symbols[0]] = 2;
        codeLengths[symbols[1]] = 2;
        codeLengths[symbols[2]] = 2;
        codeLengths[symbols[3]] = 2;
        break;
      case 5:
        codeLengths[symbols[0]] = 1;
        codeLengths[symbols[1]] = 2;
        codeLengths[symbols[2]] = 3;
        codeLengths[symbols[3]] = 3;
        break;
      default:
        break;
    }
    return buildHuffmanTable(tableGroup, tableIdx, 8, codeLengths, alphabetSizeLimit);
  }
  function readComplexHuffmanCode(alphabetSizeLimit, skip, tableGroup, tableIdx, s) {
    const codeLengths = new Int32Array(alphabetSizeLimit);
    const codeLengthCodeLengths = new Int32Array(18);
    let space = 32;
    let numCodes = 0;
    for (let i = skip; i < 18; ++i) {
      const codeLenIdx = CODE_LENGTH_CODE_ORDER[i];
      if (s.bitOffset >= 16) {
        s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
        s.bitOffset -= 16;
      }
      const p = s.accumulator32 >>> s.bitOffset & 15;
      s.bitOffset += FIXED_TABLE[p] >> 16;
      const v = FIXED_TABLE[p] & 0xFFFF;
      codeLengthCodeLengths[codeLenIdx] = v;
      if (v !== 0) {
        space -= 32 >> v;
        numCodes++;
        if (space <= 0) {
          break;
        }
      }
    }
    if (space !== 0 && numCodes !== 1) {
      return makeError(s, -4);
    }
    const result = readHuffmanCodeLengths(codeLengthCodeLengths, alphabetSizeLimit, codeLengths, s);
    if (result < 0) {
      return result;
    }
    return buildHuffmanTable(tableGroup, tableIdx, 8, codeLengths, alphabetSizeLimit);
  }
  function readHuffmanCode(alphabetSizeMax, alphabetSizeLimit, tableGroup, tableIdx, s) {
    if (s.halfOffset > 2030) {
      const result = readMoreInput(s);
      if (result < 0) {
        return result;
      }
    }
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    const simpleCodeOrSkip = readFewBits(s, 2);
    if (simpleCodeOrSkip === 1) {
      return readSimpleHuffmanCode(alphabetSizeMax, alphabetSizeLimit, tableGroup, tableIdx, s);
    }
    return readComplexHuffmanCode(alphabetSizeLimit, simpleCodeOrSkip, tableGroup, tableIdx, s);
  }
  function decodeContextMap(contextMapSize, contextMap, s) {
    let result;
    if (s.halfOffset > 2030) {
      result = readMoreInput(s);
      if (result < 0) {
        return result;
      }
    }
    const numTrees = decodeVarLenUnsignedByte(s) + 1;
    if (numTrees === 1) {
      contextMap.fill(0, 0, contextMapSize);
      return numTrees;
    }
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    const useRleForZeros = readFewBits(s, 1);
    let maxRunLengthPrefix = 0;
    if (useRleForZeros !== 0) {
      maxRunLengthPrefix = readFewBits(s, 4) + 1;
    }
    const alphabetSize = numTrees + maxRunLengthPrefix;
    const tableSize = MAX_HUFFMAN_TABLE_SIZE[alphabetSize + 31 >> 5];
    const table = new Int32Array(tableSize + 1);
    const tableIdx = table.length - 1;
    result = readHuffmanCode(alphabetSize, alphabetSize, table, tableIdx, s);
    if (result < 0) {
      return result;
    }
    let i = 0;
    while (i < contextMapSize) {
      if (s.halfOffset > 2030) {
        result = readMoreInput(s);
        if (result < 0) {
          return result;
        }
      }
      if (s.bitOffset >= 16) {
        s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
        s.bitOffset -= 16;
      }
      const code = readSymbol(table, tableIdx, s);
      if (code === 0) {
        contextMap[i] = 0;
        i++;
      } else if (code <= maxRunLengthPrefix) {
        if (s.bitOffset >= 16) {
          s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
          s.bitOffset -= 16;
        }
        let reps = (1 << code) + readFewBits(s, code);
        while (reps !== 0) {
          if (i >= contextMapSize) {
            return makeError(s, -3);
          }
          contextMap[i] = 0;
          i++;
          reps--;
        }
      } else {
        contextMap[i] = code - maxRunLengthPrefix;
        i++;
      }
    }
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    if (readFewBits(s, 1) === 1) {
      inverseMoveToFrontTransform(contextMap, contextMapSize);
    }
    return numTrees;
  }
  function decodeBlockTypeAndLength(s, treeType, numBlockTypes) {
    const ringBuffers = s.rings;
    const offset = 4 + treeType * 2;
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    let blockType = readSymbol(s.blockTrees, 2 * treeType, s);
    const result = readBlockLength(s.blockTrees, 2 * treeType + 1, s);
    if (blockType === 1) {
      blockType = ringBuffers[offset + 1] + 1;
    } else if (blockType === 0) {
      blockType = ringBuffers[offset];
    } else {
      blockType -= 2;
    }
    if (blockType >= numBlockTypes) {
      blockType -= numBlockTypes;
    }
    ringBuffers[offset] = ringBuffers[offset + 1];
    ringBuffers[offset + 1] = blockType;
    return result;
  }
  function decodeLiteralBlockSwitch(s) {
    s.literalBlockLength = decodeBlockTypeAndLength(s, 0, s.numLiteralBlockTypes);
    const literalBlockType = s.rings[5];
    s.contextMapSlice = literalBlockType << 6;
    s.literalTreeIdx = s.contextMap[s.contextMapSlice] & 0xFF;
    const contextMode = s.contextModes[literalBlockType];
    s.contextLookupOffset1 = contextMode << 9;
    s.contextLookupOffset2 = s.contextLookupOffset1 + 256;
  }
  function decodeCommandBlockSwitch(s) {
    s.commandBlockLength = decodeBlockTypeAndLength(s, 1, s.numCommandBlockTypes);
    s.commandTreeIdx = s.rings[7];
  }
  function decodeDistanceBlockSwitch(s) {
    s.distanceBlockLength = decodeBlockTypeAndLength(s, 2, s.numDistanceBlockTypes);
    s.distContextMapSlice = s.rings[9] << 2;
  }
  function maybeReallocateRingBuffer(s) {
    let newSize = s.maxRingBufferSize;
    if (newSize > s.expectedTotalSize) {
      const minimalNewSize = s.expectedTotalSize;
      while (newSize >> 1 > minimalNewSize) {
        newSize = newSize >> 1;
      }
      if (s.inputEnd === 0 && newSize < 16384 && s.maxRingBufferSize >= 16384) {
        newSize = 16384;
      }
    }
    if (newSize <= s.ringBufferSize) {
      return;
    }
    const ringBufferSizeWithSlack = newSize + 37;
    const newBuffer = new Int8Array(ringBufferSizeWithSlack);
    const oldBuffer = s.ringBuffer;
    if (oldBuffer.length !== 0) {
      newBuffer.set(oldBuffer.subarray(0, s.ringBufferSize), 0);
    }
    s.ringBuffer = newBuffer;
    s.ringBufferSize = newSize;
  }
  function readNextMetablockHeader(s) {
    if (s.inputEnd !== 0) {
      s.nextRunningState = 10;
      s.runningState = 12;
      return 0;
    }
    s.literalTreeGroup = new Int32Array(0);
    s.commandTreeGroup = new Int32Array(0);
    s.distanceTreeGroup = new Int32Array(0);
    let result;
    if (s.halfOffset > 2030) {
      result = readMoreInput(s);
      if (result < 0) {
        return result;
      }
    }
    result = decodeMetaBlockLength(s);
    if (result < 0) {
      return result;
    }
    if (s.metaBlockLength === 0 && s.isMetadata === 0) {
      return 0;
    }
    if (s.isUncompressed !== 0 || s.isMetadata !== 0) {
      result = jumpToByteBoundary(s);
      if (result < 0) {
        return result;
      }
      if (s.isMetadata === 0) {
        s.runningState = 6;
      } else {
        s.runningState = 5;
      }
    } else {
      s.runningState = 3;
    }
    if (s.isMetadata !== 0) {
      return 0;
    }
    s.expectedTotalSize += s.metaBlockLength;
    if (s.expectedTotalSize > 1 << 30) {
      s.expectedTotalSize = 1 << 30;
    }
    if (s.ringBufferSize < s.maxRingBufferSize) {
      maybeReallocateRingBuffer(s);
    }
    return 0;
  }
  function readMetablockPartition(s, treeType, numBlockTypes) {
    let offset = s.blockTrees[2 * treeType];
    if (numBlockTypes <= 1) {
      s.blockTrees[2 * treeType + 1] = offset;
      s.blockTrees[2 * treeType + 2] = offset;
      return 1 << 28;
    }
    const blockTypeAlphabetSize = numBlockTypes + 2;
    let result = readHuffmanCode(blockTypeAlphabetSize, blockTypeAlphabetSize, s.blockTrees, 2 * treeType, s);
    if (result < 0) {
      return result;
    }
    offset += result;
    s.blockTrees[2 * treeType + 1] = offset;
    const blockLengthAlphabetSize = 26;
    result = readHuffmanCode(blockLengthAlphabetSize, blockLengthAlphabetSize, s.blockTrees, 2 * treeType + 1, s);
    if (result < 0) {
      return result;
    }
    offset += result;
    s.blockTrees[2 * treeType + 2] = offset;
    return readBlockLength(s.blockTrees, 2 * treeType + 1, s);
  }
  function calculateDistanceLut(s, alphabetSizeLimit) {
    const distExtraBits = s.distExtraBits;
    const distOffset = s.distOffset;
    const npostfix = s.distancePostfixBits;
    const ndirect = s.numDirectDistanceCodes;
    const postfix = 1 << npostfix;
    let bits = 1;
    let half = 0;
    let i = 16;
    for (let j = 0; j < ndirect; ++j) {
      distExtraBits[i] = 0;
      distOffset[i] = j + 1;
      ++i;
    }
    while (i < alphabetSizeLimit) {
      const base = ndirect + ((2 + half << bits) - 4 << npostfix) + 1;
      for (let j = 0; j < postfix; ++j) {
        distExtraBits[i] = bits;
        distOffset[i] = base + j;
        ++i;
      }
      bits = bits + half;
      half = half ^ 1;
    }
  }
  function readMetablockHuffmanCodesAndContextMaps(s) {
    s.numLiteralBlockTypes = decodeVarLenUnsignedByte(s) + 1;
    let result = readMetablockPartition(s, 0, s.numLiteralBlockTypes);
    if (result < 0) {
      return result;
    }
    s.literalBlockLength = result;
    s.numCommandBlockTypes = decodeVarLenUnsignedByte(s) + 1;
    result = readMetablockPartition(s, 1, s.numCommandBlockTypes);
    if (result < 0) {
      return result;
    }
    s.commandBlockLength = result;
    s.numDistanceBlockTypes = decodeVarLenUnsignedByte(s) + 1;
    result = readMetablockPartition(s, 2, s.numDistanceBlockTypes);
    if (result < 0) {
      return result;
    }
    s.distanceBlockLength = result;
    if (s.halfOffset > 2030) {
      result = readMoreInput(s);
      if (result < 0) {
        return result;
      }
    }
    if (s.bitOffset >= 16) {
      s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
      s.bitOffset -= 16;
    }
    s.distancePostfixBits = readFewBits(s, 2);
    s.numDirectDistanceCodes = readFewBits(s, 4) << s.distancePostfixBits;
    s.contextModes = new Int8Array(s.numLiteralBlockTypes);
    let i = 0;
    while (i < s.numLiteralBlockTypes) {
      const limit = Math.min(i + 96, s.numLiteralBlockTypes);
      while (i < limit) {
        if (s.bitOffset >= 16) {
          s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
          s.bitOffset -= 16;
        }
        s.contextModes[i] = readFewBits(s, 2);
        i++;
      }
      if (s.halfOffset > 2030) {
        result = readMoreInput(s);
        if (result < 0) {
          return result;
        }
      }
    }
    const contextMapLength = s.numLiteralBlockTypes << 6;
    s.contextMap = new Int8Array(contextMapLength);
    result = decodeContextMap(contextMapLength, s.contextMap, s);
    if (result < 0) {
      return result;
    }
    const numLiteralTrees = result;
    s.trivialLiteralContext = 1;
    for (let j = 0; j < contextMapLength; ++j) {
      if (s.contextMap[j] !== j >> 6) {
        s.trivialLiteralContext = 0;
        break;
      }
    }
    s.distContextMap = new Int8Array(s.numDistanceBlockTypes << 2);
    result = decodeContextMap(s.numDistanceBlockTypes << 2, s.distContextMap, s);
    if (result < 0) {
      return result;
    }
    const numDistTrees = result;
    s.literalTreeGroup = new Int32Array(huffmanTreeGroupAllocSize(256, numLiteralTrees));
    result = decodeHuffmanTreeGroup(256, 256, numLiteralTrees, s, s.literalTreeGroup);
    if (result < 0) {
      return result;
    }
    s.commandTreeGroup = new Int32Array(huffmanTreeGroupAllocSize(704, s.numCommandBlockTypes));
    result = decodeHuffmanTreeGroup(704, 704, s.numCommandBlockTypes, s, s.commandTreeGroup);
    if (result < 0) {
      return result;
    }
    let distanceAlphabetSizeMax = calculateDistanceAlphabetSize(s.distancePostfixBits, s.numDirectDistanceCodes, 24);
    let distanceAlphabetSizeLimit = distanceAlphabetSizeMax;
    if (s.isLargeWindow === 1) {
      distanceAlphabetSizeMax = calculateDistanceAlphabetSize(s.distancePostfixBits, s.numDirectDistanceCodes, 62);
      result = calculateDistanceAlphabetLimit(s, 0x7FFFFFFC, s.distancePostfixBits, s.numDirectDistanceCodes);
      if (result < 0) {
        return result;
      }
      distanceAlphabetSizeLimit = result;
    }
    s.distanceTreeGroup = new Int32Array(huffmanTreeGroupAllocSize(distanceAlphabetSizeLimit, numDistTrees));
    result = decodeHuffmanTreeGroup(distanceAlphabetSizeMax, distanceAlphabetSizeLimit, numDistTrees, s, s.distanceTreeGroup);
    if (result < 0) {
      return result;
    }
    calculateDistanceLut(s, distanceAlphabetSizeLimit);
    s.contextMapSlice = 0;
    s.distContextMapSlice = 0;
    s.contextLookupOffset1 = s.contextModes[0] * 512;
    s.contextLookupOffset2 = s.contextLookupOffset1 + 256;
    s.literalTreeIdx = 0;
    s.commandTreeIdx = 0;
    s.rings[4] = 1;
    s.rings[5] = 0;
    s.rings[6] = 1;
    s.rings[7] = 0;
    s.rings[8] = 1;
    s.rings[9] = 0;
    return 0;
  }
  function copyUncompressedData(s) {
    const ringBuffer = s.ringBuffer;
    let result;
    if (s.metaBlockLength <= 0) {
      result = reload(s);
      if (result < 0) {
        return result;
      }
      s.runningState = 2;
      return 0;
    }
    const chunkLength = Math.min(s.ringBufferSize - s.pos, s.metaBlockLength);
    result = copyRawBytes(s, ringBuffer, s.pos, chunkLength);
    if (result < 0) {
      return result;
    }
    s.metaBlockLength -= chunkLength;
    s.pos += chunkLength;
    if (s.pos === s.ringBufferSize) {
      s.nextRunningState = 6;
      s.runningState = 12;
      return 0;
    }
    result = reload(s);
    if (result < 0) {
      return result;
    }
    s.runningState = 2;
    return 0;
  }
  function writeRingBuffer(s) {
    const toWrite = Math.min(s.outputLength - s.outputUsed, s.ringBufferBytesReady - s.ringBufferBytesWritten);
    if (toWrite !== 0) {
      s.output.set(s.ringBuffer.subarray(s.ringBufferBytesWritten, s.ringBufferBytesWritten + toWrite), s.outputOffset + s.outputUsed);
      s.outputUsed += toWrite;
      s.ringBufferBytesWritten += toWrite;
    }
    if (s.outputUsed < s.outputLength) {
      return 0;
    }
    return 2;
  }
  function huffmanTreeGroupAllocSize(alphabetSizeLimit, n) {
    const maxTableSize = MAX_HUFFMAN_TABLE_SIZE[alphabetSizeLimit + 31 >> 5];
    return n + n * maxTableSize;
  }
  function decodeHuffmanTreeGroup(alphabetSizeMax, alphabetSizeLimit, n, s, group) {
    let next = n;
    for (let i = 0; i < n; ++i) {
      group[i] = next;
      const result = readHuffmanCode(alphabetSizeMax, alphabetSizeLimit, group, i, s);
      if (result < 0) {
        return result;
      }
      next += result;
    }
    return 0;
  }
  function calculateFence(s) {
    let result = s.ringBufferSize;
    if (s.isEager !== 0) {
      result = Math.min(result, s.ringBufferBytesWritten + s.outputLength - s.outputUsed);
    }
    return result;
  }
  function doUseDictionary(s, fence) {
    if (s.distance > 0x7FFFFFFC) {
      return makeError(s, -9);
    }
    const address = s.distance - s.maxDistance - 1 - s.cdTotalSize;
    if (address < 0) {
      const result = initializeCompoundDictionaryCopy(s, -address - 1, s.copyLength);
      if (result < 0) {
        return result;
      }
      s.runningState = 14;
    } else {
      const dictionaryData = data;
      const wordLength = s.copyLength;
      if (wordLength > 31) {
        return makeError(s, -9);
      }
      const shift = sizeBits[wordLength];
      if (shift === 0) {
        return makeError(s, -9);
      }
      let offset = offsets[wordLength];
      const mask = (1 << shift) - 1;
      const wordIdx = address & mask;
      const transformIdx = address >> shift;
      offset += wordIdx * wordLength;
      const transforms = RFC_TRANSFORMS;
      if (transformIdx >= transforms.numTransforms) {
        return makeError(s, -9);
      }
      const len = transformDictionaryWord(s.ringBuffer, s.pos, dictionaryData, offset, wordLength, transforms, transformIdx);
      s.pos += len;
      s.metaBlockLength -= len;
      if (s.pos >= fence) {
        s.nextRunningState = 4;
        s.runningState = 12;
        return 0;
      }
      s.runningState = 4;
    }
    return 0;
  }
  function initializeCompoundDictionary(s) {
    s.cdBlockMap = new Int8Array(256);
    let blockBits = 8;
    while (s.cdTotalSize - 1 >> blockBits !== 0) {
      blockBits++;
    }
    blockBits -= 8;
    s.cdBlockBits = blockBits;
    let cursor = 0;
    let index = 0;
    while (cursor < s.cdTotalSize) {
      while (s.cdChunkOffsets[index + 1] < cursor) {
        index++;
      }
      s.cdBlockMap[cursor >> blockBits] = index;
      cursor += 1 << blockBits;
    }
  }
  function initializeCompoundDictionaryCopy(s, address, length) {
    if (s.cdBlockBits === -1) {
      initializeCompoundDictionary(s);
    }
    let index = s.cdBlockMap[address >> s.cdBlockBits];
    while (address >= s.cdChunkOffsets[index + 1]) {
      index++;
    }
    if (s.cdTotalSize > address + length) {
      return makeError(s, -9);
    }
    s.distRbIdx = s.distRbIdx + 1 & 0x3;
    s.rings[s.distRbIdx] = s.distance;
    s.metaBlockLength -= length;
    s.cdBrIndex = index;
    s.cdBrOffset = address - s.cdChunkOffsets[index];
    s.cdBrLength = length;
    s.cdBrCopied = 0;
    return 0;
  }
  function copyFromCompoundDictionary(s, fence) {
    let pos = s.pos;
    const origPos = pos;
    while (s.cdBrLength !== s.cdBrCopied) {
      const space = fence - pos;
      const chunkLength = s.cdChunkOffsets[s.cdBrIndex + 1] - s.cdChunkOffsets[s.cdBrIndex];
      const remChunkLength = chunkLength - s.cdBrOffset;
      let length = s.cdBrLength - s.cdBrCopied;
      if (length > remChunkLength) {
        length = remChunkLength;
      }
      if (length > space) {
        length = space;
      }
      s.ringBuffer.set(s.cdChunks[s.cdBrIndex].subarray(s.cdBrOffset, s.cdBrOffset + length), pos);
      pos += length;
      s.cdBrOffset += length;
      s.cdBrCopied += length;
      if (length === remChunkLength) {
        s.cdBrIndex++;
        s.cdBrOffset = 0;
      }
      if (pos >= fence) {
        break;
      }
    }
    return pos - origPos;
  }
  function decompress(s) {
    let result;
    if (s.runningState === 0) {
      return makeError(s, -25);
    }
    if (s.runningState < 0) {
      return makeError(s, -28);
    }
    if (s.runningState === 11) {
      return makeError(s, -22);
    }
    if (s.runningState === 1) {
      const windowBits = decodeWindowBits(s);
      if (windowBits === -1) {
        return makeError(s, -11);
      }
      s.maxRingBufferSize = 1 << windowBits;
      s.maxBackwardDistance = s.maxRingBufferSize - 16;
      s.runningState = 2;
    }
    let fence = calculateFence(s);
    let ringBufferMask = s.ringBufferSize - 1;
    let ringBuffer = s.ringBuffer;
    while (s.runningState !== 10) {
      switch (s.runningState) {
        case 2:
          if (s.metaBlockLength < 0) {
            return makeError(s, -10);
          }
          result = readNextMetablockHeader(s);
          if (result < 0) {
            return result;
          }
          fence = calculateFence(s);
          ringBufferMask = s.ringBufferSize - 1;
          ringBuffer = s.ringBuffer;
          continue;
        case 3:
          result = readMetablockHuffmanCodesAndContextMaps(s);
          if (result < 0) {
            return result;
          }
          s.runningState = 4;
          continue;
        case 4:
          if (s.metaBlockLength <= 0) {
            s.runningState = 2;
            continue;
          }
          if (s.halfOffset > 2030) {
            result = readMoreInput(s);
            if (result < 0) {
              return result;
            }
          }
          if (s.commandBlockLength === 0) {
            decodeCommandBlockSwitch(s);
          }
          s.commandBlockLength--;
          if (s.bitOffset >= 16) {
            s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
            s.bitOffset -= 16;
          }
          const cmdCode = readSymbol(s.commandTreeGroup, s.commandTreeIdx, s) << 2;
          const insertAndCopyExtraBits = CMD_LOOKUP[cmdCode];
          const insertLengthOffset = CMD_LOOKUP[cmdCode + 1];
          const copyLengthOffset = CMD_LOOKUP[cmdCode + 2];
          s.distanceCode = CMD_LOOKUP[cmdCode + 3];
          if (s.bitOffset >= 16) {
            s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
            s.bitOffset -= 16;
          }
          const insertLengthExtraBits = insertAndCopyExtraBits & 0xFF;
          s.insertLength = insertLengthOffset + (insertLengthExtraBits <= 16 ? readFewBits(s, insertLengthExtraBits) : readManyBits(s, insertLengthExtraBits));
          if (s.bitOffset >= 16) {
            s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
            s.bitOffset -= 16;
          }
          const copyLengthExtraBits = insertAndCopyExtraBits >> 8;
          s.copyLength = copyLengthOffset + (copyLengthExtraBits <= 16 ? readFewBits(s, copyLengthExtraBits) : readManyBits(s, copyLengthExtraBits));
          s.j = 0;
          s.runningState = 7;
          continue;
        case 7:
          if (s.trivialLiteralContext !== 0) {
            while (s.j < s.insertLength) {
              if (s.halfOffset > 2030) {
                result = readMoreInput(s);
                if (result < 0) {
                  return result;
                }
              }
              if (s.literalBlockLength === 0) {
                decodeLiteralBlockSwitch(s);
              }
              s.literalBlockLength--;
              if (s.bitOffset >= 16) {
                s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
                s.bitOffset -= 16;
              }
              ringBuffer[s.pos] = readSymbol(s.literalTreeGroup, s.literalTreeIdx, s);
              s.pos++;
              s.j++;
              if (s.pos >= fence) {
                s.nextRunningState = 7;
                s.runningState = 12;
                break;
              }
            }
          } else {
            let prevByte1 = ringBuffer[s.pos - 1 & ringBufferMask] & 0xFF;
            let prevByte2 = ringBuffer[s.pos - 2 & ringBufferMask] & 0xFF;
            while (s.j < s.insertLength) {
              if (s.halfOffset > 2030) {
                result = readMoreInput(s);
                if (result < 0) {
                  return result;
                }
              }
              if (s.literalBlockLength === 0) {
                decodeLiteralBlockSwitch(s);
              }
              const literalContext = LOOKUP[s.contextLookupOffset1 + prevByte1] | LOOKUP[s.contextLookupOffset2 + prevByte2];
              const literalTreeIdx = s.contextMap[s.contextMapSlice + literalContext] & 0xFF;
              s.literalBlockLength--;
              prevByte2 = prevByte1;
              if (s.bitOffset >= 16) {
                s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
                s.bitOffset -= 16;
              }
              prevByte1 = readSymbol(s.literalTreeGroup, literalTreeIdx, s);
              ringBuffer[s.pos] = prevByte1;
              s.pos++;
              s.j++;
              if (s.pos >= fence) {
                s.nextRunningState = 7;
                s.runningState = 12;
                break;
              }
            }
          }
          if (s.runningState !== 7) {
            continue;
          }
          s.metaBlockLength -= s.insertLength;
          if (s.metaBlockLength <= 0) {
            s.runningState = 4;
            continue;
          }
          let distanceCode = s.distanceCode;
          if (distanceCode < 0) {
            s.distance = s.rings[s.distRbIdx];
          } else {
            if (s.halfOffset > 2030) {
              result = readMoreInput(s);
              if (result < 0) {
                return result;
              }
            }
            if (s.distanceBlockLength === 0) {
              decodeDistanceBlockSwitch(s);
            }
            s.distanceBlockLength--;
            if (s.bitOffset >= 16) {
              s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
              s.bitOffset -= 16;
            }
            const distTreeIdx = s.distContextMap[s.distContextMapSlice + distanceCode] & 0xFF;
            distanceCode = readSymbol(s.distanceTreeGroup, distTreeIdx, s);
            if (distanceCode < 16) {
              const index = s.distRbIdx + DISTANCE_SHORT_CODE_INDEX_OFFSET[distanceCode] & 0x3;
              s.distance = s.rings[index] + DISTANCE_SHORT_CODE_VALUE_OFFSET[distanceCode];
              if (s.distance < 0) {
                return makeError(s, -12);
              }
            } else {
              const extraBits = s.distExtraBits[distanceCode];
              let bits;
              if (s.bitOffset + extraBits <= 32) {
                bits = readFewBits(s, extraBits);
              } else {
                if (s.bitOffset >= 16) {
                  s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
                  s.bitOffset -= 16;
                }
                bits = extraBits <= 16 ? readFewBits(s, extraBits) : readManyBits(s, extraBits);
              }
              s.distance = s.distOffset[distanceCode] + (bits << s.distancePostfixBits);
            }
          }
          if (s.maxDistance !== s.maxBackwardDistance && s.pos < s.maxBackwardDistance) {
            s.maxDistance = s.pos;
          } else {
            s.maxDistance = s.maxBackwardDistance;
          }
          if (s.distance > s.maxDistance) {
            s.runningState = 9;
            continue;
          }
          if (distanceCode > 0) {
            s.distRbIdx = s.distRbIdx + 1 & 0x3;
            s.rings[s.distRbIdx] = s.distance;
          }
          if (s.copyLength > s.metaBlockLength) {
            return makeError(s, -9);
          }
          s.j = 0;
          s.runningState = 8;
          continue;
        case 8:
          let src = s.pos - s.distance & ringBufferMask;
          let dst = s.pos;
          const copyLength = s.copyLength - s.j;
          const srcEnd = src + copyLength;
          const dstEnd = dst + copyLength;
          if (srcEnd < ringBufferMask && dstEnd < ringBufferMask) {
            if (copyLength < 12 || srcEnd > dst && dstEnd > src) {
              const numQuads = copyLength + 3 >> 2;
              for (let k = 0; k < numQuads; ++k) {
                ringBuffer[dst++] = ringBuffer[src++];
                ringBuffer[dst++] = ringBuffer[src++];
                ringBuffer[dst++] = ringBuffer[src++];
                ringBuffer[dst++] = ringBuffer[src++];
              }
            } else {
              ringBuffer.copyWithin(dst, src, srcEnd);
            }
            s.j += copyLength;
            s.metaBlockLength -= copyLength;
            s.pos += copyLength;
          } else {
            while (s.j < s.copyLength) {
              ringBuffer[s.pos] = ringBuffer[s.pos - s.distance & ringBufferMask];
              s.metaBlockLength--;
              s.pos++;
              s.j++;
              if (s.pos >= fence) {
                s.nextRunningState = 8;
                s.runningState = 12;
                break;
              }
            }
          }
          if (s.runningState === 8) {
            s.runningState = 4;
          }
          continue;
        case 9:
          result = doUseDictionary(s, fence);
          if (result < 0) {
            return result;
          }
          continue;
        case 14:
          s.pos += copyFromCompoundDictionary(s, fence);
          if (s.pos >= fence) {
            s.nextRunningState = 14;
            s.runningState = 12;
            return 2;
          }
          s.runningState = 4;
          continue;
        case 5:
          while (s.metaBlockLength > 0) {
            if (s.halfOffset > 2030) {
              result = readMoreInput(s);
              if (result < 0) {
                return result;
              }
            }
            if (s.bitOffset >= 16) {
              s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
              s.bitOffset -= 16;
            }
            readFewBits(s, 8);
            s.metaBlockLength--;
          }
          s.runningState = 2;
          continue;
        case 6:
          result = copyUncompressedData(s);
          if (result < 0) {
            return result;
          }
          continue;
        case 12:
          s.ringBufferBytesReady = Math.min(s.pos, s.ringBufferSize);
          s.runningState = 13;
          continue;
        case 13:
          result = writeRingBuffer(s);
          if (result !== 0) {
            return result;
          }
          if (s.pos >= s.maxBackwardDistance) {
            s.maxDistance = s.maxBackwardDistance;
          }
          if (s.pos >= s.ringBufferSize) {
            if (s.pos > s.ringBufferSize) {
              ringBuffer.copyWithin(0, s.ringBufferSize, s.pos);
            }
            s.pos = s.pos & ringBufferMask;
            s.ringBufferBytesWritten = 0;
          }
          s.runningState = s.nextRunningState;
          continue;
        default:
          return makeError(s, -28);
      }
    }
    if (s.runningState !== 10) {
      return makeError(s, -29);
    }
    if (s.metaBlockLength < 0) {
      return makeError(s, -10);
    }
    result = jumpToByteBoundary(s);
    if (result !== 0) {
      return result;
    }
    result = checkHealth(s, 1);
    if (result !== 0) {
      return result;
    }
    return 1;
  }
  function Transforms(numTransforms, prefixSuffixLen, prefixSuffixCount) {
    this.numTransforms = 0;
    this.triplets = new Int32Array(0);
    this.prefixSuffixStorage = new Int8Array(0);
    this.prefixSuffixHeads = new Int32Array(0);
    this.params = new Int16Array(0);
    this.numTransforms = numTransforms;
    this.triplets = new Int32Array(numTransforms * 3);
    this.params = new Int16Array(numTransforms);
    this.prefixSuffixStorage = new Int8Array(prefixSuffixLen);
    this.prefixSuffixHeads = new Int32Array(prefixSuffixCount + 1);
  }
  const RFC_TRANSFORMS = new Transforms(121, 167, 50);
  function unpackTransforms(prefixSuffix, prefixSuffixHeads, transforms, prefixSuffixSrc, transformsSrc) {
    const prefixSuffixBytes = toUtf8Runes(prefixSuffixSrc);
    const n = prefixSuffixBytes.length;
    let index = 1;
    let j = 0;
    for (let i = 0; i < n; ++i) {
      const c = prefixSuffixBytes[i];
      if (c === 35) {
        prefixSuffixHeads[index++] = j;
      } else {
        prefixSuffix[j++] = c;
      }
    }
    for (let i = 0; i < 363; ++i) {
      transforms[i] = transformsSrc.charCodeAt(i) - 32;
    }
  }
  unpackTransforms(RFC_TRANSFORMS.prefixSuffixStorage, RFC_TRANSFORMS.prefixSuffixHeads, RFC_TRANSFORMS.triplets, "# #s #, #e #.# the #.com/#\xC2\xA0# of # and # in # to #\"#\">#\n#]# for # a # that #. # with #'# from # by #. The # on # as # is #ing #\n\t#:#ed #(# at #ly #=\"# of the #. This #,# not #er #al #='#ful #ive #less #est #ize #ous #", "     !! ! ,  *!  &!  \" !  ) *   * -  ! # !  #!*!  +  ,$ !  -  %  .  / #   0  1 .  \"   2  3!*   4%  ! # /   5  6  7  8 0  1 &   $   9 +   :  ;  < '  !=  >  ?! 4  @ 4  2  &   A *# (   B  C& ) %  ) !*# *-% A +! *.  D! %'  & E *6  F  G% ! *A *%  H! D  I!+!  J!+   K +- *4! A  L!*4  M  N +6  O!*% +.! K *G  P +%(  ! G *D +D  Q +# *K!*G!+D!+# +G +A +4!+% +K!+4!*D!+K!*K");
  function transformDictionaryWord(dst, dstOffset, src, srcOffset, wordLen, transforms, transformIndex) {
    let offset = dstOffset;
    const triplets = transforms.triplets;
    const prefixSuffixStorage = transforms.prefixSuffixStorage;
    const prefixSuffixHeads = transforms.prefixSuffixHeads;
    const transformOffset = 3 * transformIndex;
    const prefixIdx = triplets[transformOffset];
    const transformType = triplets[transformOffset + 1];
    const suffixIdx = triplets[transformOffset + 2];
    let prefix = prefixSuffixHeads[prefixIdx];
    const prefixEnd = prefixSuffixHeads[prefixIdx + 1];
    let suffix = prefixSuffixHeads[suffixIdx];
    const suffixEnd = prefixSuffixHeads[suffixIdx + 1];
    let omitFirst = transformType - 11;
    let omitLast = transformType;
    if (omitFirst < 1 || omitFirst > 9) {
      omitFirst = 0;
    }
    if (omitLast < 1 || omitLast > 9) {
      omitLast = 0;
    }
    while (prefix !== prefixEnd) {
      dst[offset++] = prefixSuffixStorage[prefix++];
    }
    let len = wordLen;
    if (omitFirst > len) {
      omitFirst = len;
    }
    let dictOffset = srcOffset + omitFirst;
    len -= omitFirst;
    len -= omitLast;
    let i = len;
    while (i > 0) {
      dst[offset++] = src[dictOffset++];
      i--;
    }
    if (transformType === 10 || transformType === 11) {
      let uppercaseOffset = offset - len;
      if (transformType === 10) {
        len = 1;
      }
      while (len > 0) {
        const c0 = dst[uppercaseOffset] & 0xFF;
        if (c0 < 0xC0) {
          if (c0 >= 97 && c0 <= 122) {
            dst[uppercaseOffset] = dst[uppercaseOffset] ^ 32;
          }
          uppercaseOffset += 1;
          len -= 1;
        } else if (c0 < 0xE0) {
          dst[uppercaseOffset + 1] = dst[uppercaseOffset + 1] ^ 32;
          uppercaseOffset += 2;
          len -= 2;
        } else {
          dst[uppercaseOffset + 2] = dst[uppercaseOffset + 2] ^ 5;
          uppercaseOffset += 3;
          len -= 3;
        }
      }
    } else if (transformType === 21 || transformType === 22) {
      let shiftOffset = offset - len;
      const param = transforms.params[transformIndex];
      let scalar = (param & 0x7FFF) + (0x1000000 - (param & 0x8000));
      while (len > 0) {
        let step = 1;
        const c0 = dst[shiftOffset] & 0xFF;
        if (c0 < 0x80) {
          scalar += c0;
          dst[shiftOffset] = scalar & 0x7F;
        } else if (c0 < 0xC0) {} else if (c0 < 0xE0) {
          if (len >= 2) {
            const c1 = dst[shiftOffset + 1];
            scalar += c1 & 0x3F | (c0 & 0x1F) << 6;
            dst[shiftOffset] = 0xC0 | scalar >> 6 & 0x1F;
            dst[shiftOffset + 1] = c1 & 0xC0 | scalar & 0x3F;
            step = 2;
          } else {
            step = len;
          }
        } else if (c0 < 0xF0) {
          if (len >= 3) {
            const c1 = dst[shiftOffset + 1];
            const c2 = dst[shiftOffset + 2];
            scalar += c2 & 0x3F | (c1 & 0x3F) << 6 | (c0 & 0x0F) << 12;
            dst[shiftOffset] = 0xE0 | scalar >> 12 & 0x0F;
            dst[shiftOffset + 1] = c1 & 0xC0 | scalar >> 6 & 0x3F;
            dst[shiftOffset + 2] = c2 & 0xC0 | scalar & 0x3F;
            step = 3;
          } else {
            step = len;
          }
        } else if (c0 < 0xF8) {
          if (len >= 4) {
            const c1 = dst[shiftOffset + 1];
            const c2 = dst[shiftOffset + 2];
            const c3 = dst[shiftOffset + 3];
            scalar += c3 & 0x3F | (c2 & 0x3F) << 6 | (c1 & 0x3F) << 12 | (c0 & 0x07) << 18;
            dst[shiftOffset] = 0xF0 | scalar >> 18 & 0x07;
            dst[shiftOffset + 1] = c1 & 0xC0 | scalar >> 12 & 0x3F;
            dst[shiftOffset + 2] = c2 & 0xC0 | scalar >> 6 & 0x3F;
            dst[shiftOffset + 3] = c3 & 0xC0 | scalar & 0x3F;
            step = 4;
          } else {
            step = len;
          }
        }
        shiftOffset += step;
        len -= step;
        if (transformType === 21) {
          len = 0;
        }
      }
    }
    while (suffix !== suffixEnd) {
      dst[offset++] = prefixSuffixStorage[suffix++];
    }
    return offset - dstOffset;
  }
  function getNextKey(key, len) {
    let step = 1 << len - 1;
    while ((key & step) !== 0) {
      step = step >> 1;
    }
    return (key & step - 1) + step;
  }
  function replicateValue(table, offset, step, end, item) {
    let pos = end;
    while (pos > 0) {
      pos -= step;
      table[offset + pos] = item;
    }
  }
  function nextTableBitSize(count, len, rootBits) {
    let bits = len;
    let left = 1 << bits - rootBits;
    while (bits < 15) {
      left -= count[bits];
      if (left <= 0) {
        break;
      }
      bits++;
      left = left << 1;
    }
    return bits - rootBits;
  }
  function buildHuffmanTable(tableGroup, tableIdx, rootBits, codeLengths, codeLengthsSize) {
    const tableOffset = tableGroup[tableIdx];
    const sorted = new Int32Array(codeLengthsSize);
    const count = new Int32Array(16);
    const offset = new Int32Array(16);
    for (let sym = 0; sym < codeLengthsSize; ++sym) {
      count[codeLengths[sym]]++;
    }
    offset[1] = 0;
    for (let len = 1; len < 15; ++len) {
      offset[len + 1] = offset[len] + count[len];
    }
    for (let sym = 0; sym < codeLengthsSize; ++sym) {
      if (codeLengths[sym] !== 0) {
        sorted[offset[codeLengths[sym]]++] = sym;
      }
    }
    let tableBits = rootBits;
    let tableSize = 1 << tableBits;
    let totalSize = tableSize;
    if (offset[15] === 1) {
      for (let k = 0; k < totalSize; ++k) {
        tableGroup[tableOffset + k] = sorted[0];
      }
      return totalSize;
    }
    let key = 0;
    let symbol = 0;
    let step = 1;
    for (let len = 1; len <= rootBits; ++len) {
      step = step << 1;
      while (count[len] > 0) {
        replicateValue(tableGroup, tableOffset + key, step, tableSize, len << 16 | sorted[symbol++]);
        key = getNextKey(key, len);
        count[len]--;
      }
    }
    const mask = totalSize - 1;
    let low = -1;
    let currentOffset = tableOffset;
    step = 1;
    for (let len = rootBits + 1; len <= 15; ++len) {
      step = step << 1;
      while (count[len] > 0) {
        if ((key & mask) !== low) {
          currentOffset += tableSize;
          tableBits = nextTableBitSize(count, len, rootBits);
          tableSize = 1 << tableBits;
          totalSize += tableSize;
          low = key & mask;
          tableGroup[tableOffset + low] = tableBits + rootBits << 16 | currentOffset - tableOffset - low;
        }
        replicateValue(tableGroup, currentOffset + (key >> rootBits), step, tableSize, len - rootBits << 16 | sorted[symbol++]);
        key = getNextKey(key, len);
        count[len]--;
      }
    }
    return totalSize;
  }
  function readMoreInput(s) {
    if (s.endOfStreamReached !== 0) {
      if (halfAvailable(s) >= -2) {
        return 0;
      }
      return makeError(s, -16);
    }
    const readOffset = s.halfOffset << 1;
    let bytesInBuffer = 4096 - readOffset;
    s.byteBuffer.copyWithin(0, readOffset, 4096);
    s.halfOffset = 0;
    while (bytesInBuffer < 4096) {
      const spaceLeft = 4096 - bytesInBuffer;
      const len = readInput(s, s.byteBuffer, bytesInBuffer, spaceLeft);
      if (len < -1) {
        return len;
      }
      if (len <= 0) {
        s.endOfStreamReached = 1;
        s.tailBytes = bytesInBuffer;
        bytesInBuffer += 1;
        break;
      }
      bytesInBuffer += len;
    }
    bytesToNibbles(s, bytesInBuffer);
    return 0;
  }
  function checkHealth(s, endOfStream) {
    if (s.endOfStreamReached === 0) {
      return 0;
    }
    const byteOffset = (s.halfOffset << 1) + (s.bitOffset + 7 >> 3) - 4;
    if (byteOffset > s.tailBytes) {
      return makeError(s, -13);
    }
    if (endOfStream !== 0 && byteOffset !== s.tailBytes) {
      return makeError(s, -17);
    }
    return 0;
  }
  function readFewBits(s, n) {
    const v = s.accumulator32 >>> s.bitOffset & (1 << n) - 1;
    s.bitOffset += n;
    return v;
  }
  function readManyBits(s, n) {
    const low = readFewBits(s, 16);
    s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
    s.bitOffset -= 16;
    return low | readFewBits(s, n - 16) << 16;
  }
  function initBitReader(s) {
    s.byteBuffer = new Int8Array(4160);
    s.accumulator32 = 0;
    s.shortBuffer = new Int16Array(2080);
    s.bitOffset = 32;
    s.halfOffset = 2048;
    s.endOfStreamReached = 0;
    return prepare(s);
  }
  function prepare(s) {
    if (s.halfOffset > 2030) {
      const result = readMoreInput(s);
      if (result !== 0) {
        return result;
      }
    }
    let health = checkHealth(s, 0);
    if (health !== 0) {
      return health;
    }
    s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
    s.bitOffset -= 16;
    s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
    s.bitOffset -= 16;
    return 0;
  }
  function reload(s) {
    if (s.bitOffset === 32) {
      return prepare(s);
    }
    return 0;
  }
  function jumpToByteBoundary(s) {
    const padding = 32 - s.bitOffset & 7;
    if (padding !== 0) {
      const paddingBits = readFewBits(s, padding);
      if (paddingBits !== 0) {
        return makeError(s, -5);
      }
    }
    return 0;
  }
  function halfAvailable(s) {
    let limit = 2048;
    if (s.endOfStreamReached !== 0) {
      limit = s.tailBytes + 1 >> 1;
    }
    return limit - s.halfOffset;
  }
  function copyRawBytes(s, data, offset, length) {
    let pos = offset;
    let len = length;
    if ((s.bitOffset & 7) !== 0) {
      return makeError(s, -30);
    }
    while (s.bitOffset !== 32 && len !== 0) {
      data[pos++] = s.accumulator32 >>> s.bitOffset;
      s.bitOffset += 8;
      len--;
    }
    if (len === 0) {
      return 0;
    }
    const copyNibbles = Math.min(halfAvailable(s), len >> 1);
    if (copyNibbles > 0) {
      const readOffset = s.halfOffset << 1;
      const delta = copyNibbles << 1;
      data.set(s.byteBuffer.subarray(readOffset, readOffset + delta), pos);
      pos += delta;
      len -= delta;
      s.halfOffset += copyNibbles;
    }
    if (len === 0) {
      return 0;
    }
    if (halfAvailable(s) > 0) {
      if (s.bitOffset >= 16) {
        s.accumulator32 = s.shortBuffer[s.halfOffset++] << 16 | s.accumulator32 >>> 16;
        s.bitOffset -= 16;
      }
      while (len !== 0) {
        data[pos++] = s.accumulator32 >>> s.bitOffset;
        s.bitOffset += 8;
        len--;
      }
      return checkHealth(s, 0);
    }
    while (len > 0) {
      const chunkLen = readInput(s, data, pos, len);
      if (chunkLen < -1) {
        return chunkLen;
      }
      if (chunkLen <= 0) {
        return makeError(s, -16);
      }
      pos += chunkLen;
      len -= chunkLen;
    }
    return 0;
  }
  function bytesToNibbles(s, byteLen) {
    const byteBuffer = s.byteBuffer;
    const halfLen = byteLen >> 1;
    const shortBuffer = s.shortBuffer;
    for (let i = 0; i < halfLen; ++i) {
      shortBuffer[i] = byteBuffer[i * 2] & 0xFF | (byteBuffer[i * 2 + 1] & 0xFF) << 8;
    }
  }
  const LOOKUP = new Int32Array(2048);
  function unpackLookupTable(lookup, utfMap, utfRle) {
    for (let i = 0; i < 256; ++i) {
      lookup[i] = i & 0x3F;
      lookup[512 + i] = i >> 2;
      lookup[1792 + i] = 2 + (i >> 6);
    }
    for (let i = 0; i < 128; ++i) {
      lookup[1024 + i] = 4 * (utfMap.charCodeAt(i) - 32);
    }
    for (let i = 0; i < 64; ++i) {
      lookup[1152 + i] = i & 1;
      lookup[1216 + i] = 2 + (i & 1);
    }
    let offset = 1280;
    for (let k = 0; k < 19; ++k) {
      const value = k & 3;
      const rep = utfRle.charCodeAt(k) - 32;
      for (let i = 0; i < rep; ++i) {
        lookup[offset++] = value;
      }
    }
    for (let i = 0; i < 16; ++i) {
      lookup[1792 + i] = 1;
      lookup[2032 + i] = 6;
    }
    lookup[1792] = 0;
    lookup[2047] = 7;
    for (let i = 0; i < 256; ++i) {
      lookup[1536 + i] = lookup[1792 + i] << 3;
    }
  }
  unpackLookupTable(LOOKUP, "         !!  !                  \"#$##%#$&'##(#)#++++++++++((&*'##,---,---,-----,-----,-----&#'###.///.///./////./////./////&#'# ", "A/*  ':  & : $  \x81 @");
  function State() {
    this.ringBuffer = new Int8Array(0);
    this.contextModes = new Int8Array(0);
    this.contextMap = new Int8Array(0);
    this.distContextMap = new Int8Array(0);
    this.distExtraBits = new Int8Array(0);
    this.output = new Int8Array(0);
    this.byteBuffer = new Int8Array(0);
    this.shortBuffer = new Int16Array(0);
    this.intBuffer = new Int32Array(0);
    this.rings = new Int32Array(0);
    this.blockTrees = new Int32Array(0);
    this.literalTreeGroup = new Int32Array(0);
    this.commandTreeGroup = new Int32Array(0);
    this.distanceTreeGroup = new Int32Array(0);
    this.distOffset = new Int32Array(0);
    this.accumulator64 = 0;
    this.runningState = 0;
    this.nextRunningState = 0;
    this.accumulator32 = 0;
    this.bitOffset = 0;
    this.halfOffset = 0;
    this.tailBytes = 0;
    this.endOfStreamReached = 0;
    this.metaBlockLength = 0;
    this.inputEnd = 0;
    this.isUncompressed = 0;
    this.isMetadata = 0;
    this.literalBlockLength = 0;
    this.numLiteralBlockTypes = 0;
    this.commandBlockLength = 0;
    this.numCommandBlockTypes = 0;
    this.distanceBlockLength = 0;
    this.numDistanceBlockTypes = 0;
    this.pos = 0;
    this.maxDistance = 0;
    this.distRbIdx = 0;
    this.trivialLiteralContext = 0;
    this.literalTreeIdx = 0;
    this.commandTreeIdx = 0;
    this.j = 0;
    this.insertLength = 0;
    this.contextMapSlice = 0;
    this.distContextMapSlice = 0;
    this.contextLookupOffset1 = 0;
    this.contextLookupOffset2 = 0;
    this.distanceCode = 0;
    this.numDirectDistanceCodes = 0;
    this.distancePostfixBits = 0;
    this.distance = 0;
    this.copyLength = 0;
    this.maxBackwardDistance = 0;
    this.maxRingBufferSize = 0;
    this.ringBufferSize = 0;
    this.expectedTotalSize = 0;
    this.outputOffset = 0;
    this.outputLength = 0;
    this.outputUsed = 0;
    this.ringBufferBytesWritten = 0;
    this.ringBufferBytesReady = 0;
    this.isEager = 0;
    this.isLargeWindow = 0;
    this.cdNumChunks = 0;
    this.cdTotalSize = 0;
    this.cdBrIndex = 0;
    this.cdBrOffset = 0;
    this.cdBrLength = 0;
    this.cdBrCopied = 0;
    this.cdChunks = new Array(0);
    this.cdChunkOffsets = new Int32Array(0);
    this.cdBlockBits = 0;
    this.cdBlockMap = new Int8Array(0);
    this.input = new InputStream(new Int8Array(0));
    this.ringBuffer = new Int8Array(0);
    this.rings = new Int32Array(10);
    this.rings[0] = 16;
    this.rings[1] = 15;
    this.rings[2] = 11;
    this.rings[3] = 4;
  }
  let data = new Int8Array(0);
  const offsets = new Int32Array(32);
  const sizeBits = new Int32Array(32);
  function setData(newData, newSizeBits) {
    const dictionaryOffsets = offsets;
    const dictionarySizeBits = sizeBits;
    for (let i = 0; i < newSizeBits.length; ++i) {
      dictionarySizeBits[i] = newSizeBits[i];
    }
    let pos = 0;
    for (let i = 0; i < newSizeBits.length; ++i) {
      dictionaryOffsets[i] = pos;
      const bits = dictionarySizeBits[i];
      if (bits !== 0) {
        pos += i << (bits & 31);
      }
    }
    for (let i = newSizeBits.length; i < 32; ++i) {
      dictionaryOffsets[i] = pos;
    }
    data = newData;
  }
  function unpackDictionaryData(dictionary, data0, data1, skipFlip, sizeBits, sizeBitsData) {
    const dict = toUsAsciiBytes(data0 + data1);
    const skipFlipRunes = toUtf8Runes(skipFlip);
    let offset = 0;
    const n = skipFlipRunes.length >> 1;
    for (let i = 0; i < n; ++i) {
      const skip = skipFlipRunes[2 * i] - 36;
      const flip = skipFlipRunes[2 * i + 1] - 36;
      for (let j = 0; j < skip; ++j) {
        dict[offset] = dict[offset] ^ 3;
        offset++;
      }
      for (let j = 0; j < flip; ++j) {
        dict[offset] = dict[offset] ^ 236;
        offset++;
      }
    }
    for (let i = 0; i < sizeBitsData.length; ++i) {
      sizeBits[i] = sizeBitsData.charCodeAt(i) - 65;
    }
    dictionary.set(dict);
  }
  const dictionaryData = new Int8Array(122784);
  const dictionarySizeBits = new Int32Array(25);
  unpackDictionaryData(dictionaryData, "wjnfgltmojefofewab`h`lgfgbwbpkltlmozpjwf`jwzlsfmivpwojhfeqfftlqhwf{wzfbqlufqalgzolufelqnallhsobzojufojmfkfosklnfpjgfnlqftlqgolmdwkfnujftejmgsbdfgbzpevookfbgwfqnfb`kbqfbeqlnwqvfnbqhbaofvslmkjdkgbwfobmgmftpfufmmf{w`bpfalwkslpwvpfgnbgfkbmgkfqftkbwmbnfOjmhaoldpjyfabpfkfognbhfnbjmvpfq$*#(klogfmgptjwkMftpqfbgtfqfpjdmwbhfkbufdbnfpffm`boosbwktfoosovpnfmvejonsbqwiljmwkjpojpwdllgmffgtbzptfpwilapnjmgboploldlqj`kvpfpobpwwfbnbqnzellghjmdtjoofbpwtbqgafpwejqfSbdfhmltbtbz-smdnlufwkbmolbgdjufpfoemlwfnv`keffgnbmzql`hj`lmlm`follhkjgfgjfgKlnfqvofklpwbib{jmel`ovaobtpofppkboeplnfpv`kylmf233&lmfp`bqfWjnfqb`faovfelvqtffheb`fklsfdbufkbqgolpwtkfmsbqhhfswsbpppkjsqllnKWNOsobmWzsfglmfpbufhffseobdojmhplogejufwllhqbwfwltmivnswkvpgbqh`bqgejofefbqpwbzhjoowkbweboobvwlfufq-`lnwbohpklsulwfgffsnlgfqfpwwvqmalqmabmgefooqlpfvqo+phjmqlof`lnfb`wpbdfpnffwdlog-isdjwfnubqzefowwkfmpfmggqlsUjft`lsz2-3!?,b=pwlsfopfojfpwlvqsb`h-djesbpw`pp<dqbznfbm%dw8qjgfpklwobwfpbjgqlbgubq#effoilkmqj`hslqwebpw$VB.gfbg?,a=sllqajoowzsfV-P-tllgnvpw1s{8JmelqbmhtjgftbmwtbooofbgX3^8sbvotbufpvqf'+$ tbjwnbppbqnpdlfpdbjmobmdsbjg\"..#ol`hvmjwqllwtbohejqntjef{no!plmdwfpw13s{hjmgqltpwlloelmwnbjopbefpwbqnbsp`lqfqbjmeoltabazpsbmpbzp7s{85s{8bqwpellwqfbotjhjkfbwpwfswqjslqd,obhftfbhwlogElqn`bpwebmpabmhufqzqvmpivozwbph2s{8dlbodqftpoltfgdfjg>!pfwp6s{8-ip<73s{je#+pllmpfbwmlmfwvafyfqlpfmwqffgeb`wjmwldjewkbqn2;s{`bnfkjooalogyllnuljgfbpzqjmdejoosfbhjmjw`lpw0s{8ib`hwbdpajwpqloofgjwhmftmfbq?\"..dqltIPLMgvwzMbnfpbofzlv#olwpsbjmibyy`logfzfpejpkttt-qjphwbapsqfu23s{qjpf16s{Aovfgjmd033/abooelqgfbqmtjogal{-ebjqob`hufqpsbjqivmfwf`kje+\"sj`hfujo'+! tbqnolqgglfpsvoo/333jgfbgqbtkvdfpslwevmgavqmkqfe`foohfzpwj`hklvqolppevfo21s{pvjwgfboQPP!bdfgdqfzDFW!fbpfbjnpdjqobjgp;s{8mbuzdqjgwjsp :::tbqpobgz`bqp*8#~sks<kfoowbootklnyk9\t),\x0E\t#233kboo-\t\tB4s{8svpk`kbw3s{8`qft),?,kbpk46s{eobwqbqf#%%#wfoo`bnslmwlobjgnjppphjswfmwejmfnbofdfwpsolw733/\x0E\t\x0E\t`lloeffw-sks?aq=fqj`nlpwdvjgafoogfp`kbjqnbwkbwln,jnd% ;1ov`h`fmw3338wjmzdlmfkwnopfoogqvdEQFFmlgfmj`h<jg>olpfmvooubpwtjmgQPP#tfbqqfozaffmpbnfgvhfmbpb`bsftjpkdvoeW109kjwppolwdbwfhj`haovqwkfz26s{$$*8*8!=npjftjmpajqgplqwafwbpffhW2;9lqgpwqffnboo53s{ebqn\x0ElupalzpX3^-$*8!SLPWafbqhjgp*8~~nbqzwfmg+VH*rvbgyk9\n.pjy....sqls$*8\x0EojewW2:9uj`fbmgzgfaw=QPPsllomf`haoltW259gllqfuboW249ofwpebjolqbosloomlub`lopdfmf#\x0Elxplewqlnfwjooqlpp?k0=slvqebgfsjmh?wq=njmj*\x7F\"+njmfyk9\x04abqpkfbq33*8njoh#..=jqlmeqfggjphtfmwpljosvwp,ip,klozW119JPAMW139bgbnpffp?k1=iplm$/#$`lmwW129#QPPollsbpjbnllm?,s=plvoOJMFelqw`bqwW279?k2=;3s{\"..?:s{8W379njhf975Ymj`fjm`kZlqhqj`fyk9\b$**8svqfnbdfsbqbwlmfalmg904Y\\le\\$^*8333/yk9\x0Bwbmhzbqgaltoavpk965YIbub03s{\t\x7F~\t&@0&907YifeeF[SJ`bpkujpbdloepmltyk9\x05rvfq-`pppj`hnfbwnjm-ajmggfookjqfsj`pqfmw905YKWWS.132elwltloeFMG#{al{967YALGZgj`h8\t~\tf{jw906Yubqpafbw$~*8gjfw:::8bmmf~~?,Xj^-Obmdhn.^tjqfwlzpbggppfbobof{8\t\n~f`klmjmf-lqd336*wlmziftppbmgofdpqlle333*#133tjmfdfbqgldpallwdbqz`vwpwzofwfnswjlm-{no`l`hdbmd'+$-63s{Sk-Gnjp`bobmolbmgfphnjofqzbmvmj{gjp`*8~\tgvpw`ojs*-\t\t43s{.133GUGp4^=?wbsfgfnlj((*tbdffvqlskjolswpklofEBRpbpjm.15WobapsfwpVQO#avoh`llh8~\x0E\tKFBGX3^*baaqivbm+2:;ofpkwtjm?,j=plmzdvzpev`hsjsf\x7F.\t\"331*mgltX2^8X^8\tOld#pbow\x0E\t\n\nabmdwqjnabwk*x\x0E\t33s{\t~*8hl9\0effpbg=\x0Ep9,,#X^8wloosovd+*x\tx\x0E\t#-ip$133sgvboalbw-ISD*8\t~rvlw*8\t\t$*8\t\x0E\t~\x0E1327132613251324132;132:13131312131113101317131613151314131;131:130313021301130013071306130513041320132113221323133:133;133413351336133713301331133213332:::2::;2::42::52::62::72::02::12::22::32:;:2:;;2:;42:;52:;62:;72:;02:;12:;22:;32:4:2:4;2:442:452:462:472:402:412:422:432:5:2:5;2:542:552:562:572:502:512:522:532:6:2:6;2:642:652:662:672:602:612:622:632333231720:73333::::`lnln/Mpfpwffpwbsfqlwlglkb`f`bgbb/]lajfmg/Abbp/Aujgb`bpllwqlelqlplollwqb`vbogjilpjgldqbmwjslwfnbgfafbodlrv/Efpwlmbgbwqfpsl`l`bpbabilwlgbpjmlbdvbsvfpvmlpbmwfgj`fovjpfoobnbzlylmbbnlqsjpllaqb`oj`foolgjlpklqb`bpj<[<\\<Q<\\<R<P=l<\\=l=o=n<\\<Q<Y<S<R<R=n<T<[<Q<R<X<R=n<R<Z<Y<R<Q<T=i<q<\\<Y<Y<]=g<P=g<~=g=m<R<^=g<^<R<q<R<R<]<s<R<W<T<Q<T<L<H<q<Y<p=g=n=g<r<Q<T<P<X<\\<{<\\<x<\\<q=o<r<]=n<Y<t<[<Y<U<Q=o<P<P<N=g=o<Z5m5f4O5j5i4K5i4U5o5h4O5d4]4C5f4K5m5e5k5d5h5i5h5o4K5d5h5k4D4_4K5h4I5j5k5f4O5f5n4C5k5h4G5i4D5k5h5d5h5f4D5h4K5f4D5o4X5f4K5i4O5i5j4F4D5f5h5j4A4D5k5i5i4X5d4Xejqpwujgflojdkwtlqognfgjbtkjwf`olpfaob`hqjdkwpnbooallhpsob`fnvpj`ejfoglqgfqsljmwubovfofufowbaofalbqgklvpfdqlvstlqhpzfbqppwbwfwlgbztbwfqpwbqwpwzofgfbwksltfqsklmfmjdkwfqqlqjmsvwbalvwwfqnpwjwofwllopfufmwol`bowjnfpobqdftlqgpdbnfppklqwpsb`fel`vp`ofbqnlgfoaol`hdvjgfqbgjlpkbqftlnfmbdbjmnlmfzjnbdfmbnfpzlvmdojmfpobwfq`lolqdqffmeqlmw%bns8tbw`kelq`fsqj`fqvofpafdjmbewfqujpjwjppvfbqfbpafoltjmgf{wlwboklvqpobafosqjmwsqfppavjowojmhppsffgpwvgzwqbgfelvmgpfmpfvmgfqpkltmelqnpqbmdfbggfgpwjoonlufgwbhfmbalufeobpkej{fglewfmlwkfqujftp`kf`hofdboqjufqjwfnprvj`hpkbsfkvnbmf{jpwdljmdnlujfwkjqgabpj`sfb`fpwbdftjgwkoldjmjgfbptqlwfsbdfpvpfqpgqjufpwlqfaqfbhplvwkulj`fpjwfpnlmwktkfqfavjogtkj`kfbqwkelqvnwkqffpslqwsbqwz@oj`holtfqojufp`obppobzfqfmwqzpwlqzvpbdfplvmg`lvqwzlvq#ajqwkslsvswzsfpbssozJnbdfafjmdvssfqmlwfpfufqzpkltpnfbmpf{wqbnbw`kwqb`hhmltmfbqozafdbmpvsfqsbsfqmlqwkofbqmdjufmmbnfgfmgfgWfqnpsbqwpDqlvsaqbmgvpjmdtlnbmebopfqfbgzbvgjlwbhfptkjof-`ln,ojufg`bpfpgbjoz`kjogdqfbwivgdfwklpfvmjwpmfufqaqlbg`lbpw`lufqbssofejofp`z`ofp`fmfsobmp`oj`htqjwfrvffmsjf`ffnbjoeqbnflogfqsklwlojnjw`b`kf`jujop`boffmwfqwkfnfwkfqfwlv`kalvmgqlzbobphfgtklofpjm`fpwl`h#mbnfebjwkkfbqwfnswzleefqp`lsfltmfgnjdkwboavnwkjmhaollgbqqbznbilqwqvpw`bmlmvmjlm`lvmwubojgpwlmfPwzofOldjmkbsszl``vqofew9eqfpkrvjwfejonpdqbgfmffgpvqabmejdkwabpjpklufqbvwl8qlvwf-kwnonj{fgejmboZlvq#pojgfwlsj`aqltmbolmfgqbtmpsojwqfb`kQjdkwgbwfpnbq`krvlwfdllgpOjmhpglvawbpzm`wkvnaboolt`kjfezlvwkmlufo23s{8pfqufvmwjokbmgp@kf`hPsb`frvfqzibnfpfrvbowtj`f3/333Pwbqwsbmfoplmdpqlvmgfjdkwpkjewtlqwkslpwpofbgptffhpbuljgwkfpfnjofpsobmfpnbqwboskbsobmwnbqhpqbwfpsobzp`objnpbofpwf{wppwbqptqlmd?,k0=wkjmd-lqd,nvowjkfbqgSltfqpwbmgwlhfmplojg+wkjpaqjmdpkjsppwbeewqjfg`boopevoozeb`wpbdfmwWkjp#,,..=bgnjmfdzswFufmw26s{8Fnbjowqvf!`qlpppsfmwaoldpal{!=mlwfgofbuf`kjmbpjyfpdvfpw?,k7=qlalwkfbuzwqvf/pfufmdqbmg`qjnfpjdmpbtbqfgbm`fskbpf=?\"..fm\\VP% 0:8133s{\\mbnfobwjmfmilzbib{-bwjlmpnjwkV-P-#klogpsfwfqjmgjbmbu!=`kbjmp`lqf`lnfpgljmdsqjlqPkbqf2::3pqlnbmojpwpibsbmeboopwqjboltmfqbdqff?,k1=bavpfbofqwlsfqb!.,,T`bqgpkjoopwfbnpSklwlwqvwk`ofbm-sks<pbjmwnfwboolvjpnfbmwsqlleaqjfeqlt!=dfmqfwqv`hollhpUbovfEqbnf-mfw,..=\t?wqz#x\tubq#nbhfp`lpwpsobjmbgvowrvfpwwqbjmobalqkfosp`bvpfnbdj`nlwlqwkfjq163s{ofbpwpwfsp@lvmw`lvogdobpppjgfpevmgpklwfobtbqgnlvwknlufpsbqjpdjufpgvw`kwf{bpeqvjwmvoo/\x7F\x7FX^8wls!=\t?\"..SLPW!l`fbm?aq,=eollqpsfbhgfswk#pjyfabmhp`bw`k`kbqw13s{8bojdmgfboptlvog63s{8vqo>!sbqhpnlvpfNlpw#---?,bnlmdaqbjmalgz#mlmf8abpfg`bqqzgqbewqfefqsbdf\\klnf-nfwfqgfobzgqfbnsqlufiljmw?,wq=gqvdp?\"..#bsqjojgfboboofmf{b`welqwk`lgfpoldj`Ujft#pffnpaobmhslqwp#+133pbufg\\ojmhdlbopdqbmwdqffhklnfpqjmdpqbwfg03s{8tklpfsbqpf+*8!#Aol`hojmv{ilmfpsj{fo$*8!=*8je+.ofewgbujgklqpfEl`vpqbjpfal{fpWqb`hfnfmw?,fn=abq!=-pq`>wltfqbow>!`baofkfmqz17s{8pfwvsjwbozpkbqsnjmlqwbpwftbmwpwkjp-qfpfwtkffodjqop,`pp,233&8`ovappwveeajaofulwfp#2333hlqfb~*8\x0E\tabmgprvfvf>#x~8;3s{8`hjmdx\x0E\t\n\nbkfbg`ol`hjqjpkojhf#qbwjlpwbwpElqn!zbkll*X3^8Balvwejmgp?,k2=gfavdwbphpVQO#>`foop~*+*821s{8sqjnfwfoopwvqmp3{533-isd!psbjmafb`kwb{fpnj`qlbmdfo..=?,djewppwfuf.ojmhalgz-~*8\t\nnlvmw#+2::EBR?,qldfqeqbmh@obpp1;s{8effgp?k2=?p`lwwwfpwp11s{8gqjmh*#\x7F\x7F#oftjppkboo 30:8#elq#olufgtbpwf33s{8ib9\x0Fnpjnlm?elmwqfsoznffwpvmwfq`kfbswjdkwAqbmg*#\">#gqfpp`ojspqllnplmhfznlajonbjm-Mbnf#sobwfevmmzwqffp`ln,!2-isdtnlgfsbqbnPWBQWofew#jggfm/#132*8\t~\telqn-ujqvp`kbjqwqbmptlqpwSbdfpjwjlmsbw`k?\"..\tl.`b`ejqnpwlvqp/333#bpjbmj((*xbglaf$*X3^jg>23alwk8nfmv#-1-nj-smd!hfujm`lb`k@kjogaqv`f1-isdVQO*(-isd\x7Fpvjwfpoj`fkbqqz213!#ptffwwq=\x0E\tmbnf>gjfdlsbdf#ptjpp..=\t\t eee8!=Old-`ln!wqfbwpkffw*#%%#27s{8poffsmwfmwejofgib9\x0Fojg>!`Mbnf!tlqpfpklwp.al{.gfowb\t%ow8afbqp97;Y?gbwb.qvqbo?,b=#psfmgabhfqpklsp>#!!8sks!=`wjlm20s{8aqjbmkfoolpjyf>l>&1E#iljmnbzaf?jnd#jnd!=/#eipjnd!#!*X3^NWlsAWzsf!mftozGbmph`yf`kwqbjohmltp?,k6=ebr!=yk.`m23*8\t.2!*8wzsf>aovfpwqvozgbujp-ip$8=\x0E\t?\"pwffo#zlv#k1=\x0E\telqn#ifpvp233&#nfmv-\x0E\t\n\x0E\ttbofpqjphpvnfmwggjmda.ojhwfb`kdje!#ufdbpgbmphffpwjpkrjspvlnjplaqfgfpgffmwqfwlglpsvfgfb/]lpfpw/Mwjfmfkbpwblwqlpsbqwfglmgfmvfulkb`fqelqnbnjpnlnfilqnvmglbrv/Ag/Abpp/_olbzvgbef`kbwlgbpwbmwlnfmlpgbwlplwqbppjwjlnv`klbklqbovdbqnbzlqfpwlpklqbpwfmfqbmwfpelwlpfpwbpsb/Apmvfubpbovgelqlpnfgjlrvjfmnfpfpslgfq`kjofpfq/Muf`fpgf`jqilp/Efpwbqufmwbdqvslkf`klfoolpwfmdlbnjdl`lpbpmjufodfmwfnjpnbbjqfpivojlwfnbpkb`jbebulqivmjlojaqfsvmwlavfmlbvwlqbaqjoavfmbwf{wlnbqylpbafqojpwbovfdl`/_nlfmfqlivfdlsfq/Vkbafqfpwlzmvm`bnvifqubolqevfqbojaqldvpwbjdvboulwlp`bplpdv/Absvfglplnlpbujplvpwfggfafmml`kfavp`bebowbfvqlppfqjfgj`kl`vqpl`obuf`bpbpof/_msobylobqdllaqbpujpwbbslzlivmwlwqbwbujpwl`qfbq`bnslkfnlp`jm`l`bqdlsjplplqgfmkb`fm/Mqfbgjp`lsfgql`fq`bsvfgbsbsfonfmlq/Vwjo`obqlilqdf`boofslmfqwbqgfmbgjfnbq`bpjdvffoobppjdol`l`kfnlwlpnbgqf`obpfqfpwlmj/]lrvfgbsbpbqabm`lkjilpujbifsbaol/Epwfujfmfqfjmlgfibqelmgl`bmbomlqwfofwqb`bvpbwlnbqnbmlpovmfpbvwlpujoobufmglsfpbqwjslpwfmdbnbq`loofubsbgqfvmjglubnlpylmbpbnalpabmgbnbqjbbavplnv`kbpvajqqjlibujujqdqbgl`kj`bboo/Ailufmgj`kbfpwbmwbofppbojqpvfolsfplpejmfpoobnbavp`l/Epwboofdbmfdqlsobybkvnlqsbdbqivmwbglaofjpobpalopbab/]lkbaobov`kb/mqfbgj`fmivdbqmlwbpuboofboo/M`bqdbglolqbabilfpw/Edvpwlnfmwfnbqjlejqnb`lpwlej`kbsobwbkldbqbqwfpofzfpbrvfonvpflabpfpsl`lpnjwbg`jfol`kj`lnjfgldbmbqpbmwlfwbsbgfafpsobzbqfgfppjfwf`lqwf`lqfbgvgbpgfpflujfilgfpfbbdvbp%rvlw8glnbjm`lnnlmpwbwvpfufmwpnbpwfqpzpwfnb`wjlmabmmfqqfnlufp`qloovsgbwfdolabonfgjvnejowfqmvnafq`kbmdfqfpvowsvaoj`p`qffm`kllpfmlqnbowqbufojppvfpplvq`fwbqdfwpsqjmdnlgvofnlajofptjw`ksklwlpalqgfqqfdjlmjwpfoepl`jbob`wjuf`lovnmqf`lqgelooltwjwof=fjwkfqofmdwkebnjozeqjfmgobzlvwbvwklq`qfbwfqfujftpvnnfqpfqufqsobzfgsobzfqf{sbmgsloj`zelqnbwglvaofsljmwppfqjfpsfqplmojujmdgfpjdmnlmwkpelq`fpvmjrvftfjdkwsflsoffmfqdzmbwvqfpfbq`kejdvqfkbujmd`vpwlnleepfwofwwfqtjmgltpvanjwqfmgfqdqlvspvsolbgkfbowknfwklgujgflpp`klloevwvqfpkbgltgfabwfubovfpLaif`wlwkfqpqjdkwpofbdvf`kqlnfpjnsofmlwj`fpkbqfgfmgjmdpfbplmqfslqwlmojmfprvbqfavwwlmjnbdfpfmbaofnlujmdobwfpwtjmwfqEqbm`fsfqjlgpwqlmdqfsfbwOlmglmgfwbjoelqnfggfnbmgpf`vqfsbppfgwlddofsob`fpgfuj`fpwbwj``jwjfppwqfbnzfooltbwwb`hpwqffweojdkwkjggfmjmel!=lsfmfgvpfevouboofz`bvpfpofbgfqpf`qfwpf`lmggbnbdfpslqwpf{`fswqbwjmdpjdmfgwkjmdpfeef`wejfogppwbwfpleej`fujpvbofgjwlqulovnfQfslqwnvpfvnnlujfpsbqfmwb``fppnlpwoznlwkfq!#jg>!nbqhfwdqlvmg`kbm`fpvqufzafelqfpznalonlnfmwpsff`knlwjlmjmpjgfnbwwfq@fmwfqlaif`wf{jpwpnjggofFvqlsfdqltwkofdb`znbmmfqfmlvdk`bqffqbmptfqlqjdjmslqwbo`ojfmwpfof`wqbmgln`olpfgwlsj`p`lnjmdebwkfqlswjlmpjnsozqbjpfgfp`bsf`klpfm`kvq`kgfejmfqfbplm`lqmfqlvwsvwnfnlqzjeqbnfsloj`fnlgfopMvnafqgvqjmdleefqppwzofphjoofgojpwfg`boofgpjoufqnbqdjmgfofwfafwwfqaqltpfojnjwpDolabopjmdoftjgdfw`fmwfqavgdfwmltqbs`qfgjw`objnpfmdjmfpbefwz`klj`fpsjqjw.pwzofpsqfbgnbhjmdmffgfgqvppjbsofbpff{wfmwP`qjswaqlhfmbooltp`kbqdfgjujgfeb`wlqnfnafq.abpfgwkflqz`lmejdbqlvmgtlqhfgkfosfg@kvq`kjnsb`wpklvogbotbzpoldl!#alwwlnojpw!=*xubq#sqfej{lqbmdfKfbgfq-svpk+`lvsofdbqgfmaqjgdfobvm`kQfujftwbhjmdujpjlmojwwofgbwjmdAvwwlmafbvwzwkfnfpelqdlwPfbq`kbm`klqbonlpwolbgfg@kbmdfqfwvqmpwqjmdqfolbgNlajofjm`lnfpvssozPlvq`flqgfqpujftfg%maps8`lvqpfBalvw#jpobmg?kwno#`llhjfmbnf>!bnbylmnlgfqmbguj`fjm?,b=9#Wkf#gjboldklvpfpAFDJM#Nf{j`lpwbqwp`fmwqfkfjdkwbggjmdJpobmgbppfwpFnsjqfP`kllofeelqwgjqf`wmfbqoznbmvboPfof`w-\t\tLmfiljmfgnfmv!=SkjojsbtbqgpkbmgofjnslqwLeej`fqfdbqgphjoopmbwjlmPslqwpgfdqfftffhoz#+f-d-afkjmggl`wlqolddfgvmjwfg?,a=?,afdjmpsobmwpbppjpwbqwjpwjppvfg033s{\x7F`bmbgbbdfm`zp`kfnfqfnbjmAqbyjopbnsofoldl!=afzlmg.p`bofb``fswpfqufgnbqjmfEllwfq`bnfqb?,k2=\t\\elqn!ofbufppwqfpp!#,=\x0E\t-dje!#lmolbgolbgfqL{elqgpjpwfqpvqujuojpwfmefnbofGfpjdmpjyf>!bssfbowf{w!=ofufopwkbmhpkjdkfqelq`fgbmjnbobmzlmfBeqj`bbdqffgqf`fmwSflsof?aq#,=tlmgfqsqj`fpwvqmfg\x7F\x7F#x~8nbjm!=jmojmfpvmgbztqbs!=ebjofg`fmpvpnjmvwfafb`lmrvlwfp263s{\x7Ffpwbwfqfnlwffnbjo!ojmhfgqjdkw8pjdmboelqnbo2-kwnopjdmvssqjm`feolbw9-smd!#elqvn-B``fppsbsfqpplvmgpf{wfmgKfjdkwpojgfqVWE.;!%bns8#Afelqf-#TjwkpwvgjlltmfqpnbmbdfsqlejwiRvfqzbmmvbosbqbnpalvdkwebnlvpdlldofolmdfqj((*#xjpqbfopbzjmdgf`jgfklnf!=kfbgfqfmpvqfaqbm`ksjf`fpaol`h8pwbwfgwls!=?qb`jmdqfpjyf..%dw8sb`jwzpf{vboavqfbv-isd!#23/333lawbjmwjwofpbnlvmw/#Jm`-`lnfgznfmv!#ozqj`pwlgbz-jmgffg`lvmwz\\oldl-EbnjozollhfgNbqhfwopf#jeSobzfqwvqhfz*8ubq#elqfpwdjujmdfqqlqpGlnbjm~fopfxjmpfqwAold?,ellwfqoldjm-ebpwfqbdfmwp?algz#23s{#3sqbdnbeqjgbzivmjlqgloobqsob`fg`lufqpsovdjm6/333#sbdf!=alpwlm-wfpw+bubwbqwfpwfg\\`lvmwelqvnpp`kfnbjmgf{/ejoofgpkbqfpqfbgfqbofqw+bssfbqPvanjwojmf!=algz!=\t)#WkfWklvdkpffjmdifqpfzMftp?,ufqjezf{sfqwjmivqztjgwk>@llhjfPWBQW#b`qlpp\\jnbdfwkqfbgmbwjufsl`hfwal{!=\tPzpwfn#Gbujg`bm`fqwbaofpsqlufgBsqjo#qfboozgqjufqjwfn!=nlqf!=albqgp`lolqp`bnsvpejqpw#\x7F\x7F#X^8nfgjb-dvjwbqejmjpktjgwk9pkltfgLwkfq#-sks!#bppvnfobzfqptjoplmpwlqfpqfojfeptfgfm@vpwlnfbpjoz#zlvq#Pwqjmd\t\tTkjowbzolq`ofbq9qfplqweqfm`kwklvdk!*#(#!?algz=avzjmdaqbmgpNfnafqmbnf!=lssjmdpf`wlq6s{8!=upsb`fslpwfqnbilq#`leeffnbqwjmnbwvqfkbssfm?,mbu=hbmpbpojmh!=Jnbdfp>ebopftkjof#kpsb`f3%bns8#\t\tJm##sltfqSlophj.`lolqilqgbmAlwwlnPwbqw#.`lvmw1-kwnomftp!=32-isdLmojmf.qjdkwnjoofqpfmjlqJPAM#33/333#dvjgfpubovf*f`wjlmqfsbjq-{no!##qjdkwp-kwno.aol`hqfdF{s9klufqtjwkjmujqdjmsklmfp?,wq=\x0Evpjmd#\t\nubq#=$*8\t\n?,wg=\t?,wq=\tabkbpbaqbpjodbofdlnbdzbqslophjpqsphj4]4C5d\bTA\nzk\x0BBl\bQ\x7F\x0BUm\x05Gx\bSM\nmC\bTA\twQ\nd}\bW@\bTl\bTF\ti@\tcT\x0BBM\x0B|j\x04BV\tqw\tcC\bWI\npa\tfM\n{Z\x05{X\bTF\bVV\bVK\t\x7Fm\x04kF\t[]\bPm\bTv\nsI\x0Bpg\t[I\bQp\x04mx\x0B_W\n^M\npe\x0BQ}\x0BGu\nel\npe\x04Ch\x04BV\bTA\tSo\nzk\x0BGL\x0BxD\nd[\x05Jz\x05MY\bQp\x04li\nfl\npC\x05{B\x05Nt\x0BwT\ti_\bTg\x04QQ\n|p\x0BXN\bQS\x0BxD\x04QC\bWZ\tpD\x0BVS\bTW\x05Nt\x04Yh\nzu\x04Kj\x05N}\twr\tHa\n_D\tj`\x0BQ}\x0BWp\nxZ\x04{c\tji\tBU\nbD\x04a|\tTn\tpV\nZd\nmC\x0BEV\x05{X\tc}\tTo\bWl\bUd\tIQ\tcg\x0Bxs\nXW\twR\x0Bek\tc}\t]y\tJn\nrp\neg\npV\nz\\\x05{W\npl\nz\\\nzU\tPc\t`{\bV@\nc|\bRw\ti_\bVb\nwX\tHv\x04Su\bTF\x0B_W\x0BWs\x0BsI\x05m\x7F\nTT\ndc\tUS\t}f\tiZ\bWz\tc}\x04MD\tBe\tiD\x0B@@\bTl\bPv\t}t\x04Sw\x04M`\x0BnU\tkW\x0Bed\nqo\x0BxY\tA|\bTz\x0By`\x04BR\x04BM\tia\x04XU\nyu\x04n^\tfL\tiI\nXW\tfD\bWz\bW@\tyj\t\x7Fm\tav\tBN\x0Bb\\\tpD\bTf\nY[\tJn\bQy\t[^\x0BWc\x0Byu\x04Dl\x04CJ\x0BWj\x0BHR\t`V\x0BuW\tQy\np@\x0BGu\x05pl\x04Jm\bW[\nLP\nxC\n`m\twQ\x05ui\x05\x7FR\nbI\twQ\tBZ\tWV\x04BR\npg\tcg\x05ti\x04CW\n_y\tRg\bQa\x0BQB\x0BWc\nYb\x05le\ngE\x04Su\nL[\tQ\x7F\tea\tdj\x0B]W\nb~\x04M`\twL\bTV\bVH\nt\x7F\npl\t|b\x05s_\bU|\bTa\x04oQ\x05lv\x04Sk\x04M`\bTv\x0BK}\nfl\tcC\x04oQ\x04BR\tHk\t|d\bQp\tHK\tBZ\x0BHR\bPv\x0BLx\x0BEZ\bT\x7F\bTv\tiD\x05oD\x05MU\x0BwB\x04Su\x05k`\x04St\ntC\tPl\tKg\noi\tjY\x0BxY\x04h}\nzk\bWZ\t\x7Fm\x0Be`\tTB\tfE\nzk\t`z\x04Yh\nV|\tHK\tAJ\tAJ\bUL\tp\\\tql\nYc\x04Kd\nfy\x04Yh\t[I\x0BDg\x04Jm\n]n\nlb\bUd\n{Z\tlu\tfs\x04oQ\bTW\x04Jm\x0BwB\tea\x04Yh\x04BC\tsb\tTn\nzU\n_y\x0BxY\tQ]\ngw\x04mt\tO\\\ntb\bWW\bQy\tmI\tV[\ny\\\naB\x0BRb\twQ\n]Q\x04QJ\bWg\x0BWa\bQj\ntC\bVH\nYm\x0Bxs\bVK\nel\bWI\x0BxY\x04Cq\ntR\x0BHV\bTl\bVw\tay\bQa\bVV\t}t\tdj\nr|\tp\\\twR\n{i\nTT\t[I\ti[\tAJ\x0Bxs\x0B_W\td{\x0BQ}\tcg\tTz\tA|\tCj\x0BLm\x05N}\x05m\x7F\nbK\tdZ\tp\\\t`V\tsV\np@\tiD\twQ\x0BQ}\bTf\x05ka\x04Jm\x0B@@\bV`\tzp\n@N\x04Sw\tiI\tcg\noi\x04Su\bVw\x04lo\x04Cy\tc}\x0Bb\\\tsU\x04BA\bWI\bTf\nxS\tVp\nd|\bTV\x0BbC\tNo\x05Ju\nTC\t|`\n{Z\tD]\bU|\tc}\x05lm\bTl\tBv\tPl\tc}\bQp\t\x7Fm\nLk\tkj\n@N\x04Sb\x04KO\tj_\tp\\\nzU\bTl\bTg\bWI\tcf\x04XO\bWW\ndz\x04li\tBN\nd[\bWO\x04MD\x0BKC\tdj\tI_\bVV\ny\\\x0BLm\x05xl\txB\tkV\x0Bb\\\x0BJW\x0BVS\tVx\x0BxD\td{\x04MD\bTa\t|`\x0BPz\x04R}\x0BWs\x04BM\nsI\x04CN\bTa\x04Jm\npe\ti_\npV\nrh\tRd\tHv\n~A\nxR\x0BWh\x0BWk\nxS\x0BAz\x0BwX\nbI\x04oQ\tfw\nqI\nV|\nun\x05z\x7F\x0Bpg\td\\\x0BoA\x05{D\ti_\x05xB\bT\x7F\t`V\x05qr\tTT\x04g]\x04CA\x0BuR\tVJ\tT`\npw\x0BRb\tI_\nCx\x04Ro\x0BsI\x04Cj\x04Kh\tBv\tWV\x04BB\x05oD\x05{D\nhc\x04Km\x0B^R\tQE\n{I\np@\nc|\x05Gt\tc}\x04Dl\nzU\x05qN\tsV\x05k}\tHh\x0B|j\nqo\x05u|\tQ]\x0Bek\x05\x7FZ\x04M`\x04St\npe\tdj\bVG\x0BeE\t\x7Fm\x0BWc\x04|I\n[W\tfL\bT\x7F\tBZ\x04Su\x0BKa\x04Cq\x05Nt\x04Y[\nqI\bTv\tfM\ti@\t}f\x04B\\\tQy\x0BBl\bWg\x04XD\x05kc\x0Bx[\bVV\tQ]\t\x7Fa\tPy\x0BxD\nfI\t}f\x05oD\tdj\tSG\x05ls\t~D\x04CN\n{Z\t\\v\n_D\nhc\x0Bx_\x04C[\tAJ\nLM\tVx\x04CI\tbj\tc^\tcF\ntC\x04Sx\twr\x04XA\bU\\\t|a\x0BK\\\bTV\bVj\nd|\tfs\x04CX\ntb\bRw\tVx\tAE\tA|\bT\x7F\x05Nt\x0BDg\tVc\bTl\x04d@\npo\t\x7FM\tcF\npe\tiZ\tBo\bSq\nfH\x04l`\bTx\bWf\tHE\x0BF{\tcO\tfD\nlm\x0BfZ\nlm\x0BeU\tdG\x04BH\bTV\tSi\x05MW\nwX\nz\\\t\\c\x04CX\nd}\tl}\bQp\bTV\tF~\bQ\x7F\t`i\ng@\x05nO\bUd\bTl\nL[\twQ\tji\ntC\t|J\nLU\naB\x0BxY\x04Kj\tAJ\x05uN\ti[\npe\x04Sk\x0BDg\x0Bx]\bVb\bVV\nea\tkV\nqI\bTa\x04Sk\nAO\tpD\ntb\nts\nyi\bVg\ti_\x0B_W\nLk\x05Nt\tyj\tfM\x04R\x7F\tiI\bTl\x0BwX\tsV\x0BMl\nyu\tAJ\bVj\x04KO\tWV\x0BA}\x0BW\x7F\nrp\tiD\x0B|o\x05lv\x0BsI\x04BM\td~\tCU\bVb\x04eV\npC\x0BwT\tj`\tc}\x0Bxs\x0Bps\x0Bvh\tWV\x0BGg\x0BAe\x0BVK\x0B]W\trg\x0BWc\x05F`\tBr\x0Bb\\\tdZ\bQp\nqI\x04kF\nLk\x0BAR\bWI\bTg\tbs\tdw\n{L\n_y\tiZ\bTA\tlg\bVV\bTl\tdk\n`k\ta{\ti_\x05{A\x05wj\twN\x0B@@\bTe\ti_\n_D\twL\nAH\x0BiK\x0Bek\n[]\tp_\tyj\bTv\tUS\t[r\n{I\nps\x05Gt\x0BVK\npl\x04S}\x0BWP\t|d\x04MD\x0BHV\bT\x7F\x04R}\x04M`\bTV\bVH\x05lv\x04Ch\bW[\x04Ke\tR{\x0B^R\tab\tBZ\tVA\tB`\nd|\nhs\x04Ke\tBe\x04Oi\tR{\td\\\x05nB\bWZ\tdZ\tVJ\x05Os\t\x7Fm\x04uQ\x0BhZ\x04Q@\x04QQ\nfI\bW[\x04B\\\x04li\nzU\nMd\x04M`\nxS\bVV\n\\}\x0BxD\t\x7Fm\bTp\x04IS\nc|\tkV\x05i~\tV{\x0BhZ\t|b\bWt\n@R\x0BoA\x0BnU\bWI\tea\tB`\tiD\tc}\tTz\x04BR\x0BQB\x05Nj\tCP\t[I\bTv\t`W\x05uN\x0Bpg\x0Bpg\x0BWc\tiT\tbs\twL\tU_\tc\\\t|h\x0BKa\tNr\tfL\nq|\nzu\nz\\\tNr\bUg\t|b\x04m`\bTv\nyd\nrp\bWf\tUX\x04BV\nzk\nd}\twQ\t}f\x04Ce\x0Bed\bTW\bSB\nxU\tcn\bTb\ne\x7F\ta\\\tSG\bU|\npV\nN\\\x04Kn\x0BnU\tAt\tpD\x0B^R\x0BIr\x04b[\tR{\tdE\x0BxD\x0BWK\x0BWA\bQL\bW@\x04Su\bUd\nDM\tPc\x04CA\x04Dl\x04oQ\tHs\x05wi\x04ub\n\x7Fa\bQp\x05Ob\nLP\bTl\x04Y[\x0BK}\tAJ\bQ\x7F\x04n^\x0BsA\bSM\nqM\bWZ\n^W\x0Bz{\x04S|\tfD\bVK\bTv\bPv\x04BB\tCP\x04dF\tid\x0Bxs\x04mx\x0Bws\tcC\ntC\tyc\x05M`\x0BW\x7F\nrh\bQp\x0BxD\x04\\o\nsI\x04_k\nzu\x04kF\tfD\x04Xs\x04XO\tjp\bTv\x04BS\x05{B\tBr\nzQ\nbI\tc{\x04BD\x04BV\x05nO\bTF\tca\x05Jd\tfL\tPV\tI_\nlK\x04`o\twX\npa\tgu\bP}\x05{^\bWf\n{I\tBN\npa\x04Kl\x0Bpg\tcn\tfL\x0Bvh\x04Cq\bTl\x0BnU\bSq\x04Cm\twR\bUJ\npe\nyd\nYg\x04Cy\x0BKW\tfD\nea\x04oQ\tj_\tBv\x04nM\x0BID\bTa\nzA\x05pl\n]n\bTa\tR{\tfr\n_y\bUg\x05{X\x05kk\x0BxD\x04|I\x05xl\nfy\x04Ce\x0BwB\nLk\x0Bd]\noi\n}h\tQ]\npe\bVw\x04Hk\x04OQ\nzk\tAJ\npV\bPv\ny\\\tA{\x04Oi\bSB\x04XA\x0BeE\tjp\nq}\tiD\x05qN\x0B^R\t\x7Fm\tiZ\tBr\bVg\noi\n\\X\tU_\nc|\x0BHV\bTf\tTn\x04\\N\x04\\N\nuB\x05lv\nyu\tTd\bTf\bPL\x0B]W\tdG\nA`\nw^\ngI\npe\tdw\nz\\\x05ia\bWZ\tcF\x04Jm\n{Z\bWO\x04_k\x04Df\x04RR\td\\\bVV\x0Bxs\x04BN\x05ti\x04lm\tTd\t]y\x0BHV\tSo\x0B|j\x04XX\tA|\x0BZ^\x0BGu\bTW\x05M`\x04kF\x0BhZ\x0BVK\tdG\x0BBl\tay\nxU\x05qE\x05nO\bVw\nqI\x04CX\ne\x7F\tPl\bWO\x0BLm\tdL\x05uH\x04Cm\tdT\x04fn\x0BwB\x05ka\x0BnU\n@M\nyT\tHv\t\\}\x04Kh\td~\x04Yh\x05k}\neR\td\\\bWI\t|b\tHK\tiD\bTW\x05MY\npl\bQ_\twr\x0BAx\tHE\bTg\bSq\x05vp\x0Bb\\\bWO\nOl\nsI\nfy\x0BID\t\\c\n{Z\n^~\npe\nAO\tTT\x0Bxv\x04k_\bWO\x0B|j\x0BwB\tQy\ti@\tPl\tHa\tdZ\x05k}\x04ra\tUT\x0BJc\x0Bed\np@\tQN\nd|\tkj\tHk\x04M`\noi\twr\td\\\nlq\no_\nlb\nL[\tac\x04BB\x04BH\x04Cm\npl\tIQ\bVK\x0Bxs\n`e\x0BiK\npa\x04Oi\tUS\bTp\tfD\nPG\x05kk\x04XA\nz\\\neg\x0BWh\twR\x05qN\nqS\tcn\x04lo\nxS\n^W\tBU\nt\x7F\tHE\tp\\\tfF\tfw\bVV\bW@\tak\x0BVK\x05ls\tVJ\bVV\x0BeE\x04\\o\nyX\nYm\x04M`\x05lL\nd|\nzk\tA{\x05sE\twQ\x04XT\nt\x7F\tPl\t]y\x0BwT\x05{p\x04MD\x0Bb\\\tQ]\x04Kj\tJn\nAH\x0BRb\tBU\tHK\t\\c\nfI\x05m\x7F\nqM\n@R\tSo\noi\x04BT\tHv\n_y\x04Kh\tBZ\t]i\bUJ\tV{\x04Sr\nbI\x0BGg\ta_\bTR\nfI\nfl\t[K\tII\x04S|\x0BuW\tiI\bWI\nqI\x0B|j\x04BV\bVg\bWZ\x04kF\x0Bx]\bTA\tab\tfr\ti@\tJd\tJd\x0Bps\nAO\bTa\x05xu\tiD\nzk\t|d\t|`\bW[\tlP\tdG\bVV\x0Bw}\x0BqO\ti[\bQ\x7F\bTz\x0BVF\twN\x05ts\tdw\bTv\neS\ngi\tNr\x05yS\npe\bVV\bSq\n`m\tyj\tBZ\x0BWX\bSB\tc\\\nUR\t[J\tc_\x04nM\bWQ\x0BAx\nMd\tBr\x05ui\x0BxY\bSM\x0BWc\x0B|j\x0Bxs\t}Q\tBO\bPL\bWW\tfM\nAO\tPc\x0BeU\x04e^\bTg\nqI\tac\bPv\tcF\x04oQ\tQ\x7F\x0BhZ\x05ka\nz\\\tiK\tBU\n`k\tCP\x04S|\x04M`\n{I\tS{\x04_O\tBZ\x04Zi\x04Sk\tps\tp\\\nYu\n]s\nxC\bWt\nbD\tkV\x0BGu\x05yS\nqA\t[r\neK\x04M`\tdZ\x05lL\bUg\bTl\nbD\tUS\x0Bb\\\tpV\ncc\x04S\\\tct\t`z\bPL\x0BWs\nA`\neg\bSq\x05uE\x04CR\x0BDg\t`W\x0Bz{\x0BWc\x04Sk\x04Sk\tbW\bUg\tea\nxZ\tiI\tUX\tVJ\nqn\tS{\x0BRb\bTQ\npl\x05Gt\x0BuW\x05uj\npF\nqI\tfL\t[I\tia\x04XO\nyu\x0BDg\x0Bed\tq{\x04VG\bQ\x7F\x05ka\tVj\tkV\txB\nd|\np@\tQN\tPc\tps\x04]j\tkV\toU\bTp\nzU\x05nB\x0BB]\ta{\bV@\n]n\x04m`\tcz\tR{\x04m`\bQa\x0BwT\bSM\x05MY\x05qN\tdj\x05~s\x0BQ}\x05MY\x0BMB\tBv\twR\bRg\x0BQ}\tql\x0BKC\nrm\x05xu\x04CC\x0BwB\x0Bvh\tBq\x04Xq\npV\ti_\x05Ob\x05uE\nbd\nqo\x0B{i\nC~\tBL\x0BeE\x05uH\bVj\x04Ey\x04Gz\x0BzR\x0B{i\tcf\n{Z\n]n\x04XA\x0BGu\x0BnU\thS\x0BGI\nCc\tHE\bTA\tHB\x04BH\x04Cj\nCc\bTF\tHE\nXI\tA{\bQ\x7F\tc\\\x0BmO\x0BWX\nfH\np@\x05MY\bTF\nlK\tBt\nzU\tTT\x04Km\x0BwT\npV\ndt\x0ByI\tVx\tQ\x7F\tRg\tTd\nzU\bRS\nLM\twA\x04nM\tTn\ndS\t]g\nLc\x0BwB\t}t\t[I\tCP\x04kX\x0BFm\x0BhZ\x05m\x7F\ti[\np@\x0BQ}\x0BW\x7F\t|d\nMO\nMd\tf_\tfD\tcJ\tHz\x0BRb\tio\tPy\x04Y[\nxU\tct\x0B@@\tww\bPv\x04BM\x04FF\ntb\x05v|\x0BKm\tBq\tBq\x04Kh\x04`o\nZd\x04XU\ti]\t|`\tSt\x04B\\\bQ\x7F\x0B_W\tTJ\nqI\t|a\tA{\x0BuP\x04MD\tPl\nxR\tfL\x0Bws\tc{\td\\\bV`\neg\tHK\x05kc\nd|\bVV\ny\\\x05kc\ti]\bVG\t`V\tss\tI_\tAE\tbs\tdu\nel\tpD\x0BW\x7F\nqs\x05lv\bSM\x04Zi\x0BVK\x05ia\x0BQB\tQ\x7F\n{Z\bPt\x0BKl\nlK\nhs\ndS\bVK\x05mf\nd^\tkV\tcO\nc|\bVH\t\\]\bTv\bSq\tmI\x0BDg\tVJ\tcn\ny\\\bVg\bTv\nyX\bTF\t]]\bTp\noi\nhs\x0BeU\nBf\tdj\x05Mr\n|p\t\\g\t]r\bVb\x05{D\nd[\x04XN\tfM\tO\\\x05s_\tcf\tiZ\x04XN\x0BWc\tqv\n`m\tU^\x05oD\nd|\x0BGg\tdE\x0Bwf\x04lo\x04u}\nd|\x05oQ\t`i\x04Oi\x0BxD\ndZ\nCx\x04Yw\nzk\ntb\ngw\tyj\tB`\nyX\x0Bps\ntC\x0BpP\x0Bqw\bPu\bPX\tDm\npw\x05Nj\tss\taG\x0Bxs\bPt\noL\x04Gz\tOk\ti@\ti]\x04eC\tIQ\tii\tdj\x0B@J\t|d\x05uh\bWZ\x0BeU\x0BnU\bTa\tcC\x04g]\nzk\x04Yh\bVK\nLU\np@\ntb\ntR\tCj\x0BNP\ti@\bP{\n\\}\n{c\nwX\tfL\bVG\tc{\t|`\tAJ\t|C\tfD\x05ln\t|d\tbs\nqI\x05{B\x0BAx\np@\nzk\x0BRb\x05Os\x0BWS\x04e^\x0BD_\tBv\x0BWd\bVb\x0Bxs\x0BeE\bRw\n]n\n|p\x0Bg|\tfw\x05kc\bTI\x05ka\n\\T\x04Sp\tju\x0Bps\npe\x05u|\x0BGr\bVe\tCU\x04]M\x04XU\x0BxD\bTa\tIQ\x0BWq\tCU\tam\tdj\bSo\x04Sw\x0BnU\x04Ch\tQ]\x05s_\bPt\tfS\bTa\t\\}\n@O\x04Yc\tUZ\bTx\npe\x0BnU\nzU\t|}\tiD\nz\\\bSM\x0BxD\x04BR\nzQ\tQN\x04]M\x04Yh\nLP\x0BFm\x0BLX\x05vc\x0Bql\x05ka\tHK\bVb\ntC\nCy\bTv\nuV\x04oQ\t`z\t[I\tB`\x0BRb\tyj\tsb\x0BWs\bTl\tkV\x0Bed\ne\x7F\x05lL\x0BxN\t\x7Fm\nJn\tjY\x0BxD\bVb\bSq\x0Byu\twL\x0BXL\bTA\tpg\tAt\tnD\x04XX\twR\npl\nhw\x05yS\nps\tcO\bW[\x0B|j\x04XN\tsV\tp\\\tBe\nb~\nAJ\n]e\x05k`\x05qN\tdw\tWV\tHE\x0BEV\x05Jz\tid\tB`\tzh\x05E]\tfD\bTg\x05qN\bTa\tja\x04Cv\bSM\nhc\bUe\x05t_\tie\x04g]\twQ\nPn\bVB\tjw\bVg\x0BbE\tBZ\x0BRH\bP{\tjp\n\\}\ta_\tcC\t|a\x0BD]\tBZ\ti[\tfD\x0BxW\no_\td\\\n_D\ntb\t\\c\tAJ\nlK\x04oQ\x04lo\x0BLx\x0BM@\bWZ\x04Kn\x0Bpg\nTi\nIv\n|r\x0B@}\x05Jz\x05Lm\x05Wh\x05k}\x05ln\x0BxD\n]s\x04gc\x0Bps\tBr\bTW\x0BBM\x05tZ\nBY\x04DW\tjf\x0BSW\x04C}\nqo\tdE\tmv\tIQ\bPP\bUb\x05lv\x04BC\nzQ\t[I\x0Bgl\nig\bUs\x04BT\x0BbC\bSq\tsU\tiW\nJn\tSY\tHK\trg\npV\x0BID\x0B|j\x04KO\t`S\t|a`vbmglfmujbqnbgqjgavp`bqjmj`jlwjfnslslqrvf`vfmwbfpwbglsvfgfmivfdlp`lmwqbfpw/Mmmlnaqfwjfmfmsfqejonbmfqbbnjdlp`jvgbg`fmwqlbvmrvfsvfgfpgfmwqlsqjnfqsqf`jlpfd/Vmavfmlpuloufqsvmwlppfnbmbkba/Abbdlpwlmvfulpvmjglp`bqolpfrvjslmj/]lpnv`klpbodvmb`lqqfljnbdfmsbqwjqbqqjabnbq/Abklnaqffnsoflufqgbg`bnajlnv`kbpevfqlmsbpbglo/Amfbsbqf`fmvfubp`vqplpfpwbabrvjfqlojaqlp`vbmwlb``fplnjdvfoubqjlp`vbwqlwjfmfpdqvslppfq/Mmfvqlsbnfgjlpeqfmwfb`fq`bgfn/Mplefqwb`l`kfpnlgfoljwbojbofwqbpbod/Vm`lnsqb`vbofpf{jpwf`vfqslpjfmglsqfmpboofdbqujbifpgjmfqlnvq`jbslgq/Msvfpwlgjbqjlsvfaolrvjfqfnbmvfosqlsjl`qjpjp`jfqwlpfdvqlnvfqwfevfmwf`fqqbqdqbmgffef`wlsbqwfpnfgjgbsqlsjbleqf`fwjfqqbf.nbjoubqjbpelqnbpevwvqllaifwlpfdvjqqjfpdlmlqnbpnjpnlp/Vmj`l`bnjmlpjwjlpqby/_mgfajglsqvfabwlofglwfm/Abifp/Vpfpsfql`l`jmblqjdfmwjfmgb`jfmwl`/Mgjykbaobqpfq/Abobwjmbevfqybfpwjoldvfqqbfmwqbq/E{jwlo/_sfybdfmgbu/Agflfujwbqsbdjmbnfwqlpibujfqsbgqfpe/M`jo`bafyb/Mqfbppbojgbfmu/Alibs/_mbavplpajfmfpwf{wlpoofubqsvfgbmevfqwf`ln/Vm`obpfpkvnbmlwfmjglajoablvmjgbgfpw/Mpfgjwbq`qfbgl<X<W=c=k=n<R<V<\\<V<T<W<T=a=n<R<^=m<Y<Y<_<R<S=l<T=n<\\<V<Y=e<Y=o<Z<Y<v<\\<V<]<Y<[<]=g<W<R<Q<T<~=m<Y<S<R<X<A=n<R=n<R<P=k<Y<P<Q<Y=n<W<Y=n=l<\\<[<R<Q<\\<_<X<Y<P<Q<Y<x<W=c<s=l<T<Q<\\=m<Q<T=i=n<Y<P<V=n<R<_<R<X<^<R=n=n<\\<P<M<D<|<P<\\=c<K=n<R<^<\\=m<^<\\<P<Y<P=o<N<\\<V<X<^<\\<Q<\\<P=a=n<T=a=n=o<~<\\<P=n<Y=i<S=l<R=n=o=n<Q<\\<X<X<Q=c<~<R=n=n=l<T<Q<Y<U<~<\\=m<Q<T<P=m<\\<P=n<R=n=l=o<]<r<Q<T<P<T=l<Q<Y<Y<r<r<r<W<T=j=a=n<\\<r<Q<\\<Q<Y<P<X<R<P<P<R<U<X<^<Y<R<Q<R=m=o<X\fHy\fIk\fHU\fId\fHy\fIl\fHT\fIk\fHy\fHR\fHy\fIg\fHx\fH\\\fHF\fH\\\fHD\fIk\fHc\fHy\fHy\fHS\fHA\fIl\fHk\fHT\fHy\fH\\\fHH\fIg\fHU\fIg\fHj\fHF\fHU\fIl\fHC\fHU\fHC\fHR\fHH\fHy\fHI\fHRibdqbm\fHj\fHp\fHp\fIg\fHi\fH@\fHJ\fIg\fH{\fHd\fHp\fHR\fH{\fHc\fHU\fHB\fHk\fHD\fHY\fHU\fHC\fIk\fHI\fIk\fHI\fIl\fHt\fH\\\fHp\fH@\fHJ\fIl\fHy\fHd\fHp\fIl\fHY\fIk\fHD\fHd\fHD\fHc\fHU\fH\\\fHe\fHT\fHB\fIk\fHy\fHB\fHY\fIg\fH^\fIk\fHT\fH@\fHB\fHd\fHJ\fIk\fH\x7F\fH\\\fHj\fHB\fH@\fHT\fHA\fH\\\fH@\fHD\fHv\fH^\fHB\fHD\fHj\fH{\fHT\fIl\fH^\fIl4U5h5e4I5h5e5k4\\4K4N4B4]4U4C4C4K5h5e5k4\\5k4Y5d4]4V5f4]5o4K5j5d5h4K4D5f5j4U4]4Z4\\5h5o5k5j4K5f5d5i5n4K5h4U5h5f4K5j4K5h5o5j4A4F5e5n4D5h5d4A4E4K4B4]5m5n4[4U4D4C4]5o5j4I4\\4K5o5i4K4K4A4C4I5h4K5m5f5k4D4U4Z5o5f5m4D4A4G5d5i5j5d5k5d4O5j4K4@4C4K5h5k4K4_5h5i4U5j4C5h5f4_4U4D4]4Y5h5e5i5j4\\4D5k4K4O5j5k5i4G5h5o5j4F4K5h4K4A5f4G5i4Y4]4X4]4A4A5d5h5d5m5f4K4\\4K5h5o5h5i4]4E4K5j4F4K5h5m4O4D5d4B4K4Y4O5j4F4K5j5k4K5h5f4U4Z5d5d5n4C4K4D5j4B5f4]4D5j4F5h5o5i4X4K4M5d5k5f4K4D5d5n4Y4Y5d5i4K4]5n5i4O4A4C5j4A5j4U4C5i4]4O5f4K4A4E5o4F4D4C5d5j5f4@4D5i5j5k4F4A4F4@5k4E4_5j4E5f4F5i5o4]4E4V4^4E5j5m4_4D5f4F5h5h5k5h5j4K4F5h5o5n5h4D5h5i4K4U5j5k4O5d5h4X5f4M5j5d4]4O5i4K5m5f5o4D5o5h4\\4K4F4]4F4D4D4O5j5k5i4_4K5j5o4D5f4U5m5n4C4A4_5j5h5k5i4X4U4]4O5k5h4X5k4]5n4[4]4[5h4Dsqlejofpfquj`fgfebvowkjnpfoegfwbjop`lmwfmwpvsslqwpwbqwfgnfppbdfpv``fppebpkjlm?wjwof=`lvmwqzb``lvmw`qfbwfgpwlqjfpqfpvowpqvmmjmdsql`fpptqjwjmdlaif`wpujpjaoftfo`lnfbqwj`ofvmhmltmmfwtlqh`lnsbmzgzmbnj`aqltpfqsqjub`zsqlaofnPfquj`fqfpsf`wgjpsobzqfrvfpwqfpfquftfapjwfkjpwlqzeqjfmgplswjlmptlqhjmdufqpjlmnjoojlm`kbmmfotjmglt-bggqfppujpjwfgtfbwkfq`lqqf`wsqlgv`wfgjqf`welqtbqgzlv#`bmqfnlufgpvaif`w`lmwqlobq`kjuf`vqqfmwqfbgjmdojaqbqzojnjwfgnbmbdfqevqwkfqpvnnbqznb`kjmfnjmvwfpsqjubwf`lmwf{wsqldqbnpl`jfwzmvnafqptqjwwfmfmbaofgwqjddfqplvq`fpolbgjmdfofnfmwsbqwmfqejmboozsfqef`wnfbmjmdpzpwfnphffsjmd`vowvqf%rvlw8/ilvqmbosqlif`wpvqeb`fp%rvlw8f{sjqfpqfujftpabobm`fFmdojpk@lmwfmwwkqlvdkSofbpf#lsjmjlm`lmwb`wbufqbdfsqjnbqzujoobdfPsbmjpkdboofqzgf`ojmfnffwjmdnjppjlmslsvobqrvbojwznfbpvqfdfmfqbopsf`jfppfppjlmpf`wjlmtqjwfqp`lvmwfqjmjwjboqfslqwpejdvqfpnfnafqpklogjmdgjpsvwffbqojfqf{sqfppgjdjwbosj`wvqfBmlwkfqnbqqjfgwqbeej`ofbgjmd`kbmdfg`fmwqbouj`wlqzjnbdfp,qfbplmppwvgjfpefbwvqfojpwjmdnvpw#afp`kllopUfqpjlmvpvboozfsjplgfsobzjmddqltjmdlaujlvplufqobzsqfpfmwb`wjlmp?,vo=\x0E\ttqbssfqboqfbgz`fqwbjmqfbojwzpwlqbdfbmlwkfqgfphwlsleefqfgsbwwfqmvmvpvboGjdjwbo`bsjwboTfapjwfebjovqf`lmmf`wqfgv`fgBmgqljggf`bgfpqfdvobq#%bns8#bmjnbopqfofbpfBvwlnbwdfwwjmdnfwklgpmlwkjmdSlsvobq`bswjlmofwwfqp`bswvqfp`jfm`foj`fmpf`kbmdfpFmdobmg>2%bns8Kjpwlqz#>#mft#@fmwqbovsgbwfgPsf`jboMfwtlqhqfrvjqf`lnnfmwtbqmjmd@loofdfwlloabqqfnbjmpaf`bvpffof`wfgGfvwp`kejmbm`ftlqhfqprvj`hozafwtffmf{b`wozpfwwjmdgjpfbpfPl`jfwztfbslmpf{kjajw%ow8\"..@lmwqlo`obppfp`lufqfglvwojmfbwwb`hpgfuj`fp+tjmgltsvqslpfwjwof>!Nlajof#hjoojmdpkltjmdJwbojbmgqlssfgkfbujozfeef`wp.2$^*8\t`lmejqn@vqqfmwbgubm`fpkbqjmdlsfmjmdgqbtjmdajoojlmlqgfqfgDfqnbmzqfobwfg?,elqn=jm`ovgftkfwkfqgfejmfgP`jfm`f`bwboldBqwj`ofavwwlmpobqdfpwvmjelqnilvqmfzpjgfabq@kj`bdlklojgbzDfmfqbosbppbdf/%rvlw8bmjnbwfeffojmdbqqjufgsbppjmdmbwvqboqlvdkoz-\t\tWkf#avw#mlwgfmpjwzAqjwbjm@kjmfpfob`h#lewqjavwfJqfobmg!#gbwb.eb`wlqpqf`fjufwkbw#jpOjaqbqzkvpabmgjm#eb`wbeebjqp@kbqofpqbgj`boaqlvdkwejmgjmdobmgjmd9obmd>!qfwvqm#ofbgfqpsobmmfgsqfnjvnsb`hbdfBnfqj`bFgjwjlm^%rvlw8Nfppbdfmffg#wlubovf>!`lnsof{ollhjmdpwbwjlmafojfufpnboofq.nlajofqf`lqgptbmw#wlhjmg#leEjqfel{zlv#bqfpjnjobqpwvgjfgnb{jnvnkfbgjmdqbsjgoz`ojnbwfhjmdglnfnfqdfgbnlvmwpelvmgfgsjlmffqelqnvobgzmbpwzklt#wl#Pvsslqwqfufmvff`lmlnzQfpvowpaqlwkfqplogjfqobqdfoz`boojmd-%rvlw8B``lvmwFgtbqg#pfdnfmwQlafqw#feelqwpSb`jej`ofbqmfgvs#tjwkkfjdkw9tf#kbufBmdfofpmbwjlmp\\pfbq`kbssojfgb`rvjqfnbppjufdqbmwfg9#ebopfwqfbwfgajddfpwafmfejwgqjujmdPwvgjfpnjmjnvnsfqkbspnlqmjmdpfoojmdjp#vpfgqfufqpfubqjbmw#qlof>!njppjmdb`kjfufsqlnlwfpwvgfmwplnflmff{wqfnfqfpwlqfalwwln9fuloufgboo#wkfpjwfnbsfmdojpktbz#wl##Bvdvpwpznalop@lnsbmznbwwfqpnvpj`bobdbjmpwpfqujmd~*+*8\x0E\tsbznfmwwqlvaof`lm`fsw`lnsbqfsbqfmwpsobzfqpqfdjlmpnlmjwlq#$$Wkf#tjmmjmdf{solqfbgbswfgDboofqzsqlgv`fbajojwzfmkbm`f`bqffqp*-#Wkf#`loof`wPfbq`k#bm`jfmwf{jpwfgellwfq#kbmgofqsqjmwfg`lmplofFbpwfqmf{slqwptjmgltp@kbmmfojoofdbomfvwqbopvddfpw\\kfbgfqpjdmjmd-kwno!=pfwwofgtfpwfqm`bvpjmd.tfahjw`objnfgIvpwj`f`kbswfquj`wjnpWklnbp#nlyjoobsqlnjpfsbqwjfpfgjwjlmlvwpjgf9ebopf/kvmgqfgLoznsj`\\avwwlmbvwklqpqfb`kfg`kqlmj`gfnbmgppf`lmgpsqlwf`wbglswfgsqfsbqfmfjwkfqdqfbwozdqfbwfqlufqboojnsqluf`lnnbmgpsf`jbopfbq`k-tlqpkjsevmgjmdwklvdkwkjdkfpwjmpwfbgvwjojwzrvbqwfq@vowvqfwfpwjmd`ofbqozf{slpfgAqltpfqojafqbo~#`bw`kSqlif`wf{bnsofkjgf+*8EolqjgbbmptfqpbooltfgFnsfqlqgfefmpfpfqjlvpeqffglnPfufqbo.avwwlmEvqwkfqlvw#le#\">#mvoowqbjmfgGfmnbqhuljg+3*,boo-ipsqfufmwQfrvfpwPwfskfm\t\tTkfm#lapfquf?,k1=\x0E\tNlgfqm#sqlujgf!#bow>!alqgfqp-\t\tElq#\t\tNbmz#bqwjpwpsltfqfgsfqelqnej`wjlmwzsf#lenfgj`bowj`hfwplsslpfg@lvm`jotjwmfppivpwj`fDflqdf#Afodjvn---?,b=wtjwwfqmlwbaoztbjwjmdtbqebqf#Lwkfq#qbmhjmdskqbpfpnfmwjlmpvqujufp`klobq?,s=\x0E\t#@lvmwqzjdmlqfgolpp#leivpw#bpDflqdjbpwqbmdf?kfbg=?pwlssfg2$^*8\x0E\tjpobmgpmlwbaofalqgfq9ojpw#le`bqqjfg233/333?,k0=\t#pfufqboaf`lnfppfof`w#tfggjmd33-kwnonlmbq`klee#wkfwfb`kfqkjdkoz#ajloldzojef#lelq#fufmqjpf#le%qbrvl8sovplmfkvmwjmd+wklvdkGlvdobpiljmjmd`jq`ofpElq#wkfBm`jfmwUjfwmbnufkj`ofpv`k#bp`qzpwboubovf#>Tjmgltpfmilzfgb#pnboobppvnfg?b#jg>!elqfjdm#Boo#qjklt#wkfGjpsobzqfwjqfgkltfufqkjggfm8abwwofppffhjmd`bajmfwtbp#mlwollh#bw`lmgv`wdfw#wkfIbmvbqzkbssfmpwvqmjmdb9klufqLmojmf#Eqfm`k#ob`hjmdwzsj`bof{wqb`wfmfnjfpfufm#jedfmfqbwgf`jgfgbqf#mlw,pfbq`kafojfep.jnbdf9ol`bwfgpwbwj`-oldjm!=`lmufqwujlofmwfmwfqfgejqpw!=`jq`vjwEjmobmg`kfnjpwpkf#tbp23s{8!=bp#pv`kgjujgfg?,psbm=tjoo#afojmf#leb#dqfbwnzpwfqz,jmgf{-eboojmdgvf#wl#qbjotbz`loofdfnlmpwfqgfp`fmwjw#tjwkmv`ofbqIftjpk#sqlwfpwAqjwjpkeoltfqpsqfgj`wqfelqnpavwwlm#tkl#tbpof`wvqfjmpwbmwpvj`jgfdfmfqj`sfqjlgpnbqhfwpPl`jbo#ejpkjmd`lnajmfdqbskj`tjmmfqp?aq#,=?az#wkf#MbwvqboSqjub`z`llhjfplvw`lnfqfploufPtfgjpkaqjfeozSfqpjbmpl#nv`k@fmwvqzgfsj`wp`lovnmpklvpjmdp`qjswpmf{w#wlafbqjmdnbssjmdqfujpfgiRvfqz+.tjgwk9wjwof!=wllowjsPf`wjlmgfpjdmpWvqhjpkzlvmdfq-nbw`k+~*+*8\t\tavqmjmdlsfqbwfgfdqffpplvq`f>Qj`kbqg`olpfozsobpwj`fmwqjfp?,wq=\x0E\t`lolq9 vo#jg>!slppfppqloojmdskzpj`pebjojmdf{f`vwf`lmwfpwojmh#wlGfebvow?aq#,=\t9#wqvf/`kbqwfqwlvqjpn`obppj`sql`ffgf{sobjm?,k2=\x0E\tlmojmf-<{no#ufkfosjmdgjbnlmgvpf#wkfbjqojmffmg#..=*-bwwq+qfbgfqpklpwjmd eeeeeeqfbojyfUjm`fmwpjdmbop#pq`>!,Sqlgv`wgfpsjwfgjufqpfwfoojmdSvaoj`#kfog#jmIlpfsk#wkfbwqfbeef`wp?pwzof=b#obqdfglfpm$wobwfq/#Fofnfmwebuj`lm`qfbwlqKvmdbqzBjqslqwpff#wkfpl#wkbwNj`kbfoPzpwfnpSqldqbnp/#bmg##tjgwk>f%rvlw8wqbgjmdofew!=\tsfqplmpDlogfm#Beebjqpdqbnnbqelqnjmdgfpwqlzjgfb#le`bpf#lelogfpw#wkjp#jp-pq`#>#`bqwllmqfdjpwq@lnnlmpNvpojnpTkbw#jpjm#nbmznbqhjmdqfufbopJmgffg/frvbooz,pklt\\blvwgllqfp`bsf+Bvpwqjbdfmfwj`pzpwfn/Jm#wkf#pjwwjmdKf#boplJpobmgpB`bgfnz\t\n\n?\"..Gbmjfo#ajmgjmdaol`h!=jnslpfgvwjojyfBaqbkbn+f{`fswxtjgwk9svwwjmd*-kwno+\x7F\x7F#X^8\tGBWBX#)hjw`kfmnlvmwfgb`wvbo#gjbof`wnbjmoz#\\aobmh$jmpwboof{sfqwpje+wzsfJw#bopl%`lsz8#!=Wfqnpalqm#jmLswjlmpfbpwfqmwbohjmd`lm`fqmdbjmfg#lmdljmdivpwjez`qjwj`peb`wlqzjwp#ltmbppbvowjmujwfgobpwjmdkjp#ltmkqfe>!,!#qfo>!gfufols`lm`fqwgjbdqbngloobqp`ovpwfqsks<jg>bo`lklo*8~*+*8vpjmd#b=?psbm=ufppfopqfujuboBggqfppbnbwfvqbmgqljgboofdfgjoomfpptbohjmd`fmwfqprvbojeznbw`kfpvmjejfgf{wjm`wGfefmpfgjfg#jm\t\n?\"..#`vpwlnpojmhjmdOjwwof#Allh#lefufmjmdnjm-ip<bqf#wkfhlmwbhwwlgbz$p-kwno!#wbqdfw>tfbqjmdBoo#Qjd8\t~*+*8qbjpjmd#Bopl/#`qv`jbobalvw!=gf`obqf..=\t?p`ejqfel{bp#nv`kbssojfpjmgf{/#p/#avw#wzsf#>#\t\x0E\t?\"..wltbqgpQf`lqgpSqjubwfElqfjdmSqfnjfq`klj`fpUjqwvboqfwvqmp@lnnfmwSltfqfgjmojmf8slufqwz`kbnafqOjujmd#ulovnfpBmwklmzoldjm!#QfobwfgF`lmlnzqfb`kfp`vwwjmddqbujwzojef#jm@kbswfq.pkbgltMlwbaof?,wg=\x0E\t#qfwvqmpwbgjvntjgdfwpubqzjmdwqbufopkfog#aztkl#bqftlqh#jmeb`vowzbmdvobqtkl#kbgbjqslqwwltm#le\t\tPlnf#$`oj`h$`kbqdfphfztlqgjw#tjoo`jwz#le+wkjp*8Bmgqft#vmjrvf#`kf`hfglq#nlqf033s{8#qfwvqm8qpjlm>!sovdjmptjwkjm#kfqpfoePwbwjlmEfgfqboufmwvqfsvaojpkpfmw#wlwfmpjlmb`wqfpp`lnf#wlejmdfqpGvhf#lesflsof/f{soljwtkbw#jpkbqnlmzb#nbilq!9!kwwsjm#kjp#nfmv!=\tnlmwkozleej`fq`lvm`jodbjmjmdfufm#jmPvnnbqzgbwf#leolzbowzejwmfppbmg#tbpfnsfqlqpvsqfnfPf`lmg#kfbqjmdQvppjbmolmdfpwBoafqwbobwfqbopfw#le#pnboo!=-bssfmggl#tjwkefgfqboabmh#leafmfbwkGfpsjwf@bsjwbodqlvmgp*/#bmg#sfq`fmwjw#eqln`olpjmd`lmwbjmJmpwfbgejewffmbp#tfoo-zbkll-qfpslmgejdkwfqlap`vqfqfeof`wlqdbmj`>#Nbwk-fgjwjmdlmojmf#sbggjmdb#tkloflmfqqlqzfbq#lefmg#le#abqqjfqtkfm#jwkfbgfq#klnf#leqfpvnfgqfmbnfgpwqlmd=kfbwjmdqfwbjmp`olvgeqtbz#le#Nbq`k#2hmltjmdjm#sbqwAfwtffmofpplmp`olpfpwujqwvboojmhp!=`qlppfgFMG#..=ebnlvp#btbqgfgOj`fmpfKfbowk#ebjqoz#tfbowkznjmjnboBeqj`bm`lnsfwfobafo!=pjmdjmdebqnfqpAqbpjo*gjp`vppqfsob`fDqfdlqzelmw#`lsvqpvfgbssfbqpnbhf#vsqlvmgfgalwk#leaol`hfgpbt#wkfleej`fp`lolvqpje+gl`vtkfm#kffmelq`fsvpk+evBvdvpw#VWE.;!=Ebmwbpzjm#nlpwjmivqfgVpvboozebqnjmd`olpvqflaif`w#gfefm`fvpf#le#Nfgj`bo?algz=\tfujgfmwaf#vpfghfz@lgfpj{wffmJpobnj` 333333fmwjqf#tjgfoz#b`wjuf#+wzsflelmf#`bm`lolq#>psfbhfqf{wfmgpSkzpj`pwfqqbjm?walgz=evmfqboujftjmdnjggof#`qj`hfwsqlskfwpkjewfggl`wlqpQvppfoo#wbqdfw`lnsb`wbodfaqbpl`jbo.avoh#lenbm#bmg?,wg=\t#kf#ofew*-ubo+*ebopf*8oldj`boabmhjmdklnf#wlmbnjmd#Bqjylmb`qfgjwp*8\t~*8\telvmgfqjm#wvqm@loojmpafelqf#Avw#wkf`kbqdfgWjwof!=@bswbjmpsfoofgdlggfppWbd#..=Bggjmd9avw#tbpQf`fmw#sbwjfmwab`h#jm>ebopf%Ojm`lomtf#hmlt@lvmwfqIvgbjpnp`qjsw#bowfqfg$^*8\t##kbp#wkfvm`ofbqFufmw$/alwk#jmmlw#boo\t\t?\"..#sob`jmdkbqg#wl#`fmwfqplqw#le`ojfmwppwqffwpAfqmbqgbppfqwpwfmg#wlebmwbpzgltm#jmkbqalvqEqffglniftfoqz,balvw--pfbq`kofdfmgpjp#nbgfnlgfqm#lmoz#lmlmoz#wljnbdf!#ojmfbq#sbjmwfqbmg#mlwqbqfoz#b`qlmzngfojufqpklqwfq33%bns8bp#nbmztjgwk>!,)#?\"X@wjwof#>le#wkf#oltfpw#sj`hfg#fp`bsfgvpfp#lesflsofp#Svaoj`Nbwwkftwb`wj`pgbnbdfgtbz#elqobtp#lefbpz#wl#tjmgltpwqlmd##pjnsof~`bw`k+pfufmwkjmelal{tfmw#wlsbjmwfg`jwjyfmJ#glm$wqfwqfbw-#Plnf#tt-!*8\talnajmdnbjowl9nbgf#jm-#Nbmz#`bqqjfp\x7F\x7Fx~8tjtlqh#lepzmlmzngfefbwpebulqfglswj`bosbdfWqbvmofpp#pfmgjmdofew!=?`lnP`lqBoo#wkfiRvfqz-wlvqjpw@obppj`ebopf!#Tjokfonpvavqapdfmvjmfajpklsp-psojw+dolabo#elooltpalgz#lemlnjmbo@lmwb`wpf`vobqofew#wl`kjfeoz.kjggfm.abmmfq?,oj=\t\t-#Tkfm#jm#alwkgjpnjppF{solqfbotbzp#ujb#wkfpsb/]lotfoebqfqvojmd#bqqbmdf`bswbjmkjp#plmqvof#lekf#wllhjwpfoe/>3%bns8+`boofgpbnsofpwl#nbhf`ln,sbdNbqwjm#Hfmmfgzb``fswpevoo#lekbmgofgAfpjgfp,,..=?,baof#wlwbqdfwpfppfm`fkjn#wl#jwp#az#`lnnlm-njmfqbowl#wbhftbzp#wlp-lqd,obgujpfgsfmbowzpjnsof9je#wkfzOfwwfqpb#pklqwKfqafqwpwqjhfp#dqlvsp-ofmdwkeojdkwplufqobspoltoz#ofppfq#pl`jbo#?,s=\t\n\njw#jmwlqbmhfg#qbwf#levo=\x0E\t##bwwfnswsbjq#lenbhf#jwHlmwbhwBmwlmjlkbujmd#qbwjmdp#b`wjufpwqfbnpwqbssfg!*-`pp+klpwjofofbg#wlojwwof#dqlvsp/Sj`wvqf..=\x0E\t\x0E\t#qltp>!#laif`wjmufqpf?ellwfq@vpwlnU=?_,p`qploujmd@kbnafqpobufqztlvmgfgtkfqfbp\">#$vmgelq#boosbqwoz#.qjdkw9Bqbajbmab`hfg#`fmwvqzvmjw#lenlajof.Fvqlsf/jp#klnfqjph#legfpjqfg@ojmwlm`lpw#lebdf#le#af`lnf#mlmf#les%rvlw8Njggof#fbg$*X3@qjwj`ppwvgjlp=%`lsz8dqlvs!=bppfnaonbhjmd#sqfppfgtjgdfw-sp9!#<#qfavjowaz#plnfElqnfq#fgjwlqpgfobzfg@bmlmj`kbg#wkfsvpkjmd`obpp>!avw#bqfsbqwjboAbazolmalwwln#`bqqjfq@lnnbmgjwp#vpfBp#tjwk`lvqpfpb#wkjqggfmlwfpbopl#jmKlvpwlm13s{8!=b``vpfgglvaof#dlbo#leEbnlvp#*-ajmg+sqjfpwp#Lmojmfjm#Ivozpw#(#!d`lmpvowgf`jnbokfosevoqfujufgjp#ufqzq$($jswolpjmd#efnbofpjp#boplpwqjmdpgbzp#lebqqjuboevwvqf#?laif`welq`jmdPwqjmd+!#,=\t\n\nkfqf#jpfm`lgfg-##Wkf#aboollmglmf#az,`lnnlmad`lolqobt#le#Jmgjbmbbuljgfgavw#wkf1s{#0s{irvfqz-bewfq#bsloj`z-nfm#bmgellwfq.>#wqvf8elq#vpfp`qffm-Jmgjbm#jnbdf#>ebnjoz/kwws9,,#%maps8gqjufqpfwfqmbopbnf#bpmlwj`fgujftfqp~*+*8\t#jp#nlqfpfbplmpelqnfq#wkf#mftjp#ivpw`lmpfmw#Pfbq`ktbp#wkftkz#wkfpkjssfgaq=?aq=tjgwk9#kfjdkw>nbgf#le`vjpjmfjp#wkbwb#ufqz#Bgnjqbo#ej{fg8mlqnbo#NjppjlmSqfpp/#lmwbqjl`kbqpfwwqz#wl#jmubgfg>!wqvf!psb`jmdjp#nlpwb#nlqf#wlwboozeboo#le~*8\x0E\t##jnnfmpfwjnf#jmpfw#lvwpbwjpezwl#ejmggltm#wlolw#le#Sobzfqpjm#Ivmfrvbmwvnmlw#wkfwjnf#wlgjpwbmwEjmmjpkpq`#>#+pjmdof#kfos#leDfqnbm#obt#bmgobafofgelqfpwp`llhjmdpsb`f!=kfbgfq.tfoo#bpPwbmofzaqjgdfp,dolabo@qlbwjb#Balvw#X3^8\t##jw/#bmgdqlvsfgafjmd#b*xwkqltkf#nbgfojdkwfqfwkj`boEEEEEE!alwwln!ojhf#b#fnsolzpojuf#jmbp#pffmsqjmwfqnlpw#leva.ojmhqfif`wpbmg#vpfjnbdf!=pv``ffgeffgjmdMv`ofbqjmelqnbwl#kfosTlnfm$pMfjwkfqNf{j`bmsqlwfjm?wbaof#az#nbmzkfbowkzobtpvjwgfujpfg-svpk+xpfoofqppjnsoz#Wkqlvdk-`llhjf#Jnbdf+logfq!=vp-ip!=#Pjm`f#vmjufqpobqdfq#lsfm#wl\"..#fmgojfp#jm$^*8\x0E\t##nbqhfwtkl#jp#+!GLN@lnbmbdfglmf#elqwzsfle#Hjmdglnsqlejwpsqlslpfwl#pklt`fmwfq8nbgf#jwgqfppfgtfqf#jmnj{wvqfsqf`jpfbqjpjmdpq`#>#$nbhf#b#pf`vqfgAbswjpwulwjmd#\t\n\nubq#Nbq`k#1dqft#vs@ojnbwf-qfnlufphjoofgtbz#wkf?,kfbg=eb`f#leb`wjmd#qjdkw!=wl#tlqhqfgv`fpkbp#kbgfqf`wfgpklt+*8b`wjlm>allh#lebm#bqfb>>#!kww?kfbgfq\t?kwno=`lmelqneb`jmd#`llhjf-qfoz#lmklpwfg#-`vpwlnkf#tfmwavw#elqpsqfbg#Ebnjoz#b#nfbmplvw#wkfelqvnp-ellwbdf!=Nlajo@ofnfmwp!#jg>!bp#kjdkjmwfmpf..=?\"..efnbof#jp#pffmjnsojfgpfw#wkfb#pwbwfbmg#kjpebpwfpwafpjgfpavwwlm\\alvmgfg!=?jnd#Jmelal{fufmwp/b#zlvmdbmg#bqfMbwjuf#`kfbsfqWjnflvwbmg#kbpfmdjmfptlm#wkf+nlpwozqjdkw9#ejmg#b#.alwwlnSqjm`f#bqfb#lenlqf#lepfbq`k\\mbwvqf/ofdboozsfqjlg/obmg#lelq#tjwkjmgv`fgsqlujmdnjppjofol`boozBdbjmpwwkf#tbzh%rvlw8s{8!=\x0E\tsvpkfg#babmglmmvnfqbo@fqwbjmJm#wkjpnlqf#jmlq#plnfmbnf#jpbmg/#jm`qltmfgJPAM#3.`qfbwfpL`wlafqnbz#mlw`fmwfq#obwf#jmGfefm`ffmb`wfgtjpk#wlaqlbgoz`llojmdlmolbg>jw-#Wkfqf`lufqNfnafqpkfjdkw#bppvnfp?kwno=\tsflsof-jm#lmf#>tjmgltellwfq\\b#dllg#qfhobnblwkfqp/wl#wkjp\\`llhjfsbmfo!=Olmglm/gfejmfp`qvpkfgabswjpn`lbpwbopwbwvp#wjwof!#nluf#wlolpw#jmafwwfq#jnsojfpqjuboqzpfqufqp#PzpwfnSfqkbspfp#bmg#`lmwfmgeoltjmdobpwfg#qjpf#jmDfmfpjpujft#leqjpjmd#pffn#wlavw#jm#ab`hjmdkf#tjoodjufm#bdjujmd#`jwjfp-eolt#le#Obwfq#boo#avwKjdktbzlmoz#azpjdm#lekf#glfpgjeefqpabwwfqz%bns8obpjmdofpwkqfbwpjmwfdfqwbhf#lmqfevpfg`boofg#>VP%bnsPff#wkfmbwjufpaz#wkjppzpwfn-kfbg#le9klufq/ofpajbmpvqmbnfbmg#boo`lnnlm,kfbgfq\\\\sbqbnpKbqubqg,sj{fo-qfnlubopl#olmdqlof#leiljmwozphzp`qbVmj`lgfaq#,=\x0E\tBwobmwbmv`ofvp@lvmwz/svqfoz#`lvmw!=fbpjoz#avjog#blm`oj`hb#djufmsljmwfqk%rvlw8fufmwp#fopf#x\tgjwjlmpmlt#wkf/#tjwk#nbm#tkllqd,Tfalmf#bmg`buboqzKf#gjfgpfbwwof33/333#xtjmgltkbuf#wlje+tjmgbmg#jwpplofoz#n%rvlw8qfmftfgGfwqljwbnlmdpwfjwkfq#wkfn#jmPfmbwlqVp?,b=?Hjmd#leEqbm`jp.sqlgv`kf#vpfgbqw#bmgkjn#bmgvpfg#azp`lqjmdbw#klnfwl#kbufqfobwfpjajojwzeb`wjlmAveebolojmh!=?tkbw#kfeqff#wl@jwz#le`lnf#jmpf`wlqp`lvmwfglmf#gbzmfqulvpprvbqf#~8je+dljm#tkbwjnd!#bojp#lmozpfbq`k,wvfpgbzollpfozPlolnlmpf{vbo#.#?b#kqnfgjvn!GL#MLW#Eqbm`f/tjwk#b#tbq#bmgpf`lmg#wbhf#b#=\x0E\t\x0E\t\x0E\tnbqhfw-kjdktbzglmf#jm`wjujwz!obpw!=laojdfgqjpf#wl!vmgfejnbgf#wl#Fbqoz#sqbjpfgjm#jwp#elq#kjpbwkofwfIvsjwfqZbkll\"#wfqnfg#pl#nbmzqfbooz#p-#Wkf#b#tlnbm<ubovf>gjqf`w#qjdkw!#aj`z`ofb`jmd>!gbz#bmgpwbwjmdQbwkfq/kjdkfq#Leej`f#bqf#mltwjnfp/#tkfm#b#sbz#elqlm#wkjp.ojmh!=8alqgfqbqlvmg#bmmvbo#wkf#Mftsvw#wkf-`ln!#wbhjm#wlb#aqjfe+jm#wkfdqlvsp-8#tjgwkfmyznfppjnsof#jm#obwfxqfwvqmwkfqbszb#sljmwabmmjmdjmhp!=\t+*8!#qfb#sob`f_v330@bbalvw#bwq=\x0E\t\n\n``lvmw#djufp#b?P@QJSWQbjotbzwkfnfp,wlloal{AzJg+!{kvnbmp/tbw`kfpjm#plnf#je#+tj`lnjmd#elqnbwp#Vmgfq#avw#kbpkbmgfg#nbgf#azwkbm#jmefbq#legfmlwfg,jeqbnfofew#jmulowbdfjm#fb`kb%rvlw8abpf#leJm#nbmzvmgfqdlqfdjnfpb`wjlm#?,s=\x0E\t?vpwlnUb8%dw8?,jnslqwplq#wkbwnlpwoz#%bns8qf#pjyf>!?,b=?,kb#`obppsbppjufKlpw#>#TkfwkfqefqwjofUbqjlvp>X^8+ev`bnfqbp,=?,wg=b`wp#bpJm#plnf=\x0E\t\x0E\t?\"lqdbmjp#?aq#,=Afjijmd`bwbo/Lgfvwp`kfvqlsfvfvphbqbdbfjodfpufmphbfpsb/]bnfmpbifvpvbqjlwqbabiln/E{j`ls/Mdjmbpjfnsqfpjpwfnbl`wvaqfgvqbmwfb/]bgjqfnsqfpbnlnfmwlmvfpwqlsqjnfqbwqbu/Epdqb`jbpmvfpwqbsql`fplfpwbglp`bojgbgsfqplmbm/Vnfqlb`vfqgln/Vpj`bnjfnaqllefqwbpbodvmlpsb/Apfpfifnsolgfqf`klbgfn/Mpsqjubglbdqfdbqfmob`fpslpjaofklwfofppfujoobsqjnfql/Vowjnlfufmwlpbq`kjul`vowvqbnvifqfpfmwqbgbbmvm`jlfnabqdlnfq`bgldqbmgfpfpwvgjlnfilqfpefaqfqlgjpf/]lwvqjpnl`/_gjdlslqwbgbfpsb`jlebnjojbbmwlmjlsfqnjwfdvbqgbqbodvmbpsqf`jlpbodvjfmpfmwjglujpjwbpw/Awvol`lml`fqpfdvmgl`lmpfileqbm`jbnjmvwlppfdvmgbwfmfnlpfef`wlpn/Mobdbpfpj/_mqfujpwbdqbmbgb`lnsqbqjmdqfpldbq`/Abb``j/_mf`vbglqrvjfmfpjm`ovplgfafq/Mnbwfqjbklnaqfpnvfpwqbslgq/Abnb/]bmb/Vowjnbfpwbnlplej`jbowbnajfmmjmd/Vmpbovglpslgfnlpnfilqbqslpjwjlmavpjmfppklnfsbdfpf`vqjwzobmdvbdfpwbmgbqg`bnsbjdmefbwvqfp`bwfdlqzf{wfqmbo`kjogqfmqfpfqufgqfpfbq`kf{`kbmdfebulqjwfwfnsobwfnjojwbqzjmgvpwqzpfquj`fpnbwfqjbosqlgv`wpy.jmgf{9`lnnfmwpplewtbqf`lnsofwf`bofmgbqsobwelqnbqwj`ofpqfrvjqfgnlufnfmwrvfpwjlmavjogjmdslojwj`pslppjaofqfojdjlmskzpj`boeffgab`hqfdjpwfqsj`wvqfpgjpbaofgsqlwl`lobvgjfm`fpfwwjmdpb`wjujwzfofnfmwpofbqmjmdbmzwkjmdbapwqb`wsqldqfpplufqujftnbdbyjmff`lmlnj`wqbjmjmdsqfppvqfubqjlvp#?pwqlmd=sqlsfqwzpklssjmdwldfwkfqbgubm`fgafkbujlqgltmolbgefbwvqfgellwaboopfof`wfgObmdvbdfgjpwbm`fqfnfnafqwqb`hjmdsbpptlqgnlgjejfgpwvgfmwpgjqf`wozejdkwjmdmlqwkfqmgbwbabpfefpwjuboaqfbhjmdol`bwjlmjmwfqmfwgqlsgltmsqb`wj`ffujgfm`fevm`wjlmnbqqjbdfqfpslmpfsqlaofnpmfdbwjufsqldqbnpbmbozpjpqfofbpfgabmmfq!=svq`kbpfsloj`jfpqfdjlmbo`qfbwjufbqdvnfmwallhnbqhqfefqqfq`kfnj`bogjujpjlm`booab`hpfsbqbwfsqlif`wp`lmeoj`wkbqgtbqfjmwfqfpwgfojufqznlvmwbjmlawbjmfg>#ebopf8elq+ubq#b``fswfg`bsb`jwz`lnsvwfqjgfmwjwzbjq`qbewfnsolzfgsqlslpfgglnfpwj`jm`ovgfpsqlujgfgklpsjwboufqwj`bo`loobspfbssqlb`ksbqwmfqpoldl!=?bgbvdkwfqbvwklq!#`vowvqboebnjojfp,jnbdfp,bppfnaozsltfqevowfb`kjmdejmjpkfggjpwqj`w`qjwj`bo`dj.ajm,svqslpfpqfrvjqfpfof`wjlmaf`lnjmdsqlujgfpb`bgfnj`f{fq`jpfb`wvbooznfgj`jmf`lmpwbmwb``jgfmwNbdbyjmfgl`vnfmwpwbqwjmdalwwln!=lapfqufg9#%rvlw8f{wfmgfgsqfujlvpPlewtbqf`vpwlnfqgf`jpjlmpwqfmdwkgfwbjofgpojdkwozsobmmjmdwf{wbqfb`vqqfm`zfufqzlmfpwqbjdkwwqbmpefqslpjwjufsqlgv`fgkfqjwbdfpkjssjmdbaplovwfqf`fjufgqfofubmwavwwlm!#ujlofm`fbmztkfqfafmfejwpobvm`kfgqf`fmwozboojbm`felooltfgnvowjsofavoofwjmjm`ovgfgl``vqqfgjmwfqmbo'+wkjp*-qfsvaoj`=?wq=?wg`lmdqfppqf`lqgfgvowjnbwfplovwjlm?vo#jg>!gjp`lufqKlnf?,b=tfapjwfpmfwtlqhpbowklvdkfmwjqfoznfnlqjbonfppbdfp`lmwjmvfb`wjuf!=plnftkbwuj`wlqjbTfpwfqm##wjwof>!Ol`bwjlm`lmwqb`wujpjwlqpGltmolbgtjwklvw#qjdkw!=\tnfbpvqfptjgwk#>#ubqjbaofjmuloufgujqdjmjbmlqnboozkbssfmfgb``lvmwppwbmgjmdmbwjlmboQfdjpwfqsqfsbqfg`lmwqlopb``vqbwfajqwkgbzpwqbwfdzleej`jbodqbskj`p`qjnjmboslppjaoz`lmpvnfqSfqplmbopsfbhjmdubojgbwfb`kjfufg-isd!#,=nb`kjmfp?,k1=\t##hfztlqgpeqjfmgozaqlwkfqp`lnajmfglqjdjmbo`lnslpfgf{sf`wfgbgfrvbwfsbhjpwbmeloolt!#ubovbaof?,obafo=qfobwjufaqjmdjmdjm`qfbpfdlufqmlqsovdjmp,Ojpw#le#Kfbgfq!=!#mbnf>!#+%rvlw8dqbgvbwf?,kfbg=\t`lnnfq`fnbobzpjbgjqf`wlqnbjmwbjm8kfjdkw9p`kfgvof`kbmdjmdab`h#wl#`bwkloj`sbwwfqmp`lolq9# dqfbwfpwpvssojfpqfojbaof?,vo=\t\n\n?pfof`w#`jwjyfmp`olwkjmdtbw`kjmd?oj#jg>!psf`jej``bqqzjmdpfmwfm`f?`fmwfq=`lmwqbpwwkjmhjmd`bw`k+f*plvwkfqmNj`kbfo#nfq`kbmw`bqlvpfosbggjmd9jmwfqjlq-psojw+!ojybwjlmL`wlafq#*xqfwvqmjnsqlufg..%dw8\t\t`lufqbdf`kbjqnbm-smd!#,=pvaif`wpQj`kbqg#tkbwfufqsqlabaozqf`lufqzabpfabooivgdnfmw`lmmf`w--`pp!#,=#tfapjwfqfslqwfggfebvow!,=?,b=\x0E\tfof`wqj`p`lwobmg`qfbwjlmrvbmwjwz-#JPAM#3gjg#mlw#jmpwbm`f.pfbq`k.!#obmd>!psfbhfqp@lnsvwfq`lmwbjmpbq`kjufpnjmjpwfqqfb`wjlmgjp`lvmwJwbojbml`qjwfqjbpwqlmdoz9#$kwws9$p`qjsw$`lufqjmdleefqjmdbssfbqfgAqjwjpk#jgfmwjezEb`fallhmvnfqlvpufkj`ofp`lm`fqmpBnfqj`bmkbmgojmdgju#jg>!Tjoojbn#sqlujgfq\\`lmwfmwb``vqb`zpf`wjlm#bmgfqplmeof{jaof@bwfdlqzobtqfm`f?p`qjsw=obzlvw>!bssqlufg#nb{jnvnkfbgfq!=?,wbaof=Pfquj`fpkbnjowlm`vqqfmw#`bmbgjbm`kbmmfop,wkfnfp,,bqwj`oflswjlmboslqwvdboubovf>!!jmwfqubotjqfofppfmwjwofgbdfm`jfpPfbq`k!#nfbpvqfgwklvpbmgpsfmgjmd%kfoojs8mft#Gbwf!#pjyf>!sbdfMbnfnjggof!#!#,=?,b=kjggfm!=pfrvfm`fsfqplmbolufqeoltlsjmjlmpjoojmljpojmhp!=\t\n?wjwof=ufqpjlmppbwvqgbzwfqnjmbojwfnsqlsfmdjmffqpf`wjlmpgfpjdmfqsqlslpbo>!ebopf!Fpsb/]loqfofbpfppvanjw!#fq%rvlw8bggjwjlmpznswlnplqjfmwfgqfplvq`fqjdkw!=?sofbpvqfpwbwjlmpkjpwlqz-ofbujmd##alqgfq>`lmwfmwp`fmwfq!=-\t\tPlnf#gjqf`wfgpvjwbaofavodbqjb-pklt+*8gfpjdmfgDfmfqbo#`lm`fswpF{bnsofptjoojbnpLqjdjmbo!=?psbm=pfbq`k!=lsfqbwlqqfrvfpwpb#%rvlw8booltjmdGl`vnfmwqfujpjlm-#\t\tWkf#zlvqpfoe@lmwb`w#nj`kjdbmFmdojpk#`lovnajbsqjlqjwzsqjmwjmdgqjmhjmdeb`jojwzqfwvqmfg@lmwfmw#leej`fqpQvppjbm#dfmfqbwf.;;6:.2!jmgj`bwfebnjojbq#rvbojwznbqdjm93#`lmwfmwujftslqw`lmwb`wp.wjwof!=slqwbaof-ofmdwk#fojdjaofjmuloufpbwobmwj`lmolbg>!gfebvow-pvssojfgsbznfmwpdolppbqz\t\tBewfq#dvjgbm`f?,wg=?wgfm`lgjmdnjggof!=`bnf#wl#gjpsobzpp`lwwjpkilmbwkbmnbilqjwztjgdfwp-`ojmj`bowkbjobmgwfb`kfqp?kfbg=\t\nbeef`wfgpvsslqwpsljmwfq8wlPwqjmd?,pnboo=lhobklnbtjoo#af#jmufpwlq3!#bow>!klojgbzpQfplvq`foj`fmpfg#+tkj`k#-#Bewfq#`lmpjgfqujpjwjmdf{solqfqsqjnbqz#pfbq`k!#bmgqljg!rvj`hoz#nffwjmdpfpwjnbwf8qfwvqm#8`lolq9 #kfjdkw>bssqlubo/#%rvlw8#`kf`hfg-njm-ip!nbdmfwj`=?,b=?,kelqf`bpw-#Tkjof#wkvqpgbzgufqwjpf%fb`vwf8kbp@obppfubovbwflqgfqjmdf{jpwjmdsbwjfmwp#Lmojmf#`lolqbglLswjlmp!`bnsafoo?\"..#fmg?,psbm=??aq#,=\x0E\t\\slsvsp\x7Fp`jfm`fp/%rvlw8#rvbojwz#Tjmgltp#bppjdmfgkfjdkw9#?a#`obppof%rvlw8#ubovf>!#@lnsbmzf{bnsofp?jeqbnf#afojfufpsqfpfmwpnbqpkboosbqw#le#sqlsfqoz*-\t\tWkf#wb{lmlnznv`k#le#?,psbm=\t!#gbwb.pqwvdv/Fpp`qlooWl#sqlif`w?kfbg=\x0E\tbwwlqmfzfnskbpjppslmplqpebm`zal{tlqog$p#tjogojef`kf`hfg>pfppjlmpsqldqbnns{8elmw.#Sqlif`wilvqmbopafojfufgub`bwjlmwklnsplmojdkwjmdbmg#wkf#psf`jbo#alqgfq>3`kf`hjmd?,walgz=?avwwlm#@lnsofwf`ofbqej{\t?kfbg=\tbqwj`of#?pf`wjlmejmgjmdpqlof#jm#slsvobq##L`wlafqtfapjwf#f{slpvqfvpfg#wl##`kbmdfplsfqbwfg`oj`hjmdfmwfqjmd`lnnbmgpjmelqnfg#mvnafqp##?,gju=`qfbwjmdlmPvanjwnbqzobmg`loofdfpbmbozwj`ojpwjmdp`lmwb`w-olddfgJmbgujplqzpjaojmdp`lmwfmw!p%rvlw8*p-#Wkjp#sb`hbdfp`kf`hal{pvddfpwpsqfdmbmwwlnlqqltpsb`jmd>j`lm-smdibsbmfpf`lgfabpfavwwlm!=dbnaojmdpv`k#bp#/#tkjof#?,psbm=#njpplvqjpslqwjmdwls92s{#-?,psbm=wfmpjlmptjgwk>!1obyzolbgmlufnafqvpfg#jm#kfjdkw>!`qjsw!=\t%maps8?,?wq=?wg#kfjdkw91,sqlgv`w`lvmwqz#jm`ovgf#ellwfq!#%ow8\"..#wjwof!=?,irvfqz-?,elqn=\t+\x0BBl\bQ\x7F*+\x0BUm\x05Gx*kqubwphjjwbojbmlqln/Nm(ow/Pqh/Kf4K4]4C5dwbnaj/Emmlwj`jbpnfmpbifpsfqplmbpgfqf`klpmb`jlmbopfquj`jl`lmwb`wlvpvbqjlpsqldqbnbdlajfqmlfnsqfpbpbmvm`jlpubofm`jb`lolnajbgfpsv/Epgfslqwfpsqlzf`wlsqlgv`wls/Vaoj`lmlplwqlpkjpwlqjbsqfpfmwfnjoolmfpnfgjbmwfsqfdvmwbbmwfqjlqqf`vqplpsqlaofnbpbmwjbdlmvfpwqlplsjmj/_mjnsqjnjqnjfmwqbpbn/Eqj`bufmgfglqpl`jfgbgqfpsf`wlqfbojybqqfdjpwqlsbobaqbpjmwfq/Epfmwlm`fpfpsf`jbonjfnaqlpqfbojgbg`/_qglabybqbdlybs/Mdjmbppl`jbofpaolrvfbqdfpwj/_mborvjofqpjpwfnbp`jfm`jbp`lnsofwlufqpj/_m`lnsofwbfpwvgjlps/Vaoj`blaifwjulboj`bmwfavp`bglq`bmwjgbgfmwqbgbpb``jlmfpbq`kjulppvsfqjlqnbzlq/Abbofnbmjbevm`j/_m/Vowjnlpkb`jfmglbrvfoolpfgj`j/_mefqmbmglbnajfmwfeb`fallhmvfpwqbp`ojfmwfpsql`fplpabpwbmwfsqfpfmwbqfslqwbq`lmdqfplsvaoj`bq`lnfq`jl`lmwqbwli/_ufmfpgjpwqjwlw/E`mj`b`lmivmwlfmfqd/Abwqbabibqbpwvqjbpqf`jfmwfvwjojybqalofw/Ampboubglq`lqqf`wbwqbabilpsqjnfqlpmfdl`jlpojafqwbggfwboofpsbmwboobsq/_{jnlbonfq/Abbmjnbofprvj/Emfp`lqby/_mpf``j/_mavp`bmglls`jlmfpf{wfqjlq`lm`fswlwlgbu/Abdbofq/Abfp`qjajqnfgj`jmboj`fm`jb`lmpvowbbpsf`wlp`q/Awj`bg/_obqfpivpwj`jbgfafq/Mmsfq/Alglmf`fpjwbnbmwfmfqsfrvf/]lqf`jajgbwqjavmbowfmfqjef`bm`j/_m`bmbqjbpgfp`bqdbgjufqplpnboolq`bqfrvjfqfw/E`mj`lgfafq/Abujujfmgbejmbmybpbgfobmwfevm`jlmb`lmpfilpgje/A`jo`jvgbgfpbmwjdvbpbubmybgbw/Eqnjmlvmjgbgfpp/Mm`kfy`bnsb/]bplewlmj`qfujpwbp`lmwjfmfpf`wlqfpnlnfmwlpeb`vowbg`q/Egjwlgjufqpbppvsvfpwleb`wlqfppfdvmglpsfrvf/]b<_<R<X<\\<Y=m<W<T<Y=m=n=`<]=g<W<R<]=g=n=`=a=n<R<P<y=m<W<T=n<R<_<R<P<Y<Q=c<^=m<Y=i=a=n<R<U<X<\\<Z<Y<]=g<W<T<_<R<X=o<X<Y<Q=`=a=n<R=n<]=g<W<\\=m<Y<]=c<R<X<T<Q=m<Y<]<Y<Q<\\<X<R=m<\\<U=n=h<R=n<R<Q<Y<_<R=m<^<R<T=m<^<R<U<T<_=l=g=n<R<Z<Y<^=m<Y<P=m<^<R=b<W<T=d=`=a=n<T=i<S<R<V<\\<X<Q<Y<U<X<R<P<\\<P<T=l<\\<W<T<]<R=n<Y<P=o=i<R=n=c<X<^=o=i=m<Y=n<T<W=b<X<T<X<Y<W<R<P<T=l<Y=n<Y<]=c=m<^<R<Y<^<T<X<Y=k<Y<_<R=a=n<T<P=m=k<Y=n=n<Y<P=g=j<Y<Q=g=m=n<\\<W<^<Y<X=`=n<Y<P<Y<^<R<X=g=n<Y<]<Y<^=g=d<Y<Q<\\<P<T=n<T<S<\\=n<R<P=o<S=l<\\<^<W<T=j<\\<R<X<Q<\\<_<R<X=g<[<Q<\\=b<P<R<_=o<X=l=o<_<^=m<Y<U<T<X<Y=n<V<T<Q<R<R<X<Q<R<X<Y<W<\\<X<Y<W<Y=m=l<R<V<T=b<Q=c<^<Y=m=`<y=m=n=`=l<\\<[<\\<Q<\\=d<T4K5h5h5k4K5h4F5f4@5i5f4U4B4K4Y4E4K5h4\\5f4U5h5f5k4@4C5f4C4K5h4N5j4K5h4]4C4F4A5o5i4Y5m4A4E5o4K5j4F4K5h5h5f5f5o5d5j4X4D5o4E5m5f5k4K4D5j4K4F4A5d4K4M4O5o4G4]4B5h4K5h4K5h4A4D4C5h5f5h4C4]5d4_4K4Z4V4[4F5o5d5j5k5j4K5o4_4K4A4E5j4K4C5f4K5h4[4D4U5h5f5o4X5o4]4K5f5i5o5j5i5j5k4K4X4]5o4E4]4J5f4_5j4X5f4[5i4K4\\4K4K5h5m5j4X4D4K4D4F4U4D4]4]4A5i4E5o4K5m4E5f5n5d5h5i4]5o4^5o5h5i4E4O4A5i4C5n5h4D5f5f4U5j5f4Y5d4]4E4[4]5f5n4X4K4]5o4@5d4K5h4O4B4]5e5i4U5j4K4K4D4A4G4U4]5d4Z4D4X5o5h5i4_4@5h4D5j4K5j4B4K5h4C5o4F4K4D5o5h5f4E4D4C5d5j4O5f4Z4K5f5d4@4C5m4]5f5n5o4F4D4F4O5m4Z5h5i4[4D4B4K5o4G4]4D4K4]5o4K5m4Z5h4K4A5h5e5j5m4_5k4O5f4K5i4]4C5d4C4O5j5k4K4C5f5j4K4K5h4K5j5i4U4]4Z4F4U5h5i4C4K4B5h5i5i5o5j\x03\x03\x03\x03\x03\x03\x03\x03\x02\x03\x02\x03\x02\x03\x02\x03\x01\x03\x01\x03\x01\x03\x01\x03\x07\x03\x07\x03\x07\x03\x07\x03\x03\x02\x01\0\x07\x06\x05\x04\x04\x05\x06\x07\0\x01\x02\x03\x0B\n\t\b\x0F\x0E\r\f\f\r\x0E\x0F\b\t\n\x0B\x13\x12\x11\x10\x17\x16\x15\x14\x14\x15\x16\x17\x10\x11\x12\x13\x1B\x1A\x19\x18\x1F\x1E\x1D\x1C\x1C\x1D\x1E\x1F\x18\x19\x1A\x1B\x13\x13\x13\x13\x03\x03\x03\x03\x03\x03\x03\x03\x13\x13\x13\x13\x02\x03\x03\x03\x01\x03\x03\x03\x01\x03\x03\x03\x02\x03\x03\x03\x02\x03\x03\x03\0\x03\x03\x03\x13\x13\x03\x02\x03\x03\x03\x02\x03\x03\x13\x13\x03\x02\x03\x03\x03\x0B\x03\x0B\x03\x0B\x03\x0B\x03\x03\x03\x02\x03\x01\x03\0\x03\x07\x03\x06\x03\x05\x03\x04qfplvq`fp`lvmwqjfprvfpwjlmpfrvjsnfmw`lnnvmjwzbubjobaofkjdkojdkwGWG,{kwnonbqhfwjmdhmltofgdfplnfwkjmd`lmwbjmfqgjqf`wjlmpvap`qjafbgufqwjpf`kbqb`wfq!#ubovf>!?,pfof`w=Bvpwqbojb!#`obpp>!pjwvbwjlmbvwklqjwzelooltjmdsqjnbqjozlsfqbwjlm`kboofmdfgfufolsfgbmlmznlvpevm`wjlm#evm`wjlmp`lnsbmjfppwqv`wvqfbdqffnfmw!#wjwof>!slwfmwjbofgv`bwjlmbqdvnfmwppf`lmgbqz`lszqjdkwobmdvbdfpf{`ovpjuf`lmgjwjlm?,elqn=\x0E\tpwbwfnfmwbwwfmwjlmAjldqbskz~#fopf#x\tplovwjlmptkfm#wkf#Bmbozwj`pwfnsobwfpgbmdfqlvppbwfoojwfgl`vnfmwpsvaojpkfqjnslqwbmwsqlwlwzsfjmeovfm`f%qbrvl8?,feef`wjufdfmfqboozwqbmpelqnafbvwjevowqbmpslqwlqdbmjyfgsvaojpkfgsqlnjmfmwvmwjo#wkfwkvnambjoMbwjlmbo#-el`vp+*8lufq#wkf#njdqbwjlmbmmlvm`fgellwfq!=\tf{`fswjlmofpp#wkbmf{sfmpjufelqnbwjlmeqbnftlqhwfqqjwlqzmgj`bwjlm`vqqfmwoz`obppMbnf`qjwj`jpnwqbgjwjlmfopftkfqfBof{bmgfqbssljmwfgnbwfqjbopaqlbg`bpwnfmwjlmfgbeejojbwf?,lswjlm=wqfbwnfmwgjeefqfmw,gfebvow-Sqfpjgfmwlm`oj`h>!ajldqbskzlwkfqtjpfsfqnbmfmwEqbm/KbjpKlooztllgf{sbmpjlmpwbmgbqgp?,pwzof=\tqfgv`wjlmGf`fnafq#sqfefqqfg@bnaqjgdflsslmfmwpAvpjmfpp#`lmevpjlm=\t?wjwof=sqfpfmwfgf{sobjmfgglfp#mlw#tlqogtjgfjmwfqeb`fslpjwjlmpmftpsbsfq?,wbaof=\tnlvmwbjmpojhf#wkf#fppfmwjboejmbm`jbopfof`wjlmb`wjlm>!,babmglmfgFgv`bwjlmsbqpfJmw+pwbajojwzvmbaof#wl?,wjwof=\tqfobwjlmpMlwf#wkbwfeej`jfmwsfqelqnfgwtl#zfbqpPjm`f#wkfwkfqfelqftqbssfq!=bowfqmbwfjm`qfbpfgAbwwof#lesfq`fjufgwqzjmd#wlmf`fppbqzslqwqbzfgfof`wjlmpFojybafwk?,jeqbnf=gjp`lufqzjmpvqbm`fp-ofmdwk8ofdfmgbqzDfldqbskz`bmgjgbwf`lqslqbwfplnfwjnfppfquj`fp-jmkfqjwfg?,pwqlmd=@lnnvmjwzqfojdjlvpol`bwjlmp@lnnjwwffavjogjmdpwkf#tlqogml#olmdfqafdjmmjmdqfefqfm`f`bmmlw#afeqfrvfm`zwzsj`boozjmwl#wkf#qfobwjuf8qf`lqgjmdsqfpjgfmwjmjwjboozwf`kmjrvfwkf#lwkfqjw#`bm#aff{jpwfm`fvmgfqojmfwkjp#wjnfwfofsklmfjwfnp`lsfsqb`wj`fpbgubmwbdf*8qfwvqm#Elq#lwkfqsqlujgjmdgfnl`qb`zalwk#wkf#f{wfmpjufpveefqjmdpvsslqwfg`lnsvwfqp#evm`wjlmsqb`wj`bopbjg#wkbwjw#nbz#afFmdojpk?,eqln#wkf#p`kfgvofggltmolbgp?,obafo=\tpvpsf`wfgnbqdjm9#3psjqjwvbo?,kfbg=\t\tnj`qlplewdqbgvboozgjp`vppfgkf#af`bnff{f`vwjufirvfqz-ipklvpfklog`lmejqnfgsvq`kbpfgojwfqboozgfpwqlzfgvs#wl#wkfubqjbwjlmqfnbjmjmdjw#jp#mlw`fmwvqjfpIbsbmfpf#bnlmd#wkf`lnsofwfgbodlqjwknjmwfqfpwpqfafoojlmvmgfejmfgfm`lvqbdfqfpjybaofjmuloujmdpfmpjwjufvmjufqpbosqlujpjlm+bowklvdkefbwvqjmd`lmgv`wfg*/#tkj`k#`lmwjmvfg.kfbgfq!=Efaqvbqz#mvnfqlvp#lufqeolt9`lnslmfmweqbdnfmwpf{`foofmw`lopsbm>!wf`kmj`bomfbq#wkf#Bgubm`fg#plvq`f#lef{sqfppfgKlmd#Hlmd#Eb`fallhnvowjsof#nf`kbmjpnfofubwjlmleefmpjuf?,elqn=\t\npslmplqfggl`vnfmw-lq#%rvlw8wkfqf#bqfwklpf#tklnlufnfmwpsql`fppfpgjeej`vowpvanjwwfgqf`lnnfmg`lmujm`fgsqlnlwjmd!#tjgwk>!-qfsob`f+`obppj`bo`lbojwjlmkjp#ejqpwgf`jpjlmpbppjpwbmwjmgj`bwfgfulovwjlm.tqbssfq!fmlvdk#wlbolmd#wkfgfojufqfg..=\x0E\t?\"..Bnfqj`bm#sqlwf`wfgMlufnafq#?,pwzof=?evqmjwvqfJmwfqmfw##lmaovq>!pvpsfmgfgqf`jsjfmwabpfg#lm#Nlqflufq/balojpkfg`loof`wfgtfqf#nbgffnlwjlmbofnfqdfm`zmbqqbwjufbgul`bwfps{8alqgfq`lnnjwwfggjq>!owq!fnsolzffpqfpfbq`k-#pfof`wfgpv``fpplq`vpwlnfqpgjpsobzfgPfswfnafqbgg@obpp+Eb`fallh#pvddfpwfgbmg#obwfqlsfqbwjmdfobalqbwfPlnfwjnfpJmpwjwvwf`fqwbjmozjmpwboofgelooltfqpIfqvpbofnwkfz#kbuf`lnsvwjmddfmfqbwfgsqlujm`fpdvbqbmwffbqajwqbqzqf`ldmjyftbmwfg#wls{8tjgwk9wkflqz#leafkbujlvqTkjof#wkffpwjnbwfgafdbm#wl#jw#af`bnfnbdmjwvgfnvpw#kbufnlqf#wkbmGjqf`wlqzf{wfmpjlmpf`qfwbqzmbwvqboozl``vqqjmdubqjbaofpdjufm#wkfsobwelqn-?,obafo=?ebjofg#wl`lnslvmgphjmgp#le#pl`jfwjfpbolmdpjgf#..%dw8\t\tplvwktfpwwkf#qjdkwqbgjbwjlmnbz#kbuf#vmfp`bsf+pslhfm#jm!#kqfe>!,sqldqbnnflmoz#wkf#`lnf#eqlngjqf`wlqzavqjfg#jmb#pjnjobqwkfz#tfqf?,elmw=?,Mlqtfdjbmpsf`jejfgsqlgv`jmdsbppfmdfq+mft#Gbwfwfnslqbqzej`wjlmboBewfq#wkffrvbwjlmpgltmolbg-qfdvobqozgfufolsfqbaluf#wkfojmhfg#wlskfmlnfmbsfqjlg#lewllowjs!=pvapwbm`fbvwlnbwj`bpsf`w#leBnlmd#wkf`lmmf`wfgfpwjnbwfpBjq#Elq`fpzpwfn#lelaif`wjufjnnfgjbwfnbhjmd#jwsbjmwjmdp`lmrvfqfgbqf#pwjoosql`fgvqfdqltwk#lekfbgfg#azFvqlsfbm#gjujpjlmpnlof`vofpeqbm`kjpfjmwfmwjlmbwwqb`wfg`kjogkllgbopl#vpfggfgj`bwfgpjmdbslqfgfdqff#leebwkfq#le`lmeoj`wp?,b=?,s=\t`bnf#eqlntfqf#vpfgmlwf#wkbwqf`fjujmdF{f`vwjuffufm#nlqfb``fpp#wl`lnnbmgfqSlojwj`bonvpj`jbmpgfoj`jlvpsqjplmfqpbgufmw#leVWE.;!#,=?\"X@GBWBX!=@lmwb`wPlvwkfqm#ad`lolq>!pfqjfp#le-#Jw#tbp#jm#Fvqlsfsfqnjwwfgubojgbwf-bssfbqjmdleej`jboppfqjlvpoz.obmdvbdfjmjwjbwfgf{wfmgjmdolmd.wfqnjmeobwjlmpv`k#wkbwdfw@llhjfnbqhfg#az?,avwwlm=jnsofnfmwavw#jw#jpjm`qfbpfpgltm#wkf#qfrvjqjmdgfsfmgfmw..=\t?\"..#jmwfqujftTjwk#wkf#`lsjfp#le`lmpfmpvptbp#avjowUfmfyvfob+elqnfqozwkf#pwbwfsfqplmmfopwqbwfdj`ebulvq#lejmufmwjlmTjhjsfgjb`lmwjmfmwujqwvbooztkj`k#tbpsqjm`jsof@lnsofwf#jgfmwj`bopklt#wkbwsqjnjwjufbtbz#eqlnnlof`vobqsqf`jpfozgjpploufgVmgfq#wkfufqpjlm>!=%maps8?,Jw#jp#wkf#Wkjp#jp#tjoo#kbuflqdbmjpnpplnf#wjnfEqjfgqj`ktbp#ejqpwwkf#lmoz#eb`w#wkbwelqn#jg>!sqf`fgjmdWf`kmj`boskzpj`jpwl``vqp#jmmbujdbwlqpf`wjlm!=psbm#jg>!plvdkw#wlafolt#wkfpvqujujmd~?,pwzof=kjp#gfbwkbp#jm#wkf`bvpfg#azsbqwjboozf{jpwjmd#vpjmd#wkftbp#djufmb#ojpw#leofufop#lemlwjlm#leLeej`jbo#gjpnjppfgp`jfmwjpwqfpfnaofpgvsoj`bwff{solpjufqf`lufqfgboo#lwkfqdboofqjfpxsbggjmd9sflsof#leqfdjlm#lebggqfppfpbppl`jbwfjnd#bow>!jm#nlgfqmpklvog#afnfwklg#leqfslqwjmdwjnfpwbnsmffgfg#wlwkf#Dqfbwqfdbqgjmdpffnfg#wlujftfg#bpjnsb`w#lmjgfb#wkbwwkf#Tlqogkfjdkw#lef{sbmgjmdWkfpf#bqf`vqqfmw!=`bqfevooznbjmwbjmp`kbqdf#le@obppj`bobggqfppfgsqfgj`wfgltmfqpkjs?gju#jg>!qjdkw!=\x0E\tqfpjgfm`fofbuf#wkf`lmwfmw!=bqf#lewfm##~*+*8\x0E\tsqlabaoz#Sqlefpplq.avwwlm!#qfpslmgfgpbzp#wkbwkbg#wl#afsob`fg#jmKvmdbqjbmpwbwvp#lepfqufp#bpVmjufqpbof{f`vwjlmbddqfdbwfelq#tkj`kjmef`wjlmbdqffg#wlkltfufq/#slsvobq!=sob`fg#lm`lmpwqv`wfof`wlqbopznalo#lejm`ovgjmdqfwvqm#wlbq`kjwf`w@kqjpwjbmsqfujlvp#ojujmd#jmfbpjfq#wlsqlefpplq\t%ow8\"..#feef`w#lebmbozwj`ptbp#wbhfmtkfqf#wkfwllh#lufqafojfe#jmBeqjhbbmpbp#ebq#bpsqfufmwfgtlqh#tjwkb#psf`jbo?ejfogpfw@kqjpwnbpQfwqjfufg\t\tJm#wkf#ab`h#jmwlmlqwkfbpwnbdbyjmfp=?pwqlmd=`lnnjwwffdlufqmjmddqlvsp#lepwlqfg#jmfpwbaojpkb#dfmfqbojwp#ejqpwwkfjq#ltmslsvobwfgbm#laif`w@bqjaafbmboolt#wkfgjpwqj`wptjp`lmpjmol`bwjlm-8#tjgwk9#jmkbajwfgPl`jbojpwIbmvbqz#2?,ellwfq=pjnjobqoz`klj`f#lewkf#pbnf#psf`jej`#avpjmfpp#Wkf#ejqpw-ofmdwk8#gfpjqf#wlgfbo#tjwkpjm`f#wkfvpfqBdfmw`lm`fjufgjmgf{-sksbp#%rvlw8fmdbdf#jmqf`fmwoz/eft#zfbqptfqf#bopl\t?kfbg=\t?fgjwfg#azbqf#hmltm`jwjfp#jmb``fpphfz`lmgfnmfgbopl#kbufpfquj`fp/ebnjoz#leP`kllo#le`lmufqwfgmbwvqf#le#obmdvbdfnjmjpwfqp?,laif`w=wkfqf#jp#b#slsvobqpfrvfm`fpbgul`bwfgWkfz#tfqfbmz#lwkfqol`bwjlm>fmwfq#wkfnv`k#nlqfqfeof`wfgtbp#mbnfglqjdjmbo#b#wzsj`botkfm#wkfzfmdjmffqp`lvog#mlwqfpjgfmwptfgmfpgbzwkf#wkjqg#sqlgv`wpIbmvbqz#1tkbw#wkfzb#`fqwbjmqfb`wjlmpsql`fpplqbewfq#kjpwkf#obpw#`lmwbjmfg!=?,gju=\t?,b=?,wg=gfsfmg#lmpfbq`k!=\tsjf`fp#le`lnsfwjmdQfefqfm`fwfmmfppfftkj`k#kbp#ufqpjlm>?,psbm=#??,kfbgfq=djufp#wkfkjpwlqjbmubovf>!!=sbggjmd93ujft#wkbwwldfwkfq/wkf#nlpw#tbp#elvmgpvapfw#lebwwb`h#lm`kjogqfm/sljmwp#lesfqplmbo#slpjwjlm9boofdfgoz@ofufobmgtbp#obwfqbmg#bewfqbqf#djufmtbp#pwjoop`qloojmdgfpjdm#lenbhfp#wkfnv`k#ofppBnfqj`bmp-\t\tBewfq#/#avw#wkfNvpfvn#leolvjpjbmb+eqln#wkfnjmmfplwbsbqwj`ofpb#sql`fppGlnjmj`bmulovnf#leqfwvqmjmdgfefmpjuf33s{\x7Fqjdknbgf#eqlnnlvpflufq!#pwzof>!pwbwfp#le+tkj`k#jp`lmwjmvfpEqbm`jp`lavjogjmd#tjwklvw#btjwk#plnftkl#tlvogb#elqn#leb#sbqw#leafelqf#jwhmltm#bp##Pfquj`fpol`bwjlm#bmg#lewfmnfbpvqjmdbmg#jw#jpsbsfqab`hubovfp#le\x0E\t?wjwof=>#tjmglt-gfwfqnjmffq%rvlw8#sobzfg#azbmg#fbqoz?,`fmwfq=eqln#wkjpwkf#wkqffsltfq#bmgle#%rvlw8jmmfqKWNO?b#kqfe>!z9jmojmf8@kvq`k#lewkf#fufmwufqz#kjdkleej`jbo#.kfjdkw9#`lmwfmw>!,`dj.ajm,wl#`qfbwfbeqjhbbmpfpsfqbmwleqbm/Kbjpobwujf)Mvojfwvuj)_(`f)Mwjmb(af)Mwjmb\fUh\fT{\fTN\n{I\np@\x04Fr\x0BBl\bQ\x7F\tA{\x0BUm\x05Gx\tA{\x01yp\x06YA\0zX\bTV\bWl\bUd\x04BM\x0BB{\npV\x0B@x\x04B\\\np@\x04Db\x04Gz\tal\npa\tfM\tuD\bV~\x04mx\x0BQ}\ndS\tp\\\bVK\bS]\bU|\x05oD\tkV\x0Bed\x0BHR\nb~\x04M`\nJp\x05oD\x04|Q\nLP\x04Sw\bTl\nAI\nxC\bWt\tBq\x05F`\x04Cm\x0BLm\tKx\t}t\bPv\ny\\\naB\tV\x7F\nZd\x04XU\x04li\tfr\ti@\tBH\x04BD\x04BV\t`V\n[]\tp_\tTn\n~A\nxR\tuD\t`{\bV@\tTn\tHK\tAJ\x0Bxs\x04Zf\nqI\x04Zf\x0BBM\x0B|j\t}t\bSM\nmC\x0BQ}pfquj`jlpbqw/A`volbqdfmwjmbabq`folmb`vborvjfqsvaoj`bglsqlgv`wlpslo/Awj`bqfpsvfpwbtjhjsfgjbpjdvjfmwfa/Vprvfgb`lnvmjgbgpfdvqjgbgsqjm`jsbosqfdvmwbp`lmwfmjglqfpslmgfqufmfyvfobsqlaofnbpgj`jfnaqfqfob`j/_mmlujfnaqfpjnjobqfpsqlzf`wlpsqldqbnbpjmpwjwvwlb`wjujgbgfm`vfmwqbf`lmln/Abjn/Mdfmfp`lmwb`wbqgfp`bqdbqmf`fpbqjlbwfm`j/_mwfo/Eelml`lnjpj/_m`bm`jlmfp`bsb`jgbgfm`lmwqbqbm/Mojpjpebulqjwlpw/Eqnjmlpsqlujm`jbfwjrvfwbpfofnfmwlpevm`jlmfpqfpvowbgl`bq/M`wfqsqlsjfgbgsqjm`jsjlmf`fpjgbgnvmj`jsbo`qfb`j/_mgfp`bqdbpsqfpfm`jb`lnfq`jbolsjmjlmfpfifq`j`jlfgjwlqjbopbobnbm`bdlmy/Mofygl`vnfmwlsfo/A`vobqf`jfmwfpdfmfqbofpwbqqbdlmbsq/M`wj`bmlufgbgfpsqlsvfpwbsb`jfmwfpw/E`mj`bplaifwjulp`lmwb`wlp\fHB\fIk\fHn\fH^\fHS\fHc\fHU\fId\fHn\fH{\fHC\fHR\fHT\fHR\fHI\fHc\fHY\fHn\fH\\\fHU\fIk\fHy\fIg\fHd\fHy\fIm\fHw\fH\\\fHU\fHR\fH@\fHR\fHJ\fHy\fHU\fHR\fHT\fHA\fIl\fHU\fIm\fHc\fH\\\fHU\fIl\fHB\fId\fHn\fHJ\fHS\fHD\fH@\fHR\fHHgjsolgl`p\fHT\fHB\fHC\fH\\\fIn\fHF\fHD\fHR\fHB\fHF\fHH\fHR\fHG\fHS\fH\\\fHx\fHT\fHH\fHH\fH\\\fHU\fH^\fIg\fH{\fHU\fIm\fHj\fH@\fHR\fH\\\fHJ\fIk\fHZ\fHU\fIm\fHd\fHz\fIk\fH^\fHC\fHJ\fHS\fHy\fHR\fHB\fHY\fIk\fH@\fHH\fIl\fHD\fH@\fIl\fHv\fHB\fI`\fHH\fHT\fHR\fH^\fH^\fIk\fHz\fHp\fIe\fH@\fHB\fHJ\fHJ\fHH\fHI\fHR\fHD\fHU\fIl\fHZ\fHU\fH\\\fHi\fH^\fH{\fHy\fHA\fIl\fHD\fH{\fH\\\fHF\fHR\fHT\fH\\\fHR\fHH\fHy\fHS\fHc\fHe\fHT\fIk\fH{\fHC\fIl\fHU\fIn\fHm\fHj\fH{\fIk\fHs\fIl\fHB\fHz\fIg\fHp\fHy\fHR\fH\\\fHi\fHA\fIl\fH{\fHC\fIk\fHH\fIm\fHB\fHY\fIg\fHs\fHJ\fIk\fHn\fHi\fH{\fH\\\fH|\fHT\fIk\fHB\fIk\fH^\fH^\fH{\fHR\fHU\fHR\fH^\fHf\fHF\fH\\\fHv\fHR\fH\\\fH|\fHT\fHR\fHJ\fIk\fH\\\fHp\fHS\fHT\fHJ\fHS\fH^\fH@\fHn\fHJ\fH@\fHD\fHR\fHU\fIn\fHn\fH^\fHR\fHz\fHp\fIl\fHH\fH@\fHs\fHD\fHB\fHS\fH^\fHk\fHT\fIk\fHj\fHD\fIk\fHD\fHC\fHR\fHy\fIm\fH^\fH^\fIe\fH{\fHA\fHR\fH{\fH\\\fIk\fH^\fHp\fH{\fHU\fH\\\fHR\fHB\fH^\fH{\fIk\fHF\fIk\fHp\fHU\fHR\fHI\fHk\fHT\fIl\fHT\fHU\fIl\fHy\fH^\fHR\fHL\fIl\fHy\fHU\fHR\fHm\fHJ\fIn\fH\\\fHH\fHU\fHH\fHT\fHR\fHH\fHC\fHR\fHJ\fHj\fHC\fHR\fHF\fHR\fHy\fHy\fI`\fHD\fHZ\fHR\fHB\fHJ\fIk\fHz\fHC\fHU\fIl\fH\\\fHR\fHC\fHz\fIm\fHJ\fH^\fH{\fIl`bwfdlqjfpf{sfqjfm`f?,wjwof=\x0E\t@lszqjdkw#ibubp`qjsw`lmgjwjlmpfufqzwkjmd?s#`obpp>!wf`kmloldzab`hdqlvmg?b#`obpp>!nbmbdfnfmw%`lsz8#132ibubP`qjsw`kbqb`wfqpaqfbg`qvnawkfnpfoufpklqjylmwbodlufqmnfmw@bojelqmjbb`wjujwjfpgjp`lufqfgMbujdbwjlmwqbmpjwjlm`lmmf`wjlmmbujdbwjlmbssfbqbm`f?,wjwof=?n`kf`hal{!#wf`kmjrvfpsqlwf`wjlmbssbqfmwozbp#tfoo#bpvmw$/#$VB.qfplovwjlmlsfqbwjlmpwfofujpjlmwqbmpobwfgTbpkjmdwlmmbujdbwlq-#>#tjmglt-jnsqfppjlm%ow8aq%dw8ojwfqbwvqfslsvobwjlmad`lolq>! fpsf`jbooz#`lmwfmw>!sqlgv`wjlmmftpofwwfqsqlsfqwjfpgfejmjwjlmofbgfqpkjsWf`kmloldzSbqojbnfmw`lnsbqjplmvo#`obpp>!-jmgf{Le+!`lm`ovpjlmgjp`vppjlm`lnslmfmwpajloldj`boQfulovwjlm\\`lmwbjmfqvmgfqpwllgmlp`qjsw=?sfqnjppjlmfb`k#lwkfqbwnlpskfqf#lmel`vp>!?elqn#jg>!sql`fppjmdwkjp-ubovfdfmfqbwjlm@lmefqfm`fpvapfrvfmwtfoo.hmltmubqjbwjlmpqfsvwbwjlmskfmlnfmlmgjp`jsojmfoldl-smd!#+gl`vnfmw/alvmgbqjfpf{sqfppjlmpfwwofnfmwAb`hdqlvmglvw#le#wkffmwfqsqjpf+!kwwsp9!#vmfp`bsf+!sbpptlqg!#gfnl`qbwj`?b#kqfe>!,tqbssfq!=\tnfnafqpkjsojmdvjpwj`s{8sbggjmdskjolplskzbppjpwbm`fvmjufqpjwzeb`jojwjfpqf`ldmjyfgsqfefqfm`fje#+wzsflenbjmwbjmfgul`bavobqzkzslwkfpjp-pvanjw+*8%bns8maps8bmmlwbwjlmafkjmg#wkfElvmgbwjlmsvaojpkfq!bppvnswjlmjmwqlgv`fg`lqqvswjlmp`jfmwjpwpf{soj`jwozjmpwfbg#legjnfmpjlmp#lm@oj`h>!`lmpjgfqfggfsbqwnfmwl``vsbwjlmpllm#bewfqjmufpwnfmwsqlmlvm`fgjgfmwjejfgf{sfqjnfmwNbmbdfnfmwdfldqbskj`!#kfjdkw>!ojmh#qfo>!-qfsob`f+,gfsqfppjlm`lmefqfm`fsvmjpknfmwfojnjmbwfgqfpjpwbm`fbgbswbwjlmlsslpjwjlmtfoo#hmltmpvssofnfmwgfwfqnjmfgk2#`obpp>!3s{8nbqdjmnf`kbmj`bopwbwjpwj`p`fofaqbwfgDlufqmnfmw\t\tGvqjmd#wgfufolsfqpbqwjej`jbofrvjubofmwlqjdjmbwfg@lnnjppjlmbwwb`knfmw?psbm#jg>!wkfqf#tfqfMfgfqobmgpafzlmg#wkfqfdjpwfqfgilvqmbojpweqfrvfmwozboo#le#wkfobmd>!fm!#?,pwzof=\x0E\tbaplovwf8#pvsslqwjmdf{wqfnfoz#nbjmpwqfbn?,pwqlmd=#slsvobqjwzfnsolznfmw?,wbaof=\x0E\t#`lopsbm>!?,elqn=\t##`lmufqpjlmbalvw#wkf#?,s=?,gju=jmwfdqbwfg!#obmd>!fmSlqwvdvfpfpvapwjwvwfjmgjujgvbojnslppjaofnvowjnfgjbbonlpw#boos{#plojg# bsbqw#eqlnpvaif`w#wljm#Fmdojpk`qjwj`jyfgf{`fsw#elqdvjgfojmfplqjdjmboozqfnbqhbaofwkf#pf`lmgk1#`obpp>!?b#wjwof>!+jm`ovgjmdsbqbnfwfqpsqlkjajwfg>#!kwws9,,gj`wjlmbqzsfq`fswjlmqfulovwjlmelvmgbwjlms{8kfjdkw9pv``fppevopvsslqwfqpnjoofmmjvnkjp#ebwkfqwkf#%rvlw8ml.qfsfbw8`lnnfq`jbojmgvpwqjbofm`lvqbdfgbnlvmw#le#vmleej`jbofeej`jfm`zQfefqfm`fp`llqgjmbwfgjp`objnfqf{sfgjwjlmgfufolsjmd`bo`vobwfgpjnsojejfgofdjwjnbwfpvapwqjmd+3!#`obpp>!`lnsofwfozjoovpwqbwfejuf#zfbqpjmpwqvnfmwSvaojpkjmd2!#`obpp>!spz`kloldz`lmejgfm`fmvnafq#le#bapfm`f#leel`vpfg#lmiljmfg#wkfpwqv`wvqfpsqfujlvpoz=?,jeqbnf=lm`f#bdbjmavw#qbwkfqjnnjdqbmwple#`lvqpf/b#dqlvs#leOjwfqbwvqfVmojhf#wkf?,b=%maps8\tevm`wjlm#jw#tbp#wkf@lmufmwjlmbvwlnlajofSqlwfpwbmwbddqfppjufbewfq#wkf#Pjnjobqoz/!#,=?,gju=`loof`wjlm\x0E\tevm`wjlmujpjajojwzwkf#vpf#leulovmwffqpbwwqb`wjlmvmgfq#wkf#wkqfbwfmfg)?\"X@GBWBXjnslqwbm`fjm#dfmfqbowkf#obwwfq?,elqn=\t?,-jmgf{Le+$j#>#38#j#?gjeefqfm`fgfulwfg#wlwqbgjwjlmppfbq`k#elqvowjnbwfozwlvqmbnfmwbwwqjavwfppl.`boofg#~\t?,pwzof=fubovbwjlmfnskbpjyfgb``fppjaof?,pf`wjlm=pv``fppjlmbolmd#tjwkNfbmtkjof/jmgvpwqjfp?,b=?aq#,=kbp#af`lnfbpsf`wp#leWfofujpjlmpveej`jfmwabphfwabooalwk#pjgfp`lmwjmvjmdbm#bqwj`of?jnd#bow>!bgufmwvqfpkjp#nlwkfqnbm`kfpwfqsqjm`jsofpsbqwj`vobq`lnnfmwbqzfeef`wp#legf`jgfg#wl!=?pwqlmd=svaojpkfqpIlvqmbo#legjeej`vowzeb`jojwbwfb``fswbaofpwzof-`pp!\nevm`wjlm#jmmlubwjlm=@lszqjdkwpjwvbwjlmptlvog#kbufavpjmfppfpGj`wjlmbqzpwbwfnfmwplewfm#vpfgsfqpjpwfmwjm#Ibmvbqz`lnsqjpjmd?,wjwof=\t\ngjsolnbwj``lmwbjmjmdsfqelqnjmdf{wfmpjlmpnbz#mlw#af`lm`fsw#le#lm`oj`h>!Jw#jp#boplejmbm`jbo#nbhjmd#wkfOv{fnalvqdbggjwjlmbobqf#`boofgfmdbdfg#jm!p`qjsw!*8avw#jw#tbpfof`wqlmj`lmpvanjw>!\t?\"..#Fmg#fof`wqj`boleej`jboozpvddfpwjlmwls#le#wkfvmojhf#wkfBvpwqbojbmLqjdjmboozqfefqfm`fp\t?,kfbg=\x0E\tqf`ldmjpfgjmjwjbojyfojnjwfg#wlBof{bmgqjbqfwjqfnfmwBgufmwvqfpelvq#zfbqp\t\t%ow8\"..#jm`qfbpjmdgf`lqbwjlmk0#`obpp>!lqjdjmp#lelaojdbwjlmqfdvobwjlm`obppjejfg+evm`wjlm+bgubmwbdfpafjmd#wkf#kjpwlqjbmp?abpf#kqfeqfsfbwfgoztjoojmd#wl`lnsbqbaofgfpjdmbwfgmlnjmbwjlmevm`wjlmbojmpjgf#wkfqfufobwjlmfmg#le#wkfp#elq#wkf#bvwklqjyfgqfevpfg#wlwbhf#sob`fbvwlmlnlvp`lnsqlnjpfslojwj`bo#qfpwbvqbmwwtl#le#wkfEfaqvbqz#1rvbojwz#leptelaif`w-vmgfqpwbmgmfbqoz#bootqjwwfm#azjmwfqujftp!#tjgwk>!2tjwkgqbtboeolbw9ofewjp#vpvbooz`bmgjgbwfpmftpsbsfqpnzpwfqjlvpGfsbqwnfmwafpw#hmltmsbqojbnfmwpvssqfppfg`lmufmjfmwqfnfnafqfggjeefqfmw#pzpwfnbwj`kbp#ofg#wlsqlsbdbmgb`lmwqloofgjmeovfm`fp`fqfnlmjbosql`objnfgSqlwf`wjlmoj#`obpp>!P`jfmwjej``obpp>!ml.wqbgfnbqhpnlqf#wkbm#tjgfpsqfbgOjafqbwjlmwllh#sob`fgbz#le#wkfbp#olmd#bpjnsqjplmfgBggjwjlmbo\t?kfbg=\t?nObalqbwlqzMlufnafq#1f{`fswjlmpJmgvpwqjboubqjfwz#leeolbw9#ofeGvqjmd#wkfbppfppnfmwkbuf#affm#gfbop#tjwkPwbwjpwj`pl``vqqfm`f,vo=?,gju=`ofbqej{!=wkf#svaoj`nbmz#zfbqptkj`k#tfqflufq#wjnf/pzmlmznlvp`lmwfmw!=\tsqfpvnbaozkjp#ebnjozvpfqBdfmw-vmf{sf`wfgjm`ovgjmd#`kboofmdfgb#njmlqjwzvmgfejmfg!afolmdp#wlwbhfm#eqlnjm#L`wlafqslpjwjlm9#pbjg#wl#afqfojdjlvp#Efgfqbwjlm#qltpsbm>!lmoz#b#eftnfbmw#wkbwofg#wl#wkf..=\x0E\t?gju#?ejfogpfw=Bq`kajpkls#`obpp>!mlafjmd#vpfgbssqlb`kfpsqjujofdfpmlp`qjsw=\tqfpvowp#jmnbz#af#wkfFbpwfq#fddnf`kbmjpnpqfbplmbaofSlsvobwjlm@loof`wjlmpfof`wfg!=mlp`qjsw=\x0E,jmgf{-sksbqqjubo#le.ippgh$**8nbmbdfg#wljm`lnsofwf`bpvbowjfp`lnsofwjlm@kqjpwjbmpPfswfnafq#bqjwknfwj`sql`fgvqfpnjdkw#kbufSqlgv`wjlmjw#bssfbqpSkjolplskzeqjfmgpkjsofbgjmd#wldjujmd#wkfwltbqg#wkfdvbqbmwffggl`vnfmwfg`lolq9 333ujgfl#dbnf`lnnjppjlmqfeof`wjmd`kbmdf#wkfbppl`jbwfgpbmp.pfqjelmhfzsqfpp8#sbggjmd9Kf#tbp#wkfvmgfqozjmdwzsj`booz#/#bmg#wkf#pq`Fofnfmwpv``fppjufpjm`f#wkf#pklvog#af#mfwtlqhjmdb``lvmwjmdvpf#le#wkfoltfq#wkbmpkltp#wkbw?,psbm=\t\n\n`lnsobjmwp`lmwjmvlvprvbmwjwjfpbpwqlmlnfqkf#gjg#mlwgvf#wl#jwpbssojfg#wlbm#bufqbdffeelqwp#wlwkf#evwvqfbwwfnsw#wlWkfqfelqf/`bsbajojwzQfsvaoj`bmtbp#elqnfgFof`wqlmj`hjolnfwfqp`kboofmdfpsvaojpkjmdwkf#elqnfqjmgjdfmlvpgjqf`wjlmppvapjgjbqz`lmpsjqb`zgfwbjop#lebmg#jm#wkfbeelqgbaofpvapwbm`fpqfbplm#elq`lmufmwjlmjwfnwzsf>!baplovwfozpvsslpfgozqfnbjmfg#bbwwqb`wjufwqbufoojmdpfsbqbwfozel`vpfp#lmfofnfmwbqzbssoj`baofelvmg#wkbwpwzofpkffwnbmvp`qjswpwbmgp#elq#ml.qfsfbw+plnfwjnfp@lnnfq`jbojm#Bnfqj`bvmgfqwbhfmrvbqwfq#lebm#f{bnsofsfqplmboozjmgf{-sks<?,avwwlm=\tsfq`fmwbdfafpw.hmltm`qfbwjmd#b!#gjq>!owqOjfvwfmbmw\t?gju#jg>!wkfz#tlvogbajojwz#lenbgf#vs#lemlwfg#wkbw`ofbq#wkbwbqdvf#wkbwwl#bmlwkfq`kjogqfm$psvqslpf#leelqnvobwfgabpfg#vslmwkf#qfdjlmpvaif`w#lesbppfmdfqpslppfppjlm-\t\tJm#wkf#Afelqf#wkfbewfqtbqgp`vqqfmwoz#b`qlpp#wkfp`jfmwjej``lnnvmjwz-`bsjwbojpnjm#Dfqnbmzqjdkw.tjmdwkf#pzpwfnPl`jfwz#leslojwj`jbmgjqf`wjlm9tfmw#lm#wlqfnlubo#le#Mft#Zlqh#bsbqwnfmwpjmgj`bwjlmgvqjmd#wkfvmofpp#wkfkjpwlqj`bokbg#affm#bgfejmjwjufjmdqfgjfmwbwwfmgbm`f@fmwfq#elqsqlnjmfm`fqfbgzPwbwfpwqbwfdjfpavw#jm#wkfbp#sbqw#le`lmpwjwvwf`objn#wkbwobalqbwlqz`lnsbwjaofebjovqf#le/#pv`k#bp#afdbm#tjwkvpjmd#wkf#wl#sqlujgfefbwvqf#leeqln#tkj`k,!#`obpp>!dfloldj`bopfufqbo#legfojafqbwfjnslqwbmw#klogp#wkbwjmd%rvlw8#ubojdm>wlswkf#Dfqnbmlvwpjgf#lemfdlwjbwfgkjp#`bqffqpfsbqbwjlmjg>!pfbq`ktbp#`boofgwkf#elvqwkqf`qfbwjlmlwkfq#wkbmsqfufmwjlmtkjof#wkf#fgv`bwjlm/`lmmf`wjmdb``vqbwfoztfqf#avjowtbp#hjoofgbdqffnfmwpnv`k#nlqf#Gvf#wl#wkftjgwk9#233plnf#lwkfqHjmdgln#lewkf#fmwjqfebnlvp#elqwl#`lmmf`wlaif`wjufpwkf#Eqfm`ksflsof#bmgefbwvqfg!=jp#pbjg#wlpwqv`wvqboqfefqfmgvnnlpw#lewfmb#pfsbqbwf.=\t?gju#jg#Leej`jbo#tlqogtjgf-bqjb.obafowkf#sobmfwbmg#jw#tbpg!#ubovf>!ollhjmd#bwafmfej`jbobqf#jm#wkfnlmjwlqjmdqfslqwfgozwkf#nlgfqmtlqhjmd#lmbooltfg#wltkfqf#wkf#jmmlubwjuf?,b=?,gju=plvmgwqb`hpfbq`kElqnwfmg#wl#afjmsvw#jg>!lsfmjmd#leqfpwqj`wfgbglswfg#azbggqfppjmdwkfloldjbmnfwklgp#leubqjbmw#le@kqjpwjbm#ufqz#obqdfbvwlnlwjufaz#ebq#wkfqbmdf#eqlnsvqpvjw#leeloolt#wkfaqlvdkw#wljm#Fmdobmgbdqff#wkbwb``vpfg#le`lnfp#eqlnsqfufmwjmdgju#pwzof>kjp#lq#kfqwqfnfmglvpeqffgln#le`lm`fqmjmd3#2fn#2fn8Abphfwaboo,pwzof-`ppbm#fbqojfqfufm#bewfq,!#wjwof>!-`ln,jmgf{wbhjmd#wkfsjwwpavqdk`lmwfmw!=\x0E?p`qjsw=+ewvqmfg#lvwkbujmd#wkf?,psbm=\x0E\t#l``bpjlmboaf`bvpf#jwpwbqwfg#wlskzpj`booz=?,gju=\t##`qfbwfg#az@vqqfmwoz/#ad`lolq>!wbajmgf{>!gjpbpwqlvpBmbozwj`p#bopl#kbp#b=?gju#jg>!?,pwzof=\t?`boofg#elqpjmdfq#bmg-pq`#>#!,,ujlobwjlmpwkjp#sljmw`lmpwbmwozjp#ol`bwfgqf`lqgjmdpg#eqln#wkfmfgfqobmgpslqwvdv/Fp;N;};D;u;F5m4K4]4_7`gfpbqqlool`lnfmwbqjlfgv`b`j/_mpfswjfnaqfqfdjpwqbglgjqf``j/_mvaj`b`j/_msvaoj`jgbgqfpsvfpwbpqfpvowbglpjnslqwbmwfqfpfqubglpbqw/A`volpgjefqfmwfppjdvjfmwfpqfs/Vaoj`bpjwvb`j/_mnjmjpwfqjlsqjub`jgbggjqf`wlqjlelqnb`j/_mslaob`j/_msqfpjgfmwf`lmw", "fmjglpb``fplqjlpwf`kmlqbwjsfqplmbofp`bwfdlq/Abfpsf`jbofpgjpslmjaofb`wvbojgbgqfefqfm`jbuboobglojgajaojlwf`bqfob`jlmfp`bofmgbqjlslo/Awj`bpbmwfqjlqfpgl`vnfmwlpmbwvqbofybnbwfqjbofpgjefqfm`jbf`lm/_nj`bwqbmpslqwfqlgq/Advfysbqwj`jsbqfm`vfmwqbmgjp`vpj/_mfpwqv`wvqbevmgb`j/_meqf`vfmwfpsfqnbmfmwfwlwbonfmwf<P<R<Z<Q<R<]=o<X<Y=n<P<R<Z<Y=n<^=l<Y<P=c=n<\\<V<Z<Y=k=n<R<]=g<]<R<W<Y<Y<R=k<Y<Q=`=a=n<R<_<R<V<R<_<X<\\<S<R=m<W<Y<^=m<Y<_<R=m<\\<U=n<Y=k<Y=l<Y<[<P<R<_=o=n=m<\\<U=n<\\<Z<T<[<Q<T<P<Y<Z<X=o<]=o<X=o=n<s<R<T=m<V<[<X<Y=m=`<^<T<X<Y<R=m<^=c<[<T<Q=o<Z<Q<R=m<^<R<Y<U<W=b<X<Y<U<S<R=l<Q<R<P<Q<R<_<R<X<Y=n<Y<U=m<^<R<T=i<S=l<\\<^<\\=n<\\<V<R<U<P<Y=m=n<R<T<P<Y<Y=n<Z<T<[<Q=`<R<X<Q<R<U<W=o=k=d<Y<S<Y=l<Y<X=k<\\=m=n<T=k<\\=m=n=`=l<\\<]<R=n<Q<R<^=g=i<S=l<\\<^<R=m<R<]<R<U<S<R=n<R<P<P<Y<Q<Y<Y=k<T=m<W<Y<Q<R<^=g<Y=o=m<W=o<_<R<V<R<W<R<Q<\\<[<\\<X=n<\\<V<R<Y=n<R<_<X<\\<S<R=k=n<T<s<R=m<W<Y=n<\\<V<T<Y<Q<R<^=g<U=m=n<R<T=n=n<\\<V<T=i=m=l<\\<[=o<M<\\<Q<V=n=h<R=l=o<P<v<R<_<X<\\<V<Q<T<_<T=m<W<R<^<\\<Q<\\=d<Y<U<Q<\\<U=n<T=m<^<R<T<P=m<^=c<[=`<W=b<]<R<U=k<\\=m=n<R=m=l<Y<X<T<v=l<R<P<Y<H<R=l=o<P=l=g<Q<V<Y=m=n<\\<W<T<S<R<T=m<V=n=g=m=c=k<P<Y=m=c=j=j<Y<Q=n=l=n=l=o<X<\\=m<\\<P=g=i=l=g<Q<V<\\<q<R<^=g<U=k<\\=m<R<^<P<Y=m=n<\\=h<T<W=`<P<P<\\=l=n<\\=m=n=l<\\<Q<P<Y=m=n<Y=n<Y<V=m=n<Q<\\=d<T=i<P<T<Q=o=n<T<P<Y<Q<T<T<P<Y=b=n<Q<R<P<Y=l<_<R=l<R<X=m<\\<P<R<P=a=n<R<P=o<V<R<Q=j<Y=m<^<R<Y<P<V<\\<V<R<U<|=l=i<T<^5i5j4F4C5e4I4]4_4K5h4]4_4K5h4E4K5h4U4K5i5o4F4D5k4K4D4]4K5i4@4K5h5f5d5i4K5h4Y5d4]4@4C5f4C4E4K5h4U4Z5d4I4Z4K5m4E4K5h5n4_5i4K5h4U4K4D4F4A5i5f5h5i5h5m4K4F5i5h4F5n5e4F4U4C5f5h4K5h4X4U4]4O4B4D4K4]4F4[5d5f4]4U5h5f5o5i4I4]5m4K5n4[5h4D4K4F4K5h5h4V4E4F4]4F5f4D4K5h5j4K4_4K5h4X5f4B5i5j4F4C5f4K5h4U4]4D4K5h5n4Y4Y4K5m5h4K5i4U5h5f5k4K4F4A4C5f4G4K5h5h5k5i4K5h4U5i5h5i5o4F4D4E5f5i5o5j5o4K5h4[5m5h5m5f4C5f5d4I4C4K4]4E4F4K4]5f4B4K5h4Y4A4E4F4_4@5f5h4K5h5d5n4F4U5j4C5i4K5i4C5f5j4E4F4Y5i5f5i4O4]4X5f5m4K5h4\\5f5j4U4]4D5f4E4D5d4K4D4E4O5h4U4K4D4K5h4_5m4]5i4X4K5o5h4F4U4K5h5e4K5h4O5d5h4K5h4_5j4E4@4K5i4U4E4K5h4Y4A5m4K5h4C5f5j5o5h5i4K4F4K5h4B4K4Y4K5h5i5h5m4O4U4Z4K4M5o4F4K4D4E4K5h4B5f4]4]4_4K4J5h4K5h5n5h4D4K5h4O4C4D5i5n4K4[4U5i4]4K4_5h5i5j4[5n4E4K5h5o4F4D4K5h4]4@5h4K4X4F4]5o4K5h5n4C5i5f4U4[5f5opAzWbdMbnf+-isd!#bow>!2s{#plojg# -dje!#bow>!wqbmpsbqfmwjmelqnbwjlmbssoj`bwjlm!#lm`oj`h>!fpwbaojpkfgbgufqwjpjmd-smd!#bow>!fmujqlmnfmwsfqelqnbm`fbssqlsqjbwf%bns8ngbpk8jnnfgjbwfoz?,pwqlmd=?,qbwkfq#wkbmwfnsfqbwvqfgfufolsnfmw`lnsfwjwjlmsob`fklogfqujpjajojwz9`lszqjdkw!=3!#kfjdkw>!fufm#wklvdkqfsob`fnfmwgfpwjmbwjlm@lqslqbwjlm?vo#`obpp>!Bppl`jbwjlmjmgjujgvbopsfqpsf`wjufpfwWjnflvw+vqo+kwws9,,nbwkfnbwj`pnbqdjm.wls9fufmwvbooz#gfp`qjswjlm*#ml.qfsfbw`loof`wjlmp-ISD\x7Fwkvna\x7Fsbqwj`jsbwf,kfbg=?algzeolbw9ofew8?oj#`obpp>!kvmgqfgp#le\t\tKltfufq/#`lnslpjwjlm`ofbq9alwk8`llsfqbwjlmtjwkjm#wkf#obafo#elq>!alqgfq.wls9Mft#Yfbobmgqf`lnnfmgfgsklwldqbskzjmwfqfpwjmd%ow8pvs%dw8`lmwqlufqpzMfwkfqobmgpbowfqmbwjufnb{ofmdwk>!ptjwyfqobmgGfufolsnfmwfppfmwjbooz\t\tBowklvdk#?,wf{wbqfb=wkvmgfqajqgqfsqfpfmwfg%bns8mgbpk8psf`vobwjlm`lnnvmjwjfpofdjpobwjlmfof`wqlmj`p\t\n?gju#jg>!joovpwqbwfgfmdjmffqjmdwfqqjwlqjfpbvwklqjwjfpgjpwqjavwfg5!#kfjdkw>!pbmp.pfqje8`bsbaof#le#gjpbssfbqfgjmwfqb`wjufollhjmd#elqjw#tlvog#afBedkbmjpwbmtbp#`qfbwfgNbwk-eollq+pvqqlvmgjmd`bm#bopl#aflapfqubwjlmnbjmwfmbm`ffm`lvmwfqfg?k1#`obpp>!nlqf#qf`fmwjw#kbp#affmjmubpjlm#le*-dfwWjnf+*evmgbnfmwboGfpsjwf#wkf!=?gju#jg>!jmpsjqbwjlmf{bnjmbwjlmsqfsbqbwjlmf{sobmbwjlm?jmsvw#jg>!?,b=?,psbm=ufqpjlmp#lejmpwqvnfmwpafelqf#wkf##>#$kwws9,,Gfp`qjswjlmqfobwjufoz#-pvapwqjmd+fb`k#le#wkff{sfqjnfmwpjmeovfmwjbojmwfdqbwjlmnbmz#sflsofgvf#wl#wkf#`lnajmbwjlmgl#mlw#kbufNjggof#Fbpw?mlp`qjsw=?`lszqjdkw!#sfqkbsp#wkfjmpwjwvwjlmjm#Gf`fnafqbqqbmdfnfmwnlpw#ebnlvpsfqplmbojwz`qfbwjlm#leojnjwbwjlmpf{`ovpjufozplufqfjdmwz.`lmwfmw!=\t?wg#`obpp>!vmgfqdqlvmgsbqboofo#wlgl`wqjmf#lel``vsjfg#azwfqnjmloldzQfmbjppbm`fb#mvnafq#lepvsslqw#elqf{solqbwjlmqf`ldmjwjlmsqfgf`fpplq?jnd#pq`>!,?k2#`obpp>!svaoj`bwjlmnbz#bopl#afpsf`jbojyfg?,ejfogpfw=sqldqfppjufnjoojlmp#lepwbwfp#wkbwfmelq`fnfmwbqlvmg#wkf#lmf#bmlwkfq-sbqfmwMlgfbdqj`vowvqfBowfqmbwjufqfpfbq`kfqpwltbqgp#wkfNlpw#le#wkfnbmz#lwkfq#+fpsf`jbooz?wg#tjgwk>!8tjgwk9233&jmgfsfmgfmw?k0#`obpp>!#lm`kbmdf>!*-bgg@obpp+jmwfqb`wjlmLmf#le#wkf#gbvdkwfq#leb``fpplqjfpaqbm`kfp#le\x0E\t?gju#jg>!wkf#obqdfpwgf`obqbwjlmqfdvobwjlmpJmelqnbwjlmwqbmpobwjlmgl`vnfmwbqzjm#lqgfq#wl!=\t?kfbg=\t?!#kfjdkw>!2b`qlpp#wkf#lqjfmwbwjlm*8?,p`qjsw=jnsofnfmwfg`bm#af#pffmwkfqf#tbp#bgfnlmpwqbwf`lmwbjmfq!=`lmmf`wjlmpwkf#Aqjwjpktbp#tqjwwfm\"jnslqwbmw8s{8#nbqdjm.elooltfg#azbajojwz#wl#`lnsoj`bwfggvqjmd#wkf#jnnjdqbwjlmbopl#`boofg?k7#`obpp>!gjpwjm`wjlmqfsob`fg#azdlufqmnfmwpol`bwjlm#lejm#Mlufnafqtkfwkfq#wkf?,s=\t?,gju=b`rvjpjwjlm`boofg#wkf#sfqpf`vwjlmgfpjdmbwjlmxelmw.pjyf9bssfbqfg#jmjmufpwjdbwff{sfqjfm`fgnlpw#ojhfoztjgfoz#vpfggjp`vppjlmpsqfpfm`f#le#+gl`vnfmw-f{wfmpjufozJw#kbp#affmjw#glfp#mlw`lmwqbqz#wljmkbajwbmwpjnsqlufnfmwp`klobqpkjs`lmpvnswjlmjmpwqv`wjlmelq#f{bnsoflmf#lq#nlqfs{8#sbggjmdwkf#`vqqfmwb#pfqjfp#lebqf#vpvboozqlof#jm#wkfsqfujlvpoz#gfqjubwjufpfujgfm`f#lef{sfqjfm`fp`lolqp`kfnfpwbwfg#wkbw`fqwjej`bwf?,b=?,gju=\t#pfof`wfg>!kjdk#p`klloqfpslmpf#wl`lnelqwbaofbglswjlm#lewkqff#zfbqpwkf#`lvmwqzjm#Efaqvbqzpl#wkbw#wkfsflsof#tkl#sqlujgfg#az?sbqbn#mbnfbeef`wfg#azjm#wfqnp#lebssljmwnfmwJPL.;;6:.2!tbp#alqm#jmkjpwlqj`bo#qfdbqgfg#bpnfbpvqfnfmwjp#abpfg#lm#bmg#lwkfq#9#evm`wjlm+pjdmjej`bmw`fofaqbwjlmwqbmpnjwwfg,ip,irvfqz-jp#hmltm#bpwkflqfwj`bo#wbajmgf{>!jw#`lvog#af?mlp`qjsw=\tkbujmd#affm\x0E\t?kfbg=\x0E\t?#%rvlw8Wkf#`lnsjobwjlmkf#kbg#affmsqlgv`fg#azskjolplskfq`lmpwqv`wfgjmwfmgfg#wlbnlmd#lwkfq`lnsbqfg#wlwl#pbz#wkbwFmdjmffqjmdb#gjeefqfmwqfefqqfg#wlgjeefqfm`fpafojfe#wkbwsklwldqbskpjgfmwjezjmdKjpwlqz#le#Qfsvaoj`#lemf`fppbqjozsqlabajojwzwf`kmj`boozofbujmd#wkfpsf`wb`vobqeqb`wjlm#lefof`wqj`jwzkfbg#le#wkfqfpwbvqbmwpsbqwmfqpkjsfnskbpjp#lmnlpw#qf`fmwpkbqf#tjwk#pbzjmd#wkbwejoofg#tjwkgfpjdmfg#wljw#jp#lewfm!=?,jeqbnf=bp#elooltp9nfqdfg#tjwkwkqlvdk#wkf`lnnfq`jbo#sljmwfg#lvwlsslqwvmjwzujft#le#wkfqfrvjqfnfmwgjujpjlm#lesqldqbnnjmdkf#qf`fjufgpfwJmwfqubo!=?,psbm=?,jm#Mft#Zlqhbggjwjlmbo#`lnsqfppjlm\t\t?gju#jg>!jm`lqslqbwf8?,p`qjsw=?bwwb`kFufmwaf`bnf#wkf#!#wbqdfw>!\\`bqqjfg#lvwPlnf#le#wkfp`jfm`f#bmgwkf#wjnf#le@lmwbjmfq!=nbjmwbjmjmd@kqjpwlskfqNv`k#le#wkftqjwjmdp#le!#kfjdkw>!1pjyf#le#wkfufqpjlm#le#nj{wvqf#le#afwtffm#wkfF{bnsofp#lefgv`bwjlmbo`lnsfwjwjuf#lmpvanjw>!gjqf`wlq#legjpwjm`wjuf,GWG#[KWNO#qfobwjmd#wlwfmgfm`z#wlsqlujm`f#letkj`k#tlvoggfpsjwf#wkfp`jfmwjej`#ofdjpobwvqf-jmmfqKWNO#boofdbwjlmpBdqj`vowvqftbp#vpfg#jmbssqlb`k#wljmwfoojdfmwzfbqp#obwfq/pbmp.pfqjegfwfqnjmjmdSfqelqnbm`fbssfbqbm`fp/#tkj`k#jp#elvmgbwjlmpbaaqfujbwfgkjdkfq#wkbmp#eqln#wkf#jmgjujgvbo#`lnslpfg#lepvsslpfg#wl`objnp#wkbwbwwqjavwjlmelmw.pjyf92fofnfmwp#leKjpwlqj`bo#kjp#aqlwkfqbw#wkf#wjnfbmmjufqpbqzdlufqmfg#azqfobwfg#wl#vowjnbwfoz#jmmlubwjlmpjw#jp#pwjoo`bm#lmoz#afgfejmjwjlmpwlDNWPwqjmdB#mvnafq#lejnd#`obpp>!Fufmwvbooz/tbp#`kbmdfgl``vqqfg#jmmfjdkalqjmdgjpwjmdvjpktkfm#kf#tbpjmwqlgv`jmdwfqqfpwqjboNbmz#le#wkfbqdvfp#wkbwbm#Bnfqj`bm`lmrvfpw#letjgfpsqfbg#tfqf#hjoofgp`qffm#bmg#Jm#lqgfq#wlf{sf`wfg#wlgfp`fmgbmwpbqf#ol`bwfgofdjpobwjufdfmfqbwjlmp#ab`hdqlvmgnlpw#sflsofzfbqp#bewfqwkfqf#jp#mlwkf#kjdkfpweqfrvfmwoz#wkfz#gl#mlwbqdvfg#wkbwpkltfg#wkbwsqfglnjmbmwwkfloldj`boaz#wkf#wjnf`lmpjgfqjmdpklqw.ojufg?,psbm=?,b=`bm#af#vpfgufqz#ojwwoflmf#le#wkf#kbg#boqfbgzjmwfqsqfwfg`lnnvmj`bwfefbwvqfp#ledlufqmnfmw/?,mlp`qjsw=fmwfqfg#wkf!#kfjdkw>!0Jmgfsfmgfmwslsvobwjlmpobqdf.p`bof-#Bowklvdk#vpfg#jm#wkfgfpwqv`wjlmslppjajojwzpwbqwjmd#jmwtl#lq#nlqff{sqfppjlmppvalqgjmbwfobqdfq#wkbmkjpwlqz#bmg?,lswjlm=\x0E\t@lmwjmfmwbofojnjmbwjmdtjoo#mlw#afsqb`wj`f#lejm#eqlmw#lepjwf#le#wkffmpvqf#wkbwwl#`qfbwf#bnjppjppjssjslwfmwjboozlvwpwbmgjmdafwwfq#wkbmtkbw#jp#mltpjwvbwfg#jmnfwb#mbnf>!WqbgjwjlmbopvddfpwjlmpWqbmpobwjlmwkf#elqn#lebwnlpskfqj`jgfloldj`bofmwfqsqjpfp`bo`vobwjmdfbpw#le#wkfqfnmbmwp#lesovdjmpsbdf,jmgf{-sks<qfnbjmfg#jmwqbmpelqnfgKf#tbp#bopltbp#boqfbgzpwbwjpwj`bojm#ebulq#leNjmjpwqz#lenlufnfmw#leelqnvobwjlmjp#qfrvjqfg?ojmh#qfo>!Wkjp#jp#wkf#?b#kqfe>!,slsvobqjyfgjmuloufg#jmbqf#vpfg#wlbmg#pfufqbonbgf#az#wkfpffnp#wl#afojhfoz#wkbwSbofpwjmjbmmbnfg#bewfqjw#kbg#affmnlpw#`lnnlmwl#qfefq#wlavw#wkjp#jp`lmpf`vwjufwfnslqbqjozJm#dfmfqbo/`lmufmwjlmpwbhfp#sob`fpvagjujpjlmwfqqjwlqjbolsfqbwjlmbosfqnbmfmwoztbp#obqdfozlvwaqfbh#lejm#wkf#sbpwelooltjmd#b#{nomp9ld>!=?b#`obpp>!`obpp>!wf{w@lmufqpjlm#nbz#af#vpfgnbmveb`wvqfbewfq#afjmd`ofbqej{!=\trvfpwjlm#letbp#fof`wfgwl#af`lnf#baf`bvpf#le#plnf#sflsofjmpsjqfg#azpv``fppevo#b#wjnf#tkfmnlqf#`lnnlmbnlmdpw#wkfbm#leej`jbotjgwk9233&8wf`kmloldz/tbp#bglswfgwl#hffs#wkfpfwwofnfmwpojuf#ajqwkpjmgf{-kwno!@lmmf`wj`vwbppjdmfg#wl%bns8wjnfp8b``lvmw#elqbojdm>qjdkwwkf#`lnsbmzbotbzp#affmqfwvqmfg#wljmuloufnfmwAf`bvpf#wkfwkjp#sfqjlg!#mbnf>!r!#`lmejmfg#wlb#qfpvow#leubovf>!!#,=jp#b`wvboozFmujqlmnfmw\x0E\t?,kfbg=\x0E\t@lmufqpfoz/=\t?gju#jg>!3!#tjgwk>!2jp#sqlabaozkbuf#af`lnf`lmwqloojmdwkf#sqlaofn`jwjyfmp#leslojwj`jbmpqfb`kfg#wkfbp#fbqoz#bp9mlmf8#lufq?wbaof#`fooubojgjwz#legjqf`woz#wllmnlvpfgltmtkfqf#jw#jptkfm#jw#tbpnfnafqp#le#qfobwjlm#wlb``lnnlgbwfbolmd#tjwk#Jm#wkf#obwfwkf#Fmdojpkgfoj`jlvp!=wkjp#jp#mlwwkf#sqfpfmwje#wkfz#bqfbmg#ejmboozb#nbwwfq#le\x0E\t\n?,gju=\x0E\t\x0E\t?,p`qjsw=ebpwfq#wkbmnbilqjwz#lebewfq#tkj`k`lnsbqbwjufwl#nbjmwbjmjnsqluf#wkfbtbqgfg#wkffq!#`obpp>!eqbnfalqgfqqfpwlqbwjlmjm#wkf#pbnfbmbozpjp#lewkfjq#ejqpwGvqjmd#wkf#`lmwjmfmwbopfrvfm`f#leevm`wjlm+*xelmw.pjyf9#tlqh#lm#wkf?,p`qjsw=\t?afdjmp#tjwkibubp`qjsw9`lmpwjwvfmwtbp#elvmgfgfrvjojaqjvnbppvnf#wkbwjp#djufm#azmffgp#wl#af`llqgjmbwfpwkf#ubqjlvpbqf#sbqw#lelmoz#jm#wkfpf`wjlmp#lejp#b#`lnnlmwkflqjfp#legjp`lufqjfpbppl`jbwjlmfgdf#le#wkfpwqfmdwk#leslpjwjlm#jmsqfpfmw.gbzvmjufqpboozwl#elqn#wkfavw#jmpwfbg`lqslqbwjlmbwwb`kfg#wljp#`lnnlmozqfbplmp#elq#%rvlw8wkf#`bm#af#nbgftbp#baof#wltkj`k#nfbmpavw#gjg#mlwlmNlvpfLufqbp#slppjaoflsfqbwfg#az`lnjmd#eqlnwkf#sqjnbqzbggjwjlm#leelq#pfufqbowqbmpefqqfgb#sfqjlg#lebqf#baof#wlkltfufq/#jwpklvog#kbufnv`k#obqdfq\t\n?,p`qjsw=bglswfg#wkfsqlsfqwz#legjqf`wfg#azfeef`wjufoztbp#aqlvdkw`kjogqfm#leSqldqbnnjmdolmdfq#wkbmnbmvp`qjswptbq#bdbjmpwaz#nfbmp#lebmg#nlpw#lepjnjobq#wl#sqlsqjfwbqzlqjdjmbwjmdsqfpwjdjlvpdqbnnbwj`bof{sfqjfm`f-wl#nbhf#wkfJw#tbp#bopljp#elvmg#jm`lnsfwjwlqpjm#wkf#V-P-qfsob`f#wkfaqlvdkw#wkf`bo`vobwjlmeboo#le#wkfwkf#dfmfqbosqb`wj`boozjm#klmlq#leqfofbpfg#jmqfpjgfmwjbobmg#plnf#lehjmd#le#wkfqfb`wjlm#wl2pw#Fbqo#le`vowvqf#bmgsqjm`jsbooz?,wjwof=\t##wkfz#`bm#afab`h#wl#wkfplnf#le#kjpf{slpvqf#wlbqf#pjnjobqelqn#le#wkfbggEbulqjwf`jwjyfmpkjssbqw#jm#wkfsflsof#tjwkjm#sqb`wj`fwl#`lmwjmvf%bns8njmvp8bssqlufg#az#wkf#ejqpw#booltfg#wkfbmg#elq#wkfevm`wjlmjmdsobzjmd#wkfplovwjlm#wlkfjdkw>!3!#jm#kjp#allhnlqf#wkbm#belooltp#wkf`qfbwfg#wkfsqfpfm`f#jm%maps8?,wg=mbwjlmbojpwwkf#jgfb#leb#`kbqb`wfqtfqf#elq`fg#`obpp>!awmgbzp#le#wkfefbwvqfg#jmpkltjmd#wkfjmwfqfpw#jmjm#sob`f#lewvqm#le#wkfwkf#kfbg#leOlqg#le#wkfslojwj`boozkbp#jwp#ltmFgv`bwjlmbobssqlubo#leplnf#le#wkffb`k#lwkfq/afkbujlq#lebmg#af`bvpfbmg#bmlwkfqbssfbqfg#lmqf`lqgfg#jmaob`h%rvlw8nbz#jm`ovgfwkf#tlqog$p`bm#ofbg#wlqfefqp#wl#balqgfq>!3!#dlufqmnfmw#tjmmjmd#wkfqfpvowfg#jm#tkjof#wkf#Tbpkjmdwlm/wkf#pvaif`w`jwz#jm#wkf=?,gju=\x0E\t\n\nqfeof`w#wkfwl#`lnsofwfaf`bnf#nlqfqbgjlb`wjufqfif`wfg#aztjwklvw#bmzkjp#ebwkfq/tkj`k#`lvog`lsz#le#wkfwl#jmgj`bwfb#slojwj`bob``lvmwp#le`lmpwjwvwfptlqhfg#tjwkfq?,b=?,oj=le#kjp#ojefb``lnsbmjfg`ojfmwTjgwksqfufmw#wkfOfdjpobwjufgjeefqfmwozwldfwkfq#jmkbp#pfufqboelq#bmlwkfqwf{w#le#wkfelvmgfg#wkff#tjwk#wkf#jp#vpfg#elq`kbmdfg#wkfvpvbooz#wkfsob`f#tkfqftkfqfbp#wkf=#?b#kqfe>!!=?b#kqfe>!wkfnpfoufp/bowklvdk#kfwkbw#`bm#afwqbgjwjlmboqlof#le#wkfbp#b#qfpvowqfnluf@kjoggfpjdmfg#aztfpw#le#wkfPlnf#sflsofsqlgv`wjlm/pjgf#le#wkfmftpofwwfqpvpfg#az#wkfgltm#wl#wkfb``fswfg#azojuf#jm#wkfbwwfnswp#wllvwpjgf#wkfeqfrvfm`jfpKltfufq/#jmsqldqbnnfqpbw#ofbpw#jmbssql{jnbwfbowklvdk#jwtbp#sbqw#lebmg#ubqjlvpDlufqmlq#lewkf#bqwj`ofwvqmfg#jmwl=?b#kqfe>!,wkf#f`lmlnzjp#wkf#nlpwnlpw#tjgfoztlvog#obwfqbmg#sfqkbspqjpf#wl#wkfl``vqp#tkfmvmgfq#tkj`k`lmgjwjlmp-wkf#tfpwfqmwkflqz#wkbwjp#sqlgv`fgwkf#`jwz#lejm#tkj`k#kfpffm#jm#wkfwkf#`fmwqboavjogjmd#lenbmz#le#kjpbqfb#le#wkfjp#wkf#lmoznlpw#le#wkfnbmz#le#wkfwkf#TfpwfqmWkfqf#jp#mlf{wfmgfg#wlPwbwjpwj`bo`lopsbm>1#\x7Fpklqw#pwlqzslppjaof#wlwlsloldj`bo`qjwj`bo#leqfslqwfg#wlb#@kqjpwjbmgf`jpjlm#wljp#frvbo#wlsqlaofnp#leWkjp#`bm#afnfq`kbmgjpfelq#nlpw#leml#fujgfm`ffgjwjlmp#lefofnfmwp#jm%rvlw8-#Wkf`ln,jnbdfp,tkj`k#nbhfpwkf#sql`fppqfnbjmp#wkfojwfqbwvqf/jp#b#nfnafqwkf#slsvobqwkf#bm`jfmwsqlaofnp#jmwjnf#le#wkfgfefbwfg#azalgz#le#wkfb#eft#zfbqpnv`k#le#wkfwkf#tlqh#le@bojelqmjb/pfqufg#bp#bdlufqmnfmw-`lm`fswp#lenlufnfmw#jm\n\n?gju#jg>!jw!#ubovf>!obmdvbdf#lebp#wkfz#bqfsqlgv`fg#jmjp#wkbw#wkff{sobjm#wkfgju=?,gju=\tKltfufq#wkfofbg#wl#wkf\n?b#kqfe>!,tbp#dqbmwfgsflsof#kbuf`lmwjmvbooztbp#pffm#bpbmg#qfobwfgwkf#qlof#lesqlslpfg#azle#wkf#afpwfb`k#lwkfq-@lmpwbmwjmfsflsof#eqlngjbof`wp#lewl#qfujpjlmtbp#qfmbnfgb#plvq`f#lewkf#jmjwjboobvm`kfg#jmsqlujgf#wkfwl#wkf#tfpwtkfqf#wkfqfbmg#pjnjobqafwtffm#wtljp#bopl#wkfFmdojpk#bmg`lmgjwjlmp/wkbw#jw#tbpfmwjwofg#wlwkfnpfoufp-rvbmwjwz#leqbmpsbqfm`zwkf#pbnf#bpwl#iljm#wkf`lvmwqz#bmgwkjp#jp#wkfWkjp#ofg#wlb#pwbwfnfmw`lmwqbpw#wlobpwJmgf{Lewkqlvdk#kjpjp#gfpjdmfgwkf#wfqn#jpjp#sqlujgfgsqlwf`w#wkfmd?,b=?,oj=Wkf#`vqqfmwwkf#pjwf#lepvapwbmwjbof{sfqjfm`f/jm#wkf#Tfpwwkfz#pklvogpolufm(ajmb`lnfmwbqjlpvmjufqpjgbg`lmgj`jlmfpb`wjujgbgfpf{sfqjfm`jbwf`mlold/Absqlgv``j/_msvmwvb`j/_mbsoj`b`j/_m`lmwqbpf/]b`bwfdlq/Abpqfdjpwqbqpfsqlefpjlmbowqbwbnjfmwlqfd/Apwqbwfpf`qfwbq/Absqjm`jsbofpsqlwf``j/_mjnslqwbmwfpjnslqwbm`jbslpjajojgbgjmwfqfpbmwf`qf`jnjfmwlmf`fpjgbgfppvp`qjajqpfbpl`jb`j/_mgjpslmjaofpfubovb`j/_mfpwvgjbmwfpqfpslmpbaofqfplov`j/_mdvbgbobibqbqfdjpwqbglplslqwvmjgbg`lnfq`jbofpelwldqbe/Abbvwlqjgbgfpjmdfmjfq/Abwfofujpj/_m`lnsfwfm`jblsfqb`jlmfpfpwbaof`jglpjnsofnfmwfb`wvbonfmwfmbufdb`j/_m`lmelqnjgbgojmf.kfjdkw9elmw.ebnjoz9!#9#!kwws9,,bssoj`bwjlmpojmh!#kqfe>!psf`jej`booz,,?\"X@GBWBX\tLqdbmjybwjlmgjpwqjavwjlm3s{8#kfjdkw9qfobwjlmpkjsgfuj`f.tjgwk?gju#`obpp>!?obafo#elq>!qfdjpwqbwjlm?,mlp`qjsw=\t,jmgf{-kwno!tjmglt-lsfm+#\"jnslqwbmw8bssoj`bwjlm,jmgfsfmgfm`f,,ttt-dlldoflqdbmjybwjlmbvwl`lnsofwfqfrvjqfnfmwp`lmpfqubwjuf?elqn#mbnf>!jmwfoof`wvbonbqdjm.ofew92;wk#`fmwvqzbm#jnslqwbmwjmpwjwvwjlmpbaaqfujbwjlm?jnd#`obpp>!lqdbmjpbwjlm`jujojybwjlm2:wk#`fmwvqzbq`kjwf`wvqfjm`lqslqbwfg13wk#`fmwvqz.`lmwbjmfq!=nlpw#mlwbaoz,=?,b=?,gju=mlwjej`bwjlm$vmgfejmfg$*Evqwkfqnlqf/afojfuf#wkbwjmmfqKWNO#>#sqjlq#wl#wkfgqbnbwj`boozqfefqqjmd#wlmfdlwjbwjlmpkfbgrvbqwfqpPlvwk#Beqj`bvmpv``fppevoSfmmpzoubmjbBp#b#qfpvow/?kwno#obmd>!%ow8,pvs%dw8gfbojmd#tjwkskjobgfoskjbkjpwlqj`booz*8?,p`qjsw=\tsbggjmd.wls9f{sfqjnfmwbodfwBwwqjavwfjmpwqv`wjlmpwf`kmloldjfpsbqw#le#wkf#>evm`wjlm+*xpvap`qjswjlmo-gwg!=\x0E\t?kwdfldqbskj`bo@lmpwjwvwjlm$/#evm`wjlm+pvsslqwfg#azbdqj`vowvqbo`lmpwqv`wjlmsvaoj`bwjlmpelmw.pjyf9#2b#ubqjfwz#le?gju#pwzof>!Fm`z`olsfgjbjeqbnf#pq`>!gfnlmpwqbwfgb``lnsojpkfgvmjufqpjwjfpGfnldqbskj`p*8?,p`qjsw=?gfgj`bwfg#wlhmltofgdf#lepbwjpeb`wjlmsbqwj`vobqoz?,gju=?,gju=Fmdojpk#+VP*bssfmg@kjog+wqbmpnjppjlmp-#Kltfufq/#jmwfoojdfm`f!#wbajmgf{>!eolbw9qjdkw8@lnnlmtfbowkqbmdjmd#eqlnjm#tkj`k#wkfbw#ofbpw#lmfqfsqlgv`wjlmfm`z`olsfgjb8elmw.pjyf92ivqjpgj`wjlmbw#wkbw#wjnf!=?b#`obpp>!Jm#bggjwjlm/gfp`qjswjlm(`lmufqpbwjlm`lmwb`w#tjwkjp#dfmfqboozq!#`lmwfmw>!qfsqfpfmwjmd%ow8nbwk%dw8sqfpfmwbwjlml``bpjlmbooz?jnd#tjgwk>!mbujdbwjlm!=`lnsfmpbwjlm`kbnsjlmpkjsnfgjb>!boo!#ujlobwjlm#leqfefqfm`f#wlqfwvqm#wqvf8Pwqj`w,,FM!#wqbmpb`wjlmpjmwfqufmwjlmufqjej`bwjlmJmelqnbwjlm#gjeej`vowjfp@kbnsjlmpkjs`bsbajojwjfp?\"Xfmgje^..=~\t?,p`qjsw=\t@kqjpwjbmjwzelq#f{bnsof/Sqlefppjlmboqfpwqj`wjlmppvddfpw#wkbwtbp#qfofbpfg+pv`k#bp#wkfqfnluf@obpp+vmfnsolznfmwwkf#Bnfqj`bmpwqv`wvqf#le,jmgf{-kwno#svaojpkfg#jmpsbm#`obpp>!!=?b#kqfe>!,jmwqlgv`wjlmafolmdjmd#wl`objnfg#wkbw`lmpfrvfm`fp?nfwb#mbnf>!Dvjgf#wl#wkflufqtkfonjmdbdbjmpw#wkf#`lm`fmwqbwfg/\t-mlmwlv`k#lapfqubwjlmp?,b=\t?,gju=\te#+gl`vnfmw-alqgfq9#2s{#xelmw.pjyf92wqfbwnfmw#le3!#kfjdkw>!2nlgjej`bwjlmJmgfsfmgfm`fgjujgfg#jmwldqfbwfq#wkbmb`kjfufnfmwpfpwbaojpkjmdIbubP`qjsw!#mfufqwkfofpppjdmjej`bm`fAqlbg`bpwjmd=%maps8?,wg=`lmwbjmfq!=\tpv`k#bp#wkf#jmeovfm`f#leb#sbqwj`vobqpq`>$kwws9,,mbujdbwjlm!#kboe#le#wkf#pvapwbmwjbo#%maps8?,gju=bgubmwbdf#legjp`lufqz#leevmgbnfmwbo#nfwqlslojwbmwkf#lsslpjwf!#{no9obmd>!gfojafqbwfozbojdm>`fmwfqfulovwjlm#lesqfpfqubwjlmjnsqlufnfmwpafdjmmjmd#jmIfpvp#@kqjpwSvaoj`bwjlmpgjpbdqffnfmwwf{w.bojdm9q/#evm`wjlm+*pjnjobqjwjfpalgz=?,kwno=jp#`vqqfmwozboskbafwj`bojp#plnfwjnfpwzsf>!jnbdf,nbmz#le#wkf#eolt9kjggfm8bubjobaof#jmgfp`qjaf#wkff{jpwfm`f#leboo#lufq#wkfwkf#Jmwfqmfw\n?vo#`obpp>!jmpwboobwjlmmfjdkalqkllgbqnfg#elq`fpqfgv`jmd#wkf`lmwjmvfp#wlMlmfwkfofpp/wfnsfqbwvqfp\t\n\n?b#kqfe>!`olpf#wl#wkff{bnsofp#le#jp#balvw#wkf+pff#afolt*-!#jg>!pfbq`ksqlefppjlmbojp#bubjobaofwkf#leej`jbo\n\n?,p`qjsw=\t\t\n\n?gju#jg>!b``fofqbwjlmwkqlvdk#wkf#Kboo#le#Ebnfgfp`qjswjlmpwqbmpobwjlmpjmwfqefqfm`f#wzsf>$wf{w,qf`fmw#zfbqpjm#wkf#tlqogufqz#slsvobqxab`hdqlvmg9wqbgjwjlmbo#plnf#le#wkf#`lmmf`wfg#wlf{soljwbwjlmfnfqdfm`f#le`lmpwjwvwjlmB#Kjpwlqz#lepjdmjej`bmw#nbmveb`wvqfgf{sf`wbwjlmp=?mlp`qjsw=?`bm#af#elvmgaf`bvpf#wkf#kbp#mlw#affmmfjdkalvqjmdtjwklvw#wkf#bggfg#wl#wkf\n?oj#`obpp>!jmpwqvnfmwboPlujfw#Vmjlmb`hmltofgdfgtkj`k#`bm#afmbnf#elq#wkfbwwfmwjlm#wlbwwfnswp#wl#gfufolsnfmwpJm#eb`w/#wkf?oj#`obpp>!bjnsoj`bwjlmppvjwbaof#elqnv`k#le#wkf#`lolmjybwjlmsqfpjgfmwjbo`bm`foAvaaof#Jmelqnbwjlmnlpw#le#wkf#jp#gfp`qjafgqfpw#le#wkf#nlqf#lq#ofppjm#PfswfnafqJmwfoojdfm`fpq`>!kwws9,,s{8#kfjdkw9#bubjobaof#wlnbmveb`wvqfqkvnbm#qjdkwpojmh#kqfe>!,bubjobajojwzsqlslqwjlmbolvwpjgf#wkf#bpwqlmlnj`bokvnbm#afjmdpmbnf#le#wkf#bqf#elvmg#jmbqf#abpfg#lmpnboofq#wkbmb#sfqplm#tklf{sbmpjlm#lebqdvjmd#wkbwmlt#hmltm#bpJm#wkf#fbqozjmwfqnfgjbwfgfqjufg#eqlnP`bmgjmbujbm?,b=?,gju=\x0E\t`lmpjgfq#wkfbm#fpwjnbwfgwkf#Mbwjlmbo?gju#jg>!sbdqfpvowjmd#jm`lnnjppjlmfgbmboldlvp#wlbqf#qfrvjqfg,vo=\t?,gju=\ttbp#abpfg#lmbmg#af`bnf#b%maps8%maps8w!#ubovf>!!#tbp#`bswvqfgml#nlqf#wkbmqfpsf`wjufoz`lmwjmvf#wl#=\x0E\t?kfbg=\x0E\t?tfqf#`qfbwfgnlqf#dfmfqbojmelqnbwjlm#vpfg#elq#wkfjmgfsfmgfmw#wkf#Jnsfqjbo`lnslmfmw#lewl#wkf#mlqwkjm`ovgf#wkf#@lmpwqv`wjlmpjgf#le#wkf#tlvog#mlw#afelq#jmpwbm`fjmufmwjlm#lenlqf#`lnsof{`loof`wjufozab`hdqlvmg9#wf{w.bojdm9#jwp#lqjdjmbojmwl#b``lvmwwkjp#sql`fppbm#f{wfmpjufkltfufq/#wkfwkfz#bqf#mlwqfif`wfg#wkf`qjwj`jpn#legvqjmd#tkj`ksqlabaoz#wkfwkjp#bqwj`of+evm`wjlm+*xJw#pklvog#afbm#bdqffnfmwb``jgfmwboozgjeefqp#eqlnBq`kjwf`wvqfafwwfq#hmltmbqqbmdfnfmwpjmeovfm`f#lmbwwfmgfg#wkfjgfmwj`bo#wlplvwk#le#wkfsbpp#wkqlvdk{no!#wjwof>!tfjdkw9alog8`qfbwjmd#wkfgjpsobz9mlmfqfsob`fg#wkf?jnd#pq`>!,jkwwsp9,,ttt-Tlqog#Tbq#JJwfpwjnlmjbopelvmg#jm#wkfqfrvjqfg#wl#bmg#wkbw#wkfafwtffm#wkf#tbp#gfpjdmfg`lmpjpwp#le#`lmpjgfqbaozsvaojpkfg#azwkf#obmdvbdf@lmpfqubwjlm`lmpjpwfg#leqfefq#wl#wkfab`h#wl#wkf#`pp!#nfgjb>!Sflsof#eqln#bubjobaof#lmsqlufg#wl#afpvddfpwjlmp!tbp#hmltm#bpubqjfwjfp#leojhfoz#wl#af`lnsqjpfg#lepvsslqw#wkf#kbmgp#le#wkf`lvsofg#tjwk`lmmf`w#bmg#alqgfq9mlmf8sfqelqnbm`fpafelqf#afjmdobwfq#af`bnf`bo`vobwjlmplewfm#`boofgqfpjgfmwp#lenfbmjmd#wkbw=?oj#`obpp>!fujgfm`f#elqf{sobmbwjlmpfmujqlmnfmwp!=?,b=?,gju=tkj`k#booltpJmwqlgv`wjlmgfufolsfg#azb#tjgf#qbmdflm#afkboe#leubojdm>!wls!sqjm`jsof#lebw#wkf#wjnf/?,mlp`qjsw=\x0Epbjg#wl#kbufjm#wkf#ejqpwtkjof#lwkfqpkzslwkfwj`boskjolplskfqpsltfq#le#wkf`lmwbjmfg#jmsfqelqnfg#azjmbajojwz#wltfqf#tqjwwfmpsbm#pwzof>!jmsvw#mbnf>!wkf#rvfpwjlmjmwfmgfg#elqqfif`wjlm#lejnsojfp#wkbwjmufmwfg#wkfwkf#pwbmgbqgtbp#sqlabaozojmh#afwtffmsqlefpplq#lejmwfqb`wjlmp`kbmdjmd#wkfJmgjbm#L`fbm#`obpp>!obpwtlqhjmd#tjwk$kwws9,,ttt-zfbqp#afelqfWkjp#tbp#wkfqf`qfbwjlmbofmwfqjmd#wkfnfbpvqfnfmwpbm#f{wqfnfozubovf#le#wkfpwbqw#le#wkf\t?,p`qjsw=\t\tbm#feelqw#wljm`qfbpf#wkfwl#wkf#plvwkpsb`jmd>!3!=pveej`jfmwozwkf#Fvqlsfbm`lmufqwfg#wl`ofbqWjnflvwgjg#mlw#kbuf`lmpfrvfmwozelq#wkf#mf{wf{wfmpjlm#lef`lmlnj`#bmgbowklvdk#wkfbqf#sqlgv`fgbmg#tjwk#wkfjmpveej`jfmwdjufm#az#wkfpwbwjmd#wkbwf{sfmgjwvqfp?,psbm=?,b=\twklvdkw#wkbwlm#wkf#abpjp`foosbggjmd>jnbdf#le#wkfqfwvqmjmd#wljmelqnbwjlm/pfsbqbwfg#azbppbppjmbwfgp!#`lmwfmw>!bvwklqjwz#lemlqwktfpwfqm?,gju=\t?gju#!=?,gju=\x0E\t##`lmpvowbwjlm`lnnvmjwz#lewkf#mbwjlmbojw#pklvog#afsbqwj`jsbmwp#bojdm>!ofewwkf#dqfbwfpwpfof`wjlm#lepvsfqmbwvqbogfsfmgfmw#lmjp#nfmwjlmfgbooltjmd#wkftbp#jmufmwfgb``lnsbmzjmdkjp#sfqplmbobubjobaof#bwpwvgz#le#wkflm#wkf#lwkfqf{f`vwjlm#leKvnbm#Qjdkwpwfqnp#le#wkfbppl`jbwjlmpqfpfbq`k#bmgpv``ffgfg#azgfefbwfg#wkfbmg#eqln#wkfavw#wkfz#bqf`lnnbmgfq#lepwbwf#le#wkfzfbqp#le#bdfwkf#pwvgz#le?vo#`obpp>!psob`f#jm#wkftkfqf#kf#tbp?oj#`obpp>!ewkfqf#bqf#mltkj`k#af`bnfkf#svaojpkfgf{sqfppfg#jmwl#tkj`k#wkf`lnnjppjlmfqelmw.tfjdkw9wfqqjwlqz#lef{wfmpjlmp!=Qlnbm#Fnsjqffrvbo#wl#wkfJm#`lmwqbpw/kltfufq/#bmgjp#wzsj`boozbmg#kjp#tjef+bopl#`boofg=?vo#`obpp>!feef`wjufoz#fuloufg#jmwlpffn#wl#kbuftkj`k#jp#wkfwkfqf#tbp#mlbm#f{`foofmwboo#le#wkfpfgfp`qjafg#azJm#sqb`wj`f/aqlbg`bpwjmd`kbqdfg#tjwkqfeof`wfg#jmpvaif`wfg#wlnjojwbqz#bmgwl#wkf#sljmwf`lmlnj`boozpfwWbqdfwjmdbqf#b`wvboozuj`wlqz#lufq+*8?,p`qjsw=`lmwjmvlvpozqfrvjqfg#elqfulovwjlmbqzbm#feef`wjufmlqwk#le#wkf/#tkj`k#tbp#eqlmw#le#wkflq#lwkfqtjpfplnf#elqn#lekbg#mlw#affmdfmfqbwfg#azjmelqnbwjlm-sfqnjwwfg#wljm`ovgfp#wkfgfufolsnfmw/fmwfqfg#jmwlwkf#sqfujlvp`lmpjpwfmwozbqf#hmltm#bpwkf#ejfog#lewkjp#wzsf#ledjufm#wl#wkfwkf#wjwof#le`lmwbjmp#wkfjmpwbm`fp#lejm#wkf#mlqwkgvf#wl#wkfjqbqf#gfpjdmfg`lqslqbwjlmptbp#wkbw#wkflmf#le#wkfpfnlqf#slsvobqpv``ffgfg#jmpvsslqw#eqlnjm#gjeefqfmwglnjmbwfg#azgfpjdmfg#elqltmfqpkjs#lebmg#slppjaozpwbmgbqgjyfgqfpslmpfWf{wtbp#jmwfmgfgqf`fjufg#wkfbppvnfg#wkbwbqfbp#le#wkfsqjnbqjoz#jmwkf#abpjp#lejm#wkf#pfmpfb``lvmwp#elqgfpwqlzfg#azbw#ofbpw#wtltbp#gf`obqfg`lvog#mlw#afPf`qfwbqz#lebssfbq#wl#afnbqdjm.wls92,]_p(\x7F_p(',df*xwkqlt#f~8wkf#pwbqw#lewtl#pfsbqbwfobmdvbdf#bmgtkl#kbg#affmlsfqbwjlm#legfbwk#le#wkfqfbo#mvnafqp\n?ojmh#qfo>!sqlujgfg#wkfwkf#pwlqz#le`lnsfwjwjlmpfmdojpk#+VH*fmdojpk#+VP*<p<R<Q<_<R<W<M=l<S=m<V<T=m=l<S=m<V<T=m=l<S=m<V<R5h4U4]4D5f4E\nAO\x05Gx\bTA\nzk\x0BBl\bQ\x7F\bTA\nzk\x0BUm\bQ\x7F\bTA\nzk\npe\x05u|\ti@\tcT\bVV\n\\}\nxS\tVp\x05tS\x05k`\t[X\t[X\x0BHR\bPv\bTW\bUe\n\x7Fa\bQp\x0B_W\x0BWs\nxS\x0BAz\n_y\x04Khjmelqnb`j/_mkfqqbnjfmwbpfof`wq/_mj`lgfp`qjs`j/_m`obpjej`bglp`lml`jnjfmwlsvaoj`b`j/_mqfob`jlmbgbpjmelqn/Mwj`bqfob`jlmbglpgfsbqwbnfmwlwqbabibglqfpgjqf`wbnfmwfbzvmwbnjfmwlnfq`bglOjaqf`lmw/M`wfmlpkbajwb`jlmfp`vnsojnjfmwlqfpwbvqbmwfpgjpslpj`j/_m`lmpf`vfm`jbfof`wq/_mj`bbsoj`b`jlmfpgfp`lmf`wbgljmpwbob`j/_mqfbojyb`j/_mvwjojyb`j/_mfm`j`olsfgjbfmefqnfgbgfpjmpwqvnfmwlpf{sfqjfm`jbpjmpwjwv`j/_msbqwj`vobqfppva`bwfdlqjb=n<R<W=`<V<R<L<R=m=m<T<T=l<\\<]<R=n=g<]<R<W=`=d<Y<S=l<R=m=n<R<P<R<Z<Y=n<Y<X=l=o<_<T=i=m<W=o=k<\\<Y=m<Y<U=k<\\=m<^=m<Y<_<X<\\<L<R=m=m<T=c<p<R=m<V<^<Y<X=l=o<_<T<Y<_<R=l<R<X<\\<^<R<S=l<R=m<X<\\<Q<Q=g=i<X<R<W<Z<Q=g<T<P<Y<Q<Q<R<p<R=m<V<^=g=l=o<]<W<Y<U<p<R=m<V<^<\\=m=n=l<\\<Q=g<Q<T=k<Y<_<R=l<\\<]<R=n<Y<X<R<W<Z<Y<Q=o=m<W=o<_<T=n<Y<S<Y=l=`<r<X<Q<\\<V<R<S<R=n<R<P=o=l<\\<]<R=n=o<\\<S=l<Y<W=c<^<R<R<]=e<Y<R<X<Q<R<_<R=m<^<R<Y<_<R=m=n<\\=n=`<T<X=l=o<_<R<U=h<R=l=o<P<Y=i<R=l<R=d<R<S=l<R=n<T<^=m=m=g<W<V<\\<V<\\<Z<X=g<U<^<W<\\=m=n<T<_=l=o<S<S=g<^<P<Y=m=n<Y=l<\\<]<R=n<\\=m<V<\\<[<\\<W<S<Y=l<^=g<U<X<Y<W<\\=n=`<X<Y<Q=`<_<T<S<Y=l<T<R<X<]<T<[<Q<Y=m<R=m<Q<R<^<Y<P<R<P<Y<Q=n<V=o<S<T=n=`<X<R<W<Z<Q<\\=l<\\<P<V<\\=i<Q<\\=k<\\<W<R<L<\\<]<R=n<\\<N<R<W=`<V<R=m<R<^=m<Y<P<^=n<R=l<R<U<Q<\\=k<\\<W<\\=m<S<T=m<R<V=m<W=o<Z<]=g=m<T=m=n<Y<P<S<Y=k<\\=n<T<Q<R<^<R<_<R<S<R<P<R=e<T=m<\\<U=n<R<^<S<R=k<Y<P=o<S<R<P<R=e=`<X<R<W<Z<Q<R=m=m=g<W<V<T<]=g=m=n=l<R<X<\\<Q<Q=g<Y<P<Q<R<_<T<Y<S=l<R<Y<V=n<M<Y<U=k<\\=m<P<R<X<Y<W<T=n<\\<V<R<_<R<R<Q<W<\\<U<Q<_<R=l<R<X<Y<^<Y=l=m<T=c=m=n=l<\\<Q<Y=h<T<W=`<P=g=o=l<R<^<Q=c=l<\\<[<Q=g=i<T=m<V<\\=n=`<Q<Y<X<Y<W=b=c<Q<^<\\=l=c<P<Y<Q=`=d<Y<P<Q<R<_<T=i<X<\\<Q<Q<R<U<[<Q<\\=k<T=n<Q<Y<W=`<[=c=h<R=l=o<P<\\<N<Y<S<Y=l=`<P<Y=m=c=j<\\<[<\\=e<T=n=g<w=o=k=d<T<Y\fHD\fHU\fIl\fHn\fHy\fH\\\fHD\fIk\fHi\fHF\fHD\fIk\fHy\fHS\fHC\fHR\fHy\fH\\\fIk\fHn\fHi\fHD\fIa\fHC\fHy\fIa\fHC\fHR\fH{\fHR\fHk\fHM\fH@\fHR\fH\\\fIk\fHy\fHS\fHT\fIl\fHJ\fHS\fHC\fHR\fHF\fHU\fH^\fIk\fHT\fHS\fHn\fHU\fHA\fHR\fH\\\fHH\fHi\fHF\fHD\fIl\fHY\fHR\fH^\fIk\fHT\fIk\fHY\fHR\fHy\fH\\\fHH\fIk\fHB\fIk\fH\\\fIk\fHU\fIg\fHD\fIk\fHT\fHy\fHH\fIk\fH@\fHU\fIm\fHH\fHT\fHR\fHk\fHs\fHU\fIg\fH{\fHR\fHp\fHR\fHD\fIk\fHB\fHS\fHD\fHs\fHy\fH\\\fHH\fHR\fHy\fH\\\fHD\fHR\fHe\fHD\fHy\fIk\fHC\fHU\fHR\fHm\fHT\fH@\fHT\fIk\fHA\fHR\fH[\fHR\fHj\fHF\fHy\fIk\fH^\fHS\fHC\fIk\fHZ\fIm\fH\\\fIn\fHk\fHT\fHy\fIk\fHt\fHn\fHs\fIk\fHB\fIk\fH\\\fIl\fHT\fHy\fHH\fHR\fHB\fIk\fH\\\fHR\fH^\fIk\fHy\fH\\\fHi\fHK\fHS\fHy\fHi\fHF\fHD\fHR\fHT\fHB\fHR\fHp\fHB\fIm\fHq\fIk\fHy\fHR\fH\\\fHO\fHU\fIg\fHH\fHR\fHy\fHM\fHP\fIl\fHC\fHU\fHR\fHn\fHU\fIg\fHs\fH^\fHZ\fH@\fIa\fHJ\fH^\fHS\fHC\fHR\fHp\fIl\fHY\fHD\fHp\fHR\fHH\fHR\fHy\fId\fHT\fIk\fHj\fHF\fHy\fHR\fHY\fHR\fH^\fIl\fHJ\fIk\fHD\fIk\fHF\fIn\fH\\\fIl\fHF\fHR\fHD\fIl\fHe\fHT\fHy\fIk\fHU\fIg\fH{\fIl\fH@\fId\fHL\fHy\fHj\fHF\fHy\fIl\fHY\fH\\\fIa\fH[\fH{\fHR\fHn\fHY\fHj\fHF\fHy\fIg\fHp\fHS\fH^\fHR\fHp\fHR\fHD\fHR\fHT\fHU\fHB\fHH\fHU\fHB\fIk\fHn\fHe\fHD\fHy\fIl\fHC\fHR\fHU\fIn\fHJ\fH\\\fIa\fHp\fHT\fIn\fHv\fIl\fHF\fHT\fHn\fHJ\fHT\fHY\fHR\fH^\fHU\fIg\fHD\fHR\fHU\fIg\fHH\fIl\fHp\fId\fHT\fIk\fHY\fHR\fHF\fHT\fHp\fHD\fHH\fHR\fHD\fIk\fHH\fHR\fHp\fHR\fH\\\fIl\fHt\fHR\fHC\fH^\fHp\fHS\fH^\fIk\fHD\fIl\fHv\fIk\fHp\fHR\fHn\fHv\fHF\fHH\fIa\fH\\\fH{\fIn\fH{\fH^\fHp\fHR\fHH\fIk\fH@\fHR\fHU\fH\\\fHj\fHF\fHD\fIk\fHY\fHR\fHU\fHD\fHk\fHT\fHy\fHR\fHT\fIm\fH@\fHU\fH\\\fHU\fHD\fIk\fHk\fHT\fHT\fIk\fHT\fHU\fHS\fHH\fH@\fHM\fHP\fIk\fHt\fHs\fHD\fHR\fHH\fH^\fHR\fHZ\fHF\fHR\fHn\fHv\fHZ\fIa\fH\\\fIl\fH@\fHM\fHP\fIl\fHU\fIg\fHH\fIk\fHT\fHR\fHd\fHs\fHZ\fHR\fHC\fHJ\fHT\fHy\fHH\fIl\fHp\fHR\fHH\fIl\fHY\fHR\fH^\fHR\fHU\fHp\fHR\fH\\\fHF\fHs\fHD\fHR\fH\\\fHz\fHD\fIk\fHT\fHM\fHP\fHy\fHB\fHS\fH^\fHR\fHe\fHT\fHy\fIl\fHy\fIk\fHY\fH^\fH^\fH{\fHH\fHR\fHz\fHR\fHD\fHR\fHi\fH\\\fIa\fHI\fHp\fHU\fHR\fHn\fHJ\fIk\fHz\fHR\fHF\fHU\fH^\fIl\fHD\fHS\fHC\fHB\fH@\fHS\fHD\fHR\fH@\fId\fHn\fHy\fHy\fHU\fIl\fHn\fHy\fHU\fHD\fHR\fHJ\fIk\fHH\fHR\fHU\fHB\fH^\fIk\fHy\fHR\fHG\fIl\fHp\fH@\fHy\fHS\fHH\fIm\fH\\\fHH\fHB\fHR\fHn\fH{\fHY\fHU\fIl\fHn\fH\\\fIg\fHp\fHP\fHB\fHS\fH^\fIl\fHj\fH\\\fIg\fHF\fHT\fIk\fHD\fHR\fHC\fHR\fHJ\fHY\fH^\fIk\fHD\fIk\fHz\fHR\fHH\fHR\fHy\fH\\\fIl\fH@\fHe\fHD\fHy\fHR\fHp\fHY\fHR\fH@\fHF\fIn\fH\\\fHR\fH@\fHM\fHP\fHR\fHT\fI`\fHJ\fHR\fHZ\fIk\fHC\fH\\\fHy\fHS\fHC\fIk\fHy\fHU\fHR\fHn\fHi\fHy\fHT\fH\\\fH@\fHD\fHR\fHc\fHY\fHU\fHR\fHn\fHT\fIa\fHI\fH^\fHB\fHS\fH^\fIk\fH^\fIk\fHz\fHy\fHY\fHS\fH[\fHC\fHy\fIa\fH\\\fHn\fHT\fHB\fIn\fHU\fHI\fHR\fHD\fHR4F4_4F4[5f4U5i4X4K4]5o4E4D5d4K4_4[4E4K5h4Y5m4A4E5i5d4K4Z5f4U4K5h4B4K4Y4E4K5h5i4^5f4C4K5h4U4K5i4E4K5h5o4K4F4D4K5h4]4C5d4C4D4]5j4K5i4@4K5h4C5d5h4E4K5h4U4K5h5i4K5h5i5d5n4U4K5h4U4]4D5f4K5h4_4]5f4U4K5h4@5d4K5h4K5h4\\5k4K4D4K5h4A5f4K4E4K5h4A5n5d5n4K5h5o4]5f5i4K5h4U4]4K5n5i4A5m5d4T4E4K5h4G4K5j5f5i4X4K5k4C4E4K5h5i4]4O4E4K5h5n4]4N5j4K5h4X4D4K4D4K5h4A5d4K4]4K5h4@4C5f4C4K5h4O4_4]4E4K5h4U5h5d5i5i4@5i5d4U4E4K5h4]4A5i5j4K5h5j5n4K4[5m5h4_4[5f5j4K5h5o5d5f4F4K5h4C5j5f4K4D4]5o4K4F5k4K5h4]5f4K4Z4F4A5f4K4F5f4D4F5d5n5f4F4K5h4O5d5h5e4K5h4D4]5f4C4K5h5o5h4K5i4K5h4]4K4D4[4K5h4X4B4Y5f4_5f4K4]4K4F4K5h4G4K5h4G4K5h4Y5h4K4E4K5h4A4C5f4G4K5h4^5d4K4]4K5h4B5h5f4@4K5h4@5i5f4U4K5h4U4K5i5k4K5h4@5i4K5h4K5h4_4K4U4E5i4X4K5k4C5k4K5h4]4J5f4_4K5h4C4B5d5h4K5h5m5j5f4E4K5h5o4F4K4D4K5h4C5d4]5f4K5h4C4]5d4_4K4_4F4V4]5n4F4Y4K5i5f5i4K5h4D5j4K4F4K5h4U4T5f5ifmwfqwbjmnfmwvmgfqpwbmgjmd#>#evm`wjlm+*-isd!#tjgwk>!`lmejdvqbwjlm-smd!#tjgwk>!?algz#`obpp>!Nbwk-qbmgln+*`lmwfnslqbqz#Vmjwfg#Pwbwfp`jq`vnpwbm`fp-bssfmg@kjog+lqdbmjybwjlmp?psbm#`obpp>!!=?jnd#pq`>!,gjpwjmdvjpkfgwklvpbmgp#le#`lnnvmj`bwjlm`ofbq!=?,gju=jmufpwjdbwjlmebuj`lm-j`l!#nbqdjm.qjdkw9abpfg#lm#wkf#Nbppb`kvpfwwpwbaof#alqgfq>jmwfqmbwjlmbobopl#hmltm#bpsqlmvm`jbwjlmab`hdqlvmg9 esbggjmd.ofew9Elq#f{bnsof/#njp`foobmflvp%ow8,nbwk%dw8spz`kloldj`bojm#sbqwj`vobqfbq`k!#wzsf>!elqn#nfwklg>!bp#lsslpfg#wlPvsqfnf#@lvqwl``bpjlmbooz#Bggjwjlmbooz/Mlqwk#Bnfqj`bs{8ab`hdqlvmglsslqwvmjwjfpFmwfqwbjmnfmw-wlOltfq@bpf+nbmveb`wvqjmdsqlefppjlmbo#`lnajmfg#tjwkElq#jmpwbm`f/`lmpjpwjmd#le!#nb{ofmdwk>!qfwvqm#ebopf8`lmp`jlvpmfppNfgjwfqqbmfbmf{wqblqgjmbqzbppbppjmbwjlmpvapfrvfmwoz#avwwlm#wzsf>!wkf#mvnafq#lewkf#lqjdjmbo#`lnsqfkfmpjufqfefqp#wl#wkf?,vo=\t?,gju=\tskjolplskj`bool`bwjlm-kqfetbp#svaojpkfgPbm#Eqbm`jp`l+evm`wjlm+*x\t?gju#jg>!nbjmplskjpwj`bwfgnbwkfnbwj`bo#,kfbg=\x0E\t?algzpvddfpwp#wkbwgl`vnfmwbwjlm`lm`fmwqbwjlmqfobwjlmpkjspnbz#kbuf#affm+elq#f{bnsof/Wkjp#bqwj`of#jm#plnf#`bpfpsbqwp#le#wkf#gfejmjwjlm#leDqfbw#Aqjwbjm#`foosbggjmd>frvjubofmw#wlsob`fklogfq>!8#elmw.pjyf9#ivpwjej`bwjlmafojfufg#wkbwpveefqfg#eqlnbwwfnswfg#wl#ofbgfq#le#wkf`qjsw!#pq`>!,+evm`wjlm+*#xbqf#bubjobaof\t\n?ojmh#qfo>!#pq`>$kwws9,,jmwfqfpwfg#jm`lmufmwjlmbo#!#bow>!!#,=?,bqf#dfmfqboozkbp#bopl#affmnlpw#slsvobq#`lqqfpslmgjmd`qfgjwfg#tjwkwzof>!alqgfq9?,b=?,psbm=?,-dje!#tjgwk>!?jeqbnf#pq`>!wbaof#`obpp>!jmojmf.aol`h8b``lqgjmd#wl#wldfwkfq#tjwkbssql{jnbwfozsbqojbnfmwbqznlqf#bmg#nlqfgjpsobz9mlmf8wqbgjwjlmboozsqfglnjmbmwoz%maps8\x7F%maps8%maps8?,psbm=#`foopsb`jmd>?jmsvw#mbnf>!lq!#`lmwfmw>!`lmwqlufqpjbosqlsfqwz>!ld9,{.pkl`htbuf.gfnlmpwqbwjlmpvqqlvmgfg#azMfufqwkfofpp/tbp#wkf#ejqpw`lmpjgfqbaof#Bowklvdk#wkf#`loobalqbwjlmpklvog#mlw#afsqlslqwjlm#le?psbm#pwzof>!hmltm#bp#wkf#pklqwoz#bewfqelq#jmpwbm`f/gfp`qjafg#bp#,kfbg=\t?algz#pwbqwjmd#tjwkjm`qfbpjmdoz#wkf#eb`w#wkbwgjp`vppjlm#lenjggof#le#wkfbm#jmgjujgvbogjeej`vow#wl#sljmw#le#ujftklnlpf{vbojwzb``fswbm`f#le?,psbm=?,gju=nbmveb`wvqfqplqjdjm#le#wkf`lnnlmoz#vpfgjnslqwbm`f#legfmlnjmbwjlmpab`hdqlvmg9# ofmdwk#le#wkfgfwfqnjmbwjlmb#pjdmjej`bmw!#alqgfq>!3!=qfulovwjlmbqzsqjm`jsofp#lejp#`lmpjgfqfgtbp#gfufolsfgJmgl.Fvqlsfbmuvomfqbaof#wlsqlslmfmwp#lebqf#plnfwjnfp`olpfq#wl#wkfMft#Zlqh#@jwz#mbnf>!pfbq`kbwwqjavwfg#wl`lvqpf#le#wkfnbwkfnbwj`jbmaz#wkf#fmg#lebw#wkf#fmg#le!#alqgfq>!3!#wf`kmloldj`bo-qfnluf@obpp+aqbm`k#le#wkffujgfm`f#wkbw\"Xfmgje^..=\x0E\tJmpwjwvwf#le#jmwl#b#pjmdofqfpsf`wjufoz-bmg#wkfqfelqfsqlsfqwjfp#lejp#ol`bwfg#jmplnf#le#tkj`kWkfqf#jp#bopl`lmwjmvfg#wl#bssfbqbm`f#le#%bns8mgbpk8#gfp`qjafp#wkf`lmpjgfqbwjlmbvwklq#le#wkfjmgfsfmgfmwozfrvjssfg#tjwkglfp#mlw#kbuf?,b=?b#kqfe>!`lmevpfg#tjwk?ojmh#kqfe>!,bw#wkf#bdf#lebssfbq#jm#wkfWkfpf#jm`ovgfqfdbqgofpp#le`lvog#af#vpfg#pwzof>%rvlw8pfufqbo#wjnfpqfsqfpfmw#wkfalgz=\t?,kwno=wklvdkw#wl#afslsvobwjlm#leslppjajojwjfpsfq`fmwbdf#leb``fpp#wl#wkfbm#bwwfnsw#wlsqlgv`wjlm#leirvfqz,irvfqzwtl#gjeefqfmwafolmd#wl#wkffpwbaojpknfmwqfsob`jmd#wkfgfp`qjswjlm!#gfwfqnjmf#wkfbubjobaof#elqB``lqgjmd#wl#tjgf#qbmdf#le\n?gju#`obpp>!nlqf#`lnnlmozlqdbmjpbwjlmpevm`wjlmbojwztbp#`lnsofwfg#%bns8ngbpk8#sbqwj`jsbwjlmwkf#`kbqb`wfqbm#bggjwjlmbobssfbqp#wl#afeb`w#wkbw#wkfbm#f{bnsof#lepjdmjej`bmwozlmnlvpflufq>!af`bvpf#wkfz#bpzm`#>#wqvf8sqlaofnp#tjwkpffnp#wl#kbufwkf#qfpvow#le#pq`>!kwws9,,ebnjojbq#tjwkslppfppjlm#leevm`wjlm#+*#xwllh#sob`f#jmbmg#plnfwjnfppvapwbmwjbooz?psbm=?,psbm=jp#lewfm#vpfgjm#bm#bwwfnswdqfbw#gfbo#leFmujqlmnfmwbopv``fppevooz#ujqwvbooz#boo13wk#`fmwvqz/sqlefppjlmbopmf`fppbqz#wl#gfwfqnjmfg#az`lnsbwjajojwzaf`bvpf#jw#jpGj`wjlmbqz#lenlgjej`bwjlmpWkf#elooltjmdnbz#qfefq#wl9@lmpfrvfmwoz/Jmwfqmbwjlmbobowklvdk#plnfwkbw#tlvog#aftlqog$p#ejqpw`obppjejfg#bpalwwln#le#wkf+sbqwj`vobqozbojdm>!ofew!#nlpw#`lnnlmozabpjp#elq#wkfelvmgbwjlm#le`lmwqjavwjlmpslsvobqjwz#le`fmwfq#le#wkfwl#qfgv`f#wkfivqjpgj`wjlmpbssql{jnbwjlm#lmnlvpflvw>!Mft#Wfpwbnfmw`loof`wjlm#le?,psbm=?,b=?,jm#wkf#Vmjwfgejon#gjqf`wlq.pwqj`w-gwg!=kbp#affm#vpfgqfwvqm#wl#wkfbowklvdk#wkjp`kbmdf#jm#wkfpfufqbo#lwkfqavw#wkfqf#bqfvmsqf`fgfmwfgjp#pjnjobq#wlfpsf`jbooz#jmtfjdkw9#alog8jp#`boofg#wkf`lnsvwbwjlmbojmgj`bwf#wkbwqfpwqj`wfg#wl\n?nfwb#mbnf>!bqf#wzsj`booz`lmeoj`w#tjwkKltfufq/#wkf#Bm#f{bnsof#le`lnsbqfg#tjwkrvbmwjwjfp#leqbwkfq#wkbm#b`lmpwfoobwjlmmf`fppbqz#elqqfslqwfg#wkbwpsf`jej`bwjlmslojwj`bo#bmg%maps8%maps8?qfefqfm`fp#wlwkf#pbnf#zfbqDlufqmnfmw#ledfmfqbwjlm#lekbuf#mlw#affmpfufqbo#zfbqp`lnnjwnfmw#wl\n\n?vo#`obpp>!ujpvbojybwjlm2:wk#`fmwvqz/sqb`wjwjlmfqpwkbw#kf#tlvogbmg#`lmwjmvfgl``vsbwjlm#lejp#gfejmfg#bp`fmwqf#le#wkfwkf#bnlvmw#le=?gju#pwzof>!frvjubofmw#legjeefqfmwjbwfaqlvdkw#balvwnbqdjm.ofew9#bvwlnbwj`boozwklvdkw#le#bpPlnf#le#wkfpf\t?gju#`obpp>!jmsvw#`obpp>!qfsob`fg#tjwkjp#lmf#le#wkffgv`bwjlm#bmgjmeovfm`fg#azqfsvwbwjlm#bp\t?nfwb#mbnf>!b``lnnlgbwjlm?,gju=\t?,gju=obqdf#sbqw#leJmpwjwvwf#elqwkf#pl.`boofg#bdbjmpw#wkf#Jm#wkjp#`bpf/tbp#bssljmwfg`objnfg#wl#afKltfufq/#wkjpGfsbqwnfmw#lewkf#qfnbjmjmdfeef`w#lm#wkfsbqwj`vobqoz#gfbo#tjwk#wkf\t?gju#pwzof>!bonlpw#botbzpbqf#`vqqfmwozf{sqfppjlm#leskjolplskz#leelq#nlqf#wkbm`jujojybwjlmplm#wkf#jpobmgpfof`wfgJmgf{`bm#qfpvow#jm!#ubovf>!!#,=wkf#pwqv`wvqf#,=?,b=?,gju=Nbmz#le#wkfpf`bvpfg#az#wkfle#wkf#Vmjwfgpsbm#`obpp>!n`bm#af#wqb`fgjp#qfobwfg#wlaf`bnf#lmf#lejp#eqfrvfmwozojujmd#jm#wkfwkflqfwj`boozElooltjmd#wkfQfulovwjlmbqzdlufqmnfmw#jmjp#gfwfqnjmfgwkf#slojwj`bojmwqlgv`fg#jmpveej`jfmw#wlgfp`qjswjlm!=pklqw#pwlqjfppfsbqbwjlm#lebp#wl#tkfwkfqhmltm#elq#jwptbp#jmjwjboozgjpsobz9aol`hjp#bm#f{bnsofwkf#sqjm`jsbo`lmpjpwp#le#bqf`ldmjyfg#bp,algz=?,kwno=b#pvapwbmwjboqf`lmpwqv`wfgkfbg#le#pwbwfqfpjpwbm`f#wlvmgfqdqbgvbwfWkfqf#bqf#wtldqbujwbwjlmbobqf#gfp`qjafgjmwfmwjlmboozpfqufg#bp#wkf`obpp>!kfbgfqlsslpjwjlm#wlevmgbnfmwboozglnjmbwfg#wkfbmg#wkf#lwkfqboojbm`f#tjwktbp#elq`fg#wlqfpsf`wjufoz/bmg#slojwj`bojm#pvsslqw#lesflsof#jm#wkf13wk#`fmwvqz-bmg#svaojpkfgolbg@kbqwafbwwl#vmgfqpwbmgnfnafq#pwbwfpfmujqlmnfmwboejqpw#kboe#le`lvmwqjfp#bmgbq`kjwf`wvqboaf#`lmpjgfqfg`kbqb`wfqjyfg`ofbqJmwfqubobvwklqjwbwjufEfgfqbwjlm#letbp#pv``ffgfgbmg#wkfqf#bqfb#`lmpfrvfm`fwkf#Sqfpjgfmwbopl#jm`ovgfgeqff#plewtbqfpv``fppjlm#legfufolsfg#wkftbp#gfpwqlzfgbtbz#eqln#wkf8\t?,p`qjsw=\t?bowklvdk#wkfzelooltfg#az#bnlqf#sltfqevoqfpvowfg#jm#bVmjufqpjwz#leKltfufq/#nbmzwkf#sqfpjgfmwKltfufq/#plnfjp#wklvdkw#wlvmwjo#wkf#fmgtbp#bmmlvm`fgbqf#jnslqwbmwbopl#jm`ovgfp=?jmsvw#wzsf>wkf#`fmwfq#le#GL#MLW#BOWFQvpfg#wl#qfefqwkfnfp,<plqw>wkbw#kbg#affmwkf#abpjp#elqkbp#gfufolsfgjm#wkf#pvnnfq`lnsbqbwjufozgfp`qjafg#wkfpv`k#bp#wklpfwkf#qfpvowjmdjp#jnslppjaofubqjlvp#lwkfqPlvwk#Beqj`bmkbuf#wkf#pbnffeef`wjufmfppjm#tkj`k#`bpf8#wf{w.bojdm9pwqv`wvqf#bmg8#ab`hdqlvmg9qfdbqgjmd#wkfpvsslqwfg#wkfjp#bopl#hmltmpwzof>!nbqdjmjm`ovgjmd#wkfabkbpb#Nfobzvmlqph#alhn/Iomlqph#mzmlqphpolufm)M(ajmbjmwfqmb`jlmbo`bojej`b`j/_m`lnvmj`b`j/_m`lmpwqv``j/_m!=?gju#`obpp>!gjpbnajdvbwjlmGlnbjmMbnf$/#$bgnjmjpwqbwjlmpjnvowbmflvpozwqbmpslqwbwjlmJmwfqmbwjlmbo#nbqdjm.alwwln9qfpslmpjajojwz?\"Xfmgje^..=\t?,=?nfwb#mbnf>!jnsofnfmwbwjlmjmeqbpwqv`wvqfqfsqfpfmwbwjlmalqgfq.alwwln9?,kfbg=\t?algz=>kwws&0B&1E&1E?elqn#nfwklg>!nfwklg>!slpw!#,ebuj`lm-j`l!#~*8\t?,p`qjsw=\t-pfwBwwqjavwf+Bgnjmjpwqbwjlm>#mft#Bqqbz+*8?\"Xfmgje^..=\x0E\tgjpsobz9aol`h8Vmelqwvmbwfoz/!=%maps8?,gju=,ebuj`lm-j`l!=>$pwzofpkffw$#jgfmwjej`bwjlm/#elq#f{bnsof/?oj=?b#kqfe>!,bm#bowfqmbwjufbp#b#qfpvow#lesw!=?,p`qjsw=\twzsf>!pvanjw!#\t+evm`wjlm+*#xqf`lnnfmgbwjlmelqn#b`wjlm>!,wqbmpelqnbwjlmqf`lmpwqv`wjlm-pwzof-gjpsobz#B``lqgjmd#wl#kjggfm!#mbnf>!bolmd#tjwk#wkfgl`vnfmw-algz-bssql{jnbwfoz#@lnnvmj`bwjlmpslpw!#b`wjlm>!nfbmjmd#%rvlw8..?\"Xfmgje^..=Sqjnf#Njmjpwfq`kbqb`wfqjpwj`?,b=#?b#`obpp>wkf#kjpwlqz#le#lmnlvpflufq>!wkf#dlufqmnfmwkqfe>!kwwsp9,,tbp#lqjdjmbooztbp#jmwqlgv`fg`obppjej`bwjlmqfsqfpfmwbwjufbqf#`lmpjgfqfg?\"Xfmgje^..=\t\tgfsfmgp#lm#wkfVmjufqpjwz#le#jm#`lmwqbpw#wl#sob`fklogfq>!jm#wkf#`bpf#lejmwfqmbwjlmbo#`lmpwjwvwjlmbopwzof>!alqgfq.9#evm`wjlm+*#xAf`bvpf#le#wkf.pwqj`w-gwg!=\t?wbaof#`obpp>!b``lnsbmjfg#azb``lvmw#le#wkf?p`qjsw#pq`>!,mbwvqf#le#wkf#wkf#sflsof#jm#jm#bggjwjlm#wlp*8#ip-jg#>#jg!#tjgwk>!233&!qfdbqgjmd#wkf#Qlnbm#@bwkloj`bm#jmgfsfmgfmwelooltjmd#wkf#-dje!#tjgwk>!2wkf#elooltjmd#gjp`qjnjmbwjlmbq`kbfloldj`bosqjnf#njmjpwfq-ip!=?,p`qjsw=`lnajmbwjlm#le#nbqdjmtjgwk>!`qfbwfFofnfmw+t-bwwb`kFufmw+?,b=?,wg=?,wq=pq`>!kwwsp9,,bJm#sbqwj`vobq/#bojdm>!ofew!#@yf`k#Qfsvaoj`Vmjwfg#Hjmdgln`lqqfpslmgfm`f`lm`ovgfg#wkbw-kwno!#wjwof>!+evm`wjlm#+*#x`lnfp#eqln#wkfbssoj`bwjlm#le?psbm#`obpp>!pafojfufg#wl#affnfmw+$p`qjsw$?,b=\t?,oj=\t?ojufqz#gjeefqfmw=?psbm#`obpp>!lswjlm#ubovf>!+bopl#hmltm#bp\n?oj=?b#kqfe>!=?jmsvw#mbnf>!pfsbqbwfg#eqlnqfefqqfg#wl#bp#ubojdm>!wls!=elvmgfq#le#wkfbwwfnswjmd#wl#`bqalm#gjl{jgf\t\t?gju#`obpp>!`obpp>!pfbq`k.,algz=\t?,kwno=lsslqwvmjwz#wl`lnnvmj`bwjlmp?,kfbg=\x0E\t?algz#pwzof>!tjgwk9Wj\rVSmd#Uj\rWkw`kbmdfp#jm#wkfalqgfq.`lolq9 3!#alqgfq>!3!#?,psbm=?,gju=?tbp#gjp`lufqfg!#wzsf>!wf{w!#*8\t?,p`qjsw=\t\tGfsbqwnfmw#le#f``ofpjbpwj`bowkfqf#kbp#affmqfpvowjmd#eqln?,algz=?,kwno=kbp#mfufq#affmwkf#ejqpw#wjnfjm#qfpslmpf#wlbvwlnbwj`booz#?,gju=\t\t?gju#jtbp#`lmpjgfqfgsfq`fmw#le#wkf!#,=?,b=?,gju=`loof`wjlm#le#gfp`fmgfg#eqlnpf`wjlm#le#wkfb``fsw.`kbqpfwwl#af#`lmevpfgnfnafq#le#wkf#sbggjmd.qjdkw9wqbmpobwjlm#lejmwfqsqfwbwjlm#kqfe>$kwws9,,tkfwkfq#lq#mlwWkfqf#bqf#boplwkfqf#bqf#nbmzb#pnboo#mvnafqlwkfq#sbqwp#lejnslppjaof#wl##`obpp>!avwwlmol`bwfg#jm#wkf-#Kltfufq/#wkfbmg#fufmwvboozBw#wkf#fmg#le#af`bvpf#le#jwpqfsqfpfmwp#wkf?elqn#b`wjlm>!#nfwklg>!slpw!jw#jp#slppjaofnlqf#ojhfoz#wlbm#jm`qfbpf#jmkbuf#bopl#affm`lqqfpslmgp#wlbmmlvm`fg#wkbwbojdm>!qjdkw!=nbmz#`lvmwqjfpelq#nbmz#zfbqpfbqojfpw#hmltmaf`bvpf#jw#tbpsw!=?,p`qjsw=\x0E#ubojdm>!wls!#jmkbajwbmwp#leelooltjmd#zfbq\x0E\t?gju#`obpp>!njoojlm#sflsof`lmwqlufqpjbo#`lm`fqmjmd#wkfbqdvf#wkbw#wkfdlufqmnfmw#bmgb#qfefqfm`f#wlwqbmpefqqfg#wlgfp`qjajmd#wkf#pwzof>!`lolq9bowklvdk#wkfqfafpw#hmltm#elqpvanjw!#mbnf>!nvowjsoj`bwjlmnlqf#wkbm#lmf#qf`ldmjwjlm#le@lvm`jo#le#wkffgjwjlm#le#wkf##?nfwb#mbnf>!Fmwfqwbjmnfmw#btbz#eqln#wkf#8nbqdjm.qjdkw9bw#wkf#wjnf#lejmufpwjdbwjlmp`lmmf`wfg#tjwkbmg#nbmz#lwkfqbowklvdk#jw#jpafdjmmjmd#tjwk#?psbm#`obpp>!gfp`fmgbmwp#le?psbm#`obpp>!j#bojdm>!qjdkw!?,kfbg=\t?algz#bpsf`wp#le#wkfkbp#pjm`f#affmFvqlsfbm#Vmjlmqfnjmjp`fmw#lenlqf#gjeej`vowUj`f#Sqfpjgfmw`lnslpjwjlm#lesbppfg#wkqlvdknlqf#jnslqwbmwelmw.pjyf922s{f{sobmbwjlm#lewkf#`lm`fsw#letqjwwfm#jm#wkf\n?psbm#`obpp>!jp#lmf#le#wkf#qfpfnaobm`f#wllm#wkf#dqlvmgptkj`k#`lmwbjmpjm`ovgjmd#wkf#gfejmfg#az#wkfsvaoj`bwjlm#lenfbmp#wkbw#wkflvwpjgf#le#wkfpvsslqw#le#wkf?jmsvw#`obpp>!?psbm#`obpp>!w+Nbwk-qbmgln+*nlpw#sqlnjmfmwgfp`qjswjlm#le@lmpwbmwjmlsoftfqf#svaojpkfg?gju#`obpp>!pfbssfbqp#jm#wkf2!#kfjdkw>!2!#nlpw#jnslqwbmwtkj`k#jm`ovgfptkj`k#kbg#affmgfpwqv`wjlm#lewkf#slsvobwjlm\t\n?gju#`obpp>!slppjajojwz#leplnfwjnfp#vpfgbssfbq#wl#kbufpv``fpp#le#wkfjmwfmgfg#wl#afsqfpfmw#jm#wkfpwzof>!`ofbq9a\x0E\t?,p`qjsw=\x0E\t?tbp#elvmgfg#jmjmwfqujft#tjwk\\jg!#`lmwfmw>!`bsjwbo#le#wkf\x0E\t?ojmh#qfo>!pqfofbpf#le#wkfsljmw#lvw#wkbw{NOKwwsQfrvfpwbmg#pvapfrvfmwpf`lmg#obqdfpwufqz#jnslqwbmwpsf`jej`bwjlmppvqeb`f#le#wkfbssojfg#wl#wkfelqfjdm#sloj`z\\pfwGlnbjmMbnffpwbaojpkfg#jmjp#afojfufg#wlJm#bggjwjlm#wlnfbmjmd#le#wkfjp#mbnfg#bewfqwl#sqlwf`w#wkfjp#qfsqfpfmwfgGf`obqbwjlm#lenlqf#feej`jfmw@obppjej`bwjlmlwkfq#elqnp#lekf#qfwvqmfg#wl?psbm#`obpp>!`sfqelqnbm`f#le+evm`wjlm+*#x\x0Eje#bmg#lmoz#jeqfdjlmp#le#wkfofbgjmd#wl#wkfqfobwjlmp#tjwkVmjwfg#Mbwjlmppwzof>!kfjdkw9lwkfq#wkbm#wkfzsf!#`lmwfmw>!Bppl`jbwjlm#le\t?,kfbg=\t?algzol`bwfg#lm#wkfjp#qfefqqfg#wl+jm`ovgjmd#wkf`lm`fmwqbwjlmpwkf#jmgjujgvbobnlmd#wkf#nlpwwkbm#bmz#lwkfq,=\t?ojmh#qfo>!#qfwvqm#ebopf8wkf#svqslpf#lewkf#bajojwz#wl8`lolq9 eee~\t-\t?psbm#`obpp>!wkf#pvaif`w#legfejmjwjlmp#le=\x0E\t?ojmh#qfo>!`objn#wkbw#wkfkbuf#gfufolsfg?wbaof#tjgwk>!`fofaqbwjlm#leElooltjmd#wkf#wl#gjpwjmdvjpk?psbm#`obpp>!awbhfp#sob`f#jmvmgfq#wkf#mbnfmlwfg#wkbw#wkf=?\"Xfmgje^..=\tpwzo×Ý¶ïŽÊ×¬¢h­µçYÙ\ËÂˆ]˜[X]Ü‹ˆ\ÚËˆ˜\ÙQ›Û™Y‚ˆJJNÂˆœ™XZÎÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K’QÒQÒ‚ˆYˆ
[››Ý][Û‹œ]XYÚ[ÊHÂˆ›ÛZ\Ù\Ëœ\Ú
YÚYÚ[››Ý][Û‹˜Ü™X]S™]Ð[››Ý][ÛŠ™Y‹[››Ý][Û‹Ú[™Ù\ÊJNÂˆH[ÙHÂˆ›ÛZ\Ù\Ëœ\Ú
[šÐ[››Ý][Û‹˜Ü™X]S™]Ð[››Ý][ÛŠ™Y‹[››Ý][Û‹Ú[™Ù\ÊJNÂˆBˆœ™XZÎÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K’S’Î‚ˆ›ÛZ\Ù\Ëœ\Ú
[šÐ[››Ý][Û‹˜Ü™X]S™]Ð[››Ý][ÛŠ™Y‹[››Ý][Û‹Ú[™Ù\ÊJNÂˆœ™XZÎÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K”ÕST‚ˆÛÛœÝ[XYÙHH\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜYÈ]ØZ][XYÙT›ÛZ\Ù\ÏË™Ù]
[››Ý][Û‹˜š]X\Y
Hˆ[ÂˆYˆ
[XYÙOËš[XYÙTÝ™X[JHÂˆÛÛœÝÂˆ[XYÙTÝ™X[KˆÛX\ÚÔÝ™X[BˆHH[XYÙNÂˆYˆ
ÛX\ÚÔÝ™X[JHÂˆÛÛœÝÛX\ÚÔ™YˆH™Y‹™Ù]™]Õ[\Ü˜\žT™YŠ
NÂˆÚ[™Ù\Ëœ]
ÛX\ÚÔ™Y‹Âˆ]NˆÛX\ÚÔÝ™X[BˆJNÂˆ[XYÙTÝ™X[K™XÝœÙ]
”ÓX\ÚÈ‹ÛX\ÚÔ™YŠNÂˆBˆÛÛœÝ[XYÙT™YˆH[XYÙKš[XYÙT™YˆH™Y‹™Ù]™]Õ[\Ü˜\žT™YŠ
NÂˆÚ[™Ù\Ëœ]
[XYÙT™Y‹Âˆ]Nˆ[XYÙTÝ™X[BˆJNÂˆ[XYÙKš[XYÙTÝ™X[HH[Âˆ[XYÙKš[XYÙT™[™\”Ý™X[HH[Âˆ[XYÙKœÛX\ÚÔÝ™X[HH[Âˆ[XYÙKœÛX\ÚÔ™[™\”Ý™X[HH[ÂˆBˆ›ÛZ\Ù\Ëœ\Ú
Ý[\[››Ý][Û‹˜Ü™X]S™]Ð[››Ý][ÛŠ™Y‹[››Ý][Û‹Ú[™Ù\ËÂˆ[XYÙBˆJJNÂˆœ™XZÎÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K”ÒQÓUT‘N‚ˆ›ÛZ\Ù\Ëœ\Ú
Ý[\[››Ý][Û‹˜Ü™X]S™]Ð[››Ý][ÛŠ™Y‹[››Ý][Û‹Ú[™Ù\ËßJJNÂˆœ™XZÎÂˆBˆBˆ™]\›ˆÂˆ[››Ý][ÛœÎˆ
]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊJK™›]

BˆNÂˆBˆÝ]XÈ\Þ[˜Èš[™]Ð[››Ý][ÛœÊ[››Ý][Û‘ÛØ˜[Ë]˜[X]Ü‹\ÚË[››Ý][ÛœË[XYÙT›ÛZ\Ù\ÊHÂˆYˆ
X[››Ý][ÛœÊHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÂˆÜ[ÛœËˆ™Y‚ˆHH]˜[X]ÜŽÂˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆ›Üˆ
ÛÛœÝ[››Ý][ÛˆÙˆ[››Ý][ÛœÊHÂˆYˆ
[››Ý][Û‹™[]Y
HÂˆÛÛ[YNÂˆBˆÝÚ]Ú
[››Ý][Û‹˜[››Ý][Û•\JHÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K‘”‘QUV‚ˆ›ÛZ\Ù\Ëœ\Ú
œ™YU^[››Ý][Û‹˜Ü™X]S™]Ôš[[››Ý][ÛŠ[››Ý][Û‘ÛØ˜[Ë™Y‹[››Ý][Û‹Âˆ]˜[X]Ü‹ˆ\ÚËˆ]˜[X]Ü“Ü[ÛœÎˆÜ[ÛœÂˆJJNÂˆœ™XZÎÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K’QÒQÒ‚ˆYˆ
[››Ý][Û‹œ]XYÚ[ÊHÂˆ›ÛZ\Ù\Ëœ\Ú
YÚYÚ[››Ý][Û‹˜Ü™X]S™]Ôš[[››Ý][ÛŠ[››Ý][Û‘ÛØ˜[Ë™Y‹[››Ý][Û‹Âˆ]˜[X]Ü“Ü[ÛœÎˆÜ[ÛœÂˆJJNÂˆH[ÙHÂˆ›ÛZ\Ù\Ëœ\Ú
[šÐ[››Ý][Û‹˜Ü™X]S™]Ôš[[››Ý][ÛŠ[››Ý][Û‘ÛØ˜[Ë™Y‹[››Ý][Û‹Âˆ]˜[X]Ü“Ü[ÛœÎˆÜ[ÛœÂˆJJNÂˆBˆœ™XZÎÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K’S’Î‚ˆ›ÛZ\Ù\Ëœ\Ú
[šÐ[››Ý][Û‹˜Ü™X]S™]Ôš[[››Ý][ÛŠ[››Ý][Û‘ÛØ˜[Ë™Y‹[››Ý][Û‹Âˆ]˜[X]Ü“Ü[ÛœÎˆÜ[ÛœÂˆJJNÂˆœ™XZÎÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K”ÕST‚ˆÛÛœÝ[XYÙHHÜ[ÛœËš\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜYÈ]ØZ][XYÙT›ÛZ\Ù\ÏË™Ù]
[››Ý][Û‹˜š]X\Y
Hˆ[ÂˆYˆ
[XYÙOËš[XYÙTÝ™X[JHÂˆÛÛœÝÂˆ[XYÙTÝ™X[Kˆ[XYÙT™[™\”Ý™X[KˆÛX\ÚÔÝ™X[KˆÛX\ÚÔ™[™\”Ý™X[BˆHH[XYÙNÂˆÛÛœÝ[XYÙT™YˆH[XYÙT™[™\”Ý™X[H™]ÈœYÔÝ™X[J[XYÙTÝ™X[K[XYÙTÝ™X[K›[™Ý
NÂˆYˆ
ÛX\ÚÔÝ™X[HÛX\ÚÔ™[™\”Ý™X[JHÂˆ[XYÙT™Y‹™XÝœÙ]
”ÓX\ÚÈ‹ÛX\ÚÔ™[™\”Ý™X[HÛX\ÚÔÝ™X[JNÂˆBˆ[XYÙKš[XYÙT™YˆH[XYÙT™YŽÂˆ[XYÙKš[XYÙTÝ™X[HH[Âˆ[XYÙKš[XYÙT™[™\”Ý™X[HH[Âˆ[XYÙKœÛX\ÚÔÝ™X[HH[Âˆ[XYÙKœÛX\ÚÔ™[™\”Ý™X[HH[ÂˆBˆ›ÛZ\Ù\Ëœ\Ú
Ý[\[››Ý][Û‹˜Ü™X]S™]Ôš[[››Ý][ÛŠ[››Ý][Û‘ÛØ˜[Ë™Y‹[››Ý][Û‹Âˆ[XYÙKˆ]˜[X]Ü“Ü[ÛœÎˆÜ[ÛœÂˆJJNÂˆœ™XZÎÂˆØ\ÙH[››Ý][Û‘Y]Ü•\K”ÒQÓUT‘N‚ˆ›ÛZ\Ù\Ëœ\Ú
Ý[\[››Ý][Û‹˜Ü™X]S™]Ôš[[››Ý][ÛŠ[››Ý][Û‘ÛØ˜[Ë™Y‹[››Ý][Û‹Âˆ]˜[X]Ü“Ü[ÛœÎˆÜ[ÛœÂˆJJNÂˆœ™XZÎÂˆBˆBˆ™]\›ˆ›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆBŸB™[˜Ý[ÛˆÙ]™ØÛÛÜŠÛÛÜ‹Y˜][ÛÛÜˆH™]ÈZ[Û[\Y\œ˜^JÊJHÂˆYˆ
P\œ˜^Kš\Ð\œ˜^JÛÛÜŠJHÂˆ™]\›ˆY˜][ÛÛÜŽÂˆBˆÛÛœÝ™ØÛÛÜˆHY˜][ÛÛÜˆ™]ÈZ[Û[\Y\œ˜^JÊNÂˆÝÚ]Ú
ÛÛÜ‹›[™Ý
HÂˆØ\ÙH‚ˆ™]\›ˆ[ÂˆØ\ÙHN‚ˆÛÛÜ”ÜXÙU][Ë™Ü˜^K™Ù]™Ø’][JÛÛÜ‹™ØÛÛÜ‹
NÂˆ™]\›ˆ™ØÛÛÜŽÂˆØ\ÙHÎ‚ˆÛÛÜ”ÜXÙU][Ëœ™Ø‹™Ù]™Ø’][JÛÛÜ‹™ØÛÛÜ‹
NÂˆ™]\›ˆ™ØÛÛÜŽÂˆØ\ÙH‚ˆÛÛÜ”ÜXÙU][Ë˜Û^ZË™Ù]™Ø’][JÛÛÜ‹™ØÛÛÜ‹
NÂˆ™]\›ˆ™ØÛÛÜŽÂˆY˜][‚ˆ™]\›ˆY˜][ÛÛÜŽÂˆBŸB™[˜Ý[ÛˆÙ]ÛÛÜ\œ˜^JÛÛÜ‹Y˜][˜[YHH[
HÂˆ™]\›ˆÛÛÜˆ	‰ˆ\œ˜^K™œ›ÛJÛÛÜ‹ÈOˆÈÈMJHY˜][˜[YNÂŸB™[˜Ý[ÛˆÙ]]XYÚ[ÊXÝ™XÝ
HÂˆÛÛœÝ]XYÚ[ÈHXÝ™Ù]\œ˜^J”]XYÚ[ÈŠNÂˆYˆ
Z\Ó[X™\\œ˜^J]XYÚ[Ë[
H]XYÚ[Ë›[™ÝOOH]XYÚ[Ë›[™Ý	Hˆ
HÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ™]Ô]XYÚ[ÈH™]È›Ø]Ì\œ˜^J]XYÚ[Ë›[™Ý
NÂˆ›Üˆ
]HHZHH]XYÚ[Ë›[™ÝÈHZNÈH
ÏH
HÂˆÛÛœÝÞKLK‹L‹ËLËMHH]XYÚ[ËœÛXÙJKH
È
NÂˆÛÛœÝZ[–HX]›Z[ŠK‹Ë
NÂˆÛÛœÝX^HX]›X^
K‹Ë
NÂˆÛÛœÝZ[–HHX]›Z[ŠLKL‹LËM
NÂˆÛÛœÝX^HHX]›X^
LKL‹LËM
NÂˆYˆ
™XÝOOH[	‰ˆ
Z[–™XÝÌHX^ˆ™XÝÌ—HZ[–H™XÝÌWHX^Hˆ™XÝÌ×JJHÂˆ™]\›ˆ[ÂˆBˆ™]Ô]XYÚ[ËœÙ]
ÛZ[–X^KX^X^KZ[–Z[–KX^Z[–WKJNÂˆBˆ™]\›ˆ™]Ô]XYÚ[ÎÂŸB™[˜Ý[ÛˆÙ]˜[œÙ›Ü›SX]š^
™XÝ˜›ÞX]š^
HÂˆÛÛœÝZ[“X^HŒÌ—Ð“ÖÒS’UœÛXÙJ
NÂˆ][˜^X[[YÛ™Y›Ý[™[™Ð›Þ
˜›ÞX]š^Z[“X^
NÂˆÛÛœÝÛZ[–Z[–KX^X^WHHZ[“X^ÂˆYˆ
Z[–OOHX^Z[–HOOHX^JHÂˆ™]\›ˆÌKK™XÝÌK™XÝÌWWNÂˆBˆÛÛœÝ˜][ÈH
™XÝÌ—HH™XÝÌJHÈ
X^HZ[–
NÂˆÛÛœÝT˜][ÈH
™XÝÌ×HH™XÝÌWJHÈ
X^HHZ[–JNÂˆ™]\›ˆÞ˜][ËT˜][Ë™XÝÌHHZ[–
ˆ˜][Ë™XÝÌWHHZ[–H
ˆT˜][×NÂŸB™[˜Ý[ÛˆÜš]S[™UÐÝ\™UÐ\X\˜[˜ÙJ]KY™™\‹X^X™PÛÜÙHH˜[ÙJHÂˆY™™\‹œ\Ú
	Û[X™\•ÔÝš[™Ê]VÍJ_H	Û[X™\•ÔÝš[™Ê]VÍWJ_HX
NÂˆ›Üˆ
]HH‹ZHH]K›[™ÝÈHZNÈH
ÏHŠHÂˆYˆ
\Ó˜SŠ]VÚWJJHÂˆY™™\‹œ\Ú
	Û[X™\•ÔÝš[™Ê]VÚH
ÈJ_H	Û[X™\•ÔÝš[™Ê]VÚH
ÈWJ_H
NÂˆH[ÙHÂˆÛÛœÝÝ\™HH]KœÛXÙJKH
ÈŠNÂˆY™™\‹œ\Ú
	ØÝ\™K›X\
[X™\•ÔÝš[™ÊKš›Ú[ŠˆŠ_HØ
NÂˆBˆBˆYˆ
X^X™PÛÜÙH	‰ˆ]K›[™ÝOOHŠHÂˆY™™\‹œ\Ú
	Û[X™\•ÔÝš[™Ê]VÍJ_H	Û[X™\•ÔÝš[™Ê]VÍWJ_H
NÂˆBŸB˜Û\ÜÈ[››Ý][ÛˆÂˆ\X\˜[˜ÙHH[ÂˆÛØÈH[™Yš[™YÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÛÛœÝÂˆ[››Ý][Û‘ÛØ˜[ËˆXÝˆÜœ[‘šY[Ëˆ™Y‹ˆÝX\Kˆ™Y‚ˆHH\˜[\ÎÂˆÛÛœÝ\™[™YˆHÜœ[‘šY[ÏË™Ù]
™YŠNÂˆYˆ
\™[™YŠHÂˆXÝœÙ]
”\™[‹\™[™YŠNÂˆBˆ\ËœÙ]]JXÝ™Ù]
•ŠJNÂˆ\ËœÙ]ÛÛ[ÊXÝ™Ù]
ÛÛ[ÈŠJNÂˆ\ËœÙ][ÙYšXØ][Û‘]JXÝ™Ù]
“HŠJNÂˆ\ËœÙ]›YÜÊXÝ™Ù]
‘ˆŠJNÂˆ\ËœÙ]™XÝ[™ÛJXÝ™Ù]\œ˜^J”™XÝŠJNÂˆ\ËœÙ]ÛÛÜŠXÝ™Ù]\œ˜^JÈŠJNÂˆ\ËœÙ]›Ü™\”Ý[JXÝ
NÂˆ\ËœÙ]\X\˜[˜ÙJXÝ
NÂˆ\ËˆÜÙ]Ü[Û˜[ÛÛ[
™Y‹XÝ
NÂˆÛÛœÝRÈHXÝ™Ù]
“RÈŠNÂˆ\ËœÙ]›Ü™\[™˜XÚÙÜ›Ý[™ÛÛÜœÊRÊNÂˆ\ËœÙ]›Ý][ÛŠRËXÝ
NÂˆ\Ëœ™YˆH\˜[\Ëœ™Yˆ[œÝ[˜Ù[Ùˆ™YˆÈ\˜[\Ëœ™Yˆˆ[Âˆ\Ë—ÜÝ™X[\ÈH×NÂˆYˆ
\Ë˜\X\˜[˜ÙJHÂˆ\Ë—ÜÝ™X[\Ëœ\Ú
\Ë˜\X\˜[˜ÙJNÂˆBˆÛÛœÝ\ÓØÚÙYHHJ\Ë™›YÜÈ	ˆ[››Ý][Û‘›YË“ÐÒÑQ
NÂˆÛÛœÝ\ÐÛÛ[ØÚÙYHHJ\Ë™›YÜÈ	ˆ[››Ý][Û‘›YË“ÐÒÑQÓÓ•S•ÊNÂˆ\Ë™]HHÂˆ[››Ý][Û•\Nˆ[››Ý][Û•\VÜÝX\OËÕ\\Ø\ÙJ
WKˆ[››Ý][Û‘›YÜÎˆ\Ë™›YÜËˆ›Ü™\”Ý[Nˆ\Ë˜›Ü™\”Ý[KˆÛÛÜŽˆ\Ë˜ÛÛÜ‹ˆ˜XÚÙÜ›Ý[™ÛÛÜŽˆ\Ë˜˜XÚÙÜ›Ý[™ÛÛÜ‹ˆ›Ü™\ÛÛÜŽˆ\Ë˜›Ü™\ÛÛÜ‹ˆ›Ý][ÛŽˆ\Ëœ›Ý][Û‹ˆÛÛ[ÓØšŽˆ\Ë—ØÛÛ[Ëˆ\Ð\X\˜[˜ÙNˆH]\Ë˜\X\˜[˜ÙKˆYˆ\˜[\ËšYˆ[ÙYšXØ][Û‘]Nˆ\Ë›[ÙYšXØ][Û‘]KˆØÎˆ\Ë—ÛØËˆ™XÝˆ\Ëœ™XÝ[™ÛKˆÝX\Kˆ\ÓÝÛØ[˜\Îˆ˜[ÙKˆ›Ô›Ý]NˆHJ\Ë™›YÜÈ	ˆ[››Ý][Û‘›YË““Ô“ÕUJKˆ›ÒSˆ\ÓØÚÙY	‰ˆ\ÐÛÛ[ØÚÙYˆ\ÑY]X›Nˆ˜[ÙKˆÝXÝ\™[ˆLBˆNÂˆYˆ
[››Ý][Û‘ÛØ˜[ËœÝXÝ™YT›ÛÝ
HÂˆ]ÝXÝ\™[HXÝ™Ù]
”ÝXÝ\™[ŠNÂˆ\Ë™]KœÝXÝ\™[HÝXÝ\™[H[X™\‹š\Ò[YÙ\ŠÝXÝ\™[
H	‰ˆÝXÝ\™[HÈÝXÝ\™[ˆLNÂˆ[››Ý][Û‘ÛØ˜[ËœÝXÝ™YT›ÛÝ˜Y[››Ý][Û’YÔYÙJ\˜[\ËœYÙT™Y‹ÝXÝ\™[\Ëœ™YŠNÂˆBˆYˆ
\˜[\Ë˜ÛÛXÝšY[ÊHÂˆÛÛœÝÚYÈHXÝ™Ù]
’ÚYÈŠNÂˆYˆ
\œ˜^Kš\Ð\œ˜^JÚYÊJHÂˆÛÛœÝÚYYÈH×NÂˆ›Üˆ
ÛÛœÝÚYÙˆÚYÊHÂˆYˆ
ÚY[œÝ[˜Ù[Ùˆ™YŠHÂˆÚYYËœ\Ú
ÚYÔÝš[™Ê
JNÂˆBˆBˆYˆ
ÚYYË›[™ÝOOH
HÂˆ\Ë™]KšÚYYÈHÚYYÎÂˆBˆBˆ\Ë™]K˜XÝ[ÛœÈHÛÛXÝXÝ[ÛœÊ™Y‹XÝ[››Ý][ÛXÝ[Û‘]™[\JNÂˆ\Ë™]K™šY[˜[YHH\Ë—ØÛÛœÝXÝšY[˜[YJXÝ
NÂˆ\Ë™]KœYÙR[™^H\˜[\ËœYÙR[™^ÂˆBˆÛÛœÝ]HXÝ™Ù]
’UŠNÂˆYˆ
][œÝ[˜Ù[Ùˆ˜[YJHÂˆ\Ë™]Kš]H]›˜[YNÂˆBˆ\Ë—Ú\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜYH\˜[\Ë™]˜[X]Ü“Ü[ÛœËš\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜYÂˆ\Ë—Ù˜[˜XÚÑ›ÛXÝH[Âˆ\Ë—Û™YY\X\˜[˜Ù\ÈH˜[ÙNÂˆBˆÙÙ]Ü\˜]Ü“\Ý›Ð\X\˜[˜ÙJ
HÂˆ™]\›ˆÂˆÜ\Ýˆ™]ÈÜ\˜]Ü“\Ý

KˆÙ\\˜]Q›Ü›Nˆ˜[ÙKˆÙ\\˜]PØ[˜\Îˆ˜[ÙBˆNÂˆBˆÚ\Ñ›YÊ›YÜË›YÊHÂˆ™]\›ˆHJ›YÜÈ	ˆ›YÊNÂˆBˆØZ[›YÜÊ›ÕšY]Ë›Ôš[
HÂˆ]Âˆ›YÜÂˆHH\ÎÂˆYˆ
›ÕšY]ÈOOH[™Yš[™Y
HÂˆYˆ
›Ôš[OOH[™Yš[™Y
HÂˆ™]\›ˆ[™Yš[™YÂˆBˆYˆ
›Ôš[
HÂˆ™]\›ˆ›YÜÈ	ˆ[››Ý][Û‘›YË”’S•ÂˆBˆ™]\›ˆ›YÜÈ	ˆ[››Ý][Û‘›YË’QSˆ[››Ý][Û‘›YË”’S•ÂˆBˆYˆ
›ÕšY]ÊHÂˆ›YÜÈH[››Ý][Û‘›YË”’S•ÂˆYˆ
›Ôš[
HÂˆ™]\›ˆ›YÜÈ	ˆ[››Ý][Û‘›YË““Õ’QUÈ[››Ý][Û‘›YË’QSŽÂˆBˆ™]\›ˆ›YÜÈ	ˆ[››Ý][Û‘›YË’QSˆ[››Ý][Û‘›YË““Õ’QUÎÂˆBˆ›YÜÈ	HŠ[››Ý][Û‘›YË’QSˆ[››Ý][Û‘›YË““Õ’QUÊNÂˆYˆ
›Ôš[
HÂˆ™]\›ˆ›YÜÈ	ˆ[››Ý][Û‘›YË”’S•ÂˆBˆ™]\›ˆ›YÜÈ[››Ý][Û‘›YË”’S•ÂˆBˆÚ\ÕšY]ØX›J›YÜÊHÂˆ™]\›ˆ]\Ë—Ú\Ñ›YÊ›YÜË[››Ý][Û‘›YË’S•’TÒP“JH	‰ˆ]\Ë—Ú\Ñ›YÊ›YÜË[››Ý][Û‘›YË““Õ’QUÊNÂˆBˆÚ\Ôš[X›J›YÜÊHÂˆ™]\›ˆ\Ë—Ú\Ñ›YÊ›YÜË[››Ý][Û‘›YË”’S•
H	‰ˆ]\Ë—Ú\Ñ›YÊ›YÜË[››Ý][Û‘›YË’QSŠH	‰ˆ]\Ë—Ú\Ñ›YÊ›YÜË[››Ý][Û‘›YË’S•’TÒP“JNÂˆBˆ]\Ý™UšY]ÙY
[››Ý][Û”ÝÜ˜YÙKÜ™[™\‘›Ü›\ÊHÂˆÛÛœÝ›ÕšY]ÈH[››Ý][Û”ÝÜ˜YÙOË™Ù]
\Ë™]KšY
OË››ÕšY]ÎÂˆYˆ
›ÕšY]ÈOOH[™Yš[™Y
HÂˆ™]\›ˆ[›ÕšY]ÎÂˆBˆ™]\›ˆ\ËšY]ØX›H	‰ˆ]\Ë—Ú\Ñ›YÊ\Ë™›YÜË[››Ý][Û‘›YË’QSŠNÂˆBˆ]\Ý™Tš[Y
[››Ý][Û”ÝÜ˜YÙJHÂˆÛÛœÝ›Ôš[H[››Ý][Û”ÝÜ˜YÙOË™Ù]
\Ë™]KšY
OË››Ôš[ÂˆYˆ
›Ôš[OOH[™Yš[™Y
HÂˆ™]\›ˆ[›Ôš[ÂˆBˆ™]\›ˆ\Ëœš[X›NÂˆBˆ]\Ý™UšY]ÙYÚ[‘Y][™Ê\ÑY][™Ë[ÙYšYYYÈH[
HÂˆ™]\›ˆ\ÑY][™ÈÈ]\Ë™]Kš\ÑY]X›Hˆ[[ÙYšYYYÏËš\Ê\Ë™]KšY
NÂˆBˆÙ]šY]ØX›J
HÂˆYˆ
\Ë™]Kœ]XYÚ[ÈOOH[
HÂˆ™]\›ˆ˜[ÙNÂˆBˆYˆ
\Ë™›YÜÈOOH
HÂˆ™]\›ˆYNÂˆBˆ™]\›ˆ\Ë—Ú\ÕšY]ØX›J\Ë™›YÜÊNÂˆBˆÙ]š[X›J
HÂˆYˆ
\Ë™]Kœ]XYÚ[ÈOOH[
HÂˆ™]\›ˆ˜[ÙNÂˆBˆYˆ
\Ë™›YÜÈOOH
HÂˆ™]\›ˆ˜[ÙNÂˆBˆ™]\›ˆ\Ë—Ú\Ôš[X›J\Ë™›YÜÊNÂˆBˆÜ\œÙTÝš[™Ò[\Š]JHÂˆÛÛœÝÝˆH\[Ùˆ]HOOHœÝš[™ÈˆÈÝš[™ÕÔ”Ýš[™Ê]JHˆˆŽÂˆÛÛœÝ\ˆHÝˆ	‰ˆšYJÝŠK™\ˆOOHœˆÈœˆˆ›ˆŽÂˆ™]\›ˆÂˆÝ‹ˆ\‚ˆNÂˆBˆÙ]Y˜][\X\˜[˜ÙJ\˜[\ÊHÂˆÛÛœÝÂˆXÝˆ[››Ý][Û‘ÛØ˜[ÂˆHH\˜[\ÎÂˆÛÛœÝY˜][\X\˜[˜ÙHHÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ‘H‚ˆJH[››Ý][Û‘ÛØ˜[Ë˜XÜ›Ñ›Ü›K™Ù]
‘HŠNÂˆ\Ë—ÙY˜][\X\˜[˜ÙHH\[ÙˆY˜][\X\˜[˜ÙHOOHœÝš[™ÈˆÈY˜][\X\˜[˜ÙHˆˆŽÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]HH\œÙQY˜][\X\˜[˜ÙJ\Ë—ÙY˜][\X\˜[˜ÙJNÂˆBˆÙ]]J]JHÂˆ\Ë—Ý]HH\Ë—Ü\œÙTÝš[™Ò[\Š]JNÂˆBˆÙ]ÛÛ[ÊÛÛ[ÊHÂˆ\Ë—ØÛÛ[ÈH\Ë—Ü\œÙTÝš[™Ò[\ŠÛÛ[ÊNÂˆBˆÙ][ÙYšXØ][Û‘]J[ÙYšXØ][Û‘]JHÂˆ\Ë›[ÙYšXØ][Û‘]HH\[Ùˆ[ÙYšXØ][Û‘]HOOHœÝš[™ÈˆÈ[ÙYšXØ][Û‘]Hˆ[ÂˆBˆÙ]›YÜÊ›YÜÊHÂˆ\Ë™›YÜÈH[X™\‹š\Ò[YÙ\Š›YÜÊH	‰ˆ›YÜÈˆÈ›YÜÈˆÂˆYˆ
\Ë™›YÜÈ	ˆ[››Ý][Û‘›YË’S•’TÒP“H	‰ˆ\Ë˜ÛÛœÝXÝÜ‹›˜[YHOOH[››Ý][ÛˆŠHÂˆ\Ë™›YÜÈH[››Ý][Û‘›YË’S•’TÒP“NÂˆBˆBˆ\Ñ›YÊ›YÊHÂˆ™]\›ˆ\Ë—Ú\Ñ›YÊ\Ë™›YÜË›YÊNÂˆBˆÙ]™XÝ[™ÛJ™XÝ[™ÛJHÂˆ\Ëœ™XÝ[™ÛHHÛÚÝ\›Ü›X[™XÝ
™XÝ[™ÛKÌJNÂˆBˆÙ]ÛÛÜŠÛÛÜŠHÂˆ\Ë˜ÛÛÜˆHÙ]™ØÛÛÜŠÛÛÜŠNÂˆBˆÙ][™Q[™[™ÜÊ[™Q[™[™ÜÊHÂˆ\Ë›[™Q[™[™ÜÈHÈ“›Û™H‹“›Û™H—NÂˆYˆ
\œ˜^Kš\Ð\œ˜^J[™Q[™[™ÜÊH	‰ˆ[™Q[™[™ÜË›[™ÝOOHŠHÂˆ›Üˆ
]HHÈHŽÈJÊÊHÂˆÛÛœÝØšˆH[™Q[™[™ÜÖÚWNÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ˜[YJHÂˆÝÚ]Ú
Øš‹›˜[YJHÂˆØ\ÙH“›Û™HŽ‚ˆÛÛ[YNÂˆØ\ÙH”Ü]X\™HŽ‚ˆØ\ÙHÚ\˜ÛHŽ‚ˆØ\ÙH‘X[[Û™Ž‚ˆØ\ÙH“Ü[\œ›ÝÈŽ‚ˆØ\ÙHÛÜÙY\œ›ÝÈŽ‚ˆØ\ÙH]Ž‚ˆØ\ÙH”“Ü[\œ›ÝÈŽ‚ˆØ\ÙH”ÛÜÙY\œ›ÝÈŽ‚ˆØ\ÙH”Û\ÚŽ‚ˆ\Ë›[™Q[™[™ÜÖÚWHHØš‹›˜[YNÂˆÛÛ[YNÂˆBˆBˆØ\›ŠYÛ›Üš[™È[˜[Y[™Q[™[™Îˆ	ÛØšŸX
NÂˆBˆBˆBˆÙ]›Ý][ÛŠZËXÝ
HÂˆ\Ëœ›Ý][ÛˆHÂˆ][™ÛHHZÈ[œÝ[˜Ù[ÙˆXÝÈZË™Ù]
”ˆŠHˆXÝ™Ù]
”›Ý]HŠHÂˆYˆ
[X™\‹š\Ò[YÙ\Š[™ÛJH	‰ˆ[™ÛHOOH
HÂˆ[™ÛH	OHÍŒÂˆYˆ
[™ÛH
HÂˆ[™ÛH
ÏHÍŒÂˆBˆYˆ
[™ÛH	HLOOH
HÂˆ\Ëœ›Ý][ÛˆH[™ÛNÂˆBˆBˆBˆÙ]›Ü™\[™˜XÚÙÜ›Ý[™ÛÛÜœÊZÊHÂˆYˆ
ZÈ[œÝ[˜Ù[ÙˆXÝ
HÂˆ\Ë˜›Ü™\ÛÛÜˆHÙ]™ØÛÛÜŠZË™Ù]\œ˜^JÈŠK[
NÂˆ\Ë˜˜XÚÙÜ›Ý[™ÛÛÜˆHÙ]™ØÛÛÜŠZË™Ù]\œ˜^J‘ÈŠK[
NÂˆH[ÙHÂˆ\Ë˜›Ü™\ÛÛÜˆH\Ë˜˜XÚÙÜ›Ý[™ÛÛÜˆH[ÂˆBˆBˆÙ]›Ü™\”Ý[J›Ü™\”Ý[JHÂˆ\Ë˜›Ü™\”Ý[HH™]È[››Ý][Û›Ü™\”Ý[J
NÂˆYˆ
J›Ü™\”Ý[H[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆYˆ
›Ü™\”Ý[Kš\Ê”ÈŠJHÂˆÛÛœÝXÝH›Ü™\”Ý[K™Ù]
”ÈŠNÂˆYˆ
XÝ[œÝ[˜Ù[ÙˆXÝ
HÂˆÛÛœÝXÝ\HHXÝ™Ù]
•\HŠNÂˆYˆ
YXÝ\H\Ó˜[YJXÝ\K›Ü™\ˆŠJHÂˆ\Ë˜›Ü™\”Ý[KœÙ]ÚY
XÝ™Ù]
•ÈŠK\Ëœ™XÝ[™ÛJNÂˆ\Ë˜›Ü™\”Ý[KœÙ]Ý[JXÝ™Ù]
”ÈŠJNÂˆ\Ë˜›Ü™\”Ý[KœÙ]\Ú\œ˜^JXÝ™Ù]\œ˜^J‘ŠJNÂˆBˆBˆH[ÙHYˆ
›Ü™\”Ý[Kš\Ê›Ü™\ˆŠJHÂˆÛÛœÝ\œ˜^HH›Ü™\”Ý[K™Ù]\œ˜^J›Ü™\ˆŠNÂˆYˆ
\œ˜^Kš\Ð\œ˜^J\œ˜^JJHÂˆYˆ
\œ˜^K›[™ÝHÊHÂˆ\Ë˜›Ü™\”Ý[KœÙ]Üš^›Û[ÛÜ›™\”˜Y]\Ê\œ˜^VÌJNÂˆ\Ë˜›Ü™\”Ý[KœÙ]™\XØ[ÛÜ›™\”˜Y]\Ê\œ˜^VÌWJNÂˆ\Ë˜›Ü™\”Ý[KœÙ]ÚY
\œ˜^VÌ—K\Ëœ™XÝ[™ÛJNÂˆYˆ
\œ˜^K›[™ÝOOH
HÂˆ\Ë˜›Ü™\”Ý[KœÙ]\Ú\œ˜^J\œ˜^VÌ×KYJNÂˆBˆH[ÙHYˆ
\œ˜^K›[™ÝOOH
HÂˆ\Ë˜›Ü™\”Ý[KœÙ]ÚY

NÂˆBˆBˆH[ÙHÂˆ\Ë˜›Ü™\”Ý[KœÙ]ÚY

NÂˆBˆBˆÙ]\X\˜[˜ÙJXÝ
HÂˆÛÛœÝ\X\˜[˜ÙTÝ]\ÈHXÝ™Ù]
TŠNÂˆYˆ
J\X\˜[˜ÙTÝ]\È[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆÛÛœÝ›Ü›X[\X\˜[˜ÙTÝ]HH\X\˜[˜ÙTÝ]\Ë™Ù]
“ˆŠNÂˆYˆ
›Ü›X[\X\˜[˜ÙTÝ]H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ\Ë˜\X\˜[˜ÙHH›Ü›X[\X\˜[˜ÙTÝ]NÂˆ™]\›ŽÂˆBˆYˆ
J›Ü›X[\X\˜[˜ÙTÝ]H[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆÛÛœÝ\ÈHXÝ™Ù]
TÈŠNÂˆYˆ
J\È[œÝ[˜Ù[Ùˆ˜[YJJHÂˆ™]\›ŽÂˆBˆÛÛœÝ\X\˜[˜ÙHH›Ü›X[\X\˜[˜ÙTÝ]K™Ù]
\Ë›˜[YJNÂˆYˆ
\X\˜[˜ÙH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ\Ë˜\X\˜[˜ÙHH\X\˜[˜ÙNÂˆBˆBˆÜÙ]Ü[Û˜[ÛÛ[
™Y‹XÝ
HÂˆYˆ
XÝš\Ê“ÐÈŠJHÂˆžHÂˆ\Ë—ÛØÈH\œÙSX\šÙYÛÛ[›ÜÊ™Y‹XÝ™Ù]
“ÐÈŠK[
NÂˆHØ]Ú
^
HÂˆYˆ
^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈ^ÂˆBˆØ\›ŠÜÙ]Ü[Û˜[ÛÛ[ˆ	Ù^X
NÂˆBˆBˆBˆ\Þ[˜ÈØY™\ÛÝ\˜Ù\ÊÙ^\Ë\X\˜[˜ÙJHÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH]ØZ]\X\˜[˜ÙK™XÝ™Ù]\Þ[˜Ê”™\ÛÝ\˜Ù\ÈŠNÂˆYˆ
™\ÛÝ\˜Ù\ÊHÂˆ]ØZ]Øš™XÝØY\‹›ØY
™\ÛÝ\˜Ù\ËÙ^\Ë™\ÛÝ\˜Ù\Ëž™YŠNÂˆBˆ™]\›ˆ™\ÛÝ\˜Ù\ÎÂˆBˆÙ]ÛÝÛØ[˜\Ô™\]Z\™\Ñ›Ü›\Ê
HÂˆ™]\›ˆ˜[ÙNÂˆBˆ\Þ[˜ÈÙ]Ü\˜]Ü“\Ý
]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJHÂˆÛÛœÝÂˆ\ÓÝÛØ[˜\ËˆYˆ™XÝˆHH\Ë™]NÂˆ]\X\˜[˜ÙHH\Ë˜\X\˜[˜ÙNÂˆÛÛœÝ\Õ\Ú[™ÓÝÛØ[˜\ÈHHJ\ÓÝÛØ[˜\È	‰ˆ[[	ˆ™[™\š[™Ò[[›YË‘TÔVH	‰ˆ
]\Ë—ÛÝÛØ[˜\Ô™\]Z\™\Ñ›Ü›\È[[	ˆ™[™\š[™Ò[[›YËS““ÕUSÓ”×Ñ“Ô“TÊJNÂˆYˆ
\Õ\Ú[™ÓÝÛØ[˜\È	‰ˆ
\ËÚYOOH\ËšZYÚOOH
JHÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH˜[ÙNÂˆ™]\›ˆ\Ë—ÙÙ]Ü\˜]Ü“\Ý›Ð\X\˜[˜ÙJ
NÂˆBˆYˆ
X\X\˜[˜ÙJHÂˆYˆ
Z\Õ\Ú[™ÓÝÛØ[˜\ÊHÂˆ™]\›ˆ\Ë—ÙÙ]Ü\˜]Ü“\Ý›Ð\X\˜[˜ÙJ
NÂˆBˆ\X\˜[˜ÙHH™]ÈÝš[™ÔÝ™X[Jˆ‹™]ÈXÝ

JNÂˆBˆÛÛœÝ\X\˜[˜ÙQXÝH\X\˜[˜ÙK™XÝÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH]ØZ]\Ë›ØY™\ÛÝ\˜Ù\Ê‘TÓÕTÑT×ÒÑVT×ÓÔTUÔ—ÓTÕ\X\˜[˜ÙJNÂˆÛÛœÝ˜›ÞHÛÚÝ\™XÝ
\X\˜[˜ÙQXÝ™Ù]\œ˜^J›ÞŠKÌ\ËÚY\ËšZYÚJNÂˆÛÛœÝX]š^HÛÚÝ\X]š^
\X\˜[˜ÙQXÝ™Ù]\œ˜^J“X]š^ŠKQS•UWÓPU’V
NÂˆÛÛœÝ˜[œÙ›Ü›HHÙ]˜[œÙ›Ü›SX]š^
™XÝ˜›ÞX]š^
NÂˆÛÛœÝÜ\ÝH™]ÈÜ\˜]Ü“\Ý

NÂˆÛÛœÝÜ[Û˜[ÛÛ[H\Ë—ÛØÎÂˆYˆ
Ü[Û˜[ÛÛ[OOH[™Yš[™Y
HÂˆÜ\Ý˜YÜ
ÔË˜™YÚ[“X\šÙYÛÛ[›ÜËÈ“ÐÈ‹Ü[Û˜[ÛÛ[JNÂˆBˆÜ\Ý˜YÜ
ÔË˜™YÚ[[››Ý][Û‹ÚY™XÝ˜[œÙ›Ü›KX]š^\Õ\Ú[™ÓÝÛØ[˜\×JNÂˆ]ØZ]]˜[X]Ü‹™Ù]Ü\˜]Ü“\Ý
ÂˆÝ™X[Nˆ\X\˜[˜ÙKˆ\ÚËˆ™\ÛÝ\˜Ù\ËˆÜ\˜]Ü“\ÝˆÜ\Ýˆ˜[˜XÚÑ›ÛXÝˆ\Ë—Ù˜[˜XÚÑ›ÛXÝˆJNÂˆÜ\Ý˜YÜ
ÔË™[™[››Ý][Û‹×JNÂˆYˆ
Ü[Û˜[ÛÛ[OOH[™Yš[™Y
HÂˆÜ\Ý˜YÜ
ÔË™[™X\šÙYÛÛ[×JNÂˆBˆ\Ëœ™\Ù]

NÂˆ™]\›ˆÂˆÜ\ÝˆÙ\\˜]Q›Ü›Nˆ˜[ÙKˆÙ\\˜]PØ[˜\Îˆ\Õ\Ú[™ÓÝÛØ[˜\ÂˆNÂˆBˆ\Þ[˜ÈØ]™J]˜[X]Ü‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊHÂˆ™]\›ˆ[ÂˆBˆÙ]Ý™\›^\Õ^ÛÛ[

HÂˆ™]\›ˆ˜[ÙNÂˆBˆÙ]\Õ^ÛÛ[

HÂˆ™]\›ˆ˜[ÙNÂˆBˆ\Þ[˜È^˜XÝ^ÛÛ[
]˜[X]Ü‹\ÚËšY]Ð›Þ
HÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆ™]\›ŽÂˆBˆÛÛœÝ™\ÛÝ\˜Ù\ÈH]ØZ]\Ë›ØY™\ÛÝ\˜Ù\Ê‘TÓÕTÑT×ÒÑVT×ÕVÐÓÓ•S•\Ë˜\X\˜[˜ÙJNÂˆÛÛœÝ^H×NÂˆÛÛœÝY™™\ˆH×NÂˆ]š\œÝÜÚ][Û–H[™š[š]NÂˆ]š\œÝÜÚ][Û–HH[™š[š]NÂˆ]š\œÝÜÚ][ÛˆH[ÂˆÛÛœÝÚ[šÈHÂˆ\Ú\™YÚ^™NˆX]’[™š[š]Kˆ™XYNˆYKˆ[œ]Y]YJÚ[šËÚ^™JHÂˆ›Üˆ
ÛÛœÝ][HÙˆÚ[šËš][\ÊHÂˆYˆ
][KœÝˆOOH[™Yš[™Y
HÂˆÛÛ[YNÂˆBˆš\œÝÜÚ][Û–HX]›Z[Šš\œÝÜÚ][Û–][K˜[œÙ›Ü›VÍJNÂˆš\œÝÜÚ][Û–HHX]›Z[Šš\œÝÜÚ][Û–K][K˜[œÙ›Ü›VÍWJNÂˆY™™\‹œ\Ú
][KœÝŠNÂˆYˆ
][Kš\ÑSÓ
HÂˆ^œ\Ú
Y™™\‹š›Ú[ŠˆŠKš[Q[™

JNÂˆY™™\‹›[™ÝHÂˆBˆBˆBˆNÂˆ]ØZ]]˜[X]Ü‹™Ù]^ÛÛ[
ÂˆÝ™X[Nˆ\Ë˜\X\˜[˜ÙKˆ\ÚËˆ™\ÛÝ\˜Ù\Ëˆ[˜ÛYSX\šÙYÛÛ[ˆYKˆÙY\Ú]TÜXÙNˆYKˆÚ[šËˆšY]Ð›ÞˆJNÂˆ\Ëœ™\Ù]

NÂˆYˆ
š\œÝÜÚ][Û–OOH[™š[š]JHÂˆš\œÝÜÚ][ÛˆHÙš\œÝÜÚ][Û–š\œÝÜÚ][Û–WNÂˆBˆYˆ
Y™™\‹›[™Ý
HÂˆ^œ\Ú
Y™™\‹š›Ú[ŠˆŠKš[Q[™

JNÂˆBˆYˆ
^›[™ÝˆH^ÌJHÂˆÛÛœÝ\X\˜[˜ÙQXÝH\Ë˜\X\˜[˜ÙK™XÝÂˆÛÛœÝ˜›ÞHÛÚÝ\™XÝ
\X\˜[˜ÙQXÝ™Ù]\œ˜^J›ÞŠK[
NÂˆÛÛœÝX]š^HÛÚÝ\X]š^
\X\˜[˜ÙQXÝ™Ù]\œ˜^J“X]š^ŠK[
NÂˆ\Ë™]K^ÜÚ][ÛˆH\Ë—Ý˜[œÙ›Ü›TÚ[
š\œÝÜÚ][Û‹˜›ÞX]š^
NÂˆ\Ë™]K^ÛÛ[H^ÂˆBˆBˆÝ˜[œÙ›Ü›TÚ[
ÛÛÜ™Ë˜›ÞX]š^
HÂˆÛÛœÝÂˆ™XÝˆHH\Ë™]NÂˆ˜›ÞHÌKWNÂˆX]š^HÌKKNÂˆÛÛœÝ˜[œÙ›Ü›HHÙ]˜[œÙ›Ü›SX]š^
™XÝ˜›ÞX]š^
NÂˆ˜[œÙ›Ü›VÍHOH™XÝÌNÂˆ˜[œÙ›Ü›VÍWHOH™XÝÌWNÂˆÛÛœÝHÛÛÜ™ËœÛXÙJ
NÂˆ][˜\U˜[œÙ›Ü›J˜[œÙ›Ü›JNÂˆ][˜\U˜[œÙ›Ü›JX]š^
NÂˆ™]\›ˆÂˆBˆÙ]šY[Øš™XÝ

HÂˆYˆ
\Ë™]KšÚYYÊHÂˆ™]\›ˆÂˆYˆ\Ë™]KšYˆXÝ[ÛœÎˆ\Ë™]K˜XÝ[ÛœËˆ˜[YNˆ\Ë™]K™šY[˜[YKˆÝ›ÚÙPÛÛÜŽˆ\Ë™]K˜›Ü™\ÛÛÜ‹ˆš[ÛÛÜŽˆ\Ë™]K˜˜XÚÙÜ›Ý[™ÛÛÜ‹ˆ\Nˆˆ‹ˆÚYYÎˆ\Ë™]KšÚYYËˆYÙNˆ\Ë™]KœYÙR[™^ˆ›Ý][ÛŽˆ\Ëœ›Ý][Û‚ˆNÂˆBˆ™]\›ˆ[ÂˆBˆ™\Ù]

HÂˆ›Üˆ
ÛÛœÝÝ™X[HÙˆ\Ë—ÜÝ™X[\ÊHÂˆÝ™X[Kœ™\Ù]

NÂˆBˆBˆØÛÛœÝXÝšY[˜[YJXÝ
HÂˆYˆ
YXÝš\Ê•ŠH	‰ˆYXÝš\Ê”\™[ŠJHÂˆØ\›Š•[šÛ›ÝÛˆšY[˜[YK˜[[™È˜XÚÈÈ[\HšY[˜[YKˆŠNÂˆ™]\›ˆˆŽÂˆBˆYˆ
YXÝš\Ê”\™[ŠJHÂˆ™]\›ˆÝš[™ÕÔ”Ýš[™ÊXÝ™Ù]
•ŠJNÂˆBˆÛÛœÝšY[˜[YHH×NÂˆYˆ
XÝš\Ê•ŠJHÂˆšY[˜[YK[œÚY
Ýš[™ÕÔ”Ýš[™ÊXÝ™Ù]
•ŠJJNÂˆBˆ]ÛÜXÝHXÝÂˆÛÛœÝš\Ú]YH™]È™Y”Ù]

NÂˆYˆ
XÝ›Øš’Y
HÂˆš\Ú]Yœ]
XÝ›Øš’Y
NÂˆBˆÚ[H
ÛÜXÝš\Ê”\™[ŠJHÂˆÛÜXÝHÛÜXÝ™Ù]
”\™[ŠNÂˆYˆ
JÛÜXÝ[œÝ[˜Ù[ÙˆXÝ
HÛÜXÝ›Øš’Y	‰ˆš\Ú]Yš\ÊÛÜXÝ›Øš’Y
JHÂˆœ™XZÎÂˆBˆYˆ
ÛÜXÝ›Øš’Y
HÂˆš\Ú]Yœ]
ÛÜXÝ›Øš’Y
NÂˆBˆYˆ
ÛÜXÝš\Ê•ŠJHÂˆšY[˜[YK[œÚY
Ýš[™ÕÔ”Ýš[™ÊÛÜXÝ™Ù]
•ŠJJNÂˆBˆBˆ™]\›ˆšY[˜[YKš›Ú[Š‹ˆŠNÂˆBˆÙÙ]]XÚY[Y
œÑXÝœÔ™Y‹[››Ý][Û‘ÛØ˜[Ë\ÔÛÝ[™H˜[ÙJHÂˆYˆ
JœÑXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ˆ[™Yš[™YÂˆBˆYˆ
JœÔ™Yˆ[œÝ[˜Ù[Ùˆ™YŠJHÂˆœÔ™YˆHš[TÜXËœXÚÔ]›Ü›R][JœÑXÝ™Ù]
‘QˆŠKYJNÂˆBˆ™]\›ˆœÔ™Yˆ[œÝ[˜Ù[Ùˆ™YˆÈ[››Ý][Û‘ÛØ˜[Ë˜Ø][ÙË™Ù]]XÚY[Y›Ü[››Ý][ÛŠœÔ™Y‹\ÔÛÝ[™
Hˆ[™Yš[™YÂˆBˆÙ]ÚY

HÂˆ™]\›ˆ\Ë™]Kœ™XÝÌ—HH\Ë™]Kœ™XÝÌNÂˆBˆÙ]ZYÚ

HÂˆ™]\›ˆ\Ë™]Kœ™XÝÌ×HH\Ë™]Kœ™XÝÌWNÂˆBŸB˜Û\ÜÈ[››Ý][Û›Ü™\”Ý[HÂˆÚYHNÂˆ˜]ÕÚYHNÂˆÝ[HH[››Ý][Û›Ü™\”Ý[U\K”ÓÓQÂˆ\Ú\œ˜^HHÌ×NÂˆÜš^›Û[ÛÜ›™\”˜Y]\ÈHÂˆ™\XØ[ÛÜ›™\”˜Y]\ÈHÂˆÙ]ÚY
ÚY™XÝHÌJHÂˆYˆ
ÚY[œÝ[˜Ù[Ùˆ˜[YJHÂˆ\ËÚYHÂˆ™]\›ŽÂˆBˆYˆ
\[ÙˆÚYOOH›[X™\ˆŠHÂˆYˆ
ÚYˆ
HÂˆ\Ëœ˜]ÕÚYHÚYÂˆÛÛœÝX^ÚYH
™XÝÌ—HH™XÝÌJHÈŽÂˆÛÛœÝX^ZYÚH
™XÝÌ×HH™XÝÌWJHÈŽÂˆYˆ
X^ÚYˆ	‰ˆX^ZYÚˆ	‰ˆ
ÚYˆX^ÚYÚYˆX^ZYÚ
JHÂˆØ\›Š[››Ý][Û›Ü™\”Ý[KœÙ]ÚYHYÛ›Üš[™ÈÚYˆ	ÝÚYX
NÂˆÚYHNÂˆBˆBˆ\ËÚYHÚYÂˆBˆBˆÙ]Ý[JÝ[JHÂˆYˆ
JÝ[H[œÝ[˜Ù[Ùˆ˜[YJJHÂˆ™]\›ŽÂˆBˆÝÚ]Ú
Ý[K›˜[YJHÂˆØ\ÙH”ÈŽ‚ˆ\ËœÝ[HH[››Ý][Û›Ü™\”Ý[U\K”ÓÓQÂˆœ™XZÎÂˆØ\ÙH‘Ž‚ˆ\ËœÝ[HH[››Ý][Û›Ü™\”Ý[U\K‘TÒQÂˆœ™XZÎÂˆØ\ÙHˆŽ‚ˆ\ËœÝ[HH[››Ý][Û›Ü™\”Ý[U\K‘U‘SQÂˆœ™XZÎÂˆØ\ÙH’HŽ‚ˆ\ËœÝ[HH[››Ý][Û›Ü™\”Ý[U\K’S”ÑUÂˆœ™XZÎÂˆØ\ÙH•HŽ‚ˆ\ËœÝ[HH[››Ý][Û›Ü™\”Ý[U\K•S‘T“S‘NÂˆœ™XZÎÂˆY˜][‚ˆœ™XZÎÂˆBˆBˆÙ]\Ú\œ˜^J\Ú\œ˜^K›Ü˜ÙTÝ[HH˜[ÙJHÂˆYˆ
\œ˜^Kš\Ð\œ˜^J\Ú\œ˜^JJHÂˆ]\Õ˜[YHYNÂˆ][™\›ÜÈHYNÂˆ›Üˆ
ÛÛœÝ[[Y[Ùˆ\Ú\œ˜^JHÂˆÛÛœÝ˜[Y[X™\ˆH
Ù[[Y[HÂˆYˆ
]˜[Y[X™\ŠHÂˆ\Õ˜[YH˜[ÙNÂˆœ™XZÎÂˆH[ÙHYˆ
[[Y[ˆ
HÂˆ[™\›ÜÈH˜[ÙNÂˆBˆBˆYˆ
\Ú\œ˜^K›[™ÝOOH\Õ˜[Y	‰ˆX[™\›ÜÊHÂˆ\Ë™\Ú\œ˜^HH\Ú\œ˜^NÂˆYˆ
›Ü˜ÙTÝ[JHÂˆ\ËœÙ]Ý[J˜[YK™Ù]
‘ŠJNÂˆBˆH[ÙHÂˆ\ËÚYHÂˆBˆH[ÙHYˆ
\Ú\œ˜^JHÂˆ\ËÚYHÂˆBˆBˆÙ]Üš^›Û[ÛÜ›™\”˜Y]\Ê˜Y]\ÊHÂˆYˆ
[X™\‹š\Ò[YÙ\Š˜Y]\ÊJHÂˆ\ËšÜš^›Û[ÛÜ›™\”˜Y]\ÈH˜Y]\ÎÂˆBˆBˆÙ]™\XØ[ÛÜ›™\”˜Y]\Ê˜Y]\ÊHÂˆYˆ
[X™\‹š\Ò[YÙ\Š˜Y]\ÊJHÂˆ\Ë™\XØ[ÛÜ›™\”˜Y]\ÈH˜Y]\ÎÂˆBˆBŸB˜Û\ÜÈX\šÝ\[››Ý][Ûˆ^[™È[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆHH\˜[\ÎÂˆYˆ
XÝš\Ê’T•ŠJHÂˆÛÛœÝ˜]ÒT•HXÝ™Ù]˜]Ê’T•ŠNÂˆ\Ë™]Kš[”™\UÈH˜]ÒT•[œÝ[˜Ù[Ùˆ™YˆÈ˜]ÒT•ÔÝš[™Ê
Hˆ[ÂˆÛÛœÝHXÝ™Ù]
”•ŠNÂˆ\Ë™]Kœ™\U\HH[œÝ[˜Ù[Ùˆ˜[YHÈ›˜[YHˆ[››Ý][Û”™\U\K”‘TNÂˆBˆ]Ü\™YˆH[ÂˆYˆ
\Ë™]Kœ™\U\HOOH[››Ý][Û”™\U\K‘Ô“ÕT
HÂˆÛÛœÝ\™[HXÝ™Ù]
’T•ŠNÂˆ\ËœÙ]]J\™[™Ù]
•ŠJNÂˆ\Ë™]K]SØšˆH\Ë—Ý]NÂˆ\ËœÙ]ÛÛ[Ê\™[™Ù]
ÛÛ[ÈŠJNÂˆ\Ë™]K˜ÛÛ[ÓØšˆH\Ë—ØÛÛ[ÎÂˆYˆ
\\™[š\ÊÜ™X][Û‘]HŠJHÂˆ\Ë™]K˜Ü™X][Û‘]HH[ÂˆH[ÙHÂˆ\ËœÙ]Ü™X][Û‘]J\™[™Ù]
Ü™X][Û‘]HŠJNÂˆ\Ë™]K˜Ü™X][Û‘]HH\Ë˜Ü™X][Û‘]NÂˆBˆYˆ
\\™[š\Ê“HŠJHÂˆ\Ë™]K›[ÙYšXØ][Û‘]HH[ÂˆH[ÙHÂˆ\ËœÙ][ÙYšXØ][Û‘]J\™[™Ù]
“HŠJNÂˆ\Ë™]K›[ÙYšXØ][Û‘]HH\Ë›[ÙYšXØ][Û‘]NÂˆBˆÜ\™YˆH\™[™Ù]˜]Ê”Ü\ŠNÂˆYˆ
\\™[š\ÊÈŠJHÂˆ\Ë™]K˜ÛÛÜˆH[ÂˆH[ÙHÂˆ\ËœÙ]ÛÛÜŠ\™[™Ù]\œ˜^JÈŠJNÂˆ\Ë™]K˜ÛÛÜˆH\Ë˜ÛÛÜŽÂˆBˆH[ÙHÂˆ\Ë™]K]SØšˆH\Ë—Ý]NÂˆ\ËœÙ]Ü™X][Û‘]JXÝ™Ù]
Ü™X][Û‘]HŠJNÂˆ\Ë™]K˜Ü™X][Û‘]HH\Ë˜Ü™X][Û‘]NÂˆÜ\™YˆHXÝ™Ù]˜]Ê”Ü\ŠNÂˆYˆ
YXÝš\ÊÈŠJHÂˆ\Ë™]K˜ÛÛÜˆH[ÂˆBˆBˆ\Ë™]KœÜ\™YˆHÜ\™Yˆ[œÝ[˜Ù[Ùˆ™YˆÈÜ\™Y‹ÔÝš[™Ê
Hˆ[ÂˆYˆ
XÝš\Ê”ÈŠJHÂˆ\Ë™]KœšXÚ^HQ˜XÝÜžK™Ù]šXÚ^\Ò[
XÝ™Ù]
”ÈŠJNÂˆBˆBˆÙ]Ü™X][Û‘]JÜ™X][Û‘]JHÂˆ\Ë˜Ü™X][Û‘]HH\[ÙˆÜ™X][Û‘]HOOHœÝš[™ÈˆÈÜ™X][Û‘]Hˆ[ÂˆBˆÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜KˆÝ›ÚÙPÛÛÜ‹ˆš[ÛÛÜ‹ˆ›[™[ÙKˆÝ›ÚÙP[Kˆš[[KˆÚ[ÐØ[˜XÚÂˆJHÂˆÛÛœÝ˜›ÞH\Ë™]Kœ™XÝH“ÖÒS’UœÛXÙJ
NÂˆÛÛœÝY™™\ˆHÈœH—NÂˆYˆ
^˜JHÂˆY™™\‹œ\Ú
^˜JNÂˆBˆYˆ
Ý›ÚÙPÛÛÜŠHÂˆY™™\‹œ\Ú
	ÜÝ›ÚÙPÛÛÜ–Ì_H	ÜÝ›ÚÙPÛÛÜ–ÌW_H	ÜÝ›ÚÙPÛÛÜ–Ì—_H‘Ø
NÂˆBˆYˆ
š[ÛÛÜŠHÂˆY™™\‹œ\Ú
	Ùš[ÛÛÜ–Ì_H	Ùš[ÛÛÜ–ÌW_H	Ùš[ÛÛÜ–Ì—_H™Ø
NÂˆBˆÛÛœÝÚ[Ð\œ˜^HH\Ë™]Kœ]XYÚ[È›Ø]Ì\œ˜^K™œ›ÛJÝ\Ëœ™XÝ[™ÛVÌK\Ëœ™XÝ[™ÛVÌ×K\Ëœ™XÝ[™ÛVÌ—K\Ëœ™XÝ[™ÛVÌ×K\Ëœ™XÝ[™ÛVÌK\Ëœ™XÝ[™ÛVÌWK\Ëœ™XÝ[™ÛVÌ—K\Ëœ™XÝ[™ÛVÌWWJNÂˆ›Üˆ
]HHZHHÚ[Ð\œ˜^K›[™ÝÈHZNÈH
ÏH
HÂˆÛÛœÝÚ[ÈHÚ[ÐØ[˜XÚÊY™™\‹Ú[Ð\œ˜^KœÝX˜\œ˜^JKH
È
JNÂˆ][œ™XÝ›Ý[™[™Ð›Þ
‹‹œÚ[Ë˜›Þ
NÂˆBˆY™™\‹œ\Ú
”HŠNÂˆÛÛœÝ›Ü›QXÝH™]ÈXÝ
™YŠNÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[QXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[HH™]ÈÝš[™ÔÝ™X[JY™™\‹š›Ú[ŠˆŠK\X\˜[˜ÙTÝ™X[QXÝ
NÂˆ›Ü›QXÝœÙ]
‘›L‹\X\˜[˜ÙTÝ™X[JNÂˆÛÛœÝÜÑXÝH™]ÈXÝ
™YŠNÂˆYˆ
›[™[ÙJHÂˆÜÑXÝœÙ]Y“˜[YJ“H‹›[™[ÙJNÂˆBˆÜÑXÝœÙ]Y“[X™\ŠÐH‹Ý›ÚÙP[JNÂˆÜÑXÝœÙ]Y“[X™\Š˜ØH‹š[[JNÂˆÛÛœÝÝ]QXÝH™]ÈXÝ
™YŠNÂˆÝ]QXÝœÙ]
‘ÔÌ‹ÜÑXÝ
NÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH™]ÈXÝ
™YŠNÂˆ™\ÛÝ\˜Ù\ËœÙ]
‘^ÔÝ]H‹Ý]QXÝ
NÂˆ™\ÛÝ\˜Ù\ËœÙ]
–Øš™XÝ‹›Ü›QXÝ
NÂˆÛÛœÝ\X\˜[˜ÙQXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙQXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÊNÂˆ\X\˜[˜ÙQXÝœÙ]
›Þ‹˜›Þ
NÂˆ\Ë˜\X\˜[˜ÙHH™]ÈÝš[™ÔÝ™X[J‹ÑÔÌÜÈÑ›LÈ‹\X\˜[˜ÙQXÝ
NÂˆ\Ë—ÜÝ™X[\Ëœ\Ú
\Ë˜\X\˜[˜ÙK\X\˜[˜ÙTÝ™X[JNÂˆBˆÝ]XÈ\Þ[˜ÈÜ™X]S™]Ð[››Ý][ÛŠ™Y‹[››Ý][Û‹Ú[™Ù\Ë\˜[\ÊHÂˆÛÛœÝ[››Ý][Û”™YˆH[››Ý][Û‹œ™YˆH™Y‹™Ù]™]Õ[\Ü˜\žT™YŠ
NÂˆÛÛœÝ\H]ØZ]\Ë˜Ü™X]S™]Ð\X\˜[˜ÙTÝ™X[J[››Ý][Û‹™Y‹\˜[\ÊNÂˆ][››Ý][Û‘XÝÂˆYˆ
\
HÂˆÛÛœÝ\™YˆH™Y‹™Ù]™]Õ[\Ü˜\žT™YŠ
NÂˆ[››Ý][Û‘XÝH\Ë˜Ü™X]S™]ÑXÝ
[››Ý][Û‹™Y‹Âˆ\™Y‚ˆJNÂˆÚ[™Ù\Ëœ]
\™Y‹Âˆ]Nˆ\ˆJNÂˆH[ÙHÂˆ[››Ý][Û‘XÝH\Ë˜Ü™X]S™]ÑXÝ
[››Ý][Û‹™Y‹ßJNÂˆBˆYˆ
[X™\‹š\Ò[YÙ\Š[››Ý][Û‹œ\™[™YRY
JHÂˆ[››Ý][Û‘XÝœÙ]
”ÝXÝ\™[‹[››Ý][Û‹œ\™[™YRY
NÂˆBˆÚ[™Ù\Ëœ]
[››Ý][Û”™Y‹Âˆ]Nˆ[››Ý][Û‘XÝˆJNÂˆÛÛœÝ™]™YˆHÂˆ™YŽˆ[››Ý][Û”™Y‚ˆNÂˆÛÛœÝÂˆÜ\ˆHH[››Ý][ÛŽÂˆYˆ
Ü\
HÂˆYˆ
Ü\™[]Y
HÂˆ[››Ý][Û‘XÝ™[]J”Ü\ŠNÂˆ[››Ý][Û‘XÝ™[]JÛÛ[ÈŠNÂˆ[››Ý][Û‘XÝ™[]J”ÈŠNÂˆ™]\›ˆ™]™YŽÂˆBˆÛÛœÝÜ\™YˆHÜ\œ™YˆH™Y‹™Ù]™]Õ[\Ü˜\žT™YŠ
NÂˆÜ\œ\™[H[››Ý][Û”™YŽÂˆÛÛœÝÜ\XÝHÜ\[››Ý][Û‹˜Ü™X]S™]ÑXÝ
Ü\™YŠNÂˆÚ[™Ù\Ëœ]
Ü\™Y‹Âˆ]NˆÜ\XÝˆJNÂˆ[››Ý][Û‘XÝœÙ]Y‘Yš[™Y
ÛÛ[È‹Ýš[™ÕÐ\ØÚZSÜ•UŒM‘JÜ\˜ÛÛ[ÊJNÂˆ[››Ý][Û‘XÝœÙ]
”Ü\‹Ü\™YŠNÂˆ™]\›ˆÜ™]™Y‹Âˆ™YŽˆÜ\™Y‚ˆWNÂˆBˆ™]\›ˆ™]™YŽÂˆBˆÝ]XÈ\Þ[˜ÈÜ™X]S™]Ôš[[››Ý][ÛŠ[››Ý][Û‘ÛØ˜[Ë™Y‹[››Ý][Û‹\˜[\ÊHÂˆÛÛœÝ\H]ØZ]\Ë˜Ü™X]S™]Ð\X\˜[˜ÙTÝ™X[J[››Ý][Û‹™Y‹\˜[\ÊNÂˆÛÛœÝ[››Ý][Û‘XÝH\Ë˜Ü™X]S™]ÑXÝ
[››Ý][Û‹™Y‹\ÈÂˆ\ˆHˆßJNÂˆÛÛœÝ™]Ð[››Ý][ÛˆH™]È\Ëœ›ÝÝ\K˜ÛÛœÝXÝÜŠÂˆXÝˆ[››Ý][Û‘XÝˆ™Y‹ˆ[››Ý][Û‘ÛØ˜[Ëˆ]˜[X]Ü“Ü[ÛœÎˆ\˜[\Ë™]˜[X]Ü“Ü[ÛœÂˆJNÂˆYˆ
[››Ý][Û‹œ™YŠHÂˆ™]Ð[››Ý][Û‹œ™YˆH™]Ð[››Ý][Û‹œ™Y•Ô™\XÙHH[››Ý][Û‹œ™YŽÂˆBˆ™]\›ˆ™]Ð[››Ý][ÛŽÂˆBŸB˜Û\ÜÈÚYÙ][››Ý][Ûˆ^[™È[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‹ˆ[››Ý][Û‘ÛØ˜[ÂˆHH\˜[\ÎÂˆÛÛœÝ]HH\Ë™]NÂˆ\Ë—Û™YY\X\˜[˜Ù\ÈH\˜[\Ë›™YY\X\˜[˜Ù\ÎÂˆYˆ
]K™šY[˜[YHOOH[™Yš[™Y
HÂˆ]K™šY[˜[YHH\Ë—ØÛÛœÝXÝšY[˜[YJXÝ
NÂˆBˆYˆ
]K˜XÝ[ÛœÈOOH[™Yš[™Y
HÂˆ]K˜XÝ[ÛœÈHÛÛXÝXÝ[ÛœÊ™Y‹XÝ[››Ý][ÛXÝ[Û‘]™[\JNÂˆBˆ]šY[˜[YHHÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ•ˆ‹ˆÙ]\œ˜^NˆYBˆJNÂˆ]K™šY[˜[YHH\Ë—ÙXÛÙQ›Ü›U˜[YJšY[˜[YJNÂˆÛÛœÝY˜][šY[˜[YHHÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ‘ˆ‹ˆÙ]\œ˜^NˆYBˆJNÂˆ]K™Y˜][šY[˜[YHH\Ë—ÙXÛÙQ›Ü›U˜[YJY˜][šY[˜[YJNÂˆYˆ
šY[˜[YHOOH[™Yš[™Y	‰ˆ[››Ý][Û‘ÛØ˜[Ëž˜Q]\Ù]ÊHÂˆÛÛœÝ]H\Ë—Ý]KœÝŽÂˆYˆ
]
HÂˆ\Ë—Ú\Õ˜[YQœ›ÛVHHYNÂˆ]K™šY[˜[YHHšY[˜[YHH[››Ý][Û‘ÛØ˜[Ëž˜Q]\Ù]Ë™Ù]˜[YJ]
NÂˆBˆBˆYˆ
šY[˜[YHOOH[™Yš[™Y	‰ˆ]K™Y˜][šY[˜[YHOOH[
HÂˆ]K™šY[˜[YHH]K™Y˜][šY[˜[YNÂˆBˆ]K˜[\›˜]]™U^HÝš[™ÕÔ”Ýš[™ÊXÝ™Ù]
•HŠHˆŠNÂˆ\ËœÙ]Y˜][\X\˜[˜ÙJ\˜[\ÊNÂˆ]Kš\Ð\X\˜[˜ÙHH\Ë—Û™YY\X\˜[˜Ù\È	‰ˆ]K™šY[˜[YHOOH[™Yš[™Y	‰ˆ]K™šY[˜[YHOOH[ÂˆÛÛœÝšY[\HHÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ‘•‚ˆJNÂˆ]K™šY[\HHšY[\H[œÝ[˜Ù[Ùˆ˜[YHÈšY[\K›˜[YHˆ[ÂˆÛÛœÝØØ[™\ÛÝ\˜Ù\ÈHÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ‘ˆ‚ˆJNÂˆÛÛœÝXÜ›Ñ›Ü›T™\ÛÝ\˜Ù\ÈH[››Ý][Û‘ÛØ˜[Ë˜XÜ›Ñ›Ü›K™Ù]
‘ˆŠNÂˆÛÛœÝ\X\˜[˜ÙT™\ÛÝ\˜Ù\ÈH\Ë˜\X\˜[˜ÙOË™XÝ™Ù]
”™\ÛÝ\˜Ù\ÈŠNÂˆ\Ë—ÙšY[™\ÛÝ\˜Ù\ÈHÂˆØØ[™\ÛÝ\˜Ù\ËˆXÜ›Ñ›Ü›T™\ÛÝ\˜Ù\Ëˆ\X\˜[˜ÙT™\ÛÝ\˜Ù\ËˆY\™ÙY™\ÛÝ\˜Ù\ÎˆXÝ›Y\™ÙJÂˆ™Y‹ˆXÝ\œ˜^NˆÛØØ[™\ÛÝ\˜Ù\Ë\X\˜[˜ÙT™\ÛÝ\˜Ù\ËXÜ›Ñ›Ü›T™\ÛÝ\˜Ù\×KˆY\™ÙTÝX‘XÝÎˆYBˆJBˆNÂˆ]K™šY[›YÜÈHÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ‘™ˆ‚ˆJNÂˆYˆ
S[X™\‹š\Ò[YÙ\Š]K™šY[›YÜÊH]K™šY[›YÜÈ
HÂˆ]K™šY[›YÜÈHÂˆBˆ]Kœ\ÜÝÛÜ™H\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË”TÔÕÓÔ‘
NÂˆ]Kœ™XYÛ›HH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË”‘PQÓ“JNÂˆ]Kœ™\]Z\™YH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË”‘TURT‘Q
NÂˆ]KšY[ˆH\Ë—Ú\Ñ›YÊ]K˜[››Ý][Û‘›YÜË[››Ý][Û‘›YË’QSŠH\Ë—Ú\Ñ›YÊ]K˜[››Ý][Û‘›YÜË[››Ý][Û‘›YË““Õ’QUÊNÂˆBˆÙXÛÙQ›Ü›U˜[YJ›Ü›U˜[YJHÂˆYˆ
\œ˜^Kš\Ð\œ˜^J›Ü›U˜[YJJHÂˆÛÛœÝ\œˆH›Ü›U˜[YK›X\
][HOˆ\Ë—ÙXÛÙQ›Ü›U˜[YJ][JJK™š[\Š][HOˆ][HOOH[
NÂˆ™]\›ˆ\œ‹›[™ÝˆÈ\œˆˆ[ÂˆH[ÙHYˆ
›Ü›U˜[YH[œÝ[˜Ù[Ùˆ˜[YJHÂˆ™]\›ˆ›Ü›U˜[YK›˜[YNÂˆH[ÙHYˆ
\[Ùˆ›Ü›U˜[YHOOHœÝš[™ÈŠHÂˆ™]\›ˆÝš[™ÕÔ”Ýš[™Ê›Ü›U˜[YJNÂˆBˆ™]\›ˆ[ÂˆBˆ\ÑšY[›YÊ›YÊHÂˆ™]\›ˆHJ\Ë™]K™šY[›YÜÈ	ˆ›YÊNÂˆBˆÚ\ÕšY]ØX›J›YÜÊHÂˆ™]\›ˆYNÂˆBˆ]\Ý™UšY]ÙY
[››Ý][Û”ÝÜ˜YÙK™[™\‘›Ü›\ÊHÂˆYˆ
™[™\‘›Ü›\ÊHÂˆ™]\›ˆ\ËšY]ØX›NÂˆBˆ™]\›ˆÝ\\‹›]\Ý™UšY]ÙY
[››Ý][Û”ÝÜ˜YÙK™[™\‘›Ü›\ÊH	‰ˆ]\Ë—Ú\Ñ›YÊ\Ë™›YÜË[››Ý][Û‘›YË““Õ’QUÊNÂˆBˆÙ]›Ý][Û“X]š^
[››Ý][Û”ÝÜ˜YÙJHÂˆ]›Ý][ÛˆH[››Ý][Û”ÝÜ˜YÙOË™Ù]
\Ë™]KšY
OËœ›Ý][ÛŽÂˆYˆ
›Ý][ÛˆOOH[™Yš[™Y
HÂˆ›Ý][ÛˆH\Ëœ›Ý][ÛŽÂˆBˆ™]\›ˆ›Ý][ÛˆOOHÈQS•UWÓPU’VˆÙ]›Ý][Û“X]š^
›Ý][Û‹\ËÚY\ËšZYÚ
NÂˆBˆÙ]›Ü™\[™˜XÚÙÜ›Ý[™\X\˜[˜Ù\Ê[››Ý][Û”ÝÜ˜YÙJHÂˆ]›Ý][ÛˆH[››Ý][Û”ÝÜ˜YÙOË™Ù]
\Ë™]KšY
OËœ›Ý][ÛŽÂˆYˆ
›Ý][ÛˆOOH[™Yš[™Y
HÂˆ›Ý][ÛˆH\Ëœ›Ý][ÛŽÂˆBˆYˆ
]\Ë˜˜XÚÙÜ›Ý[™ÛÛÜˆ	‰ˆ]\Ë˜›Ü™\ÛÛÜŠHÂˆ™]\›ˆˆŽÂˆBˆÛÛœÝ™XÝH›Ý][ÛˆOOH›Ý][ÛˆOOHNÈ	Ý\ËÚYH	Ý\ËšZYÚH™Xˆ	Ý\ËšZYÚH	Ý\ËÚYH™XÂˆ]ÝˆHˆŽÂˆYˆ
\Ë˜˜XÚÙÜ›Ý[™ÛÛÜŠHÂˆÝˆH	ÙÙ]ÛÛÜŠ\Ë˜˜XÚÙÜ›Ý[™ÛÛÜ‹YJ_H	Ü™XÝHˆÂˆBˆYˆ
\Ë˜›Ü™\ÛÛÜŠHÂˆÛÛœÝ›Ü™\•ÚYH\Ë˜›Ü™\”Ý[KÚYNÂˆÝˆ
ÏH	Ø›Ü™\•ÚYHÈ	ÙÙ]ÛÛÜŠ\Ë˜›Ü™\ÛÛÜ‹˜[ÙJ_H	Ü™XÝHÈÂˆBˆ™]\›ˆÝŽÂˆBˆ\Þ[˜ÈÙ]Ü\˜]Ü“\Ý
]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJHÂˆYˆ
[[	ˆ™[™\š[™Ò[[›YËS““ÕUSÓ”×Ñ“Ô“TÈ	‰ˆJ\È[œÝ[˜Ù[ÙˆÚYÛ˜]\™UÚYÙ][››Ý][ÛŠH	‰ˆ]\Ë™]K››ÒS	‰ˆ]\Ë™]Kš\ÓÝÛØ[˜\ÊHÂˆÛÛœÝ\ÝH\Ë—ÙÙ]Ü\˜]Ü“\Ý›Ð\X\˜[˜ÙJ
NÂˆ\ÝœÙ\\˜]Q›Ü›HHYNÂˆ™]\›ˆ\ÝÂˆBˆYˆ
]\Ë—Ú\Õ^
HÂˆ™]\›ˆÝ\\‹™Ù]Ü\˜]Ü“\Ý
]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJNÂˆBˆÛÛœÝÛÛ[H]ØZ]\Ë—ÙÙ]\X\˜[˜ÙJ]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJNÂˆYˆ
\Ë˜\X\˜[˜ÙH	‰ˆÛÛ[OOH[
HÂˆ™]\›ˆÝ\\‹™Ù]Ü\˜]Ü“\Ý
]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJNÂˆBˆÛÛœÝÜ\ÝH™]ÈÜ\˜]Ü“\Ý

NÂˆYˆ
]\Ë—ÙY˜][\X\˜[˜ÙHÛÛ[OOH[
HÂˆ™]\›ˆÂˆÜ\ÝˆÙ\\˜]Q›Ü›Nˆ˜[ÙKˆÙ\\˜]PØ[˜\Îˆ˜[ÙBˆNÂˆBˆÛÛœÝ\Õ\Ú[™ÓÝÛØ[˜\ÈHHJ\Ë™]Kš\ÓÝÛØ[˜\È	‰ˆ[[	ˆ™[™\š[™Ò[[›YË‘TÔVJNÂˆÛÛœÝX]š^HÌKKNÂˆÛÛœÝ˜›ÞHÌ\ËÚY\ËšZYÚNÂˆÛÛœÝ˜[œÙ›Ü›HHÙ]˜[œÙ›Ü›SX]š^
\Ë™]Kœ™XÝ˜›ÞX]š^
NÂˆÛÛœÝÜ[Û˜[ÛÛ[H\Ë—ÛØÎÂˆYˆ
Ü[Û˜[ÛÛ[OOH[™Yš[™Y
HÂˆÜ\Ý˜YÜ
ÔË˜™YÚ[“X\šÙYÛÛ[›ÜËÈ“ÐÈ‹Ü[Û˜[ÛÛ[JNÂˆBˆÜ\Ý˜YÜ
ÔË˜™YÚ[[››Ý][Û‹Ý\Ë™]KšY\Ë™]Kœ™XÝ˜[œÙ›Ü›K\Ë™Ù]›Ý][Û“X]š^
[››Ý][Û”ÝÜ˜YÙJK\Õ\Ú[™ÓÝÛØ[˜\×JNÂˆÛÛœÝÝ™X[HH™]ÈÝš[™ÔÝ™X[JÛÛ[
NÂˆ]ØZ]]˜[X]Ü‹™Ù]Ü\˜]Ü“\Ý
ÂˆÝ™X[Kˆ\ÚËˆ™\ÛÝ\˜Ù\Îˆ\Ë—ÙšY[™\ÛÝ\˜Ù\Ë›Y\™ÙY™\ÛÝ\˜Ù\ËˆÜ\˜]Ü“\ÝˆÜ\ÝˆJNÂˆÜ\Ý˜YÜ
ÔË™[™[››Ý][Û‹×JNÂˆYˆ
Ü[Û˜[ÛÛ[OOH[™Yš[™Y
HÂˆÜ\Ý˜YÜ
ÔË™[™X\šÙYÛÛ[×JNÂˆBˆ™]\›ˆÂˆÜ\ÝˆÙ\\˜]Q›Ü›Nˆ˜[ÙKˆÙ\\˜]PØ[˜\Îˆ\Õ\Ú[™ÓÝÛØ[˜\ÂˆNÂˆBˆÙÙ]RÑXÝ
›Ý][ÛŠHÂˆÛÛœÝZÈH™]ÈXÝ
[
NÂˆYˆ
›Ý][ÛŠHÂˆZËœÙ]
”ˆ‹›Ý][ÛŠNÂˆBˆZËœÙ]Y\œ˜^JÈ‹Ù]ÛÛÜ\œ˜^J\Ë˜›Ü™\ÛÛÜŠJNÂˆZËœÙ]Y\œ˜^J‘È‹Ù]ÛÛÜ\œ˜^J\Ë˜˜XÚÙÜ›Ý[™ÛÛÜŠJNÂˆ™]\›ˆZËœÚ^™HˆÈZÈˆ[ÂˆBˆ[Y[™Ø]™YXÝ
[››Ý][Û”ÝÜ˜YÙKXÝ
HßBˆÙ]˜[YJXÝ˜[YK™Y‹Ú[™Ù\ÊHÂˆÛÛœÝÂˆXÝˆ\™[XÝˆ™YŽˆ\™[™Y‚ˆHHÙ]\™[Õ\]JXÝ\Ëœ™Y‹™YŠNÂˆYˆ
\\™[XÝ
HÂˆXÝœÙ]
•ˆ‹˜[YJNÂˆH[ÙHYˆ
XÚ[™Ù\Ëš\Ê\™[™YŠJHÂˆÛÛœÝ™]Ô\™[XÝH\™[XÝ˜ÛÛ™J
NÂˆ™]Ô\™[XÝœÙ]
•ˆ‹˜[YJNÂˆÚ[™Ù\Ëœ]
\™[™Y‹Âˆ]Nˆ™]Ô\™[XÝˆJNÂˆ™]\›ˆ™]Ô\™[XÝÂˆBˆ™]\›ˆ[ÂˆBˆ\Þ[˜ÈØ]™J]˜[X]Ü‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊHÂˆÛÛœÝÝÜ˜YÙQ[žHH[››Ý][Û”ÝÜ˜YÙOË™Ù]
\Ë™]KšY
NÂˆÛÛœÝ›YÜÈH\Ë—ØZ[›YÜÊÝÜ˜YÙQ[žOË››ÕšY]ËÝÜ˜YÙQ[žOË››Ôš[
NÂˆ]˜[YHHÝÜ˜YÙQ[žOË˜[YKˆ›Ý][ÛˆHÝÜ˜YÙQ[žOËœ›Ý][ÛŽÂˆYˆ
˜[YHOOH\Ë™]K™šY[˜[YH˜[YHOOH[™Yš[™Y
HÂˆYˆ
]\Ë—Ú\Õ˜[YQœ›ÛVH	‰ˆ›Ý][ÛˆOOH[™Yš[™Y	‰ˆ›YÜÈOOH[™Yš[™Y
HÂˆ™]\›ŽÂˆBˆ˜[YHH\Ë™]K™šY[˜[YNÂˆBˆYˆ
›Ý][ÛˆOOH[™Yš[™Y	‰ˆ]\Ë—Ú\Õ˜[YQœ›ÛVH	‰ˆ\œ˜^Kš\Ð\œ˜^J˜[YJH	‰ˆ\œ˜^Kš\Ð\œ˜^J\Ë™]K™šY[˜[YJH	‰ˆ\Ð\œ˜^Q\]X[
˜[YK\Ë™]K™šY[˜[YJH	‰ˆ›YÜÈOOH[™Yš[™Y
HÂˆ™]\›ŽÂˆBˆYˆ
›Ý][ÛˆOOH[™Yš[™Y
HÂˆ›Ý][ÛˆH\Ëœ›Ý][ÛŽÂˆBˆ]\X\˜[˜ÙHH[ÂˆYˆ
]\Ë—Û™YY\X\˜[˜Ù\ÊHÂˆ\X\˜[˜ÙHH]ØZ]\Ë—ÙÙ]\X\˜[˜ÙJ]˜[X]Ü‹\ÚË™[™\š[™Ò[[›YË”ÐU‘K[››Ý][Û”ÝÜ˜YÙJNÂˆYˆ
\X\˜[˜ÙHOOH[	‰ˆ›YÜÈOOH[™Yš[™Y
HÂˆ™]\›ŽÂˆBˆH[ÙHßBˆ]™YY\X\˜[˜Ù\ÈH˜[ÙNÂˆYˆ
\X\˜[˜ÙOË›™YY\X\˜[˜Ù\ÊHÂˆ™YY\X\˜[˜Ù\ÈHYNÂˆ\X\˜[˜ÙHH[ÂˆBˆÛÛœÝÂˆ™Y‚ˆHH]˜[X]ÜŽÂˆÛÛœÝÜšYÚ[˜[XÝH™Y‹™™]ÚY”™YŠ\Ëœ™YŠNÂˆYˆ
JÜšYÚ[˜[XÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆÛÛœÝXÝH™]ÈXÝ
™YŠNÂˆ›Üˆ
ÛÛœÝÚÙ^K˜]Õ˜[HÙˆÜšYÚ[˜[XÝ™Ù]˜]Ñ[šY\Ê
JHÂˆYˆ
Ù^HOOHTŠHÂˆXÝœÙ]
Ù^K˜]Õ˜[
NÂˆBˆBˆYˆ
›YÜÈOOH[™Yš[™Y
HÂˆXÝœÙ]
‘ˆ‹›YÜÊNÂˆYˆ
\X\˜[˜ÙHOOH[	‰ˆ[™YY\X\˜[˜Ù\ÊHÂˆÛÛœÝ\HÜšYÚ[˜[XÝ™Ù]˜]ÊTŠNÂˆYˆ
\
HÂˆXÝœÙ]
T‹\
NÂˆBˆBˆBˆÛÛœÝ˜HHÂˆ]ˆ\Ë™]K™šY[˜[YKˆ˜[YBˆNÂˆÛÛœÝ™]Ô\™[XÝH\ËœÙ]˜[YJXÝ\œ˜^Kš\Ð\œ˜^J˜[YJHÈ˜[YK›X\
Ýš[™ÕÐ\ØÚZSÜ•UŒM‘JHˆÝš[™ÕÐ\ØÚZSÜ•UŒM‘J˜[YJK™Y‹Ú[™Ù\ÊNÂˆ\Ë˜[Y[™Ø]™YXÝ
[››Ý][Û”ÝÜ˜YÙK™]Ô\™[XÝXÝ
NÂˆÛÛœÝX^X™SRÈH\Ë—ÙÙ]RÑXÝ
›Ý][ÛŠNÂˆYˆ
X^X™SRÊHÂˆXÝœÙ]
“RÈ‹X^X™SRÊNÂˆBˆÚ[™Ù\Ëœ]
\Ëœ™Y‹Âˆ]NˆXÝˆ˜Kˆ™YY\X\˜[˜Ù\ÂˆJNÂˆYˆ
\X\˜[˜ÙHOOH[
HÂˆÛÛœÝ™]Ô™YˆH™Y‹™Ù]™]Õ[\Ü˜\žT™YŠ
NÂˆÛÛœÝTH™]ÈXÝ
™YŠNÂˆXÝœÙ]
T‹T
NÂˆTœÙ]
“ˆ‹™]Ô™YŠNÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH\Ë—ÙÙ]Ø]™QšY[™\ÛÝ\˜Ù\Ê™YŠKˆ\X\˜[˜ÙQXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙQXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆ\X\˜[˜ÙQXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÊNÂˆÛÛœÝ˜›ÞH›Ý][Ûˆ	HNOOHÈÌ\ËÚY\ËšZYÚHˆÌ\ËšZYÚ\ËÚYNÂˆ\X\˜[˜ÙQXÝœÙ]
›Þ‹˜›Þ
NÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[HH™]ÈÝš[™ÔÝ™X[J\X\˜[˜ÙK\X\˜[˜ÙQXÝ
NÂˆÛÛœÝ›Ý][Û“X]š^H\Ë™Ù]›Ý][Û“X]š^
[››Ý][Û”ÝÜ˜YÙJNÂˆYˆ
›Ý][Û“X]š^OOHQS•UWÓPU’V
HÂˆ\X\˜[˜ÙQXÝœÙ]
“X]š^‹›Ý][Û“X]š^
NÂˆBˆÚ[™Ù\Ëœ]
™]Ô™Y‹Âˆ]Nˆ\X\˜[˜ÙTÝ™X[Kˆ˜Nˆ[ˆ™YY\X\˜[˜Ù\Îˆ˜[ÙBˆJNÂˆBˆXÝœÙ]
“H‹‰ÙÙ][ÙYšXØ][Û‘]J
_X
NÂˆBˆ\Þ[˜ÈÙÙ]\X\˜[˜ÙJ]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJHÂˆYˆ
\Ë™]Kœ\ÜÝÛÜ™
HÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÝÜ˜YÙQ[žHH[››Ý][Û”ÝÜ˜YÙOË™Ù]
\Ë™]KšY
NÂˆ]˜[YK›Ý][ÛŽÂˆYˆ
ÝÜ˜YÙQ[žJHÂˆ˜[YHHÝÜ˜YÙQ[žK™›Ü›X]Y˜[YHÝÜ˜YÙQ[žK˜[YNÂˆ›Ý][ÛˆHÝÜ˜YÙQ[žKœ›Ý][ÛŽÂˆBˆYˆ
›Ý][ÛˆOOH[™Yš[™Y	‰ˆ˜[YHOOH[™Yš[™Y	‰ˆ]\Ë—Û™YY\X\˜[˜Ù\ÊHÂˆYˆ
]\Ë—Ú\Õ˜[YQœ›ÛVH\Ë˜\X\˜[˜ÙJHÂˆ™]\›ˆ[ÂˆBˆBˆÛÛœÝÛÛÜœÈH\Ë™Ù]›Ü™\[™˜XÚÙÜ›Ý[™\X\˜[˜Ù\Ê[››Ý][Û”ÝÜ˜YÙJNÂˆYˆ
˜[YHOOH[™Yš[™Y
HÂˆ˜[YHH\Ë™]K™šY[˜[YNÂˆYˆ
]˜[YJHÂˆ™]\›ˆÕ“PÈH	ØÛÛÜœßTHSPØÂˆBˆBˆYˆ
\œ˜^Kš\Ð\œ˜^J˜[YJH	‰ˆ˜[YK›[™ÝOOHJHÂˆ˜[YHH˜[YVÌNÂˆBˆ\ÜÙ\
\[Ùˆ˜[YHOOHœÝš[™È‹‘^XÝY˜[YXÈ™HHÝš[™ËˆŠNÂˆ˜[YHH˜[YKš[Q[™

NÂˆYˆ
\Ë™]K˜ÛÛX›ÊHÂˆÛÛœÝÜ[ÛˆH\Ë™]K›Ü[ÛœË™š[™

Âˆ^Ü˜[YBˆJHOˆ˜[YHOOH^Ü˜[YJNÂˆ˜[YHHÜ[ÛË™\Ü^U˜[YH˜[YNÂˆBˆYˆ
˜[YHOOHˆŠHÂˆ™]\›ˆÕ“PÈH	ØÛÛÜœßTHSPØÂˆBˆYˆ
›Ý][ÛˆOOH[™Yš[™Y
HÂˆ›Ý][ÛˆH\Ëœ›Ý][ÛŽÂˆBˆ][™PÛÝ[HLNÂˆ][™\ÎÂˆYˆ
\Ë™]K›][S[™JHÂˆ[™\ÈH˜[YKœÜ]
×—ß‹ÊK›X\
[™HOˆ[™K››Ü›X[^™J“‘ÈŠJNÂˆ[™PÛÝ[H[™\Ë›[™ÝÂˆH[ÙHÂˆ[™\ÈHÝ˜[YKœ™\XÙJ×—ß‹ËˆŠK››Ü›X[^™J“‘ÈŠWNÂˆBˆÛÛœÝY˜][Y[™ÈHNÂˆÛÛœÝY˜][Y[™ÈHŽÂˆ]ÂˆÚYˆÝ[ÚYˆZYÚˆÝ[ZYÚˆHH\ÎÂˆYˆ
›Ý][ÛˆOOHL›Ý][ÛˆOOHÌ
HÂˆÝÝ[ÚYÝ[ZYÚHHÝÝ[ZYÚÝ[ÚYNÂˆBˆYˆ
]\Ë—ÙY˜][\X\˜[˜ÙJHÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]HH\œÙQY˜][\X\˜[˜ÙJ\Ë—ÙY˜][\X\˜[˜ÙHH‹Ò[™]XØHˆÈŠNÂˆBˆ]›ÛH]ØZ]ÚYÙ][››Ý][Û‹—ÙÙ]›Û]J]˜[X]Ü‹\ÚË\Ë™]K™Y˜][\X\˜[˜ÙQ]K\Ë—ÙšY[™\ÛÝ\˜Ù\Ë›Y\™ÙY™\ÛÝ\˜Ù\ÊNÂˆ]Y˜][\X\˜[˜ÙK›ÛÚ^™K[™RZYÚÂˆÛÛœÝ[˜ÛÙY[™\ÈH×NÂˆ][˜ÛÙ[™Ñ\œ›ÜˆH˜[ÙNÂˆ›Üˆ
ÛÛœÝ[™HÙˆ[™\ÊHÂˆÛÛœÝ[˜ÛÙYÝš[™ÈH›Û™[˜ÛÙTÝš[™Ê[™JNÂˆYˆ
[˜ÛÙYÝš[™Ë›[™ÝˆJHÂˆ[˜ÛÙ[™Ñ\œ›ÜˆHYNÂˆBˆ[˜ÛÙY[™\Ëœ\Ú
[˜ÛÙYÝš[™Ëš›Ú[ŠˆŠJNÂˆBˆYˆ
[˜ÛÙ[™Ñ\œ›Üˆ	‰ˆ[[	ˆ™[™\š[™Ò[[›YË”ÐU‘JHÂˆ™]\›ˆÂˆ™YY\X\˜[˜Ù\ÎˆYBˆNÂˆBˆYˆ
[˜ÛÙ[™Ñ\œ›Üˆ	‰ˆ\Ë—Ú\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜY
HÂˆÛÛœÝ›Û˜[Z[HH\Ë™]K˜ÛÛXˆÈ›[Û›ÜÜXÙHˆˆœØ[œË\Ù\šYˆŽÂˆÛÛœÝ˜ZÙU[šXÛÙQ›ÛH™]È˜ZÙU[šXÛÙQ›Û
]˜[X]Ü‹ž™Y‹›Û˜[Z[JNÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH˜ZÙU[šXÛÙQ›Û˜Ü™X]Q›Û™\ÛÝ\˜Ù\Ê[™\Ëš›Ú[ŠˆŠJNÂˆÛÛœÝ™]Ñ›ÛH™\ÛÝ\˜Ù\Ë™Ù]˜]Ê‘›ÛŠNÂˆYˆ
\Ë—ÙšY[™\ÛÝ\˜Ù\Ë›Y\™ÙY™\ÛÝ\˜Ù\Ëš\Ê‘›ÛŠJHÂˆÛÛœÝÛ›ÛH\Ë—ÙšY[™\ÛÝ\˜Ù\Ë›Y\™ÙY™\ÛÝ\˜Ù\Ë™Ù]
‘›ÛŠNÂˆ›Üˆ
ÛÛœÝÚÙ^K˜]Õ˜[HÙˆ™]Ñ›Û™Ù]˜]Ñ[šY\Ê
JHÂˆÛ›ÛœÙ]
Ù^K˜]Õ˜[
NÂˆBˆH[ÙHÂˆ\Ë—ÙšY[™\ÛÝ\˜Ù\Ë›Y\™ÙY™\ÛÝ\˜Ù\ËœÙ]
‘›Û‹™]Ñ›Û
NÂˆBˆÛÛœÝ›Û˜[YHH˜ZÙU[šXÛÙQ›Û™›Û˜[YK›˜[YNÂˆ›ÛH]ØZ]ÚYÙ][››Ý][Û‹—ÙÙ]›Û]J]˜[X]Ü‹\ÚËÂˆ›Û˜[YKˆ›ÛÚ^™NˆˆK™\ÛÝ\˜Ù\ÊNÂˆ›Üˆ
]HHZHH[˜ÛÙY[™\Ë›[™ÝÈHZNÈJÊÊHÂˆ[˜ÛÙY[™\ÖÚWHHÝš[™ÕÕUŒM”Ýš[™Ê[™\ÖÚWJNÂˆBˆÛÛœÝØ]™YY˜][\X\˜[˜ÙHHØš™XÝ˜\ÜÚYÛŠØš™XÝ˜Ü™X]J[
K\Ë™]K™Y˜][\X\˜[˜ÙQ]JNÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]K™›ÛÚ^™HHÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]K™›Û˜[YHH›Û˜[YNÂˆÙY˜][\X\˜[˜ÙK›ÛÚ^™K[™RZYÚHH\Ë—ØÛÛ\]Q›ÛÚ^™JÝ[ZYÚHˆ
ˆY˜][Y[™ËÝ[ÚYHˆ
ˆY˜][Y[™Ë˜[YK›Û[™PÛÝ[
NÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]HHØ]™YY˜][\X\˜[˜ÙNÂˆH[ÙHÂˆYˆ
]\Ë—Ú\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜY
HÂˆØ\›Š—ÙÙ]\X\˜[˜ÙNˆÙ™œØÜ™Y[Ø[˜\È\È›ÝÝ\ÜY[››Ý][ÛˆX^H›Ý™[™\ˆÛÜœ™XÝKˆŠNÂˆBˆÙY˜][\X\˜[˜ÙK›ÛÚ^™K[™RZYÚHH\Ë—ØÛÛ\]Q›ÛÚ^™JÝ[ZYÚHˆ
ˆY˜][Y[™ËÝ[ÚYHˆ
ˆY˜][Y[™Ë˜[YK›Û[™PÛÝ[
NÂˆBˆ]\ØÙ[H›Û™\ØÙ[ÂˆYˆ
\Ó˜SŠ\ØÙ[
JHÂˆ\ØÙ[HTÑSS‘WÑPÕÔˆ
ˆ[™RZYÚÂˆH[ÙHÂˆ\ØÙ[HX]›X^
TÑSS‘WÑPÕÔˆ
ˆ[™RZYÚX]˜XœÊ\ØÙ[
H
ˆ›ÛÚ^™JNÂˆBˆÛÛœÝY˜][”Y[™ÈHX]›Z[ŠX]™›ÛÜŠ
Ý[ZYÚH›ÛÚ^™JHÈŠKY˜][Y[™ÊNÂˆÛÛœÝ[YÛ›Y[H\Ë™]K^[YÛ›Y[Âˆ]Âˆ\ØÙ[ˆ›Û\ØÙ[ˆ\ØÙ[ˆ›Û\ØÙ[ˆHH›ÛÂˆYˆ
\Ó˜SŠ›Û\ØÙ[
H\Ó˜SŠ›Û\ØÙ[
HY›Û\ØÙ[	‰ˆY›Û\ØÙ[
HÂˆ›Û\ØÙ[H
Êˆ[›[™Y^Ü“S‘WÑPÕÔˆ
‹ÌKŒÍJHH
Êˆ[›[™Y^Ü“S‘WÑTÐÑS•ÑPÕÔˆ
‹ÌŒÍJNÂˆ›Û\ØÙ[H
Êˆ[›[™Y^Ü“S‘WÑTÐÑS•ÑPÕÔˆ
‹ÌŒÍJNÂˆH[ÙHÂˆ›Û\ØÙ[HX]˜XœÊ›Û\ØÙ[
NÂˆBˆÛÛœÝ”ÚYH
Ý[ZYÚH
›Û\ØÙ[
È›Û\ØÙ[
H
ˆ›ÛÚ^™JHÈˆ
È›Û\ØÙ[
ˆ›ÛÚ^™NÂˆYˆ
\Ë™]K›][S[™JHÂˆ™]\›ˆ\Ë—ÙÙ]][[[™P\X\˜[˜ÙJY˜][\X\˜[˜ÙK[˜ÛÙY[™\Ë›Û›ÛÚ^™KÝ[ÚYÝ[ZYÚ[YÛ›Y[Y˜][Y[™ËY˜][”Y[™Ë\ØÙ[[™RZYÚ[››Ý][Û”ÝÜ˜YÙJNÂˆBˆYˆ
\Ë™]K˜ÛÛXŠHÂˆ™]\›ˆ\Ë—ÙÙ]ÛÛX\X\˜[˜ÙJY˜][\X\˜[˜ÙK›Û[˜ÛÙY[™\ÖÌK›ÛÚ^™KÝ[ÚY”ÚY[YÛ›Y[šYJ[™\ÖÌJK™\ˆOOHœ‹[››Ý][Û”ÝÜ˜YÙJNÂˆBˆÛÛœÝ›ÝÛTY[™ÈH”ÚYÂˆYˆ
[YÛ›Y[OOH[YÛ›Y[ˆŠHÂˆ™]\›ˆÕ“PÈH	ØÛÛÜœßP•
ÈY˜][\X\˜[˜ÙH
ÈHH	Û[X™\•ÔÝš[™ÊY˜][Y[™Ê_H	Û[X™\•ÔÝš[™Ê›ÝÛTY[™Ê_HH
	Ù\ØØ\TÝš[™Ê[˜ÛÙY[™\ÖÌJ_JH˜
ÈˆUHSPÈŽÂˆBˆÛÛœÝ™]’[™›ÈHÂˆÚYˆˆNÂˆÛÛœÝ™[™\™Y^H\Ë—Ü™[™\•^
[˜ÛÙY[™\ÖÌK›Û›ÛÚ^™KÝ[ÚY[YÛ›Y[™]’[™›ËY˜][Y[™Ë›ÝÛTY[™ÊNÂˆ™]\›ˆÕ“PÈH	ØÛÛÜœßP•
ÈY˜][\X\˜[˜ÙH
ÈHHH	Ü™[™\™Y^X
ÈˆUHSPÈŽÂˆBˆÝ]XÈ\Þ[˜ÈÙÙ]›Û]J]˜[X]Ü‹\ÚË\X\˜[˜ÙQ]K™\ÛÝ\˜Ù\ÊHÂˆÛÛœÝÜ\˜]Ü“\ÝH™]ÈÜ\˜]Ü“\Ý

NÂˆÛÛœÝ[š]X[Ý]HHÂˆ›Ûˆ[ˆÛÛ™J
HÂˆ™]\›ˆ\ÎÂˆBˆNÂˆÛÛœÝÂˆ›Û˜[YKˆ›ÛÚ^™BˆHH\X\˜[˜ÙQ]NÂˆ]ØZ]]˜[X]Ü‹š[™TÙ]›Û
™\ÛÝ\˜Ù\ËÙ›Û˜[YH	‰ˆ˜[YK™Ù]
›Û˜[YJK›ÛÚ^™WK[Ü\˜]Ü“\Ý\ÚË[š]X[Ý]K[
NÂˆ™]\›ˆ[š]X[Ý]K™›ÛÂˆBˆÙÙ]^ÚY
^›Û
HÂˆ™]\›ˆX]œÝ[T™XÚ\ÙJ›Û˜Ú\œÕÑÛ\Ê^
K›X\
ÈOˆËÚY
JHÈLÂˆBˆØÛÛ\]Q›ÛÚ^™JZYÚÚY^›Û[™PÛÝ[
HÂˆ]Âˆ›ÛÚ^™BˆHH\Ë™]K™Y˜][\X\˜[˜ÙQ]NÂˆ][™RZYÚH
›ÛÚ^™HLŠH
ˆ
Êˆ[›[™Y^Ü“S‘WÑPÕÔˆ
‹ÌKŒÍJKˆ[X™\“Ù“[™\ÈHX]œ›Ý[™
ZYÚÈ[™RZYÚ
NÂˆYˆ
Y›ÛÚ^™JHÂˆÛÛœÝ›Ý[™Ú]ÛÑYÚ]ÈHOˆX]™›ÛÜŠ
ˆL
HÈLÂˆYˆ
[™PÛÝ[OOHLJHÂˆÛÛœÝ^ÚYH\Ë—ÙÙ]^ÚY
^›Û
NÂˆ›ÛÚ^™HH›Ý[™Ú]ÛÑYÚ]ÊX]›Z[ŠZYÚÈ
Êˆ[›[™Y^Ü“S‘WÑPÕÔˆ
‹ÌKŒÍJKÚYÈ^ÚY
JNÂˆ[X™\“Ù“[™\ÈHNÂˆH[ÙHÂˆÛÛœÝ[™\ÈH^œÜ]
×—ß‹ÊNÂˆÛÛœÝØXÚY[™\ÈH×NÂˆ›Üˆ
ÛÛœÝ[™HÙˆ[™\ÊHÂˆÛÛœÝ[˜ÛÙYH›Û™[˜ÛÙTÝš[™Ê[™JKš›Ú[ŠˆŠNÂˆÛÛœÝÛ\ÈH›Û˜Ú\œÕÑÛ\Ê[˜ÛÙY
NÂˆÛÛœÝÜÚ][ÛœÈH›Û™Ù]Ú\”ÜÚ][ÛœÊ[˜ÛÙY
NÂˆØXÚY[™\Ëœ\Ú
Âˆ[™Nˆ[˜ÛÙYˆÛ\ËˆÜÚ][ÛœÂˆJNÂˆBˆÛÛœÝ\ÕÛÐšYÈHœÚ^™HOˆÂˆ]Ý[ZYÚHÂˆ›Üˆ
ÛÛœÝØXÚHÙˆØXÚY[™\ÊHÂˆÛÛœÝÚ[šÜÈH\Ë—ÜÜ][™J[›ÛœÚ^™KÚYØXÚJNÂˆÝ[ZYÚ
ÏHÚ[šÜË›[™Ý
ˆœÚ^™NÂˆYˆ
Ý[ZYÚˆZYÚ
HÂˆ™]\›ˆYNÂˆBˆBˆ™]\›ˆ˜[ÙNÂˆNÂˆ[X™\“Ù“[™\ÈHX]›X^
[X™\“Ù“[™\Ë[™PÛÝ[
NÂˆÚ[H
YJHÂˆ[™RZYÚHZYÚÈ[X™\“Ù“[™\ÎÂˆ›ÛÚ^™HH›Ý[™Ú]ÛÑYÚ]Ê[™RZYÚÈ
Êˆ[›[™Y^Ü“S‘WÑPÕÔˆ
‹ÌKŒÍJJNÂˆYˆ
\ÕÛÐšYÊ›ÛÚ^™JJHÂˆ[X™\“Ù“[™\ÊÊÎÂˆÛÛ[YNÂˆBˆœ™XZÎÂˆBˆBˆÛÛœÝÂˆ›Û˜[YKˆ›ÛÛÛÜ‚ˆHH\Ë™]K™Y˜][\X\˜[˜ÙQ]NÂˆ\Ë—ÙY˜][\X\˜[˜ÙHHÜ™X]QY˜][\X\˜[˜ÙJÂˆ›ÛÚ^™Kˆ›Û˜[YKˆ›ÛÛÛÜ‚ˆJNÂˆBˆ™]\›ˆÝ\Ë—ÙY˜][\X\˜[˜ÙK›ÛÚ^™KZYÚÈ[X™\“Ù“[™\×NÂˆBˆÜ™[™\•^
^›Û›ÛÚ^™KÝ[ÚY[YÛ›Y[™]’[™›ËY[™Ë”Y[™ÊHÂˆ]ÚYÂˆYˆ
[YÛ›Y[OOHJHÂˆÛÛœÝÚYH\Ë—ÙÙ]^ÚY
^›Û
H
ˆ›ÛÚ^™NÂˆÚYH
Ý[ÚYHÚY
HÈŽÂˆH[ÙHYˆ
[YÛ›Y[OOHŠHÂˆÛÛœÝÚYH\Ë—ÙÙ]^ÚY
^›Û
H
ˆ›ÛÚ^™NÂˆÚYHÝ[ÚYHÚYHY[™ÎÂˆH[ÙHÂˆÚYHY[™ÎÂˆBˆÛÛœÝÚYÝˆH[X™\•ÔÝš[™ÊÚYH™]’[™›ËœÚY
NÂˆ™]’[™›ËœÚYHÚYÂˆ”Y[™ÈH[X™\•ÔÝš[™Ê”Y[™ÊNÂˆ™]\›ˆ	ÜÚYÝŸH	Ý”Y[™ßH
	Ù\ØØ\TÝš[™Ê^
_JH˜ÂˆBˆÙÙ]Ø]™QšY[™\ÛÝ\˜Ù\Ê™YŠHÂˆÛÛœÝÂˆØØ[™\ÛÝ\˜Ù\Ëˆ\X\˜[˜ÙT™\ÛÝ\˜Ù\ËˆXÜ›Ñ›Ü›T™\ÛÝ\˜Ù\ÂˆHH\Ë—ÙšY[™\ÛÝ\˜Ù\ÎÂˆÛÛœÝ›Û˜[YHH\Ë™]K™Y˜][\X\˜[˜ÙQ]OË™›Û˜[YNÂˆYˆ
Y›Û˜[YJHÂˆ™]\›ˆØØ[™\ÛÝ\˜Ù\ÈXÝ™[\NÂˆBˆ›Üˆ
ÛÛœÝ™\ÛÝ\˜Ù\ÈÙˆÛØØ[™\ÛÝ\˜Ù\Ë\X\˜[˜ÙT™\ÛÝ\˜Ù\×JHÂˆYˆ
™\ÛÝ\˜Ù\È[œÝ[˜Ù[ÙˆXÝ
HÂˆÛÛœÝØØ[›ÛH™\ÛÝ\˜Ù\Ë™Ù]
‘›ÛŠNÂˆYˆ
ØØ[›Û[œÝ[˜Ù[ÙˆXÝ	‰ˆØØ[›Ûš\Ê›Û˜[YJJHÂˆ™]\›ˆ™\ÛÝ\˜Ù\ÎÂˆBˆBˆBˆYˆ
XÜ›Ñ›Ü›T™\ÛÝ\˜Ù\È[œÝ[˜Ù[ÙˆXÝ
HÂˆÛÛœÝXÜ›Ñ›Ü›Q›ÛHXÜ›Ñ›Ü›T™\ÛÝ\˜Ù\Ë™Ù]
‘›ÛŠNÂˆYˆ
XÜ›Ñ›Ü›Q›Û[œÝ[˜Ù[ÙˆXÝ	‰ˆXÜ›Ñ›Ü›Q›Ûš\Ê›Û˜[YJJHÂˆÛÛœÝÝX‘›ÛXÝH™]ÈXÝ
™YŠNÂˆÝX‘›ÛXÝœÙ]
›Û˜[YKXÜ›Ñ›Ü›Q›Û™Ù]˜]Ê›Û˜[YJJNÂˆÛÛœÝÝX”™\ÛÝ\˜Ù\ÑXÝH™]ÈXÝ
™YŠNÂˆÝX”™\ÛÝ\˜Ù\ÑXÝœÙ]
‘›Û‹ÝX‘›ÛXÝ
NÂˆ™]\›ˆXÝ›Y\™ÙJÂˆ™Y‹ˆXÝ\œ˜^NˆÜÝX”™\ÛÝ\˜Ù\ÑXÝØØ[™\ÛÝ\˜Ù\×KˆY\™ÙTÝX‘XÝÎˆYBˆJNÂˆBˆBˆ™]\›ˆØØ[™\ÛÝ\˜Ù\ÈXÝ™[\NÂˆBˆÙ]šY[Øš™XÝ

HÂˆ™]\›ˆ[ÂˆBŸB˜Û\ÜÈ^ÚYÙ][››Ý][Ûˆ^[™ÈÚYÙ][››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆHH\˜[\ÎÂˆYˆ
XÝš\Ê”QŠJHÂˆ\Ë™›YÜÈH[››Ý][Û‘›YË’QSŽÂˆ\Ë™]KšY[ˆHYNÂˆØ\›Š˜\˜ÛÙ\È\™H›ÝÝ\ÜYŠNÂˆBˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]Kœ™XYÛ›H	‰ˆ]\Ë™]K››ÒSÂˆ\Ë—Ú\Õ^HYNÂˆYˆ
\[Ùˆ\Ë™]K™šY[˜[YHOOHœÝš[™ÈŠHÂˆ\Ë™]K™šY[˜[YHHˆŽÂˆBˆ][YÛ›Y[HÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ”H‚ˆJNÂˆYˆ
S[X™\‹š\Ò[YÙ\Š[YÛ›Y[
H[YÛ›Y[[YÛ›Y[ˆŠHÂˆ[YÛ›Y[H[ÂˆBˆ\Ë™]K^[YÛ›Y[H[YÛ›Y[Âˆ]X^[][S[™ÝHÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ“X^[ˆ‚ˆJNÂˆYˆ
S[X™\‹š\Ò[YÙ\ŠX^[][S[™Ý
HX^[][S[™Ý
HÂˆX^[][S[™ÝHÂˆBˆ\Ë™]K›X^[ˆHX^[][S[™ÝÂˆ\Ë™]K›][S[™HH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË“USSS‘JNÂˆ\Ë™]K˜ÛÛXˆH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YËÓÓPŠH	‰ˆ]\Ë™]K›][S[™H	‰ˆ]\Ë™]Kœ\ÜÝÛÜ™	‰ˆ]\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË‘’STÑSPÕ
H	‰ˆ\Ë™]K›X^[ˆOOHÂˆ\Ë™]K™Ó›ÝØÜ›ÛH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË‘Ó“ÕÐÔ“Ó
NÂˆÛÛœÝÂˆXÝ[ÛœÂˆHH\Ë™]NÂˆYˆ
XXÝ[ÛœÊHÂˆ™]\›ŽÂˆBˆÛÛœÝQ‘]U[YHH×QŠ]_[YJWÊÎ’Ù^\Ý›ÚÙ_›Ü›X]
JÎ‘^
O×
ÉÈ—OÊ×‰È—JÊVÉÈ—O×
NÉÎÂˆ]Ø[•\ÙRS]U[YHH˜[ÙNÂˆÛÛœÝQ›Ü›X]HXÝ[ÛœË™Ù]
‘›Ü›X]ŠKˆRÙ^\Ý›ÚÙHHXÝ[ÛœË™Ù]
’Ù^\Ý›ÚÙHŠNÂˆYˆ
Q›Ü›X]Ë›[™ÝOOHH	‰ˆRÙ^\Ý›ÚÙOË›[™ÝOOHH	‰ˆQ‘]U[YK\Ý
Q›Ü›X]ÌJH	‰ˆQ‘]U[YK\Ý
RÙ^\Ý›ÚÙVÌJHQ›Ü›X]Ë›[™ÝOOH	‰ˆRÙ^\Ý›ÚÙOË›[™ÝOOHH	‰ˆQ‘]U[YK\Ý
RÙ^\Ý›ÚÙVÌJHRÙ^\Ý›ÚÙOË›[™ÝOOH	‰ˆQ›Ü›X]Ë›[™ÝOOHH	‰ˆQ‘]U[YK\Ý
Q›Ü›X]ÌJJHÂˆØ[•\ÙRS]U[YHHYNÂˆBˆÛÛœÝXÝ[ÛœÕÕš\Ú]H×NÂˆYˆ
Q›Ü›X]
HÂˆXÝ[ÛœÕÕš\Ú]œ\Ú
‹‹˜Q›Ü›X]
NÂˆBˆYˆ
RÙ^\Ý›ÚÙJHÂˆXÝ[ÛœÕÕš\Ú]œ\Ú
‹‹˜RÙ^\Ý›ÚÙJNÂˆBˆYˆ
Ø[•\ÙRS]U[YJHÂˆXÝ[ÛœË™[]J’Ù^\Ý›ÚÙHŠNÂˆXÝ[ÛœËœÙ]
‘›Ü›X]‹XÝ[ÛœÕÕš\Ú]
NÂˆBˆ›Üˆ
ÛÛœÝ›Ü›X]XÝ[ÛˆÙˆXÝ[ÛœÕÕš\Ú]
HÂˆÛÛœÝHH›Ü›X]XÝ[Û‹›X]Ú
Q‘]U[YJNÂˆYˆ
[JHÂˆÛÛ[YNÂˆBˆÛÛœÝ\Ñ]HHVÌWHOOH‘]HŽÂˆ]›Ü›X]HVÌ—NÂˆÛÛœÝ[HH\œÙR[
›Ü›X]L
NÂˆYˆ
Z\Ó˜SŠ[JH	‰ˆX]™›ÛÜŠX]›ÙÌL
[JJH
ÈHOOHVÌ—K›[™Ý
HÂˆ›Ü›X]H
\Ñ]HÈ]Q›Ü›X]Èˆ[YQ›Ü›X]ÊVÛ[WHÏÈ›Ü›X]ÂˆBˆ\Ë™]K™]][YQ›Ü›X]H›Ü›X]ÂˆYˆ
XØ[•\ÙRS]U[YJHÂˆœ™XZÎÂˆBˆYˆ
\Ñ]JHÂˆYˆ
ÒS_ÜßË\Ý
›Ü›X]
JHÂˆ\Ë™]K™]][YU\HH™]][YK[ØØ[ŽÂˆ\Ë™]K[YTÝ\HÜÜËË\Ý
›Ü›X]
HÈHˆŒÂˆH[ÙHÂˆ\Ë™]K™]][YU\HH™]HŽÂˆBˆœ™XZÎÂˆBˆ\Ë™]K™]][YU\HH[YHŽÂˆ\Ë™]K[YTÝ\HÜÜËË\Ý
›Ü›X]
HÈHˆŒÂˆœ™XZÎÂˆBˆBˆÙ]\Õ^ÛÛ[

HÂˆ™]\›ˆH]\Ë˜\X\˜[˜ÙH	‰ˆ]\Ë—Û™YY\X\˜[˜Ù\ÎÂˆBˆÙÙ]ÛÛX\X\˜[˜ÙJY˜][\X\˜[˜ÙK›Û^›ÛÚ^™KÚY”ÚY[YÛ›Y[\Ô•[››Ý][Û”ÝÜ˜YÙJHÂˆÛÛœÝÛÛX•ÚYHÚYÈ\Ë™]K›X^[ŽÂˆÛÛœÝÛÛÜœÈH\Ë™Ù]›Ü™\[™˜XÚÙÜ›Ý[™\X\˜[˜Ù\Ê[››Ý][Û”ÝÜ˜YÙJNÂˆÛÛœÝÙ[ÈH›Û™Ù]Ú\”ÜÚ][ÛœÊ^
K›X\

ÜÝ\[™JHOˆÂˆÛÛœÝÛ\H^œÝXœÝš[™ÊÝ\[™
NÂˆ™]\›ˆÂˆÛ\ˆÚYˆ\Ë—ÙÙ]^ÚY
Û\›Û
H
ˆ›ÛÚ^™BˆNÂˆJNÂˆYˆ
\Ô•
HÂˆÙ[Ëœ™]™\œÙJ
NÂˆBˆÛÛœÝ^ÚYHÛÛX•ÚY
ˆÙ[Ë›[™ÝÂˆ]ÚYHÂˆYˆ
[YÛ›Y[OOHJHÂˆÚY
ÏHX]™›ÛÜŠ
ÚYH^ÚY
HÈ
ˆ
ˆÛÛX•ÚY
JH
ˆÛÛX•ÚYÂˆH[ÙHYˆ
[YÛ›Y[OOHŠHÂˆÚY
ÏHÚYH^ÚYÂˆBˆÛÛœÝYˆH×NÂˆ]™]š[Ý\ÕÚYHÂˆ›Üˆ
]HHZHHÙ[Ë›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝÂˆÛ\ˆÚYˆÛ\ÚYˆHHÙ[ÖÚWNÂˆÛÛœÝÚYHHOOHÈ
ÛÛX•ÚYHÛ\ÚY
HÈˆˆÛÛX•ÚY
È
™]š[Ý\ÕÚYHÛ\ÚY
HÈŽÂˆY‹œ\Ú
	Û[X™\•ÔÝš[™ÊÚY
_H
	Ù\ØØ\TÝš[™ÊÛ\
_JH˜
NÂˆ™]š[Ý\ÕÚYHÛ\ÚYÂˆBˆÛÛœÝ™[™\™YÛÛXˆHY‹š›Ú[ŠˆŠNÂˆ™]\›ˆÕ“PÈH	ØÛÛÜœßP•
ÈY˜][\X\˜[˜ÙH
ÈHH	Û[X™\•ÔÝš[™ÊÚY
_H	Û[X™\•ÔÝš[™Ê”ÚY
_HH	Ü™[™\™YÛÛXŸX
ÈˆUHSPÈŽÂˆBˆÙÙ]][[[™P\X\˜[˜ÙJY˜][\X\˜[˜ÙK[™\Ë›Û›ÛÚ^™KÚYZYÚ[YÛ›Y[Y[™Ë”Y[™Ë\ØÙ[[™RZYÚ[››Ý][Û”ÝÜ˜YÙJHÂˆÛÛœÝYˆH×NÂˆÛÛœÝÝ[ÚYHÚYHˆ
ˆY[™ÎÂˆÛÛœÝ™]’[™›ÈHÂˆÚYˆˆNÂˆ›Üˆ
]HHZHH[™\Ë›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝ[™HH[™\ÖÚWNÂˆÛÛœÝÚ[šÜÈH\Ë—ÜÜ][™J[™K›Û›ÛÚ^™KÝ[ÚY
NÂˆ›Üˆ
]ˆHšˆHÚ[šÜË›[™ÝÈˆšŽÈŠÊÊHÂˆÛÛœÝÚ[šÈHÚ[šÜÖÚ—NÂˆÛÛœÝ”ÚYHHOOH	‰ˆˆOOHÈ]”Y[™ÈH
[™RZYÚH\ØÙ[
Hˆ[[™RZYÚÂˆY‹œ\Ú
\Ë—Ü™[™\•^
Ú[šË›Û›ÛÚ^™KÚY[YÛ›Y[™]’[™›ËY[™Ë”ÚY
JNÂˆBˆBˆÛÛœÝÛÛÜœÈH\Ë™Ù]›Ü™\[™˜XÚÙÜ›Ý[™\X\˜[˜Ù\Ê[››Ý][Û”ÝÜ˜YÙJNÂˆÛÛœÝ™[™\™Y^HY‹š›Ú[Š—ˆŠNÂˆ™]\›ˆÕ“PÈH	ØÛÛÜœßP•
ÈY˜][\X\˜[˜ÙH
ÈHH	Û[X™\•ÔÝš[™ÊZYÚ
_HH	Ü™[™\™Y^X
ÈˆUHSPÈŽÂˆBˆÜÜ][™J[™K›Û›ÛÚ^™KÚYØXÚHHßJHÂˆ[™HHØXÚK›[™H[™NÂˆÛÛœÝÛ\ÈHØXÚK™Û\È›Û˜Ú\œÕÑÛ\Ê[™JNÂˆYˆ
Û\Ë›[™ÝHJHÂˆ™]\›ˆÛ[™WNÂˆBˆÛÛœÝÜÚ][ÛœÈHØXÚKœÜÚ][ÛœÈ›Û™Ù]Ú\”ÜÚ][ÛœÊ[™JNÂˆÛÛœÝØØ[HH›ÛÚ^™HÈLÂˆÛÛœÝÚ[šÜÈH×NÂˆ]\ÝÜXÙTÜÒ[”Ýš[™ÔÝ\HLKˆ\ÝÜXÙTÜÒ[”Ýš[™Ñ[™HLKˆ\ÝÜXÙTÜÈHLKˆÝ\Ú[šÈHˆÝ\œ™[ÚYHÂˆ›Üˆ
]HHZHHÛ\Ë›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝÜÝ\[™HHÜÚ][ÛœÖÚWNÂˆÛÛœÝÛ\HÛ\ÖÚWNÂˆÛÛœÝÛ\ÚYHÛ\ÚY
ˆØØ[NÂˆYˆ
Û\[šXÛÙHOOHˆŠHÂˆYˆ
Ý\œ™[ÚY
ÈÛ\ÚYˆÚY
HÂˆÚ[šÜËœ\Ú
[™KœÝXœÝš[™ÊÝ\Ú[šËÝ\
JNÂˆÝ\Ú[šÈHÝ\ÂˆÝ\œ™[ÚYHÛ\ÚYÂˆ\ÝÜXÙTÜÒ[”Ýš[™ÔÝ\HLNÂˆ\ÝÜXÙTÜÈHLNÂˆH[ÙHÂˆÝ\œ™[ÚY
ÏHÛ\ÚYÂˆ\ÝÜXÙTÜÒ[”Ýš[™ÔÝ\HÝ\Âˆ\ÝÜXÙTÜÒ[”Ýš[™Ñ[™H[™Âˆ\ÝÜXÙTÜÈHNÂˆBˆH[ÙHYˆ
Ý\œ™[ÚY
ÈÛ\ÚYˆÚY
HÂˆYˆ
\ÝÜXÙTÜÒ[”Ýš[™ÔÝ\OOHLJHÂˆÚ[šÜËœ\Ú
[™KœÝXœÝš[™ÊÝ\Ú[šË\ÝÜXÙTÜÒ[”Ýš[™Ñ[™
JNÂˆÝ\Ú[šÈH\ÝÜXÙTÜÒ[”Ýš[™Ñ[™ÂˆHH\ÝÜXÙTÜÈ
ÈNÂˆ\ÝÜXÙTÜÒ[”Ýš[™ÔÝ\HLNÂˆÝ\œ™[ÚYHÂˆH[ÙHÂˆÚ[šÜËœ\Ú
[™KœÝXœÝš[™ÊÝ\Ú[šËÝ\
JNÂˆÝ\Ú[šÈHÝ\ÂˆÝ\œ™[ÚYHÛ\ÚYÂˆBˆH[ÙHÂˆÝ\œ™[ÚY
ÏHÛ\ÚYÂˆBˆBˆYˆ
Ý\Ú[šÈ[™K›[™Ý
HÂˆÚ[šÜËœ\Ú
[™KœÝXœÝš[™ÊÝ\Ú[šÊJNÂˆBˆ™]\›ˆÚ[šÜÎÂˆBˆ\Þ[˜È^˜XÝ^ÛÛ[
]˜[X]Ü‹\ÚËšY]Ð›Þ
HÂˆ]ØZ]Ý\\‹™^˜XÝ^ÛÛ[
]˜[X]Ü‹\ÚËšY]Ð›Þ
NÂˆÛÛœÝ^H\Ë™]K^ÛÛ[ÂˆYˆ
]^
HÂˆ™]\›ŽÂˆBˆÛÛœÝ[^H^š›Ú[Š—ˆŠNÂˆYˆ
[^OOH\Ë™]K™šY[˜[YJHÂˆ™]\›ŽÂˆBˆÛÛœÝ™YÙ^H[^œ™\XÙP[
ÊËŠŠÏ×‰ßJ
_×WJ_
ÊÊKÙË
ÛKJHOˆHÈ	Ü_Xˆ—ÊÈŠNÂˆYˆ
™]È™YÑ^
—Ê‰Ü™YÙ^WÊ‰
K\Ý
\Ë™]K™šY[˜[YJJHÂˆ\Ë™]K^ÛÛ[H\Ë™]K™šY[˜[YKœÜ]
—ˆŠNÂˆBˆBˆÙ]šY[Øš™XÝ

HÂˆ™]\›ˆÂˆYˆ\Ë™]KšYˆ˜[YNˆ\Ë™]K™šY[˜[YKˆY˜][˜[YNˆ\Ë™]K™Y˜][šY[˜[YHˆ‹ˆ][[[™Nˆ\Ë™]K›][S[™Kˆ\ÜÝÛÜ™ˆ\Ë™]Kœ\ÜÝÛÜ™ˆÚ\“[Z]ˆ\Ë™]K›X^[‹ˆÛÛXŽˆ\Ë™]K˜ÛÛX‹ˆY]X›Nˆ]\Ë™]Kœ™XYÛ›KˆY[Žˆ\Ë™]KšY[‹ˆ˜[YNˆ\Ë™]K™šY[˜[YKˆ™XÝˆ\Ë™]Kœ™XÝˆXÝ[ÛœÎˆ\Ë™]K˜XÝ[ÛœËˆYÙNˆ\Ë™]KœYÙR[™^ˆÝ›ÚÙPÛÛÜŽˆ\Ë™]K˜›Ü™\ÛÛÜ‹ˆš[ÛÛÜŽˆ\Ë™]K˜˜XÚÙÜ›Ý[™ÛÛÜ‹ˆ›Ý][ÛŽˆ\Ëœ›Ý][Û‹ˆ]][YQ›Ü›X]ˆ\Ë™]K™]][YQ›Ü›X]ˆ\Ñ]][YRSˆH]\Ë™]K™]][YU\Kˆ\Nˆ^‚ˆNÂˆBŸB˜Û\ÜÈ]Û•ÚYÙ][››Ý][Ûˆ^[™ÈÚYÙ][››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆ\Ë˜ÚXÚÙY\X\˜[˜ÙHH[Âˆ\Ë[˜ÚXÚÙY\X\˜[˜ÙHH[ÂˆÛÛœÝ\Ô˜Y[ÈH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË”QSÊKˆ\Ô\Ú]ÛˆH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË”TÒ•UÓŠNÂˆ\Ë™]K˜ÚXÚÐ›ÞHZ\Ô˜Y[È	‰ˆZ\Ô\Ú]ÛŽÂˆ\Ë™]Kœ˜Y[Ð]ÛˆH\Ô˜Y[È	‰ˆZ\Ô\Ú]ÛŽÂˆ\Ë™]Kœ\Ú]ÛˆH\Ô\Ú]ÛŽÂˆ\Ë™]Kš\ÕÛÛ\Û›HH˜[ÙNÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈHYNÂˆ\Ë™]K››ÒSH˜[ÙNÂˆYˆ
\Ë™]K˜ÚXÚÐ›Þ
HÂˆ\Ë—Ü›ØÙ\ÜÐÚXÚÐ›Þ
\˜[\ÊNÂˆH[ÙHYˆ
\Ë™]Kœ˜Y[Ð]ÛŠHÂˆ\Ë—Ü›ØÙ\ÜÔ˜Y[Ð]ÛŠ\˜[\ÊNÂˆH[ÙHYˆ
\Ë™]Kœ\Ú]ÛŠHÂˆ\Ë—Ü›ØÙ\ÜÔ\Ú]ÛŠ\˜[\ÊNÂˆH[ÙHÂˆØ\›Š’[˜[YšY[›YÜÈ›Üˆ]ÛˆÚYÙ][››Ý][ÛˆŠNÂˆBˆBˆÙ]ÛÝÛØ[˜\Ô™\]Z\™\Ñ›Ü›\Ê
HÂˆ™]\›ˆ\Ë™]K˜ÚXÚÐ›Þ\Ë™]Kœ˜Y[Ð]ÛŽÂˆBˆÙÙ]Ü\˜]Ü“\Ý›Ü\X\˜[˜ÙJ]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙK›Ý][Û‹\X\˜[˜ÙJHÂˆYˆ
X\X\˜[˜ÙJHÂˆ™]\›ˆ\Ë—ÙÙ]Ü\˜]Ü“\Ý›Ð\X\˜[˜ÙJ
NÂˆBˆÛÛœÝØ]™Y\X\˜[˜ÙHH\Ë˜\X\˜[˜ÙNÂˆÛÛœÝØ]™YX]š^HÛÚÝ\X]š^
\X\˜[˜ÙK™XÝ™Ù]\œ˜^J“X]š^ŠKQS•UWÓPU’V
NÂˆYˆ
›Ý][ÛŠHÂˆ\X\˜[˜ÙK™XÝœÙ]
“X]š^‹\Ë™Ù]›Ý][Û“X]š^
[››Ý][Û”ÝÜ˜YÙJJNÂˆBˆ\Ë˜\X\˜[˜ÙHH\X\˜[˜ÙNÂˆÛÛœÝÜ\˜]Ü“\ÝHÝ\\‹™Ù]Ü\˜]Ü“\Ý
]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJNÂˆ\Ë˜\X\˜[˜ÙHHØ]™Y\X\˜[˜ÙNÂˆ\X\˜[˜ÙK™XÝœÙ]
“X]š^‹Ø]™YX]š^
NÂˆ™]\›ˆÜ\˜]Ü“\ÝÂˆBˆ\Þ[˜ÈÙ]Ü\˜]Ü“\Ý
]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJHÂˆYˆ
\Ë™]Kœ\Ú]ÛŠHÂˆ™]\›ˆÝ\\‹™Ù]Ü\˜]Ü“\Ý
]˜[X]Ü‹\ÚË[[˜[ÙK[››Ý][Û”ÝÜ˜YÙJNÂˆBˆYˆ
[[	ˆ™[™\š[™Ò[[›YË‘TÔVH	‰ˆ[[	ˆ™[™\š[™Ò[[›YËS““ÕUSÓ”×Ñ“Ô“TÈ	‰ˆ
\Ë™]K˜ÚXÚÐ›Þ\Ë™]Kœ˜Y[Ð]ÛŠJHÂˆÛÛœÝÙ]Ø[˜\Ó˜[YHH
Ü\˜]Ü“\Ý˜[YJHOˆÂˆÛÛœÝ[™^HÜ\˜]Ü“\Ý™›\œ˜^Kš[™^ÙŠÔË˜™YÚ[[››Ý][ÛŠNÂˆYˆ
[™^OOHLJHÂˆÜ\˜]Ü“\Ý˜\™ÜÐ\œ˜^VÚ[™^Kœ\Ú
˜[YJNÂˆBˆNÂˆÛÛœÝÚXÚÙYH]ØZ]\ËˆÙÙ]Ü\˜]Ü“\Ý›Ü\X\˜[˜ÙJ]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙK[\Ë˜ÚXÚÙY\X\˜[˜ÙJNÂˆÙ]Ø[˜\Ó˜[YJÚXÚÙY›Ü\Ý˜ÚXÚÙYŠNÂˆÛÛœÝ[˜ÚXÚÙYH]ØZ]\ËˆÙÙ]Ü\˜]Ü“\Ý›Ü\X\˜[˜ÙJ]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙK[\Ë[˜ÚXÚÙY\X\˜[˜ÙJNÂˆÙ]Ø[˜\Ó˜[YJ[˜ÚXÚÙY›Ü\Ý[˜ÚXÚÙYŠNÂˆÚXÚÙY›Ü\Ý˜YÜ\Ý
[˜ÚXÚÙY›Ü\Ý
NÂˆÚXÚÙYœÙ\\˜]Q›Ü›HH[˜ÚXÚÙYœÙ\\˜]Q›Ü›NÂˆÚXÚÙYœÙ\\˜]PØ[˜\ÈH[˜ÚXÚÙYœÙ\\˜]PØ[˜\ÎÂˆ™]\›ˆÚXÚÙYÂˆBˆ]˜[YHH[Âˆ]›Ý][ÛˆH[ÂˆYˆ
[››Ý][Û”ÝÜ˜YÙJHÂˆÛÛœÝÝÜ˜YÙQ[žHH[››Ý][Û”ÝÜ˜YÙK™Ù]
\Ë™]KšY
NÂˆ˜[YHHÝÜ˜YÙQ[žHÈÝÜ˜YÙQ[žK˜[YHˆ[Âˆ›Ý][ÛˆHÝÜ˜YÙQ[žHÈÝÜ˜YÙQ[žKœ›Ý][Ûˆˆ[ÂˆBˆYˆ
˜[YHOOH[	‰ˆ\Ë˜\X\˜[˜ÙJHÂˆ™]\›ˆÝ\\‹™Ù]Ü\˜]Ü“\Ý
]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJNÂˆBˆ˜[YHÏÏH\Ë™]K˜ÚXÚÐ›ÞÈ\Ë™]K™šY[˜[YHOOH\Ë™]K™^Ü˜[YHˆ\Ë™]K™šY[˜[YHOOH\Ë™]K˜]Û•˜[YNÂˆ™]\›ˆ\ËˆÙÙ]Ü\˜]Ü“\Ý›Ü\X\˜[˜ÙJ]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙK›Ý][Û‹˜[YHÈ\Ë˜ÚXÚÙY\X\˜[˜ÙHˆ\Ë[˜ÚXÚÙY\X\˜[˜ÙJNÂˆBˆ\Þ[˜ÈØ]™J]˜[X]Ü‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊHÂˆYˆ
\Ë™]K˜ÚXÚÐ›Þ
HÂˆ\Ë—ÜØ]™PÚXÚØ›Þ
]˜[X]Ü‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊNÂˆ™]\›ŽÂˆBˆYˆ
\Ë™]Kœ˜Y[Ð]ÛŠHÂˆ\Ë—ÜØ]™T˜Y[Ð]ÛŠ]˜[X]Ü‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊNÂˆBˆBˆ\Þ[˜ÈÜØ]™PÚXÚØ›Þ
]˜[X]Ü‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊHÂˆYˆ
X[››Ý][Û”ÝÜ˜YÙJHÂˆ™]\›ŽÂˆBˆÛÛœÝÝÜ˜YÙQ[žHH[››Ý][Û”ÝÜ˜YÙK™Ù]
\Ë™]KšY
NÂˆÛÛœÝ›YÜÈH\Ë—ØZ[›YÜÊÝÜ˜YÙQ[žOË››ÕšY]ËÝÜ˜YÙQ[žOË››Ôš[
NÂˆ]›Ý][ÛˆHÝÜ˜YÙQ[žOËœ›Ý][Û‹ˆ˜[YHHÝÜ˜YÙQ[žOË˜[YNÂˆYˆ
›Ý][ÛˆOOH[™Yš[™Y	‰ˆ›YÜÈOOH[™Yš[™Y
HÂˆYˆ
˜[YHOOH[™Yš[™Y
HÂˆ™]\›ŽÂˆBˆÛÛœÝY˜][˜[YHH\Ë™]K™šY[˜[YHOOH\Ë™]K™^Ü˜[YNÂˆYˆ
Y˜][˜[YHOOH˜[YJHÂˆ™]\›ŽÂˆBˆBˆ]XÝH]˜[X]Ü‹ž™Y‹™™]ÚY”™YŠ\Ëœ™YŠNÂˆYˆ
JXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆXÝHXÝ˜ÛÛ™J
NÂˆYˆ
›Ý][ÛˆOOH[™Yš[™Y
HÂˆ›Ý][ÛˆH\Ëœ›Ý][ÛŽÂˆBˆYˆ
˜[YHOOH[™Yš[™Y
HÂˆ˜[YHH\Ë™]K™šY[˜[YHOOH\Ë™]K™^Ü˜[YNÂˆBˆÛÛœÝ˜HHÂˆ]ˆ\Ë™]K™šY[˜[YKˆ˜[YNˆ˜[YHÈ\Ë™]K™^Ü˜[YHˆˆ‚ˆNÂˆÛÛœÝ˜[YHH˜[YK™Ù]
˜[YHÈ\Ë—ÛÛ”Ý]S˜[YHˆ“Ù™ˆŠNÂˆ\ËœÙ]˜[YJXÝ˜[YK]˜[X]Ü‹ž™Y‹Ú[™Ù\ÊNÂˆXÝœÙ]
TÈ‹˜[YJNÂˆXÝœÙ]
“H‹‰ÙÙ][ÙYšXØ][Û‘]J
_X
NÂˆYˆ
›YÜÈOOH[™Yš[™Y
HÂˆXÝœÙ]
‘ˆ‹›YÜÊNÂˆBˆÛÛœÝX^X™SRÈH\Ë—ÙÙ]RÑXÝ
›Ý][ÛŠNÂˆYˆ
X^X™SRÊHÂˆXÝœÙ]
“RÈ‹X^X™SRÊNÂˆBˆÚ[™Ù\Ëœ]
\Ëœ™Y‹Âˆ]NˆXÝˆ˜Kˆ™YY\X\˜[˜Ù\Îˆ˜[ÙBˆJNÂˆBˆ\Þ[˜ÈÜØ]™T˜Y[Ð]ÛŠ]˜[X]Ü‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊHÂˆYˆ
X[››Ý][Û”ÝÜ˜YÙJHÂˆ™]\›ŽÂˆBˆÛÛœÝÝÜ˜YÙQ[žHH[››Ý][Û”ÝÜ˜YÙK™Ù]
\Ë™]KšY
NÂˆÛÛœÝ›YÜÈH\Ë—ØZ[›YÜÊÝÜ˜YÙQ[žOË››ÕšY]ËÝÜ˜YÙQ[žOË››Ôš[
NÂˆ]›Ý][ÛˆHÝÜ˜YÙQ[žOËœ›Ý][Û‹ˆ˜[YHHÝÜ˜YÙQ[žOË˜[YNÂˆYˆ
›Ý][ÛˆOOH[™Yš[™Y	‰ˆ›YÜÈOOH[™Yš[™Y
HÂˆYˆ
˜[YHOOH[™Yš[™Y
HÂˆ™]\›ŽÂˆBˆÛÛœÝY˜][˜[YHH\Ë™]K™šY[˜[YHOOH\Ë™]K˜]Û•˜[YNÂˆYˆ
Y˜][˜[YHOOH˜[YJHÂˆ™]\›ŽÂˆBˆBˆ]XÝH]˜[X]Ü‹ž™Y‹™™]ÚY”™YŠ\Ëœ™YŠNÂˆYˆ
JXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆXÝHXÝ˜ÛÛ™J
NÂˆYˆ
˜[YHOOH[™Yš[™Y
HÂˆ˜[YHH\Ë™]K™šY[˜[YHOOH\Ë™]K˜]Û•˜[YNÂˆBˆYˆ
›Ý][ÛˆOOH[™Yš[™Y
HÂˆ›Ý][ÛˆH\Ëœ›Ý][ÛŽÂˆBˆÛÛœÝ˜HHÂˆ]ˆ\Ë™]K™šY[˜[YKˆ˜[YNˆ˜[YHÈ\Ë™]K˜]Û•˜[YHˆˆ‚ˆNÂˆÛÛœÝ˜[YHH˜[YK™Ù]
˜[YHÈ\Ë—ÛÛ”Ý]S˜[YHˆ“Ù™ˆŠNÂˆYˆ
˜[YJHÂˆ\ËœÙ]˜[YJXÝ˜[YK]˜[X]Ü‹ž™Y‹Ú[™Ù\ÊNÂˆBˆXÝœÙ]
TÈ‹˜[YJNÂˆXÝœÙ]
“H‹‰ÙÙ][ÙYšXØ][Û‘]J
_X
NÂˆYˆ
›YÜÈOOH[™Yš[™Y
HÂˆXÝœÙ]
‘ˆ‹›YÜÊNÂˆBˆÛÛœÝX^X™SRÈH\Ë—ÙÙ]RÑXÝ
›Ý][ÛŠNÂˆYˆ
X^X™SRÊHÂˆXÝœÙ]
“RÈ‹X^X™SRÊNÂˆBˆÚ[™Ù\Ëœ]
\Ëœ™Y‹Âˆ]NˆXÝˆ˜Kˆ™YY\X\˜[˜Ù\Îˆ˜[ÙBˆJNÂˆBˆÙÙ]Y˜][ÚXÚÙY\X\˜[˜ÙJ\˜[\Ë\JHÂˆÛÛœÝÂˆÚYˆZYÚˆHH\ÎÂˆÛÛœÝ˜›ÞHÌÚYZYÚNÂˆÛÛœÝ“Ó•ÔUSÈHŽÂˆÛÛœÝ›ÛÚ^™HHX]›Z[ŠÚYZYÚ
H
ˆ“Ó•ÔUSÎÂˆ]Y]šXÜËÚ\ŽÂˆYˆ
\HOOH˜ÚXÚÈŠHÂˆY]šXÜÈHÂˆÚYˆÍMH
ˆ›ÛÚ^™KˆZYÚˆÌH
ˆ›ÛÚ^™BˆNÂˆÚ\ˆH—ÌÈŽÂˆH[ÙHYˆ
\HOOH™\ØÈŠHÂˆY]šXÜÈHÂˆÚYˆÎLH
ˆ›ÛÚ^™KˆZYÚˆÌH
ˆ›ÛÚ^™BˆNÂˆÚ\ˆH—ÈŽÂˆH[ÙHÂˆ[œ™XXÚX›JÙÙ]Y˜][ÚXÚÙY\X\˜[˜ÙHH[œÝ\ÜY\Nˆ	Ý\_X
NÂˆBˆÛÛœÝÚYH[X™\•ÔÝš[™Ê
ÚYHY]šXÜËÚY
HÈŠNÂˆÛÛœÝTÚYH[X™\•ÔÝš[™Ê
ZYÚHY]šXÜËšZYÚ
HÈŠNÂˆÛÛœÝ\X\˜[˜ÙHHH•Ô’œÖ˜Qˆ	Ù›ÛÚ^™_HˆÈ	ÞÚYH	ÞTÚYH
	ØÚ\ŸJHˆUXÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[QXÝH™]ÈXÝ
\˜[\Ëž™YŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
‘›Ü›U\H‹JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ•\H‹–Øš™XÝŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
›Þ‹˜›Þ
NÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
“X]š^‹ÌKKJNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
“[™Ý‹\X\˜[˜ÙK›[™Ý
NÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH™]ÈXÝ
\˜[\Ëž™YŠNÂˆÛÛœÝ›ÛH™]ÈXÝ
\˜[\Ëž™YŠNÂˆ›ÛœÙ]
”’œÖ˜Qˆ‹\Ë™˜[˜XÚÑ›ÛXÝ
NÂˆ™\ÛÝ\˜Ù\ËœÙ]
‘›Û‹›Û
NÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÊNÂˆ\Ë˜ÚXÚÙY\X\˜[˜ÙHH™]ÈÝš[™ÔÝ™X[J\X\˜[˜ÙK\X\˜[˜ÙTÝ™X[QXÝ
NÂˆ\Ë—ÜÝ™X[\Ëœ\Ú
\Ë˜ÚXÚÙY\X\˜[˜ÙJNÂˆBˆÙÙ]Û”Ý]S˜[YJXÝ
HÂˆÛÛœÝ\X\˜[˜ÙTÝ]\ÈHXÝ™Ù]
TŠNÂˆYˆ
J\X\˜[˜ÙTÝ]\È[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ›Ü›X[\X\˜[˜ÙHH\X\˜[˜ÙTÝ]\Ë™Ù]
“ˆŠNÂˆYˆ
J›Ü›X[\X\˜[˜ÙH[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ˆ[ÂˆBˆ›Üˆ
ÛÛœÝÙ^HÙˆ›Ü›X[\X\˜[˜ÙK™Ù]Ù^\Ê
JHÂˆYˆ
Ù^HOOH“Ù™ˆŠHÂˆ™]\›ˆÙ^NÂˆBˆBˆ™]\›ˆ[ÂˆBˆÙÙ]^Ü˜[YQ›Ü“Ü[™^
[™^Ü™YŠHÂˆYˆ
[X™\‹š\Ò[YÙ\Š[™^
H	‰ˆ[™^H	‰ˆ[™^Ü›[™Ý
HÂˆÛÛœÝ˜[YHH\Ë—ÙXÛÙQ›Ü›U˜[YJ™Y‹™™]ÚY”™YŠÜÚ[™^JJNÂˆYˆ
\[Ùˆ˜[YHOOHœÝš[™ÈŠHÂˆ™]\›ˆ˜[YNÂˆBˆBˆ™]\›ˆ[ÂˆBˆÙÙ]Ü[™›ÊXÝÛ”Ý]KÜ™YŠHÂˆYˆ
P\œ˜^Kš\Ð\œ˜^JÜ
JHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÝ]UÒ[™^H™]ÈX\

NÂˆ]Ý\œ™[[™^H[ÂˆÛÛœÝšY[\™[HXÝ™Ù]
”\™[ŠNÂˆÛÛœÝÚYÈHšY[\™[[œÝ[˜Ù[ÙˆXÝÈšY[\™[™Ù]
’ÚYÈŠHˆ[ÂˆYˆ
\œ˜^Kš\Ð\œ˜^JÚYÊJHÂˆ›Üˆ
]HHZHHX]›Z[ŠÚYË›[™ÝÜ›[™Ý
NÈHZNÈJÊÊHÂˆÛÛœÝÚYHÚYÖÚWNÂˆYˆ
ÚY[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆ\Ô™YœÑ\]X[
ÚY\Ëœ™YŠJHÂˆÝ\œ™[[™^HNÂˆBˆÛÛœÝÚYXÝH™Y‹™™]ÚY”™YŠÚY
NÂˆYˆ
JÚYXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆYˆ
ÚYXÝOOHXÝ
HÂˆÝ\œ™[[™^HNÂˆBˆÛÛœÝÚYÛ”Ý]HH\Ë—ÙÙ]Û”Ý]S˜[YJÚYXÝ
NÂˆYˆ
\[ÙˆÚYÛ”Ý]HOOHœÝš[™Èˆ	‰ˆ\Ý]UÒ[™^š\ÊÚYÛ”Ý]JJHÂˆÝ]UÒ[™^œÙ]
ÚYÛ”Ý]KJNÂˆBˆBˆH[ÙHYˆ
Ü›[™ÝOOHH	‰ˆ\[ÙˆÛ”Ý]HOOHœÝš[™ÈŠHÂˆÝ\œ™[[™^HÂˆÝ]UÒ[™^œÙ]
Û”Ý]K
NÂˆBˆ™]\›ˆÂˆÝ\œ™[[™^ˆÜˆÝ]UÒ[™^ˆNÂˆBˆÙÙ]^Ü˜[YJÝ]KÜ[™›Ë™YŠHÂˆYˆ
[Ü[™›È\[ÙˆÝ]HOOHœÝš[™ÈˆÝ]HOOH“Ù™ˆŠHÂˆ™]\›ˆÝ]NÂˆBˆYˆ
Ý]HOOH\Ë—ÛÛ”Ý]S˜[YJHÂˆÛÛœÝ^Ü˜[YHH\Ë—ÙÙ]^Ü˜[YQ›Ü“Ü[™^
Ü[™›Ë˜Ý\œ™[[™^Ü[™›Ë›Ü™YŠNÂˆYˆ
^Ü˜[YHOOH[
HÂˆ™]\›ˆ^Ü˜[YNÂˆBˆBˆYˆ
Ü[™›ËœÝ]UÒ[™^š\ÊÝ]JJHÂˆÛÛœÝ^Ü˜[YHH\Ë—ÙÙ]^Ü˜[YQ›Ü“Ü[™^
Ü[™›ËœÝ]UÒ[™^™Ù]
Ý]JKÜ[™›Ë›Ü™YŠNÂˆYˆ
^Ü˜[YHOOH[
HÂˆ™]\›ˆ^Ü˜[YNÂˆBˆBˆÛÛœÝ[™^H\œÙR[
Ý]KL
NÂˆYˆ
[X™\‹š\Ò[YÙ\Š[™^
H	‰ˆÝš[™Ê[™^
HOOHÝ]JHÂˆ™]\›ˆ\Ë—ÙÙ]^Ü˜[YQ›Ü“Ü[™^
[™^Ü[™›Ë›Ü™YŠHÝ]NÂˆBˆ™]\›ˆÝ]NÂˆBˆÜ›ØÙ\ÜÐÚXÚÐ›Þ
\˜[\ÊHÂˆÛÛœÝÝ\ÝÛP\X\˜[˜ÙHH\˜[\Ë™XÝ™Ù]
TŠNÂˆ]›Ü›X[\X\˜[˜ÙHHÝ\ÝÛP\X\˜[˜ÙH[œÝ[˜Ù[ÙˆXÝÈÝ\ÝÛP\X\˜[˜ÙK™Ù]
“ˆŠHˆ[ÂˆYˆ
J›Ü›X[\X\˜[˜ÙH[œÝ[˜Ù[ÙˆXÝ
JHÂˆ›Ü›X[\X\˜[˜ÙHH[ÂˆBˆÛÛœÝ\Õ˜[YHH\Ë—ÙXÛÙQ›Ü›U˜[YJ\˜[\Ë™XÝ™Ù]
TÈŠJNÂˆYˆ
\[Ùˆ\Õ˜[YHOOHœÝš[™ÈŠHÂˆ\Ë™]K™šY[˜[YHH\Õ˜[YNÂˆBˆÛÛœÝY\ÈH\Ë™]K™šY[˜[YHOOH[	‰ˆ\Ë™]K™šY[˜[YHOOH“Ù™ˆˆÈ\Ë™]K™šY[˜[YHˆ–Y\ÈŽÂˆÛÛœÝ^Ü˜[Y\ÈH›Ü›X[\X\˜[˜ÙHÈË‹‹››Ü›X[\X\˜[˜ÙK™Ù]Ù^\Ê
WHˆ×NÂˆYˆ
^Ü˜[Y\Ë›[™ÝOOH
HÂˆ^Ü˜[Y\Ëœ\Ú
“Ù™ˆ‹Y\ÊNÂˆH[ÙHYˆ
^Ü˜[Y\Ë›[™ÝOOHJHÂˆYˆ
^Ü˜[Y\ÖÌHOOH“Ù™ˆŠHÂˆ^Ü˜[Y\Ëœ\Ú
Y\ÊNÂˆH[ÙHÂˆ^Ü˜[Y\Ë[œÚY
“Ù™ˆŠNÂˆBˆH[ÙHYˆ
^Ü˜[Y\Ëš[˜ÛY\ÊY\ÊJHÂˆ^Ü˜[Y\Ë›[™ÝHÂˆ^Ü˜[Y\Ëœ\Ú
“Ù™ˆ‹Y\ÊNÂˆH[ÙHÂˆÛÛœÝÝ\–Y\ÈH^Ü˜[Y\Ë™š[™
ˆOˆˆOOH“Ù™ˆŠNÂˆ^Ü˜[Y\Ë›[™ÝHÂˆ^Ü˜[Y\Ëœ\Ú
“Ù™ˆ‹Ý\–Y\ÊNÂˆBˆÛÛœÝÛ”Ý]HH^Ü˜[Y\ÖÌWNÂˆ\Ë—ÛÛ”Ý]S˜[YHHÛ”Ý]NÂˆÛÛœÝÜHÙ][š\š]X›T›Ü\JÂˆXÝˆ\˜[\Ë™XÝˆÙ^Nˆ“Ü‚ˆJNÂˆÛÛœÝÜ[™›ÈH\Ë—ÙÙ]Ü[™›Ê\˜[\Ë™XÝÛ”Ý]KÜ\˜[\Ëž™YŠNÂˆ\Ë™]K™^Ü˜[YHH\Ë—ÙÙ]^Ü˜[YJÛ”Ý]KÜ[™›Ë\˜[\Ëž™YŠNÂˆYˆ
Y^Ü˜[Y\Ëš[˜ÛY\Ê\Ë™]K™šY[˜[YJH	‰ˆ\Ë™]K™šY[˜[YHOOH\Ë™]K™^Ü˜[YJHÂˆ\Ë™]K™šY[˜[YHH“Ù™ˆŽÂˆBˆ\Ë™]K™šY[˜[YHH\Ë—ÙÙ]^Ü˜[YJ\Ë™]K™šY[˜[YKÜ[™›Ë\˜[\Ëž™YŠNÂˆ\Ë™]K™Y˜][šY[˜[YHH\Ë—ÙÙ]^Ü˜[YJ\Ë™]K™Y˜][šY[˜[YKÜ[™›Ë\˜[\Ëž™YŠNÂˆÛÛœÝÚXÚÙY\X\˜[˜ÙHH›Ü›X[\X\˜[˜ÙOË™Ù]
Û”Ý]JNÂˆ\Ë˜ÚXÚÙY\X\˜[˜ÙHHÚXÚÙY\X\˜[˜ÙH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[HÈÚXÚÙY\X\˜[˜ÙHˆ[ÂˆÛÛœÝ[˜ÚXÚÙY\X\˜[˜ÙHH›Ü›X[\X\˜[˜ÙOË™Ù]
“Ù™ˆŠNÂˆ\Ë[˜ÚXÚÙY\X\˜[˜ÙHH[˜ÚXÚÙY\X\˜[˜ÙH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[HÈ[˜ÚXÚÙY\X\˜[˜ÙHˆ[ÂˆYˆ
\Ë˜ÚXÚÙY\X\˜[˜ÙJHÂˆ\Ë—ÜÝ™X[\Ëœ\Ú
\Ë˜ÚXÚÙY\X\˜[˜ÙJNÂˆH[ÙHÂˆ\Ë—ÙÙ]Y˜][ÚXÚÙY\X\˜[˜ÙJ\˜[\Ë˜ÚXÚÈŠNÂˆBˆYˆ
\Ë[˜ÚXÚÙY\X\˜[˜ÙJHÂˆ\Ë—ÜÝ™X[\Ëœ\Ú
\Ë[˜ÚXÚÙY\X\˜[˜ÙJNÂˆBˆ\Ë—Ù˜[˜XÚÑ›ÛXÝH\Ë™˜[˜XÚÑ›ÛXÝÂˆYˆ
\Ë™]K™Y˜][šY[˜[YHOOH[
HÂˆ\Ë™]K™Y˜][šY[˜[YHH“Ù™ˆŽÂˆBˆBˆÜ›ØÙ\ÜÔ˜Y[Ð]ÛŠ\˜[\ÊHÂˆ\Ë™]K˜]Û•˜[YHH[ÂˆÛÛœÝšY[\™[H\˜[\Ë™XÝ™Ù]
”\™[ŠNÂˆYˆ
šY[\™[[œÝ[˜Ù[ÙˆXÝ
HÂˆ\Ëœ\™[H\˜[\Ë™XÝ™Ù]˜]Ê”\™[ŠNÂˆÛÛœÝšY[\™[˜[YHHšY[\™[™Ù]
•ˆŠNÂˆYˆ
šY[\™[˜[YH[œÝ[˜Ù[Ùˆ˜[YJHÂˆ\Ë™]K™šY[˜[YHH\Ë—ÙXÛÙQ›Ü›U˜[YJšY[\™[˜[YJNÂˆBˆBˆÛÛœÝ\X\˜[˜ÙTÝ]\ÈH\˜[\Ë™XÝ™Ù]
TŠNÂˆYˆ
J\X\˜[˜ÙTÝ]\È[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆÛÛœÝ›Ü›X[\X\˜[˜ÙHH\X\˜[˜ÙTÝ]\Ë™Ù]
“ˆŠNÂˆYˆ
J›Ü›X[\X\˜[˜ÙH[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆ]Û”Ý]HH[Âˆ›Üˆ
ÛÛœÝÙ^HÙˆ›Ü›X[\X\˜[˜ÙK™Ù]Ù^\Ê
JHÂˆYˆ
Ù^HOOH“Ù™ˆŠHÂˆÛ”Ý]HHÙ^NÂˆœ™XZÎÂˆBˆBˆ\Ë—ÛÛ”Ý]S˜[YHHÛ”Ý]NÂˆÛÛœÝÜHÙ][š\š]X›T›Ü\JÂˆXÝˆ\˜[\Ë™XÝˆÙ^Nˆ“Ü‚ˆJNÂˆÛÛœÝÜ[™›ÈH\Ë—ÙÙ]Ü[™›Ê\˜[\Ë™XÝÛ”Ý]KÜ\˜[\Ëž™YŠNÂˆ\Ë™]K˜]Û•˜[YHH\Ë—ÙÙ]^Ü˜[YJÛ”Ý]KÜ[™›Ë\˜[\Ëž™YŠNÂˆ\Ë™]K™šY[˜[YHH\Ë—ÙÙ]^Ü˜[YJ\Ë™]K™šY[˜[YKÜ[™›Ë\˜[\Ëž™YŠNÂˆ\Ë™]K™Y˜][šY[˜[YHH\Ë—ÙÙ]^Ü˜[YJ\Ë™]K™Y˜][šY[˜[YKÜ[™›Ë\˜[\Ëž™YŠNÂˆÛÛœÝÚXÚÙY\X\˜[˜ÙHH›Ü›X[\X\˜[˜ÙK™Ù]
Û”Ý]JNÂˆ\Ë˜ÚXÚÙY\X\˜[˜ÙHHÚXÚÙY\X\˜[˜ÙH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[HÈÚXÚÙY\X\˜[˜ÙHˆ[ÂˆÛÛœÝ[˜ÚXÚÙY\X\˜[˜ÙHH›Ü›X[\X\˜[˜ÙK™Ù]
“Ù™ˆŠNÂˆ\Ë[˜ÚXÚÙY\X\˜[˜ÙHH[˜ÚXÚÙY\X\˜[˜ÙH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[HÈ[˜ÚXÚÙY\X\˜[˜ÙHˆ[ÂˆYˆ
\Ë˜ÚXÚÙY\X\˜[˜ÙJHÂˆ\Ë—ÜÝ™X[\Ëœ\Ú
\Ë˜ÚXÚÙY\X\˜[˜ÙJNÂˆH[ÙHÂˆ\Ë—ÙÙ]Y˜][ÚXÚÙY\X\˜[˜ÙJ\˜[\Ë™\ØÈŠNÂˆBˆYˆ
\Ë[˜ÚXÚÙY\X\˜[˜ÙJHÂˆ\Ë—ÜÝ™X[\Ëœ\Ú
\Ë[˜ÚXÚÙY\X\˜[˜ÙJNÂˆBˆ\Ë—Ù˜[˜XÚÑ›ÛXÝH\Ë™˜[˜XÚÑ›ÛXÝÂˆYˆ
\Ë™]K™Y˜][šY[˜[YHOOH[
HÂˆ\Ë™]K™Y˜][šY[˜[YHH“Ù™ˆŽÂˆBˆBˆÜ›ØÙ\ÜÔ\Ú]ÛŠ\˜[\ÊHÂˆÛÛœÝÂˆXÝˆ[››Ý][Û‘ÛØ˜[ÂˆHH\˜[\ÎÂˆYˆ
YXÝš\ÊHŠH	‰ˆYXÝš\ÊPHŠH	‰ˆ]\Ë™]K˜[\›˜]]™U^
HÂˆØ\›Š”\Ú]ÛœÈÚ]Ý]XÝ[ÛˆXÝ[Û˜\šY\È\™H›ÝÝ\ÜYŠNÂˆ™]\›ŽÂˆBˆ\Ë™]Kš\ÕÛÛ\Û›HHYXÝš\ÊHŠH	‰ˆYXÝš\ÊPHŠNÂˆØ][ÙËœ\œÙQ\ÝXÝ[Û˜\žJÂˆ\ÝXÝˆXÝˆ™\Ý[ØšŽˆ\Ë™]KˆØÐ˜\ÙU\›ˆ[››Ý][Û‘ÛØ˜[Ë˜˜\ÙU\›ˆØÐ]XÚY[Îˆ[››Ý][Û‘ÛØ˜[Ë˜]XÚY[ÂˆJNÂˆBˆÙ]šY[Øš™XÝ

HÂˆ]\HH˜]ÛˆŽÂˆ]^Ü˜[Y\ÎÂˆYˆ
\Ë™]K˜ÚXÚÐ›Þ
HÂˆ\HH˜ÚXÚØ›ÞŽÂˆ^Ü˜[Y\ÈH\Ë™]K™^Ü˜[YNÂˆH[ÙHYˆ
\Ë™]Kœ˜Y[Ð]ÛŠHÂˆ\HHœ˜Y[Ø]ÛˆŽÂˆ^Ü˜[Y\ÈH\Ë™]K˜]Û•˜[YNÂˆBˆ™]\›ˆÂˆYˆ\Ë™]KšYˆ˜[YNˆ\Ë™]K™šY[˜[YH“Ù™ˆ‹ˆY˜][˜[YNˆ\Ë™]K™Y˜][šY[˜[YKˆ^Ü˜[Y\ËˆY]X›Nˆ]\Ë™]Kœ™XYÛ›Kˆ˜[YNˆ\Ë™]K™šY[˜[YKˆ™XÝˆ\Ë™]Kœ™XÝˆY[Žˆ\Ë™]KšY[‹ˆXÝ[ÛœÎˆ\Ë™]K˜XÝ[ÛœËˆYÙNˆ\Ë™]KœYÙR[™^ˆÝ›ÚÙPÛÛÜŽˆ\Ë™]K˜›Ü™\ÛÛÜ‹ˆš[ÛÛÜŽˆ\Ë™]K˜˜XÚÙÜ›Ý[™ÛÛÜ‹ˆ›Ý][ÛŽˆ\Ëœ›Ý][Û‹ˆ\BˆNÂˆBˆÙ]˜[˜XÚÑ›ÛXÝ

HÂˆÛÛœÝXÝH™]ÈXÝ

NÂˆXÝœÙ]Y“˜[YJ˜\ÙQ›Û‹–˜\‘[™Ø˜]ÈŠNÂˆXÝœÙ]Y“˜[YJ•\H‹‘˜[˜XÚÕ\HŠNÂˆXÝœÙ]Y“˜[YJ”ÝX\H‹‘˜[˜XÚÕ\HŠNÂˆXÝœÙ]Y“˜[YJ‘[˜ÛÙ[™È‹–˜\‘[™Ø˜]Ñ[˜ÛÙ[™ÈŠNÂˆ™]\›ˆÚYÝÊ\Ë™˜[˜XÚÑ›ÛXÝ‹XÝ
NÂˆBŸB˜Û\ÜÈÚÚXÙUÚYÙ][››Ý][Ûˆ^[™ÈÚYÙ][››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆ\Ëš[™XÙ\ÈHXÝ™Ù]\œ˜^J’HŠNÂˆ\Ëš\Ò[™XÙ\ÈH\œ˜^Kš\Ð\œ˜^J\Ëš[™XÙ\ÊH	‰ˆ\Ëš[™XÙ\Ë›[™ÝˆÂˆ\Ë™]K›Ü[ÛœÈH×NÂˆÛÛœÝÜ[ÛœÈHÙ][š\š]X›T›Ü\JÂˆXÝˆÙ^Nˆ“Ü‚ˆJNÂˆYˆ
\œ˜^Kš\Ð\œ˜^JÜ[ÛœÊJHÂˆ›Üˆ
]HHZHHÜ[ÛœË›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝÜ[ÛˆH™Y‹™™]ÚY”™YŠÜ[ÛœÖÚWJNÂˆÛÛœÝ\ÓÜ[Û\œ˜^HH\œ˜^Kš\Ð\œ˜^JÜ[ÛŠNÂˆ\Ë™]K›Ü[ÛœÖÚWHHÂˆ^Ü˜[YNˆ\Ë—ÙXÛÙQ›Ü›U˜[YJ\ÓÜ[Û\œ˜^HÈ™Y‹™™]ÚY”™YŠÜ[Û–ÌJHˆÜ[ÛŠKˆ\Ü^U˜[YNˆ\Ë—ÙXÛÙQ›Ü›U˜[YJ\ÓÜ[Û\œ˜^HÈ™Y‹™™]ÚY”™YŠÜ[Û–ÌWJHˆÜ[ÛŠBˆNÂˆBˆBˆYˆ
]\Ëš\Ò[™XÙ\ÊHÂˆYˆ
\[Ùˆ\Ë™]K™šY[˜[YHOOHœÝš[™ÈŠHÂˆ\Ë™]K™šY[˜[YHHÝ\Ë™]K™šY[˜[YWNÂˆH[ÙHÂˆ\Ë™]K™šY[˜[YHH×NÂˆBˆH[ÙHÂˆ\Ë™]K™šY[˜[YHH×NÂˆÛÛœÝZHH\Ë™]K›Ü[ÛœË›[™ÝÂˆ›Üˆ
ÛÛœÝHÙˆ\Ëš[™XÙ\ÊHÂˆYˆ
[X™\‹š\Ò[YÙ\ŠJH	‰ˆHH	‰ˆHZJHÂˆ\Ë™]K™šY[˜[YKœ\Ú
\Ë™]K›Ü[ÛœÖÚWK™^Ü˜[YJNÂˆBˆBˆBˆYˆ
\Ë™]K›Ü[ÛœË›[™ÝOOH	‰ˆ\Ë™]K™šY[˜[YK›[™Ýˆ
HÂˆ\Ë™]K›Ü[ÛœÈH\Ë™]K™šY[˜[YK›X\
˜[YHOˆ
Âˆ^Ü˜[YNˆ˜[YKˆ\Ü^U˜[YNˆ˜[YBˆJJNÂˆBˆ\Ë™]K˜ÛÛX›ÈH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YËÓÓP“ÊNÂˆ\Ë™]K›][TÙ[XÝH\Ëš\ÑšY[›YÊ[››Ý][Û‘šY[›YË“USTÑSPÕ
NÂˆ\Ë—Ú\Õ^HYNÂˆBˆÙ]šY[Øš™XÝ

HÂˆÛÛœÝ\HH\Ë™]K˜ÛÛX›ÈÈ˜ÛÛX›Ø›Þˆˆ›\Ý›ÞŽÂˆÛÛœÝ˜[YHH\Ë™]K™šY[˜[YK›[™ÝˆÈ\Ë™]K™šY[˜[YVÌHˆ[Âˆ™]\›ˆÂˆYˆ\Ë™]KšYˆ˜[YKˆY˜][˜[YNˆ\Ë™]K™Y˜][šY[˜[YKˆY]X›Nˆ]\Ë™]Kœ™XYÛ›Kˆ˜[YNˆ\Ë™]K™šY[˜[YKˆ™XÝˆ\Ë™]Kœ™XÝˆ[R][\Îˆ\Ë™]K™šY[˜[YK›[™Ýˆ][\TÙ[XÝ[ÛŽˆ\Ë™]K›][TÙ[XÝˆY[Žˆ\Ë™]KšY[‹ˆXÝ[ÛœÎˆ\Ë™]K˜XÝ[ÛœËˆ][\Îˆ\Ë™]K›Ü[ÛœËˆYÙNˆ\Ë™]KœYÙR[™^ˆÝ›ÚÙPÛÛÜŽˆ\Ë™]K˜›Ü™\ÛÛÜ‹ˆš[ÛÛÜŽˆ\Ë™]K˜˜XÚÙÜ›Ý[™ÛÛÜ‹ˆ›Ý][ÛŽˆ\Ëœ›Ý][Û‹ˆ\BˆNÂˆBˆ[Y[™Ø]™YXÝ
[››Ý][Û”ÝÜ˜YÙKXÝ
HÂˆYˆ
]\Ëš\Ò[™XÙ\ÊHÂˆ™]\›ŽÂˆBˆ]˜[Y\ÈH[››Ý][Û”ÝÜ˜YÙOË™Ù]
\Ë™]KšY
OË˜[YNÂˆYˆ
P\œ˜^Kš\Ð\œ˜^J˜[Y\ÊJHÂˆ˜[Y\ÈHÝ˜[Y\×NÂˆBˆÛÛœÝ[™XÙ\ÈH×NÂˆÛÛœÝÂˆÜ[ÛœÂˆHH\Ë™]NÂˆ›Üˆ
]HHˆHZHHÜ[ÛœË›[™ÝÈHZNÈJÊÊHÂˆYˆ
Ü[ÛœÖÚWK™^Ü˜[YHOOH˜[Y\ÖÚ—JHÂˆ[™XÙ\Ëœ\Ú
JNÂˆˆ
ÏHNÂˆBˆBˆXÝœÙ]
’H‹[™XÙ\ÊNÂˆBˆ\Þ[˜ÈÙÙ]\X\˜[˜ÙJ]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJHÂˆYˆ
\Ë™]K˜ÛÛX›ÊHÂˆ™]\›ˆÝ\\‹—ÙÙ]\X\˜[˜ÙJ]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJNÂˆBˆ]^ÜY˜[YK›Ý][ÛŽÂˆÛÛœÝÝÜ˜YÙQ[žHH[››Ý][Û”ÝÜ˜YÙOË™Ù]
\Ë™]KšY
NÂˆYˆ
ÝÜ˜YÙQ[žJHÂˆ›Ý][ÛˆHÝÜ˜YÙQ[žKœ›Ý][ÛŽÂˆ^ÜY˜[YHHÝÜ˜YÙQ[žK˜[YNÂˆBˆYˆ
›Ý][ÛˆOOH[™Yš[™Y	‰ˆ^ÜY˜[YHOOH[™Yš[™Y	‰ˆ]\Ë—Û™YY\X\˜[˜Ù\ÊHÂˆ™]\›ˆ[ÂˆBˆYˆ
^ÜY˜[YHOOH[™Yš[™Y
HÂˆ^ÜY˜[YHH\Ë™]K™šY[˜[YNÂˆH[ÙHYˆ
P\œ˜^Kš\Ð\œ˜^J^ÜY˜[YJJHÂˆ^ÜY˜[YHHÙ^ÜY˜[YWNÂˆBˆÛÛœÝY˜][Y[™ÈHNÂˆÛÛœÝY˜][Y[™ÈHŽÂˆ]ÂˆÚYˆÝ[ÚYˆZYÚˆÝ[ZYÚˆHH\ÎÂˆYˆ
›Ý][ÛˆOOHL›Ý][ÛˆOOHÌ
HÂˆÝÝ[ÚYÝ[ZYÚHHÝÝ[ZYÚÝ[ÚYNÂˆBˆÛÛœÝ[™PÛÝ[H\Ë™]K›Ü[ÛœË›[™ÝÂˆÛÛœÝ˜[YR[™XÙ\ÈH×NÂˆ›Üˆ
]HHÈH[™PÛÝ[ÈJÊÊHÂˆÛÛœÝÂˆ^Ü˜[YBˆHH\Ë™]K›Ü[ÛœÖÚWNÂˆYˆ
^ÜY˜[YKš[˜ÛY\Ê^Ü˜[YJJHÂˆ˜[YR[™XÙ\Ëœ\Ú
JNÂˆBˆBˆYˆ
]\Ë—ÙY˜][\X\˜[˜ÙJHÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]HH\œÙQY˜][\X\˜[˜ÙJ\Ë—ÙY˜][\X\˜[˜ÙHH‹Ò[™]XØHˆÈŠNÂˆBˆÛÛœÝ›ÛH]ØZ]ÚYÙ][››Ý][Û‹—ÙÙ]›Û]J]˜[X]Ü‹\ÚË\Ë™]K™Y˜][\X\˜[˜ÙQ]K\Ë—ÙšY[™\ÛÝ\˜Ù\Ë›Y\™ÙY™\ÛÝ\˜Ù\ÊNÂˆ]Y˜][\X\˜[˜ÙNÂˆ]Âˆ›ÛÚ^™BˆHH\Ë™]K™Y˜][\X\˜[˜ÙQ]NÂˆYˆ
Y›ÛÚ^™JHÂˆÛÛœÝ[™RZYÚH
Ý[ZYÚHY˜][Y[™ÊHÈ[™PÛÝ[Âˆ][™UÚYHLNÂˆ]˜[YNÂˆ›Üˆ
ÛÛœÝÂˆ\Ü^U˜[YBˆHÙˆ\Ë™]K›Ü[ÛœÊHÂˆÛÛœÝÚYH\Ë—ÙÙ]^ÚY
\Ü^U˜[YK›Û
NÂˆYˆ
ÚYˆ[™UÚY
HÂˆ[™UÚYHÚYÂˆ˜[YHH\Ü^U˜[YNÂˆBˆBˆÙY˜][\X\˜[˜ÙK›ÛÚ^™WHH\Ë—ØÛÛ\]Q›ÛÚ^™J[™RZYÚÝ[ÚYHˆ
ˆY˜][Y[™Ë˜[YK›ÛLJNÂˆH[ÙHÂˆY˜][\X\˜[˜ÙHH\Ë—ÙY˜][\X\˜[˜ÙNÂˆBˆÛÛœÝ[™RZYÚH›ÛÚ^™H
ˆ
Êˆ[›[™Y^Ü“S‘WÑPÕÔˆ
‹ÌKŒÍJNÂˆÛÛœÝ”Y[™ÈH
[™RZYÚH›ÛÚ^™JHÈŽÂˆÛÛœÝ[X™\“Ù•š\ÚX›S[™\ÈHX]™›ÛÜŠÝ[ZYÚÈ[™RZYÚ
NÂˆ]š\œÝ[™^HÂˆYˆ
˜[YR[™XÙ\Ë›[™Ýˆ
HÂˆÛÛœÝZ[’[™^HX]›Z[Š‹‹˜[YR[™XÙ\ÊNÂˆÛÛœÝX^[™^HX]›X^
‹‹˜[YR[™XÙ\ÊNÂˆš\œÝ[™^HX]Û[\
X^[™^H[X™\“Ù•š\ÚX›S[™\È
ÈKZ[’[™^
NÂˆBˆÛÛœÝ[™HX]›Z[Šš\œÝ[™^
È[X™\“Ù•š\ÚX›S[™\È
ÈK[™PÛÝ[
NÂˆÛÛœÝYˆHÈ‹Õ“PÈH‹HH	ÝÝ[ÚYH	ÝÝ[ZYÚH™HÈ˜NÂˆYˆ
˜[YR[™XÙ\Ë›[™Ý
HÂˆY‹œ\Ú
ŒŒˆÍMŽˆŽML™ÈŠNÂˆ›Üˆ
ÛÛœÝ[™^Ùˆ˜[YR[™XÙ\ÊHÂˆYˆ
š\œÝ[™^H[™^	‰ˆ[™^[™
HÂˆY‹œ\Ú
H	ÝÝ[ZYÚH
[™^Hš\œÝ[™^
ÈJH
ˆ[™RZYÚH	ÝÝ[ÚYH	Û[™RZYÚH™H˜
NÂˆBˆBˆBˆY‹œ\Ú
•‹Y˜][\X\˜[˜ÙKHH	ÝÝ[ZYÚHX
NÂˆÛÛœÝ™]’[™›ÈHÂˆÚYˆˆNÂˆ›Üˆ
]HHš\œÝ[™^ÈH[™ÈJÊÊHÂˆÛÛœÝÂˆ\Ü^U˜[YBˆHH\Ë™]K›Ü[ÛœÖÚWNÂˆÛÛœÝœY[™ÈHHOOHš\œÝ[™^È”Y[™ÈˆÂˆY‹œ\Ú
\Ë—Ü™[™\•^
\Ü^U˜[YK›Û›ÛÚ^™KÝ[ÚY™]’[™›ËY˜][Y[™Ë[[™RZYÚ
ÈœY[™ÊJNÂˆBˆY‹œ\Ú
‘UHSPÈŠNÂˆ™]\›ˆY‹š›Ú[Š—ˆŠNÂˆBŸB˜Û\ÜÈÚYÛ˜]\™UÚYÙ][››Ý][Ûˆ^[™ÈÚYÙ][››Ý][ÛˆÂˆÚ\Õ˜[YQœ›ÛVHH˜[ÙNÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆ\Ë™]K™šY[˜[YHH[Âˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]K››ÒSH]\Ë™]Kš\ÓÝÛØ[˜\ÎÂˆBˆÙ]šY[Øš™XÝ

HÂˆ™]\›ˆÂˆYˆ\Ë™]KšYˆ˜[YNˆ[ˆYÙNˆ\Ë™]KœYÙR[™^ˆ\NˆœÚYÛ˜]\™H‚ˆNÂˆBŸB˜Û\ÜÈ^[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÛÛœÝQUSÒPÓÓ—ÔÒV‘HHŒŽÂˆÝ\\Š\˜[\ÊNÂˆ\Ë™]K››Ô›Ý]HHYNÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]K››ÒSH˜[ÙNÂˆÛÛœÝÂˆXÝˆHH\˜[\ÎÂˆYˆ
\Ë™]Kš\Ð\X\˜[˜ÙJHÂˆ\Ë™]K›˜[YHH“›ÒXÛÛˆŽÂˆH[ÙHÂˆ\Ë™]Kœ™XÝÌWHH\Ë™]Kœ™XÝÌ×HHQUSÒPÓÓ—ÔÒV‘NÂˆ\Ë™]Kœ™XÝÌ—HH\Ë™]Kœ™XÝÌH
ÈQUSÒPÓÓ—ÔÒV‘NÂˆ\Ë™]K›˜[YHHXÝš\Ê“˜[YHŠHÈXÝ™Ù]
“˜[YHŠK›˜[YHˆ“›ÝHŽÂˆBˆYˆ
XÝš\Ê”Ý]HŠJHÂˆ\Ë™]KœÝ]HHXÝ™Ù]
”Ý]HŠH[Âˆ\Ë™]KœÝ]S[Ù[HXÝ™Ù]
”Ý]S[Ù[ŠH[ÂˆH[ÙHÂˆ\Ë™]KœÝ]HH[Âˆ\Ë™]KœÝ]S[Ù[H[ÂˆBˆBŸB˜Û\ÜÈ[šÐ[››Ý][Ûˆ^[™È[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ[››Ý][Û‘ÛØ˜[ÂˆHH\˜[\ÎÂˆ\Ë™]K››ÒSH˜[ÙNÂˆÛÛœÝ]XYÚ[ÈHÙ]]XYÚ[ÊXÝ\Ëœ™XÝ[™ÛJNÂˆYˆ
]XYÚ[ÊHÂˆ\Ë™]Kœ]XYÚ[ÈH]XYÚ[ÎÂˆBˆ\Ë™]K˜›Ü™\ÛÛÜˆH\Ë™]K˜ÛÛÜŽÂˆØ][ÙËœ\œÙQ\ÝXÝ[Û˜\žJÂˆ\ÝXÝˆXÝˆ™\Ý[ØšŽˆ\Ë™]KˆØÐ˜\ÙU\›ˆ[››Ý][Û‘ÛØ˜[Ë˜˜\ÙU\›ˆØÐ]XÚY[Îˆ[››Ý][Û‘ÛØ˜[Ë˜]XÚY[ÂˆJNÂˆBˆÙ]Ý™\›^\Õ^ÛÛ[

HÂˆ™]\›ˆYNÂˆBŸB˜Û\ÜÈÜ\[››Ý][Ûˆ^[™È[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆHH\˜[\ÎÂˆ\Ë™]K››ÒSH˜[ÙNÂˆYˆ
\ËÚYOOH\ËšZYÚOOH
HÂˆ\Ë™]Kœ™XÝH[ÂˆBˆ]\™[][HHXÝ™Ù]
”\™[ŠNÂˆYˆ
\\™[][JHÂˆØ\›Š”Ü\[››Ý][Ûˆ\ÈHZ\ÜÚ[™ÈÜˆ[˜[Y\™[[››Ý][Û‹ˆŠNÂˆ™]\›ŽÂˆBˆ\Ë™]Kœ\™[™XÝHÛÚÝ\›Ü›X[™XÝ
\™[][K™Ù]\œ˜^J”™XÝŠK[
NÂˆ\Ë™]K˜Ü™X][Û‘]HH\™[][K™Ù]
Ü™X][Û‘]HŠHˆŽÂˆÛÛœÝH\™[][K™Ù]
”•ŠNÂˆYˆ
\Ó˜[YJ[››Ý][Û”™\U\K‘Ô“ÕT
JHÂˆ\™[][HH\™[][K™Ù]
’T•ŠNÂˆBˆYˆ
\\™[][Kš\Ê“HŠJHÂˆ\Ë™]K›[ÙYšXØ][Û‘]HH[ÂˆH[ÙHÂˆ\ËœÙ][ÙYšXØ][Û‘]J\™[][K™Ù]
“HŠJNÂˆ\Ë™]K›[ÙYšXØ][Û‘]HH\Ë›[ÙYšXØ][Û‘]NÂˆBˆYˆ
\\™[][Kš\ÊÈŠJHÂˆ\Ë™]K˜ÛÛÜˆH[ÂˆH[ÙHÂˆ\ËœÙ]ÛÛÜŠ\™[][K™Ù]\œ˜^JÈŠJNÂˆ\Ë™]K˜ÛÛÜˆH\Ë˜ÛÛÜŽÂˆBˆYˆ
]\ËšY]ØX›JHÂˆÛÛœÝ\™[›YÜÈH\™[][K™Ù]
‘ˆŠNÂˆYˆ
\Ë—Ú\ÕšY]ØX›J\™[›YÜÊJHÂˆ\ËœÙ]›YÜÊ\™[›YÜÊNÂˆBˆBˆ\ËœÙ]]J\™[][K™Ù]
•ŠJNÂˆ\Ë™]K]SØšˆH\Ë—Ý]NÂˆ\ËœÙ]ÛÛ[Ê\™[][K™Ù]
ÛÛ[ÈŠJNÂˆ\Ë™]K˜ÛÛ[ÓØšˆH\Ë—ØÛÛ[ÎÂˆYˆ
\™[][Kš\Ê”ÈŠJHÂˆ\Ë™]KœšXÚ^HQ˜XÝÜžK™Ù]šXÚ^\Ò[
\™[][K™Ù]
”ÈŠJNÂˆBˆ\Ë™]K›Ü[ˆHHYXÝ™Ù]
“Ü[ˆŠNÂˆBˆÝ]XÈÜ™X]S™]ÑXÝ
[››Ý][Û‹™Y‹Ü\˜[\ÊHÂˆÛÛœÝÂˆÛ[››Ý][Û‹ˆ™XÝˆ\™[ˆHH[››Ý][ÛŽÂˆÛÛœÝÜ\HÛ[››Ý][Ûˆ™]ÈXÝ
™YŠNÂˆÜ\œÙ]Y“›Ý^\ÝÊ•\H‹˜[YK™Ù]
[››ÝŠJNÂˆÜ\œÙ]Y“›Ý^\ÝÊ”ÝX\H‹˜[YK™Ù]
”Ü\ŠJNÂˆÜ\œÙ]Y“›Ý^\ÝÊ“Ü[ˆ‹˜[ÙJNÂˆÜ\œÙ]Y\œ˜^J”™XÝ‹™XÝ
NÂˆÜ\œÙ]
”\™[‹\™[
NÂˆ™]\›ˆÜ\ÂˆBˆÝ]XÈ\Þ[˜ÈÜ™X]S™]Ð\X\˜[˜ÙTÝ™X[J[››Ý][Û‹™Y‹\˜[\ÊHÂˆ™]\›ˆ[ÂˆBŸB˜Û\ÜÈœ™YU^[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]Kš\ÑY]X›HH]\Ë™]K››ÒSÂˆ\Ë™]K››ÒSH˜[ÙNÂˆÛÛœÝÂˆ[››Ý][Û‘ÛØ˜[Ëˆ™Y‚ˆHH\˜[\ÎÂˆ\ËœÙ]Y˜][\X\˜[˜ÙJ\˜[\ÊNÂˆ\Ë—Ú\Ð\X\˜[˜ÙHHH]\Ë˜\X\˜[˜ÙNÂˆYˆ
\Ë—Ú\Ð\X\˜[˜ÙJHÂˆÛÛœÝÂˆ›ÛÛÛÜ‹ˆ›ÛÚ^™BˆHH\œÙP\X\˜[˜ÙTÝ™X[J\Ë˜\X\˜[˜ÙK™Y‹[››Ý][Û‘ÛØ˜[Ë™ÛØ˜[ÛÛÜ”ÜXÙPØXÚJNÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]K™›ÛÛÛÜˆH›ÛÛÛÜŽÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]K™›ÛÚ^™HH›ÛÚ^™HLÂˆH[ÙHÂˆ\Ë™]K™Y˜][\X\˜[˜ÙQ]K™›ÛÚ^™HHLÂˆÛÛœÝÂˆ›ÛÛÛÜ‹ˆ›ÛÚ^™BˆHH\Ë™]K™Y˜][\X\˜[˜ÙQ]NÂˆYˆ
\Ë—ØÛÛ[ËœÝŠHÂˆ\Ë™]K^ÛÛ[H\Ë—ØÛÛ[ËœÝ‹œÜ]
×—ß‹ÊK›X\
[™HOˆ[™Kš[Q[™

JNÂˆÛÛœÝÂˆÛÛÜ™Ëˆ˜›ÞˆX]š^ˆHH˜ZÙU[šXÛÙQ›Û™Ù]š\œÝÜÚ][Û’[™›Ê\Ëœ™XÝ[™ÛK\Ëœ›Ý][Û‹›ÛÚ^™JNÂˆ\Ë™]K^ÜÚ][ÛˆH\Ë—Ý˜[œÙ›Ü›TÚ[
ÛÛÜ™Ë˜›ÞX]š^
NÂˆBˆYˆ
\Ë—Ú\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜY
HÂˆÛÛœÝÝ›ÚÙP[HH\˜[\Ë™XÝ™Ù]
ÐHŠNÂˆÛÛœÝ˜ZÙU[šXÛÙQ›ÛH™]È˜ZÙU[šXÛÙQ›Û
™Y‹œØ[œË\Ù\šYˆŠNÂˆ\Ë˜\X\˜[˜ÙHH˜ZÙU[šXÛÙQ›Û˜Ü™X]P\X\˜[˜ÙJ\Ë—ØÛÛ[ËœÝ‹\Ëœ™XÝ[™ÛK\Ëœ›Ý][Û‹›ÛÚ^™K›ÛÛÛÜ‹Ý›ÚÙP[JNÂˆ\Ë—ÜÝ™X[\Ëœ\Ú
\Ë˜\X\˜[˜ÙJNÂˆH[ÙHÂˆØ\›Š‘œ™YU^[››Ý][ÛŽˆÙ™œØÜ™Y[Ø[˜\È\È›ÝÝ\ÜY[››Ý][ÛˆX^H›Ý™[™\ˆÛÜœ™XÝKˆŠNÂˆBˆBˆBˆÙ]\Õ^ÛÛ[

HÂˆ™]\›ˆ\Ë—Ú\Ð\X\˜[˜ÙNÂˆBˆÝ]XÈÜ™X]S™]ÑXÝ
[››Ý][Û‹™Y‹Âˆ\™Y‹ˆ\ˆJHÂˆÛÛœÝÂˆÛÛÜ‹ˆ]Kˆ›ÛÚ^™KˆÛ[››Ý][Û‹ˆ™XÝˆ›Ý][Û‹ˆ\Ù\‹ˆ˜[YBˆHH[››Ý][ÛŽÂˆÛÛœÝœ™Y]^HÛ[››Ý][Ûˆ™]ÈXÝ
™YŠNÂˆœ™Y]^œÙ]Y“›Ý^\ÝÊ•\H‹˜[YK™Ù]
[››ÝŠJNÂˆœ™Y]^œÙ]Y“›Ý^\ÝÊ”ÝX\H‹˜[YK™Ù]
‘œ™YU^ŠJNÂˆœ™Y]^œÙ]
Û[››Ý][ÛˆÈ“HˆˆÜ™X][Û‘]H‹‰ÙÙ][ÙYšXØ][Û‘]J]J_X
NÂˆYˆ
Û[››Ý][ÛŠHÂˆœ™Y]^™[]J”ÈŠNÂˆBˆœ™Y]^œÙ]Y\œ˜^J”™XÝ‹™XÝ
NÂˆÛÛœÝHHÒ[ˆ	Ù›ÛÚ^™_Hˆ	ÙÙ]ÛÛÜŠÛÛÜ‹YJ_XÂˆœ™Y]^œÙ]
‘H‹JNÂˆœ™Y]^œÙ]Y‘Yš[™Y
ÛÛ[È‹Ýš[™ÕÐ\ØÚZSÜ•UŒM‘J˜[YJJNÂˆœ™Y]^œÙ]Y“›Ý^\ÝÊ‘ˆ‹
NÂˆœ™Y]^œÙ]Y“›Ý^\ÝÊ›Ü™\ˆ‹ÌJNÂˆœ™Y]^œÙ]Y“[X™\Š”›Ý]H‹›Ý][ÛŠNÂˆœ™Y]^œÙ]Y‘Yš[™Y
•‹Ýš[™ÕÐ\ØÚZSÜ•UŒM‘J\Ù\ŠJNÂˆYˆ
\™Yˆ\
HÂˆÛÛœÝˆH™]ÈXÝ
™YŠNÂˆœ™Y]^œÙ]
T‹ŠNÂˆ‹œÙ]
“ˆ‹\™Yˆ\
NÂˆBˆ™]\›ˆœ™Y]^ÂˆBˆÝ]XÈ\Þ[˜ÈÜ™X]S™]Ð\X\˜[˜ÙTÝ™X[J[››Ý][Û‹™Y‹\˜[\ÊHÂˆÛÛœÝÂˆ˜\ÙQ›Û™Y‹ˆ]˜[X]Ü‹ˆ\ÚÂˆHH\˜[\ÎÂˆÛÛœÝÂˆÛÛÜ‹ˆ›ÛÚ^™Kˆ™XÝˆ›Ý][Û‹ˆ˜[YBˆHH[››Ý][ÛŽÂˆYˆ
XÛÛÜŠHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ™\ÛÝ\˜Ù\ÈH™]ÈXÝ
™YŠNÂˆÛÛœÝ›ÛH™]ÈXÝ
™YŠNÂˆYˆ
˜\ÙQ›Û™YŠHÂˆ›ÛœÙ]
’[ˆ‹˜\ÙQ›Û™YŠNÂˆH[ÙHÂˆÛÛœÝ˜\ÙQ›ÛH™]ÈXÝ
™YŠNÂˆ˜\ÙQ›ÛœÙ]Y“˜[YJ˜\ÙQ›Û‹’[™]XØHŠNÂˆ˜\ÙQ›ÛœÙ]Y“˜[YJ•\H‹‘›ÛŠNÂˆ˜\ÙQ›ÛœÙ]Y“˜[YJ”ÝX\H‹•\LHŠNÂˆ˜\ÙQ›ÛœÙ]Y“˜[YJ‘[˜ÛÙ[™È‹•Ú[[œÚQ[˜ÛÙ[™ÈŠNÂˆ›ÛœÙ]
’[ˆ‹˜\ÙQ›Û
NÂˆBˆ™\ÛÝ\˜Ù\ËœÙ]
‘›Û‹›Û
NÂˆÛÛœÝ[ˆH]ØZ]ÚYÙ][››Ý][Û‹—ÙÙ]›Û]J]˜[X]Ü‹\ÚËÂˆ›Û˜[YNˆ’[ˆ‹ˆ›ÛÚ^™BˆK™\ÛÝ\˜Ù\ÊNÂˆÛÛœÝÞKLK‹L—HH™XÝÂˆ]ÈHˆHNÂˆ]HLˆHLNÂˆYˆ
›Ý][Ûˆ	HNOOH
HÂˆÝËHHÚ×NÂˆBˆÛÛœÝ[™\ÈH˜[YKœÜ]
—ˆŠNÂˆÛÛœÝØØ[HH›ÛÚ^™HÈLÂˆ]Ý[ÚYHR[™š[š]NÂˆÛÛœÝ[˜ÛÙY[™\ÈH×NÂˆ›Üˆ
][™HÙˆ[™\ÊHÂˆÛÛœÝ[˜ÛÙYH[‹™[˜ÛÙTÝš[™Ê[™JNÂˆYˆ
[˜ÛÙY›[™ÝˆJHÂˆ™]\›ˆ[ÂˆBˆ[™HH[˜ÛÙYš›Ú[ŠˆŠNÂˆ[˜ÛÙY[™\Ëœ\Ú
[™JNÂˆ][™UÚYHÂˆÛÛœÝÛ\ÈH[‹˜Ú\œÕÑÛ\Ê[™JNÂˆ›Üˆ
ÛÛœÝÛ\ÙˆÛ\ÊHÂˆ[™UÚY
ÏHÛ\ÚY
ˆØØ[NÂˆBˆÝ[ÚYHX]›X^
Ý[ÚY[™UÚY
NÂˆBˆÛÛœÝØØ[HHÝ[ÚYˆÈÈÈÈÝ[ÚYˆNÂˆ]œØØ[HHNÂˆÛÛœÝ[™RZYÚH
Êˆ[›[™Y^Ü“S‘WÑPÕÔˆ
‹ÌKŒÍJH
ˆ›ÛÚ^™NÂˆÛÛœÝ[™P\ØÙ[H

Êˆ[›[™Y^Ü“S‘WÑPÕÔˆ
‹ÌKŒÍJHH
Êˆ[›[™Y^Ü“S‘WÑTÐÑS•ÑPÕÔˆ
‹ÌŒÍJJH
ˆ›ÛÚ^™NÂˆÛÛœÝÝ[ZYÚH[™RZYÚ
ˆ[™\Ë›[™ÝÂˆYˆ
Ý[ZYÚˆ
HÂˆœØØ[HHÈÝ[ZYÚÂˆBˆÛÛœÝœØØ[HHX]›Z[ŠØØ[KœØØ[JNÂˆÛÛœÝ™]Ñ›ÛÚ^™HH›ÛÚ^™H
ˆœØØ[NÂˆ]š\œÝÚ[Û\›ÞX]š^ÂˆÝÚ]Ú
›Ý][ÛŠHÂˆØ\ÙH‚ˆX]š^HÌKWNÂˆÛ\›ÞHÜ™XÝÌK™XÝÌWKËNÂˆš\œÝÚ[HÜ™XÝÌK™XÝÌ×HH[™P\ØÙ[NÂˆœ™XZÎÂˆØ\ÙHL‚ˆX]š^HÌKLKNÂˆÛ\›ÞHÜ™XÝÌWK\™XÝÌ—KËNÂˆš\œÝÚ[HÜ™XÝÌWK\™XÝÌHH[™P\ØÙ[NÂˆœ™XZÎÂˆØ\ÙHN‚ˆX]š^HËLKLWNÂˆÛ\›ÞHË\™XÝÌ—K\™XÝÌ×KËNÂˆš\œÝÚ[HË\™XÝÌ—K\™XÝÌWHH[™P\ØÙ[NÂˆœ™XZÎÂˆØ\ÙHÌ‚ˆX]š^HÌLKKNÂˆÛ\›ÞHË\™XÝÌ×K™XÝÌKËNÂˆš\œÝÚ[HË\™XÝÌ×K™XÝÌ—HH[™P\ØÙ[NÂˆœ™XZÎÂˆBˆÛÛœÝY™™\ˆHÈœH‹	ÛX]š^š›Ú[ŠˆŠ_HÛX	ØÛ\›Þš›Ú[ŠˆŠ_H™HÈ˜•	ÙÙ]ÛÛÜŠÛÛÜ‹YJ_XÈÒ[ˆ	Û[X™\•ÔÝš[™Ê™]Ñ›ÛÚ^™J_H˜NÂˆY™™\‹œ\Ú
	Ùš\œÝÚ[š›Ú[ŠˆŠ_H
	Ù\ØØ\TÝš[™Ê[˜ÛÙY[™\ÖÌJ_JH˜
NÂˆÛÛœÝ”ÚYH[X™\•ÔÝš[™Ê[™RZYÚ
NÂˆ›Üˆ
]HHKZHH[˜ÛÙY[™\Ë›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝ[™HH[˜ÛÙY[™\ÖÚWNÂˆY™™\‹œ\Ú
IÝ”ÚYH
	Ù\ØØ\TÝš[™Ê[™J_JH˜
NÂˆBˆY™™\‹œ\Ú
‘U‹”HŠNÂˆÛÛœÝ\X\˜[˜ÙHHY™™\‹š›Ú[Š—ˆŠNÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[QXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
‘›Ü›U\H‹JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ•\H‹–Øš™XÝŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
›Þ‹™XÝ
NÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÊNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
“X]š^‹ÌKK\™XÝÌK\™XÝÌWWJNÂˆ™]\›ˆ™]ÈÝš[™ÔÝ™X[J\X\˜[˜ÙK\X\˜[˜ÙTÝ™X[QXÝ
NÂˆBŸB˜Û\ÜÈ[™P[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]K››ÒSH˜[ÙNÂˆÛÛœÝ[™PÛÛÜ™[˜]\ÈHÛÚÝ\™XÝ
XÝ™Ù]\œ˜^J“ŠKÌJNÂˆ\Ë™]K›[™PÛÛÜ™[˜]\ÈH][››Ü›X[^™T™XÝ
[™PÛÛÜ™[˜]\ÊNÂˆ\ËœÙ][™Q[™[™ÜÊXÝ™Ù]\œ˜^J“HŠJNÂˆ\Ë™]K›[™Q[™[™ÜÈH\Ë›[™Q[™[™ÜÎÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝÝ›ÚÙPÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌJNÂˆÛÛœÝÝ›ÚÙP[HHXÝ™Ù]
ÐHŠNÂˆÛÛœÝ[\š[ÜÛÛÜˆHÙ]™ØÛÛÜŠXÝ™Ù]\œ˜^J’PÈŠK[
NÂˆÛÛœÝš[ÛÛÜˆHÙ]ÛÛÜ\œ˜^J[\š[ÜÛÛÜŠNÂˆÛÛœÝš[[HHš[ÛÛÜˆÈÝ›ÚÙP[Hˆ[ÂˆÛÛœÝ›Ü™\•ÚYH\Ë˜›Ü™\”Ý[KÚYKˆ›Ü™\Y\ÝHˆ
ˆ›Ü™\•ÚYÂˆÛÛœÝ˜›ÞHÝ\Ë™]K›[™PÛÛÜ™[˜]\ÖÌHH›Ü™\Y\Ý\Ë™]K›[™PÛÛÜ™[˜]\ÖÌWHH›Ü™\Y\Ý\Ë™]K›[™PÛÛÜ™[˜]\ÖÌ—H
È›Ü™\Y\Ý\Ë™]K›[™PÛÛÜ™[˜]\ÖÌ×H
È›Ü™\Y\ÝNÂˆYˆ
U][š[\œÙXÝ
\Ëœ™XÝ[™ÛK˜›Þ
JHÂˆ\Ëœ™XÝ[™ÛHH˜›ÞÂˆBˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜Nˆ	Ø›Ü™\•ÚYHØˆÝ›ÚÙPÛÛÜ‹ˆš[ÛÛÜ‹ˆÝ›ÚÙP[Kˆš[[KˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆY™™\‹œ\Ú
	Û[™PÛÛÜ™[˜]\ÖÌ_H	Û[™PÛÛÜ™[˜]\ÖÌW_HX	Û[™PÛÛÜ™[˜]\ÖÌ—_H	Û[™PÛÛÜ™[˜]\ÖÌ×_H”ÈŠNÂˆ™]\›ˆÜÚ[ÖÌHH›Ü™\•ÚYÚ[ÖÍ×HH›Ü™\•ÚYÚ[ÖÌ—H
È›Ü™\•ÚYÚ[ÖÌ×H
È›Ü™\•ÚYNÂˆBˆJNÂˆBˆBŸB˜Û\ÜÈÜ]X\™P[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]K››ÒSH˜[ÙNÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝÝ›ÚÙPÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌJNÂˆÛÛœÝÝ›ÚÙP[HHXÝ™Ù]
ÐHŠNÂˆÛÛœÝ[\š[ÜÛÛÜˆHÙ]™ØÛÛÜŠXÝ™Ù]\œ˜^J’PÈŠK[
NÂˆÛÛœÝš[ÛÛÜˆHÙ]ÛÛÜ\œ˜^J[\š[ÜÛÛÜŠNÂˆÛÛœÝš[[HHš[ÛÛÜˆÈÝ›ÚÙP[Hˆ[ÂˆYˆ
\Ë˜›Ü™\”Ý[KÚYOOH	‰ˆYš[ÛÛÜŠHÂˆ™]\›ŽÂˆBˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜Nˆ	Ý\Ë˜›Ü™\”Ý[KÚYHØˆÝ›ÚÙPÛÛÜ‹ˆš[ÛÛÜ‹ˆÝ›ÚÙP[Kˆš[[KˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆÛÛœÝHÚ[ÖÍH
È\Ë˜›Ü™\”Ý[KÚYÈŽÂˆÛÛœÝHHÚ[ÖÍWH
È\Ë˜›Ü™\”Ý[KÚYÈŽÂˆÛÛœÝÚYHÚ[ÖÍ—HHÚ[ÖÍHH\Ë˜›Ü™\”Ý[KÚYÂˆÛÛœÝZYÚHÚ[ÖÌ×HHÚ[ÖÍ×HH\Ë˜›Ü™\”Ý[KÚYÂˆY™™\‹œ\Ú
	ÞH	Þ_H	ÝÚYH	ÚZYÚH™X
NÂˆYˆ
š[ÛÛÜŠHÂˆY™™\‹œ\Ú
ˆŠNÂˆH[ÙHÂˆY™™\‹œ\Ú
”ÈŠNÂˆBˆ™]\›ˆÜÚ[ÖÌKÚ[ÖÍ×KÚ[ÖÌ—KÚ[ÖÌ×WNÂˆBˆJNÂˆBˆBŸB˜Û\ÜÈÚ\˜ÛP[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝÝ›ÚÙPÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌJNÂˆÛÛœÝÝ›ÚÙP[HHXÝ™Ù]
ÐHŠNÂˆÛÛœÝ[\š[ÜÛÛÜˆHÙ]™ØÛÛÜŠXÝ™Ù]\œ˜^J’PÈŠK[
NÂˆÛÛœÝš[ÛÛÜˆHÙ]ÛÛÜ\œ˜^J[\š[ÜÛÛÜŠNÂˆÛÛœÝš[[HHš[ÛÛÜˆÈÝ›ÚÙP[Hˆ[ÂˆYˆ
\Ë˜›Ü™\”Ý[KÚYOOH	‰ˆYš[ÛÛÜŠHÂˆ™]\›ŽÂˆBˆÛÛœÝÛÛ›ÛÚ[Ñ\Ý[˜ÙHHÈÈ
ˆX][ŠX]”HÈ
ˆ
ˆ
JNÂˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜Nˆ	Ý\Ë˜›Ü™\”Ý[KÚYHØˆÝ›ÚÙPÛÛÜ‹ˆš[ÛÛÜ‹ˆÝ›ÚÙP[Kˆš[[KˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆÛÛœÝHÚ[ÖÌH
È\Ë˜›Ü™\”Ý[KÚYÈŽÂˆÛÛœÝLHÚ[ÖÌWHH\Ë˜›Ü™\”Ý[KÚYÈŽÂˆÛÛœÝHHÚ[ÖÍ—HH\Ë˜›Ü™\”Ý[KÚYÈŽÂˆÛÛœÝLHHÚ[ÖÍ×H
È\Ë˜›Ü™\”Ý[KÚYÈŽÂˆÛÛœÝZYH
È
HH
HÈŽÂˆÛÛœÝSZYHL
È
LHHL
HÈŽÂˆÛÛœÝÙ™œÙ]H
HH
HÈˆ
ˆÛÛ›ÛÚ[Ñ\Ý[˜ÙNÂˆÛÛœÝSÙ™œÙ]H
LHHL
HÈˆ
ˆÛÛ›ÛÚ[Ñ\Ý[˜ÙNÂˆY™™\‹œ\Ú
	ÞZYH	ÞL_HX	ÞZY
ÈÙ™œÙ]H	ÞL_H	Þ_H	ÞSZY
ÈSÙ™œÙ]H	Þ_H	ÞSZYHØ	Þ_H	ÞSZYHSÙ™œÙ]H	ÞZY
ÈÙ™œÙ]H	ÞLH	ÞZYH	ÞLHØ	ÞZYHÙ™œÙ]H	ÞLH	ÞH	ÞSZYHSÙ™œÙ]H	ÞH	ÞSZYHØ	ÞH	ÞSZY
ÈSÙ™œÙ]H	ÞZYHÙ™œÙ]H	ÞL_H	ÞZYH	ÞL_HØšŠNÂˆYˆ
š[ÛÛÜŠHÂˆY™™\‹œ\Ú
ˆŠNÂˆH[ÙHÂˆY™™\‹œ\Ú
”ÈŠNÂˆBˆ™]\›ˆÜÚ[ÖÌKÚ[ÖÍ×KÚ[ÖÌ—KÚ[ÖÌ×WNÂˆBˆJNÂˆBˆBŸB˜Û\ÜÈÛ[[™P[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]K››ÒSH˜[ÙNÂˆ\Ë™]K™\XÙ\ÈH[ÂˆYˆ
J\È[œÝ[˜Ù[ÙˆÛYÛÛ[››Ý][ÛŠJHÂˆ\ËœÙ][™Q[™[™ÜÊXÝ™Ù]\œ˜^J“HŠJNÂˆ\Ë™]K›[™Q[™[™ÜÈH\Ë›[™Q[™[™ÜÎÂˆBˆÛÛœÝ˜]Õ™\XÙ\ÈHXÝ™Ù]\œ˜^J•™\XÙ\ÈŠNÂˆYˆ
Z\Ó[X™\\œ˜^J˜]Õ™\XÙ\Ë[
JHÂˆ™]\›ŽÂˆBˆÛÛœÝ™\XÙ\ÈH\Ë™]K™\XÙ\ÈH›Ø]Ì\œ˜^K™œ›ÛJ˜]Õ™\XÙ\ÊNÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝÝ›ÚÙPÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌJNÂˆÛÛœÝÝ›ÚÙP[HHXÝ™Ù]
ÐHŠNÂˆ]š[ÛÛÜˆHÙ]™ØÛÛÜŠXÝ™Ù]\œ˜^J’PÈŠK[
NÂˆš[ÛÛÜˆ	‰HÙ]ÛÛÜ\œ˜^Jš[ÛÛÜŠNÂˆ]Ü\˜]ÜŽÂˆYˆ
š[ÛÛÜŠHÂˆYˆ
\Ë˜ÛÛÜŠHÂˆÜ\˜]ÜˆHš[ÛÛÜ‹™]™\žJ
ËJHOˆÈOOHÝ›ÚÙPÛÛÜ–ÚWJHÈ™ˆˆˆˆŽÂˆH[ÙHÂˆÜ\˜]ÜˆH™ˆŽÂˆBˆH[ÙHÂˆÜ\˜]ÜˆH”ÈŽÂˆBˆÛÛœÝ›Ü™\•ÚYH\Ë˜›Ü™\”Ý[KÚYKˆ›Ü™\Y\ÝHˆ
ˆ›Ü™\•ÚYÂˆÛÛœÝ˜›ÞH“ÖÒS’UœÛXÙJ
NÂˆ›Üˆ
]HHZHH™\XÙ\Ë›[™ÝÈHZNÈH
ÏHŠHÂˆ][œ™XÝ›Ý[™[™Ð›Þ
™\XÙ\ÖÚWHH›Ü™\Y\Ý™\XÙ\ÖÚH
ÈWHH›Ü™\Y\Ý™\XÙ\ÖÚWH
È›Ü™\Y\Ý™\XÙ\ÖÚH
ÈWH
È›Ü™\Y\Ý˜›Þ
NÂˆBˆYˆ
U][š[\œÙXÝ
\Ëœ™XÝ[™ÛK˜›Þ
JHÂˆ\Ëœ™XÝ[™ÛHH˜›ÞÂˆBˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜Nˆ	Ø›Ü™\•ÚYHØˆÝ›ÚÙPÛÛÜ‹ˆÝ›ÚÙP[Kˆš[ÛÛÜ‹ˆš[[Nˆš[ÛÛÜˆÈÝ›ÚÙP[Hˆ[ˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆ›Üˆ
]HHZHH™\XÙ\Ë›[™ÝÈHZNÈH
ÏHŠHÂˆY™™\‹œ\Ú
	Ý™\XÙ\ÖÚW_H	Ý™\XÙ\ÖÚH
ÈW_H	ÚHOOHÈ›Hˆˆ›ŸX
NÂˆBˆY™™\‹œ\Ú
Ü\˜]ÜŠNÂˆ™]\›ˆÜÚ[ÖÌKÚ[ÖÍ×KÚ[ÖÌ—KÚ[ÖÌ×WNÂˆBˆJNÂˆBˆBŸB˜Û\ÜÈÛYÛÛ[››Ý][Ûˆ^[™ÈÛ[[™P[››Ý][ÛˆßB˜Û\ÜÈØ\™][››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆßB˜Û\ÜÈ[šÐ[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]K››ÒSH˜[ÙNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆ\Ë™]Kš[šÓ\ÝÈH×NÂˆ\Ë™]Kš\ÑY]X›HH]\Ë™]K››ÒSÂˆ\Ë™]K››ÒSH˜[ÙNÂˆ\Ë™]K›ÜXÚ]HHXÝ™Ù]
ÐHŠHNÂˆÛÛœÝ˜]Ò[šÓ\ÝÈHXÝ™Ù]\œ˜^J’[šÓ\ÝŠNÂˆYˆ
P\œ˜^Kš\Ð\œ˜^J˜]Ò[šÓ\ÝÊJHÂˆ™]\›ŽÂˆBˆ›Üˆ
ÛÛœÝ˜]Ò[šÓ\ÝÙˆ˜]Ò[šÓ\ÝÊHÂˆYˆ
P\œ˜^Kš\Ð\œ˜^J˜]Ò[šÓ\Ý
JHÂˆÛÛ[YNÂˆBˆÛÛœÝ[šÓ\ÝH™]È›Ø]Ì\œ˜^J˜]Ò[šÓ\Ý›[™Ý
NÂˆ\Ë™]Kš[šÓ\ÝËœ\Ú
[šÓ\Ý
NÂˆ›Üˆ
]ˆHšˆH˜]Ò[šÓ\Ý›[™ÝÈˆšŽÈˆ
ÏHŠHÂˆÛÛœÝH™Y‹™™]ÚY”™YŠ˜]Ò[šÓ\ÝÚ—JKˆHH™Y‹™™]ÚY”™YŠ˜]Ò[šÓ\ÝÚˆ
ÈWJNÂˆYˆ
\[ÙˆOOH›[X™\ˆˆ	‰ˆ\[ÙˆHOOH›[X™\ˆŠHÂˆ[šÓ\ÝÚ—HHÂˆ[šÓ\ÝÚˆ
ÈWHHNÂˆBˆBˆBˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝÝ›ÚÙPÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌJNÂˆÛÛœÝÝ›ÚÙP[HHXÝ™Ù]
ÐHŠNÂˆÛÛœÝ›Ü™\•ÚYH\Ë˜›Ü™\”Ý[KÚYKˆ›Ü™\Y\ÝHˆ
ˆ›Ü™\•ÚYÂˆÛÛœÝ˜›ÞH“ÖÒS’UœÛXÙJ
NÂˆ›Üˆ
ÛÛœÝ[šÓ\ÝÙˆ\Ë™]Kš[šÓ\ÝÊHÂˆ›Üˆ
]HHZHH[šÓ\Ý›[™ÝÈHZNÈH
ÏHŠHÂˆ][œ™XÝ›Ý[™[™Ð›Þ
[šÓ\ÝÚWHH›Ü™\Y\Ý[šÓ\ÝÚH
ÈWHH›Ü™\Y\Ý[šÓ\ÝÚWH
È›Ü™\Y\Ý[šÓ\ÝÚH
ÈWH
È›Ü™\Y\Ý˜›Þ
NÂˆBˆBˆYˆ
U][š[\œÙXÝ
\Ëœ™XÝ[™ÛK˜›Þ
JHÂˆ\Ëœ™XÝ[™ÛHH˜›ÞÂˆBˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜Nˆ	Ø›Ü™\•ÚYHØˆÝ›ÚÙPÛÛÜ‹ˆÝ›ÚÙP[KˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆ›Üˆ
ÛÛœÝ[šÓ\ÝÙˆ\Ë™]Kš[šÓ\ÝÊHÂˆ›Üˆ
]HHZHH[šÓ\Ý›[™ÝÈHZNÈH
ÏHŠHÂˆY™™\‹œ\Ú
	Ú[šÓ\ÝÚW_H	Ú[šÓ\ÝÚH
ÈW_H	ÚHOOHÈ›Hˆˆ›ŸX
NÂˆBˆY™™\‹œ\Ú
”ÈŠNÂˆBˆ™]\›ˆÜÚ[ÖÌKÚ[ÖÍ×KÚ[ÖÌ—KÚ[ÖÌ×WNÂˆBˆJNÂˆBˆBˆÝ]XÈÜ™X]S™]ÑXÝ
[››Ý][Û‹™Y‹Âˆ\™Y‹ˆ\ˆJHÂˆÛÛœÝÂˆÛ[››Ý][Û‹ˆÛÛÜ‹ˆ]KˆÜXÚ]Kˆ]ËˆÝ][™\Ëˆ™XÝˆ›Ý][Û‹ˆXÚÛ™\ÜËˆ\Ù\‚ˆHH[››Ý][ÛŽÂˆÛÛœÝ[šÈHÛ[››Ý][Ûˆ™]ÈXÝ
™YŠNÂˆ[šËœÙ]Y“›Ý^\ÝÊ•\H‹˜[YK™Ù]
[››ÝŠJNÂˆ[šËœÙ]Y“›Ý^\ÝÊ”ÝX\H‹˜[YK™Ù]
’[šÈŠJNÂˆ[šËœÙ]
Û[››Ý][ÛˆÈ“HˆˆÜ™X][Û‘]H‹‰ÙÙ][ÙYšXØ][Û‘]J]J_X
NÂˆ[šËœÙ]Y\œ˜^J”™XÝ‹™XÝ
NÂˆ[šËœÙ]Y\œ˜^J’[šÓ\Ý‹Ý][™\ÏËœÚ[È]ÏËœÚ[ÊNÂˆ[šËœÙ]Y“›Ý^\ÝÊ‘ˆ‹
NÂˆ[šËœÙ]Y“[X™\Š”›Ý]H‹›Ý][ÛŠNÂˆ[šËœÙ]Y‘Yš[™Y
•‹Ýš[™ÕÐ\ØÚZSÜ•UŒM‘J\Ù\ŠJNÂˆYˆ
Ý][™\ÊHÂˆ[šËœÙ]Y“˜[YJ’U‹’[šÒYÚYÚŠNÂˆBˆYˆ
XÚÛ™\ÜÈˆ
HÂˆÛÛœÝœÈH™]ÈXÝ
™YŠNÂˆ[šËœÙ]
”È‹œÊNÂˆœËœÙ]
•È‹XÚÛ™\ÜÊNÂˆBˆ[šËœÙ]Y\œ˜^JÈ‹Ù]ÛÛÜ\œ˜^JÛÛÜŠJNÂˆ[šËœÙ]Y“[X™\ŠÐH‹ÜXÚ]JNÂˆYˆ
\\™YŠHÂˆÛÛœÝˆH™]ÈXÝ
™YŠNÂˆ[šËœÙ]
T‹ŠNÂˆ‹œÙ]
“ˆ‹\™Yˆ\
NÂˆBˆ™]\›ˆ[šÎÂˆBˆÝ]XÈ\Þ[˜ÈÜ™X]S™]Ð\X\˜[˜ÙTÝ™X[J[››Ý][Û‹™Y‹\˜[\ÊHÂˆYˆ
[››Ý][Û‹›Ý][™\ÊHÂˆ™]\›ˆ\Ë˜Ü™X]S™]Ð\X\˜[˜ÙTÝ™X[Q›Ü’YÚYÚ
[››Ý][Û‹™Y‹\˜[\ÊNÂˆBˆÛÛœÝÂˆÛÛÜ‹ˆ™XÝˆ]ËˆXÚÛ™\ÜËˆÜXÚ]BˆHH[››Ý][ÛŽÂˆYˆ
XÛÛÜŠHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ\X\˜[˜ÙPY™™\ˆHØ	ÝXÚÛ™\ÜßHÈHˆH˜	ÙÙ]ÛÛÜŠÛÛÜ‹˜[ÙJ_XNÂˆYˆ
ÜXÚ]HOOHJHÂˆ\X\˜[˜ÙPY™™\‹œ\Ú
‹ÔŒÜÈŠNÂˆBˆ›Üˆ
ÛÛœÝÝ][™HÙˆ]Ë›[™\ÊHÂˆÜš]S[™UÐÝ\™UÐ\X\˜[˜ÙJÝ][™K\X\˜[˜ÙPY™™\‹YJNÂˆBˆ\X\˜[˜ÙPY™™\‹œ\Ú
”ÈŠNÂˆÛÛœÝ\X\˜[˜ÙHH\X\˜[˜ÙPY™™\‹š›Ú[Š—ˆŠNÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[QXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
‘›Ü›U\H‹JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ•\H‹–Øš™XÝŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
›Þ‹™XÝ
NÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
“[™Ý‹\X\˜[˜ÙK›[™Ý
NÂˆYˆ
ÜXÚ]HOOHJHÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH™]ÈXÝ
™YŠNÂˆÛÛœÝ^ÔÝ]HH™]ÈXÝ
™YŠNÂˆÛÛœÝŒH™]ÈXÝ
™YŠNÂˆŒœÙ]
ÐH‹ÜXÚ]JNÂˆŒœÙ]Y“˜[YJ•\H‹‘^ÔÝ]HŠNÂˆ^ÔÝ]KœÙ]
”Œ‹Œ
NÂˆ™\ÛÝ\˜Ù\ËœÙ]
‘^ÔÝ]H‹^ÔÝ]JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÊNÂˆBˆ™]\›ˆ™]ÈÝš[™ÔÝ™X[J\X\˜[˜ÙK\X\˜[˜ÙTÝ™X[QXÝ
NÂˆBˆÝ]XÈ\Þ[˜ÈÜ™X]S™]Ð\X\˜[˜ÙTÝ™X[Q›Ü’YÚYÚ
[››Ý][Û‹™Y‹\˜[\ÊHÂˆÛÛœÝÂˆÛÛÜ‹ˆ™XÝˆÝ][™\ÎˆÂˆÝ][™BˆKˆÜXÚ]BˆHH[››Ý][ÛŽÂˆYˆ
XÛÛÜŠHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ\X\˜[˜ÙPY™™\ˆHØ	ÙÙ]ÛÛÜŠÛÛÜ‹YJ_X‹ÔŒÜÈ—NÂˆÜš]S[™UÐÝ\™UÐ\X\˜[˜ÙJÝ][™K\X\˜[˜ÙPY™™\ŠNÂˆ\X\˜[˜ÙPY™™\‹œ\Ú
šˆŠNÂˆÛÛœÝ\X\˜[˜ÙHH\X\˜[˜ÙPY™™\‹š›Ú[Š—ˆŠNÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[QXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
‘›Ü›U\H‹JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ•\H‹–Øš™XÝŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
›Þ‹™XÝ
NÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
“[™Ý‹\X\˜[˜ÙK›[™Ý
NÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH™]ÈXÝ
™YŠNÂˆÛÛœÝ^ÔÝ]HH™]ÈXÝ
™YŠNÂˆ™\ÛÝ\˜Ù\ËœÙ]
‘^ÔÝ]H‹^ÔÝ]JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÊNÂˆÛÛœÝŒH™]ÈXÝ
™YŠNÂˆ^ÔÝ]KœÙ]
”Œ‹Œ
NÂˆŒœÙ]Y“˜[YJ“H‹“][\HŠNÂˆYˆ
ÜXÚ]HOOHJHÂˆŒœÙ]
˜ØH‹ÜXÚ]JNÂˆŒœÙ]Y“˜[YJ•\H‹‘^ÔÝ]HŠNÂˆBˆ™]\›ˆ™]ÈÝš[™ÔÝ™X[J\X\˜[˜ÙK\X\˜[˜ÙTÝ™X[QXÝ
NÂˆBŸB˜Û\ÜÈYÚYÚ[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆ\Ë™]Kš\ÑY]X›HH]\Ë™]K››ÒSÂˆ\Ë™]K››ÒSH˜[ÙNÂˆ\Ë™]K›ÜXÚ]HHXÝ™Ù]
ÐHŠHNÂˆÛÛœÝ]XYÚ[ÈH\Ë™]Kœ]XYÚ[ÈHÙ]]XYÚ[ÊXÝ[
NÂˆYˆ
]XYÚ[ÊHÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝš[ÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌKKJNÂˆÛÛœÝš[[HHXÝ™Ù]
ÐHŠNÂˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆš[ÛÛÜ‹ˆ›[™[ÙNˆ“][\H‹ˆš[[KˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆY™™\‹œ\Ú
	ÜÚ[ÖÌ_H	ÜÚ[ÖÌW_HX	ÜÚ[ÖÌ—_H	ÜÚ[ÖÌ×_H	ÜÚ[ÖÍ—_H	ÜÚ[ÖÍ×_H	ÜÚ[ÖÍ_H	ÜÚ[ÖÍW_H™ˆŠNÂˆ™]\›ˆÜÚ[ÖÌKÚ[ÖÍ×KÚ[ÖÌ—KÚ[ÖÌ×WNÂˆBˆJNÂˆBˆH[ÙHÂˆ\Ë™]KœÜ\™YˆH[ÂˆBˆBˆÙ]Ý™\›^\Õ^ÛÛ[

HÂˆ™]\›ˆYNÂˆBˆÝ]XÈÜ™X]S™]ÑXÝ
[››Ý][Û‹™Y‹Âˆ\™Y‹ˆ\ˆJHÂˆÛÛœÝÂˆÛÛÜ‹ˆ]KˆÛ[››Ý][Û‹ˆÜXÚ]Kˆ™XÝˆ›Ý][Û‹ˆ\Ù\‹ˆ]XYÚ[ÂˆHH[››Ý][ÛŽÂˆÛÛœÝYÚYÚHÛ[››Ý][Ûˆ™]ÈXÝ
™YŠNÂˆYÚYÚœÙ]Y“›Ý^\ÝÊ•\H‹˜[YK™Ù]
[››ÝŠJNÂˆYÚYÚœÙ]Y“›Ý^\ÝÊ”ÝX\H‹˜[YK™Ù]
’YÚYÚŠJNÂˆYÚYÚœÙ]
Û[››Ý][ÛˆÈ“HˆˆÜ™X][Û‘]H‹‰ÙÙ][ÙYšXØ][Û‘]J]J_X
NÂˆYÚYÚœÙ]Y\œ˜^J”™XÝ‹™XÝ
NÂˆYÚYÚœÙ]Y“›Ý^\ÝÊ‘ˆ‹
NÂˆYÚYÚœÙ]Y“›Ý^\ÝÊ›Ü™\ˆ‹ÌJNÂˆYÚYÚœÙ]Y“[X™\Š”›Ý]H‹›Ý][ÛŠNÂˆYÚYÚœÙ]Y\œ˜^J”]XYÚ[È‹]XYÚ[ÊNÂˆYÚYÚœÙ]Y\œ˜^JÈ‹Ù]ÛÛÜ\œ˜^JÛÛÜŠJNÂˆYÚYÚœÙ]Y“[X™\ŠÐH‹ÜXÚ]JNÂˆYÚYÚœÙ]Y‘Yš[™Y
•‹Ýš[™ÕÐ\ØÚZSÜ•UŒM‘J\Ù\ŠJNÂˆYˆ
\™Yˆ\
HÂˆÛÛœÝˆH™]ÈXÝ
™YŠNÂˆYÚYÚœÙ]
T‹ŠNÂˆ‹œÙ]
“ˆ‹\™Yˆ\
NÂˆBˆ™]\›ˆYÚYÚÂˆBˆÝ]XÈ\Þ[˜ÈÜ™X]S™]Ð\X\˜[˜ÙTÝ™X[J[››Ý][Û‹™Y‹\˜[\ÊHÂˆÛÛœÝÂˆÛÛÜ‹ˆ™XÝˆÝ][™\ËˆÜXÚ]BˆHH[››Ý][ÛŽÂˆYˆ
XÛÛÜŠHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ\X\˜[˜ÙPY™™\ˆHØ	ÙÙ]ÛÛÜŠÛÛÜ‹YJ_X‹ÔŒÜÈ—NÂˆÛÛœÝY™™\ˆH×NÂˆ›Üˆ
ÛÛœÝÝ][™HÙˆÝ][™\ÊHÂˆY™™\‹›[™ÝHÂˆY™™\‹œ\Ú
	Û[X™\•ÔÝš[™ÊÝ][™VÌJ_H	Û[X™\•ÔÝš[™ÊÝ][™VÌWJ_HX
NÂˆ›Üˆ
]HH‹ZHHÝ][™K›[™ÝÈHZNÈH
ÏHŠHÂˆY™™\‹œ\Ú
	Û[X™\•ÔÝš[™ÊÝ][™VÚWJ_H	Û[X™\•ÔÝš[™ÊÝ][™VÚH
ÈWJ_H
NÂˆBˆY™™\‹œ\Ú
šŠNÂˆ\X\˜[˜ÙPY™™\‹œ\Ú
Y™™\‹š›Ú[Š—ˆŠJNÂˆBˆ\X\˜[˜ÙPY™™\‹œ\Ú
™ŠˆŠNÂˆÛÛœÝ\X\˜[˜ÙHH\X\˜[˜ÙPY™™\‹š›Ú[Š—ˆŠNÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[QXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
‘›Ü›U\H‹JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ•\H‹–Øš™XÝŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
›Þ‹™XÝ
NÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
“[™Ý‹\X\˜[˜ÙK›[™Ý
NÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH™]ÈXÝ
™YŠNÂˆÛÛœÝ^ÔÝ]HH™]ÈXÝ
™YŠNÂˆ™\ÛÝ\˜Ù\ËœÙ]
‘^ÔÝ]H‹^ÔÝ]JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÊNÂˆÛÛœÝŒH™]ÈXÝ
™YŠNÂˆ^ÔÝ]KœÙ]
”Œ‹Œ
NÂˆŒœÙ]Y“˜[YJ“H‹“][\HŠNÂˆYˆ
ÜXÚ]HOOHJHÂˆŒœÙ]
˜ØH‹ÜXÚ]JNÂˆŒœÙ]Y“˜[YJ•\H‹‘^ÔÝ]HŠNÂˆBˆ™]\›ˆ™]ÈÝš[™ÔÝ™X[J\X\˜[˜ÙK\X\˜[˜ÙTÝ™X[QXÝ
NÂˆBŸB˜Û\ÜÈ[™\›[™P[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆÛÛœÝ]XYÚ[ÈH\Ë™]Kœ]XYÚ[ÈHÙ]]XYÚ[ÊXÝ[
NÂˆYˆ
]XYÚ[ÊHÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝÝ›ÚÙPÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌJNÂˆÛÛœÝÝ›ÚÙP[HHXÝ™Ù]
ÐHŠNÂˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜Nˆ–×HMÌHÈ‹ˆÝ›ÚÙPÛÛÜ‹ˆÝ›ÚÙP[KˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆY™™\‹œ\Ú
	ÜÚ[ÖÍ_H	ÜÚ[ÖÍWH
ÈKŒßHX	ÜÚ[ÖÍ—_H	ÜÚ[ÖÍ×H
ÈKŒßH”ÈŠNÂˆ™]\›ˆÜÚ[ÖÌKÚ[ÖÍ×KÚ[ÖÌ—KÚ[ÖÌ×WNÂˆBˆJNÂˆBˆH[ÙHÂˆ\Ë™]KœÜ\™YˆH[ÂˆBˆBˆÙ]Ý™\›^\Õ^ÛÛ[

HÂˆ™]\›ˆYNÂˆBŸB˜Û\ÜÈÜ]ZYÙÛP[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆÛÛœÝ]XYÚ[ÈH\Ë™]Kœ]XYÚ[ÈHÙ]]XYÚ[ÊXÝ[
NÂˆYˆ
]XYÚ[ÊHÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝÝ›ÚÙPÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌJNÂˆÛÛœÝÝ›ÚÙP[HHXÝ™Ù]
ÐHŠNÂˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜Nˆ–×HHÈ‹ˆÝ›ÚÙPÛÛÜ‹ˆÝ›ÚÙP[KˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆÛÛœÝHH
Ú[ÖÌWHHÚ[ÖÍWJHÈŽÂˆ]ÚYHNÂˆ]HÚ[ÖÍNÂˆÛÛœÝHHÚ[ÖÍWNÂˆÛÛœÝ[™HÚ[ÖÍ—NÂˆY™™\‹œ\Ú
	ÞH	ÞH
ÈÚYHX
NÂˆÈÂˆ
ÏHŽÂˆÚYHÚYOOHÈHˆÂˆY™™\‹œ\Ú
	ÞH	ÞH
ÈÚYH
NÂˆHÚ[H
[™
NÂˆY™™\‹œ\Ú
”ÈŠNÂˆ™]\›ˆÜÚ[ÖÍKHHˆ
ˆK[™H
Èˆ
ˆWNÂˆBˆJNÂˆBˆH[ÙHÂˆ\Ë™]KœÜ\™YˆH[ÂˆBˆBˆÙ]Ý™\›^\Õ^ÛÛ[

HÂˆ™]\›ˆYNÂˆBŸB˜Û\ÜÈÝšZÙSÝ][››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‚ˆHH\˜[\ÎÂˆÛÛœÝ]XYÚ[ÈH\Ë™]Kœ]XYÚ[ÈHÙ]]XYÚ[ÊXÝ[
NÂˆYˆ
]XYÚ[ÊHÂˆYˆ
]\Ë˜\X\˜[˜ÙJHÂˆÛÛœÝÝ›ÚÙPÛÛÜˆHÙ]ÛÛÜ\œ˜^J\Ë˜ÛÛÜ‹ÌJNÂˆÛÛœÝÝ›ÚÙP[HHXÝ™Ù]
ÐHŠNÂˆ\Ë—ÜÙ]Y˜][\X\˜[˜ÙJÂˆ™Y‹ˆ^˜Nˆ–×HHÈ‹ˆÝ›ÚÙPÛÛÜ‹ˆÝ›ÚÙP[KˆÚ[ÐØ[˜XÚÎˆ
Y™™\‹Ú[ÊHOˆÂˆY™™\‹œ\Ú
	ÊÚ[ÖÌH
ÈÚ[ÖÍJHÈŸH
È	ÊÚ[ÖÌWH
ÈÚ[ÖÍWJHÈŸHX	ÊÚ[ÖÌ—H
ÈÚ[ÖÍ—JHÈŸH
È	ÊÚ[ÖÌ×H
ÈÚ[ÖÍ×JHÈŸH”ÈŠNÂˆ™]\›ˆÜÚ[ÖÌKÚ[ÖÍ×KÚ[ÖÌ—KÚ[ÖÌ×WNÂˆBˆJNÂˆBˆH[ÙHÂˆ\Ë™]KœÜ\™YˆH[ÂˆBˆBˆÙ]Ý™\›^\Õ^ÛÛ[

HÂˆ™]\›ˆYNÂˆBŸB˜Û\ÜÈÝ[\[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÜØ]™Y\ÓÝÛØ[˜\ÈH[ÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]Kš\ÑY]X›HH]\Ë™]K››ÒSÂˆ\Ë™]K››ÒSH˜[ÙNÂˆBˆ]\Ý™UšY]ÙYÚ[‘Y][™Ê\ÑY][™Ë[ÙYšYYYÈH[
HÂˆYˆ
\ÑY][™ÊHÂˆYˆ
]\Ë™]Kš\ÑY]X›JHÂˆ™]\›ˆYNÂˆBˆ\ËˆÜØ]™Y\ÓÝÛØ[˜\ÈÏÏH\Ë™]Kš\ÓÝÛØ[˜\ÎÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈHYNÂˆ™]\›ˆYNÂˆBˆYˆ
\ËˆÜØ]™Y\ÓÝÛØ[˜\ÈOOH[
HÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\ËˆÜØ]™Y\ÓÝÛØ[˜\ÎÂˆ\ËˆÜØ]™Y\ÓÝÛØ[˜\ÈH[ÂˆBˆ™]\›ˆ[[ÙYšYYYÏËš\Ê\Ë™]KšY
NÂˆBˆÝ]XÈÜ™X]S™]ÑXÝ
[››Ý][Û‹™Y‹Âˆ\™Y‹ˆ\ˆJHÂˆÛÛœÝÂˆ]KˆÛ[››Ý][Û‹ˆ™XÝˆ›Ý][Û‹ˆ\Ù\‚ˆHH[››Ý][ÛŽÂˆÛÛœÝÝ[\HÛ[››Ý][Ûˆ™]ÈXÝ
™YŠNÂˆÝ[\œÙ]Y“›Ý^\ÝÊ•\H‹˜[YK™Ù]
[››ÝŠJNÂˆÝ[\œÙ]Y“›Ý^\ÝÊ”ÝX\H‹˜[YK™Ù]
”Ý[\ŠJNÂˆÝ[\œÙ]
Û[››Ý][ÛˆÈ“HˆˆÜ™X][Û‘]H‹‰ÙÙ][ÙYšXØ][Û‘]J]J_X
NÂˆÝ[\œÙ]Y\œ˜^J”™XÝ‹™XÝ
NÂˆÝ[\œÙ]Y“›Ý^\ÝÊ‘ˆ‹
NÂˆÝ[\œÙ]Y“›Ý^\ÝÊ›Ü™\ˆ‹ÌJNÂˆÝ[\œÙ]Y“[X™\Š”›Ý]H‹›Ý][ÛŠNÂˆÝ[\œÙ]Y‘Yš[™Y
•‹Ýš[™ÕÐ\ØÚZSÜ•UŒM‘J\Ù\ŠJNÂˆYˆ
\™Yˆ\
HÂˆÛÛœÝˆH™]ÈXÝ
™YŠNÂˆÝ[\œÙ]
T‹ŠNÂˆ‹œÙ]
“ˆ‹\™Yˆ\
NÂˆBˆ™]\›ˆÝ[\ÂˆBˆÝ]XÈ\Þ[˜ÈØÜ™X]S™]Ð\X\˜[˜ÙTÝ™X[Q›Ü‘˜]Ú[™Ê[››Ý][Û‹™YŠHÂˆÛÛœÝÂˆ\™PÛÛÝ\œËˆÛÛÜ‹ˆ™XÝˆ[™\ËˆXÚÛ™\ÜÂˆHH[››Ý][ÛŽÂˆYˆ
XÛÛÜŠHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ\X\˜[˜ÙPY™™\ˆHØ	ÝXÚÛ™\ÜßHÈHˆH˜	ÙÙ]ÛÛÜŠÛÛÜ‹\™PÛÛÝ\œÊ_XNÂˆ›Üˆ
ÛÛœÝ[™HÙˆ[™\ÊHÂˆÜš]S[™UÐÝ\™UÐ\X\˜[˜ÙJ[™K\X\˜[˜ÙPY™™\‹YJNÂˆBˆ\X\˜[˜ÙPY™™\‹œ\Ú
\™PÛÛÝ\œÈÈ‘ˆˆˆ”ÈŠNÂˆÛÛœÝ\X\˜[˜ÙHH\X\˜[˜ÙPY™™\‹š›Ú[Š—ˆŠNÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[QXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
‘›Ü›U\H‹JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ•\H‹–Øš™XÝŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
›Þ‹™XÝ
NÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
“[™Ý‹\X\˜[˜ÙK›[™Ý
NÂˆ™]\›ˆ™]ÈÝš[™ÔÝ™X[J\X\˜[˜ÙK\X\˜[˜ÙTÝ™X[QXÝ
NÂˆBˆÝ]XÈ\Þ[˜ÈÜ™X]S™]Ð\X\˜[˜ÙTÝ™X[J[››Ý][Û‹™Y‹\˜[\ÊHÂˆYˆ
[››Ý][Û‹›Û[››Ý][ÛŠHÂˆ™]\›ˆ[ÂˆBˆYˆ
[››Ý][Û‹š\ÔÚYÛ˜]\™JHÂˆ™]\›ˆ\ËˆØÜ™X]S™]Ð\X\˜[˜ÙTÝ™X[Q›Ü‘˜]Ú[™Ê[››Ý][Û‹™YŠNÂˆBˆÛÛœÝÂˆ›Ý][Û‚ˆHH[››Ý][ÛŽÂˆÛÛœÝÂˆ[XYÙT™Y‹ˆÚYˆZYÚˆHH\˜[\Ëš[XYÙNÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH™]ÈXÝ
™YŠNÂˆÛÛœÝØš™XÝH™]ÈXÝ
™YŠNÂˆ™\ÛÝ\˜Ù\ËœÙ]
–Øš™XÝ‹Øš™XÝ
NÂˆØš™XÝœÙ]
’[L‹[XYÙT™YŠNÂˆÛÛœÝ\X\˜[˜ÙHHH	ÝÚYH	ÚZYÚHÛHÒ[LÈXÂˆÛÛœÝ\X\˜[˜ÙTÝ™X[QXÝH™]ÈXÝ
™YŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
‘›Ü›U\H‹JNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ”ÝX\H‹‘›Ü›HŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]Y“˜[YJ•\H‹–Øš™XÝŠNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
›Þ‹ÌÚYZYÚJNÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÊNÂˆYˆ
›Ý][ÛŠHÂˆÛÛœÝX]š^HÙ]›Ý][Û“X]š^
›Ý][Û‹ÚYZYÚ
NÂˆ\X\˜[˜ÙTÝ™X[QXÝœÙ]
“X]š^‹X]š^
NÂˆBˆ™]\›ˆ™]ÈÝš[™ÔÝ™X[J\X\˜[˜ÙK\X\˜[˜ÙTÝ™X[QXÝ
NÂˆBŸB˜Û\ÜÈš[P]XÚY[[››Ý][Ûˆ^[™ÈX\šÝ\[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆ[››Ý][Û‘ÛØ˜[ËˆXÝˆHH\˜[\ÎÂˆÛÛœÝœÑXÝHXÝ™Ù]
‘”ÈŠNÂˆ\Ë™]Kš\ÓÝÛØ[˜\ÈH\Ë™]K››Ô›Ý]NÂˆ\Ë™]K››ÒSH˜[ÙNÂˆ\Ë™]K™š[RYH\Ë—ÙÙ]]XÚY[Y
œÑXÝXÝ™Ù]˜]Ê‘”ÈŠK[››Ý][Û‘ÛØ˜[ÊNÂˆ\Ë™]K™š[HH™]Èš[TÜXÊœÑXÝ
KœÙ\šX[^˜X›NÂˆÛÛœÝ˜[YHHXÝ™Ù]
“˜[YHŠNÂˆ\Ë™]K›˜[YHH˜[YH[œÝ[˜Ù[Ùˆ˜[YHÈÝš[™ÕÔ”Ýš[™Ê˜[YK›˜[YJHˆ”\Ú[ˆŽÂˆÛÛœÝš[[HHXÝ™Ù]
˜ØHŠNÂˆ\Ë™]K™š[[HH\[Ùˆš[[HOOH›[X™\ˆˆ	‰ˆš[[HH	‰ˆš[[HHHÈš[[Hˆ[ÂˆBŸB˜Û\ÜÈYYXP[››Ý][Ûˆ^[™È[››Ý][ÛˆÂˆÝ]XÈÓQQPWÓRSQWÕTWÔ‘HH×ŠÎšY[ß]Y[ÊWËÎÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆ\Ë™]K››ÒSHYNÂˆBˆÜÙ]YYXQ]JÂˆ\ÜÙ]™Y‹ˆ\ÜÙ]XÝˆš[[˜[YKˆÛÛ[\KˆÜ˜\ÛÝ[™H˜[ÙBˆK[››Ý][Û‘ÛØ˜[ÊHÂˆ\Ë™]K››ÒSH˜[ÙNÂˆ\Ë™]KœšXÚYYXHHÂˆš[RYˆ\Ë—ÙÙ]]XÚY[Y
\ÜÙ]XÝ\ÜÙ]™Y‹[››Ý][Û‘ÛØ˜[ËÜ˜\ÛÝ[™
Kˆš[[˜[YKˆÛÛ[\BˆNÂˆBˆÝ]XÈÙÙ]ÛÛ[\J\ÜÙ]XÝš[[˜[YKÛÛ[\HH[
HÂˆYˆ
\[ÙˆÛÛ[\HOOHœÝš[™Èˆ	‰ˆYYXP[››Ý][Û‹ˆÓQQPWÓRSQWÕTWÔ‘K\Ý
ÛÛ[\JJHÂˆ™]\›ˆÛÛ[\NÂˆBˆÛÛœÝÝ™X[HHš[TÜXËœXÚÔ]›Ü›R][J\ÜÙ]XÝ™Ù]
‘QˆŠJNÂˆÛÛœÝÝX\HHÝ™X[H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[HÈÝ™X[K™XÝË™Ù]
”ÝX\HŠHˆ[ÂˆYˆ
ÝX\H[œÝ[˜Ù[Ùˆ˜[YH	‰ˆYYXP[››Ý][Û‹ˆÓQQPWÓRSQWÕTWÔ‘K\Ý
ÝX\K›˜[YJJHÂˆ™]\›ˆÝX\K›˜[YNÂˆBˆÛÛœÝ^Hš[[˜[YKœÜ]
‹ˆŠK˜]
LJOËÓÝÙ\Ø\ÙJ
NÂˆÝÚ]Ú
^
HÂˆØ\ÙH›\Ž‚ˆØ\ÙH›MˆŽ‚ˆ™]\›ˆšY[ËÛ\ŽÂˆØ\ÙHÙX›HŽ‚ˆ™]\›ˆšY[ËÝÙX›HŽÂˆØ\ÙH›ÙÝˆŽ‚ˆ™]\›ˆšY[ËÛÙÙÈŽÂˆØ\ÙH›[ÝˆŽ‚ˆ™]\›ˆšY[ËÜ]ZXÚÝ[YHŽÂˆØ\ÙH›\ÈŽ‚ˆ™]\›ˆ˜]Y[ËÛ\YÈŽÂˆØ\ÙH›MHŽ‚ˆ™]\›ˆ˜]Y[ËÛ\ŽÂˆØ\ÙHØ]ˆŽ‚ˆ™]\›ˆ˜]Y[ËÝØ]ˆŽÂˆØ\ÙH›ÙØHŽ‚ˆØ\ÙH›ÙÙÈŽ‚ˆ™]\›ˆ˜]Y[ËÛÙÙÈŽÂˆY˜][‚ˆ™]\›ˆ[ÂˆBˆBŸB˜Û\ÜÈšXÚYYXP[››Ý][Ûˆ^[™ÈYYXP[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‹ˆ[››Ý][Û‘ÛØ˜[ÂˆHH\˜[\ÎÂˆÛÛœÝÛÛ[HXÝ™Ù]
”šXÚYYXPÛÛ[ŠNÂˆYˆ
JÛÛ[[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆÛÛœÝ\ÜÙ]HšXÚYYXP[››Ý][Û‹ˆÙš[™\ÜÙ]
ÛÛ[™YŠNÂˆYˆ
X\ÜÙ]
HÂˆØ\›Š”šXÚYYXH[››Ý][Ûˆ\È›È^XX›H\ÜÙ]ˆŠNÂˆ™]\›ŽÂˆBˆ\Ë—ÜÙ]YYXQ]J\ÜÙ][››Ý][Û‘ÛØ˜[ÊNÂˆBˆÝ]XÈÙš[™\ÜÙ]
ÛÛ[™YŠHÂˆÛÛœÝÛÛ™šYÝ\˜][ÛœÈHÛÛ[™Ù]
ÛÛ™šYÝ\˜][ÛœÈŠNÂˆYˆ
P\œ˜^Kš\Ð\œ˜^JÛÛ™šYÝ\˜][ÛœÊJHÂˆ™]\›ˆ[ÂˆBˆ›Üˆ
ÛÛœÝÛÛ™šYÔ™YˆÙˆÛÛ™šYÝ\˜][ÛœÊHÂˆÛÛœÝÛÛ™šYÈH™Y‹™™]ÚY”™YŠÛÛ™šYÔ™YŠNÂˆYˆ
JÛÛ™šYÈ[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆÛÛœÝ[œÝ[˜Ù\ÈHÛÛ™šYË™Ù]
’[œÝ[˜Ù\ÈŠNÂˆYˆ
P\œ˜^Kš\Ð\œ˜^J[œÝ[˜Ù\ÊJHÂˆÛÛ[YNÂˆBˆ›Üˆ
ÛÛœÝ[œÝ[˜ÙT™YˆÙˆ[œÝ[˜Ù\ÊHÂˆÛÛœÝ[œÝ[˜ÙHH™Y‹™™]ÚY”™YŠ[œÝ[˜ÙT™YŠNÂˆYˆ
J[œÝ[˜ÙH[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆYˆ
\Ó˜[YJ[œÝ[˜ÙK™Ù]
”ÝX\HŠK‘›\ÚŠJHÂˆÛÛ[YNÂˆBˆÛÛœÝ˜]Ð\ÜÙ]H[œÝ[˜ÙK™Ù]˜]Ê\ÜÙ]ŠNÂˆÛÛœÝ\ÜÙ]H™Y‹™™]ÚY”™YŠ˜]Ð\ÜÙ]
NÂˆYˆ
J\ÜÙ][œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆYˆ
Qš[TÜXËš\Ñ[X™YYš[J\ÜÙ]
JHÂˆÛÛ[YNÂˆBˆÛÛœÝÂˆš[[˜[YBˆHH™]Èš[TÜXÊ\ÜÙ]
KœÙ\šX[^˜X›NÂˆÛÛœÝÛÛ[\HHYYXP[››Ý][Û‹—ÙÙ]ÛÛ[\J\ÜÙ]š[[˜[YJNÂˆYˆ
XÛÛ[\JHÂˆÛÛ[YNÂˆBˆ™]\›ˆÂˆ\ÜÙ]™YŽˆ˜]Ð\ÜÙ][œÝ[˜Ù[Ùˆ™YˆÈ˜]Ð\ÜÙ]ˆ[ˆ\ÜÙ]XÝˆ\ÜÙ]ˆš[[˜[YKˆÛÛ[\BˆNÂˆBˆBˆ™]\›ˆ[ÂˆBŸB˜Û\ÜÈØÜ™Y[[››Ý][Ûˆ^[™ÈYYXP[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‹ˆ[››Ý][Û‘ÛØ˜[ÂˆHH\˜[\ÎÂˆÛÛœÝ\ÜÙ]HØÜ™Y[[››Ý][Û‹ˆÙš[™\ÜÙ]
XÝ™YŠNÂˆYˆ
X\ÜÙ]
HÂˆ™]\›ŽÂˆBˆ\Ë—ÜÙ]YYXQ]J\ÜÙ][››Ý][Û‘ÛØ˜[ÊNÂˆBˆÝ]XÈÙš[™\ÜÙ]
XÝ™YŠHÂˆ›Üˆ
ÛÛœÝXÝ[ÛˆÙˆ\ËˆÜ™[™][ÛXÝ[ÛœÊXÝ
JHÂˆÛÛœÝ\ÜÙ]H\ËˆÙš[™™[™][Û\ÜÙ]
XÝ[Û‹™Ù]
”ˆŠK™Y‹™]È™Y”Ù]

JNÂˆYˆ
\ÜÙ]
HÂˆ™]\›ˆ\ÜÙ]ÂˆBˆBˆ™]\›ˆ[ÂˆBˆÝ]XÈ
ˆÜ™[™][ÛXÝ[ÛœÊXÝ
HÂˆÛÛœÝXÝ[ÛˆHXÝ™Ù]
HŠNÂˆYˆ
XÝ[Ûˆ[œÝ[˜Ù[ÙˆXÝ	‰ˆ\Ó˜[YJXÝ[Û‹™Ù]
”ÈŠK”™[™][ÛˆŠH	‰ˆ\ËˆÚ\Ô^PXÝ[ÛŠXÝ[ÛŠJHÂˆZY[XÝ[ÛŽÂˆBˆÛÛœÝY][Û˜[XÝ[ÛœÈHXÝ™Ù]
PHŠNÂˆYˆ
Y][Û˜[XÝ[ÛœÈ[œÝ[˜Ù[ÙˆXÝ
HÂˆ›Üˆ
ÛÛœÝËXWHÙˆY][Û˜[XÝ[ÛœÊHÂˆYˆ
XH[œÝ[˜Ù[ÙˆXÝ	‰ˆ\Ó˜[YJXK™Ù]
”ÈŠK”™[™][ÛˆŠH	‰ˆ\ËˆÚ\Ô^PXÝ[ÛŠXJJHÂˆZY[XNÂˆBˆBˆBˆBˆÝ]XÈÚ\Ô^PXÝ[ÛŠXÝ[ÛŠHÂˆÛÛœÝÜ\˜][ÛˆHXÝ[Û‹™Ù]
“ÔŠNÂˆ™]\›ˆÜ\˜][ÛˆOOH[™Yš[™YÜ\˜][ÛˆOOH[››Ý][Û”™[™][Û“Ü\˜][Û‹”VWÓÔ—Ô‘TÕSQHÜ\˜][ÛˆOOH[››Ý][Û”™[™][Û“Ü\˜][Û‹”VNÂˆBˆÝ]XÈÙš[™™[™][Û\ÜÙ]
™[™][Û‹™Y‹ÙY[ŠHÂˆYˆ
J™[™][Ûˆ[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÝX\HH™[™][Û‹™Ù]
”ÈŠNÂˆYˆ
\Ó˜[YJÝX\K“TˆŠJHÂˆ™]\›ˆ\ËˆÙš[™Û\\ÜÙ]
™[™][Û‹™Ù]
ÈŠK™YŠNÂˆBˆYˆ
\Ó˜[YJÝX\K”ÔˆŠJHÂˆÛÛœÝ™[™][ÛœÈH™[™][Û‹™Ù]
”ˆŠNÂˆYˆ
\œ˜^Kš\Ð\œ˜^J™[™][ÛœÊJHÂˆ›Üˆ
ÛÛœÝ™YˆÙˆ™[™][ÛœÊHÂˆYˆ
™Yˆ[œÝ[˜Ù[Ùˆ™YŠHÂˆYˆ
ÙY[‹š\Ê™YŠJHÂˆÛÛ[YNÂˆBˆÙY[‹œ]
™YŠNÂˆBˆÛÛœÝ\ÜÙ]H\ËˆÙš[™™[™][Û\ÜÙ]
™Y‹™™]ÚY”™YŠ™YŠK™Y‹ÙY[ŠNÂˆYˆ
\ÜÙ]
HÂˆ™]\›ˆ\ÜÙ]ÂˆBˆBˆBˆBˆ™]\›ˆ[ÂˆBˆÝ]XÈÙš[™Û\\ÜÙ]
Û\™YŠHÂˆYˆ
JÛ\[œÝ[˜Ù[ÙˆXÝ
HZ\Ó˜[YJÛ\™Ù]
”ÈŠK“PÑŠJHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ˜]Ñ]HHÛ\™Ù]˜]Ê‘ŠNÂˆÛÛœÝ]HH™Y‹™™]ÚY”™YŠ˜]Ñ]JNÂˆÛÛœÝÛÛ[\R[HÛ\™Ù]
ÕŠNÂˆ]^XÚ]\HH\[ÙˆÛÛ[\R[OOHœÝš[™ÈˆÈÛÛ[\R[ˆ[Âˆ]\ÜÙ]XÝš[[˜[YNÂˆYˆ
]H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ\ÜÙ]XÝH]K™XÝÂˆÛÛœÝ˜[YHHÛ\™Ù]
“ˆŠNÂˆš[[˜[YHH\[Ùˆ˜[YHOOHœÝš[™ÈˆÈÝš[™ÕÔ”Ýš[™Ê˜[YJHˆˆŽÂˆYˆ
Y^XÚ]\JHÂˆÛÛœÝÝX\HH]K™XÝ™Ù]
”ÝX\HŠNÂˆYˆ
ÝX\H[œÝ[˜Ù[Ùˆ˜[YJHÂˆ^XÚ]\HHÝX\K›˜[YNÂˆBˆBˆH[ÙHYˆ
]H[œÝ[˜Ù[ÙˆXÝ
HÂˆYˆ
Qš[TÜXËš\Ñ[X™YYš[J]JJHÂˆ™]\›ˆ[ÂˆBˆ\ÜÙ]XÝH]NÂˆ
Âˆš[[˜[YBˆHH™]Èš[TÜXÊ]JKœÙ\šX[^˜X›JNÂˆH[ÙHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÛÛ[\HHYYXP[››Ý][Û‹—ÙÙ]ÛÛ[\J\ÜÙ]XÝš[[˜[YK^XÚ]\JNÂˆYˆ
XÛÛ[\JHÂˆ™]\›ˆ[ÂˆBˆ™]\›ˆÂˆ\ÜÙ]™YŽˆ˜]Ñ]H[œÝ[˜Ù[Ùˆ™YˆÈ˜]Ñ]Hˆ[ˆ\ÜÙ]XÝˆš[[˜[YKˆÛÛ[\BˆNÂˆBŸB˜Û\ÜÈÛÝ[™[››Ý][Ûˆ^[™ÈYYXP[››Ý][ÛˆÂˆÛÛœÝXÝÜŠ\˜[\ÊHÂˆÝ\\Š\˜[\ÊNÂˆÛÛœÝÂˆXÝˆ™Y‹ˆ[››Ý][Û‘ÛØ˜[ÂˆHH\˜[\ÎÂˆÛÛœÝÛÝ[™™YˆHXÝ™Ù]˜]Ê”ÛÝ[™ŠNÂˆYˆ
JÛÝ[™™Yˆ[œÝ[˜Ù[Ùˆ™YŠJHÂˆ™]\›ŽÂˆBˆ]ÛÝ[™ÂˆžHÂˆÛÝ[™H™Y‹™™]Ú
ÛÝ[™™YŠNÂˆHØ]Ú
^
HÂˆYˆ
^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈ^ÂˆBˆØ\›ŠÛÝ[™[››Ý][ÛŽˆ‰Ù^H‹˜
NÂˆ™]\›ŽÂˆBˆYˆ
JÛÝ[™[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHYÙ]ÛÝ[™›Ü›X]
ÛÝ[™™XÝ
JHÂˆ™]\›ŽÂˆBˆ\Ë—ÜÙ]YYXQ]JÂˆ\ÜÙ]™YŽˆÛÝ[™™Y‹ˆ\ÜÙ]XÝˆÛÝ[™™XÝˆš[[˜[YNˆœÛÝ[™Ø]ˆ‹ˆÛÛ[\Nˆ˜]Y[ËÝØ]ˆ‹ˆÜ˜\ÛÝ[™ˆYBˆK[››Ý][Û‘ÛØ˜[ÊNÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KØØ[Ý[]WÛYKšœÂ‚˜ÛÛœÝTSTÈHÂˆÙ]Š
HÂˆ™]\›ˆÚYÝÊ\Ëœˆ‹™]ÈZ[\œ˜^JÍËL‹MËŒ‹ËL‹MËŒ‹ËL‹MËŒ‹ËL‹MËŒ‹KKMŒKKMŒKKMŒKKMŒLKM‹ŒËLKM‹ŒËLKM‹ŒËLKM‹ŒË‹LMKŒK‹LMKŒK‹LMKŒK‹LMKŒWJJNÂˆKˆÙ]Ê
HÂˆ™]\›ˆÚYÝÊ\ËšÈ‹™]È[Ì\œ˜^JËMŽÍŽLÍ‹LÎMMN‹ŒŒLNNKLLLLÌÌLMÍNMËLŒ‹LMÌÌŒÌLÍKMMÌNNËMÍÌÍMM‹LNMNMMËMŒŒËLNNLMŒ‹NŒÍŽ‹MÍLLKLMLŒŒŽLLŒÍLÍLÌŽKLMMÎMLLLLŽMLMŒÌ‹ÍÌMÍÌLËLÍÌÎMÌÌ‹MÌMMNŽLKÎMŒËMŒÎÌÍKMMLÍÎMŽÎLLNNÍŽLLNÌÍŒÎMŒKLMŒÍLÌMLKLMŽMËMLMÍÎMÌÍLÌŽÌËLNLŒÍÌÍLÍÎMNLŒŒMÍŒËNÎLÌMŒ‹LÍLÌMMM‹LMLÌNLŒŒLÌŽLÌÍLËLMMMMÍŒÌ‹LLMÌÌŽLÎLMÍLÍNLÍÌŒŒ‹MÌŒLŒNMÎKÍŒŽLNKMÍËMŒNMNÍKLÌÍLŒNNMLÌÎLKLNNŒÌLLŽLMMKLMMŒÍMLKMMÍÍMKMÌMMÌKLNMNŒ‹LLLMLŒËLŒMLŒÎNKNÌÌÌLÌÍNKLÌŒLMÍLMMŒNNÎLÌLMLMKLMMLŒÌÌLLLŒŒLÍÎKÌNÎÌNKLÍÍMMLWJJNÂˆBŸNÂ™[˜Ý[ÛˆØ[Ý[]SQJ]KÙ™œÙ][™Ý
HÂˆ]HMÌÌNNLËˆHHLÌMÌÌÎÎKˆˆHLMÌÌNNMˆÈHÌMÌÌÎÎÂˆÛÛœÝYY[™ÝH[™Ý
ÈÌˆ	ˆŒÎÂˆÛÛœÝYYH™]ÈZ[\œ˜^JYY[™Ý
NÂˆ]KŽÂˆ›Üˆ
HHÈH[™ÝÈ
ÊÚJHÂˆYYÚWHH]VÛÙ™œÙ]
Ê×NÂˆBˆYYÚJÊ×HHÂˆÛÛœÝˆHYY[™ÝHÂˆYˆ
HŠHÂˆHHŽÂˆBˆYYÚJÊ×HH[™ÝÈ	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆH	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆLÈ	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆŒH	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆŽH	ˆ™ŽÂˆH
ÏHÎÂˆÛÛœÝÈH™]È[Ì\œ˜^JMŠNÂˆÛÛœÝÂˆËˆ‚ˆHHTSTÎÂˆ›Üˆ
HHÈHYY[™ÝÊHÂˆ›Üˆ
ˆHÈˆMŽÈ
ÊÚ‹H
ÏH
HÂˆÖÚ—HHYYÚWHYYÚH
ÈWHYYÚH
È—HMˆYYÚH
È×HÂˆBˆ]HHˆˆHKˆÈH‹ˆHËˆ‹ˆÎÂˆ›Üˆ
ˆHÈˆÈ
ÊÚŠHÂˆYˆ
ˆMŠHÂˆˆHˆ	ˆÈ˜ˆ	ˆÂˆÈHŽÂˆH[ÙHYˆ
ˆÌŠHÂˆˆH	ˆˆ™	ˆÎÂˆÈHH
ˆˆ
ÈH	ˆMNÂˆH[ÙHYˆ
ˆ
HÂˆˆHˆˆÈˆÂˆÈHÈ
ˆˆ
ÈH	ˆMNÂˆH[ÙHÂˆˆHÈˆ
ˆ™
NÂˆÈHÈ
ˆˆ	ˆMNÂˆBˆÛÛœÝ\Hˆ›Ý]P\™ÈHH
Èˆ
ÈÖÚ—H
ÈÖÙ×Hˆ›Ý]HH–Ú—NÂˆHÎÂˆÈHŽÂˆˆHˆ
È
›Ý]P\™È›Ý]H›Ý]P\™ÈˆÌˆH›Ý]JHÂˆHH\ÂˆBˆH
ÈHÂˆHHH
ÈˆÂˆˆHˆ
ÈÈÂˆÈHÈ
ÈÂˆBˆ™]\›ˆ™]ÈZ[\œ˜^JÚ	ˆ‘‹ˆ	ˆ‘‹ˆMˆ	ˆ‘‹ˆ	ˆ‘‹H	ˆ‘‹Hˆ	ˆ‘‹HˆMˆ	ˆ‘‹Hˆ	ˆ‘‹ˆ	ˆ‘‹ˆˆ	ˆ‘‹ˆˆMˆ	ˆ‘‹ˆˆ	ˆ‘‹È	ˆ‘‹Èˆ	ˆ‘‹ÈˆMˆ	ˆ‘‹Èˆ	ˆ‘—JNÂŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÙ]\Ù]Ü™XY\‹šœÂ‚‚‚™[˜Ý[ÛˆXÛÙTÝš[™ÊÝŠHÂˆžHÂˆ™]\›ˆÝš[™ÕÕUŽÝš[™ÊÝŠNÂˆHØ]Ú
^
HÂˆØ\›ŠU‹NXÛÙ[™È˜Z[Yˆ‰Ù^H‹˜
NÂˆ™]\›ˆÝŽÂˆBŸB˜Û\ÜÈ]\Ù]S\œÙ\ˆ^[™ÈÚ[\VS\œÙ\ˆÂˆ›ÙHH[ÂˆÛ‘[™[[Y[
˜[YJHÂˆÛÛœÝ›ÙHHÝ\\‹›Û‘[™[[Y[
˜[YJNÂˆYˆ
›ÙH	‰ˆ˜[YHOOHž˜N™]\Ù]ÈŠHÂˆ\Ë››ÙHH›ÙNÂˆ›ÝÈ™]È\œ›ÜŠX›Ü[™È]\Ù]S\œÙ\‹ˆŠNÂˆBˆBŸB˜Û\ÜÈ]\Ù]™XY\ˆÂˆÛÛœÝXÝÜŠ]JHÂˆYˆ
]K™]\Ù]ÊHÂˆ\Ë››ÙHH™]ÈÚ[\VS\œÙ\ŠÂˆ\Ð]šX]\ÎˆYBˆJKœ\œÙQœ›ÛTÝš[™Ê]K™]\Ù]ÊK™ØÝ[Y[[[Y[ÂˆH[ÙHÂˆÛÛœÝ\œÙ\ˆH™]È]\Ù]S\œÙ\ŠÂˆ\Ð]šX]\ÎˆYBˆJNÂˆžHÂˆ\œÙ\‹œ\œÙQœ›ÛTÝš[™Ê]VÈžž—JNÂˆHØ]ÚßBˆ\Ë››ÙHH\œÙ\‹››ÙNÂˆBˆBˆÙ]˜[YJ]
HÂˆYˆ
]\Ë››ÙH\]
HÂˆ™]\›ˆˆŽÂˆBˆÛÛœÝ›ÙHH\Ë››ÙKœÙX\˜Ú›ÙJ\œÙVT]
]
K
NÂˆYˆ
[›ÙJHÂˆ™]\›ˆˆŽÂˆBˆÛÛœÝš\œÝH›ÙK™š\œÝÚ[ÂˆYˆ
š\œÝË››ÙS˜[YHOOH˜[YHŠHÂˆ™]\›ˆ›ÙK˜Ú[™[‹›X\
Ú[OˆXÛÙTÝš[™ÊÚ[^ÛÛ[
JNÂˆBˆ™]\›ˆXÛÙTÝš[™Ê›ÙK^ÛÛ[
NÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÚ[\œÙXÝÜ‹šœÂ˜Û\ÜÈÚ[™ÛR[\œÙXÝÜˆÂˆØ[››Ý][ÛŽÂˆZ[–H[™š[š]NÂˆZ[–HH[™š[š]NÂˆX^HR[™š[š]NÂˆX^HHR[™š[š]NÂˆÜ]XYÚ[ÈH[ÂˆÝ^H×NÂˆÙ^˜PÚ\œÈH×NÂˆÛ\Ý[\œÙXÝ[™Ô]XY[™^HLNÂˆØØ[•ZÙQ^˜PÚ\œÈH˜[ÙNÂˆÛÛœÝXÝÜŠ[››Ý][ÛŠHÂˆ\ËˆØ[››Ý][ÛˆH[››Ý][ÛŽÂˆÛÛœÝ]XYÚ[ÈH[››Ý][Û‹™]Kœ]XYÚ[ÎÂˆYˆ
\]XYÚ[ÊHÂˆÝ\Ë›Z[–\Ë›Z[–K\Ë›X^\Ë›X^WHH[››Ý][Û‹™]Kœ™XÝÂˆ™]\›ŽÂˆBˆ›Üˆ
]HHZHH]XYÚ[Ë›[™ÝÈHZNÈH
ÏH
HÂˆ\Ë›Z[–HX]›Z[Š\Ë›Z[–]XYÚ[ÖÚWJNÂˆ\Ë›X^HX]›X^
\Ë›X^]XYÚ[ÖÚH
È—JNÂˆ\Ë›Z[–HHX]›Z[Š\Ë›Z[–K]XYÚ[ÖÚH
ÈWJNÂˆ\Ë›X^HHX]›X^
\Ë›X^K]XYÚ[ÖÚH
ÈWJNÂˆBˆYˆ
]XYÚ[Ë›[™Ýˆ
HÂˆ\ËˆÜ]XYÚ[ÈH]XYÚ[ÎÂˆBˆBˆÚ[\œÙXÝÊJHÂˆYˆ
\Ë›Z[–H\Ë›X^H\Ë›Z[–HHH\Ë›X^HHJHÂˆ™]\›ˆ˜[ÙNÂˆBˆÛÛœÝ]XYÚ[ÈH\ËˆÜ]XYÚ[ÎÂˆYˆ
\]XYÚ[ÊHÂˆ™]\›ˆYNÂˆBˆYˆ
\ËˆÛ\Ý[\œÙXÝ[™Ô]XY[™^H
HÂˆÛÛœÝHH\ËˆÛ\Ý[\œÙXÝ[™Ô]XY[™^ÂˆYˆ
J]XYÚ[ÖÚWHH]XYÚ[ÖÚH
È—HH]XYÚ[ÖÚH
ÈWHHH]XYÚ[ÖÚH
ÈWHHJJHÂˆ™]\›ˆYNÂˆBˆ\ËˆÛ\Ý[\œÙXÝ[™Ô]XY[™^HLNÂˆBˆ›Üˆ
]HHZHH]XYÚ[Ë›[™ÝÈHZNÈH
ÏH
HÂˆYˆ
J]XYÚ[ÖÚWHH]XYÚ[ÖÚH
È—HH]XYÚ[ÖÚH
ÈWHHH]XYÚ[ÖÚH
ÈWHHJJHÂˆ\ËˆÛ\Ý[\œÙXÝ[™Ô]XY[™^HNÂˆ™]\›ˆYNÂˆBˆBˆ™]\›ˆ˜[ÙNÂˆBˆYÛ\
KÛ\
HÂˆYˆ
]\ËˆÚ[\œÙXÝÊJJHÂˆ\Ë™\ØX›Q^˜PÚ\œÊ
NÂˆ™]\›ˆ˜[ÙNÂˆBˆYˆ
\ËˆÙ^˜PÚ\œË›[™Ýˆ
HÂˆ\ËˆÝ^œ\Ú
\ËˆÙ^˜PÚ\œËš›Ú[ŠˆŠJNÂˆ\ËˆÙ^˜PÚ\œË›[™ÝHÂˆBˆ\ËˆÝ^œ\Ú
Û\
NÂˆ\ËˆØØ[•ZÙQ^˜PÚ\œÈHYNÂˆ™]\›ˆYNÂˆBˆY^˜PÚ\ŠÚ\ŠHÂˆYˆ
\ËˆØØ[•ZÙQ^˜PÚ\œÊHÂˆ\ËˆÙ^˜PÚ\œËœ\Ú
Ú\ŠNÂˆBˆBˆ\ØX›Q^˜PÚ\œÊ
HÂˆYˆ
]\ËˆØØ[•ZÙQ^˜PÚ\œÊHÂˆ™]\›ŽÂˆBˆ\ËˆØØ[•ZÙQ^˜PÚ\œÈH˜[ÙNÂˆ\ËˆÙ^˜PÚ\œË›[™ÝHÂˆBˆÙ]^

HÂˆ\ËˆØ[››Ý][Û‹™]K›Ý™\›ZY^H\ËˆÝ^š›Ú[ŠˆŠNÂˆBŸB˜ÛÛœÝÕTÈHÂ˜Û\ÜÈ[\œÙXÝÜˆÂˆÚ[\œÙXÝÜœÈH×NÂˆÙÜšYH×NÂˆÛZ[–ÂˆÛX^ÂˆÛZ[–NÂˆÛX^NÂˆÚ[–˜][ÎÂˆÚ[–T˜][ÎÂˆÛÛœÝXÝÜŠ[››Ý][ÛœÊHÂˆ]Z[–H[™š[š]NÂˆ]Z[–HH[™š[š]NÂˆ]X^HR[™š[š]NÂˆ]X^HHR[™š[š]NÂˆÛÛœÝ[\œÙXÝÜœÈH\ËˆÚ[\œÙXÝÜœÎÂˆ›Üˆ
ÛÛœÝ[››Ý][ÛˆÙˆ[››Ý][ÛœÊHÂˆYˆ
X[››Ý][Û‹™]Kœ]XYÚ[È	‰ˆX[››Ý][Û‹™]Kœ™XÝ
HÂˆÛÛ[YNÂˆBˆÛÛœÝ[\œÙXÝÜˆH™]ÈÚ[™ÛR[\œÙXÝÜŠ[››Ý][ÛŠNÂˆ[\œÙXÝÜœËœ\Ú
[\œÙXÝÜŠNÂˆZ[–HX]›Z[ŠZ[–[\œÙXÝÜ‹›Z[–
NÂˆZ[–HHX]›Z[ŠZ[–K[\œÙXÝÜ‹›Z[–JNÂˆX^HX]›X^
X^[\œÙXÝÜ‹›X^
NÂˆX^HHX]›X^
X^K[\œÙXÝÜ‹›X^JNÂˆBˆ\ËˆÛZ[–HZ[–Âˆ\ËˆÛZ[–HHZ[–NÂˆ\ËˆÛX^HX^Âˆ\ËˆÛX^HHX^NÂˆ\ËˆÚ[–˜][ÈH
ÕTÈHJHÈ
X^HZ[–
NÂˆ\ËˆÚ[–T˜][ÈH
ÕTÈHJHÈ
X^HHZ[–JNÂˆ›Üˆ
ÛÛœÝ[\œÙXÝÜˆÙˆ[\œÙXÝÜœÊHÂˆÛÛœÝSZ[ˆH\ËˆÙÙ]ÜšY[™^
[\œÙXÝÜ‹›Z[–[\œÙXÝÜ‹›Z[–JNÂˆÛÛœÝSX^H\ËˆÙÙ]ÜšY[™^
[\œÙXÝÜ‹›X^[\œÙXÝÜ‹›X^JNÂˆÛÛœÝÈH
SX^HSZ[ŠH	HÕTÎÂˆÛÛœÝHX]™›ÛÜŠ
SX^HSZ[ŠHÈÕTÊNÂˆ›Üˆ
]HHSZ[ŽÈHHSZ[ˆ
È
ˆÕTÎÈH
ÏHÕTÊHÂˆ›Üˆ
]ˆHÈˆHÎÈŠÊÊHÂˆ
\ËˆÙÜšYÚH
È—HÏÏH×JKœ\Ú
[\œÙXÝÜŠNÂˆBˆBˆBˆBˆÙÙ]ÜšY[™^
JHÂˆÛÛœÝHHX]™›ÛÜŠ
H\ËˆÛZ[–
H
ˆ\ËˆÚ[–˜][ÊNÂˆÛÛœÝˆHX]™›ÛÜŠ
HH\ËˆÛZ[–JH
ˆ\ËˆÚ[–T˜][ÊNÂˆ™]\›ˆH
Èˆ
ˆÕTÎÂˆBˆYÛ\
˜[œÙ›Ü›KÚYZYÚÛ\
HÂˆÛÛœÝH˜[œÙ›Ü›VÍH
ÈÚYÈŽÂˆÛÛœÝHH˜[œÙ›Ü›VÍWH
ÈZYÚÈŽÂˆYˆ
\ËˆÛZ[–H\ËˆÛZ[–Hˆ\ËˆÛX^Hˆ\ËˆÛX^JHÂˆ™]\›ŽÂˆBˆÛÛœÝ[\œÙXÝÜœÈH\ËˆÙÜšYÝ\ËˆÙÙ]ÜšY[™^
JWNÂˆYˆ
Z[\œÙXÝÜœÊHÂˆ™]\›ŽÂˆBˆ›Üˆ
ÛÛœÝ[\œÙXÝÜˆÙˆ[\œÙXÝÜœÊHÂˆ[\œÙXÝÜ‹˜YÛ\
KÛ\
NÂˆBˆBˆY^˜PÚ\ŠÚ\ŠHÂˆ›Üˆ
ÛÛœÝ[\œÙXÝÜˆÙˆ\ËˆÚ[\œÙXÝÜœÊHÂˆ[\œÙXÝÜ‹˜Y^˜PÚ\ŠÚ\ŠNÂˆBˆBˆÙ]^

HÂˆ›Üˆ
ÛÛœÝ[\œÙXÝÜˆÙˆ\ËˆÚ[\œÙXÝÜœÊHÂˆ[\œÙXÝÜ‹œÙ]^

NÂˆBˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KØØ[Ý[]WÜÚWÛÝ\‹šœÂ‚˜Û\ÜÈÛÜ™ÂˆÛÛœÝXÝÜŠYÚ[YÙ\‹ÝÒ[YÙ\ŠHÂˆ\ËšYÚHYÚ[YÙ\ˆÂˆ\Ë›ÝÈHÝÒ[YÙ\ˆÂˆBˆ[™
ÛÜ™
HÂˆ\ËšYÚ	HÛÜ™šYÚÂˆ\Ë›ÝÈ	HÛÜ™›ÝÎÂˆBˆÜŠÛÜ™
HÂˆ\ËšYÚHÛÜ™šYÚÂˆ\Ë›ÝÈHÛÜ™›ÝÎÂˆBˆÚYšYÚ
XÙ\ÊHÂˆ\Ë›ÝÈH\Ë›ÝÈˆXÙ\È\ËšYÚÌˆHXÙ\ÎÂˆ\ËšYÚH\ËšYÚˆXÙ\ÈÂˆBˆ›Ý]TšYÚ
XÙ\ÊHÂˆ]ÝËYÚÂˆYˆ
XÙ\È	ˆÌŠHÂˆYÚH\Ë›ÝÎÂˆÝÈH\ËšYÚÂˆH[ÙHÂˆÝÈH\Ë›ÝÎÂˆYÚH\ËšYÚÂˆBˆXÙ\È	HÌNÂˆ\Ë›ÝÈHÝÈˆXÙ\ÈYÚÌˆHXÙ\ÎÂˆ\ËšYÚHYÚˆXÙ\ÈÝÈÌˆHXÙ\ÎÂˆBˆ›Ý

HÂˆ\ËšYÚH\ËšYÚÂˆ\Ë›ÝÈH\Ë›ÝÎÂˆBˆY
ÛÜ™
HÂˆÛÛœÝÝÐYH
\Ë›ÝÈˆ
H
È
ÛÜ™›ÝÈˆ
NÂˆ]YÚYH
\ËšYÚˆ
H
È
ÛÜ™šYÚˆ
NÂˆYˆ
ÝÐYˆ™™™™™™™ŠHÂˆYÚY
ÏHNÂˆBˆ\Ë›ÝÈHÝÐYÂˆ\ËšYÚHYÚYÂˆBˆÛÜUÊž]\ËÙ™œÙ]
HÂˆž]\ÖÛÙ™œÙ]HH\ËšYÚˆ	ˆ™ŽÂˆž]\ÖÛÙ™œÙ]
ÈWHH\ËšYÚˆMˆ	ˆ™ŽÂˆž]\ÖÛÙ™œÙ]
È—HH\ËšYÚˆ	ˆ™ŽÂˆž]\ÖÛÙ™œÙ]
È×HH\ËšYÚ	ˆ™ŽÂˆž]\ÖÛÙ™œÙ]
ÈHH\Ë›ÝÈˆ	ˆ™ŽÂˆž]\ÖÛÙ™œÙ]
ÈWHH\Ë›ÝÈˆMˆ	ˆ™ŽÂˆž]\ÖÛÙ™œÙ]
È—HH\Ë›ÝÈˆ	ˆ™ŽÂˆž]\ÖÛÙ™œÙ]
È×HH\Ë›ÝÈ	ˆ™ŽÂˆBˆ\ÜÚYÛŠÛÜ™
HÂˆ\ËšYÚHÛÜ™šYÚÂˆ\Ë›ÝÈHÛÜ™›ÝÎÂˆBŸB˜ÛÛœÝØ[Ý[]WÜÚWÛÝ\—ÔTSTÈHÂˆÙ]Ê
HÂˆ™]\›ˆÚYÝÊ\ËšÈ‹Û™]ÈÛÜ™
ŽL™ŽNÌŽYLŒŠK™]ÈÛÜ™
ÌLÍÍLKŒÙYXÙ
K™]ÈÛÜ™
XÌ˜˜Ù‹XÍØŒ™ŠK™]ÈÛÜ™
NXY˜MKNY˜˜ÊK™]ÈÛÜ™
ÎMM˜ÌX‹ŒÍLÎ
K™]ÈÛÜ™
NYŒLLYŒKŒYNJK™]ÈÛÜ™
LŒÙŽ˜MYŒNMŽXŠK™]ÈÛÜ™
XŒXÍYYKM™LN
K™]ÈÛÜ™
ØXNNLÌÌŠK™]ÈÛÜ™
LŽÍXŒKMÌ™˜™JK™]ÈÛÜ™
ÌNX™KYMŒŽÊK™]ÈÛÜ™
MLÍÙÌËY™˜LŠK™]ÈÛÜ™
Ì˜™MYÍŒØŽM™ŠK™]ÈÛÜ™
XŒY™KØŒMŽM˜ŒJK™]ÈÛÜ™
X™Ì˜MËXÍÌLŒÍJK™]ÈÛÜ™
ÌNX™ŒMÍÙŽLŽM
K™]ÈÛÜ™
MXŽXÌKYYŒMYŠK™]ÈÛÜ™
Y˜™MÎ‹ÎŒYLÊK™]ÈÛÜ™
˜ÌNYÍ‹ŽÙXJK™]ÈÛÜ™
ØLXØËÍØXÎXÍJK™]ÈÛÜ™
™NL˜Í™‹NL˜ŒÍJK™]ÈÛÜ™
MÍXK™XM™MÊK™]ÈÛÜ™
XØŒNYË™Y˜™
K™]ÈÛÜ™
Í™ŽNKÌLMLØJK™]ÈÛÜ™
NÙMLML‹YM™˜XŠK™]ÈÛÜ™
NÌXÍ™™ÌŒL
K™]ÈÛÜ™
ŒÌØÎN˜ŒŒLÙŠK™]ÈÛÜ™
™NMÙ˜ÍË™YYŒYM
K™]ÈÛÜ™
Í™L™ŒËÙN˜ÌŠK™]ÈÛÜ™
XMÎLMËLÌXMÌJK™]ÈÛÜ™
˜ØMŒÍLKLÎ™ŠK™]ÈÛÜ™
MŽLŽMËLM™MÌ
K™]ÈÛÜ™
ØÌNK™Œ™™˜ÊK™]ÈÛÜ™
™LXŒŒLÎXÌ˜ÎLŠK™]ÈÛÜ™
˜Í™˜ËXXÍ˜YY
K™]ÈÛÜ™
LÌÎLËYMXŒÙŠK™]ÈÛÜ™
LMÌÍM˜YŒÙJK™]ÈÛÜ™
Í˜LX˜‹ØÍÍØŒ˜N
K™]ÈÛÜ™
XÌ˜ÎL™KÙYYYMŠK™]ÈÛÜ™
LÌŒ˜ÎKMŒÍLØŠK™]ÈÛÜ™
L˜™™NLKÙŒLÍ
K™]ÈÛÜ™
NXM‹˜ÍŒÌJK™]ÈÛÜ™
ÌŽÌŽMÎLJK™]ÈÛÜ™
ÍÍ˜ÍLXLËM™LÌ
K™]ÈÛÜ™
NL™NNK™YLŒN
K™]ÈÛÜ™
ŽNLŒMMXNLL
K™]ÈÛÜ™
LÍNKMÍÌLŒ˜JK™]ÈÛÜ™
L˜XLÌÌ˜˜™XŽ
K™]ÈÛÜ™
NXMÌLM‹Ž™Î
K™]ÈÛÜ™
YLÍÍ˜ÌLMXXLÊK™]ÈÛÜ™
ÍÍÍËŽYXŽNJK™]ÈÛÜ™
ÍŒ˜ØKLNXN
K™]ÈÛÜ™
ÎLXÌØŒËÍXÎMXMŒÊK™]ÈÛÜ™
YXMKLÍNXØŠK™]ÈÛÜ™
XŽXØØM‹ÍÍŒÙLÍÌÊK™]ÈÛÜ™
Ž™M™™ŒË˜Œ˜ŽLÊK™]ÈÛÜ™
ÍŽ™YKYY˜Œ™˜ÊK™]ÈÛÜ™
ÎMMŒÍ™‹ÌMÌ™Œ
K™]ÈÛÜ™
ÎÎMLYŒXÌŠK™]ÈÛÜ™
ØÍÌŒXMÎYXÊK™]ÈÛÜ™
L™Y™™˜KŒÍŒÌYLŽ
K™]ÈÛÜ™
ML˜ÙX‹N˜™NJK™]ÈÛÜ™
™YŽXLÙËŒ˜ÍÎLMJK™]ÈÛÜ™
ÍÌMÎŒ‹LÍÌLÌ˜ŠK™]ÈÛÜ™
ØLÌÙXÙKXLŒNXÊK™]ÈÛÜ™
N˜ŽÍËŒXÌÌŒÊK™]ÈÛÜ™
XYMÙ‹ÙLXŒYJK™]ÈÛÜ™
MÙÙ‹YM™YMÎ
K™]ÈÛÜ™
™ŒØXKÌŒMÍ™˜˜JK™]ÈÛÜ™
MŒÍÙÍKL˜ÎNMŠK™]ÈÛÜ™
LLÙŽN™YŽLYJK™]ÈÛÜ™
XÌLŒÍKLÌXÍÌXŠK™]ÈÛÜ™
ŽÍÙKŒÌÙ
K™]ÈÛÜ™
Ì˜ØXXØ‹ÍÌLÊK™]ÈÛÜ™
ØÎYX™LKMXÎX™X˜ÊK™]ÈÛÜ™
ÌYØÍXÌLÊK™]ÈÛÜ™
ØÍY™KØŒÙM˜ŠK™]ÈÛÜ™
NMÙŒŽNXË˜ÍMÙL˜JK™]ÈÛÜ™
Y˜Ø™˜X‹ØY™˜YXÊK™]ÈÛÜ™
˜ÍNNËMÍNMÊWJNÂˆBŸNÂ™[˜Ý[ÛˆÚ
™\Ý[K‹\
HÂˆ™\Ý[˜\ÜÚYÛŠ
NÂˆ™\Ý[˜[™
JNÂˆ\˜\ÜÚYÛŠ
NÂˆ\››Ý

NÂˆ\˜[™
ŠNÂˆ™\Ý[žÜŠ\
NÂŸB™[˜Ý[ÛˆXZŠ™\Ý[K‹\
HÂˆ™\Ý[˜\ÜÚYÛŠ
NÂˆ™\Ý[˜[™
JNÂˆ\˜\ÜÚYÛŠ
NÂˆ\˜[™
ŠNÂˆ™\Ý[žÜŠ\
NÂˆ\˜\ÜÚYÛŠJNÂˆ\˜[™
ŠNÂˆ™\Ý[žÜŠ\
NÂŸB™[˜Ý[ÛˆÚYÛXJ™\Ý[\
HÂˆ™\Ý[˜\ÜÚYÛŠ
NÂˆ™\Ý[œ›Ý]TšYÚ
Ž
NÂˆ\˜\ÜÚYÛŠ
NÂˆ\œ›Ý]TšYÚ
Í
NÂˆ™\Ý[žÜŠ\
NÂˆ\˜\ÜÚYÛŠ
NÂˆ\œ›Ý]TšYÚ
ÎJNÂˆ™\Ý[žÜŠ\
NÂŸB™[˜Ý[ÛˆÚYÛXTš[YJ™\Ý[\
HÂˆ™\Ý[˜\ÜÚYÛŠ
NÂˆ™\Ý[œ›Ý]TšYÚ
M
NÂˆ\˜\ÜÚYÛŠ
NÂˆ\œ›Ý]TšYÚ
N
NÂˆ™\Ý[žÜŠ\
NÂˆ\˜\ÜÚYÛŠ
NÂˆ\œ›Ý]TšYÚ
JNÂˆ™\Ý[žÜŠ\
NÂŸB™[˜Ý[Ûˆ]TÚYÛXJ™\Ý[\
HÂˆ™\Ý[˜\ÜÚYÛŠ
NÂˆ™\Ý[œ›Ý]TšYÚ
JNÂˆ\˜\ÜÚYÛŠ
NÂˆ\œ›Ý]TšYÚ

NÂˆ™\Ý[žÜŠ\
NÂˆ\˜\ÜÚYÛŠ
NÂˆ\œÚYšYÚ
ÊNÂˆ™\Ý[žÜŠ\
NÂŸB™[˜Ý[Ûˆ]TÚYÛXTš[YJ™\Ý[\
HÂˆ™\Ý[˜\ÜÚYÛŠ
NÂˆ™\Ý[œ›Ý]TšYÚ
NJNÂˆ\˜\ÜÚYÛŠ
NÂˆ\œ›Ý]TšYÚ
ŒJNÂˆ™\Ý[žÜŠ\
NÂˆ\˜\ÜÚYÛŠ
NÂˆ\œÚYšYÚ
ŠNÂˆ™\Ý[žÜŠ\
NÂŸB™[˜Ý[ÛˆØ[Ý[]TÒMLLŠ]KÙ™œÙ][™Ý[ÙLÎH˜[ÙJHÂˆ]K‹ËK‹ÎÂˆYˆ
[[ÙLÎ
HÂˆH™]ÈÛÜ™
˜LYMËŒØ˜ØÎL
NÂˆHH™]ÈÛÜ™
˜ØYNKØXMÌØŠNÂˆˆH™]ÈÛÜ™
ØÍ™YŒÍÌ‹™NMŽ˜ŠNÂˆÈH™]ÈÛÜ™
MM™LØKYŒYÍ™ŒJNÂˆH™]ÈÛÜ™
LLMLÙ‹YMŽ™JNÂˆHH™]ÈÛÜ™
XŒMŽË˜ŒÙM˜ÌYŠNÂˆˆH™]ÈÛÜ™
YŽÙXX‹˜X™˜ŠNÂˆÈH™]ÈÛÜ™
X™LÙNKLÍÙLŒMÎJNÂˆH[ÙHÂˆH™]ÈÛÜ™
Ø˜˜ŽYYÌLNYY
NÂˆHH™]ÈÛÜ™
ŒŽXLŽL˜KÍØÙLÊNÂˆˆH™]ÈÛÜ™
LMNLMXKÌÌMÊNÂˆÈH™]ÈÛÜ™
ML™™XÙÌMNLÎJNÂˆH™]ÈÛÜ™
ÌÌÌË™˜ÌŒÌJNÂˆHH™]ÈÛÜ™
XNËŽNMLLJNÂˆˆH™]ÈÛÜ™
ŒÌ™LŽN˜MÊNÂˆÈH™]ÈÛÜ™
ØMY™Y˜M˜M
NÂˆBˆÛÛœÝYY[™ÝHX]˜ÙZ[

[™Ý
ÈMÊHÈLŽ
H
ˆLŽÂˆÛÛœÝYYH™]ÈZ[\œ˜^JYY[™Ý
NÂˆ]KŽÂˆ›Üˆ
HHÈH[™ÝÈ
ÊÚJHÂˆYYÚWHH]VÛÙ™œÙ]
Ê×NÂˆBˆYYÚJÊ×HHÂˆÛÛœÝˆHYY[™ÝHMŽÂˆYˆ
HŠHÂˆHHŽÂˆBˆH
ÏHLNÂˆYYÚJÊ×HH[™ÝˆŽH	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆŒH	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆLÈ	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆH	ˆ™ŽÂˆYYÚJÊ×HH[™ÝÈ	ˆ™ŽÂˆÛÛœÝÈH™]È\œ˜^J
NÂˆ›Üˆ
HHÈHÈJÊÊHÂˆÖÚWHH™]ÈÛÜ™

NÂˆBˆÛÛœÝÂˆÂˆHHØ[Ý[]WÜÚWÛÝ\—ÔTSTÎÂˆ]HH™]ÈÛÜ™

KˆˆH™]ÈÛÜ™

KˆÈH™]ÈÛÜ™

NÂˆ]H™]ÈÛÜ™

KˆHH™]ÈÛÜ™

KˆˆH™]ÈÛÜ™

NÂˆ]ÈH™]ÈÛÜ™

KˆH™]ÈÛÜ™

NÂˆÛÛœÝHH™]ÈÛÜ™

KˆˆH™]ÈÛÜ™

NÂˆÛÛœÝ\HH™]ÈÛÜ™

Kˆ\ˆH™]ÈÛÜ™

NÂˆ]\ÎÂˆ›Üˆ
HHÈHYY[™ÝÊHÂˆ›Üˆ
ˆHÈˆMŽÈ
ÊÚŠHÂˆÖÚ—KšYÚHYYÚWHYYÚH
ÈWHMˆYYÚH
È—HYYÚH
È×NÂˆÖÚ—K›ÝÈHYYÚH
ÈHYYÚH
ÈWHMˆYYÚH
È—HYYÚH
È×NÂˆH
ÏHÂˆBˆ›Üˆ
ˆHMŽÈˆÈ
ÊÚŠHÂˆ\ÈHÖÚ—NÂˆ]TÚYÛXTš[YJ\ËÖÚˆH—K\ŠNÂˆ\Ë˜Y
ÖÚˆH×JNÂˆ]TÚYÛXJ\KÖÚˆHMWK\ŠNÂˆ\Ë˜Y
\JNÂˆ\Ë˜Y
ÖÚˆHM—JNÂˆBˆK˜\ÜÚYÛŠ
NÂˆ‹˜\ÜÚYÛŠJNÂˆË˜\ÜÚYÛŠŠNÂˆ˜\ÜÚYÛŠÊNÂˆK˜\ÜÚYÛŠ
NÂˆ‹˜\ÜÚYÛŠJNÂˆË˜\ÜÚYÛŠŠNÂˆ˜\ÜÚYÛŠÊNÂˆ›Üˆ
ˆHÈˆÈ
ÊÚŠHÂˆK˜\ÜÚYÛŠ
NÂˆÚYÛXTš[YJ\KK\ŠNÂˆK˜Y
\JNÂˆÚ
\KK‹Ë\ŠNÂˆK˜Y
\JNÂˆK˜Y
ÖÚ—JNÂˆK˜Y
ÖÚ—JNÂˆÚYÛXJ‹K\ŠNÂˆXZŠ\KK‹Ë\ŠNÂˆ‹˜Y
\JNÂˆ\ÈHÂˆHÎÂˆÈHŽÂˆˆHNÂˆ˜Y
JNÂˆHHÂˆHÎÂˆÈHŽÂˆˆHNÂˆ\Ë˜\ÜÚYÛŠJNÂˆ\Ë˜Y
ŠNÂˆHH\ÎÂˆBˆ˜Y
JNÂˆK˜Y
ŠNÂˆ‹˜Y
ÊNÂˆË˜Y

NÂˆ˜Y
JNÂˆK˜Y
ŠNÂˆ‹˜Y
ÊNÂˆË˜Y

NÂˆBˆ]™\Ý[ÂˆYˆ
[[ÙLÎ
HÂˆ™\Ý[H™]ÈZ[\œ˜^J
NÂˆ˜ÛÜUÊ™\Ý[
NÂˆK˜ÛÜUÊ™\Ý[
NÂˆ‹˜ÛÜUÊ™\Ý[MŠNÂˆË˜ÛÜUÊ™\Ý[
NÂˆ˜ÛÜUÊ™\Ý[ÌŠNÂˆK˜ÛÜUÊ™\Ý[
NÂˆ‹˜ÛÜUÊ™\Ý[
NÂˆË˜ÛÜUÊ™\Ý[MŠNÂˆH[ÙHÂˆ™\Ý[H™]ÈZ[\œ˜^J
NÂˆ˜ÛÜUÊ™\Ý[
NÂˆK˜ÛÜUÊ™\Ý[
NÂˆ‹˜ÛÜUÊ™\Ý[MŠNÂˆË˜ÛÜUÊ™\Ý[
NÂˆ˜ÛÜUÊ™\Ý[ÌŠNÂˆK˜ÛÜUÊ™\Ý[
NÂˆBˆ™]\›ˆ™\Ý[ÂŸB™[˜Ý[ÛˆØ[Ý[]TÒLÎ
]KÙ™œÙ][™Ý
HÂˆ™]\›ˆØ[Ý[]TÒMLLŠ]KÙ™œÙ][™ÝYJNÂŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KØØ[Ý[]WÜÚLM‹šœÂ‚˜ÛÛœÝØ[Ý[]WÜÚLM—ÔTSTÈHÂˆÙ]Ê
HÂˆ™]\›ˆÚYÝÊ\ËšÈ‹ÌŽL™ŽNÌLÍÍLKXÌ˜˜Ù‹NXY˜MKÎMM˜ÌX‹NYŒLLYŒKLŒÙŽ˜MXŒXÍYYKØXNNLŽÍXŒKÌNX™KMLÍÙÌËÌ˜™MYÍXŒY™KX™Ì˜MËÌNX™ŒMÍMXŽXÌKY˜™MÎ‹˜ÌNYÍ‹ØLXØË™NL˜Í™‹MÍXKXØŒNYËÍ™ŽNKNÙMLML‹NÌXÍ™ŒÌØÎ™NMÙ˜ÍËÍ™L™ŒËXMÎLMË˜ØMŒÍLKMŽLŽMËØÌNK™LXŒŒLÎ˜Í™˜ËLÌÎLËLMÌÍMÍ˜LX˜‹XÌ˜ÎL™KLÌŒ˜ÎKL˜™™NLKNXM‹ÌŽÌÍÍ˜ÍLXLËNL™NNKŽNLŒLÍNKL˜XLÌNXMÌLM‹YLÍÍ˜ÌÍÍÍËÍŒ˜ØKÎLXÌØŒËYXMKXŽXØØM‹Ž™M™™ŒËÍŽ™YKÎMMŒÍ™‹ÎÎMØÍÌŒL™Y™™˜KML˜ÙX‹™YŽXLÙËÍÌMÎŒ—JNÂˆBŸNÂ™[˜Ý[Ûˆ›ÝŠŠHÂˆ™]\›ˆˆˆÌˆHŽÂŸB™[˜Ý[ÛˆØ[Ý[]WÜÚLM—ØÚ
KŠHÂˆ™]\›ˆ	ˆHˆž	ˆŽÂŸB™[˜Ý[ÛˆØ[Ý[]WÜÚLM—ÛXZŠKŠHÂˆ™]\›ˆ	ˆHˆ	ˆˆˆH	ˆŽÂŸB™[˜Ý[ÛˆØ[Ý[]WÜÚLM—ÜÚYÛXJ
HÂˆ™]\›ˆ›ÝŠŠHˆ›ÝŠLÊHˆ›ÝŠŒŠNÂŸB™[˜Ý[ÛˆØ[Ý[]WÜÚLM—ÜÚYÛXTš[YJ
HÂˆ™]\›ˆ›ÝŠŠHˆ›ÝŠLJHˆ›ÝŠJNÂŸB™[˜Ý[ÛˆØ[Ý[]WÜÚLM—Û]TÚYÛXJ
HÂˆ™]\›ˆ›ÝŠÊHˆ›ÝŠN
HˆˆÎÂŸB™[˜Ý[ÛˆØ[Ý[]WÜÚLM—Û]TÚYÛXTš[YJ
HÂˆ™]\›ˆ›ÝŠMÊHˆ›ÝŠNJHˆˆLÂŸB™[˜Ý[ÛˆØ[Ý[]TÒLMŠ]KÙ™œÙ][™Ý
HÂˆ]H˜LYMËˆHH˜ØYNKˆˆHØÍ™YŒÍÌ‹ˆÈHMM™LØKˆHLLMLÙ‹ˆHHXŒMŽËˆˆHYŽÙXX‹ˆÈHX™LÙNNÂˆÛÛœÝYY[™ÝHX]˜ÙZ[

[™Ý
ÈJHÈ
H
ˆÂˆÛÛœÝYYH™]ÈZ[\œ˜^JYY[™Ý
NÂˆ]KŽÂˆ›Üˆ
HHÈH[™ÝÈ
ÊÚJHÂˆYYÚWHH]VÛÙ™œÙ]
Ê×NÂˆBˆYYÚJÊ×HHÂˆÛÛœÝˆHYY[™ÝHÂˆYˆ
HŠHÂˆHHŽÂˆBˆH
ÏHÎÂˆYYÚJÊ×HH[™ÝˆŽH	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆŒH	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆLÈ	ˆ™ŽÂˆYYÚJÊ×HH[™ÝˆH	ˆ™ŽÂˆYYÚJÊ×HH[™ÝÈ	ˆ™ŽÂˆÛÛœÝÈH™]ÈZ[Ì\œ˜^J
NÂˆÛÛœÝÂˆÂˆHHØ[Ý[]WÜÚLM—ÔTSTÎÂˆ›Üˆ
HHÈHYY[™ÝÊHÂˆ›Üˆ
ˆHÈˆMŽÈ
ÊÚŠHÂˆÖÚ—HHYYÚWHYYÚH
ÈWHMˆYYÚH
È—HYYÚH
È×NÂˆH
ÏHÂˆBˆ›Üˆ
ˆHMŽÈˆÈ
ÊÚŠHÂˆÖÚ—HHØ[Ý[]WÜÚLM—Û]TÚYÛXTš[YJÖÚˆH—JH
ÈÖÚˆH×H
ÈØ[Ý[]WÜÚLM—Û]TÚYÛXJÖÚˆHMWJH
ÈÖÚˆHM—HÂˆBˆ]HHˆˆHKˆÈH‹ˆHËˆHHˆˆHKˆÈH‹ˆHËˆKˆŽÂˆ›Üˆ
ˆHÈˆÈ
ÊÚŠHÂˆHH
ÈØ[Ý[]WÜÚLM—ÜÚYÛXTš[YJJH
ÈØ[Ý[]WÜÚLM—ØÚ
K‹ÊH
ÈÖÚ—H
ÈÖÚ—NÂˆˆHØ[Ý[]WÜÚLM—ÜÚYÛXJJH
ÈØ[Ý[]WÜÚLM—ÛXZŠK‹ÊNÂˆHÎÂˆÈHŽÂˆˆHNÂˆHH
ÈHÂˆHÎÂˆÈHŽÂˆˆHNÂˆHHH
ÈˆÂˆBˆH
ÈHÂˆHHH
ÈˆÂˆˆHˆ
ÈÈÂˆÈHÈ
ÈÂˆH
ÈHÂˆHHH
ÈˆÂˆˆHˆ
ÈÈÂˆÈHÈ
ÈÂˆBˆ™]\›ˆ™]ÈZ[\œ˜^JÚˆ	ˆ‘‹ˆMˆ	ˆ‘‹ˆ	ˆ‘‹	ˆ‘‹Hˆ	ˆ‘‹HˆMˆ	ˆ‘‹Hˆ	ˆ‘‹H	ˆ‘‹ˆˆ	ˆ‘‹ˆˆMˆ	ˆ‘‹ˆˆ	ˆ‘‹ˆ	ˆ‘‹Èˆ	ˆ‘‹ÈˆMˆ	ˆ‘‹Èˆ	ˆ‘‹È	ˆ‘‹ˆ	ˆ‘‹ˆMˆ	ˆ‘‹ˆ	ˆ‘‹	ˆ‘‹Hˆ	ˆ‘‹HˆMˆ	ˆ‘‹Hˆ	ˆ‘‹H	ˆ‘‹ˆˆ	ˆ‘‹ˆˆMˆ	ˆ‘‹ˆˆ	ˆ‘‹ˆ	ˆ‘‹Èˆ	ˆ‘‹ÈˆMˆ	ˆ‘‹Èˆ	ˆ‘‹È	ˆ‘—JNÂŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÙXÜž\ÜÝ™X[KšœÂ‚˜ÛÛœÝÚ[šÔÚ^™HHLLŽÂ˜Û\ÜÈXÜž\Ý™X[H^[™ÈXÛÙTÝ™X[HÂˆÛ™^Ú[šÈH[ÂˆÛÛœÝXÝÜŠÝ‹X^X™S[™ÝXÜž\
HÂˆÝ\\ŠX^X™S[™Ý
NÂˆ\ËœÝ™X[HHÝŽÂˆ\Ë™XÝHÝ‹™XÝÂˆ\Ë™XÜž\HXÜž\ÂˆBˆ™XY›ØÚÊ
HÂˆ]Ú[šÈH\ËˆÛ™^Ú[šÈÏÈ\ËœÝ™X[K™Ù]ž]\ÊÚ[šÔÚ^™JNÂˆYˆ
XÚ[šË›[™Ý
HÂˆ\Ë™[ÙˆHYNÂˆ™]\›ŽÂˆBˆ\ËˆÛ™^Ú[šÈH\ËœÝ™X[K™Ù]ž]\ÊÚ[šÔÚ^™JNÂˆÛÛœÝ\Ó[Ü™Q]HH\ËˆÛ™^Ú[šË›[™ÝˆÂˆÛÛœÝXÜž\H\Ë™XÜž\ÂˆÚ[šÈHXÜž\
Ú[šËZ\Ó[Ü™Q]JNÂˆÛÛœÝY™™\“[™ÝH\Ë˜Y™™\“[™Ýˆ™]Ó[™ÝHY™™\“[™Ý
ÈÚ[šË›[™ÝˆY™™\ˆH\Ë™[œÝ\™PY™™\Š™]Ó[™Ý
NÂˆY™™\‹œÙ]
Ú[šËY™™\“[™Ý
NÂˆ\Ë˜Y™™\“[™ÝH™]Ó[™ÝÂˆBˆÙ]ÜšYÚ[˜[Ý™X[J
HÂˆ™]\›ˆ\ÎÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÜØ\ÛÜ™\šœÂ˜ÛÛœÝ“Ó—ÐTÐÒRWÔÔPÑTÈH™]ÈÙ]
ÌLMŽŒŒKŒ‹ŒËŒŒKŒ‹ŒËŒŒKŒKŒ‹Œ™‹ŒY‹ÌJNÂ˜ÛÛœÝÓÓSSÓ“WÓPTQÕ×Ó“ÕS‘ÈH™]ÈÙ]
ÌYÍ‹N‹N‹NËNŒ‹ŒËŒŒŒ™L™LK™L‹™LË™L™LK™L‹™LË™L™LK™LK™L‹™LË™L™LK™L‹™Y™—JNÂ™[˜Ý[ÛˆØ\Û™\
ÝŠHÂˆ]X\YHˆŽÂˆ›Üˆ
ÛÛœÝÚ\ˆÙˆÝŠHÂˆÛÛœÝÛÙHHÚ\‹˜ÛÙTÚ[]

NÂˆYˆ
“Ó—ÐTÐÒRWÔÔPÑTËš\ÊÛÙJJHÂˆX\Y
ÏHˆŽÂˆH[ÙHYˆ
PÓÓSSÓ“WÓPTQÕ×Ó“ÕS‘Ëš\ÊÛÙJJHÂˆX\Y
ÏHÚ\ŽÂˆBˆBˆ™]\›ˆX\Y››Ü›X[^™J“‘’ÐÈŠNÂŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KØÜž\ËšœÂ‚‚‚‚‚‚‚˜Û\ÜÈTÑ›Ý\Ú\\ˆÂˆHHÂˆˆHÂˆÛÛœÝXÝÜŠÙ^JHÂˆÛÛœÝÈH™]ÈZ[\œ˜^JMŠNÂˆÛÛœÝÙ^S[™ÝHÙ^K›[™ÝÂˆ›Üˆ
]HHÈHMŽÈ
ÊÚJHÂˆÖÚWHHNÂˆBˆ›Üˆ
]HHˆHÈHMŽÈ
ÊÚJHÂˆÛÛœÝ\HÖÚWNÂˆˆHˆ
È\
ÈÙ^VÚH	HÙ^S[™ÝH	ˆ™ŽÂˆÖÚWHHÖÚ—NÂˆÖÚ—HH\ÂˆBˆ\ËœÈHÎÂˆBˆ[˜Üž\›ØÚÊ]JHÂˆ]HH\Ë˜KˆˆH\Ë˜ŽÂˆÛÛœÝÈH\ËœÎÂˆÛÛœÝˆH]K›[™ÝÂˆÛÛœÝÝ]]H™]ÈZ[\œ˜^JŠNÂˆ›Üˆ
]HHÈHŽÈ
ÊÚJHÂˆHHH
ÈH	ˆ™ŽÂˆÛÛœÝ\HÖØWNÂˆˆHˆ
È\	ˆ™ŽÂˆÛÛœÝ\ˆHÖØ—NÂˆÖØWHH\ŽÂˆÖØ—HH\ÂˆÝ]]ÚWHH]VÚWHˆÖÝ\
È\ˆ	ˆ™—NÂˆBˆ\Ë˜HHNÂˆ\Ë˜ˆHŽÂˆ™]\›ˆÝ]]ÂˆBˆXÜž\›ØÚÊ]JHÂˆ™]\›ˆ\Ë™[˜Üž\›ØÚÊ]JNÂˆBˆ[˜Üž\
]JHÂˆ™]\›ˆ\Ë™[˜Üž\›ØÚÊ]JNÂˆBŸB˜Û\ÜÈ[Ú\\ˆÂˆXÜž\›ØÚÊ]JHÂˆ™]\›ˆ]NÂˆBˆ[˜Üž\
]JHÂˆ™]\›ˆ]NÂˆBŸB˜Û\ÜÈQTÐ˜\ÙPÚ\\ˆÂˆÜÈH™]ÈZ[\œ˜^JÌŒËØËÍËØ‹Œ‹˜‹™‹ÍKÌKË˜‹™KËX‹Í‹ØK‹ÎKÙ˜KNKËŒYL‹Y‹XËMÌ‹ÌË™LË‹Í‹Ù‹ËØËÍMKMKŒKÌKÌKMKÍËŒËÌËNM‹KXKËL‹L‹X‹ËŒ‹ÍKKË˜ËXKX‹™KXKLL‹Ø‹‹ŒËŽKLË™‹LËKYŒ˜ËŒKX‹˜KØ‹™KÎKKËNÙ‹Y‹XK˜‹ËÌËKKŽK‹Ù‹LØËY‹NLKLË‹L‹YÎK˜Ë‹KŒKL™‹ŒË‹ÙËLËXËY‹MËMËÍMËÙKÙYNKÌËŒK‹ËŒ‹˜KL‹YKŽMKYK‹‹LÌ‹ØKKK‹XËÌ‹ËXËŒ‹LKMKMÎKMËÎÍË™KKNK˜ËM‹XKKØKYK˜KÎK™KXËM‹Í‹NÍY‹‹™‹KÌÙKK‹Ë‹KŒKÍKMËŽK‹ÌKYYKLKŽNLKŽKKKMX‹YKËNKÙKMKŽ‹ËLKK™‹M‹‹ŽKNK™‹ŒM˜‹M—JNÂˆÚ[—ÜÈH™]ÈZ[\œ˜^JÌL‹K˜KKÌÍ‹MKÎ™‹LËYKKŒËË˜‹ØËLËÎK‹X‹™‹™‹ËÍKËÍKNKØ‹MØ‹MÌ‹M‹Ì‹ŒËÙYKËMK‹‹˜KÌËK™KLK‹ŽKŒ‹Í‹X‹L‹K™‹KKÌ‹Ž‹‹ŽNM‹MXËØËYK‹L‹˜ËÌL™YŽKKYKMK‹MËMËYLX‹Ë˜ËËKËMNKŽŒËK‹˜ËYK‹ØKÙ‹‹‹ÌKY‹™ËKLËK˜‹ØKLKLKK‹ËËXKMËŒ‹Ù‹ÙKŒM‹ÌËM‹XËÍŒ‹MËYÍKKL‹ŽKÍËNXËÍK‹™KËŒKXKÌKYŽKÍKK™‹ËŒ‹KXKN™KX‹˜ËM‹ÙK‹Í‹‹ÎKŒXK‹Ì™KÎÙXKY‹NÌËËÍËÌKŒKL‹LNKËXËY‹ŒLKÙ‹NKNKKK™MKØKY‹LËÎKXËY‹LLØ‹YK˜KKŒÎX‹˜‹ØËËLËNKŒKMË˜‹ÙK˜KÍË‹‹LKŽKMŒËMKŒKËÙJNÂˆÛZ^H™]ÈZ[Ì\œ˜^JÌLL‹XÌLŒXLM‹LŒXŒMÌYÎÍ˜ËÍŒ™ÎLËÍŒ™LØK˜LÙŒŒÌÌKÌŽNÙMMMLË˜ÍXMÌKŒLÍÙK˜ÍXÍÍMLMÙ‹MÙMŒ‹XMÍÍŽKLLŒYNNY˜‹˜Î˜ØXM‹ŒŽ˜ÍØYMXË˜™NNMËÍM™™NKØXY™ŒÎKLŽNYYXYLËØØXL™™K˜ÌØY™KN˜ÎØÍM™NXÙ‹YNM™‹˜YMÎX™KŒØ˜˜Ø‹LÌ˜ÌÍÌŽXLM™ÎLŒXÍ‹LÌYŽMËYMŽXË™ŒMMKŒLNKXÌÙÌŒËMMØYLŽÍŒXÎLÍKŽMŽÍÙKLÍMÙMÌ‹YYYXLY™NKMÙŒL‹Ø˜X˜˜Ø‹ÍXL˜ÌØŽMÌYŽXŒØÙ‹ÎY™MËL™XËYŽYYŒKLNM˜K™LÌÎLËYXLNNMÙŒLNNKNYŽMKÌØÍÌÍØ™‹ÙÙLØX™™L™NKŒYÌŒL‹YÍ™‹LÍÙŒ™ŒMÍÙL™™ØYX‹MMLNYKXXMKMØØËÍMXÍËÙLXYKÌÍÌMKÌL˜ÌY˜ŽÙŒLL˜ŒËMLXLÌN‹XŒLÌØÎKŽL˜ŽMÌLŽY‹M˜™‹ÙY˜ŒLYMÍLY™™XMX‹ÍXÌŽM˜KØ˜ØŽŒKŽYLÍØËÙNYMÍËÙYYLYKÌØMÙMKŒX˜ØÙŒ™˜XÌŒËNYLLÌ‹ŽÙXÌÎKNNN˜ŒMÎLYŒ™‹ÍŽÎŽ‹˜MY˜ØÎX‹M˜ÌNLMŽYL˜LKŒY˜XKLØ™ŽËXÍÌ™X˜ËŒX™YKØŒÙKXLMØMÌËMYXNXÎÙLŒNYŽKÌŽÙŒ‹ŒŒÌÎLY‹˜ÌØNYMM™ŒÙNŒÍ‹XÙŒXÌ˜‹ÍŒLLŒYYŽLÌŒLKLŒÙŒXKŒ™XŒŽË˜ÙLŒLËMŽMM™MKNXÍŒÍ™K˜NÍÍÌËMÎMÎXŒMXMKŽMÍ‹Ì˜LÍY‹ØØXMMYXÙYË™MYÙ˜ËY™XÌLKLÙØÙXKÎXÎYY‹ÍØÌYLÙYYÙ˜™ÙŽXÍ‹ÌXMŒ˜Y‹Ù˜Y™˜M™˜NŽKŒØ™˜MXŒ‹NŽËÎNŽMNLŽXÎMKXŽXŽLNYKLMØÌMËYÍLÍË™™LLLKŒÍÌYXKNMNÙM˜‹MÍLLÌÍŒMLÙÌŽMÍ‹LÍŒŒY‹ŒÙ™ŒMÙÎKÌÌ™ÍL‹NLLMŒÌËMÌNMXŒÎLÌK˜ŒL™KXYÍŒNËMM˜ÎË˜ÍMØŽXKØÍÍŽLKL™ŒÍMXLXÙ˜MNX‹™YLM˜‹ŒN˜™XNYŒYMMŒ‹ŽLØÌ‹ŽYXÎK˜˜ŒÙŽØŒŒÌŒËÙXNLÙYKÌL˜YMKØMØŒLØËÍX˜ÌÍËMXXŒ˜KŽXØMŒŒKŒÎLLÍ˜NX‹YMÌNYŒ‹LÎLŒL™M™™‹MŒYÌÍÌ‹NMÙMÎKÌŒ˜™YØÌŒ™LË™LÎYÍYKŒÌ˜MMKXÎXXÌKLŽLØ˜LKŒYMË™NXLXË™NÌ™XÎL‹ÎXÎNLØ‹Í˜MNMÌXÙ™NKL™™L‹ÌÍM‹XÎXÎM™XÍKXY™™MÙKŽMŒMŒË™Y˜ÍŽÌMØŒKŒÍ˜X˜KLNÙMËYLLMÌXËÍ™MLÎYØLÍYNM‹ŽØÍN‹ŒÍMØÍŒ™NKÌŒ™L‹ŒLMY™‹™MNLNŒØ˜ÍKM™ŒÍ˜ÙKNÍŒYËMÙ˜ÙÍØLLÍØKÎXNMÌK˜˜ŒÌM˜ËX˜LXËŽLÎM‹NÌÍMYLÎMÌŒYYL™‹ÙNMŒ‹YLŽLŽKX™˜ÙLÍMYŒÌÌÙ‹Ù˜ÙLKÌXÍYKŒÙLN™ÌLËÌÌYØØKLÎXÌKØŒŒØÍ™ËÍL˜XØ™ËYŒMYNM‹LLXÙMYYŒÌÙŒ™Œ™Y™™˜‹MÍÎXL‹NMÌŽNNK˜˜˜YNMŒ˜LÎ‹YY™KLMMKÍŽXXNŽMØL×JNÂˆÛZ^ÛÛHZ[\œ˜^K™œ›ÛJÂˆ[™ÝˆM‚ˆK
ËJHOˆHLŽÈHHˆHHˆXŠNÂˆÛÛœÝXÝÜŠ
HÂˆ\Ë˜Y™™\ˆH™]ÈZ[\œ˜^JMŠNÂˆ\Ë˜Y™™\”ÜÚ][ÛˆHÂˆBˆÙ^[™Ù^JÚ\\’Ù^JHÂˆ[œ™XXÚX›JØ[››ÝØ[Ù^[™Ù^XÛˆH˜\ÙHÛ\ÜÈŠNÂˆBˆÙXÜž\
[œ]Ù^JHÂˆ]KŽÂˆÛÛœÝÝ]HH™]ÈZ[\œ˜^JMŠNÂˆÝ]KœÙ]
[œ]
NÂˆ›Üˆ
]ˆHÈH\Ë—ÚÙ^TÚ^™NÈˆMŽÈ
ÊÚ‹
ÊÚÊHÂˆÝ]VÚ—HHÙ^VÚ×NÂˆBˆ›Üˆ
]HH\Ë—ØÞXÛ\ÓÙ”™\]][ÛˆHNÈHHNÈKZJHÂˆHÝ]VÌL×NÂˆÝ]VÌL×HHÝ]VÎWNÂˆÝ]VÎWHHÝ]VÍWNÂˆÝ]VÍWHHÝ]VÌWNÂˆÝ]VÌWHHÂˆHÝ]VÌMNÂˆHHÝ]VÌLNÂˆÝ]VÌMHHÝ]VÍ—NÂˆÝ]VÌLHHÝ]VÌ—NÂˆÝ]VÍ—HHÂˆÝ]VÌ—HHNÂˆHÝ]VÌMWNÂˆHHÝ]VÌLWNÂˆˆHÝ]VÍ×NÂˆÝ]VÌMWHHÝ]VÌ×NÂˆÝ]VÌLWHHÂˆÝ]VÍ×HHNÂˆÝ]VÌ×HHŽÂˆ›Üˆ
]ˆHÈˆMŽÈ
ÊÚŠHÂˆÝ]VÚ—HH\Ë—Ú[—ÜÖÜÝ]VÚ—WNÂˆBˆ›Üˆ
]ˆHÈHH
ˆMŽÈˆMŽÈ
ÊÚ‹
ÊÚÊHÂˆÝ]VÚ—HHÙ^VÚ×NÂˆBˆ›Üˆ
]ˆHÈˆMŽÈˆ
ÏH
HÂˆÛÛœÝÌH\Ë—ÛZ^ÜÝ]VÚ—WNÂˆÛÛœÝÌHH\Ë—ÛZ^ÜÝ]VÚˆ
ÈWWNÂˆÛÛœÝÌˆH\Ë—ÛZ^ÜÝ]VÚˆ
È—WNÂˆÛÛœÝÌÈH\Ë—ÛZ^ÜÝ]VÚˆ
È×WNÂˆHÌˆÌHˆˆÌHˆÌˆˆMˆˆÌˆMˆˆÌÈˆˆÌÈÂˆÝ]VÚ—HHˆ	ˆ™ŽÂˆÝ]VÚˆ
ÈWHHˆMˆ	ˆ™ŽÂˆÝ]VÚˆ
È—HHˆ	ˆ™ŽÂˆÝ]VÚˆ
È×HH	ˆ™ŽÂˆBˆBˆHÝ]VÌL×NÂˆÝ]VÌL×HHÝ]VÎWNÂˆÝ]VÎWHHÝ]VÍWNÂˆÝ]VÍWHHÝ]VÌWNÂˆÝ]VÌWHHÂˆHÝ]VÌMNÂˆHHÝ]VÌLNÂˆÝ]VÌMHHÝ]VÍ—NÂˆÝ]VÌLHHÝ]VÌ—NÂˆÝ]VÍ—HHÂˆÝ]VÌ—HHNÂˆHÝ]VÌMWNÂˆHHÝ]VÌLWNÂˆˆHÝ]VÍ×NÂˆÝ]VÌMWHHÝ]VÌ×NÂˆÝ]VÌLWHHÂˆÝ]VÍ×HHNÂˆÝ]VÌ×HHŽÂˆ›Üˆ
]ˆHÈˆMŽÈ
ÊÚŠHÂˆÝ]VÚ—HH\Ë—Ú[—ÜÖÜÝ]VÚ—WNÂˆÝ]VÚ—HHÙ^VÚ—NÂˆBˆ™]\›ˆÝ]NÂˆBˆÙ[˜Üž\
[œ]Ù^JHÂˆÛÛœÝÈH\Ë—ÜÎÂˆ]KŽÂˆÛÛœÝÝ]HH™]ÈZ[\œ˜^JMŠNÂˆÝ]KœÙ]
[œ]
NÂˆ›Üˆ
]ˆHÈˆMŽÈ
ÊÚŠHÂˆÝ]VÚ—HHÙ^VÚ—NÂˆBˆ›Üˆ
]HHNÈH\Ë—ØÞXÛ\ÓÙ”™\]][ÛŽÈJÊÊHÂˆ›Üˆ
]ˆHÈˆMŽÈ
ÊÚŠHÂˆÝ]VÚ—HHÖÜÝ]VÚ—WNÂˆBˆˆHÝ]VÌWNÂˆÝ]VÌWHHÝ]VÍWNÂˆÝ]VÍWHHÝ]VÎWNÂˆÝ]VÎWHHÝ]VÌL×NÂˆÝ]VÌL×HHŽÂˆˆHÝ]VÌ—NÂˆHHÝ]VÍ—NÂˆÝ]VÌ—HHÝ]VÌLNÂˆÝ]VÍ—HHÝ]VÌMNÂˆÝ]VÌLHHŽÂˆÝ]VÌMHHNÂˆˆHÝ]VÌ×NÂˆHHÝ]VÍ×NÂˆHÝ]VÌLWNÂˆÝ]VÌ×HHÝ]VÌMWNÂˆÝ]VÍ×HHŽÂˆÝ]VÌLWHHNÂˆÝ]VÌMWHHÂˆ›Üˆ
]ˆHÈˆMŽÈˆ
ÏH
HÂˆÛÛœÝÌHÝ]VÚ—NÂˆÛÛœÝÌHHÝ]VÚˆ
ÈWNÂˆÛÛœÝÌˆHÝ]VÚˆ
È—NÂˆÛÛœÝÌÈHÝ]VÚˆ
È×NÂˆHÌˆÌHˆÌˆˆÌÎÂˆÝ]VÚ—HHˆ\Ë—ÛZ^ÛÛÜÌˆÌWNÂˆÝ]VÚˆ
ÈWHHˆ\Ë—ÛZ^ÛÛÜÌHˆÌ—NÂˆÝ]VÚˆ
È—HHˆ\Ë—ÛZ^ÛÛÜÌˆˆÌ×NÂˆÝ]VÚˆ
È×HHˆ\Ë—ÛZ^ÛÛÜÌÈˆÌNÂˆBˆ›Üˆ
]ˆHÈHH
ˆMŽÈˆMŽÈ
ÊÚ‹
ÊÚÊHÂˆÝ]VÚ—HHÙ^VÚ×NÂˆBˆBˆ›Üˆ
]ˆHÈˆMŽÈ
ÊÚŠHÂˆÝ]VÚ—HHÖÜÝ]VÚ—WNÂˆBˆˆHÝ]VÌWNÂˆÝ]VÌWHHÝ]VÍWNÂˆÝ]VÍWHHÝ]VÎWNÂˆÝ]VÎWHHÝ]VÌL×NÂˆÝ]VÌL×HHŽÂˆˆHÝ]VÌ—NÂˆHHÝ]VÍ—NÂˆÝ]VÌ—HHÝ]VÌLNÂˆÝ]VÍ—HHÝ]VÌMNÂˆÝ]VÌLHHŽÂˆÝ]VÌMHHNÂˆˆHÝ]VÌ×NÂˆHHÝ]VÍ×NÂˆHÝ]VÌLWNÂˆÝ]VÌ×HHÝ]VÌMWNÂˆÝ]VÍ×HHŽÂˆÝ]VÌLWHHNÂˆÝ]VÌMWHHÂˆ›Üˆ
]ˆHÈH\Ë—ÚÙ^TÚ^™NÈˆMŽÈ
ÊÚ‹
ÊÚÊHÂˆÝ]VÚ—HHÙ^VÚ×NÂˆBˆ™]\›ˆÝ]NÂˆBˆÙXÜž\›ØÚÌŠ]Kš[˜[^™JHÂˆÛÛœÝÛÝ\˜ÙS[™ÝH]K›[™ÝÂˆ]Y™™\ˆH\Ë˜Y™™\‹ˆY™™\“[™ÝH\Ë˜Y™™\”ÜÚ][ÛŽÂˆÛÛœÝ™\Ý[H×NÂˆ]]ˆH\Ëš]ŽÂˆ›Üˆ
]HHÈHÛÝ\˜ÙS[™ÝÈ
ÊÚJHÂˆY™™\–ØY™™\“[™ÝHH]VÚWNÂˆ
ÊØY™™\“[™ÝÂˆYˆ
Y™™\“[™ÝMŠHÂˆÛÛ[YNÂˆBˆÛÛœÝZ[ˆH\Ë—ÙXÜž\
Y™™\‹\Ë—ÚÙ^JNÂˆ›Üˆ
]ˆHÈˆMŽÈ
ÊÚŠHÂˆZ[–Ú—HH]–Ú—NÂˆBˆ]ˆHY™™\ŽÂˆ™\Ý[œ\Ú
Z[ŠNÂˆY™™\ˆH™]ÈZ[\œ˜^JMŠNÂˆY™™\“[™ÝHÂˆBˆ\Ë˜Y™™\ˆHY™™\ŽÂˆ\Ë˜Y™™\“[™ÝHY™™\“[™ÝÂˆ\Ëš]ˆH]ŽÂˆYˆ
™\Ý[›[™ÝOOH
HÂˆ™]\›ˆ™]ÈZ[\œ˜^J
NÂˆBˆ]Ý]][™ÝHMˆ
ˆ™\Ý[›[™ÝÂˆYˆ
š[˜[^™JHÂˆÛÛœÝ\Ý›ØÚÈH™\Ý[˜]
LJNÂˆ]Ó[ˆH\Ý›ØÚÖÌMWNÂˆYˆ
Ó[ˆHMŠHÂˆ›Üˆ
]HHMKZHHMˆHÓ[ŽÈHHZNÈKZJHÂˆYˆ
\Ý›ØÚÖÚWHOOHÓ[ŠHÂˆÓ[ˆHÂˆœ™XZÎÂˆBˆBˆÝ]][™ÝOHÓ[ŽÂˆ™\Ý[Ü™\Ý[›[™ÝHWHH\Ý›ØÚËœÝX˜\œ˜^JMˆHÓ[ŠNÂˆBˆBˆÛÛœÝÝ]]H™]ÈZ[\œ˜^JÝ]][™Ý
NÂˆ›Üˆ
]HHˆHZHH™\Ý[›[™ÝÈHZNÈ
ÊÚKˆ
ÏHMŠHÂˆÝ]]œÙ]
™\Ý[ÚWKŠNÂˆBˆ™]\›ˆÝ]]ÂˆBˆXÜž\›ØÚÊ]Kš[˜[^™K]ˆH[
HÂˆÛÛœÝÛÝ\˜ÙS[™ÝH]K›[™ÝÂˆÛÛœÝY™™\ˆH\Ë˜Y™™\ŽÂˆ]Y™™\“[™ÝH\Ë˜Y™™\”ÜÚ][ÛŽÂˆYˆ
]ŠHÂˆ\Ëš]ˆH]ŽÂˆH[ÙHÂˆ›Üˆ
]HHÈY™™\“[™ÝMˆ	‰ˆHÛÝ\˜ÙS[™ÝÈ
ÊÚK
ÊØY™™\“[™Ý
HÂˆY™™\–ØY™™\“[™ÝHH]VÚWNÂˆBˆYˆ
Y™™\“[™ÝMŠHÂˆ\Ë˜Y™™\“[™ÝHY™™\“[™ÝÂˆ™]\›ˆ™]ÈZ[\œ˜^J
NÂˆBˆ\Ëš]ˆHY™™\ŽÂˆ]HH]KœÝX˜\œ˜^JMŠNÂˆBˆ\Ë˜Y™™\ˆH™]ÈZ[\œ˜^JMŠNÂˆ\Ë˜Y™™\“[™ÝHÂˆ\Ë™XÜž\›ØÚÈH\Ë—ÙXÜž\›ØÚÌŽÂˆ™]\›ˆ\Ë™XÜž\›ØÚÊ]Kš[˜[^™JNÂˆBˆ[˜Üž\
]K]ŠHÂˆÛÛœÝÛÝ\˜ÙS[™ÝH]K›[™ÝÂˆ]Y™™\ˆH\Ë˜Y™™\‹ˆY™™\“[™ÝH\Ë˜Y™™\”ÜÚ][ÛŽÂˆÛÛœÝ™\Ý[H×NÂˆ]ˆH™]ÈZ[\œ˜^JMŠNÂˆ›Üˆ
]HHÈHÛÝ\˜ÙS[™ÝÈ
ÊÚJHÂˆY™™\–ØY™™\“[™ÝHH]VÚWNÂˆ
ÊØY™™\“[™ÝÂˆYˆ
Y™™\“[™ÝMŠHÂˆÛÛ[YNÂˆBˆ›Üˆ
]ˆHÈˆMŽÈ
ÊÚŠHÂˆY™™\–Ú—HH]–Ú—NÂˆBˆÛÛœÝÚ\\ˆH\Ë—Ù[˜Üž\
Y™™\‹\Ë—ÚÙ^JNÂˆ]ˆHÚ\\ŽÂˆ™\Ý[œ\Ú
Ú\\ŠNÂˆY™™\ˆH™]ÈZ[\œ˜^JMŠNÂˆY™™\“[™ÝHÂˆBˆ\Ë˜Y™™\ˆHY™™\ŽÂˆ\Ë˜Y™™\“[™ÝHY™™\“[™ÝÂˆ\Ëš]ˆH]ŽÂˆYˆ
™\Ý[›[™ÝOOH
HÂˆ™]\›ˆ™]ÈZ[\œ˜^J
NÂˆBˆÛÛœÝÝ]][™ÝHMˆ
ˆ™\Ý[›[™ÝÂˆÛÛœÝÝ]]H™]ÈZ[\œ˜^JÝ]][™Ý
NÂˆ›Üˆ
]HHˆHZHH™\Ý[›[™ÝÈHZNÈ
ÊÚKˆ
ÏHMŠHÂˆÝ]]œÙ]
™\Ý[ÚWKŠNÂˆBˆ™]\›ˆÝ]]ÂˆBŸB˜Û\ÜÈQTÌLŽÚ\\ˆ^[™ÈQTÐ˜\ÙPÚ\\ˆÂˆÜ˜ÛÛˆH™]ÈZ[\œ˜^JÌK‹LŒX‹Í‹˜ËX‹XK™‹YK˜ËŒËÍ‹MËÍK˜KŒËÙ˜KY‹ÍKLKÎKÌ‹MË™ŒKÌ‹Y‹KKMÌË‹ØËËYØKÍNØ‹K‹LŒX‹Í‹˜ËX‹XK™‹YK˜ËŒËÍ‹MËÍK˜KŒËÙ˜KY‹ÍKLKÎKÌ‹MË™ŒKÌ‹Y‹KKMÌË‹ØËËYØKÍNØ‹K‹LŒX‹Í‹˜ËX‹XK™‹YK˜ËŒËÍ‹MËÍK˜KŒËÙ˜KY‹ÍKLKÎKÌ‹MË™ŒKÌ‹Y‹KKMÌË‹ØËËYØKÍNØ‹K‹LŒX‹Í‹˜ËX‹XK™‹YK˜ËŒËÍ‹MËÍK˜KŒËÙ˜KY‹ÍKLKÎKÌ‹MË™ŒKÌ‹Y‹KKMÌË‹ØËËYØKÍNØ‹K‹LŒX‹Í‹˜ËX‹XK™‹YK˜ËŒËÍ‹MËÍK˜KŒËÙ˜KY‹ÍKLKÎKÌ‹MË™ŒKÌ‹Y‹KKMÌË‹ØËËYØKÍNØ‹JNÂˆÛÛœÝXÝÜŠÙ^JHÂˆÝ\\Š
NÂˆ\Ë—ØÞXÛ\ÓÙ”™\]][ÛˆHLÂˆ\Ë—ÚÙ^TÚ^™HHMŒÂˆ\Ë—ÚÙ^HH\Ë—Ù^[™Ù^JÙ^JNÂˆBˆÙ^[™Ù^JÚ\\’Ù^JHÂˆÛÛœÝˆHMÍŽÂˆÛÛœÝÈH\Ë—ÜÎÂˆÛÛœÝ˜ÛÛˆH\Ë—Ü˜ÛÛŽÂˆÛÛœÝ™\Ý[H™]ÈZ[\œ˜^JŠNÂˆ™\Ý[œÙ]
Ú\\’Ù^JNÂˆ›Üˆ
]ˆHM‹HHNÈˆŽÈ
ÊÚJHÂˆ]HH™\Ý[ÚˆH×NÂˆ]ˆH™\Ý[ÚˆH—NÂˆ]ÈH™\Ý[ÚˆHWNÂˆ]H™\Ý[ÚˆHNÂˆHHÖÝWNÂˆˆHÖÝ—NÂˆÈHÖÝ×NÂˆHÖÝNÂˆHH˜ÛÛ–ÚWNÂˆ›Üˆ
]ˆHÈˆÈ
ÊÛŠHÂˆ™\Ý[Ú—HHHH™\Ý[ÚˆHM—NÂˆŠÊÎÂˆ™\Ý[Ú—HHˆH™\Ý[ÚˆHM—NÂˆŠÊÎÂˆ™\Ý[Ú—HHÈH™\Ý[ÚˆHM—NÂˆŠÊÎÂˆ™\Ý[Ú—HHH™\Ý[ÚˆHM—NÂˆŠÊÎÂˆBˆBˆ™]\›ˆ™\Ý[ÂˆBŸB˜Û\ÜÈQTÌMÚ\\ˆ^[™ÈQTÐ˜\ÙPÚ\\ˆÂˆÛÛœÝXÝÜŠÙ^JHÂˆÝ\\Š
NÂˆ\Ë—ØÞXÛ\ÓÙ”™\]][ÛˆHMÂˆ\Ë—ÚÙ^TÚ^™HHŒÂˆ\Ë—ÚÙ^HH\Ë—Ù^[™Ù^JÙ^JNÂˆBˆÙ^[™Ù^JÚ\\’Ù^JHÂˆÛÛœÝˆHÂˆÛÛœÝÈH\Ë—ÜÎÂˆÛÛœÝ™\Ý[H™]ÈZ[\œ˜^JŠNÂˆ™\Ý[œÙ]
Ú\\’Ù^JNÂˆ]ˆHNÂˆ]K‹ËÂˆ›Üˆ
]ˆHÌ‹HHNÈˆŽÈ
ÊÚJHÂˆYˆ
ˆ	HÌˆOOHMŠHÂˆHHÖÝWNÂˆˆHÖÝ—NÂˆÈHÖÝ×NÂˆHÖÝNÂˆH[ÙHYˆ
ˆ	HÌˆOOH
HÂˆHH™\Ý[ÚˆH×NÂˆˆH™\Ý[ÚˆH—NÂˆÈH™\Ý[ÚˆHWNÂˆH™\Ý[ÚˆHNÂˆHHÖÝWNÂˆˆHÖÝ—NÂˆÈHÖÝ×NÂˆHÖÝNÂˆHHŽÂˆYˆ

ˆHJHHMŠHÂˆˆH
ˆˆXŠH	ˆ™ŽÂˆBˆBˆ›Üˆ
]ˆHÈˆÈ
ÊÛŠHÂˆ™\Ý[Ú—HHHH™\Ý[ÚˆHÌ—NÂˆŠÊÎÂˆ™\Ý[Ú—HHˆH™\Ý[ÚˆHÌ—NÂˆŠÊÎÂˆ™\Ý[Ú—HHÈH™\Ý[ÚˆHÌ—NÂˆŠÊÎÂˆ™\Ý[Ú—HHH™\Ý[ÚˆHÌ—NÂˆŠÊÎÂˆBˆBˆ™]\›ˆ™\Ý[ÂˆBŸB˜Û\ÜÈ˜\ÙHÂˆÚ\Ú
\ÜÝÛÜ™[œ]\Ù\ž]\ÊHÂˆ[œ™XXÚX›JXœÝ˜XÝY]ÙÚ\ÚØ[YŠNÂˆBˆÚXÚÓÝÛ™\”\ÜÝÛÜ™
\ÜÝÛÜ™ÝÛ™\•˜[Y][Û”Ø[\Ù\ž]\ËÝÛ™\”\ÜÝÛÜ™
HÂˆÛÛœÝ\Ú]HH™]ÈZ[\œ˜^J\ÜÝÛÜ™›[™Ý
ÈMŠNÂˆ\Ú]KœÙ]
\ÜÝÛÜ™
NÂˆ\Ú]KœÙ]
ÝÛ™\•˜[Y][Û”Ø[\ÜÝÛÜ™›[™Ý
NÂˆ\Ú]KœÙ]
\Ù\ž]\Ë\ÜÝÛÜ™›[™Ý
ÈÝÛ™\•˜[Y][Û”Ø[›[™Ý
NÂˆÛÛœÝ™\Ý[H\Ë—Ú\Ú
\ÜÝÛÜ™\Ú]K\Ù\ž]\ÊNÂˆ™]\›ˆ\Ð\œ˜^Q\]X[
™\Ý[ÝÛ™\”\ÜÝÛÜ™
NÂˆBˆÚXÚÕ\Ù\”\ÜÝÛÜ™
\ÜÝÛÜ™\Ù\•˜[Y][Û”Ø[\Ù\”\ÜÝÛÜ™
HÂˆÛÛœÝ\Ú]HH™]ÈZ[\œ˜^J\ÜÝÛÜ™›[™Ý
È
NÂˆ\Ú]KœÙ]
\ÜÝÛÜ™
NÂˆ\Ú]KœÙ]
\Ù\•˜[Y][Û”Ø[\ÜÝÛÜ™›[™Ý
NÂˆÛÛœÝ™\Ý[H\Ë—Ú\Ú
\ÜÝÛÜ™\Ú]K×JNÂˆ™]\›ˆ\Ð\œ˜^Q\]X[
™\Ý[\Ù\”\ÜÝÛÜ™
NÂˆBˆÙ]ÝÛ™\’Ù^J\ÜÝÛÜ™ÝÛ™\’Ù^TØ[\Ù\ž]\ËÝÛ™\‘[˜Üž\[ÛŠHÂˆÛÛœÝ\Ú]HH™]ÈZ[\œ˜^J\ÜÝÛÜ™›[™Ý
ÈMŠNÂˆ\Ú]KœÙ]
\ÜÝÛÜ™
NÂˆ\Ú]KœÙ]
ÝÛ™\’Ù^TØ[\ÜÝÛÜ™›[™Ý
NÂˆ\Ú]KœÙ]
\Ù\ž]\Ë\ÜÝÛÜ™›[™Ý
ÈÝÛ™\’Ù^TØ[›[™Ý
NÂˆÛÛœÝÙ^HH\Ë—Ú\Ú
\ÜÝÛÜ™\Ú]K\Ù\ž]\ÊNÂˆÛÛœÝÚ\\ˆH™]ÈQTÌMÚ\\ŠÙ^JNÂˆ™]\›ˆÚ\\‹™XÜž\›ØÚÊÝÛ™\‘[˜Üž\[Û‹˜[ÙK™]ÈZ[\œ˜^JMŠJNÂˆBˆÙ]\Ù\’Ù^J\ÜÝÛÜ™\Ù\’Ù^TØ[\Ù\‘[˜Üž\[ÛŠHÂˆÛÛœÝ\Ú]HH™]ÈZ[\œ˜^J\ÜÝÛÜ™›[™Ý
È
NÂˆ\Ú]KœÙ]
\ÜÝÛÜ™
NÂˆ\Ú]KœÙ]
\Ù\’Ù^TØ[\ÜÝÛÜ™›[™Ý
NÂˆÛÛœÝÙ^HH\Ë—Ú\Ú
\ÜÝÛÜ™\Ú]K×JNÂˆÛÛœÝÚ\\ˆH™]ÈQTÌMÚ\\ŠÙ^JNÂˆ™]\›ˆÚ\\‹™XÜž\›ØÚÊ\Ù\‘[˜Üž\[Û‹˜[ÙK™]ÈZ[\œ˜^JMŠJNÂˆBŸB˜Û\ÜÈŒMÈ^[™È˜\ÙHÂˆÚ\Ú
\ÜÝÛÜ™[œ]\Ù\ž]\ÊHÂˆ™]\›ˆØ[Ý[]TÒLMŠ[œ][œ]›[™Ý
NÂˆBŸB˜Û\ÜÈŒŒ^[™È˜\ÙHÂˆÚ\Ú
\ÜÝÛÜ™[œ]\Ù\ž]\ÊHÂˆ]ÈHØ[Ý[]TÒLMŠ[œ][œ]›[™Ý
KœÝX˜\œ˜^JÌŠNÂˆ]HHÌNÂˆ]HHÂˆÚ[H
HK˜]
LJHˆHHÌŠHÂˆÛÛœÝÛÛXš[™Y[™ÝH\ÜÝÛÜ™›[™Ý
ÈË›[™Ý
È\Ù\ž]\Ë›[™ÝˆÛÛXš[™Y\œ˜^HH™]ÈZ[\œ˜^JÛÛXš[™Y[™Ý
NÂˆ]Üš]SÙ™œÙ]HÂˆÛÛXš[™Y\œ˜^KœÙ]
\ÜÝÛÜ™Üš]SÙ™œÙ]
NÂˆÜš]SÙ™œÙ]
ÏH\ÜÝÛÜ™›[™ÝÂˆÛÛXš[™Y\œ˜^KœÙ]
ËÜš]SÙ™œÙ]
NÂˆÜš]SÙ™œÙ]
ÏHË›[™ÝÂˆÛÛXš[™Y\œ˜^KœÙ]
\Ù\ž]\ËÜš]SÙ™œÙ]
NÂˆÛÛœÝÌHH™]ÈZ[\œ˜^JÛÛXš[™Y[™Ý
ˆ
NÂˆ›Üˆ
]ˆHÜÈHÈˆÈŠÊËÜÈ
ÏHÛÛXš[™Y[™Ý
HÂˆÌKœÙ]
ÛÛXš[™Y\œ˜^KÜÊNÂˆBˆÛÛœÝÚ\\ˆH™]ÈQTÌLŽÚ\\ŠËœÝX˜\œ˜^JMŠJNÂˆHHÚ\\‹™[˜Üž\
ÌKËœÝX˜\œ˜^JM‹ÌŠJNÂˆÛÛœÝ™[XZ[™\ˆHX]œÝ[T™XÚ\ÙJKœÛXÙJMŠJH	HÎÂˆYˆ
™[XZ[™\ˆOOH
HÂˆÈHØ[Ý[]TÒLMŠKK›[™Ý
NÂˆH[ÙHYˆ
™[XZ[™\ˆOOHJHÂˆÈHØ[Ý[]TÒLÎ
KK›[™Ý
NÂˆH[ÙHYˆ
™[XZ[™\ˆOOHŠHÂˆÈHØ[Ý[]TÒMLLŠKK›[™Ý
NÂˆBˆJÊÎÂˆBˆ™]\›ˆËœÝX˜\œ˜^JÌŠNÂˆBŸB˜Û\ÜÈÚ\\•˜[œÙ›Ü›HÂˆØÚ\\ØXÚHH™]ÈX\

NÂˆ[X™YYš[\“˜[YHH[ÂˆÛÛœÝXÝÜŠ™\ÛÛ™PÚ\\‹Ýš[™Ñš[\“˜[YHH[Ý™X[Qš[\“˜[YHH[
HÂˆ\Ëœ™\ÛÛ™PÚ\\ˆH™\ÛÛ™PÚ\\ŽÂˆ\ËœÝ™X[Qš[\“˜[YHHÝ™X[Qš[\“˜[YNÂˆ\ËœÝš[™Ñš[\“˜[YHHÝš[™Ñš[\“˜[YNÂˆBˆÙÙ]Ú\\Šš[\“˜[YHH[
HÂˆÛÛœÝÙ^HHš[\“˜[YH[œÝ[˜Ù[Ùˆ˜[YHÈš[\“˜[YK›˜[YHˆ—×ÙY˜][×ÈŽÂˆ™]\›ˆ\ËˆØÚ\\ØXÚK™Ù]Ü’[œÙ\ÛÛ\]Y
Ù^K

HOˆ\Ëœ™\ÛÛ™PÚ\\Šš[\“˜[YJJNÂˆBˆÜ™X]TÝ™X[JÝ™X[K[™ÝÜž\š[\“˜[YHH[
HÂˆÛÛœÝY˜][š[\“˜[YHH\Ë™[X™YYš[\“˜[YH	‰ˆ\ÑXÝ
Ý™X[K™XÝ‘[X™YYš[HŠHÈ\Ë™[X™YYš[\“˜[YHˆ\ËœÝ™X[Qš[\“˜[YNÂˆÛÛœÝÚ\\ˆH\ËˆÙÙ]Ú\\ŠÜž\š[\“˜[YHY˜][š[\“˜[YJNÂˆÛÛœÝÚ\\ˆH™]ÈÚ\\Š
NÂˆ™]\›ˆ™]ÈXÜž\Ý™X[JÝ™X[K[™Ý[˜Ý[ÛˆÚ\\•˜[œÙ›Ü›QXÜž\Ý™X[J]Kš[˜[^™JHÂˆ™]\›ˆÚ\\‹™XÜž\›ØÚÊ]Kš[˜[^™JNÂˆJNÂˆBˆXÜž\Ýš[™ÊÊHÂˆÛÛœÝÚ\\ˆH\ËˆÙÙ]Ú\\Š\ËœÝš[™Ñš[\“˜[YJNÂˆÛÛœÝÚ\\ˆH™]ÈÚ\\Š
NÂˆ]]HHÝš[™ÕÐž]\ÊÊNÂˆ]HHÚ\\‹™XÜž\›ØÚÊ]KYJNÂˆ™]\›ˆž]\ÕÔÝš[™Ê]JNÂˆBˆ[˜Üž\Ýš[™ÊÊHÂˆÛÛœÝÚ\\ˆH\ËˆÙÙ]Ú\\Š\ËœÝš[™Ñš[\“˜[YJNÂˆÛÛœÝÚ\\ˆH™]ÈÚ\\Š
NÂˆYˆ
Ú\\ˆ[œÝ[˜Ù[ÙˆQTÐ˜\ÙPÚ\\ŠHÂˆÛÛœÝÝ“[ˆHË›[™ÝÂˆÛÛœÝYHMˆHÝ“[ˆ	HMŽÂˆÈ
ÏHÝš[™Ë™œ›ÛPÚ\ÛÙJY
Kœ™\X]
Y
NÂˆÛÛœÝ]ˆH™]ÈZ[\œ˜^JMŠNÂˆÜž\Ë™Ù]˜[™ÛU˜[Y\Ê]ŠNÂˆ]]HHÝš[™ÕÐž]\ÊÊNÂˆ]HHÚ\\‹™[˜Üž\
]K]ŠNÂˆÛÛœÝYˆH™]ÈZ[\œ˜^JMˆ
È]K›[™Ý
NÂˆY‹œÙ]
]ŠNÂˆY‹œÙ]
]KMŠNÂˆ™]\›ˆž]\ÕÔÝš[™ÊYŠNÂˆBˆ]]HHÝš[™ÕÐž]\ÊÊNÂˆ]HHÚ\\‹™[˜Üž\
]JNÂˆ™]\›ˆž]\ÕÔÝš[™Ê]JNÂˆBŸB™[˜Ý[Ûˆ]Ž\ÜÝÛÜ™Ðž]\Ê\ÜÝÛÜ™
HÂˆžHÂˆ\ÜÝÛÜ™H]ŽÝš[™ÕÔÝš[™Ê\ÜÝÛÜ™
NÂˆHØ]ÚÂˆØ\›ŠÚ\\•˜[œÙ›Ü›Q˜XÝÜžNˆ[˜X›HÈÛÛ™\UŽ[˜ÛÙY\ÜÝÛÜ™ˆŠNÂˆBˆ™]\›ˆÝš[™ÕÐž]\Ê\ÜÝÛÜ™
NÂŸB˜Û\ÜÈÚ\\•˜[œÙ›Ü›Q˜XÝÜžHÂˆÙš[RYÂˆÝ]XÈÙ]ÙY˜][\ÜÝÛÜ™ž]\Ê
HÂˆ™]\›ˆÚYÝÊ\Ë—ÙY˜][\ÜÝÛÜ™ž]\È‹™]ÈZ[\œ˜^JÌŽ™‹KYKKÍKKKKM‹™‹˜KK™K™K‹ŽÙK™‹ËNK™KLËŽKØWJJNÂˆBˆØÜ™X]Q[˜Üž\[Û’Ù^LŒ
™]š\Ú[Û‹\ÜÝÛÜ™ÝÛ™\”\ÜÝÛÜ™ÝÛ™\•˜[Y][Û”Ø[ÝÛ™\’Ù^TØ[Pž]\Ë\Ù\”\ÜÝÛÜ™\Ù\•˜[Y][Û”Ø[\Ù\’Ù^TØ[ÝÛ™\‘[˜Üž\[Û‹\Ù\‘[˜Üž\[Û‹\›\ÊHÂˆYˆ
\ÜÝÛÜ™
HÂˆÛÛœÝ\ÜÝÛÜ™[™ÝHX]›Z[ŠLË\ÜÝÛÜ™›[™Ý
NÂˆ\ÜÝÛÜ™H\ÜÝÛÜ™œÝX˜\œ˜^J\ÜÝÛÜ™[™Ý
NÂˆH[ÙHÂˆ\ÜÝÛÜ™H×NÂˆBˆÛÛœÝ[ÛÜš]HH™]š\Ú[ÛˆOOHˆÈ™]ÈŒŒ

Hˆ™]ÈŒMÊ
NÂˆYˆ
[ÛÜš]K˜ÚXÚÕ\Ù\”\ÜÝÛÜ™
\ÜÝÛÜ™\Ù\•˜[Y][Û”Ø[\Ù\”\ÜÝÛÜ™
JHÂˆ™]\›ˆ[ÛÜš]K™Ù]\Ù\’Ù^J\ÜÝÛÜ™\Ù\’Ù^TØ[\Ù\‘[˜Üž\[ÛŠNÂˆH[ÙHYˆ
\ÜÝÛÜ™›[™Ý	‰ˆ[ÛÜš]K˜ÚXÚÓÝÛ™\”\ÜÝÛÜ™
\ÜÝÛÜ™ÝÛ™\•˜[Y][Û”Ø[Pž]\ËÝÛ™\”\ÜÝÛÜ™
JHÂˆ™]\›ˆ[ÛÜš]K™Ù]ÝÛ™\’Ù^J\ÜÝÛÜ™ÝÛ™\’Ù^TØ[Pž]\ËÝÛ™\‘[˜Üž\[ÛŠNÂˆBˆ™]\›ˆ[ÂˆBˆÜ™\\™RÙ^Q]Jš[RY\ÜÝÛÜ™ÝÛ™\”\ÜÝÛÜ™\Ù\”\ÜÝÛÜ™›YÜË™]š\Ú[Û‹Ù^S[™Ý[˜Üž\Y]Y]JHÂˆÛÛœÝ\Ú]TÚ^™HH
ÈÝÛ™\”\ÜÝÛÜ™›[™Ý
Èš[RY›[™ÝÂˆÛÛœÝ\Ú]HH™]ÈZ[\œ˜^J\Ú]TÚ^™JNÂˆ]HHˆ‹ˆŽÂˆYˆ
\ÜÝÛÜ™
HÂˆˆHX]›Z[ŠÌ‹\ÜÝÛÜ™›[™Ý
NÂˆ›Üˆ
ÈHŽÈ
ÊÚJHÂˆ\Ú]VÚWHH\ÜÝÛÜ™ÚWNÂˆBˆBˆˆHÂˆÚ[H
HÌŠHÂˆ\Ú]VÚJÊ×HHÚ\\•˜[œÙ›Ü›Q˜XÝÜžK—ÙY˜][\ÜÝÛÜ™ž]\ÖÚŠÊ×NÂˆBˆ\Ú]KœÙ]
ÝÛ™\”\ÜÝÛÜ™JNÂˆH
ÏHÝÛ™\”\ÜÝÛÜ™›[™ÝÂˆ\Ú]VÚJÊ×HH›YÜÈ	ˆ™ŽÂˆ\Ú]VÚJÊ×HH›YÜÈˆ	ˆ™ŽÂˆ\Ú]VÚJÊ×HH›YÜÈˆMˆ	ˆ™ŽÂˆ\Ú]VÚJÊ×HH›YÜÈˆ	ˆ™ŽÂˆ\Ú]KœÙ]
š[RYJNÂˆH
ÏHš[RY›[™ÝÂˆYˆ
™]š\Ú[ÛˆH	‰ˆY[˜Üž\Y]Y]JHÂˆ\Ú]K™š[
™‹KH
È
NÂˆH
ÏHÂˆBˆ]\ÚHØ[Ý[]SQJ\Ú]KJNÂˆÛÛœÝÙ^S[™Ý[ž]\ÈHÙ^S[™ÝˆÎÂˆYˆ
™]š\Ú[ÛˆHÊHÂˆ›Üˆ
ˆHÈˆLÈ
ÊÚŠHÂˆ\ÚHØ[Ý[]SQJ\ÚÙ^S[™Ý[ž]\ÊNÂˆBˆBˆÛÛœÝ[˜Üž\[Û’Ù^HH\ÚœÝX˜\œ˜^JÙ^S[™Ý[ž]\ÊNÂˆ]Ú\\‹ÚXÚÑ]NÂˆYˆ
™]š\Ú[ÛˆHÊHÂˆHHÂˆ\Ú]KœÙ]
Ú\\•˜[œÙ›Ü›Q˜XÝÜžK—ÙY˜][\ÜÝÛÜ™ž]\ËJNÂˆH
ÏHÌŽÂˆ\Ú]KœÙ]
š[RYJNÂˆH
ÏHš[RY›[™ÝÂˆÚ\\ˆH™]ÈTÑ›Ý\Ú\\Š[˜Üž\[Û’Ù^JNÂˆÚXÚÑ]HHÚ\\‹™[˜Üž\›ØÚÊØ[Ý[]SQJ\Ú]KJJNÂˆˆH[˜Üž\[Û’Ù^K›[™ÝÂˆÛÛœÝ\š]™YÙ^HH™]ÈZ[\œ˜^JŠNÂˆ›Üˆ
ˆHNÈˆHNNÈ
ÊÚŠHÂˆ›Üˆ
]ÈHÈÈŽÈ
ÊÚÊHÂˆ\š]™YÙ^VÚ×HH[˜Üž\[Û’Ù^VÚ×HˆŽÂˆBˆÚ\\ˆH™]ÈTÑ›Ý\Ú\\Š\š]™YÙ^JNÂˆÚXÚÑ]HHÚ\\‹™[˜Üž\›ØÚÊÚXÚÑ]JNÂˆBˆH[ÙHÂˆÚ\\ˆH™]ÈTÑ›Ý\Ú\\Š[˜Üž\[Û’Ù^JNÂˆÚXÚÑ]HHÚ\\‹™[˜Üž\›ØÚÊÚ\\•˜[œÙ›Ü›Q˜XÝÜžK—ÙY˜][\ÜÝÛÜ™ž]\ÊNÂˆBˆ™]\›ˆÚXÚÑ]K™]™\žJ
]KÊHOˆ\Ù\”\ÜÝÛÜ™Ú×HOOH]JHÈ[˜Üž\[Û’Ù^Hˆ[ÂˆBˆÙXÛÙU\Ù\”\ÜÝÛÜ™
\ÜÝÛÜ™ÝÛ™\”\ÜÝÛÜ™™]š\Ú[Û‹Ù^S[™Ý
HÂˆÛÛœÝ\Ú]HH™]ÈZ[\œ˜^JÌŠNÂˆ]HHÂˆÛÛœÝˆHX]›Z[ŠÌ‹\ÜÝÛÜ™›[™Ý
NÂˆ›Üˆ
ÈHŽÈ
ÊÚJHÂˆ\Ú]VÚWHH\ÜÝÛÜ™ÚWNÂˆBˆ]ˆHÂˆÚ[H
HÌŠHÂˆ\Ú]VÚJÊ×HHÚ\\•˜[œÙ›Ü›Q˜XÝÜžK—ÙY˜][\ÜÝÛÜ™ž]\ÖÚŠÊ×NÂˆBˆ]\ÚHØ[Ý[]SQJ\Ú]KJNÂˆÛÛœÝÙ^S[™Ý[ž]\ÈHÙ^S[™ÝˆÎÂˆYˆ
™]š\Ú[ÛˆHÊHÂˆ›Üˆ
ˆHÈˆLÈ
ÊÚŠHÂˆ\ÚHØ[Ý[]SQJ\Ú\Ú›[™Ý
NÂˆBˆBˆ]Ú\\‹\Ù\”\ÜÝÛÜ™ÂˆYˆ
™]š\Ú[ÛˆHÊHÂˆ\Ù\”\ÜÝÛÜ™HÝÛ™\”\ÜÝÛÜ™ÂˆÛÛœÝ\š]™YÙ^HH™]ÈZ[\œ˜^JÙ^S[™Ý[ž]\ÊNÂˆ›Üˆ
ˆHNNÈˆHÈ‹KJHÂˆ›Üˆ
]ÈHÈÈÙ^S[™Ý[ž]\ÎÈ
ÊÚÊHÂˆ\š]™YÙ^VÚ×HH\ÚÚ×HˆŽÂˆBˆÚ\\ˆH™]ÈTÑ›Ý\Ú\\Š\š]™YÙ^JNÂˆ\Ù\”\ÜÝÛÜ™HÚ\\‹™[˜Üž\›ØÚÊ\Ù\”\ÜÝÛÜ™
NÂˆBˆH[ÙHÂˆÚ\\ˆH™]ÈTÑ›Ý\Ú\\Š\ÚœÝX˜\œ˜^JÙ^S[™Ý[ž]\ÊJNÂˆ\Ù\”\ÜÝÛÜ™HÚ\\‹™[˜Üž\›ØÚÊÝÛ™\”\ÜÝÛÜ™
NÂˆBˆ™]\›ˆ\Ù\”\ÜÝÛÜ™ÂˆBˆØZ[Øš™XÝÙ^J[KÙ[‹[˜Üž\[Û’Ù^K\ÐY\ÈH˜[ÙJHÂˆÛÛœÝˆH[˜Üž\[Û’Ù^K›[™ÝÂˆÛÛœÝÙ^HH™]ÈZ[\œ˜^Jˆ
ÈJNÂˆÙ^KœÙ]
[˜Üž\[Û’Ù^JNÂˆ]HHŽÂˆÙ^VÚJÊ×HH[H	ˆ™ŽÂˆÙ^VÚJÊ×HH[Hˆ	ˆ™ŽÂˆÙ^VÚJÊ×HH[HˆMˆ	ˆ™ŽÂˆÙ^VÚJÊ×HHÙ[ˆ	ˆ™ŽÂˆÙ^VÚJÊ×HHÙ[ˆˆ	ˆ™ŽÂˆYˆ
\ÐY\ÊHÂˆÙ^VÚJÊ×HHÌÎÂˆÙ^VÚJÊ×HHNÂˆÙ^VÚJÊ×HH˜ÎÂˆÙ^VÚJÊ×HHMÂˆBˆÛÛœÝ\ÚHØ[Ý[]SQJÙ^KJNÂˆ™]\›ˆ\ÚœÝX˜\œ˜^JX]›Z[Šˆ
ÈKMŠJNÂˆBˆÛÛœÝXÝÜŠXÝš[RY\ÜÝÛÜ™
HÂˆÛÛœÝš[\ˆHXÝ™Ù]
‘š[\ˆŠNÂˆYˆ
Z\Ó˜[YJš[\‹”Ý[™\™ŠJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ[šÛ›ÝÛˆ[˜Üž\[ÛˆY]ÙŠNÂˆBˆ\Ë™š[\“˜[YHHš[\‹›˜[YNÂˆ\Ë™XÝHXÝÂˆ\ËˆÙš[RYHš[RYÂˆÛÛœÝ[ÛÜš]HHXÝ™Ù]
•ˆŠNÂˆYˆ
S[X™\‹š\Ò[YÙ\Š[ÛÜš]JH[ÛÜš]HOOHH	‰ˆ[ÛÜš]HOOHˆ	‰ˆ[ÛÜš]HOOH	‰ˆ[ÛÜš]HOOHJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ[œÝ\ÜY[˜Üž\[Ûˆ[ÛÜš]HŠNÂˆBˆ\Ë˜[ÛÜš]HH[ÛÜš]NÂˆ]Ù^S[™ÝHXÝ™Ù]
“[™ÝŠNÂˆYˆ
ZÙ^S[™Ý
HÂˆYˆ
[ÛÜš]HHÊHÂˆÙ^S[™ÝHÂˆH[ÙHÂˆÛÛœÝÙ‘XÝHXÝ™Ù]
ÑˆŠNÂˆÛÛœÝÝ™X[PÜž\Ó˜[YHHXÝ™Ù]
”ÝQˆŠNÂˆYˆ
Ù‘XÝ[œÝ[˜Ù[ÙˆXÝ	‰ˆÝ™X[PÜž\Ó˜[YH[œÝ[˜Ù[Ùˆ˜[YJHÂˆÙ‘XÝœÝ\™\ÜÑ[˜Üž\[ÛˆHYNÂˆÛÛœÝ[™\‘XÝHÙ‘XÝ™Ù]
Ý™X[PÜž\Ó˜[YK›˜[YJNÂˆÙ^S[™ÝH[™\‘XÝË™Ù]
“[™ÝŠHLŽÂˆYˆ
Ù^S[™Ý
HÂˆÙ^S[™ÝHÎÂˆBˆBˆBˆBˆYˆ
S[X™\‹š\Ò[YÙ\ŠÙ^S[™Ý
HÙ^S[™ÝÙ^S[™Ý	HOOH
HÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠš[˜[YÙ^H[™ÝŠNÂˆBˆ]ÙˆH[Âˆ]ÝYˆH˜[YK™Ù]
’Y[]HŠNÂˆ]Ý™ˆH˜[YK™Ù]
’Y[]HŠNÂˆ]Y™ˆHÝYŽÂˆYˆ
[ÛÜš]HH
HÂˆÙˆHXÝ™Ù]
ÑˆŠNÂˆYˆ
Ùˆ[œÝ[˜Ù[ÙˆXÝ
HÂˆÙ‹œÝ\™\ÜÑ[˜Üž\[ÛˆHYNÂˆBˆÝYˆHXÝ™Ù]
”ÝQˆŠH˜[YK™Ù]
’Y[]HŠNÂˆÝ™ˆHXÝ™Ù]
”Ý‘ˆŠH˜[YK™Ù]
’Y[]HŠNÂˆY™ˆHXÝ™Ù]
‘Q‘ˆŠHÝYŽÂˆBˆ\Ë˜ÙˆHÙŽÂˆ\ËœÝYˆHÝYŽÂˆ\ËœÝ™ˆHÝ™ŽÂˆ\Ë™Y™ˆHY™ŽÂˆÛÛœÝÝÛ™\ž]\ÈHÝš[™ÕÐž]\ÊXÝ™Ù]
“ÈŠJKˆ\Ù\ž]\ÈHÝš[™ÕÐž]\ÊXÝ™Ù]
•HŠJNÂˆÛÛœÝÝÛ™\”\ÜÝÛÜ™HÝÛ™\ž]\ËœÝX˜\œ˜^JÌŠNÂˆÛÛœÝ\Ù\”\ÜÝÛÜ™H\Ù\ž]\ËœÝX˜\œ˜^JÌŠNÂˆÛÛœÝ›YÜÈHXÝ™Ù]
”ŠNÂˆÛÛœÝ™]š\Ú[ÛˆHXÝ™Ù]
”ˆŠNÂˆÛÛœÝ[˜Üž\Y]Y]HH
[ÛÜš]HOOH[ÛÜš]HOOHJH	‰ˆXÝ™Ù]
‘[˜Üž\Y]Y]HŠHOOH˜[ÙNÂˆ\Ë™[˜Üž\Y]Y]HH[˜Üž\Y]Y]NÂˆÛÛœÝš[RYž]\ÈHÝš[™ÕÐž]\Êš[RY
NÂˆ]\ÜÝÛÜ™ž]\Ë˜]Ô\ÜÝÛÜ™ž]\ÎÂˆYˆ
\ÜÝÛÜ™
HÂˆYˆ
™]š\Ú[ÛˆOOHŠHÂˆÛÛœÝ™\Y\ÜÝÛÜ™HØ\Û™\
\ÜÝÛÜ™
NÂˆ\ÜÝÛÜ™ž]\ÈH]Ž\ÜÝÛÜ™Ðž]\Ê™\Y\ÜÝÛÜ™
NÂˆYˆ
™\Y\ÜÝÛÜ™OOH\ÜÝÛÜ™
HÂˆ˜]Ô\ÜÝÛÜ™ž]\ÈH]Ž\ÜÝÛÜ™Ðž]\Ê\ÜÝÛÜ™
NÂˆBˆH[ÙHYˆ
[ÛÜš]HOOHJHÂˆ\ÜÝÛÜ™ž]\ÈH]Ž\ÜÝÛÜ™Ðž]\Ê\ÜÝÛÜ™
NÂˆH[ÙHÂˆ\ÜÝÛÜ™ž]\ÈHÝš[™ÕÐž]\Ê\ÜÝÛÜ™
NÂˆBˆBˆ][˜Üž\[Û’Ù^NÂˆYˆ
[ÛÜš]HOOHJHÂˆ[˜Üž\[Û’Ù^HH\ËˆÜ™\\™RÙ^Q]Jš[RYž]\Ë\ÜÝÛÜ™ž]\ËÝÛ™\”\ÜÝÛÜ™\Ù\”\ÜÝÛÜ™›YÜË™]š\Ú[Û‹Ù^S[™Ý[˜Üž\Y]Y]JNÂˆH[ÙHÂˆÛÛœÝÝÛ™\•˜[Y][Û”Ø[HÝÛ™\ž]\ËœÝX˜\œ˜^JÌ‹
NÂˆÛÛœÝÝÛ™\’Ù^TØ[HÝÛ™\ž]\ËœÝX˜\œ˜^J
NÂˆÛÛœÝPž]\ÈH\Ù\ž]\ËœÝX˜\œ˜^J
NÂˆÛÛœÝ\Ù\•˜[Y][Û”Ø[H\Ù\ž]\ËœÝX˜\œ˜^JÌ‹
NÂˆÛÛœÝ\Ù\’Ù^TØ[H\Ù\ž]\ËœÝX˜\œ˜^J
NÂˆÛÛœÝÝÛ™\‘[˜Üž\[ÛˆHÝš[™ÕÐž]\ÊXÝ™Ù]
“ÑHŠJNÂˆÛÛœÝ\Ù\‘[˜Üž\[ÛˆHÝš[™ÕÐž]\ÊXÝ™Ù]
•QHŠJNÂˆÛÛœÝ\›\ÈHÝš[™ÕÐž]\ÊXÝ™Ù]
”\›\ÈŠJNÂˆ›Üˆ
ÛÛœÝØ[™Y]HÙˆ˜]Ô\ÜÝÛÜ™ž]\ÈÈÜ\ÜÝÛÜ™ž]\Ë˜]Ô\ÜÝÛÜ™ž]\×HˆÜ\ÜÝÛÜ™ž]\×JHÂˆ[˜Üž\[Û’Ù^HH\ËˆØÜ™X]Q[˜Üž\[Û’Ù^LŒ
™]š\Ú[Û‹Ø[™Y]KÝÛ™\”\ÜÝÛÜ™ÝÛ™\•˜[Y][Û”Ø[ÝÛ™\’Ù^TØ[Pž]\Ë\Ù\”\ÜÝÛÜ™\Ù\•˜[Y][Û”Ø[\Ù\’Ù^TØ[ÝÛ™\‘[˜Üž\[Û‹\Ù\‘[˜Üž\[Û‹\›\ÊNÂˆYˆ
[˜Üž\[Û’Ù^JHÂˆœ™XZÎÂˆBˆBˆBˆYˆ
Y[˜Üž\[Û’Ù^JHÂˆYˆ
\\ÜÝÛÜ™
HÂˆYˆ
\Ë˜[ÛÜš]HH	‰ˆ\Ó˜[YJ\ËœÝY‹’Y[]HŠH	‰ˆ\Ó˜[YJ\ËœÝ™‹’Y[]HŠJHÂˆÛÛœÝY™ÑˆH\Ë˜ÙË™Ù]
\Ë™Y™‹›˜[YJNÂˆÛÛœÝ]]]™[HY™ÑË™Ù]
]]]™[ŠNÂˆYˆ
\Ó˜[YJ]]]™[‘Q“Ü[ˆŠJHÂˆ\Ë™[˜Üž\[Û’Ù^HH[Âˆ™]\›ŽÂˆBˆBˆ›ÝÈ™]È\ÜÝÛÜ™^Ù\[ÛŠ“›È\ÜÝÛÜ™Ú]™[ˆ‹\ÜÝÛÜ™™\ÜÛœÙ\Ë“‘QQÔTÔÕÓÔ‘
NÂˆBˆÛÛœÝXÛÙY\ÜÝÛÜ™H\ËˆÙXÛÙU\Ù\”\ÜÝÛÜ™
\ÜÝÛÜ™ž]\ËÝÛ™\”\ÜÝÛÜ™™]š\Ú[Û‹Ù^S[™Ý
NÂˆ[˜Üž\[Û’Ù^HH\ËˆÜ™\\™RÙ^Q]Jš[RYž]\ËXÛÙY\ÜÝÛÜ™ÝÛ™\”\ÜÝÛÜ™\Ù\”\ÜÝÛÜ™›YÜË™]š\Ú[Û‹Ù^S[™Ý[˜Üž\Y]Y]JNÂˆBˆYˆ
Y[˜Üž\[Û’Ù^JHÂˆ›ÝÈ™]È\ÜÝÛÜ™^Ù\[ÛŠ’[˜ÛÜœ™XÝ\ÜÝÛÜ™‹\ÜÝÛÜ™™\ÜÛœÙ\Ë’SÓÔ”‘PÕÔTÔÕÓÔ‘
NÂˆBˆYˆ
[ÛÜš]HOOH	‰ˆ[˜Üž\[Û’Ù^K›[™ÝMŠHÂˆ\Ë™[˜Üž\[Û’Ù^HH™]ÈZ[\œ˜^JMŠNÂˆ\Ë™[˜Üž\[Û’Ù^KœÙ]
[˜Üž\[Û’Ù^JNÂˆH[ÙHÂˆ\Ë™[˜Üž\[Û’Ù^HH[˜Üž\[Û’Ù^NÂˆBˆBˆÙ]\ÜÝÛÜ™
\ÜÝÛÜ™
HÂˆÛÛœÝ˜[œÙ›Ü›HH™]ÈÚ\\•˜[œÙ›Ü›Q˜XÝÜžJ\Ë™XÝ\ËˆÙš[RY\ÜÝÛÜ™
NÂˆ\Ë™[˜Üž\[Û’Ù^HH˜[œÙ›Ü›K™[˜Üž\[Û’Ù^NÂˆBˆÜ™X]PÚ\\•˜[œÙ›Ü›J[KÙ[ŠHÂˆYˆ
\Ë˜[ÛÜš]HOOH\Ë˜[ÛÜš]HOOHJHÂˆÛÛœÝ™\ÛÛ™PÚ\\ˆHš[\“˜[YHOˆÂˆYˆ
Jš[\“˜[YH[œÝ[˜Ù[Ùˆ˜[YJJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[YÜž\š[\ˆ˜[YKˆŠNÂˆBˆÛÛœÝÜž\š[\ˆH\Ë˜Ù‹™Ù]
š[\“˜[YK›˜[YJNÂˆÛÛœÝÙ›HHÜž\š[\Ë™Ù]
Ñ“HŠNÂˆYˆ
XÙ›HÙ›K›˜[YHOOH“›Û™HŠHÂˆ™]\›ˆ[Ú\\ŽÂˆBˆYˆ
]\Ë™[˜Üž\[Û’Ù^JHÂˆ›ÝÈ™]È\ÜÝÛÜ™^Ù\[ÛŠ“›È\ÜÝÛÜ™Ú]™[ˆ‹\ÜÝÛÜ™™\ÜÛœÙ\Ë“‘QQÔTÔÕÓÔ‘
NÂˆBˆYˆ
\Ë˜[ÛÜš]HOOHHÙ›K›˜[YHOOHQTÕŒÈŠHÂˆ™]\›ˆQTÌMÚ\\‹˜š[™
[\Ë™[˜Üž\[Û’Ù^JNÂˆBˆYˆ
Ù›K›˜[YHOOH•ŒˆŠHÂˆ™]\›ˆTÑ›Ý\Ú\\‹˜š[™
[\ËˆØZ[Øš™XÝÙ^J[KÙ[‹\Ë™[˜Üž\[Û’Ù^K˜[ÙJJNÂˆBˆYˆ
Ù›K›˜[YHOOHQTÕŒˆŠHÂˆ™]\›ˆQTÌLŽÚ\\‹˜š[™
[\ËˆØZ[Øš™XÝÙ^J[KÙ[‹\Ë™[˜Üž\[Û’Ù^KYJJNÂˆBˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ•[šÛ›ÝÛˆÜž\ÈY]ÙŠNÂˆNÂˆÛÛœÝ˜[œÙ›Ü›HH™]ÈÚ\\•˜[œÙ›Ü›J™\ÛÛ™PÚ\\‹\ËœÝ™‹\ËœÝYŠNÂˆ˜[œÙ›Ü›K™[X™YYš[\“˜[YHH\Ë™Y™ŽÂˆ™]\›ˆ˜[œÙ›Ü›NÂˆBˆÛÛœÝ™\ÛÛ™PÚ\\ˆH

HOˆTÑ›Ý\Ú\\‹˜š[™
[\ËˆØZ[Øš™XÝÙ^J[KÙ[‹\Ë™[˜Üž\[Û’Ù^K˜[ÙJJNÂˆ™]\›ˆ™]ÈÚ\\•˜[œÙ›Ü›J™\ÛÛ™PÚ\\ŠNÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÞ™Y‹šœÂ‚‚‚‚‚‚˜Û\ÜÈ™YˆÂˆØØXÚSX\H™]ÈX\

NÂˆÙ[šY\ÈH×NÂˆÛ™]Ô\œÚ\Ý[™Y“[HH[ÂˆÛ™]Õ[\Ü˜\žT™Y“[HH[ÂˆÜ\œÙYÚ]™XÛÝ™\žHH˜[ÙNÂˆÜ[™[™Ô™YœÈH™]È™Y”Ù]

NÂˆÜ\œÚ\Ý[™YœÐØXÚHH[ÂˆÞ™Y”ÙXÝ[Û“Ù™œÙ]ÈH™]ÈÙ]

NÂˆÞ™Y”ÙXÝ[ÛœÐÛÛ\]HHYNÂˆÞ™Y”Ý\ÈH™]ÈÙ]

NÂˆÛÛœÝXÝÜŠÝ™X[K“X[˜YÙ\ŠHÂˆ\ËœÝ™X[HHÝ™X[NÂˆ\Ëœ“X[˜YÙ\ˆH“X[˜YÙ\ŽÂˆBˆÙ]™]Ô\œÚ\Ý[™YŠØšŠHÂˆYˆ
\ËˆÛ™]Ô\œÚ\Ý[™Y“[HOOH[
HÂˆ\ËˆÛ™]Ô\œÚ\Ý[™Y“[HH\ËˆÙ[šY\Ë›[™ÝNÂˆBˆÛÛœÝ[HH\ËˆÛ™]Ô\œÚ\Ý[™Y“[JÊÎÂˆ\ËˆØØXÚSX\œÙ]
[KØšŠNÂˆ™]\›ˆ™Y‹™Ù]
[K
NÂˆBˆÙ]™]Õ[\Ü˜\žT™YŠ
HÂˆYˆ
\ËˆÛ™]Õ[\Ü˜\žT™Y“[HOOH[
HÂˆ\ËˆÛ™]Õ[\Ü˜\žT™Y“[HH\ËˆÙ[šY\Ë›[™ÝNÂˆYˆ
\ËˆÛ™]Ô\œÚ\Ý[™Y“[JHÂˆ\ËˆÜ\œÚ\Ý[™YœÐØXÚHH™]ÈX\

NÂˆ›Üˆ
]HH\ËˆÛ™]Õ[\Ü˜\žT™Y“[NÈH\ËˆÛ™]Ô\œÚ\Ý[™Y“[NÈJÊÊHÂˆ\ËˆÜ\œÚ\Ý[™YœÐØXÚKœÙ]
K\ËˆØØXÚSX\™Ù]
JJNÂˆ\ËˆØØXÚSX\™[]JJNÂˆBˆBˆBˆ™]\›ˆ™Y‹™Ù]
\ËˆÛ™]Õ[\Ü˜\žT™Y“[JÊË
NÂˆBˆ™\Ù]™]Õ[\Ü˜\žT™YŠ
HÂˆ\ËˆÛ™]Õ[\Ü˜\žT™Y“[HH[ÂˆYˆ
\ËˆÜ\œÚ\Ý[™YœÐØXÚJHÂˆ›Üˆ
ÛÛœÝÛ[KØš—HÙˆ\ËˆÜ\œÚ\Ý[™YœÐØXÚJHÂˆ\ËˆØØXÚSX\œÙ]
[KØšŠNÂˆBˆBˆ\ËˆÜ\œÚ\Ý[™YœÐØXÚHH[ÂˆBˆÙ]Ý\™YŠÝ\™YŠHÂˆ\ËœÝ\™Y”]Y]YHHÜÝ\™Y—NÂˆBˆ\œÙJ™XÛÝ™\žS[ÙHH˜[ÙJHÂˆ\ËˆÜ\œÙYÚ]™XÛÝ™\žHH™XÛÝ™\žS[ÙNÂˆ]˜Z[\‘XÝÂˆYˆ
\™XÛÝ™\žS[ÙJHÂˆ˜Z[\‘XÝH\Ëœ™XY™YŠ
NÂˆH[ÙHÂˆØ\›Š’[™^[™È[ˆØš™XÝÈŠNÂˆ˜Z[\‘XÝH\Ëš[™^Øš™XÝÊ
NÂˆBˆ˜Z[\‘XÝ˜\ÜÚYÛ–™YŠ\ÊNÂˆ\Ë˜Z[\ˆH˜Z[\‘XÝÂˆ][˜Üž\ÂˆžHÂˆ[˜Üž\H˜Z[\‘XÝ™Ù]
‘[˜Üž\ŠNÂˆHØ]Ú
^
HÂˆYˆ
^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈ^ÂˆBˆØ\›Š™Y‹œ\œÙHH[˜[Y‘[˜Üž\ˆ™Y™\™[˜ÙNˆ‰Ù^H‹˜
NÂˆBˆYˆ
[˜Üž\[œÝ[˜Ù[ÙˆXÝ
HÂˆÛÛœÝYÈH˜Z[\‘XÝ™Ù]
’QŠNÂˆÛÛœÝš[RYHYÏË›[™ÝÈYÖÌHˆˆŽÂˆ[˜Üž\œÝ\™\ÜÑ[˜Üž\[ÛˆHYNÂˆ\Ë™[˜Üž\H™]ÈÚ\\•˜[œÙ›Ü›Q˜XÝÜžJ[˜Üž\š[RY\Ëœ“X[˜YÙ\‹œ\ÜÝÛÜ™
NÂˆBˆ]›ÛÝÂˆžHÂˆ›ÛÝH˜Z[\‘XÝ™Ù]
”›ÛÝŠNÂˆHØ]Ú
^
HÂˆYˆ
^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈ^ÂˆBˆØ\›Š™Y‹œ\œÙHH[˜[Y”›ÛÝˆ™Y™\™[˜ÙNˆ‰Ù^H‹˜
NÂˆBˆYˆ
›ÛÝ[œÝ[˜Ù[ÙˆXÝ
HÂˆžHÂˆÛÛœÝYÙ\ÈH›ÛÝ™Ù]
”YÙ\ÈŠNÂˆYˆ
YÙ\È[œÝ[˜Ù[ÙˆXÝ
HÂˆ\Ëœ›ÛÝH›ÛÝÂˆ™]\›ŽÂˆBˆHØ]Ú
^
HÂˆYˆ
^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈ^ÂˆBˆØ\›Š™Y‹œ\œÙHH[˜[Y”YÙ\Èˆ™Y™\™[˜ÙNˆ‰Ù^H‹˜
NÂˆBˆBˆYˆ
\™XÛÝ™\žS[ÙJHÂˆ›ÝÈ™]È™Y”\œÙQ^Ù\[ÛŠ
NÂˆBˆ›ÝÈ™]È[˜[Y‘^Ù\[ÛŠ’[˜[Y›ÛÝ™Y™\™[˜ÙKˆŠNÂˆBˆ›ØÙ\ÜÖ™Y•X›J\œÙ\ŠHÂˆ\Ë—ÝX›TÝ]HÏÏHÂˆ[žS[NˆˆÝ™X[TÜÎˆ\œÙ\‹›^\‹œÝ™X[KœÜËˆ\œÙ\YŒNˆ\œÙ\‹˜YŒKˆ\œÙ\YŒŽˆ\œÙ\‹˜YŒ‚ˆNÂˆÛÛœÝØšˆH\Ëœ™XY™Y•X›J\œÙ\ŠNÂˆYˆ
Z\ÐÛY
Øš‹˜Z[\ˆŠJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™YˆX›NˆÛÝ[›Ýš[™˜Z[\ˆXÝ[Û˜\žHŠNÂˆBˆ]XÝH\œÙ\‹™Ù]ØšŠ
NÂˆYˆ
XÝ[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆXÝHXÝ™XÝÂˆBˆYˆ
JXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™YˆX›NˆÛÝ[›Ý\œÙH˜Z[\ˆXÝ[Û˜\žHŠNÂˆBˆ[]H\Ë—ÝX›TÝ]NÂˆ™]\›ˆXÝÂˆBˆ™XY™Y•X›J\œÙ\ŠHÂˆÛÛœÝÝ™X[HH\œÙ\‹›^\‹œÝ™X[NÂˆÛÛœÝX›TÝ]HH\Ë—ÝX›TÝ]NÂˆÝ™X[KœÜÈHX›TÝ]KœÝ™X[TÜÎÂˆ\œÙ\‹˜YŒHHX›TÝ]Kœ\œÙ\YŒNÂˆ\œÙ\‹˜YŒˆHX›TÝ]Kœ\œÙ\YŒŽÂˆ]ØšŽÂˆÚ[H
YJHÂˆYˆ
J™š\œÝ[žS[Hˆ[ˆX›TÝ]JHJ™[žPÛÝ[ˆ[ˆX›TÝ]JJHÂˆYˆ
\ÐÛY
ØšˆH\œÙ\‹™Ù]ØšŠ
K˜Z[\ˆŠJHÂˆœ™XZÎÂˆBˆX›TÝ]K™š\œÝ[žS[HHØšŽÂˆX›TÝ]K™[žPÛÝ[H\œÙ\‹™Ù]ØšŠ
NÂˆBˆ]š\œÝHX›TÝ]K™š\œÝ[žS[NÂˆÛÛœÝÛÝ[HX›TÝ]K™[žPÛÝ[ÂˆYˆ
S[X™\‹š\Ò[YÙ\Šš\œÝ
HS[X™\‹š\Ò[YÙ\ŠÛÝ[
JHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™YˆX›NˆÜ›Û™È\\È[ˆÝXœÙXÝ[ÛˆXY\ˆŠNÂˆBˆ›Üˆ
]HHX›TÝ]K™[žS[NÈHÛÝ[ÈJÊÊHÂˆX›TÝ]KœÝ™X[TÜÈHÝ™X[KœÜÎÂˆX›TÝ]K™[žS[HHNÂˆX›TÝ]Kœ\œÙ\YŒHH\œÙ\‹˜YŒNÂˆX›TÝ]Kœ\œÙ\YŒˆH\œÙ\‹˜YŒŽÂˆÛÛœÝ[žHHÂˆÙ™œÙ]ˆ\œÙ\‹™Ù]ØšŠ
KˆÙ[Žˆ\œÙ\‹™Ù]ØšŠ
Kˆœ™YNˆ˜[ÙKˆ[˜ÛÛ\™\ÜÙYˆ˜[ÙBˆNÂˆÛÛœÝ\HH\œÙ\‹™Ù]ØšŠ
NÂˆYˆ
\H[œÝ[˜Ù[ÙˆÛY
HÂˆÝÚ]Ú
\K˜ÛY
HÂˆØ\ÙH™ˆŽ‚ˆ[žK™œ™YHHYNÂˆœ™XZÎÂˆØ\ÙH›ˆŽ‚ˆ[žK[˜ÛÛ\™\ÜÙYHYNÂˆœ™XZÎÂˆBˆBˆYˆ
S[X™\‹š\Ò[YÙ\Š[žK›Ù™œÙ]
HS[X™\‹š\Ò[YÙ\Š[žK™Ù[ŠHJ[žK™œ™YH[žK[˜ÛÛ\™\ÜÙY
JHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ[˜[Y[žH[ˆ™YˆÝXœÙXÝ[ÛŽˆ	Ùš\œÝK	ØÛÝ[X
NÂˆBˆYˆ
HOOH	‰ˆ[žK™œ™YH	‰ˆš\œÝOOHJHÂˆš\œÝHÂˆBˆ\ËˆÙ[šY\ÖÙš\œÝ
ÈWHÏÏH[žNÂˆBˆX›TÝ]K™[žS[HHÂˆX›TÝ]KœÝ™X[TÜÈHÝ™X[KœÜÎÂˆX›TÝ]Kœ\œÙ\YŒHH\œÙ\‹˜YŒNÂˆX›TÝ]Kœ\œÙ\YŒˆH\œÙ\‹˜YŒŽÂˆ[]HX›TÝ]K™š\œÝ[žS[NÂˆ[]HX›TÝ]K™[žPÛÝ[ÂˆBˆYˆ
\ËˆÙ[šY\ÖÌH	‰ˆ]\ËˆÙ[šY\ÖÌK™œ™YJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™YˆX›Nˆ[™^XÝYš\œÝØš™XÝŠNÂˆBˆ™]\›ˆØšŽÂˆBˆ›ØÙ\ÜÖ™Y”Ý™X[JÝ™X[JHÂˆYˆ
JœÝ™X[TÝ]Hˆ[ˆ\ÊJHÂˆÛÛœÝÂˆXÝˆÜÂˆHHÝ™X[NÂˆÛÛœÝž]UÚYÈHXÝ™Ù]
•ÈŠNÂˆÛÛœÝ˜[™ÙHHXÝ™Ù]
’[™^ŠHÌXÝ™Ù]
”Ú^™HŠWNÂˆ\ËœÝ™X[TÝ]HHÂˆ[žT˜[™Ù\Îˆ˜[™ÙKˆž]UÚYËˆ[žS[NˆˆÝ™X[TÜÎˆÜÂˆNÂˆBˆ\Ëœ™XY™Y”Ý™X[JÝ™X[JNÂˆ[]H\ËœÝ™X[TÝ]NÂˆ™]\›ˆÝ™X[K™XÝÂˆBˆ™XY™Y”Ý™X[JÝ™X[JHÂˆÛÛœÝÝ™X[TÝ]HH\ËœÝ™X[TÝ]NÂˆÝ™X[KœÜÈHÝ™X[TÝ]KœÝ™X[TÜÎÂˆÛÛœÝÝ\QšY[ÚYÙ™œÙ]šY[ÚYÙ[™\˜][Û‘šY[ÚYHHÝ™X[TÝ]K˜ž]UÚYÎÂˆÛÛœÝ[žT˜[™Ù\ÈHÝ™X[TÝ]K™[žT˜[™Ù\ÎÂˆÚ[H
[žT˜[™Ù\Ë›[™Ýˆ
HÂˆÛÛœÝÙš\œÝ—HH[žT˜[™Ù\ÎÂˆYˆ
S[X™\‹š\Ò[YÙ\Šš\œÝ
HS[X™\‹š\Ò[YÙ\ŠŠJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ[˜[Y™Yˆ˜[™ÙHšY[Îˆ	Ùš\œÝK	ÛŸX
NÂˆBˆYˆ
S[X™\‹š\Ò[YÙ\Š\QšY[ÚY
HS[X™\‹š\Ò[YÙ\ŠÙ™œÙ]šY[ÚY
HS[X™\‹š\Ò[YÙ\ŠÙ[™\˜][Û‘šY[ÚY
JHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ[˜[Y™Yˆ[žHšY[È[™Ýˆ	Ùš\œÝK	ÛŸX
NÂˆBˆ›Üˆ
]HHÝ™X[TÝ]K™[žS[NÈHŽÈ
ÊÚJHÂˆÝ™X[TÝ]K™[žS[HHNÂˆÝ™X[TÝ]KœÝ™X[TÜÈHÝ™X[KœÜÎÂˆ]\HHˆÙ™œÙ]HˆÙ[™\˜][ÛˆHÂˆ›Üˆ
]ˆHÈˆ\QšY[ÚYÈ
ÊÚŠHÂˆÛÛœÝ\Pž]HHÝ™X[K™Ù]ž]J
NÂˆYˆ
\Pž]HOOHLJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™Yˆž]UÚYÈ	Ý\IËˆŠNÂˆBˆ\HH\H\Pž]NÂˆBˆYˆ
\QšY[ÚYOOH
HÂˆ\HHNÂˆBˆ›Üˆ
]ˆHÈˆÙ™œÙ]šY[ÚYÈ
ÊÚŠHÂˆÛÛœÝÙ™œÙ]ž]HHÝ™X[K™Ù]ž]J
NÂˆYˆ
Ù™œÙ]ž]HOOHLJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™Yˆž]UÚYÈ	ÛÙ™œÙ]	ËˆŠNÂˆBˆÙ™œÙ]HÙ™œÙ]Ù™œÙ]ž]NÂˆBˆ›Üˆ
]ˆHÈˆÙ[™\˜][Û‘šY[ÚYÈ
ÊÚŠHÂˆÛÛœÝÙ[™\˜][Ûž]HHÝ™X[K™Ù]ž]J
NÂˆYˆ
Ù[™\˜][Ûž]HOOHLJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™Yˆž]UÚYÈ	ÙÙ[™\˜][Û‰ËˆŠNÂˆBˆÙ[™\˜][ÛˆHÙ[™\˜][ÛˆÙ[™\˜][Ûž]NÂˆBˆÛÛœÝ[žHHÂˆÙ™œÙ]ˆÙ[ŽˆÙ[™\˜][Û‹ˆœ™YNˆ˜[ÙKˆ[˜ÛÛ\™\ÜÙYˆ˜[ÙBˆNÂˆÝÚ]Ú
\JHÂˆØ\ÙH‚ˆ[žK™œ™YHHYNÂˆœ™XZÎÂˆØ\ÙHN‚ˆ[žK[˜ÛÛ\™\ÜÙYHYNÂˆœ™XZÎÂˆØ\ÙHŽ‚ˆœ™XZÎÂˆY˜][‚ˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ[˜[Y™Yˆ[žH\Nˆ	Ý\_X
NÂˆBˆ\ËˆÙ[šY\ÖÙš\œÝ
ÈWHÏÏH[žNÂˆBˆÝ™X[TÝ]K™[žS[HHÂˆÝ™X[TÝ]KœÝ™X[TÜÈHÝ™X[KœÜÎÂˆ[žT˜[™Ù\ËœÜXÙJŠNÂˆBˆBˆ[™^Øš™XÝÊ
HÂˆÛÛœÝPˆHKˆˆHKˆÔˆHˆÔPÑHHŒÂˆÛÛœÝTÑS•HKˆHØÎÂˆ[˜Ý[Ûˆ™XYÚÙ[Š]KÙ™œÙ]
HÂˆ]ÚÙ[ˆHˆ‹ˆÚH]VÛÙ™œÙ]NÂˆÚ[H
ÚOOHˆ	‰ˆÚOOHÔˆ	‰ˆÚOOH
HÂˆYˆ

ÊÛÙ™œÙ]H]K›[™Ý
HÂˆœ™XZÎÂˆBˆÚÙ[ˆ
ÏHÝš[™Ë™œ›ÛPÚ\ÛÙJÚ
NÂˆÚH]VÛÙ™œÙ]NÂˆBˆ™]\›ˆÚÙ[ŽÂˆBˆ[˜Ý[ÛˆÚÚ\[[
]KÙ™œÙ]Ú]
HÂˆÛÛœÝ[™ÝHÚ]›[™Ýˆ]S[™ÝH]K›[™ÝÂˆ]ÚÚ\YHÂˆÚ[H
Ù™œÙ]]S[™Ý
HÂˆ]HHÂˆÚ[H
H[™Ý	‰ˆ]VÛÙ™œÙ]
ÈWHOOHÚ]ÚWJHÂˆ
ÊÚNÂˆBˆYˆ
HH[™Ý
HÂˆœ™XZÎÂˆBˆÙ™œÙ]
ÊÎÂˆÚÚ\Y
ÊÎÂˆBˆ™]\›ˆÚÚ\YÂˆBˆÛÛœÝÑ[™Øš”™YÑ^H×Š[™ØšŸ
×Ê×
×ÊÛØšŸ™YŸ˜Z[\—Ê
W‹ÙÎÂˆÛÛœÝÔÝ\™Y”™YÑ^H×ŠÝ\™YŸ
×Ê×
×ÊÛØšŠW‹ÙÎÂˆÛÛœÝØš”™YÑ^H×Š
ÊWÊÊ
ÊWÊÛØš—‹ÎÂˆÛÛœÝ˜Z[\ž]\ÈH™]ÈZ[\œ˜^JÌLM‹LMMËLKLLKLMJNÂˆÛÛœÝÝ\™Yž]\ÈH™]ÈZ[\œ˜^JÌLMKLM‹MËLMLM‹LŒLMLKL—JNÂˆÛÛœÝ™Yž]\ÈH™]ÈZ[\œ˜^JÍË‹LKL—JNÂˆ\ËˆÙ[šY\Ë›[™ÝHÂˆ\ËˆØØXÚSX\˜ÛX\Š
NÂˆÛÛœÝÝ™X[HH\ËœÝ™X[NÂˆÝ™X[KœÜÈHÂˆÛÛœÝY™™\ˆHÝ™X[K™Ù]ž]\Ê
KˆY™™\”ÝˆHž]\ÕÔÝš[™ÊY™™\ŠKˆ[™ÝHY™™\‹›[™ÝÂˆ]ÜÚ][ÛˆHÝ™X[KœÝ\ÂˆÛÛœÝ˜Z[\œÈH×Kˆ™Y”Ý\ÈH×NÂˆÚ[H
ÜÚ][Ûˆ[™Ý
HÂˆ]ÚHY™™\–ÜÜÚ][Û—NÂˆYˆ
ÚOOHPˆÚOOHˆÚOOHÔˆÚOOHÔPÑJHÂˆ
ÊÜÜÚ][ÛŽÂˆÛÛ[YNÂˆBˆYˆ
ÚOOHTÑS•
HÂˆÈÂˆ
ÊÜÜÚ][ÛŽÂˆYˆ
ÜÚ][ÛˆH[™Ý
HÂˆœ™XZÎÂˆBˆÚHY™™\–ÜÜÚ][Û—NÂˆHÚ[H
ÚOOHˆ	‰ˆÚOOHÔŠNÂˆÛÛ[YNÂˆBˆÛÛœÝÚÙ[ˆH™XYÚÙ[ŠY™™\‹ÜÚ][ÛŠNÂˆ]NÂˆYˆ
ÚÙ[‹œÝ\ÕÚ]
ž™YˆŠH	‰ˆ
ÚÙ[‹›[™ÝOOH×ËË\Ý
ÚÙ[–ÍJJJHÂˆÜÚ][Ûˆ
ÏHÚÚ\[[
Y™™\‹ÜÚ][Û‹˜Z[\ž]\ÊNÂˆ˜Z[\œËœ\Ú
ÜÚ][ÛŠNÂˆÜÚ][Ûˆ
ÏHÚÚ\[[
Y™™\‹ÜÚ][Û‹Ý\™Yž]\ÊNÂˆH[ÙHYˆ
HHØš”™YÑ^™^XÊÚÙ[ŠJHÂˆÛÛœÝ[HHVÌWHˆÙ[ˆHVÌ—HÂˆÛÛœÝÝ\ÜÈHÜÚ][Ûˆ
ÈÚÙ[‹›[™ÝÂˆ]ÛÛ[[™Ýˆ\]Q[šY\ÈH˜[ÙNÂˆYˆ
]\ËˆÙ[šY\ÖÛ[WJHÂˆ\]Q[šY\ÈHYNÂˆH[ÙHYˆ
\ËˆÙ[šY\ÖÛ[WK™Ù[ˆOOHÙ[ŠHÂˆžHÂˆÛÛœÝ\œÙ\ˆH™]È\œÙ\ŠÂˆ^\Žˆ™]È^\ŠÝ™X[K›XZÙTÝX”Ý™X[JÝ\ÜÊJBˆJNÂˆ\œÙ\‹™Ù]ØšŠ
NÂˆ\]Q[šY\ÈHYNÂˆHØ]Ú
^
HÂˆYˆ
^[œÝ[˜Ù[Ùˆ\œÙ\‘SÑ‘^Ù\[ÛŠHÂˆØ\›Š[™^Øš™XÝÈKHÚXÚÚ[™ÈØš™XÝ
	ÝÚÙ[ŸJNˆ‰Ù^H‹˜
NÂˆH[ÙHÂˆ\]Q[šY\ÈHYNÂˆBˆBˆBˆYˆ
\]Q[šY\ÊHÂˆ\ËˆÙ[šY\ÖÛ[WHHÂˆÙ™œÙ]ˆÜÚ][ÛˆHÝ™X[KœÝ\ˆÙ[‹ˆœ™YNˆ˜[ÙKˆ[˜ÛÛ\™\ÜÙYˆYBˆNÂˆBˆÑ[™Øš”™YÑ^›\Ý[™^HÝ\ÜÎÂˆÛÛœÝX]ÚHÑ[™Øš”™YÑ^™^XÊY™™\”ÝŠNÂˆYˆ
X]Ú
HÂˆÛÛœÝ[™ÜÈHÑ[™Øš”™YÑ^›\Ý[™^
ÈNÂˆÛÛ[[™ÝH[™ÜÈHÜÚ][ÛŽÂˆYˆ
X]ÚÌWHOOH™[™ØšˆŠHÂˆØ\›Š[™^Øš™XÝÎˆ›Ý[™‰ÛX]ÚÌW_Hˆ[œÚYHÙˆ[›Ý\ˆ›Øšˆ‹
È	ØØ]\ÙYžHZ\ÜÚ[™È™[™ØšˆˆKHžZ[™ÈÈ™XÛÝ™\‹‰ÊNÂˆÛÛ[[™ÝOHX]ÚÌWK›[™Ý
ÈNÂˆBˆH[ÙHÂˆÛÛ[[™ÝH[™ÝHÜÚ][ÛŽÂˆBˆÛÛœÝÛÛ[HY™™\‹œÝX˜\œ˜^JÜÚ][Û‹ÜÚ][Ûˆ
ÈÛÛ[[™Ý
NÂˆÛÛœÝ™Y•YÓÙ™œÙ]HÚÚ\[[
ÛÛ[™Yž]\ÊNÂˆYˆ
™Y•YÓÙ™œÙ]ÛÛ[[™Ý	‰ˆÛÛ[Þ™Y•YÓÙ™œÙ]
ÈWH
HÂˆ™Y”Ý\Ëœ\Ú
ÜÚ][ÛˆHÝ™X[KœÝ\
NÂˆ\ËˆÞ™Y”Ý\Ë˜Y
ÜÚ][ÛˆHÝ™X[KœÝ\
NÂˆBˆÜÚ][Ûˆ
ÏHÛÛ[[™ÝÂˆH[ÙHYˆ
ÚÙ[‹œÝ\ÕÚ]
˜Z[\ˆŠH	‰ˆ
ÚÙ[‹›[™ÝOOHÈ×ËË\Ý
ÚÙ[–Í×JJJHÂˆ˜Z[\œËœ\Ú
ÜÚ][ÛŠNÂˆÛÛœÝÝ\ÜÈHÜÚ][Ûˆ
ÈÚÙ[‹›[™ÝÂˆ]ÛÛ[[™ÝÂˆÔÝ\™Y”™YÑ^›\Ý[™^HÝ\ÜÎÂˆÛÛœÝX]ÚHÔÝ\™Y”™YÑ^™^XÊY™™\”ÝŠNÂˆYˆ
X]Ú
HÂˆÛÛœÝ[™ÜÈHÔÝ\™Y”™YÑ^›\Ý[™^
ÈNÂˆÛÛ[[™ÝH[™ÜÈHÜÚ][ÛŽÂˆYˆ
X]ÚÌWHOOHœÝ\™YˆŠHÂˆØ\›Š[™^Øš™XÝÎˆ›Ý[™‰ÛX]ÚÌW_HˆY\ˆ˜Z[\ˆ‹
È	ØØ]\ÙYžHZ\ÜÚ[™ÈœÝ\™YˆˆKHžZ[™ÈÈ™XÛÝ™\‹‰ÊNÂˆÛÛ[[™ÝOHX]ÚÌWK›[™Ý
ÈNÂˆBˆH[ÙHÂˆÛÛ[[™ÝH[™ÝHÜÚ][ÛŽÂˆBˆÜÚ][Ûˆ
ÏHÛÛ[[™ÝÂˆH[ÙHÂˆÜÚ][Ûˆ
ÏHÚÙ[‹›[™Ý
ÈNÂˆBˆBˆ›Üˆ
ÛÛœÝ™Y”ÝHÙˆ™Y”Ý\ÊHÂˆ\ËœÝ\™Y”]Y]YKœ\Ú
™Y”ÝJNÂˆ\Ëœ™XY™YŠYJNÂˆBˆÛÛœÝ˜Z[\‘XÝÈH×NÂˆ]\Ñ[˜Üž\YH˜[ÙNÂˆ›Üˆ
ÛÛœÝ˜Z[\ˆÙˆ˜Z[\œÊHÂˆÝ™X[KœÜÈH˜Z[\ŽÂˆÛÛœÝ\œÙ\ˆH™]È\œÙ\ŠÂˆ^\Žˆ™]È^\ŠÝ™X[JKˆ™YŽˆ\Ëˆ[ÝÔÝ™X[\ÎˆYKˆ™XÛÝ™\žS[ÙNˆYBˆJNÂˆÛÛœÝØšˆH\œÙ\‹™Ù]ØšŠ
NÂˆYˆ
Z\ÐÛY
Øš‹˜Z[\ˆŠJHÂˆÛÛ[YNÂˆBˆÛÛœÝXÝH\œÙ\‹™Ù]ØšŠ
NÂˆYˆ
JXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆ˜Z[\‘XÝËœ\Ú
XÝ
NÂˆYˆ
XÝš\Ê‘[˜Üž\ŠJHÂˆ\Ñ[˜Üž\YHYNÂˆBˆBˆ]˜Z[\‘XÝ˜Z[\‘\œ›ÜŽÂˆ›Üˆ
ÛÛœÝXÝÙˆË‹‹˜Z[\‘XÝË™Ù[‘˜[˜XÚÈ‹‹‹˜Z[\‘XÝ×JHÂˆYˆ
XÝOOH™Ù[‘˜[˜XÚÈŠHÂˆYˆ
]˜Z[\‘\œ›ÜŠHÂˆœ™XZÎÂˆBˆ\Ë—ÙÙ[™\˜][Û‘˜[˜XÚÈHYNÂˆÛÛ[YNÂˆBˆ]˜[YYÙ\ÑXÝH˜[ÙNÂˆžHÂˆÛÛœÝ›ÛÝXÝHXÝ™Ù]
”›ÛÝŠNÂˆYˆ
J›ÛÝXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆÛÛœÝYÙ\ÑXÝH›ÛÝXÝ™Ù]
”YÙ\ÈŠNÂˆYˆ
JYÙ\ÑXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆÛÛœÝYÙ\ÐÛÝ[HYÙ\ÑXÝ™Ù]
ÛÝ[ŠNÂˆYˆ
[X™\‹š\Ò[YÙ\ŠYÙ\ÐÛÝ[
JHÂˆ˜[YYÙ\ÑXÝHYNÂˆBˆHØ]Ú
^
HÂˆ˜Z[\‘\œ›ÜˆH^ÂˆÛÛ[YNÂˆBˆYˆ
˜[YYÙ\ÑXÝ	‰ˆ
Z\Ñ[˜Üž\YXÝš\Ê‘[˜Üž\ŠJH	‰ˆXÝš\Ê’QŠJHÂˆ™]\›ˆXÝÂˆBˆ˜Z[\‘XÝHXÝÂˆBˆYˆ
˜Z[\‘XÝ
HÂˆ™]\›ˆ˜Z[\‘XÝÂˆBˆYˆ
\ËÜXÝ
HÂˆ™]\›ˆ\ËÜXÝÂˆBˆYˆ
]˜Z[\‘XÝË›[™Ý
HÂˆ›Üˆ
ÛÛœÝ[H[ˆ\ËˆÙ[šY\ÊHÂˆÛÛœÝ[žHH\ËˆÙ[šY\ÖÛ[WNÂˆYˆ
Y[žJHÂˆÛÛ[YNÂˆBˆÛÛœÝ™YˆH™Y‹™Ù]
\œÙR[
[KL
K[žK™Ù[ŠNÂˆ]ØšŽÂˆžHÂˆØšˆH\Ë™™]Ú
™YŠNÂˆHØ]ÚÂˆÛÛ[YNÂˆBˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆØšˆHØš‹™XÝÂˆBˆYˆ
Øšˆ[œÝ[˜Ù[ÙˆXÝ	‰ˆØš‹š\Ê”›ÛÝŠJHÂˆ™]\›ˆØšŽÂˆBˆBˆBˆ›ÝÈ™]È[˜[Y‘^Ù\[ÛŠ’[˜[YˆÝXÝ\™KˆŠNÂˆBˆ™XY™YŠ™XÛÝ™\žS[ÙHH˜[ÙJHÂˆÛÛœÝÝ™X[HH\ËœÝ™X[NÂˆÛÛœÝÝ\™Y”\œÙYØXÚHH™]ÈÙ]

NÂˆÚ[H
\ËœÝ\™Y”]Y]YK›[™Ý
HÂˆžHÂˆÛÛœÝÝ\™YˆH\ËœÝ\™Y”]Y]YVÌNÂˆYˆ
Ý\™Y”\œÙYØXÚKš\ÊÝ\™YŠJHÂˆØ\›Šœ™XY™YˆHÚÚ\[™È™YˆX›HÚ[˜ÙH]Ø\È[™XYH\œÙYˆŠNÂˆ\ËœÝ\™Y”]Y]YKœÚY

NÂˆÛÛ[YNÂˆBˆÝ\™Y”\œÙYØXÚK˜Y
Ý\™YŠNÂˆÝ™X[KœÜÈHÝ\™Yˆ
ÈÝ™X[KœÝ\ÂˆÛÛœÝ\œÙ\ˆH™]È\œÙ\ŠÂˆ^\Žˆ™]È^\ŠÝ™X[JKˆ™YŽˆ\Ëˆ[ÝÔÝ™X[\ÎˆYBˆJNÂˆ]ØšˆH\œÙ\‹™Ù]ØšŠ
NÂˆ]XÝÂˆYˆ
\ÐÛY
Øš‹ž™YˆŠJHÂˆXÝH\Ëœ›ØÙ\ÜÖ™Y•X›J\œÙ\ŠNÂˆ\ËÜXÝHXÝÂˆØšˆHXÝ™Ù]
–™Y”ÝHŠNÂˆYˆ
[X™\‹š\Ò[YÙ\ŠØšŠH	‰ˆ]\ËˆÞ™Y”Ý\Ëš\ÊØšŠJHÂˆ\ËˆÞ™Y”Ý\Ë˜Y
ØšŠNÂˆ\ËœÝ\™Y”]Y]YKœ\Ú
ØšŠNÂˆBˆH[ÙHYˆ
[X™\‹š\Ò[YÙ\ŠØšŠJHÂˆYˆ
S[X™\‹š\Ò[YÙ\Š\œÙ\‹™Ù]ØšŠ
JHZ\ÐÛY
\œÙ\‹™Ù]ØšŠ
K›ØšˆŠHJ
ØšˆH\œÙ\‹™Ù]ØšŠ
JH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™YˆÝ™X[HŠNÂˆBˆXÝH\Ëœ›ØÙ\ÜÖ™Y”Ý™X[JØšŠNÂˆ\ËÜXÝHXÝÂˆYˆ
YXÝ
HÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ‘˜Z[YÈ™XY™YˆÝ™X[HŠNÂˆBˆH[ÙHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[Y™YˆÝ™X[HXY\ˆŠNÂˆBˆ\ËˆÞ™Y”ÙXÝ[Û“Ù™œÙ]Ë˜Y
Ý\™YŠNÂˆØšˆHXÝ™Ù]
”™]ˆŠNÂˆYˆ
[X™\‹š\Ò[YÙ\ŠØšŠJHÂˆ\ËœÝ\™Y”]Y]YKœ\Ú
ØšŠNÂˆH[ÙHYˆ
Øšˆ[œÝ[˜Ù[Ùˆ™YŠHÂˆ\ËœÝ\™Y”]Y]YKœ\Ú
Øš‹›[JNÂˆBˆHØ]Ú
JHÂˆYˆ
H[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈNÂˆBˆ\ËˆÞ™Y”ÙXÝ[ÛœÐÛÛ\]HH˜[ÙNÂˆ[™›ÊŠÚ[H™XY[™È™YŠNˆˆ
ÈJNÂˆBˆ\ËœÝ\™Y”]Y]YKœÚY

NÂˆBˆYˆ
\ËÜXÝ
HÂˆ™]\›ˆ\ËÜXÝÂˆBˆYˆ
™XÛÝ™\žS[ÙJHÂˆ™]\›ˆ[™Yš[™YÂˆBˆ›ÝÈ™]È™Y”\œÙQ^Ù\[ÛŠ
NÂˆBˆÛÝ[\]\ÐY\ŠÙ™œÙ]
HÂˆYˆ
\ËˆÜ\œÙYÚ]™XÛÝ™\žH]\ËˆÞ™Y”ÙXÝ[ÛœÐÛÛ\]JHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ™[]]™SÙ™œÙ]HÙ™œÙ]H\ËœÝ™X[KœÝ\Âˆ]ÛÝ[HÂˆ›Üˆ
ÛÛœÝÙXÝ[Û“Ù™œÙ]Ùˆ\ËˆÞ™Y”ÙXÝ[Û“Ù™œÙ]ÊHÂˆYˆ
ÙXÝ[Û“Ù™œÙ]H™[]]™SÙ™œÙ]	‰ˆ]\ËˆÞ™Y”Ý\Ëš\ÊÙXÝ[Û“Ù™œÙ]
JHÂˆÛÝ[
ÊÎÂˆBˆBˆ™]\›ˆÛÝ[ÂˆBˆÙ][žJJHÂˆÛÛœÝ[žHH\ËˆÙ[šY\ÖÚWNÂˆ™]\›ˆ[žH	‰ˆY[žK™œ™YH	‰ˆ[žK›Ù™œÙ]È[žHˆ[ÂˆBˆ™]ÚY”™YŠØš‹Ý\™\ÜÑ[˜Üž\[ÛˆH˜[ÙJHÂˆ™]\›ˆØšˆ[œÝ[˜Ù[Ùˆ™YˆÈ\Ë™™]Ú
Øš‹Ý\™\ÜÑ[˜Üž\[ÛŠHˆØšŽÂˆBˆ™]Ú
™Y‹Ý\™\ÜÑ[˜Üž\[ÛˆH˜[ÙJHÂˆYˆ
J™Yˆ[œÝ[˜Ù[Ùˆ™YŠJHÂˆ›ÝÈ™]È\œ›ÜŠœ™YˆØš™XÝ\È›ÝH™Y™\™[˜ÙHŠNÂˆBˆÛÛœÝ[HH™Y‹›[NÂˆÛÛœÝØXÚQ[žHH\ËˆØØXÚSX\™Ù]
[JNÂˆYˆ
ØXÚQ[žHOOH[™Yš[™Y
HÂˆYˆ
ØXÚQ[žH[œÝ[˜Ù[ÙˆXÝ	‰ˆXØXÚQ[žK›Øš’Y
HÂˆØXÚQ[žK›Øš’YH™Y‹ÔÝš[™Ê
NÂˆBˆ™]\›ˆØXÚQ[žNÂˆBˆ]™Y‘[žHH\Ë™Ù][žJ[JNÂˆYˆ
™Y‘[žHOOH[
HÂˆ™]\›ˆ™Y‘[žNÂˆBˆYˆ
\ËˆÜ[™[™Ô™YœËš\Ê™YŠJHÂˆ\ËˆÜ[™[™Ô™YœËœ™[[Ý™J™YŠNÂˆØ\›ŠYÛ›Üš[™ÈÚ\˜Ý[\ˆ™Y™\™[˜ÙNˆ	Ü™YŸK˜
NÂˆ™]\›ˆÒTÕST—Ô‘QŽÂˆBˆ\ËˆÜ[™[™Ô™YœËœ]
™YŠNÂˆžHÂˆ™Y‘[žHH™Y‘[žK[˜ÛÛ\™\ÜÙYÈ\Ë™™]Ú[˜ÛÛ\™\ÜÙY
™Y‹™Y‘[žKÝ\™\ÜÑ[˜Üž\[ÛŠHˆ\Ë™™]ÚÛÛ\™\ÜÙY
™Y‹™Y‘[žKÝ\™\ÜÑ[˜Üž\[ÛŠNÂˆ\ËˆÜ[™[™Ô™YœËœ™[[Ý™J™YŠNÂˆHØ]Ú
^
HÂˆ\ËˆÜ[™[™Ô™YœËœ™[[Ý™J™YŠNÂˆ›ÝÈ^ÂˆBˆYˆ
™Y‘[žH[œÝ[˜Ù[ÙˆXÝ
HÂˆ™Y‘[žK›Øš’YH™Y‹ÔÝš[™Ê
NÂˆH[ÙHYˆ
™Y‘[žH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ™Y‘[žK™XÝ›Øš’YH™Y‹ÔÝš[™Ê
NÂˆBˆ™]\›ˆ™Y‘[žNÂˆBˆ™]Ú[˜ÛÛ\™\ÜÙY
™Y‹™Y‘[žKÝ\™\ÜÑ[˜Üž\[ÛˆH˜[ÙJHÂˆÛÛœÝÙ[ˆH™Y‹™Ù[ŽÂˆ][HH™Y‹›[NÂˆYˆ
™Y‘[žK™Ù[ˆOOHÙ[ŠHÂˆÛÛœÝ\ÙÈH[˜ÛÛœÚ\Ý[Ù[™\˜][Ûˆ[ˆ™YŽˆ	Ü™YŸXÂˆYˆ
\Ë—ÙÙ[™\˜][Û‘˜[˜XÚÈ	‰ˆ™Y‘[žK™Ù[ˆÙ[ŠHÂˆØ\›Š\ÙÊNÂˆ™]\›ˆ\Ë™™]Ú[˜ÛÛ\™\ÜÙY
™Y‹™Ù]
[K™Y‘[žK™Ù[ŠK™Y‘[žKÝ\™\ÜÑ[˜Üž\[ÛŠNÂˆBˆ›ÝÈ™]È™Y‘[žQ^Ù\[ÛŠ\ÙÊNÂˆBˆÛÛœÝÝ™X[HH\ËœÝ™X[K›XZÙTÝX”Ý™X[J™Y‘[žK›Ù™œÙ]
È\ËœÝ™X[KœÝ\
NÂˆÛÛœÝ\œÙ\ˆH™]È\œÙ\ŠÂˆ^\Žˆ™]È^\ŠÝ™X[JKˆ™YŽˆ\Ëˆ[ÝÔÝ™X[\ÎˆYBˆJNÂˆÛÛœÝØšŒHH\œÙ\‹™Ù]ØšŠ
NÂˆÛÛœÝØšŒˆH\œÙ\‹™Ù]ØšŠ
NÂˆÛÛœÝØšŒÈH\œÙ\‹™Ù]ØšŠ
NÂˆYˆ
ØšŒHOOH[HØšŒˆOOHÙ[ˆJØšŒÈ[œÝ[˜Ù[ÙˆÛY
JHÂˆ›ÝÈ™]È™Y‘[žQ^Ù\[ÛŠ˜Y
[˜ÛÛ\™\ÜÙY
H™Yˆ[žNˆ	Ü™YŸX
NÂˆBˆYˆ
ØšŒË˜ÛYOOH›ØšˆŠHÂˆYˆ
ØšŒË˜ÛYœÝ\ÕÚ]
›ØšˆŠJHÂˆ[HH\œÙR[
ØšŒË˜ÛYœÝXœÝš[™ÊÊKL
NÂˆYˆ
S[X™\‹š\Ó˜SŠ[JJHÂˆ™]\›ˆ[NÂˆBˆBˆ›ÝÈ™]È™Y‘[žQ^Ù\[ÛŠ˜Y
[˜ÛÛ\™\ÜÙY
H™Yˆ[žNˆ	Ü™YŸX
NÂˆBˆ™Y‘[žHH\Ë™[˜Üž\	‰ˆ\Ý\™\ÜÑ[˜Üž\[ÛˆÈ\œÙ\‹™Ù]ØšŠ\Ë™[˜Üž\˜Ü™X]PÚ\\•˜[œÙ›Ü›J[KÙ[ŠJHˆ\œÙ\‹™Ù]ØšŠ
NÂˆYˆ
J™Y‘[žH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JJHÂˆ\ËˆØØXÚSX\œÙ]
[K™Y‘[žJNÂˆBˆ™]\›ˆ™Y‘[žNÂˆBˆ™]ÚÛÛ\™\ÜÙY
™Y‹™Y‘[žKÝ\™\ÜÑ[˜Üž\[ÛˆH˜[ÙJHÂˆÛÛœÝX›SÙ™œÙ]H™Y‘[žK›Ù™œÙ]ÂˆÛÛœÝÝ™X[HH\Ë™™]Ú
™Y‹™Ù]
X›SÙ™œÙ]
JNÂˆYˆ
JÝ™X[H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ˜˜YØš”ÝHÝ™X[HŠNÂˆBˆÛÛœÝš\œÝHÝ™X[K™XÝ™Ù]
‘š\œÝŠNÂˆÛÛœÝˆHÝ™X[K™XÝ™Ù]
“ˆŠNÂˆYˆ
S[X™\‹š\Ò[YÙ\Šš\œÝ
HS[X™\‹š\Ò[YÙ\ŠŠJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠš[˜[Yš\œÝ[™ˆ\˜[Y]\œÈ›ÜˆØš”ÝHÝ™X[HŠNÂˆBˆ]\œÙ\ˆH™]È\œÙ\ŠÂˆ^\Žˆ™]È^\ŠÝ™X[JKˆ™YŽˆ\Ëˆ[ÝÔÝ™X[\ÎˆYBˆJNÂˆÛÛœÝ[\ÈH™]È\œ˜^JŠNÂˆÛÛœÝÙ™œÙ]ÈH™]È\œ˜^JŠNÂˆ›Üˆ
]HHÈHŽÈ
ÊÚJHÂˆÛÛœÝ[HH\œÙ\‹™Ù]ØšŠ
NÂˆYˆ
S[X™\‹š\Ò[YÙ\Š[JJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ[˜[YØš™XÝ[X™\ˆ[ˆHØš”ÝHÝ™X[Nˆ	Û[_X
NÂˆBˆÛÛœÝÙ™œÙ]H\œÙ\‹™Ù]ØšŠ
NÂˆYˆ
S[X™\‹š\Ò[YÙ\ŠÙ™œÙ]
JHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ[˜[YØš™XÝÙ™œÙ][ˆHØš”ÝHÝ™X[Nˆ	ÛÙ™œÙ]X
NÂˆBˆ[\ÖÚWHH[NÂˆÛÛœÝ[žHH\Ë™Ù][žJ[JNÂˆYˆ
[žOË›Ù™œÙ]OOHX›SÙ™œÙ]	‰ˆ[žK™Ù[ˆOOHJHÂˆ[žK™Ù[ˆHNÂˆBˆÙ™œÙ]ÖÚWHHÙ™œÙ]ÂˆBˆÛÛœÝÝ\H
Ý™X[KœÝ\
H
Èš\œÝÂˆÛÛœÝ[šY\ÈH™]È\œ˜^JŠNÂˆ›Üˆ
]HHÈHŽÈ
ÊÚJHÂˆÛÛœÝ[™ÝHHˆHHÈÙ™œÙ]ÖÚH
ÈWHHÙ™œÙ]ÖÚWHˆ[™Yš[™YÂˆYˆ
[™Ý
HÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ’[˜[YÙ™œÙ][ˆHØš”ÝHÝ™X[KˆŠNÂˆBˆ\œÙ\ˆH™]È\œÙ\ŠÂˆ^\Žˆ™]È^\ŠÝ™X[K›XZÙTÝX”Ý™X[JÝ\
ÈÙ™œÙ]ÖÚWK[™ÝÝ™X[K™XÝ
JKˆ™YŽˆ\Ëˆ[ÝÔÝ™X[\ÎˆYBˆJNÂˆÛÛœÝØšˆH\œÙ\‹™Ù]ØšŠ
NÂˆ[šY\ÖÚWHHØšŽÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆÛÛ[YNÂˆBˆÛÛœÝ[HH[\ÖÚWKˆ[žHH\ËˆÙ[šY\ÖÛ[WNÂˆYˆ
[žH	‰ˆ[žK›Ù™œÙ]OOHX›SÙ™œÙ]	‰ˆ[žK™Ù[ˆOOHJHÂˆ\ËˆØØXÚSX\œÙ]
[KØšŠNÂˆBˆBˆ™Y‘[žHH[šY\ÖÞ™Y‘[žK™Ù[—NÂˆYˆ
™Y‘[žHOOH[™Yš[™Y
HÂˆ›ÝÈ™]È™Y‘[žQ^Ù\[ÛŠ˜Y
ÛÛ\™\ÜÙY
H™Yˆ[žNˆ	Ü™YŸX
NÂˆBˆ™]\›ˆ™Y‘[žNÂˆBˆ\Þ[˜È™]ÚY”™Y\Þ[˜ÊØš‹Ý\™\ÜÑ[˜Üž\[ÛŠHÂˆ™]\›ˆØšˆ[œÝ[˜Ù[Ùˆ™YˆÈ\Ë™™]Ú\Þ[˜ÊØš‹Ý\™\ÜÑ[˜Üž\[ÛŠHˆØšŽÂˆBˆ\Þ[˜È™]Ú\Þ[˜Ê™Y‹Ý\™\ÜÑ[˜Üž\[ÛŠHÂˆžHÂˆ™]\›ˆ\Ë™™]Ú
™Y‹Ý\™\ÜÑ[˜Üž\[ÛŠNÂˆHØ]Ú
^
HÂˆYˆ
J^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠJHÂˆ›ÝÈ^ÂˆBˆ]ØZ]\Ëœ“X[˜YÙ\‹œ™\]Y\Ý˜[™ÙJ^˜™YÚ[‹^™[™
NÂˆ™]\›ˆ\Ë™™]Ú\Þ[˜Ê™Y‹Ý\™\ÜÑ[˜Üž\[ÛŠNÂˆBˆBˆÙ]Ø][ÙÓØšŠ
HÂˆ™]\›ˆ\Ëœ›ÛÝÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÙØÝ[Y[šœÂ‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚‚˜ÛÛœÝUT—ÔÒV‘WÓQQPP“ÖHÌŒL‹ÎL—NÂ˜ÛÛœÝÒQÓUT‘WÕRSÐÒS’×ÔÒV‘HHMLÍŽÂ˜Û\ÜÈYÙHÂˆÜ™\ÛÝ\˜Ù\Ô›ÛZ\ÙHH[ÂˆÛÛœÝXÝÜŠÂˆ“X[˜YÙ\‹ˆ™Y‹ˆYÙR[™^ˆYÙQXÝˆ™Y‹ˆÛØ˜[Y˜XÝÜžKˆ›ÛØXÚKˆZ[[ÓX\ØXÚKˆÝ[™\™›Û]PØXÚKˆÛØ˜[ÛÛÜ”ÜXÙPØXÚKˆÛØ˜[[XYÙPØXÚKˆÞ\Ý[Q›ÛØXÚKˆ›Û›[™[Ù\ÔÙ]ˆ˜Q˜XÝÜžBˆJHÂˆ\Ëœ“X[˜YÙ\ˆH“X[˜YÙ\ŽÂˆ\ËœYÙR[™^HYÙR[™^Âˆ\ËœYÙQXÝHYÙQXÝÂˆ\Ëž™YˆH™YŽÂˆ\Ëœ™YˆH™YŽÂˆ\Ë™›ÛØXÚHH›ÛØXÚNÂˆ\Ë˜Z[[ÓX\ØXÚHHZ[[ÓX\ØXÚNÂˆ\ËœÝ[™\™›Û]PØXÚHHÝ[™\™›Û]PØXÚNÂˆ\Ë™ÛØ˜[ÛÛÜ”ÜXÙPØXÚHHÛØ˜[ÛÛÜ”ÜXÙPØXÚNÂˆ\Ë™ÛØ˜[[XYÙPØXÚHHÛØ˜[[XYÙPØXÚNÂˆ\ËœÞ\Ý[Q›ÛØXÚHHÞ\Ý[Q›ÛØXÚNÂˆ\Ë››Û›[™[Ù\ÔÙ]H›Û›[™[Ù\ÔÙ]Âˆ\Ë™]˜[X]Ü“Ü[ÛœÈH“X[˜YÙ\‹™]˜[X]Ü“Ü[ÛœÎÂˆ\Ëž˜Q˜XÝÜžHH˜Q˜XÝÜžNÂˆÛÛœÝYÛÝ[\œÈHÂˆØšŽˆˆNÂˆ\Ë—ÛØØ[Y˜XÝÜžHHÛ\ÜÈ^[™ÈÛØ˜[Y˜XÝÜžHÂˆÝ]XÈÜ™X]SØš’Y

HÂˆ™]\›ˆ	ÜYÙR[™^WÉÊÊÚYÛÝ[\œË›ØšŸXÂˆBˆÝ]XÈÙ]YÙSØš’Y

HÂˆ™]\›ˆ	Ü™Y‹ÔÝš[™Ê
_XÂˆBˆNÂˆBˆØÜ™X]T\X[]˜[X]ÜŠ[™\‹YÙR[™^H\ËœYÙR[™^
HÂˆ™]\›ˆ™]È\X[]˜[X]ÜŠÂˆ™YŽˆ\Ëž™Y‹ˆ[™\‹ˆYÙR[™^ˆY˜XÝÜžNˆ\Ë—ÛØØ[Y˜XÝÜžKˆ›ÛØXÚNˆ\Ë™›ÛØXÚKˆZ[[ÓX\ØXÚNˆ\Ë˜Z[[ÓX\ØXÚKˆÝ[™\™›Û]PØXÚNˆ\ËœÝ[™\™›Û]PØXÚKˆÛØ˜[ÛÛÜ”ÜXÙPØXÚNˆ\Ë™ÛØ˜[ÛÛÜ”ÜXÙPØXÚKˆÛØ˜[[XYÙPØXÚNˆ\Ë™ÛØ˜[[XYÙPØXÚKˆÞ\Ý[Q›ÛØXÚNˆ\ËœÞ\Ý[Q›ÛØXÚKˆÜ[ÛœÎˆ\Ë™]˜[X]Ü“Ü[ÛœÂˆJNÂˆBˆÙÙ][š\š]X›T›Ü\JÙ^KÙ]\œ˜^HH˜[ÙJHÂˆÛÛœÝ˜[YHHÙ][š\š]X›T›Ü\JÂˆXÝˆ\ËœYÙQXÝˆÙ^KˆÙ]\œ˜^KˆÝÜÚ[‘›Ý[™ˆ˜[ÙBˆJNÂˆYˆ
P\œ˜^Kš\Ð\œ˜^J˜[YJJHÂˆ™]\›ˆ˜[YNÂˆBˆYˆ
˜[YK›[™ÝOOHHJ˜[YVÌH[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ˆ˜[YVÌNÂˆBˆ™]\›ˆXÝ›Y\™ÙJÂˆ™YŽˆ\Ëž™Y‹ˆXÝ\œ˜^Nˆ˜[YBˆJNÂˆBˆÙ]ÛÛ[

HÂˆ™]\›ˆ\ËœYÙQXÝ™Ù]\œ˜^JÛÛ[ÈŠNÂˆBˆÙ]™\ÛÝ\˜Ù\Ê
HÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH\ËˆÙÙ][š\š]X›T›Ü\J”™\ÛÝ\˜Ù\ÈŠNÂˆ™]\›ˆÚYÝÊ\Ëœ™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\È[œÝ[˜Ù[ÙˆXÝÈ™\ÛÝ\˜Ù\ÈˆXÝ™[\JNÂˆBˆÙ]›Ý[™[™Ð›Þ
˜[YJHÂˆYˆ
\Ëž˜Q]JHÂˆ™]\›ˆ\Ëž˜Q]K˜˜›ÞÂˆBˆÛÛœÝ›ÞHÛÚÝ\›Ü›X[™XÝ
\ËˆÙÙ][š\š]X›T›Ü\J˜[YKYJK[
NÂˆYˆ
›Þ
HÂˆYˆ
›ÞÌ—HH›ÞÌHˆ	‰ˆ›ÞÌ×HH›ÞÌWHˆ
HÂˆ™]\›ˆ›ÞÂˆBˆØ\›Š[\KÜˆ[˜[YÉÛ˜[Y_H[žK˜
NÂˆBˆ™]\›ˆ[ÂˆBˆÙ]YYXP›Þ

HÂˆ™]\›ˆÚYÝÊ\Ë›YYXP›Þ‹\Ë™Ù]›Ý[™[™Ð›Þ
“YYXP›ÞŠHUT—ÔÒV‘WÓQQPP“Ö
NÂˆBˆÙ]Ü›Ü›Þ

HÂˆ™]\›ˆÚYÝÊ\Ë˜Ü›Ü›Þ‹\Ë™Ù]›Ý[™[™Ð›Þ
Ü›Ü›ÞŠH\Ë›YYXP›Þ
NÂˆBˆÙ]\Ù\•[š]

HÂˆÛÛœÝØšˆH\ËœYÙQXÝ™Ù]
•\Ù\•[š]ŠNÂˆ™]\›ˆÚYÝÊ\Ë\Ù\•[š]‹\[ÙˆØšˆOOH›[X™\ˆˆ	‰ˆØšˆˆÈØšˆˆKŒ
NÂˆBˆÙ]šY]Ê
HÂˆÛÛœÝÂˆÜ›Ü›ÞˆYYXP›ÞˆHH\ÎÂˆYˆ
Ü›Ü›ÞOOHYYXP›Þ	‰ˆZ\Ð\œ˜^Q\]X[
Ü›Ü›ÞYYXP›Þ
JHÂˆÛÛœÝ›ÞH][š[\œÙXÝ
Ü›Ü›ÞYYXP›Þ
NÂˆYˆ
›Þ	‰ˆ›ÞÌ—HH›ÞÌHˆ	‰ˆ›ÞÌ×HH›ÞÌWHˆ
HÂˆ™]\›ˆÚYÝÊ\ËšY]È‹›Þ
NÂˆBˆØ\›Š‘[\HÐÜ›Ü›Þ[™ÓYYXP›Þ[\œÙXÝ[Û‹ˆŠNÂˆBˆ™]\›ˆÚYÝÊ\ËšY]È‹YYXP›Þ
NÂˆBˆÙ]›Ý]J
HÂˆ]›Ý]HH\ËˆÙÙ][š\š]X›T›Ü\J”›Ý]HŠHÂˆYˆ
›Ý]H	HLOOH
HÂˆ›Ý]HHÂˆH[ÙHYˆ
›Ý]HHÍŒ
HÂˆ›Ý]H	OHÍŒÂˆH[ÙHYˆ
›Ý]H
HÂˆ›Ý]HH
›Ý]H	HÍŒ
ÈÍŒ
H	HÍŒÂˆBˆ™]\›ˆÚYÝÊ\Ëœ›Ý]H‹›Ý]JNÂˆBˆÛÛ”ÝX”Ý™X[Q\œ›ÜŠ™X\ÛÛ‹Øš’Y
HÂˆYˆ
\Ë™]˜[X]Ü“Ü[ÛœËšYÛ›Ü™Q\œ›ÜœÊHÂˆØ\›ŠÙ]ÛÛ[Ý™X[HHYÛ›Üš[™ÈÝX‹\Ý™X[H
	ÛØš’YJNˆ‰Ü™X\ÛÛŸH‹˜
NÂˆ™]\›ŽÂˆBˆ›ÝÈ™X\ÛÛŽÂˆBˆ\Þ[˜ÈÙ]ÛÛ[Ý™X[J
HÂˆÛÛœÝÛÛ[H]ØZ]\Ëœ“X[˜YÙ\‹™[œÝ\™J\Ë˜ÛÛ[ŠNÂˆYˆ
ÛÛ[[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[H	‰ˆXÛÛ[š\Ò[XYÙTÝ™X[JHÂˆYˆ
ÛÛ[š\Ð\Þ[˜ÊHÂˆÛÛœÝž]\ÈH]ØZ]ÛÛ[˜\Þ[˜ÑÙ]ž]\Ê
NÂˆYˆ
ž]\ÊHÂˆ™]\›ˆ™]ÈÝ™X[Jž]\Ëž]\Ë›[™ÝÛÛ[™XÝ
NÂˆBˆBˆ™]\›ˆÛÛ[ÂˆBˆYˆ
\œ˜^Kš\Ð\œ˜^JÛÛ[
JHÂˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆ›Üˆ
]HHZHHÛÛ[›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝ][HHÛÛ[ÚWNÂˆYˆ
][H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[H	‰ˆ][Kš\Ð\Þ[˜ÊHÂˆ›ÛZ\Ù\Ëœ\Ú
][K˜\Þ[˜ÑÙ]ž]\Ê
K[Šž]\ÈOˆÂˆYˆ
ž]\ÊHÂˆÛÛ[ÚWHH™]ÈÝ™X[Jž]\Ëž]\Ë›[™Ý][K™XÝ
NÂˆBˆJJNÂˆBˆBˆYˆ
›ÛZ\Ù\Ë›[™Ýˆ
HÂˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆBˆ™]\›ˆ™]ÈÝ™X[\ÔÙ\]Y[˜ÙTÝ™X[JÛÛ[\ËˆÛÛ”ÝX”Ý™X[Q\œ›Ü‹˜š[™
\ÊJNÂˆBˆ™]\›ˆ™]È[Ý™X[J
NÂˆBˆÙ]˜Q]J
HÂˆ™]\›ˆÚYÝÊ\Ëž˜Q]H‹\Ëž˜Q˜XÝÜžHÈÂˆ˜›Þˆ\Ëž˜Q˜XÝÜžK™Ù]›Ý[™[™Ð›Þ
\ËœYÙR[™^
BˆHˆ[
NÂˆBˆ\Þ[˜ÈÜ™\XÙRYžT™YŠ[››Ý][ÛœË[]Y[››Ý][ÛœË^\Ý[™Ð[››Ý][ÛœÊHÂˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆ›Üˆ
ÛÛœÝ[››Ý][ÛˆÙˆ[››Ý][ÛœÊHÂˆYˆ
X[››Ý][Û‹šY
HÂˆÛÛ[YNÂˆBˆÛÛœÝ™YˆH™Y‹™œ›ÛTÝš[™Ê[››Ý][Û‹šY
NÂˆYˆ
\™YŠHÂˆØ\›ŠH›Û‹[[šÙY[››Ý][ÛˆØ[››Ý™H[ÙYšYYˆ	Ø[››Ý][Û‹šYX
NÂˆÛÛ[YNÂˆBˆYˆ
[››Ý][Û‹™[]Y
HÂˆ[]Y[››Ý][ÛœËœ]
™YŠNÂˆYˆ
[››Ý][Û‹œÜ\™YŠHÂˆÛÛœÝÜ\™YˆH™Y‹™œ›ÛTÝš[™Ê[››Ý][Û‹œÜ\™YŠNÂˆYˆ
Ü\™YŠHÂˆ[]Y[››Ý][ÛœËœ]
Ü\™YŠNÂˆBˆBˆÛÛ[YNÂˆBˆYˆ
[››Ý][Û‹œÜ\Ë™[]Y
HÂˆÛÛœÝÜ\™YˆH™Y‹™œ›ÛTÝš[™Ê[››Ý][Û‹œÜ\™YŠNÂˆYˆ
Ü\™YŠHÂˆ[]Y[››Ý][ÛœËœ]
Ü\™YŠNÂˆBˆBˆ^\Ý[™Ð[››Ý][ÛœÏËœ]
™YŠNÂˆ[››Ý][Û‹œ™YˆH™YŽÂˆ›ÛZ\Ù\Ëœ\Ú
\Ëž™Y‹™™]Ú\Þ[˜Ê™YŠK[ŠØšˆOˆÂˆYˆ
Øšˆ[œÝ[˜Ù[ÙˆXÝ
HÂˆ[››Ý][Û‹›Û[››Ý][ÛˆHØš‹˜ÛÛ™J
NÂˆBˆK

HOˆÂˆØ\›ŠØ[››Ý™]ÚÛ[››Ý][Û—›ÜŽˆ	Ü™YŸK˜
NÂˆJJNÂˆ[]H[››Ý][Û‹šYÂˆBˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆBˆ\Þ[˜ÈØ]™S™]Ð[››Ý][ÛœÊ[™\‹\ÚË[››Ý][ÛœË[XYÙT›ÛZ\Ù\ËÚ[™Ù\ÊHÂˆYˆ
\Ëž˜Q˜XÝÜžJHÂˆ›ÝÈ™]È\œ›ÜŠ–NˆØ[››ÝØ]™H™]È[››Ý][ÛœËˆŠNÂˆBˆÛÛœÝ\X[]˜[X]ÜˆH\Ë—ØÜ™X]T\X[]˜[X]ÜŠ[™\ŠNÂˆÛÛœÝ[]Y[››Ý][ÛœÈH™]È™Y”Ù]

NÂˆÛÛœÝ^\Ý[™Ð[››Ý][ÛœÈH™]È™Y”Ù]

NÂˆ]ØZ]\ËˆÜ™\XÙRYžT™YŠ[››Ý][ÛœË[]Y[››Ý][ÛœË^\Ý[™Ð[››Ý][ÛœÊNÂˆÛÛœÝYÙQXÝH\ËœYÙQXÝÂˆÛÛœÝ[››Ý][ÛœÐ\œ˜^HH\Ë˜[››Ý][ÛœË™š[\ŠHOˆJH[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆ[]Y[››Ý][ÛœËš\ÊJJJNÂˆÛÛœÝ™]Ñ]HH]ØZ][››Ý][Û‘˜XÝÜžKœØ]™S™]Ð[››Ý][ÛœÊ\X[]˜[X]Ü‹\Ëž™Y‹\ÚË[››Ý][ÛœË[XYÙT›ÛZ\Ù\ËÚ[™Ù\ÊNÂˆ›Üˆ
ÛÛœÝÂˆ™Y‚ˆHÙˆ™]Ñ]K˜[››Ý][ÛœÊHÂˆYˆ
™Yˆ[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆY^\Ý[™Ð[››Ý][ÛœËš\Ê™YŠJHÂˆ[››Ý][ÛœÐ\œ˜^Kœ\Ú
™YŠNÂˆBˆBˆÛÛœÝXÝHYÙQXÝ˜ÛÛ™J
NÂˆXÝœÙ]
[››ÝÈ‹[››Ý][ÛœÐ\œ˜^JNÂˆÚ[™Ù\Ëœ]
\Ëœ™Y‹Âˆ]NˆXÝˆJNÂˆ›Üˆ
ÛÛœÝ[]Y™YˆÙˆ[]Y[››Ý][ÛœÊHÂˆÚ[™Ù\Ëœ]
[]Y™Y‹Âˆ]Nˆ[ˆJNÂˆBˆBˆ\Þ[˜ÈØ]™J[™\‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊHÂˆÛÛœÝ\X[]˜[X]ÜˆH\Ë—ØÜ™X]T\X[]˜[X]ÜŠ[™\ŠNÂˆÛÛœÝ[››Ý][ÛœÈH]ØZ]\Ë—Ü\œÙY[››Ý][ÛœÎÂˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆ›Üˆ
ÛÛœÝ[››Ý][ÛˆÙˆ[››Ý][ÛœÊHÂˆ›ÛZ\Ù\Ëœ\Ú
[››Ý][Û‹œØ]™J\X[]˜[X]Ü‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊK˜Ø]Ú
[˜Ý[Ûˆ
™X\ÛÛŠHÂˆØ\›ŠœØ]™HHYÛ›Üš[™È[››Ý][Ûˆ]H\š[™Èˆ
È‰Ý\ÚË›˜[Y_Hˆ\ÚÎˆ‰Ü™X\ÛÛŸH‹˜
NÂˆ™]\›ˆ[ÂˆJJNÂˆBˆ™]\›ˆ›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆBˆ\Þ[˜ÈØY™\ÛÝ\˜Ù\ÊÙ^\ÊHÂˆ]ØZ]
\ËˆÜ™\ÛÝ\˜Ù\Ô›ÛZ\ÙHÏÏH\Ëœ“X[˜YÙ\‹™[œÝ\™J\Ëœ™\ÛÝ\˜Ù\ÈŠJNÂˆ]ØZ]Øš™XÝØY\‹›ØY
\Ëœ™\ÛÝ\˜Ù\ËÙ^\Ë\Ëž™YŠNÂˆBˆ\Þ[˜ÈÙÙ]Y\™ÙY™\ÛÝ\˜Ù\ÊÝ™X[QXÝÙ^\ÊHÂˆÛÛœÝØØ[™\ÛÝ\˜Ù\ÈHÝ™X[QXÝË™Ù]
”™\ÛÝ\˜Ù\ÈŠNÂˆYˆ
JØØ[™\ÛÝ\˜Ù\È[œÝ[˜Ù[ÙˆXÝ	‰ˆØØ[™\ÛÝ\˜Ù\ËœÚ^™JJHÂˆ™]\›ˆ\Ëœ™\ÛÝ\˜Ù\ÎÂˆBˆ]ØZ]Øš™XÝØY\‹›ØY
ØØ[™\ÛÝ\˜Ù\ËÙ^\Ë\Ëž™YŠNÂˆ™]\›ˆXÝ›Y\™ÙJÂˆ™YŽˆ\Ëž™Y‹ˆXÝ\œ˜^NˆÛØØ[™\ÛÝ\˜Ù\Ë\Ëœ™\ÛÝ\˜Ù\×KˆY\™ÙTÝX‘XÝÎˆYBˆJNÂˆBˆ\Þ[˜ÈÙ]Ü\˜]Ü“\Ý
Âˆ[™\‹ˆÚ[šËˆ\ÚËˆ[[ˆØXÚRÙ^KˆYÙR[™^H\ËœYÙR[™^ˆ[››Ý][Û”ÝÜ˜YÙHH[ˆ[ÙYšYYYÈH[ˆJHÂˆÛÛœÝÛÛ[Ý™X[T›ÛZ\ÙHH\Ë™Ù]ÛÛ[Ý™X[J
NÂˆÛÛœÝ™\ÛÝ\˜Ù\Ô›ÛZ\ÙHH\Ë›ØY™\ÛÝ\˜Ù\Ê‘TÓÕTÑT×ÒÑVT×ÓÔTUÔ—ÓTÕ
NÂˆÛÛœÝ\X[]˜[X]ÜˆH\Ë—ØÜ™X]T\X[]˜[X]ÜŠ[™\‹YÙR[™^
NÂˆÛÛœÝ™]Ð[››ÝÐžTYÙHH]\Ëž˜Q˜XÝÜžHÈÙ]™]Ð[››Ý][ÛœÓX\
[››Ý][Û”ÝÜ˜YÙJHˆ[ÂˆÛÛœÝ™]Ð[››ÝÈH™]Ð[››ÝÐžTYÙOË™Ù]
\ËœYÙR[™^
NÂˆ]™]Ð[››Ý][ÛœÔ›ÛZ\ÙHH›ÛZ\ÙKœ™\ÛÛ™J[
NÂˆ][]Y[››Ý][ÛœÈH[ÂˆYˆ
™]Ð[››ÝÊHÂˆÛÛœÝ[››Ý][Û‘ÛØ˜[Ô›ÛZ\ÙHH\Ëœ“X[˜YÙ\‹™[œÝ\™QØÊ˜[››Ý][Û‘ÛØ˜[ÈŠNÂˆ][XYÙT›ÛZ\Ù\ÎÂˆÛÛœÝZ\ÜÚ[™Ðš]X\ÈH™]ÈÙ]

NÂˆ›Üˆ
ÛÛœÝÂˆš]X\Yˆš]X\ˆHÙˆ™]Ð[››ÝÊHÂˆYˆ
š]X\Y	‰ˆXš]X\	‰ˆ[Z\ÜÚ[™Ðš]X\Ëš\Êš]X\Y
JHÂˆZ\ÜÚ[™Ðš]X\Ë˜Y
š]X\Y
NÂˆBˆBˆÛÛœÝÂˆ\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜYˆHH\Ë™]˜[X]Ü“Ü[ÛœÎÂˆYˆ
Z\ÜÚ[™Ðš]X\ËœÚ^™Hˆ
HÂˆÛÛœÝ[››Ý][Û•Ú]š]X\ÈH™]Ð[››ÝËœÛXÙJ
NÂˆ›Üˆ
ÛÛœÝÚÙ^K[››Ý][Û—HÙˆ[››Ý][Û”ÝÜ˜YÙJHÂˆYˆ
ZÙ^KœÝ\ÕÚ]
[››Ý][Û‘Y]Ü”™Yš^
JHÂˆÛÛ[YNÂˆBˆYˆ
[››Ý][Û‹˜š]X\	‰ˆZ\ÜÚ[™Ðš]X\Ëš\Ê[››Ý][Û‹˜š]X\Y
JHÂˆ[››Ý][Û•Ú]š]X\Ëœ\Ú
[››Ý][ÛŠNÂˆBˆBˆ[XYÙT›ÛZ\Ù\ÈH[››Ý][Û‘˜XÝÜžK™Ù[™\˜]R[XYÙ\Ê[››Ý][Û•Ú]š]X\Ë\Ëž™Y‹\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜY
NÂˆH[ÙHÂˆ[XYÙT›ÛZ\Ù\ÈH[››Ý][Û‘˜XÝÜžK™Ù[™\˜]R[XYÙ\Ê™]Ð[››ÝË\Ëž™Y‹\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜY
NÂˆBˆ[]Y[››Ý][ÛœÈH™]È™Y”Ù]

NÂˆ™]Ð[››Ý][ÛœÔ›ÛZ\ÙHH›ÛZ\ÙK˜[
Ø[››Ý][Û‘ÛØ˜[Ô›ÛZ\ÙK\ËˆÜ™\XÙRYžT™YŠ™]Ð[››ÝË[]Y[››Ý][ÛœË[
WJK[Š
Ø[››Ý][Û‘ÛØ˜[×JHOˆÂˆYˆ
X[››Ý][Û‘ÛØ˜[ÊHÂˆ™]\›ˆ[ÂˆBˆ™]\›ˆ[››Ý][Û‘˜XÝÜžKœš[™]Ð[››Ý][ÛœÊ[››Ý][Û‘ÛØ˜[Ë\X[]˜[X]Ü‹\ÚË™]Ð[››ÝË[XYÙT›ÛZ\Ù\ÊNÂˆJNÂˆBˆÛÛœÝYÙS\Ý›ÛZ\ÙHH›ÛZ\ÙK˜[
ØÛÛ[Ý™X[T›ÛZ\ÙK™\ÛÝ\˜Ù\Ô›ÛZ\ÙWJK[Š\Þ[˜È
ØÛÛ[Ý™X[WJHOˆÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH]ØZ]\ËˆÙÙ]Y\™ÙY™\ÛÝ\˜Ù\ÊÛÛ[Ý™X[K™XÝ‘TÓÕTÑT×ÒÑVT×ÓÔTUÔ—ÓTÕ
NÂˆÛÛœÝÜ\ÝH™]ÈÜ\˜]Ü“\Ý
[[Ú[šÊNÂˆ[™\‹œÙ[™
”Ý\™[™\”YÙH‹Âˆ˜[œÜ\™[˜ÞNˆ\X[]˜[X]Ü‹š\Ð›[™[Ù\Ê™\ÛÝ\˜Ù\Ë\Ë››Û›[™[Ù\ÔÙ]
KˆYÙR[™^ˆØXÚRÙ^BˆJNÂˆ]ØZ]\X[]˜[X]Ü‹™Ù]Ü\˜]Ü“\Ý
ÂˆÝ™X[NˆÛÛ[Ý™X[Kˆ\ÚËˆ™\ÛÝ\˜Ù\ËˆÜ\˜]Ü“\ÝˆÜ\ÝˆJNÂˆ™]\›ˆÜ\ÝÂˆJNÂˆ]ÜYÙSÜ\Ý[››Ý][ÛœË™]Ð[››Ý][Ûœ×HH]ØZ]›ÛZ\ÙK˜[
ÜYÙS\Ý›ÛZ\ÙK\Ë—Ü\œÙY[››Ý][ÛœË™]Ð[››Ý][ÛœÔ›ÛZ\ÙWJNÂˆYˆ
™]Ð[››Ý][ÛœÊHÂˆ[››Ý][ÛœÈH[››Ý][ÛœË™š[\ŠHOˆJKœ™Yˆ	‰ˆ[]Y[››Ý][ÛœËš\ÊKœ™YŠJJNÂˆ›Üˆ
]HHZHH™]Ð[››Ý][ÛœË›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝ™]Ð[››Ý][ÛˆH™]Ð[››Ý][ÛœÖÚWNÂˆYˆ
™]Ð[››Ý][Û‹œ™Y•Ô™\XÙJHÂˆÛÛœÝˆH[››Ý][ÛœË™š[™[™^
HOˆKœ™Yˆ	‰ˆ\Ô™YœÑ\]X[
Kœ™Y‹™]Ð[››Ý][Û‹œ™Y•Ô™\XÙJJNÂˆYˆ
ˆH
HÂˆ[››Ý][ÛœËœÜXÙJ‹K™]Ð[››Ý][ÛŠNÂˆ™]Ð[››Ý][ÛœËœÜXÙJKKKJNÂˆZKKNÂˆBˆBˆBˆ[››Ý][ÛœÈH[››Ý][ÛœË˜ÛÛ˜Ø]
™]Ð[››Ý][ÛœÊNÂˆBˆYˆ
[››Ý][ÛœË›[™ÝOOH[[	ˆ™[™\š[™Ò[[›YËS““ÕUSÓ”×ÑTÐP“JHÂˆYÙSÜ\Ý™›\Ú
YJNÂˆ™]\›ˆÂˆ[™ÝˆYÙSÜ\ÝÝ[[™ÝˆNÂˆBˆÛÛœÝ™[™\‘›Ü›\ÈHHJ[[	ˆ™[™\š[™Ò[[›YËS““ÕUSÓ”×Ñ“Ô“TÊKˆ\ÑY][™ÈHHJ[[	ˆ™[™\š[™Ò[[›YË’T×ÑQUS‘ÊKˆ[[[žHHHJ[[	ˆ™[™\š[™Ò[[›YËS–JKˆ[[\Ü^HHHJ[[	ˆ™[™\š[™Ò[[›YË‘TÔVJKˆ[[š[HHJ[[	ˆ™[™\š[™Ò[[›YË”’S•
NÂˆÛÛœÝÜ\Ý›ÛZ\Ù\ÈH×NÂˆ›Üˆ
ÛÛœÝ[››Ý][ÛˆÙˆ[››Ý][ÛœÊHÂˆYˆ
[[[žH[[\Ü^H	‰ˆ[››Ý][Û‹›]\Ý™UšY]ÙY
[››Ý][Û”ÝÜ˜YÙK™[™\‘›Ü›\ÊH	‰ˆ[››Ý][Û‹›]\Ý™UšY]ÙYÚ[‘Y][™Ê\ÑY][™Ë[ÙYšYYYÊH[[š[	‰ˆ[››Ý][Û‹›]\Ý™Tš[Y
[››Ý][Û”ÝÜ˜YÙJJHÂˆÜ\Ý›ÛZ\Ù\Ëœ\Ú
[››Ý][Û‹™Ù]Ü\˜]Ü“\Ý
\X[]˜[X]Ü‹\ÚË[[[››Ý][Û”ÝÜ˜YÙJK˜Ø]Ú
[˜Ý[Ûˆ
™X\ÛÛŠHÂˆØ\›Š™Ù]Ü\˜]Ü“\ÝHYÛ›Üš[™È[››Ý][Ûˆ]H\š[™Èˆ
È‰Ý\ÚË›˜[Y_Hˆ\ÚÎˆ‰Ü™X\ÛÛŸH‹˜
NÂˆ™]\›ˆÂˆÜ\Ýˆ[ˆÙ\\˜]Q›Ü›Nˆ˜[ÙKˆÙ\\˜]PØ[˜\Îˆ˜[ÙBˆNÂˆJJNÂˆBˆBˆÛÛœÝÜ\ÝÈH]ØZ]›ÛZ\ÙK˜[
Ü\Ý›ÛZ\Ù\ÊNÂˆ]›Ü›HH˜[ÙKˆØ[˜\ÈH˜[ÙNÂˆ›Üˆ
ÛÛœÝÂˆÜ\ÝˆÙ\\˜]Q›Ü›KˆÙ\\˜]PØ[˜\ÂˆHÙˆÜ\ÝÊHÂˆYÙSÜ\Ý˜YÜ\Ý
Ü\Ý
NÂˆ›Ü›HHÙ\\˜]Q›Ü›NÂˆØ[˜\ÈHÙ\\˜]PØ[˜\ÎÂˆBˆYÙSÜ\Ý™›\Ú
YKÂˆ›Ü›KˆØ[˜\ÂˆJNÂˆ™]\›ˆÂˆ[™ÝˆYÙSÜ\ÝÝ[[™ÝˆNÂˆBˆ\Þ[˜È^˜XÝ^ÛÛ[
Âˆ[™\‹ˆ\ÚËˆ[˜ÛYSX\šÙYÛÛ[ˆ\ØX›S›Ü›X[^˜][Û‹ˆÚ[šËˆ[\œÙXÝÜˆH[ˆJHÂˆÛÛœÝÛÛ[Ý™X[T›ÛZ\ÙHH\Ë™Ù]ÛÛ[Ý™X[J
NÂˆÛÛœÝ™\ÛÝ\˜Ù\Ô›ÛZ\ÙHH\Ë›ØY™\ÛÝ\˜Ù\Ê‘TÓÕTÑT×ÒÑVT×ÕVÐÓÓ•S•
NÂˆÛÛœÝ[™Ô›ÛZ\ÙHH\Ëœ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ›[™ÈŠNÂˆÛÛœÝØÛÛ[Ý™X[K[™×HH]ØZ]›ÛZ\ÙK˜[
ØÛÛ[Ý™X[T›ÛZ\ÙK™\ÛÝ\˜Ù\Ô›ÛZ\ÙK[™Ô›ÛZ\ÙWJNÂˆÛÛœÝ™\ÛÝ\˜Ù\ÈH]ØZ]\ËˆÙÙ]Y\™ÙY™\ÛÝ\˜Ù\ÊÛÛ[Ý™X[K™XÝ‘TÓÕTÑT×ÒÑVT×ÕVÐÓÓ•S•
NÂˆÛÛœÝ\X[]˜[X]ÜˆH\Ë—ØÜ™X]T\X[]˜[X]ÜŠ[™\ŠNÂˆ™]\›ˆ\X[]˜[X]Ü‹™Ù]^ÛÛ[
ÂˆÝ™X[NˆÛÛ[Ý™X[Kˆ\ÚËˆ™\ÛÝ\˜Ù\Ëˆ[˜ÛYSX\šÙYÛÛ[ˆ\ØX›S›Ü›X[^˜][Û‹ˆÚ[šËˆšY]Ð›Þˆ\ËšY]Ëˆ[™Ëˆ[\œÙXÝÜ‚ˆJNÂˆBˆ\Þ[˜ÈÙ]ÝXÝ™YJ
HÂˆÛÛœÝÝXÝ™YT›ÛÝH]ØZ]\Ëœ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœÝXÝ™YT›ÛÝŠNÂˆYˆ
\ÝXÝ™YT›ÛÝ
HÂˆ™]\›ˆ[ÂˆBˆ]ØZ]\Ë—Ü\œÙY[››Ý][ÛœÎÂˆžHÂˆÛÛœÝÝXÝ™YHH]ØZ]\Ëœ“X[˜YÙ\‹™[œÝ\™J\Ë—Ü\œÙTÝXÝ™YH‹ÜÝXÝ™YT›ÛÝJNÂˆ™]\›ˆ]ØZ]\Ëœ“X[˜YÙ\‹™[œÝ\™JÝXÝ™YKœÙ\šX[^˜X›HŠNÂˆHØ]Ú
^
HÂˆØ\›ŠÙ]ÝXÝ™YNˆ‰Ù^H‹˜
NÂˆ™]\›ˆ[ÂˆBˆBˆÜ\œÙTÝXÝ™YJÝXÝ™YT›ÛÝ
HÂˆÛÛœÝ™YHH™]ÈÝXÝ™YTYÙJÝXÝ™YT›ÛÝ\ËœYÙQXÝ
NÂˆ™YKœ\œÙJ\Ëœ™YŠNÂˆ™]\›ˆ™YNÂˆBˆ\Þ[˜ÈÙ][››Ý][ÛœÑ]J[™\‹\ÚË[[
HÂˆÛÛœÝ[››Ý][ÛœÈH]ØZ]\Ë—Ü\œÙY[››Ý][ÛœÎÂˆYˆ
[››Ý][ÛœË›[™ÝOOH
HÂˆ™]\›ˆ[››Ý][ÛœÎÂˆBˆÛÛœÝ[››Ý][ÛœÑ]HH×Kˆ^ÛÛ[›ÛZ\Ù\ÈH×NÂˆ]\X[]˜[X]ÜŽÂˆÛÛœÝ[[[žHHHJ[[	ˆ™[™\š[™Ò[[›YËS–JKˆ[[\Ü^HHHJ[[	ˆ™[™\š[™Ò[[›YË‘TÔVJKˆ[[š[HHJ[[	ˆ™[™\š[™Ò[[›YË”’S•
NÂˆÛÛœÝYÚYÚY[››Ý][ÛœÈH×NÂˆ›Üˆ
ÛÛœÝ[››Ý][ÛˆÙˆ[››Ý][ÛœÊHÂˆÛÛœÝ\Õš\ÚX›HH[[[žH[[\Ü^H	‰ˆ[››Ý][Û‹šY]ØX›NÂˆYˆ
\Õš\ÚX›H[[š[	‰ˆ[››Ý][Û‹œš[X›JHÂˆ[››Ý][ÛœÑ]Kœ\Ú
[››Ý][Û‹™]JNÂˆBˆYˆ
[››Ý][Û‹š\Õ^ÛÛ[	‰ˆ\Õš\ÚX›JHÂˆ\X[]˜[X]ÜˆÏÏH\Ë—ØÜ™X]T\X[]˜[X]ÜŠ[™\ŠNÂˆ^ÛÛ[›ÛZ\Ù\Ëœ\Ú
[››Ý][Û‹™^˜XÝ^ÛÛ[
\X[]˜[X]Ü‹\ÚËËR[™š[š]KR[™š[š]K[™š[š]K[™š[š]WJK˜Ø]Ú
[˜Ý[Ûˆ
™X\ÛÛŠHÂˆØ\›ŠÙ][››Ý][ÛœÑ]HHYÛ›Üš[™È^ÛÛ[\š[™È‰Ý\ÚË›˜[Y_Hˆ\ÚÎˆ‰Ü™X\ÛÛŸH‹˜
NÂˆJJNÂˆH[ÙHYˆ
[››Ý][Û‹›Ý™\›^\Õ^ÛÛ[	‰ˆ\Õš\ÚX›JHÂˆYÚYÚY[››Ý][ÛœËœ\Ú
[››Ý][ÛŠNÂˆBˆBˆYˆ
YÚYÚY[››Ý][ÛœË›[™Ýˆ
HÂˆÛÛœÝ[\œÙXÝÜˆH™]È[\œÙXÝÜŠYÚYÚY[››Ý][ÛœÊNÂˆ^ÛÛ[›ÛZ\Ù\Ëœ\Ú
\Ë™^˜XÝ^ÛÛ[
Âˆ[™\‹ˆ\ÚËˆ[˜ÛYSX\šÙYÛÛ[ˆ˜[ÙKˆ\ØX›S›Ü›X[^˜][ÛŽˆ˜[ÙKˆÚ[šÎˆ[ˆ[\œÙXÝÜ‚ˆJK[Š

HOˆÂˆ[\œÙXÝÜ‹œÙ]^

NÂˆJJNÂˆBˆ]ØZ]›ÛZ\ÙK˜[
^ÛÛ[›ÛZ\Ù\ÊNÂˆ™]\›ˆ[››Ý][ÛœÑ]NÂˆBˆÙ][››Ý][ÛœÊ
HÂˆÛÛœÝ[››ÝÈH\ËˆÙÙ][š\š]X›T›Ü\J[››ÝÈŠNÂˆ™]\›ˆÚYÝÊ\Ë˜[››Ý][ÛœÈ‹\œ˜^Kš\Ð\œ˜^J[››ÝÊHÈ[››ÝÈˆ×JNÂˆBˆÙ]Ü\œÙY[››Ý][ÛœÊ
HÂˆÛÛœÝ›ÛZ\ÙHH\Ëœ“X[˜YÙ\‹™[œÝ\™J\Ë˜[››Ý][ÛœÈŠK[Š\Þ[˜È[››ÝÈOˆÂˆYˆ
[››ÝË›[™ÝOOH
HÂˆ™]\›ˆ[››ÝÎÂˆBˆÛÛœÝØ[››Ý][Û‘ÛØ˜[ËšY[Øš™XÝ×HH]ØZ]›ÛZ\ÙK˜[
Ý\Ëœ“X[˜YÙ\‹™[œÝ\™QØÊ˜[››Ý][Û‘ÛØ˜[ÈŠK\Ëœ“X[˜YÙ\‹™[œÝ\™QØÊ™šY[Øš™XÝÈŠWJNÂˆYˆ
X[››Ý][Û‘ÛØ˜[ÊHÂˆ™]\›ˆ×NÂˆBˆÛÛœÝÜœ[‘šY[ÈHšY[Øš™XÝÏË›Üœ[‘šY[ÎÂˆÛÛœÝ[››Ý][Û”›ÛZ\Ù\ÈH×NÂˆ›Üˆ
ÛÛœÝ[››Ý][Û”™YˆÙˆ[››ÝÊHÂˆ[››Ý][Û”›ÛZ\Ù\Ëœ\Ú
[››Ý][Û‘˜XÝÜžK˜Ü™X]J\Ëž™Y‹[››Ý][Û”™Y‹[››Ý][Û‘ÛØ˜[Ë\Ë—ÛØØ[Y˜XÝÜžK˜[ÙKÜœ[‘šY[Ë[\Ëœ™YŠK˜Ø]Ú
[˜Ý[Ûˆ
™X\ÛÛŠHÂˆØ\›ŠÜ\œÙY[››Ý][ÛœÎˆ‰Ü™X\ÛÛŸH‹˜
NÂˆ™]\›ˆ[ÂˆJJNÂˆBˆÛÛœÝÛÜY[››Ý][ÛœÈH×NÂˆ]Ü\[››Ý][ÛœËÚYÙ][››Ý][ÛœÎÂˆ›Üˆ
ÛÛœÝ[››Ý][ÛˆÙˆ]ØZ]›ÛZ\ÙK˜[
[››Ý][Û”›ÛZ\Ù\ÊJHÂˆYˆ
X[››Ý][ÛŠHÂˆÛÛ[YNÂˆBˆYˆ
[››Ý][Ûˆ[œÝ[˜Ù[ÙˆÚYÙ][››Ý][ÛŠHÂˆ
ÚYÙ][››Ý][ÛœÈH×JKœ\Ú
[››Ý][ÛŠNÂˆÛÛ[YNÂˆBˆYˆ
[››Ý][Ûˆ[œÝ[˜Ù[ÙˆÜ\[››Ý][ÛŠHÂˆ
Ü\[››Ý][ÛœÈH×JKœ\Ú
[››Ý][ÛŠNÂˆÛÛ[YNÂˆBˆÛÜY[››Ý][ÛœËœ\Ú
[››Ý][ÛŠNÂˆBˆYˆ
ÚYÙ][››Ý][ÛœÊHÂˆÛÜY[››Ý][ÛœËœ\Ú
‹‹ÚYÙ][››Ý][ÛœÊNÂˆBˆYˆ
Ü\[››Ý][ÛœÊHÂˆÛÜY[››Ý][ÛœËœ\Ú
‹‹œÜ\[››Ý][ÛœÊNÂˆBˆ™]\›ˆÛÜY[››Ý][ÛœÎÂˆJNÂˆ™]\›ˆÚYÝÊ\Ë—Ü\œÙY[››Ý][ÛœÈ‹›ÛZ\ÙJNÂˆBˆÙ]œÐXÝ[ÛœÊ
HÂˆÛÛœÝXÝ[ÛœÈHÛÛXÝXÝ[ÛœÊ\Ëž™Y‹\ËœYÙQXÝYÙPXÝ[Û‘]™[\JNÂˆ™]\›ˆÚYÝÊ\ËšœÐXÝ[ÛœÈ‹XÝ[ÛœÊNÂˆBˆ\Þ[˜ÈÛÛXÝ[››Ý][ÛœÐžU\J[™\‹\ÚË\\Ë›ÛZ\Ù\Ë[››Ý][Û‘ÛØ˜[ÊHÂˆÛÛœÝÂˆYÙR[™^ˆHH\ÎÂˆYˆ
Øš™XÝš\ÓÝÛŠ\Ë—Ü\œÙY[››Ý][ÛœÈŠJHÂˆÛÛœÝØXÚY[››Ý][ÛœÈH]ØZ]\Ë—Ü\œÙY[››Ý][ÛœÎÂˆ›Üˆ
ÛÛœÝÂˆ]BˆHÙˆØXÚY[››Ý][ÛœÊHÂˆYˆ
]\\È\\Ëš\Ê]K˜[››Ý][Û•\JJHÂˆ]KœYÙR[™^HYÙR[™^Âˆ›ÛZ\Ù\Ëœ\Ú
›ÛZ\ÙKœ™\ÛÛ™J]JJNÂˆBˆBˆ™]\›ŽÂˆBˆÛÛœÝ[››ÝÈH]ØZ]\Ëœ“X[˜YÙ\‹™[œÝ\™J\Ë˜[››Ý][ÛœÈŠNÂˆ]\X[]˜[X]ÜŽÂˆ›Üˆ
ÛÛœÝ[››Ý][Û”™YˆÙˆ[››ÝÊHÂˆ›ÛZ\Ù\Ëœ\Ú
[››Ý][Û‘˜XÝÜžK˜Ü™X]J\Ëž™Y‹[››Ý][Û”™Y‹[››Ý][Û‘ÛØ˜[Ë\Ë—ÛØØ[Y˜XÝÜžK˜[ÙK[\\Ë\Ëœ™YŠK[Š\Þ[˜È[››Ý][ÛˆOˆÂˆYˆ
X[››Ý][ÛŠHÂˆ™]\›ˆ[ÂˆBˆ[››Ý][Û‹™]KœYÙR[™^HYÙR[™^ÂˆYˆ
[››Ý][Û‹š\Õ^ÛÛ[	‰ˆ[››Ý][Û‹šY]ØX›JHÂˆ\X[]˜[X]ÜˆÏÏH\Ë—ØÜ™X]T\X[]˜[X]ÜŠ[™\ŠNÂˆ]ØZ][››Ý][Û‹™^˜XÝ^ÛÛ[
\X[]˜[X]Ü‹\ÚËËR[™š[š]KR[™š[š]K[™š[š]K[™š[š]WJNÂˆBˆ™]\›ˆ[››Ý][Û‹™]NÂˆJK˜Ø]Ú
[˜Ý[Ûˆ
™X\ÛÛŠHÂˆØ\›ŠÛÛXÝ[››Ý][ÛœÐžU\Nˆ‰Ü™X\ÛÛŸH‹˜
NÂˆ™]\›ˆ[ÂˆJJNÂˆBˆBŸB˜ÛÛœÝ—ÒPQT—ÔÒQÓUT‘HH™]ÈZ[\œ˜^JÌKL‹™JNÂ˜ÛÛœÝÕT•‘Q—ÔÒQÓUT‘HH™]ÈZ[\œ˜^JÌÌËÍŒKÌ‹ÍÎÌ‹K—JNÂ˜ÛÛœÝS‘Ð’—ÔÒQÓUT‘HH™]ÈZ[\œ˜^JÌK™K™‹Œ‹˜WJNÂ™[˜Ý[Ûˆš[™
Ý™X[KÚYÛ˜]\™K[Z]HL˜XÚÝØ\™ÈH˜[ÙJHÂˆÛÛœÝÚYÛ˜]\™S[™ÝHÚYÛ˜]\™K›[™ÝÂˆÛÛœÝØØ[ž]\ÈHÝ™X[KœYZÐž]\Ê[Z]
NÂˆÛÛœÝØØ[“[™ÝHØØ[ž]\Ë›[™ÝHÚYÛ˜]\™S[™ÝÂˆYˆ
ØØ[“[™ÝH
HÂˆ™]\›ˆ˜[ÙNÂˆBˆYˆ
˜XÚÝØ\™ÊHÂˆÛÛœÝÚYÛ˜]\™Q[™HÚYÛ˜]\™S[™ÝHNÂˆ]ÜÈHØØ[ž]\Ë›[™ÝHNÂˆÚ[H
ÜÈHÚYÛ˜]\™Q[™
HÂˆ]ˆHÂˆÚ[H
ˆÚYÛ˜]\™S[™Ý	‰ˆØØ[ž]\ÖÜÜÈH—HOOHÚYÛ˜]\™VÜÚYÛ˜]\™Q[™H—JHÂˆŠÊÎÂˆBˆYˆ
ˆHÚYÛ˜]\™S[™Ý
HÂˆÝ™X[KœÜÈ
ÏHÜÈHÚYÛ˜]\™Q[™Âˆ™]\›ˆYNÂˆBˆÜËKNÂˆBˆH[ÙHÂˆ]ÜÈHÂˆÚ[H
ÜÈHØØ[“[™Ý
HÂˆ]ˆHÂˆÚ[H
ˆÚYÛ˜]\™S[™Ý	‰ˆØØ[ž]\ÖÜÜÈ
È—HOOHÚYÛ˜]\™VÚ—JHÂˆŠÊÎÂˆBˆYˆ
ˆHÚYÛ˜]\™S[™Ý
HÂˆÝ™X[KœÜÈ
ÏHÜÎÂˆ™]\›ˆYNÂˆBˆÜÊÊÎÂˆBˆBˆ™]\›ˆ˜[ÙNÂŸB˜Û\ÜÈ‘ØÝ[Y[ÂˆÜYÙT›ÛZ\Ù\ÈH™]ÈX\

NÂˆÜÚYÛ˜]\™Q]HH[ÂˆÝ™\œÚ[ÛˆH[ÂˆÛÛœÝXÝÜŠ“X[˜YÙ\‹Ý™X[JHÂˆYˆ
Ý™X[K›[™ÝH
HÂˆ›ÝÈ™]È[˜[Y‘^Ù\[ÛŠ•Hˆš[H\È[\KK™Kˆ]ÈÚ^™H\È™\›Èž]\ËˆŠNÂˆBˆ\Ëœ“X[˜YÙ\ˆH“X[˜YÙ\ŽÂˆ\ËœÝ™X[HHÝ™X[NÂˆ\Ëž™YˆH™]È™YŠÝ™X[K“X[˜YÙ\ŠNÂˆÛÛœÝYÛÝ[\œÈHÂˆ›ÛˆˆNÂˆ\Ë—ÙÛØ˜[Y˜XÝÜžHHÛ\ÜÈÂˆÝ]XÈÙ]ØÒY

HÂˆ™]\›ˆ×ÉÜ“X[˜YÙ\‹™ØÒYXÂˆBˆÝ]XÈÜ™X]Q›ÛY

HÂˆ™]\›ˆ‰ÊÊÚYÛÝ[\œË™›ÛXÂˆBˆÝ]XÈÜ™X]SØš’Y

HÂˆ[œ™XXÚX›JXœÝ˜XÝY]ÙÜ™X]SØš’YØ[YˆŠNÂˆBˆÝ]XÈÙ]YÙSØš’Y

HÂˆ[œ™XXÚX›JXœÝ˜XÝY]ÙÙ]YÙSØš’YØ[YˆŠNÂˆBˆNÂˆBˆ\œÙJ™XÛÝ™\žS[ÙJHÂˆ\Ëž™Y‹œ\œÙJ™XÛÝ™\žS[ÙJNÂˆ\Ë˜Ø][ÙÈH™]ÈØ][ÙÊ\Ëœ“X[˜YÙ\‹\Ëž™YŠNÂˆBˆÙ][™X\š^˜][ÛŠ
HÂˆ][™X\š^˜][ÛˆH[ÂˆžHÂˆ[™X\š^˜][ÛˆH[™X\š^˜][Û‹˜Ü™X]J\ËœÝ™X[JNÂˆHØ]Ú
\œŠHÂˆYˆ
\œˆ[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈ\œŽÂˆBˆ[™›Ê\œŠNÂˆBˆ™]\›ˆÚYÝÊ\Ë›[™X\š^˜][Ûˆ‹[™X\š^˜][ÛŠNÂˆBˆÙ]Ý\™YŠ
HÂˆÛÛœÝÝ™X[HH\ËœÝ™X[NÂˆ]Ý\™YˆHÂˆYˆ
\Ë›[™X\š^˜][ÛŠHÂˆÝ™X[Kœ™\Ù]

NÂˆYˆ
š[™
Ý™X[KS‘Ð’—ÔÒQÓUT‘JJHÂˆÝ™X[KœÚÚ\
ŠNÂˆ]ÚHÝ™X[KœYZÐž]J
NÂˆÚ[H
\ÕÚ]TÜXÙJÚ
JHÂˆÝ™X[KœÜÊÊÎÂˆÚHÝ™X[KœYZÐž]J
NÂˆBˆÝ\™YˆHÝ™X[KœÜÈHÝ™X[KœÝ\ÂˆBˆH[ÙHÂˆÛÛœÝÝ\HLÂˆÛÛœÝÝ\™Y“[™ÝHÕT•‘Q—ÔÒQÓUT‘K›[™ÝÂˆ]›Ý[™H˜[ÙKˆÜÈHÝ™X[K™[™ÂˆÚ[H
Y›Ý[™	‰ˆÜÈˆ
HÂˆÜÈOHÝ\HÝ\™Y“[™ÝÂˆYˆ
ÜÈ
HÂˆÜÈHÂˆBˆÝ™X[KœÜÈHÜÎÂˆ›Ý[™Hš[™
Ý™X[KÕT•‘Q—ÔÒQÓUT‘KÝ\YJNÂˆBˆYˆ
›Ý[™
HÂˆÝ™X[KœÚÚ\
JNÂˆ]ÚÂˆÈÂˆÚHÝ™X[K™Ù]ž]J
NÂˆHÚ[H
\ÕÚ]TÜXÙJÚ
JNÂˆ]ÝˆHˆŽÂˆÚ[H
ÚHŒ	‰ˆÚHÎJHÂˆÝˆ
ÏHÝš[™Ë™œ›ÛPÚ\ÛÙJÚ
NÂˆÚHÝ™X[K™Ù]ž]J
NÂˆBˆÝ\™YˆH\œÙR[
Ý‹L
NÂˆYˆ
\Ó˜SŠÝ\™YŠJHÂˆÝ\™YˆHÂˆBˆBˆBˆ™]\›ˆÚYÝÊ\ËœÝ\™Yˆ‹Ý\™YŠNÂˆBˆÚXÚÒXY\Š
HÂˆÛÛœÝÝ™X[HH\ËœÝ™X[NÂˆÝ™X[Kœ™\Ù]

NÂˆYˆ
Yš[™
Ý™X[K—ÒPQT—ÔÒQÓUT‘JJHÂˆ™]\›ŽÂˆBˆÝ™X[K›[Ý™TÝ\

NÂˆÝ™X[KœÚÚ\
—ÒPQT—ÔÒQÓUT‘K›[™Ý
NÂˆ]™\œÚ[ÛˆHˆ‹ˆÚÂˆÚ[H

ÚHÝ™X[K™Ù]ž]J
JHˆŒ	‰ˆ™\œÚ[Û‹›[™ÝÊHÂˆ™\œÚ[Ûˆ
ÏHÝš[™Ë™œ›ÛPÚ\ÛÙJÚ
NÂˆBˆYˆ
—Õ‘T”ÒSÓ—Ô‘QÑV\Ý
™\œÚ[ÛŠJHÂˆ\ËˆÝ™\œÚ[ÛˆH™\œÚ[ÛŽÂˆH[ÙHÂˆØ\›Š[˜[YˆXY\ˆ™\œÚ[ÛŽˆ	Ý™\œÚ[ÛŸX
NÂˆBˆBˆ\œÙTÝ\™YŠ
HÂˆ\Ëž™Y‹œÙ]Ý\™YŠ\ËœÝ\™YŠNÂˆBˆÙ][TYÙ\Ê
HÂˆ][HHÂˆYˆ
\Ë˜Ø][ÙËš\ÐXÝX[[TYÙ\ÊHÂˆ[HH\Ë˜Ø][ÙË›[TYÙ\ÎÂˆH[ÙHYˆ
\Ëž˜Q˜XÝÜžJHÂˆ[HH\Ëž˜Q˜XÝÜžK™Ù][TYÙ\Ê
NÂˆH[ÙHYˆ
\Ë›[™X\š^˜][ÛŠHÂˆ[HH\Ë›[™X\š^˜][Û‹›[TYÙ\ÎÂˆH[ÙHÂˆ[HH\Ë˜Ø][ÙË›[TYÙ\ÎÂˆBˆ™]\›ˆÚYÝÊ\Ë›[TYÙ\È‹[JNÂˆBˆÚ\ÓÛ›QØÝ[Y[ÚYÛ˜]\™\ÊšY[Ë™XÝ\œÚ[Û‘\H
HÂˆÛÛœÝ‘PÕT”ÒSÓ—ÓSRUHLÂˆYˆ
P\œ˜^Kš\Ð\œ˜^JšY[ÊJHÂˆ™]\›ˆ˜[ÙNÂˆBˆ™]\›ˆšY[Ë™]™\žJšY[OˆÂˆšY[H\Ëž™Y‹™™]ÚY”™YŠšY[
NÂˆYˆ
JšY[[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ˆ˜[ÙNÂˆBˆYˆ
šY[š\Ê’ÚYÈŠJHÂˆYˆ

ÊÜ™XÝ\œÚ[Û‘\ˆ‘PÕT”ÒSÓ—ÓSRU
HÂˆØ\›ŠˆÚ\ÓÛ›QØÝ[Y[ÚYÛ˜]\™\ÎˆX^[][H™XÝ\œÚ[Ûˆ\™XXÚYŠNÂˆ™]\›ˆ˜[ÙNÂˆBˆ™]\›ˆ\ËˆÚ\ÓÛ›QØÝ[Y[ÚYÛ˜]\™\ÊšY[™Ù]
’ÚYÈŠK™XÝ\œÚ[Û‘\
NÂˆBˆÛÛœÝ\ÔÚYÛ˜]\™HH\Ó˜[YJÙ][š\š]X›T›Ü\JÂˆXÝˆšY[ˆÙ^Nˆ‘•‚ˆJK”ÚYÈŠNÂˆÛÛœÝ™XÝ[™ÛHHšY[™Ù]
”™XÝŠNÂˆÛÛœÝ\Ò[š\ÚX›HH\œ˜^Kš\Ð\œ˜^J™XÝ[™ÛJH	‰ˆ™XÝ[™ÛK™]™\žJ˜[YHOˆ˜[YHOOH
NÂˆ™]\›ˆ\ÔÚYÛ˜]\™H	‰ˆ\Ò[š\ÚX›NÂˆJNÂˆBˆÙ]Þ˜TÝ™X[\Ê
HÂˆÛÛœÝÂˆXÜ›Ñ›Ü›BˆHH\Ë˜Ø][ÙÎÂˆYˆ
XXÜ›Ñ›Ü›JHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ˜HHXÜ›Ñ›Ü›K™Ù]
–HŠNÂˆÛÛœÝ[šY\ÈH™]ÈX\
Èžž‹[\]H‹™]\Ù]È‹˜ÛÛ™šYÈ‹˜ÛÛ›™XÝ[Û”Ù]‹›ØØ[TÙ]‹œÝ[\ÚY]‹‹Þž—K›X\
HOˆÙK[JJNÂˆYˆ
˜H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[H	‰ˆ^˜Kš\Ñ[\JHÂˆ[šY\ËœÙ]
žž‹˜JNÂˆ™]\›ˆ[šY\ÎÂˆBˆYˆ
P\œ˜^Kš\Ð\œ˜^J˜JH˜K›[™ÝOOH
HÂˆ™]\›ˆ[ÂˆBˆ›Üˆ
]HHZHH˜K›[™ÝÈHZNÈH
ÏHŠHÂˆ]˜[YNÂˆYˆ
HOOH
HÂˆ˜[YHHžžŽÂˆH[ÙHYˆ
HOOHZHHŠHÂˆ˜[YHH‹ÞžŽÂˆH[ÙHÂˆ˜[YHH˜VÚWNÂˆBˆYˆ
Y[šY\Ëš\Ê˜[YJJHÂˆÛÛ[YNÂˆBˆÛÛœÝ]HH\Ëž™Y‹™™]ÚY”™YŠ˜VÚH
ÈWJNÂˆYˆ
J]H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JH]Kš\Ñ[\JHÂˆÛÛ[YNÂˆBˆ[šY\ËœÙ]
˜[YK]JNÂˆBˆ™]\›ˆ[šY\ÎÂˆBˆÙ]˜Q]\Ù]Ê
HÂˆÛÛœÝÝ™X[\ÈH\Ë—Þ˜TÝ™X[\ÎÂˆYˆ
\Ý™X[\ÊHÂˆ™]\›ˆÚYÝÊ\Ëž˜Q]\Ù]È‹[
NÂˆBˆ›Üˆ
ÛÛœÝÙ^HÙˆÈ™]\Ù]È‹žž—JHÂˆÛÛœÝÝ™X[HHÝ™X[\Ë™Ù]
Ù^JNÂˆYˆ
\Ý™X[JHÂˆÛÛ[YNÂˆBˆžHÂˆÛÛœÝÝˆHÝš[™ÕÕUŽÝš[™ÊÝ™X[K™Ù]Ýš[™Ê
JNÂˆÛÛœÝ]HHÂˆÚÙ^WNˆÝ‚ˆNÂˆ™]\›ˆÚYÝÊ\Ëž˜Q]\Ù]È‹™]È]\Ù]™XY\Š]JJNÂˆHØ]ÚÂˆØ\›Š–HH[˜[Y]‹NÝš[™ËˆŠNÂˆœ™XZÎÂˆBˆBˆ™]\›ˆÚYÝÊ\Ëž˜Q]\Ù]È‹[
NÂˆBˆÙ]˜Q]J
HÂˆÛÛœÝÝ™X[\ÈH\Ë—Þ˜TÝ™X[\ÎÂˆYˆ
\Ý™X[\ÊHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ]HH™]ÈX\

NÂˆ›Üˆ
ÛÛœÝÚÙ^KÝ™X[WHÙˆÝ™X[\ÊHÂˆYˆ
\Ý™X[JHÂˆÛÛ[YNÂˆBˆžHÂˆ]KœÙ]
Ù^KÝš[™ÕÕUŽÝš[™ÊÝ™X[K™Ù]Ýš[™Ê
JJNÂˆHØ]ÚÂˆØ\›Š–HH[˜[Y]‹NÝš[™ËˆŠNÂˆ™]\›ˆ[ÂˆBˆBˆ™]\›ˆ]NÂˆBˆÙ]˜Q˜XÝÜžJ
HÂˆ]]NÂˆYˆ
\Ëœ“X[˜YÙ\‹™[˜X›V˜H	‰ˆ\Ë˜Ø][ÙË›™YYÔ™[™\š[™È	‰ˆ\Ë™›Ü›R[™›Ëš\Ö˜H	‰ˆ]\Ë™›Ü›R[™›Ëš\ÐXÜ›Ñ›Ü›JHÂˆ]HH\Ëž˜Q]NÂˆBˆ™]\›ˆÚYÝÊ\Ëž˜Q˜XÝÜžH‹]HÈ™]ÈQ˜XÝÜžJ]JHˆ[
NÂˆBˆÙ]\Ô\™V˜J
HÂˆ™]\›ˆ\Ëž˜Q˜XÝÜžHÈ\Ëž˜Q˜XÝÜžKš\Õ˜[Y

Hˆ˜[ÙNÂˆBˆÙ][›Ü–˜J
HÂˆ™]\›ˆ\Ëž˜Q˜XÝÜžHÈ\Ëž˜Q˜XÝÜžK™Ù]YÙ\Ê
Hˆ[ÂˆBˆ\Þ[˜ÈÛØY˜R[XYÙ\Ê
HÂˆÛÛœÝ˜R[XYÙ\ÈH]ØZ]\Ëœ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊž˜R[XYÙ\ÈŠNÂˆYˆ
^˜R[XYÙ\ÊHÂˆ™]\›ŽÂˆBˆ\Ëž˜Q˜XÝÜžKœÙ][XYÙ\Ê˜R[XYÙ\ÊNÂˆBˆ\Þ[˜ÈÛØY˜Q›ÛÊ[™\‹\ÚÊHÂˆÛÛœÝXÜ›Ñ›Ü›HH]ØZ]\Ëœ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ˜XÜ›Ñ›Ü›HŠNÂˆYˆ
XXÜ›Ñ›Ü›JHÂˆ™]\›ŽÂˆBˆÛÛœÝ™\ÛÝ\˜Ù\ÈH]ØZ]XÜ›Ñ›Ü›K™Ù]\Þ[˜Ê‘ˆŠNÂˆYˆ
J™\ÛÝ\˜Ù\È[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆ]ØZ]Øš™XÝØY\‹›ØY
™\ÛÝ\˜Ù\ËÈ‘›Û—K\Ëž™YŠNÂˆÛÛœÝ›Û™\ÈH™\ÛÝ\˜Ù\Ë™Ù]
‘›ÛŠNÂˆYˆ
J›Û™\È[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆÛÛœÝÜ[ÛœÈHØš™XÝ˜\ÜÚYÛŠØš™XÝ˜Ü™X]J[
K\Ëœ“X[˜YÙ\‹™]˜[X]Ü“Ü[ÛœËÂˆ\ÙTÞ\Ý[Q›ÛÎˆ˜[ÙBˆJNÂˆÛÛœÝÂˆZ[[ÓX\ØXÚKˆ›ÛØXÚKˆÝ[™\™›Û]PØXÚBˆHH\Ë˜Ø][ÙÎÂˆÛÛœÝ\X[]˜[X]ÜˆH™]È\X[]˜[X]ÜŠÂˆ™YŽˆ\Ëž™Y‹ˆ[™\‹ˆYÙR[™^ˆLKˆY˜XÝÜžNˆ\Ë—ÙÛØ˜[Y˜XÝÜžKˆ›ÛØXÚKˆZ[[ÓX\ØXÚKˆÝ[™\™›Û]PØXÚKˆÜ[ÛœÂˆJNÂˆÛÛœÝÜ\˜]Ü“\ÝH™]ÈÜ\˜]Ü“\Ý

NÂˆÛÛœÝ‘›ÛÈH×NÂˆÛÛœÝ[š]X[Ý]HHÂˆÙ]›Û

HÂˆ™]\›ˆ‘›ÛË˜]
LJNÂˆKˆÙ]›Û
›Û
HÂˆ‘›ÛËœ\Ú
›Û
NÂˆKˆÛÛ™J
HÂˆ™]\›ˆ\ÎÂˆBˆNÂˆÛÛœÝ\œÙQ›ÛH
›Û˜[YK˜[˜XÚÑ›ÛXÝÜÜÑ›Û[™›ÊHOˆ\X[]˜[X]Ü‹š[™TÙ]›Û
™\ÛÝ\˜Ù\ËÓ˜[YK™Ù]
›Û˜[YJKWK[Ü\˜]Ü“\Ý\ÚË[š]X[Ý]K˜[˜XÚÑ›ÛXÝÜÜÑ›Û[™›ÊK˜Ø]Ú
™X\ÛÛˆOˆÂˆØ\›ŠØY˜Q›ÛÎˆ‰Ü™X\ÛÛŸH‹˜
NÂˆ™]\›ˆ[ÂˆJNÂˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆ›Üˆ
ÛÛœÝÙ›Û˜[YK›ÛHÙˆ›Û™\ÊHÂˆÛÛœÝ\ØÜš\ÜˆH›Û™Ù]
‘›Û\ØÜš\ÜˆŠNÂˆYˆ
J\ØÜš\Üˆ[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆÛÛœÝ›Û˜[Z[HH›Ü›X[^™PÔÔÑ›Û˜[Z[J\ØÜš\Ü‹™Ù]
‘›Û˜[Z[HŠJNÂˆÛÛœÝ›ÛÙZYÚH\ØÜš\Ü‹™Ù]
‘›ÛÙZYÚŠNÂˆÛÛœÝ][XÐ[™ÛHHY\ØÜš\Ü‹™Ù]
’][XÐ[™ÛHŠNÂˆÛÛœÝÜÜÑ›Û[™›ÈHÂˆ›Û˜[Z[Kˆ›ÛÙZYÚˆ][XÐ[™ÛBˆNÂˆYˆ
]˜[Y]PÔÔÑ›Û
ÜÜÑ›Û[™›ÊJHÂˆÛÛ[YNÂˆBˆ›ÛZ\Ù\Ëœ\Ú
\œÙQ›Û
›Û˜[YK[ÜÜÑ›Û[™›ÊJNÂˆBˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆÛÛœÝZ\ÜÚ[™Ñ›ÛÈH\Ëž˜Q˜XÝÜžKœÙ]›ÛÊ‘›ÛÊNÂˆYˆ
[Z\ÜÚ[™Ñ›ÛÊHÂˆ™]\›ŽÂˆBˆÜ[ÛœËšYÛ›Ü™Q\œ›ÜœÈHYNÂˆ›ÛZ\Ù\Ë›[™ÝHÂˆ‘›ÛË›[™ÝHÂˆÛÛœÝ™X[SZ\ÜÚ[™Ñ›ÛÈH™]ÈÙ]

NÂˆ›Üˆ
ÛÛœÝZ\ÜÚ[™ÈÙˆZ\ÜÚ[™Ñ›ÛÊHÂˆYˆ
YÙ]˜Q›Û˜[YJ	ÛZ\ÜÚ[™ßKT™YÝ[\˜
JHÂˆ™X[SZ\ÜÚ[™Ñ›ÛË˜Y
Z\ÜÚ[™ÊNÂˆBˆBˆYˆ
™X[SZ\ÜÚ[™Ñ›ÛËœÚ^™JHÂˆZ\ÜÚ[™Ñ›ÛËœ\Ú
”’”ËQ˜[˜XÚÈŠNÂˆBˆ›Üˆ
ÛÛœÝZ\ÜÚ[™ÈÙˆZ\ÜÚ[™Ñ›ÛÊHÂˆYˆ
™X[SZ\ÜÚ[™Ñ›ÛËš\ÊZ\ÜÚ[™ÊJHÂˆÛÛ[YNÂˆBˆ›Üˆ
ÛÛœÝ›Û[™›ÈÙˆÞÂˆ˜[YNˆ”™YÝ[\ˆ‹ˆ›ÛÙZYÚˆˆ][XÐ[™ÛNˆˆKÂˆ˜[YNˆ›Û‹ˆ›ÛÙZYÚˆÌˆ][XÐ[™ÛNˆˆKÂˆ˜[YNˆ’][XÈ‹ˆ›ÛÙZYÚˆˆ][XÐ[™ÛNˆL‚ˆKÂˆ˜[YNˆ›Û][XÈ‹ˆ›ÛÙZYÚˆÌˆ][XÐ[™ÛNˆL‚ˆWJHÂˆÛÛœÝ˜[YHH	ÛZ\ÜÚ[™ßKIÙ›Û[™›Ë›˜[Y_XÂˆ›ÛZ\Ù\Ëœ\Ú
\œÙQ›Û
˜[YKÙ]˜Q›ÛXÝ
˜[YJKÂˆ›Û˜[Z[NˆZ\ÜÚ[™Ëˆ›ÛÙZYÚˆ›Û[™›Ë™›ÛÙZYÚˆ][XÐ[™ÛNˆ›Û[™›Ëš][XÐ[™ÛBˆJJNÂˆBˆBˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆ\Ëž˜Q˜XÝÜžK˜\[™›ÛÊ‘›ÛË™X[SZ\ÜÚ[™Ñ›ÛÊNÂˆBˆØY˜T™\ÛÝ\˜Ù\Ê[™\‹\ÚÊHÂˆ™]\›ˆ›ÛZ\ÙK˜[
Ý\ËˆÛØY˜Q›ÛÊ[™\‹\ÚÊK˜Ø]Ú


HOˆßJK\ËˆÛØY˜R[XYÙ\Ê
WJNÂˆBˆÙ\šX[^™V˜Q]J[››Ý][Û”ÝÜ˜YÙJHÂˆ™]\›ˆ\Ëž˜Q˜XÝÜžHÈ\Ëž˜Q˜XÝÜžKœÙ\šX[^™Q]J[››Ý][Û”ÝÜ˜YÙJHˆ[ÂˆBˆÙ]™\œÚ[ÛŠ
HÂˆ™]\›ˆ\Ë˜Ø][ÙË™\œÚ[Ûˆ\ËˆÝ™\œÚ[ÛŽÂˆBˆÙ]›Ü›R[™›Ê
HÂˆÛÛœÝ›Ü›R[™›ÈHÂˆ\ÑšY[Îˆ˜[ÙKˆ\ÐXÜ›Ñ›Ü›Nˆ˜[ÙKˆ\Ö˜Nˆ˜[ÙKˆ\ÔÚYÛ˜]\™\Îˆ˜[ÙBˆNÂˆÛÛœÝÂˆXÜ›Ñ›Ü›BˆHH\Ë˜Ø][ÙÎÂˆYˆ
XXÜ›Ñ›Ü›JHÂˆ™]\›ˆÚYÝÊ\Ë™›Ü›R[™›È‹›Ü›R[™›ÊNÂˆBˆžHÂˆÛÛœÝšY[ÈHXÜ›Ñ›Ü›K™Ù]
‘šY[ÈŠNÂˆÛÛœÝ\ÑšY[ÈH\œ˜^Kš\Ð\œ˜^JšY[ÊH	‰ˆšY[Ë›[™ÝˆÂˆ›Ü›R[™›Ëš\ÑšY[ÈH\ÑšY[ÎÂˆÛÛœÝ˜HHXÜ›Ñ›Ü›K™Ù]
–HŠNÂˆ›Ü›R[™›Ëš\Ö˜HH\œ˜^Kš\Ð\œ˜^J˜JH	‰ˆ˜K›[™Ýˆ˜H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[H	‰ˆ^˜Kš\Ñ[\NÂˆÛÛœÝÚYÑ›YÜÈHXÜ›Ñ›Ü›K™Ù]
”ÚYÑ›YÜÈŠNÂˆÛÛœÝ\ÔÚYÛ˜]\™\ÈHHJÚYÑ›YÜÈ	ˆJNÂˆÛÛœÝ\ÓÛ›QØÝ[Y[ÚYÛ˜]\™\ÈH\ÔÚYÛ˜]\™\È	‰ˆ\ËˆÚ\ÓÛ›QØÝ[Y[ÚYÛ˜]\™\ÊšY[ÊNÂˆ›Ü›R[™›Ëš\ÐXÜ›Ñ›Ü›HH\ÑšY[È	‰ˆZ\ÓÛ›QØÝ[Y[ÚYÛ˜]\™\ÎÂˆ›Ü›R[™›Ëš\ÔÚYÛ˜]\™\ÈH\ÔÚYÛ˜]\™\ÎÂˆHØ]Ú
^
HÂˆYˆ
^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈ^ÂˆBˆØ\›ŠØ[››Ý™]Ú›Ü›H[™›Ü›X][ÛŽˆ‰Ù^H‹˜
NÂˆBˆ™]\›ˆÚYÝÊ\Ë™›Ü›R[™›È‹›Ü›R[™›ÊNÂˆBˆÙ]ØÝ[Y[[™›Ê
HÂˆÛÛœÝÂˆØ][ÙËˆ›Ü›R[™›Ëˆ™Y‚ˆHH\ÎÂˆÛÛœÝØÒ[™›ÈHÂˆ‘›Ü›X]™\œÚ[ÛŽˆ\Ë™\œÚ[Û‹ˆ[™ÝXYÙNˆØ][ÙË›[™Ëˆ[˜Üž\š[\“˜[YNˆ™Y‹™[˜Üž\Ë™š[\“˜[YHÏÈ[ˆ\Ó[™X\š^™YˆH]\Ë›[™X\š^˜][Û‹ˆ\ÐXÜ›Ñ›Ü›T™\Ù[ˆ›Ü›R[™›Ëš\ÐXÜ›Ñ›Ü›Kˆ\ÖT™\Ù[ˆ›Ü›R[™›Ëš\Ö˜Kˆ\ÐÛÛXÝ[Û”™\Ù[ˆHXØ][ÙË˜ÛÛXÝ[Û‹ˆ\ÔÚYÛ˜]\™\Ô™\Ù[ˆ›Ü›R[™›Ëš\ÔÚYÛ˜]\™\ÂˆNÂˆ][™›ÑXÝÂˆžHÂˆ[™›ÑXÝH™Y‹˜Z[\‹™Ù]
’[™›ÈŠNÂˆHØ]Ú
\œŠHÂˆYˆ
\œˆ[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠHÂˆ›ÝÈ\œŽÂˆBˆ[™›Ê•HØÝ[Y[[™›Ü›X][ÛˆXÝ[Û˜\žH\È[˜[YˆŠNÂˆBˆYˆ
J[™›ÑXÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ˆÚYÝÊ\Ë™ØÝ[Y[[™›È‹ØÒ[™›ÊNÂˆBˆ›Üˆ
ÛÛœÝÚÙ^K˜[YWHÙˆ[™›ÑXÝ
HÂˆÝÚ]Ú
Ù^JHÂˆØ\ÙH•]HŽ‚ˆØ\ÙH]]ÜˆŽ‚ˆØ\ÙH”ÝXš™XÝŽ‚ˆØ\ÙH’Ù^]ÛÜ™ÈŽ‚ˆØ\ÙHÜ™X]ÜˆŽ‚ˆØ\ÙH”›ÙXÙ\ˆŽ‚ˆØ\ÙHÜ™X][Û‘]HŽ‚ˆØ\ÙH“[Ù]HŽ‚ˆYˆ
\[Ùˆ˜[YHOOHœÝš[™ÈŠHÂˆØÒ[™›ÖÚÙ^WHHÝš[™ÕÔ”Ýš[™Ê˜[YJNÂˆÛÛ[YNÂˆBˆœ™XZÎÂˆØ\ÙH•˜\YŽ‚ˆYˆ
˜[YH[œÝ[˜Ù[Ùˆ˜[YJHÂˆØÒ[™›ÖÚÙ^WHH˜[YNÂˆÛÛ[YNÂˆBˆœ™XZÎÂˆY˜][‚ˆ]Ý\ÝÛU˜[YNÂˆÝÚ]Ú
\[Ùˆ˜[YJHÂˆØ\ÙHœÝš[™ÈŽ‚ˆÝ\ÝÛU˜[YHHÝš[™ÕÔ”Ýš[™Ê˜[YJNÂˆœ™XZÎÂˆØ\ÙH›[X™\ˆŽ‚ˆØ\ÙH˜›ÛÛX[ˆŽ‚ˆÝ\ÝÛU˜[YHH˜[YNÂˆœ™XZÎÂˆY˜][‚ˆYˆ
˜[YH[œÝ[˜Ù[Ùˆ˜[YJHÂˆÝ\ÝÛU˜[YHH˜[YNÂˆœ™XZÎÂˆBˆØ\›Š˜Y˜[YK›ÜˆÝ\ÝÛHÙ^H‰ÚÙ^_H‹[ˆ[™›Îˆ	Ý˜[Y_K˜
NÂˆÛÛ[YNÂˆBˆ
ØÒ[™›ËÝ\ÝÛHÏÏH™]ÈX\

JKœÙ]
Ù^KÝ\ÝÛU˜[YJNÂˆÛÛ[YNÂˆBˆØ\›Š˜Y˜[YK›ÜˆÙ^H‰ÚÙ^_H‹[ˆ[™›Îˆ	Ý˜[Y_K˜
NÂˆBˆ™]\›ˆÚYÝÊ\Ë™ØÝ[Y[[™›È‹ØÒ[™›ÊNÂˆBˆÙ]š[™Ù\œš[Ê
HÂˆÛÛœÝ’S‘ÑT”’S•Ñ’T”ÕÐ–UTÈHLÂˆÛÛœÝSTWÑ’S‘ÑT”’S•H—‹œ™\X]
MŠNÂˆ[˜Ý[Ûˆ˜[Y]J]JHÂˆ™]\›ˆ\[Ùˆ]HOOHœÝš[™Èˆ	‰ˆ]K›[™ÝOOHMˆ	‰ˆ]HOOHSTWÑ’S‘ÑT”’S•ÂˆBˆÛÛœÝYH\Ëž™Y‹˜Z[\‹™Ù]
’QŠNÂˆ]\ÚÜšYÚ[˜[\Ú[ÙYšYYÂˆYˆ
\œ˜^Kš\Ð\œ˜^JY
H	‰ˆ˜[Y]JYÌJJHÂˆ\ÚÜšYÚ[˜[HÝš[™ÕÐž]\ÊYÌJNÂˆYˆ
YÌWHOOHYÌH	‰ˆ˜[Y]JYÌWJJHÂˆ\Ú[ÙYšYYHÝš[™ÕÐž]\ÊYÌWJNÂˆBˆH[ÙHÂˆ\ÚÜšYÚ[˜[HØ[Ý[]SQJ\ËœÝ™X[K™Ù]ž]T˜[™ÙJ’S‘ÑT”’S•Ñ’T”ÕÐ–UTÊK’S‘ÑT”’S•Ñ’T”ÕÐ–UTÊNÂˆBˆ™]\›ˆÚYÝÊ\Ë™š[™Ù\œš[È‹Ú\ÚÜšYÚ[˜[Ò^

K\Ú[ÙYšYYËÒ^

HÏÈ[JNÂˆBˆ\Þ[˜ÈÙÙ][™X\š^˜][Û”YÙJYÙR[™^
HÂˆÛÛœÝÂˆØ][ÙËˆ[™X\š^˜][Û‹ˆ™Y‚ˆHH\ÎÂˆÛÛœÝ™YˆH™Y‹™Ù]
[™X\š^˜][Û‹›Øš™XÝ[X™\‘š\œÝ
NÂˆžHÂˆÛÛœÝØšˆH]ØZ]™Y‹™™]Ú\Þ[˜Ê™YŠNÂˆYˆ
Øšˆ[œÝ[˜Ù[ÙˆXÝ
HÂˆ]\HHØš‹™Ù]˜]Ê•\HŠNÂˆYˆ
\H[œÝ[˜Ù[Ùˆ™YŠHÂˆ\HH]ØZ]™Y‹™™]Ú\Þ[˜Ê\JNÂˆBˆYˆ
\Ó˜[YJ\K”YÙHŠH[Øš‹š\Ê•\HŠH	‰ˆ[Øš‹š\Ê’ÚYÈŠH	‰ˆØš‹š\ÊÛÛ[ÈŠJHÂˆYˆ
XØ][ÙËœYÙRÚYÐÛÝ[ØXÚKš\Ê™YŠJHÂˆØ][ÙËœYÙRÚYÐÛÝ[ØXÚKœ]
™Y‹JNÂˆBˆYˆ
XØ][ÙËœYÙR[™^ØXÚKš\Ê™YŠJHÂˆØ][ÙËœYÙR[™^ØXÚKœ]
™Y‹
NÂˆBˆ™]\›ˆÛØš‹™Y—NÂˆBˆBˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ•H[™X\š^˜][ÛˆXÝ[Û˜\žHÙ\Û‰ÝÚ[ÈH˜[YYÙHXÝ[Û˜\žKˆŠNÂˆHØ]Ú
™X\ÛÛŠHÂˆØ\›ŠÙÙ][™X\š^˜][Û”YÙNˆ‰Ü™X\ÛÛ‹›Y\ÜØYÙ_H‹˜
NÂˆ™]\›ˆØ][ÙË™Ù]YÙQXÝ
YÙR[™^
NÂˆBˆBˆÙ]YÙJYÙR[™^
HÂˆÛÛœÝØXÚY›ÛZ\ÙHH\ËˆÜYÙT›ÛZ\Ù\Ë™Ù]
YÙR[™^
NÂˆYˆ
ØXÚY›ÛZ\ÙJHÂˆ™]\›ˆØXÚY›ÛZ\ÙNÂˆBˆÛÛœÝÂˆØ][ÙËˆ[™X\š^˜][Û‹ˆ˜Q˜XÝÜžBˆHH\ÎÂˆ]›ÛZ\ÙNÂˆYˆ
˜Q˜XÝÜžJHÂˆ›ÛZ\ÙHH›ÛZ\ÙKœ™\ÛÛ™JÑXÝ™[\K[JNÂˆH[ÙHYˆ
[™X\š^˜][ÛËœYÙQš\œÝOOHYÙR[™^
HÂˆ›ÛZ\ÙHH\ËˆÙÙ][™X\š^˜][Û”YÙJYÙR[™^
NÂˆH[ÙHÂˆ›ÛZ\ÙHHØ][ÙË™Ù]YÙQXÝ
YÙR[™^
NÂˆBˆ›ÛZ\ÙHH›ÛZ\ÙK[Š
ÜYÙQXÝ™Y—JHOˆ™]ÈYÙJÂˆ“X[˜YÙ\Žˆ\Ëœ“X[˜YÙ\‹ˆ™YŽˆ\Ëž™Y‹ˆYÙR[™^ˆYÙQXÝˆ™Y‹ˆÛØ˜[Y˜XÝÜžNˆ\Ë—ÙÛØ˜[Y˜XÝÜžKˆ›ÛØXÚNˆØ][ÙË™›ÛØXÚKˆZ[[ÓX\ØXÚNˆØ][ÙË˜Z[[ÓX\ØXÚKˆÝ[™\™›Û]PØXÚNˆØ][ÙËœÝ[™\™›Û]PØXÚKˆÛØ˜[ÛÛÜ”ÜXÙPØXÚNˆØ][ÙË™ÛØ˜[ÛÛÜ”ÜXÙPØXÚKˆÛØ˜[[XYÙPØXÚNˆØ][ÙË™ÛØ˜[[XYÙPØXÚKˆÞ\Ý[Q›ÛØXÚNˆØ][ÙËœÞ\Ý[Q›ÛØXÚKˆ›Û›[™[Ù\ÔÙ]ˆØ][ÙË››Û›[™[Ù\ÔÙ]ˆ˜Q˜XÝÜžBˆJJNÂˆ\ËˆÜYÙT›ÛZ\Ù\ËœÙ]
YÙR[™^›ÛZ\ÙJNÂˆ™]\›ˆ›ÛZ\ÙNÂˆBˆ\Þ[˜ÈÚXÚÑš\œÝYÙJ™XÛÝ™\žS[ÙHH˜[ÙJHÂˆYˆ
™XÛÝ™\žS[ÙJHÂˆ™]\›ŽÂˆBˆžHÂˆ]ØZ]\Ë™Ù]YÙJ
NÂˆHØ]Ú
™X\ÛÛŠHÂˆYˆ
™X\ÛÛˆ[œÝ[˜Ù[Ùˆ™Y‘[žQ^Ù\[ÛŠHÂˆ\ËˆÜYÙT›ÛZ\Ù\Ë™[]J
NÂˆ]ØZ]\Ë˜ÛX[\

NÂˆ›ÝÈ™]È™Y”\œÙQ^Ù\[ÛŠ
NÂˆBˆBˆBˆ\Þ[˜ÈÚXÚÓ\ÝYÙJ™XÛÝ™\žS[ÙHH˜[ÙJHÂˆÛÛœÝÂˆØ][ÙËˆ“X[˜YÙ\‚ˆHH\ÎÂˆØ][ÙËœÙ]XÝX[[TYÙ\Ê
NÂˆ][TYÙ\ÎÂˆžHÂˆ]ØZ]›ÛZ\ÙK˜[
Ü“X[˜YÙ\‹™[œÝ\™QØÊž˜Q˜XÝÜžHŠK“X[˜YÙ\‹™[œÝ\™QØÊ›[™X\š^˜][ÛˆŠK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ›[TYÙ\ÈŠWJNÂˆYˆ
\Ëž˜Q˜XÝÜžJHÂˆ™]\›ŽÂˆH[ÙHYˆ
\Ë›[™X\š^˜][ÛŠHÂˆ[TYÙ\ÈH\Ë›[™X\š^˜][Û‹›[TYÙ\ÎÂˆH[ÙHÂˆ[TYÙ\ÈHØ][ÙË›[TYÙ\ÎÂˆBˆYˆ
S[X™\‹š\Ò[YÙ\Š[TYÙ\ÊJHÂˆ›ÝÈ™]È›Ü›X]\œ›ÜŠ”YÙHÛÝ[\È›Ý[ˆ[YÙ\‹ˆŠNÂˆH[ÙHYˆ
[TYÙ\ÈHJHÂˆ™]\›ŽÂˆBˆ]ØZ]\Ë™Ù]YÙJ[TYÙ\ÈHJNÂˆHØ]Ú
™X\ÛÛŠHÂˆ\ËˆÜYÙT›ÛZ\Ù\Ë™[]J[TYÙ\ÈHJNÂˆ]ØZ]\Ë˜ÛX[\

NÂˆYˆ
™X\ÛÛˆ[œÝ[˜Ù[Ùˆ™Y‘[žQ^Ù\[Ûˆ	‰ˆ\™XÛÝ™\žS[ÙJHÂˆ›ÝÈ™]È™Y”\œÙQ^Ù\[ÛŠ
NÂˆBˆØ\›ŠÚXÚÓ\ÝYÙHH[˜[YÔYÙ\È™YHÐÛÝ[ˆ	Û[TYÙ\ßK˜
NÂˆ]YÙ\Õ™YNÂˆžHÂˆYÙ\Õ™YHH]ØZ]Ø][ÙË™Ù][YÙQXÝÊ™XÛÝ™\žS[ÙJNÂˆHØ]Ú
™X\ÛÛ[
HÂˆYˆ
™X\ÛÛ[[œÝ[˜Ù[Ùˆ™Y‘[žQ^Ù\[Ûˆ	‰ˆ\™XÛÝ™\žS[ÙJHÂˆ›ÝÈ™]È™Y”\œÙQ^Ù\[ÛŠ
NÂˆBˆØ][ÙËœÙ]XÝX[[TYÙ\ÊJNÂˆ™]\›ŽÂˆBˆ›Üˆ
ÛÛœÝÜYÙR[™^ÜYÙQXÝ™Y—WHÙˆYÙ\Õ™YJHÂˆ]›ÛZ\ÙNÂˆYˆ
YÙQXÝ[œÝ[˜Ù[Ùˆ\œ›ÜŠHÂˆ›ÛZ\ÙHH›ÛZ\ÙKœ™Z™XÝ
YÙQXÝ
NÂˆ›ÛZ\ÙK˜Ø]Ú


HOˆßJNÂˆH[ÙHÂˆ›ÛZ\ÙHH›ÛZ\ÙKœ™\ÛÛ™J™]ÈYÙJÂˆ“X[˜YÙ\‹ˆ™YŽˆ\Ëž™Y‹ˆYÙR[™^ˆYÙQXÝˆ™Y‹ˆÛØ˜[Y˜XÝÜžNˆ\Ë—ÙÛØ˜[Y˜XÝÜžKˆ›ÛØXÚNˆØ][ÙË™›ÛØXÚKˆZ[[ÓX\ØXÚNˆØ][ÙË˜Z[[ÓX\ØXÚKˆÝ[™\™›Û]PØXÚNˆØ][ÙËœÝ[™\™›Û]PØXÚKˆÛØ˜[ÛÛÜ”ÜXÙPØXÚNˆ\Ë™ÛØ˜[ÛÛÜ”ÜXÙPØXÚKˆÛØ˜[[XYÙPØXÚNˆØ][ÙË™ÛØ˜[[XYÙPØXÚKˆÞ\Ý[Q›ÛØXÚNˆØ][ÙËœÞ\Ý[Q›ÛØXÚKˆ›Û›[™[Ù\ÔÙ]ˆØ][ÙË››Û›[™[Ù\ÔÙ]ˆ˜Q˜XÝÜžNˆ[ˆJJNÂˆBˆ\ËˆÜYÙT›ÛZ\Ù\ËœÙ]
YÙR[™^›ÛZ\ÙJNÂˆBˆØ][ÙËœÙ]XÝX[[TYÙ\ÊYÙ\Õ™YKœÚ^™JNÂˆBˆBˆ\Þ[˜È›Û˜[˜XÚÊY[™\ŠHÂˆÛÛœÝÂˆØ][ÙËˆ“X[˜YÙ\‚ˆHH\ÎÂˆ›Üˆ
ÛÛœÝ˜[œÛ]Y›ÛÙˆ]ØZ]›ÛZ\ÙK˜[
Ø][ÙË™›ÛØXÚJJHÂˆYˆ
˜[œÛ]Y›Û›ØYY˜[YHOOHY
HÂˆ˜[œÛ]Y›Û™˜[˜XÚÊ[™\‹“X[˜YÙ\‹™]˜[X]Ü“Ü[ÛœÊNÂˆ™]\›ŽÂˆBˆBˆBˆ\Þ[˜ÈÛX[\
X[X[UšYÙÙ\™YH˜[ÙJHÂˆ™]\›ˆ\Ë˜Ø][ÙÈÈ\Ë˜Ø][ÙË˜ÛX[\
X[X[UšYÙÙ\™Y
HˆÛX\‘ÛØ˜[ØXÚ\Ê
NÂˆBˆ\Þ[˜ÈØÛÛXÝšY[Øš™XÝÊ˜[YK\™[™Y‹šY[™Y‹›ÛZ\Ù\Ë[››Ý][Û‘ÛØ˜[Ëš\Ú]Y™YœËÜœ[‘šY[ÊHÂˆÛÛœÝÂˆ™Y‚ˆHH\ÎÂˆYˆ
JšY[™Yˆ[œÝ[˜Ù[Ùˆ™YŠHš\Ú]Y™YœËš\ÊšY[™YŠJHÂˆ™]\›ŽÂˆBˆš\Ú]Y™YœËœ]
šY[™YŠNÂˆÛÛœÝšY[H]ØZ]™Y‹™™]Ú\Þ[˜ÊšY[™YŠNÂˆYˆ
JšY[[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ŽÂˆBˆ]ÝX\HH]ØZ]šY[™Ù]\Þ[˜Ê”ÝX\HŠNÂˆÝX\HHÝX\H[œÝ[˜Ù[Ùˆ˜[YHÈÝX\K›˜[YHˆ[ÂˆÝÚ]Ú
ÝX\JHÂˆØ\ÙH“[šÈŽ‚ˆ™]\›ŽÂˆBˆYˆ
šY[š\Ê•ŠJHÂˆÛÛœÝ\˜[YHHÝš[™ÕÔ”Ýš[™Ê]ØZ]šY[™Ù]\Þ[˜Ê•ŠJNÂˆ˜[YHH˜[YHOOHˆˆÈ\˜[YHˆ	Û˜[Y_K‰Ü\˜[Y_XÂˆH[ÙHÂˆ]ØšˆHšY[ÂˆÛÛœÝØ[ÙY™YœÈH™]È™Y”Ù]

NÂˆÚ[H
YJHÂˆØšˆHØš‹™Ù]˜]Ê”\™[ŠH\™[™YŽÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ™YŠHÂˆYˆ
š\Ú]Y™YœËš\ÊØšŠHØ[ÙY™YœËš\ÊØšŠJHÂˆœ™XZÎÂˆBˆØ[ÙY™YœËœ]
ØšŠNÂˆØšˆH]ØZ]™Y‹™™]Ú\Þ[˜ÊØšŠNÂˆBˆYˆ
JØšˆ[œÝ[˜Ù[ÙˆXÝ
JHÂˆœ™XZÎÂˆBˆYˆ
Øš‹š\Ê•ŠJHÂˆÛÛœÝ\˜[YHHÝš[™ÕÔ”Ýš[™Ê]ØZ]Øš‹™Ù]\Þ[˜Ê•ŠJNÂˆ˜[YHH˜[YHOOHˆˆÈ\˜[YHˆ	Û˜[Y_K‰Ü\˜[Y_XÂˆœ™XZÎÂˆBˆBˆBˆYˆ
\™[™Yˆ	‰ˆYšY[š\Ê”\™[ŠH	‰ˆ\Ó˜[YJšY[™Ù]
”ÝX\HŠK•ÚYÙ]ŠJHÂˆÜœ[‘šY[Ëœ]
šY[™Y‹\™[™YŠNÂˆBˆ›ÛZ\Ù\Ë™Ù]Ü’[œÙ\ÛÛ\]Y
˜[YKXZÙP\œŠKœ\Ú
[››Ý][Û‘˜XÝÜžK˜Ü™X]J™Y‹šY[™Y‹[››Ý][Û‘ÛØ˜[Ë[YKÜœ[‘šY[Ë[[
K[Š[››Ý][ÛˆOˆ[››Ý][ÛË™Ù]šY[Øš™XÝ

JK˜Ø]Ú
[˜Ý[Ûˆ
™X\ÛÛŠHÂˆØ\›ŠØÛÛXÝšY[Øš™XÝÎˆ‰Ü™X\ÛÛŸH‹˜
NÂˆ™]\›ˆ[ÂˆJJNÂˆYˆ
YšY[š\Ê’ÚYÈŠJHÂˆ™]\›ŽÂˆBˆÛÛœÝÚYÈH]ØZ]šY[™Ù]\Þ[˜Ê’ÚYÈŠNÂˆYˆ
\œ˜^Kš\Ð\œ˜^JÚYÊJHÂˆ›Üˆ
ÛÛœÝÚYÙˆÚYÊHÂˆ]ØZ]\ËˆØÛÛXÝšY[Øš™XÝÊ˜[YKšY[™Y‹ÚY›ÛZ\Ù\Ë[››Ý][Û‘ÛØ˜[Ëš\Ú]Y™YœËÜœ[‘šY[ÊNÂˆBˆBˆBˆÙ]šY[Øš™XÝÊ
HÂˆÛÛœÝ›ÛZ\ÙHH\Ëœ“X[˜YÙ\‹™[œÝ\™QØÊ™›Ü›R[™›ÈŠK[Š\Þ[˜È›Ü›R[™›ÈOˆÂˆYˆ
Y›Ü›R[™›Ëš\ÑšY[ÊHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ[››Ý][Û‘ÛØ˜[ÈH]ØZ]\Ë˜[››Ý][Û‘ÛØ˜[ÎÂˆYˆ
X[››Ý][Û‘ÛØ˜[ÊHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÂˆXÜ›Ñ›Ü›BˆHH[››Ý][Û‘ÛØ˜[ÎÂˆÛÛœÝš\Ú]Y™YœÈH™]È™Y”Ù]

NÂˆÛÛœÝ[šY[ÈH™]ÈX\

NÂˆÛÛœÝšY[›ÛZ\Ù\ÈH™]ÈX\

NÂˆÛÛœÝÜœ[‘šY[ÈH™]È™Y“X\

NÂˆ›Üˆ
ÛÛœÝšY[™YˆÙˆXÜ›Ñ›Ü›K™Ù]
‘šY[ÈŠJHÂˆ]ØZ]\ËˆØÛÛXÝšY[Øš™XÝÊˆ‹[šY[™Y‹šY[›ÛZ\Ù\Ë[››Ý][Û‘ÛØ˜[Ëš\Ú]Y™YœËÜœ[‘šY[ÊNÂˆBˆÛÛœÝ[›ÛZ\Ù\ÈH×NÂˆ›Üˆ
ÛÛœÝÛ˜[YK›ÛZ\Ù\×HÙˆšY[›ÛZ\Ù\ÊHÂˆ[›ÛZ\Ù\Ëœ\Ú
›ÛZ\ÙK˜[
›ÛZ\Ù\ÊK[ŠšY[ÈOˆÂˆšY[ÈHšY[Ë™š[\Š›ÛÛX[ŠNÂˆYˆ
šY[Ë›[™Ýˆ
HÂˆ[šY[ËœÙ]
˜[YKšY[ÊNÂˆBˆJJNÂˆBˆ]ØZ]›ÛZ\ÙK˜[
[›ÛZ\Ù\ÊNÂˆ™]\›ˆÂˆ[šY[Îˆ[šY[ËœÚ^™HÈ[šY[Èˆ[ˆÜœ[‘šY[ÂˆNÂˆJNÂˆ™]\›ˆÚYÝÊ\Ë™šY[Øš™XÝÈ‹›ÛZ\ÙJNÂˆBˆ\Þ[˜ÈØÛÛXÝÚYÛ˜]\™QšY[ÊšY[ËÝ]š\Ú]Y™YœÊHÂˆYˆ
P\œ˜^Kš\Ð\œ˜^JšY[ÊJHÂˆ™]\›ŽÂˆBˆ›Üˆ
ÛÛœÝšY[™YˆÙˆšY[ÊHÂˆYˆ
šY[™Yˆ[œÝ[˜Ù[Ùˆ™YŠHÂˆYˆ
š\Ú]Y™YœËš\ÊšY[™YŠJHÂˆÛÛ[YNÂˆBˆš\Ú]Y™YœËœ]
šY[™YŠNÂˆBˆÛÛœÝšY[H]ØZ]\Ëž™Y‹™™]ÚY”™Y\Þ[˜ÊšY[™YŠNÂˆYˆ
JšY[[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆYˆ
\Ó˜[YJ]ØZ]šY[™Ù]\Þ[˜Ê‘•ŠK”ÚYÈŠJHÂˆÛÛœÝÚYÑXÝH]ØZ]šY[™Ù]\Þ[˜Ê•ˆŠNÂˆYˆ
ÚYÑXÝ[œÝ[˜Ù[ÙˆXÝ
HÂˆÛÛœÝ\œÙYH]ØZ]\ËˆÜ\œÙTÚYÛ˜]\™QXÝ
šY[ÚYÑXÝšY[™YŠNÂˆYˆ
\œÙY
HÂˆÝ]œ\Ú
\œÙY
NÂˆBˆBˆBˆYˆ
šY[š\Ê’ÚYÈŠJHÂˆ]ØZ]\ËˆØÛÛXÝÚYÛ˜]\™QšY[Ê]ØZ]šY[™Ù]\Þ[˜Ê’ÚYÈŠKÝ]š\Ú]Y™YœÊNÂˆBˆBˆBˆ\Þ[˜ÈÙÙ]ž]T˜[™ÙJ™YÚ[‹[™
HÂˆžHÂˆ™]\›ˆ\ËœÝ™X[K™Ù]ž]T˜[™ÙJ™YÚ[‹[™
NÂˆHØ]Ú
^
HÂˆYˆ
J^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠJHÂˆ›ÝÈ^ÂˆBˆ]ØZ]\Ëœ“X[˜YÙ\‹œ™\]Y\Ý˜[™ÙJ™YÚ[‹[™
NÂˆ™]\›ˆ\ËˆÙÙ]ž]T˜[™ÙJ™YÚ[‹[™
NÂˆBˆBˆ\Þ[˜ÈØÛÝ™\œÕÚÛQØÝ[Y[
ÚYÛ™Y[™[ÙYšXØ][ÛœÐY\”ÚYÛ˜]\™JHÂˆYˆ
[ÙYšXØ][ÛœÐY\”ÚYÛ˜]\™Hˆ
HÂˆ™]\›ˆ˜[ÙNÂˆBˆÛÛœÝš[S[™ÝH\ËœÝ™X[K™[™Âˆ›Üˆ
]™YÚ[ˆHÚYÛ™Y[™È™YÚ[ˆš[S[™ÝÈ™YÚ[ˆ
ÏHÒQÓUT‘WÕRSÐÒS’×ÔÒV‘JHÂˆÛÛœÝ[™HX]›Z[Š™YÚ[ˆ
ÈÒQÓUT‘WÕRSÐÒS’×ÔÒV‘Kš[S[™Ý
NÂˆÛÛœÝZ[H]ØZ]\ËˆÙÙ]ž]T˜[™ÙJ™YÚ[‹[™
NÂˆ›Üˆ
ÛÛœÝž]HÙˆZ[
HÂˆYˆ
ž]HOOH	‰ˆž]HOOHH	‰ˆž]HOOHH	‰ˆž]HOOHÈ	‰ˆž]HOOH	‰ˆž]HOOHŒ
HÂˆ™]\›ˆ˜[ÙNÂˆBˆBˆBˆ™]\›ˆYNÂˆBˆ\Þ[˜ÈÜ\œÙTÚYÛ˜]\™QXÝ
šY[ÚYÑXÝšY[™YŠHÂˆÛÛœÝž]T˜[™ÙHH]ØZ]ÚYÑXÝ™Ù]\Þ[˜Êž]T˜[™ÙHŠNÂˆYˆ
P\œ˜^Kš\Ð\œ˜^Jž]T˜[™ÙJHž]T˜[™ÙK›[™ÝOOHž]T˜[™ÙKœÛÛYJˆOˆS[X™\‹š\Ò[YÙ\ŠŠHˆ
JHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝØK‹ËHHž]T˜[™ÙNÂˆÛÛœÝš[S[™ÝH\ËœÝ™X[K™[™ÂˆYˆ
HOOHˆHH
ÈˆˆÈÈ
Èˆš[S[™Ýš[S[™ÝOOH
HÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÛÛ[ÈH]ØZ]ÚYÑXÝ™Ù]\Þ[˜ÊÛÛ[ÈŠNÂˆYˆ
\[ÙˆÛÛ[ÈOOHœÝš[™ÈˆÛÛ[Ë›[™ÝOOH
HÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÙš[\“˜[YKÝX‘š[\“˜[YK˜[YK™X\ÛÛ‹ØØ][Û‹ÛÛXÝ[™›ËWHH]ØZ]›ÛZ\ÙK˜[
ÜÚYÑXÝ™Ù]\Þ[˜Ê‘š[\ˆŠKÚYÑXÝ™Ù]\Þ[˜Ê”ÝX‘š[\ˆŠKšY[™Ù]\Þ[˜Ê•ŠKÚYÑXÝ™Ù]\Þ[˜Ê“˜[YHŠKÚYÑXÝ™Ù]\Þ[˜Ê”™X\ÛÛˆŠKÚYÑXÝ™Ù]\Þ[˜Ê“ØØ][ÛˆŠKÚYÑXÝ™Ù]\Þ[˜ÊÛÛXÝ[™›ÈŠKÚYÑXÝ™Ù]\Þ[˜Ê“HŠWJNÂˆÛÛœÝš[\ˆHš[\“˜[YH[œÝ[˜Ù[Ùˆ˜[YHÈš[\“˜[YK›˜[YHˆ[ˆÝX‘š[\ˆHÝX‘š[\“˜[YH[œÝ[˜Ù[Ùˆ˜[YHÈÝX‘š[\“˜[YK›˜[YHˆ[Âˆ]ÚYÛ˜]\™U\HH[ÂˆYˆ
ÝX‘š[\ˆOOH˜Y™KœØÜÍË™]XÚYŠHÂˆÚYÛ˜]\™U\HHÂˆH[ÙHYˆ
ÝX‘š[\ˆOOH˜Y™KœØÜÍËœÚLHŠHÂˆÚYÛ˜]\™U\HHNÂˆBˆÛÛœÝ™Y’Ù^HHšY[™Yˆ[œÝ[˜Ù[Ùˆ™YˆÈšY[™Y‹ÔÝš[™Ê
Hˆš[›[™HŽÂˆ™]\›ˆÂˆYˆ	Ü™Y’Ù^_N‰Ø_KIØŸKIØßKIÙXˆšY[˜[YNˆ\[ÙˆOOHœÝš[™ÈˆÈÝš[™ÕÔ”Ýš[™Ê
Hˆˆ‹ˆÚYÛ™\“˜[YNˆ\[Ùˆ˜[YHOOHœÝš[™ÈˆÈÝš[™ÕÔ”Ýš[™Ê˜[YJHˆ[ˆ™X\ÛÛŽˆ\[Ùˆ™X\ÛÛˆOOHœÝš[™ÈˆÈÝš[™ÕÔ”Ýš[™Ê™X\ÛÛŠHˆ[ˆØØ][ÛŽˆ\[ÙˆØØ][ÛˆOOHœÝš[™ÈˆÈÝš[™ÕÔ”Ýš[™ÊØØ][ÛŠHˆ[ˆÛÛXÝ[™›Îˆ\[ÙˆÛÛXÝ[™›ÈOOHœÝš[™ÈˆÈÝš[™ÕÔ”Ýš[™ÊÛÛXÝ[™›ÊHˆ[ˆÚYÛš[™Õ[YNˆ\[ÙˆHOOHœÝš[™ÈˆÈHˆ[ˆš[\‹ˆÝX‘š[\‹ˆÚYÛ˜]\™U\Kˆž]T˜[™ÙKˆØÜÍÎˆÝš[™ÕÐž]\ÊÛÛ[ÊKˆ™]š\Ú[Û’[™^ˆˆ\™[Yˆ[ˆNÂˆBˆÙ]ÚYÛ˜]\™\Ê
HÂˆÛÛœÝ›ÛZ\ÙHH\Ëœ“X[˜YÙ\‹™[œÝ\™QØÊ™›Ü›R[™›ÈŠK[Š\Þ[˜È›Ü›R[™›ÈOˆÂˆYˆ
Y›Ü›R[™›Ëš\ÔÚYÛ˜]\™\ÈY›Ü›R[™›Ëš\ÑšY[ÊHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ[››Ý][Û‘ÛØ˜[ÈH]ØZ]\Ë˜[››Ý][Û‘ÛØ˜[ÎÂˆYˆ
X[››Ý][Û‘ÛØ˜[ÊHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝšY[ÈH[››Ý][Û‘ÛØ˜[Ë˜XÜ›Ñ›Ü›K™Ù]
‘šY[ÈŠNÂˆÛÛœÝÛÛXÝYH×NÂˆ]ØZ]\ËˆØÛÛXÝÚYÛ˜]\™QšY[ÊšY[ËÛÛXÝY™]È™Y”Ù]

JNÂˆ]ØZ]›ÛZ\ÙK˜[
ÛÛXÝY›X\
\Þ[˜ÈÚYÛ˜]\™HOˆÂˆÛÛœÝÚYÛ™Y[™HÚYÛ˜]\™K˜ž]T˜[™ÙVÌ—H
ÈÚYÛ˜]\™K˜ž]T˜[™ÙVÌ×NÂˆÚYÛ˜]\™K›[ÙYšXØ][ÛœÐY\”ÚYÛ˜]\™HH\Ëž™Y‹˜ÛÝ[\]\ÐY\ŠÚYÛ™Y[™
NÂˆÚYÛ˜]\™K˜ÛÝ™\œÕÚÛQØÝ[Y[H]ØZ]\ËˆØÛÝ™\œÕÚÛQØÝ[Y[
ÚYÛ™Y[™ÚYÛ˜]\™K›[ÙYšXØ][ÛœÐY\”ÚYÛ˜]\™JNÂˆJJNÂˆÛÛXÝYœÛÜ

KŠHOˆ‹˜ž]T˜[™ÙVÌ—H
È‹˜ž]T˜[™ÙVÌ×HH
K˜ž]T˜[™ÙVÌ—H
ÈK˜ž]T˜[™ÙVÌ×JJNÂˆ›Üˆ
]HHZHHÛÛXÝY›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝÚYÈHÛÛXÝYÚWNÂˆÚYËœ™]š\Ú[Û’[™^HNÂˆ›Üˆ
]ˆHHHNÈˆHÈ‹KJHÂˆÛÛœÝØ[™Y]HHÛÛXÝYÚ—NÂˆYˆ
Ø[™Y]K˜ž]T˜[™ÙVÌ—H
ÈØ[™Y]K˜ž]T˜[™ÙVÌ×HˆÚYË˜ž]T˜[™ÙVÌ—H
ÈÚYË˜ž]T˜[™ÙVÌ×JHÂˆÚYËœ\™[YHØ[™Y]KšYÂˆœ™XZÎÂˆBˆBˆBˆÛÛœÝÚYÛ˜]\™Q]HH™]ÈX\

NÂˆÛÛœÝY]Y]HHÛÛXÝY›X\
ÚYÈOˆÂˆÛÛœÝÂˆØÜÍËˆ‹‹œ™\ÝˆHHÚYÎÂˆÚYÛ˜]\™Q]KœÙ]
ÚYËšYÂˆž]T˜[™ÙNˆÚYË˜ž]T˜[™ÙKˆØÜÍÂˆJNÂˆ™]\›ˆ™\ÝÂˆJNÂˆ\ËˆÜÚYÛ˜]\™Q]HHÚYÛ˜]\™Q]NÂˆ™]\›ˆY]Y]K›[™ÝÈY]Y]Hˆ[ÂˆJNÂˆ™]\›ˆÚYÝÊ\ËœÚYÛ˜]\™\È‹›ÛZ\ÙJNÂˆBˆ\Þ[˜ÈÙ]ÚYÛ˜]\™Q]JY
HÂˆ]ØZ]\ËœÚYÛ˜]\™\ÎÂˆÛÛœÝÚYÛ˜]\™HH\ËˆÜÚYÛ˜]\™Q]OË™Ù]
Y
NÂˆYˆ
\ÚYÛ˜]\™JHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÂˆž]T˜[™ÙKˆØÜÍÂˆHHÚYÛ˜]\™NÂˆÛÛœÝØK‹ËHHž]T˜[™ÙNÂˆÛÛœÝ]HH]ØZ]›ÛZ\ÙK˜[
Ý\ËˆÙÙ]ž]T˜[™ÙJKH
ÈŠK\ËˆÙÙ]ž]T˜[™ÙJËÈ
È
WJNÂˆ™]\›ˆÂˆ]KˆØÜÍÂˆNÂˆBˆÙ]\Ò”ÐXÝ[ÛœÊ
HÂˆÛÛœÝ›ÛZ\ÙHH›ÛZ\ÙK˜[
Ý\Ëœ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊšœÐXÝ[ÛœÈŠK\Ëœ“X[˜YÙ\‹™[œÝ\™QØÊ™šY[Øš™XÝÈŠWJK[Š
ØØ][ÙÒœÐXÝ[ÛœËšY[Øš™XÝ×JHOˆÂˆYˆ
Ø][ÙÒœÐXÝ[ÛœÊHÂˆ™]\›ˆYNÂˆBˆYˆ
šY[Øš™XÝÏË˜[šY[ÊHÂˆ™]\›ˆšY[Øš™XÝË˜[šY[Ë˜[Y\Ê
KœÛÛYJšY[ØšˆOˆšY[Øš‹œÛÛYJØšˆOˆØš‹˜XÝ[ÛœÈOOH[
JNÂˆBˆ™]\›ˆ˜[ÙNÂˆJNÂˆ™]\›ˆÚYÝÊ\Ëš\Ò”ÐXÝ[ÛœÈ‹›ÛZ\ÙJNÂˆBˆÙ]Ø[Ý[][Û“Ü™\’YÊ
HÂˆÛÛœÝØ[Ý[][Û“Ü™\ˆH\Ë˜Ø][ÙË˜XÜ›Ñ›Ü›OË™Ù]
ÓÈŠNÂˆYˆ
P\œ˜^Kš\Ð\œ˜^JØ[Ý[][Û“Ü™\ŠHØ[Ý[][Û“Ü™\‹›[™ÝOOH
HÂˆ™]\›ˆÚYÝÊ\Ë˜Ø[Ý[][Û“Ü™\’YÈ‹[
NÂˆBˆÛÛœÝYÈH×NÂˆ›Üˆ
ÛÛœÝYÙˆØ[Ý[][Û“Ü™\ŠHÂˆYˆ
Y[œÝ[˜Ù[Ùˆ™YŠHÂˆYËœ\Ú
YÔÝš[™Ê
JNÂˆBˆBˆ™]\›ˆÚYÝÊ\Ë˜Ø[Ý[][Û“Ü™\’YÈ‹YË›[™ÝÈYÈˆ[
NÂˆBˆÙ][››Ý][Û‘ÛØ˜[Ê
HÂˆ™]\›ˆÚYÝÊ\Ë˜[››Ý][Û‘ÛØ˜[È‹[››Ý][Û‘˜XÝÜžK˜Ü™X]QÛØ˜[Ê\Ëœ“X[˜YÙ\ŠJNÂˆBˆ\Þ[˜ÈÒ”ÓØš™XÝ
˜[YKš\œÝØ[HYJHÂˆ›ÝÈ™]È\œ›ÜŠ“›Ý[\[Y[YˆÒ”ÓØš™XÝŠNÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÜ—ÛX[˜YÙ\‹šœÂ‚‚‚‚‚‚‚‚‚‚‚‚™[˜Ý[Ûˆ\œÙQØÐ˜\ÙU\›
\›
HÂˆYˆ
\›
HÂˆÛÛœÝXœÛÛ]U\›HÜ™X]U˜[YXœÛÛ]U\›
\›
NÂˆYˆ
XœÛÛ]U\›
HÂˆ™]\›ˆXœÛÛ]U\›š™YŽÂˆBˆØ\›Š[˜[YXœÛÛ]HØÐ˜\ÙU\›ˆ‰Ý\›H‹˜
NÂˆBˆ™]\›ˆ[ÂŸB˜Û\ÜÈ˜\ÙT“X[˜YÙ\ˆÂˆÛÛœÝXÝÜŠÂˆØÐ˜\ÙU\›ˆØÒYˆ[˜X›V˜Kˆ]˜[X]Ü“Ü[ÛœËˆ[™\‹ˆ\ÜÝÛÜ™ˆJHÂˆ\Ë—ÙØÐ˜\ÙU\›H\œÙQØÐ˜\ÙU\›
ØÐ˜\ÙU\›
NÂˆ\Ë—ÙØÒYHØÒYÂˆ\Ë—Ü\ÜÝÛÜ™H\ÜÝÛÜ™Âˆ\Ë™[˜X›V˜HH[˜X›V˜NÂˆ]˜[X]Ü“Ü[ÛœËš\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜY	‰H™X]\™U\Ýš\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜYÂˆ]˜[X]Ü“Ü[ÛœËš\Ò[XYÙQXÛÙ\”Ý\ÜY	‰H™X]\™U\Ýš\Ò[XYÙQXÛÙ\”Ý\ÜYÂˆ\Ë™]˜[X]Ü“Ü[ÛœÈHØš™XÝ™œ™Y^™J]˜[X]Ü“Ü[ÛœÊNÂˆ[XYÙT™\Ú^™\‹œÙ]Ü[ÛœÊ]˜[X]Ü“Ü[ÛœÊNÂˆœYÔÝ™X[KœÙ]Ü[ÛœÊ]˜[X]Ü“Ü[ÛœÊNÂˆÜ\˜]Ü“\ÝœÙ]Ü[ÛœÊ]˜[X]Ü“Ü[ÛœÊNÂˆÛÛœÝÜ[ÛœÈHÂˆ‹‹™]˜[X]Ü“Ü[ÛœËˆ[™\‚ˆNÂˆXØÐÛÛÜ”ÜXÙKœÙ]Ü[ÛœÊÜ[ÛœÊNÂˆÛ^ZÒPÐÐ˜\ÙYÔËœÙ]Ü[ÛœÊÜ[ÛœÊNÂˆ‘[˜Ý[Û‘˜XÝÜžKœÙ]Ü[ÛœÊÜ[ÛœÊNÂˆ]\›‹œÙ]Ü[ÛœÊÜ[ÛœÊNÂˆØ\ÛR[XYÙKœÙ]Ü[ÛœÊÜ[ÛœÊNÂˆBˆÙ]ØÒY

HÂˆ™]\›ˆ\Ë—ÙØÒYÂˆBˆÙ]\ÜÝÛÜ™

HÂˆ™]\›ˆ\Ë—Ü\ÜÝÛÜ™ÂˆBˆÙ]ØÐ˜\ÙU\›

HÂˆ™]\›ˆ\Ë—ÙØÐ˜\ÙU\›ÂˆBˆ[œÝ\™QØÊ›Ü\™ÜÊHÂˆ™]\›ˆ\Ë™[œÝ\™J\Ëœ‘ØÝ[Y[›Ü\™ÜÊNÂˆBˆ[œÝ\™PØ][ÙÊ›Ü\™ÜÊHÂˆ™]\›ˆ\Ë™[œÝ\™J\Ëœ‘ØÝ[Y[˜Ø][ÙË›Ü\™ÜÊNÂˆBˆ\Þ[˜È[š]ØÝ[Y[
™XÛÝ™\žS[ÙJHÂˆ]ØZ]\Ë™[œÝ\™QØÊ˜ÚXÚÒXY\ˆŠNÂˆ]ØZ]\Ë™[œÝ\™QØÊœ\œÙTÝ\™YˆŠNÂˆ]ØZ]\Ë™[œÝ\™QØÊœ\œÙH‹Ü™XÛÝ™\žS[ÙWJNÂˆ]ØZ]\Ë™[œÝ\™QØÊ˜ÚXÚÑš\œÝYÙH‹Ü™XÛÝ™\žS[ÙWJNÂˆ]ØZ]\Ë™[œÝ\™QØÊ˜ÚXÚÓ\ÝYÙH‹Ü™XÛÝ™\žS[ÙWJNÂˆBˆÙ]YÙJYÙR[™^
HÂˆ™]\›ˆ\Ëœ‘ØÝ[Y[™Ù]YÙJYÙR[™^
NÂˆBˆ›Û˜[˜XÚÊY[™\ŠHÂˆ™]\›ˆ\Ëœ‘ØÝ[Y[™›Û˜[˜XÚÊY[™\ŠNÂˆBˆÛX[\
X[X[UšYÙÙ\™YH˜[ÙJHÂˆ™]\›ˆ\Ëœ‘ØÝ[Y[˜ÛX[\
X[X[UšYÙÙ\™Y
NÂˆBˆ\Þ[˜È[œÝ\™JØš‹›Ü\™ÜÊHÂˆ[œ™XXÚX›JXœÝ˜XÝY]Ù[œÝ\™XØ[YŠNÂˆBˆ™\]Y\Ý˜[™ÙJ™YÚ[‹[™
HÂˆ[œ™XXÚX›JXœÝ˜XÝY]Ù™\]Y\Ý˜[™ÙXØ[YŠNÂˆBˆ™\]Y\ÝØYYÝ™X[J›Ñ™]ÚH˜[ÙJHÂˆ[œ™XXÚX›JXœÝ˜XÝY]Ù™\]Y\ÝØYYÝ™X[XØ[YŠNÂˆBˆÙ[™›ÙÜ™\ÜÚ]™Q]JÚ[šÊHÂˆ[œ™XXÚX›JXœÝ˜XÝY]ÙÙ[™›ÙÜ™\ÜÚ]™Q]XØ[YŠNÂˆBˆ\]T\ÜÝÛÜ™
\ÜÝÛÜ™
HÂˆ\Ë—Ü\ÜÝÛÜ™H\ÜÝÛÜ™Âˆ\Ëœ‘ØÝ[Y[ž™Y‹™[˜Üž\ËœÙ]\ÜÝÛÜ™
\ÜÝÛÜ™
NÂˆBˆ\›Z[˜]J™X\ÛÛŠHÂˆ[œ™XXÚX›JXœÝ˜XÝY]Ù\›Z[˜]XØ[YŠNÂˆBŸB˜Û\ÜÈØØ[“X[˜YÙ\ˆ^[™È˜\ÙT“X[˜YÙ\ˆÂˆÛÛœÝXÝÜŠ\™ÜÊHÂˆÝ\\Š\™ÜÊNÂˆÛÛœÝÝ™X[HH™]ÈÝ™X[J\™ÜËœÛÝ\˜ÙJNÂˆ\Ëœ‘ØÝ[Y[H™]È‘ØÝ[Y[
\ËÝ™X[JNÂˆ\Ë—ÛØYYÝ™X[T›ÛZ\ÙHH›ÛZ\ÙKœ™\ÛÛ™JÝ™X[JNÂˆBˆ\Þ[˜È[œÝ\™JØš‹›Ü\™ÜÊHÂˆÛÛœÝ˜[YHHØš–Ü›ÜNÂˆYˆ
\[Ùˆ˜[YHOOH™[˜Ý[ÛˆŠHÂˆ™]\›ˆ˜[YK˜\JØš‹\™ÜÊNÂˆBˆ™]\›ˆ˜[YNÂˆBˆ™\]Y\ÝØYYÝ™X[J›Ñ™]ÚH˜[ÙJHÂˆ™]\›ˆ\Ë—ÛØYYÝ™X[T›ÛZ\ÙNÂˆBˆ\›Z[˜]J™X\ÛÛŠHßBŸB˜Û\ÜÈ™]ÛÜšÔ“X[˜YÙ\ˆ^[™È˜\ÙT“X[˜YÙ\ˆÂˆÛÛœÝXÝÜŠ\™ÜÊHÂˆÝ\\Š\™ÜÊNÂˆ\ËœÝ™X[SX[˜YÙ\ˆH™]ÈÚ[šÙYÝ™X[SX[˜YÙ\Š\™ÜËœÛÝ\˜ÙKÂˆ\ÙÒ[™\Žˆ\™ÜËš[™\‹ˆ[™Ýˆ\™ÜË›[™Ýˆ\ØX›P]]Ñ™]Úˆ\™ÜË™\ØX›P]]Ñ™]Úˆ˜[™ÙPÚ[šÔÚ^™Nˆ\™ÜËœ˜[™ÙPÚ[šÔÚ^™BˆJNÂˆ\Ëœ‘ØÝ[Y[H™]È‘ØÝ[Y[
\Ë\ËœÝ™X[SX[˜YÙ\‹™Ù]Ý™X[J
JNÂˆBˆ\Þ[˜È[œÝ\™JØš‹›Ü\™ÜÊHÂˆžHÂˆÛÛœÝ˜[YHHØš–Ü›ÜNÂˆYˆ
\[Ùˆ˜[YHOOH™[˜Ý[ÛˆŠHÂˆ™]\›ˆ]ØZ]˜[YK˜\JØš‹\™ÜÊNÂˆBˆ™]\›ˆ˜[YNÂˆHØ]Ú
^
HÂˆYˆ
J^[œÝ[˜Ù[ÙˆZ\ÜÚ[™Ñ]Q^Ù\[ÛŠJHÂˆ›ÝÈ^ÂˆBˆ]ØZ]\Ëœ™\]Y\Ý˜[™ÙJ^˜™YÚ[‹^™[™
NÂˆ™]\›ˆ\Ë™[œÝ\™JØš‹›Ü\™ÜÊNÂˆBˆBˆ™\]Y\Ý˜[™ÙJ™YÚ[‹[™
HÂˆ™]\›ˆ\ËœÝ™X[SX[˜YÙ\‹œ™\]Y\Ý˜[™ÙJ™YÚ[‹[™
NÂˆBˆ™\]Y\ÝØYYÝ™X[J›Ñ™]ÚH˜[ÙJHÂˆ™]\›ˆ\ËœÝ™X[SX[˜YÙ\‹œ™\]Y\Ý[Ú[šÜÊ›Ñ™]Ú
NÂˆBˆÙ[™›ÙÜ™\ÜÚ]™Q]JÚ[šÊHÂˆ\ËœÝ™X[SX[˜YÙ\‹›Û”™XÙZ]™Q]JÂˆÚ[šÂˆJNÂˆBˆ\›Z[˜]J™X\ÛÛŠHÂˆ\ËœÝ™X[SX[˜YÙ\‹˜X›Ü
™X\ÛÛŠNÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËÜÚ\™YÛY\ÜØYÙWÚ[™\‹šœÂ‚˜ÛÛœÝØ[˜XÚÒÚ[™HÂˆUNˆKˆT”“ÔŽˆ‚ŸNÂ˜ÛÛœÝÝ™X[RÚ[™HÂˆÐSÑSˆKˆÐSÑSÐÓÓTUNˆ‹ˆÓÔÑNˆËˆS”UQUQNˆˆT”“ÔŽˆKˆSˆ‹ˆSÐÓÓTUNˆËˆÕT•ÐÓÓTUNˆŸNÂ™[˜Ý[ÛˆÛ‘›Š
HßB™[˜Ý[ÛˆÜ˜\™X\ÛÛŠ^
HÂˆYˆ
^[œÝ[˜Ù[ÙˆX›Ü^Ù\[Ûˆ^[œÝ[˜Ù[Ùˆ[˜[Y‘^Ù\[Ûˆ^[œÝ[˜Ù[Ùˆ\ÜÝÛÜ™^Ù\[Ûˆ^[œÝ[˜Ù[Ùˆ™\ÜÛœÙQ^Ù\[Ûˆ^[œÝ[˜Ù[Ùˆ[šÛ›ÝÛ‘\œ›Ü‘^Ù\[ÛŠHÂˆ™]\›ˆ^ÂˆBˆYˆ
J^[œÝ[˜Ù[Ùˆ\œ›Üˆ\[Ùˆ^OOH›Øš™XÝˆ	‰ˆ^OOH[
JHÂˆ[œ™XXÚX›J	ÝÜ˜\™X\ÛÛŽˆ^XÝYœ™X\ÛÛˆˆÈ™HH
ÜÜÚX›HÛÛ™Y
H\œ›Ü‹‰ÊNÂˆBˆÝÚ]Ú
^›˜[YJHÂˆØ\ÙHX›Ü^Ù\[ÛˆŽ‚ˆ™]\›ˆ™]ÈX›Ü^Ù\[ÛŠ^›Y\ÜØYÙJNÂˆØ\ÙH’[˜[Y‘^Ù\[ÛˆŽ‚ˆ™]\›ˆ™]È[˜[Y‘^Ù\[ÛŠ^›Y\ÜØYÙJNÂˆØ\ÙH”\ÜÝÛÜ™^Ù\[ÛˆŽ‚ˆ™]\›ˆ™]È\ÜÝÛÜ™^Ù\[ÛŠ^›Y\ÜØYÙK^˜ÛÙJNÂˆØ\ÙH”™\ÜÛœÙQ^Ù\[ÛˆŽ‚ˆ™]\›ˆ™]È™\ÜÛœÙQ^Ù\[ÛŠ^›Y\ÜØYÙK^œÝ]\Ë^›Z\ÜÚ[™ÊNÂˆØ\ÙH•[šÛ›ÝÛ‘\œ›Ü‘^Ù\[ÛˆŽ‚ˆ™]\›ˆ™]È[šÛ›ÝÛ‘\œ›Ü‘^Ù\[ÛŠ^›Y\ÜØYÙK^™]Z[ÊNÂˆBˆ™]\›ˆ™]È[šÛ›ÝÛ‘\œ›Ü‘^Ù\[ÛŠ^›Y\ÜØYÙK^ÔÝš[™Ê
JNÂŸB˜Û\ÜÈY\ÜØYÙR[™\ˆÂˆÛY\ÜØYÙPPÈH™]ÈX›ÜÛÛ›Û\Š
NÂˆÛÛœÝXÝÜŠÛÝ\˜ÙS˜[YK\™Ù]˜[YKÛÛSØšŠHÂˆ\ËœÛÝ\˜ÙS˜[YHHÛÝ\˜ÙS˜[YNÂˆ\Ë\™Ù]˜[YHH\™Ù]˜[YNÂˆ\Ë˜ÛÛSØšˆHÛÛSØšŽÂˆ\Ë˜Ø[˜XÚÒYHNÂˆ\ËœÝ™X[RYHNÂˆ\ËœÝ™X[TÚ[šÜÈHØš™XÝ˜Ü™X]J[
NÂˆ\ËœÝ™X[PÛÛ›Û\œÈHØš™XÝ˜Ü™X]J[
NÂˆ\Ë˜Ø[˜XÚÐØ\Xš[]Y\ÈHØš™XÝ˜Ü™X]J[
NÂˆ\Ë˜XÝ[Û’[™\ˆHØš™XÝ˜Ü™X]J[
NÂˆÛÛSØš‹˜Y]™[\Ý[™\Š›Y\ÜØYÙH‹\ËˆÛÛ“Y\ÜØYÙK˜š[™
\ÊKÂˆÚYÛ˜[ˆ\ËˆÛY\ÜØYÙPPËœÚYÛ˜[ˆJNÂˆBˆÛÛ“Y\ÜØYÙJÂˆ]BˆJHÂˆYˆ
]K\™Ù]˜[YHOOH\ËœÛÝ\˜ÙS˜[YJHÂˆ™]\›ŽÂˆBˆYˆ
]KœÝ™X[JHÂˆ\ËˆÜ›ØÙ\ÜÔÝ™X[SY\ÜØYÙJ]JNÂˆ™]\›ŽÂˆBˆYˆ
]K˜Ø[˜XÚÊHÂˆÛÛœÝØ[˜XÚÒYH]K˜Ø[˜XÚÒYÂˆÛÛœÝØ\Xš[]HH\Ë˜Ø[˜XÚÐØ\Xš[]Y\ÖØØ[˜XÚÒYNÂˆYˆ
XØ\Xš[]JHÂˆ›ÝÈ™]È\œ›ÜŠØ[››Ý™\ÛÛ™HØ[˜XÚÈ	ØØ[˜XÚÒYX
NÂˆBˆ[]H\Ë˜Ø[˜XÚÐØ\Xš[]Y\ÖØØ[˜XÚÒYNÂˆYˆ
]K˜Ø[˜XÚÈOOHØ[˜XÚÒÚ[™‘UJHÂˆØ\Xš[]Kœ™\ÛÛ™J]K™]JNÂˆH[ÙHYˆ
]K˜Ø[˜XÚÈOOHØ[˜XÚÒÚ[™‘T”“ÔŠHÂˆØ\Xš[]Kœ™Z™XÝ
Ü˜\™X\ÛÛŠ]Kœ™X\ÛÛŠJNÂˆH[ÙHÂˆ›ÝÈ™]È\œ›ÜŠ•[™^XÝYØ[˜XÚÈØ\ÙHŠNÂˆBˆ™]\›ŽÂˆBˆÛÛœÝXÝ[ÛˆH\Ë˜XÝ[Û’[™\–Ù]K˜XÝ[Û—NÂˆYˆ
XXÝ[ÛŠHÂˆ›ÝÈ™]È\œ›ÜŠ[šÛ›ÝÛˆXÝ[Ûˆœ›ÛHÛÜšÙ\Žˆ	Ù]K˜XÝ[ÛŸX
NÂˆBˆYˆ
]K˜Ø[˜XÚÒY
HÂˆÛÛœÝÛÝ\˜ÙS˜[YHH\ËœÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YHH]KœÛÝ\˜ÙS˜[YKˆÛÛSØšˆH\Ë˜ÛÛSØšŽÂˆ›ÛZ\ÙKžJXÝ[Û‹]K™]JK[Š[˜Ý[Ûˆ
™\Ý[
HÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆØ[˜XÚÎˆØ[˜XÚÒÚ[™‘UKˆØ[˜XÚÒYˆ]K˜Ø[˜XÚÒYˆ]Nˆ™\Ý[ˆJNÂˆK[˜Ý[Ûˆ
™X\ÛÛŠHÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆØ[˜XÚÎˆØ[˜XÚÒÚ[™‘T”“Ô‹ˆØ[˜XÚÒYˆ]K˜Ø[˜XÚÒYˆ™X\ÛÛŽˆÜ˜\™X\ÛÛŠ™X\ÛÛŠBˆJNÂˆJNÂˆ™]\›ŽÂˆBˆYˆ
]KœÝ™X[RY
HÂˆ\ËˆØÜ™X]TÝ™X[TÚ[šÊ]JNÂˆ™]\›ŽÂˆBˆXÝ[ÛŠ]K™]JNÂˆBˆÛŠXÝ[Û“˜[YK[™\ŠHÂˆÛÛœÝZH\Ë˜XÝ[Û’[™\ŽÂˆYˆ
ZØXÝ[Û“˜[YWJHÂˆ›ÝÈ™]È\œ›ÜŠ\™H\È[™XYH[ˆXÝ[Û“˜[YHØ[Y‰ØXÝ[Û“˜[Y_H˜
NÂˆBˆZØXÝ[Û“˜[YWHH[™\ŽÂˆBˆÙ[™
XÝ[Û“˜[YK]K˜[œÙ™\œÊHÂˆ\Ë˜ÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YNˆ\ËœÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YNˆ\Ë\™Ù]˜[YKˆXÝ[ÛŽˆXÝ[Û“˜[YKˆ]BˆK˜[œÙ™\œÊNÂˆBˆÙ[™Ú]›ÛZ\ÙJXÝ[Û“˜[YK]K˜[œÙ™\œÊHÂˆÛÛœÝØ[˜XÚÒYH\Ë˜Ø[˜XÚÒY
ÊÎÂˆÛÛœÝØ\Xš[]HH›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
NÂˆ\Ë˜Ø[˜XÚÐØ\Xš[]Y\ÖØØ[˜XÚÒYHHØ\Xš[]NÂˆžHÂˆ\Ë˜ÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YNˆ\ËœÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YNˆ\Ë\™Ù]˜[YKˆXÝ[ÛŽˆXÝ[Û“˜[YKˆØ[˜XÚÒYˆ]BˆK˜[œÙ™\œÊNÂˆHØ]Ú
^
HÂˆØ\Xš[]Kœ™Z™XÝ
^
NÂˆBˆ™]\›ˆØ\Xš[]Kœ›ÛZ\ÙNÂˆBˆÙ[™Ú]Ý™X[JXÝ[Û“˜[YK]K]Y]YZ[™ÔÝ˜]YÞK˜[œÙ™\œÊHÂˆÛÛœÝÝ™X[RYH\ËœÝ™X[RY
ÊËˆÛÝ\˜ÙS˜[YHH\ËœÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YHH\Ë\™Ù]˜[YKˆÛÛSØšˆH\Ë˜ÛÛSØšŽÂˆ™]\›ˆ™]È™XYX›TÝ™X[JÂˆÝ\ˆÛÛ›Û\ˆOˆÂˆÛÛœÝÝ\Ø\Xš[]HH›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
NÂˆ\ËœÝ™X[PÛÛ›Û\œÖÜÝ™X[RYHHÂˆÛÛ›Û\‹ˆÝ\Ø[ˆÝ\Ø\Xš[]Kˆ[Ø[ˆ[ˆØ[˜Ù[Ø[ˆ[ˆ\ÐÛÜÙYˆ˜[ÙBˆNÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆXÝ[ÛŽˆXÝ[Û“˜[YKˆÝ™X[RYˆ]Kˆ\Ú\™YÚ^™NˆÛÛ›Û\‹™\Ú\™YÚ^™BˆK˜[œÙ™\œÊNÂˆ™]\›ˆÝ\Ø\Xš[]Kœ›ÛZ\ÙNÂˆKˆ[ˆÛÛ›Û\ˆOˆÂˆÛÛœÝ[Ø\Xš[]HH›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
NÂˆ\ËœÝ™X[PÛÛ›Û\œÖÜÝ™X[RYKœ[Ø[H[Ø\Xš[]NÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™”SˆÝ™X[RYˆ\Ú\™YÚ^™NˆÛÛ›Û\‹™\Ú\™YÚ^™BˆJNÂˆ™]\›ˆ[Ø\Xš[]Kœ›ÛZ\ÙNÂˆKˆØ[˜Ù[ˆ™X\ÛÛˆOˆÂˆ\ÜÙ\
™X\ÛÛˆ[œÝ[˜Ù[Ùˆ\œ›Ü‹˜Ø[˜Ù[]\Ý]™HH˜[Y™X\ÛÛˆŠNÂˆÛÛœÝØ[˜Ù[Ø\Xš[]HH›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
NÂˆ\ËœÝ™X[PÛÛ›Û\œÖÜÝ™X[RYK˜Ø[˜Ù[Ø[HØ[˜Ù[Ø\Xš[]NÂˆ\ËœÝ™X[PÛÛ›Û\œÖÜÝ™X[RYKš\ÐÛÜÙYHYNÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™ÐSÑSˆÝ™X[RYˆ™X\ÛÛŽˆÜ˜\™X\ÛÛŠ™X\ÛÛŠBˆJNÂˆ™]\›ˆØ[˜Ù[Ø\Xš[]Kœ›ÛZ\ÙNÂˆBˆK]Y]YZ[™ÔÝ˜]YÞJNÂˆBˆØÜ™X]TÝ™X[TÚ[šÊ]JHÂˆÛÛœÝÝ™X[RYH]KœÝ™X[RYˆÛÝ\˜ÙS˜[YHH\ËœÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YHH]KœÛÝ\˜ÙS˜[YKˆÛÛSØšˆH\Ë˜ÛÛSØšŽÂˆÛÛœÝÙ[ˆH\ËˆXÝ[ÛˆH\Ë˜XÝ[Û’[™\–Ù]K˜XÝ[Û—NÂˆÛÛœÝÝ™X[TÚ[šÈHÂˆ[œ]Y]YJÚ[šËÚ^™HHK˜[œÙ™\œÊHÂˆYˆ
\Ëš\ÐØ[˜Ù[Y
HÂˆ™]\›ŽÂˆBˆÛÛœÝ\Ý\Ú\™YÚ^™HH\Ë™\Ú\™YÚ^™NÂˆ\Ë™\Ú\™YÚ^™HOHÚ^™NÂˆYˆ
\Ý\Ú\™YÚ^™Hˆ	‰ˆ\Ë™\Ú\™YÚ^™HH
HÂˆ\ËœÚ[šÐØ\Xš[]HH›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
NÂˆ\Ëœ™XYHH\ËœÚ[šÐØ\Xš[]Kœ›ÛZ\ÙNÂˆBˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™‘S”UQUQKˆÝ™X[RYˆÚ[šÂˆK˜[œÙ™\œÊNÂˆKˆÛÜÙJ
HÂˆYˆ
\Ëš\ÐØ[˜Ù[Y
HÂˆ™]\›ŽÂˆBˆ\Ëš\ÐØ[˜Ù[YHYNÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™ÓÔÑKˆÝ™X[RYˆJNÂˆ[]HÙ[‹œÝ™X[TÚ[šÜÖÜÝ™X[RYNÂˆKˆ\œ›ÜŠ™X\ÛÛŠHÂˆ\ÜÙ\
™X\ÛÛˆ[œÝ[˜Ù[Ùˆ\œ›Ü‹™\œ›Üˆ]\Ý]™HH˜[Y™X\ÛÛˆŠNÂˆYˆ
\Ëš\ÐØ[˜Ù[Y
HÂˆ™]\›ŽÂˆBˆ\Ëš\ÐØ[˜Ù[YHYNÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™‘T”“Ô‹ˆÝ™X[RYˆ™X\ÛÛŽˆÜ˜\™X\ÛÛŠ™X\ÛÛŠBˆJNÂˆKˆÚ[šÐØ\Xš[]Nˆ›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
KˆÛ”[ˆ[ˆÛØ[˜Ù[ˆ[ˆ\ÐØ[˜Ù[Yˆ˜[ÙKˆ\Ú\™YÚ^™Nˆ]K™\Ú\™YÚ^™Kˆ™XYNˆ[ˆNÂˆÝ™X[TÚ[šËœÚ[šÐØ\Xš[]Kœ™\ÛÛ™J
NÂˆÝ™X[TÚ[šËœ™XYHHÝ™X[TÚ[šËœÚ[šÐØ\Xš[]Kœ›ÛZ\ÙNÂˆ\ËœÝ™X[TÚ[šÜÖÜÝ™X[RYHHÝ™X[TÚ[šÎÂˆ›ÛZ\ÙKžJXÝ[Û‹]K™]KÝ™X[TÚ[šÊK[Š[˜Ý[Ûˆ

HÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™”ÕT•ÐÓÓTUKˆÝ™X[RYˆÝXØÙ\ÜÎˆYBˆJNÂˆK[˜Ý[Ûˆ
™X\ÛÛŠHÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™”ÕT•ÐÓÓTUKˆÝ™X[RYˆ™X\ÛÛŽˆÜ˜\™X\ÛÛŠ™X\ÛÛŠBˆJNÂˆJNÂˆBˆÜ›ØÙ\ÜÔÝ™X[SY\ÜØYÙJ]JHÂˆÛÛœÝÝ™X[RYH]KœÝ™X[RYˆÛÝ\˜ÙS˜[YHH\ËœÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YHH]KœÛÝ\˜ÙS˜[YKˆÛÛSØšˆH\Ë˜ÛÛSØšŽÂˆÛÛœÝÝ™X[PÛÛ›Û\ˆH\ËœÝ™X[PÛÛ›Û\œÖÜÝ™X[RYKˆÝ™X[TÚ[šÈH\ËœÝ™X[TÚ[šÜÖÜÝ™X[RYNÂˆÝÚ]Ú
]KœÝ™X[JHÂˆØ\ÙHÝ™X[RÚ[™”ÕT•ÐÓÓTUN‚ˆYˆ
]KœÝXØÙ\ÜÊHÂˆÝ™X[PÛÛ›Û\‹œÝ\Ø[œ™\ÛÛ™J
NÂˆH[ÙHÂˆÝ™X[PÛÛ›Û\‹œÝ\Ø[œ™Z™XÝ
Ü˜\™X\ÛÛŠ]Kœ™X\ÛÛŠJNÂˆBˆœ™XZÎÂˆØ\ÙHÝ™X[RÚ[™”SÐÓÓTUN‚ˆYˆ
]KœÝXØÙ\ÜÊHÂˆÝ™X[PÛÛ›Û\‹œ[Ø[œ™\ÛÛ™J
NÂˆH[ÙHÂˆÝ™X[PÛÛ›Û\‹œ[Ø[œ™Z™XÝ
Ü˜\™X\ÛÛŠ]Kœ™X\ÛÛŠJNÂˆBˆœ™XZÎÂˆØ\ÙHÝ™X[RÚ[™”S‚ˆYˆ
\Ý™X[TÚ[šÊHÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™”SÐÓÓTUKˆÝ™X[RYˆÝXØÙ\ÜÎˆYBˆJNÂˆœ™XZÎÂˆBˆYˆ
Ý™X[TÚ[šË™\Ú\™YÚ^™HH	‰ˆ]K™\Ú\™YÚ^™Hˆ
HÂˆÝ™X[TÚ[šËœÚ[šÐØ\Xš[]Kœ™\ÛÛ™J
NÂˆBˆÝ™X[TÚ[šË™\Ú\™YÚ^™HH]K™\Ú\™YÚ^™NÂˆ›ÛZ\ÙKžJÝ™X[TÚ[šË›Û”[Û‘›ŠK[Š[˜Ý[Ûˆ

HÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™”SÐÓÓTUKˆÝ™X[RYˆÝXØÙ\ÜÎˆYBˆJNÂˆK[˜Ý[Ûˆ
™X\ÛÛŠHÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™”SÐÓÓTUKˆÝ™X[RYˆ™X\ÛÛŽˆÜ˜\™X\ÛÛŠ™X\ÛÛŠBˆJNÂˆJNÂˆœ™XZÎÂˆØ\ÙHÝ™X[RÚ[™‘S”UQUQN‚ˆ\ÜÙ\
Ý™X[PÛÛ›Û\‹™[œ]Y]YHÚÝ[]™HÝ™X[HÛÛ›Û\ˆŠNÂˆYˆ
Ý™X[PÛÛ›Û\‹š\ÐÛÜÙY
HÂˆœ™XZÎÂˆBˆÝ™X[PÛÛ›Û\‹˜ÛÛ›Û\‹™[œ]Y]YJ]K˜Ú[šÊNÂˆœ™XZÎÂˆØ\ÙHÝ™X[RÚ[™ÓÔÑN‚ˆ\ÜÙ\
Ý™X[PÛÛ›Û\‹˜ÛÜÙHÚÝ[]™HÝ™X[HÛÛ›Û\ˆŠNÂˆYˆ
Ý™X[PÛÛ›Û\‹š\ÐÛÜÙY
HÂˆœ™XZÎÂˆBˆÝ™X[PÛÛ›Û\‹š\ÐÛÜÙYHYNÂˆÝ™X[PÛÛ›Û\‹˜ÛÛ›Û\‹˜ÛÜÙJ
NÂˆ\ËˆÙ[]TÝ™X[PÛÛ›Û\ŠÝ™X[PÛÛ›Û\‹Ý™X[RY
NÂˆœ™XZÎÂˆØ\ÙHÝ™X[RÚ[™‘T”“ÔŽ‚ˆ\ÜÙ\
Ý™X[PÛÛ›Û\‹™\œ›ÜˆÚÝ[]™HÝ™X[HÛÛ›Û\ˆŠNÂˆÝ™X[PÛÛ›Û\‹˜ÛÛ›Û\‹™\œ›ÜŠÜ˜\™X\ÛÛŠ]Kœ™X\ÛÛŠJNÂˆ\ËˆÙ[]TÝ™X[PÛÛ›Û\ŠÝ™X[PÛÛ›Û\‹Ý™X[RY
NÂˆœ™XZÎÂˆØ\ÙHÝ™X[RÚ[™ÐSÑSÐÓÓTUN‚ˆYˆ
]KœÝXØÙ\ÜÊHÂˆÝ™X[PÛÛ›Û\‹˜Ø[˜Ù[Ø[œ™\ÛÛ™J
NÂˆH[ÙHÂˆÝ™X[PÛÛ›Û\‹˜Ø[˜Ù[Ø[œ™Z™XÝ
Ü˜\™X\ÛÛŠ]Kœ™X\ÛÛŠJNÂˆBˆ\ËˆÙ[]TÝ™X[PÛÛ›Û\ŠÝ™X[PÛÛ›Û\‹Ý™X[RY
NÂˆœ™XZÎÂˆØ\ÙHÝ™X[RÚ[™ÐSÑS‚ˆYˆ
\Ý™X[TÚ[šÊHÂˆœ™XZÎÂˆBˆÛÛœÝ]T™X\ÛÛˆHÜ˜\™X\ÛÛŠ]Kœ™X\ÛÛŠNÂˆ›ÛZ\ÙKžJÝ™X[TÚ[šË›ÛØ[˜Ù[Û‘›‹]T™X\ÛÛŠK[Š[˜Ý[Ûˆ

HÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™ÐSÑSÐÓÓTUKˆÝ™X[RYˆÝXØÙ\ÜÎˆYBˆJNÂˆK[˜Ý[Ûˆ
™X\ÛÛŠHÂˆÛÛSØš‹œÜÝY\ÜØYÙJÂˆÛÝ\˜ÙS˜[YKˆ\™Ù]˜[YKˆÝ™X[NˆÝ™X[RÚ[™ÐSÑSÐÓÓTUKˆÝ™X[RYˆ™X\ÛÛŽˆÜ˜\™X\ÛÛŠ™X\ÛÛŠBˆJNÂˆJNÂˆÝ™X[TÚ[šËœÚ[šÐØ\Xš[]Kœ™Z™XÝ
]T™X\ÛÛŠNÂˆÝ™X[TÚ[šËš\ÐØ[˜Ù[YHYNÂˆ[]H\ËœÝ™X[TÚ[šÜÖÜÝ™X[RYNÂˆœ™XZÎÂˆY˜][‚ˆ›ÝÈ™]È\œ›ÜŠ•[™^XÝYÝ™X[HØ\ÙHŠNÂˆBˆBˆ\Þ[˜ÈÙ[]TÝ™X[PÛÛ›Û\ŠÝ™X[PÛÛ›Û\‹Ý™X[RY
HÂˆ]ØZ]›ÛZ\ÙK˜[Ù]Y
ÜÝ™X[PÛÛ›Û\‹œÝ\Ø[Ëœ›ÛZ\ÙKÝ™X[PÛÛ›Û\‹œ[Ø[Ëœ›ÛZ\ÙKÝ™X[PÛÛ›Û\‹˜Ø[˜Ù[Ø[Ëœ›ÛZ\ÙWJNÂˆ[]H\ËœÝ™X[PÛÛ›Û\œÖÜÝ™X[RYNÂˆBˆ\Ý›ÞJ
HÂˆ\ËˆÛY\ÜØYÙPPÏË˜X›Ü

NÂˆ\ËˆÛY\ÜØYÙPPÈH[ÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÝÜš]\‹šœÂ‚‚‚‚‚‚‚˜\Þ[˜È[˜Ý[ÛˆÜš]SØš™XÝ
™Y‹Øš‹Y™™\‹Âˆ[˜Üž\H[ˆ[˜Üž\™YˆH[ŸJHÂˆÛÛœÝ˜[œÙ›Ü›HH[˜Üž\	‰ˆ[˜Üž\™YˆOOH™YˆÈ[˜Üž\˜Ü™X]PÚ\\•˜[œÙ›Ü›J™Y‹›[K™Y‹™Ù[ŠHˆ[ÂˆY™™\‹œ\Ú
	Ü™Y‹›[_H	Ü™Y‹™Ù[ŸHØš—˜
NÂˆ]ØZ]Üš]U˜[YJØš‹Y™™\‹˜[œÙ›Ü›JNÂˆY™™\‹œ\Ú
—™[™Øš—ˆŠNÂŸB˜\Þ[˜È[˜Ý[ÛˆÜš]QXÝ
XÝY™™\‹˜[œÙ›Ü›JHÂˆY™™\‹œ\Ú
ŠNÂˆ›Üˆ
ÛÛœÝÚÙ^K˜]ÓØš—HÙˆXÝ™Ù]˜]Ñ[šY\Ê
JHÂˆY™™\‹œ\Ú
ÉÙ\ØØ\T“˜[YJÙ^J_H
NÂˆ]ØZ]Üš]U˜[YJ˜]ÓØš‹Y™™\‹˜[œÙ›Ü›JNÂˆBˆY™™\‹œ\Ú
ˆŠNÂŸB˜\Þ[˜È[˜Ý[ÛˆÜš]TÝ™X[JÝ™X[KY™™\‹˜[œÙ›Ü›JHÂˆÝ™X[HHÝ™X[K™Ù]ÜšYÚ[˜[Ý™X[J
NÂˆÝ™X[Kœ™\Ù]

NÂˆ]ž]\ÈHÝ™X[K™Ù]ž]\Ê
NÂˆÛÛœÝÂˆXÝˆHHÝ™X[NÂˆÛÛœÝÙš[\‹\˜[\×HH]ØZ]›ÛZ\ÙK˜[
ÙXÝ™Ù]\Þ[˜Ê‘š[\ˆŠKXÝ™Ù]\Þ[˜Ê‘XÛÙT\›\ÈŠWJNÂˆÛÛœÝš[\–™\›ÈH\œ˜^Kš\Ð\œ˜^Jš[\ŠHÈ]ØZ]XÝž™Y‹™™]ÚY”™Y\Þ[˜Êš[\–ÌJHˆš[\ŽÂˆÛÛœÝ\Ñš[\–™\›Ñ›]QXÛÙHH\Ó˜[YJš[\–™\›Ë‘›]QXÛÙHŠNÂˆÛÛœÝ\Ñš[\–™\›Ò[XYÙQXÛÙHH\Ó˜[YJš[\–™\›Ë‘ÕXÛÙHŠH\Ó˜[YJš[\–™\›Ë’”XÛÙHŠH\Ó˜[YJš[\–™\›Ë’’QÌ‘XÛÙHŠH\Ó˜[YJš[\–™\›ËÐÒU˜^XÛÙHŠH\Ó˜[YJš[\–™\›Ë“•ÑXÛÙHŠNÂˆÛÛœÝ\Ñš[\–™\›ÐÛÛ\™\ÜÙYØš™XÝH\Ñš[\–™\›Ñ›]QXÛÙH\Ñš[\–™\›Ò[XYÙQXÛÙH\Ó˜[YJš[\–™\›Ëœ›ÝQXÛÙHŠNÂˆÛÛœÝRS—ÓS‘ÕÑ“Ô—ÐÓÓT‘TÔÒS‘ÈHMŽÂˆYˆ
Z\Ñš[\–™\›ÐÛÛ\™\ÜÙYØš™XÝ	‰ˆž]\Ë›[™ÝHRS—ÓS‘ÕÑ“Ô—ÐÓÓT‘TÔÒS‘ÊHÂˆžHÂˆÛÛœÝÜÈH™]ÈÛÛ\™\ÜÚ[Û”Ý™X[J™Y›]HŠNÂˆÛÛœÝÜš]\ˆHÜËÜš]X›K™Ù]Üš]\Š
NÂˆ]ØZ]Üš]\‹œ™XYNÂˆÜš]\‹Üš]Jž]\ÊK[Š\Þ[˜È

HOˆÂˆ]ØZ]Üš]\‹œ™XYNÂˆ]ØZ]Üš]\‹˜ÛÜÙJ
NÂˆJK˜Ø]Ú


HOˆßJNÂˆž]\ÈH]ØZ]™]È™\ÜÛœÙJÜËœ™XYX›JK˜ž]\Ê
NÂˆ]™]Ñš[\‹™]Ô\˜[\ÎÂˆYˆ
Yš[\ŠHÂˆ™]Ñš[\ˆH˜[YK™Ù]
‘›]QXÛÙHŠNÂˆH[ÙHYˆ
Z\Ñš[\–™\›Ñ›]QXÛÙJHÂˆ™]Ñš[\ˆH\œ˜^Kš\Ð\œ˜^Jš[\ŠHÈÓ˜[YK™Ù]
‘›]QXÛÙHŠK‹‹™š[\—HˆÓ˜[YK™Ù]
‘›]QXÛÙHŠKš[\—NÂˆYˆ
\˜[\ÊHÂˆ™]Ô\˜[\ÈH\œ˜^Kš\Ð\œ˜^J\˜[\ÊHÈÛ[‹‹œ\˜[\×HˆÛ[\˜[\×NÂˆBˆBˆYˆ
™]Ñš[\ŠHÂˆXÝœÙ]
‘š[\ˆ‹™]Ñš[\ŠNÂˆBˆYˆ
™]Ô\˜[\ÊHÂˆXÝœÙ]
‘XÛÙT\›\È‹™]Ô\˜[\ÊNÂˆBˆHØ]Ú
^
HÂˆ[™›ÊÜš]TÝ™X[HHØ[››ÝÛÛ\™\ÜÈ]Nˆ‰Ù^H‹˜
NÂˆBˆBˆ]Ýš[™ÈHž]\ÕÔÝš[™Êž]\ÊNÂˆYˆ
˜[œÙ›Ü›JHÂˆÝš[™ÈH˜[œÙ›Ü›K™[˜Üž\Ýš[™ÊÝš[™ÊNÂˆBˆXÝœÙ]
“[™Ý‹Ýš[™Ë›[™Ý
NÂˆ]ØZ]Üš]QXÝ
XÝY™™\‹˜[œÙ›Ü›JNÂˆY™™\‹œ\Ú
ˆÝ™X[Wˆ‹Ýš[™Ë—™[™Ý™X[HŠNÂŸB˜\Þ[˜È[˜Ý[ÛˆÜš]P\œ˜^J\œ˜^KY™™\‹˜[œÙ›Ü›JHÂˆY™™\‹œ\Ú
–ÈŠNÂˆ›Üˆ
]HHZHH\œ˜^K›[™ÝÈHZNÈJÊÊHÂˆ]ØZ]Üš]U˜[YJ\œ˜^VÚWKY™™\‹˜[œÙ›Ü›JNÂˆYˆ
HZHHJHÂˆY™™\‹œ\Ú
ˆŠNÂˆBˆBˆY™™\‹œ\Ú
—HŠNÂŸB™[˜Ý[Ûˆ[X™\•Ô”Ýš[™Ê˜[YJHÂˆYˆ
[X™\‹š\Ò[YÙ\Š˜[YJH	‰ˆX]˜XœÊ˜[YJHHYLŒJHÂˆ™]\›ˆšYÒ[
˜[YJKÔÝš[™Ê
NÂˆBˆÛÛœÝÝˆH˜[YKÑš^Y
L
NÂˆ][™HÝ‹›[™ÝÂˆÚ[H
Ý–Ù[™HWHOOHŒŠHÂˆ[™KNÂˆBˆYˆ
Ý–Ù[™HWHOOH‹ˆŠHÂˆ[™KNÂˆBˆ™]\›ˆÝ‹œÛXÙJ[™
NÂŸB˜\Þ[˜È[˜Ý[ÛˆÜš]U˜[YJ˜[YKY™™\‹˜[œÙ›Ü›JHÂˆYˆ
˜[YH[œÝ[˜Ù[Ùˆ˜[YJHÂˆY™™\‹œ\Ú
ÉÙ\ØØ\T“˜[YJ˜[YK›˜[YJ_X
NÂˆH[ÙHYˆ
˜[YH[œÝ[˜Ù[Ùˆ™YŠHÂˆY™™\‹œ\Ú
	Ý˜[YK›[_H	Ý˜[YK™Ù[ŸH˜
NÂˆH[ÙHYˆ
\œ˜^Kš\Ð\œ˜^J˜[YJH\œ˜^PY™™\‹š\ÕšY]Ê˜[YJJHÂˆ]ØZ]Üš]P\œ˜^J˜[YKY™™\‹˜[œÙ›Ü›JNÂˆH[ÙHYˆ
\[Ùˆ˜[YHOOHœÝš[™ÈŠHÂˆYˆ
˜[œÙ›Ü›JHÂˆ˜[YHH˜[œÙ›Ü›K™[˜Üž\Ýš[™Ê˜[YJNÂˆBˆY™™\‹œ\Ú

	Ù\ØØ\TÝš[™Ê˜[YJ_JX
NÂˆH[ÙHYˆ
\[Ùˆ˜[YHOOH›[X™\ˆŠHÂˆY™™\‹œ\Ú
[X™\•Ô”Ýš[™Ê˜[YJJNÂˆH[ÙHYˆ
\[Ùˆ˜[YHOOH˜›ÛÛX[ˆŠHÂˆY™™\‹œ\Ú
˜[YKÔÝš[™Ê
JNÂˆH[ÙHYˆ
˜[YH[œÝ[˜Ù[ÙˆXÝ
HÂˆ]ØZ]Üš]QXÝ
˜[YKY™™\‹˜[œÙ›Ü›JNÂˆH[ÙHYˆ
˜[YH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ]ØZ]Üš]TÝ™X[J˜[YKY™™\‹˜[œÙ›Ü›JNÂˆH[ÙHYˆ
˜[YHOOH[
HÂˆY™™\‹œ\Ú
›[ŠNÂˆH[ÙHÂˆØ\›Š[š[™Y˜[YH[ˆÜš]\Žˆ	Ý\[Ùˆ˜[Y_KX\ÙHš[HHYË˜
NÂˆBŸB™[˜Ý[ÛˆÜš]R[
[X™\‹Ú^™KÙ™œÙ]Y™™\ŠHÂˆ›Üˆ
]HHÚ^™H
ÈÙ™œÙ]HNÈHˆÙ™œÙ]HNÈKKJHÂˆY™™\–ÚWHH[X™\ˆ	ˆ™ŽÂˆ[X™\ˆHÂˆBˆ™]\›ˆÙ™œÙ]
ÈÚ^™NÂŸB™[˜Ý[ÛˆÜš]TÝš[™ÊÝš[™ËÙ™œÙ]Y™™\ŠHÂˆÛÛœÝZHHÝš[™Ë›[™ÝÂˆ›Üˆ
]HHÈHZNÈJÊÊHÂˆY™™\–ÛÙ™œÙ]
ÈWHHÝš[™Ë˜Ú\ÛÙP]
JH	ˆ™ŽÂˆBˆ™]\›ˆÙ™œÙ]
ÈZNÂŸB™[˜Ý[ÛˆÛÛ\]SQJš[\Ú^™K™Y’[™›ÊHÂˆÛÛœÝ[YHHX]™›ÛÜŠ]K››ÝÊ
HÈL
NÂˆÛÛœÝš[[˜[YHH™Y’[™›Ë™š[[˜[YHˆŽÂˆÛÛœÝYPY™™\ˆHÝ[YKÔÝš[™Ê
Kš[[˜[YKš[\Ú^™KÔÝš[™Ê
K‹‹ž™Y’[™›Ëš[™›ÓX\˜[Y\Ê
WNÂˆÛÛœÝYPY™™\“[ˆHX]œÝ[T™XÚ\ÙJYPY™™\‹›X\
ÝˆOˆÝ‹›[™Ý
JNÂˆÛÛœÝ\œ˜^HH™]ÈZ[\œ˜^JYPY™™\“[ŠNÂˆ]Ù™œÙ]HÂˆ›Üˆ
ÛÛœÝÝˆÙˆYPY™™\ŠHÂˆÙ™œÙ]HÜš]TÝš[™ÊÝ‹Ù™œÙ]\œ˜^JNÂˆBˆ™]\›ˆž]\ÕÔÝš[™ÊØ[Ý[]SQJ\œ˜^K\œ˜^K›[™Ý
JNÂŸB™[˜Ý[ÛˆÜš]VQ]Q›ÜXÜ›Ù›Ü›JÝ‹Ú[™Ù\ÊHÂˆÛÛœÝ[H™]ÈÚ[\VS\œÙ\ŠÂˆ\Ð]šX]\ÎˆYBˆJKœ\œÙQœ›ÛTÝš[™ÊÝŠNÂˆ›Üˆ
ÛÛœÝÂˆ˜BˆHÙˆÚ[™Ù\ÊHÂˆYˆ
^˜JHÂˆÛÛ[YNÂˆBˆÛÛœÝÂˆ]ˆ˜[YBˆHH˜NÂˆYˆ
\]˜[YHOOH[
HÂˆÛÛ[YNÂˆBˆÛÛœÝ›ÙT]H\œÙVT]
]
NÂˆ]›ÙHH[™ØÝ[Y[[[Y[œÙX\˜Ú›ÙJ›ÙT]
NÂˆYˆ
[›ÙH	‰ˆ›ÙT]›[™ÝˆJHÂˆ›ÙHH[™ØÝ[Y[[[Y[œÙX\˜Ú›ÙJÛ›ÙT]˜]
LJWK
NÂˆBˆYˆ
›ÙJHÂˆ›ÙK˜Ú[›Ù\ÈH\œ˜^Kš\Ð\œ˜^J˜[YJHÈ˜[YK›X\
˜[Oˆ™]ÈÚ[\QÓS›ÙJ˜[YH‹˜[
JHˆÛ™]ÈÚ[\QÓS›ÙJˆÝ^‹˜[YJWNÂˆH[ÙHÂˆØ\›Š›ÙH›Ý›Ý[™›Üˆ]ˆ	Ü]X
NÂˆBˆBˆÛÛœÝY™™\ˆH×NÂˆ[™ØÝ[Y[[[Y[™[\
Y™™\ŠNÂˆ™]\›ˆY™™\‹š›Ú[ŠˆŠNÂŸB˜\Þ[˜È[˜Ý[Ûˆ\]PXÜ›Ù›Ü›JÂˆ™Y‹ˆXÜ›Ñ›Ü›KˆXÜ›Ñ›Ü›T™Y‹ˆ\Ö˜Kˆ\Ö˜Q]\Ù]Ñ[žKˆ˜Q]\Ù]Ô™Y‹ˆ™YY\X\˜[˜Ù\ËˆÚ[™Ù\ÂŸJHÂˆYˆ
\Ö˜H	‰ˆZ\Ö˜Q]\Ù]Ñ[žH	‰ˆ^˜Q]\Ù]Ô™YŠHÂˆØ\›Š–HHØ[››ÝØ]™H]ŠNÂˆBˆYˆ
[™YY\X\˜[˜Ù\È	‰ˆ
Z\Ö˜H^˜Q]\Ù]Ô™Yˆ\Ö˜Q]\Ù]Ñ[žJJHÂˆ™]\›ŽÂˆBˆÛÛœÝXÝHXÜ›Ñ›Ü›K˜ÛÛ™J
NÂˆYˆ
\Ö˜H	‰ˆZ\Ö˜Q]\Ù]Ñ[žJHÂˆÛÛœÝ™]Ö˜HHXÜ›Ñ›Ü›K™Ù]
–HŠKœÛXÙJ
NÂˆ™]Ö˜KœÜXÙJ‹™]\Ù]ÈŠNÂˆ™]Ö˜KœÜXÙJË˜Q]\Ù]Ô™YŠNÂˆXÝœÙ]
–H‹™]Ö˜JNÂˆBˆYˆ
™YY\X\˜[˜Ù\ÊHÂˆXÝœÙ]
“™YY\X\˜[˜Ù\È‹YJNÂˆBˆÚ[™Ù\Ëœ]
XÜ›Ñ›Ü›T™Y‹Âˆ]NˆXÝˆJNÂŸB™[˜Ý[Ûˆ\]VJÂˆ˜Q]Kˆ˜Q]\Ù]Ô™Y‹ˆÚ[™Ù\Ëˆ™Y‚ŸJHÂˆYˆ
˜Q]HOOH[
HÂˆÛÛœÝ]\Ù]ÈH™Y‹™™]ÚY”™YŠ˜Q]\Ù]Ô™YŠNÂˆ˜Q]HHÜš]VQ]Q›ÜXÜ›Ù›Ü›J]\Ù]Ë™Ù]Ýš[™Ê
KÚ[™Ù\ÊNÂˆBˆÛÛœÝ˜Q]TÝ™X[HH™]ÈÝš[™ÔÝ™X[J˜Q]K™]ÈXÝ
™YŠJNÂˆ˜Q]TÝ™X[K™XÝœÙ]Y“˜[YJ•\H‹‘[X™YYš[HŠNÂˆÚ[™Ù\Ëœ]
˜Q]\Ù]Ô™Y‹Âˆ]Nˆ˜Q]TÝ™X[BˆJNÂŸB˜\Þ[˜È[˜Ý[ÛˆÙ]™Y•X›J™Y’[™›Ë˜\ÙSÙ™œÙ]™]Ô™YœË™]Ö™Y‹Y™™\ŠHÂˆY™™\‹œ\Ú
ž™Y—ˆŠNÂˆÛÛœÝ[™^\ÈHÙ][™^\Ê™]Ô™YœÊNÂˆ][™^\ÔÜÚ][ÛˆHÂˆ›Üˆ
ÛÛœÝÂˆ™Y‹ˆ]BˆHÙˆ™]Ô™YœÊHÂˆYˆ
™Y‹›[HOOH[™^\ÖÚ[™^\ÔÜÚ][Û—JHÂˆY™™\‹œ\Ú
	Ú[™^\ÖÚ[™^\ÔÜÚ][Û—_H	Ú[™^\ÖÚ[™^\ÔÜÚ][Ûˆ
ÈW_W˜
NÂˆ[™^\ÔÜÚ][Ûˆ
ÏHŽÂˆBˆYˆ
]HOOH[
HÂˆY™™\‹œ\Ú
	Ø˜\ÙSÙ™œÙ]ÔÝš[™Ê
KœYÝ\
LŒŠ_H	ÓX]›Z[Š™Y‹™Ù[‹™™™ŠKÔÝš[™Ê
KœYÝ\
KŒŠ_H——˜
NÂˆ˜\ÙSÙ™œÙ]
ÏH]K›[™ÝÂˆH[ÙHÂˆY™™\‹œ\Ú
	ÓX]›Z[Š™Y‹™Ù[ˆ
ÈK™™™ŠKÔÝš[™Ê
KœYÝ\
KŒŠ_H——˜
NÂˆBˆBˆÛÛ\]RQÊ˜\ÙSÙ™œÙ]™Y’[™›Ë™]Ö™YŠNÂˆY™™\‹œ\Ú
˜Z[\—ˆŠNÂˆ]ØZ]Üš]QXÝ
™]Ö™Y‹Y™™\‹[
NÂˆY™™\‹œ\Ú
—œÝ\™Y—ˆ‹˜\ÙSÙ™œÙ]ÔÝš[™Ê
K—‰IQSÑ—ˆŠNÂŸB™[˜Ý[ÛˆÙ][™^\Ê™]Ô™YœÊHÂˆÛÛœÝ[™^\ÈH×NÂˆ›Üˆ
ÛÛœÝÂˆ™Y‚ˆHÙˆ™]Ô™YœÊHÂˆYˆ
™Y‹›[HOOH[™^\Ë˜]
LŠH
È[™^\Ë˜]
LJJHÂˆ[™^\ÖÚ[™^\Ë›[™ÝHWH
ÏHNÂˆH[ÙHÂˆ[™^\Ëœ\Ú
™Y‹›[KJNÂˆBˆBˆ™]\›ˆ[™^\ÎÂŸB˜\Þ[˜È[˜Ý[ÛˆÙ]™Y”Ý™X[UX›J™Y’[™›Ë˜\ÙSÙ™œÙ]™]Ô™YœË™]Ö™Y‹Y™™\ŠHÂˆÛÛœÝ™Y•X›Q]HH×NÂˆ]X^Ù™œÙ]HÂˆ]X^Ù[ˆHÂˆ›Üˆ
ÛÛœÝÂˆ™Y‹ˆ]KˆØš”Ý™X[T™Y‹ˆ[™^ˆHÙˆ™]Ô™YœÊHÂˆ]Ù[ŽÂˆX^Ù™œÙ]HX]›X^
X^Ù™œÙ]˜\ÙSÙ™œÙ]
NÂˆYˆ
Øš”Ý™X[T™YŠHÂˆÙ[ˆH[™^Âˆ™Y•X›Q]Kœ\Ú
Ì‹Øš”Ý™X[T™Y‹›[KÙ[—JNÂˆH[ÙHYˆ
]HOOH[
HÂˆÙ[ˆHX]›Z[Š™Y‹™Ù[‹™™™ŠNÂˆ™Y•X›Q]Kœ\Ú
ÌK˜\ÙSÙ™œÙ]Ù[—JNÂˆ˜\ÙSÙ™œÙ]
ÏH]K›[™ÝÂˆH[ÙHÂˆÙ[ˆHX]›Z[Š™Y‹™Ù[ˆ
ÈK™™™ŠNÂˆ™Y•X›Q]Kœ\Ú
ÌÙ[—JNÂˆBˆX^Ù[ˆHX]›X^
X^Ù[‹Ù[ŠNÂˆBˆ™]Ö™Y‹œÙ]
’[™^‹Ù][™^\Ê™]Ô™YœÊJNÂˆÛÛœÝÙ™œÙ]Ú^™HHÙ]Ú^™R[ž]\ÊX^Ù™œÙ]
NÂˆÛÛœÝX^Ù[”Ú^™HHÙ]Ú^™R[ž]\ÊX^Ù[ŠNÂˆÛÛœÝÚ^™\ÈHÌKÙ™œÙ]Ú^™KX^Ù[”Ú^™WNÂˆ™]Ö™Y‹œÙ]
•È‹Ú^™\ÊNÂˆÛÛ\]RQÊ˜\ÙSÙ™œÙ]™Y’[™›Ë™]Ö™YŠNÂˆÛÛœÝÝXÝÚ^™HHX]œÝ[T™XÚ\ÙJÚ^™\ÊNÂˆÛÛœÝ]HH™]ÈZ[\œ˜^JÝXÝÚ^™H
ˆ™Y•X›Q]K›[™Ý
NÂˆÛÛœÝÝ™X[HH™]ÈÝ™X[J]JNÂˆÝ™X[K™XÝH™]Ö™YŽÂˆ]Ù™œÙ]HÂˆ›Üˆ
ÛÛœÝÝ\KØš“Ù™œÙ]Ù[—HÙˆ™Y•X›Q]JHÂˆÙ™œÙ]HÜš]R[
\KÚ^™\ÖÌKÙ™œÙ]]JNÂˆÙ™œÙ]HÜš]R[
Øš“Ù™œÙ]Ú^™\ÖÌWKÙ™œÙ]]JNÂˆÙ™œÙ]HÜš]R[
Ù[‹Ú^™\ÖÌ—KÙ™œÙ]]JNÂˆBˆ]ØZ]Üš]SØš™XÝ
™Y’[™›Ë›™]Ô™Y‹Ý™X[KY™™\‹ßJNÂˆY™™\‹œ\Ú
œÝ\™Y—ˆ‹˜\ÙSÙ™œÙ]ÔÝš[™Ê
K—‰IQSÑ—ˆŠNÂŸB™[˜Ý[ÛˆÛÛ\]RQÊ˜\ÙSÙ™œÙ]™Y’[™›Ë™]Ö™YŠHÂˆYˆ
\œ˜^Kš\Ð\œ˜^J™Y’[™›Ë™š[RYÊH	‰ˆ™Y’[™›Ë™š[RYË›[™Ýˆ
HÂˆÛÛœÝYHHÛÛ\]SQJ˜\ÙSÙ™œÙ]™Y’[™›ÊNÂˆ™]Ö™Y‹œÙ]
’Q‹Þ™Y’[™›Ë™š[RYÖÌHYKYWJNÂˆBŸB™[˜Ý[ÛˆÙ]˜Z[\‘XÝ
™Y’[™›ËÚ[™Ù\Ë\ÙV™Y”Ý™X[JHÂˆÛÛœÝ™]Ö™YˆH™]ÈXÝ
[
NÂˆ™]Ö™Y‹œÙ]Y‘Yš[™Y
”™]ˆ‹™Y’[™›ÏËœÝ\™YŠNÂˆÛÛœÝ™Y‘›Ü–™Y•X›HH™Y’[™›Ë›™]Ô™YŽÂˆYˆ
\ÙV™Y”Ý™X[JHÂˆÚ[™Ù\Ëœ]
™Y‘›Ü–™Y•X›KÂˆ]Nˆˆ‚ˆJNÂˆ™]Ö™Y‹œÙ]
”Ú^™H‹™Y‘›Ü–™Y•X›K›[H
ÈJNÂˆ™]Ö™Y‹œÙ]Y“˜[YJ•\H‹–™YˆŠNÂˆH[ÙHÂˆ™]Ö™Y‹œÙ]
”Ú^™H‹™Y‘›Ü–™Y•X›K›[JNÂˆBˆ™]Ö™Y‹œÙ]Y‘Yš[™Y
”›ÛÝ‹™Y’[™›ÏËœ›ÛÝ™YŠNÂˆ™]Ö™Y‹œÙ]Y‘Yš[™Y
’[™›È‹™Y’[™›ÏËš[™›Ô™YŠNÂˆ™]Ö™Y‹œÙ]Y‘Yš[™Y
‘[˜Üž\‹™Y’[™›ÏË™[˜Üž\™YŠNÂˆ™]\›ˆ™]Ö™YŽÂŸB˜\Þ[˜È[˜Ý[ÛˆÜš]PÚ[™Ù\ÊÚ[™Ù\Ë™Y‹Y™™\ˆH×JHÂˆÛÛœÝ™]Ô™YœÈH×NÂˆ›Üˆ
ÛÛœÝÜ™Y‹Âˆ]KˆØš”Ý™X[T™Y‹ˆ[™^ˆWHÙˆÚ[™Ù\Ëš][\Ê
JHÂˆYˆ
Øš”Ý™X[T™YŠHÂˆ™]Ô™YœËœ\Ú
Âˆ™Y‹ˆ]KˆØš”Ý™X[T™Y‹ˆ[™^ˆJNÂˆÛÛ[YNÂˆBˆYˆ
]HOOH[\[Ùˆ]HOOHœÝš[™ÈŠHÂˆ™]Ô™YœËœ\Ú
Âˆ™Y‹ˆ]BˆJNÂˆÛÛ[YNÂˆBˆ]ØZ]Üš]SØš™XÝ
™Y‹]KY™™\‹™YŠNÂˆ™]Ô™YœËœ\Ú
Âˆ™Y‹ˆ]NˆY™™\‹š›Ú[ŠˆŠBˆJNÂˆY™™\‹›[™ÝHÂˆBˆ™]\›ˆ™]Ô™YœËœÛÜ

KŠHOˆKœ™Y‹›[HH‹œ™Y‹›[JNÂŸB˜\Þ[˜È[˜Ý[Ûˆ[˜Ü™[Y[[\]JÂˆÜšYÚ[˜[]Kˆ™Y’[™›ËˆÚ[™Ù\Ëˆ™YˆH[ˆ\Ö˜HH˜[ÙKˆ˜Q]\Ù]Ô™YˆH[ˆ\Ö˜Q]\Ù]Ñ[žHH˜[ÙKˆ™YY\X\˜[˜Ù\ËˆXÜ›Ñ›Ü›T™YˆH[ˆXÜ›Ñ›Ü›HH[ˆ˜Q]HH[ˆ\ÙV™Y”Ý™X[HH˜[ÙBŸJHÂˆ]ØZ]\]PXÜ›Ù›Ü›JÂˆ™Y‹ˆXÜ›Ñ›Ü›KˆXÜ›Ñ›Ü›T™Y‹ˆ\Ö˜Kˆ\Ö˜Q]\Ù]Ñ[žKˆ˜Q]\Ù]Ô™Y‹ˆ™YY\X\˜[˜Ù\ËˆÚ[™Ù\ÂˆJNÂˆYˆ
\Ö˜JHÂˆ\]VJÂˆ˜Q]Kˆ˜Q]\Ù]Ô™Y‹ˆÚ[™Ù\Ëˆ™Y‚ˆJNÂˆBˆÛÛœÝ™]Ö™YˆHÙ]˜Z[\‘XÝ
™Y’[™›ËÚ[™Ù\Ë\ÙV™Y”Ý™X[JNÂˆÛÛœÝY™™\ˆH×NÂˆÛÛœÝ™]Ô™YœÈH]ØZ]Üš]PÚ[™Ù\ÊÚ[™Ù\Ë™Y‹Y™™\ŠNÂˆ]˜\ÙSÙ™œÙ]HÜšYÚ[˜[]K›[™ÝÂˆÛÛœÝ\Ýž]HHÜšYÚ[˜[]K˜]
LJNÂˆYˆ
\Ýž]HOOHH	‰ˆ\Ýž]HOOH
HÂˆY™™\‹œ\Ú
—ˆŠNÂˆ˜\ÙSÙ™œÙ]
ÏHNÂˆBˆ›Üˆ
ÛÛœÝÂˆ]BˆHÙˆ™]Ô™YœÊHÂˆYˆ
]HOOH[
HÂˆY™™\‹œ\Ú
]JNÂˆBˆBˆ]ØZ]
\ÙV™Y”Ý™X[HÈÙ]™Y”Ý™X[UX›J™Y’[™›Ë˜\ÙSÙ™œÙ]™]Ô™YœË™]Ö™Y‹Y™™\ŠHˆÙ]™Y•X›J™Y’[™›Ë˜\ÙSÙ™œÙ]™]Ô™YœË™]Ö™Y‹Y™™\ŠJNÂˆÛÛœÝÝ[[™ÝHÜšYÚ[˜[]K›[™Ý
ÈX]œÝ[T™XÚ\ÙJY™™\‹›X\
ÝˆOˆÝ‹›[™Ý
JNÂˆÛÛœÝ\œ˜^HH™]ÈZ[\œ˜^JÝ[[™Ý
NÂˆ\œ˜^KœÙ]
ÜšYÚ[˜[]JNÂˆ]Ù™œÙ]HÜšYÚ[˜[]K›[™ÝÂˆ›Üˆ
ÛÛœÝÝˆÙˆY™™\ŠHÂˆÙ™œÙ]HÜš]TÝš[™ÊÝ‹Ù™œÙ]\œ˜^JNÂˆBˆ™]\›ˆ\œ˜^NÂŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÙY]Ü‹Ü—ÙY]Ü‹šœÂ‚‚‚‚‚‚‚‚‚‚‚‚˜ÛÛœÝPVÓPU‘T×ÔT—ÔQÑT×Ó“ÑHHMŽÂ˜ÛÛœÝPVÒS—ÓSQWÕ‘QWÓ“ÑHHÂ˜Û\ÜÈYÙQ]HÂˆÛÛœÝXÝÜŠYÙKØÝ[Y[]JHÂˆ\ËœYÙHHYÙNÂˆ\Ë™ØÝ[Y[]HHØÝ[Y[]NÂˆ\Ë˜[››Ý][ÛœÈH[Âˆ\ËœÚ[[™Ó˜[YY\Ý[˜][ÛœÈH[Âˆ\Ë˜ÛÜS]™[HÂˆØÝ[Y[]KœYÙ\ÓX\œ]
YÙKœ™Y‹\ÊNÂˆBŸB˜Û\ÜÈØÝ[Y[]HÂˆÛÛœÝXÝÜŠØÝ[Y[
HÂˆ\Ë™ØÝ[Y[HØÝ[Y[Âˆ\Ë™\Ý[˜][ÛœÈH[Âˆ\ËœYÙSX™[ÈH[Âˆ\ËœYÙ\ÓX\H™]È™Y“X\

NÂˆ\Ë›Û™Y“X\[™ÈH™]È™Y“X\

NÂˆ\Ë™Y\˜[YY\Ý[˜][ÛœÈH™]ÈX\

NÂˆ\Ë\ÙY˜[YY\Ý[˜][ÛœÈH™]ÈÙ]

NÂˆ\ËœÜÝÛ™Y™YÛÜY\ÈH™]È™Y“X\

NÂˆ\Ëœ™\ÛÝ\˜ÙTÝ™X[T›ÛZ\Ù\ÈH™]ÈX\

NÂˆ\Ë\ÙYÝXÝ\™[ÈH™]ÈÙ]

NÂˆ\Ë›ÛÝXÝ\™[X\[™ÈH™]ÈX\

NÂˆ\ËœÝXÝ™YT›ÛÝH[Âˆ\Ëœ\™[™YHH[Âˆ\ËšY™YHH[Âˆ\Ëœ›ÛSX\H[Âˆ\Ë˜Û\ÜÓX\H[Âˆ\Ë›˜[Y\ÜXÙ\ÈH[Âˆ\ËœÝXÝ™YPQˆH[Âˆ\ËœÝXÝ™YT›Û[˜ÚX][Û“^XÛÛˆH×NÂˆ\Ë˜XÜ›Ñ›Ü›HH[Âˆ\Ë˜XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙHHˆŽÂˆ\Ë˜XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ÈH[Âˆ\Ë˜XÜ›Ñ›Ü›THHÂˆ\Ëš\ÔÚYÛ˜]\™P[››Ý][ÛœÈH˜[ÙNÂˆ\Ë™šY[Ô\™[H™]È™Y“X\

NÂˆ\Ë›Ý][™HH[Âˆ\Ë™[X™YYš[\ÈH[ÂˆBŸB˜Û\ÜÈ™Y•Ü˜\\ˆÂˆÛÛœÝXÝÜŠ[šY\ËÙ]™]Ô™YŠHÂˆ\Ë™[šY\ÈH[šY\ÎÂˆ\Ë—ÙÙ]™]Ô™YˆHÙ]™]Ô™YŽÂˆBˆÙ]™]Õ[\Ü˜\žT™YŠ
HÂˆ™]\›ˆ\Ë—ÙÙ]™]Ô™YŠ
NÂˆBˆÛÝ[\]\ÐY\ŠÙ™œÙ]
HÂˆ™]\›ˆ[ÂˆBˆ™]ÚY”™YŠØšŠHÂˆ™]\›ˆØšˆ[œÝ[˜Ù[Ùˆ™YˆÈ\Ë™™]Ú
ØšŠHˆØšŽÂˆBˆ™]Ú
™YŠHÂˆYˆ
J™Yˆ[œÝ[˜Ù[Ùˆ™YŠJHÂˆ›ÝÈ™]È\œ›ÜŠœ™YˆØš™XÝ\È›ÝH™Y™\™[˜ÙHŠNÂˆBˆ™]\›ˆ\Ë™[šY\ÖÜ™Y‹›[WNÂˆBˆ\Þ[˜È™]ÚY”™Y\Þ[˜ÊØšŠHÂˆ™]\›ˆØšˆ[œÝ[˜Ù[Ùˆ™YˆÈ\Ë™™]Ú\Þ[˜ÊØšŠHˆØšŽÂˆBˆ\Þ[˜È™]Ú\Þ[˜Ê™YŠHÂˆ™]\›ˆ\Ë™™]Ú
™YŠNÂˆBŸB˜Û\ÜÈ‘Y]ÜˆÂˆ\ÔÚ[™ÛQš[HH˜[ÙNÂˆÛ™]Ð[››Ý][ÛœÔ\˜[\ÈH[ÂˆÜš[X\žQØÝ[Y[H[ÂˆÜ™\ÛÝ\˜ÙTÝ™X[PØXÚHH™]ÈX\

NÂˆÝ\œ™[ØÝ[Y[H[ÂˆÛYÙ\ÈH×NÂˆ™]ÔYÙ\ÈH×NÂˆ™YˆHÛ[NÂˆ™Y•Ü˜\\ˆH™]È™Y•Ü˜\\Š\Ëž™Y‹

HOˆ\Ë›™]Ô™YŠNÂˆ™]Ô™YÛÝ[HNÂˆ˜[Y\ÑXÝH[Âˆ™\œÚ[ÛˆHŒKÈŽÂˆYÙSX™[ÈH[Âˆ˜[YY\Ý[˜][ÛœÈH™]ÈX\

NÂˆ\™[™YHH™]ÈX\

NÂˆÝXÝ™YRÚYÈH×NÂˆY™YHH™]ÈX\

NÂˆÛ\ÜÓX\H™]ÈXÝ

NÂˆ›ÛSX\H™]ÈXÝ

NÂˆ˜[Y\ÜXÙ\ÈH™]ÈX\

NÂˆÝXÝ™YPQˆH×NÂˆÝXÝ™YT›Û[˜ÚX][Û“^XÛÛˆH×NÂˆšY[ÈH×NÂˆXÜ›Ñ›Ü›QY˜][\X\˜[˜ÙHHˆŽÂˆXÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ÈH[ÂˆXÜ›Ñ›Ü›S™YY\X\˜[˜Ù\ÈH˜[ÙNÂˆXÜ›Ñ›Ü›TÚYÑ›YÜÈHÂˆXÜ›Ñ›Ü›PØ[Ý[][Û“Ü™\ˆH[ÂˆXÜ›Ñ›Ü›THHÂˆÝ][™R][\ÈH[Âˆ[X™YYš[\ÈH™]ÈX\

NÂˆÛÛœÝXÝÜŠÂˆ\ÙSØš™XÝÝ™X[\ÈHYKˆ]HHˆ‹ˆ]]ÜˆHˆ‚ˆHHßJHÂˆÝ\Ëœ›ÛÝ™Y‹\Ëœ›ÛÝXÝHH\Ë›™]ÑXÝÂˆÝ\Ëš[™›Ô™Y‹\Ëš[™›ÑXÝHH\Ë›™]ÑXÝÂˆÝ\ËœYÙ\Ô™Y‹\ËœYÙ\ÑXÝHH\Ë›™]ÑXÝÂˆ\Ë\ÙSØš™XÝÝ™X[\ÈH\ÙSØš™XÝÝ™X[\ÎÂˆ\Ë›Øš”Ý™X[T™YœÈH\ÙSØš™XÝÝ™X[\ÈÈ™]ÈÙ]

Hˆ[Âˆ\Ë]HH]NÂˆ\Ë˜]]ÜˆH]]ÜŽÂˆBˆÙ]™]Ô™YŠ
HÂˆ™]\›ˆ™Y‹™Ù]
\Ë›™]Ô™YÛÝ[
ÊË
NÂˆBˆÙ]™]ÑXÝ

HÂˆÛÛœÝ™YˆH\Ë›™]Ô™YŽÂˆÛÛœÝXÝH\Ëž™Y–Ü™Y‹›[WHH™]ÈXÝ

NÂˆ™]\›ˆÜ™Y‹XÝNÂˆBˆ\Þ[˜ÈØÛÛ™SØš™XÝ
Øš‹™YŠHÂˆÛÛœÝ™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–Ü™Y‹›[WHH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊØš‹YK™YŠNÂˆ™]\›ˆ™YŽÂˆBˆÛÛ™QXÝ
XÝ
HÂˆÛÛœÝ™]ÑXÝHXÝ˜ÛÛ™J
NÂˆ™]ÑXÝž™YˆH\Ëž™Y•Ü˜\\ŽÂˆ™]\›ˆ™]ÑXÝÂˆBˆ\Þ[˜ÈØÛÛXÝ\[™[˜ÚY\ÊØš‹]\ÝÛÛ™K™Y‹™\ÛÝ\˜ÙTÝ™X[T]H™]È™Y”Ù]

JHÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ™YŠHÂˆÛÛœÝÂˆÝ\œ™[ØÝ[Y[ˆÂˆšY[Ô\™[ˆÛ™Y“X\[™ÂˆBˆHH\ÎÂˆÛÛœÝ^\Ý[™Ô™YˆHÛ™Y“X\[™Ë™Ù]
ØšŠNÂˆYˆ
^\Ý[™Ô™YŠHÂˆ™]\›ˆ^\Ý[™Ô™YŽÂˆBˆÛÛœÝÛ™YˆHØšŽÂˆØšˆH]ØZ]™Y‹™™]Ú\Þ[˜ÊÛ™YŠNÂˆÛÛœÝX\Y™YˆHÛ™Y“X\[™Ë™Ù]
Û™YŠNÂˆYˆ
X\Y™YŠHÂˆ™]\›ˆX\Y™YŽÂˆBˆYˆ
\[ÙˆØšˆOOH›[X™\ˆŠHÂˆ™]\›ˆØšŽÂˆBˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[H	‰ˆ\ËˆÚ\Ô™\ÛÝ\˜ÙTÝ™X[JØš‹™XÝ
JHÂˆ™]\›ˆ\ËˆØÛÛXÝ™\ÛÝ\˜ÙTÝ™X[JÛ™Y‹Øš‹™Y‹™\ÛÝ\˜ÙTÝ™X[T]
NÂˆBˆÛÛœÝ™]Ô™YˆH\Ë›™]Ô™YŽÂˆÛ™Y“X\[™Ëœ]
Û™Y‹™]Ô™YŠNÂˆ]ÛÛ™TÛÝ\˜ÙHHYNÂˆYˆ
šY[Ô\™[š\ÊÛ™YŠH	‰ˆØšˆ[œÝ[˜Ù[ÙˆXÝ
HÂˆØšˆH\Ë˜ÛÛ™QXÝ
ØšŠNÂˆØš‹™[]J”\™[ŠNÂˆÛÛ™TÛÝ\˜ÙHH˜[ÙNÂˆBˆ\Ëž™Y–Û™]Ô™Y‹›[WHH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊØš‹ÛÛ™TÛÝ\˜ÙK™Y‹™\ÛÝ\˜ÙTÝ™X[T]
NÂˆ™]\›ˆ™]Ô™YŽÂˆBˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆÛÛœÝÂˆÝ\œ™[ØÝ[Y[ˆÂˆÜÝÛ™Y™YÛÜY\ÂˆBˆHH\ÎÂˆYˆ
\œ˜^Kš\Ð\œ˜^JØšŠJHÂˆYˆ
]\ÝÛÛ™JHÂˆØšˆHØš‹œÛXÙJ
NÂˆBˆ›Üˆ
]HHZHHØš‹›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝÜÝÛ™YXÝ[ÛœÈHØš–ÚWH[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆÜÝÛ™Y™YÛÜY\Ë™Ù]
Øš–ÚWJNÂˆYˆ
ÜÝÛ™YXÝ[ÛœÊHÂˆÜÝÛ™YXÝ[ÛœËœ\Ú
™YˆOˆØš–ÚWHH™YŠNÂˆÛÛ[YNÂˆBˆ›ÛZ\Ù\Ëœ\Ú
\ËˆØÛÛXÝ\[™[˜ÚY\ÊØš–ÚWKYK™Y‹™\ÛÝ\˜ÙTÝ™X[T]
K[Š™]ÓØšˆOˆØš–ÚWHH™]ÓØšŠJNÂˆBˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆ™]\›ˆØšŽÂˆBˆ]XÝÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ
ÂˆXÝˆHHØšˆHØš‹™Ù]ÜšYÚ[˜[Ý™X[J
K˜ÛÛ™J
JNÂˆXÝž™YˆH\Ëž™Y•Ü˜\\ŽÂˆH[ÙHYˆ
Øšˆ[œÝ[˜Ù[ÙˆXÝ
HÂˆYˆ
]\ÝÛÛ™JHÂˆØšˆHØš‹˜ÛÛ™J
NÂˆØš‹ž™YˆH\Ëž™Y•Ü˜\\ŽÂˆBˆXÝHØšŽÂˆBˆYˆ
XÝ
HÂˆ›Üˆ
ÛÛœÝÚÙ^K˜]ÓØš—HÙˆXÝ™Ù]˜]Ñ[šY\Ê
JHÂˆÛÛœÝÜÝÛ™YXÝ[ÛœÈH˜]ÓØšˆ[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆÜÝÛ™Y™YÛÜY\Ë™Ù]
˜]ÓØšŠNÂˆYˆ
ÜÝÛ™YXÝ[ÛœÊHÂˆÜÝÛ™YXÝ[ÛœËœ\Ú
™YˆOˆXÝœÙ]
Ù^K™YŠJNÂˆÛÛ[YNÂˆBˆ›ÛZ\Ù\Ëœ\Ú
\ËˆØÛÛXÝ\[™[˜ÚY\Ê˜]ÓØš‹YK™Y‹™\ÛÝ\˜ÙTÝ™X[T]
K[Š™]ÓØšˆOˆXÝœÙ]
Ù^K™]ÓØšŠJJNÂˆBˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆBˆ™]\›ˆØšŽÂˆBˆÚ\Ô™\ÛÝ\˜ÙTÝ™X[JXÝ
HÂˆÛÛœÝÝX\HHXÝ™Ù]
”ÝX\HŠNÂˆ™]\›ˆ\Ó˜[YJÝX\K’[XYÙHŠHXÝš\Ê“[™ÝHŠH\Ó˜[YJÝX\K•\LPÈŠH\Ó˜[YJÝX\KÒQ›Û\LÈŠH\Ó˜[YJÝX\K“Ü[•\HŠNÂˆBˆÜ˜]ÔÝ™X[Pž]\ÊÝ™X[JHÂˆÛÛœÝÜšYÚ[˜[HÝ™X[K™Ù]ÜšYÚ[˜[Ý™X[J
NÂˆÜšYÚ[˜[œ™\Ù]

NÂˆ™]\›ˆÜšYÚ[˜[™Ù]ž]\Ê
NÂˆBˆ\Þ[˜ÈÜÙ\šX[^™QXÝ
XÝ
HÂˆÛÛœÝY™™\ˆH×NÂˆ]ØZ]Üš]U˜[YJXÝY™™\‹[
NÂˆ™]\›ˆY™™\‹š›Ú[ŠˆŠNÂˆBˆÜ™\ÛÝ\˜ÙTÝ™X[RÙ^JXÝÝ‹ž]\ÊHÂˆÛÛœÝÐSTWÔÒV‘HHMŽÂˆÛÛœÝÐSTWÐÓÕS•HÂˆÛÛœÝÂˆ[™ÝˆHHž]\ÎÂˆÛÛœÝ\ÚH™]È]\›]\’\Ú×Í

NÂˆ\Ú\]JXÝÝŠNÂˆ\Ú\]JÉÛ[™ÝX
NÂˆYˆ
[™ÝHÐSTWÔÒV‘H
ˆÐSTWÐÓÕS•
HÂˆ\Ú\]Jž]\ÊNÂˆH[ÙHÂˆÛÛœÝÝ\HX]™›ÛÜŠ
[™ÝHÐSTWÔÒV‘JHÈ
ÐSTWÐÓÕS•HJJNÂˆ›Üˆ
]HHÈHÐSTWÐÓÕS•ÈJÊÊHÂˆÛÛœÝÝ\HX]›Z[ŠH
ˆÝ\[™ÝHÐSTWÔÒV‘JNÂˆ\Ú\]Jž]\ËœÝX˜\œ˜^JÝ\Ý\
ÈÐSTWÔÒV‘JJNÂˆBˆBˆ™]\›ˆ\Úš^YÙ\Ý

NÂˆBˆ\Þ[˜ÈØÛÛXÝ™\ÛÝ\˜ÙTÝ™X[JÛ™Y‹Ý™X[K™Y‹™\ÛÝ\˜ÙTÝ™X[T]
HÂˆÛÛœÝÂˆÝ\œ™[ØÝ[Y[ˆÂˆÛ™Y“X\[™Ëˆ™\ÛÝ\˜ÙTÝ™X[T›ÛZ\Ù\ÂˆBˆHH\ÎÂˆYˆ
™\ÛÝ\˜ÙTÝ™X[T]š\ÊÛ™YŠJHÂˆ™]\›ˆÛ™Y“X\[™Ë™Ù]Ü”]ÛÛ\]Y
Û™Y‹

HOˆ\Ë›™]Ô™YŠNÂˆBˆÛÛœÝÙ^HHÛ™Y‹ÔÝš[™Ê
NÂˆÛÛœÝ[™[™ÈH™\ÛÝ\˜ÙTÝ™X[T›ÛZ\Ù\Ë™Ù]
Ù^JNÂˆYˆ
[™[™ÊHÂˆ™]\›ˆ[™[™ÎÂˆBˆÛÛœÝÚ[]H™]È™Y”Ù]
™\ÛÝ\˜ÙTÝ™X[T]
NÂˆÚ[]œ]
Û™YŠNÂˆÛÛœÝ›ÛZ\ÙHH›ÛZ\ÙKœ™\ÛÛ™J
K[Š\Þ[˜È

HOˆÂˆÛÛœÝÛÛXÝYH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊÝ™X[KYK™Y‹Ú[]
NÂˆÛÛœÝÞXÛT™YˆHÛ™Y“X\[™Ë™Ù]
Û™YŠNÂˆYˆ
ÞXÛT™YŠHÂˆ\Ëž™Y–ØÞXÛT™Y‹›[WHHÛÛXÝYÂˆ™]\›ˆÞXÛT™YŽÂˆBˆÛÛœÝ™YˆH]ØZ]\ËˆÙY\™\ÛÝ\˜ÙTÝ™X[JÛÛXÝY
NÂˆÛ™Y“X\[™Ëœ]
Û™Y‹™YŠNÂˆ™]\›ˆ™YŽÂˆJNÂˆ™\ÛÝ\˜ÙTÝ™X[T›ÛZ\Ù\ËœÙ]
Ù^K›ÛZ\ÙJNÂˆžHÂˆ™]\›ˆ]ØZ]›ÛZ\ÙNÂˆHš[˜[HÂˆYˆ
™\ÛÝ\˜ÙTÝ™X[T›ÛZ\Ù\Ë™Ù]
Ù^JHOOH›ÛZ\ÙJHÂˆ™\ÛÝ\˜ÙTÝ™X[T›ÛZ\Ù\Ë™[]JÙ^JNÂˆBˆBˆBˆ\Þ[˜ÈÙY\™\ÛÝ\˜ÙTÝ™X[JÝ™X[JHÂˆÛÛœÝXÝÝˆH]ØZ]\ËˆÜÙ\šX[^™QXÝ
Ý™X[K™XÝ
NÂˆÛÛœÝž]\ÈH\ËˆÜ˜]ÔÝ™X[Pž]\ÊÝ™X[JNÂˆÛÛœÝÙ^HH\ËˆÜ™\ÛÝ\˜ÙTÝ™X[RÙ^JXÝÝ‹ž]\ÊNÂˆÛÛœÝXÚÙ]H\ËˆÜ™\ÛÝ\˜ÙTÝ™X[PØXÚK™Ù]Ü’[œÙ\ÛÛ\]Y
Ù^KXZÙP\œŠNÂˆ›Üˆ
ÛÛœÝ[žHÙˆXÚÙ]
HÂˆYˆ
[žK™XÝÝˆOOHXÝÝˆ	‰ˆ\Ð\œ˜^Q\]X[
\ËˆÜ˜]ÔÝ™X[Pž]\Ê[žKœÝ™X[JKž]\ÊJHÂˆ™]\›ˆ[žKœ™YŽÂˆBˆBˆÛÛœÝ™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–Ü™Y‹›[WHHÝ™X[NÂˆXÚÙ]œ\Ú
Âˆ™Y‹ˆXÝÝ‹ˆÝ™X[BˆJNÂˆ™]\›ˆ™YŽÂˆBˆ\Þ[˜ÈÜ™\ÛÛ™TÝXÝÚYÊ˜]ÒÚYË™YŠHÂˆYˆ
˜]ÒÚYÈ[œÝ[˜Ù[Ùˆ™YŠHÂˆÛÛœÝ™]ÚYH]ØZ]™Y‹™™]Ú\Þ[˜Ê˜]ÒÚYÊNÂˆ™]\›ˆ\œ˜^Kš\Ð\œ˜^J™]ÚY
HÈ™]ÚYˆÜ˜]ÒÚY×NÂˆBˆ™]\›ˆ\œ˜^Kš\Ð\œ˜^J˜]ÒÚYÊHÈ˜]ÒÚYÈˆÜ˜]ÒÚY×NÂˆBˆ\Þ[˜ÈØÛÛ™TÝXÝ™YS›ÙJ\™[ÝXÝ™Y‹›ÙK™Y‹™[[Ý™YÝXÝ[[Y[ËY\QËY\Û\ÜÙ\ËY\›Û\Ëš\Ú]YH™]È™Y”Ù]

JHÂˆÛÛœÝÂˆÝ\œ™[ØÝ[Y[ˆÂˆYÙ\ÓX\ˆÛ™Y“X\[™ÂˆBˆHH\ÎÂˆÛÛœÝÈH›ÙK™Ù]˜]Ê”ÈŠNÂˆYˆ
È[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆ\YÙ\ÓX\š\ÊÊJHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÈH›ÙK™Ù]˜]Ê’ÈŠNÂˆYˆ
È[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆš\Ú]Yš\ÊÊJHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝÚYÈH]ØZ]\ËˆÜ™\ÛÛ™TÝXÝÚYÊË™YŠNÂˆÛÛœÝ™]ÒÚYÈH×NÂˆÛÛœÝÝXÝ[[R[™XÙ\ÈH×NÂˆ›Üˆ
]ÚYÙˆÚYÊHÂˆÛÛœÝÚY™YˆHÚY[œÝ[˜Ù[Ùˆ™YˆÈÚYˆ[ÂˆYˆ
ÚY™YŠHÂˆYˆ
š\Ú]Yš\ÊÚY™YŠJHÂˆÛÛ[YNÂˆBˆš\Ú]Yœ]
ÚY™YŠNÂˆÚYH]ØZ]™Y‹™™]Ú\Þ[˜ÊÚY™YŠNÂˆBˆYˆ
\[ÙˆÚYOOH›[X™\ˆŠHÂˆ™]ÒÚYËœ\Ú
ÚY
NÂˆÛÛ[YNÂˆBˆYˆ
JÚY[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆÛÛœÝÔ™YˆHÚY™Ù]˜]Ê”ÈŠNÂˆYˆ
Ô™Yˆ[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆ\YÙ\ÓX\š\ÊÔ™YŠJHÂˆÛÛ[YNÂˆBˆÛÛœÝ\HHÚY™Ù]
•\HŠNÂˆYˆ
]\H\Ó˜[YJ\K”ÝXÝ[[HŠJHÂˆ]Ù]\ÔÜ[ˆH˜[ÙNÂˆYˆ
ÚY™Yˆ	‰ˆ™[[Ý™YÝXÝ[[Y[Ëš\ÊÚY™YŠJHÂˆYˆ
Z\Ó˜[YJÚY™Ù]
”ÈŠK“[šÈŠJHÂˆÛÛ[YNÂˆBˆÙ]\ÔÜ[ˆHYNÂˆBˆÛÛœÝ™]ÒÚY™YˆH]ØZ]\ËˆØÛÛ™TÝXÝ™YS›ÙJÚY™Y‹ÚY™Y‹™[[Ý™YÝXÝ[[Y[ËY\QËY\Û\ÜÙ\ËY\›Û\Ëš\Ú]Y
NÂˆYˆ
™]ÒÚY™YŠHÂˆÝXÝ[[R[™XÙ\Ëœ\Ú
™]ÒÚYË›[™Ý
NÂˆ™]ÒÚYËœ\Ú
™]ÒÚY™YŠNÂˆYˆ
ÚY™YŠHÂˆÛ™Y“X\[™Ëœ]
ÚY™Y‹™]ÒÚY™YŠNÂˆBˆYˆ
Ù]\ÔÜ[ŠHÂˆ\Ëž™Y–Û™]ÒÚY™Y‹›[WKœÙ]Y“˜[YJ”È‹”Ü[ˆŠNÂˆBˆBˆÛÛ[YNÂˆBˆYˆ
\Ó˜[YJ\K“Ð’”ˆŠJHÂˆYˆ
ZÚY™YŠHÂˆÛÛ[YNÂˆBˆÛÛœÝÛØš”™YˆHÚY™Ù]˜]Ê“ØšˆŠNÂˆYˆ
ÛØš”™Yˆ[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆ[Û™Y“X\[™Ë™Ù]
ÛØš”™YŠJHÂˆÛÛ[YNÂˆBˆÛÛœÝ™]ÒÚY™YˆHÛ™Y“X\[™Ë™Ù]
ÚY™YŠH
]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊÚY™Y‹YK™YŠJNÂˆÛÛœÝ™]ÒÚYH\Ëž™Y–Û™]ÒÚY™Y‹›[WNÂˆÛÛœÝØš”™YˆH™]ÒÚY™Ù]˜]Ê“ØšˆŠNÂˆYˆ
Øš”™Yˆ[œÝ[˜Ù[Ùˆ™YŠHÂˆÛÛœÝØšˆH\Ëž™Y–ÛØš”™Y‹›[WNÂˆYˆ
Øšˆ[œÝ[˜Ù[ÙˆXÝ	‰ˆ[Øš‹š\Ê”ÝXÝ\™[ŠH	‰ˆ\™[ÝXÝ™YŠHÂˆÛÛœÝÝXÝ\™[H\Ëœ\™[™YKœÚ^™NÂˆ\Ëœ\™[™YKœÙ]
ÝXÝ\™[ÛÛ™Y“X\[™Ë\™[ÝXÝ™Y—JNÂˆØš‹œÙ]
”ÝXÝ\™[‹ÝXÝ\™[
NÂˆBˆBˆ™]ÒÚYËœ\Ú
™]ÒÚY™YŠNÂˆÛÛ[YNÂˆBˆYˆ
\Ó˜[YJ\K“PÔˆŠJHÂˆÛÛœÝ™]ÒÚYH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊÚY™YˆÚYYK™YŠNÂˆ™]ÒÚYËœ\Ú
™]ÒÚY
NÂˆÛÛ[YNÂˆBˆYˆ
ÚY™YŠHÂˆÛÛœÝ™]ÒÚY™YˆH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊÚY™Y‹YK™YŠNÂˆ™]ÒÚYËœ\Ú
™]ÒÚY™YŠNÂˆBˆBˆYˆ
ÚYË›[™ÝOOH	‰ˆ™]ÒÚYË›[™ÝOOH
HÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ™]Ó›ÙT™YˆH\Ë›™]Ô™YŽÂˆÛÛœÝ™]Ó›ÙHH\Ëž™Y–Û™]Ó›ÙT™Y‹›[WHH\Ë˜ÛÛ™QXÝ
›ÙJNÂˆ™]Ó›ÙK™[]J’QŠNÂˆ™]Ó›ÙK™[]JÈŠNÂˆ™]Ó›ÙK™[]J’ÈŠNÂˆ™]Ó›ÙK™[]J”ŠNÂˆ™]Ó›ÙK™[]J”ÈŠNÂˆ]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Ê™]Ó›ÙK˜[ÙK™YŠNÂˆÛÛœÝÛ\ÜÓ˜[Y\ÈH›ÙK™Ù]
ÈŠNÂˆYˆ
Û\ÜÓ˜[Y\È[œÝ[˜Ù[Ùˆ˜[YJHÂˆÛÛœÝ™]ÐÛ\ÜÓ˜[YHHY\Û\ÜÙ\Ë™Ù]
Û\ÜÓ˜[Y\Ë›˜[YJNÂˆ™]Ó›ÙKœÙ]
È‹™]ÐÛ\ÜÓ˜[YHÈ˜[YK™Ù]
™]ÐÛ\ÜÓ˜[YJHˆÛ\ÜÓ˜[Y\ÊNÂˆH[ÙHYˆ
\œ˜^Kš\Ð\œ˜^JÛ\ÜÓ˜[Y\ÊJHÂˆÛÛœÝ™]ÐÛ\ÜÓ˜[Y\ÈH×NÂˆ›Üˆ
ÛÛœÝÛ\ÜÓ˜[YHÙˆÛ\ÜÓ˜[Y\ÊHÂˆYˆ
Û\ÜÓ˜[YH[œÝ[˜Ù[Ùˆ˜[YJHÂˆÛÛœÝ™]ÐÛ\ÜÓ˜[YHHY\Û\ÜÙ\Ë™Ù]
Û\ÜÓ˜[YK›˜[YJNÂˆ™]ÐÛ\ÜÓ˜[Y\Ëœ\Ú
™]ÐÛ\ÜÓ˜[YHÈ˜[YK™Ù]
™]ÐÛ\ÜÓ˜[YJHˆÛ\ÜÓ˜[YJNÂˆBˆBˆ™]Ó›ÙKœÙ]
È‹™]ÐÛ\ÜÓ˜[Y\ÊNÂˆBˆÛÛœÝ›ÛS˜[YHH›ÙK™Ù]
”ÈŠNÂˆYˆ
›ÛS˜[YH[œÝ[˜Ù[Ùˆ˜[YJHÂˆÛÛœÝ™]Ô›ÛS˜[YHHY\›Û\Ë™Ù]
›ÛS˜[YK›˜[YJNÂˆ™]Ó›ÙKœÙ]
”È‹™]Ô›ÛS˜[YHÈ˜[YK™Ù]
™]Ô›ÛS˜[YJHˆ›ÛS˜[YJNÂˆBˆÛÛœÝYH›ÙK™Ù]
’QŠNÂˆYˆ
\[ÙˆYOOHœÝš[™ÈŠHÂˆÛÛœÝÝš[™ÒYHÝš[™ÕÔ”Ýš[™ÊY˜[ÙJNÂˆÛÛœÝ™]ÒYHY\QË™Ù]
Ýš[™ÒY
NÂˆ™]Ó›ÙKœÙ]
’Q‹™]ÒYÈÝš[™ÕÐ\ØÚZSÜ•UŒM‘J™]ÒY
HˆY
NÂˆBˆ]]šX]\ÈH™]Ó›ÙK™Ù]
HŠNÂˆYˆ
]šX]\ÊHÂˆYˆ
P\œ˜^Kš\Ð\œ˜^J]šX]\ÊJHÂˆ]šX]\ÈHØ]šX]\×NÂˆBˆ›Üˆ
]]ˆÙˆ]šX]\ÊHÂˆ]ˆH\Ëž™Y•Ü˜\\‹™™]ÚY”™YŠ]ŠNÂˆYˆ
J]ˆ[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆYˆ
\Ó˜[YJ]‹™Ù]
“ÈŠK•X›HŠH	‰ˆ]‹š\Ê’XY\œÈŠJHÂˆÛÛœÝXY\œÈH\Ëž™Y•Ü˜\\‹™™]ÚY”™YŠ]‹™Ù]˜]Ê’XY\œÈŠJNÂˆYˆ
\œ˜^Kš\Ð\œ˜^JXY\œÊJHÂˆ›Üˆ
]HHZHHXY\œË›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝXY\ˆH\Ëž™Y•Ü˜\\‹™™]ÚY”™YŠXY\œÖÚWJNÂˆYˆ
\[ÙˆXY\ˆOOHœÝš[™ÈŠHÂˆÛÛ[YNÂˆBˆÛÛœÝ™]ÒYHY\QË™Ù]
Ýš[™ÕÔ”Ýš[™ÊXY\‹˜[ÙJJNÂˆYˆ
™]ÒY
HÂˆXY\œÖÚWHH™]ÒYÂˆBˆBˆBˆBˆBˆBˆ›Üˆ
ÛÛœÝ[™^ÙˆÝXÝ[[R[™XÙ\ÊHÂˆÛÛœÝÝXÝ[[T™YˆH™]ÒÚYÖÚ[™^NÂˆÛÛœÝÝXÝ[[HH\Ëž™Y–ÜÝXÝ[[T™Y‹›[WNÂˆÝXÝ[[KœÙ]
”‹™]Ó›ÙT™YŠNÂˆBˆYˆ
™]ÒÚYË›[™ÝOOHJHÂˆ™]Ó›ÙKœÙ]
’È‹™]ÒÚYÖÌJNÂˆH[ÙHYˆ
™]ÒÚYË›[™ÝˆJHÂˆ™]Ó›ÙKœÙ]
’È‹™]ÒÚYÊNÂˆBˆ™]\›ˆ™]Ó›ÙT™YŽÂˆBˆÙÙ]š[\™YYÙR[™XÙ\ÊÂˆØÝ[Y[ˆ[˜ÛYTYÙ\Ëˆ^ÛYTYÙ\ÂˆJHÂˆYˆ
YØÝ[Y[
HÂˆ™]\›ˆ×NÂˆBˆÛÛœÝÛÛ\[HH\ÝOˆÂˆYˆ
[\ÝË›[™Ý
HÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ[™XÙ\ÈH™]ÈÙ]

NÂˆÛÛœÝ˜[™Ù\ÈH×NÂˆ›Üˆ
ÛÛœÝ][HÙˆ\Ý
HÂˆYˆ
\œ˜^Kš\Ð\œ˜^J][JJHÂˆ˜[™Ù\Ëœ\Ú
][JNÂˆH[ÙHÂˆ[™XÙ\Ë˜Y
][JNÂˆBˆBˆ™]\›ˆÂˆ[™XÙ\Ëˆ˜[™Ù\ÂˆNÂˆNÂˆÛÛœÝX]Ú\ÈH
[™^Âˆ[™XÙ\Ëˆ˜[™Ù\ÂˆJHOˆ[™XÙ\Ëš\Ê[™^
H˜[™Ù\ËœÛÛYJ
ÜÝ\[™JHOˆ[™^HÝ\	‰ˆ[™^H[™
NÂˆÛÛœÝ[˜ÈHÛÛ\[J[˜ÛYTYÙ\ÊNÂˆÛÛœÝ^ÈHÛÛ\[J^ÛYTYÙ\ÊNÂˆÛÛœÝ™\Ý[H×NÂˆ›Üˆ
]HHZHHØÝ[Y[›[TYÙ\ÎÈHZNÈJÊÊHÂˆYˆ
^È	‰ˆX]Ú\ÊK^ÊJHÂˆÛÛ[YNÂˆBˆYˆ
Z[˜ÈX]Ú\ÊK[˜ÊJHÂˆ™\Ý[œ\Ú
JNÂˆBˆBˆ™]\›ˆ™\Ý[ÂˆBˆÜ™\ÛÛ™R[œÙ\Y\’[™XÙ\ÊYÙR[™›ÜÊHÂˆÛÛœÝÛÝ[ÈH™]È\œ˜^JYÙR[™›ÜË›[™Ý
NÂˆÛÛœÝÙ\]Y[˜ÙHH×NÂˆÛÛœÝ[œÙ\Y\“\ÝH×NÂˆ›Üˆ
]HHÈHYÙR[™›ÜË›[™ÝÈJÊÊHÂˆÛÛœÝ[™›ÈHYÙR[™›ÜÖÚWNÂˆ]ÛÝ[ÂˆYˆ
[™›Ëš[XYÙJHÂˆÛÝ[HÛÝ[ÖÚWHHNÂˆH[ÙHYˆ
Z[™›Ë™ØÝ[Y[
HÂˆÛÝ[ÖÚWHHÂˆÛÛ[YNÂˆH[ÙHÂˆÛÝ[HÛÝ[ÖÚWHH\ËˆÙÙ]š[\™YYÙR[™XÙ\Ê[™›ÊK›[™ÝÂˆBˆYˆ
[™›ËœYÙR[™XÙ\ÊHÂˆÛÛ[YNÂˆBˆYˆ
[™›Ëš[œÙ\Y\ˆOOH[™Yš[™Y
HÂˆ›Üˆ
]ˆHÈˆÛÝ[ÈŠÊÊHÂˆÙ\]Y[˜ÙKœ\Ú
JNÂˆBˆH[ÙHÂˆ[œÙ\Y\“\Ýœ\Ú
ÂˆKˆ[œÙ\Y\Žˆ[™›Ëš[œÙ\Y\‹ˆÛÝ[ˆJNÂˆBˆBˆYˆ
[œÙ\Y\“\Ý›[™ÝOOH
HÂˆ™]\›ˆYÙR[™›ÜÎÂˆBˆÛÛœÝ\ÐÛÛ[H[™›ÈOˆHJ[™›Ë™ØÝ[Y[[™›Ëš[XYÙJNÂˆ›Üˆ
]HHÈHYÙR[™›ÜË›[™ÝÈJÊÊHÂˆÛÛœÝ[™›ÈHYÙR[™›ÜÖÚWNÂˆYˆ
\ÐÛÛ[
[™›ÊH	‰ˆ[™›ËœYÙR[™XÙ\È	‰ˆ[™›ËœYÙR[™XÙ\Ë›[™ÝÛÝ[ÖÚWJHÂˆ›ÝÈ™]È\œ›ÜŠ™^˜XÝYÙ\Îˆ\X[YÙR[™XÙ\ÈØ[››Ý™HÛÛXš[™YÚ][œÙ\Y\ˆ[šY\ËˆŠNÂˆBˆBˆ[œÙ\Y\“\ÝœÛÜ

KŠHOˆKš[œÙ\Y\ˆH‹š[œÙ\Y\ˆKšHH‹šJNÂˆYˆ
Ù\]Y[˜ÙK›[™ÝOOH	‰ˆYÙR[™›ÜËœÛÛYJ[™›ÈOˆ\ÐÛÛ[
[™›ÊH	‰ˆ[™›ËœYÙR[™XÙ\ÊJHÂˆÛÛœÝ\]YYÙR[™›ÜÈHYÙR[™›ÜËœÛXÙJ
NÂˆ]X^^\Ý[™ÔÜÈHLNÂˆ›Üˆ
ÛÛœÝ[™›ÈÙˆYÙR[™›ÜÊHÂˆYˆ
Z\ÐÛÛ[
[™›ÊHZ[™›ËœYÙR[™XÙ\ÊHÂˆÛÛ[YNÂˆBˆ›Üˆ
ÛÛœÝYÙˆ[™›ËœYÙR[™XÙ\ÊHÂˆYˆ
YˆX^^\Ý[™ÔÜÊHÂˆX^^\Ý[™ÔÜÈHYÂˆBˆBˆBˆ]Ù™œÙ]HÂˆ›Üˆ
ÛÛœÝÂˆKˆ[œÙ\Y\‹ˆÛÝ[ˆHÙˆ[œÙ\Y\“\Ý
HÂˆÛÛœÝ™\ÚÛHX]›Z[ŠX]›X^
[œÙ\Y\‹LJH
ÈÙ™œÙ]X^^\Ý[™ÔÜÊNÂˆ›Üˆ
]ˆHÈˆ\]YYÙR[™›ÜË›[™ÝÈŠÊÊHÂˆÛÛœÝ^\Ý[™Ò[™›ÈH\]YYÙR[™›ÜÖÚ—NÂˆYˆ
Z\ÐÛÛ[
^\Ý[™Ò[™›ÊHY^\Ý[™Ò[™›ËœYÙR[™XÙ\È^\Ý[™Ò[™›ËœYÙR[™XÙ\Ë™]™\žJYOˆYH™\ÚÛ
JHÂˆÛÛ[YNÂˆBˆ\]YYÙR[™›ÜÖÚ—HHÂˆ‹‹™^\Ý[™Ò[™›ËˆYÙR[™XÙ\Îˆ^\Ý[™Ò[™›ËœYÙR[™XÙ\Ë›X\
YOˆYˆ™\ÚÛÈY
ÈÛÝ[ˆY
BˆNÂˆBˆÛÛœÝYÙR[™XÙ\ÈH×NÂˆ›Üˆ
]ÈHÈÈÛÝ[ÈÊÊÊHÂˆYÙR[™XÙ\Ëœ\Ú
™\ÚÛ
ÈH
ÈÊNÂˆBˆÛÛœÝ™\Ý[HÂˆ‹‹\]YYÙR[™›ÜÖÚWKˆYÙR[™XÙ\ÂˆNÂˆ[]H™\Ý[š[œÙ\Y\ŽÂˆ\]YYÙR[™›ÜÖÚWHH™\Ý[ÂˆÙ™œÙ]
ÏHÛÝ[ÂˆX^^\Ý[™ÔÜÈ
ÏHÛÝ[ÂˆBˆ™]\›ˆ\]YYÙR[™›ÜÎÂˆBˆ]Ù™œÙ]HÂˆ›Üˆ
ÛÛœÝÂˆKˆ[œÙ\Y\‹ˆÛÝ[ˆHÙˆ[œÙ\Y\“\Ý
HÂˆÛÛœÝ[œÙ\ÜÈHX]›X^
[œÙ\Y\‹LJH
ÈH
ÈÙ™œÙ]ÂˆÙ\]Y[˜ÙKœÜXÙJ[œÙ\ÜË‹‹›™]È\œ˜^JÛÝ[
K™š[
JJNÂˆÙ™œÙ]
ÏHÛÝ[ÂˆBˆÛÛœÝYÙR[™XÙ\Ð\œˆH™]È\œ˜^JYÙR[™›ÜË›[™Ý
NÂˆ›Üˆ
]ÜÈHÈÜÈÙ\]Y[˜ÙK›[™ÝÈÜÊÊÊHÂˆÛÛœÝ[™›ÒYHÙ\]Y[˜ÙVÜÜ×NÂˆ
YÙR[™XÙ\Ð\œ–Ú[™›ÒYHH×JKœ\Ú
ÜÊNÂˆBˆ™]\›ˆYÙR[™›ÜË›X\

[™›ËJHOˆÂˆYˆ
Z\ÐÛÛ[
[™›ÊH[™›ËœYÙR[™XÙ\ÊHÂˆ™]\›ˆ[™›ÎÂˆBˆÛÛœÝ™\Ý[HÂˆ‹‹š[™›ËˆYÙR[™XÙ\ÎˆYÙR[™XÙ\Ð\œ–ÚWH×BˆNÂˆ[]H™\Ý[š[œÙ\Y\ŽÂˆ™]\›ˆ™\Ý[ÂˆJNÂˆBˆ\Þ[˜È^˜XÝYÙ\ÊYÙR[™›ÜË[››Ý][Û”ÝÜ˜YÙKš[X\žQØÝ[Y[[™\‹\ÚÊHÂˆ\ËˆÜš[X\žQØÝ[Y[Hš[X\žQØÝ[Y[ÂˆYÙR[™›ÜÈH\ËˆÜ™\ÛÛ™R[œÙ\Y\’[™XÙ\ÊYÙR[™›ÜÊNÂˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆ]™]Ò[™^HÂˆÛÛœÝ™\Ù\™TYÙTÛÝH™]ÔYÙR[™^OˆÂˆYˆ
S[X™\‹š\Ò[YÙ\Š™]ÔYÙR[™^
H™]ÔYÙR[™^
HÂˆ›ÝÈ™]È\œ›ÜŠ™^˜XÝYÙ\Îˆ[˜[YYÙH[™^ˆŠNÂˆBˆYˆ
\Ë›ÛYÙ\ÖÛ™]ÔYÙR[™^HOOH[™Yš[™Y
HÂˆ›ÝÈ™]È\œ›ÜŠ™^˜XÝYÙ\ÎˆÝ™\›\[™ÈYÙR[™XÙ\ËˆŠNÂˆBˆ\Ë›ÛYÙ\ÖÛ™]ÔYÙR[™^HH[ÂˆNÂˆÛÛœÝ[ØÝ[Y[]HH×NÂˆYˆ
[››Ý][Û”ÝÜ˜YÙJHÂˆ\ËˆÛ™]Ð[››Ý][ÛœÔ\˜[\ÈHÂˆ[™\‹ˆ\ÚËˆ™]Ð[››Ý][ÛœÐžTYÙNˆÙ]™]Ð[››Ý][ÛœÓX\
[››Ý][Û”ÝÜ˜YÙJKˆ[XYÙ\Ô›ÛZ\Ù\Îˆ[››Ý][Û‘˜XÝÜžK™Ù[™\˜]R[XYÙ\Ê[››Ý][Û”ÝÜ˜YÙK˜[Y\Ê
K\Ëž™Y•Ü˜\\‹YJBˆNÂˆBˆÛÛœÝ[XYÙQ[šY\ÈH×NÂˆ›Üˆ
ÛÛœÝYÙR[™›ÈÙˆYÙR[™›ÜÊHÂˆÛÛœÝÂˆØÝ[Y[ˆ[XYÙKˆ[˜ÛYTYÙ\Ëˆ^ÛYTYÙ\ËˆYÙR[™XÙ\ÂˆHHYÙR[™›ÎÂˆYˆ
[XYÙJHÂˆYˆ
YÙR[™XÙ\ÊHÂˆ™]Ò[™^HLNÂˆYˆ
YÙR[™XÙ\Ë›[™ÝˆJHÂˆ›ÝÈ™]È\œ›ÜŠ™^˜XÝYÙ\ÎˆÛÈX[žHYÙR[™XÙ\ËˆŠNÂˆBˆBˆ]™]ÔYÙR[™^ÂˆYˆ
YÙR[™XÙ\ÏË›[™Ý
HÂˆ™]ÔYÙR[™^HYÙR[™XÙ\ÖÌNÂˆH[ÙHYˆ
™]Ò[™^OOHLJHÂˆ™]ÔYÙR[™^H™]Ò[™^
ÊÎÂˆH[ÙHÂˆ›Üˆ
™]ÔYÙR[™^HÈ\Ë›ÛYÙ\ÖÛ™]ÔYÙR[™^HOOH[™Yš[™YÈ™]ÔYÙR[™^
ÊÊHßBˆBˆ™\Ù\™TYÙTÛÝ
™]ÔYÙR[™^
NÂˆ[XYÙQ[šY\Ëœ\Ú
Âˆ[XYÙKˆÛÝˆ™]ÔYÙR[™^ˆJNÂˆÛÛ[YNÂˆBˆYˆ
YØÝ[Y[
HÂˆÛÛ[YNÂˆBˆYˆ
YÙR[™XÙ\ÊHÂˆ™]Ò[™^HLNÂˆBˆÛÛœÝš[\™YYÙR[™XÙ\ÈH\ËˆÙÙ]š[\™YYÙR[™XÙ\ÊÂˆØÝ[Y[ˆ[˜ÛYTYÙ\Ëˆ^ÛYTYÙ\ÂˆJNÂˆYˆ
YÙR[™XÙ\È	‰ˆYÙR[™XÙ\Ë›[™Ýˆš[\™YYÙR[™XÙ\Ë›[™Ý
HÂˆ›ÝÈ™]È\œ›ÜŠ™^˜XÝYÙ\ÎˆÛÈX[žHYÙR[™XÙ\ËˆŠNÂˆBˆÛÛœÝØÝ[Y[]HH™]ÈØÝ[Y[]JØÝ[Y[
NÂˆ[ØÝ[Y[]Kœ\Ú
ØÝ[Y[]JNÂˆ›ÛZ\Ù\Ëœ\Ú
\ËˆØÛÛXÝØÝ[Y[]JØÝ[Y[]JJNÂˆ]YÙR[™^HÂˆ›Üˆ
ÛÛœÝHÙˆš[\™YYÙR[™XÙ\ÊHÂˆ]™]ÔYÙR[™^ÂˆYˆ
YÙR[™XÙ\ÊHÂˆ™]ÔYÙR[™^HYÙR[™XÙ\ÖÜYÙR[™^
Ê×NÂˆBˆYˆ
™]ÔYÙR[™^OOH[™Yš[™Y
HÂˆYˆ
™]Ò[™^OOHLJHÂˆ™]ÔYÙR[™^H™]Ò[™^
ÊÎÂˆH[ÙHÂˆ›Üˆ
™]ÔYÙR[™^HÈ\Ë›ÛYÙ\ÖÛ™]ÔYÙR[™^HOOH[™Yš[™YÈ™]ÔYÙR[™^
ÊÊHßBˆBˆBˆ™\Ù\™TYÙTÛÝ
™]ÔYÙR[™^
NÂˆ›ÛZ\Ù\Ëœ\Ú
ØÝ[Y[™Ù]YÙJJK[ŠYÙHOˆÂˆ\Ë›ÛYÙ\ÖÛ™]ÔYÙR[™^HH™]ÈYÙQ]JYÙKØÝ[Y[]JNÂˆJJNÂˆBˆBˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆYˆ
\Ë›ÛYÙ\Ë›[™ÝOOH
HÂˆ›ÝÈ™]È\œ›ÜŠ™^˜XÝYÙ\Îˆ›Ý[™ÈÈ^˜XÝˆŠNÂˆBˆÛÛœÝÛÜPÛÝ[ÈH™]ÈX\

NÂˆÛÛœÝØÝ[Y[ÈH™]ÈÙ]

NÂˆ›Üˆ
]HHZHH\Ë›ÛYÙ\Ë›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝYÙQ]HH\Ë›ÛYÙ\ÖÚWNÂˆYˆ
YÙQ]HOOH[™Yš[™Y
HÂˆ›ÝÈ™]È\œ›ÜŠ™^˜XÝYÙ\ÎˆÜ\œÙHYÙR[™XÙ\ËˆŠNÂˆBˆYˆ
YÙQ]JHÂˆÛÛœÝÂˆYÙBˆHHYÙQ]NÂˆÛÛœÝÛÜS]™[HÛÜPÛÝ[Ë™Ù]
YÙJHÏÈÂˆÛÜPÛÝ[ËœÙ]
YÙKÛÜS]™[
ÈJNÂˆYÙQ]K˜ÛÜS]™[HÛÜS]™[ÂˆØÝ[Y[Ë˜Y
YÙQ]K™ØÝ[Y[]K™ØÝ[Y[
NÂˆBˆBˆ\Ëš\ÔÚ[™ÛQš[HHØÝ[Y[ËœÚ^™HOOHNÂˆ›ÛZ\Ù\Ë›[™ÝHÂˆ\ËˆØÛÛXÝ˜[Y\Ý[˜][ÛœÊ[ØÝ[Y[]JNÂˆ\ËˆØÛÛXÝÝ][™Q\Ý[˜][ÛœÊ[ØÝ[Y[]JNÂˆ\ËˆØÛÛXÝYÙSX™[Ê
NÂˆ›Üˆ
ÛÛœÝYÙHÙˆ\Ë›ÛYÙ\ÊHÂˆYˆ
YÙJHÂˆ›ÛZ\Ù\Ëœ\Ú
\ËˆÜÜÝÛÛXÝYÙQ]JYÙJJNÂˆBˆBˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆ\ËˆÙš[™\XØ]S˜[YY\Ý[˜][ÛœÊ
NÂˆ\ËˆÜÙ]ÜÝÛ™Y™YÛÜY\Ê[ØÝ[Y[]JNÂˆÛÛœÝ[XYÙTÛÝÈH™]ÈX\

NÂˆ›Üˆ
ÛÛœÝ[žHÙˆ[XYÙQ[šY\ÊHÂˆ[XYÙTÛÝËœÙ]
[žKœÛÝ[žJNÂˆBˆÛÛœÝ[Ù[YÙTÚ^™HH[XYÙTÛÝËœÚ^™HˆÈ\ËˆÛ[Ù[YÙTÚ^™J
Hˆ[Âˆ›Üˆ
]HHZHH\Ë›ÛYÙ\Ë›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝ[XYÙQ[žHH[XYÙTÛÝË™Ù]
JNÂˆYˆ
[XYÙQ[žJHÂˆ\Ë›™]ÔYÙ\ÖÚWHH]ØZ]\ËˆÛXZÙR[XYÙTYÙJ[XYÙQ[žKš[XYÙK[Ù[YÙTÚ^™JNÂˆH[ÙHÂˆ\Ë›™]ÔYÙ\ÖÚWHH]ØZ]\ËˆÛXZÙTYÙPÛÜJK[
NÂˆBˆBˆ\ËˆÙš^ÜÝÛ™Y™YÛÜY\Ê[ØÝ[Y[]JNÂˆ]ØZ]\ËˆÛY\™ÙTÝXÝ™Y\Ê[ØÝ[Y[]JNÂˆ]ØZ]\ËˆÛY\™ÙPXÜ›Ñ›Ü›\Ê[ØÝ[Y[]JNÂˆ\ËˆØZ[Ý][™J[ØÝ[Y[]JNÂˆ]ØZ]\ËˆØÛÛXÝ[X™YYš[\Ê[ØÝ[Y[]JNÂˆ™]\›ˆ\ËÜš]TŠ
NÂˆBˆ\Þ[˜ÈØÛÛXÝØÝ[Y[]JØÝ[Y[]JHÂˆÛÛœÝÂˆØÝ[Y[ˆÂˆ“X[˜YÙ\‹ˆ™Y‚ˆBˆHHØÝ[Y[]NÂˆ]ØZ]›ÛZ\ÙK˜[
Ü“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ™\Ý[˜][ÛœÈŠK[Š\Ý[˜][ÛœÈOˆØÝ[Y[]K™\Ý[˜][ÛœÈH\Ý[˜][ÛœÊK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœ˜]ÔYÙSX™[ÈŠK[ŠYÙSX™[ÈOˆØÝ[Y[]KœYÙSX™[ÈHYÙSX™[ÊK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœÝXÝ™YT›ÛÝŠK[ŠÝXÝ™YT›ÛÝOˆØÝ[Y[]KœÝXÝ™YT›ÛÝHÝXÝ™YT›ÛÝ
K“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ˜XÜ›Ñ›Ü›HŠK[ŠXÜ›Ñ›Ü›HOˆØÝ[Y[]K˜XÜ›Ñ›Ü›HHXÜ›Ñ›Ü›JK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ™ØÝ[Y[Ý][™Q›Ü‘Y]ÜˆŠK[ŠÝ][™HOˆØÝ[Y[]K›Ý][™HHÝ][™JK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœ˜]Ñ[X™YYš[\ÈŠK[ŠYˆOˆØÝ[Y[]K™[X™YYš[\ÈHYŠWJNÂˆÛÛœÝÝXÝ™YT›ÛÝHØÝ[Y[]KœÝXÝ™YT›ÛÝÂˆYˆ
ÝXÝ™YT›ÛÝ
HÂˆÛÛœÝ›ÛÝXÝHÝXÝ™YT›ÛÝ™XÝÂˆÛÛœÝ\™[™YHH›ÛÝXÝ™Ù]
”\™[™YHŠNÂˆYˆ
\™[™YJHÂˆÛÛœÝ[X™\•™YHH™]È[X™\•™YJ\™[™YK™YŠNÂˆØÝ[Y[]Kœ\™[™YHH[X™\•™YK™Ù][
YJNÂˆBˆÛÛœÝY™YHH›ÛÝXÝ™Ù]
’Q™YHŠNÂˆYˆ
Y™YJHÂˆÛÛœÝ˜[YU™YHH™]È˜[YU™YJY™YK™YŠNÂˆØÝ[Y[]KšY™YHH˜[YU™YK™Ù][
YJNÂˆBˆØÝ[Y[]Kœ›ÛSX\H›ÛÝXÝ™Ù]
”›ÛSX\ŠH[ÂˆØÝ[Y[]K˜Û\ÜÓX\H›ÛÝXÝ™Ù]
Û\ÜÓX\ŠH[Âˆ]˜[Y\ÜXÙ\ÈH›ÛÝXÝ™Ù]
“˜[Y\ÜXÙ\ÈŠH[ÂˆYˆ
˜[Y\ÜXÙ\È	‰ˆP\œ˜^Kš\Ð\œ˜^J˜[Y\ÜXÙ\ÊJHÂˆ˜[Y\ÜXÙ\ÈHÛ˜[Y\ÜXÙ\×NÂˆBˆØÝ[Y[]K›˜[Y\ÜXÙ\ÈH˜[Y\ÜXÙ\ÎÂˆØÝ[Y[]KœÝXÝ™YPQˆH›ÛÝXÝ™Ù]
QˆŠH[ÂˆØÝ[Y[]KœÝXÝ™YT›Û[˜ÚX][Û“^XÛÛˆH›ÛÝXÝ™Ù]
”›Û[˜ÚX][Û“^XÛÛˆŠH[ÂˆBˆBˆ\Þ[˜ÈÜÜÝÛÛXÝYÙQ]JYÙQ]JHÂˆÛÛœÝÂˆYÙNˆÂˆ™Y‹ˆ[››Ý][ÛœÂˆKˆØÝ[Y[]NˆÂˆYÙ\ÓX\ˆ\Ý[˜][ÛœËˆ\ÙY˜[YY\Ý[˜][ÛœËˆšY[Ô\™[ˆBˆHHYÙQ]NÂˆYˆ
X[››Ý][ÛœÊHÂˆ™]\›ŽÂˆBˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆ]™]Ð[››Ý][ÛœÈH×NÂˆ]™]Ò[™^HÂˆ]Âˆ\ÔÚYÛ˜]\™P[››Ý][ÛœÂˆHHYÙQ]K™ØÝ[Y[]NÂˆ›Üˆ
ÛÛœÝ[››Ý][Û”™YˆÙˆ[››Ý][ÛœÊHÂˆÛÛœÝ™]Ð[››Ý][Û’[™^H™]Ò[™^
ÊÎÂˆ›ÛZ\Ù\Ëœ\Ú
™Y‹™™]ÚY”™Y\Þ[˜Ê[››Ý][Û”™YŠK[Š\Þ[˜È[››Ý][Û‘XÝOˆÂˆYˆ
Z\Ó˜[YJ[››Ý][Û‘XÝ™Ù]
”ÝX\HŠK“[šÈŠJHÂˆYˆ
\Ó˜[YJ[››Ý][Û‘XÝ™Ù]
”ÝX\HŠK•ÚYÙ]ŠJHÂˆ\ÔÚYÛ˜]\™P[››Ý][ÛœÈH\Ó˜[YJÙ][š\š]X›T›Ü\JÂˆXÝˆ[››Ý][Û‘XÝˆÙ^Nˆ‘•‚ˆJK”ÚYÈŠNÂˆÛÛœÝ\™[™YˆH[››Ý][Û‘XÝ™Ù]˜]Ê”\™[ŠH[ÂˆšY[Ô\™[œ]
[››Ý][Û”™Y‹\™[™YŠNÂˆBˆ™]Ð[››Ý][ÛœÖÛ™]Ð[››Ý][Û’[™^HH[››Ý][Û”™YŽÂˆ™]\›ŽÂˆBˆÛÛœÝXÝ[ÛˆH[››Ý][Û‘XÝ™Ù]
HŠNÂˆYˆ
XÝ[Ûˆ[œÝ[˜Ù[ÙˆXÝ	‰ˆZ\Ó˜[YJXÝ[Û‹™Ù]
”ÈŠK‘ÛÕÈŠJHÂˆ™]Ð[››Ý][ÛœÖÛ™]Ð[››Ý][Û’[™^HH[››Ý][Û”™YŽÂˆ™]\›ŽÂˆBˆÛÛœÝ\ÝHXÝ[Ûˆ[œÝ[˜Ù[ÙˆXÝÈXÝ[Û‹™Ù]
‘ŠHˆ[››Ý][Û‘XÝ™Ù]
‘\ÝŠNÂˆYˆ
Y\Ý\œ˜^Kš\Ð\œ˜^J\Ý
H	‰ˆ
J\ÝÌH[œÝ[˜Ù[Ùˆ™YŠHYÙ\ÓX\š\Ê\ÝÌJJJHÂˆ™]Ð[››Ý][ÛœÖÛ™]Ð[››Ý][Û’[™^HH[››Ý][Û”™YŽÂˆH[ÙHYˆ
\Ý[œÝ[˜Ù[Ùˆ˜[YH\[Ùˆ\ÝOOHœÝš[™ÈŠHÂˆÛÛœÝ\ÝÝš[™ÈHÝš[™ÕÔ”Ýš[™Ê\Ý[œÝ[˜Ù[Ùˆ˜[YHÈ\Ý›˜[YHˆ\ÝYJNÂˆYˆ
\Ý[˜][ÛœËš\Ê\ÝÝš[™ÊJHÂˆ™]Ð[››Ý][ÛœÖÛ™]Ð[››Ý][Û’[™^HH[››Ý][Û”™YŽÂˆ\ÙY˜[YY\Ý[˜][ÛœË˜Y
\ÝÝš[™ÊNÂˆBˆBˆJJNÂˆBˆ]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆ™]Ð[››Ý][ÛœÈH™]Ð[››Ý][ÛœË™š[\Š›ÛÛX[ŠNÂˆYÙQ]K˜[››Ý][ÛœÈH™]Ð[››Ý][ÛœË›[™ÝˆÈ™]Ð[››Ý][ÛœÈˆ[ÂˆYÙQ]K™ØÝ[Y[]Kš\ÔÚYÛ˜]\™P[››Ý][ÛœÈH\ÔÚYÛ˜]\™P[››Ý][ÛœÎÂˆBˆÜÙ]ÜÝÛ™Y™YÛÜY\Ê[ØÝ[Y[]JHÂˆ›Üˆ
ÛÛœÝÂˆÜÝÛ™Y™YÛÜY\ËˆYÙ\ÓX\ˆHÙˆ[ØÝ[Y[]JHÂˆ›Üˆ
ÛÛœÝÛYÙT™YˆÙˆYÙ\ÓX\šÙ^\Ê
JHÂˆÜÝÛ™Y™YÛÜY\Ëœ]
ÛYÙT™Y‹×JNÂˆBˆBˆBˆÙš^ÜÝÛ™Y™YÛÜY\Ê[ØÝ[Y[]JHÂˆ›Üˆ
ÛÛœÝÂˆÜÝÛ™Y™YÛÜY\ËˆÛ™Y“X\[™ÂˆHÙˆ[ØÝ[Y[]JHÂˆ›Üˆ
ÛÛœÝÛÛ™Y‹XÝ[Ûœ×HÙˆÜÝÛ™Y™YÛÜY\Ëš][\Ê
JHÂˆÛÛœÝ™]Ô™YˆHÛ™Y“X\[™Ë™Ù]
Û™YŠNÂˆ›Üˆ
ÛÛœÝXÝ[ÛˆÙˆXÝ[ÛœÊHÂˆXÝ[ÛŠ™]Ô™YŠNÂˆBˆBˆÜÝÛ™Y™YÛÜY\Ë˜ÛX\Š
NÂˆBˆBˆÝš\Ú]Øš™XÝ
Øš‹Ø[˜XÚËš\Ú]YH™]È™Y”Ù]

JHÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ™YŠHÂˆYˆ
]š\Ú]Yš\ÊØšŠJHÂˆš\Ú]Yœ]
ØšŠNÂˆ\ËˆÝš\Ú]Øš™XÝ
\Ëž™Y–ÛØš‹›[WKØ[˜XÚËš\Ú]Y
NÂˆBˆ™]\›ŽÂˆBˆYˆ
\œ˜^Kš\Ð\œ˜^JØšŠJHÂˆ›Üˆ
ÛÛœÝ][HÙˆØšŠHÂˆ\ËˆÝš\Ú]Øš™XÝ
][KØ[˜XÚËš\Ú]Y
NÂˆBˆ™]\›ŽÂˆBˆ]XÝÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ
ÂˆXÝˆHHØšŠNÂˆH[ÙHYˆ
Øšˆ[œÝ[˜Ù[ÙˆXÝ
HÂˆXÝHØšŽÂˆBˆYˆ
XÝ
HÂˆØ[˜XÚÊXÝ
NÂˆ›Üˆ
ÛÛœÝ˜[YHÙˆXÝ™Ù]˜]Õ˜[Y\Ê
JHÂˆ\ËˆÝš\Ú]Øš™XÝ
˜[YKØ[˜XÚËš\Ú]Y
NÂˆBˆBˆBˆ\Þ[˜ÈÛY\™ÙTÝXÝ™Y\Ê[ØÝ[Y[]JHÂˆ]™]ÔÝXÝ\™[YHÂˆÛÛœÝÂˆ\™[™YNˆ™]Ô\™[™YBˆHH\ÎÂˆ›Üˆ
]HHZHH\Ë›™]ÔYÙ\Ë›[™ÝÈHZNÈJÊÊHÂˆYˆ
]\Ë›ÛYÙ\ÖÚWJHÂˆÛÛ[YNÂˆBˆÛÛœÝÂˆØÝ[Y[]NˆÂˆ\™[™YKˆÛ™Y“X\[™ËˆÛÝXÝ\™[X\[™Ëˆ\ÙYÝXÝ\™[ËˆØÝ[Y[ˆÂˆ™Y‚ˆBˆBˆHH\Ë›ÛYÙ\ÖÚWNÂˆYˆ
\\™[™YJHÂˆÛÛ[YNÂˆBˆÛÛœÝYÙT™YˆH\Ë›™]ÔYÙ\ÖÚWNÂˆÛÛœÝYÙQXÝH\Ëž™Y–ÜYÙT™Y‹›[WNÂˆÛÛœÝš\Ú]YH™]È™Y”Ù]

NÂˆš\Ú]Yœ]
YÙT™YŠNÂˆ\ËˆÝš\Ú]Øš™XÝ
YÙQXÝXÝOˆÂˆÛÛœÝÝXÝ\™[HXÝ™Ù]
”ÝXÝ\™[ŠHÏÈXÝ™Ù]
”ÝXÝ\™[ÈŠNÂˆYˆ
\[ÙˆÝXÝ\™[OOH›[X™\ˆŠHÂˆ™]\›ŽÂˆBˆ\ÙYÝXÝ\™[Ë˜Y
ÝXÝ\™[
NÂˆ]\™[H\™[™YK™Ù]
ÝXÝ\™[
NÂˆÛÛœÝ\™[™YˆH\™[[œÝ[˜Ù[Ùˆ™YˆÈ\™[ˆ[ÂˆYˆ
\™[™YŠHÂˆÛÛœÝ\œ˜^HH™Y‹™™]Ú
\™[™YŠNÂˆYˆ
\œ˜^Kš\Ð\œ˜^J\œ˜^JJHÂˆ\™[H\œ˜^NÂˆBˆBˆYˆ
\œ˜^Kš\Ð\œ˜^J\™[
H	‰ˆ\™[™]™\žJ™YˆOˆ™YˆOOH[
JHÂˆ\™[H[ÂˆBˆYˆ
\\™[
HÂˆYˆ
XÝš\Ê”ÝXÝ\™[ŠJHÂˆXÝ™[]J”ÝXÝ\™[ŠNÂˆH[ÙHÂˆXÝ™[]J”ÝXÝ\™[ÈŠNÂˆBˆ™]\›ŽÂˆBˆ]™]ÔÝXÝ\™[HÛÝXÝ\™[X\[™Ë™Ù]
ÝXÝ\™[
NÂˆYˆ
™]ÔÝXÝ\™[OOH[™Yš[™Y
HÂˆ™]ÔÝXÝ\™[H™]ÔÝXÝ\™[Y
ÊÎÂˆÛÝXÝ\™[X\[™ËœÙ]
ÝXÝ\™[™]ÔÝXÝ\™[
NÂˆ™]Ô\™[™YKœÙ]
™]ÔÝXÝ\™[ÛÛ™Y“X\[™Ë\™[JNÂˆBˆYˆ
XÝš\Ê”ÝXÝ\™[ŠJHÂˆXÝœÙ]
”ÝXÝ\™[‹™]ÔÝXÝ\™[
NÂˆH[ÙHÂˆXÝœÙ]
”ÝXÝ\™[È‹™]ÔÝXÝ\™[
NÂˆBˆKš\Ú]Y
NÂˆBˆÛÛœÝÂˆÝXÝ™YRÚYËˆY™YNˆ™]ÒY™YKˆÛ\ÜÓX\ˆ™]ÐÛ\ÜÓX\ˆ›ÛSX\ˆ™]Ô›ÛSX\ˆ˜[Y\ÜXÙ\Îˆ™]Ó˜[Y\ÜXÙ\ËˆÝXÝ™YPQŽˆ™]ÔÝXÝ™YPQ‹ˆÝXÝ™YT›Û[˜ÚX][Û“^XÛÛŽˆ™]ÔÝXÝ™YT›Û[˜ÚX][Û“^XÛÛ‚ˆHH\ÎÂˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆÛÛœÝÂˆØÝ[Y[ˆÂˆ™Y‚ˆKˆÛ™Y“X\[™Ëˆ\™[™YKˆ\ÙYÝXÝ\™[ËˆÝXÝ™YT›ÛÝˆY™YKˆÛ\ÜÓX\ˆ›ÛSX\ˆ˜[Y\ÜXÙ\ËˆÝXÝ™YPQ‹ˆÝXÝ™YT›Û[˜ÚX][Û“^XÛÛ‚ˆHHØÝ[Y[]NÂˆYˆ
\ÝXÝ™YT›ÛÝ
HÂˆÛÛ[YNÂˆBˆ\Ë˜Ý\œ™[ØÝ[Y[HØÝ[Y[]NÂˆÛÛœÝ™[[Ý™YÝXÝ[[Y[ÈH™]È™Y”Ù]

NÂˆ›Üˆ
ÛÛœÝÚÙ^K˜[YWHÙˆ\™[™YH×JHÂˆYˆ
]\ÙYÝXÝ\™[Ëš\ÊÙ^JH	‰ˆ˜[YH[œÝ[˜Ù[Ùˆ™YŠHÂˆ™[[Ý™YÝXÝ[[Y[Ëœ]
˜[YJNÂˆBˆBˆÛÛœÝY\QÈH™]ÈX\

NÂˆ›Üˆ
ÛÛœÝÚY›ÙT™Y—HÙˆY™YH×JHÂˆ]ÚYHYÂˆYˆ
™]ÒY™YKš\ÊY
JHÂˆ›Üˆ
]HHNÎÈJÊÊHÂˆÛÛœÝ™]ÒYH	ÚYWÉÚ_XÂˆYˆ
[™]ÒY™YKš\Ê™]ÒY
JHÂˆY\QËœÙ]
Y™]ÒY
NÂˆÚYH™]ÒYÂˆœ™XZÎÂˆBˆBˆBˆ™]ÒY™YKœÙ]
ÚY›ÙT™YŠNÂˆBˆÛÛœÝY\Û\ÜÙ\ÈH™]ÈX\

NÂˆYˆ
Û\ÜÓX\ËœÚ^™Hˆ
HÂˆ›Üˆ
]ØÛ\ÜÓ˜[YKÛ\ÜÑXÝHÙˆÛ\ÜÓX\
HÂˆÛ\ÜÑXÝH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊÛ\ÜÑXÝYK™YŠNÂˆYˆ
™]ÐÛ\ÜÓX\š\ÊÛ\ÜÓ˜[YJJHÂˆ›Üˆ
]HHNÎÈJÊÊHÂˆÛÛœÝ™]ÐÛ\ÜÓ˜[YHH	ØÛ\ÜÓ˜[Y_WÉÚ_XÂˆYˆ
[™]ÐÛ\ÜÓX\š\Ê™]ÐÛ\ÜÓ˜[YJJHÂˆY\Û\ÜÙ\ËœÙ]
Û\ÜÓ˜[YK™]ÐÛ\ÜÓ˜[YJNÂˆÛ\ÜÓ˜[YHH™]ÐÛ\ÜÓ˜[YNÂˆœ™XZÎÂˆBˆBˆBˆ™]ÐÛ\ÜÓX\œÙ]
Û\ÜÓ˜[YKÛ\ÜÑXÝ
NÂˆBˆBˆÛÛœÝY\›Û\ÈH™]ÈX\

NÂˆYˆ
›ÛSX\ËœÚ^™Hˆ
HÂˆ›Üˆ
ÛÛœÝÜ›ÛS˜[YKX\Y˜[YWHÙˆ›ÛSX\
HÂˆÛÛœÝ™]ÓX\Y˜[YHH™]Ô›ÛSX\™Ù]
›ÛS˜[YJNÂˆYˆ
[™]ÓX\Y˜[YJHÂˆ™]Ô›ÛSX\œÙ]
›ÛS˜[YKX\Y˜[YJNÂˆÛÛ[YNÂˆBˆYˆ
™]ÓX\Y˜[YHOOHX\Y˜[YJHÂˆÛÛ[YNÂˆBˆ›Üˆ
]HHNÎÈJÊÊHÂˆÛÛœÝ™]Ô›ÛS˜[YHH	Ü›ÛS˜[Y_WÉÚ_XÂˆYˆ
[™]Ô›ÛSX\š\Ê™]Ô›ÛS˜[YJJHÂˆY\›Û\ËœÙ]
›ÛS˜[YK™]Ô›ÛS˜[YJNÂˆ™]Ô›ÛSX\œÙ]
™]Ô›ÛS˜[YKX\Y˜[YJNÂˆœ™XZÎÂˆBˆBˆBˆBˆYˆ
˜[Y\ÜXÙ\ÏË›[™Ýˆ
HÂˆ›Üˆ
ÛÛœÝ˜[Y\ÜXÙT™YˆÙˆ˜[Y\ÜXÙ\ÊHÂˆÛÛœÝ˜[Y\ÜXÙHH]ØZ]™Y‹™™]ÚY”™Y\Þ[˜Ê˜[Y\ÜXÙT™YŠNÂˆ]œÈH˜[Y\ÜXÙK™Ù]
“”ÈŠNÂˆYˆ
[œÈ™]Ó˜[Y\ÜXÙ\Ëš\ÊœÊJHÂˆÛÛ[YNÂˆBˆœÈHÝš[™ÕÔ”Ýš[™ÊœË˜[ÙJNÂˆÛÛœÝ™]Ó˜[Y\ÜXÙHH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Ê˜[Y\ÜXÙKYK™YŠNÂˆ™]Ó˜[Y\ÜXÙ\ËœÙ]
œË™]Ó˜[Y\ÜXÙJNÂˆBˆBˆYˆ
ÝXÝ™YPQŠHÂˆ›Üˆ
ÛÛœÝY”™YˆÙˆÝXÝ™YPQŠHÂˆ™]ÔÝXÝ™YPQ‹œ\Ú
]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊY”™Y‹YK™YŠJNÂˆBˆBˆYˆ
ÝXÝ™YT›Û[˜ÚX][Û“^XÛÛŠHÂˆ›Üˆ
ÛÛœÝ^XÛÛ”™YˆÙˆÝXÝ™YT›Û[˜ÚX][Û“^XÛÛŠHÂˆ™]ÔÝXÝ™YT›Û[˜ÚX][Û“^XÛÛ‹œ\Ú
]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Ê^XÛÛ”™Y‹YK™YŠJNÂˆBˆBˆÛÛœÝ˜]ÒÚYÈHÝXÝ™YT›ÛÝ™XÝ™Ù]˜]Ê’ÈŠNÂˆYˆ
\˜]ÒÚYÊHÂˆÛÛ[YNÂˆBˆÛÛœÝÚYÈH]ØZ]\ËˆÜ™\ÛÛ™TÝXÝÚYÊ˜]ÒÚYË™YŠNÂˆ›Üˆ
]ÚYÙˆÚYÊHÂˆÛÛœÝÚY™YˆHÚY[œÝ[˜Ù[Ùˆ™YˆÈÚYˆ[ÂˆÚYH]ØZ]™Y‹™™]ÚY”™Y\Þ[˜ÊÚY
NÂˆYˆ
JÚY[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆ]Ù]\ÔÜ[ˆH˜[ÙNÂˆYˆ
ÚY™Yˆ	‰ˆ™[[Ý™YÝXÝ[[Y[Ëš\ÊÚY™YŠJHÂˆYˆ
Z\Ó˜[YJÚY™Ù]
”ÈŠK“[šÈŠJHÂˆÛÛ[YNÂˆBˆÙ]\ÔÜ[ˆHYNÂˆBˆÛÛœÝ™]ÒÚY™YˆH]ØZ]\ËˆØÛÛ™TÝXÝ™YS›ÙJÚY™Y‹ÚY™Y‹™[[Ý™YÝXÝ[[Y[ËY\QËY\Û\ÜÙ\ËY\›Û\ÊNÂˆYˆ
™]ÒÚY™YŠHÂˆÝXÝ™YRÚYËœ\Ú
™]ÒÚY™YŠNÂˆYˆ
ÚY™YŠHÂˆÛ™Y“X\[™Ëœ]
ÚY™Y‹™]ÒÚY™YŠNÂˆBˆYˆ
Ù]\ÔÜ[ŠHÂˆ\Ëž™Y–Û™]ÒÚY™Y‹›[WKœÙ]Y“˜[YJ”È‹”Ü[ˆŠNÂˆBˆBˆBˆ›Üˆ
ÛÛœÝÚY›ÙT™Y—HÙˆY™YH×JHÂˆÛÛœÝ™]Ó›ÙT™YˆH›ÙT™Yˆ[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆÛ™Y“X\[™Ë™Ù]
›ÙT™YŠNÂˆÛÛœÝ™]ÒYHY\QË™Ù]
Y
HYÂˆYˆ
™]Ó›ÙT™YŠHÂˆ™]ÒY™YKœÙ]
™]ÒY™]Ó›ÙT™YŠNÂˆH[ÙHÂˆ™]ÒY™YK™[]J™]ÒY
NÂˆBˆBˆBˆ›Üˆ
ÛÛœÝÚÙ^KÛÛ™Y“X\[™Ë\™[WHÙˆ™]Ô\™[™YJHÂˆYˆ
\\™[
HÂˆ™]Ô\™[™YK™[]JÙ^JNÂˆÛÛ[YNÂˆBˆYˆ
P\œ˜^Kš\Ð\œ˜^J\™[
JHÂˆÛÛœÝ™]Ô\™[HÛ™Y“X\[™Ë™Ù]
\™[
NÂˆYˆ
™]Ô\™[OOH[™Yš[™Y
HÂˆ™]Ô\™[™YK™[]JÙ^JNÂˆH[ÙHÂˆ™]Ô\™[™YKœÙ]
Ù^K™]Ô\™[
NÂˆBˆÛÛ[YNÂˆBˆÛÛœÝ™]Ô\™[ÈH\™[›X\
™YˆOˆ™Yˆ[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆÛ™Y“X\[™Ë™Ù]
™YŠH[
NÂˆYˆ
™]Ô\™[Ë›[™ÝOOH™]Ô\™[Ë™]™\žJ™YˆOˆ™YˆOOH[
JHÂˆ™]Ô\™[™YK™[]JÙ^JNÂˆÛÛ[YNÂˆBˆ™]Ô\™[™YKœÙ]
Ù^K™]Ô\™[ÊNÂˆBˆ\Ë˜Ý\œ™[ØÝ[Y[H[ÂˆBˆØÛÛXÝ˜[Y\Ý[˜][ÛœÊ[ØÝ[Y[]JHÂˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆYˆ
YØÝ[Y[]K™\Ý[˜][ÛœÊHÂˆÛÛ[YNÂˆBˆÛÛœÝÂˆ\Ý[˜][ÛœËˆYÙ\ÓX\ˆHHØÝ[Y[]NÂˆÛÛœÝ™]Ñ\Ý[˜][ÛœÈHØÝ[Y[]K™\Ý[˜][ÛœÈH™]ÈX\

NÂˆ›Üˆ
ÛÛœÝÚÙ^K\ÝHÙˆ\Ý[˜][ÛœÊHÂˆÛÛœÝYÙT™YˆH\ÝÌNÂˆÛÛœÝYÙQ]HHYÙT™Yˆ[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆYÙ\ÓX\™Ù]
YÙT™YŠNÂˆYˆ
\YÙQ]JHÂˆÛÛ[YNÂˆBˆ
YÙQ]KœÚ[[™Ó˜[YY\Ý[˜][ÛœÈH™]ÈÙ]

JK˜Y
Ù^JNÂˆ™]Ñ\Ý[˜][ÛœËœÙ]
Ù^K\Ý
NÂˆBˆBˆBˆÙš[™\XØ]S˜[YY\Ý[˜][ÛœÊ
HÂˆÛÛœÝÂˆ˜[YY\Ý[˜][ÛœÂˆHH\ÎÂˆÛÛœÝÙ][š\]YQ\Ý[˜][Û“˜[YHH˜[YHOˆÂˆYˆ
[˜[YY\Ý[˜][ÛœËš\Ê˜[YJJHÂˆ™]\›ˆ˜[YNÂˆBˆ›Üˆ
]HHNÎÈJÊÊHÂˆÛÛœÝY\Y˜[YHH	Û˜[Y_WÉÚ_XÂˆYˆ
[˜[YY\Ý[˜][ÛœËš\ÊY\Y˜[YJJHÂˆ™]\›ˆY\Y˜[YNÂˆBˆBˆNÂˆ›Üˆ
]HHZHH\Ë›ÛYÙ\Ë›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝYÙHH\Ë›ÛYÙ\ÖÚWNÂˆYˆ
\YÙJHÂˆÛÛ[YNÂˆBˆÛÛœÝÂˆØÝ[Y[]NˆÂˆ\Ý[˜][ÛœËˆY\˜[YY\Ý[˜][ÛœËˆ\ÙY˜[YY\Ý[˜][ÛœÂˆBˆHHYÙNÂˆ]ÂˆÚ[[™Ó˜[YY\Ý[˜][ÛœÂˆHHYÙNÂˆYˆ
\Ú[[™Ó˜[YY\Ý[˜][ÛœÊHÂˆÛÛ[YNÂˆBˆYÙKœÚ[[™Ó˜[YY\Ý[˜][ÛœÈHÚ[[™Ó˜[YY\Ý[˜][ÛœÈHÚ[[™Ó˜[YY\Ý[˜][ÛœËš[\œÙXÝ[ÛŠ\ÙY˜[YY\Ý[˜][ÛœÊNÂˆ›Üˆ
ÛÛœÝÚ[[™Ñ\ÝÙˆÚ[[™Ó˜[YY\Ý[˜][ÛœÊHÂˆYˆ
]\ÙY˜[YY\Ý[˜][ÛœËš\ÊÚ[[™Ñ\Ý
JHÂˆÛÛ[YNÂˆBˆÛÛœÝ\ÝH\Ý[˜][ÛœË™Ù]
Ú[[™Ñ\Ý
KœÛXÙJ
NÂˆYˆ
[˜[YY\Ý[˜][ÛœËš\ÊÚ[[™Ñ\Ý
JHÂˆ˜[YY\Ý[˜][ÛœËœÙ]
Ú[[™Ñ\Ý\Ý
NÂˆÛÛ[YNÂˆBˆÛÛœÝ™]Ó˜[YHHÙ][š\]YQ\Ý[˜][Û“˜[YJ	ÜÚ[[™Ñ\ÝWÜ	ÚH
È_X
NÂˆY\˜[YY\Ý[˜][ÛœËœÙ]
Ú[[™Ñ\Ý™]Ó˜[YJNÂˆ˜[YY\Ý[˜][ÛœËœÙ]
™]Ó˜[YK\Ý
NÂˆBˆBˆBˆÙš^˜[YY\Ý[˜][ÛœÊ[››Ý][ÛœËY\˜[YY\Ý[˜][ÛœÊHÂˆYˆ
Y\˜[YY\Ý[˜][ÛœËœÚ^™HOOH
HÂˆ™]\›ŽÂˆBˆÛÛœÝš^\Ý[˜][ÛˆH
XÝÙ^K\Ý
HOˆÂˆYˆ
\[Ùˆ\ÝOOHœÝš[™ÈŠHÂˆXÝœÙ]
Ù^KY\˜[YY\Ý[˜][ÛœË™Ù]
Ýš[™ÕÔ”Ýš[™Ê\ÝYJJH\Ý
NÂˆBˆNÂˆ›Üˆ
ÛÛœÝ[››Ý™YˆÙˆ[››Ý][ÛœÊHÂˆÛÛœÝ[››ÝXÝH\Ëž™Y–Ø[››Ý™Y‹›[WNÂˆYˆ
Z\Ó˜[YJ[››ÝXÝ™Ù]
”ÝX\HŠK“[šÈŠJHÂˆÛÛ[YNÂˆBˆÛÛœÝXÝ[ÛˆH[››ÝXÝ™Ù]
HŠNÂˆYˆ
XÝ[Ûˆ[œÝ[˜Ù[ÙˆXÝ	‰ˆXÝ[Û‹š\Ê‘ŠJHÂˆÛÛœÝ\ÝHXÝ[Û‹™Ù]
‘ŠNÂˆš^\Ý[˜][ÛŠXÝ[Û‹‘‹\Ý
NÂˆÛÛ[YNÂˆBˆÛÛœÝ\ÝH[››ÝXÝ™Ù]
‘\ÝŠNÂˆš^\Ý[˜][ÛŠ[››ÝXÝ‘\Ý‹\Ý
NÂˆBˆBˆØÛÛXÝÝ][™Q\Ý[˜][ÛœÊ[ØÝ[Y[]JHÂˆÛÛœÝÛÛXÝH
][\Ë\Ý[˜][ÛœË\ÙY˜[YY\Ý[˜][ÛœÊHOˆÂˆ›Üˆ
ÛÛœÝ][HÙˆ][\ÊHÂˆYˆ
\[Ùˆ][K™\ÝOOHœÝš[™Èˆ	‰ˆ\Ý[˜][ÛœÏËš\Ê][K™\Ý
JHÂˆ\ÙY˜[YY\Ý[˜][ÛœË˜Y
][K™\Ý
NÂˆBˆYˆ
][Kš][\Ë›[™Ýˆ
HÂˆÛÛXÝ
][Kš][\Ë\Ý[˜][ÛœË\ÙY˜[YY\Ý[˜][ÛœÊNÂˆBˆBˆNÂˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆÛÛœÝÂˆÝ][™Kˆ\Ý[˜][ÛœËˆ\ÙY˜[YY\Ý[˜][ÛœÂˆHHØÝ[Y[]NÂˆYˆ
Ý][™OË›[™Ý
HÂˆÛÛXÝ
Ý][™K\Ý[˜][ÛœË\ÙY˜[YY\Ý[˜][ÛœÊNÂˆBˆBˆBˆÚ\Õ˜[YÝ][™Q\Ý
][KØÝ[Y[]JHÂˆÛÛœÝÂˆ\ÝˆXÝ[Û‹ˆ\›ˆ[œØY™U\›ˆ]XÚY[ˆÙ]ÐÑÔÝ]BˆHH][NÂˆYˆ
XÝ[Ûˆ\›[œØY™U\›]XÚY[Ù]ÐÑÔÝ]JHÂˆ™]\›ˆYNÂˆBˆYˆ
Y\Ý
HÂˆ™]\›ˆ˜[ÙNÂˆBˆYˆ
\[Ùˆ\ÝOOHœÝš[™ÈŠHÂˆÛÛœÝ˜[YHHØÝ[Y[]K™Y\˜[YY\Ý[˜][ÛœË™Ù]
\Ý
H\ÝÂˆ™]\›ˆ\Ë›˜[YY\Ý[˜][ÛœËš\Ê˜[YJNÂˆBˆYˆ
\œ˜^Kš\Ð\œ˜^J\Ý
H	‰ˆ\ÝÌH[œÝ[˜Ù[Ùˆ™YŠHÂˆ™]\›ˆHYØÝ[Y[]K›Û™Y“X\[™Ë™Ù]
\ÝÌJNÂˆBˆ™]\›ˆ˜[ÙNÂˆBˆÙš[\“Ý][™R][\Ê][\ËØÝ[Y[]JHÂˆÛÛœÝ™\Ý[H×NÂˆ›Üˆ
ÛÛœÝ][HÙˆ][\ÊHÂˆÛÛœÝš[\™YÚ[™[ˆH\ËˆÙš[\“Ý][™R][\Ê][Kš][\ËØÝ[Y[]JNÂˆÛÛœÝ\Õ˜[YÝÛ‘\ÝH\ËˆÚ\Õ˜[YÝ][™Q\Ý
][KØÝ[Y[]JNÂˆYˆ
\Õ˜[YÝÛ‘\Ýš[\™YÚ[™[‹›[™Ýˆ
HÂˆ™\Ý[œ\Ú
Âˆ‹‹š][Kˆ\Ýˆ\Õ˜[YÝÛ‘\ÝÈ][K™\Ýˆ[ˆ˜]ÑXÝˆ\Õ˜[YÝÛ‘\ÝÈ][Kœ˜]ÑXÝˆ[ˆ][\Îˆš[\™YÚ[™[‹ˆÙØÝ[Y[]NˆØÝ[Y[]BˆJNÂˆBˆBˆ™]\›ˆ™\Ý[ÂˆBˆØZ[Ý][™J[ØÝ[Y[]JHÂˆÛÛœÝÝ][™R][\ÈH×NÂˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆÛÛœÝÂˆÝ][™BˆHHØÝ[Y[]NÂˆYˆ
[Ý][™OË›[™Ý
HÂˆÛÛ[YNÂˆBˆÝ][™R][\Ëœ\Ú
‹‹\ËˆÙš[\“Ý][™R][\ÊÝ][™KØÝ[Y[]JJNÂˆBˆ\Ë›Ý][™R][\ÈHÝ][™R][\Ë›[™ÝˆÈÝ][™R][\Èˆ[ÂˆBˆ\Þ[˜ÈÜÙ]Ý][™R][Q\Ý
][QXÝ][JHÂˆÛÛœÝÂˆ\Ýˆ˜]ÑXÝˆHH][NÂˆÛÛœÝØÝ[Y[]HH][K—ÙØÝ[Y[]NÂˆYˆ
\Ý
HÂˆYˆ
\[Ùˆ\ÝOOHœÝš[™ÈŠHÂˆÛÛœÝ˜[YHHØÝ[Y[]K™Y\˜[YY\Ý[˜][ÛœË™Ù]
\Ý
H\ÝÂˆ][QXÝœÙ]
‘\Ý‹Ýš[™ÕÐ\ØÚZSÜ•UŒM‘J˜[YJJNÂˆH[ÙHYˆ
\œ˜^Kš\Ð\œ˜^J\Ý
JHÂˆÛÛœÝ™]Ñ\ÝH\ÝœÛXÙJ
NÂˆYˆ
™]Ñ\ÝÌH[œÝ[˜Ù[Ùˆ™YŠHÂˆ™]Ñ\ÝÌHHØÝ[Y[]K›Û™Y“X\[™Ë™Ù]
™]Ñ\ÝÌJH™]Ñ\ÝÌNÂˆBˆ][QXÝœÙ]
‘\Ý‹™]Ñ\Ý
NÂˆBˆ™]\›ŽÂˆBˆÛÛœÝXÝ[Û‘XÝH˜]ÑXÝË™Ù]
HŠNÂˆYˆ
XÝ[Û‘XÝ[œÝ[˜Ù[ÙˆXÝ
HÂˆ\Ë˜Ý\œ™[ØÝ[Y[HØÝ[Y[]NÂˆÛÛœÝXÝ[Û”™YˆH]ØZ]\ËˆØÛÛ™SØš™XÝ
XÝ[Û‘XÝØÝ[Y[]K™ØÝ[Y[ž™YŠNÂˆ\Ë˜Ý\œ™[ØÝ[Y[H[Âˆ][QXÝœÙ]
H‹XÝ[Û”™YŠNÂˆBˆBˆ\Þ[˜ÈÛXZÙSÝ][™J
HÂˆÛÛœÝÂˆÝ][™R][\ÂˆHH\ÎÂˆYˆ
[Ý][™R][\ÏË›[™Ý
HÂˆ™]\›ŽÂˆBˆÛÛœÝÛÝ][™T›ÛÝ™Y‹Ý][™T›ÛÝXÝHH\Ë›™]ÑXÝÂˆÝ][™T›ÛÝXÝœÙ]Y“˜[YJ•\H‹“Ý][™\ÈŠNÂˆÛÛœÝ\ÜÚYÛ”™YœÈH][\ÈOˆÂˆ›Üˆ
ÛÛœÝ][HÙˆ][\ÊHÂˆÚ][K—Ü™Y—HH\Ë›™]ÑXÝÂˆYˆ
][Kš][\Ë›[™Ýˆ
HÂˆ\ÜÚYÛ”™YœÊ][Kš][\ÊNÂˆBˆBˆNÂˆ\ÜÚYÛ”™YœÊÝ][™R][\ÊNÂˆÛÛœÝš[][\ÈH\Þ[˜È
][\Ë\™[™YŠHOˆÂˆ]Ý[ÛÝ[HÂˆ›Üˆ
]HHÈH][\Ë›[™ÝÈJÊÊHÂˆÛÛœÝ][HH][\ÖÚWNÂˆÛÛœÝXÝH\Ëž™Y–Ú][K—Ü™Y‹›[WNÂˆXÝœÙ]
•]H‹Ýš[™ÕÐ\ØÚZSÜ•UŒM‘J][K]JJNÂˆXÝœÙ]
”\™[‹\™[™YŠNÂˆYˆ
Hˆ
HÂˆXÝœÙ]
”™]ˆ‹][\ÖÚHHWK—Ü™YŠNÂˆBˆYˆ
H][\Ë›[™ÝHJHÂˆXÝœÙ]
“™^‹][\ÖÚH
ÈWK—Ü™YŠNÂˆBˆYˆ
][Kš][\Ë›[™Ýˆ
HÂˆXÝœÙ]
‘š\œÝ‹][Kš][\ÖÌK—Ü™YŠNÂˆXÝœÙ]
“\Ý‹][Kš][\Ë˜]
LJK—Ü™YŠNÂˆÛÛœÝÚ[ÛÝ[H]ØZ]š[][\Ê][Kš][\Ë][K—Ü™YŠNÂˆYˆ
][K˜ÛÝ[OOH[™Yš[™Y
HÂˆXÝœÙ]
ÛÝ[‹][K˜ÛÝ[ÈXÚ[ÛÝ[ˆÚ[ÛÝ[
NÂˆBˆÝ[ÛÝ[
ÏH][K˜ÛÝ[OOH[™Yš[™Y	‰ˆ][K˜ÛÝ[ÈHˆÚ[ÛÝ[
ÈNÂˆH[ÙHÂˆÝ[ÛÝ[
ÏHNÂˆBˆ]ØZ]\ËˆÜÙ]Ý][™R][Q\Ý
XÝ][JNÂˆÛÛœÝ›YÜÈH
][K˜›ÛÈˆˆ
H
][Kš][XÈÈHˆ
NÂˆYˆ
›YÜÈOOH
HÂˆXÝœÙ]
‘ˆ‹›YÜÊNÂˆBˆYˆ
][K˜ÛÛÜˆ	‰ˆ
][K˜ÛÛÜ–ÌHOOH][K˜ÛÛÜ–ÌWHOOH][K˜ÛÛÜ–Ì—HOOH
JHÂˆXÝœÙ]
È‹Ú][K˜ÛÛÜ–ÌHÈMK][K˜ÛÛÜ–ÌWHÈMK][K˜ÛÛÜ–Ì—HÈMWJNÂˆBˆBˆ™]\›ˆÝ[ÛÝ[ÂˆNÂˆÛÛœÝÝ[ÛÝ[H]ØZ]š[][\ÊÝ][™R][\ËÝ][™T›ÛÝ™YŠNÂˆÝ][™T›ÛÝXÝœÙ]
‘š\œÝ‹Ý][™R][\ÖÌK—Ü™YŠNÂˆÝ][™T›ÛÝXÝœÙ]
“\Ý‹Ý][™R][\Ë˜]
LJK—Ü™YŠNÂˆÝ][™T›ÛÝXÝœÙ]
ÛÝ[‹Ý[ÛÝ[
NÂˆ\Ëœ›ÛÝXÝœÙ]
“Ý][™\È‹Ý][™T›ÛÝ™YŠNÂˆBˆ\Þ[˜ÈÛY\™ÙPXÜ›Ñ›Ü›\Ê[ØÝ[Y[]JHÂˆ\ËˆÜÙ]XÜ›Ñ›Ü›QY˜][˜\ÚXÕ˜[Y\Ê[ØÝ[Y[]JNÂˆ\ËˆÜÙ]XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙJ[ØÝ[Y[]JNÂˆ\ËˆÜÙ]XÜ›Ñ›Ü›TJ[ØÝ[Y[]JNÂˆ]ØZ]\ËˆÜÙ]XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\Ê[ØÝ[Y[]JNÂˆÛÛœÝ™]ÑšY[ÈH\Ë™šY[ÎÂˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆ]šY[ÈHØÝ[Y[]K˜XÜ›Ñ›Ü›OË™Ù]
‘šY[ÈŠH[ÂˆYˆ
YšY[È	‰ˆØÝ[Y[]K™šY[Ô\™[œÚ^™Hˆ
HÂˆšY[ÈH\ËˆÙš^šY[ÊØÝ[Y[]K™šY[Ô\™[ØÝ[Y[]K™ØÝ[Y[ž™YŠNÂˆBˆYˆ
\œ˜^Kš\Ð\œ˜^JšY[ÊH	‰ˆšY[Ë›[™Ýˆ
HÂˆ\Ë˜Ý\œ™[ØÝ[Y[HØÝ[Y[]NÂˆ]ØZ]\ËˆØÛÛ™QšY[Ê™]ÑšY[ËšY[ÊNÂˆ\Ë˜Ý\œ™[ØÝ[Y[H[ÂˆBˆBˆ\ËˆÜÙ]XÜ›Ñ›Ü›PØ[Ý[][Û“Ü™\Š[ØÝ[Y[]JNÂˆBˆÜÙ]XÜ›Ñ›Ü›TJ[ØÝ[Y[]JHÂˆ]š\œÝHHÂˆ]š\œÝØÑ]HH[Âˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆÛÛœÝHHØÝ[Y[]K˜XÜ›Ñ›Ü›OË™Ù]
”HŠNÂˆYˆ
\[ÙˆHOOH›[X™\ˆˆHOOH
HÂˆÛÛ[YNÂˆBˆYˆ
š\œÝØÑ]OË˜XÜ›Ñ›Ü›THˆ
HÂˆØÝ[Y[]K˜XÜ›Ñ›Ü›THHNÂˆÛÛ[YNÂˆBˆYˆ
š\œÝHOOH
HÂˆš\œÝHHNÂˆš\œÝØÑ]HHØÝ[Y[]NÂˆÛÛ[YNÂˆBˆYˆ
HOOHš\œÝJHÂˆÛÛ[YNÂˆBˆš\œÝØÑ]K˜XÜ›Ñ›Ü›THHš\œÝNÂˆØÝ[Y[]K˜XÜ›Ñ›Ü›THHNÂˆš\œÝHHÂˆBˆYˆ
š\œÝHˆ
HÂˆ\Ë˜XÜ›Ñ›Ü›THHš\œÝNÂˆBˆBˆÜÙ]XÜ›Ñ›Ü›QY˜][˜\ÚXÕ˜[Y\Ê[ØÝ[Y[]JHÂˆ]ÚYÑ›YÜÈHÂˆ]™YY\X\˜[˜Ù\ÈH˜[ÙNÂˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆYˆ
YØÝ[Y[]K˜XÜ›Ñ›Ü›JHÂˆÛÛ[YNÂˆBˆÛÛœÝÙˆHØÝ[Y[]K˜XÜ›Ñ›Ü›K™Ù]
”ÚYÑ›YÜÈŠNÂˆYˆ
\[ÙˆÙˆOOH›[X™\ˆˆ	‰ˆØÝ[Y[]Kš\ÔÚYÛ˜]\™P[››Ý][ÛœÊHÂˆÚYÑ›YÜÈHÙŽÂˆBˆYˆ
ØÝ[Y[]K˜XÜ›Ñ›Ü›K™Ù]
“™YY\X\˜[˜Ù\ÈŠHOOHYJHÂˆ™YY\X\˜[˜Ù\ÈHYNÂˆBˆBˆ\Ë˜XÜ›Ñ›Ü›TÚYÑ›YÜÈHÚYÑ›YÜÎÂˆ\Ë˜XÜ›Ñ›Ü›S™YY\X\˜[˜Ù\ÈH™YY\X\˜[˜Ù\ÎÂˆBˆÜÙ]XÜ›Ñ›Ü›PØ[Ý[][Û“Ü™\Š[ØÝ[Y[]JHÂˆÛÛœÝØ[Ý[][Û“Ü™\ˆH×NÂˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆÛÛœÝÛÈHØÝ[Y[]K˜XÜ›Ñ›Ü›OË™Ù]
ÓÈŠH[ÂˆYˆ
P\œ˜^Kš\Ð\œ˜^JÛÊJHÂˆÛÛ[YNÂˆBˆÛÛœÝÂˆÛ™Y“X\[™ÂˆHHØÝ[Y[]NÂˆ›Üˆ
ÛÛœÝÛÔ™YˆÙˆÛÊHÂˆÛÛœÝ™]ÐÛÔ™YˆHÛÔ™Yˆ[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆÛ™Y“X\[™Ë™Ù]
ÛÔ™YŠNÂˆYˆ
™]ÐÛÔ™YŠHÂˆØ[Ý[][Û“Ü™\‹œ\Ú
™]ÐÛÔ™YŠNÂˆBˆBˆBˆ\Ë˜XÜ›Ñ›Ü›PØ[Ý[][Û“Ü™\ˆHØ[Ý[][Û“Ü™\‹›[™ÝˆÈØ[Ý[][Û“Ü™\ˆˆ[ÂˆBˆÜÙ]XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙJ[ØÝ[Y[]JHÂˆ]š\œÝHH[Âˆ]š\œÝØÑ]HH[Âˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆÛÛœÝHHØÝ[Y[]K˜XÜ›Ñ›Ü›OË™Ù]
‘HŠH[ÂˆYˆ
YH\[ÙˆHOOHœÝš[™ÈŠHÂˆÛÛ[YNÂˆBˆYˆ
š\œÝØÑ]OË˜XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙJHÂˆØÝ[Y[]K˜XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙHHNÂˆÛÛ[YNÂˆBˆYˆ
Yš\œÝJHÂˆš\œÝHHNÂˆš\œÝØÑ]HHØÝ[Y[]NÂˆÛÛ[YNÂˆBˆYˆ
HOOHš\œÝJHÂˆÛÛ[YNÂˆBˆš\œÝØÑ]K˜XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙHHš\œÝNÂˆØÝ[Y[]K˜XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙHHNÂˆš\œÝHH[ÂˆBˆYˆ
š\œÝJHÂˆ\Ë˜XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙHHš\œÝNÂˆBˆBˆ\Þ[˜ÈÜÙ]XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\Ê[ØÝ[Y[]JHÂˆ]š\œÝˆH[Âˆ]š\œÝ”™YˆH[Âˆ]š\œÝØÑ]HH[Âˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆÛÛœÝˆHØÝ[Y[]K˜XÜ›Ñ›Ü›OË™Ù]
‘ˆŠH[ÂˆYˆ
YˆJˆ[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆYˆ
š\œÝØÑ]OË˜XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ÊHÂˆØÝ[Y[]K˜XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ÈHŽÂˆÛÛ[YNÂˆBˆYˆ
Yš\œÝŠHÂˆš\œÝˆHŽÂˆš\œÝ”™YˆHØÝ[Y[]K˜XÜ›Ñ›Ü›K™Ù]˜]Ê‘ˆŠNÂˆš\œÝØÑ]HHØÝ[Y[]NÂˆÛÛ[YNÂˆBˆYˆ
Y\ÛÛ\\™Jš\œÝ‹ŠJHÂˆÛÛ[YNÂˆBˆš\œÝØÑ]K˜XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ÈHš\œÝŽÂˆØÝ[Y[]K˜XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ÈHŽÂˆš\œÝˆH[Âˆš\œÝ”™YˆH[ÂˆBˆYˆ
š\œÝŠHÂˆ\Ë˜Ý\œ™[ØÝ[Y[Hš\œÝØÑ]NÂˆ\Ë˜XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ÈH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Êš\œÝ”™Y‹YKš\œÝØÑ]K™ØÝ[Y[ž™YŠNÂˆ\Ë˜Ý\œ™[ØÝ[Y[H[ÂˆBˆBˆÙš^šY[ÊšY[Ô\™[™YŠHÂˆÛÛœÝ™]ÑšY[ÈH×NÂˆÛÛœÝ›ØÙ\ÜÙYH™]È™Y”Ù]

NÂˆ›Üˆ
ÛÛœÝÙšY[™Y‹\™[™Y—HÙˆšY[Ô\™[š][\Ê
JHÂˆYˆ
\\™[™YŠHÂˆ™]ÑšY[Ëœ\Ú
šY[™YŠNÂˆÛÛ[YNÂˆBˆ]\™[H\™[™YŽÂˆ]\Ý›Û“[\™[H\™[™YŽÂˆÛÛœÝš\Ú]YH™]È™Y”Ù]

NÂˆÚ[H
YJHÂˆYˆ
\™[[œÝ[˜Ù[Ùˆ™YŠHÂˆYˆ
š\Ú]Yš\Ê\™[
JHÂˆœ™XZÎÂˆBˆš\Ú]Yœ]
\™[
NÂˆBˆÛÛœÝ\™[XÝH™Y‹™™]ÚY”™YŠ\™[
NÂˆYˆ
J\™[XÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆœ™XZÎÂˆBˆ\™[H\™[XÝ™Ù]˜]Ê”\™[ŠH[ÂˆYˆ
\\™[
HÂˆœ™XZÎÂˆBˆ\Ý›Û“[\™[H\™[ÂˆBˆYˆ
\Ý›Û“[\™[[œÝ[˜Ù[Ùˆ™Yˆ	‰ˆ\›ØÙ\ÜÙYš\Ê\Ý›Û“[\™[
JHÂˆ™]ÑšY[Ëœ\Ú
\Ý›Û“[\™[
NÂˆ›ØÙ\ÜÙYœ]
\Ý›Û“[\™[
NÂˆBˆBˆ™]\›ˆ™]ÑšY[ÎÂˆBˆ\Þ[˜ÈØÛÛ™QšY[Ê™]ÑšY[ËšY[ÊHÂˆÛÛœÝ›ØÙ\ÜÙYH™]È™Y”Ù]

NÂˆÛÛœÝÝXÚÈHÞÂˆÚYÎˆšY[Ëˆ™]ÒÚYÎˆ™]ÑšY[ËˆÜÎˆˆÛ\™[™YŽˆ[ˆ\™[™YŽˆ[ˆ\™[ˆ[ˆWNÂˆÛÛœÝÂˆØÝ[Y[ˆÂˆ™Y‚ˆKˆÛ™Y“X\[™ËˆšY[Ô\™[ˆXÜ›Ñ›Ü›QY˜][\X\˜[˜ÙKˆXÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ËˆXÜ›Ñ›Ü›TBˆHH\Ë˜Ý\œ™[ØÝ[Y[ÂˆÛÛœÝUÑš^H×NÂˆÛÛœÝ•Ñš^H×NÂˆÚ[H
ÝXÚË›[™Ýˆ
HÂˆÛÛœÝ]HHÝXÚË˜]
LJNÂˆÛÛœÝÂˆÚYËˆ™]ÒÚYËˆ\™[ˆÜÂˆHH]NÂˆYˆ
ÜÈOOHÚYË›[™Ý
HÂˆÝXÚËœÜ

NÂˆYˆ
™]ÒÚYË›[™ÝOOH\\™[
HÂˆÛÛ[YNÂˆBˆÛÛœÝ\™[XÝH\Ëž™Y–Ù]Kœ\™[™Y‹›[WHH\Ë˜ÛÛ™QXÝ
\™[
NÂˆ\™[XÝ™[]J”\™[ŠNÂˆ\™[XÝ™[]J’ÚYÈŠNÂˆ]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Ê\™[XÝ˜[ÙK™YŠNÂˆ\™[XÝœÙ]
’ÚYÈ‹™]ÒÚYÊNÂˆYˆ
ÝXÚË›[™Ýˆ
HÂˆÛÛœÝ\Ý]HHÝXÚË˜]
LJNÂˆYˆ
[\Ý]Kœ\™[™Yˆ	‰ˆ\Ý]K›Û\™[™YŠHÂˆÛÛœÝ\™[™YˆH\Ý]Kœ\™[™YˆH\Ë›™]Ô™YŽÂˆ\™[XÝœÙ]
”\™[‹\™[™YŠNÂˆÛ™Y“X\[™Ëœ]
\Ý]K›Û\™[™Y‹\™[™YŠNÂˆBˆ\Ý]K›™]ÒÚYËœ\Ú
]Kœ\™[™YŠNÂˆBˆÛÛ[YNÂˆBˆÛÛœÝÛÚY™YˆHÚYÖÙ]KœÜÊÊ×NÂˆYˆ
JÛÚY™Yˆ[œÝ[˜Ù[Ùˆ™YŠH›ØÙ\ÜÙYš\ÊÛÚY™YŠJHÂˆÛÛ[YNÂˆBˆ›ØÙ\ÜÙYœ]
ÛÚY™YŠNÂˆÛÛœÝÚYH™Y‹™™]ÚY”™YŠÛÚY™YŠNÂˆYˆ
JÚY[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛ[YNÂˆBˆYˆ
ÚYš\Ê’ÚYÈŠJHÂˆÛÛœÝÚYÐ\œ˜^HHÚY™Ù]
’ÚYÈŠNÂˆYˆ
P\œ˜^Kš\Ð\œ˜^JÚYÐ\œ˜^JJHÂˆÛÛ[YNÂˆBˆÝXÚËœ\Ú
ÂˆÚYÎˆÚYÐ\œ˜^Kˆ™]ÒÚYÎˆ×KˆÜÎˆˆÛ\™[™YŽˆÛÚY™Y‹ˆ\™[™YŽˆ[ˆ\™[ˆÚYˆJNÂˆÛÛ[YNÂˆBˆYˆ
YšY[Ô\™[š\ÊÛÚY™YŠJHÂˆÛÛ[YNÂˆBˆÛÛœÝ™]Ô™YˆHÛ™Y“X\[™Ë™Ù]
ÛÚY™YŠNÂˆYˆ
[™]Ô™YŠHÂˆÛÛ[YNÂˆBˆ™]ÒÚYËœ\Ú
™]Ô™YŠNÂˆYˆ
Y]Kœ\™[™Yˆ	‰ˆ]K›Û\™[™YŠHÂˆ]Kœ\™[™YˆH\Ë›™]Ô™YŽÂˆÛ™Y“X\[™Ëœ]
]K›Û\™[™Y‹]Kœ\™[™YŠNÂˆBˆÛÛœÝ™]ÒÚYH\Ëž™Y–Û™]Ô™Y‹›[WNÂˆYˆ
]Kœ\™[™YŠHÂˆ™]ÒÚYœÙ]
”\™[‹]Kœ\™[™YŠNÂˆBˆYˆ
XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙH	‰ˆ[™]ÒÚYš\Ê‘HŠJHÂˆUÑš^œ\Ú
™]ÒÚY
NÂˆBˆYˆ
XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\È	‰ˆ[™]ÒÚYš\Ê’ÚYÈŠH	‰ˆ™]ÒÚY™Ù]
TŠH[œÝ[˜Ù[ÙˆXÝ
HÂˆ•Ñš^œ\Ú
™]ÒÚY
NÂˆBˆYˆ
XÜ›Ñ›Ü›TH	‰ˆ[™]ÒÚYš\Ê”HŠJHÂˆ™]ÒÚYœÙ]
”H‹XÜ›Ñ›Ü›TJNÂˆBˆBˆ›Üˆ
ÛÛœÝšY[ÙˆUÑš^
HÂˆÛÛœÝšY[\HHÙ][š\š]X›T›Ü\JÂˆXÝˆšY[ˆÙ^Nˆ‘•‚ˆJNÂˆYˆ
Z\Ó˜[YJšY[\K•ŠJHÂˆÛÛ[YNÂˆBˆÛÛœÝHHÙ][š\š]X›T›Ü\JÂˆXÝˆšY[ˆÙ^Nˆ‘H‚ˆJNÂˆYˆ
YJHÂˆšY[œÙ]
‘H‹XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙJNÂˆBˆBˆÛÛœÝ™\ÛÝ\˜Ù\Õ˜[Y\ÐØXÚHH™]ÈX\

NÂˆÛÛœÝš^\X\˜[˜ÙT™\ÛÝ\˜Ù\ÈH\Þ[˜ÈÝ™X[HOˆÂˆ]™\ÛÝ\˜Ù\ÈHÝ™X[K™XÝ™Ù]˜]Ê”™\ÛÝ\˜Ù\ÈŠNÂˆ™\ÛÝ\˜Ù\È	‰H\Ëž™Y•Ü˜\\‹™™]ÚY”™YŠ™\ÛÝ\˜Ù\ÊNÂˆYˆ
J™\ÛÝ\˜Ù\È[œÝ[˜Ù[ÙˆXÝ
JHÂˆÛÛœÝ™]Ô™\ÛÝ\˜Ù\Ô™YˆH]ØZ]™\ÛÝ\˜Ù\Õ˜[Y\ÐØXÚK™Ù]Ü’[œÙ\ÛÛ\]Y
XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\Ë

HOˆ\ËˆØÛÛ™SØš™XÝ
XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\Ë™YŠJNÂˆÝ™X[K™XÝœÙ]
”™\ÛÝ\˜Ù\È‹™]Ô™\ÛÝ\˜Ù\Ô™YŠNÂˆ™]\›ŽÂˆBˆ›Üˆ
ÛÛœÝÜ™\ÒÙ^K™\Õ˜[YWHÙˆXÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\Ë™Ù]˜]Ñ[šY\Ê
JHÂˆYˆ
™\ÛÝ\˜Ù\Ëš\Ê™\ÒÙ^JJHÂˆÛÛ[YNÂˆBˆ]™]Ô™\Õ˜[YHH™\Õ˜[YNÂˆYˆ
™\Õ˜[YH[œÝ[˜Ù[Ùˆ™YŠHÂˆ™]Ô™\Õ˜[YHH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Ê™\Õ˜[YKYK™YŠNÂˆH[ÙHYˆ
™\Õ˜[YH[œÝ[˜Ù[ÙˆXÝ™\Õ˜[YH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[H\œ˜^Kš\Ð\œ˜^J™\Õ˜[YJJHÂˆ™]Ô™\Õ˜[YHH]ØZ]™\ÛÝ\˜Ù\Õ˜[Y\ÐØXÚK™Ù]Ü’[œÙ\ÛÛ\]Y
™\Õ˜[YK

HOˆ\ËˆØÛÛ™SØš™XÝ
™\Õ˜[YK™YŠJNÂˆBˆ™\ÛÝ\˜Ù\ËœÙ]
™\ÒÙ^K™]Ô™\Õ˜[YJNÂˆBˆNÂˆ›Üˆ
ÛÛœÝšY[Ùˆ•Ñš^
HÂˆÛÛœÝ\HšY[™Ù]
TŠNÂˆ›Üˆ
ÛÛœÝË˜[YWHÙˆ\
HÂˆYˆ
˜[YH[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ]ØZ]š^\X\˜[˜ÙT™\ÛÝ\˜Ù\Ê˜[YJNÂˆH[ÙHYˆ
˜[YH[œÝ[˜Ù[ÙˆXÝ
HÂˆ›Üˆ
ÛÛœÝËÝ™X[WHÙˆ˜[YJHÂˆYˆ
Ý™X[H[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆ]ØZ]š^\X\˜[˜ÙT™\ÛÝ\˜Ù\ÊÝ™X[JNÂˆBˆBˆBˆBˆBˆBˆ\Þ[˜ÈØÛÛXÝYÙSX™[Ê
HÂˆYˆ
]\Ëš\ÔÚ[™ÛQš[JHÂˆ™]\›ŽÂˆBˆÛÛœÝš\œÝ™X[YÙHH\Ë›ÛYÙ\Ë™š[™
OˆH\
NÂˆYˆ
Yš\œÝ™X[YÙJHÂˆ™]\›ŽÂˆBˆÛÛœÝÂˆØÝ[Y[]NˆÂˆØÝ[Y[ˆYÙSX™[ÂˆBˆHHš\œÝ™X[YÙNÂˆYˆ
\YÙSX™[ÊHÂˆ™]\›ŽÂˆBˆÛÛœÝ[TYÙ\ÈHØÝ[Y[›[TYÙ\ÎÂˆÛÛœÝX™[ÐžTYÙR[™^H™]ÈX\

NÂˆÛÛœÝÛYÙR[™XÙ\ÈH™]ÈÙ]
\Ë›ÛYÙ\Ë™š[\Š›ÛÛX[ŠK›X\

ÂˆYÙNˆÂˆYÙR[™^ˆBˆJHOˆYÙR[™^
JNÂˆ]Ý\œ™[X™[H[Âˆ]Ýš\œÝ[™^HLNÂˆ›Üˆ
]HHÈH[TYÙ\ÎÈJÊÊHÂˆÛÛœÝ™]ÓX™[HYÙSX™[Ë™Ù]
JNÂˆYˆ
™]ÓX™[
HÂˆÝ\œ™[X™[H™]ÓX™[ÂˆÝš\œÝ[™^HÝ\œ™[X™[š\Ê”ÝŠHÈHˆLNÂˆBˆYˆ
[ÛYÙR[™XÙ\Ëš\ÊJJHÂˆÛÛ[YNÂˆBˆYˆ
Ýš\œÝ[™^OOHLJHÂˆÛÛœÝÝHÝ\œ™[X™[™Ù]
”ÝŠNÂˆÝ\œ™[X™[H\Ë˜ÛÛ™QXÝ
Ý\œ™[X™[
NÂˆÝ\œ™[X™[œÙ]
”Ý‹Ý
È
HHÝš\œÝ[™^
JNÂˆÝš\œÝ[™^HLNÂˆBˆX™[ÐžTYÙR[™^œÙ]
KÝ\œ™[X™[
NÂˆBˆÛÛœÝY˜][X™[H[™^OˆÂˆÛÛœÝX™[H™]ÈXÝ

NÂˆX™[œÙ]Y“˜[YJ”È‹‘ŠNÂˆX™[œÙ]
”Ý‹[™^
ÈJNÂˆ™]\›ˆX™[ÂˆNÂˆÝ\œ™[X™[H[ÂˆÛÛœÝ™]ÔYÙSX™[ÈH\ËœYÙSX™[ÈH×NÂˆ›Üˆ
]HHZHH\Ë›ÛYÙ\Ë›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝYÙQ]HH\Ë›ÛYÙ\ÖÚWNÂˆÛÛœÝX™[HYÙQ]HÈX™[ÐžTYÙR[™^™Ù]
YÙQ]KœYÙKœYÙR[™^
HY˜][X™[
JHˆY˜][X™[
JNÂˆYˆ
X™[OOHÝ\œ™[X™[
HÂˆÛÛ[YNÂˆBˆÝ\œ™[X™[HX™[Âˆ™]ÔYÙSX™[Ëœ\Ú
ÚKÝ\œ™[X™[JNÂˆBˆBˆ\Þ[˜ÈÛXZÙTYÙPÛÜJYÙR[™^
HÂˆÛÛœÝÂˆYÙKˆØÝ[Y[]Kˆ[››Ý][ÛœËˆÚ[[™Ó˜[YY\Ý[˜][ÛœËˆÛÜS]™[ˆHH\Ë›ÛYÙ\ÖÜYÙR[™^NÂˆ\Ë˜Ý\œ™[ØÝ[Y[HØÝ[Y[]NÂˆÛÛœÝÂˆY\˜[YY\Ý[˜][ÛœËˆÛ™Y“X\[™ÂˆHHØÝ[Y[]NÂˆÛÛœÝÂˆ™Y‹ˆ›Ý]KˆYYXP›Þˆ™\ÛÝ\˜Ù\Ëˆ™YŽˆÛYÙT™Y‚ˆHHYÙNÂˆÛÛœÝYÙT™YˆH\Ë›™]Ô™YŽÂˆÛÛœÝYÙQXÝH\Ëž™Y–ÜYÙT™Y‹›[WHH\Ë˜ÛÛ™QXÝ
YÙKœYÙQXÝ
NÂˆÛ™Y“X\[™Ëœ]
ÛYÙT™Y‹YÙT™YŠNÂˆYˆ
Ú[[™Ó˜[YY\Ý[˜][ÛœÊHÂˆ›Üˆ
ÛÛœÝÚ[[™Ñ\ÝÙˆÚ[[™Ó˜[YY\Ý[˜][ÛœÊHÂˆÛÛœÝ˜[YHHY\˜[YY\Ý[˜][ÛœË™Ù]
Ú[[™Ñ\Ý
HÚ[[™Ñ\ÝÂˆÛÛœÝ\ÝH\Ë›˜[YY\Ý[˜][ÛœË™Ù]
˜[YJNÂˆ\ÝÌHHYÙT™YŽÂˆBˆBˆ›Üˆ
ÛÛœÝÙ^HÙˆÈ”›Ý]H‹“YYXP›Þ‹Ü›Ü›Þ‹›YY›Þ‹•š[P›Þ‹\›Þ‹”™\ÛÝ\˜Ù\È‹[››ÝÈ‹”\™[‹•\Ù\•[š]—JHÂˆYÙQXÝ™[]JÙ^JNÂˆBˆÛÛœÝ\Ý™YˆH\Ë›™]Ô™YÛÝ[Âˆ]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\ÊYÙQXÝ˜[ÙK™YŠNÂˆYÙQXÝœÙ]
”›Ý]H‹›Ý]JNÂˆYÙQXÝœÙ]
“YYXP›Þ‹YYXP›Þ
NÂˆ›Üˆ
ÛÛœÝ›Þ˜[YHÙˆÈÜ›Ü›Þ‹›YY›Þ‹•š[P›Þ‹\›Þ—JHÂˆÛÛœÝ›ÞHYÙK™Ù]›Ý[™[™Ð›Þ
›Þ˜[YJNÂˆYˆ
›ÞËœÛÛYJ
˜[YK[™^
HOˆ˜[YHOOHYYXP›ÞÚ[™^JJHÂˆYÙQXÝœÙ]
›Þ˜[YK›Þ
NÂˆBˆBˆÛÛœÝ\Ù\•[š]HYÙK\Ù\•[š]ÂˆYˆ
\Ù\•[š]OOHJHÂˆYÙQXÝœÙ]
•\Ù\•[š]‹\Ù\•[š]
NÂˆBˆYÙQXÝœÙ]Y‘XÝ
”™\ÛÝ\˜Ù\È‹]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Ê™\ÛÝ\˜Ù\ËYK™YŠJNÂˆ]™]Ð[››ÝÈH[ÂˆYˆ
[››Ý][ÛœÊHÂˆÛÛœÝ™]Ð[››Ý][ÛœÈH]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Ê[››Ý][ÛœËYK™YŠNÂˆ\ËˆÙš^˜[YY\Ý[˜][ÛœÊ™]Ð[››Ý][ÛœËY\˜[YY\Ý[˜][ÛœÊNÂˆYˆ
\œ˜^Kš\Ð\œ˜^J™]Ð[››Ý][ÛœÊH	‰ˆ™]Ð[››Ý][ÛœË›[™Ýˆ
HÂˆ™]Ð[››ÝÈH™]Ð[››Ý][ÛœÎÂˆBˆBˆÛÛœÝ™]Ð[››Ý][ÛœÈHØÝ[Y[]K™ØÝ[Y[OOH\ËˆÜš[X\žQØÝ[Y[È\ËˆÛ™]Ð[››Ý][ÛœÔ\˜[\ÏË›™]Ð[››Ý][ÛœÐžTYÙOË™Ù]
YÙKœYÙR[™^
OË™š[\Š
ÂˆÛÜS]™[ˆ]™[ˆJHOˆ
]™[ÏÈ
HOOHÛÜS]™[
Hˆ[ÂˆYˆ
™]Ð[››Ý][ÛœÏË›[™Ý
HÂˆÛÛœÝÂˆ[™\‹ˆ\ÚËˆ[XYÙ\Ô›ÛZ\Ù\ÂˆHH\ËˆÛ™]Ð[››Ý][ÛœÔ\˜[\ÎÂˆÛÛœÝÚ[™Ù\ÈH™]È™Y“X\

NÂˆÛÛœÝ™]Ñ]HH]ØZ][››Ý][Û‘˜XÝÜžKœØ]™S™]Ð[››Ý][ÛœÊYÙK—ØÜ™X]T\X[]˜[X]ÜŠ[™\ŠK\Ëž™Y•Ü˜\\‹\ÚË™]Ð[››Ý][ÛœË[XYÙ\Ô›ÛZ\Ù\ËÚ[™Ù\ÊNÂˆ›Üˆ
ÛÛœÝÜ™Y‹Âˆ]BˆWHÙˆÚ[™Ù\Ëš][\Ê
JHÂˆ\Ëž™Y–Ü™Y‹›[WHH]NÂˆBˆ™]Ð[››ÝÈH×NÂˆ›Üˆ
ÛÛœÝÂˆ™Y‚ˆHÙˆ™]Ñ]K˜[››Ý][ÛœÊHÂˆ™]Ð[››ÝËœ\Ú
™YŠNÂˆBˆBˆYÙQXÝœÙ]Y\œ˜^J[››ÝÈ‹™]Ð[››ÝÊNÂˆYˆ
\Ë\ÙSØš™XÝÝ™X[\ÊHÂˆÛÛœÝ™]Ó\Ý™YˆH\Ë›™]Ô™YÛÝ[ÂˆÛÛœÝYÙSØš™XÝ™YœÈH×NÂˆ›Üˆ
]HH\Ý™YŽÈH™]Ó\Ý™YŽÈJÊÊHÂˆÛÛœÝØšˆH\Ëž™Y–ÚWNÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆÛÛ[YNÂˆBˆYÙSØš™XÝ™YœËœ\Ú
™Y‹™Ù]
K
JNÂˆBˆ›Üˆ
]HHÈHYÙSØš™XÝ™YœË›[™ÝÈH
ÏH™™™ŠHÂˆÛÛœÝØš”Ý™X[T™YˆH\Ë›™]Ô™YŽÂˆ\Ë›Øš”Ý™X[T™YœË˜Y
Øš”Ý™X[T™Y‹›[JNÂˆ\Ëž™Y–ÛØš”Ý™X[T™Y‹›[WHHYÙSØš™XÝ™YœËœÛXÙJKH
È™™™ŠNÂˆBˆBˆ\Ë˜Ý\œ™[ØÝ[Y[H[Âˆ™]\›ˆYÙT™YŽÂˆBˆÛ[Ù[YÙTÚ^™J
HÂˆÛÛœÝÛÝ[ÈH™]ÈX\

NÂˆ›Üˆ
ÛÛœÝYÙQ]HÙˆ\Ë›ÛYÙ\ÊHÂˆYˆ
\YÙQ]JHÂˆÛÛ[YNÂˆBˆÛÛœÝÂˆYÙBˆHHYÙQ]NÂˆÛÛœÝÞLKLWHHYÙKšY]ÎÂˆ]ÚYHHHÂˆ]ZYÚHLHHLÂˆYˆ
ÚYHZYÚH
HÂˆÛÛ[YNÂˆBˆYˆ
YÙKœ›Ý]H	HNOOH
HÂˆÝÚYZYÚHHÚZYÚÚYNÂˆBˆÛÛœÝÙ^HH	ÝÚY^	ÚZYÚXÂˆÛÛœÝ[žHHÛÝ[Ë™Ù]
Ù^JNÂˆYˆ
[žJHÂˆ[žK˜ÛÝ[
ÊÎÂˆH[ÙHÂˆÛÝ[ËœÙ]
Ù^KÂˆÚYˆZYÚˆÛÝ[ˆBˆJNÂˆBˆBˆYˆ
ÛÝ[ËœÚ^™HOOH
HÂˆÛÛœÝËÚYZYÚHHUT—ÔÒV‘WÓQQPP“ÖÂˆ™]\›ˆÂˆÚYˆZYÚˆNÂˆBˆ]™\ÝH[Âˆ›Üˆ
ÛÛœÝ[žHÙˆÛÝ[Ë˜[Y\Ê
JHÂˆYˆ
X™\Ý[žK˜ÛÝ[ˆ™\Ý˜ÛÝ[[žK˜ÛÝ[OOH™\Ý˜ÛÝ[	‰ˆ[žKÚY
ˆ[žKšZYÚˆ™\ÝÚY
ˆ™\ÝšZYÚ
HÂˆ™\ÝH[žNÂˆBˆBˆ™]\›ˆÂˆÚYˆ™\ÝÚYˆZYÚˆ™\ÝšZYÚˆNÂˆBˆ\Þ[˜ÈÛXZÙR[XYÙTYÙJš]X\YÙTÚ^™JHÂˆÛÛœÝÂˆÚYˆYÙUËˆZYÚˆYÙRˆHHYÙTÚ^™NÂˆÛÛœÝQUSÓPT‘ÒS—ÔUSÈHŒNÂˆÛÛœÝX\™Ú[ˆHYÙUÈ
ˆQUSÓPT‘ÒS—ÔUSÎÂˆÛÛœÝ]˜Z[ÈHX]›X^
KYÙUÈHˆ
ˆX\™Ú[ŠNÂˆÛÛœÝ]˜Z[HX]›X^
KYÙRHˆ
ˆX\™Ú[ŠNÂˆÛÛœÝ\Ý™YˆH\Ë›™]Ô™YÛÝ[ÂˆÛÛœÝÂˆ[XYÙTÝ™X[KˆÛX\ÚÔÝ™X[KˆÚYˆ[YÕËˆZYÚˆ[YÒˆHH]ØZ]Ü™X]R[XYÙJš]X\\Ëž™Y•Ü˜\\‹ÂˆÛÜÙPš]X\ˆYBˆJNÂˆÛÛœÝØØ[HHX]›Z[Š]˜Z[ÈÈ[YÕË]˜Z[È[YÒ
NÂˆÛÛœÝ˜]ÕÈH[YÕÈ
ˆØØ[NÂˆÛÛœÝ˜]ÒH[YÒ
ˆØØ[NÂˆÛÛœÝH
YÙUÈH˜]ÕÊHÈŽÂˆÛÛœÝHH
YÙRH˜]Ò
HÈŽÂˆYˆ
ÛX\ÚÔÝ™X[JHÂˆÛÛœÝÛX\ÚÔ™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–ÜÛX\ÚÔ™Y‹›[WHHÛX\ÚÔÝ™X[NÂˆ[XYÙTÝ™X[K™XÝœÙ]
”ÓX\ÚÈ‹ÛX\ÚÔ™YŠNÂˆBˆÛÛœÝ[XYÙT™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–Ú[XYÙT™Y‹›[WHH[XYÙTÝ™X[NÂˆÛÛœÝØš™XÝXÝH™]ÈXÝ
\Ëž™Y•Ü˜\\ŠNÂˆØš™XÝXÝœÙ]
’[L‹[XYÙT™YŠNÂˆÛÛœÝ™\ÛÝ\˜Ù\ÑXÝH™]ÈXÝ
\Ëž™Y•Ü˜\\ŠNÂˆ™\ÛÝ\˜Ù\ÑXÝœÙ]
–Øš™XÝ‹Øš™XÝXÝ
NÂˆ™\ÛÝ\˜Ù\ÑXÝœÙ]
”›ØÔÙ]‹Ó˜[YK™Ù]
”ˆŠK˜[YK™Ù]
’[XYÙPÈŠWJNÂˆÛÛœÝÛÛ[HH	Û[X™\•ÔÝš[™Ê˜]ÕÊ_H	Û[X™\•ÔÝš[™Ê˜]Ò
_H
È	Û[X™\•ÔÝš[™Ê
_H	Û[X™\•ÔÝš[™ÊJ_HÛHÒ[LÈXÂˆÛÛœÝÛÛ[ÔÝ™X[HH™]ÈÝš[™ÔÝ™X[JÛÛ[™]ÈXÝ
\Ëž™Y•Ü˜\\ŠJNÂˆÛÛœÝÛÛ[Ô™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–ØÛÛ[Ô™Y‹›[WHHÛÛ[ÔÝ™X[NÂˆÛÛœÝYÙT™YˆH\Ë›™]Ô™YŽÂˆÛÛœÝYÙQXÝH\Ëž™Y–ÜYÙT™Y‹›[WHH™]ÈXÝ
\Ëž™Y•Ü˜\\ŠNÂˆYÙQXÝœÙ]Y“˜[YJ•\H‹”YÙHŠNÂˆYÙQXÝœÙ]
“YYXP›Þ‹ÌYÙUËYÙRJNÂˆYÙQXÝœÙ]
”™\ÛÝ\˜Ù\È‹™\ÛÝ\˜Ù\ÑXÝ
NÂˆYÙQXÝœÙ]
ÛÛ[È‹ÛÛ[Ô™YŠNÂˆYˆ
\Ë\ÙSØš™XÝÝ™X[\ÊHÂˆÛÛœÝ™]Ó\Ý™YˆH\Ë›™]Ô™YÛÝ[ÂˆÛÛœÝYÙSØš™XÝ™YœÈH×NÂˆ›Üˆ
]HH\Ý™YŽÈH™]Ó\Ý™YŽÈJÊÊHÂˆÛÛœÝØšˆH\Ëž™Y–ÚWNÂˆYˆ
Øšˆ[œÝ[˜Ù[Ùˆ˜\ÙTÝ™X[JHÂˆÛÛ[YNÂˆBˆYÙSØš™XÝ™YœËœ\Ú
™Y‹™Ù]
K
JNÂˆBˆ›Üˆ
]HHÈHYÙSØš™XÝ™YœË›[™ÝÈH
ÏH™™™ŠHÂˆÛÛœÝØš”Ý™X[T™YˆH\Ë›™]Ô™YŽÂˆ\Ë›Øš”Ý™X[T™YœË˜Y
Øš”Ý™X[T™Y‹›[JNÂˆ\Ëž™Y–ÛØš”Ý™X[T™Y‹›[WHHYÙSØš™XÝ™YœËœÛXÙJKH
È™™™ŠNÂˆBˆBˆ™]\›ˆYÙT™YŽÂˆBˆÛXZÙTYÙU™YJ
HÂˆÛÛœÝÂˆ™]ÔYÙ\ÎˆYÙ\Ëˆ›ÛÝXÝˆYÙ\Ô™Y‹ˆYÙ\ÑXÝˆHH\ÎÂˆ›ÛÝXÝœÙ]
”YÙ\È‹YÙ\Ô™YŠNÂˆYÙ\ÑXÝœÙ]Y“˜[YJ•\H‹”YÙ\ÈŠNÂˆYÙ\ÑXÝœÙ]
ÛÝ[‹YÙ\Ë›[™Ý
NÂˆÛÛœÝX^X]™\ÈH˜[ÙHÈˆPVÓPU‘T×ÔT—ÔQÑT×Ó“ÑNÂˆÛÛœÝÝXÚÈHÞÂˆXÝˆYÙ\ÑXÝˆÚYÎˆYÙ\Ëˆ\™[™YŽˆYÙ\Ô™Y‚ˆWNÂˆÚ[H
ÝXÚË›[™Ýˆ
HÂˆÛÛœÝÂˆXÝˆÚYËˆ\™[™Y‚ˆHHÝXÚËœÜ

NÂˆYˆ
ÚYË›[™ÝHX^X]™\ÊHÂˆXÝœÙ]
’ÚYÈ‹ÚYÊNÂˆ›Üˆ
ÛÛœÝ™YˆÙˆÚYÊHÂˆ\Ëž™Y–Ü™Y‹›[WKœÙ]
”\™[‹\™[™YŠNÂˆBˆÛÛ[YNÂˆBˆÛÛœÝÚ[šÔÚ^™HHX]›X^
X^X]™\ËX]˜ÙZ[
ÚYË›[™ÝÈX^X]™\ÊJNÂˆÛÛœÝÚYÐÚ[šÜÈH×NÂˆ›Üˆ
]HHÈHÚYË›[™ÝÈH
ÏHÚ[šÔÚ^™JHÂˆÚYÐÚ[šÜËœ\Ú
ÚYËœÛXÙJKH
ÈÚ[šÔÚ^™JJNÂˆBˆÛÛœÝÚYÔ™YœÈH×NÂˆXÝœÙ]
’ÚYÈ‹ÚYÔ™YœÊNÂˆ›Üˆ
ÛÛœÝÚ[šÈÙˆÚYÐÚ[šÜÊHÂˆÛÛœÝÚÚY™Y‹ÚYXÝHH\Ë›™]ÑXÝÂˆÚYÔ™YœËœ\Ú
ÚY™YŠNÂˆÚYXÝœÙ]Y“˜[YJ•\H‹”YÙ\ÈŠNÂˆÚYXÝœÙ]
”\™[‹\™[™YŠNÂˆÚYXÝœÙ]
ÛÝ[‹Ú[šË›[™Ý
NÂˆÝXÚËœ\Ú
ÂˆXÝˆÚYXÝˆÚYÎˆÚ[šËˆ\™[™YŽˆÚY™Y‚ˆJNÂˆBˆBˆBˆÛXZÙS˜[YS[U™YJX\\™S˜[Y\ÊHÂˆÛÛœÝ[[šY\ÈHX\œÛÜ
\™S˜[Y\ÈÈ
ÚÙ^PWKÚÙ^P—JHOˆÂˆYˆ
Ù^PHÙ^PŠHÂˆ™]\›ˆLNÂˆBˆYˆ
Ù^PHˆÙ^PŠHÂˆ™]\›ˆNÂˆBˆ™]\›ˆÂˆHˆ
ÚÙ^PWKÚÙ^P—JHOˆÙ^PHHÙ^PŠNÂˆÛÛœÝX^X]™\ÈH˜[ÙHÈˆPVÒS—ÓSQWÕ‘QWÓ“ÑNÂˆÛÛœÝÝ™YT™Y‹™YQXÝHH\Ë›™]ÑXÝÂˆÛÛœÝÝXÚÈHÞÂˆXÝˆ™YQXÝˆ[šY\Îˆ[[šY\Ëˆ\Ô›ÛÝˆYBˆWNÂˆÛÛœÝ˜[YU\HH\™S˜[Y\ÈÈ“˜[Y\Èˆˆ“[\ÈŽÂˆÚ[H
ÝXÚË›[™Ýˆ
HÂˆÛÛœÝÂˆXÝˆ[šY\Ëˆ\Ô›ÛÝˆHHÝXÚËœÜ

NÂˆYˆ
[šY\Ë›[™ÝHX^X]™\ÊHÂˆYˆ
Z\Ô›ÛÝ
HÂˆXÝœÙ]
“[Z]È‹Ù[šY\ÖÌVÌK[šY\Ë˜]
LJVÌWJNÂˆBˆXÝœÙ]
˜[YU\K[šY\Ë™›]

JNÂˆÛÛ[YNÂˆBˆÛÛœÝ[šY\ÐÚ[šÜÈH×NÂˆÛÛœÝÚ[šÔÚ^™HHX]›X^
X^X]™\ËX]˜ÙZ[
[šY\Ë›[™ÝÈX^X]™\ÊJNÂˆ›Üˆ
]HHÈH[šY\Ë›[™ÝÈH
ÏHÚ[šÔÚ^™JHÂˆ[šY\ÐÚ[šÜËœ\Ú
[šY\ËœÛXÙJKH
ÈÚ[šÔÚ^™JJNÂˆBˆÛÛœÝ[šY\Ô™YœÈH×NÂˆXÝœÙ]
’ÚYÈ‹[šY\Ô™YœÊNÂˆ›Üˆ
ÛÛœÝÚ[šÈÙˆ[šY\ÐÚ[šÜÊHÂˆÛÛœÝÙ[šY\Ô™Y‹[šY\ÑXÝHH\Ë›™]ÑXÝÂˆ[šY\Ô™YœËœ\Ú
[šY\Ô™YŠNÂˆ[šY\ÑXÝœÙ]
“[Z]È‹ØÚ[šÖÌVÌKÚ[šË˜]
LJVÌWJNÂˆÝXÚËœ\Ú
ÂˆXÝˆ[šY\ÑXÝˆ[šY\ÎˆÚ[šÂˆJNÂˆBˆBˆ™]\›ˆ™YT™YŽÂˆBˆÛXZÙTYÙSX™[Õ™YJ
HÂˆÛÛœÝÂˆYÙSX™[ÂˆHH\ÎÂˆYˆ
\YÙSX™[ÏË›[™Ý
HÂˆ™]\›ŽÂˆBˆÛÛœÝÂˆ›ÛÝXÝˆHH\ÎÂˆÛÛœÝYÙSX™[Ô™YˆH\ËˆÛXZÙS˜[YS[U™YJ\ËœYÙSX™[Ë˜[ÙJNÂˆ›ÛÝXÝœÙ]
”YÙSX™[È‹YÙSX™[Ô™YŠNÂˆBˆ\Þ[˜ÈØÛÛXÝ[X™YYš[\Ê[ØÝ[Y[]JHÂˆÛÛœÝÂˆ[X™YYš[\ÂˆHH\ÎÂˆ›Üˆ
ÛÛœÝØÝ[Y[]HÙˆ[ØÝ[Y[]JHÂˆÛÛœÝÂˆ[X™YYš[\ÎˆØÑ[X™YYš[\ËˆØÝ[Y[ˆÂˆ™Y‚ˆBˆHHØÝ[Y[]NÂˆYˆ
YØÑ[X™YYš[\ÏËœÚ^™JHÂˆÛÛ[YNÂˆBˆ\Ë˜Ý\œ™[ØÝ[Y[HØÝ[Y[]NÂˆ›Üˆ
ÛÛœÝÚÙ^K˜[YT™Y—HÙˆØÑ[X™YYš[\ÊHÂˆ]˜[YHHÙ^NÂˆYˆ
[X™YYš[\Ëš\Ê˜[YJJHÂˆÛÛœÝ\Ü^S˜[YHHÝš[™ÕÔ”Ýš[™ÊÙ^KYJNÂˆ›Üˆ
]HHNÎÈJÊÊHÂˆÛÛœÝY\YHÝš[™ÕÐ\ØÚZSÜ•UŒM‘J	Ù\Ü^S˜[Y_WÉÚ_X
NÂˆYˆ
Y[X™YYš[\Ëš\ÊY\Y
JHÂˆ˜[YHHY\YÂˆœ™XZÎÂˆBˆBˆBˆ[X™YYš[\ËœÙ]
˜[YK]ØZ]\ËˆØÛÛXÝ\[™[˜ÚY\Ê˜[YT™Y‹YK™YŠJNÂˆBˆ\Ë˜Ý\œ™[ØÝ[Y[H[ÂˆBˆBˆÛXZÙQ[X™YYš[\Õ™YJ
HÂˆÛÛœÝÂˆ[X™YYš[\ÂˆHH\ÎÂˆYˆ
[X™YYš[\ËœÚ^™HOOH
HÂˆ™]\›ŽÂˆBˆYˆ
]\Ë›˜[Y\ÑXÝ
HÂˆÝ\Ë›˜[Y\Ô™Y‹\Ë›˜[Y\ÑXÝHH\Ë›™]ÑXÝÂˆ\Ëœ›ÛÝXÝœÙ]
“˜[Y\È‹\Ë›˜[Y\Ô™YŠNÂˆBˆ\Ë›˜[Y\ÑXÝœÙ]
‘[X™YYš[\È‹\ËˆÛXZÙS˜[YS[U™YJ\œ˜^K™œ›ÛJ[X™YYš[\Ë™[šY\Ê
JKYJJNÂˆBˆÛXZÙQ\Ý[˜][ÛœÕ™YJ
HÂˆÛÛœÝÂˆ˜[YY\Ý[˜][ÛœÂˆHH\ÎÂˆYˆ
˜[YY\Ý[˜][ÛœËœÚ^™HOOH
HÂˆ™]\›ŽÂˆBˆYˆ
]\Ë›˜[Y\ÑXÝ
HÂˆÝ\Ë›˜[Y\Ô™Y‹\Ë›˜[Y\ÑXÝHH\Ë›™]ÑXÝÂˆ\Ëœ›ÛÝXÝœÙ]
“˜[Y\È‹\Ë›˜[Y\Ô™YŠNÂˆBˆ\Ë›˜[Y\ÑXÝœÙ]
‘\ÝÈ‹\ËˆÛXZÙS˜[YS[U™YJ\œ˜^K™œ›ÛJ˜[YY\Ý[˜][ÛœË
Û˜[YK\ÝJHOˆÜÝš[™ÕÐ\ØÚZSÜ•UŒM‘J˜[YJK\ÝJKYJJNÂˆBˆÛXZÙTÝXÝ™YJ
HÂˆÛÛœÝÂˆÝXÝ™YRÚYÂˆHH\ÎÂˆYˆ
\ÝXÝ™YRÚYÏË›[™Ý
HÂˆ™]\›ŽÂˆBˆÛÛœÝÂˆ›ÛÝXÝˆHH\ÎÂˆÛÛœÝÝXÝ™YT™YˆH\Ë›™]Ô™YŽÂˆÛÛœÝÝXÝ™YHH\Ëž™Y–ÜÝXÝ™YT™Y‹›[WHH™]ÈXÝ

NÂˆÝXÝ™YKœÙ]Y“˜[YJ•\H‹”ÝXÝ™YT›ÛÝŠNÂˆÝXÝ™YKœÙ]Y\œ˜^J’È‹ÝXÝ™YRÚYÊNÂˆ›Üˆ
ÛÛœÝÚY™YˆÙˆÝXÝ™YRÚYÊHÂˆÛÛœÝÚYH\Ëž™Y–ÚÚY™Y‹›[WNÂˆÛÛœÝ\HHÚY™Ù]
•\HŠNÂˆYˆ
]\H\Ó˜[YJ\K”ÝXÝ[[HŠJHÂˆÚYœÙ]
”‹ÝXÝ™YT™YŠNÂˆBˆBˆYˆ
\Ëœ\™[™YKœÚ^™Hˆ
HÂˆÛÛœÝ\™[™YT™YˆH\ËˆÛXZÙS˜[YS[U™YJ\œ˜^K™œ›ÛJ\Ëœ\™[™YK™[šY\Ê
JK˜[ÙJNÂˆÛÛœÝ\™[™YHH\Ëž™Y–Ü\™[™YT™Y‹›[WNÂˆ\™[™YKœÙ]Y“˜[YJ•\H‹”\™[™YHŠNÂˆÝXÝ™YKœÙ]
”\™[™YH‹\™[™YT™YŠNÂˆ]™^Ù^HHÂˆ›Üˆ
ÛÛœÝÙ^HÙˆ\Ëœ\™[™YKšÙ^\Ê
JHÂˆ™^Ù^HHX]›X^
™^Ù^KÙ^H
ÈJNÂˆBˆÝXÝ™YKœÙ]
”\™[™YS™^Ù^H‹™^Ù^JNÂˆBˆYˆ
\ËšY™YKœÚ^™Hˆ
HÂˆÛÛœÝY™YT™YˆH\ËˆÛXZÙS˜[YS[U™YJ\œ˜^K™œ›ÛJ\ËšY™YK™[šY\Ê
JKYJNÂˆÛÛœÝY™YHH\Ëž™Y–ÚY™YT™Y‹›[WNÂˆY™YKœÙ]Y“˜[YJ•\H‹’Q™YHŠNÂˆÝXÝ™YKœÙ]
’Q™YH‹Y™YT™YŠNÂˆBˆYˆ
\Ë˜Û\ÜÓX\œÚ^™Hˆ
HÂˆÛÛœÝÛ\ÜÓX\™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–ØÛ\ÜÓX\™Y‹›[WHH\Ë˜Û\ÜÓX\ÂˆÝXÝ™YKœÙ]
Û\ÜÓX\‹Û\ÜÓX\™YŠNÂˆBˆYˆ
\Ëœ›ÛSX\œÚ^™Hˆ
HÂˆÛÛœÝ›ÛSX\™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–Ü›ÛSX\™Y‹›[WHH\Ëœ›ÛSX\ÂˆÝXÝ™YKœÙ]
”›ÛSX\‹›ÛSX\™YŠNÂˆBˆYˆ
\Ë›˜[Y\ÜXÙ\ËœÚ^™Hˆ
HÂˆÛÛœÝ˜[Y\ÜXÙ\Ô™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–Û˜[Y\ÜXÙ\Ô™Y‹›[WHH\œ˜^K™œ›ÛJ\Ë›˜[Y\ÜXÙ\Ë˜[Y\Ê
JNÂˆÝXÝ™YKœÙ]
“˜[Y\ÜXÙ\È‹˜[Y\ÜXÙ\Ô™YŠNÂˆBˆYˆ
\ËœÝXÝ™YPQ‹›[™Ýˆ
HÂˆÛÛœÝÝXÝ™YPQ”™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–ÜÝXÝ™YPQ”™Y‹›[WHH\ËœÝXÝ™YPQŽÂˆÝXÝ™YKœÙ]
Qˆ‹ÝXÝ™YPQ”™YŠNÂˆBˆYˆ
\ËœÝXÝ™YT›Û[˜ÚX][Û“^XÛÛ‹›[™Ýˆ
HÂˆÛÛœÝÝXÝ™YT›Û[˜ÚX][Û“^XÛÛ”™YˆH\Ë›™]Ô™YŽÂˆ\Ëž™Y–ÜÝXÝ™YT›Û[˜ÚX][Û“^XÛÛ”™Y‹›[WHH\ËœÝXÝ™YT›Û[˜ÚX][Û“^XÛÛŽÂˆÝXÝ™YKœÙ]
”›Û[˜ÚX][Û“^XÛÛˆ‹ÝXÝ™YT›Û[˜ÚX][Û“^XÛÛ”™YŠNÂˆBˆ›ÛÝXÝœÙ]
”ÝXÝ™YT›ÛÝ‹ÝXÝ™YT™YŠNÂˆBˆÛXZÙPXÜ›Ñ›Ü›J
HÂˆYˆ
\Ë™šY[Ë›[™ÝOOH
HÂˆ™]\›ŽÂˆBˆÛÛœÝÂˆ›ÛÝXÝˆHH\ÎÂˆÛÛœÝXÜ›Ñ›Ü›T™YˆH\Ë›™]Ô™YŽÂˆÛÛœÝXÜ›Ñ›Ü›HH\Ëž™Y–ØXÜ›Ñ›Ü›T™Y‹›[WHH™]ÈXÝ

NÂˆ›ÛÝXÝœÙ]
XÜ›Ñ›Ü›H‹XÜ›Ñ›Ü›T™YŠNÂˆXÜ›Ñ›Ü›KœÙ]
‘šY[È‹\Ë™šY[ÊNÂˆYˆ
\Ë˜XÜ›Ñ›Ü›S™YY\X\˜[˜Ù\ÊHÂˆXÜ›Ñ›Ü›KœÙ]
“™YY\X\˜[˜Ù\È‹YJNÂˆBˆYˆ
\Ë˜XÜ›Ñ›Ü›TÚYÑ›YÜÈˆ
HÂˆXÜ›Ñ›Ü›KœÙ]
”ÚYÑ›YÜÈ‹\Ë˜XÜ›Ñ›Ü›TÚYÑ›YÜÊNÂˆBˆXÜ›Ñ›Ü›KœÙ]Y\œ˜^JÓÈ‹\Ë˜XÜ›Ñ›Ü›PØ[Ý[][Û“Ü™\ŠNÂˆXÜ›Ñ›Ü›KœÙ]Y‘Yš[™Y
‘ˆ‹\Ë˜XÜ›Ñ›Ü›QY˜][™\ÛÝ\˜Ù\ÊNÂˆYˆ
\Ë˜XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙJHÂˆXÜ›Ñ›Ü›KœÙ]
‘H‹\Ë˜XÜ›Ñ›Ü›QY˜][\X\˜[˜ÙJNÂˆBˆYˆ
\Ë˜XÜ›Ñ›Ü›THˆ
HÂˆXÜ›Ñ›Ü›KœÙ]
”H‹\Ë˜XÜ›Ñ›Ü›TJNÂˆBˆBˆ\Þ[˜ÈÛXZÙT›ÛÝ

HÂˆÛÛœÝÂˆ›ÛÝXÝˆHH\ÎÂˆ›ÛÝXÝœÙ]Y“˜[YJ•\H‹Ø][ÙÈŠNÂˆ›ÛÝXÝœÙ]Y“˜[YJ•™\œÚ[Ûˆ‹\Ë™\œÚ[ÛŠNÂˆ\ËˆÛXZÙPXÜ›Ñ›Ü›J
NÂˆ\ËˆÛXZÙTYÙU™YJ
NÂˆ\ËˆÛXZÙTYÙSX™[Õ™YJ
NÂˆ\ËˆÛXZÙQ[X™YYš[\Õ™YJ
NÂˆ\ËˆÛXZÙQ\Ý[˜][ÛœÕ™YJ
NÂˆ\ËˆÛXZÙTÝXÝ™YJ
NÂˆ]ØZ]\ËˆÛXZÙSÝ][™J
NÂˆBˆÛXZÙR[™›Ê
HÂˆÛÛœÝ[™›ÓX\H™]ÈX\

NÂˆYˆ
\Ëš\ÔÚ[™ÛQš[JHÂˆÛÛœÝš\œÝ™X[YÙHH\Ë›ÛYÙ\Ë™š[™
OˆH\
NÂˆÛÛœÝÂˆ™YŽˆÂˆ˜Z[\‚ˆBˆHHš\œÝ™X[YÙK™ØÝ[Y[]K™ØÝ[Y[ÂˆÛÛœÝÛ[™›ÑXÝH˜Z[\‹™Ù]
’[™›ÈŠNÂˆ›Üˆ
ÛÛœÝÚÙ^K˜[YWHÙˆÛ[™›ÑXÝ×JHÂˆYˆ
\[Ùˆ˜[YHOOHœÝš[™ÈŠHÂˆ[™›ÓX\œÙ]
Ù^KÝš[™ÕÔ”Ýš[™Ê˜[YJJNÂˆBˆBˆBˆ[™›ÓX\™[]J“[Ù]HŠNÂˆ[™›ÓX\œÙ]
Ü™X][Û‘]H‹Ù][ÙYšXØ][Û‘]J
JNÂˆ[™›ÓX\œÙ]
Ü™X]Üˆ‹”‹šœÈŠNÂˆ[™›ÓX\œÙ]
”›ÙXÙ\ˆ‹‘š\™Y›ÞŠNÂˆYˆ
\Ë˜]]ÜŠHÂˆ[™›ÓX\œÙ]
]]Üˆ‹\Ë˜]]ÜŠNÂˆBˆYˆ
\Ë]JHÂˆ[™›ÓX\œÙ]
•]H‹\Ë]JNÂˆBˆ›Üˆ
ÛÛœÝÚÙ^K˜[YWHÙˆ[™›ÓX\
HÂˆ\Ëš[™›ÑXÝœÙ]
Ù^KÝš[™ÕÐ\ØÚZSÜ•UŒM‘J˜[YJJNÂˆBˆ™]\›ˆ[™›ÓX\ÂˆBˆ\Þ[˜ÈÛXZÙQ[˜Üž\

HÂˆYˆ
]\Ëš\ÔÚ[™ÛQš[JHÂˆ™]\›ˆÛ[[[NÂˆBˆÛÛœÝš\œÝ™X[YÙHH\Ë›ÛYÙ\Ë™š[™
OˆH\
NÂˆÛÛœÝÂˆØÝ[Y[]BˆHHš\œÝ™X[YÙNÂˆÛÛœÝÂˆØÝ[Y[ˆÂˆ™YŽˆÂˆ˜Z[\‹ˆ[˜Üž\ˆBˆBˆHHØÝ[Y[]NÂˆYˆ
]˜Z[\‹š\Ê‘[˜Üž\ŠJHÂˆ™]\›ˆÛ[[[NÂˆBˆÛÛœÝ[˜Üž\XÝH˜Z[\‹™Ù]
‘[˜Üž\ŠNÂˆYˆ
J[˜Üž\XÝ[œÝ[˜Ù[ÙˆXÝ
JHÂˆ™]\›ˆÛ[[[NÂˆBˆ\Ë˜Ý\œ™[ØÝ[Y[HØÝ[Y[]NÂˆÛÛœÝ™\Ý[HØ]ØZ]\ËˆØÛÛ™SØš™XÝ
[˜Üž\XÝ˜Z[\‹ž™YŠK[˜Üž\˜Z[\‹™Ù]
’QŠWNÂˆ\Ë˜Ý\œ™[ØÝ[Y[H[Âˆ™]\›ˆ™\Ý[ÂˆBˆ\Þ[˜ÈØÜ™X]PÚ[™Ù\Ê
HÂˆÛÛœÝÚ[™Ù\ÈH™]È™Y“X\

NÂˆÚ[™Ù\Ëœ]
™Y‹™Ù]
™™™ŠKÂˆ]Nˆ[ˆJNÂˆ›Üˆ
]HHKZHH\Ëž™Y‹›[™ÝÈHZNÈJÊÊHÂˆYˆ
\Ë›Øš”Ý™X[T™YœÏËš\ÊJJHÂˆ]ØZ]\ËˆØÜ™X]SØš™XÝÝ™X[J™Y‹™Ù]
K
K\Ëž™Y–ÚWKÚ[™Ù\ÊNÂˆH[ÙHÂˆÚ[™Ù\Ëœ]
™Y‹™Ù]
K
KÂˆ]Nˆ\Ëž™Y–ÚWBˆJNÂˆBˆBˆ™]\›ˆØÚ[™Ù\Ë\Ë›™]Ô™Y—NÂˆBˆ\Þ[˜ÈØÜ™X]SØš™XÝÝ™X[JØš”Ý™X[T™Y‹Øš”™YœËÚ[™Ù\ÊHÂˆÛÛœÝÝ™X[PY™™\ˆHÈˆ—NÂˆÛÛœÝØš“Ù™œÙ]ÈH×NÂˆ]Ù™œÙ]HÂˆÛÛœÝY™™\ˆH×NÂˆ›Üˆ
]HHZHHØš”™YœË›[™ÝÈHZNÈJÊÊHÂˆÛÛœÝØš”™YˆHØš”™YœÖÚWNÂˆÚ[™Ù\Ëœ]
Øš”™Y‹Âˆ]Nˆ[ˆØš”Ý™X[T™Y‹ˆ[™^ˆBˆJNÂˆØš“Ù™œÙ]Ëœ\Ú
	ÛØš”™Y‹›[_H	ÛÙ™œÙ]X
NÂˆÛÛœÝ]HH\Ëž™Y–ÛØš”™Y‹›[WNÂˆ]ØZ]Üš]U˜[YJ]KY™™\‹[
NÂˆÛÛœÝØšˆHY™™\‹š›Ú[ŠˆŠNÂˆY™™\‹›[™ÝHÂˆÝ™X[PY™™\‹œ\Ú
ØšŠNÂˆÙ™œÙ]
ÏHØš‹›[™Ý
ÈNÂˆBˆÝ™X[PY™™\–ÌHHØš“Ù™œÙ]Ëš›Ú[Š—ˆŠNÂˆÛÛœÝXÝH™]ÈXÝ

NÂˆXÝœÙ]Y“˜[YJ•\H‹“Øš”ÝHŠNÂˆXÝœÙ]
“ˆ‹Øš”™YœË›[™Ý
NÂˆXÝœÙ]
‘š\œÝ‹Ý™X[PY™™\–ÌK›[™Ý
ÈJNÂˆÛÛœÝØš”Ý™X[HH™]ÈÝš[™ÔÝ™X[JÝ™X[PY™™\‹š›Ú[Š—ˆŠKXÝ
NÂˆÚ[™Ù\Ëœ]
Øš”Ý™X[T™Y‹Âˆ]NˆØš”Ý™X[BˆJNÂˆBˆ\Þ[˜ÈÜš]TŠ
HÂˆ]ØZ]\ËˆÛXZÙT›ÛÝ

NÂˆÛÛœÝ[™›ÓX\H\ËˆÛXZÙR[™›Ê
NÂˆÛÛœÝÙ[˜Üž\™Y‹[˜Üž\š[RY×HH]ØZ]\ËˆÛXZÙQ[˜Üž\

NÂˆÛÛœÝØÚ[™Ù\Ë™Y•X›T™Y—HH]ØZ]\ËˆØÜ™X]PÚ[™Ù\Ê
NÂˆÛÛœÝXY\ˆHÝš[™ÕÐž]\Ê	T‹IÝ\Ë™\œÚ[ÛŸW‰W˜WW˜WÙX
NÂˆ™]\›ˆ[˜Ü™[Y[[\]JÂˆÜšYÚ[˜[]NˆXY\‹ˆÚ[™Ù\Ëˆ™Y’[™›ÎˆÂˆÝ\™YŽˆ[ˆ›ÛÝ™YŽˆ\Ëœ›ÛÝ™Y‹ˆ[™›Ô™YŽˆ\Ëš[™›Ô™Y‹ˆ[˜Üž\™Y‹ˆ™]Ô™YŽˆ™Y•X›T™Y‹ˆš[RYÎˆš[RYÈÛ[[Kˆ[™›ÓX\ˆKˆ\ÙV™Y”Ý™X[Nˆ\Ë\ÙSØš™XÝÝ™X[\Ëˆ™YŽˆÂˆ[˜Üž\ˆ[˜Üž\™Y‚ˆBˆJNÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËÜÚ\™YØ˜\ÙWÜ—ÜÝ™X[KšœÂ‚˜Û\ÜÈ˜\ÙT”Ý™X[HÂˆÔ”Ý™X[T™XY\ˆH[ÂˆÔ”Ý™X[T˜[™ÙT™XY\ˆH[ÂˆÙ[™XY\ˆH[ÂˆÜ˜[™ÙT™XY\œÈH™]ÈÙ]

NÂˆÜÛÝ\˜ÙHH[ÂˆÛÛœÝXÝÜŠÛÝ\˜ÙK”Ý™X[T™XY\‹”Ý™X[T˜[™ÙT™XY\ŠHÂˆ\Ë—ÜÛÝ\˜ÙHHÛÝ\˜ÙNÂˆ\ËˆÔ”Ý™X[T™XY\ˆH”Ý™X[T™XY\ŽÂˆ\ËˆÔ”Ý™X[T˜[™ÙT™XY\ˆH”Ý™X[T˜[™ÙT™XY\ŽÂˆBˆÙ]Ü›ÙÜ™\ÜÚ]™Q]S[™Ý

HÂˆ™]\›ˆ\Ë—Ù[™XY\Ë—ÛØYYÏÈÂˆBˆÙ][™XY\Š
HÂˆ\ÜÙ\
]\Ë—Ù[™XY\‹˜\ÙT”Ý™X[K™Ù][™XY\ˆØ[ˆÛ›H™HØ[YÛ˜ÙKˆŠNÂˆ™]\›ˆ\Ë—Ù[™XY\ˆH™]È\ËˆÔ”Ý™X[T™XY\Š\ÊNÂˆBˆÙ]˜[™ÙT™XY\Š™YÚ[‹[™
HÂˆYˆ
[™H\Ë—Ü›ÙÜ™\ÜÚ]™Q]S[™Ý
HÂˆ™]\›ˆ[ÂˆBˆÛÛœÝ™XY\ˆH™]È\ËˆÔ”Ý™X[T˜[™ÙT™XY\Š\Ë™YÚ[‹[™
NÂˆ\Ë—Ü˜[™ÙT™XY\œË˜Y
™XY\ŠNÂˆ™]\›ˆ™XY\ŽÂˆBˆØ[˜Ù[[™\]Y\ÝÊ™X\ÛÛŠHÂˆ\Ë—Ù[™XY\Ë˜Ø[˜Ù[
™X\ÛÛŠNÂˆ›Üˆ
ÛÛœÝ™XY\ˆÙˆ™]ÈÙ]
\Ë—Ü˜[™ÙT™XY\œÊJHÂˆ™XY\‹˜Ø[˜Ù[
™X\ÛÛŠNÂˆBˆBŸB˜Û\ÜÈ˜\ÙT”Ý™X[T™XY\ˆÂˆÛ”›ÙÜ™\ÜÈH[ÂˆØÛÛ[[™ÝHÂˆÙš[[˜[YHH[ÂˆÚXY\œÐØ\Xš[]HH›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
NÂˆÚ\Ô˜[™ÙTÝ\ÜYH˜[ÙNÂˆÚ\ÔÝ™X[Z[™ÔÝ\ÜYH˜[ÙNÂˆÛØYYHÂˆÜÝ™X[HH[ÂˆÛÛœÝXÝÜŠÝ™X[JHÂˆ\Ë—ÜÝ™X[HHÝ™X[NÂˆBˆØØ[Û”›ÙÜ™\ÜÊ
HÂˆ\Ë›Û”›ÙÜ™\ÜÏËŠÂˆØYYˆ\Ë—ÛØYYˆÝ[ˆ\Ë—ØÛÛ[[™ÝˆJNÂˆBˆÙ]XY\œÔ™XYJ
HÂˆ™]\›ˆ\Ë—ÚXY\œÐØ\Xš[]Kœ›ÛZ\ÙNÂˆBˆÙ]š[[˜[YJ
HÂˆ™]\›ˆ\Ë—Ùš[[˜[YNÂˆBˆÙ]ÛÛ[[™Ý

HÂˆ™]\›ˆ\Ë—ØÛÛ[[™ÝÂˆBˆÙ]\Ô˜[™ÙTÝ\ÜY

HÂˆ™]\›ˆ\Ë—Ú\Ô˜[™ÙTÝ\ÜYÂˆBˆÙ]\ÔÝ™X[Z[™ÔÝ\ÜY

HÂˆ™]\›ˆ\Ë—Ú\ÔÝ™X[Z[™ÔÝ\ÜYÂˆBˆ\Þ[˜È™XY

HÂˆ[œ™XXÚX›JXœÝ˜XÝY]Ù™XYØ[YŠNÂˆBˆØ[˜Ù[
™X\ÛÛŠHÂˆ[œ™XXÚX›JXœÝ˜XÝY]ÙØ[˜Ù[Ø[YŠNÂˆBŸB˜Û\ÜÈ˜\ÙT”Ý™X[T˜[™ÙT™XY\ˆÂˆÜÝ™X[HH[ÂˆÛÛœÝXÝÜŠÝ™X[K™YÚ[‹[™
HÂˆ\Ë—ÜÝ™X[HHÝ™X[NÂˆBˆ\Þ[˜È™XY

HÂˆ[œ™XXÚX›JXœÝ˜XÝY]Ù™XYØ[YŠNÂˆBˆØ[˜Ù[
™X\ÛÛŠHÂˆ[œ™XXÚX›JXœÝ˜XÝY]ÙØ[˜Ù[Ø[YŠNÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÝÛÜšÙ\—ÜÝ™X[KšœÂ‚˜Û\ÜÈ•ÛÜšÙ\”Ý™X[H^[™È˜\ÙT”Ý™X[HÂˆÛÛœÝXÝÜŠÛÝ\˜ÙJHÂˆÝ\\ŠÛÝ\˜ÙK•ÛÜšÙ\”Ý™X[T™XY\‹•ÛÜšÙ\”Ý™X[T˜[™ÙT™XY\ŠNÂˆBŸB˜Û\ÜÈ•ÛÜšÙ\”Ý™X[T™XY\ˆ^[™È˜\ÙT”Ý™X[T™XY\ˆÂˆÜ™XY\ˆH[ÂˆÛÛœÝXÝÜŠÝ™X[JHÂˆÝ\\ŠÝ™X[JNÂˆÛÛœÝÂˆ\ÙÒ[™\‚ˆHHÝ™X[K—ÜÛÝ\˜ÙNÂˆÛÛœÝ™XYX›TÝ™X[HH\ÙÒ[™\‹œÙ[™Ú]Ý™X[J‘Ù]™XY\ˆŠNÂˆ\Ë—Ü™XY\ˆH™XYX›TÝ™X[K™Ù]™XY\Š
NÂˆ\ÙÒ[™\‹œÙ[™Ú]›ÛZ\ÙJ”™XY\’XY\œÔ™XYHŠK[Š]HOˆÂˆ\Ë—ØÛÛ[[™ÝH]K˜ÛÛ[[™ÝÂˆ\Ë—Ú\ÔÝ™X[Z[™ÔÝ\ÜYH]Kš\ÔÝ™X[Z[™ÔÝ\ÜYÂˆ\Ë—Ú\Ô˜[™ÙTÝ\ÜYH]Kš\Ô˜[™ÙTÝ\ÜYÂˆ\Ë—ÚXY\œÐØ\Xš[]Kœ™\ÛÛ™J
NÂˆK\Ë—ÚXY\œÐØ\Xš[]Kœ™Z™XÝ
NÂˆBˆ\Þ[˜È™XY

HÂˆÛÛœÝÂˆ˜[YKˆÛ™BˆHH]ØZ]\Ë—Ü™XY\‹œ™XY

NÂˆYˆ
Û™JHÂˆ™]\›ˆÂˆ˜[YNˆ[™Yš[™YˆÛ™NˆYBˆNÂˆBˆ™]\›ˆÂˆ˜[YNˆ˜[YK˜Y™™\‹ˆÛ™Nˆ˜[ÙBˆNÂˆBˆØ[˜Ù[
™X\ÛÛŠHÂˆ\Ë—Ü™XY\‹˜Ø[˜Ù[
™X\ÛÛŠNÂˆBŸB˜Û\ÜÈ•ÛÜšÙ\”Ý™X[T˜[™ÙT™XY\ˆ^[™È˜\ÙT”Ý™X[T˜[™ÙT™XY\ˆÂˆÜ™XY\ˆH[ÂˆÛÛœÝXÝÜŠÝ™X[K™YÚ[‹[™
HÂˆÝ\\ŠÝ™X[K™YÚ[‹[™
NÂˆÛÛœÝÂˆ\ÙÒ[™\‚ˆHHÝ™X[K—ÜÛÝ\˜ÙNÂˆÛÛœÝ™XYX›TÝ™X[HH\ÙÒ[™\‹œÙ[™Ú]Ý™X[J‘Ù]˜[™ÙT™XY\ˆ‹Âˆ™YÚ[‹ˆ[™ˆJNÂˆ\Ë—Ü™XY\ˆH™XYX›TÝ™X[K™Ù]™XY\Š
NÂˆBˆ\Þ[˜È™XY

HÂˆÛÛœÝÂˆ˜[YKˆÛ™BˆHH]ØZ]\Ë—Ü™XY\‹œ™XY

NÂˆYˆ
Û™JHÂˆ™]\›ˆÂˆ˜[YNˆ[™Yš[™YˆÛ™NˆYBˆNÂˆBˆ™]\›ˆÂˆ˜[YNˆ˜[YK˜Y™™\‹ˆÛ™Nˆ˜[ÙBˆNÂˆBˆØ[˜Ù[
™X\ÛÛŠHÂˆ\Ë—Ü™XY\‹˜Ø[˜Ù[
™X\ÛÛŠNÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËØÛÜ™KÝÛÜšÙ\‹šœÂ‚‚‚‚‚‚‚‚‚‚‚‚˜Û\ÜÈÛÜšÙ\•\ÚÈÂˆØØ\Xš[]HH›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
NÂˆ\›Z[˜]YH˜[ÙNÂˆÛÛœÝXÝÜŠ˜[YJHÂˆ\Ë›˜[YHH˜[YNÂˆBˆÙ]š[š\ÚY

HÂˆ™]\›ˆ\ËˆØØ\Xš[]Kœ›ÛZ\ÙNÂˆBˆš[š\Ú

HÂˆ\ËˆØØ\Xš[]Kœ™\ÛÛ™J
NÂˆBˆ\›Z[˜]J
HÂˆ\Ë\›Z[˜]YHYNÂˆBˆ[œÝ\™S›Ý\›Z[˜]Y

HÂˆYˆ
\Ë\›Z[˜]Y
HÂˆ›ÝÈ™]È\œ›ÜŠ•ÛÜšÙ\ˆ\ÚÈØ\È\›Z[˜]YŠNÂˆBˆBŸB˜Û\ÜÈÛÜšÙ\“Y\ÜØYÙR[™\ˆÂˆÝ]XÈÂˆYˆ
\[ÙˆÚ[™ÝÈOOH[™Yš[™Yˆ	‰ˆZ\Ó›ÙR”È	‰ˆ\[ÙˆÙ[ˆOOH[™Yš[™Yˆ	‰ˆ\[ÙˆÙ[‹œÜÝY\ÜØYÙHOOH™[˜Ý[Ûˆˆ	‰ˆ›Û›Y\ÜØYÙHˆ[ˆÙ[ŠHÂˆ\Ëš[š]X[^™Qœ›ÛTÜ
Ù[ŠNÂˆBˆBˆÝ]XÈÙ]\
[™\‹Ü
HÂˆ]\ÝY\ÜØYÙT›ØÙ\ÜÙYH˜[ÙNÂˆ[™\‹›ÛŠ\Ý‹]HOˆÂˆYˆ
\ÝY\ÜØYÙT›ØÙ\ÜÙY
HÂˆ™]\›ŽÂˆBˆ\ÝY\ÜØYÙT›ØÙ\ÜÙYHYNÂˆ[™\‹œÙ[™
\Ý‹]H[œÝ[˜Ù[ÙˆZ[\œ˜^JNÂˆJNÂˆ[™\‹›ÛŠ˜ÛÛ™šYÝ\™H‹]HOˆÂˆÙ]™\˜›ÜÚ]S]™[
]K™\˜›ÜÚ]JNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]ØÔ™\]Y\Ý‹]HOˆ\Ë˜Ü™X]QØÝ[Y[[™\Š]KÜ
JNÂˆBˆÝ]XÈÜ™X]QØÝ[Y[[™\ŠØÔ\˜[\ËÜ
HÂˆ]“X[˜YÙ\ŽÂˆ]\›Z[˜]YH˜[ÙNÂˆ]Ø[˜Ù[œÈH[ÂˆÛÛœÝÛÜšÙ\•\ÚÜÈH™]ÈÙ]

NÂˆÛÛœÝ™\˜›ÜÚ]HHÙ]™\˜›ÜÚ]S]™[

NÂˆÛÛœÝÂˆØÒYˆ\U™\œÚ[Û‚ˆHHØÔ\˜[\ÎÂˆÛÛœÝÛÜšÙ\•™\œÚ[ÛˆH‹ŒËŒŽHŽÂˆYˆ
\U™\œÚ[ÛˆOOHÛÜšÙ\•™\œÚ[ÛŠHÂˆ›ÝÈ™]È\œ›ÜŠHTH™\œÚ[Ûˆ‰Ø\U™\œÚ[ÛŸHˆÙ\È›ÝX]Ú
ÈHÛÜšÙ\ˆ™\œÚ[Ûˆ‰ÝÛÜšÙ\•™\œÚ[ÛŸH‹˜
NÂˆBˆÛÛœÝZ[\ÙÈH
\K›Ü
HOˆH	Ý\_Kœ›ÝÝ\WÛÛZ[œÈ[™^XÝY[[Y\˜X›H›Ü\H
È‰Ü›ÜH‹\Èœ™XZÚ[™ÈK™Ëˆ›Ü‹‹‹š[—]\˜][ÛˆÙˆ	Ý\_\Ë˜Âˆ›Üˆ
ÛÛœÝ›Ü[ˆßJHÂˆ›ÝÈ™]È\œ›ÜŠZ[\ÙÊ“Øš™XÝ‹›Ü
JNÂˆBˆ›Üˆ
ÛÛœÝ›Ü[ˆ×JHÂˆ›ÝÈ™]È\œ›ÜŠZ[\ÙÊ\œ˜^H‹›Ü
JNÂˆBˆÛÛœÝÛÜšÙ\’[™\“˜[YHHØÒY
È—ÝÛÜšÙ\ˆŽÂˆ][™\ˆH™]ÈY\ÜØYÙR[™\ŠÛÜšÙ\’[™\“˜[YKØÒYÜ
NÂˆ[˜Ý[Ûˆ[œÝ\™S›Ý\›Z[˜]Y

HÂˆYˆ
\›Z[˜]Y
HÂˆ›ÝÈ™]È\œ›ÜŠ•ÛÜšÙ\ˆØ\È\›Z[˜]YŠNÂˆBˆBˆ[˜Ý[ÛˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊHÂˆÛÜšÙ\•\ÚÜË˜Y
\ÚÊNÂˆBˆ[˜Ý[Ûˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊHÂˆ\ÚË™š[š\Ú

NÂˆÛÜšÙ\•\ÚÜË™[]J\ÚÊNÂˆBˆ\Þ[˜È[˜Ý[ÛˆØYØÝ[Y[
™XÛÝ™\žS[ÙJHÂˆ]ØZ]“X[˜YÙ\‹š[š]ØÝ[Y[
™XÛÝ™\žS[ÙJNÂˆÛÛœÝ\Ô\™V˜HH]ØZ]“X[˜YÙ\‹™[œÝ\™QØÊš\Ô\™V˜HŠNÂˆYˆ
\Ô\™V˜JHÂˆÛÛœÝ\ÚÈH™]ÈÛÜšÙ\•\ÚÊ›ØY˜T™\ÛÝ\˜Ù\ÈŠNÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆ]ØZ]“X[˜YÙ\‹™[œÝ\™QØÊ›ØY˜T™\ÛÝ\˜Ù\È‹Ú[™\‹\Ú×JNÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆBˆÛÛœÝÛ[TYÙ\Ëš[™Ù\œš[×HH]ØZ]›ÛZ\ÙK˜[
Ü“X[˜YÙ\‹™[œÝ\™QØÊ›[TYÙ\ÈŠK“X[˜YÙ\‹™[œÝ\™QØÊ™š[™Ù\œš[ÈŠWJNÂˆÛÛœÝ[›Ü–˜HH\Ô\™V˜HÈ]ØZ]“X[˜YÙ\‹™[œÝ\™QØÊš[›Ü–˜HŠHˆ[Âˆ™]\›ˆÂˆ[TYÙ\Ëˆš[™Ù\œš[Ëˆ[›Ü–˜BˆNÂˆBˆ\Þ[˜È[˜Ý[ÛˆÙ]“X[˜YÙ\ŠÂˆ]Kˆ\ÜÝÛÜ™ˆ\ØX›P]]Ñ™]Úˆ˜[™ÙPÚ[šÔÚ^™KˆØÐ˜\ÙU\›ˆ[˜X›V˜Kˆ]˜[X]Ü“Ü[ÛœÂˆJHÂˆÛÛœÝ“X[˜YÙ\\™ÜÈHÂˆÛÝ\˜ÙNˆ[ˆ\ØX›P]]Ñ™]ÚˆØÐ˜\ÙU\›ˆØÒYˆ[˜X›V˜Kˆ]˜[X]Ü“Ü[ÛœËˆ[™\‹ˆ[™Ýˆˆ\ÜÝÛÜ™ˆ˜[™ÙPÚ[šÔÚ^™BˆNÂˆYˆ
]JHÂˆ“X[˜YÙ\\™ÜËœÛÝ\˜ÙHH]NÂˆ™]\›ˆ™]ÈØØ[“X[˜YÙ\Š“X[˜YÙ\\™ÜÊNÂˆBˆÛÛœÝ”Ý™X[HH™]È•ÛÜšÙ\”Ý™X[JÂˆ\ÙÒ[™\Žˆ[™\‚ˆJKˆ[™XY\ˆH”Ý™X[K™Ù][™XY\Š
NÂˆÛÛœÝÂˆ›ÛZ\ÙKˆ™\ÛÛ™Kˆ™Z™XÝˆHH›ÛZ\ÙKÚ]™\ÛÛ™\œÊ
NÂˆ]™]Ô“X[˜YÙ\‹ˆØXÚYÚ[šÜÈH×NÂˆØ[˜Ù[œÈH™X\ÛÛˆOˆ”Ý™X[K˜Ø[˜Ù[[™\]Y\ÝÊ™X\ÛÛŠNÂˆ[™XY\‹šXY\œÔ™XYK[Š

HOˆÂˆYˆ
Y[™XY\‹š\Ô˜[™ÙTÝ\ÜY
HÂˆ™]\›ŽÂˆBˆ“X[˜YÙ\\™ÜËœÛÝ\˜ÙHH”Ý™X[NÂˆ“X[˜YÙ\\™ÜË›[™ÝH[™XY\‹˜ÛÛ[[™ÝÂˆ“X[˜YÙ\\™ÜË™\ØX›P]]Ñ™]ÚH[™XY\‹š\ÔÝ™X[Z[™ÔÝ\ÜYÂˆ™]Ô“X[˜YÙ\ˆH™]È™]ÛÜšÔ“X[˜YÙ\Š“X[˜YÙ\\™ÜÊNÂˆ›Üˆ
ÛÛœÝÚ[šÈÙˆØXÚYÚ[šÜÊHÂˆ™]Ô“X[˜YÙ\‹œÙ[™›ÙÜ™\ÜÚ]™Q]JÚ[šÊNÂˆBˆØXÚYÚ[šÜÈH[Âˆ™\ÛÛ™J™]Ô“X[˜YÙ\ŠNÂˆØ[˜Ù[œÈH[ÂˆJK˜Ø]Ú
™X\ÛÛˆOˆÂˆ™Z™XÝ
™X\ÛÛŠNÂˆØ[˜Ù[œÈH[ÂˆJNÂˆ\Þ[˜È[˜Ý[Ûˆ™XY]J
HÂˆ]ØYYHÂˆÚ[H
YJHÂˆÛÛœÝÂˆ˜[YKˆÛ™BˆHH]ØZ][™XY\‹œ™XY

NÂˆ[œÝ\™S›Ý\›Z[˜]Y

NÂˆYˆ
Û™JHÂˆœ™XZÎÂˆBˆØYY
ÏH˜[YK˜ž]S[™ÝÂˆYˆ
Y[™XY\‹š\ÔÝ™X[Z[™ÔÝ\ÜY
HÂˆ[™\‹œÙ[™
‘ØÔ›ÙÜ™\ÜÈ‹ÂˆØYYˆÝ[ˆ[™XY\‹˜ÛÛ[[™ÝˆJNÂˆBˆYˆ
™]Ô“X[˜YÙ\ŠHÂˆ™]Ô“X[˜YÙ\‹œÙ[™›ÙÜ™\ÜÚ]™Q]J˜[YJNÂˆH[ÙHÂˆØXÚYÚ[šÜËœ\Ú
˜[YJNÂˆBˆBˆYˆ
[™]Ô“X[˜YÙ\ŠHÂˆ“X[˜YÙ\\™ÜËœÛÝ\˜ÙHH\œ˜^PY™™\œÕÐž]\ÊØXÚYÚ[šÜÊNÂˆØXÚYÚ[šÜÈH[Âˆ™]Ô“X[˜YÙ\ˆH™]ÈØØ[“X[˜YÙ\Š“X[˜YÙ\\™ÜÊNÂˆ™\ÛÛ™J™]Ô“X[˜YÙ\ŠNÂˆBˆØ[˜Ù[œÈH[ÂˆBˆ™XY]J
K˜Ø]Ú
™X\ÛÛˆOˆÂˆ™Z™XÝ
™X\ÛÛŠNÂˆØ[˜Ù[œÈH[ÂˆJNÂˆ™]\›ˆ›ÛZ\ÙNÂˆBˆ\Þ[˜È[˜Ý[ÛˆÙ]\ÜÝÛÜ™
^
HÂˆÛÛœÝ\ÚÈH™]ÈÛÜšÙ\•\ÚÊ\ÜÝÛÜ™^Ù\[ÛŽˆ™\ÜÛœÙH	Ù^˜ÛÙ_X
NÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆžHÂˆÛÛœÝ™\ÈH]ØZ][™\‹œÙ[™Ú]›ÛZ\ÙJ”\ÜÝÛÜ™™\]Y\Ý‹^
NÂˆ™]\›ˆ™\Ëœ\ÜÝÛÜ™ÂˆHš[˜[HÂˆ›ÛZ\ÙKœ™\ÛÛ™J
K[Š

HOˆÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆJNÂˆBˆBˆ[˜Ý[ÛˆÙ]\ØÊ]JHÂˆ[˜Ý[ÛˆÛ”ÝXØÙ\ÜÊØÊHÂˆ[œÝ\™S›Ý\›Z[˜]Y

NÂˆ[™\‹œÙ[™
‘Ù]ØÈ‹Âˆ’[™›ÎˆØÂˆJNÂˆBˆ[˜Ý[ÛˆÛ‘˜Z[\™J^
HÂˆYˆ
\›Z[˜]Y
HÂˆ™]\›ŽÂˆBˆYˆ
^[œÝ[˜Ù[Ùˆ\ÜÝÛÜ™^Ù\[ÛŠHÂˆÙ]\ÜÝÛÜ™
^
K[Š\ÜÝÛÜ™OˆÂˆ“X[˜YÙ\‹\]T\ÜÝÛÜ™
\ÜÝÛÜ™
NÂˆ“X[˜YÙ\”™XYJ
NÂˆJK˜Ø]Ú


HOˆÂˆ[™\‹œÙ[™
‘ØÑ^Ù\[Ûˆ‹^
NÂˆJNÂˆH[ÙHÂˆ[™\‹œÙ[™
‘ØÑ^Ù\[Ûˆ‹Ü˜\™X\ÛÛŠ^
JNÂˆBˆBˆ[˜Ý[Ûˆ“X[˜YÙ\”™XYJ
HÂˆ[œÝ\™S›Ý\›Z[˜]Y

NÂˆØYØÝ[Y[
˜[ÙJK[ŠÛ”ÝXØÙ\ÜË[˜Ý[Ûˆ
™X\ÛÛŠHÂˆ[œÝ\™S›Ý\›Z[˜]Y

NÂˆYˆ
J™X\ÛÛˆ[œÝ[˜Ù[Ùˆ™Y”\œÙQ^Ù\[ÛŠJHÂˆÛ‘˜Z[\™J™X\ÛÛŠNÂˆ™]\›ŽÂˆBˆ“X[˜YÙ\‹œ™\]Y\ÝØYYÝ™X[J
K[Š[˜Ý[Ûˆ

HÂˆ[œÝ\™S›Ý\›Z[˜]Y

NÂˆØYØÝ[Y[
YJK[ŠÛ”ÝXØÙ\ÜËÛ‘˜Z[\™JNÂˆKÛ‘˜Z[\™JNÂˆJNÂˆBˆ[œÝ\™S›Ý\›Z[˜]Y

NÂˆÙ]“X[˜YÙ\Š]JK[Š[˜Ý[Ûˆ
™]Ô“X[˜YÙ\ŠHÂˆYˆ
\›Z[˜]Y
HÂˆ™]Ô“X[˜YÙ\‹\›Z[˜]J™]ÈX›Ü^Ù\[ÛŠ•ÛÜšÙ\ˆØ\È\›Z[˜]YˆŠJNÂˆ›ÝÈ™]È\œ›ÜŠ•ÛÜšÙ\ˆØ\È\›Z[˜]YŠNÂˆBˆ“X[˜YÙ\ˆH™]Ô“X[˜YÙ\ŽÂˆ“X[˜YÙ\‹œ™\]Y\ÝØYYÝ™X[JYJK[ŠÝ™X[HOˆÂˆ[™\‹œÙ[™
‘]SØYY‹Âˆ[™ÝˆÝ™X[K˜ž]\Ë˜ž]S[™ÝˆJNÂˆK

HOˆßJNÂˆJK[Š“X[˜YÙ\”™XYKÛ‘˜Z[\™JNÂˆBˆ[™\‹›ÛŠ‘Ù]YÙH‹\Þ[˜È[˜Ý[Ûˆ
ÂˆYÙR[™^ˆJHÂˆÛÛœÝYÙHH]ØZ]“X[˜YÙ\‹™Ù]YÙJYÙR[™^
NÂˆÛÛœÝÜ›Ý]K™Y‹\Ù\•[š]šY]×HH]ØZ]›ÛZ\ÙK˜[
Ü“X[˜YÙ\‹™[œÝ\™JYÙKœ›Ý]HŠK“X[˜YÙ\‹™[œÝ\™JYÙKœ™YˆŠK“X[˜YÙ\‹™[œÝ\™JYÙK\Ù\•[š]ŠK“X[˜YÙ\‹™[œÝ\™JYÙKšY]ÈŠWJNÂˆ™]\›ˆÂˆ›Ý]Kˆ™Y‹ˆ™Y”ÝŽˆ™YËÔÝš[™Ê
HÏÈ[ˆ\Ù\•[š]ˆšY]ÂˆNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]YÙR[™^‹[˜Ý[Ûˆ
Âˆ[KˆÙ[‚ˆJHÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ™Ù]YÙR[™^‹Ô™Y‹™Ù]
[KÙ[ŠWJNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]\Ý[˜][ÛœÈ‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ™\Ý[˜][ÛœÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]\Ý[˜][Ûˆ‹[˜Ý[Ûˆ
ÂˆYˆJHÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ™Ù]\Ý[˜][Ûˆ‹ÚYJNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]YÙSX™[È‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœYÙSX™[ÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]YÙS^[Ý]‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœYÙS^[Ý]ŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]YÙS[ÙH‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœYÙS[ÙHŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]šY]Ù\”™Y™\™[˜Ù\È‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊšY]Ù\”™Y™\™[˜Ù\ÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]Ü[XÝ[Ûˆ‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ›Ü[XÝ[ÛˆŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]]XÚY[È‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ˜]XÚY[ÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]]XÚY[ÛÛ[‹\Þ[˜È[˜Ý[Ûˆ
Y
HÂˆ]\ÜÝÛÜ™^ÂˆÚ[H
YJHÂˆÛÛœÝ\ÜÝÛÜ™H\ÜÝÛÜ™^È]ØZ]Ù]\ÜÝÛÜ™
\ÜÝÛÜ™^
Hˆ[ÂˆžHÂˆYˆ
\ÜÝÛÜ™
HÂˆ“X[˜YÙ\‹\]T\ÜÝÛÜ™
\ÜÝÛÜ™
NÂˆBˆ™]\›ˆ]ØZ]“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ˜]XÚY[ÛÛ[‹ÚYJNÂˆHØ]Ú
^
HÂˆYˆ
^[œÝ[˜Ù[Ùˆ\ÜÝÛÜ™^Ù\[ÛŠHÂˆ\ÜÝÛÜ™^H^ÂˆÛÛ[YNÂˆBˆ›ÝÈ^ÂˆBˆBˆJNÂˆ[™\‹›ÛŠ‘Ù]ØÒ”ÐXÝ[ÛœÈ‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊšœÐXÝ[ÛœÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]YÙR”ÐXÝ[ÛœÈ‹\Þ[˜È[˜Ý[Ûˆ
ÂˆYÙR[™^ˆJHÂˆÛÛœÝYÙHH]ØZ]“X[˜YÙ\‹™Ù]YÙJYÙR[™^
NÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™JYÙKšœÐXÝ[ÛœÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù][››Ý][ÛœÐžU\H‹\Þ[˜È[˜Ý[Ûˆ
Âˆ\\ËˆYÙR[™^\ÕÔÚÚ\ˆJHÂˆÛÛœÝÛ[TYÙ\Ë[››Ý][Û‘ÛØ˜[×HH]ØZ]›ÛZ\ÙK˜[
Ü“X[˜YÙ\‹™[œÝ\™QØÊ›[TYÙ\ÈŠK“X[˜YÙ\‹™[œÝ\™QØÊ˜[››Ý][Û‘ÛØ˜[ÈŠWJNÂˆYˆ
X[››Ý][Û‘ÛØ˜[ÊHÂˆ™]\›ˆ[ÂˆBˆÛÛœÝYÙT›ÛZ\Ù\ÈH×NÂˆÛÛœÝ[››Ý][Û”›ÛZ\Ù\ÈH×NÂˆ]\ÚÈH[ÂˆžHÂˆ›Üˆ
]HHZHH[TYÙ\ÎÈHZNÈJÊÊHÂˆYˆ
YÙR[™^\ÕÔÚÚ\Ëš\ÊJJHÂˆÛÛ[YNÂˆBˆYˆ
]\ÚÊHÂˆ\ÚÈH™]ÈÛÜšÙ\•\ÚÊ‘Ù][››Ý][ÛœÐžU\HŠNÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆBˆYÙT›ÛZ\Ù\Ëœ\Ú
“X[˜YÙ\‹™Ù]YÙJJK[ŠYÙHOˆYÙK˜ÛÛXÝ[››Ý][ÛœÐžU\J[™\‹\ÚË\\Ë[››Ý][Û”›ÛZ\Ù\Ë[››Ý][Û‘ÛØ˜[ÊJJNÂˆBˆ]ØZ]›ÛZ\ÙK˜[
YÙT›ÛZ\Ù\ÊNÂˆÛÛœÝ[››Ý][ÛœÈH]ØZ]›ÛZ\ÙK˜[
[››Ý][Û”›ÛZ\Ù\ÊNÂˆ™]\›ˆ[››Ý][ÛœË™š[\Š›ÛÛX[ŠNÂˆHš[˜[HÂˆYˆ
\ÚÊHÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆBˆBˆJNÂˆ[™\‹›ÛŠ‘Ù]Ý][™H‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ™ØÝ[Y[Ý][™HŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]Ü[Û˜[ÛÛ[ÛÛ™šYÈ‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ›Ü[Û˜[ÛÛ[ÛÛ™šYÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]\›Z\ÜÚ[ÛœÈ‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœ\›Z\ÜÚ[ÛœÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]Y]Y]H‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ›ÛZ\ÙK˜[
Ü“X[˜YÙ\‹™[œÝ\™QØÊ™ØÝ[Y[[™›ÈŠK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ›Y]Y]HŠK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊš\ÔÝXÝ™YHŠWJNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]X\šÒ[™›È‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ›X\šÒ[™›ÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]]H‹\Þ[˜È[˜Ý[Ûˆ

HÂˆÛÛœÝÝ™X[HH]ØZ]“X[˜YÙ\‹œ™\]Y\ÝØYYÝ™X[J
NÂˆ™]\›ˆÝ™X[K˜ž]\ÎÂˆJNÂˆ[™\‹›ÛŠ‘Ù][››Ý][ÛœÈ‹\Þ[˜È[˜Ý[Ûˆ
ÂˆYÙR[™^ˆ[[ˆJHÂˆÛÛœÝYÙHH]ØZ]“X[˜YÙ\‹™Ù]YÙJYÙR[™^
NÂˆÛÛœÝ\ÚÈH™]ÈÛÜšÙ\•\ÚÊÙ][››Ý][ÛœÎˆYÙH	ÜYÙR[™^X
NÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆžHÂˆ™]\›ˆ]ØZ]YÙK™Ù][››Ý][ÛœÑ]J[™\‹\ÚË[[
NÂˆHš[˜[HÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆBˆJNÂˆ[™\‹›ÛŠ‘Ù]šY[Øš™XÝÈ‹\Þ[˜È[˜Ý[Ûˆ

HÂˆÛÛœÝšY[Øš™XÝÈH]ØZ]“X[˜YÙ\‹™[œÝ\™QØÊ™šY[Øš™XÝÈŠNÂˆ™]\›ˆšY[Øš™XÝÏË˜[šY[È[ÂˆJNÂˆ[™\‹›ÛŠ‘Ù]ÚYÛ˜]\™\È‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™QØÊœÚYÛ˜]\™\ÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]ÚYÛ˜]\™Q]H‹[˜Ý[Ûˆ
Y
HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™QØÊ™Ù]ÚYÛ˜]\™Q]H‹ÚYJNÂˆJNÂˆ[™\‹›ÛŠ’\Ò”ÐXÝ[ÛœÈ‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™QØÊš\Ò”ÐXÝ[ÛœÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]Ø[Ý[][Û“Ü™\’YÈ‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™QØÊ˜Ø[Ý[][Û“Ü™\’YÈŠNÂˆJNÂˆ[™\‹›ÛŠ‘^˜XÝYÙ\È‹\Þ[˜È[˜Ý[Ûˆ
ÂˆYÙR[™›ÜËˆ[››Ý][Û”ÝÜ˜YÙBˆJHÂˆYˆ
\YÙR[™›ÜÊHÂˆØ\›Š™^˜XÝYÙ\Îˆ›Ý[™ÈÈ^˜XÝˆŠNÂˆ™]\›ˆ[ÂˆBˆYˆ
P\œ˜^Kš\Ð\œ˜^JYÙR[™›ÜÊJHÂˆYÙR[™›ÜÈHÜYÙR[™›Ü×NÂˆBˆ]™]ÑØÝ[Y[YHÂˆ›Üˆ
ÛÛœÝYÙR[™›ÈÙˆYÙR[™›ÜÊHÂˆYˆ
YÙR[™›Ëš[XYÙJHÂˆÛÛ[YNÂˆBˆYˆ
YÙR[™›Ë™ØÝ[Y[OOH[
HÂˆYÙR[™›Ë™ØÝ[Y[H“X[˜YÙ\‹œ‘ØÝ[Y[ÂˆH[ÙHYˆ
\œ˜^PY™™\‹š\ÕšY]ÊYÙR[™›Ë™ØÝ[Y[
JHÂˆÛÛœÝX[˜YÙ\ˆH™]ÈØØ[“X[˜YÙ\ŠÂˆÛÝ\˜ÙNˆYÙR[™›Ë™ØÝ[Y[ˆØÒYˆ	ÙØÒYWÙ^˜XÝYÙ\×ÉÛ™]ÑØÝ[Y[Y
ÊßXˆ[™\‹ˆ\ÜÝÛÜ™ˆYÙR[™›Ëœ\ÜÝÛÜ™ÏÈ[ˆ]˜[X]Ü“Ü[ÛœÎˆØš™XÝ˜\ÜÚYÛŠßK“X[˜YÙ\‹™]˜[X]Ü“Ü[ÛœÊBˆJNÂˆ]™XÛÝ™\žS[ÙHH˜[ÙNÂˆ]\Õ˜[YHYNÂˆÚ[H
YJHÂˆžHÂˆ]ØZ]X[˜YÙ\‹œ™\]Y\ÝØYYÝ™X[J
NÂˆ]ØZ]X[˜YÙ\‹š[š]ØÝ[Y[
™XÛÝ™\žS[ÙJNÂˆœ™XZÎÂˆHØ]Ú
JHÂˆYˆ
H[œÝ[˜Ù[Ùˆ™Y”\œÙQ^Ù\[ÛŠHÂˆYˆ
™XÛÝ™\žS[ÙHOOH˜[ÙJHÂˆ™XÛÝ™\žS[ÙHHYNÂˆÛÛ[YNÂˆH[ÙHÂˆ\Õ˜[YH˜[ÙNÂˆØ\›Š™^˜XÝYÙ\Îˆ™Y”\œÙQ^Ù\[Û‹ˆŠNÂˆBˆH[ÙHYˆ
H[œÝ[˜Ù[Ùˆ\ÜÝÛÜ™^Ù\[ÛŠHÂˆžHÂˆÛÛœÝ\ÜÝÛÜ™H]ØZ]Ù]\ÜÝÛÜ™
JNÂˆX[˜YÙ\‹\]T\ÜÝÛÜ™
\ÜÝÛÜ™
NÂˆHØ]ÚÂˆ\Õ˜[YH˜[ÙNÂˆØ\›Š™^˜XÝYÙ\Îˆ[˜[Y\ÜÝÛÜ™ˆŠNÂˆBˆH[ÙHÂˆ\Õ˜[YH˜[ÙNÂˆØ\›Š™^˜XÝYÙ\Îˆ[˜[YØÝ[Y[ˆŠNÂˆBˆYˆ
Z\Õ˜[Y
HÂˆœ™XZÎÂˆBˆBˆBˆYˆ
Z\Õ˜[Y
HÂˆYÙR[™›Ë™ØÝ[Y[H[ÂˆBˆÛÛœÝ\Ô\™V˜HH]ØZ]X[˜YÙ\‹™[œÝ\™QØÊš\Ô\™V˜HŠNÂˆYˆ
\Ô\™V˜JHÂˆYÙR[™›Ë™ØÝ[Y[H[ÂˆØ\›Š™^˜XÝYÙ\ÈÙ\È›ÝÝ\Ü\™HHØÝ[Y[ËˆŠNÂˆH[ÙHÂˆYÙR[™›Ë™ØÝ[Y[HX[˜YÙ\‹œ‘ØÝ[Y[ÂˆBˆH[ÙHÂˆØ\›Š™^˜XÝYÙ\Îˆ[˜[YØÝ[Y[ˆŠNÂˆBˆBˆ]\ÚÎÂˆžHÂˆÛÛœÝ‘Y]ÜˆH™]È‘Y]ÜŠ
NÂˆ\ÚÈH™]ÈÛÜšÙ\•\ÚÊ^˜XÝYÙ\Îˆ	ÜYÙR[™›ÜË›[™ÝHYÙJÊX
NÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆ™]\›ˆ]ØZ]‘Y]Ü‹™^˜XÝYÙ\ÊYÙR[™›ÜË[››Ý][Û”ÝÜ˜YÙK“X[˜YÙ\‹œ‘ØÝ[Y[[™\‹\ÚÊNÂˆHØ]Ú
™X\ÛÛŠHÂˆØ\›Š^˜XÝYÙ\Îˆ‰Ü™X\ÛÛŸH‹˜
NÂˆ™]\›ˆ[ÂˆHš[˜[HÂˆYˆ
\ÚÊHÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆBˆBˆJNÂˆ[™\‹›ÛŠ”Ø]™QØÝ[Y[‹\Þ[˜È[˜Ý[Ûˆ
Âˆ\Ô\™V˜Kˆ[TYÙ\Ëˆ[››Ý][Û”ÝÜ˜YÙKˆš[[˜[YBˆJHÂˆÛÛœÝÛØ˜[›ÛZ\Ù\ÈHÜ“X[˜YÙ\‹œ™\]Y\ÝØYYÝ™X[J
K“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ˜XÜ›Ñ›Ü›HŠK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊ˜XÜ›Ñ›Ü›T™YˆŠK“X[˜YÙ\‹™[œÝ\™QØÊœÝ\™YˆŠK“X[˜YÙ\‹™[œÝ\™QØÊž™YˆŠK“X[˜YÙ\‹™[œÝ\™PØ][ÙÊœÝXÝ™YT›ÛÝŠWNÂˆÛÛœÝÚ[™Ù\ÈH™]È™Y“X\

NÂˆÛÛœÝ›ÛZ\Ù\ÈH×NÂˆÛÛœÝ™]Ð[››Ý][ÛœÐžTYÙHHZ\Ô\™V˜HÈÙ]™]Ð[››Ý][ÛœÓX\
[››Ý][Û”ÝÜ˜YÙJHˆ[ÂˆÛÛœÝÜÝ™X[KXÜ›Ñ›Ü›KXÜ›Ñ›Ü›T™Y‹Ý\™Y‹™Y‹ÜÝXÝ™YT›ÛÝHH]ØZ]›ÛZ\ÙK˜[
ÛØ˜[›ÛZ\Ù\ÊNÂˆÛÛœÝØ][ÙÔ™YˆH™Y‹˜Z[\‹™Ù]˜]Ê”›ÛÝŠH[Âˆ]ÝXÝ™YT›ÛÝÂˆYˆ
™]Ð[››Ý][ÛœÐžTYÙJHÂˆYˆ
WÜÝXÝ™YT›ÛÝ
HÂˆYˆ
]ØZ]ÝXÝ™YT›ÛÝ˜Ø[Ü™X]TÝXÝ\™U™YJÂˆØ][ÙÔ™Y‹ˆ“X[˜YÙ\‹ˆ™]Ð[››Ý][ÛœÐžTYÙBˆJJHÂˆÝXÝ™YT›ÛÝH[ÂˆBˆH[ÙHYˆ
]ØZ]ÜÝXÝ™YT›ÛÝ˜Ø[•\]TÝXÝ™YJÂˆ“X[˜YÙ\‹ˆ™]Ð[››Ý][ÛœÐžTYÙBˆJJHÂˆÝXÝ™YT›ÛÝHÜÝXÝ™YT›ÛÝÂˆBˆÛÛœÝ[XYÙT›ÛZ\Ù\ÈH[››Ý][Û‘˜XÝÜžK™Ù[™\˜]R[XYÙ\Ê[››Ý][Û”ÝÜ˜YÙK˜[Y\Ê
K™Y‹“X[˜YÙ\‹™]˜[X]Ü“Ü[ÛœËš\ÓÙ™œØÜ™Y[Ø[˜\ÔÝ\ÜY
NÂˆÛÛœÝ™]Ð[››Ý][Û”›ÛZ\Ù\ÈHÝXÝ™YT›ÛÝOOH[™Yš[™YÈ›ÛZ\Ù\Èˆ×NÂˆ›Üˆ
ÛÛœÝÜYÙR[™^[››Ý][Ûœ×HÙˆ™]Ð[››Ý][ÛœÐžTYÙJHÂˆ™]Ð[››Ý][Û”›ÛZ\Ù\Ëœ\Ú
“X[˜YÙ\‹™Ù]YÙJYÙR[™^
K[ŠYÙHOˆÂˆÛÛœÝ\ÚÈH™]ÈÛÜšÙ\•\ÚÊØ]™H
Y]ÜŠNˆYÙH	ÜYÙR[™^X
NÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆ™]\›ˆYÙKœØ]™S™]Ð[››Ý][ÛœÊ[™\‹\ÚË[››Ý][ÛœË[XYÙT›ÛZ\Ù\ËÚ[™Ù\ÊK™š[˜[J

HOˆÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆJNÂˆJJNÂˆBˆYˆ
ÝXÝ™YT›ÛÝOOH[
HÂˆ›ÛZ\Ù\Ëœ\Ú
›ÛZ\ÙK˜[
™]Ð[››Ý][Û”›ÛZ\Ù\ÊK[Š\Þ[˜È

HOˆÂˆ]ØZ]ÝXÝ™YT›ÛÝ˜Ü™X]TÝXÝ\™U™YJÂˆ™]Ð[››Ý][ÛœÐžTYÙKˆ™Y‹ˆØ][ÙÔ™Y‹ˆ“X[˜YÙ\‹ˆÚ[™Ù\ÂˆJNÂˆJJNÂˆH[ÙHYˆ
ÝXÝ™YT›ÛÝ
HÂˆ›ÛZ\Ù\Ëœ\Ú
›ÛZ\ÙK˜[
™]Ð[››Ý][Û”›ÛZ\Ù\ÊK[Š\Þ[˜È

HOˆÂˆ]ØZ]ÝXÝ™YT›ÛÝ\]TÝXÝ\™U™YJÂˆ™]Ð[››Ý][ÛœÐžTYÙKˆ“X[˜YÙ\‹ˆÚ[™Ù\ÂˆJNÂˆJJNÂˆBˆBˆYˆ
\Ô\™V˜JHÂˆ›ÛZ\Ù\Ëœ\Ú
“X[˜YÙ\‹™[œÝ\™QØÊœÙ\šX[^™V˜Q]H‹Ø[››Ý][Û”ÝÜ˜YÙWJJNÂˆH[ÙHÂˆ›Üˆ
]YÙR[™^HÈYÙR[™^[TYÙ\ÎÈYÙR[™^
ÊÊHÂˆ›ÛZ\Ù\Ëœ\Ú
“X[˜YÙ\‹™Ù]YÙJYÙR[™^
K[Š[˜Ý[Ûˆ
YÙJHÂˆÛÛœÝ\ÚÈH™]ÈÛÜšÙ\•\ÚÊØ]™NˆYÙH	ÜYÙR[™^X
NÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆ™]\›ˆYÙKœØ]™J[™\‹\ÚË[››Ý][Û”ÝÜ˜YÙKÚ[™Ù\ÊK™š[˜[J

HOˆÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆJNÂˆJJNÂˆBˆBˆÛÛœÝ™YœÈH]ØZ]›ÛZ\ÙK˜[
›ÛZ\Ù\ÊNÂˆ]˜Q]HH[ÂˆYˆ
\Ô\™V˜JHÂˆ˜Q]HH™YœÖÌNÂˆYˆ
^˜Q]JHÂˆ™]\›ˆÝ™X[K˜ž]\ÎÂˆBˆH[ÙHYˆ
Ú[™Ù\ËœÚ^™HOOH
HÂˆ™]\›ˆÝ™X[K˜ž]\ÎÂˆBˆÛÛœÝ™YY\X\˜[˜Ù\ÈHXÜ›Ñ›Ü›T™Yˆ	‰ˆXÜ›Ñ›Ü›H[œÝ[˜Ù[ÙˆXÝ	‰ˆÚ[™Ù\Ë˜[Y\Ê
KœÛÛYJ™YˆOˆ™Y‹›™YY\X\˜[˜Ù\ÊNÂˆÛÛœÝ˜HHXÜ›Ñ›Ü›H[œÝ[˜Ù[ÙˆXÝ	‰ˆXÜ›Ñ›Ü›K™Ù]
–HŠH[Âˆ]˜Q]\Ù]Ô™YˆH[Âˆ]\Ö˜Q]\Ù]Ñ[žHH˜[ÙNÂˆYˆ
\œ˜^Kš\Ð\œ˜^J˜JJHÂˆ›Üˆ
]HHZHH˜K›[™ÝÈHZNÈH
ÏHŠHÂˆYˆ
˜VÚWHOOH™]\Ù]ÈŠHÂˆ˜Q]\Ù]Ô™YˆH˜VÚH
ÈWNÂˆ\Ö˜Q]\Ù]Ñ[žHHYNÂˆBˆBˆYˆ
˜Q]\Ù]Ô™YˆOOH[
HÂˆ˜Q]\Ù]Ô™YˆH™Y‹™Ù]™]Õ[\Ü˜\žT™YŠ
NÂˆBˆH[ÙHYˆ
˜JHÂˆØ\›Š•[œÝ\ÜYH\KˆŠNÂˆBˆ]™]Ö™Y’[™›ÈHØš™XÝ˜Ü™X]J[
NÂˆYˆ
™Y‹˜Z[\ŠHÂˆÛÛœÝ[™›ÓX\H™]ÈX\

NÂˆÛÛœÝ™Y’[™›ÈH™Y‹˜Z[\‹™Ù]
’[™›ÈŠH[ÂˆYˆ
™Y’[™›È[œÝ[˜Ù[ÙˆXÝ
HÂˆ›Üˆ
ÛÛœÝÚÙ^K˜[YWHÙˆ™Y’[™›ÊHÂˆYˆ
\[Ùˆ˜[YHOOHœÝš[™ÈŠHÂˆ[™›ÓX\œÙ]
Ù^KÝš[™ÕÔ”Ýš[™Ê˜[YJJNÂˆBˆBˆBˆ™]Ö™Y’[™›ÈHÂˆ›ÛÝ™YŽˆØ][ÙÔ™Y‹ˆ[˜Üž\™YŽˆ™Y‹˜Z[\‹™Ù]˜]Ê‘[˜Üž\ŠH[ˆ™]Ô™YŽˆ™Y‹™Ù]™]Õ[\Ü˜\žT™YŠ
Kˆ[™›Ô™YŽˆ™Y‹˜Z[\‹™Ù]˜]Ê’[™›ÈŠH[ˆ[™›ÓX\ˆš[RYÎˆ™Y‹˜Z[\‹™Ù]
’QŠH[ˆÝ\™Y‹ˆš[[˜[YBˆNÂˆBˆ™]\›ˆ[˜Ü™[Y[[\]JÂˆÜšYÚ[˜[]NˆÝ™X[K˜ž]\Ëˆ™Y’[™›Îˆ™]Ö™Y’[™›ËˆÚ[™Ù\Ëˆ™Y‹ˆ\Ö˜NˆH^˜Kˆ˜Q]\Ù]Ô™Y‹ˆ\Ö˜Q]\Ù]Ñ[žKˆ™YY\X\˜[˜Ù\ËˆXÜ›Ñ›Ü›T™Y‹ˆXÜ›Ñ›Ü›Kˆ˜Q]Kˆ\ÙV™Y”Ý™X[Nˆ\ÑXÝ
™Y‹ÜXÝ–™YˆŠBˆJK™š[˜[J

HOˆÂˆ™Y‹œ™\Ù]™]Õ[\Ü˜\žT™YŠ
NÂˆJNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]Ü\˜]Ü“\Ý‹[˜Ý[Ûˆ
ÂˆYÙRYˆYÙR[™^ˆ[[ˆØXÚRÙ^Kˆ[››Ý][Û”ÝÜ˜YÙKˆ[ÙYšYYYÂˆKÚ[šÊHÂˆ“X[˜YÙ\‹™Ù]YÙJYÙRY
K[Š[˜Ý[Ûˆ
YÙJHÂˆÛÛœÝ\ÚÈH™]ÈÛÜšÙ\•\ÚÊÙ]Ü\˜]Ü“\ÝˆYÙH	ÜYÙR[™^X
NÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆÛÛœÝÝ\H™\˜›ÜÚ]HH™\˜›ÜÚ]S]™[’S‘“ÔÈÈ]K››ÝÊ
HˆÂˆYÙK™Ù]Ü\˜]Ü“\Ý
Âˆ[™\‹ˆÚ[šËˆ\ÚËˆ[[ˆØXÚRÙ^Kˆ[››Ý][Û”ÝÜ˜YÙKˆ[ÙYšYYYËˆYÙR[™^ˆJK[ŠÜ\Ý[™›ÈOˆÂˆYˆ
Ý\
HÂˆ[™›Ê	Ý\ÚË›˜[Y_NÈ[YOIÑ]K››ÝÊ
HHÝ\[\Ë[IÛÜ\Ý[™›Ë›[™ÝX
NÂˆBˆÚ[šË˜ÛÜÙJ
NÂˆK™X\ÛÛˆOˆÂˆYˆ
\ÚË\›Z[˜]Y
HÂˆ™]\›ŽÂˆBˆÚ[šË™\œ›ÜŠ™X\ÛÛŠNÂˆJK™š[˜[J

HOˆÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆJNÂˆJNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]^ÛÛ[‹[˜Ý[Ûˆ
ÂˆYÙRYˆYÙR[™^ˆ[˜ÛYSX\šÙYÛÛ[ˆ\ØX›S›Ü›X[^˜][Û‚ˆKÚ[šÊHÂˆ“X[˜YÙ\‹™Ù]YÙJYÙRY
K[Š[˜Ý[Ûˆ
YÙJHÂˆÛÛœÝ\ÚÈH™]ÈÛÜšÙ\•\ÚÊ‘Ù]^ÛÛ[ˆYÙHˆ
ÈYÙR[™^
NÂˆÝ\ÛÜšÙ\•\ÚÊ\ÚÊNÂˆÛÛœÝÝ\H™\˜›ÜÚ]HH™\˜›ÜÚ]S]™[’S‘“ÔÈÈ]K››ÝÊ
HˆÂˆYÙK™^˜XÝ^ÛÛ[
Âˆ[™\‹ˆ\ÚËˆÚ[šËˆ[˜ÛYSX\šÙYÛÛ[ˆ\ØX›S›Ü›X[^˜][Û‚ˆJK[Š

HOˆÂˆYˆ
Ý\
HÂˆ[™›Ê	Ý\ÚË›˜[Y_NÈ[YOIÑ]K››ÝÊ
HHÝ\[\Ø
NÂˆBˆÚ[šË˜ÛÜÙJ
NÂˆK™X\ÛÛˆOˆÂˆYˆ
\ÚË\›Z[˜]Y
HÂˆ™]\›ŽÂˆBˆÚ[šË™\œ›ÜŠ™X\ÛÛŠNÂˆJK™š[˜[J

HOˆÂˆš[š\ÚÛÜšÙ\•\ÚÊ\ÚÊNÂˆJNÂˆJNÂˆJNÂˆ[™\‹›ÛŠ‘Ù]ÝXÝ™YH‹\Þ[˜È[˜Ý[Ûˆ
ÂˆYÙR[™^ˆJHÂˆÛÛœÝYÙHH]ØZ]“X[˜YÙ\‹™Ù]YÙJYÙR[™^
NÂˆ™]\›ˆ“X[˜YÙ\‹™[œÝ\™JYÙK™Ù]ÝXÝ™YHŠNÂˆJNÂˆ[™\‹›ÛŠ‘›Û˜[˜XÚÈ‹[˜Ý[Ûˆ
ÂˆYˆJHÂˆ™]\›ˆ“X[˜YÙ\‹™›Û˜[˜XÚÊY[™\ŠNÂˆJNÂˆ[™\‹›ÛŠÛX[\‹[˜Ý[Ûˆ

HÂˆ™]\›ˆ“X[˜YÙ\‹˜ÛX[\
YJNÂˆJNÂˆ[™\‹›ÛŠ•\›Z[˜]H‹\Þ[˜È[˜Ý[Ûˆ

HÂˆ\›Z[˜]YHYNÂˆÛÛœÝØZ]ÛˆH×NÂˆYˆ
“X[˜YÙ\ŠHÂˆ“X[˜YÙ\‹\›Z[˜]J™]ÈX›Ü^Ù\[ÛŠ•ÛÜšÙ\ˆØ\È\›Z[˜]YˆŠJNÂˆÛÛœÝÛX[\›ÛZ\ÙHH“X[˜YÙ\‹˜ÛX[\

NÂˆØZ]Û‹œ\Ú
ÛX[\›ÛZ\ÙJNÂˆ“X[˜YÙ\ˆH[ÂˆH[ÙHÂˆÛX\‘ÛØ˜[ØXÚ\Ê
NÂˆBˆØ[˜Ù[œÏËŠ™]ÈX›Ü^Ù\[ÛŠ•ÛÜšÙ\ˆØ\È\›Z[˜]YˆŠJNÂˆ›Üˆ
ÛÛœÝ\ÚÈÙˆÛÜšÙ\•\ÚÜÊHÂˆØZ]Û‹œ\Ú
\ÚË™š[š\ÚY
NÂˆ\ÚË\›Z[˜]J
NÂˆBˆ]ØZ]›ÛZ\ÙK˜[
ØZ]ÛŠNÂˆ[™\‹™\Ý›ÞJ
NÂˆ[™\ˆH[ÂˆJNÂˆ[™\‹›ÛŠ”™XYH‹[˜Ý[Ûˆ

HÂˆÙ]\ØÊØÔ\˜[\ÊNÂˆØÔ\˜[\ÈH[ÂˆJNÂˆ™]\›ˆÛÜšÙ\’[™\“˜[YNÂˆBˆÝ]XÈ[š]X[^™Qœ›ÛTÜ
Ü
HÂˆÛÛœÝ[™\ˆH™]ÈY\ÜØYÙR[™\ŠÛÜšÙ\ˆ‹›XZ[ˆ‹Ü
NÂˆ\ËœÙ]\
[™\‹Ü
NÂˆ[™\‹œÙ[™
œ™XYH‹[
NÂˆBŸB‚ŽËËÈ‹ÜÜ˜ËÜ‹ÛÜšÙ\‹šœÂ‚™ÛØ˜[\ËœšœÕÛÜšÙ\ˆHÂˆÛÜšÙ\“Y\ÜØYÙR[™\ŽˆÛÜšÙ\“Y\ÜØYÙR[™\‚ŸNÂ‚™^ÜÈÛÜšÙ\“Y\ÜØYÙR[™\ˆNÂ‚‹ËÈÈÛÝ\˜ÙSX\[™ÕT“\‹ÛÜšÙ\‹›ZœË›X\