import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewSourceVersion } from '../src/lib/review/source-version.ts';

const runner = (answers) => (args) => { const key = args.join(' '); if (!(key in answers)) throw new Error('unexpected git call ' + key); const a = answers[key]; if (a instanceof Error) throw a; return a };

test('prefers an explicitly configured revision, then Vercel commit sha', () => {
  assert.equal(reviewSourceVersion({ REVIEW_SOURCE_VERSION: 'pinned', VERCEL_GIT_COMMIT_SHA: 'abc' }, runner({})), 'pinned');
  assert.equal(reviewSourceVersion({ VERCEL_GIT_COMMIT_SHA: 'abc1234' }, runner({})), 'abc1234');
});

test('a clean checkout stamps the short sha; a dirty one adds a stable source suffix', () => {
  assert.equal(reviewSourceVersion({}, runner({ 'rev-parse --short HEAD': 'deadbee', 'status --porcelain': '' })), 'deadbee');
  const dirty = reviewSourceVersion({}, runner({ 'rev-parse --short HEAD': 'deadbee', 'status --porcelain': ' M src/a.ts\n?? new/' }));
  assert.match(dirty, /^deadbee:source-[0-9a-f]{8}$/);
  assert.equal(dirty, reviewSourceVersion({}, runner({ 'rev-parse --short HEAD': 'deadbee', 'status --porcelain': ' M src/a.ts\n?? new/' })), 'same dirty list, same suffix');
  assert.notEqual(dirty, reviewSourceVersion({}, runner({ 'rev-parse --short HEAD': 'deadbee', 'status --porcelain': ' M src/b.ts' })));
});

test('returns unknown-build instead of throwing when git cannot answer', () => {
  assert.equal(reviewSourceVersion({}, runner({ 'rev-parse --short HEAD': new Error('not a git repository') })), 'unknown-build');
  assert.equal(reviewSourceVersion({}, runner({ 'rev-parse --short HEAD': '' })), 'unknown-build');
});

test('the real runner works in this checkout', () => {
  assert.match(reviewSourceVersion({}), /^([0-9a-f]{7,}(:source-[0-9a-f]{8})?|unknown-build)$/);
});
