#!/usr/bin/env python3
"""Ephemeral mobile-to-standalone-server protocol smoke; never use live user data."""
import argparse
import json
import os
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError("The mobile API does not follow HTTP redirects")


def request(origin, path, method="GET", payload=None, bearer=None, action=False):
    headers={"Content-Type": "application/json"}
    if bearer is not None:
        headers["Authorization"]="Bearer "+bearer
    if action:
        headers["X-Archivist-Action"]="1"
    body=json.dumps(payload).encode("utf-8") if payload is not None else None
    req=urllib.request.Request(origin+path, data=body, headers=headers, method=method)
    opener=urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(req, timeout=10) as response:
            status, ctype, raw = response.status, response.headers.get("Content-Type",""),response.read(1024*1024+1)
    except urllib.error.HTTPError as e:
        status,ctype,raw = e.code,e.headers.get("Content-Type",""),e.read(1024*1024+1)
    assert "application/json" in ctype, (path,status,ctype)
    assert len(raw)<=1024*1024, (path,"oversized JSON")
    return status,json.loads(raw.decode("utf-8"))



def request_bytes(origin, path, bearer=None, byte_range=None):
    headers={}
    if bearer is not None:
        headers["Authorization"]="Bearer "+bearer
    if byte_range is not None:
        headers["Range"]=byte_range
    req=urllib.request.Request(origin+path, headers=headers, method="GET")
    opener=urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(req, timeout=10) as response:
            return response.status, response.headers, response.read(1024*1024)
    except urllib.error.HTTPError as error:
        return error.code,error.headers,error.read(1024*1024)


def check(origin,source,state_out=None):
    parsed=urllib.parse.urlparse(origin)
    assert parsed.scheme=="http" and parsed.hostname in ("127.0.0.1","localhost"),"Only ephemeral loopback servers are permitted"
    assert parsed.path in ("","/") and not parsed.query
    status,body=request(origin,"/healthz")
    assert status==200 and body.get("ok") is True,(status,body)
    status,body=request(origin,"/setup/status")
    assert status==200 and body.get("configured") is False,(status,body)
    assert request(origin,"/api/me")[0]==401,"Unauthenticated profile access must fail"
    assert request(origin,"/api/books")[0]==401,"Unauthenticated library access must fail"

    # Initial setup is limited to the fresh ephemeral instance created by this CI job.
    key="ci-"+secrets.token_urlsafe(25)
    assert request(origin,"/setup","POST",{"token":key})[0]==403,"Setup must reject missing action marker"
    status,body=request(origin,"/setup","POST",{"token":key},action=True)
    assert status==200 and isinstance(body.get("token"),str) and body["token"],(status,body)
    status,body=request(origin,"/setup/status")
    assert status==200 and body.get("configured") is True,(status,body)
    assert request(origin,"/setup","POST",{"token":key},action=True)[0]==409,"Owner setup must be one-time"

    assert request(origin,"/session","POST",{"token":"invalid-ci-access-key"},action=True)[0]==401,"Wrong access key must fail"
    assert request(origin,"/session","POST",{"token":key})[0]==403,"Session creation must require action marker"
    status,body=request(origin,"/session","POST",{"token":key},action=True)
    assert status==200 and isinstance(body.get("token"),str) and body["token"],(status,body)
    session=body["token"]
    status,identity=request(origin,"/api/me",bearer=session)
    assert status==200 and identity.get("owner") is True and identity.get("role")=="admin",(status,identity)
    status,sources=request(origin,"/api/sources",bearer=session)
    assert status==200 and isinstance(sources,list) and len(sources)==0,(status,sources)

    assert request(origin,"/api/sources","POST",{"space":"CI Test","path":source},bearer=session)[0]==403,"Source mutation without marker must fail"
    status,body=request(origin,"/api/sources","POST",{"space":"CI Test","path":source},bearer=session,action=True)
    assert status==200,(status,body)
    status,sources=request(origin,"/api/sources",bearer=session)
    assert status==200 and any(row.get("space")=="CI Test" and row.get("path")==source for row in sources),(status,sources)
    status,books=request(origin,"/api/books?limit=10",bearer=session)
    assert status==200 and isinstance(books,list),(status,books)
    status,info=request(origin,"/api/server-info",bearer=session)
    assert status==200 and info.get("configured") is True and info.get("sources",0)>=1,(status,info)
    assert request(origin,"/api/sources")[0]==401,"Unauthenticated source listing must fail"

    # Scan synthetic, extension-classified media and verify real content delivery.
    source_id=next(row["id"] for row in sources if row.get("path")==source)
    status,scan_job=request(origin,"/api/sources/"+str(source_id)+"/scan","POST",bearer=session,action=True)
    assert status==202 and isinstance(scan_job.get("job_id"),int),(status,scan_job)
    book=None
    for _ in range(80):
        status,items=request(origin,"/api/books?limit=10",bearer=session)
        assert status==200 and isinstance(items,list),(status,items)
        book=next((item for item in items if item.get("format")=="Audio" and item.get("available") is True),None)
        if book:
            break
        time.sleep(0.5)
    assert book is not None, "Synthetic audio was not discovered through the API"
    asset_path="/api/assets/"+str(book["id"])
    status,_,_=request_bytes(origin,asset_path)
    assert status==401,"Unauthenticated media streaming must be denied"
    status,headers,data=request_bytes(origin,asset_path,bearer=session,byte_range="bytes=2-5")
    assert status==206 and data==b"2345" and headers.get("Content-Range","").startswith("bytes 2-5/"),(status,headers.get("Content-Range"),data)
    status,_,data=request_bytes(origin,asset_path,bearer=session)
    assert status==200 and data==b"0123456789",(status,data)

    assert request(origin,"/logout","POST",{},bearer=session,action=True)[0]==200,"Logout must succeed"
    assert request(origin,"/api/me",bearer=session)[0]==401,"Revoked session must no longer work"
    if state_out:
        # This credential is randomly generated for a disposable CI server only.
        # Keep it private on the ephemeral runner; never print it or commit it.
        fd=os.open(state_out,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,"w",encoding="utf-8") as out:
            json.dump({"key":key,"source":source,"asset_id":book["id"]},out)
    print("PASS: mobile-compatible setup, session, catalogue scan, authenticated byte-range streaming and revocation")


