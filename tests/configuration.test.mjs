import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientIp, originAllowed, parseReviewers, reviewConfigured, SECRET_MIN_LENGTH } from '../src/lib/review/configured.ts';
import { reviewEnabled } from '../src/lib/review/enabled.ts';

// Placeholder values only. Nothing here is or resembles a real credential; the
// secret is a run of "x" because the only thing the gate reads about it is its
// length floor.
const COMPLETE = {
  REVIEW_ENABLED: 'true',
  REVIEW_SITE_NAME: 'Example Client',
  REVIEW_REPOSITORY: 'https://github.com/example/client',
  REVIEW_SITE_URL: 'https://site.example.test',
  REVIEW_SITE_ID: 'example-client',
  REVIEW_STORAGE_NAMESPACE: 'development',
  REVIEW_SECRET: 'x'.repeat(SECRET_MIN_LENGTH),
  REVIEW_ACCESS_EMAILS: 'review@example.test, second@example.test',
  RESEND_API_KEY: 'placeholder-not-a-key',
  BLOB_READ_WRITE_TOKEN: 'placeholder-not-a-token',
};
const without = (name) => { const env = { ...COMPLETE }; delete env[name]; return env };

// Build time reads the flag and nothing else: a build machine has no
// credentials, and must not need any.
test('the build-time gate is the flag alone', () => {
  assert.equal(reviewEnabled({ REVIEW_ENABLED: 'true' }), true);
  assert.equal(reviewEnabled(COMPLETE), true);
  assert.equal(reviewEnabled({}), false);
  for (const value of ['1', 'TRUE', 'yes', 'on', ' true', 'false']) assert.equal(reviewEnabled({ REVIEW_ENABLED: value }), false, value);
  assert.equal(reviewEnabled({ ...without('REVIEW_SECRET') }), true, 'missing credentials do not hide the surface at build time');
});

// Request time reads the whole set the route needs. Every name is blanked in
// turn so dropping one from the check reddens here.
test('the request-time gate needs every value the API reads, and names why', () => {
  assert.deepEqual(reviewConfigured(COMPLETE), { ok: true });
  assert.deepEqual(reviewConfigured({}), { ok: false, reason: 'disabled' });
  const reasons = {
    REVIEW_ENABLED: 'disabled',
    REVIEW_SITE_NAME: 'identity', REVIEW_REPOSITORY: 'identity', REVIEW_SITE_URL: 'identity',
    REVIEW_SITE_ID: 'storage', REVIEW_STORAGE_NAMESPACE: 'storage',
    REVIEW_SECRET: 'credentials', REVIEW_ACCESS_EMAILS: 'credentials', RESEND_API_KEY: 'credentials', BLOB_READ_WRITE_TOKEN: 'credentials',
  };
  assert.deepEqual(Object.keys(reasons).sort(), Object.keys(COMPLETE).sort(), 'every configured name has an expected reason');
  for (const [name, reason] of Object.entries(reasons)) assert.deepEqual(reviewConfigured(without(name)), { ok: false, reason }, name);
});

test('the request-time gate rejects malformed values, not only missing ones', () => {
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_ENABLED: 'TRUE' }), { ok: false, reason: 'disabled' });
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_SECRET: 'x'.repeat(SECRET_MIN_LENGTH - 1) }), { ok: false, reason: 'credentials' });
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_SITE_ID: 'Example Client' }), { ok: false, reason: 'storage' });
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_STORAGE_NAMESPACE: 'prod/uction' }), { ok: false, reason: 'storage' });
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_SITE_URL: 'not a url' }), { ok: false, reason: 'identity' });
});

// The site's reviewer list is one environment value holding several addresses.
// Each one gets its own PIN, so a malformed entry must be dropped rather than
// mailed, and a list with nothing usable left in it is missing credentials.
test('parseReviewers trims, lowercases, dedupes and drops what is not an address', () => {
  assert.deepEqual(parseReviewers(' A@X.test ,b@y.test,,a@x.test '), ['a@x.test', 'b@y.test']);
  assert.deepEqual(parseReviewers('nobody'), []);
  assert.deepEqual(parseReviewers('a b@x.test'), []);
  assert.deepEqual(parseReviewers('<a@x.test>'), []);
  assert.deepEqual(parseReviewers('a@x.test,nobody,b@y.test'), ['a@x.test', 'b@y.test']);
  for (const value of [undefined, '', ' , ']) assert.deepEqual(parseReviewers(value), [], String(value));
});

