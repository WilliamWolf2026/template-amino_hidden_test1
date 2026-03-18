import type { Accessor } from 'solid-js';
import type { PostHog } from '~/core/lib/analytics';

export interface AnalyticsIdentity {
  userId: string;
  email?: string;
  name?: string;
}

export interface AnalyticsState {
  /** PostHog instance (null until initialized) */
  posthog: Accessor<PostHog | null>;
  /** Whether analytics has finished initializing (true even if disabled/failed) */
  isReady: Accessor<boolean>;
  /** Capture a named event with optional properties */
  capture: (event: string, properties?: Record<string, unknown>) => void;
  /** Identify a user with optional properties */
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  /** Register super properties for all future events */
  register: (properties: Record<string, unknown>) => void;
}
