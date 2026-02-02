# Start Screen: GDD vs Implementation Comparison Report

## Summary

This report compares the Game Design Document (GDD) specifications for the Start Screen against the current implementation in `StartScreen.tsx`.

---

## GDD Specifications

### Start Screen (GDD lines 29-38)
> - Authority figure (in-game companion character)
> - Current chapter info (e.g., "Atlantic County")
> - Some info on the task & goal
> - "Start" button

### Character Interaction - Title Screen (GDD lines 105-107)
> - The character is visible on title screen **illustrated (different than in-game assets)**

### Character Interaction - Introduction Screen (GDD lines 109-113)
> - The character slides in from right of the screen
> - Character doesn't animate
> - Character talks through **dialogue boxes**

---

## Current Implementation Analysis

### What's Implemented ✓

| Element | GDD Requirement | Implementation |
|---------|-----------------|----------------|
| Companion Character | Authority figure visible | ✓ News Hound character displayed |
| Chapter Info | Current chapter info | ✓ County name badge (e.g., "Atlantic County") |
| Task/Goal Info | Some info on task & goal | ✓ Goal text panel with instructions |
| Start Button | "Start" button | ✓ SpriteButton with START/CONTINUE label |
| New vs Returning | Different content | ✓ Detects first-time vs returning players |

### What's Missing or Different ✗

| GDD Requirement | Current State | Gap |
|-----------------|---------------|-----|
| **Illustrated character** (different than in-game) | Uses same `Character` class as gameplay | Character should have special "title screen" art |
| **Dialogue boxes** for character speech | Static flavor text ("Let's connect some roads!") | No dialogue box UI component |
| **Slide-in animation** (first time players) | Character appears instantly | No entry animation on first visit |
| **Separate Title/Intro screens** | Combined into single StartScreen | GDD implies two distinct screens |

---

## Detailed Findings

### 1. Character Art Discrepancy

**GDD says:** "The character is visible on title screen illustrated (different than in game assets)"

**Current:** Uses `Character` class with `news_hound` sprite - same assets used during gameplay.

**Impact:** Medium - The character should have a special illustrated version for the title/start screen to create visual distinction.

### 2. Missing Dialogue Box System

**GDD says:** "Character talks through dialogue boxes"

**Current:** Flavor text is displayed as a standalone `Text` element with styling:
```tsx
flavorText = new Text({
  text: "Let's connect some roads!",
  style: FLAVOR_TEXT_STYLE,
});
```

**Impact:** High - The companion's personality and guidance comes through dialogue boxes. This is a core UX element that helps establish the character's role as a guide.

### 3. Missing Slide-In Animation

**GDD says:** "The character slides in from right of the screen" (for introduction screen)

**Current:** Character is positioned statically on mount with no animation.

**Impact:** Medium - Animation adds polish and makes the introduction feel more engaging, especially for first-time players.

### 4. Combined Screens

**GDD implies separate screens:**
- Title Screen (character visible, illustrated)
- Introduction Screen (after title, first time playing - character slides in with dialogue)

**Current:** Single `StartScreen` component handles both cases, differentiating only via `screenConfig.mode` (new vs returning).

**Impact:** Low - The combined approach is functional, but loses the sequential reveal experience the GDD describes.

---

## Current UI Elements Layout

```
┌─────────────────────────────────────┐
│           [Title Sprite]             │
│                                      │
│      ┌──────────────────────┐        │
│      │   Atlantic County    │        │  ← County Badge
│      └──────────────────────┘        │
│                                      │
│   ┌─────────────────────────────┐    │
│   │ Connect landmarks to        │    │  ← Goal Panel
│   │ highways by rotating...     │    │
│   └─────────────────────────────┘    │
│                                      │
│         [News Hound Character]       │  ← Static character
│                                      │
│      "Let's connect some roads!"     │  ← Static flavor text (should be dialogue)
│                                      │
│           ┌───────────┐              │
│           │   START   │              │
│           └───────────┘              │
│                                      │
│            [Wolf Logo]               │
└─────────────────────────────────────┘
```

---

## Recommendations

### Priority 1: Add Dialogue Box Component
- Create a `DialogueBox` UI component for the start screen (or reuse existing `DialogueBox` from `citylines/`)
- Position it near the character
- Display the flavor text inside the dialogue box

### Priority 2: Add Character Entry Animation
- For first-time players (`screenConfig.mode === 'new'`):
  - Start character off-screen right
  - Slide in after title appears
  - Show dialogue box after slide completes

### Priority 3: Illustrated Character Asset
- Create separate "illustrated" character art for title/start screen
- Could be a different pose, more detailed, or stylized differently
- Use different sprite from in-game character

### Priority 4: Consider Screen Separation (Optional)
- Could split into `TitleScreen` → `IntroScreen` → `GameScreen`
- First-time players see both screens in sequence
- Returning players skip to IntroScreen or directly to GameScreen

---

## Files Referenced

- **GDD:** [docs/game/gdd.md](docs/game/gdd.md)
- **Start Screen:** [src/game/screens/StartScreen.tsx](src/game/screens/StartScreen.tsx)
- **Character Class:** [src/game/citylines/core/Character.ts](src/game/citylines/core/Character.ts)
- **DialogueBox (exists for gameplay):** [src/game/citylines/ui/DialogueBox.ts](src/game/citylines/ui/DialogueBox.ts)

---

## Conclusion

The current StartScreen has all the essential elements but lacks the polish and character interaction specified in the GDD. The most impactful missing feature is the **dialogue box system** for the companion character, which would bring the News Hound to life as a guide rather than just a static image. The slide-in animation for first-time players would also significantly improve the onboarding experience.
