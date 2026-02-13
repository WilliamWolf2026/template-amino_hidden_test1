// import posthog from 'posthog-js';

import { PostHog } from "./gameKit";

// let initialized = false;

// export function initPostHog(apiKey?: string, apiHost?: string) {
//   if (initialized || !apiKey) return;

//   posthog.init(apiKey, {
//     api_host: apiHost ?? 'https://app.posthog.com',
//     loaded: () => {
//       if (import.meta.env.DEV) {
//         posthog.debug();
//       }
//     },
//     capture_pageview: false, // We'll handle this manually for SPA
//     autocapture: false, // Manual control for game events
//   });

//   initialized = true;
// }

// export function capture(event: string, properties?: Record<string, unknown>) {
//   if (!initialized) {
//     console.log('[PostHog not initialized]', event, properties);
//     return;
//   }

//   posthog.capture(event, properties);
// }

// export function identify(userId: string, properties?: Record<string, unknown>) {
//   if (!initialized) return;
//   posthog.identify(userId, properties);
// }

// export function setPersonProperties(properties: Record<string, unknown>) {
//   if (!initialized) return;
//   posthog.people.set(properties);
// }

// export { posthog };

let posthogInstance: PostHog | null = null;

/** * Injects the PostHog instance from GameKit into the Scaffold.
 * This allows scaffold systems (like ErrorReporter) to track events
 * without needing to know about GameKit or the game's config.
 */
export function setPostHogInstance(instance: PostHog) {
  posthogInstance = instance;
  console.log("[Scaffold] PostHog instance bridge connected.");
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!posthogInstance) {
    console.warn(`[Scaffold] Capture called before bridge init: ${event}`);
    return;
  }
  posthogInstance.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  posthogInstance?.identify(userId, properties);
}

export function setPersonProperties(properties: Record<string, unknown>) {
  posthogInstance?.people.set(properties);
}
