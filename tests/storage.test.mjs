import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storage } from '../src/components/review/storage.ts';

// The helper mounts on every route for every visitor, so a browser that denies
// site storage (the localStorage GETTER throws SecurityError) or has a full
// quota (setItem throws) must degrade to "nothing remembered", never to a
// throw inside a React effect.
const install = (descriptor) => Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...descriptor });
const uninstall = () => { delete globalThis.localStorage };

test('round-trips through a working store (positive control)', () => {
  const map = new Map();
  install({ value: { getItem: (k) => map.has(k) ? map.get(k) : null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) } });
  try {
    assert.equal(storage.get('k'), null);
    storage.set('k', 'v');
    assert.equal(storage.get('k'), 'v');
    storage.remove('k');
    assert.equal(storage.get('k'), null);
  } finally { uninstall() }
});

test('never throws when the browser denies storage', () => {
  install({ get() { throw new Error('SecurityError: The operation is insecure.') } });
  try {
    assert.equal(storage.get('k'), null);
    assert.doesNotThrow(() => storage.set('k', 'v'));
    assert.doesNotThrow(() => storage.remove('k'));
  } finally { uninstall() }
});

test('never throws when the store is full', () => {
  install({ value: { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') }, removeItem: () => {} } });
  try { assert.doesNotThrow(() => storage.set('k', 'v')) } finally { uninstall() }
});
