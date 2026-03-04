# Shared Components Guide

How to use, create, and document reusable game components in `src/game/shared/`.

---

## The Three Layers

```
src/core/          Platform infrastructure (DO NOT EDIT)
                       Hooks, providers, asset loading, audio base, viewport config

src/game/shared/       Reusable game components (GENERIC)
                       Accept all config via constructor params
                       No imports from game-specific code

src/game/[gamename]/   Game-specific code (COUPLED)
                       Imports from shared/ and scaffold/
                       Wraps shared components with game config
```

### Where Does My Code Go?

```
Is it game logic specific to one game?
  YES → src/game/[gamename]/

Does it import game-specific constants (atlas names, fonts, sprite maps)?
  YES → Can you make it accept those as params instead?
    YES → src/game/shared/ (parameterized)
    NO  → src/game/[gamename]/

Is it a framework-level concern (asset loading, screen routing, audio engine)?
  YES → src/core/ (requires admin mode)

Everything else that's reusable across games:
  → src/game/shared/
```

### Decision Examples

| Component | Where | Why |
|-----------|-------|-----|
| Button with hover/press animations | `shared/` | Every game needs buttons |
| Progress bar with milestone dots | `shared/` | Generic UI, font passed as param |
| Character sprite container | `shared/` | Generic pattern, sprite map passed as config |
| NJ county landmark data | `[gamename]/` | Game-specific data |
| Road tile rotation logic | `[gamename]/` | City Lines puzzle mechanic |
| Level completion state machine | `shared/` | Every game has completion flow |
| Dialogue box with 9-slice | `shared/` | Generic UI, atlas/positioning via config |
| Chapter generation service | `[gamename]/` | Game-specific content pipeline |

### Rules

1. **Shared components never import from `[gamename]/`** - they accept config through constructor params
2. **Game wrappers are thin** - just inject config, don't add logic
3. **Shared components have sensible defaults** - `fontFamily ?? 'sans-serif'` etc.
4. **Types are generic** - use `<T extends string>` not hardcoded unions

---

## Component Catalog

### SpriteButton

Interactive Pixi button with hover/press GSAP animations, optional text label, 9-slice support.

**Import:** `import { SpriteButton } from '~/game/shared/components/SpriteButton'`

**Usage:**
```typescript
const btn = new SpriteButton(gpuLoader, {
  atlasName: 'my_atlas',
  spriteName: 'button.png',
  label: 'Play',
  onClick: () => goto('game'),
  use9Slice: true,
  nineSliceBorders: { leftWidth: 12, topHeight: 12, rightWidth: 12, bottomHeight: 12 },
});
```

**Game wrapper needed?** No - fully config-driven, use directly.

---

### ProgressBar

Animated progress bar with milestone dots, smooth fill animation, optional label.

**Import:** `import { ProgressBar } from '~/game/shared/components/ProgressBar'`

**Config params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `width` | `number` | `280` | Bar width in pixels |
| `height` | `number` | `36` | Bar height in pixels |
| `fontFamily` | `string` | `'sans-serif'` | Font for label text |
| `themeColor` | `number` | `0x27ae60` | Fill color |
| `showLabel` | `boolean` | `true` | Show "3 / 10" label |

**Usage:**
```typescript
const bar = new ProgressBar(gpuLoader, atlasName, {
  width: 320,
  height: 36,
  fontFamily: GAME_FONT_FAMILY,
  themeColor: 0x007eff,
});
bar.setProgress(3, 10);       // 3 of 10 complete, animated
bar.setProgress(3, 10, false); // instant (no animation)
bar.setTheme(0xff0000);       // change fill color
```

**Game wrapper needed?** Optional - can pass `fontFamily` directly or create a wrapper.

---

### CharacterSprite

Generic character sprite container with configurable type mapping and base size.

**Import:** `import { CharacterSprite } from '~/game/shared/components/CharacterSprite'`

**Config params:**
| Param | Type | Notes |
|-------|------|-------|
| `type` | `T extends string` | Character identifier |
| `spriteMap` | `Record<T, string>` | Type → sprite frame name |
| `atlasName` | `string` | Texture atlas name |
| `baseSize` | `{ width, height }` | Base sprite dimensions for scaling |

