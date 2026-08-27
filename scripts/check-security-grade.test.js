const assert = require('node:assert/strict');
const test = require('node:test');

const {
  extractBlock,
  gradeMeetsMinimum,
  parseDirectNginxHeaders,
  validateHeaderSet,
} = require('./check-security-grade');

const strongHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests",
};

test('accepts A and A+ when A is the minimum', () => {
  assert.equal(gradeMeetsMinimum('A', 'A'), true);
  assert.equal(gradeMeetsMinimum('A+', 'A'), true);
  assert.equal(gradeMeetsMinimum('B+', 'A'), false);
});

test('accepts the required A-grade security header policy', () => {
  assert.deepEqual(validateHeaderSet('test', strongHeaders), []);
});

test('rejects missing and weakened security headers', () => {
  const issues = validateHeaderSet('test', {
    ...strongHeaders,
    'Strict-Transport-Security': 'max-age=60',
    'Content-Security-Policy': "default-src *; script-src 'unsafe-eval'",
  });

  assert.ok(issues.some(issue => issue.includes('HSTS max-age')));
  assert.ok(issues.some(issue => issue.includes("CSP must contain default-src 'self'")));
  assert.ok(issues.some(issue => issue.includes('unsafe-eval')));
});

test('reads only direct headers from an Nginx block', () => {
  const config = `
server {
  add_header X-Frame-Options "DENY" always;

  location /nested/ {
    add_header X-Content-Type-Options "nosniff" always;
  }
}
`;

  const headers = parseDirectNginxHeaders(extractBlock(config, 'server {'));
  assert.deepEqual(headers, { 'X-Frame-Options': 'DENY' });
});