def verify_after_restart(origin,state_file):
    parsed=urllib.parse.urlparse(origin)
    assert parsed.scheme=="http" and parsed.hostname in ("127.0.0.1","localhost"),"Only test loopback servers are permitted"
    with open(state_file,encoding="utf-8") as f:
        saved=json.load(f)
    assert request(origin,"/setup/status")[1].get("configured") is True,"Owner account lost after restart"
    assert request(origin,"/api/books")[0]==401,"Server must still reject anonymous catalogue access"
    status,body=request(origin,"/session","POST",{"token":saved["key"]},action=True)
    assert status==200 and isinstance(body.get("token"),str),(status,body)
    session=body["token"]
    status,sources=request(origin,"/api/sources",bearer=session)
    assert status==200 and any(row.get("path")==saved["source"] for row in sources),(status,sources)
    status,books=request(origin,"/api/books?limit=20",bearer=session)
    assert status==200 and any(item.get("id")==saved["asset_id"] for item in books),(status,books)
    path="/api/assets/"+str(saved["asset_id"])
    assert request_bytes(origin,path)[0]==401,"Restarted server exposed media anonymously"
    status,headers,data=request_bytes(origin,path,bearer=session,byte_range="bytes=2-5")
    assert status==206 and data==b"2345",(status,data)
    assert request(origin,"/logout","POST",{},bearer=session,action=True)[0]==200
    assert request(origin,"/api/me",bearer=session)[0]==401
    print("PASS: restarted server retained owner, catalogue, source, authenticated audio ranges and revocation")


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--origin",required=True)
    parser.add_argument("--source")
    parser.add_argument("--state-out")
    parser.add_argument("--verify-state")
    args=parser.parse_args()
    if args.verify_state:
        assert not args.source and not args.state_out
        verify_after_restart(args.origin.rstrip("/"),args.verify_state)
    else:
        assert args.source, "--source is required for the initial scan"
        check(args.origin.rstrip("/"),args.source,args.state_out)
