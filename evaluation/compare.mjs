#!/usr/bin/env node
/**
 * Compare before/after evaluation results and produce a report.
 * Usage: node evaluation/compare.mjs --before <path.json> --after <path.json> [--output <report.md>]
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  let before = null;
  let after = null;
  let output = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--before" && args[i + 1]) before = args[++i];
    else if (args[i] === "--after" && args[i + 1]) after = args[++i];
    else if (args[i] === "--output" && args[i + 1]) output = args[++i];
  }
  return { before, after, output };
}

function byTitle(t) {
  return t.title || "";
}

function buildReport(beforeData, afterData) {
  const b = beforeData.summary || {};
  const a = afterData.summary || {};
  const beforeTests = new Map((beforeData.tests || []).map((t) => [byTitle(t), t]));
  const afterTests = new Map((afterData.tests || []).map((t) => [byTitle(t), t]));
  const allTitles = new Set([...beforeTests.keys(), ...afterTests.keys()]);

  const nowPassing = [];
  const nowFailing = [];
  const unchanged = [];
  const added = [];
  const removed = [];

  for (const title of allTitles) {
    const bt = beforeTests.get(title);
    const at = afterTests.get(title);
    const bPass = bt?.status === "passed";
    const aPass = at?.status === "passed";
    if (!bt && at) added.push({ title, status: at.status });
    else if (bt && !at) removed.push({ title, status: bt.status });
    else if (bPass && !aPass) nowFailing.push(title);
    else if (!bPass && aPass) nowPassing.push(title);
    else unchanged.push(title);
  }

  const lines = [
    "# Scaffold Evaluation Report",
    "",
    "## Run details",
    "",
    `| | Before | After |`,
    `|---|--------|--------|`,
    `| **Game** | ${beforeData.gameName || "—"} | ${afterData.gameName || "—"} |`,
    `| **Modification** | ${beforeData.modificationDescription || beforeData.modificationId || "—"} | ${afterData.modificationDescription || afterData.modificationId || "—"} |`,
    `| **Timestamp** | ${beforeData.timestamp || "—"} | ${afterData.timestamp || "—"} |`,
    `| **Passed** | ${b.passed ?? "—"} | ${a.passed ?? "—"} |`,
    `| **Failed** | ${b.failed ?? "—"} | ${a.failed ?? "—"} |`,
    `| **Total** | ${b.total ?? "—"} | ${a.total ?? "—"} |`,
    "",
    "## Impact summary",
    "",
    `- **Now passing:** ${nowPassing.length}`,
    `- **Now failing:** ${nowFailing.length}`,
    `- **Unchanged:** ${unchanged.length}`,
    `- **Added (after only):** ${added.length}`,
    `- **Removed (before only):** ${removed.length}`,
    "",
  ];

  if (nowPassing.length) {
    lines.push("### Now passing", "");
    nowPassing.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }
  if (nowFailing.length) {
    lines.push("### Now failing", "");
    nowFailing.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }
  if (added.length) {
    lines.push("### Added in after run", "");
    added.forEach(({ title, status }) => lines.push(`- ${title} (${status})`));
    lines.push("");
  }
  if (removed.length) {
    lines.push("### Removed in after run", "");
    removed.forEach(({ title, status }) => lines.push(`- ${title} (${status})`));
    lines.push("");
  }

  lines.push("## Conclusion", "");
  if (nowFailing.length > 0 && nowPassing.length === 0) {
    lines.push("**Regression:** The modification introduced new failures.");
  } else if (nowPassing.length > 0 && nowFailing.length === 0) {
    lines.push("**Improvement:** The modification fixed previously failing tests.");
  } else if (nowFailing.length === 0 && nowPassing.length === 0 && added.length === 0 && removed.length === 0) {
    lines.push("**No change:** Test outcomes are unchanged.");
  } else {
    lines.push("**Mixed:** Some tests improved, some regressed.");
  }
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const { before, after, output } = parseArgs();
  if (!before || !after) {
    console.error(
      "Usage: node evaluation/compare.mjs --before <path.json> --after <path.json> [--output <report.md>]"
    );
    process.exit(1);
  }

  const beforeRaw = await readFile(before, "utf-8");
  const afterRaw = await readFile(after, "utf-8");
  const beforeData = JSON.parse(beforeRaw);
  const afterData = JSON.parse(afterRaw);

  const report = buildReport(beforeData, afterData);

  if (output) {
    await mkdir(dirname(output), { recursive: true }).catch(() => {});
    await writeFile(output, report, "utf-8");
    console.log(`Report written to ${output}`);
  } else {
    console.log(report);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
