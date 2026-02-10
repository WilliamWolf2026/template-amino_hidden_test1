# Disabling Browser Gestures

Prevent pinch-zoom, swipe navigation, and other browser gestures in games.

---

## The Problem

Browser gestures that interfere with games:
- **Pinch-to-zoom** - Breaks touch coordinates
- **Swipe navigation** - Goes back/forward in history
- **Double-tap zoom** - Unexpected zoom
- **Long press** - Context menu appears

---

## CSS: `touch-action`

The primary solution - tells browser which gestures to handle:

```css
#game-container {
  touch-action: none;        /* Block ALL gestures */
  -ms-touch-action: none;    /* IE/Edge legacy */
}
```

### Options

| Value | Effect |
|-------|--------|
| `none` | Block all gestures (scroll, zoom, swipe) |
| `manipulation` | Allow scroll and tap, block zoom |
| `pan-x` | Allow horizontal scroll only |
| `pan-y` | Allow vertical scroll only |
| `pinch-zoom` | Allow only pinch zoom |

For games, use `none` on the game container.

---

## JavaScript: Event Prevention

Backup for browsers with partial `touch-action` support:

```javascript
const container = document.getElementById('game-container');

// Prevent scroll/swipe
container.addEventListener('touchstart', (e) => {
  e.preventDefault();
}, { passive: false });

container.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

// Prevent pinch zoom on iOS Safari
container.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

container.addEventListener('gesturechange', (e) => {
  e.preventDefault();
});
```

**Important:** Use `{ passive: false }` when calling `preventDefault()`.

---

## Viewport Meta Tag

Prevent zoom at the page level:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
>
```

**Note:** This affects accessibility. Only use for games.

---

## Prevent Double-Tap Zoom

```css
#game-container {
  touch-action: manipulation;  /* Or 'none' */
}
```

Or with JS:

```javascript
let lastTap = 0;

container.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTap < 300) {
    e.preventDefault();
  }
  lastTap = now;
}, { passive: false });
```

---

## Complete Game Setup

```css
#game-container {
  /* Block all browser gestures */
  touch-action: none;
  -ms-touch-action: none;

  /* Prevent text selection */
  user-select: none;
  -webkit-user-select: none;

  /* Prevent callout menu */
  -webkit-touch-callout: none;
}
```

```javascript
const container = document.getElementById('game-container');

// Block all default touch behavior
['touchstart', 'touchmove', 'touchend'].forEach(event => {
  container.addEventListener(event, (e) => {
    // Let your game handle touches instead
    e.preventDefault();
  }, { passive: false });
});

// Block iOS gesture events
['gesturestart', 'gesturechange', 'gestureend'].forEach(event => {
  container.addEventListener(event, (e) => {
    e.preventDefault();
  });
});
```

---

## Handling Game Touches

After blocking browser gestures, handle touches in your game:

```javascript
container.addEventListener('touchstart', (e) => {
  e.preventDefault();

  const touch = e.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;

  // Pass to your game
  game.onTouchStart(x, y);
}, { passive: false });
```

---

## Best Practices

1. **Only target game container** - Don't block gestures on entire page
2. **Combine CSS + JS** - CSS is primary, JS is backup
3. **Test on real devices** - Simulators don't catch everything
4. **Consider accessibility** - Zoom is important for some users

---

## Related

- [Pull-to-Refresh](pull-to-refresh.md)
- [Keyboard](keyboard.md)
- [Mobile Index](index.md)
