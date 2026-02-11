type PostHogModule = typeof import('posthog-js').default;

let ph: PostHogModule | null = null;
let initialized = false;

export async function initPostHog(apiKey?: string, apiHost?: string) {
  if (initialized || !apiKey) return;

  const { default: posthog } = await import('posthog-js');

  posthog.init(apiKey, {
    api_host: apiHost ?? 'https://app.posthog.com',
    loaded: () => {
      if (import.meta.env.DEV) {
        posthog.debug();
      }
    },
    capture_pageview: false,
    autocapture: false,
  });

  ph = posthog;
  initialized = true;
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!ph) {
    console.log('[PostHog not initialized]', event, properties);
    return;
  }

  ph.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (!ph) return;
  ph.identify(userId, properties);
}

export function setPersonProperties(properties: Record<string, unknown>) {
  if (!ph) return;
  ph.people.set(properties);
}

export { ph as posthog };