**Game wrapper pattern:**
```typescript
// src/game/mygame/core/MyCharacter.ts
import { CharacterSprite } from '~/game/shared/components/CharacterSprite';

type MyCharacterType = 'hero' | 'sidekick';

export class MyCharacter extends CharacterSprite<MyCharacterType> {
  constructor(type: MyCharacterType, gpuLoader: PixiLoader, scale = 1) {
    super(gpuLoader, {
      type,
      spriteMap: { hero: 'hero.png', sidekick: 'sidekick.png' },
      atlasName: getAtlasName(),
      baseSize: { width: 200, height: 220 },
    }, scale);
  }
}
```

**Game wrapper needed?** Yes - you need to provide your character types and sprite mapping.

---

### DialogueBox

9-slice sprite dialogue box with auto-sizing text, responsive positioning.

**Import:** `import { DialogueBox } from '~/game/shared/components/DialogueBox'`

**Config params:**
| Param | Type | Notes |
|-------|------|-------|
| `atlasName` | `string` | Texture atlas |
| `spriteName` | `string` | 9-slice sprite frame (e.g. `'dialogue.png'`) |
| `fontFamily` | `string` | Font for text content |
| `positioning` | `DialogueBoxPositioning` | Bottom padding, max width, width % |

**Game wrapper pattern:**
```typescript
// src/game/mygame/ui/MyDialogueBox.ts
import { DialogueBox as SharedDialogueBox } from '~/game/shared/components/DialogueBox';

export class MyDialogueBox extends SharedDialogueBox {
  constructor(gpuLoader: PixiLoader, screenWidth: number, screenHeight: number) {
    super(gpuLoader, {
      atlasName: 'my_atlas',
      spriteName: 'speech_bubble.png',
      fontFamily: MY_FONT,
      positioning: { dialogueBottomPadding: 40, dialogueMaxWidth: 600, dialogueWidthPercent: 0.9 },
    }, screenWidth, screenHeight);
  }
}
```

**Game wrapper needed?** Yes - needs atlas, sprite, font, and positioning config.

---

### AvatarPopup

Circular character avatar with speech bubble popup. Auto-dismisses on timer or tap. GSAP animations.

**Import:** `import { AvatarPopup } from '~/game/shared/components/AvatarPopup'`

**Config params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `atlasName` | `string` | — | Texture atlas |
| `characterSpriteName` | `string` | — | Character sprite frame |
| `dialogueSpriteName` | `string` | — | Dialogue 9-slice sprite frame |
| `characterBaseSize` | `{ width, height }` | — | For head-crop scaling |
| `fontFamily` | `string` | `'sans-serif'` | Text font |
| `circleSize` | `number` | `64` | Avatar circle diameter |
| `dialogWidth` | `number` | `280` | Speech bubble width |

**Game wrapper pattern:**
```typescript
export class MyPopup extends AvatarPopup {
  constructor(gpuLoader: PixiLoader) {
    super(gpuLoader, {
      atlasName: 'my_atlas',
      characterSpriteName: 'npc_head.png',
      dialogueSpriteName: 'bubble.png',
      characterBaseSize: { width: 200, height: 220 },
      fontFamily: MY_FONT,
    });
  }
}
```

**Game wrapper needed?** Yes - needs character sprite and atlas config.

---

### LevelCompletionController

State machine for level completion flow: `playing → completing → complete`. Event-driven, configurable timers.

**Import:** `import { createLevelCompletionController } from '~/game/shared/controllers/LevelCompletionController'`

**Usage:**
```typescript
const controller = createLevelCompletionController({
  events: {
    onCompletionStart: (clue, levelNumber) => showOverlay(clue),
    onClueTimerEnd: () => showContinueButton(),
    onCompletionEnd: () => loadNextLevel(),
    onLevelComplete: ({ levelId, moves, durationMs }) => trackAnalytics(levelId),
  },
  celebrationDuration: 500,  // ms before showing overlay
  clueDuration: 3000,        // ms before continue button appears
});

// When puzzle solved:
controller.startCompletion(levelId, moveCount, elapsedMs, clueText);

// When continue clicked:
controller.continue();

// Between levels:
controller.reset();
```

