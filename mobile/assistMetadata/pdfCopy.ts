import {PDFDocument,PDFName,PDFString,PDFDict,PDFRawStream} from 'pdf-lib';
import type {WorkFields} from '../scannerVNext/fieldEvidence';
const cap=64*1024*1024;
export async function createPdfMetadataCopy(bytes:Uint8Array,fields:WorkFields):Promise<Uint8Array>{
 if(bytes.length>cap)throw Error('PDF metadata size limit');
 const doc=await PDFDocument.load(bytes,{updateMetadata:false,ignoreEncryption:false,throwOnInvalidObject:true});
 if(doc.isEncrypted)throw Error('Encrypted PDF cannot be rewritten');
 for(const [,obj] of doc.context.enumerateIndirectObjects())if(obj instanceof PDFDict&&(obj.has(PDFName.of('ByteRange'))||obj.get(PDFName.of('FT'))===PDFName.of('Sig')||obj.get(PDFName.of('Type'))===PDFName.of('Sig')))throw Error('Signed PDF cannot be rewritten');
 const streams=doc.context.enumerateIndirectObjects().filter(([,o])=>o instanceof PDFRawStream).map(([ref,obj])=>({ref,bytes:(obj as PDFRawStream).getContents().slice()}));
 if(fields.title)doc.setTitle(fields.title);if(fields.author)doc.setAuthor(fields.author);if(fields.genre)doc.setSubject(fields.genre);
 const info=doc.context.lookup(doc.context.trailerInfo.Info,PDFDict);
 for(const [key,value]of Object.entries({PublicationYear:fields.publishedYear,Publisher:fields.publisher,Series:fields.series,SeriesNumber:fields.seriesNumber,ISBN:fields.isbn,Description:fields.description}))if(value)info.set(PDFName.of(key),PDFString.of(value));
 // Conflicting XMP is retained in the file but no longer selected by the catalogue.
 doc.catalog.delete(PDFName.of('Metadata'));
 const result=await doc.save({useObjectStreams:false,updateFieldAppearances:false});if(result.length>cap)throw Error('PDF output size limit');
 const verified=await PDFDocument.load(result,{updateMetadata:false,throwOnInvalidObject:true});
 if(verified.getPageCount()!==doc.getPageCount())throw Error('PDF pages changed');
 for(const old of streams){const stream=verified.context.lookup(old.ref);if(!(stream instanceof PDFRawStream))throw Error('PDF stream missing');const next=stream.getContents();if(next.length!==old.bytes.length||next.some((b,i)=>b!==old.bytes[i]))throw Error('PDF content stream changed');}
 if(fields.title&&verified.getTitle()!==fields.title||fields.author&&verified.getAuthor()!==fields.author||fields.genre&&verified.getSubject()!==fields.genre)throw Error('PDF metadata verification failed');
 const verifiedInfo=verified.context.lookup(verified.context.trailerInfo.Info,PDFDict);
 for(const [key,value]of Object.entries({PublicationYear:fields.publishedYear,Publisher:fields.publisher,Series:fields.series,SeriesNumber:fields.seriesNumber,ISBN:fields.isbn,Description:fields.description})){
  if(value&&verifiedInfo.get(PDFName.of(key))?.toString()!==PDFString.of(value).toString())throw Error('PDF metadata verification failed');
 }
 return result;
}
