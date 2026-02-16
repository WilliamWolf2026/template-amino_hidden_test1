import { PostHog } from "./gameKit";

let posthogInstance: PostHog | null = null;

/** * Injects the PostHog instance from GameKit into the Scaffold.
 * This allows scaffold systems (like ErrorReporter) to track events
 * without needing to know about GameKit or the game's config.
 */
export function setPostHogInstance(instance: PostHog) {
  posthogInstance = instance;
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
