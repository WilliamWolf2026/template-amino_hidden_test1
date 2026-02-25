/**
 * TEMPORARY DEBUG SUPPORT - Chapter Progress Fill Bar Ticket Only
 * 
 * Parse debug URL parameters (dev-only, no prod impact)
 * Supports: ?debugLevel=N, ?debugProgressAnim=1
 * 
 * TODO: Remove this entire file once real multi-level chapter progression is implemented.
 * This is ONLY needed to test progress bar states with the current single-level game.
 */

export interface DebugParams {
  debugLevel?: number;
  debugProgressAnim?: boolean;
}

export function getDebugParams(): DebugParams {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const result: DebugParams = {};

  // ?debugLevel=N (0-10) - forces progress value
  const levelParam = params.get('debugLevel');
  if (levelParam !== null) {
    const level = parseInt(levelParam, 10);
    if (!isNaN(level) && level >= 0 && level <= 10) {
      result.debugLevel = level;
    }
  }

  // ?debugProgressAnim=1 - triggers fill animation once
  const animParam = params.get('debugProgressAnim');
  if (animParam === '1' || animParam === 'true') {
    result.debugProgressAnim = true;
  }

  return result;
}
