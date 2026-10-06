import { test } from 'node:test';
import assert from 'node:assert/strict';
import { persistable } from '../src/components/review/persist.ts';

const anchor = { selector: '#hero', tag: 'section', text: '', image: '', alt: '', x: .5, y: .5, pageX: 1, pageY: 1, rect: { x: 0, y: 0, width: 1, height: 1 }, viewport: { width: 1, height: 1, dpr: 1, scrollX: 0, scrollY: 0 }, slide: '', url: '/', title: 't', browser: 'b', version: 'v' };

// A stored draft never keeps its screenshot (data URLs run to megabytes), so
// its capture line has to stop describing a snapshot the copy no longer holds.
test('drops the screenshot and rewrites the capture line of a draft that had one', () => {
  const stored = persistable({ comment: 'Fix this', anchor, screenshot: 'data:image/jpeg;base64,AAAA', capture: 'Section snapshot; form fields and embedded media omitted' });
  assert.equal(stored.screenshot, undefined);
  assert.equal(stored.capture, 'Snapshot unavailable after page reload');
  assert.equal(stored.comment, 'Fix this');
  assert.deepEqual(stored.anchor, anchor);
});

test('keeps the capture line of a draft that never had a screenshot', () => {
  const stored = persistable({ comment: 'Fix this', anchor, capture: 'Snapshot unavailable; element and window details saved' });
  assert.equal(stored.screenshot, undefined);
  assert.equal(stored.capture, 'Snapshot unavailable; element and window details saved');
});

// Attachments are metadata only: the ids are the server's, the bytes never
// reach browser storage, and a reopened draft can still save the files it
// collected before the reload.
test('keeps the attachment list, which is metadata the server already holds', () => {
  const attachments = [{ id: '11111111-1111-1111-1111-111111111111', name: 'logo.png', type: 'image/png', size: 2048 }];
  const stored = persistable({ comment: 'Use this logo', anchor, screenshot: 'data:image/jpeg;base64,AAAA', capture: 'Section snapshot; form fields and embedded media omitted', attachments });
  assert.deepEqual(stored.attachments, attachments);
  assert.equal(stored.screenshot, undefined);
});
