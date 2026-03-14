/**
 * Thin scaffold wrapper over game-components' AssetFacade.
 *
 * Adds scaffold-specific concerns:
 * - Auto-creates PixiLoader on initGpu() (no param needed)
 * - Audio convenience methods (play, setMasterVolume, unlock)
 * - getGpuLoader() accessor
 */

import {
  createAssetFacade,
  type AssetFacade,
  type Manifest,
} from '@wolfgames/components/core';
import { createHowlerLoader } from '@wolfgames/components/howler';
import { createPixiLoader, type PixiLoader } from '@wolfgames/components/pixi';
import type { Howl } from 'howler';

export interface AssetCoordinatorFacade extends Omit<AssetFacade, 'initGpu'> {
  initGpu(): Promise<void>;
  audio: {
    play(channel: string, sprite?: string, opts?: { volume?: number }): number;
    stop(channel: string, id?: number): void;
    setMasterVolume(volume: number): void;
    unlock(): Promise<void>;
  };
  getGpuLoader(): PixiLoader | null;
}

export function createCoordinatorFacade(manifest: Manifest): AssetCoordinatorFacade {
  const howlerLoader = createHowlerLoader();

  const facade = createAssetFacade({
    manifest,
    loaders: { audio: howlerLoader },
  });

  let gpuInit: Promise<void> | null = null;

  return {
    ...facade,

    initGpu() {
      gpuInit ??= facade.initGpu(createPixiLoader());
      return gpuInit;
    },

    audio: {
      play(channel: string, sprite?: string, opts?: { volume?: number }): number {
        const howl = howlerLoader.get(channel) as Howl | null;
        if (!howl) return -1;
        if (opts?.volume != null) howl.volume(opts.volume);
        return howl.play(sprite);
      },
      stop(channel: string, id?: number): void {
        howlerLoader.stop(channel, id);
      },
      setMasterVolume(volume: number): void {
        howlerLoader.setVolume(volume);
      },
      unlock(): Promise<void> {
        return howlerLoader.unlock();
      },
    },

    getGpuLoader: () => facade.getLoader<PixiLoader>('gpu'),
  };
}