**Game wrapper needed?** No - fully config-driven via events object.

---

## New Game Integration Checklist

When starting a new game, go through each shared component and decide whether to adopt it:

### Required Setup

- [ ] Create `src/game/config/fonts.ts` with `GAME_FONT_FAMILY`
- [ ] Prepare sprite atlas with UI sprites (buttons, dialogue boxes, etc.)

### Component Adoption

| Component | Need It? | Action |
|-----------|----------|--------|
| **SpriteButton** | Any interactive buttons in Pixi? | Use directly, pass atlas + sprite name |
| **ProgressBar** | Show level/chapter progress? | Use directly or wrap, pass `fontFamily` |
| **CharacterSprite** | Display character sprites? | Create wrapper with your character types and sprite map |
| **DialogueBox** | In-game dialogue or text popups? | Create wrapper with your atlas, font, positioning |
| **AvatarPopup** | Character head + speech bubble? | Create wrapper with your character sprite config |
| **LevelCompletionController** | Level-based game with completion flow? | Use directly, wire your events |

### Wrapper Template

For components that need a game wrapper:

```typescript
// src/game/[gamename]/ui/MyComponent.ts
import { SharedComponent } from '~/game/shared/components/SharedComponent';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../utils/atlasHelper';  // your atlas helper
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

export class MyComponent extends SharedComponent {
  constructor(gpuLoader: PixiLoader, /* game-specific params */) {
    super(gpuLoader, {
      atlasName: getAtlasName(),
      fontFamily: GAME_FONT_FAMILY,
      // ... other game config
    });
  }
}
```

### Barrel Exports

If your game wrapper replaces a shared component name, re-export it from your game's barrel so consumers don't need to know the difference:

```typescript
// src/game/[gamename]/ui/index.ts
export { MyDialogueBox as DialogueBox } from './MyDialogueBox';
```

---

## Adding a New Shared Component

### When to Create One

Create a shared component when:
- You're building something that the next game would also need
- The component has zero game-specific imports (or can be parameterized to remove them)
- It's a UI pattern (buttons, popups, progress indicators) or a game flow pattern (completion, scoring)

### Step-by-Step

1. **Create the component** in `src/game/shared/components/` (or `controllers/`)
2. **Parameterize everything** - no imports from `[gamename]/`, accept config via constructor
3. **Provide defaults** for optional params (`fontFamily ?? 'sans-serif'`)
4. **Export from barrel** - add to `shared/components/index.ts` or `shared/controllers/index.ts`
5. **Create game wrapper** in `[gamename]/` if the game needs pre-configured defaults
6. **Document in this file** - add a catalog entry (see template below)

### Catalog Entry Template

Add this to the Component Catalog section above:

```markdown
### ComponentName

One-line description.

**Import:** `import { ComponentName } from '~/game/shared/components/ComponentName'`

**Config params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `param1` | `string` | — | Description |
| `param2` | `number` | `10` | Description |

**Usage:**
\`\`\`typescript
// minimal example
\`\`\`

**Game wrapper needed?** Yes/No - explanation.
```

### Naming Conventions

| Type | Location | Naming |
|------|----------|--------|
| Shared component | `shared/components/PascalCase.ts` | Generic name (`CharacterSprite`, not `CompanionCharacter`) |
| Shared controller | `shared/controllers/PascalCase.ts` | Generic name (`LevelCompletionController`) |
| Game wrapper | `[gamename]/core/` or `[gamename]/ui/` | Game-specific name (`Character`, `CluePopup`) |
| Config interface | Same file as component | `ComponentNameConfig` |

---

## Related

- [Creating a New Game](../getting-started/new-game.md) - Full new game setup guide
- [Context Map](../../scaffold/context-map.md) - Architecture overview
- [Animation Cookbook](animation-cookbook.md) - GSAP patterns used by shared components
