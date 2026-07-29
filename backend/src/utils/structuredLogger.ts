/**
 * Structured JSON logger for backend observability.
 *
 * Emits one JSON object per line so log aggregators can index fields directly,
 * replacing the bare `console.error` calls that produced unparseable output.
 * Written in-project rather than pulling in winston/pino: the surface needed
 * here is small, and keeping it owned means no transitive dependency in the
 * request path.
 *
 * The sink is injected so tests can capture output without touching stdout.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Arbitrary structured context attached to a log entry. */
export type LogFields = Record<string, unknown>;

/** Destination for a serialized log line. Injected for testability. */
export type LogSink = (line: string) => void;

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Field names whose values are replaced with `[REDACTED]`.
 *
 * Matching is case-insensitive and substring-based, so `authToken` and
 * `USER_PASSWORD` are both caught. Logging is a common accidental egress point
 * for credentials; this makes leaking one require deliberate effort.
 */
const REDACTED_KEY_PATTERNS = [
  'password',
  'senha',
  'token',
  'secret',
  'authorization',
  'apikey',
  'api_key',
  'cookie',
  'creditcard',
  'cvv',
  // CPF identifies a natural person and is personal data under the LGPD.
  // CNPJ is deliberately absent: it identifies a company and is public record.
  'cpf',
];

const REDACTED_PLACEHOLDER = '[REDACTED]';

const isSensitiveKey = (key: string): boolean => {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return REDACTED_KEY_PATTERNS.some(pattern => normalized.includes(pattern.replace(/[-_]/g, '')));
};

/**
 * Converts an Error into a plain object, since `JSON.stringify(new Error())`
 * yields `{}` and would silently discard the failure detail.
 */
const serializeError = (error: Error): LogFields => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
});

/**
 * Recursively copies `value`, redacting sensitive keys and unwrapping Errors.
 *
 * `seen` breaks reference cycles, which would otherwise make JSON.stringify
 * throw inside a logging call and take down the request that was being logged.
 */
const sanitize = (value: unknown, seen: WeakSet<object> = new WeakSet()): unknown => {
  if (value instanceof Error) return serializeError(value);
  if (value === null || typeof value !== 'object') return value;

  if (seen.has(value as object)) return '[Circular]';
  seen.add(value as object);

  if (Array.isArray(value)) return value.map(item => sanitize(item, seen));

  const result: LogFields = {};
  for (const [key, item] of Object.entries(value as LogFields)) {
    result[key] = isSensitiveKey(key) ? REDACTED_PLACEHOLDER : sanitize(item, seen);
  }
  return result;
};

interface StructuredLoggerOptions {
  /** Entries below this level are dropped. Defaults to `info` (`debug` in development). */
  minLevel?: LogLevel;
  /** Where serialized lines go. Defaults to stdout. */
  sink?: LogSink;
  /** Clock, injected so tests can assert on a fixed timestamp. */
  now?: () => Date;
}

const defaultMinLevel = (): LogLevel => (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

// Tests set NODE_ENV=test; keeping them silent by default avoids thousands of
// JSON lines in the runner output while still allowing an explicit sink.
const defaultSink = (): LogSink =>
  process.env.NODE_ENV === 'test' ? () => {} : (line: string) => process.stdout.write(`${line}\n`);

/**
 * Emits newline-delimited JSON log entries.
 *
 * @example
 * const logger = createStructuredLogger();
 * logger.error('CNPJ validation failed', { cnpj: '12345678000190', error });
 * // {"timestamp":"2026-07-26T12:00:00.000Z","level":"error","message":"CNPJ validation failed",...}
 */
export class StructuredLogger {
  private readonly minSeverity: number;
  private readonly sink: LogSink;
  private readonly now: () => Date;

  constructor(options: StructuredLoggerOptions = {}) {
    this.minSeverity = LEVEL_SEVERITY[options.minLevel ?? defaultMinLevel()];
    this.sink = options.sink ?? defaultSink();
    this.now = options.now ?? (() => new Date());
  }

  debug(message: string, fields?: LogFields): void {
    this.write('debug', message, fields);
  }

  info(message: string, fields?: LogFields): void {
    this.write('info', message, fields);
  }

  warn(message: string, fields?: LogFields): void {
    this.write('warn', message, fields);
  }

  error(message: string, fields?: LogFields): void {
    this.write('error', message, fields);
  }

  private write(level: LogLevel, message: string, fields?: LogFields): void {
    if (LEVEL_SEVERITY[level] < this.minSeverity) return;

    const entry: LogFields = {
      timestamp: this.now().toISOString(),
      level,
      message,
      ...(fields ? (sanitize(fields) as LogFields) : {}),
    };

    let serializedEntry: string;
    try {
      serializedEntry = JSON.stringify(entry);
    } catch (serializationError) {
      serializedEntry = JSON.stringify({
        timestamp: this.now().toISOString(),
        level: 'error',
        message: 'Failed to serialize log entry',
        originalMessage: message,
        error: (serializationError as Error).message,
      });
    }

    // A failed observability sink must never take down the request it reports.
    try {
      this.sink(serializedEntry);
    } catch {
      return;
    }
  }
}

/** Factory kept separate from the class so call sites can inject a test double. */
export const createStructuredLogger = (options?: StructuredLoggerOptions): StructuredLogger =>
  new StructuredLogger(options);

/** Shared application logger. Prefer injecting a logger where practical. */
export const logger = createStructuredLogger();
