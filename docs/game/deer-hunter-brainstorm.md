# Deer Hunter — Game Brainstorm

## Concept

A relaxing-then-tense hunting game. You explore a stylized wilderness map, pick a location, then drop into an immersive first-person-ish view where you scan through layered foliage to spot and photograph/hunt deer. The parallax leaf system makes zooming feel physical — like you're peering through actual brush.

**Vibe:** Calm exploration punctuated by moments of focused tension. Think Firewatch meets Duck Hunt.

---

## Core Loop

```
MAP (pick a spot) → APPROACH (set up) → HUNT (spot, zoom, shoot) → RESULTS (score) → MAP
```

1. **Map** — Top-down illustrated map. Tap a location pin to travel there.
2. **Approach** — Brief scene-setting moment. Wind direction, time of day, terrain preview. Pick your loadout (scope, bait, camo).
3. **Hunt** — The main gameplay. Pan the landscape, zoom through parallax layers, spot deer, line up the shot.
4. **Results** — Score based on accuracy, patience, rarity of deer. Unlock new locations or gear.

---

## Scenes Breakdown

### Scene 1: Map View

**Purpose:** Hub screen. Progress tracker. Location picker.

**Visual:** Hand-drawn topographic map filling the viewport. Illustrated terrain — forests, ridges, meadows, a river. Location pins pulse subtly.

**Interactions:**
- Pan/drag to explore the map
- Tap a pin to see location details (difficulty, deer species, weather)
- Confirm to travel (triggers screen transition with a brief travel animation)

**Data model:**
```typescript
interface Location {
  id: string;
  name: string;           // "Birch Hollow", "Ridge Point"
  position: { x: number; y: number }; // map coordinates
  difficulty: 1 | 2 | 3;
  terrain: 'forest' | 'meadow' | 'ridge' | 'wetland';
  deerSpecies: string[];  // which deer can appear here
  unlocked: boolean;
  bestScore: number | null;
}
```

**Asset bundle:** `map-ui` — map texture, pin sprites, UI elements.

---

### Scene 2: Hunting Ground (core gameplay)

**Purpose:** The game. Spot deer through layered foliage. Zoom. Shoot.

**Visual structure — 5 parallax layers:**

```
Layer 0 — SKY        (far back, barely moves)     clouds, birds
Layer 1 — MOUNTAINS  (slow parallax, 0.2x)        distant silhouettes
Layer 2 — TREELINE   (medium parallax, 0.5x)      mid-ground trees, deer walk here
Layer 3 — GROUND     (1:1 with camera)             grass, rocks, deer stand here
Layer 4 — FOLIAGE    (fast parallax, 1.4x)         foreground leaves, branches
```

**The zoom mechanic:**
- Default view: wide angle, foliage is dense, deer are tiny specks
- Zoom in: foliage parts (leaves scale up and drift off-screen), deer become visible, aim becomes precise
- Full zoom: scope view — crosshair, slight sway, breath control

**Zoom drives everything:**
```
zoom 1.0x  → overview, scan for movement
zoom 2.0x  → foliage starts thinning, deer shapes visible
zoom 4.0x  → clear view, can identify species
zoom 8.0x  → scope mode, crosshair, shot available
```

**Deer behavior (simple state machine):**
```
IDLE → GRAZE → WALK → ALERT → FLEE
         ↑               ↓
         └───── CALM ────┘
```

- Deer spawn at random positions along layers 2-3
- They graze, occasionally look up (ALERT if player zooms too fast or moves scope near them)
- If ALERT for too long → FLEE (run off-screen, missed opportunity)
- Player must zoom slowly and hold steady to get the shot

**Interactions:**
- Drag to pan the camera horizontally
- Pinch/scroll to zoom (drives parallax separation)
- Tap/click at max zoom to take the shot
- Wind indicator — affects bullet/arrow travel at high zoom

**Asset bundles:**
- `hunting-[terrain]` — background layers per terrain type
- `deer-sprites` — deer species spritesheets (shared across locations)
- `foliage-[terrain]` — foreground leaf/branch sprites per terrain
- `ambient-[terrain]` — audio (birds, wind, water)

---

### Scene 3: Results

**Purpose:** Feedback. Scoring. Unlock progression.

**Shows:**
- Shot accuracy (distance from heart)
- Deer species + rarity
- Patience bonus (how long you waited before shooting)
- Stealth bonus (deer never went ALERT)
- Star rating (1-3)

**Unlocks:**
- New locations (reach star thresholds)
- Gear upgrades (better scope = steadier aim, bait = deer stay longer)

---

## Parallax Leaf System — Detail

This is the signature visual. When the player zooms in:

