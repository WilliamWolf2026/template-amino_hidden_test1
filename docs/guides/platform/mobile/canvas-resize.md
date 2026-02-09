# Canvas Resize with Mobile Toolbars

Resizing Pixi.js and Phaser canvases when mobile toolbars show/hide.

---

## The Problem

When mobile browser toolbars show/hide:
- Viewport height changes
- Canvas may be wrong size
- Game content gets cut off or has empty space
- Touch coordinates may be misaligned

---

## Pixi.js Solution

### Basic Resize Handler

```typescript
function setupPixiResize(app: Application) {
  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Resize renderer
    app.renderer.resize(width, height);

    // Update your game layout
    game.onResize(width, height);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  // Initial size
  resize();

  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
  };
}
```

### With Debouncing

```typescript
function setupPixiResize(app: Application) {
  let resizeTimeout: number;

  function resize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      app.renderer.resize(width, height);
      game.onResize(width, height);
    }, 100);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
    clearTimeout(resizeTimeout);
  };
}
```

### Pixi Init with `resizeTo`

Pixi can auto-resize to a container:

```typescript
const app = new Application();

await app.init({
  resizeTo: window,  // Auto-resize to window
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio, 2),
});
```

**Note:** When using `resizeTo`, dimensions update asynchronously. Wait a frame before reading `app.screen`:

```typescript
app.ticker.addOnce(() => {
  // Now app.screen.width/height are correct
  game.centerOnScreen(app.screen.width, app.screen.height);
});
```

---

## Phaser Solution

### Config with Scale Manager

```javascript
const config = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);
```

### Manual Resize

```javascript
function resizePhaser(game) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Resize container
  const container = document.getElementById('phaser-container');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;

  // Resize game
  game.scale.resize(width, height);
}

window.addEventListener('resize', () => resizePhaser(game));
window.addEventListener('orientationchange', () => resizePhaser(game));
```

### React Integration

```tsx
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current!,
      width: window.innerWidth,
      height: window.innerHeight,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [GameScene],
    };

    gameRef.current = new Phaser.Game(config);

    function handleResize() {
      const game = gameRef.current;
      if (!game) return;

      const height = window.innerHeight;
      containerRef.current!.style.height = `${height}px`;
      game.scale.resize(window.innerWidth, height);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      gameRef.current?.destroy(true);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
```

---

## Container CSS

```css
#game-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;  /* JS will override */
  overflow: hidden;
}

canvas {
  display: block;
  touch-action: none;
}
```

---

## Solid.js + Pixi Integration

```tsx
import { onMount, onCleanup } from 'solid-js';
import { Application } from 'pixi.js';

export function PixiGame() {
  let containerRef: HTMLDivElement;
  let app: Application;

  onMount(async () => {
    app = new Application();

    await app.init({
      resizeTo: containerRef,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2),
    });

    containerRef.appendChild(app.canvas);

    // Handle resize
    function handleResize() {
      containerRef.style.height = `${window.innerHeight}px`;
      // resizeTo handles the rest
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      app.destroy(true);
    });
  });

  return (
    <div
      ref={containerRef!}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}
```

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Canvas too tall | Using `100vh` | Use `window.innerHeight` |
| Touch misaligned | Resolution mismatch | Set `autoDensity: true` |
| Blurry on mobile | Low resolution | Cap at `devicePixelRatio` of 2 |
| Resize flicker | No debounce | Debounce resize events |
| Wrong size on load | Async resize | Wait a frame before centering |

---

## Related

- [Viewport](viewport.md)
- [Performance](../performance.md)
- [Mobile Index](index.md)
