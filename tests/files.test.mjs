import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { ACCEPTED, BATCH_FILES_MAX_BYTES, FILES_PER_NOTE, FILE_MAX_BYTES, NAME_MAX, UPLOADS_PENDING_MAX, formatBytes, refusalLine, safeName } from '../src/lib/review/files.ts';
import { inspectFile } from '../src/lib/review/inspect.ts';

const solid = (width, height) => sharp({ create: { width, height, channels: 3, background: { r: 40, g: 90, b: 140 } } });
const bytes = (buffer) => new Uint8Array(buffer);
const PDF = bytes(Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'));

// The four accepted kinds, named once so the constants are what every other
// file reads. The client's accept list is compared against these in
// tests/source.test.mjs rather than retyped there.
test('the accepted set is exactly JPEG, PNG, WebP and PDF', () => {
  assert.deepEqual(Object.keys(ACCEPTED), ['jpeg', 'png', 'webp', 'pdf']);
  assert.deepEqual(Object.values(ACCEPTED), ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  assert.equal(FILE_MAX_BYTES, 3_000_000);
  assert.equal(FILES_PER_NOTE, 5);
  assert.equal(UPLOADS_PENDING_MAX, 20);
  assert.equal(BATCH_FILES_MAX_BYTES, 20_000_000);
  assert.equal(NAME_MAX, 80);
});

test('an image of each accepted kind is taken and re-encoded into that same kind', async () => {
  for (const [kind, type] of [['jpeg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp']]) {
    const source = await solid(8, 8)[kind]().toBuffer();
    const result = await inspectFile(bytes(source));
    assert.ok(result, kind);
    assert.equal(result.kind, kind);
    assert.equal(result.type, type);
    assert.equal(result.ext, kind);
    const metadata = await sharp(result.bytes).metadata();
    assert.equal(metadata.format, kind, kind);
    assert.equal(metadata.width, 8, kind);
  }
});

// sharp drops EXIF and ICC unless asked to keep them, so the re-encode is what
// strips a photograph's camera, software and GPS tags. The fixture carries EXIF
// before the call, so a re-encode that stopped stripping would redden this.
test('re-encoding strips the metadata a camera file carries', async () => {
  const source = await solid(8, 8).withMetadata({ exif: { IFD0: { Copyright: 'ShotCo review fixture' } } }).jpeg().toBuffer();
  assert.ok((await sharp(source).metadata()).exif, 'positive control: the fixture carries EXIF before inspection');
  const result = await inspectFile(bytes(source));
  assert.equal((await sharp(result.bytes).metadata()).exif, undefined);
});

test('an image wider than the ceiling comes back at the ceiling', async () => {
  const source = await solid(5000, 100).png().toBuffer();
  const result = await inspectFile(bytes(source));
  const metadata = await sharp(result.bytes).metadata();
  assert.equal(metadata.width, 4000);
  assert.equal(metadata.height, 80);
});

test('a PDF is taken by its header and stored exactly as received', async () => {
  const result = await inspectFile(PDF);
  assert.equal(result.kind, 'pdf');
  assert.equal(result.type, 'application/pdf');
  assert.equal(result.ext, 'pdf');
  assert.deepEqual(result.bytes, PDF);
});

// The client's declared type is never read, so every refusal here is decided by
// the bytes themselves. sharp reads GIF and SVG, which is why the format
// allowlist rather than a sharp failure is what refuses them.
test('every other kind of bytes is refused', async () => {
  const gif = bytes(await solid(8, 8).gif().toBuffer());
  assert.equal((await sharp(gif).metadata()).format, 'gif', 'positive control: sharp reads the GIF fixture');
  assert.equal(await inspectFile(gif), null);
  assert.equal(await inspectFile(bytes(Buffer.from('This is a plain text note, not a file we take.'))), null);
  assert.equal(await inspectFile(bytes(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>'))), null);
  assert.equal(await inspectFile(new Uint8Array(0)), null);
});

test('safeName keeps a readable name and nothing else', () => {
  assert.equal(safeName('../../etc/passwd', 'pdf'), 'passwd.pdf');
  assert.equal(safeName('My Logo (final).PNG', 'png'), 'My Logo final.png');
  assert.equal(safeName('C:\\Users\\Dale\\flyer.pdf', 'pdf'), 'flyer.pdf');
  const long = safeName('x'.repeat(200), 'png');
  assert.equal(long.length, NAME_MAX);
  assert.ok(long.endsWith('.png'), long);
  assert.equal(safeName('', 'jpeg'), 'attachment.jpeg');
  assert.equal(safeName(undefined, 'jpeg'), 'attachment.jpeg');
  assert.equal(safeName('.', 'webp'), 'attachment.webp');
  assert.equal(safeName('payload.exe', 'jpeg'), 'payload.jpeg');
});

test('formatBytes reads as a person would write it', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(240_000), '240 KB');
  assert.equal(formatBytes(1_800_000), '1.8 MB');
  assert.equal(formatBytes(BATCH_FILES_MAX_BYTES), '20 MB');
  assert.equal(formatBytes(FILE_MAX_BYTES), '3 MB');
});

// The 0.4.0 acceptance drive on the live Stockdale site attached a GIF and the
// dialog answered "Not attached: refused.gif Attach a JPEG, PNG, WebP or PDF
// file.." Two full stops, because the server's refusal is already a sentence
// while the browser's size refusal is a clause. One line now carries both.
test('a refusal line ends once, whether the reason is a sentence or a clause', () => {
  assert.equal(
    refusalLine([{ name: 'refused.gif', reason: 'Attach a JPEG, PNG, WebP or PDF file.' }]),
    'Not attached: refused.gif (Attach a JPEG, PNG, WebP or PDF file).',
  );
  assert.equal(
    refusalLine([{ name: 'huge.pdf', reason: `larger than ${formatBytes(FILE_MAX_BYTES)}` }]),
    'Not attached: huge.pdf (larger than 3 MB).',
  );
});

test('every refused file is named, and one refusal does not swallow the others', () => {
  const line = refusalLine([
    { name: 'a.gif', reason: 'Attach a JPEG, PNG, WebP or PDF file.' },
    { name: 'b.pdf', reason: 'larger than 3 MB' },
    { name: 'c.svg', reason: 'not attached' },
  ]);
  assert.equal(line, 'Not attached: a.gif (Attach a JPEG, PNG, WebP or PDF file); b.pdf (larger than 3 MB); c.svg (not attached).');
  for (const name of ['a.gif', 'b.pdf', 'c.svg']) assert.ok(line.includes(name), `${name} is missing from the line`);
  assert.equal((line.match(/\.\./g) || []).length, 0);
});
