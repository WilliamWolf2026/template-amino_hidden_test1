# Pixi.js Scene Graph

Display object hierarchy for each screen that uses Pixi.js. Layer order is top-to-bottom (first child = bottom layer).

See also: [architecture.md](architecture.md), [entry-point-map.md](entry-point-map.md)

---

## GameScreen

```mermaid
graph LR
    STAGE["stage (Container)"]

    STAGE --> BG["background\n(Sprite + BlurFilter)"]

    STAGE --> CLG["CityLinesGame\n(Container)"]
    CLG --> GRID["gridContainer"]
    GRID --> GRIDBG["gridBackground\n(NineSliceSprite)"]
    CLG --> EXITS["exitsContainer"]
    EXITS --> EXIT["Exit ×N (Container)"]
    EXIT --> EXITROAD["roadBackgrounds"]
    EXITROAD --> EXITMASK["mask (Graphics)"]
    EXITROAD --> EXITRS["road (Sprite)"]
    EXIT --> EXITS2["sprite (Sprite)\nexit.png"]
    CLG --> ROADS["roadTilesContainer"]
    ROADS --> RT["RoadTile ×N (Container)"]
    RT --> RTDEF["defaultSprite (Sprite)"]
    RT --> RTCOMP["completedSprite (Sprite)"]
    CLG --> VFX["vfxContainer"]
    VFX --> VFXROT["AnimatedSprite\nvfx-rotate"]
    VFX --> VFXBLAST["AnimatedSprite\nvfx-blast"]
    CLG --> DECO["decorationsContainer"]
    DECO --> DECOSPRITE["Sprite ×N\ntree / bush / flower"]
    CLG --> LAND["landmarksContainer"]
    LAND --> LM["Landmark ×N (Container)"]
    LM --> LMROAD["roadBackgrounds"]
    LMROAD --> LMMASK["mask (Graphics)"]
    LMROAD --> LMRS["road (Sprite)"]
    LM --> LMS["sprite (Sprite)\nlandmark_*.png"]
    CLG --> TH["TutorialHand (Container)"]
    TH --> THHAND["handSprite (Container)"]
    THHAND --> THSPRITE["Sprite\nsprite-hand.png"]

    STAGE --> CLABEL["chapterLabel (Text)"]

    STAGE --> PB["ProgressBar (Container)"]
    PB --> PBBG["backgroundGraphics"]
    PB --> PBFILL["fillGraphics"]
    PB --> PBMILE["milestoneGraphics"]
    PB --> PBBORDER["borderGraphics"]
    PB --> PBLABEL["labelText (Text)"]

    STAGE --> CLUE["CluePopup (Container)"]
    CLUE --> CIRCLE["circleContainer"]
    CIRCLE --> CHARSP["characterSprite (Sprite)"]
    CIRCLE --> CMASK["circleMask (Graphics)"]
    CIRCLE --> CBORDER["circleBorder (Graphics)"]
    CLUE --> DBOX["dialogueBox\n(NineSliceSprite)"]
    CLUE --> DTXT["textField (Text)"]
    CLUE --> CLICK["clickArea (Graphics)"]

    STAGE --> DARK["darkOverlay (Graphics)"]

    STAGE --> COMPGRP["companionGroup (Container)"]
    COMPGRP --> COMPCHAR["CompanionCharacter"]
    COMPCHAR --> COMPSPRITE["sprite (Sprite)\ncharacter_*.png"]
    COMPGRP --> COMPDLG["DialogueBox (Container)"]
    COMPDLG --> COMPBOX["boxSprite\n(NineSliceSprite)"]
    COMPDLG --> COMPTXT["textField (Text)"]
```

### Layer Order (bottom → top)

1. `background` — blurred Sprite
2. `CityLinesGame` — grid, exits, road tiles, VFX, decorations, landmarks, tutorial hand
3. `chapterLabel` — Text (e.g. "1 / 10")
4. `ProgressBar` — Graphics layers + Text
5. `CluePopup` — avatar circle + dialogue (mid-level clues)
6. `darkOverlay` — semi-transparent Graphics (modal backdrop)
7. `companionGroup` — character sprite + dialogue box (chapter-end overlay)

---

## StartScreen

```mermaid
graph LR
    STAGE["stage (Container)"]
    STAGE --> BG["background (Sprite)"]
    STAGE --> UI["uiContainer (Container)"]
    UI --> TITLE["titleSprite (Sprite)"]
    UI --> BADGE["countyBadge (Graphics)"]
    UI --> CTXT["countyText (Text)"]
    UI --> GOAL["goalPanel (Graphics)"]
    UI --> GTXT["goalText (Text)"]
    UI --> SHADOW["characterShadow (Graphics)"]
    UI --> CHAR["Character (CharacterSprite)"]
    CHAR --> CHARSP["sprite (Sprite)\ncharacter_*.png"]
    UI --> FLAVOR["flavorText (Text)"]
    UI --> BTN["startButton (SpriteButton)"]
    BTN --> BTNSP["sprite (NineSliceSprite)"]
    BTN --> BTNTXT["labelText (Text)"]
```

---

## Component Reference

| Component | Extends | File |
|-----------|---------|------|
| CityLinesGame | Container | `src/game/citylines/core/CityLinesGame.ts` |
| RoadTile | Container | `src/game/citylines/core/RoadTile.ts` |
| Landmark | Container | `src/game/citylines/core/Landmark.ts` |
| Exit | Container | `src/game/citylines/core/Exit.ts` |
| TutorialHand | Container | `src/game/citylines/core/TutorialHand.ts` |
| DecorationSystem | — | `src/game/citylines/systems/DecorationSystem.ts` |
| ProgressBar | Container | `src/game/shared/components/ProgressBar.ts` |
| AvatarPopup | Container | `src/game/shared/components/AvatarPopup.ts` |
| DialogueBox | Container | `src/game/shared/components/DialogueBox.ts` |
| CompanionCharacter | Container | `src/game/citylines/ui/companion/CompanionCharacter.ts` |
| CharacterSprite | Container | `src/game/shared/components/CharacterSprite.ts` |
| SpriteButton | Container | `src/game/shared/components/SpriteButton.ts` |
