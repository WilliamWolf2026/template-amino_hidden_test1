# CityLines Development Learnings

> **Purpose**: Capture insights, patterns, and architectural decisions discovered during CityLines development to inform future games.

---

## Asset Loading & Manifests

### Branching Manifests

- Current system loads all assets upfront
- **Need**: Load assets only for the narrative branch taken
- **Why**: Larger games with story branches shouldn't load unused assets
- **Solution**: Manifest loader should support conditional/lazy loading per story path

### Shared Asset Locations

- VFX, particles, and common effects are duplicated per game
- **Need**: Shared asset folder outside game-specific bundles
- **Why**: Reuse blast effects, rotations, UI animations across games
- **Solution**: Support loading manifests from both game folder AND shared folder

### Game Kit Integration

- Shared assets would integrate well with a "game kit" concept
- **Need**: Inventory of reusable components (VFX, UI, sounds)
- **Why**: Faster game development, consistent quality
- **Solution**: Maintain a shared asset library with versioned bundles

### Asset Naming: Local vs Server

- Local names are simple: `atlas-tiles-citylines.json`
- Server names have UIDs: `atlas-tiles-citylines-a1b2c3d4.json`
- **Need**: Mapping system between local aliases and server filenames
- **Why**: Cache busting, version management, CDN deployment
- **Solution**: Manifest resolves local names to UID-suffixed server paths

### Flat Asset Structure

- Started with nested folders (`atlases/`, `audio/`, `vfx/`)
- Moved to flat structure in manifest
- **Why**: Simpler path resolution, easier CDN deployment
- **Learning**: Keep asset references flat, let build process organize

---

## Level & Chapter System

### Chapter Difficulty Curve Problem

- Chapters reset to "easy" at start (tutorial-style onboarding)
- New players need easy → hard progression
- Returning players find early levels too simple
- **Problem**: One chapter can't serve both audiences

### Chapter Variants Needed

- **Onboarding Chapter**: Easy → Medium → Hard (for new players)
- **Standard Chapter**: Medium → Hard (for returning players)
- **Need**: Two inventory items per chapter content
- **Solution**: Generate chapter variants at content creation time

### Pre-Generated vs Dynamic Levels

- Current: Levels generated from seeds at runtime
- **Trade-off**: Seeded generation is reproducible but inflexible
- **Learning**: Pre-generate level variants for difficulty tuning
- **Future**: Store multiple difficulty variants per level seed

### Article-Based Chapters

- Each chapter tied to a news article
- 10 levels reveal clues about the story
- Level 10 shows full article reveal
- **Learning**: Content pipeline needs clue quality validation
- **Need**: AI-assisted clue generation with human review

---

## Manifest Structure

### Current Format (Evolved)

```json
{
  "levelId": "unique-id",
  "version": "1.0.0",
  "assets": {
    "base": "/assets/assets/v1",
    "tiles": "atlas-tiles-citylines.json",
    "sfx": "sfx-citylines.json"
  },
  "county": "bergen",
  "tileTheme": "default",
  "levelSeeds": [42001, 42002, ...],
  "story": { ... }
}
```

### What Worked

- Single JSON file per chapter/section
- Asset base path + relative filenames
- Theme selection via `tileTheme` field
- Seeded level generation for reproducibility

### What Needs Improvement

- No support for branching narratives
- No shared asset references
- No difficulty variant support
- No conditional asset loading

---

## Content Pipeline

### Current Flow

1. News article selected
2. AI generates 10 clues from article
3. Level seeds assigned to chapter
4. Chapter JSON created manually
5. Assets uploaded to CDN with UIDs

### Pain Points

- Manual chapter JSON creation
- No validation of clue quality
- No preview before publish
- UID generation is separate step

### Needed Improvements

- Admin dashboard for content creation
- Clue quality scoring/validation
- Chapter preview in staging environment
- Automated UID assignment on upload

---

## Tuning & Configuration

