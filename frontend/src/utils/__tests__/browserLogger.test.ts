import { describe, it, expect, vi } from 'vitest';
import {
  BrowserLogger,
  createBrowserLogger,
  browserLogger,
  BrowserLogLevel,
} from '../browserLogger';

/** Captures emitted entries so assertions run against real serialized output. */
class RecordingSink {
  public readonly calls: { level: BrowserLogLevel; payload: string }[] = [];

  public readonly write = (level: BrowserLogLevel, payload: string): void => {
    this.calls.push({ level, payload });
  };

  public lastEntry(): Record<string, unknown> {
    return JSON.parse(this.calls[this.calls.length - 1].payload) as Record<string, unknown>;
  }
}

const FIXED_NOW = new Date('2026-07-26T12:00:00.000Z');

const makeLogger = (): { log: BrowserLogger; sink: RecordingSink } => {
  const sink = new RecordingSink();
  return { log: new BrowserLogger({ sink: sink.write, now: () => FIXED_NOW }), sink };
};

describe('BrowserLogger', () => {
  it('emits valid JSON with timestamp, level and message', () => {
    const { log, sink } = makeLogger();

    log.info('cart loaded');

    expect(sink.lastEntry()).toMatchObject({
      timestamp: '2026-07-26T12:00:00.000Z',
      level: 'info',
      message: 'cart loaded',
    });
  });

  it('merges structured fields into the entry', () => {
    const { log, sink } = makeLogger();

    log.warn('slow response', { ms: 1200 });

    expect(sink.lastEntry()).toMatchObject({ ms: 1200 });
  });

  it.each<[BrowserLogLevel]>([['debug'], ['info'], ['warn'], ['error']])(
    'records level %s',
    level => {
      const { log, sink } = makeLogger();

      log[level]('message');

      expect(sink.lastEntry().level).toBe(level);
      expect(sink.calls[0].level).toBe(level);
    }
  );

  it('expands an Error rather than flattening it to an empty object', () => {
    const { log, sink } = makeLogger();

    log.error('request failed', { error: new Error('network down') });

    expect(sink.lastEntry().error).toMatchObject({ name: 'Error', message: 'network down' });
    expect(sink.calls[0].payload).toContain('network down');
  });

  it('expands Errors nested inside objects', () => {
    const { log, sink } = makeLogger();

    log.error('wrapped', { context: { cause: new Error('inner') } });

    const context = sink.lastEntry().context as Record<string, unknown>;
    expect(context.cause).toMatchObject({ message: 'inner' });
  });

  it.each([
    ['password', 'hunter2'],
    ['token', 'abc.def'],
    ['cpf', '12345678901'],
  ])('redacts the %s field', (key, value) => {
    const { log, sink } = makeLogger();

    log.info('attempt', { [key]: value });

    expect(sink.lastEntry()[key]).toBe('[REDACTED]');
    expect(sink.calls[0].payload).not.toContain(value);
  });

  it('redacts sensitive keys nested inside objects', () => {
    const { log, sink } = makeLogger();

    log.info('login', { user: { email: 'a@b.com', password: 'hunter2' } });

    const user = sink.lastEntry().user as Record<string, unknown>;
    expect(user.email).toBe('a@b.com');
    expect(user.password).toBe('[REDACTED]');
  });

  it('leaves non-sensitive fields untouched', () => {
    const { log, sink } = makeLogger();

    log.info('order', { orderId: 7, companyName: 'MetalPar' });

    expect(sink.lastEntry()).toMatchObject({ orderId: 7, companyName: 'MetalPar' });
  });

  it('replaces circular references instead of throwing', () => {
    const { log, sink } = makeLogger();
    const cyclic: Record<string, unknown> = { name: 'root' };
    cyclic.self = cyclic;

    expect(() => log.info('cyclic', { cyclic })).not.toThrow();
    expect(sink.calls[0].payload).toContain('[Circular]');
  });

  it('falls back to a minimal entry when serialization fails', () => {
    const sink = new RecordingSink();
    const log = new BrowserLogger({ sink: sink.write, now: () => FIXED_NOW });
    const unserializable = {
      toJSON() {
        throw new Error('cannot serialize');
      },
    };

    expect(() => log.error('boom', { unserializable })).not.toThrow();
    expect(sink.lastEntry()).toMatchObject({ level: 'error', message: 'boom' });
  });

  it('does not propagate a sink failure into the render path', () => {
    const failingSink = (): void => {
      throw new Error('browser console unavailable');
    };
    const log = new BrowserLogger({ sink: failingSink, now: () => FIXED_NOW });

    expect(() => log.error('render failed')).not.toThrow();
  });

  it('routes each level to the matching console method by default', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const log = createBrowserLogger();
    log.error('e');
    log.warn('w');
    log.info('i');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it('exports a shared logger that does not throw', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => browserLogger.error('shared')).not.toThrow();

    spy.mockRestore();
  });
});
