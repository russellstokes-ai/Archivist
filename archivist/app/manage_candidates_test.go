package main

import (
	"strings"
	"testing"
)

func TestOpenLibraryCandidateParsingAndLimits(t *testing.T) {
	const fixture = `{"docs":[
		{"key":"/works/OL1W","title":"Dune","author_name":["Frank Herbert"],"first_publish_year":1965,"isbn":["9780441172719"],"publisher":["Ace"]},
		{"key":"/works/OL2W","title":" ","author_name":["Unknown"]},
		{"key":"/works/OL3W","title":"Another book","first_publish_year":9999}
	]}`
	items,err:=parseOpenLibraryCandidates(strings.NewReader(fixture))
	if err!=nil { t.Fatal(err) }
	if len(items)!=2 { t.Fatalf("expected two valid titles, got %+v",items) }
	if items[0].Title!="Dune" || items[0].Author!="Frank Herbert" || items[0].PublishedYear!=1965 { t.Fatalf("mismatched title/author/year: %+v",items[0]) }
	if items[0].ISBN!="" || items[0].Publisher!="" { t.Fatalf("work search must not invent edition identifiers: %+v",items[0]) }
	if items[1].PublishedYear!=0 { t.Fatalf("unexpected invalid publication year: %+v",items[1]) }
	if _,err=parseOpenLibraryCandidates(strings.NewReader("{broken"));err==nil { t.Fatal("invalid provider JSON must fail closed") }
}
