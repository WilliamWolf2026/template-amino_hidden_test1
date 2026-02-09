import * as Sentry from "@sentry/browser";
import { Environment, scaffoldConfig } from "../config";

/**
 * Configuration per environment
 */
interface SentryConfig {
  enabled: boolean;
  dsn: string;
  environment: Environment;
}

/**
 * User context
 */
export interface SentryUserContext {
  userId: string;
  email?: string;
  sessionId: string;
}

/**
 * Error tracker type
 */
type ErrorTracker = (params: {
  error_type: string;
  user_id: string;
  session_id: string;
}) => void;

/**
 * State for automatic tracking
 */
let errorTracker: ErrorTracker | null = null;
let userId: string | null = null;
let sessionId: string | null = null;

/**
 * Get environment-specific configuration
 */
function getSentryConfig(environment: Environment): SentryConfig {
  const dsn =
    import.meta.env.VITE_SENTRY_DSN || (scaffoldConfig?.sentry?.dsn ?? "");

  const enabledEnvironments: Environment[] = ["qa", "staging", "production"];

  const enabled = enabledEnvironments.includes(environment);

  return {
    enabled: enabled && Boolean(dsn),
    dsn,
    environment,
  };
}

/**
 * Initialize Sentry with automatic PostHog tracking
 *
 */
export function initSentry(environment: Environment): boolean {
  const config = getSentryConfig(environment);

  if (!config.enabled || !config.dsn) {
    console.log(
      `[Sentry] Skipped -- environment: ${environment}, enabled: ${config.enabled}`
    );
    return false;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      tracesSampleRate: 0.1,
      integrations: [Sentry.browserTracingIntegration()],

      beforeSend(event, hint) {
        // Automatically track in PostHog if available
        if (errorTracker && userId && sessionId) {
          try {
            const hasException = !!event.exception?.values?.length;
            if (!hasException) return event;

            if (errorTracker && userId && sessionId) {
              const errorType = event.exception!.values![0]!.type ?? "Error";
              errorTracker({
                error_type: errorType,
                user_id: userId,
                session_id: sessionId,
              });
              console.log(
                `[Sentry] Auto-tracked error in PostHog: ${errorType}`
              );
            }
          } catch (trackingError) {
            console.warn("[Sentry] PostHog tracking failed:", trackingError);
          }
        }

        return event;
      },

      sendDefaultPii: false,
    });

    console.log(`[Sentry] Initialized - env: ${environment}`);
    return true;
  } catch (error) {
    console.error("[Sentry] Init failed:", error);
    return false;
  }
}

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return Sentry.getClient() !== undefined;
}

export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  if (!isSentryEnabled()) {
    console.warn("[Sentry not initialized]", error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("additional_info", context);
    }
    const eventId = Sentry.captureException(error);
    console.log(`[Sentry] Exception sent. Event ID: ${eventId}`);
  });
}

export function setUser(userId: string) {
  if (!isSentryEnabled()) return;
  Sentry.setUser({ id: userId });
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  if (!isSentryEnabled()) return;
  Sentry.addBreadcrumb({
    message,
    data,
    level: "info",
  });
}

export { Sentry };
