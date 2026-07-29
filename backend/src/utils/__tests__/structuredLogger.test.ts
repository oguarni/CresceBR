import { StructuredLogger, createStructuredLogger, logger, LogLevel } from '../structuredLogger';

/**
 * Captures emitted lines so assertions run against real serialized output
 * rather than a mock of the sink's shape.
 */
class RecordingSink {
  public readonly lines: string[] = [];

  public readonly write = (line: string): void => {
    this.lines.push(line);
  };

  public entries(): Record<string, unknown>[] {
    return this.lines.map(line => JSON.parse(line) as Record<string, unknown>);
  }

  public lastEntry(): Record<string, unknown> {
    return this.entries()[this.lines.length - 1];
  }
}

const FIXED_NOW = new Date('2026-07-26T12:00:00.000Z');

const makeLogger = (
  minLevel: LogLevel = 'debug'
): { log: StructuredLogger; sink: RecordingSink } => {
  const sink = new RecordingSink();
  const log = new StructuredLogger({ minLevel, sink: sink.write, now: () => FIXED_NOW });
  return { log, sink };
};

describe('StructuredLogger', () => {
  describe('output format', () => {
    it('emits a single line of valid JSON per entry', () => {
      const { log, sink } = makeLogger();

      log.info('scan started');

      expect(sink.lines).toHaveLength(1);
      expect(sink.lines[0]).not.toContain('\n');
      expect(() => JSON.parse(sink.lines[0])).not.toThrow();
    });

    it('includes timestamp, level and message', () => {
      const { log, sink } = makeLogger();

      log.info('order created');

      expect(sink.lastEntry()).toMatchObject({
        timestamp: '2026-07-26T12:00:00.000Z',
        level: 'info',
        message: 'order created',
      });
    });

    it('merges structured fields into the entry', () => {
      const { log, sink } = makeLogger();

      log.info('order created', { orderId: 42, buyerId: 7 });

      expect(sink.lastEntry()).toMatchObject({ orderId: 42, buyerId: 7 });
    });

    it('works without any fields', () => {
      const { log, sink } = makeLogger();

      log.warn('cache miss');

      expect(sink.lastEntry()).toMatchObject({ level: 'warn', message: 'cache miss' });
    });
  });

  describe('levels', () => {
    it.each<[LogLevel]>([['debug'], ['info'], ['warn'], ['error']])('records level %s', level => {
      const { log, sink } = makeLogger('debug');

      log[level]('message');

      expect(sink.lastEntry().level).toBe(level);
    });

    it('drops entries below the configured minimum', () => {
      const { log, sink } = makeLogger('warn');

      log.debug('noisy');
      log.info('also noisy');

      expect(sink.lines).toHaveLength(0);
    });

    it('keeps entries at or above the configured minimum', () => {
      const { log, sink } = makeLogger('warn');

      log.warn('kept');
      log.error('kept too');

      expect(sink.entries().map(entry => entry.level)).toEqual(['warn', 'error']);
    });
  });

  describe('error serialization', () => {
    it('expands an Error into name, message and stack', () => {
      const { log, sink } = makeLogger();
      const failure = new Error('connection refused');

      log.error('database unreachable', { error: failure });

      expect(sink.lastEntry().error).toMatchObject({
        name: 'Error',
        message: 'connection refused',
      });
      expect((sink.lastEntry().error as Record<string, unknown>).stack).toBeDefined();
    });

    it('does not flatten an Error to an empty object', () => {
      // Regression guard: JSON.stringify(new Error('x')) is '{}', which would
      // discard the only useful part of the entry.
      const { log, sink } = makeLogger();

      log.error('failed', { error: new Error('the real cause') });

      expect(sink.lines[0]).toContain('the real cause');
    });

    it('expands Errors nested inside objects', () => {
      const { log, sink } = makeLogger();

      log.error('wrapped', { context: { cause: new Error('inner') } });

      const context = sink.lastEntry().context as Record<string, unknown>;
      expect(context.cause).toMatchObject({ message: 'inner' });
    });
  });

  describe('redaction', () => {
    it.each([
      ['password', 'hunter2'],
      ['senha', 'segredo'],
      ['token', 'abc.def.ghi'],
      ['authorization', 'Bearer xyz'],
      ['apiKey', 'sk-live-1'],
      ['cvv', '123'],
      ['cpf', '12345678901'],
    ])('redacts the %s field', (key, value) => {
      const { log, sink } = makeLogger();

      log.info('auth attempt', { [key]: value });

      expect(sink.lastEntry()[key]).toBe('[REDACTED]');
      expect(sink.lines[0]).not.toContain(value);
    });

    it('matches sensitive keys case-insensitively and ignores separators', () => {
      const { log, sink } = makeLogger();

      log.info('request', { USER_PASSWORD: 'hunter2', 'api-key': 'sk-1' });

      expect(sink.lastEntry().USER_PASSWORD).toBe('[REDACTED]');
      expect(sink.lastEntry()['api-key']).toBe('[REDACTED]');
    });

    it('redacts sensitive keys nested inside objects', () => {
      const { log, sink } = makeLogger();

      log.info('login', { user: { email: 'a@b.com', password: 'hunter2' } });

      const user = sink.lastEntry().user as Record<string, unknown>;
      expect(user.email).toBe('a@b.com');
      expect(user.password).toBe('[REDACTED]');
    });

    it('redacts sensitive keys inside arrays', () => {
      const { log, sink } = makeLogger();

      log.info('batch', { attempts: [{ token: 'secret-1' }] });

      const attempts = sink.lastEntry().attempts as Record<string, unknown>[];
      expect(attempts[0].token).toBe('[REDACTED]');
    });

    it('leaves non-sensitive fields untouched', () => {
      const { log, sink } = makeLogger();

      log.info('order', { orderId: 1, companyName: 'MetalPar' });

      expect(sink.lastEntry()).toMatchObject({ orderId: 1, companyName: 'MetalPar' });
    });

    it('keeps CNPJ readable, since it identifies a company and is public record', () => {
      const { log, sink } = makeLogger();

      log.info('validation', { cnpj: '12345678000190' });

      expect(sink.lastEntry().cnpj).toBe('12345678000190');
    });
  });

  describe('robustness', () => {
    it('replaces circular references instead of throwing', () => {
      const { log, sink } = makeLogger();
      const cyclic: Record<string, unknown> = { name: 'root' };
      cyclic.self = cyclic;

      expect(() => log.info('cyclic payload', { cyclic })).not.toThrow();
      expect(sink.lines[0]).toContain('[Circular]');
    });

    it('preserves primitive field types', () => {
      const { log, sink } = makeLogger();

      log.info('mixed', { count: 3, ok: true, missing: null });

      expect(sink.lastEntry()).toMatchObject({ count: 3, ok: true, missing: null });
    });

    it('degrades to a minimal entry when serialization fails', () => {
      const sink = new RecordingSink();
      const log = new StructuredLogger({
        minLevel: 'debug',
        sink: sink.write,
        now: () => FIXED_NOW,
      });
      const unserializable = {
        toJSON() {
          throw new Error('cannot serialize');
        },
      };

      expect(() => log.error('boom', { unserializable })).not.toThrow();
      expect(sink.lastEntry()).toMatchObject({
        message: 'Failed to serialize log entry',
        originalMessage: 'boom',
      });
    });

    it('does not propagate a sink failure into application code', () => {
      const failingSink = (): void => {
        throw new Error('log transport unavailable');
      };
      const log = new StructuredLogger({
        minLevel: 'debug',
        sink: failingSink,
        now: () => FIXED_NOW,
      });

      expect(() => log.error('request failed')).not.toThrow();
    });
  });

  describe('factory and shared instance', () => {
    it('createStructuredLogger returns a usable logger', () => {
      const sink = new RecordingSink();

      createStructuredLogger({ sink: sink.write, minLevel: 'debug' }).info('built');

      expect(sink.lastEntry()).toMatchObject({ message: 'built' });
    });

    it('exports a shared logger that does not throw under the test env', () => {
      expect(() => logger.info('shared instance')).not.toThrow();
    });

    it('defaults to suppressing debug entries outside development', () => {
      const sink = new RecordingSink();
      // No minLevel: falls back to 'info' because NODE_ENV is 'test'.
      const log = createStructuredLogger({ sink: sink.write });

      log.debug('should be dropped');
      log.info('should be kept');

      expect(sink.entries().map(entry => entry.message)).toEqual(['should be kept']);
    });
  });
});
