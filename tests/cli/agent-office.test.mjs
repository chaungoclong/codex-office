import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cli = new URL("../../scripts/agent-office", import.meta.url).pathname;

function run(args) {
  const configHome = mkdtempSync(join(tmpdir(), "agent-office-cli-"));
  try {
    return spawnSync("bash", [cli, ...args], {
      encoding: "utf8",
      env: { ...process.env, XDG_CONFIG_HOME: configHome },
    });
  } finally {
    rmSync(configHome, { recursive: true, force: true });
  }
}

test("prints command help without starting services", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /agent-office \[project-directory\]/);
  assert.match(result.stdout, /--no-open/);
});

test("rejects ports outside the unprivileged range", () => {
  const result = run(["--port", "80", "--no-open"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /1024 to 65535/);
});

test("rejects recognized agents without implemented adapters", () => {
  const result = run(["--agent", "pi", "--no-open"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /adapter is not implemented/);
});

test("rejects more than one project argument", () => {
  const result = run([process.cwd(), process.cwd(), "--no-open"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Only one project/);
});
