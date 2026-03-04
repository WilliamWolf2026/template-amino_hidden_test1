# SFX Descriptions Guide

This guide teaches how to audit a codebase and create `sfx-descriptions.json` - a style/description manifest for audio sprite generation.

## Workflow

```
Audit Codebase → Generate Manifest → Audio Sprite Generator → Implement
```

## Output

The audio spec is a JSON file at `docs/audio/audio-spec.json` that describes what sounds to create:

- **Purpose**: Style/description brief for audio generation tools
- **Not**: The actual audio sprite manifest (those are `sfx-game.json`, `sfx-ui.json` in `public/assets/audio/`)

Format:

```json
{
  "sound_name": "Description including: [1] Sound characteristics, [2] Emotional tone, [3] Duration, [4] Trigger context."
}
```

---

## Audit Checklist

Search the codebase for sound opportunities. The following are **primary indicators** - clear signals that a sound effect belongs at that location:

### Primary Indicators

These patterns reliably indicate sound effect opportunities:

**1. GSAP Tweens** - Animation start/end points
```bash
grep -r "gsap\." src/ --include="*.ts"
grep -r "gsap\.to\|gsap\.from" src/ --include="*.ts"
```
Look for: `onComplete`, `onStart` callbacks, animation beginnings

**2. Events** - Game state changes
```bash
grep -r "emitEvent\|onGameEvent" src/ --include="*.ts"
grep -r "\.emit(" src/ --include="*.ts"
```
Look for: level complete, item collected, error feedback

**3. Screen Transitions** - Navigation and visibility changes
```bash
grep -r "setScreen\|navigate" src/ --include="*.tsx"
grep -r "visible\s*=" src/ --include="*.ts"
```
Look for: screen changes, modal open/close, overlay show/hide

---

### Secondary Indicators

Additional patterns to check:

**User Interactions**
- Button clicks (`onClick`, `<Button>` components)
- Tap/click on game objects (tiles, cards, items)
- Drag start/end, swipe gestures

```bash
grep -r "onClick" src/ --include="*.tsx"
grep -r "onTap\|onPointerDown" src/ --include="*.ts"
```

**Character Actions**
- Companion reactions
- NPC interactions
- Player avatar feedback

---

## Manifest Format

Each entry describes a sound for the audio generator:

```json
{
  "button_click": "Clean, simple click sound - crisp and responsive UI feedback. Short transient with no reverb tail. Similar to modern iOS/Android material design clicks. Triggered by generic button clicks throughout the UI.",

  "level_complete": "Triumphant fanfare/jingle celebrating victory. 3-part structure: intro hit, ascending melody, resolution. Uplifting and celebratory. Duration: 1-2 seconds. Triggered when all objectives are completed.",

  "tile_rotate_1": "Satisfying mechanical click/snap sound suggesting rotation. Punchy and tactile, like a puzzle piece turning. Variation 1 of 8. Duration: 0.2s. Triggered when user taps a tile to rotate it."
}
```

### Description Components

1. **Sound characteristics** - punchy, soft, melodic, mechanical, etc.
2. **Emotional tone** - celebratory, urgent, calm, satisfying, etc.
3. **Duration** - 0.2s, 1-2 seconds, loopable, etc.
4. **Trigger context** - when/where the sound plays
5. **Reference sounds** (optional) - "like Mario coin" or "similar to iOS click"
6. **Variations** (if needed) - "Variation 1 of 8"

---

## Music Tracks

Background music has different considerations:

```json
{
  "music_track_1": "Upbeat jazzy background music. Smooth jazz meets puzzle game vibe - light piano, soft brushed drums, walking bass. Cheerful and non-intrusive. Loopable with clean loop points. Duration: 60-90 seconds.",

  "music_track_2": "Mid-tempo jazz with slight urgency. Different instrumentation - saxophone or vibraphone. Maintains puzzle-friendly energy. Loopable. Duration: 60-90 seconds."
}
```

### Music Considerations
- Match game theme/setting
- Consider pacing (faster for action, slower for contemplation)
- Non-intrusive - shouldn't compete with SFX
- Multiple tracks to rotate and prevent listener fatigue
- Clean loop points for seamless looping
- Duration: typically 60-90 seconds per track

---

## GDD Integration

Reference the game's GDD (`docs/game/gdd.md`) for:
- Audio style guidelines
- Required asset list
- Variation requirements (e.g., "5-10 tile rotation variations")
- Theme/mood direction

---

## Running an Audit

1. Search for interaction patterns (onClick, onTap, etc.)
2. Search for game events (emit, event handlers)
3. Search for animations (gsap, transitions)
4. Search for screen/component transitions
5. Cross-reference with GDD asset list
6. Document findings in manifest format

---

## File Locations

| File | Purpose |
|------|---------|
| `src/game/docs/sound-effects-guide.md` | This guide |
| `docs/audio/audio-spec.json` | Style/description brief for audio generation |
| `public/assets/audio/sfx-game.json` | Actual audio sprite manifest (game sounds) |
| `public/assets/audio/sfx-ui.json` | Actual audio sprite manifest (UI sounds) |
| `src/game/audio/manager.ts` | GameAudioManager with play methods |
| `src/game/audio/sounds.ts` | Sound definitions |
| `src/game/screens/GameScreen.tsx` | Event wiring |

---

## Verification

After generating a manifest:
- Compare to existing implementation
- Ensure all GDD-specified sounds are included
- Check for missing opportunities (animations without sounds)
- Verify trigger contexts are accurate
