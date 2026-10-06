// Ported from the ShotCo Review kit, shotco-review 5e2c626 (0.5.2), tests/source.test.mjs.
// Runs under node --test as in the kit. One test body diverges: the singular
// REVIEW_ACCESS_EMAIL scan reads the kit's docs and CHANGELOG.md, which this host
// does not carry, so it scans the host src tree and .env.example, with the host
// record docs/shotco-review-integration.md as its positive control. Every other
// test body is the kit's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ACCEPTED, FILES_PER_NOTE, FILE_MAX_BYTES } from '../src/lib/review/files.ts';

// Scans over the source files themselves, for the properties a unit test of
// one module cannot see: that every module obeys them.
const root = new URL('..', import.meta.url).pathname;
const read = (rel) => readFileSync(join(root, rel), 'utf8');
function sources(dir) {
  const out = [];
  for (const name of readdirSync(join(root, dir))) {
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) out.push(...sources(rel));
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(rel);
  }
  return out;
}
const REVIEW_DIRS = ['src/lib/review', 'src/components/review', 'src/app/review', 'src/app/api/review'];
const files = REVIEW_DIRS.flatMap(sources);

test('scans the review source files', () => {
  assert.ok(files.length >= 12, `expected the review surface, saw ${files.length} files`);
});

// Jon's standing rule: no em dashes, and no en dashes standing in for them, in
// anything a client reads. The PIN subject and the comment-length error both
// reach the reviewer, so the whole surface is scanned at the source.
test('carries no em dash or en dash in any review source file', () => {
  for (const rel of files) assert.doesNotMatch(read(rel), /[–—]/, rel);
});

// Font sizes in rem, never px, so a visitor's own browser text size moves the
// review UI with the rest of the site. Boxes, paddings and offsets stay in px.
test('sizes every font in the review stylesheet in rem', () => {
  const css = read('src/components/review/review.module.css');
  const sizes = css.match(/font-size:[^;}]+/g) || [];
  assert.ok(sizes.length >= 10, 'the stylesheet still declares font sizes');
  for (const s of sizes) assert.match(s, /^font-size:\s*\d*\.?\d+rem$/, s);
  for (const f of css.match(/font:[^;}]+/g) || []) assert.doesNotMatch(f, /\d+px/, f);
  const page = read('src/app/review/page.tsx');
  assert.match(page, /fontSize: "2rem"/, 'the /review heading keeps its rem size');
  assert.doesNotMatch(page, /fontSize:\s*"?\d+(px)?"?[,\s]/, 'no numeric or px heading size');
});

// Every storage touch in the browser components goes through ./storage, which
// is the only place allowed to call localStorage.
test('the components never touch localStorage directly', () => {
  for (const rel of ['src/components/review/entry.tsx', 'src/components/review/workspace.tsx']) assert.doesNotMatch(read(rel), /localStorage\s*\./, rel);
  assert.match(read('src/components/review/storage.ts'), /localStorage\.getItem/);
});

