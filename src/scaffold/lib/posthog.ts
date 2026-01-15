import posthog from 'posthog-js';

let initialized = false;

export function initPostHog(apiKey?: string, apiHost?: string) {
  if (initialized || !apiKey) return;

  posthog.init(apiKey, {
    api_host: apiHost ?? 'https://app.posthog.com',
    loaded: () => {
      if (import.meta.env.DEV) {
        posthog.debug();
      }
    },
    capture_pageview: false, // We'll handle this manually for SPA
    autocapture: false, // Manual control for game events
  });

  initialized = true;
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!initialized) {
    console.log('[PostHog not initialized]', event, properties);
    return;
  }

  posthog.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function setPersonProperties(properties: Record<string, unknown>) {
  if (!initialized) return;
  posthog.people.set(properties);
}

export { posthog };
