/**
 * Structured browser logger.
 *
 * Emits one JSON object per entry so anything forwarded to an error-tracking
 * service arrives already machine-readable, replacing the bare `console.error`
 * calls whose interpolated strings could not be parsed or grouped.
 *
 * Kept deliberately small and dependency-free: the backend has its own
 * `structuredLogger`, and the two must not share code across the workspace
 * boundary.
 */

export type BrowserLogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Arbitrary structured context attached to a log entry. */
export type BrowserLogFields = Record<string, unknown>;

/** Destination for a serialized entry. Injected so tests avoid the real console. */
export type BrowserLogSink = (level: BrowserLogLevel, payload: string) => void;

/**
 * Field names replaced with `[REDACTED]`, matched case-insensitively with
 * separators stripped. Browser logs frequently reach third-party trackers, so
 * credentials must never be serialized into them.
 */
const REDACTED_KEY_PATTERNS = [
  'password',
  'senha',
  'token',
  'secret',
  'authorization',
  'apikey',
  'cvv',
  'cpf',
];

const REDACTED_PLACEHOLDER = '[REDACTED]';

const isSensitiveKey = (key: string): boolean => {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return REDACTED_KEY_PATTERNS.some(pattern => normalized.includes(pattern));
};

/** `JSON.stringify(new Error())` is `{}`, which would discard the failure detail. */
const serializeError = (error: Error): BrowserLogFields => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
});

const sanitize = (value: unknown, seen: WeakSet<object> = new WeakSet()): unknown => {
  if (value instanceof Error) return serializeError(value);
  if (value === null || typeof value !== 'object') return value;

  if (seen.has(value as object)) return '[Circular]';
  seen.add(value as object);

  if (Array.isArray(value)) return value.map(item => sanitize(item, seen));

  const result: BrowserLogFields = {};
  for (const [key, item] of Object.entries(value as BrowserLogFields)) {
    result[key] = isSensitiveKey(key) ? REDACTED_PLACEHOLDER : sanitize(item, seen);
  }
  return result;
};

const consoleSink: BrowserLogSink = (level, payload) => {
  // Routing through the matching console method preserves devtools filtering
  // and the stack capture the browser attaches to warn/error.
  if (level === 'error') console.error(payload);
  else if (level === 'warn') console.warn(payload);
  else console.info(payload);
};

interface BrowserLoggerOptions {
  sink?: BrowserLogSink;
  now?: () => Date;
}

/**
 * Emits structured JSON entries to the browser console.
 *
 * @example
 * browserLogger.error('Failed to load categories', { error });
 * // {"timestamp":"2026-07-26T12:00:00.000Z","level":"error","message":"Failed to load categories",...}
 */
export class BrowserLogger {
  private readonly sink: BrowserLogSink;
  private readonly now: () => Date;

  constructor(options: BrowserLoggerOptions = {}) {
    this.sink = options.sink ?? consoleSink;
    this.now = options.now ?? (() => new Date());
  }

  debug(message: string, fields?: BrowserLogFields): void {
    this.write('debug', message, fields);
  }

  info(message: string, fields?: BrowserLogFields): void {
    this.write('info', message, fields);
  }

  warn(message: string, fields?: BrowserLogFields): void {
    this.write('warn', message, fields);
  }

  error(message: string, fields?: BrowserLogFields): void {
    this.write('error', message, fields);
  }

  private write(level: BrowserLogLevel, message: string, fields?: BrowserLogFields): void {
    const entry: BrowserLogFields = {
      timestamp: this.now().toISOString(),
      level,
      message,
      ...(fields ? (sanitize(fields) as BrowserLogFields) : {}),
    };

    let payload: string;
    try {
      payload = JSON.stringify(entry);
    } catch {
      payload = `{"level":"${level}","message":${JSON.stringify(message)}}`;
    }

    // Logging must never break the render that triggered it.
    try {
      this.sink(level, payload);
    } catch {
      return;
    }
  }
}

export const createBrowserLogger = (options?: BrowserLoggerOptions): BrowserLogger =>
  new BrowserLogger(options);

/** Shared application logger. */
export const browserLogger = createBrowserLogger();
