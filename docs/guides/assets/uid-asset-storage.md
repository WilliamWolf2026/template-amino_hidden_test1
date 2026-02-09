# UID-Based Asset Storage

> Strategy for storing assets in flat cloud buckets using UID-suffixed filenames while preserving human readability and local development workflow.

---

## Overview

When deploying game assets to cloud storage (GCS, S3, etc.), we face a challenge: local development uses folder hierarchies and human-readable filenames, but production benefits from flat storage with content-addressed identifiers for caching and versioning.

This document describes an approach that **appends UIDs as filename suffixes** rather than replacing filenames entirely, preserving readability while gaining the benefits of content-addressing.

---

## The Problem

### Asset Files Reference Each Other

Game assets are not independent files. They contain **hardcoded internal references** to companion files:

**Texture Atlas (Pixi Spritesheet):**
```json
{
  "frames": { ... },
  "meta": {
    "image": "atlas-tiles-citylines.png",
    "size": { "w": 906, "h": 895 }
  }
}
```

**Audio Sprite (Howler):**
```json
{
  "src": [
    "sfx-citylines.webm",
    "sfx-citylines.mp3"
  ],
  "sprite": { ... }
}
```

When Pixi loads an atlas JSON, it reads `meta.image` and constructs a URL to fetch the PNG. This assumes:
1. The PNG filename matches exactly what's in the JSON
2. The PNG is in the same directory as the JSON

### Why Pure UIDs Break This

If we rename files to opaque UIDs:

```
Local:       atlas-tiles-citylines.json  →  Bucket: a1b2c3d4.json
Local:       atlas-tiles-citylines.png   →  Bucket: e5f6g7h8.png
```

The JSON still contains:
```json
{ "meta": { "image": "atlas-tiles-citylines.png" } }
```

Pixi tries to load `atlas-tiles-citylines.png`, which doesn't exist. The reference is **inside the file content**, so renaming files doesn't fix it.

### The Content Must Be Modified

