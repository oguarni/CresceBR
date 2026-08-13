import net from 'node:net';

/**
 * Refuse to run against infrastructure that is not ready.
 *
 * A suite that boots its own database silently is a suite that can wipe the one
 * you were using. This checks and reports; `npm run e2e:services` is the single
 * idempotent entrypoint that actually starts anything.
 *
 * Probes the TCP ports rather than the API, deliberately: Playwright's ordering
 * of `webServer` against `globalSetup` has changed between releases, so a hook
 * that asks the backend whether it is up is a hook that reports the wrong thing
 * on half the versions. Postgres and redis are up or they are not.
 */

const CHECKS = [
  {
    name: 'postgres',
    host: process.env.E2E_DB_HOST ?? '127.0.0.1',
    port: Number(process.env.E2E_DB_PORT ?? 5432),
  },
  {
    name: 'redis',
    host: process.env.E2E_REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.E2E_REDIS_PORT ?? 6379),
  },
];

function portOpen(host: string, port: number, timeoutMs = 2_000): Promise<boolean> {
  return new Promise(resolve => {
    const socket = new net.Socket();
    const done = (result: boolean) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

export default async function globalSetup(): Promise<void> {
  const results = await Promise.all(
    CHECKS.map(async check => ({ ...check, up: await portOpen(check.host, check.port) }))
  );
  const down = results.filter(result => !result.up);
  if (down.length === 0) return;

  throw new Error(
    [
      `Missing service(s): ${down.map(d => `${d.name} (${d.host}:${d.port})`).join(', ')}`,
      '',
      'End-to-end tests need postgres and redis up, migrated and seeded:',
      '',
      '    npm run e2e:services',
      '',
      'That command is idempotent — running it twice is safe.',
    ].join('\n')
  );
}
