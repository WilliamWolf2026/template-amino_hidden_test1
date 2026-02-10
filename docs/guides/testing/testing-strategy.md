# Testing Strategy

Unit tests, E2E tests, and manual QA for games.

---

## Testing Pyramid

```
         ┌───────────┐
         │  Manual   │  Few, exploratory
         │   QA      │
         ├───────────┤
         │   E2E     │  Critical paths
         │ (Browser) │
         ├───────────┤
         │Integration│  Component interactions
         ├───────────┤
         │   Unit    │  Many, fast
         └───────────┘
```

---

## Unit Tests

### What to Unit Test

| Test | Don't Test |
|------|------------|
| Game logic (scoring, win conditions) | Pixi rendering |
| State calculations | Animation timing |
| Utility functions | Third-party libraries |
| Data transformations | DOM structure |

### Example: Game Logic

```typescript
// src/game/citylines/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore, calculateBonus } from '../scoring';

describe('calculateScore', () => {
  it('scores 100 per connected path', () => {
    const paths = [
      { start: 'A', end: 'B' },
      { start: 'C', end: 'D' },
    ];
    expect(calculateScore(paths)).toBe(200);
  });

  it('applies move penalty', () => {
    const paths = [{ start: 'A', end: 'B' }];
    expect(calculateScore(paths, { moves: 10, par: 5 })).toBe(50);
  });
});

describe('calculateBonus', () => {
  it('awards time bonus under par', () => {
    expect(calculateBonus({ time: 30, parTime: 60 })).toBe(300);
  });

  it('no bonus over par time', () => {
    expect(calculateBonus({ time: 90, parTime: 60 })).toBe(0);
  });
});
```

### Running Unit Tests

```bash
bun run test        # Run all tests
bun run test:watch  # Watch mode
bun run test:ui     # Vitest UI
```

---

## Integration Tests

Test component interactions without full browser.

```typescript
// src/game/__tests__/GameAudioManager.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GameAudioManager } from '../audio/manager';

describe('GameAudioManager', () => {
  it('plays random variation for tile rotate', () => {
    const mockLoader = {
      play: vi.fn(),
    };

    const manager = new GameAudioManager(mockLoader);
    manager.playTileRotate();

    expect(mockLoader.play).toHaveBeenCalledWith(
      'sfx-citylines',
      expect.stringMatching(/tile_rotate_\d/),
      expect.any(Object)
    );
  });
});
```

---

## E2E Tests (Playwright)

### Setup

```bash
bun add -d @playwright/test
npx playwright install
```

### Critical Path Tests

```typescript
// e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete level flow', async ({ page }) => {
  await page.goto('/');

  // Wait for loading
  await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10000 });

  // Start game
  await page.click('button:has-text("Play")');

  // Wait for game canvas
  await expect(page.locator('canvas')).toBeVisible();

  // Game should be interactive (canvas receives events)
  const canvas = page.locator('canvas');
  await canvas.click({ position: { x: 200, y: 200 } });

  // Check game responds (HUD updates, etc.)
  await expect(page.locator('.moves-counter')).toContainText('1');
});

test('audio unlocks on interaction', async ({ page }) => {
  await page.goto('/');

  // Audio context should start suspended
  const audioState = await page.evaluate(() => {
    return (window as any).Howler?.ctx?.state;
  });
  expect(audioState).toBe('suspended');

  // Click start
  await page.click('button:has-text("Play")');

  // Audio should now be running
  const audioStateAfter = await page.evaluate(() => {
    return (window as any).Howler?.ctx?.state;
  });
  expect(audioStateAfter).toBe('running');
});
```

### Visual Regression

```typescript
test('game screen matches snapshot', async ({ page }) => {
  await page.goto('/?level=test');
  await page.waitForLoadState('networkidle');

  // Wait for animations to settle
  await page.waitForTimeout(1000);

  await expect(page).toHaveScreenshot('game-screen.png', {
    maxDiffPixels: 100,
  });
});
```

### Running E2E Tests

```bash
npx playwright test              # Run all
npx playwright test --headed     # See browser
npx playwright test --ui         # Interactive mode
npx playwright show-report       # View results
```

---

## Manual QA Checklist

### Before Release

**Gameplay:**
- [ ] All levels completable
- [ ] Win/lose conditions work
- [ ] Score calculates correctly
- [ ] No way to get stuck

**Audio:**
- [ ] Music plays/stops with toggle
- [ ] SFX play at right moments
- [ ] Audio unlocks on mobile
- [ ] No audio glitches/pops

**Visual:**
- [ ] All assets load
- [ ] Animations smooth
- [ ] No visual glitches
- [ ] Text readable at all sizes

**Performance:**
- [ ] 60fps on target devices
- [ ] No memory leaks (play 10 levels)
- [ ] Fast load time (<3s)

**Platform:**
- [ ] Works on Chrome, Safari, Firefox
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Handles orientation change
- [ ] Notch/safe areas respected

---

## Test Fixtures

### Level Fixtures

Create test levels for specific scenarios:

```json
// public/levels/test-win.json
{
  "id": "test-win",
  "grid": [[...]],
  "description": "Level that can be won in 1 move"
}
```

```json
// public/levels/test-complex.json
{
  "id": "test-complex",
  "grid": [[...]],
  "description": "Stress test with many tiles"
}
```

### URL Parameters

```typescript
// Support test-specific URLs
const params = new URLSearchParams(location.search);
const testLevel = params.get('level');
const skipIntro = params.get('skip') === 'true';
```

---

## CI Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: npx playwright install --with-deps
      - run: bun run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Related

- [Debugging](../development/debugging.md)
- [Performance](../platform/performance.md)
- [Troubleshooting](../troubleshooting.md)
