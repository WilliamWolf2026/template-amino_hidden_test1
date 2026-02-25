# Code Chopper Setup Guide

Semantic code parsing for AI-assisted workflows. Uses [tree-sitter](https://tree-sitter.github.io/) to split source files into meaningful chunks (functions, classes, interfaces) instead of raw lines.

**Repo:** https://github.com/sirasagi62/code-chopper

---

## Install

```bash
bun add -d code-chopper
bun pm trust --all        # required — tree-sitter needs native builds
```

Verify it works:

```bash
bun -e "import { createParserFactory } from 'code-chopper'; const f = createParserFactory(); const p = await f.createParser('typescript'); console.log('ok'); f.dispose();"
```

### Supported Languages

TypeScript, JavaScript, Python, C, C++, Ruby, Rust, Go, Java, C#, Bash

---

## Scripts

Create a `scripts/` directory at project root. All scripts run with `bun scripts/<name>.ts`.

### 1. Codebase Map Generator

Produces a markdown index of every function, class, interface, and type in your source code. Useful as orientation for new sessions or onboarding.

```typescript
// scripts/generate-map.ts
import { createParserFactory, readDirectoryAndChunk } from "code-chopper";

const factory = createParserFactory();

const chunks = await readDirectoryAndChunk(factory, {
  filter: (_lang, node) => [
    "function_declaration",
    "class_declaration",
    "export_statement",
    "interface_declaration",
    "type_alias_declaration",
    "method_definition",
  ].includes(node.type),
  excludeDirs: [/node_modules/, /dist/, /\.git/],
}, process.cwd());

const map = new Map<string, string[]>();
for (const chunk of chunks) {
  const rel = chunk.filePath.replace(process.cwd() + "/", "");
  if (!map.has(rel)) map.set(rel, []);
  map.get(rel)!.push(
    `  L${chunk.start.row}: ${chunk.boundary.type} ${chunk.boundary.name ?? "(anonymous)"}`
  );
}

console.log("# Code Map\n");
console.log(`Generated: ${new Date().toISOString()}\n`);
for (const [file, entries] of [...map].sort()) {
  console.log(`## ${file}`);
  entries.forEach(e => console.log(e));
  console.log();
}

factory.dispose();
```

**Run:**

```bash
bun scripts/generate-map.ts > docs/code-map.md
```

**Add to package.json:**

```json
"scripts": {
  "map": "bun scripts/generate-map.ts > docs/code-map.md"
}
```

### 2. Focused Context Builder

Takes a function or class name and returns only that chunk, formatted as a context block. Useful for feeding precise context to an LLM without reading entire files.

```typescript
// scripts/context-for.ts
import { createParserFactory, readDirectoryAndChunk } from "code-chopper";

const target = process.argv[2];
if (!target) {
  console.error("Usage: bun scripts/context-for.ts <name>");
  console.error("Example: bun scripts/context-for.ts MyComponent");
  process.exit(1);
}

const factory = createParserFactory();

const chunks = await readDirectoryAndChunk(factory, {
  excludeDirs: [/node_modules/, /dist/, /\.git/],
}, process.cwd());

const matches = chunks.filter(c =>
  c.boundary.name?.toLowerCase() === target.toLowerCase()
);

if (!matches.length) {
  console.error(`No chunks found matching "${target}"`);
  console.error("\nAvailable names (sample):");
  const named = chunks.filter(c => c.boundary.name).slice(0, 20);
  named.forEach(c => {
    const rel = c.filePath.replace(process.cwd() + "/", "");
    console.error(`  ${c.boundary.name} (${rel}:${c.start.row})`);
  });
  process.exit(1);
}

for (const match of matches) {
  const rel = match.filePath.replace(process.cwd() + "/", "");
  console.log(`<file path="${rel}" lines="${match.start.row}-${match.end.row}">`);
  console.log(match.content);
  console.log("</file>\n");
}

factory.dispose();
```

**Run:**

```bash
bun scripts/context-for.ts GameAudioManager
bun scripts/context-for.ts calculateScore
```

**Add to package.json:**

```json
"scripts": {
  "context": "bun scripts/context-for.ts"
}
```

Then: `bun run context MyClass`

### 3. Diff-Aware Context

Shows which functions were affected by current git changes. Useful for focused code review — gives the LLM only the modified functions, not raw diffs.

```typescript
// scripts/changed-functions.ts
import { createParserFactory, readFileAndChunk } from "code-chopper";
import { execSync } from "child_process";

const factory = createParserFactory();

const diff = execSync("git diff --name-only HEAD").toString().trim();
if (!diff) {
  console.log("No changes detected.");
  process.exit(0);
}

