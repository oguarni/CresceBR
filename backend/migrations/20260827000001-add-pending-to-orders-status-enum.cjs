'use strict';

/**
 * Adds 'pending' to the orders status enum.
 *
 * 20240102000000 created the type as ('processing','shipped','delivered',
 * 'cancelled'), but the rest of the codebase treats 'pending' as the state an
 * order starts in: the Order model declares it and defaults to it,
 * orderService.createOrder writes it explicitly, orderStatusService's
 * transition table has pending -> processing and pending -> cancelled,
 * getOrderHistory always emits a 'pending' timeline entry, and the shared
 * Order['status'] union includes it.
 *
 * The consequence was that every POST /orders failed with
 * `invalid input value for enum enum_orders_status: "pending"`, so no order
 * could be placed at all. The migration is the outlier here, which is why this
 * adds the value rather than removing 'pending' from five call sites and
 * changing what the state machine means.
 *
 * Not wrapped in a transaction on purpose: Postgres will not let a newly added
 * enum value be *used* by the same transaction that added it, and the default
 * below uses it.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TYPE enum_orders_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'processing';"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';"
    );
  },

  async down(queryInterface) {
    // Postgres cannot remove a value from an enum, so reversing means building
    // the old type again and re-casting the column onto it.
    await queryInterface.sequelize.query(
      "ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;"
    );
    await queryInterface.sequelize.query(
      "UPDATE orders SET status = 'processing' WHERE status = 'pending';"
    );
    await queryInterface.sequelize.query(
      'ALTER TYPE enum_orders_status RENAME TO enum_orders_status_old;'
    );
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_orders_status AS ENUM ('processing', 'shipped', 'delivered', 'cancelled');"
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE orders ALTER COLUMN status TYPE enum_orders_status ' +
        'USING status::text::enum_orders_status;'
    );
    await queryInterface.sequelize.query('DROP TYPE enum_orders_status_old;');
    await queryInterface.sequelize.query(
      "ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'processing';"
    );
  },
};
