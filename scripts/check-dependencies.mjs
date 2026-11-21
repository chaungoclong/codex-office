#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

export function findManifests(root) {
  const results = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (["node_modules", ".git", "dist", ".pnpm-store"].includes(entry.name))
        continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name === "package.json") results.push(path);
    }
  };
  visit(root);
  return results.sort();
}

export function validateManifest(manifest, policy, label = "package.json") {
  const errors = [];
  if (
    label === "package.json" &&
    !/^pnpm@\d+\.\d+\.\d+$/.test(manifest.packageManager ?? "")
  )
    errors.push(`${label}: packageManager must pin an exact pnpm version`);
  for (const section of dependencySections) {
    for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
      if (policy.blockedPackages.includes(name))
        errors.push(`${label}: blocked package ${name}`);
      if (specifier === "*" || specifier === "latest")
        errors.push(`${label}: ${name} uses unbounded version ${specifier}`);
      const sourceProtocol = /^(git\+|git:|github:|https?:|file:|link:)/.exec(
        specifier,
      )?.[0];
      if (
        sourceProtocol &&
        !policy.allowedLocalProtocols.some((allowed) =>
          specifier.startsWith(allowed),
        )
      )
        errors.push(`${label}: ${name} uses prohibited source ${specifier}`);
    }
  }
  return errors;
}

export function validateWorkspace(workspaceText, policy) {
  const errors = [];
  const allowed = [...workspaceText.matchAll(/^\s{2}([@\w./-]+): true$/gm)]
    .map((match) => match[1])
    .sort();
  const expected = [...policy.allowedBuildScripts].sort();
  if (JSON.stringify(allowed) !== JSON.stringify(expected))
    errors.push(
      `pnpm-workspace.yaml: allowBuilds must equal policy allowlist (${expected.join(", ")})`,
    );
  return errors;
}

export function validateLockfile(
  lockfileText,
  policy = { blockedLockfilePatterns: [] },
) {
  const errors = [];
  if (!/^lockfileVersion: ["']?9\.0["']?$/m.test(lockfileText))
    errors.push("pnpm-lock.yaml: unsupported or missing lockfileVersion");
  if (/^(<{7}|={7}|>{7})/m.test(lockfileText))
    errors.push("pnpm-lock.yaml: unresolved merge markers");
  if (/(?:git\+|git:|github:|http:\/\/)/i.test(lockfileText))
    errors.push("pnpm-lock.yaml: prohibited insecure or VCS dependency source");
  const integrityCount = (lockfileText.match(/integrity:\s*sha512-/g) ?? [])
    .length;
  if (integrityCount === 0)
    errors.push("pnpm-lock.yaml: no sha512 integrity records found");
  for (const indicator of policy.blockedLockfilePatterns ?? []) {
    if (lockfileText.includes(indicator))
      errors.push(
        `pnpm-lock.yaml: known compromise indicator found: ${indicator}`,
      );
  }
  return errors;
}

export function runDependencyCheck(root = process.cwd()) {
  const policyPath = resolve(root, "config/dependency-policy.json");
  const lockfilePath = resolve(root, "pnpm-lock.yaml");
  const workspacePath = resolve(root, "pnpm-workspace.yaml");
  const required = [policyPath, lockfilePath, workspacePath];
  const missing = required.filter((path) => !existsSync(path));
  if (missing.length)
    return missing.map((path) => `Missing required file: ${path}`);
  const policy = JSON.parse(readFileSync(policyPath, "utf8"));
  const errors = [];
  for (const manifestPath of findManifests(root)) {
    const relative = manifestPath.slice(root.length + 1);
    errors.push(
      ...validateManifest(
        JSON.parse(readFileSync(manifestPath, "utf8")),
        policy,
        relative,
      ),
    );
  }
  errors.push(
    ...validateWorkspace(readFileSync(workspacePath, "utf8"), policy),
  );
  errors.push(...validateLockfile(readFileSync(lockfilePath, "utf8"), policy));
  return errors;
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) {
  const errors = runDependencyCheck();
  if (errors.length) {
    console.error(
      `Dependency policy failed (${errors.length}):\n- ${errors.join("\n- ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      "Dependency policy passed: manifests, lockfile integrity, sources, and build-script allowlist are valid.",
    );
  }
}