const files = diff.split("\n").filter(f => /\.(ts|tsx|js|jsx|py|rs|go)$/.test(f));
if (!files.length) {
  console.log("No supported code files changed.");
  process.exit(0);
}

for (const file of files) {
  const lineDiff = execSync(`git diff -U0 HEAD -- ${file}`).toString();
  const changedLines = new Set<number>();

  for (const match of lineDiff.matchAll(/@@ .+?\+(\d+)(?:,(\d+))? @@/g)) {
    const start = parseInt(match[1]);
    const count = parseInt(match[2] ?? "1");
    for (let i = start; i < start + count; i++) changedLines.add(i);
  }

  let chunks;
  try {
    chunks = await readFileAndChunk(factory, {}, process.cwd(), file);
  } catch {
    continue; // skip files that can't be parsed
  }

  for (const chunk of chunks) {
    const overlaps = [...changedLines].some(
      line => line >= chunk.start.row && line <= chunk.end.row
    );
    if (overlaps) {
      console.log(`## ${file} — ${chunk.boundary.name ?? chunk.boundary.type}`);
      console.log(`Lines ${chunk.start.row}-${chunk.end.row}\n`);
      console.log("```");
      console.log(chunk.content);
      console.log("```\n");
    }
  }
}

factory.dispose();
```

**Run:**

```bash
bun scripts/changed-functions.ts
```

**Add to package.json:**

```json
"scripts": {
  "changed": "bun scripts/changed-functions.ts"
}
```

---

## Wiring Into Your Workflow

### Package.json (all scripts)

```json
"scripts": {
  "map": "bun scripts/generate-map.ts > docs/code-map.md",
  "context": "bun scripts/context-for.ts",
  "changed": "bun scripts/changed-functions.ts"
}
```

### Optional: Pre-commit Hook (with husky)

Auto-regenerate the code map on every commit:

```bash
bun add -d husky
npx husky init
echo 'bun run map && git add docs/code-map.md' > .husky/pre-commit
```

### Optional: CLAUDE.md Integration

Add to your project's CLAUDE.md so Claude knows these tools exist:

```markdown
## Code Analysis Scripts

- `bun run map` — Regenerate docs/code-map.md (function/class index)
- `bun run context <name>` — Get focused context for a specific function or class
- `bun run changed` — Show which functions were affected by current git changes
```

---

## Customization

### Filtering Chunks

The `filter` option controls what gets extracted. Adjust to match your project:

```typescript
// Only top-level exports
filter: (_lang, node) => node.type === "export_statement"

// Only classes and their methods
filter: (_lang, node) => ["class_declaration", "method_definition"].includes(node.type)

// Everything (no filter)
filter: undefined
```

### Excluding Directories

```typescript
excludeDirs: [
  /node_modules/,
  /dist/,
  /\.git/,
  /coverage/,
  /vendor/,        // add project-specific exclusions
  /generated/,
]
```

### Output Formats

The scripts above output markdown. Modify the output section to produce JSON, XML, or any format your tools consume:

```typescript
// JSON output
console.log(JSON.stringify(chunks.map(c => ({
  name: c.boundary.name,
  type: c.boundary.type,
  file: c.filePath.replace(process.cwd() + "/", ""),
  startLine: c.start.row,
  endLine: c.end.row,
})), null, 2));
```

---

## Core API Reference

```typescript
import {
  createParserFactory,    // Create a parser manager
  readFileAndChunk,       // Parse a single file
  readDirectoryAndChunk,  // Parse a directory recursively
  parseCodeAndChunk,      // Parse a raw code string
  LanguageEnum,           // Language identifiers
} from "code-chopper";
```

### Chunk Shape

Each chunk returned contains:

```typescript
{
  content: string;           // The actual code
  filePath: string;          // Absolute file path
  start: { row, column };    // Start position
  end: { row, column };      // End position
  language: LanguageEnum;    // Detected language
  boundary: {
    type: string;            // e.g., "function_declaration"
    name?: string;           // e.g., "calculateScore"
    level?: number;          // Nesting depth
    parent?: string[];       // Parent scope chain
    docs?: string;           // Attached doc comment
  };
}
```

---

## Troubleshooting

**"Cannot find module 'code-chopper'"**
Run `bun install` — the package may not have installed fully.

**"Error: Could not load tree-sitter"**
Tree-sitter needs native binaries. Run `bun pm trust --all` then `bun install` to allow postinstall scripts.

**Slow on large repos**
Add more entries to `excludeDirs`. Tree-sitter parses every file it finds, so excluding `node_modules`, `dist`, and other non-source directories is essential.

**Missing chunks for a language**
Check the supported languages list. If your language isn't listed, code-chopper won't parse it.
