# Dynamic Viewport Height

Handling mobile browser toolbars that show/hide dynamically.

---

## The Problem

On mobile browsers (iOS Safari, Android Chrome), toolbars dynamically show and hide:

- When toolbar is **visible**, viewport is smaller
- When toolbar **hides** on scroll, viewport height increases
- `100vh` is **unreliable** - it doesn't update with toolbar changes

This causes:
- Content hidden behind toolbar
- Layout jumps when toolbar shows/hides
- Game canvas misaligned

---

## Solution: Dynamic Viewport Height

### JavaScript + CSS Variable

```javascript
function setDynamicHeight() {
  const vh = window.innerHeight;
  document.documentElement.style.setProperty('--dynamic-vh', `${vh}px`);
}

// Initial call
setDynamicHeight();

// Update on resize or orientation change
window.addEventListener('resize', setDynamicHeight);
window.addEventListener('orientationchange', setDynamicHeight);
```

```css
.game-container {
  height: var(--dynamic-vh);
  width: 100%;
  overflow: hidden;
}
```

### Why This Works

- `window.innerHeight` returns **actual visible height**
- Updates when toolbar shows/hides
- CSS variable makes it available to all elements

---

## CSS-Only Alternative

Modern browsers support dynamic viewport units:

```css
.game-container {
  height: 100vh;   /* Fallback for old browsers */
  height: 100dvh; /* Dynamic viewport height */
}
```

| Unit | Meaning |
|------|---------|
| `100vh` | Static viewport (includes hidden toolbar) |
| `100dvh` | Dynamic viewport (actual visible area) |
| `100svh` | Small viewport (toolbar visible) |
| `100lvh` | Large viewport (toolbar hidden) |

**Note:** `100dvh` is well-supported but JS solution is more reliable.

---

## Best Practices

### Layer Declarations for Fallback

```css
.game-container {
  height: 100vh;  /* Fallback */
  height: 100dvh; /* Modern browsers use this */
}
```

### Debounce Resize Events

```javascript
let resizeTimeout;

function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    setDynamicHeight();
  }, 100);
}

window.addEventListener('resize', handleResize);
```

### Include Safe Areas

```css
.game-container {
  height: var(--dynamic-vh);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## Events to Listen For

| Event | When Fired |
|-------|------------|
| `resize` | Viewport size changes |
| `orientationchange` | Device rotated |
| `scroll` | Optional - for real-time adjustments |

---

## Complete Example

```typescript
// src/utils/viewport.ts

export function setupDynamicViewport() {
  function update() {
    const vh = window.innerHeight;
    document.documentElement.style.setProperty('--dynamic-vh', `${vh}px`);
  }

  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);

  return () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('orientationchange', update);
  };
}
```

```css
/* styles.css */
:root {
  --dynamic-vh: 100vh; /* Fallback before JS runs */
}

.game-container {
  height: var(--dynamic-vh);
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
}
```

---

## Related

- [Canvas Resize](canvas-resize.md)
- [Mobile Index](index.md)
