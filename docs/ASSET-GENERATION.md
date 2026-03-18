# Post-build asset generation

Standalone instructions for generating and wiring game assets **after** all game-builder phases (Design, Build, Polish) are complete. Uses the **asset-gen MCP** to produce visual assets (packed into a spritesheet) and audio files, then places them under `public/assets/` and updates the game code. Do not modify anything under `aidd-custom/`.

---

## When to run

- Run **only** when the full game-builder flow is finished: Phase 1 (Design), Phase 2 (Build), and Phase 3 (Polish) are done and the game runs and is playable.
- Do **not** run during design or build stages. This is a standalone post-completion step.
- Run discovery always. If after discovery the **visual** manifest is empty (e.g. sprite_strategy and materials do not suggest any generated visuals), skip visual generation and wiring for visuals. Do not conclude "no assets found in code" means skip — use design to decide. If there are no sound events, skip the audio manifest and wiring for that category.

---

## Prerequisites

- All game-builder phases complete; game is playable.
- Asset-gen MCP (user-wolfgames-asset-gen) enabled. Before calling any MCP tool, **read its descriptor/schema**.
- Design docs present: `design/03-presentation.md`, `design/01-core-identity.md`, and any `checklists/` that list asset names, sizes, or events.

**Manifest location:** Save the visual and audio manifests (built in Step 1) under **`asset-manifests/`** at the project root: `asset-manifests/visual.json` and `asset-manifests/audio.json`. Create the directory if it does not exist. Step 2 reads from these files when calling the MCP; keeping them on disk aids reproducibility and review.

---

## High-level flow (one run)

1. **Discover** — Scan game code and design docs; build visual and audio manifests.
2. **Generate** — Call asset-gen MCP with manifests; get spritesheet + atlas JSON and separate audio files; download all outputs into `public/assets/`.
3. **Place and wire** — Verify files on disk; update game code to load atlas(es) and audio from `/assets/`; remove placeholder or procedural-only branches so the game runs entirely on the new assets.

---

## Step 1: Discover asset needs (no MCP yet)

### 1.1 Visual assets

Do **not** search the codebase for existing asset paths, texture keys, or frame names. Many games are CSS/procedural-only and have none. Use the design doc to decide *where* and *how* assets can be integrated, then produce the visual manifest from that.

- **Primary source:** `design/03-presentation.md`. Read:
  - **sprite_strategy** — determines integration mode (see below).
  - **object_rendering.recipe_per_layer** — e.g. "Base fill — card color or **face graphic**" indicates where an image can plug in (e.g. as the base layer).
  - **object_rendering.materials** — for each material: `name`, `used_for`, `base_treatment` (e.g. "Rounded rect fill" vs "face graphic"). Use with `chromatic_architecture` and aesthetic for style/description.
  - **layout** — base resolution, orientation; use to infer or validate sizes (or derive sizes from code below).
- **Sizes:** Derive from `layout` (design) and/or from **layout constants in code** under `src/game/` (e.g. `CARD_W`, `CARD_H`, `tileSize`, `cellW`, `cellH`, `COLS`, `ROWS`) **only** to get pixel dimensions. Do not search for asset paths or frame names there. When deriving dimensions, also **identify insets** that reduce the content area for the layer the asset replaces: stroke width, padding/inset constants, inner rect (e.g. rect with offset and reduced width/height). The manifest’s `width` and `height` should be the **full container size** (outer dimensions). Document or note any insets so that wiring can **remove or bypass them** when placing the sprite.
- **Integration modes** (driven by `sprite_strategy` and materials):
  - **sprite_sheet** — game can render by discrete frames; plan full replacement of drawn objects with atlas sprites. Manifest entries = one per frame; wiring will load atlas and use frame ids.
  - **css_graphics** / **generated** (with procedural rendering) — objects are drawn (Graphics, CSS, etc.); assets integrate as **content within** the procedural shell. Examples: generated image as the "base fill" or "face graphic" layer; texture on a quad; image inside a rounded rect. Manifest entries = one per distinct visual (e.g. card_face_1..N, card_back); wiring will load assets and **use them in a procedural context** (texture/fill/sprite-as-child), not replace the whole draw pipeline.
  - **svg** — same integration logic as above but with vector assets if the MCP supports it.
- **Procedural context:** Generated assets **can** be used in a procedural context. The game may keep drawing shapes, shadows, and highlights in code; the generated art is used for specific layers or fills (e.g. card face image on top of a procedurally drawn card back shape). Infer from materials and recipe_per_layer which visuals are "base fill / face graphic" and produce manifest entries for those; wiring (Step 3) will show how to plug a texture/sprite into the existing render path.
- **Visual manifest output** — One entry per distinct sprite/frame:
  - **id** — chosen during discovery from materials and strategy (e.g. `card_face_1`, `card_face_2`, `card_back`). Frame ids in the atlas JSON will match these; the game will be updated in Step 3 to use them. These ids need not exist in the codebase before discovery.
  - **display size** — width and height in pixels from layout (design + code layout constants). This is the **full container size** (outer dimensions; not reduced by insets). The aspect ratio must be preserved in generation and packing; wiring will draw at this size and remove insets so the art is not squeezed (see §1.4).
  - **style/description** — from design (e.g. aesthetic + material + palette).
  - Optionally: base resolution or atlas name for packing.

