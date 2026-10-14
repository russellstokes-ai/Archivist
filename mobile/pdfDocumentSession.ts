/**
 * PDF document state is tied to one URI and one opening generation.
 * A late native result must never paint a different document or page.
 * Deliberately contains no reader layout, typography or animation code.
 */
export type PdfPageImage={uri:string;page:number;width:number;request:number;dataUri:string};
export type PdfDocumentSession={
  uri:string;
  generation:number;
  page:number;
  count:number;
  image:PdfPageImage|null;
  loading:boolean;
  error:string;
  request:number;
};
export type PdfSessionAction=
  | {type:'open';uri:string;initialPage:number;generation:number}
  | {type:'count';uri:string;generation:number;total:number}
  | {type:'count-error';uri:string;generation:number;message:string}
  | {type:'page';uri:string;generation:number;page:number}
  | {type:'render-start';uri:string;generation:number;page:number;request:number}
  | {type:'render-success';uri:string;generation:number;page:number;request:number;width:number;dataUri:string}
  | {type:'render-error';uri:string;generation:number;page:number;request:number;message:string};

export function safePdfPage(value:number):number{
  return Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
}
export function openPdfSession(uri:string,initialPage:number,generation:number):PdfDocumentSession{
  return {uri,generation,page:safePdfPage(initialPage),count:0,image:null,
    loading:true,error:'',request:0};
}
export function pdfSessionReducer(s:PdfDocumentSession,a:PdfSessionAction):PdfDocumentSession{
  if(a.type==='open'){
    return a.generation>s.generation?openPdfSession(a.uri,a.initialPage,a.generation):s;
  }
  if(s.uri!==a.uri||s.generation!==a.generation)return s;
  if(a.type==='count'){
    const total=Number.isSafeInteger(a.total)&&a.total>=0?a.total:0;
    // A zero-page response is a recoverable read failure, not permission to
    // destroy the original saved page; a subsequent valid count must restore it.
    return {...s,count:total,page:total?Math.min(safePdfPage(s.page),total-1):s.page,
      image:null,loading:total>0,error:total?'':'PDF contains no readable pages.'};
  }
  if(a.type==='count-error')return {...s,image:null,loading:false,error:a.message};
  if(a.type==='page'){
    if(!s.count)return s;
    const page=Math.min(s.count-1,safePdfPage(a.page));
    return page===s.page?s:{...s,page,image:null,loading:true,error:''};
  }
  if(a.type==='render-start'){
    if(!s.count||s.page!==a.page||a.request<=s.request)return s;
    return {...s,request:a.request,image:null,loading:true,error:''};
  }
  if(a.request!==s.request||a.page!==s.page)return s;
  if(a.type==='render-error')return {...s,image:null,loading:false,error:a.message};
  if(a.type==='render-success'){
    if(!a.dataUri.startsWith('data:image/png;base64,')||a.dataUri.length<=22)return {
      ...s,image:null,loading:false,error:'Unable to render PDF page.'
    };
    return {...s,image:{uri:s.uri,page:s.page,width:a.width,request:a.request,
      dataUri:a.dataUri},loading:false,error:''};
  }
  return s;
}
export function visiblePdfImage(s:PdfDocumentSession,uri:string,page:number,width:number):string{
  return s.uri===uri && s.page===page && s.image?.uri===uri
    && s.image.page===page && s.image.width===width
    && s.image.request===s.request?s.image.dataUri:'';
}
