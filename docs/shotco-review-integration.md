# ShotCo Review integration record (Utah Trapshooting Hall of Fame)

Written 2026-10-06 16:06 PDT for Linear SHO-1125 (wave 1, round 2). Branch `feat/shotco-review`,
worktree `/Users/shotco/Desktop/dev/wt-utah-hof-review`, cut from `origin/main` at
`e4f9812` (the lead's base ruling A). Record written at branch head `4a928b7`.

This is a fresh install of the ShotCo Review kit at version 0.5.2. The host has
never carried the tool, so there is no upgrade history and no local source
adaptation: every review source file is byte-identical to the kit, and what is
host-side is the wiring (the layout mount, the footer trigger, the build stamp,
the tsconfig flag and one stylesheet rule for the scroll reveals) plus the ported
tests. The tool ships off. Provisioning, the deploy and the live acceptance drive
are the lead's; this branch is code and record only.

## Kit version

| | |
|---|---|
| Source | `github.com/sh0tC0dev/shotco-review` (private) |
| Version | 0.5.2 (`KIT_VERSION` in `src/lib/review/version.ts`), stamped into every batch manifest and the last line of every batch email |
| Commit | `5e2c626`. The kit's `main` is now `c58bff2`, which changes only `README.md` after `5e2c626`. |

Nothing from Select On Site's or any other client's deployment, storage,
credentials or identity was copied. The kit checkout is the only source used.

## Base: what this branch ships besides the tool

Production is `dpl_43sXsBUEyeCTEJUbihmD3M66WSbD`, built from `21f4fbd` with a dirty
tree: it served `/poster` from a file that existed only uncommitted. The round-1
scout (taken 2026-10-06 15:12 PDT) compared the 91 source files that deployment
uploaded: against `21f4fbd`, 88 were identical, 0
differed and 3 were not in git (`src/app/poster/page.tsx` and two
generated files); against `e4f9812`, 86 were identical and
3 differed (CLAUDE.md, package-lock.json, package.json), so `/poster` is committed
byte-identical in the base.

`git log 21f4fbd..e4f9812` lists 6 commits. The newest adds the live
`/poster` page; the other 5 are commits production does not run yet, and
they ship with this install:

| Commit | Date | Subject (a dash in 1 subject is shown as a colon) |
|---|---|---|
| `e4f9812` | 2026-10-02 | SHO-805: commit the live /poster page |
| `01c48fa` | 2026-10-01 | SHO-561: merge next 16.3.8 into main |
| `35975f1` | 2026-08-21 | chore(lint): restore a runnable lint: next lint was removed in Next 16 |
| `34134a3` | 2026-05-15 | chore(dev): bump V8 heap to 8GB on dev script |
| `67bae57` | 2026-05-11 | chore(deploy): add vercel.json with preview deploy lock |
| `2218b14` | 2026-05-11 | chore(claude): surface deploy rule at top of CLAUDE.md |

`01c48fa` is a merge whose second parent is production's own `21f4fbd`
(parents `35975f1`, `21f4fbd`), so production already runs next 16.3.8; the
merge adds nothing to what production serves beyond the 4 main-line
commits below it in the table (the CLAUDE.md deploy line, the `vercel.json`
git-deploy lock, the dev-script heap, and the runnable eslint). Against production's
lockfile, the base adds 340 entries (339 of them dev-only; the one
other is the optional `@emnapi/runtime` under `@img/sharp-wasm32`, which production
held at the top level), removes 0 and moves 3 versions:
`@emnapi/runtime` 1.11.3 to 1.10.0, `baseline-browser-mapping` 2.10.10 to 2.11.17, `caniuse-lite` 1.0.30001781 to 1.0.30001809. `next`, `react`, `resend` and `sharp` do not move.

The main checkout (`/Users/shotco/Desktop/dev/utah-hall-of-fame`, branch
`add-vercel-analytics` with uncommitted files) was not touched: no stash, reset,
checkout, add, build or dev server ran there.

## Files copied from the kit

**18 files, every one byte-identical to the kit.** Each was taken from git
(`git archive 5e2c626`) and compared with `shasum -a 256` against
`git show 5e2c626:<path>`. A kit file that needs changing is a kit bug to report
upstream, never a host edit. Negative control: the host's own
`src/app/layout.tsx` hashes `e1e9f8eab9373791` against the kit demo layout's `27398fcde361823f`.

| File | sha256 (16) kit | sha256 (16) host |
|---|---|---|
| `src/app/api/review/route.ts` | `c9f21a8ef0a0ef71` | `c9f21a8ef0a0ef71` |
| `src/app/review/page.tsx` | `5ba3b81693c45abb` | `5ba3b81693c45abb` |
| `src/components/review/capture.ts` | `58683b1d25789047` | `58683b1d25789047` |
| `src/components/review/entry.tsx` | `ec2b9bacdd9e8804` | `ec2b9bacdd9e8804` |
| `src/components/review/files.ts` | `e535701dffeb9ddc` | `e535701dffeb9ddc` |
| `src/components/review/persist.ts` | `3a2bff1cc86d4cda` | `3a2bff1cc86d4cda` |
| `src/components/review/review.module.css` | `d0c2953df45ab9a4` | `d0c2953df45ab9a4` |
| `src/components/review/storage.ts` | `3c6f5071d935d392` | `3c6f5071d935d392` |
| `src/components/review/workspace.tsx` | `c9183abc9b848ade` | `c9183abc9b848ade` |
| `src/lib/review/configured.ts` | `0c14484fb5dab4e3` | `0c14484fb5dab4e3` |
| `src/lib/review/enabled.ts` | `449cd712152328aa` | `449cd712152328aa` |
| `src/lib/review/files.ts` | `697689b4e442491b` | `697689b4e442491b` |
| `src/lib/review/inspect.ts` | `485a4d40b72f64cb` | `485a4d40b72f64cb` |
| `src/lib/review/service.ts` | `03c94a3cace98bdc` | `03c94a3cace98bdc` |
| `src/lib/review/source-version.ts` | `46d205df73ec4470` | `46d205df73ec4470` |
| `src/lib/review/store.ts` | `92a00ac099a493d2` | `92a00ac099a493d2` |
| `src/lib/review/types.ts` | `de66f5bcf8ade5c6` | `de66f5bcf8ade5c6` |
| `src/lib/review/version.ts` | `9253ad0ff8bea94c` | `9253ad0ff8bea94c` |

The kit's demonstration shell (`src/app/page.tsx`, `src/app/layout.tsx`,
`src/app/globals.css`, its `next.config.ts`, `eslint.config.mjs` and
`tsconfig.json`) was not copied. The host keeps its `@/*` alias at `./src/*`, so
the kit files sit at the kit's own paths.

