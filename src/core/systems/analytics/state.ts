import { createSignal } from 'solid-js';
import type { PostHog } from '~/core/lib/analytics';
import { setPostHogInstance } from '~/core/lib/posthog';
import { cachePostHogInstance } from '~/core/lib/analytics';
import type { AnalyticsIdentity, AnalyticsState } from './types';

export function createAnalyticsState() {
  const [posthog, setPosthog] = createSignal<PostHog | null>(null);
  const [isReady, setIsReady] = createSignal(false);

  const state: AnalyticsState = {
    posthog,
    isReady,
    capture(event, properties?) {
      const ph = posthog();
      if (ph) {
        ph.capture(event, properties);
      } else {
        console.debug(`[analytics] capture (no-op): ${event}`);
      }
    },
    identify(userId, properties?) {
      const ph = posthog();
      if (ph) {
        ph.identify(userId, properties);
      }
    },
    register(properties) {
      const ph = posthog();
      if (ph) {
        ph.register(properties);
      }
    },
  };

  function initialize(_identity?: AnalyticsIdentity) {
    // Skeleton: PostHog is not initialized here yet.
    // When GameKit API is confirmed, wire up real initialization:
    //   1. Check getPosthogConfig().enabled
    //   2. Init via GameKit
    //   3. setPosthog(instance)
    //   4. setPostHogInstance(instance) — bridge for error reporter
    //   5. cachePostHogInstance(instance)
    //
    // For now, just mark as ready so the app proceeds.
    setIsReady(true);
  }

  return { state, initialize, setPosthog, setIsReady };
}