### 1.2 Audio assets

- Grep for sound usage: `playSound(`, `playTap`, `playMatch`, `SoundEvent`, or similar; also `design/03-presentation.md` → `sound_design.events` and `sound_design.variations`.
- List every distinct event (e.g. `tap`, `swap`, `match`, `combo`, `fail`, `level_complete`) and the desired character from design (e.g. "soft flip", "satisfying pop").
- Produce an **audio manifest**: one entry per event (and per variant if design specifies multiple variants), with **event id** and **text description** for generation.

### 1.3 Sizes and atlas contract

- From layout (design + code layout constants), derive the **exact pixel size** each visual asset must fit (e.g. tile 48px, card 72×96px). Use the **full container size** (no reduction for insets) for the manifest so that generation and packing produce art at that size; wiring will draw at that size and remove insets so the asset is not squeezed. Put these in the manifest so generated art matches.
- Frame ids are **chosen during discovery** from materials and sprite_strategy (e.g. one id per material variant or per "face" type). Wiring (Step 3) will map these ids into the game — either as full sprite replacement or as texture/fill in procedural nodes. Decide atlas naming (e.g. `cards-v1.png` + `cards-v1.json`, or one pair per group if the game has multiple sheets). Frame ids in the atlas JSON must match the discovery-chosen ids.

**Save manifests:** Write the visual manifest to **`asset-manifests/visual.json`** and the audio manifest to **`asset-manifests/audio.json`**. Create the `asset-manifests/` directory if it does not exist. Use the structure described in "Manifest shape (generic)" below.

### 1.4 Display size and avoiding squeeze

- **Display size:** The manifest’s `width` and `height` are the **full container size** (from layout constants). This is the size and aspect ratio the asset should be drawn at so it is not stretched or squeezed by wrong aspect.
- **Effective content region and insets:** Procedural code often draws the "base fill" or "face" layer inside a **smaller** region than the outer container (e.g. stroke width, padding, an inner rect with insets). If the sprite is drawn at full container size but the **visible** area is that smaller region, the asset is squeezed. During discovery, **identify insets**: stroke width, padding/inset constants, inner rect dimensions (e.g. width − 2×inset). Record or note these so wiring can address them.
- **Preferred approach:** Use the **full container size** for the manifest (and for atlas frame dimensions in Step 2). In Step 3 wiring, **draw the sprite at that full container size** and **remove or bypass** the procedural insets/padding for the layer the asset replaces—so the asset **overrides** the padded region and is not squeezed. Do not draw the sprite into a smaller padded/inset region.
- **Atlas frames:** Frame dimensions in the atlas must match the manifest’s width and height (same aspect as container). In Step 2, ensure each frame has width and height equal to the manifest for that entry (or preserve per-sprite dimensions/aspect if the MCP allows).
- **Wiring scale:** In Step 3, scale from atlas frame size (frame.w, frame.h) to **full container size** using `scale.x = containerWidth / frameWidth` and `scale.y = containerHeight / frameHeight`. With insets removed at wiring, the sprite fills the container and is not squeezed.

---

## Step 2: Generate assets via asset-gen MCP

### 2.1 Discover MCP tools

- List tools provided by the asset-gen MCP (e.g. from Cursor MCP tool descriptors). **Before calling any MCP tool, read its schema/descriptor** for parameters (manifest format, spritesheet packing options, output format).
- Load the manifests from **`asset-manifests/visual.json`** and **`asset-manifests/audio.json`** (or the paths where they were saved in Step 1).

### 2.2 Visual generation and spritesheet packing

- Call the MCP tool(s) that accept the **visual manifest** and can:
  - Generate images per entry with the correct pixel dimensions.
  - Pack them into a single spritesheet and output atlas JSON (frame ids, x, y, w, h, and `meta.image` pointing to the PNG filename).
- **Match frame dimensions to display size:** So that sprites are not squeezed or stretched when drawn into the game’s containers (see §1.4), ensure each atlas frame’s **width and height equal the manifest’s width and height** for that entry. If the MCP uses a single pack size (e.g. one `sprite_size` for all), that size must match the manifest dimensions, or the MCP must be instructed to preserve per-sprite dimensions or aspect ratio (e.g. correct aspect_ratio and no forced square packing). Do not pack all frames as the same square when the display size is non-square (e.g. 72×96).
- Ensure the manifest specifies sizes so the spritesheet uses the right dimensions. The atlas JSON must be compatible with the game’s loader (e.g. Pixi `Spritesheet`: `frames`, `meta.image`).

