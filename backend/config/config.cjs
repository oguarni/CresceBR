'use strict';

// Sequelize CLI configuration (used by migrations and seeders).
// Connection details come from the environment so the same image works
// locally, in Docker Compose, and on Cloud Run.
//
//   - Local dev/test fall back to the original Docker Compose Postgres defaults.
//   - Cloud SQL via Unix socket: set DB_HOST=/cloudsql/<INSTANCE_CONNECTION_NAME>
//     (no SSL — the socket is already a private, local channel).
//   - Cloud SQL / external over TCP: set DB_HOST=<host> and DB_SSL=true.

// sequelize-cli does not load .env on its own, so every value below fell back to
// a hardcoded literal — meaning migrations connected with a password that is
// published in .env.example. Load the same file the runtime uses
// (src/config/database.ts) so the CLI and the server never disagree about the
// credential. dotenv does not overwrite variables that are already set, so the
// DB_HOST=db that Docker Compose injects still wins inside the container.
require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const isUnixSocket = host.startsWith('/cloudsql');

// No default. A fallback password is a credential committed to the source tree,
// and this one was public, so an unset DB_PASSWORD silently produced a working
// connection instead of an error. Fail loudly and say how to fix it.
const password = process.env.DB_PASSWORD;
if (!password) {
  throw new Error(
    'DB_PASSWORD is not set. sequelize-cli reads backend/.env — copy backend/.env.example to ' +
      'backend/.env and set DB_PASSWORD to the password of the database role in DB_USER.'
  );
}

const common = {
  username: process.env.DB_USER || 'postgres',
  password,
  database: process.env.DB_NAME || 'crescebr',
  host,
  port: Number(process.env.DB_PORT) || 5432,
  dialect: 'postgres',
  logging: false,
  // sequelize-cli defaults seederStorage to 'none', which means seeders are
  // never recorded and `db:seed:all` re-runs them on every invocation. Because
  // `npm run dev` chains migrate -> seed:all -> nodemon, the second start
  // against a persistent postgres volume died on
  // `Validation error: Key (email)=(admin@crescebr.com) already exists`
  // before the server ever came up. Tracking executed seeders in a table makes
  // the chain idempotent, which is what the dev script always assumed.
  seederStorage: 'sequelize',
  seederStorageTableName: 'SequelizeSeeders',
};

const sslOptions =
  !isUnixSocket && process.env.DB_SSL === 'true'
    ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
    : {};

module.exports = {
  development: { ...common },
  // Deliberately not DB_NAME: now that .env is loaded, inheriting it would aim
  // `NODE_ENV=test` migrations — including db:migrate:undo:all — at the
  // development database. TEST_DB_NAME is the explicit opt-out.
  test: { ...common, database: process.env.TEST_DB_NAME || 'crescebr_test' },
  production: { ...common, ...sslOptions },
};
