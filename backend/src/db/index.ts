import Database from 'better-sqlite3'
import { config } from '../config'

export const db = new Database(config.dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topics (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topic_tags (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  color    TEXT,
  UNIQUE (topic_id, name)
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id    INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  note        TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS record_types (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  key     TEXT NOT NULL UNIQUE,
  label   TEXT NOT NULL,
  icon    TEXT,
  schema  TEXT
);

CREATE TABLE IF NOT EXISTS records (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type_id    INTEGER NOT NULL REFERENCES record_types(id),
  payload    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS record_tags (
  record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  tag_id    INTEGER NOT NULL REFERENCES topic_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, tag_id)
);

CREATE TABLE IF NOT EXISTS event_tags (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES topic_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_events_topic ON events(topic_id);
CREATE INDEX IF NOT EXISTS idx_records_event ON records(event_id);
CREATE INDEX IF NOT EXISTS idx_record_tags_record ON record_tags(record_id);
CREATE INDEX IF NOT EXISTS idx_record_tags_tag ON record_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_event_tags_event ON event_tags(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tags_tag ON event_tags(tag_id);
`

db.exec(schema)

// 种子数据：默认用户（MVP 默认 user_id=1）
const userCount = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c
if (userCount === 0) {
  db.prepare('INSERT INTO users(id, name) VALUES(1, ?)').run('默认用户')
}

// 种子数据：5 种默认记录类型
const typeCount = (db.prepare('SELECT COUNT(*) AS c FROM record_types').get() as { c: number }).c
if (typeCount === 0) {
  const insert = db.prepare('INSERT INTO record_types(key, label, icon, schema) VALUES(?, ?, ?, ?)')
  const seed = db.transaction(
    (rows: [string, string, string, string][]) => {
      for (const r of rows) insert.run(...r)
    },
  )
  seed([
    ['text', '文本', 'text', JSON.stringify({ fields: [{ name: 'content', type: 'string', label: '内容', required: true }] })],
    ['image', '图片', 'image', JSON.stringify({ fields: [{ name: 'url', type: 'string', label: '图片URL', required: true }] })],
    ['link', '链接', 'link', JSON.stringify({ fields: [{ name: 'url', type: 'string', label: '链接', required: true }] })],
    ['location', '位置', 'location', JSON.stringify({ fields: [{ name: 'place', type: 'string', label: '地点', required: true }] })],
    ['tag', '标签', 'tag', JSON.stringify({ fields: [{ name: 'text', type: 'string', label: '标签文字', required: true }] })],
  ])
}

// MVP 默认归属用户：服务端按多用户架构设计，此处固定 user_id=1，预留鉴权扩展
export function getUserId(): number {
  return 1
}
