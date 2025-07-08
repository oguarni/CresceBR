module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/config/**',
    '!src/models/index.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,

  // Globally redirect database imports to our mock
  moduleNameMapper: {
    '^../config/database$': '<rootDir>/src/__tests__/mocks/sequelize.mock.ts',
    '^../../config/database$': '<rootDir>/src/__tests__/mocks/sequelize.mock.ts',
    '^../../../config/database$': '<rootDir>/src/__tests__/mocks/sequelize.mock.ts',
  },
};