1. **Layer 4 (foliage) scales at 1.4x the camera zoom** — leaves grow large and spread apart
2. **Individual leaves get a random drift** — GSAP tween with slight rotation and x/y offset, driven by a "wind" vector
3. **Opacity fades at edges** — leaves that drift off-viewport fade out, new ones fade in from the opposite side
4. **Depth-of-field blur** — at high zoom, Layer 4 gets a slight blur filter (Pixi's BlurFilter), making the foreground feel out-of-focus while the deer in Layer 2-3 are sharp
5. **Leaf types per terrain:**
   - Forest: broad green/amber leaves, pine needles
   - Meadow: tall grass blades, wildflower stems
   - Ridge: bare branches, small hardy leaves
   - Wetland: reeds, lily pads at bottom edge

```typescript
interface LeafConfig {
  texture: string;        // sprite name in foliage bundle
  count: number;          // how many on screen
  driftSpeed: number;     // base movement (wind multiplied)
  rotationRange: number;  // max rotation in radians
  scaleRange: [number, number]; // random size variation
  parallaxMultiplier: number;   // usually 1.3-1.6
}
```

---

## Camera System

```typescript
interface CameraState {
  x: number;          // pan position (horizontal only)
  zoom: number;       // 1.0 to 8.0
  targetZoom: number; // smooth lerp target
  sway: number;       // scope sway amount (increases with zoom)
  breath: number;     // periodic sway cycle (hold to steady)
}
```

- Pan: bounded to scene width
- Zoom: smooth lerp (not instant), each layer responds differently
- Sway: sinusoidal at high zoom, reduced by "hold breath" (tap and hold)
- Scope mode (zoom > 6x): overlay crosshair, vignette, sway becomes the challenge

---

## Audio Layers

The scaffold already has Howler integration. Layer ambient audio by scene:

| Layer | Sound | Behavior |
|---|---|---|
| Base | Wind | Always playing, volume scales with zoom (closer = quieter wind) |
| Ambient | Birds, insects | Random one-shots, stereo-panned to match camera position |
| Deer | Footsteps, snort | Triggered by deer state changes, proximity-based volume |
| Player | Scope click, breath | UI feedback sounds |
| Shot | Gunshot/bow release | One-shot with echo tail matched to terrain |

---

## Progression Model

```
Location 1: Birch Hollow (forest, easy)
  └── Unlock at: start
  └── Deer: White-tail (common)

Location 2: Meadow Flats (meadow, easy)
  └── Unlock at: 3 stars total
  └── Deer: White-tail, Mule deer

Location 3: Ridge Point (ridge, medium)
  └── Unlock at: 8 stars total
  └── Deer: Mule deer, Elk

Location 4: Willow Creek (wetland, medium)
  └── Unlock at: 14 stars total
  └── Deer: White-tail, Moose (rare)

Location 5: Summit Pass (ridge, hard)
  └── Unlock at: 20 stars total
  └── Deer: Elk, Mountain Caribou (legendary)
```

---

## Scaffold Mapping

How this maps to template-amino's existing systems:

| Game Concept | Scaffold System | Notes |
|---|---|---|
| Map / Hunt / Results screens | Screen Manager (`ScreenProvider`) | Add `'map'` to `ScreenId` union |
| Per-location asset loading | `screenAssets` config | Required bundles load before screen shows |
| Parallax rendering | PixiJS via asset coordinator | `createPixiAdapter` for the hunting canvas |
| Deer state machine | Pure TS in `src/game/mygame/` | No framework dep, just state + update loop |
| Zoom/pan camera | Pointer events + Pixi stage transform | Solid signal drives Pixi camera |
| Audio layers | Audio system (`useAudio`) + Howler | Spatial audio via Howler pan |
| Progression/unlocks | Versioned storage (`createVersionedStore`) | Persist stars + unlocks to localStorage |
| Score tracking | Analytics (`createTracker`) | `hunt_complete`, `deer_spotted`, `location_unlocked` |
| Leaf VFX | GSAP + Pixi sprites | Foreground container with tweened children |
| Dev tuning | Tuning panel | Expose wind speed, deer spawn rate, zoom sensitivity |

---

## Open Questions

- **Photo mode vs hunting?** Could be a wildlife photography game instead — same mechanics, different framing. Camera shutter instead of gun. More chill, broader audience.
- **Time of day?** Dawn/dusk could affect deer behavior and lighting. Adds visual variety per visit.
- **Multiplayer angle?** Leaderboards per location? Or purely single-player progression?
- **Monetization?** If this is for game jam, probably N/A. But cosmetic scopes/map themes could work.
- **Scope as the core verb?** The zoom-through-foliage mechanic could apply to other games too (birdwatching, nature photography, treasure hunting). Worth abstracting into a reusable module.
