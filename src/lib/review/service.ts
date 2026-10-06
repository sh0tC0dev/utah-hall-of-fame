import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto"
import type { Anchor, Attachment, Batch, Mailer, Note, ReviewStore, Workspace } from "./types"
import { KIT_VERSION } from "./version.ts"
import { BATCH_FILES_MAX_BYTES, FILES_PER_NOTE, FILE_MAX_BYTES, UPLOADS_PENDING_MAX, formatBytes, safeName } from "./files.ts"
import { inspectFile } from "./inspect.ts"

export class ReviewError extends Error {
  status: number
  constructor(message: string, status = 400) { super(message); this.status = status }
}
type Challenge = { digest: string; expires: number; attempts: number; nextRequest: number; reviewer: string }
type Session = { expires: number; reviewer: string }
type Access = { challenges: Record<string, Challenge>; sessions: Record<string, Session>; requests: { ip: string; reviewer?: string; time: number }[] }
// 0.1.0 and 0.2.0 stored a session as a bare expiry number, which carries no
// reviewer. Those are treated as absent: the host's reviewers re-PIN once after
// an upgrade rather than holding an unidentified session.
const liveSession = (value: Session | undefined, now: number): value is Session =>
  !!value && typeof value === "object" && typeof value.expires === "number" && value.expires > now
const blankAccess = (): Access => ({ challenges: {}, sessions: {}, requests: [] })
// The ceilings every PIN request meets, listed or not: this browser's 60s
// cooldown, then per hour 20 requests overall and 15 for one ip (an office
// shares a connection). Only listed requests fill them. One predicate for both
// paths in requestPin, so the unlisted answer cannot drift from the listed one.
const sharedCeilingHit = (a: Access, owner: string, ipHash: string, now: number) => {
  const recent = a.requests.filter(r => r.time > now - 3_600_000)
  return (a.challenges[owner]?.nextRequest ?? 0) > now || recent.length >= 20 || recent.filter(r => r.ip === ipHash).length >= 15
}
// 5 an hour for any one address, counted by its hash.
const addressFull = (a: Access, reviewerHash: string, now: number) =>
  a.requests.filter(r => r.time > now - 3_600_000 && r.reviewer === reviewerHash).length >= 5
