# Disabling Pull-to-Refresh

Prevent browser refresh gesture on Android and iOS.

---

## The Problem

Pull-to-refresh (PTR) triggers when:
- User is at top of page (`scrollTop === 0`)
- User drags downward

This interrupts gameplay and refreshes the page.

---

## Solution Overview

| Platform | CSS Solution | JS Needed? |
|----------|--------------|------------|
| Android Chrome | `overscroll-behavior: contain` | Optional |
| iOS Safari | Partial support | Yes |

---

## CSS Implementation

### Android (Primary Fix)

```css
html, body {
  overscroll-behavior-y: contain;
  overflow: hidden;
  height: 100%;
  margin: 0;
}
```

### Scrollable Container Pattern

Isolate scrolling to a container, not the body:

```css
html, body {
  overflow: hidden;
  height: 100%;
}

.scroll-container {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

---

## JavaScript Implementation

For iOS and as Android backup:

```javascript
let touchStartY = 0;
const container = document.querySelector('.scroll-container');

document.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const scrollTop = container?.scrollTop ?? 0;
  const touchY = e.touches[0].clientY;

  // Block pull-down at top of scroll
  if (scrollTop === 0 && touchY > touchStartY) {
    e.preventDefault();
  }
}, { passive: false });
```

**Key points:**
- `passive: false` required for `preventDefault()`
- Only blocks when at top AND pulling down
- Normal scrolling still works

---

## Edge Cases

### Momentum Scroll

Fast upward scroll that reaches top may trigger PTR before JS can block. The JS solution works best for deliberate pulls.

### Multi-Touch

Track only single-finger gestures:

```javascript
document.addEventListener('touchmove', (e) => {
  if (e.touches.length !== 1) return; // Ignore multi-touch

  const scrollTop = container?.scrollTop ?? 0;
  const touchY = e.touches[0].clientY;

  if (scrollTop === 0 && touchY > touchStartY) {
    e.preventDefault();
  }
}, { passive: false });
```

---

## For Games (No Scroll Needed)

If your game doesn't need scrolling at all:

```css
html, body {
  position: fixed;
  overflow: hidden;
  width: 100%;
  height: 100%;
  overscroll-behavior: none;
}

#game-container {
  touch-action: none;
}
```

```javascript
// Block all default touch behavior on game
const game = document.getElementById('game-container');
game.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
```

---

## Testing

1. Load game on Android Chrome
2. Scroll to top (if scrollable)
3. Pull down firmly
4. Should NOT trigger refresh spinner

Repeat on iOS Safari.

---

## Related

- [Gestures](gestures.md)
- [Mobile Index](index.md)
