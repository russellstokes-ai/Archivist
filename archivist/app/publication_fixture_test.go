package main

import "testing"

// publishFixtureWorks configures historical published catalogue fixtures for
// legacy tests that exercise reading, OPDS, permissions and large-library
// performance. It is TEST-ONLY and must never be called by production code.
// Scanning in production always stages new works until owner publication.
func publishFixtureWorks(t *testing.T, a *app) {
    t.Helper()
    if _,err:=a.db.Exec(`UPDATE assets SET needs_review=0,review_reason=''
      WHERE id IN (SELECT asset_id FROM edition_assets)`);err!=nil {t.Fatal(err)}
    if _,err:=a.db.Exec(`INSERT OR REPLACE INTO work_publication(work_id,state,revision,published_at)
      SELECT id,'published',1,0 FROM works`);err!=nil {t.Fatal(err)}
}
