package main

// initPerformance installs only compact, high-value indexes used by the Shelf,
// Atlas, progress and scan paths. Keep this list conservative for Raspberry Pi
// storage: every index costs write I/O and database space.
func (a *app) initPerformance() error {
	_, err := a.db.Exec(`
CREATE INDEX IF NOT EXISTS idx_assets_source_available ON assets(source_id,available);
CREATE INDEX IF NOT EXISTS idx_assets_format_available ON assets(format,available);
CREATE INDEX IF NOT EXISTS idx_assets_review_source ON assets(needs_review,source_id);
CREATE INDEX IF NOT EXISTS idx_works_space_title ON works(space,title,id);
CREATE INDEX IF NOT EXISTS idx_works_author ON works(author);
CREATE INDEX IF NOT EXISTS idx_works_series ON works(series);
CREATE INDEX IF NOT EXISTS idx_works_genre ON works(genre);
CREATE INDEX IF NOT EXISTS idx_works_auto_group ON works(auto,group_key);
CREATE INDEX IF NOT EXISTS idx_editions_work_format ON editions(work_id,format);
CREATE INDEX IF NOT EXISTS idx_edition_assets_edition_position ON edition_assets(edition_id,position);
CREATE INDEX IF NOT EXISTS idx_profile_progress_profile_complete ON profile_progress(profile_id,complete,edition_id);
CREATE INDEX IF NOT EXISTS idx_asset_progress_profile_complete ON asset_progress(profile_id,complete,asset_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_profile_complete ON reading_progress(profile_id,complete,asset_id);
CREATE INDEX IF NOT EXISTS idx_profile_completions_profile_work ON profile_completions(profile_id,work_id);
CREATE INDEX IF NOT EXISTS idx_work_preferences_profile_rating ON work_preferences(profile_id,rating,work_id);
CREATE INDEX IF NOT EXISTS idx_work_preferences_profile_favourite ON work_preferences(profile_id,favourite,work_id);
PRAGMA optimize;
`)
	return err
}