const blankWorkspace = (): Workspace => ({ revision: 0, notes: [], batches: [] })
const TEN_MINUTES = 600_000
const DAY = 86_400_000
// Every PIN request and every PIN check answers no sooner than this after it
// arrived, listed address or not. Neither waits on the store write and Resend
// call only a listed address costs (that work runs beside the floor, through
// defer), so the floor covers the one access read both paths share.
export const PIN_REQUEST_FLOOR = 2_000
// Retention: a report and everything it carries expire together, the retention
// window after the report was sent (or, for a report never sent, after it was
// created). This is a kit constant, not an environment variable, so a host
// configures nothing new. Derived from DAY.
export const RETENTION_DAYS = 90
export const RETENTION_WINDOW = RETENTION_DAYS * DAY
// A report and its objects are deleted only once the report is past its expiry
// PLUS this grace, so an expired link keeps answering 410 for a week before the
// objects are gone and the link degrades to a 404.
export const PURGE_GRACE_DAYS = 7
export const PURGE_GRACE = PURGE_GRACE_DAYS * DAY
// One page of list results, an explicit cap: the sweep reads a single page with
// no cursor, so a prefix holding more than this many objects has its later pages
// never swept. This caps the LIST call to one page; it does NOT cap the sweep's
// work, which runs one sequential store.read per listed batch/ record inside the
// awaited send (up to this many reads as the prefix fills toward the cap). What
// bounds the impact is where the sweep runs, not this number: it runs only after
// Resend has delivered and the workspace write has landed, and its own failure is
// caught, so a sweep that times out past maxDuration neither sends twice nor
// loses the report, and the reviewer's retry takes the already-sent receipt path.
export const PURGE_SCAN_MAX = 1000
export const newIdentity = () => randomBytes(32).toString("hex")
export const validIdentity = (s: unknown): s is string => typeof s === "string" && /^[a-f0-9]{64}$/.test(s)
const same = (a: string, b: string) => /^[a-f0-9]{64}$/.test(a) && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
const imageUrl = (value: string, origin: string) => {
  try { const url = new URL(value, origin); return ["https:", "http:"].includes(url.protocol) ? url.href : null } catch { return null }
}
const safeOrigin = (value: unknown) => {
  try { const url = new URL(String(value)); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.origin : "" } catch { return "" }
}
const clean = (x: unknown, limit: number) => typeof x === "string" ? x.trim().slice(0, limit) : ""
const number = (x: unknown, min: number, max: number) => typeof x === "number" && Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : min
export function validateAnchor(input: unknown): Anchor {
  if (!input || typeof input !== "object") throw new ReviewError("Select something on the page first.")
  const a = input as Record<string, unknown>
  const viewport = (a.viewport || {}) as Record<string, unknown>
  const rect = (a.rect || {}) as Record<string, unknown>
  const path = clean(a.url, 1500)
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\r\n]/.test(path)) throw new ReviewError("Invalid page address.")
  return { origin: safeOrigin(a.origin), fragment: clean(a.fragment, 500), renderedImage: clean(a.renderedImage, 2000), selector: clean(a.selector, 2000), tag: clean(a.tag, 30), text: clean(a.text, 400), image: clean(a.image, 1500), alt: clean(a.alt, 300),
    x: number(a.x, 0, 1), y: number(a.y, 0, 1), pageX: number(a.pageX, 0, 200000), pageY: number(a.pageY, 0, 200000),
    rect: { x: number(rect.x, -200000, 200000), y: number(rect.y, -200000, 200000), width: number(rect.width, 0, 200000), height: number(rect.height, 0, 200000) },
    viewport: { width: number(viewport.width, 1, 10000), height: number(viewport.height, 1, 10000), dpr: number(viewport.dpr, .1, 10), scrollX: number(viewport.scrollX, 0, 200000), scrollY: number(viewport.scrollY, 0, 200000) },
    slide: clean(a.slide, 80), title: clean(a.title, 250), browser: clean(a.browser, 500), version: clean(a.version, 100), url: path }
}
export class ReviewService {
  store: ReviewStore; mail: Mailer; config: { secret: string; reviewers: string[]; owner: string; from: string; intake: string; siteUrl: string; siteName: string; repository: string }; now: () => number; wait: (ms: number) => Promise<void>; defer: (work: Promise<unknown>) => void
  // defer keeps work alive past the response: the route passes Next's after(),
  // so the swap and mail a listed address costs never hold the answer back.
  constructor(store: ReviewStore, mail: Mailer, config: ReviewService["config"], now = Date.now, wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)), defer = (work: Promise<unknown>) => { void work }) {
    this.store = store; this.mail = mail; this.config = config; this.now = now; this.wait = wait; this.defer = defer
  }
  hash(value: string) { return createHmac("sha256", this.config.secret).update(value).digest("hex") }
  owner(identity: string) { return this.hash("browser:" + identity) }
  batchKey(id: string) { return this.hash("batch:" + id) }
  async requestPin(identity: string, ip: string, email: string) {
    const reviewer = email.trim().toLowerCase(), now = this.now()
    // Every address gets the same answer at the same floor, so this request is no
    // lookup of who reviews the site. From 0.5.2 that includes a refusal (a full
    // ceiling, this browser's cooldown, a refusal inside the swap, a failed store
    // write or email), because each can only happen to a listed address, and the
    // answer never waits on the swap and mail only a listed address costs: that
    // work runs beside the floor and past it if it must, so contention or a slow
    // provider cannot show. The limits still hold; a refused request is not
    // mailed. An unlisted address reads the access record once and writes
    // nothing, so junk addresses can neither run up store writes nor lock real
    // reviewers out.
    const listed = this.config.reviewers.includes(reviewer)
    try {
      const owner = this.owner(identity), ipHash = this.hash("ip:" + ip), reviewerHash = this.hash("reviewer:" + reviewer)
      // Refuse from one read on both paths, before any write: a request refused
      // here writes nothing. One that passes this read and is refused inside the
      // swap still writes the pruned access record, after the answer. An
      // unlisted address has no rows of its own, so only the shared ceilings can
      // refuse it. The swap in issuePin rechecks, as verify() does.
      const access = await this.store.read<Access>("access")
      if (access && (sharedCeilingHit(access, owner, ipHash, now) || addressFull(access, reviewerHash, now))) return
      if (!listed) return
      const work = this.issuePin(owner, ipHash, reviewer, reviewerHash, now).catch(error => {
        // Logged for the operator by error name only, as the route logs.
        console.error("ShotCo Review: a PIN could not be issued:", error instanceof Error ? error.name : "unknown error")
      })
      // after() throws where the platform has no waitUntil; only this path
      // defers, so a throw here must not reach the answer.
      try { this.defer(work) } catch { void work }
    } finally { await this.wait(Math.max(0, now + PIN_REQUEST_FLOOR - this.now())) }
  }
  // The work only a listed address costs: the swap that records the challenge,
  // then the mail. It never decides the answer requestPin gives.
  private async issuePin(owner: string, ipHash: string, reviewer: string, reviewerHash: string, now: number) {
    const pin = String(randomInt(1_000_000)).padStart(6, "0")
    const allowed = await this.store.change("access", blankAccess, a => {
      a.requests = a.requests.filter(r => r.time > now - 3_600_000)
      for (const [id, c] of Object.entries(a.challenges)) if (c.expires < now) delete a.challenges[id]
      for (const [id, session] of Object.entries(a.sessions)) if (!liveSession(session, now)) delete a.sessions[id]
      // The shared ceilings, then 5 an hour for any one address. Rows written
      // before 0.3.0 carry no reviewer and count only toward the shared ones.
      if (sharedCeilingHit(a, owner, ipHash, now) || addressFull(a, reviewerHash, now)) return false
      a.challenges[owner] = { digest: this.hash(owner + ":" + pin), expires: now + TEN_MINUTES, attempts: 0, nextRequest: now + 60_000, reviewer }
      a.requests.push({ ip: ipHash, reviewer: reviewerHash, time: now }); return true
    })
    // Refused inside the swap (a race with another request): not mailed.
    if (!allowed) return
    await this.mail({ from: this.config.from, to: [reviewer], bcc: reviewer === this.config.owner.toLowerCase() ? undefined : [this.config.owner],
      subject: `${this.config.siteName}: review access code`, text: `Your ${this.config.siteName} review code is ${pin}.\n\nEnter it in the browser where access was requested. It expires in 10 minutes and can be used once.\n\nIf you did not request access, you can ignore this message.` }, "review-pin/" + randomUUID())
  }
  async verify(identity: string, pin: string) {
    if (!/^\d{6}$/.test(pin)) throw new ReviewError("Enter a valid six-digit PIN.")
    const owner = this.owner(identity), now = this.now()
    // A wrong PIN costs a read and a read-and-write after a listed request and a
    // single read after an unlisted one. The answer comes at the floor either
    // way: the swap races the floor, and one that fails or is still running
    // there answers the same 401 as no challenge at all (it still finishes, and
    // still counts the attempt, after the answer). One floor timer, started
    // here, is the only wait on either path.
    const floor = this.wait(Math.max(0, now + PIN_REQUEST_FLOOR - this.now()))
    let accepted = false
    try {
      // Reject unknown/expired challenges without a write to the shared access
      // record. The atomic callback still rechecks and consumes real attempts.
      const challenge = (await this.store.read<Access>("access"))?.challenges[owner]
      if (challenge && challenge.expires >= now && challenge.attempts < 5) {
        const swap = this.store.change("access", blankAccess, a => {
          const c = a.challenges[owner]
          if (!c || c.expires < now || c.attempts >= 5) return false
          c.attempts++
          if (!same(c.digest, this.hash(owner + ":" + pin))) return false
          delete a.challenges[owner]; a.sessions[owner] = { expires: now + 14 * DAY, reviewer: c.reviewer }; return true
        }).catch(error => {
          console.error("ShotCo Review: a PIN check could not be recorded:", error instanceof Error ? error.name : "unknown error")
          return false
        })
        try { this.defer(swap) } catch { void swap }
        accepted = await Promise.race([swap, floor.then(() => false)])
      }
    } finally { await floor }
    if (!accepted) throw new ReviewError("That PIN is invalid or expired. Try again or request access.", 401)
  }
  async authorize(identity: string) {
    const owner = this.owner(identity), a = await this.store.read<Access>("access")
    const session = a?.sessions[owner]
    if (!liveSession(session, this.now())) throw new ReviewError("Enter your PIN to continue. Your saved changes are safe.", 401)
    return { owner, reviewer: session.reviewer }
  }
  async logout(identity: string) {
    await this.authorize(identity)
    await this.store.change("access", blankAccess, a => { delete a.sessions[this.owner(identity)] })
  }
  // The stored workspace plus who is holding this session, so the dialog can
  // say whose changes these are and the next batch can name its sender.
  async workspace(identity: string): Promise<Workspace & { reviewer: string }> {
    const { owner, reviewer } = await this.authorize(identity)
    const workspace = await this.store.read<Workspace>("workspace/" + owner) ?? blankWorkspace()
    // A receipt in `batches` is the snapshot stored when the report was sent and
    // never learns a later revocation, so a revoked report would look live again
    // after a reload. Merge each listed receipt's current revokedAt from its own
    // batch record. Bounded at ten reads (send keeps batches.slice(0, 10)); a read
    // that throws leaves that receipt as stored, so it never breaks the load.
    const batches: Batch[] = []
    for (const receipt of workspace.batches ?? []) {
      try {
        const record = await this.store.read<Batch>("batch/" + receipt.id)
        batches.push(record?.revokedAt !== undefined ? { ...receipt, revokedAt: record.revokedAt } : receipt)
      } catch { batches.push(receipt) }
    }
    return { ...workspace, batches, reviewer }
  }
  /**
   * Take a file a reviewer picked and hold it until a change claims it.
   *
   * The received length is checked before anything is decoded, then the bytes
   * themselves decide what the file is; the name the browser sent only
   * survives `safeName`. The pending cap is checked once before the object is
   * written, so a refused upload normally writes nothing; the object is then
   * written before the ledger entry, so a ledger entry always has a file
   * behind it, and the cap check inside the atomic change is the race guard:
   * a refusal there (two tabs at the cap) leaves an object nothing points at,
   * which is the orphaned-upload case docs/SECURITY.md lists under retention.
   * An upload is not an edit of the change list, so the revision does not
   * move and another tab's list stays valid.
   */
  async attach(identity: string, file: { name: unknown; bytes: Uint8Array }) {
    const { owner } = await this.authorize(identity)
    // Remove and Discard in the dialog never touch the ledger; only a saved change or the 24 h prune shrinks it.
    const pendingFull = () => new ReviewError("Too many uploaded files are waiting to be saved. Save the change they belong to, or try again in a day.", 409)
    if (file.bytes.length > FILE_MAX_BYTES) throw new ReviewError(`That file is too large. The limit is ${formatBytes(FILE_MAX_BYTES)}.`, 413)
    const inspected = await inspectFile(file.bytes)
    if (!inspected) throw new ReviewError("Attach a JPEG, PNG, WebP or PDF file.", 415)
    const now = this.now(), attachment: Attachment = { id: randomUUID(), name: safeName(file.name, inspected.ext), type: inspected.type, size: inspected.bytes.length }
    const held = ((await this.store.read<Workspace>("workspace/" + owner))?.uploads ?? []).filter(u => u.createdAt > now - DAY)
    if (held.length >= UPLOADS_PENDING_MAX) throw pendingFull()
    await this.store.putFile(attachment.id, inspected.bytes, inspected.type)
    return this.store.change("workspace/" + owner, blankWorkspace, w => {
      const uploads = (w.uploads ?? []).filter(u => u.createdAt > now - DAY)
      if (uploads.length >= UPLOADS_PENDING_MAX) throw pendingFull()
      uploads.push({ ...attachment, createdAt: now }); w.uploads = uploads; return attachment
    })
  }
  /**
   * The files this save may put on its change, resolved against what the
   * server holds rather than what the request says.
   *
   * A request carries ids and nothing else that is believed: every id must be
   * one this browser uploaded and has not yet spent, or one already on the
   * change being edited, and the name, type and size come from that record.
   * Ids the browser claims but the server cannot place are a 409 rather than a
   * silently shortened list, so a reviewer is told to attach the file again.
   */
  attachmentsFor(w: Workspace, existing: Note | undefined, requested: unknown): Attachment[] {
    const unavailable = () => new ReviewError("That attachment is not available. Attach it again.", 409)
    // A save that omits the key leaves an existing change's files as they are.
    if (requested === undefined) return existing?.attachments ?? []
    if (!Array.isArray(requested)) throw unavailable()
    if (requested.length > FILES_PER_NOTE) throw new ReviewError(`A change carries up to ${FILES_PER_NOTE} files.`, 409)
    const uploads = w.uploads ?? [], taken: Attachment[] = []
    for (const entry of requested) {
      const id = entry && typeof entry === "object" ? (entry as Record<string, unknown>).id : undefined
      if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id)) throw unavailable()
      const held = existing?.attachments?.find(a => a.id === id) ?? uploads.find(u => u.id === id)
      if (!held) throw unavailable()
      taken.push({ id: held.id, name: held.name, type: held.type, size: held.size })
    }
    w.uploads = uploads.filter(u => !taken.some(a => a.id === u.id))
    return taken
  }
  async save(identity: string, revision: number, input: { id?: string; comment?: unknown; anchor?: unknown; asset?: string; capture?: string; attachments?: unknown }) {
    const { owner } = await this.authorize(identity), text = typeof input.comment === "string" ? input.comment : ""
    if (!text.trim() || text.length > 4000) throw new ReviewError("Write a comment of 1 to 4,000 characters.")
    const anchor = validateAnchor(input.anchor), id = input.id || randomUUID(), now = this.now()
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new ReviewError("Invalid change ID.")
    return this.store.change("workspace/" + owner, blankWorkspace, w => {
      this.editable(w, revision)
      const existing = w.notes.find(n => n.id === id)
      if (input.id && !existing) throw new ReviewError("That change no longer exists.", 409)
      if (!existing && w.notes.length >= 20) throw new ReviewError("Send these 20 changes before collecting more.")
      const attachments = this.attachmentsFor(w, existing, input.attachments)
      const note: Note = existing ? { ...existing, comment: text, attachments } : { id, comment: text, anchor, createdAt: now, asset: input.asset, capture: clean(input.capture, 200), attachments }
      w.notes = existing ? w.notes.map(n => n.id === id ? note : n) : [...w.notes, note]; w.revision++; return w
    })
  }
  editable(w: Workspace, revision: number) {
    if (w.pending) throw new ReviewError("Finish sending the current batch before editing it.", 409)
    if (w.revision !== revision) throw new ReviewError("Changes were updated in another tab. Reload the list and try again.", 409)
  }
  async remove(identity: string, revision: number, id: string) {
    const { owner } = await this.authorize(identity)
    return this.store.change("workspace/" + owner, blankWorkspace, w => { this.editable(w, revision); w.notes = w.notes.filter(n => n.id !== id); w.revision++; return w })
  }
  async send(identity: string, revision: number) {
    const { owner, reviewer } = await this.authorize(identity), now = this.now(), proposed = randomUUID()
    const batch = await this.store.change("workspace/" + owner, blankWorkspace, w => {
      if (w.pending) return w.pending
      // Retrying a completed request returns its receipt, never sends again.
      const receipt = w.batches[0]
      if (!w.notes.length && receipt) return receipt
      this.editable(w, revision)
      if (!w.notes.length) throw new ReviewError("Collect at least one change first.")
      // Every attachment in the batch travels in one email, so the ceiling is
      // checked before the batch is frozen: a frozen batch can only be sent or
      // waited out, and one too heavy to deliver would be stuck.
      const carried = w.notes.reduce((total, n) => total + (n.attachments ?? []).reduce((sum, a) => sum + a.size, 0), 0)
      if (carried > BATCH_FILES_MAX_BYTES) throw new ReviewError(`These changes carry ${formatBytes(carried)} of attached files; the limit is ${formatBytes(BATCH_FILES_MAX_BYTES)}. Remove some files or send in two batches.`, 413)
      const b: Batch = { packageVersion: 2, siteName: this.config.siteName, repository: this.config.repository, reviewer, id: proposed, notes: structuredClone(w.notes), createdAt: now, from: this.config.from, to: this.config.intake, cc: this.config.owner, siteUrl: this.config.siteUrl }
      w.pending = b; w.revision++; return b
    })
    if (batch.sentAt) return batch
    if (now - batch.createdAt > 23 * 3_600_000) throw new ReviewError("This batch needs a delivery check by ShotCo before retrying. Your changes are saved.", 409)
    // Save the immutable report before sending its link. The read-only key is
    // in the fragment, so it is not sent to web-server access logs or referrers.
    await this.store.change<Batch, void>("batch/" + batch.id, () => batch, () => {})
    const link = `${batch.siteUrl}/review#batch=${batch.id}&key=${this.batchKey(batch.id)}`
    const lines = batch.notes.map((n, i) => `${i + 1}. ${n.comment}\nPage: ${batch.siteUrl}${n.anchor.url}\nElement: ${n.anchor.alt || n.anchor.text || n.anchor.tag}\nSelector: ${n.anchor.selector}\nPin within element: ${Math.round(n.anchor.x * 100)}%, ${Math.round(n.anchor.y * 100)}%\nPage position: ${n.anchor.pageX}, ${n.anchor.pageY}\nWindow: ${n.anchor.viewport.width} × ${n.anchor.viewport.height}; pixel ratio ${n.anchor.viewport.dpr}\nScroll: ${n.anchor.viewport.scrollX}, ${n.anchor.viewport.scrollY}\nSlide: ${n.anchor.slide || "none"}\nVersion: ${n.anchor.version}\nBrowser: ${n.anchor.browser}\nCapture: ${n.capture}`).join("\n\n")
    const attachments: { filename: string; content: string }[] = []
    for (const [i, note] of batch.notes.entries()) if (note.asset) {
      const image = await this.store.getImage(note.asset)
      if (image) attachments.push({ filename: `change-${i + 1}.jpg`, content: Buffer.from(image).toString("base64") })
    }
    // Each attachment travels under `change-<n>-file-<k>-<name>`, which keeps
    // every filename in the email unique even when two changes carry files of
    // the same name. A file the store no longer holds is not an error: the
    // batch is already frozen and the comment is worth more than the file, so
    // the change says the file is missing and the manifest carries a null
    // filename for it.
    const noteFiles: { id: string; name: string; filename: string | null; type: string; size: number }[][] = []
    for (const [i, note] of batch.notes.entries()) {
      const carried: (typeof noteFiles)[number] = []
      for (const [k, file] of (note.attachments ?? []).entries()) {
        const stored = await this.store.getFile(file.id)
        const filename = stored ? `change-${i + 1}-file-${k + 1}-${file.name}` : null
        if (stored && filename) attachments.push({ filename, content: Buffer.from(stored.bytes).toString("base64") })
        carried.push({ id: file.id, name: file.name, filename, type: file.type, size: file.size })
      }
      noteFiles.push(carried)
    }
    const describeFiles = (files: (typeof noteFiles)[number]) => files.length ? files.map(a => a.filename ? `${a.filename} (${a.type}, ${formatBytes(a.size)})` : `${a.name} (file missing)`).join("; ") : "none"
    let emailText = `${batch.siteName || "Website"} review submission\nBatch: ${batch.id}\nCollected: ${new Date(batch.createdAt).toISOString()}\n\nView the complete batch: ${link}\n\n${lines}`
    if (batch.packageVersion === 2) {
      const changes = batch.notes.map((note, index) => {
        const origin = note.anchor.origin || batch.siteUrl
        const screenshot = attachments.find(a => a.filename === `change-${index + 1}.jpg`)?.filename || null
        return { number: index + 1, id: note.id, comment: note.comment, collectedAt: new Date(note.createdAt).toISOString(),
          pageUrl: `${origin}${note.anchor.url}${note.anchor.fragment || ""}`, reviewedBuild: note.anchor.version,
          environment: /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(origin).hostname) ? "local" : "hosted",
          originalImageUrl: note.anchor.image ? imageUrl(note.anchor.image, origin) : null,
          screenshot, attachments: noteFiles[index] ?? [], capture: note.capture, anchor: note.anchor }
      })
      const manifest = { schemaVersion: 1, kitVersion: KIT_VERSION, project: batch.siteName || "Website", repository: batch.repository || "", reviewer: batch.reviewer ?? null, batchId: batch.id,
        submittedAt: new Date(batch.createdAt).toISOString(), reportUrl: link, changes }
      attachments.push({ filename: "changes.json", content: Buffer.from(JSON.stringify(manifest, null, 2)).toString("base64") })
      emailText = `${batch.siteName || "Website"} review submission\nBatch: ${batch.id}\nSubmitted: ${manifest.submittedAt}\nRepository: ${manifest.repository}${manifest.reviewer ? `\nReviewer: ${manifest.reviewer}` : ""}\n\nComplete structured details: changes.json\nPrivate report: ${link}\nLocal URLs require access to the review computer. The attached comments and snapshots are self-contained.\n\n` + changes.map(c =>
        `${c.number}. ${c.comment}\nChange ID: ${c.id}\nReviewed page: ${c.pageUrl}\nEnvironment: ${c.environment}\nReviewed build: ${c.reviewedBuild}\nElement: ${c.anchor.alt || c.anchor.text || c.anchor.tag}\nSelector: ${c.anchor.selector}\nOriginal image: ${c.originalImageUrl || "none"}\nScreenshot: ${c.screenshot || "unavailable"}\nAttachments: ${describeFiles(c.attachments)}\nViewport: ${c.anchor.viewport.width} × ${c.anchor.viewport.height}; pixel ratio ${c.anchor.viewport.dpr}\nScroll: ${c.anchor.viewport.scrollX}, ${c.anchor.viewport.scrollY}\nPin within element: ${Math.round(c.anchor.x * 100)}%, ${Math.round(c.anchor.y * 100)}%\nPage coordinates: ${c.anchor.pageX}, ${c.anchor.pageY}\nSlide: ${c.anchor.slide || "none"}\nCapture: ${c.capture}`
      ).join("\n\n")
    }
    // The last line of every batch email names the kit version the site runs,
    // so Atlas learns it from the batches it receives.
    emailText += `\n\nSent by ShotCo Review ${KIT_VERSION}`
    const providerId = await this.mail({ from: batch.from, to: [batch.to], cc: batch.cc ? [batch.cc] : undefined, reply_to: batch.reviewer, subject: `${batch.siteName || "Website"}: ${batch.notes.length} website change${batch.notes.length === 1 ? "" : "s"} [${batch.id.slice(0, 8)}]`,
      text: emailText, attachments }, "review-batch/" + batch.id)
    // Expiry is stamped here, at send time, as send time plus the retention
    // window. The stamp is not what makes a report expire: readBatch and the
    // sweep fall back to sentAt (or createdAt) plus the window for a record that
    // carries no expiresAt, so expiry is uniform and needs no stored migration.
    const sentAt = this.now()
    const sent = { ...batch, sentAt, expiresAt: sentAt + RETENTION_WINDOW, providerId }
    await this.store.change<Batch, void>("batch/" + batch.id, () => sent, b => { b.sentAt = sent.sentAt; b.expiresAt = sent.expiresAt; b.providerId = providerId })
    await this.store.change("workspace/" + owner, blankWorkspace, w => {
      if (w.pending?.id === batch.id) { w.batches.unshift(sent); w.batches = w.batches.slice(0, 10); w.notes = []; delete w.pending; w.revision++ }
    })
    // Opportunistic retention sweep. Send is the lowest-frequency authenticated
    // write, and the kit already prunes its upload ledger at the next upload, so
    // it sweeps here rather than on every read or keystroke-level write. It runs
    // only now that the batch is delivered, is bounded to one page, and any
    // failure is caught and logged so a broken sweep can never fail a delivery.
    try { await this.sweep() } catch (error) { console.error("[review] Retention sweep failed", error instanceof Error ? error.name : typeof error) }
    return sent
  }
  /**
   * Delete stored objects past retention, per report. The batch record is the
   * authority on its own lifetime and on the objects that die with it: for each
   * batch this page lists whose expiry (`expiryOf`) plus the grace is in the
   * past, the batch object and every image and file it references are deleted
   * together, whatever each asset's own capture time. A referenced key that
   * resolves to no stored object is skipped, not an error.
   *
   * Orphans are a separate pass: an image or file object that neither a listed
   * batch NOR a listed workspace references, older than the window plus the
   * grace, is the write-before-ledger leftover docs/SECURITY.md describes. It
   * unions every batch's references AND every workspace's (a draft names its
   * assets only there) before deleting anything, and refuses to run at all when
   * the listing filled its page or a workspace could not be read, because either
   * could hide the record that references an object here and it would read a
   * live report's or a draft's asset as an orphan.
   *
   * `workspace/` and `access` records are never swept: they are bounded (one per
   * owner, one per site) so there is no storage case. Because the orphan pass
   * reads each workspace into the keep-set, a draft's own screenshots and
   * attached files survive with the draft, so a reviewer's unsent work is not
   * deleted. The one exception is a frozen batch that was never delivered: its
   * `batch/` record is written before the mail, so under the uniform expiry
   * fallback (createdAt plus the window) the per-report pass deletes that report
   * and its assets at createdAt plus the window plus the grace, even though the
   * workspace still holds its pending notes. Bounded to one page, and it deletes
   * only pathnames this same list returned, so it can never touch anything
   * outside the prefix or on a page it did not read.
   */
  async sweep() {
    const now = this.now(), cutoff = now - (RETENTION_WINDOW + PURGE_GRACE)
    const { blobs, hasMore } = await this.store.list(PURGE_SCAN_MAX)
    // Resolve an asset tail (images/<k>.jpg, files/<id>) to the pathname this
    // store listed for it, whatever prefix that store carries.
    const pathFor = (tail: string) => blobs.find(x => x.pathname === tail || x.pathname.endsWith("/" + tail))?.pathname
    const doomed = new Set<string>(), referenced = new Set<string>()
    // The orphan pass may run only on a COMPLETE keep-set. `hasMore` reports a
    // further page the sweep never read; a full page can hide a batch; and a
    // workspace this list named but that cannot be read can hide a draft's
    // assets. Any of the three means the keep-set may be missing a live asset,
    // which the orphan pass would then delete, so `complete` requires no further
    // page AND a page that did not fill. It gates that one pass; the per-report
    // pass above and the batch deletions never depend on it.
    let complete = !hasMore && blobs.length < PURGE_SCAN_MAX
    for (const object of blobs) {
      const match = object.pathname.match(/(?:^|\/)batch\/([a-f0-9-]{36})\.json$/)
      if (!match || match[1] === undefined) continue
      // A batch/ record this list named but that cannot be read or parsed hides
      // the assets it references, so the batch loop refuses the orphan pass
      // through the same `complete` gate the workspace loop uses. The read is
      // wrapped like the workspace read: a throw here would abort the whole
      // sweep (safe, but it also strands every other report's per-report pass),
      // so a throw is treated as an incomplete keep-set, not a sweep failure.
      let batch: Batch | null
      try { batch = await this.store.read<Batch>("batch/" + match[1]) }
      catch { complete = false; continue }
      if (!batch) { complete = false; continue }
      const assets = this.batchAssets(batch)
      for (const tail of assets) referenced.add(tail)
      if (now >= this.expiryOf(batch) + PURGE_GRACE) {
        doomed.add(object.pathname)
        for (const tail of assets) { const path = pathFor(tail); if (path) doomed.add(path) }
      }
    }
    // A draft names its assets ONLY inside its workspace, and nothing above
    // reads those, so union every workspace's asset references into the keep-set
    // before the orphan pass, or an unsent screenshot or attached file is
    // deleted under the reviewer. A workspace this list named but that cannot be
    // read or parsed refuses the orphan pass through the same `complete` gate,
    // because its keep-set is then unknowable.
    for (const object of blobs) {
      const owner = object.pathname.match(/(?:^|\/)workspace\/([a-f0-9]{64})\.json$/)
      if (!owner || owner[1] === undefined) continue
      let workspace: Workspace | null
      try { workspace = await this.store.read<Workspace>("workspace/" + owner[1]) }
      catch { complete = false; continue }
      if (!workspace) { complete = false; continue }
      for (const tail of this.workspaceAssets(workspace)) referenced.add(tail)
    }
    // Orphans, only on a complete enumeration and keep-set: a full page may hide
    // a batch, and an unreadable workspace may hide a draft's assets.
    if (complete) for (const object of blobs) {
      const asset = object.pathname.match(/(images\/[^/]+\.jpg|files\/[^/]+)$/)
      if (asset && asset[1] !== undefined && !referenced.has(asset[1]) && object.uploadedAt < cutoff) doomed.add(object.pathname)
    }
    const stale = [...doomed]
    if (stale.length) await this.store.del(stale)
    return stale
  }
  // The image (images/<asset>.jpg) and file (files/<id>) objects a batch's notes
  // reference, derived from the record so the sweep never guesses a key shape.
  batchAssets(batch: Batch) {
    const tails: string[] = []
    for (const note of batch.notes) {
      if (note.asset) tails.push(`images/${note.asset}.jpg`)
      for (const file of note.attachments ?? []) tails.push(`files/${file.id}`)
    }
    return tails
  }
  // Every image (images/<asset>.jpg) and file (files/<id>) key a workspace names:
  // its unsent notes, the notes of a frozen-but-unsent pending batch, this
  // browser's upload ledger, and the receipts of its last sent reports
  // (`batches`). Same key shapes as batchAssets, derived from the record so the
  // sweep never guesses. `batches` is unioned because a just-sent report's
  // batch/ record may not be in the very next list(): Vercel documents
  // read-after-write for get(), not for list(), so without this a report
  // delivered moments ago has its assets read as aged orphans and deleted under
  // the client. That cannot keep a SWEPT report's assets alive, because this
  // set is read only by the orphan pass while the per-report pass dooms a
  // report's assets with its record independently of it.
  workspaceAssets(workspace: Workspace) {
    const tails: string[] = []
    const fromNotes = (notes: Note[] | undefined) => {
      for (const note of notes ?? []) {
        if (note.asset) tails.push(`images/${note.asset}.jpg`)
        for (const file of note.attachments ?? []) tails.push(`files/${file.id}`)
      }
    }
    fromNotes(workspace.notes)
    fromNotes(workspace.pending?.notes)
    for (const batch of workspace.batches ?? []) fromNotes(batch.notes)
    for (const upload of workspace.uploads ?? []) tails.push(`files/${upload.id}`)
    return tails
  }
  // A batch's expiry, uniform: the stamped expiresAt, else sentAt plus the
  // window, else (never sent) createdAt plus the window. There is no
  // never-expires case; 0.4.x records carry sentAt, so the fallback reads state
  // the record already holds and needs no migration.
  expiryOf(batch: Batch) {
    if (batch.expiresAt !== undefined) return batch.expiresAt
    if (batch.sentAt !== undefined) return batch.sentAt + RETENTION_WINDOW
    return batch.createdAt + RETENTION_WINDOW
  }
  expired(batch: Batch) { return this.now() >= this.expiryOf(batch) }
  /**
   * Revoke one batch. Any authenticated reviewer of this site may revoke any
   * batch of the site, through the existing session authorization; reviewers
   * are already a trusted allowlist, so this needs no new admin surface or
   * secret. The marker is written through the same compare-and-set helper as
   * every other batch write and is forward-only. It is idempotent: revoking an
   * already-revoked batch keeps its first revocation time. A batch that does
   * not exist (or was purged between calls) is a 404, never a newly created
   * empty record.
   */
  async revoke(identity: string, id: string) {
    await this.authorize(identity)
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new ReviewError("Invalid batch ID.", 400)
    const now = this.now(), missing = (): Batch => { throw new ReviewError("Batch not found.", 404) }
    return this.store.change<Batch, Batch>("batch/" + id, missing, b => {
      if (b.revokedAt === undefined) b.revokedAt = now
      return b
    })
  }
  async readBatch(id: string, key: string) {
    // ORDER IS A SECURITY REQUIREMENT. The id-shape check and the timing-safe
    // key comparison run before the state checks below, so a caller who does not
    // hold the correct key always gets the existing 403 and can never tell an
    // existing id from an absent one or learn a batch's state. Only a caller who
    // has already proved they hold the key reaches the 404 or the 410, so the
    // 410 leaks nothing about which links exist.
    if (!/^[a-f0-9-]{36}$/.test(id) || !same(key, this.batchKey(id))) throw new ReviewError("This review link is invalid.", 403)
    const batch = await this.store.read<Batch>("batch/" + id)
    if (!batch) throw new ReviewError("Batch not found.", 404)
    // Expired and revoked answer one shared refusal that does not say which, so
    // a key holder cannot tell an aged-out link from a revoked one.
    if (this.expired(batch) || batch.revokedAt !== undefined) throw new ReviewError("This review link is no longer available. Ask ShotCo for a new one.", 410)
    return batch
  }
}
