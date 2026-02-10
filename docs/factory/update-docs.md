# /update-docs

Sync documentation index files with actual directory contents.

---

## Process

1. **Scan directories** for all `.md` files:
   - `docs/guides/` and subdirectories
   - `docs/factory/`
   - `docs/scaffold/`
   - Any other doc folders

2. **Compare** each `index.md` against actual files:
   - Find files listed but don't exist (remove)
   - Find files that exist but aren't listed (add)
   - Check folder structure diagrams match reality

3. **Update** each index file:
   - Add missing file references
   - Remove stale references
   - Update folder tree diagrams
   - Maintain existing organization/categories

4. **Report** changes made:
   - Files added to indexes
   - Files removed from indexes
   - Folders restructured

---

## Constraints

- Do NOT delete actual documentation files
- Do NOT change content of non-index files
- Preserve existing category organization in indexes
- Keep Quick Navigation tables accurate
- Maintain relative link paths

---

## Directories to Check

| Index Location | Covers |
|----------------|--------|
| `docs/guides/index.md` | All guides |
| `docs/factory/index.md` | All factory commands |
| `docs/guides/platform/mobile/index.md` | Mobile guides |
| `docs/README.md` | Main doc navigation |

---

## Output Format

```
Updated docs/guides/index.md:
  + Added: development/new-guide.md
  - Removed: old-guide.md (file deleted)
  ~ Updated folder structure diagram

Updated docs/factory/index.md:
  + Added: new-command.md

No changes needed: docs/guides/platform/mobile/index.md
```

---

## Example Usage

```
/update-docs
```

Or with scope:

```
/update-docs guides only
/update-docs factory only
```
