# Easing Picker

Custom dropdown component for selecting GSAP easing functions with visual curve previews.

## Overview

The EasingPicker replaces the standard Tweakpane dropdown for easing parameters, providing:
- Visual curve preview for each easing option
- Vertical layout with curve on top, label below
- Support for overshoot/undershoot visualization (back, elastic, bounce easings)

## Visual Layout

```
┌─────────────────────────────────┐
│ Tile Rotate Easing              │  ← Property label
├─────────────────────────────────┤
│ ┌─────────────────────────┐ ▼   │
│ │ ~~~curve preview~~~~    │     │  ← Curve visualization
│ └─────────────────────────┘     │
│ Elastic Out (soft)              │  ← Current selection label
└─────────────────────────────────┘

Dropdown (when open):
┌─────────────────────────────────┐
│ ┌───────────────────────┐   ✓   │  ← Selected item
│ │ ~~~~elastic curve~~~~ │       │
│ └───────────────────────┘       │
│ Elastic Out (soft)              │
├─────────────────────────────────┤
│ ┌───────────────────────┐       │
│ │ ____linear curve_____ │       │
│ └───────────────────────┘       │
│ Linear                          │
├─────────────────────────────────┤
│ ┌───────────────────────┐       │
│ │ ╱╱╱power curve╱╱╱╱    │       │
│ └───────────────────────┘       │
│ Power2 Out                      │
└─────────────────────────────────┘
```

## Available Easings

| Label | GSAP Value | Description |
|-------|------------|-------------|
| Linear | `none` | No easing, constant speed |
| Power1 Out | `power1.out` | Subtle deceleration |
| Power2 Out | `power2.out` | Standard deceleration |
| Power3 Out | `power3.out` | Strong deceleration |
| Power4 Out | `power4.out` | Aggressive deceleration |
| Back Out | `back.out(1.7)` | Slight overshoot |
| Back Out (subtle) | `back.out(1)` | Minimal overshoot |
| Back Out (strong) | `back.out(3)` | Pronounced overshoot |
| Elastic Out | `elastic.out(1, 0.3)` | Bouncy oscillation |
| Elastic Out (soft) | `elastic.out(1, 0.5)` | Gentle oscillation |
| Bounce Out | `bounce.out` | Ball bounce effect |
| Expo Out | `expo.out` | Exponential deceleration |
| Circ Out | `circ.out` | Circular deceleration |

## Curve Visualization

The SVG curve preview shows:
- **X-axis**: Time (0 to 1)
- **Y-axis**: Value (0 to 1)
- **Headroom**: 25% above for overshoot, 10% below for undershoot
- **Border**: Subtle white border, no background fill

```
Size: 100x48 pixels
Stroke: #4dabf7 (light blue), 2px width
Border: rgba(255, 255, 255, 0.2)
```

## Usage in Tuning System

The picker is automatically used for any tuning parameter with these keys:
- `defaultEasing`
- `tileRotateEasing`

See `src/scaffold/dev/bindings.ts` for the integration point.

## File Locations

| File | Purpose |
|------|---------|
| `src/scaffold/dev/EasingPicker.ts` | Component implementation |
| `src/scaffold/dev/bindings.ts` | Tweakpane integration |

## Adding New Easing Options

Edit `EASING_OPTIONS` in `EasingPicker.ts`:

```typescript
export const EASING_OPTIONS: EasingOption[] = [
  { label: 'Display Name', value: 'gsap.easing.string' },
  // ...
];
```

The curve is automatically generated from the GSAP easing string using `gsap.parseEase()`.

## Technical Notes

- **Vanilla DOM**: Not a SolidJS component (integrates with Tweakpane's vanilla DOM)
- **Event listeners**: Properly cleaned up on destroy
- **Keyboard support**: Escape to close dropdown
- **Click outside**: Closes dropdown automatically
