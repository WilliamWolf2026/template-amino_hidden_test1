# Viewport Constraints

## Overview

This document defines the viewport and responsive design constraints for City Lines and other Advance games.

## Minimum Viewport

| Property | Value | Notes |
|----------|-------|-------|
| **Width** | 355px | Based on iPhone SE (375px) minus 10px side gaps |
| **Height** | 473px | Calculated from 3:4 aspect ratio |
| **Aspect Ratio** | 3:4 (width:height) | Standard camera photo aspect ratio |

## Rationale

### Minimum Width: 355px
- iPhone SE has minimum screen width of 375px
- Account for 10px gap on each side (landing page margins, ad unit padding)
- Effective content width: 375px - 20px = 355px

### Aspect Ratio: 3:4
- Standard camera photo aspect ratio widely supported
- Many modern and older phones support this ratio by default
- Provides good vertical space for game UI elements

### Minimum Resolution
```
355px × 473px
```

Calculation: 355 × (4/3) = 473.33 ≈ 473px

## Implementation Guidelines

### Safe Area

All critical game elements must fit within the minimum viewport:

```
┌─────────────────────────────────────┐
│           Safe Area (355×473)       │
│  ┌───────────────────────────────┐  │
│  │      Progress Bar / HUD       │  │
│  ├───────────────────────────────┤  │
│  │                               │  │
│  │                               │  │
│  │         Game Grid             │  │
│  │                               │  │
│  │                               │  │
│  ├───────────────────────────────┤  │
│  │      Clue Popup Area          │  │
│  └───────────────────────────────┘  │
│              Logo                   │
└─────────────────────────────────────┘
```

### Grid Sizing

The game grid should be sized to fit within the safe area with appropriate padding:

| Element | Constraint |
|---------|------------|
| Grid max width | 355px - (padding × 2) |
| Grid max height | Dynamic based on available space |
| Tile size | Calculated to fit grid within constraints |

### Responsive Behavior

1. **Lock aspect ratio**: Maintain 3:4 ratio when possible
2. **Scale up gracefully**: On larger screens, center content and scale proportionally
3. **Never crop critical UI**: All interactive elements must be visible at minimum resolution
4. **Touch targets**: Minimum 44×44px for interactive elements (Apple HIG)

### Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Minimum | 355px | Base layout, smallest supported |
| Small | 375px | iPhone SE and similar |
| Medium | 390px | iPhone 14/15 standard |
| Large | 430px+ | iPhone Pro Max, tablets |

### CSS Variables (Recommended)

```css
:root {
  --viewport-min-width: 355px;
  --viewport-min-height: 473px;
  --aspect-ratio: 3 / 4;
  --safe-padding: 10px;
}
```

### Testing Checklist

- [ ] Test at exactly 355×473px
- [ ] Test at 375×500px (iPhone SE)
- [ ] Test at 390×844px (iPhone 14)
- [ ] Test at 430×932px (iPhone 15 Pro Max)
- [ ] Verify all touch targets are at least 44×44px
- [ ] Verify no content is clipped at minimum resolution
- [ ] Verify grid tiles are legible at minimum size

## References

- iPhone SE screen: 375×667px
- Standard photo aspect ratio: 3:4
- Apple Human Interface Guidelines: 44pt minimum touch target
