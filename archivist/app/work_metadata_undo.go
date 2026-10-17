package main

import (
 "context"
 "database/sql"
 "crypto/hmac"
 "encoding/hex"
 "encoding/json"
 "errors"
 "fmt"
 "time"
)

type workHistoryEvent struct{
 ID int64 `json:"id"`
 Action string `json:"action"`
 RevisionBefore int64 `json:"revisionBefore"`
 RevisionAfter int64 `json:"revisionAfter"`
 RecordedAt int64 `json:"recordedAt"`
 Changes []workMetaDiff `json:"changes"`
}

func (a *app)workHistory(ctx context.Context,id int64)([]workHistoryEvent,error){
 rows,err:=a.db.QueryContext(ctx,`SELECT id,action,revision_before,revision_after,recorded_at,changes_json
   FROM work_metadata_history WHERE work_id=? ORDER BY id DESC LIMIT 25`,id)
 if err!=nil{return nil,err}
 defer rows.Close()
 out:=[]workHistoryEvent{}
 for rows.Next(){
  var h workHistoryEvent
  var raw string
  if err=rows.Scan(&h.ID,&h.Action,&h.RevisionBefore,&h.RevisionAfter,&h.RecordedAt,&raw);err!=nil{return nil,err}
  if err=json.Unmarshal([]byte(raw),&h.Changes);err!=nil{return nil,err}
  out=append(out,h)
 }
 return out,rows.Err()
}

type workUndoPreview struct{
 WorkID int64 `json:"workId"`
 HistoryID int64 `json:"historyId"`
 ExpectedRevision int64 `json:"expectedRevision"`
 ExpectedFingerprint string `json:"expectedFingerprint"`
 Diff []workMetaDiff `json:"diff"`
 ExpiresAt int64 `json:"expiresAt"`
 Receipt string `json:"receipt"`
}
type workUndoApplyRequest struct{
 Preview workUndoPreview `json:"preview"`
 Confirm bool `json:"confirm"`
}
func undoWorkReceipt(secret string,p workUndoPreview)string{
 // Sign the same scoped fields, fingerprint, history event, diff and expiry
 // as the owner's reviewed preview.
 m:=workMetaPreview{WorkID:p.WorkID,ExpectedRevision:p.ExpectedRevision,
    ExpectedFingerprint:p.ExpectedFingerprint,ExpiresAt:p.ExpiresAt,
    Diff:p.Diff,Receipt:"",Changes:[]workMetaChange{{Name:"history-id",Value:fmt.Sprint(p.HistoryID),Origin:"undo"}}}
 return workMetaReceipt(secret,m)
}

func latestWorkEdit(ctx context.Context,q bulkQuerier,id int64)(workHistoryEvent,workRollback,string,error){
 var event workHistoryEvent
 var raw,after string
 err:=q.QueryRowContext(ctx,`SELECT id,action,revision_before,revision_after,recorded_at,
   before_json,after_fingerprint FROM work_metadata_history
   WHERE work_id=? ORDER BY id DESC LIMIT 1`,id).
   Scan(&event.ID,&event.Action,&event.RevisionBefore,&event.RevisionAfter,&event.RecordedAt,&raw,&after)
 var before workRollback
 if err!=nil{return event,before,"",err}
 if err=json.Unmarshal([]byte(raw),&before);err!=nil{return event,before,"",err}
 return event,before,after,nil
}

func (a *app)previewWorkUndo(ctx context.Context,id int64)(workUndoPreview,error){
 result:=workUndoPreview{}
 if id<1{return result,errors.New("invalid work identity")}
 tx,err:=a.db.BeginTx(ctx,&sql.TxOptions{ReadOnly:true})
 if err!=nil{return result,err}
 defer tx.Rollback()
 state,err:=a.readWorkMeta(ctx,tx,id)
 if err!=nil{return result,err}
 if state.PublicationState!="staged"{return result,errors.New("unpublish before undoing metadata")}
 event,before,afterHash,err:=latestWorkEdit(ctx,tx,id)
 if err!=nil{return result,err}
 if event.Action!="edit"||event.RevisionAfter!=state.Revision||afterHash!=state.Fingerprint{
   return result,errors.New("no reversible latest edit; book state changed since its last save")
 }
 current:=map[string]workMetaField{}
 for _,x:=range state.Fields{current[x.Name]=x}
 diff:=[]workMetaDiff{}
 for _,x:=range before.Controls{
   if !workFieldAllowed(x.Name){return result,errors.New("old metadata history contains unsupported field")}
   if current[x.Name].Locked{return result,errors.New("unlock changed fields before attempting an undo")}
   diff=append(diff,workMetaDiff{Name:x.Name,From:current[x.Name].Value,
     To:x.DisplayValue,Source:"restore value before last confirmed save"})
 }
 if len(diff)<1{return result,errors.New("empty metadata revision cannot be undone")}
 if err=tx.Commit();err!=nil{return result,err}
 result=workUndoPreview{WorkID:id,HistoryID:event.ID,ExpectedRevision:state.Revision,
   ExpectedFingerprint:state.Fingerprint,Diff:diff,ExpiresAt:time.Now().Add(workMetaPreviewTTL).Unix()}
 result.Receipt=undoWorkReceipt(a.token,result)
 return result,nil
}