## Tests ported

The host had no unit runner (eslint only). The kit's 8 test files live in
`tests/` as in the kit and run under `node --test` on Node 24, through a new
`test` script that is the kit's own command:
`node --experimental-strip-types --test tests/*.test.mjs`. Gates ran on Node
v24.13.1 and npm 11.8.0.

6 of the 8 are byte-identical to the kit: `configuration.test.mjs`, `files.test.mjs`, `persist.test.mjs`, `review.test.mjs`, `source-version.test.mjs`, `storage.test.mjs`. Two bodies
diverge, `source.test.mjs` and `version.test.mjs`, each named in its file header, the same way the NLO Alaska port in this wave
diverges:

- `version.test.mjs`: the kit body reads the kit's own `package.json` and
  `CHANGELOG.md`, which this host does not carry; the port asserts the installed
  `KIT_VERSION` equals `"0.5.2"` and has the semver shape.
- `source.test.mjs`: its root is the repository root, as in the kit. One test,
  "the singular REVIEW_ACCESS_EMAIL name is gone", scans the host `src` tree and
  `.env.example` instead of the kit's docs, with this record as its positive
  control in place of the kit's `CHANGELOG.md` (see Configuration). Every other
  test body is the kit's, reading the byte-identical source.

`tests/host-wiring.test.mjs` is host-written and not a kit test: it pins the
footer trigger behind `reviewEnabled()` and the reveal rule below. The folder
holds 9 test files in all.

## Host wiring

