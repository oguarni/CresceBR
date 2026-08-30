import { Request, Response, NextFunction } from 'express';

// Store original NODE_ENV so we can restore it
const originalNodeEnv = process.env.NODE_ENV;
const originalDisableRateLimit = process.env.DISABLE_RATE_LIMIT;
const originalTrustedProxyHops = process.env.TRUSTED_PROXY_HOPS;

// Stateful per-key counter mock for Redis
let mockStore: Record<string, number> = {};
const mockRedis = {
  incr: jest.fn().mockImplementation((key: string) => {
    mockStore[key] = (mockStore[key] || 0) + 1;
    return Promise.resolve(mockStore[key]);
  }),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(3600),
};

// Override the global redis mock with a stateful one
jest.mock('../../config/redis', () => ({
  getRedisClient: jest.fn(() => mockRedis),
  closeRedisConnection: jest.fn().mockResolvedValue(undefined),
}));

// Helper to create fresh mock objects for each test
const createMockReq = (overrides: Partial<Request> = {}): Request => {
  return {
    ip: '127.0.0.1',
    headers: {},
    connection: { remoteAddress: '127.0.0.1' },
    user: undefined,
    ...overrides,
  } as any;
};

const createMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn(),
  } as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
    set: jest.Mock;
  };
  return res;
};

// Flush the microtask queue enough times to drain all pending async operations
// in the rate limiter (which uses 3 sequential awaits: incr, expire, ttl).
const flushMicrotasks = () =>
  Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => Promise.resolve())
    .then(() => Promise.resolve())
    .then(() => Promise.resolve());

// Async helper: calls middleware and waits for it to finish async Redis ops.
const runMiddleware = async (
  middleware: Function,
  req: Request,
  res: ReturnType<typeof createMockRes>,
  mockNext: jest.Mock
): Promise<void> => {
  middleware(req, res, mockNext);
  await flushMicrotasks();
};

import {
  generalRateLimit,
  authRateLimit,
  searchRateLimit,
  uploadRateLimit,
  cnpjValidationRateLimit,
  quoteRateLimit,
  adminRateLimit,
  emailRateLimit,
  exportRateLimit,
  burstRateLimit,
  createCustomRateLimit,
  progressiveRateLimit,
  rateLimiter,
  getClientIp,
  trustedProxyHops,
} from '../rateLimiting';

