# Tuning Panel

Development UI component for real-time parameter adjustment.

## Overview

The TuningPanel is a collapsible sidebar that provides live access to all tuning parameters during development and QA. It's powered by [Tweakpane](https://tweakpane.github.io/docs/) and integrates with the scaffold's reactive tuning system.

## Visibility

- **Development**: Always available
- **QA Mode**: Always available
- **Production**: Hidden

## Accessing the Panel

| Method | Action |
|--------|--------|
| Keyboard | Press backtick (`) to toggle |
| Settings | Click wrench icon (dev/QA only) |

## Panel Position

The panel can be positioned on the left, center, or right edge of the screen.

Configure via `Scaffold > Tuning Panel > Position` in the panel itself.

```
Left (default)     Center              Right
┌────┬─────────┐   ┌────────────────┐   ┌─────────┬────┐
│    │         │   │    ┌────┐     │   │         │    │
│ TP │  Game   │   │    │ TP │     │   │  Game   │ TP │
│    │         │   │    └────┘     │   │         │    │
└────┴─────────┘   └────────────────┘   └─────────┴────┘
```

## Color Coding

| Color | Section | Meaning |
|-------|---------|---------|
| Cyan | Scaffold | Framework-level settings (engine, audio, performance) |
| Orange | Game | Game-specific settings (grid, visuals, scoring) |
| Red italic | Unwired | Parameter exists but isn't connected to live updates |

### Wired vs Unwired

- **Wired** (normal text): Changes apply immediately via reactive effects
- **Unwired** (red italic): Setting exists but changes require restart or manual application

Register wired paths in `src/scaffold/dev/tuningRegistry.ts`.

## Sections

### Scaffold Section (Cyan)
Framework settings that apply to all games:
- Engine configuration
- Audio settings
- Performance tuning
- Tuning panel position

### Game Section (Orange)
Game-specific settings defined in `src/game/tuning/types.ts`:
- Grid layout (size, padding, gaps)
- Tile animations (duration, easing)
- Visual parameters

## Custom Components

The panel includes custom UI components for enhanced parameter editing:

- **[Easing Picker](./easing-picker.md)** — Visual curve preview dropdown for GSAP easing selection

## Actions

The panel includes preset controls at the bottom:

| Action | Description |
|--------|-------------|
| Save to Browser | Persist current settings to localStorage |
| Export JSON | Copy full config to clipboard |
| Reset to Defaults | Clear all overrides and reload |

## Implementation

**File:** `src/scaffold/dev/TuningPanel.tsx`

The component:
1. Creates a Tweakpane instance on mount
2. Binds all tuning parameters via `bindTuningToPane()`
3. Listens for backtick key to toggle visibility
4. Cleans up on unmount

## Related Documentation

- [Tuning System](../services/tuning.md) — How to add and wire tuning parameters
- [Easing Picker](./easing-picker.md) — Custom GSAP easing dropdown component