- **Layout mount.** `src/app/layout.tsx` mounts
  `<ReviewEntry enabled={reviewEnabled()} />` once in `<body>`, after `<Footer />`
  and outside the host's `zIndex: 1` content wrapper. With the flag off
  `ReviewEntry` returns null before touching storage.
- **Footer trigger.** The footer has no "Site Map" link and no "Built by ShotCo"
  line. Per INTEGRATION.md the trigger goes after the footer's attribution, which
  here is the line "A 501(c)(3) nonprofit corporation · Utah State Trapshooting
  Association" (`src/app/components/Footer.tsx`, the `footerText` paragraph). It
  follows the USTA link, separated by the line's own middot:
  `{reviewEnabled() && (<>{" "}&middot; <ReviewTrigger /></>)}`. The separator and
  the trigger render only when review is on, so the public footer is unchanged
  with the flag off (measured below). The "Support the Hall" link stays last and
  no navigation link was added. The trigger is the kit's own with no wrapper; it
  inherits the line's text colour.
- **Build stamp.** `next.config.ts` imports `reviewSourceVersion` from
  `./src/lib/review/source-version` and adds only
  `env: { REVIEW_SOURCE_VERSION: reviewSourceVersion() }`. The host config was
  empty before; nothing else changed.
- **tsconfig.** `"allowImportingTsExtensions": true` (legal under `noEmit`).
- **Scroll reveals.** `ScrollReveal` holds a section at opacity 0 and offset
  (translateY(28px)) until it scrolls into view; 7 of the host's 9 public
  `page.tsx` files use it, directly or through `SectionDivider`. One rule in
  `src/app/globals.css`, `:root[data-review-selecting="true"] .scroll-reveal`,
  shows every reveal at its finished state with no transition while a reviewer
  is selecting, so an unrevealed section is visible to click and to capture. The
  kit sets the attribute to `"true"` or `"false"`, so the rule matches the string.
  When selection ends the rule stops applying and the host's own reveal behaviour
  resumes.
- **Sitemap, robots, analytics.** The host has no `sitemap.ts`, `robots.ts` or
  `public` sitemap or robots file (live `/sitemap.xml` answers 404 and
  `/robots.txt` 404), runs no analytics, and does not load the ShotCo ad
  embed: the live home carries 0 of the analytics, ad-embed,
  canonical and `<main` markers checked, against 6 matches for the
  site name as the positive control. So there is nothing to exclude, and the ad
  embed beacon (SHO-1135) does not apply to this host. `/review` carries the kit's
  own `noindex, nofollow` and `no-referrer` metadata.
- **Landmark.** The host layout has no `<main>`, so `/review` renders exactly one
  (`main` count 1, `#main` count 1, measured below). The nested-main
  kit item SHO-1136 does not arise on this host.
- **No ad slot, CSP, carousel, `[data-slide]`, video or iframe** in the host, so
  there is no `data-review-private` decision, no CSP to widen and no slide wiring.

## Not changed, deliberately

- **Home hero entrance animations.** `src/app/page.module.css` has 6
  `animation:` declarations (1 logoReveal, 5 fadeUp). Each runs once on load and the last
  finishes 1.4 s after it; none loops. They are not wired to the selection state.
- **Contact and nominate forms.** The SHO-1125 commits leave
  `src/app/api/contact/route.ts` and `src/app/api/nominate/route.ts` alone; their
  fix is SHO-1138, its own commit (see "Before enabling").
- **`.vercelignore`** already lists `.env*`, so it was not changed. That pattern
  also covers the committed `.env.example`, which is harmless on this host's remote
  build (see Deploy).
- **The dev and start port 3004** in `package.json` is state-websites' assigned
  port; out of scope here, and no local server in this work used it.

## Configuration

All server-side; none is `NEXT_PUBLIC_*`; none is committed. `.env.example` (new)
carries the kit's 15 names, every value empty; the host's existing
`.env.local.example` (`RESEND_API_KEY`, `CONTACT_EMAIL`) is unchanged. The kit
renamed the 0.2.0 singular `REVIEW_ACCESS_EMAIL` to the plural
`REVIEW_ACCESS_EMAILS` in 0.3.0 (kit CHANGELOG); this sentence keeps the old name once on purpose,
because `source.test.mjs` uses this record as its positive control. The lead
reports the store and secrets as provisioned; this branch read no values.

