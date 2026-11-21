import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { migrateDatabase, openDatabase } from "./index.js";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("database bootstrap", () => {
  it("enables foreign keys, WAL, and creates required tables", () => {
    const directory = mkdtempSync(join(tmpdir(), "codex-office-db-"));
    directories.push(directory);
    const { sqlite } = openDatabase(join(directory, "office.db"));
    migrateDatabase(sqlite);
    expect(sqlite.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(sqlite.pragma("journal_mode", { simple: true })).toBe("wal");
    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    expect(tables.map((table) => table.name)).toEqual(
      expect.arrayContaining([
        "projects",
        "tasks",
        "agent_sessions",
        "approval_requests",
        "audit_logs",
      ]),
    );
    sqlite.close();
  });

  it("can apply the idempotent migration twice", () => {
    const directory = mkdtempSync(join(tmpdir(), "codex-office-db-"));
    directories.push(directory);
    const { sqlite } = openDatabase(join(directory, "office.db"));
    expect(() => {
      migrateDatabase(sqlite);
      migrateDatabase(sqlite);
    }).not.toThrow();
    sqlite.close();
  });
});
