import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  runDependencyCheck,
  validateLockfile,
  validateManifest,
  validateWorkspace,
} from "../../scripts/check-dependencies.mjs";

const policy = {
  allowedBuildScripts: ["better-sqlite3", "esbuild"],
  blockedPackages: ["known-bad"],
  allowedLocalProtocols: ["workspace:"],
  blockedLockfilePatterns: ["@tanstack/setup", "router_init.js"],
};

test("repository satisfies dependency policy", () => {
  const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  assert.deepEqual(runDependencyCheck(root), []);
});

test("rejects unbounded, blocked, and remote source dependencies", () => {
  const errors = validateManifest(
    {
      dependencies: {
        loose: "latest",
        "known-bad": "1.0.0",
        remote: "git+https://example.test/repo.git",
      },
    },
    policy,
    "fixture/package.json",
  );
  assert.equal(errors.length, 3);
});

test("accepts workspace links but rejects an expanded build allowlist", () => {
  assert.deepEqual(
    validateManifest(
      { dependencies: { local: "workspace:*" } },
      policy,
      "fixture/package.json",
    ),
    [],
  );
  assert.equal(
    validateWorkspace(
      "allowBuilds:\n  better-sqlite3: true\n  esbuild: true\n  surprise: true\n",
      policy,
    ).length,
    1,
  );
});

test("requires lockfile integrity and rejects merge markers", () => {
  assert.equal(
    validateLockfile(
      'lockfileVersion: "9.0"\npackages:\n  x:\n    resolution: {integrity: sha512-safe}\n',
      policy,
    ).length,
    0,
  );
  assert.equal(
    validateLockfile('lockfileVersion: "9.0"\n<<<<<<< HEAD\n', policy).length,
    2,
  );
});

test("rejects TanStack compromise indicators", () => {
  const lockfile =
    'lockfileVersion: "9.0"\npackages:\n  x:\n    resolution: {integrity: sha512-safe}\n    optionalDependencies:\n      @tanstack/setup: github:tanstack/router\n';
  assert.equal(
    validateLockfile(lockfile, policy).some((error) =>
      error.includes("@tanstack/setup"),
    ),
    true,
  );
});
