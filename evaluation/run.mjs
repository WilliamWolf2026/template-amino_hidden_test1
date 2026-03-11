#!/usr/bin/env node
/**
 * Scaffold evaluation runner.
 * Usage: node evaluation/run.mjs --game <gameName> --modification <id|description> [--label before|after]
 * Starts the app, runs the tests for the given modification, writes result to evaluation-results/.
 */

import { spawn } from "child_process";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const resultsDir = join(rootDir, "evaluation-results");

function parseArgs() {
  const args = process.argv.slice(2);
  let game = null;
  let modification = null;
  let label = "after";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--game" && args[i + 1]) {
      game = args[++i];
    } else if (args[i] === "--modification" && args[i + 1]) {
      modification = args[++i];
    } else if (args[i] === "--label" && args[i + 1]) {
      label = args[++i];
    }
  }
  return { game, modification, label };
}

async function loadModifications() {
  const path = join(rootDir, "e2e", "modifications.json");
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

function resolveModification(modifications, input) {
  const id = input.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  for (const m of modifications.modifications) {
    if (m.id === input || m.id === id) return m;
    if (m.description && m.description.toLowerCase().includes(input.toLowerCase()))
      return m;
  }
  return {
    id: id || "custom",
    description: input,
    grep: "@smoke",
  };
}

function extractTestResults(playwrightJson) {
  const tests = [];
  let passed = 0;
  let failed = 0;
  function walk(suite) {
    if (!suite) return;
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests || []) {
          const status = test.results?.[0]?.status || "skipped";
          const duration = test.results?.[0]?.duration ?? 0;
          tests.push({
            title: spec.title || test.title,
            status,
            duration,
          });
          if (status === "passed") passed++;
          else if (status === "failed" || status === "timedOut") failed++;
        }
      }
    }
    for (const child of suite.suites || []) walk(child);
  }
  for (const rootSuite of playwrightJson.suites || []) walk(rootSuite);
  const total = tests.length;
  const stats = playwrightJson.stats || {};
  const summary = total > 0
    ? { passed, failed, total }
    : {
        passed: stats.expected ?? 0,
        failed: stats.unexpected ?? 0,
        total: (stats.expected ?? 0) + (stats.unexpected ?? 0) + (stats.skipped ?? 0),
      };
  return { tests, summary };
}

function runPlaywright(grep, jsonOutputPath) {
  return new Promise((resolve, reject) => {
    const port = process.env.PLAYWRIGHT_PORT || "5173";
    const env = {
      ...process.env,
      EVALUATION_JSON_OUTPUT: jsonOutputPath,
      PLAYWRIGHT_PORT: port,
    };
    const child = spawn(
      "npx",
      ["playwright", "test", "--grep", grep],
      { cwd: rootDir, env, stdio: ["ignore", "pipe", "pipe"] }
    );
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      if (code === null || code === undefined) {
        reject(new Error(`Playwright process lost: ${stderr}`));
      } else {
        resolve(code);
      }
    });
  });
}

async function main() {
  const { game, modification, label } = parseArgs();
  if (!game || !modification) {
    console.error(
      "Usage: node evaluation/run.mjs --game <gameName> --modification <id|description> [--label before|after]"
    );
    process.exit(1);
  }

  const modifications = await loadModifications();
  const mod = resolveModification(modifications, modification);
  const slug = `${game}_${mod.id}_${label}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(resultsDir, `${slug}_${iso}.json`);

  await mkdir(resultsDir, { recursive: true });

  const playwrightJsonPath = join(resultsDir, `.playwright-${slug}-${Date.now()}.json`);
  console.log(`Running evaluation: game=${game} modification=${mod.id} label=${label}`);
  console.log(`Grep: ${mod.grep}`);

  await runPlaywright(mod.grep, playwrightJsonPath);

  let playwrightResult = {};
  try {
    const raw = await readFile(playwrightJsonPath, "utf-8");
    playwrightResult = JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read Playwright JSON:", e.message);
  }

  const { tests, summary } = extractTestResults(playwrightResult);
  const errors = playwrightResult.errors || [];
  if (errors.length > 0) {
    console.warn("Warning: Playwright reported errors (e.g. webServer failed):");
    errors.forEach((e) => console.warn("  -", e.message || e));
  }
  const evaluationResult = {
    gameName: game,
    modificationId: mod.id,
    modificationDescription: mod.description,
    label,
    timestamp: new Date().toISOString(),
    summary: { ...summary },
    tests,
    runErrors: errors.length > 0 ? errors.map((e) => e.message || String(e)) : undefined,
    _playwrightReport: playwrightResult,
  };

  await writeFile(jsonPath, JSON.stringify(evaluationResult, null, 2), "utf-8");
  try {
    await unlink(playwrightJsonPath);
  } catch (_) {}

  console.log(`Result: ${summary.passed} passed, ${summary.failed} failed, ${summary.total} total`);
  console.log(`Written: ${jsonPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