| Name | Secret | Value for this client |
|---|---|---|
| `REVIEW_ENABLED` | no | `false` until the acceptance drive |
| `REVIEW_SITE_ID` | no | the lead's provisioned id (lowercase, digits, hyphens) |
| `REVIEW_SITE_NAME` | no | Utah Trapshooting Hall of Fame |
| `REVIEW_REPOSITORY` | no | `https://github.com/sh0tC0dev/utah-hall-of-fame` |
| `REVIEW_SITE_URL` | no | `https://utahtraphalloffame.com` (the apex and `www` both answer 200 / 200 with no redirect; 0 files in `src` name a canonical or `metadataBase`) |
| `REVIEW_STORAGE_NAMESPACE` | no | `production` |
| `REVIEW_ACCESS_EMAILS` | no | the reviewer list Jon approves, plus `jon@shotcopro.com` for the drive |
| `REVIEW_OWNER_EMAIL` | no | `jon@shotcopro.com` |
| `REVIEW_INTAKE_EMAIL` | no | `atlas@shotcopro.com` |
| `REVIEW_FROM_EMAIL` | no | `ShotCo Review <noreply@forms.shotcopro.com>` |
| `RESEND_API_KEY` | **yes** | shared by name with `/api/contact` and `/api/nominate`: whichever key is set serves the tool and both forms |
| `REVIEW_SECRET` | **yes** | a fresh secret per environment |
| `BLOB_READ_WRITE_TOKEN` | **yes** | this client's own private Blob store |
| `REVIEW_SOURCE_VERSION` | no | unset; derived from Vercel's commit sha at build time |
| `REVIEW_TRUSTED_PROXY` | no | unset (Vercel) |

## Before enabling (for the lead)

1. **The site's own forms: found in the round-2 review (MEDIUM, live before this
   install), fixed in SHO-1138.** Before SHO-1138, `/api/contact` and `/api/nominate`
   sent from `Utah HOF <onboarding@resend.dev>` to 2 trustee addresses, and both
   ignored the error `resend.emails.send` returns, so a refusal reached the visitor
   as success. This site's `RESEND_API_KEY` is on the ShotCo Resend account (the
   lead's provisioning note), where the lead measured HTTP 403 for that testing
   sender and a non-owner recipient (NLO Alaska, SHO-1134), so both forms were very
   likely failing while answering success. SHO-1138 is the last commit on this
   branch, kept apart so it reverts alone: both routes send from
   `Utah Trapshooting Hall of Fame <utah-hof-contact@forms.shotcopro.com>`, the
   contact route keeps the visitor's address as reply-to and refuses one carrying
   whitespace or a line break (the nomination form collects no visitor address, so
   it has no reply-to), and each route answers its existing 500 when Resend refuses.
   Recipients, fields and copy are unchanged. The review tool reads the same
   `RESEND_API_KEY` but its code does not touch the forms; a change of that key's
   value reaches all three.
