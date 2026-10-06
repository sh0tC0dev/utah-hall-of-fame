// Ported from the ShotCo Review kit, shotco-review 5e2c626 (0.5.2), tests/version.test.mjs.
// The body diverges: the kit reads its own package.json and CHANGELOG.md to pin
// KIT_VERSION, and this host carries neither, so the port asserts the installed
// version literal and the semver shape. The literal moves with the installed kit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KIT_VERSION } from '../src/lib/review/version.ts';

test('KIT_VERSION is the installed kit version', () => {
  assert.equal(KIT_VERSION, '0.5.2');
  assert.match(KIT_VERSION, /^\d+\.\d+\.\d+$/);
});