test('a reviewer list with no usable address is missing credentials', () => {
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_ACCESS_EMAILS: 'nobody' }), { ok: false, reason: 'credentials' });
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_ACCESS_EMAILS: ' , ' }), { ok: false, reason: 'credentials' });
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_ACCESS_EMAILS: 'one@example.test' }), { ok: true });
});

// REVIEW_TRUSTED_PROXY is an explicit opt-in with one known mode. Anything else
// set there is refused with the not-set-up 503 rather than quietly read as unset,
// and the value is exact, so a near miss is refused too.
test('an unknown REVIEW_TRUSTED_PROXY value is refused, not ignored', () => {
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_TRUSTED_PROXY: 'google-front-end' }), { ok: true });
  assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_TRUSTED_PROXY: '' }), { ok: true }, 'empty is unset');
  for (const value of ['google-frontend', 'Google-Front-End', ' google-front-end', 'vercel', 'true']) assert.deepEqual(reviewConfigured({ ...COMPLETE, REVIEW_TRUSTED_PROXY: value }), { ok: false, reason: 'proxy' }, value);
});

// The client address for the per-ip ceiling. Every case sends every header, so
// a mode that read the wrong one would answer with the wrong value.
const forwarded = (xff) => new Headers({ 'x-forwarded-for': xff, 'x-vercel-forwarded-for': '9.9.9.9, 8.8.8.8' });
test('google-front-end reads the rightmost X-Forwarded-For entry and never a client-chosen one', () => {
  const gfe = { REVIEW_TRUSTED_PROXY: 'google-front-end' };
  assert.equal(clientIp(forwarded('6.6.6.6, 203.0.113.7'), gfe), '203.0.113.7', 'the spoofed leftmost entry is not read');
  assert.equal(clientIp(forwarded('203.0.113.7'), gfe), '203.0.113.7');
  assert.equal(clientIp(forwarded('6.6.6.6, '), gfe), 'unknown', 'an empty rightmost slot is unknown, never a step left');
  assert.equal(clientIp(new Headers(), gfe), 'unknown', 'no header does not throw');
  assert.equal(clientIp(forwarded('6.6.6.6, 203.0.113.7'), { ...gfe, VERCEL: '1' }), '203.0.113.7', 'the declared mode wins over the Vercel default');
});
test('without the mode the client address is unchanged: Vercel header on Vercel, one local bucket elsewhere', () => {
  assert.equal(clientIp(forwarded('6.6.6.6, 203.0.113.7'), { VERCEL: '1' }), '9.9.9.9');
  assert.equal(clientIp(new Headers(), { VERCEL: '1' }), 'unknown');
  assert.equal(clientIp(forwarded('6.6.6.6, 203.0.113.7'), {}), 'local', 'a forwarded header is not trusted off Vercel by default');
  assert.equal(clientIp(forwarded('6.6.6.6, 203.0.113.7'), { REVIEW_TRUSTED_PROXY: '' }), 'local');
});

// The origin check. google-front-end requires https outside next dev; every
// other case keeps the 0.5.0 rule.
test('google-front-end refuses an http Origin outside local development', () => {
  const gfe = { REVIEW_TRUSTED_PROXY: 'google-front-end' };
  assert.equal(originAllowed('https://site.test', 'site.test', { ...gfe, NODE_ENV: 'production' }), true);
  assert.equal(originAllowed('http://site.test', 'site.test', { ...gfe, NODE_ENV: 'production' }), false);
  assert.equal(originAllowed('http://site.test', 'site.test', gfe), false, 'no NODE_ENV is not development');
  assert.equal(originAllowed('http://localhost:3055', 'localhost:3055', { ...gfe, NODE_ENV: 'development' }), true, 'next dev still takes http');
});
test('without the mode the origin check is unchanged', () => {
  assert.equal(originAllowed('http://localhost:3055', 'localhost:3055', { NODE_ENV: 'production' }), true, 'off Vercel an http Origin passes, as before');
  assert.equal(originAllowed('http://site.test', 'site.test', { VERCEL: '1' }), false, 'on Vercel it never does');
  assert.equal(originAllowed('https://site.test', 'site.test', { VERCEL: '1' }), true);
  assert.equal(originAllowed('https://evil.test', 'site.test', {}), false, 'a foreign host');
  for (const origin of [null, '', 'null', 'not a url']) assert.equal(originAllowed(origin, 'site.test', {}), false, String(origin));
});
