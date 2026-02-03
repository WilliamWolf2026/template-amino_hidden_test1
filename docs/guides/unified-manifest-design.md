# Level Manifest Design

> Architecture for level manifests pointing to shared assets on GCS

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         GCS Bucket                               │
├─────────────────────────────────────────────────────────────────┤
│  /assets/v1/                    │  /levels/                      │
│    ├── atlases/                 │    ├── wonder-nj-2026.json     │
│    │   ├── branding.json        │    ├── boardwalk-reopening.json│
│    │   ├── tiles_v1.json        │    ├── jersey-tomatoes.json    │
│    │   └── vfx/                 │    └── ...                     │
│    └── audio/                   │                                │
│        └── sfx.json             │  (Many level manifests)        │
│                                 │                                │
│  (Shared, versioned separately) │  (One per story/chapter)       │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    └───────────┬───────────────┘
                                │
                    ?level=wonder-nj-2026
                                │
                                ▼
                    ┌───────────────────┐
                    │   Game Client     │
                    └───────────────────┘
```

**Key Concept:** Level manifest = one playable story/chapter that references shared assets.

---

## Folder Structure

### Local Development (`public/assets/`)

```
public/assets/
├── assets/                          # Shared assets (mirrors GCS)
│   └── v1/
│       ├── atlases/                 # Game tile atlases
│       │   ├── tiles_v1.json
│       │   ├── tiles_v1.png
│       │   ├── tiles_v1_fall.json
│       │   ├── tiles_v1_fall.png
│       │   ├── tiles_v1_winter.json
│       │   └── tiles_v1_winter.png
│       ├── branding/                # Publisher/partner branding
│       │   ├── branding.json
│       │   └── branding.png
│       ├── audio/
│       │   ├── sfx.json
│       │   ├── sfx.webm
│       │   └── sfx.mp3
│       └── vfx/
│           ├── rotate.json
│           ├── rotate.png
│           ├── blast.json
│           └── blast.png
│
└── levels/                          # Level manifests
    ├── default.json                 # Local dev default
    ├── wonder-nj-2026.json
    └── ...
```

### GCS Production

```
gs://game-assets/citylines/
├── assets/
│   └── v1/                          # Asset version
│       ├── atlases/                 # Game tile atlases
│       ├── branding/                # Publisher/partner branding
│       ├── audio/
│       └── vfx/
│
└── levels/
    ├── wonder-nj-2026.json
    ├── boardwalk-reopening.json
    └── ...
```

---

## Level Manifest Format

Each level is a single JSON file:

```json
{
  "levelId": "wonder-nj-2026",
  "version": "1.0.0",
  "created": "2026-02-03T12:00:00Z",

  "assets": {
    "base": "/assets/v1",
    "branding": {
      "atlas": "branding/branding.json"
    },
    "atlases": {
      "tiles": "atlases/tiles_v1.json"
    },
    "vfx": {
      "rotate": "vfx/rotate.json",
      "blast": "vfx/blast.json"
    },
    "audio": {
      "sfx": "audio/sfx.json"
    }
  },

  "county": "bergen",
  "tileTheme": "default",
  "levelSeeds": [42001, 42002, 42003, 42004, 42005, 42006, 42007, 42008, 42009, 42010],

  "story": {
    "headline": "Wonder Brings Celebrity Chef Eats to Three More N.J. Towns",
    "summary": "The food hall phenomenon Wonder is expanding its New Jersey footprint...",
    "imageUrl": "https://example.com/stories/wonder-nj/hero.jpg",
    "articleUrl": "https://www.nj.com/news/2026/01/wonder-food-hall.html",
    "clues": [
      "Hungry for something new? 🍽️",
      "A food revolution is spreading across New Jersey...",
      "Imagine ordering tacos, pizza, AND barbecue—all at once.",
      "Over 20 restaurants. One single order.",
      "Celebrity chefs are involved... think Bobby Flay.",
      "They've already opened nearly 100 locations.",
      "This spring, three more N.J. towns join the party.",
      "Wayne. Emerson. Ocean Township. 📍",
      "Delivery, pickup, or dine-in—your call.",
      "It's no Wonder everyone's talking about it!"
    ]
  }
}
```

---

## URL Parameters

```bash
# Local development (default)
http://localhost:5173/

# Specific local level
http://localhost:5173/?level=/assets/levels/wonder-nj-2026.json

# Production - full URL
https://game.example.com/?level=https://storage.googleapis.com/game-assets/citylines/levels/wonder-nj-2026.json

