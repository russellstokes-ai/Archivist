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
const BASELINE_FACTOR = (/* unused pure expression or super */ null && (LINE_DESCENT_FACTOR / LINE_FACTOR));
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
const AnnotationMode = {
  DISABLE: 0,
  ENABLE: 1,
  ENABLE_FORMS: 2,
  ENABLE_STORAGE: 3
};
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
const AnnotationEditorParamsType = {
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
};
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
const MeshFigureType = (/* unused pure expression or super */ null && ({
  TRIANGLES: 1,
  LATTICE: 2,
  PATCH: 3
}));
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
const AnnotationReplyType = (/* unused pure expression or super */ null && ({
  GROUP: "Group",
  REPLY: "R"
}));
const AnnotationRenditionOperation = (/* unused pure expression or super */ null && ({
  PLAY_OR_RESUME: 0,
  STOP: 1,
  PAUSE: 2,
  RESUME: 3,
  PLAY: 4
}));
const AnnotationFlag = (/* unused pure expression or super */ null && ({
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
}));
const AnnotationFieldFlag = (/* unused pure expression or super */ null && ({
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
}));
const AnnotationBorderStyleType = {
  SOLID: 1,
  DASHED: 2,
  BEVELED: 3,
  INSET: 4,
  UNDERLINE: 5
};
const AnnotationActionEventType = (/* unused pure expression or super */ null && ({
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
}));
const DocumentActionEventType = (/* unused pure expression or super */ null && ({
  WC: "WillClose",
  WS: "WillSave",
  DS: "DidSave",
  WP: "WillPrint",
  DP: "DidPrint"
}));
const PageActionEventType = (/* unused pure expression or super */ null && ({
  O: "PageOpen",
  C: "PageClose"
}));
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
    } else if (typeof document !== "undefined") {
      ctx = document.createElement("canvas").getContext("2d");
    }
    return shadow(this, "isCanvasFilterSupported", ctx?.filter !== undefined);
  }
  static get isAlphaColorInputSupported() {
    if (typeof document === "undefined") {
      return shadow(this, "isAlphaColorInputSupported", false);
    }
    const input = document.createElement("input");
    input.type = "color";
    input.setAttribute("alpha", "");
    input.value = "#ff000080";
    return shadow(this, "isAlphaColorInputSupported", input.value !== "#ff0000");
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

;// ./src/shared/math_clamp.js
function MathClamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

;// ./src/display/page_viewport.js

class PageViewport {
  constructor({
    viewBox,
    userUnit,
    scale,
    rotation,
    offsetX = 0,
    offsetY = 0,
    dontFlip = false
  }) {
    this.viewBox = viewBox;
    this.userUnit = userUnit;
    this.scale = scale;
    this.rotation = rotation;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    scale *= userUnit;
    const centerX = (viewBox[2] + viewBox[0]) / 2;
    const centerY = (viewBox[3] + viewBox[1]) / 2;
    let rotateA, rotateB, rotateC, rotateD;
    rotation %= 360;
    if (rotation < 0) {
      rotation += 360;
    }
    switch (rotation) {
      case 180:
        rotateA = -1;
        rotateB = 0;
        rotateC = 0;
        rotateD = 1;
        break;
      case 90:
        rotateA = 0;
        rotateB = 1;
        rotateC = 1;
        rotateD = 0;
        break;
      case 270:
        rotateA = 0;
        rotateB = -1;
        rotateC = -1;
        rotateD = 0;
        break;
      case 0:
        rotateA = 1;
        rotateB = 0;
        rotateC = 0;
        rotateD = -1;
        break;
      default:
        throw new Error("PageViewport: Invalid rotation, must be a multiple of 90 degrees.");
    }
    if (dontFlip) {
      rotateC = -rotateC;
      rotateD = -rotateD;
    }
    let offsetCanvasX, offsetCanvasY;
    let width, height;
    if (rotateA === 0) {
      offsetCanvasX = Math.abs(centerY - viewBox[1]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerX - viewBox[0]) * scale + offsetY;
      width = (viewBox[3] - viewBox[1]) * scale;
      height = (viewBox[2] - viewBox[0]) * scale;
    } else {
      offsetCanvasX = Math.abs(centerX - viewBox[0]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerY - viewBox[1]) * scale + offsetY;
      width = (viewBox[2] - viewBox[0]) * scale;
      height = (viewBox[3] - viewBox[1]) * scale;
    }
    this.transform = [rotateA * scale, rotateB * scale, rotateC * scale, rotateD * scale, offsetCanvasX - rotateA * scale * centerX - rotateC * scale * centerY, offsetCanvasY - rotateB * scale * centerX - rotateD * scale * centerY];
    this.width = width;
    this.height = height;
  }
  get rawDims() {
    const dims = this.viewBox;
    return shadow(this, "rawDims", {
      pageWidth: dims[2] - dims[0],
      pageHeight: dims[3] - dims[1],
      pageX: dims[0],
      pageY: dims[1]
    });
  }
  clone({
    scale = this.scale,
    rotation = this.rotation,
    offsetX = this.offsetX,
    offsetY = this.offsetY,
    dontFlip = false
  } = {}) {
    return new PageViewport({
      viewBox: this.viewBox.slice(),
      userUnit: this.userUnit,
      scale,
      rotation,
      offsetX,
      offsetY,
      dontFlip
    });
  }
  convertToViewportPoint(x, y) {
    const p = [x, y];
    Util.applyTransform(p, this.transform);
    return p;
  }
  convertToPdfPoint(x, y) {
    const p = [x, y];
    Util.applyInverseTransform(p, this.transform);
    return p;
  }
}

;// ./src/display/xfa_text.js
class XfaText {
  static textContent(xfa) {
    const items = [];
    const output = {
      items,
      styles: Object.create(null)
    };
    function walk(node) {
      if (!node) {
        return;
      }
      let str = null;
      const name = node.name;
      if (name === "#text") {
        str = node.value;
      } else if (!XfaText.shouldBuildText(name)) {
        return;
      } else if (node?.attributes?.textContent) {
        str = node.attributes.textContent;
      } else if (node.value) {
        str = node.value;
      }
      if (str !== null) {
        items.push({
          str
        });
      }
      if (!node.children) {
        return;
      }
      for (const child of node.children) {
        walk(child);
      }
    }
    walk(xfa);
    return output;
  }
  static shouldBuildText(name) {
    return !(name === "textarea" || name === "input" || name === "option" || name === "select");
  }
}

;// ./src/display/xfa_layer.js



const disallowedRichTextStyleRegExp = /url\(|image-set\(/i;
const disallowedEventHandlerAttrRegExp = /^on/i;
class XfaLayer {
  static get _allowedHtmlElements() {
    return shadow(this, "_allowedHtmlElements", new Set(["a", "b", "br", "button", "div", "i", "img", "input", "label", "li", "ol", "option", "p", "select", "span", "sub", "sup", "textarea", "ul"]));
  }
  static get _allowedSvgElements() {
    return shadow(this, "_allowedSvgElements", new Set(["ellipse", "line", "path", "rect", "svg"]));
  }
  static get _allowedRichTextElements() {
    return shadow(this, "_allowedRichTextElements", new Set(["a", "b", "br", "div", "i", "li", "ol", "p", "span", "sub", "sup", "ul"]));
  }
  static get _allowedRichTextAttributes() {
    return shadow(this, "_allowedRichTextAttributes", new Set(["class", "dir", "style"]));
  }
  static get _allowedRichTextStyles() {
    return shadow(this, "_allowedRichTextStyles", new Set(["color", "font", "fontFamily", "fontSize", "fontStretch", "fontStyle", "fontWeight", "kerningMode", "letterSpacing", "lineHeight", "margin", "marginBottom", "marginLeft", "marginRight", "marginTop", "orphans", "paddingLeft", "paddingRight", "breakAfter", "breakBefore", "breakInside", "tabInterval", "tabStop", "textAlign", "textDecoration", "textIndent", "transform", "verticalAlign", "widows"]));
  }
  static setupStorage(html, id, element, storage, intent) {
    const storedData = storage.getValue(id, {
      value: null
    });
    switch (element.name) {
      case "textarea":
        if (storedData.value !== null) {
          html.textContent = storedData.value;
        }
        if (intent === "print") {
          break;
        }
        html.addEventListener("input", event => {
          storage.setValue(id, {
            value: event.target.value
          });
        });
        break;
      case "input":
        if (element.attributes.type === "radio" || element.attributes.type === "checkbox") {
          if (storedData.value === element.attributes.xfaOn) {
            html.setAttribute("checked", true);
          } else if (storedData.value === element.attributes.xfaOff) {
            html.removeAttribute("checked");
          }
          if (intent === "print") {
            break;
          }
          html.addEventListener("change", event => {
            storage.setValue(id, {
              value: event.target.checked ? event.target.getAttribute("xfaOn") : event.target.getAttribute("xfaOff")
            });
          });
        } else {
          if (storedData.value !== null) {
            html.setAttribute("value", storedData.value);
          }
          if (intent === "print") {
            break;
          }
          html.addEventListener("input", event => {
            storage.setValue(id, {
              value: event.target.value
            });
          });
        }
        break;
      case "select":
        if (storedData.value !== null) {
          html.setAttribute("value", storedData.value);
          for (const option of element.children) {
            if (option.attributes.value === storedData.value) {
              option.attributes.selected = true;
            } else if (Object.hasOwn(option.attributes, "selected")) {
              delete option.attributes.selected;
            }
          }
        }
        html.addEventListener("input", event => {
          const options = event.target.options;
          const value = options.selectedIndex === -1 ? "" : options[options.selectedIndex].value;
          storage.setValue(id, {
            value
          });
        });
        break;
    }
  }
  static setAttributes({
    html,
    element,
    storage = null,
    intent,
    linkService
  }) {
    const {
      attributes
    } = element;
    const isHTMLAnchorElement = html instanceof HTMLAnchorElement;
    if (attributes.type === "radio") {
      attributes.name = `${attributes.name}-${intent}`;
    }
    for (const [key, value] of Object.entries(attributes)) {
      if (value === null || value === undefined) {
        continue;
      }
      if (disallowedEventHandlerAttrRegExp.test(key)) {
        continue;
      }
      if (intent === "richText" && !this._allowedRichTextAttributes.has(key)) {
        continue;
      }
      switch (key) {
        case "class":
          if (value.length) {
            html.setAttribute(key, value.join(" "));
          }
          break;
        case "dataId":
          break;
        case "id":
          html.setAttribute("data-element-id", value);
          break;
        case "style":
          if (intent === "richText") {
            const allowedStyles = this._allowedRichTextStyles;
            for (const [styleName, styleValue] of Object.entries(value)) {
              if (allowedStyles.has(styleName) && !disallowedRichTextStyleRegExp.test(styleValue)) {
                html.style[styleName] = styleValue;
              }
            }
          } else {
            Object.assign(html.style, value);
          }
          break;
        case "textContent":
          html.textContent = value;
          break;
        default:
          if (!isHTMLAnchorElement || key !== "href" && key !== "newWindow") {
            html.setAttribute(key, value);
          }
      }
    }
    if (isHTMLAnchorElement) {
      linkService?.addLinkAttributes(html, attributes.href, attributes.newWindow);
    }
    if (storage && attributes.dataId) {
      this.setupStorage(html, attributes.dataId, element, storage);
    }
  }
  static #createElement(name, xmlns, intent) {
    if (intent === "richText") {
      return !xmlns && this._allowedRichTextElements.has(name) ? document.createElement(name) : null;
    }
    if (xmlns) {
      return xmlns === SVG_NS && this._allowedSvgElements.has(name) ? document.createElementNS(SVG_NS, name) : null;
    }
    return this._allowedHtmlElements.has(name) ? document.createElement(name) : null;
  }
  static render(parameters) {
    const storage = parameters.annotationStorage;
    const linkService = parameters.linkService;
    const root = parameters.xfaHtml;
    const intent = parameters.intent || "display";
    const rootHtml = this.#createElement(root.name, root.attributes?.xmlns, intent) ?? document.createElement("div");
    if (root.attributes) {
      this.setAttributes({
        html: rootHtml,
        element: root,
        intent,
        linkService
      });
    }
    const isNotForRichText = intent !== "richText";
    const rootDiv = parameters.div;
    rootDiv.append(rootHtml);
    if (parameters.viewport) {
      const transform = `matrix(${parameters.viewport.transform.join(",")})`;
      rootDiv.style.transform = transform;
    }
    if (isNotForRichText) {
      rootDiv.setAttribute("class", "xfaLayer xfaFont");
    }
    const textDivs = [];
    if (root.children.length === 0) {
      if (root.value) {
        const node = document.createTextNode(root.value);
        rootHtml.append(node);
        if (isNotForRichText && XfaText.shouldBuildText(root.name)) {
          textDivs.push(node);
        }
      }
      return {
        textDivs
      };
    }
    const stack = [[root, -1, rootHtml]];
    while (stack.length > 0) {
      const [parent, i, html] = stack.at(-1);
      if (i + 1 === parent.children.length) {
        stack.pop();
        continue;
      }
      const child = parent.children[++stack.at(-1)[1]];
      if (child === null) {
        continue;
      }
      const {
        name
      } = child;
      if (name === "#text") {
        const node = document.createTextNode(child.value);
        textDivs.push(node);
        html.append(node);
        continue;
      }
      const childHtml = this.#createElement(name, child.attributes?.xmlns, intent);
      if (!childHtml) {
        continue;
      }
      html.append(childHtml);
      if (child.attributes) {
        this.setAttributes({
          html: childHtml,
          element: child,
          storage,
          intent,
          linkService
        });
      }
      if (child.children?.length > 0) {
        stack.push([child, -1, childHtml]);
      } else if (child.value) {
        const node = document.createTextNode(child.value);
        if (isNotForRichText && XfaText.shouldBuildText(name)) {
          textDivs.push(node);
        }
        childHtml.append(node);
      }
    }
    for (const el of rootDiv.querySelectorAll(".xfaNonInteractive input, .xfaNonInteractive textarea")) {
      el.setAttribute("readOnly", true);
    }
    return {
      textDivs
    };
  }
  static update(parameters) {
    const transform = `matrix(${parameters.viewport.transform.join(",")})`;
    parameters.div.style.transform = transform;
    parameters.div.hidden = false;
  }
  static getPageViewport(xfaPage, {
    scale = 1,
    rotation = 0
  }) {
    const {
      width,
      height
    } = xfaPage.attributes.style;
    return new PageViewport({
      viewBox: [0, 0, parseInt(width, 10), parseInt(height, 10)],
      userUnit: 1,
      scale,
      rotation
    });
  }
}

;// ./src/display/display_utils.js




class PixelsPerInch {
  static CSS = 96.0;
  static PDF = 72.0;
  static PDF_TO_CSS_UNITS = this.CSS / this.PDF;
}
async function fetchData(url, type = "text") {
  if (isValidFetchUrl(url, document.baseURI)) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    switch (type) {
      case "blob":
        return response.blob();
      case "bytes":
        return response.bytes();
      case "json":
        return response.json();
    }
    return response.text();
  }
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = type === "bytes" ? "arraybuffer" : type;
    request.onreadystatechange = () => {
      if (request.readyState !== XMLHttpRequest.DONE) {
        return;
      }
      if (request.status === 200 || request.status === 0) {
        switch (type) {
          case "bytes":
            resolve(new Uint8Array(request.response));
            return;
          case "blob":
          case "json":
            resolve(request.response);
            return;
        }
        resolve(request.responseText);
        return;
      }
      reject(new Error(request.statusText));
    };
    request.send(null);
  });
}
class RenderingCancelledException extends BaseException {
  constructor(msg, extraDelay = 0) {
    super(msg, "RenderingCancelledException");
    this.extraDelay = extraDelay;
  }
}
function isDataScheme(url) {
  const ii = url.length;
  let i = 0;
  while (i < ii && url[i].trim() === "") {
    i++;
  }
  return url.substring(i, i + 5).toLowerCase() === "data:";
}
function isPdfFile(filename) {
  return typeof filename === "string" && /\.pdf$/i.test(filename);
}
function getFilenameFromUrl(url) {
  [url] = url.split(/[#?]/, 1);
  return stripPath(url);
}
function getPdfFilenameFromUrl(url, defaultFilename = "document.pdf") {
  if (typeof url !== "string") {
    return defaultFilename;
  }
  if (isDataScheme(url)) {
    warn('getPdfFilenameFromUrl: ignore "data:"-URL for performance reasons.');
    return defaultFilename;
  }
  const getURL = urlString => {
    try {
      return new URL(urlString);
    } catch {}
    try {
      return new URL(decodeURIComponent(urlString));
    } catch {}
    try {
      return new URL(urlString, "https://foo.bar");
    } catch {}
    try {
      return new URL(decodeURIComponent(urlString), "https://foo.bar");
    } catch {}
    return null;
  };
  const newURL = getURL(url);
  if (!newURL) {
    return defaultFilename;
  }
  const decode = name => {
    try {
      let decoded = decodeURIComponent(name);
      if (decoded.includes("/")) {
        decoded = stripPath(decoded);
        if (decoded.length === 4 && pdfRegex.test(decoded)) {
          return name;
        }
      }
      return decoded;
    } catch {
      return name;
    }
  };
  const pdfRegex = /\.pdf$/i;
  const filename = stripPath(newURL.pathname);
  if (pdfRegex.test(filename)) {
    return decode(filename);
  }
  if (newURL.searchParams.size > 0) {
    const getLast = iterator => [...iterator].findLast(v => pdfRegex.test(v));
    const name = getLast(newURL.searchParams.values()) ?? getLast(newURL.searchParams.keys());
    if (name) {
      return decode(name);
    }
  }
  if (newURL.hash) {
    const {
      hash
    } = newURL;
    let extensionStart = -1;
    for (const {
      index
    } of hash.matchAll(/\.pdf\b/gi)) {
      extensionStart = index;
    }
    if (extensionStart > 0) {
      let filenameStart = extensionStart;
      while (filenameStart > 0 && !"/?#=".includes(hash[filenameStart - 1])) {
        filenameStart--;
      }
      if (filenameStart < extensionStart) {
        return decode(hash.slice(filenameStart, extensionStart + 4));
      }
    }
  }
  return defaultFilename;
}
class StatTimer {
  #started = new Map();
  times = [];
  time(name) {
    if (this.#started.has(name)) {
      warn(`Timer is already running for ${name}`);
    }
    this.#started.set(name, Date.now());
  }
  timeEnd(name) {
    if (!this.#started.has(name)) {
      warn(`Timer has not been started for ${name}`);
    }
    this.times.push({
      name,
      start: this.#started.get(name),
      end: Date.now()
    });
    this.#started.delete(name);
  }
  toString() {
    const longest = Math.max(...this.times.map(t => t.name.length));
    return this.times.map(t => `${t.name.padEnd(longest)} ${t.end - t.start}ms\n`).join("");
  }
}
function isValidFetchUrl(url, baseUrl) {
  const res = baseUrl ? URL.parse(url, baseUrl) : URL.parse(url);
  return /https?:/.test(res?.protocol ?? "");
}
function noContextMenu(e) {
  e.preventDefault();
}
function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}
function deprecated(details) {
  console.log("Deprecated API usage: " + details);
}
class PDFDateString {
  static #regex;
  static toDateObject(input) {
    if (input instanceof Date) {
      return input;
    }
    if (!input || typeof input !== "string") {
      return null;
    }
    this.#regex ||= new RegExp("^D:" + "(\\d{4})" + "(\\d{2})?" + "(\\d{2})?" + "(\\d{2})?" + "(\\d{2})?" + "(\\d{2})?" + "([Z|+\\-])?" + "(\\d{2})?" + "'?" + "(\\d{2})?" + "'?");
    const matches = this.#regex.exec(input);
    if (!matches) {
      return null;
    }
    const year = parseInt(matches[1], 10);
    let month = parseInt(matches[2], 10);
    month = month >= 1 && month <= 12 ? month - 1 : 0;
    let day = parseInt(matches[3], 10);
    day = day >= 1 && day <= 31 ? day : 1;
    let hour = parseInt(matches[4], 10);
    hour = hour >= 0 && hour <= 23 ? hour : 0;
    let minute = parseInt(matches[5], 10);
    minute = minute >= 0 && minute <= 59 ? minute : 0;
    let second = parseInt(matches[6], 10);
    second = second >= 0 && second <= 59 ? second : 0;
    const universalTimeRelation = matches[7] || "Z";
    let offsetHour = parseInt(matches[8], 10);
    offsetHour = offsetHour >= 0 && offsetHour <= 23 ? offsetHour : 0;
    let offsetMinute = parseInt(matches[9], 10) || 0;
    offsetMinute = offsetMinute >= 0 && offsetMinute <= 59 ? offsetMinute : 0;
    if (universalTimeRelation === "-") {
      hour += offsetHour;
      minute += offsetMinute;
    } else if (universalTimeRelation === "+") {
      hour -= offsetHour;
      minute -= offsetMinute;
    }
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
}
function getRGBA(color) {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1];
  }
  if (color.startsWith("rgb(")) {
    const [r, g, b] = color.slice(4, -1).split(",").map(x => parseInt(x, 10));
    return [r, g, b, 1];
  }
  if (color.startsWith("rgba(")) {
    const parts = color.slice(5, -1).split(",");
    return [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10), parseFloat(parts[3])];
  }
  const m = color.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+|none))?\)$/);
  if (m) {
    return [Math.round(parseFloat(m[1]) * 255), Math.round(parseFloat(m[2]) * 255), Math.round(parseFloat(m[3]) * 255), m[4] !== undefined && m[4] !== "none" ? parseFloat(m[4]) : 1];
  }
  return null;
}
function getRGB(color) {
  const rgba = getRGBA(color);
  if (!rgba) {
    warn(`Not a valid color format: "${color}"`);
    return [0, 0, 0];
  }
  return rgba.slice(0, 3);
}
function getColorValues(colors) {
  const span = document.createElement("span");
  span.style.visibility = "hidden";
  span.style.colorScheme = "only light";
  document.body.append(span);
  for (const name of colors.keys()) {
    span.style.color = name;
    const computedColor = window.getComputedStyle(span).color;
    colors.set(name, getRGB(computedColor));
  }
  span.remove();
}
function getCurrentTransform(ctx) {
  const {
    a,
    b,
    c,
    d,
    e,
    f
  } = ctx.getTransform();
  return [a, b, c, d, e, f];
}
function getCurrentTransformInverse(ctx) {
  const {
    a,
    b,
    c,
    d,
    e,
    f
  } = ctx.getTransform().invertSelf();
  return [a, b, c, d, e, f];
}
function setLayerDimensions(div, viewport, mustFlip = false, mustRotate = true) {
  if (viewport instanceof PageViewport) {
    const {
      pageWidth,
      pageHeight
    } = viewport.rawDims;
    const {
      style
    } = div;
    const widthStr = `round(down, var(--total-scale-factor) * ${pageWidth}px, var(--scale-round-x))`,
      heightStr = `round(down, var(--total-scale-factor) * ${pageHeight}px, var(--scale-round-y))`;
    if (!mustFlip || viewport.rotation % 180 === 0) {
      style.width = widthStr;
      style.height = heightStr;
    } else {
      style.width = heightStr;
      style.height = widthStr;
    }
  }
  if (mustRotate) {
    div.setAttribute("data-main-rotation", viewport.rotation);
  }
}
class OutputScale {
  constructor() {
    const {
      pixelRatio
    } = OutputScale;
    this.sx = pixelRatio;
    this.sy = pixelRatio;
  }
  get scaled() {
    return this.sx !== 1 || this.sy !== 1;
  }
  get symmetric() {
    return this.sx === this.sy;
  }
  limitCanvas(width, height, maxPixels, maxDim, capAreaFactor = -1) {
    let maxAreaScale = Infinity,
      maxWidthScale = Infinity,
      maxHeightScale = Infinity;
    maxPixels = OutputScale.capPixels(maxPixels, capAreaFactor);
    if (maxPixels > 0) {
      maxAreaScale = Math.sqrt(maxPixels / (width * height));
    }
    if (maxDim !== -1) {
      maxWidthScale = maxDim / width;
      maxHeightScale = maxDim / height;
    }
    const maxScale = Math.min(maxAreaScale, maxWidthScale, maxHeightScale);
    if (this.sx > maxScale || this.sy > maxScale) {
      this.sx = maxScale;
      this.sy = maxScale;
      return true;
    }
    return false;
  }
  static get pixelRatio() {
    return globalThis.devicePixelRatio || 1;
  }
  static capPixels(maxPixels, capAreaFactor) {
    if (capAreaFactor >= 0) {
      const winPixels = Math.ceil(window.screen.availWidth * window.screen.availHeight * this.pixelRatio ** 2 * (1 + capAreaFactor / 100));
      return maxPixels > 0 ? Math.min(maxPixels, winPixels) : winPixels;
    }
    return maxPixels;
  }
}
const SupportedImageMimeTypes = ["image/apng", "image/avif", "image/bmp", "image/gif", "image/jpeg", "image/png", "image/svg+xml", "image/webp", "image/x-icon"];
class ColorScheme {
  static get isDarkMode() {
    return shadow(this, "isDarkMode", !!window?.matchMedia?.("(prefers-color-scheme: dark)").matches);
  }
}
class CSSConstants {
  static get commentForegroundColor() {
    const element = document.createElement("span");
    element.classList.add("comment", "sidebar");
    const {
      style
    } = element;
    style.width = style.height = "0";
    style.display = "none";
    style.color = "var(--comment-fg-color)";
    document.body.append(element);
    const {
      color
    } = window.getComputedStyle(element);
    element.remove();
    return shadow(this, "commentForegroundColor", getRGB(color));
  }
}
function applyOpacity(color, opacity) {
  opacity = MathClamp(opacity ?? 1, 0, 1);
  const white = 255 * (1 - opacity);
  return color.map(c => Math.round(c * opacity + white));
}
function RGBToHSL(rgb, output) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    output[0] = output[1] = 0;
  } else {
    const d = max - min;
    output[1] = l < 0.5 ? d / (max + min) : d / (2 - max - min);
    switch (max) {
      case r:
        output[0] = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        output[0] = ((b - r) / d + 2) * 60;
        break;
      case b:
        output[0] = ((r - g) / d + 4) * 60;
        break;
    }
  }
  output[2] = l;
}
function HSLToRGB(hsl, output) {
  const h = hsl[0];
  const s = hsl[1];
  const l = hsl[2];
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(h / 60 % 2 - 1));
  const m = l - c / 2;
  switch (Math.floor(h / 60)) {
    case 0:
      output[0] = c + m;
      output[1] = x + m;
      output[2] = m;
      break;
    case 1:
      output[0] = x + m;
      output[1] = c + m;
      output[2] = m;
      break;
    case 2:
      output[0] = m;
      output[1] = c + m;
      output[2] = x + m;
      break;
    case 3:
      output[0] = m;
      output[1] = x + m;
      output[2] = c + m;
      break;
    case 4:
      output[0] = x + m;
      output[1] = m;
      output[2] = c + m;
      break;
    case 5:
    case 6:
      output[0] = c + m;
      output[1] = m;
      output[2] = x + m;
      break;
  }
}
function computeLuminance(x) {
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
function contrastRatio(hsl1, hsl2, output) {
  HSLToRGB(hsl1, output);
  output.map(computeLuminance);
  const lum1 = 0.2126 * output[0] + 0.7152 * output[1] + 0.0722 * output[2];
  HSLToRGB(hsl2, output);
  output.map(computeLuminance);
  const lum2 = 0.2126 * output[0] + 0.7152 * output[1] + 0.0722 * output[2];
  return lum1 > lum2 ? (lum1 + 0.05) / (lum2 + 0.05) : (lum2 + 0.05) / (lum1 + 0.05);
}
const contrastCache = new Map();
function findContrastColor(baseColor, fixedColor) {
  const key = baseColor[0] + baseColor[1] * 0x100 + baseColor[2] * 0x10000 + fixedColor[0] * 0x1000000 + fixedColor[1] * 0x100000000 + fixedColor[2] * 0x10000000000;
  let cachedValue = contrastCache.get(key);
  if (cachedValue) {
    return cachedValue;
  }
  const array = new Float32Array(9);
  const output = array.subarray(0, 3);
  const baseHSL = array.subarray(3, 6);
  RGBToHSL(baseColor, baseHSL);
  const fixedHSL = array.subarray(6, 9);
  RGBToHSL(fixedColor, fixedHSL);
  const isFixedColorDark = fixedHSL[2] < 0.5;
  const minContrast = isFixedColorDark ? 12 : 4.5;
  baseHSL[2] = isFixedColorDark ? Math.sqrt(baseHSL[2]) : 1 - Math.sqrt(1 - baseHSL[2]);
  if (contrastRatio(baseHSL, fixedHSL, output) < minContrast) {
    let start, end;
    if (isFixedColorDark) {
      start = baseHSL[2];
      end = 1;
    } else {
      start = 0;
      end = baseHSL[2];
    }
    const PRECISION = 0.005;
    while (end - start > PRECISION) {
      const mid = baseHSL[2] = (start + end) / 2;
      if (isFixedColorDark === contrastRatio(baseHSL, fixedHSL, output) < minContrast) {
        start = mid;
      } else {
        end = mid;
      }
    }
    baseHSL[2] = isFixedColorDark ? end : start;
  }
  HSLToRGB(baseHSL, output);
  cachedValue = Util.makeHexColor(Math.round(output[0] * 255), Math.round(output[1] * 255), Math.round(output[2] * 255));
  contrastCache.set(key, cachedValue);
  return cachedValue;
}
function renderRichText({
  html,
  dir,
  className
}, container) {
  const fragment = document.createDocumentFragment();
  if (typeof html === "string") {
    const p = document.createElement("p");
    p.dir = dir || "auto";
    const lines = html.split(/\r\n?|\n/);
    for (let i = 0, ii = lines.length; i < ii; ++i) {
      const line = lines[i];
      p.append(document.createTextNode(line));
      if (i < ii - 1) {
        p.append(document.createElement("br"));
      }
    }
    fragment.append(p);
  } else {
    XfaLayer.render({
      xfaHtml: html,
      div: fragment,
      intent: "richText"
    });
  }
  fragment.firstElementChild.classList.add("richText", className);
  container.append(fragment);
}
function makePathFromDrawOPS(data) {
  const path = new Path2D();
  if (!data) {
    return path;
  }
  for (let i = 0, ii = data.length; i < ii;) {
    switch (data[i++]) {
      case DrawOPS.moveTo:
        path.moveTo(data[i++], data[i++]);
        break;
      case DrawOPS.lineTo:
        path.lineTo(data[i++], data[i++]);
        break;
      case DrawOPS.curveTo:
        path.bezierCurveTo(data[i++], data[i++], data[i++], data[i++], data[i++], data[i++]);
        break;
      case DrawOPS.quadraticCurveTo:
        path.quadraticCurveTo(data[i++], data[i++], data[i++], data[i++]);
        break;
      case DrawOPS.closePath:
        path.closePath();
        break;
      default:
        warn(`Unrecognized drawing path operator: ${data[i - 1]}`);
        break;
    }
  }
  return path;
}

;// ./src/display/editor/toolbar.js

class EditorToolbar {
  #toolbar = null;
  #colorPicker = null;
  #editor;
  #buttons = null;
  #altText = null;
  #comment = null;
  #commentButtonDivider = null;
  #signatureDescriptionButton = null;
  static #l10nRemove = null;
  constructor(editor) {
    this.#editor = editor;
    EditorToolbar.#l10nRemove ||= Object.freeze({
      freetext: "pdfjs-editor-remove-freetext-button",
      highlight: "pdfjs-editor-remove-highlight-button",
      ink: "pdfjs-editor-remove-ink-button",
      stamp: "pdfjs-editor-remove-stamp-button",
      signature: "pdfjs-editor-remove-signature-button"
    });
  }
  render() {
    const editToolbar = this.#toolbar = document.createElement("div");
    editToolbar.classList.add("editToolbar", "hidden");
    editToolbar.setAttribute("role", "toolbar");
    const signal = this.#editor._uiManager._signal;
    if (signal instanceof AbortSignal && !signal.aborted) {
      editToolbar.addEventListener("contextmenu", noContextMenu, {
        signal
      });
      editToolbar.addEventListener("pointerdown", EditorToolbar.#pointerDown, {
        signal
      });
    }
    const buttons = this.#buttons = document.createElement("div");
    buttons.className = "buttons";
    editToolbar.append(buttons);
    const position = this.#editor.toolbarPosition;
    if (position) {
      const {
        style
      } = editToolbar;
      const x = this.#editor._uiManager.direction === "ltr" ? 1 - position[0] : position[0];
      style.insetInlineEnd = `${100 * x}%`;
      style.top = `calc(${100 * position[1]}% + var(--editor-toolbar-vert-offset))`;
    }
    return editToolbar;
  }
  get div() {
    return this.#toolbar;
  }
  static #pointerDown(e) {
    e.stopPropagation();
  }
  #focusIn(e) {
    this.#editor._focusEventsAllowed = false;
    stopEvent(e);
  }
  #focusOut(e) {
    this.#editor._focusEventsAllowed = true;
    stopEvent(e);
  }
  #addListenersToElement(element) {
    const signal = this.#editor._uiManager._signal;
    if (!(signal instanceof AbortSignal) || signal.aborted) {
      return false;
    }
    element.addEventListener("focusin", this.#focusIn.bind(this), {
      capture: true,
      signal
    });
    element.addEventListener("focusout", this.#focusOut.bind(this), {
      capture: true,
      signal
    });
    element.addEventListener("contextmenu", noContextMenu, {
      signal
    });
    return true;
  }
  hide() {
    this.#toolbar.classList.add("hidden");
    this.#colorPicker?.hideDropdown();
  }
  show() {
    this.#toolbar.classList.remove("hidden");
    this.#altText?.shown();
    this.#comment?.shown();
  }
  addDeleteButton() {
    const {
      editorType,
      _uiManager
    } = this.#editor;
    const button = document.createElement("button");
    button.classList.add("basic", "deleteButton");
    button.tabIndex = 0;
    button.setAttribute("data-l10n-id", EditorToolbar.#l10nRemove[editorType]);
    if (this.#addListenersToElement(button)) {
      button.addEventListener("click", e => {
        _uiManager.delete();
      }, {
        signal: _uiManager._signal
      });
    }
    this.#buttons.append(button);
  }
  get #divider() {
    const divider = document.createElement("div");
    divider.className = "divider";
    return divider;
  }
  async addAltText(altText) {
    const button = await altText.render();
    this.#addListenersToElement(button);
    this.#buttons.append(button, this.#divider);
    this.#altText = altText;
  }
  addComment(comment, beforeElement = null) {
    if (this.#comment) {
      return;
    }
    const button = comment.renderForToolbar();
    if (!button) {
      return;
    }
    this.#addListenersToElement(button);
    const divider = this.#commentButtonDivider = this.#divider;
    if (!beforeElement) {
      this.#buttons.append(button, divider);
    } else {
      this.#buttons.insertBefore(button, beforeElement);
      this.#buttons.insertBefore(divider, beforeElement);
    }
    this.#comment = comment;
    comment.toolbar = this;
  }
  addColorPicker(colorPicker) {
    if (this.#colorPicker) {
      return;
    }
    this.#colorPicker = colorPicker;
    const button = colorPicker.renderButton();
    this.#addListenersToElement(button);
    this.#buttons.append(button, this.#divider);
  }
  async addEditSignatureButton(signatureManager) {
    const button = this.#signatureDescriptionButton = await signatureManager.renderEditButton(this.#editor);
    this.#addListenersToElement(button);
    this.#buttons.append(button, this.#divider);
  }
  removeButton(name) {
    switch (name) {
      case "comment":
        this.#comment?.removeToolbarCommentButton();
        this.#comment = null;
        this.#commentButtonDivider?.remove();
        this.#commentButtonDivider = null;
        break;
    }
  }
  async addButton(name, tool) {
    switch (name) {
      case "colorPicker":
        if (tool) {
          this.addColorPicker(tool);
        }
        break;
      case "altText":
        if (tool) {
          await this.addAltText(tool);
        }
        break;
      case "editSignature":
        if (tool) {
          await this.addEditSignatureButton(tool);
        }
        break;
      case "delete":
        this.addDeleteButton();
        break;
      case "comment":
        if (tool) {
          this.addComment(tool);
        }
        break;
    }
  }
  async addButtonBefore(name, tool, beforeSelector) {
    if (!tool && name === "comment") {
      return;
    }
    const beforeElement = this.#buttons.querySelector(beforeSelector);
    if (!beforeElement) {
      return;
    }
    if (name === "comment") {
      this.addComment(tool, beforeElement);
    }
  }
  updateEditSignatureButton(description) {
    if (this.#signatureDescriptionButton) {
      this.#signatureDescriptionButton.title = description;
    }
  }
  remove() {
    this.#toolbar.remove();
    this.#colorPicker?.destroy();
    this.#colorPicker = null;
  }
}
class FloatingToolbar {
  #buttons = null;
  #toolbar = null;
  #uiManager;
  constructor(uiManager) {
    this.#uiManager = uiManager;
  }
  #render() {
    const editToolbar = this.#toolbar = document.createElement("div");
    editToolbar.className = "editToolbar";
    editToolbar.setAttribute("role", "toolbar");
    editToolbar.dir = this.#uiManager.direction;
    const signal = this.#uiManager._signal;
    if (signal instanceof AbortSignal && !signal.aborted) {
      editToolbar.addEventListener("contextmenu", noContextMenu, {
        signal
      });
    }
    const buttons = this.#buttons = document.createElement("div");
    buttons.className = "buttons";
    editToolbar.append(buttons);
    if (this.#uiManager.hasCommentManager()) {
      this.#makeButton("commentButton", `pdfjs-comment-floating-button`, "pdfjs-comment-floating-button-label", () => {
        this.#uiManager.commentSelection("floating_button");
      });
    }
    this.#makeButton("highlightButton", `pdfjs-highlight-floating-button1`, "pdfjs-highlight-floating-button-label", () => {
      this.#uiManager.highlightSelection("floating_button");
    });
    return editToolbar;
  }
  #getLastPoint(boxes, isLTR) {
    let lastY = 0;
    let lastX = 0;
    for (const box of boxes) {
      const y = box.y + box.height;
      if (y < lastY) {
        continue;
      }
      const x = box.x + (isLTR ? box.width : 0);
      if (y > lastY) {
        lastX = x;
        lastY = y;
        continue;
      }
      if (isLTR) {
        if (x > lastX) {
          lastX = x;
        }
      } else if (x < lastX) {
        lastX = x;
      }
    }
    return [isLTR ? 1 - lastX : lastX, lastY];
  }
  show(parent, boxes, isLTR) {
    const [x, y] = this.#getLastPoint(boxes, isLTR);
    const {
      style
    } = this.#toolbar ||= this.#render();
    parent.append(this.#toolbar);
    style.insetInlineEnd = `${100 * x}%`;
    style.top = `calc(${100 * y}% + var(--editor-toolbar-vert-offset))`;
  }
  hide() {
    this.#toolbar.remove();
  }
  #makeButton(buttonClass, l10nId, labelL10nId, clickHandler) {
    const button = document.createElement("button");
    button.classList.add("basic", buttonClass);
    button.tabIndex = 0;
    button.setAttribute("data-l10n-id", l10nId);
    const span = document.createElement("span");
    button.append(span);
    span.className = "visuallyHidden";
    span.setAttribute("data-l10n-id", labelL10nId);
    const signal = this.#uiManager._signal;
    if (signal instanceof AbortSignal && !signal.aborted) {
      button.addEventListener("contextmenu", noContextMenu, {
        signal
      });
      button.addEventListener("click", clickHandler, {
        signal
      });
    }
    this.#buttons.append(button);
  }
}

;// ./src/shared/internal_evt.js
const INTERNAL_EVT = "59968104-cc61-4cf9-b570-014b35b3709c";
const internalOpt = Object.freeze({
  internal: INTERNAL_EVT
});

;// ./src/display/editor/tools.js




function bindEvents(obj, element, names) {
  for (const name of names) {
    element.addEventListener(name, obj[name].bind(obj));
  }
}
class CurrentPointers {
  static #pointerId = NaN;
  static #pointerIds = null;
  static #moveTimestamp = NaN;
  static #pointerType = null;
  static initializeAndAddPointerId(pointerId) {
    (CurrentPointers.#pointerIds ||= new Set()).add(pointerId);
  }
  static setPointer(pointerType, pointerId) {
    CurrentPointers.#pointerId ||= pointerId;
    CurrentPointers.#pointerType ??= pointerType;
  }
  static setTimeStamp(timeStamp) {
    CurrentPointers.#moveTimestamp = timeStamp;
  }
  static isSamePointerId(pointerId) {
    return CurrentPointers.#pointerId === pointerId;
  }
  static isSamePointerIdOrRemove(pointerId) {
    if (CurrentPointers.#pointerId === pointerId) {
      return true;
    }
    CurrentPointers.#pointerIds?.delete(pointerId);
    return false;
  }
  static isSamePointerType(pointerType) {
    return CurrentPointers.#pointerType === pointerType;
  }
  static isInitializedAndDifferentPointerType(pointerType) {
    return CurrentPointers.#pointerType !== null && !CurrentPointers.isSamePointerType(pointerType);
  }
  static isSameTimeStamp(timeStamp) {
    return CurrentPointers.#moveTimestamp === timeStamp;
  }
  static isUsingMultiplePointers() {
    return CurrentPointers.#pointerIds?.size >= 1;
  }
  static clearPointerType() {
    CurrentPointers.#pointerType = null;
  }
  static clearPointerIds() {
    CurrentPointers.#pointerId = NaN;
    CurrentPointers.#pointerIds = null;
  }
  static clearTimeStamp() {
    CurrentPointers.#moveTimestamp = NaN;
  }
}
class IdManager {
  #id = 0;
  get id() {
    return `${AnnotationEditorPrefix}${this.#id++}`;
  }
}
class ImageManager {
  #baseId = getUuid();
  #id = 0;
  #cache = null;
  static get _isSVGFittingCanvas() {
    const svg = `data:image/svg+xml;charset=UTF-8,<svg viewBox="0 0 1 1" width="1" height="1" xmlns="${SVG_NS}"><rect width="1" height="1" style="fill:red;"/></svg>`;
    const canvas = new OffscreenCanvas(1, 3);
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true
    });
    const image = new Image();
    image.src = svg;
    const promise = image.decode().then(() => {
      ctx.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 3);
      return new Uint32Array(ctx.getImageData(0, 0, 1, 1).data.buffer)[0] === 0;
    });
    return shadow(this, "_isSVGFittingCanvas", promise);
  }
  async #get(key, rawData) {
    this.#cache ||= new Map();
    let data = this.#cache.get(key);
    if (data === null) {
      return null;
    }
    if (data?.bitmap) {
      data.refCounter += 1;
      return data;
    }
    try {
      data ||= {
        bitmap: null,
        id: `image_${this.#baseId}_${this.#id++}`,
        refCounter: 0,
        isSvg: false
      };
      let image;
      if (typeof rawData === "string") {
        data.url = rawData;
        image = await fetchData(rawData, "blob");
      } else if (rawData instanceof File) {
        image = data.file = rawData;
      } else if (rawData instanceof Blob) {
        image = rawData;
      }
      if (image.type === "image/svg+xml") {
        const mustRemoveAspectRatioPromise = ImageManager._isSVGFittingCanvas;
        const fileReader = new FileReader();
        const imageElement = new Image();
        const imagePromise = new Promise((resolve, reject) => {
          imageElement.onload = () => {
            data.bitmap = imageElement;
            data.isSvg = true;
            resolve();
          };
          fileReader.onload = async () => {
            const url = data.svgUrl = fileReader.result;
            imageElement.src = (await mustRemoveAspectRatioPromise) ? `${url}#svgView(preserveAspectRatio(none))` : url;
          };
          imageElement.onerror = fileReader.onerror = reject;
        });
        fileReader.readAsDataURL(image);
        await imagePromise;
      } else {
        data.bitmap = await createImageBitmap(image);
      }
      data.refCounter = 1;
    } catch (e) {
      warn(e);
      data = null;
    }
    this.#cache.set(key, data);
    if (data) {
      this.#cache.set(data.id, data);
    }
    return data;
  }
  async getFromFile(file) {
    const {
      lastModified,
      name,
      size,
      type
    } = file;
    return this.#get(`${lastModified}_${name}_${size}_${type}`, file);
  }
  async getFromUrl(url) {
    return this.#get(url, url);
  }
  async getFromBlob(id, blobPromise) {
    const blob = await blobPromise;
    return this.#get(id, blob);
  }
  async getFromId(id) {
    this.#cache ||= new Map();
    const data = this.#cache.get(id);
    if (!data) {
      return null;
    }
    if (data.bitmap) {
      data.refCounter += 1;
      return data;
    }
    if (data.file) {
      return this.getFromFile(data.file);
    }
    if (data.blobPromise) {
      const {
        blobPromise
      } = data;
      delete data.blobPromise;
      return this.getFromBlob(data.id, blobPromise);
    }
    return this.getFromUrl(data.url);
  }
  getFromCanvas(id, canvas) {
    this.#cache ||= new Map();
    let data = this.#cache.get(id);
    if (data?.bitmap) {
      data.refCounter += 1;
      return data;
    }
    const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
    const ctx = offscreen.getContext("2d");
    ctx.drawImage(canvas, 0, 0);
    data = {
      bitmap: offscreen.transferToImageBitmap(),
      id: `image_${this.#baseId}_${this.#id++}`,
      refCounter: 1,
      isSvg: false
    };
    this.#cache.set(id, data);
    this.#cache.set(data.id, data);
    return data;
  }
  getSvgUrl(id) {
    const data = this.#cache.get(id);
    if (!data?.isSvg) {
      return null;
    }
    return data.svgUrl;
  }
  deleteId(id) {
    this.#cache ||= new Map();
    const data = this.#cache.get(id);
    if (!data) {
      return;
    }
    data.refCounter -= 1;
    if (data.refCounter !== 0) {
      return;
    }
    const {
      bitmap
    } = data;
    if (!data.url && !data.file) {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("bitmaprenderer");
      ctx.transferFromImageBitmap(bitmap);
      data.blobPromise = canvas.convertToBlob();
    }
    bitmap.close?.();
    data.bitmap = null;
  }
  isValidId(id) {
    return id.startsWith(`image_${this.#baseId}_`);
  }
}
class CommandManager {
  #commands = [];
  #locked = false;
  #maxSize;
  #position = -1;
  constructor(maxSize = 128) {
    this.#maxSize = maxSize;
  }
  add({
    cmd,
    undo,
    post,
    mustExec,
    type = NaN,
    overwriteIfSameType = false,
    keepUndo = false
  }) {
    if (mustExec) {
      cmd();
    }
    if (this.#locked) {
      return;
    }
    const save = {
      cmd,
      undo,
      post,
      type
    };
    if (this.#position === -1) {
      if (this.#commands.length > 0) {
        this.#commands.length = 0;
      }
      this.#position = 0;
      this.#commands.push(save);
      return;
    }
    if (overwriteIfSameType && this.#commands[this.#position].type === type) {
      if (keepUndo) {
        save.undo = this.#commands[this.#position].undo;
      }
      this.#commands[this.#position] = save;
      return;
    }
    const next = this.#position + 1;
    if (next === this.#maxSize) {
      this.#commands.splice(0, 1);
    } else {
      this.#position = next;
      if (next < this.#commands.length) {
        this.#commands.splice(next);
      }
    }
    this.#commands.push(save);
  }
  undo() {
    if (this.#position === -1) {
      return;
    }
    this.#locked = true;
    const {
      undo,
      post
    } = this.#commands[this.#position];
    undo();
    post?.();
    this.#locked = false;
    this.#position -= 1;
  }
  redo() {
    if (this.#position < this.#commands.length - 1) {
      this.#position += 1;
      this.#locked = true;
      const {
        cmd,
        post
      } = this.#commands[this.#position];
      cmd();
      post?.();
      this.#locked = false;
    }
  }
  hasSomethingToUndo() {
    return this.#position !== -1;
  }
  hasSomethingToRedo() {
    return this.#position < this.#commands.length - 1;
  }
  cleanType(type) {
    if (this.#position === -1) {
      return;
    }
    for (let i = this.#position; i >= 0; i--) {
      if (this.#commands[i].type !== type) {
        this.#commands.splice(i + 1, this.#position - i);
        this.#position = i;
        return;
      }
    }
    this.#commands.length = 0;
    this.#position = -1;
  }
  destroy() {
    this.#commands = null;
  }
}
class KeyboardManager {
  static ALT = 0x1;
  static CTRL = 0x2;
  static META = 0x4;
  static SHIFT = 0x8;
  constructor(callbacks) {
    this.callbacks = new Map();
    const {
      isMac
    } = FeatureTest.platform;
    for (const [keys, callback, options = {}] of callbacks) {
      const hasMacOverride = keys.some(k => k.startsWith("mac+"));
      for (const key of keys) {
        let shortcut = key;
        if (hasMacOverride) {
          const isMacKey = key.startsWith("mac+");
          if (isMac !== isMacKey) {
            continue;
          }
          if (isMacKey) {
            shortcut = key.slice(4);
          }
        }
        const [keyName, modifiers] = KeyboardManager.#parseShortcut(shortcut);
        if (keyName === null) {
          continue;
        }
        this.callbacks.getOrInsertComputed(keyName, makeArr).push({
          callback,
          options,
          modifiers
        });
      }
    }
  }
  static #parseShortcut(value) {
    let keyPart = null;
    let modifiers = 0;
    for (let part of value.split("+")) {
      part = part.trim();
      if (!part) {
        continue;
      }
      const upper = part.toUpperCase();
      const modifier = KeyboardManager[upper];
      if (modifier) {
        modifiers |= modifier;
        continue;
      }
      if (keyPart !== null) {
        warn(`KeyboardManager: multiple keys in shortcut "${value}"`);
        break;
      }
      keyPart = upper === "SPACE" ? " " : part;
    }
    if (keyPart === null) {
      warn(`KeyboardManager: no key found in shortcut "${value}"`);
    }
    return [keyPart, modifiers];
  }
  static #codeToKey(code) {
    const match = /^(?:Key([A-Z])|(?:Digit|Numpad)(\d))$/.exec(code);
    if (!match) {
      return null;
    }
    return match[1]?.toLowerCase() ?? match[2];
  }
  exec(self, event) {
    let shortcuts = this.callbacks.get(event.key);
    if (!shortcuts) {
      if (/^[a-z]$/i.test(event.key)) {
        return;
      }
      const fallback = KeyboardManager.#codeToKey(event.code);
      if (fallback === null || fallback === event.key) {
        return;
      }
      shortcuts = this.callbacks.get(fallback);
      if (!shortcuts) {
        return;
      }
    }
    const eventModifiers = (event.altKey ? KeyboardManager.ALT : 0) | (event.ctrlKey ? KeyboardManager.CTRL : 0) | (event.metaKey ? KeyboardManager.META : 0) | (event.shiftKey ? KeyboardManager.SHIFT : 0);
    const info = shortcuts.find(shortcut => shortcut.modifiers === eventModifiers);
    if (!info) {
      return;
    }
    const {
      callback,
      options: {
        bubbles = false,
        args = [],
        checker = null
      }
    } = info;
    if (checker && !checker(self, event)) {
      return;
    }
    callback.bind(self, ...args, event)();
    if (!bubbles) {
      stopEvent(event);
    }
  }
}
class ColorManager {
  static _colorsMapping = new Map([["CanvasText", [0, 0, 0]], ["Canvas", [255, 255, 255]]]);
  get _colors() {
    const colors = new Map([["CanvasText", null], ["Canvas", null]]);
    getColorValues(colors);
    return shadow(this, "_colors", colors);
  }
  convert(color) {
    const rgb = getRGB(color);
    if (!window.matchMedia("(forced-colors: active)").matches) {
      return rgb;
    }
    for (const [name, RGB] of this._colors) {
      if (RGB.every((x, i) => x === rgb[i])) {
        return ColorManager._colorsMapping.get(name);
      }
    }
    return rgb;
  }
  getHexCode(name) {
    const rgb = this._colors.get(name);
    if (!rgb) {
      return name;
    }
    return Util.makeHexColor(...rgb);
  }
}
class AnnotationEditorUIManager {
  #abortController = new AbortController();
  #activeEditor = null;
  #allEditableAnnotations = null;
  #allEditors = new Map();
  #allLayers = new Map();
  #savedAllLayers = null;
  #savedEditorsByPage = null;
  #altTextManager = null;
  #annotationStorage = null;
  #changedExistingAnnotations = null;
  #commandManager = new CommandManager();
  #commentManager = null;
  #copyPasteAC = null;
  #currentDrawingSession = null;
  #currentPageIndex = 0;
  #deletedAnnotationsElementIds = new Set();
  #draggingEditors = null;
  #editorTypes = null;
  #editorsToRescale = new Set();
  _editorUndoBar = null;
  #enableHighlightFloatingButton = false;
  #enableUpdatedAddImage = false;
  #enableNewAltTextWhenAddingImage = false;
  #filterFactory = null;
  #focusMainContainerTimeoutId = null;
  #focusManagerAC = null;
  #highlightColors = null;
  #highlightWhenShiftUp = false;
  #floatingToolbar = null;
  #idManager = new IdManager();
  #isEnabled = false;
  #isPointerDown = false;
  #isWaiting = false;
  #keyboardManagerAC = null;
  #lastActiveElement = null;
  #mainHighlightColorPicker = null;
  #missingCanvases = null;
  #mlManager = null;
  #mode = AnnotationEditorType.NONE;
  #selectedEditors = new Set();
  #selectedTextNode = null;
  #signatureManager = null;
  #pageColors = null;
  #showAllStates = null;
  #pdfDocument = null;
  #previousStates = {
    isEditing: false,
    isEmpty: true,
    hasSomethingToUndo: false,
    hasSomethingToRedo: false,
    hasSelectedEditor: false,
    hasSelectedText: false
  };
  #translation = [0, 0];
  #translationTimeoutId = null;
  #container = null;
  #viewer = null;
  #viewerAlert = null;
  #updateModeCapability = null;
  static TRANSLATE_SMALL = 1;
  static TRANSLATE_BIG = 10;
  static get _keyboardManager() {
    const proto = AnnotationEditorUIManager.prototype;
    const arrowChecker = self => self.#container.contains(document.activeElement) && document.activeElement.tagName !== "BUTTON" && self.hasSomethingToControl();
    const textInputChecker = (_self, {
      target: el
    }) => {
      if (el instanceof HTMLInputElement) {
        const {
          type
        } = el;
        return type !== "text" && type !== "number";
      }
      return true;
    };
    const small = this.TRANSLATE_SMALL;
    const big = this.TRANSLATE_BIG;
    return shadow(this, "_keyboardManager", new KeyboardManager([[["ctrl+a", "mac+meta+a"], proto.selectAll, {
      checker: textInputChecker
    }], [["ctrl+z", "mac+meta+z"], proto.undo, {
      checker: textInputChecker
    }], [["ctrl+y", "ctrl+shift+z", "mac+meta+shift+z", "ctrl+shift+Z", "mac+meta+shift+Z"], proto.redo, {
      checker: textInputChecker
    }], [["Backspace", "alt+Backspace", "ctrl+Backspace", "shift+Backspace", "mac+Backspace", "mac+alt+Backspace", "mac+ctrl+Backspace", "Delete", "ctrl+Delete", "shift+Delete", "mac+Delete"], proto.delete, {
      checker: textInputChecker
    }], [["Enter"], proto.addNewEditorFromKeyboard, {
      checker: (self, {
        target: el
      }) => !(el instanceof HTMLButtonElement) && self.#container.contains(el) && !self.isEnterHandled
    }], [["Space"], proto.addNewEditorFromKeyboard, {
      checker: (self, {
        target: el
      }) => !(el instanceof HTMLButtonElement) && self.#container.contains(document.activeElement)
    }], [["Escape"], proto.unselectAll], [["ArrowLeft"], proto.translateSelectedEditors, {
      args: [-small, 0],
      checker: arrowChecker
    }], [["ctrl+ArrowLeft", "mac+shift+ArrowLeft"], proto.translateSelectedEditors, {
      args: [-big, 0],
      checker: arrowChecker
    }], [["ArrowRight"], proto.translateSelectedEditors, {
      args: [small, 0],
      checker: arrowChecker
    }], [["ctrl+ArrowRight", "mac+shift+ArrowRight"], proto.translateSelectedEditors, {
      args: [big, 0],
      checker: arrowChecker
    }], [["ArrowUp"], proto.translateSelectedEditors, {
      args: [0, -small],
      checker: arrowChecker
    }], [["ctrl+ArrowUp", "mac+shift+ArrowUp"], proto.translateSelectedEditors, {
      args: [0, -big],
      checker: arrowChecker
    }], [["ArrowDown"], proto.translateSelectedEditors, {
      args: [0, small],
      checker: arrowChecker
    }], [["ctrl+ArrowDown", "mac+shift+ArrowDown"], proto.translateSelectedEditors, {
      args: [0, big],
      checker: arrowChecker
    }]]));
  }
  constructor(container, viewer, viewerAlert, altTextManager, commentManager, signatureManager, eventBus, pdfDocument, pageColors, highlightColors, enableHighlightFloatingButton, enableUpdatedAddImage, enableNewAltTextWhenAddingImage, mlManager, editorUndoBar, supportsPinchToZoom) {
    const signal = this._signal = this.#abortController.signal;
    this.#container = container;
    this.#viewer = viewer;
    this.#viewerAlert = viewerAlert;
    this.#altTextManager = altTextManager;
    this.#commentManager = commentManager;
    this.#signatureManager = signatureManager;
    this.#pdfDocument = pdfDocument;
    this._eventBus = eventBus;
    const evtOpts = {
      signal,
      ...internalOpt
    };
    eventBus.on("editingaction", this.onEditingAction.bind(this), evtOpts);
    eventBus.on("pagechanging", this.onPageChanging.bind(this), evtOpts);
    eventBus.on("scalechanging", this.onScaleChanging.bind(this), evtOpts);
    eventBus.on("rotationchanging", this.onRotationChanging.bind(this), evtOpts);
    eventBus.on("setpreference", this.onSetPreference.bind(this), evtOpts);
    eventBus.on("switchannotationeditorparams", evt => this.updateParams(evt.type, evt.value), evtOpts);
    window.addEventListener("pointerdown", () => {
      this.#isPointerDown = true;
    }, {
      capture: true,
      signal
    });
    window.addEventListener("pointerup", () => {
      this.#isPointerDown = false;
    }, {
      capture: true,
      signal
    });
    window.addEventListener("beforeunload", this.endCurrentEditing.bind(this), {
      capture: true,
      signal
    });
    this.#addSelectionListener();
    this.#addDragAndDropListeners();
    this.#addKeyboardManager();
    this.#annotationStorage = pdfDocument.annotationStorage;
    this.#filterFactory = pdfDocument.filterFactory;
    this.#pageColors = pageColors;
    this.#highlightColors = highlightColors || null;
    this.#enableHighlightFloatingButton = enableHighlightFloatingButton;
    this.#enableUpdatedAddImage = enableUpdatedAddImage;
    this.#enableNewAltTextWhenAddingImage = enableNewAltTextWhenAddingImage;
    this.#mlManager = mlManager || null;
    this.viewParameters = {
      realScale: PixelsPerInch.PDF_TO_CSS_UNITS,
      rotation: 0
    };
    this.isShiftKeyDown = false;
    this._editorUndoBar = editorUndoBar || null;
    this._supportsPinchToZoom = supportsPinchToZoom !== false;
    commentManager?.setSidebarUiManager(this);
  }
  destroy() {
    this.#updateModeCapability?.resolve();
    this.#updateModeCapability = null;
    this.#abortController?.abort();
    this.#abortController = null;
    this._signal = null;
    for (const layer of this.#allLayers.values()) {
      layer.destroy();
    }
    this.#allLayers.clear();
    this.#allEditors.clear();
    this.#editorsToRescale.clear();
    this.#missingCanvases?.clear();
    this.#activeEditor = null;
    this.#selectedEditors.clear();
    this.#commandManager.destroy();
    this.#altTextManager?.destroy();
    this.#commentManager?.destroy();
    this.#signatureManager?.destroy();
    this.#floatingToolbar?.hide();
    this.#floatingToolbar = null;
    this.#mainHighlightColorPicker?.destroy();
    this.#mainHighlightColorPicker = null;
    this.#allEditableAnnotations = null;
    if (this.#focusMainContainerTimeoutId) {
      clearTimeout(this.#focusMainContainerTimeoutId);
      this.#focusMainContainerTimeoutId = null;
    }
    if (this.#translationTimeoutId) {
      clearTimeout(this.#translationTimeoutId);
      this.#translationTimeoutId = null;
    }
    this._editorUndoBar?.destroy();
    this.#pdfDocument = null;
  }
  combinedSignal(ac) {
    return AbortSignal.any([this._signal, ac.signal]);
  }
  get mlManager() {
    return this.#mlManager;
  }
  get useNewAltTextFlow() {
    return this.#enableUpdatedAddImage;
  }
  get useNewAltTextWhenAddingImage() {
    return this.#enableNewAltTextWhenAddingImage;
  }
  get hcmFilter() {
    return shadow(this, "hcmFilter", this.#pageColors ? this.#filterFactory.addHCMFilter(this.#pageColors.foreground, this.#pageColors.background) : "none");
  }
  get direction() {
    return shadow(this, "direction", getComputedStyle(this.#container).direction);
  }
  get _highlightColors() {
    return shadow(this, "_highlightColors", this.#highlightColors ? new Map(this.#highlightColors.split(",").map(pair => {
      pair = pair.split("=").map(x => x.trim());
      pair[1] = pair[1].toUpperCase();
      return pair;
    })) : null);
  }
  get highlightColors() {
    const {
      _highlightColors
    } = this;
    if (!_highlightColors) {
      return shadow(this, "highlightColors", null);
    }
    const map = new Map();
    const hasHCM = !!this.#pageColors;
    for (const [name, color] of _highlightColors) {
      const isNameForHCM = name.endsWith("_HCM");
      if (hasHCM && isNameForHCM) {
        map.set(name.replace("_HCM", ""), color);
        continue;
      }
      if (!hasHCM && !isNameForHCM) {
        map.set(name, color);
      }
    }
    return shadow(this, "highlightColors", map);
  }
  get highlightColorNames() {
    return shadow(this, "highlightColorNames", this.highlightColors ? new Map(Array.from(this.highlightColors, e => e.reverse())) : null);
  }
  getNonHCMColor(color) {
    if (!this._highlightColors) {
      return color;
    }
    const colorName = this.highlightColorNames.get(color);
    return this._highlightColors.get(colorName) || color;
  }
  getNonHCMColorName(color) {
    return this.highlightColorNames.get(color) || color;
  }
  setCurrentDrawingSession(layer) {
    if (layer) {
      this.unselectAll();
      this.disableUserSelect(true);
    } else {
      this.disableUserSelect(false);
    }
    this.#currentDrawingSession = layer;
  }
  setMainHighlightColorPicker(colorPicker) {
    this.#mainHighlightColorPicker = colorPicker;
  }
  editAltText(editor, firstTime = false) {
    this.#altTextManager?.editAltText(this, editor, firstTime);
  }
  hasCommentManager() {
    return !!this.#commentManager;
  }
  editComment(editor, posX, posY, options) {
    this.#commentManager?.showDialog(this, editor, posX, posY, options);
  }
  selectComment(pageIndex, uid) {
    const layer = this.#allLayers.get(pageIndex);
    const editor = layer?.getEditorByUID(uid);
    editor?.toggleComment(true, true);
  }
  updateComment(editor) {
    this.#commentManager?.updateComment(editor.getData());
  }
  updatePopupColor(editor) {
    this.#commentManager?.updatePopupColor(editor);
  }
  removeComment(editor) {
    this.#commentManager?.removeComments([editor.uid]);
  }
  deleteComment(editor, savedData) {
    const undo = () => {
      editor.comment = savedData;
    };
    const cmd = () => {
      this._editorUndoBar?.show(undo, "comment");
      this.toggleComment(null);
      editor.comment = null;
    };
    this.addCommands({
      cmd,
      undo,
      mustExec: true
    });
  }
  toggleComment(editor, isSelected, visibility = undefined) {
    this.#commentManager?.toggleCommentPopup(editor, isSelected, visibility);
  }
  makeCommentColor(color, opacity) {
    return color && this.#commentManager?.makeCommentColor(color, opacity) || null;
  }
  getCommentDialogElement() {
    return this.#commentManager?.dialogElement || null;
  }
  async waitForEditorsRendered(pageNumber) {
    if (this.#allLayers.has(pageNumber - 1)) {
      return;
    }
    const {
      resolve,
      promise
    } = Promise.withResolvers();
    const onEditorsRendered = evt => {
      if (evt.pageNumber === pageNumber) {
        this._eventBus.off("editorsrendered", onEditorsRendered);
        resolve();
      }
    };
    this._eventBus.on("editorsrendered", onEditorsRendered, internalOpt);
    await promise;
  }
  getSignature(editor) {
    this.#signatureManager?.getSignature({
      uiManager: this,
      editor
    });
  }
  get signatureManager() {
    return this.#signatureManager;
  }
  switchToMode(mode, callback) {
    this._eventBus.on("annotationeditormodechanged", callback, {
      once: true,
      signal: this._signal,
      ...internalOpt
    });
    this._eventBus.dispatch("showannotationeditorui", {
      source: this,
      mode
    });
  }
  setPreference(name, value) {
    this._eventBus.dispatch("setpreference", {
      source: this,
      name,
      value
    });
  }
  onSetPreference({
    name,
    value
  }) {
    switch (name) {
      case "enableNewAltTextWhenAddingImage":
        this.#enableNewAltTextWhenAddingImage = value;
        break;
    }
  }
  onPageChanging({
    pageNumber
  }) {
    this.#currentPageIndex = pageNumber - 1;
  }
  deletePage(id) {
    for (const editor of this.getEditors(id)) {
      editor.remove();
    }
    this.#allLayers.delete(id);
    if (this.#currentPageIndex === id) {
      this.#currentPageIndex = 0;
    }
  }
  focusMainContainer() {
    this.#container.focus();
  }
  findParent(x, y) {
    for (const layer of this.#allLayers.values()) {
      const {
        x: layerX,
        y: layerY,
        width,
        height
      } = layer.div.getBoundingClientRect();
      if (x >= layerX && x <= layerX + width && y >= layerY && y <= layerY + height) {
        return layer;
      }
    }
    return null;
  }
  disableUserSelect(value = false) {
    this.#viewer.classList.toggle("noUserSelect", value);
  }
  addShouldRescale(editor) {
    this.#editorsToRescale.add(editor);
  }
  removeShouldRescale(editor) {
    this.#editorsToRescale.delete(editor);
  }
  onScaleChanging({
    scale
  }) {
    this.commitOrRemove();
    this.viewParameters.realScale = scale * PixelsPerInch.PDF_TO_CSS_UNITS;
    for (const editor of this.#editorsToRescale) {
      editor.onScaleChanging();
    }
    this.#currentDrawingSession?.onScaleChanging();
  }
  onRotationChanging({
    pagesRotation
  }) {
    this.commitOrRemove();
    this.viewParameters.rotation = pagesRotation;
  }
  #getAnchorElementForSelection({
    anchorNode
  }) {
    return anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
  }
  #getLayerForTextLayer(textLayer) {
    const {
      currentLayer
    } = this;
    if (currentLayer.hasTextLayer(textLayer)) {
      return currentLayer;
    }
    for (const layer of this.#allLayers.values()) {
      if (layer.hasTextLayer(textLayer)) {
        return layer;
      }
    }
    return null;
  }
  highlightSelection(methodOfCreation = "", comment = false) {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }
    const {
      anchorNode,
      anchorOffset,
      focusNode,
      focusOffset
    } = selection;
    const text = selection.toString();
    const anchorElement = this.#getAnchorElementForSelection(selection);
    const textLayer = anchorElement.closest(".textLayer");
    const boxes = this.getSelectionBoxes(textLayer);
    if (!boxes) {
      return;
    }
    selection.empty();
    const layer = this.#getLayerForTextLayer(textLayer);
    const isNoneMode = this.#mode === AnnotationEditorType.NONE;
    const callback = () => {
      const editor = layer?.createAndAddNewEditor({
        x: 0,
        y: 0
      }, false, {
        methodOfCreation,
        boxes,
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset,
        text
      });
      if (isNoneMode) {
        this.showAllEditors("highlight", true, true);
      }
      if (comment) {
        editor?.editComment();
      }
    };
    if (isNoneMode) {
      this.switchToMode(AnnotationEditorType.HIGHLIGHT, callback);
      return;
    }
    callback();
  }
  commentSelection(methodOfCreation = "") {
    this.highlightSelection(methodOfCreation, true);
  }
  endCurrentEditing() {
    this.commitOrRemove();
    this.currentLayer?.endDrawingSession(false);
  }
  #displayFloatingToolbar() {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }
    const anchorElement = this.#getAnchorElementForSelection(selection);
    const textLayer = anchorElement.closest(".textLayer");
    const boxes = this.getSelectionBoxes(textLayer);
    if (!boxes) {
      return;
    }
    this.#floatingToolbar ||= new FloatingToolbar(this);
    this.#floatingToolbar.show(textLayer, boxes, this.direction === "ltr");
  }
  getAndRemoveDataFromAnnotationStorage(annotationId) {
    if (!this.#annotationStorage) {
      return null;
    }
    const key = `${AnnotationEditorPrefix}${annotationId}`;
    const storedValue = this.#annotationStorage.getRawValue(key);
    if (storedValue) {
      this.#annotationStorage.remove(key);
    }
    return storedValue;
  }
  addToAnnotationStorage(editor) {
    if (!editor.isEmpty() && this.#annotationStorage && !this.#annotationStorage.has(editor.id)) {
      this.#annotationStorage.setValue(editor.id, editor);
    }
  }
  a11yAlert(messageId, args = null) {
    const viewerAlert = this.#viewerAlert;
    if (!viewerAlert) {
      return;
    }
    viewerAlert.setAttribute("data-l10n-id", messageId);
    if (args) {
      viewerAlert.setAttribute("data-l10n-args", JSON.stringify(args));
    } else {
      viewerAlert.removeAttribute("data-l10n-args");
    }
  }
  #selectionChange() {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      if (this.#selectedTextNode) {
        this.#floatingToolbar?.hide();
        this.#selectedTextNode = null;
        this.#dispatchUpdateStates({
          hasSelectedText: false
        });
      }
      return;
    }
    const {
      anchorNode
    } = selection;
    if (anchorNode === this.#selectedTextNode) {
      return;
    }
    const anchorElement = this.#getAnchorElementForSelection(selection);
    const textLayer = anchorElement.closest(".textLayer");
    if (!textLayer) {
      if (this.#selectedTextNode) {
        this.#floatingToolbar?.hide();
        this.#selectedTextNode = null;
        this.#dispatchUpdateStates({
          hasSelectedText: false
        });
      }
      return;
    }
    this.#floatingToolbar?.hide();
    this.#selectedTextNode = anchorNode;
    this.#dispatchUpdateStates({
      hasSelectedText: true
    });
    if (this.#mode !== AnnotationEditorType.HIGHLIGHT && this.#mode !== AnnotationEditorType.NONE) {
      return;
    }
    if (this.#mode === AnnotationEditorType.HIGHLIGHT) {
      this.showAllEditors("highlight", true, true);
    }
    this.#highlightWhenShiftUp = this.isShiftKeyDown;
    if (!this.isShiftKeyDown) {
      const activeLayer = this.#mode === AnnotationEditorType.HIGHLIGHT ? this.#getLayerForTextLayer(textLayer) : null;
      activeLayer?.toggleDrawing();
      if (this.#isPointerDown) {
        const ac = new AbortController();
        const signal = this.combinedSignal(ac);
        const pointerup = e => {
          if (e.type === "pointerup" && e.button !== 0) {
            return;
          }
          ac.abort();
          activeLayer?.toggleDrawing(true);
          if (e.type === "pointerup") {
            this.#onSelectEnd("main_toolbar");
          }
        };
        window.addEventListener("pointerup", pointerup, {
          signal
        });
        window.addEventListener("blur", pointerup, {
          signal
        });
      } else {
        activeLayer?.toggleDrawing(true);
        this.#onSelectEnd("main_toolbar");
      }
    }
  }
  #onSelectEnd(methodOfCreation = "") {
    if (this.#mode === AnnotationEditorType.HIGHLIGHT) {
      this.highlightSelection(methodOfCreation);
    } else if (this.#enableHighlightFloatingButton) {
      this.#displayFloatingToolbar();
    }
  }
  #addSelectionListener() {
    document.addEventListener("selectionchange", this.#selectionChange.bind(this), {
      signal: this._signal
    });
  }
  #addFocusManager() {
    if (this.#focusManagerAC) {
      return;
    }
    this.#focusManagerAC = new AbortController();
    const signal = this.combinedSignal(this.#focusManagerAC);
    window.addEventListener("focus", this.focus.bind(this), {
      signal
    });
    window.addEventListener("blur", this.blur.bind(this), {
      signal
    });
  }
  #removeFocusManager() {
    this.#focusManagerAC?.abort();
    this.#focusManagerAC = null;
  }
  blur() {
    this.isShiftKeyDown = false;
    if (this.#highlightWhenShiftUp) {
      this.#highlightWhenShiftUp = false;
      this.#onSelectEnd("main_toolbar");
    }
    if (!this.hasSelection) {
      return;
    }
    const {
      activeElement
    } = document;
    for (const editor of this.#selectedEditors) {
      if (editor.div.contains(activeElement)) {
        this.#lastActiveElement = [editor, activeElement];
        editor._focusEventsAllowed = false;
        break;
      }
    }
  }
  focus() {
    if (!this.#lastActiveElement) {
      return;
    }
    const [lastEditor, lastActiveElement] = this.#lastActiveElement;
    this.#lastActiveElement = null;
    lastActiveElement.addEventListener("focusin", () => {
      lastEditor._focusEventsAllowed = true;
    }, {
      once: true,
      signal: this._signal
    });
    lastActiveElement.focus();
  }
  #addKeyboardManager() {
    if (this.#keyboardManagerAC) {
      return;
    }
    this.#keyboardManagerAC = new AbortController();
    const signal = this.combinedSignal(this.#keyboardManagerAC);
    window.addEventListener("keydown", this.keydown.bind(this), {
      signal
    });
    window.addEventListener("keyup", this.keyup.bind(this), {
      signal
    });
  }
  #removeKeyboardManager() {
    this.#keyboardManagerAC?.abort();
    this.#keyboardManagerAC = null;
  }
  #addCopyPasteListeners() {
    if (this.#copyPasteAC) {
      return;
    }
    this.#copyPasteAC = new AbortController();
    const signal = this.combinedSignal(this.#copyPasteAC);
    document.addEventListener("copy", this.copy.bind(this), {
      signal
    });
    document.addEventListener("cut", this.cut.bind(this), {
      signal
    });
    document.addEventListener("paste", this.paste.bind(this), {
      signal
    });
  }
  #removeCopyPasteListeners() {
    this.#copyPasteAC?.abort();
    this.#copyPasteAC = null;
  }
  #addDragAndDropListeners() {
    const signal = this._signal;
    document.addEventListener("dragover", this.dragOver.bind(this), {
      signal
    });
    document.addEventListener("drop", this.drop.bind(this), {
      signal
    });
  }
  addEditListeners() {
    this.#addKeyboardManager();
    this.setEditingState(true);
  }
  removeEditListeners() {
    this.#removeKeyboardManager();
    this.setEditingState(false);
  }
  dragOver(event) {
    for (const {
      type
    } of event.dataTransfer.items) {
      for (const editorType of this.#editorTypes) {
        if (editorType.isHandlingMimeForPasting(type)) {
          event.dataTransfer.dropEffect = "copy";
          event.preventDefault();
          return;
        }
      }
    }
  }
  drop(event) {
    for (const item of event.dataTransfer.items) {
      for (const editorType of this.#editorTypes) {
        if (editorType.isHandlingMimeForPasting(item.type)) {
          editorType.paste(item, this.currentLayer);
          event.preventDefault();
          return;
        }
      }
    }
  }
  copy(event) {
    event.preventDefault();
    this.#activeEditor?.commitOrRemove();
    if (!this.hasSelection) {
      return;
    }
    const editors = [];
    for (const editor of this.#selectedEditors) {
      const serialized = editor.serialize(true);
      if (serialized) {
        editors.push(serialized);
      }
    }
    if (editors.length === 0) {
      return;
    }
    event.clipboardData.setData("application/pdfjs", JSON.stringify(editors));
  }
  cut(event) {
    this.copy(event);
    this.delete();
  }
  async paste(event) {
    event.preventDefault();
    const {
      clipboardData
    } = event;
    for (const item of clipboardData.items) {
      for (const editorType of this.#editorTypes) {
        if (editorType.isHandlingMimeForPasting(item.type)) {
          editorType.paste(item, this.currentLayer);
          return;
        }
      }
    }
    let data = clipboardData.getData("application/pdfjs");
    if (!data) {
      return;
    }
    try {
      data = JSON.parse(data);
    } catch (ex) {
      warn(`paste: "${ex.message}".`);
      return;
    }
    if (!Array.isArray(data)) {
      return;
    }
    this.unselectAll();
    const layer = this.currentLayer;
    try {
      const newEditors = [];
      for (const editor of data) {
        const deserializedEditor = await layer.deserialize(editor);
        if (!deserializedEditor) {
          return;
        }
        newEditors.push(deserializedEditor);
      }
      const cmd = () => {
        for (const editor of newEditors) {
          this.#addEditorToLayer(editor);
        }
        this.#selectEditors(newEditors);
      };
      const undo = () => {
        for (const editor of newEditors) {
          editor.remove();
        }
      };
      this.addCommands({
        cmd,
        undo,
        mustExec: true
      });
    } catch (ex) {
      warn(`paste: "${ex.message}".`);
    }
  }
  keydown(event) {
    if (!this.isShiftKeyDown && event.key === "Shift") {
      this.isShiftKeyDown = true;
    }
    if (this.#mode !== AnnotationEditorType.NONE && !this.isEditorHandlingKeyboard) {
      AnnotationEditorUIManager._keyboardManager.exec(this, event);
    }
  }
  keyup(event) {
    if (this.isShiftKeyDown && event.key === "Shift") {
      this.isShiftKeyDown = false;
      if (this.#highlightWhenShiftUp) {
        this.#highlightWhenShiftUp = false;
        this.#onSelectEnd("main_toolbar");
      }
    }
  }
  onEditingAction({
    name
  }) {
    switch (name) {
      case "undo":
      case "redo":
      case "delete":
      case "selectAll":
        this[name]();
        break;
      case "highlightSelection":
        this.highlightSelection("context_menu");
        break;
      case "commentSelection":
        this.commentSelection("context_menu");
        break;
    }
  }
  updatePageIndex(oldPageIndex, newPageIndex) {
    for (const editor of this.#savedEditorsByPage.get(oldPageIndex) || []) {
      editor.pageIndex = newPageIndex;
    }
    const layer = this.#savedAllLayers.get(oldPageIndex);
    if (layer) {
      layer.pageIndex = newPageIndex;
      this.#allLayers.set(newPageIndex, layer);
      if (this.#isEnabled) {
        layer.enable();
      } else {
        layer.disable();
      }
    }
  }
  startUpdatePages() {
    this.#savedAllLayers = new Map(this.#allLayers);
    this.#allLayers.clear();
    const savedEditorsByPage = this.#savedEditorsByPage = new Map();
    const saveEditor = editor => {
      savedEditorsByPage.getOrInsertComputed(editor.pageIndex, makeArr).push(editor);
    };
    for (const editor of this.#allEditors.values()) {
      saveEditor(editor);
    }
    for (const [id, editor] of this.#annotationStorage) {
      if (id.startsWith(AnnotationEditorPrefix) && !this.#allEditors.has(id) && Number.isInteger(editor?.pageIndex)) {
        saveEditor(editor);
      }
    }
  }
  endUpdatePages() {
    this.#savedAllLayers = null;
    this.#savedEditorsByPage = null;
  }
  clonePage(pageIndex, newPageIndex) {
    for (const editor of this.getEditors(pageIndex)) {
      const serialized = editor.serialize(editor.mode !== AnnotationEditorType.HIGHLIGHT);
      if (!serialized) {
        continue;
      }
      serialized.pageIndex = newPageIndex;
      serialized.id = this.getId();
      serialized.isClone = true;
      delete serialized.popupRef;
      this.#annotationStorage.setValue(serialized.id, serialized);
    }
  }
  findClonesForPage(layer) {
    const promises = [];
    const {
      pageIndex
    } = layer;
    for (const [id, editor] of this.#annotationStorage) {
      if (editor.pageIndex === pageIndex && editor.isClone) {
        this.#annotationStorage.remove(id);
        promises.push(layer.deserialize(editor).then(deserializedEditor => {
          if (deserializedEditor) {
            deserializedEditor.isClone = true;
            layer.addOrRebuild(deserializedEditor);
          }
        }));
      }
    }
    return Promise.all(promises);
  }
  #dispatchUpdateStates(details) {
    const hasChanged = Object.entries(details).some(([key, value]) => this.#previousStates[key] !== value);
    if (hasChanged) {
      this._eventBus.dispatch("editingstateschanged", {
        source: this,
        details: Object.assign(this.#previousStates, details)
      });
      if (this.#mode === AnnotationEditorType.HIGHLIGHT && details.hasSelectedEditor === false) {
        this.#dispatchUpdateUI([[AnnotationEditorParamsType.HIGHLIGHT_FREE, true]]);
      }
    }
  }
  #dispatchUpdateUI(details) {
    this._eventBus.dispatch("annotationeditorparamschanged", {
      source: this,
      details
    });
  }
  setEditingState(isEditing) {
    if (isEditing) {
      this.#addFocusManager();
      this.#addCopyPasteListeners();
      this.#dispatchUpdateStates({
        isEditing: this.#mode !== AnnotationEditorType.NONE,
        isEmpty: this.#isEmpty(),
        hasSomethingToUndo: this.#commandManager.hasSomethingToUndo(),
        hasSomethingToRedo: this.#commandManager.hasSomethingToRedo(),
        hasSelectedEditor: false
      });
    } else {
      this.#removeFocusManager();
      this.#removeCopyPasteListeners();
      this.#dispatchUpdateStates({
        isEditing: false
      });
      this.disableUserSelect(false);
    }
  }
  registerEditorTypes(types) {
    if (this.#editorTypes) {
      return;
    }
    this.#editorTypes = types;
    for (const editorType of this.#editorTypes) {
      this.#dispatchUpdateUI(editorType.defaultPropertiesToUpdate);
    }
  }
  getId() {
    return this.#idManager.id;
  }
  get currentLayer() {
    return this.#allLayers.get(this.#currentPageIndex);
  }
  getLayer(pageIndex) {
    return this.#allLayers.get(pageIndex);
  }
  get currentPageIndex() {
    return this.#currentPageIndex;
  }
  addLayer(layer) {
    this.#allLayers.set(layer.pageIndex, layer);
    if (this.#isEnabled) {
      layer.enable();
    } else {
      layer.disable();
    }
  }
  removeLayer(layer) {
    this.#allLayers.delete(layer.pageIndex);
  }
  async updateMode(mode, editId = null, isFromUser = false, isFromKeyboard = false, mustEnterInEditMode = false, editComment = false) {
    if (this.#mode === mode) {
      return;
    }
    if (this.#updateModeCapability) {
      await this.#updateModeCapability.promise;
      if (!this.#updateModeCapability) {
        return;
      }
    }
    this.#updateModeCapability = Promise.withResolvers();
    this.#currentDrawingSession?.commitOrRemove();
    if (this.#mode === AnnotationEditorType.POPUP) {
      this.#commentManager?.hideSidebar();
    }
    this.#commentManager?.destroyPopup();
    this.#mode = mode;
    if (mode === AnnotationEditorType.NONE) {
      this.setEditingState(false);
      this.#disableAll();
      for (const editor of this.#allEditors.values()) {
        editor.hideStandaloneCommentButton();
      }
      this._editorUndoBar?.hide();
      this.toggleComment(null);
      this.#updateModeCapability.resolve();
      return;
    }
    for (const editor of this.#allEditors.values()) {
      editor.addStandaloneCommentButton();
    }
    if (mode === AnnotationEditorType.SIGNATURE) {
      await this.#signatureManager?.loadSignatures();
    }
    if (isFromUser) {
      CurrentPointers.clearPointerType();
    }
    this.setEditingState(true);
    await this.#enableAll();
    this.unselectAll();
    for (const layer of this.#allLayers.values()) {
      layer.updateMode(mode);
    }
    if (mode === AnnotationEditorType.POPUP) {
      this.#allEditableAnnotations ||= await this.#pdfDocument.getAnnotationsByType(new Set(this.#editorTypes.map(editorClass => editorClass._editorType)));
      const elementIds = new Set();
      const allComments = [];
      for (const editor of this.#allEditors.values()) {
        const {
          annotationElementId,
          hasComment,
          deleted
        } = editor;
        if (annotationElementId) {
          elementIds.add(annotationElementId);
        }
        if (hasComment && !deleted) {
          allComments.push(editor.getData());
        }
      }
      for (const annotation of this.#allEditableAnnotations) {
        const {
          id,
          popupRef,
          contentsObj
        } = annotation;
        if (popupRef && contentsObj?.str && !elementIds.has(id) && !this.#deletedAnnotationsElementIds.has(id)) {
          allComments.push(annotation);
        }
      }
      this.#commentManager?.showSidebar(allComments);
    }
    if (!editId) {
      if (isFromKeyboard) {
        this.addNewEditorFromKeyboard();
      }
      this.#updateModeCapability.resolve();
      return;
    }
    for (const editor of this.#allEditors.values()) {
      if (editor.uid === editId) {
        this.setSelected(editor);
        if (editComment) {
          editor.editComment();
        } else if (mustEnterInEditMode) {
          editor.enterInEditMode();
        } else {
          editor.focus();
        }
      } else {
        editor.unselect();
      }
    }
    this.#updateModeCapability.resolve();
  }
  addNewEditorFromKeyboard() {
    if (this.currentLayer.canCreateNewEmptyEditor()) {
      this.currentLayer.addNewEditor();
    }
  }
  updateToolbar(options) {
    if (options.mode === this.#mode) {
      return;
    }
    this._eventBus.dispatch("switchannotationeditormode", {
      source: this,
      ...options
    });
  }
  updateParams(type, value) {
    if (!this.#editorTypes) {
      return;
    }
    switch (type) {
      case AnnotationEditorParamsType.CREATE:
        this.currentLayer.addNewEditor(value);
        return;
      case AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL:
        this._eventBus.dispatch("reporttelemetry", {
          source: this,
          details: {
            type: "editing",
            data: {
              type: "highlight",
              action: "toggle_visibility"
            }
          }
        });
        (this.#showAllStates ||= new Map()).set(type, value);
        this.showAllEditors("highlight", value);
        break;
    }
    if (this.hasSelection) {
      for (const editor of this.#selectedEditors) {
        editor.updateParams(type, value);
      }
    } else {
      for (const editorType of this.#editorTypes) {
        editorType.updateDefaultParams(type, value);
      }
    }
  }
  showAllEditors(type, visible, updateButton = false) {
    for (const editor of this.#allEditors.values()) {
      if (editor.editorType === type) {
        editor.show(visible);
      }
    }
    const state = this.#showAllStates?.get(AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL) ?? true;
    if (state !== visible) {
      this.#dispatchUpdateUI([[AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL, visible]]);
    }
  }
  enableWaiting(mustWait = false) {
    if (this.#isWaiting === mustWait) {
      return;
    }
    this.#isWaiting = mustWait;
    for (const layer of this.#allLayers.values()) {
      if (mustWait) {
        layer.disableClick();
      } else {
        layer.enableClick();
      }
      layer.div.classList.toggle("waiting", mustWait);
    }
  }
  async #enableAll() {
    if (!this.#isEnabled) {
      this.#isEnabled = true;
      const promises = [];
      for (const layer of this.#allLayers.values()) {
        promises.push(layer.enable());
      }
      await Promise.all(promises);
      for (const editor of this.#allEditors.values()) {
        editor.enable();
      }
    }
  }
  #disableAll() {
    this.unselectAll();
    if (this.#isEnabled) {
      this.#isEnabled = false;
      for (const layer of this.#allLayers.values()) {
        layer.disable();
      }
      for (const editor of this.#allEditors.values()) {
        editor.disable();
      }
    }
  }
  *getEditors(pageIndex) {
    for (const editor of this.#allEditors.values()) {
      if (editor.pageIndex === pageIndex) {
        yield editor;
      }
    }
  }
  getEditor(id) {
    return this.#allEditors.get(id);
  }
  addEditor(editor) {
    this.#allEditors.set(editor.id, editor);
  }
  removeEditor(editor) {
    if (editor.div.contains(document.activeElement)) {
      if (this.#focusMainContainerTimeoutId) {
        clearTimeout(this.#focusMainContainerTimeoutId);
      }
      this.#focusMainContainerTimeoutId = setTimeout(() => {
        this.focusMainContainer();
        this.#focusMainContainerTimeoutId = null;
      }, 0);
    }
    this.#allEditors.delete(editor.id);
    if (editor.annotationElementId) {
      this.#missingCanvases?.delete(editor.annotationElementId);
    }
    this.unselect(editor);
    if (!editor.annotationElementId || !this.#deletedAnnotationsElementIds.has(editor.annotationElementId)) {
      this.#annotationStorage?.remove(editor.id);
    }
  }
  addDeletedAnnotationElement(editor) {
    this.#deletedAnnotationsElementIds.add(editor.annotationElementId);
    this.addChangedExistingAnnotation(editor);
    editor.deleted = true;
  }
  isDeletedAnnotationElement(annotationElementId) {
    return this.#deletedAnnotationsElementIds.has(annotationElementId);
  }
  removeDeletedAnnotationElement(editor) {
    this.#deletedAnnotationsElementIds.delete(editor.annotationElementId);
    this.removeChangedExistingAnnotation(editor);
    editor.deleted = false;
  }
  #addEditorToLayer(editor) {
    const layer = this.#allLayers.get(editor.pageIndex);
    if (layer) {
      layer.addOrRebuild(editor);
    } else {
      this.addEditor(editor);
      this.addToAnnotationStorage(editor);
    }
  }
  setActiveEditor(editor) {
    if (this.#activeEditor === editor) {
      return;
    }
    this.#activeEditor = editor;
    if (editor) {
      this.#dispatchUpdateUI(editor.propertiesToUpdate);
    }
  }
  get #lastSelectedEditor() {
    let ed = null;
    for (ed of this.#selectedEditors) {}
    return ed;
  }
  updateUI(editor) {
    if (this.#lastSelectedEditor === editor) {
      this.#dispatchUpdateUI(editor.propertiesToUpdate);
    }
  }
  updateUIForDefaultProperties(editorType) {
    this.#dispatchUpdateUI(editorType.defaultPropertiesToUpdate);
  }
  toggleSelected(editor) {
    if (this.#selectedEditors.has(editor)) {
      this.#selectedEditors.delete(editor);
      editor.unselect();
      this.#dispatchUpdateStates({
        hasSelectedEditor: this.hasSelection
      });
      return;
    }
    this.#selectedEditors.add(editor);
    editor.select();
    this.#dispatchUpdateUI(editor.propertiesToUpdate);
    this.#dispatchUpdateStates({
      hasSelectedEditor: true
    });
  }
  setSelected(editor) {
    this.updateToolbar({
      mode: editor.mode,
      editId: editor.uid
    });
    this.#currentDrawingSession?.commitOrRemove();
    for (const ed of this.#selectedEditors) {
      if (ed !== editor) {
        ed.unselect();
      }
    }
    this.#commentManager?.destroyPopup();
    this.#selectedEditors.clear();
    this.#selectedEditors.add(editor);
    editor.select();
    this.#dispatchUpdateUI(editor.propertiesToUpdate);
    this.#dispatchUpdateStates({
      hasSelectedEditor: true
    });
  }
  get firstSelectedEditor() {
    return this.#selectedEditors.values().next().value;
  }
  unselect(editor) {
    editor.unselect();
    this.#selectedEditors.delete(editor);
    this.#dispatchUpdateStates({
      hasSelectedEditor: this.hasSelection
    });
  }
  get hasSelection() {
    return this.#selectedEditors.size !== 0;
  }
  get isEnterHandled() {
    return this.#selectedEditors.size === 1 && this.firstSelectedEditor.isEnterHandled;
  }
  undo() {
    this.#commandManager.undo();
    this.#dispatchUpdateStates({
      hasSomethingToUndo: this.#commandManager.hasSomethingToUndo(),
      hasSomethingToRedo: true,
      isEmpty: this.#isEmpty()
    });
    this._editorUndoBar?.hide();
  }
  redo() {
    this.#commandManager.redo();
    this.#dispatchUpdateStates({
      hasSomethingToUndo: true,
      hasSomethingToRedo: this.#commandManager.hasSomethingToRedo(),
      isEmpty: this.#isEmpty()
    });
  }
  addCommands(params) {
    this.#commandManager.add(params);
    this.#dispatchUpdateStates({
      hasSomethingToUndo: true,
      hasSomethingToRedo: false,
      isEmpty: this.#isEmpty()
    });
  }
  cleanUndoStack(type) {
    this.#commandManager.cleanType(type);
  }
  #isEmpty() {
    if (this.#allEditors.size === 0) {
      return true;
    }
    if (this.#allEditors.size === 1) {
      for (const editor of this.#allEditors.values()) {
        return editor.isEmpty();
      }
    }
    return false;
  }
  delete() {
    this.commitOrRemove();
    const drawingEditor = this.currentLayer?.endDrawingSession(true);
    if (!this.hasSelection && !drawingEditor) {
      return;
    }
    const editors = drawingEditor ? [drawingEditor] : [...this.#selectedEditors];
    const cmd = () => {
      this._editorUndoBar?.show(undo, editors.length === 1 ? editors[0].editorType : editors.length);
      for (const editor of editors) {
        editor.remove();
      }
    };
    const undo = () => {
      for (const editor of editors) {
        this.#addEditorToLayer(editor);
      }
    };
    this.addCommands({
      cmd,
      undo,
      mustExec: true
    });
  }
  commitOrRemove() {
    this.#activeEditor?.commitOrRemove();
  }
  hasSomethingToControl() {
    return this.#activeEditor || this.hasSelection;
  }
  #selectEditors(editors) {
    for (const editor of this.#selectedEditors) {
      editor.unselect();
    }
    this.#selectedEditors.clear();
    for (const editor of editors) {
      if (editor.isEmpty()) {
        continue;
      }
      this.#selectedEditors.add(editor);
      editor.select();
    }
    this.#dispatchUpdateStates({
      hasSelectedEditor: this.hasSelection
    });
  }
  selectAll() {
    for (const editor of this.#selectedEditors) {
      editor.commit();
    }
    this.#selectEditors(this.#allEditors.values());
  }
  unselectAll() {
    if (this.#activeEditor) {
      this.#activeEditor.commitOrRemove();
      if (this.#mode !== AnnotationEditorType.NONE) {
        return;
      }
    }
    if (this.#currentDrawingSession?.commitOrRemove()) {
      return;
    }
    this.#commentManager?.destroyPopup();
    if (!this.hasSelection) {
      return;
    }
    for (const editor of this.#selectedEditors) {
      editor.unselect();
    }
    this.#selectedEditors.clear();
    this.#dispatchUpdateStates({
      hasSelectedEditor: false
    });
  }
  translateSelectedEditors(x, y, noCommit = false) {
    if (!noCommit) {
      this.commitOrRemove();
    }
    if (!this.hasSelection) {
      return;
    }
    this.#translation[0] += x;
    this.#translation[1] += y;
    const [totalX, totalY] = this.#translation;
    const editors = [...this.#selectedEditors];
    const TIME_TO_WAIT = 1000;
    if (this.#translationTimeoutId) {
      clearTimeout(this.#translationTimeoutId);
    }
    this.#translationTimeoutId = setTimeout(() => {
      this.#translationTimeoutId = null;
      this.#translation[0] = this.#translation[1] = 0;
      this.addCommands({
        cmd: () => {
          for (const editor of editors) {
            if (this.#allEditors.has(editor.id)) {
              editor.translateInPage(totalX, totalY);
              editor.translationDone();
            }
          }
        },
        undo: () => {
          for (const editor of editors) {
            if (this.#allEditors.has(editor.id)) {
              editor.translateInPage(-totalX, -totalY);
              editor.translationDone();
            }
          }
        },
        mustExec: false
      });
    }, TIME_TO_WAIT);
    for (const editor of editors) {
      editor.translateInPage(x, y);
      editor.translationDone();
    }
  }
  setUpDragSession() {
    if (!this.hasSelection) {
      return;
    }
    this.disableUserSelect(true);
    this.#draggingEditors = new Map();
    for (const editor of this.#selectedEditors) {
      this.#draggingEditors.set(editor, {
        savedX: editor.x,
        savedY: editor.y,
        savedPageIndex: editor.pageIndex,
        newX: 0,
        newY: 0,
        newPageIndex: -1
      });
    }
  }
  endDragSession() {
    if (!this.#draggingEditors) {
      return false;
    }
    this.disableUserSelect(false);
    const map = this.#draggingEditors;
    this.#draggingEditors = null;
    let mustBeAddedInUndoStack = false;
    for (const [{
      x,
      y,
      pageIndex
    }, value] of map) {
      value.newX = x;
      value.newY = y;
      value.newPageIndex = pageIndex;
      mustBeAddedInUndoStack ||= x !== value.savedX || y !== value.savedY || pageIndex !== value.savedPageIndex;
    }
    if (!mustBeAddedInUndoStack) {
      return false;
    }
    const move = (editor, x, y, pageIndex) => {
      if (this.#allEditors.has(editor.id)) {
        const parent = this.#allLayers.get(pageIndex);
        if (parent) {
          editor._setParentAndPosition(parent, x, y);
        } else {
          editor.pageIndex = pageIndex;
          editor.x = x;
          editor.y = y;
        }
      }
    };
    this.addCommands({
      cmd: () => {
        for (const [editor, {
          newX,
          newY,
          newPageIndex
        }] of map) {
          move(editor, newX, newY, newPageIndex);
        }
      },
      undo: () => {
        for (const [editor, {
          savedX,
          savedY,
          savedPageIndex
        }] of map) {
          move(editor, savedX, savedY, savedPageIndex);
        }
      },
      mustExec: true
    });
    return true;
  }
  dragSelectedEditors(tx, ty) {
    if (!this.#draggingEditors) {
      return;
    }
    for (const editor of this.#draggingEditors.keys()) {
      editor.drag(tx, ty);
    }
  }
  rebuild(editor) {
    if (editor.parent === null) {
      const parent = this.getLayer(editor.pageIndex);
      if (parent) {
        parent.changeParent(editor);
        parent.addOrRebuild(editor);
      } else {
        this.addEditor(editor);
        this.addToAnnotationStorage(editor);
        editor.rebuild();
      }
    } else {
      editor.parent.addOrRebuild(editor);
    }
  }
  get isEditorHandlingKeyboard() {
    return this.getActive()?.shouldGetKeyboardEvents() || this.#selectedEditors.size === 1 && this.firstSelectedEditor.shouldGetKeyboardEvents();
  }
  isActive(editor) {
    return this.#activeEditor === editor;
  }
  getActive() {
    return this.#activeEditor;
  }
  getMode() {
    return this.#mode;
  }
  isEditingMode() {
    return this.#mode !== AnnotationEditorType.NONE;
  }
  get imageManager() {
    return shadow(this, "imageManager", new ImageManager());
  }
  getSelectionBoxes(textLayer) {
    if (!textLayer) {
      return null;
    }
    const selection = document.getSelection();
    for (let i = 0, ii = selection.rangeCount; i < ii; i++) {
      if (!textLayer.contains(selection.getRangeAt(i).commonAncestorContainer)) {
        return null;
      }
    }
    const {
      x: layerX,
      y: layerY,
      width: parentWidth,
      height: parentHeight
    } = textLayer.getBoundingClientRect();
    let rotator;
    switch (textLayer.getAttribute("data-main-rotation")) {
      case "90":
        rotator = (x, y, w, h) => ({
          x: (y - layerY) / parentHeight,
          y: 1 - (x + w - layerX) / parentWidth,
          width: h / parentHeight,
          height: w / parentWidth
        });
        break;
      case "180":
        rotator = (x, y, w, h) => ({
          x: 1 - (x + w - layerX) / parentWidth,
          y: 1 - (y + h - layerY) / parentHeight,
          width: w / parentWidth,
          height: h / parentHeight
        });
        break;
      case "270":
        rotator = (x, y, w, h) => ({
          x: 1 - (y + h - layerY) / parentHeight,
          y: (x - layerX) / parentWidth,
          width: h / parentHeight,
          height: w / parentWidth
        });
        break;
      default:
        rotator = (x, y, w, h) => ({
          x: (x - layerX) / parentWidth,
          y: (y - layerY) / parentHeight,
          width: w / parentWidth,
          height: h / parentHeight
        });
        break;
    }
    const boxes = [];
    for (let i = 0, ii = selection.rangeCount; i < ii; i++) {
      const range = selection.getRangeAt(i);
      if (range.collapsed) {
        continue;
      }
      for (const {
        x,
        y,
        width,
        height
      } of range.getClientRects()) {
        if (width === 0 || height === 0) {
          continue;
        }
        boxes.push(rotator(x, y, width, height));
      }
    }
    return boxes.length === 0 ? null : boxes;
  }
  addChangedExistingAnnotation({
    annotationElementId,
    id
  }) {
    (this.#changedExistingAnnotations ||= new Map()).set(annotationElementId, id);
  }
  removeChangedExistingAnnotation({
    annotationElementId
  }) {
    this.#changedExistingAnnotations?.delete(annotationElementId);
  }
  renderAnnotationElement(annotation) {
    const editorId = this.#changedExistingAnnotations?.get(annotation.data.id);
    if (!editorId) {
      return;
    }
    const editor = this.#annotationStorage.getRawValue(editorId);
    if (!editor) {
      return;
    }
    if (this.#mode === AnnotationEditorType.NONE && !editor.hasBeenModified) {
      return;
    }
    editor.renderAnnotationElement(annotation);
  }
  setMissingCanvas(annotationId, annotationElementId, canvas) {
    const editor = this.#missingCanvases?.get(annotationId);
    if (!editor) {
      return;
    }
    editor.setCanvas(annotationElementId, canvas);
    this.#missingCanvases.delete(annotationId);
  }
  addMissingCanvas(annotationId, editor) {
    (this.#missingCanvases ||= new Map()).set(annotationId, editor);
  }
}

;// ./src/display/editor/alt_text.js

class AltText {
  #altText = null;
  #altTextDecorative = false;
  #altTextButton = null;
  #altTextButtonLabel = null;
  #altTextTooltip = null;
  #altTextTooltipTimeout = null;
  #altTextWasFromKeyBoard = false;
  #badge = null;
  #editor = null;
  #guessedText = null;
  #textWithDisclaimer = null;
  #useNewAltTextFlow = false;
  static #l10nNewButton = null;
  static _l10n = null;
  constructor(editor) {
    this.#editor = editor;
    this.#useNewAltTextFlow = editor._uiManager.useNewAltTextFlow;
    AltText.#l10nNewButton ||= Object.freeze({
      added: "pdfjs-editor-new-alt-text-added-button",
      "added-label": "pdfjs-editor-new-alt-text-added-button-label",
      missing: "pdfjs-editor-new-alt-text-missing-button",
      "missing-label": "pdfjs-editor-new-alt-text-missing-button-label",
      review: "pdfjs-editor-new-alt-text-to-review-button",
      "review-label": "pdfjs-editor-new-alt-text-to-review-button-label"
    });
  }
  static initialize(l10n) {
    AltText._l10n ??= l10n;
  }
  async render() {
    const altText = this.#altTextButton = document.createElement("button");
    altText.className = "altText";
    altText.tabIndex = "0";
    const label = this.#altTextButtonLabel = document.createElement("span");
    altText.append(label);
    if (this.#useNewAltTextFlow) {
      altText.classList.add("new");
      altText.setAttribute("data-l10n-id", AltText.#l10nNewButton.missing);
      label.setAttribute("data-l10n-id", AltText.#l10nNewButton["missing-label"]);
    } else {
      altText.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-button");
      label.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-button-label");
    }
    const signal = this.#editor._uiManager._signal;
    altText.addEventListener("contextmenu", noContextMenu, {
      signal
    });
    altText.addEventListener("pointerdown", event => event.stopPropagation(), {
      signal
    });
    const onClick = event => {
      event.preventDefault();
      this.#editor._uiManager.editAltText(this.#editor);
      if (this.#useNewAltTextFlow) {
        this.#editor._reportTelemetry({
          action: "pdfjs.image.alt_text.image_status_label_clicked",
          data: {
            label: this.#label
          }
        });
      }
    };
    altText.addEventListener("click", onClick, {
      capture: true,
      signal
    });
    altText.addEventListener("keydown", event => {
      if (event.target === altText && event.key === "Enter") {
        this.#altTextWasFromKeyBoard = true;
        onClick(event);
      }
    }, {
      signal
    });
    await this.#setState();
    return altText;
  }
  get #label() {
    return this.#altText && "added" || this.#altText === null && this.guessedText && "review" || "missing";
  }
  finish() {
    if (!this.#altTextButton) {
      return;
    }
    this.#altTextButton.focus({
      focusVisible: this.#altTextWasFromKeyBoard
    });
    this.#altTextWasFromKeyBoard = false;
  }
  isEmpty() {
    return this.#useNewAltTextFlow ? this.#altText === null : !this.#altText && !this.#altTextDecorative;
  }
  hasData() {
    return this.#useNewAltTextFlow ? this.#altText !== null || !!this.#guessedText : this.isEmpty();
  }
  get guessedText() {
    return this.#guessedText;
  }
  async setGuessedText(guessedText) {
    if (this.#altText !== null) {
      return;
    }
    this.#guessedText = guessedText;
    this.#textWithDisclaimer = await AltText._l10n.get("pdfjs-editor-new-alt-text-generated-alt-text-with-disclaimer", {
      generatedAltText: guessedText
    });
    this.#setState();
  }
  toggleAltTextBadge(visibility = false) {
    if (!this.#useNewAltTextFlow || this.#altText) {
      this.#badge?.remove();
      this.#badge = null;
      return;
    }
    if (!this.#badge) {
      const badge = this.#badge = document.createElement("div");
      badge.className = "noAltTextBadge";
      this.#editor.div.append(badge);
    }
    this.#badge.classList.toggle("hidden", !visibility);
  }
  serialize(isForCopying) {
    let altText = this.#altText;
    if (!isForCopying && this.#guessedText === altText) {
      altText = this.#textWithDisclaimer;
    }
    return {
      altText,
      decorative: this.#altTextDecorative,
      guessedText: this.#guessedText,
      textWithDisclaimer: this.#textWithDisclaimer
    };
  }
  get data() {
    return {
      altText: this.#altText,
      decorative: this.#altTextDecorative
    };
  }
  set data({
    altText,
    decorative,
    guessedText,
    textWithDisclaimer,
    cancel = false
  }) {
    if (guessedText) {
      this.#guessedText = guessedText;
      this.#textWithDisclaimer = textWithDisclaimer;
    }
    if (this.#altText === altText && this.#altTextDecorative === decorative) {
      return;
    }
    if (!cancel) {
      this.#altText = altText;
      this.#altTextDecorative = decorative;
    }
    this.#setState();
  }
  toggle(enabled = false) {
    if (!this.#altTextButton) {
      return;
    }
    if (!enabled && this.#altTextTooltipTimeout) {
      clearTimeout(this.#altTextTooltipTimeout);
      this.#altTextTooltipTimeout = null;
    }
    this.#altTextButton.disabled = !enabled;
  }
  shown() {
    this.#editor._reportTelemetry({
      action: "pdfjs.image.alt_text.image_status_label_displayed",
      data: {
        label: this.#label
      }
    });
  }
  destroy() {
    this.#altTextButton?.remove();
    this.#altTextButton = null;
    this.#altTextButtonLabel = null;
    this.#altTextTooltip = null;
    this.#badge?.remove();
    this.#badge = null;
  }
  async #setState() {
    const button = this.#altTextButton;
    if (!button) {
      return;
    }
    if (this.#useNewAltTextFlow) {
      button.classList.toggle("done", !!this.#altText);
      button.setAttribute("data-l10n-id", AltText.#l10nNewButton[this.#label]);
      this.#altTextButtonLabel?.setAttribute("data-l10n-id", AltText.#l10nNewButton[`${this.#label}-label`]);
      if (!this.#altText) {
        this.#altTextTooltip?.remove();
        return;
      }
    } else {
      if (!this.#altText && !this.#altTextDecorative) {
        button.classList.remove("done");
        this.#altTextTooltip?.remove();
        return;
      }
      button.classList.add("done");
      button.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-edit-button");
    }
    let tooltip = this.#altTextTooltip;
    if (!tooltip) {
      this.#altTextTooltip = tooltip = document.createElement("span");
      tooltip.className = "tooltip";
      tooltip.setAttribute("role", "tooltip");
      tooltip.id = `alt-text-tooltip-${this.#editor.id}`;
      const DELAY_TO_SHOW_TOOLTIP = 100;
      const signal = this.#editor._uiManager._signal;
      signal.addEventListener("abort", () => {
        clearTimeout(this.#altTextTooltipTimeout);
        this.#altTextTooltipTimeout = null;
      }, {
        once: true
      });
      button.addEventListener("mouseenter", () => {
        this.#altTextTooltipTimeout = setTimeout(() => {
          this.#altTextTooltipTimeout = null;
          this.#altTextTooltip.classList.add("show");
          this.#editor._reportTelemetry({
            action: "alt_text_tooltip"
          });
        }, DELAY_TO_SHOW_TOOLTIP);
      }, {
        signal
      });
      button.addEventListener("mouseleave", () => {
        if (this.#altTextTooltipTimeout) {
          clearTimeout(this.#altTextTooltipTimeout);
          this.#altTextTooltipTimeout = null;
        }
        this.#altTextTooltip?.classList.remove("show");
      }, {
        signal
      });
    }
    if (this.#altTextDecorative) {
      tooltip.setAttribute("data-l10n-id", "pdfjs-editor-alt-text-decorative-tooltip");
    } else {
      tooltip.removeAttribute("data-l10n-id");
      tooltip.textContent = this.#altText;
    }
    if (!tooltip.parentNode) {
      button.append(tooltip);
    }
    const element = this.#editor.getElementForAltText();
    element?.setAttribute("aria-describedby", tooltip.id);
  }
}

;// ./src/display/editor/comment.js

class Comment {
  #commentStandaloneButton = null;
  #commentToolbarButton = null;
  #commentWasFromKeyBoard = false;
  #editor = null;
  #initialText = null;
  #richText = null;
  #text = null;
  #date = null;
  #deleted = false;
  #popupPosition = null;
  constructor(editor) {
    this.#editor = editor;
  }
  renderForToolbar() {
    const button = this.#commentToolbarButton = document.createElement("button");
    button.className = "comment";
    return this.#render(button, false);
  }
  renderForStandalone() {
    const button = this.#commentStandaloneButton = document.createElement("button");
    button.className = "annotationCommentButton";
    const position = this.#editor.commentButtonPosition;
    if (position) {
      const {
        style
      } = button;
      style.insetInlineEnd = `calc(${100 * (this.#editor._uiManager.direction === "ltr" ? 1 - position[0] : position[0])}% - var(--comment-button-dim))`;
      style.top = `calc(${100 * position[1]}% - var(--comment-button-dim))`;
      const color = this.#editor.commentButtonColor;
      if (color) {
        style.backgroundColor = color;
      }
    }
    return this.#render(button, true);
  }
  focusButton() {
    setTimeout(() => {
      (this.#commentStandaloneButton ?? this.#commentToolbarButton)?.focus();
    }, 0);
  }
  onUpdatedColor() {
    if (!this.#commentStandaloneButton) {
      return;
    }
    const color = this.#editor.commentButtonColor;
    if (color) {
      this.#commentStandaloneButton.style.backgroundColor = color;
    }
    this.#editor._uiManager.updatePopupColor(this.#editor);
  }
  get commentButtonWidth() {
    return (this.#commentStandaloneButton?.getBoundingClientRect().width ?? 0) / this.#editor.parent.boundingClientRect.width;
  }
  get commentPopupPositionInLayer() {
    if (this.#popupPosition) {
      return this.#popupPosition;
    }
    if (!this.#commentStandaloneButton) {
      return null;
    }
    const {
      x,
      y,
      height
    } = this.#commentStandaloneButton.getBoundingClientRect();
    const {
      x: parentX,
      y: parentY,
      width: parentWidth,
      height: parentHeight
    } = this.#editor.parent.boundingClientRect;
    return [(x - parentX) / parentWidth, (y + height - parentY) / parentHeight];
  }
  set commentPopupPositionInLayer(pos) {
    this.#popupPosition = pos;
  }
  hasDefaultPopupPosition() {
    return this.#popupPosition === null;
  }
  removeStandaloneCommentButton() {
    this.#commentStandaloneButton?.remove();
    this.#commentStandaloneButton = null;
  }
  removeToolbarCommentButton() {
    this.#commentToolbarButton?.remove();
    this.#commentToolbarButton = null;
  }
  setCommentButtonStates({
    selected,
    hasPopup
  }) {
    if (!this.#commentStandaloneButton) {
      return;
    }
    this.#commentStandaloneButton.classList.toggle("selected", selected);
    this.#commentStandaloneButton.ariaExpanded = hasPopup;
  }
  #render(comment, isStandalone) {
    if (!this.#editor._uiManager.hasCommentManager()) {
      return null;
    }
    comment.tabIndex = "0";
    comment.ariaHasPopup = "dialog";
    if (isStandalone) {
      comment.ariaControls = "commentPopup";
      comment.setAttribute("data-l10n-id", "pdfjs-show-comment-button");
    } else {
      comment.ariaControlsElements = [this.#editor._uiManager.getCommentDialogElement()];
      comment.setAttribute("data-l10n-id", "pdfjs-editor-add-comment-button");
    }
    const signal = this.#editor._uiManager._signal;
    if (!(signal instanceof AbortSignal) || signal.aborted) {
      return comment;
    }
    comment.addEventListener("contextmenu", noContextMenu, {
      signal
    });
    if (isStandalone) {
      comment.addEventListener("focusin", e => {
        this.#editor._focusEventsAllowed = false;
        stopEvent(e);
      }, {
        capture: true,
        signal
      });
      comment.addEventListener("focusout", e => {
        this.#editor._focusEventsAllowed = true;
        stopEvent(e);
      }, {
        capture: true,
        signal
      });
    }
    comment.addEventListener("pointerdown", event => event.stopPropagation(), {
      signal
    });
    const onClick = event => {
      event.preventDefault();
      if (comment === this.#commentToolbarButton) {
        this.edit();
      } else {
        this.#editor.toggleComment(true);
      }
    };
    comment.addEventListener("click", onClick, {
      capture: true,
      signal
    });
    comment.addEventListener("keydown", event => {
      if (event.target === comment && event.key === "Enter") {
        this.#commentWasFromKeyBoard = true;
        onClick(event);
      }
    }, {
      signal
    });
    comment.addEventListener("pointerenter", () => {
      this.#editor.toggleComment(false, true);
    }, {
      signal
    });
    comment.addEventListener("pointerleave", () => {
      this.#editor.toggleComment(false, false);
    }, {
      signal
    });
    return comment;
  }
  edit(options) {
    const position = this.commentPopupPositionInLayer;
    let posX, posY;
    if (position) {
      [posX, posY] = position;
    } else {
      [posX, posY] = this.#editor.commentButtonPosition;
      const {
        width,
        height,
        x,
        y
      } = this.#editor;
      posX = x + posX * width;
      posY = y + posY * height;
    }
    const parentDimensions = this.#editor.parent.boundingClientRect;
    const {
      x: parentX,
      y: parentY,
      width: parentWidth,
      height: parentHeight
    } = parentDimensions;
    this.#editor._uiManager.editComment(this.#editor, parentX + posX * parentWidth, parentY + posY * parentHeight, {
      ...options,
      parentDimensions
    });
  }
  finish() {
    if (!this.#commentToolbarButton) {
      return;
    }
    this.#commentToolbarButton.focus({
      focusVisible: this.#commentWasFromKeyBoard
    });
    this.#commentWasFromKeyBoard = false;
  }
  isDeleted() {
    return this.#deleted || this.#text === "";
  }
  isEmpty() {
    return this.#text === null;
  }
  hasBeenEdited() {
    return this.isDeleted() || this.#text !== this.#initialText;
  }
  serialize() {
    return this.data;
  }
  get data() {
    return {
      text: this.#text,
      richText: this.#richText,
      date: this.#date,
      deleted: this.isDeleted()
    };
  }
  set data(text) {
    if (text !== this.#text) {
      this.#richText = null;
    }
    if (text === null) {
      this.#text = "";
      this.#deleted = true;
      return;
    }
    this.#text = text;
    this.#date = new Date();
    this.#deleted = false;
  }
  restoreData({
    text,
    richText,
    date
  }) {
    this.#text = text;
    this.#richText = richText;
    this.#date = date;
    this.#deleted = false;
  }
  setInitialText(text, richText = null) {
    this.#initialText = text;
    this.data = text;
    this.#date = null;
    this.#richText = richText;
  }
  shown() {}
  destroy() {
    this.#commentToolbarButton?.remove();
    this.#commentToolbarButton = null;
    this.#commentStandaloneButton?.remove();
    this.#commentStandaloneButton = null;
    this.#text = "";
    this.#richText = null;
    this.#date = null;
    this.#editor = null;
    this.#commentWasFromKeyBoard = false;
    this.#deleted = false;
  }
}

;// ./src/display/touch_manager.js

function preventDefault(evt) {
  evt.preventDefault();
}
const MIN_TOUCH_SPAN = 1e-4;
function stopTouchEvent(evt) {
  if (evt.cancelable) {
    stopEvent(evt);
    return true;
  }
  evt.stopPropagation();
  return false;
}
class TouchManager {
  #container;
  #isPinching = false;
  #isPinchingStopped = null;
  #isPinchingDisabled;
  #onPinchStart;
  #onPinching;
  #onPinchEnd;
  #onPanning;
  #ownsGesture = false;
  #pointerDownAC = null;
  #signal;
  #touchIds = new Set();
  #touchInfo = null;
  #touchManagerAC;
  #touchMoveAC = null;
  #unconfirmedPinch = 0;
  constructor({
    container,
    isPinchingDisabled = null,
    isPinchingStopped = null,
    onPinchStart = null,
    onPinching = null,
    onPinchEnd = null,
    onPanning = null,
    signal
  }) {
    this.#container = container;
    this.#isPinchingStopped = isPinchingStopped;
    this.#isPinchingDisabled = isPinchingDisabled;
    this.#onPinchStart = onPinchStart;
    this.#onPinching = onPinching;
    this.#onPinchEnd = onPinchEnd;
    this.#onPanning = onPanning;
    this.#touchManagerAC = new AbortController();
    this.#signal = AbortSignal.any([signal, this.#touchManagerAC.signal]);
    container.addEventListener("touchstart", this.#onTouchStart.bind(this), {
      passive: false,
      signal: this.#signal
    });
  }
  get MIN_TOUCH_DISTANCE_TO_PINCH() {
    return 35 / OutputScale.pixelRatio;
  }
  get MIN_TOUCH_DISTANCE_TO_SCALE() {
    return 4 / OutputScale.pixelRatio;
  }
  #onTouchStart(evt) {
    if (this.#isPinchingDisabled?.()) {
      return;
    }
    this.#pruneTouchIds(evt);
    const touchIds = this.#touchIds;
    for (const {
      identifier
    } of evt.changedTouches) {
      touchIds.add(identifier);
    }
    if (touchIds.size === 1) {
      this.#armPointerDown();
      return;
    }
    if (!this.#touchMoveAC) {
      this.#touchMoveAC = new AbortController();
      const signal = AbortSignal.any([this.#signal, this.#touchMoveAC.signal]);
      const container = this.#container;
      const opt = {
        signal,
        capture: false,
        passive: false
      };
      container.addEventListener("touchmove", this.#onTouchMove.bind(this), opt);
      const onTouchEnd = this.#onTouchEnd.bind(this);
      container.addEventListener("touchend", onTouchEnd, opt);
      container.addEventListener("touchcancel", onTouchEnd, opt);
      opt.capture = true;
      container.addEventListener("pointerdown", stopEvent, opt);
      container.addEventListener("pointermove", stopEvent, opt);
      container.addEventListener("pointercancel", preventDefault, opt);
      container.addEventListener("pointerup", preventDefault, opt);
      this.#onPinchStart?.();
    }
    this.#ownsGesture = stopTouchEvent(evt);
    this.#setTouchInfo(evt);
  }
  #armPointerDown() {
    if (this.#pointerDownAC) {
      return;
    }
    const pointerDownAC = this.#pointerDownAC = new AbortController();
    const signal = AbortSignal.any([this.#signal, pointerDownAC.signal]);
    const container = this.#container;
    const opts = {
      capture: true,
      signal,
      passive: false
    };
    const cancelPointerDown = e => {
      if (e.pointerType === "touch") {
        this.#pointerDownAC?.abort();
        this.#pointerDownAC = null;
      }
    };
    container.addEventListener("pointerdown", e => {
      if (e.pointerType === "touch") {
        stopEvent(e);
        cancelPointerDown(e);
      }
    }, opts);
    container.addEventListener("pointerup", cancelPointerDown, opts);
    container.addEventListener("pointercancel", cancelPointerDown, opts);
  }
  #pruneTouchIds(evt) {
    const previous = this.#touchIds;
    if (previous.size === 0) {
      return;
    }
    const touchIds = this.#touchIds = new Set();
    for (const {
      identifier
    } of evt.touches) {
      if (previous.has(identifier)) {
        touchIds.add(identifier);
      }
    }
  }
  #getTrackedTouches(evt) {
    const touchIds = this.#touchIds;
    const touches = [];
    for (const touch of evt.touches) {
      if (touchIds.has(touch.identifier)) {
        touches.push(touch);
      }
    }
    return touches;
  }
  #setTouchInfo(evt) {
    const touches = this.#getTrackedTouches(evt);
    if (touches.length !== 2 || this.#isPinchingStopped?.()) {
      this.#touchInfo = null;
      return;
    }
    const [touch0, touch1] = touches;
    this.#touchInfo = {
      touch0X: touch0.screenX,
      touch0Y: touch0.screenY,
      touch1X: touch1.screenX,
      touch1Y: touch1.screenY,
      panX: (touch0.clientX + touch1.clientX) / 2,
      panY: (touch0.clientY + touch1.clientY) / 2,
      screenPanX: (touch0.screenX + touch1.screenX) / 2,
      screenPanY: (touch0.screenY + touch1.screenY) / 2
    };
  }
  #onTouchMove(evt) {
    if (!this.#touchInfo) {
      return;
    }
    const touches = this.#getTrackedTouches(evt);
    if (touches.length !== 2) {
      return;
    }
    const wasOwned = this.#ownsGesture;
    this.#ownsGesture = stopTouchEvent(evt);
    if (!this.#ownsGesture) {
      return;
    }
    if (!wasOwned) {
      this.#setTouchInfo(evt);
      return;
    }
    const [touch0, touch1] = touches;
    const {
      screenX: screen0X,
      screenY: screen0Y
    } = touch0;
    const {
      screenX: screen1X,
      screenY: screen1Y
    } = touch1;
    const touchInfo = this.#touchInfo;
    const {
      touch0X: pTouch0X,
      touch0Y: pTouch0Y,
      touch1X: pTouch1X,
      touch1Y: pTouch1Y,
      panX: pPanX,
      panY: pPanY
    } = touchInfo;
    const prevGapX = pTouch1X - pTouch0X;
    const prevGapY = pTouch1Y - pTouch0Y;
    const currGapX = screen1X - screen0X;
    const currGapY = screen1Y - screen0Y;
    const panX = (touch0.clientX + touch1.clientX) / 2;
    const panY = (touch0.clientY + touch1.clientY) / 2;
    touchInfo.panX = panX;
    touchInfo.panY = panY;
    const dx = panX - pPanX;
    const dy = panY - pPanY;
    const screenPanX = (screen0X + screen1X) / 2;
    const screenPanY = (screen0Y + screen1Y) / 2;
    const translation = Math.hypot(screenPanX - touchInfo.screenPanX, screenPanY - touchInfo.screenPanY);
    touchInfo.screenPanX = screenPanX;
    touchInfo.screenPanY = screenPanY;
    const distance = Math.hypot(currGapX, currGapY);
    const pDistance = Math.hypot(prevGapX, prevGapY);
    const minDistance = this.#isPinching ? this.MIN_TOUCH_DISTANCE_TO_SCALE : this.MIN_TOUCH_DISTANCE_TO_PINCH + 2 * translation;
    if (distance < MIN_TOUCH_SPAN || pDistance < MIN_TOUCH_SPAN || Math.abs(pDistance - distance) <= minDistance) {
      if (dx || dy) {
        this.#onPanning?.(dx, dy);
      }
      return;
    }
    touchInfo.touch0X = screen0X;
    touchInfo.touch0Y = screen0Y;
    touchInfo.touch1X = screen1X;
    touchInfo.touch1Y = screen1Y;
    const direction = Math.sign(distance - pDistance);
    if (!this.#isPinching) {
      this.#isPinching = true;
      this.#unconfirmedPinch = direction;
      if (dx || dy) {
        this.#onPanning?.(dx, dy);
      }
      return;
    }
    if (this.#unconfirmedPinch) {
      const unconfirmed = this.#unconfirmedPinch;
      this.#unconfirmedPinch = 0;
      if (direction !== unconfirmed && Math.abs(distance - pDistance) <= 2 * translation) {
        this.#isPinching = false;
        if (dx || dy) {
          this.#onPanning?.(dx, dy);
        }
        return;
      }
    }
    this.#onPinching?.([pPanX, pPanY], pDistance, distance, dx, dy);
  }
  #onTouchEnd(evt) {
    this.#pruneTouchIds(evt);
    if (this.#touchIds.size >= 2) {
      this.#setTouchInfo(evt);
      return;
    }
    const wasTracking = !!this.#touchInfo;
    this.#endGesture();
    if (this.#touchIds.size === 1) {
      this.#armPointerDown();
    }
    if (wasTracking) {
      stopTouchEvent(evt);
    }
  }
  #endGesture() {
    this.#touchInfo = null;
    this.#isPinching = false;
    this.#unconfirmedPinch = 0;
    this.#ownsGesture = false;
    if (this.#touchMoveAC) {
      this.#touchMoveAC.abort();
      this.#touchMoveAC = null;
      this.#onPinchEnd?.();
    }
  }
  destroy() {
    this.#endGesture();
    this.#touchIds.clear();
    this.#touchManagerAC?.abort();
    this.#touchManagerAC = null;
    this.#pointerDownAC?.abort();
    this.#pointerDownAC = null;
  }
}

;// ./src/display/editor/editor.js








class AnnotationEditor {
  #accessibilityData = null;
  #allResizerDivs = null;
  #altText = null;
  #comment = null;
  #commentStandaloneButton = null;
  #disabled = false;
  #dragPointerId = null;
  #dragPointerType = "";
  #resizersDiv = null;
  #lastPointerCoords = null;
  #savedDimensions = null;
  #fakeAnnotation = null;
  #focusAC = null;
  #focusedResizerName = "";
  #hasBeenClicked = false;
  #initialRect = null;
  #isEditing = false;
  #isInEditMode = false;
  #isResizerEnabledForKeyboard = false;
  #moveInDOMTimeout = null;
  #prevDragX = 0;
  #prevDragY = 0;
  #telemetryTimeouts = null;
  #touchManager = null;
  isSelected = false;
  _isCopy = false;
  _editToolbar = null;
  _initialOptions = Object.create(null);
  _initialData = null;
  _isVisible = true;
  _uiManager = null;
  _focusEventsAllowed = true;
  static _l10n = null;
  static _l10nAlert = null;
  static _l10nResizer = null;
  #isDraggable = false;
  #zIndex = AnnotationEditor._zIndex++;
  static _borderLineWidth = -1;
  static _colorManager = new ColorManager();
  static _zIndex = 1;
  static _telemetryTimeout = 1000;
  static get _resizerKeyboardManager() {
    const resize = AnnotationEditor.prototype._resizeWithKeyboard;
    const small = AnnotationEditorUIManager.TRANSLATE_SMALL;
    const big = AnnotationEditorUIManager.TRANSLATE_BIG;
    return shadow(this, "_resizerKeyboardManager", new KeyboardManager([[["ArrowLeft"], resize, {
      args: [-small, 0]
    }], [["ctrl+ArrowLeft", "mac+shift+ArrowLeft"], resize, {
      args: [-big, 0]
    }], [["ArrowRight"], resize, {
      args: [small, 0]
    }], [["ctrl+ArrowRight", "mac+shift+ArrowRight"], resize, {
      args: [big, 0]
    }], [["ArrowUp"], resize, {
      args: [0, -small]
    }], [["ctrl+ArrowUp", "mac+shift+ArrowUp"], resize, {
      args: [0, -big]
    }], [["ArrowDown"], resize, {
      args: [0, small]
    }], [["ctrl+ArrowDown", "mac+shift+ArrowDown"], resize, {
      args: [0, big]
    }], [["Escape"], AnnotationEditor.prototype._stopResizingWithKeyboard]]));
  }
  constructor(parameters) {
    this.parent = parameters.parent;
    this.id = parameters.id;
    this.width = this.height = null;
    this.pageIndex = parameters.parent.pageIndex;
    this.name = parameters.name;
    this.div = null;
    this._uiManager = parameters.uiManager;
    this.annotationElementId = null;
    this._willKeepAspectRatio = false;
    this._initialOptions.isCentered = parameters.isCentered;
    this._structTreeParentId = null;
    this.annotationElementId = parameters.annotationElementId || null;
    this.creationDate = parameters.creationDate || new Date();
    this.modificationDate = parameters.modificationDate || null;
    this.canAddComment = true;
    const {
      rotation,
      rawDims: {
        pageWidth,
        pageHeight,
        pageX,
        pageY
      }
    } = this.parent.viewport;
    this.rotation = rotation;
    this.pageRotation = (360 + rotation - this._uiManager.viewParameters.rotation) % 360;
    this.pageDimensions = [pageWidth, pageHeight];
    this.pageTranslation = [pageX, pageY];
    const [width, height] = this.parentDimensions;
    this.x = parameters.x / width;
    this.y = parameters.y / height;
    this.isAttachedToDOM = false;
    this.deleted = false;
  }
  updatePageIndex(newPageIndex) {
    this.pageIndex = newPageIndex;
  }
  get editorType() {
    return Object.getPrototypeOf(this).constructor._type;
  }
  get mode() {
    return Object.getPrototypeOf(this).constructor._editorType;
  }
  static get isDrawer() {
    return false;
  }
  static get _defaultLineColor() {
    return shadow(this, "_defaultLineColor", this._colorManager.getHexCode("CanvasText"));
  }
  static deleteAnnotationElement(editor) {
    const fakeEditor = new FakeEditor({
      id: editor._uiManager.getId(),
      parent: editor.parent,
      uiManager: editor._uiManager
    });
    fakeEditor.annotationElementId = editor.annotationElementId;
    fakeEditor.deleted = true;
    fakeEditor._uiManager.addToAnnotationStorage(fakeEditor);
  }
  static initialize(l10n, _uiManager) {
    AnnotationEditor._l10n ??= l10n;
    AnnotationEditor._l10nAlert ??= Object.freeze({
      highlight: "pdfjs-editor-highlight-added-alert",
      freetext: "pdfjs-editor-freetext-added-alert",
      ink: "pdfjs-editor-ink-added-alert",
      stamp: "pdfjs-editor-stamp-added-alert",
      signature: "pdfjs-editor-signature-added-alert"
    });
    AnnotationEditor._l10nResizer ??= Object.freeze({
      topLeft: "pdfjs-editor-resizer-top-left",
      topMiddle: "pdfjs-editor-resizer-top-middle",
      topRight: "pdfjs-editor-resizer-top-right",
      middleRight: "pdfjs-editor-resizer-middle-right",
      bottomRight: "pdfjs-editor-resizer-bottom-right",
      bottomMiddle: "pdfjs-editor-resizer-bottom-middle",
      bottomLeft: "pdfjs-editor-resizer-bottom-left",
      middleLeft: "pdfjs-editor-resizer-middle-left"
    });
    if (AnnotationEditor._borderLineWidth !== -1) {
      return;
    }
    const style = getComputedStyle(document.documentElement);
    AnnotationEditor._borderLineWidth = parseFloat(style.getPropertyValue("--outline-width")) || 0;
  }
  static updateDefaultParams(_type, _value) {}
  static get defaultPropertiesToUpdate() {
    return [];
  }
  static isHandlingMimeForPasting(mime) {
    return false;
  }
  static paste(item, parent) {
    unreachable("Not implemented");
  }
  get propertiesToUpdate() {
    return [];
  }
  get _isDraggable() {
    return this.#isDraggable;
  }
  set _isDraggable(value) {
    this.#isDraggable = value;
    this.div?.classList.toggle("draggable", value);
  }
  get uid() {
    return this.annotationElementId || this.id;
  }
  get isEnterHandled() {
    return true;
  }
  center() {
    const [pageWidth, pageHeight] = this.pageDimensions;
    switch (this.parentRotation) {
      case 90:
        this.x -= this.height * pageHeight / (pageWidth * 2);
        this.y += this.width * pageWidth / (pageHeight * 2);
        break;
      case 180:
        this.x += this.width / 2;
        this.y += this.height / 2;
        break;
      case 270:
        this.x += this.height * pageHeight / (pageWidth * 2);
        this.y -= this.width * pageWidth / (pageHeight * 2);
        break;
      default:
        this.x -= this.width / 2;
        this.y -= this.height / 2;
        break;
    }
    this.fixAndSetPosition();
  }
  addCommands(params) {
    this._uiManager.addCommands(params);
  }
  get currentLayer() {
    return this._uiManager.currentLayer;
  }
  setInBackground() {
    this.div.style.zIndex = 0;
  }
  setInForeground() {
    this.div.style.zIndex = this.#zIndex;
  }
  setParent(parent) {
    if (parent !== null) {
      this.pageIndex = parent.pageIndex;
      this.pageDimensions = parent.pageDimensions;
    } else {
      this.#stopResizing();
      this.#fakeAnnotation?.remove();
      this.#fakeAnnotation = null;
    }
    this.parent = parent;
  }
  focusin(event) {
    if (!this._focusEventsAllowed) {
      return;
    }
    if (!this.#hasBeenClicked) {
      this.parent.setSelected(this);
    } else {
      this.#hasBeenClicked = false;
    }
  }
  focusout(event) {
    if (!this._focusEventsAllowed) {
      return;
    }
    if (!this.isAttachedToDOM) {
      return;
    }
    const target = event.relatedTarget;
    if (target?.closest(`#${this.id}`)) {
      return;
    }
    event.preventDefault();
    if (!this.parent?.isMultipleSelection) {
      this.commitOrRemove();
    }
  }
  commitOrRemove() {
    if (this.isEmpty()) {
      this.remove();
    } else {
      this.commit();
    }
  }
  commit() {
    if (!this.isInEditMode()) {
      return;
    }
    this.addToAnnotationStorage();
  }
  addToAnnotationStorage() {
    this._uiManager.addToAnnotationStorage(this);
  }
  setAt(x, y, tx, ty) {
    const [width, height] = this.parentDimensions;
    [tx, ty] = this.screenToPageTranslation(tx, ty);
    this.x = (x + tx) / width;
    this.y = (y + ty) / height;
    this.fixAndSetPosition();
  }
  _moveAfterPaste(baseX, baseY) {
    if (this.isClone) {
      delete this.isClone;
      return;
    }
    const [parentWidth, parentHeight] = this.parentDimensions;
    this.setAt(baseX * parentWidth, baseY * parentHeight, this.width * parentWidth, this.height * parentHeight);
    this._onTranslated();
  }
  #translate([width, height], x, y) {
    [x, y] = this.screenToPageTranslation(x, y);
    this.x += x / width;
    this.y += y / height;
    this._onTranslating(this.x, this.y);
    this.fixAndSetPosition();
  }
  translate(x, y) {
    this.#translate(this.parentDimensions, x, y);
  }
  translateInPage(x, y) {
    this.#initialRect ||= [this.x, this.y, this.width, this.height];
    this.#translate(this.pageDimensions, x, y);
    this.div.scrollIntoView({
      block: "nearest"
    });
  }
  translationDone() {
    this._onTranslated(this.x, this.y);
  }
  drag(tx, ty) {
    this.#initialRect ||= [this.x, this.y, this.width, this.height];
    const {
      div,
      parentDimensions: [parentWidth, parentHeight]
    } = this;
    this.x += tx / parentWidth;
    this.y += ty / parentHeight;
    if (this.parent && (this.x < 0 || this.x > 1 || this.y < 0 || this.y > 1)) {
      const {
        x,
        y
      } = this.div.getBoundingClientRect();
      if (this.parent.findNewParent(this, x, y)) {
        this.x -= Math.floor(this.x);
        this.y -= Math.floor(this.y);
      }
    }
    let {
      x,
      y
    } = this;
    const [bx, by] = this.getBaseTranslation();
    x += bx;
    y += by;
    const {
      style
    } = div;
    style.left = `${(100 * x).toFixed(2)}%`;
    style.top = `${(100 * y).toFixed(2)}%`;
    this._onTranslating(x, y);
  }
  _onTranslating(x, y) {}
  _onTranslated(x, y) {}
  get _hasBeenMoved() {
    return !!this.#initialRect && (this.#initialRect[0] !== this.x || this.#initialRect[1] !== this.y);
  }
  get _hasBeenResized() {
    return !!this.#initialRect && (this.#initialRect[2] !== this.width || this.#initialRect[3] !== this.height);
  }
  getBaseTranslation() {
    const [parentWidth, parentHeight] = this.parentDimensions;
    const {
      _borderLineWidth
    } = AnnotationEditor;
    const x = _borderLineWidth / parentWidth;
    const y = _borderLineWidth / parentHeight;
    switch (this.rotation) {
      case 90:
        return [-x, y];
      case 180:
        return [x, y];
      case 270:
        return [x, -y];
      default:
        return [-x, -y];
    }
  }
  get _mustFixPosition() {
    return true;
  }
  fixAndSetPosition(rotation = this.rotation) {
    const {
      div: {
        style
      },
      pageDimensions: [pageWidth, pageHeight]
    } = this;
    let {
      x,
      y,
      width,
      height
    } = this;
    width *= pageWidth;
    height *= pageHeight;
    x *= pageWidth;
    y *= pageHeight;
    if (this._mustFixPosition) {
      switch (rotation) {
        case 0:
          x = MathClamp(x, 0, pageWidth - width);
          y = MathClamp(y, 0, pageHeight - height);
          break;
        case 90:
          x = MathClamp(x, 0, pageWidth - height);
          y = MathClamp(y, width, pageHeight);
          break;
        case 180:
          x = MathClamp(x, width, pageWidth);
          y = MathClamp(y, height, pageHeight);
          break;
        case 270:
          x = MathClamp(x, height, pageWidth);
          y = MathClamp(y, 0, pageHeight - width);
          break;
      }
    }
    this.x = x /= pageWidth;
    this.y = y /= pageHeight;
    const [bx, by] = this.getBaseTranslation();
    x += bx;
    y += by;
    style.left = `${(100 * x).toFixed(2)}%`;
    style.top = `${(100 * y).toFixed(2)}%`;
    this.moveInDOM();
  }
  static #rotatePoint(x, y, angle) {
    switch (angle) {
      case 90:
        return [y, -x];
      case 180:
        return [-x, -y];
      case 270:
        return [-y, x];
      default:
        return [x, y];
    }
  }
  screenToPageTranslation(x, y) {
    return AnnotationEditor.#rotatePoint(x, y, this.parentRotation);
  }
  pageTranslationToScreen(x, y) {
    return AnnotationEditor.#rotatePoint(x, y, 360 - this.parentRotation);
  }
  #getRotationMatrix(rotation) {
    switch (rotation) {
      case 90:
        {
          const [pageWidth, pageHeight] = this.pageDimensions;
          return [0, -pageWidth / pageHeight, pageHeight / pageWidth, 0];
        }
      case 180:
        return [-1, 0, 0, -1];
      case 270:
        {
          const [pageWidth, pageHeight] = this.pageDimensions;
          return [0, pageWidth / pageHeight, -pageHeight / pageWidth, 0];
        }
      default:
        return [1, 0, 0, 1];
    }
  }
  get parentScale() {
    return this._uiManager.viewParameters.realScale;
  }
  get parentRotation() {
    return (this._uiManager.viewParameters.rotation + this.pageRotation) % 360;
  }
  get parentDimensions() {
    const {
      parentScale,
      pageDimensions: [pageWidth, pageHeight]
    } = this;
    return [pageWidth * parentScale, pageHeight * parentScale];
  }
  setDims() {
    const {
      div: {
        style
      },
      width,
      height
    } = this;
    style.width = `${(100 * width).toFixed(2)}%`;
    style.height = `${(100 * height).toFixed(2)}%`;
  }
  getInitialTranslation() {
    return [0, 0];
  }
  #createResizers() {
    if (this.#resizersDiv) {
      return;
    }
    this.#resizersDiv = document.createElement("div");
    this.#resizersDiv.classList.add("resizers");
    const classes = this._willKeepAspectRatio ? ["topLeft", "topRight", "bottomRight", "bottomLeft"] : ["topLeft", "topMiddle", "topRight", "middleRight", "bottomRight", "bottomMiddle", "bottomLeft", "middleLeft"];
    const signal = this._uiManager._signal;
    for (const name of classes) {
      const div = document.createElement("div");
      this.#resizersDiv.append(div);
      div.classList.add("resizer", name);
      div.setAttribute("data-resizer-name", name);
      div.addEventListener("pointerdown", this.#resizerPointerdown.bind(this, name), {
        signal
      });
      div.addEventListener("contextmenu", noContextMenu, {
        signal
      });
      div.tabIndex = -1;
    }
    this.div.prepend(this.#resizersDiv);
  }
  #resizerPointerdown(name, event) {
    event.preventDefault();
    const {
      isMac
    } = FeatureTest.platform;
    if (event.button !== 0 || event.ctrlKey && isMac) {
      return;
    }
    this.#altText?.toggle(false);
    const savedDraggable = this._isDraggable;
    this._isDraggable = false;
    this.#lastPointerCoords = [event.screenX, event.screenY];
    const ac = new AbortController();
    const signal = this._uiManager.combinedSignal(ac);
    this.parent.togglePointerEvents(false);
    window.addEventListener("pointermove", this.#resizerPointermove.bind(this, name), {
      passive: true,
      capture: true,
      signal
    });
    window.addEventListener("touchmove", stopEvent, {
      passive: false,
      signal
    });
    window.addEventListener("contextmenu", noContextMenu, {
      signal
    });
    this.#savedDimensions = {
      savedX: this.x,
      savedY: this.y,
      savedWidth: this.width,
      savedHeight: this.height
    };
    const savedParentCursor = this.parent.div.style.cursor;
    const savedCursor = this.div.style.cursor;
    this.div.style.cursor = this.parent.div.style.cursor = window.getComputedStyle(event.target).cursor;
    const pointerUpCallback = () => {
      ac.abort();
      this.parent.togglePointerEvents(true);
      this.#altText?.toggle(true);
      this._isDraggable = savedDraggable;
      this.parent.div.style.cursor = savedParentCursor;
      this.div.style.cursor = savedCursor;
      this.#addResizeToUndoStack();
    };
    window.addEventListener("pointerup", pointerUpCallback, {
      signal
    });
    window.addEventListener("blur", pointerUpCallback, {
      signal
    });
  }
  #resize(x, y, width, height) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.setDims();
    this.fixAndSetPosition();
    this._onResized();
  }
  _onResized() {}
  #addResizeToUndoStack() {
    if (!this.#savedDimensions) {
      return;
    }
    const {
      savedX,
      savedY,
      savedWidth,
      savedHeight
    } = this.#savedDimensions;
    this.#savedDimensions = null;
    const newX = this.x;
    const newY = this.y;
    const newWidth = this.width;
    const newHeight = this.height;
    if (newX === savedX && newY === savedY && newWidth === savedWidth && newHeight === savedHeight) {
      return;
    }
    this.addCommands({
      cmd: this.#resize.bind(this, newX, newY, newWidth, newHeight),
      undo: this.#resize.bind(this, savedX, savedY, savedWidth, savedHeight),
      mustExec: true
    });
  }
  static _round(x) {
    return Math.round(x * 10000) / 10000;
  }
  #resizerPointermove(name, event) {
    const [parentWidth, parentHeight] = this.parentDimensions;
    const savedX = this.x;
    const savedY = this.y;
    const savedWidth = this.width;
    const savedHeight = this.height;
    const minWidth = AnnotationEditor.MIN_SIZE / parentWidth;
    const minHeight = AnnotationEditor.MIN_SIZE / parentHeight;
    const rotationMatrix = this.#getRotationMatrix(this.rotation);
    const transf = (x, y) => [rotationMatrix[0] * x + rotationMatrix[2] * y, rotationMatrix[1] * x + rotationMatrix[3] * y];
    const invRotationMatrix = this.#getRotationMatrix(360 - this.rotation);
    const invTransf = (x, y) => [invRotationMatrix[0] * x + invRotationMatrix[2] * y, invRotationMatrix[1] * x + invRotationMatrix[3] * y];
    let getPoint;
    let getOpposite;
    let isDiagonal = false;
    let isHorizontal = false;
    switch (name) {
      case "topLeft":
        isDiagonal = true;
        getPoint = (w, h) => [0, 0];
        getOpposite = (w, h) => [w, h];
        break;
      case "topMiddle":
        getPoint = (w, h) => [w / 2, 0];
        getOpposite = (w, h) => [w / 2, h];
        break;
      case "topRight":
        isDiagonal = true;
        getPoint = (w, h) => [w, 0];
        getOpposite = (w, h) => [0, h];
        break;
      case "middleRight":
        isHorizontal = true;
        getPoint = (w, h) => [w, h / 2];
        getOpposite = (w, h) => [0, h / 2];
        break;
      case "bottomRight":
        isDiagonal = true;
        getPoint = (w, h) => [w, h];
        getOpposite = (w, h) => [0, 0];
        break;
      case "bottomMiddle":
        getPoint = (w, h) => [w / 2, h];
        getOpposite = (w, h) => [w / 2, 0];
        break;
      case "bottomLeft":
        isDiagonal = true;
        getPoint = (w, h) => [0, h];
        getOpposite = (w, h) => [w, 0];
        break;
      case "middleLeft":
        isHorizontal = true;
        getPoint = (w, h) => [0, h / 2];
        getOpposite = (w, h) => [w, h / 2];
        break;
    }
    const point = getPoint(savedWidth, savedHeight);
    const oppositePoint = getOpposite(savedWidth, savedHeight);
    let transfOppositePoint = transf(...oppositePoint);
    const oppositeX = AnnotationEditor._round(savedX + transfOppositePoint[0]);
    const oppositeY = AnnotationEditor._round(savedY + transfOppositePoint[1]);
    let ratioX = 1;
    let ratioY = 1;
    let deltaX, deltaY;
    if (!event.fromKeyboard) {
      const {
        screenX,
        screenY
      } = event;
      const [lastScreenX, lastScreenY] = this.#lastPointerCoords;
      [deltaX, deltaY] = this.screenToPageTranslation(screenX - lastScreenX, screenY - lastScreenY);
      this.#lastPointerCoords[0] = screenX;
      this.#lastPointerCoords[1] = screenY;
    } else {
      ({
        deltaX,
        deltaY
      } = event);
    }
    [deltaX, deltaY] = invTransf(deltaX / parentWidth, deltaY / parentHeight);
    if (isDiagonal) {
      const oldDiag = Math.hypot(savedWidth, savedHeight);
      ratioX = ratioY = Math.max(Math.min(Math.hypot(oppositePoint[0] - point[0] - deltaX, oppositePoint[1] - point[1] - deltaY) / oldDiag, 1 / savedWidth, 1 / savedHeight), minWidth / savedWidth, minHeight / savedHeight);
    } else if (isHorizontal) {
      ratioX = MathClamp(Math.abs(oppositePoint[0] - point[0] - deltaX), minWidth, 1) / savedWidth;
    } else {
      ratioY = MathClamp(Math.abs(oppositePoint[1] - point[1] - deltaY), minHeight, 1) / savedHeight;
    }
    const newWidth = AnnotationEditor._round(savedWidth * ratioX);
    const newHeight = AnnotationEditor._round(savedHeight * ratioY);
    transfOppositePoint = transf(...getOpposite(newWidth, newHeight));
    const newX = oppositeX - transfOppositePoint[0];
    const newY = oppositeY - transfOppositePoint[1];
    this.#initialRect ||= [this.x, this.y, this.width, this.height];
    this.width = newWidth;
    this.height = newHeight;
    this.x = newX;
    this.y = newY;
    this.setDims();
    this.fixAndSetPosition();
    this._onResizing();
  }
  _onResizing() {}
  altTextFinish() {
    this.#altText?.finish();
  }
  get toolbarButtons() {
    return null;
  }
  async addEditToolbar() {
    if (this._editToolbar || this.#isInEditMode) {
      return this._editToolbar;
    }
    this._editToolbar = new EditorToolbar(this);
    this.div.append(this._editToolbar.render());
    const {
      toolbarButtons
    } = this;
    if (toolbarButtons) {
      for (const [name, tool] of toolbarButtons) {
        await this._editToolbar.addButton(name, tool);
      }
    }
    if (!this.hasComment) {
      this._editToolbar.addButton("comment", this.addCommentButton());
    }
    this._editToolbar.addButton("delete");
    return this._editToolbar;
  }
  addCommentButtonInToolbar() {
    this._editToolbar?.addButtonBefore("comment", this.addCommentButton(), ".deleteButton");
  }
  removeCommentButtonFromToolbar() {
    this._editToolbar?.removeButton("comment");
  }
  removeEditToolbar() {
    this._editToolbar?.remove();
    this._editToolbar = null;
    this.#altText?.destroy();
  }
  addContainer(container) {
    const editToolbarDiv = this._editToolbar?.div;
    if (editToolbarDiv) {
      editToolbarDiv.before(container);
    } else {
      this.div.append(container);
    }
  }
  getClientDimensions() {
    return this.div.getBoundingClientRect();
  }
  createAltText() {
    if (!this.#altText) {
      AltText.initialize(AnnotationEditor._l10n);
      this.#altText = new AltText(this);
      if (this.#accessibilityData) {
        this.#altText.data = this.#accessibilityData;
        this.#accessibilityData = null;
      }
    }
    return this.#altText;
  }
  get altTextData() {
    return this.#altText?.data;
  }
  set altTextData(data) {
    if (!this.#altText) {
      return;
    }
    this.#altText.data = data;
  }
  get guessedAltText() {
    return this.#altText?.guessedText;
  }
  async setGuessedAltText(text) {
    await this.#altText?.setGuessedText(text);
  }
  serializeAltText(isForCopying) {
    return this.#altText?.serialize(isForCopying);
  }
  hasAltText() {
    return !!this.#altText && !this.#altText.isEmpty();
  }
  hasAltTextData() {
    return this.#altText?.hasData() ?? false;
  }
  focusCommentButton() {
    this.#comment?.focusButton();
  }
  addCommentButton() {
    return this.canAddComment ? this.#comment ||= new Comment(this) : null;
  }
  addStandaloneCommentButton() {
    if (!this._uiManager.hasCommentManager()) {
      return;
    }
    if (this.#commentStandaloneButton) {
      if (this._uiManager.isEditingMode()) {
        this.#commentStandaloneButton.classList.remove("hidden");
      }
      return;
    }
    if (!this.hasComment) {
      return;
    }
    this.#commentStandaloneButton = this.#comment.renderForStandalone();
    this.div.append(this.#commentStandaloneButton);
  }
  removeStandaloneCommentButton() {
    this.#comment.removeStandaloneCommentButton();
    this.#commentStandaloneButton = null;
  }
  hideStandaloneCommentButton() {
    this.#commentStandaloneButton?.classList.add("hidden");
  }
  get comment() {
    if (!this.#comment) {
      return null;
    }
    const {
      data: {
        richText,
        text,
        date,
        deleted
      }
    } = this.#comment;
    return {
      text,
      richText,
      date,
      deleted,
      color: this.getNonHCMColor(),
      opacity: this.opacity ?? 1
    };
  }
  set comment(value) {
    this.#comment ||= new Comment(this);
    if (typeof value === "object" && value !== null) {
      this.#comment.restoreData(value);
    } else {
      this.#comment.data = value;
    }
    if (this.hasComment) {
      this.removeCommentButtonFromToolbar();
      this.addStandaloneCommentButton();
      this._uiManager.updateComment(this);
    } else {
      this.addCommentButtonInToolbar();
      this.removeStandaloneCommentButton();
      this._uiManager.removeComment(this);
    }
  }
  setCommentData({
    comment,
    popupRef,
    richText
  }) {
    if (!popupRef) {
      return;
    }
    this.#comment ||= new Comment(this);
    this.#comment.setInitialText(comment, richText);
    if (!this.annotationElementId) {
      return;
    }
    const storedData = this._uiManager.getAndRemoveDataFromAnnotationStorage(this.annotationElementId);
    if (storedData) {
      this.updateFromAnnotationLayer(storedData);
    }
  }
  get hasEditedComment() {
    return this.#comment?.hasBeenEdited();
  }
  get hasDeletedComment() {
    return this.#comment?.isDeleted();
  }
  get hasComment() {
    return !!this.#comment && !this.#comment.isEmpty() && !this.#comment.isDeleted();
  }
  async editComment(options) {
    this.#comment ||= new Comment(this);
    this.#comment.edit(options);
  }
  toggleComment(isSelected, visibility = undefined) {
    if (this.hasComment) {
      this._uiManager.toggleComment(this, isSelected, visibility);
    }
  }
  setSelectedCommentButton(selected) {
    this.#comment.setSelectedButton(selected);
  }
  addComment(serialized) {
    if (this.hasEditedComment) {
      const DEFAULT_POPUP_WIDTH = 180;
      const DEFAULT_POPUP_HEIGHT = 100;
      const [,,, trY] = serialized.rect;
      const [pageWidth] = this.pageDimensions;
      const [pageX] = this.pageTranslation;
      const blX = pageX + pageWidth + 1;
      const blY = trY - DEFAULT_POPUP_HEIGHT;
      const trX = blX + DEFAULT_POPUP_WIDTH;
      serialized.popup = {
        contents: this.comment.text,
        deleted: this.comment.deleted,
        rect: [blX, blY, trX, trY]
      };
    }
  }
  updateFromAnnotationLayer({
    popup: {
      contents,
      deleted
    }
  }) {
    this.#comment.data = deleted ? null : contents;
  }
  get parentBoundingClientRect() {
    return this.parent.boundingClientRect;
  }
  render() {
    const div = this.div = document.createElement("div");
    div.setAttribute("data-editor-rotation", (360 - this.rotation) % 360);
    div.className = this.name;
    div.setAttribute("id", this.id);
    div.tabIndex = this.#disabled ? -1 : 0;
    div.setAttribute("role", "application");
    if (this.defaultL10nId) {
      div.setAttribute("data-l10n-id", this.defaultL10nId);
    }
    if (!this._isVisible) {
      div.classList.add("hidden");
    }
    this.setInForeground();
    this.#addFocusListeners();
    const [parentWidth, parentHeight] = this.parentDimensions;
    if (this.parentRotation % 180 !== 0) {
      div.style.maxWidth = `${(100 * parentHeight / parentWidth).toFixed(2)}%`;
      div.style.maxHeight = `${(100 * parentWidth / parentHeight).toFixed(2)}%`;
    }
    const [tx, ty] = this.getInitialTranslation();
    this.translate(tx, ty);
    bindEvents(this, div, ["keydown", "pointerdown", "dblclick"]);
    this.#addTouchManager();
    this.addStandaloneCommentButton();
    this._uiManager._editorUndoBar?.hide();
    return div;
  }
  #touchPinchStartCallback() {
    this.#savedDimensions = {
      savedX: this.x,
      savedY: this.y,
      savedWidth: this.width,
      savedHeight: this.height
    };
    this.#altText?.toggle(false);
    this.parent.togglePointerEvents(false);
  }
  #touchPinchCallback(_origin, prevDistance, distance) {
    const slowDownFactor = 0.7;
    let factor = slowDownFactor * (distance / prevDistance) + 1 - slowDownFactor;
    if (factor === 1) {
      return;
    }
    const rotationMatrix = this.#getRotationMatrix(this.rotation);
    const transf = (x, y) => [rotationMatrix[0] * x + rotationMatrix[2] * y, rotationMatrix[1] * x + rotationMatrix[3] * y];
    const [parentWidth, parentHeight] = this.parentDimensions;
    const savedX = this.x;
    const savedY = this.y;
    const savedWidth = this.width;
    const savedHeight = this.height;
    const minWidth = AnnotationEditor.MIN_SIZE / parentWidth;
    const minHeight = AnnotationEditor.MIN_SIZE / parentHeight;
    factor = Math.max(Math.min(factor, 1 / savedWidth, 1 / savedHeight), minWidth / savedWidth, minHeight / savedHeight);
    const newWidth = AnnotationEditor._round(savedWidth * factor);
    const newHeight = AnnotationEditor._round(savedHeight * factor);
    if (newWidth === savedWidth && newHeight === savedHeight) {
      return;
    }
    this.#initialRect ||= [savedX, savedY, savedWidth, savedHeight];
    const transfCenterPoint = transf(savedWidth / 2, savedHeight / 2);
    const centerX = AnnotationEditor._round(savedX + transfCenterPoint[0]);
    const centerY = AnnotationEditor._round(savedY + transfCenterPoint[1]);
    const newTransfCenterPoint = transf(newWidth / 2, newHeight / 2);
    this.x = centerX - newTransfCenterPoint[0];
    this.y = centerY - newTransfCenterPoint[1];
    this.width = newWidth;
    this.height = newHeight;
    this.setDims();
    this.fixAndSetPosition();
    this._onResizing();
  }
  #touchPinchEndCallback() {
    this.#altText?.toggle(true);
    this.parent.togglePointerEvents(true);
    this.#addResizeToUndoStack();
  }
  pointerdown(event) {
    const {
      isMac
    } = FeatureTest.platform;
    if (event.button !== 0 || event.ctrlKey && isMac) {
      event.preventDefault();
      return;
    }
    this.#hasBeenClicked = true;
    if (this._isDraggable) {
      this.#setUpDragSession(event);
      return;
    }
    this.#selectOnPointerEvent(event);
  }
  #selectOnPointerEvent(event) {
    const {
      isMac
    } = FeatureTest.platform;
    if (event.ctrlKey && !isMac || event.shiftKey || event.metaKey && isMac) {
      this.parent.toggleSelected(this);
    } else {
      this.parent.setSelected(this);
    }
  }
  #setUpDragSession(event) {
    const {
      isSelected
    } = this;
    this._uiManager.setUpDragSession();
    let hasDraggingStarted = false;
    const ac = new AbortController();
    const signal = this._uiManager.combinedSignal(ac);
    const opts = {
      capture: true,
      passive: false,
      signal
    };
    const cancelDrag = e => {
      ac.abort();
      this.#dragPointerId = null;
      this.#hasBeenClicked = false;
      if (!this._uiManager.endDragSession()) {
        this.#selectOnPointerEvent(e);
      }
      if (hasDraggingStarted) {
        this._onStopDragging();
      }
    };
    if (isSelected) {
      this.#prevDragX = event.clientX;
      this.#prevDragY = event.clientY;
      this.#dragPointerId = event.pointerId;
      this.#dragPointerType = event.pointerType;
      window.addEventListener("pointermove", e => {
        if (!hasDraggingStarted) {
          hasDraggingStarted = true;
          this._uiManager.toggleComment(this, true, false);
          this._onStartDragging();
        }
        const {
          clientX: x,
          clientY: y,
          pointerId
        } = e;
        if (pointerId !== this.#dragPointerId) {
          stopEvent(e);
          return;
        }
        const [tx, ty] = this.screenToPageTranslation(x - this.#prevDragX, y - this.#prevDragY);
        this.#prevDragX = x;
        this.#prevDragY = y;
        this._uiManager.dragSelectedEditors(tx, ty);
        this.div.scrollIntoView({
          block: "nearest"
        });
      }, opts);
      window.addEventListener("touchmove", stopEvent, opts);
      window.addEventListener("pointerdown", e => {
        if (e.pointerType === this.#dragPointerType) {
          if (this.#touchManager || e.isPrimary) {
            cancelDrag(e);
          }
        }
        stopEvent(e);
      }, opts);
    }
    const pointerUpCallback = e => {
      if (!this.#dragPointerId || this.#dragPointerId === e.pointerId) {
        cancelDrag(e);
        return;
      }
      stopEvent(e);
    };
    window.addEventListener("pointerup", pointerUpCallback, {
      signal
    });
    window.addEventListener("blur", pointerUpCallback, {
      signal
    });
  }
  _onStartDragging() {}
  _onStopDragging() {}
  moveInDOM() {
    if (this.#moveInDOMTimeout) {
      clearTimeout(this.#moveInDOMTimeout);
    }
    this.#moveInDOMTimeout = setTimeout(() => {
      this.#moveInDOMTimeout = null;
      this.parent?.moveEditorInDOM(this);
    }, 0);
  }
  _setParentAndPosition(parent, x, y) {
    parent.changeParent(this);
    this.x = x;
    this.y = y;
    this.fixAndSetPosition();
    this._onTranslated();
  }
  getRect(tx, ty, rotation = this.rotation) {
    const scale = this.parentScale;
    const [pageWidth, pageHeight] = this.pageDimensions;
    const [pageX, pageY] = this.pageTranslation;
    const shiftX = tx / scale;
    const shiftY = ty / scale;
    const x = this.x * pageWidth;
    const y = this.y * pageHeight;
    const width = this.width * pageWidth;
    const height = this.height * pageHeight;
    switch (rotation) {
      case 0:
        return [x + shiftX + pageX, pageHeight - y - shiftY - height + pageY, x + shiftX + width + pageX, pageHeight - y - shiftY + pageY];
      case 90:
        return [x + shiftY + pageX, pageHeight - y + shiftX + pageY, x + shiftY + height + pageX, pageHeight - y + shiftX + width + pageY];
      case 180:
        return [x - shiftX - width + pageX, pageHeight - y + shiftY + pageY, x - shiftX + pageX, pageHeight - y + shiftY + height + pageY];
      case 270:
        return [x - shiftY - height + pageX, pageHeight - y - shiftX - width + pageY, x - shiftY + pageX, pageHeight - y - shiftX + pageY];
      default:
        throw new Error("Invalid rotation");
    }
  }
  getRectInCurrentCoords(rect, pageHeight) {
    const [x1, y1, x2, y2] = rect;
    const width = x2 - x1;
    const height = y2 - y1;
    switch (this.rotation) {
      case 0:
        return [x1, pageHeight - y2, width, height];
      case 90:
        return [x1, pageHeight - y1, height, width];
      case 180:
        return [x2, pageHeight - y1, width, height];
      case 270:
        return [x2, pageHeight - y2, height, width];
      default:
        throw new Error("Invalid rotation");
    }
  }
  getPDFRect() {
    return this.getRect(0, 0);
  }
  getNonHCMColor() {
    return this.color && AnnotationEditor._colorManager.convert(this._uiManager.getNonHCMColor(this.color));
  }
  onUpdatedColor() {
    this.#comment?.onUpdatedColor();
  }
  getData() {
    const {
      comment: {
        text: str,
        color,
        date,
        opacity,
        deleted,
        richText
      },
      uid: id,
      pageIndex,
      creationDate,
      modificationDate
    } = this;
    return {
      id,
      pageIndex,
      rect: this.getPDFRect(),
      richText,
      contentsObj: {
        str
      },
      creationDate,
      modificationDate: date || modificationDate,
      popupRef: !deleted,
      color,
      opacity
    };
  }
  onceAdded(focus) {}
  isEmpty() {
    return false;
  }
  enableEditMode() {
    if (this.isInEditMode()) {
      return false;
    }
    this.parent.setEditingState(false);
    this.#isInEditMode = true;
    return true;
  }
  disableEditMode() {
    if (!this.isInEditMode()) {
      return false;
    }
    this.parent.setEditingState(true);
    this.#isInEditMode = false;
    return true;
  }
  isInEditMode() {
    return this.#isInEditMode;
  }
  shouldGetKeyboardEvents() {
    return this.#isResizerEnabledForKeyboard;
  }
  needsToBeRebuilt() {
    return this.div && !this.isAttachedToDOM;
  }
  get isOnScreen() {
    const {
      top,
      left,
      bottom,
      right
    } = this.getClientDimensions();
    const {
      innerHeight,
      innerWidth
    } = window;
    return left < innerWidth && right > 0 && top < innerHeight && bottom > 0;
  }
  #addFocusListeners() {
    if (this.#focusAC || !this.div) {
      return;
    }
    this.#focusAC = new AbortController();
    const signal = this._uiManager.combinedSignal(this.#focusAC);
    this.div.addEventListener("focusin", this.focusin.bind(this), {
      signal
    });
    this.div.addEventListener("focusout", this.focusout.bind(this), {
      signal
    });
  }
  #addTouchManager() {
    if (this.#touchManager || !this.div || !this.isResizable || !this._uiManager._supportsPinchToZoom) {
      return;
    }
    this.#touchManager = new TouchManager({
      container: this.div,
      isPinchingDisabled: () => !this.isSelected,
      onPinchStart: this.#touchPinchStartCallback.bind(this),
      onPinching: this.#touchPinchCallback.bind(this),
      onPinchEnd: this.#touchPinchEndCallback.bind(this),
      signal: this._uiManager._signal
    });
  }
  rebuild() {
    this.#addFocusListeners();
    this.#addTouchManager();
  }
  rotate(_angle) {}
  resize() {}
  serializeDeleted() {
    return {
      id: this.annotationElementId,
      deleted: true,
      pageIndex: this.pageIndex,
      popupRef: this._initialData?.popupRef || ""
    };
  }
  serialize(isForCopying = false, context = null) {
    return {
      annotationType: this.mode,
      pageIndex: this.pageIndex,
      rect: this.getPDFRect(),
      rotation: this.rotation,
      structTreeParentId: this._structTreeParentId,
      popupRef: this._initialData?.popupRef || ""
    };
  }
  static async deserialize(data, parent, uiManager) {
    const editor = new this.prototype.constructor({
      parent,
      id: uiManager.getId(),
      uiManager,
      annotationElementId: data.annotationElementId,
      creationDate: data.creationDate,
      modificationDate: data.modificationDate
    });
    editor.rotation = data.rotation;
    editor.#accessibilityData = data.accessibilityData;
    editor._isCopy = data.isCopy || false;
    const [pageWidth, pageHeight] = editor.pageDimensions;
    const [x, y, width, height] = editor.getRectInCurrentCoords(data.rect, pageHeight);
    editor.x = x / pageWidth;
    editor.y = y / pageHeight;
    editor.width = width / pageWidth;
    editor.height = height / pageHeight;
    return editor;
  }
  get hasBeenModified() {
    return !!this.annotationElementId && (this.deleted || this.serialize() !== null);
  }
  remove() {
    this.#focusAC?.abort();
    this.#focusAC = null;
    if (!this.isEmpty()) {
      this.commit();
    }
    this.#touchManager?.destroy();
    this.#touchManager = null;
    if (this.parent) {
      this.parent.remove(this);
    } else {
      this._uiManager.removeEditor(this);
    }
    this.hideCommentPopup();
    if (this.#moveInDOMTimeout) {
      clearTimeout(this.#moveInDOMTimeout);
      this.#moveInDOMTimeout = null;
    }
    this.#stopResizing();
    this.removeEditToolbar();
    if (this.#telemetryTimeouts) {
      for (const timeout of this.#telemetryTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.#telemetryTimeouts = null;
    }
    this.parent = null;
    this.#fakeAnnotation?.remove();
    this.#fakeAnnotation = null;
  }
  get isResizable() {
    return false;
  }
  makeResizable() {
    if (this.isResizable) {
      this.#createResizers();
      this.#resizersDiv.classList.remove("hidden");
    }
  }
  get toolbarPosition() {
    return null;
  }
  get commentButtonPosition() {
    return this._uiManager.direction === "ltr" ? [1, 0] : [0, 0];
  }
  get commentButtonPositionInPage() {
    const {
      commentButtonPosition: [posX, posY]
    } = this;
    const [blX, blY, trX, trY] = this.getPDFRect();
    return [AnnotationEditor._round(blX + (trX - blX) * posX), AnnotationEditor._round(blY + (trY - blY) * (1 - posY))];
  }
  get commentButtonColor() {
    return this._uiManager.makeCommentColor(this.getNonHCMColor(), this.opacity);
  }
  get commentPopupPosition() {
    return this.#comment.commentPopupPositionInLayer;
  }
  set commentPopupPosition(pos) {
    this.#comment.commentPopupPositionInLayer = pos;
  }
  hasDefaultPopupPosition() {
    return this.#comment.hasDefaultPopupPosition();
  }
  get commentButtonWidth() {
    return this.#comment.commentButtonWidth;
  }
  get elementBeforePopup() {
    return this.div;
  }
  setCommentButtonStates(options) {
    this.#comment?.setCommentButtonStates(options);
  }
  keydown(event) {
    if (!this.isResizable || event.target !== this.div || event.key !== "Enter") {
      return;
    }
    this._uiManager.setSelected(this);
    this.#savedDimensions = {
      savedX: this.x,
      savedY: this.y,
      savedWidth: this.width,
      savedHeight: this.height
    };
    const children = this.#resizersDiv.children;
    if (!this.#allResizerDivs) {
      this.#allResizerDivs = Array.from(children);
      const boundResizerKeydown = this.#resizerKeydown.bind(this);
      const boundResizerBlur = this.#resizerBlur.bind(this);
      const signal = this._uiManager._signal;
      for (const div of this.#allResizerDivs) {
        const name = div.getAttribute("data-resizer-name");
        div.setAttribute("role", "spinbutton");
        div.addEventListener("keydown", boundResizerKeydown, {
          signal
        });
        div.addEventListener("blur", boundResizerBlur, {
          signal
        });
        div.addEventListener("focus", this.#resizerFocus.bind(this, name), {
          signal
        });
        div.setAttribute("data-l10n-id", AnnotationEditor._l10nResizer[name]);
      }
    }
    const first = this.#allResizerDivs[0];
    let firstPosition = 0;
    for (const div of children) {
      if (div === first) {
        break;
      }
      firstPosition++;
    }
    const nextFirstPosition = (360 - this.rotation + this.parentRotation) % 360 / 90 * (this.#allResizerDivs.length / 4);
    if (nextFirstPosition !== firstPosition) {
      if (nextFirstPosition < firstPosition) {
        for (let i = 0; i < firstPosition - nextFirstPosition; i++) {
          this.#resizersDiv.append(this.#resizersDiv.firstElementChild);
        }
      } else if (nextFirstPosition > firstPosition) {
        for (let i = 0; i < nextFirstPosition - firstPosition; i++) {
          this.#resizersDiv.firstElementChild.before(this.#resizersDiv.lastElementChild);
        }
      }
      let i = 0;
      for (const child of children) {
        const div = this.#allResizerDivs[i++];
        const name = div.getAttribute("data-resizer-name");
        child.setAttribute("data-l10n-id", AnnotationEditor._l10nResizer[name]);
      }
    }
    this.#setResizerTabIndex(0);
    this.#isResizerEnabledForKeyboard = true;
    this.#resizersDiv.firstElementChild.focus({
      focusVisible: true
    });
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  #resizerKeydown(event) {
    AnnotationEditor._resizerKeyboardManager.exec(this, event);
  }
  #resizerBlur(event) {
    if (this.#isResizerEnabledForKeyboard && event.relatedTarget?.parentNode !== this.#resizersDiv) {
      this.#stopResizing();
    }
  }
  #resizerFocus(name) {
    this.#focusedResizerName = this.#isResizerEnabledForKeyboard ? name : "";
  }
  #setResizerTabIndex(value) {
    if (!this.#allResizerDivs) {
      return;
    }
    for (const div of this.#allResizerDivs) {
      div.tabIndex = value;
    }
  }
  _resizeWithKeyboard(x, y) {
    if (!this.#isResizerEnabledForKeyboard) {
      return;
    }
    this.#resizerPointermove(this.#focusedResizerName, {
      deltaX: x,
      deltaY: y,
      fromKeyboard: true
    });
  }
  #stopResizing() {
    this.#isResizerEnabledForKeyboard = false;
    this.#setResizerTabIndex(-1);
    this.#addResizeToUndoStack();
  }
  _stopResizingWithKeyboard() {
    this.#stopResizing();
    this.div.focus();
  }
  select() {
    if (this.isSelected && this._editToolbar) {
      this._editToolbar.show();
      return;
    }
    this.isSelected = true;
    this.makeResizable();
    this.div?.classList.add("selectedEditor");
    if (!this._editToolbar) {
      this.addEditToolbar().then(() => {
        if (this.div?.classList.contains("selectedEditor")) {
          this._editToolbar?.show();
        }
      });
      return;
    }
    this._editToolbar?.show();
    this.#altText?.toggleAltTextBadge(false);
  }
  focus() {
    if (this.div && !this.div.contains(document.activeElement)) {
      setTimeout(() => this.div?.focus({
        preventScroll: true
      }), 0);
    }
  }
  unselect() {
    if (!this.isSelected) {
      return;
    }
    this.isSelected = false;
    this.#resizersDiv?.classList.add("hidden");
    this.div?.classList.remove("selectedEditor");
    if (this.div?.contains(document.activeElement)) {
      this._uiManager.currentLayer.div.focus({
        preventScroll: true
      });
    }
    this._editToolbar?.hide();
    this.#altText?.toggleAltTextBadge(true);
    this.hideCommentPopup();
  }
  hideCommentPopup() {
    if (this.hasComment) {
      this._uiManager.toggleComment(null);
    }
  }
  updateParams(type, value) {}
  disableEditing() {}
  enableEditing() {}
  get canChangeContent() {
    return false;
  }
  enterInEditMode() {
    if (!this.canChangeContent) {
      return;
    }
    this.enableEditMode();
    this.div.focus();
  }
  dblclick(event) {
    if (event.target.nodeName === "BUTTON") {
      return;
    }
    this.enterInEditMode();
    this.parent.updateToolbar({
      mode: this.constructor._editorType,
      editId: this.uid
    });
  }
  getElementForAltText() {
    return this.div;
  }
  get contentDiv() {
    return this.div;
  }
  get isEditing() {
    return this.#isEditing;
  }
  set isEditing(value) {
    this.#isEditing = value;
    if (!this.parent) {
      return;
    }
    if (value) {
      this.parent.setSelected(this);
      this.parent.setActiveEditor(this);
    } else {
      this.parent.setActiveEditor(null);
    }
  }
  static get MIN_SIZE() {
    return 16;
  }
  static canCreateNewEmptyEditor() {
    return true;
  }
  get telemetryInitialData() {
    return {
      action: "added"
    };
  }
  get telemetryFinalData() {
    return null;
  }
  _reportTelemetry(data, mustWait = false) {
    if (mustWait) {
      this.#telemetryTimeouts ||= new Map();
      const {
        action
      } = data;
      let timeout = this.#telemetryTimeouts.get(action);
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        this._reportTelemetry(data);
        this.#telemetryTimeouts.delete(action);
        if (this.#telemetryTimeouts.size === 0) {
          this.#telemetryTimeouts = null;
        }
      }, AnnotationEditor._telemetryTimeout);
      this.#telemetryTimeouts.set(action, timeout);
      return;
    }
    data.type ||= this.editorType;
    this._uiManager._eventBus.dispatch("reporttelemetry", {
      source: this,
      details: {
        type: "editing",
        data
      }
    });
  }
  show(visible = this._isVisible) {
    this.div.classList.toggle("hidden", !visible);
    this._isVisible = visible;
  }
  enable() {
    if (this.div) {
      this.div.tabIndex = 0;
    }
    this.#disabled = false;
  }
  disable() {
    if (this.div) {
      this.div.tabIndex = -1;
    }
    this.#disabled = true;
  }
  updateFakeAnnotationElement(annotationLayer) {
    if (!this.#fakeAnnotation && !this.deleted) {
      this.#fakeAnnotation = annotationLayer.addFakeAnnotation(this);
      return;
    }
    if (this.deleted) {
      this.#fakeAnnotation.remove();
      this.#fakeAnnotation = null;
      return;
    }
    if (this.hasEditedComment || this._hasBeenMoved || this._hasBeenResized) {
      this.#fakeAnnotation.updateEdited({
        rect: this.getPDFRect(),
        popup: this.comment
      });
    }
  }
  renderAnnotationElement(annotation) {
    if (this.deleted) {
      annotation.hide();
      return null;
    }
    let content = annotation.container.querySelector(".annotationContent");
    if (!content) {
      content = document.createElement("div");
      content.classList.add("annotationContent", this.editorType);
      annotation.container.prepend(content);
    } else if (content.nodeName === "CANVAS") {
      const canvas = content;
      content = document.createElement("div");
      content.classList.add("annotationContent", this.editorType);
      canvas.before(content);
    }
    return content;
  }
  resetAnnotationElement(annotation) {
    const {
      firstElementChild
    } = annotation.container;
    if (firstElementChild?.nodeName === "DIV" && firstElementChild.classList.contains("annotationContent")) {
      firstElementChild.remove();
    }
  }
}
class FakeEditor extends AnnotationEditor {
  constructor(params) {
    super(params);
    this.annotationElementId = params.annotationElementId;
    this.deleted = true;
  }
  serialize() {
    return this.serializeDeleted();
  }
}

;// ./src/shared/murmurhash3.js
const SEED = 0xc3d2e1f0;
const MASK_HIGH = 0xffff0000;
const MASK_LOW = 0xffff;
class MurmurHash3_64 {
  constructor(seed) {
    this.h1 = seed ? seed & 0xffffffff : SEED;
    this.h2 = seed ? seed & 0xffffffff : SEED;
  }
  update(input) {
    let data, length;
    if (typeof input === "string") {
      data = new Uint8Array(input.length * 2);
      length = 0;
      for (let i = 0, ii = input.length; i < ii; i++) {
        const code = input.charCodeAt(i);
        if (code <= 0xff) {
          data[length++] = code;
        } else {
          data[length++] = code >>> 8;
          data[length++] = code & 0xff;
        }
      }
    } else if (ArrayBuffer.isView(input)) {
      data = input.slice();
      length = data.byteLength;
    } else {
      throw new Error("Invalid data format, must be a string or TypedArray.");
    }
    const blockCounts = length >> 2;
    const tailLength = length - blockCounts * 4;
    const dataUint32 = new Uint32Array(data.buffer, 0, blockCounts);
    let k1 = 0,
      k2 = 0;
    let h1 = this.h1,
      h2 = this.h2;
    const C1 = 0xcc9e2d51,
      C2 = 0x1b873593;
    const C1_LOW = C1 & MASK_LOW,
      C2_LOW = C2 & MASK_LOW;
    for (let i = 0; i < blockCounts; i++) {
      if (i & 1) {
        k1 = dataUint32[i];
        k1 = k1 * C1 & MASK_HIGH | k1 * C1_LOW & MASK_LOW;
        k1 = k1 << 15 | k1 >>> 17;
        k1 = k1 * C2 & MASK_HIGH | k1 * C2_LOW & MASK_LOW;
        h1 ^= k1;
        h1 = h1 << 13 | h1 >>> 19;
        h1 = h1 * 5 + 0xe6546b64;
      } else {
        k2 = dataUint32[i];
        k2 = k2 * C1 & MASK_HIGH | k2 * C1_LOW & MASK_LOW;
        k2 = k2 << 15 | k2 >>> 17;
        k2 = k2 * C2 & MASK_HIGH | k2 * C2_LOW & MASK_LOW;
        h2 ^= k2;
        h2 = h2 << 13 | h2 >>> 19;
        h2 = h2 * 5 + 0xe6546b64;
      }
    }
    k1 = 0;
    switch (tailLength) {
      case 3:
        k1 ^= data[blockCounts * 4 + 2] << 16;
      case 2:
        k1 ^= data[blockCounts * 4 + 1] << 8;
      case 1:
        k1 ^= data[blockCounts * 4];
        k1 = k1 * C1 & MASK_HIGH | k1 * C1_LOW & MASK_LOW;
        k1 = k1 << 15 | k1 >>> 17;
        k1 = k1 * C2 & MASK_HIGH | k1 * C2_LOW & MASK_LOW;
        if (blockCounts & 1) {
          h1 ^= k1;
        } else {
          h2 ^= k1;
        }
    }
    this.h1 = h1;
    this.h2 = h2;
  }
  hexdigest() {
    let h1 = this.h1,
      h2 = this.h2;
    h1 ^= h2 >>> 1;
    h1 = h1 * 0xed558ccd & MASK_HIGH | h1 * 0x8ccd & MASK_LOW;
    h2 = h2 * 0xff51afd7 & MASK_HIGH | ((h2 << 16 | h1 >>> 16) * 0xafd7ed55 & MASK_HIGH) >>> 16;
    h1 ^= h2 >>> 1;
    h1 = h1 * 0x1a85ec53 & MASK_HIGH | h1 * 0xec53 & MASK_LOW;
    h2 = h2 * 0xc4ceb9fe & MASK_HIGH | ((h2 << 16 | h1 >>> 16) * 0xb9fe1a85 & MASK_HIGH) >>> 16;
    h1 ^= h2 >>> 1;
    return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
  }
}

;// ./src/display/annotation_storage.js



const SerializableEmpty = Object.freeze({
  map: null,
  hash: "",
  transfer: undefined
});
class AnnotationStorage {
  #modified = false;
  #modifiedIds = null;
  #editorsMap = null;
  #storage = new Map();
  onSetModified = null;
  onResetModified = null;
  onAnnotationEditor = null;
  getValue(key, defaultValue) {
    const value = this.#storage.get(key);
    if (value === undefined) {
      return defaultValue;
    }
    return Object.assign(defaultValue, value);
  }
  getRawValue(key) {
    return this.#storage.get(key);
  }
  remove(key) {
    const storedValue = this.#storage.get(key);
    if (storedValue === undefined) {
      return;
    }
    if (storedValue instanceof AnnotationEditor) {
      this.#editorsMap.delete(storedValue.annotationElementId);
    }
    this.#storage.delete(key);
    if (this.#storage.size === 0) {
      this.resetModified();
    }
    if (this.#storage.values().some(v => v instanceof AnnotationEditor)) {
      return;
    }
    this.onAnnotationEditor?.(null);
  }
  setValue(key, value) {
    const obj = this.#storage.get(key);
    let modified = false;
    if (obj !== undefined) {
      for (const [entry, val] of Object.entries(value)) {
        if (obj[entry] !== val) {
          modified = true;
          obj[entry] = val;
        }
      }
    } else {
      modified = true;
      this.#storage.set(key, value);
    }
    if (modified) {
      this.#setModified();
    }
    if (value instanceof AnnotationEditor) {
      (this.#editorsMap ||= new Map()).set(value.annotationElementId, value);
      this.onAnnotationEditor?.(value.constructor._type);
    }
  }
  has(key) {
    return this.#storage.has(key);
  }
  get size() {
    return this.#storage.size;
  }
  #setModified() {
    if (!this.#modified) {
      this.#modified = true;
      this.onSetModified?.();
    }
  }
  resetModified() {
    if (this.#modified) {
      this.#modified = false;
      this.onResetModified?.();
    }
  }
  get print() {
    return new PrintAnnotationStorage(this);
  }
  get serializable() {
    if (this.#storage.size === 0) {
      return SerializableEmpty;
    }
    const map = new Map(),
      hash = new MurmurHash3_64(),
      transfer = [];
    const context = Object.create(null);
    let hasBitmap = false;
    for (const [key, val] of this.#storage) {
      const serialized = val instanceof AnnotationEditor ? val.serialize(false, context) : val;
      if (val.page) {
        val.pageIndex = val.page._pageIndex;
        delete val.page;
      }
      if (serialized) {
        map.set(key, serialized);
        hash.update(`${key}:${JSON.stringify(serialized)}`);
        hasBitmap ||= !!serialized.bitmap;
      }
    }
    if (hasBitmap) {
      for (const value of map.values()) {
        if (value.bitmap) {
          transfer.push(value.bitmap);
        }
      }
    }
    return map.size > 0 ? {
      map,
      hash: hash.hexdigest(),
      transfer
    } : SerializableEmpty;
  }
  get editorStats() {
    let stats = null;
    const typeToEditor = new Map();
    let numberOfEditedComments = 0;
    let numberOfDeletedComments = 0;
    for (const value of this.#storage.values()) {
      if (!(value instanceof AnnotationEditor)) {
        if (value.popup) {
          if (value.popup.deleted) {
            numberOfDeletedComments += 1;
          } else {
            numberOfEditedComments += 1;
          }
        }
        continue;
      }
      if (value.isCommentDeleted) {
        numberOfDeletedComments += 1;
      } else if (value.hasEditedComment) {
        numberOfEditedComments += 1;
      }
      const editorStats = value.telemetryFinalData;
      if (!editorStats) {
        continue;
      }
      const {
        type
      } = editorStats;
      typeToEditor.getOrInsertComputed(type, () => Object.getPrototypeOf(value).constructor);
      stats ||= Object.create(null);
      const map = stats[type] ||= new Map();
      for (const [key, val] of Object.entries(editorStats)) {
        if (key === "type") {
          continue;
        }
        const counters = map.getOrInsertComputed(key, makeMap);
        counters.set(val, (counters.get(val) ?? 0) + 1);
      }
    }
    if (numberOfDeletedComments > 0 || numberOfEditedComments > 0) {
      stats ||= Object.create(null);
      stats.comments = {
        deleted: numberOfDeletedComments,
        edited: numberOfEditedComments
      };
    }
    if (!stats) {
      return null;
    }
    for (const [type, editor] of typeToEditor) {
      stats[type] = editor.computeTelemetryFinalData(stats[type]);
    }
    return stats;
  }
  resetModifiedIds() {
    this.#modifiedIds = null;
  }
  updateEditor(annotationId, data) {
    const value = this.#editorsMap?.get(annotationId);
    if (value) {
      value.updateFromAnnotationLayer(data);
      return true;
    }
    return false;
  }
  getEditor(annotationId) {
    return this.#editorsMap?.get(annotationId) || null;
  }
  get modifiedIds() {
    if (this.#modifiedIds) {
      return this.#modifiedIds;
    }
    const ids = [];
    if (this.#editorsMap) {
      for (const value of this.#editorsMap.values()) {
        if (!value.serialize()) {
          continue;
        }
        ids.push(value.annotationElementId);
      }
    }
    let hash = "";
    if (ids.length) {
      const h = new MurmurHash3_64();
      h.update(ids.join(","));
      hash = h.hexdigest();
    }
    return this.#modifiedIds = {
      ids: new Set(ids),
      hash
    };
  }
  [Symbol.iterator]() {
    return this.#storage.entries();
  }
}
class PrintAnnotationStorage extends AnnotationStorage {
  #serializable = SerializableEmpty;
  constructor(parent) {
    super();
    const {
      serializable
    } = parent;
    if (serializable === SerializableEmpty) {
      return;
    }
    const {
      map,
      hash,
      transfer
    } = serializable;
    const clone = structuredClone(map, transfer ? {
      transfer
    } : null);
    this.#serializable = {
      map: clone,
      hash,
      transfer: []
    };
  }
  get print() {
    unreachable("Should not call PrintAnnotationStorage.print");
  }
  get serializable() {
    return this.#serializable;
  }
  get modifiedIds() {
    return shadow(this, "modifiedIds", {
      ids: new Set(),
      hash: ""
    });
  }
}

;// ./src/display/canvas_dependency_tracker.js



const FORCED_DEPENDENCY_LABEL = "__forcedDependency";
const {
  floor,
  ceil
} = Math;
function expandBBox(array, index, minX, minY, maxX, maxY) {
  array[index * 4 + 0] = Math.min(array[index * 4 + 0], minX);
  array[index * 4 + 1] = Math.min(array[index * 4 + 1], minY);
  array[index * 4 + 2] = Math.max(array[index * 4 + 2], maxX);
  array[index * 4 + 3] = Math.max(array[index * 4 + 3], maxY);
}
function scaleCharBBox(scaleX, scaleY, x, y, bbox) {
  let temp;
  if (scaleX) {
    if (scaleX < 0) {
      temp = bbox[0];
      bbox[0] = bbox[2];
      bbox[2] = temp;
    }
    bbox[0] *= scaleX;
    bbox[2] *= scaleX;
    if (scaleY < 0) {
      temp = bbox[1];
      bbox[1] = bbox[3];
      bbox[3] = temp;
    }
    bbox[1] *= scaleY;
    bbox[3] *= scaleY;
  } else {
    bbox.fill(0);
  }
  bbox[0] += x;
  bbox[1] += y;
  bbox[2] += x;
  bbox[3] += y;
}
const EMPTY_BBOX = new Uint32Array(new Uint8Array([255, 255, 0, 0]).buffer)[0];
class BBoxReader {
  #bboxes;
  #coords;
  constructor(bboxes, coords) {
    this.#bboxes = bboxes;
    this.#coords = coords;
  }
  get length() {
    return this.#bboxes.length;
  }
  isEmpty(i) {
    return this.#bboxes[i] === EMPTY_BBOX;
  }
  minX(i) {
    return this.#coords[i * 4 + 0] / 256;
  }
  minY(i) {
    return this.#coords[i * 4 + 1] / 256;
  }
  maxX(i) {
    return (this.#coords[i * 4 + 2] + 1) / 256;
  }
  maxY(i) {
    return (this.#coords[i * 4 + 3] + 1) / 256;
  }
}
const ensureDebugMetadata = (map, key) => map?.getOrInsertComputed(key, () => ({
  dependencies: new Set(),
  isRenderingOperation: false
}));
class CanvasBBoxTracker {
  #baseTransformStack = [[1, 0, 0, 1, 0, 0]];
  #clipBox = [-Infinity, -Infinity, Infinity, Infinity];
  #pendingBBox = new Float64Array(BBOX_INIT);
  _pendingBBoxIdx = -1;
  #canvasWidth;
  #canvasHeight;
  #bboxesCoords;
  #bboxes;
  _savesStack = [];
  _markedContentStack = [];
  constructor(canvas, operationsCount) {
    this.#canvasWidth = canvas.width;
    this.#canvasHeight = canvas.height;
    this.#initializeBBoxes(operationsCount);
  }
  growOperationsCount(operationsCount) {
    if (operationsCount >= this.#bboxes.length) {
      this.#initializeBBoxes(operationsCount, this.#bboxes);
    }
  }
  #initializeBBoxes(operationsCount, oldBBoxes) {
    const buffer = new ArrayBuffer(operationsCount * 4);
    this.#bboxesCoords = new Uint8ClampedArray(buffer);
    this.#bboxes = new Uint32Array(buffer);
    if (oldBBoxes && oldBBoxes.length > 0) {
      this.#bboxes.set(oldBBoxes);
      this.#bboxes.fill(EMPTY_BBOX, oldBBoxes.length);
    } else {
      this.#bboxes.fill(EMPTY_BBOX);
    }
  }
  get clipBox() {
    return this.#clipBox;
  }
  save(opIdx) {
    this.#clipBox = {
      __proto__: this.#clipBox
    };
    this._savesStack.push(opIdx);
    return this;
  }
  restore(opIdx, onSavePopped) {
    const previous = Object.getPrototypeOf(this.#clipBox);
    if (previous === null) {
      return this;
    }
    this.#clipBox = previous;
    const lastSave = this._savesStack.pop();
    if (lastSave !== undefined) {
      onSavePopped?.(lastSave, opIdx);
      this.#bboxes[opIdx] = this.#bboxes[lastSave];
    }
    return this;
  }
  recordOpenMarker(idx) {
    this._savesStack.push(idx);
    return this;
  }
  getOpenMarker() {
    return this._savesStack.length === 0 ? null : this._savesStack.at(-1);
  }
  recordCloseMarker(opIdx, onSavePopped) {
    const lastSave = this._savesStack.pop();
    if (lastSave !== undefined) {
      onSavePopped?.(lastSave, opIdx);
      this.#bboxes[opIdx] = this.#bboxes[lastSave];
    }
    return this;
  }
  beginMarkedContent(opIdx) {
    this._markedContentStack.push(opIdx);
    return this;
  }
  endMarkedContent(opIdx, onSavePopped) {
    const lastSave = this._markedContentStack.pop();
    if (lastSave !== undefined) {
      onSavePopped?.(lastSave, opIdx);
      this.#bboxes[opIdx] = this.#bboxes[lastSave];
    }
    return this;
  }
  pushBaseTransform(ctx) {
    this.#baseTransformStack.push(Util.multiplyByDOMMatrix(this.#baseTransformStack.at(-1), ctx.getTransform()));
    return this;
  }
  popBaseTransform() {
    if (this.#baseTransformStack.length > 1) {
      this.#baseTransformStack.pop();
    }
    return this;
  }
  resetBBox(idx) {
    if (this._pendingBBoxIdx !== idx) {
      this._pendingBBoxIdx = idx;
      this.#pendingBBox.set(BBOX_INIT, 0);
    }
    return this;
  }
  recordClipBox(idx, ctx, minX, maxX, minY, maxY) {
    const transform = Util.multiplyByDOMMatrix(this.#baseTransformStack.at(-1), ctx.getTransform());
    const clipBox = BBOX_INIT.slice();
    Util.axialAlignedBoundingBox([minX, minY, maxX, maxY], transform, clipBox);
    const intersection = Util.intersect(this.#clipBox, clipBox);
    if (intersection) {
      this.#clipBox[0] = intersection[0];
      this.#clipBox[1] = intersection[1];
      this.#clipBox[2] = intersection[2];
      this.#clipBox[3] = intersection[3];
    } else {
      this.#clipBox[0] = this.#clipBox[1] = Infinity;
      this.#clipBox[2] = this.#clipBox[3] = -Infinity;
    }
    return this;
  }
  recordBBox(idx, ctx, minX, maxX, minY, maxY) {
    const clipBox = this.#clipBox;
    if (clipBox[0] === Infinity) {
      return this;
    }
    const transform = Util.multiplyByDOMMatrix(this.#baseTransformStack.at(-1), ctx.getTransform());
    if (clipBox[0] === -Infinity) {
      Util.axialAlignedBoundingBox([minX, minY, maxX, maxY], transform, this.#pendingBBox);
      return this;
    }
    const bbox = BBOX_INIT.slice();
    Util.axialAlignedBoundingBox([minX, minY, maxX, maxY], transform, bbox);
    this.#pendingBBox[0] = MathClamp(bbox[0], clipBox[0], this.#pendingBBox[0]);
    this.#pendingBBox[1] = MathClamp(bbox[1], clipBox[1], this.#pendingBBox[1]);
    this.#pendingBBox[2] = MathClamp(bbox[2], this.#pendingBBox[2], clipBox[2]);
    this.#pendingBBox[3] = MathClamp(bbox[3], this.#pendingBBox[3], clipBox[3]);
    return this;
  }
  recordFullPageBBox(idx) {
    this.#pendingBBox[0] = Math.max(0, this.#clipBox[0]);
    this.#pendingBBox[1] = Math.max(0, this.#clipBox[1]);
    this.#pendingBBox[2] = Math.min(this.#canvasWidth, this.#clipBox[2]);
    this.#pendingBBox[3] = Math.min(this.#canvasHeight, this.#clipBox[3]);
    return this;
  }
  recordOperation(idx, preserve = false, dependencyLists) {
    if (this._pendingBBoxIdx !== idx) {
      return this;
    }
    const minX = floor(this.#pendingBBox[0] * 256 / this.#canvasWidth);
    const minY = floor(this.#pendingBBox[1] * 256 / this.#canvasHeight);
    const maxX = ceil(this.#pendingBBox[2] * 256 / this.#canvasWidth);
    const maxY = ceil(this.#pendingBBox[3] * 256 / this.#canvasHeight);
    expandBBox(this.#bboxesCoords, idx, minX, minY, maxX, maxY);
    if (dependencyLists) {
      for (const dependencies of dependencyLists) {
        for (const depIdx of dependencies) {
          if (depIdx !== idx) {
            expandBBox(this.#bboxesCoords, depIdx, minX, minY, maxX, maxY);
          }
        }
      }
    }
    if (!preserve) {
      this._pendingBBoxIdx = -1;
    }
    return this;
  }
  bboxToClipBoxDropOperation(idx) {
    if (this._pendingBBoxIdx === idx) {
      this._pendingBBoxIdx = -1;
      this.#clipBox[0] = Math.max(this.#clipBox[0], this.#pendingBBox[0]);
      this.#clipBox[1] = Math.max(this.#clipBox[1], this.#pendingBBox[1]);
      this.#clipBox[2] = Math.min(this.#clipBox[2], this.#pendingBBox[2]);
      this.#clipBox[3] = Math.min(this.#clipBox[3], this.#pendingBBox[3]);
    }
    return this;
  }
  take() {
    return new BBoxReader(this.#bboxes, this.#bboxesCoords);
  }
  takeDebugMetadata() {
    throw new Error("Unreachable");
  }
  recordSimpleData(name, idx) {
    return this;
  }
  recordIncrementalData(name, idx) {
    return this;
  }
  resetIncrementalData(name, idx) {
    return this;
  }
  recordNamedData(name, idx) {
    return this;
  }
  recordSimpleDataFromNamed(name, depName, fallbackIdx) {
    return this;
  }
  recordFutureForcedDependency(name, idx) {
    return this;
  }
  inheritSimpleDataAsFutureForcedDependencies(names) {
    return this;
  }
  inheritPendingDependenciesAsFutureForcedDependencies() {
    return this;
  }
  recordCharacterBBox(idx, ctx, font, scale = 1, x = 0, y = 0, getMeasure) {
    return this;
  }
  getSimpleIndex(dependencyName) {
    return undefined;
  }
  recordDependencies(idx, dependencyNames) {
    return this;
  }
  recordNamedDependency(idx, name) {
    return this;
  }
  recordShowTextOperation(idx, preserve = false) {
    return this;
  }
}
class CanvasDependencyTracker {
  #simple = {
    __proto__: null
  };
  #incremental = {
    __proto__: null,
    transform: [],
    moveText: [],
    sameLineText: [],
    [FORCED_DEPENDENCY_LABEL]: []
  };
  #namedDependencies = new Map();
  #pendingDependencies = new Set();
  #fontBBoxTrustworthy = new Map();
  #debugMetadata;
  #recordDebugMetadataDepenencyAfterRestore;
  #bboxTracker;
  constructor(bboxTracker, recordDebugMetadata = false) {
    this.#bboxTracker = bboxTracker;
    if (recordDebugMetadata) {
      this.#debugMetadata = new Map();
      this.#recordDebugMetadataDepenencyAfterRestore = (lastSave, opIdx) => {
        ensureDebugMetadata(this.#debugMetadata, opIdx).dependencies.add(lastSave);
      };
    }
  }
  get clipBox() {
    return this.#bboxTracker.clipBox;
  }
  growOperationsCount(operationsCount) {
    this.#bboxTracker.growOperationsCount(operationsCount);
  }
  save(opIdx) {
    this.#simple = {
      __proto__: this.#simple
    };
    this.#incremental = {
      __proto__: this.#incremental,
      transform: {
        __proto__: this.#incremental.transform
      },
      moveText: {
        __proto__: this.#incremental.moveText
      },
      sameLineText: {
        __proto__: this.#incremental.sameLineText
      },
      [FORCED_DEPENDENCY_LABEL]: {
        __proto__: this.#incremental[FORCED_DEPENDENCY_LABEL]
      }
    };
    this.#bboxTracker.save(opIdx);
    return this;
  }
  restore(opIdx) {
    this.#bboxTracker.restore(opIdx, this.#recordDebugMetadataDepenencyAfterRestore);
    const previous = Object.getPrototypeOf(this.#simple);
    if (previous === null) {
      return this;
    }
    this.#simple = previous;
    this.#incremental = Object.getPrototypeOf(this.#incremental);
    return this;
  }
  recordOpenMarker(opIdx) {
    this.#bboxTracker.recordOpenMarker(opIdx, this.#recordDebugMetadataDepenencyAfterRestore);
    return this;
  }
  getOpenMarker() {
    return this.#bboxTracker.getOpenMarker();
  }
  recordCloseMarker(opIdx) {
    this.#bboxTracker.recordCloseMarker(opIdx, this.#recordDebugMetadataDepenencyAfterRestore);
    return this;
  }
  beginMarkedContent(opIdx) {
    this.#bboxTracker.beginMarkedContent(opIdx);
    return this;
  }
  endMarkedContent(opIdx) {
    this.#bboxTracker.endMarkedContent(opIdx, this.#recordDebugMetadataDepenencyAfterRestore);
    return this;
  }
  pushBaseTransform(ctx) {
    this.#bboxTracker.pushBaseTransform(ctx);
    return this;
  }
  popBaseTransform() {
    this.#bboxTracker.popBaseTransform();
    return this;
  }
  recordSimpleData(name, idx) {
    this.#simple[name] = idx;
    return this;
  }
  recordIncrementalData(name, idx) {
    this.#incremental[name].push(idx);
    return this;
  }
  resetIncrementalData(name, idx) {
    this.#incremental[name].length = 0;
    return this;
  }
  recordNamedData(name, idx) {
    this.#namedDependencies.set(name, idx);
    return this;
  }
  recordSimpleDataFromNamed(name, depName, fallbackIdx) {
    this.#simple[name] = this.#namedDependencies.get(depName) ?? fallbackIdx;
  }
  recordFutureForcedDependency(name, idx) {
    this.recordIncrementalData(FORCED_DEPENDENCY_LABEL, idx);
    return this;
  }
  inheritSimpleDataAsFutureForcedDependencies(names) {
    for (const name of names) {
      if (name in this.#simple) {
        this.recordFutureForcedDependency(name, this.#simple[name]);
      }
    }
    return this;
  }
  inheritPendingDependenciesAsFutureForcedDependencies() {
    for (const dep of this.#pendingDependencies) {
      this.recordFutureForcedDependency(FORCED_DEPENDENCY_LABEL, dep);
    }
    return this;
  }
  resetBBox(idx) {
    this.#bboxTracker.resetBBox(idx);
    return this;
  }
  recordClipBox(idx, ctx, minX, maxX, minY, maxY) {
    this.#bboxTracker.recordClipBox(idx, ctx, minX, maxX, minY, maxY);
    return this;
  }
  recordBBox(idx, ctx, minX, maxX, minY, maxY) {
    this.#bboxTracker.recordBBox(idx, ctx, minX, maxX, minY, maxY);
    return this;
  }
  recordCharacterBBox(idx, ctx, font, scale = 1, x = 0, y = 0, getMeasure) {
    const fontBBox = font.bbox;
    let isBBoxTrustworthy;
    let computedBBox;
    if (fontBBox) {
      isBBoxTrustworthy = fontBBox[2] !== fontBBox[0] && fontBBox[3] !== fontBBox[1] && this.#fontBBoxTrustworthy.get(font);
      if (isBBoxTrustworthy !== false) {
        computedBBox = [0, 0, 0, 0];
        Util.axialAlignedBoundingBox(fontBBox, font.fontMatrix, computedBBox);
        if (scale !== 1 || x !== 0 || y !== 0) {
          scaleCharBBox(scale, -scale, x, y, computedBBox);
        }
        if (isBBoxTrustworthy) {
          return this.recordBBox(idx, ctx, computedBBox[0], computedBBox[2], computedBBox[1], computedBBox[3]);
        }
      }
    }
    if (!getMeasure) {
      return this.recordFullPageBBox(idx);
    }
    const measure = getMeasure();
    if (fontBBox && computedBBox && isBBoxTrustworthy === undefined) {
      isBBoxTrustworthy = computedBBox[0] <= x - measure.actualBoundingBoxLeft && computedBBox[2] >= x + measure.actualBoundingBoxRight && computedBBox[1] <= y - measure.actualBoundingBoxAscent && computedBBox[3] >= y + measure.actualBoundingBoxDescent;
      this.#fontBBoxTrustworthy.set(font, isBBoxTrustworthy);
      if (isBBoxTrustworthy) {
        return this.recordBBox(idx, ctx, computedBBox[0], computedBBox[2], computedBBox[1], computedBBox[3]);
      }
    }
    return this.recordBBox(idx, ctx, x - measure.actualBoundingBoxLeft, x + measure.actualBoundingBoxRight, y - measure.actualBoundingBoxAscent, y + measure.actualBoundingBoxDescent);
  }
  recordFullPageBBox(idx) {
    this.#bboxTracker.recordFullPageBBox(idx);
    return this;
  }
  getSimpleIndex(dependencyName) {
    return this.#simple[dependencyName];
  }
  recordDependencies(idx, dependencyNames) {
    const pendingDependencies = this.#pendingDependencies;
    const simple = this.#simple;
    const incremental = this.#incremental;
    for (const name of dependencyNames) {
      if (name in this.#simple) {
        pendingDependencies.add(simple[name]);
      } else if (name in incremental) {
        incremental[name].forEach(pendingDependencies.add, pendingDependencies);
      }
    }
    return this;
  }
  recordNamedDependency(idx, name) {
    if (this.#namedDependencies.has(name)) {
      this.#pendingDependencies.add(this.#namedDependencies.get(name));
    }
    return this;
  }
  recordOperation(idx, preserve = false) {
    this.recordDependencies(idx, [FORCED_DEPENDENCY_LABEL]);
    if (this.#debugMetadata) {
      const metadata = ensureDebugMetadata(this.#debugMetadata, idx);
      const {
        dependencies
      } = metadata;
      this.#pendingDependencies.forEach(dependencies.add, dependencies);
      this.#bboxTracker._savesStack.forEach(dependencies.add, dependencies);
      this.#bboxTracker._markedContentStack.forEach(dependencies.add, dependencies);
      dependencies.delete(idx);
      metadata.isRenderingOperation = true;
    }
    const needsCleanup = !preserve && idx === this.#bboxTracker._pendingBBoxIdx;
    this.#bboxTracker.recordOperation(idx, preserve, [this.#pendingDependencies, this.#bboxTracker._savesStack, this.#bboxTracker._markedContentStack]);
    if (needsCleanup) {
      this.#pendingDependencies.clear();
    }
    return this;
  }
  recordShowTextOperation(idx, preserve = false) {
    const deps = Array.from(this.#pendingDependencies);
    this.recordOperation(idx, preserve);
    this.recordIncrementalData("sameLineText", idx);
    for (const dep of deps) {
      this.recordIncrementalData("sameLineText", dep);
    }
    return this;
  }
  bboxToClipBoxDropOperation(idx, preserve = false) {
    const needsCleanup = !preserve && idx === this.#bboxTracker._pendingBBoxIdx;
    this.#bboxTracker.bboxToClipBoxDropOperation(idx);
    if (needsCleanup) {
      this.#pendingDependencies.clear();
    }
    return this;
  }
  take() {
    this.#fontBBoxTrustworthy.clear();
    return this.#bboxTracker.take();
  }
  takeDebugMetadata() {
    return this.#debugMetadata;
  }
}
class CanvasNestedDependencyTracker {
  #dependencyTracker;
  #opIdx;
  #ignoreBBoxes;
  #nestingLevel = 0;
  #savesLevel = 0;
  constructor(dependencyTracker, opIdx, ignoreBBoxes) {
    if (dependencyTracker instanceof CanvasNestedDependencyTracker && dependencyTracker.#ignoreBBoxes === !!ignoreBBoxes) {
      return dependencyTracker;
    }
    this.#dependencyTracker = dependencyTracker;
    this.#opIdx = opIdx;
    this.#ignoreBBoxes = !!ignoreBBoxes;
  }
  get clipBox() {
    return this.#dependencyTracker.clipBox;
  }
  growOperationsCount() {
    throw new Error("Unreachable");
  }
  save(opIdx) {
    this.#savesLevel++;
    this.#dependencyTracker.save(this.#opIdx);
    return this;
  }
  restore(opIdx) {
    if (this.#savesLevel > 0) {
      this.#dependencyTracker.restore(this.#opIdx);
      this.#savesLevel--;
    }
    return this;
  }
  recordOpenMarker(idx) {
    this.#nestingLevel++;
    return this;
  }
  getOpenMarker() {
    return this.#nestingLevel > 0 ? this.#opIdx : this.#dependencyTracker.getOpenMarker();
  }
  recordCloseMarker(idx) {
    this.#nestingLevel--;
    return this;
  }
  beginMarkedContent(opIdx) {
    return this;
  }
  endMarkedContent(opIdx) {
    return this;
  }
  pushBaseTransform(ctx) {
    this.#dependencyTracker.pushBaseTransform(ctx);
    return this;
  }
  popBaseTransform() {
    this.#dependencyTracker.popBaseTransform();
    return this;
  }
  recordSimpleData(name, idx) {
    this.#dependencyTracker.recordSimpleData(name, this.#opIdx);
    return this;
  }
  recordIncrementalData(name, idx) {
    this.#dependencyTracker.recordIncrementalData(name, this.#opIdx);
    return this;
  }
  resetIncrementalData(name, idx) {
    this.#dependencyTracker.resetIncrementalData(name, this.#opIdx);
    return this;
  }
  recordNamedData(name, idx) {
    return this;
  }
  recordSimpleDataFromNamed(name, depName, fallbackIdx) {
    this.#dependencyTracker.recordSimpleDataFromNamed(name, depName, this.#opIdx);
    return this;
  }
  recordFutureForcedDependency(name, idx) {
    this.#dependencyTracker.recordFutureForcedDependency(name, this.#opIdx);
    return this;
  }
  inheritSimpleDataAsFutureForcedDependencies(names) {
    this.#dependencyTracker.inheritSimpleDataAsFutureForcedDependencies(names);
    return this;
  }
  inheritPendingDependenciesAsFutureForcedDependencies() {
    this.#dependencyTracker.inheritPendingDependenciesAsFutureForcedDependencies();
    return this;
  }
  resetBBox(idx) {
    if (!this.#ignoreBBoxes) {
      this.#dependencyTracker.resetBBox(this.#opIdx);
    }
    return this;
  }
  recordClipBox(idx, ctx, minX, maxX, minY, maxY) {
    if (!this.#ignoreBBoxes) {
      this.#dependencyTracker.recordClipBox(this.#opIdx, ctx, minX, maxX, minY, maxY);
    }
    return this;
  }
  recordBBox(idx, ctx, minX, maxX, minY, maxY) {
    if (!this.#ignoreBBoxes) {
      this.#dependencyTracker.recordBBox(this.#opIdx, ctx, minX, maxX, minY, maxY);
    }
    return this;
  }
  recordCharacterBBox(idx, ctx, font, scale, x, y, getMeasure) {
    if (!this.#ignoreBBoxes) {
      this.#dependencyTracker.recordCharacterBBox(this.#opIdx, ctx, font, scale, x, y, getMeasure);
    }
    return this;
  }
  recordFullPageBBox(idx) {
    if (!this.#ignoreBBoxes) {
      this.#dependencyTracker.recordFullPageBBox(this.#opIdx);
    }
    return this;
  }
  getSimpleIndex(dependencyName) {
    return this.#dependencyTracker.getSimpleIndex(dependencyName);
  }
  recordDependencies(idx, dependencyNames) {
    this.#dependencyTracker.recordDependencies(this.#opIdx, dependencyNames);
    return this;
  }
  recordNamedDependency(idx, name) {
    this.#dependencyTracker.recordNamedDependency(this.#opIdx, name);
    return this;
  }
  recordOperation(idx) {
    this.#dependencyTracker.recordOperation(this.#opIdx, true);
    return this;
  }
  recordShowTextOperation(idx) {
    this.#dependencyTracker.recordShowTextOperation(this.#opIdx, true);
    return this;
  }
  bboxToClipBoxDropOperation(idx) {
    if (!this.#ignoreBBoxes) {
      this.#dependencyTracker.bboxToClipBoxDropOperation(this.#opIdx, true);
    }
    return this;
  }
  take() {
    throw new Error("Unreachable");
  }
  takeDebugMetadata() {
    throw new Error("Unreachable");
  }
}
const Dependencies = {
  stroke: ["path", "transform", "filter", "strokeColor", "strokeAlpha", "lineWidth", "lineCap", "lineJoin", "miterLimit", "dash"],
  fill: ["path", "transform", "filter", "fillColor", "fillAlpha", "globalCompositeOperation", "SMask"],
  imageXObject: ["transform", "SMask", "filter", "fillAlpha", "strokeAlpha", "globalCompositeOperation"],
  rawFillPath: ["filter", "fillColor", "fillAlpha"],
  showText: ["transform", "leading", "charSpacing", "wordSpacing", "hScale", "textRise", "moveText", "textMatrix", "font", "fontObj", "filter", "fillColor", "textRenderingMode", "SMask", "fillAlpha", "strokeAlpha", "globalCompositeOperation", "sameLineText"],
  transform: ["transform"],
  transformAndFill: ["transform", "fillColor"]
};
class CanvasImagesTracker {
  #canvasWidth;
  #canvasHeight;
  #capacity = 4;
  #count = 0;
  #coords = new CanvasImagesTracker.#CoordsArray(this.#capacity * 6);
  static #CoordsArray = FeatureTest.isFloat16ArraySupported ? Float16Array : Float32Array;
  constructor(canvas) {
    this.#canvasWidth = canvas.width;
    this.#canvasHeight = canvas.height;
  }
  record(ctx, width, height, clipBox) {
    if (this.#count === this.#capacity) {
      this.#capacity *= 2;
      const newCoords = new CanvasImagesTracker.#CoordsArray(this.#capacity * 6);
      newCoords.set(this.#coords);
      this.#coords = newCoords;
    }
    const transform = getCurrentTransform(ctx);
    let coords;
    if (clipBox[0] !== Infinity) {
      const bbox = BBOX_INIT.slice();
      Util.axialAlignedBoundingBox([0, -height, width, 0], transform, bbox);
      const finalBBox = Util.intersect(clipBox, bbox);
      if (!finalBBox) {
        return;
      }
      const [minX, minY, maxX, maxY] = finalBBox;
      if (minX !== bbox[0] || minY !== bbox[1] || maxX !== bbox[2] || maxY !== bbox[3]) {
        const rotationAngle = Math.atan2(transform[1], transform[0]);
        const sin = Math.abs(Math.sin(rotationAngle));
        const cos = Math.abs(Math.cos(rotationAngle));
        if (sin < 1e-6 || cos < 1e-6 || Math.abs(sin - cos) < 1e-6) {
          coords = [minX, minY, minX, maxY, maxX, minY];
        } else {
          const finalBBoxWidth = maxX - minX;
          const finalBBoxHeight = maxY - minY;
          const sin2 = sin * sin;
          const cos2 = cos * cos;
          const cosSin = cos * sin;
          const denom = cos2 - sin2;
          const a = (finalBBoxHeight * cos2 - finalBBoxWidth * cosSin) / denom;
          const b = (finalBBoxHeight * cosSin - finalBBoxWidth * sin2) / denom;
          coords = [minX + b, minY, minX, minY + a, maxX, maxY - a];
        }
      }
    }
    if (!coords) {
      coords = [0, -height, 0, 0, width, -height];
      Util.applyTransform(coords, transform, 0);
      Util.applyTransform(coords, transform, 2);
      Util.applyTransform(coords, transform, 4);
    }
    coords[0] /= this.#canvasWidth;
    coords[1] /= this.#canvasHeight;
    coords[2] /= this.#canvasWidth;
    coords[3] /= this.#canvasHeight;
    coords[4] /= this.#canvasWidth;
    coords[5] /= this.#canvasHeight;
    this.#coords.set(coords, this.#count * 6);
    this.#count++;
  }
  take() {
    return this.#coords.subarray(0, this.#count * 6);
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

;// ./src/display/font_loader.js



class FontLoader {
  #systemFonts = new Set();
  #styleSheet = null;
  constructor({
    ownerDocument = globalThis.document,
    styleElement = null
  }) {
    this._document = ownerDocument;
    this.nativeFontFaces = new Set();
    this.styleElement = null;
    this.loadingRequests = [];
    this.loadTestFontId = 0;
  }
  addNativeFontFace(nativeFontFace) {
    this.nativeFontFaces.add(nativeFontFace);
    this._document.fonts.add(nativeFontFace);
  }
  removeNativeFontFace(nativeFontFace) {
    this.nativeFontFaces.delete(nativeFontFace);
    this._document.fonts.delete(nativeFontFace);
  }
  insertRule(rule) {
    const styleSheet = this.#getStyleSheet();
    styleSheet.insertRule(rule, styleSheet.cssRules.length);
  }
  #getStyleSheet() {
    if (this.#styleSheet) {
      return this.#styleSheet;
    }
    const StyleSheet = this._document.defaultView?.CSSStyleSheet || globalThis.CSSStyleSheet;
    if (!this.styleElement && StyleSheet) {
      const {
        adoptedStyleSheets
      } = this._document;
      if (adoptedStyleSheets) {
        const styleSheet = new StyleSheet();
        adoptedStyleSheets.push(styleSheet);
        return this.#styleSheet = styleSheet;
      }
    }
    if (!this.styleElement) {
      this.styleElement = this._document.createElement("style");
      this._document.documentElement.getElementsByTagName("head")[0].append(this.styleElement);
    }
    return this.#styleSheet = this.styleElement.sheet;
  }
  clear() {
    for (const nativeFontFace of this.nativeFontFaces) {
      this._document.fonts.delete(nativeFontFace);
    }
    this.nativeFontFaces.clear();
    this.#systemFonts.clear();
    if (this.#styleSheet) {
      const {
        adoptedStyleSheets
      } = this._document;
      if (adoptedStyleSheets?.includes(this.#styleSheet)) {
        this._document.adoptedStyleSheets = adoptedStyleSheets.filter(styleSheet => styleSheet !== this.#styleSheet);
      }
      this.#styleSheet = null;
    }
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }
  async loadSystemFont({
    systemFontInfo: info,
    disableFontFace,
    _inspectFont
  }) {
    if (!info || this.#systemFonts.has(info.loadedName)) {
      return;
    }
    assert(!disableFontFace, "loadSystemFont shouldn't be called when `disableFontFace` is set.");
    if (this.isFontLoadingAPISupported) {
      const {
        loadedName,
        src,
        style
      } = info;
      const fontFace = new FontFace(loadedName, src, style);
      this.addNativeFontFace(fontFace);
      try {
        await fontFace.load();
        this.#systemFonts.add(loadedName);
        _inspectFont?.(info);
      } catch {
        warn(`Cannot load system font: ${info.baseFontName}, installing it could help to improve PDF rendering.`);
        this.removeNativeFontFace(fontFace);
      }
      return;
    }
    unreachable("Not implemented: loadSystemFont without the Font Loading API.");
  }
  async bind(font) {
    if (font.attached || font.missingFile && !font.systemFontInfo) {
      return;
    }
    font.attached = true;
    if (font.systemFontInfo) {
      await this.loadSystemFont(font);
      return;
    }
    if (this.isFontLoadingAPISupported) {
      const nativeFontFace = font.createNativeFontFace();
      if (nativeFontFace) {
        this.addNativeFontFace(nativeFontFace);
        try {
          await nativeFontFace.loaded;
        } catch (ex) {
          warn(`Failed to load font '${nativeFontFace.family}': '${ex}'.`);
          font.disableFontFace = true;
          throw ex;
        }
      }
      return;
    }
    const rule = font.createFontFaceRule();
    if (rule) {
      this.insertRule(rule);
      if (this.isSyncFontLoadingSupported) {
        return;
      }
      await new Promise(resolve => {
        const request = this._queueLoadingCallback(resolve);
        this._prepareFontLoadEvent(font, request);
      });
    }
  }
  get isFontLoadingAPISupported() {
    const hasFonts = !!this._document?.fonts;
    return shadow(this, "isFontLoadingAPISupported", hasFonts);
  }
  get isSyncFontLoadingSupported() {
    return shadow(this, "isSyncFontLoadingSupported", isNodeJS || FeatureTest.platform.isFirefox);
  }
  _queueLoadingCallback(callback) {
    function completeRequest() {
      assert(!request.done, "completeRequest() cannot be called twice.");
      request.done = true;
      while (loadingRequests.length > 0 && loadingRequests[0].done) {
        const otherRequest = loadingRequests.shift();
        setTimeout(otherRequest.callback, 0);
      }
    }
    const {
      loadingRequests
    } = this;
    const request = {
      done: false,
      complete: completeRequest,
      callback
    };
    loadingRequests.push(request);
    return request;
  }
  get _loadTestFont() {
    const testFont = atob("T1RUTwALAIAAAwAwQ0ZGIDHtZg4AAAOYAAAAgUZGVE1lkzZwAAAEHAAAABxHREVGABQA" + "FQAABDgAAAAeT1MvMlYNYwkAAAEgAAAAYGNtYXABDQLUAAACNAAAAUJoZWFk/xVFDQAA" + "ALwAAAA2aGhlYQdkA+oAAAD0AAAAJGhtdHgD6AAAAAAEWAAAAAZtYXhwAAJQAAAAARgA" + "AAAGbmFtZVjmdH4AAAGAAAAAsXBvc3T/hgAzAAADeAAAACAAAQAAAAEAALZRFsRfDzz1" + "AAsD6AAAAADOBOTLAAAAAM4KHDwAAAAAA+gDIQAAAAgAAgAAAAAAAAABAAADIQAAAFoD" + "6AAAAAAD6AABAAAAAAAAAAAAAAAAAAAAAQAAUAAAAgAAAAQD6AH0AAUAAAKKArwAAACM" + "AooCvAAAAeAAMQECAAACAAYJAAAAAAAAAAAAAQAAAAAAAAAAAAAAAFBmRWQAwAAuAC4D" + "IP84AFoDIQAAAAAAAQAAAAAAAAAAACAAIAABAAAADgCuAAEAAAAAAAAAAQAAAAEAAAAA" + "AAEAAQAAAAEAAAAAAAIAAQAAAAEAAAAAAAMAAQAAAAEAAAAAAAQAAQAAAAEAAAAAAAUA" + "AQAAAAEAAAAAAAYAAQAAAAMAAQQJAAAAAgABAAMAAQQJAAEAAgABAAMAAQQJAAIAAgAB" + "AAMAAQQJAAMAAgABAAMAAQQJAAQAAgABAAMAAQQJAAUAAgABAAMAAQQJAAYAAgABWABY" + "AAAAAAAAAwAAAAMAAAAcAAEAAAAAADwAAwABAAAAHAAEACAAAAAEAAQAAQAAAC7//wAA" + "AC7////TAAEAAAAAAAABBgAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + "AAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAD/gwAyAAAAAQAAAAAAAAAAAAAAAAAA" + "AAABAAQEAAEBAQJYAAEBASH4DwD4GwHEAvgcA/gXBIwMAYuL+nz5tQXkD5j3CBLnEQAC" + "AQEBIVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYAAABAQAADwACAQEEE/t3" + "Dov6fAH6fAT+fPp8+nwHDosMCvm1Cvm1DAz6fBQAAAAAAAABAAAAAMmJbzEAAAAAzgTj" + "FQAAAADOBOQpAAEAAAAAAAAADAAUAAQAAAABAAAAAgABAAAAAAAAAAAD6AAAAAAAAA==");
    return shadow(this, "_loadTestFont", testFont);
  }
  _prepareFontLoadEvent(font, request) {
    function int32(data, offset) {
      return data.charCodeAt(offset) << 24 | data.charCodeAt(offset + 1) << 16 | data.charCodeAt(offset + 2) << 8 | data.charCodeAt(offset + 3) & 0xff;
    }
    function string32(value) {
      return String.fromCharCode(value >> 24 & 0xff, value >> 16 & 0xff, value >> 8 & 0xff, value & 0xff);
    }
    function spliceString(s, offset, remove, insert) {
      const chunk1 = s.substring(0, offset);
      const chunk2 = s.substring(offset + remove);
      return chunk1 + insert + chunk2;
    }
    let i, ii;
    const canvas = this._document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    let called = 0;
    function isFontReady(name, callback) {
      if (++called > 30) {
        warn("Load test font never loaded.");
        callback();
        return;
      }
      ctx.font = "30px " + name;
      ctx.fillText(".", 0, 20);
      const imageData = ctx.getImageData(0, 0, 1, 1);
      if (imageData.data[3] > 0) {
        callback();
        return;
      }
      setTimeout(isFontReady.bind(null, name, callback));
    }
    const loadTestFontId = `lt${Date.now()}${this.loadTestFontId++}`;
    let data = this._loadTestFont;
    const COMMENT_OFFSET = 976;
    data = spliceString(data, COMMENT_OFFSET, loadTestFontId.length, loadTestFontId);
    const CFF_CHECKSUM_OFFSET = 16;
    const XXXX_VALUE = 0x58585858;
    let checksum = int32(data, CFF_CHECKSUM_OFFSET);
    for (i = 0, ii = loadTestFontId.length - 3; i < ii; i += 4) {
      checksum = checksum - XXXX_VALUE + int32(loadTestFontId, i) | 0;
    }
    if (i < loadTestFontId.length) {
      checksum = checksum - XXXX_VALUE + int32(loadTestFontId + "XXX", i) | 0;
    }
    data = spliceString(data, CFF_CHECKSUM_OFFSET, 4, string32(checksum));
    const url = `url(data:font/opentype;base64,${btoa(data)});`;
    const rule = `@font-face {font-family:"${loadTestFontId}";src:${url}}`;
    this.insertRule(rule);
    const div = this._document.createElement("div");
    div.style.visibility = "hidden";
    div.style.width = div.style.height = "10px";
    div.style.position = "absolute";
    div.style.top = div.style.left = "0px";
    for (const name of [font.loadedName, loadTestFontId]) {
      const span = this._document.createElement("span");
      span.textContent = "Hi";
      span.style.fontFamily = name;
      div.append(span);
    }
    this._document.body.append(div);
    isFontReady(loadTestFontId, () => {
      div.remove();
      request.complete();
    });
  }
}
class FontFaceObject {
  compiledGlyphs = Object.create(null);
  #fontData;
  constructor(translatedData, inspectFont = null, charProcOperatorList, extra) {
    this.#fontData = translatedData;
    this._inspectFont = inspectFont;
    if (charProcOperatorList) {
      this.charProcOperatorList = charProcOperatorList;
    }
    if (extra) {
      Object.assign(this, extra);
    }
  }
  createNativeFontFace() {
    if (!this.data || this.disableFontFace) {
      return null;
    }
    let nativeFontFace;
    if (!this.cssFontInfo) {
      nativeFontFace = new FontFace(this.loadedName, this.data, {});
    } else {
      const css = {
        weight: this.cssFontInfo.fontWeight
      };
      if (this.cssFontInfo.italicAngle) {
        css.style = `oblique ${this.cssFontInfo.italicAngle}deg`;
      }
      nativeFontFace = new FontFace(serializeFontFamily(this.cssFontInfo.fontFamily), this.data, css);
    }
    this._inspectFont?.(this);
    return nativeFontFace;
  }
  createFontFaceRule() {
    if (!this.data || this.disableFontFace) {
      return null;
    }
    const url = `url(data:${this.mimetype};base64,${this.data.toBase64()});`;
    let rule;
    if (!this.cssFontInfo) {
      rule = `@font-face {font-family:"${this.loadedName}";src:${url}}`;
    } else {
      let css = `font-weight: ${this.cssFontInfo.fontWeight};`;
      if (this.cssFontInfo.italicAngle) {
        css += `font-style: oblique ${this.cssFontInfo.italicAngle}deg;`;
      }
      const fontFamily = serializeFontFamily(this.cssFontInfo.fontFamily);
      rule = `@font-face {font-family:${fontFamily};${css}src:${url}}`;
    }
    this._inspectFont?.(this, url);
    return rule;
  }
  getPathGenerator(objs, character) {
    if (this.compiledGlyphs[character] !== undefined) {
      return this.compiledGlyphs[character];
    }
    const objId = this.loadedName + "_path_" + character;
    let cmds;
    try {
      cmds = objs.get(objId);
    } catch (ex) {
      warn(`getPathGenerator - ignoring character: "${ex}".`);
    }
    const path = makePathFromDrawOPS(cmds?.path);
    if (!this.fontExtraProperties) {
      objs.delete(objId);
    }
    return this.compiledGlyphs[character] = path;
  }
  get black() {
    return this.#fontData.black;
  }
  get bold() {
    return this.#fontData.bold;
  }
  get disableFontFace() {
    return this.#fontData.disableFontFace;
  }
  set disableFontFace(value) {
    shadow(this, "disableFontFace", !!value);
  }
  get fontExtraProperties() {
    return this.#fontData.fontExtraProperties;
  }
  get isInvalidPDFjsFont() {
    return this.#fontData.isInvalidPDFjsFont;
  }
  get isType3Font() {
    return this.#fontData.isType3Font;
  }
  get italic() {
    return this.#fontData.italic;
  }
  get missingFile() {
    return this.#fontData.missingFile;
  }
  get remeasure() {
    return this.#fontData.remeasure;
  }
  get vertical() {
    return this.#fontData.vertical;
  }
  get ascent() {
    return this.#fontData.ascent;
  }
  get defaultWidth() {
    return this.#fontData.defaultWidth;
  }
  get descent() {
    return this.#fontData.descent;
  }
  get bbox() {
    return this.#fontData.bbox;
  }
  get fontMatrix() {
    return this.#fontData.fontMatrix;
  }
  get fallbackName() {
    return this.#fontData.fallbackName;
  }
  get loadedName() {
    return this.#fontData.loadedName;
  }
  get mimetype() {
    return this.#fontData.mimetype;
  }
  get name() {
    return this.#fontData.name;
  }
  get data() {
    return this.#fontData.data;
  }
  clearData() {
    this.#fontData.clearData();
  }
  get cssFontInfo() {
    return this.#fontData.cssFontInfo;
  }
  get systemFontInfo() {
    return this.#fontData.systemFontInfo;
  }
  get defaultVMetrics() {
    return this.#fontData.defaultVMetrics;
  }
}

;// ./src/shared/obj_bin_transform_utils.js

class CSS_FONT_INFO {
  static strings = ["fontFamily", "fontWeight", "italicAngle"];
}
class SYSTEM_FONT_INFO {
  static strings = ["css", "loadedName", "baseFontName", "src"];
}
class FONT_INFO {
  static bools = ["black", "bold", "disableFontFace", "fontExtraProperties", "isInvalidPDFjsFont", "isType3Font", "italic", "missingFile", "remeasure", "vertical"];
  static numbers = ["ascent", "defaultWidth", "descent"];
  static strings = ["fallbackName", "loadedName", "mimetype", "name"];
  static OFFSET_NUMBERS = Math.ceil(this.bools.length * 2 / 8);
  static OFFSET_BBOX = this.OFFSET_NUMBERS + this.numbers.length * 8;
  static OFFSET_FONT_MATRIX = this.OFFSET_BBOX + 1 + 2 * 4;
  static OFFSET_DEFAULT_VMETRICS = this.OFFSET_FONT_MATRIX + 1 + 8 * 6;
  static OFFSET_STRINGS = this.OFFSET_DEFAULT_VMETRICS + 1 + 2 * 3;
}
class PATTERN_INFO {
  static KIND = 0;
  static HAS_BBOX = 1;
  static HAS_BACKGROUND = 2;
  static SHADING_TYPE = 3;
  static N_COORD = 4;
  static N_COLOR = 8;
  static N_STOP = 12;
  static N_FIGURES = 16;
}
class InfoUtils {
  static get decoder() {
    return shadow(this, "decoder", new TextDecoder());
  }
  static get encoder() {
    return shadow(this, "encoder", new TextEncoder());
  }
}

;// ./src/display/obj_bin_transform_display.js


class CssFontInfo {
  #buffer;
  #view;
  constructor(buffer) {
    this.#buffer = buffer;
    this.#view = new DataView(buffer);
  }
  #readString(index) {
    assert(index < CSS_FONT_INFO.strings.length, "Invalid string index");
    const {
      decoder
    } = InfoUtils;
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.#view.getUint32(offset) + 4;
    }
    const length = this.#view.getUint32(offset);
    return decoder.decode(new Uint8Array(this.#buffer, offset + 4, length));
  }
  get fontFamily() {
    return this.#readString(0);
  }
  get fontWeight() {
    return this.#readString(1);
  }
  get italicAngle() {
    return this.#readString(2);
  }
}
class SystemFontInfo {
  #buffer;
  #view;
  constructor(buffer) {
    this.#buffer = buffer;
    this.#view = new DataView(buffer);
  }
  get guessFallback() {
    return this.#view.getUint8(0) !== 0;
  }
  #readString(index) {
    assert(index < SYSTEM_FONT_INFO.strings.length, "Invalid string index");
    const {
      decoder
    } = InfoUtils;
    let offset = 5;
    for (let i = 0; i < index; i++) {
      offset += this.#view.getUint32(offset) + 4;
    }
    const length = this.#view.getUint32(offset);
    return decoder.decode(new Uint8Array(this.#buffer, offset + 4, length));
  }
  get css() {
    return this.#readString(0);
  }
  get loadedName() {
    return this.#readString(1);
  }
  get baseFontName() {
    return this.#readString(2);
  }
  get src() {
    return this.#readString(3);
  }
  get style() {
    const {
      decoder
    } = InfoUtils;
    let offset = 1;
    offset += 4 + this.#view.getUint32(offset);
    const styleLength = this.#view.getUint32(offset);
    const style = decoder.decode(new Uint8Array(this.#buffer, offset + 4, styleLength));
    offset += 4 + styleLength;
    const weightLength = this.#view.getUint32(offset);
    const weight = decoder.decode(new Uint8Array(this.#buffer, offset + 4, weightLength));
    return {
      style,
      weight
    };
  }
}
class FontInfo {
  #buffer;
  #view;
  constructor({
    buffer,
    extra
  }) {
    this.#buffer = buffer;
    this.#view = new DataView(buffer);
    if (extra) {
      Object.assign(this, extra);
    }
  }
  #readBoolean(index) {
    assert(index < FONT_INFO.bools.length, "Invalid boolean index");
    const byteOffset = Math.floor(index / 4);
    const bitOffset = index * 2 % 8;
    const value = this.#view.getUint8(byteOffset) >> bitOffset & 0x03;
    return value === 0x00 ? undefined : value === 0x02;
  }
  get black() {
    return this.#readBoolean(0);
  }
  get bold() {
    return this.#readBoolean(1);
  }
  get disableFontFace() {
    return this.#readBoolean(2);
  }
  get fontExtraProperties() {
    return this.#readBoolean(3);
  }
  get isInvalidPDFjsFont() {
    return this.#readBoolean(4);
  }
  get isType3Font() {
    return this.#readBoolean(5);
  }
  get italic() {
    return this.#readBoolean(6);
  }
  get missingFile() {
    return this.#readBoolean(7);
  }
  get remeasure() {
    return this.#readBoolean(8);
  }
  get vertical() {
    return this.#readBoolean(9);
  }
  #readNumber(index) {
    assert(index < FONT_INFO.numbers.length, "Invalid number index");
    return this.#view.getFloat64(FONT_INFO.OFFSET_NUMBERS + index * 8);
  }
  get ascent() {
    return this.#readNumber(0);
  }
  get defaultWidth() {
    return this.#readNumber(1);
  }
  get descent() {
    return this.#readNumber(2);
  }
  #readArray(offset, arrLen, lookupName, increment) {
    const len = this.#view.getUint8(offset);
    if (len === 0) {
      return undefined;
    }
    assert(len === arrLen, "Invalid array length.");
    offset += 1;
    const arr = new Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = this.#view[lookupName](offset, true);
      offset += increment;
    }
    return arr;
  }
  get bbox() {
    return this.#readArray(FONT_INFO.OFFSET_BBOX, 4, "getInt16", 2);
  }
  get fontMatrix() {
    return this.#readArray(FONT_INFO.OFFSET_FONT_MATRIX, 6, "getFloat64", 8);
  }
  get defaultVMetrics() {
    return this.#readArray(FONT_INFO.OFFSET_DEFAULT_VMETRICS, 3, "getInt16", 2);
  }
  #readString(index) {
    assert(index < FONT_INFO.strings.length, "Invalid string index");
    const {
      decoder
    } = InfoUtils;
    let offset = FONT_INFO.OFFSET_STRINGS + 4;
    for (let i = 0; i < index; i++) {
      offset += this.#view.getUint32(offset) + 4;
    }
    const length = this.#view.getUint32(offset);
    return decoder.decode(new Uint8Array(this.#buffer, offset + 4, length));
  }
  get fallbackName() {
    return this.#readString(0);
  }
  get loadedName() {
    return this.#readString(1);
  }
  get mimetype() {
    return this.#readString(2);
  }
  get name() {
    return this.#readString(3);
  }
  #getDataOffsets() {
    let offset = FONT_INFO.OFFSET_STRINGS;
    const stringsLength = this.#view.getUint32(offset);
    offset += 4 + stringsLength;
    const systemFontInfoLength = this.#view.getUint32(offset);
    offset += 4 + systemFontInfoLength;
    const cssFontInfoLength = this.#view.getUint32(offset);
    offset += 4 + cssFontInfoLength;
    const length = this.#view.getUint32(offset);
    return {
      offset,
      length
    };
  }
  get data() {
    const {
      offset,
      length
    } = this.#getDataOffsets();
    return length === 0 ? undefined : new Uint8Array(this.#buffer, offset + 4, length);
  }
  clearData() {
    const {
      offset,
      length
    } = this.#getDataOffsets();
    if (length === 0) {
      return;
    }
    this.#view.setUint32(offset, 0);
    this.#buffer = new Uint8Array(this.#buffer, 0, offset + 4).slice().buffer;
    this.#view = new DataView(this.#buffer);
  }
  get cssFontInfo() {
    let offset = FONT_INFO.OFFSET_STRINGS;
    const stringsLength = this.#view.getUint32(offset);
    offset += 4 + stringsLength;
    const systemFontInfoLength = this.#view.getUint32(offset);
    offset += 4 + systemFontInfoLength;
    const cssFontInfoLength = this.#view.getUint32(offset);
    if (cssFontInfoLength === 0) {
      return null;
    }
    const cssFontInfoData = new Uint8Array(cssFontInfoLength);
    cssFontInfoData.set(new Uint8Array(this.#buffer, offset + 4, cssFontInfoLength));
    return new CssFontInfo(cssFontInfoData.buffer);
  }
  get systemFontInfo() {
    let offset = FONT_INFO.OFFSET_STRINGS;
    const stringsLength = this.#view.getUint32(offset);
    offset += 4 + stringsLength;
    const systemFontInfoLength = this.#view.getUint32(offset);
    if (systemFontInfoLength === 0) {
      return null;
    }
    const systemFontInfoData = new Uint8Array(systemFontInfoLength);
    systemFontInfoData.set(new Uint8Array(this.#buffer, offset + 4, systemFontInfoLength));
    return new SystemFontInfo(systemFontInfoData.buffer);
  }
}
class PatternInfo {
  constructor(buffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.data = new Uint8Array(buffer);
  }
  getIR() {
    const dataView = this.view;
    const kind = this.data[PATTERN_INFO.KIND];
    const hasBBox = !!this.data[PATTERN_INFO.HAS_BBOX];
    const hasBackground = !!this.data[PATTERN_INFO.HAS_BACKGROUND];
    const nCoord = dataView.getUint32(PATTERN_INFO.N_COORD, true);
    const nColor = dataView.getUint32(PATTERN_INFO.N_COLOR, true);
    const nStop = dataView.getUint32(PATTERN_INFO.N_STOP, true);
    let offset = 20;
    const coords = new Float32Array(this.buffer, offset, nCoord * 2);
    offset += nCoord * 8;
    const colors = new Uint8Array(this.buffer, offset, nColor * 4);
    offset += nColor * 4;
    const stops = [];
    for (let i = 0; i < nStop; ++i) {
      const p = dataView.getFloat32(offset, true);
      offset += 4;
      const rgb = dataView.getUint32(offset, true);
      offset += 4;
      stops.push([p, `#${rgb.toString(16).padStart(6, "0")}`]);
    }
    let bbox = null;
    if (hasBBox) {
      bbox = [];
      for (let i = 0; i < 4; ++i) {
        bbox.push(dataView.getFloat32(offset, true));
        offset += 4;
      }
    }
    let background = null;
    if (hasBackground) {
      background = new Uint8Array(this.buffer, offset, 3);
      offset += 3;
    }
    if (kind === 1) {
      return ["RadialAxial", "axial", bbox, stops, Array.from(coords.slice(0, 2)), Array.from(coords.slice(2, 4)), null, null];
    }
    if (kind === 2) {
      return ["RadialAxial", "radial", bbox, stops, [coords[0], coords[1]], [coords[3], coords[4]], coords[2], coords[5]];
    }
    if (kind === 3) {
      const shadingType = this.data[PATTERN_INFO.SHADING_TYPE];
      let bounds = null;
      if (coords.length > 0) {
        bounds = BBOX_INIT.slice();
        for (let i = 0, ii = coords.length; i < ii; i += 2) {
          Util.pointBoundingBox(coords[i], coords[i + 1], bounds);
        }
      }
      return ["Mesh", shadingType, coords, colors, nCoord, bounds, bbox, background];
    }
    throw new Error(`Unsupported pattern kind: ${kind}`);
  }
}
class FontPathInfo {
  #buffer;
  constructor(buffer) {
    this.#buffer = buffer;
  }
  get path() {
    if (FeatureTest.isFloat16ArraySupported) {
      return new Float16Array(this.#buffer);
    }
    return new Float32Array(this.#buffer);
  }
}

;// ./src/display/api_utils.js

function getUrlProp(val) {
  if (val instanceof URL) {
    return val;
  }
  if (typeof val === "string") {
    if (isNodeJS) {
      if (/^[a-z][a-z0-9\-+.]+:/i.test(val)) {
        return new URL(val);
      }
      const url = process.getBuiltinModule("url");
      return new URL(url.pathToFileURL(val));
    }
    const url = URL.parse(val, window.location);
    if (url) {
      return url;
    }
  }
  throw new Error("Invalid PDF url data: " + "either string or URL-object is expected in the url property.");
}
function getDataProp(val) {
  if (isNodeJS && typeof Buffer !== "undefined" && val instanceof Buffer) {
    throw new Error("Please provide binary data as `Uint8Array`, rather than `Buffer`.");
  }
  if (val instanceof Uint8Array && val.byteLength === val.buffer.byteLength) {
    return val;
  }
  if (typeof val === "string") {
    return stringToBytes(val);
  }
  if (val instanceof ArrayBuffer || ArrayBuffer.isView(val) || typeof val === "object" && !isNaN(val?.length)) {
    return new Uint8Array(val);
  }
  throw new Error("Invalid PDF binary data: either TypedArray, " + "string, or array-like object is expected in the data property.");
}
function getFactoryUrlProp(val) {
  if (typeof val !== "string") {
    return null;
  }
  if (val.endsWith("/")) {
    return val;
  }
  throw new Error(`Invalid factory url: "${val}" must include trailing slash.`);
}
const isRefProxy = v => typeof v === "object" && Number.isInteger(v?.num) && v.num >= 0 && Number.isInteger(v?.gen) && v.gen >= 0;
const isNameProxy = v => typeof v === "object" && typeof v?.name === "string";
const isValidExplicitDest = _isValidExplicitDest.bind(null, isRefProxy, isNameProxy);
class LoopbackPort {
  #listeners = new Map();
  #deferred = Promise.resolve();
  postMessage(obj, transfer) {
    const event = {
      data: structuredClone(obj, transfer ? {
        transfer
      } : null)
    };
    this.#deferred.then(() => {
      for (const [listener] of this.#listeners) {
        listener.call(this, event);
      }
    });
  }
  addEventListener(name, listener, options = null) {
    let rmAbort = null;
    if (options?.signal instanceof AbortSignal) {
      const {
        signal
      } = options;
      if (signal.aborted) {
        warn("LoopbackPort - cannot use an `aborted` signal.");
        return;
      }
      const onAbort = () => this.removeEventListener(name, listener);
      rmAbort = () => signal.removeEventListener("abort", onAbort);
      signal.addEventListener("abort", onAbort);
    }
    this.#listeners.set(listener, rmAbort);
  }
  removeEventListener(name, listener) {
    const rmAbort = this.#listeners.get(listener);
    rmAbort?.();
    this.#listeners.delete(listener);
  }
  terminate() {
    for (const [, rmAbort] of this.#listeners) {
      rmAbort?.();
    }
    this.#listeners.clear();
  }
}

;// ./src/shared/message_handler.js

const CallbackKind = {
  DATA: 1,
  ERROR: 2
};
const StreamKind = {
  CANCEL: 1,
  CANCEL_COMPLETE: 2,
  CLOSE: 3,
  ENQUEUE: 4,
  ERROR: 5,
  PULL: 6,
  PULL_COMPLETE: 7,
  START_COMPLETE: 8
};
function onFn() {}
function wrapReason(ex) {
  if (ex instanceof AbortException || ex instanceof InvalidPDFException || ex instanceof PasswordException || ex instanceof ResponseException || ex instanceof UnknownErrorException) {
    return ex;
  }
  if (!(ex instanceof Error || typeof ex === "object" && ex !== null)) {
    unreachable('wrapReason: Expected "reason" to be a (possibly cloned) Error.');
  }
  switch (ex.name) {
    case "AbortException":
      return new AbortException(ex.message);
    case "InvalidPDFException":
      return new InvalidPDFException(ex.message);
    case "PasswordException":
      return new PasswordException(ex.message, ex.code);
    case "ResponseException":
      return new ResponseException(ex.message, ex.status, ex.missing);
    case "UnknownErrorException":
      return new UnknownErrorException(ex.message, ex.details);
  }
  return new UnknownErrorException(ex.message, ex.toString());
}
class MessageHandler {
  #messageAC = new AbortController();
  constructor(sourceName, targetName, comObj) {
    this.sourceName = sourceName;
    this.targetName = targetName;
    this.comObj = comObj;
    this.callbackId = 1;
    this.streamId = 1;
    this.streamSinks = Object.create(null);
    this.streamControllers = Object.create(null);
    this.callbackCapabilities = Object.create(null);
    this.actionHandler = Object.create(null);
    comObj.addEventListener("message", this.#onMessage.bind(this), {
      signal: this.#messageAC.signal
    });
  }
  #onMessage({
    data
  }) {
    if (data.targetName !== this.sourceName) {
      return;
    }
    if (data.stream) {
      this.#processStreamMessage(data);
      return;
    }
    if (data.callback) {
      const callbackId = data.callbackId;
      const capability = this.callbackCapabilities[callbackId];
      if (!capability) {
        throw new Error(`Cannot resolve callback ${callbackId}`);
      }
      delete this.callbackCapabilities[callbackId];
      if (data.callback === CallbackKind.DATA) {
        capability.resolve(data.data);
      } else if (data.callback === CallbackKind.ERROR) {
        capability.reject(wrapReason(data.reason));
      } else {
        throw new Error("Unexpected callback case");
      }
      return;
    }
    const action = this.actionHandler[data.action];
    if (!action) {
      throw new Error(`Unknown action from worker: ${data.action}`);
    }
    if (data.callbackId) {
      const sourceName = this.sourceName,
        targetName = data.sourceName,
        comObj = this.comObj;
      Promise.try(action, data.data).then(function (result) {
        comObj.postMessage({
          sourceName,
          targetName,
          callback: CallbackKind.DATA,
          callbackId: data.callbackId,
          data: result
        });
      }, function (reason) {
        comObj.postMessage({
          sourceName,
          targetName,
          callback: CallbackKind.ERROR,
          callbackId: data.callbackId,
          reason: wrapReason(reason)
        });
      });
      return;
    }
    if (data.streamId) {
      this.#createStreamSink(data);
      return;
    }
    action(data.data);
  }
  on(actionName, handler) {
    const ah = this.actionHandler;
    if (ah[actionName]) {
      throw new Error(`There is already an actionName called "${actionName}"`);
    }
    ah[actionName] = handler;
  }
  send(actionName, data, transfers) {
    this.comObj.postMessage({
      sourceName: this.sourceName,
      targetName: this.targetName,
      action: actionName,
      data
    }, transfers);
  }
  sendWithPromise(actionName, data, transfers) {
    const callbackId = this.callbackId++;
    const capability = Promise.withResolvers();
    this.callbackCapabilities[callbackId] = capability;
    try {
      this.comObj.postMessage({
        sourceName: this.sourceName,
        targetName: this.targetName,
        action: actionName,
        callbackId,
        data
      }, transfers);
    } catch (ex) {
      capability.reject(ex);
    }
    return capability.promise;
  }
  sendWithStream(actionName, data, queueingStrategy, transfers) {
    const streamId = this.streamId++,
      sourceName = this.sourceName,
      targetName = this.targetName,
      comObj = this.comObj;
    return new ReadableStream({
      start: controller => {
        const startCapability = Promise.withResolvers();
        this.streamControllers[streamId] = {
          controller,
          startCall: startCapability,
          pullCall: null,
          cancelCall: null,
          isClosed: false
        };
        comObj.postMessage({
          sourceName,
          targetName,
          action: actionName,
          streamId,
          data,
          desiredSize: controller.desiredSize
        }, transfers);
        return startCapability.promise;
      },
      pull: controller => {
        const pullCapability = Promise.withResolvers();
        this.streamControllers[streamId].pullCall = pullCapability;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.PULL,
          streamId,
          desiredSize: controller.desiredSize
        });
        return pullCapability.promise;
      },
      cancel: reason => {
        assert(reason instanceof Error, "cancel must have a valid reason");
        const cancelCapability = Promise.withResolvers();
        this.streamControllers[streamId].cancelCall = cancelCapability;
        this.streamControllers[streamId].isClosed = true;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.CANCEL,
          streamId,
          reason: wrapReason(reason)
        });
        return cancelCapability.promise;
      }
    }, queueingStrategy);
  }
  #createStreamSink(data) {
    const streamId = data.streamId,
      sourceName = this.sourceName,
      targetName = data.sourceName,
      comObj = this.comObj;
    const self = this,
      action = this.actionHandler[data.action];
    const streamSink = {
      enqueue(chunk, size = 1, transfers) {
        if (this.isCancelled) {
          return;
        }
        const lastDesiredSize = this.desiredSize;
        this.desiredSize -= size;
        if (lastDesiredSize > 0 && this.desiredSize <= 0) {
          this.sinkCapability = Promise.withResolvers();
          this.ready = this.sinkCapability.promise;
        }
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.ENQUEUE,
          streamId,
          chunk
        }, transfers);
      },
      close() {
        if (this.isCancelled) {
          return;
        }
        this.isCancelled = true;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.CLOSE,
          streamId
        });
        delete self.streamSinks[streamId];
      },
      error(reason) {
        assert(reason instanceof Error, "error must have a valid reason");
        if (this.isCancelled) {
          return;
        }
        this.isCancelled = true;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.ERROR,
          streamId,
          reason: wrapReason(reason)
        });
      },
      sinkCapability: Promise.withResolvers(),
      onPull: null,
      onCancel: null,
      isCancelled: false,
      desiredSize: data.desiredSize,
      ready: null
    };
    streamSink.sinkCapability.resolve();
    streamSink.ready = streamSink.sinkCapability.promise;
    this.streamSinks[streamId] = streamSink;
    Promise.try(action, data.data, streamSink).then(function () {
      comObj.postMessage({
        sourceName,
        targetName,
        stream: StreamKind.START_COMPLETE,
        streamId,
        success: true
      });
    }, function (reason) {
      comObj.postMessage({
        sourceName,
        targetName,
        stream: StreamKind.START_COMPLETE,
        streamId,
        reason: wrapReason(reason)
      });
    });
  }
  #processStreamMessage(data) {
    const streamId = data.streamId,
      sourceName = this.sourceName,
      targetName = data.sourceName,
      comObj = this.comObj;
    const streamController = this.streamControllers[streamId],
      streamSink = this.streamSinks[streamId];
    switch (data.stream) {
      case StreamKind.START_COMPLETE:
        if (data.success) {
          streamController.startCall.resolve();
        } else {
          streamController.startCall.reject(wrapReason(data.reason));
        }
        break;
      case StreamKind.PULL_COMPLETE:
        if (data.success) {
          streamController.pullCall.resolve();
        } else {
          streamController.pullCall.reject(wrapReason(data.reason));
        }
        break;
      case StreamKind.PULL:
        if (!streamSink) {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.PULL_COMPLETE,
            streamId,
            success: true
          });
          break;
        }
        if (streamSink.desiredSize <= 0 && data.desiredSize > 0) {
          streamSink.sinkCapability.resolve();
        }
        streamSink.desiredSize = data.desiredSize;
        Promise.try(streamSink.onPull || onFn).then(function () {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.PULL_COMPLETE,
            streamId,
            success: true
          });
        }, function (reason) {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.PULL_COMPLETE,
            streamId,
            reason: wrapReason(reason)
          });
        });
        break;
      case StreamKind.ENQUEUE:
        assert(streamController, "enqueue should have stream controller");
        if (streamController.isClosed) {
          break;
        }
        streamController.controller.enqueue(data.chunk);
        break;
      case StreamKind.CLOSE:
        assert(streamController, "close should have stream controller");
        if (streamController.isClosed) {
          break;
        }
        streamController.isClosed = true;
        streamController.controller.close();
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.ERROR:
        assert(streamController, "error should have stream controller");
        streamController.controller.error(wrapReason(data.reason));
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.CANCEL_COMPLETE:
        if (data.success) {
          streamController.cancelCall.resolve();
        } else {
          streamController.cancelCall.reject(wrapReason(data.reason));
        }
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.CANCEL:
        if (!streamSink) {
          break;
        }
        const dataReason = wrapReason(data.reason);
        Promise.try(streamSink.onCancel || onFn, dataReason).then(function () {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.CANCEL_COMPLETE,
            streamId,
            success: true
          });
        }, function (reason) {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.CANCEL_COMPLETE,
            streamId,
            reason: wrapReason(reason)
          });
        });
        streamSink.sinkCapability.reject(dataReason);
        streamSink.isCancelled = true;
        delete this.streamSinks[streamId];
        break;
      default:
        throw new Error("Unexpected stream case");
    }
  }
  async #deleteStreamController(streamController, streamId) {
    await Promise.allSettled([streamController.startCall?.promise, streamController.pullCall?.promise, streamController.cancelCall?.promise]);
    delete this.streamControllers[streamId];
  }
  destroy() {
    this.#messageAC?.abort();
    this.#messageAC = null;
  }
}

;// ./src/display/binary_data_factory.js


class BaseBinaryDataFactory {
  #errorStr = Object.freeze({
    cMapUrl: "CMap",
    standardFontDataUrl: "font",
    wasmUrl: "wasm"
  });
  constructor({
    cMapUrl = null,
    standardFontDataUrl = null,
    wasmUrl = null
  }) {
    this.cMapUrl = cMapUrl;
    this.standardFontDataUrl = standardFontDataUrl;
    this.wasmUrl = wasmUrl;
  }
  async fetch({
    kind,
    filename
  }) {
    switch (kind) {
      case "cMapUrl":
      case "standardFontDataUrl":
      case "wasmUrl":
        break;
      default:
        unreachable(`Not implemented: ${kind}`);
    }
    const baseUrl = this[kind];
    if (!baseUrl) {
      throw new Error(`Ensure that the \`${kind}\` API parameter is provided.`);
    }
    const url = `${baseUrl}${filename}`;
    return this._fetch(url, kind).catch(reason => {
      throw new Error(`Unable to load ${this.#errorStr[kind]} data at: ${url}`);
    });
  }
  async _fetch(url, kind) {
    unreachable("Abstract method `_fetch` called.");
  }
}
class DOMBinaryDataFactory extends BaseBinaryDataFactory {
  async _fetch(url, kind) {
    const type = kind === "cMapUrl" && !url.endsWith(".bcmap") ? "text" : "bytes";
    const data = await fetchData(url, type);
    return data instanceof Uint8Array ? data : stringToBytes(data);
  }
}

;// ./src/display/canvas_factory.js

class BaseCanvasFactory {
  #enableHWA = false;
  constructor({
    enableHWA = false
  }) {
    this.#enableHWA = enableHWA;
  }
  create(width, height) {
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid canvas size");
    }
    const canvas = this._createCanvas(width, height);
    return {
      canvas,
      context: canvas.getContext("2d", {
        willReadFrequently: !this.#enableHWA
      })
    };
  }
  reset({
    canvas
  }, width, height) {
    if (!canvas) {
      throw new Error("Canvas is not specified");
    }
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid canvas size");
    }
    canvas.width = width;
    canvas.height = height;
  }
  destroy(canvasAndContext) {
    const {
      canvas
    } = canvasAndContext;
    if (!canvas) {
      throw new Error("Canvas is not specified");
    }
    canvas.width = canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
  _createCanvas(width, height) {
    unreachable("Abstract method `_createCanvas` called.");
  }
}
class DOMCanvasFactory extends BaseCanvasFactory {
  constructor({
    ownerDocument = globalThis.document,
    enableHWA = false
  }) {
    super({
      enableHWA
    });
    this._document = ownerDocument;
  }
  _createCanvas(width, height) {
    const canvas = this._document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
}

;// ./src/display/filter_factory.js


class BaseFilterFactory {
  addFilter(maps) {
    return "none";
  }
  addHCMFilter(fgColor, bgColor) {
    return "none";
  }
  addAlphaFilter(map) {
    return "none";
  }
  addLuminosityFilter(map) {
    return "none";
  }
  addKnockoutFilter(alpha = 0) {
    return "none";
  }
  addHighlightHCMFilter(filterName, fgColor, bgColor, newFgColor, newBgColor) {
    return "none";
  }
  addSelectionHCMFilter(fgColor, bgColor) {
    return "none";
  }
  addSelectionFilter() {
    return "none";
  }
  createSelectionStyle(pageColors = null) {
    return null;
  }
  destroy(keepHCM = false) {}
}
class DOMFilterFactory extends BaseFilterFactory {
  #baseUrl;
  #_cache;
  #_defs;
  #docId;
  #document;
  #_hcmCache;
  #id = 0;
  constructor({
    docId,
    ownerDocument = globalThis.document
  }) {
    super();
    this.#docId = docId;
    this.#document = ownerDocument;
  }
  get #cache() {
    return this.#_cache ||= new Map();
  }
  get #hcmCache() {
    return this.#_hcmCache ||= new Map();
  }
  get #defs() {
    if (!this.#_defs) {
      const div = this.#document.createElement("div");
      const {
        style
      } = div;
      style.colorScheme = "only light";
      style.visibility = "hidden";
      style.contain = "strict";
      style.width = style.height = 0;
      style.position = "absolute";
      style.top = style.left = 0;
      style.zIndex = -1;
      const svg = this.#document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("width", 0);
      svg.setAttribute("height", 0);
      this.#_defs = this.#document.createElementNS(SVG_NS, "defs");
      div.append(svg);
      svg.append(this.#_defs);
      this.#document.body.append(div);
    }
    return this.#_defs;
  }
  #createTables(maps) {
    if (maps.length === 1) {
      const mapR = maps[0];
      const buffer = new Array(256);
      for (let i = 0; i < 256; i++) {
        buffer[i] = mapR[i] / 255;
      }
      const table = buffer.join(",");
      return [table, table, table];
    }
    const [mapR, mapG, mapB] = maps;
    const bufferR = new Array(256);
    const bufferG = new Array(256);
    const bufferB = new Array(256);
    for (let i = 0; i < 256; i++) {
      bufferR[i] = mapR[i] / 255;
      bufferG[i] = mapG[i] / 255;
      bufferB[i] = mapB[i] / 255;
    }
    return [bufferR.join(","), bufferG.join(","), bufferB.join(",")];
  }
  #createUrl(id) {
    if (this.#baseUrl === undefined) {
      this.#baseUrl = "";
      const url = this.#document.URL;
      if (url !== this.#document.baseURI) {
        if (isDataScheme(url)) {
          warn('#createUrl: ignore "data:"-URL for performance reasons.');
        } else {
          this.#baseUrl = updateUrlHash(url, "");
        }
      }
    }
    return `url(${this.#baseUrl}#${id})`;
  }
  addFilter(maps) {
    if (!maps) {
      return "none";
    }
    let value = this.#cache.get(maps);
    if (value) {
      return value;
    }
    const [tableR, tableG, tableB] = this.#createTables(maps);
    const key = maps.length === 1 ? tableR : `${tableR}${tableG}${tableB}`;
    value = this.#cache.get(key);
    if (value) {
      this.#cache.set(maps, value);
      return value;
    }
    const id = `g_${this.#docId}_transfer_map_${this.#id++}`;
    const url = this.#createUrl(id);
    this.#cache.set(maps, url);
    this.#cache.set(key, url);
    const filter = this.#createFilter(id);
    this.#addTransferMapConversion(tableR, tableG, tableB, filter);
    return url;
  }
  addHCMFilter(fgColor, bgColor) {
    const key = `${fgColor}-${bgColor}`;
    const filterName = "base";
    let info = this.#hcmCache.get(filterName);
    if (info?.key === key) {
      return info.url;
    }
    if (info) {
      info.filter?.remove();
      info.key = key;
      info.url = "none";
      info.filter = null;
    } else {
      info = {
        key,
        url: "none",
        filter: null
      };
      this.#hcmCache.set(filterName, info);
    }
    if (!fgColor || !bgColor) {
      return info.url;
    }
    const fgRGB = this.#getRGB(fgColor);
    fgColor = Util.makeHexColor(...fgRGB);
    const bgRGB = this.#getRGB(bgColor);
    bgColor = Util.makeHexColor(...bgRGB);
    this.#resetDefsColor();
    if (fgColor === "#000000" && bgColor === "#ffffff" || fgColor === bgColor) {
      return info.url;
    }
    const map = Array.from({
      length: 256
    }, (_, i) => computeLuminance(i / 255));
    const table = map.join(",");
    const id = `g_${this.#docId}_hcm_filter`;
    const filter = info.filter = this.#createFilter(id);
    this.#addTransferMapConversion(table, table, table, filter);
    this.#addGrayConversion(filter);
    const getSteps = (c, n) => {
      const start = fgRGB[c] / 255;
      const end = bgRGB[c] / 255;
      const arr = new Array(n + 1);
      for (let i = 0; i <= n; i++) {
        arr[i] = start + i / n * (end - start);
      }
      return arr.join(",");
    };
    this.#addTransferMapConversion(getSteps(0, 5), getSteps(1, 5), getSteps(2, 5), filter);
    info.url = this.#createUrl(id);
    return info.url;
  }
  addSelectionHCMFilter(fgColor, bgColor) {
    return this.addHighlightHCMFilter("selection", fgColor, bgColor, "HighlightText", "Highlight");
  }
  addSelectionFilter() {
    return this.addHighlightHCMFilter("selection_default", "black", "white", "HighlightText", "Highlight");
  }
  createSelectionStyle(pageColors = null) {
    const filter = pageColors ? this.addSelectionHCMFilter(pageColors.foreground, pageColors.background) : this.addSelectionFilter();
    if (filter === "none" || !FeatureTest.platform.isFirefox) {
      return null;
    }
    return {
      "backdrop-filter": filter,
      "background-color": "transparent"
    };
  }
  addAlphaFilter(map) {
    let value = this.#cache.get(map);
    if (value) {
      return value;
    }
    const [tableA] = this.#createTables([map]);
    const key = `alpha_${tableA}`;
    value = this.#cache.get(key);
    if (value) {
      this.#cache.set(map, value);
      return value;
    }
    const id = `g_${this.#docId}_alpha_map_${this.#id++}`;
    const url = this.#createUrl(id);
    this.#cache.set(map, url);
    this.#cache.set(key, url);
    const filter = this.#createFilter(id);
    this.#addTransferMapAlphaConversion(tableA, filter);
    return url;
  }
  addLuminosityFilter(map) {
    let value = this.#cache.get(map || "luminosity");
    if (value) {
      return value;
    }
    let tableA, key;
    if (map) {
      [tableA] = this.#createTables([map]);
      key = `luminosity_${tableA}`;
    } else {
      key = "luminosity";
    }
    value = this.#cache.get(key);
    if (value) {
      this.#cache.set(map, value);
      return value;
    }
    const id = `g_${this.#docId}_luminosity_map_${this.#id++}`;
    const url = this.#createUrl(id);
    this.#cache.set(map, url);
    this.#cache.set(key, url);
    const filter = this.#createFilter(id);
    this.#addLuminosityConversion(filter);
    if (map) {
      this.#addTransferMapAlphaConversion(tableA, filter);
    }
    return url;
  }
  addKnockoutFilter(alpha = 0) {
    const slope = alpha > 0 ? Math.min(1 / alpha, 1e6) : 1e6;
    const key = `knockout_${slope}`;
    const value = this.#cache.get(key);
    if (value) {
      return value;
    }
    const id = `g_${this.#docId}_knockout_filter_${this.#id++}`;
    const url = this.#createUrl(id);
    this.#cache.set(key, url);
    const filter = this.#createFilter(id);
    const feComponentTransfer = this.#document.createElementNS(SVG_NS, "feComponentTransfer");
    filter.append(feComponentTransfer);
    const feFuncA = this.#document.createElementNS(SVG_NS, "feFuncA");
    feFuncA.setAttribute("type", "linear");
    feFuncA.setAttribute("slope", `${slope}`);
    feFuncA.setAttribute("intercept", "0");
    feComponentTransfer.append(feFuncA);
    return url;
  }
  addHighlightHCMFilter(filterName, fgColor, bgColor, newFgColor, newBgColor) {
    const key = `${fgColor}-${bgColor}-${newFgColor}-${newBgColor}`;
    let info = this.#hcmCache.get(filterName);
    if (info?.key === key) {
      return info.url;
    }
    if (info) {
      info.filter?.remove();
      info.key = key;
      info.url = "none";
      info.filter = null;
    } else {
      info = {
        key,
        url: "none",
        filter: null
      };
      this.#hcmCache.set(filterName, info);
    }
    if (!fgColor || !bgColor) {
      return info.url;
    }
    const [fgRGB, bgRGB] = [fgColor, bgColor].map(this.#getRGB.bind(this));
    let fgGray = Math.round(0.2126 * fgRGB[0] + 0.7152 * fgRGB[1] + 0.0722 * fgRGB[2]);
    let bgGray = Math.round(0.2126 * bgRGB[0] + 0.7152 * bgRGB[1] + 0.0722 * bgRGB[2]);
    let [newFgRGB, newBgRGB] = [newFgColor, newBgColor].map(this.#getOpaqueTextColor.bind(this));
    if (bgGray < fgGray) {
      [fgGray, bgGray, newFgRGB, newBgRGB] = [bgGray, fgGray, newBgRGB, newFgRGB];
    }
    this.#resetDefsColor();
    const getSteps = (fg, bg, n) => {
      const arr = new Array(256);
      const step = (bgGray - fgGray) / n;
      const newStart = fg / 255;
      const newStep = (bg - fg) / (255 * n);
      let prev = 0;
      for (let i = 0; i <= n; i++) {
        const k = Math.round(fgGray + i * step);
        const value = newStart + i * newStep;
        for (let j = prev; j <= k; j++) {
          arr[j] = value;
        }
        prev = k + 1;
      }
      for (let i = prev; i < 256; i++) {
        arr[i] = arr[prev - 1];
      }
      return arr.join(",");
    };
    const id = `g_${this.#docId}_hcm_${filterName}_filter`;
    const filter = info.filter = this.#createFilter(id);
    this.#addGrayConversion(filter);
    this.#addTransferMapConversion(getSteps(newFgRGB[0], newBgRGB[0], 5), getSteps(newFgRGB[1], newBgRGB[1], 5), getSteps(newFgRGB[2], newBgRGB[2], 5), filter);
    info.url = this.#createUrl(id);
    return info.url;
  }
  destroy(keepHCM = false) {
    if (keepHCM && this.#_hcmCache?.size) {
      return;
    }
    this.#_defs?.parentNode.parentNode.remove();
    this.#_defs = null;
    this.#_cache?.clear();
    this.#_cache = null;
    this.#_hcmCache?.clear();
    this.#_hcmCache = null;
    this.#id = 0;
  }
  #addLuminosityConversion(filter) {
    const feColorMatrix = this.#document.createElementNS(SVG_NS, "feColorMatrix");
    feColorMatrix.setAttribute("type", "matrix");
    feColorMatrix.setAttribute("values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0.59 0.11 0 0");
    filter.append(feColorMatrix);
  }
  #addGrayConversion(filter) {
    const feColorMatrix = this.#document.createElementNS(SVG_NS, "feColorMatrix");
    feColorMatrix.setAttribute("type", "matrix");
    feColorMatrix.setAttribute("values", "0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0");
    filter.append(feColorMatrix);
  }
  #createFilter(id) {
    const filter = this.#document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    filter.setAttribute("id", id);
    this.#defs.append(filter);
    return filter;
  }
  #appendFeFunc(feComponentTransfer, func, table) {
    const feFunc = this.#document.createElementNS(SVG_NS, func);
    feFunc.setAttribute("type", "discrete");
    feFunc.setAttribute("tableValues", table);
    feComponentTransfer.append(feFunc);
  }
  #addTransferMapConversion(rTable, gTable, bTable, filter) {
    const feComponentTransfer = this.#document.createElementNS(SVG_NS, "feComponentTransfer");
    filter.append(feComponentTransfer);
    this.#appendFeFunc(feComponentTransfer, "feFuncR", rTable);
    this.#appendFeFunc(feComponentTransfer, "feFuncG", gTable);
    this.#appendFeFunc(feComponentTransfer, "feFuncB", bTable);
  }
  #addTransferMapAlphaConversion(aTable, filter) {
    const feComponentTransfer = this.#document.createElementNS(SVG_NS, "feComponentTransfer");
    filter.append(feComponentTransfer);
    this.#appendFeFunc(feComponentTransfer, "feFuncA", aTable);
  }
  #getRGB(color) {
    this.#defs.style.color = "CanvasText";
    this.#defs.style.backgroundColor = color;
    return getRGB(getComputedStyle(this.#defs).getPropertyValue("background-color"));
  }
  #getRGBA(color) {
    this.#defs.style.color = "CanvasText";
    this.#defs.style.backgroundColor = color;
    return getRGBA(getComputedStyle(this.#defs).getPropertyValue("background-color"));
  }
  #resetDefsColor() {
    this.#defs.style.color = "";
    this.#defs.style.backgroundColor = "";
  }
  #getOpaqueTextColor(color) {
    const [r, g, b, alpha] = this.#getRGBA(color);
    if (alpha === 1) {
      return [r, g, b];
    }
    const [canvasR, canvasG, canvasB] = this.#getRGB("Canvas");
    return [blend(r, canvasR, alpha), blend(g, canvasG, alpha), blend(b, canvasB, alpha)];
  }
}
function blend(fg, bg, alpha) {
  return Math.round(alpha * fg + (1 - alpha) * bg);
}

;// ./src/display/node_utils.js




if (isNodeJS) {
  warn("Please use the `legacy` build in Node.js environments.");
}
async function node_utils_fetchData(url) {
  const fs = process.getBuiltinModule("fs/promises");
  const data = await fs.readFile(url);
  return new Uint8Array(data);
}
class NodeFilterFactory extends BaseFilterFactory {}
class NodeCanvasFactory extends BaseCanvasFactory {
  _createCanvas(width, height) {
    const require = process.getBuiltinModule("module").createRequire(import.meta.url);
    const canvas = require("@napi-rs/canvas");
    return canvas.createCanvas(width, height);
  }
}
class NodeBinaryDataFactory extends BaseBinaryDataFactory {
  async _fetch(url, kind) {
    return node_utils_fetchData(url);
  }
}

;// ./src/shared/image_utils.js
/* unused harmony import specifier */ var image_utils_ImageKind;
/* unused harmony import specifier */ var image_utils_FeatureTest;

function convertToRGBA(params) {
  switch (params.kind) {
    case image_utils_ImageKind.GRAYSCALE_1BPP:
      return convertBlackAndWhiteToRGBA(params);
    case image_utils_ImageKind.RGB_24BPP:
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
  if (image_utils_FeatureTest.isLittleEndian) {
    for (let i = 0, ii = src.length; i < ii; i++) {
      dest[i] = src[i] * 0x10101 | 0xff000000;
    }
  } else {
    for (let i = 0, ii = src.length; i < ii; i++) {
      dest[i] = src[i] * 0x1010100 | 0x000000ff;
    }
  }
}

;// ./src/display/webgpu.js
const MESH_WGSL = `
struct Uniforms {
  offsetX      : f32,
  offsetY      : f32,
  scaleX       : f32,
  scaleY       : f32,
  paddedWidth  : f32,
  paddedHeight : f32,
  borderSize   : f32,
  _pad         : f32,
};

@group(0) @binding(0) var<uniform> u : Uniforms;

struct VertexInput {
  @location(0) position : vec2<f32>,
  @location(1) color    : vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0)       color    : vec3<f32>,
};

@vertex
fn vs_main(in : VertexInput) -> VertexOutput {
  var out : VertexOutput;
  let cx = (in.position.x + u.offsetX) * u.scaleX;
  let cy = (in.position.y + u.offsetY) * u.scaleY;
  out.position = vec4<f32>(
    ((cx + u.borderSize) / u.paddedWidth) * 2.0 - 1.0,
    1.0 - ((cy + u.borderSize) / u.paddedHeight) * 2.0,
    0.0,
    1.0
  );
  out.color = in.color.rgb;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(in.color, 1.0);
}
`;
class WebGPU {
  #initPromise = null;
  #device = null;
  #meshPipeline = null;
  #preferredFormat = null;
  async #initGPU() {
    if (!globalThis.navigator?.gpu) {
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return false;
      }
      this.#preferredFormat = navigator.gpu.getPreferredCanvasFormat();
      this.#device = await adapter.requestDevice();
      return true;
    } catch {
      return false;
    }
  }
  init() {
    return this.#initPromise ||= this.#initGPU();
  }
  get isReady() {
    return this.#device !== null;
  }
  loadMeshShader() {
    if (!this.#device || this.#meshPipeline) {
      return;
    }
    const shaderModule = this.#device.createShaderModule({
      code: MESH_WGSL
    });
    this.#meshPipeline = this.#device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [{
          arrayStride: 2 * 4,
          attributes: [{
            shaderLocation: 0,
            offset: 0,
            format: "float32x2"
          }]
        }, {
          arrayStride: 4,
          attributes: [{
            shaderLocation: 1,
            offset: 0,
            format: "unorm8x4"
          }]
        }]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [{
          format: this.#preferredFormat
        }]
      },
      primitive: {
        topology: "triangle-list"
      }
    });
  }
  draw(posData, colData, vertexCount, context, backgroundColor, paddedWidth, paddedHeight, borderSize) {
    this.loadMeshShader();
    const device = this.#device;
    const {
      offsetX,
      offsetY,
      scaleX,
      scaleY
    } = context;
    const posBuffer = device.createBuffer({
      size: Math.max(posData.byteLength, 4),
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    if (posData.byteLength > 0) {
      device.queue.writeBuffer(posBuffer, 0, posData);
    }
    const colBuffer = device.createBuffer({
      size: Math.max(colData.byteLength, 4),
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    if (colData.byteLength > 0) {
      device.queue.writeBuffer(colBuffer, 0, colData);
    }
    const uniformBuffer = device.createBuffer({
      size: 8 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([offsetX, offsetY, scaleX, scaleY, paddedWidth, paddedHeight, borderSize, 0]));
    const bindGroup = device.createBindGroup({
      layout: this.#meshPipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }]
    });
    const offscreen = new OffscreenCanvas(paddedWidth, paddedHeight);
    const gpuCtx = offscreen.getContext("webgpu");
    gpuCtx.configure({
      device,
      format: this.#preferredFormat,
      alphaMode: backgroundColor ? "opaque" : "premultiplied"
    });
    const clearValue = backgroundColor ? {
      r: backgroundColor[0] / 255,
      g: backgroundColor[1] / 255,
      b: backgroundColor[2] / 255,
      a: 1
    } : {
      r: 0,
      g: 0,
      b: 0,
      a: 0
    };
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: gpuCtx.getCurrentTexture().createView(),
        clearValue,
        loadOp: "clear",
        storeOp: "store"
      }]
    });
    if (vertexCount > 0) {
      renderPass.setPipeline(this.#meshPipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, posBuffer);
      renderPass.setVertexBuffer(1, colBuffer);
      renderPass.draw(vertexCount);
    }
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    posBuffer.destroy();
    colBuffer.destroy();
    uniformBuffer.destroy();
    return offscreen.transferToImageBitmap();
  }
}
const _webGPU = new WebGPU();
function initGPU() {
  return _webGPU.init();
}
function isGPUReady() {
  return _webGPU.isReady;
}
function loadMeshShader() {
  _webGPU.loadMeshShader();
}
function drawMeshWithGPU(posData, colData, vertexCount, context, backgroundColor, paddedWidth, paddedHeight, borderSize) {
  return _webGPU.draw(posData, colData, vertexCount, context, backgroundColor, paddedWidth, paddedHeight, borderSize);
}

;// ./src/display/pattern_helper.js




const PathType = {
  FILL: "Fill",
  STROKE: "Stroke",
  SHADING: "Shading"
};
function applyBoundingBox(ctx, bbox) {
  if (!bbox) {
    return;
  }
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const region = new Path2D();
  region.rect(bbox[0], bbox[1], width, height);
  ctx.clip(region);
}
class BaseShadingPattern {
  matrix = null;
  isModifyingCurrentTransform() {
    return false;
  }
  getPattern() {
    unreachable("Abstract method `getPattern` called.");
  }
}
class RadialAxialShadingPattern extends BaseShadingPattern {
  constructor(IR) {
    super();
    this._type = IR[1];
    this._bbox = IR[2];
    this._colorStops = IR[3];
    this._p0 = IR[4];
    this._p1 = IR[5];
    this._r0 = IR[6];
    this._r1 = IR[7];
  }
  isOriginBased() {
    return this._p0[0] === 0 && this._p0[1] === 0 && (!this.isRadial() || this._p1[0] === 0 && this._p1[1] === 0);
  }
  isRadial() {
    return this._type === "radial";
  }
  areConic() {
    if (!this.isRadial()) {
      return false;
    }
    const dist = Math.hypot(this._p0[0] - this._p1[0], this._p0[1] - this._p1[1]);
    return dist + this._r1 > this._r0 && dist + this._r0 > this._r1;
  }
  _createGradient(ctx, transform = null) {
    let grad;
    let firstPoint = this._p0;
    let secondPoint = this._p1;
    if (transform) {
      firstPoint = firstPoint.slice();
      secondPoint = secondPoint.slice();
      Util.applyTransform(firstPoint, transform);
      Util.applyTransform(secondPoint, transform);
    }
    if (this._type === "axial") {
      grad = ctx.createLinearGradient(firstPoint[0], firstPoint[1], secondPoint[0], secondPoint[1]);
    } else if (this._type === "radial") {
      let r0 = this._r0;
      let r1 = this._r1;
      if (transform) {
        const scale = new Float32Array(2);
        Util.singularValueDecompose2dScale(transform, scale);
        r0 *= scale[0];
        r1 *= scale[0];
      }
      grad = ctx.createRadialGradient(firstPoint[0], firstPoint[1], r0, secondPoint[0], secondPoint[1], r1);
    }
    for (const colorStop of this._colorStops) {
      grad.addColorStop(colorStop[0], colorStop[1]);
    }
    return grad;
  }
  _createReversedGradient(ctx, transform = null) {
    let firstPoint = this._p1;
    let secondPoint = this._p0;
    if (transform) {
      firstPoint = firstPoint.slice();
      secondPoint = secondPoint.slice();
      Util.applyTransform(firstPoint, transform);
      Util.applyTransform(secondPoint, transform);
    }
    let r0 = this._r1;
    let r1 = this._r0;
    if (transform) {
      const scale = new Float32Array(2);
      Util.singularValueDecompose2dScale(transform, scale);
      r0 *= scale[0];
      r1 *= scale[0];
    }
    const grad = ctx.createRadialGradient(firstPoint[0], firstPoint[1], r0, secondPoint[0], secondPoint[1], r1);
    const reversedStops = this._colorStops.map(([t, c]) => [1 - t, c]).reverse();
    for (const [t, c] of reversedStops) {
      grad.addColorStop(t, c);
    }
    return grad;
  }
  getPattern(ctx, owner, inverse, pathType) {
    let pattern;
    if (pathType === PathType.STROKE || pathType === PathType.FILL) {
      if (this.isOriginBased()) {
        let transf = Util.transform(inverse, owner.baseTransform);
        if (this.matrix) {
          transf = Util.transform(transf, this.matrix);
        }
        const precision = 1e-3;
        const n1 = Math.hypot(transf[0], transf[1]);
        const n2 = Math.hypot(transf[2], transf[3]);
        const ps = (transf[0] * transf[2] + transf[1] * transf[3]) / (n1 * n2);
        if (Math.abs(ps) < precision) {
          if (this.isRadial()) {
            if (Math.abs(n1 - n2) < precision) {
              return this._createGradient(ctx, transf);
            }
          } else {
            return this._createGradient(ctx, transf);
          }
        }
      }
      const ownerBBox = owner.current.getClippedPathBoundingBox(pathType, getCurrentTransform(ctx)) || [0, 0, 0, 0];
      const width = Math.ceil(ownerBBox[2] - ownerBBox[0]) || 1;
      const height = Math.ceil(ownerBBox[3] - ownerBBox[1]) || 1;
      const tmpCanvas = owner.canvasFactory.create(width, height);
      const tmpCtx = tmpCanvas.context;
      tmpCtx.clearRect(0, 0, tmpCtx.canvas.width, tmpCtx.canvas.height);
      tmpCtx.beginPath();
      tmpCtx.rect(0, 0, tmpCtx.canvas.width, tmpCtx.canvas.height);
      tmpCtx.translate(-ownerBBox[0], -ownerBBox[1]);
      inverse = Util.transform(inverse, [1, 0, 0, 1, ownerBBox[0], ownerBBox[1]]);
      tmpCtx.transform(...owner.baseTransform);
      if (this.matrix) {
        tmpCtx.transform(...this.matrix);
      }
      applyBoundingBox(tmpCtx, this._bbox);
      if (this.areConic()) {
        tmpCtx.fillStyle = this._createReversedGradient(tmpCtx);
        tmpCtx.fill();
      }
      tmpCtx.fillStyle = this._createGradient(tmpCtx);
      tmpCtx.fill();
      pattern = ctx.createPattern(tmpCanvas.canvas, "no-repeat");
      owner.canvasFactory.destroy(tmpCanvas);
      const domMatrix = new DOMMatrix(inverse);
      pattern.setTransform(domMatrix);
    } else {
      if (this.areConic()) {
        ctx.save();
        applyBoundingBox(ctx, this._bbox);
        ctx.fillStyle = this._createReversedGradient(ctx);
        ctx.fillRect(-1e10, -1e10, 2e10, 2e10);
        ctx.restore();
      }
      applyBoundingBox(ctx, this._bbox);
      pattern = this._createGradient(ctx);
    }
    return pattern;
  }
}
function drawTriangle(data, context, p1, p2, p3, c1, c2, c3) {
  const coords = context.coords,
    colors = context.colors;
  const bytes = data.data,
    rowSize = data.width * 4;
  let tmp;
  if (coords[p1 * 2 + 1] > coords[p2 * 2 + 1]) {
    tmp = p1;
    p1 = p2;
    p2 = tmp;
    tmp = c1;
    c1 = c2;
    c2 = tmp;
  }
  if (coords[p2 * 2 + 1] > coords[p3 * 2 + 1]) {
    tmp = p2;
    p2 = p3;
    p3 = tmp;
    tmp = c2;
    c2 = c3;
    c3 = tmp;
  }
  if (coords[p1 * 2 + 1] > coords[p2 * 2 + 1]) {
    tmp = p1;
    p1 = p2;
    p2 = tmp;
    tmp = c1;
    c1 = c2;
    c2 = tmp;
  }
  const x1 = (coords[p1 * 2] + context.offsetX) * context.scaleX;
  const y1 = (coords[p1 * 2 + 1] + context.offsetY) * context.scaleY;
  const x2 = (coords[p2 * 2] + context.offsetX) * context.scaleX;
  const y2 = (coords[p2 * 2 + 1] + context.offsetY) * context.scaleY;
  const x3 = (coords[p3 * 2] + context.offsetX) * context.scaleX;
  const y3 = (coords[p3 * 2 + 1] + context.offsetY) * context.scaleY;
  if (y1 >= y3) {
    return;
  }
  const c1r = colors[c1 * 4],
    c1g = colors[c1 * 4 + 1],
    c1b = colors[c1 * 4 + 2];
  const c2r = colors[c2 * 4],
    c2g = colors[c2 * 4 + 1],
    c2b = colors[c2 * 4 + 2];
  const c3r = colors[c3 * 4],
    c3g = colors[c3 * 4 + 1],
    c3b = colors[c3 * 4 + 2];
  const minY = Math.round(y1),
    maxY = Math.round(y3);
  let xa, car, cag, cab;
  let xb, cbr, cbg, cbb;
  for (let y = minY; y <= maxY; y++) {
    if (y < y2) {
      const k = y < y1 ? 0 : (y1 - y) / (y1 - y2);
      xa = x1 - (x1 - x2) * k;
      car = c1r - (c1r - c2r) * k;
      cag = c1g - (c1g - c2g) * k;
      cab = c1b - (c1b - c2b) * k;
    } else {
      let k;
      if (y > y3) {
        k = 1;
      } else if (y2 === y3) {
        k = 0;
      } else {
        k = (y2 - y) / (y2 - y3);
      }
      xa = x2 - (x2 - x3) * k;
      car = c2r - (c2r - c3r) * k;
      cag = c2g - (c2g - c3g) * k;
      cab = c2b - (c2b - c3b) * k;
    }
    let k;
    if (y < y1) {
      k = 0;
    } else if (y > y3) {
      k = 1;
    } else {
      k = (y1 - y) / (y1 - y3);
    }
    xb = x1 - (x1 - x3) * k;
    cbr = c1r - (c1r - c3r) * k;
    cbg = c1g - (c1g - c3g) * k;
    cbb = c1b - (c1b - c3b) * k;
    const x1_ = Math.round(Math.min(xa, xb));
    const x2_ = Math.round(Math.max(xa, xb));
    let j = rowSize * y + x1_ * 4;
    for (let x = x1_; x <= x2_; x++) {
      k = (xa - x) / (xa - xb);
      if (k < 0) {
        k = 0;
      } else if (k > 1) {
        k = 1;
      }
      bytes[j++] = car - (car - cbr) * k | 0;
      bytes[j++] = cag - (cag - cbg) * k | 0;
      bytes[j++] = cab - (cab - cbb) * k | 0;
      bytes[j++] = 255;
    }
  }
}
class MeshShadingPattern extends BaseShadingPattern {
  constructor(IR) {
    super();
    this._posData = IR[2];
    this._colData = IR[3];
    this._vertexCount = IR[4];
    this._bounds = IR[5];
    this._bbox = IR[6];
    this._background = IR[7];
    loadMeshShader();
  }
  _createMeshCanvas(combinedScale, backgroundColor, canvasFactory) {
    const EXPECTED_SCALE = 1.1;
    const MAX_PATTERN_SIZE = 3000;
    const BORDER_SIZE = 2;
    const offsetX = Math.floor(this._bounds[0]);
    const offsetY = Math.floor(this._bounds[1]);
    const boundsWidth = Math.ceil(this._bounds[2]) - offsetX;
    const boundsHeight = Math.ceil(this._bounds[3]) - offsetY;
    const width = Math.min(Math.ceil(Math.abs(boundsWidth * combinedScale[0] * EXPECTED_SCALE)), MAX_PATTERN_SIZE) || 1;
    const height = Math.min(Math.ceil(Math.abs(boundsHeight * combinedScale[1] * EXPECTED_SCALE)), MAX_PATTERN_SIZE) || 1;
    const scaleX = boundsWidth ? boundsWidth / width : 1;
    const scaleY = boundsHeight ? boundsHeight / height : 1;
    const context = {
      coords: this._posData,
      colors: this._colData,
      offsetX: -offsetX,
      offsetY: -offsetY,
      scaleX: 1 / scaleX,
      scaleY: 1 / scaleY
    };
    const paddedWidth = width + BORDER_SIZE * 2;
    const paddedHeight = height + BORDER_SIZE * 2;
    const tmpCanvas = canvasFactory.create(paddedWidth, paddedHeight);
    if (isGPUReady() && this._vertexCount > 48) {
      tmpCanvas.context.drawImage(drawMeshWithGPU(this._posData, this._colData, this._vertexCount, context, backgroundColor, paddedWidth, paddedHeight, BORDER_SIZE), 0, 0);
    } else {
      const data = tmpCanvas.context.createImageData(width, height);
      if (backgroundColor) {
        const bytes = data.data;
        for (let i = 0, ii = bytes.length; i < ii; i += 4) {
          bytes[i] = backgroundColor[0];
          bytes[i + 1] = backgroundColor[1];
          bytes[i + 2] = backgroundColor[2];
          bytes[i + 3] = 255;
        }
      }
      for (let i = 0, ii = this._vertexCount; i < ii; i += 3) {
        drawTriangle(data, context, i, i + 1, i + 2, i, i + 1, i + 2);
      }
      tmpCanvas.context.putImageData(data, BORDER_SIZE, BORDER_SIZE);
    }
    return {
      canvas: tmpCanvas.canvas,
      offsetX: offsetX - BORDER_SIZE * scaleX,
      offsetY: offsetY - BORDER_SIZE * scaleY,
      scaleX,
      scaleY
    };
  }
  isModifyingCurrentTransform() {
    return true;
  }
  getPattern(ctx, owner, inverse, pathType) {
    applyBoundingBox(ctx, this._bbox);
    const scale = new Float32Array(2);
    if (pathType === PathType.SHADING) {
      Util.singularValueDecompose2dScale(getCurrentTransform(ctx), scale);
    } else if (this.matrix) {
      Util.singularValueDecompose2dScale(this.matrix, scale);
      const [matrixScaleX, matrixScaleY] = scale;
      Util.singularValueDecompose2dScale(owner.baseTransform, scale);
      scale[0] *= matrixScaleX;
      scale[1] *= matrixScaleY;
    } else {
      Util.singularValueDecompose2dScale(owner.baseTransform, scale);
    }
    const temporaryPatternCanvas = this._createMeshCanvas(scale, pathType === PathType.SHADING ? null : this._background, owner.canvasFactory);
    if (pathType !== PathType.SHADING) {
      ctx.setTransform(...owner.baseTransform);
      if (this.matrix) {
        ctx.transform(...this.matrix);
      }
    }
    ctx.translate(temporaryPatternCanvas.offsetX, temporaryPatternCanvas.offsetY);
    ctx.scale(temporaryPatternCanvas.scaleX, temporaryPatternCanvas.scaleY);
    const pattern = ctx.createPattern(temporaryPatternCanvas.canvas, "no-repeat");
    owner.canvasFactory.destroy(temporaryPatternCanvas);
    return pattern;
  }
}
class DummyShadingPattern extends BaseShadingPattern {
  getPattern() {
    return "hotpink";
  }
}
function getShadingPattern(IR) {
  switch (IR[0]) {
    case "RadialAxial":
      return new RadialAxialShadingPattern(IR);
    case "Mesh":
      return new MeshShadingPattern(IR);
    case "Dummy":
      return new DummyShadingPattern();
  }
  throw new Error(`Unknown IR type: ${IR[0]}`);
}
const PaintType = {
  COLORED: 1,
  UNCOLORED: 2
};
class TilingPattern {
  static MAX_PATTERN_SIZE = 3000;
  constructor(IR, ctx, canvasGraphicsFactory, baseTransform) {
    this.color = IR[1];
    this.operatorList = IR[2];
    this.matrix = IR[3];
    this.bbox = IR[4];
    this.xstep = IR[5];
    this.ystep = IR[6];
    this.paintType = IR[7];
    this.tilingType = IR[8];
    this.needsIsolation = IR[9] ?? true;
    this.ctx = ctx;
    this.canvasGraphicsFactory = canvasGraphicsFactory;
    this.baseTransform = baseTransform;
    this.patternBaseMatrix = this.matrix ? Util.transform(baseTransform, this.matrix) : baseTransform;
  }
  canSkipPatternCanvas([width, height, offsetX, offsetY]) {
    const [x0, y0, x1, y1] = this.bbox;
    const absXStep = Math.abs(this.xstep);
    const absYStep = Math.abs(this.ystep);
    if (width > absXStep + 1e-6 || height > absYStep + 1e-6) {
      return null;
    }
    const nXFirst = Math.floor((offsetX - x1) / absXStep) + 1;
    const nXLast = Math.ceil((offsetX + width - x0) / absXStep) - 1;
    const nYFirst = Math.floor((offsetY - y1) / absYStep) + 1;
    const nYLast = Math.ceil((offsetY + height - y0) / absYStep) - 1;
    return nXLast <= nXFirst && nYLast <= nYFirst ? [nXFirst, nYFirst] : null;
  }
  updatePatternDims(clippedBBox, dims) {
    const inv = Util.inverseTransform(this.patternBaseMatrix);
    const c1 = [clippedBBox[0], clippedBBox[1]];
    const c2 = [clippedBBox[2], clippedBBox[3]];
    Util.applyTransform(c1, inv);
    Util.applyTransform(c2, inv);
    dims[0] = Math.abs(c2[0] - c1[0]);
    dims[1] = Math.abs(c2[1] - c1[1]);
    dims[2] = Math.min(c1[0], c2[0]);
    dims[3] = Math.min(c1[1], c2[1]);
  }
  _renderTileCanvas(owner, opIdx, dimx, dimy) {
    const [x0, y0, x1, y1] = this.bbox;
    const tmpCanvas = owner.canvasFactory.create(dimx.size, dimy.size);
    const tmpCtx = tmpCanvas.context;
    const graphics = this.canvasGraphicsFactory.createCanvasGraphics(tmpCtx, opIdx);
    graphics.groupLevel = owner.groupLevel;
    this.setFillAndStrokeStyleToContext(graphics, this.paintType, this.color);
    tmpCtx.translate(-dimx.scale * x0, -dimy.scale * y0);
    graphics.transform(0, dimx.scale, 0, 0, dimy.scale, 0, 0);
    tmpCtx.save();
    graphics.dependencyTracker?.save();
    this.clipBbox(graphics, x0, y0, x1, y1);
    graphics.baseTransform = getCurrentTransform(graphics.ctx);
    graphics.executeOperatorList(this.operatorList);
    graphics.endDrawing();
    graphics.dependencyTracker?.restore();
    tmpCtx.restore();
    return tmpCanvas;
  }
  _getCombinedScales() {
    const scale = new Float32Array(2);
    Util.singularValueDecompose2dScale(this.matrix, scale);
    const [matrixScaleX, matrixScaleY] = scale;
    Util.singularValueDecompose2dScale(this.baseTransform, scale);
    return [matrixScaleX * scale[0], matrixScaleY * scale[1]];
  }
  drawPattern(owner, path, useEOFill = false, [n, m], opIdx) {
    const [x0, y0, x1, y1] = this.bbox;
    const dependencyTracker = owner.dependencyTracker;
    if (dependencyTracker) {
      owner.dependencyTracker = new CanvasNestedDependencyTracker(dependencyTracker, opIdx);
    }
    owner.save();
    if (useEOFill) {
      owner.ctx.clip(path, "evenodd");
    } else {
      owner.ctx.clip(path);
    }
    owner.ctx.setTransform(...this.patternBaseMatrix);
    owner.ctx.translate(n * this.xstep, m * this.ystep);
    if (this.needsIsolation || owner.ctx.globalAlpha !== 1 || owner.ctx.globalCompositeOperation !== "source-over" || owner.inSMaskMode) {
      const bboxWidth = x1 - x0;
      const bboxHeight = y1 - y0;
      const [combinedScaleX, combinedScaleY] = this._getCombinedScales();
      const dimx = this.getSizeAndScale(bboxWidth, this.ctx.canvas.width, combinedScaleX);
      const dimy = this.getSizeAndScale(bboxHeight, this.ctx.canvas.height, combinedScaleY);
      const tmpCanvas = this._renderTileCanvas(owner, opIdx, dimx, dimy);
      owner.ctx.drawImage(tmpCanvas.canvas, x0, y0, bboxWidth, bboxHeight);
      owner.canvasFactory.destroy(tmpCanvas);
    } else {
      this.setFillAndStrokeStyleToContext(owner, this.paintType, this.color);
      this.clipBbox(owner, x0, y0, x1, y1);
      owner.baseTransformStack.push(owner.baseTransform);
      owner.baseTransform = getCurrentTransform(owner.ctx);
      owner.executeOperatorList(this.operatorList);
      owner.baseTransform = owner.baseTransformStack.pop();
    }
    owner.restore();
    if (dependencyTracker) {
      owner.dependencyTracker = dependencyTracker;
    }
  }
  createPatternCanvas(owner, opIdx) {
    const [x0, y0, x1, y1] = this.bbox;
    const width = x1 - x0;
    const height = y1 - y0;
    let {
      xstep,
      ystep
    } = this;
    xstep = Math.abs(xstep);
    ystep = Math.abs(ystep);
    info("TilingType: " + this.tilingType);
    const [combinedScaleX, combinedScaleY] = this._getCombinedScales();
    let canvasWidth = width,
      canvasHeight = height,
      redrawHorizontally = false,
      redrawVertically = false;
    if (Math.ceil(xstep * combinedScaleX) >= Math.ceil(width * combinedScaleX)) {
      canvasWidth = xstep;
    } else {
      redrawHorizontally = true;
    }
    if (Math.ceil(ystep * combinedScaleY) >= Math.ceil(height * combinedScaleY)) {
      canvasHeight = ystep;
    } else {
      redrawVertically = true;
    }
    const dimx = this.getSizeAndScale(canvasWidth, this.ctx.canvas.width, combinedScaleX);
    const dimy = this.getSizeAndScale(canvasHeight, this.ctx.canvas.height, combinedScaleY);
    const tmpCanvas = this._renderTileCanvas(owner, opIdx, dimx, dimy);
    if (redrawHorizontally || redrawVertically) {
      const image = tmpCanvas.canvas;
      if (redrawHorizontally) {
        canvasWidth = xstep;
      }
      if (redrawVertically) {
        canvasHeight = ystep;
      }
      const dimx2 = this.getSizeAndScale(canvasWidth, this.ctx.canvas.width, combinedScaleX);
      const dimy2 = this.getSizeAndScale(canvasHeight, this.ctx.canvas.height, combinedScaleY);
      const xSize = dimx2.size;
      const ySize = dimy2.size;
      const tmpCanvas2 = owner.canvasFactory.create(xSize, ySize);
      const tmpCtx2 = tmpCanvas2.context;
      const ii = redrawHorizontally ? Math.floor(width / xstep) : 0;
      const jj = redrawVertically ? Math.floor(height / ystep) : 0;
      for (let i = 0; i <= ii; i++) {
        for (let j = 0; j <= jj; j++) {
          tmpCtx2.drawImage(image, xSize * i, ySize * j, xSize, ySize, 0, 0, xSize, ySize);
        }
      }
      owner.canvasFactory.destroy(tmpCanvas);
      return {
        canvas: tmpCanvas2.canvas,
        canvasEntry: tmpCanvas2,
        scaleX: dimx2.scale,
        scaleY: dimy2.scale,
        offsetX: x0,
        offsetY: y0
      };
    }
    return {
      canvas: tmpCanvas.canvas,
      canvasEntry: tmpCanvas,
      scaleX: dimx.scale,
      scaleY: dimy.scale,
      offsetX: x0,
      offsetY: y0
    };
  }
  getSizeAndScale(step, realOutputSize, scale) {
    const maxSize = Math.max(TilingPattern.MAX_PATTERN_SIZE, realOutputSize);
    let size = Math.ceil(step * scale);
    if (size >= maxSize) {
      size = maxSize;
    } else {
      scale = size / step;
    }
    return {
      scale,
      size
    };
  }
  clipBbox(graphics, x0, y0, x1, y1) {
    const bboxWidth = x1 - x0;
    const bboxHeight = y1 - y0;
    const clip = new Path2D();
    clip.rect(x0, y0, bboxWidth, bboxHeight);
    Util.axialAlignedBoundingBox([x0, y0, x1, y1], getCurrentTransform(graphics.ctx), graphics.current.minMax);
    graphics.ctx.clip(clip);
    graphics.current.updateClipFromPath();
  }
  setFillAndStrokeStyleToContext(graphics, paintType, color) {
    const context = graphics.ctx,
      current = graphics.current;
    current.patternFill = current.patternStroke = false;
    switch (paintType) {
      case PaintType.COLORED:
        const {
          fillStyle,
          strokeStyle
        } = this.ctx;
        context.fillStyle = current.fillColor = fillStyle;
        context.strokeStyle = current.strokeColor = strokeStyle;
        break;
      case PaintType.UNCOLORED:
        context.fillStyle = context.strokeStyle = color;
        current.fillColor = current.strokeColor = color;
        break;
      default:
        throw new FormatError(`Unsupported paint type: ${paintType}`);
    }
  }
  isModifyingCurrentTransform() {
    return false;
  }
  getPattern(ctx, owner, inverse, pathType, opIdx) {
    const matrix = pathType !== PathType.SHADING ? Util.transform(inverse, this.patternBaseMatrix) : inverse;
    const temporaryPatternCanvas = this.createPatternCanvas(owner, opIdx);
    let domMatrix = new DOMMatrix(matrix);
    domMatrix = domMatrix.translate(temporaryPatternCanvas.offsetX, temporaryPatternCanvas.offsetY);
    domMatrix = domMatrix.scale(1 / temporaryPatternCanvas.scaleX, 1 / temporaryPatternCanvas.scaleY);
    const pattern = ctx.createPattern(temporaryPatternCanvas.canvas, "repeat");
    owner.canvasFactory.destroy(temporaryPatternCanvas.canvasEntry);
    pattern.setTransform(domMatrix);
    return pattern;
  }
}

;// ./src/display/canvas.js






const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 100;
const EXECUTION_TIME = 15;
const EXECUTION_STEPS = 10;
const FULL_CHUNK_HEIGHT = 16;
const XY = new Float32Array(2);
function mirrorContextOperations(ctx, destCtx) {
  if (ctx._removeMirroring) {
    throw new Error("Context is already forwarding operations.");
  }
  const originalMethods = new Map();
  for (const name of ["save", "restore", "rotate", "scale", "translate", "transform", "setTransform", "resetTransform", "clip", "moveTo", "lineTo", "bezierCurveTo", "quadraticCurveTo", "arc", "arcTo", "ellipse", "rect", "roundRect", "closePath", "beginPath"]) {
    const original = ctx[name];
    if (typeof original !== "function" || typeof destCtx[name] !== "function") {
      continue;
    }
    originalMethods.set(name, original);
    ctx[name] = function (...args) {
      destCtx[name](...args);
      return original.apply(this, args);
    };
  }
  ctx._removeMirroring = () => {
    for (const [name, original] of originalMethods) {
      ctx[name] = original;
    }
    delete ctx._removeMirroring;
  };
}
function drawImageAtIntegerCoords(ctx, srcImg, srcX, srcY, srcW, srcH, destX, destY, destW, destH) {
  const [a, b, c, d, tx, ty] = getCurrentTransform(ctx);
  if (b === 0 && c === 0) {
    const tlX = destX * a + tx;
    const rTlX = Math.round(tlX);
    const tlY = destY * d + ty;
    const rTlY = Math.round(tlY);
    const brX = (destX + destW) * a + tx;
    const rWidth = Math.abs(Math.round(brX) - rTlX) || 1;
    const brY = (destY + destH) * d + ty;
    const rHeight = Math.abs(Math.round(brY) - rTlY) || 1;
    ctx.setTransform(Math.sign(a), 0, 0, Math.sign(d), rTlX, rTlY);
    ctx.drawImage(srcImg, srcX, srcY, srcW, srcH, 0, 0, rWidth, rHeight);
    ctx.setTransform(a, b, c, d, tx, ty);
    return [rWidth, rHeight];
  }
  if (a === 0 && d === 0) {
    const tlX = destY * c + tx;
    const rTlX = Math.round(tlX);
    const tlY = destX * b + ty;
    const rTlY = Math.round(tlY);
    const brX = (destY + destH) * c + tx;
    const rWidth = Math.abs(Math.round(brX) - rTlX) || 1;
    const brY = (destX + destW) * b + ty;
    const rHeight = Math.abs(Math.round(brY) - rTlY) || 1;
    ctx.setTransform(0, Math.sign(b), Math.sign(c), 0, rTlX, rTlY);
    ctx.drawImage(srcImg, srcX, srcY, srcW, srcH, 0, 0, rHeight, rWidth);
    ctx.setTransform(a, b, c, d, tx, ty);
    return [rHeight, rWidth];
  }
  ctx.drawImage(srcImg, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
  const scaleX = Math.hypot(a, b);
  const scaleY = Math.hypot(c, d);
  return [scaleX * destW, scaleY * destH];
}
class CanvasExtraState {
  alphaIsShape = false;
  fontSize = 0;
  fontSizeScale = 1;
  textMatrix = null;
  textMatrixScale = 1;
  fontMatrix = FONT_IDENTITY_MATRIX;
  leading = 0;
  x = 0;
  y = 0;
  lineX = 0;
  lineY = 0;
  charSpacing = 0;
  wordSpacing = 0;
  textHScale = 1;
  textRenderingMode = TextRenderingMode.FILL;
  textRise = 0;
  fillColor = "#000000";
  strokeColor = "#000000";
  tilingPatternDims = null;
  patternFill = false;
  patternStroke = false;
  fillAlpha = 1;
  strokeAlpha = 1;
  lineWidth = 1;
  activeSMask = null;
  transferMaps = "none";
  minMax = F32_BBOX_INIT.slice();
  constructor(width, height) {
    this.clipBox = new Float32Array([0, 0, width, height]);
  }
  clone() {
    const clone = Object.create(this);
    clone.clipBox = this.clipBox.slice();
    clone.minMax = this.minMax.slice();
    clone.tilingPatternDims = this.tilingPatternDims?.slice();
    return clone;
  }
  getPathBoundingBox(pathType = PathType.FILL, transform = null) {
    const box = this.minMax.slice();
    if (pathType === PathType.STROKE) {
      if (!transform) {
        unreachable("Stroke bounding box must include transform.");
      }
      Util.singularValueDecompose2dScale(transform, XY);
      const xStrokePad = XY[0] * this.lineWidth / 2;
      const yStrokePad = XY[1] * this.lineWidth / 2;
      box[0] -= xStrokePad;
      box[1] -= yStrokePad;
      box[2] += xStrokePad;
      box[3] += yStrokePad;
    }
    return box;
  }
  updateClipFromPath() {
    const intersect = Util.intersect(this.clipBox, this.getPathBoundingBox());
    this.startNewPathAndClipBox(intersect || [0, 0, 0, 0]);
  }
  isEmptyClip() {
    return this.minMax[0] === Infinity;
  }
  startNewPathAndClipBox(box) {
    this.clipBox.set(box, 0);
    this.minMax.set(F32_BBOX_INIT, 0);
  }
  getClippedPathBoundingBox(pathType = PathType.FILL, transform = null) {
    return Util.intersect(this.clipBox, this.getPathBoundingBox(pathType, transform));
  }
}
function putBinaryImageData(ctx, imgData) {
  const {
    width,
    height,
    kind
  } = imgData;
  const partialChunkHeight = height % FULL_CHUNK_HEIGHT;
  const fullChunks = (height - partialChunkHeight) / FULL_CHUNK_HEIGHT;
  const totalChunks = partialChunkHeight === 0 ? fullChunks : fullChunks + 1;
  const chunkImgData = ctx.createImageData(width, FULL_CHUNK_HEIGHT);
  let srcPos = 0;
  const src = imgData.data;
  const dest = chunkImgData.data;
  let i;
  if (kind === ImageKind.GRAYSCALE_1BPP) {
    for (i = 0; i < totalChunks; i++) {
      ({
        srcPos
      } = convertBlackAndWhiteToRGBA({
        src,
        srcPos,
        dest,
        width,
        height: i < fullChunks ? FULL_CHUNK_HEIGHT : partialChunkHeight
      }));
      ctx.putImageData(chunkImgData, 0, i * FULL_CHUNK_HEIGHT);
    }
  } else if (kind === ImageKind.RGBA_32BPP) {
    let j = 0;
    let elemsInThisChunk = width * FULL_CHUNK_HEIGHT * 4;
    for (i = 0; i < fullChunks; i++) {
      dest.set(src.subarray(srcPos, srcPos + elemsInThisChunk));
      srcPos += elemsInThisChunk;
      ctx.putImageData(chunkImgData, 0, j);
      j += FULL_CHUNK_HEIGHT;
    }
    if (i < totalChunks) {
      elemsInThisChunk = width * partialChunkHeight * 4;
      dest.set(src.subarray(srcPos, srcPos + elemsInThisChunk));
      ctx.putImageData(chunkImgData, 0, j);
    }
  } else if (kind === ImageKind.RGB_24BPP) {
    for (i = 0; i < totalChunks; i++) {
      ({
        srcPos
      } = convertRGBToRGBA({
        src,
        srcPos,
        dest: new Uint32Array(dest.buffer),
        width,
        height: i < fullChunks ? FULL_CHUNK_HEIGHT : partialChunkHeight
      }));
      ctx.putImageData(chunkImgData, 0, i * FULL_CHUNK_HEIGHT);
    }
  } else {
    throw new Error(`bad image kind: ${kind}`);
  }
}
function putBinaryImageMask(ctx, imgData) {
  if (imgData.bitmap) {
    ctx.drawImage(imgData.bitmap, 0, 0);
    return;
  }
  const {
    width,
    height
  } = imgData;
  const partialChunkHeight = height % FULL_CHUNK_HEIGHT;
  const fullChunks = (height - partialChunkHeight) / FULL_CHUNK_HEIGHT;
  const totalChunks = partialChunkHeight === 0 ? fullChunks : fullChunks + 1;
  const chunkImgData = ctx.createImageData(width, FULL_CHUNK_HEIGHT);
  let srcPos = 0;
  const src = imgData.data;
  const dest = chunkImgData.data;
  for (let i = 0; i < totalChunks; i++) {
    ({
      srcPos
    } = convertBlackAndWhiteToRGBA({
      src,
      srcPos,
      dest,
      width,
      height: i < fullChunks ? FULL_CHUNK_HEIGHT : partialChunkHeight,
      nonBlackColor: 0
    }));
    ctx.putImageData(chunkImgData, 0, i * FULL_CHUNK_HEIGHT);
  }
}
function copyCtxState(sourceCtx, destCtx) {
  const properties = ["strokeStyle", "fillStyle", "fillRule", "globalAlpha", "lineWidth", "lineCap", "lineJoin", "miterLimit", "globalCompositeOperation", "font", "filter"];
  for (const property of properties) {
    if (sourceCtx[property] !== undefined) {
      destCtx[property] = sourceCtx[property];
    }
  }
  if (sourceCtx.setLineDash !== undefined) {
    destCtx.setLineDash(sourceCtx.getLineDash());
    destCtx.lineDashOffset = sourceCtx.lineDashOffset;
  }
}
function resetCtxToDefault(ctx) {
  ctx.strokeStyle = ctx.fillStyle = "#000000";
  ctx.fillRule = "nonzero";
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 10;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = "10px sans-serif";
  if (ctx.setLineDash !== undefined) {
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }
  const {
    filter
  } = ctx;
  if (filter !== "none" && filter !== "") {
    ctx.filter = "none";
  }
}
function getImageSmoothingEnabled(transform, interpolate) {
  if (interpolate) {
    return true;
  }
  Util.singularValueDecompose2dScale(transform, XY);
  const actualScale = Math.fround(OutputScale.pixelRatio * PixelsPerInch.PDF_TO_CSS_UNITS);
  return XY[0] <= actualScale && XY[1] <= actualScale;
}
const LINE_CAP_STYLES = ["butt", "round", "square"];
const LINE_JOIN_STYLES = ["miter", "round", "bevel"];
const NORMAL_CLIP = {};
const EO_CLIP = {};
class CanvasGraphics {
  static #SCALE_MATRIX = null;
  #knockoutGroupLevel = 0;
  #knockoutElementDepth = 0;
  #knockoutTempCanvasEntry = null;
  #knockoutSavedCtx = null;
  #knockoutSavedSMaskCtx = null;
  #knockoutSavedGCO = null;
  #knockoutElementAlpha = 1;
  #knockoutFilterCache;
  #knockoutElementGroupMeta = null;
  #groupStackMeta = [];
  constructor(canvasCtx, commonObjs, objs, canvasFactory, filterFactory, {
    optionalContentConfig,
    markedContentStack = null
  }, annotationCanvasMap, pageColors, dependencyTracker, imagesTracker) {
    this.ctx = canvasCtx;
    this.current = new CanvasExtraState(this.ctx.canvas.width, this.ctx.canvas.height);
    this.stateStack = [];
    this.pendingClip = null;
    this.pendingEOFill = false;
    this.commonObjs = commonObjs;
    this.objs = objs;
    this.canvasFactory = canvasFactory;
    this.filterFactory = filterFactory;
    this.groupStack = [];
    this.baseTransform = null;
    this.baseTransformStack = [];
    this.groupLevel = 0;
    this.smaskStack = [];
    this.tempSMask = null;
    this.smaskGroupCanvases = [];
    this.smaskPreparedEntry = null;
    this.smaskPreparedFor = null;
    this.smaskPreparedOffsetX = 0;
    this.smaskPreparedOffsetY = 0;
    this.smaskPreparedOOBAlpha = null;
    this.suspendedCtx = null;
    this.contentVisible = true;
    this.markedContentStack = markedContentStack || [];
    this.optionalContentConfig = optionalContentConfig;
    this.cachedPatterns = new Map();
    this.annotationCanvasMap = annotationCanvasMap;
    this.viewportScale = 1;
    this.outputScaleX = 1;
    this.outputScaleY = 1;
    this.pageColors = pageColors;
    this._cachedScaleForStroking = [-1, 0];
    this._cachedGetSinglePixelWidth = null;
    this._cachedBitmapsMap = new Map();
    this.dependencyTracker = dependencyTracker ?? null;
    this.imagesTracker = imagesTracker ?? null;
  }
  getObject(opIdx, data, fallback = null) {
    if (typeof data === "string") {
      this.dependencyTracker?.recordNamedDependency(opIdx, data);
      return data.startsWith("g_") ? this.commonObjs.get(data) : this.objs.get(data);
    }
    return fallback;
  }
  beginDrawing({
    transform,
    viewport,
    transparency = false,
    background = null
  }) {
    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;
    const savedFillStyle = this.ctx.fillStyle;
    this.ctx.fillStyle = background || "#ffffff";
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.fillStyle = savedFillStyle;
    if (transparency) {
      const transparentCanvas = this.transparentCanvasEntry = this.canvasFactory.create(width, height);
      this.compositeCtx = this.ctx;
      ({
        canvas: this.transparentCanvas,
        context: this.ctx
      } = transparentCanvas);
      this.ctx.save();
      this.ctx.transform(...getCurrentTransform(this.compositeCtx));
    }
    this.ctx.save();
    resetCtxToDefault(this.ctx);
    if (transform) {
      this.ctx.transform(...transform);
      this.outputScaleX = transform[0];
      this.outputScaleY = transform[3];
    }
    this.ctx.transform(...viewport.transform);
    this.viewportScale = viewport.scale;
    this.baseTransform = getCurrentTransform(this.ctx);
  }
  executeOperatorList(operatorList, executionStartIdx, continueCallback, stepper, operationsFilter) {
    const argsArray = operatorList.argsArray;
    const fnArray = operatorList.fnArray;
    let i = executionStartIdx || 0;
    const argsArrayLen = argsArray.length;
    if (argsArrayLen === i) {
      return i;
    }
    const chunkOperations = argsArrayLen - i > EXECUTION_STEPS && typeof continueCallback === "function";
    const endTime = chunkOperations ? Date.now() + EXECUTION_TIME : 0;
    let steps = 0;
    const commonObjs = this.commonObjs;
    const objs = this.objs;
    let fnId, fnArgs;
    while (true) {
      if (stepper !== undefined) {
        if (i === stepper.nextBreakPoint) {
          stepper.breakIt(i, continueCallback);
          return i;
        }
        if (stepper.shouldSkip(i)) {
          if (++i === argsArrayLen) {
            return i;
          }
          continue;
        }
      }
      if (!operationsFilter || operationsFilter(i)) {
        fnId = fnArray[i];
        fnArgs = argsArray[i] ?? null;
        if (fnId !== OPS.dependency) {
          if (fnArgs === null) {
            this[fnId](i);
          } else {
            this[fnId](i, ...fnArgs);
          }
        } else {
          for (const depObjId of fnArgs) {
            this.dependencyTracker?.recordNamedData(depObjId, i);
            const objsPool = depObjId.startsWith("g_") ? commonObjs : objs;
            if (!objsPool.has(depObjId)) {
              objsPool.get(depObjId, continueCallback);
              return i;
            }
          }
        }
      }
      i++;
      if (i === argsArrayLen) {
        return i;
      }
      if (chunkOperations && ++steps > EXECUTION_STEPS) {
        if (Date.now() > endTime) {
          continueCallback();
          return i;
        }
        steps = 0;
      }
    }
  }
  #restoreInitialState() {
    while (this.stateStack.length || this.inSMaskMode) {
      this.restore();
    }
    this.current.activeSMask = null;
    this.ctx.restore();
    if (this.transparentCanvas) {
      this.ctx = this.compositeCtx;
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.drawImage(this.transparentCanvas, 0, 0);
      this.ctx.restore();
      this.canvasFactory.destroy(this.transparentCanvasEntry);
      this.transparentCanvas = null;
      this.transparentCanvasEntry = null;
    }
  }
  endDrawing() {
    this.#restoreInitialState();
    for (const canvas of this.smaskGroupCanvases) {
      this.canvasFactory.destroy(canvas);
    }
    this.smaskGroupCanvases.length = 0;
    this._clearPreparedSMask();
    this.tempSMask = null;
    this.smaskStack.length = 0;
    for (const meta of this.#groupStackMeta) {
      this.#destroyKnockoutPools(meta);
    }
    this.#groupStackMeta.length = 0;
    this.#knockoutTempCanvasEntry = null;
    this.#knockoutSavedCtx = null;
    this.#knockoutSavedSMaskCtx = null;
    this.#knockoutSavedGCO = null;
    this.#knockoutElementAlpha = 1;
    this.#knockoutElementGroupMeta = null;
    this.#knockoutElementDepth = 0;
    this.#knockoutGroupLevel = 0;
    this.cachedPatterns.clear();
    for (const cache of this._cachedBitmapsMap.values()) {
      for (const canvas of cache.values()) {
        if (typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement) {
          canvas.width = canvas.height = 0;
        }
      }
      cache.clear();
    }
    this._cachedBitmapsMap.clear();
    this.#drawFilter();
  }
  #drawFilter() {
    if (this.pageColors) {
      const hcmFilterId = this.filterFactory.addHCMFilter(this.pageColors.foreground, this.pageColors.background);
      if (hcmFilterId !== "none") {
        const savedFilter = this.ctx.filter;
        this.ctx.filter = hcmFilterId;
        this.ctx.drawImage(this.ctx.canvas, 0, 0);
        this.ctx.filter = savedFilter;
      }
    }
  }
  _scaleImage(img, inverseTransform) {
    const width = img.width ?? img.displayWidth;
    const height = img.height ?? img.displayHeight;
    const widthScale = Math.max(Math.hypot(inverseTransform[0], inverseTransform[1]), 1);
    const heightScale = Math.max(Math.hypot(inverseTransform[2], inverseTransform[3]), 1);
    const scaleSteps = [];
    let ws = widthScale,
      hs = heightScale,
      pw = width,
      ph = height;
    while (ws > 2 && pw > 1 || hs > 2 && ph > 1) {
      let nw = pw,
        nh = ph;
      if (ws > 2 && pw > 1) {
        nw = Math.ceil(pw / 2);
        ws /= pw / nw;
      }
      if (hs > 2 && ph > 1) {
        nh = Math.ceil(ph / 2);
        hs /= ph / nh;
      }
      scaleSteps.push({
        newWidth: nw,
        newHeight: nh
      });
      pw = nw;
      ph = nh;
    }
    if (scaleSteps.length === 0) {
      return {
        img,
        paintWidth: width,
        paintHeight: height,
        tmpCanvas: null
      };
    }
    if (scaleSteps.length === 1) {
      const {
        newWidth,
        newHeight
      } = scaleSteps[0];
      const tmpCanvas = this.canvasFactory.create(newWidth, newHeight);
      tmpCanvas.context.drawImage(img, 0, 0, width, height, 0, 0, newWidth, newHeight);
      return {
        img: tmpCanvas.canvas,
        paintWidth: newWidth,
        paintHeight: newHeight,
        tmpCanvas
      };
    }
    let readEntry = this.canvasFactory.create(1, 1);
    let writeEntry = this.canvasFactory.create(1, 1);
    let paintWidth = width,
      paintHeight = height;
    let source = img;
    for (const {
      newWidth,
      newHeight
    } of scaleSteps) {
      this.canvasFactory.reset(writeEntry, newWidth, newHeight);
      writeEntry.context.drawImage(source, 0, 0, paintWidth, paintHeight, 0, 0, newWidth, newHeight);
      [readEntry, writeEntry] = [writeEntry, readEntry];
      source = readEntry.canvas;
      paintWidth = newWidth;
      paintHeight = newHeight;
    }
    this.canvasFactory.destroy(writeEntry);
    return {
      img: readEntry.canvas,
      paintWidth,
      paintHeight,
      tmpCanvas: readEntry
    };
  }
  _createMaskCanvas(opIdx, img) {
    const ctx = this.ctx;
    const {
      width,
      height
    } = img;
    const fillColor = this.current.fillColor;
    const isPatternFill = this.current.patternFill;
    const currentTransform = getCurrentTransform(ctx);
    let cache, cacheKey, scaled, maskCanvas;
    if ((img.bitmap || img.data) && img.count > 1) {
      const mainKey = img.bitmap || img.data.buffer;
      cacheKey = JSON.stringify(isPatternFill ? currentTransform : [currentTransform.slice(0, 4), fillColor]);
      cache = this._cachedBitmapsMap.getOrInsertComputed(mainKey, makeMap);
      const cachedImage = cache.get(cacheKey);
      if (cachedImage && !isPatternFill) {
        const offsetX = Math.round(Math.min(currentTransform[0], currentTransform[2]) + currentTransform[4]);
        const offsetY = Math.round(Math.min(currentTransform[1], currentTransform[3]) + currentTransform[5]);
        this.dependencyTracker?.recordDependencies(opIdx, Dependencies.transformAndFill);
        return {
          canvas: cachedImage,
          offsetX,
          offsetY
        };
      }
      scaled = cachedImage;
    }
    if (!scaled) {
      maskCanvas = this.canvasFactory.create(width, height);
      putBinaryImageMask(maskCanvas.context, img);
    }
    let maskToCanvas = Util.transform(currentTransform, [1 / width, 0, 0, -1 / height, 0, 0]);
    maskToCanvas = Util.transform(maskToCanvas, [1, 0, 0, 1, 0, -height]);
    const minMax = F32_BBOX_INIT.slice();
    Util.axialAlignedBoundingBox([0, 0, width, height], maskToCanvas, minMax);
    const [minX, minY, maxX, maxY] = minMax;
    const drawnWidth = Math.round(maxX - minX) || 1;
    const drawnHeight = Math.round(maxY - minY) || 1;
    const fillCanvas = this.canvasFactory.create(drawnWidth, drawnHeight);
    const fillCtx = fillCanvas.context;
    const offsetX = minX;
    const offsetY = minY;
    fillCtx.translate(-offsetX, -offsetY);
    fillCtx.transform(...maskToCanvas);
    let scaledEntry = null;
    if (!scaled) {
      const scaleResult = this._scaleImage(maskCanvas.canvas, getCurrentTransformInverse(fillCtx));
      scaled = scaleResult.img;
      scaledEntry = scaleResult.tmpCanvas;
      if (scaled !== maskCanvas.canvas) {
        this.canvasFactory.destroy(maskCanvas);
        maskCanvas = null;
      }
      if (cache && isPatternFill) {
        cache.set(cacheKey, scaled);
        scaledEntry = null;
        maskCanvas = null;
      }
    }
    fillCtx.imageSmoothingEnabled = getImageSmoothingEnabled(getCurrentTransform(fillCtx), img.interpolate);
    drawImageAtIntegerCoords(fillCtx, scaled, 0, 0, scaled.width, scaled.height, 0, 0, width, height);
    if (scaledEntry) {
      this.canvasFactory.destroy(scaledEntry);
    }
    if (maskCanvas) {
      this.canvasFactory.destroy(maskCanvas);
    }
    fillCtx.globalCompositeOperation = "source-in";
    const inverse = Util.transform(getCurrentTransformInverse(fillCtx), [1, 0, 0, 1, -offsetX, -offsetY]);
    fillCtx.fillStyle = isPatternFill ? fillColor.getPattern(ctx, this, inverse, PathType.FILL, opIdx) : fillColor;
    fillCtx.fillRect(0, 0, width, height);
    if (cache && !isPatternFill) {
      cache.set(cacheKey, fillCanvas.canvas);
    }
    this.dependencyTracker?.recordDependencies(opIdx, Dependencies.transformAndFill);
    return {
      canvas: fillCanvas.canvas,
      canvasEntry: cache && !isPatternFill ? null : fillCanvas,
      offsetX: Math.round(offsetX),
      offsetY: Math.round(offsetY)
    };
  }
  setLineWidth(opIdx, width) {
    this.dependencyTracker?.recordSimpleData("lineWidth", opIdx);
    if (width !== this.current.lineWidth) {
      this._cachedScaleForStroking[0] = -1;
    }
    this.current.lineWidth = width;
    this.ctx.lineWidth = width;
  }
  setLineCap(opIdx, style) {
    this.dependencyTracker?.recordSimpleData("lineCap", opIdx);
    this.ctx.lineCap = LINE_CAP_STYLES[style];
  }
  setLineJoin(opIdx, style) {
    this.dependencyTracker?.recordSimpleData("lineJoin", opIdx);
    this.ctx.lineJoin = LINE_JOIN_STYLES[style];
  }
  setMiterLimit(opIdx, limit) {
    this.dependencyTracker?.recordSimpleData("miterLimit", opIdx);
    this.ctx.miterLimit = limit;
  }
  setDash(opIdx, dashArray, dashPhase) {
    this.dependencyTracker?.recordSimpleData("dash", opIdx);
    const ctx = this.ctx;
    if (ctx.setLineDash !== undefined) {
      ctx.setLineDash(dashArray);
      ctx.lineDashOffset = dashPhase;
    }
  }
  setRenderingIntent(opIdx, intent) {}
  setFlatness(opIdx, flatness) {}
  setGState(opIdx, states) {
    for (const [key, value] of states) {
      switch (key) {
        case "LW":
          this.setLineWidth(opIdx, value);
          break;
        case "LC":
          this.setLineCap(opIdx, value);
          break;
        case "LJ":
          this.setLineJoin(opIdx, value);
          break;
        case "ML":
          this.setMiterLimit(opIdx, value);
          break;
        case "D":
          this.setDash(opIdx, value[0], value[1]);
          break;
        case "RI":
          this.setRenderingIntent(opIdx, value);
          break;
        case "FL":
          this.setFlatness(opIdx, value);
          break;
        case "Font":
          this.setFont(opIdx, value[0], value[1]);
          break;
        case "CA":
          this.dependencyTracker?.recordSimpleData("strokeAlpha", opIdx);
          this.current.strokeAlpha = value;
          break;
        case "ca":
          this.dependencyTracker?.recordSimpleData("fillAlpha", opIdx);
          this.ctx.globalAlpha = this.current.fillAlpha = value;
          break;
        case "BM":
          this.dependencyTracker?.recordSimpleData("globalCompositeOperation", opIdx);
          this.ctx.globalCompositeOperation = value;
          break;
        case "SMask":
          this.dependencyTracker?.recordSimpleData("SMask", opIdx);
          this.current.activeSMask = value ? this.tempSMask : null;
          if (this.current.activeSMask) {
            this.current.activeSMask.blendMode = this.ctx.globalCompositeOperation;
          }
          this.tempSMask = null;
          this.checkSMaskState(opIdx);
          break;
        case "TR":
          this.dependencyTracker?.recordSimpleData("filter", opIdx);
          this.ctx.filter = this.current.transferMaps = this.filterFactory.addFilter(value);
          break;
      }
    }
  }
  get inSMaskMode() {
    return !!this.suspendedCtx;
  }
  _clearPreparedSMask() {
    if (this.smaskPreparedEntry) {
      this.canvasFactory.destroy(this.smaskPreparedEntry);
      this.smaskPreparedEntry = null;
    }
    this.smaskPreparedFor = null;
    this.smaskPreparedOffsetX = 0;
    this.smaskPreparedOffsetY = 0;
    this.smaskPreparedOOBAlpha = null;
  }
  _ensurePreparedSMask(smask) {
    if (smask === this.smaskPreparedFor) {
      return;
    }
    this._clearPreparedSMask();
    this._prepareSMaskCanvas(smask);
  }
  checkSMaskState(opIdx) {
    const inSMaskMode = this.inSMaskMode;
    if (this.current.activeSMask && !inSMaskMode) {
      this.beginSMaskMode(opIdx);
    } else if (!this.current.activeSMask && inSMaskMode) {
      this.endSMaskMode();
    } else if (this.current.activeSMask && inSMaskMode) {
      this._ensurePreparedSMask(this.current.activeSMask);
    }
  }
  _prepareSMaskCanvas(smask) {
    const {
      canvas: maskCanvas,
      subtype,
      backdrop,
      transferMap
    } = smask;
    const hasFilter = subtype === "Luminosity" || subtype === "Alpha" && transferMap;
    if (!hasFilter && !(subtype === "Luminosity" && backdrop)) {
      this.smaskPreparedFor = smask;
      return;
    }
    let filteredOOBAlpha;
    if (subtype === "Luminosity" && backdrop) {
      const [r, g, b] = getRGBA(backdrop);
      const inputAlpha = Math.round(0.3 * r + 0.59 * g + 0.11 * b);
      filteredOOBAlpha = transferMap?.[inputAlpha] ?? inputAlpha;
    } else {
      filteredOOBAlpha = transferMap?.[0] ?? 0;
    }
    const SMASK_LAYER_TO_MASK_AREA_RATIO = 4;
    const {
      width: layerW,
      height: layerH
    } = this.ctx.canvas;
    const maskArea = maskCanvas.width * maskCanvas.height;
    const useLayerSize = layerW * layerH < SMASK_LAYER_TO_MASK_AREA_RATIO * maskArea;
    const filterSpec = hasFilter ? {
      url: subtype === "Alpha" ? this.filterFactory.addAlphaFilter(transferMap) : this.filterFactory.addLuminosityFilter(transferMap),
      subtype,
      transferMap
    } : null;
    const bakedBackdrop = subtype === "Luminosity" ? backdrop : null;
    let preparedEntry, offsetX, offsetY;
    if (useLayerSize) {
      preparedEntry = this._bakeSMaskCanvas(maskCanvas, smask.offsetX, smask.offsetY, layerW, layerH, bakedBackdrop, filterSpec);
      offsetX = 0;
      offsetY = 0;
    } else {
      preparedEntry = this._bakeSMaskCanvas(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, bakedBackdrop, filterSpec);
      offsetX = smask.offsetX;
      offsetY = smask.offsetY;
    }
    this.smaskPreparedEntry = preparedEntry;
    this.smaskPreparedFor = smask;
    this.smaskPreparedOffsetX = offsetX;
    this.smaskPreparedOffsetY = offsetY;
    this.smaskPreparedOOBAlpha = !useLayerSize && filteredOOBAlpha !== 0 ? filteredOOBAlpha : null;
  }
  _bakeSMaskCanvas(maskCanvas, drawX, drawY, w, h, backdrop, filterSpec) {
    if (!backdrop && !filterSpec) {
      unreachable("_bakeSMaskCanvas with neither backdrop nor filter");
    }
    const srcEntry = this.canvasFactory.create(w, h);
    const sCtx = srcEntry.context;
    sCtx.drawImage(maskCanvas, drawX, drawY);
    if (backdrop) {
      sCtx.globalCompositeOperation = "destination-atop";
      sCtx.fillStyle = backdrop;
      sCtx.fillRect(0, 0, w, h);
    }
    if (!filterSpec) {
      return srcEntry;
    }
    const preparedEntry = this.canvasFactory.create(w, h);
    const pCtx = preparedEntry.context;
    pCtx.filter = filterSpec.url;
    const filterApplied = FeatureTest.isCanvasFilterSupported && pCtx.filter !== "none" && pCtx.filter !== "";
    pCtx.drawImage(srcEntry.canvas, 0, 0);
    if (FeatureTest.isCanvasFilterSupported) {
      pCtx.filter = "none";
    }
    if (!filterApplied) {
      const img = pCtx.getImageData(0, 0, w, h);
      const {
        data
      } = img;
      const {
        transferMap
      } = filterSpec;
      if (filterSpec.subtype === "Luminosity") {
        for (let i = 0, ii = data.length; i < ii; i += 4) {
          const a = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2] + 0.5 | 0;
          data[i] = data[i + 1] = data[i + 2] = 0;
          data[i + 3] = transferMap?.[a] ?? a;
        }
      } else {
        for (let i = 3, ii = data.length; i < ii; i += 4) {
          data[i] = transferMap[data[i]];
        }
      }
      pCtx.putImageData(img, 0, 0);
    }
    this.canvasFactory.destroy(srcEntry);
    return preparedEntry;
  }
  beginSMaskMode(opIdx) {
    if (this.inSMaskMode) {
      throw new Error("beginSMaskMode called while already in smask mode");
    }
    const {
      width: drawnWidth,
      height: drawnHeight
    } = this.ctx.canvas;
    const scratchCanvas = this.canvasFactory.create(drawnWidth, drawnHeight);
    this.smaskScratchCanvas = scratchCanvas;
    this.suspendedCtx = this.ctx;
    const ctx = this.ctx = scratchCanvas.context;
    ctx.setTransform(this.suspendedCtx.getTransform());
    copyCtxState(this.suspendedCtx, ctx);
    mirrorContextOperations(ctx, this.suspendedCtx);
    this._ensurePreparedSMask(this.current.activeSMask);
    this.setGState(opIdx, [["BM", "source-over"]]);
  }
  endSMaskMode() {
    if (!this.inSMaskMode) {
      throw new Error("endSMaskMode called while not in smask mode");
    }
    this.ctx._removeMirroring();
    copyCtxState(this.ctx, this.suspendedCtx);
    this.ctx = this.suspendedCtx;
    this.suspendedCtx = null;
    this.canvasFactory.destroy(this.smaskScratchCanvas);
    this.smaskScratchCanvas = null;
    this._clearPreparedSMask();
  }
  #createKnockoutMaskCanvas(sourceCanvas, reuseEntry = null, alpha = 1) {
    const {
      width,
      height
    } = sourceCanvas;
    const maskEntry = reuseEntry ?? this.canvasFactory.create(width, height);
    const maskCtx = maskEntry.context;
    alpha = Math.round(alpha * 255) / 255;
    const needsAlphaScaling = alpha < 1;
    if (needsAlphaScaling && this.#knockoutFilterCache === undefined) {
      this.#knockoutFilterCache = FeatureTest.isCanvasFilterSupported ? new Map() : "none";
    }
    let knockoutFilter = "none";
    if (needsAlphaScaling && this.#knockoutFilterCache instanceof Map) {
      knockoutFilter = this.#knockoutFilterCache.getOrInsertComputed(alpha, () => this.filterFactory.addKnockoutFilter(alpha));
    }
    if (!needsAlphaScaling || knockoutFilter !== "none") {
      if (reuseEntry) {
        maskCtx.save();
        maskCtx.setTransform(1, 0, 0, 1, 0, 0);
        maskCtx.clearRect(0, 0, width, height);
        maskCtx.restore();
      }
      maskCtx.filter = knockoutFilter;
      maskCtx.drawImage(sourceCanvas, 0, 0);
      maskCtx.filter = "none";
      return maskEntry;
    }
    const sourceData = sourceCanvas.getContext("2d", {
      willReadFrequently: true
    }).getImageData(0, 0, width, height);
    const maskData = maskCtx.createImageData(width, height);
    const sourcePixels = sourceData.data,
      maskPixels = maskData.data;
    const alphaScale = alpha > 0 ? 1 / alpha : 1e6;
    for (let i = 3, ii = sourcePixels.length; i < ii; i += 4) {
      maskPixels[i] = Math.min(Math.round(sourcePixels[i] * alphaScale), 255);
    }
    maskCtx.putImageData(maskData, 0, 0);
    return maskEntry;
  }
  #getOrCreatePooledEntry(meta, key, width, height) {
    let entry = meta?.[key] ?? null;
    if (entry && (entry.canvas.width !== width || entry.canvas.height !== height)) {
      this.canvasFactory.destroy(entry);
      entry = null;
    }
    if (!entry) {
      entry = this.canvasFactory.create(width, height);
      if (meta) {
        meta[key] = entry;
      }
      return entry;
    }
    const ctx = entry.context;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.restore();
    return entry;
  }
  #compositeKnockoutSurface(destCtx, surfaceCanvas, options = {}) {
    const {
      backdropCanvas = null,
      destTransform = [1, 0, 0, 1, 0, 0],
      backdropOffset = [0, 0],
      reuseMaskEntry = null,
      poolMeta = null,
      sourceAlpha = 1,
      sourceFilter = "none",
      knockoutAlpha = 1
    } = options;
    const {
      width,
      height
    } = surfaceCanvas;
    const knockoutMaskEntry = this.#createKnockoutMaskCanvas(surfaceCanvas, reuseMaskEntry, knockoutAlpha);
    const sourceCompositeOperation = destCtx.globalCompositeOperation;
    destCtx.save();
    destCtx.setTransform(...destTransform);
    destCtx.globalAlpha = 1;
    if (FeatureTest.isCanvasFilterSupported) {
      destCtx.filter = "none";
    }
    destCtx.globalCompositeOperation = "destination-out";
    destCtx.drawImage(knockoutMaskEntry.canvas, 0, 0);
    if (backdropCanvas) {
      const [bx, by] = backdropOffset;
      const backdropEntry = this.#getOrCreatePooledEntry(poolMeta, "knockoutBackdropEntry", width, height);
      const backdropCtx = backdropEntry.context;
      backdropCtx.drawImage(backdropCanvas, bx, by, width, height, 0, 0, width, height);
      backdropCtx.globalCompositeOperation = "destination-in";
      backdropCtx.drawImage(knockoutMaskEntry.canvas, 0, 0);
      backdropCtx.globalCompositeOperation = "source-over";
      destCtx.globalCompositeOperation = "destination-over";
      destCtx.drawImage(backdropEntry.canvas, 0, 0);
      if (!poolMeta) {
        this.canvasFactory.destroy(backdropEntry);
      }
    }
    destCtx.globalCompositeOperation = sourceCompositeOperation;
    destCtx.globalAlpha = sourceAlpha;
    if (FeatureTest.isCanvasFilterSupported) {
      destCtx.filter = sourceFilter ?? "none";
    }
    destCtx.drawImage(surfaceCanvas, 0, 0);
    destCtx.restore();
    if (!reuseMaskEntry) {
      this.canvasFactory.destroy(knockoutMaskEntry);
    }
  }
  #beginKnockoutElement(alpha = 1) {
    if (this.#knockoutGroupLevel === 0 || this.#knockoutElementDepth > 0 || !this.contentVisible) {
      return false;
    }
    this.#knockoutElementDepth++;
    this.#knockoutElementAlpha = alpha;
    const groupMeta = this.#groupStackMeta.at(-1);
    const {
      canvas
    } = this.ctx;
    const tempEntry = this.#getOrCreatePooledEntry(groupMeta, "knockoutTempEntry", canvas.width, canvas.height);
    this.#knockoutTempCanvasEntry = tempEntry;
    const tempCtx = tempEntry.context;
    tempCtx.save();
    tempCtx.setTransform(this.ctx.getTransform());
    copyCtxState(this.ctx, tempCtx);
    this.#knockoutSavedGCO = tempCtx.globalCompositeOperation;
    tempCtx.globalCompositeOperation = "source-over";
    mirrorContextOperations(tempCtx, this.ctx);
    this.#knockoutElementGroupMeta = groupMeta;
    this.#knockoutSavedCtx = this.ctx;
    this.#knockoutSavedSMaskCtx = this.suspendedCtx;
    this.ctx = tempCtx;
    if (this.inSMaskMode) {
      this.suspendedCtx = tempCtx;
    }
    return true;
  }
  #endKnockoutElement(started) {
    if (!started) {
      return;
    }
    const tempEntry = this.#knockoutTempCanvasEntry;
    const savedCtx = this.#knockoutSavedCtx;
    const savedSMaskCtx = this.#knockoutSavedSMaskCtx;
    const tempCtx = tempEntry.context;
    this.#knockoutTempCanvasEntry = null;
    this.#knockoutSavedCtx = null;
    this.#knockoutSavedSMaskCtx = null;
    if (this.inSMaskMode && this.suspendedCtx === tempCtx && this.ctx !== tempCtx) {
      this.endSMaskMode();
    }
    if (this.inSMaskMode) {
      this.suspendedCtx = savedSMaskCtx;
    }
    this.ctx._removeMirroring();
    this.ctx.globalCompositeOperation = this.#knockoutSavedGCO;
    this.#knockoutSavedGCO = null;
    copyCtxState(this.ctx, savedCtx);
    this.ctx = savedCtx;
    const groupMeta = this.#knockoutElementGroupMeta;
    this.#knockoutElementGroupMeta = null;
    const knockoutAlpha = this.#knockoutElementAlpha;
    this.#knockoutElementAlpha = 1;
    try {
      this.#compositeKnockoutSurface(savedSMaskCtx ?? savedCtx, tempEntry.canvas, {
        backdropCanvas: groupMeta?.backdropCtx?.canvas ?? null,
        backdropOffset: groupMeta?.backdropCtx ? [groupMeta.offsetX, groupMeta.offsetY] : [0, 0],
        reuseMaskEntry: groupMeta?.knockoutMaskEntry ?? null,
        poolMeta: groupMeta,
        knockoutAlpha
      });
    } finally {
      tempCtx.restore();
      this.#knockoutElementDepth--;
      if (!groupMeta) {
        this.canvasFactory.destroy(tempEntry);
      }
    }
  }
  compose(dirtyBox) {
    if (!this.current.activeSMask) {
      return;
    }
    dirtyBox = dirtyBox ? [Math.floor(dirtyBox[0]), Math.floor(dirtyBox[1]), Math.ceil(dirtyBox[2]), Math.ceil(dirtyBox[3])] : [0, 0, this.ctx.canvas.width, this.ctx.canvas.height];
    const smask = this.current.activeSMask;
    const suspendedCtx = this.suspendedCtx;
    const applySMaskInPlace = this.#knockoutElementDepth > 0 && suspendedCtx === this.ctx;
    this.composeSMask(applySMaskInPlace ? null : suspendedCtx, smask, this.ctx, dirtyBox);
    if (applySMaskInPlace) {
      return;
    }
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.restore();
  }
  composeSMask(ctx, smask, layerCtx, layerBox) {
    const layerOffsetX = layerBox[0];
    const layerOffsetY = layerBox[1];
    const layerWidth = layerBox[2] - layerOffsetX;
    const layerHeight = layerBox[3] - layerOffsetY;
    if (layerWidth === 0 || layerHeight === 0) {
      return;
    }
    const preparedEntry = this.smaskPreparedEntry;
    if (preparedEntry) {
      let clipX = layerOffsetX;
      let clipY = layerOffsetY;
      let clipW = layerWidth;
      let clipH = layerHeight;
      const oobAlpha = this.smaskPreparedOOBAlpha;
      const hasOOBAlpha = oobAlpha !== null;
      if (hasOOBAlpha) {
        clipX = Math.max(layerOffsetX, smask.offsetX);
        clipY = Math.max(layerOffsetY, smask.offsetY);
        const x1 = Math.min(layerOffsetX + layerWidth, smask.offsetX + smask.canvas.width);
        const y1 = Math.min(layerOffsetY + layerHeight, smask.offsetY + smask.canvas.height);
        clipW = x1 - clipX;
        clipH = y1 - clipY;
      }
      if (clipW > 0 && clipH > 0) {
        const srcX = clipX - this.smaskPreparedOffsetX;
        const srcY = clipY - this.smaskPreparedOffsetY;
        layerCtx.save();
        layerCtx.globalAlpha = 1;
        layerCtx.setTransform(1, 0, 0, 1, 0, 0);
        const clip = new Path2D();
        clip.rect(clipX, clipY, clipW, clipH);
        layerCtx.clip(clip);
        layerCtx.globalCompositeOperation = "destination-in";
        layerCtx.drawImage(preparedEntry.canvas, srcX, srcY, clipW, clipH, clipX, clipY, clipW, clipH);
        layerCtx.restore();
      }
      if (hasOOBAlpha && oobAlpha < 255) {
        this._applySMaskOOBAlpha(layerCtx, layerOffsetX, layerOffsetY, layerWidth, layerHeight, clipX, clipY, clipX + clipW, clipY + clipH, oobAlpha);
      }
    } else {
      this.genericComposeSMask(smask, layerCtx, layerWidth, layerHeight, layerOffsetX, layerOffsetY);
    }
    if (!ctx) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = smask.blendMode || "source-over";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layerCtx.canvas, layerOffsetX, layerOffsetY, layerWidth, layerHeight, layerOffsetX, layerOffsetY, layerWidth, layerHeight);
    ctx.restore();
  }
  _applySMaskOOBAlpha(layerCtx, layerOffsetX, layerOffsetY, layerWidth, layerHeight, maskX0, maskY0, maskX1, maskY1, alpha) {
    const hasInnerCutout = maskX0 < maskX1 && maskY0 < maskY1;
    if (hasInnerCutout && maskX0 === layerOffsetX && maskY0 === layerOffsetY && maskX1 === layerOffsetX + layerWidth && maskY1 === layerOffsetY + layerHeight) {
      return;
    }
    const path = new Path2D();
    path.rect(layerOffsetX, layerOffsetY, layerWidth, layerHeight);
    if (hasInnerCutout) {
      path.rect(maskX0, maskY0, maskX1 - maskX0, maskY1 - maskY0);
    }
    layerCtx.save();
    layerCtx.globalAlpha = alpha / 255;
    layerCtx.setTransform(1, 0, 0, 1, 0, 0);
    layerCtx.clip(path, "evenodd");
    layerCtx.globalCompositeOperation = "destination-in";
    layerCtx.fillStyle = "#000000";
    layerCtx.fillRect(layerOffsetX, layerOffsetY, layerWidth, layerHeight);
    layerCtx.restore();
  }
  genericComposeSMask(smask, layerCtx, width, height, layerOffsetX, layerOffsetY) {
    const {
      context: maskCtx,
      offsetX: maskOffsetX,
      offsetY: maskOffsetY
    } = smask;
    layerCtx.save();
    layerCtx.globalAlpha = 1;
    layerCtx.setTransform(1, 0, 0, 1, 0, 0);
    const clip = new Path2D();
    clip.rect(layerOffsetX, layerOffsetY, width, height);
    layerCtx.clip(clip);
    layerCtx.globalCompositeOperation = "destination-in";
    layerCtx.drawImage(maskCtx.canvas, layerOffsetX - maskOffsetX, layerOffsetY - maskOffsetY, width, height, layerOffsetX, layerOffsetY, width, height);
    layerCtx.restore();
  }
  save(opIdx) {
    if (this.inSMaskMode) {
      copyCtxState(this.ctx, this.suspendedCtx);
    }
    this.ctx.save();
    const old = this.current;
    this.stateStack.push(old);
    this.current = old.clone();
    this.dependencyTracker?.save(opIdx);
  }
  restore(opIdx) {
    this.dependencyTracker?.restore(opIdx);
    if (this.stateStack.length === 0) {
      if (this.inSMaskMode) {
        this.endSMaskMode();
      }
      return;
    }
    this.current = this.stateStack.pop();
    this.ctx.restore();
    if (this.inSMaskMode) {
      copyCtxState(this.suspendedCtx, this.ctx);
      this.ctx.setTransform(this.suspendedCtx.getTransform());
    }
    this.checkSMaskState(opIdx);
    this.pendingClip = null;
    this._cachedScaleForStroking[0] = -1;
    this._cachedGetSinglePixelWidth = null;
  }
  transform(opIdx, a, b, c, d, e, f) {
    this.dependencyTracker?.recordIncrementalData("transform", opIdx);
    this.ctx.transform(a, b, c, d, e, f);
    this._cachedScaleForStroking[0] = -1;
    this._cachedGetSinglePixelWidth = null;
  }
  constructPath(opIdx, op, data, minMax) {
    let [path] = data;
    if (!minMax) {
      path ||= data[0] = new Path2D();
      if (op !== OPS.stroke && op !== OPS.closeStroke) {
        this.current.tilingPatternDims = null;
      }
      this[op](opIdx, path);
      return;
    }
    if (this.dependencyTracker !== null) {
      const outerExtraSize = op === OPS.stroke ? this.current.lineWidth / 2 : 0;
      this.dependencyTracker.resetBBox(opIdx).recordBBox(opIdx, this.ctx, minMax[0] - outerExtraSize, minMax[2] + outerExtraSize, minMax[1] - outerExtraSize, minMax[3] + outerExtraSize).recordDependencies(opIdx, ["transform"]);
    }
    if (!(path instanceof Path2D)) {
      path = data[0] = makePathFromDrawOPS(path);
    }
    Util.axialAlignedBoundingBox(minMax, getCurrentTransform(this.ctx), this.current.minMax);
    const tilingDims = this.current.tilingPatternDims;
    if (tilingDims && op !== OPS.stroke && op !== OPS.closeStroke && this.current.fillColor instanceof TilingPattern) {
      const clippedBBox = Util.intersect(this.current.clipBox, this.current.minMax);
      if (!clippedBBox) {
        this.current.tilingPatternDims = null;
      } else {
        this.current.fillColor.updatePatternDims(clippedBBox, tilingDims);
      }
    }
    this[op](opIdx, path);
    this._pathStartIdx = opIdx;
  }
  closePath(opIdx) {
    this.ctx.closePath();
  }
  stroke(opIdx, path, consumePath = true) {
    const started = consumePath && this.#beginKnockoutElement(this.current.strokeAlpha);
    const ctx = this.ctx;
    const strokeColor = this.current.strokeColor;
    ctx.globalAlpha = this.current.strokeAlpha;
    if (this.contentVisible) {
      if (typeof strokeColor === "object" && strokeColor?.getPattern) {
        const baseTransform = strokeColor.isModifyingCurrentTransform() ? ctx.getTransform() : null;
        ctx.save();
        ctx.strokeStyle = strokeColor.getPattern(ctx, this, getCurrentTransformInverse(ctx), PathType.STROKE, opIdx);
        if (baseTransform) {
          const newPath = new Path2D();
          newPath.addPath(path, ctx.getTransform().invertSelf().multiplySelf(baseTransform));
          path = newPath;
        }
        this.rescaleAndStroke(path, false);
        ctx.restore();
      } else {
        this.rescaleAndStroke(path, true);
      }
    }
    this.dependencyTracker?.recordDependencies(opIdx, Dependencies.stroke);
    if (consumePath) {
      this.consumePath(opIdx, path, this.current.getClippedPathBoundingBox(PathType.STROKE, getCurrentTransform(this.ctx)));
    }
    ctx.globalAlpha = this.current.fillAlpha;
    this.#endKnockoutElement(started);
  }
  closeStroke(opIdx, path) {
    this.stroke(opIdx, path);
  }
  fill(opIdx, path, consumePath = true) {
    const started = consumePath && this.#beginKnockoutElement(this.current.fillAlpha);
    const ctx = this.ctx;
    const fillColor = this.current.fillColor;
    const isPatternFill = this.current.patternFill;
    let needRestore = false;
    const intersect = this.current.getClippedPathBoundingBox();
    this.dependencyTracker?.recordDependencies(opIdx, Dependencies.fill);
    if (isPatternFill) {
      const dims = this.current.tilingPatternDims;
      const tileIdx = dims && fillColor.canSkipPatternCanvas(dims);
      if (tileIdx) {
        fillColor.drawPattern(this, path, this.pendingEOFill, tileIdx, opIdx);
        this.pendingEOFill = false;
        if (consumePath) {
          this.consumePath(opIdx, path, intersect);
        }
        this.current.tilingPatternDims = null;
        this.#endKnockoutElement(started);
        return;
      }
      const baseTransform = fillColor.isModifyingCurrentTransform() ? ctx.getTransform() : null;
      this.dependencyTracker?.save(opIdx);
      ctx.save();
      ctx.fillStyle = fillColor.getPattern(ctx, this, getCurrentTransformInverse(ctx), PathType.FILL, opIdx);
      if (baseTransform) {
        const newPath = new Path2D();
        newPath.addPath(path, ctx.getTransform().invertSelf().multiplySelf(baseTransform));
        path = newPath;
      }
      needRestore = true;
    }
    if (this.contentVisible && intersect !== null) {
      if (this.pendingEOFill) {
        ctx.fill(path, "evenodd");
        this.pendingEOFill = false;
      } else {
        ctx.fill(path);
      }
    }
    if (needRestore) {
      ctx.restore();
      this.dependencyTracker?.restore(opIdx);
    }
    if (consumePath) {
      this.consumePath(opIdx, path, intersect);
    }
    this.#endKnockoutElement(started);
  }
  eoFill(opIdx, path) {
    this.pendingEOFill = true;
    this.fill(opIdx, path);
  }
  fillStroke(opIdx, path) {
    const started = this.#beginKnockoutElement(Math.min(this.current.fillAlpha, this.current.strokeAlpha));
    this.fill(opIdx, path, false);
    this.stroke(opIdx, path, false);
    this.consumePath(opIdx, path);
    this.#endKnockoutElement(started);
  }
  eoFillStroke(opIdx, path) {
    this.pendingEOFill = true;
    this.fillStroke(opIdx, path);
  }
  closeFillStroke(opIdx, path) {
    this.fillStroke(opIdx, path);
  }
  closeEOFillStroke(opIdx, path) {
    this.pendingEOFill = true;
    this.fillStroke(opIdx, path);
  }
  endPath(opIdx, path) {
    this.consumePath(opIdx, path);
  }
  rawFillPath(opIdx, path) {
    const started = this.#beginKnockoutElement(this.current.fillAlpha);
    this.ctx.fill(path);
    this.dependencyTracker?.recordDependencies(opIdx, Dependencies.rawFillPath).recordOperation(opIdx);
    this.#endKnockoutElement(started);
  }
  clip(opIdx) {
    this.dependencyTracker?.recordFutureForcedDependency("clipMode", opIdx);
    this.pendingClip = NORMAL_CLIP;
  }
  eoClip(opIdx) {
    this.dependencyTracker?.recordFutureForcedDependency("clipMode", opIdx);
    this.pendingClip = EO_CLIP;
  }
  beginText(opIdx) {
    this.current.textMatrix = null;
    this.current.textMatrixScale = 1;
    this.current.x = this.current.lineX = 0;
    this.current.y = this.current.lineY = 0;
    this.dependencyTracker?.recordOpenMarker(opIdx).resetIncrementalData("sameLineText").resetIncrementalData("moveText", opIdx);
  }
  endText(opIdx) {
    const paths = this.pendingTextPaths;
    const ctx = this.ctx;
    if (this.dependencyTracker) {
      const {
        dependencyTracker
      } = this;
      if (paths !== undefined) {
        dependencyTracker.recordFutureForcedDependency("textClip", dependencyTracker.getOpenMarker()).recordFutureForcedDependency("textClip", opIdx);
      }
      dependencyTracker.recordCloseMarker(opIdx);
    }
    if (paths !== undefined) {
      const newPath = new Path2D();
      const invTransf = ctx.getTransform().invertSelf();
      for (const {
        transform,
        x,
        y,
        fontSize,
        path
      } of paths) {
        if (!path) {
          continue;
        }
        newPath.addPath(path, new DOMMatrix(transform).preMultiplySelf(invTransf).translate(x, y).scale(fontSize, -fontSize));
      }
      ctx.clip(newPath);
    }
    delete this.pendingTextPaths;
  }
  setCharSpacing(opIdx, spacing) {
    this.dependencyTracker?.recordSimpleData("charSpacing", opIdx);
    this.current.charSpacing = spacing;
  }
  setWordSpacing(opIdx, spacing) {
    this.dependencyTracker?.recordSimpleData("wordSpacing", opIdx);
    this.current.wordSpacing = spacing;
  }
  setHScale(opIdx, scale) {
    this.dependencyTracker?.recordSimpleData("hScale", opIdx);
    this.current.textHScale = scale / 100;
  }
  setLeading(opIdx, leading) {
    this.dependencyTracker?.recordSimpleData("leading", opIdx);
    this.current.leading = -leading;
  }
  setFont(opIdx, fontRefName, size) {
    this.dependencyTracker?.recordSimpleData("font", opIdx).recordSimpleDataFromNamed("fontObj", fontRefName, opIdx);
    const fontObj = this.commonObjs.get(fontRefName);
    const current = this.current;
    if (!fontObj) {
      throw new Error(`Can't find font for ${fontRefName}`);
    }
    current.fontMatrix = fontObj.fontMatrix || FONT_IDENTITY_MATRIX;
    if (current.fontMatrix[0] === 0 || current.fontMatrix[3] === 0) {
      warn("Invalid font matrix for font " + fontRefName);
    }
    if (size < 0) {
      size = -size;
      current.fontDirection = -1;
    } else {
      current.fontDirection = 1;
    }
    this.current.font = fontObj;
    this.current.fontSize = size;
    if (fontObj.isType3Font) {
      return;
    }
    const name = fontObj.loadedName || "sans-serif";
    const typeface = fontObj.systemFontInfo?.css || `"${name}", ${fontObj.fallbackName}`;
    let bold = "normal";
    if (fontObj.black) {
      bold = "900";
    } else if (fontObj.bold) {
      bold = "bold";
    }
    const italic = fontObj.italic ? "italic" : "normal";
    const browserFontSize = MathClamp(size, MIN_FONT_SIZE, MAX_FONT_SIZE);
    this.current.fontSizeScale = size / browserFontSize;
    this.ctx.font = `${italic} ${bold} ${browserFontSize}px ${typeface}`;
  }
  setTextRenderingMode(opIdx, mode) {
    this.dependencyTracker?.recordSimpleData("textRenderingMode", opIdx);
    this.current.textRenderingMode = mode;
  }
  setTextRise(opIdx, rise) {
    this.dependencyTracker?.recordSimpleData("textRise", opIdx);
    this.current.textRise = rise;
  }
  moveText(opIdx, x, y) {
    this.dependencyTracker?.resetIncrementalData("sameLineText").recordIncrementalData("moveText", opIdx);
    this.current.x = this.current.lineX += x;
    this.current.y = this.current.lineY += y;
  }
  setLeadingMoveText(opIdx, x, y) {
    this.setLeading(opIdx, -y);
    this.moveText(opIdx, x, y);
  }
  setTextMatrix(opIdx, matrix) {
    this.dependencyTracker?.resetIncrementalData("sameLineText").recordSimpleData("textMatrix", opIdx);
    const {
      current
    } = this;
    current.textMatrix = matrix;
    current.textMatrixScale = Math.hypot(matrix[0], matrix[1]);
    current.x = current.lineX = 0;
    current.y = current.lineY = 0;
  }
  nextLine(opIdx) {
    this.moveText(opIdx, 0, this.current.leading);
    this.dependencyTracker?.recordIncrementalData("moveText", this.dependencyTracker.getSimpleIndex("leading") ?? opIdx);
  }
  #getScaledPath(path, currentTransform, transform) {
    const newPath = new Path2D();
    newPath.addPath(path, new DOMMatrix(transform).invertSelf().multiplySelf(currentTransform));
    return newPath;
  }
  paintChar(opIdx, character, x, y, patternFillTransform, patternStrokeTransform) {
    const ctx = this.ctx;
    const current = this.current;
    const font = current.font;
    const textRenderingMode = current.textRenderingMode;
    const fontSize = current.fontSize / current.fontSizeScale;
    const fillStrokeMode = textRenderingMode & TextRenderingMode.FILL_STROKE_MASK;
    const isAddToPathSet = !!(textRenderingMode & TextRenderingMode.ADD_TO_PATH_FLAG);
    const patternFill = current.patternFill && !font.missingFile;
    const patternStroke = current.patternStroke && !font.missingFile;
    let path;
    if ((font.disableFontFace || isAddToPathSet || patternFill || patternStroke) && !font.missingFile) {
      path = font.getPathGenerator(this.commonObjs, character);
    }
    if (path && (font.disableFontFace || patternFill || patternStroke)) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(fontSize, -fontSize);
      this.dependencyTracker?.recordCharacterBBox(opIdx, ctx, font);
      let currentTransform;
      if (fillStrokeMode === TextRenderingMode.FILL || fillStrokeMode === TextRenderingMode.FILL_STROKE) {
        if (patternFillTransform) {
          currentTransform = ctx.getTransform();
          ctx.setTransform(...patternFillTransform);
          const scaledPath = this.#getScaledPath(path, currentTransform, patternFillTransform);
          ctx.fill(scaledPath);
        } else {
          ctx.fill(path);
        }
      }
      if (fillStrokeMode === TextRenderingMode.STROKE || fillStrokeMode === TextRenderingMode.FILL_STROKE) {
        if (patternStrokeTransform) {
          currentTransform ||= ctx.getTransform();
          ctx.setTransform(...patternStrokeTransform);
          const {
            a,
            b,
            c,
            d
          } = currentTransform;
          const invPatternTransform = Util.inverseTransform(patternStrokeTransform);
          const transf = Util.transform([a, b, c, d, 0, 0], invPatternTransform);
          Util.singularValueDecompose2dScale(transf, XY);
          ctx.lineWidth *= Math.max(XY[0], XY[1]) / fontSize;
          ctx.stroke(this.#getScaledPath(path, currentTransform, patternStrokeTransform));
        } else {
          ctx.lineWidth /= fontSize;
          ctx.stroke(path);
        }
      }
      ctx.restore();
    } else {
      if (fillStrokeMode === TextRenderingMode.FILL || fillStrokeMode === TextRenderingMode.FILL_STROKE) {
        ctx.fillText(character, x, y);
        this.dependencyTracker?.recordCharacterBBox(opIdx, ctx, font, fontSize, x, y, () => ctx.measureText(character));
      }
      if (fillStrokeMode === TextRenderingMode.STROKE || fillStrokeMode === TextRenderingMode.FILL_STROKE) {
        if (this.dependencyTracker) {
          this.dependencyTracker?.recordCharacterBBox(opIdx, ctx, font, fontSize, x, y, () => ctx.measureText(character)).recordDependencies(opIdx, Dependencies.stroke);
        }
        ctx.strokeText(character, x, y);
      }
    }
    if (isAddToPathSet) {
      const paths = this.pendingTextPaths ||= [];
      paths.push({
        transform: getCurrentTransform(ctx),
        x,
        y,
        fontSize,
        path
      });
      this.dependencyTracker?.recordCharacterBBox(opIdx, ctx, font, fontSize, x, y);
    }
  }
  get isFontSubpixelAAEnabled() {
    const tmpCanvas = this.canvasFactory.create(10, 10);
    const ctx = tmpCanvas.context;
    ctx.scale(1.5, 1);
    ctx.fillText("I", 0, 10);
    const data = ctx.getImageData(0, 0, 10, 10).data;
    this.canvasFactory.destroy(tmpCanvas);
    let enabled = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0 && data[i] < 255) {
        enabled = true;
        break;
      }
    }
    return shadow(this, "isFontSubpixelAAEnabled", enabled);
  }
  showText(opIdx, glyphs) {
    if (this.dependencyTracker) {
      this.dependencyTracker.recordDependencies(opIdx, Dependencies.showText).resetBBox(opIdx);
      if (this.current.textRenderingMode & TextRenderingMode.ADD_TO_PATH_FLAG) {
        this.dependencyTracker.recordFutureForcedDependency("textClip", opIdx).inheritPendingDependenciesAsFutureForcedDependencies();
      }
    }
    const current = this.current;
    const font = current.font;
    if (font.isType3Font) {
      const started = this.#beginKnockoutElement(current.fillAlpha);
      this.showType3Text(opIdx, glyphs);
      this.dependencyTracker?.recordShowTextOperation(opIdx);
      this.#endKnockoutElement(started);
      return;
    }
    const fontSize = current.fontSize;
    if (fontSize === 0) {
      this.dependencyTracker?.recordOperation(opIdx);
      return;
    }
    const started = this.#beginKnockoutElement(current.fillAlpha);
    const ctx = this.ctx;
    const fontSizeScale = current.fontSizeScale;
    const charSpacing = current.charSpacing;
    const wordSpacing = current.wordSpacing;
    const fontDirection = current.fontDirection;
    const textHScale = current.textHScale * fontDirection;
    const glyphsLength = glyphs.length;
    const vertical = font.vertical;
    const spacingDir = vertical ? 1 : -1;
    const defaultVMetrics = font.defaultVMetrics;
    const widthAdvanceScale = fontSize * current.fontMatrix[0];
    const simpleFillText = current.textRenderingMode === TextRenderingMode.FILL && !font.disableFontFace && !current.patternFill;
    ctx.save();
    if (current.textMatrix) {
      ctx.transform(...current.textMatrix);
    }
    ctx.translate(current.x, current.y + current.textRise);
    if (fontDirection > 0) {
      ctx.scale(textHScale, -1);
    } else {
      ctx.scale(textHScale, 1);
    }
    let patternFillTransform, patternStrokeTransform;
    const fillStrokeMode = current.textRenderingMode & TextRenderingMode.FILL_STROKE_MASK;
    const needsFill = fillStrokeMode === TextRenderingMode.FILL || fillStrokeMode === TextRenderingMode.FILL_STROKE;
    const needsStroke = fillStrokeMode === TextRenderingMode.STROKE || fillStrokeMode === TextRenderingMode.FILL_STROKE;
    let lineWidth = current.lineWidth;
    const scale = current.textMatrixScale;
    if (scale === 0 || lineWidth === 0) {
      if (needsStroke) {
        lineWidth = this.getSinglePixelWidth();
      }
    } else {
      lineWidth /= scale;
    }
    if (fontSizeScale !== 1.0) {
      ctx.scale(fontSizeScale, fontSizeScale);
      lineWidth /= fontSizeScale;
    }
    ctx.lineWidth = lineWidth;
    if (needsFill && current.patternFill) {
      ctx.save();
      const pattern = current.fillColor.getPattern(ctx, this, getCurrentTransformInverse(ctx), PathType.FILL, opIdx);
      patternFillTransform = getCurrentTransform(ctx);
      ctx.restore();
      ctx.fillStyle = pattern;
    }
    if (needsStroke && current.patternStroke) {
      ctx.save();
      const pattern = current.strokeColor.getPattern(ctx, this, getCurrentTransformInverse(ctx), PathType.STROKE, opIdx);
      patternStrokeTransform = getCurrentTransform(ctx);
      ctx.restore();
      ctx.strokeStyle = pattern;
    }
    if (font.isInvalidPDFjsFont) {
      const chars = [];
      let width = 0;
      for (const glyph of glyphs) {
        chars.push(glyph.unicode);
        width += glyph.width;
      }
      const joinedChars = chars.join("");
      ctx.fillText(joinedChars, 0, 0);
      if (this.dependencyTracker !== null) {
        const measure = ctx.measureText(joinedChars);
        this.dependencyTracker.recordBBox(opIdx, this.ctx, -measure.actualBoundingBoxLeft, measure.actualBoundingBoxRight, -measure.actualBoundingBoxAscent, measure.actualBoundingBoxDescent).recordShowTextOperation(opIdx);
      }
      current.x += width * widthAdvanceScale * textHScale;
      ctx.restore();
      this.compose();
      this.#endKnockoutElement(started);
      return;
    }
    let x = 0,
      i;
    for (i = 0; i < glyphsLength; ++i) {
      const glyph = glyphs[i];
      if (typeof glyph === "number") {
        x += spacingDir * glyph * fontSize / 1000;
        continue;
      }
      let restoreNeeded = false;
      const spacing = (glyph.isSpace ? wordSpacing : 0) + charSpacing;
      const character = glyph.fontChar;
      const accent = glyph.accent;
      let scaledX, scaledY;
      let width = glyph.width;
      if (vertical) {
        const vmetric = glyph.vmetric || defaultVMetrics;
        const vx = -(glyph.vmetric ? vmetric[1] : width * 0.5) * widthAdvanceScale;
        const vy = vmetric[2] * widthAdvanceScale;
        width = vmetric ? -vmetric[0] : width;
        scaledX = vx / fontSizeScale;
        scaledY = (x + vy) / fontSizeScale;
      } else {
        scaledX = x / fontSizeScale;
        scaledY = 0;
      }
      let measure;
      if (font.remeasure && width > 0) {
        measure = ctx.measureText(character);
        const measuredWidth = measure.width * 1000 / fontSize * fontSizeScale;
        if (width < measuredWidth && this.isFontSubpixelAAEnabled) {
          const characterScaleX = width / measuredWidth;
          restoreNeeded = true;
          ctx.save();
          ctx.scale(characterScaleX, 1);
          scaledX /= characterScaleX;
        } else if (width !== measuredWidth) {
          scaledX += (width - measuredWidth) / 2000 * fontSize / fontSizeScale;
        }
      }
      if (this.contentVisible && (glyph.isInFont || font.missingFile)) {
        if (simpleFillText && !accent) {
          ctx.fillText(character, scaledX, scaledY);
          this.dependencyTracker?.recordCharacterBBox(opIdx, ctx, measure ? {
            bbox: null
          } : font, fontSize / fontSizeScale, scaledX, scaledY, () => measure ?? ctx.measureText(character));
        } else {
          this.paintChar(opIdx, character, scaledX, scaledY, patternFillTransform, patternStrokeTransform);
          if (accent) {
            const scaledAccentX = scaledX + fontSize * accent.offset.x / fontSizeScale;
            const scaledAccentY = scaledY - fontSize * accent.offset.y / fontSizeScale;
            this.paintChar(opIdx, accent.fontChar, scaledAccentX, scaledAccentY, patternFillTransform, patternStrokeTransform);
          }
        }
      }
      const charWidth = vertical ? width * widthAdvanceScale - spacing * fontDirection : width * widthAdvanceScale + spacing * fontDirection;
      x += charWidth;
      if (restoreNeeded) {
        ctx.restore();
      }
    }
    if (vertical) {
      current.y -= x;
    } else {
      current.x += x * textHScale;
    }
    ctx.restore();
    this.compose();
    this.dependencyTracker?.recordShowTextOperation(opIdx);
    this.#endKnockoutElement(started);
  }
  showType3Text(opIdx, glyphs) {
    const ctx = this.ctx;
    const current = this.current;
    const font = current.font;
    const fontSize = current.fontSize;
    const fontDirection = current.fontDirection;
    const spacingDir = font.vertical ? 1 : -1;
    const charSpacing = current.charSpacing;
    const wordSpacing = current.wordSpacing;
    const textHScale = current.textHScale * fontDirection;
    const fontMatrix = current.fontMatrix || FONT_IDENTITY_MATRIX;
    const glyphsLength = glyphs.length;
    const isTextInvisible = current.textRenderingMode === TextRenderingMode.INVISIBLE;
    let i, glyph, width, spacingLength;
    if (isTextInvisible || fontSize === 0) {
      return;
    }
    this._cachedScaleForStroking[0] = -1;
    this._cachedGetSinglePixelWidth = null;
    ctx.save();
    if (current.textMatrix) {
      ctx.transform(...current.textMatrix);
    }
    ctx.translate(current.x, current.y + current.textRise);
    ctx.scale(textHScale, fontDirection);
    const dependencyTracker = this.dependencyTracker;
    this.dependencyTracker = dependencyTracker ? new CanvasNestedDependencyTracker(dependencyTracker, opIdx) : null;
    for (i = 0; i < glyphsLength; ++i) {
      glyph = glyphs[i];
      if (typeof glyph === "number") {
        spacingLength = spacingDir * glyph * fontSize / 1000;
        this.ctx.translate(spacingLength, 0);
        current.x += spacingLength * textHScale;
        continue;
      }
      const spacing = (glyph.isSpace ? wordSpacing : 0) + charSpacing;
      const operatorList = font.charProcOperatorList.get(glyph.operatorListId);
      if (!operatorList) {
        warn(`Type3 character "${glyph.operatorListId}" is not available.`);
      } else if (this.contentVisible) {
        this.save();
        if (operatorList.fnArray[0] === OPS.setCharWidth) {
          current.fillAlpha = current.strokeAlpha = 1;
          ctx.globalAlpha = 1;
        }
        ctx.scale(fontSize, fontSize);
        ctx.transform(...fontMatrix);
        this.executeOperatorList(operatorList);
        this.restore();
      }
      const p = [glyph.width, 0];
      Util.applyTransform(p, fontMatrix);
      width = p[0] * fontSize + spacing;
      ctx.translate(width, 0);
      current.x += width * textHScale;
    }
    ctx.restore();
    if (dependencyTracker) {
      this.dependencyTracker = dependencyTracker;
    }
  }
  setCharWidth(opIdx, xWidth, yWidth) {}
  setCharWidthAndBounds(opIdx, xWidth, yWidth, llx, lly, urx, ury) {
    const clip = new Path2D();
    clip.rect(llx, lly, urx - llx, ury - lly);
    this.ctx.clip(clip);
    this.dependencyTracker?.recordBBox(opIdx, this.ctx, llx, urx, lly, ury).recordClipBox(opIdx, this.ctx, llx, urx, lly, ury);
    this.endPath(opIdx);
  }
  getColorN_Pattern(opIdx, IR) {
    let pattern;
    if (IR[0] === "TilingPattern") {
      const baseTransform = this.baseTransform || getCurrentTransform(this.ctx);
      const canvasGraphicsFactory = {
        createCanvasGraphics: (ctx, renderingOpIdx) => new CanvasGraphics(ctx, this.commonObjs, this.objs, this.canvasFactory, this.filterFactory, {
          optionalContentConfig: this.optionalContentConfig,
          markedContentStack: this.markedContentStack
        }, undefined, undefined, this.dependencyTracker ? new CanvasNestedDependencyTracker(this.dependencyTracker, renderingOpIdx, true) : null)
      };
      pattern = new TilingPattern(IR, this.ctx, canvasGraphicsFactory, baseTransform);
    } else {
      pattern = this._getPattern(opIdx, IR[1], IR[2]);
    }
    return pattern;
  }
  setStrokeColorN(opIdx, ...args) {
    this.dependencyTracker?.recordSimpleData("strokeColor", opIdx);
    this.current.strokeColor = this.getColorN_Pattern(opIdx, args);
    this.current.patternStroke = true;
  }
  setFillColorN(opIdx, ...args) {
    this.dependencyTracker?.recordSimpleData("fillColor", opIdx);
    const pattern = this.current.fillColor = this.getColorN_Pattern(opIdx, args);
    this.current.patternFill = true;
    this.current.tilingPatternDims = pattern instanceof TilingPattern ? [0, 0, 0, 0] : null;
  }
  setStrokeRGBColor(opIdx, color) {
    this.dependencyTracker?.recordSimpleData("strokeColor", opIdx);
    this.ctx.strokeStyle = this.current.strokeColor = color;
    this.current.patternStroke = false;
  }
  setStrokeTransparent(opIdx) {
    this.dependencyTracker?.recordSimpleData("strokeColor", opIdx);
    this.ctx.strokeStyle = this.current.strokeColor = "transparent";
    this.current.patternStroke = false;
  }
  setFillRGBColor(opIdx, color) {
    this.dependencyTracker?.recordSimpleData("fillColor", opIdx);
    this.ctx.fillStyle = this.current.fillColor = color;
    this.current.patternFill = false;
    this.current.tilingPatternDims = null;
  }
  setFillTransparent(opIdx) {
    this.dependencyTracker?.recordSimpleData("fillColor", opIdx);
    this.ctx.fillStyle = this.current.fillColor = "transparent";
    this.current.patternFill = false;
    this.current.tilingPatternDims = null;
  }
  _getPattern(opIdx, objId, matrix = null) {
    const pattern = this.cachedPatterns.getOrInsertComputed(objId, () => getShadingPattern(this.getObject(opIdx, objId)));
    if (matrix) {
      pattern.matrix = matrix;
    }
    return pattern;
  }
  shadingFill(opIdx, objId) {
    if (!this.contentVisible) {
      return;
    }
    const started = this.#beginKnockoutElement(this.current.fillAlpha);
    const ctx = this.ctx;
    this.save(opIdx);
    const pattern = this._getPattern(opIdx, objId);
    ctx.fillStyle = pattern.getPattern(ctx, this, getCurrentTransformInverse(ctx), PathType.SHADING, opIdx);
    const inv = getCurrentTransformInverse(ctx);
    if (inv) {
      const {
        width,
        height
      } = ctx.canvas;
      const minMax = F32_BBOX_INIT.slice();
      Util.axialAlignedBoundingBox([0, 0, width, height], inv, minMax);
      const [x0, y0, x1, y1] = minMax;
      this.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    } else {
      this.ctx.fillRect(-1e10, -1e10, 2e10, 2e10);
    }
    this.dependencyTracker?.resetBBox(opIdx).recordFullPageBBox(opIdx).recordDependencies(opIdx, Dependencies.transform).recordDependencies(opIdx, Dependencies.fill).recordOperation(opIdx);
    this.compose(this.current.getClippedPathBoundingBox());
    this.restore(opIdx);
    this.#endKnockoutElement(started);
  }
  beginInlineImage() {
    unreachable("Should not call beginInlineImage");
  }
  beginImageData() {
    unreachable("Should not call beginImageData");
  }
  paintFormXObjectBegin(opIdx, matrix, bbox) {
    if (!this.contentVisible) {
      return;
    }
    this.save(opIdx);
    this.baseTransformStack.push(this.baseTransform);
    if (matrix) {
      this.transform(opIdx, ...matrix);
    }
    this.baseTransform = getCurrentTransform(this.ctx);
    if (bbox) {
      Util.axialAlignedBoundingBox(bbox, this.baseTransform, this.current.minMax);
      const [x0, y0, x1, y1] = bbox;
      const clip = new Path2D();
      clip.rect(x0, y0, x1 - x0, y1 - y0);
      this.ctx.clip(clip);
      this.dependencyTracker?.recordClipBox(opIdx, this.ctx, x0, x1, y0, y1);
      this.endPath(opIdx);
    }
  }
  paintFormXObjectEnd(opIdx) {
    if (!this.contentVisible) {
      return;
    }
    this.restore(opIdx);
    this.baseTransform = this.baseTransformStack.pop();
  }
  beginGroup(opIdx, group) {
    if (!this.contentVisible) {
      return;
    }
    this.save(opIdx);
    const {
      inSMaskMode
    } = this;
    if (inSMaskMode) {
      this.endSMaskMode();
      this.current.activeSMask = null;
    }
    const currentCtx = this.ctx;
    if ((!group.needsIsolation || !group.isolated && !group.hasSoftMask) && !group.knockout && !group.isGray && this.#knockoutGroupLevel === 0 && currentCtx.globalAlpha === 1 && currentCtx.globalCompositeOperation === "source-over" && !inSMaskMode) {
      if (group.bbox) {
        let clip = new Path2D();
        const [x0, y0, x1, y1] = group.bbox;
        clip.rect(x0, y0, x1 - x0, y1 - y0);
        if (group.matrix) {
          const path = new Path2D();
          path.addPath(clip, new DOMMatrix(group.matrix));
          clip = path;
        }
        currentCtx.clip(clip);
      }
      this.groupStack.push(null);
      this.#groupStackMeta.push(null);
      this.groupLevel++;
      return;
    }
    if (!group.isolated && !group.knockout && this.#knockoutGroupLevel === 0) {
      info("TODO: Fully support non-isolated non-knockout groups.");
    }
    const currentTransform = getCurrentTransform(currentCtx);
    if (group.matrix) {
      currentCtx.transform(...group.matrix);
    }
    const canvasBounds = [0, 0, currentCtx.canvas.width, currentCtx.canvas.height];
    let bounds;
    if (group.bbox) {
      bounds = F32_BBOX_INIT.slice();
      Util.axialAlignedBoundingBox(group.bbox, getCurrentTransform(currentCtx), bounds);
      bounds = Util.intersect(bounds, canvasBounds) || [0, 0, 0, 0];
    } else {
      bounds = canvasBounds;
    }
    const offsetX = Math.floor(bounds[0]);
    const offsetY = Math.floor(bounds[1]);
    const drawnWidth = Math.max(Math.ceil(bounds[2]) - offsetX, 1);
    const drawnHeight = Math.max(Math.ceil(bounds[3]) - offsetY, 1);
    this.current.startNewPathAndClipBox([0, 0, drawnWidth, drawnHeight]);
    const scratchCanvas = this.canvasFactory.create(drawnWidth, drawnHeight);
    if (group.smask) {
      this.smaskGroupCanvases.push(scratchCanvas);
    }
    const groupCtx = scratchCanvas.context;
    const backdropCtx = group.knockout && !group.isolated ? currentCtx : null;
    const hasInnerBackdrop = !group.isolated && !group.knockout && !group.smask && group.needsIsolation && this.#knockoutGroupLevel > 0;
    const knockoutMaskEntry = group.knockout ? this.canvasFactory.create(drawnWidth, drawnHeight) : null;
    const savedKnockoutLevel = this.#knockoutGroupLevel;
    if (group.knockout) {
      this.#knockoutGroupLevel++;
    } else {
      this.#knockoutGroupLevel = 0;
    }
    groupCtx.translate(-offsetX, -offsetY);
    groupCtx.transform(...currentTransform);
    const needsBackdropCopy = !group.isolated && !group.smask && group.needsIsolation;
    const replaceBackdrop = needsBackdropCopy && !inSMaskMode && savedKnockoutLevel === 0 && !group.knockout && !group.isGray && group.hasSoftMask && currentCtx.globalAlpha === 1 && currentCtx.globalCompositeOperation === "source-over" && this.current.transferMaps === "none";
    if (needsBackdropCopy && (inSMaskMode || replaceBackdrop)) {
      groupCtx.save();
      groupCtx.setTransform(1, 0, 0, 1, 0, 0);
      groupCtx.drawImage(currentCtx.canvas, -offsetX, -offsetY);
      groupCtx.restore();
    }
    if (group.bbox) {
      let clip = new Path2D();
      const [x0, y0, x1, y1] = group.bbox;
      clip.rect(x0, y0, x1 - x0, y1 - y0);
      if (group.matrix) {
        const path = new Path2D();
        path.addPath(clip, new DOMMatrix(group.matrix));
        clip = path;
      }
      groupCtx.clip(clip);
    }
    if (group.smask) {
      this.smaskStack.push({
        canvas: scratchCanvas.canvas,
        context: groupCtx,
        offsetX,
        offsetY,
        subtype: group.smask.subtype,
        backdrop: group.smask.backdrop,
        transferMap: group.smask.transferMap || null
      });
    }
    if (!group.smask || this.dependencyTracker) {
      currentCtx.setTransform(1, 0, 0, 1, 0, 0);
      currentCtx.translate(offsetX, offsetY);
      currentCtx.save();
    }
    copyCtxState(currentCtx, groupCtx);
    this.ctx = groupCtx;
    this.dependencyTracker?.inheritSimpleDataAsFutureForcedDependencies(["fillAlpha", "strokeAlpha", "globalCompositeOperation"]).pushBaseTransform(currentCtx);
    this.setGState(opIdx, [["BM", "source-over"], ["ca", 1], ["CA", 1], ["TR", null]]);
    this.groupStack.push(currentCtx);
    this.#groupStackMeta.push({
      backdropCtx,
      savedKnockoutLevel,
      offsetX,
      offsetY,
      hasInnerBackdrop,
      replaceBackdrop,
      knockoutMaskEntry,
      knockoutTempEntry: null,
      knockoutBackdropEntry: null
    });
    this.groupLevel++;
  }
  endGroup(opIdx, group) {
    if (!this.contentVisible) {
      return;
    }
    this.groupLevel--;
    const groupCtx = this.ctx;
    const ctx = this.groupStack.pop();
    const groupMeta = this.#groupStackMeta.pop();
    if (groupMeta) {
      this.#knockoutGroupLevel = groupMeta.savedKnockoutLevel;
    }
    if (ctx === null) {
      this.restore(opIdx);
      return;
    }
    if (group.isGray) {
      this.#convertGroupToGray(groupCtx);
    }
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.dependencyTracker?.popBaseTransform();
    if (group.smask) {
      this.tempSMask = this.smaskStack.pop();
      this.restore(opIdx);
      if (this.dependencyTracker) {
        this.ctx.restore();
        if (this.inSMaskMode) {
          this.ctx.setTransform(this.suspendedCtx.getTransform());
        }
      }
      this.#destroyKnockoutPools(groupMeta);
    } else {
      this.ctx.restore();
      const currentMtx = getCurrentTransform(this.ctx);
      this.restore(opIdx);
      this.ctx.save();
      this.ctx.setTransform(...currentMtx);
      const dirtyBox = F32_BBOX_INIT.slice();
      Util.axialAlignedBoundingBox([0, 0, groupCtx.canvas.width, groupCtx.canvas.height], currentMtx, dirtyBox);
      const parentGroupMeta = this.#groupStackMeta.at(-1);
      if (this.#knockoutGroupLevel > 0) {
        if (groupMeta.hasInnerBackdrop) {
          const {
            width,
            height
          } = groupCtx.canvas;
          const colorEntry = this.canvasFactory.create(width, height);
          const colorCtx = colorEntry.context;
          colorCtx.drawImage(ctx.canvas, groupMeta.offsetX, groupMeta.offsetY, width, height, 0, 0, width, height);
          colorCtx.globalCompositeOperation = "source-over";
          colorCtx.drawImage(groupCtx.canvas, 0, 0);
          const shapeMaskEntry = this.#createKnockoutMaskCanvas(groupCtx.canvas);
          colorCtx.globalCompositeOperation = "destination-in";
          colorCtx.drawImage(shapeMaskEntry.canvas, 0, 0);
          const sourceCompositeOperation = this.ctx.globalCompositeOperation;
          const sourceAlpha = this.ctx.globalAlpha;
          const sourceFilter = this.ctx.filter;
          this.ctx.save();
          this.ctx.setTransform(...currentMtx);
          this.ctx.globalAlpha = 1;
          if (FeatureTest.isCanvasFilterSupported) {
            this.ctx.filter = "none";
          }
          this.ctx.globalCompositeOperation = "destination-out";
          this.ctx.drawImage(shapeMaskEntry.canvas, 0, 0);
          this.ctx.globalCompositeOperation = sourceCompositeOperation;
          this.ctx.globalAlpha = sourceAlpha;
          if (FeatureTest.isCanvasFilterSupported) {
            this.ctx.filter = sourceFilter ?? "none";
          }
          this.ctx.drawImage(colorEntry.canvas, 0, 0);
          this.ctx.restore();
          this.canvasFactory.destroy(shapeMaskEntry);
          this.canvasFactory.destroy(colorEntry);
        } else {
          const backdropCtx = parentGroupMeta?.backdropCtx ?? null;
          this.#compositeKnockoutSurface(this.ctx, groupCtx.canvas, {
            backdropCanvas: backdropCtx?.canvas ?? null,
            destTransform: currentMtx,
            backdropOffset: backdropCtx ? [parentGroupMeta.offsetX + groupMeta.offsetX, parentGroupMeta.offsetY + groupMeta.offsetY] : [0, 0],
            sourceAlpha: this.ctx.globalAlpha,
            sourceFilter: this.ctx.filter
          });
        }
      } else {
        if (groupMeta.replaceBackdrop) {
          const clip = new Path2D();
          clip.rect(0, 0, groupCtx.can÷Î´á¼­zÊ&ŠÛ^tÀ€˜˜ÁÉ½Á•ÉÑ¥•Ì¹¡…ÍQ•áÐ¤ì(€€€€€½¹ÍÐì(€€€€€€€™½¹Ñ…µ¥±ä(€€€€€ô€ôÍÑå±”ì(€€€€€½¹ÍÐì(€€€€€€€…¹Ù…Í]¥‘Ñ °(€€€€€€€™½¹ÑM¥é”(€€€€€ô€ôÁÉ½Á•ÉÑ¥•Ìì(€€€€€Q•áÑ1…å•È¸•¹ÍÕÉ•Ñá½¹Ð¡Ñà°™½¹ÑM¥é”€¨Ñ¡¥Ì¸Í…±”°™½¹Ñ…µ¥±ä¤ì(€€€€€½¹ÍÐì(€€€€€€€Ý¥‘Ñ (€€€€€ô€ôÑà¹µ•…ÍÕÉ•Q•áÐ¡‘¥Ø¹Ñ•áÑ½¹Ñ•¹Ð¤ì(€€€€€¥˜€¡Ý¥‘Ñ €ø€À¤ì(€€€€€€€ÍÑå±”¹Í•ÑAÉ½Á•ÉÑä ˆ´µÍ…±”µàˆ°…¹Ù…Í]¥‘Ñ €¨Ñ¡¥Ì¸Í…±”€¼Ý¥‘Ñ ¤ì(€€€€€ô(€€€ô(€€€¥˜€¡ÁÉ½Á•ÉÑ¥•Ì¹…¹±”€„ôô€À¤ì(€€€€€ÍÑå±”¹Í•ÑAÉ½Á•ÉÑä ˆ´µÉ½Ñ…Ñ”ˆ°€‘íÁÉ½Á•ÉÑ¥•Ì¹…¹±•õ‘•€¤ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ±•…¹ÕÀ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á•¹‘¥¹Q•áÑ1…å•ÉÌ¹Í¥é”€ø€À¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸…Í•¹Ñ…¡”¹±•…È ¤ì(€€€™½È€¡½¹ÍÐì(€€€€€…¹Ù…Ì(€€€ô½˜Ñ¡¥Ì¸…¹Ù…Í½¹Ñ•áÑÌ¹Ù…±Õ•Ì ¤¤ì(€€€€€…¹Ù…Ì¹É•µ½Ù” ¤ì(€€€ô(€€€Ñ¡¥Ì¸…¹Ù…Í½¹Ñ•áÑÌ¹±•…È ¤ì(€ô(€ÍÑ…Ñ¥Œ€•ÑÑà¡±…¹œ€ô¹Õ±°¤ì(€€€±•ÐÑà€ôÑ¡¥Ì¸…¹Ù…Í½¹Ñ•áÑÌ¹•Ð¡±…¹œñðô€ˆˆ¤ì(€€€¥˜€ …Ñà¤ì(€€€€€½¹ÍÐ…¹Ù…Ì€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰…¹Ù…Ìˆ¤ì(€€€€€…¹Ù…Ì¹ÍÑå±”¹ÍÍQ•áÐ€ô€‰Á½Í¥Ñ¥½¸é…‰Í½±ÕÑ”íÑ½ÀèÀí±•™ÐèÀíÝ¥‘Ñ èÀí¡•¥¡ÐèÀí‘¥ÍÁ±…äé¹½¹”ìˆ€¬€‰±•ÑÑ•ÈµÍÁ…¥¹œé¹½Éµ…°íÝ½ÉµÍÁ…¥¹œé¹½Éµ…°ˆì(€€€€€…¹Ù…Ì¹±…¹œ€ô±…¹œì(€€€€€‘½Õµ•¹Ð¹‰½‘ä¹…ÁÁ•¹¡…¹Ù…Ì¤ì(€€€€€Ñà€ô…¹Ù…Ì¹•Ñ½¹Ñ•áÐ ˆÉˆ°ì(€€€€€€€…±Á¡„è™…±Í”°(€€€€€€€Ý¥±±I•…‘É•ÅÕ•¹Ñ±äèÑÉÕ”(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¸…¹Ù…Í½¹Ñ•áÑÌ¹Í•Ð¡±…¹œ°Ñà¤ì(€€€€€Ñ¡¥Ì¸…¹Ù…ÍÑá½¹ÑÌ¹Í•Ð¡Ñà°ì(€€€€€€€Í¥é”è€À°(€€€€€€€™…µ¥±äè€ˆˆ(€€€€€ô¤ì(€€€ô(€€€É•ÑÕÉ¸Ñàì(€ô(€ÍÑ…Ñ¥Œ€•¹ÍÕÉ•Ñá½¹Ð¡Ñà°Í¥é”°™…µ¥±ä¤ì(€€€½¹ÍÐ…¡•€ôÑ¡¥Ì¸…¹Ù…ÍÑá½¹ÑÌ¹•Ð¡Ñà¤ì(€€€¥˜€¡Í¥é”€ôôô…¡•¹Í¥é”€˜˜™…µ¥±ä€ôôô…¡•¹™…µ¥±ä¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñà¹™½¹Ð€ô€‘íÍ¥é•õÁà€‘í™…µ¥±åõ€ì(€€€…¡•¹Í¥é”€ôÍ¥é”ì(€€€…¡•¹™…µ¥±ä€ô™…µ¥±äì(€ô(€ÍÑ…Ñ¥Œ€•¹ÍÕÉ•5¥¹½¹ÑM¥é•½µÁÕÑ• ¤ì(€€€¥˜€¡Ñ¡¥Ì¸µ¥¹½¹ÑM¥é”€„ôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ‘¥Ø€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€‘¥Ø¹ÍÑå±”¹½Á…¥Ñä€ô€Àì(€€€‘¥Ø¹ÍÑå±”¹±¥¹•!•¥¡Ð€ô€Äì(€€€‘¥Ø¹ÍÑå±”¹™½¹ÑM¥é”€ô€ˆÅÁàˆì(€€€‘¥Ø¹ÍÑå±”¹Á½Í¥Ñ¥½¸€ô€‰…‰Í½±ÕÑ”ˆì(€€€‘¥Ø¹Ñ•áÑ½¹Ñ•¹Ð€ô€‰`ˆì(€€€‘½Õµ•¹Ð¹‰½‘ä¹…ÁÁ•¹¡‘¥Ø¤ì(€€€Ñ¡¥Ì¸µ¥¹½¹ÑM¥é”€ô‘¥Ø¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤¹¡•¥¡Ðì(€€€‘¥Ø¹É•µ½Ù” ¤ì(€ô(€ÍÑ…Ñ¥Œ€•ÑÍ•¹Ð¡™½¹Ñ…µ¥±ä°ÍÑå±”°±…¹œ¤ì(€€€½¹ÍÐ…¡•‘Í•¹Ð€ôÑ¡¥Ì¸…Í•¹Ñ…¡”¹•Ð¡™½¹Ñ…µ¥±ä¤ì(€€€¥˜€¡…¡•‘Í•¹Ð¤ì(€€€€€É•ÑÕÉ¸…¡•‘Í•¹Ðì(€€€ô(€€€½¹ÍÐÑà€ôÑ¡¥Ì¸•ÑÑà¡±…¹œ¤ì(€€€Ñà¹…¹Ù…Ì¹Ý¥‘Ñ €ôÑà¹…¹Ù…Ì¹¡•¥¡Ð€ôU1Q}=9Q}M%iì(€€€Ñ¡¥Ì¸•¹ÍÕÉ•Ñá½¹Ð¡Ñà°U1Q}=9Q}M%i°™½¹Ñ…µ¥±ä¤ì(€€€½¹ÍÐµ•ÑÉ¥Ì€ôÑà¹µ•…ÍÕÉ•Q•áÐ ˆˆ¤ì(€€€½¹ÍÐ…Í•¹Ð€ôµ•ÑÉ¥Ì¹™½¹Ñ	½Õ¹‘¥¹	½áÍ•¹Ðì(€€€½¹ÍÐ‘•Í•¹Ð€ô5…Ñ ¹…‰Ì¡µ•ÑÉ¥Ì¹™½¹Ñ	½Õ¹‘¥¹	½á•Í•¹Ð¤ì(€€€Ñà¹…¹Ù…Ì¹Ý¥‘Ñ €ôÑà¹…¹Ù…Ì¹¡•¥¡Ð€ô€Àì(€€€±•ÐÉ…Ñ¥¼€ô€À¸àì(€€€¥˜€¡…Í•¹Ð¤ì(€€€€€É…Ñ¥¼€ô…Í•¹Ð€¼€¡…Í•¹Ð€¬‘•Í•¹Ð¤ì(€€€ô•±Í”ì(€€€€€¥˜€¡•…ÑÕÉ•Q•ÍÐ¹Á±…Ñ™½É´¹¥Í¥É•™½à¤ì(€€€€€€€Ý…É¸ ‰¹…‰±”Ñ¡”‘½´¹Ñ•áÑ5•ÑÉ¥Ì¹™½¹Ñ	½Õ¹‘¥¹	½à¹•¹…‰±•‘€ÁÉ•™•É•¹”€ˆ€¬€‰¥¸…‰½ÕÐé½¹™¥€Ñ¼¥µÁÉ½Ù”Q•áÑ1…å•ÈÉ•¹‘•É¥¹œ¸ˆ¤ì(€€€€€ô(€€€€€¥˜€¡ÍÑå±”¹…Í•¹Ð¤ì(€€€€€€€É…Ñ¥¼€ôÍÑå±”¹…Í•¹Ðì(€€€€€ô•±Í”¥˜€¡ÍÑå±”¹‘•Í•¹Ð¤ì(€€€€€€€É…Ñ¥¼€ô€Ä€¬ÍÑå±”¹‘•Í•¹Ðì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¸…Í•¹Ñ…¡”¹Í•Ð¡™½¹Ñ…µ¥±ä°É…Ñ¥¼¤ì(€€€É•ÑÕÉ¸É…Ñ¥¼ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½…Á¤¹©Ì((((((((((((((((((((((((()½¹ÍÐI9I%9}911}Q%5=UP€ô€ÄÀÀì)™Õ¹Ñ¥½¸•Ñ½Õµ•¹Ð¡ÍÉŒ€ôíô¤ì(€½¹ÍÐÑ…Í¬€ô¹•ÜA½Õµ•¹Ñ1½…‘¥¹Q…Í¬ ¤ì(€½¹ÍÐì(€€€‘½%(€ô€ôÑ…Í¬ì(€½¹ÍÐÕÉ°€ôÍÉŒ¹ÕÉ°€ü•ÑUÉ±AÉ½À¡ÍÉŒ¹ÕÉ°¤€è¹Õ±°ì(€½¹ÍÐ‘…Ñ„€ôÍÉŒ¹‘…Ñ„€ü•Ñ…Ñ…AÉ½À¡ÍÉŒ¹‘…Ñ„¤€è¹Õ±°ì(€½¹ÍÐ¡ÑÑÁ!•…‘•ÉÌ€ôÍÉŒ¹¡ÑÑÁ!•…‘•ÉÌñð¹Õ±°ì(€½¹ÍÐÝ¥Ñ¡É•‘•¹Ñ¥…±Ì€ôÍÉŒ¹Ý¥Ñ¡É•‘•¹Ñ¥…±Ì€ôôôÑÉÕ”ì(€½¹ÍÐÁ…ÍÍÝ½É€ôÍÉŒ¹Á…ÍÍÝ½É€üü¹Õ±°ì(€½¹ÍÐÉ…¹•QÉ…¹ÍÁ½ÉÐ€ôÍÉŒ¹É…¹”¥¹ÍÑ…¹•½˜A…Ñ…I…¹•QÉ…¹ÍÁ½ÉÐ€üÍÉŒ¹É…¹”€è¹Õ±°ì(€½¹ÍÐÉ…¹•¡Õ¹­M¥é”€ô9Õµ‰•È¹¥Í%¹Ñ••È¡ÍÉŒ¹É…¹•¡Õ¹­M¥é”¤€˜˜ÍÉŒ¹É…¹•¡Õ¹­M¥é”€ø€À€üÍÉŒ¹É…¹•¡Õ¹­M¥é”€è€È€¨¨€ÄØì(€±•ÐÝ½É­•È€ôÍÉŒ¹Ý½É­•È¥¹ÍÑ…¹•½˜A]½É­•È€üÍÉŒ¹Ý½É­•È€è¹Õ±°ì(€½¹ÍÐÙ•É‰½Í¥Ñä€ôÍÉŒ¹Ù•É‰½Í¥Ñäì(€½¹ÍÐ‘½	…Í•UÉ°€ôÑåÁ•½˜ÍÉŒ¹‘½	…Í•UÉ°€ôôô€‰ÍÑÉ¥¹œˆ€˜˜€…¥Í…Ñ…M¡•µ”¡ÍÉŒ¹‘½	…Í•UÉ°¤€üÍÉŒ¹‘½	…Í•UÉ°€è¹Õ±°ì(€½¹ÍÐ5…ÁUÉ°€ô•Ñ…Ñ½ÉåUÉ±AÉ½À¡ÍÉŒ¹5…ÁUÉ°¤ì(€½¹ÍÐ5…ÁA…­•€ôÍÉŒ¹5…ÁA…­•€„ôô™…±Í”ì(€½¹ÍÐ¥UÉ°€ô•Ñ…Ñ½ÉåUÉ±AÉ½À¡ÍÉŒ¹¥UÉ°¤ì(€½¹ÍÐÍÑ…¹‘…É‘½¹Ñ…Ñ…UÉ°€ô•Ñ…Ñ½ÉåUÉ±AÉ½À¡ÍÉŒ¹ÍÑ…¹‘…É‘½¹Ñ…Ñ…UÉ°¤ì(€½¹ÍÐÝ…ÍµUÉ°€ô•Ñ…Ñ½ÉåUÉ±AÉ½À¡ÍÉŒ¹Ý…ÍµUÉ°¤ì(€½¹ÍÐ¥¹½É•ÉÉ½ÉÌ€ôÍÉŒ¹ÍÑ½ÁÑÉÉ½ÉÌ€„ôôÑÉÕ”ì(€½¹ÍÐµ…á%µ…•M¥é”€ô9Õµ‰•È¹¥Í%¹Ñ••È¡ÍÉŒ¹µ…á%µ…•M¥é”¤€˜˜ÍÉŒ¹µ…á%µ…•M¥é”€ø€´Ä€üÍÉŒ¹µ…á%µ…•M¥é”€è€´Äì(€½¹ÍÐ¥Í=™™ÍÉ••¹…¹Ù…ÍMÕÁÁ½ÉÑ•€ôÑåÁ•½˜ÍÉŒ¹¥Í=™™ÍÉ••¹…¹Ù…ÍMÕÁÁ½ÉÑ•€ôôô€‰‰½½±•…¸ˆ€üÍÉŒ¹¥Í=™™ÍÉ••¹…¹Ù…ÍMÕÁÁ½ÉÑ•€è€…¥Í9½‘•)Lì(€½¹ÍÐ¥Í%µ…••½‘•ÉMÕÁÁ½ÉÑ•€ôÑåÁ•½˜ÍÉŒ¹¥Í%µ…••½‘•ÉMÕÁÁ½ÉÑ•€ôôô€‰‰½½±•…¸ˆ€üÍÉŒ¹¥Í%µ…••½‘•ÉMÕÁÁ½ÉÑ•€è€…¥Í9½‘•)Lì(€½¹ÍÐ…¹Ù…Í5…áÉ•…%¹	åÑ•Ì€ô9Õµ‰•È¹¥Í%¹Ñ••È¡ÍÉŒ¹…¹Ù…Í5…áÉ•…%¹	åÑ•Ì¤€üÍÉŒ¹…¹Ù…Í5…áÉ•…%¹	åÑ•Ì€è€´Äì(€½¹ÍÐ‘¥Í…‰±•½¹Ñ…”€ôÑåÁ•½˜ÍÉŒ¹‘¥Í…‰±•½¹Ñ…”€ôôô€‰‰½½±•…¸ˆ€üÍÉŒ¹‘¥Í…‰±•½¹Ñ…”€è¥Í9½‘•)Lì(€½¹ÍÐ™½¹ÑáÑÉ…AÉ½Á•ÉÑ¥•Ì€ôÍÉŒ¹™½¹ÑáÑÉ…AÉ½Á•ÉÑ¥•Ì€ôôôÑÉÕ”ì(€½¹ÍÐ•¹…‰±•a™„€ôÍÉŒ¹•¹…‰±•a™„€ôôôÑÉÕ”ì(€½¹ÍÐ½Ý¹•É½Õµ•¹Ð€ôÍÉŒ¹½Ý¹•É½Õµ•¹Ðñð±½‰…±Q¡¥Ì¹‘½Õµ•¹Ðì(€½¹ÍÐ‘¥Í…‰±•I…¹”€ôÍÉŒ¹‘¥Í…‰±•I…¹”€ôôôÑÉÕ”ì(€½¹ÍÐ‘¥Í…‰±•MÑÉ•…´€ôÍÉŒ¹‘¥Í…‰±•MÑÉ•…´€ôôôÑÉÕ”ì(€½¹ÍÐ‘¥Í…‰±•ÕÑ½•Ñ €ôÍÉŒ¹‘¥Í…‰±•ÕÑ½•Ñ €ôôôÑÉÕ”ì(€½¹ÍÐÁ‘™	Õœ€ôÍÉŒ¹Á‘™	Õœ€ôôôÑÉÕ”ì(€½¹ÍÐ…¹Ù…Í…Ñ½Éä€ôÍÉŒ¹…¹Ù…Í…Ñ½Éäñð€¡¥Í9½‘•)L€ü9½‘•…¹Ù…Í…Ñ½Éä€è=5…¹Ù…Í…Ñ½Éä¤ì(€½¹ÍÐ¥±Ñ•É…Ñ½Éä€ôÍÉŒ¹¥±Ñ•É…Ñ½Éäñð€¡¥Í9½‘•)L€ü9½‘•¥±Ñ•É…Ñ½Éä€è=5¥±Ñ•É…Ñ½Éä¤ì(€½¹ÍÐ	¥¹…Éå…Ñ……Ñ½Éä€ôÍÉŒ¹	¥¹…Éå…Ñ……Ñ½Éäñð€¡¥Í9½‘•)L€ü9½‘•	¥¹…Éå…Ñ……Ñ½Éä€è=5	¥¹…Éå…Ñ……Ñ½Éä¤ì(€½¹ÍÐ•¹…‰±•!]€ôÍÉŒ¹•¹…‰±•!]€ôôôÑÉÕ”ì(€½¹ÍÐ•¹…‰±•]•‰AT€ôÍÉŒ¹•¹…‰±•]•‰AT€ôôôÑÉÕ”ì(€½¹ÍÐÁÕAÉ½µ¥Í”€ô•¹…‰±•]•‰AT€ü¥¹¥ÑAT ¤€èAÉ½µ¥Í”¹É•Í½±Ù”¡™…±Í”¤ì(€½¹ÍÐÕÍ•]…Í´€ôÍÉŒ¹ÕÍ•]…Í´€„ôô™…±Í”ì(€½¹ÍÐÁ…•Í5…ÁÁ•È€ôÍÉŒ¹Á…•Í5…ÁÁ•Èñð¹•ÜA…•Í5…ÁÁ•È ¤ì(€½¹ÍÐÕÍ•MåÍÑ•µ½¹ÑÌ€ôÑåÁ•½˜ÍÉŒ¹ÕÍ•MåÍÑ•µ½¹ÑÌ€ôôô€‰‰½½±•…¸ˆ€üÍÉŒ¹ÕÍ•MåÍÑ•µ½¹ÑÌ€è€…¥Í9½‘•)L€˜˜€…‘¥Í…‰±•½¹Ñ…”ì(€½¹ÍÐÕÍ•]½É­•É•Ñ €ôÑåÁ•½˜ÍÉŒ¹ÕÍ•]½É­•É•Ñ €ôôô€‰‰½½±•…¸ˆ€üÍÉŒ¹ÕÍ•]½É­•É•Ñ €è€„„¡	¥¹…Éå…Ñ……Ñ½Éä€ôôô=5	¥¹…Éå…Ñ……Ñ½Éä€˜˜5…ÁUÉ°€˜˜5…ÁA…­•€˜˜ÍÑ…¹‘…É‘½¹Ñ…Ñ…UÉ°€˜˜Ý…ÍµUÉ°€˜˜¥ÍY…±¥‘•Ñ¡UÉ°¡5…ÁUÉ°°‘½Õµ•¹Ð¹‰…Í•UI$¤€˜˜¥ÍY…±¥‘•Ñ¡UÉ°¡ÍÑ…¹‘…É‘½¹Ñ…Ñ…UÉ°°‘½Õµ•¹Ð¹‰…Í•UI$¤€˜˜¥ÍY…±¥‘•Ñ¡UÉ°¡Ý…ÍµUÉ°°‘½Õµ•¹Ð¹‰…Í•UI$¤¤ì(€½¹ÍÐÍÑå±•±•µ•¹Ð€ô¹Õ±°ì(€Í•ÑY•É‰½Í¥Ñå1•Ù•°¡Ù•É‰½Í¥Ñä¤ì(€½¹ÍÐÑÉ…¹ÍÁ½ÉÑ…Ñ½Éä€ôì(€€€…¹Ù…Í…Ñ½Éäè¹•Ü…¹Ù…Í…Ñ½Éä¡ì(€€€€€½Ý¹•É½Õµ•¹Ð°(€€€€€•¹…‰±•!](€€€ô¤°(€€€™¥±Ñ•É…Ñ½Éäè¹•Ü¥±Ñ•É…Ñ½Éä¡ì(€€€€€‘½%°(€€€€€½Ý¹•É½Õµ•¹Ð(€€€ô¤°(€€€‰¥¹…Éå…Ñ……Ñ½ÉäèÕÍ•]½É­•É•Ñ €ü¹Õ±°€è¹•Ü	¥¹…Éå…Ñ……Ñ½Éä¡ì(€€€€€5…ÁUÉ°°(€€€€€ÍÑ…¹‘…É‘½¹Ñ…Ñ…UÉ°°(€€€€€Ý…ÍµUÉ°(€€€ô¤(€ôì(€¥˜€ …Ý½É­•È¤ì(€€€Ý½É­•È€ôA]½É­•È¹É•…Ñ”¡ì(€€€€€Ù•É‰½Í¥Ñä°(€€€€€Á½ÉÐè±½‰…±]½É­•É=ÁÑ¥½¹Ì¹Ý½É­•ÉA½ÉÐ(€€€ô¤ì(€€€Ñ…Í¬¹}Ý½É­•È€ôÝ½É­•Èì(€ô(€½¹ÍÐ‘½A…É…µÌ€ôì(€€€‘½%°(€€€…Á¥Y•ÉÍ¥½¸è€ˆØ¸Ì¸Èàäˆ°(€€€‘…Ñ„°(€€€Á…ÍÍÝ½É°(€€€‘¥Í…‰±•ÕÑ½•Ñ °(€€€É…¹•¡Õ¹­M¥é”°(€€€‘½	…Í•UÉ°°(€€€•¹…‰±•a™„°(€€€•Ù…±Õ…Ñ½É=ÁÑ¥½¹Ìèì(€€€€€µ…á%µ…•M¥é”°(€€€€€‘¥Í…‰±•½¹Ñ…”°(€€€€€¥¹½É•ÉÉ½ÉÌ°(€€€€€¥Í=™™ÍÉ••¹…¹Ù…ÍMÕÁÁ½ÉÑ•°(€€€€€¥Í%µ…••½‘•ÉMÕÁÁ½ÉÑ•°(€€€€€…¹Ù…Í5…áÉ•…%¹	åÑ•Ì°(€€€€€™½¹ÑáÑÉ…AÉ½Á•ÉÑ¥•Ì°(€€€€€ÕÍ•MåÍÑ•µ½¹ÑÌ°(€€€€€ÕÍ•]…Í´°(€€€€€ÕÍ•]½É­•É•Ñ °(€€€€€5…ÁUÉ°°(€€€€€5…ÁA…­•°(€€€€€¥UÉ°°(€€€€€ÍÑ…¹‘…É‘½¹Ñ…Ñ…UÉ°°(€€€€€Ý…ÍµUÉ°°(€€€€€¡…ÍATè™…±Í”(€€€ô(€ôì(€½¹ÍÐÑÉ…¹ÍÁ½ÉÑA…É…µÌ€ôì(€€€½Ý¹•É½Õµ•¹Ð°(€€€Á‘™	Õœ°(€€€ÍÑå±•±•µ•¹Ð°(€€€•¹…‰±•!]°(€€€±½…‘¥¹A…É…µÌèì(€€€€€‘¥Í…‰±•ÕÑ½•Ñ °(€€€€€•¹…‰±•a™„(€€€ô(€ôì(€AÉ½µ¥Í”¹…±°¡mÝ½É­•È¹ÁÉ½µ¥Í”°ÁÕAÉ½µ¥Í•t¤¹Ñ¡•¸¡™Õ¹Ñ¥½¸€¡l°¡…ÍAUt¤ì(€€€¥˜€¡Ý½É­•È¹‘•ÍÑÉ½å•¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰]½É­•ÈÝ…Ì‘•ÍÑÉ½å•ˆ¤ì(€€€ô(€€€‘½A…É…µÌ¹•Ù…±Õ…Ñ½É=ÁÑ¥½¹Ì¹¡…ÍAT€ô¡…ÍATì(€€€½¹ÍÐÝ½É­•É%‘AÉ½µ¥Í”€ôÝ½É­•È¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ½I•ÅÕ•ÍÐˆ°‘½A…É…µÌ°‘…Ñ„€üm‘…Ñ„¹‰Õ™™•Ét€è¹Õ±°¤ì(€€€±•Ð¹•ÑÝ½É­MÑÉ•…´ì(€€€¥˜€¡‘…Ñ„¤íô•±Í”¥˜€¡É…¹•QÉ…¹ÍÁ½ÉÐ¤ì(€€€€€¹•ÑÝ½É­MÑÉ•…´€ô¹•ÜA…Ñ…QÉ…¹ÍÁ½ÉÑMÑÉ•…´¡ì(€€€€€€€Á‘™…Ñ…I…¹•QÉ…¹ÍÁ½ÉÐèÉ…¹•QÉ…¹ÍÁ½ÉÐ°(€€€€€€€‘¥Í…‰±•I…¹”°(€€€€€€€‘¥Í…‰±•MÑÉ•…´(€€€€€ô¤ì(€€€ô•±Í”¥˜€¡ÕÉ°¤ì(€€€€€½¹ÍÐ9•ÑÝ½É­MÑÉ•…´€ô•Ñ9•ÑÝ½É­MÑÉ•…´¡ÕÉ°¤ì(€€€€€¹•ÑÝ½É­MÑÉ•…´€ô¹•Ü9•ÑÝ½É­MÑÉ•…´¡ì(€€€€€€€ÕÉ°°(€€€€€€€¡ÑÑÁ!•…‘•ÉÌ°(€€€€€€€Ý¥Ñ¡É•‘•¹Ñ¥…±Ì°(€€€€€€€É…¹•¡Õ¹­M¥é”°(€€€€€€€‘¥Í…‰±•I…¹”°(€€€€€€€‘¥Í…‰±•MÑÉ•…´(€€€€€ô¤ì(€€€ô•±Í”ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰•Ñ½Õµ•¹Ð€´•áÁ•Ñ••¥Ñ¡•È‘…Ñ…€°É…¹•€°½ÈÕÉ±€Á…É…µ•Ñ•È¸ˆ¤ì(€€€ô(€€€É•ÑÕÉ¸Ý½É­•É%‘AÉ½µ¥Í”¹Ñ¡•¸¡Ý½É­•É%€ôøì(€€€€€¥˜€¡Ý½É­•È¹‘•ÍÑÉ½å•¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰]½É­•ÈÝ…Ì‘•ÍÑÉ½å•ˆ¤ì(€€€€€ô(€€€€€½¹ÍÐµ•ÍÍ…•!…¹‘±•È€ô¹•Ü5•ÍÍ…•!…¹‘±•È¡‘½%°Ý½É­•É%°Ý½É­•È¹Á½ÉÐ¤ì(€€€€€½¹ÍÐÑÉ…¹ÍÁ½ÉÐ€ô¹•Ü]½É­•ÉQÉ…¹ÍÁ½ÉÐ¡µ•ÍÍ…•!…¹‘±•È°Ñ…Í¬°¹•ÑÝ½É­MÑÉ•…´°ÑÉ…¹ÍÁ½ÉÑA…É…µÌ°ÑÉ…¹ÍÁ½ÉÑ…Ñ½Éä°Á…•Í5…ÁÁ•È¤ì(€€€€€Ñ…Í¬¹}ÑÉ…¹ÍÁ½ÉÐ€ôÑÉ…¹ÍÁ½ÉÐì(€€€€€¥˜€¡Ñ…Í¬¹‘•ÍÑÉ½å•¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰1½…‘¥¹œ…‰½ÉÑ•ˆ¤ì(€€€€€ô(€€€€€µ•ÍÍ…•!…¹‘±•È¹Í•¹ ‰I•…‘äˆ°¹Õ±°¤ì(€€€ô¤ì(€ô¤¹…Ñ ¡Ñ…Í¬¹}…Á…‰¥±¥Ñä¹É•©•Ð¤¹™¥¹…±±ä¡Ñ…Í¬¹}Í•ÑÕÁ…Á…‰¥±¥Ñä¹É•Í½±Ù”¤ì(€É•ÑÕÉ¸Ñ…Í¬ì)ô)±…ÍÌA½Õµ•¹Ñ1½…‘¥¹Q…Í¬ì(€ÍÑ…Ñ¥Œ€‘½%€ô€Àì(€}…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€}Í•ÑÕÁ…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€}ÑÉ…¹ÍÁ½ÉÐ€ô¹Õ±°ì(€}Ý½É­•È€ô¹Õ±°ì(€‘½%€ô‘íA½Õµ•¹Ñ1½…‘¥¹Q…Í¬¸‘½%¬­õ€ì(€‘•ÍÑÉ½å•€ô™…±Í”ì(€½¹A…ÍÍÝ½É€ô¹Õ±°ì(€½¹AÉ½É•ÍÌ€ô¹Õ±°ì(€•ÐÁÉ½µ¥Í” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€ô(€…Íå¹Œ‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å•€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹}…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”¹…Ñ   ¤€ôøíô¤ì(€€€ÑÉäì(€€€€€¥˜€¡Ñ¡¥Ì¹}Ý½É­•Èü¹Á½ÉÐ¤ì(€€€€€€€Ñ¡¥Ì¹}Ý½É­•È¹}Á•¹‘¥¹•ÍÑÉ½ä€ôÑÉÕ”ì(€€€€€ô(€€€€€…Ý…¥ÐÑ¡¥Ì¹}Í•ÑÕÁ…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€€€€€…Ý…¥ÐÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐü¹‘•ÍÑÉ½ä ¤ì(€€€ô…Ñ €¡•à¤ì(€€€€€¥˜€¡Ñ¡¥Ì¹}Ý½É­•Èü¹Á½ÉÐ¤ì(€€€€€€€‘•±•Ñ”Ñ¡¥Ì¹}Ý½É­•È¹}Á•¹‘¥¹•ÍÑÉ½äì(€€€€€ô(€€€€€Ñ¡É½Ü•àì(€€€ô(€€€Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ€ô¹Õ±°ì(€€€Ñ¡¥Ì¹}Ý½É­•Èü¹‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¹}Ý½É­•È€ô¹Õ±°ì(€ô(€…Íå¹Œ•Ñ…Ñ„ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ…Ñ„ ¤ì(€ô)ô)±…ÍÌA…Ñ…I…¹•QÉ…¹ÍÁ½ÉÐì(€€…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€€±¥ÍÑ•¹•È€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡±•¹Ñ °¥¹¥Ñ¥…±…Ñ„°ÁÉ½É•ÍÍ¥Ù•½¹”€ô™…±Í”°½¹Ñ•¹Ñ¥ÍÁ½Í¥Ñ¥½¹¥±•¹…µ”€ô¹Õ±°¤ì(€€€Ñ¡¥Ì¹±•¹Ñ €ô±•¹Ñ ì(€€€Ñ¡¥Ì¹¥¹¥Ñ¥…±…Ñ„€ô¥¹¥Ñ¥…±…Ñ„ì(€€€Ñ¡¥Ì¹ÁÉ½É•ÍÍ¥Ù•½¹”€ôÁÉ½É•ÍÍ¥Ù•½¹”ì(€€€Ñ¡¥Ì¹½¹Ñ•¹Ñ¥ÍÁ½Í¥Ñ¥½¹¥±•¹…µ”€ô½¹Ñ•¹Ñ¥ÍÁ½Í¥Ñ¥½¹¥±•¹…µ”ì(€ô(€½¹…Ñ…I…¹”¡‰•¥¸°¡Õ¹¬¤ì(€€€Ñ¡¥Ì¸±¥ÍÑ•¹•È¡ì(€€€€€ÑåÁ”è€‰É…¹”ˆ°(€€€€€‰•¥¸°(€€€€€¡Õ¹¬(€€€ô¤ì(€ô(€½¹…Ñ…AÉ½É•ÍÍ¥Ù•I•…¡¡Õ¹¬¤ì(€€€Ñ¡¥Ì¸…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”¹Ñ¡•¸  ¤€ôøì(€€€€€Ñ¡¥Ì¸±¥ÍÑ•¹•È¡ì(€€€€€€€ÑåÁ”è€‰ÁÉ½É•ÍÍ¥Ù•I•…ˆ°(€€€€€€€¡Õ¹¬(€€€€€ô¤ì(€€€ô¤ì(€ô(€½¹…Ñ…AÉ½É•ÍÍ¥Ù•½¹” ¤ì(€€€Ñ¡¥Ì¸…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”¹Ñ¡•¸  ¤€ôøì(€€€€€Ñ¡¥Ì¸±¥ÍÑ•¹•È¡ì(€€€€€€€ÑåÁ”è€‰ÁÉ½É•ÍÍ¥Ù•½¹”ˆ(€€€€€ô¤ì(€€€ô¤ì(€ô(€ÑÉ…¹ÍÁ½ÉÑI•…‘ä¡±¥ÍÑ•¹•È¤ì(€€€Ñ¡¥Ì¸±¥ÍÑ•¹•È€ô±¥ÍÑ•¹•Èì(€€€Ñ¡¥Ì¸…Á…‰¥±¥Ñä¹É•Í½±Ù” ¤ì(€ô(€É•ÅÕ•ÍÑ…Ñ…I…¹”¡‰•¥¸°•¹¤ì(€€€Õ¹É•…¡…‰±” ‰‰ÍÑÉ…Ðµ•Ñ¡½A…Ñ…I…¹•QÉ…¹ÍÁ½ÉÐ¹É•ÅÕ•ÍÑ…Ñ…I…¹”ˆ¤ì(€ô(€…‰½ÉÐ ¤íô)ô)±…ÍÌA½Õµ•¹ÑAÉ½áäì(€½¹ÍÑÉÕÑ½È¡Á‘™%¹™¼°ÑÉ…¹ÍÁ½ÉÐ¤ì(€€€Ñ¡¥Ì¹}Á‘™%¹™¼€ôÁ‘™%¹™¼ì(€€€Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ€ôÑÉ…¹ÍÁ½ÉÐì(€ô(€•ÐÁ…•Í5…ÁÁ•È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹Á…•Í5…ÁÁ•Èì(€ô(€•Ð…¹¹½Ñ…Ñ¥½¹MÑ½É…” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€ô(€•Ð…¹Ù…Í…Ñ½Éä ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹…¹Ù…Í…Ñ½Éäì(€ô(€•Ð™¥±Ñ•É…Ñ½Éä ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹™¥±Ñ•É…Ñ½Éäì(€ô(€•Ð¹ÕµA…•Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}Á‘™%¹™¼¹¹ÕµA…•Ìì(€ô(€•Ð™¥¹•ÉÁÉ¥¹ÑÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}Á‘™%¹™¼¹™¥¹•ÉÁÉ¥¹ÑÌì(€ô(€•Ð¥ÍAÕÉ•a™„ ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰¥ÍAÕÉ•a™„ˆ°€„…Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹}¡Ñµ±½Éa™„¤ì(€ô(€•Ð…±±a™…!Ñµ° ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹}¡Ñµ±½Éa™„ì(€ô(€•ÑA…”¡Á…•9Õµ‰•È¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑA…”¡Á…•9Õµ‰•È¤ì(€ô(€•ÑA…•%¹‘•à¡É•˜¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑA…•%¹‘•à¡É•˜¤ì(€ô(€•Ñ•ÍÑ¥¹…Ñ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ•ÍÑ¥¹…Ñ¥½¹Ì ¤ì(€ô(€•Ñ•ÍÑ¥¹…Ñ¥½¸¡¥¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ•ÍÑ¥¹…Ñ¥½¸¡¥¤ì(€ô(€•ÑA…•1…‰•±Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑA…•1…‰•±Ì ¤ì(€ô(€•ÑA…•1…å½ÕÐ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑA…•1…å½ÕÐ ¤ì(€ô(€•ÑA…•5½‘” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑA…•5½‘” ¤ì(€ô(€•ÑY¥•Ý•ÉAÉ•™•É•¹•Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑY¥•Ý•ÉAÉ•™•É•¹•Ì ¤ì(€ô(€•Ñ=Á•¹Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ=Á•¹Ñ¥½¸ ¤ì(€ô(€•ÑÑÑ…¡µ•¹ÑÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑÑÑ…¡µ•¹ÑÌ ¤ì(€ô(€•ÑÑÑ…¡µ•¹Ñ½¹Ñ•¹Ð¡¥¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑÑÑ…¡µ•¹Ñ½¹Ñ•¹Ð¡¥¤ì(€ô(€•Ñ¹¹½Ñ…Ñ¥½¹Í	åQåÁ”¡ÑåÁ•Ì°Á…•%¹‘•á•ÍQ½M­¥À¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ¹¹½Ñ…Ñ¥½¹Í	åQåÁ”¡ÑåÁ•Ì°Á…•%¹‘•á•ÍQ½M­¥À¤ì(€ô(€•Ñ)MÑ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ½)MÑ¥½¹Ì ¤ì(€ô(€•Ñ=ÕÑ±¥¹” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ=ÕÑ±¥¹” ¤ì(€ô(€•Ñ=ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¡ì(€€€¥¹Ñ•¹Ð€ô€‰‘¥ÍÁ±…äˆ(€ô€ôíô¤ì(€€€½¹ÍÐì(€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð(€€€ô€ôÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑI•¹‘•É¥¹%¹Ñ•¹Ð¡¥¹Ñ•¹Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ=ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¡É•¹‘•É¥¹%¹Ñ•¹Ð¤ì(€ô(€•ÑA•Éµ¥ÍÍ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑA•Éµ¥ÍÍ¥½¹Ì ¤ì(€ô(€•Ñ5•Ñ…‘…Ñ„ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ5•Ñ…‘…Ñ„ ¤ì(€ô(€•Ñ5…É­%¹™¼ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ5…É­%¹™¼ ¤ì(€ô(€•Ñ…Ñ„ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ…Ñ„ ¤ì(€ô(€Í…Ù•½Õµ•¹Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹Í…Ù•½Õµ•¹Ð ¤ì(€ô(€•áÑÉ…ÑA…•Ì¡Á…•%¹™½Ì°½Áå1•Ù•±Ì€ô¹Õ±°¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•áÑÉ…ÑA…•Ì¡Á…•%¹™½Ì°½Áå1•Ù•±Ì¤ì(€ô(€•Ñ½Ý¹±½…‘%¹™¼ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹‘½Ý¹±½…‘%¹™½…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€ô(€±•…¹ÕÀ¡­••Á1½…‘•‘½¹ÑÌ€ô™…±Í”¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹ÍÑ…ÉÑ±•…¹ÕÀ¡­••Á1½…‘•‘½¹ÑÌñðÑ¡¥Ì¹¥ÍAÕÉ•a™„¤ì(€ô(€…¡•‘A…•9Õµ‰•È¡É•˜¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹…¡•‘A…•9Õµ‰•È¡É•˜¤ì(€ô(€•Ð±½…‘¥¹A…É…µÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹±½…‘¥¹A…É…µÌì(€ô(€•Ð±½…‘¥¹Q…Í¬ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹±½…‘¥¹Q…Í¬ì(€ô(€•Ñ¥•±‘=‰©•ÑÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ¥•±‘=‰©•ÑÌ ¤ì(€ô(€•ÑM¥¹…ÑÕÉ•Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑM¥¹…ÑÕÉ•Ì ¤ì(€ô(€•ÑM¥¹…ÑÕÉ•…Ñ„¡¥¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑM¥¹…ÑÕÉ•…Ñ„¡¥¤ì(€ô(€¡…Í)MÑ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹¡…Í)MÑ¥½¹Ì ¤ì(€ô(€•Ñ…±Õ±…Ñ¥½¹=É‘•É%‘Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ…±Õ±…Ñ¥½¹=É‘•É%‘Ì ¤ì(€ô)ô)±…ÍÌAA…•AÉ½áäì(€€Á•¹‘¥¹±•…¹ÕÀ€ô™…±Í”ì(€€Á…•Í5…ÁÁ•È€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…•%¹‘•à°Á…•%¹™¼°ÑÉ…¹ÍÁ½ÉÐ°Á…•Í5…ÁÁ•È°Á‘™	Õœ€ô™…±Í”¤ì(€€€Ñ¡¥Ì¹}Á…•%¹‘•à€ôÁ…•%¹‘•àì(€€€Ñ¡¥Ì¹}Á…•%¹™¼€ôÁ…•%¹™¼ì(€€€Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ€ôÑÉ…¹ÍÁ½ÉÐì(€€€Ñ¡¥Ì¹}ÍÑ…ÑÌ€ôÁ‘™	Õœ€ü¹•ÜMÑ…ÑQ¥µ•È ¤€è¹Õ±°ì(€€€Ñ¡¥Ì¹}Á‘™	Õœ€ôÁ‘™	Õœì(€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì€ôÑÉ…¹ÍÁ½ÉÐ¹½µµ½¹=‰©Ìì(€€€Ñ¡¥Ì¹½‰©Ì€ô¹•ÜA=‰©•ÑÌ ¤ì(€€€Ñ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì€ô¹•Ü5…À ¤ì(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å•€ô™…±Í”ì(€€€Ñ¡¥Ì¹É•½É‘•‘		½á•Ì€ô¹Õ±°ì(€€€Ñ¡¥Ì¸Á…•Í5…ÁÁ•È€ôÁ…•Í5…ÁÁ•Èì(€€€Ñ¡¥Ì¹¥µ…•½½É‘¥¹…Ñ•Ì€ô¹Õ±°ì(€ô(€±½¹”¡¥¤ì(€€€½¹ÍÐ±½¹”€ô¹•ÜAA…•AÉ½áä¡¥°Ñ¡¥Ì¹}Á…•%¹™¼°Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ°Ñ¡¥Ì¸Á…•Í5…ÁÁ•È°Ñ¡¥Ì¹}Á‘™	Õœ¤ì(€€€±½¹”¹±½¹•‘É½µ%¹‘•à€ôÑ¡¥Ì¹±½¹•‘É½µ%¹‘•à€üüÑ¡¥Ì¹}Á…•%¹‘•àì(€€€Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹ÕÁ‘…Ñ•A…”¡±½¹”¤ì(€€€É•ÑÕÉ¸±½¹”ì(€ô(€•ÐÁ…•9Õµ‰•È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}Á…•%¹‘•à€¬€Äì(€ô(€Í•ÐÁ…•9Õµ‰•È¡Ù…±Õ”¤ì(€€€Ñ¡¥Ì¹}Á…•%¹‘•à€ôÙ…±Õ”€´€Äì(€€€Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹ÕÁ‘…Ñ•A…”¡Ñ¡¥Ì¤ì(€ô(€•ÐÉ½Ñ…Ñ” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}Á…•%¹™¼¹É½Ñ…Ñ”ì(€ô(€•ÐÉ•˜ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}Á…•%¹™¼¹É•˜ì(€ô(€•ÐÕÍ•ÉU¹¥Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}Á…•%¹™¼¹ÕÍ•ÉU¹¥Ðì(€ô(€•ÐÙ¥•Ü ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}Á…•%¹™¼¹Ù¥•Üì(€ô(€•ÑY¥•ÝÁ½ÉÐ¡ì(€€€Í…±”°(€€€É½Ñ…Ñ¥½¸€ôÑ¡¥Ì¹É½Ñ…Ñ”°(€€€½™™Í•Ñ`€ô€À°(€€€½™™Í•Ñd€ô€À°(€€€‘½¹Ñ±¥À€ô™…±Í”(€ô€ôíô¤ì(€€€É•ÑÕÉ¸¹•ÜA…•Y¥•ÝÁ½ÉÐ¡ì(€€€€€Ù¥•Ý	½àèÑ¡¥Ì¹Ù¥•Ü°(€€€€€ÕÍ•ÉU¹¥ÐèÑ¡¥Ì¹ÕÍ•ÉU¹¥Ð°(€€€€€Í…±”°(€€€€€É½Ñ…Ñ¥½¸°(€€€€€½™™Í•Ñ`°(€€€€€½™™Í•Ñd°(€€€€€‘½¹Ñ±¥À(€€€ô¤ì(€ô(€•Ñ¹¹½Ñ…Ñ¥½¹Ì¡ì(€€€¥¹Ñ•¹Ð€ô€‰‘¥ÍÁ±…äˆ(€ô€ôíô¤ì(€€€½¹ÍÐì(€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð(€€€ô€ôÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑI•¹‘•É¥¹%¹Ñ•¹Ð¡¥¹Ñ•¹Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ¹¹½Ñ…Ñ¥½¹Ì¡Ñ¡¥Ì¹}Á…•%¹‘•à°É•¹‘•É¥¹%¹Ñ•¹Ð¤ì(€ô(€•Ñ)MÑ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑA…•)MÑ¥½¹Ì¡Ñ¡¥Ì¹}Á…•%¹‘•à¤ì(€ô(€•Ð™¥±Ñ•É…Ñ½Éä ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹™¥±Ñ•É…Ñ½Éäì(€ô(€•Ð¥ÍAÕÉ•a™„ ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰¥ÍAÕÉ•a™„ˆ°€„…Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹}¡Ñµ±½Éa™„¤ì(€ô(€…Íå¹Œ•Ña™„ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹}¡Ñµ±½Éa™„ü¹¡¥±‘É•¹mÑ¡¥Ì¹}Á…•%¹‘•átñð¹Õ±°ì(€ô(€É•¹‘•È¡ì(€€€…¹Ù…Í½¹Ñ•áÐ°(€€€…¹Ù…Ì€ô…¹Ù…Í½¹Ñ•áÐ¹…¹Ù…Ì°(€€€Ù¥•ÝÁ½ÉÐ°(€€€¥¹Ñ•¹Ð€ô€‰‘¥ÍÁ±…äˆ°(€€€…¹¹½Ñ…Ñ¥½¹5½‘”€ô¹¹½Ñ…Ñ¥½¹5½‘”¹9	1°(€€€ÑÉ…¹Í™½É´€ô¹Õ±°°(€€€‰…­É½Õ¹€ô¹Õ±°°(€€€½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥AÉ½µ¥Í”€ô¹Õ±°°(€€€…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À€ô¹Õ±°°(€€€Á…•½±½ÉÌ€ô¹Õ±°°(€€€ÁÉ¥¹Ñ¹¹½Ñ…Ñ¥½¹MÑ½É…”€ô¹Õ±°°(€€€¥Í‘¥Ñ¥¹œ€ô™…±Í”°(€€€É•½É‘%µ…•Ì€ô™…±Í”°(€€€É•½É‘=Á•É…Ñ¥½¹Ì€ô™…±Í”°(€€€½Á•É…Ñ¥½¹Í¥±Ñ•È€ô¹Õ±°(€ô¤ì(€€€Ñ¡¥Ì¹}ÍÑ…ÑÌü¹Ñ¥µ” ‰=Ù•É…±°ˆ¤ì(€€€½¹ÍÐ¥¹Ñ•¹ÑÉÌ€ôÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑI•¹‘•É¥¹%¹Ñ•¹Ð¡¥¹Ñ•¹Ð°…¹¹½Ñ…Ñ¥½¹5½‘”°ÁÉ¥¹Ñ¹¹½Ñ…Ñ¥½¹MÑ½É…”°¥Í‘¥Ñ¥¹œ¤ì(€€€½¹ÍÐì(€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð°(€€€€€…¡•-•ä(€€€ô€ô¥¹Ñ•¹ÑÉÌì(€€€Ñ¡¥Ì¸Á•¹‘¥¹±•…¹ÕÀ€ô™…±Í”ì(€€€½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥AÉ½µ¥Í”ñðôÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•Ñ=ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¡É•¹‘•É¥¹%¹Ñ•¹Ð¤ì(€€€½¹ÍÐ¥¹Ñ•¹ÑMÑ…Ñ”€ôÑ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹•Ñ=É%¹Í•ÉÑ½µÁÕÑ•¡…¡•-•ä°µ…­•=‰¨¤ì(€€€¥˜€¡¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•É…¹•±Q¥µ•½ÕÐ¤ì(€€€€€±•…ÉQ¥µ•½ÕÐ¡¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•É…¹•±Q¥µ•½ÕÐ¤ì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•É…¹•±Q¥µ•½ÕÐ€ô¹Õ±°ì(€€€ô(€€€½¹ÍÐ¥¹Ñ•¹ÑAÉ¥¹Ð€ô€„„¡É•¹‘•É¥¹%¹Ñ•¹Ð€˜I•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹AI%9P¤ì(€€€¥˜€ …¥¹Ñ•¹ÑMÑ…Ñ”¹‘¥ÍÁ±…åI•…‘å…Á…‰¥±¥Ñä¤ì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹‘¥ÍÁ±…åI•…‘å…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ€ôì(€€€€€€€™¹ÉÉ…äèmt°(€€€€€€€…ÉÍÉÉ…äèmt°(€€€€€€€±…ÍÑ¡Õ¹¬è™…±Í”°(€€€€€€€Í•Á…É…Ñ•¹¹½ÑÌè¹Õ±°(€€€€€ôì(€€€€€Ñ¡¥Ì¹}ÍÑ…ÑÌü¹Ñ¥µ” ‰A…”I•ÅÕ•ÍÐˆ¤ì(€€€€€Ñ¡¥Ì¹}ÁÕµÁ=Á•É…Ñ½É1¥ÍÐ¡¥¹Ñ•¹ÑÉÌ¤ì(€€€ô(€€€½¹ÍÐÉ•½É‘½É•‰Õ•È€ô€„„¡Ñ¡¥Ì¹}Á‘™	Õœ€˜˜±½‰…±Q¡¥Ì¹MÑ•ÁÁ•É5…¹…•Èü¹•¹…‰±•¤ì(€€€½¹ÍÐÍ¡½Õ±‘I•½É‘=Á•É…Ñ¥½¹Ì€ô€„……¹Ù…Ì€˜˜€…Ñ¡¥Ì¹É•½É‘•‘		½á•Ì€˜˜€¡É•½É‘=Á•É…Ñ¥½¹ÌñðÉ•½É‘½É•‰Õ•È¤ì(€€€½¹ÍÐÍ¡½Õ±‘I•½É‘%µ…•Ì€ô€„……¹Ù…Ì€˜˜€…Ñ¡¥Ì¹¥µ…•½½É‘¥¹…Ñ•Ì€˜˜É•½É‘%µ…•Ìì(€€€½¹ÍÐ½µÁ±•Ñ”€ô•ÉÉ½È€ôøì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹É•¹‘•ÉQ…Í­Ì¹‘•±•Ñ”¡¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¤ì(€€€€€¥˜€¡Í¡½Õ±‘I•½É‘=Á•É…Ñ¥½¹Ì¤ì(€€€€€€€½¹ÍÐÉ•½É‘•‘		½á•Ì€ô¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹™àü¹‘•Á•¹‘•¹åQÉ…­•È¹Ñ…­” ¤ì(€€€€€€€¥˜€¡É•½É‘•‘		½á•Ì¤ì(€€€€€€€€€¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹ÍÑ•ÁÁ•Èü¹Í•Ñ=Á•É…Ñ½É		½á•Ì¡É•½É‘•‘		½á•Ì°¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹™à¹‘•Á•¹‘•¹åQÉ…­•È¹Ñ…­••‰Õ5•Ñ…‘…Ñ„ ¤¤ì(€€€€€€€€€¥˜€¡É•½É‘=Á•É…Ñ¥½¹Ì¤ì(€€€€€€€€€€€Ñ¡¥Ì¹É•½É‘•‘		½á•Ì€ôÉ•½É‘•‘		½á•Ìì(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô(€€€€€¥˜€¡Í¡½Õ±‘I•½É‘%µ…•Ì€˜˜€…•ÉÉ½È¤ì(€€€€€€€Ñ¡¥Ì¹¥µ…•½½É‘¥¹…Ñ•Ì€ô¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹™àü¹¥µ…•ÍQÉ…­•È¹Ñ…­” ¤ì(€€€€€ô(€€€€€¥˜€¡¥¹Ñ•¹ÑAÉ¥¹Ð¤ì(€€€€€€€Ñ¡¥Ì¸Á•¹‘¥¹±•…¹ÕÀ€ôÑÉÕ”ì(€€€€€ô(€€€€€Ñ¡¥Ì¸ÑÉå±•…¹ÕÀ ¤ì(€€€€€¥˜€¡•ÉÉ½È¤ì(€€€€€€€¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹…Á…‰¥±¥Ñä¹É•©•Ð¡•ÉÉ½È¤ì(€€€€€€€Ñ¡¥Ì¹}…‰½ÉÑ=Á•É…Ñ½É1¥ÍÐ¡ì(€€€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”°(€€€€€€€€€É•…Í½¸è•ÉÉ½È¥¹ÍÑ…¹•½˜ÉÉ½È€ü•ÉÉ½È€è¹•ÜÉÉ½È¡•ÉÉ½È¤(€€€€€€€ô¤ì(€€€€€ô•±Í”ì(€€€€€€€¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹…Á…‰¥±¥Ñä¹É•Í½±Ù” ¤ì(€€€€€ô(€€€€€¥˜€¡Ñ¡¥Ì¹}ÍÑ…ÑÌ¤ì(€€€€€€€Ñ¡¥Ì¹}ÍÑ…ÑÌ¹Ñ¥µ•¹ ‰I•¹‘•É¥¹œˆ¤ì(€€€€€€€Ñ¡¥Ì¹}ÍÑ…ÑÌ¹Ñ¥µ•¹ ‰=Ù•É…±°ˆ¤ì(€€€€€€€¥˜€¡±½‰…±Q¡¥Ì¹MÑ…ÑÌü¹•¹…‰±•¤ì(€€€€€€€€€±½‰…±Q¡¥Ì¹MÑ…ÑÌ¹…‘¡Ñ¡¥Ì¹Á…•9Õµ‰•È°Ñ¡¥Ì¹}ÍÑ…ÑÌ¤ì(€€€€€€€ô(€€€€€ô(€€€ôì(€€€±•Ð‘•Á•¹‘•¹åQÉ…­•È€ô¹Õ±°ì(€€€±•Ð‰‰½áQÉ…­•È€ô¹Õ±°ì(€€€¥˜€¡Í¡½Õ±‘I•½É‘=Á•É…Ñ¥½¹ÌñðÍ¡½Õ±‘I•½É‘%µ…•Ì¤ì(€€€€€‰‰½áQÉ…­•È€ô¹•Ü…¹Ù…Í		½áQÉ…­•È¡…¹Ù…Ì°¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¹±•¹Ñ ¤ì(€€€ô(€€€¥˜€¡Í¡½Õ±‘I•½É‘=Á•É…Ñ¥½¹Ì¤ì(€€€€€‘•Á•¹‘•¹åQÉ…­•È€ô¹•Ü…¹Ù…Í•Á•¹‘•¹åQÉ…­•È¡‰‰½áQÉ…­•È°É•½É‘½É•‰Õ•È¤ì(€€€ô(€€€½¹ÍÐ¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬€ô¹•Ü%¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¡ì(€€€€€…±±‰…¬è½µÁ±•Ñ”°(€€€€€Á…É…µÌèì(€€€€€€€…¹Ù…Ì°(€€€€€€€…¹Ù…Í½¹Ñ•áÐ°(€€€€€€€‘•Á•¹‘•¹åQÉ…­•Èè‘•Á•¹‘•¹åQÉ…­•È€üü‰‰½áQÉ…­•È°(€€€€€€€¥µ…•ÍQÉ…­•ÈèÍ¡½Õ±‘I•½É‘%µ…•Ì€ü¹•Ü…¹Ù…Í%µ…•ÍQÉ…­•È¡…¹Ù…Ì¤€è¹Õ±°°(€€€€€€€Ù¥•ÝÁ½ÉÐ°(€€€€€€€ÑÉ…¹Í™½É´°(€€€€€€€‰…­É½Õ¹(€€€€€ô°(€€€€€½‰©ÌèÑ¡¥Ì¹½‰©Ì°(€€€€€½µµ½¹=‰©ÌèÑ¡¥Ì¹½µµ½¹=‰©Ì°(€€€€€…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À°(€€€€€½Á•É…Ñ½É1¥ÍÐè¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ°(€€€€€Á…•%¹‘•àèÑ¡¥Ì¹}Á…•%¹‘•à°(€€€€€…¹Ù…Í…Ñ½ÉäèÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹…¹Ù…Í…Ñ½Éä°(€€€€€™¥±Ñ•É…Ñ½ÉäèÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹™¥±Ñ•É…Ñ½Éä°(€€€€€ÕÍ•I•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”è€…¥¹Ñ•¹ÑAÉ¥¹Ð°(€€€€€Á‘™	ÕœèÑ¡¥Ì¹}Á‘™	Õœ°(€€€€€Á…•½±½ÉÌ°(€€€€€•¹…‰±•!]èÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•¹…‰±•!]°(€€€€€½Á•É…Ñ¥½¹Í¥±Ñ•È(€€€ô¤ì(€€€€¡¥¹Ñ•¹ÑMÑ…Ñ”¹É•¹‘•ÉQ…Í­Ìñðô¹•ÜM•Ð ¤¤¹…‘¡¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¤ì(€€€½¹ÍÐÉ•¹‘•ÉQ…Í¬€ô¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹Ñ…Í¬ì(€€€AÉ½µ¥Í”¹…±°¡m¥¹Ñ•¹ÑMÑ…Ñ”¹‘¥ÍÁ±…åI•…‘å…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”°½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥AÉ½µ¥Í•t¤¹Ñ¡•¸ ¡mÑÉ…¹ÍÁ…É•¹ä°½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥t¤€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€½µÁ±•Ñ” ¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€Ñ¡¥Ì¹}ÍÑ…ÑÌü¹Ñ¥µ” ‰I•¹‘•É¥¹œˆ¤ì(€€€€€¥˜€ „¡½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¹É•¹‘•É¥¹%¹Ñ•¹Ð€˜É•¹‘•É¥¹%¹Ñ•¹Ð¤¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰5ÕÍÐÕÍ”Ñ¡”Í…µ”¥¹Ñ•¹Ñ€µ…ÉÕµ•¹ÐÝ¡•¸…±±¥¹œÑ¡”AA…•AÉ½áä¹É•¹‘•É€€ˆ€¬€‰…¹A½Õµ•¹ÑAÉ½áä¹•Ñ=ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥€µ•Ñ¡½‘Ì¸ˆ¤ì(€€€€€ô(€€€€€¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹¥¹¥Ñ¥…±¥é•É…Á¡¥Ì¡ì(€€€€€€€ÑÉ…¹ÍÁ…É•¹ä°(€€€€€€€½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ(€€€€€ô¤ì(€€€€€¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹½Á•É…Ñ½É1¥ÍÑ¡…¹• ¤ì(€€€ô¤¹…Ñ ¡½µÁ±•Ñ”¤ì(€€€É•ÑÕÉ¸É•¹‘•ÉQ…Í¬ì(€ô(€•Ñ=Á•É…Ñ½É1¥ÍÐ¡ì(€€€¥¹Ñ•¹Ð€ô€‰‘¥ÍÁ±…äˆ°(€€€…¹¹½Ñ…Ñ¥½¹5½‘”€ô¹¹½Ñ…Ñ¥½¹5½‘”¹9	1°(€€€ÁÉ¥¹Ñ¹¹½Ñ…Ñ¥½¹MÑ½É…”€ô¹Õ±°°(€€€¥Í‘¥Ñ¥¹œ€ô™…±Í”(€ô€ôíô¤ì(€€€™Õ¹Ñ¥½¸½Á•É…Ñ½É1¥ÍÑ¡…¹• ¤ì(€€€€€¥˜€¡¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¹±…ÍÑ¡Õ¹¬¤ì(€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á1¥ÍÑI•…‘…Á…‰¥±¥Ñä¹É•Í½±Ù”¡¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¤ì(€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹É•¹‘•ÉQ…Í­Ì¹‘•±•Ñ”¡½Á1¥ÍÑQ…Í¬¤ì(€€€€€ô(€€€ô(€€€½¹ÍÐ¥¹Ñ•¹ÑÉÌ€ôÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑI•¹‘•É¥¹%¹Ñ•¹Ð¡¥¹Ñ•¹Ð°…¹¹½Ñ…Ñ¥½¹5½‘”°ÁÉ¥¹Ñ¹¹½Ñ…Ñ¥½¹MÑ½É…”°¥Í‘¥Ñ¥¹œ°ÑÉÕ”¤ì(€€€½¹ÍÐ¥¹Ñ•¹ÑMÑ…Ñ”€ôÑ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹•Ñ=É%¹Í•ÉÑ½µÁÕÑ•¡¥¹Ñ•¹ÑÉÌ¹…¡•-•ä°µ…­•=‰¨¤ì(€€€±•Ð½Á1¥ÍÑQ…Í¬ì(€€€¥˜€ …¥¹Ñ•¹ÑMÑ…Ñ”¹½Á1¥ÍÑI•…‘…Á…‰¥±¥Ñä¤ì(€€€€€½Á1¥ÍÑQ…Í¬€ô=‰©•Ð¹É•…Ñ”¡¹Õ±°¤ì(€€€€€½Á1¥ÍÑQ…Í¬¹½Á•É…Ñ½É1¥ÍÑ¡…¹•€ô½Á•É…Ñ½É1¥ÍÑ¡…¹•ì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á1¥ÍÑI•…‘…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€€€€€€¡¥¹Ñ•¹ÑMÑ…Ñ”¹É•¹‘•ÉQ…Í­Ìñðô¹•ÜM•Ð ¤¤¹…‘¡½Á1¥ÍÑQ…Í¬¤ì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ€ôì(€€€€€€€™¹ÉÉ…äèmt°(€€€€€€€…ÉÍÉÉ…äèmt°(€€€€€€€±…ÍÑ¡Õ¹¬è™…±Í”°(€€€€€€€Í•Á…É…Ñ•¹¹½ÑÌè¹Õ±°(€€€€€ôì(€€€€€Ñ¡¥Ì¹}ÍÑ…ÑÌü¹Ñ¥µ” ‰A…”I•ÅÕ•ÍÐˆ¤ì(€€€€€Ñ¡¥Ì¹}ÁÕµÁ=Á•É…Ñ½É1¥ÍÐ¡¥¹Ñ•¹ÑÉÌ¤ì(€€€ô(€€€É•ÑÕÉ¸¥¹Ñ•¹ÑMÑ…Ñ”¹½Á1¥ÍÑI•…‘…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€ô(€ÍÑÉ•…µQ•áÑ½¹Ñ•¹Ð¡ì(€€€¥¹±Õ‘•5…É­•‘½¹Ñ•¹Ð€ô™…±Í”°(€€€‘¥Í…‰±•9½Éµ…±¥é…Ñ¥½¸€ô™…±Í”(€ô€ôíô¤ì(€€€½¹ÍÐQaQ}=9Q9Q}!U9-}M%i€ô€ÄÀÀì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡MÑÉ•…´ ‰•ÑQ•áÑ½¹Ñ•¹Ðˆ°ì(€€€€€Á…•%èÑ¡¥Ì¸Á…•Í5…ÁÁ•È¹•ÑA…•%¡Ñ¡¥Ì¹}Á…•%¹‘•à€¬€Ä¤€´€Ä°(€€€€€Á…•%¹‘•àèÑ¡¥Ì¹}Á…•%¹‘•à°(€€€€€¥¹±Õ‘•5…É­•‘½¹Ñ•¹Ðè¥¹±Õ‘•5…É­•‘½¹Ñ•¹Ð€ôôôÑÉÕ”°(€€€€€‘¥Í…‰±•9½Éµ…±¥é…Ñ¥½¸è‘¥Í…‰±•9½Éµ…±¥é…Ñ¥½¸€ôôôÑÉÕ”(€€€ô°ì(€€€€€¡¥¡]…Ñ•É5…É¬èQaQ}=9Q9Q}!U9-}M%i°(€€€€€Í¥é”¡Ñ•áÑ½¹Ñ•¹Ð¤ì(€€€€€€€É•ÑÕÉ¸Ñ•áÑ½¹Ñ•¹Ð¹¥Ñ•µÌ¹±•¹Ñ ì(€€€€€ô(€€€ô¤ì(€ô(€…Íå¹Œ•ÑQ•áÑ½¹Ñ•¹Ð¡Á…É…µÌ€ôíô¤ì(€€€¥˜€¡Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹}¡Ñµ±½Éa™„¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹•Ña™„ ¤¹Ñ¡•¸¡á™„€ôøa™…Q•áÐ¹Ñ•áÑ½¹Ñ•¹Ð¡á™„¤¤ì(€€€ô(€€€½¹ÍÐÉ•…‘…‰±•MÑÉ•…´€ôÑ¡¥Ì¹ÍÑÉ•…µQ•áÑ½¹Ñ•¹Ð¡Á…É…µÌ¤ì(€€€½¹ÍÐÑ•áÑ½¹Ñ•¹Ð€ôì(€€€€€¥Ñ•µÌèmt°(€€€€€ÍÑå±•Ìè=‰©•Ð¹É•…Ñ”¡¹Õ±°¤°(€€€€€±…¹œè¹Õ±°(€€€ôì(€€€™½È…Ý…¥Ð€¡½¹ÍÐÙ…±Õ”½˜É•…‘…‰±•MÑÉ•…´¤ì(€€€€€Ñ•áÑ½¹Ñ•¹Ð¹±…¹œ€üüôÙ…±Õ”¹±…¹œì(€€€€€=‰©•Ð¹…ÍÍ¥¸¡Ñ•áÑ½¹Ñ•¹Ð¹ÍÑå±•Ì°Ù…±Õ”¹ÍÑå±•Ì¤ì(€€€€€Ñ•áÑ½¹Ñ•¹Ð¹¥Ñ•µÌ¹ÁÕÍ  ¸¸¹Ù…±Õ”¹¥Ñ•µÌ¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ•áÑ½¹Ñ•¹Ðì(€ô(€•ÑMÑÉÕÑQÉ•” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹•ÑMÑÉÕÑQÉ•”¡Ñ¡¥Ì¹}Á…•%¹‘•à¤ì(€ô(€}‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å•€ôÑÉÕ”ì(€€€½¹ÍÐÝ…¥Ñ=¸€ômtì(€€€™½È€¡½¹ÍÐ¥¹Ñ•¹ÑMÑ…Ñ”½˜Ñ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹Ù…±Õ•Ì ¤¤ì(€€€€€Ñ¡¥Ì¹}…‰½ÉÑ=Á•É…Ñ½É1¥ÍÐ¡ì(€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”°(€€€€€€€É•…Í½¸è¹•ÜÉÉ½È ‰A…”Ý…Ì‘•ÍÑÉ½å•¸ˆ¤°(€€€€€€€™½É”èÑÉÕ”(€€€€€ô¤ì(€€€€€¥˜€¡¥¹Ñ•¹ÑMÑ…Ñ”¹½Á1¥ÍÑI•…‘…Á…‰¥±¥Ñä¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€™½È€¡½¹ÍÐ¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬½˜¥¹Ñ•¹ÑMÑ…Ñ”¹É•¹‘•ÉQ…Í­Ì¤ì(€€€€€€€Ý…¥Ñ=¸¹ÁÕÍ ¡¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹½µÁ±•Ñ•¤ì(€€€€€€€¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹…¹•° ¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¹½‰©Ì¹±•…È ¤ì(€€€Ñ¡¥Ì¸Á•¹‘¥¹±•…¹ÕÀ€ô™…±Í”ì(€€€É•ÑÕÉ¸AÉ½µ¥Í”¹…±°¡Ý…¥Ñ=¸¤ì(€ô(€±•…¹ÕÀ¡É•Í•ÑMÑ…ÑÌ€ô™…±Í”¤ì(€€€Ñ¡¥Ì¸Á•¹‘¥¹±•…¹ÕÀ€ôÑÉÕ”ì(€€€½¹ÍÐÍÕ•ÍÌ€ôÑ¡¥Ì¸ÑÉå±•…¹ÕÀ ¤ì(€€€¥˜€¡É•Í•ÑMÑ…ÑÌ€˜˜ÍÕ•ÍÌ¤ì(€€€€€Ñ¡¥Ì¹}ÍÑ…ÑÌ€˜˜ô¹•ÜMÑ…ÑQ¥µ•È ¤ì(€€€ô(€€€É•ÑÕÉ¸ÍÕ•ÍÌì(€ô(€€ÑÉå±•…¹ÕÀ ¤ì(€€€¥˜€ …Ñ¡¥Ì¸Á•¹‘¥¹±•…¹ÕÀñðÑ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ô(€€€™½È€¡½¹ÍÐì(€€€€€É•¹‘•ÉQ…Í­Ì°(€€€€€½Á•É…Ñ½É1¥ÍÐ(€€€ô½˜Ñ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹Ù…±Õ•Ì ¤¤ì(€€€€€¥˜€¡É•¹‘•ÉQ…Í­Ì¹Í¥é”€ø€Àñð€…½Á•É…Ñ½É1¥ÍÐ¹±…ÍÑ¡Õ¹¬¤ì(€€€€€€€É•ÑÕÉ¸™…±Í”ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹±•…È ¤ì(€€€Ñ¡¥Ì¹½‰©Ì¹±•…È ¤ì(€€€Ñ¡¥Ì¸Á•¹‘¥¹±•…¹ÕÀ€ô™…±Í”ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€}ÍÑ…ÉÑI•¹‘•ÉA…”¡ÑÉ…¹ÍÁ…É•¹ä°…¡•-•ä¤ì(€€€½¹ÍÐ¥¹Ñ•¹ÑMÑ…Ñ”€ôÑ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹•Ð¡…¡•-•ä¤ì(€€€¥˜€ …¥¹Ñ•¹ÑMÑ…Ñ”¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹}ÍÑ…ÑÌü¹Ñ¥µ•¹ ‰A…”I•ÅÕ•ÍÐˆ¤ì(€€€¥¹Ñ•¹ÑMÑ…Ñ”¹‘¥ÍÁ±…åI•…‘å…Á…‰¥±¥Ñäü¹É•Í½±Ù”¡ÑÉ…¹ÍÁ…É•¹ä¤ì(€ô(€}É•¹‘•ÉA…•¡Õ¹¬¡½Á•É…Ñ½É1¥ÍÑ¡Õ¹¬°¥¹Ñ•¹ÑMÑ…Ñ”¤ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ô½Á•É…Ñ½É1¥ÍÑ¡Õ¹¬¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¹™¹ÉÉ…ä¹ÁÕÍ ¡½Á•É…Ñ½É1¥ÍÑ¡Õ¹¬¹™¹ÉÉ…åm¥t¤ì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¹…ÉÍÉÉ…ä¹ÁÕÍ ¡½Á•É…Ñ½É1¥ÍÑ¡Õ¹¬¹…ÉÍÉÉ…åm¥t¤ì(€€€ô(€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¹±…ÍÑ¡Õ¹¬€ô½Á•É…Ñ½É1¥ÍÑ¡Õ¹¬¹±…ÍÑ¡Õ¹¬ì(€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¹Í•Á…É…Ñ•¹¹½ÑÌ€ô½Á•É…Ñ½É1¥ÍÑ¡Õ¹¬¹Í•Á…É…Ñ•¹¹½ÑÌì(€€€™½È€¡½¹ÍÐ¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬½˜¥¹Ñ•¹ÑMÑ…Ñ”¹É•¹‘•ÉQ…Í­Ì¤ì(€€€€€¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹½Á•É…Ñ½É1¥ÍÑ¡…¹• ¤ì(€€€ô(€€€¥˜€¡½Á•É…Ñ½É1¥ÍÑ¡Õ¹¬¹±…ÍÑ¡Õ¹¬¤ì(€€€€€Ñ¡¥Ì¸ÑÉå±•…¹ÕÀ ¤ì(€€€ô(€ô(€}ÁÕµÁ=Á•É…Ñ½É1¥ÍÐ¡ì(€€€É•¹‘•É¥¹%¹Ñ•¹Ð°(€€€…¡•-•ä°(€€€…¹¹½Ñ…Ñ¥½¹MÑ½É…•M•É¥…±¥é…‰±”°(€€€µ½‘¥™¥•‘%‘Ì(€ô¤ì(€€€½¹ÍÐì(€€€€€µ…À°(€€€€€ÑÉ…¹Í™•È(€€€ô€ô…¹¹½Ñ…Ñ¥½¹MÑ½É…•M•É¥…±¥é…‰±”ì(€€€½¹ÍÐÉ•…‘…‰±•MÑÉ•…´€ôÑ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡MÑÉ•…´ ‰•Ñ=Á•É…Ñ½É1¥ÍÐˆ°ì(€€€€€Á…•%èÑ¡¥Ì¸Á…•Í5…ÁÁ•È¹•ÑA…•%¡Ñ¡¥Ì¹}Á…•%¹‘•à€¬€Ä¤€´€Ä°(€€€€€Á…•%¹‘•àèÑ¡¥Ì¹}Á…•%¹‘•à°(€€€€€¥¹Ñ•¹ÐèÉ•¹‘•É¥¹%¹Ñ•¹Ð°(€€€€€…¡•-•ä°(€€€€€…¹¹½Ñ…Ñ¥½¹MÑ½É…”èµ…À°(€€€€€µ½‘¥™¥•‘%‘Ì(€€€ô°Õ¹‘•™¥¹•°ÑÉ…¹Í™•È¤ì(€€€½¹ÍÐÉ•…‘•È€ôÉ•…‘…‰±•MÑÉ•…´¹•ÑI•…‘•È ¤ì(€€€½¹ÍÐ¥¹Ñ•¹ÑMÑ…Ñ”€ôÑ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹•Ð¡…¡•-•ä¤ì(€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•È€ôÉ•…‘•Èì(€€€½¹ÍÐÁÕµÀ€ô€ ¤€ôøì(€€€€€É•…‘•È¹É•… ¤¹Ñ¡•¸ ¡ì(€€€€€€€Ù…±Õ”°(€€€€€€€‘½¹”(€€€€€ô¤€ôøì(€€€€€€€¥˜€¡‘½¹”¤ì(€€€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•È€ô¹Õ±°ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€¥˜€¡Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹‘•ÍÑÉ½å•¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¹}É•¹‘•ÉA…•¡Õ¹¬¡Ù…±Õ”°¥¹Ñ•¹ÑMÑ…Ñ”¤ì(€€€€€€€ÁÕµÀ ¤ì(€€€€€ô°É•…Í½¸€ôøì(€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•È€ô¹Õ±°ì(€€€€€€€¥˜€¡Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹‘•ÍÑÉ½å•¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€¥˜€¡¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¤ì(€€€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á•É…Ñ½É1¥ÍÐ¹±…ÍÑ¡Õ¹¬€ôÑÉÕ”ì(€€€€€€€€€™½È€¡½¹ÍÐ¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬½˜¥¹Ñ•¹ÑMÑ…Ñ”¹É•¹‘•ÉQ…Í­Ì¤ì(€€€€€€€€€€€¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹½Á•É…Ñ½É1¥ÍÑ¡…¹• ¤ì(€€€€€€€€€ô(€€€€€€€€€Ñ¡¥Ì¸ÑÉå±•…¹ÕÀ ¤ì(€€€€€€€ô(€€€€€€€¥˜€¡¥¹Ñ•¹ÑMÑ…Ñ”¹‘¥ÍÁ±…åI•…‘å…Á…‰¥±¥Ñä¤ì(€€€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹‘¥ÍÁ±…åI•…‘å…Á…‰¥±¥Ñä¹É•©•Ð¡É•…Í½¸¤ì(€€€€€€€ô•±Í”¥˜€¡¥¹Ñ•¹ÑMÑ…Ñ”¹½Á1¥ÍÑI•…‘…Á…‰¥±¥Ñä¤ì(€€€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹½Á1¥ÍÑI•…‘…Á…‰¥±¥Ñä¹É•©•Ð¡É•…Í½¸¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€Ñ¡É½ÜÉ•…Í½¸ì(€€€€€€€ô(€€€€€ô¤ì(€€€ôì(€€€ÁÕµÀ ¤ì(€ô(€}…‰½ÉÑ=Á•É…Ñ½É1¥ÍÐ¡ì(€€€¥¹Ñ•¹ÑMÑ…Ñ”°(€€€É•…Í½¸°(€€€™½É”€ô™…±Í”(€ô¤ì(€€€¥˜€ …¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•É…¹•±Q¥µ•½ÕÐ¤ì(€€€€€±•…ÉQ¥µ•½ÕÐ¡¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•É…¹•±Q¥µ•½ÕÐ¤ì(€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•É…¹•±Q¥µ•½ÕÐ€ô¹Õ±°ì(€€€ô(€€€¥˜€ …™½É”¤ì(€€€€€¥˜€¡¥¹Ñ•¹ÑMÑ…Ñ”¹É•¹‘•ÉQ…Í­Ì¹Í¥é”€ø€À¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€¥˜€¡É•…Í½¸¥¹ÍÑ…¹•½˜I•¹‘•É¥¹…¹•±±•‘á•ÁÑ¥½¸¤ì(€€€€€€€±•Ð‘•±…ä€ôI9I%9}911}Q%5=UPì(€€€€€€€¥˜€¡É•…Í½¸¹•áÑÉ…•±…ä€ø€À€˜˜É•…Í½¸¹•áÑÉ…•±…ä€ð€ÄÀÀÀ¤ì(€€€€€€€€€‘•±…ä€¬ôÉ•…Í½¸¹•áÑÉ…•±…äì(€€€€€€€ô(€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•É…¹•±Q¥µ•½ÕÐ€ôÍ•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•É…¹•±Q¥µ•½ÕÐ€ô¹Õ±°ì(€€€€€€€€€Ñ¡¥Ì¹}…‰½ÉÑ=Á•É…Ñ½É1¥ÍÐ¡ì(€€€€€€€€€€€¥¹Ñ•¹ÑMÑ…Ñ”°(€€€€€€€€€€€É•…Í½¸°(€€€€€€€€€€€™½É”èÑÉÕ”(€€€€€€€€€ô¤ì(€€€€€€€ô°‘•±…ä¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€ô(€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•È¹…¹•°¡¹•Ü‰½ÉÑá•ÁÑ¥½¸¡É•…Í½¸¹µ•ÍÍ…”¤¤¹…Ñ   ¤€ôøíô¤ì(€€€¥¹Ñ•¹ÑMÑ…Ñ”¹ÍÑÉ•…µI•…‘•È€ô¹Õ±°ì(€€€¥˜€¡Ñ¡¥Ì¹}ÑÉ…¹ÍÁ½ÉÐ¹‘•ÍÑÉ½å•¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€™½È€¡½¹ÍÐmÕÉ…¡•-•ä°ÕÉ%¹Ñ•¹ÑMÑ…Ñ•t½˜Ñ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¤ì(€€€€€¥˜€¡ÕÉ%¹Ñ•¹ÑMÑ…Ñ”€ôôô¥¹Ñ•¹ÑMÑ…Ñ”¤ì(€€€€€€€Ñ¡¥Ì¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹‘•±•Ñ”¡ÕÉ…¡•-•ä¤ì(€€€€€€€‰É•…¬ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¹±•…¹ÕÀ ¤ì(€ô(€•ÐÍÑ…ÑÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÍÑ…ÑÌì(€ô)ô)±…ÍÌA]½É­•Èì(€€…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€€µ•ÍÍ…•!…¹‘±•È€ô¹Õ±°ì(€€Á½ÉÐ€ô¹Õ±°ì(€€Ý•‰]½É­•È€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€™…­•]½É­•É%€ô€Àì(€ÍÑ…Ñ¥Œ€¥Í]½É­•É¥Í…‰±•€ô™…±Í”ì(€ÍÑ…Ñ¥Œ€Ý½É­•ÉA½ÉÑÌ€ô¹•Ü]•…­5…À ¤ì(€ÍÑ…Ñ¥Œì(€€€¥˜€¡¥Í9½‘•)L¤ì(€€€€€Ñ¡¥Ì¸¥Í]½É­•É¥Í…‰±•€ôÑÉÕ”ì(€€€€€±½‰…±]½É­•É=ÁÑ¥½¹Ì¹Ý½É­•ÉMÉŒñðô€ˆ¸½Á‘˜¹Ý½É­•È¹µ©Ìˆì(€€€ô(€€€Ñ¡¥Ì¹}¥ÍM…µ•=É¥¥¸€ô€¡‰…Í•UÉ°°½Ñ¡•ÉUÉ°¤€ôøì(€€€€€½¹ÍÐ‰…Í”€ôUI0¹Á…ÉÍ”¡‰…Í•UÉ°¤ì(€€€€€¥˜€ …‰…Í”ü¹½É¥¥¸ñð‰…Í”¹½É¥¥¸€ôôô€‰¹Õ±°ˆ¤ì(€€€€€€€É•ÑÕÉ¸™…±Í”ì(€€€€€ô(€€€€€½¹ÍÐ½Ñ¡•È€ô¹•ÜUI0¡½Ñ¡•ÉUÉ°°‰…Í”¤ì(€€€€€É•ÑÕÉ¸‰…Í”¹½É¥¥¸€ôôô½Ñ¡•È¹½É¥¥¸ì(€€€ôì(€€€Ñ¡¥Ì¹}É•…Ñ•9]É…ÁÁ•È€ôÕÉ°€ôøì(€€€€€½¹ÍÐÝÉ…ÁÁ•È€ô…Ý…¥Ð¥µÁ½ÉÐ ˆ‘íÕÉ±ôˆ¤í€ì(€€€€€É•ÑÕÉ¸UI0¹É•…Ñ•=‰©•ÑUI0¡¹•Ü	±½ˆ¡mÝÉ…ÁÁ•Ét°ì(€€€€€€€ÑåÁ”è€‰Ñ•áÐ½©…Ù…ÍÉ¥ÁÐˆ(€€€€€ô¤¤ì(€€€ôì(€ô(€½¹ÍÑÉÕÑ½È¡ì(€€€¹…µ”€ô¹Õ±°°(€€€Á½ÉÐ€ô¹Õ±°°(€€€Ù•É‰½Í¥Ñä€ô•ÑY•É‰½Í¥Ñå1•Ù•° ¤(€ô€ôíô¤ì(€€€Ñ¡¥Ì¹¹…µ”€ô¹…µ”ì(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å•€ô™…±Í”ì(€€€Ñ¡¥Ì¹Ù•É‰½Í¥Ñä€ôÙ•É‰½Í¥Ñäì(€€€¥˜€¡Á½ÉÐ¤ì(€€€€€¥˜€¡A]½É­•È¸Ý½É­•ÉA½ÉÑÌ¹¡…Ì¡Á½ÉÐ¤¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰…¹¹½ÐÕÍ”µ½É”Ñ¡…¸½¹”A]½É­•ÈÁ•ÈÁ½ÉÐ¸ˆ¤ì(€€€€€ô(€€€€€A]½É­•È¸Ý½É­•ÉA½ÉÑÌ¹Í•Ð¡Á½ÉÐ°Ñ¡¥Ì¤ì(€€€€€Ñ¡¥Ì¸¥¹¥Ñ¥…±¥é•É½µA½ÉÐ¡Á½ÉÐ¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¸¥¹¥Ñ¥…±¥é” ¤ì(€€€ô(€ô(€•ÐÁÉ½µ¥Í” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€ô(€€É•Í½±Ù” ¤ì(€€€Ñ¡¥Ì¸…Á…‰¥±¥Ñä¹É•Í½±Ù” ¤ì(€€€Ñ¡¥Ì¸µ•ÍÍ…•!…¹‘±•È¹Í•¹ ‰½¹™¥ÕÉ”ˆ°ì(€€€€€Ù•É‰½Í¥ÑäèÑ¡¥Ì¹Ù•É‰½Í¥Ñä(€€€ô¤ì(€ô(€•ÐÁ½ÉÐ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á½ÉÐì(€ô(€•Ðµ•ÍÍ…•!…¹‘±•È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸µ•ÍÍ…•!…¹‘±•Èì(€ô(€€¥¹¥Ñ¥…±¥é•É½µA½ÉÐ¡Á½ÉÐ¤ì(€€€Ñ¡¥Ì¸Á½ÉÐ€ôÁ½ÉÐì(€€€Ñ¡¥Ì¸µ•ÍÍ…•!…¹‘±•È€ô¹•Ü5•ÍÍ…•!…¹‘±•È ‰µ…¥¸ˆ°€‰Ý½É­•Èˆ°Á½ÉÐ¤ì(€€€Ñ¡¥Ì¸µ•ÍÍ…•!…¹‘±•È¹½¸ ‰É•…‘äˆ°€ ¤€ôøíô¤ì(€€€Ñ¡¥Ì¸É•Í½±Ù” ¤ì(€ô(€€¥¹¥Ñ¥…±¥é” ¤ì(€€€¥˜€¡A]½É­•È¸¥Í]½É­•É¥Í…‰±•ñðA]½É­•È¸µ…¥¹Q¡É•…‘]½É­•É5•ÍÍ…•!…¹‘±•È¤ì(€€€€€Ñ¡¥Ì¸Í•ÑÕÁ…­•]½É­•È ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€±•Ðì(€€€€€Ý½É­•ÉMÉŒ(€€€ô€ôA]½É­•Èì(€€€ÑÉäì(€€€€€¥˜€ …A]½É­•È¹}¥ÍM…µ•=É¥¥¸¡Ý¥¹‘½Ü¹±½…Ñ¥½¸°Ý½É­•ÉMÉŒ¤¤ì(€€€€€€€Ý½É­•ÉMÉŒ€ôA]½É­•È¹}É•…Ñ•9]É…ÁÁ•È¡¹•ÜUI0¡Ý½É­•ÉMÉŒ°Ý¥¹‘½Ü¹±½…Ñ¥½¸¤¹¡É•˜¤ì(€€€€€ô(€€€€€½¹ÍÐÝ½É­•È€ô¹•Ü]½É­•È¡Ý½É­•ÉMÉŒ°ì(€€€€€€€ÑåÁ”è€‰µ½‘Õ±”ˆ(€€€€€ô¤ì(€€€€€½¹ÍÐµ•ÍÍ…•!…¹‘±•È€ô¹•Ü5•ÍÍ…•!…¹‘±•È ‰µ…¥¸ˆ°€‰Ý½É­•Èˆ°Ý½É­•È¤ì(€€€€€½¹ÍÐÑ•Éµ¥¹…Ñ•…É±ä€ô€ ¤€ôøì(€€€€€€€…Œ¹…‰½ÉÐ ¤ì(€€€€€€€µ•ÍÍ…•!…¹‘±•È¹‘•ÍÑÉ½ä ¤ì(€€€€€€€Ý½É­•È¹Ñ•Éµ¥¹…Ñ” ¤ì(€€€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€€€Ñ¡¥Ì¸…Á…‰¥±¥Ñä¹É•©•Ð¡¹•ÜÉÉ½È ‰]½É­•ÈÝ…Ì‘•ÍÑÉ½å•ˆ¤¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€Ñ¡¥Ì¸Í•ÑÕÁ…­•]½É­•È ¤ì(€€€€€€€ô(€€€€€ôì(€€€€€½¹ÍÐ…Œ€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€€€Ý½É­•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰•ÉÉ½Èˆ°€ ¤€ôøì(€€€€€€€¥˜€ …Ñ¡¥Ì¸Ý•‰]½É­•È¤ì(€€€€€€€€€Ñ•Éµ¥¹…Ñ•…É±ä ¤ì(€€€€€€€ô(€€€€€ô°ì(€€€€€€€Í¥¹…°è…Œ¹Í¥¹…°(€€€€€ô¤ì(€€€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰Ñ•ÍÐˆ°‘…Ñ„€ôøì(€€€€€€€…Œ¹…‰½ÉÐ ¤ì(€€€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•ñð€…‘…Ñ„¤ì(€€€€€€€€€Ñ•Éµ¥¹…Ñ•…É±ä ¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¸µ•ÍÍ…•!…¹‘±•È€ôµ•ÍÍ…•!…¹‘±•Èì(€€€€€€€Ñ¡¥Ì¸Á½ÉÐ€ôÝ½É­•Èì(€€€€€€€Ñ¡¥Ì¸Ý•‰]½É­•È€ôÝ½É­•Èì(€€€€€€€Ñ¡¥Ì¸É•Í½±Ù” ¤ì(€€€€€ô¤ì(€€€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰É•…‘äˆ°‘…Ñ„€ôøì(€€€€€€€…Œ¹…‰½ÉÐ ¤ì(€€€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€€€Ñ•Éµ¥¹…Ñ•…É±ä ¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€ÑÉäì(€€€€€€€€€Í•¹‘Q•ÍÐ ¤ì(€€€€€€€ô…Ñ ì(€€€€€€€€€Ñ¡¥Ì¸Í•ÑÕÁ…­•]½É­•È ¤ì(€€€€€€€ô(€€€€€ô¤ì(€€€€€½¹ÍÐÍ•¹‘Q•ÍÐ€ô€ ¤€ôøì(€€€€€€€½¹ÍÐÑ•ÍÑ=‰¨€ô¹•ÜU¥¹ÐáÉÉ…ä ¤ì(€€€€€€€µ•ÍÍ…•!…¹‘±•È¹Í•¹ ‰Ñ•ÍÐˆ°Ñ•ÍÑ=‰¨°mÑ•ÍÑ=‰¨¹‰Õ™™•Ét¤ì(€€€€€ôì(€€€€€Í•¹‘Q•ÍÐ ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô…Ñ ì(€€€€€¥¹™¼ ‰Q¡”Ý½É­•È¡…Ì‰••¸‘¥Í…‰±•¸ˆ¤ì(€€€ô(€€€Ñ¡¥Ì¸Í•ÑÕÁ…­•]½É­•È ¤ì(€ô(€€Í•ÑÕÁ…­•]½É­•È ¤ì(€€€¥˜€ …A]½É­•È¸¥Í]½É­•É¥Í…‰±•¤ì(€€€€€Ý…É¸ ‰M•ÑÑ¥¹œÕÀ™…­”Ý½É­•È¸ˆ¤ì(€€€€€A]½É­•È¸¥Í]½É­•É¥Í…‰±•€ôÑÉÕ”ì(€€€ô(€€€A]½É­•È¹}Í•ÑÕÁ…­•]½É­•É±½‰…°¹Ñ¡•¸¡]½É­•É5•ÍÍ…•!…¹‘±•È€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€Ñ¡¥Ì¸…Á…‰¥±¥Ñä¹É•©•Ð¡¹•ÜÉÉ½È ‰]½É­•ÈÝ…Ì‘•ÍÑÉ½å•ˆ¤¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€½¹ÍÐÁ½ÉÐ€ô¹•Ü1½½Á‰…­A½ÉÐ ¤ì(€€€€€Ñ¡¥Ì¸Á½ÉÐ€ôÁ½ÉÐì(€€€€€½¹ÍÐ¥€ô™…­”‘íA]½É­•È¸™…­•]½É­•É%¬­õ€ì(€€€€€½¹ÍÐÝ½É­•É!…¹‘±•È€ô¹•Ü5•ÍÍ…•!…¹‘±•È¡¥€¬€‰}Ý½É­•Èˆ°¥°Á½ÉÐ¤ì(€€€€€]½É­•É5•ÍÍ…•!…¹‘±•È¹Í•ÑÕÀ¡Ý½É­•É!…¹‘±•È°Á½ÉÐ¤ì(€€€€€Ñ¡¥Ì¸µ•ÍÍ…•!…¹‘±•È€ô¹•Ü5•ÍÍ…•!…¹‘±•È¡¥°¥€¬€‰}Ý½É­•Èˆ°Á½ÉÐ¤ì(€€€€€Ñ¡¥Ì¸É•Í½±Ù” ¤ì(€€€ô¤¹…Ñ ¡É•…Í½¸€ôøì(€€€€€Ñ¡¥Ì¸…Á…‰¥±¥Ñä¹É•©•Ð¡¹•ÜÉÉ½È¡M•ÑÑ¥¹œÕÀ™…­”Ý½É­•È™…¥±•è€ˆ‘íÉ•…Í½¸¹µ•ÍÍ…•ôˆ¹€¤¤ì(€€€ô¤ì(€ô(€‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å•€ôÑÉÕ”ì(€€€Ñ¡¥Ì¸Ý•‰]½É­•Èü¹Ñ•Éµ¥¹…Ñ” ¤ì(€€€Ñ¡¥Ì¸Ý•‰]½É­•È€ô¹Õ±°ì(€€€A]½É­•È¸Ý½É­•ÉA½ÉÑÌ¹‘•±•Ñ”¡Ñ¡¥Ì¸Á½ÉÐ¤ì(€€€Ñ¡¥Ì¸Á½ÉÐ€ô¹Õ±°ì(€€€Ñ¡¥Ì¸µ•ÍÍ…•!…¹‘±•Èü¹‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¸µ•ÍÍ…•!…¹‘±•È€ô¹Õ±°ì(€ô(€ÍÑ…Ñ¥ŒÉ•…Ñ”¡Á…É…µÌ¤ì(€€€½¹ÍÐ…¡•‘A½ÉÐ€ôÑ¡¥Ì¸Ý½É­•ÉA½ÉÑÌ¹•Ð¡Á…É…µÌü¹Á½ÉÐ¤ì(€€€¥˜€¡…¡•‘A½ÉÐ¤ì(€€€€€¥˜€¡…¡•‘A½ÉÐ¹}Á•¹‘¥¹•ÍÑÉ½ä¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰A]½É­•È¹É•…Ñ”€´Ñ¡”Ý½É­•È¥Ì‰•¥¹œ‘•ÍÑÉ½å•¹q¸ˆ€¬€‰A±•…Í”É•µ•µ‰•ÈÑ¼…Ý…¥ÐA½Õµ•¹Ñ1½…‘¥¹Q…Í¬¹‘•ÍÑÉ½ä ¥€µ…±±Ì¸ˆ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸…¡•‘A½ÉÐì(€€€ô(€€€É•ÑÕÉ¸¹•ÜA]½É­•È¡Á…É…µÌ¤ì(€ô(€ÍÑ…Ñ¥Œ•ÐÝ½É­•ÉMÉŒ ¤ì(€€€¥˜€¡±½‰…±]½É­•É=ÁÑ¥½¹Ì¹Ý½É­•ÉMÉŒ¤ì(€€€€€É•ÑÕÉ¸±½‰…±]½É­•É=ÁÑ¥½¹Ì¹Ý½É­•ÉMÉŒì(€€€ô(€€€Ñ¡É½Ü¹•ÜÉÉ½È 9¼€‰±½‰…±]½É­•É=ÁÑ¥½¹Ì¹Ý½É­•ÉMÉŒˆÍÁ•¥™¥•¸œ¤ì(€ô(€ÍÑ…Ñ¥Œ•Ð€µ…¥¹Q¡É•…‘]½É­•É5•ÍÍ…•!…¹‘±•È ¤ì(€€€ÑÉäì(€€€€€É•ÑÕÉ¸±½‰…±Q¡¥Ì¹Á‘™©Í]½É­•Èü¹]½É­•É5•ÍÍ…•!…¹‘±•Èñð¹Õ±°ì(€€€ô…Ñ ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ•Ð}Í•ÑÕÁ…­•]½É­•É±½‰…° ¤ì(€€€½¹ÍÐ±½…‘•È€ô…Íå¹Œ€ ¤€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¸µ…¥¹Q¡É•…‘]½É­•É5•ÍÍ…•!…¹‘±•È¤ì(€€€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸µ…¥¹Q¡É•…‘]½É­•É5•ÍÍ…•!…¹‘±•Èì(€€€€€ô(€€€€€½¹ÍÐÝ½É­•È€ô…Ý…¥Ð¥µÁ½ÉÐ (€€€€€€¼©Ý•‰Á…­%¹½É”èÑÉÕ”¨¼(€€€€€€¼©Ù¥Ñ”µ¥¹½É”¨¼(€€€€€Ñ¡¥Ì¹Ý½É­•ÉMÉŒ¤ì(€€€€€É•ÑÕÉ¸Ý½É­•È¹]½É­•É5•ÍÍ…•!…¹‘±•Èì(€€€ôì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰}Í•ÑÕÁ…­•]½É­•É±½‰…°ˆ°±½…‘•È ¤¤ì(€ô)ô)±…ÍÌ]½É­•ÉQÉ…¹ÍÁ½ÉÐì(€‘½Ý¹±½…‘%¹™½…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€€™Õ±±I•…‘•È€ô¹Õ±°ì(€€µ•Ñ¡½‘AÉ½µ¥Í•Ì€ô¹•Ü5…À ¤ì(€€¹•ÑÝ½É­MÑÉ•…´€ô¹Õ±°ì(€€Á…•…¡”€ô¹•Ü5…À ¤ì(€€Á…•AÉ½µ¥Í•Ì€ô¹•Ü5…À ¤ì(€€Á…•I•™…¡”€ô¹•Ü5…À ¤ì(€€Á…ÍÍÝ½É‘…Á…‰¥±¥Ñä€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡µ•ÍÍ…•!…¹‘±•È°±½…‘¥¹Q…Í¬°¹•ÑÝ½É­MÑÉ•…´°Á…É…µÌ°™…Ñ½Éä°Á…•Í5…ÁÁ•È¤ì(€€€Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È€ôµ•ÍÍ…•!…¹‘±•Èì(€€€Ñ¡¥Ì¹±½…‘¥¹Q…Í¬€ô±½…‘¥¹Q…Í¬ì(€€€Ñ¡¥Ì¸¹•ÑÝ½É­MÑÉ•…´€ô¹•ÑÝ½É­MÑÉ•…´ì(€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì€ô¹•ÜA=‰©•ÑÌ ¤ì(€€€Ñ¡¥Ì¹™½¹Ñ1½…‘•È€ô¹•Ü½¹Ñ1½…‘•È¡ì(€€€€€½Ý¹•É½Õµ•¹ÐèÁ…É…µÌ¹½Ý¹•É½Õµ•¹Ð°(€€€€€ÍÑå±•±•µ•¹ÐèÁ…É…µÌ¹ÍÑå±•±•µ•¹Ð(€€€ô¤ì(€€€Ñ¡¥Ì¹•¹…‰±•!]€ôÁ…É…µÌ¹•¹…‰±•!]ì(€€€Ñ¡¥Ì¹±½…‘¥¹A…É…µÌ€ôÁ…É…µÌ¹±½…‘¥¹A…É…µÌì(€€€Ñ¡¥Ì¹}Á…É…µÌ€ôÁ…É…µÌì(€€€Ñ¡¥Ì¹…¹Ù…Í…Ñ½Éä€ô™…Ñ½Éä¹…¹Ù…Í…Ñ½Éäì(€€€Ñ¡¥Ì¹™¥±Ñ•É…Ñ½Éä€ô™…Ñ½Éä¹™¥±Ñ•É…Ñ½Éäì(€€€Ñ¡¥Ì¹‰¥¹…Éå…Ñ……Ñ½Éä€ô™…Ñ½Éä¹‰¥¹…Éå…Ñ……Ñ½Éäì(€€€Ñ¡¥Ì¹Á…•Í5…ÁÁ•È€ôÁ…•Í5…ÁÁ•Èì(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å•€ô™…±Í”ì(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å…Á…‰¥±¥Ñä€ô¹Õ±°ì(€€€Ñ¡¥Ì¹Í•ÑÕÁ5•ÍÍ…•!…¹‘±•È ¤ì(€ô(€ÕÁ‘…Ñ•A…”¡Á…”¤ì(€€€½¹ÍÐì(€€€€€}Á…•%¹‘•à(€€€ô€ôÁ…”ì(€€€Ñ¡¥Ì¸Á…•…¡”¹Í•Ð¡}Á…•%¹‘•à°Á…”¤ì(€€€Ñ¡¥Ì¸Á…•AÉ½µ¥Í•Ì¹Í•Ð¡}Á…•%¹‘•à°AÉ½µ¥Í”¹É•Í½±Ù”¡Á…”¤¤ì(€ô(€€…¡•M¥µÁ±•5•Ñ¡½¡¹…µ”°‘…Ñ„€ô¹Õ±°¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸µ•Ñ¡½‘AÉ½µ¥Í•Ì¹•Ñ=É%¹Í•ÉÑ½µÁÕÑ•¡¹…µ”°€ ¤€ôøÑ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í”¡¹…µ”°‘…Ñ„¤¤ì(€ô(€€½¹AÉ½É•ÍÌ¡ì(€€€±½…‘•°(€€€Ñ½Ñ…°(€ô¤ì(€€€Ñ¡¥Ì¹±½…‘¥¹Q…Í¬¹½¹AÉ½É•ÍÌü¸¡ì(€€€€€±½…‘•°(€€€€€Ñ½Ñ…°°(€€€€€Á•É•¹ÐèÑ½Ñ…°€ü5…Ñ¡±…µÀ¡5…Ñ ¹É½Õ¹¡±½…‘•€¼Ñ½Ñ…°€¨€ÄÀÀ¤°€À°€ÄÀÀ¤€è9…8(€€€ô¤ì(€ô(€•Ð…¹¹½Ñ…Ñ¥½¹MÑ½É…” ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰…¹¹½Ñ…Ñ¥½¹MÑ½É…”ˆ°¹•Ü¹¹½Ñ…Ñ¥½¹MÑ½É…” ¤¤ì(€ô(€•ÑI•¹‘•É¥¹%¹Ñ•¹Ð¡¥¹Ñ•¹Ð°…¹¹½Ñ…Ñ¥½¹5½‘”€ô¹¹½Ñ…Ñ¥½¹5½‘”¹9	1°ÁÉ¥¹Ñ¹¹½Ñ…Ñ¥½¹MÑ½É…”€ô¹Õ±°°¥Í‘¥Ñ¥¹œ€ô™…±Í”°¥Í=Á1¥ÍÐ€ô™…±Í”¤ì(€€€±•ÐÉ•¹‘•É¥¹%¹Ñ•¹Ð€ôI•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹%MA1dì(€€€±•Ð…¹¹½Ñ…Ñ¥½¹MÑ½É…•M•É¥…±¥é…‰±”€ôM•É¥…±¥é…‰±•µÁÑäì(€€€ÍÝ¥Ñ €¡¥¹Ñ•¹Ð¤ì(€€€€€…Í”€‰…¹äˆè(€€€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð€ôI•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹9dì(€€€€€€€‰É•…¬ì(€€€€€…Í”€‰‘¥ÍÁ±…äˆè(€€€€€€€‰É•…¬ì(€€€€€…Í”€‰ÁÉ¥¹Ðˆè(€€€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð€ôI•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹AI%9Pì(€€€€€€€‰É•…¬ì(€€€€€‘•™…Õ±Ðè(€€€€€€€Ý…É¸¡•ÑI•¹‘•É¥¹%¹Ñ•¹Ð€´¥¹Ù…±¥¥¹Ñ•¹Ðè€‘í¥¹Ñ•¹Ñõ€¤ì(€€€ô(€€€½¹ÍÐ…¹¹½Ñ…Ñ¥½¹MÑ½É…”€ôÉ•¹‘•É¥¹%¹Ñ•¹Ð€˜I•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹AI%9P€˜˜ÁÉ¥¹Ñ¹¹½Ñ…Ñ¥½¹MÑ½É…”¥¹ÍÑ…¹•½˜AÉ¥¹Ñ¹¹½Ñ…Ñ¥½¹MÑ½É…”€üÁÉ¥¹Ñ¹¹½Ñ…Ñ¥½¹MÑ½É…”€èÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€€€ÍÝ¥Ñ €¡…¹¹½Ñ…Ñ¥½¹5½‘”¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹5½‘”¹%M	1è(€€€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð€¬ôI•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹99=QQ%=9M}%M	1ì(€€€€€€€‰É•…¬ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹5½‘”¹9	1è(€€€€€€€‰É•…¬ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹5½‘”¹9	1}=I5Lè(€€€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð€¬ôI•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹99=QQ%=9M}=I5Lì(€€€€€€€‰É•…¬ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹5½‘”¹9	1}MQ=Iè(€€€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð€¬ôI•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹99=QQ%=9M}MQ=Iì(€€€€€€€…¹¹½Ñ…Ñ¥½¹MÑ½É…•M•É¥…±¥é…‰±”€ô…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•É¥…±¥é…‰±”ì(€€€€€€€‰É•…¬ì(€€€€€‘•™…Õ±Ðè(€€€€€€€Ý…É¸¡•ÑI•¹‘•É¥¹%¹Ñ•¹Ð€´¥¹Ù…±¥…¹¹½Ñ…Ñ¥½¹5½‘”è€‘í…¹¹½Ñ…Ñ¥½¹5½‘•õ€¤ì(€€€ô(€€€¥˜€¡¥Í‘¥Ñ¥¹œ¤ì(€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð€¬ôI•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹%M}%Q%9ì(€€€ô(€€€¥˜€¡¥Í=Á1¥ÍÐ¤ì(€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð€¬ôI•¹‘•É¥¹%¹Ñ•¹Ñ±…œ¹=A1%MPì(€€€ô(€€€½¹ÍÐì(€€€€€¥‘Ìèµ½‘¥™¥•‘%‘Ì°(€€€€€¡…Í èµ½‘¥™¥•‘%‘Í!…Í (€€€ô€ô…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹µ½‘¥™¥•‘%‘Ìì(€€€½¹ÍÐ…¡•-•å	Õ˜€ômÉ•¹‘•É¥¹%¹Ñ•¹Ð°…¹¹½Ñ…Ñ¥½¹MÑ½É…•M•É¥…±¥é…‰±”¹¡…Í °µ½‘¥™¥•‘%‘Í!…Í¡tì(€€€É•ÑÕÉ¸ì(€€€€€É•¹‘•É¥¹%¹Ñ•¹Ð°(€€€€€…¡•-•äè…¡•-•å	Õ˜¹©½¥¸ ‰|ˆ¤°(€€€€€…¹¹½Ñ…Ñ¥½¹MÑ½É…•M•É¥…±¥é…‰±”°(€€€€€µ½‘¥™¥•‘%‘Ì(€€€ôì(€ô(€‘•ÍÑÉ½ä ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å…Á…‰¥±¥Ñä¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘•ÍÑÉ½å…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€€€ô(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å•€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹‘•ÍÑÉ½å…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€€€Ñ¡¥Ì¸Á…ÍÍÝ½É‘…Á…‰¥±¥Ñäü¹É•©•Ð¡¹•ÜÉÉ½È ‰]½É­•ÈÝ…Ì‘•ÍÑÉ½å•‘ÕÉ¥¹œ½¹A…ÍÍÝ½É…±±‰…¬ˆ¤¤ì(€€€½¹ÍÐÝ…¥Ñ=¸€ômtì(€€€™½È€¡½¹ÍÐÁ…”½˜Ñ¡¥Ì¸Á…•…¡”¹Ù…±Õ•Ì ¤¤ì(€€€€€Ý…¥Ñ=¸¹ÁÕÍ ¡Á…”¹}‘•ÍÑÉ½ä ¤¤ì(€€€ô(€€€Ñ¡¥Ì¸Á…•…¡”¹±•…È ¤ì(€€€Ñ¡¥Ì¸Á…•AÉ½µ¥Í•Ì¹±•…È ¤ì(€€€Ñ¡¥Ì¸Á…•I•™…¡”¹±•…È ¤ì(€€€¥˜€¡=‰©•Ð¹¡…Í=Ý¸¡Ñ¡¥Ì°€‰…¹¹½Ñ…Ñ¥½¹MÑ½É…”ˆ¤¤ì(€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹É•Í•Ñ5½‘¥™¥• ¤ì(€€€ô(€€€½¹ÍÐÑ•Éµ¥¹…Ñ•€ôÑ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰Q•Éµ¥¹…Ñ”ˆ°¹Õ±°¤ì(€€€Ý…¥Ñ=¸¹ÁÕÍ ¡Ñ•Éµ¥¹…Ñ•¤ì(€€€AÉ½µ¥Í”¹…±°¡Ý…¥Ñ=¸¤¹Ñ¡•¸  ¤€ôøì(€€€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì¹±•…È ¤ì(€€€€€Ñ¡¥Ì¹™½¹Ñ1½…‘•È¹±•…È ¤ì(€€€€€Ñ¡¥Ì¸µ•Ñ¡½‘AÉ½µ¥Í•Ì¹±•…È ¤ì(€€€€€Ñ¡¥Ì¹™¥±Ñ•É…Ñ½Éä¹‘•ÍÑÉ½ä ¤ì(€€€€€Q•áÑ1…å•È¹±•…¹ÕÀ ¤ì(€€€€€Ñ¡¥Ì¸¹•ÑÝ½É­MÑÉ•…´ü¹…¹•±±±I•ÅÕ•ÍÑÌ¡¹•Ü‰½ÉÑá•ÁÑ¥½¸ ‰]½É­•ÈÝ…ÌÑ•Éµ¥¹…Ñ•¸ˆ¤¤ì(€€€€€Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•Èü¹‘•ÍÑÉ½ä ¤ì(€€€€€Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È€ô¹Õ±°ì(€€€€€Ñ¡¥Ì¹‘•ÍÑÉ½å…Á…‰¥±¥Ñä¹É•Í½±Ù” ¤ì(€€€ô°Ñ¡¥Ì¹‘•ÍÑÉ½å…Á…‰¥±¥Ñä¹É•©•Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘•ÍÑÉ½å…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€ô(€Í•ÑÕÁ5•ÍÍ…•!…¹‘±•È ¤ì(€€€½¹ÍÐì(€€€€€µ•ÍÍ…•!…¹‘±•È°(€€€€€±½…‘¥¹Q…Í¬(€€€ô€ôÑ¡¥Ìì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰•ÑI•…‘•Èˆ°€¡‘…Ñ„°Í¥¹¬¤€ôøì(€€€€€…ÍÍ•ÉÐ¡Ñ¡¥Ì¸¹•ÑÝ½É­MÑÉ•…´°€‰•ÑI•…‘•È€´¹¼	…Í•AMÑÉ•…µ€¥¹ÍÑ…¹”…Ù…¥±…‰±”¸ˆ¤ì(€€€€€Ñ¡¥Ì¸™Õ±±I•…‘•È€ôÑ¡¥Ì¸¹•ÑÝ½É­MÑÉ•…´¹•ÑÕ±±I•…‘•È ¤ì(€€€€€Ñ¡¥Ì¸™Õ±±I•…‘•È¹½¹AÉ½É•ÍÌ€ô•ÙÐ€ôøÑ¡¥Ì¸½¹AÉ½É•ÍÌ¡•ÙÐ¤ì(€€€€€Í¥¹¬¹½¹AÕ±°€ô€ ¤€ôøì(€€€€€€€Ñ¡¥Ì¸™Õ±±I•…‘•È¹É•… ¤¹Ñ¡•¸¡™Õ¹Ñ¥½¸€¡ì(€€€€€€€€€Ù…±Õ”°(€€€€€€€€€‘½¹”(€€€€€€€ô¤ì(€€€€€€€€€¥˜€¡‘½¹”¤ì(€€€€€€€€€€€Í¥¹¬¹±½Í” ¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€…ÍÍ•ÉÐ¡Ù…±Õ”¥¹ÍÑ…¹•½˜ÉÉ…å	Õ™™•È°€‰•ÑI•…‘•È€´•áÁ•Ñ•…¸ÉÉ…å	Õ™™•È¸ˆ¤ì(€€€€€€€€€Í¥¹¬¹•¹ÅÕ•Õ”¡¹•ÜU¥¹ÐáÉÉ…ä¡Ù…±Õ”¤°€Ä°mÙ…±Õ•t¤ì(€€€€€€€ô¤¹…Ñ ¡É•…Í½¸€ôøì(€€€€€€€€€Í¥¹¬¹•ÉÉ½È¡É•…Í½¸¤ì(€€€€€€€ô¤ì(€€€€€ôì(€€€€€Í¥¹¬¹½¹…¹•°€ôÉ•…Í½¸€ôøì(€€€€€€€Ñ¡¥Ì¸™Õ±±I•…‘•È¹…¹•°¡É•…Í½¸¤ì(€€€€€€€Í¥¹¬¹É•…‘ä¹…Ñ ¡É•…‘åI•…Í½¸€ôøì(€€€€€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€Ñ¡É½ÜÉ•…‘åI•…Í½¸ì(€€€€€€€ô¤ì(€€€€€ôì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰I•…‘•É!•…‘•ÉÍI•…‘äˆ°…Íå¹Œ‘…Ñ„€ôøì(€€€€€…Ý…¥ÐÑ¡¥Ì¸™Õ±±I•…‘•È¹¡•…‘•ÉÍI•…‘äì(€€€€€½¹ÍÐì(€€€€€€€¥ÍMÑÉ•…µ¥¹MÕÁÁ½ÉÑ•°(€€€€€€€¥ÍI…¹•MÕÁÁ½ÉÑ•°(€€€€€€€½¹Ñ•¹Ñ1•¹Ñ (€€€€€ô€ôÑ¡¥Ì¸™Õ±±I•…‘•Èì(€€€€€¥˜€¡¥ÍMÑÉ•…µ¥¹MÕÁÁ½ÉÑ•€˜˜¥ÍI…¹•MÕÁÁ½ÉÑ•¤ì(€€€€€€€Ñ¡¥Ì¸™Õ±±I•…‘•È¹½¹AÉ½É•ÍÌ€ô¹Õ±°ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€€€€€¥ÍMÑÉ•…µ¥¹MÕÁÁ½ÉÑ•°(€€€€€€€¥ÍI…¹•MÕÁÁ½ÉÑ•°(€€€€€€€½¹Ñ•¹Ñ1•¹Ñ (€€€€€ôì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰•ÑI…¹•I•…‘•Èˆ°€¡‘…Ñ„°Í¥¹¬¤€ôøì(€€€€€…ÍÍ•ÉÐ¡Ñ¡¥Ì¸¹•ÑÝ½É­MÑÉ•…´°€‰•ÑI…¹•I•…‘•È€´¹¼	…Í•AMÑÉ•…µ€¥¹ÍÑ…¹”…Ù…¥±…‰±”¸ˆ¤ì(€€€€€½¹ÍÐÉ…¹•I•…‘•È€ôÑ¡¥Ì¸¹•ÑÝ½É­MÑÉ•…´¹•ÑI…¹•I•…‘•È¡‘…Ñ„¹‰•¥¸°‘…Ñ„¹•¹¤ì(€€€€€¥˜€ …É…¹•I•…‘•È¤ì(€€€€€€€Í¥¹¬¹±½Í” ¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€Í¥¹¬¹½¹AÕ±°€ô€ ¤€ôøì(€€€€€€€É…¹•I•…‘•È¹É•… ¤¹Ñ¡•¸¡™Õ¹Ñ¥½¸€¡ì(€€€€€€€€€Ù…±Õ”°(€€€€€€€€€‘½¹”(€€€€€€€ô¤ì(€€€€€€€€€¥˜€¡‘½¹”¤ì(€€€€€€€€€€€Í¥¹¬¹±½Í” ¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€…ÍÍ•ÉÐ¡Ù…±Õ”¥¹ÍÑ…¹•½˜ÉÉ…å	Õ™™•È°€‰•ÑI…¹•I•…‘•È€´•áÁ•Ñ•…¸ÉÉ…å	Õ™™•È¸ˆ¤ì(€€€€€€€€€Í¥¹¬¹•¹ÅÕ•Õ”¡¹•ÜU¥¹ÐáÉÉ…ä¡Ù…±Õ”¤°€Ä°mÙ…±Õ•t¤ì(€€€€€€€ô¤¹…Ñ ¡É•…Í½¸€ôøì(€€€€€€€€€Í¥¹¬¹•ÉÉ½È¡É•…Í½¸¤ì(€€€€€€€ô¤ì(€€€€€ôì(€€€€€Í¥¹¬¹½¹…¹•°€ôÉ•…Í½¸€ôøì(€€€€€€€É…¹•I•…‘•È¹…¹•°¡É•…Í½¸¤ì(€€€€€€€Í¥¹¬¹É•…‘ä¹…Ñ ¡É•…‘åI•…Í½¸€ôøì(€€€€€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€Ñ¡É½ÜÉ•…‘åI•…Í½¸ì(€€€€€€€ô¤ì(€€€€€ôì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰•Ñ½Œˆ°€¡ì(€€€€€Á‘™%¹™¼(€€€ô¤€ôøì(€€€€€Ñ¡¥Ì¹Á…•Í5…ÁÁ•È¹Á…•Í9Õµ‰•È€ôÁ‘™%¹™¼¹¹ÕµA…•Ìì(€€€€€Ñ¡¥Ì¹}¹ÕµA…•Ì€ôÁ‘™%¹™¼¹¹ÕµA…•Ìì(€€€€€Ñ¡¥Ì¹}¡Ñµ±½Éa™„€ôÁ‘™%¹™¼¹¡Ñµ±½Éa™„ì(€€€€€‘•±•Ñ”Á‘™%¹™¼¹¡Ñµ±½Éa™„ì(€€€€€±½…‘¥¹Q…Í¬¹}…Á…‰¥±¥Ñä¹É•Í½±Ù”¡¹•ÜA½Õµ•¹ÑAÉ½áä¡Á‘™%¹™¼°Ñ¡¥Ì¤¤ì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰½á•ÁÑ¥½¸ˆ°•à€ôøì(€€€€€±½…‘¥¹Q…Í¬¹}…Á…‰¥±¥Ñä¹É•©•Ð¡ÝÉ…ÁI•…Í½¸¡•à¤¤ì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰A…ÍÍÝ½É‘I•ÅÕ•ÍÐˆ°•à€ôøì(€€€€€Ñ¡¥Ì¸Á…ÍÍÝ½É‘…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€€€€€ÑÉäì(€€€€€€€¥˜€ …±½…‘¥¹Q…Í¬¹½¹A…ÍÍÝ½É¤ì(€€€€€€€€€Ñ¡É½ÜÝÉ…ÁI•…Í½¸¡•à¤ì(€€€€€€€ô(€€€€€€€½¹ÍÐÕÁ‘…Ñ•A…ÍÍÝ½É€ôÁ…ÍÍÝ½É€ôøì(€€€€€€€€€¥˜€¡Á…ÍÍÝ½É¥¹ÍÑ…¹•½˜ÉÉ½È¤ì(€€€€€€€€€€€Ñ¡¥Ì¸Á…ÍÍÝ½É‘…Á…‰¥±¥Ñä¹É•©•Ð¡Á…ÍÍÝ½É¤ì(€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€Ñ¡¥Ì¸Á…ÍÍÝ½É‘…Á…‰¥±¥Ñä¹É•Í½±Ù”¡ì(€€€€€€€€€€€€€Á…ÍÍÝ½É(€€€€€€€€€€€ô¤ì(€€€€€€€€€ô(€€€€€€€ôì(€€€€€€€±½…‘¥¹Q…Í¬¹½¹A…ÍÍÝ½É¡ÕÁ‘…Ñ•A…ÍÍÝ½É°•à¹½‘”¤ì(€€€€€ô…Ñ €¡•ÉÈ¤ì(€€€€€€€Ñ¡¥Ì¸Á…ÍÍÝ½É‘…Á…‰¥±¥Ñä¹É•©•Ð¡•ÉÈ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á…ÍÍÝ½É‘…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰…Ñ…1½…‘•ˆ°‘…Ñ„€ôøì(€€€€€Ñ¡¥Ì¸½¹AÉ½É•ÍÌ¡ì(€€€€€€€±½…‘•è‘…Ñ„¹±•¹Ñ °(€€€€€€€Ñ½Ñ…°è‘…Ñ„¹±•¹Ñ (€€€€€ô¤ì(€€€€€Ñ¡¥Ì¹‘½Ý¹±½…‘%¹™½…Á…‰¥±¥Ñä¹É•Í½±Ù”¡‘…Ñ„¤ì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰MÑ…ÉÑI•¹‘•ÉA…”ˆ°‘…Ñ„€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€½¹ÍÐÁ…”€ôÑ¡¥Ì¸Á…•…¡”¹•Ð¡‘…Ñ„¹Á…•%¹‘•à¤ì(€€€€€Á…”¹}ÍÑ…ÉÑI•¹‘•ÉA…”¡‘…Ñ„¹ÑÉ…¹ÍÁ…É•¹ä°‘…Ñ„¹…¡•-•ä¤ì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰½µµ½¹½‰¨ˆ°€¡m¥°ÑåÁ”°•áÁ½ÉÑ•‘…Ñ…t¤€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€€€ô(€€€€€¥˜€¡Ñ¡¥Ì¹½µµ½¹=‰©Ì¹¡…Ì¡¥¤¤ì(€€€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€€€ô(€€€€€ÍÝ¥Ñ €¡ÑåÁ”¤ì(€€€€€€€…Í”€‰½¹Ðˆè(€€€€€€€€€¥˜€ ‰•ÉÉ½Èˆ¥¸•áÁ½ÉÑ•‘…Ñ„¤ì(€€€€€€€€€€€½¹ÍÐ•áÁ½ÉÑ•‘ÉÉ½È€ô•áÁ½ÉÑ•‘…Ñ„¹•ÉÉ½Èì(€€€€€€€€€€€Ý…É¸¡ÉÉ½È‘ÕÉ¥¹œ™½¹Ð±½…‘¥¹œè€‘í•áÁ½ÉÑ•‘ÉÉ½Éõ€¤ì(€€€€€€€€€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì¹É•Í½±Ù”¡¥°•áÁ½ÉÑ•‘ÉÉ½È¤ì(€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€ô(€€€€€€€€€½¹ÍÐ™½¹Ñ…Ñ„€ô¹•Ü½¹Ñ%¹™¼¡•áÁ½ÉÑ•‘…Ñ„¤ì(€€€€€€€€€½¹ÍÐ¥¹ÍÁ•Ñ½¹Ð€ôÑ¡¥Ì¹}Á…É…µÌ¹Á‘™	Õœ€˜˜±½‰…±Q¡¥Ì¹½¹Ñ%¹ÍÁ•Ñ½Èü¹•¹…‰±•€ü€¡™½¹Ð°ÕÉ°¤€ôø±½‰…±Q¡¥Ì¹½¹Ñ%¹ÍÁ•Ñ½È¹™½¹Ñ‘‘•¡™½¹Ð°ÕÉ°¤€è¹Õ±°ì(€€€€€€€€€½¹ÍÐ™½¹Ð€ô¹•Ü½¹Ñ…•=‰©•Ð¡™½¹Ñ…Ñ„°¥¹ÍÁ•Ñ½¹Ð°•áÁ½ÉÑ•‘…Ñ„¹¡…ÉAÉ½=Á•É…Ñ½É1¥ÍÐ°•áÁ½ÉÑ•‘…Ñ„¹•áÑÉ„¤ì(€€€€€€€€€Ñ¡¥Ì¹™½¹Ñ1½…‘•È¹‰¥¹¡™½¹Ð¤¹…Ñ   ¤€ôøµ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰½¹Ñ…±±‰…¬ˆ°ì(€€€€€€€€€€€¥(€€€€€€€€€ô¤¤¹™¥¹…±±ä  ¤€ôøì(€€€€€€€€€€€¥˜€ …™½¹Ð¹™½¹ÑáÑÉ…AÉ½Á•ÉÑ¥•Ì¤ì(€€€€€€€€€€€€€™½¹Ð¹±•…É…Ñ„ ¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì¹É•Í½±Ù”¡¥°™½¹Ð¤ì(€€€€€€€€€ô¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”€‰½Áå1½…±%µ…”ˆè(€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€¥µ…•I•˜(€€€€€€€€€ô€ô•áÁ½ÉÑ•‘…Ñ„ì(€€€€€€€€€…ÍÍ•ÉÐ¡¥µ…•I•˜°€‰Q¡”¥µ…•I•˜µÕÍÐ‰”‘•™¥¹•¸ˆ¤ì(€€€€€€€€€™½È€¡½¹ÍÐÁ…•AÉ½áä½˜Ñ¡¥Ì¸Á…•…¡”¹Ù…±Õ•Ì ¤¤ì(€€€€€€€€€€€™½È€¡½¹ÍÐl°‘…Ñ…t½˜Á…•AÉ½áä¹½‰©Ì¤ì(€€€€€€€€€€€€€¥˜€¡‘…Ñ„ü¹É•˜€„ôô¥µ…•I•˜¤ì(€€€€€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€¥˜€ …‘…Ñ„¹‘…Ñ…1•¸¤ì(€€€€€€€€€€€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€½¹ÍÐ½Áä€ôÍÑÉÕÑÕÉ•‘±½¹”¡‘…Ñ„¤ì(€€€€€€€€€€€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì¹É•Í½±Ù”¡¥°½Áä¤ì(€€€€€€€€€€€€€É•ÑÕÉ¸‘…Ñ„¹‘…Ñ…1•¸ì(€€€€€€€€€€€ô(€€€€€€€€€ô(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”€‰½¹ÑA…Ñ ˆè(€€€€€€€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì¹É•Í½±Ù”¡¥°¹•Ü½¹ÑA…Ñ¡%¹™¼¡•áÁ½ÉÑ•‘…Ñ„¤¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”€‰%µ…”ˆè(€€€€€€€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì¹É•Í½±Ù”¡¥°•áÁ½ÉÑ•‘…Ñ„¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”€‰A…ÑÑ•É¸ˆè(€€€€€€€€€½¹ÍÐÁ…ÑÑ•É¸€ô¹•ÜA…ÑÑ•É¹%¹™¼¡•áÁ½ÉÑ•‘…Ñ„¤ì(€€€€€€€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì¹É•Í½±Ù”¡¥°Á…ÑÑ•É¸¹•Ñ%H ¤¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€‘•™…Õ±Ðè(€€€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È¡½ÐÕ¹­¹½Ý¸½µµ½¸½‰©•ÐÑåÁ”€‘íÑåÁ•õ€¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰½‰¨ˆ°€¡m¥°Á…•%¹‘•à°ÑåÁ”°¥µ…•…Ñ…t¤€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€½¹ÍÐÁ…•AÉ½áä€ôÑ¡¥Ì¸Á…•…¡”¹•Ð¡Á…•%¹‘•à¤ì(€€€€€¥˜€¡Á…•AÉ½áä¹½‰©Ì¹¡…Ì¡¥¤¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€¥˜€¡Á…•AÉ½áä¹}¥¹Ñ•¹ÑMÑ…Ñ•Ì¹Í¥é”€ôôô€À¤ì(€€€€€€€¥µ…•…Ñ„ü¹‰¥Ñµ…Àü¹±½Í” ¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€ÍÝ¥Ñ €¡ÑåÁ”¤ì(€€€€€€€…Í”€‰%µ…”ˆè(€€€€€€€…Í”€‰A…ÑÑ•É¸ˆè(€€€€€€€€€Á…•AÉ½áä¹½‰©Ì¹É•Í½±Ù”¡¥°¥µ…•…Ñ„¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€‘•™…Õ±Ðè(€€€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È¡½ÐÕ¹­¹½Ý¸½‰©•ÐÑåÁ”€‘íÑåÁ•õ€¤ì(€€€€€ô(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰½AÉ½É•ÍÌˆ°‘…Ñ„€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€Ñ¡¥Ì¸½¹AÉ½É•ÍÌ¡‘…Ñ„¤ì(€€€ô¤ì(€€€µ•ÍÍ…•!…¹‘±•È¹½¸ ‰•Ñ¡	¥¹…Éå…Ñ„ˆ°…Íå¹Œ‘…Ñ„€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰]½É­•ÈÝ…Ì‘•ÍÑÉ½å•¸ˆ¤ì(€€€€€ô(€€€€€¥˜€ …Ñ¡¥Ì¹‰¥¹…Éå…Ñ……Ñ½Éä¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰	¥¹…Éå…Ñ……Ñ½Éå€¹½Ð¥¹¥Ñ¥…±¥é•°Í•”Ñ¡”ÕÍ•]½É­•É•Ñ¡€Á…É…µ•Ñ•È¸ˆ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹‰¥¹…Éå…Ñ……Ñ½Éä¹™•Ñ ¡‘…Ñ„¤ì(€€€ô¤ì(€ô(€•Ñ…Ñ„ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ…Ñ„ˆ°¹Õ±°¤ì(€ô(€Í…Ù•½Õµ•¹Ð ¤ì(€€€¥˜€¡Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í¥é”€ðô€À¤ì(€€€€€Ý…É¸ ‰Í…Ù•½Õµ•¹Ð…±±•Ý¡¥±”…¹¹½Ñ…Ñ¥½¹MÑ½É…•€¥Ì•µÁÑä°€ˆ€¬€‰Á±•…Í”ÕÍ”Ñ¡”•Ñ…Ñ„µµ•Ñ¡½¥¹ÍÑ•…¸ˆ¤ì(€€€ô(€€€½¹ÍÐì(€€€€€µ…À°(€€€€€ÑÉ…¹Í™•È(€€€ô€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•É¥…±¥é…‰±”ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰M…Ù•½Õµ•¹Ðˆ°ì(€€€€€¥ÍAÕÉ•a™„è€„…Ñ¡¥Ì¹}¡Ñµ±½Éa™„°(€€€€€¹ÕµA…•ÌèÑ¡¥Ì¹}¹ÕµA…•Ì°(€€€€€…¹¹½Ñ…Ñ¥½¹MÑ½É…”èµ…À°(€€€€€™¥±•¹…µ”èÑ¡¥Ì¸™Õ±±I•…‘•Èü¹™¥±•¹…µ”€üü¹Õ±°(€€€ô°ÑÉ…¹Í™•È¤¹™¥¹…±±ä  ¤€ôøì(€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹É•Í•Ñ5½‘¥™¥• ¤ì(€€€ô¤ì(€ô(€•áÑÉ…ÑA…•Ì¡Á…•%¹™½Ì°½Áå1•Ù•±Ì€ô¹Õ±°¤ì(€€€½¹ÍÐÁ…É…µÌ€ôì(€€€€€Á…•%¹™½Ì(€€€ôì(€€€±•ÐÑÉ…¹Í™•Èì(€€€½¹ÍÐ%µ…•	¥Ñµ…ÁÑ½È€ô±½‰…±Q¡¥Ì¹%µ…•	¥Ñµ…Àì(€€€¥˜€¡ÑåÁ•½˜%µ…•	¥Ñµ…ÁÑ½È€ôôô€‰™Õ¹Ñ¥½¸ˆ¤ì(€€€€€½¹ÍÐ¥¹™½Ì€ôÉÉ…ä¹¥ÍÉÉ…ä¡Á…•%¹™½Ì¤€üÁ…•%¹™½Ì€èmÁ…•%¹™½Ítì(€€€€€™½È€¡½¹ÍÐÁ…•%¹™¼½˜¥¹™½Ì¤ì(€€€€€€€¥˜€¡Á…•%¹™¼ü¹¥µ…”¥¹ÍÑ…¹•½˜%µ…•	¥Ñµ…ÁÑ½È¤ì(€€€€€€€€€€¡ÑÉ…¹Í™•Èñðômt¤¹ÁÕÍ ¡Á…•%¹™¼¹¥µ…”¤ì(€€€€€€€ô(€€€€€ô(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í¥é”€ø€À¤ì(€€€€€½¹ÍÐÍ•É¥…±¥é•€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•É¥…±¥é…‰±”ì(€€€€€±•Ðì(€€€€€€€µ…À(€€€€€ô€ôÍ•É¥…±¥é•ì(€€€€€¥˜€¡Í•É¥…±¥é•¹ÑÉ…¹Í™•Èü¹±•¹Ñ ¤ì(€€€€€€€¥˜€¡ÑÉ…¹Í™•È¤ì(€€€€€€€€€ÑÉ…¹Í™•È¹ÁÕÍ  ¸¸¹Í•É¥…±¥é•¹ÑÉ…¹Í™•È¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€ÑÉ…¹Í™•È€ôÍ•É¥…±¥é•¹ÑÉ…¹Í™•Èì(€€€€€€€ô(€€€€€ô(€€€€€½¹ÍÐµ…ÁÁ¥¹œ€ôÑ¡¥Ì¹Á…•Í5…ÁÁ•È¹•Ñ5…ÁÁ¥¹œ ¤ì(€€€€€¥˜€¡µ…ÁÁ¥¹œ¤ì(€€€€€€€½¹ÍÐÉ•µ…ÁÁ•€ô¹•Ü5…À ¤ì(€€€€€€€™½È€¡½¹ÍÐm¬°Ùt½˜µ…À¤ì(€€€€€€€€€¥˜€¡Øü¹Á…•%¹‘•à€„ôôÕ¹‘•™¥¹•€˜˜Ø¹Á…•%¹‘•à€øô€À€˜˜Ø¹Á…•%¹‘•à€ðµ…ÁÁ¥¹œ¹±•¹Ñ ¤ì(€€€€€€€€€€€½¹ÍÐ½Áå1•Ù•°€ô½Áå1•Ù•±Ìü¹mØ¹Á…•%¹‘•át€üü€Àì(€€€€€€€€€€€½¹ÍÐÍ½ÕÉ•%‘à€ôµ…ÁÁ¥¹mØ¹Á…•%¹‘•át€´€Äì(€€€€€€€€€€€¥˜€¡Í½ÕÉ•%‘à€„ôôØ¹Á…•%¹‘•àñð½Áå1•Ù•°€„ôô€À¤ì(€€€€€€€€€€€€€É•µ…ÁÁ•¹Í•Ð¡¬°ì(€€€€€€€€€€€€€€€€¸¸¹Ø°(€€€€€€€€€€€€€€€Á…•%¹‘•àèÍ½ÕÉ•%‘à°(€€€€€€€€€€€€€€€½Áå1•Ù•°(€€€€€€€€€€€€€ô¤ì(€€€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€€€ô(€€€€€€€€€ô(€€€€€€€€€É•µ…ÁÁ•¹Í•Ð¡¬°Ø¤ì(€€€€€€€ô(€€€€€€€µ…À€ôÉ•µ…ÁÁ•ì(€€€€€ô(€€€€€Á…É…µÌ¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”€ôµ…Àì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰áÑÉ…ÑA…•Ìˆ°Á…É…µÌ°ÑÉ…¹Í™•È¤¹™¥¹…±±ä  ¤€ôøì(€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹É•Í•Ñ5½‘¥™¥• ¤ì(€€€ô¤ì(€ô(€•ÑA…”¡Á…•9Õµ‰•È¤ì(€€€¥˜€ …9Õµ‰•È¹¥Í%¹Ñ••È¡Á…•9Õµ‰•È¤ñðÁ…•9Õµ‰•È€ðô€ÀñðÁ…•9Õµ‰•È€øÑ¡¥Ì¹Á…•Í5…ÁÁ•È¹Á…•Í9Õµ‰•È¤ì(€€€€€É•ÑÕÉ¸AÉ½µ¥Í”¹É•©•Ð¡¹•ÜÉÉ½È ‰%¹Ù…±¥Á…”É•ÅÕ•ÍÐ¸ˆ¤¤ì(€€€ô(€€€½¹ÍÐÁ…•%¹‘•à€ôÁ…•9Õµ‰•È€´€Äì(€€€½¹ÍÐ¹•ÝA…•%¹‘•à€ôÑ¡¥Ì¹Á…•Í5…ÁÁ•È¹•ÑA…•%¡Á…•9Õµ‰•È¤€´€Äì(€€€½¹ÍÐ…¡•‘AÉ½µ¥Í”€ôÑ¡¥Ì¸Á…•AÉ½µ¥Í•Ì¹•Ð¡Á…•%¹‘•à¤ì(€€€¥˜€¡…¡•‘AÉ½µ¥Í”¤ì(€€€€€É•ÑÕÉ¸…¡•‘AÉ½µ¥Í”ì(€€€ô(€€€½¹ÍÐÁÉ½µ¥Í”€ôÑ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑA…”ˆ°ì(€€€€€Á…•%¹‘•àè¹•ÝA…•%¹‘•à(€€€ô¤¹Ñ¡•¸¡Á…•%¹™¼€ôøì(€€€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰QÉ…¹ÍÁ½ÉÐ‘•ÍÑÉ½å•ˆ¤ì(€€€€€ô(€€€€€¥˜€¡Á…•%¹™¼¹É•™MÑÈ¤ì(€€€€€€€Ñ¡¥Ì¸Á…•I•™…¡”¹Í•Ð¡Á…•%¹™¼¹É•™MÑÈ°¹•ÝA…•%¹‘•à¤ì(€€€€€ô(€€€€€½¹ÍÐÁ…”€ô¹•ÜAA…•AÉ½áä¡Á…•%¹‘•à°Á…•%¹™¼°Ñ¡¥Ì°Ñ¡¥Ì¹Á…•Í5…ÁÁ•È°Ñ¡¥Ì¹}Á…É…µÌ¹Á‘™	Õœ¤ì(€€€€€Ñ¡¥Ì¸Á…•…¡”¹Í•Ð¡Á…•%¹‘•à°Á…”¤ì(€€€€€É•ÑÕÉ¸Á…”ì(€€€ô¤ì(€€€Ñ¡¥Ì¸Á…•AÉ½µ¥Í•Ì¹Í•Ð¡Á…•%¹‘•à°ÁÉ½µ¥Í”¤ì(€€€É•ÑÕÉ¸ÁÉ½µ¥Í”ì(€ô(€…Íå¹Œ•ÑA…•%¹‘•à¡É•˜¤ì(€€€¥˜€ …¥ÍI•™AÉ½áä¡É•˜¤¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰%¹Ù…±¥Á…•%¹‘•àÉ•ÅÕ•ÍÐ¸ˆ¤ì(€€€ô(€€€½¹ÍÐ¥¹‘•à€ô…Ý…¥ÐÑ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑA…•%¹‘•àˆ°ì(€€€€€¹Õ´èÉ•˜¹¹Õ´°(€€€€€•¸èÉ•˜¹•¸(€€€ô¤ì(€€€½¹ÍÐÁ…•9Õµ‰•È€ôÑ¡¥Ì¹Á…•Í5…ÁÁ•È¹•ÑA…•9Õµ‰•È¡¥¹‘•à€¬€Ä¤ì(€€€¥˜€¡Á…•9Õµ‰•È€ôôô€À¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰•ÑA…•%¹‘•àèÁ…”¡…Ì‰••¸É•µ½Ù•¸ˆ¤ì(€€€ô(€€€É•ÑÕÉ¸Á…•9Õµ‰•È€´€Äì(€ô(€•Ñ¹¹½Ñ…Ñ¥½¹Ì¡Á…•%¹‘•à°¥¹Ñ•¹Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ¹¹½Ñ…Ñ¥½¹Ìˆ°ì(€€€€€Á…•%¹‘•àèÑ¡¥Ì¹Á…•Í5…ÁÁ•È¹•ÑA…•%¡Á…•%¹‘•à€¬€Ä¤€´€Ä°(€€€€€¥¹Ñ•¹Ð(€€€ô¤ì(€ô(€•Ñ¥•±‘=‰©•ÑÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸…¡•M¥µÁ±•5•Ñ¡½ ‰•Ñ¥•±‘=‰©•ÑÌˆ¤ì(€ô(€•ÑM¥¹…ÑÕÉ•Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸…¡•M¥µÁ±•5•Ñ¡½ ‰•ÑM¥¹…ÑÕÉ•Ìˆ¤ì(€ô(€•ÑM¥¹…ÑÕÉ•…Ñ„¡¥¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑM¥¹…ÑÕÉ•…Ñ„ˆ°¥¤ì(€ô(€¡…Í)MÑ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸…¡•M¥µÁ±•5•Ñ¡½ ‰!…Í)MÑ¥½¹Ìˆ¤ì(€ô(€•Ñ…±Õ±…Ñ¥½¹=É‘•É%‘Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ…±Õ±…Ñ¥½¹=É‘•É%‘Ìˆ°¹Õ±°¤ì(€ô(€•Ñ•ÍÑ¥¹…Ñ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ•ÍÑ¥¹…Ñ¥½¹Ìˆ°¹Õ±°¤ì(€ô(€•Ñ•ÍÑ¥¹…Ñ¥½¸¡¥¤ì(€€€¥˜€¡ÑåÁ•½˜¥€„ôô€‰ÍÑÉ¥¹œˆ¤ì(€€€€€É•ÑÕÉ¸AÉ½µ¥Í”¹É•©•Ð¡¹•ÜÉÉ½È ‰%¹Ù…±¥‘•ÍÑ¥¹…Ñ¥½¸É•ÅÕ•ÍÐ¸ˆ¤¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ•ÍÑ¥¹…Ñ¥½¸ˆ°ì(€€€€€¥(€€€ô¤ì(€ô(€•ÑA…•1…‰•±Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑA…•1…‰•±Ìˆ°¹Õ±°¤ì(€ô(€•ÑA…•1…å½ÕÐ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑA…•1…å½ÕÐˆ°¹Õ±°¤ì(€ô(€•ÑA…•5½‘” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑA…•5½‘”ˆ°¹Õ±°¤ì(€ô(€•ÑY¥•Ý•ÉAÉ•™•É•¹•Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑY¥•Ý•ÉAÉ•™•É•¹•Ìˆ°¹Õ±°¤ì(€ô(€•Ñ=Á•¹Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ=Á•¹Ñ¥½¸ˆ°¹Õ±°¤ì(€ô(€•ÑÑÑ…¡µ•¹ÑÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑÑÑ…¡µ•¹ÑÌˆ°¹Õ±°¤ì(€ô(€•ÑÑÑ…¡µ•¹Ñ½¹Ñ•¹Ð¡¥¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑÑÑ…¡µ•¹Ñ½¹Ñ•¹Ðˆ°¥¤ì(€ô(€•Ñ¹¹½Ñ…Ñ¥½¹Í	åQåÁ”¡ÑåÁ•Ì°Á…•%¹‘•á•ÍQ½M­¥À¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ¹¹½Ñ…Ñ¥½¹Í	åQåÁ”ˆ°ì(€€€€€ÑåÁ•Ì°(€€€€€Á…•%¹‘•á•ÍQ½M­¥À(€€€ô¤ì(€ô(€•Ñ½)MÑ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸…¡•M¥µÁ±•5•Ñ¡½ ‰•Ñ½)MÑ¥½¹Ìˆ¤ì(€ô(€•ÑA…•)MÑ¥½¹Ì¡Á…•%¹‘•à¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑA…•)MÑ¥½¹Ìˆ°ì(€€€€€Á…•%¹‘•àèÑ¡¥Ì¹Á…•Í5…ÁÁ•È¹•ÑA…•%¡Á…•%¹‘•à€¬€Ä¤€´€Ä(€€€ô¤ì(€ô(€•ÑMÑÉÕÑQÉ•”¡Á…•%¹‘•à¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑMÑÉÕÑQÉ•”ˆ°ì(€€€€€Á…•%¹‘•àèÑ¡¥Ì¹Á…•Í5…ÁÁ•È¹•ÑA…•%¡Á…•%¹‘•à€¬€Ä¤€´€Ä(€€€ô¤ì(€ô(€•Ñ=ÕÑ±¥¹” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ=ÕÑ±¥¹”ˆ°¹Õ±°¤ì(€ô(€•Ñ=ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¡É•¹‘•É¥¹%¹Ñ•¹Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸…¡•M¥µÁ±•5•Ñ¡½ ‰•Ñ=ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œˆ¤¹Ñ¡•¸¡‘…Ñ„€ôø¹•Ü=ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¡‘…Ñ„°É•¹‘•É¥¹%¹Ñ•¹Ð¤¤ì(€ô(€•ÑA•Éµ¥ÍÍ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•ÑA•Éµ¥ÍÍ¥½¹Ìˆ°¹Õ±°¤ì(€ô(€•Ñ5•Ñ…‘…Ñ„ ¤ì(€€€½¹ÍÐ¹…µ”€ô€‰•Ñ5•Ñ…‘…Ñ„ˆì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸µ•Ñ¡½‘AÉ½µ¥Í•Ì¹•Ñ=É%¹Í•ÉÑ½µÁÕÑ•¡¹…µ”°€ ¤€ôøÑ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í”¡¹…µ”°¹Õ±°¤¹Ñ¡•¸¡É•ÍÕ±ÑÌ€ôø€¡ì(€€€€€¥¹™¼èÉ•ÍÕ±ÑÍlÁt°(€€€€€µ•Ñ…‘…Ñ„èÉ•ÍÕ±ÑÍlÅt€ü¹•Ü5•Ñ…‘…Ñ„¡É•ÍÕ±ÑÍlÅt¤€è¹Õ±°°(€€€€€½¹Ñ•¹Ñ¥ÍÁ½Í¥Ñ¥½¹¥±•¹…µ”èÑ¡¥Ì¸™Õ±±I•…‘•Èü¹™¥±•¹…µ”€üü¹Õ±°°(€€€€€½¹Ñ•¹Ñ1•¹Ñ èÑ¡¥Ì¸™Õ±±I•…‘•Èü¹½¹Ñ•¹Ñ1•¹Ñ €üü¹Õ±°°(€€€€€¡…ÍMÑÉÕÑQÉ•”èÉ•ÍÕ±ÑÍlÉt(€€€ô¤¤¤ì(€ô(€•Ñ5…É­%¹™¼ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰•Ñ5…É­%¹™¼ˆ°¹Õ±°¤ì(€ô(€…Íå¹ŒÍÑ…ÉÑ±•…¹ÕÀ¡­••Á1½…‘•‘½¹ÑÌ€ô™…±Í”¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘•ÍÑÉ½å•¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€…Ý…¥ÐÑ¡¥Ì¹µ•ÍÍ…•!…¹‘±•È¹Í•¹‘]¥Ñ¡AÉ½µ¥Í” ‰±•…¹ÕÀˆ°¹Õ±°¤ì(€€€™½È€¡½¹ÍÐÁ…”½˜Ñ¡¥Ì¸Á…•…¡”¹Ù…±Õ•Ì ¤¤ì(€€€€€½¹ÍÐ±•…¹ÕÁMÕ•ÍÍ™Õ°€ôÁ…”¹±•…¹ÕÀ ¤ì(€€€€€¥˜€ …±•…¹ÕÁMÕ•ÍÍ™Õ°¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È¡ÍÑ…ÉÑ±•…¹ÕÀèA…”€‘íÁ…”¹Á…•9Õµ‰•Éô¥ÌÕÉÉ•¹Ñ±äÉ•¹‘•É¥¹œ¹€¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì¹±•…È ¤ì(€€€¥˜€ …­••Á1½…‘•‘½¹ÑÌ¤ì(€€€€€Ñ¡¥Ì¹™½¹Ñ1½…‘•È¹±•…È ¤ì(€€€ô(€€€Ñ¡¥Ì¸µ•Ñ¡½‘AÉ½µ¥Í•Ì¹±•…È ¤ì(€€€Ñ¡¥Ì¹™¥±Ñ•É…Ñ½Éä¹‘•ÍÑÉ½ä¡ÑÉÕ”¤ì(€€€Q•áÑ1…å•È¹±•…¹ÕÀ ¤ì(€ô(€…¡•‘A…•9Õµ‰•È¡É•˜¤ì(€€€¥˜€ …¥ÍI•™AÉ½áä¡É•˜¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€½¹ÍÐÉ•™MÑÈ€ôÉ•˜¹•¸€ôôô€À€ü€‘íÉ•˜¹¹ÕµõI€€è€‘íÉ•˜¹¹ÕµõH‘íÉ•˜¹•¹õ€ì(€€€½¹ÍÐÁ…•%¹‘•à€ôÑ¡¥Ì¸Á…•I•™…¡”¹•Ð¡É•™MÑÈ¤ì(€€€¥˜€¡Á…•%¹‘•à€øô€À¤ì(€€€€€½¹ÍÐÁ…•9Õµ‰•È€ôÑ¡¥Ì¹Á…•Í5…ÁÁ•È¹•ÑA…•9Õµ‰•È¡Á…•%¹‘•à€¬€Ä¤ì(€€€€€¥˜€¡Á…•9Õµ‰•È€„ôô€À¤ì(€€€€€€€É•ÑÕÉ¸Á…•9Õµ‰•Èì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸¹Õ±°ì(€ô)ô)±…ÍÌI•¹‘•ÉQ…Í¬ì(€}¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬€ô¹Õ±°ì(€½¹½¹Ñ¥¹Õ”€ô¹Õ±°ì(€½¹ÉÉ½È€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¤ì(€€€Ñ¡¥Ì¹}¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬€ô¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬ì(€ô(€•ÐÁÉ½µ¥Í” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”ì(€ô(€…¹•°¡•áÑÉ…•±…ä€ô€À¤ì(€€€Ñ¡¥Ì¹}¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹…¹•°¡¹Õ±°°•áÑÉ…•±…ä¤ì(€ô(€•ÐÍ•Á…É…Ñ•¹¹½ÑÌ ¤ì(€€€½¹ÍÐì(€€€€€Í•Á…É…Ñ•¹¹½ÑÌ(€€€ô€ôÑ¡¥Ì¹}¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹½Á•É…Ñ½É1¥ÍÐì(€€€¥˜€ …Í•Á…É…Ñ•¹¹½ÑÌ¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ô(€€€½¹ÍÐì(€€€€€…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À(€€€ô€ôÑ¡¥Ì¹}¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬ì(€€€É•ÑÕÉ¸Í•Á…É…Ñ•¹¹½ÑÌ¹™½É´ñðÍ•Á…É…Ñ•¹¹½ÑÌ¹…¹Ù…Ì€˜˜…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…Àü¹Í¥é”€ø€Àì(€ô(€•Ð¥µ…•½½É‘¥¹…Ñ•Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}¥¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¹¥µ…•½½É‘¥¹…Ñ•Ìñð¹Õ±°ì(€ô)ô)±…ÍÌ%¹Ñ•É¹…±I•¹‘•ÉQ…Í¬ì(€€É€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€…¹Ù…Í%¹UÍ”€ô¹•Ü]•…­M•Ð ¤ì(€½¹ÍÑÉÕÑ½È¡ì(€€€…±±‰…¬°(€€€Á…É…µÌ°(€€€½‰©Ì°(€€€½µµ½¹=‰©Ì°(€€€…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À°(€€€½Á•É…Ñ½É1¥ÍÐ°(€€€Á…•%¹‘•à°(€€€…¹Ù…Í…Ñ½Éä°(€€€™¥±Ñ•É…Ñ½Éä°(€€€ÕÍ•I•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”€ô™…±Í”°(€€€Á‘™	Õœ€ô™…±Í”°(€€€Á…•½±½ÉÌ€ô¹Õ±°°(€€€•¹…‰±•!]€ô™…±Í”°(€€€½Á•É…Ñ¥½¹Í¥±Ñ•È€ô¹Õ±°(€ô¤ì(€€€Ñ¡¥Ì¹…±±‰…¬€ô…±±‰…¬ì(€€€Ñ¡¥Ì¹Á…É…µÌ€ôÁ…É…µÌì(€€€Ñ¡¥Ì¹½‰©Ì€ô½‰©Ìì(€€€Ñ¡¥Ì¹½µµ½¹=‰©Ì€ô½µµ½¹=‰©Ìì(€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À€ô…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…Àì(€€€Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÑ%‘à€ô¹Õ±°ì(€€€Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÐ€ô½Á•É…Ñ½É1¥ÍÐì(€€€Ñ¡¥Ì¹}Á…•%¹‘•à€ôÁ…•%¹‘•àì(€€€Ñ¡¥Ì¹…¹Ù…Í…Ñ½Éä€ô…¹Ù…Í…Ñ½Éäì(€€€Ñ¡¥Ì¹™¥±Ñ•É…Ñ½Éä€ô™¥±Ñ•É…Ñ½Éäì(€€€Ñ¡¥Ì¹}Á‘™	Õœ€ôÁ‘™	Õœì(€€€Ñ¡¥Ì¹Á…•½±½ÉÌ€ôÁ…•½±½ÉÌì(€€€Ñ¡¥Ì¹ÉÕ¹¹¥¹œ€ô™…±Í”ì(€€€Ñ¡¥Ì¹É…Á¡¥ÍI•…‘å…±±‰…¬€ô¹Õ±°ì(€€€Ñ¡¥Ì¹É…Á¡¥ÍI•…‘ä€ô™…±Í”ì(€€€Ñ¡¥Ì¹}ÕÍ•I•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”€ôÕÍ•I•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”€ôôôÑÉÕ”€˜˜ÑåÁ•½˜Ý¥¹‘½Ü€„ôô€‰Õ¹‘•™¥¹•ˆì(€€€Ñ¡¥Ì¹…¹•±±•€ô™…±Í”ì(€€€Ñ¡¥Ì¹…Á…‰¥±¥Ñä€ôAÉ½µ¥Í”¹Ý¥Ñ¡I•Í½±Ù•ÉÌ ¤ì(€€€Ñ¡¥Ì¹Ñ…Í¬€ô¹•ÜI•¹‘•ÉQ…Í¬¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹}…¹•±	½Õ¹€ôÑ¡¥Ì¹…¹•°¹‰¥¹¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹}½¹Ñ¥¹Õ•	½Õ¹€ôÑ¡¥Ì¹}½¹Ñ¥¹Õ”¹‰¥¹¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹}Í¡•‘Õ±•9•áÑ	½Õ¹€ôÑ¡¥Ì¹}Í¡•‘Õ±•9•áÐ¹‰¥¹¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹}¹•áÑ	½Õ¹€ôÑ¡¥Ì¹}¹•áÐ¹‰¥¹¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹}…¹Ù…Ì€ôÁ…É…µÌ¹…¹Ù…Ìì(€€€Ñ¡¥Ì¹}…¹Ù…Í½¹Ñ•áÐ€ôÁ…É…µÌ¹…¹Ù…Ì€ü¹Õ±°€èÁ…É…µÌ¹…¹Ù…Í½¹Ñ•áÐì(€€€Ñ¡¥Ì¹}•¹…‰±•!]€ô•¹…‰±•!]ì(€€€Ñ¡¥Ì¹}‘•Á•¹‘•¹åQÉ…­•È€ôÁ…É…µÌ¹‘•Á•¹‘•¹åQÉ…­•Èì(€€€Ñ¡¥Ì¹}¥µ…•ÍQÉ…­•È€ôÁ…É…µÌ¹¥µ…•ÍQÉ…­•Èì(€€€Ñ¡¥Ì¹}½Á•É…Ñ¥½¹Í¥±Ñ•È€ô½Á•É…Ñ¥½¹Í¥±Ñ•Èì(€ô(€•Ð½µÁ±•Ñ• ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹…Á…‰¥±¥Ñä¹ÁÉ½µ¥Í”¹…Ñ ¡™Õ¹Ñ¥½¸€ ¤íô¤ì(€ô(€¥¹¥Ñ¥…±¥é•É…Á¡¥Ì¡ì(€€€ÑÉ…¹ÍÁ…É•¹ä€ô™…±Í”°(€€€½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ(€ô¤ì(€€€¥˜€¡Ñ¡¥Ì¹…¹•±±•¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹}…¹Ù…Ì¤ì(€€€€€¥˜€¡%¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¸…¹Ù…Í%¹UÍ”¹¡…Ì¡Ñ¡¥Ì¹}…¹Ù…Ì¤¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰…¹¹½ÐÕÍ”Ñ¡”Í…µ”…¹Ù…Ì‘ÕÉ¥¹œµÕ±Ñ¥Á±”É•¹‘•È ¤½Á•É…Ñ¥½¹Ì¸€ˆ€¬€‰UÍ”‘¥™™•É•¹Ð…¹Ù…Ì½È•¹ÍÕÉ”ÁÉ•Ù¥½ÕÌ½Á•É…Ñ¥½¹ÌÝ•É”€ˆ€¬€‰…¹•±±•½È½µÁ±•Ñ•¸ˆ¤ì(€€€€€ô(€€€€€%¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¸…¹Ù…Í%¹UÍ”¹…‘¡Ñ¡¥Ì¹}…¹Ù…Ì¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹}Á‘™	Õœ€˜˜±½‰…±Q¡¥Ì¹MÑ•ÁÁ•É5…¹…•Èü¹•¹…‰±•¤ì(€€€€€Ñ¡¥Ì¹ÍÑ•ÁÁ•È€ô±½‰…±Q¡¥Ì¹MÑ•ÁÁ•É5…¹…•È¹É•…Ñ”¡Ñ¡¥Ì¹}Á…•%¹‘•à¤ì(€€€€€Ñ¡¥Ì¹ÍÑ•ÁÁ•È¹¥¹¥Ð¡Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÐ¤ì(€€€€€Ñ¡¥Ì¹ÍÑ•ÁÁ•È¹¹•áÑ	É•…­A½¥¹Ð€ôÑ¡¥Ì¹ÍÑ•ÁÁ•È¹•Ñ9•áÑ	É•…­A½¥¹Ð ¤ì(€€€ô(€€€½¹ÍÐì(€€€€€Ù¥•ÝÁ½ÉÐ°(€€€€€ÑÉ…¹Í™½É´°(€€€€€‰…­É½Õ¹°(€€€€€‘•Á•¹‘•¹åQÉ…­•È°(€€€€€¥µ…•ÍQÉ…­•È(€€€ô€ôÑ¡¥Ì¹Á…É…µÌì(€€€½¹ÍÐ…¹Ù…Í½¹Ñ•áÐ€ôÑ¡¥Ì¹}…¹Ù…Í½¹Ñ•áÐñðÑ¡¥Ì¹}…¹Ù…Ì¹•Ñ½¹Ñ•áÐ ˆÉˆ°ì(€€€€€…±Á¡„è™…±Í”°(€€€€€Ý¥±±I•…‘É•ÅÕ•¹Ñ±äè€…Ñ¡¥Ì¹}•¹…‰±•!](€€€ô¤ì(€€€Ñ¡¥Ì¹™à€ô¹•Ü…¹Ù…ÍÉ…Á¡¥Ì¡…¹Ù…Í½¹Ñ•áÐ°Ñ¡¥Ì¹½µµ½¹=‰©Ì°Ñ¡¥Ì¹½‰©Ì°Ñ¡¥Ì¹…¹Ù…Í…Ñ½Éä°Ñ¡¥Ì¹™¥±Ñ•É…Ñ½Éä°ì(€€€€€½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ(€€€ô°Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À°Ñ¡¥Ì¹Á…•½±½ÉÌ°‘•Á•¹‘•¹åQÉ…­•È°¥µ…•ÍQÉ…­•È¤ì(€€€Ñ¡¥Ì¹™à¹‰•¥¹É…Ý¥¹œ¡ì(€€€€€ÑÉ…¹Í™½É´°(€€€€€Ù¥•ÝÁ½ÉÐ°(€€€€€ÑÉ…¹ÍÁ…É•¹ä°(€€€€€‰…­É½Õ¹(€€€ô¤ì(€€€Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÑ%‘à€ô€Àì(€€€Ñ¡¥Ì¹É…Á¡¥ÍI•…‘ä€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹É…Á¡¥ÍI•…‘å…±±‰…¬ü¸ ¤ì(€ô(€…¹•°¡•ÉÉ½È€ô¹Õ±°°•áÑÉ…•±…ä€ô€À¤ì(€€€Ñ¡¥Ì¹ÉÕ¹¹¥¹œ€ô™…±Í”ì(€€€Ñ¡¥Ì¹…¹•±±•€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹™àü¹•¹‘É…Ý¥¹œ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸É¤ì(€€€€€Ý¥¹‘½Ü¹…¹•±¹¥µ…Ñ¥½¹É…µ”¡Ñ¡¥Ì¸É¤ì(€€€€€Ñ¡¥Ì¸É€ô¹Õ±°ì(€€€ô(€€€%¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¸…¹Ù…Í%¹UÍ”¹‘•±•Ñ”¡Ñ¡¥Ì¹}…¹Ù…Ì¤ì(€€€•ÉÉ½Èñðô¹•ÜI•¹‘•É¥¹…¹•±±•‘á•ÁÑ¥½¸¡I•¹‘•É¥¹œ…¹•±±•°Á…”€‘íÑ¡¥Ì¹}Á…•%¹‘•à€¬€Åõ€°•áÑÉ…•±…ä¤ì(€€€Ñ¡¥Ì¹…±±‰…¬¡•ÉÉ½È¤ì(€€€Ñ¡¥Ì¹Ñ…Í¬¹½¹ÉÉ½Èü¸¡•ÉÉ½È¤ì(€ô(€½Á•É…Ñ½É1¥ÍÑ¡…¹• ¤ì(€€€¥˜€ …Ñ¡¥Ì¹É…Á¡¥ÍI•…‘ä¤ì(€€€€€Ñ¡¥Ì¹É…Á¡¥ÍI•…‘å…±±‰…¬ñðôÑ¡¥Ì¹}½¹Ñ¥¹Õ•	½Õ¹ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹™à¹‘•Á•¹‘•¹åQÉ…­•Èü¹É½Ý=Á•É…Ñ¥½¹Í½Õ¹Ð¡Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÐ¹™¹ÉÉ…ä¹±•¹Ñ ¤ì(€€€Ñ¡¥Ì¹ÍÑ•ÁÁ•Èü¹ÕÁ‘…Ñ•=Á•É…Ñ½É1¥ÍÐ¡Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÐ¤ì(€€€¥˜€¡Ñ¡¥Ì¹ÉÕ¹¹¥¹œ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹}½¹Ñ¥¹Õ” ¤ì(€ô(€}½¹Ñ¥¹Õ” ¤ì(€€€Ñ¡¥Ì¹ÉÕ¹¹¥¹œ€ôÑÉÕ”ì(€€€¥˜€¡Ñ¡¥Ì¹…¹•±±•¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹Ñ…Í¬¹½¹½¹Ñ¥¹Õ”¤ì(€€€€€Ñ¡¥Ì¹Ñ…Í¬¹½¹½¹Ñ¥¹Õ”¡Ñ¡¥Ì¹}Í¡•‘Õ±•9•áÑ	½Õ¹¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹}Í¡•‘Õ±•9•áÐ ¤ì(€€€ô(€ô(€}Í¡•‘Õ±•9•áÐ ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}ÕÍ•I•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”¤ì(€€€€€Ñ¡¥Ì¸É€ôÝ¥¹‘½Ü¹É•ÅÕ•ÍÑ¹¥µ…Ñ¥½¹É…µ”  ¤€ôøì(€€€€€€€Ñ¡¥Ì¸É€ô¹Õ±°ì(€€€€€€€Ñ¡¥Ì¹}¹•áÑ	½Õ¹ ¤¹…Ñ ¡Ñ¡¥Ì¹}…¹•±	½Õ¹¤ì(€€€€€ô¤ì(€€€ô•±Í”ì(€€€€€AÉ½µ¥Í”¹É•Í½±Ù” ¤¹Ñ¡•¸¡Ñ¡¥Ì¹}¹•áÑ	½Õ¹¤¹…Ñ ¡Ñ¡¥Ì¹}…¹•±	½Õ¹¤ì(€€€ô(€ô(€…Íå¹Œ}¹•áÐ ¤ì(€€€¥˜€¡Ñ¡¥Ì¹…¹•±±•¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÑ%‘à€ôÑ¡¥Ì¹™à¹•á•ÕÑ•=Á•É…Ñ½É1¥ÍÐ¡Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÐ°Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÑ%‘à°Ñ¡¥Ì¹}½¹Ñ¥¹Õ•	½Õ¹°Ñ¡¥Ì¹ÍÑ•ÁÁ•È°Ñ¡¥Ì¹}½Á•É…Ñ¥½¹Í¥±Ñ•È¤ì(€€€¥˜€¡Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÑ%‘à€ôôôÑ¡¥Ì¹½Á•É…Ñ½É1¥ÍÐ¹…ÉÍÉÉ…ä¹±•¹Ñ ¤ì(€€€€€Ñ¡¥Ì¹ÉÕ¹¹¥¹œ€ô™…±Í”ì(€€€€€¥˜€¡Ñ¡¥Ì¹½Á•É…Ñ½É1¥ÍÐ¹±…ÍÑ¡Õ¹¬¤ì(€€€€€€€Ñ¡¥Ì¹™à¹•¹‘É…Ý¥¹œ ¤ì(€€€€€€€%¹Ñ•É¹…±I•¹‘•ÉQ…Í¬¸…¹Ù…Í%¹UÍ”¹‘•±•Ñ”¡Ñ¡¥Ì¹}…¹Ù…Ì¤ì(€€€€€€€Ñ¡¥Ì¹…±±‰…¬ ¤ì(€€€€€ô(€€€ô(€ô)ô)½¹ÍÐÙ•ÉÍ¥½¸€ô€ˆØ¸Ì¸Èàäˆì)½¹ÍÐ‰Õ¥±€ô€ˆÅŒàÀÈÁ„Ýˆì((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½½±½É}Á¥­•È¹©Ì((()±…ÍÌ½±½ÉA¥­•Èì(€€‰ÕÑÑ½¸€ô¹Õ±°ì(€€‰ÕÑÑ½¹MÝ…Ñ €ô¹Õ±°ì(€€‘•™…Õ±Ñ½±½Èì(€€‘É½Á‘½Ý¸€ô¹Õ±°ì(€€‘É½Á‘½Ý¹]…ÍÉ½µ-•å‰½…É€ô™…±Í”ì(€€¥Í5…¥¹½±½ÉA¥­•È€ô™…±Í”ì(€€•‘¥Ñ½È€ô¹Õ±°ì(€€•Ù•¹Ñ	ÕÌì(€€½Á•¹É½Á‘½Ý¹€ô¹Õ±°ì(€€Õ¥5…¹…•È€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€°ÄÁ¹½±½È€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ•Ð}­•å‰½…É‘5…¹…•È ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰}­•å‰½…É‘5…¹…•Èˆ°¹•Ü-•å‰½…É‘5…¹…•È¡mml‰Í…Á”‰t°½±½ÉA¥­•È¹ÁÉ½Ñ½ÑåÁ”¹}¡¥‘•É½Á‘½Ý¹É½µ-•å‰½…É‘t°ml‰MÁ…”‰t°½±½ÉA¥­•È¹ÁÉ½Ñ½ÑåÁ”¹}½±½ÉM•±•ÑÉ½µ-•å‰½…É‘t°ml‰ÉÉ½Ý½Ý¸ˆ°€‰ÉÉ½ÝI¥¡Ð‰t°½±½ÉA¥­•È¹ÁÉ½Ñ½ÑåÁ”¹}µ½Ù•Q½9•áÑt°ml‰ÉÉ½ÝUÀˆ°€‰ÉÉ½Ý1•™Ð‰t°½±½ÉA¥­•È¹ÁÉ½Ñ½ÑåÁ”¹}µ½Ù•Q½AÉ•Ù¥½ÕÍt°ml‰!½µ”‰t°½±½ÉA¥­•È¹ÁÉ½Ñ½ÑåÁ”¹}µ½Ù•Q½	•¥¹¹¥¹t°ml‰¹‰t°½±½ÉA¥­•È¹ÁÉ½Ñ½ÑåÁ”¹}µ½Ù•Q½¹‘ut¤¤ì(€ô(€½¹ÍÑÉÕÑ½È¡ì(€€€•‘¥Ñ½È€ô¹Õ±°°(€€€Õ¥5…¹…•È€ô¹Õ±°(€ô¤ì(€€€¥˜€¡•‘¥Ñ½È¤ì(€€€€€Ñ¡¥Ì¸¥Í5…¥¹½±½ÉA¥­•È€ô™…±Í”ì(€€€€€Ñ¡¥Ì¸•‘¥Ñ½È€ô•‘¥Ñ½Èì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¸¥Í5…¥¹½±½ÉA¥­•È€ôÑÉÕ”ì(€€€ô(€€€Ñ¡¥Ì¸Õ¥5…¹…•È€ô•‘¥Ñ½Èü¹}Õ¥5…¹…•ÈñðÕ¥5…¹…•Èì(€€€Ñ¡¥Ì¸•Ù•¹Ñ	ÕÌ€ôÑ¡¥Ì¸Õ¥5…¹…•È¹}•Ù•¹Ñ	ÕÌì(€€€Ñ¡¥Ì¸‘•™…Õ±Ñ½±½È€ô•‘¥Ñ½Èü¹½±½Èü¹Ñ½UÁÁ•É…Í” ¤ñðÑ¡¥Ì¸Õ¥5…¹…•Èü¹¡¥¡±¥¡Ñ½±½ÉÌ¹Ù…±Õ•Ì ¤¹¹•áÐ ¤¹Ù…±Õ”ñð€ˆäàˆì(€€€½±½ÉA¥­•È¸°ÄÁ¹½±½Èñðô=‰©•Ð¹™É••é”¡ì(€€€€€‰±Õ”è€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÉÁ¥­•Èµ‰±Õ”ˆ°(€€€€€É••¸è€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÉÁ¥­•ÈµÉ••¸ˆ°(€€€€€Á¥¹¬è€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÉÁ¥­•ÈµÁ¥¹¬ˆ°(€€€€€É•è€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÉÁ¥­•ÈµÉ•ˆ°(€€€€€å•±±½Üè€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÉÁ¥­•Èµå•±±½Üˆ(€€€ô¤ì(€ô(€É•¹‘•É	ÕÑÑ½¸ ¤ì(€€€½¹ÍÐ‰ÕÑÑ½¸€ôÑ¡¥Ì¸‰ÕÑÑ½¸€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‰ÕÑÑ½¸ˆ¤ì(€€€‰ÕÑÑ½¸¹±…ÍÍ9…µ”€ô€‰½±½ÉA¥­•Èˆì(€€€‰ÕÑÑ½¸¹Ñ…‰%¹‘•à€ô€ˆÀˆì(€€€‰ÕÑÑ½¸¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ¥ˆ°€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÉÁ¥­•Èµ‰ÕÑÑ½¸ˆ¤ì(€€€‰ÕÑÑ½¸¹…É¥…!…ÍA½ÁÕÀ€ô€‰ÑÉÕ”ˆì(€€€¥˜€¡Ñ¡¥Ì¸•‘¥Ñ½È¤ì(€€€€€‰ÕÑÑ½¸¹…É¥…½¹ÑÉ½±Ì€ô€‘íÑ¡¥Ì¸•‘¥Ñ½È¹¥‘õ}½±½ÉÁ¥­•É}‘É½Á‘½Ý¹€ì(€€€ô(€€€½¹ÍÐÍ¥¹…°€ôÑ¡¥Ì¸Õ¥5…¹…•È¹}Í¥¹…°ì(€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¸¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¸­•å½Ý¸¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€½¹ÍÐÍÝ…Ñ €ôÑ¡¥Ì¸‰ÕÑÑ½¹MÝ…Ñ €ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰ÍÁ…¸ˆ¤ì(€€€ÍÝ…Ñ ¹±…ÍÍ9…µ”€ô€‰ÍÝ…Ñ ˆì(€€€ÍÝ…Ñ ¹…É¥…!¥‘‘•¸€ô€‰ÑÉÕ”ˆì(€€€ÍÝ…Ñ ¹ÍÑå±”¹‰…­É½Õ¹‘½±½È€ôÑ¡¥Ì¸‘•™…Õ±Ñ½±½Èì(€€€‰ÕÑÑ½¸¹…ÁÁ•¹¡ÍÝ…Ñ ¤ì(€€€É•ÑÕÉ¸‰ÕÑÑ½¸ì(€ô(€É•¹‘•É5…¥¹É½Á‘½Ý¸ ¤ì(€€€½¹ÍÐ‘É½Á‘½Ý¸€ôÑ¡¥Ì¸‘É½Á‘½Ý¸€ôÑ¡¥Ì¸•ÑÉ½Á‘½Ý¹I½½Ð ¤ì(€€€‘É½Á‘½Ý¸¹…É¥…=É¥•¹Ñ…Ñ¥½¸€ô€‰¡½É¥é½¹Ñ…°ˆì(€€€‘É½Á‘½Ý¸¹…É¥…1…‰•±±•‘	ä€ô€‰¡¥¡±¥¡Ñ½±½ÉA¥­•É1…‰•°ˆì(€€€É•ÑÕÉ¸‘É½Á‘½Ý¸ì(€ô(€€•ÑÉ½Á‘½Ý¹I½½Ð ¤ì(€€€½¹ÍÐ‘¥Ø€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€½¹ÍÐÍ¥¹…°€ôÑ¡¥Ì¸Õ¥5…¹…•È¹}Í¥¹…°ì(€€€‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰½¹Ñ•áÑµ•¹Ôˆ°¹½½¹Ñ•áÑ5•¹Ô°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€‘¥Ø¹±…ÍÍ9…µ”€ô€‰‘É½Á‘½Ý¸ˆì(€€€‘¥Ø¹É½±”€ô€‰±¥ÍÑ‰½àˆì(€€€‘¥Ø¹…É¥…5Õ±Ñ¥M•±•Ñ…‰±”€ô€‰™…±Í”ˆì(€€€‘¥Ø¹…É¥…=É¥•¹Ñ…Ñ¥½¸€ô€‰Ù•ÉÑ¥…°ˆì(€€€‘¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ¥ˆ°€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÉÁ¥­•Èµ‘É½Á‘½Ý¸ˆ¤ì(€€€¥˜€¡Ñ¡¥Ì¸•‘¥Ñ½È¤ì(€€€€€‘¥Ø¹¥€ô€‘íÑ¡¥Ì¸•‘¥Ñ½È¹¥‘õ}½±½ÉÁ¥­•É}‘É½Á‘½Ý¹€ì(€€€ô(€€€™½È€¡½¹ÍÐm¹…µ”°½±½Ét½˜Ñ¡¥Ì¸Õ¥5…¹…•È¹¡¥¡±¥¡Ñ½±½ÉÌ¤ì(€€€€€½¹ÍÐ‰ÕÑÑ½¸€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‰ÕÑÑ½¸ˆ¤ì(€€€€€‰ÕÑÑ½¸¹Ñ…‰%¹‘•à€ô€ˆÀˆì(€€€€€‰ÕÑÑ½¸¹É½±”€ô€‰½ÁÑ¥½¸ˆì(€€€€€‰ÕÑÑ½¸¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ½±½Èˆ°½±½È¤ì(€€€€€‰ÕÑÑ½¸¹Ñ¥Ñ±”€ô¹…µ”ì(€€€€€‰ÕÑÑ½¸¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ¥ˆ°½±½ÉA¥­•È¸°ÄÁ¹½±½Ém¹…µ•t¤ì(€€€€€½¹ÍÐÍÝ…Ñ €ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰ÍÁ…¸ˆ¤ì(€€€€€‰ÕÑÑ½¸¹…ÁÁ•¹¡ÍÝ…Ñ ¤ì(€€€€€ÍÝ…Ñ ¹±…ÍÍ9…µ”€ô€‰ÍÝ…Ñ ˆì(€€€€€ÍÝ…Ñ ¹ÍÑå±”¹‰…­É½Õ¹‘½±½È€ô½±½Èì(€€€€€‰ÕÑÑ½¸¹…É¥…M•±•Ñ•€ô½±½È€ôôôÑ¡¥Ì¸‘•™…Õ±Ñ½±½Èì(€€€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°Ñ¡¥Ì¸½±½ÉM•±•Ð¹‰¥¹¡Ñ¡¥Ì°½±½È¤°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€‘¥Ø¹…ÁÁ•¹¡‰ÕÑÑ½¸¤ì(€€€ô(€€€‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¸­•å½Ý¸¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€É•ÑÕÉ¸‘¥Øì(€ô(€€½±½ÉM•±•Ð¡½±½È°•Ù•¹Ð¤ì(€€€•Ù•¹Ð¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤ì(€€€Ñ¡¥Ì¸•Ù•¹Ñ	ÕÌ¹‘¥ÍÁ…Ñ  ‰ÍÝ¥Ñ¡…¹¹½Ñ…Ñ¥½¹•‘¥Ñ½ÉÁ…É…µÌˆ°ì(€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€ÑåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹!%!1%!Q}=1=H°(€€€€€Ù…±Õ”è½±½È(€€€ô¤ì(€€€Ñ¡¥Ì¹ÕÁ‘…Ñ”¡½±½È¤ì(€ô(€}½±½ÉM•±•ÑÉ½µ-•å‰½…É¡•Ù•¹Ð¤ì(€€€¥˜€¡•Ù•¹Ð¹Ñ…É•Ð€ôôôÑ¡¥Ì¸‰ÕÑÑ½¸¤ì(€€€€€Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¸¡•Ù•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ½±½È€ô•Ù•¹Ð¹Ñ…É•Ð¹•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ½±½Èˆ¤ì(€€€¥˜€ …½±½È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸½±½ÉM•±•Ð¡½±½È°•Ù•¹Ð¤ì(€ô(€}µ½Ù•Q½9•áÐ¡•Ù•¹Ð¤ì(€€€¥˜€ …Ñ¡¥Ì¸¥ÍÉ½Á‘½Ý¹Y¥Í¥‰±”¤ì(€€€€€Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¸¡•Ù•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡•Ù•¹Ð¹Ñ…É•Ð€ôôôÑ¡¥Ì¸‰ÕÑÑ½¸¤ì(€€€€€Ñ¡¥Ì¸‘É½Á‘½Ý¸¹™¥ÉÍÑ±•µ•¹Ñ¡¥±ü¹™½ÕÌ ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€•Ù•¹Ð¹Ñ…É•Ð¹¹•áÑM¥‰±¥¹œü¹™½ÕÌ ¤ì(€ô(€}µ½Ù•Q½AÉ•Ù¥½ÕÌ¡•Ù•¹Ð¤ì(€€€¥˜€¡•Ù•¹Ð¹Ñ…É•Ð€ôôôÑ¡¥Ì¸‘É½Á‘½Ý¸ü¹™¥ÉÍÑ±•µ•¹Ñ¡¥±ñð•Ù•¹Ð¹Ñ…É•Ð€ôôôÑ¡¥Ì¸‰ÕÑÑ½¸¤ì(€€€€€¥˜€¡Ñ¡¥Ì¸¥ÍÉ½Á‘½Ý¹Y¥Í¥‰±”¤ì(€€€€€€€Ñ¡¥Ì¹}¡¥‘•É½Á‘½Ý¹É½µ-•å‰½…É ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸¥ÍÉ½Á‘½Ý¹Y¥Í¥‰±”¤ì(€€€€€Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¸¡•Ù•¹Ð¤ì(€€€ô(€€€•Ù•¹Ð¹Ñ…É•Ð¹ÁÉ•Ù¥½ÕÍM¥‰±¥¹œü¹™½ÕÌ ¤ì(€ô(€}µ½Ù•Q½	•¥¹¹¥¹œ¡•Ù•¹Ð¤ì(€€€¥˜€ …Ñ¡¥Ì¸¥ÍÉ½Á‘½Ý¹Y¥Í¥‰±”¤ì(€€€€€Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¸¡•Ù•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸‘É½Á‘½Ý¸¹™¥ÉÍÑ±•µ•¹Ñ¡¥±ü¹™½ÕÌ ¤ì(€ô(€}µ½Ù•Q½¹¡•Ù•¹Ð¤ì(€€€¥˜€ …Ñ¡¥Ì¸¥ÍÉ½Á‘½Ý¹Y¥Í¥‰±”¤ì(€€€€€Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¸¡•Ù•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸‘É½Á‘½Ý¸¹±…ÍÑ±•µ•¹Ñ¡¥±ü¹™½ÕÌ ¤ì(€ô(€€­•å½Ý¸¡•Ù•¹Ð¤ì(€€€½±½ÉA¥­•È¹}­•å‰½…É‘5…¹…•È¹•á•Œ¡Ñ¡¥Ì°•Ù•¹Ð¤ì(€ô(€€½Á•¹É½Á‘½Ý¸¡•Ù•¹Ð¤ì(€€€¥˜€¡Ñ¡¥Ì¸¥ÍÉ½Á‘½Ý¹Y¥Í¥‰±”¤ì(€€€€€Ñ¡¥Ì¹¡¥‘•É½Á‘½Ý¸ ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸‘É½Á‘½Ý¹]…ÍÉ½µ-•å‰½…É€ô•Ù•¹Ð¹‘•Ñ…¥°€ôôô€Àì(€€€¥˜€ …Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¹¤ì(€€€€€Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¹€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É‘½Ý¸ˆ°Ñ¡¥Ì¸Á½¥¹Ñ•É½Ý¸¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€€€Í¥¹…°èÑ¡¥Ì¸Õ¥5…¹…•È¹½µ‰¥¹•‘M¥¹…°¡Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¹¤(€€€€€ô¤ì(€€€ô(€€€Ñ¡¥Ì¸‰ÕÑÑ½¸¹…É¥…áÁ…¹‘•€ô€‰ÑÉÕ”ˆì(€€€¥˜€¡Ñ¡¥Ì¸‘É½Á‘½Ý¸¤ì(€€€€€Ñ¡¥Ì¸‘É½Á‘½Ý¸¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ‰¡¥‘‘•¸ˆ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÉ½½Ð€ôÑ¡¥Ì¸‘É½Á‘½Ý¸€ôÑ¡¥Ì¸•ÑÉ½Á‘½Ý¹I½½Ð ¤ì(€€€Ñ¡¥Ì¸‰ÕÑÑ½¸¹…ÁÁ•¹¡É½½Ð¤ì(€ô(€€Á½¥¹Ñ•É½Ý¸¡•Ù•¹Ð¤ì(€€€¥˜€¡Ñ¡¥Ì¸‘É½Á‘½Ý¸ü¹½¹Ñ…¥¹Ì¡•Ù•¹Ð¹Ñ…É•Ð¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹¡¥‘•É½Á‘½Ý¸ ¤ì(€ô(€¡¥‘•É½Á‘½Ý¸ ¤ì(€€€Ñ¡¥Ì¸‘É½Á‘½Ý¸ü¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥‘‘•¸ˆ¤ì(€€€Ñ¡¥Ì¸‰ÕÑÑ½¸¹…É¥…áÁ…¹‘•€ô€‰™…±Í”ˆì(€€€Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¹ü¹…‰½ÉÐ ¤ì(€€€Ñ¡¥Ì¸½Á•¹É½Á‘½Ý¹€ô¹Õ±°ì(€ô(€•Ð€¥ÍÉ½Á‘½Ý¹Y¥Í¥‰±” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸‘É½Á‘½Ý¸€˜˜€…Ñ¡¥Ì¸‘É½Á‘½Ý¸¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰¡¥‘‘•¸ˆ¤ì(€ô(€}¡¥‘•É½Á‘½Ý¹É½µ-•å‰½…É ¤ì(€€€¥˜€¡Ñ¡¥Ì¸¥Í5…¥¹½±½ÉA¥­•È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸¥ÍÉ½Á‘½Ý¹Y¥Í¥‰±”¤ì(€€€€€Ñ¡¥Ì¸•‘¥Ñ½Èü¹Õ¹Í•±•Ð ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹¡¥‘•É½Á‘½Ý¸ ¤ì(€€€Ñ¡¥Ì¸‰ÕÑÑ½¸¹™½ÕÌ¡ì(€€€€€ÁÉ•Ù•¹ÑMÉ½±°èÑÉÕ”°(€€€€€™½ÕÍY¥Í¥‰±”èÑ¡¥Ì¸‘É½Á‘½Ý¹]…ÍÉ½µ-•å‰½…É(€€€ô¤ì(€ô(€ÕÁ‘…Ñ”¡½±½È¤ì(€€€¥˜€¡Ñ¡¥Ì¸‰ÕÑÑ½¹MÝ…Ñ ¤ì(€€€€€Ñ¡¥Ì¸‰ÕÑÑ½¹MÝ…Ñ ¹ÍÑå±”¹‰…­É½Õ¹‘½±½È€ô½±½Èì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸‘É½Á‘½Ý¸¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ¤€ôÑ¡¥Ì¸Õ¥5…¹…•È¹¡¥¡±¥¡Ñ½±½ÉÌ¹Ù…±Õ•Ì ¤ì(€€€™½È€¡½¹ÍÐ¡¥±½˜Ñ¡¥Ì¸‘É½Á‘½Ý¸¹¡¥±‘É•¸¤ì(€€€€€¡¥±¹…É¥…M•±•Ñ•€ô¤¹¹•áÐ ¤¹Ù…±Õ”€ôôô½±½È¹Ñ½UÁÁ•É…Í” ¤ì(€€€ô(€ô(€‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¸‰ÕÑÑ½¸ü¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸‰ÕÑÑ½¸€ô¹Õ±°ì(€€€Ñ¡¥Ì¸‰ÕÑÑ½¹MÝ…Ñ €ô¹Õ±°ì(€€€Ñ¡¥Ì¸‘É½Á‘½Ý¸ü¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸‘É½Á‘½Ý¸€ô¹Õ±°ì(€ô)ô)±…ÍÌ	…Í¥½±½ÉA¥­•Èì(€€¥¹ÁÕÐ€ô¹Õ±°ì(€€¡…Í±Á¡„€ô™…±Í”ì(€€•‘¥Ñ½È€ô¹Õ±°ì(€€Õ¥5…¹…•È€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€°ÄÁ¹½±½È€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¸•‘¥Ñ½È€ô•‘¥Ñ½Èì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È€ô•‘¥Ñ½È¹}Õ¥5…¹…•Èì(€€€	…Í¥½±½ÉA¥­•È¸°ÄÁ¹½±½Èñðô=‰©•Ð¹™É••é”¡ì(€€€€€™É••Ñ•áÐè€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÈµÁ¥­•Èµ™É•”µÑ•áÐµ¥¹ÁÕÐˆ°(€€€€€¥¹¬è€‰Á‘™©Ìµ•‘¥Ñ½Èµ½±½ÈµÁ¥­•Èµ¥¹¬µ¥¹ÁÕÐˆ(€€€ô¤ì(€ô(€É•¹‘•É	ÕÑÑ½¸ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸¥¹ÁÕÐ¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸¥¹ÁÕÐì(€€€ô(€€€½¹ÍÐì(€€€€€•‘¥Ñ½ÉQåÁ”°(€€€€€½±½ÉQåÁ”°(€€€€€½±½É¹‘=Á…¥ÑåQåÁ”°(€€€€€½Á…¥ÑåQåÁ”°(€€€€€½±½È°(€€€€€½Á…¥Ñä(€€€ô€ôÑ¡¥Ì¸•‘¥Ñ½Èì(€€€½¹ÍÐ¡…Í±Á¡„€ôÑ¡¥Ì¸¡…Í±Á¡„€ô•…ÑÕÉ•Q•ÍÐ¹¥Í±Á¡…½±½É%¹ÁÕÑMÕÁÁ½ÉÑ•€˜˜½Á…¥ÑåQåÁ”€„ôôÕ¹‘•™¥¹•ì(€€€½¹ÍÐ¥¹ÁÕÐ€ôÑ¡¥Ì¸¥¹ÁÕÐ€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰¥¹ÁÕÐˆ¤ì(€€€¥¹ÁÕÐ¹ÑåÁ”€ô€‰½±½Èˆì(€€€¥˜€¡¡…Í±Á¡„¤ì(€€€€€¥¹ÁÕÐ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…±Á¡„ˆ°€ˆˆ¤ì(€€€€€½¹ÍÐ…±Á¡…!•à€ôUÑ¥°¹¡•á9ÕµÍm5…Ñ ¹É½Õ¹ ¡½Á…¥Ñä€üü€Ä¤€¨€ÈÔÔ¥tì(€€€€€¥¹ÁÕÐ¹Ù…±Õ”€ô€¡½±½Èñð€ˆŒÀÀÀÀÀÀˆ¤€¬…±Á¡…!•àì(€€€ô•±Í”ì(€€€€€¥¹ÁÕÐ¹Ù…±Õ”€ô½±½Èñð€ˆŒÀÀÀÀÀÀˆì(€€€ô(€€€¥¹ÁÕÐ¹±…ÍÍ9…µ”€ô€‰‰…Í¥½±½ÉA¥­•Èˆì(€€€¥¹ÁÕÐ¹Ñ…‰%¹‘•à€ô€Àì(€€€¥¹ÁÕÐ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ¥ˆ°	…Í¥½±½ÉA¥­•È¸°ÄÁ¹½±½Ém•‘¥Ñ½ÉQåÁ•t¤ì(€€€¥¹ÁÕÐ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¥¹ÁÕÐˆ°€ ¤€ôøì(€€€€€¥˜€¡¡…Í±Á¡„¤ì(€€€€€€€½¹ÍÐÉ‰„€ô•ÑI	¡¥¹ÁÕÐ¹Ù…±Õ”¤ì(€€€€€€€¥˜€ …É‰„¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€½¹ÍÐmÈ°œ°ˆ°½Át€ôÉ‰„ì(€€€€€€€½¹ÍÐ¡•à€ôUÑ¥°¹µ…­•!•á½±½È¡È°œ°ˆ¤ì(€€€€€€€¥˜€¡½±½É¹‘=Á…¥ÑåQåÁ”€„ôôÕ¹‘•™¥¹•¤ì(€€€€€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹ÕÁ‘…Ñ•A…É…µÌ¡½±½É¹‘=Á…¥ÑåQåÁ”°ì(€€€€€€€€€€€½±½Èè¡•à°(€€€€€€€€€€€½Á…¥Ñäè½À(€€€€€€€€€ô¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹ÕÁ‘…Ñ•A…É…µÌ¡½±½ÉQåÁ”°¡•à¤ì(€€€€€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹ÕÁ‘…Ñ•A…É…µÌ¡½Á…¥ÑåQåÁ”°½À¤ì(€€€€€€€ô(€€€€€ô•±Í”ì(€€€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹ÕÁ‘…Ñ•A…É…µÌ¡½±½ÉQåÁ”°¥¹ÁÕÐ¹Ù…±Õ”¤ì(€€€€€ô(€€€ô°ì(€€€€€Í¥¹…°èÑ¡¥Ì¸Õ¥5…¹…•È¹}Í¥¹…°(€€€ô¤ì(€€€É•ÑÕÉ¸¥¹ÁÕÐì(€ô(€ÕÁ‘…Ñ”¡Ù…±Õ”¤ì(€€€¥˜€ …Ñ¡¥Ì¸¥¹ÁÕÐ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸¡…Í±Á¡„¤ì(€€€€€½¹ÍÐ…±Á¡…!•à€ôUÑ¥°¹¡•á9ÕµÍm5…Ñ ¹É½Õ¹¡Ñ¡¥Ì¸•‘¥Ñ½È¹½Á…¥Ñä€¨€ÈÔÔ¥tì(€€€€€Ñ¡¥Ì¸¥¹ÁÕÐ¹Ù…±Õ”€ôÙ…±Õ”€¬…±Á¡…!•àì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¸¥¹ÁÕÐ¹Ù…±Õ”€ôÙ…±Õ”ì(€€€ô(€ô(€ÕÁ‘…Ñ•=Á…¥Ñä¡Ù…±Õ”¤ì(€€€¥˜€ …Ñ¡¥Ì¸¥¹ÁÕÐñð€…Ñ¡¥Ì¸¡…Í±Á¡„¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ…±Á¡…!•à€ôUÑ¥°¹¡•á9ÕµÍm5…Ñ ¹É½Õ¹¡Ù…±Õ”€¨€ÈÔÔ¥tì(€€€Ñ¡¥Ì¸¥¹ÁÕÐ¹Ù…±Õ”€ôÑ¡¥Ì¸•‘¥Ñ½È¹½±½È€¬…±Á¡…!•àì(€ô(€‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¸¥¹ÁÕÐü¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸¥¹ÁÕÐ€ô¹Õ±°ì(€ô(€¡¥‘•É½Á‘½Ý¸ ¤íô)ô((ì¼¼€¸½ÍÉŒ½Í¡…É•½ÍÉ¥ÁÑ¥¹}ÕÑ¥±Ì¹©Ì()™Õ¹Ñ¥½¸µ…­•½±½É½µÀ¡¸¤ì(€É•ÑÕÉ¸5…Ñ ¹™±½½È¡5…Ñ¡±…µÀ¡¸°€À°€Ä¤€¨€ÈÔÔ¤¹Ñ½MÑÉ¥¹œ ÄØ¤¹Á…‘MÑ…ÉÐ È°€ˆÀˆ¤ì)ô)™Õ¹Ñ¥½¸Í…±•¹‘±…µÀ¡à¤ì(€É•ÑÕÉ¸5…Ñ¡±…µÀ¡à°€À°€Ä¤€¨€ÈÔÔì)ô)±…ÍÌ½±½É½¹Ù•ÉÑ•ÉÌì(€ÍÑ…Ñ¥Œ5e-}¡mŒ°ä°´°­t¤ì(€€€É•ÑÕÉ¸l‰ˆ°€Ä€´5…Ñ ¹µ¥¸ Ä°€À¸Ì€¨Œ€¬€À¸Ôä€¨´€¬€À¸ÄÄ€¨ä€¬¬¥tì(€ô(€ÍÑ…Ñ¥Œ}5e,¡mt¤ì(€€€É•ÑÕÉ¸l‰5e,ˆ°€À°€À°€À°€Ä€´tì(€ô(€ÍÑ…Ñ¥Œ}I¡mt¤ì(€€€É•ÑÕÉ¸l‰Iˆ°œ°œ°tì(€ô(€ÍÑ…Ñ¥Œ}Éˆ¡mt¤ì(€€€œ€ôÍ…±•¹‘±…µÀ¡œ¤ì(€€€É•ÑÕÉ¸mœ°œ°tì(€ô(€ÍÑ…Ñ¥Œ}!Q50¡mt¤ì(€€€½¹ÍÐ€ôµ…­•½±½É½µÀ¡œ¤ì(€€€É•ÑÕÉ¸€Œ‘íô‘íô‘íõ€ì(€ô(€ÍÑ…Ñ¥ŒI	}¡mÈ°œ°‰t¤ì(€€€É•ÑÕÉ¸l‰ˆ°€À¸Ì€¨È€¬€À¸Ôä€¨œ€¬€À¸ÄÄ€¨‰tì(€ô(€ÍÑ…Ñ¥ŒI	}Éˆ¡½±½È¤ì(€€€É•ÑÕÉ¸½±½È¹µ…À¡Í…±•¹‘±…µÀ¤ì(€ô(€ÍÑ…Ñ¥ŒI	}!Q50¡½±½È¤ì(€€€É•ÑÕÉ¸€Œ‘í½±½È¹µ…À¡µ…­•½±½É½µÀ¤¹©½¥¸ ˆˆ¥õ€ì(€ô(€ÍÑ…Ñ¥ŒQ}!Q50 ¤ì(€€€É•ÑÕÉ¸€ˆŒÀÀÀÀÀÀÀÀˆì(€ô(€ÍÑ…Ñ¥ŒQ}Éˆ ¤ì(€€€É•ÑÕÉ¸m¹Õ±±tì(€ô(€ÍÑ…Ñ¥Œ5e-}I¡mŒ°ä°´°­t¤ì(€€€É•ÑÕÉ¸l‰Iˆ°€Ä€´5…Ñ ¹µ¥¸ Ä°Œ€¬¬¤°€Ä€´5…Ñ ¹µ¥¸ Ä°´€¬¬¤°€Ä€´5…Ñ ¹µ¥¸ Ä°ä€¬¬¥tì(€ô(€ÍÑ…Ñ¥Œ5e-}Éˆ¡mŒ°ä°´°­t¤ì(€€€É•ÑÕÉ¸mÍ…±•¹‘±…µÀ Ä€´5…Ñ ¹µ¥¸ Ä°Œ€¬¬¤¤°Í…±•¹‘±…µÀ Ä€´5…Ñ ¹µ¥¸ Ä°´€¬¬¤¤°Í…±•¹‘±…µÀ Ä€´5…Ñ ¹µ¥¸ Ä°ä€¬¬¤¥tì(€ô(€ÍÑ…Ñ¥Œ5e-}!Q50¡½µÁ½¹•¹ÑÌ¤ì(€€€½¹ÍÐÉˆ€ôÑ¡¥Ì¹5e-}I¡½µÁ½¹•¹ÑÌ¤¹Í±¥” Ä¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹I	}!Q50¡Éˆ¤ì(€ô(€ÍÑ…Ñ¥ŒI	}5e,¡mÈ°œ°‰t¤ì(€€€½¹ÍÐŒ€ô€Ä€´Èì(€€€½¹ÍÐ´€ô€Ä€´œì(€€€½¹ÍÐä€ô€Ä€´ˆì(€€€½¹ÍÐ¬€ô5…Ñ ¹µ¥¸¡Œ°´°ä¤ì(€€€É•ÑÕÉ¸l‰5e,ˆ°Œ°´°ä°­tì(€ô)ô)½¹ÍÐ…Ñ•½Éµ…ÑÌ€ô€ ¼¨Õ¹ÕÍ•ÁÕÉ”•áÁÉ•ÍÍ¥½¸½ÈÍÕÁ•È€¨¼¹Õ±°€˜˜€¡l‰´½ˆ°€‰´½½åäˆ°€‰µ´½‘½åäˆ°€‰µ´½åäˆ°€‰µµµ´ˆ°€‰µµµ´µåäˆ°€‰‘µµµ´µåäˆ°€‰åäµµ´µ‘ˆ°€‰µµ´µåäˆ°€‰µµµ´µåäˆ°€‰µµ´°åååäˆ°€‰µµµ´°åååäˆ°€‰´½½åä é54ÑÐˆ°€‰´½½åä! é54‰t¤¤ì)½¹ÍÐQ¥µ•½Éµ…ÑÌ€ô€ ¼¨Õ¹ÕÍ•ÁÕÉ”•áÁÉ•ÍÍ¥½¸½ÈÍÕÁ•È€¨¼¹Õ±°€˜˜€¡l‰! é54ˆ°€‰ é54ÑÐˆ°€‰! é54éÍÌˆ°€‰ é54éÍÌÑÐ‰t¤¤ì((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½ÍÙ}™…Ñ½Éä¹©Ì()±…ÍÌ	…Í•MY…Ñ½Éäì(€É•…Ñ”¡Ý¥‘Ñ °¡•¥¡Ð°Í­¥Á¥µ•¹Í¥½¹Ì€ô™…±Í”¤ì(€€€¥˜€¡Ý¥‘Ñ €ðô€Àñð¡•¥¡Ð€ðô€À¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰%¹Ù…±¥MY‘¥µ•¹Í¥½¹Ìˆ¤ì(€€€ô(€€€½¹ÍÐÍÙœ€ôÑ¡¥Ì¹}É•…Ñ•MY ‰ÍÙœéÍÙœˆ¤ì(€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ù•ÉÍ¥½¸ˆ°€ˆÄ¸Äˆ¤ì(€€€¥˜€ …Í­¥Á¥µ•¹Í¥½¹Ì¤ì(€€€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ý¥‘Ñ ˆ°€‘íÝ¥‘Ñ¡õÁá€¤ì(€€€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡•¥¡Ðˆ°€‘í¡•¥¡ÑõÁá€¤ì(€€€ô(€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÁÉ•Í•ÉÙ•ÍÁ•ÑI…Ñ¥¼ˆ°€‰¹½¹”ˆ¤ì(€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ù¥•Ý	½àˆ°€À€À€‘íÝ¥‘Ñ¡ô€‘í¡•¥¡Ñõ€¤ì(€€€É•ÑÕÉ¸ÍÙœì(€ô(€É•…Ñ•±•µ•¹Ð¡ÑåÁ”¤ì(€€€¥˜€¡ÑåÁ•½˜ÑåÁ”€„ôô€‰ÍÑÉ¥¹œˆ¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰%¹Ù…±¥MY•±•µ•¹ÐÑåÁ”ˆ¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}É•…Ñ•MY¡ÑåÁ”¤ì(€ô(€}É•…Ñ•MY¡ÑåÁ”¤ì(€€€Õ¹É•…¡…‰±” ‰‰ÍÑÉ…Ðµ•Ñ¡½}É•…Ñ•MY€…±±•¸ˆ¤ì(€ô)ô)±…ÍÌ=5MY…Ñ½Éä•áÑ•¹‘Ì	…Í•MY…Ñ½Éäì(€}É•…Ñ•MY¡ÑåÁ”¤ì(€€€É•ÑÕÉ¸‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ñ9L¡MY}9L°ÑåÁ”¤ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½…¹¹½Ñ…Ñ¥½¹}±…å•È¹©Ì((((()½¹ÍÐ…¹¹½Ñ…Ñ¥½¹}±…å•É}U1Q}=9Q}M%i€ô€äì)½¹ÍÐ•Ñ±•µ•¹ÑÍ	å9…µ•M•Ð€ô¹•Ü]•…­M•Ð ¤ì)½¹ÍÐQ%5i=9}=MP€ô¹•Ü…Ñ” ¤¹•ÑQ¥µ•é½¹•=™™Í•Ð ¤€¨€ØÀ€¨€ÄÀÀÀì)±…ÍÌ¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ…Ñ½Éäì(€ÍÑ…Ñ¥ŒÉ•…Ñ”¡Á…É…µ•Ñ•ÉÌ¤ì(€€€½¹ÍÐÍÕ‰ÑåÁ”€ôÁ…É…µ•Ñ•ÉÌ¹‘…Ñ„¹…¹¹½Ñ…Ñ¥½¹QåÁ”ì(€€€ÍÝ¥Ñ €¡ÍÕ‰ÑåÁ”¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹1%9,è(€€€€€€€É•ÑÕÉ¸¹•Ü1¥¹­¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹QaPè(€€€€€€€É•ÑÕÉ¸¹•ÜQ•áÑ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹]%Pè(€€€€€€€½¹ÍÐ™¥•±‘QåÁ”€ôÁ…É…µ•Ñ•ÉÌ¹‘…Ñ„¹™¥•±‘QåÁ”ì(€€€€€€€ÍÝ¥Ñ €¡™¥•±‘QåÁ”¤ì(€€€€€€€€€…Í”€‰Qàˆè(€€€€€€€€€€€É•ÑÕÉ¸¹•ÜQ•áÑ]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€€€€€…Í”€‰	Ñ¸ˆè(€€€€€€€€€€€¥˜€¡Á…É…µ•Ñ•ÉÌ¹‘…Ñ„¹É…‘¥½	ÕÑÑ½¸¤ì(€€€€€€€€€€€€€É•ÑÕÉ¸¹•ÜI…‘¥½	ÕÑÑ½¹]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€€€€€€€ô•±Í”¥˜€¡Á…É…µ•Ñ•ÉÌ¹‘…Ñ„¹¡•­	½à¤ì(€€€€€€€€€€€€€É•ÑÕÉ¸¹•Ü¡•­‰½á]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€É•ÑÕÉ¸¹•ÜAÕÍ¡	ÕÑÑ½¹]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€€€€€…Í”€‰ ˆè(€€€€€€€€€€€É•ÑÕÉ¸¹•Ü¡½¥•]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€€€€€…Í”€‰M¥œˆè(€€€€€€€€€€€É•ÑÕÉ¸¹•ÜM¥¹…ÑÕÉ•]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€€€ô(€€€€€€€É•ÑÕÉ¸¹•Ü]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹A=AU@è(€€€€€€€É•ÑÕÉ¸¹•ÜA½ÁÕÁ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹IQaPè(€€€€€€€É•ÑÕÉ¸¹•ÜÉ••Q•áÑ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹1%9è(€€€€€€€É•ÑÕÉ¸¹•Ü1¥¹•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹MEUIè(€€€€€€€É•ÑÕÉ¸¹•ÜMÅÕ…É•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹%I1è(€€€€€€€É•ÑÕÉ¸¹•Ü¥É±•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹A=1e1%9è(€€€€€€€É•ÑÕÉ¸¹•ÜA½±å±¥¹•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹IPè(€€€€€€€É•ÑÕÉ¸¹•Ü…É•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹%9,è(€€€€€€€É•ÑÕÉ¸¹•Ü%¹­¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹A=1e=8è(€€€€€€€É•ÑÕÉ¸¹•ÜA½±å½¹¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹!%!1%!Pè(€€€€€€€É•ÑÕÉ¸¹•Ü!¥¡±¥¡Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹U9I1%9è(€€€€€€€É•ÑÕÉ¸¹•ÜU¹‘•É±¥¹•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹MEU%1dè(€€€€€€€É•ÑÕÉ¸¹•ÜMÅÕ¥±å¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹MQI%-=UPè(€€€€€€€É•ÑÕÉ¸¹•ÜMÑÉ¥­•=ÕÑ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹MQ5@è(€€€€€€€É•ÑÕÉ¸¹•ÜMÑ…µÁ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹%1QQ!59Pè(€€€€€€€É•ÑÕÉ¸¹•Ü¥±•ÑÑ…¡µ•¹Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹I%!5%è(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹MI8è(€€€€€…Í”¹¹½Ñ…Ñ¥½¹QåÁ”¹M=U9è(€€€€€€€É•ÑÕÉ¸¹•Ü5•‘¥…¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€€€‘•™…Õ±Ðè(€€€€€€€É•ÑÕÉ¸¹•Ü¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ô(€ô)ô)±…ÍÌ¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€€ÕÁ‘…Ñ•Ì€ô¹Õ±°ì(€€¡…Í	½É‘•È€ô™…±Í”ì(€€Á½ÁÕÁ±•µ•¹Ð€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ°ì(€€€¥ÍI•¹‘•É…‰±”€ô™…±Í”°(€€€¥¹½É•	½É‘•È€ô™…±Í”°(€€€É•…Ñ•EÕ…‘É¥±…Ñ•É…±Ì€ô™…±Í”(€ô€ôíô¤ì(€€€Ñ¡¥Ì¹¥ÍI•¹‘•É…‰±”€ô¥ÍI•¹‘•É…‰±”ì(€€€Ñ¡¥Ì¹‘…Ñ„€ôÁ…É…µ•Ñ•ÉÌ¹‘…Ñ„ì(€€€Ñ¡¥Ì¹±…å•È€ôÁ…É…µ•Ñ•ÉÌ¹±…å•Èì(€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”€ôÁ…É…µ•Ñ•ÉÌ¹±¥¹­M•ÉÙ¥”ì(€€€Ñ¡¥Ì¹‘½Ý¹±½…‘5…¹…•È€ôÁ…É…µ•Ñ•ÉÌ¹‘½Ý¹±½…‘5…¹…•Èì(€€€Ñ¡¥Ì¹¥µ…•I•Í½ÕÉ•ÍA…Ñ €ôÁ…É…µ•Ñ•ÉÌ¹¥µ…•I•Í½ÕÉ•ÍA…Ñ ì(€€€Ñ¡¥Ì¹É•¹‘•É½ÉµÌ€ôÁ…É…µ•Ñ•ÉÌ¹É•¹‘•É½ÉµÌì(€€€Ñ¡¥Ì¹ÍÙ…Ñ½Éä€ôÁ…É…µ•Ñ•ÉÌ¹ÍÙ…Ñ½Éäì(€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”€ôÁ…É…µ•Ñ•ÉÌ¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€€€Ñ¡¥Ì¹•¹…‰±•½µµ•¹Ð€ôÁ…É…µ•Ñ•ÉÌ¹•¹…‰±•½µµ•¹Ðì(€€€Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ€ôÁ…É…µ•Ñ•ÉÌ¹•¹…‰±•MÉ¥ÁÑ¥¹œì(€€€Ñ¡¥Ì¹¡…Í)MÑ¥½¹Ì€ôÁ…É…µ•Ñ•ÉÌ¹¡…Í)MÑ¥½¹Ìì(€€€Ñ¡¥Ì¹}™¥•±‘=‰©•ÑÌ€ôÁ…É…µ•Ñ•ÉÌ¹™¥•±‘=‰©•ÑÌì(€€€Ñ¡¥Ì¹Á…É•¹Ð€ôÁ…É…µ•Ñ•ÉÌ¹Á…É•¹Ðì(€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ô™…±Í”ì(€€€¥˜€¡¥ÍI•¹‘•É…‰±”¤ì(€€€€€Ñ¡¥Ì¹½¹Ñ•¹Ñ±•µ•¹Ð€ôÑ¡¥Ì¹½¹Ñ…¥¹•È€ôÑ¡¥Ì¹}É•…Ñ•½¹Ñ…¥¹•È¡¥¹½É•	½É‘•È¤ì(€€€ô(€€€¥˜€¡É•…Ñ•EÕ…‘É¥±…Ñ•É…±Ì¤ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•EÕ…‘É¥±…Ñ•É…±Ì ¤ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ}¡…ÍA½ÁÕÁ…Ñ„¡ì(€€€½¹Ñ•¹ÑÍ=‰¨°(€€€É¥¡Q•áÐ(€ô¤ì(€€€É•ÑÕÉ¸€„„¡½¹Ñ•¹ÑÍ=‰¨ü¹ÍÑÈñðÉ¥¡Q•áÐü¹ÍÑÈ¤ì(€ô(€•Ð}¥Í‘¥Ñ…‰±” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘…Ñ„¹¥Í‘¥Ñ…‰±”ì(€ô(€•Ð¡…ÍA½ÁÕÁ…Ñ„ ¤ì(€€€É•ÑÕÉ¸¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¹}¡…ÍA½ÁÕÁ…Ñ„¡Ñ¡¥Ì¹‘…Ñ„¤ñðÑ¡¥Ì¹•¹…‰±•½µµ•¹Ð€˜˜€„…Ñ¡¥Ì¹½µµ•¹ÑQ•áÐì(€ô(€•Ð½µµ•¹Ñ…Ñ„ ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐ•‘¥Ñ½È€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ü¹•Ñ‘¥Ñ½È¡‘…Ñ„¹¥¤ì(€€€¥˜€¡•‘¥Ñ½È¤ì(€€€€€É•ÑÕÉ¸•‘¥Ñ½È¹•Ñ…Ñ„ ¤ì(€€€ô(€€€É•ÑÕÉ¸‘…Ñ„ì(€ô(€•Ð¡…Í½µµ•¹Ñ	ÕÑÑ½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹•¹…‰±•½µµ•¹Ð€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ±•µ•¹Ðì(€ô(€•Ð½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€½¹ÍÐ•‘¥Ñ½È€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ü¹•Ñ‘¥Ñ½È¡Ñ¡¥Ì¹‘…Ñ„¹¥¤ì(€€€¥˜€¡•‘¥Ñ½È¤ì(€€€€€É•ÑÕÉ¸•‘¥Ñ½È¹½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¹%¹A…”ì(€€€ô(€€€½¹ÍÐì(€€€€€ÅÕ…‘A½¥¹ÑÌ°(€€€€€¥¹­1¥ÍÑÌ°(€€€€€É•Ð(€€€ô€ôÑ¡¥Ì¹‘…Ñ„ì(€€€±•Ðµ…á`€ô€µ%¹™¥¹¥Ñäì(€€€±•Ðµ…ád€ô€µ%¹™¥¹¥Ñäì(€€€¥˜€¡ÅÕ…‘A½¥¹ÑÌü¹±•¹Ñ €øô€à¤ì(€€€€€™½È€¡±•Ð¤€ô€Àì¤€ðÅÕ…‘A½¥¹ÑÌ¹±•¹Ñ ì¤€¬ô€à¤ì(€€€€€€€¥˜€¡ÅÕ…‘A½¥¹ÑÍm¤€¬€Åt€øµ…ád¤ì(€€€€€€€€€µ…ád€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Åtì(€€€€€€€€€µ…á`€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Étì(€€€€€€€ô•±Í”¥˜€¡ÅÕ…‘A½¥¹ÑÍm¤€¬€Åt€ôôôµ…ád¤ì(€€€€€€€€€µ…á`€ô5…Ñ ¹µ…à¡µ…á`°ÅÕ…‘A½¥¹ÑÍm¤€¬€Ét¤ì(€€€€€€€ô(€€€€€ô(€€€€€É•ÑÕÉ¸mµ…á`°µ…áetì(€€€ô(€€€¥˜€¡¥¹­1¥ÍÑÌü¹±•¹Ñ €øô€Ä¤ì(€€€€€™½È€¡½¹ÍÐ¥¹­1¥ÍÐ½˜¥¹­1¥ÍÑÌ¤ì(€€€€€€€™½È€¡±•Ð¤€ô€À°¥¤€ô¥¹­1¥ÍÐ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€€€€€¥˜€¡¥¹­1¥ÍÑm¤€¬€Åt€øµ…ád¤ì(€€€€€€€€€€€µ…ád€ô¥¹­1¥ÍÑm¤€¬€Åtì(€€€€€€€€€€€µ…á`€ô¥¹­1¥ÍÑm¥tì(€€€€€€€€€ô•±Í”¥˜€¡¥¹­1¥ÍÑm¤€¬€Åt€ôôôµ…ád¤ì(€€€€€€€€€€€µ…á`€ô5…Ñ ¹µ…à¡µ…á`°¥¹­1¥ÍÑm¥t¤ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô(€€€€€¥˜€¡µ…á`€„ôô%¹™¥¹¥Ñä¤ì(€€€€€€€É•ÑÕÉ¸mµ…á`°µ…áetì(€€€€€ô(€€€ô(€€€¥˜€¡É•Ð¤ì(€€€€€É•ÑÕÉ¸mÉ•ÑlÉt°É•ÑlÍutì(€€€ô(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€}¹½Éµ…±¥é•A½¥¹Ð¡Á½¥¹Ð¤ì(€€€½¹ÍÐì(€€€€€Á…”èì(€€€€€€€Ù¥•Ü(€€€€€ô°(€€€€€Ù¥•ÝÁ½ÉÐèì(€€€€€€€É…Ý¥µÌèì(€€€€€€€€€Á…•]¥‘Ñ °(€€€€€€€€€Á…•!•¥¡Ð°(€€€€€€€€€Á…•`°(€€€€€€€€€Á…•d(€€€€€€€ô(€€€€€ô(€€€ô€ôÑ¡¥Ì¹Á…É•¹Ðì(€€€Á½¥¹ÑlÅt€ôÙ¥•ÝlÍt€´Á½¥¹ÑlÅt€¬Ù¥•ÝlÅtì(€€€Á½¥¹ÑlÁt€ô€ÄÀÀ€¨€¡Á½¥¹ÑlÁt€´Á…•`¤€¼Á…•]¥‘Ñ ì(€€€Á½¥¹ÑlÅt€ô€ÄÀÀ€¨€¡Á½¥¹ÑlÅt€´Á…•d¤€¼Á…•!•¥¡Ðì(€€€É•ÑÕÉ¸Á½¥¹Ðì(€ô(€•Ð½µµ•¹ÑQ•áÐ ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„(€€€ô€ôÑ¡¥Ìì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹•ÑI…ÝY…±Õ”¡€‘í¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉAÉ•™¥áô‘í‘…Ñ„¹¥‘õ€¤ü¹Á½ÁÕÀü¹½¹Ñ•¹ÑÌñð‘…Ñ„¹½¹Ñ•¹ÑÍ=‰¨ü¹ÍÑÈñð€ˆˆì(€ô(€Í•Ð½µµ•¹ÑQ•áÐ¡Ñ•áÐ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐÁ½ÁÕÀ€ôì(€€€€€‘•±•Ñ•è€…Ñ•áÐ°(€€€€€½¹Ñ•¹ÑÌèÑ•áÐñð€ˆˆ(€€€ôì(€€€¥˜€ …Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹ÕÁ‘…Ñ•‘¥Ñ½È¡‘…Ñ„¹¥°ì(€€€€€Á½ÁÕÀ(€€€ô¤¤ì(€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•ÑY…±Õ”¡€‘í¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉAÉ•™¥áô‘í‘…Ñ„¹¥‘õ€°ì(€€€€€€€¥è‘…Ñ„¹¥°(€€€€€€€…¹¹½Ñ…Ñ¥½¹QåÁ”è‘…Ñ„¹…¹¹½Ñ…Ñ¥½¹QåÁ”°(€€€€€€€Á…”èÑ¡¥Ì¹Á…É•¹Ð¹Á…”°(€€€€€€€Á½ÁÕÀ°(€€€€€€€Á½ÁÕÁI•˜è‘…Ñ„¹Á½ÁÕÁI•˜°(€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”è¹•Ü…Ñ” ¤(€€€€€ô¤ì(€€€ô(€€€¥˜€ …Ñ•áÐ¤ì(€€€€€Ñ¡¥Ì¹É•µ½Ù•A½ÁÕÀ ¤ì(€€€ô(€ô(€É•µ½Ù•A½ÁÕÀ ¤ì(€€€€¡Ñ¡¥Ì¸Á½ÁÕÁ±•µ•¹Ðü¹Á½ÁÕÀñðÑ¡¥Ì¹Á½ÁÕÀ¤ü¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸Á½ÁÕÁ±•µ•¹Ð€ôÑ¡¥Ì¹Á½ÁÕÀ€ô¹Õ±°ì(€ô(€ÕÁ‘…Ñ•‘¥Ñ•¡Á…É…µÌ¤ì(€€€¥˜€ …Ñ¡¥Ì¹½¹Ñ…¥¹•È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Á…É…µÌ¹É•Ð¤ì(€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•Ìñðôì(€€€€€€€É•ÐèÑ¡¥Ì¹‘…Ñ„¹É•Ð¹Í±¥” À¤(€€€€€ôì(€€€ô(€€€½¹ÍÐì(€€€€€É•Ð°(€€€€€Á½ÁÕÀè¹•ÝA½ÁÕÀ(€€€ô€ôÁ…É…µÌì(€€€¥˜€¡É•Ð¤ì(€€€€€Ñ¡¥Ì¸Í•ÑI•Ñ‘¥Ñ•¡É•Ð¤ì(€€€ô(€€€±•ÐÁ½ÁÕÀ€ôÑ¡¥Ì¸Á½ÁÕÁ±•µ•¹Ðü¹Á½ÁÕÀñðÑ¡¥Ì¹Á½ÁÕÀì(€€€¥˜€ …Á½ÁÕÀ€˜˜¹•ÝA½ÁÕÀü¹Ñ•áÐ¤ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ¡¹•ÝA½ÁÕÀ¤ì(€€€€€Á½ÁÕÀ€ôÑ¡¥Ì¸Á½ÁÕÁ±•µ•¹Ð¹Á½ÁÕÀì(€€€ô(€€€¥˜€ …Á½ÁÕÀ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Á½ÁÕÀ¹ÕÁ‘…Ñ•‘¥Ñ•¡Á…É…µÌ¤ì(€€€¥˜€¡¹•ÝA½ÁÕÀü¹‘•±•Ñ•¤ì(€€€€€Á½ÁÕÀ¹É•µ½Ù” ¤ì(€€€€€Ñ¡¥Ì¸Á½ÁÕÁ±•µ•¹Ð€ô¹Õ±°ì(€€€€€Ñ¡¥Ì¹Á½ÁÕÀ€ô¹Õ±°ì(€€€ô(€ô(€É•Í•Ñ‘¥Ñ• ¤ì(€€€¥˜€ …Ñ¡¥Ì¸ÕÁ‘…Ñ•Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸Í•ÑI•Ñ‘¥Ñ•¡Ñ¡¥Ì¸ÕÁ‘…Ñ•Ì¹É•Ð¤ì(€€€Ñ¡¥Ì¸Á½ÁÕÁ±•µ•¹Ðü¹Á½ÁÕÀ¹É•Í•Ñ‘¥Ñ• ¤ì(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•Ì€ô¹Õ±°ì(€ô(€€Í•ÑI•Ñ‘¥Ñ•¡É•Ð¤ì(€€€½¹ÍÐì(€€€€€½¹Ñ…¥¹•Èèì(€€€€€€€ÍÑå±”(€€€€€ô°(€€€€€‘…Ñ„èì(€€€€€€€É•ÐèÕÉÉ•¹ÑI•Ð°(€€€€€€€É½Ñ…Ñ¥½¸(€€€€€ô°(€€€€€Á…É•¹Ðèì(€€€€€€€Ù¥•ÝÁ½ÉÐèì(€€€€€€€€€É…Ý¥µÌèì(€€€€€€€€€€€Á…•]¥‘Ñ °(€€€€€€€€€€€Á…•!•¥¡Ð°(€€€€€€€€€€€Á…•`°(€€€€€€€€€€€Á…•d(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€ÕÉÉ•¹ÑI•Ðü¹ÍÁ±¥” À°€Ð°€¸¸¹É•Ð¤ì(€€€ÍÑå±”¹±•™Ð€ô€‘ìÄÀÀ€¨€¡É•ÑlÁt€´Á…•`¤€¼Á…•]¥‘Ñ¡ô•€ì(€€€ÍÑå±”¹Ñ½À€ô€‘ìÄÀÀ€¨€¡Á…•!•¥¡Ð€´É•ÑlÍt€¬Á…•d¤€¼Á…•!•¥¡Ñô•€ì(€€€¥˜€¡É½Ñ…Ñ¥½¸€ôôô€À¤ì(€€€€€ÍÑå±”¹Ý¥‘Ñ €ô€‘ìÄÀÀ€¨€¡É•ÑlÉt€´É•ÑlÁt¤€¼Á…•]¥‘Ñ¡ô•€ì(€€€€€ÍÑå±”¹¡•¥¡Ð€ô€‘ìÄÀÀ€¨€¡É•ÑlÍt€´É•ÑlÅt¤€¼Á…•!•¥¡Ñô•€ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹Í•ÑI½Ñ…Ñ¥½¸¡É½Ñ…Ñ¥½¸¤ì(€€€ô(€ô(€}É•…Ñ•½¹Ñ…¥¹•È¡¥¹½É•	½É‘•È¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„°(€€€€€Á…É•¹Ðèì(€€€€€€€Á…”°(€€€€€€€Ù¥•ÝÁ½ÉÐ(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐ½¹Ñ…¥¹•È€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰Í•Ñ¥½¸ˆ¤ì(€€€½¹Ñ…¥¹•È¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ…¹¹½Ñ…Ñ¥½¸µ¥ˆ°‘…Ñ„¹¥¤ì(€€€¥˜€ „¡Ñ¡¥Ì¥¹ÍÑ…¹•½˜]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤€˜˜€„¡Ñ¡¥Ì¥¹ÍÑ…¹•½˜1¥¹­¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤€˜˜€„¡Ñ¡¥Ì¥¹ÍÑ…¹•½˜5•‘¥…¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤¤ì(€€€€€½¹Ñ…¥¹•È¹Ñ…‰%¹‘•à€ô€Àì(€€€ô(€€€½¹ÍÐì(€€€€€ÍÑå±”(€€€ô€ô½¹Ñ…¥¹•Èì(€€€ÍÑå±”¹é%¹‘•à€ôÑ¡¥Ì¹Á…É•¹Ð¹é%¹‘•àì(€€€Ñ¡¥Ì¹Á…É•¹Ð¹é%¹‘•à€¬ô€Èì(€€€¥˜€¡‘…Ñ„¹…±Ñ•É¹…Ñ¥Ù•Q•áÐ¤ì(€€€€€½¹Ñ…¥¹•È¹Ñ¥Ñ±”€ô‘…Ñ„¹…±Ñ•É¹…Ñ¥Ù•Q•áÐì(€€€ô(€€€¥˜€¡‘…Ñ„¹¹½I½Ñ…Ñ”¤ì(€€€€€½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¹½É½Ñ…Ñ”ˆ¤ì(€€€ô(€€€¥˜€ …‘…Ñ„¹É•ÐñðÑ¡¥Ì¥¹ÍÑ…¹•½˜A½ÁÕÁ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤ì(€€€€€½¹ÍÐì(€€€€€€€É½Ñ…Ñ¥½¸(€€€€€ô€ô‘…Ñ„ì(€€€€€¥˜€ …‘…Ñ„¹¡…Í=Ý¹…¹Ù…Ì€˜˜É½Ñ…Ñ¥½¸€„ôô€À¤ì(€€€€€€€Ñ¡¥Ì¹Í•ÑI½Ñ…Ñ¥½¸¡É½Ñ…Ñ¥½¸°½¹Ñ…¥¹•È¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸½¹Ñ…¥¹•Èì(€€€ô(€€€½¹ÍÐì(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ìì(€€€¥˜€ …¥¹½É•	½É‘•È€˜˜‘…Ñ„¹‰½É‘•ÉMÑå±”¹Ý¥‘Ñ €ø€À¤ì(€€€€€ÍÑå±”¹‰½É‘•É]¥‘Ñ €ô€‘í‘…Ñ„¹‰½É‘•ÉMÑå±”¹Ý¥‘Ñ¡õÁá€ì(€€€€€½¹ÍÐ¡½É¥é½¹Ñ…±I…‘¥ÕÌ€ô‘…Ñ„¹‰½É‘•ÉMÑå±”¹¡½É¥é½¹Ñ…±½É¹•ÉI…‘¥ÕÌì(€€€€€½¹ÍÐÙ•ÉÑ¥…±I…‘¥ÕÌ€ô‘…Ñ„¹‰½É‘•ÉMÑå±”¹Ù•ÉÑ¥…±½É¹•ÉI…‘¥ÕÌì(€€€€€¥˜€¡¡½É¥é½¹Ñ…±I…‘¥ÕÌ€ø€ÀñðÙ•ÉÑ¥…±I…‘¥ÕÌ€ø€À¤ì(€€€€€€€½¹ÍÐÉ…‘¥ÕÌ€ô…±Œ ‘í¡½É¥é½¹Ñ…±I…‘¥ÕÍõÁà€¨Ù…È ´µÑ½Ñ…°µÍ…±”µ™…Ñ½È¤¤€¼…±Œ ‘íÙ•ÉÑ¥…±I…‘¥ÕÍõÁà€¨Ù…È ´µÑ½Ñ…°µÍ…±”µ™…Ñ½È¤¥€ì(€€€€€€€ÍÑå±”¹‰½É‘•ÉI…‘¥ÕÌ€ôÉ…‘¥ÕÌì(€€€€€ô(€€€€€ÍÝ¥Ñ €¡‘…Ñ„¹‰½É‘•ÉMÑå±”¹ÍÑå±”¤ì(€€€€€€€…Í”¹¹½Ñ…Ñ¥½¹	½É‘•ÉMÑå±•QåÁ”¹M=1%è(€€€€€€€€€ÍÑå±”¹‰½É‘•ÉMÑå±”€ô€‰Í½±¥ˆì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”¹¹½Ñ…Ñ¥½¹	½É‘•ÉMÑå±•QåÁ”¹M!è(€€€€€€€€€ÍÑå±”¹‰½É‘•ÉMÑå±”€ô€‰‘…Í¡•ˆì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”¹¹½Ñ…Ñ¥½¹	½É‘•ÉMÑå±•QåÁ”¹	Y1è(€€€€€€€€€Ý…É¸ ‰U¹¥µÁ±•µ•¹Ñ•‰½É‘•ÈÍÑå±”è‰•Ù•±•ˆ¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”¹¹½Ñ…Ñ¥½¹	½É‘•ÉMÑå±•QåÁ”¹%9MPè(€€€€€€€€€Ý…É¸ ‰U¹¥µÁ±•µ•¹Ñ•‰½É‘•ÈÍÑå±”è¥¹Í•Ðˆ¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”¹¹½Ñ…Ñ¥½¹	½É‘•ÉMÑå±•QåÁ”¹U9I1%9è(€€€€€€€€€ÍÑå±”¹‰½É‘•É	½ÑÑ½µMÑå±”€ô€‰Í½±¥ˆì(€€€€€€€€€‰É•…¬ì(€€€€€€€‘•™…Õ±Ðè(€€€€€€€€€‰É•…¬ì(€€€€€ô(€€€€€½¹ÍÐ‰½É‘•É½±½È€ô‘…Ñ„¹‰½É‘•É½±½Èñð¹Õ±°ì(€€€€€¥˜€¡‰½É‘•É½±½È¤ì(€€€€€€€Ñ¡¥Ì¸¡…Í	½É‘•È€ôÑÉÕ”ì(€€€€€€€ÍÑå±”¹‰½É‘•É½±½È€ôUÑ¥°¹µ…­•!•á½±½È ¸¸¹‰½É‘•É½±½È¤ì(€€€€€ô•±Í”ì(€€€€€€€ÍÑå±”¹‰½É‘•É]¥‘Ñ €ô€Àì(€€€€€ô(€€€ô(€€€½¹ÍÐÉ•Ð€ôUÑ¥°¹¹½Éµ…±¥é•I•Ð¡m‘…Ñ„¹É•ÑlÁt°Á…”¹Ù¥•ÝlÍt€´‘…Ñ„¹É•ÑlÅt€¬Á…”¹Ù¥•ÝlÅt°‘…Ñ„¹É•ÑlÉt°Á…”¹Ù¥•ÝlÍt€´‘…Ñ„¹É•ÑlÍt€¬Á…”¹Ù¥•ÝlÅut¤ì(€€€½¹ÍÐì(€€€€€Á…•]¥‘Ñ °(€€€€€Á…•!•¥¡Ð°(€€€€€Á…•`°(€€€€€Á…•d(€€€ô€ôÙ¥•ÝÁ½ÉÐ¹É…Ý¥µÌì(€€€ÍÑå±”¹±•™Ð€ô€‘ìÄÀÀ€¨€¡É•ÑlÁt€´Á…•`¤€¼Á…•]¥‘Ñ¡ô•€ì(€€€ÍÑå±”¹Ñ½À€ô€‘ìÄÀÀ€¨€¡É•ÑlÅt€´Á…•d¤€¼Á…•!•¥¡Ñô•€ì(€€€½¹ÍÐì(€€€€€É½Ñ…Ñ¥½¸(€€€ô€ô‘…Ñ„ì(€€€¥˜€¡‘…Ñ„¹¡…Í=Ý¹…¹Ù…ÌñðÉ½Ñ…Ñ¥½¸€ôôô€À¤ì(€€€€€ÍÑå±”¹Ý¥‘Ñ €ô€‘ìÄÀÀ€¨Ý¥‘Ñ €¼Á…•]¥‘Ñ¡ô•€ì(€€€€€ÍÑå±”¹¡•¥¡Ð€ô€‘ìÄÀÀ€¨¡•¥¡Ð€¼Á…•!•¥¡Ñô•€ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹Í•ÑI½Ñ…Ñ¥½¸¡É½Ñ…Ñ¥½¸°½¹Ñ…¥¹•È¤ì(€€€ô(€€€É•ÑÕÉ¸½¹Ñ…¥¹•Èì(€ô(€Í•ÑI½Ñ…Ñ¥½¸¡…¹±”°½¹Ñ…¥¹•È€ôÑ¡¥Ì¹½¹Ñ…¥¹•È¤ì(€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹É•Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€Á…•]¥‘Ñ °(€€€€€Á…•!•¥¡Ð(€€€ô€ôÑ¡¥Ì¹Á…É•¹Ð¹Ù¥•ÝÁ½ÉÐ¹É…Ý¥µÌì(€€€±•Ðì(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ìì(€€€¥˜€¡…¹±”€”€ÄàÀ€„ôô€À¤ì(€€€€€mÝ¥‘Ñ °¡•¥¡Ñt€ôm¡•¥¡Ð°Ý¥‘Ñ¡tì(€€€ô(€€€½¹Ñ…¥¹•È¹ÍÑå±”¹Ý¥‘Ñ €ô€‘ìÄÀÀ€¨Ý¥‘Ñ €¼Á…•]¥‘Ñ¡ô•€ì(€€€½¹Ñ…¥¹•È¹ÍÑå±”¹¡•¥¡Ð€ô€‘ìÄÀÀ€¨¡•¥¡Ð€¼Á…•!•¥¡Ñô•€ì(€€€½¹Ñ…¥¹•È¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µµ…¥¸µÉ½Ñ…Ñ¥½¸ˆ°€ ÌØÀ€´…¹±”¤€”€ÌØÀ¤ì(€ô(€•Ð}½µµ½¹Ñ¥½¹Ì ¤ì(€€€½¹ÍÐÍ•Ñ½±½È€ô€¡©Í9…µ”°ÍÑå±•9…µ”°•Ù•¹Ð¤€ôøì(€€€€€½¹ÍÐ½±½È€ô•Ù•¹Ð¹‘•Ñ…¥±m©Í9…µ•tì(€€€€€½¹ÍÐ½±½ÉQåÁ”€ô½±½ÉlÁtì(€€€€€½¹ÍÐ½±½ÉÉÉ…ä€ô½±½È¹Í±¥” Ä¤ì(€€€€€•Ù•¹Ð¹Ñ…É•Ð¹ÍÑå±•mÍÑå±•9…µ•t€ô½±½É½¹Ù•ÉÑ•ÉÍm€‘í½±½ÉQåÁ•õ}!Q51t¡½±½ÉÉÉ…ä¤ì(€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•ÑY…±Õ”¡Ñ¡¥Ì¹‘…Ñ„¹¥°ì(€€€€€€€mÍÑå±•9…µ•tè½±½É½¹Ù•ÉÑ•ÉÍm€‘í½±½ÉQåÁ•õ}É‰t¡½±½ÉÉÉ…ä¤(€€€€€ô¤ì(€€€ôì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰}½µµ½¹Ñ¥½¹Ìˆ°ì(€€€€€‘¥ÍÁ±…äè•Ù•¹Ð€ôøì(€€€€€€€½¹ÍÐì(€€€€€€€€€‘¥ÍÁ±…ä(€€€€€€€ô€ô•Ù•¹Ð¹‘•Ñ…¥°ì(€€€€€€€½¹ÍÐ¡¥‘‘•¸€ô‘¥ÍÁ±…ä€”€È€ôôô€Äì(€€€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹ÍÑå±”¹Ù¥Í¥‰¥±¥Ñä€ô¡¥‘‘•¸€ü€‰¡¥‘‘•¸ˆ€è€‰Ù¥Í¥‰±”ˆì(€€€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•ÑY…±Õ”¡Ñ¡¥Ì¹‘…Ñ„¹¥°ì(€€€€€€€€€¹½Y¥•Üè¡¥‘‘•¸°(€€€€€€€€€¹½AÉ¥¹Ðè‘¥ÍÁ±…ä€ôôô€Äñð‘¥ÍÁ±…ä€ôôô€È(€€€€€€€ô¤ì(€€€€€ô°(€€€€€ÁÉ¥¹Ðè•Ù•¹Ð€ôøì(€€€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•ÑY…±Õ”¡Ñ¡¥Ì¹‘…Ñ„¹¥°ì(€€€€€€€€€¹½AÉ¥¹Ðè€…•Ù•¹Ð¹‘•Ñ…¥°¹ÁÉ¥¹Ð(€€€€€€€ô¤ì(€€€€€ô°(€€€€€¡¥‘‘•¸è•Ù•¹Ð€ôøì(€€€€€€€½¹ÍÐì(€€€€€€€€€¡¥‘‘•¸(€€€€€€€ô€ô•Ù•¹Ð¹‘•Ñ…¥°ì(€€€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹ÍÑå±”¹Ù¥Í¥‰¥±¥Ñä€ô¡¥‘‘•¸€ü€‰¡¥‘‘•¸ˆ€è€‰Ù¥Í¥‰±”ˆì(€€€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•ÑY…±Õ”¡Ñ¡¥Ì¹‘…Ñ„¹¥°ì(€€€€€€€€€¹½AÉ¥¹Ðè¡¥‘‘•¸°(€€€€€€€€€¹½Y¥•Üè¡¥‘‘•¸(€€€€€€€ô¤ì(€€€€€ô°(€€€€€™½ÕÌè•Ù•¹Ð€ôøì(€€€€€€€Í•ÑQ¥µ•½ÕÐ  ¤€ôø•Ù•¹Ð¹Ñ…É•Ð¹™½ÕÌ¡ì(€€€€€€€€€ÁÉ•Ù•¹ÑMÉ½±°è™…±Í”(€€€€€€€ô¤°€À¤ì(€€€€€ô°(€€€€€ÕÍ•É9…µ”è•Ù•¹Ð€ôøì(€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹Ñ¥Ñ±”€ô•Ù•¹Ð¹‘•Ñ…¥°¹ÕÍ•É9…µ”ì(€€€€€ô°(€€€€€É•…‘½¹±äè•Ù•¹Ð€ôøì(€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹‘¥Í…‰±•€ô•Ù•¹Ð¹‘•Ñ…¥°¹É•…‘½¹±äì(€€€€€ô°(€€€€€É•ÅÕ¥É•è•Ù•¹Ð€ôøì(€€€€€€€Ñ¡¥Ì¹}Í•ÑI•ÅÕ¥É•¡•Ù•¹Ð¹Ñ…É•Ð°•Ù•¹Ð¹‘•Ñ…¥°¹É•ÅÕ¥É•¤ì(€€€€€ô°(€€€€€‰½±½Èè•Ù•¹Ð€ôøì(€€€€€€€Í•Ñ½±½È ‰‰½±½Èˆ°€‰‰…­É½Õ¹‘½±½Èˆ°•Ù•¹Ð¤ì(€€€€€ô°(€€€€€™¥±±½±½Èè•Ù•¹Ð€ôøì(€€€€€€€Í•Ñ½±½È ‰™¥±±½±½Èˆ°€‰‰…­É½Õ¹‘½±½Èˆ°•Ù•¹Ð¤ì(€€€€€ô°(€€€€€™½±½Èè•Ù•¹Ð€ôøì(€€€€€€€Í•Ñ½±½È ‰™½±½Èˆ°€‰½±½Èˆ°•Ù•¹Ð¤ì(€€€€€ô°(€€€€€Ñ•áÑ½±½Èè•Ù•¹Ð€ôøì(€€€€€€€Í•Ñ½±½È ‰Ñ•áÑ½±½Èˆ°€‰½±½Èˆ°•Ù•¹Ð¤ì(€€€€€ô°(€€€€€‰½É‘•É½±½Èè•Ù•¹Ð€ôøì(€€€€€€€Í•Ñ½±½È ‰‰½É‘•É½±½Èˆ°€‰‰½É‘•É½±½Èˆ°•Ù•¹Ð¤ì(€€€€€ô°(€€€€€ÍÑÉ½­•½±½Èè•Ù•¹Ð€ôøì(€€€€€€€Í•Ñ½±½È ‰ÍÑÉ½­•½±½Èˆ°€‰‰½É‘•É½±½Èˆ°•Ù•¹Ð¤ì(€€€€€ô°(€€€€€É½Ñ…Ñ¥½¸è•Ù•¹Ð€ôøì(€€€€€€€½¹ÍÐ…¹±”€ô•Ù•¹Ð¹‘•Ñ…¥°¹É½Ñ…Ñ¥½¸ì(€€€€€€€Ñ¡¥Ì¹Í•ÑI½Ñ…Ñ¥½¸¡…¹±”¤ì(€€€€€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹Í•ÑY…±Õ”¡Ñ¡¥Ì¹‘…Ñ„¹¥°ì(€€€€€€€€€É½Ñ…Ñ¥½¸è…¹±”(€€€€€€€ô¤ì(€€€€€ô(€€€ô¤ì(€ô(€}‘¥ÍÁ…Ñ¡Ù•¹ÑÉ½µM…¹‘‰½à¡…Ñ¥½¹Ì°©ÍÙ•¹Ð¤ì(€€€½¹ÍÐ½µµ½¹Ñ¥½¹Ì€ôÑ¡¥Ì¹}½µµ½¹Ñ¥½¹Ìì(€€€™½È€¡½¹ÍÐ¹…µ”½˜=‰©•Ð¹­•åÌ¡©ÍÙ•¹Ð¹‘•Ñ…¥°¤¤ì(€€€€€½¹ÍÐ…Ñ¥½¸€ô…Ñ¥½¹Ím¹…µ•tñð½µµ½¹Ñ¥½¹Ím¹…µ•tì(€€€€€…Ñ¥½¸ü¸¡©ÍÙ•¹Ð¤ì(€€€ô(€ô(€}Í•Ñ•™…Õ±ÑAÉ½Á•ÉÑ¥•ÍÉ½µ)L¡•±•µ•¹Ð¤ì(€€€¥˜€ …Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÍÑ½É•‘…Ñ„€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”¹•ÑI…ÝY…±Õ”¡Ñ¡¥Ì¹‘…Ñ„¹¥¤ì(€€€¥˜€ …ÍÑ½É•‘…Ñ„¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ½µµ½¹Ñ¥½¹Ì€ôÑ¡¥Ì¹}½µµ½¹Ñ¥½¹Ìì(€€€™½È€¡½¹ÍÐm…Ñ¥½¹9…µ”°‘•Ñ…¥±t½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡ÍÑ½É•‘…Ñ„¤¤ì(€€€€€½¹ÍÐ…Ñ¥½¸€ô½µµ½¹Ñ¥½¹Ím…Ñ¥½¹9…µ•tì(€€€€€¥˜€¡…Ñ¥½¸¤ì(€€€€€€€½¹ÍÐ•Ù•¹ÑAÉ½áä€ôì(€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€m…Ñ¥½¹9…µ•tè‘•Ñ…¥°(€€€€€€€€€ô°(€€€€€€€€€Ñ…É•Ðè•±•µ•¹Ð(€€€€€€€ôì(€€€€€€€…Ñ¥½¸¡•Ù•¹ÑAÉ½áä¤ì(€€€€€€€‘•±•Ñ”ÍÑ½É•‘…Ñ…m…Ñ¥½¹9…µ•tì(€€€€€ô(€€€ô(€ô(€}É•…Ñ•EÕ…‘É¥±…Ñ•É…±Ì ¤ì(€€€¥˜€ …Ñ¡¥Ì¹½¹Ñ…¥¹•È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€ÅÕ…‘A½¥¹ÑÌ(€€€ô€ôÑ¡¥Ì¹‘…Ñ„ì(€€€¥˜€ …ÅÕ…‘A½¥¹ÑÌ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐmÉ•Ñ	±`°É•Ñ	±d°É•ÑQÉ`°É•ÑQÉet€ôÑ¡¥Ì¹‘…Ñ„¹É•Ð¹µ…À¡5…Ñ ¹™É½Õ¹¤ì(€€€¥˜€¡ÅÕ…‘A½¥¹ÑÌ¹±•¹Ñ €ôôô€à¤ì(€€€€€½¹ÍÐmÑÉ`°ÑÉd°‰±`°‰±et€ôÅÕ…‘A½¥¹ÑÌ¹ÍÕ‰…ÉÉ…ä È°€Ø¤ì(€€€€€¥˜€¡É•ÑQÉ`€ôôôÑÉ`€˜˜É•ÑQÉd€ôôôÑÉd€˜˜É•Ñ	±`€ôôô‰±`€˜˜É•Ñ	±d€ôôô‰±d¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€ô(€€€½¹ÍÐì(€€€€€ÍÑå±”(€€€ô€ôÑ¡¥Ì¹½¹Ñ…¥¹•Èì(€€€±•ÐÍÙ	Õ™™•Èì(€€€¥˜€¡Ñ¡¥Ì¸¡…Í	½É‘•È¤ì(€€€€€½¹ÍÐì(€€€€€€€‰½É‘•É½±½È°(€€€€€€€‰½É‘•É]¥‘Ñ (€€€€€ô€ôÍÑå±”ì(€€€€€ÍÑå±”¹‰½É‘•É]¥‘Ñ €ô€Àì(€€€€€ÍÙ	Õ™™•È€ôl‰ÕÉ° ‘…Ñ„é¥µ…”½ÍÙœ­áµ°íÕÑ˜à°ˆ°€ñÍÙœáµ±¹Ìôˆ‘íMY}9MôˆÁÉ•Í•ÉÙ•ÍÁ•ÑI…Ñ¥¼ô‰¹½¹”ˆÙ¥•Ý	½àôˆÀ€À€Ä€Äˆù€°€ñœ™¥±°ô‰ÑÉ…¹ÍÁ…É•¹ÐˆÍÑÉ½­”ôˆ‘í‰½É‘•É½±½ÉôˆÍÑÉ½­”µÝ¥‘Ñ ôˆ‘í‰½É‘•É]¥‘Ñ¡ôˆùtì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡…Í	½É‘•Èˆ¤ì(€€€ô(€€€½¹ÍÐÝ¥‘Ñ €ôÉ•ÑQÉ`€´É•Ñ	±`ì(€€€½¹ÍÐ¡•¥¡Ð€ôÉ•ÑQÉd€´É•Ñ	±dì(€€€½¹ÍÐì(€€€€€ÍÙ…Ñ½Éä(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐÍÙœ€ôÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÍÙœˆ¤ì(€€€ÍÙœ¹±…ÍÍ1¥ÍÐ¹…‘ ‰ÅÕ…‘É¥±…Ñ•É…±Í½¹Ñ…¥¹•Èˆ¤ì(€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ý¥‘Ñ ˆ°€À¤ì(€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡•¥¡Ðˆ°€À¤ì(€€€ÍÙœ¹É½±”€ô€‰¹½¹”ˆì(€€€½¹ÍÐ‘•™Ì€ôÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰‘•™Ìˆ¤ì(€€€ÍÙœ¹…ÁÁ•¹¡‘•™Ì¤ì(€€€½¹ÍÐ±¥ÁA…Ñ €ôÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰±¥ÁA…Ñ ˆ¤ì(€€€½¹ÍÐ¥€ô±¥ÁÁ…Ñ¡|‘íÑ¡¥Ì¹‘…Ñ„¹¥‘õ€ì(€€€±¥ÁA…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¥ˆ°¥¤ì(€€€±¥ÁA…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰±¥ÁA…Ñ¡U¹¥ÑÌˆ°€‰½‰©•Ñ	½Õ¹‘¥¹	½àˆ¤ì(€€€‘•™Ì¹…ÁÁ•¹¡±¥ÁA…Ñ ¤ì(€€€™½È€¡±•Ð¤€ô€È°¥¤€ôÅÕ…‘A½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€à¤ì(€€€€€½¹ÍÐÑÉ`€ôÅÕ…‘A½¥¹ÑÍm¥tì(€€€€€½¹ÍÐÑÉd€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Åtì(€€€€€½¹ÍÐ‰±`€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Étì(€€€€€½¹ÍÐ‰±d€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Ítì(€€€€€½¹ÍÐÉ•Ð€ôÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰É•Ðˆ¤ì(€€€€€½¹ÍÐà€ô€¡‰±`€´É•Ñ	±`¤€¼Ý¥‘Ñ ì(€€€€€½¹ÍÐä€ô€¡É•ÑQÉd€´ÑÉd¤€¼¡•¥¡Ðì(€€€€€½¹ÍÐÉ•Ñ]¥‘Ñ €ô€¡ÑÉ`€´‰±`¤€¼Ý¥‘Ñ ì(€€€€€½¹ÍÐÉ•Ñ!•¥¡Ð€ô€¡ÑÉd€´‰±d¤€¼¡•¥¡Ðì(€€€€€É•Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰àˆ°à¤ì(€€€€€É•Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰äˆ°ä¤ì(€€€€€É•Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ý¥‘Ñ ˆ°É•Ñ]¥‘Ñ ¤ì(€€€€€É•Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡•¥¡Ðˆ°É•Ñ!•¥¡Ð¤ì(€€€€€±¥ÁA…Ñ ¹…ÁÁ•¹¡É•Ð¤ì(€€€€€ÍÙ	Õ™™•Èü¹ÁÕÍ ¡€ñÉ•ÐÙ•Ñ½Èµ•™™•Ðô‰¹½¸µÍ…±¥¹œµÍÑÉ½­”ˆàôˆ‘íáôˆäôˆ‘íåôˆÝ¥‘Ñ ôˆ‘íÉ•Ñ]¥‘Ñ¡ôˆ¡•¥¡Ðôˆ‘íÉ•Ñ!•¥¡Ñôˆ¼ù€¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸¡…Í	½É‘•È¤ì(€€€€€ÍÙ	Õ™™•È¹ÁÕÍ ¡€ð½œøð½ÍÙœøœ¥€¤ì(€€€€€ÍÑå±”¹‰…­É½Õ¹‘%µ…”€ôÍÙ	Õ™™•È¹©½¥¸ ˆˆ¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡ÍÙœ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹ÍÑå±”¹±¥ÁA…Ñ €ôÕÉ° Œ‘í¥‘ô¥€ì(€ô(€}É•…Ñ•A½ÁÕÀ¡Á½ÁÕÁ…Ñ„€ô¹Õ±°¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„(€€€ô€ôÑ¡¥Ìì(€€€±•Ð½¹Ñ•¹ÑÍ=‰¨°µ½‘¥™¥…Ñ¥½¹…Ñ”ì(€€€¥˜€¡Á½ÁÕÁ…Ñ„¤ì(€€€€€½¹Ñ•¹ÑÍ=‰¨€ôì(€€€€€€€ÍÑÈèÁ½ÁÕÁ…Ñ„¹Ñ•áÐ(€€€€€ôì(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”€ôÁ½ÁÕÁ…Ñ„¹‘…Ñ”ì(€€€ô•±Í”ì(€€€€€½¹Ñ•¹ÑÍ=‰¨€ô‘…Ñ„¹½¹Ñ•¹ÑÍ=‰¨ì(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”€ô‘…Ñ„¹µ½‘¥™¥…Ñ¥½¹…Ñ”ì(€€€ô(€€€Ñ¡¥Ì¸Á½ÁÕÁ±•µ•¹Ð€ô¹•ÜA½ÁÕÁ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡ì(€€€€€‘…Ñ„èì(€€€€€€€½±½Èè‘…Ñ„¹½±½È°(€€€€€€€Ñ¥Ñ±•=‰¨è‘…Ñ„¹Ñ¥Ñ±•=‰¨°(€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”°(€€€€€€€½¹Ñ•¹ÑÍ=‰¨°(€€€€€€€É¥¡Q•áÐè‘…Ñ„¹É¥¡Q•áÐ°(€€€€€€€Á…É•¹ÑI•Ðè‘…Ñ„¹É•Ð°(€€€€€€€‰½É‘•ÉMÑå±”è€À°(€€€€€€€¥èÁ½ÁÕÁ|‘í‘…Ñ„¹¥‘õ€°(€€€€€€€É½Ñ…Ñ¥½¸è‘…Ñ„¹É½Ñ…Ñ¥½¸°(€€€€€€€¹½I½Ñ…Ñ”èÑÉÕ”(€€€€€ô°(€€€€€±¥¹­M•ÉÙ¥”èÑ¡¥Ì¹±¥¹­M•ÉÙ¥”°(€€€€€Á…É•¹ÐèÑ¡¥Ì¹Á…É•¹Ð°(€€€€€•±•µ•¹ÑÌèmÑ¡¥Ít(€€€ô¤ì(€ô(€•Ð¡…ÍA½ÁÕÁ±•µ•¹Ð ¤ì(€€€É•ÑÕÉ¸€„„¡Ñ¡¥Ì¸Á½ÁÕÁ±•µ•¹ÐñðÑ¡¥Ì¹Á½ÁÕÀñðÑ¡¥Ì¹‘…Ñ„¹Á½ÁÕÁI•˜¤ì(€ô(€•Ð•áÑÉ…A½ÁÕÁ±•µ•¹Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á½ÁÕÁ±•µ•¹Ðì(€ô(€É•¹‘•È ¤ì(€€€Õ¹É•…¡…‰±” ‰‰ÍÑÉ…Ðµ•Ñ¡½¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¹É•¹‘•É€…±±•ˆ¤ì(€ô(€}•Ñ±•µ•¹ÑÍ	å9…µ”¡¹…µ”°Í­¥Á%€ô¹Õ±°¤ì(€€€½¹ÍÐ™¥•±‘Ì€ômtì(€€€¥˜€¡Ñ¡¥Ì¹}™¥•±‘=‰©•ÑÌ¤ì(€€€€€½¹ÍÐ™¥•±‘=‰¨€ôÑ¡¥Ì¹}™¥•±‘=‰©•ÑÌ¹•Ð¡¹…µ”¤ñðmtì(€€€€€™½È€¡½¹ÍÐì(€€€€€€€Á…”°(€€€€€€€¥°(€€€€€€€•áÁ½ÉÑY…±Õ•Ì(€€€€€ô½˜™¥•±‘=‰¨¤ì(€€€€€€€¥˜€¡Á…”€ôôô€´Ä¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€¥˜€¡¥€ôôôÍ­¥Á%¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€½¹ÍÐ•áÁ½ÉÑY…±Õ”€ôÑåÁ•½˜•áÁ½ÉÑY…±Õ•Ì€ôôô€‰ÍÑÉ¥¹œˆ€ü•áÁ½ÉÑY…±Õ•Ì€è¹Õ±°ì(€€€€€€€½¹ÍÐ‘½µ±•µ•¹Ð€ô‘½Õµ•¹Ð¹ÅÕ•ÉåM•±•Ñ½È¡m‘…Ñ„µ•±•µ•¹Ðµ¥ôˆ‘í¥‘ô‰u€¤ì(€€€€€€€¥˜€¡‘½µ±•µ•¹Ð€˜˜€…•Ñ±•µ•¹ÑÍ	å9…µ•M•Ð¹¡…Ì¡‘½µ±•µ•¹Ð¤¤ì(€€€€€€€€€Ý…É¸¡}•Ñ±•µ•¹ÑÍ	å9…µ”€´•±•µ•¹Ð¹½Ð…±±½Ý•è€‘í¥‘õ€¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€™¥•±‘Ì¹ÁÕÍ ¡ì(€€€€€€€€€¥°(€€€€€€€€€•áÁ½ÉÑY…±Õ”°(€€€€€€€€€‘½µ±•µ•¹Ð(€€€€€€€ô¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸™¥•±‘Ìì(€€€ô(€€€™½È€¡½¹ÍÐ‘½µ±•µ•¹Ð½˜‘½Õµ•¹Ð¹•Ñ±•µ•¹ÑÍ	å9…µ”¡¹…µ”¤¤ì(€€€€€½¹ÍÐì(€€€€€€€•áÁ½ÉÑY…±Õ”(€€€€€ô€ô‘½µ±•µ•¹Ðì(€€€€€½¹ÍÐ¥€ô‘½µ±•µ•¹Ð¹•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ•±•µ•¹Ðµ¥ˆ¤ì(€€€€€¥˜€¡¥€ôôôÍ­¥Á%¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€¥˜€ …•Ñ±•µ•¹ÑÍ	å9…µ•M•Ð¹¡…Ì¡‘½µ±•µ•¹Ð¤¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€™¥•±‘Ì¹ÁÕÍ ¡ì(€€€€€€€¥°(€€€€€€€•áÁ½ÉÑY…±Õ”°(€€€€€€€‘½µ±•µ•¹Ð(€€€€€ô¤ì(€€€ô(€€€É•ÑÕÉ¸™¥•±‘Ìì(€ô(€Í¡½Ü ¤ì(€€€¥˜€¡Ñ¡¥Ì¹½¹Ñ…¥¹•È¤ì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹¡¥‘‘•¸€ô™…±Í”ì(€€€ô(€€€Ñ¡¥Ì¹Á½ÁÕÀü¹µ…å‰•M¡½Ü ¤ì(€ô(€¡¥‘” ¤ì(€€€¥˜€¡Ñ¡¥Ì¹½¹Ñ…¥¹•È¤ì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€ô(€€€Ñ¡¥Ì¹Á½ÁÕÀü¹™½É•!¥‘” ¤ì(€ô(€•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€…‘‘!¥¡±¥¡ÑÉ•„ ¤ì(€€€½¹ÍÐÑÉ¥•ÉÌ€ôÑ¡¥Ì¹•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤ì(€€€¥˜€¡ÉÉ…ä¹¥ÍÉÉ…ä¡ÑÉ¥•ÉÌ¤¤ì(€€€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜ÑÉ¥•ÉÌ¤ì(€€€€€€€•±•µ•¹Ð¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡ÑÉ•„ˆ¤ì(€€€€€ô(€€€ô•±Í”ì(€€€€€ÑÉ¥•ÉÌ¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡ÑÉ•„ˆ¤ì(€€€ô(€ô(€}•‘¥Ñ=¹½Õ‰±•±¥¬ ¤ì(€€€¥˜€ …Ñ¡¥Ì¹}¥Í‘¥Ñ…‰±”¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”èµ½‘”°(€€€€€‘…Ñ„èì(€€€€€€€¥è•‘¥Ñ%(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‘‰±±¥¬ˆ°€ ¤€ôøì(€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰ÍÝ¥Ñ¡…¹¹½Ñ…Ñ¥½¹•‘¥Ñ½Éµ½‘”ˆ°ì(€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€µ½‘”°(€€€€€€€•‘¥Ñ%°(€€€€€€€µÕÍÑ¹Ñ•É%¹‘¥Ñ5½‘”èÑÉÕ”(€€€€€ô¤ì(€€€ô¤ì(€ô(€ÕÁ‘…Ñ•=¡½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¤ì(€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹½Œñð€…½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ¥ÍY¥Í¥‰±”€ô½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¹¥ÍY¥Í¥‰±”¡Ñ¡¥Ì¹‘…Ñ„¹½Œ¤ì(€€€¥˜€¡¥ÍY¥Í¥‰±”¤ì(€€€€€Ñ¡¥Ì¹Í¡½Ü ¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹¡¥‘” ¤ì(€€€ô(€ô(€•ÐÝ¥‘Ñ  ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÉt€´Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÁtì(€ô(€•Ð¡•¥¡Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÍt€´Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÅtì(€ô(€}Í•Ñ	…­É½Õ¹‘½±½È¡•±•µ•¹Ð¤ì(€€€½¹ÍÐ½±½È€ôÑ¡¥Ì¹‘…Ñ„¹‰…­É½Õ¹‘½±½Èñð¹Õ±°ì(€€€•±•µ•¹Ð¹ÍÑå±”¹‰…­É½Õ¹‘½±½È€ô½±½È€ôôô¹Õ±°€ü€‰ÑÉ…¹ÍÁ…É•¹Ðˆ€èUÑ¥°¹µ…­•!•á½±½È ¸¸¹½±½È¤ì(€ô)ô)±…ÍÌ‘¥Ñ½É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½È€ôÁ…É…µ•Ñ•ÉÌ¹•‘¥Ñ½Èì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ9…µ”€ô€‰•‘¥Ñ½É¹¹½Ñ…Ñ¥½¸ˆì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€É•…Ñ•=ÉUÁ‘…Ñ•A½ÁÕÀ ¤ì(€€€½¹ÍÐì(€€€€€•‘¥Ñ½È(€€€ô€ôÑ¡¥Ìì(€€€¥˜€ …•‘¥Ñ½È¹¡…Í½µµ•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ¡•‘¥Ñ½È¹½µµ•¹Ð¤ì(€ô(€•Ð¡…Í½µµ•¹Ñ	ÕÑÑ½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹•¹…‰±•½µµ•¹Ð€˜˜Ñ¡¥Ì¹•‘¥Ñ½È¹¡…Í½µµ•¹Ðì(€ô(€•Ð½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹•‘¥Ñ½È¹½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¹%¹A…”ì(€ô(€•Ð½µµ•¹ÑQ•áÐ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹•‘¥Ñ½È¹½µµ•¹Ð¹Ñ•áÐì(€ô(€Í•Ð½µµ•¹ÑQ•áÐ¡Ñ•áÐ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½È¹½µµ•¹Ð€ôÑ•áÐì(€€€¥˜€ …Ñ•áÐ¤ì(€€€€€Ñ¡¥Ì¹É•µ½Ù•A½ÁÕÀ ¤ì(€€€ô(€ô(€•Ð½µµ•¹Ñ…Ñ„ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹•‘¥Ñ½È¹•Ñ…Ñ„ ¤ì(€ô(€É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ð¹É•µ½Ù•¹¹½Ñ…Ñ¥½¸¡Ñ¡¥Ì¹‘…Ñ„¹¥¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È€ô¹Õ±°ì(€€€Ñ¡¥Ì¹É•µ½Ù•A½ÁÕÀ ¤ì(€ô)ô)±…ÍÌ1¥¹­¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ°½ÁÑ¥½¹Ì€ô¹Õ±°¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•Èè€„…½ÁÑ¥½¹Ìü¹¥¹½É•	½É‘•È°(€€€€€É•…Ñ•EÕ…‘É¥±…Ñ•É…±ÌèÑÉÕ”(€€€ô¤ì(€€€Ñ¡¥Ì¹¥ÍQ½½±Ñ¥Á=¹±ä€ôÁ…É…µ•Ñ•ÉÌ¹‘…Ñ„¹¥ÍQ½½±Ñ¥Á=¹±äì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„°(€€€€€±¥¹­M•ÉÙ¥”(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐ±¥¹¬€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰„ˆ¤ì(€€€±¥¹¬¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ•±•µ•¹Ðµ¥ˆ°‘…Ñ„¹¥¤ì(€€€±•Ð¥Í	½Õ¹€ô™…±Í”ì(€€€¥˜€¡‘…Ñ„¹ÕÉ°¤ì(€€€€€±¥¹­M•ÉÙ¥”¹…‘‘1¥¹­ÑÑÉ¥‰ÕÑ•Ì¡±¥¹¬°‘…Ñ„¹ÕÉ°°‘…Ñ„¹¹•Ý]¥¹‘½Ü¤ì(€€€€€¥Í	½Õ¹€ôÑÉÕ”ì(€€€ô•±Í”¥˜€¡‘…Ñ„¹…Ñ¥½¸¤ì(€€€€€Ñ¡¥Ì¹}‰¥¹‘9…µ•‘Ñ¥½¸¡±¥¹¬°‘…Ñ„¹…Ñ¥½¸°‘…Ñ„¹½Ù•É±…¥‘Q•áÐ¤ì(€€€€€¥Í	½Õ¹€ôÑÉÕ”ì(€€€ô•±Í”¥˜€¡‘…Ñ„¹…ÑÑ…¡µ•¹Ð¤ì(€€€€€Ñ¡¥Ì¸‰¥¹‘ÑÑ…¡µ•¹Ð¡±¥¹¬°‘…Ñ„¹…ÑÑ…¡µ•¹Ñ%°‘…Ñ„¹…ÑÑ…¡µ•¹Ð°‘…Ñ„¹½Ù•É±…¥‘Q•áÐ°‘…Ñ„¹…ÑÑ…¡µ•¹Ñ•ÍÐ¤ì(€€€€€¥Í	½Õ¹€ôÑÉÕ”ì(€€€ô•±Í”¥˜€¡‘…Ñ„¹Í•Ñ=MÑ…Ñ”¤ì(€€€€€Ñ¡¥Ì¸‰¥¹‘M•Ñ=MÑ…Ñ”¡±¥¹¬°‘…Ñ„¹Í•Ñ=MÑ…Ñ”°‘…Ñ„¹½Ù•É±…¥‘Q•áÐ¤ì(€€€€€¥Í	½Õ¹€ôÑÉÕ”ì(€€€ô•±Í”¥˜€¡‘…Ñ„¹‘•ÍÐ¤ì(€€€€€Ñ¡¥Ì¹}‰¥¹‘1¥¹¬¡±¥¹¬°‘…Ñ„¹‘•ÍÐ°‘…Ñ„¹½Ù•É±…¥‘Q•áÐ¤ì(€€€€€¥Í	½Õ¹€ôÑÉÕ”ì(€€€ô•±Í”ì(€€€€€¥˜€¡‘…Ñ„¹…Ñ¥½¹Ì€˜˜€¡‘…Ñ„¹…Ñ¥½¹Ì¹¡…Ì ‰Ñ¥½¸ˆ¤ñð‘…Ñ„¹…Ñ¥½¹Ì¹¡…Ì ‰5½ÕÍ”UÀˆ¤ñð‘…Ñ„¹…Ñ¥½¹Ì¹¡…Ì ‰5½ÕÍ”½Ý¸ˆ¤¤€˜˜Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ€˜˜Ñ¡¥Ì¹¡…Í)MÑ¥½¹Ì¤ì(€€€€€€€Ñ¡¥Ì¹}‰¥¹‘)MÑ¥½¸¡±¥¹¬°‘…Ñ„¤ì(€€€€€€€¥Í	½Õ¹€ôÑÉÕ”ì(€€€€€ô(€€€€€¥˜€¡‘…Ñ„¹É•Í•Ñ½É´¤ì(€€€€€€€Ñ¡¥Ì¹}‰¥¹‘I•Í•Ñ½ÉµÑ¥½¸¡±¥¹¬°‘…Ñ„¹É•Í•Ñ½É´¤ì(€€€€€€€¥Í	½Õ¹€ôÑÉÕ”ì(€€€€€ô•±Í”¥˜€¡Ñ¡¥Ì¹¥ÍQ½½±Ñ¥Á=¹±ä€˜˜€…¥Í	½Õ¹¤ì(€€€€€€€Ñ¡¥Ì¹}‰¥¹‘1¥¹¬¡±¥¹¬°€ˆˆ¤ì(€€€€€€€¥Í	½Õ¹€ôÑÉÕ”ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰±¥¹­¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€¥˜€¡¥Í	½Õ¹¤ì(€€€€€Ñ¡¥Ì¹½¹Ñ•¹Ñ±•µ•¹Ð€ô±¥¹¬ì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡±¥¹¬¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€€Í•Ñ%¹Ñ•É¹…±1¥¹¬ ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ¥¹Ñ•É¹…°µ±¥¹¬ˆ°€ˆˆ¤ì(€ô(€}‰¥¹‘1¥¹¬¡±¥¹¬°‘•ÍÑ¥¹…Ñ¥½¸°½Ù•É±…¥‘Q•áÐ€ô€ˆˆ¤ì(€€€±¥¹¬¹¡É•˜€ôÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ñ•ÍÑ¥¹…Ñ¥½¹!…Í ¡‘•ÍÑ¥¹…Ñ¥½¸¤ì(€€€±¥¹¬¹½¹±¥¬€ô€ ¤€ôøì(€€€€€¥˜€¡‘•ÍÑ¥¹…Ñ¥½¸¤ì(€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹½Q½•ÍÑ¥¹…Ñ¥½¸¡‘•ÍÑ¥¹…Ñ¥½¸¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ôì(€€€¥˜€¡‘•ÍÑ¥¹…Ñ¥½¸ñð‘•ÍÑ¥¹…Ñ¥½¸€ôôô€ˆˆ¤ì(€€€€€Ñ¡¥Ì¸Í•Ñ%¹Ñ•É¹…±1¥¹¬ ¤ì(€€€ô(€€€¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€±¥¹¬¹Ñ¥Ñ±”€ô½Ù•É±…¥‘Q•áÐì(€€€ô(€ô(€}‰¥¹‘9…µ•‘Ñ¥½¸¡±¥¹¬°…Ñ¥½¸°½Ù•É±…¥‘Q•áÐ€ô€ˆˆ¤ì(€€€±¥¹¬¹¡É•˜€ôÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ñ¹¡½ÉUÉ° ˆˆ¤ì(€€€±¥¹¬¹½¹±¥¬€ô€ ¤€ôøì(€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•á•ÕÑ•9…µ•‘Ñ¥½¸¡…Ñ¥½¸¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ôì(€€€¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€±¥¹¬¹Ñ¥Ñ±”€ô½Ù•É±…¥‘Q•áÐì(€€€ô(€€€Ñ¡¥Ì¸Í•Ñ%¹Ñ•É¹…±1¥¹¬ ¤ì(€ô(€€‰¥¹‘ÑÑ…¡µ•¹Ð¡±¥¹¬°…ÑÑ…¡µ•¹Ñ%°…ÑÑ…¡µ•¹Ð°½Ù•É±…¥‘Q•áÐ€ô€ˆˆ°‘•ÍÐ€ô¹Õ±°¤ì(€€€±¥¹¬¹¡É•˜€ôÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ñ¹¡½ÉUÉ° ˆˆ¤ì(€€€¥˜€¡…ÑÑ…¡µ•¹Ð¹‘•ÍÉ¥ÁÑ¥½¸¤ì(€€€€€±¥¹¬¹Ñ¥Ñ±”€ô…ÑÑ…¡µ•¹Ð¹‘•ÍÉ¥ÁÑ¥½¸ì(€€€ô•±Í”¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€±¥¹¬¹Ñ¥Ñ±”€ô½Ù•É±…¥‘Q•áÐì(€€€ô(€€€½¹ÍÐ½Á•¹ÑÑ…¡µ•¹Ð€ô…Íå¹Œ€ ¤€ôøì(€€€€€½¹ÍÐ½¹Ñ•¹Ð€ô…Ý…¥ÐÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•ÑÑÑ…¡µ•¹Ñ½¹Ñ•¹Ð¡…ÑÑ…¡µ•¹Ñ%¤ì(€€€€€¥˜€¡½¹Ñ•¹Ð¤ì(€€€€€€€Ñ¡¥Ì¹‘½Ý¹±½…‘5…¹…•Èü¹½Á•¹=É½Ý¹±½…‘…Ñ„¡½¹Ñ•¹Ð°…ÑÑ…¡µ•¹Ð¹™¥±•¹…µ”°‘•ÍÐ¤ì(€€€€€ô(€€€ôì(€€€±¥¹¬¹½¹±¥¬€ô€ ¤€ôøì(€€€€€½Á•¹ÑÑ…¡µ•¹Ð ¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ôì(€€€Ñ¡¥Ì¸Í•Ñ%¹Ñ•É¹…±1¥¹¬ ¤ì(€ô(€€‰¥¹‘M•Ñ=MÑ…Ñ”¡±¥¹¬°…Ñ¥½¸°½Ù•É±…¥‘Q•áÐ€ô€ˆˆ¤ì(€€€±¥¹¬¹¡É•˜€ôÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ñ¹¡½ÉUÉ° ˆˆ¤ì(€€€±¥¹¬¹½¹±¥¬€ô€ ¤€ôøì(€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•á•ÕÑ•M•Ñ=MÑ…Ñ”¡…Ñ¥½¸¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ôì(€€€¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€±¥¹¬¹Ñ¥Ñ±”€ô½Ù•É±…¥‘Q•áÐì(€€€ô(€€€Ñ¡¥Ì¸Í•Ñ%¹Ñ•É¹…±1¥¹¬ ¤ì(€ô(€}‰¥¹‘)MÑ¥½¸¡±¥¹¬°ì(€€€…Ñ¥½¹Ì°(€€€¥°(€€€½Ù•É±…¥‘Q•áÐ(€ô¤ì(€€€±¥¹¬¹¡É•˜€ôÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ñ¹¡½ÉUÉ° ˆˆ¤ì(€€€½¹ÍÐµ…À€ô¹•Ü5…À¡ml‰Ñ¥½¸ˆ°€‰½¹±¥¬‰t°l‰5½ÕÍ”UÀˆ°€‰½¹µ½ÕÍ•ÕÀ‰t°l‰5½ÕÍ”½Ý¸ˆ°€‰½¹µ½ÕÍ•‘½Ý¸‰ut¤ì(€€€™½È€¡½¹ÍÐ¹…µ”½˜…Ñ¥½¹Ì¹­•åÌ ¤¤ì(€€€€€½¹ÍÐ©Í9…µ”€ôµ…À¹•Ð¡¹…µ”¤ì(€€€€€¥˜€ …©Í9…µ”¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€±¥¹­m©Í9…µ•t€ô€ ¤€ôøì(€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€¥°(€€€€€€€€€€€¹…µ”(€€€€€€€€€ô(€€€€€€€ô¤ì(€€€€€€€É•ÑÕÉ¸™…±Í”ì(€€€€€ôì(€€€ô(€€€¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€±¥¹¬¹Ñ¥Ñ±”€ô½Ù•É±…¥‘Q•áÐì(€€€ô(€€€±¥¹¬¹½¹±¥¬ñðô€ ¤€ôø™…±Í”ì(€€€Ñ¡¥Ì¸Í•Ñ%¹Ñ•É¹…±1¥¹¬ ¤ì(€ô(€}‰¥¹‘I•Í•Ñ½ÉµÑ¥½¸¡±¥¹¬°É•Í•Ñ½É´¤ì(€€€½¹ÍÐ½Ñ¡•É±¥­Ñ¥½¸€ô±¥¹¬¹½¹±¥¬ì(€€€¥˜€ …½Ñ¡•É±¥­Ñ¥½¸¤ì(€€€€€±¥¹¬¹¡É•˜€ôÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ñ¹¡½ÉUÉ° ˆˆ¤ì(€€€ô(€€€Ñ¡¥Ì¸Í•Ñ%¹Ñ•É¹…±1¥¹¬ ¤ì(€€€¥˜€ …Ñ¡¥Ì¹}™¥•±‘=‰©•ÑÌ¤ì(€€€€€Ý…É¸¡}‰¥¹‘I•Í•Ñ½ÉµÑ¥½¸€´€‰É•Í•Ñ½É´ˆ…Ñ¥½¸¹½ÐÍÕÁÁ½ÉÑ•°€€¬€‰•¹ÍÕÉ”Ñ¡…ÐÑ¡”™¥•±‘=‰©•ÑÍ€Á…É…µ•Ñ•È¥ÌÁÉ½Ù¥‘•¸ˆ¤ì(€€€€€¥˜€ …½Ñ¡•É±¥­Ñ¥½¸¤ì(€€€€€€€±¥¹¬¹½¹±¥¬€ô€ ¤€ôø™…±Í”ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€±¥¹¬¹½¹±¥¬€ô€ ¤€ôøì(€€€€€½Ñ¡•É±¥­Ñ¥½¸ü¸ ¤ì(€€€€€½¹ÍÐì(€€€€€€€™¥•±‘ÌèÉ•Í•Ñ½Éµ¥•±‘Ì°(€€€€€€€É•™ÌèÉ•Í•Ñ½ÉµI•™Ì°(€€€€€€€¥¹±Õ‘”(€€€€€ô€ôÉ•Í•Ñ½É´ì(€€€€€½¹ÍÐ…±±¥•±‘Ì€ômtì(€€€€€¥˜€¡É•Í•Ñ½Éµ¥•±‘Ì¹±•¹Ñ €„ôô€ÀñðÉ•Í•Ñ½ÉµI•™Ì¹±•¹Ñ €„ôô€À¤ì(€€€€€€€½¹ÍÐ™¥•±‘%‘Ì€ô¹•ÜM•Ð¡É•Í•Ñ½ÉµI•™Ì¤ì(€€€€€€€™½È€¡½¹ÍÐ™¥•±‘9…µ”½˜É•Í•Ñ½Éµ¥•±‘Ì¤ì(€€€€€€€€€½¹ÍÐ™¥•±‘Ì€ôÑ¡¥Ì¹}™¥•±‘=‰©•ÑÌ¹•Ð¡™¥•±‘9…µ”¤ñðmtì(€€€€€€€€€™½È€¡½¹ÍÐì(€€€€€€€€€€€¥(€€€€€€€€€ô½˜™¥•±‘Ì¤ì(€€€€€€€€€€€™¥•±‘%‘Ì¹…‘¡¥¤ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€€€™½È€¡½¹ÍÐ™¥•±‘Ì½˜Ñ¡¥Ì¹}™¥•±‘=‰©•ÑÌ¹Ù…±Õ•Ì ¤¤ì(€€€€€€€€€™½È€¡½¹ÍÐ™¥•±½˜™¥•±‘Ì¤ì(€€€€€€€€€€€¥˜€¡™¥•±‘%‘Ì¹¡…Ì¡™¥•±¹¥¤€ôôô¥¹±Õ‘”¤ì(€€€€€€€€€€€€€…±±¥•±‘Ì¹ÁÕÍ ¡™¥•±¤ì(€€€€€€€€€€€ô(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô•±Í”ì(€€€€€€€™½È€¡½¹ÍÐ™¥•±‘Ì½˜Ñ¡¥Ì¹}™¥•±‘=‰©•ÑÌ¹Ù…±Õ•Ì ¤¤ì(€€€€€€€€€…±±¥•±‘Ì¹ÁÕÍ  ¸¸¹™¥•±‘Ì¤ì(€€€€€€€ô(€€€€€ô(€€€€€½¹ÍÐÍÑ½É…”€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€€€€€½¹ÍÐ…±±%‘Ì€ômtì(€€€€€™½È€¡½¹ÍÐ™¥•±½˜…±±¥•±‘Ì¤ì(€€€€€€€½¹ÍÐì(€€€€€€€€€¥(€€€€€€€ô€ô™¥•±ì(€€€€€€€…±±%‘Ì¹ÁÕÍ ¡¥¤ì(€€€€€€€ÍÝ¥Ñ €¡™¥•±¹ÑåÁ”¤ì(€€€€€€€€€…Í”€‰Ñ•áÐˆè(€€€€€€€€€€€ì(€€€€€€€€€€€€€½¹ÍÐÙ…±Õ”€ô™¥•±¹‘•™…Õ±ÑY…±Õ”ñð€ˆˆì(€€€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€€€Ù…±Õ”(€€€€€€€€€€€€€ô¤ì(€€€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€€€ô(€€€€€€€€€…Í”€‰¡•­‰½àˆè(€€€€€€€€€…Í”€‰É…‘¥½‰ÕÑÑ½¸ˆè(€€€€€€€€€€€ì(€€€€€€€€€€€€€½¹ÍÐÙ…±Õ”€ô™¥•±¹‘•™…Õ±ÑY…±Õ”€ôôô™¥•±¹•áÁ½ÉÑY…±Õ•Ìì(€€€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€€€Ù…±Õ”(€€€€€€€€€€€€€ô¤ì(€€€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€€€ô(€€€€€€€€€…Í”€‰½µ‰½‰½àˆè(€€€€€€€€€…Í”€‰±¥ÍÑ‰½àˆè(€€€€€€€€€€€ì(€€€€€€€€€€€€€½¹ÍÐÙ…±Õ”€ô™¥•±¹‘•™…Õ±ÑY…±Õ”ñð€ˆˆì(€€€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€€€Ù…±Õ”(€€€€€€€€€€€€€ô¤ì(€€€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€€€ô(€€€€€€€€€‘•™…Õ±Ðè(€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€½¹ÍÐ‘½µ±•µ•¹Ð€ô‘½Õµ•¹Ð¹ÅÕ•ÉåM•±•Ñ½È¡m‘…Ñ„µ•±•µ•¹Ðµ¥ôˆ‘í¥‘ô‰u€¤ì(€€€€€€€¥˜€ …‘½µ±•µ•¹Ð¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô•±Í”¥˜€ …•Ñ±•µ•¹ÑÍ	å9…µ•M•Ð¹¡…Ì¡‘½µ±•µ•¹Ð¤¤ì(€€€€€€€€€Ý…É¸¡}‰¥¹‘I•Í•Ñ½ÉµÑ¥½¸€´•±•µ•¹Ð¹½Ð…±±½Ý•è€‘í¥‘õ€¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€‘½µ±•µ•¹Ð¹‘¥ÍÁ…Ñ¡Ù•¹Ð¡¹•ÜÙ•¹Ð ‰É•Í•Ñ™½É´ˆ¤¤ì(€€€€€ô(€€€€€¥˜€¡Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ¤ì(€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€¥è€‰…ÁÀˆ°(€€€€€€€€€€€¥‘Ìè…±±%‘Ì°(€€€€€€€€€€€¹…µ”è€‰I•Í•Ñ½É´ˆ(€€€€€€€€€ô(€€€€€€€ô¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ôì(€ô)ô)±…ÍÌQ•áÑ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰Ñ•áÑ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€½¹ÍÐ¥µ…”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰¥µœˆ¤ì(€€€¥µ…”¹ÍÉŒ€ôÑ¡¥Ì¹¥µ…•I•Í½ÕÉ•ÍA…Ñ €¬€‰…¹¹½Ñ…Ñ¥½¸´ˆ€¬Ñ¡¥Ì¹‘…Ñ„¹¹…µ”¹Ñ½1½Ý•É…Í” ¤€¬€ˆ¹ÍÙœˆì(€€€¥µ…”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ¥ˆ°€‰Á‘™©ÌµÑ•áÐµ…¹¹½Ñ…Ñ¥½¸µÑåÁ”ˆ¤ì(€€€¥µ…”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ…ÉÌˆ°)M=8¹ÍÑÉ¥¹¥™ä¡ì(€€€€€ÑåÁ”èÑ¡¥Ì¹‘…Ñ„¹¹…µ”(€€€ô¤¤ì(€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡¥µ…”¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌ]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€É•¹‘•È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€}•Ñ-•å5½‘¥™¥•È¡•Ù•¹Ð¤ì(€€€É•ÑÕÉ¸•…ÑÕÉ•Q•ÍÐ¹Á±…Ñ™½É´¹¥Í5…Œ€ü•Ù•¹Ð¹µ•Ñ…-•ä€è•Ù•¹Ð¹ÑÉ±-•äì(€ô(€}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•È¡•±•µ•¹Ð°•±•µ•¹Ñ…Ñ„°‰…Í•9…µ”°•Ù•¹Ñ9…µ”°Ù…±Õ••ÑÑ•È¤ì(€€€¥˜€¡‰…Í•9…µ”¹¥¹±Õ‘•Ì ‰µ½ÕÍ”ˆ¤¤ì(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È¡‰…Í•9…µ”°•Ù•¹Ð€ôøì(€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€¥èÑ¡¥Ì¹‘…Ñ„¹¥°(€€€€€€€€€€€¹…µ”è•Ù•¹Ñ9…µ”°(€€€€€€€€€€€Ù…±Õ”èÙ…±Õ••ÑÑ•È¡•Ù•¹Ð¤°(€€€€€€€€€€€Í¡¥™Ðè•Ù•¹Ð¹Í¡¥™Ñ-•ä°(€€€€€€€€€€€µ½‘¥™¥•ÈèÑ¡¥Ì¹}•Ñ-•å5½‘¥™¥•È¡•Ù•¹Ð¤(€€€€€€€€€ô(€€€€€€€ô¤ì(€€€€€ô¤ì(€€€ô•±Í”ì(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È¡‰…Í•9…µ”°•Ù•¹Ð€ôøì(€€€€€€€¥˜€¡‰…Í•9…µ”€ôôô€‰‰±ÕÈˆ¤ì(€€€€€€€€€¥˜€ …•±•µ•¹Ñ…Ñ„¹™½ÕÍ•ñð€…•Ù•¹Ð¹É•±…Ñ•‘Q…É•Ð¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€•±•µ•¹Ñ…Ñ„¹™½ÕÍ•€ô™…±Í”ì(€€€€€€€ô•±Í”¥˜€¡‰…Í•9…µ”€ôôô€‰™½ÕÌˆ¤ì(€€€€€€€€€¥˜€¡•±•µ•¹Ñ…Ñ„¹™½ÕÍ•¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€•±•µ•¹Ñ…Ñ„¹™½ÕÍ•€ôÑÉÕ”ì(€€€€€€€ô(€€€€€€€¥˜€ …Ù…±Õ••ÑÑ•È¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€¥èÑ¡¥Ì¹‘…Ñ„¹¥°(€€€€€€€€€€€¹…µ”è•Ù•¹Ñ9…µ”°(€€€€€€€€€€€Ù…±Õ”èÙ…±Õ••ÑÑ•È¡•Ù•¹Ð¤(€€€€€€€€€ô(€€€€€€€ô¤ì(€€€€€ô¤ì(€€€ô(€ô(€}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•ÉÌ¡•±•µ•¹Ð°•±•µ•¹Ñ…Ñ„°¹…µ•Ì°•ÑÑ•È¤ì(€€€½¹ÍÐì(€€€€€…Ñ¥½¹Ì(€€€ô€ôÑ¡¥Ì¹‘…Ñ„ì(€€€™½È€¡½¹ÍÐm‰…Í•9…µ”°•Ù•¹Ñ9…µ•t½˜¹…µ•Ì¤ì(€€€€€¥˜€¡•Ù•¹Ñ9…µ”€ôôô€‰Ñ¥½¸ˆñð…Ñ¥½¹Ìü¹¡…Ì¡•Ù•¹Ñ9…µ”¤¤ì(€€€€€€€¥˜€¡•Ù•¹Ñ9…µ”€ôôô€‰½ÕÌˆñð•Ù•¹Ñ9…µ”€ôôô€‰	±ÕÈˆ¤ì(€€€€€€€€€•±•µ•¹Ñ…Ñ„ñðôì(€€€€€€€€€€€™½ÕÍ•è™…±Í”(€€€€€€€€€ôì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¹}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•È¡•±•µ•¹Ð°•±•µ•¹Ñ…Ñ„°‰…Í•9…µ”°•Ù•¹Ñ9…µ”°•ÑÑ•È¤ì(€€€€€€€¥˜€¡•Ù•¹Ñ9…µ”€ôôô€‰½ÕÌˆ€˜˜€……Ñ¥½¹Ìü¹¡…Ì ‰	±ÕÈˆ¤¤ì(€€€€€€€€€Ñ¡¥Ì¹}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•È¡•±•µ•¹Ð°•±•µ•¹Ñ…Ñ„°€‰‰±ÕÈˆ°€‰	±ÕÈˆ°¹Õ±°¤ì(€€€€€€€ô•±Í”¥˜€¡•Ù•¹Ñ9…µ”€ôôô€‰	±ÕÈˆ€˜˜€……Ñ¥½¹Ìü¹¡…Ì ‰½ÕÌˆ¤¤ì(€€€€€€€€€Ñ¡¥Ì¹}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•È¡•±•µ•¹Ð°•±•µ•¹Ñ…Ñ„°€‰™½ÕÌˆ°€‰½ÕÌˆ°¹Õ±°¤ì(€€€€€€€ô(€€€€€ô(€€€ô(€ô(€}Í•ÑQ•áÑMÑå±”¡•±•µ•¹Ð¤ì(€€€½¹ÍÐQaQ}1%959P€ôl‰±•™Ðˆ°€‰•¹Ñ•Èˆ°€‰É¥¡Ð‰tì(€€€½¹ÍÐì(€€€€€™½¹Ñ½±½È(€€€ô€ôÑ¡¥Ì¹‘…Ñ„¹‘•™…Õ±ÑÁÁ•…É…¹•…Ñ„ì(€€€½¹ÍÐ™½¹ÑM¥é”€ôÑ¡¥Ì¹‘…Ñ„¹‘•™…Õ±ÑÁÁ•…É…¹•…Ñ„¹™½¹ÑM¥é”ñð…¹¹½Ñ…Ñ¥½¹}±…å•É}U1Q}=9Q}M%iì(€€€½¹ÍÐÍÑå±”€ô•±•µ•¹Ð¹ÍÑå±”ì(€€€±•Ð½µÁÕÑ•‘½¹ÑM¥é”ì(€€€½¹ÍÐ	=II}M%i€ô€Èì(€€€½¹ÍÐÉ½Õ¹‘Q½=¹••¥µ…°€ôà€ôø5…Ñ ¹É½Õ¹ ÄÀ€¨à¤€¼€ÄÀì(€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹µÕ±Ñ¥1¥¹”¤ì(€€€€€½¹ÍÐ¡•¥¡Ð€ô5…Ñ ¹…‰Ì¡Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÍt€´Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÅt€´	=II}M%i¤ì(€€€€€½¹ÍÐ¹Õµ‰•É=™1¥¹•Ì€ô5…Ñ ¹É½Õ¹¡¡•¥¡Ð€¼€  ¼¨¥¹±¥¹••áÁ½ÉÐ€¹1%9}Q=H€¨¼Ä¸ÌÔ¤€¨™½¹ÑM¥é”¤¤ñð€Äì(€€€€€½¹ÍÐ±¥¹•!•¥¡Ð€ô¡•¥¡Ð€¼¹Õµ‰•É=™1¥¹•Ìì(€€€€€½µÁÕÑ•‘½¹ÑM¥é”€ô5…Ñ ¹µ¥¸¡™½¹ÑM¥é”°É½Õ¹‘Q½=¹••¥µ…°¡±¥¹•!•¥¡Ð€¼€ ¼¨¥¹±¥¹••áÁ½ÉÐ€¹1%9}Q=H€¨¼Ä¸ÌÔ¤¤¤ì(€€€ô•±Í”ì(€€€€€½¹ÍÐ¡•¥¡Ð€ô5…Ñ ¹…‰Ì¡Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÍt€´Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÅt€´	=II}M%i¤ì(€€€€€½µÁÕÑ•‘½¹ÑM¥é”€ô5…Ñ ¹µ¥¸¡™½¹ÑM¥é”°É½Õ¹‘Q½=¹••¥µ…°¡¡•¥¡Ð€¼€ ¼¨¥¹±¥¹••áÁ½ÉÐ€¹1%9}Q=H€¨¼Ä¸ÌÔ¤¤¤ì(€€€ô(€€€ÍÑå±”¹™½¹ÑM¥é”€ô…±Œ ‘í½µÁÕÑ•‘½¹ÑM¥é•õÁà€¨Ù…È ´µÑ½Ñ…°µÍ…±”µ™…Ñ½È¤¥€ì(€€€ÍÑå±”¹½±½È€ôUÑ¥°¹µ…­•!•á½±½È ¸¸¹™½¹Ñ½±½È¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹Ñ•áÑ±¥¹µ•¹Ð€„ôô¹Õ±°€˜˜€…Ñ¡¥Ì¹‘…Ñ„¹½µˆ¤ì(€€€€€ÍÑå±”¹Ñ•áÑ±¥¸€ôQaQ}1%959QmÑ¡¥Ì¹‘…Ñ„¹Ñ•áÑ±¥¹µ•¹Ñtì(€€€ô(€ô(€}Í•ÑI•ÅÕ¥É•¡•±•µ•¹Ð°¥ÍI•ÅÕ¥É•¤ì(€€€¥˜€¡¥ÍI•ÅÕ¥É•¤ì(€€€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰É•ÅÕ¥É•ˆ°ÑÉÕ”¤ì(€€€ô•±Í”ì(€€€€€•±•µ•¹Ð¹É•µ½Ù•ÑÑÉ¥‰ÕÑ” ‰É•ÅÕ¥É•ˆ¤ì(€€€ô(€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µÉ•ÅÕ¥É•ˆ°¥ÍI•ÅÕ¥É•¤ì(€ô)ô)±…ÍÌQ•áÑ]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€½¹ÍÐ¥ÍI•¹‘•É…‰±”€ôÁ…É…µ•Ñ•ÉÌ¹É•¹‘•É½ÉµÌñðÁ…É…µ•Ñ•ÉÌ¹‘…Ñ„¹¡…Í=Ý¹…¹Ù…Ìñð€…Á…É…µ•Ñ•ÉÌ¹‘…Ñ„¹¡…ÍÁÁ•…É…¹”€˜˜€„…Á…É…µ•Ñ•ÉÌ¹‘…Ñ„¹™¥•±‘Y…±Õ”ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”(€€€ô¤ì(€ô(€Í•ÑAÉ½Á•ÉÑå=¹M¥‰±¥¹Ì¡‰…Í”°­•ä°Ù…±Õ”°­•å%¹MÑ½É…”¤ì(€€€½¹ÍÐÍÑ½É…”€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¹}•Ñ±•µ•¹ÑÍ	å9…µ”¡‰…Í”¹¹…µ”°‰…Í”¹¥¤¤ì(€€€€€¥˜€¡•±•µ•¹Ð¹‘½µ±•µ•¹Ð¤ì(€€€€€€€•±•µ•¹Ð¹‘½µ±•µ•¹Ñm­•åt€ôÙ…±Õ”ì(€€€€€ô(€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡•±•µ•¹Ð¹¥°ì(€€€€€€€m­•å%¹MÑ½É…•tèÙ…±Õ”(€€€€€ô¤ì(€€€ô(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐÍÑ½É…”€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€€€½¹ÍÐ¥€ôÑ¡¥Ì¹‘…Ñ„¹¥ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰Ñ•áÑ]¥‘•Ñ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€±•Ð•±•µ•¹Ð€ô¹Õ±°ì(€€€¥˜€¡Ñ¡¥Ì¹É•¹‘•É½ÉµÌ¤ì(€€€€€½¹ÍÐÍÑ½É•‘…Ñ„€ôÍÑ½É…”¹•ÑY…±Õ”¡¥°ì(€€€€€€€Ù…±Õ”èÑ¡¥Ì¹‘…Ñ„¹™¥•±‘Y…±Õ”(€€€€€ô¤ì(€€€€€±•ÐÑ•áÑ½¹Ñ•¹Ð€ôÍÑ½É•‘…Ñ„¹Ù…±Õ”ñð€ˆˆì(€€€€€½¹ÍÐµ…á1•¸€ôÍÑ½É…”¹•ÑY…±Õ”¡¥°ì(€€€€€€€¡…É1¥µ¥ÐèÑ¡¥Ì¹‘…Ñ„¹µ…á1•¸(€€€€€ô¤¹¡…É1¥µ¥Ðì(€€€€€¥˜€¡µ…á1•¸€˜˜Ñ•áÑ½¹Ñ•¹Ð¹±•¹Ñ €øµ…á1•¸¤ì(€€€€€€€Ñ•áÑ½¹Ñ•¹Ð€ôÑ•áÑ½¹Ñ•¹Ð¹Í±¥” À°µ…á1•¸¤ì(€€€€€ô(€€€€€±•Ð™¥•±‘½Éµ…ÑÑ•‘Y…±Õ•Ì€ôÍÑ½É•‘…Ñ„¹™½Éµ…ÑÑ•‘Y…±Õ”ñðÑ¡¥Ì¹‘…Ñ„¹Ñ•áÑ½¹Ñ•¹Ðü¹©½¥¸ ‰q¸ˆ¤ñð¹Õ±°ì(€€€€€¥˜€¡™¥•±‘½Éµ…ÑÑ•‘Y…±Õ•Ì€˜˜Ñ¡¥Ì¹‘…Ñ„¹½µˆ¤ì(€€€€€€€™¥•±‘½Éµ…ÑÑ•‘Y…±Õ•Ì€ô™¥•±‘½Éµ…ÑÑ•‘Y…±Õ•Ì¹É•Á±…•±° ½qÌ¬½œ°€ˆˆ¤ì(€€€€€ô(€€€€€½¹ÍÐ•±•µ•¹Ñ…Ñ„€ôì(€€€€€€€ÕÍ•ÉY…±Õ”èÑ•áÑ½¹Ñ•¹Ð°(€€€€€€€™½Éµ…ÑÑ•‘Y…±Õ”è™¥•±‘½Éµ…ÑÑ•‘Y…±Õ•Ì°(€€€€€€€±…ÍÑ½µµ¥ÑÑ•‘Y…±Õ”è¹Õ±°°(€€€€€€€½µµ¥Ñ-•äè€Ä°(€€€€€€€™½ÕÍ•è™…±Í”(€€€€€ôì(€€€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹µÕ±Ñ¥1¥¹”¤ì(€€€€€€€•±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰Ñ•áÑ…É•„ˆ¤ì(€€€€€€€•±•µ•¹Ð¹Ñ•áÑ½¹Ñ•¹Ð€ô™¥•±‘½Éµ…ÑÑ•‘Y…±Õ•Ì€üüÑ•áÑ½¹Ñ•¹Ðì(€€€€€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹‘½9½ÑMÉ½±°¤ì(€€€€€€€€€•±•µ•¹Ð¹ÍÑå±”¹½Ù•É™±½Ýd€ô€‰¡¥‘‘•¸ˆì(€€€€€€€ô(€€€€€ô•±Í”ì(€€€€€€€•±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰¥¹ÁÕÐˆ¤ì(€€€€€€€•±•µ•¹Ð¹ÑåÁ”€ôÑ¡¥Ì¹‘…Ñ„¹Á…ÍÍÝ½É€ü€‰Á…ÍÍÝ½Éˆ€è€‰Ñ•áÐˆì(€€€€€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ù…±Õ”ˆ°™¥•±‘½Éµ…ÑÑ•‘Y…±Õ•Ì€üüÑ•áÑ½¹Ñ•¹Ð¤ì(€€€€€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹‘½9½ÑMÉ½±°¤ì(€€€€€€€€€•±•µ•¹Ð¹ÍÑå±”¹½Ù•É™±½Ý`€ô€‰¡¥‘‘•¸ˆì(€€€€€€€ô(€€€€€ô(€€€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹¡…Í=Ý¹…¹Ù…Ì¤ì(€€€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡…Í=Ý¹…¹Ù…Ìˆ¤ì(€€€€€€€¥˜€¡ÍÑ½É…”¹¡…Ì¡¥¤¤ì(€€€€€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰Í…¹‘‰½á5½‘¥™¥•ˆ¤ì(€€€€€€€ô(€€€€€ô(€€€€€•Ñ±•µ•¹ÑÍ	å9…µ•M•Ð¹…‘¡•±•µ•¹Ð¤ì(€€€€€Ñ¡¥Ì¹½¹Ñ•¹Ñ±•µ•¹Ð€ô•±•µ•¹Ðì(€€€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ•±•µ•¹Ðµ¥ˆ°¥¤ì(€€€€€•±•µ•¹Ð¹‘¥Í…‰±•€ôÑ¡¥Ì¹‘…Ñ„¹É•…‘=¹±äì(€€€€€•±•µ•¹Ð¹¹…µ”€ôÑ¡¥Ì¹‘…Ñ„¹™¥•±‘9…µ”ì(€€€€€•±•µ•¹Ð¹Ñ…‰%¹‘•à€ô€Àì(€€€€€½¹ÍÐì(€€€€€€€‘…Ñ•Ñ¥µ•½Éµ…Ð°(€€€€€€€‘…Ñ•Ñ¥µ•QåÁ”°(€€€€€€€Ñ¥µ•MÑ•À(€€€€€ô€ôÑ¡¥Ì¹‘…Ñ„ì(€€€€€½¹ÍÐ¡…Í…Ñ•=ÉQ¥µ”€ô€„…‘…Ñ•Ñ¥µ•QåÁ”€˜˜Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œì(€€€€€¥˜€¡‘…Ñ•Ñ¥µ•½Éµ…Ð¤ì(€€€€€€€•±•µ•¹Ð¹Ñ¥Ñ±”€ô‘…Ñ•Ñ¥µ•½Éµ…Ðì(€€€€€ô(€€€€€Ñ¡¥Ì¹}Í•ÑI•ÅÕ¥É•¡•±•µ•¹Ð°Ñ¡¥Ì¹‘…Ñ„¹É•ÅÕ¥É•¤ì(€€€€€¥˜€¡µ…á1•¸¤ì(€€€€€€€•±•µ•¹Ð¹µ…á1•¹Ñ €ôµ…á1•¸ì(€€€€€ô(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¥¹ÁÕÐˆ°•Ù•¹Ð€ôøì(€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€Ù…±Õ”è•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”(€€€€€€€ô¤ì(€€€€€€€Ñ¡¥Ì¹Í•ÑAÉ½Á•ÉÑå=¹M¥‰±¥¹Ì¡•±•µ•¹Ð°€‰Ù…±Õ”ˆ°•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”°€‰Ù…±Õ”ˆ¤ì(€€€€€€€•±•µ•¹Ñ…Ñ„¹™½Éµ…ÑÑ•‘Y…±Õ”€ô¹Õ±°ì(€€€€€ô¤ì(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰É•Í•Ñ™½É´ˆ°•Ù•¹Ð€ôøì(€€€€€€€½¹ÍÐ‘•™…Õ±ÑY…±Õ”€ôÑ¡¥Ì¹‘…Ñ„¹‘•™…Õ±Ñ¥•±‘Y…±Õ”€üü€ˆˆì(€€€€€€€•±•µ•¹Ð¹Ù…±Õ”€ô•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”€ô‘•™…Õ±ÑY…±Õ”ì(€€€€€€€•±•µ•¹Ñ…Ñ„¹™½Éµ…ÑÑ•‘Y…±Õ”€ô¹Õ±°ì(€€€€€ô¤ì(€€€€€±•Ð‰±ÕÉ1¥ÍÑ•¹•È€ô•Ù•¹Ð€ôøì(€€€€€€€½¹ÍÐì(€€€€€€€€€™½Éµ…ÑÑ•‘Y…±Õ”(€€€€€€€ô€ô•±•µ•¹Ñ…Ñ„ì(€€€€€€€¥˜€¡™½Éµ…ÑÑ•‘Y…±Õ”€„ôô¹Õ±°€˜˜™½Éµ…ÑÑ•‘Y…±Õ”€„ôôÕ¹‘•™¥¹•¤ì(€€€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”€ô™½Éµ…ÑÑ•‘Y…±Õ”ì(€€€€€€€ô(€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹ÍÉ½±±1•™Ð€ô€Àì(€€€€€ôì(€€€€€¥˜€¡Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ€˜˜Ñ¡¥Ì¹¡…Í)MÑ¥½¹Ì¤ì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰™½ÕÌˆ°•Ù•¹Ð€ôøì(€€€€€€€€€¥˜€¡•±•µ•¹Ñ…Ñ„¹™½ÕÍ•¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€Ñ…É•Ð(€€€€€€€€€ô€ô•Ù•¹Ðì(€€€€€€€€€¥˜€¡¡…Í…Ñ•=ÉQ¥µ”¤ì(€€€€€€€€€€€Ñ…É•Ð¹ÑåÁ”€ô‘…Ñ•Ñ¥µ•QåÁ”ì(€€€€€€€€€€€¥˜€¡Ñ¥µ•MÑ•À¤ì(€€€€€€€€€€€€€Ñ…É•Ð¹ÍÑ•À€ôÑ¥µ•MÑ•Àì(€€€€€€€€€€€ô(€€€€€€€€€ô(€€€€€€€€€¥˜€¡•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”¤ì(€€€€€€€€€€€½¹ÍÐÙ…±Õ”€ô•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”ì(€€€€€€€€€€€¥˜€¡¡…Í…Ñ•=ÉQ¥µ”¤ì(€€€€€€€€€€€€€¥˜€¡‘…Ñ•Ñ¥µ•QåÁ”€ôôô€‰Ñ¥µ”ˆ¤ì(€€€€€€€€€€€€€€€½¹ÍÐ‘…Ñ”€ô¹•Ü…Ñ”¡Ù…±Õ”¤ì(€€€€€€€€€€€€€€€½¹ÍÐÁ…ÉÑÌ€ôm‘…Ñ”¹•Ñ!½ÕÉÌ ¤°‘…Ñ”¹•Ñ5¥¹ÕÑ•Ì ¤°‘…Ñ”¹•ÑM•½¹‘Ì ¥tì(€€€€€€€€€€€€€€€Ñ…É•Ð¹Ù…±Õ”€ôÁ…ÉÑÌ¹µ…À¡Ø€ôøØ¹Ñ½MÑÉ¥¹œ ¤¹Á…‘MÑ…ÉÐ È°€ˆÀˆ¤¤¹©½¥¸ ˆèˆ¤ì(€€€€€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€€€€€Ñ…É•Ð¹Ù…±Õ”€ô¹•Ü…Ñ”¡Ù…±Õ”€´Q%5i=9}=MP¤¹Ñ½%M=MÑÉ¥¹œ ¤¹ÍÁ±¥Ð¡‘…Ñ•Ñ¥µ•QåÁ”€ôôô€‰‘…Ñ”ˆ€ü€‰Pˆ€è€ˆ¸ˆ°€Ä¥lÁtì(€€€€€€€€€€€€€ô(€€€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€€€Ñ…É•Ð¹Ù…±Õ”€ôÙ…±Õ”ì(€€€€€€€€€€€ô(€€€€€€€€€ô(€€€€€€€€€•±•µ•¹Ñ…Ñ„¹±…ÍÑ½µµ¥ÑÑ•‘Y…±Õ”€ôÑ…É•Ð¹Ù…±Õ”ì(€€€€€€€€€•±•µ•¹Ñ…Ñ„¹½µµ¥Ñ-•ä€ô€Äì(€€€€€€€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹…Ñ¥½¹Ìü¹¡…Ì ‰½ÕÌˆ¤¤ì(€€€€€€€€€€€•±•µ•¹Ñ…Ñ„¹™½ÕÍ•€ôÑÉÕ”ì(€€€€€€€€€ô(€€€€€€€ô¤ì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰ÕÁ‘…Ñ•™É½µÍ…¹‘‰½àˆ°©ÍÙ•¹Ð€ôøì(€€€€€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰Í…¹‘‰½á5½‘¥™¥•ˆ¤ì(€€€€€€€€€½¹ÍÐ…Ñ¥½¹Ì€ôì(€€€€€€€€€€€Ù…±Õ”¡•Ù•¹Ð¤ì(€€€€€€€€€€€€€•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”€ô•Ù•¹Ð¹‘•Ñ…¥°¹Ù…±Õ”€üü€ˆˆì(€€€€€€€€€€€€€¥˜€ …¡…Í…Ñ•=ÉQ¥µ”¤ì(€€€€€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€€€€€Ù…±Õ”è•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”¹Ñ½MÑÉ¥¹œ ¤(€€€€€€€€€€€€€€€ô¤ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”€ô•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”ì(€€€€€€€€€€€ô°(€€€€€€€€€€€™½Éµ…ÑÑ•‘Y…±Õ”¡•Ù•¹Ð¤ì(€€€€€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€€€€€™½Éµ…ÑÑ•‘Y…±Õ”(€€€€€€€€€€€€€ô€ô•Ù•¹Ð¹‘•Ñ…¥°ì(€€€€€€€€€€€€€•±•µ•¹Ñ…Ñ„¹™½Éµ…ÑÑ•‘Y…±Õ”€ô™½Éµ…ÑÑ•‘Y…±Õ”ì(€€€€€€€€€€€€€¥˜€¡™½Éµ…ÑÑ•‘Y…±Õ”€„ôô¹Õ±°€˜˜™½Éµ…ÑÑ•‘Y…±Õ”€„ôôÕ¹‘•™¥¹•€˜˜•Ù•¹Ð¹Ñ…É•Ð€„ôô‘½Õµ•¹Ð¹…Ñ¥Ù•±•µ•¹Ð¤ì(€€€€€€€€€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”€ô™½Éµ…ÑÑ•‘Y…±Õ”ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€½¹ÍÐ‘…Ñ„€ôì(€€€€€€€€€€€€€€€™½Éµ…ÑÑ•‘Y…±Õ”(€€€€€€€€€€€€€ôì(€€€€€€€€€€€€€¥˜€¡¡…Í…Ñ•=ÉQ¥µ”¤ì(€€€€€€€€€€€€€€€‘…Ñ„¹Ù…±Õ”€ô™½Éµ…ÑÑ•‘Y…±Õ”ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°‘…Ñ„¤ì(€€€€€€€€€€€ô°(€€€€€€€€€€€Í•±I…¹”¡•Ù•¹Ð¤ì(€€€€€€€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹Í•ÑM•±•Ñ¥½¹I…¹” ¸¸¹•Ù•¹Ð¹‘•Ñ…¥°¹Í•±I…¹”¤ì(€€€€€€€€€€€ô°(€€€€€€€€€€€¡…É1¥µ¥Ðè•Ù•¹Ð€ôøì(€€€€€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€€€€€¡…É1¥µ¥Ð(€€€€€€€€€€€€€ô€ô•Ù•¹Ð¹‘•Ñ…¥°ì(€€€€€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€€€€€Ñ…É•Ð(€€€€€€€€€€€€€ô€ô•Ù•¹Ðì(€€€€€€€€€€€€€¥˜€¡¡…É1¥µ¥Ð€ôôô€À¤ì(€€€€€€€€€€€€€€€Ñ…É•Ð¹É•µ½Ù•ÑÑÉ¥‰ÕÑ” ‰µ…á1•¹Ñ ˆ¤ì(€€€€€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€Ñ…É•Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰µ…á1•¹Ñ ˆ°¡…É1¥µ¥Ð¤ì(€€€€€€€€€€€€€±•ÐÙ…±Õ”€ô•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”ì(€€€€€€€€€€€€€¥˜€ …Ù…±Õ”ñðÙ…±Õ”¹±•¹Ñ €ðô¡…É1¥µ¥Ð¤ì(€€€€€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€Ù…±Õ”€ôÙ…±Õ”¹Í±¥” À°¡…É1¥µ¥Ð¤ì(€€€€€€€€€€€€€Ñ…É•Ð¹Ù…±Õ”€ô•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”€ôÙ…±Õ”ì(€€€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€€€Ù…±Õ”(€€€€€€€€€€€€€ô¤ì(€€€€€€€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€€€€€€€¥°(€€€€€€€€€€€€€€€€€¹…µ”è€‰-•åÍÑÉ½­”ˆ°(€€€€€€€€€€€€€€€€€Ù…±Õ”°(€€€€€€€€€€€€€€€€€Ý¥±±½µµ¥ÐèÑÉÕ”°(€€€€€€€€€€€€€€€€€½µµ¥Ñ-•äè€Ä°(€€€€€€€€€€€€€€€€€Í•±MÑ…ÉÐèÑ…É•Ð¹Í•±•Ñ¥½¹MÑ…ÉÐ°(€€€€€€€€€€€€€€€€€Í•±¹èÑ…É•Ð¹Í•±•Ñ¥½¹¹(€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€ô¤ì(€€€€€€€€€€€ô(€€€€€€€€€ôì(€€€€€€€€€Ñ¡¥Ì¹}‘¥ÍÁ…Ñ¡Ù•¹ÑÉ½µM…¹‘‰½à¡…Ñ¥½¹Ì°©ÍÙ•¹Ð¤ì(€€€€€€€ô¤ì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°•Ù•¹Ð€ôøì(€€€€€€€€€•±•µ•¹Ñ…Ñ„¹½µµ¥Ñ-•ä€ô€Äì(€€€€€€€€€±•Ð½µµ¥Ñ-•ä€ô€´Äì(€€€€€€€€€¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰Í…Á”ˆ¤ì(€€€€€€€€€€€½µµ¥Ñ-•ä€ô€Àì(€€€€€€€€€ô•±Í”¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰¹Ñ•Èˆ€˜˜€…Ñ¡¥Ì¹‘…Ñ„¹µÕ±Ñ¥1¥¹”¤ì(€€€€€€€€€€€½µµ¥Ñ-•ä€ô€Èì(€€€€€€€€€ô•±Í”¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰Q…ˆˆ¤ì(€€€€€€€€€€€•±•µ•¹Ñ…Ñ„¹½µµ¥Ñ-•ä€ô€Ìì(€€€€€€€€€ô(€€€€€€€€€¥˜€¡½µµ¥Ñ-•ä€ôôô€´Ä¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€Ù…±Õ”(€€€€€€€€€ô€ô•Ù•¹Ð¹Ñ…É•Ðì(€€€€€€€€€¥˜€¡•±•µ•¹Ñ…Ñ„¹±…ÍÑ½µµ¥ÑÑ•‘Y…±Õ”€ôôôÙ…±Õ”¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€•±•µ•¹Ñ…Ñ„¹±…ÍÑ½µµ¥ÑÑ•‘Y…±Õ”€ôÙ…±Õ”ì(€€€€€€€€€•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”€ôÙ…±Õ”ì(€€€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€€€¥°(€€€€€€€€€€€€€¹…µ”è€‰-•åÍÑÉ½­”ˆ°(€€€€€€€€€€€€€Ù…±Õ”°(€€€€€€€€€€€€€Ý¥±±½µµ¥ÐèÑÉÕ”°(€€€€€€€€€€€€€½µµ¥Ñ-•ä°(€€€€€€€€€€€€€Í•±MÑ…ÉÐè•Ù•¹Ð¹Ñ…É•Ð¹Í•±•Ñ¥½¹MÑ…ÉÐ°(€€€€€€€€€€€€€Í•±¹è•Ù•¹Ð¹Ñ…É•Ð¹Í•±•Ñ¥½¹¹(€€€€€€€€€€€ô(€€€€€€€€€ô¤ì(€€€€€€€ô¤ì(€€€€€€€½¹ÍÐ}‰±ÕÉ1¥ÍÑ•¹•È€ô‰±ÕÉ1¥ÍÑ•¹•Èì(€€€€€€€‰±ÕÉ1¥ÍÑ•¹•È€ô¹Õ±°ì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‰±ÕÈˆ°•Ù•¹Ð€ôøì(€€€€€€€€€¥˜€ …•±•µ•¹Ñ…Ñ„¹™½ÕÍ•ñð€…•Ù•¹Ð¹É•±…Ñ•‘Q…É•Ð¤ì(€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ô(€€€€€€€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹…Ñ¥½¹Ìü¹¡…Ì ‰	±ÕÈˆ¤¤ì(€€€€€€€€€€€•±•µ•¹Ñ…Ñ„¹™½ÕÍ•€ô™…±Í”ì(€€€€€€€€€ô(€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€Ñ…É•Ð(€€€€€€€€€ô€ô•Ù•¹Ðì(€€€€€€€€€±•Ðì(€€€€€€€€€€€Ù…±Õ”(€€€€€€€€€ô€ôÑ…É•Ðì(€€€€€€€€€¥˜€¡¡…Í…Ñ•=ÉQ¥µ”¤ì(€€€€€€€€€€€¥˜€¡Ù…±Õ”€˜˜‘…Ñ•Ñ¥µ•QåÁ”€ôôô€‰Ñ¥µ”ˆ¤ì(€€€€€€€€€€€€€½¹ÍÐÁ…ÉÑÌ€ôÙ…±Õ”¹ÍÁ±¥Ð ˆèˆ¤¹µ…À¡Ø€ôøÁ…ÉÍ•%¹Ð¡Ø°€ÄÀ¤¤ì(€€€€€€€€€€€€€Ù…±Õ”€ô¹•Ü…Ñ” ÈÀÀÀ°€À°€Ä°Á…ÉÑÍlÁt°Á…ÉÑÍlÅt°Á…ÉÑÍlÉtñð€À¤¹Ù…±Õ•=˜ ¤ì(€€€€€€€€€€€€€Ñ…É•Ð¹ÍÑ•À€ô€ˆˆì(€€€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€€€¥˜€ …Ù…±Õ”¹¥¹±Õ‘•Ì ‰Pˆ¤¤ì(€€€€€€€€€€€€€€€Ù…±Õ”€ô€‘íÙ…±Õ•õPÀÀèÀÁ€ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€Ù…±Õ”€ô¹•Ü…Ñ”¡Ù…±Õ”¤¹Ù…±Õ•=˜ ¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€Ñ…É•Ð¹ÑåÁ”€ô€‰Ñ•áÐˆì(€€€€€€€€€ô(€€€€€€€€€•±•µ•¹Ñ…Ñ„¹ÕÍ•ÉY…±Õ”€ôÙ…±Õ”ì(€€€€€€€€€¥˜€¡•±•µ•¹Ñ…Ñ„¹±…ÍÑ½µµ¥ÑÑ•‘Y…±Õ”€„ôôÙ…±Õ”¤ì(€€€€€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€€€€€¥°(€€€€€€€€€€€€€€€¹…µ”è€‰-•åÍÑÉ½­”ˆ°(€€€€€€€€€€€€€€€Ù…±Õ”°(€€€€€€€€€€€€€€€Ý¥±±½µµ¥ÐèÑÉÕ”°(€€€€€€€€€€€€€€€½µµ¥Ñ-•äè•±•µ•¹Ñ…Ñ„¹½µµ¥Ñ-•ä°(€€€€€€€€€€€€€€€Í•±MÑ…ÉÐè•Ù•¹Ð¹Ñ…É•Ð¹Í•±•Ñ¥½¹MÑ…ÉÐ°(€€€€€€€€€€€€€€€Í•±¹è•Ù•¹Ð¹Ñ…É•Ð¹Í•±•Ñ¥½¹¹(€€€€€€€€€€€€€ô(€€€€€€€€€€€ô¤ì(€€€€€€€€€ô(€€€€€€€€€}‰±ÕÉ1¥ÍÑ•¹•È¡•Ù•¹Ð¤ì(€€€€€€€ô¤ì(€€€€€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹…Ñ¥½¹Ìü¹¡…Ì ‰-•åÍÑÉ½­”ˆ¤¤ì(€€€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‰•™½É•¥¹ÁÕÐˆ°•Ù•¹Ð€ôøì(€€€€€€€€€€€•±•µ•¹Ñ…Ñ„¹±…ÍÑ½µµ¥ÑÑ•‘Y…±Õ”€ô¹Õ±°ì(€€€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€€€‘…Ñ„°(€€€€€€€€€€€€€Ñ…É•Ð(€€€€€€€€€€€ô€ô•Ù•¹Ðì(€€€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€€€Ù…±Õ”°(€€€€€€€€€€€€€Í•±•Ñ¥½¹MÑ…ÉÐ°(€€€€€€€€€€€€€Í•±•Ñ¥½¹¹(€€€€€€€€€€€ô€ôÑ…É•Ðì(€€€€€€€€€€€±•ÐÍ•±MÑ…ÉÐ€ôÍ•±•Ñ¥½¹MÑ…ÉÐ°(€€€€€€€€€€€€€Í•±¹€ôÍ•±•Ñ¥½¹¹ì(€€€€€€€€€€€ÍÝ¥Ñ €¡•Ù•¹Ð¹¥¹ÁÕÑQåÁ”¤ì(€€€€€€€€€€€€€…Í”€‰‘•±•Ñ•]½É‘	…­Ý…Éˆè(€€€€€€€€€€€€€€€ì(€€€€€€€€€€€€€€€€€½¹ÍÐÝ½É‘¡…ÉA…ÑÑ•É¸€ô€½qÜ¼ì(€€€€€€€€€€€€€€€€€Ý¡¥±”€¡Í•±MÑ…ÉÐ€ø€À€˜˜€…Ý½É‘¡…ÉA…ÑÑ•É¸¹Ñ•ÍÐ¡Ù…±Õ•mÍ•±MÑ…ÉÐ€´€Åt¤¤ì(€€€€€€€€€€€€€€€€€€€Í•±MÑ…ÉÐ´´ì(€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€Ý¡¥±”€¡Í•±MÑ…ÉÐ€ø€À€˜˜Ý½É‘¡…ÉA…ÑÑ•É¸¹Ñ•ÍÐ¡Ù…±Õ•mÍ•±MÑ…ÉÐ€´€Åt¤¤ì(€€€€€€€€€€€€€€€€€€€Í•±MÑ…ÉÐ´´ì(€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€…Í”€‰‘•±•Ñ•]½É‘½ÉÝ…Éˆè(€€€€€€€€€€€€€€€ì(€€€€€€€€€€€€€€€€€½¹ÍÐµ…Ñ €ôÙ…±Õ”¹ÍÕ‰ÍÑÉ¥¹œ¡Í•±•Ñ¥½¹MÑ…ÉÐ¤¹µ…Ñ  ½yq\©qÜ¨¼¤ì(€€€€€€€€€€€€€€€€€¥˜€¡µ…Ñ ¤ì(€€€€€€€€€€€€€€€€€€€Í•±¹€¬ôµ…Ñ¡lÁt¹±•¹Ñ ì(€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€…Í”€‰‘•±•Ñ•½¹Ñ•¹Ñ	…­Ý…Éˆè(€€€€€€€€€€€€€€€¥˜€¡Í•±•Ñ¥½¹MÑ…ÉÐ€ôôôÍ•±•Ñ¥½¹¹¤ì(€€€€€€€€€€€€€€€€€Í•±MÑ…ÉÐ€´ô€Äì(€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€€€€€…Í”€‰‘•±•Ñ•½¹Ñ•¹Ñ½ÉÝ…Éˆè(€€€€€€€€€€€€€€€¥˜€¡Í•±•Ñ¥½¹MÑ…ÉÐ€ôôôÍ•±•Ñ¥½¹¹¤ì(€€€€€€€€€€€€€€€€€Í•±¹€¬ô€Äì(€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€€€ô(€€€€€€€€€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€€€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€€€€€¥°(€€€€€€€€€€€€€€€¹…µ”è€‰-•åÍÑÉ½­”ˆ°(€€€€€€€€€€€€€€€Ù…±Õ”°(€€€€€€€€€€€€€€€¡…¹”è‘…Ñ„ñð€ˆˆ°(€€€€€€€€€€€€€€€Ý¥±±½µµ¥Ðè™…±Í”°(€€€€€€€€€€€€€€€Í•±MÑ…ÉÐ°(€€€€€€€€€€€€€€€Í•±¹(€€€€€€€€€€€€€ô(€€€€€€€€€€€ô¤ì(€€€€€€€€€ô¤ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¹}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•ÉÌ¡•±•µ•¹Ð°•±•µ•¹Ñ…Ñ„°ml‰™½ÕÌˆ°€‰½ÕÌ‰t°l‰‰±ÕÈˆ°€‰	±ÕÈ‰t°l‰µ½ÕÍ•‘½Ý¸ˆ°€‰5½ÕÍ”½Ý¸‰t°l‰µ½ÕÍ••¹Ñ•Èˆ°€‰5½ÕÍ”¹Ñ•È‰t°l‰µ½ÕÍ•±•…Ù”ˆ°€‰5½ÕÍ”á¥Ð‰t°l‰µ½ÕÍ•ÕÀˆ°€‰5½ÕÍ”UÀ‰ut°•Ù•¹Ð€ôø•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”¤ì(€€€€€ô(€€€€€¥˜€¡‰±ÕÉ1¥ÍÑ•¹•È¤ì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‰±ÕÈˆ°‰±ÕÉ1¥ÍÑ•¹•È¤ì(€€€€€ô(€€€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹½µˆ¤ì(€€€€€€€½¹ÍÐ™¥•±‘]¥‘Ñ €ôÑ¡¥Ì¹‘…Ñ„¹É•ÑlÉt€´Ñ¡¥Ì¹‘…Ñ„¹É•ÑlÁtì(€€€€€€€½¹ÍÐ½µ‰]¥‘Ñ €ô™¥•±‘]¥‘Ñ €¼µ…á1•¸ì(€€€€€€€•±•µ•¹Ð¹±…ÍÍ1¥ÍÐ¹…‘ ‰½µˆˆ¤ì(€€€€€€€•±•µ•¹Ð¹ÍÑå±”¹Í•ÑAÉ½Á•ÉÑä ˆ´µ½µˆµÝ¥‘Ñ ˆ°…±Œ ‘í½µ‰]¥‘Ñ¡õÁà€¨Ù…È ´µÑ½Ñ…°µÍ…±”µ™…Ñ½È¤¥€¤ì(€€€€€€€½¹ÍÐ…±¥¹µ•¹Ð€ôÑ¡¥Ì¹‘…Ñ„¹Ñ•áÑ±¥¹µ•¹Ðì(€€€€€€€¥˜€¡…±¥¹µ•¹Ð€ôôô€Äñð…±¥¹µ•¹Ð€ôôô€È¤ì(€€€€€€€€€½¹ÍÐÍ•Ñ½µ‰=™™Í•Ð€ô€ ¤€ôøì(€€€€€€€€€€€½¹ÍÐ™É•”€ôµ…á1•¸€´•±•µ•¹Ð¹Ù…±Õ”¹±•¹Ñ ì(€€€€€€€€€€€•±•µ•¹Ð¹ÍÑå±”¹Í•ÑAÉ½Á•ÉÑä ˆ´µ½µˆµ½™™Í•Ðˆ°€‘í…±¥¹µ•¹Ð€ôôô€Ä€ü™É•”€øø€Ä€è™É••õ€¤ì(€€€€€€€€€ôì(€€€€€€€€€Í•Ñ½µ‰=™™Í•Ð ¤ì(€€€€€€€€€™½È€¡½¹ÍÐ•ÙÐ½˜l‰¥¹ÁÕÐˆ°€‰‰±ÕÈˆ°€‰É•Í•Ñ™½É´ˆ°€‰ÕÁ‘…Ñ•™É½µÍ…¹‘‰½à‰t¤ì(€€€€€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È¡•ÙÐ°Í•Ñ½µ‰=™™Í•Ð¤ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô(€€€ô•±Í”ì(€€€€€•±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€€€•±•µ•¹Ð¹Ñ•áÑ½¹Ñ•¹Ð€ôÑ¡¥Ì¹‘…Ñ„¹™¥•±‘Y…±Õ”ì(€€€€€•±•µ•¹Ð¹ÍÑå±”¹Ù•ÉÑ¥…±±¥¸€ô€‰µ¥‘‘±”ˆì(€€€€€•±•µ•¹Ð¹ÍÑå±”¹‘¥ÍÁ±…ä€ô€‰Ñ…‰±”µ•±°ˆì(€€€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹¡…Í=Ý¹…¹Ù…Ì¤ì(€€€€€€€•±•µ•¹Ð¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¹}Í•ÑQ•áÑMÑå±”¡•±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¹}Í•Ñ	…­É½Õ¹‘½±½È¡•±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¹}Í•Ñ•™…Õ±ÑAÉ½Á•ÉÑ¥•ÍÉ½µ)L¡•±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡•±•µ•¹Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌM¥¹…ÑÕÉ•]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”è€„…Á…É…µ•Ñ•ÉÌ¹‘…Ñ„¹¡…Í=Ý¹…¹Ù…Ì(€€€ô¤ì(€ô)ô)±…ÍÌ¡•­‰½á]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÁ…É…µ•Ñ•ÉÌ¹É•¹‘•É½ÉµÌ(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐÍÑ½É…”€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€€€½¹ÍÐ‘…Ñ„€ôÑ¡¥Ì¹‘…Ñ„ì(€€€½¹ÍÐ¥€ô‘…Ñ„¹¥ì(€€€±•ÐÙ…±Õ”€ôÍÑ½É…”¹•ÑY…±Õ”¡¥°ì(€€€€€Ù…±Õ”è‘…Ñ„¹•áÁ½ÉÑY…±Õ”€ôôô‘…Ñ„¹™¥•±‘Y…±Õ”(€€€ô¤¹Ù…±Õ”ì(€€€¥˜€¡ÑåÁ•½˜Ù…±Õ”€ôôô€‰ÍÑÉ¥¹œˆ¤ì(€€€€€Ù…±Õ”€ôÙ…±Õ”€„ôô€‰=™˜ˆì(€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€Ù…±Õ”(€€€€€ô¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰‰ÕÑÑ½¹]¥‘•Ñ¹¹½Ñ…Ñ¥½¸ˆ°€‰¡•­	½àˆ¤ì(€€€½¹ÍÐ•±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰¥¹ÁÕÐˆ¤ì(€€€•Ñ±•µ•¹ÑÍ	å9…µ•M•Ð¹…‘¡•±•µ•¹Ð¤ì(€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ•±•µ•¹Ðµ¥ˆ°¥¤ì(€€€•±•µ•¹Ð¹‘¥Í…‰±•€ô‘…Ñ„¹É•…‘=¹±äì(€€€Ñ¡¥Ì¹}Í•ÑI•ÅÕ¥É•¡•±•µ•¹Ð°Ñ¡¥Ì¹‘…Ñ„¹É•ÅÕ¥É•¤ì(€€€•±•µ•¹Ð¹ÑåÁ”€ô€‰¡•­‰½àˆì(€€€•±•µ•¹Ð¹¹…µ”€ô‘…Ñ„¹™¥•±‘9…µ”ì(€€€¥˜€¡Ù…±Õ”¤ì(€€€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡•­•ˆ°ÑÉÕ”¤ì(€€€ô(€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰•áÁ½ÉÑY…±Õ”ˆ°‘…Ñ„¹•áÁ½ÉÑY…±Õ”¤ì(€€€•±•µ•¹Ð¹Ñ…‰%¹‘•à€ô€Àì(€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¡…¹”ˆ°•Ù•¹Ð€ôøì(€€€€€½¹ÍÐì(€€€€€€€¹…µ”°(€€€€€€€¡•­•(€€€€€ô€ô•Ù•¹Ð¹Ñ…É•Ðì(€€€€€™½È€¡½¹ÍÐ¡•­‰½à½˜Ñ¡¥Ì¹}•Ñ±•µ•¹ÑÍ	å9…µ”¡¹…µ”°¥¤¤ì(€€€€€€€½¹ÍÐÕÉ¡•­•€ô¡•­•€˜˜¡•­‰½à¹•áÁ½ÉÑY…±Õ”€ôôô‘…Ñ„¹•áÁ½ÉÑY…±Õ”ì(€€€€€€€¥˜€¡¡•­‰½à¹‘½µ±•µ•¹Ð¤ì(€€€€€€€€€¡•­‰½à¹‘½µ±•µ•¹Ð¹¡•­•€ôÕÉ¡•­•ì(€€€€€€€ô(€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¡•­‰½à¹¥°ì(€€€€€€€€€Ù…±Õ”èÕÉ¡•­•(€€€€€€€ô¤ì(€€€€€ô(€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€Ù…±Õ”è¡•­•(€€€€€ô¤ì(€€€ô¤ì(€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰É•Í•Ñ™½É´ˆ°•Ù•¹Ð€ôøì(€€€€€½¹ÍÐ‘•™…Õ±ÑY…±Õ”€ô‘…Ñ„¹‘•™…Õ±Ñ¥•±‘Y…±Õ”ñð€‰=™˜ˆì(€€€€€•Ù•¹Ð¹Ñ…É•Ð¹¡•­•€ô‘•™…Õ±ÑY…±Õ”€ôôô‘…Ñ„¹•áÁ½ÉÑY…±Õ”ì(€€€ô¤ì(€€€¥˜€¡Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ€˜˜Ñ¡¥Ì¹¡…Í)MÑ¥½¹Ì¤ì(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰ÕÁ‘…Ñ•™É½µÍ…¹‘‰½àˆ°©ÍÙ•¹Ð€ôøì(€€€€€€€½¹ÍÐ…Ñ¥½¹Ì€ôì(€€€€€€€€€Ù…±Õ”¡•Ù•¹Ð¤ì(€€€€€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹¡•­•€ô•Ù•¹Ð¹‘•Ñ…¥°¹Ù…±Õ”€„ôô€‰=™˜ˆì(€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€Ù…±Õ”è•Ù•¹Ð¹Ñ…É•Ð¹¡•­•(€€€€€€€€€€€ô¤ì(€€€€€€€€€ô(€€€€€€€ôì(€€€€€€€Ñ¡¥Ì¹}‘¥ÍÁ…Ñ¡Ù•¹ÑÉ½µM…¹‘‰½à¡…Ñ¥½¹Ì°©ÍÙ•¹Ð¤ì(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¹}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•ÉÌ¡•±•µ•¹Ð°¹Õ±°°ml‰¡…¹”ˆ°€‰Y…±¥‘…Ñ”‰t°l‰¡…¹”ˆ°€‰Ñ¥½¸‰t°l‰™½ÕÌˆ°€‰½ÕÌ‰t°l‰‰±ÕÈˆ°€‰	±ÕÈ‰t°l‰µ½ÕÍ•‘½Ý¸ˆ°€‰5½ÕÍ”½Ý¸‰t°l‰µ½ÕÍ••¹Ñ•Èˆ°€‰5½ÕÍ”¹Ñ•È‰t°l‰µ½ÕÍ•±•…Ù”ˆ°€‰5½ÕÍ”á¥Ð‰t°l‰µ½ÕÍ•ÕÀˆ°€‰5½ÕÍ”UÀ‰ut°•Ù•¹Ð€ôø•Ù•¹Ð¹Ñ…É•Ð¹¡•­•¤ì(€€€ô(€€€Ñ¡¥Ì¹}Í•Ñ•™…Õ±ÑAÉ½Á•ÉÑ¥•ÍÉ½µ)L¡•±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡•±•µ•¹Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌI…‘¥½	ÕÑÑ½¹]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÁ…É…µ•Ñ•ÉÌ¹É•¹‘•É½ÉµÌ(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰‰ÕÑÑ½¹]¥‘•Ñ¹¹½Ñ…Ñ¥½¸ˆ°€‰É…‘¥½	ÕÑÑ½¸ˆ¤ì(€€€½¹ÍÐÍÑ½É…”€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€€€½¹ÍÐ‘…Ñ„€ôÑ¡¥Ì¹‘…Ñ„ì(€€€½¹ÍÐ¥€ô‘…Ñ„¹¥ì(€€€±•ÐÙ…±Õ”€ôÍÑ½É…”¹•ÑY…±Õ”¡¥°ì(€€€€€Ù…±Õ”è‘…Ñ„¹‰ÕÑÑ½¹Y…±Õ”€„ôô¹Õ±°€˜˜‘…Ñ„¹™¥•±‘Y…±Õ”€ôôô‘…Ñ„¹‰ÕÑÑ½¹Y…±Õ”(€€€ô¤¹Ù…±Õ”ì(€€€¥˜€¡ÑåÁ•½˜Ù…±Õ”€ôôô€‰ÍÑÉ¥¹œˆ¤ì(€€€€€Ù…±Õ”€ôÙ…±Õ”€„ôô‘…Ñ„¹‰ÕÑÑ½¹Y…±Õ”ì(€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€Ù…±Õ”(€€€€€ô¤ì(€€€ô(€€€¥˜€¡Ù…±Õ”¤ì(€€€€€™½È€¡½¹ÍÐÉ…‘¥¼½˜Ñ¡¥Ì¹}•Ñ±•µ•¹ÑÍ	å9…µ”¡‘…Ñ„¹™¥•±‘9…µ”°¥¤¤ì(€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡É…‘¥¼¹¥°ì(€€€€€€€€€Ù…±Õ”è™…±Í”(€€€€€€€ô¤ì(€€€€€ô(€€€ô(€€€½¹ÍÐ•±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰¥¹ÁÕÐˆ¤ì(€€€•Ñ±•µ•¹ÑÍ	å9…µ•M•Ð¹…‘¡•±•µ•¹Ð¤ì(€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ•±•µ•¹Ðµ¥ˆ°¥¤ì(€€€•±•µ•¹Ð¹‘¥Í…‰±•€ô‘…Ñ„¹É•…‘=¹±äì(€€€Ñ¡¥Ì¹}Í•ÑI•ÅÕ¥É•¡•±•µ•¹Ð°Ñ¡¥Ì¹‘…Ñ„¹É•ÅÕ¥É•¤ì(€€€•±•µ•¹Ð¹ÑåÁ”€ô€‰É…‘¥¼ˆì(€€€•±•µ•¹Ð¹¹…µ”€ô‘…Ñ„¹™¥•±‘9…µ”ì(€€€¥˜€¡Ù…±Õ”¤ì(€€€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡•­•ˆ°ÑÉÕ”¤ì(€€€ô(€€€•±•µ•¹Ð¹Ñ…‰%¹‘•à€ô€Àì(€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¡…¹”ˆ°•Ù•¹Ð€ôøì(€€€€€½¹ÍÐì(€€€€€€€¹…µ”°(€€€€€€€¡•­•(€€€€€ô€ô•Ù•¹Ð¹Ñ…É•Ðì(€€€€€™½È€¡½¹ÍÐÉ…‘¥¼½˜Ñ¡¥Ì¹}•Ñ±•µ•¹ÑÍ	å9…µ”¡¹…µ”°¥¤¤ì(€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡É…‘¥¼¹¥°ì(€€€€€€€€€Ù…±Õ”è™…±Í”(€€€€€€€ô¤ì(€€€€€ô(€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€Ù…±Õ”è¡•­•(€€€€€ô¤ì(€€€ô¤ì(€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰É•Í•Ñ™½É´ˆ°•Ù•¹Ð€ôøì(€€€€€½¹ÍÐ‘•™…Õ±ÑY…±Õ”€ô‘…Ñ„¹‘•™…Õ±Ñ¥•±‘Y…±Õ”ì(€€€€€•Ù•¹Ð¹Ñ…É•Ð¹¡•­•€ô‘•™…Õ±ÑY…±Õ”€„ôô¹Õ±°€˜˜‘•™…Õ±ÑY…±Õ”€„ôôÕ¹‘•™¥¹•€˜˜‘•™…Õ±ÑY…±Õ”€ôôô‘…Ñ„¹‰ÕÑÑ½¹Y…±Õ”ì(€€€ô¤ì(€€€¥˜€¡Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ€˜˜Ñ¡¥Ì¹¡…Í)MÑ¥½¹Ì¤ì(€€€€€½¹ÍÐÁ‘™	ÕÑÑ½¹Y…±Õ”€ô‘…Ñ„¹‰ÕÑÑ½¹Y…±Õ”ì(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰ÕÁ‘…Ñ•™É½µÍ…¹‘‰½àˆ°©ÍÙ•¹Ð€ôøì(€€€€€€€½¹ÍÐ…Ñ¥½¹Ì€ôì(€€€€€€€€€Ù…±Õ”è•Ù•¹Ð€ôøì(€€€€€€€€€€€½¹ÍÐ¡•­•€ôÁ‘™	ÕÑÑ½¹Y…±Õ”€ôôô•Ù•¹Ð¹‘•Ñ…¥°¹Ù…±Õ”ì(€€€€€€€€€€€™½È€¡½¹ÍÐÉ…‘¥¼½˜Ñ¡¥Ì¹}•Ñ±•µ•¹ÑÍ	å9…µ”¡•Ù•¹Ð¹Ñ…É•Ð¹¹…µ”¤¤ì(€€€€€€€€€€€€€½¹ÍÐÕÉ¡•­•€ô¡•­•€˜˜É…‘¥¼¹¥€ôôô¥ì(€€€€€€€€€€€€€¥˜€¡É…‘¥¼¹‘½µ±•µ•¹Ð¤ì(€€€€€€€€€€€€€€€É…‘¥¼¹‘½µ±•µ•¹Ð¹¡•­•€ôÕÉ¡•­•ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡É…‘¥¼¹¥°ì(€€€€€€€€€€€€€€€Ù…±Õ”èÕÉ¡•­•(€€€€€€€€€€€€€ô¤ì(€€€€€€€€€€€ô(€€€€€€€€€ô(€€€€€€€ôì(€€€€€€€Ñ¡¥Ì¹}‘¥ÍÁ…Ñ¡Ù•¹ÑÉ½µM…¹‘‰½à¡…Ñ¥½¹Ì°©ÍÙ•¹Ð¤ì(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¹}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•ÉÌ¡•±•µ•¹Ð°¹Õ±°°ml‰¡…¹”ˆ°€‰Y…±¥‘…Ñ”‰t°l‰¡…¹”ˆ°€‰Ñ¥½¸‰t°l‰™½ÕÌˆ°€‰½ÕÌ‰t°l‰‰±ÕÈˆ°€‰	±ÕÈ‰t°l‰µ½ÕÍ•‘½Ý¸ˆ°€‰5½ÕÍ”½Ý¸‰t°l‰µ½ÕÍ••¹Ñ•Èˆ°€‰5½ÕÍ”¹Ñ•È‰t°l‰µ½ÕÍ•±•…Ù”ˆ°€‰5½ÕÍ”á¥Ð‰t°l‰µ½ÕÍ•ÕÀˆ°€‰5½ÕÍ”UÀ‰ut°•Ù•¹Ð€ôø•Ù•¹Ð¹Ñ…É•Ð¹¡•­•¤ì(€€€ô(€€€Ñ¡¥Ì¹}Í•Ñ•™…Õ±ÑAÉ½Á•ÉÑ¥•ÍÉ½µ)L¡•±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡•±•µ•¹Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌAÕÍ¡	ÕÑÑ½¹]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì1¥¹­¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥¹½É•	½É‘•ÈèÁ…É…µ•Ñ•ÉÌ¹‘…Ñ„¹¡…ÍÁÁ•…É…¹”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐ½¹Ñ…¥¹•È€ôÍÕÁ•È¹É•¹‘•È ¤ì(€€€½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰‰ÕÑÑ½¹]¥‘•Ñ¹¹½Ñ…Ñ¥½¸ˆ°€‰ÁÕÍ¡	ÕÑÑ½¸ˆ¤ì(€€€½¹ÍÐ±¥¹­±•µ•¹Ð€ô½¹Ñ…¥¹•È¹±…ÍÑ¡¥±ì(€€€¥˜€¡Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ€˜˜Ñ¡¥Ì¹¡…Í)MÑ¥½¹Ì€˜˜±¥¹­±•µ•¹Ð¤ì(€€€€€Ñ¡¥Ì¹}Í•Ñ•™…Õ±ÑAÉ½Á•ÉÑ¥•ÍÉ½µ)L¡±¥¹­±•µ•¹Ð¤ì(€€€€€±¥¹­±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰ÕÁ‘…Ñ•™É½µÍ…¹‘‰½àˆ°©ÍÙ•¹Ð€ôøì(€€€€€€€Ñ¡¥Ì¹}‘¥ÍÁ…Ñ¡Ù•¹ÑÉ½µM…¹‘‰½à¡íô°©ÍÙ•¹Ð¤ì(€€€€€ô¤ì(€€€ô(€€€É•ÑÕÉ¸½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌ¡½¥•]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì]¥‘•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÁ…É…µ•Ñ•ÉÌ¹É•¹‘•É½ÉµÌ(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡½¥•]¥‘•Ñ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€½¹ÍÐÍÑ½É…”€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹MÑ½É…”ì(€€€½¹ÍÐ¥€ôÑ¡¥Ì¹‘…Ñ„¹¥ì(€€€½¹ÍÐÍÑ½É•‘…Ñ„€ôÍÑ½É…”¹•ÑY…±Õ”¡¥°ì(€€€€€Ù…±Õ”èÑ¡¥Ì¹‘…Ñ„¹™¥•±‘Y…±Õ”(€€€ô¤ì(€€€½¹ÍÐÍ•±•Ñ±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰Í•±•Ðˆ¤ì(€€€•Ñ±•µ•¹ÑÍ	å9…µ•M•Ð¹…‘¡Í•±•Ñ±•µ•¹Ð¤ì(€€€Í•±•Ñ±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ•±•µ•¹Ðµ¥ˆ°¥¤ì(€€€Í•±•Ñ±•µ•¹Ð¹‘¥Í…‰±•€ôÑ¡¥Ì¹‘…Ñ„¹É•…‘=¹±äì(€€€Ñ¡¥Ì¹}Í•ÑI•ÅÕ¥É•¡Í•±•Ñ±•µ•¹Ð°Ñ¡¥Ì¹‘…Ñ„¹É•ÅÕ¥É•¤ì(€€€Í•±•Ñ±•µ•¹Ð¹¹…µ”€ôÑ¡¥Ì¹‘…Ñ„¹™¥•±‘9…µ”ì(€€€Í•±•Ñ±•µ•¹Ð¹Ñ…‰%¹‘•à€ô€Àì(€€€±•Ð…‘‘¹µÁÑå¹ÑÉä€ôÑ¡¥Ì¹‘…Ñ„¹½µ‰¼€˜˜Ñ¡¥Ì¹‘…Ñ„¹½ÁÑ¥½¹Ì¹±•¹Ñ €ø€Àì(€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹½µ‰¼¤ì(€€€€€Í•±•Ñ±•µ•¹Ð¹Í¥é”€ôÑ¡¥Ì¹‘…Ñ„¹½ÁÑ¥½¹Ì¹±•¹Ñ ì(€€€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹µÕ±Ñ¥M•±•Ð¤ì(€€€€€€€Í•±•Ñ±•µ•¹Ð¹µÕ±Ñ¥Á±”€ôÑÉÕ”ì(€€€€€ô(€€€ô(€€€Í•±•Ñ±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰É•Í•Ñ™½É´ˆ°•Ù•¹Ð€ôøì(€€€€€½¹ÍÐ‘•™…Õ±ÑY…±Õ”€ôÑ¡¥Ì¹‘…Ñ„¹‘•™…Õ±Ñ¥•±‘Y…±Õ”ì(€€€€€™½È€¡½¹ÍÐ½ÁÑ¥½¸½˜Í•±•Ñ±•µ•¹Ð¹½ÁÑ¥½¹Ì¤ì(€€€€€€€½ÁÑ¥½¸¹Í•±•Ñ•€ô½ÁÑ¥½¸¹Ù…±Õ”€ôôô‘•™…Õ±ÑY…±Õ”ì(€€€€€ô(€€€ô¤ì(€€€½¹ÍÐ™¥á¥ÍÁ±…åY…±Õ”€ô€¡½ÁÑ¥½¸°Ù…±Õ”¤€ôøì(€€€€€½¹ÍÐ¹•ÝY…±Õ”€ôÙ…±Õ”¹É•Á±…•±° ˆ€ˆ°€‰qÔÀÁÀˆ¤ì(€€€€€½ÁÑ¥½¸¹Ñ•áÑ½¹Ñ•¹Ð€ô¹•ÝY…±Õ”ì(€€€€€¥˜€¡¹•ÝY…±Õ”€„ôôÙ…±Õ”¤ì(€€€€€€€½ÁÑ¥½¸¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘¥ÍÁ±…äµÙ…±Õ”ˆ°Ù…±Õ”¤ì(€€€€€ô(€€€ôì(€€€™½È€¡½¹ÍÐ½ÁÑ¥½¸½˜Ñ¡¥Ì¹‘…Ñ„¹½ÁÑ¥½¹Ì¤ì(€€€€€½¹ÍÐ½ÁÑ¥½¹±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰½ÁÑ¥½¸ˆ¤ì(€€€€€™¥á¥ÍÁ±…åY…±Õ”¡½ÁÑ¥½¹±•µ•¹Ð°½ÁÑ¥½¸¹‘¥ÍÁ±…åY…±Õ”¤ì(€€€€€½ÁÑ¥½¹±•µ•¹Ð¹Ù…±Õ”€ô½ÁÑ¥½¸¹•áÁ½ÉÑY…±Õ”ì(€€€€€¥˜€¡ÍÑ½É•‘…Ñ„¹Ù…±Õ”¹¥¹±Õ‘•Ì¡½ÁÑ¥½¸¹•áÁ½ÉÑY…±Õ”¤¤ì(€€€€€€€½ÁÑ¥½¹±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Í•±•Ñ•ˆ°ÑÉÕ”¤ì(€€€€€€€…‘‘¹µÁÑå¹ÑÉä€ô™…±Í”ì(€€€€€ô(€€€€€Í•±•Ñ±•µ•¹Ð¹…ÁÁ•¹¡½ÁÑ¥½¹±•µ•¹Ð¤ì(€€€ô(€€€±•ÐÉ•µ½Ù•µÁÑå¹ÑÉä€ô¹Õ±°ì(€€€¥˜€¡…‘‘¹µÁÑå¹ÑÉä¤ì(€€€€€½¹ÍÐ¹½¹•=ÁÑ¥½¹±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰½ÁÑ¥½¸ˆ¤ì(€€€€€¹½¹•=ÁÑ¥½¹±•µ•¹Ð¹Ù…±Õ”€ô€ˆ€ˆì(€€€€€¹½¹•=ÁÑ¥½¹±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡¥‘‘•¸ˆ°ÑÉÕ”¤ì(€€€€€¹½¹•=ÁÑ¥½¹±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Í•±•Ñ•ˆ°ÑÉÕ”¤ì(€€€€€Í•±•Ñ±•µ•¹Ð¹ÁÉ•Á•¹¡¹½¹•=ÁÑ¥½¹±•µ•¹Ð¤ì(€€€€€É•µ½Ù•µÁÑå¹ÑÉä€ô€ ¤€ôøì(€€€€€€€¹½¹•=ÁÑ¥½¹±•µ•¹Ð¹É•µ½Ù” ¤ì(€€€€€€€Í•±•Ñ±•µ•¹Ð¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰¥¹ÁÕÐˆ°É•µ½Ù•µÁÑå¹ÑÉä¤ì(€€€€€€€É•µ½Ù•µÁÑå¹ÑÉä€ô¹Õ±°ì(€€€€€ôì(€€€€€Í•±•Ñ±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¥¹ÁÕÐˆ°É•µ½Ù•µÁÑå¹ÑÉä¤ì(€€€ô(€€€½¹ÍÐ•ÑY…±Õ”€ô¥ÍáÁ½ÉÐ€ôøì(€€€€€½¹ÍÐ¹…µ”€ô¥ÍáÁ½ÉÐ€ü€‰Ù…±Õ”ˆ€è€‰Ñ•áÑ½¹Ñ•¹Ðˆì(€€€€€½¹ÍÐì(€€€€€€€½ÁÑ¥½¹Ì°(€€€€€€€µÕ±Ñ¥Á±”(€€€€€ô€ôÍ•±•Ñ±•µ•¹Ðì(€€€€€¥˜€ …µÕ±Ñ¥Á±”¤ì(€€€€€€€É•ÑÕÉ¸½ÁÑ¥½¹Ì¹Í•±•Ñ•‘%¹‘•à€ôôô€´Ä€ü¹Õ±°€è½ÁÑ¥½¹Ím½ÁÑ¥½¹Ì¹Í•±•Ñ•‘%¹‘•áum¹…µ•tì(€€€€€ô(€€€€€É•ÑÕÉ¸ÉÉ…ä¹ÁÉ½Ñ½ÑåÁ”¹™¥±Ñ•È¹…±°¡½ÁÑ¥½¹Ì°½ÁÑ¥½¸€ôø½ÁÑ¥½¸¹Í•±•Ñ•¤¹µ…À¡½ÁÑ¥½¸€ôø½ÁÑ¥½¹m¹…µ•t¤ì(€€€ôì(€€€±•ÐÍ•±•Ñ•‘Y…±Õ•Ì€ô•ÑY…±Õ”¡™…±Í”¤ì(€€€½¹ÍÐ•Ñ%Ñ•µÌ€ô•Ù•¹Ð€ôøì(€€€€€½¹ÍÐ½ÁÑ¥½¹Ì€ô•Ù•¹Ð¹Ñ…É•Ð¹½ÁÑ¥½¹Ìì(€€€€€É•ÑÕÉ¸ÉÉ…ä¹ÁÉ½Ñ½ÑåÁ”¹µ…À¹…±°¡½ÁÑ¥½¹Ì°½ÁÑ¥½¸€ôø€¡ì(€€€€€€€‘¥ÍÁ±…åY…±Õ”è½ÁÑ¥½¸¹•ÑÑÑÉ¥‰ÕÑ” ‰‘¥ÍÁ±…äµÙ…±Õ”ˆ¤ñð½ÁÑ¥½¸¹Ñ•áÑ½¹Ñ•¹Ð°(€€€€€€€•áÁ½ÉÑY…±Õ”è½ÁÑ¥½¸¹Ù…±Õ”(€€€€€ô¤¤ì(€€€ôì(€€€¥˜€¡Ñ¡¥Ì¹•¹…‰±•MÉ¥ÁÑ¥¹œ€˜˜Ñ¡¥Ì¹¡…Í)MÑ¥½¹Ì¤ì(€€€€€Í•±•Ñ±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰ÕÁ‘…Ñ•™É½µÍ…¹‘‰½àˆ°©ÍÙ•¹Ð€ôøì(€€€€€€€½¹ÍÐ…Ñ¥½¹Ì€ôì(€€€€€€€€€Ù…±Õ”¡•Ù•¹Ð¤ì(€€€€€€€€€€€É•µ½Ù•µÁÑå¹ÑÉäü¸ ¤ì(€€€€€€€€€€€½¹ÍÐÙ…±Õ”€ô•Ù•¹Ð¹‘•Ñ…¥°¹Ù…±Õ”ì(€€€€€€€€€€€½¹ÍÐÙ…±Õ•Ì€ô¹•ÜM•Ð¡ÉÉ…ä¹¥ÍÉÉ…ä¡Ù…±Õ”¤€üÙ…±Õ”€èmÙ…±Õ•t¤ì(€€€€€€€€€€€™½È€¡½¹ÍÐ½ÁÑ¥½¸½˜Í•±•Ñ±•µ•¹Ð¹½ÁÑ¥½¹Ì¤ì(€€€€€€€€€€€€€½ÁÑ¥½¸¹Í•±•Ñ•€ôÙ…±Õ•Ì¹¡…Ì¡½ÁÑ¥½¸¹Ù…±Õ”¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€Ù…±Õ”è•ÑY…±Õ”¡ÑÉÕ”¤(€€€€€€€€€€€ô¤ì(€€€€€€€€€€€Í•±•Ñ•‘Y…±Õ•Ì€ô•ÑY…±Õ”¡™…±Í”¤ì(€€€€€€€€€ô°(€€€€€€€€€µÕ±Ñ¥Á±•M•±•Ñ¥½¸¡•Ù•¹Ð¤ì(€€€€€€€€€€€Í•±•Ñ±•µ•¹Ð¹µÕ±Ñ¥Á±”€ôÑÉÕ”ì(€€€€€€€€€ô°(€€€€€€€€€É•µ½Ù”¡•Ù•¹Ð¤ì(€€€€€€€€€€€½¹ÍÐ½ÁÑ¥½¹Ì€ôÍ•±•Ñ±•µ•¹Ð¹½ÁÑ¥½¹Ìì(€€€€€€€€€€€½¹ÍÐ¥¹‘•à€ô•Ù•¹Ð¹‘•Ñ…¥°¹É•µ½Ù”ì(€€€€€€€€€€€½ÁÑ¥½¹Ím¥¹‘•át¹Í•±•Ñ•€ô™…±Í”ì(€€€€€€€€€€€Í•±•Ñ±•µ•¹Ð¹É•µ½Ù”¡¥¹‘•à¤ì(€€€€€€€€€€€¥˜€¡½ÁÑ¥½¹Ì¹±•¹Ñ €ø€À¤ì(€€€€€€€€€€€€€½¹ÍÐ¤€ôÉÉ…ä¹ÁÉ½Ñ½ÑåÁ”¹™¥¹‘%¹‘•à¹…±°¡½ÁÑ¥½¹Ì°½ÁÑ¥½¸€ôø½ÁÑ¥½¸¹Í•±•Ñ•¤ì(€€€€€€€€€€€€€¥˜€¡¤€ôôô€´Ä¤ì(€€€€€€€€€€€€€€€½ÁÑ¥½¹ÍlÁt¹Í•±•Ñ•€ôÑÉÕ”ì(€€€€€€€€€€€€€ô(€€€€€€€€€€€ô(€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€Ù…±Õ”è•ÑY…±Õ”¡ÑÉÕ”¤°(€€€€€€€€€€€€€¥Ñ•µÌè•Ñ%Ñ•µÌ¡•Ù•¹Ð¤(€€€€€€€€€€€ô¤ì(€€€€€€€€€€€Í•±•Ñ•‘Y…±Õ•Ì€ô•ÑY…±Õ”¡™…±Í”¤ì(€€€€€€€€€ô°(€€€€€€€€€±•…È¡•Ù•¹Ð¤ì(€€€€€€€€€€€Ý¡¥±”€¡Í•±•Ñ±•µ•¹Ð¹±•¹Ñ €„ôô€À¤ì(€€€€€€€€€€€€€Í•±•Ñ±•µ•¹Ð¹É•µ½Ù” À¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€Ù…±Õ”è¹Õ±°°(€€€€€€€€€€€€€¥Ñ•µÌèmt(€€€€€€€€€€€ô¤ì(€€€€€€€€€€€Í•±•Ñ•‘Y…±Õ•Ì€ô•ÑY…±Õ”¡™…±Í”¤ì(€€€€€€€€€ô°(€€€€€€€€€¥¹Í•ÉÐ¡•Ù•¹Ð¤ì(€€€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€€€¥¹‘•à°(€€€€€€€€€€€€€‘¥ÍÁ±…åY…±Õ”°(€€€€€€€€€€€€€•áÁ½ÉÑY…±Õ”(€€€€€€€€€€€ô€ô•Ù•¹Ð¹‘•Ñ…¥°¹¥¹Í•ÉÐì(€€€€€€€€€€€½¹ÍÐÍ•±•Ñ¡¥±€ôÍ•±•Ñ±•µ•¹Ð¹¡¥±‘É•¹m¥¹‘•átì(€€€€€€€€€€€½¹ÍÐ½ÁÑ¥½¹±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰½ÁÑ¥½¸ˆ¤ì(€€€€€€€€€€€™¥á¥ÍÁ±…åY…±Õ”¡½ÁÑ¥½¹±•µ•¹Ð°‘¥ÍÁ±…åY…±Õ”¤ì(€€€€€€€€€€€½ÁÑ¥½¹±•µ•¹Ð¹Ù…±Õ”€ô•áÁ½ÉÑY…±Õ”ì(€€€€€€€€€€€¥˜€¡Í•±•Ñ¡¥±¤ì(€€€€€€€€€€€€€Í•±•Ñ¡¥±¹‰•™½É”¡½ÁÑ¥½¹±•µ•¹Ð¤ì(€€€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€€€Í•±•Ñ±•µ•¹Ð¹…ÁÁ•¹¡½ÁÑ¥½¹±•µ•¹Ð¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€Ù…±Õ”è•ÑY…±Õ”¡ÑÉÕ”¤°(€€€€€€€€€€€€€¥Ñ•µÌè•Ñ%Ñ•µÌ¡•Ù•¹Ð¤(€€€€€€€€€€€ô¤ì(€€€€€€€€€€€Í•±•Ñ•‘Y…±Õ•Ì€ô•ÑY…±Õ”¡™…±Í”¤ì(€€€€€€€€€ô°(€€€€€€€€€¥Ñ•µÌ¡•Ù•¹Ð¤ì(€€€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€€€¥Ñ•µÌ(€€€€€€€€€€€ô€ô•Ù•¹Ð¹‘•Ñ…¥°ì(€€€€€€€€€€€Ý¡¥±”€¡Í•±•Ñ±•µ•¹Ð¹±•¹Ñ €„ôô€À¤ì(€€€€€€€€€€€€€Í•±•Ñ±•µ•¹Ð¹É•µ½Ù” À¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€™½È€¡½¹ÍÐ¥Ñ•´½˜¥Ñ•µÌ¤ì(€€€€€€€€€€€€€½¹ÍÐì(€€€€€€€€€€€€€€€‘¥ÍÁ±…åY…±Õ”°(€€€€€€€€€€€€€€€•áÁ½ÉÑY…±Õ”(€€€€€€€€€€€€€ô€ô¥Ñ•´ì(€€€€€€€€€€€€€½¹ÍÐ½ÁÑ¥½¹±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰½ÁÑ¥½¸ˆ¤ì(€€€€€€€€€€€€€™¥á¥ÍÁ±…åY…±Õ”¡½ÁÑ¥½¹±•µ•¹Ð°‘¥ÍÁ±…åY…±Õ”¤ì(€€€€€€€€€€€€€½ÁÑ¥½¹±•µ•¹Ð¹Ù…±Õ”€ô•áÁ½ÉÑY…±Õ”ì(€€€€€€€€€€€€€Í•±•Ñ±•µ•¹Ð¹…ÁÁ•¹¡½ÁÑ¥½¹±•µ•¹Ð¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€¥˜€¡Í•±•Ñ±•µ•¹Ð¹½ÁÑ¥½¹Ì¹±•¹Ñ €ø€À¤ì(€€€€€€€€€€€€€Í•±•Ñ±•µ•¹Ð¹½ÁÑ¥½¹ÍlÁt¹Í•±•Ñ•€ôÑÉÕ”ì(€€€€€€€€€€€ô(€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€Ù…±Õ”è•ÑY…±Õ”¡ÑÉÕ”¤°(€€€€€€€€€€€€€¥Ñ•µÌè•Ñ%Ñ•µÌ¡•Ù•¹Ð¤(€€€€€€€€€€€ô¤ì(€€€€€€€€€€€Í•±•Ñ•‘Y…±Õ•Ì€ô•ÑY…±Õ”¡™…±Í”¤ì(€€€€€€€€€ô°(€€€€€€€€€¥¹‘¥•Ì¡•Ù•¹Ð¤ì(€€€€€€€€€€€½¹ÍÐ¥¹‘¥•Ì€ô¹•ÜM•Ð¡•Ù•¹Ð¹‘•Ñ…¥°¹¥¹‘¥•Ì¤ì(€€€€€€€€€€€™½È€¡½¹ÍÐ½ÁÑ¥½¸½˜•Ù•¹Ð¹Ñ…É•Ð¹½ÁÑ¥½¹Ì¤ì(€€€€€€€€€€€€€½ÁÑ¥½¸¹Í•±•Ñ•€ô¥¹‘¥•Ì¹¡…Ì¡½ÁÑ¥½¸¹¥¹‘•à¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€€€€€Ù…±Õ”è•ÑY…±Õ”¡ÑÉÕ”¤(€€€€€€€€€€€ô¤ì(€€€€€€€€€€€Í•±•Ñ•‘Y…±Õ•Ì€ô•ÑY…±Õ”¡™…±Í”¤ì(€€€€€€€€€ô°(€€€€€€€€€•‘¥Ñ…‰±”¡•Ù•¹Ð¤ì(€€€€€€€€€€€•Ù•¹Ð¹Ñ…É•Ð¹‘¥Í…‰±•€ô€…•Ù•¹Ð¹‘•Ñ…¥°¹•‘¥Ñ…‰±”ì(€€€€€€€€€ô(€€€€€€€ôì(€€€€€€€Ñ¡¥Ì¹}‘¥ÍÁ…Ñ¡Ù•¹ÑÉ½µM…¹‘‰½à¡…Ñ¥½¹Ì°©ÍÙ•¹Ð¤ì(€€€€€ô¤ì(€€€€€Í•±•Ñ±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¥¹ÁÕÐˆ°•Ù•¹Ð€ôøì(€€€€€€€½¹ÍÐ•áÁ½ÉÑY…±Õ”€ô•ÑY…±Õ”¡ÑÉÕ”¤ì(€€€€€€€½¹ÍÐ¡…¹”€ô•ÑY…±Õ”¡™…±Í”¤ì(€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€Ù…±Õ”è•áÁ½ÉÑY…±Õ”(€€€€€€€ô¤ì(€€€€€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€€€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰‘¥ÍÁ…Ñ¡•Ù•¹Ñ¥¹Í…¹‘‰½àˆ°ì(€€€€€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€€€€€‘•Ñ…¥°èì(€€€€€€€€€€€¥°(€€€€€€€€€€€¹…µ”è€‰-•åÍÑÉ½­”ˆ°(€€€€€€€€€€€Ù…±Õ”èÍ•±•Ñ•‘Y…±Õ•Ì°(€€€€€€€€€€€¡…¹”°(€€€€€€€€€€€¡…¹•àè•áÁ½ÉÑY…±Õ”°(€€€€€€€€€€€Ý¥±±½µµ¥Ðè™…±Í”°(€€€€€€€€€€€½µµ¥Ñ-•äè€Ä°(€€€€€€€€€€€­•å½Ý¸è™…±Í”(€€€€€€€€€ô(€€€€€€€ô¤ì(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¹}Í•ÑÙ•¹Ñ1¥ÍÑ•¹•ÉÌ¡Í•±•Ñ±•µ•¹Ð°¹Õ±°°ml‰™½ÕÌˆ°€‰½ÕÌ‰t°l‰‰±ÕÈˆ°€‰	±ÕÈ‰t°l‰µ½ÕÍ•‘½Ý¸ˆ°€‰5½ÕÍ”½Ý¸‰t°l‰µ½ÕÍ••¹Ñ•Èˆ°€‰5½ÕÍ”¹Ñ•È‰t°l‰µ½ÕÍ•±•…Ù”ˆ°€‰5½ÕÍ”á¥Ð‰t°l‰µ½ÕÍ•ÕÀˆ°€‰5½ÕÍ”UÀ‰t°l‰¥¹ÁÕÐˆ°€‰Ñ¥½¸‰t°l‰¥¹ÁÕÐˆ°€‰Y…±¥‘…Ñ”‰ut°•Ù•¹Ð€ôø•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”¤ì(€€€ô•±Í”ì(€€€€€Í•±•Ñ±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¥¹ÁÕÐˆ°™Õ¹Ñ¥½¸€¡•Ù•¹Ð¤ì(€€€€€€€ÍÑ½É…”¹Í•ÑY…±Õ”¡¥°ì(€€€€€€€€€Ù…±Õ”è•ÑY…±Õ”¡ÑÉÕ”¤(€€€€€€€ô¤ì(€€€€€ô¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹‘…Ñ„¹½µ‰¼¤ì(€€€€€Ñ¡¥Ì¹}Í•ÑQ•áÑMÑå±”¡Í•±•Ñ±•µ•¹Ð¤ì(€€€ô•±Í”íô(€€€Ñ¡¥Ì¹}Í•Ñ	…­É½Õ¹‘½±½È¡Í•±•Ñ±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¹}Í•Ñ•™…Õ±ÑAÉ½Á•ÉÑ¥•ÍÉ½µ)L¡Í•±•Ñ±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡Í•±•Ñ±•µ•¹Ð¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌA½ÁÕÁ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„°(€€€€€•±•µ•¹ÑÌ°(€€€€€Á…É•¹Ð(€€€ô€ôÁ…É…µ•Ñ•ÉÌì(€€€½¹ÍÐ¡…Í½µµ•¹Ñ5…¹…•È€ô€„…Á…É•¹Ð¹}½µµ•¹Ñ5…¹…•Èì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”è€…¡…Í½µµ•¹Ñ5…¹…•È€˜˜¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¹}¡…ÍA½ÁÕÁ…Ñ„¡‘…Ñ„¤(€€€ô¤ì(€€€Ñ¡¥Ì¹•±•µ•¹ÑÌ€ô•±•µ•¹ÑÌì(€€€¥˜€¡¡…Í½µµ•¹Ñ5…¹…•È€˜˜¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¹}¡…ÍA½ÁÕÁ…Ñ„¡‘…Ñ„¤¤ì(€€€€€½¹ÍÐÁ½ÁÕÀ€ôÑ¡¥Ì¹Á½ÁÕÀ€ôÑ¡¥Ì¸É•…Ñ•A½ÁÕÀ ¤ì(€€€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜•±•µ•¹ÑÌ¤ì(€€€€€€€•±•µ•¹Ð¹Á½ÁÕÀ€ôÁ½ÁÕÀì(€€€€€ô(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹Á½ÁÕÀ€ô¹Õ±°ì(€€€ô(€ô(€€É•…Ñ•A½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸¹•ÜA½ÁÕÁ±•µ•¹Ð¡ì(€€€€€½¹Ñ…¥¹•ÈèÑ¡¥Ì¹½¹Ñ…¥¹•È°(€€€€€½±½ÈèÑ¡¥Ì¹‘…Ñ„¹½±½È°(€€€€€Ñ¥Ñ±•=‰¨èÑ¡¥Ì¹‘…Ñ„¹Ñ¥Ñ±•=‰¨°(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”èÑ¡¥Ì¹‘…Ñ„¹µ½‘¥™¥…Ñ¥½¹…Ñ”ñðÑ¡¥Ì¹‘…Ñ„¹É•…Ñ¥½¹…Ñ”°(€€€€€½¹Ñ•¹ÑÍ=‰¨èÑ¡¥Ì¹‘…Ñ„¹½¹Ñ•¹ÑÍ=‰¨°(€€€€€É¥¡Q•áÐèÑ¡¥Ì¹‘…Ñ„¹É¥¡Q•áÐ°(€€€€€É•ÐèÑ¡¥Ì¹‘…Ñ„¹É•Ð°(€€€€€Á…É•¹ÑI•ÐèÑ¡¥Ì¹‘…Ñ„¹Á…É•¹ÑI•Ðñð¹Õ±°°(€€€€€Á…É•¹ÐèÑ¡¥Ì¹Á…É•¹Ð°(€€€€€•±•µ•¹ÑÌèÑ¡¥Ì¹•±•µ•¹ÑÌ°(€€€€€½Á•¸èÑ¡¥Ì¹‘…Ñ„¹½Á•¸°(€€€€€½µµ•¹Ñ5…¹…•ÈèÑ¡¥Ì¹Á…É•¹Ð¹}½µµ•¹Ñ5…¹…•È(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐì(€€€€€½¹Ñ…¥¹•È(€€€ô€ôÑ¡¥Ìì(€€€½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰Á½ÁÕÁ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€½¹Ñ…¥¹•È¹É½±”€ô€‰½µµ•¹Ðˆì(€€€½¹ÍÐÁ½ÁÕÀ€ôÑ¡¥Ì¹Á½ÁÕÀ€ôÑ¡¥Ì¸É•…Ñ•A½ÁÕÀ ¤ì(€€€½¹ÍÐ•±•µ•¹Ñ%‘Ì€ômtì(€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¹•±•µ•¹ÑÌ¤ì(€€€€€•±•µ•¹Ð¹Á½ÁÕÀ€ôÁ½ÁÕÀì(€€€€€•±•µ•¹Ð¹½¹Ñ…¥¹•È¹…É¥…!…ÍA½ÁÕÀ€ô€‰‘¥…±½œˆì(€€€€€•±•µ•¹Ñ%‘Ì¹ÁÕÍ ¡•±•µ•¹Ð¹‘…Ñ„¹¥¤ì(€€€€€•±•µ•¹Ð¹…‘‘!¥¡±¥¡ÑÉ•„ ¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µ½¹ÑÉ½±Ìˆ°•±•µ•¹Ñ%‘Ì¹µ…À¡¥€ôø€‘í¹¹½Ñ…Ñ¥½¹AÉ•™¥áô‘í¥‘õ€¤¹©½¥¸ ˆ°ˆ¤¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌA½ÁÕÁ±•µ•¹Ðì(€€½µµ•¹Ñ5…¹…•È€ô¹Õ±°ì(€€‰½Õ¹‘-•å½Ý¸€ôÑ¡¥Ì¸­•å½Ý¸¹‰¥¹¡Ñ¡¥Ì¤ì(€€‰½Õ¹‘!¥‘”€ôÑ¡¥Ì¸¡¥‘”¹‰¥¹¡Ñ¡¥Ì¤ì(€€‰½Õ¹‘M¡½Ü€ôÑ¡¥Ì¸Í¡½Ü¹‰¥¹¡Ñ¡¥Ì¤ì(€€‰½Õ¹‘Q½±”€ôÑ¡¥Ì¸Ñ½±”¹‰¥¹¡Ñ¡¥Ì¤ì(€€½±½È€ô¹Õ±°ì(€€½¹Ñ…¥¹•È€ô¹Õ±°ì(€€½¹Ñ•¹ÑÍ=‰¨€ô¹Õ±°ì(€€‘…Ñ•=‰¨€ô¹Õ±°ì(€€•±•µ•¹ÑÌ€ô¹Õ±°ì(€€Á…É•¹Ð€ô¹Õ±°ì(€€Á…É•¹ÑI•Ð€ô¹Õ±°ì(€€Á¥¹¹•€ô™…±Í”ì(€€Á½ÁÕÀ€ô¹Õ±°ì(€€Á½ÁÕÁ‰½ÉÑ½¹ÑÉ½±±•È€ô¹Õ±°ì(€€Á½Í¥Ñ¥½¸€ô¹Õ±°ì(€€½µµ•¹Ñ	ÕÑÑ½¸€ô¹Õ±°ì(€€½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸€ô¹Õ±°ì(€€Á½ÁÕÁA½Í¥Ñ¥½¸€ô¹Õ±°ì(€€É•Ð€ô¹Õ±°ì(€€É¥¡Q•áÐ€ô¹Õ±°ì(€€Ñ¥Ñ±•=‰¨€ô¹Õ±°ì(€€ÕÁ‘…Ñ•Ì€ô¹Õ±°ì(€€Ý…ÍY¥Í¥‰±”€ô™…±Í”ì(€€™¥ÉÍÑ±•µ•¹Ð€ô¹Õ±°ì(€€½µµ•¹ÑQ•áÐ€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡ì(€€€½¹Ñ…¥¹•È°(€€€½±½È°(€€€•±•µ•¹ÑÌ°(€€€Ñ¥Ñ±•=‰¨°(€€€µ½‘¥™¥…Ñ¥½¹…Ñ”°(€€€½¹Ñ•¹ÑÍ=‰¨°(€€€É¥¡Q•áÐ°(€€€Á…É•¹Ð°(€€€É•Ð°(€€€Á…É•¹ÑI•Ð°(€€€½Á•¸°(€€€½µµ•¹Ñ5…¹…•È€ô¹Õ±°(€ô¤ì(€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È€ô½¹Ñ…¥¹•Èì(€€€Ñ¡¥Ì¸Ñ¥Ñ±•=‰¨€ôÑ¥Ñ±•=‰¨ì(€€€Ñ¡¥Ì¸½¹Ñ•¹ÑÍ=‰¨€ô½¹Ñ•¹ÑÍ=‰¨ì(€€€Ñ¡¥Ì¸É¥¡Q•áÐ€ôÉ¥¡Q•áÐì(€€€Ñ¡¥Ì¸Á…É•¹Ð€ôÁ…É•¹Ðì(€€€Ñ¡¥Ì¸½±½È€ô½±½Èì(€€€Ñ¡¥Ì¸É•Ð€ôÉ•Ðì(€€€Ñ¡¥Ì¸Á…É•¹ÑI•Ð€ôÁ…É•¹ÑI•Ðì(€€€Ñ¡¥Ì¸•±•µ•¹ÑÌ€ô•±•µ•¹ÑÌì(€€€Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È€ô½µµ•¹Ñ5…¹…•Èì(€€€Ñ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð€ô•±•µ•¹ÑÍlÁtì(€€€Ñ¡¥Ì¸‘…Ñ•=‰¨€ôA…Ñ•MÑÉ¥¹œ¹Ñ½…Ñ•=‰©•Ð¡µ½‘¥™¥…Ñ¥½¹…Ñ”¤ì(€€€Ñ¡¥Ì¹ÑÉ¥•È€ô•±•µ•¹ÑÌ¹™±…Ñ5…À¡”€ôø”¹•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤¤ì(€€€¥˜€ …½µµ•¹Ñ5…¹…•È¤ì(€€€€€Ñ¡¥Ì¸…‘‘Ù•¹Ñ1¥ÍÑ•¹•ÉÌ ¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€€€¥˜€¡½Á•¸¤ì(€€€€€€€Ñ¡¥Ì¸Ñ½±” ¤ì(€€€€€ô(€€€ô(€ô(€€…‘‘Ù•¹Ñ1¥ÍÑ•¹•ÉÌ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á½ÁÕÁ‰½ÉÑ½¹ÑÉ½±±•È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸Á½ÁÕÁ‰½ÉÑ½¹ÑÉ½±±•È€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€½¹ÍÐì(€€€€€Í¥¹…°(€€€ô€ôÑ¡¥Ì¸Á½ÁÕÁ‰½ÉÑ½¹ÑÉ½±±•Èì(€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¹ÑÉ¥•È¤ì(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°Ñ¡¥Ì¸‰½Õ¹‘Q½±”°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É•¹Ñ•Èˆ°Ñ¡¥Ì¸‰½Õ¹‘M¡½Ü°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É±•…Ù”ˆ°Ñ¡¥Ì¸‰½Õ¹‘!¥‘”°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€•±•µ•¹Ð¹±…ÍÍ1¥ÍÐ¹…‘ ‰Á½ÁÕÁQÉ¥•ÉÉ•„ˆ¤ì(€€€ô(€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¸•±•µ•¹ÑÌ¤ì(€€€€€•±•µ•¹Ð¹½¹Ñ…¥¹•Èü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¸‰½Õ¹‘-•å½Ý¸°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€ô(€ô(€€Í•Ñ½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€½¹ÍÐ•±•µ•¹Ð€ôÑ¡¥Ì¸•±•µ•¹ÑÌ¹™¥¹¡”€ôø”¹¡…Í½µµ•¹Ñ	ÕÑÑ½¸¤ì(€€€¥˜€ …•±•µ•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸€ô•±•µ•¹Ð¹}¹½Éµ…±¥é•A½¥¹Ð¡•±•µ•¹Ð¹½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸¤ì(€ô(€É•¹‘•É½µµ•¹Ñ	ÕÑÑ½¸ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¤ì(€€€€€¥˜€ …Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¹Á…É•¹Ñ9½‘”¤ì(€€€€€€€Ñ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹½¹Ñ…¥¹•È¹…™Ñ•È¡Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸¤ì(€€€€€Ñ¡¥Ì¸Í•Ñ½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€Í¥¹…°(€€€ô€ôÑ¡¥Ì¸Á½ÁÕÁ‰½ÉÑ½¹ÑÉ½±±•È€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€½¹ÍÐ¡…Í=Ý¹	ÕÑÑ½¸€ôÑ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸ì(€€€½¹ÍÐÑ½±•A½ÁÕÀ€ô€ ¤€ôøì(€€€€€Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È¹Ñ½±•½µµ•¹ÑA½ÁÕÀ¡Ñ¡¥Ì°ÑÉÕ”°Õ¹‘•™¥¹•°€…¡…Í=Ý¹	ÕÑÑ½¸¤ì(€€€ôì(€€€½¹ÍÐÍ¡½ÝA½ÁÕÀ€ô€ ¤€ôøì(€€€€€Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È¹Ñ½±•½µµ•¹ÑA½ÁÕÀ¡Ñ¡¥Ì°™…±Í”°ÑÉÕ”°€…¡…Í=Ý¹	ÕÑÑ½¸¤ì(€€€ôì(€€€½¹ÍÐ¡¥‘•A½ÁÕÀ€ô€ ¤€ôøì(€€€€€Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È¹Ñ½±•½µµ•¹ÑA½ÁÕÀ¡Ñ¡¥Ì°™…±Í”°™…±Í”¤ì(€€€ôì(€€€¥˜€ …¡…Í=Ý¹	ÕÑÑ½¸¤ì(€€€€€½¹ÍÐ‰ÕÑÑ½¸€ôÑ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‰ÕÑÑ½¸ˆ¤ì(€€€€€‰ÕÑÑ½¸¹±…ÍÍ9…µ”€ô€‰…¹¹½Ñ…Ñ¥½¹½µµ•¹Ñ	ÕÑÑ½¸ˆì(€€€€€½¹ÍÐÁ…É•¹Ñ½¹Ñ…¥¹•È€ôÑ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹½¹Ñ…¥¹•Èì(€€€€€‰ÕÑÑ½¸¹ÍÑå±”¹é%¹‘•à€ôÁ…ÉÍ•%¹Ð¡Á…É•¹Ñ½¹Ñ…¥¹•È¹ÍÑå±”¹é%¹‘•à°€ÄÀ¤€¬€Äì(€€€€€‰ÕÑÑ½¸¹Ñ…‰%¹‘•à€ô€Àì(€€€€€‰ÕÑÑ½¸¹…É¥…!…ÍA½ÁÕÀ€ô€‰‘¥…±½œˆì(€€€€€‰ÕÑÑ½¸¹…É¥…½¹ÑÉ½±Ì€ô€‰½µµ•¹ÑA½ÁÕÀˆì(€€€€€‰ÕÑÑ½¸¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ¥ˆ°€‰Á‘™©ÌµÍ¡½Üµ½µµ•¹Ðµ‰ÕÑÑ½¸ˆ¤ì(€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•½±½È ¤ì(€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¸‰½Õ¹‘-•å½Ý¸°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°Ñ½±•A½ÁÕÀ°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É•¹Ñ•Èˆ°Í¡½ÝA½ÁÕÀ°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É±•…Ù”ˆ°¡¥‘•A½ÁÕÀ°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€Á…É•¹Ñ½¹Ñ…¥¹•È¹…™Ñ•È¡‰ÕÑÑ½¸¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸€ôÑ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹½¹Ñ…¥¹•Èì(€€€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¹ÑÉ¥•È¤ì(€€€€€€€•±•µ•¹Ð¹…É¥…!…ÍA½ÁÕÀ€ô€‰‘¥…±½œˆì(€€€€€€€•±•µ•¹Ð¹…É¥…½¹ÑÉ½±Ì€ô€‰½µµ•¹ÑA½ÁÕÀˆì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¸‰½Õ¹‘-•å½Ý¸°ì(€€€€€€€€€Í¥¹…°(€€€€€€€ô¤ì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°Ñ½±•A½ÁÕÀ°ì(€€€€€€€€€Í¥¹…°(€€€€€€€ô¤ì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É•¹Ñ•Èˆ°Í¡½ÝA½ÁÕÀ°ì(€€€€€€€€€Í¥¹…°(€€€€€€€ô¤ì(€€€€€€€•±•µ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É±•…Ù”ˆ°¡¥‘•A½ÁÕÀ°ì(€€€€€€€€€Í¥¹…°(€€€€€€€ô¤ì(€€€€€€€•±•µ•¹Ð¹±…ÍÍ1¥ÍÐ¹…‘ ‰Á½ÁÕÁQÉ¥•ÉÉ•„ˆ¤ì(€€€€€ô(€€€ô(€ô(€€ÕÁ‘…Ñ•½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹•áÑÉ…A½ÁÕÁ±•µ•¹Ð€˜˜€…Ñ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹•‘¥Ñ½È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¤ì(€€€€€Ñ¡¥Ì¹É•¹‘•É½µµ•¹Ñ	ÕÑÑ½¸ ¤ì(€€€ô(€€€½¹ÍÐmà°åt€ôÑ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ì(€€€½¹ÍÐì(€€€€€ÍÑå±”(€€€ô€ôÑ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸ì(€€€ÍÑå±”¹±•™Ð€ô…±Œ ‘íáô”¥€ì(€€€ÍÑå±”¹Ñ½À€ô…±Œ ‘íåô”€´Ù…È ´µ½µµ•¹Ðµ‰ÕÑÑ½¸µ‘¥´¤¥€ì(€ô(€€ÕÁ‘…Ñ•½±½È ¤ì(€€€¥˜€¡Ñ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹•áÑÉ…A½ÁÕÁ±•µ•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¤ì(€€€€€Ñ¡¥Ì¹É•¹‘•É½µµ•¹Ñ	ÕÑÑ½¸ ¤ì(€€€ô(€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¹ÍÑå±”¹‰…­É½Õ¹‘½±½È€ôÑ¡¥Ì¹½µµ•¹Ñ	ÕÑÑ½¹½±½Èñð€ˆˆì(€ô(€•Ð½µµ•¹Ñ	ÕÑÑ½¹½±½È ¤ì(€€€½¹ÍÐì(€€€€€½±½È°(€€€€€½Á…¥Ñä(€€€ô€ôÑ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹½µµ•¹Ñ…Ñ„ì(€€€¥˜€ …½±½È¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á…É•¹Ð¹}½µµ•¹Ñ5…¹…•È¹µ…­•½µµ•¹Ñ½±½È¡½±½È°½Á…¥Ñä¤ì(€ô(€™½ÕÍ½µµ•¹Ñ	ÕÑÑ½¸ ¤ì(€€€Í•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸ü¹™½ÕÌ ¤ì(€€€ô°€À¤ì(€ô(€•Ñ…Ñ„ ¤ì(€€€½¹ÍÐì(€€€€€É¥¡Q•áÐ°(€€€€€½±½È°(€€€€€½Á…¥Ñä°(€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€ô€ôÑ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹½µµ•¹Ñ…Ñ„ì(€€€É•ÑÕÉ¸ì(€€€€€½¹Ñ•¹ÑÍ=‰¨èì(€€€€€€€ÍÑÈèÑ¡¥Ì¹½µµ•¹Ð(€€€€€ô°(€€€€€É¥¡Q•áÐ°(€€€€€½±½È°(€€€€€½Á…¥Ñä°(€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€ôì(€ô(€•Ð•±•µ•¹Ñ	•™½É•A½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸ì(€ô(€•Ð½µµ•¹Ð ¤ì(€€€Ñ¡¥Ì¸½µµ•¹ÑQ•áÐñðôÑ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹½µµ•¹ÑQ•áÐì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½µµ•¹ÑQ•áÐì(€ô(€Í•Ð½µµ•¹Ð¡Ñ•áÐ¤ì(€€€¥˜€¡Ñ•áÐ€ôôôÑ¡¥Ì¹½µµ•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹½µµ•¹ÑQ•áÐ€ôÑ¡¥Ì¸½µµ•¹ÑQ•áÐ€ôÑ•áÐì(€ô(€™½ÕÌ ¤ì(€€€Ñ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹½¹Ñ…¥¹•Èü¹™½ÕÌ ¤ì(€ô(€•ÐÁ…É•¹Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹±…å•È¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€ô(€Í•Ñ½µµ•¹Ñ	ÕÑÑ½¹MÑ…Ñ•Ì¡ì(€€€Í•±•Ñ•°(€€€¡…ÍA½ÁÕÀ(€ô¤ì(€€€¥˜€ …Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰Í•±•Ñ•ˆ°Í•±•Ñ•¤ì(€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¹…É¥…áÁ…¹‘•€ô¡…ÍA½ÁÕÀì(€ô(€Í•ÑM•±•Ñ•‘½µµ•¹Ñ	ÕÑÑ½¸¡Í•±•Ñ•¤ì(€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰Í•±•Ñ•ˆ°Í•±•Ñ•¤ì(€ô(€•Ð½µµ•¹ÑA½ÁÕÁA½Í¥Ñ¥½¸ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á½ÁÕÁA½Í¥Ñ¥½¸¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á½ÁÕÁA½Í¥Ñ¥½¸ì(€€€ô(€€€½¹ÍÐì(€€€€€à°(€€€€€ä°(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€€€½¹ÍÐì(€€€€€àèÁ…É•¹Ñ`°(€€€€€äèÁ…É•¹Ñd°(€€€€€Ý¥‘Ñ èÁ…É•¹Ñ]¥‘Ñ °(€€€€€¡•¥¡ÐèÁ…É•¹Ñ!•¥¡Ð(€€€ô€ôÑ¡¥Ì¸™¥ÉÍÑ±•µ•¹Ð¹±…å•È¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€€€É•ÑÕÉ¸l¡à€´Á…É•¹Ñ`¤€¼Á…É•¹Ñ]¥‘Ñ °€¡ä€¬¡•¥¡Ð€´Á…É•¹Ñd¤€¼Á…É•¹Ñ!•¥¡Ñtì(€ô(€Í•Ð½µµ•¹ÑA½ÁÕÁA½Í¥Ñ¥½¸¡Á½Ì¤ì(€€€Ñ¡¥Ì¸Á½ÁÕÁA½Í¥Ñ¥½¸€ôÁ½Ìì(€ô(€¡…Í•™…Õ±ÑA½ÁÕÁA½Í¥Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á½ÁÕÁA½Í¥Ñ¥½¸€ôôô¹Õ±°ì(€ô(€•Ð½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ì(€ô(€•Ð½µµ•¹Ñ	ÕÑÑ½¹]¥‘Ñ  ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤¹Ý¥‘Ñ €¼Ñ¡¥Ì¹Á…É•¹Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð¹Ý¥‘Ñ ì(€ô(€•‘¥Ñ½µµ•¹Ð¡½ÁÑ¥½¹Ì¤ì(€€€½¹ÍÐmÁ½Í`°Á½Íet€ôÑ¡¥Ì¸Á½ÁÕÁA½Í¥Ñ¥½¸ñðÑ¡¥Ì¹½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸¹µ…À¡à€ôøà€¼€ÄÀÀ¤ì(€€€½¹ÍÐÁ…É•¹Ñ¥µ•¹Í¥½¹Ì€ôÑ¡¥Ì¹Á…É•¹Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ðì(€€€½¹ÍÐì(€€€€€àèÁ…É•¹Ñ`°(€€€€€äèÁ…É•¹Ñd°(€€€€€Ý¥‘Ñ èÁ…É•¹Ñ]¥‘Ñ °(€€€€€¡•¥¡ÐèÁ…É•¹Ñ!•¥¡Ð(€€€ô€ôÁ…É•¹Ñ¥µ•¹Í¥½¹Ìì(€€€Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È¹Í¡½Ý¥…±½œ¡¹Õ±°°Ñ¡¥Ì°Á…É•¹Ñ`€¬Á½Í`€¨Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñd€¬Á½Íd€¨Á…É•¹Ñ!•¥¡Ð°ì(€€€€€€¸¸¹½ÁÑ¥½¹Ì°(€€€€€Á…É•¹Ñ¥µ•¹Í¥½¹Ì(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á½ÁÕÀ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÁ½ÁÕÀ€ôÑ¡¥Ì¸Á½ÁÕÀ€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€Á½ÁÕÀ¹±…ÍÍ9…µ”€ô€‰Á½ÁÕÀˆì(€€€¥˜€¡Ñ¡¥Ì¸½±½È¤ì(€€€€€½¹ÍÐ‰…Í•½±½È€ôÁ½ÁÕÀ¹ÍÑå±”¹½ÕÑ±¥¹•½±½È€ôUÑ¥°¹µ…­•!•á½±½È ¸¸¹Ñ¡¥Ì¸½±½È¤ì(€€€€€Á½ÁÕÀ¹ÍÑå±”¹‰…­É½Õ¹‘½±½È€ô½±½Èµµ¥à¡¥¸ÍÉˆ°€‘í‰…Í•½±½Éô€ÌÀ”°Ý¡¥Ñ”¥€ì(€€€ô(€€€½¹ÍÐ¡•…‘•È€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰ÍÁ…¸ˆ¤ì(€€€¡•…‘•È¹±…ÍÍ9…µ”€ô€‰¡•…‘•Èˆì(€€€¥˜€¡Ñ¡¥Ì¸Ñ¥Ñ±•=‰¨ü¹ÍÑÈ¤ì(€€€€€½¹ÍÐÑ¥Ñ±”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰ÍÁ…¸ˆ¤ì(€€€€€Ñ¥Ñ±”¹±…ÍÍ9…µ”€ô€‰Ñ¥Ñ±”ˆì(€€€€€¡•…‘•È¹…ÁÁ•¹¡Ñ¥Ñ±”¤ì(€€€€€€¡ì(€€€€€€€‘¥ÈèÑ¥Ñ±”¹‘¥È°(€€€€€€€ÍÑÈèÑ¥Ñ±”¹Ñ•áÑ½¹Ñ•¹Ð(€€€€€ô€ôÑ¡¥Ì¸Ñ¥Ñ±•=‰¨¤ì(€€€ô(€€€Á½ÁÕÀ¹…ÁÁ•¹¡¡•…‘•È¤ì(€€€¥˜€¡Ñ¡¥Ì¸‘…Ñ•=‰¨¤ì(€€€€€½¹ÍÐµ½‘¥™¥…Ñ¥½¹…Ñ”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰Ñ¥µ”ˆ¤ì(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”¹±…ÍÍ9…µ”€ô€‰Á½ÁÕÁ…Ñ”ˆì(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ¥ˆ°€‰Á‘™©Ìµ…¹¹½Ñ…Ñ¥½¸µ‘…Ñ”µÑ¥µ”µÍÑÉ¥¹œˆ¤ì(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ…ÉÌˆ°)M=8¹ÍÑÉ¥¹¥™ä¡ì(€€€€€€€‘…Ñ•=‰¨èÑ¡¥Ì¸‘…Ñ•=‰¨¹Ù…±Õ•=˜ ¤(€€€€€ô¤¤ì(€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”¹‘…Ñ•Q¥µ”€ôÑ¡¥Ì¸‘…Ñ•=‰¨¹Ñ½%M=MÑÉ¥¹œ ¤ì(€€€€€¡•…‘•È¹…ÁÁ•¹¡µ½‘¥™¥…Ñ¥½¹…Ñ”¤ì(€€€ô(€€€É•¹‘•ÉI¥¡Q•áÐ¡ì(€€€€€¡Ñµ°èÑ¡¥Ì¸¡Ñµ°ñðÑ¡¥Ì¸½¹Ñ•¹ÑÍ=‰¨¹ÍÑÈ°(€€€€€‘¥ÈèÑ¡¥Ì¸½¹Ñ•¹ÑÍ=‰¨ü¹‘¥È°(€€€€€±…ÍÍ9…µ”è€‰Á½ÁÕÁ½¹Ñ•¹Ðˆ(€€€ô°Á½ÁÕÀ¤ì(€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹…ÁÁ•¹¡Á½ÁÕÀ¤ì(€ô(€•Ð€¡Ñµ° ¤ì(€€€½¹ÍÐÉ¥¡Q•áÐ€ôÑ¡¥Ì¸É¥¡Q•áÐì(€€€½¹ÍÐ½¹Ñ•¹ÑÍ=‰¨€ôÑ¡¥Ì¸½¹Ñ•¹ÑÍ=‰¨ì(€€€¥˜€¡É¥¡Q•áÐü¹ÍÑÈ€˜˜€ …½¹Ñ•¹ÑÍ=‰¨ü¹ÍÑÈñð½¹Ñ•¹ÑÍ=‰¨¹ÍÑÈ€ôôôÉ¥¡Q•áÐ¹ÍÑÈ¤¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸É¥¡Q•áÐ¹¡Ñµ°ñð¹Õ±°ì(€€€ô(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€•Ð€™½¹ÑM¥é” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸¡Ñµ°ü¹…ÑÑÉ¥‰ÕÑ•Ìü¹ÍÑå±”ü¹™½¹ÑM¥é”ñð€Àì(€ô(€•Ð€™½¹Ñ½±½È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸¡Ñµ°ü¹…ÑÑÉ¥‰ÕÑ•Ìü¹ÍÑå±”ü¹½±½Èñð¹Õ±°ì(€ô(€€µ…­•A½ÁÕÁ½¹Ñ•¹Ð¡Ñ•áÐ¤ì(€€€½¹ÍÐÁ½ÁÕÁ1¥¹•Ì€ômtì(€€€½¹ÍÐÁ½ÁÕÁ½¹Ñ•¹Ð€ôì(€€€€€ÍÑÈèÑ•áÐ°(€€€€€¡Ñµ°èì(€€€€€€€¹…µ”è€‰‘¥Øˆ°(€€€€€€€…ÑÑÉ¥‰ÕÑ•Ìèì(€€€€€€€€€‘¥Èè€‰…ÕÑ¼ˆ(€€€€€€€ô°(€€€€€€€¡¥±‘É•¸èmì(€€€€€€€€€¹…µ”è€‰Àˆ°(€€€€€€€€€¡¥±‘É•¸èÁ½ÁÕÁ1¥¹•Ì(€€€€€€€õt(€€€€€ô(€€€ôì(€€€½¹ÍÐ±¥¹•ÑÑÉ¥‰ÕÑ•Ì€ôì(€€€€€ÍÑå±”èì(€€€€€€€½±½ÈèÑ¡¥Ì¸™½¹Ñ½±½È°(€€€€€€€™½¹ÑM¥é”èÑ¡¥Ì¸™½¹ÑM¥é”€ü…±Œ ‘íÑ¡¥Ì¸™½¹ÑM¥é•õÁà€¨Ù…È ´µÑ½Ñ…°µÍ…±”µ™…Ñ½È¤¥€€è€ˆˆ(€€€€€ô(€€€ôì(€€€™½È€¡½¹ÍÐ±¥¹”½˜Ñ•áÐ¹ÍÁ±¥Ð ‰q¸ˆ¤¤ì(€€€€€Á½ÁÕÁ1¥¹•Ì¹ÁÕÍ ¡ì(€€€€€€€¹…µ”è€‰ÍÁ…¸ˆ°(€€€€€€€Ù…±Õ”è±¥¹”°(€€€€€€€…ÑÑÉ¥‰ÕÑ•Ìè±¥¹•ÑÑÉ¥‰ÕÑ•Ì(€€€€€ô¤ì(€€€ô(€€€É•ÑÕÉ¸Á½ÁÕÁ½¹Ñ•¹Ðì(€ô(€€­•å½Ý¸¡•Ù•¹Ð¤ì(€€€¥˜€¡•Ù•¹Ð¹…±Ñ-•äñð•Ù•¹Ð¹Í¡¥™Ñ-•äñð•Ù•¹Ð¹ÑÉ±-•äñð•Ù•¹Ð¹µ•Ñ…-•ä¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰¹Ñ•Èˆñð•Ù•¹Ð¹­•ä€ôôô€‰Í…Á”ˆ€˜˜Ñ¡¥Ì¸Á¥¹¹•¤ì(€€€€€Ñ¡¥Ì¸Ñ½±” ¤ì(€€€ô(€ô(€ÕÁ‘…Ñ•‘¥Ñ•¡ì(€€€É•Ð°(€€€Á½ÁÕÀ°(€€€‘•±•Ñ•(€ô¤ì(€€€¥˜€¡Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È¤ì(€€€€€¥˜€¡‘•±•Ñ•¤ì(€€€€€€€Ñ¡¥Ì¹É•µ½Ù” ¤ì(€€€€€€€Ñ¡¥Ì¸½µµ•¹ÑQ•áÐ€ô¹Õ±°ì(€€€€€ô•±Í”¥˜€¡Á½ÁÕÀ¤ì(€€€€€€€¥˜€¡Á½ÁÕÀ¹‘•±•Ñ•¤ì(€€€€€€€€€Ñ¡¥Ì¹É•µ½Ù” ¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•½±½È ¤ì(€€€€€€€€€Ñ¡¥Ì¸½µµ•¹ÑQ•áÐ€ôÁ½ÁÕÀ¹Ñ•áÐì(€€€€€€€ô(€€€€€ô(€€€€€¥˜€¡É•Ð¤ì(€€€€€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸€ô¹Õ±°ì(€€€€€€€Ñ¡¥Ì¸Í•Ñ½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡‘•±•Ñ•ñðÁ½ÁÕÀü¹‘•±•Ñ•¤ì(€€€€€Ñ¡¥Ì¹É•µ½Ù” ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸…‘‘Ù•¹Ñ1¥ÍÑ•¹•ÉÌ ¤ì(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•Ìñðôì(€€€€€½¹Ñ•¹ÑÍ=‰¨èÑ¡¥Ì¸½¹Ñ•¹ÑÍ=‰¨°(€€€€€É¥¡Q•áÐèÑ¡¥Ì¸É¥¡Q•áÐ(€€€ôì(€€€¥˜€¡É•Ð¤ì(€€€€€Ñ¡¥Ì¸Á½Í¥Ñ¥½¸€ô¹Õ±°ì(€€€ô(€€€¥˜€¡Á½ÁÕÀ€˜˜Á½ÁÕÀ¹Ñ•áÐ¤ì(€€€€€Ñ¡¥Ì¸É¥¡Q•áÐ€ôÑ¡¥Ì¸µ…­•A½ÁÕÁ½¹Ñ•¹Ð¡Á½ÁÕÀ¹Ñ•áÐ¤ì(€€€€€Ñ¡¥Ì¸‘…Ñ•=‰¨€ôA…Ñ•MÑÉ¥¹œ¹Ñ½…Ñ•=‰©•Ð¡Á½ÁÕÀ¹‘…Ñ”¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ•¹ÑÍ=‰¨€ô¹Õ±°ì(€€€ô(€€€Ñ¡¥Ì¸Á½ÁÕÀü¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸Á½ÁÕÀ€ô¹Õ±°ì(€ô(€É•Í•Ñ‘¥Ñ• ¤ì(€€€¥˜€ …Ñ¡¥Ì¸ÕÁ‘…Ñ•Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€€¡ì(€€€€€½¹Ñ•¹ÑÍ=‰¨èÑ¡¥Ì¸½¹Ñ•¹ÑÍ=‰¨°(€€€€€É¥¡Q•áÐèÑ¡¥Ì¸É¥¡Q•áÐ(€€€ô€ôÑ¡¥Ì¸ÕÁ‘…Ñ•Ì¤ì(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•Ì€ô¹Õ±°ì(€€€Ñ¡¥Ì¸Á½ÁÕÀü¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸Á½ÁÕÀ€ô¹Õ±°ì(€€€Ñ¡¥Ì¸Á½Í¥Ñ¥½¸€ô¹Õ±°ì(€ô(€É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸Á½ÁÕÁ‰½ÉÑ½¹ÑÉ½±±•Èü¹…‰½ÉÐ ¤ì(€€€Ñ¡¥Ì¸Á½ÁÕÁ‰½ÉÑ½¹ÑÉ½±±•È€ô¹Õ±°ì(€€€Ñ¡¥Ì¸Á½ÁÕÀü¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸Á½ÁÕÀ€ô¹Õ±°ì(€€€Ñ¡¥Ì¸Ý…ÍY¥Í¥‰±”€ô™…±Í”ì(€€€Ñ¡¥Ì¸Á¥¹¹•€ô™…±Í”ì(€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸ü¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸½µµ•¹Ñ	ÕÑÑ½¸€ô¹Õ±°ì(€€€¥˜€¡Ñ¡¥Ì¹ÑÉ¥•È¤ì(€€€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¹ÑÉ¥•È¤ì(€€€€€€€•±•µ•¹Ð¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ‰Á½ÁÕÁQÉ¥•ÉÉ•„ˆ¤ì(€€€€€ô(€€€ô(€ô(€€Í•ÑA½Í¥Ñ¥½¸ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á½Í¥Ñ¥½¸€„ôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€Á…”èì(€€€€€€€Ù¥•Ü(€€€€€ô°(€€€€€Ù¥•ÝÁ½ÉÐèì(€€€€€€€É…Ý¥µÌèì(€€€€€€€€€Á…•]¥‘Ñ °(€€€€€€€€€Á…•!•¥¡Ð°(€€€€€€€€€Á…•`°(€€€€€€€€€Á…•d(€€€€€€€ô(€€€€€ô(€€€ô€ôÑ¡¥Ì¸Á…É•¹Ðì(€€€±•ÐÕÍ•A…É•¹ÑI•Ð€ô€„…Ñ¡¥Ì¸Á…É•¹ÑI•Ðì(€€€±•ÐÉ•Ð€ôÕÍ•A…É•¹ÑI•Ð€üÑ¡¥Ì¸Á…É•¹ÑI•Ð€èÑ¡¥Ì¸É•Ðì(€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¸•±•µ•¹ÑÌ¤ì(€€€€€¥˜€ …É•ÐñðUÑ¥°¹¥¹Ñ•ÉÍ•Ð¡•±•µ•¹Ð¹‘…Ñ„¹É•Ð°É•Ð¤€„ôô¹Õ±°¤ì(€€€€€€€É•Ð€ô•±•µ•¹Ð¹‘…Ñ„¹É•Ðì(€€€€€€€ÕÍ•A…É•¹ÑI•Ð€ôÑÉÕ”ì(€€€€€€€‰É•…¬ì(€€€€€ô(€€€ô(€€€½¹ÍÐ¹½Éµ…±¥é•‘I•Ð€ôUÑ¥°¹¹½Éµ…±¥é•I•Ð¡mÉ•ÑlÁt°Ù¥•ÝlÍt€´É•ÑlÅt€¬Ù¥•ÝlÅt°É•ÑlÉt°Ù¥•ÝlÍt€´É•ÑlÍt€¬Ù¥•ÝlÅut¤ì(€€€½¹ÍÐ!=I%i=9Q1}MA}QI}99=QQ%=8€ô€Ôì(€€€½¹ÍÐÁ…É•¹Ñ]¥‘Ñ €ôÕÍ•A…É•¹ÑI•Ð€üÉ•ÑlÉt€´É•ÑlÁt€¬!=I%i=9Q1}MA}QI}99=QQ%=8€è€Àì(€€€½¹ÍÐÁ½ÁÕÁ1•™Ð€ô¹½Éµ…±¥é•‘I•ÑlÁt€¬Á…É•¹Ñ]¥‘Ñ ì(€€€½¹ÍÐÁ½ÁÕÁQ½À€ô¹½Éµ…±¥é•‘I•ÑlÅtì(€€€Ñ¡¥Ì¸Á½Í¥Ñ¥½¸€ôlÄÀÀ€¨€¡Á½ÁÕÁ1•™Ð€´Á…•`¤€¼Á…•]¥‘Ñ °€ÄÀÀ€¨€¡Á½ÁÕÁQ½À€´Á…•d¤€¼Á…•!•¥¡Ñtì(€€€½¹ÍÐì(€€€€€ÍÑå±”(€€€ô€ôÑ¡¥Ì¸½¹Ñ…¥¹•Èì(€€€ÍÑå±”¹±•™Ð€ô€‘íÑ¡¥Ì¸Á½Í¥Ñ¥½¹lÁuô•€ì(€€€ÍÑå±”¹Ñ½À€ô€‘íÑ¡¥Ì¸Á½Í¥Ñ¥½¹lÅuô•€ì(€ô(€€Ñ½±” ¤ì(€€€¥˜€¡Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È¤ì(€€€€€Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È¹Ñ½±•½µµ•¹ÑA½ÁÕÀ¡Ñ¡¥Ì°™…±Í”¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸Á¥¹¹•€ô€…Ñ¡¥Ì¸Á¥¹¹•ì(€€€¥˜€¡Ñ¡¥Ì¸Á¥¹¹•¤ì(€€€€€Ñ¡¥Ì¸Í¡½Ü ¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°Ñ¡¥Ì¸‰½Õ¹‘Q½±”¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¸‰½Õ¹‘-•å½Ý¸¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¸¡¥‘” ¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°Ñ¡¥Ì¸‰½Õ¹‘Q½±”¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¸‰½Õ¹‘-•å½Ý¸¤ì(€€€ô(€ô(€€Í¡½Ü ¤ì(€€€¥˜€ …Ñ¡¥Ì¸Á½ÁÕÀ¤ì(€€€€€Ñ¡¥Ì¹É•¹‘•È ¤ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¹¥ÍY¥Í¥‰±”¤ì(€€€€€Ñ¡¥Ì¸Í•ÑA½Í¥Ñ¥½¸ ¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹¡¥‘‘•¸€ô™…±Í”ì(€€€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹ÍÑå±”¹é%¹‘•à€ôÁ…ÉÍ•%¹Ð¡Ñ¡¥Ì¸½¹Ñ…¥¹•È¹ÍÑå±”¹é%¹‘•à°€ÄÀ¤€¬€ÄÀÀÀì(€€€ô•±Í”¥˜€¡Ñ¡¥Ì¸Á¥¹¹•¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰™½ÕÍ•ˆ¤ì(€€€ô(€ô(€€¡¥‘” ¤ì(€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ‰™½ÕÍ•ˆ¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á¥¹¹•ñð€…Ñ¡¥Ì¹¥ÍY¥Í¥‰±”¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹ÍÑå±”¹é%¹‘•à€ôÁ…ÉÍ•%¹Ð¡Ñ¡¥Ì¸½¹Ñ…¥¹•È¹ÍÑå±”¹é%¹‘•à°€ÄÀ¤€´€ÄÀÀÀì(€ô(€™½É•!¥‘” ¤ì(€€€Ñ¡¥Ì¸Ý…ÍY¥Í¥‰±”€ôÑ¡¥Ì¹¥ÍY¥Í¥‰±”ì(€€€¥˜€ …Ñ¡¥Ì¸Ý…ÍY¥Í¥‰±”¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹¡¥‘‘•¸€ôÑÉÕ”ì(€ô(€µ…å‰•M¡½Ü ¤ì(€€€¥˜€¡Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸…‘‘Ù•¹Ñ1¥ÍÑ•¹•ÉÌ ¤ì(€€€¥˜€ …Ñ¡¥Ì¸Ý…ÍY¥Í¥‰±”¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸Á½ÁÕÀ¤ì(€€€€€Ñ¡¥Ì¸Í¡½Ü ¤ì(€€€ô(€€€Ñ¡¥Ì¸Ý…ÍY¥Í¥‰±”€ô™…±Í”ì(€€€Ñ¡¥Ì¸½¹Ñ…¥¹•È¹¡¥‘‘•¸€ô™…±Í”ì(€ô(€•Ð¥ÍY¥Í¥‰±” ¤ì(€€€É•ÑÕÉ¸€…Ñ¡¥Ì¸½µµ•¹Ñ5…¹…•È€˜˜Ñ¡¥Ì¸½¹Ñ…¥¹•È¹¡¥‘‘•¸€ôôô™…±Í”ì(€ô)ô)±…ÍÌÉ••Q•áÑ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€€€Ñ¡¥Ì¹Ñ•áÑ½¹Ñ•¹Ð€ôÁ…É…µ•Ñ•ÉÌ¹‘…Ñ„¹Ñ•áÑ½¹Ñ•¹Ðì(€€€Ñ¡¥Ì¹Ñ•áÑA½Í¥Ñ¥½¸€ôÁ…É…µ•Ñ•ÉÌ¹‘…Ñ„¹Ñ•áÑA½Í¥Ñ¥½¸ì(€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹IQaPì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰™É••Q•áÑ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€¥˜€¡Ñ¡¥Ì¹Ñ•áÑ½¹Ñ•¹Ð¤ì(€€€€€½¹ÍÐ½¹Ñ•¹Ð€ôÑ¡¥Ì¹½¹Ñ•¹Ñ±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€€€½¹Ñ•¹Ð¹±…ÍÍ1¥ÍÐ¹…‘ ‰…¹¹½Ñ…Ñ¥½¹Q•áÑ½¹Ñ•¹Ðˆ¤ì(€€€€€½¹Ñ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰É½±”ˆ°€‰½µµ•¹Ðˆ¤ì(€€€€€™½È€¡½¹ÍÐ±¥¹”½˜Ñ¡¥Ì¹Ñ•áÑ½¹Ñ•¹Ð¤ì(€€€€€€€½¹ÍÐ±¥¹•MÁ…¸€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰ÍÁ…¸ˆ¤ì(€€€€€€€±¥¹•MÁ…¸¹Ñ•áÑ½¹Ñ•¹Ð€ô±¥¹”ì(€€€€€€€½¹Ñ•¹Ð¹…ÁÁ•¹¡±¥¹•MÁ…¸¤ì(€€€€€ô(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡½¹Ñ•¹Ð¤ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€Ñ¡¥Ì¹}•‘¥Ñ=¹½Õ‰±•±¥¬ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌ1¥¹•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€€±¥¹”€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰±¥¹•¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐÍÙœ€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ”¡Ý¥‘Ñ °¡•¥¡Ð°ÑÉÕ”¤ì(€€€½¹ÍÐ±¥¹”€ôÑ¡¥Ì¸±¥¹”€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÍÙœé±¥¹”ˆ¤ì(€€€±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰àÄˆ°‘…Ñ„¹É•ÑlÉt€´‘…Ñ„¹±¥¹•½½É‘¥¹…Ñ•ÍlÁt¤ì(€€€±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰äÄˆ°‘…Ñ„¹É•ÑlÍt€´‘…Ñ„¹±¥¹•½½É‘¥¹…Ñ•ÍlÅt¤ì(€€€±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰àÈˆ°‘…Ñ„¹É•ÑlÉt€´‘…Ñ„¹±¥¹•½½É‘¥¹…Ñ•ÍlÉt¤ì(€€€±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰äÈˆ°‘…Ñ„¹É•ÑlÍt€´‘…Ñ„¹±¥¹•½½É‘¥¹…Ñ•ÍlÍt¤ì(€€€±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µÝ¥‘Ñ ˆ°‘…Ñ„¹‰½É‘•ÉMÑå±”¹Ý¥‘Ñ ñð€Ä¤ì(€€€±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰™¥±°ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€ÍÙœ¹…ÁÁ•¹¡±¥¹”¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡ÍÙœ¤ì(€€€¥˜€ …‘…Ñ„¹Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸±¥¹”ì(€ô(€…‘‘!¥¡±¥¡ÑÉ•„ ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡ÑÉ•„ˆ¤ì(€ô)ô)±…ÍÌMÅÕ…É•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€€ÍÅÕ…É”€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰ÍÅÕ…É•¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐÍÙœ€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ”¡Ý¥‘Ñ °¡•¥¡Ð°ÑÉÕ”¤ì(€€€½¹ÍÐ‰½É‘•É]¥‘Ñ €ô‘…Ñ„¹‰½É‘•ÉMÑå±”¹Ý¥‘Ñ ì(€€€½¹ÍÐÍÅÕ…É”€ôÑ¡¥Ì¸ÍÅÕ…É”€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÍÙœéÉ•Ðˆ¤ì(€€€ÍÅÕ…É”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰àˆ°‰½É‘•É]¥‘Ñ €¼€È¤ì(€€€ÍÅÕ…É”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰äˆ°‰½É‘•É]¥‘Ñ €¼€È¤ì(€€€ÍÅÕ…É”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ý¥‘Ñ ˆ°Ý¥‘Ñ €´‰½É‘•É]¥‘Ñ ¤ì(€€€ÍÅÕ…É”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡•¥¡Ðˆ°¡•¥¡Ð€´‰½É‘•É]¥‘Ñ ¤ì(€€€ÍÅÕ…É”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µÝ¥‘Ñ ˆ°‰½É‘•É]¥‘Ñ ñð€Ä¤ì(€€€ÍÅÕ…É”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€ÍÅÕ…É”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰™¥±°ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€ÍÙœ¹…ÁÁ•¹¡ÍÅÕ…É”¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡ÍÙœ¤ì(€€€¥˜€ …‘…Ñ„¹Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸ÍÅÕ…É”ì(€ô(€…‘‘!¥¡±¥¡ÑÉ•„ ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡ÑÉ•„ˆ¤ì(€ô)ô)±…ÍÌ¥É±•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€€¥É±”€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¥É±•¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐÍÙœ€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ”¡Ý¥‘Ñ °¡•¥¡Ð°ÑÉÕ”¤ì(€€€½¹ÍÐ‰½É‘•É]¥‘Ñ €ô‘…Ñ„¹‰½É‘•ÉMÑå±”¹Ý¥‘Ñ ì(€€€½¹ÍÐ¥É±”€ôÑ¡¥Ì¸¥É±”€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÍÙœé•±±¥ÁÍ”ˆ¤ì(€€€¥É±”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰àˆ°Ý¥‘Ñ €¼€È¤ì(€€€¥É±”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰äˆ°¡•¥¡Ð€¼€È¤ì(€€€¥É±”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Éàˆ°Ý¥‘Ñ €¼€È€´‰½É‘•É]¥‘Ñ €¼€È¤ì(€€€¥É±”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Éäˆ°¡•¥¡Ð€¼€È€´‰½É‘•É]¥‘Ñ €¼€È¤ì(€€€¥É±”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µÝ¥‘Ñ ˆ°‰½É‘•É]¥‘Ñ ñð€Ä¤ì(€€€¥É±”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€¥É±”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰™¥±°ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€ÍÙœ¹…ÁÁ•¹¡¥É±”¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡ÍÙœ¤ì(€€€¥˜€ …‘…Ñ„¹Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸¥É±”ì(€ô(€…‘‘!¥¡±¥¡ÑÉ•„ ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡ÑÉ•„ˆ¤ì(€ô)ô)±…ÍÌA½±å±¥¹•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€€Á½±å±¥¹”€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•É±…ÍÍ9…µ”€ô€‰Á½±å±¥¹•¹¹½Ñ…Ñ¥½¸ˆì(€€€Ñ¡¥Ì¹ÍÙ±•µ•¹Ñ9…µ”€ô€‰ÍÙœéÁ½±å±¥¹”ˆì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘¡Ñ¡¥Ì¹½¹Ñ…¥¹•É±…ÍÍ9…µ”¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„èì(€€€€€€€É•Ð°(€€€€€€€Ù•ÉÑ¥•Ì°(€€€€€€€‰½É‘•ÉMÑå±”°(€€€€€€€Á½ÁÕÁI•˜(€€€€€ô°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ìì(€€€¥˜€ …Ù•ÉÑ¥•Ì¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€€€ô(€€€½¹ÍÐÍÙœ€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ”¡Ý¥‘Ñ °¡•¥¡Ð°ÑÉÕ”¤ì(€€€±•ÐÁ½¥¹ÑÌ€ômtì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÙ•ÉÑ¥•Ì¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€½¹ÍÐà€ôÙ•ÉÑ¥•Ím¥t€´É•ÑlÁtì(€€€€€½¹ÍÐä€ôÉ•ÑlÍt€´Ù•ÉÑ¥•Ím¤€¬€Åtì(€€€€€Á½¥¹ÑÌ¹ÁÕÍ ¡€‘íáô°‘íåõ€¤ì(€€€ô(€€€Á½¥¹ÑÌ€ôÁ½¥¹ÑÌ¹©½¥¸ ˆ€ˆ¤ì(€€€½¹ÍÐÁ½±å±¥¹”€ôÑ¡¥Ì¸Á½±å±¥¹”€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð¡Ñ¡¥Ì¹ÍÙ±•µ•¹Ñ9…µ”¤ì(€€€Á½±å±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Á½¥¹ÑÌˆ°Á½¥¹ÑÌ¤ì(€€€Á½±å±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µÝ¥‘Ñ ˆ°‰½É‘•ÉMÑå±”¹Ý¥‘Ñ ñð€Ä¤ì(€€€Á½±å±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€Á½±å±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰™¥±°ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€ÍÙœ¹…ÁÁ•¹¡Á½±å±¥¹”¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡ÍÙœ¤ì(€€€¥˜€ …Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á½±å±¥¹”ì(€ô(€…‘‘!¥¡±¥¡ÑÉ•„ ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡ÑÉ•„ˆ¤ì(€ô)ô)±…ÍÌA½±å½¹¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘ÌA½±å±¥¹•¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•É±…ÍÍ9…µ”€ô€‰Á½±å½¹¹¹½Ñ…Ñ¥½¸ˆì(€€€Ñ¡¥Ì¹ÍÙ±•µ•¹Ñ9…µ”€ô€‰ÍÙœéÁ½±å½¸ˆì(€ô)ô)±…ÍÌ…É•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰…É•Ñ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌ%¹­¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€€Á½±å±¥¹•ÍÉ½ÕÁ±•µ•¹Ð€ô¹Õ±°ì(€€Á½±å±¥¹•Ì€ômtì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•É±…ÍÍ9…µ”€ô€‰¥¹­¹¹½Ñ…Ñ¥½¸ˆì(€€€Ñ¡¥Ì¹ÍÙ±•µ•¹Ñ9…µ”€ô€‰ÍÙœéÁ½±å±¥¹”ˆì(€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”€ôÑ¡¥Ì¹‘…Ñ„¹¥Ð€ôôô€‰%¹­!¥¡±¥¡Ðˆ€ü¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹!%!1%!P€è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹%9,ì(€ô(€€•ÑQÉ…¹Í™½É´¡É½Ñ…Ñ¥½¸°É•Ð¤ì(€€€ÍÝ¥Ñ €¡É½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€äÀè(€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ÑÉ…¹Í™½É´èÉ½Ñ…Ñ” äÀ¤ÑÉ…¹Í±…Ñ” ‘ìµÉ•ÑlÁuô°‘íÉ•ÑlÅuô¤Í…±” Ä°´Ä¥€°(€€€€€€€€€Ý¥‘Ñ èÉ•ÑlÍt€´É•ÑlÅt°(€€€€€€€€€¡•¥¡ÐèÉ•ÑlÉt€´É•ÑlÁt(€€€€€€€ôì(€€€€€…Í”€ÄàÀè(€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ÑÉ…¹Í™½É´èÉ½Ñ…Ñ” ÄàÀ¤ÑÉ…¹Í±…Ñ” ‘ìµÉ•ÑlÉuô°‘íÉ•ÑlÅuô¤Í…±” Ä°´Ä¥€°(€€€€€€€€€Ý¥‘Ñ èÉ•ÑlÉt€´É•ÑlÁt°(€€€€€€€€€¡•¥¡ÐèÉ•ÑlÍt€´É•ÑlÅt(€€€€€€€ôì(€€€€€…Í”€ÈÜÀè(€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ÑÉ…¹Í™½É´èÉ½Ñ…Ñ” ÈÜÀ¤ÑÉ…¹Í±…Ñ” ‘ìµÉ•ÑlÉuô°‘íÉ•ÑlÍuô¤Í…±” Ä°´Ä¥€°(€€€€€€€€€Ý¥‘Ñ èÉ•ÑlÍt€´É•ÑlÅt°(€€€€€€€€€¡•¥¡ÐèÉ•ÑlÉt€´É•ÑlÁt(€€€€€€€ôì(€€€€€‘•™…Õ±Ðè(€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€ÑÉ…¹Í™½É´èÑÉ…¹Í±…Ñ” ‘ìµÉ•ÑlÁuô°‘íÉ•ÑlÍuô¤Í…±” Ä°´Ä¥€°(€€€€€€€€€Ý¥‘Ñ èÉ•ÑlÉt€´É•ÑlÁt°(€€€€€€€€€¡•¥¡ÐèÉ•ÑlÍt€´É•ÑlÅt(€€€€€€€ôì(€€€ô(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘¡Ñ¡¥Ì¹½¹Ñ…¥¹•É±…ÍÍ9…µ”¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„èì(€€€€€€€É•Ð°(€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€¥¹­1¥ÍÑÌ°(€€€€€€€‰½É‘•ÉMÑå±”°(€€€€€€€Á½ÁÕÁI•˜(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐì(€€€€€ÑÉ…¹Í™½É´°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ì¸•ÑQÉ…¹Í™½É´¡É½Ñ…Ñ¥½¸°É•Ð¤ì(€€€½¹ÍÐÍÙœ€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ”¡Ý¥‘Ñ °¡•¥¡Ð°ÑÉÕ”¤ì(€€€½¹ÍÐœ€ôÑ¡¥Ì¸Á½±å±¥¹•ÍÉ½ÕÁ±•µ•¹Ð€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÍÙœéœˆ¤ì(€€€ÍÙœ¹…ÁÁ•¹¡œ¤ì(€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µÝ¥‘Ñ ˆ°‰½É‘•ÉMÑå±”¹Ý¥‘Ñ ñð€Ä¤ì(€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µ±¥¹•…Àˆ°€‰É½Õ¹ˆ¤ì(€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µ±¥¹•©½¥¸ˆ°€‰É½Õ¹ˆ¤ì(€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µµ¥Ñ•É±¥µ¥Ðˆ°€ÄÀ¤ì(€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰™¥±°ˆ°€‰ÑÉ…¹ÍÁ…É•¹Ðˆ¤ì(€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÑÉ…¹Í™½É´ˆ°ÑÉ…¹Í™½É´¤ì(€€€™½È€¡½¹ÍÐ¥¹­1¥ÍÐ½˜¥¹­1¥ÍÑÌ¤ì(€€€€€½¹ÍÐÁ½±å±¥¹”€ôÑ¡¥Ì¹ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð¡Ñ¡¥Ì¹ÍÙ±•µ•¹Ñ9…µ”¤ì(€€€€€Ñ¡¥Ì¸Á½±å±¥¹•Ì¹ÁÕÍ ¡Á½±å±¥¹”¤ì(€€€€€Á½±å±¥¹”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Á½¥¹ÑÌˆ°¥¹­1¥ÍÐ¹©½¥¸ ˆ°ˆ¤¤ì(€€€€€œ¹…ÁÁ•¹¡Á½±å±¥¹”¤ì(€€€ô(€€€¥˜€ …Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡ÍÙœ¤ì(€€€Ñ¡¥Ì¹}•‘¥Ñ=¹½Õ‰±•±¥¬ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€ÕÁ‘…Ñ•‘¥Ñ•¡Á…É…µÌ¤ì(€€€ÍÕÁ•È¹ÕÁ‘…Ñ•‘¥Ñ•¡Á…É…µÌ¤ì(€€€½¹ÍÐì(€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€Á½¥¹ÑÌ°(€€€€€É•Ð(€€€ô€ôÁ…É…µÌì(€€€½¹ÍÐœ€ôÑ¡¥Ì¸Á½±å±¥¹•ÍÉ½ÕÁ±•µ•¹Ðì(€€€¥˜€¡Ñ¡¥­¹•ÍÌ€øô€À¤ì(€€€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”µÝ¥‘Ñ ˆ°Ñ¡¥­¹•ÍÌñð€Ä¤ì(€€€ô(€€€¥˜€¡Á½¥¹ÑÌ¤ì(€€€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÑ¡¥Ì¸Á½±å±¥¹•Ì¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€€€Ñ¡¥Ì¸Á½±å±¥¹•Ím¥t¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Á½¥¹ÑÌˆ°Á½¥¹ÑÍm¥t¹©½¥¸ ˆ°ˆ¤¤ì(€€€€€ô(€€€ô(€€€¥˜€¡É•Ð¤ì(€€€€€½¹ÍÐì(€€€€€€€ÑÉ…¹Í™½É´°(€€€€€€€Ý¥‘Ñ °(€€€€€€€¡•¥¡Ð(€€€€€ô€ôÑ¡¥Ì¸•ÑQÉ…¹Í™½É´¡Ñ¡¥Ì¹‘…Ñ„¹É½Ñ…Ñ¥½¸°É•Ð¤ì(€€€€€½¹ÍÐÉ½½Ð€ôœ¹Á…É•¹Ñ±•µ•¹Ðì(€€€€€É½½Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ù¥•Ý	½àˆ°€À€À€‘íÝ¥‘Ñ¡ô€‘í¡•¥¡Ñõ€¤ì(€€€€€œ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÑÉ…¹Í™½É´ˆ°ÑÉ…¹Í™½É´¤ì(€€€ô(€ô(€•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á½±å±¥¹•Ìì(€ô(€…‘‘!¥¡±¥¡ÑÉ•„ ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡ÑÉ•„ˆ¤ì(€ô)ô)±…ÍÌ!¥¡±¥¡Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”°(€€€€€É•…Ñ•EÕ…‘É¥±…Ñ•É…±ÌèÑÉÕ”(€€€ô¤ì(€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹!%!1%!Pì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„èì(€€€€€€€½Ù•É±…¥‘Q•áÐ°(€€€€€€€Á½ÁÕÁI•˜(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€¥˜€ …Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡Ñ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€Ñ¡¥Ì¹}•‘¥Ñ=¹½Õ‰±•±¥¬ ¤ì(€€€¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€½¹ÍÐµ…É¬€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰µ…É¬ˆ¤ì(€€€€€µ…É¬¹±…ÍÍ1¥ÍÐ¹…‘ ‰½Ù•É±…¥‘Q•áÐˆ¤ì(€€€€€µ…É¬¹Ñ•áÑ½¹Ñ•¹Ð€ô½Ù•É±…¥‘Q•áÐì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡µ…É¬¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌU¹‘•É±¥¹•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”°(€€€€€É•…Ñ•EÕ…‘É¥±…Ñ•É…±ÌèÑÉÕ”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„èì(€€€€€€€½Ù•É±…¥‘Q•áÐ°(€€€€€€€Á½ÁÕÁI•˜(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€¥˜€ …Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰Õ¹‘•É±¥¹•¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€½¹ÍÐÕ¹‘•É±¥¹”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰Ôˆ¤ì(€€€€€Õ¹‘•É±¥¹”¹±…ÍÍ1¥ÍÐ¹…‘ ‰½Ù•É±…¥‘Q•áÐˆ¤ì(€€€€€Õ¹‘•É±¥¹”¹Ñ•áÑ½¹Ñ•¹Ð€ô½Ù•É±…¥‘Q•áÐì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡Õ¹‘•É±¥¹”¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌMÅÕ¥±å¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”°(€€€€€É•…Ñ•EÕ…‘É¥±…Ñ•É…±ÌèÑÉÕ”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„èì(€€€€€€€½Ù•É±…¥‘Q•áÐ°(€€€€€€€Á½ÁÕÁI•˜(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€¥˜€ …Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰ÍÅÕ¥±å¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€½¹ÍÐÕ¹‘•É±¥¹”€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰Ôˆ¤ì(€€€€€Õ¹‘•É±¥¹”¹±…ÍÍ1¥ÍÐ¹…‘ ‰½Ù•É±…¥‘Q•áÐˆ¤ì(€€€€€Õ¹‘•É±¥¹”¹Ñ•áÑ½¹Ñ•¹Ð€ô½Ù•É±…¥‘Q•áÐì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡Õ¹‘•É±¥¹”¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌMÑÉ¥­•=ÕÑ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”°(€€€€€É•…Ñ•EÕ…‘É¥±…Ñ•É…±ÌèÑÉÕ”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐì(€€€€€‘…Ñ„èì(€€€€€€€½Ù•É±…¥‘Q•áÐ°(€€€€€€€Á½ÁÕÁI•˜(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€¥˜€ …Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰ÍÑÉ¥­•½ÕÑ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€¥˜€¡½Ù•É±…¥‘Q•áÐ¤ì(€€€€€½¹ÍÐÍÑÉ¥­•½ÕÐ€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰Ìˆ¤ì(€€€€€ÍÑÉ¥­•½ÕÐ¹±…ÍÍ1¥ÍÐ¹…‘ ‰½Ù•É±…¥‘Q•áÐˆ¤ì(€€€€€ÍÑÉ¥­•½ÕÐ¹Ñ•áÑ½¹Ñ•¹Ð€ô½Ù•É±…¥‘Q•áÐì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡ÍÑÉ¥­•½ÕÐ¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌMÑ…µÁ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”°(€€€€€¥¹½É•	½É‘•ÈèÑÉÕ”(€€€ô¤ì(€€€Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹MQ5@ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰ÍÑ…µÁ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹Í•ÑÑÑÉ¥‰ÕÑ” ‰É½±”ˆ°€‰¥µœˆ¤ì(€€€¥˜€ …Ñ¡¥Ì¹‘…Ñ„¹Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô(€€€Ñ¡¥Ì¹}•‘¥Ñ=¹½Õ‰±•±¥¬ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô)ô)±…ÍÌ¥±•ÑÑ…¡µ•¹Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€€ÑÉ¥•È€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”èÑÉÕ”(€€€ô¤ì(€€€½¹ÍÐì(€€€€€™¥±•%°(€€€€€™¥±”(€€€ô€ôÑ¡¥Ì¹‘…Ñ„ì(€€€Ñ¡¥Ì¹™¥±•¹…µ”€ô™¥±”¹™¥±•¹…µ”ì(€€€Ñ¡¥Ì¹½¹Ñ•¹Ð€ô™¥±”¹½¹Ñ•¹Ðì(€€€Ñ¡¥Ì¹™¥±•%€ô™¥±•%ì(€€€Ñ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•Ù•¹Ñ	ÕÌü¹‘¥ÍÁ…Ñ  ‰™¥±•…ÑÑ…¡µ•¹Ñ…¹¹½Ñ…Ñ¥½¸ˆ°ì(€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€…ÑÑ…¡µ•¹Ñ%èÑ¡¥Ì¹™¥±•%°(€€€€€€¸¸¹™¥±”(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰™¥±•ÑÑ…¡µ•¹Ñ¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€½¹ÍÐì(€€€€€½¹Ñ…¥¹•È°(€€€€€‘…Ñ„(€€€ô€ôÑ¡¥Ìì(€€€±•ÐÑÉ¥•Èì(€€€¥˜€¡‘…Ñ„¹¡…ÍÁÁ•…É…¹”ñð‘…Ñ„¹™¥±±±Á¡„€ôôô€À¤ì(€€€€€ÑÉ¥•È€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€ô•±Í”ì(€€€€€ÑÉ¥•È€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰¥µœˆ¤ì(€€€€€ÑÉ¥•È¹ÍÉŒ€ô€‘íÑ¡¥Ì¹¥µ…•I•Í½ÕÉ•ÍA…Ñ¡õ…¹¹½Ñ…Ñ¥½¸´‘ì½Á…Á•É±¥À½¤¹Ñ•ÍÐ¡‘…Ñ„¹¹…µ”¤€ü€‰Á…Á•É±¥Àˆ€è€‰ÁÕÍ¡Á¥¸‰ô¹ÍÙ€ì(€€€€€¥˜€¡‘…Ñ„¹™¥±±±Á¡„€˜˜‘…Ñ„¹™¥±±±Á¡„€ð€Ä¤ì(€€€€€€€ÑÉ¥•È¹ÍÑå±”€ô™¥±Ñ•Èè½Á…¥Ñä ‘í5…Ñ ¹É½Õ¹¡‘…Ñ„¹™¥±±±Á¡„€¨€ÄÀÀ¥ô”¤í€ì(€€€€€ô(€€€ô(€€€ÑÉ¥•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‘‰±±¥¬ˆ°Ñ¡¥Ì¸‘½Ý¹±½…¹‰¥¹¡Ñ¡¥Ì¤¤ì(€€€Ñ¡¥Ì¸ÑÉ¥•È€ôÑÉ¥•Èì(€€€½¹ÍÐì(€€€€€¥Í5…Œ(€€€ô€ô•…ÑÕÉ•Q•ÍÐ¹Á±…Ñ™½É´ì(€€€½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°•ÙÐ€ôøì(€€€€€¥˜€¡•ÙÐ¹­•ä€ôôô€‰¹Ñ•Èˆ€˜˜€¡¥Í5…Œ€ü•ÙÐ¹µ•Ñ…-•ä€è•ÙÐ¹ÑÉ±-•ä¤¤ì(€€€€€€€Ñ¡¥Ì¸‘½Ý¹±½… ¤ì(€€€€€ô(€€€ô¤ì(€€€¥˜€ …‘…Ñ„¹Á½ÁÕÁI•˜€˜˜Ñ¡¥Ì¹¡…ÍA½ÁÕÁ…Ñ„¤ì(€€€€€Ñ¡¥Ì¹¡…Í=Ý¹½µµ•¹Ñ	ÕÑÑ½¸€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}É•…Ñ•A½ÁÕÀ ¤ì(€€€ô•±Í”ì(€€€€€ÑÉ¥•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰Á½ÁÕÁQÉ¥•ÉÉ•„ˆ¤ì(€€€ô(€€€½¹Ñ…¥¹•È¹…ÁÁ•¹¡ÑÉ¥•È¤ì(€€€É•ÑÕÉ¸½¹Ñ…¥¹•Èì(€ô(€•Ñ±•µ•¹ÑÍQ½QÉ¥•ÉA½ÁÕÀ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸ÑÉ¥•Èì(€ô(€…‘‘!¥¡±¥¡ÑÉ•„ ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡ÑÉ•„ˆ¤ì(€ô(€…Íå¹Œ€‘½Ý¹±½… ¤ì(€€€½¹ÍÐì(€€€€€™¥±•%°(€€€€€™¥±•¹…µ”°(€€€€€½¹Ñ•¹Ðè™…±±‰…­½¹Ñ•¹Ð(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐ½¹Ñ•¹Ð€ô€¡…Ý…¥ÐÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•ÑÑÑ…¡µ•¹Ñ½¹Ñ•¹Ð¡™¥±•%¤¤ñð™…±±‰…­½¹Ñ•¹Ðì(€€€¥˜€¡½¹Ñ•¹Ð¤ì(€€€€€Ñ¡¥Ì¹‘½Ý¹±½…‘5…¹…•Èü¹½Á•¹=É½Ý¹±½…‘…Ñ„¡½¹Ñ•¹Ð°™¥±•¹…µ”¤ì(€€€ô(€ô)ô)±…ÍÌ5•‘¥…¹¹½Ñ…Ñ¥½¹±•µ•¹Ð•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹±•µ•¹Ðì(€€…‰½ÉÑ½¹ÑÉ½±±•È€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€½¹Ñ•¹ÑUÉ°€ô¹Õ±°ì(€€µ•‘¥„€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Á…É…µ•Ñ•ÉÌ°ì(€€€€€¥ÍI•¹‘•É…‰±”è€„…Á…É…µ•Ñ•ÉÌ¹‘…Ñ„¹É¥¡5•‘¥„(€€€ô¤ì(€ô(€É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹…‘ ‰µ•‘¥…¹¹½Ñ…Ñ¥½¸ˆ¤ì(€€€½¹ÍÐì(€€€€€™¥±•¹…µ”(€€€ô€ôÑ¡¥Ì¹‘…Ñ„¹É¥¡5•‘¥„ì(€€€½¹ÍÐ‰ÕÑÑ½¸€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‰ÕÑÑ½¸ˆ¤ì(€€€‰ÕÑÑ½¸¹±…ÍÍ9…µ”€ô€‰µ•‘¥…A±…å	ÕÑÑ½¸ˆì(€€€‰ÕÑÑ½¸¹ÑåÁ”€ô€‰‰ÕÑÑ½¸ˆì(€€€‰ÕÑÑ½¸¹Ñ¥Ñ±”€ô‰ÕÑÑ½¸¹…É¥…1…‰•°€ô™¥±•¹…µ”ì(€€€‰ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±¥¬ˆ°€ ¤€ôøÑ¡¥Ì¸±½…¡‰ÕÑÑ½¸¤°ì(€€€€€Í¥¹…°èÑ¡¥Ì¸…‰½ÉÑ½¹ÑÉ½±±•È¹Í¥¹…°(€€€ô¤ì(€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…ÁÁ•¹¡‰ÕÑÑ½¸¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹Ñ…¥¹•Èì(€ô(€…Íå¹Œ€±½…¡‰ÕÑÑ½¸¤ì(€€€½¹ÍÐì(€€€€€™¥±•%°(€€€€€™¥±•¹…µ”°(€€€€€½¹Ñ•¹ÑQåÁ”(€€€ô€ôÑ¡¥Ì¹‘…Ñ„¹É¥¡5•‘¥„ì(€€€‰ÕÑÑ½¸¹‘¥Í…‰±•€ôÑÉÕ”ì(€€€±•Ð½¹Ñ•¹Ðì(€€€ÑÉäì(€€€€€½¹Ñ•¹Ð€ô…Ý…¥ÐÑ¡¥Ì¹±¥¹­M•ÉÙ¥”¹•ÑÑÑ…¡µ•¹Ñ½¹Ñ•¹Ð¡™¥±•%¤ì(€€€ô…Ñ ì(€€€€€É•ÑÕÉ¸ì(€€€ô™¥¹…±±äì(€€€€€‰ÕÑÑ½¸¹‘¥Í…‰±•€ô™…±Í”ì(€€€ô(€€€¥˜€ …½¹Ñ•¹Ðñð€…‰ÕÑÑ½¸¹¥Í½¹¹•Ñ•¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€Í¥¹…°(€€€ô€ôÑ¡¥Ì¸…‰½ÉÑ½¹ÑÉ½±±•Èì(€€€½¹ÍÐÕÉ°€ôUI0¹É•…Ñ•=‰©•ÑUI0¡¹•Ü	±½ˆ¡m½¹Ñ•¹Ñt°ì(€€€€€ÑåÁ”è½¹Ñ•¹ÑQåÁ”(€€€ô¤¤ì(€€€Ñ¡¥Ì¸½¹Ñ•¹ÑUÉ°€ôÕÉ°ì(€€€½¹ÍÐ¥ÍÕ‘¥¼€ô½¹Ñ•¹ÑQåÁ”¹ÍÑ…ÉÑÍ]¥Ñ  ‰…Õ‘¥¼¼ˆ¤ì(€€€½¹ÍÐµ•‘¥„€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð¡¥ÍÕ‘¥¼€ü€‰…Õ‘¥¼ˆ€è€‰Ù¥‘•¼ˆ¤ì(€€€Ñ¡¥Ì¸µ•‘¥„€ôµ•‘¥„ì(€€€µ•‘¥„¹±…ÍÍ9…µ”€ô€‰µ•‘¥…½¹Ñ•¹Ðˆì(€€€Ñ¡¥Ì¹}Í•Ñ	…­É½Õ¹‘½±½È¡µ•‘¥„¤ì(€€€µ•‘¥„¹ÍÉŒ€ôÕÉ°ì(€€€µ•‘¥„¹Ñ¥Ñ±”€ô™¥±•¹…µ”ì(€€€µ•‘¥„¹½¹ÑÉ½±Ì€ôÑÉÕ”ì(€€€µ•‘¥„¹…ÕÑ½Á±…ä€ôÑÉÕ”ì(€€€µ•‘¥„¹Ñ…‰%¹‘•à€ô€Àì(€€€¥˜€¡¥ÍÕ‘¥¼¤ì(€€€€€±•Ð¡½Ù•É•€ô™…±Í”ì(€€€€€±•Ð™½ÕÍ•€ô™…±Í”ì(€€€€€½¹ÍÐÕÁ‘…Ñ•½¹ÑÉ½±Ì€ô€ ¤€ôøì(€€€€€€€µ•‘¥„¹½¹ÑÉ½±Ì€ô¡½Ù•É•ñð™½ÕÍ•ì(€€€€€ôì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É•¹Ñ•Èˆ°€ ¤€ôøì(€€€€€€€¡½Ù•É•€ôÑÉÕ”ì(€€€€€€€ÕÁ‘…Ñ•½¹ÑÉ½±Ì ¤ì(€€€€€ô°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É±•…Ù”ˆ°€ ¤€ôøì(€€€€€€€¡½Ù•É•€ô™…±Í”ì(€€€€€€€ÕÁ‘…Ñ•½¹ÑÉ½±Ì ¤ì(€€€€€ô°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰™½ÕÍ¥¸ˆ°€ ¤€ôøì(€€€€€€€™½ÕÍ•€ôÑÉÕ”ì(€€€€€€€ÕÁ‘…Ñ•½¹ÑÉ½±Ì ¤ì(€€€€€ô°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¹½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰™½ÕÍ½ÕÐˆ°€ ¤€ôøì(€€€€€€€™½ÕÍ•€ô™…±Í”ì(€€€€€€€ÕÁ‘…Ñ•½¹ÑÉ½±Ì ¤ì(€€€€€ô°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€ô(€€€µ•‘¥„¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰•µÁÑ¥•ˆ°€ ¤€ôøÑ¡¥Ì¸É•Ù½­•½¹Ñ•¹ÑUÉ°¡ÕÉ°¤°ì(€€€€€½¹”èÑÉÕ”°(€€€€€Í¥¹…°(€€€ô¤ì(€€€‰ÕÑÑ½¸¹É•Á±…•]¥Ñ ¡µ•‘¥„¤ì(€€€µ•‘¥„¹Á±…ä ¤¹…Ñ   ¤€ôøíô¤ì(€ô(€€É•Ù½­•½¹Ñ•¹ÑUÉ°¡ÕÉ°€ôÑ¡¥Ì¸½¹Ñ•¹ÑUÉ°¤ì(€€€¥˜€¡ÕÉ°€˜˜ÕÉ°€ôôôÑ¡¥Ì¸½¹Ñ•¹ÑUÉ°¤ì(€€€€€UI0¹É•Ù½­•=‰©•ÑUI0¡ÕÉ°¤ì(€€€€€Ñ¡¥Ì¸½¹Ñ•¹ÑUÉ°€ô¹Õ±°ì(€€€ô(€ô(€‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¸…‰½ÉÑ½¹ÑÉ½±±•È¹…‰½ÉÐ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸µ•‘¥„¤ì(€€€€€Ñ¡¥Ì¸µ•‘¥„¹Á…ÕÍ” ¤ì(€€€€€Ñ¡¥Ì¸µ•‘¥„¹É•µ½Ù•ÑÑÉ¥‰ÕÑ” ‰ÍÉŒˆ¤ì(€€€€€Ñ¡¥Ì¸µ•‘¥„¹±½… ¤ì(€€€€€Ñ¡¥Ì¸µ•‘¥„€ô¹Õ±°ì(€€€ô(€€€Ñ¡¥Ì¸É•Ù½­•½¹Ñ•¹ÑUÉ° ¤ì(€ô)ô)±…ÍÌ¹¹½Ñ…Ñ¥½¹1…å•Èì(€€…•ÍÍ¥‰¥±¥Ñå5…¹…•È€ô¹Õ±°ì(€€…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À€ô¹Õ±°ì(€€…¹¹½Ñ…Ñ¥½¹MÑ½É…”€ô¹Õ±°ì(€€•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì€ô¹•Ü5…À ¤ì(€€ÍÑÉÕÑQÉ••1…å•È€ô¹Õ±°ì(€€±¥¹­M•ÉÙ¥”€ô¹Õ±°ì(€€•±•µ•¹ÑÌ€ômtì(€€¡…ÍÉ¥…ÑÑÉ¥‰ÕÑ•ÍÉ½µMÑÉÕÑQÉ•”€ô™…±Í”ì(€é%¹‘•à€ô€Àì(€½¹ÍÑÉÕÑ½È¡ì(€€€‘¥Ø°(€€€…•ÍÍ¥‰¥±¥Ñå5…¹…•È°(€€€…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À°(€€€…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•È°(€€€Á…”°(€€€Ù¥•ÝÁ½ÉÐ°(€€€ÍÑÉÕÑQÉ••1…å•È°(€€€½µµ•¹Ñ5…¹…•È°(€€€±¥¹­M•ÉÙ¥”°(€€€…¹¹½Ñ…Ñ¥½¹MÑ½É…”(€ô¤ì(€€€Ñ¡¥Ì¹‘¥Ø€ô‘¥Øì(€€€Ñ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•È€ô…•ÍÍ¥‰¥±¥Ñå5…¹…•Èì(€€€Ñ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À€ô…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…Àì(€€€Ñ¡¥Ì¸ÍÑÉÕÑQÉ••1…å•È€ôÍÑÉÕÑQÉ••1…å•Èñð¹Õ±°ì(€€€Ñ¡¥Ì¸±¥¹­M•ÉÙ¥”€ô±¥¹­M•ÉÙ¥”ñð¹Õ±°ì(€€€Ñ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹MÑ½É…”€ô…¹¹½Ñ…Ñ¥½¹MÑ½É…”ñð¹•Ü¹¹½Ñ…Ñ¥½¹MÑ½É…” ¤ì(€€€Ñ¡¥Ì¹Á…”€ôÁ…”ì(€€€Ñ¡¥Ì¹Ù¥•ÝÁ½ÉÐ€ôÙ¥•ÝÁ½ÉÐì(€€€Ñ¡¥Ì¹}…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•È€ô…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•Èì(€€€Ñ¡¥Ì¹}½µµ•¹Ñ5…¹…•È€ô½µµ•¹Ñ5…¹…•Èñð¹Õ±°ì(€ô(€¡…Í‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì¹Í¥é”€ø€Àì(€ô(€…Íå¹ŒÉ•¹‘•È¡Á…É…µÌ¤ì(€€€½¹ÍÐì(€€€€€…¹¹½Ñ…Ñ¥½¹Ì°(€€€€€½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ(€€€ô€ôÁ…É…µÌì(€€€½¹ÍÐ±…å•È€ôÑ¡¥Ì¹‘¥Øì(€€€Í•Ñ1…å•É¥µ•¹Í¥½¹Ì¡±…å•È°Ñ¡¥Ì¹Ù¥•ÝÁ½ÉÐ¤ì(€€€½¹ÍÐÁ½ÁÕÁQ½±•µ•¹ÑÌ€ô¹•Ü5…À ¤ì(€€€½¹ÍÐÁ½ÁÕÁ¹¹½Ñ…Ñ¥½¹Ì€ômtì(€€€½¹ÍÐ•±•µ•¹ÑA…É…µÌ€ôì(€€€€€‘…Ñ„è¹Õ±°°(€€€€€±…å•È°(€€€€€±¥¹­M•ÉÙ¥”èÑ¡¥Ì¸±¥¹­M•ÉÙ¥”°(€€€€€‘½Ý¹±½…‘5…¹…•ÈèÁ…É…µÌ¹‘½Ý¹±½…‘5…¹…•È°(€€€€€¥µ…•I•Í½ÕÉ•ÍA…Ñ èÁ…É…µÌ¹¥µ…•I•Í½ÕÉ•ÍA…Ñ ñð€ˆˆ°(€€€€€É•¹‘•É½ÉµÌèÁ…É…µÌ¹É•¹‘•É½ÉµÌ€„ôô™…±Í”°(€€€€€ÍÙ…Ñ½Éäè¹•Ü=5MY…Ñ½Éä ¤°(€€€€€…¹¹½Ñ…Ñ¥½¹MÑ½É…”èÑ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹MÑ½É…”°(€€€€€•¹…‰±•½µµ•¹ÐèÁ…É…µÌ¹•¹…‰±•½µµ•¹Ð€ôôôÑÉÕ”°(€€€€€•¹…‰±•MÉ¥ÁÑ¥¹œèÁ…É…µÌ¹•¹…‰±•MÉ¥ÁÑ¥¹œ€ôôôÑÉÕ”°(€€€€€¡…Í)MÑ¥½¹ÌèÁ…É…µÌ¹¡…Í)MÑ¥½¹Ì°(€€€€€™¥•±‘=‰©•ÑÌèÁ…É…µÌ¹™¥•±‘=‰©•ÑÌ°(€€€€€Á…É•¹ÐèÑ¡¥Ì°(€€€€€•±•µ•¹ÑÌè¹Õ±°(€€€ôì(€€€™½È€¡½¹ÍÐ‘…Ñ„½˜…¹¹½Ñ…Ñ¥½¹Ì¤ì(€€€€€¥˜€¡‘…Ñ„¹¹½!Q50¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€½¹ÍÐ¥ÍA½ÁÕÁ¹¹½Ñ…Ñ¥½¸€ô‘…Ñ„¹…¹¹½Ñ…Ñ¥½¹QåÁ”€ôôô¹¹½Ñ…Ñ¥½¹QåÁ”¹A=AU@ì(€€€€€¥˜€ …¥ÍA½ÁÕÁ¹¹½Ñ…Ñ¥½¸¤ì(€€€€€€€¥˜€¡‘…Ñ„¹É•ÑlÉt€ôôô‘…Ñ„¹É•ÑlÁtñð‘…Ñ„¹É•ÑlÍt€ôôô‘…Ñ„¹É•ÑlÅt¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€ô•±Í”ì(€€€€€€€½¹ÍÐ•±•µ•¹ÑÌ€ôÁ½ÁÕÁQ½±•µ•¹ÑÌ¹•Ð¡‘…Ñ„¹¥¤ì(€€€€€€€¥˜€ …•±•µ•¹ÑÌ¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€¥˜€ …Ñ¡¥Ì¹}½µµ•¹Ñ5…¹…•È¤ì(€€€€€€€€€Á½ÁÕÁ¹¹½Ñ…Ñ¥½¹Ì¹ÁÕÍ ¡‘…Ñ„¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€•±•µ•¹ÑA…É…µÌ¹•±•µ•¹ÑÌ€ô•±•µ•¹ÑÌì(€€€€€ô(€€€€€•±•µ•¹ÑA…É…µÌ¹‘…Ñ„€ô‘…Ñ„ì(€€€€€½¹ÍÐ•±•µ•¹Ð€ô¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ…Ñ½Éä¹É•…Ñ”¡•±•µ•¹ÑA…É…µÌ¤ì(€€€€€¥˜€ …•±•µ•¹Ð¹¥ÍI•¹‘•É…‰±”¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€¥˜€ …¥ÍA½ÁÕÁ¹¹½Ñ…Ñ¥½¸¤ì(€€€€€€€Ñ¡¥Ì¸•±•µ•¹ÑÌ¹ÁÕÍ ¡•±•µ•¹Ð¤ì(€€€€€€€¥˜€¡‘…Ñ„¹Á½ÁÕÁI•˜¤ì(€€€€€€€€€Á½ÁÕÁQ½±•µ•¹ÑÌ¹•Ñ=É%¹Í•ÉÑ½µÁÕÑ•¡‘…Ñ„¹Á½ÁÕÁI•˜°µ…­•ÉÈ¤¹ÁÕÍ ¡•±•µ•¹Ð¤ì(€€€€€€€ô(€€€€€ô(€€€€€½¹ÍÐÉ•¹‘•É•€ô•±•µ•¹Ð¹É•¹‘•È ¤ì(€€€€€¥˜€¡‘…Ñ„¹¡¥‘‘•¸¤ì(€€€€€€€É•¹‘•É•¹ÍÑå±”¹Ù¥Í¥‰¥±¥Ñä€ô€‰¡¥‘‘•¸ˆì(€€€€€ô(€€€€€•±•µ•¹Ð¹ÕÁ‘…Ñ•=¡½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¤ì(€€€€€¥˜€¡•±•µ•¹Ð¹}¥Í‘¥Ñ…‰±”¤ì(€€€€€€€Ñ¡¥Ì¸•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì¹Í•Ð¡•±•µ•¹Ð¹‘…Ñ„¹¥°•±•µ•¹Ð¤ì(€€€€€€€Ñ¡¥Ì¹}…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•Èü¹É•¹‘•É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡•±•µ•¹Ð¤ì(€€€€€ô(€€€ô(€€€…Ý…¥ÐÑ¡¥Ì¸…‘‘±•µ•¹ÑÍQ½=4 ¤ì(€€€™½È€¡½¹ÍÐ‘…Ñ„½˜Á½ÁÕÁ¹¹½Ñ…Ñ¥½¹Ì¤ì(€€€€€½¹ÍÐ•±•µ•¹ÑÌ€ô•±•µ•¹ÑA…É…µÌ¹•±•µ•¹ÑÌ€ôÁ½ÁÕÁQ½±•µ•¹ÑÌ¹•Ð¡‘…Ñ„¹¥¤ì(€€€€€•±•µ•¹ÑA…É…µÌ¹‘…Ñ„€ô‘…Ñ„ì(€€€€€½¹ÍÐ•±•µ•¹Ð€ô¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ…Ñ½Éä¹É•…Ñ”¡•±•µ•¹ÑA…É…µÌ¤ì(€€€€€¥˜€ …•±•µ•¹Ð¹¥ÍI•¹‘•É…‰±”¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€½¹ÍÐÉ•¹‘•É•€ô•±•µ•¹Ð¹É•¹‘•È ¤ì(€€€€€•±•µ•¹Ð¹½¹Ñ•¹Ñ±•µ•¹Ð¹¥€ô€‘í¹¹½Ñ…Ñ¥½¹AÉ•™¥áô‘í‘…Ñ„¹¥‘õ€ì(€€€€€¥˜€¡‘…Ñ„¹¡¥‘‘•¸¤ì(€€€€€€€É•¹‘•É•¹ÍÑå±”¹Ù¥Í¥‰¥±¥Ñä€ô€‰¡¥‘‘•¸ˆì(€€€€€ô(€€€€€•±•µ•¹ÑÌ¹…Ð ´Ä¤¹½¹Ñ…¥¹•È¹…™Ñ•È¡É•¹‘•É•¤ì(€€€ô(€€€Ñ¡¥Ì¸Í•Ñ¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À ¤ì(€ô(€…Íå¹Œ€…‘‘±•µ•¹ÑÍQ½=4 ¤ì(€€€¥˜€¡Ñ¡¥Ì¸•±•µ•¹ÑÌ¹±•¹Ñ €ôôô€À¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹‘¥Ø¹É•Á±…•¡¥±‘É•¸ ¤ì(€€€½¹ÍÐÁÉ½µ¥Í•Ì€ômtì(€€€¥˜€ …Ñ¡¥Ì¸¡…ÍÉ¥…ÑÑÉ¥‰ÕÑ•ÍÉ½µMÑÉÕÑQÉ•”¤ì(€€€€€Ñ¡¥Ì¸¡…ÍÉ¥…ÑÑÉ¥‰ÕÑ•ÍÉ½µMÑÉÕÑQÉ•”€ôÑÉÕ”ì(€€€€€™½È€¡½¹ÍÐì(€€€€€€€½¹Ñ•¹Ñ±•µ•¹Ð°(€€€€€€€‘…Ñ„èì(€€€€€€€€€¡¥‘‘•¸°(€€€€€€€€€¥°(€€€€€€€€€½Œ(€€€€€€€ô(€€€€€ô½˜Ñ¡¥Ì¸•±•µ•¹ÑÌ¤ì(€€€€€€€½¹ÍÐ…¹¹½Ñ…Ñ¥½¹%€ô½¹Ñ•¹Ñ±•µ•¹Ð¹¥€ô€‘í¹¹½Ñ…Ñ¥½¹AÉ•™¥áô‘í¥‘õ€ì(€€€€€€€½¹ÍÐ•¹…‰±•1¥¹­=Ý¹•ÉÍ¡¥À€ô½¹Ñ•¹Ñ±•µ•¹Ð¹±½…±9…µ”€ôôô€‰„ˆ€˜˜€…¡¥‘‘•¸€˜˜€…½Œì(€€€€€€€ÁÉ½µ¥Í•Ì¹ÁÕÍ ¡Ñ¡¥Ì¸ÍÑÉÕÑQÉ••1…å•Èü¹•ÑÉ¥…ÑÑÉ¥‰ÕÑ•Ì¡…¹¹½Ñ…Ñ¥½¹%°ì(€€€€€€€€€•¹…‰±•1¥¹­=Ý¹•ÉÍ¡¥À(€€€€€€€ô¤¹Ñ¡•¸¡…É¥…ÑÑÉ¥‰ÕÑ•Ì€ôøì(€€€€€€€€€¥˜€¡…É¥…ÑÑÉ¥‰ÕÑ•Ì¤ì(€€€€€€€€€€€™½È€¡½¹ÍÐm­•ä°Ù…±Õ•t½˜…É¥…ÑÑÉ¥‰ÕÑ•Ì¤ì(€€€€€€€€€€€€€½¹Ñ•¹Ñ±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ”¡­•ä°Ù…±Õ”¤ì(€€€€€€€€€€€ô(€€€€€€€€€ô(€€€€€€€ô¤¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¸•±•µ•¹ÑÌ¹Í½ÉÐ ¡ì(€€€€€‘…Ñ„èì(€€€€€€€É•Ðèm„À°„Ä°„È°„Ít(€€€€€ô(€€€ô°ì(€€€€€‘…Ñ„èì(€€€€€€€É•ÐèmˆÀ°ˆÄ°ˆÈ°ˆÍt(€€€€€ô(€€€ô¤€ôøì(€€€€€¥˜€¡„À€ôôô„È€˜˜„Ä€ôôô„Ì¤ì(€€€€€€€É•ÑÕÉ¸€¬Äì(€€€€€ô(€€€€€¥˜€¡ˆÀ€ôôôˆÈ€˜˜ˆÄ€ôôôˆÌ¤ì(€€€€€€€É•ÑÕÉ¸€´Äì(€€€€€ô(€€€€€½¹ÍÐÑ½ÀÄ€ô„Ìì(€€€€€½¹ÍÐ‰½ÐÄ€ô„Äì(€€€€€½¹ÍÐµ¥Ä€ô€¡„Ä€¬„Ì¤€¼€Èì(€€€€€½¹ÍÐÑ½ÀÈ€ôˆÌì(€€€€€½¹ÍÐ‰½ÐÈ€ôˆÄì(€€€€€½¹ÍÐµ¥È€ô€¡ˆÄ€¬ˆÌ¤€¼€Èì(€€€€€¥˜€¡µ¥Ä€øôÑ½ÀÈ€˜˜µ¥È€ðô‰½ÐÄ¤ì(€€€€€€€É•ÑÕÉ¸€´Äì(€€€€€ô(€€€€€¥˜€¡µ¥È€øôÑ½ÀÄ€˜˜µ¥Ä€ðô‰½ÐÈ¤ì(€€€€€€€É•ÑÕÉ¸€¬Äì(€€€€€ô(€€€€€½¹ÍÐ•¹Ñ•É`Ä€ô€¡„À€¬„È¤€¼€Èì(€€€€€½¹ÍÐ•¹Ñ•É`È€ô€¡ˆÀ€¬ˆÈ¤€¼€Èì(€€€€€É•ÑÕÉ¸•¹Ñ•É`Ä€´•¹Ñ•É`Èì(€€€ô¤ì(€€€½¹ÍÐ™É…µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•½Õµ•¹ÑÉ…µ•¹Ð ¤ì(€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¸•±•µ•¹ÑÌ¤ì(€€€€€™É…µ•¹Ð¹…ÁÁ•¹¡•±•µ•¹Ð¹½¹Ñ…¥¹•È¤ì(€€€€€¥˜€¡Ñ¡¥Ì¹}½µµ•¹Ñ5…¹…•È¤ì(€€€€€€€€¡•±•µ•¹Ð¹•áÑÉ…A½ÁÕÁ±•µ•¹Ðü¹Á½ÁÕÀñð•±•µ•¹Ð¹Á½ÁÕÀ¤ü¹É•¹‘•É½µµ•¹Ñ	ÕÑÑ½¸ ¤ì(€€€€€ô•±Í”¥˜€¡•±•µ•¹Ð¹•áÑÉ…A½ÁÕÁ±•µ•¹Ð¤ì(€€€€€€€™É…µ•¹Ð¹…ÁÁ•¹¡•±•µ•¹Ð¹•áÑÉ…A½ÁÕÁ±•µ•¹Ð¹É•¹‘•È ¤¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¹‘¥Ø¹…ÁÁ•¹¡™É…µ•¹Ð¤ì(€€€…Ý…¥ÐAÉ½µ¥Í”¹…±°¡ÁÉ½µ¥Í•Ì¤ì(€€€¥˜€¡Ñ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•È¤ì(€€€€€½¹ÍÐ…¹¹½Ñ…Ñ¥½¹%‘Ì€ô…Ý…¥ÐÑ¡¥Ì¸ÍÑÉÕÑQÉ••1…å•Èü¹•Ñ¹¹½Ñ…Ñ¥½¹%‘Ì ¤ì(€€€€€™½È€¡½¹ÍÐì(€€€€€€€½¹Ñ•¹Ñ±•µ•¹Ð(€€€€€ô½˜Ñ¡¥Ì¸•±•µ•¹ÑÌ¤ì(€€€€€€€¥˜€¡…¹¹½Ñ…Ñ¥½¹%‘Ìü¹¡…Ì¡½¹Ñ•¹Ñ±•µ•¹Ð¹¥¤¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•È¹…‘‘A½¥¹Ñ•É%¹Q•áÑ1…å•È¡½¹Ñ•¹Ñ±•µ•¹Ð°™…±Í”¤ì(€€€€€ô(€€€ô(€ô(€…Íå¹Œ…‘‘1¥¹­¹¹½Ñ…Ñ¥½¹Ì¡…¹¹½Ñ…Ñ¥½¹Ì¤ì(€€€½¹ÍÐ•±•µ•¹ÑA…É…µÌ€ôì(€€€€€‘…Ñ„è¹Õ±°°(€€€€€±…å•ÈèÑ¡¥Ì¹‘¥Ø°(€€€€€±¥¹­M•ÉÙ¥”èÑ¡¥Ì¸±¥¹­M•ÉÙ¥”°(€€€€€ÍÙ…Ñ½Éäè¹•Ü=5MY…Ñ½Éä ¤°(€€€€€Á…É•¹ÐèÑ¡¥Ì(€€€ôì(€€€™½È€¡½¹ÍÐ‘…Ñ„½˜…¹¹½Ñ…Ñ¥½¹Ì¤ì(€€€€€‘…Ñ„¹‰½É‘•ÉMÑå±”ñðô¹¹½Ñ…Ñ¥½¹1…å•È¹}‘•™…Õ±Ñ	½É‘•ÉMÑå±”ì(€€€€€•±•µ•¹ÑA…É…µÌ¹‘…Ñ„€ô‘…Ñ„ì(€€€€€½¹ÍÐ•±•µ•¹Ð€ô¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ…Ñ½Éä¹É•…Ñ”¡•±•µ•¹ÑA…É…µÌ¤ì(€€€€€¥˜€ …•±•µ•¹Ð¹¥ÍI•¹‘•É…‰±”¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€•±•µ•¹Ð¹É•¹‘•È ¤ì(€€€€€•±•µ•¹Ð¹½¹Ñ•¹Ñ±•µ•¹Ð¹¥€ô€‘í¹¹½Ñ…Ñ¥½¹AÉ•™¥áô‘í‘…Ñ„¹¥‘õ€ì(€€€€€Ñ¡¥Ì¸•±•µ•¹ÑÌ¹ÁÕÍ ¡•±•µ•¹Ð¤ì(€€€ô(€€€…Ý…¥ÐÑ¡¥Ì¸…‘‘±•µ•¹ÑÍQ½=4 ¤ì(€ô(€ÕÁ‘…Ñ”¡ì(€€€Ù¥•ÝÁ½ÉÐ°(€€€½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ(€ô¤ì(€€€½¹ÍÐ±…å•È€ôÑ¡¥Ì¹‘¥Øì(€€€Ñ¡¥Ì¹Ù¥•ÝÁ½ÉÐ€ôÙ¥•ÝÁ½ÉÐì(€€€Í•Ñ1…å•É¥µ•¹Í¥½¹Ì¡±…å•È°ì(€€€€€É½Ñ…Ñ¥½¸èÙ¥•ÝÁ½ÉÐ¹É½Ñ…Ñ¥½¸(€€€ô¤ì(€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¸•±•µ•¹ÑÌ¤ì(€€€€€•±•µ•¹Ð¹ÕÁ‘…Ñ•=¡½ÁÑ¥½¹…±½¹Ñ•¹Ñ½¹™¥œ¤ì(€€€ô(€€€Ñ¡¥Ì¸Í•Ñ¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À ¤ì(€€€±…å•È¹¡¥‘‘•¸€ô™…±Í”ì(€ô(€‘•ÍÑÉ½ä ¤ì(€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜Ñ¡¥Ì¸•±•µ•¹ÑÌ¤ì(€€€€€•±•µ•¹Ð¹‘•ÍÑÉ½äü¸ ¤ì(€€€€€Ñ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•Èü¹É•µ½Ù•A½¥¹Ñ•É%¹Q•áÑ1…å•È¡•±•µ•¹Ð¹½¹Ñ•¹Ñ±•µ•¹Ð¤ì(€€€ô(€€€Ñ¡¥Ì¸•±•µ•¹ÑÌ¹±•¹Ñ €ô€Àì(€€€Ñ¡¥Ì¸•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì¹±•…È ¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹É•Á±…•¡¥±‘É•¸ ¤ì(€ô(€€Í•Ñ¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À ¤ì(€€€¥˜€ …Ñ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ±…å•È€ôÑ¡¥Ì¹‘¥Øì(€€€™½È€¡½¹ÍÐm¥°…¹Ù…Ít½˜Ñ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À¤ì(€€€€€½¹ÍÐ•±•µ•¹Ð€ô±…å•È¹ÅÕ•ÉåM•±•Ñ½È¡m‘…Ñ„µ…¹¹½Ñ…Ñ¥½¸µ¥ôˆ‘í¥‘ô‰u€¤ì(€€€€€¥˜€ …•±•µ•¹Ð¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€¥˜€¡ÉÉ…ä¹¥ÍÉÉ…ä¡…¹Ù…Ì¤¤ì(€€€€€€€™½È€¡½¹ÍÐÙÌ½˜…¹Ù…Ì¤ì(€€€€€€€€€ÙÌ¹±…ÍÍ9…µ”€ô€‰…¹¹½Ñ…Ñ¥½¹½¹Ñ•¹Ðˆì(€€€€€€€€€ÙÌ¹…É¥…!¥‘‘•¸€ôÑÉÕ”ì(€€€€€€€ô(€€€€€ô•±Í”ì(€€€€€€€…¹Ù…Ì¹±…ÍÍ9…µ”€ô€‰…¹¹½Ñ…Ñ¥½¹½¹Ñ•¹Ðˆì(€€€€€€€…¹Ù…Ì¹…É¥…!¥‘‘•¸€ôÑÉÕ”ì(€€€€€ô(€€€€€½¹ÍÐÑ½I•µ½Ù”€ômtì(€€€€€™½È€¡½¹ÍÐ¡¥±½˜•±•µ•¹Ð¹¡¥±‘É•¸¤ì(€€€€€€€¥˜€¡¡¥±¹¹½‘•9…µ”€ôôô€‰9YLˆ¤ì(€€€€€€€€€Ñ½I•µ½Ù”¹ÁÕÍ ¡¡¥±¤ì(€€€€€€€ô(€€€€€ô(€€€€€™½È€¡½¹ÍÐ¡¥±½˜Ñ½I•µ½Ù”¤ì(€€€€€€€¡¥±¹É•µ½Ù” ¤ì(€€€€€ô(€€€€€½¹ÍÐ™¥ÉÍÑ…¹Ù…Ì€ôÉÉ…ä¹¥ÍÉÉ…ä¡…¹Ù…Ì¤€ü…¹Ù…ÍlÁt€è…¹Ù…Ìì(€€€€€½¹ÍÐì(€€€€€€€™¥ÉÍÑ¡¥±(€€€€€ô€ô•±•µ•¹Ðì(€€€€€¥˜€ …™¥ÉÍÑ¡¥±¤ì(€€€€€€€•±•µ•¹Ð¹…ÁÁ•¹¡™¥ÉÍÑ…¹Ù…Ì¤ì(€€€€€ô•±Í”¥˜€ …™¥ÉÍÑ¡¥±¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰…¹¹½Ñ…Ñ¥½¹½¹Ñ•¹Ðˆ¤¤ì(€€€€€€€™¥ÉÍÑ¡¥±¹‰•™½É”¡™¥ÉÍÑ…¹Ù…Ì¤ì(€€€€€ô•±Í”ì(€€€€€€€™¥ÉÍÑ¡¥±¹…™Ñ•È¡™¥ÉÍÑ…¹Ù…Ì¤ì(€€€€€ô(€€€€€¥˜€¡ÉÉ…ä¹¥ÍÉÉ…ä¡…¹Ù…Ì¤¤ì(€€€€€€€±•Ð±…ÍÑ…¹Ù…Ì€ô™¥ÉÍÑ…¹Ù…Ìì(€€€€€€€™½È€¡±•Ð¤€ô€Ä°¥¤€ô…¹Ù…Ì¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€€€€€±…ÍÑ…¹Ù…Ì¹…™Ñ•È¡…¹Ù…Ím¥t¤ì(€€€€€€€€€±…ÍÑ…¹Ù…Ì€ô…¹Ù…Ím¥tì(€€€€€€€ô(€€€€€ô(€€€€€Ñ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À¹‘•±•Ñ”¡¥¤ì(€€€€€½¹ÍÐ•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸€ôÑ¡¥Ì¸•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì¹•Ð¡¥¤ì(€€€€€¥˜€ …•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€¥˜€¡•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸¹}¡…Í9½…¹Ù…Ì¤ì(€€€€€€€Ñ¡¥Ì¹}…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•Èü¹Í•Ñ5¥ÍÍ¥¹…¹Ù…Ì¡¥°•±•µ•¹Ð¹¥°…¹Ù…Ì¤ì(€€€€€€€•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸¹}¡…Í9½…¹Ù…Ì€ô™…±Í”ì(€€€€€ô•±Í”ì(€€€€€€€•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸¹…¹Ù…Ì€ô…¹Ù…Ìì(€€€€€ô(€€€ô(€ô(€É•™É•Í¡…¹Ù…Í•Ì ¤ì(€€€Ñ¡¥Ì¸Í•Ñ¹¹½Ñ…Ñ¥½¹…¹Ù…Í5…À ¤ì(€ô(€•Ñ‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì¹Ù…±Õ•Ì ¤ì(€ô(€•Ñ‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸¡¥¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸•‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì¹•Ð¡¥¤ì(€ô(€…‘‘…­•¹¹½Ñ…Ñ¥½¸¡•‘¥Ñ½È¤ì(€€€½¹ÍÐì(€€€€€‘¥Ø(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐì(€€€€€¥°(€€€€€É½Ñ…Ñ¥½¸(€€€ô€ô•‘¥Ñ½Èì(€€€½¹ÍÐ•±•µ•¹Ð€ô¹•Ü‘¥Ñ½É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡ì(€€€€€‘…Ñ„èì(€€€€€€€¥°(€€€€€€€É•Ðè•‘¥Ñ½È¹•ÑAI•Ð ¤°(€€€€€€€É½Ñ…Ñ¥½¸(€€€€€ô°(€€€€€•‘¥Ñ½È°(€€€€€±…å•Èè‘¥Ø°(€€€€€Á…É•¹ÐèÑ¡¥Ì°(€€€€€•¹…‰±•½µµ•¹Ðè€„…Ñ¡¥Ì¹}½µµ•¹Ñ5…¹…•È°(€€€€€±¥¹­M•ÉÙ¥”èÑ¡¥Ì¸±¥¹­M•ÉÙ¥”°(€€€€€…¹¹½Ñ…Ñ¥½¹MÑ½É…”èÑ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹MÑ½É…”(€€€ô¤ì(€€€•±•µ•¹Ð¹É•¹‘•È ¤ì(€€€•±•µ•¹Ð¹½¹Ñ•¹Ñ±•µ•¹Ð¹¥€ô€‘í¹¹½Ñ…Ñ¥½¹AÉ•™¥áô‘í¥‘õ€ì(€€€•±•µ•¹Ð¹É•…Ñ•=ÉUÁ‘…Ñ•A½ÁÕÀ ¤ì(€€€Ñ¡¥Ì¸•±•µ•¹ÑÌ¹ÁÕÍ ¡•±•µ•¹Ð¤ì(€€€É•ÑÕÉ¸•±•µ•¹Ðì(€ô(€É•µ½Ù•¹¹½Ñ…Ñ¥½¸¡¥¤ì(€€€½¹ÍÐ¥¹‘•à€ôÑ¡¥Ì¸•±•µ•¹ÑÌ¹™¥¹‘%¹‘•à¡•°€ôø•°¹‘…Ñ„¹¥€ôôô¥¤ì(€€€¥˜€¡¥¹‘•à€ð€À¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐm•±•µ•¹Ñt€ôÑ¡¥Ì¸•±•µ•¹ÑÌ¹ÍÁ±¥”¡¥¹‘•à°€Ä¤ì(€€€Ñ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•Èü¹É•µ½Ù•A½¥¹Ñ•É%¹Q•áÑ1…å•È¡•±•µ•¹Ð¹½¹Ñ•¹Ñ±•µ•¹Ð¤ì(€ô(€ÕÁ‘…Ñ•…­•¹¹½Ñ…Ñ¥½¹Ì¡•‘¥Ñ½ÉÌ¤ì(€€€¥˜€¡•‘¥Ñ½ÉÌ¹±•¹Ñ €ôôô€À¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€™½È€¡½¹ÍÐ•‘¥Ñ½È½˜•‘¥Ñ½ÉÌ¤ì(€€€€€•‘¥Ñ½È¹ÕÁ‘…Ñ•…­•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡Ñ¡¥Ì¤ì(€€€ô(€€€Ñ¡¥Ì¸…‘‘±•µ•¹ÑÍQ½=4 ¤ì(€ô(€Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡•¹…‰±•€ô™…±Í”¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰‘¥Í…‰±•ˆ°€…•¹…‰±•¤ì(€ô(€ÍÑ…Ñ¥Œ•Ð}‘•™…Õ±Ñ	½É‘•ÉMÑå±” ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰}‘•™…Õ±Ñ	½É‘•ÉMÑå±”ˆ°=‰©•Ð¹™É••é”¡ì(€€€€€Ý¥‘Ñ è€Ä°(€€€€€É…Ý]¥‘Ñ è€Ä°(€€€€€ÍÑå±”è¹¹½Ñ…Ñ¥½¹	½É‘•ÉMÑå±•QåÁ”¹M=1%°(€€€€€‘…Í¡ÉÉ…äèlÍt°(€€€€€¡½É¥é½¹Ñ…±½É¹•ÉI…‘¥ÕÌè€À°(€€€€€Ù•ÉÑ¥…±½É¹•ÉI…‘¥ÕÌè€À(€€€ô¤¤ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½™É••Ñ•áÐ¹©Ì((((()½¹ÍÐ=1}AQQI8€ô€½qÉq¸ýñq¸½œì)±…ÍÌÉ••Q•áÑ‘¥Ñ½È•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹‘¥Ñ½Èì(€€½¹Ñ•¹Ð€ô€ˆˆì(€€•‘¥Ñ½É¥Ù%€ô€‘íÑ¡¥Ì¹¥‘ôµ•‘¥Ñ½É€ì(€€•‘¥Ñ5½‘•€ô¹Õ±°ì(€€™½¹ÑM¥é”ì(€}½±½ÉA¥­•È€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ}™É••Q•áÑ•™…Õ±Ñ½¹Ñ•¹Ð€ô€ˆˆì(€ÍÑ…Ñ¥Œ}¥¹Ñ•É¹…±A…‘‘¥¹œ€ô€Àì(€ÍÑ…Ñ¥Œ}‘•™…Õ±Ñ½±½È€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ}‘•™…Õ±Ñ½¹ÑM¥é”€ô€ÄÀì(€ÍÑ…Ñ¥Œ•Ð}­•å‰½…É‘5…¹…•È ¤ì(€€€½¹ÍÐÁÉ½Ñ¼€ôÉ••Q•áÑ‘¥Ñ½È¹ÁÉ½Ñ½ÑåÁ”ì(€€€½¹ÍÐ…ÉÉ½Ý¡•­•È€ôÍ•±˜€ôøÍ•±˜¹¥ÍµÁÑä ¤ì(€€€½¹ÍÐÍµ…±°€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•È¹QI9M1Q}M510ì(€€€½¹ÍÐ‰¥œ€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•È¹QI9M1Q}	%ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰}­•å‰½…É‘5…¹…•Èˆ°¹•Ü-•å‰½…É‘5…¹…•È¡mml‰ÑÉ°­Ìˆ°€‰µ…Œ­µ•Ñ„­Ìˆ°€‰ÑÉ°­Àˆ°€‰µ…Œ­µ•Ñ„­À‰t°ÁÉ½Ñ¼¹½µµ¥Ñ=ÉI•µ½Ù”°ì(€€€€€‰Õ‰‰±•ÌèÑÉÕ”(€€€õt°ml‰ÑÉ°­¹Ñ•Èˆ°€‰µ…Œ­µ•Ñ„­¹Ñ•È‰t°ÁÉ½Ñ¼¹½µµ¥Ñ=ÉI•µ½Ù•t°ml‰Í…Á”‰t°ÁÉ½Ñ¼¹½µµ¥Ñ=ÉI•µ½Ù•t°ml‰ÉÉ½Ý1•™Ð‰t°ÁÉ½Ñ¼¹}ÑÉ…¹Í±…Ñ•µÁÑä°ì(€€€€€…ÉÌèlµÍµ…±°°€Át°(€€€€€¡•­•Èè…ÉÉ½Ý¡•­•È(€€€õt°ml‰ÑÉ°­ÉÉ½Ý1•™Ðˆ°€‰µ…Œ­Í¡¥™Ð­ÉÉ½Ý1•™Ð‰t°ÁÉ½Ñ¼¹}ÑÉ…¹Í±…Ñ•µÁÑä°ì(€€€€€…ÉÌèlµ‰¥œ°€Át°(€€€€€¡•­•Èè…ÉÉ½Ý¡•­•È(€€€õt°ml‰ÉÉ½ÝI¥¡Ð‰t°ÁÉ½Ñ¼¹}ÑÉ…¹Í±…Ñ•µÁÑä°ì(€€€€€…ÉÌèmÍµ…±°°€Át°(€€€€€¡•­•Èè…ÉÉ½Ý¡•­•È(€€€õt°ml‰ÑÉ°­ÉÉ½ÝI¥¡Ðˆ°€‰µ…Œ­Í¡¥™Ð­ÉÉ½ÝI¥¡Ð‰t°ÁÉ½Ñ¼¹}ÑÉ…¹Í±…Ñ•µÁÑä°ì(€€€€€…ÉÌèm‰¥œ°€Át°(€€€€€¡•­•Èè…ÉÉ½Ý¡•­•È(€€€õt°ml‰ÉÉ½ÝUÀ‰t°ÁÉ½Ñ¼¹}ÑÉ…¹Í±…Ñ•µÁÑä°ì(€€€€€…ÉÌèlÀ°€µÍµ…±±t°(€€€€€¡•­•Èè…ÉÉ½Ý¡•­•È(€€€õt°ml‰ÑÉ°­ÉÉ½ÝUÀˆ°€‰µ…Œ­Í¡¥™Ð­ÉÉ½ÝUÀ‰t°ÁÉ½Ñ¼¹}ÑÉ…¹Í±…Ñ•µÁÑä°ì(€€€€€…ÉÌèlÀ°€µ‰¥t°(€€€€€¡•­•Èè…ÉÉ½Ý¡•­•È(€€€õt°ml‰ÉÉ½Ý½Ý¸‰t°ÁÉ½Ñ¼¹}ÑÉ…¹Í±…Ñ•µÁÑä°ì(€€€€€…ÉÌèlÀ°Íµ…±±t°(€€€€€¡•­•Èè…ÉÉ½Ý¡•­•È(€€€õt°ml‰ÑÉ°­ÉÉ½Ý½Ý¸ˆ°€‰µ…Œ­Í¡¥™Ð­ÉÉ½Ý½Ý¸‰t°ÁÉ½Ñ¼¹}ÑÉ…¹Í±…Ñ•µÁÑä°ì(€€€€€…ÉÌèlÀ°‰¥t°(€€€€€¡•­•Èè…ÉÉ½Ý¡•­•È(€€€õut¤¤ì(€ô(€ÍÑ…Ñ¥Œ}ÑåÁ”€ô€‰™É••Ñ•áÐˆì(€ÍÑ…Ñ¥Œ}•‘¥Ñ½ÉQåÁ”€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹IQaPì(€½¹ÍÑÉÕÑ½È¡Á…É…µÌ¤ì(€€€ÍÕÁ•È¡ì(€€€€€€¸¸¹Á…É…µÌ°(€€€€€¹…µ”è€‰™É••Q•áÑ‘¥Ñ½Èˆ(€€€ô¤ì(€€€Ñ¡¥Ì¹½±½È€ôÁ…É…µÌ¹½±½ÈñðÉ••Q•áÑ‘¥Ñ½È¹}‘•™…Õ±Ñ½±½Èñð¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}‘•™…Õ±Ñ1¥¹•½±½Èì(€€€Ñ¡¥Ì¸™½¹ÑM¥é”€ôÁ…É…µÌ¹™½¹ÑM¥é”ñðÉ••Q•áÑ‘¥Ñ½È¹}‘•™…Õ±Ñ½¹ÑM¥é”ì(€€€¥˜€ …Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹„ÄÅå±•ÉÐ¡¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}°ÄÁ¹±•ÉÐ¹™É••Ñ•áÐ¤ì(€€€ô(€€€Ñ¡¥Ì¹…¹‘‘½µµ•¹Ð€ô™…±Í”ì(€ô(€ÍÑ…Ñ¥Œ¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€½¹ÍÐÍÑå±”€ô•Ñ½µÁÕÑ•‘MÑå±”¡‘½Õµ•¹Ð¹‘½Õµ•¹Ñ±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¹}¥¹Ñ•É¹…±A…‘‘¥¹œ€ôÁ…ÉÍ•±½…Ð¡ÍÑå±”¹•ÑAÉ½Á•ÉÑåY…±Õ” ˆ´µ™É••Ñ•áÐµÁ…‘‘¥¹œˆ¤¤ì(€ô(€ÍÑ…Ñ¥ŒÕÁ‘…Ñ••™…Õ±ÑA…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€€€ÍÝ¥Ñ €¡ÑåÁ”¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}M%iè(€€€€€€€É••Q•áÑ‘¥Ñ½È¹}‘•™…Õ±Ñ½¹ÑM¥é”€ôÙ…±Õ”ì(€€€€€€€‰É•…¬ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}=1=Hè(€€€€€€€É••Q•áÑ‘¥Ñ½È¹}‘•™…Õ±Ñ½±½È€ôÙ…±Õ”ì(€€€€€€€‰É•…¬ì(€€€ô(€ô(€ÕÁ‘…Ñ•A…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€€€ÍÝ¥Ñ €¡ÑåÁ”¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}M%iè(€€€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•½¹ÑM¥é”¡Ù…±Õ”¤ì(€€€€€€€‰É•…¬ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}=1=Hè(€€€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•½±½È¡Ù…±Õ”¤ì(€€€€€€€‰É•…¬ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ•Ð‘•™…Õ±ÑAÉ½Á•ÉÑ¥•ÍQ½UÁ‘…Ñ” ¤ì(€€€É•ÑÕÉ¸mm¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}M%i°É••Q•áÑ‘¥Ñ½È¹}‘•™…Õ±Ñ½¹ÑM¥é•t°m¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}=1=H°É••Q•áÑ‘¥Ñ½È¹}‘•™…Õ±Ñ½±½Èñð¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}‘•™…Õ±Ñ1¥¹•½±½Éutì(€ô(€•ÐÁÉ½Á•ÉÑ¥•ÍQ½UÁ‘…Ñ” ¤ì(€€€É•ÑÕÉ¸mm¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}M%i°Ñ¡¥Ì¸™½¹ÑM¥é•t°m¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}=1=H°Ñ¡¥Ì¹½±½Éutì(€ô(€•ÐÑ½½±‰…É	ÕÑÑ½¹Ì ¤ì(€€€Ñ¡¥Ì¹}½±½ÉA¥­•Èñðô¹•Ü	…Í¥½±½ÉA¥­•È¡Ñ¡¥Ì¤ì(€€€É•ÑÕÉ¸ml‰½±½ÉA¥­•Èˆ°Ñ¡¥Ì¹}½±½ÉA¥­•Éutì(€ô(€•Ð½±½ÉQåÁ” ¤ì(€€€É•ÑÕÉ¸¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}=1=Hì(€ô(€€ÕÁ‘…Ñ•½¹ÑM¥é”¡™½¹ÑM¥é”¤ì(€€€½¹ÍÐÍ•Ñ½¹ÑÍ¥é”€ôÍ¥é”€ôøì(€€€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹ÍÑå±”¹™½¹ÑM¥é”€ô…±Œ ‘íÍ¥é•õÁà€¨Ù…È ´µÑ½Ñ…°µÍ…±”µ™…Ñ½È¤¥€ì(€€€€€Ñ¡¥Ì¹ÑÉ…¹Í±…Ñ” À°€´¡Í¥é”€´Ñ¡¥Ì¸™½¹ÑM¥é”¤€¨Ñ¡¥Ì¹Á…É•¹ÑM…±”¤ì(€€€€€Ñ¡¥Ì¸™½¹ÑM¥é”€ôÍ¥é”ì(€€€€€Ñ¡¥Ì¸Í•Ñ‘¥Ñ½É¥µ•¹Í¥½¹Ì ¤ì(€€€ôì(€€€½¹ÍÐÍ…Ù•‘½¹ÑÍ¥é”€ôÑ¡¥Ì¸™½¹ÑM¥é”ì(€€€Ñ¡¥Ì¹…‘‘½µµ…¹‘Ì¡ì(€€€€€µèÍ•Ñ½¹ÑÍ¥é”¹‰¥¹¡Ñ¡¥Ì°™½¹ÑM¥é”¤°(€€€€€Õ¹‘¼èÍ•Ñ½¹ÑÍ¥é”¹‰¥¹¡Ñ¡¥Ì°Í…Ù•‘½¹ÑÍ¥é”¤°(€€€€€Á½ÍÐèÑ¡¥Ì¹}Õ¥5…¹…•È¹ÕÁ‘…Ñ•U$¹‰¥¹¡Ñ¡¥Ì¹}Õ¥5…¹…•È°Ñ¡¥Ì¤°(€€€€€µÕÍÑá•ŒèÑÉÕ”°(€€€€€ÑåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}M%i°(€€€€€½Ù•ÉÝÉ¥Ñ•%™M…µ•QåÁ”èÑÉÕ”°(€€€€€­••ÁU¹‘¼èÑÉÕ”(€€€ô¤ì(€ô(€½¹UÁ‘…Ñ•‘½±½È ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹ÍÑå±”¹½±½È€ôÑ¡¥Ì¹½±½Èì(€€€Ñ¡¥Ì¹}½±½ÉA¥­•Èü¹ÕÁ‘…Ñ”¡Ñ¡¥Ì¹½±½È¤ì(€€€ÍÕÁ•È¹½¹UÁ‘…Ñ•‘½±½È ¤ì(€ô(€€ÕÁ‘…Ñ•½±½È¡½±½È¤ì(€€€½¹ÍÐÍ•Ñ½±½È€ô½°€ôøì(€€€€€Ñ¡¥Ì¹½±½È€ô½°ì(€€€€€Ñ¡¥Ì¹½¹UÁ‘…Ñ•‘½±½È ¤ì(€€€ôì(€€€½¹ÍÐÍ…Ù•‘½±½È€ôÑ¡¥Ì¹½±½Èì(€€€Ñ¡¥Ì¹…‘‘½µµ…¹‘Ì¡ì(€€€€€µèÍ•Ñ½±½È¹‰¥¹¡Ñ¡¥Ì°½±½È¤°(€€€€€Õ¹‘¼èÍ•Ñ½±½È¹‰¥¹¡Ñ¡¥Ì°Í…Ù•‘½±½È¤°(€€€€€Á½ÍÐèÑ¡¥Ì¹}Õ¥5…¹…•È¹ÕÁ‘…Ñ•U$¹‰¥¹¡Ñ¡¥Ì¹}Õ¥5…¹…•È°Ñ¡¥Ì¤°(€€€€€µÕÍÑá•ŒèÑÉÕ”°(€€€€€ÑåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹IQaQ}=1=H°(€€€€€½Ù•ÉÝÉ¥Ñ•%™M…µ•QåÁ”èÑÉÕ”°(€€€€€­••ÁU¹‘¼èÑÉÕ”(€€€ô¤ì(€ô(€}ÑÉ…¹Í±…Ñ•µÁÑä¡à°ä¤ì(€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹ÑÉ…¹Í±…Ñ•M•±•Ñ•‘‘¥Ñ½ÉÌ¡à°ä°ÑÉÕ”¤ì(€ô(€•Ñ%¹¥Ñ¥…±QÉ…¹Í±…Ñ¥½¸ ¤ì(€€€½¹ÍÐÍ…±”€ôÑ¡¥Ì¹Á…É•¹ÑM…±”ì(€€€É•ÑÕÉ¸lµÉ••Q•áÑ‘¥Ñ½È¹}¥¹Ñ•É¹…±A…‘‘¥¹œ€¨Í…±”°€´¡É••Q•áÑ‘¥Ñ½È¹}¥¹Ñ•É¹…±A…‘‘¥¹œ€¬Ñ¡¥Ì¸™½¹ÑM¥é”¤€¨Í…±•tì(€ô(€É•‰Õ¥± ¤ì(€€€¥˜€ …Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹É•‰Õ¥± ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¹¥ÍÑÑ…¡•‘Q½=4¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹…‘¡Ñ¡¥Ì¤ì(€€€ô(€ô(€•¹…‰±•‘¥Ñ5½‘” ¤ì(€€€¥˜€ …ÍÕÁ•È¹•¹…‰±•‘¥Ñ5½‘” ¤¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ô(€€€Ñ¡¥Ì¹½Ù•É±…å¥Ø¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ‰•¹…‰±•ˆ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹½¹Ñ•¹Ñ‘¥Ñ…‰±”€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹}¥ÍÉ……‰±”€ô™…±Í”ì(€€€Ñ¡¥Ì¹‘¥Ø¹É•µ½Ù•ÑÑÉ¥‰ÕÑ” ‰…É¥„µ…Ñ¥Ù•‘•Í•¹‘…¹Ðˆ¤ì(€€€Ñ¡¥Ì¸•‘¥Ñ5½‘•€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€½¹ÍÐÍ¥¹…°€ôÑ¡¥Ì¹}Õ¥5…¹…•È¹½µ‰¥¹•‘M¥¹…°¡Ñ¡¥Ì¸•‘¥Ñ5½‘•¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¹•‘¥Ñ½É¥Ù-•å‘½Ý¸¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰™½ÕÌˆ°Ñ¡¥Ì¹•‘¥Ñ½É¥Ù½ÕÌ¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‰±ÕÈˆ°Ñ¡¥Ì¹•‘¥Ñ½É¥Ù	±ÕÈ¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¥¹ÁÕÐˆ°Ñ¡¥Ì¹•‘¥Ñ½É¥Ù%¹ÁÕÐ¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á…ÍÑ”ˆ°Ñ¡¥Ì¹•‘¥Ñ½É¥ÙA…ÍÑ”¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€‘¥Í…‰±•‘¥Ñ5½‘” ¤ì(€€€¥˜€ …ÍÕÁ•È¹‘¥Í…‰±•‘¥Ñ5½‘” ¤¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ô(€€€Ñ¡¥Ì¹½Ù•É±…å¥Ø¹±…ÍÍ1¥ÍÐ¹…‘ ‰•¹…‰±•ˆ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹½¹Ñ•¹Ñ‘¥Ñ…‰±”€ô™…±Í”ì(€€€Ñ¡¥Ì¹‘¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µ…Ñ¥Ù•‘•Í•¹‘…¹Ðˆ°Ñ¡¥Ì¸•‘¥Ñ½É¥Ù%¤ì(€€€Ñ¡¥Ì¹}¥ÍÉ……‰±”€ôÑÉÕ”ì(€€€Ñ¡¥Ì¸•‘¥Ñ5½‘•ü¹…‰½ÉÐ ¤ì(€€€Ñ¡¥Ì¸•‘¥Ñ5½‘•€ô¹Õ±°ì(€€€Ñ¡¥Ì¹‘¥Ø¹™½ÕÌ¡ì(€€€€€ÁÉ•Ù•¹ÑMÉ½±°èÑÉÕ”(€€€ô¤ì(€€€Ñ¡¥Ì¹¥Í‘¥Ñ¥¹œ€ô™…±Í”ì(€€€Ñ¡¥Ì¹Á…É•¹Ð¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹…‘ ‰™É••Ñ•áÑ‘¥Ñ¥¹œˆ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€™½ÕÍ¥¸¡•Ù•¹Ð¤ì(€€€¥˜€ …Ñ¡¥Ì¹}™½ÕÍÙ•¹ÑÍ±±½Ý•¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹™½ÕÍ¥¸¡•Ù•¹Ð¤ì(€€€¥˜€¡•Ù•¹Ð¹Ñ…É•Ð€„ôôÑ¡¥Ì¹•‘¥Ñ½É¥Ø¤ì(€€€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹™½ÕÌ ¤ì(€€€ô(€ô(€½¹•‘‘•¡™½ÕÌ¤ì(€€€¥˜€¡Ñ¡¥Ì¹Ý¥‘Ñ ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹•¹…‰±•‘¥Ñ5½‘” ¤ì(€€€¥˜€¡™½ÕÌ¤ì(€€€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹™½ÕÌ ¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹}¥¹¥Ñ¥…±=ÁÑ¥½¹Ìü¹¥Í•¹Ñ•É•¤ì(€€€€€Ñ¡¥Ì¹•¹Ñ•È ¤ì(€€€ô(€€€Ñ¡¥Ì¹}¥¹¥Ñ¥…±=ÁÑ¥½¹Ì€ô¹Õ±°ì(€ô(€¥ÍµÁÑä ¤ì(€€€É•ÑÕÉ¸€…Ñ¡¥Ì¹•‘¥Ñ½É¥ØñðÑ¡¥Ì¹•‘¥Ñ½É¥Ø¹¥¹¹•ÉQ•áÐ¹ÑÉ¥´ ¤€ôôô€ˆˆì(€ô(€É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¹¥Í‘¥Ñ¥¹œ€ô™…±Í”ì(€€€¥˜€¡Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹Í•Ñ‘¥Ñ¥¹MÑ…Ñ”¡ÑÉÕ”¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹…‘ ‰™É••Ñ•áÑ‘¥Ñ¥¹œˆ¤ì(€€€ô(€€€ÍÕÁ•È¹É•µ½Ù” ¤ì(€ô(€€•áÑÉ…ÑQ•áÐ ¤ì(€€€½¹ÍÐ‰Õ™™•È€ômtì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹¹½Éµ…±¥é” ¤ì(€€€±•ÐÁÉ•Ù¡¥±€ô¹Õ±°ì(€€€™½È€¡½¹ÍÐ¡¥±½˜Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹¡¥±‘9½‘•Ì¤ì(€€€€€¥˜€¡ÁÉ•Ù¡¥±ü¹¹½‘•QåÁ”€ôôô9½‘”¹QaQ}9=€˜˜¡¥±¹¹½‘•9…µ”€ôôô€‰	Hˆ¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€‰Õ™™•È¹ÁÕÍ ¡É••Q•áÑ‘¥Ñ½È¸•Ñ9½‘•½¹Ñ•¹Ð¡¡¥±¤¤ì(€€€€€ÁÉ•Ù¡¥±€ô¡¥±ì(€€€ô(€€€É•ÑÕÉ¸‰Õ™™•È¹©½¥¸ ‰q¸ˆ¤ì(€ô(€€Í•Ñ‘¥Ñ½É¥µ•¹Í¥½¹Ì ¤ì(€€€½¹ÍÐmÁ…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ñt€ôÑ¡¥Ì¹Á…É•¹Ñ¥µ•¹Í¥½¹Ìì(€€€±•ÐÉ•Ðì(€€€¥˜€¡Ñ¡¥Ì¹¥ÍÑÑ…¡•‘Q½=4¤ì(€€€€€É•Ð€ôÑ¡¥Ì¹‘¥Ø¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€€€ô•±Í”ì(€€€€€½¹ÍÐì(€€€€€€€ÕÉÉ•¹Ñ1…å•È°(€€€€€€€‘¥Ø(€€€€€ô€ôÑ¡¥Ìì(€€€€€½¹ÍÐÍ…Ù•‘¥ÍÁ±…ä€ô‘¥Ø¹ÍÑå±”¹‘¥ÍÁ±…äì(€€€€€½¹ÍÐÍ…Ù•‘Y¥Í¥‰¥±¥Ñä€ô‘¥Ø¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰¡¥‘‘•¸ˆ¤ì(€€€€€‘¥Ø¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ‰¡¥‘‘•¸ˆ¤ì(€€€€€‘¥Ø¹ÍÑå±”¹‘¥ÍÁ±…ä€ô€‰¡¥‘‘•¸ˆì(€€€€€ÕÉÉ•¹Ñ1…å•È¹‘¥Ø¹…ÁÁ•¹¡Ñ¡¥Ì¹‘¥Ø¤ì(€€€€€É•Ð€ô‘¥Ø¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€€€€€‘¥Ø¹É•µ½Ù” ¤ì(€€€€€‘¥Ø¹ÍÑå±”¹‘¥ÍÁ±…ä€ôÍ…Ù•‘¥ÍÁ±…äì(€€€€€‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰¡¥‘‘•¸ˆ°Í…Ù•‘Y¥Í¥‰¥±¥Ñä¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹É½Ñ…Ñ¥½¸€”€ÄàÀ€ôôôÑ¡¥Ì¹Á…É•¹ÑI½Ñ…Ñ¥½¸€”€ÄàÀ¤ì(€€€€€Ñ¡¥Ì¹Ý¥‘Ñ €ôÉ•Ð¹Ý¥‘Ñ €¼Á…É•¹Ñ]¥‘Ñ ì(€€€€€Ñ¡¥Ì¹¡•¥¡Ð€ôÉ•Ð¹¡•¥¡Ð€¼Á…É•¹Ñ!•¥¡Ðì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹Ý¥‘Ñ €ôÉ•Ð¹¡•¥¡Ð€¼Á…É•¹Ñ]¥‘Ñ ì(€€€€€Ñ¡¥Ì¹¡•¥¡Ð€ôÉ•Ð¹Ý¥‘Ñ €¼Á…É•¹Ñ!•¥¡Ðì(€€€ô(€€€Ñ¡¥Ì¹™¥á¹‘M•ÑA½Í¥Ñ¥½¸ ¤ì(€ô(€½µµ¥Ð ¤ì(€€€¥˜€ …Ñ¡¥Ì¹¥Í%¹‘¥Ñ5½‘” ¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹½µµ¥Ð ¤ì(€€€Ñ¡¥Ì¹‘¥Í…‰±•‘¥Ñ5½‘” ¤ì(€€€½¹ÍÐÍ…Ù•‘Q•áÐ€ôÑ¡¥Ì¸½¹Ñ•¹Ðì(€€€½¹ÍÐ¹•ÝQ•áÐ€ôÑ¡¥Ì¸½¹Ñ•¹Ð€ôÑ¡¥Ì¸•áÑÉ…ÑQ•áÐ ¤¹ÑÉ¥µ¹ ¤ì(€€€¥˜€¡Í…Ù•‘Q•áÐ€ôôô¹•ÝQ•áÐ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÍ•ÑQ•áÐ€ôÑ•áÐ€ôøì(€€€€€Ñ¡¥Ì¸½¹Ñ•¹Ð€ôÑ•áÐì(€€€€€¥˜€ …Ñ•áÐ¤ì(€€€€€€€Ñ¡¥Ì¹É•µ½Ù” ¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€Ñ¡¥Ì¸Í•Ñ½¹Ñ•¹Ð ¤ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹É•‰Õ¥±¡Ñ¡¥Ì¤ì(€€€€€Ñ¡¥Ì¸Í•Ñ‘¥Ñ½É¥µ•¹Í¥½¹Ì ¤ì(€€€ôì(€€€Ñ¡¥Ì¹…‘‘½µµ…¹‘Ì¡ì(€€€€€µè€ ¤€ôøì(€€€€€€€Í•ÑQ•áÐ¡¹•ÝQ•áÐ¤ì(€€€€€ô°(€€€€€Õ¹‘¼è€ ¤€ôøì(€€€€€€€Í•ÑQ•áÐ¡Í…Ù•‘Q•áÐ¤ì(€€€€€ô°(€€€€€µÕÍÑá•Œè™…±Í”(€€€ô¤ì(€€€Ñ¡¥Ì¸Í•Ñ‘¥Ñ½É¥µ•¹Í¥½¹Ì ¤ì(€ô(€Í¡½Õ±‘•Ñ-•å‰½…É‘Ù•¹ÑÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹¥Í%¹‘¥Ñ5½‘” ¤ì(€ô(€•¹Ñ•É%¹‘¥Ñ5½‘” ¤ì(€€€Ñ¡¥Ì¹•¹…‰±•‘¥Ñ5½‘” ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹™½ÕÌ ¤ì(€ô(€­•å‘½Ý¸¡•Ù•¹Ð¤ì(€€€¥˜€¡•Ù•¹Ð¹Ñ…É•Ð€ôôôÑ¡¥Ì¹‘¥Ø€˜˜•Ù•¹Ð¹­•ä€ôôô€‰¹Ñ•Èˆ¤ì(€€€€€Ñ¡¥Ì¹•¹Ñ•É%¹‘¥Ñ5½‘” ¤ì(€€€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€ô(€ô(€•‘¥Ñ½É¥Ù-•å‘½Ý¸¡•Ù•¹Ð¤ì(€€€É••Q•áÑ‘¥Ñ½È¹}­•å‰½…É‘5…¹…•È¹•á•Œ¡Ñ¡¥Ì°•Ù•¹Ð¤ì(€ô(€•‘¥Ñ½É¥Ù½ÕÌ¡•Ù•¹Ð¤ì(€€€Ñ¡¥Ì¹¥Í‘¥Ñ¥¹œ€ôÑÉÕ”ì(€ô(€•‘¥Ñ½É¥Ù	±ÕÈ¡•Ù•¹Ð¤ì(€€€Ñ¡¥Ì¹¥Í‘¥Ñ¥¹œ€ô™…±Í”ì(€ô(€•‘¥Ñ½É¥Ù%¹ÁÕÐ¡•Ù•¹Ð¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ð¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰™É••Ñ•áÑ‘¥Ñ¥¹œˆ°Ñ¡¥Ì¹¥ÍµÁÑä ¤¤ì(€ô(€‘¥Í…‰±•‘¥Ñ¥¹œ ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰É½±”ˆ°€‰½µµ•¹Ðˆ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹É•µ½Ù•ÑÑÉ¥‰ÕÑ” ‰…É¥„µµÕ±Ñ¥±¥¹”ˆ¤ì(€ô(€•¹…‰±•‘¥Ñ¥¹œ ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰É½±”ˆ°€‰Ñ•áÑ‰½àˆ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µµÕ±Ñ¥±¥¹”ˆ°ÑÉÕ”¤ì(€ô(€•Ð…¹¡…¹•½¹Ñ•¹Ð ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Øì(€€€ô(€€€±•Ð‰…Í•`°‰…Í•dì(€€€¥˜€¡Ñ¡¥Ì¹}¥Í½ÁäñðÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€‰…Í•`€ôÑ¡¥Ì¹àì(€€€€€‰…Í•d€ôÑ¡¥Ì¹äì(€€€ô(€€€ÍÕÁ•È¹É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹±…ÍÍ9…µ”€ô€‰¥¹Ñ•É¹…°ˆì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¥ˆ°Ñ¡¥Ì¸•‘¥Ñ½É¥Ù%¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ¥ˆ°€‰Á‘™©Ìµ™É•”µÑ•áÐÈˆ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ…ÑÑÉÌˆ°€‰‘•™…Õ±Ðµ½¹Ñ•¹Ðˆ¤ì(€€€Ñ¡¥Ì¹•¹…‰±•‘¥Ñ¥¹œ ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹½¹Ñ•¹Ñ‘¥Ñ…‰±”€ôÑÉÕ”ì(€€€½¹ÍÐì(€€€€€ÍÑå±”(€€€ô€ôÑ¡¥Ì¹•‘¥Ñ½É¥Øì(€€€ÍÑå±”¹™½¹ÑM¥é”€ô…±Œ ‘íÑ¡¥Ì¸™½¹ÑM¥é•õÁà€¨Ù…È ´µÑ½Ñ…°µÍ…±”µ™…Ñ½È¤¥€ì(€€€ÍÑå±”¹½±½È€ôÑ¡¥Ì¹½±½Èì(€€€Ñ¡¥Ì¹‘¥Ø¹…ÁÁ•¹¡Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¤ì(€€€Ñ¡¥Ì¹½Ù•É±…å¥Ø€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€Ñ¡¥Ì¹½Ù•É±…å¥Ø¹±…ÍÍ1¥ÍÐ¹…‘ ‰½Ù•É±…äˆ°€‰•¹…‰±•ˆ¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹…ÁÁ•¹¡Ñ¡¥Ì¹½Ù•É±…å¥Ø¤ì(€€€¥˜€¡Ñ¡¥Ì¹}¥Í½ÁäñðÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€½¹ÍÐmÁ…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ñt€ôÑ¡¥Ì¹Á…É•¹Ñ¥µ•¹Í¥½¹Ìì(€€€€€¥˜€¡Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€€€½¹ÍÐì(€€€€€€€€€Á½Í¥Ñ¥½¸(€€€€€€€ô€ôÑ¡¥Ì¹}¥¹¥Ñ¥…±…Ñ„ì(€€€€€€€±•ÐmÑà°Ñåt€ôÑ¡¥Ì¹•Ñ%¹¥Ñ¥…±QÉ…¹Í±…Ñ¥½¸ ¤ì(€€€€€€€mÑà°Ñåt€ôÑ¡¥Ì¹Á…•QÉ…¹Í±…Ñ¥½¹Q½MÉ••¸¡Ñà°Ñä¤ì(€€€€€€€½¹ÍÐmÁ…•]¥‘Ñ °Á…•!•¥¡Ñt€ôÑ¡¥Ì¹Á…•¥µ•¹Í¥½¹Ìì(€€€€€€€½¹ÍÐmÁ…•`°Á…•et€ôÑ¡¥Ì¹Á…•QÉ…¹Í±…Ñ¥½¸ì(€€€€€€€±•ÐÁ½Í`°Á½Ídì(€€€€€€€ÍÝ¥Ñ €¡Ñ¡¥Ì¹É½Ñ…Ñ¥½¸¤ì(€€€€€€€€€…Í”€Àè(€€€€€€€€€€€Á½Í`€ô‰…Í•`€¬€¡Á½Í¥Ñ¥½¹lÁt€´Á…•`¤€¼Á…•]¥‘Ñ ì(€€€€€€€€€€€Á½Íd€ô‰…Í•d€¬Ñ¡¥Ì¹¡•¥¡Ð€´€¡Á½Í¥Ñ¥½¹lÅt€´Á…•d¤€¼Á…•!•¥¡Ðì(€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€…Í”€äÀè(€€€€€€€€€€€Á½Í`€ô‰…Í•`€¬€¡Á½Í¥Ñ¥½¹lÁt€´Á…•`¤€¼Á…•]¥‘Ñ ì(€€€€€€€€€€€Á½Íd€ô‰…Í•d€´€¡Á½Í¥Ñ¥½¹lÅt€´Á…•d¤€¼Á…•!•¥¡Ðì(€€€€€€€€€€€mÑà°Ñåt€ômÑä°€µÑátì(€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€…Í”€ÄàÀè(€€€€€€€€€€€Á½Í`€ô‰…Í•`€´Ñ¡¥Ì¹Ý¥‘Ñ €¬€¡Á½Í¥Ñ¥½¹lÁt€´Á…•`¤€¼Á…•]¥‘Ñ ì(€€€€€€€€€€€Á½Íd€ô‰…Í•d€´€¡Á½Í¥Ñ¥½¹lÅt€´Á…•d¤€¼Á…•!•¥¡Ðì(€€€€€€€€€€€mÑà°Ñåt€ôlµÑà°€µÑåtì(€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€…Í”€ÈÜÀè(€€€€€€€€€€€Á½Í`€ô‰…Í•`€¬€¡Á½Í¥Ñ¥½¹lÁt€´Á…•`€´Ñ¡¥Ì¹¡•¥¡Ð€¨Á…•!•¥¡Ð¤€¼Á…•]¥‘Ñ ì(€€€€€€€€€€€Á½Íd€ô‰…Í•d€¬€¡Á½Í¥Ñ¥½¹lÅt€´Á…•d€´Ñ¡¥Ì¹Ý¥‘Ñ €¨Á…•]¥‘Ñ ¤€¼Á…•!•¥¡Ðì(€€€€€€€€€€€mÑà°Ñåt€ôlµÑä°Ñátì(€€€€€€€€€€€‰É•…¬ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¹Í•ÑÐ¡Á½Í`€¨Á…É•¹Ñ]¥‘Ñ °Á½Íd€¨Á…É•¹Ñ!•¥¡Ð°Ñà°Ñä¤ì(€€€€€ô•±Í”ì(€€€€€€€Ñ¡¥Ì¹}µ½Ù•™Ñ•ÉA…ÍÑ”¡‰…Í•`°‰…Í•d¤ì(€€€€€ô(€€€€€Ñ¡¥Ì¸Í•Ñ½¹Ñ•¹Ð ¤ì(€€€€€Ñ¡¥Ì¹}¥ÍÉ……‰±”€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹½¹Ñ•¹Ñ‘¥Ñ…‰±”€ô™…±Í”ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹}¥ÍÉ……‰±”€ô™…±Í”ì(€€€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹½¹Ñ•¹Ñ‘¥Ñ…‰±”€ôÑÉÕ”ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Øì(€ô(€ÍÑ…Ñ¥Œ€•Ñ9½‘•½¹Ñ•¹Ð¡¹½‘”¤ì(€€€É•ÑÕÉ¸€¡¹½‘”¹¹½‘•QåÁ”€ôôô9½‘”¹QaQ}9=€ü¹½‘”¹¹½‘•Y…±Õ”€è¹½‘”¹¥¹¹•ÉQ•áÐ¤¹É•Á±…•±°¡=1}AQQI8°€ˆˆ¤ì(€ô(€•‘¥Ñ½É¥ÙA…ÍÑ”¡•Ù•¹Ð¤ì(€€€½¹ÍÐ±¥Á‰½…É‘…Ñ„€ô•Ù•¹Ð¹±¥Á‰½…É‘…Ñ„ñðÝ¥¹‘½Ü¹±¥Á‰½…É‘…Ñ„ì(€€€½¹ÍÐì(€€€€€ÑåÁ•Ì(€€€ô€ô±¥Á‰½…É‘…Ñ„ì(€€€¥˜€¡ÑåÁ•Ì¹±•¹Ñ €ôôô€Ä€˜˜ÑåÁ•ÍlÁt€ôôô€‰Ñ•áÐ½Á±…¥¸ˆ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€½¹ÍÐÁ…ÍÑ”€ôÉ••Q•áÑ‘¥Ñ½È¸‘•Í•É¥…±¥é•½¹Ñ•¹Ð¡±¥Á‰½…É‘…Ñ„¹•Ñ…Ñ„ ‰Ñ•áÐˆ¤ñð€ˆˆ¤¹É•Á±…•±°¡=1}AQQI8°€‰q¸ˆ¤ì(€€€¥˜€ …Á…ÍÑ”¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÍ•±•Ñ¥½¸€ôÝ¥¹‘½Ü¹•ÑM•±•Ñ¥½¸ ¤ì(€€€¥˜€ …Í•±•Ñ¥½¸¹É…¹•½Õ¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹¹½Éµ…±¥é” ¤ì(€€€Í•±•Ñ¥½¸¹‘•±•Ñ•É½µ½Õµ•¹Ð ¤ì(€€€½¹ÍÐÉ…¹”€ôÍ•±•Ñ¥½¸¹•ÑI…¹•Ð À¤ì(€€€¥˜€ …Á…ÍÑ”¹¥¹±Õ‘•Ì ‰q¸ˆ¤¤ì(€€€€€É…¹”¹¥¹Í•ÉÑ9½‘”¡‘½Õµ•¹Ð¹É•…Ñ•Q•áÑ9½‘”¡Á…ÍÑ”¤¤ì(€€€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹¹½Éµ…±¥é” ¤ì(€€€€€Í•±•Ñ¥½¸¹½±±…ÁÍ•Q½MÑ…ÉÐ ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€ÍÑ…ÉÑ½¹Ñ…¥¹•È°(€€€€€ÍÑ…ÉÑ=™™Í•Ð(€€€ô€ôÉ…¹”ì(€€€½¹ÍÐ‰Õ™™•É	•™½É”€ômtì(€€€½¹ÍÐ‰Õ™™•É™Ñ•È€ômtì(€€€¥˜€¡ÍÑ…ÉÑ½¹Ñ…¥¹•È¹¹½‘•QåÁ”€ôôô9½‘”¹QaQ}9=¤ì(€€€€€½¹ÍÐÁ…É•¹Ð€ôÍÑ…ÉÑ½¹Ñ…¥¹•È¹Á…É•¹Ñ±•µ•¹Ðì(€€€€€‰Õ™™•É™Ñ•È¹ÁÕÍ ¡ÍÑ…ÉÑ½¹Ñ…¥¹•È¹¹½‘•Y…±Õ”¹Í±¥”¡ÍÑ…ÉÑ=™™Í•Ð¤¹É•Á±…•±°¡=1}AQQI8°€ˆˆ¤¤ì(€€€€€¥˜€¡Á…É•¹Ð€„ôôÑ¡¥Ì¹•‘¥Ñ½É¥Ø¤ì(€€€€€€€±•Ð‰Õ™™•È€ô‰Õ™™•É	•™½É”ì(€€€€€€€™½È€¡½¹ÍÐ¡¥±½˜Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹¡¥±‘9½‘•Ì¤ì(€€€€€€€€€¥˜€¡¡¥±€ôôôÁ…É•¹Ð¤ì(€€€€€€€€€€€‰Õ™™•È€ô‰Õ™™•É™Ñ•Èì(€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€ô(€€€€€€€€€‰Õ™™•È¹ÁÕÍ ¡É••Q•áÑ‘¥Ñ½È¸•Ñ9½‘•½¹Ñ•¹Ð¡¡¥±¤¤ì(€€€€€€€ô(€€€€€ô(€€€€€‰Õ™™•É	•™½É”¹ÁÕÍ ¡ÍÑ…ÉÑ½¹Ñ…¥¹•È¹¹½‘•Y…±Õ”¹Í±¥” À°ÍÑ…ÉÑ=™™Í•Ð¤¹É•Á±…•±°¡=1}AQQI8°€ˆˆ¤¤ì(€€€ô•±Í”¥˜€¡ÍÑ…ÉÑ½¹Ñ…¥¹•È€ôôôÑ¡¥Ì¹•‘¥Ñ½É¥Ø¤ì(€€€€€±•Ð‰Õ™™•È€ô‰Õ™™•É	•™½É”ì(€€€€€±•Ð¤€ô€Àì(€€€€€™½È€¡½¹ÍÐ¡¥±½˜Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹¡¥±‘9½‘•Ì¤ì(€€€€€€€¥˜€¡¤¬¬€ôôôÍÑ…ÉÑ=™™Í•Ð¤ì(€€€€€€€€€‰Õ™™•È€ô‰Õ™™•É™Ñ•Èì(€€€€€€€ô(€€€€€€€‰Õ™™•È¹ÁÕÍ ¡É••Q•áÑ‘¥Ñ½È¸•Ñ9½‘•½¹Ñ•¹Ð¡¡¥±¤¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¸½¹Ñ•¹Ð€ô€‘í‰Õ™™•É	•™½É”¹©½¥¸ ‰q¸ˆ¥ô‘íÁ…ÍÑ•ô‘í‰Õ™™•É™Ñ•È¹©½¥¸ ‰q¸ˆ¥õ€ì(€€€Ñ¡¥Ì¸Í•Ñ½¹Ñ•¹Ð ¤ì(€€€½¹ÍÐ¹•ÝI…¹”€ô¹•ÜI…¹” ¤ì(€€€±•Ð‰•™½É•1•¹Ñ €ô5…Ñ ¹ÍÕµAÉ•¥Í”¡‰Õ™™•É	•™½É”¹µ…À¡±¥¹”€ôø±¥¹”¹±•¹Ñ ¤¤ì(€€€™½È€¡½¹ÍÐì(€€€€€™¥ÉÍÑ¡¥±(€€€ô½˜Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹¡¥±‘9½‘•Ì¤ì(€€€€€¥˜€¡™¥ÉÍÑ¡¥±¹¹½‘•QåÁ”€ôôô9½‘”¹QaQ}9=¤ì(€€€€€€€½¹ÍÐ±•¹Ñ €ô™¥ÉÍÑ¡¥±¹¹½‘•Y…±Õ”¹±•¹Ñ ì(€€€€€€€¥˜€¡‰•™½É•1•¹Ñ €ðô±•¹Ñ ¤ì(€€€€€€€€€¹•ÝI…¹”¹Í•ÑMÑ…ÉÐ¡™¥ÉÍÑ¡¥±°‰•™½É•1•¹Ñ ¤ì(€€€€€€€€€¹•ÝI…¹”¹Í•Ñ¹¡™¥ÉÍÑ¡¥±°‰•™½É•1•¹Ñ ¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€ô(€€€€€€€‰•™½É•1•¹Ñ €´ô±•¹Ñ ì(€€€€€ô(€€€ô(€€€Í•±•Ñ¥½¸¹É•µ½Ù•±±I…¹•Ì ¤ì(€€€Í•±•Ñ¥½¸¹…‘‘I…¹”¡¹•ÝI…¹”¤ì(€ô(€€Í•Ñ½¹Ñ•¹Ð ¤ì(€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹É•Á±…•¡¥±‘É•¸ ¤ì(€€€¥˜€ …Ñ¡¥Ì¸½¹Ñ•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€™½È€¡½¹ÍÐ±¥¹”½˜Ñ¡¥Ì¸½¹Ñ•¹Ð¹ÍÁ±¥Ð ‰q¸ˆ¤¤ì(€€€€€½¹ÍÐ‘¥Ø€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€€€‘¥Ø¹…ÁÁ•¹¡±¥¹”€ü‘½Õµ•¹Ð¹É•…Ñ•Q•áÑ9½‘”¡±¥¹”¤€è‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‰Èˆ¤¤ì(€€€€€Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¹…ÁÁ•¹¡‘¥Ø¤ì(€€€ô(€ô(€€Í•É¥…±¥é•½¹Ñ•¹Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½¹Ñ•¹Ð¹É•Á±…•±° ‰qá„Àˆ°€ˆ€ˆ¤ì(€ô(€ÍÑ…Ñ¥Œ€‘•Í•É¥…±¥é•½¹Ñ•¹Ð¡½¹Ñ•¹Ð¤ì(€€€É•ÑÕÉ¸½¹Ñ•¹Ð¹É•Á±…•±° ˆ€ˆ°€‰qá„Àˆ¤ì(€ô(€•Ð½¹Ñ•¹Ñ¥Ø ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹•‘¥Ñ½É¥Øì(€ô(€•ÑAI•Ð ¤ì(€€€½¹ÍÐÁ…‘‘¥¹œ€ôÉ••Q•áÑ‘¥Ñ½È¹}¥¹Ñ•É¹…±A…‘‘¥¹œ€¨Ñ¡¥Ì¹Á…É•¹ÑM…±”ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹•ÑI•Ð¡Á…‘‘¥¹œ°Á…‘‘¥¹œ¤ì(€ô(€ÍÑ…Ñ¥Œ…Íå¹Œ‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€±•Ð¥¹¥Ñ¥…±…Ñ„€ô¹Õ±°ì(€€€¥˜€¡‘…Ñ„¥¹ÍÑ…¹•½˜É••Q•áÑ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤ì(€€€€€½¹ÍÐì(€€€€€€€‘…Ñ„èì(€€€€€€€€€‘•™…Õ±ÑÁÁ•…É…¹•…Ñ„èì(€€€€€€€€€€€™½¹ÑM¥é”°(€€€€€€€€€€€™½¹Ñ½±½È(€€€€€€€€€ô°(€€€€€€€€€É•Ð°(€€€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€€€¥°(€€€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€€€É¥¡Q•áÐ°(€€€€€€€€€½¹Ñ•¹ÑÍ=‰¨°(€€€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€€€ô°(€€€€€€€Ñ•áÑ½¹Ñ•¹Ð°(€€€€€€€Ñ•áÑA½Í¥Ñ¥½¸°(€€€€€€€Á…É•¹Ðèì(€€€€€€€€€Á…”èì(€€€€€€€€€€€Á…•9Õµ‰•È(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô€ô‘…Ñ„ì(€€€€€¥˜€ …Ñ•áÑ½¹Ñ•¹Ðü¹±•¹Ñ ¤ì(€€€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€€€ô(€€€€€¥¹¥Ñ¥…±…Ñ„€ô‘…Ñ„€ôì(€€€€€€€…¹¹½Ñ…Ñ¥½¹QåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹IQaP°(€€€€€€€½±½ÈèÉÉ…ä¹™É½´¡™½¹Ñ½±½È¤°(€€€€€€€™½¹ÑM¥é”°(€€€€€€€Ù…±Õ”èÑ•áÑ½¹Ñ•¹Ð¹©½¥¸ ‰q¸ˆ¤°(€€€€€€€Á½Í¥Ñ¥½¸èÑ•áÑA½Í¥Ñ¥½¸°(€€€€€€€Á…•%¹‘•àèÁ…•9Õµ‰•È€´€Ä°(€€€€€€€É•ÐèÉ•Ð¹Í±¥” À¤°(€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%è¥°(€€€€€€€¥°(€€€€€€€‘•±•Ñ•è™…±Í”°(€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€½µµ•¹Ðè½¹Ñ•¹ÑÍ=‰¨ü¹ÍÑÈñð¹Õ±°°(€€€€€€€É¥¡Q•áÐ°(€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€ôì(€€€ô(€€€½¹ÍÐ•‘¥Ñ½È€ô…Ý…¥ÐÍÕÁ•È¹‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€•‘¥Ñ½È¸™½¹ÑM¥é”€ô‘…Ñ„¹™½¹ÑM¥é”ì(€€€•‘¥Ñ½È¹½±½È€ôUÑ¥°¹µ…­•!•á½±½È ¸¸¹‘…Ñ„¹½±½È¤ì(€€€•‘¥Ñ½È¸½¹Ñ•¹Ð€ôÉ••Q•áÑ‘¥Ñ½È¸‘•Í•É¥…±¥é•½¹Ñ•¹Ð¡‘…Ñ„¹Ù…±Õ”¤ì(€€€•‘¥Ñ½È¹}¥¹¥Ñ¥…±…Ñ„€ô¥¹¥Ñ¥…±…Ñ„ì(€€€¥˜€¡‘…Ñ„¹½µµ•¹Ð¤ì(€€€€€•‘¥Ñ½È¹Í•Ñ½µµ•¹Ñ…Ñ„¡‘…Ñ„¤ì(€€€ô(€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€ô(€Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ€ô™…±Í”¤ì(€€€¥˜€¡Ñ¡¥Ì¹¥ÍµÁÑä ¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹‘•±•Ñ•¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹Í•É¥…±¥é••±•Ñ• ¤ì(€€€ô(€€€½¹ÍÐ½±½È€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}½±½É5…¹…•È¹½¹Ù•ÉÐ¡Ñ¡¥Ì¹¥ÍÑÑ…¡•‘Q½=4€ü•Ñ½µÁÕÑ•‘MÑå±”¡Ñ¡¥Ì¹•‘¥Ñ½É¥Ø¤¹½±½È€èÑ¡¥Ì¹½±½È¤ì(€€€½¹ÍÐÍ•É¥…±¥é•€ô=‰©•Ð¹…ÍÍ¥¸¡ÍÕÁ•È¹Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ¤°ì(€€€€€½±½È°(€€€€€™½¹ÑM¥é”èÑ¡¥Ì¸™½¹ÑM¥é”°(€€€€€Ù…±Õ”èÑ¡¥Ì¸Í•É¥…±¥é•½¹Ñ•¹Ð ¤(€€€ô¤ì(€€€Ñ¡¥Ì¹…‘‘½µµ•¹Ð¡Í•É¥…±¥é•¤ì(€€€¥˜€¡¥Í½É½Áå¥¹œ¤ì(€€€€€Í•É¥…±¥é•¹¥Í½Áä€ôÑÉÕ”ì(€€€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%€˜˜€…Ñ¡¥Ì¸¡…Í±•µ•¹Ñ¡…¹•¡Í•É¥…±¥é•¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€Í•É¥…±¥é•¹¥€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%ì(€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€ô(€€¡…Í±•µ•¹Ñ¡…¹•¡Í•É¥…±¥é•¤ì(€€€½¹ÍÐì(€€€€€Ù…±Õ”°(€€€€€™½¹ÑM¥é”°(€€€€€½±½È°(€€€€€Á…•%¹‘•à(€€€ô€ôÑ¡¥Ì¹}¥¹¥Ñ¥…±…Ñ„ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹¡…Í‘¥Ñ•‘½µµ•¹ÐñðÑ¡¥Ì¹}¡…Í	••¹5½Ù•ñðÍ•É¥…±¥é•¹Ù…±Õ”€„ôôÙ…±Õ”ñðÍ•É¥…±¥é•¹™½¹ÑM¥é”€„ôô™½¹ÑM¥é”ñðÍ•É¥…±¥é•¹½±½È¹Í½µ” ¡Œ°¤¤€ôøŒ€„ôô½±½Ém¥t¤ñðÍ•É¥…±¥é•¹Á…•%¹‘•à€„ôôÁ…•%¹‘•àì(€ô(€É•¹‘•É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¸¤ì(€€€½¹ÍÐ½¹Ñ•¹Ð€ôÍÕÁ•È¹É•¹‘•É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¸¤ì(€€€¥˜€ …½¹Ñ•¹Ð¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€½¹ÍÐì(€€€€€ÍÑå±”(€€€ô€ô½¹Ñ•¹Ðì(€€€ÍÑå±”¹™½¹ÑM¥é”€ô…±Œ ‘íÑ¡¥Ì¸™½¹ÑM¥é•õÁà€¨Ù…È ´µÑ½Ñ…°µÍ…±”µ™…Ñ½È¤¥€ì(€€€ÍÑå±”¹½±½È€ôÑ¡¥Ì¹½±½Èì(€€€½¹Ñ•¹Ð¹É•Á±…•¡¥±‘É•¸ ¤ì(€€€™½È€¡½¹ÍÐ±¥¹”½˜Ñ¡¥Ì¸½¹Ñ•¹Ð¹ÍÁ±¥Ð ‰q¸ˆ¤¤ì(€€€€€½¹ÍÐ‘¥Ø€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€€€‘¥Ø¹…ÁÁ•¹¡±¥¹”€ü‘½Õµ•¹Ð¹É•…Ñ•Q•áÑ9½‘”¡±¥¹”¤€è‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‰Èˆ¤¤ì(€€€€€½¹Ñ•¹Ð¹…ÁÁ•¹¡‘¥Ø¤ì(€€€ô(€€€…¹¹½Ñ…Ñ¥½¸¹ÕÁ‘…Ñ•‘¥Ñ•¡ì(€€€€€É•ÐèÑ¡¥Ì¹•ÑAI•Ð ¤°(€€€€€Á½ÁÕÀèÑ¡¥Ì¹}Õ¥5…¹…•È¹¡…Í½µµ•¹Ñ5…¹…•È ¤ñðÑ¡¥Ì¹¡…Í‘¥Ñ•‘½µµ•¹Ð€üÑ¡¥Ì¹½µµ•¹Ð€èì(€€€€€€€Ñ•áÐèÑ¡¥Ì¸½¹Ñ•¹Ð(€€€€€ô(€€€ô¤ì(€€€É•ÑÕÉ¸½¹Ñ•¹Ðì(€ô(€É•Í•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¸¤ì(€€€ÍÕÁ•È¹É•Í•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¸¤ì(€€€…¹¹½Ñ…Ñ¥½¸¹É•Í•Ñ‘¥Ñ• ¤ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½‘É…Ü¹©Ì(((()±…ÍÌÉ…Ý¥¹=ÁÑ¥½¹Ìì(€€ÍÙAÉ½Á•ÉÑ¥•Ì€ô=‰©•Ð¹É•…Ñ”¡¹Õ±°¤ì(€ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€Ñ¡¥Ím¹…µ•t€ôÙ…±Õ”ì(€€€Ñ¡¥Ì¹ÕÁ‘…Ñ•MYAÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€ô(€ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€¥˜€ …ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€™½È€¡½¹ÍÐm¹…µ”°Ù…±Õ•t½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡ÁÉ½Á•ÉÑ¥•Ì¤¤ì(€€€€€¥˜€ …¹…µ”¹ÍÑ…ÉÑÍ]¥Ñ  ‰|ˆ¤¤ì(€€€€€€€Ñ¡¥Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€€€ô(€€€ô(€ô(€ÕÁ‘…Ñ•MYAÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€Ñ¡¥Ì¸ÍÙAÉ½Á•ÉÑ¥•Ím¹…µ•t€ôÙ…±Õ”ì(€ô(€Ñ½MYAÉ½Á•ÉÑ¥•Ì ¤ì(€€€½¹ÍÐÉ½½Ð€ôÑ¡¥Ì¸ÍÙAÉ½Á•ÉÑ¥•Ìì(€€€Ñ¡¥Ì¸ÍÙAÉ½Á•ÉÑ¥•Ì€ô=‰©•Ð¹É•…Ñ”¡¹Õ±°¤ì(€€€É•ÑÕÉ¸ì(€€€€€É½½Ð(€€€ôì(€ô(€É•Í•Ð ¤ì(€€€Ñ¡¥Ì¸ÍÙAÉ½Á•ÉÑ¥•Ì€ô=‰©•Ð¹É•…Ñ”¡¹Õ±°¤ì(€ô(€ÕÁ‘…Ñ•±°¡½ÁÑ¥½¹Ì€ôÑ¡¥Ì¤ì(€€€Ñ¡¥Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡½ÁÑ¥½¹Ì¤ì(€ô(€±½¹” ¤ì(€€€Õ¹É•…¡…‰±” ‰9½Ð¥µÁ±•µ•¹Ñ•ˆ¤ì(€ô)ô)±…ÍÌÉ…Ý¥¹‘¥Ñ½È•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹‘¥Ñ½Èì(€€¥¹Ñ•É¹…±¥Ø€ô¹Õ±°ì(€€µÕÍÑ	•½µµ¥ÑÑ•ì(€}±¥ÁA…Ñ¡%€ô¹Õ±°ì(€}½±½ÉA¥­•È€ô¹Õ±°ì(€}‘É…Ý%€ô¹Õ±°ì(€}‘É…Ý=ÕÑ±¥¹•Ì€ô¹Õ±°ì(€}™½ÕÍÉ…Ý%€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ}ÕÉÉ•¹ÑÉ…Ý%€ô€´Äì(€ÍÑ…Ñ¥Œ}ÕÉÉ•¹ÑA…É•¹Ð€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€ÕÉÉ•¹ÑÉ…Ü€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€ÕÉÉ•¹ÑÉ…Ý¥¹€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€ÕÉÉ•¹ÑÉ…Ý¥¹=ÁÑ¥½¹Ì€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€ÕÉÉ•¹Ñ±¥ÁA…Ñ¡%€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ}%99I}5I%8€ô€Ìì(€½¹ÍÑÉÕÑ½È¡Á…É…µÌ¤ì(€€€ÍÕÁ•È¡Á…É…µÌ¤ì(€€€Ñ¡¥Ì¸µÕÍÑ	•½µµ¥ÑÑ•€ôÁ…É…µÌ¹µÕÍÑ	•½µµ¥ÑÑ•ñð™…±Í”ì(€€€Ñ¡¥Ì¹}…‘‘=ÕÑ±¥¹•Ì¡Á…É…µÌ¤ì(€ô(€½¹UÁ‘…Ñ•‘½±½È ¤ì(€€€Ñ¡¥Ì¹}½±½ÉA¥­•Èü¹ÕÁ‘…Ñ”¡Ñ¡¥Ì¹½±½È¤ì(€€€ÍÕÁ•È¹½¹UÁ‘…Ñ•‘½±½È ¤ì(€ô(€½¹UÁ‘…Ñ•‘=Á…¥Ñä ¤ì(€€€Ñ¡¥Ì¹}½±½ÉA¥­•Èü¹ÕÁ‘…Ñ•=Á…¥Ñäü¸¡Ñ¡¥Ì¹½Á…¥Ñä¤ì(€ô(€}…‘‘=ÕÑ±¥¹•Ì¡Á…É…µÌ¤ì(€€€¥˜€¡Á…É…µÌ¹‘É…Ý=ÕÑ±¥¹•Ì¤ì(€€€€€Ñ¡¥Ì¸É•…Ñ•É…Ý=ÕÑ±¥¹•Ì¡Á…É…µÌ¤ì(€€€€€Ñ¡¥Ì¸…‘‘Q½É…Ý1…å•È ¤ì(€€€ô(€ô(€€É•…Ñ•É…Ý=ÕÑ±¥¹•Ì¡ì(€€€‘É…Ý=ÕÑ±¥¹•Ì°(€€€‘É…Ý%°(€€€‘É…Ý¥¹=ÁÑ¥½¹Ì°(€€€±¥ÁA…Ñ¡%(€ô¤ì(€€€Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì€ô‘É…Ý=ÕÑ±¥¹•Ìì(€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ìñðô‘É…Ý¥¹=ÁÑ¥½¹Ìì(€€€¥˜€ …Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹„ÄÅå±•ÉÐ¡¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}°ÄÁ¹±•ÉÑmÑ¡¥Ì¹•‘¥Ñ½ÉQåÁ•t¤ì(€€€ô(€€€¥˜€¡‘É…Ý%€øô€À¤ì(€€€€€Ñ¡¥Ì¹}‘É…Ý%€ô‘É…Ý%ì(€€€€€Ñ¡¥Ì¹}±¥ÁA…Ñ¡%€ô±¥ÁA…Ñ¡%€üü¹Õ±°ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹‘É…Ý1…å•È¹™¥¹…±¥é•É…Ü¡‘É…Ý%°‘É…Ý=ÕÑ±¥¹•Ì¹‘•™…Õ±ÑAÉ½Á•ÉÑ¥•Ì¤ì(€€€€€Ñ¡¥Ì¸É•…Ñ•½ÕÍ=ÕÑ±¥¹”¡Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹}‘É…Ý%€ôÑ¡¥Ì¸É•…Ñ•É…Ý¥¹œ¡‘É…Ý=ÕÑ±¥¹•Ì°Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€ô(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•	‰½à¡‘É…Ý=ÕÑ±¥¹•Ì¹‰½à¤ì(€ô(€€É•…Ñ•É…Ý¥¹œ¡‘É…Ý=ÕÑ±¥¹•Ì°Á…É•¹Ð¤ì(€€€½¹ÍÐì(€€€€€¥°(€€€€€±¥ÁA…Ñ¡%(€€€ô€ôÁ…É•¹Ð¹‘É…Ý1…å•È¹‘É…Ü¡É…Ý¥¹‘¥Ñ½È¹}µ•É•MYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì¹Ñ½MYAÉ½Á•ÉÑ¥•Ì ¤°‘É…Ý=ÕÑ±¥¹•Ì¹‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ì¤°™…±Í”°Ñ¡¥Ì¹½¹ÍÑÉÕÑ½È¹}¡…Í±¥ÁA…Ñ ¤ì(€€€¥˜€¡Ñ¡¥Ì¹½¹ÍÑÉÕÑ½È¹}¡…Í±¥ÁA…Ñ ¤ì(€€€€€Ñ¡¥Ì¹}±¥ÁA…Ñ¡%€ô±¥ÁA…Ñ¡%ì(€€€ô(€€€Ñ¡¥Ì¸É•…Ñ•½ÕÍ=ÕÑ±¥¹”¡Á…É•¹Ð¤ì(€€€É•ÑÕÉ¸¥ì(€ô(€€É•…Ñ•½ÕÍ=ÕÑ±¥¹”¡Á…É•¹Ð¤ì(€€€½¹ÍÐÁÉ½Á•ÉÑ¥•Ì€ôÑ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹•Ñ½ÕÍMYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¸É½Ñ…Ñ¥½¹¹±”¤ì(€€€¥˜€¡ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€€€Ñ¡¥Ì¹}™½ÕÍÉ…Ý%€ôÁ…É•¹Ð¹‘É…Ý1…å•È¹‘É…Ý=ÕÑ±¥¹”¡ÁÉ½Á•ÉÑ¥•Ì°Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹™½ÕÍ5ÕÍÑI•µ½Ù•M•±™%¹Ñ•ÉÍ•Ñ¥½¹Ì¤ì(€€€ô(€ô(€€ÕÁ‘…Ñ•½ÕÍ=ÕÑ±¥¹”¡…¹±”€ôÑ¡¥Ì¸É½Ñ…Ñ¥½¹¹±”¤ì(€€€¥˜€¡Ñ¡¥Ì¹}™½ÕÍÉ…Ý%€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}™½ÕÍÉ…Ý%°Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹•Ñ½ÕÍMYAÉ½Á•ÉÑ¥•Ì¡…¹±”¤¤ì(€ô(€€Ñ½±•½ÕÍ=ÕÑ±¥¹•±…ÍÌ¡É½½Ñ±…ÍÌ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}™½ÕÍÉ…Ý%€„ôô¹Õ±°¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}™½ÕÍÉ…Ý%°ì(€€€€€€€É½½Ñ±…ÍÌ(€€€€€ô¤ì(€€€ô(€ô(€€ÕÁ‘…Ñ•Y¥Í¥‰¥±¥Ñä ¤ì(€€€½¹ÍÐì(€€€€€Á…É•¹Ð°(€€€€€}‘É…Ý%°(€€€€€}™½ÕÍÉ…Ý%°(€€€€€}¥ÍY¥Í¥‰±”(€€€ô€ôÑ¡¥Ìì(€€€¥˜€ …Á…É•¹Ðñð}‘É…Ý%€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÉ½½Ñ±…ÍÌ€ôì(€€€€€¡¥‘‘•¸è€…}¥ÍY¥Í¥‰±”(€€€ôì(€€€Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡}‘É…Ý%°ì(€€€€€É½½Ñ±…ÍÌ(€€€ô¤ì(€€€¥˜€¡}™½ÕÍÉ…Ý%€„ôô¹Õ±°¤ì(€€€€€Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡}™½ÕÍÉ…Ý%°ì(€€€€€€€É½½Ñ±…ÍÌ(€€€€€ô¤ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ}µ•É•MYAÉ½Á•ÉÑ¥•Ì¡ÀÄ°ÀÈ¤ì(€€€½¹ÍÐÀÅ-•åÌ€ô¹•ÜM•Ð¡=‰©•Ð¹­•åÌ¡ÀÄ¤¤ì(€€€™½È€¡½¹ÍÐm­•ä°Ù…±Õ•t½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡ÀÈ¤¤ì(€€€€€¥˜€¡ÀÅ-•åÌ¹¡…Ì¡­•ä¤¤ì(€€€€€€€=‰©•Ð¹…ÍÍ¥¸¡ÀÅm­•åt°Ù…±Õ”¤ì(€€€€€ô•±Í”ì(€€€€€€€ÀÅm­•åt€ôÙ…±Õ”ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸ÀÄì(€ô(€ÍÑ…Ñ¥Œ•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¡}½ÁÑ¥½¹Ì¤ì(€€€Õ¹É•…¡…‰±” ‰9½Ð¥µÁ±•µ•¹Ñ•ˆ¤ì(€ô(€ÍÑ…Ñ¥Œ•ÐÑåÁ•Í5…À ¤ì(€€€Õ¹É•…¡…‰±” ‰9½Ð¥µÁ±•µ•¹Ñ•ˆ¤ì(€ô(€ÍÑ…Ñ¥Œ•Ð¥ÍÉ…Ý•È ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€ÍÑ…Ñ¥Œ•Ð}¡…Í±¥ÁA…Ñ  ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€ÍÑ…Ñ¥Œ•Ð}¡…ÍÉ…Ý±…ÍÌ ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€ÍÑ…Ñ¥Œ•ÐÍÕÁÁ½ÉÑ5Õ±Ñ¥Á±•É…Ý¥¹Ì ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€•Ð}‘É…ÝI½Ñ…Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹É½Ñ…Ñ¥½¸ì(€ô(€•Ð}½Á…¥Ñå9…µ” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹½¹ÍÑÉÕÑ½È¹ÑåÁ•Í5…À¹•Ð¡Ñ¡¥Ì¹½Á…¥ÑåQåÁ”¤ì(€ô(€•Ð€É½Ñ…Ñ¥½¹¹±” ¤ì(€€€É•ÑÕÉ¸€¡Ñ¡¥Ì¹Á…É•¹ÑI½Ñ…Ñ¥½¸€´Ñ¡¥Ì¹}‘É…ÝI½Ñ…Ñ¥½¸€¬€ÌØÀ¤€”€ÌØÀì(€ô(€ÍÑ…Ñ¥ŒÕÁ‘…Ñ••™…Õ±ÑA…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€€€½¹ÍÐÁÉ½Á•ÉÑå9…µ”€ôÑ¡¥Ì¹ÑåÁ•Í5…À¹•Ð¡ÑåÁ”¤ì(€€€¥˜€¡ÁÉ½Á•ÉÑå9…µ”¤ì(€€€€€Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡ÁÉ½Á•ÉÑå9…µ”°Ù…±Õ”¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ð¤ì(€€€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡ÁÉ½Á•ÉÑå9…µ”°Ù…±Õ”¤ì(€€€€€Ñ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%°Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹Ñ½MYAÉ½Á•ÉÑ¥•Ì ¤¤ì(€€€ô(€ô(€ÕÁ‘…Ñ•A…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€€€½¹ÍÐÁÉ½Á•ÉÑå9…µ”€ôÑ¡¥Ì¹½¹ÍÑÉÕÑ½È¹ÑåÁ•Í5…À¹•Ð¡ÑåÁ”¤ì(€€€¥˜€¡ÁÉ½Á•ÉÑå9…µ”¤ì(€€€€€Ñ¡¥Ì¹}ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡ÑåÁ”°ÁÉ½Á•ÉÑå9…µ”°Ù…±Õ”¤ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ•Ð‘•™…Õ±ÑAÉ½Á•ÉÑ¥•ÍQ½UÁ‘…Ñ” ¤ì(€€€½¹ÍÐÁÉ½Á•ÉÑ¥•Ì€ômtì(€€€½¹ÍÐ½ÁÑ¥½¹Ì€ôÑ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ìì(€€€™½È€¡½¹ÍÐmÑåÁ”°¹…µ•t½˜Ñ¡¥Ì¹ÑåÁ•Í5…À¤ì(€€€€€ÁÉ½Á•ÉÑ¥•Ì¹ÁÕÍ ¡mÑåÁ”°½ÁÑ¥½¹Ím¹…µ•ut¤ì(€€€ô(€€€É•ÑÕÉ¸ÁÉ½Á•ÉÑ¥•Ìì(€ô(€•ÐÁÉ½Á•ÉÑ¥•ÍQ½UÁ‘…Ñ” ¤ì(€€€½¹ÍÐÁÉ½Á•ÉÑ¥•Ì€ômtì(€€€½¹ÍÐì(€€€€€}‘É…Ý¥¹=ÁÑ¥½¹Ì(€€€ô€ôÑ¡¥Ìì(€€€™½È€¡½¹ÍÐmÑåÁ”°¹…µ•t½˜Ñ¡¥Ì¹½¹ÍÑÉÕÑ½È¹ÑåÁ•Í5…À¤ì(€€€€€ÁÉ½Á•ÉÑ¥•Ì¹ÁÕÍ ¡mÑåÁ”°}‘É…Ý¥¹=ÁÑ¥½¹Ím¹…µ•ut¤ì(€€€ô(€€€É•ÑÕÉ¸ÁÉ½Á•ÉÑ¥•Ìì(€ô(€}ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡ÑåÁ”°¹…µ”°Ù…±Õ”¤ì(€€€½¹ÍÐ½ÁÑ¥½¹Ì€ôÑ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ìì(€€€½¹ÍÐÍ…Ù•‘Y…±Õ”€ô½ÁÑ¥½¹Ím¹…µ•tì(€€€½¹ÍÐÍ•ÑÑ•È€ôÙ…°€ôøì(€€€€€½ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡¹…µ”°Ù…°¤ì(€€€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡¹…µ”°Ù…°¤ì(€€€€€¥˜€¡‰‰½à¤ì(€€€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•	‰½à¡‰‰½à¤ì(€€€€€ô(€€€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°½ÁÑ¥½¹Ì¹Ñ½MYAÉ½Á•ÉÑ¥•Ì ¤¤ì(€€€€€¥˜€¡ÑåÁ”€ôôôÑ¡¥Ì¹½±½ÉQåÁ”¤ì(€€€€€€€Ñ¡¥Ì¹½¹UÁ‘…Ñ•‘½±½È ¤ì(€€€€€ô•±Í”¥˜€¡ÑåÁ”€ôôôÑ¡¥Ì¹½Á…¥ÑåQåÁ”¤ì(€€€€€€€Ñ¡¥Ì¹½¹UÁ‘…Ñ•‘=Á…¥Ñä ¤ì(€€€€€ô(€€€ôì(€€€Ñ¡¥Ì¹…‘‘½µµ…¹‘Ì¡ì(€€€€€µèÍ•ÑÑ•È¹‰¥¹¡Ñ¡¥Ì°Ù…±Õ”¤°(€€€€€Õ¹‘¼èÍ•ÑÑ•È¹‰¥¹¡Ñ¡¥Ì°Í…Ù•‘Y…±Õ”¤°(€€€€€Á½ÍÐèÑ¡¥Ì¹}Õ¥5…¹…•È¹ÕÁ‘…Ñ•U$¹‰¥¹¡Ñ¡¥Ì¹}Õ¥5…¹…•È°Ñ¡¥Ì¤°(€€€€€µÕÍÑá•ŒèÑÉÕ”°(€€€€€ÑåÁ”°(€€€€€½Ù•ÉÝÉ¥Ñ•%™M…µ•QåÁ”èÑÉÕ”°(€€€€€­••ÁU¹‘¼èÑÉÕ”(€€€ô¤ì(€ô(€}ÕÁ‘…Ñ•½±½É¹‘=Á…¥Ñä¡½±½È°½Á…¥Ñä°ÑåÁ”€ôÑ¡¥Ì¹½±½É¹‘=Á…¥ÑåQåÁ”¤ì(€€€½¹ÍÐ½±½É9…µ”€ôÑ¡¥Ì¹½¹ÍÑÉÕÑ½È¹ÑåÁ•Í5…À¹•Ð¡Ñ¡¥Ì¹½±½ÉQåÁ”¤ì(€€€½¹ÍÐ½Á…¥Ñå9…µ”€ôÑ¡¥Ì¹}½Á…¥Ñå9…µ”ì(€€€½¹ÍÐ½ÁÑ¥½¹Ì€ôÑ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ìì(€€€½¹ÍÐÍ…Ù•‘½±½È€ô½ÁÑ¥½¹Ím½±½É9…µ•tì(€€€½¹ÍÐÍ…Ù•‘=Á…¥Ñä€ô½ÁÑ¥½¹Ím½Á…¥Ñå9…µ•tì(€€€½¹ÍÐÍ•ÑÑ•È€ô€¡Œ°½À¤€ôøì(€€€€€½ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡½±½É9…µ”°Œ¤ì(€€€€€½ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡½Á…¥Ñå9…µ”°½À¤ì(€€€€€Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡½±½É9…µ”°Œ¤ì(€€€€€Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡½Á…¥Ñå9…µ”°½À¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°½ÁÑ¥½¹Ì¹Ñ½MYAÉ½Á•ÉÑ¥•Ì ¤¤ì(€€€€€Ñ¡¥Ì¹½¹UÁ‘…Ñ•‘½±½È ¤ì(€€€€€Ñ¡¥Ì¹½¹UÁ‘…Ñ•‘=Á…¥Ñä ¤ì(€€€ôì(€€€Ñ¡¥Ì¹…‘‘½µµ…¹‘Ì¡ì(€€€€€µèÍ•ÑÑ•È¹‰¥¹¡Ñ¡¥Ì°½±½È°½Á…¥Ñä¤°(€€€€€Õ¹‘¼èÍ•ÑÑ•È¹‰¥¹¡Ñ¡¥Ì°Í…Ù•‘½±½È°Í…Ù•‘=Á…¥Ñä¤°(€€€€€Á½ÍÐèÑ¡¥Ì¹}Õ¥5…¹…•È¹ÕÁ‘…Ñ•U$¹‰¥¹¡Ñ¡¥Ì¹}Õ¥5…¹…•È°Ñ¡¥Ì¤°(€€€€€µÕÍÑá•ŒèÑÉÕ”°(€€€€€ÑåÁ”°(€€€€€½Ù•ÉÝÉ¥Ñ•%™M…µ•QåÁ”èÑÉÕ”°(€€€€€­••ÁU¹‘¼èÑÉÕ”(€€€ô¤ì(€ô(€}½¹I•Í¥é¥¹œ ¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°É…Ý¥¹‘¥Ñ½È¹}µ•É•MYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹•ÑA…Ñ¡I•Í¥é¥¹MYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¸½¹Ù•ÉÑQ½É…ÝMÁ…” ¤¤°ì(€€€€€‰‰½àèÑ¡¥Ì¸É½Ñ…Ñ•	½à ¤(€€€ô¤¤ì(€ô(€}½¹I•Í¥é• ¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°É…Ý¥¹‘¥Ñ½È¹}µ•É•MYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹•ÑA…Ñ¡I•Í¥é•‘MYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¸½¹Ù•ÉÑQ½É…ÝMÁ…” ¤¤°ì(€€€€€‰‰½àèÑ¡¥Ì¸É½Ñ…Ñ•	½à ¤(€€€ô¤¤ì(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•½ÕÍ=ÕÑ±¥¹” ¤ì(€ô(€}½¹QÉ…¹Í±…Ñ¥¹œ¡}à°}ä¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°ì(€€€€€‰‰½àèÑ¡¥Ì¸É½Ñ…Ñ•	½à ¤(€€€ô¤ì(€ô(€}½¹QÉ…¹Í±…Ñ• ¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°É…Ý¥¹‘¥Ñ½È¹}µ•É•MYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹•ÑA…Ñ¡QÉ…¹Í±…Ñ•‘MYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¸½¹Ù•ÉÑQ½É…ÝMÁ…” ¤°Ñ¡¥Ì¹Á…É•¹Ñ¥µ•¹Í¥½¹Ì¤°ì(€€€€€‰‰½àèÑ¡¥Ì¸É½Ñ…Ñ•	½à ¤(€€€ô¤¤ì(€ô(€}½¹MÑ…ÉÑÉ…¥¹œ ¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°ì(€€€€€É½½Ñ±…ÍÌèì(€€€€€€€µ½Ù¥¹œèÑÉÕ”(€€€€€ô(€€€ô¤ì(€ô(€}½¹MÑ½ÁÉ…¥¹œ ¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ðü¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°ì(€€€€€É½½Ñ±…ÍÌèì(€€€€€€€µ½Ù¥¹œè™…±Í”(€€€€€ô(€€€ô¤ì(€ô(€•Ð}µÕÍÑ	•¥Í…‰±•‘=¹½µµ¥Ð ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€½µµ¥Ð ¤ì(€€€ÍÕÁ•È¹½µµ¥Ð ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}µÕÍÑ	•¥Í…‰±•‘=¹½µµ¥Ð¤ì(€€€€€Ñ¡¥Ì¹‘¥Í…‰±•‘¥Ñ5½‘” ¤ì(€€€€€Ñ¡¥Ì¹‘¥Í…‰±•‘¥Ñ¥¹œ ¤ì(€€€ô(€ô(€‘¥Í…‰±•‘¥Ñ¥¹œ ¤ì(€€€ÍÕÁ•È¹‘¥Í…‰±•‘¥Ñ¥¹œ ¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰‘¥Í…‰±•ˆ°ÑÉÕ”¤ì(€ô(€•¹…‰±•‘¥Ñ¥¹œ ¤ì(€€€ÍÕÁ•È¹•¹…‰±•‘¥Ñ¥¹œ ¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰‘¥Í…‰±•ˆ°™…±Í”¤ì(€ô(€•Ñ	…Í•QÉ…¹Í±…Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸lÀ°€Átì(€ô(€•Ð¥ÍI•Í¥é…‰±” ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€½¹•‘‘•¡™½ÕÌ¤ì(€€€¥˜€ …Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹…‘‘U¹‘½…‰±•‘¥Ñ½È¡Ñ¡¥Ì¤ì(€€€ô(€€€Ñ¡¥Ì¹}¥ÍÉ……‰±”€ôÑÉÕ”ì(€€€¥˜€¡Ñ¡¥Ì¸µÕÍÑ	•½µµ¥ÑÑ•¤ì(€€€€€Ñ¡¥Ì¸µÕÍÑ	•½µµ¥ÑÑ•€ô™…±Í”ì(€€€€€Ñ¡¥Ì¹½µµ¥Ð ¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹Í•ÑM•±•Ñ•¡Ñ¡¥Ì¤ì(€€€€€¥˜€¡™½ÕÌ€˜˜Ñ¡¥Ì¹¥Í=¹MÉ••¸¤ì(€€€€€€€Ñ¡¥Ì¹‘¥Ø¹™½ÕÌ ¤ì(€€€€€ô(€€€ô(€ô(€É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹É•µ½Ù•M¡½Õ±‘I•Í…±”¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¸±•…¹É…Ý1…å•È ¤ì(€€€ÍÕÁ•È¹É•µ½Ù” ¤ì(€ô(€É•‰Õ¥± ¤ì(€€€¥˜€ …Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹É•‰Õ¥± ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸…‘‘Q½É…Ý1…å•È ¤ì(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•	‰½à¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹‰½à¤ì(€€€¥˜€ …Ñ¡¥Ì¹¥ÍÑÑ…¡•‘Q½=4¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹…‘¡Ñ¡¥Ì¤ì(€€€ô(€ô(€Í•ÑA…É•¹Ð¡Á…É•¹Ð¤ì(€€€±•ÐµÕÍÑ	•M•±•Ñ•€ô™…±Í”ì(€€€¥˜€¡Ñ¡¥Ì¹Á…É•¹Ð€˜˜€…Á…É•¹Ð¤ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹É•µ½Ù•M¡½Õ±‘I•Í…±”¡Ñ¡¥Ì¤ì(€€€€€Ñ¡¥Ì¸±•…¹É…Ý1…å•È ¤ì(€€€ô•±Í”¥˜€¡Á…É•¹Ð¤ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹…‘‘M¡½Õ±‘I•Í…±”¡Ñ¡¥Ì¤ì(€€€€€Ñ¡¥Ì¸…‘‘Q½É…Ý1…å•È¡Á…É•¹Ð¤ì(€€€€€µÕÍÑ	•M•±•Ñ•€ô€…Ñ¡¥Ì¹Á…É•¹Ð€˜˜Ñ¡¥Ì¹‘¥Øü¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰Í•±•Ñ•‘‘¥Ñ½Èˆ¤ì(€€€ô(€€€ÍÕÁ•È¹Í•ÑA…É•¹Ð¡Á…É•¹Ð¤ì(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•Y¥Í¥‰¥±¥Ñä ¤ì(€€€¥˜€¡µÕÍÑ	•M•±•Ñ•¤ì(€€€€€Ñ¡¥Ì¹Í•±•Ð ¤ì(€€€ô(€ô(€€±•…¹É…Ý1…å•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}‘É…Ý%€ôôô¹Õ±°ñð€…Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€‘É…Ý1…å•È(€€€ô€ôÑ¡¥Ì¹Á…É•¹Ðì(€€€‘É…Ý1…å•È¹É•µ½Ù”¡Ñ¡¥Ì¹}‘É…Ý%¤ì(€€€Ñ¡¥Ì¹}‘É…Ý%€ô¹Õ±°ì(€€€¥˜€¡Ñ¡¥Ì¹}™½ÕÍÉ…Ý%€„ôô¹Õ±°¤ì(€€€€€‘É…Ý1…å•È¹É•µ½Ù”¡Ñ¡¥Ì¹}™½ÕÍÉ…Ý%¤ì(€€€€€Ñ¡¥Ì¹}™½ÕÍÉ…Ý%€ô¹Õ±°ì(€€€ô(€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì¹É•Í•Ð ¤ì(€ô(€€…‘‘Q½É…Ý1…å•È¡Á…É•¹Ð€ôÑ¡¥Ì¹Á…É•¹Ð¤ì(€€€¥˜€¡Ñ¡¥Ì¹}‘É…Ý%€„ôô¹Õ±°€˜˜Ñ¡¥Ì¹Á…É•¹Ð€ôôôÁ…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹}‘É…Ý%€„ôô¹Õ±°¤ì(€€€€€½¹ÍÐì(€€€€€€€‘É…Ý1…å•È(€€€€€ô€ôÑ¡¥Ì¹Á…É•¹Ðì(€€€€€‘É…Ý1…å•È¹ÕÁ‘…Ñ•A…É•¹Ð¡Ñ¡¥Ì¹}‘É…Ý%°Á…É•¹Ð¹‘É…Ý1…å•È¤ì(€€€€€¥˜€¡Ñ¡¥Ì¹}™½ÕÍÉ…Ý%€„ôô¹Õ±°¤ì(€€€€€€€‘É…Ý1…å•È¹ÕÁ‘…Ñ•A…É•¹Ð¡Ñ¡¥Ì¹}™½ÕÍÉ…Ý%°Á…É•¹Ð¹‘É…Ý1…å•È¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•±° ¤ì(€€€Ñ¡¥Ì¹}‘É…Ý%€ôÑ¡¥Ì¸É•…Ñ•É…Ý¥¹œ¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì°Á…É•¹Ð¤ì(€€€¥˜€¡Ñ¡¥Ì¹}±¥ÁA…Ñ¡%€˜˜Ñ¡¥Ì¸¥¹Ñ•É¹…±¥Ø¤ì(€€€€€Ñ¡¥Ì¸¥¹Ñ•É¹…±¥Ø¹ÍÑå±”¹±¥ÁA…Ñ €ôÑ¡¥Ì¹}±¥ÁA…Ñ¡%ì(€€€ô(€ô(€€½¹Ù•ÉÑQ½A…É•¹ÑMÁ…”¡mà°ä°Ý¥‘Ñ °¡•¥¡Ñt¤ì(€€€½¹ÍÐì(€€€€€Á…É•¹Ñ¥µ•¹Í¥½¹ÌèmÁ\°Á!t°(€€€€€}‘É…ÝI½Ñ…Ñ¥½¸èÉ½Ñ…Ñ¥½¸(€€€ô€ôÑ¡¥Ìì(€€€ÍÝ¥Ñ €¡É½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€äÀè(€€€€€€€É•ÑÕÉ¸mä°€Ä€´à°Ý¥‘Ñ €¨€¡Á €¼Á\¤°¡•¥¡Ð€¨€¡Á\€¼Á ¥tì(€€€€€…Í”€ÄàÀè(€€€€€€€É•ÑÕÉ¸lÄ€´à°€Ä€´ä°Ý¥‘Ñ °¡•¥¡Ñtì(€€€€€…Í”€ÈÜÀè(€€€€€€€É•ÑÕÉ¸lÄ€´ä°à°Ý¥‘Ñ €¨€¡Á €¼Á\¤°¡•¥¡Ð€¨€¡Á\€¼Á ¥tì(€€€€€‘•™…Õ±Ðè(€€€€€€€É•ÑÕÉ¸mà°ä°Ý¥‘Ñ °¡•¥¡Ñtì(€€€ô(€ô(€€½¹Ù•ÉÑQ½É…ÝMÁ…” ¤ì(€€€½¹ÍÐì(€€€€€à°(€€€€€ä°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð°(€€€€€Á…É•¹Ñ¥µ•¹Í¥½¹ÌèmÁ\°Á!t°(€€€€€}‘É…ÝI½Ñ…Ñ¥½¸èÉ½Ñ…Ñ¥½¸(€€€ô€ôÑ¡¥Ìì(€€€ÍÝ¥Ñ €¡É½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€äÀè(€€€€€€€É•ÑÕÉ¸lÄ€´ä°à°Ý¥‘Ñ €¨€¡Á\€¼Á ¤°¡•¥¡Ð€¨€¡Á €¼Á\¥tì(€€€€€…Í”€ÄàÀè(€€€€€€€É•ÑÕÉ¸lÄ€´à°€Ä€´ä°Ý¥‘Ñ °¡•¥¡Ñtì(€€€€€…Í”€ÈÜÀè(€€€€€€€É•ÑÕÉ¸mä°€Ä€´à°Ý¥‘Ñ €¨€¡Á\€¼Á ¤°¡•¥¡Ð€¨€¡Á €¼Á\¥tì(€€€€€‘•™…Õ±Ðè(€€€€€€€É•ÑÕÉ¸mà°ä°Ý¥‘Ñ °¡•¥¡Ñtì(€€€ô(€ô(€€ÕÁ‘…Ñ•	‰½à¡‰‰½à¤ì(€€€mÑ¡¥Ì¹à°Ñ¡¥Ì¹ä°Ñ¡¥Ì¹Ý¥‘Ñ °Ñ¡¥Ì¹¡•¥¡Ñt€ôÑ¡¥Ì¸½¹Ù•ÉÑQ½A…É•¹ÑMÁ…”¡‰‰½à¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø¤ì(€€€€€Ñ¡¥Ì¹™¥á¹‘M•ÑA½Í¥Ñ¥½¸ ¤ì(€€€€€Ñ¡¥Ì¹Í•Ñ¥µÌ ¤ì(€€€ô(€€€Ñ¡¥Ì¹}½¹I•Í¥é• ¤ì(€ô(€€É½Ñ…Ñ•	½à¡Á…É•¹ÑI½Ñ…Ñ¥½¸€ôÑ¡¥Ì¹Á…É•¹ÑI½Ñ…Ñ¥½¸¤ì(€€€½¹ÍÐì(€€€€€à°(€€€€€ä°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð°(€€€€€}‘É…ÝI½Ñ…Ñ¥½¸èÉ½Ñ…Ñ¥½¸°(€€€€€Á…É•¹Ñ¥µ•¹Í¥½¹ÌèmÁ\°Á!t(€€€ô€ôÑ¡¥Ìì(€€€ÍÝ¥Ñ € ¡É½Ñ…Ñ¥½¸€¨€Ð€¬Á…É•¹ÑI½Ñ…Ñ¥½¸¤€¼€äÀ¤ì(€€€€€…Í”€Äè(€€€€€€€É•ÑÕÉ¸lÄ€´ä€´¡•¥¡Ð°à°¡•¥¡Ð°Ý¥‘Ñ¡tì(€€€€€…Í”€Èè(€€€€€€€É•ÑÕÉ¸lÄ€´à€´Ý¥‘Ñ °€Ä€´ä€´¡•¥¡Ð°Ý¥‘Ñ °¡•¥¡Ñtì(€€€€€…Í”€Ìè(€€€€€€€É•ÑÕÉ¸mä°€Ä€´à€´Ý¥‘Ñ °¡•¥¡Ð°Ý¥‘Ñ¡tì(€€€€€…Í”€Ðè(€€€€€€€É•ÑÕÉ¸mà°ä€´Ý¥‘Ñ €¨€¡Á\€¼Á ¤°¡•¥¡Ð€¨€¡Á €¼Á\¤°Ý¥‘Ñ €¨€¡Á\€¼Á ¥tì(€€€€€…Í”€Ôè(€€€€€€€É•ÑÕÉ¸lÄ€´ä°à°Ý¥‘Ñ €¨€¡Á\€¼Á ¤°¡•¥¡Ð€¨€¡Á €¼Á\¥tì(€€€€€…Í”€Øè(€€€€€€€É•ÑÕÉ¸lÄ€´à€´¡•¥¡Ð€¨€¡Á €¼Á\¤°€Ä€´ä°¡•¥¡Ð€¨€¡Á €¼Á\¤°Ý¥‘Ñ €¨€¡Á\€¼Á ¥tì(€€€€€…Í”€Üè(€€€€€€€É•ÑÕÉ¸mä€´Ý¥‘Ñ €¨€¡Á\€¼Á ¤°€Ä€´à€´¡•¥¡Ð€¨€¡Á €¼Á\¤°Ý¥‘Ñ €¨€¡Á\€¼Á ¤°¡•¥¡Ð€¨€¡Á €¼Á\¥tì(€€€€€…Í”€àè(€€€€€€€É•ÑÕÉ¸mà€´Ý¥‘Ñ °ä€´¡•¥¡Ð°Ý¥‘Ñ °¡•¥¡Ñtì(€€€€€…Í”€äè(€€€€€€€É•ÑÕÉ¸lÄ€´ä°à€´Ý¥‘Ñ °¡•¥¡Ð°Ý¥‘Ñ¡tì(€€€€€…Í”€ÄÀè(€€€€€€€É•ÑÕÉ¸lÄ€´à°€Ä€´ä°Ý¥‘Ñ °¡•¥¡Ñtì(€€€€€…Í”€ÄÄè(€€€€€€€É•ÑÕÉ¸mä€´¡•¥¡Ð°€Ä€´à°¡•¥¡Ð°Ý¥‘Ñ¡tì(€€€€€…Í”€ÄÈè(€€€€€€€É•ÑÕÉ¸mà€´¡•¥¡Ð€¨€¡Á €¼Á\¤°ä°¡•¥¡Ð€¨€¡Á €¼Á\¤°Ý¥‘Ñ €¨€¡Á\€¼Á ¥tì(€€€€€…Í”€ÄÌè(€€€€€€€É•ÑÕÉ¸lÄ€´ä€´Ý¥‘Ñ €¨€¡Á\€¼Á ¤°à€´¡•¥¡Ð€¨€¡Á €¼Á\¤°Ý¥‘Ñ €¨€¡Á\€¼Á ¤°¡•¥¡Ð€¨€¡Á €¼Á\¥tì(€€€€€…Í”€ÄÐè(€€€€€€€É•ÑÕÉ¸lÄ€´à°€Ä€´ä€´Ý¥‘Ñ €¨€¡Á\€¼Á ¤°¡•¥¡Ð€¨€¡Á €¼Á\¤°Ý¥‘Ñ €¨€¡Á\€¼Á ¥tì(€€€€€…Í”€ÄÔè(€€€€€€€É•ÑÕÉ¸mä°€Ä€´à°Ý¥‘Ñ €¨€¡Á\€¼Á ¤°¡•¥¡Ð€¨€¡Á €¼Á\¥tì(€€€€€‘•™…Õ±Ðè(€€€€€€€É•ÑÕÉ¸mà°ä°Ý¥‘Ñ °¡•¥¡Ñtì(€€€ô(€ô(€É½Ñ…Ñ”¡Á…É•¹ÑI½Ñ…Ñ¥½¸€ôÑ¡¥Ì¹Á…É•¹ÑI½Ñ…Ñ¥½¸¤ì(€€€¥˜€ …Ñ¡¥Ì¹Á…É•¹ÐñðÑ¡¥Ì¹}‘É…Ý%€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ…¹±”€ô€¡Á…É•¹ÑI½Ñ…Ñ¥½¸€´Ñ¡¥Ì¹}‘É…ÝI½Ñ…Ñ¥½¸€¬€ÌØÀ¤€”€ÌØÀì(€€€Ñ¡¥Ì¹Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}‘É…Ý%°É…Ý¥¹‘¥Ñ½È¹}µ•É•MYAÉ½Á•ÉÑ¥•Ì¡ì(€€€€€‰‰½àèÑ¡¥Ì¸É½Ñ…Ñ•	½à¡Á…É•¹ÑI½Ñ…Ñ¥½¸¤(€€€ô°Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹ÕÁ‘…Ñ•I½Ñ…Ñ¥½¸¡…¹±”¤¤¤ì(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•½ÕÍ=ÕÑ±¥¹”¡…¹±”¤ì(€ô(€Í¡½Ü¡Ù¥Í¥‰±”€ôÑ¡¥Ì¹}¥ÍY¥Í¥‰±”¤ì(€€€ÍÕÁ•È¹Í¡½Ü¡Ù¥Í¥‰±”¤ì(€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•Y¥Í¥‰¥±¥Ñä ¤ì(€ô(€Í•±•Ð ¤ì(€€€ÍÕÁ•È¹Í•±•Ð ¤ì(€€€Ñ¡¥Ì¸Ñ½±•½ÕÍ=ÕÑ±¥¹•±…ÍÌ¡ì(€€€€€¡½Ù•É•è™…±Í”°(€€€€€Í•±•Ñ•èÑÉÕ”(€€€ô¤ì(€ô(€Õ¹Í•±•Ð ¤ì(€€€ÍÕÁ•È¹Õ¹Í•±•Ð ¤ì(€€€Ñ¡¥Ì¸Ñ½±•½ÕÍ=ÕÑ±¥¹•±…ÍÌ¡ì(€€€€€Í•±•Ñ•è™…±Í”(€€€ô¤ì(€ô(€Á½¥¹Ñ•É½Ù•È ¤ì(€€€¥˜€ …Ñ¡¥Ì¹¥ÍM•±•Ñ•¤ì(€€€€€Ñ¡¥Ì¸Ñ½±•½ÕÍ=ÕÑ±¥¹•±…ÍÌ¡ì(€€€€€€€¡½Ù•É•èÑÉÕ”(€€€€€ô¤ì(€€€ô(€ô(€Á½¥¹Ñ•É±•…Ù” ¤ì(€€€¥˜€ …Ñ¡¥Ì¹¥ÍM•±•Ñ•¤ì(€€€€€Ñ¡¥Ì¸Ñ½±•½ÕÍ=ÕÑ±¥¹•±…ÍÌ¡ì(€€€€€€€¡½Ù•É•è™…±Í”(€€€€€ô¤ì(€€€ô(€ô(€½¹M…±•¡…¹¥¹œ ¤ì(€€€¥˜€ …Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹ÕÁ‘…Ñ•A…É•¹Ñ¥µ•¹Í¥½¹Ì¡Ñ¡¥Ì¹Á…É•¹Ñ¥µ•¹Í¥½¹Ì°Ñ¡¥Ì¹Á…É•¹Ð¹Í…±”¤ì(€€€¥˜€¡‰‰½à¤ì(€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•	‰½à¡‰‰½à¤ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ½¹M…±•¡…¹¥¹]¡•¹É…Ý¥¹œ ¤íô(€É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Øì(€€€ô(€€€±•Ð‰…Í•`°‰…Í•dì(€€€¥˜€¡Ñ¡¥Ì¹}¥Í½Áä¤ì(€€€€€‰…Í•`€ôÑ¡¥Ì¹àì(€€€€€‰…Í•d€ôÑ¡¥Ì¹äì(€€€ô(€€€½¹ÍÐ‘¥Ø€ôÍÕÁ•È¹É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¹½¹ÍÑÉÕÑ½È¹}¡…ÍÉ…Ý±…ÍÌ¤ì(€€€€€‘¥Ø¹±…ÍÍ1¥ÍÐ¹…‘ ‰‘É…Üˆ¤ì(€€€ô(€€€½¹ÍÐ‘É…Ý¥Ø€ôÑ¡¥Ì¸¥¹Ñ•É¹…±¥Ø€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€‘¥Ø¹…ÁÁ•¹¡‘É…Ý¥Ø¤ì(€€€‘É…Ý¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µ¡¥‘‘•¸ˆ°€‰ÑÉÕ”ˆ¤ì(€€€‘É…Ý¥Ø¹±…ÍÍ9…µ”€ô€‰¥¹Ñ•É¹…°ˆì(€€€¥˜€¡Ñ¡¥Ì¹}±¥ÁA…Ñ¡%¤ì(€€€€€‘É…Ý¥Ø¹ÍÑå±”¹±¥ÁA…Ñ €ôÑ¡¥Ì¹}±¥ÁA…Ñ¡%ì(€€€ô(€€€‰¥¹‘Ù•¹ÑÌ¡Ñ¡¥Ì°‘É…Ý¥Ø°l‰Á½¥¹Ñ•É½Ù•Èˆ°€‰Á½¥¹Ñ•É±•…Ù”‰t¤ì(€€€Ñ¡¥Ì¹Í•Ñ¥µÌ ¤ì(€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹…‘‘M¡½Õ±‘I•Í…±”¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹‘¥Í…‰±•‘¥Ñ¥¹œ ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}¥Í½Áä¤ì(€€€€€Ñ¡¥Ì¹}µ½Ù•™Ñ•ÉA…ÍÑ”¡‰…Í•`°‰…Í•d¤ì(€€€ô(€€€É•ÑÕÉ¸‘¥Øì(€ô(€ÍÑ…Ñ¥ŒÉ•…Ñ•É…Ý•É%¹ÍÑ…¹”¡}Á…É…µÌ¤ì(€€€Õ¹É•…¡…‰±” ‰9½Ð¥µÁ±•µ•¹Ñ•ˆ¤ì(€ô(€ÍÑ…Ñ¥Œ}•ÑÉ…Ý¥¹Q…É•Ð¡}Á…É•¹Ð°ì(€€€Ñ…É•Ð(€ô¤ì(€€€É•ÑÕÉ¸Ñ…É•Ðì(€ô(€ÍÑ…Ñ¥Œ}•ÑA½¥¹Ñ•É½½É‘Ì¡ì(€€€½™™Í•Ñ`°(€€€½™™Í•Ñd°(€€€±¥•¹Ñ`°(€€€±¥•¹Ñd(€ô°É•™•É•¹•Ù•¹Ð€ô¹Õ±°¤ì(€€€¥˜€ …É•™•É•¹•Ù•¹Ð¤ì(€€€€€É•ÑÕÉ¸m½™™Í•Ñ`°½™™Í•Ñetì(€€€ô(€€€±•Ð‘•±Ñ…`€ô±¥•¹Ñ`€´É•™•É•¹•Ù•¹Ð¹±¥•¹Ñ`ì(€€€±•Ð‘•±Ñ…d€ô±¥•¹Ñd€´É•™•É•¹•Ù•¹Ð¹±¥•¹Ñdì(€€€ÍÝ¥Ñ €¡Ñ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ð¹Ù¥•ÝÁ½ÉÐ¹É½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€äÀè(€€€€€€€m‘•±Ñ…`°‘•±Ñ…et€ôm‘•±Ñ…d°€µ‘•±Ñ…atì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÄàÀè(€€€€€€€m‘•±Ñ…`°‘•±Ñ…et€ôlµ‘•±Ñ…`°€µ‘•±Ñ…etì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÈÜÀè(€€€€€€€m‘•±Ñ…`°‘•±Ñ…et€ôlµ‘•±Ñ…d°‘•±Ñ…atì(€€€€€€€‰É•…¬ì(€€€ô(€€€É•ÑÕÉ¸mÉ•™•É•¹•Ù•¹Ð¹½™™Í•Ñ`€¬‘•±Ñ…`°É•™•É•¹•Ù•¹Ð¹½™™Í•Ñd€¬‘•±Ñ…etì(€ô(€ÍÑ…Ñ¥Œ}…‘‘É…Ý¥¹1¥ÍÑ•¹•ÉÌ¡}Ñ…É•Ð°}Í¥¹…°¤íô(€ÍÑ…Ñ¥Œ}•¹‘É…Ý¥¹M•ÍÍ¥½¸¡¥Í‰½ÉÑ•€ô™…±Í”¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ð¹•¹‘É…Ý¥¹M•ÍÍ¥½¸¡¥Í‰½ÉÑ•¤ì(€ô(€ÍÑ…Ñ¥ŒÍÑ…ÉÑÉ…Ý¥¹œ¡Á…É•¹Ð°Õ¥5…¹…•È°¥Í1QH°•Ù•¹Ð¤ì(€€€½¹ÍÐì(€€€€€Á½¥¹Ñ•É%°(€€€€€Á½¥¹Ñ•ÉQåÁ”(€€€ô€ô•Ù•¹Ðì(€€€¥˜€¡ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥Í%¹¥Ñ¥…±¥é•‘¹‘¥™™•É•¹ÑA½¥¹Ñ•ÉQåÁ”¡Á½¥¹Ñ•ÉQåÁ”¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÑ…É•Ð€ôÑ¡¥Ì¹}•ÑÉ…Ý¥¹Q…É•Ð¡Á…É•¹Ð°•Ù•¹Ð¤ì(€€€½¹ÍÐmà°åt€ôÑ¡¥Ì¹}•ÑA½¥¹Ñ•É½½É‘Ì¡•Ù•¹Ð¤ì(€€€½¹ÍÐì(€€€€€Ù¥•ÝÁ½ÉÐèì(€€€€€€€É½Ñ…Ñ¥½¸(€€€€€ô(€€€ô€ôÁ…É•¹Ðì(€€€½¹ÍÐì(€€€€€àè‰½á`°(€€€€€äè‰½ád°(€€€€€Ý¥‘Ñ èÁ…É•¹Ñ]¥‘Ñ °(€€€€€¡•¥¡ÐèÁ…É•¹Ñ!•¥¡Ð(€€€ô€ôÑ…É•Ð¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€€€½¹ÍÐ…Œ€ôÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ý¥¹€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€½¹ÍÐÍ¥¹…°€ôÁ…É•¹Ð¹½µ‰¥¹•‘M¥¹…°¡…Œ¤ì(€€€ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹Í•ÑA½¥¹Ñ•È¡Á½¥¹Ñ•ÉQåÁ”°Á½¥¹Ñ•É%¤ì(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•ÉÕÀˆ°”€ôøì(€€€€€¥˜€¡ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥ÍM…µ•A½¥¹Ñ•É%‘=ÉI•µ½Ù”¡”¹Á½¥¹Ñ•É%¤¤ì(€€€€€€€Ñ¡¥Ì¹}•¹‘É…Ü¡”¤ì(€€€€€ô(€€€ô°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É…¹•°ˆ°”€ôøì(€€€€€¥˜€¡ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥ÍM…µ•A½¥¹Ñ•É%‘=ÉI•µ½Ù”¡”¹Á½¥¹Ñ•É%¤¤ì(€€€€€€€Ñ¡¥Ì¹}•¹‘É…Ý¥¹M•ÍÍ¥½¸ ¤ì(€€€€€ô(€€€ô°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É‘½Ý¸ˆ°”€ôøì(€€€€€¥˜€ …ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥ÍM…µ•A½¥¹Ñ•ÉQåÁ”¡”¹Á½¥¹Ñ•ÉQåÁ”¤¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥¹¥Ñ¥…±¥é•¹‘‘‘A½¥¹Ñ•É%¡”¹Á½¥¹Ñ•É%¤ì(€€€€€¥˜€¡É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹¥Í…¹•±±…‰±” ¤¤ì(€€€€€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹É•µ½Ù•1…ÍÑ±•µ•¹Ð ¤ì(€€€€€€€¥˜€¡É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹¥ÍµÁÑä ¤¤ì(€€€€€€€€€Ñ¡¥Ì¹}•¹‘É…Ý¥¹M•ÍÍ¥½¸¡ÑÉÕ”¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€Ñ¡¥Ì¹}•¹‘É…Ü¡¹Õ±°¤ì(€€€€€€€ô(€€€€€ô(€€€ô°ì(€€€€€…ÁÑÕÉ”èÑÉÕ”°(€€€€€Á…ÍÍ¥Ù”è™…±Í”°(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰½¹Ñ•áÑµ•¹Ôˆ°¹½½¹Ñ•áÑ5•¹Ô°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ…É•Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•Éµ½Ù”ˆ°Ñ¡¥Ì¹}‘É…Ý5½Ù”¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ…É•Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Ñ½Õ¡µ½Ù”ˆ°”€ôøì(€€€€€¥˜€¡ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥ÍM…µ•Q¥µ•MÑ…µÀ¡”¹Ñ¥µ•MÑ…µÀ¤¤ì(€€€€€€€ÍÑ½ÁÙ•¹Ð¡”¤ì(€€€€€ô(€€€ô°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ¡¥Ì¹}…‘‘É…Ý¥¹1¥ÍÑ•¹•ÉÌ¡Ñ…É•Ð°Í¥¹…°¤ì(€€€Á…É•¹Ð¹Ñ½±•É…Ý¥¹œ ¤ì(€€€Õ¥5…¹…•È¹}•‘¥Ñ½ÉU¹‘½	…Èü¹¡¥‘” ¤ì(€€€¥˜€¡É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¤ì(€€€€€Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%°É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹ÍÑ…ÉÑ9•Ü¡à°ä°Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ð°É½Ñ…Ñ¥½¸¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Õ¥5…¹…•È¹ÕÁ‘…Ñ•U%½É•™…Õ±ÑAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¤ì(€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü€ôÑ¡¥Ì¹É•…Ñ•É…Ý•É%¹ÍÑ…¹”¡ì(€€€€€à°(€€€€€ä°(€€€€€‰½àèm‰½á`°‰½ád°Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ñt°(€€€€€É½Ñ…Ñ¥½¸°(€€€€€Á…É•¹Ð°(€€€€€¥Í1QH(€€€ô¤ì(€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ý¥¹=ÁÑ¥½¹Ì€ôÑ¡¥Ì¹•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì ¤ì(€€€Ñ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ð€ôÁ…É•¹Ðì(€€€½¹ÍÐì(€€€€€¥°(€€€€€±¥ÁA…Ñ¡%(€€€ô€ôÁ…É•¹Ð¹‘É…Ý1…å•È¹‘É…Ü¡Ñ¡¥Ì¹}µ•É•MYAÉ½Á•ÉÑ¥•Ì¡É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹Ñ½MYAÉ½Á•ÉÑ¥•Ì ¤°É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ì¤°ÑÉÕ”°Ñ¡¥Ì¹}¡…Í±¥ÁA…Ñ ¤ì(€€€Ñ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%€ô¥ì(€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹Ñ±¥ÁA…Ñ¡%€ôÑ¡¥Ì¹}¡…Í±¥ÁA…Ñ €ü±¥ÁA…Ñ¡%€è¹Õ±°ì(€ô(€ÍÑ…Ñ¥Œ}‘É…Ý5½Ù”¡•Ù•¹Ð¤ì(€€€ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥ÍM…µ•Q¥µ•MÑ…µÀ¡•Ù•¹Ð¹Ñ¥µ•MÑ…µÀ¤ì(€€€¥˜€ …É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥ÍM…µ•A½¥¹Ñ•É%¡•Ù•¹Ð¹Á½¥¹Ñ•É%¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹¥ÍUÍ¥¹5Õ±Ñ¥Á±•A½¥¹Ñ•ÉÌ ¤¤ì(€€€€€Ñ¡¥Ì¹}•¹‘É…Ü¡•Ù•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€±•ÐÁÉ½Á•ÉÑ¥•Ìì(€€€½¹ÍÐ½…±•Í•€ô•Ù•¹Ð¹•Ñ½…±•Í•‘Ù•¹ÑÌü¸ ¤ì(€€€¥˜€¡½…±•Í•ü¹±•¹Ñ ¤ì(€€€€€½¹ÍÐÁ½¥¹ÑÌ€ômtì(€€€€€™½È€¡½¹ÍÐÍ…µÁ±”½˜½…±•Í•¤ì(€€€€€€€Á½¥¹ÑÌ¹ÁÕÍ  ¸¸¹Ñ¡¥Ì¹}•ÑA½¥¹Ñ•É½½É‘Ì¡Í…µÁ±”°•Ù•¹Ð¤¤ì(€€€€€ô(€€€€€ÁÉ½Á•ÉÑ¥•Ì€ôÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹…‘‘A½¥¹ÑÌ¡Á½¥¹ÑÌ¤ì(€€€ô•±Í”ì(€€€€€ÁÉ½Á•ÉÑ¥•Ì€ôÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹…‘ ¸¸¹Ñ¡¥Ì¹}•ÑA½¥¹Ñ•É½½É‘Ì¡•Ù•¹Ð¤¤ì(€€€ô(€€€Ñ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%°ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹Í•ÑQ¥µ•MÑ…µÀ¡•Ù•¹Ð¹Ñ¥µ•MÑ…µÀ¤ì(€€€ÍÑ½ÁÙ•¹Ð¡•Ù•¹Ð¤ì(€ô(€ÍÑ…Ñ¥Œ}±•…¹ÕÀ¡…±°¤ì(€€€¥˜€¡…±°¤ì(€€€€€Ñ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%€ô€´Äì(€€€€€Ñ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ð€ô¹Õ±°ì(€€€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü€ô¹Õ±°ì(€€€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ý¥¹=ÁÑ¥½¹Ì€ô¹Õ±°ì(€€€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹Ñ±¥ÁA…Ñ¡%€ô¹Õ±°ì(€€€€€ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹±•…ÉQ¥µ•MÑ…µÀ ¤ì(€€€ô(€€€¥˜€¡É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ý¥¹¤ì(€€€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ý¥¹¹…‰½ÉÐ ¤ì(€€€€€É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ý¥¹€ô¹Õ±°ì(€€€€€ÕÉÉ•¹ÑA½¥¹Ñ•ÉÌ¹±•…ÉA½¥¹Ñ•É%‘Ì ¤ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ}•¹‘É…Ü¡•Ù•¹Ð¤ì(€€€½¹ÍÐÁ…É•¹Ð€ôÑ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ðì(€€€¥˜€ …Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Á…É•¹Ð¹Ñ½±•É…Ý¥¹œ¡ÑÉÕ”¤ì(€€€Ñ¡¥Ì¹}±•…¹ÕÀ¡™…±Í”¤ì(€€€Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%°•Ù•¹Ðü¹Ñ…É•Ð€ôôôÁ…É•¹Ð¹‘¥Ø€üÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹•¹ ¸¸¹Ñ¡¥Ì¹}•ÑA½¥¹Ñ•É½½É‘Ì¡•Ù•¹Ð¤¤€èÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹•¹ ¤¤ì(€€€¥˜€¡Ñ¡¥Ì¹ÍÕÁÁ½ÉÑ5Õ±Ñ¥Á±•É…Ý¥¹Ì¤ì(€€€€€½¹ÍÐ‘É…Ü€ôÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Üì(€€€€€½¹ÍÐ‘É…Ý%€ôÑ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%ì(€€€€€½¹ÍÐ±…ÍÑ±•µ•¹Ð€ô‘É…Ü¹•Ñ1…ÍÑ±•µ•¹Ð ¤ì(€€€€€Á…É•¹Ð¹…‘‘½µµ…¹‘Ì¡ì(€€€€€€€µè€ ¤€ôøì(€€€€€€€€€Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡‘É…Ý%°‘É…Ü¹Í•Ñ1…ÍÑ±•µ•¹Ð¡±…ÍÑ±•µ•¹Ð¤¤ì(€€€€€€€ô°(€€€€€€€Õ¹‘¼è€ ¤€ôøì(€€€€€€€€€Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡‘É…Ý%°‘É…Ü¹É•µ½Ù•1…ÍÑ±•µ•¹Ð ¤¤ì(€€€€€€€ô°(€€€€€€€µÕÍÑá•Œè™…±Í”°(€€€€€€€ÑåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹I]}MQ@(€€€€€ô¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹•¹‘É…Ý¥¹œ¡™…±Í”¤ì(€ô(€ÍÑ…Ñ¥Œ•¹‘É…Ý¥¹œ¡¥Í‰½ÉÑ•¤ì(€€€½¹ÍÐÁ…É•¹Ð€ôÑ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ðì(€€€¥˜€ …Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€Á…É•¹Ð¹Ñ½±•É…Ý¥¹œ¡ÑÉÕ”¤ì(€€€Á…É•¹Ð¹±•…¹U¹‘½MÑ…¬¡¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹I]}MQ@¤ì(€€€¥˜€ …É…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹¥ÍµÁÑä ¤¤ì(€€€€€½¹ÍÐì(€€€€€€€Á…•¥µ•¹Í¥½¹ÌèmÁ…•]¥‘Ñ °Á…•!•¥¡Ñt°(€€€€€€€Í…±”(€€€€€ô€ôÁ…É•¹Ðì(€€€€€½¹ÍÐ•‘¥Ñ½È€ôÁ…É•¹Ð¹É•…Ñ•¹‘‘‘9•Ý‘¥Ñ½È¡ì(€€€€€€€½™™Í•Ñ`è€À°(€€€€€€€½™™Í•Ñdè€À(€€€€€ô°™…±Í”°ì(€€€€€€€‘É…Ý%èÑ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%°(€€€€€€€±¥ÁA…Ñ¡%èÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹Ñ±¥ÁA…Ñ¡%°(€€€€€€€‘É…Ý=ÕÑ±¥¹•ÌèÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ü¹•Ñ=ÕÑ±¥¹•Ì¡Á…•]¥‘Ñ €¨Í…±”°Á…•!•¥¡Ð€¨Í…±”°Í…±”°Ñ¡¥Ì¹}%99I}5I%8¤°(€€€€€€€‘É…Ý¥¹=ÁÑ¥½¹ÌèÉ…Ý¥¹‘¥Ñ½È¸ÕÉÉ•¹ÑÉ…Ý¥¹=ÁÑ¥½¹Ì°(€€€€€€€µÕÍÑ	•½µµ¥ÑÑ•è€…¥Í‰½ÉÑ•(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¹}±•…¹ÕÀ¡ÑÉÕ”¤ì(€€€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€€€ô(€€€Á…É•¹Ð¹‘É…Ý1…å•È¹É•µ½Ù”¡Ñ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%¤ì(€€€Ñ¡¥Ì¹}±•…¹ÕÀ¡ÑÉÕ”¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€É•…Ñ•É…Ý¥¹=ÁÑ¥½¹Ì¡}‘…Ñ„¤íô(€ÍÑ…Ñ¥Œ‘•Í•É¥…±¥é•É…Ü¡}Á…•`°}Á…•d°}Á…•]¥‘Ñ °}Á…•!•¥¡Ð°}¥¹¹•É5…É¥¸°}‘…Ñ„°}Õ¥5…¹…•È¤ì(€€€Õ¹É•…¡…‰±” ‰9½Ð¥µÁ±•µ•¹Ñ•ˆ¤ì(€ô(€ÍÑ…Ñ¥Œ…Íå¹Œ‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€½¹ÍÐì(€€€€€É…Ý¥µÌèì(€€€€€€€Á…•]¥‘Ñ °(€€€€€€€Á…•!•¥¡Ð°(€€€€€€€Á…•`°(€€€€€€€Á…•d(€€€€€ô(€€€ô€ôÁ…É•¹Ð¹Ù¥•ÝÁ½ÉÐì(€€€½¹ÍÐ‘É…Ý=ÕÑ±¥¹•Ì€ôÑ¡¥Ì¹‘•Í•É¥…±¥é•É…Ü¡Á…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ð°Ñ¡¥Ì¹}%99I}5I%8°‘…Ñ„°Õ¥5…¹…•È¤ì(€€€½¹ÍÐ•‘¥Ñ½È€ô…Ý…¥ÐÍÕÁ•È¹‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€•‘¥Ñ½È¹É•…Ñ•É…Ý¥¹=ÁÑ¥½¹Ì¡‘…Ñ„¤ì(€€€•‘¥Ñ½È¸É•…Ñ•É…Ý=ÕÑ±¥¹•Ì¡ì(€€€€€‘É…Ý=ÕÑ±¥¹•Ì(€€€ô¤ì(€€€•‘¥Ñ½È¸…‘‘Q½É…Ý1…å•È ¤ì(€€€•‘¥Ñ½È¹½¹M…±•¡…¹¥¹œ ¤ì(€€€•‘¥Ñ½È¹É½Ñ…Ñ” ¤ì(€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€ô(€Í•É¥…±¥é•É…Ü¡¥Í½É½Áå¥¹œ¤ì(€€€½¹ÍÐmÁ…•`°Á…•et€ôÑ¡¥Ì¹Á…•QÉ…¹Í±…Ñ¥½¸ì(€€€½¹ÍÐmÁ…•]¥‘Ñ °Á…•!•¥¡Ñt€ôÑ¡¥Ì¹Á…•¥µ•¹Í¥½¹Ìì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹Í•É¥…±¥é”¡mÁ…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ñt°¥Í½É½Áå¥¹œ¤ì(€ô(€É•¹‘•É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¸¤ì(€€€…¹¹½Ñ…Ñ¥½¸¹ÕÁ‘…Ñ•‘¥Ñ•¡ì(€€€€€É•ÐèÑ¡¥Ì¹•ÑAI•Ð ¤(€€€ô¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€ÍÑ…Ñ¥Œ…¹É•…Ñ•9•ÝµÁÑå‘¥Ñ½È ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½‘É…Ý•ÉÌ½½ÕÑ±¥¹”¹©Ì()±…ÍÌ=ÕÑ±¥¹”ì(€ÍÑ…Ñ¥ŒAI%M%=8€ô€Å”´Ðì(€™½ÕÍ=ÕÑ±¥¹”€ô¹Õ±°ì(€Ñ½MYA…Ñ  ¤ì(€€€Õ¹É•…¡…‰±” ‰‰ÍÑÉ…Ðµ•Ñ¡½Ñ½MYA…Ñ¡€µÕÍÐ‰”¥µÁ±•µ•¹Ñ•¸ˆ¤ì(€ô(€•Ð‰½à ¤ì(€€€Õ¹É•…¡…‰±” ‰‰ÍÑÉ…Ð•ÑÑ•È‰½á€µÕÍÐ‰”¥µÁ±•µ•¹Ñ•¸ˆ¤ì(€ô(€Í•É¥…±¥é”¡}‰‰½à°}É½Ñ…Ñ¥½¸¤ì(€€€Õ¹É•…¡…‰±” ‰‰ÍÑÉ…Ðµ•Ñ¡½Í•É¥…±¥é•€µÕÍÐ‰”¥µÁ±•µ•¹Ñ•¸ˆ¤ì(€ô(€•Ð‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ì ¤ì(€€€Õ¹É•…¡…‰±” ‰‰ÍÑÉ…Ð•ÑÑ•È‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Í€µÕÍÐ‰”¥µÁ±•µ•¹Ñ•¸ˆ¤ì(€ô(€•Ð‘•™…Õ±ÑAÉ½Á•ÉÑ¥•Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ìì(€ô(€•Ñ½ÕÍMYAÉ½Á•ÉÑ¥•Ì¡}É½Ñ…Ñ¥½¸¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€•Ð™½ÕÍ5ÕÍÑI•µ½Ù•M•±™%¹Ñ•ÉÍ•Ñ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡}¹…µ”°}Ù…±Õ”¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€ÕÁ‘…Ñ•A…É•¹Ñ¥µ•¹Í¥½¹Ì¡}‘¥µ•¹Í¥½¹Ì°}Í…±”¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€Í•É¥…±¥é•EÕ…‘A½¥¹ÑÌ¡}Á…•QÉ…¹Í±…Ñ¥½¸°}Á…•¥µ•¹Í¥½¹Ì¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€ÕÁ‘…Ñ•I½Ñ…Ñ¥½¸¡}É½Ñ…Ñ¥½¸¤ì(€€€É•ÑÕÉ¸íôì(€ô(€•ÑA…Ñ¡I•Í¥é¥¹MYAÉ½Á•ÉÑ¥•Ì¡}‰‰½à¤ì(€€€É•ÑÕÉ¸íôì(€ô(€•ÑA…Ñ¡I•Í¥é•‘MYAÉ½Á•ÉÑ¥•Ì¡}‰‰½à¤ì(€€€É•ÑÕÉ¸íôì(€ô(€•ÑA…Ñ¡QÉ…¹Í±…Ñ•‘MYAÉ½Á•ÉÑ¥•Ì¡}‰‰½à°}Á…É•¹Ñ¥µ•¹Í¥½¹Ì¤ì(€€€É•ÑÕÉ¸íôì(€ô(€ÍÑ…Ñ¥Œ}É½Ñ…Ñ•	½à¡mà°ä°Ý¥‘Ñ °¡•¥¡Ñt°…¹±”¤ì(€€€ÍÝ¥Ñ €¡…¹±”¤ì(€€€€€…Í”€äÀè(€€€€€€€É•ÑÕÉ¸lÄ€´ä€´¡•¥¡Ð°à°¡•¥¡Ð°Ý¥‘Ñ¡tì(€€€€€…Í”€ÄàÀè(€€€€€€€É•ÑÕÉ¸lÄ€´à€´Ý¥‘Ñ °€Ä€´ä€´¡•¥¡Ð°Ý¥‘Ñ °¡•¥¡Ñtì(€€€€€…Í”€ÈÜÀè(€€€€€€€É•ÑÕÉ¸mä°€Ä€´à€´Ý¥‘Ñ °¡•¥¡Ð°Ý¥‘Ñ¡tì(€€€ô(€€€É•ÑÕÉ¸mà°ä°Ý¥‘Ñ °¡•¥¡Ñtì(€ô(€ÍÑ…Ñ¥Œ}É•Í…±”¡ÍÉŒ°Ñà°Ñä°Íà°Íä°‘•ÍÐ¤ì(€€€‘•ÍÐñðô¹•Ü±½…ÐÌÉÉÉ…ä¡ÍÉŒ¹±•¹Ñ ¤ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÍÉŒ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€‘•ÍÑm¥t€ôÑà€¬ÍÉm¥t€¨Íàì(€€€€€‘•ÍÑm¤€¬€Åt€ôÑä€¬ÍÉm¤€¬€Åt€¨Íäì(€€€ô(€€€É•ÑÕÉ¸‘•ÍÐì(€ô(€ÍÑ…Ñ¥Œ}É•Í…±•¹‘MÝ…À¡ÍÉŒ°Ñà°Ñä°Íà°Íä°‘•ÍÐ¤ì(€€€‘•ÍÐñðô¹•Ü±½…ÐÌÉÉÉ…ä¡ÍÉŒ¹±•¹Ñ ¤ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÍÉŒ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€‘•ÍÑm¥t€ôÑà€¬ÍÉm¤€¬€Åt€¨Íàì(€€€€€‘•ÍÑm¤€¬€Åt€ôÑä€¬ÍÉm¥t€¨Íäì(€€€ô(€€€É•ÑÕÉ¸‘•ÍÐì(€ô(€ÍÑ…Ñ¥Œ}ÑÉ…¹Í±…Ñ”¡ÍÉŒ°Ñà°Ñä°‘•ÍÐ¤ì(€€€‘•ÍÐñðô¹•Ü±½…ÐÌÉÉÉ…ä¡ÍÉŒ¹±•¹Ñ ¤ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÍÉŒ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€‘•ÍÑm¥t€ôÑà€¬ÍÉm¥tì(€€€€€‘•ÍÑm¤€¬€Åt€ôÑä€¬ÍÉm¤€¬€Åtì(€€€ô(€€€É•ÑÕÉ¸‘•ÍÐì(€ô(€ÍÑ…Ñ¥ŒÍÙI½Õ¹¡à¤ì(€€€É•ÑÕÉ¸5…Ñ ¹É½Õ¹¡à€¨€ÄÀÀÀÀ¤ì(€ô(€ÍÑ…Ñ¥Œ}¹½Éµ…±¥é•A½¥¹Ð¡à°ä°Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ð°É½Ñ…Ñ¥½¸¤ì(€€€ÍÝ¥Ñ €¡É½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€äÀè(€€€€€€€É•ÑÕÉ¸lÄ€´ä€¼Á…É•¹Ñ]¥‘Ñ °à€¼Á…É•¹Ñ!•¥¡Ñtì(€€€€€…Í”€ÄàÀè(€€€€€€€É•ÑÕÉ¸lÄ€´à€¼Á…É•¹Ñ]¥‘Ñ °€Ä€´ä€¼Á…É•¹Ñ!•¥¡Ñtì(€€€€€…Í”€ÈÜÀè(€€€€€€€É•ÑÕÉ¸mä€¼Á…É•¹Ñ]¥‘Ñ °€Ä€´à€¼Á…É•¹Ñ!•¥¡Ñtì(€€€€€‘•™…Õ±Ðè(€€€€€€€É•ÑÕÉ¸mà€¼Á…É•¹Ñ]¥‘Ñ °ä€¼Á…É•¹Ñ!•¥¡Ñtì(€€€ô(€ô(€ÍÑ…Ñ¥ŒÉ•…Ñ•	•é¥•ÉA½¥¹ÑÌ¡àÄ°äÄ°àÈ°äÈ°àÌ°äÌ¤ì(€€€É•ÑÕÉ¸l¡àÄ€¬€Ô€¨àÈ¤€¼€Ø°€¡äÄ€¬€Ô€¨äÈ¤€¼€Ø°€ Ô€¨àÈ€¬àÌ¤€¼€Ø°€ Ô€¨äÈ€¬äÌ¤€¼€Ø°€¡àÈ€¬àÌ¤€¼€È°€¡äÈ€¬äÌ¤€¼€Étì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½‘É…Ý•ÉÌ½™É••‘É…Ü¹©Ì(()±…ÍÌÉ••É…Ý=ÕÑ±¥¹•Èì(€€‰½àì(€€‰½ÑÑ½´€ômtì(€€¥¹¹•É5…É¥¸ì(€€¥Í1QHì(€€Ñ½À€ômtì(€€±…ÍÐ€ô¹•Ü±½…ÐÌÉÉÉ…ä Äà¤ì(€€±…ÍÑ`ì(€€±…ÍÑdì(€€µ¥¸ì(€€µ¥¹}‘¥ÍÐì(€€Í…±•…Ñ½Èì(€€Ñ¡¥­¹•ÍÌì(€€Á½¥¹ÑÌ€ômtì(€ÍÑ…Ñ¥Œ€5%9}%MP€ô€àì(€ÍÑ…Ñ¥Œ€5%9}%€ô€Èì(€ÍÑ…Ñ¥Œ€5%8€ôÉ••É…Ý=ÕÑ±¥¹•È¸5%9}%MP€¬É••É…Ý=ÕÑ±¥¹•È¸5%9}%ì(€½¹ÍÑÉÕÑ½È¡à°ä°‰½à°Í…±•…Ñ½È°Ñ¡¥­¹•ÍÌ°¥Í1QH°¥¹¹•É5…É¥¸€ô€À¤ì(€€€Ñ¡¥Ì¸‰½à€ô‰½àì(€€€Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌ€ôÑ¡¥­¹•ÍÌ€¨Í…±•…Ñ½Èì(€€€Ñ¡¥Ì¸¥Í1QH€ô¥Í1QHì(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡m9…8°9…8°9…8°9…8°à°åt°€Ø¤ì(€€€Ñ¡¥Ì¸¥¹¹•É5…É¥¸€ô¥¹¹•É5…É¥¸ì(€€€Ñ¡¥Ì¸µ¥¹}‘¥ÍÐ€ôÉ••É…Ý=ÕÑ±¥¹•È¸5%9}%MP€¨Í…±•…Ñ½Èì(€€€Ñ¡¥Ì¸µ¥¸€ôÉ••É…Ý=ÕÑ±¥¹•È¸5%8€¨Í…±•…Ñ½Èì(€€€Ñ¡¥Ì¸Í…±•…Ñ½È€ôÍ…±•…Ñ½Èì(€€€Ñ¡¥Ì¸Á½¥¹ÑÌ¹ÁÕÍ ¡à°ä¤ì(€ô(€¥ÍµÁÑä ¤ì(€€€É•ÑÕÉ¸¥Í9…8¡Ñ¡¥Ì¸±…ÍÑlát¤ì(€ô(€¥Í…¹•±±…‰±” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ðô€ÄÀì(€ô(€É•µ½Ù•1…ÍÑ±•µ•¹Ð ¤ì(€€€Ñ¡¥Ì¸±…ÍÐ¹™¥±°¡9…8¤ì(€€€Ñ¡¥Ì¸Ñ½À¹±•¹Ñ €ôÑ¡¥Ì¸‰½ÑÑ½´¹±•¹Ñ €ôÑ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ô€Àì(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€è€ˆˆ(€€€€€ô(€€€ôì(€ô(€€•Ñ1…ÍÑ½½É‘Ì ¤ì(€€€½¹ÍÐ±…ÍÑQ½À€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä Ð°€Ø¤ì(€€€½¹ÍÐ±…ÍÑ	½ÑÑ½´€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä ÄØ°€Äà¤ì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸‰½àì(€€€É•ÑÕÉ¸l¡Ñ¡¥Ì¸±…ÍÑ`€¬€¡±…ÍÑQ½ÁlÁt€´±…ÍÑ	½ÑÑ½µlÁt¤€¼€È€´à¤€¼Ý¥‘Ñ °€¡Ñ¡¥Ì¸±…ÍÑd€¬€¡±…ÍÑQ½ÁlÅt€´±…ÍÑ	½ÑÑ½µlÅt¤€¼€È€´ä¤€¼¡•¥¡Ð°€¡Ñ¡¥Ì¸±…ÍÑ`€¬€¡±…ÍÑ	½ÑÑ½µlÁt€´±…ÍÑQ½ÁlÁt¤€¼€È€´à¤€¼Ý¥‘Ñ °€¡Ñ¡¥Ì¸±…ÍÑd€¬€¡±…ÍÑ	½ÑÑ½µlÅt€´±…ÍÑQ½ÁlÅt¤€¼€È€´ä¤€¼¡•¥¡Ñtì(€ô(€…‘¡à°ä¤ì(€€€Ñ¡¥Ì¸±…ÍÑ`€ôàì(€€€Ñ¡¥Ì¸±…ÍÑd€ôäì(€€€½¹ÍÐm±…å•É`°±…å•Éd°±…å•É]¥‘Ñ °±…å•É!•¥¡Ñt€ôÑ¡¥Ì¸‰½àì(€€€±•ÐmàÄ°äÄ°àÈ°äÉt€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä à°€ÄÈ¤ì(€€€½¹ÍÐ‘¥™™`€ôà€´àÈì(€€€½¹ÍÐ‘¥™™d€ôä€´äÈì(€€€½¹ÍÐ€ô5…Ñ ¹¡åÁ½Ð¡‘¥™™`°‘¥™™d¤ì(€€€¥˜€¡€ðÑ¡¥Ì¸µ¥¸¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ô(€€€½¹ÍÐ‘¥™™€ô€´Ñ¡¥Ì¸µ¥¹}‘¥ÍÐì(€€€½¹ÍÐ,€ô‘¥™™€¼ì(€€€½¹ÍÐÍ¡¥™Ñ`€ô,€¨‘¥™™`ì(€€€½¹ÍÐÍ¡¥™Ñd€ô,€¨‘¥™™dì(€€€±•ÐàÀ€ôàÄì(€€€±•ÐäÀ€ôäÄì(€€€àÄ€ôàÈì(€€€äÄ€ôäÈì(€€€àÈ€¬ôÍ¡¥™Ñ`ì(€€€äÈ€¬ôÍ¡¥™Ñdì(€€€Ñ¡¥Ì¸Á½¥¹ÑÌü¹ÁÕÍ ¡à°ä¤ì(€€€½¹ÍÐ¹`€ô€µÍ¡¥™Ñd€¼‘¥™™ì(€€€½¹ÍÐ¹d€ôÍ¡¥™Ñ`€¼‘¥™™ì(€€€½¹ÍÐÑ¡`€ô¹`€¨Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌì(€€€½¹ÍÐÑ¡d€ô¹d€¨Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌì(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡Ñ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä È°€à¤°€À¤ì(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡màÈ€¬Ñ¡`°äÈ€¬Ñ¡et°€Ð¤ì(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡Ñ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä ÄÐ°€Äà¤°€ÄÈ¤ì(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡màÈ€´Ñ¡`°äÈ€´Ñ¡et°€ÄØ¤ì(€€€¥˜€¡¥Í9…8¡Ñ¡¥Ì¸±…ÍÑlÙt¤¤ì(€€€€€¥˜€¡Ñ¡¥Ì¸Ñ½À¹±•¹Ñ €ôôô€À¤ì(€€€€€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡màÄ€¬Ñ¡`°äÄ€¬Ñ¡et°€È¤ì(€€€€€€€Ñ¡¥Ì¸Ñ½À¹ÁÕÍ ¡9…8°9…8°9…8°9…8°€¡àÄ€¬Ñ¡`€´±…å•É`¤€¼±…å•É]¥‘Ñ °€¡äÄ€¬Ñ¡d€´±…å•Éd¤€¼±…å•É!•¥¡Ð¤ì(€€€€€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡màÄ€´Ñ¡`°äÄ€´Ñ¡et°€ÄÐ¤ì(€€€€€€€Ñ¡¥Ì¸‰½ÑÑ½´¹ÁÕÍ ¡9…8°9…8°9…8°9…8°€¡àÄ€´Ñ¡`€´±…å•É`¤€¼±…å•É]¥‘Ñ °€¡äÄ€´Ñ¡d€´±…å•Éd¤€¼±…å•É!•¥¡Ð¤ì(€€€€€ô(€€€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡màÀ°äÀ°àÄ°äÄ°àÈ°äÉt°€Ø¤ì(€€€€€É•ÑÕÉ¸€…Ñ¡¥Ì¹¥ÍµÁÑä ¤ì(€€€ô(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡màÀ°äÀ°àÄ°äÄ°àÈ°äÉt°€Ø¤ì(€€€½¹ÍÐ…¹±”€ô5…Ñ ¹…‰Ì¡5…Ñ ¹…Ñ…¸È¡äÀ€´äÄ°àÀ€´àÄ¤€´5…Ñ ¹…Ñ…¸È¡Í¡¥™Ñd°Í¡¥™Ñ`¤¤ì(€€€¥˜€¡…¹±”€ð5…Ñ ¹A$€¼€È¤ì(€€€€€màÄ°äÄ°àÈ°äÉt€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä È°€Ø¤ì(€€€€€Ñ¡¥Ì¸Ñ½À¹ÁÕÍ ¡9…8°9…8°9…8°9…8°€ ¡àÄ€¬àÈ¤€¼€È€´±…å•É`¤€¼±…å•É]¥‘Ñ °€ ¡äÄ€¬äÈ¤€¼€È€´±…å•Éd¤€¼±…å•É!•¥¡Ð¤ì(€€€€€màÄ°äÄ°àÀ°äÁt€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä ÄÐ°€Äà¤ì(€€€€€Ñ¡¥Ì¸‰½ÑÑ½´¹ÁÕÍ ¡9…8°9…8°9…8°9…8°€ ¡àÀ€¬àÄ¤€¼€È€´±…å•É`¤€¼±…å•É]¥‘Ñ °€ ¡äÀ€¬äÄ¤€¼€È€´±…å•Éd¤€¼±…å•É!•¥¡Ð¤ì(€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€ô(€€€màÀ°äÀ°àÄ°äÄ°àÈ°äÉt€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä À°€Ø¤ì(€€€Ñ¡¥Ì¸Ñ½À¹ÁÕÍ   ¡àÀ€¬€Ô€¨àÄ¤€¼€Ø€´±…å•É`¤€¼±…å•É]¥‘Ñ °€ ¡äÀ€¬€Ô€¨äÄ¤€¼€Ø€´±…å•Éd¤€¼±…å•É!•¥¡Ð°€  Ô€¨àÄ€¬àÈ¤€¼€Ø€´±…å•É`¤€¼±…å•É]¥‘Ñ °€  Ô€¨äÄ€¬äÈ¤€¼€Ø€´±…å•Éd¤€¼±…å•É!•¥¡Ð°€ ¡àÄ€¬àÈ¤€¼€È€´±…å•É`¤€¼±…å•É]¥‘Ñ °€ ¡äÄ€¬äÈ¤€¼€È€´±…å•Éd¤€¼±…å•É!•¥¡Ð¤ì(€€€màÈ°äÈ°àÄ°äÄ°àÀ°äÁt€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä ÄÈ°€Äà¤ì(€€€Ñ¡¥Ì¸‰½ÑÑ½´¹ÁÕÍ   ¡àÀ€¬€Ô€¨àÄ¤€¼€Ø€´±…å•É`¤€¼±…å•É]¥‘Ñ °€ ¡äÀ€¬€Ô€¨äÄ¤€¼€Ø€´±…å•Éd¤€¼±…å•É!•¥¡Ð°€  Ô€¨àÄ€¬àÈ¤€¼€Ø€´±…å•É`¤€¼±…å•É]¥‘Ñ °€  Ô€¨äÄ€¬äÈ¤€¼€Ø€´±…å•Éd¤€¼±…å•É!•¥¡Ð°€ ¡àÄ€¬àÈ¤€¼€È€´±…å•É`¤€¼±…å•É]¥‘Ñ °€ ¡äÄ€¬äÈ¤€¼€È€´±…å•Éd¤€¼±…å•É!•¥¡Ð¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€Ñ½MYA…Ñ  ¤ì(€€€¥˜€¡Ñ¡¥Ì¹¥ÍµÁÑä ¤¤ì(€€€€€É•ÑÕÉ¸€ˆˆì(€€€ô(€€€½¹ÍÐÑ½À€ôÑ¡¥Ì¸Ñ½Àì(€€€½¹ÍÐ‰½ÑÑ½´€ôÑ¡¥Ì¸‰½ÑÑ½´ì(€€€¥˜€¡¥Í9…8¡Ñ¡¥Ì¸±…ÍÑlÙt¤€˜˜€…Ñ¡¥Ì¹¥ÍµÁÑä ¤¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸Ñ½MYA…Ñ¡QÝ½A½¥¹ÑÌ ¤ì(€€€ô(€€€½¹ÍÐ‰Õ™™•È€ômtì(€€€‰Õ™™•È¹ÁÕÍ ¡4‘íÑ½ÁlÑuô€‘íÑ½ÁlÕuõ€¤ì(€€€™½È€¡±•Ð¤€ô€Øì¤€ðÑ½À¹±•¹Ñ ì¤€¬ô€Ø¤ì(€€€€€¥˜€¡¥Í9…8¡Ñ½Ám¥t¤¤ì(€€€€€€€‰Õ™™•È¹ÁÕÍ ¡0‘íÑ½Ám¤€¬€Ñuô€‘íÑ½Ám¤€¬€Õuõ€¤ì(€€€€€ô•±Í”ì(€€€€€€€‰Õ™™•È¹ÁÕÍ ¡‘íÑ½Ám¥uô€‘íÑ½Ám¤€¬€Åuô€‘íÑ½Ám¤€¬€Éuô€‘íÑ½Ám¤€¬€Íuô€‘íÑ½Ám¤€¬€Ñuô€‘íÑ½Ám¤€¬€Õuõ€¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¸Ñ½MYA…Ñ¡¹¡‰Õ™™•È¤ì(€€€™½È€¡±•Ð¤€ô‰½ÑÑ½´¹±•¹Ñ €´€Øì¤€øô€Øì¤€´ô€Ø¤ì(€€€€€¥˜€¡¥Í9…8¡‰½ÑÑ½µm¥t¤¤ì(€€€€€€€‰Õ™™•È¹ÁÕÍ ¡0‘í‰½ÑÑ½µm¤€¬€Ñuô€‘í‰½ÑÑ½µm¤€¬€Õuõ€¤ì(€€€€€ô•±Í”ì(€€€€€€€‰Õ™™•È¹ÁÕÍ ¡‘í‰½ÑÑ½µm¥uô€‘í‰½ÑÑ½µm¤€¬€Åuô€‘í‰½ÑÑ½µm¤€¬€Éuô€‘í‰½ÑÑ½µm¤€¬€Íuô€‘í‰½ÑÑ½µm¤€¬€Ñuô€‘í‰½ÑÑ½µm¤€¬€Õuõ€¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¸Ñ½MYA…Ñ¡MÑ…ÉÐ¡‰Õ™™•È¤ì(€€€É•ÑÕÉ¸‰Õ™™•È¹©½¥¸ ˆ€ˆ¤ì(€ô(€€Ñ½MYA…Ñ¡QÝ½A½¥¹ÑÌ ¤ì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸‰½àì(€€€½¹ÍÐm±…ÍÑQ½Á`°±…ÍÑQ½Ád°±…ÍÑ	½ÑÑ½µ`°±…ÍÑ	½ÑÑ½µet€ôÑ¡¥Ì¸•Ñ1…ÍÑ½½É‘Ì ¤ì(€€€É•ÑÕÉ¸4‘ì¡Ñ¡¥Ì¸±…ÍÑlÉt€´à¤€¼Ý¥‘Ñ¡ô€‘ì¡Ñ¡¥Ì¸±…ÍÑlÍt€´ä¤€¼¡•¥¡Ñô0‘ì¡Ñ¡¥Ì¸±…ÍÑlÑt€´à¤€¼Ý¥‘Ñ¡ô€‘ì¡Ñ¡¥Ì¸±…ÍÑlÕt€´ä¤€¼¡•¥¡Ñô0‘í±…ÍÑQ½Áaô€‘í±…ÍÑQ½Áeô0‘í±…ÍÑ	½ÑÑ½µaô€‘í±…ÍÑ	½ÑÑ½µeô0‘ì¡Ñ¡¥Ì¸±…ÍÑlÄÙt€´à¤€¼Ý¥‘Ñ¡ô€‘ì¡Ñ¡¥Ì¸±…ÍÑlÄÝt€´ä¤€¼¡•¥¡Ñô0‘ì¡Ñ¡¥Ì¸±…ÍÑlÄÑt€´à¤€¼Ý¥‘Ñ¡ô€‘ì¡Ñ¡¥Ì¸±…ÍÑlÄÕt€´ä¤€¼¡•¥¡Ñôi€ì(€ô(€€Ñ½MYA…Ñ¡MÑ…ÉÐ¡‰Õ™™•È¤ì(€€€½¹ÍÐ‰½ÑÑ½´€ôÑ¡¥Ì¸‰½ÑÑ½´ì(€€€‰Õ™™•È¹ÁÕÍ ¡0‘í‰½ÑÑ½µlÑuô€‘í‰½ÑÑ½µlÕuôi€¤ì(€ô(€€Ñ½MYA…Ñ¡¹¡‰Õ™™•È¤ì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸‰½àì(€€€½¹ÍÐ±…ÍÑQ½À€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä Ð°€Ø¤ì(€€€½¹ÍÐ±…ÍÑ	½ÑÑ½´€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä ÄØ°€Äà¤ì(€€€½¹ÍÐm±…ÍÑQ½Á`°±…ÍÑQ½Ád°±…ÍÑ	½ÑÑ½µ`°±…ÍÑ	½ÑÑ½µet€ôÑ¡¥Ì¸•Ñ1…ÍÑ½½É‘Ì ¤ì(€€€‰Õ™™•È¹ÁÕÍ ¡0‘ì¡±…ÍÑQ½ÁlÁt€´à¤€¼Ý¥‘Ñ¡ô€‘ì¡±…ÍÑQ½ÁlÅt€´ä¤€¼¡•¥¡Ñô0‘í±…ÍÑQ½Áaô€‘í±…ÍÑQ½Áeô0‘í±…ÍÑ	½ÑÑ½µaô€‘í±…ÍÑ	½ÑÑ½µeô0‘ì¡±…ÍÑ	½ÑÑ½µlÁt€´à¤€¼Ý¥‘Ñ¡ô€‘ì¡±…ÍÑ	½ÑÑ½µlÅt€´ä¤€¼¡•¥¡Ñõ€¤ì(€ô(€¹•ÝÉ••É…Ý=ÕÑ±¥¹”¡½ÕÑ±¥¹”°Á½¥¹ÑÌ°‰½à°Í…±•…Ñ½È°¥¹¹•É5…É¥¸°¥Í1QH¤ì(€€€É•ÑÕÉ¸¹•ÜÉ••É…Ý=ÕÑ±¥¹”¡½ÕÑ±¥¹”°Á½¥¹ÑÌ°‰½à°Í…±•…Ñ½È°¥¹¹•É5…É¥¸°¥Í1QH¤ì(€ô(€•Ñ=ÕÑ±¥¹•Ì ¤ì(€€€½¹ÍÐÑ½À€ôÑ¡¥Ì¸Ñ½Àì(€€€½¹ÍÐ‰½ÑÑ½´€ôÑ¡¥Ì¸‰½ÑÑ½´ì(€€€½¹ÍÐ±…ÍÐ€ôÑ¡¥Ì¸±…ÍÐì(€€€½¹ÍÐm±…å•É`°±…å•Éd°±…å•É]¥‘Ñ °±…å•É!•¥¡Ñt€ôÑ¡¥Ì¸‰½àì(€€€½¹ÍÐÁ½¥¹ÑÌ€ô¹•Ü±½…ÐÌÉÉÉ…ä ¡Ñ¡¥Ì¸Á½¥¹ÑÌü¹±•¹Ñ €üü€À¤€¬€È¤ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÁ½¥¹ÑÌ¹±•¹Ñ €´€Èì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€Á½¥¹ÑÍm¥t€ô€¡Ñ¡¥Ì¸Á½¥¹ÑÍm¥t€´±…å•É`¤€¼±…å•É]¥‘Ñ ì(€€€€€Á½¥¹ÑÍm¤€¬€Åt€ô€¡Ñ¡¥Ì¸Á½¥¹ÑÍm¤€¬€Åt€´±…å•Éd¤€¼±…å•É!•¥¡Ðì(€€€ô(€€€Á½¥¹ÑÍmÁ½¥¹ÑÌ¹±•¹Ñ €´€Ét€ô€¡Ñ¡¥Ì¸±…ÍÑ`€´±…å•É`¤€¼±…å•É]¥‘Ñ ì(€€€Á½¥¹ÑÍmÁ½¥¹ÑÌ¹±•¹Ñ €´€Åt€ô€¡Ñ¡¥Ì¸±…ÍÑd€´±…å•Éd¤€¼±…å•É!•¥¡Ðì(€€€¥˜€¡¥Í9…8¡±…ÍÑlÙt¤€˜˜€…Ñ¡¥Ì¹¥ÍµÁÑä ¤¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸•Ñ=ÕÑ±¥¹•QÝ½A½¥¹ÑÌ¡Á½¥¹ÑÌ¤ì(€€€ô(€€€½¹ÍÐ½ÕÑ±¥¹”€ô¹•Ü±½…ÐÌÉÉÉ…ä¡Ñ¡¥Ì¸Ñ½À¹±•¹Ñ €¬€ÈÐ€¬Ñ¡¥Ì¸‰½ÑÑ½´¹±•¹Ñ ¤ì(€€€±•Ð8€ôÑ½À¹±•¹Ñ ì(€€€™½È€¡±•Ð¤€ô€Àì¤€ð8ì¤€¬ô€È¤ì(€€€€€¥˜€¡¥Í9…8¡Ñ½Ám¥t¤¤ì(€€€€€€€½ÕÑ±¥¹•m¥t€ô½ÕÑ±¥¹•m¤€¬€Åt€ô9…8ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€½ÕÑ±¥¹•m¥t€ôÑ½Ám¥tì(€€€€€½ÕÑ±¥¹•m¤€¬€Åt€ôÑ½Ám¤€¬€Åtì(€€€ô(€€€8€ôÑ¡¥Ì¸•Ñ=ÕÑ±¥¹•¹¡½ÕÑ±¥¹”°8¤ì(€€€™½È€¡±•Ð¤€ô‰½ÑÑ½´¹±•¹Ñ €´€Øì¤€øô€Øì¤€´ô€Ø¤ì(€€€€€™½È€¡±•Ð¨€ô€Àì¨€ð€Øì¨€¬ô€È¤ì(€€€€€€€¥˜€¡¥Í9…8¡‰½ÑÑ½µm¤€¬©t¤¤ì(€€€€€€€€€½ÕÑ±¥¹•m9t€ô½ÕÑ±¥¹•m8€¬€Åt€ô9…8ì(€€€€€€€€€8€¬ô€Èì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€½ÕÑ±¥¹•m9t€ô‰½ÑÑ½µm¤€¬©tì(€€€€€€€½ÕÑ±¥¹•m8€¬€Åt€ô‰½ÑÑ½µm¤€¬¨€¬€Åtì(€€€€€€€8€¬ô€Èì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¸•Ñ=ÕÑ±¥¹•MÑ…ÉÐ¡½ÕÑ±¥¹”°8¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹¹•ÝÉ••É…Ý=ÕÑ±¥¹”¡½ÕÑ±¥¹”°Á½¥¹ÑÌ°Ñ¡¥Ì¸‰½à°Ñ¡¥Ì¸Í…±•…Ñ½È°Ñ¡¥Ì¸¥¹¹•É5…É¥¸°Ñ¡¥Ì¸¥Í1QH¤ì(€ô(€€•Ñ=ÕÑ±¥¹•QÝ½A½¥¹ÑÌ¡Á½¥¹ÑÌ¤ì(€€€½¹ÍÐ±…ÍÐ€ôÑ¡¥Ì¸±…ÍÐì(€€€½¹ÍÐm±…å•É`°±…å•Éd°±…å•É]¥‘Ñ °±…å•É!•¥¡Ñt€ôÑ¡¥Ì¸‰½àì(€€€½¹ÍÐm±…ÍÑQ½Á`°±…ÍÑQ½Ád°±…ÍÑ	½ÑÑ½µ`°±…ÍÑ	½ÑÑ½µet€ôÑ¡¥Ì¸•Ñ1…ÍÑ½½É‘Ì ¤ì(€€€½¹ÍÐ½ÕÑ±¥¹”€ô¹•Ü±½…ÐÌÉÉÉ…ä ÌØ¤ì(€€€½ÕÑ±¥¹”¹Í•Ð¡m9…8°9…8°9…8°9…8°€¡±…ÍÑlÉt€´±…å•É`¤€¼±…å•É]¥‘Ñ °€¡±…ÍÑlÍt€´±…å•Éd¤€¼±…å•É!•¥¡Ð°9…8°9…8°9…8°9…8°€¡±…ÍÑlÑt€´±…å•É`¤€¼±…å•É]¥‘Ñ °€¡±…ÍÑlÕt€´±…å•Éd¤€¼±…å•É!•¥¡Ð°9…8°9…8°9…8°9…8°±…ÍÑQ½Á`°±…ÍÑQ½Ád°9…8°9…8°9…8°9…8°±…ÍÑ	½ÑÑ½µ`°±…ÍÑ	½ÑÑ½µd°9…8°9…8°9…8°9…8°€¡±…ÍÑlÄÙt€´±…å•É`¤€¼±…å•É]¥‘Ñ °€¡±…ÍÑlÄÝt€´±…å•Éd¤€¼±…å•É!•¥¡Ð°9…8°9…8°9…8°9…8°€¡±…ÍÑlÄÑt€´±…å•É`¤€¼±…å•É]¥‘Ñ °€¡±…ÍÑlÄÕt€´±…å•Éd¤€¼±…å•É!•¥¡Ñt°€À¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹¹•ÝÉ••É…Ý=ÕÑ±¥¹”¡½ÕÑ±¥¹”°Á½¥¹ÑÌ°Ñ¡¥Ì¸‰½à°Ñ¡¥Ì¸Í…±•…Ñ½È°Ñ¡¥Ì¸¥¹¹•É5…É¥¸°Ñ¡¥Ì¸¥Í1QH¤ì(€ô(€€•Ñ=ÕÑ±¥¹•MÑ…ÉÐ¡½ÕÑ±¥¹”°Á½Ì¤ì(€€€½¹ÍÐ‰½ÑÑ½´€ôÑ¡¥Ì¸‰½ÑÑ½´ì(€€€½ÕÑ±¥¹”¹Í•Ð¡m9…8°9…8°9…8°9…8°‰½ÑÑ½µlÑt°‰½ÑÑ½µlÕut°Á½Ì¤ì(€€€É•ÑÕÉ¸Á½Ì€¬ô€Øì(€ô(€€•Ñ=ÕÑ±¥¹•¹¡½ÕÑ±¥¹”°Á½Ì¤ì(€€€½¹ÍÐ±…ÍÑQ½À€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä Ð°€Ø¤ì(€€€½¹ÍÐ±…ÍÑ	½ÑÑ½´€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä ÄØ°€Äà¤ì(€€€½¹ÍÐm±…å•É`°±…å•Éd°±…å•É]¥‘Ñ °±…å•É!•¥¡Ñt€ôÑ¡¥Ì¸‰½àì(€€€½¹ÍÐm±…ÍÑQ½Á`°±…ÍÑQ½Ád°±…ÍÑ	½ÑÑ½µ`°±…ÍÑ	½ÑÑ½µet€ôÑ¡¥Ì¸•Ñ1…ÍÑ½½É‘Ì ¤ì(€€€½ÕÑ±¥¹”¹Í•Ð¡m9…8°9…8°9…8°9…8°€¡±…ÍÑQ½ÁlÁt€´±…å•É`¤€¼±…å•É]¥‘Ñ °€¡±…ÍÑQ½ÁlÅt€´±…å•Éd¤€¼±…å•É!•¥¡Ð°9…8°9…8°9…8°9…8°±…ÍÑQ½Á`°±…ÍÑQ½Ád°9…8°9…8°9…8°9…8°±…ÍÑ	½ÑÑ½µ`°±…ÍÑ	½ÑÑ½µd°9…8°9…8°9…8°9…8°€¡±…ÍÑ	½ÑÑ½µlÁt€´±…å•É`¤€¼±…å•É]¥‘Ñ °€¡±…ÍÑ	½ÑÑ½µlÅt€´±…å•Éd¤€¼±…å•É!•¥¡Ñt°Á½Ì¤ì(€€€É•ÑÕÉ¸Á½Ì€¬ô€ÈÐì(€ô)ô)±…ÍÌÉ••É…Ý=ÕÑ±¥¹”•áÑ•¹‘Ì=ÕÑ±¥¹”ì(€€‰½àì(€€‰‰½à€ô¹•Ü±½…ÐÌÉÉÉ…ä Ð¤ì(€€¥¹¹•É5…É¥¸ì(€€¥Í1QHì(€€Á½¥¹ÑÌì(€€Í…±•…Ñ½Èì(€€½ÕÑ±¥¹”ì(€½¹ÍÑÉÕÑ½È¡½ÕÑ±¥¹”°Á½¥¹ÑÌ°‰½à°Í…±•…Ñ½È°¥¹¹•É5…É¥¸°¥Í1QH¤ì(€€€ÍÕÁ•È ¤ì(€€€Ñ¡¥Ì¸½ÕÑ±¥¹”€ô½ÕÑ±¥¹”ì(€€€Ñ¡¥Ì¸Á½¥¹ÑÌ€ôÁ½¥¹ÑÌì(€€€Ñ¡¥Ì¸‰½à€ô‰½àì(€€€Ñ¡¥Ì¸Í…±•…Ñ½È€ôÍ…±•…Ñ½Èì(€€€Ñ¡¥Ì¸¥¹¹•É5…É¥¸€ô¥¹¹•É5…É¥¸ì(€€€Ñ¡¥Ì¸¥Í1QH€ô¥Í1QHì(€€€Ñ¡¥Ì¹™¥ÉÍÑA½¥¹Ð€ôm9…8°9…9tì(€€€Ñ¡¥Ì¹±…ÍÑA½¥¹Ð€ôm9…8°9…9tì(€€€Ñ¡¥Ì¸½µÁÕÑ•5¥¹5…à¡¥Í1QH¤ì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸‰‰½àì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ô½ÕÑ±¥¹”¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€½ÕÑ±¥¹•m¥t€ô€¡½ÕÑ±¥¹•m¥t€´à¤€¼Ý¥‘Ñ ì(€€€€€½ÕÑ±¥¹•m¤€¬€Åt€ô€¡½ÕÑ±¥¹•m¤€¬€Åt€´ä¤€¼¡•¥¡Ðì(€€€ô(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÁ½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€Á½¥¹ÑÍm¥t€ô€¡Á½¥¹ÑÍm¥t€´à¤€¼Ý¥‘Ñ ì(€€€€€Á½¥¹ÑÍm¤€¬€Åt€ô€¡Á½¥¹ÑÍm¤€¬€Åt€´ä¤€¼¡•¥¡Ðì(€€€ô(€ô(€Ñ½MYA…Ñ  ¤ì(€€€½¹ÍÐ‰Õ™™•È€ôm4‘íÑ¡¥Ì¸½ÕÑ±¥¹•lÑuô€‘íÑ¡¥Ì¸½ÕÑ±¥¹•lÕuõtì(€€€™½È€¡±•Ð¤€ô€Ø°¥¤€ôÑ¡¥Ì¸½ÕÑ±¥¹”¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€Ø¤ì(€€€€€¥˜€¡¥Í9…8¡Ñ¡¥Ì¸½ÕÑ±¥¹•m¥t¤¤ì(€€€€€€€‰Õ™™•È¹ÁÕÍ ¡0‘íÑ¡¥Ì¸½ÕÑ±¥¹•m¤€¬€Ñuô€‘íÑ¡¥Ì¸½ÕÑ±¥¹•m¤€¬€Õuõ€¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€‰Õ™™•È¹ÁÕÍ ¡‘íÑ¡¥Ì¸½ÕÑ±¥¹•m¥uô€‘íÑ¡¥Ì¸½ÕÑ±¥¹•m¤€¬€Åuô€‘íÑ¡¥Ì¸½ÕÑ±¥¹•m¤€¬€Éuô€‘íÑ¡¥Ì¸½ÕÑ±¥¹•m¤€¬€Íuô€‘íÑ¡¥Ì¸½ÕÑ±¥¹•m¤€¬€Ñuô€‘íÑ¡¥Ì¸½ÕÑ±¥¹•m¤€¬€Õuõ€¤ì(€€€ô(€€€‰Õ™™•È¹ÁÕÍ  ‰hˆ¤ì(€€€É•ÑÕÉ¸‰Õ™™•È¹©½¥¸ ˆ€ˆ¤ì(€ô(€Í•É¥…±¥é”¡m‰±`°‰±d°ÑÉ`°ÑÉet°É½Ñ…Ñ¥½¸¤ì(€€€½¹ÍÐÝ¥‘Ñ €ôÑÉ`€´‰±`ì(€€€½¹ÍÐ¡•¥¡Ð€ôÑÉd€´‰±dì(€€€±•Ð½ÕÑ±¥¹”ì(€€€±•ÐÁ½¥¹ÑÌì(€€€ÍÝ¥Ñ €¡É½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€Àè(€€€€€€€½ÕÑ±¥¹”€ô=ÕÑ±¥¹”¹}É•Í…±”¡Ñ¡¥Ì¸½ÕÑ±¥¹”°‰±`°ÑÉd°Ý¥‘Ñ °€µ¡•¥¡Ð¤ì(€€€€€€€Á½¥¹ÑÌ€ô=ÕÑ±¥¹”¹}É•Í…±”¡Ñ¡¥Ì¸Á½¥¹ÑÌ°‰±`°ÑÉd°Ý¥‘Ñ °€µ¡•¥¡Ð¤ì(€€€€€€€‰É•…¬ì(€€€€€…Í”€äÀè(€€€€€€€½ÕÑ±¥¹”€ô=ÕÑ±¥¹”¹}É•Í…±•¹‘MÝ…À¡Ñ¡¥Ì¸½ÕÑ±¥¹”°‰±`°‰±d°Ý¥‘Ñ °¡•¥¡Ð¤ì(€€€€€€€Á½¥¹ÑÌ€ô=ÕÑ±¥¹”¹}É•Í…±•¹‘MÝ…À¡Ñ¡¥Ì¸Á½¥¹ÑÌ°‰±`°‰±d°Ý¥‘Ñ °¡•¥¡Ð¤ì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÄàÀè(€€€€€€€½ÕÑ±¥¹”€ô=ÕÑ±¥¹”¹}É•Í…±”¡Ñ¡¥Ì¸½ÕÑ±¥¹”°ÑÉ`°‰±d°€µÝ¥‘Ñ °¡•¥¡Ð¤ì(€€€€€€€Á½¥¹ÑÌ€ô=ÕÑ±¥¹”¹}É•Í…±”¡Ñ¡¥Ì¸Á½¥¹ÑÌ°ÑÉ`°‰±d°€µÝ¥‘Ñ °¡•¥¡Ð¤ì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÈÜÀè(€€€€€€€½ÕÑ±¥¹”€ô=ÕÑ±¥¹”¹}É•Í…±•¹‘MÝ…À¡Ñ¡¥Ì¸½ÕÑ±¥¹”°ÑÉ`°ÑÉd°€µÝ¥‘Ñ °€µ¡•¥¡Ð¤ì(€€€€€€€Á½¥¹ÑÌ€ô=ÕÑ±¥¹”¹}É•Í…±•¹‘MÝ…À¡Ñ¡¥Ì¸Á½¥¹ÑÌ°ÑÉ`°ÑÉd°€µÝ¥‘Ñ °€µ¡•¥¡Ð¤ì(€€€€€€€‰É•…¬ì(€€€ô(€€€É•ÑÕÉ¸ì(€€€€€½ÕÑ±¥¹”èÉÉ…ä¹™É½´¡½ÕÑ±¥¹”¤°(€€€€€Á½¥¹ÑÌèmÉÉ…ä¹™É½´¡Á½¥¹ÑÌ¥t(€€€ôì(€ô(€€½µÁÕÑ•5¥¹5…à¡¥Í1QH¤ì(€€€½¹ÍÐ½ÕÑ±¥¹”€ôÑ¡¥Ì¸½ÕÑ±¥¹”ì(€€€±•Ð±…ÍÑ`€ô½ÕÑ±¥¹•lÑtì(€€€±•Ð±…ÍÑd€ô½ÕÑ±¥¹•lÕtì(€€€½¹ÍÐµ¥¹5…à€ôm±…ÍÑ`°±…ÍÑd°±…ÍÑ`°±…ÍÑetì(€€€±•Ð™¥ÉÍÑA½¥¹Ñ`€ô±…ÍÑ`ì(€€€±•Ð™¥ÉÍÑA½¥¹Ñd€ô±…ÍÑdì(€€€±•Ð±…ÍÑA½¥¹Ñ`€ô±…ÍÑ`ì(€€€±•Ð±…ÍÑA½¥¹Ñd€ô±…ÍÑdì(€€€½¹ÍÐ±ÑÉ…±±‰…¬€ô¥Í1QH€ü5…Ñ ¹µ…à€è5…Ñ ¹µ¥¸ì(€€€½¹ÍÐ‰•é¥•É	‰½à€ô¹•Ü±½…ÐÌÉÉÉ…ä Ð¤ì(€€€™½È€¡±•Ð¤€ô€Ø°¥¤€ô½ÕÑ±¥¹”¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€Ø¤ì(€€€€€½¹ÍÐà€ô½ÕÑ±¥¹•m¤€¬€Ñt°(€€€€€€€ä€ô½ÕÑ±¥¹•m¤€¬€Õtì(€€€€€¥˜€¡¥Í9…8¡½ÕÑ±¥¹•m¥t¤¤ì(€€€€€€€UÑ¥°¹Á½¥¹Ñ	½Õ¹‘¥¹	½à¡à°ä°µ¥¹5…à¤ì(€€€€€€€¥˜€¡™¥ÉÍÑA½¥¹Ñd€øä¤ì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñ`€ôàì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñd€ôäì(€€€€€€€ô•±Í”¥˜€¡™¥ÉÍÑA½¥¹Ñd€ôôôä¤ì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñ`€ô±ÑÉ…±±‰…¬¡™¥ÉÍÑA½¥¹Ñ`°à¤ì(€€€€€€€ô(€€€€€€€¥˜€¡±…ÍÑA½¥¹Ñd€ðä¤ì(€€€€€€€€€±…ÍÑA½¥¹Ñ`€ôàì(€€€€€€€€€±…ÍÑA½¥¹Ñd€ôäì(€€€€€€€ô•±Í”¥˜€¡±…ÍÑA½¥¹Ñd€ôôôä¤ì(€€€€€€€€€±…ÍÑA½¥¹Ñ`€ô±ÑÉ…±±‰…¬¡±…ÍÑA½¥¹Ñ`°à¤ì(€€€€€€€ô(€€€€€ô•±Í”ì(€€€€€€€‰•é¥•É	‰½à¹Í•Ð¡		=a}%9%P°€À¤ì(€€€€€€€UÑ¥°¹‰•é¥•É	½Õ¹‘¥¹	½à¡±…ÍÑ`°±…ÍÑd°€¸¸¹½ÕÑ±¥¹”¹Í±¥”¡¤°¤€¬€Ø¤°‰•é¥•É	‰½à¤ì(€€€€€€€UÑ¥°¹É•Ñ	½Õ¹‘¥¹	½à ¸¸¹‰•é¥•É	‰½à°µ¥¹5…à¤ì(€€€€€€€¥˜€¡™¥ÉÍÑA½¥¹Ñd€ø‰•é¥•É	‰½álÅt¤ì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñ`€ô‰•é¥•É	‰½álÁtì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñd€ô‰•é¥•É	‰½álÅtì(€€€€€€€ô•±Í”¥˜€¡™¥ÉÍÑA½¥¹Ñd€ôôô‰•é¥•É	‰½álÅt¤ì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñ`€ô±ÑÉ…±±‰…¬¡™¥ÉÍÑA½¥¹Ñ`°‰•é¥•É	‰½álÁt¤ì(€€€€€€€ô(€€€€€€€¥˜€¡±…ÍÑA½¥¹Ñd€ð‰•é¥•É	‰½álÍt¤ì(€€€€€€€€€±…ÍÑA½¥¹Ñ`€ô‰•é¥•É	‰½álÉtì(€€€€€€€€€±…ÍÑA½¥¹Ñd€ô‰•é¥•É	‰½álÍtì(€€€€€€€ô•±Í”¥˜€¡±…ÍÑA½¥¹Ñd€ôôô‰•é¥•É	‰½álÍt¤ì(€€€€€€€€€±…ÍÑA½¥¹Ñ`€ô±ÑÉ…±±‰…¬¡±…ÍÑA½¥¹Ñ`°‰•é¥•É	‰½álÉt¤ì(€€€€€€€ô(€€€€€ô(€€€€€±…ÍÑ`€ôàì(€€€€€±…ÍÑd€ôäì(€€€ô(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¸‰‰½àì(€€€‰‰½álÁt€ôµ¥¹5…álÁt€´Ñ¡¥Ì¸¥¹¹•É5…É¥¸ì(€€€‰‰½álÅt€ôµ¥¹5…álÅt€´Ñ¡¥Ì¸¥¹¹•É5…É¥¸ì(€€€‰‰½álÉt€ôµ¥¹5…álÉt€´µ¥¹5…álÁt€¬€È€¨Ñ¡¥Ì¸¥¹¹•É5…É¥¸ì(€€€‰‰½álÍt€ôµ¥¹5…álÍt€´µ¥¹5…álÅt€¬€È€¨Ñ¡¥Ì¸¥¹¹•É5…É¥¸ì(€€€Ñ¡¥Ì¹™¥ÉÍÑA½¥¹Ð€ôm™¥ÉÍÑA½¥¹Ñ`°™¥ÉÍÑA½¥¹Ñetì(€€€Ñ¡¥Ì¹±…ÍÑA½¥¹Ð€ôm±…ÍÑA½¥¹Ñ`°±…ÍÑA½¥¹Ñetì(€ô(€•Ð‰½à ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸‰‰½àì(€ô(€¹•Ý=ÕÑ±¥¹•È¡à°ä°‰½à°Í…±•…Ñ½È°Ñ¡¥­¹•ÍÌ°¥Í1QH°¥¹¹•É5…É¥¸€ô€À¤ì(€€€É•ÑÕÉ¸¹•ÜÉ••É…Ý=ÕÑ±¥¹•È¡à°ä°‰½à°Í…±•…Ñ½È°Ñ¡¥­¹•ÍÌ°¥Í1QH°¥¹¹•É5…É¥¸¤ì(€ô(€ÕÁ‘…Ñ•Q¡¥­¹•ÍÌ¡Ñ¡¥­¹•ÍÌ¤ì(€€€½¹ÍÐ½ÕÑ±¥¹”€ôÑ¡¥Ì¹•Ñ9•Ý=ÕÑ±¥¹”¡Ñ¡¥­¹•ÍÌ¤ì(€€€Ñ¡¥Ì¸½ÕÑ±¥¹”€ô½ÕÑ±¥¹”¸½ÕÑ±¥¹”ì(€€€Ñ¡¥Ì¸Á½¥¹ÑÌ€ô½ÕÑ±¥¹”¸Á½¥¹ÑÌì(€€€Ñ¡¥Ì¸‰‰½à¹Í•Ð¡½ÕÑ±¥¹”¸‰‰½à¤ì(€€€Ñ¡¥Ì¹™¥ÉÍÑA½¥¹Ð€ô½ÕÑ±¥¹”¹™¥ÉÍÑA½¥¹Ðì(€€€Ñ¡¥Ì¹±…ÍÑA½¥¹Ð€ô½ÕÑ±¥¹”¹±…ÍÑA½¥¹Ðì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸‰‰½àì(€ô(€•Ñ9•Ý=ÕÑ±¥¹”¡Ñ¡¥­¹•ÍÌ°¥¹¹•É5…É¥¸¤ì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸‰‰½àì(€€€½¹ÍÐm±…å•É`°±…å•Éd°±…å•É]¥‘Ñ °±…å•É!•¥¡Ñt€ôÑ¡¥Ì¸‰½àì(€€€½¹ÍÐÍà€ôÝ¥‘Ñ €¨±…å•É]¥‘Ñ ì(€€€½¹ÍÐÍä€ô¡•¥¡Ð€¨±…å•É!•¥¡Ðì(€€€½¹ÍÐÑà€ôà€¨±…å•É]¥‘Ñ €¬±…å•É`ì(€€€½¹ÍÐÑä€ôä€¨±…å•É!•¥¡Ð€¬±…å•Édì(€€€½¹ÍÐÁ½¥¹ÑÌ€ôÑ¡¥Ì¸Á½¥¹ÑÌì(€€€½¹ÍÐ½ÕÑ±¥¹•È€ôÑ¡¥Ì¹¹•Ý=ÕÑ±¥¹•È¡Á½¥¹ÑÍlÁt€¨Íà€¬Ñà°Á½¥¹ÑÍlÅt€¨Íä€¬Ñä°Ñ¡¥Ì¸‰½à°Ñ¡¥Ì¸Í…±•…Ñ½È°Ñ¡¥­¹•ÍÌ°Ñ¡¥Ì¸¥Í1QH°¥¹¹•É5…É¥¸€üüÑ¡¥Ì¸¥¹¹•É5…É¥¸¤ì(€€€™½È€¡±•Ð¤€ô€È°¥¤€ôÁ½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€½ÕÑ±¥¹•È¹…‘¡Á½¥¹ÑÍm¥t€¨Íà€¬Ñà°Á½¥¹ÑÍm¤€¬€Åt€¨Íä€¬Ñä¤ì(€€€ô(€€€É•ÑÕÉ¸½ÕÑ±¥¹•È¹•Ñ=ÕÑ±¥¹•Ì ¤ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½‘É…Ý•ÉÌ½¡¥¡±¥¡Ð¹©Ì((()™Õ¹Ñ¥½¸•Ñ!¥¡±¥¡ÑMYAÉ½Á•ÉÑ¥•Ì¡½ÕÑ±¥¹”¤ì(€É•ÑÕÉ¸ì(€€€‰‰½àè½ÕÑ±¥¹”¹‰½à°(€€€É½½Ðèì(€€€€€Ù¥•Ý	½àè€ˆÀ€À€Ä€Äˆ(€€€ô°(€€€É½½Ñ±…ÍÌèì(€€€€€¡¥¡±¥¡ÐèÑÉÕ”°(€€€€€™É•”è½ÕÑ±¥¹”¹¥ÍÉ•”(€€€ô°(€€€Á…Ñ èì(€€€€€è½ÕÑ±¥¹”¹Ñ½MYA…Ñ  ¤(€€€ô(€ôì)ô)™Õ¹Ñ¥½¸•Ñ!¥¡±¥¡Ñ½ÕÍMYAÉ½Á•ÉÑ¥•Ì¡½ÕÑ±¥¹”°É½Ñ…Ñ¥½¸¤ì(€½¹ÍÐì(€€€™½ÕÍ=ÕÑ±¥¹”(€ô€ô½ÕÑ±¥¹”ì(€É•ÑÕÉ¸ì(€€€‰‰½àè=ÕÑ±¥¹”¹}É½Ñ…Ñ•	½à¡™½ÕÍ=ÕÑ±¥¹”¹‰½à°É½Ñ…Ñ¥½¸¤°(€€€É½½Ðèì(€€€€€€‰‘…Ñ„µµ…¥¸µÉ½Ñ…Ñ¥½¸ˆèÉ½Ñ…Ñ¥½¸(€€€ô°(€€€É½½Ñ±…ÍÌèì(€€€€€¡¥¡±¥¡Ñ=ÕÑ±¥¹”èÑÉÕ”°(€€€€€™É•”è½ÕÑ±¥¹”¹¥ÍÉ•”(€€€ô°(€€€Á…Ñ èì(€€€€€è™½ÕÍ=ÕÑ±¥¹”¹Ñ½MYA…Ñ  ¤(€€€ô(€ôì)ô)±…ÍÌ!¥¡±¥¡Ñ=ÕÑ±¥¹•Èì(€€‰½àì(€€™¥ÉÍÑA½¥¹Ðì(€€±…ÍÑA½¥¹Ðì(€€Ù•ÉÑ¥…±‘•Ì€ômtì(€€¥¹Ñ•ÉÙ…±Ì€ômtì(€½¹ÍÑÉÕÑ½È¡‰½á•Ì°‰½É‘•É]¥‘Ñ €ô€À°¥¹¹•É5…É¥¸€ô€À°¥Í1QH€ôÑÉÕ”¤ì(€€€½¹ÍÐµ¥¹5…à€ô		=a}%9%P¹Í±¥” ¤ì(€€€½¹ÍÐ9U5	I}=}%%QL€ô€Ðì(€€€½¹ÍÐAM%1=8€ô€ÄÀ€¨¨€µ9U5	I}=}%%QLì(€€€™½È€¡½¹ÍÐì(€€€€€à°(€€€€€ä°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô½˜‰½á•Ì¤ì(€€€€€½¹ÍÐàÄ€ô5…Ñ ¹™±½½È ¡à€´‰½É‘•É]¥‘Ñ ¤€¼AM%1=8¤€¨AM%1=8ì(€€€€€½¹ÍÐàÈ€ô5…Ñ ¹•¥° ¡à€¬Ý¥‘Ñ €¬‰½É‘•É]¥‘Ñ ¤€¼AM%1=8¤€¨AM%1=8ì(€€€€€½¹ÍÐäÄ€ô5…Ñ ¹™±½½È ¡ä€´‰½É‘•É]¥‘Ñ ¤€¼AM%1=8¤€¨AM%1=8ì(€€€€€½¹ÍÐäÈ€ô5…Ñ ¹•¥° ¡ä€¬¡•¥¡Ð€¬‰½É‘•É]¥‘Ñ ¤€¼AM%1=8¤€¨AM%1=8ì(€€€€€½¹ÍÐ±•™Ð€ômàÄ°äÄ°äÈ°ÑÉÕ•tì(€€€€€½¹ÍÐÉ¥¡Ð€ômàÈ°äÄ°äÈ°™…±Í•tì(€€€€€Ñ¡¥Ì¸Ù•ÉÑ¥…±‘•Ì¹ÁÕÍ ¡±•™Ð°É¥¡Ð¤ì(€€€€€UÑ¥°¹É•Ñ	½Õ¹‘¥¹	½à¡àÄ°äÄ°àÈ°äÈ°µ¥¹5…à¤ì(€€€ô(€€€½¹ÍÐ‰‰½á]¥‘Ñ €ôµ¥¹5…álÉt€´µ¥¹5…álÁt€¬€È€¨¥¹¹•É5…É¥¸ì(€€€½¹ÍÐ‰‰½á!•¥¡Ð€ôµ¥¹5…álÍt€´µ¥¹5…álÅt€¬€È€¨¥¹¹•É5…É¥¸ì(€€€½¹ÍÐÍ¡¥™Ñ•‘5¥¹`€ôµ¥¹5…álÁt€´¥¹¹•É5…É¥¸ì(€€€½¹ÍÐÍ¡¥™Ñ•‘5¥¹d€ôµ¥¹5…álÅt€´¥¹¹•É5…É¥¸ì(€€€±•Ð™¥ÉÍÑA½¥¹Ñ`€ô¥Í1QH€ü€µ%¹™¥¹¥Ñä€è%¹™¥¹¥Ñäì(€€€±•Ð™¥ÉÍÑA½¥¹Ñd€ô%¹™¥¹¥Ñäì(€€€½¹ÍÐ±…ÍÑ‘”€ôÑ¡¥Ì¸Ù•ÉÑ¥…±‘•Ì¹…Ð¡¥Í1QH€ü€´Ä€è€´È¤ì(€€€½¹ÍÐ±…ÍÑA½¥¹Ð€ôm±…ÍÑ‘•lÁt°±…ÍÑ‘•lÉutì(€€€™½È€¡½¹ÍÐ•‘”½˜Ñ¡¥Ì¸Ù•ÉÑ¥…±‘•Ì¤ì(€€€€€½¹ÍÐmà°äÄ°äÈ°±•™Ñt€ô•‘”ì(€€€€€¥˜€ …±•™Ð€˜˜¥Í1QH¤ì(€€€€€€€¥˜€¡äÄ€ð™¥ÉÍÑA½¥¹Ñd¤ì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñd€ôäÄì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñ`€ôàì(€€€€€€€ô•±Í”¥˜€¡äÄ€ôôô™¥ÉÍÑA½¥¹Ñd¤ì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñ`€ô5…Ñ ¹µ…à¡™¥ÉÍÑA½¥¹Ñ`°à¤ì(€€€€€€€ô(€€€€€ô•±Í”¥˜€¡±•™Ð€˜˜€…¥Í1QH¤ì(€€€€€€€¥˜€¡äÄ€ð™¥ÉÍÑA½¥¹Ñd¤ì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñd€ôäÄì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñ`€ôàì(€€€€€€€ô•±Í”¥˜€¡äÄ€ôôô™¥ÉÍÑA½¥¹Ñd¤ì(€€€€€€€€€™¥ÉÍÑA½¥¹Ñ`€ô5…Ñ ¹µ¥¸¡™¥ÉÍÑA½¥¹Ñ`°à¤ì(€€€€€€€ô(€€€€€ô(€€€€€•‘•lÁt€ô€¡à€´Í¡¥™Ñ•‘5¥¹`¤€¼‰‰½á]¥‘Ñ ì(€€€€€•‘•lÅt€ô€¡äÄ€´Í¡¥™Ñ•‘5¥¹d¤€¼‰‰½á!•¥¡Ðì(€€€€€•‘•lÉt€ô€¡äÈ€´Í¡¥™Ñ•‘5¥¹d¤€¼‰‰½á!•¥¡Ðì(€€€ô(€€€Ñ¡¥Ì¸‰½à€ô¹•Ü±½…ÐÌÉÉÉ…ä¡mÍ¡¥™Ñ•‘5¥¹`°Í¡¥™Ñ•‘5¥¹d°‰‰½á]¥‘Ñ °‰‰½á!•¥¡Ñt¤ì(€€€Ñ¡¥Ì¸™¥ÉÍÑA½¥¹Ð€ôm™¥ÉÍÑA½¥¹Ñ`°™¥ÉÍÑA½¥¹Ñetì(€€€Ñ¡¥Ì¸±…ÍÑA½¥¹Ð€ô±…ÍÑA½¥¹Ðì(€ô(€•Ñ=ÕÑ±¥¹•Ì ¤ì(€€€Ñ¡¥Ì¸Ù•ÉÑ¥…±‘•Ì¹Í½ÉÐ ¡„°ˆ¤€ôø…lÁt€´‰lÁtñð…lÅt€´‰lÅtñð…lÉt€´‰lÉt¤ì(€€€½¹ÍÐ½ÕÑ±¥¹•Y•ÉÑ¥…±‘•Ì€ômtì(€€€™½È€¡½¹ÍÐ•‘”½˜Ñ¡¥Ì¸Ù•ÉÑ¥…±‘•Ì¤ì(€€€€€¥˜€¡•‘•lÍt¤ì(€€€€€€€½ÕÑ±¥¹•Y•ÉÑ¥…±‘•Ì¹ÁÕÍ  ¸¸¹Ñ¡¥Ì¸‰É•…­‘”¡•‘”¤¤ì(€€€€€€€Ñ¡¥Ì¸¥¹Í•ÉÐ¡•‘”¤ì(€€€€€ô•±Í”ì(€€€€€€€Ñ¡¥Ì¸É•µ½Ù”¡•‘”¤ì(€€€€€€€½ÕÑ±¥¹•Y•ÉÑ¥…±‘•Ì¹ÁÕÍ  ¸¸¹Ñ¡¥Ì¸‰É•…­‘”¡•‘”¤¤ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¸•Ñ=ÕÑ±¥¹•Ì¡½ÕÑ±¥¹•Y•ÉÑ¥…±‘•Ì¤ì(€ô(€€•Ñ=ÕÑ±¥¹•Ì¡½ÕÑ±¥¹•Y•ÉÑ¥…±‘•Ì¤ì(€€€½¹ÍÐ•‘•Ì€ômtì(€€€½¹ÍÐ…±±‘•Ì€ô¹•ÜM•Ð ¤ì(€€€™½È€¡½¹ÍÐ•‘”½˜½ÕÑ±¥¹•Y•ÉÑ¥…±‘•Ì¤ì(€€€€€½¹ÍÐmà°äÄ°äÉt€ô•‘”ì(€€€€€•‘•Ì¹ÁÕÍ ¡mà°äÄ°•‘•t°mà°äÈ°•‘•t¤ì(€€€ô(€€€•‘•Ì¹Í½ÉÐ ¡„°ˆ¤€ôø…lÅt€´‰lÅtñð…lÁt€´‰lÁt¤ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ô•‘•Ì¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€½¹ÍÐ•‘”Ä€ô•‘•Ím¥ulÉtì(€€€€€½¹ÍÐ•‘”È€ô•‘•Ím¤€¬€ÅulÉtì(€€€€€•‘”Ä¹ÁÕÍ ¡•‘”È¤ì(€€€€€•‘”È¹ÁÕÍ ¡•‘”Ä¤ì(€€€€€…±±‘•Ì¹…‘¡•‘”Ä¤ì(€€€€€…±±‘•Ì¹…‘¡•‘”È¤ì(€€€ô(€€€½¹ÍÐ½ÕÑ±¥¹•Ì€ômtì(€€€±•Ð½ÕÑ±¥¹”ì(€€€Ý¡¥±”€¡…±±‘•Ì¹Í¥é”€ø€À¤ì(€€€€€½¹ÍÐ•‘”€ô…±±‘•Ì¹Ù…±Õ•Ì ¤¹¹•áÐ ¤¹Ù…±Õ”ì(€€€€€±•Ðmà°äÄ°äÈ°•‘”Ä°•‘”Ét€ô•‘”ì(€€€€€…±±‘•Ì¹‘•±•Ñ”¡•‘”¤ì(€€€€€±•Ð±…ÍÑA½¥¹Ñ`€ôàì(€€€€€±•Ð±…ÍÑA½¥¹Ñd€ôäÄì(€€€€€½ÕÑ±¥¹”€ômà°äÉtì(€€€€€½ÕÑ±¥¹•Ì¹ÁÕÍ ¡½ÕÑ±¥¹”¤ì(€€€€€Ý¡¥±”€¡ÑÉÕ”¤ì(€€€€€€€±•Ð”ì(€€€€€€€¥˜€¡…±±‘•Ì¹¡…Ì¡•‘”Ä¤¤ì(€€€€€€€€€”€ô•‘”Äì(€€€€€€€ô•±Í”¥˜€¡…±±‘•Ì¹¡…Ì¡•‘”È¤¤ì(€€€€€€€€€”€ô•‘”Èì(€€€€€€€ô•±Í”ì(€€€€€€€€€‰É•…¬ì(€€€€€€€ô(€€€€€€€…±±‘•Ì¹‘•±•Ñ”¡”¤ì(€€€€€€€mà°äÄ°äÈ°•‘”Ä°•‘”Ét€ô”ì(€€€€€€€¥˜€¡±…ÍÑA½¥¹Ñ`€„ôôà¤ì(€€€€€€€€€½ÕÑ±¥¹”¹ÁÕÍ ¡±…ÍÑA½¥¹Ñ`°±…ÍÑA½¥¹Ñd°à°±…ÍÑA½¥¹Ñd€ôôôäÄ€üäÄ€èäÈ¤ì(€€€€€€€€€±…ÍÑA½¥¹Ñ`€ôàì(€€€€€€€ô(€€€€€€€±…ÍÑA½¥¹Ñd€ô±…ÍÑA½¥¹Ñd€ôôôäÄ€üäÈ€èäÄì(€€€€€ô(€€€€€½ÕÑ±¥¹”¹ÁÕÍ ¡±…ÍÑA½¥¹Ñ`°±…ÍÑA½¥¹Ñd¤ì(€€€ô(€€€É•ÑÕÉ¸¹•Ü!¥¡±¥¡Ñ=ÕÑ±¥¹”¡½ÕÑ±¥¹•Ì°Ñ¡¥Ì¸‰½à°Ñ¡¥Ì¸™¥ÉÍÑA½¥¹Ð°Ñ¡¥Ì¸±…ÍÑA½¥¹Ð¤ì(€ô(€€‰¥¹…ÉåM•…É ¡ä¤ì(€€€½¹ÍÐ…ÉÉ…ä€ôÑ¡¥Ì¸¥¹Ñ•ÉÙ…±Ìì(€€€±•ÐÍÑ…ÉÐ€ô€Àì(€€€±•Ð•¹€ô…ÉÉ…ä¹±•¹Ñ €´€Äì(€€€Ý¡¥±”€¡ÍÑ…ÉÐ€ðô•¹¤ì(€€€€€½¹ÍÐµ¥‘‘±”€ôÍÑ…ÉÐ€¬•¹€øø€Äì(€€€€€½¹ÍÐäÄ€ô…ÉÉ…åmµ¥‘‘±•ulÁtì(€€€€€¥˜€¡äÄ€ôôôä¤ì(€€€€€€€É•ÑÕÉ¸µ¥‘‘±”ì(€€€€€ô(€€€€€¥˜€¡äÄ€ðä¤ì(€€€€€€€ÍÑ…ÉÐ€ôµ¥‘‘±”€¬€Äì(€€€€€ô•±Í”ì(€€€€€€€•¹€ôµ¥‘‘±”€´€Äì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸•¹€¬€Äì(€ô(€€¥¹Í•ÉÐ¡l°äÄ°äÉt¤ì(€€€½¹ÍÐ¥¹‘•à€ôÑ¡¥Ì¸‰¥¹…ÉåM•…É ¡äÄ¤ì(€€€Ñ¡¥Ì¸¥¹Ñ•ÉÙ…±Ì¹ÍÁ±¥”¡¥¹‘•à°€À°mäÄ°äÉt¤ì(€ô(€€É•µ½Ù”¡l°äÄ°äÉt¤ì(€€€½¹ÍÐ¥¹‘•à€ôÑ¡¥Ì¸‰¥¹…ÉåM•…É ¡äÄ¤ì(€€€™½È€¡±•Ð¤€ô¥¹‘•àì¤€ðÑ¡¥Ì¸¥¹Ñ•ÉÙ…±Ì¹±•¹Ñ ì¤¬¬¤ì(€€€€€½¹ÍÐmÍÑ…ÉÐ°•¹‘t€ôÑ¡¥Ì¸¥¹Ñ•ÉÙ…±Ím¥tì(€€€€€¥˜€¡ÍÑ…ÉÐ€„ôôäÄ¤ì(€€€€€€€‰É•…¬ì(€€€€€ô(€€€€€¥˜€¡ÍÑ…ÉÐ€ôôôäÄ€˜˜•¹€ôôôäÈ¤ì(€€€€€€€Ñ¡¥Ì¸¥¹Ñ•ÉÙ…±Ì¹ÍÁ±¥”¡¤°€Ä¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€ô(€€€™½È€¡±•Ð¤€ô¥¹‘•à€´€Äì¤€øô€Àì¤´´¤ì(€€€€€½¹ÍÐmÍÑ…ÉÐ°•¹‘t€ôÑ¡¥Ì¸¥¹Ñ•ÉÙ…±Ím¥tì(€€€€€¥˜€¡ÍÑ…ÉÐ€„ôôäÄ¤ì(€€€€€€€‰É•…¬ì(€€€€€ô(€€€€€¥˜€¡ÍÑ…ÉÐ€ôôôäÄ€˜˜•¹€ôôôäÈ¤ì(€€€€€€€Ñ¡¥Ì¸¥¹Ñ•ÉÙ…±Ì¹ÍÁ±¥”¡¤°€Ä¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€ô(€ô(€€‰É•…­‘”¡•‘”¤ì(€€€½¹ÍÐmà°äÄ°äÉt€ô•‘”ì(€€€½¹ÍÐÉ•ÍÕ±ÑÌ€ômmà°äÄ°äÉutì(€€€½¹ÍÐ¥¹‘•à€ôÑ¡¥Ì¸‰¥¹…ÉåM•…É ¡äÈ¤ì(€€€™½È€¡±•Ð¤€ô€Àì¤€ð¥¹‘•àì¤¬¬¤ì(€€€€€½¹ÍÐmÍÑ…ÉÐ°•¹‘t€ôÑ¡¥Ì¸¥¹Ñ•ÉÙ…±Ím¥tì(€€€€€™½È€¡±•Ð¨€ô€À°©¨€ôÉ•ÍÕ±ÑÌ¹±•¹Ñ ì¨€ð©¨ì¨¬¬¤ì(€€€€€€€½¹ÍÐl°äÌ°äÑt€ôÉ•ÍÕ±ÑÍm©tì(€€€€€€€¥˜€¡•¹€ðôäÌñðäÐ€ðôÍÑ…ÉÐ¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€¥˜€¡äÌ€øôÍÑ…ÉÐ¤ì(€€€€€€€€€¥˜€¡äÐ€ø•¹¤ì(€€€€€€€€€€€É•ÍÕ±ÑÍm©ulÅt€ô•¹ì(€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€¥˜€¡©¨€ôôô€Ä¤ì(€€€€€€€€€€€€€É•ÑÕÉ¸mtì(€€€€€€€€€€€ô(€€€€€€€€€€€É•ÍÕ±ÑÌ¹ÍÁ±¥”¡¨°€Ä¤ì(€€€€€€€€€€€¨´´ì(€€€€€€€€€€€©¨´´ì(€€€€€€€€€ô(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€É•ÍÕ±ÑÍm©ulÉt€ôÍÑ…ÉÐì(€€€€€€€¥˜€¡äÐ€ø•¹¤ì(€€€€€€€€€É•ÍÕ±ÑÌ¹ÁÕÍ ¡mà°•¹°äÑt¤ì(€€€€€€€ô(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸É•ÍÕ±ÑÌì(€ô)ô)±…ÍÌ!¥¡±¥¡Ñ=ÕÑ±¥¹”•áÑ•¹‘Ì=ÕÑ±¥¹”ì(€€‰½àì(€€‰½á•Ì€ô¹Õ±°ì(€€½ÕÑ±¥¹•Ìì(€½¹ÍÑÉÕÑ½È¡½ÕÑ±¥¹•Ì°‰½à°™¥ÉÍÑA½¥¹Ð°±…ÍÑA½¥¹Ð¤ì(€€€ÍÕÁ•È ¤ì(€€€Ñ¡¥Ì¸½ÕÑ±¥¹•Ì€ô½ÕÑ±¥¹•Ìì(€€€Ñ¡¥Ì¸‰½à€ô‰½àì(€€€Ñ¡¥Ì¹™¥ÉÍÑA½¥¹Ð€ô™¥ÉÍÑA½¥¹Ðì(€€€Ñ¡¥Ì¹±…ÍÑA½¥¹Ð€ô±…ÍÑA½¥¹Ðì(€ô(€ÍÑ…Ñ¥Œ‰Õ¥±¡‰½á•Ì°¥Í1QH¤ì(€€€½¹ÍÐ½ÕÑ±¥¹”€ô¹•Ü!¥¡±¥¡Ñ=ÕÑ±¥¹•È¡‰½á•Ì°€À¸ÀÀÄ¤¹•Ñ=ÕÑ±¥¹•Ì ¤ì(€€€½ÕÑ±¥¹”¸‰½á•Ì€ô‰½á•Ìì(€€€½ÕÑ±¥¹”¹™½ÕÍ=ÕÑ±¥¹”€ô¹•Ü!¥¡±¥¡Ñ=ÕÑ±¥¹•È¡‰½á•Ì°€À¸ÀÀÈÔ°€À¸ÀÀÄ°¥Í1QH¤¹•Ñ=ÕÑ±¥¹•Ì ¤ì(€€€É•ÑÕÉ¸½ÕÑ±¥¹”ì(€ô(€•Ð¥ÍÉ•” ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€•Ð‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ì ¤ì(€€€É•ÑÕÉ¸•Ñ!¥¡±¥¡ÑMYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¤ì(€ô(€•Ñ½ÕÍMYAÉ½Á•ÉÑ¥•Ì¡É½Ñ…Ñ¥½¸¤ì(€€€É•ÑÕÉ¸•Ñ!¥¡±¥¡Ñ½ÕÍMYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì°É½Ñ…Ñ¥½¸¤ì(€ô(€ÕÁ‘…Ñ•I½Ñ…Ñ¥½¸¡É½Ñ…Ñ¥½¸¤ì(€€€É•ÑÕÉ¸ì(€€€€€É½½Ðèì(€€€€€€€€‰‘…Ñ„µµ…¥¸µÉ½Ñ…Ñ¥½¸ˆèÉ½Ñ…Ñ¥½¸(€€€€€ô(€€€ôì(€ô(€Í•É¥…±¥é•EÕ…‘A½¥¹ÑÌ¡mÁ…•`°Á…•et°mÁ…•]¥‘Ñ °Á…•!•¥¡Ñt¤ì(€€€½¹ÍÐ‰½á•Ì€ôÑ¡¥Ì¸‰½á•Ìì(€€€½¹ÍÐÅÕ…‘A½¥¹ÑÌ€ô¹•Ü±½…ÐÌÉÉÉ…ä¡‰½á•Ì¹±•¹Ñ €¨€à¤ì(€€€±•Ð¤€ô€Àì(€€€™½È€¡½¹ÍÐì(€€€€€à°(€€€€€ä°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô½˜‰½á•Ì¤ì(€€€€€½¹ÍÐÍà€ôà€¨Á…•]¥‘Ñ €¬Á…•`ì(€€€€€½¹ÍÐÍä€ô€ Ä€´ä¤€¨Á…•!•¥¡Ð€¬Á…•dì(€€€€€ÅÕ…‘A½¥¹ÑÍm¥t€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Ñt€ôÍàì(€€€€€ÅÕ…‘A½¥¹ÑÍm¤€¬€Åt€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Ít€ôÍäì(€€€€€ÅÕ…‘A½¥¹ÑÍm¤€¬€Ét€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Ùt€ôÍà€¬Ý¥‘Ñ €¨Á…•]¥‘Ñ ì(€€€€€ÅÕ…‘A½¥¹ÑÍm¤€¬€Õt€ôÅÕ…‘A½¥¹ÑÍm¤€¬€Ýt€ôÍä€´¡•¥¡Ð€¨Á…•!•¥¡Ðì(€€€€€¤€¬ô€àì(€€€ô(€€€É•ÑÕÉ¸ÅÕ…‘A½¥¹ÑÌì(€ô(€Ñ½MYA…Ñ  ¤ì(€€€½¹ÍÐ‰Õ™™•È€ômtì(€€€™½È€¡½¹ÍÐÁ½±å½¸½˜Ñ¡¥Ì¸½ÕÑ±¥¹•Ì¤ì(€€€€€±•ÐmÁÉ•Ù`°ÁÉ•Ùet€ôÁ½±å½¸ì(€€€€€‰Õ™™•È¹ÁÕÍ ¡4‘íÁÉ•Ùaô€‘íÁÉ•Ùeõ€¤ì(€€€€€™½È€¡±•Ð¤€ô€Èì¤€ðÁ½±å½¸¹±•¹Ñ ì¤€¬ô€È¤ì(€€€€€€€½¹ÍÐà€ôÁ½±å½¹m¥tì(€€€€€€€½¹ÍÐä€ôÁ½±å½¹m¤€¬€Åtì(€€€€€€€¥˜€¡à€ôôôÁÉ•Ù`¤ì(€€€€€€€€€‰Õ™™•È¹ÁÕÍ ¡X‘íåõ€¤ì(€€€€€€€€€ÁÉ•Ùd€ôäì(€€€€€€€ô•±Í”¥˜€¡ä€ôôôÁÉ•Ùd¤ì(€€€€€€€€€‰Õ™™•È¹ÁÕÍ ¡ ‘íáõ€¤ì(€€€€€€€€€ÁÉ•Ù`€ôàì(€€€€€€€ô(€€€€€ô(€€€€€‰Õ™™•È¹ÁÕÍ  ‰hˆ¤ì(€€€ô(€€€É•ÑÕÉ¸‰Õ™™•È¹©½¥¸ ˆ€ˆ¤ì(€ô(€Í•É¥…±¥é”¡m‰±`°‰±d°ÑÉ`°ÑÉet°}É½Ñ…Ñ¥½¸¤ì(€€€½¹ÍÐ½ÕÑ±¥¹•Ì€ômtì(€€€½¹ÍÐÝ¥‘Ñ €ôÑÉ`€´‰±`ì(€€€½¹ÍÐ¡•¥¡Ð€ôÑÉd€´‰±dì(€€€™½È€¡½¹ÍÐ½ÕÑ±¥¹”½˜Ñ¡¥Ì¸½ÕÑ±¥¹•Ì¤ì(€€€€€½¹ÍÐÁ½¥¹ÑÌ€ô¹•ÜÉÉ…ä¡½ÕÑ±¥¹”¹±•¹Ñ ¤ì(€€€€€™½È€¡±•Ð¤€ô€Àì¤€ð½ÕÑ±¥¹”¹±•¹Ñ ì¤€¬ô€È¤ì(€€€€€€€Á½¥¹ÑÍm¥t€ô‰±`€¬½ÕÑ±¥¹•m¥t€¨Ý¥‘Ñ ì(€€€€€€€Á½¥¹ÑÍm¤€¬€Åt€ôÑÉd€´½ÕÑ±¥¹•m¤€¬€Åt€¨¡•¥¡Ðì(€€€€€ô(€€€€€½ÕÑ±¥¹•Ì¹ÁÕÍ ¡Á½¥¹ÑÌ¤ì(€€€ô(€€€É•ÑÕÉ¸½ÕÑ±¥¹•Ìì(€ô(€•Ð‰½à ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸‰½àì(€ô)ô)±…ÍÌÉ••!¥¡±¥¡Ñ=ÕÑ±¥¹•È•áÑ•¹‘ÌÉ••É…Ý=ÕÑ±¥¹•Èì(€¹•ÝÉ••É…Ý=ÕÑ±¥¹”¡½ÕÑ±¥¹”°Á½¥¹ÑÌ°‰½à°Í…±•…Ñ½È°¥¹¹•É5…É¥¸°¥Í1QH¤ì(€€€É•ÑÕÉ¸¹•ÜÉ••!¥¡±¥¡Ñ=ÕÑ±¥¹”¡½ÕÑ±¥¹”°Á½¥¹ÑÌ°‰½à°Í…±•…Ñ½È°¥¹¹•É5…É¥¸°¥Í1QH¤ì(€ô)ô)±…ÍÌÉ••!¥¡±¥¡ÑÉ…Ý•Èì(€€½ÕÑ±¥¹•Èì(€€Ñ¡¥­¹•ÍÌì(€½¹ÍÑÉÕÑ½È¡à°ä°‰½à°Í…±•…Ñ½È°Ñ¡¥­¹•ÍÌ°¥Í1QH°¥¹¹•É5…É¥¸¤ì(€€€Ñ¡¥Ì¸½ÕÑ±¥¹•È€ô¹•ÜÉ••!¥¡±¥¡Ñ=ÕÑ±¥¹•È¡à°ä°‰½à°Í…±•…Ñ½È°Ñ¡¥­¹•ÍÌ°¥Í1QH°¥¹¹•É5…É¥¸¤ì(€€€Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌ€ôÑ¡¥­¹•ÍÌì(€ô(€…‘¡à°ä¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½ÕÑ±¥¹•È¹…‘¡à°ä¤€üì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¸½ÕÑ±¥¹•È¹Ñ½MYA…Ñ  ¤(€€€€€ô(€€€ô€è¹Õ±°ì(€ô(€…‘‘A½¥¹ÑÌ¡Á½¥¹ÑÌ¤ì(€€€±•Ð¡…Í¡…¹•€ô™…±Í”ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÁ½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€¡…Í¡…¹•€ôÑ¡¥Ì¸½ÕÑ±¥¹•È¹…‘¡Á½¥¹ÑÍm¥t°Á½¥¹ÑÍm¤€¬€Åt¤ñð¡…Í¡…¹•ì(€€€ô(€€€É•ÑÕÉ¸¡…Í¡…¹•€üì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¸½ÕÑ±¥¹•È¹Ñ½MYA…Ñ  ¤(€€€€€ô(€€€ô€è¹Õ±°ì(€ô(€•¹¡à°ä¤ì(€€€É•ÑÕÉ¸à€ôôôÕ¹‘•™¥¹•€ü¹Õ±°€èÑ¡¥Ì¹…‘¡à°ä¤ì(€ô(€¥ÍµÁÑä ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½ÕÑ±¥¹•È¹¥ÍµÁÑä ¤ì(€ô(€¥Í…¹•±±…‰±” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½ÕÑ±¥¹•È¹¥Í…¹•±±…‰±” ¤ì(€ô(€É•µ½Ù•1…ÍÑ±•µ•¹Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½ÕÑ±¥¹•È¹É•µ½Ù•1…ÍÑ±•µ•¹Ð ¤ì(€ô(€ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡}¹…µ”°}Ù…±Õ”¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€•Ñ=ÕÑ±¥¹•Ì ¤ì(€€€½¹ÍÐ½ÕÑ±¥¹•Ì€ôÑ¡¥Ì¸½ÕÑ±¥¹•È¹•Ñ=ÕÑ±¥¹•Ì ¤ì(€€€½ÕÑ±¥¹•Ì¹‰Õ¥±‘½ÕÍ=ÕÑ±¥¹” È€¨Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌ¤ì(€€€É•ÑÕÉ¸½ÕÑ±¥¹•Ìì(€ô(€•Ð‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ì ¤ì(€€€É•ÑÕÉ¸ì(€€€€€‰‰½àèlÀ°€À°€Ä°€Åt°(€€€€€É½½Ðèì(€€€€€€€Ù¥•Ý	½àè€ˆÀ€À€Ä€Äˆ(€€€€€ô°(€€€€€É½½Ñ±…ÍÌèì(€€€€€€€¡¥¡±¥¡ÐèÑÉÕ”°(€€€€€€€™É•”èÑÉÕ”(€€€€€ô°(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¸½ÕÑ±¥¹•È¹Ñ½MYA…Ñ  ¤(€€€€€ô(€€€ôì(€ô)ô)±…ÍÌÉ••!¥¡±¥¡Ñ=ÕÑ±¥¹”•áÑ•¹‘ÌÉ••É…Ý=ÕÑ±¥¹”ì(€ÍÑ…Ñ¥Œ€aQI}Q!%-9ML€ô€Ä¸Ôì(€¹•Ý=ÕÑ±¥¹•È¡à°ä°‰½à°Í…±•…Ñ½È°Ñ¡¥­¹•ÍÌ°¥Í1QH°¥¹¹•É5…É¥¸€ô€À¤ì(€€€É•ÑÕÉ¸¹•ÜÉ••!¥¡±¥¡Ñ=ÕÑ±¥¹•È¡à°ä°‰½à°Í…±•…Ñ½È°Ñ¡¥­¹•ÍÌ°¥Í1QH°¥¹¹•É5…É¥¸¤ì(€ô(€•Ð¥ÍÉ•” ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€‰Õ¥±‘½ÕÍ=ÕÑ±¥¹”¡Ñ¡¥­¹•ÍÌ¤ì(€€€Ñ¡¥Ì¹™½ÕÍ=ÕÑ±¥¹”€ôÑ¡¥Ì¹•Ñ9•Ý=ÕÑ±¥¹”¡Ñ¡¥­¹•ÍÌ€¼€È€¬É••!¥¡±¥¡Ñ=ÕÑ±¥¹”¸aQI}Q!%-9ML°€À¸ÀÀÈÔ¤ì(€ô(€•Ð‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ì ¤ì(€€€É•ÑÕÉ¸•Ñ!¥¡±¥¡ÑMYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¤ì(€ô(€•Ñ½ÕÍMYAÉ½Á•ÉÑ¥•Ì¡É½Ñ…Ñ¥½¸¤ì(€€€É•ÑÕÉ¸•Ñ!¥¡±¥¡Ñ½ÕÍMYAÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì°É½Ñ…Ñ¥½¸¤ì(€ô(€•Ð™½ÕÍ5ÕÍÑI•µ½Ù•M•±™%¹Ñ•ÉÍ•Ñ¥½¹Ì ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€ÕÁ‘…Ñ•I½Ñ…Ñ¥½¸¡É½Ñ…Ñ¥½¸¤ì(€€€É•ÑÕÉ¸ì(€€€€€É½½Ðèì(€€€€€€€€‰‘…Ñ„µµ…¥¸µÉ½Ñ…Ñ¥½¸ˆèÉ½Ñ…Ñ¥½¸(€€€€€ô(€€€ôì(€ô(€ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€¥˜€¡¹…µ”€„ôô€‰Ñ¡¥­¹•ÍÌˆ¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¹ÕÁ‘…Ñ•Q¡¥­¹•ÍÌ¡Ù…±Õ”€¼€È¤ì(€€€Ñ¡¥Ì¹‰Õ¥±‘½ÕÍ=ÕÑ±¥¹”¡Ù…±Õ”¤ì(€€€É•ÑÕÉ¸‰‰½àì(€ô(€•ÑA…Ñ¡I•Í¥é•‘MYAÉ½Á•ÉÑ¥•Ì ¤ì(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤(€€€€€ô(€€€ôì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½¡¥¡±¥¡Ð¹©Ì(((((((()±…ÍÌ!¥¡±¥¡ÑÉ…Ý¥¹=ÁÑ¥½¹Ì•áÑ•¹‘ÌÉ…Ý¥¹=ÁÑ¥½¹Ìì(€½¹ÍÑÉÕÑ½È¡ÁÉ½Á•ÉÑ¥•Ì€ô¹Õ±°¤ì(€€€ÍÕÁ•È ¤ì(€€€ÍÕÁ•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡ÁÉ½Á•ÉÑ¥•Ì¤ì(€ô(€ÕÁ‘…Ñ•MYAÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€¥˜€¡¹…µ”€„ôô€‰Ñ¡¥­¹•ÍÌˆ¤ì(€€€€€ÍÕÁ•È¹ÕÁ‘…Ñ•MYAÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€ô(€ô(€±½¹” ¤ì(€€€½¹ÍÐ±½¹”€ô¹•Ü!¥¡±¥¡ÑÉ…Ý¥¹=ÁÑ¥½¹Ì ¤ì(€€€±½¹”¹ÕÁ‘…Ñ•±°¡Ñ¡¥Ì¤ì(€€€É•ÑÕÉ¸±½¹”ì(€ô)ô)±…ÍÌ!¥¡±¥¡Ñ‘¥Ñ½È•áÑ•¹‘ÌÉ…Ý¥¹‘¥Ñ½Èì(€€…¹¡½É9½‘”€ô¹Õ±°ì(€€…¹¡½É=™™Í•Ð€ô€Àì(€€™½ÕÍ9½‘”€ô¹Õ±°ì(€€™½ÕÍ=™™Í•Ð€ô€Àì(€€µ•Ñ¡½‘=™É•…Ñ¥½¸€ô€ˆˆì(€€Ñ•áÐ€ô€ˆˆì(€ÍÑ…Ñ¥Œ}U1Q}=A%Qd€ô€Äì(€ÍÑ…Ñ¥Œ}U1Q}Q!%-9ML€ô€ÄÈì(€ÍÑ…Ñ¥Œ}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ}ÑåÁ”€ô€‰¡¥¡±¥¡Ðˆì(€ÍÑ…Ñ¥Œ}•‘¥Ñ½ÉQåÁ”€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹!%!1%!Pì(€ÍÑ…Ñ¥Œ•Ð}­•å‰½…É‘5…¹…•È ¤ì(€€€½¹ÍÐÁÉ½Ñ¼€ô!¥¡±¥¡Ñ‘¥Ñ½È¹ÁÉ½Ñ½ÑåÁ”ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰}­•å‰½…É‘5…¹…•Èˆ°¹•Ü-•å‰½…É‘5…¹…•È¡mml‰ÉÉ½Ý1•™Ð‰t°ÁÉ½Ñ¼¹}µ½Ù•…É•Ð°ì(€€€€€…ÉÌèlÁt(€€€õt°ml‰ÉÉ½ÝI¥¡Ð‰t°ÁÉ½Ñ¼¹}µ½Ù•…É•Ð°ì(€€€€€…ÉÌèlÅt(€€€õt°ml‰ÉÉ½ÝUÀ‰t°ÁÉ½Ñ¼¹}µ½Ù•…É•Ð°ì(€€€€€…ÉÌèlÉt(€€€õt°ml‰ÉÉ½Ý½Ý¸‰t°ÁÉ½Ñ¼¹}µ½Ù•…É•Ð°ì(€€€€€…ÉÌèlÍt(€€€õut¤¤ì(€ô(€½¹ÍÑÉÕÑ½È¡Á…É…µÌ¤ì(€€€ÍÕÁ•È¡ì(€€€€€€¸¸¹Á…É…µÌ°(€€€€€¹…µ”è€‰¡¥¡±¥¡Ñ‘¥Ñ½Èˆ(€€€ô¤ì(€€€Ñ¡¥Ì¸…¹¡½É9½‘”€ôÁ…É…µÌ¹…¹¡½É9½‘”ñð¹Õ±°ì(€€€Ñ¡¥Ì¸…¹¡½É=™™Í•Ð€ôÁ…É…µÌ¹…¹¡½É=™™Í•Ðñð€Àì(€€€Ñ¡¥Ì¸™½ÕÍ9½‘”€ôÁ…É…µÌ¹™½ÕÍ9½‘”ñð¹Õ±°ì(€€€Ñ¡¥Ì¸™½ÕÍ=™™Í•Ð€ôÁ…É…µÌ¹™½ÕÍ=™™Í•Ðñð€Àì(€€€Ñ¡¥Ì¸µ•Ñ¡½‘=™É•…Ñ¥½¸€ôÁ…É…µÌ¹µ•Ñ¡½‘=™É•…Ñ¥½¸ñð€¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ìü¹¥ÍÉ•”€ü€‰µ…¥¹}Ñ½½±‰…Èˆ€è€ˆˆ¤ì(€€€Ñ¡¥Ì¸Ñ•áÐ€ôÁ…É…µÌ¹Ñ•áÐñð€ˆˆì(€€€Ñ¡¥Ì¹}¥ÍÉ……‰±”€ô™…±Í”ì(€€€Ñ¡¥Ì¹‘•™…Õ±Ñ0ÄÁ¹%€ô€‰Á‘™©Ìµ•‘¥Ñ½Èµ¡¥¡±¥¡Ðµ•‘¥Ñ½Èˆì(€€€Ñ¡¥Ì¹É½Ñ…Ñ” ¤ì(€ô(€ÍÑ…Ñ¥Œ¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ìñðô¹•Ü!¥¡±¥¡ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¡ì(€€€€€™¥±°èÕ¥5…¹…•È¹¡¥¡±¥¡Ñ½±½ÉÌü¹Ù…±Õ•Ì ¤¹¹•áÐ ¤¹Ù…±Õ”ñð€ˆ™™˜ÀØØˆ°(€€€€€€‰™¥±°µ½Á…¥Ñäˆè!¥¡±¥¡Ñ‘¥Ñ½È¹}U1Q}=A%Qd°(€€€€€Ñ¡¥­¹•ÍÌè!¥¡±¥¡Ñ‘¥Ñ½È¹}U1Q}Q!%-9ML(€€€ô¤ì(€ô(€ÍÑ…Ñ¥Œ•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¡½ÁÑ¥½¹Ì¤ì(€€€½¹ÍÐ±½¹”€ôÑ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹±½¹” ¤ì(€€€±½¹”¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡½ÁÑ¥½¹Ì¤ì(€€€É•ÑÕÉ¸±½¹”ì(€ô(€ÍÑ…Ñ¥Œ•ÐÑåÁ•Í5…À ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰ÑåÁ•Í5…Àˆ°¹•Ü5…À¡mm¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹!%!1%!Q}=1=H°€‰™¥±°‰t°m¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹!%!1%!Q}Q!%-9ML°€‰Ñ¡¥­¹•ÍÌ‰ut¤¤ì(€ô(€ÍÑ…Ñ¥Œ•Ð¥ÍÉ…Ý•È ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€ÍÑ…Ñ¥Œ•Ð}¡…Í±¥ÁA…Ñ  ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€ÍÑ…Ñ¥Œ•Ð}¡…ÍÉ…Ý±…ÍÌ ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€}…‘‘=ÕÑ±¥¹•Ì¡Á…É…µÌ¤ì(€€€½¹ÍÐì(€€€€€‰½á•Ì°(€€€€€‘É…Ý=ÕÑ±¥¹•Ì(€€€ô€ôÁ…É…µÌì(€€€¥˜€ …‰½á•Ì€˜˜€…‘É…Ý=ÕÑ±¥¹•Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹ÌñðôÁ…É…µÌ¹‘É…Ý¥¹=ÁÑ¥½¹Ìñð!¥¡±¥¡Ñ‘¥Ñ½È¹•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì ¤ì(€€€¥˜€¡‰½á•Ì¤ì(€€€€€Á…É…µÌ€ôì(€€€€€€€€¸¸¹Á…É…µÌ°(€€€€€€€‘É…Ý=ÕÑ±¥¹•Ìè!¥¡±¥¡Ñ=ÕÑ±¥¹”¹‰Õ¥±¡‰½á•Ì°Ñ¡¥Ì¹}Õ¥5…¹…•È¹‘¥É•Ñ¥½¸€ôôô€‰±ÑÈˆ¤(€€€€€ôì(€€€ô(€€€ÍÕÁ•È¹}…‘‘=ÕÑ±¥¹•Ì¡Á…É…µÌ¤ì(€ô(€•Ð½±½ÉQåÁ” ¤ì(€€€É•ÑÕÉ¸¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹!%!1%!Q}=1=Hì(€ô(€•Ð½±½È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì¹™¥±°ì(€ô(€•Ð½Á…¥Ñä ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Íl‰™¥±°µ½Á…¥Ñä‰tì(€ô(€•Ð}½Á…¥Ñå9…µ” ¤ì(€€€É•ÑÕÉ¸€‰™¥±°µ½Á…¥Ñäˆì(€ô(€•Ð}‘É…ÝI½Ñ…Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ìü¹¥ÍÉ•”€üÑ¡¥Ì¹É½Ñ…Ñ¥½¸€è€Àì(€ô(€•Ð¥ÍI•Í¥é…‰±” ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€•Ð}µÕÍÑ	•¥Í…‰±•‘=¹½µµ¥Ð ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€•Ð}µÕÍÑ¥áA½Í¥Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸€…Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ìü¹¥ÍÉ•”ì(€ô(€•ÐÑ•±•µ•ÑÉå%¹¥Ñ¥…±…Ñ„ ¤ì(€€€É•ÑÕÉ¸ì(€€€€€…Ñ¥½¸è€‰…‘‘•ˆ°(€€€€€ÑåÁ”èÑ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹¥ÍÉ•”€ü€‰™É••}¡¥¡±¥¡Ðˆ€è€‰¡¥¡±¥¡Ðˆ°(€€€€€½±½ÈèÑ¡¥Ì¹}Õ¥5…¹…•È¹•Ñ9½¹!5½±½É9…µ”¡Ñ¡¥Ì¹½±½È¤°(€€€€€Ñ¡¥­¹•ÍÌèÑ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì¹Ñ¡¥­¹•ÍÌ°(€€€€€µ•Ñ¡½‘=™É•…Ñ¥½¸èÑ¡¥Ì¸µ•Ñ¡½‘=™É•…Ñ¥½¸(€€€ôì(€ô(€•ÐÑ•±•µ•ÑÉå¥¹…±…Ñ„ ¤ì(€€€É•ÑÕÉ¸ì(€€€€€ÑåÁ”è€‰¡¥¡±¥¡Ðˆ°(€€€€€½±½ÈèÑ¡¥Ì¹}Õ¥5…¹…•È¹•Ñ9½¹!5½±½É9…µ”¡Ñ¡¥Ì¹½±½È¤(€€€ôì(€ô(€ÍÑ…Ñ¥Œ½µÁÕÑ•Q•±•µ•ÑÉå¥¹…±…Ñ„¡‘…Ñ„¤ì(€€€É•ÑÕÉ¸ì(€€€€€¹Õµ‰•É=™½±½ÉÌè‘…Ñ„¹•Ð ‰½±½Èˆ¤¹Í¥é”(€€€ôì(€ô(€ÑÉ…¹Í±…Ñ•%¹A…”¡à°ä¤íô(€•ÐÑ½½±‰…ÉA½Í¥Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸É•±…Ñ¥Ù•Q½	½à¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹™½ÕÍ=ÕÑ±¥¹”¹±…ÍÑA½¥¹Ð¤ì(€ô(€•Ð½µµ•¹Ñ	ÕÑÑ½¹A½Í¥Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸É•±…Ñ¥Ù•Q½	½à¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹™¥ÉÍÑA½¥¹Ð¤ì(€ô(€€É•±…Ñ¥Ù•Q½	½à¡mÁ½¥¹Ñ`°Á½¥¹Ñet¤ì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹‰½àì(€€€É•ÑÕÉ¸l¡Á½¥¹Ñ`€´à¤€¼Ý¥‘Ñ °€¡Á½¥¹Ñd€´ä¤€¼¡•¥¡Ñtì(€ô(€ÕÁ‘…Ñ•A…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€€€ÍÝ¥Ñ €¡ÑåÁ”¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹!%!1%!Q}=1=Hè(€€€€€€€Ñ¡¥Ì¹}ÕÁ‘…Ñ•½±½É¹‘=Á…¥Ñä¡Ù…±Õ”°!¥¡±¥¡Ñ‘¥Ñ½È¹}U1Q}=A%Qd°ÑåÁ”¤ì(€€€€€€€Ñ¡¥Ì¹}É•Á½ÉÑQ•±•µ•ÑÉä¡ì(€€€€€€€€€…Ñ¥½¸è€‰½±½É}¡…¹•ˆ°(€€€€€€€€€½±½ÈèÑ¡¥Ì¹}Õ¥5…¹…•È¹•Ñ9½¹!5½±½É9…µ”¡Ù…±Õ”¤(€€€€€€€ô°ÑÉÕ”¤ì(€€€€€€€‰É•…¬ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹!%!1%!Q}Q!%-9MLè(€€€€€€€ÍÕÁ•È¹ÕÁ‘…Ñ•A…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€€€€€€€Ñ¡¥Ì¹}É•Á½ÉÑQ•±•µ•ÑÉä¡ì(€€€€€€€€€…Ñ¥½¸è€‰Ñ¡¥­¹•ÍÍ}¡…¹•ˆ°(€€€€€€€€€Ñ¡¥­¹•ÍÌèÙ…±Õ”(€€€€€€€ô°ÑÉÕ”¤ì(€€€€€€€‰É•…¬ì(€€€ô(€ô(€•ÐÁÉ½Á•ÉÑ¥•ÍQ½UÁ‘…Ñ” ¤ì(€€€½¹ÍÐÁÉ½Á•ÉÑ¥•Ì€ôÍÕÁ•È¹ÁÉ½Á•ÉÑ¥•ÍQ½UÁ‘…Ñ”ì(€€€ÁÉ½Á•ÉÑ¥•Ì¹ÁÕÍ ¡m¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹!%!1%!Q}I°Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹¥ÍÉ••t¤ì(€€€É•ÑÕÉ¸ÁÉ½Á•ÉÑ¥•Ìì(€ô(€•ÐÑ½½±‰…É	ÕÑÑ½¹Ì ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}Õ¥5…¹…•È¹¡¥¡±¥¡Ñ½±½ÉÌ¤ì(€€€€€Ñ¡¥Ì¹}½±½ÉA¥­•È€ô¹•Ü½±½ÉA¥­•È¡ì(€€€€€€€•‘¥Ñ½ÈèÑ¡¥Ì(€€€€€ô¤ì(€€€€€É•ÑÕÉ¸ml‰½±½ÉA¥­•Èˆ°Ñ¡¥Ì¹}½±½ÉA¥­•Éutì(€€€ô(€€€É•ÑÕÉ¸ÍÕÁ•È¹Ñ½½±‰…É	ÕÑÑ½¹Ìì(€ô(€™¥á¹‘M•ÑA½Í¥Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸ÍÕÁ•È¹™¥á¹‘M•ÑA½Í¥Ñ¥½¸¡Ñ¡¥Ì¹}‘É…ÝI½Ñ…Ñ¥½¸¤ì(€ô(€•ÑI•Ð¡Ñà°Ñä¤ì(€€€É•ÑÕÉ¸ÍÕÁ•È¹•ÑI•Ð¡Ñà°Ñä°Ñ¡¥Ì¹}‘É…ÝI½Ñ…Ñ¥½¸¤ì(€ô(€½¹•‘‘•¡™½ÕÌ¤ì(€€€¥˜€ …Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹…‘‘U¹‘½…‰±•‘¥Ñ½È¡Ñ¡¥Ì¤ì(€€€ô(€€€¥˜€¡™½ÕÌ¤ì(€€€€€Ñ¡¥Ì¹‘¥Ø¹™½ÕÌ ¤ì(€€€ô(€ô(€É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¹}É•Á½ÉÑQ•±•µ•ÑÉä¡ì(€€€€€…Ñ¥½¸è€‰‘•±•Ñ•ˆ(€€€ô¤ì(€€€ÍÕÁ•È¹É•µ½Ù” ¤ì(€ô(€É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Øì(€€€ô(€€€½¹ÍÐ‘¥Ø€ôÍÕÁ•È¹É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¸Ñ•áÐ¤ì(€€€€€‘¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µ±…‰•°ˆ°Ñ¡¥Ì¸Ñ•áÐ¤ì(€€€€€‘¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰É½±”ˆ°€‰µ…É¬ˆ¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹¥ÍÉ•”¤ì(€€€€€‘¥Ø¹±…ÍÍ1¥ÍÐ¹…‘ ‰™É•”ˆ¤ì(€€€ô•±Í”ì(€€€€€‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°Ñ¡¥Ì¸­•å‘½Ý¸¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€€€Í¥¹…°èÑ¡¥Ì¹}Õ¥5…¹…•È¹}Í¥¹…°(€€€€€ô¤ì(€€€ô(€€€Ñ¡¥Ì¹•¹…‰±•‘¥Ñ¥¹œ ¤ì(€€€É•ÑÕÉ¸‘¥Øì(€ô(€€­•å‘½Ý¸¡•Ù•¹Ð¤ì(€€€!¥¡±¥¡Ñ‘¥Ñ½È¹}­•å‰½…É‘5…¹…•È¹•á•Œ¡Ñ¡¥Ì°•Ù•¹Ð¤ì(€ô(€}µ½Ù•…É•Ð¡‘¥É•Ñ¥½¸¤ì(€€€Ñ¡¥Ì¹Á…É•¹Ð¹Õ¹Í•±•Ð¡Ñ¡¥Ì¤ì(€€€ÍÝ¥Ñ €¡‘¥É•Ñ¥½¸¤ì(€€€€€…Í”€Àè(€€€€€…Í”€Èè(€€€€€€€Ñ¡¥Ì¸Í•Ñ…É•Ð¡ÑÉÕ”¤ì(€€€€€€€‰É•…¬ì(€€€€€…Í”€Äè(€€€€€…Í”€Ìè(€€€€€€€Ñ¡¥Ì¸Í•Ñ…É•Ð¡™…±Í”¤ì(€€€€€€€‰É•…¬ì(€€€ô(€ô(€€Í•Ñ…É•Ð¡ÍÑ…ÉÐ¤ì(€€€¥˜€ …Ñ¡¥Ì¸…¹¡½É9½‘”¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÍ•±•Ñ¥½¸€ôÝ¥¹‘½Ü¹•ÑM•±•Ñ¥½¸ ¤ì(€€€¥˜€¡ÍÑ…ÉÐ¤ì(€€€€€Í•±•Ñ¥½¸¹Í•ÑA½Í¥Ñ¥½¸¡Ñ¡¥Ì¸…¹¡½É9½‘”°Ñ¡¥Ì¸…¹¡½É=™™Í•Ð¤ì(€€€ô•±Í”ì(€€€€€Í•±•Ñ¥½¸¹Í•ÑA½Í¥Ñ¥½¸¡Ñ¡¥Ì¸™½ÕÍ9½‘”°Ñ¡¥Ì¸™½ÕÍ=™™Í•Ð¤ì(€€€ô(€ô(€Õ¹Í•±•Ð ¤ì(€€€ÍÕÁ•È¹Õ¹Í•±•Ð ¤ì(€€€¥˜€ …Ñ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹¥ÍÉ•”¤ì(€€€€€Ñ¡¥Ì¸Í•Ñ…É•Ð¡™…±Í”¤ì(€€€ô(€ô(€ÍÑ…Ñ¥ŒÉ•…Ñ•É…Ý•É%¹ÍÑ…¹”¡ì(€€€à°(€€€ä°(€€€‰½à°(€€€Á…É•¹Ð°(€€€¥Í1QH(€ô¤ì(€€€É•ÑÕÉ¸¹•ÜÉ••!¥¡±¥¡ÑÉ…Ý•È¡à°ä°‰½à°Á…É•¹Ð¹Í…±”°Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹Ñ¡¥­¹•ÍÌ€¼€È°¥Í1QH°€À¸ÀÀÄ¤ì(€ô(€ÍÑ…Ñ¥Œ}•ÑÉ…Ý¥¹Q…É•Ð¡Á…É•¹Ð°ì(€€€Ñ…É•Ð(€ô¤ì(€€€É•ÑÕÉ¸Ñ…É•Ð¹±½Í•ÍÐ ˆ¹Ñ•áÑ1…å•Èˆ¤ì(€ô(€ÍÑ…Ñ¥Œ}•ÑA½¥¹Ñ•É½½É‘Ì¡ì(€€€à°(€€€ä(€ô¤ì(€€€É•ÑÕÉ¸mà°åtì(€ô(€ÍÑ…Ñ¥Œ}…‘‘É…Ý¥¹1¥ÍÑ•¹•ÉÌ¡Ñ…É•Ð°Í¥¹…°¤ì(€€€Ñ…É•Ð¹±…ÍÍ1¥ÍÐ¹…‘ ‰™É•”ˆ¤ì(€€€Í¥¹…°¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰…‰½ÉÐˆ°€ ¤€ôøÑ…É•Ð¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ‰™É•”ˆ¤°ì(€€€€€½¹”èÑÉÕ”(€€€ô¤ì(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‰±ÕÈˆ°€ ¤€ôøÑ¡¥Ì¹}•¹‘É…Ü¡¹Õ±°¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É‘½Ý¸ˆ°ÍÑ½ÁÙ•¹Ð°ì(€€€€€…ÁÑÕÉ”èÑÉÕ”°(€€€€€Á…ÍÍ¥Ù”è™…±Í”°(€€€€€Í¥¹…°(€€€ô¤ì(€ô(€ÍÑ…Ñ¥Œ}•¹‘É…Ý¥¹M•ÍÍ¥½¸¡¥Í‰½ÉÑ•€ô™…±Í”¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹•¹‘É…Ý¥¹œ¡¥Í‰½ÉÑ•¤ì(€ô(€É•…Ñ•É…Ý¥¹=ÁÑ¥½¹Ì¡ì(€€€½±½È°(€€€½Á…¥Ñä°(€€€Ñ¡¥­¹•ÍÌ(€ô¤ì(€€€½¹ÍÐì(€€€€€}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ìè‘•™…Õ±ÑÌ°(€€€€€}U1Q}=A%Qd(€€€ô€ô!¥¡±¥¡Ñ‘¥Ñ½Èì(€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì€ô!¥¡±¥¡Ñ‘¥Ñ½È¹•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¡ì(€€€€€™¥±°èUÑ¥°¹µ…­•!•á½±½È ¸¸¹½±½È¤°(€€€€€€‰™¥±°µ½Á…¥Ñäˆè½Á…¥Ñäñð}U1Q}=A%Qd°(€€€€€Ñ¡¥­¹•ÍÌèÑ¡¥­¹•ÍÌñð‘•™…Õ±ÑÌ¹Ñ¡¥­¹•ÍÌ(€€€ô¤ì(€ô(€ÍÑ…Ñ¥Œ‘•Í•É¥…±¥é•É…Ü¡Á…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ð°}¥¹¹•É5…É¥¸°‘…Ñ„°Õ¥5…¹…•È¤ì(€€€½¹ÍÐì(€€€€€ÅÕ…‘A½¥¹ÑÌ(€€€ô€ô‘…Ñ„ì(€€€¥˜€¡ÅÕ…‘A½¥¹ÑÌ¤ì(€€€€€½¹ÍÐ‰½á•Ì€ômtì(€€€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÅÕ…‘A½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€à¤ì(€€€€€€€‰½á•Ì¹ÁÕÍ ¡ì(€€€€€€€€€àè€¡ÅÕ…‘A½¥¹ÑÍm¥t€´Á…•`¤€¼Á…•]¥‘Ñ °(€€€€€€€€€äè€Ä€´€¡ÅÕ…‘A½¥¹ÑÍm¤€¬€Åt€´Á…•d¤€¼Á…•!•¥¡Ð°(€€€€€€€€€Ý¥‘Ñ è€¡ÅÕ…‘A½¥¹ÑÍm¤€¬€Ét€´ÅÕ…‘A½¥¹ÑÍm¥t¤€¼Á…•]¥‘Ñ °(€€€€€€€€€¡•¥¡Ðè€¡ÅÕ…‘A½¥¹ÑÍm¤€¬€Åt€´ÅÕ…‘A½¥¹ÑÍm¤€¬€Õt¤€¼Á…•!•¥¡Ð(€€€€€€€ô¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸!¥¡±¥¡Ñ=ÕÑ±¥¹”¹‰Õ¥±¡‰½á•Ì°Õ¥5…¹…•È¹‘¥É•Ñ¥½¸€ôôô€‰±ÑÈˆ¤ì(€€€ô(€€€½¹ÍÐÑ¡¥­¹•ÍÌ€ô‘…Ñ„¹Ñ¡¥­¹•ÍÌñðÑ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹Ñ¡¥­¹•ÍÌì(€€€½¹ÍÐÁ½¥¹ÑÌ€ô€¡‘…Ñ„¹¥¹­1¥ÍÑÌñð‘…Ñ„¹½ÕÑ±¥¹•Ì¹Á½¥¹ÑÌ¥lÁtì(€€€½¹ÍÐ½ÕÑ±¥¹•È€ô¹•ÜÉ••!¥¡±¥¡Ñ=ÕÑ±¥¹•È¡Á½¥¹ÑÍlÁt€´Á…•`°Á…•!•¥¡Ð€´€¡Á½¥¹ÑÍlÅt€´Á…•d¤°lÀ°€À°Á…•]¥‘Ñ °Á…•!•¥¡Ñt°€Ä°Ñ¡¥­¹•ÍÌ€¼€È°ÑÉÕ”°€À¸ÀÀÄ¤ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÁ½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€½ÕÑ±¥¹•È¹…‘¡Á½¥¹ÑÍm¥t€´Á…•`°Á…•!•¥¡Ð€´€¡Á½¥¹ÑÍm¤€¬€Åt€´Á…•d¤¤ì(€€€ô(€€€½¹ÍÐ½ÕÑ±¥¹•Ì€ô½ÕÑ±¥¹•È¹•Ñ=ÕÑ±¥¹•Ì ¤ì(€€€½ÕÑ±¥¹•Ì¹‰Õ¥±‘½ÕÍ=ÕÑ±¥¹”¡Ñ¡¥­¹•ÍÌ¤ì(€€€É•ÑÕÉ¸½ÕÑ±¥¹•Ìì(€ô(€ÍÑ…Ñ¥Œ…Íå¹Œ‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€±•Ð¥¹¥Ñ¥…±…Ñ„€ô¹Õ±°ì(€€€¥˜€¡‘…Ñ„¥¹ÍÑ…¹•½˜!¥¡±¥¡Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤ì(€€€€€½¹ÍÐì(€€€€€€€‘…Ñ„èì(€€€€€€€€€ÅÕ…‘A½¥¹ÑÌ°(€€€€€€€€€É•Ð°(€€€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€€€¥°(€€€€€€€€€½±½È°(€€€€€€€€€½Á…¥Ñä°(€€€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€€€É¥¡Q•áÐ°(€€€€€€€€€½¹Ñ•¹ÑÍ=‰¨°(€€€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€€€ô°(€€€€€€€Á…É•¹Ðèì(€€€€€€€€€Á…”èì(€€€€€€€€€€€Á…•9Õµ‰•È(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô€ô‘…Ñ„ì(€€€€€¥¹¥Ñ¥…±…Ñ„€ô‘…Ñ„€ôì(€€€€€€€…¹¹½Ñ…Ñ¥½¹QåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹!%!1%!P°(€€€€€€€½±½ÈèÉÉ…ä¹™É½´¡½±½È¤°(€€€€€€€½Á…¥Ñä°(€€€€€€€ÅÕ…‘A½¥¹ÑÌ°(€€€€€€€Á…•%¹‘•àèÁ…•9Õµ‰•È€´€Ä°(€€€€€€€É•ÐèÉ•Ð¹Í±¥” À¤°(€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%è¥°(€€€€€€€¥°(€€€€€€€‘•±•Ñ•è™…±Í”°(€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€É¥¡Q•áÐ°(€€€€€€€½µµ•¹Ðè½¹Ñ•¹ÑÍ=‰¨ü¹ÍÑÈñð¹Õ±°°(€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€ôì(€€€ô•±Í”¥˜€¡‘…Ñ„¥¹ÍÑ…¹•½˜%¹­¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤ì(€€€€€½¹ÍÐì(€€€€€€€‘…Ñ„èì(€€€€€€€€€¥¹­1¥ÍÑÌ°(€€€€€€€€€É•Ð°(€€€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€€€¥°(€€€€€€€€€½±½È°(€€€€€€€€€‰½É‘•ÉMÑå±”èì(€€€€€€€€€€€É…Ý]¥‘Ñ èÑ¡¥­¹•ÍÌ(€€€€€€€€€ô°(€€€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€€€É¥¡Q•áÐ°(€€€€€€€€€½¹Ñ•¹ÑÍ=‰¨°(€€€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€€€ô°(€€€€€€€Á…É•¹Ðèì(€€€€€€€€€Á…”èì(€€€€€€€€€€€Á…•9Õµ‰•È(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô€ô‘…Ñ„ì(€€€€€¥¹¥Ñ¥…±…Ñ„€ô‘…Ñ„€ôì(€€€€€€€…¹¹½Ñ…Ñ¥½¹QåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹!%!1%!P°(€€€€€€€½±½ÈèÉÉ…ä¹™É½´¡½±½È¤°(€€€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€€€¥¹­1¥ÍÑÌ°(€€€€€€€Á…•%¹‘•àèÁ…•9Õµ‰•È€´€Ä°(€€€€€€€É•ÐèÉ•Ð¹Í±¥” À¤°(€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%è¥°(€€€€€€€¥°(€€€€€€€‘•±•Ñ•è™…±Í”°(€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€É¥¡Q•áÐ°(€€€€€€€½µµ•¹Ðè½¹Ñ•¹ÑÍ=‰¨ü¹ÍÑÈñð¹Õ±°°(€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€ôì(€€€ô(€€€½¹ÍÐ•‘¥Ñ½È€ô…Ý…¥ÐÍÕÁ•È¹‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€•‘¥Ñ½È¹}¥¹¥Ñ¥…±…Ñ„€ô¥¹¥Ñ¥…±…Ñ„ì(€€€¥˜€¡‘…Ñ„¹½µµ•¹Ð¤ì(€€€€€•‘¥Ñ½È¹Í•Ñ½µµ•¹Ñ…Ñ„¡‘…Ñ„¤ì(€€€ô(€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€ô(€Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ€ô™…±Í”¤ì(€€€¥˜€¡Ñ¡¥Ì¹¥ÍµÁÑä ¤ñð¥Í½É½Áå¥¹œ¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹‘•±•Ñ•¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹Í•É¥…±¥é••±•Ñ• ¤ì(€€€ô(€€€½¹ÍÐÍ•É¥…±¥é•€ôÍÕÁ•È¹Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ¤ì(€€€=‰©•Ð¹…ÍÍ¥¸¡Í•É¥…±¥é•°ì(€€€€€½±½Èè¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}½±½É5…¹…•È¹½¹Ù•ÉÐ¡Ñ¡¥Ì¹}Õ¥5…¹…•È¹•Ñ9½¹!5½±½È¡Ñ¡¥Ì¹½±½È¤¤°(€€€€€½Á…¥ÑäèÑ¡¥Ì¹½Á…¥Ñä°(€€€€€Ñ¡¥­¹•ÍÌèÑ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì¹Ñ¡¥­¹•ÍÌ°(€€€€€ÅÕ…‘A½¥¹ÑÌèÑ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹Í•É¥…±¥é•EÕ…‘A½¥¹ÑÌ¡Ñ¡¥Ì¹Á…•QÉ…¹Í±…Ñ¥½¸°Ñ¡¥Ì¹Á…•¥µ•¹Í¥½¹Ì¤°(€€€€€½ÕÑ±¥¹•ÌèÑ¡¥Ì¹}‘É…Ý=ÕÑ±¥¹•Ì¹Í•É¥…±¥é”¡Í•É¥…±¥é•¹É•Ð°Ñ¡¥Ì¹}‘É…ÝI½Ñ…Ñ¥½¸¤(€€€ô¤ì(€€€Ñ¡¥Ì¹…‘‘½µµ•¹Ð¡Í•É¥…±¥é•¤ì(€€€¥˜€¡Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%€˜˜€…Ñ¡¥Ì¸¡…Í±•µ•¹Ñ¡…¹•¡Í•É¥…±¥é•¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€Í•É¥…±¥é•¹¥€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%ì(€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€ô(€€¡…Í±•µ•¹Ñ¡…¹•¡Í•É¥…±¥é•¤ì(€€€½¹ÍÐì(€€€€€½±½È(€€€ô€ôÑ¡¥Ì¹}¥¹¥Ñ¥…±…Ñ„ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹¡…Í‘¥Ñ•‘½µµ•¹ÐñðÍ•É¥…±¥é•¹½±½È¹Í½µ” ¡Œ°¤¤€ôøŒ€„ôô½±½Ém¥t¤ì(€ô(€É•¹‘•É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¸¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘•±•Ñ•¤ì(€€€€€…¹¹½Ñ…Ñ¥½¸¹¡¥‘” ¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€…¹¹½Ñ…Ñ¥½¸¹ÕÁ‘…Ñ•‘¥Ñ•¡ì(€€€€€É•ÐèÑ¡¥Ì¹•ÑAI•Ð ¤°(€€€€€Á½ÁÕÀèÑ¡¥Ì¹½µµ•¹Ð(€€€ô¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½‘É…Ý•ÉÌ½¥¹­‘É…Ü¹©Ì((()±…ÍÌ%¹­É…Ý=ÕÑ±¥¹•Èì(€€±…ÍÐ€ô¹•Ü±½…ÐØÑÉÉ…ä Ø¤ì(€€Ñ¥À€ô¹•Ü±½…ÐØÑÉÉ…ä È¤ì(€€±¥¹”ì(€€±¥¹•Ìì(€€É½Ñ…Ñ¥½¸ì(€€Ñ¡¥­¹•ÍÌì(€€Á½¥¹ÑÌì(€€±…ÍÑMYA…Ñ €ô€ˆˆì(€€±…ÍÑ%¹‘•à€ô€Àì(€€½ÕÑ±¥¹•Ì€ô¹•Ü%¹­É…Ý=ÕÑ±¥¹” ¤ì(€€Á…É•¹Ñ]¥‘Ñ ì(€€Á…É•¹Ñ!•¥¡Ðì(€½¹ÍÑÉÕÑ½È¡à°ä°Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ð°É½Ñ…Ñ¥½¸°Ñ¡¥­¹•ÍÌ¤ì(€€€Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ €ôÁ…É•¹Ñ]¥‘Ñ ì(€€€Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð€ôÁ…É•¹Ñ!•¥¡Ðì(€€€Ñ¡¥Ì¸É½Ñ…Ñ¥½¸€ôÉ½Ñ…Ñ¥½¸ì(€€€Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌ€ôÑ¡¥­¹•ÍÌì(€€€mà°åt€ôÑ¡¥Ì¸¹½Éµ…±¥é•A½¥¹Ð¡à°ä¤ì(€€€½¹ÍÐ±¥¹”€ôÑ¡¥Ì¸±¥¹”€ôm9…8°9…8°9…8°9…8°à°åtì(€€€Ñ¡¥Ì¸Á½¥¹ÑÌ€ômà°åtì(€€€Ñ¡¥Ì¸±¥¹•Ì€ômì(€€€€€±¥¹”°(€€€€€Á½¥¹ÑÌèÑ¡¥Ì¸Á½¥¹ÑÌ(€€€õtì(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡±¥¹”°€À¤ì(€€€Ñ¡¥Ì¸Ñ¥À¹Í•Ð¡mà°åt°€À¤ì(€ô(€ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€¥˜€¡¹…µ”€ôôô€‰ÍÑÉ½­”µÝ¥‘Ñ ˆ¤ì(€€€€€Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌ€ôÙ…±Õ”ì(€€€ô(€ô(€€¹½Éµ…±¥é•A½¥¹Ð¡à°ä¤ì(€€€É•ÑÕÉ¸=ÕÑ±¥¹”¹}¹½Éµ…±¥é•A½¥¹Ð¡à°ä°Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ °Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð°Ñ¡¥Ì¸É½Ñ…Ñ¥½¸¤ì(€ô(€¥ÍµÁÑä ¤ì(€€€É•ÑÕÉ¸€…Ñ¡¥Ì¸±¥¹•Ìü¹±•¹Ñ ì(€ô(€¥Í…¹•±±…‰±” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ðô€ÄÀì(€ô(€…‘¡à°ä¤ì(€€€¥˜€¡Ñ¡¥Ì¸…‘¡à°ä¤¤ì(€€€€€Ñ¡¥Ì¹Ñ½MYA…Ñ  ¤ì(€€€ô(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¸Ñ½MYA…Ñ¡]¥Ñ¡Q¥À ¤(€€€€€ô(€€€ôì(€ô(€…‘‘A½¥¹ÑÌ¡Á½¥¹ÑÌ¤ì(€€€±•Ð¹••‘ÍA…Ñ¡UÁ‘…Ñ”€ô™…±Í”ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÁ½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€È¤ì(€€€€€¥˜€ …Ñ¡¥Ì¸…‘¡Á½¥¹ÑÍm¥t°Á½¥¹ÑÍm¤€¬€Åt¤¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€¹••‘ÍA…Ñ¡UÁ‘…Ñ”€ôÑÉÕ”ì(€€€€€¥˜€¡Ñ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ðô€Ø¤ì(€€€€€€€Ñ¡¥Ì¹Ñ½MYA…Ñ  ¤ì(€€€€€€€¹••‘ÍA…Ñ¡UÁ‘…Ñ”€ô™…±Í”ì(€€€€€ô(€€€ô(€€€¥˜€¡¹••‘ÍA…Ñ¡UÁ‘…Ñ”¤ì(€€€€€Ñ¡¥Ì¹Ñ½MYA…Ñ  ¤ì(€€€ô(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¸Ñ½MYA…Ñ¡]¥Ñ¡Q¥À ¤(€€€€€ô(€€€ôì(€ô(€€…‘¡à°ä¤ì(€€€mà°åt€ôÑ¡¥Ì¸¹½Éµ…±¥é•A½¥¹Ð¡à°ä¤ì(€€€Ñ¡¥Ì¸Ñ¥À¹Í•Ð¡mà°åt°€À¤ì(€€€½¹ÍÐmàÄ°äÄ°àÈ°äÉt€ôÑ¡¥Ì¸±…ÍÐ¹ÍÕ‰…ÉÉ…ä È°€Ø¤ì(€€€½¹ÍÐ‘¥™™`€ôà€´àÈì(€€€½¹ÍÐ‘¥™™d€ôä€´äÈì(€€€½¹ÍÐ€ô5…Ñ ¹¡åÁ½Ð¡Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ €¨‘¥™™`°Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð€¨‘¥™™d¤ì(€€€¥˜€¡€ðô€È¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ô(€€€Ñ¡¥Ì¸Á½¥¹ÑÌ¹ÁÕÍ ¡à°ä¤ì(€€€¥˜€¡¥Í9…8¡àÄ¤¤ì(€€€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡màÈ°äÈ°à°åt°€È¤ì(€€€€€Ñ¡¥Ì¸±¥¹”¹ÁÕÍ ¡9…8°9…8°9…8°9…8°à°ä¤ì(€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€ô(€€€¥˜€¡¥Í9…8¡Ñ¡¥Ì¸±…ÍÑlÁt¤¤ì(€€€€€Ñ¡¥Ì¸±¥¹”¹ÍÁ±¥” Ø°€Ø¤ì(€€€ô(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡màÄ°äÄ°àÈ°äÈ°à°åt°€À¤ì(€€€Ñ¡¥Ì¸±¥¹”¹ÁÕÍ  ¸¸¹=ÕÑ±¥¹”¹É•…Ñ•	•é¥•ÉA½¥¹ÑÌ¡àÄ°äÄ°àÈ°äÈ°à°ä¤¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€•¹¡à°ä¤ì(€€€¥˜€¡à€„ôôÕ¹‘•™¥¹•€˜˜Ñ¡¥Ì¸…‘¡à°ä¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€€€€€Á…Ñ èì(€€€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤(€€€€€€€ô(€€€€€ôì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ôôô€È¤ì(€€€€€É•ÑÕÉ¸ì(€€€€€€€Á…Ñ èì(€€€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤(€€€€€€€ô(€€€€€ôì(€€€ô(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¸±…ÍÑMYA…Ñ (€€€€€ô(€€€ôì(€ô(€ÍÑ…ÉÑ9•Ü¡à°ä°Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ð°É½Ñ…Ñ¥½¸¤ì(€€€Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ €ôÁ…É•¹Ñ]¥‘Ñ ì(€€€Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð€ôÁ…É•¹Ñ!•¥¡Ðì(€€€Ñ¡¥Ì¸É½Ñ…Ñ¥½¸€ôÉ½Ñ…Ñ¥½¸ì(€€€mà°åt€ôÑ¡¥Ì¸¹½Éµ…±¥é•A½¥¹Ð¡à°ä¤ì(€€€½¹ÍÐ±¥¹”€ôÑ¡¥Ì¸±¥¹”€ôm9…8°9…8°9…8°9…8°à°åtì(€€€Ñ¡¥Ì¸Á½¥¹ÑÌ€ômà°åtì(€€€Ñ¡¥Ì¸Ñ¥À¹Í•Ð¡mà°åt°€À¤ì(€€€½¹ÍÐ±…ÍÐ€ôÑ¡¥Ì¸±¥¹•Ì¹…Ð ´Ä¤ì(€€€¥˜€¡±…ÍÐ¤ì(€€€€€±…ÍÐ¹±¥¹”€ô¹•Ü±½…ÐÌÉÉÉ…ä¡±…ÍÐ¹±¥¹”¤ì(€€€€€±…ÍÐ¹Á½¥¹ÑÌ€ô¹•Ü±½…ÐÌÉÉÉ…ä¡±…ÍÐ¹Á½¥¹ÑÌ¤ì(€€€ô(€€€Ñ¡¥Ì¸±¥¹•Ì¹ÁÕÍ ¡ì(€€€€€±¥¹”°(€€€€€Á½¥¹ÑÌèÑ¡¥Ì¸Á½¥¹ÑÌ(€€€ô¤ì(€€€Ñ¡¥Ì¸±…ÍÐ¹Í•Ð¡±¥¹”°€À¤ì(€€€Ñ¡¥Ì¸±…ÍÑ%¹‘•à€ô€Àì(€€€Ñ¡¥Ì¹Ñ½MYA…Ñ  ¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€•Ñ1…ÍÑ±•µ•¹Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸±¥¹•Ì¹…Ð ´Ä¤ì(€ô(€Í•Ñ1…ÍÑ±•µ•¹Ð¡•±•µ•¹Ð¤ì(€€€¥˜€ …Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸½ÕÑ±¥¹•Ì¹Í•Ñ1…ÍÑ±•µ•¹Ð¡•±•µ•¹Ð¤ì(€€€ô(€€€Ñ¡¥Ì¸±¥¹•Ì¹ÁÕÍ ¡•±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¸±¥¹”€ô•±•µ•¹Ð¹±¥¹”ì(€€€Ñ¡¥Ì¸Á½¥¹ÑÌ€ô•±•µ•¹Ð¹Á½¥¹ÑÌì(€€€Ñ¡¥Ì¸±…ÍÑ%¹‘•à€ô€Àì(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤(€€€€€ô(€€€ôì(€ô(€É•µ½Ù•1…ÍÑ±•µ•¹Ð ¤ì(€€€¥˜€ …Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸½ÕÑ±¥¹•Ì¹É•µ½Ù•1…ÍÑ±•µ•¹Ð ¤ì(€€€ô(€€€Ñ¡¥Ì¸±¥¹•Ì¹Á½À ¤ì(€€€Ñ¡¥Ì¸±…ÍÑMYA…Ñ €ô€ˆˆì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÑ¡¥Ì¸±¥¹•Ì¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€½¹ÍÐì(€€€€€€€±¥¹”°(€€€€€€€Á½¥¹ÑÌ(€€€€€ô€ôÑ¡¥Ì¸±¥¹•Ím¥tì(€€€€€Ñ¡¥Ì¸±¥¹”€ô±¥¹”ì(€€€€€Ñ¡¥Ì¸Á½¥¹ÑÌ€ôÁ½¥¹ÑÌì(€€€€€Ñ¡¥Ì¸±…ÍÑ%¹‘•à€ô€Àì(€€€€€Ñ¡¥Ì¹Ñ½MYA…Ñ  ¤ì(€€€ô(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¸±…ÍÑMYA…Ñ (€€€€€ô(€€€ôì(€ô(€€Ñ½MYA…Ñ¡]¥Ñ¡Q¥À ¤ì(€€€½¹ÍÐÑ¥Á`€ô=ÕÑ±¥¹”¹ÍÙI½Õ¹¡Ñ¡¥Ì¸Ñ¥ÁlÁt¤ì(€€€½¹ÍÐÑ¥Ád€ô=ÕÑ±¥¹”¹ÍÙI½Õ¹¡Ñ¡¥Ì¸Ñ¥ÁlÅt¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ôôô€È¤ì(€€€€€½¹ÍÐ™¥ÉÍÑ`€ô=ÕÑ±¥¹”¹ÍÙI½Õ¹¡Ñ¡¥Ì¸±¥¹•lÑt¤ì(€€€€€½¹ÍÐ™¥ÉÍÑd€ô=ÕÑ±¥¹”¹ÍÙI½Õ¹¡Ñ¡¥Ì¸±¥¹•lÕt¤ì(€€€€€É•ÑÕÉ¸€‘íÑ¡¥Ì¸±…ÍÑMYA…Ñ¡ô4€‘í™¥ÉÍÑaô€‘í™¥ÉÍÑeô0€‘íÑ¥Áaô€‘íÑ¥Áeõ€ì(€€€ô(€€€É•ÑÕÉ¸€‘íÑ¡¥Ì¸±…ÍÑMYA…Ñ¡ô0€‘íÑ¥Áaô€‘íÑ¥Áeõ€ì(€ô(€Ñ½MYA…Ñ  ¤ì(€€€½¹ÍÐ™¥ÉÍÑ`€ô=ÕÑ±¥¹”¹ÍÙI½Õ¹¡Ñ¡¥Ì¸±¥¹•lÑt¤ì(€€€½¹ÍÐ™¥ÉÍÑd€ô=ÕÑ±¥¹”¹ÍÙI½Õ¹¡Ñ¡¥Ì¸±¥¹•lÕt¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ôôô€È¤ì(€€€€€Ñ¡¥Ì¸±…ÍÑMYA…Ñ €ô€‘íÑ¡¥Ì¸±…ÍÑMYA…Ñ¡ô4€‘í™¥ÉÍÑaô€‘í™¥ÉÍÑeôi€ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸±…ÍÑMYA…Ñ ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ðô€Ø¤ì(€€€€€½¹ÍÐ¤€ôÑ¡¥Ì¸±…ÍÑMYA…Ñ ¹±…ÍÑ%¹‘•á=˜ ‰4ˆ¤ì(€€€€€Ñ¡¥Ì¸±…ÍÑMYA…Ñ €ô€‘íÑ¡¥Ì¸±…ÍÑMYA…Ñ ¹Í±¥” À°¤¥ô4€‘í™¥ÉÍÑaô€‘í™¥ÉÍÑeõ€ì(€€€€€Ñ¡¥Ì¸±…ÍÑ%¹‘•à€ô€Øì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸Á½¥¹ÑÌ¹±•¹Ñ €ôôô€Ð¤ì(€€€€€½¹ÍÐÍ•½¹‘`€ô=ÕÑ±¥¹”¹ÍÙI½Õ¹¡Ñ¡¥Ì¸±¥¹•lÄÁt¤ì(€€€€€½¹ÍÐÍ•½¹‘d€ô=ÕÑ±¥¹”¹ÍÙI½Õ¹¡Ñ¡¥Ì¸±¥¹•lÄÅt¤ì(€€€€€Ñ¡¥Ì¸±…ÍÑMYA…Ñ €ô€‘íÑ¡¥Ì¸±…ÍÑMYA…Ñ¡ô0€‘íÍ•½¹‘aô€‘íÍ•½¹‘eõ€ì(€€€€€Ñ¡¥Ì¸±…ÍÑ%¹‘•à€ô€ÄÈì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¸±…ÍÑMYA…Ñ ì(€€€ô(€€€½¹ÍÐ‰Õ™™•È€ômtì(€€€¥˜€¡Ñ¡¥Ì¸±…ÍÑ%¹‘•à€ôôô€À¤ì(€€€€€‰Õ™™•È¹ÁÕÍ ¡4€‘í™¥ÉÍÑaô€‘í™¥ÉÍÑeõ€¤ì(€€€€€Ñ¡¥Ì¸±…ÍÑ%¹‘•à€ô€Øì(€€€ô(€€€™½È€¡±•Ð¤€ôÑ¡¥Ì¸±…ÍÑ%¹‘•à°¥¤€ôÑ¡¥Ì¸±¥¹”¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€Ø¤ì(€€€€€½¹ÍÐmŒÅà°ŒÅä°ŒÉà°ŒÉä°à°åt€ôÑ¡¥Ì¸±¥¹”¹Í±¥”¡¤°¤€¬€Ø¤¹µ…À¡=ÕÑ±¥¹”¹ÍÙI½Õ¹¤ì(€€€€€‰Õ™™•È¹ÁÕÍ ¡‘íŒÅáô€‘íŒÅåô€‘íŒÉáô€‘íŒÉåô€‘íáô€‘íåõ€¤ì(€€€ô(€€€Ñ¡¥Ì¸±…ÍÑMYA…Ñ €¬ô‰Õ™™•È¹©½¥¸ ˆ€ˆ¤ì(€€€Ñ¡¥Ì¸±…ÍÑ%¹‘•à€ôÑ¡¥Ì¸±¥¹”¹±•¹Ñ ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸±…ÍÑMYA…Ñ ì(€ô(€•Ñ=ÕÑ±¥¹•Ì¡Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ð°Í…±”°¥¹¹•É5…É¥¸¤ì(€€€½¹ÍÐ±…ÍÐ€ôÑ¡¥Ì¸±¥¹•Ì¹…Ð ´Ä¤ì(€€€±…ÍÐ¹±¥¹”€ô¹•Ü±½…ÐÌÉÉÉ…ä¡±…ÍÐ¹±¥¹”¤ì(€€€±…ÍÐ¹Á½¥¹ÑÌ€ô¹•Ü±½…ÐÌÉÉÉ…ä¡±…ÍÐ¹Á½¥¹ÑÌ¤ì(€€€Ñ¡¥Ì¸½ÕÑ±¥¹•Ì¹‰Õ¥±¡Ñ¡¥Ì¸±¥¹•Ì°Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ð°Í…±”°Ñ¡¥Ì¸É½Ñ…Ñ¥½¸°Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌ°¥¹¹•É5…É¥¸¤ì(€€€Ñ¡¥Ì¸±…ÍÐ€ô¹Õ±°ì(€€€Ñ¡¥Ì¸±¥¹”€ô¹Õ±°ì(€€€Ñ¡¥Ì¸±¥¹•Ì€ô¹Õ±°ì(€€€Ñ¡¥Ì¸±…ÍÑMYA…Ñ €ô¹Õ±°ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸½ÕÑ±¥¹•Ìì(€ô(€•Ð‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ì ¤ì(€€€É•ÑÕÉ¸ì(€€€€€É½½Ðèì(€€€€€€€Ù¥•Ý	½àè€ˆÀ€À€ÄÀÀÀÀ€ÄÀÀÀÀˆ(€€€€€ô°(€€€€€É½½Ñ±…ÍÌèì(€€€€€€€‘É…ÜèÑÉÕ”(€€€€€ô°(€€€€€‰‰½àèlÀ°€À°€Ä°€Åt(€€€ôì(€ô)ô)±…ÍÌ%¹­É…Ý=ÕÑ±¥¹”•áÑ•¹‘Ì=ÕÑ±¥¹”ì(€€‰‰½àì(€€ÕÉÉ•¹ÑI½Ñ…Ñ¥½¸€ô€Àì(€€¥¹¹•É5…É¥¸ì(€€±¥¹•Ìì(€€Á…É•¹Ñ]¥‘Ñ ì(€€Á…É•¹Ñ!•¥¡Ðì(€€Á…É•¹ÑM…±”ì(€€É½Ñ…Ñ¥½¸ì(€€Ñ¡¥­¹•ÍÌì(€‰Õ¥±¡±¥¹•Ì°Á…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ð°Á…É•¹ÑM…±”°É½Ñ…Ñ¥½¸°Ñ¡¥­¹•ÍÌ°¥¹¹•É5…É¥¸¤ì(€€€Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ €ôÁ…É•¹Ñ]¥‘Ñ ì(€€€Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð€ôÁ…É•¹Ñ!•¥¡Ðì(€€€Ñ¡¥Ì¸Á…É•¹ÑM…±”€ôÁ…É•¹ÑM…±”ì(€€€Ñ¡¥Ì¸É½Ñ…Ñ¥½¸€ôÉ½Ñ…Ñ¥½¸ì(€€€Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌ€ôÑ¡¥­¹•ÍÌì(€€€Ñ¡¥Ì¸¥¹¹•É5…É¥¸€ô¥¹¹•É5…É¥¸€üü€Àì(€€€Ñ¡¥Ì¸±¥¹•Ì€ô±¥¹•Ìì(€€€Ñ¡¥Ì¸½µÁÕÑ•	‰½à ¤ì(€ô(€•ÐÑ¡¥­¹•ÍÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌì(€ô(€Í•Ñ1…ÍÑ±•µ•¹Ð¡•±•µ•¹Ð¤ì(€€€Ñ¡¥Ì¸±¥¹•Ì¹ÁÕÍ ¡•±•µ•¹Ð¤ì(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤(€€€€€ô(€€€ôì(€ô(€É•µ½Ù•1…ÍÑ±•µ•¹Ð ¤ì(€€€Ñ¡¥Ì¸±¥¹•Ì¹Á½À ¤ì(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤(€€€€€ô(€€€ôì(€ô(€Ñ½MYA…Ñ  ¤ì(€€€½¹ÍÐ‰Õ™™•È€ômtì(€€€™½È€¡½¹ÍÐì(€€€€€±¥¹”(€€€ô½˜Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€‰Õ™™•È¹ÁÕÍ ¡4‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡±¥¹•lÑt¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡±¥¹•lÕt¥õ€¤ì(€€€€€¥˜€¡±¥¹”¹±•¹Ñ €ôôô€Ø¤ì(€€€€€€€‰Õ™™•È¹ÁÕÍ  ‰hˆ¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€¥˜€¡±¥¹”¹±•¹Ñ €ôôô€ÄÈ€˜˜¥Í9…8¡±¥¹•lÙt¤¤ì(€€€€€€€‰Õ™™•È¹ÁÕÍ ¡0‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡±¥¹•lÄÁt¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡±¥¹•lÄÅt¥õ€¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€™½È€¡±•Ð¤€ô€Ø°¥¤€ô±¥¹”¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€Ø¤ì(€€€€€€€½¹ÍÐmŒÅà°ŒÅä°ŒÉà°ŒÉä°à°åt€ô±¥¹”¹ÍÕ‰…ÉÉ…ä¡¤°¤€¬€Ø¤¹µ…À¡=ÕÑ±¥¹”¹ÍÙI½Õ¹¤ì(€€€€€€€‰Õ™™•È¹ÁÕÍ ¡‘íŒÅáô€‘íŒÅåô€‘íŒÉáô€‘íŒÉåô€‘íáô€‘íåõ€¤ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸‰Õ™™•È¹©½¥¸ ˆˆ¤ì(€ô(€Í•É¥…±¥é”¡mÁ…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ñt°¥Í½É½Áå¥¹œ¤ì(€€€½¹ÍÐÍ•É¥…±¥é•‘1¥¹•Ì€ômtì(€€€½¹ÍÐÍ•É¥…±¥é•‘A½¥¹ÑÌ€ômtì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸•Ñ		½á]¥Ñ¡9½5…É¥¸ ¤ì(€€€±•ÐÑà°Ñä°Íà°Íä°àÄ°äÄ°àÈ°äÈ°É•Í…±•¸ì(€€€ÍÝ¥Ñ €¡Ñ¡¥Ì¸É½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€Àè(€€€€€€€É•Í…±•¸€ô=ÕÑ±¥¹”¹}É•Í…±”ì(€€€€€€€Ñà€ôÁ…•`ì(€€€€€€€Ñä€ôÁ…•d€¬Á…•!•¥¡Ðì(€€€€€€€Íà€ôÁ…•]¥‘Ñ ì(€€€€€€€Íä€ô€µÁ…•!•¥¡Ðì(€€€€€€€àÄ€ôÁ…•`€¬à€¨Á…•]¥‘Ñ ì(€€€€€€€äÄ€ôÁ…•d€¬€ Ä€´ä€´¡•¥¡Ð¤€¨Á…•!•¥¡Ðì(€€€€€€€àÈ€ôÁ…•`€¬€¡à€¬Ý¥‘Ñ ¤€¨Á…•]¥‘Ñ ì(€€€€€€€äÈ€ôÁ…•d€¬€ Ä€´ä¤€¨Á…•!•¥¡Ðì(€€€€€€€‰É•…¬ì(€€€€€…Í”€äÀè(€€€€€€€É•Í…±•¸€ô=ÕÑ±¥¹”¹}É•Í…±•¹‘MÝ…Àì(€€€€€€€Ñà€ôÁ…•`ì(€€€€€€€Ñä€ôÁ…•dì(€€€€€€€Íà€ôÁ…•]¥‘Ñ ì(€€€€€€€Íä€ôÁ…•!•¥¡Ðì(€€€€€€€àÄ€ôÁ…•`€¬ä€¨Á…•]¥‘Ñ ì(€€€€€€€äÄ€ôÁ…•d€¬à€¨Á…•!•¥¡Ðì(€€€€€€€àÈ€ôÁ…•`€¬€¡ä€¬¡•¥¡Ð¤€¨Á…•]¥‘Ñ ì(€€€€€€€äÈ€ôÁ…•d€¬€¡à€¬Ý¥‘Ñ ¤€¨Á…•!•¥¡Ðì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÄàÀè(€€€€€€€É•Í…±•¸€ô=ÕÑ±¥¹”¹}É•Í…±”ì(€€€€€€€Ñà€ôÁ…•`€¬Á…•]¥‘Ñ ì(€€€€€€€Ñä€ôÁ…•dì(€€€€€€€Íà€ô€µÁ…•]¥‘Ñ ì(€€€€€€€Íä€ôÁ…•!•¥¡Ðì(€€€€€€€àÄ€ôÁ…•`€¬€ Ä€´à€´Ý¥‘Ñ ¤€¨Á…•]¥‘Ñ ì(€€€€€€€äÄ€ôÁ…•d€¬ä€¨Á…•!•¥¡Ðì(€€€€€€€àÈ€ôÁ…•`€¬€ Ä€´à¤€¨Á…•]¥‘Ñ ì(€€€€€€€äÈ€ôÁ…•d€¬€¡ä€¬¡•¥¡Ð¤€¨Á…•!•¥¡Ðì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÈÜÀè(€€€€€€€É•Í…±•¸€ô=ÕÑ±¥¹”¹}É•Í…±•¹‘MÝ…Àì(€€€€€€€Ñà€ôÁ…•`€¬Á…•]¥‘Ñ ì(€€€€€€€Ñä€ôÁ…•d€¬Á…•!•¥¡Ðì(€€€€€€€Íà€ô€µÁ…•]¥‘Ñ ì(€€€€€€€Íä€ô€µÁ…•!•¥¡Ðì(€€€€€€€àÄ€ôÁ…•`€¬€ Ä€´ä€´¡•¥¡Ð¤€¨Á…•]¥‘Ñ ì(€€€€€€€äÄ€ôÁ…•d€¬€ Ä€´à€´Ý¥‘Ñ ¤€¨Á…•!•¥¡Ðì(€€€€€€€àÈ€ôÁ…•`€¬€ Ä€´ä¤€¨Á…•]¥‘Ñ ì(€€€€€€€äÈ€ôÁ…•d€¬€ Ä€´à¤€¨Á…•!•¥¡Ðì(€€€€€€€‰É•…¬ì(€€€ô(€€€™½È€¡½¹ÍÐì(€€€€€±¥¹”°(€€€€€Á½¥¹ÑÌ(€€€ô½˜Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€Í•É¥…±¥é•‘1¥¹•Ì¹ÁÕÍ ¡É•Í…±•¸¡±¥¹”°Ñà°Ñä°Íà°Íä°¥Í½É½Áå¥¹œ€ü¹•ÜÉÉ…ä¡±¥¹”¹±•¹Ñ ¤€è¹Õ±°¤¤ì(€€€€€Í•É¥…±¥é•‘A½¥¹ÑÌ¹ÁÕÍ ¡É•Í…±•¸¡Á½¥¹ÑÌ°Ñà°Ñä°Íà°Íä°¥Í½É½Áå¥¹œ€ü¹•ÜÉÉ…ä¡Á½¥¹ÑÌ¹±•¹Ñ ¤€è¹Õ±°¤¤ì(€€€ô(€€€É•ÑÕÉ¸ì(€€€€€±¥¹•ÌèÍ•É¥…±¥é•‘1¥¹•Ì°(€€€€€Á½¥¹ÑÌèÍ•É¥…±¥é•‘A½¥¹ÑÌ°(€€€€€É•ÐèmàÄ°äÄ°àÈ°äÉt(€€€ôì(€ô(€ÍÑ…Ñ¥Œ‘•Í•É¥…±¥é”¡Á…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ð°¥¹¹•É5…É¥¸°ì(€€€Á…Ñ¡Ìèì(€€€€€±¥¹•Ì°(€€€€€Á½¥¹ÑÌ(€€€ô°(€€€É½Ñ…Ñ¥½¸°(€€€Ñ¡¥­¹•ÍÌ(€ô¤ì(€€€½¹ÍÐ¹•Ý1¥¹•Ì€ômtì(€€€±•ÐÑà°Ñä°Íà°Íä°É•Í…±•¸ì(€€€ÍÝ¥Ñ €¡É½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€Àè(€€€€€€€É•Í…±•¸€ô=ÕÑ±¥¹”¹}É•Í…±”ì(€€€€€€€Ñà€ô€µÁ…•`€¼Á…•]¥‘Ñ ì(€€€€€€€Ñä€ôÁ…•d€¼Á…•!•¥¡Ð€¬€Äì(€€€€€€€Íà€ô€Ä€¼Á…•]¥‘Ñ ì(€€€€€€€Íä€ô€´Ä€¼Á…•!•¥¡Ðì(€€€€€€€‰É•…¬ì(€€€€€…Í”€äÀè(€€€€€€€É•Í…±•¸€ô=ÕÑ±¥¹”¹}É•Í…±•¹‘MÝ…Àì(€€€€€€€Ñà€ô€µÁ…•d€¼Á…•!•¥¡Ðì(€€€€€€€Ñä€ô€µÁ…•`€¼Á…•]¥‘Ñ ì(€€€€€€€Íà€ô€Ä€¼Á…•!•¥¡Ðì(€€€€€€€Íä€ô€Ä€¼Á…•]¥‘Ñ ì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÄàÀè(€€€€€€€É•Í…±•¸€ô=ÕÑ±¥¹”¹}É•Í…±”ì(€€€€€€€Ñà€ôÁ…•`€¼Á…•]¥‘Ñ €¬€Äì(€€€€€€€Ñä€ô€µÁ…•d€¼Á…•!•¥¡Ðì(€€€€€€€Íà€ô€´Ä€¼Á…•]¥‘Ñ ì(€€€€€€€Íä€ô€Ä€¼Á…•!•¥¡Ðì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÈÜÀè(€€€€€€€É•Í…±•¸€ô=ÕÑ±¥¹”¹}É•Í…±•¹‘MÝ…Àì(€€€€€€€Ñà€ôÁ…•d€¼Á…•!•¥¡Ð€¬€Äì(€€€€€€€Ñä€ôÁ…•`€¼Á…•]¥‘Ñ €¬€Äì(€€€€€€€Íà€ô€´Ä€¼Á…•!•¥¡Ðì(€€€€€€€Íä€ô€´Ä€¼Á…•]¥‘Ñ ì(€€€€€€€‰É•…¬ì(€€€ô(€€€¥˜€ …±¥¹•Ì¤ì(€€€€€±¥¹•Ì€ômtì(€€€€€™½È€¡½¹ÍÐÁ½¥¹Ð½˜Á½¥¹ÑÌ¤ì(€€€€€€€½¹ÍÐ±•¸€ôÁ½¥¹Ð¹±•¹Ñ ì(€€€€€€€¥˜€¡±•¸€ôôô€È¤ì(€€€€€€€€€±¥¹•Ì¹ÁÕÍ ¡¹•Ü±½…ÐÌÉÉÉ…ä¡m9…8°9…8°9…8°9…8°Á½¥¹ÑlÁt°Á½¥¹ÑlÅut¤¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€¥˜€¡±•¸€ôôô€Ð¤ì(€€€€€€€€€±¥¹•Ì¹ÁÕÍ ¡¹•Ü±½…ÐÌÉÉÉ…ä¡m9…8°9…8°9…8°9…8°Á½¥¹ÑlÁt°Á½¥¹ÑlÅt°9…8°9…8°9…8°9…8°Á½¥¹ÑlÉt°Á½¥¹ÑlÍut¤¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€½¹ÍÐ±¥¹”€ô¹•Ü±½…ÐÌÉÉÉ…ä Ì€¨€¡±•¸€´€È¤¤ì(€€€€€€€±¥¹•Ì¹ÁÕÍ ¡±¥¹”¤ì(€€€€€€€±•ÐmàÄ°äÄ°àÈ°äÉt€ôÁ½¥¹Ð¹ÍÕ‰…ÉÉ…ä À°€Ð¤ì(€€€€€€€±¥¹”¹Í•Ð¡m9…8°9…8°9…8°9…8°àÄ°äÅt°€À¤ì(€€€€€€€™½È€¡±•Ð¤€ô€Ðì¤€ð±•¸ì¤€¬ô€È¤ì(€€€€€€€€€½¹ÍÐà€ôÁ½¥¹Ñm¥tì(€€€€€€€€€½¹ÍÐä€ôÁ½¥¹Ñm¤€¬€Åtì(€€€€€€€€€±¥¹”¹Í•Ð¡=ÕÑ±¥¹”¹É•…Ñ•	•é¥•ÉA½¥¹ÑÌ¡àÄ°äÄ°àÈ°äÈ°à°ä¤°€¡¤€´€È¤€¨€Ì¤ì(€€€€€€€€€màÄ°äÄ°àÈ°äÉt€ômàÈ°äÈ°à°åtì(€€€€€€€ô(€€€€€ô(€€€ô(€€€™½È€¡±•Ð¤€ô€À°¥¤€ô±¥¹•Ì¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€¹•Ý1¥¹•Ì¹ÁÕÍ ¡ì(€€€€€€€±¥¹”èÉ•Í…±•¸¡±¥¹•Ím¥t¹µ…À¡à€ôøà€üü9…8¤°Ñà°Ñä°Íà°Íä¤°(€€€€€€€Á½¥¹ÑÌèÉ•Í…±•¸¡Á½¥¹ÑÍm¥t¹µ…À¡à€ôøà€üü9…8¤°Ñà°Ñä°Íà°Íä¤(€€€€€ô¤ì(€€€ô(€€€½¹ÍÐ½ÕÑ±¥¹•Ì€ô¹•ÜÑ¡¥Ì¹ÁÉ½Ñ½ÑåÁ”¹½¹ÍÑÉÕÑ½È ¤ì(€€€½ÕÑ±¥¹•Ì¹‰Õ¥±¡¹•Ý1¥¹•Ì°Á…•]¥‘Ñ °Á…•!•¥¡Ð°€Ä°É½Ñ…Ñ¥½¸°Ñ¡¥­¹•ÍÌ°¥¹¹•É5…É¥¸¤ì(€€€É•ÑÕÉ¸½ÕÑ±¥¹•Ìì(€ô(€€•Ñ5…É¥¹½µÁ½¹•¹ÑÌ¡Ñ¡¥­¹•ÍÌ€ôÑ¡¥Ì¸Ñ¡¥­¹•ÍÌ¤ì(€€€½¹ÍÐµ…É¥¸€ôÑ¡¥Ì¸¥¹¹•É5…É¥¸€¬Ñ¡¥­¹•ÍÌ€¼€È€¨Ñ¡¥Ì¸Á…É•¹ÑM…±”ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸É½Ñ…Ñ¥½¸€”€ÄàÀ€ôôô€À€ümµ…É¥¸€¼Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ °µ…É¥¸€¼Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ñt€èmµ…É¥¸€¼Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð°µ…É¥¸€¼Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ¡tì(€ô(€€•Ñ		½á]¥Ñ¡9½5…É¥¸ ¤ì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸‰‰½àì(€€€½¹ÍÐmµ…É¥¹`°µ…É¥¹et€ôÑ¡¥Ì¸•Ñ5…É¥¹½µÁ½¹•¹ÑÌ À¤ì(€€€É•ÑÕÉ¸mà€¬µ…É¥¹`°ä€¬µ…É¥¹d°Ý¥‘Ñ €´€È€¨µ…É¥¹`°¡•¥¡Ð€´€È€¨µ…É¥¹etì(€ô(€€½µÁÕÑ•	‰½à ¤ì(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¸‰‰½à€ôÌÉ}		=a}%9%P¹Í±¥” ¤ì(€€€™½È€¡½¹ÍÐì(€€€€€±¥¹”(€€€ô½˜Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€¥˜€¡±¥¹”¹±•¹Ñ €ðô€ÄÈ¤ì(€€€€€€€™½È€¡±•Ð¤€ô€Ð°¥¤€ô±¥¹”¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€Ø¤ì(€€€€€€€€€UÑ¥°¹Á½¥¹Ñ	½Õ¹‘¥¹	½à¡±¥¹•m¥t°±¥¹•m¤€¬€Åt°‰‰½à¤ì(€€€€€€€ô(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€±•Ð±…ÍÑ`€ô±¥¹•lÑt°(€€€€€€€±…ÍÑd€ô±¥¹•lÕtì(€€€€€™½È€¡±•Ð¤€ô€Ø°¥¤€ô±¥¹”¹±•¹Ñ ì¤€ð¥¤ì¤€¬ô€Ø¤ì(€€€€€€€½¹ÍÐmŒÅà°ŒÅä°ŒÉà°ŒÉä°à°åt€ô±¥¹”¹ÍÕ‰…ÉÉ…ä¡¤°¤€¬€Ø¤ì(€€€€€€€UÑ¥°¹‰•é¥•É	½Õ¹‘¥¹	½à¡±…ÍÑ`°±…ÍÑd°ŒÅà°ŒÅä°ŒÉà°ŒÉä°à°ä°‰‰½à¤ì(€€€€€€€±…ÍÑ`€ôàì(€€€€€€€±…ÍÑd€ôäì(€€€€€ô(€€€ô(€€€½¹ÍÐmµ…É¥¹`°µ…É¥¹et€ôÑ¡¥Ì¸•Ñ5…É¥¹½µÁ½¹•¹ÑÌ ¤ì(€€€‰‰½álÁt€ô5…Ñ¡±…µÀ¡‰‰½álÁt€´µ…É¥¹`°€À°€Ä¤ì(€€€‰‰½álÅt€ô5…Ñ¡±…µÀ¡‰‰½álÅt€´µ…É¥¹d°€À°€Ä¤ì(€€€‰‰½álÉt€ô5…Ñ¡±…µÀ¡‰‰½álÉt€¬µ…É¥¹`°€À°€Ä¤ì(€€€‰‰½álÍt€ô5…Ñ¡±…µÀ¡‰‰½álÍt€¬µ…É¥¹d°€À°€Ä¤ì(€€€‰‰½álÉt€´ô‰‰½álÁtì(€€€‰‰½álÍt€´ô‰‰½álÅtì(€ô(€•Ð‰½à ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸‰‰½àì(€ô(€ÕÁ‘…Ñ•AÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€É•ÑÕÉ¸¹…µ”€ôôô€‰ÍÑÉ½­”µÝ¥‘Ñ ˆ€üÑ¡¥Ì¸ÕÁ‘…Ñ•Q¡¥­¹•ÍÌ¡Ù…±Õ”¤€è¹Õ±°ì(€ô(€€ÕÁ‘…Ñ•Q¡¥­¹•ÍÌ¡Ñ¡¥­¹•ÍÌ¤ì(€€€½¹ÍÐm½±‘5…É¥¹`°½±‘5…É¥¹et€ôÑ¡¥Ì¸•Ñ5…É¥¹½µÁ½¹•¹ÑÌ ¤ì(€€€Ñ¡¥Ì¸Ñ¡¥­¹•ÍÌ€ôÑ¡¥­¹•ÍÌì(€€€½¹ÍÐm¹•Ý5…É¥¹`°¹•Ý5…É¥¹et€ôÑ¡¥Ì¸•Ñ5…É¥¹½µÁ½¹•¹ÑÌ ¤ì(€€€½¹ÍÐm‘¥™™5…É¥¹`°‘¥™™5…É¥¹et€ôm¹•Ý5…É¥¹`€´½±‘5…É¥¹`°¹•Ý5…É¥¹d€´½±‘5…É¥¹etì(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¸‰‰½àì(€€€‰‰½álÁt€´ô‘¥™™5…É¥¹`ì(€€€‰‰½álÅt€´ô‘¥™™5…É¥¹dì(€€€‰‰½álÉt€¬ô€È€¨‘¥™™5…É¥¹`ì(€€€‰‰½álÍt€¬ô€È€¨‘¥™™5…É¥¹dì(€€€É•ÑÕÉ¸‰‰½àì(€ô(€ÕÁ‘…Ñ•A…É•¹Ñ¥µ•¹Í¥½¹Ì¡mÝ¥‘Ñ °¡•¥¡Ñt°Í…±”¤ì(€€€½¹ÍÐm½±‘5…É¥¹`°½±‘5…É¥¹et€ôÑ¡¥Ì¸•Ñ5…É¥¹½µÁ½¹•¹ÑÌ ¤ì(€€€Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ €ôÝ¥‘Ñ ì(€€€Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð€ô¡•¥¡Ðì(€€€Ñ¡¥Ì¸Á…É•¹ÑM…±”€ôÍ…±”ì(€€€½¹ÍÐm¹•Ý5…É¥¹`°¹•Ý5…É¥¹et€ôÑ¡¥Ì¸•Ñ5…É¥¹½µÁ½¹•¹ÑÌ ¤ì(€€€½¹ÍÐ‘¥™™5…É¥¹`€ô¹•Ý5…É¥¹`€´½±‘5…É¥¹`ì(€€€½¹ÍÐ‘¥™™5…É¥¹d€ô¹•Ý5…É¥¹d€´½±‘5…É¥¹dì(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¸‰‰½àì(€€€‰‰½álÁt€´ô‘¥™™5…É¥¹`ì(€€€‰‰½álÅt€´ô‘¥™™5…É¥¹dì(€€€‰‰½álÉt€¬ô€È€¨‘¥™™5…É¥¹`ì(€€€‰‰½álÍt€¬ô€È€¨‘¥™™5…É¥¹dì(€€€É•ÑÕÉ¸‰‰½àì(€ô(€ÕÁ‘…Ñ•I½Ñ…Ñ¥½¸¡É½Ñ…Ñ¥½¸¤ì(€€€Ñ¡¥Ì¸ÕÉÉ•¹ÑI½Ñ…Ñ¥½¸€ôÉ½Ñ…Ñ¥½¸ì(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€ÑÉ…¹Í™½É´èÑ¡¥Ì¹É½Ñ…Ñ¥½¹QÉ…¹Í™½É´(€€€€€ô(€€€ôì(€ô(€•ÐÙ¥•Ý	½à ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸‰‰½à¹µ…À¡=ÕÑ±¥¹”¹ÍÙI½Õ¹¤¹©½¥¸ ˆ€ˆ¤ì(€ô(€•Ð‘•™…Õ±ÑAÉ½Á•ÉÑ¥•Ì ¤ì(€€€½¹ÍÐmà°åt€ôÑ¡¥Ì¸‰‰½àì(€€€É•ÑÕÉ¸ì(€€€€€É½½Ðèì(€€€€€€€Ù¥•Ý	½àèÑ¡¥Ì¹Ù¥•Ý	½à(€€€€€ô°(€€€€€Á…Ñ èì(€€€€€€€€‰ÑÉ…¹Í™½É´µ½É¥¥¸ˆè€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡à¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡ä¥õ€(€€€€€ô(€€€ôì(€ô(€•ÐÉ½Ñ…Ñ¥½¹QÉ…¹Í™½É´ ¤ì(€€€½¹ÍÐl°°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸‰‰½àì(€€€±•Ð„€ô€À°(€€€€€ˆ€ô€À°(€€€€€Œ€ô€À°(€€€€€€ô€À°(€€€€€”€ô€À°(€€€€€˜€ô€Àì(€€€ÍÝ¥Ñ €¡Ñ¡¥Ì¸ÕÉÉ•¹ÑI½Ñ…Ñ¥½¸¤ì(€€€€€…Í”€äÀè(€€€€€€€ˆ€ô¡•¥¡Ð€¼Ý¥‘Ñ ì(€€€€€€€Œ€ô€µÝ¥‘Ñ €¼¡•¥¡Ðì(€€€€€€€”€ôÝ¥‘Ñ ì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÄàÀè(€€€€€€€„€ô€´Äì(€€€€€€€€ô€´Äì(€€€€€€€”€ôÝ¥‘Ñ ì(€€€€€€€˜€ô¡•¥¡Ðì(€€€€€€€‰É•…¬ì(€€€€€…Í”€ÈÜÀè(€€€€€€€ˆ€ô€µ¡•¥¡Ð€¼Ý¥‘Ñ ì(€€€€€€€Œ€ôÝ¥‘Ñ €¼¡•¥¡Ðì(€€€€€€€˜€ô¡•¥¡Ðì(€€€€€€€‰É•…¬ì(€€€€€‘•™…Õ±Ðè(€€€€€€€É•ÑÕÉ¸€ˆˆì(€€€ô(€€€É•ÑÕÉ¸µ…ÑÉ¥à ‘í…ô€‘í‰ô€‘íô€‘í‘ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡”¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡˜¥ô¥€ì(€ô(€•ÑA…Ñ¡I•Í¥é¥¹MYAÉ½Á•ÉÑ¥•Ì¡m¹•Ý`°¹•Ýd°¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ñt¤ì(€€€½¹ÍÐmµ…É¥¹`°µ…É¥¹et€ôÑ¡¥Ì¸•Ñ5…É¥¹½µÁ½¹•¹ÑÌ ¤ì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸‰‰½àì(€€€¥˜€¡5…Ñ ¹…‰Ì¡Ý¥‘Ñ €´µ…É¥¹`¤€ðô=ÕÑ±¥¹”¹AI%M%=8ñð5…Ñ ¹…‰Ì¡¡•¥¡Ð€´µ…É¥¹d¤€ðô=ÕÑ±¥¹”¹AI%M%=8¤ì(€€€€€½¹ÍÐÑà€ô¹•Ý`€¬¹•Ý]¥‘Ñ €¼€È€´€¡à€¬Ý¥‘Ñ €¼€È¤ì(€€€€€½¹ÍÐÑä€ô¹•Ýd€¬¹•Ý!•¥¡Ð€¼€È€´€¡ä€¬¡•¥¡Ð€¼€È¤ì(€€€€€É•ÑÕÉ¸ì(€€€€€€€Á…Ñ èì(€€€€€€€€€€‰ÑÉ…¹Í™½É´µ½É¥¥¸ˆè€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡¹•Ý`¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡¹•Ýd¥õ€°(€€€€€€€€€ÑÉ…¹Í™½É´è€‘íÑ¡¥Ì¹É½Ñ…Ñ¥½¹QÉ…¹Í™½ÉµôÑÉ…¹Í±…Ñ” ‘íÑáô€‘íÑåô¥€(€€€€€€€ô(€€€€€ôì(€€€ô(€€€½¹ÍÐÌÅà€ô€¡¹•Ý]¥‘Ñ €´€È€¨µ…É¥¹`¤€¼€¡Ý¥‘Ñ €´€È€¨µ…É¥¹`¤ì(€€€½¹ÍÐÌÅä€ô€¡¹•Ý!•¥¡Ð€´€È€¨µ…É¥¹d¤€¼€¡¡•¥¡Ð€´€È€¨µ…É¥¹d¤ì(€€€½¹ÍÐÌÉà€ôÝ¥‘Ñ €¼¹•Ý]¥‘Ñ ì(€€€½¹ÍÐÌÉä€ô¡•¥¡Ð€¼¹•Ý!•¥¡Ðì(€€€É•ÑÕÉ¸ì(€€€€€Á…Ñ èì(€€€€€€€€‰ÑÉ…¹Í™½É´µ½É¥¥¸ˆè€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡à¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡ä¥õ€°(€€€€€€€ÑÉ…¹Í™½É´è€‘íÑ¡¥Ì¹É½Ñ…Ñ¥½¹QÉ…¹Í™½ÉµôÍ…±” ‘íÌÉáô€‘íÌÉåô¤€€¬ÑÉ…¹Í±…Ñ” ‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡µ…É¥¹`¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡µ…É¥¹d¥ô¤Í…±” ‘íÌÅáô€‘íÌÅåô¤€€¬ÑÉ…¹Í±…Ñ” ‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹ µµ…É¥¹`¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹ µµ…É¥¹d¥ô¥€(€€€€€ô(€€€ôì(€ô(€•ÑA…Ñ¡I•Í¥é•‘MYAÉ½Á•ÉÑ¥•Ì¡m¹•Ý`°¹•Ýd°¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ñt¤ì(€€€½¹ÍÐmµ…É¥¹`°µ…É¥¹et€ôÑ¡¥Ì¸•Ñ5…É¥¹½µÁ½¹•¹ÑÌ ¤ì(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¸‰‰½àì(€€€½¹ÍÐmà°ä°Ý¥‘Ñ °¡•¥¡Ñt€ô‰‰½àì(€€€‰‰½álÁt€ô¹•Ý`ì(€€€‰‰½álÅt€ô¹•Ýdì(€€€‰‰½álÉt€ô¹•Ý]¥‘Ñ ì(€€€‰‰½álÍt€ô¹•Ý!•¥¡Ðì(€€€¥˜€¡5…Ñ ¹…‰Ì¡Ý¥‘Ñ €´µ…É¥¹`¤€ðô=ÕÑ±¥¹”¹AI%M%=8ñð5…Ñ ¹…‰Ì¡¡•¥¡Ð€´µ…É¥¹d¤€ðô=ÕÑ±¥¹”¹AI%M%=8¤ì(€€€€€½¹ÍÐÑà€ô¹•Ý`€¬¹•Ý]¥‘Ñ €¼€È€´€¡à€¬Ý¥‘Ñ €¼€È¤ì(€€€€€½¹ÍÐÑä€ô¹•Ýd€¬¹•Ý!•¥¡Ð€¼€È€´€¡ä€¬¡•¥¡Ð€¼€È¤ì(€€€€€™½È€¡½¹ÍÐì(€€€€€€€±¥¹”°(€€€€€€€Á½¥¹ÑÌ(€€€€€ô½˜Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€€€=ÕÑ±¥¹”¹}ÑÉ…¹Í±…Ñ”¡±¥¹”°Ñà°Ñä°±¥¹”¤ì(€€€€€€€=ÕÑ±¥¹”¹}ÑÉ…¹Í±…Ñ”¡Á½¥¹ÑÌ°Ñà°Ñä°Á½¥¹ÑÌ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€€€€€É½½Ðèì(€€€€€€€€€Ù¥•Ý	½àèÑ¡¥Ì¹Ù¥•Ý	½à(€€€€€€€ô°(€€€€€€€Á…Ñ èì(€€€€€€€€€€‰ÑÉ…¹Í™½É´µ½É¥¥¸ˆè€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡¹•Ý`¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡¹•Ýd¥õ€°(€€€€€€€€€ÑÉ…¹Í™½É´èÑ¡¥Ì¹É½Ñ…Ñ¥½¹QÉ…¹Í™½É´ñð¹Õ±°°(€€€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤(€€€€€€€ô(€€€€€ôì(€€€ô(€€€½¹ÍÐÌÅà€ô€¡¹•Ý]¥‘Ñ €´€È€¨µ…É¥¹`¤€¼€¡Ý¥‘Ñ €´€È€¨µ…É¥¹`¤ì(€€€½¹ÍÐÌÅä€ô€¡¹•Ý!•¥¡Ð€´€È€¨µ…É¥¹d¤€¼€¡¡•¥¡Ð€´€È€¨µ…É¥¹d¤ì(€€€½¹ÍÐÑà€ô€µÌÅà€¨€¡à€¬µ…É¥¹`¤€¬¹•Ý`€¬µ…É¥¹`ì(€€€½¹ÍÐÑä€ô€µÌÅä€¨€¡ä€¬µ…É¥¹d¤€¬¹•Ýd€¬µ…É¥¹dì(€€€¥˜€¡ÌÅà€„ôô€ÄñðÌÅä€„ôô€ÄñðÑà€„ôô€ÀñðÑä€„ôô€À¤ì(€€€€€™½È€¡½¹ÍÐì(€€€€€€€±¥¹”°(€€€€€€€Á½¥¹ÑÌ(€€€€€ô½˜Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€€€=ÕÑ±¥¹”¹}É•Í…±”¡±¥¹”°Ñà°Ñä°ÌÅà°ÌÅä°±¥¹”¤ì(€€€€€€€=ÕÑ±¥¹”¹}É•Í…±”¡Á½¥¹ÑÌ°Ñà°Ñä°ÌÅà°ÌÅä°Á½¥¹ÑÌ¤ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸ì(€€€€€É½½Ðèì(€€€€€€€Ù¥•Ý	½àèÑ¡¥Ì¹Ù¥•Ý	½à(€€€€€ô°(€€€€€Á…Ñ èì(€€€€€€€€‰ÑÉ…¹Í™½É´µ½É¥¥¸ˆè€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡¹•Ý`¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡¹•Ýd¥õ€°(€€€€€€€ÑÉ…¹Í™½É´èÑ¡¥Ì¹É½Ñ…Ñ¥½¹QÉ…¹Í™½É´ñð¹Õ±°°(€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤(€€€€€ô(€€€ôì(€ô(€•ÑA…Ñ¡QÉ…¹Í±…Ñ•‘MYAÉ½Á•ÉÑ¥•Ì¡m¹•Ý`°¹•Ýet°Á…É•¹Ñ¥µ•¹Í¥½¹Ì¤ì(€€€½¹ÍÐm¹•ÝA…É•¹Ñ]¥‘Ñ °¹•ÝA…É•¹Ñ!•¥¡Ñt€ôÁ…É•¹Ñ¥µ•¹Í¥½¹Ìì(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¸‰‰½àì(€€€½¹ÍÐÑà€ô¹•Ý`€´‰‰½álÁtì(€€€½¹ÍÐÑä€ô¹•Ýd€´‰‰½álÅtì(€€€¥˜€¡Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ €ôôô¹•ÝA…É•¹Ñ]¥‘Ñ €˜˜Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð€ôôô¹•ÝA…É•¹Ñ!•¥¡Ð¤ì(€€€€€™½È€¡½¹ÍÐì(€€€€€€€±¥¹”°(€€€€€€€Á½¥¹ÑÌ(€€€€€ô½˜Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€€€=ÕÑ±¥¹”¹}ÑÉ…¹Í±…Ñ”¡±¥¹”°Ñà°Ñä°±¥¹”¤ì(€€€€€€€=ÕÑ±¥¹”¹}ÑÉ…¹Í±…Ñ”¡Á½¥¹ÑÌ°Ñà°Ñä°Á½¥¹ÑÌ¤ì(€€€€€ô(€€€ô•±Í”ì(€€€€€½¹ÍÐÍà€ôÑ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ €¼¹•ÝA…É•¹Ñ]¥‘Ñ ì(€€€€€½¹ÍÐÍä€ôÑ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð€¼¹•ÝA…É•¹Ñ!•¥¡Ðì(€€€€€Ñ¡¥Ì¸Á…É•¹Ñ]¥‘Ñ €ô¹•ÝA…É•¹Ñ]¥‘Ñ ì(€€€€€Ñ¡¥Ì¸Á…É•¹Ñ!•¥¡Ð€ô¹•ÝA…É•¹Ñ!•¥¡Ðì(€€€€€™½È€¡½¹ÍÐì(€€€€€€€±¥¹”°(€€€€€€€Á½¥¹ÑÌ(€€€€€ô½˜Ñ¡¥Ì¸±¥¹•Ì¤ì(€€€€€€€=ÕÑ±¥¹”¹}É•Í…±”¡±¥¹”°Ñà°Ñä°Íà°Íä°±¥¹”¤ì(€€€€€€€=ÕÑ±¥¹”¹}É•Í…±”¡Á½¥¹ÑÌ°Ñà°Ñä°Íà°Íä°Á½¥¹ÑÌ¤ì(€€€€€ô(€€€€€‰‰½álÉt€¨ôÍàì(€€€€€‰‰½álÍt€¨ôÍäì(€€€ô(€€€‰‰½álÁt€ô¹•Ý`ì(€€€‰‰½álÅt€ô¹•Ýdì(€€€É•ÑÕÉ¸ì(€€€€€É½½Ðèì(€€€€€€€Ù¥•Ý	½àèÑ¡¥Ì¹Ù¥•Ý	½à(€€€€€ô°(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤°(€€€€€€€€‰ÑÉ…¹Í™½É´µ½É¥¥¸ˆè€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡¹•Ý`¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡¹•Ýd¥õ€(€€€€€ô(€€€ôì(€ô(€•Ð‘•™…Õ±ÑMYAÉ½Á•ÉÑ¥•Ì ¤ì(€€€½¹ÍÐ‰‰½à€ôÑ¡¥Ì¸‰‰½àì(€€€É•ÑÕÉ¸ì(€€€€€É½½Ðèì(€€€€€€€Ù¥•Ý	½àèÑ¡¥Ì¹Ù¥•Ý	½à(€€€€€ô°(€€€€€É½½Ñ±…ÍÌèì(€€€€€€€‘É…ÜèÑÉÕ”(€€€€€ô°(€€€€€Á…Ñ èì(€€€€€€€èÑ¡¥Ì¹Ñ½MYA…Ñ  ¤°(€€€€€€€€‰ÑÉ…¹Í™½É´µ½É¥¥¸ˆè€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡‰‰½álÁt¥ô€‘í=ÕÑ±¥¹”¹ÍÙI½Õ¹¡‰‰½álÅt¥õ€°(€€€€€€€ÑÉ…¹Í™½É´èÑ¡¥Ì¹É½Ñ…Ñ¥½¹QÉ…¹Í™½É´ñð¹Õ±°(€€€€€ô°(€€€€€‰‰½à(€€€ôì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½¥¹¬¹©Ì(((((()±…ÍÌ%¹­É…Ý¥¹=ÁÑ¥½¹Ì•áÑ•¹‘ÌÉ…Ý¥¹=ÁÑ¥½¹Ìì(€½¹ÍÑÉÕÑ½È¡Ù¥•Ý•ÉA…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È ¤ì(€€€Ñ¡¥Ì¹}Ù¥•ÝA…É…µ•Ñ•ÉÌ€ôÙ¥•Ý•ÉA…É…µ•Ñ•ÉÌì(€€€ÍÕÁ•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡ì(€€€€€™¥±°è€‰¹½¹”ˆ°(€€€€€ÍÑÉ½­”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}‘•™…Õ±Ñ1¥¹•½±½È°(€€€€€€‰ÍÑÉ½­”µ½Á…¥Ñäˆè€Ä°(€€€€€€‰ÍÑÉ½­”µÝ¥‘Ñ ˆè€Ä°(€€€€€€‰ÍÑÉ½­”µ±¥¹•…Àˆè€‰É½Õ¹ˆ°(€€€€€€‰ÍÑÉ½­”µ±¥¹•©½¥¸ˆè€‰É½Õ¹ˆ°(€€€€€€‰ÍÑÉ½­”µµ¥Ñ•É±¥µ¥Ðˆè€ÄÀ(€€€ô¤ì(€ô(€ÕÁ‘…Ñ•MYAÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€¥˜€¡¹…µ”€ôôô€‰ÍÑÉ½­”µÝ¥‘Ñ ˆ¤ì(€€€€€Ù…±Õ”€üüôÑ¡¥Íl‰ÍÑÉ½­”µÝ¥‘Ñ ‰tì(€€€€€Ù…±Õ”€¨ôÑ¡¥Ì¹}Ù¥•ÝA…É…µ•Ñ•ÉÌ¹É•…±M…±”ì(€€€ô(€€€ÍÕÁ•È¹ÕÁ‘…Ñ•MYAÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€ô(€±½¹” ¤ì(€€€½¹ÍÐ±½¹”€ô¹•Ü%¹­É…Ý¥¹=ÁÑ¥½¹Ì¡Ñ¡¥Ì¹}Ù¥•ÝA…É…µ•Ñ•ÉÌ¤ì(€€€±½¹”¹ÕÁ‘…Ñ•±°¡Ñ¡¥Ì¤ì(€€€É•ÑÕÉ¸±½¹”ì(€ô)ô)±…ÍÌ%¹­‘¥Ñ½È•áÑ•¹‘ÌÉ…Ý¥¹‘¥Ñ½Èì(€ÍÑ…Ñ¥Œ}ÑåÁ”€ô€‰¥¹¬ˆì(€ÍÑ…Ñ¥Œ}•‘¥Ñ½ÉQåÁ”€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹%9,ì(€ÍÑ…Ñ¥Œ}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µÌ¤ì(€€€ÍÕÁ•È¡ì(€€€€€€¸¸¹Á…É…µÌ°(€€€€€¹…µ”è€‰¥¹­‘¥Ñ½Èˆ(€€€ô¤ì(€€€Ñ¡¥Ì¹}Ý¥±±-••ÁÍÁ•ÑI…Ñ¥¼€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹‘•™…Õ±Ñ0ÄÁ¹%€ô€‰Á‘™©Ìµ•‘¥Ñ½Èµ¥¹¬µ•‘¥Ñ½Èˆì(€ô(€ÍÑ…Ñ¥Œ¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì€ô¹•Ü%¹­É…Ý¥¹=ÁÑ¥½¹Ì¡Õ¥5…¹…•È¹Ù¥•ÝA…É…µ•Ñ•ÉÌ¤ì(€ô(€ÍÑ…Ñ¥Œ•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¡½ÁÑ¥½¹Ì¤ì(€€€½¹ÍÐ±½¹”€ôÑ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹±½¹” ¤ì(€€€±½¹”¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡½ÁÑ¥½¹Ì¤ì(€€€É•ÑÕÉ¸±½¹”ì(€ô(€ÍÑ…Ñ¥Œ•ÐÍÕÁÁ½ÉÑ5Õ±Ñ¥Á±•É…Ý¥¹Ì ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€ÍÑ…Ñ¥Œ•ÐÑåÁ•Í5…À ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰ÑåÁ•Í5…Àˆ°¹•Ü5…À¡mm¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}Q!%-9ML°€‰ÍÑÉ½­”µÝ¥‘Ñ ‰t°m¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=1=H°€‰ÍÑÉ½­”‰t°m¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=A%Qd°€‰ÍÑÉ½­”µ½Á…¥Ñä‰ut¤¤ì(€ô(€ÍÑ…Ñ¥ŒÉ•…Ñ•É…Ý•É%¹ÍÑ…¹”¡ì(€€€à°(€€€ä°(€€€‰½àèl°°Ý¥‘Ñ °¡•¥¡Ñt°(€€€É½Ñ…Ñ¥½¸(€ô¤ì(€€€É•ÑÕÉ¸¹•Ü%¹­É…Ý=ÕÑ±¥¹•È¡à°ä°Ý¥‘Ñ °¡•¥¡Ð°É½Ñ…Ñ¥½¸°Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Íl‰ÍÑÉ½­”µÝ¥‘Ñ ‰t¤ì(€ô(€ÍÑ…Ñ¥Œ‘•Í•É¥…±¥é•É…Ü¡Á…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ð°¥¹¹•É5…É¥¸°‘…Ñ„¤ì(€€€É•ÑÕÉ¸%¹­É…Ý=ÕÑ±¥¹”¹‘•Í•É¥…±¥é”¡Á…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ð°¥¹¹•É5…É¥¸°‘…Ñ„¤ì(€ô(€ÍÑ…Ñ¥Œ…Íå¹Œ‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€±•Ð¥¹¥Ñ¥…±…Ñ„€ô¹Õ±°ì(€€€¥˜€¡‘…Ñ„¥¹ÍÑ…¹•½˜%¹­¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤ì(€€€€€½¹ÍÐì(€€€€€€€‘…Ñ„èì(€€€€€€€€€¥¹­1¥ÍÑÌ°(€€€€€€€€€É•Ð°(€€€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€€€¥°(€€€€€€€€€½±½È°(€€€€€€€€€½Á…¥Ñä°(€€€€€€€€€‰½É‘•ÉMÑå±”èì(€€€€€€€€€€€É…Ý]¥‘Ñ èÑ¡¥­¹•ÍÌ(€€€€€€€€€ô°(€€€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€€€É¥¡Q•áÐ°(€€€€€€€€€½¹Ñ•¹ÑÍ=‰¨°(€€€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€€€ô°(€€€€€€€Á…É•¹Ðèì(€€€€€€€€€Á…”èì(€€€€€€€€€€€Á…•9Õµ‰•È(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô€ô‘…Ñ„ì(€€€€€¥¹¥Ñ¥…±…Ñ„€ô‘…Ñ„€ôì(€€€€€€€…¹¹½Ñ…Ñ¥½¹QåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹%9,°(€€€€€€€½±½ÈèÉÉ…ä¹™É½´¡½±½È¤°(€€€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€€€½Á…¥Ñä°(€€€€€€€Á…Ñ¡Ìèì(€€€€€€€€€Á½¥¹ÑÌè¥¹­1¥ÍÑÌ(€€€€€€€ô°(€€€€€€€‰½á•Ìè¹Õ±°°(€€€€€€€Á…•%¹‘•àèÁ…•9Õµ‰•È€´€Ä°(€€€€€€€É•ÐèÉ•Ð¹Í±¥” À¤°(€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%è¥°(€€€€€€€¥°(€€€€€€€‘•±•Ñ•è™…±Í”°(€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€É¥¡Q•áÐ°(€€€€€€€½µµ•¹Ðè½¹Ñ•¹ÑÍ=‰¨ü¹ÍÑÈñð¹Õ±°°(€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€ôì(€€€ô(€€€½¹ÍÐ•‘¥Ñ½È€ô…Ý…¥ÐÍÕÁ•È¹‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€•‘¥Ñ½È¹}¥¹¥Ñ¥…±…Ñ„€ô¥¹¥Ñ¥…±…Ñ„ì(€€€¥˜€¡‘…Ñ„¹½µµ•¹Ð¤ì(€€€€€•‘¥Ñ½È¹Í•Ñ½µµ•¹Ñ…Ñ„¡‘…Ñ„¤ì(€€€ô(€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€ô(€•ÐÑ½½±‰…É	ÕÑÑ½¹Ì ¤ì(€€€Ñ¡¥Ì¹}½±½ÉA¥­•Èñðô¹•Ü	…Í¥½±½ÉA¥­•È¡Ñ¡¥Ì¤ì(€€€É•ÑÕÉ¸ml‰½±½ÉA¥­•Èˆ°Ñ¡¥Ì¹}½±½ÉA¥­•Éutì(€ô(€•Ð½±½ÉQåÁ” ¤ì(€€€É•ÑÕÉ¸¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=1=Hì(€ô(€•Ð½±½É¹‘=Á…¥ÑåQåÁ” ¤ì(€€€É•ÑÕÉ¸¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=1=I}9}=A%Qdì(€ô(€•Ð½Á…¥ÑåQåÁ” ¤ì(€€€É•ÑÕÉ¸¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=A%Qdì(€ô(€ÕÁ‘…Ñ•A…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€€€¥˜€¡ÑåÁ”€ôôô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=1=I}9}=A%Qd¤ì(€€€€€Ñ¡¥Ì¹}ÕÁ‘…Ñ•½±½É¹‘=Á…¥Ñä¡Ù…±Õ”¹½±½È°Ù…±Õ”¹½Á…¥Ñä¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹ÕÁ‘…Ñ•A…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€ô(€ÍÑ…Ñ¥ŒÕÁ‘…Ñ••™…Õ±ÑA…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€€€¥˜€¡ÑåÁ”€ôôô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=1=I}9}=A%Qd¤ì(€€€€€ÍÕÁ•È¹ÕÁ‘…Ñ••™…Õ±ÑA…É…µÌ¡¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=1=H°Ù…±Õ”¹½±½È¤ì(€€€€€ÍÕÁ•È¹ÕÁ‘…Ñ••™…Õ±ÑA…É…µÌ¡¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”¹%9-}=A%Qd°Ù…±Õ”¹½Á…¥Ñä¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹ÕÁ‘…Ñ••™…Õ±ÑA…É…µÌ¡ÑåÁ”°Ù…±Õ”¤ì(€ô(€•Ð½±½È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì¹ÍÑÉ½­”ì(€ô(€•Ð½Á…¥Ñä ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Íl‰ÍÑÉ½­”µ½Á…¥Ñä‰tì(€ô(€½¹M…±•¡…¹¥¹œ ¤ì(€€€¥˜€ …Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹½¹M…±•¡…¹¥¹œ ¤ì(€€€½¹ÍÐì(€€€€€}‘É…Ý%°(€€€€€}‘É…Ý¥¹=ÁÑ¥½¹Ì°(€€€€€Á…É•¹Ð(€€€ô€ôÑ¡¥Ìì(€€€}‘É…Ý¥¹=ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•MYAÉ½Á•ÉÑä ‰ÍÑÉ½­”µÝ¥‘Ñ ˆ¤ì(€€€Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡}‘É…Ý%°}‘É…Ý¥¹=ÁÑ¥½¹Ì¹Ñ½MYAÉ½Á•ÉÑ¥•Ì ¤¤ì(€ô(€ÍÑ…Ñ¥Œ½¹M…±•¡…¹¥¹]¡•¹É…Ý¥¹œ ¤ì(€€€½¹ÍÐÁ…É•¹Ð€ôÑ¡¥Ì¹}ÕÉÉ•¹ÑA…É•¹Ðì(€€€¥˜€ …Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹½¹M…±•¡…¹¥¹]¡•¹É…Ý¥¹œ ¤ì(€€€Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•MYAÉ½Á•ÉÑä ‰ÍÑÉ½­”µÝ¥‘Ñ ˆ¤ì(€€€Á…É•¹Ð¹‘É…Ý1…å•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Ñ¡¥Ì¹}ÕÉÉ•¹ÑÉ…Ý%°Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹Ñ½MYAÉ½Á•ÉÑ¥•Ì ¤¤ì(€ô(€É•…Ñ•É…Ý¥¹=ÁÑ¥½¹Ì¡ì(€€€½±½È°(€€€Ñ¡¥­¹•ÍÌ°(€€€½Á…¥Ñä(€ô¤ì(€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì€ô%¹­‘¥Ñ½È¹•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¡ì(€€€€€ÍÑÉ½­”èUÑ¥°¹µ…­•!•á½±½È ¸¸¹½±½È¤°(€€€€€€‰ÍÑÉ½­”µÝ¥‘Ñ ˆèÑ¡¥­¹•ÍÌ°(€€€€€€‰ÍÑÉ½­”µ½Á…¥Ñäˆè½Á…¥Ñä(€€€ô¤ì(€ô(€Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ€ô™…±Í”¤ì(€€€¥˜€¡Ñ¡¥Ì¹¥ÍµÁÑä ¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹‘•±•Ñ•¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹Í•É¥…±¥é••±•Ñ• ¤ì(€€€ô(€€€½¹ÍÐì(€€€€€±¥¹•Ì°(€€€€€Á½¥¹ÑÌ(€€€ô€ôÑ¡¥Ì¹Í•É¥…±¥é•É…Ü¡¥Í½É½Áå¥¹œ¤ì(€€€½¹ÍÐì(€€€€€}‘É…Ý¥¹=ÁÑ¥½¹Ìèì(€€€€€€€ÍÑÉ½­”°(€€€€€€€€‰ÍÑÉ½­”µ½Á…¥Ñäˆè½Á…¥Ñä°(€€€€€€€€‰ÍÑÉ½­”µÝ¥‘Ñ ˆèÑ¡¥­¹•ÍÌ(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐÍ•É¥…±¥é•€ô=‰©•Ð¹…ÍÍ¥¸¡ÍÕÁ•È¹Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ¤°ì(€€€€€½±½Èè¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}½±½É5…¹…•È¹½¹Ù•ÉÐ¡ÍÑÉ½­”¤°(€€€€€½Á…¥Ñä°(€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€Á…Ñ¡Ìèì(€€€€€€€±¥¹•Ì°(€€€€€€€Á½¥¹ÑÌ(€€€€€ô(€€€ô¤ì(€€€Ñ¡¥Ì¹…‘‘½µµ•¹Ð¡Í•É¥…±¥é•¤ì(€€€¥˜€¡¥Í½É½Áå¥¹œ¤ì(€€€€€Í•É¥…±¥é•¹¥Í½Áä€ôÑÉÕ”ì(€€€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%€˜˜€…Ñ¡¥Ì¸¡…Í±•µ•¹Ñ¡…¹•¡Í•É¥…±¥é•¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€Í•É¥…±¥é•¹¥€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%ì(€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€ô(€€¡…Í±•µ•¹Ñ¡…¹•¡Í•É¥…±¥é•¤ì(€€€½¹ÍÐì(€€€€€½±½È°(€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€½Á…¥Ñä°(€€€€€Á…•%¹‘•à(€€€ô€ôÑ¡¥Ì¹}¥¹¥Ñ¥…±…Ñ„ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹¡…Í‘¥Ñ•‘½µµ•¹ÐñðÑ¡¥Ì¹}¡…Í	••¹5½Ù•ñðÑ¡¥Ì¹}¡…Í	••¹I•Í¥é•ñðÍ•É¥…±¥é•¹½±½È¹Í½µ” ¡Œ°¤¤€ôøŒ€„ôô½±½Ém¥t¤ñðÍ•É¥…±¥é•¹Ñ¡¥­¹•ÍÌ€„ôôÑ¡¥­¹•ÍÌñðÍ•É¥…±¥é•¹½Á…¥Ñä€„ôô½Á…¥ÑäñðÍ•É¥…±¥é•¹Á…•%¹‘•à€„ôôÁ…•%¹‘•àì(€ô(€É•¹‘•É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¸¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘•±•Ñ•¤ì(€€€€€…¹¹½Ñ…Ñ¥½¸¹¡¥‘” ¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€½¹ÍÐì(€€€€€Á½¥¹ÑÌ°(€€€€€É•Ð(€€€ô€ôÑ¡¥Ì¹Í•É¥…±¥é•É…Ü¡™…±Í”¤ì(€€€…¹¹½Ñ…Ñ¥½¸¹ÕÁ‘…Ñ•‘¥Ñ•¡ì(€€€€€É•Ð°(€€€€€Ñ¡¥­¹•ÍÌèÑ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Íl‰ÍÑÉ½­”µÝ¥‘Ñ ‰t°(€€€€€Á½¥¹ÑÌ°(€€€€€Á½ÁÕÀèÑ¡¥Ì¹½µµ•¹Ð(€€€ô¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½‘É…Ý•ÉÌ½½¹Ñ½ÕÈ¹©Ì()±…ÍÌ½¹Ñ½ÕÉÉ…Ý=ÕÑ±¥¹”•áÑ•¹‘Ì%¹­É…Ý=ÕÑ±¥¹”ì(€Ñ½MYA…Ñ  ¤ì(€€€±•ÐÁ…Ñ €ôÍÕÁ•È¹Ñ½MYA…Ñ  ¤ì(€€€¥˜€ …Á…Ñ ¹•¹‘Í]¥Ñ  ‰hˆ¤¤ì(€€€€€Á…Ñ €¬ô€‰hˆì(€€€ô(€€€É•ÑÕÉ¸Á…Ñ ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½‘É…Ý•ÉÌ½Í¥¹…ÑÕÉ•‘É…Ü¹©Ì(((()½¹ÍÐ	M}!I}19Q €ô€àì)½¹ÍÐA=%9QM}AI=AIQ%M}9U5	H€ô€Ìì)±…ÍÌM¥¹…ÑÕÉ•áÑÉ…Ñ½Èì(€ÍÑ…Ñ¥Œ€AI5QIL€ôì(€€€µ…á¥´è€ÔÄÈ°(€€€Í¥µ…M…Ñ½Èè€À¸ÀÈ°(€€€Í¥µ…Hè€ÈÔ°(€€€­•É¹•±M¥é”è€ÄØ(€ôì(€ÍÑ…Ñ¥Œ€¹•¥¡‰½É%¹‘•áQ½%¡¤À°¨À°¤°¨¤ì(€€€¤€´ô¤Àì(€€€¨€´ô¨Àì(€€€¥˜€¡¤€ôôô€À¤ì(€€€€€É•ÑÕÉ¸¨€ø€À€ü€À€è€Ðì(€€€ô(€€€¥˜€¡¤€ôôô€Ä¤ì(€€€€€É•ÑÕÉ¸¨€¬€Øì(€€€ô(€€€É•ÑÕÉ¸€È€´¨ì(€ô(€ÍÑ…Ñ¥Œ€¹•¥¡‰½É%‘Q½%¹‘•à€ô¹•Ü%¹ÐÌÉÉÉ…ä¡lÀ°€Ä°€´Ä°€Ä°€´Ä°€À°€´Ä°€´Ä°€À°€´Ä°€Ä°€´Ä°€Ä°€À°€Ä°€Åt¤ì(€ÍÑ…Ñ¥Œ€±½­Ý¥Í•9½¹i•É¼¡‰Õ˜°Ý¥‘Ñ °¤À°¨À°¤°¨°½™™Í•Ð¤ì(€€€½¹ÍÐ¥€ôÑ¡¥Ì¸¹•¥¡‰½É%¹‘•áQ½%¡¤À°¨À°¤°¨¤ì(€€€™½È€¡±•Ð¬€ô€Àì¬€ð€àì¬¬¬¤ì(€€€€€½¹ÍÐ­¬€ô€ µ¬€¬¥€´½™™Í•Ð€¬€ÄØ¤€”€àì(€€€€€½¹ÍÐÍ¡¥™Ñ$€ôÑ¡¥Ì¸¹•¥¡‰½É%‘Q½%¹‘•álÈ€¨­­tì(€€€€€½¹ÍÐÍ¡¥™Ñ(€ôÑ¡¥Ì¸¹•¥¡‰½É%‘Q½%¹‘•álÈ€¨­¬€¬€Åtì(€€€€€¥˜€¡‰Õ™l¡¤À€¬Í¡¥™Ñ$¤€¨Ý¥‘Ñ €¬€¡¨À€¬Í¡¥™Ñ(¥t€„ôô€À¤ì(€€€€€€€É•ÑÕÉ¸­¬ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸€´Äì(€ô(€ÍÑ…Ñ¥Œ€½Õ¹Ñ•É±½­Ý¥Í•9½¹i•É¼¡‰Õ˜°Ý¥‘Ñ °¤À°¨À°¤°¨°½™™Í•Ð¤ì(€€€½¹ÍÐ¥€ôÑ¡¥Ì¸¹•¥¡‰½É%¹‘•áQ½%¡¤À°¨À°¤°¨¤ì(€€€™½È€¡±•Ð¬€ô€Àì¬€ð€àì¬¬¬¤ì(€€€€€½¹ÍÐ­¬€ô€¡¬€¬¥€¬½™™Í•Ð€¬€ÄØ¤€”€àì(€€€€€½¹ÍÐÍ¡¥™Ñ$€ôÑ¡¥Ì¸¹•¥¡‰½É%‘Q½%¹‘•álÈ€¨­­tì(€€€€€½¹ÍÐÍ¡¥™Ñ(€ôÑ¡¥Ì¸¹•¥¡‰½É%‘Q½%¹‘•álÈ€¨­¬€¬€Åtì(€€€€€¥˜€¡‰Õ™l¡¤À€¬Í¡¥™Ñ$¤€¨Ý¥‘Ñ €¬€¡¨À€¬Í¡¥™Ñ(¥t€„ôô€À¤ì(€€€€€€€É•ÑÕÉ¸­¬ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸€´Äì(€ô(€ÍÑ…Ñ¥Œ€™¥¹‘½¹Ñ½ÕÉÌ¡‰Õ˜°Ý¥‘Ñ °¡•¥¡Ð°Ñ¡É•Í¡½±¤ì(€€€½¹ÍÐ8€ô‰Õ˜¹±•¹Ñ ì(€€€½¹ÍÐÑåÁ•Ì€ô¹•Ü%¹ÐÌÉÉÉ…ä¡8¤ì(€€€™½È€¡±•Ð¤€ô€Àì¤€ð8ì¤¬¬¤ì(€€€€€ÑåÁ•Ím¥t€ô‰Õ™m¥t€ðôÑ¡É•Í¡½±€ü€Ä€è€Àì(€€€ô(€€€™½È€¡±•Ð¤€ô€Äì¤€ð¡•¥¡Ð€´€Äì¤¬¬¤ì(€€€€€ÑåÁ•Ím¤€¨Ý¥‘Ñ¡t€ôÑåÁ•Ím¤€¨Ý¥‘Ñ €¬Ý¥‘Ñ €´€Åt€ô€Àì(€€€ô(€€€™½È€¡±•Ð¤€ô€Àì¤€ðÝ¥‘Ñ ì¤¬¬¤ì(€€€€€ÑåÁ•Ím¥t€ôÑåÁ•ÍmÝ¥‘Ñ €¨¡•¥¡Ð€´€Ä€´¥t€ô€Àì(€€€ô(€€€±•Ð¹‰€ô€Äì(€€€±•Ð±¹‰ì(€€€½¹ÍÐ½¹Ñ½ÕÉÌ€ômtì(€€€™½È€¡±•Ð¤€ô€Äì¤€ð¡•¥¡Ð€´€Äì¤¬¬¤ì(€€€€€±¹‰€ô€Äì(€€€€€™½È€¡±•Ð¨€ô€Äì¨€ðÝ¥‘Ñ €´€Äì¨¬¬¤ì(€€€€€€€½¹ÍÐ¥¨€ô¤€¨Ý¥‘Ñ €¬¨ì(€€€€€€€½¹ÍÐÁ¥à€ôÑåÁ•Ím¥©tì(€€€€€€€¥˜€¡Á¥à€ôôô€À¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€±•Ð¤È€ô¤ì(€€€€€€€±•Ð¨È€ô¨ì(€€€€€€€¥˜€¡Á¥à€ôôô€Ä€˜˜ÑåÁ•Ím¥¨€´€Åt€ôôô€À¤ì(€€€€€€€€€¹‰€¬ô€Äì(€€€€€€€€€¨È€´ô€Äì(€€€€€€€ô•±Í”¥˜€¡Á¥à€øô€Ä€˜˜ÑåÁ•Ím¥¨€¬€Åt€ôôô€À¤ì(€€€€€€€€€¹‰€¬ô€Äì(€€€€€€€€€¨È€¬ô€Äì(€€€€€€€€€¥˜€¡Á¥à€ø€Ä¤ì(€€€€€€€€€€€±¹‰€ôÁ¥àì(€€€€€€€€€ô(€€€€€€€ô•±Í”ì(€€€€€€€€€¥˜€¡Á¥à€„ôô€Ä¤ì(€€€€€€€€€€€±¹‰€ô5…Ñ ¹…‰Ì¡Á¥à¤ì(€€€€€€€€€ô(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€½¹ÍÐÁ½¥¹ÑÌ€ôm¨°¥tì(€€€€€€€½¹ÍÐ¥Í!½±”€ô¨È€ôôô¨€¬€Äì(€€€€€€€½¹ÍÐ½¹Ñ½ÕÈ€ôì(€€€€€€€€€¥Í!½±”°(€€€€€€€€€Á½¥¹ÑÌ°(€€€€€€€€€¥è¹‰°(€€€€€€€€€Á…É•¹Ðè€À(€€€€€€€ôì(€€€€€€€½¹Ñ½ÕÉÌ¹ÁÕÍ ¡½¹Ñ½ÕÈ¤ì(€€€€€€€±•Ð½¹Ñ½ÕÈÀì(€€€€€€€™½È€¡½¹ÍÐŒ½˜½¹Ñ½ÕÉÌ¤ì(€€€€€€€€€¥˜€¡Œ¹¥€ôôô±¹‰¤ì(€€€€€€€€€€€½¹Ñ½ÕÈÀ€ôŒì(€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€€€¥˜€ …½¹Ñ½ÕÈÀ¤ì(€€€€€€€€€½¹Ñ½ÕÈ¹Á…É•¹Ð€ô¥Í!½±”€ü±¹‰€è€Àì(€€€€€€€ô•±Í”¥˜€¡½¹Ñ½ÕÈÀ¹¥Í!½±”¤ì(€€€€€€€€€½¹Ñ½ÕÈ¹Á…É•¹Ð€ô¥Í!½±”€ü½¹Ñ½ÕÈÀ¹Á…É•¹Ð€è±¹‰ì(€€€€€€€ô•±Í”ì(€€€€€€€€€½¹Ñ½ÕÈ¹Á…É•¹Ð€ô¥Í!½±”€ü±¹‰€è½¹Ñ½ÕÈÀ¹Á…É•¹Ðì(€€€€€€€ô(€€€€€€€½¹ÍÐ¬€ôÑ¡¥Ì¸±½­Ý¥Í•9½¹i•É¼¡ÑåÁ•Ì°Ý¥‘Ñ °¤°¨°¤È°¨È°€À¤ì(€€€€€€€¥˜€¡¬€ôôô€´Ä¤ì(€€€€€€€€€ÑåÁ•Ím¥©t€ô€µ¹‰ì(€€€€€€€€€¥˜€¡ÑåÁ•Ím¥©t€„ôô€Ä¤ì(€€€€€€€€€€€±¹‰€ô5…Ñ ¹…‰Ì¡ÑåÁ•Ím¥©t¤ì(€€€€€€€€€ô(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€±•ÐÍ¡¥™Ñ$€ôÑ¡¥Ì¸¹•¥¡‰½É%‘Q½%¹‘•álÈ€¨­tì(€€€€€€€±•ÐÍ¡¥™Ñ(€ôÑ¡¥Ì¸¹•¥¡‰½É%‘Q½%¹‘•álÈ€¨¬€¬€Åtì(€€€€€€€½¹ÍÐ¤Ä€ô¤€¬Í¡¥™Ñ$ì(€€€€€€€½¹ÍÐ¨Ä€ô¨€¬Í¡¥™Ñ(ì(€€€€€€€¤È€ô¤Äì(€€€€€€€¨È€ô¨Äì(€€€€€€€±•Ð¤Ì€ô¤ì(€€€€€€€±•Ð¨Ì€ô¨ì(€€€€€€€Ý¡¥±”€¡ÑÉÕ”¤ì(€€€€€€€€€½¹ÍÐ­¬€ôÑ¡¥Ì¸½Õ¹Ñ•É±½­Ý¥Í•9½¹i•É¼¡ÑåÁ•Ì°Ý¥‘Ñ °¤Ì°¨Ì°¤È°¨È°€Ä¤ì(€€€€€€€€€Í¡¥™Ñ$€ôÑ¡¥Ì¸¹•¥¡‰½É%‘Q½%¹‘•álÈ€¨­­tì(€€€€€€€€€Í¡¥™Ñ(€ôÑ¡¥Ì¸¹•¥¡‰½É%‘Q½%¹‘•álÈ€¨­¬€¬€Åtì(€€€€€€€€€½¹ÍÐ¤Ð€ô¤Ì€¬Í¡¥™Ñ$ì(€€€€€€€€€½¹ÍÐ¨Ð€ô¨Ì€¬Í¡¥™Ñ(ì(€€€€€€€€€Á½¥¹ÑÌ¹ÁÕÍ ¡¨Ð°¤Ð¤ì(€€€€€€€€€½¹ÍÐ¥¨Ì€ô¤Ì€¨Ý¥‘Ñ €¬¨Ìì(€€€€€€€€€¥˜€¡ÑåÁ•Ím¥¨Ì€¬€Åt€ôôô€À¤ì(€€€€€€€€€€€ÑåÁ•Ím¥¨Ít€ô€µ¹‰ì(€€€€€€€€€ô•±Í”¥˜€¡ÑåÁ•Ím¥¨Ít€ôôô€Ä¤ì(€€€€€€€€€€€ÑåÁ•Ím¥¨Ít€ô¹‰ì(€€€€€€€€€ô(€€€€€€€€€¥˜€¡¤Ð€ôôô¤€˜˜¨Ð€ôôô¨€˜˜¤Ì€ôôô¤Ä€˜˜¨Ì€ôôô¨Ä¤ì(€€€€€€€€€€€¥˜€¡ÑåÁ•Ím¥©t€„ôô€Ä¤ì(€€€€€€€€€€€€€±¹‰€ô5…Ñ ¹…‰Ì¡ÑåÁ•Ím¥©t¤ì(€€€€€€€€€€€ô(€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€¤È€ô¤Ìì(€€€€€€€€€€€¨È€ô¨Ìì(€€€€€€€€€€€¤Ì€ô¤Ðì(€€€€€€€€€€€¨Ì€ô¨Ðì(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸½¹Ñ½ÕÉÌì(€ô(€ÍÑ…Ñ¥Œ€‘½Õ±…ÍA•Õ­•É!•±Á•È¡Á½¥¹ÑÌ°ÍÑ…ÉÐ°•¹°½ÕÑÁÕÐ¤ì(€€€¥˜€¡•¹€´ÍÑ…ÉÐ€ðô€Ð¤ì(€€€€€™½È€¡±•Ð¤€ôÍÑ…ÉÐì¤€ð•¹€´€Èì¤€¬ô€È¤ì(€€€€€€€½ÕÑÁÕÐ¹ÁÕÍ ¡Á½¥¹ÑÍm¥t°Á½¥¹ÑÍm¤€¬€Åt¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ…à€ôÁ½¥¹ÑÍmÍÑ…ÉÑtì(€€€½¹ÍÐ…ä€ôÁ½¥¹ÑÍmÍÑ…ÉÐ€¬€Åtì(€€€½¹ÍÐ…‰à€ôÁ½¥¹ÑÍm•¹€´€Ñt€´…àì(€€€½¹ÍÐ…‰ä€ôÁ½¥¹ÑÍm•¹€´€Ít€´…äì(€€€½¹ÍÐ‘¥ÍÐ€ô5…Ñ ¹¡åÁ½Ð¡…‰à°…‰ä¤ì(€€€½¹ÍÐ¹…‰à€ô…‰à€¼‘¥ÍÐì(€€€½¹ÍÐ¹…‰ä€ô…‰ä€¼‘¥ÍÐì(€€€½¹ÍÐ…„€ô¹…‰à€¨…ä€´¹…‰ä€¨…àì(€€€½¹ÍÐ´€ô…‰ä€¼…‰àì(€€€½¹ÍÐ¥¹ÙL€ô€Ä€¼‘¥ÍÐì(€€€½¹ÍÐÁ¡¤€ô5…Ñ ¹…Ñ…¸¡´¤ì(€€€½¹ÍÐ½ÍA¡¤€ô5…Ñ ¹½Ì¡Á¡¤¤ì(€€€½¹ÍÐÍ¥¹A¡¤€ô5…Ñ ¹Í¥¸¡Á¡¤¤ì(€€€½¹ÍÐÑµ…à€ô¥¹ÙL€¨€¡5…Ñ ¹…‰Ì¡½ÍA¡¤¤€¬5…Ñ ¹…‰Ì¡Í¥¹A¡¤¤¤ì(€€€½¹ÍÐÁ½±ä€ô¥¹ÙL€¨€ Ä€´Ñµ…à€¬Ñµ…à€¨¨€È¤ì(€€€½¹ÍÐÁ…ÉÑ¥…±A¡¤€ô5…Ñ ¹µ…à¡5…Ñ ¹…Ñ…¸¡5…Ñ ¹…‰Ì¡Í¥¹A¡¤€¬½ÍA¡¤¤€¨Á½±ä¤°5…Ñ ¹…Ñ…¸¡5…Ñ ¹…‰Ì¡Í¥¹A¡¤€´½ÍA¡¤¤€¨Á½±ä¤¤ì(€€€±•Ð‘µ…à€ô€Àì(€€€±•Ð¥¹‘•à€ôÍÑ…ÉÐì(€€€™½È€¡±•Ð¤€ôÍÑ…ÉÐ€¬€Èì¤€ð•¹€´€Èì¤€¬ô€È¤ì(€€€€€½¹ÍÐ€ô5…Ñ ¹…‰Ì¡…„€´¹…‰à€¨Á½¥¹ÑÍm¤€¬€Åt€¬¹…‰ä€¨Á½¥¹ÑÍm¥t¤ì(€€€€€¥˜€¡€ø‘µ…à¤ì(€€€€€€€¥¹‘•à€ô¤ì(€€€€€€€‘µ…à€ôì(€€€€€ô(€€€ô(€€€¥˜€¡‘µ…à€ø€¡‘¥ÍÐ€¨Á…ÉÑ¥…±A¡¤¤€¨¨€È¤ì(€€€€€Ñ¡¥Ì¸‘½Õ±…ÍA•Õ­•É!•±Á•È¡Á½¥¹ÑÌ°ÍÑ…ÉÐ°¥¹‘•à€¬€È°½ÕÑÁÕÐ¤ì(€€€€€Ñ¡¥Ì¸‘½Õ±…ÍA•Õ­•É!•±Á•È¡Á½¥¹ÑÌ°¥¹‘•à°•¹°½ÕÑÁÕÐ¤ì(€€€ô•±Í”ì(€€€€€½ÕÑÁÕÐ¹ÁÕÍ ¡…à°…ä¤ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ€‘½Õ±…ÍA•Õ­•È¡Á½¥¹ÑÌ¤ì(€€€½¹ÍÐ½ÕÑÁÕÐ€ômtì(€€€½¹ÍÐ±•¸€ôÁ½¥¹ÑÌ¹±•¹Ñ ì(€€€Ñ¡¥Ì¸‘½Õ±…ÍA•Õ­•É!•±Á•È¡Á½¥¹ÑÌ°€À°±•¸°½ÕÑÁÕÐ¤ì(€€€½ÕÑÁÕÐ¹ÁÕÍ ¡Á½¥¹ÑÍm±•¸€´€Ét°Á½¥¹ÑÍm±•¸€´€Åt¤ì(€€€É•ÑÕÉ¸½ÕÑÁÕÐ¹±•¹Ñ €ðô€Ð€ü¹Õ±°€è½ÕÑÁÕÐì(€ô(€ÍÑ…Ñ¥Œ€‰¥±…Ñ•É…±¥±Ñ•È¡‰Õ˜°Ý¥‘Ñ °¡•¥¡Ð°Í¥µ…L°Í¥µ…H°­•É¹•±M¥é”¤ì(€€€½¹ÍÐ­•É¹•°€ô¹•Ü±½…ÐÌÉÉÉ…ä¡­•É¹•±M¥é”€¨¨€È¤ì(€€€½¹ÍÐÍ¥µ…LÈ€ô€´È€¨Í¥µ…L€¨¨€Èì(€€€½¹ÍÐ¡…±™M¥é”€ô­•É¹•±M¥é”€øø€Äì(€€€™½È€¡±•Ð¤€ô€Àì¤€ð­•É¹•±M¥é”ì¤¬¬¤ì(€€€€€½¹ÍÐà€ô€¡¤€´¡…±™M¥é”¤€¨¨€Èì(€€€€€™½È€¡±•Ð¨€ô€Àì¨€ð­•É¹•±M¥é”ì¨¬¬¤ì(€€€€€€€­•É¹•±m¤€¨­•É¹•±M¥é”€¬©t€ô5…Ñ ¹•áÀ ¡à€¬€¡¨€´¡…±™M¥é”¤€¨¨€È¤€¼Í¥µ…LÈ¤ì(€€€€€ô(€€€ô(€€€½¹ÍÐÉ…¹•Y…±Õ•Ì€ô¹•Ü±½…ÐÌÉÉÉ…ä ÈÔØ¤ì(€€€½¹ÍÐÍ¥µ…HÈ€ô€´È€¨Í¥µ…H€¨¨€Èì(€€€™½È€¡±•Ð¤€ô€Àì¤€ð€ÈÔØì¤¬¬¤ì(€€€€€É…¹•Y…±Õ•Ím¥t€ô5…Ñ ¹•áÀ¡¤€¨¨€È€¼Í¥µ…HÈ¤ì(€€€ô(€€€½¹ÍÐ8€ô‰Õ˜¹±•¹Ñ ì(€€€½¹ÍÐ½ÕÐ€ô¹•ÜU¥¹ÐáÉÉ…ä¡8¤ì(€€€½¹ÍÐ¡¥ÍÑ½É…´€ô¹•ÜU¥¹ÐÌÉÉÉ…ä ÈÔØ¤ì(€€€™½È€¡±•Ð¤€ô€Àì¤€ð¡•¥¡Ðì¤¬¬¤ì(€€€€€™½È€¡±•Ð¨€ô€Àì¨€ðÝ¥‘Ñ ì¨¬¬¤ì(€€€€€€€½¹ÍÐ¥¨€ô¤€¨Ý¥‘Ñ €¬¨ì(€€€€€€€½¹ÍÐ•¹Ñ•È€ô‰Õ™m¥©tì(€€€€€€€±•ÐÍÕ´€ô€Àì(€€€€€€€±•Ð¹½É´€ô€Àì(€€€€€€€™½È€¡±•Ð¬€ô€Àì¬€ð­•É¹•±M¥é”ì¬¬¬¤ì(€€€€€€€€€½¹ÍÐä€ô¤€¬¬€´¡…±™M¥é”ì(€€€€€€€€€¥˜€¡ä€ð€Àñðä€øô¡•¥¡Ð¤ì(€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€ô(€€€€€€€€€™½È€¡±•Ð°€ô€Àì°€ð­•É¹•±M¥é”ì°¬¬¤ì(€€€€€€€€€€€½¹ÍÐà€ô¨€¬°€´¡…±™M¥é”ì(€€€€€€€€€€€¥˜€¡à€ð€Àñðà€øôÝ¥‘Ñ ¤ì(€€€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€€€ô(€€€€€€€€€€€½¹ÍÐ¹•¥¡‰½ÕÈ€ô‰Õ™mä€¨Ý¥‘Ñ €¬átì(€€€€€€€€€€€½¹ÍÐÜ€ô­•É¹•±m¬€¨­•É¹•±M¥é”€¬±t€¨É…¹•Y…±Õ•Ím5…Ñ ¹…‰Ì¡¹•¥¡‰½ÕÈ€´•¹Ñ•È¥tì(€€€€€€€€€€€ÍÕ´€¬ô¹•¥¡‰½ÕÈ€¨Üì(€€€€€€€€€€€¹½É´€¬ôÜì(€€€€€€€€€ô(€€€€€€€ô(€€€€€€€½¹ÍÐÁ¥à€ô½ÕÑm¥©t€ô5…Ñ ¹É½Õ¹¡ÍÕ´€¼¹½É´¤ì(€€€€€€€¡¥ÍÑ½É…µmÁ¥át¬¬ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸m½ÕÐ°¡¥ÍÑ½É…µtì(€ô(€ÍÑ…Ñ¥Œ€•Ñ!¥ÍÑ½É…´¡‰Õ˜¤ì(€€€½¹ÍÐ¡¥ÍÑ½É…´€ô¹•ÜU¥¹ÐÌÉÉÉ…ä ÈÔØ¤ì(€€€™½È€¡½¹ÍÐœ½˜‰Õ˜¤ì(€€€€€¡¥ÍÑ½É…µmt¬¬ì(€€€ô(€€€É•ÑÕÉ¸¡¥ÍÑ½É…´ì(€ô(€ÍÑ…Ñ¥Œ€Ñ½U¥¹Ðà¡‰Õ˜¤ì(€€€½¹ÍÐ8€ô‰Õ˜¹±•¹Ñ ì(€€€½¹ÍÐ½ÕÐ€ô¹•ÜU¥¹Ðá±…µÁ•‘ÉÉ…ä¡8€øø€È¤ì(€€€±•Ðµ…à€ô€µ%¹™¥¹¥Ñäì(€€€±•Ðµ¥¸€ô%¹™¥¹¥Ñäì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ô½ÕÐ¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€½¹ÍÐÁ¥à€ô½ÕÑm¥t€ô‰Õ™m¤€ðð€Étì(€€€€€µ…à€ô5…Ñ ¹µ…à¡µ…à°Á¥à¤ì(€€€€€µ¥¸€ô5…Ñ ¹µ¥¸¡µ¥¸°Á¥à¤ì(€€€ô(€€€½¹ÍÐÉ…Ñ¥¼€ô€ÈÔÔ€¼€¡µ…à€´µ¥¸¤ì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ô½ÕÐ¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€½ÕÑm¥t€ô€¡½ÕÑm¥t€´µ¥¸¤€¨É…Ñ¥¼ì(€€€ô(€€€É•ÑÕÉ¸½ÕÐì(€ô(€ÍÑ…Ñ¥Œ€Õ•ÍÍQ¡É•Í¡½±¡¡¥ÍÑ½É…´¤ì(€€€±•Ð¤ì(€€€±•Ð4€ô€µ%¹™¥¹¥Ñäì(€€€±•Ð0€ô€µ%¹™¥¹¥Ñäì(€€€½¹ÍÐµ¥¸€ô¡¥ÍÑ½É…´¹™¥¹‘%¹‘•à¡Ø€ôøØ€„ôô€À¤ì(€€€±•ÐÁ½Ì€ôµ¥¸ì(€€€±•ÐÍÁ½Ì€ôµ¥¸ì(€€€™½È€¡¤€ôµ¥¸ì¤€ð€ÈÔØì¤¬¬¤ì(€€€€€½¹ÍÐØ€ô¡¥ÍÑ½É…µm¥tì(€€€€€¥˜€¡Ø€ø4¤ì(€€€€€€€¥˜€¡¤€´Á½Ì€ø0¤ì(€€€€€€€€€0€ô¤€´Á½Ìì(€€€€€€€€€ÍÁ½Ì€ô¤€´€Äì(€€€€€€€ô(€€€€€€€4€ôØì(€€€€€€€Á½Ì€ô¤ì(€€€€€ô(€€€ô(€€€™½È€¡¤€ôÍÁ½Ì€´€Äì¤€øô€Àì¤´´¤ì(€€€€€¥˜€¡¡¥ÍÑ½É…µm¥t€ø¡¥ÍÑ½É…µm¤€¬€Åt¤ì(€€€€€€€‰É•…¬ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸¤ì(€ô(€ÍÑ…Ñ¥Œ€•ÑÉ…åA¥á•±Ì¡‰¥Ñµ…À¤ì(€€€½¹ÍÐ½É¥¥¹…±	¥Ñµ…À€ô‰¥Ñµ…Àì(€€€½¹ÍÐì(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ô‰¥Ñµ…Àì(€€€½¹ÍÐì(€€€€€µ…á¥´(€€€ô€ôÑ¡¥Ì¸AI5QILì(€€€±•Ð¹•Ý]¥‘Ñ €ôÝ¥‘Ñ ì(€€€±•Ð¹•Ý!•¥¡Ð€ô¡•¥¡Ðì(€€€¥˜€¡Ý¥‘Ñ €øµ…á¥´ñð¡•¥¡Ð€øµ…á¥´¤ì(€€€€€±•ÐÁÉ•Ù]¥‘Ñ €ôÝ¥‘Ñ ì(€€€€€±•ÐÁÉ•Ù!•¥¡Ð€ô¡•¥¡Ðì(€€€€€±•ÐÍÑ•ÁÌ€ô5…Ñ ¹±½œÈ¡5…Ñ ¹µ…à¡Ý¥‘Ñ °¡•¥¡Ð¤€¼µ…á¥´¤ì(€€€€€½¹ÍÐ¥ÍÑ•ÁÌ€ô5…Ñ ¹™±½½È¡ÍÑ•ÁÌ¤ì(€€€€€ÍÑ•ÁÌ€ôÍÑ•ÁÌ€ôôô¥ÍÑ•ÁÌ€ü¥ÍÑ•ÁÌ€´€Ä€è¥ÍÑ•ÁÌì(€€€€€™½È€¡±•Ð¤€ô€Àì¤€ðÍÑ•ÁÌì¤¬¬¤ì(€€€€€€€¹•Ý]¥‘Ñ €ô5…Ñ ¹•¥°¡ÁÉ•Ù]¥‘Ñ €¼€È¤ì(€€€€€€€¹•Ý!•¥¡Ð€ô5…Ñ ¹•¥°¡ÁÉ•Ù!•¥¡Ð€¼€È¤ì(€€€€€€€½¹ÍÐ½™™ÍÉ••¸€ô¹•Ü=™™ÍÉ••¹…¹Ù…Ì¡¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ð¤ì(€€€€€€€½¹ÍÐÑà€ô½™™ÍÉ••¸¹•Ñ½¹Ñ•áÐ ˆÉˆ¤ì(€€€€€€€Ñà¹‘É…Ý%µ…”¡‰¥Ñµ…À°€À°€À°ÁÉ•Ù]¥‘Ñ °ÁÉ•Ù!•¥¡Ð°€À°€À°¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ð¤ì(€€€€€€€ÁÉ•Ù]¥‘Ñ €ô¹•Ý]¥‘Ñ ì(€€€€€€€ÁÉ•Ù!•¥¡Ð€ô¹•Ý!•¥¡Ðì(€€€€€€€¥˜€¡‰¥Ñµ…À€„ôô½É¥¥¹…±	¥Ñµ…À¤ì(€€€€€€€€€‰¥Ñµ…À¹±½Í” ¤ì(€€€€€€€ô(€€€€€€€‰¥Ñµ…À€ô½™™ÍÉ••¸¹ÑÉ…¹Í™•ÉQ½%µ…•	¥Ñµ…À ¤ì(€€€€€ô(€€€€€½¹ÍÐÉ…Ñ¥¼€ô5…Ñ ¹µ¥¸¡µ…á¥´€¼¹•Ý]¥‘Ñ °µ…á¥´€¼¹•Ý!•¥¡Ð¤ì(€€€€€¹•Ý]¥‘Ñ €ô5…Ñ ¹É½Õ¹¡¹•Ý]¥‘Ñ €¨É…Ñ¥¼¤ì(€€€€€¹•Ý!•¥¡Ð€ô5…Ñ ¹É½Õ¹¡¹•Ý!•¥¡Ð€¨É…Ñ¥¼¤ì(€€€ô(€€€½¹ÍÐ½™™ÍÉ••¸€ô¹•Ü=™™ÍÉ••¹…¹Ù…Ì¡¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ð¤ì(€€€½¹ÍÐÑà€ô½™™ÍÉ••¸¹•Ñ½¹Ñ•áÐ ˆÉˆ°ì(€€€€€Ý¥±±I•…‘É•ÅÕ•¹Ñ±äèÑÉÕ”(€€€ô¤ì(€€€Ñà¹™¥±±MÑå±”€ô€‰Ý¡¥Ñ”ˆì(€€€Ñà¹™¥±±I•Ð À°€À°¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ð¤ì(€€€Ñà¹™¥±Ñ•È€ô€‰É…åÍ…±” Ä¤ˆì(€€€Ñà¹‘É…Ý%µ…”¡‰¥Ñµ…À°€À°€À°‰¥Ñµ…À¹Ý¥‘Ñ °‰¥Ñµ…À¹¡•¥¡Ð°€À°€À°¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ð¤ì(€€€½¹ÍÐÉ…å%µ…”€ôÑà¹•Ñ%µ…•…Ñ„ À°€À°¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ð¤¹‘…Ñ„ì(€€€½¹ÍÐÕ¥¹Ðá	Õ˜€ôÑ¡¥Ì¸Ñ½U¥¹Ðà¡É…å%µ…”¤ì(€€€É•ÑÕÉ¸mÕ¥¹Ðá	Õ˜°¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ñtì(€ô(€ÍÑ…Ñ¥Œ•áÑÉ…Ñ½¹Ñ½ÕÉÍÉ½µQ•áÐ¡Ñ•áÐ°ì(€€€™½¹Ñ…µ¥±ä°(€€€™½¹ÑMÑå±”°(€€€™½¹Ñ]•¥¡Ð(€ô°Á…•]¥‘Ñ °Á…•!•¥¡Ð°É½Ñ…Ñ¥½¸°¥¹¹•É5…É¥¸¤ì(€€€±•Ð…¹Ù…Ì€ô¹•Ü=™™ÍÉ••¹…¹Ù…Ì Ä°€Ä¤ì(€€€±•ÐÑà€ô…¹Ù…Ì¹•Ñ½¹Ñ•áÐ ˆÉˆ°ì(€€€€€…±Á¡„è™…±Í”(€€€ô¤ì(€€€½¹ÍÐ™½¹ÑM¥é”€ô€ÈÀÀì(€€€½¹ÍÐ™½¹Ð€ôÑà¹™½¹Ð€ô€‘í™½¹ÑMÑå±•ô€‘í™½¹Ñ]•¥¡Ñô€‘í™½¹ÑM¥é•õÁà€‘í™½¹Ñ…µ¥±åõ€ì(€€€½¹ÍÐì(€€€€€…ÑÕ…±	½Õ¹‘¥¹	½á1•™Ð°(€€€€€…ÑÕ…±	½Õ¹‘¥¹	½áI¥¡Ð°(€€€€€…ÑÕ…±	½Õ¹‘¥¹	½áÍ•¹Ð°(€€€€€…ÑÕ…±	½Õ¹‘¥¹	½á•Í•¹Ð°(€€€€€™½¹Ñ	½Õ¹‘¥¹	½áÍ•¹Ð°(€€€€€™½¹Ñ	½Õ¹‘¥¹	½á•Í•¹Ð°(€€€€€Ý¥‘Ñ (€€€ô€ôÑà¹µ•…ÍÕÉ•Q•áÐ¡Ñ•áÐ¤ì(€€€½¹ÍÐM1€ô€Ä¸Ôì(€€€½¹ÍÐ…¹Ù…Í]¥‘Ñ €ô5…Ñ ¹•¥°¡5…Ñ ¹µ…à¡5…Ñ ¹…‰Ì¡…ÑÕ…±	½Õ¹‘¥¹	½á1•™Ð¤€¬5…Ñ ¹…‰Ì¡…ÑÕ…±	½Õ¹‘¥¹	½áI¥¡Ð¤ñð€À°Ý¥‘Ñ ¤€¨M1¤ì(€€€½¹ÍÐ…¹Ù…Í!•¥¡Ð€ô5…Ñ ¹•¥°¡5…Ñ ¹µ…à¡5…Ñ ¹…‰Ì¡…ÑÕ…±	½Õ¹‘¥¹	½áÍ•¹Ð¤€¬5…Ñ ¹…‰Ì¡…ÑÕ…±	½Õ¹‘¥¹	½á•Í•¹Ð¤ñð™½¹ÑM¥é”°5…Ñ ¹…‰Ì¡™½¹Ñ	½Õ¹‘¥¹	½áÍ•¹Ð¤€¬5…Ñ ¹…‰Ì¡™½¹Ñ	½Õ¹‘¥¹	½á•Í•¹Ð¤ñð™½¹ÑM¥é”¤€¨M1¤ì(€€€…¹Ù…Ì€ô¹•Ü=™™ÍÉ••¹…¹Ù…Ì¡…¹Ù…Í]¥‘Ñ °…¹Ù…Í!•¥¡Ð¤ì(€€€Ñà€ô…¹Ù…Ì¹•Ñ½¹Ñ•áÐ ˆÉˆ°ì(€€€€€…±Á¡„èÑÉÕ”°(€€€€€Ý¥±±I•…‘É•ÅÕ•¹Ñ±äèÑÉÕ”(€€€ô¤ì(€€€Ñà¹™½¹Ð€ô™½¹Ðì(€€€Ñà¹™¥±Ñ•È€ô€‰É…åÍ…±” Ä¤ˆì(€€€Ñà¹™¥±±MÑå±”€ô€‰Ý¡¥Ñ”ˆì(€€€Ñà¹™¥±±I•Ð À°€À°…¹Ù…Í]¥‘Ñ °…¹Ù…Í!•¥¡Ð¤ì(€€€Ñà¹™¥±±MÑå±”€ô€‰‰±…¬ˆì(€€€Ñà¹™¥±±Q•áÐ¡Ñ•áÐ°…¹Ù…Í]¥‘Ñ €¨€¡M1€´€Ä¤€¼€È°…¹Ù…Í!•¥¡Ð€¨€ Ì€´M1¤€¼€È¤ì(€€€½¹ÍÐÕ¥¹Ðá	Õ˜€ôÑ¡¥Ì¸Ñ½U¥¹Ðà¡Ñà¹•Ñ%µ…•…Ñ„ À°€À°…¹Ù…Í]¥‘Ñ °…¹Ù…Í!•¥¡Ð¤¹‘…Ñ„¤ì(€€€½¹ÍÐ¡¥ÍÑ½É…´€ôÑ¡¥Ì¸•Ñ!¥ÍÑ½É…´¡Õ¥¹Ðá	Õ˜¤ì(€€€½¹ÍÐÑ¡É•Í¡½±€ôÑ¡¥Ì¸Õ•ÍÍQ¡É•Í¡½±¡¡¥ÍÑ½É…´¤ì(€€€½¹ÍÐ½¹Ñ½ÕÉ1¥ÍÐ€ôÑ¡¥Ì¸™¥¹‘½¹Ñ½ÕÉÌ¡Õ¥¹Ðá	Õ˜°…¹Ù…Í]¥‘Ñ °…¹Ù…Í!•¥¡Ð°Ñ¡É•Í¡½±¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹ÁÉ½•ÍÍÉ…Ý¹1¥¹•Ì¡ì(€€€€€±¥¹•Ìèì(€€€€€€€ÕÉÙ•Ìè½¹Ñ½ÕÉ1¥ÍÐ°(€€€€€€€Ý¥‘Ñ è…¹Ù…Í]¥‘Ñ °(€€€€€€€¡•¥¡Ðè…¹Ù…Í!•¥¡Ð(€€€€€ô°(€€€€€Á…•]¥‘Ñ °(€€€€€Á…•!•¥¡Ð°(€€€€€É½Ñ…Ñ¥½¸°(€€€€€¥¹¹•É5…É¥¸°(€€€€€µÕÍÑMµ½½Ñ èÑÉÕ”°(€€€€€…É•½¹Ñ½ÕÉÌèÑÉÕ”(€€€ô¤ì(€ô(€ÍÑ…Ñ¥ŒÁÉ½•ÍÌ¡‰¥Ñµ…À°Á…•]¥‘Ñ °Á…•!•¥¡Ð°É½Ñ…Ñ¥½¸°¥¹¹•É5…É¥¸¤ì(€€€½¹ÍÐmÕ¥¹Ðá	Õ˜°Ý¥‘Ñ °¡•¥¡Ñt€ôÑ¡¥Ì¸•ÑÉ…åA¥á•±Ì¡‰¥Ñµ…À¤ì(€€€½¹ÍÐm‰Õ™™•È°¡¥ÍÑ½É…µt€ôÑ¡¥Ì¸‰¥±…Ñ•É…±¥±Ñ•È¡Õ¥¹Ðá	Õ˜°Ý¥‘Ñ °¡•¥¡Ð°5…Ñ ¹¡åÁ½Ð¡Ý¥‘Ñ °¡•¥¡Ð¤€¨Ñ¡¥Ì¸AI5QIL¹Í¥µ…M…Ñ½È°Ñ¡¥Ì¸AI5QIL¹Í¥µ…H°Ñ¡¥Ì¸AI5QIL¹­•É¹•±M¥é”¤ì(€€€½¹ÍÐÑ¡É•Í¡½±€ôÑ¡¥Ì¸Õ•ÍÍQ¡É•Í¡½±¡¡¥ÍÑ½É…´¤ì(€€€½¹ÍÐ½¹Ñ½ÕÉ1¥ÍÐ€ôÑ¡¥Ì¸™¥¹‘½¹Ñ½ÕÉÌ¡‰Õ™™•È°Ý¥‘Ñ °¡•¥¡Ð°Ñ¡É•Í¡½±¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹ÁÉ½•ÍÍÉ…Ý¹1¥¹•Ì¡ì(€€€€€±¥¹•Ìèì(€€€€€€€ÕÉÙ•Ìè½¹Ñ½ÕÉ1¥ÍÐ°(€€€€€€€Ý¥‘Ñ °(€€€€€€€¡•¥¡Ð(€€€€€ô°(€€€€€Á…•]¥‘Ñ °(€€€€€Á…•!•¥¡Ð°(€€€€€É½Ñ…Ñ¥½¸°(€€€€€¥¹¹•É5…É¥¸°(€€€€€µÕÍÑMµ½½Ñ èÑÉÕ”°(€€€€€…É•½¹Ñ½ÕÉÌèÑÉÕ”(€€€ô¤ì(€ô(€ÍÑ…Ñ¥ŒÁÉ½•ÍÍÉ…Ý¹1¥¹•Ì¡ì(€€€±¥¹•Ì°(€€€Á…•]¥‘Ñ °(€€€Á…•!•¥¡Ð°(€€€É½Ñ…Ñ¥½¸°(€€€¥¹¹•É5…É¥¸°(€€€µÕÍÑMµ½½Ñ °(€€€…É•½¹Ñ½ÕÉÌ(€ô¤ì(€€€¥˜€¡É½Ñ…Ñ¥½¸€”€ÄàÀ€„ôô€À¤ì(€€€€€mÁ…•]¥‘Ñ °Á…•!•¥¡Ñt€ômÁ…•!•¥¡Ð°Á…•]¥‘Ñ¡tì(€€€ô(€€€½¹ÍÐì(€€€€€ÕÉÙ•Ì°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ô±¥¹•Ìì(€€€½¹ÍÐÑ¡¥­¹•ÍÌ€ô±¥¹•Ì¹Ñ¡¥­¹•ÍÌ€üü€Àì(€€€½¹ÍÐ±¥¹•Í¹‘A½¥¹ÑÌ€ômtì(€€€½¹ÍÐÉ…Ñ¥¼€ô5…Ñ ¹µ¥¸¡Á…•]¥‘Ñ €¼Ý¥‘Ñ °Á…•!•¥¡Ð€¼¡•¥¡Ð¤ì(€€€½¹ÍÐáM…±”€ôÉ…Ñ¥¼€¼Á…•]¥‘Ñ ì(€€€½¹ÍÐåM…±”€ôÉ…Ñ¥¼€¼Á…•!•¥¡Ðì(€€€½¹ÍÐ¹•ÝÕÉÙ•Ì€ômtì(€€€™½È€¡½¹ÍÐì(€€€€€Á½¥¹ÑÌ(€€€ô½˜ÕÉÙ•Ì¤ì(€€€€€½¹ÍÐÉ•‘Õ•‘A½¥¹ÑÌ€ôµÕÍÑMµ½½Ñ €üÑ¡¥Ì¸‘½Õ±…ÍA•Õ­•È¡Á½¥¹ÑÌ¤€èÁ½¥¹ÑÌì(€€€€€¥˜€ …É•‘Õ•‘A½¥¹ÑÌ¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€¹•ÝÕÉÙ•Ì¹ÁÕÍ ¡É•‘Õ•‘A½¥¹ÑÌ¤ì(€€€€€½¹ÍÐ±•¸€ôÉ•‘Õ•‘A½¥¹ÑÌ¹±•¹Ñ ì(€€€€€½¹ÍÐ¹•ÝA½¥¹ÑÌ€ô¹•Ü±½…ÐÌÉÉÉ…ä¡±•¸¤ì(€€€€€½¹ÍÐ±¥¹”€ô¹•Ü±½…ÐÌÉÉÉ…ä Ì€¨€¡±•¸€ôôô€È€ü€È€è±•¸€´€È¤¤ì(€€€€€±¥¹•Í¹‘A½¥¹ÑÌ¹ÁÕÍ ¡ì(€€€€€€€±¥¹”°(€€€€€€€Á½¥¹ÑÌè¹•ÝA½¥¹ÑÌ(€€€€€ô¤ì(€€€€€¥˜€¡±•¸€ôôô€È¤ì(€€€€€€€¹•ÝA½¥¹ÑÍlÁt€ôÉ•‘Õ•‘A½¥¹ÑÍlÁt€¨áM…±”ì(€€€€€€€¹•ÝA½¥¹ÑÍlÅt€ôÉ•‘Õ•‘A½¥¹ÑÍlÅt€¨åM…±”ì(€€€€€€€±¥¹”¹Í•Ð¡m9…8°9…8°9…8°9…8°¹•ÝA½¥¹ÑÍlÁt°¹•ÝA½¥¹ÑÍlÅut°€À¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€±•ÐmàÄ°äÄ°àÈ°äÉt€ôÉ•‘Õ•‘A½¥¹ÑÌì(€€€€€àÄ€¨ôáM…±”ì(€€€€€äÄ€¨ôåM…±”ì(€€€€€àÈ€¨ôáM…±”ì(€€€€€äÈ€¨ôåM…±”ì(€€€€€¹•ÝA½¥¹ÑÌ¹Í•Ð¡màÄ°äÄ°àÈ°äÉt°€À¤ì(€€€€€±¥¹”¹Í•Ð¡m9…8°9…8°9…8°9…8°àÄ°äÅt°€À¤ì(€€€€€™½È€¡±•Ð¤€ô€Ðì¤€ð±•¸ì¤€¬ô€È¤ì(€€€€€€€½¹ÍÐà€ô¹•ÝA½¥¹ÑÍm¥t€ôÉ•‘Õ•‘A½¥¹ÑÍm¥t€¨áM…±”ì(€€€€€€€½¹ÍÐä€ô¹•ÝA½¥¹ÑÍm¤€¬€Åt€ôÉ•‘Õ•‘A½¥¹ÑÍm¤€¬€Åt€¨åM…±”ì(€€€€€€€±¥¹”¹Í•Ð¡=ÕÑ±¥¹”¹É•…Ñ•	•é¥•ÉA½¥¹ÑÌ¡àÄ°äÄ°àÈ°äÈ°à°ä¤°€¡¤€´€È¤€¨€Ì¤ì(€€€€€€€màÄ°äÄ°àÈ°äÉt€ômàÈ°äÈ°à°åtì(€€€€€ô(€€€ô(€€€¥˜€¡±¥¹•Í¹‘A½¥¹ÑÌ¹±•¹Ñ €ôôô€À¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€½¹ÍÐ½ÕÑ±¥¹”€ô…É•½¹Ñ½ÕÉÌ€ü¹•Ü½¹Ñ½ÕÉÉ…Ý=ÕÑ±¥¹” ¤€è¹•Ü%¹­É…Ý=ÕÑ±¥¹” ¤ì(€€€½ÕÑ±¥¹”¹‰Õ¥±¡±¥¹•Í¹‘A½¥¹ÑÌ°Á…•]¥‘Ñ °Á…•!•¥¡Ð°€Ä°É½Ñ…Ñ¥½¸°…É•½¹Ñ½ÕÉÌ€ü€À€èÑ¡¥­¹•ÍÌ°¥¹¹•É5…É¥¸¤ì(€€€É•ÑÕÉ¸ì(€€€€€½ÕÑ±¥¹”°(€€€€€¹•ÝÕÉÙ•Ì°(€€€€€…É•½¹Ñ½ÕÉÌ°(€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ôì(€ô(€ÍÑ…Ñ¥Œ…Íå¹Œ½µÁÉ•ÍÍM¥¹…ÑÕÉ”¡ì(€€€½ÕÑ±¥¹•Ì°(€€€…É•½¹Ñ½ÕÉÌ°(€€€Ñ¡¥­¹•ÍÌ°(€€€Ý¥‘Ñ °(€€€¡•¥¡Ð(€ô¤ì(€€€±•Ðµ¥¹¥™˜€ô%¹™¥¹¥Ñäì(€€€±•Ðµ…á¥™˜€ô€µ%¹™¥¹¥Ñäì(€€€±•Ð½ÕÑ±¥¹•Í1•¹Ñ €ô€Àì(€€€™½È€¡½¹ÍÐÁ½¥¹ÑÌ½˜½ÕÑ±¥¹•Ì¤ì(€€€€€½ÕÑ±¥¹•Í1•¹Ñ €¬ôÁ½¥¹ÑÌ¹±•¹Ñ ì(€€€€€™½È€¡±•Ð¤€ô€È°¥¤€ôÁ½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€€€½¹ÍÐ‘à€ôÁ½¥¹ÑÍm¥t€´Á½¥¹ÑÍm¤€´€Étì(€€€€€€€µ¥¹¥™˜€ô5…Ñ ¹µ¥¸¡µ¥¹¥™˜°‘à¤ì(€€€€€€€µ…á¥™˜€ô5…Ñ ¹µ…à¡µ…á¥™˜°‘à¤ì(€€€€€ô(€€€ô(€€€±•Ð‰Õ™™•ÉQåÁ”ì(€€€¥˜€¡µ¥¹¥™˜€øô€´ÄÈà€˜˜µ…á¥™˜€ðô€ÄÈÜ¤ì(€€€€€‰Õ™™•ÉQåÁ”€ô%¹ÐáÉÉ…äì(€€€ô•±Í”¥˜€¡µ¥¹¥™˜€øô€´ÌÈÜØà€˜˜µ…á¥™˜€ðô€ÌÈÜØÜ¤ì(€€€€€‰Õ™™•ÉQåÁ”€ô%¹ÐÄÙÉÉ…äì(€€€ô•±Í”ì(€€€€€‰Õ™™•ÉQåÁ”€ô%¹ÐÌÉÉÉ…äì(€€€ô(€€€½¹ÍÐ±•¸€ô½ÕÑ±¥¹•Ì¹±•¹Ñ ì(€€€½¹ÍÐ¡•…‘•É1•¹Ñ €ô	M}!I}19Q €¬A=%9QM}AI=AIQ%M}9U5	H€¨±•¸ì(€€€½¹ÍÐ¡•…‘•È€ô¹•ÜU¥¹ÐÌÉÉÉ…ä¡¡•…‘•É1•¹Ñ ¤ì(€€€±•Ð½™™Í•Ð€ô€Àì(€€€¡•…‘•Ém½™™Í•Ð¬­t€ô¡•…‘•É1•¹Ñ €¨U¥¹ÐÌÉÉÉ…ä¹	eQM}AI}159P€¬€¡½ÕÑ±¥¹•Í1•¹Ñ €´€È€¨±•¸¤€¨‰Õ™™•ÉQåÁ”¹	eQM}AI}159Pì(€€€¡•…‘•Ém½™™Í•Ð¬­t€ô€Àì(€€€¡•…‘•Ém½™™Í•Ð¬­t€ôÝ¥‘Ñ ì(€€€¡•…‘•Ém½™™Í•Ð¬­t€ô¡•¥¡Ðì(€€€¡•…‘•Ém½™™Í•Ð¬­t€ô…É•½¹Ñ½ÕÉÌ€ü€À€è€Äì(€€€¡•…‘•Ém½™™Í•Ð¬­t€ô5…Ñ ¹µ…à À°5…Ñ ¹™±½½È¡Ñ¡¥­¹•ÍÌ€üü€À¤¤ì(€€€¡•…‘•Ém½™™Í•Ð¬­t€ô±•¸ì(€€€¡•…‘•Ém½™™Í•Ð¬­t€ô‰Õ™™•ÉQåÁ”¹	eQM}AI}159Pì(€€€™½È€¡½¹ÍÐÁ½¥¹ÑÌ½˜½ÕÑ±¥¹•Ì¤ì(€€€€€¡•…‘•Ém½™™Í•Ð¬­t€ôÁ½¥¹ÑÌ¹±•¹Ñ €´€Èì(€€€€€¡•…‘•Ém½™™Í•Ð¬­t€ôÁ½¥¹ÑÍlÁtì(€€€€€¡•…‘•Ém½™™Í•Ð¬­t€ôÁ½¥¹ÑÍlÅtì(€€€ô(€€€½¹ÍÐÌ€ô¹•Ü½µÁÉ•ÍÍ¥½¹MÑÉ•…´ ‰‘•™±…Ñ”µÉ…Üˆ¤ì(€€€½¹ÍÐÝÉ¥Ñ•È€ôÌ¹ÝÉ¥Ñ…‰±”¹•Ñ]É¥Ñ•È ¤ì(€€€…Ý…¥ÐÝÉ¥Ñ•È¹É•…‘äì(€€€ÝÉ¥Ñ•È¹ÝÉ¥Ñ”¡¡•…‘•È¤ì(€€€½¹ÍÐ	Õ™™•ÉÑ½È€ô‰Õ™™•ÉQåÁ”¹ÁÉ½Ñ½ÑåÁ”¹½¹ÍÑÉÕÑ½Èì(€€€™½È€¡½¹ÍÐÁ½¥¹ÑÌ½˜½ÕÑ±¥¹•Ì¤ì(€€€€€½¹ÍÐ‘¥™™Ì€ô¹•Ü	Õ™™•ÉÑ½È¡Á½¥¹ÑÌ¹±•¹Ñ €´€È¤ì(€€€€€™½È€¡±•Ð¤€ô€È°¥¤€ôÁ½¥¹ÑÌ¹±•¹Ñ ì¤€ð¥¤ì¤¬¬¤ì(€€€€€€€‘¥™™Ím¤€´€Ét€ôÁ½¥¹ÑÍm¥t€´Á½¥¹ÑÍm¤€´€Étì(€€€€€ô(€€€€€ÝÉ¥Ñ•È¹ÝÉ¥Ñ”¡‘¥™™Ì¤ì(€€€ô(€€€ÝÉ¥Ñ•È¹±½Í” ¤ì(€€€½¹ÍÐ‰åÑ•Ì€ô…Ý…¥Ð¹•ÜI•ÍÁ½¹Í”¡Ì¹É•…‘…‰±”¤¹‰åÑ•Ì ¤ì(€€€É•ÑÕÉ¸‰åÑ•Ì¹Ñ½	…Í”ØÐ ¤ì(€ô(€ÍÑ…Ñ¥Œ…Íå¹Œ‘•½µÁÉ•ÍÍM¥¹…ÑÕÉ”¡Í¥¹…ÑÕÉ•…Ñ„¤ì(€€€ÑÉäì(€€€€€½¹ÍÐ‰åÑ•Ì€ôU¥¹ÐáÉÉ…ä¹™É½µ	…Í”ØÐ¡Í¥¹…ÑÕÉ•…Ñ„¤ì(€€€€€½¹ÍÐì(€€€€€€€É•…‘…‰±”°(€€€€€€€ÝÉ¥Ñ…‰±”(€€€€€ô€ô¹•Ü•½µÁÉ•ÍÍ¥½¹MÑÉ•…´ ‰‘•™±…Ñ”µÉ…Üˆ¤ì(€€€€€½¹ÍÐÝÉ¥Ñ•È€ôÝÉ¥Ñ…‰±”¹•Ñ]É¥Ñ•È ¤ì(€€€€€…Ý…¥ÐÝÉ¥Ñ•È¹É•…‘äì(€€€€€ÝÉ¥Ñ•È¹ÝÉ¥Ñ”¡‰åÑ•Ì¤¹Ñ¡•¸¡…Íå¹Œ€ ¤€ôøì(€€€€€€€…Ý…¥ÐÝÉ¥Ñ•È¹É•…‘äì(€€€€€€€…Ý…¥ÐÝÉ¥Ñ•È¹±½Í” ¤ì(€€€€€ô¤¹…Ñ   ¤€ôøíô¤ì(€€€€€±•Ð‘…Ñ„€ô¹Õ±°ì(€€€€€±•Ð½™™Í•Ð€ô€Àì(€€€€€™½È…Ý…¥Ð€¡½¹ÍÐ¡Õ¹¬½˜É•…‘…‰±”¤ì(€€€€€€€‘…Ñ„ñðô¹•ÜU¥¹ÐáÉÉ…ä¡¹•ÜU¥¹ÐÌÉÉÉ…ä¡¡Õ¹¬¹‰Õ™™•È°€À°€Ð¥lÁt¤ì(€€€€€€€‘…Ñ„¹Í•Ð¡¡Õ¹¬°½™™Í•Ð¤ì(€€€€€€€½™™Í•Ð€¬ô¡Õ¹¬¹±•¹Ñ ì(€€€€€ô(€€€€€½¹ÍÐ¡•…‘•È€ô¹•ÜU¥¹ÐÌÉÉÉ…ä¡‘…Ñ„¹‰Õ™™•È°€À°‘…Ñ„¹±•¹Ñ €øø€È¤ì(€€€€€½¹ÍÐÙ•ÉÍ¥½¸€ô¡•…‘•ÉlÅtì(€€€€€¥˜€¡Ù•ÉÍ¥½¸€„ôô€À¤ì(€€€€€€€Ñ¡É½Ü¹•ÜÉÉ½È¡%¹Ù…±¥Ù•ÉÍ¥½¸è€‘íÙ•ÉÍ¥½¹õ€¤ì(€€€€€ô(€€€€€½¹ÍÐÝ¥‘Ñ €ô¡•…‘•ÉlÉtì(€€€€€½¹ÍÐ¡•¥¡Ð€ô¡•…‘•ÉlÍtì(€€€€€½¹ÍÐ…É•½¹Ñ½ÕÉÌ€ô¡•…‘•ÉlÑt€ôôô€Àì(€€€€€½¹ÍÐÑ¡¥­¹•ÍÌ€ô¡•…‘•ÉlÕtì(€€€€€½¹ÍÐ¹Õµ‰•É=™É…Ý¥¹Ì€ô¡•…‘•ÉlÙtì(€€€€€½¹ÍÐ‰Õ™™•ÉQåÁ”€ô¡•…‘•ÉlÝtì(€€€€€½¹ÍÐ½ÕÑ±¥¹•Ì€ômtì(€€€€€½¹ÍÐ‘¥™™Í=™™Í•Ð€ô€¡	M}!I}19Q €¬A=%9QM}AI=AIQ%M}9U5	H€¨¹Õµ‰•É=™É…Ý¥¹Ì¤€¨U¥¹ÐÌÉÉÉ…ä¹	eQM}AI}159Pì(€€€€€±•Ð‘¥™™Ìì(€€€€€ÍÝ¥Ñ €¡‰Õ™™•ÉQåÁ”¤ì(€€€€€€€…Í”%¹ÐáÉÉ…ä¹	eQM}AI}159Pè(€€€€€€€€€‘¥™™Ì€ô¹•Ü%¹ÐáÉÉ…ä¡‘…Ñ„¹‰Õ™™•È°‘¥™™Í=™™Í•Ð¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”%¹ÐÄÙÉÉ…ä¹	eQM}AI}159Pè(€€€€€€€€€‘¥™™Ì€ô¹•Ü%¹ÐÄÙÉÉ…ä¡‘…Ñ„¹‰Õ™™•È°‘¥™™Í=™™Í•Ð¤ì(€€€€€€€€€‰É•…¬ì(€€€€€€€…Í”%¹ÐÌÉÉÉ…ä¹	eQM}AI}159Pè(€€€€€€€€€‘¥™™Ì€ô¹•Ü%¹ÐÌÉÉÉ…ä¡‘…Ñ„¹‰Õ™™•È°‘¥™™Í=™™Í•Ð¤ì(€€€€€€€€€‰É•…¬ì(€€€€€ô(€€€€€½™™Í•Ð€ô€Àì(€€€€€™½È€¡±•Ð¤€ô€Àì¤€ð¹Õµ‰•É=™É…Ý¥¹Ìì¤¬¬¤ì(€€€€€€€½¹ÍÐ±•¸€ô¡•…‘•ÉmA=%9QM}AI=AIQ%M}9U5	H€¨¤€¬	M}!I}19Q!tì(€€€€€€€½¹ÍÐÁ½¥¹ÑÌ€ô¹•Ü±½…ÐÌÉÉÉ…ä¡±•¸€¬€È¤ì(€€€€€€€½ÕÑ±¥¹•Ì¹ÁÕÍ ¡Á½¥¹ÑÌ¤ì(€€€€€€€™½È€¡±•Ð¨€ô€Àì¨€ðA=%9QM}AI=AIQ%M}9U5	H€´€Äì¨¬¬¤ì(€€€€€€€€€Á½¥¹ÑÍm©t€ô¡•…‘•ÉmA=%9QM}AI=AIQ%M}9U5	H€¨¤€¬	M}!I}19Q €¬¨€¬€Åtì(€€€€€€€ô(€€€€€€€™½È€¡±•Ð¨€ô€Àì¨€ð±•¸ì¨¬¬¤ì(€€€€€€€€€Á½¥¹ÑÍm¨€¬€Ét€ôÁ½¥¹ÑÍm©t€¬‘¥™™Ím½™™Í•Ð¬­tì(€€€€€€€ô(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€€€€€…É•½¹Ñ½ÕÉÌ°(€€€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€€€½ÕÑ±¥¹•Ì°(€€€€€€€Ý¥‘Ñ °(€€€€€€€¡•¥¡Ð(€€€€€ôì(€€€ô…Ñ €¡”¤ì(€€€€€Ý…É¸¡‘•½µÁÉ•ÍÍM¥¹…ÑÕÉ”è€‘í•õ€¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½Í¥¹…ÑÕÉ”¹©Ì((((((()±…ÍÌM¥¹…ÑÕÉ•=ÁÑ¥½¹Ì•áÑ•¹‘ÌÉ…Ý¥¹=ÁÑ¥½¹Ìì(€½¹ÍÑÉÕÑ½È ¤ì(€€€ÍÕÁ•È ¤ì(€€€ÍÕÁ•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡ì(€€€€€™¥±°è¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}‘•™…Õ±Ñ1¥¹•½±½È°(€€€€€€‰ÍÑÉ½­”µÝ¥‘Ñ ˆè€À(€€€ô¤ì(€ô(€±½¹” ¤ì(€€€½¹ÍÐ±½¹”€ô¹•ÜM¥¹…ÑÕÉ•=ÁÑ¥½¹Ì ¤ì(€€€±½¹”¹ÕÁ‘…Ñ•±°¡Ñ¡¥Ì¤ì(€€€É•ÑÕÉ¸±½¹”ì(€ô)ô)±…ÍÌÉ…Ý¹M¥¹…ÑÕÉ•=ÁÑ¥½¹Ì•áÑ•¹‘Ì%¹­É…Ý¥¹=ÁÑ¥½¹Ìì(€½¹ÍÑÉÕÑ½È¡Ù¥•Ý•ÉA…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¡Ù¥•Ý•ÉA…É…µ•Ñ•ÉÌ¤ì(€€€ÍÕÁ•È¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡ì(€€€€€ÍÑÉ½­”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}‘•™…Õ±Ñ1¥¹•½±½È°(€€€€€€‰ÍÑÉ½­”µÝ¥‘Ñ ˆè€Ä(€€€ô¤ì(€ô(€±½¹” ¤ì(€€€½¹ÍÐ±½¹”€ô¹•ÜÉ…Ý¹M¥¹…ÑÕÉ•=ÁÑ¥½¹Ì¡Ñ¡¥Ì¹}Ù¥•ÝA…É…µ•Ñ•ÉÌ¤ì(€€€±½¹”¹ÕÁ‘…Ñ•±°¡Ñ¡¥Ì¤ì(€€€É•ÑÕÉ¸±½¹”ì(€ô)ô)±…ÍÌM¥¹…ÑÕÉ•‘¥Ñ½È•áÑ•¹‘ÌÉ…Ý¥¹‘¥Ñ½Èì(€€¥ÍáÑÉ…Ñ•€ô™…±Í”ì(€€‘•ÍÉ¥ÁÑ¥½¸€ô¹Õ±°ì(€€Í¥¹…ÑÕÉ•…Ñ„€ô¹Õ±°ì(€€Í¥¹…ÑÕÉ•UU%€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ}ÑåÁ”€ô€‰Í¥¹…ÑÕÉ”ˆì(€ÍÑ…Ñ¥Œ}•‘¥Ñ½ÉQåÁ”€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹M%9QUIì(€ÍÑ…Ñ¥Œ}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡Á…É…µÌ¤ì(€€€ÍÕÁ•È¡ì(€€€€€€¸¸¹Á…É…µÌ°(€€€€€µÕÍÑ	•½µµ¥ÑÑ•èÑÉÕ”°(€€€€€¹…µ”è€‰Í¥¹…ÑÕÉ•‘¥Ñ½Èˆ(€€€ô¤ì(€€€Ñ¡¥Ì¹}Ý¥±±-••ÁÍÁ•ÑI…Ñ¥¼€ôÑÉÕ”ì(€€€Ñ¡¥Ì¸Í¥¹…ÑÕÉ•…Ñ„€ôÁ…É…µÌ¹Í¥¹…ÑÕÉ•…Ñ„ñð¹Õ±°ì(€€€Ñ¡¥Ì¸‘•ÍÉ¥ÁÑ¥½¸€ô¹Õ±°ì(€€€Ñ¡¥Ì¹‘•™…Õ±Ñ0ÄÁ¹%€ô€‰Á‘™©Ìµ•‘¥Ñ½ÈµÍ¥¹…ÑÕÉ”µ•‘¥Ñ½ÈÄˆì(€ô(€ÍÑ…Ñ¥Œ¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì€ô¹•ÜM¥¹…ÑÕÉ•=ÁÑ¥½¹Ì ¤ì(€€€Ñ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¹M¥¹…ÑÕÉ•=ÁÑ¥½¹Ì€ô¹•ÜÉ…Ý¹M¥¹…ÑÕÉ•=ÁÑ¥½¹Ì¡Õ¥5…¹…•È¹Ù¥•ÝA…É…µ•Ñ•ÉÌ¤ì(€ô(€ÍÑ…Ñ¥Œ•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¡½ÁÑ¥½¹Ì¤ì(€€€½¹ÍÐ±½¹”€ôÑ¡¥Ì¹}‘•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì¹±½¹” ¤ì(€€€±½¹”¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡½ÁÑ¥½¹Ì¤ì(€€€É•ÑÕÉ¸±½¹”ì(€ô(€ÍÑ…Ñ¥Œ•ÐÍÕÁÁ½ÉÑ5Õ±Ñ¥Á±•É…Ý¥¹Ì ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€ÍÑ…Ñ¥Œ•ÐÑåÁ•Í5…À ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰ÑåÁ•Í5…Àˆ°¹•Ü5…À ¤¤ì(€ô(€ÍÑ…Ñ¥Œ•Ð¥ÍÉ…Ý•È ¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€•ÐÑ•±•µ•ÑÉå¥¹…±…Ñ„ ¤ì(€€€É•ÑÕÉ¸ì(€€€€€ÑåÁ”è€‰Í¥¹…ÑÕÉ”ˆ°(€€€€€¡…Í•ÍÉ¥ÁÑ¥½¸è€„…Ñ¡¥Ì¸‘•ÍÉ¥ÁÑ¥½¸(€€€ôì(€ô(€ÍÑ…Ñ¥Œ½µÁÕÑ•Q•±•µ•ÑÉå¥¹…±…Ñ„¡‘…Ñ„¤ì(€€€½¹ÍÐ¡…Í•ÍÉ¥ÁÑ¥½¹MÑ…ÑÌ€ô‘…Ñ„¹•Ð ‰¡…Í•ÍÉ¥ÁÑ¥½¸ˆ¤ì(€€€É•ÑÕÉ¸ì(€€€€€¡…Í±ÑQ•áÐè¡…Í•ÍÉ¥ÁÑ¥½¹MÑ…ÑÌ¹•Ð¡ÑÉÕ”¤€üü€À°(€€€€€¡…Í9½±ÑQ•áÐè¡…Í•ÍÉ¥ÁÑ¥½¹MÑ…ÑÌ¹•Ð¡™…±Í”¤€üü€À(€€€ôì(€ô(€•Ð¥ÍI•Í¥é…‰±” ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€½¹M…±•¡…¹¥¹œ ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}‘É…Ý%€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹½¹M…±•¡…¹¥¹œ ¤ì(€ô(€É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Øì(€€€ô(€€€±•Ð‰…Í•`°‰…Í•dì(€€€½¹ÍÐì(€€€€€}¥Í½Áä(€€€ô€ôÑ¡¥Ìì(€€€¥˜€¡}¥Í½Áä¤ì(€€€€€Ñ¡¥Ì¹}¥Í½Áä€ô™…±Í”ì(€€€€€‰…Í•`€ôÑ¡¥Ì¹àì(€€€€€‰…Í•d€ôÑ¡¥Ì¹äì(€€€ô(€€€ÍÕÁ•È¹É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}‘É…Ý%€ôôô¹Õ±°¤ì(€€€€€¥˜€¡Ñ¡¥Ì¸Í¥¹…ÑÕÉ•…Ñ„¤ì(€€€€€€€½¹ÍÐì(€€€€€€€€€±¥¹•Ì°(€€€€€€€€€µÕÍÑMµ½½Ñ °(€€€€€€€€€…É•½¹Ñ½ÕÉÌ°(€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸°(€€€€€€€€€ÕÕ¥°(€€€€€€€€€¡•¥¡Ñ%¹A…”(€€€€€€€ô€ôÑ¡¥Ì¸Í¥¹…ÑÕÉ•…Ñ„ì(€€€€€€€½¹ÍÐì(€€€€€€€€€É…Ý¥µÌèì(€€€€€€€€€€€Á…•]¥‘Ñ °(€€€€€€€€€€€Á…•!•¥¡Ð(€€€€€€€€€ô°(€€€€€€€€€É½Ñ…Ñ¥½¸(€€€€€€€ô€ôÑ¡¥Ì¹Á…É•¹Ð¹Ù¥•ÝÁ½ÉÐì(€€€€€€€½¹ÍÐ½ÕÑ±¥¹”€ôM¥¹…ÑÕÉ•áÑÉ…Ñ½È¹ÁÉ½•ÍÍÉ…Ý¹1¥¹•Ì¡ì(€€€€€€€€€±¥¹•Ì°(€€€€€€€€€Á…•]¥‘Ñ °(€€€€€€€€€Á…•!•¥¡Ð°(€€€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€€€¥¹¹•É5…É¥¸èM¥¹…ÑÕÉ•‘¥Ñ½È¹}%99I}5I%8°(€€€€€€€€€µÕÍÑMµ½½Ñ °(€€€€€€€€€…É•½¹Ñ½ÕÉÌ(€€€€€€€ô¤ì(€€€€€€€Ñ¡¥Ì¹…‘‘M¥¹…ÑÕÉ”¡½ÕÑ±¥¹”°¡•¥¡Ñ%¹A…”°‘•ÍÉ¥ÁÑ¥½¸°ÕÕ¥¤ì(€€€€€ô•±Í”ì(€€€€€€€Ñ¡¥Ì¹‘¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ…ÉÌˆ°)M=8¹ÍÑÉ¥¹¥™ä¡ì(€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸è€ˆˆ(€€€€€€€ô¤¤ì(€€€€€€€Ñ¡¥Ì¹‘¥Ø¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹•ÑM¥¹…ÑÕÉ”¡Ñ¡¥Ì¤ì(€€€€€ô(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹‘¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ…ÉÌˆ°)M=8¹ÍÑÉ¥¹¥™ä¡ì(€€€€€€€‘•ÍÉ¥ÁÑ¥½¸èÑ¡¥Ì¸‘•ÍÉ¥ÁÑ¥½¸ñð€ˆˆ(€€€€€ô¤¤ì(€€€ô(€€€¥˜€¡}¥Í½Áä¤ì(€€€€€Ñ¡¥Ì¹}¥Í½Áä€ôÑÉÕ”ì(€€€€€Ñ¡¥Ì¹}µ½Ù•™Ñ•ÉA…ÍÑ”¡‰…Í•`°‰…Í•d¤ì(€€€ô(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Øì(€ô(€Í•ÑUÕ¥¡ÕÕ¥¤ì(€€€Ñ¡¥Ì¸Í¥¹…ÑÕÉ•UU%€ôÕÕ¥ì(€€€Ñ¡¥Ì¹…‘‘‘¥ÑQ½½±‰…È ¤ì(€ô(€•ÑUÕ¥ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Í¥¹…ÑÕÉ•UU%ì(€ô(€•Ð‘•ÍÉ¥ÁÑ¥½¸ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸‘•ÍÉ¥ÁÑ¥½¸ì(€ô(€Í•Ð‘•ÍÉ¥ÁÑ¥½¸¡‘•ÍÉ¥ÁÑ¥½¸¤ì(€€€Ñ¡¥Ì¸‘•ÍÉ¥ÁÑ¥½¸€ô‘•ÍÉ¥ÁÑ¥½¸ì(€€€¥˜€ …Ñ¡¥Ì¹‘¥Ø¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹‘¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰‘…Ñ„µ°ÄÁ¸µ…ÉÌˆ°)M=8¹ÍÑÉ¥¹¥™ä¡ì(€€€€€‘•ÍÉ¥ÁÑ¥½¸(€€€ô¤¤ì(€€€ÍÕÁ•È¹…‘‘‘¥ÑQ½½±‰…È ¤¹Ñ¡•¸¡Ñ½½±‰…È€ôøì(€€€€€Ñ½½±‰…Èü¹ÕÁ‘…Ñ•‘¥ÑM¥¹…ÑÕÉ•	ÕÑÑ½¸¡‘•ÍÉ¥ÁÑ¥½¸¤ì(€€€ô¤ì(€ô(€•ÑM¥¹…ÑÕÉ•AÉ•Ù¥•Ü ¤ì(€€€½¹ÍÐì(€€€€€¹•ÝÕÉÙ•Ì°(€€€€€…É•½¹Ñ½ÕÉÌ°(€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ì¸Í¥¹…ÑÕÉ•…Ñ„ì(€€€½¹ÍÐµ…á¥´€ô5…Ñ ¹µ…à¡Ý¥‘Ñ °¡•¥¡Ð¤ì(€€€½¹ÍÐ½ÕÑ±¥¹•…Ñ„€ôM¥¹…ÑÕÉ•áÑÉ…Ñ½È¹ÁÉ½•ÍÍÉ…Ý¹1¥¹•Ì¡ì(€€€€€±¥¹•Ìèì(€€€€€€€ÕÉÙ•Ìè¹•ÝÕÉÙ•Ì¹µ…À¡Á½¥¹ÑÌ€ôø€¡ì(€€€€€€€€€Á½¥¹ÑÌ(€€€€€€€ô¤¤°(€€€€€€€Ñ¡¥­¹•ÍÌ°(€€€€€€€Ý¥‘Ñ °(€€€€€€€¡•¥¡Ð(€€€€€ô°(€€€€€Á…•]¥‘Ñ èµ…á¥´°(€€€€€Á…•!•¥¡Ðèµ…á¥´°(€€€€€É½Ñ…Ñ¥½¸è€À°(€€€€€¥¹¹•É5…É¥¸è€À°(€€€€€µÕÍÑMµ½½Ñ è™…±Í”°(€€€€€…É•½¹Ñ½ÕÉÌ(€€€ô¤ì(€€€É•ÑÕÉ¸ì(€€€€€…É•½¹Ñ½ÕÉÌ°(€€€€€½ÕÑ±¥¹”è½ÕÑ±¥¹•…Ñ„¹½ÕÑ±¥¹”(€€€ôì(€ô(€•ÐÑ½½±‰…É	ÕÑÑ½¹Ì ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹}Õ¥5…¹…•È¹Í¥¹…ÑÕÉ•5…¹…•È€üml‰•‘¥ÑM¥¹…ÑÕÉ”ˆ°Ñ¡¥Ì¹}Õ¥5…¹…•È¹Í¥¹…ÑÕÉ•5…¹…•Éut€èÍÕÁ•È¹Ñ½½±‰…É	ÕÑÑ½¹Ìì(€ô(€…‘‘M¥¹…ÑÕÉ”¡‘…Ñ„°¡•¥¡Ñ%¹A…”°‘•ÍÉ¥ÁÑ¥½¸°ÕÕ¥¤ì(€€€½¹ÍÐì(€€€€€àèÍ…Ù•‘`°(€€€€€äèÍ…Ù•‘d(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐì(€€€€€½ÕÑ±¥¹”(€€€ô€ôÑ¡¥Ì¸Í¥¹…ÑÕÉ•…Ñ„€ô‘…Ñ„ì(€€€Ñ¡¥Ì¸¥ÍáÑÉ…Ñ•€ô½ÕÑ±¥¹”¥¹ÍÑ…¹•½˜½¹Ñ½ÕÉÉ…Ý=ÕÑ±¥¹”ì(€€€Ñ¡¥Ì¹‘•ÍÉ¥ÁÑ¥½¸€ô‘•ÍÉ¥ÁÑ¥½¸ì(€€€±•Ð‘É…Ý¥¹=ÁÑ¥½¹Ìì(€€€¥˜€¡Ñ¡¥Ì¸¥ÍáÑÉ…Ñ•¤ì(€€€€€‘É…Ý¥¹=ÁÑ¥½¹Ì€ôM¥¹…ÑÕÉ•‘¥Ñ½È¹•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì ¤ì(€€€ô•±Í”ì(€€€€€‘É…Ý¥¹=ÁÑ¥½¹Ì€ôM¥¹…ÑÕÉ•‘¥Ñ½È¹}‘•™…Õ±ÑÉ…Ý¹M¥¹…ÑÕÉ•=ÁÑ¥½¹Ì¹±½¹” ¤ì(€€€€€‘É…Ý¥¹=ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡ì(€€€€€€€€‰ÍÑÉ½­”µÝ¥‘Ñ ˆè½ÕÑ±¥¹”¹Ñ¡¥­¹•ÍÌ(€€€€€ô¤ì(€€€ô(€€€Ñ¡¥Ì¹}…‘‘=ÕÑ±¥¹•Ì¡ì(€€€€€‘É…Ý=ÕÑ±¥¹•Ìè½ÕÑ±¥¹”°(€€€€€‘É…Ý¥¹=ÁÑ¥½¹Ì(€€€ô¤ì(€€€½¹ÍÐl°Á…•!•¥¡Ñt€ôÑ¡¥Ì¹Á…•¥µ•¹Í¥½¹Ìì(€€€±•Ð¹•Ý!•¥¡Ð€ô¡•¥¡Ñ%¹A…”€¼Á…•!•¥¡Ðì(€€€¹•Ý!•¥¡Ð€ô¹•Ý!•¥¡Ð€øô€Ä€ü€À¸Ô€è¹•Ý!•¥¡Ðì(€€€Ñ¡¥Ì¹Ý¥‘Ñ €¨ô¹•Ý!•¥¡Ð€¼Ñ¡¥Ì¹¡•¥¡Ðì(€€€¥˜€¡Ñ¡¥Ì¹Ý¥‘Ñ €øô€Ä¤ì(€€€€€¹•Ý!•¥¡Ð€¨ô€À¸ä€¼Ñ¡¥Ì¹Ý¥‘Ñ ì(€€€€€Ñ¡¥Ì¹Ý¥‘Ñ €ô€À¸äì(€€€ô(€€€Ñ¡¥Ì¹¡•¥¡Ð€ô¹•Ý!•¥¡Ðì(€€€Ñ¡¥Ì¹Í•Ñ¥µÌ ¤ì(€€€Ñ¡¥Ì¹à€ôÍ…Ù•‘`ì(€€€Ñ¡¥Ì¹ä€ôÍ…Ù•‘dì(€€€Ñ¡¥Ì¹•¹Ñ•È ¤ì(€€€Ñ¡¥Ì¹}½¹I•Í¥é• ¤ì(€€€Ñ¡¥Ì¹½¹M…±•¡…¹¥¹œ ¤ì(€€€Ñ¡¥Ì¹É½Ñ…Ñ” ¤ì(€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹…‘‘Q½¹¹½Ñ…Ñ¥½¹MÑ½É…”¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹Í•ÑUÕ¥¡ÕÕ¥¤ì(€€€Ñ¡¥Ì¹}É•Á½ÉÑQ•±•µ•ÑÉä¡ì(€€€€€…Ñ¥½¸è€‰Á‘™©Ì¹Í¥¹…ÑÕÉ”¹¥¹Í•ÉÑ•ˆ°(€€€€€‘…Ñ„èì(€€€€€€€¡…Í	••¹M…Ù•è€„…ÕÕ¥°(€€€€€€€¡…Í•ÍÉ¥ÁÑ¥½¸è€„…‘•ÍÉ¥ÁÑ¥½¸(€€€€€ô(€€€ô¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹¡¥‘‘•¸€ô™…±Í”ì(€ô(€•ÑÉ½µ%µ…”¡‰¥Ñµ…À¤ì(€€€½¹ÍÐì(€€€€€É…Ý¥µÌèì(€€€€€€€Á…•]¥‘Ñ °(€€€€€€€Á…•!•¥¡Ð(€€€€€ô°(€€€€€É½Ñ…Ñ¥½¸(€€€ô€ôÑ¡¥Ì¹Á…É•¹Ð¹Ù¥•ÝÁ½ÉÐì(€€€É•ÑÕÉ¸M¥¹…ÑÕÉ•áÑÉ…Ñ½È¹ÁÉ½•ÍÌ¡‰¥Ñµ…À°Á…•]¥‘Ñ °Á…•!•¥¡Ð°É½Ñ…Ñ¥½¸°M¥¹…ÑÕÉ•‘¥Ñ½È¹}%99I}5I%8¤ì(€ô(€•ÑÉ½µQ•áÐ¡Ñ•áÐ°™½¹Ñ%¹™¼¤ì(€€€½¹ÍÐì(€€€€€É…Ý¥µÌèì(€€€€€€€Á…•]¥‘Ñ °(€€€€€€€Á…•!•¥¡Ð(€€€€€ô°(€€€€€É½Ñ…Ñ¥½¸(€€€ô€ôÑ¡¥Ì¹Á…É•¹Ð¹Ù¥•ÝÁ½ÉÐì(€€€É•ÑÕÉ¸M¥¹…ÑÕÉ•áÑÉ…Ñ½È¹•áÑÉ…Ñ½¹Ñ½ÕÉÍÉ½µQ•áÐ¡Ñ•áÐ°™½¹Ñ%¹™¼°Á…•]¥‘Ñ °Á…•!•¥¡Ð°É½Ñ…Ñ¥½¸°M¥¹…ÑÕÉ•‘¥Ñ½È¹}%99I}5I%8¤ì(€ô(€•ÑÉ…Ý¹M¥¹…ÑÕÉ”¡ÕÉÙ•Ì¤ì(€€€½¹ÍÐì(€€€€€É…Ý¥µÌèì(€€€€€€€Á…•]¥‘Ñ °(€€€€€€€Á…•!•¥¡Ð(€€€€€ô°(€€€€€É½Ñ…Ñ¥½¸(€€€ô€ôÑ¡¥Ì¹Á…É•¹Ð¹Ù¥•ÝÁ½ÉÐì(€€€É•ÑÕÉ¸M¥¹…ÑÕÉ•áÑÉ…Ñ½È¹ÁÉ½•ÍÍÉ…Ý¹1¥¹•Ì¡ì(€€€€€±¥¹•ÌèÕÉÙ•Ì°(€€€€€Á…•]¥‘Ñ °(€€€€€Á…•!•¥¡Ð°(€€€€€É½Ñ…Ñ¥½¸°(€€€€€¥¹¹•É5…É¥¸èM¥¹…ÑÕÉ•‘¥Ñ½È¹}%99I}5I%8°(€€€€€µÕÍÑMµ½½Ñ è™…±Í”°(€€€€€…É•½¹Ñ½ÕÉÌè™…±Í”(€€€ô¤ì(€ô(€É•…Ñ•É…Ý¥¹=ÁÑ¥½¹Ì¡ì(€€€…É•½¹Ñ½ÕÉÌ°(€€€Ñ¡¥­¹•ÍÌ(€ô¤ì(€€€¥˜€¡…É•½¹Ñ½ÕÉÌ¤ì(€€€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì€ôM¥¹…ÑÕÉ•‘¥Ñ½È¹•Ñ•™…Õ±ÑÉ…Ý¥¹=ÁÑ¥½¹Ì ¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì€ôM¥¹…ÑÕÉ•‘¥Ñ½È¹}‘•™…Õ±ÑÉ…Ý¹M¥¹…ÑÕÉ•=ÁÑ¥½¹Ì¹±½¹” ¤ì(€€€€€Ñ¡¥Ì¹}‘É…Ý¥¹=ÁÑ¥½¹Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡ì(€€€€€€€€‰ÍÑÉ½­”µÝ¥‘Ñ ˆèÑ¡¥­¹•ÍÌ(€€€€€ô¤ì(€€€ô(€ô(€Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ€ô™…±Í”¤ì(€€€¥˜€¡Ñ¡¥Ì¹¥ÍµÁÑä ¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€½¹ÍÐì(€€€€€±¥¹•Ì°(€€€€€Á½¥¹ÑÌ(€€€ô€ôÑ¡¥Ì¹Í•É¥…±¥é•É…Ü¡¥Í½É½Áå¥¹œ¤ì(€€€½¹ÍÐì(€€€€€}‘É…Ý¥¹=ÁÑ¥½¹Ìèì(€€€€€€€€‰ÍÑÉ½­”µÝ¥‘Ñ ˆèÑ¡¥­¹•ÍÌ(€€€€€ô(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐÍ•É¥…±¥é•€ô=‰©•Ð¹…ÍÍ¥¸¡ÍÕÁ•È¹Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ¤°ì(€€€€€¥ÍM¥¹…ÑÕÉ”èÑÉÕ”°(€€€€€…É•½¹Ñ½ÕÉÌèÑ¡¥Ì¸¥ÍáÑÉ…Ñ•°(€€€€€½±½ÈèlÀ°€À°€Át°(€€€€€Ñ¡¥­¹•ÍÌèÑ¡¥Ì¸¥ÍáÑÉ…Ñ•€ü€À€èÑ¡¥­¹•ÍÌ(€€€ô¤ì(€€€Ñ¡¥Ì¹…‘‘½µµ•¹Ð¡Í•É¥…±¥é•¤ì(€€€¥˜€¡¥Í½É½Áå¥¹œ¤ì(€€€€€Í•É¥…±¥é•¹Á…Ñ¡Ì€ôì(€€€€€€€±¥¹•Ì°(€€€€€€€Á½¥¹ÑÌ(€€€€€ôì(€€€€€Í•É¥…±¥é•¹ÕÕ¥€ôÑ¡¥Ì¸Í¥¹…ÑÕÉ•UU%ì(€€€€€Í•É¥…±¥é•¹¥Í½Áä€ôÑÉÕ”ì(€€€ô•±Í”ì(€€€€€Í•É¥…±¥é•¹±¥¹•Ì€ô±¥¹•Ìì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸‘•ÍÉ¥ÁÑ¥½¸¤ì(€€€€€Í•É¥…±¥é•¹…•ÍÍ¥‰¥±¥Ñå…Ñ„€ôì(€€€€€€€ÑåÁ”è€‰¥ÕÉ”ˆ°(€€€€€€€…±ÐèÑ¡¥Ì¸‘•ÍÉ¥ÁÑ¥½¸(€€€€€ôì(€€€ô(€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€ô(€ÍÑ…Ñ¥Œ‘•Í•É¥…±¥é•É…Ü¡Á…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ð°¥¹¹•É5…É¥¸°‘…Ñ„¤ì(€€€¥˜€¡‘…Ñ„¹…É•½¹Ñ½ÕÉÌ¤ì(€€€€€É•ÑÕÉ¸½¹Ñ½ÕÉÉ…Ý=ÕÑ±¥¹”¹‘•Í•É¥…±¥é”¡Á…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ð°¥¹¹•É5…É¥¸°‘…Ñ„¤ì(€€€ô(€€€É•ÑÕÉ¸%¹­É…Ý=ÕÑ±¥¹”¹‘•Í•É¥…±¥é”¡Á…•`°Á…•d°Á…•]¥‘Ñ °Á…•!•¥¡Ð°¥¹¹•É5…É¥¸°‘…Ñ„¤ì(€ô(€ÍÑ…Ñ¥Œ…Íå¹Œ‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€½¹ÍÐ•‘¥Ñ½È€ô…Ý…¥ÐÍÕÁ•È¹‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€•‘¥Ñ½È¸¥ÍáÑÉ…Ñ•€ô‘…Ñ„¹…É•½¹Ñ½ÕÉÌì(€€€•‘¥Ñ½È¹‘•ÍÉ¥ÁÑ¥½¸€ô‘…Ñ„¹…•ÍÍ¥‰¥±¥Ñå…Ñ„ü¹…±Ðñð€ˆˆì(€€€•‘¥Ñ½È¸Í¥¹…ÑÕÉ•UU%€ô‘…Ñ„¹ÕÕ¥ì(€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½ÍÑ…µÀ¹©Ì(((()±…ÍÌMÑ…µÁ‘¥Ñ½È•áÑ•¹‘Ì¹¹½Ñ…Ñ¥½¹‘¥Ñ½Èì(€€‰¥Ñµ…À€ô¹Õ±°ì(€€‰¥Ñµ…Á%€ô¹Õ±°ì(€€‰¥Ñµ…ÁAÉ½µ¥Í”€ô¹Õ±°ì(€€‰¥Ñµ…ÁUÉ°€ô¹Õ±°ì(€€‰¥Ñµ…Á¥±”€ô¹Õ±°ì(€€‰¥Ñµ…Á¥±•9…µ”€ô€ˆˆì(€€…¹Ù…Ì€ô¹Õ±°ì(€€µ¥ÍÍ¥¹…¹Ù…Ì€ô™…±Í”ì(€€É•Í¥é•Q¥µ•½ÕÑ%€ô¹Õ±°ì(€€¥ÍMÙœ€ô™…±Í”ì(€€¡…Í	••¹‘‘•‘%¹U¹‘½MÑ…¬€ô™…±Í”ì(€ÍÑ…Ñ¥Œ}ÑåÁ”€ô€‰ÍÑ…µÀˆì(€ÍÑ…Ñ¥Œ}•‘¥Ñ½ÉQåÁ”€ô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹MQ5@ì(€½¹ÍÑÉÕÑ½È¡Á…É…µÌ¤ì(€€€ÍÕÁ•È¡ì(€€€€€€¸¸¹Á…É…µÌ°(€€€€€¹…µ”è€‰ÍÑ…µÁ‘¥Ñ½Èˆ(€€€ô¤ì(€€€Ñ¡¥Ì¸‰¥Ñµ…ÁUÉ°€ôÁ…É…µÌ¹‰¥Ñµ…ÁUÉ°ì(€€€Ñ¡¥Ì¸‰¥Ñµ…Á¥±”€ôÁ…É…µÌ¹‰¥Ñµ…Á¥±”ì(€€€Ñ¡¥Ì¹‘•™…Õ±Ñ0ÄÁ¹%€ô€‰Á‘™©Ìµ•‘¥Ñ½ÈµÍÑ…µÀµ•‘¥Ñ½Èˆì(€ô(€ÍÑ…Ñ¥Œ¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€ô(€ÍÑ…Ñ¥Œ¥Í!…¹‘±¥¹5¥µ•½ÉA…ÍÑ¥¹œ¡µ¥µ”¤ì(€€€É•ÑÕÉ¸MÕÁÁ½ÉÑ•‘%µ…•5¥µ•QåÁ•Ì¹¥¹±Õ‘•Ì¡µ¥µ”¤ì(€ô(€ÍÑ…Ñ¥ŒÁ…ÍÑ”¡¥Ñ•´°Á…É•¹Ð¤ì(€€€Á…É•¹Ð¹Á…ÍÑ•‘¥Ñ½È¡ì(€€€€€µ½‘”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹MQ5@(€€€ô°ì(€€€€€‰¥Ñµ…Á¥±”è¥Ñ•´¹•ÑÍ¥±” ¤(€€€ô¤ì(€ô(€…±ÑQ•áÑ¥¹¥Í  ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}Õ¥5…¹…•È¹ÕÍ•9•Ý±ÑQ•áÑ±½Ü¤ì(€€€€€Ñ¡¥Ì¹‘¥Ø¹¡¥‘‘•¸€ô™…±Í”ì(€€€ô(€€€ÍÕÁ•È¹…±ÑQ•áÑ¥¹¥Í  ¤ì(€ô(€•ÐÑ•±•µ•ÑÉå¥¹…±…Ñ„ ¤ì(€€€É•ÑÕÉ¸ì(€€€€€ÑåÁ”è€‰ÍÑ…µÀˆ°(€€€€€¡…Í±ÑQ•áÐè€„…Ñ¡¥Ì¹…±ÑQ•áÑ…Ñ„ü¹…±ÑQ•áÐ(€€€ôì(€ô(€ÍÑ…Ñ¥Œ½µÁÕÑ•Q•±•µ•ÑÉå¥¹…±…Ñ„¡‘…Ñ„¤ì(€€€½¹ÍÐ¡…Í±ÑQ•áÑMÑ…ÑÌ€ô‘…Ñ„¹•Ð ‰¡…Í±ÑQ•áÐˆ¤ì(€€€É•ÑÕÉ¸ì(€€€€€¡…Í±ÑQ•áÐè¡…Í±ÑQ•áÑMÑ…ÑÌ¹•Ð¡ÑÉÕ”¤€üü€À°(€€€€€¡…Í9½±ÑQ•áÐè¡…Í±ÑQ•áÑMÑ…ÑÌ¹•Ð¡™…±Í”¤€üü€À(€€€ôì(€ô(€€•Ñ	¥Ñµ…Á•Ñ¡•¡‘…Ñ„°™É½µ%€ô™…±Í”¤ì(€€€¥˜€ …‘…Ñ„¤ì(€€€€€Ñ¡¥Ì¹É•µ½Ù” ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸‰¥Ñµ…À€ô‘…Ñ„¹‰¥Ñµ…Àì(€€€¥˜€ …™É½µ%¤ì(€€€€€Ñ¡¥Ì¸‰¥Ñµ…Á%€ô‘…Ñ„¹¥ì(€€€€€Ñ¡¥Ì¸¥ÍMÙœ€ô‘…Ñ„¹¥ÍMÙœì(€€€ô(€€€¥˜€¡‘…Ñ„¹™¥±”¤ì(€€€€€Ñ¡¥Ì¸‰¥Ñµ…Á¥±•9…µ”€ô‘…Ñ„¹™¥±”¹¹…µ”ì(€€€ô(€€€Ñ¡¥Ì¸É•…Ñ•…¹Ù…Ì ¤ì(€ô(€€•Ñ	¥Ñµ…Á½¹” ¤ì(€€€Ñ¡¥Ì¸‰¥Ñµ…ÁAÉ½µ¥Í”€ô¹Õ±°ì(€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹•¹…‰±•]…¥Ñ¥¹œ¡™…±Í”¤ì(€€€¥˜€ …Ñ¡¥Ì¸…¹Ù…Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹}Õ¥5…¹…•È¹ÕÍ•9•Ý±ÑQ•áÑ]¡•¹‘‘¥¹%µ…”€˜˜Ñ¡¥Ì¹}Õ¥5…¹…•È¹ÕÍ•9•Ý±ÑQ•áÑ±½Ü€˜˜Ñ¡¥Ì¸‰¥Ñµ…À¤ì(€€€€€Ñ¡¥Ì¹…‘‘‘¥ÑQ½½±‰…È ¤¹Ñ¡•¸  ¤€ôøì(€€€€€€€Ñ¡¥Ì¹}•‘¥ÑQ½½±‰…È¹¡¥‘” ¤ì(€€€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹•‘¥Ñ±ÑQ•áÐ¡Ñ¡¥Ì°ÑÉÕ”¤ì(€€€€€ô¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¹}Õ¥5…¹…•È¹ÕÍ•9•Ý±ÑQ•áÑ]¡•¹‘‘¥¹%µ…”€˜˜Ñ¡¥Ì¹}Õ¥5…¹…•È¹ÕÍ•9•Ý±ÑQ•áÑ±½Ü€˜˜Ñ¡¥Ì¸‰¥Ñµ…À¤ì(€€€€€Ñ¡¥Ì¹}É•Á½ÉÑQ•±•µ•ÑÉä¡ì(€€€€€€€…Ñ¥½¸è€‰Á‘™©Ì¹¥µ…”¹¥µ…•}…‘‘•ˆ°(€€€€€€€‘…Ñ„èì(€€€€€€€€€…±Ñ}Ñ•áÑ}µ½‘…°è™…±Í”°(€€€€€€€€€…±Ñ}Ñ•áÑ}ÑåÁ”è€‰•µÁÑäˆ(€€€€€€€ô(€€€€€ô¤ì(€€€€€ÑÉäì(€€€€€€€Ñ¡¥Ì¹µ±Õ•ÍÍ±ÑQ•áÐ ¤ì(€€€€€ô…Ñ íô(€€€ô(€€€Ñ¡¥Ì¹‘¥Ø¹™½ÕÌ ¤ì(€ô(€…Íå¹Œµ±Õ•ÍÍ±ÑQ•áÐ¡¥µ…•…Ñ„€ô¹Õ±°°ÕÁ‘…Ñ•±ÑQ•áÑ…Ñ„€ôÑÉÕ”¤ì(€€€¥˜€¡Ñ¡¥Ì¹¡…Í±ÑQ•áÑ…Ñ„ ¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€½¹ÍÐì(€€€€€µ±5…¹…•È(€€€ô€ôÑ¡¥Ì¹}Õ¥5…¹…•Èì(€€€¥˜€ …µ±5…¹…•È¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰9¼50¸ˆ¤ì(€€€ô(€€€¥˜€ „¡…Ý…¥Ðµ±5…¹…•È¹¥Í¹…‰±•‘½È ‰…±ÑQ•áÐˆ¤¤¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰50¥Í¸Ð•¹…‰±•™½È…±ÐÑ•áÐ¸ˆ¤ì(€€€ô(€€€½¹ÍÐì(€€€€€‘…Ñ„°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ô¥µ…•…Ñ„ñðÑ¡¥Ì¹½Áå…¹Ù…Ì¡¹Õ±°°¹Õ±°°ÑÉÕ”¤¹¥µ…•…Ñ„ì(€€€½¹ÍÐÉ•ÍÁ½¹Í”€ô…Ý…¥Ðµ±5…¹…•È¹Õ•ÍÌ¡ì(€€€€€¹…µ”è€‰…±ÑQ•áÐˆ°(€€€€€É•ÅÕ•ÍÐèì(€€€€€€€‘…Ñ„°(€€€€€€€Ý¥‘Ñ °(€€€€€€€¡•¥¡Ð°(€€€€€€€¡…¹¹•±Ìè‘…Ñ„¹±•¹Ñ €¼€¡Ý¥‘Ñ €¨¡•¥¡Ð¤(€€€€€ô(€€€ô¤ì(€€€¥˜€ …É•ÍÁ½¹Í”¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰9¼É•ÍÁ½¹Í”™É½´Ñ¡”$Í•ÉÙ¥”¸ˆ¤ì(€€€ô(€€€¥˜€¡É•ÍÁ½¹Í”¹•ÉÉ½È¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰ÉÉ½È™É½´Ñ¡”$Í•ÉÙ¥”¸ˆ¤ì(€€€ô(€€€¥˜€¡É•ÍÁ½¹Í”¹…¹•°¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€¥˜€ …É•ÍÁ½¹Í”¹½ÕÑÁÕÐ¤ì(€€€€€Ñ¡É½Ü¹•ÜÉÉ½È ‰9¼Ù…±¥É•ÍÁ½¹Í”™É½´Ñ¡”$Í•ÉÙ¥”¸ˆ¤ì(€€€ô(€€€½¹ÍÐ…±ÑQ•áÐ€ôÉ•ÍÁ½¹Í”¹½ÕÑÁÕÐì(€€€…Ý…¥ÐÑ¡¥Ì¹Í•ÑÕ•ÍÍ•‘±ÑQ•áÐ¡…±ÑQ•áÐ¤ì(€€€¥˜€¡ÕÁ‘…Ñ•±ÑQ•áÑ…Ñ„€˜˜€…Ñ¡¥Ì¹¡…Í±ÑQ•áÑ…Ñ„ ¤¤ì(€€€€€Ñ¡¥Ì¹…±ÑQ•áÑ…Ñ„€ôì(€€€€€€€…±Ðè…±ÑQ•áÐ°(€€€€€€€‘•½É…Ñ¥Ù”è™…±Í”(€€€€€ôì(€€€ô(€€€É•ÑÕÉ¸…±ÑQ•áÐì(€ô(€€•Ñ	¥Ñµ…À ¤ì(€€€¥˜€¡Ñ¡¥Ì¸‰¥Ñµ…Á%¤ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹•¹…‰±•]…¥Ñ¥¹œ¡ÑÉÕ”¤ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹¥µ…•5…¹…•È¹•ÑÉ½µ%¡Ñ¡¥Ì¸‰¥Ñµ…Á%¤¹Ñ¡•¸¡‘…Ñ„€ôøÑ¡¥Ì¸•Ñ	¥Ñµ…Á•Ñ¡•¡‘…Ñ„°ÑÉÕ”¤¤¹™¥¹…±±ä  ¤€ôøÑ¡¥Ì¸•Ñ	¥Ñµ…Á½¹” ¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸‰¥Ñµ…ÁUÉ°¤ì(€€€€€½¹ÍÐÕÉ°€ôÑ¡¥Ì¸‰¥Ñµ…ÁUÉ°ì(€€€€€Ñ¡¥Ì¸‰¥Ñµ…ÁUÉ°€ô¹Õ±°ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹•¹…‰±•]…¥Ñ¥¹œ¡ÑÉÕ”¤ì(€€€€€Ñ¡¥Ì¸‰¥Ñµ…ÁAÉ½µ¥Í”€ôÑ¡¥Ì¹}Õ¥5…¹…•È¹¥µ…•5…¹…•È¹•ÑÉ½µUÉ°¡ÕÉ°¤¹Ñ¡•¸¡‘…Ñ„€ôøÑ¡¥Ì¸•Ñ	¥Ñµ…Á•Ñ¡•¡‘…Ñ„¤¤¹™¥¹…±±ä  ¤€ôøÑ¡¥Ì¸•Ñ	¥Ñµ…Á½¹” ¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸‰¥Ñµ…Á¥±”¤ì(€€€€€½¹ÍÐ™¥±”€ôÑ¡¥Ì¸‰¥Ñµ…Á¥±”ì(€€€€€Ñ¡¥Ì¸‰¥Ñµ…Á¥±”€ô¹Õ±°ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹•¹…‰±•]…¥Ñ¥¹œ¡ÑÉÕ”¤ì(€€€€€Ñ¡¥Ì¸‰¥Ñµ…ÁAÉ½µ¥Í”€ôÑ¡¥Ì¹}Õ¥5…¹…•È¹¥µ…•5…¹…•È¹•ÑÉ½µ¥±”¡™¥±”¤¹Ñ¡•¸¡‘…Ñ„€ôøÑ¡¥Ì¸•Ñ	¥Ñµ…Á•Ñ¡•¡‘…Ñ„¤¤¹™¥¹…±±ä  ¤€ôøÑ¡¥Ì¸•Ñ	¥Ñµ…Á½¹” ¤¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ¥¹ÁÕÐ€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰¥¹ÁÕÐˆ¤ì(€€€¥¹ÁÕÐ¹ÑåÁ”€ô€‰™¥±”ˆì(€€€¥¹ÁÕÐ¹…•ÁÐ€ôMÕÁÁ½ÉÑ•‘%µ…•5¥µ•QåÁ•Ì¹©½¥¸ ˆ°ˆ¤ì(€€€½¹ÍÐÍ¥¹…°€ôÑ¡¥Ì¹}Õ¥5…¹…•È¹}Í¥¹…°ì(€€€Ñ¡¥Ì¸‰¥Ñµ…ÁAÉ½µ¥Í”€ô¹•ÜAÉ½µ¥Í”¡É•Í½±Ù”€ôøì(€€€€€¥¹ÁÕÐ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰¡…¹”ˆ°…Íå¹Œ€ ¤€ôøì(€€€€€€€¥˜€ …¥¹ÁÕÐ¹™¥±•Ìñð¥¹ÁÕÐ¹™¥±•Ì¹±•¹Ñ €ôôô€À¤ì(€€€€€€€€€Ñ¡¥Ì¹É•µ½Ù” ¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹•¹…‰±•]…¥Ñ¥¹œ¡ÑÉÕ”¤ì(€€€€€€€€€½¹ÍÐ‘…Ñ„€ô…Ý…¥ÐÑ¡¥Ì¹}Õ¥5…¹…•È¹¥µ…•5…¹…•È¹•ÑÉ½µ¥±”¡¥¹ÁÕÐ¹™¥±•ÍlÁt¤ì(€€€€€€€€€Ñ¡¥Ì¹}É•Á½ÉÑQ•±•µ•ÑÉä¡ì(€€€€€€€€€€€…Ñ¥½¸è€‰Á‘™©Ì¹¥µ…”¹¥µ…•}Í•±•Ñ•ˆ°(€€€€€€€€€€€‘…Ñ„èì(€€€€€€€€€€€€€…±Ñ}Ñ•áÑ}µ½‘…°èÑ¡¥Ì¹}Õ¥5…¹…•È¹ÕÍ•9•Ý±ÑQ•áÑ±½Ü(€€€€€€€€€€€ô(€€€€€€€€€ô¤ì(€€€€€€€€€Ñ¡¥Ì¸•Ñ	¥Ñµ…Á•Ñ¡•¡‘…Ñ„¤ì(€€€€€€€ô(€€€€€€€É•Í½±Ù” ¤ì(€€€€€ô°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€¥¹ÁÕÐ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰…¹•°ˆ°€ ¤€ôøì(€€€€€€€Ñ¡¥Ì¹É•µ½Ù” ¤ì(€€€€€€€É•Í½±Ù” ¤ì(€€€€€ô°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€ô¤¹™¥¹…±±ä  ¤€ôøÑ¡¥Ì¸•Ñ	¥Ñµ…Á½¹” ¤¤ì(€€€¥¹ÁÕÐ¹±¥¬ ¤ì(€ô(€É•µ½Ù” ¤ì(€€€¥˜€¡Ñ¡¥Ì¸‰¥Ñµ…Á%¤ì(€€€€€Ñ¡¥Ì¸‰¥Ñµ…À€ô¹Õ±°ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹¥µ…•5…¹…•È¹‘•±•Ñ•%¡Ñ¡¥Ì¸‰¥Ñµ…Á%¤ì(€€€€€Ñ¡¥Ì¸…¹Ù…Ìü¹É•µ½Ù” ¤ì(€€€€€Ñ¡¥Ì¸…¹Ù…Ì€ô¹Õ±°ì(€€€€€¥˜€¡Ñ¡¥Ì¸É•Í¥é•Q¥µ•½ÕÑ%¤ì(€€€€€€€±•…ÉQ¥µ•½ÕÐ¡Ñ¡¥Ì¸É•Í¥é•Q¥µ•½ÕÑ%¤ì(€€€€€€€Ñ¡¥Ì¸É•Í¥é•Q¥µ•½ÕÑ%€ô¹Õ±°ì(€€€€€ô(€€€ô(€€€ÍÕÁ•È¹É•µ½Ù” ¤ì(€ô(€É•‰Õ¥± ¤ì(€€€¥˜€ …Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€€€¥˜€¡Ñ¡¥Ì¸‰¥Ñµ…Á%¤ì(€€€€€€€Ñ¡¥Ì¸•Ñ	¥Ñµ…À ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€ÍÕÁ•È¹É•‰Õ¥± ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸‰¥Ñµ…Á%€˜˜Ñ¡¥Ì¸…¹Ù…Ì€ôôô¹Õ±°¤ì(€€€€€Ñ¡¥Ì¸•Ñ	¥Ñµ…À ¤ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¹¥ÍÑÑ…¡•‘Q½=4¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹…‘¡Ñ¡¥Ì¤ì(€€€ô(€ô(€½¹•‘‘•¡™½ÕÌ¤ì(€€€Ñ¡¥Ì¹}¥ÍÉ……‰±”€ôÑÉÕ”ì(€€€¥˜€¡™½ÕÌ¤ì(€€€€€Ñ¡¥Ì¹‘¥Ø¹™½ÕÌ ¤ì(€€€ô(€ô(€¥ÍµÁÑä ¤ì(€€€É•ÑÕÉ¸€„¡Ñ¡¥Ì¸‰¥Ñµ…ÁAÉ½µ¥Í”ñðÑ¡¥Ì¸‰¥Ñµ…ÀñðÑ¡¥Ì¸‰¥Ñµ…ÁUÉ°ñðÑ¡¥Ì¸‰¥Ñµ…Á¥±”ñðÑ¡¥Ì¸‰¥Ñµ…Á%ñðÑ¡¥Ì¸µ¥ÍÍ¥¹…¹Ù…Ì¤ì(€ô(€•ÐÑ½½±‰…É	ÕÑÑ½¹Ì ¤ì(€€€É•ÑÕÉ¸ml‰…±ÑQ•áÐˆ°Ñ¡¥Ì¹É•…Ñ•±ÑQ•áÐ ¥utì(€ô(€•Ð¥ÍI•Í¥é…‰±” ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€É•¹‘•È ¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Øì(€€€ô(€€€±•Ð‰…Í•`°‰…Í•dì(€€€¥˜€¡Ñ¡¥Ì¹}¥Í½Áä¤ì(€€€€€‰…Í•`€ôÑ¡¥Ì¹àì(€€€€€‰…Í•d€ôÑ¡¥Ì¹äì(€€€ô(€€€ÍÕÁ•È¹É•¹‘•È ¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹É•…Ñ•±ÑQ•áÐ ¤ì(€€€¥˜€ …Ñ¡¥Ì¸µ¥ÍÍ¥¹…¹Ù…Ì¤ì(€€€€€¥˜€¡Ñ¡¥Ì¸‰¥Ñµ…À¤ì(€€€€€€€Ñ¡¥Ì¸É•…Ñ•…¹Ù…Ì ¤ì(€€€€€ô•±Í”ì(€€€€€€€Ñ¡¥Ì¸•Ñ	¥Ñµ…À ¤ì(€€€€€ô(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹}¥Í½Áä¤ì(€€€€€Ñ¡¥Ì¹}µ½Ù•™Ñ•ÉA…ÍÑ”¡‰…Í•`°‰…Í•d¤ì(€€€ô(€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹…‘‘M¡½Õ±‘I•Í…±”¡Ñ¡¥Ì¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Øì(€ô(€Í•Ñ…¹Ù…Ì¡…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%°…¹Ù…Ì¤ì(€€€½¹ÍÐì(€€€€€¥è‰¥Ñµ…Á%°(€€€€€‰¥Ñµ…À(€€€ô€ôÑ¡¥Ì¹}Õ¥5…¹…•È¹¥µ…•5…¹…•È¹•ÑÉ½µ…¹Ù…Ì¡…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%°…¹Ù…Ì¤ì(€€€…¹Ù…Ì¹É•µ½Ù” ¤ì(€€€¥˜€¡‰¥Ñµ…Á%€˜˜Ñ¡¥Ì¹}Õ¥5…¹…•È¹¥µ…•5…¹…•È¹¥ÍY…±¥‘%¡‰¥Ñµ…Á%¤¤ì(€€€€€Ñ¡¥Ì¸‰¥Ñµ…Á%€ô‰¥Ñµ…Á%ì(€€€€€¥˜€¡‰¥Ñµ…À¤ì(€€€€€€€Ñ¡¥Ì¸‰¥Ñµ…À€ô‰¥Ñµ…Àì(€€€€€ô(€€€€€Ñ¡¥Ì¸µ¥ÍÍ¥¹…¹Ù…Ì€ô™…±Í”ì(€€€€€Ñ¡¥Ì¸É•…Ñ•…¹Ù…Ì ¤ì(€€€ô(€ô(€}½¹I•Í¥é• ¤ì(€€€Ñ¡¥Ì¹½¹M…±•¡…¹¥¹œ ¤ì(€ô(€½¹M…±•¡…¹¥¹œ ¤ì(€€€¥˜€ …Ñ¡¥Ì¹Á…É•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸É•Í¥é•Q¥µ•½ÕÑ%€„ôô¹Õ±°¤ì(€€€€€±•…ÉQ¥µ•½ÕÐ¡Ñ¡¥Ì¸É•Í¥é•Q¥µ•½ÕÑ%¤ì(€€€ô(€€€½¹ÍÐQ%5}Q=}]%P€ô€ÈÀÀì(€€€Ñ¡¥Ì¸É•Í¥é•Q¥µ•½ÕÑ%€ôÍ•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€Ñ¡¥Ì¸É•Í¥é•Q¥µ•½ÕÑ%€ô¹Õ±°ì(€€€€€Ñ¡¥Ì¸‘É…Ý	¥Ñµ…À ¤ì(€€€ô°Q%5}Q=}]%P¤ì(€ô(€€É•…Ñ•…¹Ù…Ì ¤ì(€€€½¹ÍÐì(€€€€€‘¥Ø(€€€ô€ôÑ¡¥Ìì(€€€±•Ðì(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ì¸‰¥Ñµ…Àì(€€€½¹ÍÐmÁ…•]¥‘Ñ °Á…•!•¥¡Ñt€ôÑ¡¥Ì¹Á…•¥µ•¹Í¥½¹Ìì(€€€½¹ÍÐ5a}IQ%<€ô€À¸ÜÔì(€€€¥˜€¡Ñ¡¥Ì¹Ý¥‘Ñ ¤ì(€€€€€Ý¥‘Ñ €ôÑ¡¥Ì¹Ý¥‘Ñ €¨Á…•]¥‘Ñ ì(€€€€€¡•¥¡Ð€ôÑ¡¥Ì¹¡•¥¡Ð€¨Á…•!•¥¡Ðì(€€€ô•±Í”¥˜€¡Ý¥‘Ñ €ø5a}IQ%<€¨Á…•]¥‘Ñ ñð¡•¥¡Ð€ø5a}IQ%<€¨Á…•!•¥¡Ð¤ì(€€€€€½¹ÍÐ™…Ñ½È€ô5…Ñ ¹µ¥¸¡5a}IQ%<€¨Á…•]¥‘Ñ €¼Ý¥‘Ñ °5a}IQ%<€¨Á…•!•¥¡Ð€¼¡•¥¡Ð¤ì(€€€€€Ý¥‘Ñ €¨ô™…Ñ½Èì(€€€€€¡•¥¡Ð€¨ô™…Ñ½Èì(€€€ô(€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹•¹…‰±•]…¥Ñ¥¹œ¡™…±Í”¤ì(€€€½¹ÍÐ…¹Ù…Ì€ôÑ¡¥Ì¸…¹Ù…Ì€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰…¹Ù…Ìˆ¤ì(€€€…¹Ù…Ì¹Í•ÑÑÑÉ¥‰ÕÑ” ‰É½±”ˆ°€‰¥µœˆ¤ì(€€€Ñ¡¥Ì¹…‘‘½¹Ñ…¥¹•È¡…¹Ù…Ì¤ì(€€€Ñ¡¥Ì¹Ý¥‘Ñ €ôÝ¥‘Ñ €¼Á…•]¥‘Ñ ì(€€€Ñ¡¥Ì¹¡•¥¡Ð€ô¡•¥¡Ð€¼Á…•!•¥¡Ðì(€€€Ñ¡¥Ì¹Í•Ñ¥µÌ ¤ì(€€€¥˜€¡Ñ¡¥Ì¹}¥¹¥Ñ¥…±=ÁÑ¥½¹Ìü¹¥Í•¹Ñ•É•¤ì(€€€€€Ñ¡¥Ì¹•¹Ñ•È ¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹™¥á¹‘M•ÑA½Í¥Ñ¥½¸ ¤ì(€€€ô(€€€Ñ¡¥Ì¹}¥¹¥Ñ¥…±=ÁÑ¥½¹Ì€ô¹Õ±°ì(€€€¥˜€ …Ñ¡¥Ì¹}Õ¥5…¹…•È¹ÕÍ•9•Ý±ÑQ•áÑ]¡•¹‘‘¥¹%µ…”ñð€…Ñ¡¥Ì¹}Õ¥5…¹…•È¹ÕÍ•9•Ý±ÑQ•áÑ±½ÜñðÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€‘¥Ø¹¡¥‘‘•¸€ô™…±Í”ì(€€€ô(€€€Ñ¡¥Ì¸‘É…Ý	¥Ñµ…À ¤ì(€€€¥˜€ …Ñ¡¥Ì¸¡…Í	••¹‘‘•‘%¹U¹‘½MÑ…¬¤ì(€€€€€Ñ¡¥Ì¹Á…É•¹Ð¹…‘‘U¹‘½…‰±•‘¥Ñ½È¡Ñ¡¥Ì¤ì(€€€€€Ñ¡¥Ì¸¡…Í	••¹‘‘•‘%¹U¹‘½MÑ…¬€ôÑÉÕ”ì(€€€ô(€€€Ñ¡¥Ì¹}É•Á½ÉÑQ•±•µ•ÑÉä¡ì(€€€€€…Ñ¥½¸è€‰¥¹Í•ÉÑ•‘}¥µ…”ˆ(€€€ô¤ì(€€€¥˜€¡Ñ¡¥Ì¸‰¥Ñµ…Á¥±•9…µ”¤ì(€€€€€Ñ¡¥Ì¹‘¥Ø¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µ‘•ÍÉ¥ÁÑ¥½¸ˆ°Ñ¡¥Ì¸‰¥Ñµ…Á¥±•9…µ”¤ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€Ñ¡¥Ì¹}Õ¥5…¹…•È¹„ÄÅå±•ÉÐ¡¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹}°ÄÁ¹±•ÉÐ¹ÍÑ…µÀ¤ì(€€€ô(€ô(€½Áå…¹Ù…Ì¡µ…á…Ñ…¥µ•¹Í¥½¸°µ…áAÉ•Ù¥•Ý¥µ•¹Í¥½¸°É•…Ñ•%µ…•…Ñ„€ô™…±Í”¤ì(€€€µ…á…Ñ…¥µ•¹Í¥½¸ñðô€ÈÈÐì(€€€½¹ÍÐì(€€€€€Ý¥‘Ñ è‰¥Ñµ…Á]¥‘Ñ °(€€€€€¡•¥¡Ðè‰¥Ñµ…Á!•¥¡Ð(€€€ô€ôÑ¡¥Ì¸‰¥Ñµ…Àì(€€€½¹ÍÐ½ÕÑÁÕÑM…±”€ô¹•Ü=ÕÑÁÕÑM…±” ¤ì(€€€±•Ð‰¥Ñµ…À€ôÑ¡¥Ì¸‰¥Ñµ…Àì(€€€±•ÐÝ¥‘Ñ €ô‰¥Ñµ…Á]¥‘Ñ °(€€€€€¡•¥¡Ð€ô‰¥Ñµ…Á!•¥¡Ðì(€€€±•Ð…¹Ù…Ì€ô¹Õ±°ì(€€€¥˜€¡µ…áAÉ•Ù¥•Ý¥µ•¹Í¥½¸¤ì(€€€€€¥˜€¡‰¥Ñµ…Á]¥‘Ñ €øµ…áAÉ•Ù¥•Ý¥µ•¹Í¥½¸ñð‰¥Ñµ…Á!•¥¡Ð€øµ…áAÉ•Ù¥•Ý¥µ•¹Í¥½¸¤ì(€€€€€€€½¹ÍÐÉ…Ñ¥¼€ô5…Ñ ¹µ¥¸¡µ…áAÉ•Ù¥•Ý¥µ•¹Í¥½¸€¼‰¥Ñµ…Á]¥‘Ñ °µ…áAÉ•Ù¥•Ý¥µ•¹Í¥½¸€¼‰¥Ñµ…Á!•¥¡Ð¤ì(€€€€€€€Ý¥‘Ñ €ô5…Ñ ¹™±½½È¡‰¥Ñµ…Á]¥‘Ñ €¨É…Ñ¥¼¤ì(€€€€€€€¡•¥¡Ð€ô5…Ñ ¹™±½½È¡‰¥Ñµ…Á!•¥¡Ð€¨É…Ñ¥¼¤ì(€€€€€ô(€€€€€…¹Ù…Ì€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰…¹Ù…Ìˆ¤ì(€€€€€½¹ÍÐÍ…±•‘]¥‘Ñ €ô…¹Ù…Ì¹Ý¥‘Ñ €ô5…Ñ ¹•¥°¡Ý¥‘Ñ €¨½ÕÑÁÕÑM…±”¹Íà¤ì(€€€€€½¹ÍÐÍ…±•‘!•¥¡Ð€ô…¹Ù…Ì¹¡•¥¡Ð€ô5…Ñ ¹•¥°¡¡•¥¡Ð€¨½ÕÑÁÕÑM…±”¹Íä¤ì(€€€€€¥˜€ …Ñ¡¥Ì¸¥ÍMÙœ¤ì(€€€€€€€‰¥Ñµ…À€ôÑ¡¥Ì¸Í…±•	¥Ñµ…À¡Í…±•‘]¥‘Ñ °Í…±•‘!•¥¡Ð¤ì(€€€€€ô(€€€€€½¹ÍÐÑà€ô…¹Ù…Ì¹•Ñ½¹Ñ•áÐ ˆÉˆ¤ì(€€€€€Ñà¹™¥±Ñ•È€ôÑ¡¥Ì¹}Õ¥5…¹…•È¹¡µ¥±Ñ•Èì(€€€€€±•ÐÝ¡¥Ñ”€ô€‰Ý¡¥Ñ”ˆ°(€€€€€€€‰±…¬€ô€ˆ™™àˆì(€€€€€¥˜€¡Ñ¡¥Ì¹}Õ¥5…¹…•È¹¡µ¥±Ñ•È€„ôô€‰¹½¹”ˆ¤ì(€€€€€€€‰±…¬€ô€‰‰±…¬ˆì(€€€€€ô•±Í”¥˜€¡½±½ÉM¡•µ”¹¥Í…É­5½‘”¤ì(€€€€€€€Ý¡¥Ñ”€ô€ˆŒá˜á˜åˆì(€€€€€€€‰±…¬€ô€ˆŒÐÈÐÄÑˆì(€€€€€ô(€€€€€½¹ÍÐ‰½á¥´€ô€ÄÔì(€€€€€½¹ÍÐ‰½á¥µ]¥‘Ñ €ô‰½á¥´€¨½ÕÑÁÕÑM…±”¹Íàì(€€€€€½¹ÍÐ‰½á¥µ!•¥¡Ð€ô‰½á¥´€¨½ÕÑÁÕÑM…±”¹Íäì(€€€€€½¹ÍÐÁ…ÑÑ•É¸€ô¹•Ü=™™ÍÉ••¹…¹Ù…Ì¡‰½á¥µ]¥‘Ñ €¨€È°‰½á¥µ!•¥¡Ð€¨€È¤ì(€€€€€½¹ÍÐÁ…ÑÑ•É¹Ñà€ôÁ…ÑÑ•É¸¹•Ñ½¹Ñ•áÐ ˆÉˆ¤ì(€€€€€Á…ÑÑ•É¹Ñà¹™¥±±MÑå±”€ôÝ¡¥Ñ”ì(€€€€€Á…ÑÑ•É¹Ñà¹™¥±±I•Ð À°€À°‰½á¥µ]¥‘Ñ €¨€È°‰½á¥µ!•¥¡Ð€¨€È¤ì(€€€€€Á…ÑÑ•É¹Ñà¹™¥±±MÑå±”€ô‰±…¬ì(€€€€€Á…ÑÑ•É¹Ñà¹™¥±±I•Ð À°€À°‰½á¥µ]¥‘Ñ °‰½á¥µ!•¥¡Ð¤ì(€€€€€Á…ÑÑ•É¹Ñà¹™¥±±I•Ð¡‰½á¥µ]¥‘Ñ °‰½á¥µ!•¥¡Ð°‰½á¥µ]¥‘Ñ °‰½á¥µ!•¥¡Ð¤ì(€€€€€Ñà¹™¥±±MÑå±”€ôÑà¹É•…Ñ•A…ÑÑ•É¸¡Á…ÑÑ•É¸°€‰É•Á•…Ðˆ¤ì(€€€€€Ñà¹™¥±±I•Ð À°€À°Í…±•‘]¥‘Ñ °Í…±•‘!•¥¡Ð¤ì(€€€€€Ñà¹‘É…Ý%µ…”¡‰¥Ñµ…À°€À°€À°‰¥Ñµ…À¹Ý¥‘Ñ °‰¥Ñµ…À¹¡•¥¡Ð°€À°€À°Í…±•‘]¥‘Ñ °Í…±•‘!•¥¡Ð¤ì(€€€ô(€€€±•Ð¥µ…•…Ñ„€ô¹Õ±°ì(€€€¥˜€¡É•…Ñ•%µ…•…Ñ„¤ì(€€€€€±•Ð‘…Ñ…]¥‘Ñ °‘…Ñ…!•¥¡Ðì(€€€€€¥˜€¡½ÕÑÁÕÑM…±”¹Íåµµ•ÑÉ¥Œ€˜˜‰¥Ñµ…À¹Ý¥‘Ñ €ðµ…á…Ñ…¥µ•¹Í¥½¸€˜˜‰¥Ñµ…À¹¡•¥¡Ð€ðµ…á…Ñ…¥µ•¹Í¥½¸¤ì(€€€€€€€‘…Ñ…]¥‘Ñ €ô‰¥Ñµ…À¹Ý¥‘Ñ ì(€€€€€€€‘…Ñ…!•¥¡Ð€ô‰¥Ñµ…À¹¡•¥¡Ðì(€€€€€ô•±Í”ì(€€€€€€€‰¥Ñµ…À€ôÑ¡¥Ì¸‰¥Ñµ…Àì(€€€€€€€¥˜€¡‰¥Ñµ…Á]¥‘Ñ €øµ…á…Ñ…¥µ•¹Í¥½¸ñð‰¥Ñµ…Á!•¥¡Ð€øµ…á…Ñ…¥µ•¹Í¥½¸¤ì(€€€€€€€€€½¹ÍÐÉ…Ñ¥¼€ô5…Ñ ¹µ¥¸¡µ…á…Ñ…¥µ•¹Í¥½¸€¼‰¥Ñµ…Á]¥‘Ñ °µ…á…Ñ…¥µ•¹Í¥½¸€¼‰¥Ñµ…Á!•¥¡Ð¤ì(€€€€€€€€€‘…Ñ…]¥‘Ñ €ô5…Ñ ¹™±½½È¡‰¥Ñµ…Á]¥‘Ñ €¨É…Ñ¥¼¤ì(€€€€€€€€€‘…Ñ…!•¥¡Ð€ô5…Ñ ¹™±½½È¡‰¥Ñµ…Á!•¥¡Ð€¨É…Ñ¥¼¤ì(€€€€€€€€€¥˜€ …Ñ¡¥Ì¸¥ÍMÙœ¤ì(€€€€€€€€€€€‰¥Ñµ…À€ôÑ¡¥Ì¸Í…±•	¥Ñµ…À¡‘…Ñ…]¥‘Ñ °‘…Ñ…!•¥¡Ð¤ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô(€€€€€½¹ÍÐ½™™ÍÉ••¸€ô¹•Ü=™™ÍÉ••¹…¹Ù…Ì¡‘…Ñ…]¥‘Ñ °‘…Ñ…!•¥¡Ð¤ì(€€€€€½¹ÍÐ½™™ÍÉ••¹Ñà€ô½™™ÍÉ••¸¹•Ñ½¹Ñ•áÐ ˆÉˆ°ì(€€€€€€€Ý¥±±I•…‘É•ÅÕ•¹Ñ±äèÑÉÕ”(€€€€€ô¤ì(€€€€€½™™ÍÉ••¹Ñà¹‘É…Ý%µ…”¡‰¥Ñµ…À°€À°€À°‰¥Ñµ…À¹Ý¥‘Ñ °‰¥Ñµ…À¹¡•¥¡Ð°€À°€À°‘…Ñ…]¥‘Ñ °‘…Ñ…!•¥¡Ð¤ì(€€€€€¥µ…•…Ñ„€ôì(€€€€€€€Ý¥‘Ñ è‘…Ñ…]¥‘Ñ °(€€€€€€€¡•¥¡Ðè‘…Ñ…!•¥¡Ð°(€€€€€€€‘…Ñ„è½™™ÍÉ••¹Ñà¹•Ñ%µ…•…Ñ„ À°€À°‘…Ñ…]¥‘Ñ °‘…Ñ…!•¥¡Ð¤¹‘…Ñ„(€€€€€ôì(€€€ô(€€€É•ÑÕÉ¸ì(€€€€€…¹Ù…Ì°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð°(€€€€€¥µ…•…Ñ„(€€€ôì(€ô(€€Í…±•	¥Ñµ…À¡Ý¥‘Ñ °¡•¥¡Ð¤ì(€€€½¹ÍÐì(€€€€€Ý¥‘Ñ è‰¥Ñµ…Á]¥‘Ñ °(€€€€€¡•¥¡Ðè‰¥Ñµ…Á!•¥¡Ð(€€€ô€ôÑ¡¥Ì¸‰¥Ñµ…Àì(€€€±•Ð¹•Ý]¥‘Ñ €ô‰¥Ñµ…Á]¥‘Ñ ì(€€€±•Ð¹•Ý!•¥¡Ð€ô‰¥Ñµ…Á!•¥¡Ðì(€€€±•Ð‰¥Ñµ…À€ôÑ¡¥Ì¸‰¥Ñµ…Àì(€€€Ý¡¥±”€¡¹•Ý]¥‘Ñ €ø€È€¨Ý¥‘Ñ ñð¹•Ý!•¥¡Ð€ø€È€¨¡•¥¡Ð¤ì(€€€€€½¹ÍÐÁÉ•Ù]¥‘Ñ €ô¹•Ý]¥‘Ñ ì(€€€€€½¹ÍÐÁÉ•Ù!•¥¡Ð€ô¹•Ý!•¥¡Ðì(€€€€€¥˜€¡¹•Ý]¥‘Ñ €ø€È€¨Ý¥‘Ñ ¤ì(€€€€€€€¹•Ý]¥‘Ñ €ô5…Ñ ¹•¥°¡¹•Ý]¥‘Ñ €¼€È¤ì(€€€€€ô(€€€€€¥˜€¡¹•Ý!•¥¡Ð€ø€È€¨¡•¥¡Ð¤ì(€€€€€€€¹•Ý!•¥¡Ð€ô5…Ñ ¹•¥°¡¹•Ý!•¥¡Ð€¼€È¤ì(€€€€€ô(€€€€€½¹ÍÐ½™™ÍÉ••¸€ô¹•Ü=™™ÍÉ••¹…¹Ù…Ì¡¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ð¤ì(€€€€€½¹ÍÐÑà€ô½™™ÍÉ••¸¹•Ñ½¹Ñ•áÐ ˆÉˆ¤ì(€€€€€Ñà¹‘É…Ý%µ…”¡‰¥Ñµ…À°€À°€À°ÁÉ•Ù]¥‘Ñ °ÁÉ•Ù!•¥¡Ð°€À°€À°¹•Ý]¥‘Ñ °¹•Ý!•¥¡Ð¤ì(€€€€€‰¥Ñµ…À€ô½™™ÍÉ••¸¹ÑÉ…¹Í™•ÉQ½%µ…•	¥Ñµ…À ¤ì(€€€ô(€€€É•ÑÕÉ¸‰¥Ñµ…Àì(€ô(€€‘É…Ý	¥Ñµ…À ¤ì(€€€½¹ÍÐmÁ…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ñt€ôÑ¡¥Ì¹Á…É•¹Ñ¥µ•¹Í¥½¹Ìì(€€€½¹ÍÐì(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ìì(€€€½¹ÍÐ½ÕÑÁÕÑM…±”€ô¹•Ü=ÕÑÁÕÑM…±” ¤ì(€€€½¹ÍÐÍ…±•‘]¥‘Ñ €ô5…Ñ ¹•¥°¡Ý¥‘Ñ €¨Á…É•¹Ñ]¥‘Ñ €¨½ÕÑÁÕÑM…±”¹Íà¤ì(€€€½¹ÍÐÍ…±•‘!•¥¡Ð€ô5…Ñ ¹•¥°¡¡•¥¡Ð€¨Á…É•¹Ñ!•¥¡Ð€¨½ÕÑÁÕÑM…±”¹Íä¤ì(€€€½¹ÍÐ…¹Ù…Ì€ôÑ¡¥Ì¸…¹Ù…Ìì(€€€¥˜€ ……¹Ù…Ìñð…¹Ù…Ì¹Ý¥‘Ñ €ôôôÍ…±•‘]¥‘Ñ €˜˜…¹Ù…Ì¹¡•¥¡Ð€ôôôÍ…±•‘!•¥¡Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€…¹Ù…Ì¹Ý¥‘Ñ €ôÍ…±•‘]¥‘Ñ ì(€€€…¹Ù…Ì¹¡•¥¡Ð€ôÍ…±•‘!•¥¡Ðì(€€€½¹ÍÐ‰¥Ñµ…À€ôÑ¡¥Ì¸¥ÍMÙœ€üÑ¡¥Ì¸‰¥Ñµ…À€èÑ¡¥Ì¸Í…±•	¥Ñµ…À¡Í…±•‘]¥‘Ñ °Í…±•‘!•¥¡Ð¤ì(€€€½¹ÍÐÑà€ô…¹Ù…Ì¹•Ñ½¹Ñ•áÐ ˆÉˆ¤ì(€€€Ñà¹™¥±Ñ•È€ôÑ¡¥Ì¹}Õ¥5…¹…•È¹¡µ¥±Ñ•Èì(€€€Ñà¹‘É…Ý%µ…”¡‰¥Ñµ…À°€À°€À°‰¥Ñµ…À¹Ý¥‘Ñ °‰¥Ñµ…À¹¡•¥¡Ð°€À°€À°Í…±•‘]¥‘Ñ °Í…±•‘!•¥¡Ð¤ì(€ô(€€Í•É¥…±¥é•	¥Ñµ…À¡Ñ½UÉ°¤ì(€€€¥˜€¡Ñ½UÉ°¤ì(€€€€€¥˜€¡Ñ¡¥Ì¸¥ÍMÙœ¤ì(€€€€€€€½¹ÍÐÕÉ°€ôÑ¡¥Ì¹}Õ¥5…¹…•È¹¥µ…•5…¹…•È¹•ÑMÙUÉ°¡Ñ¡¥Ì¸‰¥Ñµ…Á%¤ì(€€€€€€€¥˜€¡ÕÉ°¤ì(€€€€€€€€€É•ÑÕÉ¸ÕÉ°ì(€€€€€€€ô(€€€€€ô(€€€€€½¹ÍÐ…¹Ù…Ì€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰…¹Ù…Ìˆ¤ì(€€€€€€¡ì(€€€€€€€Ý¥‘Ñ è…¹Ù…Ì¹Ý¥‘Ñ °(€€€€€€€¡•¥¡Ðè…¹Ù…Ì¹¡•¥¡Ð(€€€€€ô€ôÑ¡¥Ì¸‰¥Ñµ…À¤ì(€€€€€½¹ÍÐÑà€ô…¹Ù…Ì¹•Ñ½¹Ñ•áÐ ˆÉˆ¤ì(€€€€€Ñà¹‘É…Ý%µ…”¡Ñ¡¥Ì¸‰¥Ñµ…À°€À°€À¤ì(€€€€€É•ÑÕÉ¸…¹Ù…Ì¹Ñ½…Ñ…UI0 ¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸¥ÍMÙœ¤ì(€€€€€½¹ÍÐmÁ…•]¥‘Ñ °Á…•!•¥¡Ñt€ôÑ¡¥Ì¹Á…•¥µ•¹Í¥½¹Ìì(€€€€€½¹ÍÐÝ¥‘Ñ €ô5…Ñ ¹É½Õ¹¡Ñ¡¥Ì¹Ý¥‘Ñ €¨Á…•]¥‘Ñ €¨A¥á•±ÍA•É%¹ ¹A}Q=}MM}U9%QL¤ì(€€€€€½¹ÍÐ¡•¥¡Ð€ô5…Ñ ¹É½Õ¹¡Ñ¡¥Ì¹¡•¥¡Ð€¨Á…•!•¥¡Ð€¨A¥á•±ÍA•É%¹ ¹A}Q=}MM}U9%QL¤ì(€€€€€½¹ÍÐ½™™ÍÉ••¸€ô¹•Ü=™™ÍÉ••¹…¹Ù…Ì¡Ý¥‘Ñ °¡•¥¡Ð¤ì(€€€€€½¹ÍÐÑà€ô½™™ÍÉ••¸¹•Ñ½¹Ñ•áÐ ˆÉˆ¤ì(€€€€€Ñà¹‘É…Ý%µ…”¡Ñ¡¥Ì¸‰¥Ñµ…À°€À°€À°Ñ¡¥Ì¸‰¥Ñµ…À¹Ý¥‘Ñ °Ñ¡¥Ì¸‰¥Ñµ…À¹¡•¥¡Ð°€À°€À°Ý¥‘Ñ °¡•¥¡Ð¤ì(€€€€€É•ÑÕÉ¸½™™ÍÉ••¸¹ÑÉ…¹Í™•ÉQ½%µ…•	¥Ñµ…À ¤ì(€€€ô(€€€É•ÑÕÉ¸ÍÑÉÕÑÕÉ•‘±½¹”¡Ñ¡¥Ì¸‰¥Ñµ…À¤ì(€ô(€ÍÑ…Ñ¥Œ…Íå¹Œ‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€±•Ð¥¹¥Ñ¥…±…Ñ„€ô¹Õ±°ì(€€€±•Ðµ¥ÍÍ¥¹…¹Ù…Ì€ô™…±Í”ì(€€€¥˜€¡‘…Ñ„¥¹ÍÑ…¹•½˜MÑ…µÁ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¤ì(€€€€€½¹ÍÐì(€€€€€€€‘…Ñ„èì(€€€€€€€€€É•Ð°(€€€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€€€¥°(€€€€€€€€€ÍÑÉÕÑA…É•¹Ð°(€€€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€€€É¥¡Q•áÐ°(€€€€€€€€€½¹Ñ•¹ÑÍ=‰¨°(€€€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€€€ô°(€€€€€€€½¹Ñ…¥¹•È°(€€€€€€€Á…É•¹Ðèì(€€€€€€€€€Á…”èì(€€€€€€€€€€€Á…•9Õµ‰•È(€€€€€€€€€ô(€€€€€€€ô°(€€€€€€€…¹Ù…Ì(€€€€€ô€ô‘…Ñ„ì(€€€€€±•Ð‰¥Ñµ…Á%°‰¥Ñµ…Àì(€€€€€¥˜€¡…¹Ù…Ì¤ì(€€€€€€€‘•±•Ñ”‘…Ñ„¹…¹Ù…Ìì(€€€€€€€€¡ì(€€€€€€€€€¥è‰¥Ñµ…Á%°(€€€€€€€€€‰¥Ñµ…À(€€€€€€€ô€ôÕ¥5…¹…•È¹¥µ…•5…¹…•È¹•ÑÉ½µ…¹Ù…Ì¡½¹Ñ…¥¹•È¹¥°…¹Ù…Ì¤¤ì(€€€€€€€…¹Ù…Ì¹É•µ½Ù” ¤ì(€€€€€ô•±Í”ì(€€€€€€€µ¥ÍÍ¥¹…¹Ù…Ì€ôÑÉÕ”ì(€€€€€€€‘…Ñ„¹}¡…Í9½…¹Ù…Ì€ôÑÉÕ”ì(€€€€€ô(€€€€€½¹ÍÐ…±ÑQ•áÐ€ô€¡…Ý…¥ÐÁ…É•¹Ð¹}ÍÑÉÕÑQÉ•”¹•ÑÉ¥…ÑÑÉ¥‰ÕÑ•Ì¡€‘í¹¹½Ñ…Ñ¥½¹AÉ•™¥áô‘í¥‘õ€¤¤ü¹•Ð ‰…É¥„µ±…‰•°ˆ¤ñð€ˆˆì(€€€€€¥¹¥Ñ¥…±…Ñ„€ô‘…Ñ„€ôì(€€€€€€€…¹¹½Ñ…Ñ¥½¹QåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹MQ5@°(€€€€€€€‰¥Ñµ…Á%°(€€€€€€€‰¥Ñµ…À°(€€€€€€€Á…•%¹‘•àèÁ…•9Õµ‰•È€´€Ä°(€€€€€€€É•ÐèÉ•Ð¹Í±¥” À¤°(€€€€€€€É½Ñ…Ñ¥½¸°(€€€€€€€…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%è¥°(€€€€€€€¥°(€€€€€€€‘•±•Ñ•è™…±Í”°(€€€€€€€…•ÍÍ¥‰¥±¥Ñå…Ñ„èì(€€€€€€€€€‘•½É…Ñ¥Ù”è™…±Í”°(€€€€€€€€€…±ÑQ•áÐ(€€€€€€€ô°(€€€€€€€¥ÍMÙœè™…±Í”°(€€€€€€€ÍÑÉÕÑA…É•¹Ð°(€€€€€€€Á½ÁÕÁI•˜°(€€€€€€€É¥¡Q•áÐ°(€€€€€€€½µµ•¹Ðè½¹Ñ•¹ÑÍ=‰¨ü¹ÍÑÈñð¹Õ±°°(€€€€€€€É•…Ñ¥½¹…Ñ”°(€€€€€€€µ½‘¥™¥…Ñ¥½¹…Ñ”(€€€€€ôì(€€€ô(€€€½¹ÍÐ•‘¥Ñ½È€ô…Ý…¥ÐÍÕÁ•È¹‘•Í•É¥…±¥é”¡‘…Ñ„°Á…É•¹Ð°Õ¥5…¹…•È¤ì(€€€½¹ÍÐì(€€€€€É•Ð°(€€€€€‰¥Ñµ…À°(€€€€€‰¥Ñµ…ÁUÉ°°(€€€€€‰¥Ñµ…Á%°(€€€€€¥ÍMÙœ°(€€€€€…•ÍÍ¥‰¥±¥Ñå…Ñ„(€€€ô€ô‘…Ñ„ì(€€€¥˜€¡µ¥ÍÍ¥¹…¹Ù…Ì¤ì(€€€€€Õ¥5…¹…•È¹…‘‘5¥ÍÍ¥¹…¹Ù…Ì¡‘…Ñ„¹¥°•‘¥Ñ½È¤ì(€€€€€•‘¥Ñ½È¸µ¥ÍÍ¥¹…¹Ù…Ì€ôÑÉÕ”ì(€€€ô•±Í”¥˜€¡‰¥Ñµ…Á%€˜˜Õ¥5…¹…•È¹¥µ…•5…¹…•È¹¥ÍY…±¥‘%¡‰¥Ñµ…Á%¤¤ì(€€€€€•‘¥Ñ½È¸‰¥Ñµ…Á%€ô‰¥Ñµ…Á%ì(€€€€€¥˜€¡‰¥Ñµ…À¤ì(€€€€€€€•‘¥Ñ½È¸‰¥Ñµ…À€ô‰¥Ñµ…Àì(€€€€€ô(€€€ô•±Í”ì(€€€€€•‘¥Ñ½È¸‰¥Ñµ…ÁUÉ°€ô‰¥Ñµ…ÁUÉ°ì(€€€ô(€€€•‘¥Ñ½È¸¥ÍMÙœ€ô¥ÍMÙœì(€€€½¹ÍÐmÁ…É•¹Ñ]¥‘Ñ °Á…É•¹Ñ!•¥¡Ñt€ô•‘¥Ñ½È¹Á…•¥µ•¹Í¥½¹Ìì(€€€•‘¥Ñ½È¹Ý¥‘Ñ €ô€¡É•ÑlÉt€´É•ÑlÁt¤€¼Á…É•¹Ñ]¥‘Ñ ì(€€€•‘¥Ñ½È¹¡•¥¡Ð€ô€¡É•ÑlÍt€´É•ÑlÅt¤€¼Á…É•¹Ñ!•¥¡Ðì(€€€¥˜€¡…•ÍÍ¥‰¥±¥Ñå…Ñ„¤ì(€€€€€•‘¥Ñ½È¹…±ÑQ•áÑ…Ñ„€ô…•ÍÍ¥‰¥±¥Ñå…Ñ„ì(€€€ô(€€€•‘¥Ñ½È¹}¥¹¥Ñ¥…±…Ñ„€ô¥¹¥Ñ¥…±…Ñ„ì(€€€¥˜€¡‘…Ñ„¹½µµ•¹Ð¤ì(€€€€€•‘¥Ñ½È¹Í•Ñ½µµ•¹Ñ…Ñ„¡‘…Ñ„¤ì(€€€ô(€€€•‘¥Ñ½È¸¡…Í	••¹‘‘•‘%¹U¹‘½MÑ…¬€ô€„…¥¹¥Ñ¥…±…Ñ„ì(€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€ô(€Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ€ô™…±Í”°½¹Ñ•áÐ€ô¹Õ±°¤ì(€€€¥˜€¡Ñ¡¥Ì¹¥ÍµÁÑä ¤¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹‘•±•Ñ•¤ì(€€€€€É•ÑÕÉ¸Ñ¡¥Ì¹Í•É¥…±¥é••±•Ñ• ¤ì(€€€ô(€€€½¹ÍÐÍ•É¥…±¥é•€ô=‰©•Ð¹…ÍÍ¥¸¡ÍÕÁ•È¹Í•É¥…±¥é”¡¥Í½É½Áå¥¹œ¤°ì(€€€€€‰¥Ñµ…Á%èÑ¡¥Ì¸‰¥Ñµ…Á%°(€€€€€¥ÍMÙœèÑ¡¥Ì¸¥ÍMÙœ(€€€ô¤ì(€€€Ñ¡¥Ì¹…‘‘½µµ•¹Ð¡Í•É¥…±¥é•¤ì(€€€¥˜€¡¥Í½É½Áå¥¹œ¤ì(€€€€€Í•É¥…±¥é•¹‰¥Ñµ…ÁUÉ°€ôÑ¡¥Ì¸Í•É¥…±¥é•	¥Ñµ…À¡ÑÉÕ”¤ì(€€€€€Í•É¥…±¥é•¹…•ÍÍ¥‰¥±¥Ñå…Ñ„€ôÑ¡¥Ì¹Í•É¥…±¥é•±ÑQ•áÐ¡ÑÉÕ”¤ì(€€€€€Í•É¥…±¥é•¹¥Í½Áä€ôÑÉÕ”ì(€€€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€€€ô(€€€½¹ÍÐì(€€€€€‘•½É…Ñ¥Ù”°(€€€€€…±ÑQ•áÐ(€€€ô€ôÑ¡¥Ì¹Í•É¥…±¥é•±ÑQ•áÐ¡™…±Í”¤ì(€€€¥˜€ …‘•½É…Ñ¥Ù”€˜˜…±ÑQ•áÐ¤ì(€€€€€Í•É¥…±¥é•¹…•ÍÍ¥‰¥±¥Ñå…Ñ„€ôì(€€€€€€€ÑåÁ”è€‰¥ÕÉ”ˆ°(€€€€€€€…±Ðè…±ÑQ•áÐ(€€€€€ôì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€½¹ÍÐ¡…¹•Ì€ôÑ¡¥Ì¸¡…Í±•µ•¹Ñ¡…¹•¡Í•É¥…±¥é•¤ì(€€€€€¥˜€¡¡…¹•Ì¹¥ÍM…µ”¤ì(€€€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€€€ô(€€€€€¥˜€¡¡…¹•Ì¹¥ÍM…µ•±ÑQ•áÐ¤ì(€€€€€€€‘•±•Ñ”Í•É¥…±¥é•¹…•ÍÍ¥‰¥±¥Ñå…Ñ„ì(€€€€€ô•±Í”ì(€€€€€€€Í•É¥…±¥é•¹…•ÍÍ¥‰¥±¥Ñå…Ñ„¹ÍÑÉÕÑA…É•¹Ð€ôÑ¡¥Ì¹}¥¹¥Ñ¥…±…Ñ„¹ÍÑÉÕÑA…É•¹Ð€üü€´Äì(€€€€€ô(€€€€€Í•É¥…±¥é•¹¥€ôÑ¡¥Ì¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%ì(€€€€€‘•±•Ñ”Í•É¥…±¥é•¹‰¥Ñµ…Á%ì(€€€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€€€ô(€€€¥˜€¡½¹Ñ•áÐ€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€€€ô(€€€½¹Ñ•áÐ¹ÍÑ…µÁÌñðô¹•Ü5…À ¤ì(€€€½¹ÍÐ…É•„€ôÑ¡¥Ì¸¥ÍMÙœ€ü€¡Í•É¥…±¥é•¹É•ÑlÉt€´Í•É¥…±¥é•¹É•ÑlÁt¤€¨€¡Í•É¥…±¥é•¹É•ÑlÍt€´Í•É¥…±¥é•¹É•ÑlÅt¤€è¹Õ±°ì(€€€¥˜€ …½¹Ñ•áÐ¹ÍÑ…µÁÌ¹¡…Ì¡Ñ¡¥Ì¸‰¥Ñµ…Á%¤¤ì(€€€€€½¹Ñ•áÐ¹ÍÑ…µÁÌ¹Í•Ð¡Ñ¡¥Ì¸‰¥Ñµ…Á%°ì(€€€€€€€…É•„°(€€€€€€€Í•É¥…±¥é•(€€€€€ô¤ì(€€€€€Í•É¥…±¥é•¹‰¥Ñµ…À€ôÑ¡¥Ì¸Í•É¥…±¥é•	¥Ñµ…À¡™…±Í”¤ì(€€€ô•±Í”¥˜€¡Ñ¡¥Ì¸¥ÍMÙœ¤ì(€€€€€½¹ÍÐÁÉ•Ù…Ñ„€ô½¹Ñ•áÐ¹ÍÑ…µÁÌ¹•Ð¡Ñ¡¥Ì¸‰¥Ñµ…Á%¤ì(€€€€€¥˜€¡…É•„€øÁÉ•Ù…Ñ„¹…É•„¤ì(€€€€€€€ÁÉ•Ù…Ñ„¹…É•„€ô…É•„ì(€€€€€€€ÁÉ•Ù…Ñ„¹Í•É¥…±¥é•¹‰¥Ñµ…À¹±½Í” ¤ì(€€€€€€€ÁÉ•Ù…Ñ„¹Í•É¥…±¥é•¹‰¥Ñµ…À€ôÑ¡¥Ì¸Í•É¥…±¥é•	¥Ñµ…À¡™…±Í”¤ì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸Í•É¥…±¥é•ì(€ô(€€¡…Í±•µ•¹Ñ¡…¹•¡Í•É¥…±¥é•¤ì(€€€½¹ÍÐì(€€€€€Á…•%¹‘•à°(€€€€€…•ÍÍ¥‰¥±¥Ñå…Ñ„èì(€€€€€€€…±ÑQ•áÐ(€€€€€ô(€€€ô€ôÑ¡¥Ì¹}¥¹¥Ñ¥…±…Ñ„ì(€€€½¹ÍÐ¥ÍM…µ•A…•%¹‘•à€ôÍ•É¥…±¥é•¹Á…•%¹‘•à€ôôôÁ…•%¹‘•àì(€€€½¹ÍÐ¥ÍM…µ•±ÑQ•áÐ€ô€¡Í•É¥…±¥é•¹…•ÍÍ¥‰¥±¥Ñå…Ñ„ü¹…±Ðñð€ˆˆ¤€ôôô…±ÑQ•áÐì(€€€É•ÑÕÉ¸ì(€€€€€¥ÍM…µ”è€…Ñ¡¥Ì¹¡…Í‘¥Ñ•‘½µµ•¹Ð€˜˜€…Ñ¡¥Ì¹}¡…Í	••¹5½Ù•€˜˜€…Ñ¡¥Ì¹}¡…Í	••¹I•Í¥é•€˜˜¥ÍM…µ•A…•%¹‘•à€˜˜¥ÍM…µ•±ÑQ•áÐ°(€€€€€¥ÍM…µ•±ÑQ•áÐ(€€€ôì(€ô(€É•¹‘•É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¸¤ì(€€€¥˜€¡Ñ¡¥Ì¹‘•±•Ñ•¤ì(€€€€€…¹¹½Ñ…Ñ¥½¸¹¡¥‘” ¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€…¹¹½Ñ…Ñ¥½¸¹ÕÁ‘…Ñ•‘¥Ñ•¡ì(€€€€€É•ÐèÑ¡¥Ì¹•ÑAI•Ð ¤°(€€€€€Á½ÁÕÀèÑ¡¥Ì¹½µµ•¹Ð(€€€ô¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½•‘¥Ñ½È½…¹¹½Ñ…Ñ¥½¹}•‘¥Ñ½É}±…å•È¹©Ì(((((((()±…ÍÌ¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•Èì(€€…•ÍÍ¥‰¥±¥Ñå5…¹…•Èì(€€…±±½Ý±¥¬€ô™…±Í”ì(€€…¹¹½Ñ…Ñ¥½¹1…å•È€ô¹Õ±°ì(€€±¥­€ô¹Õ±°ì(€€•‘¥Ñ½É½ÕÍQ¥µ•½ÕÑ%€ô¹Õ±°ì(€€•‘¥Ñ½ÉÌ€ô¹•Ü5…À ¤ì(€€¡…‘A½¥¹Ñ•É½Ý¸€ô™…±Í”ì(€€¥Í¥Í…‰±¥¹œ€ô™…±Í”ì(€€¥Í¹…‰±¥¹œ€ô™…±Í”ì(€€‘É…Ý¥¹€ô¹Õ±°ì(€€™½ÕÍ•‘±•µ•¹Ð€ô¹Õ±°ì(€€Ñ•áÑ1…å•È€ô¹Õ±°ì(€€Ñ•áÑM•±•Ñ¥½¹€ô¹Õ±°ì(€€Ñ•áÑ1…å•É‰±±¥­€ô¹Õ±°ì(€€±…ÍÑA½¥¹Ñ•É½Ý¹Q¥µ•ÍÑ…µÀ€ô€´Äì(€€Õ¥5…¹…•Èì(€ÍÑ…Ñ¥Œ}¥¹¥Ñ¥…±¥é•€ô™…±Í”ì(€ÍÑ…Ñ¥Œ€•‘¥Ñ½ÉQåÁ•Ì€ô¹•Ü5…À¡mÉ••Q•áÑ‘¥Ñ½È°%¹­‘¥Ñ½È°MÑ…µÁ‘¥Ñ½È°!¥¡±¥¡Ñ‘¥Ñ½È°M¥¹…ÑÕÉ•‘¥Ñ½Ét¹µ…À¡ÑåÁ”€ôømÑåÁ”¹}•‘¥Ñ½ÉQåÁ”°ÑåÁ•t¤¤ì(€½¹ÍÑÉÕÑ½È¡ì(€€€Õ¥5…¹…•È°(€€€Á…•%¹‘•à°(€€€‘¥Ø°(€€€ÍÑÉÕÑQÉ••1…å•È°(€€€…•ÍÍ¥‰¥±¥Ñå5…¹…•È°(€€€…¹¹½Ñ…Ñ¥½¹1…å•È°(€€€‘É…Ý1…å•È°(€€€Ñ•áÑ1…å•È°(€€€Ù¥•ÝÁ½ÉÐ°(€€€°ÄÁ¸(€ô¤ì(€€€½¹ÍÐ•‘¥Ñ½ÉQåÁ•Ì€ôl¸¸¹¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È¸•‘¥Ñ½ÉQåÁ•Ì¹Ù…±Õ•Ì ¥tì(€€€¥˜€ …¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È¹}¥¹¥Ñ¥…±¥é•¤ì(€€€€€¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È¹}¥¹¥Ñ¥…±¥é•€ôÑÉÕ”ì(€€€€€™½È€¡½¹ÍÐ•‘¥Ñ½ÉQåÁ”½˜•‘¥Ñ½ÉQåÁ•Ì¤ì(€€€€€€€•‘¥Ñ½ÉQåÁ”¹¥¹¥Ñ¥…±¥é”¡°ÄÁ¸°Õ¥5…¹…•È¤ì(€€€€€ô(€€€ô(€€€Õ¥5…¹…•È¹É•¥ÍÑ•É‘¥Ñ½ÉQåÁ•Ì¡•‘¥Ñ½ÉQåÁ•Ì¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È€ôÕ¥5…¹…•Èì(€€€Ñ¡¥Ì¹Á…•%¹‘•à€ôÁ…•%¹‘•àì(€€€Ñ¡¥Ì¹‘¥Ø€ô‘¥Øì(€€€Ñ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•È€ô…•ÍÍ¥‰¥±¥Ñå5…¹…•Èì(€€€Ñ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹1…å•È€ô…¹¹½Ñ…Ñ¥½¹1…å•Èì(€€€Ñ¡¥Ì¹Ù¥•ÝÁ½ÉÐ€ôÙ¥•ÝÁ½ÉÐì(€€€Ñ¡¥Ì¸Ñ•áÑ1…å•È€ôÑ•áÑ1…å•Èì(€€€Ñ¡¥Ì¹‘É…Ý1…å•È€ô‘É…Ý1…å•Èì(€€€Ñ¡¥Ì¹}ÍÑÉÕÑQÉ•”€ôÍÑÉÕÑQÉ••1…å•Èì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹…‘‘1…å•È¡Ñ¡¥Ì¤ì(€ô(€•Ð¥ÍµÁÑä ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹Í¥é”€ôôô€Àì(€ô(€•Ð¥Í%¹Ù¥Í¥‰±” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹¥ÍµÁÑä€˜˜Ñ¡¥Ì¸Õ¥5…¹…•È¹•Ñ5½‘” ¤€ôôô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹9=9ì(€ô(€ÕÁ‘…Ñ•Q½½±‰…È¡½ÁÑ¥½¹Ì¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹ÕÁ‘…Ñ•Q½½±‰…È¡½ÁÑ¥½¹Ì¤ì(€ô(€ÕÁ‘…Ñ•5½‘”¡µ½‘”€ôÑ¡¥Ì¸Õ¥5…¹…•È¹•Ñ5½‘” ¤¤ì(€€€Ñ¡¥Ì¸±•…¹ÕÀ ¤ì(€€€ÍÝ¥Ñ €¡µ½‘”¤ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹9=9è(€€€€€€€Ñ¡¥Ì¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰¹½¹‘¥Ñ¥¹œˆ°ÑÉÕ”¤ì(€€€€€€€Ñ¡¥Ì¹‘¥Í…‰±•Q•áÑM•±•Ñ¥½¸ ¤ì(€€€€€€€Ñ¡¥Ì¹Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡™…±Í”¤ì(€€€€€€€Ñ¡¥Ì¹Ñ½±•¹¹½Ñ…Ñ¥½¹1…å•ÉA½¥¹Ñ•ÉÙ•¹ÑÌ¡ÑÉÕ”¤ì(€€€€€€€Ñ¡¥Ì¹‘¥Í…‰±•±¥¬ ¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹%9,è(€€€€€€€Ñ¡¥Ì¹‘¥Í…‰±•Q•áÑM•±•Ñ¥½¸ ¤ì(€€€€€€€Ñ¡¥Ì¹Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡ÑÉÕ”¤ì(€€€€€€€Ñ¡¥Ì¹•¹…‰±•±¥¬ ¤ì(€€€€€€€‰É•…¬ì(€€€€€…Í”¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹!%!1%!Pè(€€€€€€€Ñ¡¥Ì¹•¹…‰±•Q•áÑM•±•Ñ¥½¸ ¤ì(€€€€€€€Ñ¡¥Ì¹Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡™…±Í”¤ì(€€€€€€€Ñ¡¥Ì¹‘¥Í…‰±•±¥¬ ¤ì(€€€€€€€‰É•…¬ì(€€€€€‘•™…Õ±Ðè(€€€€€€€Ñ¡¥Ì¹‘¥Í…‰±•Q•áÑM•±•Ñ¥½¸ ¤ì(€€€€€€€Ñ¡¥Ì¹Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡ÑÉÕ”¤ì(€€€€€€€Ñ¡¥Ì¹•¹…‰±•±¥¬ ¤ì(€€€ô(€€€Ñ¡¥Ì¹Ñ½±•¹¹½Ñ…Ñ¥½¹1…å•ÉA½¥¹Ñ•ÉÙ•¹ÑÌ¡™…±Í”¤ì(€€€½¹ÍÐì(€€€€€±…ÍÍ1¥ÍÐ(€€€ô€ôÑ¡¥Ì¹‘¥Øì(€€€±…ÍÍ1¥ÍÐ¹Ñ½±” ‰¹½¹‘¥Ñ¥¹œˆ°™…±Í”¤ì(€€€¥˜€¡µ½‘”€ôôô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹A=AU@¤ì(€€€€€±…ÍÍ1¥ÍÐ¹Ñ½±” ‰½µµ•¹Ñ‘¥Ñ¥¹œˆ°ÑÉÕ”¤ì(€€€ô•±Í”ì(€€€€€±…ÍÍ1¥ÍÐ¹Ñ½±” ‰½µµ•¹Ñ‘¥Ñ¥¹œˆ°™…±Í”¤ì(€€€€€™½È€¡½¹ÍÐ•‘¥Ñ½ÉQåÁ”½˜¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È¸•‘¥Ñ½ÉQåÁ•Ì¹Ù…±Õ•Ì ¤¤ì(€€€€€€€±…ÍÍ1¥ÍÐ¹Ñ½±”¡€‘í•‘¥Ñ½ÉQåÁ”¹}ÑåÁ•õ‘¥Ñ¥¹€°µ½‘”€ôôô•‘¥Ñ½ÉQåÁ”¹}•‘¥Ñ½ÉQåÁ”¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¹‘¥Ø¹¡¥‘‘•¸€ô™…±Í”ì(€ô(€¡…ÍQ•áÑ1…å•È¡Ñ•áÑ1…å•È¤ì(€€€É•ÑÕÉ¸Ñ•áÑ1…å•È€ôôôÑ¡¥Ì¸Ñ•áÑ1…å•Èü¹‘¥Øì(€ô(€Í•Ñ‘¥Ñ¥¹MÑ…Ñ”¡¥Í‘¥Ñ¥¹œ¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Í•Ñ‘¥Ñ¥¹MÑ…Ñ”¡¥Í‘¥Ñ¥¹œ¤ì(€ô(€…‘‘½µµ…¹‘Ì¡Á…É…µÌ¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹…‘‘½µµ…¹‘Ì¡Á…É…µÌ¤ì(€ô(€±•…¹U¹‘½MÑ…¬¡ÑåÁ”¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹±•…¹U¹‘½MÑ…¬¡ÑåÁ”¤ì(€ô(€Ñ½±•É…Ý¥¹œ¡•¹…‰±•€ô™…±Í”¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰‘É…Ý¥¹œˆ°€…•¹…‰±•¤ì(€ô(€Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡•¹…‰±•€ô™…±Í”¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰‘¥Í…‰±•ˆ°€…•¹…‰±•¤ì(€ô(€Ñ½±•¹¹½Ñ…Ñ¥½¹1…å•ÉA½¥¹Ñ•ÉÙ•¹ÑÌ¡•¹…‰±•€ô™…±Í”¤ì(€€€Ñ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹1…å•Èü¹Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡•¹…‰±•¤ì(€ô(€•Ð€…±±‘¥Ñ½ÉÍ%Ñ•É…Ñ½È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹Í¥é”€„ôô€À€üÑ¡¥Ì¸•‘¥Ñ½ÉÌ¹Ù…±Õ•Ì ¤€èÑ¡¥Ì¸Õ¥5…¹…•È¹•Ñ‘¥Ñ½ÉÌ¡Ñ¡¥Ì¹Á…•%¹‘•à¤ì(€ô(€…Íå¹Œ•¹…‰±” ¤ì(€€€Ñ¡¥Ì¸¥Í¹…‰±¥¹œ€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹‘¥Ø¹Ñ…‰%¹‘•à€ô€Àì(€€€Ñ¡¥Ì¹Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡ÑÉÕ”¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰¹½¹‘¥Ñ¥¹œˆ°™…±Í”¤ì(€€€Ñ¡¥Ì¸Ñ•áÑ1…å•É‰±±¥­ü¹…‰½ÉÐ ¤ì(€€€Ñ¡¥Ì¸Ñ•áÑ1…å•É‰±±¥­€ô¹Õ±°ì(€€€½¹ÍÐ…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%‘Ì€ô¹•ÜM•Ð ¤ì(€€€™½È€¡½¹ÍÐ•‘¥Ñ½È½˜Ñ¡¥Ì¸…±±‘¥Ñ½ÉÍ%Ñ•É…Ñ½È¤ì(€€€€€•‘¥Ñ½È¹•¹…‰±•‘¥Ñ¥¹œ ¤ì(€€€€€•‘¥Ñ½È¹Í¡½Ü¡ÑÉÕ”¤ì(€€€€€¥˜€¡•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹É•µ½Ù•¡…¹•‘á¥ÍÑ¥¹¹¹½Ñ…Ñ¥½¸¡•‘¥Ñ½È¤ì(€€€€€€€…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%‘Ì¹…‘¡•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€ô(€€€ô(€€€½¹ÍÐ…¹¹½Ñ…Ñ¥½¹1…å•È€ôÑ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹1…å•Èì(€€€¥˜€¡…¹¹½Ñ…Ñ¥½¹1…å•È¤ì(€€€€€™½È€¡½¹ÍÐ•‘¥Ñ…‰±”½˜…¹¹½Ñ…Ñ¥½¹1…å•È¹•Ñ‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì ¤¤ì(€€€€€€€•‘¥Ñ…‰±”¹¡¥‘” ¤ì(€€€€€€€¥˜€¡Ñ¡¥Ì¸Õ¥5…¹…•È¹¥Í•±•Ñ•‘¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡•‘¥Ñ…‰±”¹‘…Ñ„¹¥¤¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€¥˜€¡…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%‘Ì¹¡…Ì¡•‘¥Ñ…‰±”¹‘…Ñ„¹¥¤¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€½¹ÍÐ•‘¥Ñ½È€ô…Ý…¥ÐÑ¡¥Ì¹‘•Í•É¥…±¥é”¡•‘¥Ñ…‰±”¤ì(€€€€€€€¥˜€ …•‘¥Ñ½È¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¹…‘‘=ÉI•‰Õ¥±¡•‘¥Ñ½È¤ì(€€€€€€€•‘¥Ñ½È¹•¹…‰±•‘¥Ñ¥¹œ ¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¸¥Í¹…‰±¥¹œ€ô™…±Í”ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹}•Ù•¹Ñ	ÕÌ¹‘¥ÍÁ…Ñ  ‰•‘¥Ñ½ÉÍÉ•¹‘•É•ˆ°ì(€€€€€Í½ÕÉ”èÑ¡¥Ì°(€€€€€Á…•9Õµ‰•ÈèÑ¡¥Ì¹Á…•%¹‘•à€¬€Ä(€€€ô¤ì(€ô(€‘¥Í…‰±” ¤ì(€€€Ñ¡¥Ì¸¥Í¥Í…‰±¥¹œ€ôÑÉÕ”ì(€€€Ñ¡¥Ì¹‘¥Ø¹Ñ…‰%¹‘•à€ô€´Äì(€€€Ñ¡¥Ì¹Ñ½±•A½¥¹Ñ•ÉÙ•¹ÑÌ¡™…±Í”¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹Ñ½±” ‰¹½¹‘¥Ñ¥¹œˆ°ÑÉÕ”¤ì(€€€¥˜€¡Ñ¡¥Ì¸Ñ•áÑ1…å•È€˜˜€…Ñ¡¥Ì¸Ñ•áÑ1…å•É‰±±¥­¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•É‰±±¥­€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€€€½¹ÍÐÍ¥¹…°€ôÑ¡¥Ì¸Õ¥5…¹…•È¹½µ‰¥¹•‘M¥¹…°¡Ñ¡¥Ì¸Ñ•áÑ1…å•É‰±±¥­¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•È¹‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É‘½Ý¸ˆ°”€ôøì(€€€€€€€½¹ÍÐ	1}1%-}Q!IM!=1€ô€ÔÀÀì(€€€€€€€½¹ÍÐì(€€€€€€€€€±¥•¹Ñ`°(€€€€€€€€€±¥•¹Ñd°(€€€€€€€€€Ñ¥µ•MÑ…µÀ(€€€€€€€ô€ô”ì(€€€€€€€½¹ÍÐ±…ÍÑA½¥¹Ñ•É½Ý¹Q¥µ•ÍÑ…µÀ€ôÑ¡¥Ì¸±…ÍÑA½¥¹Ñ•É½Ý¹Q¥µ•ÍÑ…µÀì(€€€€€€€¥˜€¡Ñ¥µ•MÑ…µÀ€´±…ÍÑA½¥¹Ñ•É½Ý¹Q¥µ•ÍÑ…µÀ€ø	1}1%-}Q!IM!=1¤ì(€€€€€€€€€Ñ¡¥Ì¸±…ÍÑA½¥¹Ñ•É½Ý¹Q¥µ•ÍÑ…µÀ€ôÑ¥µ•MÑ…µÀì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¸±…ÍÑA½¥¹Ñ•É½Ý¹Q¥µ•ÍÑ…µÀ€ô€´Äì(€€€€€€€½¹ÍÐì(€€€€€€€€€±…ÍÍ1¥ÍÐ(€€€€€€€ô€ôÑ¡¥Ì¹‘¥Øì(€€€€€€€±…ÍÍ1¥ÍÐ¹Ñ½±” ‰•Ñ±•µ•¹ÑÌˆ°ÑÉÕ”¤ì(€€€€€€€½¹ÍÐ•±•µ•¹ÑÌ€ô‘½Õµ•¹Ð¹•±•µ•¹ÑÍÉ½µA½¥¹Ð¡±¥•¹Ñ`°±¥•¹Ñd¤ì(€€€€€€€±…ÍÍ1¥ÍÐ¹Ñ½±” ‰•Ñ±•µ•¹ÑÌˆ°™…±Í”¤ì(€€€€€€€¥˜€ …Ñ¡¥Ì¹‘¥Ø¹½¹Ñ…¥¹Ì¡•±•µ•¹ÑÍlÁt¤¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€±•Ð¥ì(€€€€€€€½¹ÍÐÉ••à€ô¹•ÜI•áÀ¡x‘í¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉAÉ•™¥áõlÀ´åt¬‘€¤ì(€€€€€€€™½È€¡½¹ÍÐ•±•µ•¹Ð½˜•±•µ•¹ÑÌ¤ì(€€€€€€€€€¥˜€¡É••à¹Ñ•ÍÐ¡•±•µ•¹Ð¹¥¤¤ì(€€€€€€€€€€€¥€ô•±•µ•¹Ð¹¥ì(€€€€€€€€€€€‰É•…¬ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€€€¥˜€ …¥¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€½¹ÍÐ•‘¥Ñ½È€ôÑ¡¥Ì¸•‘¥Ñ½ÉÌ¹•Ð¡¥¤ì(€€€€€€€¥˜€¡•‘¥Ñ½Èü¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%€ôôô¹Õ±°¤ì(€€€€€€€€€ÍÑ½ÁÙ•¹Ð¡”¤ì(€€€€€€€€€•‘¥Ñ½È¹‘‰±±¥¬¡”¤ì(€€€€€€€ô(€€€€€ô°ì(€€€€€€€Í¥¹…°°(€€€€€€€…ÁÑÕÉ”èÑÉÕ”(€€€€€ô¤ì(€€€ô(€€€½¹ÍÐ…¹¹½Ñ…Ñ¥½¹1…å•È€ôÑ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹1…å•Èì(€€€½¹ÍÐ¹••‘…­•¹¹½Ñ…Ñ¥½¸€ômtì(€€€¥˜€¡…¹¹½Ñ…Ñ¥½¹1…å•È¤ì(€€€€€½¹ÍÐ¡…¹•‘¹¹½Ñ…Ñ¥½¹Ì€ô¹•Ü5…À ¤ì(€€€€€½¹ÍÐÉ•Í•Ñ¹¹½Ñ…Ñ¥½¹Ì€ô¹•Ü5…À ¤ì(€€€€€™½È€¡½¹ÍÐ•‘¥Ñ½È½˜Ñ¡¥Ì¸…±±‘¥Ñ½ÉÍ%Ñ•É…Ñ½È¤ì(€€€€€€€•‘¥Ñ½È¹‘¥Í…‰±•‘¥Ñ¥¹œ ¤ì(€€€€€€€¥˜€ …•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€€€€€¹••‘…­•¹¹½Ñ…Ñ¥½¸¹ÁÕÍ ¡•‘¥Ñ½È¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€¥˜€¡•‘¥Ñ½È¹Í•É¥…±¥é” ¤€„ôô¹Õ±°¤ì(€€€€€€€€€¡…¹•‘¹¹½Ñ…Ñ¥½¹Ì¹Í•Ð¡•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%°•‘¥Ñ½È¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô•±Í”ì(€€€€€€€€€É•Í•Ñ¹¹½Ñ…Ñ¥½¹Ì¹Í•Ð¡•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%°•‘¥Ñ½È¤ì(€€€€€€€ô(€€€€€€€Ñ¡¥Ì¹•Ñ‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸¡•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ü¹Í¡½Ü ¤ì(€€€€€€€•‘¥Ñ½È¹É•µ½Ù” ¤ì(€€€€€ô(€€€€€™½È€¡½¹ÍÐ•‘¥Ñ…‰±”½˜…¹¹½Ñ…Ñ¥½¹1…å•È¹•Ñ‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¹Ì ¤¤ì(€€€€€€€½¹ÍÐì(€€€€€€€€€¥(€€€€€€€ô€ô•‘¥Ñ…‰±”¹‘…Ñ„ì(€€€€€€€¥˜€¡Ñ¡¥Ì¸Õ¥5…¹…•È¹¥Í•±•Ñ•‘¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡¥¤¤ì(€€€€€€€€€•‘¥Ñ…‰±”¹ÕÁ‘…Ñ•‘¥Ñ•¡ì(€€€€€€€€€€€‘•±•Ñ•èÑÉÕ”(€€€€€€€€€ô¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€±•Ð•‘¥Ñ½È€ôÉ•Í•Ñ¹¹½Ñ…Ñ¥½¹Ì¹•Ð¡¥¤ì(€€€€€€€¥˜€¡•‘¥Ñ½È¤ì(€€€€€€€€€•‘¥Ñ½È¹É•Í•Ñ¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡•‘¥Ñ…‰±”¤ì(€€€€€€€€€•‘¥Ñ½È¹Í¡½Ü¡™…±Í”¤ì(€€€€€€€€€•‘¥Ñ…‰±”¹Í¡½Ü ¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€•‘¥Ñ½È€ô¡…¹•‘¹¹½Ñ…Ñ¥½¹Ì¹•Ð¡¥¤ì(€€€€€€€¥˜€¡•‘¥Ñ½È¤ì(€€€€€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹…‘‘¡…¹•‘á¥ÍÑ¥¹¹¹½Ñ…Ñ¥½¸¡•‘¥Ñ½È¤ì(€€€€€€€€€¥˜€¡•‘¥Ñ½È¹É•¹‘•É¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡•‘¥Ñ…‰±”¤¤ì(€€€€€€€€€€€•‘¥Ñ½È¹Í¡½Ü¡™…±Í”¤ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€€€•‘¥Ñ…‰±”¹Í¡½Ü ¤ì(€€€€€ô(€€€ô(€€€Ñ¡¥Ì¸±•…¹ÕÀ ¤ì(€€€¥˜€¡Ñ¡¥Ì¹¥ÍµÁÑä¤ì(€€€€€Ñ¡¥Ì¹‘¥Ø¹¡¥‘‘•¸€ôÑÉÕ”ì(€€€ô(€€€½¹ÍÐì(€€€€€±…ÍÍ1¥ÍÐ(€€€ô€ôÑ¡¥Ì¹‘¥Øì(€€€™½È€¡½¹ÍÐ•‘¥Ñ½ÉQåÁ”½˜¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È¸•‘¥Ñ½ÉQåÁ•Ì¹Ù…±Õ•Ì ¤¤ì(€€€€€±…ÍÍ1¥ÍÐ¹É•µ½Ù”¡€‘í•‘¥Ñ½ÉQåÁ”¹}ÑåÁ•õ‘¥Ñ¥¹€¤ì(€€€ô(€€€Ñ¡¥Ì¹‘¥Í…‰±•Q•áÑM•±•Ñ¥½¸ ¤ì(€€€Ñ¡¥Ì¹Ñ½±•¹¹½Ñ…Ñ¥½¹1…å•ÉA½¥¹Ñ•ÉÙ•¹ÑÌ¡ÑÉÕ”¤ì(€€€…¹¹½Ñ…Ñ¥½¹1…å•Èü¹ÕÁ‘…Ñ•…­•¹¹½Ñ…Ñ¥½¹Ì¡¹••‘…­•¹¹½Ñ…Ñ¥½¸¤ì(€€€Ñ¡¥Ì¸¥Í¥Í…‰±¥¹œ€ô™…±Í”ì(€ô(€•Ñ‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸¡¥¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸…¹¹½Ñ…Ñ¥½¹1…å•Èü¹•Ñ‘¥Ñ…‰±•¹¹½Ñ…Ñ¥½¸¡¥¤ñð¹Õ±°ì(€ô(€Í•ÑÑ¥Ù•‘¥Ñ½È¡•‘¥Ñ½È¤ì(€€€½¹ÍÐÕÉÉ•¹ÑÑ¥Ù”€ôÑ¡¥Ì¸Õ¥5…¹…•È¹•ÑÑ¥Ù” ¤ì(€€€¥˜€¡ÕÉÉ•¹ÑÑ¥Ù”€ôôô•‘¥Ñ½È¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Í•ÑÑ¥Ù•‘¥Ñ½È¡•‘¥Ñ½È¤ì(€ô(€•¹…‰±•Q•áÑM•±•Ñ¥½¸ ¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹Ñ…‰%¹‘•à€ô€´Äì(€€€¥˜€¡Ñ¡¥Ì¸Ñ•áÑ1…å•Èü¹‘¥Ø€˜˜€…Ñ¡¥Ì¸Ñ•áÑM•±•Ñ¥½¹¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑM•±•Ñ¥½¹€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€€€½¹ÍÐÍ¥¹…°€ôÑ¡¥Ì¸Õ¥5…¹…•È¹½µ‰¥¹•‘M¥¹…°¡Ñ¡¥Ì¸Ñ•áÑM•±•Ñ¥½¹¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•È¹‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É‘½Ý¸ˆ°Ñ¡¥Ì¸Ñ•áÑ1…å•ÉA½¥¹Ñ•É½Ý¸¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€€€Í¥¹…°(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•È¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹…‘ ‰¡¥¡±¥¡Ñ¥¹œˆ¤ì(€€€ô(€ô(€‘¥Í…‰±•Q•áÑM•±•Ñ¥½¸ ¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹Ñ…‰%¹‘•à€ô€Àì(€€€¥˜€¡Ñ¡¥Ì¸Ñ•áÑ1…å•Èü¹‘¥Ø€˜˜Ñ¡¥Ì¸Ñ•áÑM•±•Ñ¥½¹¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑM•±•Ñ¥½¹¹…‰½ÉÐ ¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑM•±•Ñ¥½¹€ô¹Õ±°ì(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•È¹‘¥Ø¹±…ÍÍ1¥ÍÐ¹É•µ½Ù” ‰¡¥¡±¥¡Ñ¥¹œˆ¤ì(€€€ô(€ô(€€Ñ•áÑ1…å•ÉA½¥¹Ñ•É½Ý¸¡•Ù•¹Ð¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Õ¹Í•±•Ñ±° ¤ì(€€€½¹ÍÐì(€€€€€Ñ…É•Ð(€€€ô€ô•Ù•¹Ðì(€€€¥˜€¡Ñ…É•Ð€ôôôÑ¡¥Ì¸Ñ•áÑ1…å•È¹‘¥Øñð€¡Ñ…É•Ð¹•ÑÑÑÉ¥‰ÕÑ” ‰É½±”ˆ¤€ôôô€‰¥µœˆñðÑ…É•Ð¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰•¹‘=™½¹Ñ•¹Ðˆ¤ñðÑ…É•Ð¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰Ñ•áÑ1…å•É%µ…•Ìˆ¤ñðÑ…É•Ð¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰Ñ•áÑ1…å•É%µ…•A±…•¡½±‘•Èˆ¤¤€˜˜Ñ¡¥Ì¸Ñ•áÑ1…å•È¹‘¥Ø¹½¹Ñ…¥¹Ì¡Ñ…É•Ð¤¤ì(€€€€€½¹ÍÐì(€€€€€€€¥Í5…Œ(€€€€€ô€ô•…ÑÕÉ•Q•ÍÐ¹Á±…Ñ™½É´ì(€€€€€¥˜€¡•Ù•¹Ð¹‰ÕÑÑ½¸€„ôô€Àñð•Ù•¹Ð¹ÑÉ±-•ä€˜˜¥Í5…Œ¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Í¡½Ý±±‘¥Ñ½ÉÌ ‰¡¥¡±¥¡Ðˆ°ÑÉÕ”°ÑÉÕ”¤ì(€€€€€!¥¡±¥¡Ñ‘¥Ñ½È¹ÍÑ…ÉÑÉ…Ý¥¹œ¡Ñ¡¥Ì°Ñ¡¥Ì¸Õ¥5…¹…•È°Ñ¡¥Ì¸Õ¥5…¹…•È¹‘¥É•Ñ¥½¸€ôôô€‰±ÑÈˆ°•Ù•¹Ð¤ì(€€€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€ô(€ô(€•¹…‰±•±¥¬ ¤ì(€€€¥˜€¡Ñ¡¥Ì¸±¥­¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸±¥­€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€½¹ÍÐÍ¥¹…°€ôÑ¡¥Ì¸Õ¥5…¹…•È¹½µ‰¥¹•‘M¥¹…°¡Ñ¡¥Ì¸±¥­¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É‘½Ý¸ˆ°Ñ¡¥Ì¹Á½¥¹Ñ•É‘½Ý¸¹‰¥¹¡Ñ¡¥Ì¤°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€½¹ÍÐÁ½¥¹Ñ•ÉÕÀ€ôÑ¡¥Ì¹Á½¥¹Ñ•ÉÕÀ¹‰¥¹¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•ÉÕÀˆ°Á½¥¹Ñ•ÉÕÀ°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É…¹•°ˆ°Á½¥¹Ñ•ÉÕÀ°ì(€€€€€Í¥¹…°(€€€ô¤ì(€ô(€‘¥Í…‰±•±¥¬ ¤ì(€€€Ñ¡¥Ì¸±¥­ü¹…‰½ÉÐ ¤ì(€€€Ñ¡¥Ì¸±¥­€ô¹Õ±°ì(€ô(€…ÑÑ… ¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹Í•Ð¡•‘¥Ñ½È¹¥°•‘¥Ñ½È¤ì(€€€½¹ÍÐì(€€€€€…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%(€€€ô€ô•‘¥Ñ½Èì(€€€¥˜€¡…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%€˜˜Ñ¡¥Ì¸Õ¥5…¹…•È¹¥Í•±•Ñ•‘¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤¤ì(€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹É•µ½Ù••±•Ñ•‘¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡•‘¥Ñ½È¤ì(€€€ô(€ô(€‘•Ñ… ¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹‘•±•Ñ”¡•‘¥Ñ½È¹¥¤ì(€€€Ñ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•Èü¹É•µ½Ù•A½¥¹Ñ•É%¹Q•áÑ1…å•È¡•‘¥Ñ½È¹½¹Ñ•¹Ñ¥Ø¤ì(€€€¥˜€ …Ñ¡¥Ì¸¥Í¥Í…‰±¥¹œ€˜˜•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹…‘‘•±•Ñ•‘¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡•‘¥Ñ½È¤ì(€€€ô(€ô(€É•µ½Ù”¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¹‘•Ñ… ¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹É•µ½Ù•‘¥Ñ½È¡•‘¥Ñ½È¤ì(€€€•‘¥Ñ½È¹‘¥Ø¹É•µ½Ù” ¤ì(€€€•‘¥Ñ½È¹¥ÍÑÑ…¡•‘Q½=4€ô™…±Í”ì(€ô(€¡…¹•A…É•¹Ð¡•‘¥Ñ½È¤ì(€€€¥˜€¡•‘¥Ñ½È¹Á…É•¹Ð€ôôôÑ¡¥Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡•‘¥Ñ½È¹Á…É•¹Ð€˜˜•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%¤ì(€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹…‘‘•±•Ñ•‘¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡•‘¥Ñ½È¤ì(€€€€€¹¹½Ñ…Ñ¥½¹‘¥Ñ½È¹‘•±•Ñ•¹¹½Ñ…Ñ¥½¹±•µ•¹Ð¡•‘¥Ñ½È¤ì(€€€€€•‘¥Ñ½È¹…¹¹½Ñ…Ñ¥½¹±•µ•¹Ñ%€ô¹Õ±°ì(€€€ô(€€€Ñ¡¥Ì¹…ÑÑ… ¡•‘¥Ñ½È¤ì(€€€•‘¥Ñ½È¹Á…É•¹Ðü¹‘•Ñ… ¡•‘¥Ñ½È¤ì(€€€•‘¥Ñ½È¹Í•ÑA…É•¹Ð¡Ñ¡¥Ì¤ì(€€€¥˜€¡•‘¥Ñ½È¹‘¥Ø€˜˜•‘¥Ñ½È¹¥ÍÑÑ…¡•‘Q½=4¤ì(€€€€€•‘¥Ñ½È¹‘¥Ø¹É•µ½Ù” ¤ì(€€€€€Ñ¡¥Ì¹‘¥Ø¹…ÁÁ•¹¡•‘¥Ñ½È¹‘¥Ø¤ì(€€€ô(€ô(€…‘¡•‘¥Ñ½È¤ì(€€€¥˜€¡•‘¥Ñ½È¹Á…É•¹Ð€ôôôÑ¡¥Ì€˜˜•‘¥Ñ½È¹¥ÍÑÑ…¡•‘Q½=4¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹¡…¹•A…É•¹Ð¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹…‘‘‘¥Ñ½È¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¹…ÑÑ… ¡•‘¥Ñ½È¤ì(€€€¥˜€ …•‘¥Ñ½È¹¥ÍÑÑ…¡•‘Q½=4¤ì(€€€€€½¹ÍÐ‘¥Ø€ô•‘¥Ñ½È¹É•¹‘•È ¤ì(€€€€€Ñ¡¥Ì¹‘¥Ø¹…ÁÁ•¹¡‘¥Ø¤ì(€€€€€•‘¥Ñ½È¹¥ÍÑÑ…¡•‘Q½=4€ôÑÉÕ”ì(€€€ô(€€€•‘¥Ñ½È¹™¥á¹‘M•ÑA½Í¥Ñ¥½¸ ¤ì(€€€•‘¥Ñ½È¹½¹•‘‘• …Ñ¡¥Ì¸¥Í¹…‰±¥¹œ¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹…‘‘Q½¹¹½Ñ…Ñ¥½¹MÑ½É…”¡•‘¥Ñ½È¤ì(€€€•‘¥Ñ½È¹}É•Á½ÉÑQ•±•µ•ÑÉä¡•‘¥Ñ½È¹Ñ•±•µ•ÑÉå%¹¥Ñ¥…±…Ñ„¤ì(€ô(€µ½Ù•‘¥Ñ½É%¹=4¡•‘¥Ñ½È¤ì(€€€¥˜€ …•‘¥Ñ½È¹¥ÍÑÑ…¡•‘Q½=4¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€…Ñ¥Ù•±•µ•¹Ð(€€€ô€ô‘½Õµ•¹Ðì(€€€¥˜€¡•‘¥Ñ½È¹‘¥Ø¹½¹Ñ…¥¹Ì¡…Ñ¥Ù•±•µ•¹Ð¤€˜˜€…Ñ¡¥Ì¸•‘¥Ñ½É½ÕÍQ¥µ•½ÕÑ%¤ì(€€€€€•‘¥Ñ½È¹}™½ÕÍÙ•¹ÑÍ±±½Ý•€ô™…±Í”ì(€€€€€Ñ¡¥Ì¸•‘¥Ñ½É½ÕÍQ¥µ•½ÕÑ%€ôÍ•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€€€Ñ¡¥Ì¸•‘¥Ñ½É½ÕÍQ¥µ•½ÕÑ%€ô¹Õ±°ì(€€€€€€€¥˜€ …•‘¥Ñ½È¹‘¥Ø¹½¹Ñ…¥¹Ì¡‘½Õµ•¹Ð¹…Ñ¥Ù•±•µ•¹Ð¤¤ì(€€€€€€€€€•‘¥Ñ½È¹‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰™½ÕÍ¥¸ˆ°€ ¤€ôøì(€€€€€€€€€€€•‘¥Ñ½È¹}™½ÕÍÙ•¹ÑÍ±±½Ý•€ôÑÉÕ”ì(€€€€€€€€€ô°ì(€€€€€€€€€€€½¹”èÑÉÕ”°(€€€€€€€€€€€Í¥¹…°èÑ¡¥Ì¸Õ¥5…¹…•È¹}Í¥¹…°(€€€€€€€€€ô¤ì(€€€€€€€€€…Ñ¥Ù•±•µ•¹Ð¹™½ÕÌ ¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€•‘¥Ñ½È¹}™½ÕÍÙ•¹ÑÍ±±½Ý•€ôÑÉÕ”ì(€€€€€€€ô(€€€€€ô°€À¤ì(€€€ô(€€€•‘¥Ñ½È¹}ÍÑÉÕÑQÉ••A…É•¹Ñ%€ôÑ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•Èü¹µ½Ù•±•µ•¹Ñ%¹=4¡Ñ¡¥Ì¹‘¥Ø°•‘¥Ñ½È¹‘¥Ø°•‘¥Ñ½È¹½¹Ñ•¹Ñ¥Ø°ÑÉÕ”¤ì(€ô(€…‘‘=ÉI•‰Õ¥±¡•‘¥Ñ½È¤ì(€€€¥˜€¡•‘¥Ñ½È¹¹••‘ÍQ½	•I•‰Õ¥±Ð ¤¤ì(€€€€€•‘¥Ñ½È¹Á…É•¹ÐñðôÑ¡¥Ìì(€€€€€•‘¥Ñ½È¹É•‰Õ¥± ¤ì(€€€€€•‘¥Ñ½È¹Í¡½Ü ¤ì(€€€ô•±Í”ì(€€€€€Ñ¡¥Ì¹…‘¡•‘¥Ñ½È¤ì(€€€ô(€ô(€…‘‘U¹‘½…‰±•‘¥Ñ½È¡•‘¥Ñ½È¤ì(€€€½¹ÍÐµ€ô€ ¤€ôø•‘¥Ñ½È¹}Õ¥5…¹…•È¹É•‰Õ¥±¡•‘¥Ñ½È¤ì(€€€½¹ÍÐÕ¹‘¼€ô€ ¤€ôøì(€€€€€•‘¥Ñ½È¹É•µ½Ù” ¤ì(€€€ôì(€€€Ñ¡¥Ì¹…‘‘½µµ…¹‘Ì¡ì(€€€€€µ°(€€€€€Õ¹‘¼°(€€€€€µÕÍÑá•Œè™…±Í”(€€€ô¤ì(€ô(€•Ñ‘¥Ñ½É	åU%¡Õ¥¤ì(€€€™½È€¡½¹ÍÐ•‘¥Ñ½È½˜Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹Ù…±Õ•Ì ¤¤ì(€€€€€¥˜€¡•‘¥Ñ½È¹Õ¥€ôôôÕ¥¤ì(€€€€€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€€€€€ô(€€€ô(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€•Ð€ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ” ¤ì(€€€É•ÑÕÉ¸¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È¸•‘¥Ñ½ÉQåÁ•Ì¹•Ð¡Ñ¡¥Ì¸Õ¥5…¹…•È¹•Ñ5½‘” ¤¤ì(€ô(€½µ‰¥¹•‘M¥¹…°¡…Œ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Õ¥5…¹…•È¹½µ‰¥¹•‘M¥¹…°¡…Œ¤ì(€ô(€€É•…Ñ•9•Ý‘¥Ñ½È¡Á…É…µÌ¤ì(€€€½¹ÍÐ•‘¥Ñ½ÉQåÁ”€ôÑ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”ì(€€€É•ÑÕÉ¸•‘¥Ñ½ÉQåÁ”€ü¹•Ü•‘¥Ñ½ÉQåÁ”¹ÁÉ½Ñ½ÑåÁ”¹½¹ÍÑÉÕÑ½È¡Á…É…µÌ¤€è¹Õ±°ì(€ô(€…¹É•…Ñ•9•ÝµÁÑå‘¥Ñ½È ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”ü¹…¹É•…Ñ•9•ÝµÁÑå‘¥Ñ½È ¤ì(€ô(€…Íå¹ŒÁ…ÍÑ•‘¥Ñ½È¡½ÁÑ¥½¹Ì°Á…É…µÌ¤ì(€€€Ñ¡¥Ì¹ÕÁ‘…Ñ•Q½½±‰…È¡½ÁÑ¥½¹Ì¤ì(€€€…Ý…¥ÐÑ¡¥Ì¸Õ¥5…¹…•È¹ÕÁ‘…Ñ•5½‘”¡½ÁÑ¥½¹Ì¹µ½‘”¤ì(€€€½¹ÍÐì(€€€€€½™™Í•Ñ`°(€€€€€½™™Í•Ñd(€€€ô€ôÑ¡¥Ì¸•Ñ•¹Ñ•ÉA½¥¹Ð ¤ì(€€€½¹ÍÐ¥€ôÑ¡¥Ì¸Õ¥5…¹…•È¹•Ñ% ¤ì(€€€½¹ÍÐ•‘¥Ñ½È€ôÑ¡¥Ì¸É•…Ñ•9•Ý‘¥Ñ½È¡ì(€€€€€Á…É•¹ÐèÑ¡¥Ì°(€€€€€¥°(€€€€€àè½™™Í•Ñ`°(€€€€€äè½™™Í•Ñd°(€€€€€Õ¥5…¹…•ÈèÑ¡¥Ì¸Õ¥5…¹…•È°(€€€€€¥Í•¹Ñ•É•èÑÉÕ”°(€€€€€€¸¸¹Á…É…µÌ(€€€ô¤ì(€€€¥˜€¡•‘¥Ñ½È¤ì(€€€€€Ñ¡¥Ì¹…‘¡•‘¥Ñ½È¤ì(€€€ô(€ô(€…Íå¹Œ‘•Í•É¥…±¥é”¡‘…Ñ„¤ì(€€€É•ÑÕÉ¸€¡…Ý…¥Ð¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È¸•‘¥Ñ½ÉQåÁ•Ì¹•Ð¡‘…Ñ„¹…¹¹½Ñ…Ñ¥½¹QåÁ”€üü‘…Ñ„¹…¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¤ü¹‘•Í•É¥…±¥é”¡‘…Ñ„°Ñ¡¥Ì°Ñ¡¥Ì¸Õ¥5…¹…•È¤¤ñð¹Õ±°ì(€ô(€É•…Ñ•¹‘‘‘9•Ý‘¥Ñ½È¡•Ù•¹Ð°¥Í•¹Ñ•É•°‘…Ñ„€ôíô¤ì(€€€½¹ÍÐ¥€ôÑ¡¥Ì¸Õ¥5…¹…•È¹•Ñ% ¤ì(€€€½¹ÍÐ•‘¥Ñ½È€ôÑ¡¥Ì¸É•…Ñ•9•Ý‘¥Ñ½È¡ì(€€€€€Á…É•¹ÐèÑ¡¥Ì°(€€€€€¥°(€€€€€àè•Ù•¹Ð¹½™™Í•Ñ`°(€€€€€äè•Ù•¹Ð¹½™™Í•Ñd°(€€€€€Õ¥5…¹…•ÈèÑ¡¥Ì¸Õ¥5…¹…•È°(€€€€€¥Í•¹Ñ•É•°(€€€€€€¸¸¹‘…Ñ„(€€€ô¤ì(€€€¥˜€¡•‘¥Ñ½È¤ì(€€€€€Ñ¡¥Ì¹…‘¡•‘¥Ñ½È¤ì(€€€ô(€€€É•ÑÕÉ¸•‘¥Ñ½Èì(€ô(€•Ð‰½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¹‘¥Ø¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€ô(€€•Ñ•¹Ñ•ÉA½¥¹Ð ¤ì(€€€½¹ÍÐì(€€€€€à°(€€€€€ä°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð(€€€ô€ôÑ¡¥Ì¹‰½Õ¹‘¥¹±¥•¹ÑI•Ðì(€€€½¹ÍÐÑ±`€ô5…Ñ ¹µ…à À°à¤ì(€€€½¹ÍÐÑ±d€ô5…Ñ ¹µ…à À°ä¤ì(€€€½¹ÍÐ‰É`€ô5…Ñ ¹µ¥¸¡Ý¥¹‘½Ü¹¥¹¹•É]¥‘Ñ °à€¬Ý¥‘Ñ ¤ì(€€€½¹ÍÐ‰Éd€ô5…Ñ ¹µ¥¸¡Ý¥¹‘½Ü¹¥¹¹•É!•¥¡Ð°ä€¬¡•¥¡Ð¤ì(€€€½¹ÍÐ•¹Ñ•É`€ô€¡Ñ±`€¬‰É`¤€¼€È€´àì(€€€½¹ÍÐ•¹Ñ•Éd€ô€¡Ñ±d€¬‰Éd¤€¼€È€´äì(€€€½¹ÍÐm½™™Í•Ñ`°½™™Í•Ñet€ôÑ¡¥Ì¹Ù¥•ÝÁ½ÉÐ¹É½Ñ…Ñ¥½¸€”€ÄàÀ€ôôô€À€üm•¹Ñ•É`°•¹Ñ•Éet€èm•¹Ñ•Éd°•¹Ñ•Éatì(€€€É•ÑÕÉ¸ì(€€€€€½™™Í•Ñ`°(€€€€€½™™Í•Ñd(€€€ôì(€ô(€…‘‘9•Ý‘¥Ñ½È¡‘…Ñ„€ôíô¤ì(€€€Ñ¡¥Ì¹É•…Ñ•¹‘‘‘9•Ý‘¥Ñ½È¡Ñ¡¥Ì¸•Ñ•¹Ñ•ÉA½¥¹Ð ¤°ÑÉÕ”°‘…Ñ„¤ì(€ô(€Í•ÑM•±•Ñ•¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Í•ÑM•±•Ñ•¡•‘¥Ñ½È¤ì(€ô(€Ñ½±•M•±•Ñ•¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Ñ½±•M•±•Ñ•¡•‘¥Ñ½È¤ì(€ô(€Õ¹Í•±•Ð¡•‘¥Ñ½È¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Õ¹Í•±•Ð¡•‘¥Ñ½È¤ì(€ô(€Á½¥¹Ñ•ÉÕÀ¡•Ù•¹Ð¤ì(€€€½¹ÍÐì(€€€€€¥Í5…Œ(€€€ô€ô•…ÑÕÉ•Q•ÍÐ¹Á±…Ñ™½É´ì(€€€¥˜€¡•Ù•¹Ð¹‰ÕÑÑ½¸€„ôô€Àñð•Ù•¹Ð¹ÑÉ±-•ä€˜˜¥Í5…Œ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡•Ù•¹Ð¹Ñ…É•Ð€„ôôÑ¡¥Ì¹‘¥Ø¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸¡…‘A½¥¹Ñ•É½Ý¸¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸¡…‘A½¥¹Ñ•É½Ý¸€ô™…±Í”ì(€€€¥˜€¡Ñ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”ü¹¥ÍÉ…Ý•È€˜˜Ñ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”¹ÍÕÁÁ½ÉÑ5Õ±Ñ¥Á±•É…Ý¥¹Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€ …Ñ¡¥Ì¸…±±½Ý±¥¬¤ì(€€€€€Ñ¡¥Ì¸…±±½Ý±¥¬€ôÑÉÕ”ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÕÉÉ•¹Ñ5½‘”€ôÑ¡¥Ì¸Õ¥5…¹…•È¹•Ñ5½‘” ¤ì(€€€¥˜€¡ÕÉÉ•¹Ñ5½‘”€ôôô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹MQ5@ñðÕÉÉ•¹Ñ5½‘”€ôôô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹A=AU@ñðÕÉÉ•¹Ñ5½‘”€ôôô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹M%9QUI¤ì(€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Õ¹Í•±•Ñ±° ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¹É•…Ñ•¹‘‘‘9•Ý‘¥Ñ½È¡•Ù•¹Ð°™…±Í”¤ì(€ô(€Á½¥¹Ñ•É‘½Ý¸¡•Ù•¹Ð¤ì(€€€¥˜€¡Ñ¡¥Ì¸Õ¥5…¹…•È¹•Ñ5½‘” ¤€ôôô¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”¹!%!1%!P¤ì(€€€€€Ñ¡¥Ì¹•¹…‰±•Q•áÑM•±•Ñ¥½¸ ¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸¡…‘A½¥¹Ñ•É½Ý¸¤ì(€€€€€Ñ¡¥Ì¸¡…‘A½¥¹Ñ•É½Ý¸€ô™…±Í”ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€¥Í5…Œ(€€€ô€ô•…ÑÕÉ•Q•ÍÐ¹Á±…Ñ™½É´ì(€€€¥˜€¡•Ù•¹Ð¹‰ÕÑÑ½¸€„ôô€Àñð•Ù•¹Ð¹ÑÉ±-•ä€˜˜¥Í5…Œ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡•Ù•¹Ð¹Ñ…É•Ð€„ôôÑ¡¥Ì¹‘¥Ø¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸¡…‘A½¥¹Ñ•É½Ý¸€ôÑÉÕ”ì(€€€¥˜€¡Ñ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”ü¹¥ÍÉ…Ý•È¤ì(€€€€€Ñ¡¥Ì¹ÍÑ…ÉÑÉ…Ý¥¹M•ÍÍ¥½¸¡•Ù•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐ•‘¥Ñ½È€ôÑ¡¥Ì¸Õ¥5…¹…•È¹•ÑÑ¥Ù” ¤ì(€€€Ñ¡¥Ì¸…±±½Ý±¥¬€ô€…•‘¥Ñ½Èñð•‘¥Ñ½È¹¥ÍµÁÑä ¤ì(€ô(€ÍÑ…ÉÑÉ…Ý¥¹M•ÍÍ¥½¸¡•Ù•¹Ð¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹™½ÕÌ¡ì(€€€€€ÁÉ•Ù•¹ÑMÉ½±°èÑÉÕ”(€€€ô¤ì(€€€¥˜€¡Ñ¡¥Ì¸‘É…Ý¥¹¤ì(€€€€€Ñ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”¹ÍÑ…ÉÑÉ…Ý¥¹œ¡Ñ¡¥Ì°Ñ¡¥Ì¸Õ¥5…¹…•È°™…±Í”°•Ù•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Í•ÑÕÉÉ•¹ÑÉ…Ý¥¹M•ÍÍ¥½¸¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¸‘É…Ý¥¹€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€½¹ÍÐÍ¥¹…°€ôÑ¡¥Ì¸Õ¥5…¹…•È¹½µ‰¥¹•‘M¥¹…°¡Ñ¡¥Ì¸‘É…Ý¥¹¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‰±ÕÈˆ°€¡ì(€€€€€É•±…Ñ•‘Q…É•Ð(€€€ô¤€ôøì(€€€€€¥˜€¡É•±…Ñ•‘Q…É•Ð€˜˜€…Ñ¡¥Ì¹‘¥Ø¹½¹Ñ…¥¹Ì¡É•±…Ñ•‘Q…É•Ð¤¤ì(€€€€€€€Ñ¡¥Ì¸™½ÕÍ•‘±•µ•¹Ð€ô¹Õ±°ì(€€€€€€€Ñ¡¥Ì¹½µµ¥Ñ=ÉI•µ½Ù” ¤ì(€€€€€ô(€€€ô°ì(€€€€€Í¥¹…°(€€€ô¤ì(€€€Ñ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”¹ÍÑ…ÉÑÉ…Ý¥¹œ¡Ñ¡¥Ì°Ñ¡¥Ì¸Õ¥5…¹…•È°™…±Í”°•Ù•¹Ð¤ì(€ô(€Á…ÕÍ”¡½¸¤ì(€€€¥˜€¡½¸¤ì(€€€€€½¹ÍÐì(€€€€€€€…Ñ¥Ù•±•µ•¹Ð(€€€€€ô€ô‘½Õµ•¹Ðì(€€€€€¥˜€¡Ñ¡¥Ì¹‘¥Ø¹½¹Ñ…¥¹Ì¡…Ñ¥Ù•±•µ•¹Ð¤¤ì(€€€€€€€Ñ¡¥Ì¸™½ÕÍ•‘±•µ•¹Ð€ô…Ñ¥Ù•±•µ•¹Ðì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸™½ÕÍ•‘±•µ•¹Ð¤ì(€€€€€Í•ÑQ¥µ•½ÕÐ  ¤€ôøì(€€€€€€€Ñ¡¥Ì¸™½ÕÍ•‘±•µ•¹Ðü¹™½ÕÌ ¤ì(€€€€€€€Ñ¡¥Ì¸™½ÕÍ•‘±•µ•¹Ð€ô¹Õ±°ì(€€€€€ô°€À¤ì(€€€ô(€ô(€•¹‘É…Ý¥¹M•ÍÍ¥½¸¡¥Í‰½ÉÑ•€ô™…±Í”¤ì(€€€¥˜€ …Ñ¡¥Ì¸‘É…Ý¥¹¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Í•ÑÕÉÉ•¹ÑÉ…Ý¥¹M•ÍÍ¥½¸¡¹Õ±°¤ì(€€€Ñ¡¥Ì¸‘É…Ý¥¹¹…‰½ÉÐ ¤ì(€€€Ñ¡¥Ì¸‘É…Ý¥¹€ô¹Õ±°ì(€€€Ñ¡¥Ì¸™½ÕÍ•‘±•µ•¹Ð€ô¹Õ±°ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”¹•¹‘É…Ý¥¹œ¡¥Í‰½ÉÑ•¤ì(€ô(€™¥¹‘9•ÝA…É•¹Ð¡•‘¥Ñ½È°à°ä¤ì(€€€½¹ÍÐ±…å•È€ôÑ¡¥Ì¸Õ¥5…¹…•È¹™¥¹‘A…É•¹Ð¡à°ä¤ì(€€€¥˜€¡±…å•È€ôôô¹Õ±°ñð±…å•È€ôôôÑ¡¥Ì¤ì(€€€€€É•ÑÕÉ¸™…±Í”ì(€€€ô(€€€±…å•È¹¡…¹•A…É•¹Ð¡•‘¥Ñ½È¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€½µµ¥Ñ=ÉI•µ½Ù” ¤ì(€€€¥˜€¡Ñ¡¥Ì¸‘É…Ý¥¹¤ì(€€€€€Ñ¡¥Ì¹•¹‘É…Ý¥¹M•ÍÍ¥½¸ ¤ì(€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€ô(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€½¹M…±•¡…¹¥¹œ ¤ì(€€€¥˜€ …Ñ¡¥Ì¸‘É…Ý¥¹¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸ÕÉÉ•¹Ñ‘¥Ñ½ÉQåÁ”¹½¹M…±•¡…¹¥¹]¡•¹É…Ý¥¹œ¡Ñ¡¥Ì¤ì(€ô(€‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¹½µµ¥Ñ=ÉI•µ½Ù” ¤ì(€€€¥˜€¡Ñ¡¥Ì¸Õ¥5…¹…•È¹•ÑÑ¥Ù” ¤ü¹Á…É•¹Ð€ôôôÑ¡¥Ì¤ì(€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹½µµ¥Ñ=ÉI•µ½Ù” ¤ì(€€€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹Í•ÑÑ¥Ù•‘¥Ñ½È¡¹Õ±°¤ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸•‘¥Ñ½É½ÕÍQ¥µ•½ÕÑ%¤ì(€€€€€±•…ÉQ¥µ•½ÕÐ¡Ñ¡¥Ì¸•‘¥Ñ½É½ÕÍQ¥µ•½ÕÑ%¤ì(€€€€€Ñ¡¥Ì¸•‘¥Ñ½É½ÕÍQ¥µ•½ÕÑ%€ô¹Õ±°ì(€€€ô(€€€™½È€¡½¹ÍÐ•‘¥Ñ½È½˜Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹Ù…±Õ•Ì ¤¤ì(€€€€€Ñ¡¥Ì¸…•ÍÍ¥‰¥±¥Ñå5…¹…•Èü¹É•µ½Ù•A½¥¹Ñ•É%¹Q•áÑ1…å•È¡•‘¥Ñ½È¹½¹Ñ•¹Ñ¥Ø¤ì(€€€€€•‘¥Ñ½È¹Í•ÑA…É•¹Ð¡¹Õ±°¤ì(€€€€€•‘¥Ñ½È¹¥ÍÑÑ…¡•‘Q½=4€ô™…±Í”ì(€€€€€•‘¥Ñ½È¹‘¥Ø¹É•µ½Ù” ¤ì(€€€ô(€€€Ñ¡¥Ì¹‘¥Ø€ô¹Õ±°ì(€€€Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹±•…È ¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹É•µ½Ù•1…å•È¡Ñ¡¥Ì¤ì(€ô(€€±•…¹ÕÀ ¤ì(€€€™½È€¡½¹ÍÐ•‘¥Ñ½È½˜Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹Ù…±Õ•Ì ¤¤ì(€€€€€¥˜€¡•‘¥Ñ½È¹¥ÍµÁÑä ¤¤ì(€€€€€€€•‘¥Ñ½È¹É•µ½Ù” ¤ì(€€€€€ô(€€€ô(€ô(€…Íå¹ŒÉ•¹‘•È¡ì(€€€Ù¥•ÝÁ½ÉÐ(€ô¤ì(€€€Ñ¡¥Ì¹Ù¥•ÝÁ½ÉÐ€ôÙ¥•ÝÁ½ÉÐì(€€€Í•Ñ1…å•É¥µ•¹Í¥½¹Ì¡Ñ¡¥Ì¹‘¥Ø°Ù¥•ÝÁ½ÉÐ¤ì(€€€™½È€¡½¹ÍÐ•‘¥Ñ½È½˜Ñ¡¥Ì¸Õ¥5…¹…•È¹•Ñ‘¥Ñ½ÉÌ¡Ñ¡¥Ì¹Á…•%¹‘•à¤¤ì(€€€€€Ñ¡¥Ì¹…‘¡•‘¥Ñ½È¤ì(€€€€€•‘¥Ñ½È¹É•‰Õ¥± ¤ì(€€€ô(€€€…Ý…¥ÐÑ¡¥Ì¸Õ¥5…¹…•È¹™¥¹‘±½¹•Í½ÉA…”¡Ñ¡¥Ì¤ì(€€€Ñ¡¥Ì¹‘¥Ø¹¡¥‘‘•¸€ôÑ¡¥Ì¹¥ÍµÁÑäì(€€€Ñ¡¥Ì¹ÕÁ‘…Ñ•5½‘” ¤ì(€ô(€ÕÁ‘…Ñ”¡ì(€€€Ù¥•ÝÁ½ÉÐ(€ô¤ì(€€€Ñ¡¥Ì¸Õ¥5…¹…•È¹½µµ¥Ñ=ÉI•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸±•…¹ÕÀ ¤ì(€€€½¹ÍÐ½±‘I½Ñ…Ñ¥½¸€ôÑ¡¥Ì¹Ù¥•ÝÁ½ÉÐ¹É½Ñ…Ñ¥½¸ì(€€€½¹ÍÐÉ½Ñ…Ñ¥½¸€ôÙ¥•ÝÁ½ÉÐ¹É½Ñ…Ñ¥½¸ì(€€€Ñ¡¥Ì¹Ù¥•ÝÁ½ÉÐ€ôÙ¥•ÝÁ½ÉÐì(€€€Í•Ñ1…å•É¥µ•¹Í¥½¹Ì¡Ñ¡¥Ì¹‘¥Ø°ì(€€€€€É½Ñ…Ñ¥½¸(€€€ô¤ì(€€€¥˜€¡½±‘I½Ñ…Ñ¥½¸€„ôôÉ½Ñ…Ñ¥½¸¤ì(€€€€€™½È€¡½¹ÍÐ•‘¥Ñ½È½˜Ñ¡¥Ì¸•‘¥Ñ½ÉÌ¹Ù…±Õ•Ì ¤¤ì(€€€€€€€•‘¥Ñ½È¹É½Ñ…Ñ”¡É½Ñ…Ñ¥½¸¤ì(€€€€€ô(€€€ô(€ô(€•ÐÁ…•¥µ•¹Í¥½¹Ì ¤ì(€€€½¹ÍÐì(€€€€€Á…•]¥‘Ñ °(€€€€€Á…•!•¥¡Ð(€€€ô€ôÑ¡¥Ì¹Ù¥•ÝÁ½ÉÐ¹É…Ý¥µÌì(€€€É•ÑÕÉ¸mÁ…•]¥‘Ñ °Á…•!•¥¡Ñtì(€ô(€•ÐÍ…±” ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Õ¥5…¹…•È¹Ù¥•ÝA…É…µ•Ñ•ÉÌ¹É•…±M…±”ì(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½‘É…Ý}±…å•È¹©Ì(()™Õ¹Ñ¥½¸½µÁ…É•Q•áÑ1…å•ÉÌ¡„°ˆ¤ì(€¥˜€¡„€ôôôˆ¤ì(€€€É•ÑÕÉ¸€Àì(€ô(€É•ÑÕÉ¸„¹½µÁ…É•½Õµ•¹ÑA½Í¥Ñ¥½¸¡ˆ¤€˜9½‘”¹=U59Q}A=M%Q%=9}=11=]%9€ü€´Ä€è€Äì)ô)™Õ¹Ñ¥½¸•ÑQ•áÑ1…å•È¡¹½‘”¤ì(€¥˜€ …¹½‘”¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€¥˜€¡¹½‘”¹¹½‘•QåÁ”€ôôô9½‘”¹159Q}9=¤ì(€€€É•ÑÕÉ¸¹½‘”¹±½Í•ÍÐ ˆ¹Ñ•áÑ1…å•Èˆ¤ì(€ô(€É•ÑÕÉ¸¹½‘”¹Á…É•¹Ñ±•µ•¹Ðü¹±½Í•ÍÐ ˆ¹Ñ•áÑ1…å•Èˆ¤ñð¹Õ±°ì)ô)™Õ¹Ñ¥½¸¥ÍA½¥¹Ñ	•™½É”¡¹½‘•°½™™Í•Ñ°¹½‘•°½™™Í•Ñ¤ì(€¥˜€¡¹½‘•€ôôô¹½‘•¤ì(€€€É•ÑÕÉ¸½™™Í•Ñ€ðô½™™Í•Ñì(€ô(€½¹ÍÐÉ•±…Ñ¥½¸€ô¹½‘•¹½µÁ…É•½Õµ•¹ÑA½Í¥Ñ¥½¸¡¹½‘•¤ì(€¥˜€¡É•±…Ñ¥½¸€˜9½‘”¹=U59Q}A=M%Q%=9}=11=]%9¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô(€¥˜€¡É•±…Ñ¥½¸€˜9½‘”¹=U59Q}A=M%Q%=9}AI%9¤ì(€€€É•ÑÕÉ¸™…±Í”ì(€ô(€É•ÑÕÉ¸¹Õ±°ì)ô)™Õ¹Ñ¥½¸¹½Éµ…±¥é•‘•	½Õ¹‘…Éä¡½¹Ñ…¥¹•È°½™™Í•Ð°Ñ•áÑ1…å•È¤ì(€¥˜€¡½¹Ñ…¥¹•È¹¹½‘•QåÁ”€„ôô9½‘”¹159Q}9=ñð€…½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰Ñ•áÑ1…å•Èˆ¤ñð½™™Í•Ð€„ôô½¹Ñ…¥¹•È¹¡¥±‘9½‘•Ì¹±•¹Ñ ¤ì(€€€É•ÑÕÉ¸ì(€€€€€½¹Ñ…¥¹•È°(€€€€€½™™Í•Ð(€€€ôì(€ô(€±•Ð±…ÍÑ9½‘”€ô½¹Ñ…¥¹•È¹±…ÍÑ¡¥±ì(€¥˜€¡±…ÍÑ9½‘”ü¹¹½‘•QåÁ”€ôôô9½‘”¹159Q}9=€˜˜±…ÍÑ9½‘”¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰•¹‘=™½¹Ñ•¹Ðˆ¤¤ì(€€€±…ÍÑ9½‘”€ô±…ÍÑ9½‘”¹ÁÉ•Ù¥½ÕÍM¥‰±¥¹œì(€ô(€¥˜€ …±…ÍÑ9½‘”ñð€…Ñ•áÑ1…å•È¹½¹Ñ…¥¹Ì¡±…ÍÑ9½‘”¤¤ì(€€€É•ÑÕÉ¸¹Õ±°ì(€ô(€¥˜€¡±…ÍÑ9½‘”¹¹½‘•QåÁ”€ôôô9½‘”¹QaQ}9=¤ì(€€€É•ÑÕÉ¸ì(€€€€€½¹Ñ…¥¹•Èè±…ÍÑ9½‘”°(€€€€€½™™Í•Ðè±…ÍÑ9½‘”¹Ñ•áÑ½¹Ñ•¹Ð¹±•¹Ñ (€€€ôì(€ô(€É•ÑÕÉ¸ì(€€€½¹Ñ…¥¹•Èè±…ÍÑ9½‘”°(€€€½™™Í•Ðè±…ÍÑ9½‘”¹¡¥±‘9½‘•Ì¹±•¹Ñ (€ôì)ô)±…ÍÌÉ…Ý1…å•Èì(€€Á…É•¹Ð€ô¹Õ±°ì(€€µ…ÁÁ¥¹œ€ô¹•Ü5…À ¤ì(€€Ñ•áÑ1…å•È€ô¹Õ±°ì(€€™¥±Ñ•É…Ñ½Éä€ô¹Õ±°ì(€€Á…•½±½ÉÌ€ô¹Õ±°ì(€€Ñ•áÑ1…å•É=‰Í•ÉÙ•È€ô¹Õ±°ì(€€Ñ½UÁ‘…Ñ”€ô¹•Ü5…À ¤ì(€ÍÑ…Ñ¥Œ€¥€ô€Àì(€ÍÑ…Ñ¥Œ€Í•±•Ñ¥½¹%€ô€Àì(€ÍÑ…Ñ¥Œ€Í•±•Ñ¥½¹¡…¹•€ô¹Õ±°ì(€ÍÑ…Ñ¥Œ€Í•±•Ñ¥½¹Ì€ô¹•ÜM•Ð ¤ì(€ÍÑ…Ñ¥Œ€¥ÍM•±•Ñ¥¹œ€ô™…±Í”ì(€ÍÑ…Ñ¥Œ€Ñ•áÑ1…å•ÉM•Ð€ô¹•ÜM•Ð ¤ì(€ÍÑ…Ñ¥Œ€Ñ•áÑ1…å•ÉÌ€ô¹•Ü]•…­5…À ¤ì(€½¹ÍÑÉÕÑ½È¡ì(€€€™¥±Ñ•É…Ñ½Éä€ô¹Õ±°°(€€€Á…•½±½ÉÌ€ô¹Õ±°°(€€€Á…•%¹‘•à°(€€€Ñ•áÑ1…å•È€ô¹Õ±°(€ô¤ì(€€€Ñ¡¥Ì¹Á…•%¹‘•à€ôÁ…•%¹‘•àì(€€€Ñ¡¥Ì¸™¥±Ñ•É…Ñ½Éä€ô™¥±Ñ•É…Ñ½Éäì(€€€Ñ¡¥Ì¸Á…•½±½ÉÌ€ôÁ…•½±½ÉÌì(€€€¥˜€¡Ñ•áÑ1…å•È¤ì(€€€€€½¹ÍÐÁÉ•Ù¥½ÕÍ…Ñ„€ôÉ…Ý1…å•È¸Ñ•áÑ1…å•ÉÌ¹•Ð¡Ñ•áÑ1…å•È¤ì(€€€€€¥˜€¡ÁÉ•Ù¥½ÕÍ…Ñ„ü¹Í•±•Ñ¥½¹¥Ø¤ì(€€€€€€€ÁÉ•Ù¥½ÕÍ…Ñ„¹Í•±•Ñ¥½¹¥Ø¹É•µ½Ù” ¤ì(€€€€€€€É…Ý1…å•È¸Í•±•Ñ¥½¹Ì¹‘•±•Ñ”¡ÁÉ•Ù¥½ÕÍ…Ñ„¹Í•±•Ñ¥½¹¥Ø¤ì(€€€€€ô(€€€€€É…Ý1…å•È¸Ñ•áÑ1…å•ÉÌ¹Í•Ð¡Ñ•áÑ1…å•È°ì(€€€€€€€‘É…Ý1…å•ÈèÑ¡¥Ì(€€€€€ô¤ì(€€€€€É…Ý1…å•È¸Ñ•áÑ1…å•ÉM•Ð¹…‘¡Ñ•áÑ1…å•È¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•È€ôÑ•áÑ1…å•Èì(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•É=‰Í•ÉÙ•È€ô¹•Ü5ÕÑ…Ñ¥½¹=‰Í•ÉÙ•È¡É•½É‘Ì€ôøì(€€€€€€€¥˜€ …Ñ¡¥Ì¸Á…É•¹Ðñð€…Ñ¡¥Ì¸Ñ•áÑ1…å•Èü¹¥Í½¹¹•Ñ•ñð€…É…Ý1…å•È¸¡…ÍM•±•Ñ¥½¸ ¤¤ì(€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€ô(€€€€€€€™½È€¡½¹ÍÐì(€€€€€€€€€…‘‘•‘9½‘•Ì(€€€€€€€ô½˜É•½É‘Ì¤ì(€€€€€€€€€™½È€¡½¹ÍÐ¹½‘”½˜…‘‘•‘9½‘•Ì¤ì(€€€€€€€€€€€¥˜€¡¹½‘”¹¹½‘•QåÁ”€ôôô9½‘”¹159Q}9=€˜˜¹½‘”¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰•¹‘=™½¹Ñ•¹Ðˆ¤¤ì(€€€€€€€€€€€€€É…Ý1…å•È¸Í•±•Ñ¥½¹¡…¹” ¤ì(€€€€€€€€€€€€€É•ÑÕÉ¸ì(€€€€€€€€€€€ô(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô¤ì(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•É=‰Í•ÉÙ•È¹½‰Í•ÉÙ”¡Ñ•áÑ1…å•È°ì(€€€€€€€¡¥±‘1¥ÍÐèÑÉÕ”(€€€€€ô¤ì(€€€€€¥˜€¡É…Ý1…å•È¸Í•±•Ñ¥½¹¡…¹•€ôôô¹Õ±°¤ì(€€€€€€€É…Ý1…å•È¸Í•±•Ñ¥½¹¡…¹•€ô¹•Ü‰½ÉÑ½¹ÑÉ½±±•È ¤ì(€€€€€€€½¹ÍÐì(€€€€€€€€€Í¥¹…°(€€€€€€€ô€ôÉ…Ý1…å•È¸Í•±•Ñ¥½¹¡…¹•ì(€€€€€€€‘½Õµ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Í•±•Ñ¥½¹¡…¹”ˆ°É…Ý1…å•È¸Í•±•Ñ¥½¹¡…¹”¹‰¥¹¡É…Ý1…å•È¤°ì(€€€€€€€€€Í¥¹…°(€€€€€€€ô¤ì(€€€€€€€‘½Õµ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•É‘½Ý¸ˆ°€ ¤€ôøì(€€€€€€€€€É…Ý1…å•È¸¥ÍM•±•Ñ¥¹œ€ôÑÉÕ”ì(€€€€€€€ô°ì(€€€€€€€€€Í¥¹…°(€€€€€€€ô¤ì(€€€€€€€‘½Õµ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á½¥¹Ñ•ÉÕÀˆ°€ ¤€ôøì(€€€€€€€€€É…Ý1…å•È¸¥ÍM•±•Ñ¥¹œ€ô™…±Í”ì(€€€€€€€ô°ì(€€€€€€€€€Í¥¹…°(€€€€€€€ô¤ì(€€€€€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰‰±ÕÈˆ°€ ¤€ôøì(€€€€€€€€€É…Ý1…å•È¸¥ÍM•±•Ñ¥¹œ€ô™…±Í”ì(€€€€€€€ô°ì(€€€€€€€€€Í¥¹…°(€€€€€€€ô¤ì(€€€€€ô(€€€ô(€ô(€Í•ÑA…É•¹Ð¡Á…É•¹Ð¤ì(€€€¥˜€ …Ñ¡¥Ì¸Á…É•¹Ð¤ì(€€€€€Ñ¡¥Ì¸Á…É•¹Ð€ôÁ…É•¹Ðì(€€€€€¥˜€¡Ñ¡¥Ì¸Ñ•áÑ1…å•Èü¹¥Í½¹¹•Ñ•€˜˜É…Ý1…å•È¸¡…ÍM•±•Ñ¥½¸ ¤¤ì(€€€€€€€É…Ý1…å•È¸Í•±•Ñ¥½¹¡…¹” ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡Ñ¡¥Ì¸Á…É•¹Ð€„ôôÁ…É•¹Ð¤ì(€€€€€¥˜€¡Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹Í¥é”€ø€À¤ì(€€€€€€€™½È€¡½¹ÍÐÉ½½Ð½˜Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹Ù…±Õ•Ì ¤¤ì(€€€€€€€€€É½½Ð¹É•µ½Ù” ¤ì(€€€€€€€€€Á…É•¹Ð¹…ÁÁ•¹¡É½½Ð¤ì(€€€€€€€ô(€€€€€ô(€€€€€Ñ¡¥Ì¸Á…É•¹Ð€ôÁ…É•¹Ðì(€€€ô(€ô(€ÍÑ…Ñ¥Œ€±•…¹ÕÁQ•áÑ1…å•ÉM•±•Ñ¥½¸¡Ñ•áÑ1…å•È¤ì(€€€½¹ÍÐÑ•áÑ1…å•É…Ñ„€ôÑ¡¥Ì¸Ñ•áÑ1…å•ÉÌ¹•Ð¡Ñ•áÑ1…å•È¤ì(€€€¥˜€ …Ñ•áÑ1…å•É…Ñ„ü¹Í•±•Ñ¥½¹¥Ø¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ•áÑ1…å•É…Ñ„¹Í•±•Ñ¥½¹¥Ø¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸Í•±•Ñ¥½¹Ì¹‘•±•Ñ”¡Ñ•áÑ1…å•É…Ñ„¹Í•±•Ñ¥½¹¥Ø¤ì(€€€Ñ•áÑ1…å•É…Ñ„¹Í•±•Ñ¥½¹¥Ø€ô¹Õ±°ì(€€€Ñ•áÑ1…å•É…Ñ„¹Á…Ñ €ô¹Õ±°ì(€ô(€ÍÑ…Ñ¥Œ€¡…ÍM•±•Ñ¥½¸ ¤ì(€€€½¹ÍÐÍ•±•Ñ¥½¸€ô‘½Õµ•¹Ð¹•ÑM•±•Ñ¥½¸ ¤ì(€€€É•ÑÕÉ¸€„…Í•±•Ñ¥½¸€˜˜€…Í•±•Ñ¥½¸¹¥Í½±±…ÁÍ•ì(€ô(€ÍÑ…Ñ¥Œ€•Ñ=É‘•É•‘Q•áÑ1…å•ÉÌ ¤ì(€€€É•ÑÕÉ¸Ñ¡¥Ì¸Ñ•áÑ1…å•ÉM•Ð¹­•åÌ ¤¹™¥±Ñ•È¡Ñ•áÑ1…å•È€ôøÑ•áÑ1…å•È¹¥Í½¹¹•Ñ•¤¹Ñ½ÉÉ…ä ¤¹Í½ÉÐ¡½µÁ…É•Q•áÑ1…å•ÉÌ¤ì(€ô(€ÍÑ…Ñ¥Œ€Í•±•Ñ¥½¹¡…¹” ¤ì(€€€½¹ÍÐÍ•±•Ñ¥½¸€ô‘½Õµ•¹Ð¹•ÑM•±•Ñ¥½¸ ¤ì(€€€¥˜€ …Í•±•Ñ¥½¸ñðÍ•±•Ñ¥½¸¹¥Í½±±…ÁÍ•¤ì(€€€€€™½È€¡½¹ÍÐÉ½½Ð½˜Ñ¡¥Ì¸Í•±•Ñ¥½¹Ì¤ì(€€€€€€€É½½Ð¹É•µ½Ù” ¤ì(€€€€€ô(€€€€€Ñ¡¥Ì¸Í•±•Ñ¥½¹Ì¹±•…È ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÉ½Ñ…Ñ½ÉÌ€ô¹•Ü]•…­5…À ¤ì(€€€½¹ÍÐ½É‘•É•‘Q•áÑ1…å•ÉÌ€ôÑ¡¥Ì¸•Ñ=É‘•É•‘Q•áÑ1…å•ÉÌ ¤ì(€€€½¹ÍÐÉ…¹•Ì€ômtì(€€€™½È€¡±•Ð¤€ô€À°¥¤€ôÍ•±•Ñ¥½¸¹É…¹•½Õ¹Ðì¤€ð¥¤ì¤¬¬¤ì(€€€€€½¹ÍÐÉ…¹”€ôÍ•±•Ñ¥½¸¹•ÑI…¹•Ð¡¤¤ì(€€€€€¥˜€¡É…¹”¹½±±…ÁÍ•¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€±•Ðì(€€€€€€€ÍÑ…ÉÑ½¹Ñ…¥¹•È°(€€€€€€€ÍÑ…ÉÑ=™™Í•Ð°(€€€€€€€•¹‘½¹Ñ…¥¹•È°(€€€€€€€•¹‘=™™Í•Ð(€€€€€ô€ôÉ…¹”ì(€€€€€±•ÐÍÑ…ÉÑQ•áÑ1…å•È€ô•ÑQ•áÑ1…å•È¡ÍÑ…ÉÑ½¹Ñ…¥¹•È¤ì(€€€€€±•Ð•¹‘Q•áÑ1…å•È€ô•ÑQ•áÑ1…å•È¡•¹‘½¹Ñ…¥¹•È¤ì(€€€€€½¹ÍÐÍÑ…ÉÑ5¥ÍÍ¥¹œ€ôÍÑ…ÉÑQ•áÑ1…å•È€ôôô¹Õ±°ì(€€€€€½¹ÍÐ•¹‘5¥ÍÍ¥¹œ€ô•¹‘Q•áÑ1…å•È€ôôô¹Õ±°ì(€€€€€¥˜€¡Ñ¡¥Ì¸¥ÍM•±•Ñ¥¹œ€˜˜ÍÑ…ÉÑ5¥ÍÍ¥¹œ€„ôô•¹‘5¥ÍÍ¥¹œ¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€¥˜€¡Í•±•Ñ¥½¸¹É…¹•½Õ¹Ð€ôôô€Ä¤ì(€€€€€€€½¹ÍÐì(€€€€€€€€€…¹¡½É9½‘”°(€€€€€€€€€…¹¡½É=™™Í•Ð°(€€€€€€€€€™½ÕÍ9½‘”°(€€€€€€€€€™½ÕÍ=™™Í•Ð(€€€€€€€ô€ôÍ•±•Ñ¥½¸ì(€€€€€€€½¹ÍÐ…¹¡½É1…å•È€ô•ÑQ•áÑ1…å•È¡…¹¡½É9½‘”¤ì(€€€€€€€½¹ÍÐ™½ÕÍ1…å•È€ô•ÑQ•áÑ1…å•È¡™½ÕÍ9½‘”¤ì(€€€€€€€½¹ÍÐ…¹¡½É	•™½É•½ÕÌ€ô¥ÍA½¥¹Ñ	•™½É”¡…¹¡½É9½‘”°…¹¡½É=™™Í•Ð°™½ÕÍ9½‘”°™½ÕÍ=™™Í•Ð¤ì(€€€€€€€¥˜€¡…¹¡½É1…å•È€˜˜™½ÕÍ1…å•È€˜˜…¹¡½É	•™½É•½ÕÌ€„ôô¹Õ±°¤ì(€€€€€€€€€¥˜€¡…¹¡½É	•™½É•½ÕÌ¤ì(€€€€€€€€€€€ÍÑ…ÉÑ½¹Ñ…¥¹•È€ô…¹¡½É9½‘”ì(€€€€€€€€€€€ÍÑ…ÉÑ=™™Í•Ð€ô…¹¡½É=™™Í•Ðì(€€€€€€€€€€€ÍÑ…ÉÑQ•áÑ1…å•È€ô…¹¡½É1…å•Èì(€€€€€€€€€€€•¹‘½¹Ñ…¥¹•È€ô™½ÕÍ9½‘”ì(€€€€€€€€€€€•¹‘=™™Í•Ð€ô™½ÕÍ=™™Í•Ðì(€€€€€€€€€€€•¹‘Q•áÑ1…å•È€ô™½ÕÍ1…å•Èì(€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€ÍÑ…ÉÑ½¹Ñ…¥¹•È€ô™½ÕÍ9½‘”ì(€€€€€€€€€€€ÍÑ…ÉÑ=™™Í•Ð€ô™½ÕÍ=™™Í•Ðì(€€€€€€€€€€€ÍÑ…ÉÑQ•áÑ1…å•È€ô™½ÕÍ1…å•Èì(€€€€€€€€€€€•¹‘½¹Ñ…¥¹•È€ô…¹¡½É9½‘”ì(€€€€€€€€€€€•¹‘=™™Í•Ð€ô…¹¡½É=™™Í•Ðì(€€€€€€€€€€€•¹‘Q•áÑ1…å•È€ô…¹¡½É1…å•Èì(€€€€€€€€€ô(€€€€€€€ô(€€€€€ô(€€€€€½¹ÍÐ…Ñ¥Ù•Q•áÑ1…å•ÉÌ€ô½É‘•É•‘Q•áÑ1…å•ÉÌ¹™¥±Ñ•È¡Ñ•áÑ1…å•È€ôøÉ…¹”¹¥¹Ñ•ÉÍ•ÑÍ9½‘”¡Ñ•áÑ1…å•È¤¤ì(€€€€€¥˜€¡…Ñ¥Ù•Q•áÑ1…å•ÉÌ¹±•¹Ñ €ôôô€À¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€±•Ð‰½Õ¹‘…ÉåMÕ‰ÍÑ¥ÑÕÑ•€ô™…±Í”ì(€€€€€¥˜€ …ÍÑ…ÉÑQ•áÑ1…å•È¤ì(€€€€€€€ÍÑ…ÉÑQ•áÑ1…å•È€ô…Ñ¥Ù•Q•áÑ1…å•ÉÍlÁtì(€€€€€€€ÍÑ…ÉÑ½¹Ñ…¥¹•È€ôÍÑ…ÉÑQ•áÑ1…å•Èì(€€€€€€€ÍÑ…ÉÑ=™™Í•Ð€ô€Àì(€€€€€€€‰½Õ¹‘…ÉåMÕ‰ÍÑ¥ÑÕÑ•€ôÑÉÕ”ì(€€€€€ô(€€€€€¥˜€ …•¹‘Q•áÑ1…å•È¤ì(€€€€€€€•¹‘Q•áÑ1…å•È€ô…Ñ¥Ù•Q•áÑ1…å•ÉÌ¹…Ð ´Ä¤ì(€€€€€€€•¹‘½¹Ñ…¥¹•È€ô•¹‘Q•áÑ1…å•Èì(€€€€€€€•¹‘=™™Í•Ð€ô•¹‘Q•áÑ1…å•È¹¡¥±‘9½‘•Ì¹±•¹Ñ ì(€€€€€€€‰½Õ¹‘…ÉåMÕ‰ÍÑ¥ÑÕÑ•€ôÑÉÕ”ì(€€€€€ô(€€€€€¥˜€¡•¹‘½¹Ñ…¥¹•È¹¹½‘•QåÁ”€ôôô9½‘”¹159Q}9=¤ì(€€€€€€€¥˜€¡•¹‘½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰•¹‘=™½¹Ñ•¹Ðˆ¤¤ì(€€€€€€€€€½¹ÍÐÁÉ•Ù¥½ÕÍ9½‘”€ô•¹‘½¹Ñ…¥¹•È¹ÁÉ•Ù¥½ÕÍM¥‰±¥¹œì(€€€€€€€€€¥˜€ …ÁÉ•Ù¥½ÕÍ9½‘”¤ì(€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€ô(€€€€€€€€€•¹‘½¹Ñ…¥¹•È€ôÁÉ•Ù¥½ÕÍ9½‘”ì(€€€€€€€€€•¹‘=™™Í•Ð€ôÁÉ•Ù¥½ÕÍ9½‘”¹¹½‘•QåÁ”€ôôô9½‘”¹QaQ}9=€üÁÉ•Ù¥½ÕÍ9½‘”¹Ñ•áÑ½¹Ñ•¹Ð¹±•¹Ñ €èÁÉ•Ù¥½ÕÍ9½‘”¹¡¥±‘9½‘•Ì¹±•¹Ñ ì(€€€€€€€ô•±Í”¥˜€¡•¹‘½¹Ñ…¥¹•È¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰Ñ•áÑ1…å•Èˆ¤€˜˜•¹‘½¹Ñ…¥¹•È¹¡¥±‘9½‘•Ì¹±•¹Ñ €ôôô•¹‘=™™Í•Ð¤ì(€€€€€€€€€½¹ÍÐ¹½Éµ…±¥é•‘¹€ô¹½Éµ…±¥é•‘•	½Õ¹‘…Éä¡•¹‘½¹Ñ…¥¹•È°•¹‘=™™Í•Ð°•¹‘Q•áÑ1…å•È¤ì(€€€€€€€€€¥˜€ …¹½Éµ…±¥é•‘¹¤ì(€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€ô(€€€€€€€€€•¹‘½¹Ñ…¥¹•È€ô¹½Éµ…±¥é•‘¹¹½¹Ñ…¥¹•Èì(€€€€€€€€€•¹‘=™™Í•Ð€ô¹½Éµ…±¥é•‘¹¹½™™Í•Ðì(€€€€€€€ô(€€€€€ô(€€€€€¥˜€¡ÍÑ…ÉÑ½¹Ñ…¥¹•È¹¹½‘•QåÁ”€ôôô9½‘”¹159Q}9=¤ì(€€€€€€€½¹ÍÐ¹½Éµ…±¥é•‘MÑ…ÉÐ€ô¹½Éµ…±¥é•‘•	½Õ¹‘…Éä¡ÍÑ…ÉÑ½¹Ñ…¥¹•È°ÍÑ…ÉÑ=™™Í•Ð°ÍÑ…ÉÑQ•áÑ1…å•È¤ì(€€€€€€€¥˜€ …¹½Éµ…±¥é•‘MÑ…ÉÐ¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€ÍÑ…ÉÑ½¹Ñ…¥¹•È€ô¹½Éµ…±¥é•‘MÑ…ÉÐ¹½¹Ñ…¥¹•Èì(€€€€€€€ÍÑ…ÉÑ=™™Í•Ð€ô¹½Éµ…±¥é•‘MÑ…ÉÐ¹½™™Í•Ðì(€€€€€ô(€€€€€¥˜€¡ÍÑ…ÉÑQ•áÑ1…å•È€ôôô•¹‘Q•áÑ1…å•È€˜˜€…‰½Õ¹‘…ÉåMÕ‰ÍÑ¥ÑÕÑ•€˜˜…Ñ¥Ù•Q•áÑ1…å•ÉÌ¹¥¹±Õ‘•Ì¡ÍÑ…ÉÑQ•áÑ1…å•È¤¤ì(€€€€€€€É…¹•Ì¹ÁÕÍ ¡mÉ…¹”°ÍÑ…ÉÑQ•áÑ1…å•Ét¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€™½È€¡½¹ÍÐÑ•áÑ1…å•È½˜…Ñ¥Ù•Q•áÑ1…å•ÉÌ¤ì(€€€€€€€½¹ÍÐ™¥ÉÍÑ9½‘”€ôÑ•áÑ1…å•È¹™¥ÉÍÑ¡¥±ì(€€€€€€€¥˜€ …™¥ÉÍÑ9½‘”¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€½¹ÍÐÍÕ‰I…¹”€ô‘½Õµ•¹Ð¹É•…Ñ•I…¹” ¤ì(€€€€€€€¥˜€¡Ñ•áÑ1…å•È€ôôôÍÑ…ÉÑQ•áÑ1…å•È¤ì(€€€€€€€€€ÍÕ‰I…¹”¹Í•ÑMÑ…ÉÐ¡ÍÑ…ÉÑ½¹Ñ…¥¹•È°ÍÑ…ÉÑ=™™Í•Ð¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€ÍÕ‰I…¹”¹Í•ÑMÑ…ÉÑ	•™½É”¡™¥ÉÍÑ9½‘”¤ì(€€€€€€€ô(€€€€€€€¥˜€¡Ñ•áÑ1…å•È€ôôô•¹‘Q•áÑ1…å•È¤ì(€€€€€€€€€ÍÕ‰I…¹”¹Í•Ñ¹¡•¹‘½¹Ñ…¥¹•È°•¹‘=™™Í•Ð¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€½¹ÍÐ±…ÍÑ9½‘”€ôÑ•áÑ1…å•È¹±…ÍÑ¡¥±ì(€€€€€€€€€¥˜€ …±…ÍÑ9½‘”¤ì(€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€ô(€€€€€€€€€¥˜€¡±…ÍÑ9½‘”¹¹½‘•QåÁ”€ôôô9½‘”¹159Q}9=€˜˜±…ÍÑ9½‘”¹±…ÍÍ1¥ÍÐ¹½¹Ñ…¥¹Ì ‰•¹‘=™½¹Ñ•¹Ðˆ¤¤ì(€€€€€€€€€€€½¹ÍÐ±…ÍÑQ•áÑ9½‘”€ô±…ÍÑ9½‘”¹ÁÉ•Ù¥½ÕÍM¥‰±¥¹œì(€€€€€€€€€€€¥˜€ …±…ÍÑQ•áÑ9½‘”¤ì(€€€€€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€€€€€ô(€€€€€€€€€€€ÍÕ‰I…¹”¹Í•Ñ¹‘™Ñ•È¡±…ÍÑQ•áÑ9½‘”¤ì(€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€ÍÕ‰I…¹”¹Í•Ñ¹‘™Ñ•È¡±…ÍÑ9½‘”¤ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€€€¥˜€ …ÍÕ‰I…¹”¹½±±…ÁÍ•¤ì(€€€€€€€€€É…¹•Ì¹ÁÕÍ ¡mÍÕ‰I…¹”°Ñ•áÑ1…å•Ét¤ì(€€€€€€€ô(€€€€€ô(€€€ô(€€€½¹ÍÐÍ•±•Ñ•‘Q•áÑ1…å•ÉÌ€ô¹•ÜM•Ð¡É…¹•Ì¹µ…À¡É…¹”€ôøÉ…¹•lÅt¤¤ì(€€€™½È€¡½¹ÍÐÑ•áÑ1…å•È½˜Ñ¡¥Ì¸Ñ•áÑ1…å•ÉM•Ð¤ì(€€€€€¥˜€ …Í•±•Ñ•‘Q•áÑ1…å•ÉÌ¹¡…Ì¡Ñ•áÑ1…å•È¤¤ì(€€€€€€€Ñ¡¥Ì¸±•…¹ÕÁQ•áÑ1…å•ÉM•±•Ñ¥½¸¡Ñ•áÑ1…å•È¤ì(€€€€€ô(€€€ô(€€€™½È€¡½¹ÍÐmÉ…¹”°Ñ•áÑ1…å•Ét½˜É…¹•Ì¤ì(€€€€€½¹ÍÐÑ•áÑ1…å•É…Ñ„€ôÉ…Ý1…å•È¸Ñ•áÑ1…å•ÉÌ¹•Ð¡Ñ•áÑ1…å•È¤ì(€€€€€¥˜€ …Ñ•áÑ1…å•É…Ñ„¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€±•ÐÉ½Ñ…Ñ½È€ôÉ½Ñ…Ñ½ÉÌ¹•Ð¡Ñ•áÑ1…å•È¤ì(€€€€€¥˜€ …É½Ñ…Ñ½È¤ì(€€€€€€€½¹ÍÐ±¥•¹ÑI•Ð€ôÑ•áÑ1…å•È¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ð ¤ì(€€€€€€€É½Ñ…Ñ½È€ô€¡à°ä°Ü° ¤€ôø€¡ì(€€€€€€€€€àè€¡à€´±¥•¹ÑI•Ð¹à¤€¼±¥•¹ÑI•Ð¹Ý¥‘Ñ °(€€€€€€€€€äè€¡ä€´±¥•¹ÑI•Ð¹ä¤€¼±¥•¹ÑI•Ð¹¡•¥¡Ð°(€€€€€€€€€Ý¥‘Ñ èÜ€¼±¥•¹ÑI•Ð¹Ý¥‘Ñ °(€€€€€€€€€¡•¥¡Ðè €¼±¥•¹ÑI•Ð¹¡•¥¡Ð(€€€€€€€ô¤ì(€€€€€€€É½Ñ…Ñ½ÉÌ¹Í•Ð¡Ñ•áÑ1…å•È°É½Ñ…Ñ½È¤ì(€€€€€ô(€€€€€½¹ÍÐ‰½á•Ì€ômtì(€€€€€™½È€¡±•Ðì(€€€€€€€à°(€€€€€€€ä°(€€€€€€€Ý¥‘Ñ °(€€€€€€€¡•¥¡Ð(€€€€€ô½˜É…¹”¹•Ñ±¥•¹ÑI•ÑÌ ¤¤ì(€€€€€€€¥˜€¡Ý¥‘Ñ €ôôô€Àñð¡•¥¡Ð€ôôô€À¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€€¡ì(€€€€€€€€€à°(€€€€€€€€€ä°(€€€€€€€€€Ý¥‘Ñ °(€€€€€€€€€¡•¥¡Ð(€€€€€€€ô€ôÉ½Ñ…Ñ½È¡à°ä°Ý¥‘Ñ °¡•¥¡Ð¤¤ì(€€€€€€€¥˜€¡Ý¥‘Ñ €ôôô€Ä€˜˜¡•¥¡Ð€ôôô€Ä¤ì(€€€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€€€ô(€€€€€€€‰½á•Ì¹ÁÕÍ ¡4‘íáô€‘íåô ‘íÝ¥‘Ñ¡ôØ‘í¡•¥¡Ñô ´‘íÝ¥‘Ñ¡ôi€¤ì(€€€€€ô(€€€€€¥˜€¡‰½á•Ì¹±•¹Ñ €ôôô€À¤ì(€€€€€€€½¹Ñ¥¹Õ”ì(€€€€€ô(€€€€€½¹ÍÐ‘É…Ý1…å•È€ôÑ•áÑ1…å•É…Ñ„¹‘É…Ý1…å•Èì(€€€€€±•Ð‘¥Ø€ôÑ•áÑ1…å•É…Ñ„¹Í•±•Ñ¥½¹¥Øì(€€€€€±•ÐÁ…Ñ €ôÑ•áÑ1…å•É…Ñ„¹Á…Ñ ì(€€€€€¥˜€ …‘¥Ø¤ì(€€€€€€€½¹ÍÐ±¥ÁA…Ñ¡%€ô±¥Á}Í•±•Ñ¥½¹|‘íÉ…Ý1…å•È¸Í•±•Ñ¥½¹%¬­õ€ì(€€€€€€€‘¥Ø€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€€€€€‘¥Ø¹±…ÍÍ9…µ”€ô€‰Í•±•Ñ¥½¸ˆì(€€€€€€€‘¥Ø¹ÍÑå±”¹±¥ÁA…Ñ €ôÕÉ° Œ‘í±¥ÁA…Ñ¡%‘ô¥€ì(€€€€€€€½¹ÍÐÍ•±•Ñ¥½¹MÑå±”€ô‘É…Ý1…å•È¸™¥±Ñ•É…Ñ½Éäü¹É•…Ñ•M•±•Ñ¥½¹MÑå±”¡‘É…Ý1…å•È¸Á…•½±½ÉÌ¤ì(€€€€€€€¥˜€¡Í•±•Ñ¥½¹MÑå±”¤ì(€€€€€€€€€™½È€¡½¹ÍÐm¹…µ”°Ù…±Õ•t½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡Í•±•Ñ¥½¹MÑå±”¤¤ì(€€€€€€€€€€€‘¥Ø¹ÍÑå±”¹Í•ÑAÉ½Á•ÉÑä¡¹…µ”°Ù…±Õ”¤ì(€€€€€€€€€ô(€€€€€€€ô(€€€€€€€½¹ÍÐÍÙœ€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ” Ä°€Ä°ÑÉÕ”¤ì(€€€€€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µ¡¥‘‘•¸ˆ°€‰ÑÉÕ”ˆ¤ì(€€€€€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ý¥‘Ñ ˆ°€ˆÄÀÀ”ˆ¤ì(€€€€€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡•¥¡Ðˆ°€ˆÄÀÀ”ˆ¤ì(€€€€€€€½¹ÍÐ±¥ÁA…Ñ €ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰±¥ÁA…Ñ ˆ¤ì(€€€€€€€±¥ÁA…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¥ˆ°±¥ÁA…Ñ¡%¤ì(€€€€€€€±¥ÁA…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰±¥ÁA…Ñ¡U¹¥ÑÌˆ°€‰½‰©•Ñ	½Õ¹‘¥¹	½àˆ¤ì(€€€€€€€Á…Ñ €ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰Á…Ñ ˆ¤ì(€€€€€€€±¥ÁA…Ñ ¹…ÁÁ•¹¡Á…Ñ ¤ì(€€€€€€€ÍÙœ¹…ÁÁ•¹¡±¥ÁA…Ñ ¤ì(€€€€€€€‘¥Ø¹…ÁÁ•¹¡ÍÙœ¤ì(€€€€€€€Ñ•áÑ1…å•É…Ñ„¹Á…Ñ €ôÁ…Ñ ì(€€€€€€€Ñ•áÑ1…å•É…Ñ„¹Í•±•Ñ¥½¹¥Ø€ô‘¥Øì(€€€€€ô(€€€€€¥˜€¡‘É…Ý1…å•È¸Á…É•¹Ð€˜˜‘¥Ø¹Á…É•¹Ñ9½‘”€„ôô‘É…Ý1…å•È¸Á…É•¹Ð¤ì(€€€€€€€‘É…Ý1…å•È¸Á…É•¹Ð¹…ÁÁ•¹¡‘¥Ø¤ì(€€€€€€€Ñ¡¥Ì¸Í•±•Ñ¥½¹Ì¹…‘¡‘¥Ø¤ì(€€€€€ô(€€€€€Á…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ˆ°‰½á•Ì¹©½¥¸ ˆ€ˆ¤¤ì(€€€ô(€ô(€ÍÑ…Ñ¥Œ•Ð}ÍÙ…Ñ½Éä ¤ì(€€€É•ÑÕÉ¸Í¡…‘½Ü¡Ñ¡¥Ì°€‰}ÍÙ…Ñ½Éäˆ°¹•Ü=5MY…Ñ½Éä ¤¤ì(€ô(€ÍÑ…Ñ¥Œ€Í•Ñ	½à¡•±•µ•¹Ð°mà°ä°Ý¥‘Ñ °¡•¥¡Ñt¤ì(€€€½¹ÍÐì(€€€€€ÍÑå±”(€€€ô€ô•±•µ•¹Ðì(€€€ÍÑå±”¹Ñ½À€ô€‘ìÄÀÀ€¨åô•€ì(€€€ÍÑå±”¹±•™Ð€ô€‘ìÄÀÀ€¨áô•€ì(€€€ÍÑå±”¹Ý¥‘Ñ €ô€‘ìÄÀÀ€¨Ý¥‘Ñ¡ô•€ì(€€€ÍÑå±”¹¡•¥¡Ð€ô€‘ìÄÀÀ€¨¡•¥¡Ñô•€ì(€ô(€€É•…Ñ•MY ¤ì(€€€½¹ÍÐÍÙœ€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ” Ä°€Ä°ÑÉÕ”¤ì(€€€Ñ¡¥Ì¸Á…É•¹Ð¹…ÁÁ•¹¡ÍÙœ¤ì(€€€ÍÙœ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰…É¥„µ¡¥‘‘•¸ˆ°€‰ÑÉÕ”ˆ¤ì(€€€É•ÑÕÉ¸ÍÙœì(€ô(€€É•…Ñ•±¥ÁA…Ñ ¡‘•™Ì°Á…Ñ¡%¤ì(€€€½¹ÍÐ±¥ÁA…Ñ €ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰±¥ÁA…Ñ ˆ¤ì(€€€‘•™Ì¹…ÁÁ•¹¡±¥ÁA…Ñ ¤ì(€€€½¹ÍÐ±¥ÁA…Ñ¡%€ô±¥Á|‘íÁ…Ñ¡%‘õ€ì(€€€±¥ÁA…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¥ˆ°±¥ÁA…Ñ¡%¤ì(€€€±¥ÁA…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰±¥ÁA…Ñ¡U¹¥ÑÌˆ°€‰½‰©•Ñ	½Õ¹‘¥¹	½àˆ¤ì(€€€½¹ÍÐ±¥ÁA…Ñ¡UÍ”€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÕÍ”ˆ¤ì(€€€±¥ÁA…Ñ ¹…ÁÁ•¹¡±¥ÁA…Ñ¡UÍ”¤ì(€€€±¥ÁA…Ñ¡UÍ”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡É•˜ˆ°€Œ‘íÁ…Ñ¡%‘õ€¤ì(€€€±¥ÁA…Ñ¡UÍ”¹±…ÍÍ1¥ÍÐ¹…‘ ‰±¥Àˆ¤ì(€€€É•ÑÕÉ¸±¥ÁA…Ñ¡%ì(€ô(€€ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡•±•µ•¹Ð°ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€™½È€¡½¹ÍÐm­•ä°Ù…±Õ•t½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡ÁÉ½Á•ÉÑ¥•Ì¤¤ì(€€€€€¥˜€¡Ù…±Õ”€ôôô¹Õ±°¤ì(€€€€€€€•±•µ•¹Ð¹É•µ½Ù•ÑÑÉ¥‰ÕÑ”¡­•ä¤ì(€€€€€ô•±Í”ì(€€€€€€€•±•µ•¹Ð¹Í•ÑÑÑÉ¥‰ÕÑ”¡­•ä°Ù…±Õ”¤ì(€€€€€ô(€€€ô(€ô(€‘É…Ü¡ÁÉ½Á•ÉÑ¥•Ì°¥ÍA…Ñ¡UÁ‘…Ñ…‰±”€ô™…±Í”°¡…Í±¥À€ô™…±Í”¤ì(€€€½¹ÍÐ¥€ôÉ…Ý1…å•È¸¥¬¬ì(€€€½¹ÍÐÉ½½Ð€ôÑ¡¥Ì¸É•…Ñ•MY ¤ì(€€€½¹ÍÐ‘•™Ì€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰‘•™Ìˆ¤ì(€€€É½½Ð¹…ÁÁ•¹¡‘•™Ì¤ì(€€€½¹ÍÐÁ…Ñ €ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰Á…Ñ ˆ¤ì(€€€‘•™Ì¹…ÁÁ•¹¡Á…Ñ ¤ì(€€€½¹ÍÐÁ…Ñ¡%€ôÁ…Ñ¡|‘í¥‘õ€ì(€€€Á…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¥ˆ°Á…Ñ¡%¤ì(€€€Á…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ù•Ñ½Èµ•™™•Ðˆ°€‰¹½¸µÍ…±¥¹œµÍÑÉ½­”ˆ¤ì(€€€¥˜€¡¥ÍA…Ñ¡UÁ‘…Ñ…‰±”¤ì(€€€€€Ñ¡¥Ì¸Ñ½UÁ‘…Ñ”¹Í•Ð¡¥°Á…Ñ ¤ì(€€€ô(€€€½¹ÍÐ±¥ÁA…Ñ¡%€ô¡…Í±¥À€üÑ¡¥Ì¸É•…Ñ•±¥ÁA…Ñ ¡‘•™Ì°Á…Ñ¡%¤€è¹Õ±°ì(€€€½¹ÍÐÕÍ”€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÕÍ”ˆ¤ì(€€€É½½Ð¹…ÁÁ•¹¡ÕÍ”¤ì(€€€ÕÍ”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡É•˜ˆ°€Œ‘íÁ…Ñ¡%‘õ€¤ì(€€€Ñ¡¥Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡É½½Ð°ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹Í•Ð¡¥°É½½Ð¤ì(€€€É•ÑÕÉ¸ì(€€€€€¥°(€€€€€±¥ÁA…Ñ¡%èÕÉ° Œ‘í±¥ÁA…Ñ¡%‘ô¥€(€€€ôì(€ô(€‘É…Ý=ÕÑ±¥¹”¡ÁÉ½Á•ÉÑ¥•Ì°µÕÍÑI•µ½Ù•M•±™%¹Ñ•ÉÍ•Ñ¥½¹Ì¤ì(€€€½¹ÍÐ¥€ôÉ…Ý1…å•È¸¥¬¬ì(€€€½¹ÍÐÉ½½Ð€ôÑ¡¥Ì¸É•…Ñ•MY ¤ì(€€€½¹ÍÐ‘•™Ì€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰‘•™Ìˆ¤ì(€€€É½½Ð¹…ÁÁ•¹¡‘•™Ì¤ì(€€€½¹ÍÐÁ…Ñ €ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰Á…Ñ ˆ¤ì(€€€‘•™Ì¹…ÁÁ•¹¡Á…Ñ ¤ì(€€€½¹ÍÐÁ…Ñ¡%€ôÁ…Ñ¡|‘í¥‘õ€ì(€€€Á…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¥ˆ°Á…Ñ¡%¤ì(€€€Á…Ñ ¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ù•Ñ½Èµ•™™•Ðˆ°€‰¹½¸µÍ…±¥¹œµÍÑÉ½­”ˆ¤ì(€€€±•Ðµ…Í­%ì(€€€¥˜€¡µÕÍÑI•µ½Ù•M•±™%¹Ñ•ÉÍ•Ñ¥½¹Ì¤ì(€€€€€½¹ÍÐµ…Í¬€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰µ…Í¬ˆ¤ì(€€€€€‘•™Ì¹…ÁÁ•¹¡µ…Í¬¤ì(€€€€€µ…Í­%€ôµ…Í­|‘í¥‘õ€ì(€€€€€µ…Í¬¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¥ˆ°µ…Í­%¤ì(€€€€€µ…Í¬¹Í•ÑÑÑÉ¥‰ÕÑ” ‰µ…Í­U¹¥ÑÌˆ°€‰½‰©•Ñ	½Õ¹‘¥¹	½àˆ¤ì(€€€€€½¹ÍÐÉ•Ð€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰É•Ðˆ¤ì(€€€€€µ…Í¬¹…ÁÁ•¹¡É•Ð¤ì(€€€€€É•Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰Ý¥‘Ñ ˆ°€ˆÄˆ¤ì(€€€€€É•Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡•¥¡Ðˆ°€ˆÄˆ¤ì(€€€€€É•Ð¹Í•ÑÑÑÉ¥‰ÕÑ” ‰™¥±°ˆ°€‰Ý¡¥Ñ”ˆ¤ì(€€€€€½¹ÍÐÕÍ”€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÕÍ”ˆ¤ì(€€€€€µ…Í¬¹…ÁÁ•¹¡ÕÍ”¤ì(€€€€€ÕÍ”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡É•˜ˆ°€Œ‘íÁ…Ñ¡%‘õ€¤ì(€€€€€ÕÍ”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰ÍÑÉ½­”ˆ°€‰¹½¹”ˆ¤ì(€€€€€ÕÍ”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰™¥±°ˆ°€‰‰±…¬ˆ¤ì(€€€€€ÕÍ”¹Í•ÑÑÑÉ¥‰ÕÑ” ‰™¥±°µÉÕ±”ˆ°€‰¹½¹é•É¼ˆ¤ì(€€€€€ÕÍ”¹±…ÍÍ1¥ÍÐ¹…‘ ‰µ…Í¬ˆ¤ì(€€€ô(€€€½¹ÍÐÕÍ”Ä€ôÉ…Ý1…å•È¹}ÍÙ…Ñ½Éä¹É•…Ñ•±•µ•¹Ð ‰ÕÍ”ˆ¤ì(€€€É½½Ð¹…ÁÁ•¹¡ÕÍ”Ä¤ì(€€€ÕÍ”Ä¹Í•ÑÑÑÉ¥‰ÕÑ” ‰¡É•˜ˆ°€Œ‘íÁ…Ñ¡%‘õ€¤ì(€€€¥˜€¡µ…Í­%¤ì(€€€€€ÕÍ”Ä¹Í•ÑÑÑÉ¥‰ÕÑ” ‰µ…Í¬ˆ°ÕÉ° Œ‘íµ…Í­%‘ô¥€¤ì(€€€ô(€€€½¹ÍÐÕÍ”È€ôÕÍ”Ä¹±½¹•9½‘” ¤ì(€€€É½½Ð¹…ÁÁ•¹¡ÕÍ”È¤ì(€€€ÕÍ”Ä¹±…ÍÍ1¥ÍÐ¹…‘ ‰µ…¥¹=ÕÑ±¥¹”ˆ¤ì(€€€ÕÍ”È¹±…ÍÍ1¥ÍÐ¹…‘ ‰Í•½¹‘…Éå=ÕÑ±¥¹”ˆ¤ì(€€€Ñ¡¥Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡É½½Ð°ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹Í•Ð¡¥°É½½Ð¤ì(€€€É•ÑÕÉ¸¥ì(€ô(€™¥¹…±¥é•É…Ü¡¥°ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€Ñ¡¥Ì¸Ñ½UÁ‘…Ñ”¹‘•±•Ñ”¡¥¤ì(€€€Ñ¡¥Ì¹ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡¥°ÁÉ½Á•ÉÑ¥•Ì¤ì(€ô(€ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡•±•µ•¹Ñ=É%°ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€¥˜€ …ÁÉ½Á•ÉÑ¥•Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐì(€€€€€É½½Ð°(€€€€€‰‰½à°(€€€€€É½½Ñ±…ÍÌ°(€€€€€Á…Ñ (€€€ô€ôÁÉ½Á•ÉÑ¥•Ìì(€€€½¹ÍÐ•±•µ•¹Ð€ôÑåÁ•½˜•±•µ•¹Ñ=É%€ôôô€‰¹Õµ‰•Èˆ€üÑ¡¥Ì¸µ…ÁÁ¥¹œ¹•Ð¡•±•µ•¹Ñ=É%¤€è•±•µ•¹Ñ=É%ì(€€€¥˜€ …•±•µ•¹Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡É½½Ð¤ì(€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡•±•µ•¹Ð°É½½Ð¤ì(€€€ô(€€€¥˜€¡‰‰½à¤ì(€€€€€É…Ý1…å•È¸Í•Ñ	½à¡•±•µ•¹Ð°‰‰½à¤ì(€€€ô(€€€¥˜€¡É½½Ñ±…ÍÌ¤ì(€€€€€½¹ÍÐì(€€€€€€€±…ÍÍ1¥ÍÐ(€€€€€ô€ô•±•µ•¹Ðì(€€€€€™½È€¡½¹ÍÐm±…ÍÍ9…µ”°Ù…±Õ•t½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡É½½Ñ±…ÍÌ¤¤ì(€€€€€€€±…ÍÍ1¥ÍÐ¹Ñ½±”¡±…ÍÍ9…µ”°Ù…±Õ”¤ì(€€€€€ô(€€€ô(€€€¥˜€¡Á…Ñ ¤ì(€€€€€½¹ÍÐ‘•™Ì€ô•±•µ•¹Ð¹™¥ÉÍÑ±•µ•¹Ñ¡¥±ì(€€€€€½¹ÍÐÁ…Ñ¡±•µ•¹Ð€ô‘•™Ì¹™¥ÉÍÑ±•µ•¹Ñ¡¥±ì(€€€€€Ñ¡¥Ì¸ÕÁ‘…Ñ•AÉ½Á•ÉÑ¥•Ì¡Á…Ñ¡±•µ•¹Ð°Á…Ñ ¤ì(€€€ô(€ô(€ÕÁ‘…Ñ•A…É•¹Ð¡¥°±…å•È¤ì(€€€¥˜€¡±…å•È€ôôôÑ¡¥Ì¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹ÍÐÉ½½Ð€ôÑ¡¥Ì¸µ…ÁÁ¥¹œ¹•Ð¡¥¤ì(€€€¥˜€ …É½½Ð¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€±…å•È¸Á…É•¹Ð¹…ÁÁ•¹¡É½½Ð¤ì(€€€Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹‘•±•Ñ”¡¥¤ì(€€€±…å•È¸µ…ÁÁ¥¹œ¹Í•Ð¡¥°É½½Ð¤ì(€ô(€É•µ½Ù”¡¥¤ì(€€€Ñ¡¥Ì¸Ñ½UÁ‘…Ñ”¹‘•±•Ñ”¡¥¤ì(€€€¥˜€¡Ñ¡¥Ì¸Á…É•¹Ð€ôôô¹Õ±°¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹•Ð¡¥¤¹É•µ½Ù” ¤ì(€€€Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹‘•±•Ñ”¡¥¤ì(€ô(€‘•ÍÑÉ½ä ¤ì(€€€Ñ¡¥Ì¸Á…É•¹Ð€ô¹Õ±°ì(€€€™½È€¡½¹ÍÐÉ½½Ð½˜Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹Ù…±Õ•Ì ¤¤ì(€€€€€É½½Ð¹É•µ½Ù” ¤ì(€€€ô(€€€Ñ¡¥Ì¸µ…ÁÁ¥¹œ¹±•…È ¤ì(€€€Ñ¡¥Ì¸Ñ½UÁ‘…Ñ”¹±•…È ¤ì(€€€Ñ¡¥Ì¸Ñ•áÑ1…å•É=‰Í•ÉÙ•Èü¹‘¥Í½¹¹•Ð ¤ì(€€€Ñ¡¥Ì¸Ñ•áÑ1…å•É=‰Í•ÉÙ•È€ô¹Õ±°ì(€€€¥˜€¡Ñ¡¥Ì¸Ñ•áÑ1…å•È¤ì(€€€€€½¹ÍÐ‘…Ñ„€ôÉ…Ý1…å•È¸Ñ•áÑ1…å•ÉÌ¹•Ð¡Ñ¡¥Ì¸Ñ•áÑ1…å•È¤ì(€€€€€¥˜€¡‘…Ñ„ü¹‘É…Ý1…å•È€ôôôÑ¡¥Ì¤ì(€€€€€€€É…Ý1…å•È¸±•…¹ÕÁQ•áÑ1…å•ÉM•±•Ñ¥½¸¡Ñ¡¥Ì¸Ñ•áÑ1…å•È¤ì(€€€€€€€É…Ý1…å•È¸Ñ•áÑ1…å•ÉÌ¹‘•±•Ñ”¡Ñ¡¥Ì¸Ñ•áÑ1…å•È¤ì(€€€€€€€É…Ý1…å•È¸Ñ•áÑ1…å•ÉM•Ð¹‘•±•Ñ”¡Ñ¡¥Ì¸Ñ•áÑ1…å•È¤ì(€€€€€€€¥˜€¡É…Ý1…å•È¸Ñ•áÑ1…å•ÉM•Ð¹Í¥é”€ôôô€À¤ì(€€€€€€€€€É…Ý1…å•È¸Í•±•Ñ¥½¹¡…¹•ü¹…‰½ÉÐ ¤ì(€€€€€€€€€É…Ý1…å•È¸Í•±•Ñ¥½¹¡…¹•€ô¹Õ±°ì(€€€€€€€€€É…Ý1…å•È¸¥ÍM•±•Ñ¥¹œ€ô™…±Í”ì(€€€€€€€ô(€€€€€ô(€€€€€Ñ¡¥Ì¸Ñ•áÑ1…å•È€ô¹Õ±°ì(€€€ô(€ô)ô((ì¼¼€¸½ÍÉŒ½‘¥ÍÁ±…ä½Ñ•áÑ}±…å•É}¥µ…•Ì¹©Ì()™Õ¹Ñ¥½¸Á•É•¹Ñ…”¡Ù…±Õ”¤ì(€É•ÑÕÉ¸€‘ì¡Ù…±Õ”€¨€ÄÀÀ¤¹Ñ½¥á• È¥ô•€ì)ô)±…ÍÌQ•áÑ1…å•É%µ…•Ìì(€€½½É‘¥¹…Ñ•Ì€ômtì(€€½½É‘¥¹…Ñ•Í	å±•µ•¹Ð€ô¹•Ü5…À ¤ì(€€•ÑA…•…¹Ù…Ì€ô¹Õ±°ì(€€µ¥¹M¥é”€ô€Àì(€€Á…•]¥‘Ñ €ô€Àì(€€Á…•!•¥¡Ð€ô€Àì(€ÍÑ…Ñ¥Œ€…Ñ¥Ù•%µ…”€ô¹Õ±°ì(€½¹ÍÑÉÕÑ½È¡µ¥¹M¥é”°½½É‘¥¹…Ñ•Ì°Ù¥•ÝÁ½ÉÐ°•ÑA…•…¹Ù…Ì¤ì(€€€Ñ¡¥Ì¸µ¥¹M¥é”€ôµ¥¹M¥é”ì(€€€Ñ¡¥Ì¸½½É‘¥¹…Ñ•Ì€ô½½É‘¥¹…Ñ•Ìì(€€€Ñ¡¥Ì¸Á…•]¥‘Ñ €ôÙ¥•ÝÁ½ÉÐ¹É…Ý¥µÌ¹Á…•]¥‘Ñ ì(€€€Ñ¡¥Ì¸Á…•!•¥¡Ð€ôÙ¥•ÝÁ½ÉÐ¹É…Ý¥µÌ¹Á…•!•¥¡Ðì(€€€Ñ¡¥Ì¸•ÑA…•…¹Ù…Ì€ô•ÑA…•…¹Ù…Ìì(€ô(€É•¹‘•È ¤ì(€€€½¹ÍÐ½¹Ñ…¥¹•È€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰‘¥Øˆ¤ì(€€€½¹Ñ…¥¹•È¹±…ÍÍ9…µ”€ô€‰Ñ•áÑ1…å•É%µ…•Ìˆì(€€€™½È€¡±•Ð¤€ô€Àì¤€ðÑ¡¥Ì¸½½É‘¥¹…Ñ•Ì¹±•¹Ñ ì¤€¬ô€Ø¤ì(€€€€€½¹ÍÐ•°€ôÑ¡¥Ì¸É•…Ñ•%µ…•A±…•¡½±‘•È¡Ñ¡¥Ì¸½½É‘¥¹…Ñ•Ì¹ÍÕ‰…ÉÉ…ä¡¤°¤€¬€Ø¤¤ì(€€€€€¥˜€¡•°¤ì(€€€€€€€½¹Ñ…¥¹•È¹…ÁÁ•¹¡•°¤ì(€€€€€ô(€€€ô(€€€½¹Ñ…¥¹•È¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰½¹Ñ•áÑµ•¹Ôˆ°•Ù•¹Ð€ôøì(€€€€€¥˜€ „¡•Ù•¹Ð¹Ñ…É•Ð¥¹ÍÑ…¹•½˜!Q51…¹Ù…Í±•µ•¹Ð¤¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€½¹ÍÐ¥µ±•µ•¹Ð€ô•Ù•¹Ð¹Ñ…É•Ðì(€€€€€½¹ÍÐ½½É‘Ì€ôÑ¡¥Ì¸½½É‘¥¹…Ñ•Í	å±•µ•¹Ð¹•Ð¡¥µ±•µ•¹Ð¤ì(€€€€€¥˜€ …½½É‘Ì¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€½¹ÍÐ…Ñ¥Ù•%µ…”€ôQ•áÑ1…å•É%µ…•Ì¸…Ñ¥Ù•%µ…”ü¹‘•É•˜ ¤ì(€€€€€¥˜€¡…Ñ¥Ù•%µ…”€ôôô¥µ±•µ•¹Ð¤ì(€€€€€€€É•ÑÕÉ¸ì(€€€€€ô(€€€€€¥˜€¡…Ñ¥Ù•%µ…”¤ì(€€€€€€€…Ñ¥Ù•%µ…”¹Ý¥‘Ñ €ô€Àì(€€€€€€€…Ñ¥Ù•%µ…”¹¡•¥¡Ð€ô€Àì(€€€€€ô(€€€€€Q•áÑ1…å•É%µ…•Ì¸…Ñ¥Ù•%µ…”€ô¹•Ü]•…­I•˜¡¥µ±•µ•¹Ð¤ì(€€€€€½¹ÍÐì(€€€€€€€¥¹Ù•ÉÍ•QÉ…¹Í™½É´°(€€€€€€€àÄ°(€€€€€€€äÄ°(€€€€€€€Ý¥‘Ñ °(€€€€€€€¡•¥¡Ð(€€€€€ô€ô½½É‘Ìì(€€€€€½¹ÍÐÁ…•…¹Ù…Ì€ôÑ¡¥Ì¸•ÑA…•…¹Ù…Ì ¤ì(€€€€€½¹ÍÐ¥µ…•`Ä€ô5…Ñ ¹•¥°¡àÄ€¨Á…•…¹Ù…Ì¹Ý¥‘Ñ ¤ì(€€€€€½¹ÍÐ¥µ…•dÄ€ô5…Ñ ¹•¥°¡äÄ€¨Á…•…¹Ù…Ì¹¡•¥¡Ð¤ì(€€€€€½¹ÍÐ¥µ…•`È€ô5…Ñ ¹™±½½È ¡àÄ€¬Ý¥‘Ñ €¼Ñ¡¥Ì¸Á…•]¥‘Ñ ¤€¨Á…•…¹Ù…Ì¹Ý¥‘Ñ ¤ì(€€€€€½¹ÍÐ¥µ…•dÈ€ô5…Ñ ¹™±½½È ¡äÄ€¬¡•¥¡Ð€¼Ñ¡¥Ì¸Á…•!•¥¡Ð¤€¨Á…•…¹Ù…Ì¹¡•¥¡Ð¤ì(€€€€€¥µ±•µ•¹Ð¹Ý¥‘Ñ €ô¥µ…•`È€´¥µ…•`Äì(€€€€€¥µ±•µ•¹Ð¹¡•¥¡Ð€ô¥µ…•dÈ€´¥µ…•dÄì(€€€€€½¹ÍÐÑà€ô¥µ±•µ•¹Ð¹•Ñ½¹Ñ•áÐ ˆÉˆ¤ì(€€€€€Ñà¹Í•ÑQÉ…¹Í™½É´ ¸¸¹¥¹Ù•ÉÍ•QÉ…¹Í™½É´¤ì(€€€€€Ñà¹ÑÉ…¹Í±…Ñ” µ¥µ…•`Ä°€µ¥µ…•dÄ¤ì(€€€€€Ñà¹‘É…Ý%µ…”¡Á…•…¹Ù…Ì°€À°€À¤ì(€€€ô¤ì(€€€É•ÑÕÉ¸½¹Ñ…¥¹•Èì(€ô(€€É•…Ñ•%µ…•A±…•¡½±‘•È¡màÄ°äÄ°àÈ°äÈ°àÌ°äÍt¤ì(€€€½¹ÍÐÝ¥‘Ñ €ô5…Ñ ¹¡åÁ½Ð ¡àÌ€´àÄ¤€¨Ñ¡¥Ì¸Á…•]¥‘Ñ °€¡äÌ€´äÄ¤€¨Ñ¡¥Ì¸Á…•!•¥¡Ð¤ì(€€€½¹ÍÐ¡•¥¡Ð€ô5…Ñ ¹¡åÁ½Ð ¡àÈ€´àÄ¤€¨Ñ¡¥Ì¸Á…•]¥‘Ñ °€¡äÈ€´äÄ¤€¨Ñ¡¥Ì¸Á…•!•¥¡Ð¤ì(€€€¥˜€¡Ý¥‘Ñ €ðÑ¡¥Ì¸µ¥¹M¥é”ñð¡•¥¡Ð€ðÑ¡¥Ì¸µ¥¹M¥é”¤ì(€€€€€É•ÑÕÉ¸¹Õ±°ì(€€€ô(€€€½¹ÍÐÑÉ…¹Í™½É´€ôl¡àÌ€´àÄ¤€¨Ñ¡¥Ì¸Á…•]¥‘Ñ €¼Ý¥‘Ñ °€¡äÌ€´äÄ¤€¨Ñ¡¥Ì¸Á…•!•¥¡Ð€¼Ý¥‘Ñ °€¡àÈ€´àÄ¤€¨Ñ¡¥Ì¸Á…•]¥‘Ñ €¼¡•¥¡Ð°€¡äÈ€´äÄ¤€¨Ñ¡¥Ì¸Á…•!•¥¡Ð€¼¡•¥¡Ð°€À°€Átì(€€€½¹ÍÐ¥¹Ù•ÉÍ•QÉ…¹Í™½É´€ôUÑ¥°¹¥¹Ù•ÉÍ•QÉ…¹Í™½É´¡ÑÉ…¹Í™½É´¤ì(€€€½¹ÍÐ¥µ±•µ•¹Ð€ô‘½Õµ•¹Ð¹É•…Ñ•±•µ•¹Ð ‰…¹Ù…Ìˆ¤ì(€€€¥µ±•µ•¹Ð¹±…ÍÍ9…µ”€ô€‰Ñ•áÑ1…å•É%µ…•A±…•¡½±‘•Èˆì(€€€¥µ±•µ•¹Ð¹Ý¥‘Ñ €ô€Àì(€€€¥µ±•µ•¹Ð¹¡•¥¡Ð€ô€Àì(€€€=‰©•Ð¹…ÍÍ¥¸¡¥µ±•µ•¹Ð¹ÍÑå±”°ì(€€€€€½Á…¥Ñäè€À°(€€€€€Á½Í¥Ñ¥½¸è€‰…‰Í½±ÕÑ”ˆ°(€€€€€±•™ÐèÁ•É•¹Ñ…”¡àÄ¤°(€€€€€Ñ½ÀèÁ•É•¹Ñ…”¡äÄ¤°(€€€€€Ý¥‘Ñ èÁ•É•¹Ñ…”¡Ý¥‘Ñ €¼Ñ¡¥Ì¸Á…•]¥‘Ñ ¤°(€€€€€¡•¥¡ÐèÁ•É•¹Ñ…”¡¡•¥¡Ð€¼Ñ¡¥Ì¸Á…•!•¥¡Ð¤°(€€€€€ÑÉ…¹Í™½Éµ=É¥¥¸è€ˆÀ”€À”ˆ°(€€€€€ÑÉ…¹Í™½É´èµ…ÑÉ¥à ‘íÑÉ…¹Í™½É´¹©½¥¸ ˆ°ˆ¥ô¥€(€€€ô¤ì(€€€Ñ¡¥Ì¸½½É‘¥¹…Ñ•Í	å±•µ•¹Ð¹Í•Ð¡¥µ±•µ•¹Ð°ì(€€€€€¥¹Ù•ÉÍ•QÉ…¹Í™½É´°(€€€€€Ý¥‘Ñ °(€€€€€¡•¥¡Ð°(€€€€€àÄ°(€€€€€äÄ(€€€ô¤ì(€€€É•ÑÕÉ¸¥µ±•µ•¹Ðì(€ô)ô((ì¼¼€¸½ÍÉŒ½Á‘˜¹©Ì(((((((((((((((((()ì(€±½‰…±Q¡¥Ì¹}Á‘™©ÍQ•ÍÑ¥¹UÑ¥±Ì€ôì(€€€!¥¡±¥¡Ñ=ÕÑ±¥¹•Èè!¥¡±¥¡Ñ=ÕÑ±¥¹•È(€ôì)ô)±½‰…±Q¡¥Ì¹Á‘™©Í1¥ˆ€ôì(€‰½ÉÑá•ÁÑ¥½¸è‰½ÉÑá•ÁÑ¥½¸°(€¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•Èè¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È°(€¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”°(€¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”è¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”°(€¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•Èè¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•È°(€¹¹½Ñ…Ñ¥½¹1…å•Èè¹¹½Ñ…Ñ¥½¹1…å•È°(€¹¹½Ñ…Ñ¥½¹5½‘”è¹¹½Ñ…Ñ¥½¹5½‘”°(€¹¹½Ñ…Ñ¥½¹QåÁ”è¹¹½Ñ…Ñ¥½¹QåÁ”°(€…ÁÁ±å=Á…¥Ñäè…ÁÁ±å=Á…¥Ñä°(€‰Õ¥±è‰Õ¥±°(€½±½ÉA¥­•Èè½±½ÉA¥­•È°(€É•…Ñ•Y…±¥‘‰Í½±ÕÑ•UÉ°èÉ•…Ñ•Y…±¥‘‰Í½±ÕÑ•UÉ°°(€MM½¹ÍÑ…¹ÑÌèMM½¹ÍÑ…¹ÑÌ°(€=5MY…Ñ½Éäè=5MY…Ñ½Éä°(€É…Ý1…å•ÈèÉ…Ý1…å•È°(€•…ÑÕÉ•Q•ÍÐè•…ÑÕÉ•Q•ÍÐ°(€™•Ñ¡…Ñ„è™•Ñ¡…Ñ„°(€™¥¹‘½¹ÑÉ…ÍÑ½±½Èè™¥¹‘½¹ÑÉ…ÍÑ½±½È°(€•Ñ½Õµ•¹Ðè•Ñ½Õµ•¹Ð°(€•Ñ¥±•¹…µ•É½µUÉ°è•Ñ¥±•¹…µ•É½µUÉ°°(€•ÑA‘™¥±•¹…µ•É½µUÉ°è•ÑA‘™¥±•¹…µ•É½µUÉ°°(€•ÑIè•ÑI°(€•ÑI	è•ÑI	°(€•ÑUÕ¥è•ÑUÕ¥°(€±½‰…±]½É­•É=ÁÑ¥½¹Ìè±½‰…±]½É­•É=ÁÑ¥½¹Ì°(€%µ…•-¥¹è%µ…•-¥¹°(€%¹Ù…±¥‘Aá•ÁÑ¥½¸è%¹Ù…±¥‘Aá•ÁÑ¥½¸°(€¥Í…Ñ…M¡•µ”è¥Í…Ñ…M¡•µ”°(€¥ÍA‘™¥±”è¥ÍA‘™¥±”°(€¥ÍY…±¥‘áÁ±¥¥Ñ•ÍÐè¥ÍY…±¥‘áÁ±¥¥Ñ•ÍÐ°(€µ…­•ÉÈèµ…­•ÉÈ°(€µ…­•5…Àèµ…­•5…À°(€µ…­•=‰¨èµ…­•=‰¨°(€µ…­•M•Ðèµ…­•M•Ð°(€5…Ñ¡±…µÀè5…Ñ¡±…µÀ°(€¹½½¹Ñ•áÑ5•¹Ôè¹½½¹Ñ•áÑ5•¹Ô°(€¹½Éµ…±¥é•U¹¥½‘”è¹½Éµ…±¥é•U¹¥½‘”°(€=ALè=AL°(€=ÕÑÁÕÑM…±”è=ÕÑÁÕÑM…±”°(€A…ÍÍÝ½É‘á•ÁÑ¥½¸èA…ÍÍÝ½É‘á•ÁÑ¥½¸°(€A…ÍÍÝ½É‘I•ÍÁ½¹Í•ÌèA…ÍÍÝ½É‘I•ÍÁ½¹Í•Ì°(€A…Ñ…I…¹•QÉ…¹ÍÁ½ÉÐèA…Ñ…I…¹•QÉ…¹ÍÁ½ÉÐ°(€A…Ñ•MÑÉ¥¹œèA…Ñ•MÑÉ¥¹œ°(€A]½É­•ÈèA]½É­•È°(€A•Éµ¥ÍÍ¥½¹±…œèA•Éµ¥ÍÍ¥½¹±…œ°(€A¥á•±ÍA•É%¹ èA¥á•±ÍA•É%¹ °(€I•¹‘•É¥¹…¹•±±•‘á•ÁÑ¥½¸èI•¹‘•É¥¹…¹•±±•‘á•ÁÑ¥½¸°(€É•¹‘•ÉI¥¡Q•áÐèÉ•¹‘•ÉI¥¡Q•áÐ°(€I•ÍÁ½¹Í•á•ÁÑ¥½¸èI•ÍÁ½¹Í•á•ÁÑ¥½¸°(€Í•Ñ1…å•É¥µ•¹Í¥½¹ÌèÍ•Ñ1…å•É¥µ•¹Í¥½¹Ì°(€Í¡…‘½ÜèÍ¡…‘½Ü°(€M¥¹…ÑÕÉ•áÑÉ…Ñ½ÈèM¥¹…ÑÕÉ•áÑÉ…Ñ½È°(€ÍÑ½ÁÙ•¹ÐèÍÑ½ÁÙ•¹Ð°(€MÕÁÁ½ÉÑ•‘%µ…•5¥µ•QåÁ•ÌèMÕÁÁ½ÉÑ•‘%µ…•5¥µ•QåÁ•Ì°(€Q•áÑ1…å•ÈèQ•áÑ1…å•È°(€Q•áÑ1…å•É%µ…•ÌèQ•áÑ1…å•É%µ…•Ì°(€Q½Õ¡5…¹…•ÈèQ½Õ¡5…¹…•È°(€ÕÁ‘…Ñ•UÉ±!…Í èÕÁ‘…Ñ•UÉ±!…Í °(€UÑ¥°èUÑ¥°°(€Y•É‰½Í¥Ñå1•Ù•°èY•É‰½Í¥Ñå1•Ù•°°(€Ù•ÉÍ¥½¸èÙ•ÉÍ¥½¸°(€a™…1…å•Èèa™…1…å•È)ôì()•áÁ½ÉÐì‰½ÉÑá•ÁÑ¥½¸°¹¹½Ñ…Ñ¥½¹‘¥Ñ½É1…å•È°¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉA…É…µÍQåÁ”°¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉQåÁ”°¹¹½Ñ…Ñ¥½¹‘¥Ñ½ÉU%5…¹…•È°¹¹½Ñ…Ñ¥½¹1…å•È°¹¹½Ñ…Ñ¥½¹5½‘”°¹¹½Ñ…Ñ¥½¹QåÁ”°MM½¹ÍÑ…¹ÑÌ°½±½ÉA¥­•È°=5MY…Ñ½Éä°É…Ý1…å•È°•…ÑÕÉ•Q•ÍÐ°±½‰…±]½É­•É=ÁÑ¥½¹Ì°%µ…•-¥¹°%¹Ù…±¥‘Aá•ÁÑ¥½¸°5…Ñ¡±…µÀ°=AL°=ÕÑÁÕÑM…±”°A…Ñ…I…¹•QÉ…¹ÍÁ½ÉÐ°A…Ñ•MÑÉ¥¹œ°A]½É­•È°A…ÍÍÝ½É‘á•ÁÑ¥½¸°A…ÍÍÝ½É‘I•ÍÁ½¹Í•Ì°A•Éµ¥ÍÍ¥½¹±…œ°A¥á•±ÍA•É%¹ °I•¹‘•É¥¹…¹•±±•‘á•ÁÑ¥½¸°I•ÍÁ½¹Í•á•ÁÑ¥½¸°M¥¹…ÑÕÉ•áÑÉ…Ñ½È°MÕÁÁ½ÉÑ•‘%µ…•5¥µ•QåÁ•Ì°Q•áÑ1…å•È°Q•áÑ1…å•É%µ…•Ì°Q½Õ¡5…¹…•È°UÑ¥°°Y•É‰½Í¥Ñå1•Ù•°°a™…1…å•È°…ÁÁ±å=Á…¥Ñä°‰Õ¥±°É•…Ñ•Y…±¥‘‰Í½±ÕÑ•UÉ°°™•Ñ¡…Ñ„°™¥¹‘½¹ÑÉ…ÍÑ½±½È°•Ñ½Õµ•¹Ð°•Ñ¥±•¹…µ•É½µUÉ°°•ÑA‘™¥±•¹…µ•É½µUÉ°°•ÑI°•ÑI	°•ÑUÕ¥°¥Í…Ñ…M¡•µ”°¥ÍA‘™¥±”°¥ÍY…±¥‘áÁ±¥¥Ñ•ÍÐ°µ…­•ÉÈ°µ…­•5…À°µ…­•=‰¨°µ…­•M•Ð°¹½½¹Ñ•áÑ5•¹Ô°¹½Éµ…±¥é•U¹¥½‘”°É•¹‘•ÉI¥¡Q•áÐ°Í•Ñ1…å•É¥µ•¹Í¥½¹Ì°Í¡…‘½Ü°ÍÑ½ÁÙ•¹Ð°ÕÁ‘…Ñ•UÉ±!…Í °Ù•ÉÍ¥½¸ôì((¼¼ŒÍ½ÕÉ•5…ÁÁ¥¹UI0õÁ‘˜¹µ©Ì¹µ…À