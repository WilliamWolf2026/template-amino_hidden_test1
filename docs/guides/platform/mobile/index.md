# Mobile Development

Comprehensive guide for mobile web games on iOS and Android.

---

## Quick Reference

| Topic | Guide | Key Technique |
|-------|-------|---------------|
| Viewport height | [viewport.md](viewport.md) | `--dynamic-vh` CSS variable |
| Pull-to-refresh | [pull-to-refresh.md](pull-to-refresh.md) | `overscroll-behavior: contain` |
| Browser gestures | [gestures.md](gestures.md) | `touch-action: none` |
| Keyboard/selection | [keyboard.md](keyboard.md) | `user-select: none` |
| Canvas resize | [canvas-resize.md](canvas-resize.md) | Pixi/Phaser resize handlers |

---

## Essential Setup

### Viewport Meta Tag

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
>
```

### Base CSS

```css
html, body {
  position: fixed;
  overflow: hidden;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overscroll-behavior: none;
}

#game-container {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
```

### Audio Unlock

```typescript
// Must call on first user interaction
function handleFirstTap() {
  unlockAudio();  // From useAssets()
}
```

---

## Platform Differences

| Feature | iOS Safari | Android Chrome |
|---------|------------|----------------|
| `overscroll-behavior` | Partial support | Full support |
| `100dvh` | Supported | Supported |
| Audio unlock | Required | Required |
| Safe areas | Notch + home indicator | Varies by device |
| Pull-to-refresh | Needs JS workaround | CSS works |

---

## Safe Areas

```css
.game-ui {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## Testing Checklist

- [ ] Audio plays after first tap
- [ ] No pull-to-refresh triggers
- [ ] No accidental zoom
- [ ] No text selection in game
- [ ] Keyboard doesn't appear
- [ ] Game fits viewport (no scroll)
- [ ] Works in both orientations
- [ ] Safe areas respected
- [ ] Toolbar show/hide handled

---

## Related

- [Performance](../performance.md)
- [Audio Setup](../../assets/audio-setup.md)
- [Troubleshooting](../../troubleshooting.md)