2. **The unshipped `add-vercel-analytics` branch** (in the main checkout, no
   upstream) mounts `<Analytics />` with no `beforeSend`. If it merges after this
   install it must gain one that drops `/review`, `/review/...` and `/api/review`
   (Tucson's `src/components/tucson/SiteAnalytics.tsx` is the model).
3. **Items for the selection drive:** the sticky `Nav` under the review layer, the
   reveal rule on a real selection, and the trigger's vertical position (it sits
   a little above the text's middle line, see the screenshot).

Owner acceptance of SECURITY.md Retention and Unfinished: pending (lead records Jon's answer)

## Dependencies

Three runtime dependencies were added to `package.json`, exact-pinned:

| Package | Version | Why |
|---|---|---|
| `@vercel/blob` | 2.8.0 | `src/lib/review/store.ts` (private Blob CAS reads and writes) |
| `html-to-image` | 1.11.13 | `src/components/review/capture.ts` (the snapshot) |
| `sharp` | 0.35.5 | the route re-encodes snapshots and attachments. Already in the tree through `next` at 0.35.5 (the kit lists 0.35.4; the host's version was kept, never downgraded) |

`next` 16.3.8, `react` 19.2.4 and `resend` 6.9.4 did not move. Against the
base lockfile, `npm install` added 26 entries, removed 0, changed
only the dev or optional flags of 10 existing entries, and moved 0
versions; a second `npm install` reported "up to date" and left the lockfile
byte-identical. The new runtime chain worth naming is `@vercel/blob` -> `@vercel/oidc` -> `@vercel/cli-exec` -> `execa`: `store.ts` imports
`@vercel/blob` at module scope, so it loads on any request to `/api/review`. A
`package.json` `scripts` change: `test` was added (above).

## Verification (branch `feat/shotco-review`)

Each gate ran bare in the worktree with its exit read directly, never through a
pipe, under Node v24.13.1. `REVIEW_ENABLED` was unset for every gate but the
flag-on build. No `.env.local` exists in the worktree.

| Gate | Command | Result |
|---|---|---|
| Tests | `npm test` | EXIT=0, 122 tests, 122 pass, 0 fail (120 kit + 2 host wiring) |
| Types | `npx tsc --noEmit` | EXIT=0, 0 output lines |
| Lint | `npm run lint` (`eslint`) | EXIT=0, 2 problems (0 errors, 2 warnings), in `src/app/contact/ContactForm.tsx`, `src/app/inductees/page.tsx`; the base had 2 problems (0 errors, 2 warnings) in `src/app/contact/ContactForm.tsx`, `src/app/inductees/page.tsx`. None is in a review file, a test or the wiring |
| Audit | `npm audit --omit=dev` | EXIT=1, 4 vulnerabilities (3 moderate, 1 high), identical to the base by package and severity: `source-map-js` high; `uuid` moderate, with `resend` and `svix` flagged as dependents. Pre-existing and out of this change's scope (`next` -> `postcss` -> `source-map-js`; `resend` -> `svix` -> `uuid`); no added package is flagged |
| Build | `next build`, flag unset | EXIT=0 at `4a928b7`, 56 static pages; `/review` static and `/api/review` dynamic in the route table |

**Plant.** Committed first, then the gate `reviewEnabled() && ` was dropped from
the footer trigger (`{reviewEnabled() && (` became `{(`). `tests/host-wiring.test.mjs`
ran 2 tests: 1 passed and 1 failed ("the footer renders the review trigger only when review is enabled").
Reverted by the inverse edit: the marker now occurs 0 times and the token once,
`git diff --quiet` clean, and `Footer.tsx` hashes to its committed blob
`5f921a3bfa28`. Plant, test and revert were separate commands.
A second plant, from the round-2 review (round 3, on `ca7870f`): the 5-line
`:root[data-review-selecting="true"] .scroll-reveal` rule in `src/app/globals.css`
was replaced by a marker comment, and the same file ran 2 tests: 1 passed and
1 failed ("scroll reveals show their finished state while a reviewer is selecting").
Reverted by the inverse edit: the marker occurs 0 times and the rule 1,
`git diff --quiet` clean, and `globals.css` hashes to its committed blob `b3f9dd735f70`.
Plant, test and revert were separate commands.

**Flag off** (production build, `REVIEW_ENABLED` unset, measured 2026-10-06 15:59:13 PDT):
51 prerendered HTML files; 0 carry `data-review-ui`, 0 carry
"Open client review" and 0 carry the workspace text, against 50 that
carry the footer attribution (positive control). `review.meta` status is
404, so `/review` is the site's own 404. The built home footer equals the
live footer once the live copy's 3 Vercel `dpl=` image tokens are stripped:
842 characters (844 bytes) each, sha256 `92d302ea883f2059`; the same
compare with one character changed reads unequal.

**Flag on, values missing** (`REVIEW_ENABLED=true` for the build and the server,
nothing else set; `next start` on port 3164, the listening pid 20886 being
the one started; measured 2026-10-06 15:58:10 PDT): `GET /api/review` answered 503 with
`{"error": "Client review is not set up on this site yet.", "configured": false}`, `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`; `/review`
answered 200; the home carries 1 launcher. In the browser
at 1440 px wide the launcher sits in the footer at x, y, width, height
(954, 792, 24, 24), on screen true, right after the "Utah State Trapshooting Association" link. Clicking it scrolled
to the top (scrollY 0) and showed the not-set-up notice (true)
with 0 PIN inputs; `/review` showed the same notice (true) with
0 PIN inputs. At 390 px wide the launcher sits at (274, 712, 24, 24) and the page is
390 px wide (no horizontal scroll). Reveal rule, on an injected unrevealed
`.scroll-reveal` element (opacity, transform, transition): attribute unset
"0 | matrix(1, 0, 0, 1, 0, 28) | 0.7s, 0.7s", `"false"` "0 | matrix(1, 0, 0, 1, 0, 28) | 0.7s, 0.7s", `"true"` "1 | none | 0s". The server was stopped by
its pid. Screenshots (scratch, not committed): `flag-on-footer-1440.png`,
`flag-on-footer-1440-zoom.png`, `flag-on-launcher-notice-1440.png`,
`flag-on-review-page-1440.png`, `flag-on-footer-390.png`,
`flag-on-footer-390-zoom.png`.

## Acceptance checklist (docs/ACCEPTANCE.md, 16 items)

| # | Item | Status |
|---|---|---|
| 1 | Flag off; flag on with a value missing | done locally (both builds above) |
| 2 | Listed address gets its PIN, unlisted gets the same line | lead: after deploy |
| 3 | Wrong, expired, replayed, other-browser PINs fail | lead: after deploy (the kit service tests cover the logic with fake transport and storage) |
| 4 | Footer icon placement; launch scrolls to top; GO | placement and scroll-to-top done locally; GO: lead: after deploy |
| 5 | Add Comment; hover box follows | lead: after deploy |
| 6 | Save quietly; drafts survive | lead: after deploy |
| 7 | Two tabs | lead: after deploy |
| 8 | Screenshots accurate | lead: after deploy |
| 9 | Carousels and reveals pause | reveal rule done and measured on an injected element; live selection: lead: after deploy |
| 10 | Authorized test send | lead: after deploy |
| 11 | Attach Files | lead: after deploy |
| 12 | Refused file kind | lead: after deploy |
| 13 | Report links; routes out of analytics and sitemap | sitemap: done (none on the host); analytics: done, the host runs none and loads no ad embed; report: lead: after deploy |
| 14 | Keyboard, focus, dialogs; no public page regression | flag-off footer equal to live; keyboard drive: lead: after deploy |
| 15 | Unit tests, lint, typecheck, build | done (above) |
| 16 | Retention and hosting limits reviewed | pending owner acceptance (above) |

## Deploy

The documented recipe is `CLAUDE.md` line 3 ("`vercel --prod` only. Never
preview. Production Gate required.") and lines 18 to 20
(`cd ~/Desktop/dev/utah-hall-of-fame && vercel --prod --yes`, project
`prj_EtK1jGrApZpPJIRHMYO025lSF0O4`). It is a remote build: the live deployment's file list holds the source
tree (36 files under `src/app`) and 0 prebuilt-output paths. Deploy from this branch after the lead
merges it (it fast-forwards `origin/main`, which is at `e4f9812`), never from the main checkout
as it stands, which is on `add-vercel-analytics` with uncommitted files. That
checkout has no `.vercel` folder, so link the deploying tree first
(`npx vercel link --project utah-hall-of-fame --yes`). `.vercelignore` excludes
`.env*`, the committed `.env.example` included; a remote build never reads it,
so stay on remote builds. `vercel.json` (`e4f9812`) turns off git-triggered
deploys for `main` and `master`.

## Measurements (lead, after the deploy)

| Item | Value |
|---|---|
| Deploy id / created | |
| Built from (sha) | |
| `REVIEW_SOURCE_VERSION` stamped | |
| Home HTML "Open client review" | |
| `GET /api/review` no cookie (401 configured / 503 value missing) | |
| Upload audit (env-named files) | |
| Drive: PIN, change, four attachment kinds, refused kind, batch in Atlas | |
| Reviewers | |