### 2.3 Audio generation

- Call the MCP tool(s) that accept the **audio manifest** and generate one file per event (and per variant if any). Use a consistent format (e.g. mp3 or wav); the game will reference these by path.

### 2.4 Download all outputs

- Use the MCP’s download/export capability to write files into the project’s **`public/assets/`** directory:
  - One spritesheet PNG and one atlas JSON (e.g. `gems-v1.png`, `gems-v1.json`), or multiple pairs if the game has multiple atlases.
  - One audio file per manifest entry (e.g. `sfx_tap.mp3`, `sfx_match.mp3`).

---

## Step 3: Place and wire into the game

### 3.1 Verify files on disk

- Confirm `public/assets/` contains the generated PNG(s), JSON atlas(es), and audio files.

### 3.2 Wire visual assets

Support two integration patterns:

- **Full sprite path:** Load the atlas (e.g. `Assets.load('/assets/gems-v1.png')` plus fetch of `gems-v1.json`), then `new Spritesheet({ texture, data })` and `sheet.parse()`. Create sprites by frame id and use as the main render. Update paths in code if you used different filenames. Frame ids in the atlas JSON match the discovery-chosen ids; add or update the game's frame-name map to use those ids.
- **Procedural hybrid:** Load the atlas or individual images; **integrate into existing procedural rendering**. Create a Sprite from the texture and add it as a child of the procedural container; the game may continue to use layout constants for positioning. **Scaling:** Use the **full container size** (outer layout dimensions) and the atlas frame size (`frame.w`, `frame.h` from the atlas JSON). Set `scale.x = containerWidth / frameWidth` and `scale.y = containerHeight / frameHeight` so the sprite fills the container. **Remove or omit** procedural elements that create a smaller visible region for the asset layer: do not draw an inner rect with padding for that layer, and do not place the sprite inside a padded sub-container. The generated asset should **override** the padded/inset region—draw the sprite at full container size so it is not squeezed into an inset. If the procedural code draws an outer shape (e.g. stroke) and a separate inner fill (e.g. padded rect), when using the asset replace the inner fill with the sprite at **full** outer dimensions and omit the inner padding for that layer. If the game currently draws everything with Graphics/CSS, wiring may require adding a texture-load step and drawing a sprite or textured quad in place of (or atop) the procedural base layer for the relevant materials.

### 3.3 Wire audio assets

- Replace procedural audio (e.g. jsfxr) with file-based playback for the generated files: e.g. Howler or `new Audio(url)`. Update the game’s sound module to:
  - Map each `SoundEvent` (or equivalent) to a path under `/assets/` (e.g. `/assets/sfx_tap.mp3`).
  - Play the file at existing call sites with the same volume/mute behavior. Keep accessibility (mute toggle, volume) unchanged.

### 3.4 No placeholder or dead code

- Remove or stub old placeholder asset paths or procedural-only branches that would never run after the switch, so the game runs entirely on the new assets.

---

## Manifest shape (generic)

Manifests are saved as JSON under **`asset-manifests/`**: `visual.json` (array of entries) and `audio.json` (array of entries).

**Visual manifest** (per sprite/frame):

- `id` — string; chosen during discovery from materials and sprite_strategy. Ids need not exist in the codebase before discovery; wiring will add or update the game to use them.
- `width`, `height` — numbers (pixels). These are the **full container size** (outer dimensions; not reduced by insets). They define the aspect ratio. Atlas frame dimensions in Step 2 should match these. When the procedural layer has insets or padding, wiring must draw the sprite at this full size and remove or bypass those insets so the asset is not squeezed (see §1.4).
- `style` or `description` — string for generation.

**Audio manifest** (per event/variant):

- `eventId` — string the game uses (e.g. `tap`, `match`).
- `description` — string for generation (e.g. "soft flip", "satisfying pop").

Frame ids in the atlas JSON must match the visual manifest ids so the game can look up textures by name.

---

## Placement rules

- All generated outputs go under **`public/assets/`**.
- Game code must be updated to load the atlas(es) and audio from those paths.
- Frame ids (from discovery) and event-to-file mapping must stay consistent; wiring updates the game to use them.

---

## Exit criteria

Before finishing, verify:

1. **Visual:** All visual assets that discovery determined should be generated come from the generated spritesheet(s) in `public/assets/` and are integrated per the chosen strategy (full sprite or procedural hybrid).
2. **Audio:** All sound events play from generated files in `public/assets/`.
3. **Build:** `npm run typecheck` and `npm run build` pass.
4. **Runtime:** Game runs without missing assets or console errors for assets.

---

## Out of scope

- Do **not** modify `aidd-custom/` (no AGENTS.md changes, no new skills inside `aidd-custom/game-builder/`). This step is invoked manually or via the project’s own README/CLAUDE.md.
- Do not change when or how design/build stages run.
- This doc does not define the exact asset-gen MCP API (tool names, payloads); use the MCP’s schema at runtime.
