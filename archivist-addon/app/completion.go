package main

func (a *app) initCompletions() error {
	_, err := a.db.Exec(`
CREATE TABLE IF NOT EXISTS profile_completions(
	profile_id INTEGER NOT NULL,
	work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
	kind TEXT NOT NULL CHECK(kind IN ('Audio','Reading')),
	completed_at INTEGER NOT NULL,
	PRIMARY KEY(profile_id,work_id,kind)
);

CREATE TRIGGER IF NOT EXISTS completion_profile_progress_insert
AFTER INSERT ON profile_progress
WHEN NEW.complete=1
BEGIN
	INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
	SELECT NEW.profile_id,e.work_id,'Audio',CAST(strftime('%s','now') AS INTEGER)
	FROM editions e WHERE e.id=NEW.edition_id;
END;

CREATE TRIGGER IF NOT EXISTS completion_profile_progress_update
AFTER UPDATE OF complete ON profile_progress
WHEN NEW.complete=1
BEGIN
	INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
	SELECT NEW.profile_id,e.work_id,'Audio',CAST(strftime('%s','now') AS INTEGER)
	FROM editions e WHERE e.id=NEW.edition_id;
END;

CREATE TRIGGER IF NOT EXISTS completion_asset_progress_insert
AFTER INSERT ON asset_progress
WHEN NEW.complete=1
BEGIN
	INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
	SELECT NEW.profile_id,e.work_id,'Audio',CAST(strftime('%s','now') AS INTEGER)
	FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id
	WHERE ea.asset_id=NEW.asset_id;
END;

CREATE TRIGGER IF NOT EXISTS completion_asset_progress_update
AFTER UPDATE OF complete ON asset_progress
WHEN NEW.complete=1
BEGIN
	INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
	SELECT NEW.profile_id,e.work_id,'Audio',CAST(strftime('%s','now') AS INTEGER)
	FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id
	WHERE ea.asset_id=NEW.asset_id;
END;

CREATE TRIGGER IF NOT EXISTS completion_reading_progress_insert
AFTER INSERT ON reading_progress
WHEN NEW.complete=1
BEGIN
	INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
	SELECT NEW.profile_id,e.work_id,'Reading',CAST(strftime('%s','now') AS INTEGER)
	FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id
	WHERE ea.asset_id=NEW.asset_id;
END;

CREATE TRIGGER IF NOT EXISTS completion_reading_progress_update
AFTER UPDATE OF complete ON reading_progress
WHEN NEW.complete=1
BEGIN
	INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
	SELECT NEW.profile_id,e.work_id,'Reading',CAST(strftime('%s','now') AS INTEGER)
	FROM edition_assets ea JOIN editions e ON e.id=ea.edition_id
	WHERE ea.asset_id=NEW.asset_id;
END;

INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
SELECT pp.profile_id,e.work_id,'Audio',CAST(strftime('%s','now') AS INTEGER)
FROM profile_progress pp JOIN editions e ON e.id=pp.edition_id
WHERE pp.complete=1;

INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
SELECT ap.profile_id,e.work_id,'Audio',CAST(strftime('%s','now') AS INTEGER)
FROM asset_progress ap
JOIN edition_assets ea ON ea.asset_id=ap.asset_id
JOIN editions e ON e.id=ea.edition_id
WHERE ap.complete=1;

INSERT OR IGNORE INTO profile_completions(profile_id,work_id,kind,completed_at)
SELECT rp.profile_id,e.work_id,'Reading',CAST(strftime('%s','now') AS INTEGER)
FROM reading_progress rp
JOIN edition_assets ea ON ea.asset_id=rp.asset_id
JOIN editions e ON e.id=ea.edition_id
WHERE rp.complete=1;
`)
	return err
}
