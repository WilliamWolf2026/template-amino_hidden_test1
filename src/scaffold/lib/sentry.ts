import * as Sentry from '@sentry/browser';

let initialized = false;

export function initSentry(dsn?: string) {
  if (initialized || !dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter sensitive data if needed
      return event;
    },
  });

  initialized = true;
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!initialized) {
    console.error('[Sentry not initialized]', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

export function setUser(userId: string) {
  if (!initialized) return;
  Sentry.setUser({ id: userId });
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}

export { Sentry };
