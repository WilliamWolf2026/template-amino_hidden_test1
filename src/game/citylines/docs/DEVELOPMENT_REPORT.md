# City Lines - Development Report

## Game Summary

**City Lines** is an endless puzzle game where players rotate road tiles to connect NJ landmarks to highways. Players progress through chapters of 10 levels, each revealing a weekly local news story.

---

## Core Systems to Build

### 1. Grid System
- **Grid sizes**: 4x4, 5x5, 6x6 (scales with difficulty)
- **Tile types**:
  - Straight road
  - Corner/L-shaped road
  - T-junction road
- **Interaction**: Tap to rotate 90° clockwise
- **Visual feedback**: Roads light up green when connected to turnpike

### 2. Entity System
**Landmarks (connect these to highways):**
- Common: House, Gas Station, Diner, Market, School
- County-specific: TBD (Casino, Boardwalk, Mall, Lighthouse, etc.)

**Infrastructure:**
- Exit/Highway signs (connection targets)
- Decorative: Trees, Bushes, Flowers (8+ variations)

### 3. Level Generator
Already documented - uses deterministic seeding:
- **Phase 1**: Landmark placement (spacing constraints)
- **Phase 2**: Path generation (no crossroads, max T-junction)
- **Phase 3**: Tile type assignment based on connections
- **Phase 4**: Scramble tiles to create puzzle
- **Phase 5**: Decorative placement

**Difficulty scaling:**
| Level | Grid | Landmarks | Detour % |
|-------|------|-----------|----------|
| 1-3   | 4x4  | 2         | 10%      |
| 4-6   | 5x5  | 3         | 30%      |
| 7-10  | 6x6  | 3-4       | 60%      |

### 4. Progression System
- **Chapters**: 5-10 levels each, tied to NJ county + news story
- **Clue system**: Each level completion reveals a story clue
- **No failure state**: Unlimited moves, no time limits

### 5. Narrative/Character System
Two character options (TBD which to use):
1. **Paper Kid** - Delivers news, shouts clues as they pass
2. **GoodBoi** - News Hound that sniffs out story clues

**Character appearances:**
- Title screen (illustrated)
- Introduction (dialogue boxes)
- Chapter start (explains story they're after)
- Level completion (reveals clue in popup)
- Chapter end (reveals full story)

---

## Screens to Build

### 1. Start Screen
- Character visual
- Current chapter info (county name)
- Task/goal description
- "Start" button

### 2. Gameplay Screen
- Grid with rotatable tiles
- Landmarks placed on grid
- Progress bar (levels in chapter)
- Level counter

### 3. Level Complete Overlay
- Clue reveal (3 seconds)
- "Continue" button

### 4. Chapter Complete / Story Interstitial
- Spinning newspaper headline animation
- Full headline + summary (2-3 sentences)
- Featured image
- County name
- "Bookmark story" option
- "Continue to Next Chapter" button

---

## Asset Inventory (from tiles_citylines_v1)

**Available in tileset:**
- `background.png` - Main background
- `start_screen_background.png` - Title screen BG
- `character_a.png`, `character_b.png` - Character options
- `tile_a.png`, `tile_b.png`, `tile_c.png` - Road tiles
- `tile_a_completed.png`, `tile_b_completed.png`, `tile_c_completed.png` - Connected road tiles
- `house.png`, `diner.png`, `gas_station.png`, `market.png`, `school.png` - Landmarks
- `exit.png` - Highway exit
- `tree.png`, `bush.png`, `flower_a/b/c.png` - Decorations
- `button.png` - UI button
- `progress_bar_back.png`, `progress_bar_fill.png`, `progress_bar_top.png` - Progress UI
- `grid_backing.png` - Grid background

---

## Implementation Priority

### Phase 1: Core Loop (MVP)
1. [ ] Grid rendering with tile placement
2. [ ] Tap-to-rotate interaction
3. [ ] Connection detection algorithm
4. [ ] Visual feedback (green roads when connected)
5. [ ] Win condition check (all landmarks connected)

### Phase 2: Progression
1. [ ] Level generator integration
2. [ ] Level transition flow
3. [ ] Chapter system with county themes
4. [ ] Clue display system

### Phase 3: Narrative
1. [ ] Start screen with character
2. [ ] Dialogue/text box system
3. [ ] Story interstitial with newspaper animation
4. [ ] News clue reveal animations

### Phase 4: Polish
1. [ ] VFX: Tile rotation particles
2. [ ] VFX: Connection celebration
3. [ ] SFX: Rotation sounds (5-10 variations)
4. [ ] SFX: Completion sounds
5. [ ] Background music (jazzy tracks)

---

## Technical Considerations

- **Deterministic RNG**: XORShift32 with seed `levelNumber * 12345`
- **Content pipeline**: AI-generated weekly chapters (3-5 per week)
- **Tracking**: Completion rates, click-through, session length
- **Platform**: Web, mobile-first responsive

---

## File Structure (Proposed)

```
src/game/citylines/
├── components/
│   ├── Grid.tsx
│   ├── Tile.tsx
│   ├── Landmark.tsx
│   └── ProgressBar.tsx
├── systems/
│   ├── ConnectionDetector.ts
│   ├── LevelGenerator.ts
│   └── ChapterManager.ts
├── screens/
│   ├── StartScreen.tsx
│   ├── GameplayScreen.tsx
│   └── StoryInterstitial.tsx
├── state/
│   └── gameState.ts
├── types/
│   └── index.ts
└── index.ts
```