// Both stored drafts persist through persistable(); no effect rewrites the
// capture line on its own.
test('both stored drafts go through persistable()', () => {
  const ws = read('src/components/review/workspace.tsx');
  assert.equal((ws.match(/persistable\(/g) || []).length, 2);
  assert.doesNotMatch(ws, /Snapshot unavailable after page reload/);
});

// The Select On Site slide list is gone: slides resolve through data-slide and
// a host event, at both call sites.
test('slide navigation is generic', () => {
  const ws = read('src/components/review/workspace.tsx');
  assert.doesNotMatch(ws, /"websites"|"facebook"/);
  assert.equal((ws.match(/showSlide\(/g) || []).length, 3, 'one definition, two call sites');
  assert.match(ws, /shotco-review-show-slide/);
});

// Build time reads the flag; request time reads the whole configuration and
// answers configured:false so the workspace can say "not set up" instead of
// asking for a PIN.
test('the surface is gated on the flag and the route on the full configuration', () => {
  assert.match(read('src/app/review/page.tsx'), /if \(!reviewEnabled\(\)\) notFound\(\)/);
  assert.match(read('src/app/layout.tsx'), /enabled=\{reviewEnabled\(\)\}/);
  const route = read('src/app/api/review/route.ts');
  assert.match(route, /reviewConfigured\(\)\.ok/);
  assert.match(route, /configured: false/);
  assert.doesNotMatch(route, /REVIEW_ENABLED/, 'the route reads the flag through the gate, not directly');
  const ws = read('src/components/review/workspace.tsx');
  assert.match(ws, /configured === false/);
  assert.match(ws, /auth === "unavailable"/);
});

// Step two of the reviewer-identity work: the request step asks who is
// reviewing, the route passes that address on, and the browser remembers it.
test('the request step collects the reviewer address and the route reads it', () => {
  const route = read('src/app/api/review/route.ts');
  assert.match(route, /data\.email/);
  assert.match(route, /parseReviewers\(process\.env\.REVIEW_ACCESS_EMAILS\)/);
  const ws = read('src/components/review/workspace.tsx');
  assert.match(ws, /autoComplete="email"/);
  assert.match(ws, /storage\.get\("shotco-review-email"\)/);
  assert.match(ws, /storage\.set\("shotco-review-email"/);
  assert.equal((ws.match(/action: "request", email: email\.trim\(\)/g) || []).length, 2, 'the request step and the PIN-step resend both send the address');
});

// The singular name is a per-site inbox; 0.3.0 has a list. A file still
// reading or documenting the old name would leave a host half-upgraded.
test('the singular REVIEW_ACCESS_EMAIL name is gone from the source and the template', () => {
  const scanned = [...sources('src'), '.env.example'];
  assert.ok(scanned.length >= 18, `expected the source tree and the template, saw ${scanned.length} files`);
  assert.match(read('docs/shotco-review-integration.md'), /REVIEW_ACCESS_EMAIL\b/, 'the positive control: the host record keeps the old name once in its configuration note');
  for (const rel of scanned) assert.doesNotMatch(read(rel), /REVIEW_ACCESS_EMAIL\b/, rel);
  for (const rel of ['src/lib/review/configured.ts', 'src/app/api/review/route.ts', '.env.example']) assert.match(read(rel), /REVIEW_ACCESS_EMAILS/, rel);
});

// The compose control offers exactly the kinds inspectFile takes, and the hint
// under it states the limits the server enforces. Both are read out of
// files.ts here rather than retyped, so a constant that moves reddens this.
test('the compose control accepts the kinds the server takes and states their real limits', () => {
  const ws = read('src/components/review/workspace.tsx');
  const accept = ws.match(/accept="([^"]+)"/);
  assert.ok(accept, 'the compose modal carries a file input with an accept list');
  assert.deepEqual(accept[1].split(','), Object.values(ACCEPTED));
  const hint = ws.match(/JPEG, PNG, WebP or PDF, up to [^.]+\./);
  assert.ok(hint, 'the compose modal states the limits');
  assert.equal(hint[0], `JPEG, PNG, WebP or PDF, up to ${FILE_MAX_BYTES / 1_000_000} MB each, ${FILES_PER_NOTE} per change.`);
  // The FileList the input hands over is emptied by the reset that follows
  // it in the same handler, so the chosen files are copied out first: without
  // Array.from here the control uploads nothing. The trigger is a real button, which
  // takes focus; the hidden input cannot, and neither could a label.
  assert.match(ws, /const chosen = Array\.from\(e\.target\.files \?\? \[\]\); e\.target\.value = ""/);
  assert.match(ws, /onClick=\{\(\) => fileInput\.current\?\.click\(\)\}>Attach Files<\/button>/);
});

// Revocation is a reviewer action on the existing authenticated route: the
// dispatch calls s.revoke with the session identity and the batch id, following
// the sibling actions. The route reads the batch id from data.id like remove.
test('the route dispatches a revoke action to an authenticated reviewer', () => {
  const route = read('src/app/api/review/route.ts');
  assert.match(route, /data\.action === "revoke"/);
  assert.match(route, /s\.revoke\(id, String\(data\.id\)\)/);
});

// The revoke control lives on the reviewer's own recent-batch list, behind a
// confirm click so a misclick cannot break a client link, and posts the
// existing revoke action. It is never rendered on the client-facing report view
// (auth === "report"), only on the authenticated workspace.
test('the recent-batch list revokes through a confirm step, on the authenticated surface only', () => {
  const ws = read('src/components/review/workspace.tsx');
  assert.match(ws, /call\(\{ action: "revoke", id: b\.id \}\)/);
  assert.match(ws, /setConfirmRevoke\(b\.id\)/, 'a first click only asks; a second, explicit control revokes');
  const reportView = ws.slice(ws.indexOf('auth === "report"'), ws.indexOf('return <div data-review-ui'));
  assert.doesNotMatch(reportView, /revoke/i, 'the client report view carries no revoke control');
});

// An attached file arrives as a data URL on the save path's own action and
// leaves as a download, never as something a browser will render in place.
test('the route reads an attached file in and serves one back as a download', () => {
  const route = read('src/app/api/review/route.ts');
  assert.match(route, /data\.file/);
  assert.match(route, /searchParams\.get\("file"\)/);
  assert.match(route, /"Content-Disposition": `attachment; filename=/);
  assert.equal((route.match(/4_300_000/g) || []).length, 1, 'one body ceiling, raised for files');
  assert.doesNotMatch(route, /2_800_000/, 'the 0.3.0 ceiling is gone');
});

// A parked or unsaved draft keeps its attachment list: the ids are the
// server's, so a reopened draft can still save the files it collected.
test('persistable keeps a draft attachment list', () => {
  assert.match(read('src/components/review/persist.ts'), /attachments\?: Attachment\[\]/);
});

// The server answers a listed and an unlisted address alike, so the PIN step
// cannot say a code was sent: it says one is on its way if the address can
// review, and what to do when nothing arrives.
test('the PIN step never claims a code was sent', () => {
  const ws = read('src/components/review/workspace.tsx');
  assert.match(ws, /`If \$\{email\.trim\(\)\} can review this site, a code is on its way\. Nothing after a few minutes\? Try again later, or ask ShotCo\.`/);
  assert.doesNotMatch(ws, /code sent to/);
});

// The report page's title counts its changes in English.
test('the report title pluralises its count', () => {
  const ws = read('src/components/review/workspace.tsx');
  assert.match(ws, /`\$\{report\.notes\.length\} submitted \$\{report\.notes\.length === 1 \? "change" : "changes"\}`/);
  assert.doesNotMatch(ws, /\} submitted changes`/);
});

// The route reads forwarded headers only through configured.ts, where the
// trusted-proxy modes are tested; an inline header read would bypass them.
test('the route takes the client address and the origin check from configured.ts', () => {
  const route = read('src/app/api/review/route.ts');
  assert.match(route, /const ip = clientIp\(request\.headers\)/);
  assert.match(route, /if \(!originAllowed\(request\.headers\.get\("origin"\), request\.headers\.get\("host"\)\)\)/);
  assert.doesNotMatch(route, /forwarded-for/i);
});

// html-to-image 1.11.13's preferredFontFormat filter strips the src from every
// second @font-face rule it embeds, so a snapshot draws those faces in the
// default serif (sosclays.com's Bebas Neue, 2026-09-23). The capture passes no
// such option.
test('the snapshot embeds every web font face it uses', () => {
  const capture = read('src/components/review/capture.ts');
  assert.match(capture, /await toCanvas\(context as HTMLElement, \{/, 'the positive control: the capture call is where it was');
  assert.doesNotMatch(capture, /preferredFontFormat:/);
});

// A right code whose save runs past the check's floor answers 401 but still
// lands (0.5.2), so after a failed check the dialog reads the session once
// before showing the error.
test('the PIN step reads the session once after a failed check', () => {
  const ws = read('src/components/review/workspace.tsx');
  assert.match(ws, /call\(\{ action: "verify", pin \}\)\.catch\(async error => \{/);
  assert.match(ws, /setTimeout\(resolve, 1500\)\)\s*return call\(\)\.catch\(\(\) => \{ throw error \}\)/);
});

