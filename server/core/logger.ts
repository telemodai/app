import pino from "pino";

/** Pino only auto-serializes the `err` key; mirror it for legacy `error` bindings. */
const errorSerializer = pino.stdSerializers.err;

function createLogger() {
  const options: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL || "info",
    serializers: {
      err: errorSerializer,
      error: errorSerializer,
    },
  };

  // Pretty transport is dev-only; bundled CLI and production use plain JSON stdout.
  if (process.env.NODE_ENV !== "production") {
    options.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    };
  }

  return pino(options);
}

export const logger = createLogger();

/** Log structured errors to stdout (same stream as logger — Docker-friendly). */
export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error({
    err: error,
    context,
  });
}
