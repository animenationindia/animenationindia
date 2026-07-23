// lib/logger.ts

export interface LogContextOptions {
  isRateLimit?: boolean;
  endpoint?: string;
  extra?: Record<string, any>;
}

/**
 * Centralized Error Logging Utility for Anime Nation India
 * Formats errors nicely in development mode and prepares for Sentry/Datadog integration.
 */
export function logError(
  context: string,
  error: unknown,
  options: LogContextOptions = {}
) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isRateLimit = options.isRateLimit || errorMessage.includes('429') || errorMessage.includes('Rate Limit');

  if (process.env.NODE_ENV === 'development') {
    const badge = isRateLimit ? '⚠️ [RATE LIMIT]' : '❌ [ERROR]';
    console.error(
      `${badge} [${timestamp}] (${context}): ${errorMessage}`,
      options.endpoint ? `\nEndpoint: ${options.endpoint}` : '',
      error instanceof Error && error.stack ? `\nStack: ${error.stack.split('\n')[1]}` : ''
    );
  }

  // TODO: Integrate Sentry/Datadog or Google Cloud Logging for production error tracking:
  // if (process.env.NODE_ENV === 'production' && window.Sentry) {
  //   Sentry.captureException(error, { tags: { context, isRateLimit } });
  // }
}
