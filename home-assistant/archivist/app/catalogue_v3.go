package main

import (
	"database/sql"
	"strings"
)

const catalogueSchemaVersion = 3

func duplicateColumnError(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), "duplicate column")
}

func entityKey(value string) string {
	return strings.ToLower(strings.Join(strings.Fields(strings.TrimSpace(value)), " "))
}

// initCatalogueV3 adds the normalized catalogue needed by metadata enrichment,
// author/series pages, Atlas and Insights without removing legacy compatibility
// columns. Existing clients continue to use works.author/series/space while the
// read/write paths migrate to normalized entities.
func (a *app) initCatalogueV3() error {
	tx, err := a.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, stmt := range []string{
		`CREATE TABLE IF NOT EXISTS authors(
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			name_key TEXT NOT NULL UNIQUE,
			sort_name TEXT NOT NULL DEFAULT '',
			biography TEXT NOT NULL DEFAULT '',
			birth_date TEXT NOT NULL DEFAULT '',
			death_date TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS author_aliases(
			author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
			alias TEXT NOT NULL,
			alias_key TEXT NOT NULL,
			PRIMARY KEY(author_id,alias_key)
		)`,
		`CREATE TABLE IF NOT EXISTS work_authors(
			work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
			author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
			role TEXT NOT NULL DEFAULT 'author',
			position INTEGER NOT NULL DEFAULT 0,
			source_kind TEXT NOT NULL DEFAULT 'legacy',
			PRIMARY KEY(work_id,author_id,role)
		)`,
		`CREATE TABLE IF NOT EXISTS series_entities(
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			name_key TEXT NOT NULL UNIQUE,
			description TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS work_series(
			work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
			series_id INTEGER NOT NULL REFERENCES series_entities(id) ON DELETE CASCADE,
			position REAL,
			source_kind TEXT NOT NULL DEFAULT 'legacy',
			PRIMARY KEY(work_id,series_id)
		)`,
		`CREATE TABLE IF NOT EXISTS genres(
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			name_key TEXT NOT NULL UNIQUE,
			description TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS work_genres(
			work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
			genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
			source_kind TEXT NOT NULL DEFAULT 'manual',
			PRIMARY KEY(work_id,genre_id)
		)`,
		`CREATE TABLE IF NOT EXISTS tags(
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			name_key TEXT NOT NULL UNIQUE
		)`,
		`CREATE TABLE IF NOT EXISTS work_tags(
			work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
			tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
			PRIMARY KEY(work_id,tag_id)
		)`,
		`CREATE TABLE IF NOT EXISTS collections(
			id INTEGER PRIMARY KEY,
			profile_id INTEGER NOT NULL DEFAULT 0,
			name TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL DEFAULT 0,
			updated_at INTEGER NOT NULL DEFAULT 0,
			UNIQUE(profile_id,name)
		)`,
		`CREATE TABLE IF NOT EXISTS collection_works(
			collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
			work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
			position INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY(collection_id,work_id)
		)`,
		`CREATE TABLE IF NOT EXISTS metadata_providers(
			provider_key TEXT PRIMARY KEY,
			display_name TEXT NOT NULL,
			enabled INTEGER NOT NULL DEFAULT 0,
			priority INTEGER NOT NULL DEFAULT 100,
			config_json TEXT NOT NULL DEFAULT '{}'
		)`,
		`CREATE TABLE IF NOT EXISTS external_ids(
			id INTEGER PRIMARY KEY,
			entity_type TEXT NOT NULL,
			entity_id INTEGER NOT NULL,
			provider TEXT NOT NULL,
			namespace TEXT NOT NULL DEFAULT '',
			value TEXT NOT NULL,
			UNIQUE(entity_type,entity_id,provider,namespace,value),
			UNIQUE(provider,namespace,value)
		)`,
		`CREATE TABLE IF NOT EXISTS metadata_values(
			entity_type TEXT NOT NULL,
			entity_id INTEGER NOT NULL,
			field TEXT NOT NULL,
			value_json TEXT NOT NULL,
			source_kind TEXT NOT NULL,
			provider TEXT NOT NULL DEFAULT '',
			confidence REAL NOT NULL DEFAULT 1,
			locked INTEGER NOT NULL DEFAULT 0,
			updated_at INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY(entity_type,entity_id,field,source_kind,provider)
		)`,
		`CREATE TABLE IF NOT EXISTS metadata_rules(
			scope_type TEXT NOT NULL,
			scope_id INTEGER NOT NULL DEFAULT 0,
			field TEXT NOT NULL,
			enabled INTEGER NOT NULL DEFAULT 1,
			strategy TEXT NOT NULL DEFAULT 'fill_missing',
			provider_order_json TEXT NOT NULL DEFAULT '[]',
			PRIMARY KEY(scope_type,scope_id,field)
		)`,
		`CREATE TABLE IF NOT EXISTS artwork(
			id INTEGER PRIMARY KEY,
			entity_type TEXT NOT NULL,
			entity_id INTEGER NOT NULL,
			kind TEXT NOT NULL,
			source_kind TEXT NOT NULL,
			provider TEXT NOT NULL DEFAULT '',
			uri TEXT NOT NULL DEFAULT '',
			cached_path TEXT NOT NULL DEFAULT '',
			mime TEXT NOT NULL DEFAULT '',
			width INTEGER NOT NULL DEFAULT 0,
			height INTEGER NOT NULL DEFAULT 0,
			selected INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS profile_work_state(
			profile_id INTEGER NOT NULL,
			work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
			status TEXT NOT NULL DEFAULT 'unread',
			rating REAL,
			favourite INTEGER NOT NULL DEFAULT 0,
			started_at INTEGER,
			finished_at INTEGER,
			updated_at INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY(profile_id,work_id)
		)`,
		`CREATE TABLE IF NOT EXISTS annotations(
			id INTEGER PRIMARY KEY,
			profile_id INTEGER NOT NULL,
			work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
			edition_id INTEGER REFERENCES editions(id) ON DELETE CASCADE,
			asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
			locator_json TEXT NOT NULL,
			quote TEXT NOT NULL DEFAULT '',
			note TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS bookmarks(
			id INTEGER PRIMARY KEY,
			profile_id INTEGER NOT NULL,
			work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
			edition_id INTEGER REFERENCES editions(id) ON DELETE CASCADE,
			asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
			locator_json TEXT NOT NULL,
			label TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS activity_sessions(
			id INTEGER PRIMARY KEY,
			event_id TEXT UNIQUE,
			profile_id INTEGER NOT NULL,
			work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
			edition_id INTEGER REFERENCES editions(id) ON DELETE CASCADE,
			asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
			kind TEXT NOT NULL,
			started_at INTEGER NOT NULL,
			ended_at INTEGER NOT NULL,
			duration_seconds REAL NOT NULL DEFAULT 0,
			start_locator_json TEXT NOT NULL DEFAULT '{}',
			end_locator_json TEXT NOT NULL DEFAULT '{}',
			device_id TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS goals(
			id INTEGER PRIMARY KEY,
			profile_id INTEGER NOT NULL,
			kind TEXT NOT NULL,
			period TEXT NOT NULL,
			target REAL NOT NULL,
			started_at INTEGER NOT NULL,
			ends_at INTEGER NOT NULL,
			active INTEGER NOT NULL DEFAULT 1
		)`,
		`CREATE TABLE IF NOT EXISTS achievements(
			achievement_key TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT NOT NULL,
			tier TEXT NOT NULL DEFAULT '',
			rule_json TEXT NOT NULL DEFAULT '{}',
			enabled INTEGER NOT NULL DEFAULT 1
		)`,
		`CREATE TABLE IF NOT EXISTS achievement_progress(
			profile_id INTEGER NOT NULL,
			achievement_key TEXT NOT NULL REFERENCES achievements(achievement_key) ON DELETE CASCADE,
			value REAL NOT NULL DEFAULT 0,
			unlocked_at INTEGER,
			PRIMARY KEY(profile_id,achievement_key)
		)`,
		`CREATE INDEX IF NOT EXISTS work_authors_author ON work_authors(author_id,work_id)`,
		`CREATE INDEX IF NOT EXISTS work_series_series ON work_series(series_id,work_id)`,
		`CREATE INDEX IF NOT EXISTS work_genres_genre ON work_genres(genre_id,work_id)`,
		`CREATE INDEX IF NOT EXISTS metadata_values_entity ON metadata_values(entity_type,entity_id,field)`,
		`CREATE INDEX IF NOT EXISTS artwork_entity ON artwork(entity_type,entity_id,kind,selected)`,
		`CREATE INDEX IF NOT EXISTS activity_sessions_profile_time ON activity_sessions(profile_id,started_at)`,
		`CREATE VIEW IF NOT EXISTS work_spaces AS
			SELECT DISTINCT e.work_id,s.space
			FROM editions e
			JOIN edition_assets ea ON ea.edition_id=e.id
			JOIN assets a ON a.id=ea.asset_id
			JOIN sources s ON s.id=a.source_id`,
	} {
		if _, err = tx.Exec(stmt); err != nil {
			return err
		}
	}

	for _, stmt := range []string{
		"ALTER TABLE works ADD COLUMN subtitle TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE works ADD COLUMN description TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE works ADD COLUMN sort_title TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE works ADD COLUMN language TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE works ADD COLUMN first_published TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN title TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN subtitle TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN publisher TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN language TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN published_date TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN isbn10 TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN isbn13 TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN asin TEXT NOT NULL DEFAULT ''",
		"ALTER TABLE editions ADD COLUMN page_count INTEGER NOT NULL DEFAULT 0",
		"ALTER TABLE editions ADD COLUMN duration_seconds REAL NOT NULL DEFAULT 0",
	} {
		if _, alterErr := tx.Exec(stmt); alterErr != nil && !duplicateColumnError(alterErr) {
			return alterErr
		}
	}

	type legacyWork struct {
		id     int64
		author string
		series string
	}
	rows, err := tx.Query("SELECT id,author,series FROM works")
	if err != nil {
		return err
	}
	legacy := []legacyWork{}
	for rows.Next() {
		var item legacyWork
		if err = rows.Scan(&item.id, &item.author, &item.series); err != nil {
			rows.Close()
			return err
		}
		legacy = append(legacy, item)
	}
	if err = rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()
	for _, item := range legacy {
		if err = syncLegacyWorkEntities(tx, item.id, item.author, item.series); err != nil {
			return err
		}
	}

	if _, err = tx.Exec(`INSERT OR IGNORE INTO metadata_providers(provider_key,display_name,enabled,priority)
		VALUES('embedded','Embedded metadata',1,10),('path','Filename and folder metadata',1,20)`); err != nil {
		return err
	}
	if _, err = tx.Exec("PRAGMA user_version=3"); err != nil {
		return err
	}
	return tx.Commit()
}

