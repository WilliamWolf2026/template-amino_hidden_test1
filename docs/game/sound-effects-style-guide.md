# Sound Effects Style Guide — Daily Dispatch

Reference for audio production. Each sound includes an ElevenLabs v2 prompt ready for generation.

## Style

Cartoon mobile puzzle game. Sounds should be bright, bouncy, playful, and satisfying. Think casual mobile game — not realistic, not retro 8-bit. Fun and friendly.

---

## Sound Effects

### Block Slide (swipe)

- **Trigger**: Player swipes a block across the grid
- **Variations**: 5
- **Duration**: 0.5s
- **Prompt Influence**: High

| Variation | Prompt |
|-----------|--------|
| 1 | `Cute cartoon sliding sound, playful whoosh with a squeaky glide, mobile puzzle game sound effect, bright and bouncy` |
| 2 | `Short cartoon slide, bubbly swoosh with a light pop at the end, casual mobile game SFX, fun and snappy` |
| 3 | `Playful cartoon scoot sound, quick rubbery slide with a cheerful tone, puzzle game sound effect, bright` |
| 4 | `Cute zippy slide, cartoon object scooting across a surface, mobile game SFX, light and satisfying` |
| 5 | `Bouncy cartoon whoosh, short playful sliding sound with a soft spring, casual puzzle game sound effect` |

### Block Hit Edge (blocked move)

- **Trigger**: Block hits grid edge or another block
- **Variations**: 3
- **Duration**: 0.5s
- **Prompt Influence**: High

| Variation | Prompt |
|-----------|--------|
| 1 | `Soft cartoon bonk, gentle rubbery bump, cute mobile game impact sound, not harsh, playful thud` |
| 2 | `Light cartoon boop, soft bouncy collision, casual puzzle game bump sound, friendly and muted` |
| 3 | `Cute muffled thunk, cartoon object gently hitting a wall, mobile game SFX, soft and playful` |

### Truck Door Close

- **Trigger**: Chapter-end animation when truck is loaded
- **Variations**: 1
- **Duration**: 1.0s
- **Prompt Influence**: High

```
Cartoon metal clang, comical truck door shutting with a satisfying slam
and funny wobble, animated style sound effect
```

### Truck Driving Away

- **Trigger**: After truck door closes, truck departs
- **Variations**: 1
- **Duration**: 3.0s
- **Prompt Influence**: High

```
Cartoon truck driving away, playful engine revving and tooting horn
fading into distance, animated kids show style, fun and whimsical
```

### Block Exit (dock)

- **Trigger**: Block slides out through a matching dock exit
- **Variations**: 1
- **Duration**: 1.0s
- **Prompt Influence**: High

```
Cheerful cartoon pop with a sparkle chime, satisfying slot-into-place sound,
mobile puzzle game reward SFX, bright and happy
```

### Level Complete

- **Trigger**: All blocks have exited through their docks
- **Variations**: 1
- **Duration**: 1.5s
- **Prompt Influence**: High

```
Upbeat cartoon victory jingle, short celebratory fanfare with xylophone
and chimes, mobile puzzle game level complete, cheerful and rewarding
```

### Chapter Complete

- **Trigger**: Final level of a chapter completed
- **Variations**: 1
- **Duration**: 2.0s
- **Prompt Influence**: High

```
Big cartoon celebration fanfare, triumphant trumpet and confetti burst
with sparkle sounds, mobile game milestone achievement jingle,
exciting and joyful
```

### Eraser Use

- **Trigger**: Player uses eraser booster to remove a block
- **Variations**: 1
- **Duration**: 0.5s
- **Prompt Influence**: High

```
Cartoon poof vanish sound, quick magical disappearing whoosh with sparkle,
mobile game power-up SFX, light and fun
```

### Button Click (UI)

- **Trigger**: Any UI button press
- **Variations**: 1
- **Duration**: 0.5s
- **Prompt Influence**: High

```
Cute cartoon tap, bright bubbly click sound, mobile game UI button press,
clean and playful pop
```

---

## Generation Settings

| Setting | Value |
|---------|-------|
| **Prompt Influence** | High (literal interpretation) |
| **Output Format** | MP3 or WAV |
| **Min Duration** | 0.5s (ElevenLabs minimum for reliable output) |

## Post-Processing

- Trim silence from head/tail
- Normalize peaks to -3dB
- For variations, generate 2-3x what you need and pick the best
- Pack final files into audio sprites using `audiosprite` tool (see [audio-setup.md](../guides/assets/audio-setup.md))

## File Naming

```
dd_block_slide_01.wav
dd_block_slide_02.wav
dd_block_hit_edge_01.wav
dd_truck_door_close.wav
dd_truck_drive_away.wav
dd_block_exit.wav
dd_level_complete.wav
dd_chapter_complete.wav
dd_eraser.wav
dd_button_click.wav
```
