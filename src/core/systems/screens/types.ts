// Screen identifiers
export type ScreenId = 'loading' | 'start' | 'game' | 'results';

// Transition states
export type TransitionState = 'idle' | 'out' | 'in';

// Screen transition config
export interface TransitionConfig {
  duration: number;
  type: 'fade' | 'slide' | 'none';
}

// Screen context shape
export interface ScreenContext {
  current: () => ScreenId;
  previous: () => ScreenId | null;
  transition: () => TransitionState;
  data: () => Record<string, unknown>;
  goto: (screen: ScreenId, data?: Record<string, unknown>) => Promise<void>;
  back: () => Promise<void>;
}

// Default transition config
export const DEFAULT_TRANSITION: TransitionConfig = {
  duration: 300,
  type: 'fade',
};
