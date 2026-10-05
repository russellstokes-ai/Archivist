package main

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const onlineCoverReadLimit = 8 << 20

type coverCacheRecord struct {
	Data      []byte
	MIME      string
	Source    string
	Provider  string
	SourceURL string
	Updated   int64
}

func (a *app) initCoverCache() error {
	_, err := a.db.Exec(`CREATE TABLE IF NOT EXISTS cover_cache(
		asset_id INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
		mime TEXT NOT NULL,
		data BLOB NOT NULL,
		source TEXT NOT NULL,
		provider TEXT NOT NULL DEFAULT '',
		source_url TEXT NOT NULL DEFAULT '',
		updated INTEGER NOT NULL
	);`)
	return err
}

func (a *app) cachedAssetCover(assetID string) (coverCacheRecord,error) {
	var item coverCacheRecord
	err:=a.db.QueryRow("SELECT data,mime,source,provider,source_url,updated FROM cover_cache WHERE asset_id=?",assetID).
		Scan(&item.Data,&item.MIME,&item.Source,&item.Provider,&item.SourceURL,&item.Updated)
	if err!=nil{return coverCacheRecord{},err}
	if len(item.Data)==0||len(item.Data)>coverReadLimit||!strings.HasPrefix(item.MIME,"image/"){
		return coverCacheRecord{},errors.New("cached cover invalid")
	}
	return item,nil
}

func (a *app) storeCoverCache(assetID string,data []byte,mime,source,provider,sourceURL string) error {
	if strings.TrimSpace(assetID)==""{return errors.New("asset missing")}
	thumb,safeMIME,err:=safeImageData(data)
	if err!=nil{return err}
	if mime==""{mime=safeMIME}else{mime=safeMIME}
	_,err=a.db.Exec(`INSERT INTO cover_cache(asset_id,mime,data,source,provider,source_url,updated)
		VALUES(?,?,?,?,?,?,?)
		ON CONFLICT(asset_id) DO UPDATE SET mime=excluded.mime,data=excluded.data,source=excluded.source,
			provider=excluded.provider,source_url=excluded.source_url,updated=excluded.updated`,
		assetID,mime,thumb,source,provider,sourceURL,time.Now().Unix())
	return err
}

func allowedOnlineCoverURL(raw string) (string,error) {
	raw=strings.TrimSpace(raw)
	if raw==""{return "",errors.New("cover URL missing")}
	u,err:=url.Parse(raw)
	if err!=nil{return "",errors.New("cover URL invalid")}
	if strings.EqualFold(u.Scheme,"http"){u.Scheme="https"}
	if !strings.EqualFold(u.Scheme,"https")||u.User!=nil{return "",errors.New("cover URL rejected")}
	host:=strings.ToLower(u.Hostname())
	allowed:=host=="covers.openlibrary.org"||host=="books.google.com"||strings.HasSuffix(host,".googleusercontent.com")
	if !allowed{return "",errors.New("cover host rejected")}
	if port:=u.Port();port!=""&&port!="443"{return "",errors.New("cover port rejected")}
	return u.String(),nil
}

func onlineCoverClient() *http.Client {
	return &http.Client{
		Timeout:8*time.Second,
		CheckRedirect:func(req *http.Request,via []*http.Request) error {
			if len(via)>5{return errors.New("too many cover redirects")}
			_,err:=allowedOnlineCoverURL(req.URL.String())
			return err
		},
	}
}

func downloadOnlineCover(ctx context.Context,raw string) ([]byte,string,string,error) {
	approved,err:=allowedOnlineCoverURL(raw)
	if err!=nil{return nil,"","",err}
	req,err:=http.NewRequestWithContext(ctx,http.MethodGet,approved,nil)
	if err!=nil{return nil,"","",err}
	req.Header.Set("Accept","image/*")
	req.Header.Set("User-Agent","Archivist/1.0 artwork-cache")
	res,err:=onlineCoverClient().Do(req)
	if err!=nil{return nil,"","",err}
	defer res.Body.Close()
	if res.StatusCode<200||res.StatusCode>=300{return nil,"","",errors.New("cover provider unavailable")}
	data,err:=io.ReadAll(io.LimitReader(res.Body,onlineCoverReadLimit+1))
	if err!=nil{return nil,"","",err}
	if len(data)>onlineCoverReadLimit{return nil,"","",errors.New("online cover too large")}
	thumb,mime,err:=safeImageData(data)
	if err!=nil{return nil,"","",err}
	return thumb,mime,approved,nil
}

func (a *app) cacheLocalCoverForTarget(target metadataEnrichTarget) (bool,error) {
	var root string
	if err:=a.db.QueryRow("SELECT path FROM sources WHERE id=?",target.SourceID).Scan(&root);err!=nil{return false,err}
	id:=strconv.FormatInt(target.ID,10)
	if data,mime,err:=externalCover(root,target.Relative);err==nil{
		return true,a.storeCoverCache(id,data,mime,"local","Local artwork","")
	}
	if target.Format=="Comic"||target.Format=="Ebook"{
		if data,mime,err:=archiveCover(root,target.Relative,target.Format);err==nil{
			return true,a.storeCoverCache(id,data,mime,"embedded","Embedded artwork","")
		}
	}
	return false,nil
}

func (a *app) cacheCoverForMetadata(ctx context.Context,target metadataEnrichTarget,candidate onlineMetadataCandidate) error {
	id:=strconv.FormatInt(target.ID,10)
	if _,err:=a.cachedAssetCover(id);err==nil{return nil}
	if found,err:=a.cacheLocalCoverForTarget(target);err!=nil{return err}else if found{return nil}
	if candidate.CoverURL==""{return nil}
	data,mime,sourceURL,err:=downloadOnlineCover(ctx,candidate.CoverURL)
	if err!=nil{return nil}
	return a.storeCoverCache(id,data,mime,"online",candidate.Provider,sourceURL)
}

func (a *app) coverCacheRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/assets/{id}/cover-info",func(w http.ResponseWriter,r *http.Request){
		if !who(r).Owner{
			fail(w,http.StatusForbidden,errors.New("artwork details are available to the library owner"))
			return
		}
		item,err:=a.cachedAssetCover(r.PathValue("id"))
		if err!=nil{
			reply(w,map[string]any{"cached":false})
			return
		}
		reply(w,map[string]any{
			"cached":true,
			"source":item.Source,
			"provider":item.Provider,
			"updated":item.Updated,
		})
	})
}
