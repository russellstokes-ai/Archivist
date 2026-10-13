#!/usr/bin/env python3
"""Ephemeral mobile-to-standalone-server protocol smoke; never use live user data."""
import argparse
import json
import secrets
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


def check(origin,source):
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

    assert request(origin,"/logout","POST",{},bearer=session,action=True)[0]==200,"Logout must succeed"
    assert request(origin,"/api/me",bearer=session)[0]==401,"Revoked session must no longer work"
    print("PASS: mobile-compatible setup/status, session, bearer auth, library/source listing and revocation")


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--origin",required=True)
    parser.add_argument("--source",required=True)
    args=parser.parse_args()
    check(args.origin.rstrip("/"),args.source)
