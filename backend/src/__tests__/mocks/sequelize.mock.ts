// This is the definitive mock that will replace the real database connection globally.
// Jest's moduleNameMapper will redirect all imports of '../config/database' to this file.

export const sequelize = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),

  define: jest.fn(modelName => ({
    // Return a generic object with all the methods your code might call
    init: jest.fn(),
    associate: jest.fn(),
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    hasOne: jest.fn(),

    // Query methods
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    findAndCountAll: jest.fn(),
    bulkCreate: jest.fn(),

    // Instance methods
    save: jest.fn(),
    reload: jest.fn(),

    // Model metadata
    tableName: modelName.toLowerCase(),
    name: modelName,
  })),

  models: {},

  // Transaction support
  transaction: jest.fn().mockImplementation(callback => {
    const mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    if (callback) {
      return Promise.resolve(callback(mockTransaction));
    }

    return Promise.resolve(mockTransaction);
  }),

  // Query interface for migrations/seeders
  queryInterface: {
    createTable: jest.fn().mockResolvedValue(undefined),
    dropTable: jest.fn().mockResolvedValue(undefined),
    addColumn: jest.fn().mockResolvedValue(undefined),
    removeColumn: jest.fn().mockResolvedValue(undefined),
    addIndex: jest.fn().mockResolvedValue(undefined),
    removeIndex: jest.fn().mockResolvedValue(undefined),
    bulkInsert: jest.fn().mockResolvedValue(undefined),
    bulkDelete: jest.fn().mockResolvedValue(undefined),
  },

  // Utility methods
  literal: jest.fn(value => ({ val: value })),
  fn: jest.fn((name, ...args) => ({ fn: name, args })),
  col: jest.fn(column => ({ col: column })),
  where: jest.fn((attribute, comparator, logic) => ({ where: { attribute, comparator, logic } })),
};

// Export as both named and default export to handle different import styles
export default sequelize;