### What Worked

- Scaffold vs Game tuning separation
- localStorage persistence
- Hot-reload during development
- Tweakpane integration

### Learnings

- Most tuning values stabilize quickly
- Animation timings need frequent adjustment
- Grid/tile sizing rarely changes after initial setup
- Keep tuning categories small and focused

---

## Screen System

### Flow That Worked

```
Loading → Start → Game → Results → (Game | Start)
```

### Learnings

- Four screens is sufficient for puzzle games
- Results screen needs flexible layout for different content
- Loading screen should show meaningful progress
- Start screen needs level/chapter selection UI

### Missing

- No "Continue" vs "New Game" flow
- No chapter selection screen
- No settings screen (used overlay instead)

---

## Audio System

### What Worked

- Audio sprites for SFX (single file, multiple sounds)
- Howler.js integration
- Volume persistence in localStorage

### Learnings

- Audio sprite generation needs automation
- Sound timing sync with animations is tricky
- Need clear naming convention for sound IDs
- Missing: Music system (ambient/background)

---

## Animation Patterns

### What Worked

- GSAP for all animations
- Promise-wrapped animations for sequencing
- Tunable durations via config

### Learnings

- Keep animations under 500ms for game feel
- Chain animations with `await` for clarity
- Use `gsap.killTweensOf()` on cleanup
- Easing matters more than duration

---

## Level Generation

### What Worked

- Seeded random for reproducibility
- Dijkstra-based path planning
- Wriggle effect for visual variety

### Learnings

- Generator needs difficulty validation
- Some seeds produce unsolvable/trivial puzzles
- Pre-validation at generation time saves debugging
- Store "known good" seeds per difficulty

---

## Performance

### Observations

- Pixi.js handles tile rendering efficiently
- GSAP animations don't cause frame drops
- Asset loading is the main bottleneck
- Memory stable after initial load

### Optimizations Applied

- Sprite batching via atlas
- Lazy bundle loading
- Texture reuse for themes

### Not Yet Addressed

- Mobile performance profiling
- Low-end device testing
- Battery usage optimization

---

## Developer Experience

### What Helped

- Tuning panel for live adjustments
- Hot module reload
- Clear folder structure
- TypeScript everywhere

### Pain Points

- No visual level editor
- Console debugging for game logic
- Manual coordinate calculations
- No automated testing

---

## Architecture Decisions

### Good Decisions

- Scaffold/Game separation
- Signal-based state (Solid.js)
- Event-driven game communication
- Manifest-based asset loading

### Decisions to Reconsider

- Single manifest per chapter (vs branching)
- All assets loaded upfront (vs progressive)
- Fixed screen flow (vs dynamic)
- Runtime level generation (vs pre-generated)

---

## Summary: Key Takeaways

1. **Branching manifests** - Support loading only assets for chosen narrative path
2. **Shared asset library** - VFX/particles could live outside game folders
3. **Local ↔ Server naming** - Need clear mapping for UID-suffixed assets
4. **Chapter variants** - Generate onboarding AND standard difficulty versions
5. **Flat asset structure** - Simpler than nested folders
6. **Pre-validate levels** - Check difficulty at generation time
7. **Content pipeline** - Needs admin dashboard and validation
8. **Four screens** - Sufficient for puzzle games
9. **Audio sprites** - Work well, need automated generation
10. **Tuning separation** - Scaffold vs Game config is correct pattern

---

## Future Architecture Needs

### For Larger Games

- [ ] Branching manifest loader
- [ ] Progressive asset loading
- [ ] Shared asset repository
- [ ] Chapter variant system
- [ ] Content management dashboard

### For Better DX

- [ ] Visual level editor
- [ ] Automated testing framework
- [ ] Performance profiling tools
- [ ] Asset pipeline automation

### For Content Pipeline

- [ ] AI clue generation with validation
- [ ] Preview environment
- [ ] Automated UID assignment
- [ ] Version management UI
