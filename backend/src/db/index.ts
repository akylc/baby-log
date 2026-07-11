import { DatabaseSync } from 'node:sqlite'
import { config } from '../config'

export const db = new DatabaseSync(config.dbPath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS babies (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  birthday   TEXT,
  gender     TEXT DEFAULT 'unknown',   -- male | female | unknown
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id      INTEGER NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,          -- breast | formula | food | bottle
  side         TEXT,                   -- 废弃：原 左/右/左右 单选，现已改为分别记录时长
  amount_ml    INTEGER,                -- 配方奶/瓶喂奶量(毫升)
  duration_min INTEGER,                -- 废弃：原母乳总时长，已拆分为左右
  left_duration_min  INTEGER,          -- 母乳·左乳时长(分钟)
  right_duration_min INTEGER,          -- 母乳·右乳时长(分钟)
  food_name    TEXT,                   -- 辅食名称
  note         TEXT,
  occurred_at  TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sleeps (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id      INTEGER NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  duration_min INTEGER NOT NULL,
  note         TEXT,
  occurred_at  TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diapers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id      INTEGER NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,          -- pee | poo | both
  note         TEXT,
  occurred_at  TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_babies_user    ON babies(user_id);
CREATE INDEX IF NOT EXISTS idx_feedings_baby  ON feedings(baby_id);
CREATE INDEX IF NOT EXISTS idx_sleeps_baby    ON sleeps(baby_id);
CREATE INDEX IF NOT EXISTS idx_diapers_baby   ON diapers(baby_id);
`

db.exec(schema)

// 迁移（开发期向前兼容）：feedings 支持左右乳分别记录时长
const feedingCols = (db.prepare('PRAGMA table_info(feedings)').all() as { name: string }[]).map((c) => c.name)
if (!feedingCols.includes('left_duration_min')) db.exec('ALTER TABLE feedings ADD COLUMN left_duration_min INTEGER')
if (!feedingCols.includes('right_duration_min')) db.exec('ALTER TABLE feedings ADD COLUMN right_duration_min INTEGER')