func (a *app)applyWorkUndo(ctx context.Context,p workUndoPreview)(workMetaState,error){
 result:=workMetaState{}
 now:=time.Now().Unix()
 if p.WorkID<1||p.HistoryID<1||now>p.ExpiresAt||p.ExpiresAt>now+int64(workMetaPreviewTTL/time.Second)+60{
   return result,errors.New("undo preview expired; preview again")
 }
 supplied,err:=decodeHexDigest(p.Receipt)
 valid,_:=decodeHexDigest(undoWorkReceipt(a.token,p))
 if err!=nil||!hmacEqual(supplied,valid){return result,errors.New("undo confirmation was altered")}
 a.scanMu.Lock();defer a.scanMu.Unlock()
 tx,err:=a.db.BeginTx(ctx,nil)
 if err!=nil{return result,err}
 defer tx.Rollback()
 state,err:=a.readWorkMeta(ctx,tx,p.WorkID)
 if err!=nil{return result,err}
 if state.PublicationState!="staged"||state.Revision!=p.ExpectedRevision||
    state.Fingerprint!=p.ExpectedFingerprint{
   return result,errors.New("book changed after undo preview; reload")
 }
 event,before,afterHash,err:=latestWorkEdit(ctx,tx,p.WorkID)
 if err!=nil{return result,err}
 if event.Action!="edit"||event.ID!=p.HistoryID||event.RevisionAfter!=state.Revision||
   afterHash!=state.Fingerprint{return result,errors.New("undo history changed; refresh")}
 current:=map[string]workMetaField{}
 for _,x:=range state.Fields{current[x.Name]=x}
 diffs:=[]workMetaDiff{}
 for _,old:=range before.Controls{
   if !workFieldAllowed(old.Name)||current[old.Name].Locked{
     return result,errors.New("field was locked or changed before undo")
   }
   diffs=append(diffs,workMetaDiff{Name:old.Name,From:current[old.Name].Value,
      To:old.DisplayValue,Source:"restore value before last confirmed save"})
 }
 if stringJSON(diffs)!=stringJSON(p.Diff)||len(diffs)==0{return result,errors.New("undo preview no longer matches history")}
 if _,err=tx.ExecContext(ctx,"UPDATE works SET title=?,author=?,series=?,genre=? WHERE id=?",
    before.Title,before.Author,before.Series,before.Genre,p.WorkID);err!=nil{return result,err}
 for _,old:=range before.Controls{
   if old.Control==nil{
     if _,err=tx.ExecContext(ctx,"DELETE FROM work_field_controls WHERE work_id=? AND field=?",p.WorkID,old.Name);err!=nil{return result,err}
   }else{
     v:=old.Control
     if _,err=tx.ExecContext(ctx,`INSERT INTO work_field_controls(work_id,field,value,source,locked,updated_at)
         VALUES(?,?,?,?,?,?) ON CONFLICT(work_id,field) DO UPDATE SET
         value=excluded.value,source=excluded.source,locked=excluded.locked,updated_at=excluded.updated_at`,
         p.WorkID,v.Name,v.Value,v.Source,v.Locked,v.UpdatedAt);err!=nil{return result,err}
   }
 }
 if _,err=tx.ExecContext(ctx,"UPDATE work_metadata_revisions SET revision=? WHERE work_id=?",
    state.Revision+1,p.WorkID);err!=nil{return result,err}
 result,err=a.readWorkMeta(ctx,tx,p.WorkID)
 if err!=nil{return result,err}
 if _,err=tx.ExecContext(ctx,`INSERT INTO work_metadata_history(
   work_id,revision_before,revision_after,action,before_json,changes_json,after_fingerprint,recorded_at)
   VALUES(?,?,?,'undo',?,?,?,?)`,
   p.WorkID,state.Revision,result.Revision,stringJSON(before),stringJSON(p.Diff),result.Fingerprint,now);err!=nil{return result,err}
 if err=tx.Commit();err!=nil{return result,err}
 return result,nil
}

// Narrow helpers keep crypto parsing private to this metadata undo feature.
func decodeHexDigest(s string)([]byte,error){return hex.DecodeString(s)}
func hmacEqual(a,b []byte)bool{return hmac.Equal(a,b)}
