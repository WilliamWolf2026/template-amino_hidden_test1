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
// src/game/mygame/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore, calculateBonus } from '../scoring';

describe('calculateScore', () => {
  it('scores points per completed objective', () => {
    const objectives = [
      { id: 'obj-1', completed: true },
      { id: 'obj-2', completed: true },
    ];
    expect(calculateScore(objectives)).toBe(200);
  });

  it('applies move penalty', () => {
    const objectives = [{ id: 'obj-1', completed: true }];
    expect(calculateScore(objectives, { moves: 10, par: 5 })).toBe(50);
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
  it('plays random variation for game action', () => {
    const mockLoader = {
      play: vi.fn(),
    };

    const manager = new GameAudioManager(mockLoader);
    manager.playAction();

    expect(mockLoader.play).toHaveBeenCalledWith(
      'sfx-mygame',
      expect.stringMatching(/action_\d/),
      expect.any(Object)
    );
  });
});
```

---

## E2E Tests (Playwright)

All Playwright tests live in `evaluation/tests/` with a single config at `evaluation/playwright.config.ts`. Tests are tagged with `@smoke`, `@unload-bundles`, etc. for selective execution.

### Setup

```bash
bun add -d @playwright/test
bunx playwright install
```

### Test Structure

Tests are organized by modification suite (see `evaluation/modification-suites.ts`):

| Suite | Tag | What it tests |
|-------|-----|---------------|
| Smoke | `@smoke` | App loads, root visible, no console errors |
| Unload Bundles | `@unload-bundles` | Reload cycles, memory behavior, bundle unloading |

### Running E2E Tests

```bash
# Run all tests
bunx playwright test --config evaluation/playwright.config.ts

# Run specific suite
bunx playwright test --config evaluation/playwright.config.ts --grep "@smoke"

# See browser
bunx playwright test --config evaluation/playwright.config.ts --headed

# View HTML report
bunx playwright show-report evaluation/playwright-report
```

### Evaluation Harness (before/after comparison)

The evaluation system runs the same Playwright tests before and after a scaffold change, then compares results:

```bash
# Run before modification
bun run evaluate -- --game mygame --modification smoke --phase before

# Apply scaffold change, then run after
bun run evaluate -- --game mygame --modification smoke --phase after

# Compare and generate report
bun run evaluate:report -- --game mygame --modification smoke
```

See `evaluation/README.md` for full details.

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
      - run: bunx playwright install --with-deps
      - run: bun run build
      - run: bunx playwright test --config evaluation/playwright.config.ts
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: evaluation/playwright-report/
```

---

## Related

- [Debugging](../development/debugging.md)
- [Performance](../platform/performance.md)
- [Troubleshooting](../troubleshooting.md)
