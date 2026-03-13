/**
 * AssetCoordinatorFacade integration tests.
 *
 * Validates the loading flow: loadBoot → loadTheme → initGpu → loadCore → loadAudio,
 * idempotent re-loads, scene loading, and background loading.
 *
 * Tests run against the built dist of @wolfgames/components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAssetCoordinator,
  type Manifest,
  type LoaderAdapter,
} from '@wolfgames/components/core';

const createMockLoader = (): LoaderAdapter & { loadedBundles: string[] } => {
  const loadedBundles: string[] = [];
  return {
    loadedBundles,
    init: vi.fn(),
    loadBundle: vi.fn(async (name: string, onProgress?: (p: number) => void) => {
      onProgress?.(0.5);
      loadedBundles.push(name);
      onProgress?.(1);
    }),
    get: vi.fn(() => null),
    has: vi.fn(() => false),
    unloadBundle: vi.fn(),
    dispose: vi.fn(),
  };
};

const testManifest: Manifest = {
  cdnBase: '/assets',
  bundles: [
    { name: 'boot-splash', assets: [{ alias: 'spinner', src: 'spinner.png' }] },
    { name: 'theme-branding', assets: [{ alias: 'logo', src: 'logo.png' }] },
    { name: 'core-ui', assets: [{ alias: 'button', src: 'button.json' }] },
    { name: 'audio-sfx', assets: [{ alias: 'click', src: 'click.json' }] },
    { name: 'scene-level1', assets: [{ alias: 'bg', src: 'bg.png' }] },
  ],
};

describe('AssetCoordinator loading flow', () => {
  let domLoader: ReturnType<typeof createMockLoader>;
  let gpuLoader: ReturnType<typeof createMockLoader>;
  let audioLoader: ReturnType<typeof createMockLoader>;
  let coordinator: ReturnType<typeof createAssetCoordinator>;

  beforeEach(() => {
    domLoader = createMockLoader();
    gpuLoader = createMockLoader();
    audioLoader = createMockLoader();
    coordinator = createAssetCoordinator({
      manifest: testManifest,
      loaders: { dom: domLoader, gpu: gpuLoader, audio: audioLoader },
    });
  });

  it('routes boot-* bundles to dom loader', async () => {
    await coordinator.loadBundle('boot-splash');

    expect(domLoader.loadBundle).toHaveBeenCalled();
    expect(domLoader.loadedBundles).toContain('boot-splash');
    expect(coordinator.isLoaded('boot-splash')).toBe(true);
  });

  it('routes theme-* bundles to dom loader', async () => {
    await coordinator.loadBundle('theme-branding');

    expect(domLoader.loadBundle).toHaveBeenCalled();
    expect(domLoader.loadedBundles).toContain('theme-branding');
    expect(coordinator.isLoaded('theme-branding')).toBe(true);
  });

  it('routes core-* bundles to gpu loader', async () => {
    await coordinator.loadBundle('core-ui');

    expect(gpuLoader.loadBundle).toHaveBeenCalled();
    expect(gpuLoader.loadedBundles).toContain('core-ui');
    expect(coordinator.isLoaded('core-ui')).toBe(true);
  });

  it('routes audio-* bundles to audio loader', async () => {
    await coordinator.loadBundle('audio-sfx');

    expect(audioLoader.loadBundle).toHaveBeenCalled();
    expect(audioLoader.loadedBundles).toContain('audio-sfx');
    expect(coordinator.isLoaded('audio-sfx')).toBe(true);
  });

  it('routes scene-* bundles to gpu loader', async () => {
    await coordinator.loadBundle('scene-level1');

    expect(gpuLoader.loadBundle).toHaveBeenCalled();
    expect(gpuLoader.loadedBundles).toContain('scene-level1');
    expect(coordinator.isLoaded('scene-level1')).toBe(true);
  });

  it('runs the full boot → theme → core → audio sequence', async () => {
    await coordinator.loadBundle('boot-splash');
    await coordinator.loadBundle('theme-branding');
    await coordinator.loadBundle('core-ui');
    await coordinator.loadBundle('audio-sfx');

    expect(coordinator.isLoaded('boot-splash')).toBe(true);
    expect(coordinator.isLoaded('theme-branding')).toBe(true);
    expect(coordinator.isLoaded('core-ui')).toBe(true);
    expect(coordinator.isLoaded('audio-sfx')).toBe(true);

    const state = coordinator.loadingState.get();
    expect(state.loaded).toHaveLength(4);
    expect(state.loading).toHaveLength(0);
    expect(state.progress).toBeCloseTo(4 / 5);
  });

  it('records errors when loader throws', async () => {
    const error = new Error('network down');
    domLoader.loadBundle = vi.fn().mockRejectedValue(error);

    try {
      await coordinator.loadBundle('boot-splash');
    } catch {
      // may or may not throw depending on library version
    }

    const state = coordinator.loadingState.get();
    expect(state.errors['boot-splash']).toBeDefined();
    expect(state.loading).not.toContain('boot-splash');
  });

  it('supports background loading without affecting foreground list', async () => {
    await coordinator.loadBundle('boot-splash', { background: true });

    const state = coordinator.loadingState.get();
    expect(state.loaded).toContain('boot-splash');
    expect(state.loading).toHaveLength(0);
    expect(state.backgroundLoading).toHaveLength(0);
  });

  it('loads multiple bundles in parallel', async () => {
    await coordinator.loadBundles(['boot-splash', 'theme-branding', 'core-ui']);

    expect(coordinator.isLoaded('boot-splash')).toBe(true);
    expect(coordinator.isLoaded('theme-branding')).toBe(true);
    expect(coordinator.isLoaded('core-ui')).toBe(true);
  });

  it('unloads and re-loads correctly', async () => {
    await coordinator.loadBundle('boot-splash');
    expect(coordinator.isLoaded('boot-splash')).toBe(true);

    coordinator.unloadBundle('boot-splash');
    expect(coordinator.isLoaded('boot-splash')).toBe(false);

    await coordinator.loadBundle('boot-splash');
    expect(coordinator.isLoaded('boot-splash')).toBe(true);
  });
});

describe('Queued loading (late GPU registration)', () => {
  it('queues gpu bundles and flushes when loader is registered', async () => {
    const domLoader = createMockLoader();
    const coordinator = createAssetCoordinator({
      manifest: testManifest,
      loaders: { dom: domLoader },
    });

    await coordinator.loadBundle('boot-splash');
    expect(coordinator.isLoaded('boot-splash')).toBe(true);

    const corePromise = coordinator.loadBundle('core-ui');

    const gpuLoader = createMockLoader();
    coordinator.initLoader('gpu', gpuLoader);
    await corePromise;

    expect(gpuLoader.loadBundle).toHaveBeenCalled();
    expect(gpuLoader.loadedBundles).toContain('core-ui');
    expect(coordinator.isLoaded('core-ui')).toBe(true);
  });
});
