package main

import (
    "context"
    "errors"
    "fmt"
)

// A stop is ACKNOWLEDGED only while the worker is still in the staged/read
// phase. Moving to 'committing' is a single conditional database write and
// therefore orders exactly against the owner's cancellation UPDATE.
var errScanCancelled=errors.New("scan cancelled before catalogue commit")

func (a *app) scanJobCheckpoint(ctx context.Context,jobID int64)error{
    if err:=ctx.Err();err!=nil{return err}
    if jobID==0{return nil}
    var state string
    var requested bool
    if err:=a.db.QueryRowContext(ctx,"SELECT state,cancel_requested FROM jobs WHERE id=?",jobID).
      Scan(&state,&requested);err!=nil{return err}
    if requested{return errScanCancelled}
    if state!="running"{return fmt.Errorf("scan job no longer running: %s",state)}
    return nil
}

func (a *app) enterScanCommit(ctx context.Context,jobID int64)error{
    if err:=ctx.Err();err!=nil{return err}
    if jobID==0{return nil}
    result,err:=a.db.ExecContext(ctx,`UPDATE jobs
      SET state='committing',message='Committing verified catalogue; cancellation unavailable'
      WHERE id=? AND state='running' AND cancel_requested=0`,jobID)
    if err!=nil{return err}
    n,err:=result.RowsAffected()
    if err!=nil{return err}
    if n==1{return nil}
    var state string
    var requested bool
    if err=a.db.QueryRowContext(ctx,"SELECT state,cancel_requested FROM jobs WHERE id=?",jobID).
      Scan(&state,&requested);err!=nil{return err}
    if requested{return errScanCancelled}
    return fmt.Errorf("scan commit not authorised: job state %s",state)
}
