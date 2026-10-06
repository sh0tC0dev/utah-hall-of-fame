// Host wiring for ShotCo Review on the Utah Trapshooting Hall of Fame site
// (SHO-1125). Not a kit test: it pins the host-side properties the kit's own
// scans cannot see.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (rel) => readFileSync(join(root, rel), 'utf8');

// The footer trigger, and the middot separator beside it, render only when review
// is on, so the public footer's markup is exactly what it was before the tool
// existed.
test('the footer renders the review trigger only when review is enabled', () => {
  const footer = read('src/app/components/Footer.tsx');
  assert.equal((footer.match(/<ReviewTrigger \/>/g) || []).length, 1, 'one trigger in the footer');
  assert.match(footer, /\{reviewEnabled\(\) && \(\s*<>\s*\{" "\}\s*&middot; <ReviewTrigger \/>\s*<\/>\s*\)\}/);
});

// The home spotlight and most public pages wrap sections in ScrollReveal, which
// holds a section at opacity 0 until it scrolls into view. While a reviewer is
// selecting (the kit sets the attribute to "true" or "false"), every reveal shows
// its finished state at once.
test('scroll reveals show their finished state while a reviewer is selecting', () => {
  assert.match(read('src/app/components/ScrollReveal.tsx'), /scroll-reveal/, 'the positive control: the component still carries the reveal class');
  assert.match(read('src/app/globals.css'), /:root\[data-review-selecting="true"\] \.scroll-reveal \{\s*opacity: 1;\s*transform: none;\s*transition: none;\s*\}/);
});
