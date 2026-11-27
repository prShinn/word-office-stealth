// Giả lập phần API của D1 mà worker dùng, trên SQLite tích hợp của Node 24
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

export function createLocalDb(path) {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

  const statement = (sql, args) => ({
    bind: (...next) => statement(sql, next),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } })
  });

  return { prepare: (sql) => statement(sql, []), close: () => db.close() };
}