You cannot solve this with:
- File renaming (doesn't change JSON contents)
- Manifest mappings (Pixi reads the JSON directly)
- CDN URL rewrites (the reference is in the payload)

**The JSON file's actual content must be transformed.**

---

## The Solution: UID-Suffixed Filenames

Instead of replacing filenames with opaque UIDs, **append the UID as a suffix**:

```
atlas-tiles-citylines.json  →  atlas-tiles-citylines-a1b2c3d4.json
atlas-tiles-citylines.png   →  atlas-tiles-citylines-e5f6g7h8.png
```

### Benefits

| Aspect | Pure UID | UID Suffix |
|--------|----------|------------|
| Human can identify file | No | Yes |
| Bucket is browsable | No | Yes |
| Debugging production | Hard | Easy |
| Memory key derivable | Needs lookup | Can parse |
| Logs make sense | No | Yes |

### Format

```
{original-name}-{8-char-hash}.{ext}
```

- **Original name**: Preserved for identification
- **Separator**: Single hyphen (consistent with existing naming)
- **Hash**: 8 hexadecimal characters (4 billion combinations)
- **Extension**: Unchanged

Examples:
```
atlas-tiles-citylines-a1b2c3d4.json
atlas-tiles-citylines-e5f6g7h8.png
atlas-branding-wolf-f9g0h1i2.json
sfx-citylines-j3k4l5m6.json
sfx-citylines-m7n8o9p0.webm
```

---

## How Internal References Are Transformed

### Original JSON (Local Development)

```json
{
  "frames": { ... },
  "meta": {
    "image": "atlas-tiles-citylines.png"
  }
}
```

### Transformed JSON (Production)

```json
{
  "frames": { ... },
  "meta": {
    "image": "atlas-tiles-citylines-e5f6g7h8.png"
  }
}
```

Or with absolute URL:
```json
{
  "meta": {
    "image": "https://cdn.example.com/atlas-tiles-citylines-e5f6g7h8.png"
  }
}
```

The transformation inserts the UID suffix into the referenced filename.

---

## Memory Slot Keys

The game code references assets by **logical name** (memory slot key):

```typescript
gpuLoader.getTexture('atlas-tiles-citylines', 'house.png');
```

This key is derived from the filename by stripping the UID suffix and extension:

```
atlas-tiles-citylines-a1b2c3d4.json
            ↓
Strip UID suffix: /-[a-f0-9]{8}$/
            ↓
atlas-tiles-citylines.json
            ↓
Strip extension
            ↓
atlas-tiles-citylines   ← Memory slot key
```

**Game code never changes.** The loader handles the translation.

---

## Transformation Pipeline

### Step-by-Step Process

```
1. Scan local assets
        ↓
2. Build dependency graph
   (JSON → PNG, JSON → WEBM, etc.)
        ↓
3. Hash leaf nodes first (PNGs, audio files)
        ↓
4. Upload leaf nodes with UID-suffixed names
        ↓
5. Rewrite JSON files:
   - Parse JSON
   - Find reference fields (meta.image, src[], etc.)
   - Insert UID suffix into each reference
        ↓
6. Hash rewritten JSONs
        ↓
7. Upload JSONs with UID-suffixed names
        ↓
8. Generate manifest mapping logical names → suffixed names
        ↓
9. Upload manifest
```

### Dependency Order

Assets must be processed in dependency order:

1. **Leaf nodes first**: PNG, MP3, WEBM (no internal references)
2. **JSON files second**: Reference the already-processed leaf nodes
3. **Manifest last**: References all processed files

### Format-Specific Reference Locations

| Format | File Type | Reference Field | Points To |
|--------|-----------|-----------------|-----------|
| Pixi Spritesheet | `.json` | `meta.image` | Single PNG |
| Howler Audio Sprite | `.json` | `src[]` | Array of audio files |
| Spine Skeleton | `.json` | `skeleton.atlas` | Atlas file |
| Bitmap Font | `.fnt` | `file=` attribute | PNG file |

Each format needs a parser that knows where to find and rewrite references.

---

## Manifest Integration

### Local Development Manifest

```typescript
{
  cdnBase: '/assets/assets/v1',
  bundles: [
    { name: 'atlas-tiles-citylines', assets: ['atlases/atlas-tiles-citylines.json'] }
  ]
}
```

Paths are relative, JSON files have relative image references. Works unchanged.

### Production Manifest

**Option A: Full suffixed paths**
```typescript
{
  cdnBase: 'https://cdn.example.com',
  bundles: [
    {
      name: 'atlas-tiles-citylines',
      assets: ['atlas-tiles-citylines-a1b2c3d4.json']
    }
  ]
}
```

**Option B: Separate UID lookup**
```typescript
{
  cdnBase: 'https://cdn.example.com',
  uids: {
    'atlas-tiles-citylines.json': 'a1b2c3d4',
    'atlas-tiles-citylines.png': 'e5f6g7h8',
    'sfx-citylines.json': 'f9g0h1i2'
  },
  bundles: [
    { name: 'atlas-tiles-citylines', assets: ['atlases/atlas-tiles-citylines.json'] }
  ]
}
```

Loader constructs: `{cdnBase}/{baseName}-{uid}.{ext}`

---

## Bucket Structure

### Pure UID (Unreadable)
```
bucket/
├── a1b2c3d4.json
├── e5f6g7h8.png
├── f9g0h1i2.json
├── j3k4l5m6.webm
└── ... (100 mystery files)
```

### UID-Suffixed (Browsable)
```
bucket/
├── atlas-branding-wolf-abc123.json
├── atlas-branding-wolf-def456.png
├── atlas-tiles-citylines-a1b2c3.json
├── atlas-tiles-citylines-e5f6g7.png
├── atlas-tiles-citylines-fall-h8i9j0.json
├── atlas-tiles-citylines-fall-k1l2m3.png
├── sfx-citylines-n4o5p6.json
├── sfx-citylines-q7r8s9.mp3
├── sfx-citylines-t0u1v2.webm
└── vfx-rotate-w3x4y5.json
```

Files sort alphabetically by logical name. You can visually identify what each file is.

---

## Cache Behavior

UID suffix provides **automatic cache busting**:

```
atlas-tiles-citylines-a1b2c3d4.png   ← Version 1
atlas-tiles-citylines-f9g0h1i2.png   ← Version 2 (content changed)
```

- Different filename = different cache entry
- Both can coexist in bucket during gradual rollout
- Old clients fetch old version until their manifest updates
- Set `Cache-Control: immutable` for maximum caching

---

## Local Development Preservation

**Local development stays simple.** No UIDs, no transformations.

| Environment | JSON Content | How It Works |
|-------------|--------------|--------------|
| **Local** | `"image": "atlas-tiles-citylines.png"` | Relative path, same folder |
| **Production** | `"image": "atlas-tiles-citylines-e5f6g7h8.png"` | UID-suffixed name |

The same logical manifest works for both:

```typescript
{
  bundles: [
    { name: 'atlas-tiles-citylines', assets: ['atlases/atlas-tiles-citylines.json'] }
  ]
}
```

- Locally: Files loaded from `/assets/`, relative references work
- Production: Server returns transformed manifest with suffixed names

**Transformation only happens at publish time.**

---

## Loader Changes Required

### Current: Key Derived from Path

```typescript
// registerBundles() in pixi.ts
const filename = path.split('/').pop() || path;
const key = filename.replace(/\.json$/, '');
assets[key] = `${baseUrl}/${path}`;
```

### Updated: Strip UID Suffix from Key

```typescript
const filename = path.split('/').pop() || path;
// Strip UID suffix: atlas-tiles-citylines-a1b2c3d4.json → atlas-tiles-citylines.json
const withoutUid = filename.replace(/-[a-f0-9]{8}\.json$/, '.json');
const key = withoutUid.replace(/\.json$/, '');
assets[key] = `${baseUrl}/${path}`;
```

Or use an explicit key from manifest:

```typescript
// If manifest provides explicit key
const key = bundle.key || deriveKey(filename);
```

---

## Implementation Checklist

### Publish Pipeline
- [ ] File hasher (content → 8-char hex)
- [ ] Dependency graph builder
- [ ] JSON rewriter per format (spritesheet, audio sprite)
- [ ] UID suffix inserter
- [ ] Manifest generator with UID mappings
- [ ] Upload orchestrator (correct dependency order)

### Loader Updates
- [ ] Strip UID suffix when deriving memory slot key
- [ ] Support explicit key in manifest bundle definition
- [ ] Handle both local (no suffix) and production (with suffix) modes

### Testing
- [ ] Round-trip: local → publish → load from bucket
- [ ] Verify textures load correctly
- [ ] Verify audio sprites play correctly
- [ ] Verify cache invalidation works on content change

---

## Edge Cases

### Filename Already Contains Hash-Like Segment

```
atlas-a1b2c3d4-theme.json
```

Always use the **last** segment matching the pattern `/-[a-f0-9]{8}\./` before the extension.

### Very Long Filenames

```
atlas-tiles-citylines-winter-special-edition-a1b2c3d4.json  (57 chars)
```

Most systems support 255 characters. Unlikely to be an issue, but monitor.

### Multiple Files with Same Base Name

Each file gets its own UID based on content hash:

```
atlas-tiles-citylines.json  →  atlas-tiles-citylines-a1b2c3d4.json
atlas-tiles-citylines.png   →  atlas-tiles-citylines-e5f6g7h8.png
```

The JSON and PNG have different hashes because they have different content.

---

## Related Documentation

| Document | Topic |
|----------|-------|
| [Asset Pipeline](./asset-pipeline.md) | Creating and exporting assets |
| [Level Manifest Design](./unified-manifest-design.md) | Level manifests referencing assets |
| [Architecture](../scaffold/architecture.md) | Overall system design |

---

## Summary

The UID-suffix approach provides:

1. **Content addressing** for cache busting and versioning
2. **Human readability** for debugging and bucket browsing
3. **Key derivation** without lookup tables
4. **Simple local development** with transformation only at publish
5. **Compatibility** with existing Pixi/Howler loading patterns

The key insight: append UIDs rather than replace filenames, and transform JSON content at publish time to update internal references.
