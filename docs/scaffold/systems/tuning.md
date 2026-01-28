# Tuning System

Real-time parameter adjustment for development and QA.

## Overview

The tuning system provides a two-tier configuration:
- **Scaffold tuning** — Framework-level settings (engine, audio, performance)
- **Game tuning** — Game-specific settings (grid, visuals, scoring)

## Accessing the Panel

- **Keyboard**: Press backtick (`) to toggle
- **Settings Menu**: Click wrench icon (dev/QA only)
- **Visibility**: Dev and QA environments only, hidden in production

## Panel Position

Configure via `Scaffold → Tuning Panel → Position`:
- Left (default)
- Center
- Right

## Color Coding

| Section | Color | Description |
|---------|-------|-------------|
| Scaffold | Cyan | Framework settings |
| Game | Orange | Game-specific settings |
| Unwired | Red italic | Not connected to reactive effects |

## Wired vs Unwired

- **Wired** (normal text): Changes apply immediately via reactive effects
- **Unwired** (red italic): Setting exists but isn't connected to live updates

Register wired paths in `src/scaffold/dev/tuningRegistry.ts`.

## Actions

- **Save to Browser** — Persist to localStorage
- **Export JSON** — Copy config to clipboard
- **Reset to Defaults** — Clear overrides and reload

## Adding New Tuning Parameters

### Scaffold Tuning
1. Add type to `src/scaffold/systems/tuning/types.ts`
2. Add default value to `SCAFFOLD_DEFAULTS`
3. Wire in component via `useTuning().scaffold()`
4. Register path in `tuningRegistry.ts`

### Game Tuning
1. Add type to `src/game/tuning/types.ts`
2. Add default value to game tuning defaults
3. Wire in component via `useTuning().game()`
4. Register path in `tuningRegistry.ts`

## Custom Components

The tuning panel includes custom UI components that extend Tweakpane's default controls:

- **[EasingPicker](../components/easing-picker.md)** — Visual curve preview dropdown for GSAP easing selection

## File Locations

| File | Purpose |
|------|---------|
| `src/scaffold/systems/tuning/types.ts` | Type definitions & defaults |
| `src/scaffold/dev/TuningPanel.tsx` | Panel UI component |
| `src/scaffold/dev/bindings.ts` | Tweakpane bindings |
| `src/scaffold/dev/tuningRegistry.ts` | Wired path registry |
| `src/scaffold/dev/EasingPicker.ts` | Custom easing dropdown component |
| `src/game/tuning/types.ts` | Game-specific tuning types |
