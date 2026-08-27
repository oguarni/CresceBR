'use strict';

/**
 * Quotation and order fixtures.
 *
 * The initial seeder creates users and products and stops there, so a seeded
 * database had no quotations and no orders at all. That left the whole
 * quotation -> order -> shipping lifecycle unreachable: the vitest suites mock
 * the service layer, and the Playwright suite had no order to open. A defect in
 * the supplier order timeline survived exactly there, visible only to someone
 * who had already created an order by hand.
 *
 * These rows exist so the specs have something real to assert against.
 *
 * Deliberately a separate file rather than an edit to the initial seeder:
 * `seederStorage: 'sequelize'` records executed seeders, so existing databases
 * would never re-run a modified 20240101000001.
 *
 * Everything here is deterministic. Order ids are fixed UUIDs so a spec can
 * navigate straight to one, and the timestamps are literals because
 * `getOrderHistory` builds its timeline from `createdAt` and `updatedAt` — a
 * `new Date()` would make the rendered dates untestable.
 */

/** Quotation creation timestamps, also used to resolve the ids back. */
const QUOTATION_DATES = {
  pending: new Date('2026-08-01T09:00:00.000Z'),
  processed: new Date('2026-08-02T09:00:00.000Z'),
  completed: new Date('2026-08-03T09:00:00.000Z'),
  rejected: new Date('2026-08-04T09:00:00.000Z'),
};

/**
 * Fixed order ids. Version-4 shaped so they survive any UUID validation, and
 * legible enough to recognise in a failing spec's output.
 */
const ORDER_IDS = {
  pending: '11111111-1111-4111-8111-111111111111',
  processing: '22222222-2222-4222-8222-222222222222',
  shipped: '33333333-3333-4333-8333-333333333333',
  delivered: '44444444-4444-4444-8444-444444444444',
  cancelled: '55555555-5555-4555-8555-555555555555',
};