func syncLegacyWorkEntities(tx *sql.Tx, workID int64, author, series string) error {
	if _, err := tx.Exec("DELETE FROM work_authors WHERE work_id=? AND source_kind='legacy'", workID); err != nil {
		return err
	}
	if name := strings.TrimSpace(author); name != "" {
		key := entityKey(name)
		if _, err := tx.Exec(`INSERT INTO authors(name,name_key,sort_name) VALUES(?,?,?)
			ON CONFLICT(name_key) DO UPDATE SET name=excluded.name`, name, key, name); err != nil {
			return err
		}
		var id int64
		if err := tx.QueryRow("SELECT id FROM authors WHERE name_key=?", key).Scan(&id); err != nil {
			return err
		}
		if _, err := tx.Exec(`INSERT OR IGNORE INTO work_authors(work_id,author_id,role,position,source_kind)
			VALUES(?,?,'author',0,'legacy')`, workID, id); err != nil {
			return err
		}
	}

	if _, err := tx.Exec("DELETE FROM work_series WHERE work_id=? AND source_kind='legacy'", workID); err != nil {
		return err
	}
	if name := strings.TrimSpace(series); name != "" {
		key := entityKey(name)
		if _, err := tx.Exec(`INSERT INTO series_entities(name,name_key) VALUES(?,?)
			ON CONFLICT(name_key) DO UPDATE SET name=excluded.name`, name, key); err != nil {
			return err
		}
		var id int64
		if err := tx.QueryRow("SELECT id FROM series_entities WHERE name_key=?", key).Scan(&id); err != nil {
			return err
		}
		if _, err := tx.Exec(`INSERT OR IGNORE INTO work_series(work_id,series_id,position,source_kind)
			VALUES(?,?,NULL,'legacy')`, workID, id); err != nil {
			return err
		}
	}
	return nil
}
