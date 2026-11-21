import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { readFileSync } from "node:fs";
import * as schema from "./schema.js";

export function openDatabase(filename: string) {
  const sqlite = new Database(filename);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return { db: drizzle(sqlite, { schema }), sqlite };
}
export function migrateDatabase(sqlite: Database.Database): void {
  const migration = new URL("../migrations/0000_initial.sql", import.meta.url);
  sqlite.exec(readFileSync(migration, "utf8"));
}
export * from "./schema.js";
