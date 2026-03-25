# Amino E2E Validation

How to verify the amino update workflow works end-to-end.

## Automated Tests

The E2E test suite covers the full workflow using temporary git repos:

```bash
bun test tests/unit/scripts/scaffold-e2e.test.ts
```

### What it tests

| Test | Verifies |
|------|----------|
| release: bumps version, creates tag, generates changelog | `amino:release` creates correct version, tag, and CHANGELOG.md |
| sync: pulls update into game, preserves game files | `amino:sync` updates core/modules, leaves game files untouched |
| rollback: reverts a sync commit | `amino:rollback` restores pre-sync state |
| rollback: refuses if latest commit is not a sync | Rollback safety check rejects non-sync commits |
| drift: reports clean when no local changes | `amino:drift` exits 0 when game matches upstream |
| drift: detects local modifications | `amino:drift` exits 1 and lists modified files |
| full workflow: release → sync → verify drift clean | Complete flow from release to synced game with clean drift |

## Manual Validation on a Real Game

To validate against an actual game repo:

### 1. Make an amino change

```bash
# In template-amino
echo "// test change" >> src/core/index.ts
git add src/core/index.ts
git commit -m "test: amino update for e2e validation"
```

### 2. Release

```bash
bun run amino:release patch
git push
git push origin amino-v<new-version>
```

### 3. Verify GitHub Release was created

Check https://github.com/wolfgames/template-amino/releases for the new release.

### 4. Sync from game repo

```bash
# In the game repo
bun run amino:sync
```

### 5. Verify

```bash
bun run amino:verify    # typecheck + lint + build
bun run amino:drift     # should report clean
```

### 6. Check metadata

```bash
node -e "console.log(JSON.stringify(require('./package.json').amino, null, 2))"
```

Expected output:
```json
{
  "version": "<new-version>",
  "syncedAt": "<today>",
  "syncedFrom": "<commit-sha>"
}
```

### 7. Test rollback (optional)

```bash
bun run amino:rollback
# Verify core files reverted
bun run amino:drift     # should now report drift
```
