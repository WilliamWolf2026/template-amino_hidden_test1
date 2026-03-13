#!/usr/bin/env bun
// scaffold-rollback.ts — Revert the most recent scaffold sync commit
//
// Usage: bun scripts/scaffold-rollback.ts
//
// Safety: only acts if the latest commit matches the scaffold sync pattern.

import { execSync } from "node:child_process";

const SYNC_PATTERN = /^chore: sync scaffold to /;

function git(args: string): string {
  return execSync(`git ${args}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function run(): void {
  const message = git("log -1 --format=%s");

  if (!SYNC_PATTERN.test(message)) {
    console.error("[rollback] Latest commit is not a scaffold sync:");
    console.error(`[rollback]   "${message}"`);
    console.error("[rollback] Aborting — nothing to rollback.");
    process.exit(1);
  }

  const short = git("rev-parse --short HEAD");
  console.log(`[rollback] Reverting scaffold sync commit ${short}...`);

  execSync("git revert HEAD --no-edit", { stdio: "inherit" });

  console.log("[rollback] Scaffold sync reverted successfully.");
}

run();
