/**
 * Wraps game-components DomLoader to expose scaffold-style getFrameURL.
 */

import type { DomLoader as GcDomLoader } from '@wolfgames/components/core';

/** Spritesheet shape for frame URL extraction */
interface SpritesheetFrameSource {
  image: HTMLImageElement;
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
}

/**
 * Build a blob URL for a single frame from a spritesheet (for use in <img src>).
 */
export async function getFrameURLFromSpritesheet(
  getSpritesheet: (alias: string) => SpritesheetFrameSource | null,
  sheetAlias: string,
  frameName: string
): Promise<string> {
  const sheet = getSpritesheet(sheetAlias);
  if (!sheet) throw new Error(`Sheet not loaded: ${sheetAlias}`);

  const frameData = sheet.frames[frameName];
  if (!frameData) throw new Error(`Frame not found: ${frameName}`);

  const { x, y, w, h } = frameData.frame;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(sheet.image, x, y, w, h, 0, 0, w, h);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
  return URL.createObjectURL(blob);
}

/**
 * Scaffold-shaped dom API backed by GC DomLoader.
 */
export function createDomAdapter(gcDom: GcDomLoader): {
  getFrameURL(sheetPath: string, frameName: string): Promise<string>;
  get(path: string): unknown;
  getImage(alias: string): HTMLImageElement | null;
  getSheet(path: string): { image: HTMLImageElement; json: { frames: Record<string, unknown> } } | null;
} {
  return {
    async getFrameURL(sheetPath: string, frameName: string): Promise<string> {
      return getFrameURLFromSpritesheet(
        (alias) => gcDom.getSpritesheet(alias),
        sheetPath,
        frameName
      );
    },
    get(path: string): unknown {
      const alias = path.split('/').pop()?.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '') ?? path;
      return gcDom.get(alias);
    },
    getImage(alias: string): HTMLImageElement | null {
      const key = alias.split('/').pop()?.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '') ?? alias;
      return gcDom.getImage(key);
    },
    getSheet(path: string): { image: HTMLImageElement; json: { frames: Record<string, unknown> } } | null {
      const alias = path.split('/').pop()?.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '') ?? path;
      const sheet = gcDom.getSpritesheet(alias);
      if (!sheet) return null;
      return { image: sheet.image, json: { frames: sheet.frames as Record<string, unknown> } };
    },
  };
}
