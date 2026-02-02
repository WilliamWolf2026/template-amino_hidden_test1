# Promise-Wrapped Animation Pattern

## Overview

A clean pattern for wrapping GSAP animations in Promises, allowing async/await usage without callback nesting.

## The Pattern

```typescript
playExitAnimation(): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(this, { alpha: 0, duration: 0.25, ease: 'power2.out' });
    gsap.to(this.scale, {
      x: 0.9,
      y: 0.9,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: resolve,
    });
  });
}
```

## Usage

```typescript
// Await the animation
await button.playExitAnimation();
// Animation complete, safe to proceed

// Or fire-and-forget
button.playExitAnimation();
```

## Benefits

- No callback nesting
- Clean async/await flow
- Easy to chain with other async operations
- Works seamlessly with try/catch error handling

## Used In

- [SpriteButton.playExitAnimation()](../../src/game/citylines/core/SpriteButton.ts)
