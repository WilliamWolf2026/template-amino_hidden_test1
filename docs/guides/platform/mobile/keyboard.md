# Disabling Keyboard and Text Selection

Prevent virtual keyboard and text selection in mobile games.

---

## The Problem

Unwanted behaviors in games:
- Virtual keyboard appears on tap
- Text gets selected on long press
- Copy/paste menu appears
- Callout menus on images

---

## CSS: Disable Text Selection

```css
#game-container {
  /* Standard */
  user-select: none;

  /* Safari */
  -webkit-user-select: none;

  /* Firefox */
  -moz-user-select: none;

  /* IE/Edge */
  -ms-user-select: none;

  /* Disable callout menu on long press (iOS) */
  -webkit-touch-callout: none;
}
```

---

## Prevent Keyboard Activation

### Avoid Focusable Elements

The keyboard appears when focusable elements receive focus:
- `<input>`
- `<textarea>`
- `<select>`
- Elements with `contenteditable`

**Solution:** Don't put these inside your game container.

### Block Focus Programmatically

If inputs exist elsewhere on page:

```javascript
// Blur any focused element when game starts
document.activeElement?.blur();

// Prevent focus on inputs while game is active
document.querySelectorAll('input, textarea, select').forEach(el => {
  el.addEventListener('focus', (e) => {
    if (gameIsActive) {
      e.preventDefault();
      el.blur();
    }
  });
});
```

### CSS Approach

```css
/* While game is active */
.game-active input,
.game-active textarea,
.game-active select {
  pointer-events: none;
}
```

---

## Prevent Context Menu

Block right-click and long-press menus:

```javascript
const container = document.getElementById('game-container');

// Desktop right-click
container.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Prevent drag selection
container.addEventListener('mousedown', (e) => {
  e.preventDefault();
});
```

---

## Prevent Long Press Actions

Long press can trigger:
- Text selection
- Context menu
- Image save dialog

```javascript
const container = document.getElementById('game-container');

// Block long press selection
container.addEventListener('touchstart', (e) => {
  e.preventDefault();
}, { passive: false });

// Block context menu from long press
container.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});
```

---

## Complete Solution

```css
#game-container {
  /* Disable selection */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  /* Disable callout */
  -webkit-touch-callout: none;

  /* Disable tap highlight */
  -webkit-tap-highlight-color: transparent;

  /* Block gestures */
  touch-action: none;
}

/* Prevent image drag */
#game-container img {
  -webkit-user-drag: none;
  user-drag: none;
  pointer-events: none;
}
```

```javascript
const container = document.getElementById('game-container');

// Block context menu
container.addEventListener('contextmenu', e => e.preventDefault());

// Block selection via mouse
container.addEventListener('mousedown', e => e.preventDefault());

// Block selection via touch (be careful - may affect game input)
container.addEventListener('selectstart', e => e.preventDefault());
```

---

## Canvas-Specific

For Pixi.js canvas:

```javascript
// The canvas element
const canvas = app.canvas;

canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.touchAction = 'none';

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', e => e.preventDefault());
```

---

## When You DO Need Text Input

If your game has a name entry or chat:

1. Use a **separate overlay** outside the game container
2. Show/hide it programmatically
3. Don't block events on that overlay

```html
<div id="game-container">
  <!-- Game canvas here - blocked -->
</div>

<div id="input-overlay" style="display: none;">
  <input type="text" id="player-name" />
</div>
```

```javascript
function showNameInput() {
  document.getElementById('input-overlay').style.display = 'block';
  document.getElementById('player-name').focus();
}

function hideNameInput() {
  document.getElementById('player-name').blur();
  document.getElementById('input-overlay').style.display = 'none';
}
```

---

## Related

- [Gestures](gestures.md)
- [Mobile Index](index.md)
