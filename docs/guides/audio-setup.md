# Audio Setup Guide

How to add and manage audio in games built on this scaffold.

## Overview

The audio system uses:
- **Howler.js** - Audio playback engine
- **Audio Sprites** - Multiple sounds packed into single files
- **Dual Format** - WebM + MP3 for browser compatibility

## Audio Sprite Format

Audio sprites pack multiple sounds into a single audio file with a JSON manifest.

### JSON Structure

```json
{
  "src": [
    "citylines-sfx.webm",
    "citylines-sfx.mp3"
  ],
  "sprite": {
    "button_click": [0, 508],
    "tile_rotate_1": [7120, 100],
    "level_complete": [11578, 480]
  }
}
```

Each sprite entry: `"name": [start_ms, duration_ms]`

### Creating Audio Sprites

1. **Prepare individual sound files** (WAV or high-quality MP3)

2. **Use audiosprite tool** (or similar):
   ```bash
   npm install -g audiosprite
   audiosprite -o citylines-sfx -f howler2 *.wav
   ```

3. **Export both formats**:
   - WebM (smaller, better quality)
   - MP3 (fallback for Safari)

4. **Place in assets folder**:
   ```
   public/assets/
   ├── citylines-sfx.json
   ├── citylines-sfx.webm
   └── citylines-sfx.mp3
   ```

## Sound Definitions

Define sounds in a catalog file for type safety and easy management.

### Create Sound Catalog

```typescript
// src/game/audio/sounds.ts

export interface SoundDefinition {
  channel: string;  // Bundle name (without 'audio-' prefix)
  sprite: string;   // Sprite name in JSON
  volume?: number;  // 0-1, default 1
}

// UI Sounds
export const SOUND_BUTTON_CLICK: SoundDefinition = {
  channel: 'citylines-sfx',
  sprite: 'button_click',
  volume: 0.7,
};

// Gameplay Sounds (with variations to prevent fatigue)
export const SOUND_TILE_ROTATE: readonly SoundDefinition[] = [
  { channel: 'citylines-sfx', sprite: 'tile_rotate_1', volume: 0.5 },
  { channel: 'citylines-sfx', sprite: 'tile_rotate_2', volume: 0.5 },
  { channel: 'citylines-sfx', sprite: 'tile_rotate_3', volume: 0.5 },
] as const;

// Music Tracks
export const MUSIC_TRACKS: readonly SoundDefinition[] = [
  { channel: 'citylines-sfx', sprite: 'music_track_1' },
  { channel: 'citylines-sfx', sprite: 'music_track_2' },
] as const;
```

## Game Audio Manager

Create a manager class to handle game-specific audio logic.

```typescript
// src/game/audio/manager.ts

import type { AudioLoader } from '~/scaffold/systems/assets/loaders/audio';
import { audioState } from '~/scaffold/systems/audio';
import { SOUND_TILE_ROTATE, MUSIC_TRACKS, type SoundDefinition } from './sounds';

export class GameAudioManager {
  private audioLoader: AudioLoader;
  private currentMusicId: number | null = null;

  constructor(audioLoader: AudioLoader) {
    this.audioLoader = audioLoader;
  }

  // Play with random variation
  playTileRotate(): void {
    const sound = this.getRandomSound(SOUND_TILE_ROTATE);
    this.playSound(sound);
  }

  // Simple sound playback
  playLevelComplete(): void {
    this.playSound(SOUND_LEVEL_COMPLETE);
  }

  // Music control
  startMusic(): void {
    if (!audioState.musicEnabled()) return;

    const track = MUSIC_TRACKS[0];
    this.currentMusicId = this.audioLoader.playMusic(track.channel, track.sprite, {
      fadeIn: 1000,
      volume: 0.6,
    });
  }

  stopMusic(): void {
    if (this.currentMusicId !== null) {
      this.audioLoader.stopMusic(500);  // 500ms fade out
      this.currentMusicId = null;
    }
  }

  private playSound(sound: SoundDefinition): void {
    this.audioLoader.play(sound.channel, sound.sprite, {
      volume: sound.volume,
    });
  }

  private getRandomSound(sounds: readonly SoundDefinition[]): SoundDefinition {
    return sounds[Math.floor(Math.random() * sounds.length)];
  }
}
```

## Register Audio Bundle

```typescript
// src/game/manifest.ts
export const manifest: Manifest = {
  bundles: [
    // Audio bundles use 'audio-' prefix
    { name: 'audio-citylines-sfx', assets: ['citylines-sfx.json'] },
  ],
};
```

## Using Audio in Screens

```typescript
// src/game/screens/GameScreen.tsx

export function GameScreen() {
  const { coordinator } = useAssets();
  const [audioManager, setAudioManager] = createSignal<GameAudioManager | null>(null);

  onMount(async () => {
    // Create audio manager
    const manager = new GameAudioManager(coordinator.audio);
    setAudioManager(manager);

    // Wire up game events
    game.onGameEvent('tileRotated', () => {
      manager.playTileRotate();
    });

    game.onGameEvent('levelComplete', () => {
      manager.playLevelComplete();
    });
  });
}
```

## Mobile Audio Unlock

Mobile browsers require user interaction before playing audio. The scaffold handles this automatically:

```typescript
// In your start screen
const handleStart = async () => {
  unlockAudio();  // From useAssets() - call on first user tap
  await loadCore();
  // Audio is now unlocked
};
```

## Reactive Audio Controls

The scaffold provides reactive audio state:

```typescript
import { audioState } from '~/scaffold/systems/audio';

// React to music toggle
createEffect(() => {
  const manager = audioManager();
  if (!manager) return;

  if (audioState.musicEnabled()) {
    manager.startMusic();
  } else {
    manager.stopMusic();
  }
});

// React to volume changes
createEffect(() => {
  const volume = audio.volume();
  coordinator.audio.setMasterVolume(volume);
});
```

## Best Practices

1. **Use audio sprites** - Reduces HTTP requests, improves loading
2. **Provide variations** - 3-5 variations for frequent sounds prevents fatigue
3. **Respect user settings** - Always check `audioState.musicEnabled()`
4. **Fade music** - Use fadeIn/fadeOut for smooth transitions
5. **Set appropriate volumes** - Music ~0.5-0.6, SFX ~0.5-0.8
6. **Test on mobile** - Ensure unlock flow works on iOS Safari

## Troubleshooting

### "Audio not playing"
- Check `unlockAudio()` was called on user interaction
- Verify bundle loaded: check console for errors
- Test in Chrome DevTools with autoplay policy disabled

### "Music cuts out"
- Check if screen transition is stopping music
- Verify music state persists across screens

### "Audio delayed on mobile"
- Use shorter sprites for responsive sounds
- Preload audio bundles before gameplay
