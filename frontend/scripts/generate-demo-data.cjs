/**
 * Regenerates `src/demo/data.ts` from the backend seeder.
 *
 * The hosted site runs without a backend, so its catalog has to come from
 * somewhere; taking it from `backend/seeders` keeps the demo showing exactly
 * what a real deployment would seed instead of a second, drifting copy.
 *
 * Usage: npm run demo:data
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SEEDER = path.join(ROOT, 'backend/seeders/20240101000001-initial-data.cjs');
const OUTPUT = path.join(ROOT, 'frontend/src/demo/data.ts');

/**
 * Replays the seeder against a stub `queryInterface`, capturing the rows it
 * would insert and assigning the ids Postgres would have assigned.
 */
async function collectSeedRows() {
  const tables = { users: [], products: [] };
  const nextId = { users: 1, products: 1 };

  const queryInterface = {
    async bulkInsert(table, rows) {
      if (!tables[table]) throw new Error(`Unexpected seeder table: ${table}`);
      for (const row of rows) tables[table].push({ id: nextId[table]++, ...row });
    },
    sequelize: {
      async query(sql) {
        if (/FROM users WHERE role = 'supplier'/.test(sql)) {
          return [
            tables.users
              .filter(user => user.role === 'supplier')
              .map(user => ({ id: user.id, email: user.email })),
          ];
        }
        throw new Error(`Unstubbed seeder query: ${sql}`);
      },
    },
  };

  await require(SEEDER).up(queryInterface, {});
  return tables;
}

function build({ users, products }) {
  const companyById = Object.fromEntries(users.map(user => [user.id, user]));

  // Password hashes stay out of the bundle; the demo matches the plaintext
  // fixtures that are already published on the login screen. The seeder's
  // timestamps go too — they serialize to strings, and the store sets its own.
  const companies = users.map(({ password, createdAt, updatedAt, ...company }) => company);

  const catalog = products.map(product => {
    const supplier = companyById[product.supplierId];
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      supplierId: product.supplierId,
      supplier: {
        id: supplier.id,
        companyName: supplier.companyName,
        corporateName: supplier.corporateName,
      },
      tierPricing: JSON.parse(product.tierPricing),
      specifications: JSON.parse(product.specifications),
      unitPrice: product.unitPrice,
      minimumOrderQuantity: product.minimumOrderQuantity,
      leadTime: product.leadTime,
      availability: product.availability,
    };
  });

  const serialize = rows => rows.map(row => `  ${JSON.stringify(row)},`).join('\n');

  return `/**
 * Catalog and company fixtures for the browser-side demo API.
 *
 * Generated from \`backend/seeders/20240101000001-initial-data.cjs\` so the
 * hosted demo shows exactly the data a real deployment would seed. Regenerate
 * with \`npm run demo:data\` after changing the seeder; do not hand-edit.
 */

import type { Company, Product } from '@shared/types';

/** Sign-in fixtures. Public on purpose — the same values ship in the seeder. */
export const DEMO_PASSWORDS: Record<string, string> = {
  'admin@crescebr.com': 'admin123',
  'supplier@example.com': 'supplier123',
  'supplier2@example.com': 'supplier123',
  'supplier3@example.com': 'supplier123',
  'supplier4@example.com': 'supplier123',
  'buyer@example.com': 'buyer123',
};

export const SEED_COMPANIES: Company[] = [
${serialize(companies)}
];

export const SEED_PRODUCTS: Product[] = [
${serialize(catalog)}
];
`;
}

collectSeedRows()
  .then(tables => {
    fs.writeFileSync(OUTPUT, build(tables));
    console.log(
      `Wrote ${path.relative(ROOT, OUTPUT)} (${tables.users.length} companies, ${tables.products.length} products)`
    );
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