describe('Rate Limiting Middleware', () => {
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
    mockStore = {};
    jest.clearAllMocks();
    // Re-bind incr to fresh store after clearAllMocks
    mockRedis.incr.mockImplementation((key: string) => {
      mockStore[key] = (mockStore[key] || 0) + 1;
      return Promise.resolve(mockStore[key]);
    });
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(3600);
    delete process.env.DISABLE_RATE_LIMIT;
    delete process.env.TRUSTED_PROXY_HOPS;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalDisableRateLimit === undefined) {
      delete process.env.DISABLE_RATE_LIMIT;
    } else {
      process.env.DISABLE_RATE_LIMIT = originalDisableRateLimit;
    }
    if (originalTrustedProxyHops === undefined) {
      delete process.env.TRUSTED_PROXY_HOPS;
    } else {
      process.env.TRUSTED_PROXY_HOPS = originalTrustedProxyHops;
    }
  });

  afterAll(() => {
    rateLimiter.destroy();
  });

  // ---------------------------------------------------------------
  // getClientIp — resolves the originating client IP for rate-limit keys
  // ---------------------------------------------------------------
  describe('getClientIp', () => {
    // Regression: keying on the left-most X-Forwarded-For entry let any client
    // mint a fresh rate-limit bucket per request by rotating one header value,
    // because GCP appends to a client-supplied XFF instead of replacing it.
    it('ignores a client-forged left-most X-Forwarded-For entry', () => {
      const req = createMockReq({
        ip: '203.0.113.7',
        headers: { 'x-forwarded-for': '198.18.0.1, 203.0.113.7, 10.0.0.1' },
      });
      expect(getClientIp(req)).toBe('203.0.113.7');
    });

    it('yields the same key no matter what the client puts in X-Forwarded-For', () => {
      const attacker = (spoofed: string) =>
        getClientIp(
          createMockReq({
            ip: '203.0.113.7',
            headers: { 'x-forwarded-for': `${spoofed}, 203.0.113.7, 10.0.0.1` },
          })
        );

      expect(attacker('198.18.0.1')).toBe(attacker('198.18.0.2'));
      expect(attacker('198.18.0.1')).toBe('203.0.113.7');
    });

    it('counts trusted hops from the right when Express has not resolved req.ip', () => {
      const req = createMockReq({
        ip: undefined,
        headers: { 'x-forwarded-for': '198.18.0.1, 203.0.113.7, 10.0.0.1' },
      });
      // One trusted hop (10.0.0.1) is dropped; the entry it reported is the client.
      expect(getClientIp(req)).toBe('203.0.113.7');
    });

    it('should use the configured trusted proxy hop count', () => {
      process.env.TRUSTED_PROXY_HOPS = '2';
      const req = createMockReq({
        ip: undefined,
        headers: { 'x-forwarded-for': '198.18.0.1, 203.0.113.7, 10.0.0.1' },
      });

      expect(trustedProxyHops()).toBe(2);
      expect(getClientIp(req)).toBe('198.18.0.1');
    });

    it.each(['-1', 'not-a-number'])(
      'should fall back to one trusted proxy hop for invalid configuration (%s)',
      configuredHops => {
        process.env.TRUSTED_PROXY_HOPS = configuredHops;

        expect(trustedProxyHops()).toBe(1);
      }
    );

    it('should use the first forwarded address when the chain is shorter than the trusted hop count', () => {
      process.env.TRUSTED_PROXY_HOPS = '3';
      const req = createMockReq({
        ip: undefined,
        headers: { 'x-forwarded-for': '203.0.113.9' },
      });

      expect(getClientIp(req)).toBe('203.0.113.9');
    });

    it('should ignore an empty forwarded chain and fall back to the socket address', () => {
      const req = createMockReq({
        ip: undefined,
        headers: { 'x-forwarded-for': '   ' },
      });
      Object.defineProperty(req, 'socket', {
        value: { remoteAddress: '192.0.2.45' },
      });

      expect(getClientIp(req)).toBe('192.0.2.45');
    });

    it('handles X-Forwarded-For provided as an array', () => {
      const req = createMockReq({
        ip: undefined,
        headers: { 'x-forwarded-for': ['203.0.113.9', '10.0.0.1'] },
      });
      expect(getClientIp(req)).toBe('203.0.113.9');
    });

    it('prefers req.ip, which Express derives from the trust-proxy setting', () => {
      expect(getClientIp(createMockReq({ ip: '198.51.100.5' }))).toBe('198.51.100.5');
    });

    it('falls back to socket.remoteAddress when req.ip is missing', () => {
      const req = createMockReq({ ip: undefined });
      (req as any).socket = { remoteAddress: '192.0.2.44' };
      expect(getClientIp(req)).toBe('192.0.2.44');
    });

    it("returns 'unknown' when no IP source is available", () => {
      const req = createMockReq({ ip: undefined });
      (req as any).socket = undefined;
      (req as any).connection = undefined;
      expect(getClientIp(req)).toBe('unknown');
    });
  });

  // ---------------------------------------------------------------
  // RateLimiter.createLimiter core behavior
  // ---------------------------------------------------------------
  describe('RateLimiter.createLimiter', () => {
    it('should allow request under limit and call next()', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 5 });
      const req = createMockReq({ ip: '200.0.0.1' });
      const res = createMockRes();

      await runMiddleware(limiter, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should bypass Redis entirely when rate limiting is disabled', async () => {
      process.env.DISABLE_RATE_LIMIT = 'true';
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 1 });
      const req = createMockReq({ ip: '200.0.0.17' });
      const res = createMockRes();

      await runMiddleware(limiter, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRedis.incr).not.toHaveBeenCalled();
      expect(res.set).not.toHaveBeenCalled();
    });

    it('should set rate limit headers on every request', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 10 });
      const req = createMockReq({ ip: '200.0.0.2' });
      const res = createMockRes();

      await runMiddleware(limiter, req, res, mockNext);

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '9',
        })
      );
      const setCall = (res.set as jest.Mock).mock.calls[0][0];
      expect(Number(setCall['X-RateLimit-Reset'])).not.toBeNaN();
    });

    it('should return 429 when limit is exceeded', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 2 });
      const req = createMockReq({ ip: '200.0.0.3' });

      for (let i = 0; i < 3; i++) {
        const res = createMockRes();
        await runMiddleware(limiter, req, res, mockNext);
        if (i < 2) {
          expect(res.status).not.toHaveBeenCalled();
        } else {
          expect(res.status).toHaveBeenCalledWith(429);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, retryAfter: expect.any(Number) })
          );
        }
      }

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should use custom message when provided', async () => {
      const customMsg = 'Custom rate limit exceeded message';
      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        message: customMsg,
      });
      const req = createMockReq({ ip: '200.0.0.4' });

      await runMiddleware(limiter, req, createMockRes(), mockNext);
      const res = createMockRes();
      await runMiddleware(limiter, req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: customMsg }));
    });

    it('should use default message when not provided', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 1 });
      const req = createMockReq({ ip: '200.0.0.5' });

      await runMiddleware(limiter, req, createMockRes(), mockNext);
      const res = createMockRes();
      await runMiddleware(limiter, req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Too many requests. Please try again later.' })
      );
    });

    it('should use windowSeconds as fallback when ttl is zero', async () => {
      mockRedis.ttl.mockResolvedValueOnce(0); // ttl <= 0
      const windowMs = 60000;
      const windowSeconds = windowMs / 1000;
      const limiter = createCustomRateLimit({ windowMs, maxRequests: 5 });
      const req = createMockReq({ ip: '200.1.0.1' });
      const res = createMockRes();

      await runMiddleware(limiter, req, res, mockNext);

      const setCall = (res.set as jest.Mock).mock.calls[0][0];
      const resetTime = Number(setCall['X-RateLimit-Reset']);
      const expectedMin = Math.ceil(Date.now() / 1000) + windowSeconds - 1;
      expect(resetTime).toBeGreaterThanOrEqual(expectedMin);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should use windowSeconds as retryAfter when ttl is negative on 429', async () => {
      const windowMs = 60000;
      const windowSeconds = windowMs / 1000;
      const limiter = createCustomRateLimit({ windowMs, maxRequests: 1 });
      const req = createMockReq({ ip: '200.1.0.2' });

      // First request passes normally
      await runMiddleware(limiter, req, createMockRes(), mockNext);

      // Second request — ttl returns -1 (key expired or doesn't exist)
      mockRedis.ttl.mockResolvedValueOnce(-1);
      const res = createMockRes();
      await runMiddleware(limiter, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(429);
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.retryAfter).toBe(windowSeconds);
    });

    it('should reset counter when store is cleared (window expiry simulation)', async () => {
      const limiter = createCustomRateLimit({ windowMs: 5000, maxRequests: 1 });
      const req = createMockReq({ ip: '200.0.0.6' });

      await runMiddleware(limiter, req, createMockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      const blockedRes = createMockRes();
      await runMiddleware(limiter, req, blockedRes, mockNext);
      expect(blockedRes.status).toHaveBeenCalledWith(429);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Simulate Redis TTL expiry by clearing the store
      mockStore = {};

      const passRes = createMockRes();
      await runMiddleware(limiter, req, passRes, mockNext);
      expect(passRes.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should skip rate limiting when skipIf returns true', async () => {
      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        skipIf: () => true,
      });
      const req = createMockReq({ ip: '200.0.0.7' });
      const res = createMockRes();

      for (let i = 0; i < 5; i++) {
        await runMiddleware(limiter, req, res, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should not skip when skipIf returns false', async () => {
      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        skipIf: () => false,
      });
      const req = createMockReq({ ip: '200.0.0.8' });

      await runMiddleware(limiter, req, createMockRes(), mockNext);
      const res = createMockRes();
      await runMiddleware(limiter, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should use custom keyGenerator when provided', async () => {
      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (req: Request) => `custom:${(req as any).customField}`,
      });

      const req1 = createMockReq({ ip: '200.0.0.9' });
      (req1 as any).customField = 'A';
      const req2 = createMockReq({ ip: '200.0.0.9' });
      (req2 as any).customField = 'B';

      await runMiddleware(limiter, req1, createMockRes(), mockNext);
      await runMiddleware(limiter, req2, createMockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);

      const res = createMockRes();
      await runMiddleware(limiter, req1, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should use default key generator (IP + userId)', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 1 });

      const req1 = createMockReq({ ip: '200.0.0.10' });
      const req2 = createMockReq({ ip: '200.0.0.10' });

      await runMiddleware(limiter, req1, createMockRes(), mockNext);
      const res = createMockRes();
      await runMiddleware(limiter, req2, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(429);

      const req3 = createMockReq({ ip: '200.0.0.11' });
      await runMiddleware(limiter, req3, createMockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should differentiate by userId in default key generator', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 1 });

      const reqUser1 = createMockReq({ ip: '200.0.0.12' });
      (reqUser1 as any).user = { id: 1 };
      const reqUser2 = createMockReq({ ip: '200.0.0.12' });
      (reqUser2 as any).user = { id: 2 };

      await runMiddleware(limiter, reqUser1, createMockRes(), mockNext);
      await runMiddleware(limiter, reqUser2, createMockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should handle missing IP address gracefully', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 5 });
      const req = createMockReq();
      (req as any).ip = undefined;
      (req as any).connection = { remoteAddress: undefined };
      const res = createMockRes();

      await runMiddleware(limiter, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Remaining': '4' })
      );
    });

    it('should fall back to connection.remoteAddress when req.ip is missing', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 1 });
      const req = createMockReq();
      (req as any).ip = undefined;
      (req as any).connection = { remoteAddress: '10.10.10.10' };

      await runMiddleware(limiter, req, createMockRes(), mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should increment counter on each request', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 5 });
      const req = createMockReq({ ip: '200.0.0.13' });

      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        await runMiddleware(limiter, req, res, mockNext);
        const remaining = 5 - (i + 1);
        expect(res.set).toHaveBeenCalledWith(
          expect.objectContaining({ 'X-RateLimit-Remaining': Math.max(0, remaining).toString() })
        );
      }
    });

    it('should set X-RateLimit-Remaining to 0 when limit is exceeded', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 1 });
      const req = createMockReq({ ip: '200.0.0.14' });

      await runMiddleware(limiter, req, createMockRes(), mockNext);
      const res = createMockRes();
      await runMiddleware(limiter, req, res, mockNext);

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Remaining': '0' })
      );
    });

    it('should include retryAfter in 429 response', async () => {
      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 1 });
      const req = createMockReq({ ip: '200.0.0.15' });

      await runMiddleware(limiter, req, createMockRes(), mockNext);
      const res = createMockRes();
      await runMiddleware(limiter, req, res, mockNext);

      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.retryAfter).toBeGreaterThan(0);
    });

    it('should fail open (call next) when Redis errors', async () => {
      mockRedis.incr.mockRejectedValueOnce(new Error('Redis connection failed'));

      const limiter = createCustomRateLimit({ windowMs: 60000, maxRequests: 5 });
      const req = createMockReq({ ip: '200.0.0.16' });
      const res = createMockRes();

      await runMiddleware(limiter, req, res, mockNext);

      // Should still call next (fail open for availability)
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // destroy tests
  // ---------------------------------------------------------------
  describe('destroy', () => {
    it('should not throw (is a no-op, Redis TTL handles cleanup)', () => {
      expect(() => rateLimiter.destroy()).not.toThrow();
    });

    it('should have a destroy method', () => {
      expect(typeof rateLimiter.destroy).toBe('function');
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: generalRateLimit
  // ---------------------------------------------------------------
  describe('generalRateLimit', () => {
    it('should be a middleware function', () => {
      expect(typeof generalRateLimit).toBe('function');
    });

    it('should allow requests under the 1000 request limit', async () => {
      const req = createMockReq({ ip: '201.0.0.1' });
      const res = createMockRes();

      await runMiddleware(generalRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Limit': '1000' })
      );
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: authRateLimit
  // ---------------------------------------------------------------
  describe('authRateLimit', () => {
    it('should be a middleware function', () => {
      expect(typeof authRateLimit).toBe('function');
    });

    it('should allow requests within limit', async () => {
      const req = createMockReq({ ip: '201.0.0.2' });
      const res = createMockRes();

      await runMiddleware(authRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should use custom key based on IP with auth prefix', async () => {
      const req1 = createMockReq({ ip: '201.0.0.3' });
      const req2 = createMockReq({ ip: '201.0.0.4' });

      await runMiddleware(authRateLimit, req1, createMockRes(), mockNext);
      await runMiddleware(authRateLimit, req2, createMockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should fall back to connection.remoteAddress in auth key when req.ip is missing', async () => {
      const req = createMockReq();
      (req as any).ip = undefined;
      (req as any).connection = { remoteAddress: '192.168.88.1' };
      const res = createMockRes();

      await runMiddleware(authRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should use unknown IP in auth key when all IP sources are missing', async () => {
      const req = createMockReq();
      (req as any).ip = undefined;
      (req as any).connection = { remoteAddress: undefined };
      const res = createMockRes();

      await runMiddleware(authRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should use five requests in the test environment', async () => {
      const req = createMockReq({ ip: '201.0.0.5' });
      const res = createMockRes();

      await runMiddleware(authRateLimit, req, res, mockNext);

      const setCall = (res.set as jest.Mock).mock.calls[0][0];
      const limit = parseInt(setCall['X-RateLimit-Limit'], 10);
      expect(limit).toBe(5);
    });

    it('should use 100 max requests when NODE_ENV is development', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      let devAuthRateLimit: any;
      let devRateLimiter: any;

      jest.isolateModules(() => {
        const mod = require('../rateLimiting');
        devAuthRateLimit = mod.authRateLimit;
        devRateLimiter = mod.rateLimiter;
      });

      const req = createMockReq({ ip: '201.0.0.99' });
      const res = createMockRes();

      await runMiddleware(devAuthRateLimit, req, res, mockNext);

      const setCall = (res.set as jest.Mock).mock.calls[0][0];
      expect(setCall['X-RateLimit-Limit']).toBe('100');

      devRateLimiter.destroy();
      process.env.NODE_ENV = prevEnv;
    });

    it('should use 200 max requests when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      let productionAuthRateLimit!: typeof authRateLimit;
      let productionRateLimiter!: typeof rateLimiter;

      jest.isolateModules(() => {
        const mod = require('../rateLimiting') as typeof import('../rateLimiting');
        productionAuthRateLimit = mod.authRateLimit;
        productionRateLimiter = mod.rateLimiter;
      });

      const req = createMockReq({ ip: '201.0.0.100' });
      const res = createMockRes();

      await runMiddleware(productionAuthRateLimit, req, res, mockNext);

      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '200' }));

      productionRateLimiter.destroy();
    });

    it('should let AUTH_RATE_LIMIT_MAX override the environment default', async () => {
      const prevOverride = process.env.AUTH_RATE_LIMIT_MAX;
      process.env.AUTH_RATE_LIMIT_MAX = '500';

      let overriddenAuthRateLimit: any;
      let overriddenRateLimiter: any;

      jest.isolateModules(() => {
        const mod = require('../rateLimiting');
        overriddenAuthRateLimit = mod.authRateLimit;
        overriddenRateLimiter = mod.rateLimiter;
      });

      const req = createMockReq({ ip: '201.0.0.101' });
      const res = createMockRes();

      await runMiddleware(overriddenAuthRateLimit, req, res, mockNext);

      const setCall = (res.set as jest.Mock).mock.calls[0][0];
      expect(setCall['X-RateLimit-Limit']).toBe('500');

      overriddenRateLimiter.destroy();
      if (prevOverride === undefined) {
        delete process.env.AUTH_RATE_LIMIT_MAX;
      } else {
        process.env.AUTH_RATE_LIMIT_MAX = prevOverride;
      }
    });

    it.each([['0'], ['-1'], ['abc'], ['']])(
      'should ignore a non-positive-integer AUTH_RATE_LIMIT_MAX (%s)',
      async value => {
        const prevOverride = process.env.AUTH_RATE_LIMIT_MAX;
        process.env.AUTH_RATE_LIMIT_MAX = value;

        let limiterUnderTest: any;
        let limiterModule: any;

        jest.isolateModules(() => {
          const mod = require('../rateLimiting');
          limiterUnderTest = mod.authRateLimit;
          limiterModule = mod.rateLimiter;
        });

        const req = createMockReq({ ip: `201.0.1.${value.length}` });
        const res = createMockRes();

        await runMiddleware(limiterUnderTest, req, res, mockNext);

        // Falls through to the NODE_ENV=test default rather than to 0, which
        // would lock every account out on the first attempt.
        const setCall = (res.set as jest.Mock).mock.calls[0][0];
        expect(setCall['X-RateLimit-Limit']).toBe('5');

        limiterModule.destroy();
        if (prevOverride === undefined) {
          delete process.env.AUTH_RATE_LIMIT_MAX;
        } else {
          process.env.AUTH_RATE_LIMIT_MAX = prevOverride;
        }
      }
    );
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: searchRateLimit
  // ---------------------------------------------------------------
  describe('searchRateLimit', () => {
    it('should be a middleware function with 200 request limit', async () => {
      const req = createMockReq({ ip: '202.0.0.1' });
      const res = createMockRes();

      await runMiddleware(searchRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '200' }));
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: uploadRateLimit
  // ---------------------------------------------------------------
  describe('uploadRateLimit', () => {
    it('should be a middleware function with 10 request limit', async () => {
      const req = createMockReq({ ip: '203.0.0.1' });
      const res = createMockRes();

      await runMiddleware(uploadRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '10' }));
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: cnpjValidationRateLimit
  // ---------------------------------------------------------------
  describe('cnpjValidationRateLimit', () => {
    it('should be a middleware function with 20 request limit', async () => {
      const req = createMockReq({ ip: '204.0.0.1' });
      const res = createMockRes();

      await runMiddleware(cnpjValidationRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '20' }));
    });

    it('should use custom key with cnpj prefix, IP and userId', async () => {
      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (req: Request) => {
          const ip = req.ip || (req as any).connection.remoteAddress || 'unknown';
          const userId = (req as any).user?.id || 'anonymous';
          return `cnpj:${ip}:${userId}`;
        },
      });

      const req1 = createMockReq({ ip: '204.0.0.2' });
      (req1 as any).user = { id: 10 };
      const req2 = createMockReq({ ip: '204.0.0.2' });
      (req2 as any).user = { id: 20 };

      await runMiddleware(limiter, req1, createMockRes(), mockNext);
      await runMiddleware(limiter, req2, createMockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should fall back to connection.remoteAddress in cnpj key when req.ip is missing', async () => {
      const req = createMockReq();
      (req as any).ip = undefined;
      (req as any).connection = { remoteAddress: '192.168.99.1' };
      (req as any).user = { id: 777 };
      const res = createMockRes();

      await runMiddleware(cnpjValidationRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should use unknown IP and anonymous user in cnpj key when both are missing', async () => {
      const req = createMockReq();
      (req as any).ip = undefined;
      (req as any).connection = { remoteAddress: undefined };
      const res = createMockRes();

      await runMiddleware(cnpjValidationRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: quoteRateLimit
  // ---------------------------------------------------------------
  describe('quoteRateLimit', () => {
    it('should be a middleware function with 100 request limit', async () => {
      const req = createMockReq({ ip: '205.0.0.1' });
      const res = createMockRes();

      await runMiddleware(quoteRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '100' }));
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: adminRateLimit
  // ---------------------------------------------------------------
  describe('adminRateLimit', () => {
    it('should be a middleware function with 500 request limit', async () => {
      const req = createMockReq({ ip: '206.0.0.1' });
      (req as any).user = { email: 'regular@example.com' };
      const res = createMockRes();
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await runMiddleware(adminRateLimit, req, res, mockNext);

      process.env.NODE_ENV = prevEnv;

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '500' }));
    });

    it('should skip rate limiting for admin@crescebr.com', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        skipIf: (req: Request) => {
          const user = (req as any).user;
          return process.env.NODE_ENV === 'development' || user?.email === 'admin@crescebr.com';
        },
      });

      const req = createMockReq({ ip: '206.0.0.2' });
      (req as any).user = { email: 'admin@crescebr.com' };

      for (let i = 0; i < 5; i++) {
        await runMiddleware(limiter, req, createMockRes(), mockNext);
      }

      process.env.NODE_ENV = prevEnv;
      expect(mockNext).toHaveBeenCalledTimes(5);
    });

    it('should skip rate limiting in development mode', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        skipIf: () => process.env.NODE_ENV === 'development',
      });

      const req = createMockReq({ ip: '206.0.0.3' });
      for (let i = 0; i < 5; i++) {
        await runMiddleware(limiter, req, createMockRes(), mockNext);
      }

      process.env.NODE_ENV = prevEnv;
      expect(mockNext).toHaveBeenCalledTimes(5);
    });

    it('should NOT skip for non-admin users in production', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        skipIf: (req: Request) => {
          const user = (req as any).user;
          return process.env.NODE_ENV === 'development' || user?.email === 'admin@crescebr.com';
        },
      });

      const req = createMockReq({ ip: '206.0.0.4' });
      (req as any).user = { email: 'regular@example.com' };

      await runMiddleware(limiter, req, createMockRes(), mockNext);
      const res = createMockRes();
      await runMiddleware(limiter, req, res, mockNext);

      process.env.NODE_ENV = prevEnv;

      expect(res.status).toHaveBeenCalledWith(429);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: emailRateLimit
  // ---------------------------------------------------------------
  describe('emailRateLimit', () => {
    it('should be a middleware function with 5 request limit', async () => {
      const req = createMockReq({ ip: '207.0.0.1' });
      (req as any).user = { id: 999 };
      const res = createMockRes();

      await runMiddleware(emailRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '5' }));
    });

    it('should use user-based key (email prefix)', async () => {
      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (req: Request) => {
          const userId = (req as any).user?.id || 'anonymous';
          return `email:${userId}`;
        },
      });

      const req1 = createMockReq({ ip: '207.0.0.2' });
      (req1 as any).user = { id: 100 };
      const req2 = createMockReq({ ip: '207.0.0.2' });
      (req2 as any).user = { id: 200 };

      await runMiddleware(limiter, req1, createMockRes(), mockNext);
      await runMiddleware(limiter, req2, createMockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should use anonymous key when user is not set', async () => {
      const req = createMockReq({ ip: '207.0.0.3' });
      const res = createMockRes();

      await runMiddleware(emailRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: exportRateLimit
  // ---------------------------------------------------------------
  describe('exportRateLimit', () => {
    it('should be a middleware function with 10 request limit', async () => {
      const req = createMockReq({ ip: '208.0.0.1' });
      const res = createMockRes();

      await runMiddleware(exportRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '10' }));
    });
  });

  // ---------------------------------------------------------------
  // Pre-configured limiters: burstRateLimit
  // ---------------------------------------------------------------
  describe('burstRateLimit', () => {
    it('should be a middleware function with 20 request limit', async () => {
      const req = createMockReq({ ip: '209.0.0.1' });
      const res = createMockRes();

      await runMiddleware(burstRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '20' }));
    });
  });

  // ---------------------------------------------------------------
  // createCustomRateLimit factory
  // ---------------------------------------------------------------
  describe('createCustomRateLimit', () => {
    it('should create a working limiter with custom options', async () => {
      const limiter = createCustomRateLimit({
        windowMs: 30000,
        maxRequests: 3,
        message: 'Custom limit reached',
      });

      expect(typeof limiter).toBe('function');

      const req = createMockReq({ ip: '210.0.0.1' });

      for (let i = 0; i < 3; i++) {
        await runMiddleware(limiter, req, createMockRes(), mockNext);
      }
      expect(mockNext).toHaveBeenCalledTimes(3);

      const res = createMockRes();
      await runMiddleware(limiter, req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Custom limit reached' })
      );
    });

    it('should accept all options including skipIf and keyGenerator', async () => {
      const limiter = createCustomRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        message: 'Stopped',
        skipIf: (req: Request) => (req as any).skip === true,
        keyGenerator: (req: Request) => `test:${req.ip}`,
      });

      const skipReq = createMockReq({ ip: '210.0.0.2' });
      (skipReq as any).skip = true;

      for (let i = 0; i < 3; i++) {
        await runMiddleware(limiter, skipReq, createMockRes(), mockNext);
      }
      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });

  // ---------------------------------------------------------------
  // progressiveRateLimit
  // ---------------------------------------------------------------
  describe('progressiveRateLimit', () => {
    it('should assign 50 request limit for anonymous users', async () => {
      const req = createMockReq({ ip: '211.0.0.1' });
      const res = createMockRes();

      await runMiddleware(progressiveRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '50' }));
    });

    it('should assign 1000 request limit for admin users', async () => {
      const req = createMockReq({ ip: '211.0.0.2' });
      (req as any).user = { id: 1, role: 'admin' };
      const res = createMockRes();

      await runMiddleware(progressiveRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Limit': '1000' })
      );
    });

    it('should assign 200 request limit for supplier users', async () => {
      const req = createMockReq({ ip: '211.0.0.3' });
      (req as any).user = { id: 2, role: 'supplier' };
      const res = createMockRes();

      await runMiddleware(progressiveRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '200' }));
    });

    it('should assign 100 request limit for customer users', async () => {
      const req = createMockReq({ ip: '211.0.0.4' });
      (req as any).user = { id: 3, role: 'customer' };
      const res = createMockRes();

      await runMiddleware(progressiveRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '100' }));
    });

    it('should use progressive key prefix with IP and userId', async () => {
      const req1 = createMockReq({ ip: '211.0.0.5' });
      (req1 as any).user = { id: 50, role: 'customer' };
      const req2 = createMockReq({ ip: '211.0.0.5' });
      (req2 as any).user = { id: 60, role: 'customer' };

      await runMiddleware(progressiveRateLimit, req1, createMockRes(), mockNext);
      await runMiddleware(progressiveRateLimit, req2, createMockRes(), mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should handle missing IP in progressiveRateLimit', async () => {
      const req = createMockReq();
      (req as any).ip = undefined;
      (req as any).connection = { remoteAddress: undefined };
      const res = createMockRes();

      await runMiddleware(progressiveRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should use custom message for progressive rate limit when exceeded', async () => {
      const req = createMockReq({ ip: '211.0.0.6' });
      // Anonymous user gets limit of 50; exhaust it
      for (let i = 0; i < 50; i++) {
        await runMiddleware(progressiveRateLimit, req, createMockRes(), mockNext);
      }
      expect(mockNext).toHaveBeenCalledTimes(50);

      const res = createMockRes();
      await runMiddleware(progressiveRateLimit, req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many requests for your user type. Please try again later.',
        })
      );
    });

    it('should default to 100 limit for unknown roles', async () => {
      const req = createMockReq({ ip: '211.0.0.7' });
      (req as any).user = { id: 4, role: 'buyer' };
      const res = createMockRes();

      await runMiddleware(progressiveRateLimit, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-RateLimit-Limit': '100' }));
    });
  });

  // ---------------------------------------------------------------
  // rateLimiter exported instance
  // ---------------------------------------------------------------
  describe('rateLimiter instance', () => {
    it('should be defined and have a destroy method', () => {
      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter.destroy).toBe('function');
    });

    it('should have a createLimiter method', () => {
      expect(typeof rateLimiter.createLimiter).toBe('function');
    });
  });
});
