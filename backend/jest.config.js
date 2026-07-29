export default {
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
    '!src/routes/**',
    '!src/__tests__/setup.ts',
    '!src/__tests__/integration/**',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  // Set just below the levels actually measured (99.75 lines / 99.7 stmts /
  // 99.31 funcs / 96.88 branches) so a regression fails the build instead of
  // going unnoticed. Raise these when coverage rises; never lower them to make
  // a build pass.
  coverageThreshold: {
    global: {
      lines: 99,
      statements: 99,
      functions: 99,
      branches: 95,
    },
  },
  verbose: true,
};
