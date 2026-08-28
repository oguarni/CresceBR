# Backend Test Guide

## Framework & Config

- **Jest 30** with `ts-jest` preset
- Config: `backend/jest.config.js`
- Setup: `backend/src/__tests__/setup.ts`
- Test timeout: 30s
- Run: `cd backend && NODE_ENV=test npx jest --runInBand --forceExit --detectOpenHandles`

---

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                           # Global test setup (mocks DB)
│   └── integration/
│       └── setup.ts                       # Integration test setup
├── controllers/__tests__/
│   ├── adminController.test.ts            # Admin endpoints
│   ├── authController.test.ts             # Auth endpoints
│   ├── ordersController.test.ts           # Order endpoints
│   ├── productsController.test.ts         # Product endpoints
│   ├── quotationsController.test.ts       # Quotation endpoints
│   └── ratingsController.test.ts          # Rating endpoints
├── middleware/__tests__/
│   ├── auth.test.ts                       # JWT auth middleware
│   ├── errorHandler.test.ts              # Error handler
│   ├── rateLimiting.test.ts              # Rate limiting
│   └── rbac.test.ts                      # RBAC permission engine
├── models/__tests__/
│   ├── OrderStatusHistory.test.ts         # Order status model
│   ├── Product.test.ts                    # Product model
│   └── User.test.ts                       # User model
├── repositories/__tests__/
│   ├── order.repository.test.ts           # Order repo
│   ├── product.repository.test.ts         # Product repo
│   └── quotation.repository.test.ts       # Quotation repo
├── services/__tests__/
│   ├── adminService.test.ts               # Admin service
│   ├── cnpjService.test.ts                # CNPJ verification
│   ├── orderStatusService.test.ts         # Order status logic
│   ├── productsService.test.ts            # Products service
│   ├── quotationService.test.ts           # Quotation service
│   ├── quoteService.test.ts               # Quote calculation
│   └── ratingsService.test.ts             # Ratings service
├── utils/__tests__/
│   ├── csvImporter.test.ts                # CSV import utility
│   └── jwt.test.ts                        # JWT utility
└── validators/__tests__/
    ├── auth.validators.test.ts            # Auth validators
    ├── index.test.ts                      # Validator barrel exports
    ├── order.validators.test.ts           # Order validators
    └── product.validators.test.ts         # Product validators
```

---

## Coverage Report (2026-08-28)

**Suite**: 42 test suites, **1,281 tests, all passing**.

**Overall**: 99.49% statements (1,763/1,772) | 98.16% branches (1,013/1,032) | 99.11% functions (335/338).

Basis: the Clover totals written by the coverage run below. Do not copy these numbers into
another document — regenerate them, because they move with every merge.

### By Layer

| Layer        | Stmts   | Branch | Funcs   | Covered/total stmts |
| ------------ | ------- | ------ | ------- | ------------------- |
| Controllers  | 100%    | 98.54% | 100%    | 407/407             |
| Repositories | 100%    | 100%   | 100%    | 29/29               |
| Models       | 100%    | 91.67% | 100%    | 49/49               |
| Utils        | 99.63%  | 98.69% | 98.46%  | 266/267             |
| Services     | 99.52%  | 99.14% | 99.21%  | 619/622             |
| Middleware   | 99.41%  | 96.09% | 100%    | 335/337             |
| Validators   | 95.08%  | 86.67% | 83.33%  | 58/61               |

`validators` is the only layer below 99% statements; `product.validators.ts` carries the gap.
Routes no longer appear as a separate zero-coverage row, and `repositories/index.ts` — previously
the one zero-coverage file — is now fully covered.

### Known Test Issues

1. ~~**OOM**: default heap size insufficient, needs an explicit `--max-old-space-size=4096`~~ →
   Fixed: `backend/package.json`'s `test` script now sets `NODE_OPTIONS=--max-old-space-size=4096`,
   so `npm test` from `backend/` is enough.
2. ~~**Lint errors in tests**: `ratingsService.test.ts` uses `fail()` (8 occurrences)~~ → Fixed (2026-04-04)

Check current status: `cd backend && npm test`

---

## Test Patterns

### Controller Tests

Controllers are tested with mocked Sequelize models. Pattern:

```typescript
jest.mock('../../models/ModelName', () => ({
  default: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
}));
```

### Service Tests

Services mock the repository layer or model layer.

### Repository Tests

Repositories mock the Sequelize model methods directly.

---

## Writing New Tests

### Naming Convention

- File: `<source-file-name>.test.ts`
- Location: `__tests__/` directory adjacent to source
- Describe blocks: Match function/class name
- It blocks: `it('should <behavior> when <condition>')`

### Test Template

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies BEFORE imports
jest.mock('../../models/ModelName', () => ({
  default: {
    /* mocks */
  },
}));

describe('functionName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return expected result when given valid input', async () => {
    // Arrange
    // Act
    // Assert
  });

  it('should throw error when given invalid input', async () => {
    // Arrange
    // Act & Assert
    await expect(fn()).rejects.toThrow('Expected error');
  });
});
```

### Priority Test Targets

When writing new tests, prioritize:

1. Security middleware (RBAC, rate limiting) - Highest impact
2. Controllers with business logic - High user-facing impact
3. Services with complex logic - Core business rules
4. Validators - Input boundary enforcement
