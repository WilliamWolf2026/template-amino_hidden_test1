# Utils & Audio Reorganization Plan

## Current State Analysis

### Location: `src/utils/`

```
src/utils/
├── index.ts                    # Exports TweakpaneConfig
├── TweakpaneConfig.tsx         # Debug panel (Solid.js, backtick toggle)
└── audio/
    ├── AudioContext.tsx        # React context definition
    ├── AudioProvider.tsx       # React provider (SFX, VO, Music, Ambient)
    ├── constants.ts            # Audio asset paths & keys
    └── settings/
        ├── AudioControls.tsx       # Main settings panel
        ├── AudioControlGroup.tsx   # Grouped controls
        ├── AudioControlSection.tsx # Section wrapper
        ├── AudioToggle.tsx         # Enable/disable toggle
        ├── StatusIndicator.tsx     # Status light
        └── VolumeSlider.tsx        # Volume slider
```

### Key Findings

| Component | Framework | Purpose | Should Be |
|-----------|-----------|---------|-----------|
| TweakpaneConfig | Solid.js | Dev debug panel | Scaffold |
| AudioContext | **React** | Context definition | Needs conversion to Solid.js |
| AudioProvider | **React** | Audio state management | Needs conversion to Solid.js |
| constants.ts | N/A | Game-specific audio assets | Game |
| settings/* | **React** | Settings menu UI | Needs conversion to Solid.js |

**Critical Issue:** The audio system is written in React, but the rest of the codebase uses Solid.js!

---

## Problems to Solve

1. **Framework Mismatch** - Audio system uses React in a Solid.js app
2. **Misleading Naming** - "audio" folder contains settings UI, not just audio
3. **Mixed Concerns** - Game-specific constants mixed with scaffold systems
4. **TweakpaneConfig location** - Should be in scaffold as dev tooling

---

## Reorganization Options

### Option 1: Minimal Move (No Framework Change)

Move files as-is, fix later.

```
src/scaffold/
├── utils/
│   └── TweakpaneConfig.tsx     # Dev panel
└── systems/
    └── audio/                  # Keep React (temporary)
        ├── context.tsx
        ├── provider.tsx
        └── ui/                 # Settings components

src/game/
└── audio/
    └── constants.ts            # Game audio assets
```

**Pros:** Fast, minimal risk
**Cons:** React/Solid mismatch remains, technical debt

---

### Option 2: Full Conversion to Solid.js

Convert audio system to Solid.js and reorganize.

```
src/scaffold/
├── dev/
│   └── TweakpaneConfig.tsx     # Debug tools
└── systems/
    ├── audio/
    │   ├── state.ts            # createRoot signal state (like pause)
    │   ├── context.tsx         # Solid context + provider
    │   ├── player.ts           # Audio playback engine
    │   └── index.ts
    └── settings/
        ├── SettingsPanel.tsx   # Generic settings container
        ├── AudioSettings.tsx   # Audio controls (uses audio system)
        ├── Toggle.tsx          # Reusable toggle
        ├── Slider.tsx          # Reusable slider
        └── index.ts

src/game/
└── audio/
    ├── manifest.ts             # AUDIO_ASSETS definition
    └── index.ts
```

**Pros:** Clean architecture, consistent framework
**Cons:** Requires rewrite effort

---

### Option 3: Separate Settings System

Treat settings as its own scaffold system.

```
src/scaffold/
├── dev/
│   └── Tweakpane.tsx
└── systems/
    ├── audio/                  # Pure audio engine
    │   ├── state.ts            # Volume/enabled signals
    │   ├── player.ts           # play(), stop(), etc.
    │   ├── context.tsx         # Provider wrapper
    │   └── index.ts
    └── settings/               # Generic settings framework
        ├── SettingsContext.tsx # Settings state container
        ├── SettingsPanel.tsx   # Modal/overlay wrapper
        ├── controls/
        │   ├── Toggle.tsx
        │   ├── Slider.tsx
        │   ├── Section.tsx
        │   └── index.ts
        └── index.ts

src/game/
├── audio/
│   └── assets.ts               # Game audio asset definitions
└── settings/
    └── GameSettings.tsx        # Game-specific settings (uses scaffold controls)
```

**Pros:** Maximum flexibility, clear separation
**Cons:** More files, may be over-engineered

---

### Option 4: Hybrid - Settings in Audio

Keep settings UI close to audio since they're tightly coupled.

---

### Option 5: Dedicated Settings Menu System (Recommended)

Keep settings UI close to audio since they're tightly coupled.

```
src/scaffold/
├── dev/
│   └── Tweakpane.tsx           # Debug panel
└── systems/
    └── audio/
        ├── state.ts            # Audio signals (Solid.js)
        ├── context.tsx         # AudioProvider (Solid.js)
        ├── player.ts           # Playback logic
        ├── ui/
        │   ├── AudioSettings.tsx   # Full settings panel
        │   ├── VolumeSlider.tsx
        │   ├── AudioToggle.tsx
        │   └── index.ts
        └── index.ts

src/game/
└── audio.ts                    # Game audio asset manifest
```

**Pros:** Cohesive, minimal file sprawl
**Cons:** Settings UI locked to audio

---

### Option 5: Dedicated Settings Menu System (Recommended)

Create a standalone settings menu scaffold system. Audio becomes one "section" that plugs in.

```
src/scaffold/
├── dev/
│   └── Tweakpane.tsx               # Debug panel (backtick)
└── systems/
    ├── audio/                      # Pure audio engine
    │   ├── state.ts                # Volume/enabled signals
    │   ├── player.ts               # play(), stop(), setVolume()
    │   ├── context.tsx             # AudioProvider
    │   └── index.ts
    │
    └── settings/                   # Settings menu framework
        ├── state.ts                # Settings open/closed signal
        ├── keyboard.ts             # ESC key handler
        ├── context.tsx             # SettingsProvider
        ├── ui/
        │   ├── SettingsOverlay.tsx # Full-screen modal
        │   ├── SettingsPanel.tsx   # Panel container
        │   ├── Section.tsx         # Collapsible section
        │   ├── Toggle.tsx          # On/off toggle
        │   ├── Slider.tsx          # Range slider
        │   └── index.ts
        ├── sections/               # Built-in setting sections
        │   ├── AudioSection.tsx    # Uses audio system
        │   └── index.ts
        └── index.ts

src/game/
├── audio.ts                        # Game audio asset manifest
└── settings/                       # Game-specific settings (optional)
    └── GameplaySection.tsx         # e.g., difficulty, hints toggle
```

**How it works:**
- Press **ESC** → Opens settings overlay (like pause, but for settings)
- Settings menu has sections: Audio, Gameplay, etc.
- `AudioSection` connects to `scaffold/systems/audio` state
- Games can add custom sections in `game/settings/`

**Pros:**
- Clean separation of concerns
- Reusable controls (Toggle, Slider) for any setting
- Extensible - games add their own sections
- Settings menu is a first-class scaffold feature

**Cons:**
- More files than Option 4

---

## Recommended Approach: Option 5 (Settings Menu System)

### Phase 1: Move TweakpaneConfig to Scaffold

```
src/scaffold/dev/Tweakpane.tsx
```

This is straightforward - already Solid.js.

### Phase 2: Create Settings Menu System (Solid.js)

**state.ts** - Settings open/closed signal
```typescript
export const settingsState = createRoot(() => {
  const [isOpen, setIsOpen] = createSignal(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(p => !p),
  };
});
```

**keyboard.ts** - ESC key handler
```typescript
export function initSettingsKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      settingsState.toggle();
    }
  });
}
```

**ui/SettingsOverlay.tsx** - Modal overlay
```typescript
export function SettingsOverlay(props: { children: JSX.Element }) {
  const { isOpen, close } = useSettings();
  return (
    <Show when={isOpen()}>
      <div class="fixed inset-0 z-50 bg-black/80">
        <button onClick={close}>Close</button>
        {props.children}
      </div>
    </Show>
  );
}
```

### Phase 3: Create Audio System (Solid.js)

**state.ts** - Audio signals
```typescript
export const audioState = createRoot(() => {
  const [sfxEnabled, setSfxEnabled] = createSignal(true);
  const [sfxVolume, setSfxVolume] = createSignal(0.5);
  const [musicEnabled, setMusicEnabled] = createSignal(true);
  const [musicVolume, setMusicVolume] = createSignal(0.4);
  // ... etc with localStorage persistence
});
```

**player.ts** - Audio playback engine
```typescript
export function playSfx(key: string, url: string) { ... }
export function playMusic(key: string, url: string) { ... }
export function stopAll() { ... }
```

### Phase 4: Create Reusable Settings Controls (Solid.js)

Convert React components to Solid.js:
- `useState` → `createSignal`
- `useEffect` → `createEffect`
- `useCallback` → regular functions
- `useRef` → `let ref`
- `React.FC` → regular function components

**ui/Toggle.tsx** - Reusable toggle
**ui/Slider.tsx** - Reusable slider
**ui/Section.tsx** - Collapsible section

### Phase 5: Create AudioSection

**sections/AudioSection.tsx** - Connects settings UI to audio state
```typescript
export function AudioSection() {
  const audio = useAudio();
  return (
    <Section title="Audio">
      <Toggle label="Sound Effects" value={audio.sfxEnabled()} onChange={audio.toggleSfx} />
      <Slider label="SFX Volume" value={audio.sfxVolume()} onChange={audio.setSfxVolume} />
      {/* ... music, VO, ambient */}
    </Section>
  );
}
```

### Phase 6: Move Game Assets to Game Folder

```
src/game/audio.ts  # Export AUDIO_ASSETS, SfxKey, VoKey, etc.
```

---

## Naming Considerations

### Current Names (Confusing)
- `utils/audio/settings/` - Sounds like config files, actually UI components

### Proposed Names (Clear)

| Current | Proposed | Reason |
|---------|----------|--------|
| `AudioControls.tsx` | `AudioSettings.tsx` | Clearer purpose |
| `AudioControlSection.tsx` | `SettingsSection.tsx` | More generic |
| `AudioControlGroup.tsx` | Remove or merge | Likely redundant |
| `constants.ts` | `assets.ts` or `manifest.ts` | Matches asset manifest pattern |
| `utils/` | `dev/` | Better describes TweakpaneConfig |

---

## Migration Checklist

### Phase 1: Dev Tools
- [ ] Create `scaffold/dev/` folder
- [ ] Move TweakpaneConfig to `scaffold/dev/Tweakpane.tsx`
- [ ] Update app.tsx import

### Phase 2: Settings System
- [ ] Create `scaffold/systems/settings/state.ts`
- [ ] Create `scaffold/systems/settings/keyboard.ts` (ESC handler)
- [ ] Create `scaffold/systems/settings/context.tsx`
- [ ] Create `scaffold/systems/settings/ui/SettingsOverlay.tsx`
- [ ] Create `scaffold/systems/settings/ui/SettingsPanel.tsx`
- [ ] Create `scaffold/systems/settings/ui/Toggle.tsx`
- [ ] Create `scaffold/systems/settings/ui/Slider.tsx`
- [ ] Create `scaffold/systems/settings/ui/Section.tsx`
- [ ] Create `scaffold/systems/settings/index.ts`

### Phase 3: Audio System
- [ ] Create `scaffold/systems/audio/state.ts` (Solid.js signals)
- [ ] Create `scaffold/systems/audio/player.ts` (playback logic)
- [ ] Create `scaffold/systems/audio/context.tsx` (AudioProvider)
- [ ] Create `scaffold/systems/audio/index.ts`

### Phase 4: Audio Settings Section
- [ ] Create `scaffold/systems/settings/sections/AudioSection.tsx`

### Phase 5: Game Audio Assets
- [ ] Move `constants.ts` to `game/audio.ts`
- [ ] Update game/index.ts exports

### Phase 6: Integration & Cleanup
- [ ] Update `scaffold/index.ts` exports
- [ ] Update `app.tsx` to use SettingsProvider + AudioProvider
- [ ] Add initSettingsKeyboard() to app.tsx onMount
- [ ] Delete old `utils/` folder
- [ ] Test settings menu opens with ESC
- [ ] Test audio toggles and volume sliders
- [ ] Test localStorage persistence
- [ ] Test audio playback

---

## Questions to Decide

1. **Settings modal trigger** - How should users open settings?
   - ~~Gear icon in HUD?~~
   - **ESC key** (recommended - scaffold handles this)
   - ~~Part of pause overlay?~~
   - ~~Integrated into TweakpaneConfig?~~

2. **Settings scope** - Should settings system handle more than audio?
   - **Yes** - that's why we're creating a generic settings system
   - Audio is just one section
   - Games can add: Gameplay, Accessibility, Graphics, etc.

3. **Audio asset registration** - How should games define their audio?
   - **Current approach:** `game/audio.ts` with AUDIO_ASSETS constant
   - Could later integrate with asset manifest system if needed

4. **Pause vs Settings interaction** - What happens when both are triggered?
   - Option A: ESC always opens settings, SPACE always pauses (separate)
   - Option B: ESC opens settings OR closes pause overlay (context-aware)
   - Option C: Settings is a tab within pause overlay (combined)

---

## File Mapping Summary

| Old Path | New Path | Notes |
|----------|----------|-------|
| `utils/index.ts` | `scaffold/dev/index.ts` | |
| `utils/TweakpaneConfig.tsx` | `scaffold/dev/Tweakpane.tsx` | |
| `utils/audio/AudioContext.tsx` | `scaffold/systems/audio/context.tsx` | Convert to Solid.js |
| `utils/audio/AudioProvider.tsx` | `scaffold/systems/audio/context.tsx` | Merge + convert |
| `utils/audio/constants.ts` | `game/audio.ts` | Game-specific |
| `utils/audio/settings/AudioControls.tsx` | `scaffold/systems/settings/sections/AudioSection.tsx` | Convert |
| `utils/audio/settings/AudioControlSection.tsx` | `scaffold/systems/settings/ui/Section.tsx` | Generalize |
| `utils/audio/settings/AudioToggle.tsx` | `scaffold/systems/settings/ui/Toggle.tsx` | Generalize |
| `utils/audio/settings/VolumeSlider.tsx` | `scaffold/systems/settings/ui/Slider.tsx` | Generalize |
| `utils/audio/settings/StatusIndicator.tsx` | `scaffold/systems/settings/ui/StatusIndicator.tsx` | Convert |
| `utils/audio/settings/AudioControlGroup.tsx` | (remove or merge) | Likely redundant |

## Final Structure (Option 5)

```
src/
├── scaffold/
│   ├── dev/
│   │   ├── Tweakpane.tsx           # Debug panel (backtick)
│   │   └── index.ts
│   ├── systems/
│   │   ├── assets/                 # (existing)
│   │   ├── screens/                # (existing)
│   │   ├── errors/                 # (existing)
│   │   ├── pause/                  # (existing)
│   │   ├── audio/                  # NEW
│   │   │   ├── state.ts
│   │   │   ├── player.ts
│   │   │   ├── context.tsx
│   │   │   └── index.ts
│   │   └── settings/               # NEW
│   │       ├── state.ts
│   │       ├── keyboard.ts
│   │       ├── context.tsx
│   │       ├── ui/
│   │       │   ├── SettingsOverlay.tsx
│   │       │   ├── SettingsPanel.tsx
│   │       │   ├── Section.tsx
│   │       │   ├── Toggle.tsx
│   │       │   ├── Slider.tsx
│   │       │   └── index.ts
│   │       ├── sections/
│   │       │   ├── AudioSection.tsx
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── ui/                         # (existing)
│   ├── lib/                        # (existing)
│   └── index.ts
│
├── game/
│   ├── screens/                    # (existing)
│   ├── audio.ts                    # NEW - game audio assets
│   ├── state.ts                    # (existing)
│   ├── manifest.ts                 # (existing)
│   ├── config.ts                   # (existing)
│   └── index.ts
│
└── app.tsx
```