# Production - short form (if base URL configured)
https://game.example.com/?level=wonder-nj-2026
```

---

## Loading Flow

```typescript
async function loadGame() {
  // 1. Get level URL from param or use default
  const levelUrl = urlParams.get('level') || '/assets/levels/default.json';

  // 2. Load level manifest
  const level = await fetch(levelUrl).then(r => r.json());

  // 3. Resolve asset base (local or remote)
  const assetBase = level.assets.base.startsWith('http')
    ? level.assets.base
    : level.assets.base; // Local path

  // 4. Load shared assets
  await assetCoordinator.loadBundle({
    cdnBase: assetBase,
    assets: [
      level.assets.atlases.branding,
      level.assets.atlases.tiles,
      level.assets.audio.sfx,
    ]
  });

  // 5. Generate chapter from level config
  const chapter = ChapterGenerationService.generateChapter(level, tuning);

  // 6. Start game
  game.loadLevel(chapter.levels[0]);
}
```

---

## Best Practices

### 1. Version Assets Separately from Levels

```
gs://game-assets/citylines/
├── assets/
│   ├── v1/          # Asset version 1
│   └── v2/          # Asset version 2 (new tiles, etc.)
│
└── levels/          # Levels can reference any asset version
    ├── wonder-nj-2026.json      → uses assets/v1
    ├── new-story-2026.json      → uses assets/v2
    └── ...
```

**Benefits:**
- Publish new stories without touching assets
- Update assets without breaking existing levels
- A/B test different asset versions
- Clear separation of content vs. code

### 2. Level Manifest References Asset Version

```json
{
  "assets": {
    "base": "https://storage.googleapis.com/game-assets/citylines/assets/v1"
  }
}
```

Levels explicitly declare which asset version they use. This allows:
- Gradual migration to new assets
- Old levels keep working
- New levels can use updated assets

### 3. Caching Strategy

```yaml
# Assets (immutable, long cache)
/assets/v1/*
Cache-Control: public, max-age=31536000, immutable

# Levels (can update, short cache)
/levels/*
Cache-Control: public, max-age=3600
```

### 4. Fallback Chain for Level Loading

```typescript
async function loadLevel(): Promise<LevelManifest> {
  const sources = [
    urlParams.get('level'),                      // URL override (full URL or name)
    '/assets/levels/default.json',               // Local fallback
  ].filter(Boolean);

  for (const source of sources) {
    try {
      // Resolve short names to full URLs if needed
      const url = source.startsWith('http') || source.startsWith('/')
        ? source
        : `https://storage.googleapis.com/game-assets/citylines/levels/${source}.json`;

      return await fetch(url).then(r => r.json());
    } catch (e) {
      console.warn(`Failed to load level from ${source}:`, e);
    }
  }
  throw new Error('No level available');
}
```

---

## Migration Plan

### Phase 1: Restructure Local Assets

**Current:**
```
public/assets/
├── atlas-branding-wolf.json
├── tiles_citylines_v1.json
├── sfx-citylines.json
└── sections/default.json
```

**New:**
```
public/assets/
├── assets/v1/
│   ├── atlases/
│   ├── audio/
│   └── vfx/
└── levels/
    └── default.json
```

### Phase 2: Update manifest.ts

```typescript
// Before: flat bundles
{ name: 'tiles_citylines_v1', assets: ['tiles_citylines_v1.json'] }

// After: paths within asset version
{ name: 'tiles', assets: ['assets/v1/atlases/tiles_v1.json'] }
```

### Phase 3: Update Section Loading

```typescript
// Before: separate section param
const sectionUrl = urlParams.get('section');
const config = await loadSectionConfig();

// After: level param loads everything
const levelUrl = urlParams.get('level') || '/assets/levels/default.json';
const level = await fetch(levelUrl).then(r => r.json());
```

### Phase 4: Deploy to GCS

```bash
# Upload assets
gsutil -m cp -r public/assets/assets/* gs://game-assets/citylines/assets/

# Upload levels
gsutil -m cp -r public/assets/levels/* gs://game-assets/citylines/levels/
```

---

## Implementation Checklist

- [ ] Create `LevelManifest` TypeScript interface
- [ ] Restructure `public/assets/` to new layout
- [ ] Create `default.json` level manifest
- [ ] Update `manifest.ts` bundle paths
- [ ] Replace `?section=` with `?level=` param
- [ ] Update `loadSectionConfig()` to `loadLevelManifest()`
- [ ] Test local development with new structure
- [ ] Create GCS bucket with proper CORS
- [ ] Deploy assets to GCS
- [ ] Test production with remote level manifest

---

## TypeScript Interface

```typescript
interface LevelManifest {
  levelId: string;
  version: string;
  created?: string;

  assets: {
    base: string;  // CDN base URL or local path
    branding: {
      atlas: string;  // Publisher/partner branding atlas
    };
    atlases: {
      tiles: string;
      tiles_fall?: string;
      tiles_winter?: string;
    };
    vfx: {
      rotate?: string;
      blast?: string;
    };
    audio: {
      sfx: string;
    };
  };

  county: County;
  tileTheme?: 'default' | 'fall' | 'winter';
  levelSeeds?: number[];

  story: {
    headline: string;
    summary: string;
    imageUrl?: string;
    articleUrl?: string;
    clues: string[];
  };
}
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/game/manifest.ts` | Asset bundle definitions (update paths) |
| `src/game/citylines/types/section.ts` | Rename to `level.ts`, update interface |
| `src/scaffold/systems/assets/` | Asset coordinator |
| `docs/guides/asset-pipeline.md` | Asset creation guide |
