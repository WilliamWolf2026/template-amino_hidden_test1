# Audio System

The scaffold's audio system provides engine-agnostic audio management using Howler.js.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    AudioLoader                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Channel   │  │   Channel   │  │   Channel   │ │
│  │  (sfx.json) │  │ (music.json)│  │  (ui.json)  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│         │                │                │         │
│         └────────────────┼────────────────┘         │
│                          ▼                          │
│                    Howler.js                        │
└─────────────────────────────────────────────────────┘
```

## Core Components

### AudioLoader

The main interface for audio playback:

```typescript
import type { AudioLoader } from '~/scaffold/systems/assets/loaders/audio';

// Access via coordinator
const audioLoader = coordinator.audio;

// Play a sound effect
audioLoader.play('sfx-citylines', 'button_click', { volume: 0.7 });

// Play music with fade
audioLoader.playMusic('sfx-citylines', 'music_track_1', {
  fadeIn: 1000,
  volume: 0.6,
});

// Stop music with fade
audioLoader.stopMusic(500);

// Set master volume
audioLoader.setMasterVolume(0.8);
```

### Audio State

Reactive signals for audio settings:

```typescript
import { audioState } from '~/scaffold/systems/audio';

// Check if music is enabled
if (audioState.musicEnabled()) {
  // Play music
}

// Get current volume
const volume = audioState.volume();

// These are reactive - use in createEffect for auto-updates
createEffect(() => {
  coordinator.audio.setMasterVolume(audioState.volume());
});
```

### Audio Context (useAudio hook)

For use in SolidJS components:

```typescript
import { useAudio } from '~/scaffold/systems/audio';

function GameScreen() {
  const audio = useAudio();

  // Reactive getters
  const currentVolume = audio.volume();
  const musicOn = audio.musicEnabled();

  // These update when tuning changes
}
```

## Audio Sprites

Audio sprites combine multiple sounds into a single file for efficient loading.

### JSON Format

```json
{
  "src": ["sounds.webm", "sounds.mp3"],
  "sprite": {
    "click": [0, 500],
    "explode": [600, 1200],
    "music": [2000, 60000, true]
  }
}
```

Format: `"name": [start_ms, duration_ms, loop?]`

### Bundle Registration

```typescript
// src/game/manifest.ts
{
  bundles: [
    { name: 'audio-sfx-citylines', assets: ['sfx-citylines.json'] }
  ]
}
```

The `audio-` prefix tells the loader to use the AudioLoader.

## Playback Options

### Sound Effects

```typescript
audioLoader.play(channel, sprite, {
  volume: 0.5,      // 0-1
  rate: 1.0,        // Playback speed
  loop: false,      // Loop the sound
});
```

### Music

```typescript
const musicId = audioLoader.playMusic(channel, sprite, {
  volume: 0.6,
  fadeIn: 1000,     // Fade in duration (ms)
});

// Stop with fade out
audioLoader.stopMusic(500);  // 500ms fade
```

## Mobile Audio Unlock

Browsers require user interaction before playing audio. The scaffold handles this:

```typescript
import { useAssets } from '~/scaffold/systems/assets';

function StartScreen() {
  const { unlockAudio } = useAssets();

  const handleStart = () => {
    unlockAudio();  // Call on first user tap
    // Audio now works
  };

  return <button onClick={handleStart}>Start</button>;
}
```

## Integration Pattern

### SoundDefinition Type

Define sounds using the scaffold's `SoundDefinition` type:

```typescript
// src/game/audio/sounds.ts
import type { SoundDefinition } from '~/scaffold/systems/audio';

export const SOUND_CLICK: SoundDefinition = {
  channel: 'sfx-mygame',
  sprite: 'button_click',
  volume: 0.7,
};

// For variations (prevents audio fatigue)
export const SOUND_ROTATE: readonly SoundDefinition[] = [
  { channel: 'sfx-mygame', sprite: 'rotate_1', volume: 0.5 },
  { channel: 'sfx-mygame', sprite: 'rotate_2', volume: 0.5 },
  { channel: 'sfx-mygame', sprite: 'rotate_3', volume: 0.5 },
] as const;
```

### BaseAudioManager

Extend `BaseAudioManager` to create your game's audio manager:

```typescript
// src/game/audio/manager.ts
import type { AudioLoader } from '~/scaffold/systems/assets/loaders/audio';
import { BaseAudioManager } from '~/scaffold/systems/audio';
import { SOUND_CLICK, SOUND_ROTATE, MUSIC_TRACKS } from './sounds';

export class GameAudioManager extends BaseAudioManager {
  private currentMusicIndex = 0;

  constructor(audioLoader: AudioLoader) {
    super(audioLoader);
  }

  // Single sound
  playClick(): void {
    this.playSound(SOUND_CLICK);
  }

  // Random from variations
  playRotate(): void {
    this.playRandomSound(SOUND_ROTATE);
  }

  // Game-specific music control
  startGameMusic(): void {
    const track = MUSIC_TRACKS[this.currentMusicIndex];
    this.startMusic(track);
  }

  nextTrack(): void {
    this.stopMusic();
    this.currentMusicIndex = (this.currentMusicIndex + 1) % MUSIC_TRACKS.length;
    this.startGameMusic();
  }
}
```

### BaseAudioManager Methods

| Method | Purpose |
|--------|---------|
| `playSound(sound)` | Play a single SoundDefinition |
| `playRandomSound(sounds)` | Play random from array (variations) |
| `startMusic(track, fadeIn?)` | Start music with optional fade (default 1000ms) |
| `stopMusic(fadeOut?)` | Stop music with optional fade (default 500ms) |
| `isMusicPlaying()` | Check if music is currently playing |

### Wiring to Game Events

```typescript
// In GameScreen
const manager = new GameAudioManager(coordinator.audio);

// Wire to game events
game.onGameEvent('tileRotated', () => manager.playRotate());
game.onGameEvent('levelComplete', () => manager.playLevelComplete());

// Or call directly from handlers
const handleClick = () => {
  manager.playClick();
  // ... other logic
};
```

### Reactive Music Control

```typescript
createEffect(() => {
  const manager = audioManager();
  if (!manager) return;

  if (audio.musicEnabled()) {
    manager.startGameMusic(); // Game-specific method for track rotation
  } else {
    manager.stopMusic();
  }
});
```

## Best Practices

1. **Always check musicEnabled** before playing music
2. **Use fade transitions** for music starts/stops
3. **Provide sound variations** for frequently-played effects
4. **Call unlockAudio** on first user interaction
5. **Set appropriate volumes** - music lower than SFX
6. **Clean up on screen exit** - stop music, kill loops

## Related Documentation

- [Audio Setup Guide](../../guides/assets/audio-setup.md) - Creating audio sprites
- [Asset Pipeline](../../guides/assets/asset-pipeline.md) - Asset organization
- [New Game Guide](../../guides/getting-started/new-game.md) - Audio setup for new games
- [Assets System](./assets.md) - Asset loading architecture
