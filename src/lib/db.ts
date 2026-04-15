import type { RunRecord } from "./types";

export interface DbAdapter {
  saveRun(record: RunRecord): void;
  getRun(runId: string): RunRecord | undefined;
  listRuns(limit?: number): RunRecord[];
  getLatestRunForUrlsHash(urlsHash: string): RunRecord | undefined;
}

let _sqliteDb: ReturnType<typeof initSqlite> | null = null;

function initSqlite() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  // Vercel's deployment filesystem is read-only; /tmp is the only writable path.
  const dbPath = process.env.VERCEL
    ? "/tmp/runs.db"
    : path.join(process.cwd(), "db", "runs.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      run_id      TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL,
      urls_hash   TEXT NOT NULL,
      competitors TEXT NOT NULL,
      urls        TEXT NOT NULL,
      role        TEXT,
      src_hashes  TEXT NOT NULL,
      theme_vecs  TEXT NOT NULL,
      report      TEXT NOT NULL
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_urls_hash ON runs (urls_hash, created_at DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_created_at ON runs (created_at DESC);`);

  return {
    insert: db.prepare(`
      INSERT OR REPLACE INTO runs (run_id, created_at, urls_hash, competitors, urls, role, src_hashes, theme_vecs, report)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    get: db.prepare("SELECT * FROM runs WHERE run_id = ?"),
    list: db.prepare("SELECT * FROM runs ORDER BY created_at DESC LIMIT ?"),
    latest: db.prepare("SELECT * FROM runs WHERE urls_hash = ? ORDER BY created_at DESC LIMIT 1"),
  };
}

function getSqlite() {
  if (!_sqliteDb) _sqliteDb = initSqlite();
  return _sqliteDb;
}

function rowToRecord(row: Record<string, string>): RunRecord {
  return {
    runId: row.run_id,
    createdAt: row.created_at,
    urlsHash: row.urls_hash,
    competitors: JSON.parse(row.competitors),
    urls: JSON.parse(row.urls),
    role: row.role as RunRecord["role"],
    srcHashes: JSON.parse(row.src_hashes),
    themeVecs: JSON.parse(row.theme_vecs),
    report: JSON.parse(row.report),
  };
}

function createSqliteAdapter(): DbAdapter {
  return {
    saveRun(record: RunRecord) {
      getSqlite().insert.run(
        record.runId,
        record.createdAt,
        record.urlsHash,
        JSON.stringify(record.competitors),
        JSON.stringify(record.urls),
        record.role,
        JSON.stringify(record.srcHashes),
        JSON.stringify(record.themeVecs),
        JSON.stringify(record.report)
      );
    },
    getRun(runId: string) {
      const row = getSqlite().get.get(runId);
      return row ? rowToRecord(row as Record<string, string>) : undefined;
    },
    listRuns(limit = 50) {
      const rows = getSqlite().list.all(limit) as Record<string, string>[];
      return rows.map(rowToRecord);
    },
    getLatestRunForUrlsHash(urlsHash: string) {
      const row = getSqlite().latest.get(urlsHash);
      return row ? rowToRecord(row as Record<string, string>) : undefined;
    },
  };
}

function createKvAdapter(): DbAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { kv } = require("@vercel/kv");

  const saveRun = async (record: RunRecord) => {
    await kv.set(`run:${record.runId}`, JSON.stringify(record));
    await kv.zadd("runs:by_date", {
      score: new Date(record.createdAt).getTime(),
      member: record.runId,
    });
    await kv.set(`urls_hash:${record.urlsHash}:latest`, record.runId);
  };

  const getRun = async (runId: string) => {
    const data = await kv.get(`run:${runId}`);
    return data
      ? ((typeof data === "string" ? JSON.parse(data) : data) as RunRecord)
      : undefined;
  };

  const listRuns = async (limit = 50) => {
    const ids = (await kv.zrange("runs:by_date", 0, limit - 1, {
      rev: true,
    })) as string[];
    const runs: RunRecord[] = [];
    for (const id of ids) {
      const data = await kv.get(`run:${id}`);
      if (data)
        runs.push(
          (typeof data === "string" ? JSON.parse(data) : data) as RunRecord
        );
    }
    return runs;
  };

  const getLatestRunForUrlsHash = async (urlsHash: string) => {
    const runId = await kv.get(`urls_hash:${urlsHash}:latest`);
    if (!runId) return undefined;
    const data = await kv.get(`run:${runId}`);
    return data
      ? ((typeof data === "string" ? JSON.parse(data) : data) as RunRecord)
      : undefined;
  };

  return {
    saveRun,
    getRun,
    listRuns,
    getLatestRunForUrlsHash,
  } as unknown as DbAdapter;
}

export const db: DbAdapter = process.env.KV_URL
  ? createKvAdapter()
  : createSqliteAdapter();
