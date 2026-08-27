#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const REPOSITORY_ROOT = path.resolve(__dirname, '..');
const DEFAULT_HOST = 'crescebr.com.br';
const DEFAULT_MINIMUM_GRADE = 'A';

const GRADE_ORDER = new Map([
  ['F', 0],
  ['D', 1],
  ['C', 2],
  ['B-', 3],
  ['B', 4],
  ['B+', 5],
  ['A-', 6],
  ['A', 7],
  ['A+', 8],
]);

const REQUIRED_CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
];

const normalizeHeaders = headers =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value).trim()])
  );

const gradeMeetsMinimum = (grade, minimum = DEFAULT_MINIMUM_GRADE) => {
  const actualRank = GRADE_ORDER.get(String(grade).toUpperCase());
  const minimumRank = GRADE_ORDER.get(String(minimum).toUpperCase());

  if (actualRank === undefined) throw new Error(`Unknown security grade: ${grade}`);
  if (minimumRank === undefined) throw new Error(`Unknown minimum security grade: ${minimum}`);

  return actualRank >= minimumRank;
};

const validateHeaderSet = (label, inputHeaders) => {
  const headers = normalizeHeaders(inputHeaders);
  const issues = [];
  const required = [
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'content-security-policy',
  ];

  for (const header of required) {
    if (!headers[header]) issues.push(`${label}: missing ${header}`);
  }

  const hsts = headers['strict-transport-security']?.toLowerCase() ?? '';
  const maxAge = Number(hsts.match(/max-age=(\d+)/)?.[1] ?? 0);
  if (hsts && maxAge < 31536000) {
    issues.push(`${label}: HSTS max-age must be at least one year`);
  }
  if (hsts && !hsts.includes('includesubdomains')) {
    issues.push(`${label}: HSTS must include subdomains`);
  }

  const frameOptions = headers['x-frame-options']?.toUpperCase();
  if (frameOptions && !['DENY', 'SAMEORIGIN'].includes(frameOptions)) {
    issues.push(`${label}: X-Frame-Options must be DENY or SAMEORIGIN`);
  }

  if (
    headers['x-content-type-options'] &&
    headers['x-content-type-options'].toLowerCase() !== 'nosniff'
  ) {
    issues.push(`${label}: X-Content-Type-Options must be nosniff`);
  }

  const permissions = headers['permissions-policy']?.toLowerCase() ?? '';
  for (const disabledFeature of ['geolocation=()', 'microphone=()', 'camera=()']) {
    if (permissions && !permissions.includes(disabledFeature)) {
      issues.push(`${label}: Permissions-Policy must contain ${disabledFeature}`);
    }
  }

  const csp = headers['content-security-policy']?.toLowerCase() ?? '';
  for (const directive of REQUIRED_CSP_DIRECTIVES) {
    if (csp && !csp.includes(directive)) {
      issues.push(`${label}: CSP must contain ${directive}`);
    }
  }
  if (csp.includes('script-src') && csp.includes("'unsafe-eval'")) {
    issues.push(`${label}: CSP script-src must not allow unsafe-eval`);
  }

  return issues;
};

const extractBlock = (source, marker) => {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing Nginx block: ${marker}`);

  const openingBrace = source.indexOf('{', markerIndex);
  if (openingBrace < 0) throw new Error(`Missing opening brace for Nginx block: ${marker}`);

  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(markerIndex, index + 1);
  }

  throw new Error(`Unclosed Nginx block: ${marker}`);
};

const parseDirectNginxHeaders = block => {
  const headers = {};
  let depth = 0;

  for (const sourceLine of block.split('\n')) {
    const line = sourceLine.replace(/#.*$/, '').trim();
    depth += (line.match(/{/g) ?? []).length;

    if (depth === 1) {
      const match = line.match(
        /^add_header\s+([A-Za-z0-9-]+)\s+(?:"([^"]*)"|'([^']*)'|([^;\s]+))(?:\s+always)?;/
      );
      if (match) headers[match[1]] = match[2] ?? match[3] ?? match[4];
    }

    depth -= (line.match(/}/g) ?? []).length;
  }

  return headers;
};

const assertNoIssues = issues => {
  if (issues.length > 0) {
    throw new Error(`Security header regression:\n- ${issues.join('\n- ')}`);
  }
};

const validateRepositoryConfiguration = () => {
  const firebasePath = path.join(REPOSITORY_ROOT, 'firebase.json');
  const nginxPath = path.join(REPOSITORY_ROOT, 'frontend/nginx.conf.template');
  const firebase = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
  const nginx = fs.readFileSync(nginxPath, 'utf8');

  const wildcardRule = firebase.hosting?.headers?.find(rule => rule.source === '**');
  if (!wildcardRule) throw new Error('firebase.json must define a ** header rule');

  const firebaseHeaders = Object.fromEntries(
    wildcardRule.headers.map(({ key, value }) => [key, value])
  );
  const serverHeaders = parseDirectNginxHeaders(extractBlock(nginx, 'server {'));
  const indexHeaders = parseDirectNginxHeaders(extractBlock(nginx, 'location = /index.html'));

  assertNoIssues([
    ...validateHeaderSet('Firebase wildcard response', firebaseHeaders),
    ...validateHeaderSet('Nginx server response', serverHeaders),
    ...validateHeaderSet('Nginx index response', indexHeaders),
  ]);

  console.log('Security header configuration: PASS (minimum external grade target: A)');
};

const fetchWithRetry = async (url, attempts = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await global.fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'CresceBR security-grade check' },
        redirect: 'follow',
        signal: global.AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await delay(attempt * 1000);
      }
    }
  }

  throw new Error(`Request failed after ${attempts} attempts: ${lastError.message}`);
};

const validateLiveGrade = async ({
  host = process.env.SECURITY_GRADE_HOST || DEFAULT_HOST,
  minimum = process.env.MIN_SECURITY_GRADE || DEFAULT_MINIMUM_GRADE,
} = {}) => {
  const siteResponse = await fetchWithRetry(`https://${host}/`);
  const liveHeaders = Object.fromEntries(siteResponse.headers.entries());
  assertNoIssues(validateHeaderSet(`Live response from ${host}`, liveHeaders));

  const observatoryUrl = `https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=${encodeURIComponent(host)}`;
  const observatoryResponse = await fetchWithRetry(observatoryUrl);
  const report = await observatoryResponse.json();
  const scan = report.scan ?? report;
  const grade = scan.grade;

  if (!gradeMeetsMinimum(grade, minimum)) {
    throw new Error(
      `MDN Observatory grade ${grade} is below the required minimum ${minimum} for ${host}`
    );
  }

  console.log(
    `Live security grade: PASS (${host}: ${grade}, score ${scan.score}, ` +
      `${scan.tests_passed} passed / ${scan.tests_failed} failed; minimum ${minimum})`
  );
};

const main = async () => {
  const mode = process.argv[2] ?? '--config';

  if (mode === '--config') {
    validateRepositoryConfiguration();
    return;
  }
  if (mode === '--live') {
    await validateLiveGrade();
    return;
  }

  throw new Error(`Unknown mode: ${mode}. Use --config or --live.`);
};

if (require.main === module) {
  main().catch(error => {
    console.error(`Security grade check failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  extractBlock,
  gradeMeetsMinimum,
  parseDirectNginxHeaders,
  validateHeaderSet,
  validateLiveGrade,
  validateRepositoryConfiguration,
};