/** A real NF-e access key is exactly 44 digits; the shipped-order UI enforces it. */
const NFE_ACCESS_KEY = '35260812345678000199550010000000011000000017';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [[buyer]] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'buyer@example.com';"
    );
    const [[supplier]] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'supplier@example.com';"
    );

    if (!buyer || !supplier) {
      throw new Error(
        'Expected the initial seeder to have created buyer@example.com and supplier@example.com'
      );
    }

    // Items must reference this supplier's products: supplier order visibility
    // is resolved through order -> quotation -> items -> product.supplierId.
    const [products] = await queryInterface.sequelize.query(
      `SELECT id FROM products WHERE "supplierId" = ${supplier.id} ORDER BY id LIMIT 2;`
    );

    if (products.length < 2) {
      throw new Error(
        `Expected at least 2 products for supplier ${supplier.id}, found ${products.length}`
      );
    }

    const [firstProduct, secondProduct] = products;

    await queryInterface.bulkInsert('quotations', [
      {
        companyId: buyer.id,
        status: 'pending',
        adminNotes: null,
        totalAmount: null,
        requestedDeliveryDate: new Date('2026-09-15T00:00:00.000Z'),
        validUntil: null,
        createdAt: QUOTATION_DATES.pending,
        updatedAt: QUOTATION_DATES.pending,
      },
      {
        companyId: buyer.id,
        status: 'processed',
        adminNotes: 'Priced against the standard tier.',
        totalAmount: 1500.0,
        requestedDeliveryDate: new Date('2026-09-20T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        createdAt: QUOTATION_DATES.processed,
        updatedAt: new Date('2026-08-02T14:30:00.000Z'),
      },
      {
        companyId: buyer.id,
        status: 'completed',
        adminNotes: 'Fulfilled.',
        totalAmount: 15000.0,
        requestedDeliveryDate: new Date('2026-09-25T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        createdAt: QUOTATION_DATES.completed,
        updatedAt: new Date('2026-08-03T16:00:00.000Z'),
      },
      {
        companyId: buyer.id,
        status: 'rejected',
        adminNotes: 'Requested quantity is below the minimum order quantity.',
        totalAmount: null,
        requestedDeliveryDate: new Date('2026-09-30T00:00:00.000Z'),
        validUntil: null,
        createdAt: QUOTATION_DATES.rejected,
        updatedAt: new Date('2026-08-04T11:00:00.000Z'),
      },
    ]);

    // Resolved by createdAt rather than by assuming the serial values: the
    // sequence position depends on whatever else the database has seen.
    const [quotationRows] = await queryInterface.sequelize.query(
      `SELECT id, "createdAt" FROM quotations WHERE "companyId" = ${buyer.id};`
    );

    const quotationIdByStatus = {};
    for (const [status, date] of Object.entries(QUOTATION_DATES)) {
      const match = quotationRows.find(
        row => new Date(row.createdAt).getTime() === date.getTime()
      );
      if (!match) throw new Error(`Could not resolve the seeded ${status} quotation`);
      quotationIdByStatus[status] = match.id;
    }

    await queryInterface.bulkInsert('quotation_items', [
      {
        quotationId: quotationIdByStatus.pending,
        productId: firstProduct.id,
        quantity: 25,
        createdAt: QUOTATION_DATES.pending,
        updatedAt: QUOTATION_DATES.pending,
      },
      {
        quotationId: quotationIdByStatus.pending,
        productId: secondProduct.id,
        quantity: 2,
        createdAt: QUOTATION_DATES.pending,
        updatedAt: QUOTATION_DATES.pending,
      },
      {
        quotationId: quotationIdByStatus.processed,
        productId: firstProduct.id,
        quantity: 10,
        createdAt: QUOTATION_DATES.processed,
        updatedAt: QUOTATION_DATES.processed,
      },
      {
        quotationId: quotationIdByStatus.completed,
        productId: secondProduct.id,
        quantity: 1,
        createdAt: QUOTATION_DATES.completed,
        updatedAt: QUOTATION_DATES.completed,
      },
      {
        quotationId: quotationIdByStatus.rejected,
        productId: firstProduct.id,
        quantity: 1,
        createdAt: QUOTATION_DATES.rejected,
        updatedAt: QUOTATION_DATES.rejected,
      },
    ]);

    // One order per status the supplier screen branches on. createdAt and
    // updatedAt differ on purpose: the timeline's second entry is dated from
    // updatedAt, so identical timestamps would hide an ordering bug.
    await queryInterface.bulkInsert('orders', [
      {
        id: ORDER_IDS.pending,
        status: 'pending',
        companyId: buyer.id,
        quotationId: quotationIdByStatus.processed,
        totalAmount: 1500.0,
        estimatedDeliveryDate: null,
        trackingNumber: null,
        nfeAccessKey: null,
        nfeUrl: null,
        createdAt: new Date('2026-08-05T10:00:00.000Z'),
        updatedAt: new Date('2026-08-05T10:00:00.000Z'),
      },
      {
        id: ORDER_IDS.processing,
        status: 'processing',
        companyId: buyer.id,
        quotationId: quotationIdByStatus.processed,
        totalAmount: 1500.0,
        estimatedDeliveryDate: new Date('2026-09-20T00:00:00.000Z'),
        trackingNumber: null,
        nfeAccessKey: null,
        nfeUrl: null,
        createdAt: new Date('2026-08-06T10:00:00.000Z'),
        updatedAt: new Date('2026-08-07T15:20:00.000Z'),
      },
      {
        id: ORDER_IDS.shipped,
        status: 'shipped',
        companyId: buyer.id,
        quotationId: quotationIdByStatus.completed,
        totalAmount: 15000.0,
        estimatedDeliveryDate: new Date('2026-09-25T00:00:00.000Z'),
        trackingNumber: 'BR123456789PR',
        nfeAccessKey: NFE_ACCESS_KEY,
        nfeUrl: null,
        createdAt: new Date('2026-08-08T10:00:00.000Z'),
        updatedAt: new Date('2026-08-10T09:45:00.000Z'),
      },
      {
        id: ORDER_IDS.delivered,
        status: 'delivered',
        companyId: buyer.id,
        quotationId: quotationIdByStatus.completed,
        totalAmount: 15000.0,
        estimatedDeliveryDate: new Date('2026-08-18T00:00:00.000Z'),
        trackingNumber: 'BR987654321PR',
        nfeAccessKey: NFE_ACCESS_KEY,
        nfeUrl: null,
        createdAt: new Date('2026-08-11T10:00:00.000Z'),
        updatedAt: new Date('2026-08-18T14:05:00.000Z'),
      },
      {
        id: ORDER_IDS.cancelled,
        status: 'cancelled',
        companyId: buyer.id,
        quotationId: quotationIdByStatus.processed,
        totalAmount: 1500.0,
        estimatedDeliveryDate: null,
        trackingNumber: null,
        nfeAccessKey: null,
        nfeUrl: null,
        createdAt: new Date('2026-08-12T10:00:00.000Z'),
        updatedAt: new Date('2026-08-13T08:30:00.000Z'),
      },
    ]);
  },

  async down(queryInterface) {
    const orderIds = Object.values(ORDER_IDS)
      .map(id => `'${id}'`)
      .join(', ');

    await queryInterface.sequelize.query(`DELETE FROM orders WHERE id IN (${orderIds});`);

    const dates = Object.values(QUOTATION_DATES)
      .map(date => `'${date.toISOString()}'`)
      .join(', ');

    // Items go through the quotation ids so nothing else on the table is touched.
    await queryInterface.sequelize.query(
      `DELETE FROM quotation_items WHERE "quotationId" IN (
         SELECT id FROM quotations WHERE "createdAt" IN (${dates})
       );`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM quotations WHERE "createdAt" IN (${dates});`
    );
  },
};
