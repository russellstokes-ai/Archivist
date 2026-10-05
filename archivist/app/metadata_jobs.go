package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"
)

func (a *app) initMetadataJobs() error {
	_, err := a.db.Exec(`CREATE TABLE IF NOT EXISTS metadata_jobs(
		id INTEGER PRIMARY KEY,
		source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
		state TEXT NOT NULL DEFAULT 'queued',
		message TEXT NOT NULL DEFAULT '',
		progress INTEGER NOT NULL DEFAULT 0,
		total INTEGER NOT NULL DEFAULT 0,
		updated INTEGER NOT NULL DEFAULT 0
	);
	CREATE UNIQUE INDEX IF NOT EXISTS one_active_metadata_job
		ON metadata_jobs(source_id) WHERE state IN ('queued','running');
	CREATE TABLE IF NOT EXISTS metadata_lookup_state(
		asset_id INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
		scan_signature TEXT NOT NULL DEFAULT '',
		status TEXT NOT NULL DEFAULT '',
		last_attempt INTEGER NOT NULL DEFAULT 0
	);
	UPDATE metadata_jobs
		SET state='queued',message='Resuming interrupted metadata enrichment',updated=strftime('%s','now')
		WHERE state='running';`)
	return err
}

func (a *app) enqueueAutomaticMetadataEnrichment(sourceID int64) (bool, error) {
	settings, err := a.metadataSettings()
	if err != nil {
		return false, err
	}
	if !settings.OnlineEnabled || !settings.AutoEnrich || (!settings.OpenLibraryEnabled && !settings.GoogleBooksEnabled) {
		return false, nil
	}
	var found int64
	if err = a.db.QueryRow("SELECT id FROM sources WHERE id=?", sourceID).Scan(&found); err != nil {
		return false, errors.New("source not found")
	}
	var existing int64
	if err = a.db.QueryRow("SELECT id FROM metadata_jobs WHERE source_id=? AND state IN ('queued','running')", sourceID).Scan(&existing); err == nil {
		return true, nil
	}
	_, err = a.db.Exec("INSERT INTO metadata_jobs(source_id,state,message,updated) VALUES(?,'queued','Waiting to enrich metadata',?)", sourceID, time.Now().Unix())
	if err != nil {
		return false, err
	}
	return true, nil
}

func (a *app) metadataWorker(ctx context.Context) {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			var id, source int64
			if err := a.db.QueryRow("SELECT id,source_id FROM metadata_jobs WHERE state='queued' ORDER BY id LIMIT 1").Scan(&id,&source); err != nil {
				continue
			}
			a.db.Exec("UPDATE metadata_jobs SET state='running',message='Matching online catalogues',updated=? WHERE id=?",time.Now().Unix(),id)
			progressFn := func(done,total int) {
				message := "Matching online catalogues"
				if total > 0 {
					message = fmt.Sprintf("Matching %d of %d records",done,total)
				}
				a.db.Exec("UPDATE metadata_jobs SET progress=?,total=?,message=?,updated=? WHERE id=?",done,total,message,time.Now().Unix(),id)
			}
			result, err := a.enrichMetadataWithProgress(ctx,source,100,false,progressFn)
			state := "complete"
			message := fmt.Sprintf("Metadata complete · %d updated",result.Updated)
			if err != nil {
				state = "failed"
				message = err.Error()
			} else if len(result.Errors) > 0 {
				message = fmt.Sprintf("Metadata complete · %d updated · provider warnings",result.Updated)
			} else if result.Examined == 0 {
				message = "Metadata already up to date"
			}
			a.db.Exec("UPDATE metadata_jobs SET state=?,message=?,progress=CASE WHEN ?='complete' THEN total ELSE progress END,updated=? WHERE id=?",state,message,state,time.Now().Unix(),id)
		}
	}
}

func (a *app) metadataJobRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/metadata/jobs", func(w http.ResponseWriter, r *http.Request) {
		if !who(r).Owner {
			fail(w,http.StatusForbidden,errors.New("metadata activity is available to the library owner"))
			return
		}
		rows, err := a.db.Query(`SELECT j.id,j.source_id,s.space,j.state,j.message,j.progress,j.total,j.updated
			FROM metadata_jobs j JOIN sources s ON s.id=j.source_id
			ORDER BY j.id DESC LIMIT 30`)
		if err != nil {
			fail(w,500,err)
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id,source,updated int64
			var progress,total int
			var space,state,message string
			if err=rows.Scan(&id,&source,&space,&state,&message,&progress,&total,&updated);err!=nil {
				fail(w,500,err)
				return
			}
			out=append(out,map[string]any{
				"id":id,"sourceId":source,"space":space,"state":state,
				"message":message,"progress":progress,"total":total,"updated":updated,
			})
		}
		if err=rows.Err();err!=nil{fail(w,500,err);return}
		reply(w,out)
	})
}
