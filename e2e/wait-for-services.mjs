#!/usr/bin/env node
/**
 * Block until postgres and redis accept connections, or fail with the reason.
 *
 * `docker compose up -d` returns as soon as the containers are *created*, not
 * when postgres is ready to answer. Without this wait the backend starts, its
 * first migration is refused, and the failure surfaces as an unrelated timeout
 * in whichever spec happened to run first.
 */

import net from 'node:net';

const SERVICES = [
  { name: 'postgres', host: '127.0.0.1', port: 5432 },
  { name: 'redis', host: '127.0.0.1', port: 6379 },
];
const DEADLINE_MS = 90_000;
const POLL_MS = 500;

const portOpen = (host, port) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(2_000);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deadline = Date.now() + DEADLINE_MS;
const pending = new Map(SERVICES.map((service) => [service.name, service]));

while (pending.size > 0) {
  for (const [name, service] of [...pending]) {
    if (await portOpen(service.host, service.port)) {
      console.log(`  ${name} ready on ${service.host}:${service.port}`);
      pending.delete(name);
    }
  }
  if (pending.size === 0) break;
  if (Date.now() > deadline) {
    const stuck = [...pending.values()].map((s) => `${s.name} (${s.host}:${s.port})`).join(', ');
    console.error(`Timed out after ${DEADLINE_MS / 1000}s waiting for: ${stuck}`);
    console.error('Check `docker compose ps` and `docker compose logs db redis`.');
    process.exit(1);
  }
  await sleep(POLL_MS);
}

console.log('Services ready.');
