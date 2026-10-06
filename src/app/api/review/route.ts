import { after, NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import sharp from "sharp"
import { BlobReviewStore } from "@/lib/review/store"
import { ReviewError, ReviewService, newIdentity, validIdentity } from "@/lib/review/service"
import { clientIp, originAllowed, parseReviewers, reviewConfigured } from "@/lib/review/configured"
import type { Mailer } from "@/lib/review/types"

export const runtime = "nodejs"
export const maxDuration = 60
const COOKIE = "shotco_review"
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" }
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers })
class NotConfigured extends ReviewError {
  constructor() { super("Client review is not set up on this site yet.", 503) }
}
function service() {
  // Request time is where the whole configuration is checked, against the
  // deployment's own environment. The surface above is gated on the flag
  // alone (see src/lib/review/enabled.ts), so a deployment that turned the
  // flag on but lacks a value lands here on its first request and is told
  // apart from a reviewer who needs a PIN by `configured: false` below.
  if (!reviewConfigured().ok) throw new NotConfigured()
  const { REVIEW_SECRET, RESEND_API_KEY, REVIEW_SITE_NAME, REVIEW_REPOSITORY, REVIEW_SITE_URL } = process.env
  // reviewConfigured() above has already proved these present; narrow them for the config below.
  if (!REVIEW_SECRET || !RESEND_API_KEY || !REVIEW_SITE_NAME || !REVIEW_REPOSITORY || !REVIEW_SITE_URL) throw new NotConfigured()
  const mail: Mailer = async (message, key) => {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(message), signal: AbortSignal.timeout(20_000) })
    if (!response.ok) throw new ReviewError("We could not complete that request. Your saved changes are safe. Please retry.", 502)
    const result = await response.json()
    if (!result.id) throw new ReviewError("Delivery could not be confirmed. Please retry.", 502)
    return String(result.id)
  }
  return new ReviewService(new BlobReviewStore(), mail, { secret: REVIEW_SECRET, reviewers: parseReviewers(process.env.REVIEW_ACCESS_EMAILS), owner: process.env.REVIEW_OWNER_EMAIL || "jon@shotcopro.com", from: process.env.REVIEW_FROM_EMAIL || "ShotCo Review <noreply@forms.shotcopro.com>", intake: process.env.REVIEW_INTAKE_EMAIL || "atlas@shotcopro.com", siteName: REVIEW_SITE_NAME, repository: REVIEW_REPOSITORY, siteUrl: new URL(REVIEW_SITE_URL).origin }, undefined, undefined, work => after(work))
}
function identity(request: NextRequest) {
  const value = request.cookies.get(COOKIE)?.value
  if (!validIdentity(value)) throw new ReviewError("Request access to start reviewing.", 401)
  return value
}
async function body(request: NextRequest) {
  if (!originAllowed(request.headers.get("origin"), request.headers.get("host"))) throw new ReviewError("Request origin not allowed.", 403)
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ReviewError("Invalid request.", 415)
  const reader = request.body?.getReader(); if (!reader) throw new ReviewError("Missing request.")
  const chunks: Uint8Array[] = []; let size = 0
  // One ceiling for both payload kinds a request can carry: a section snapshot
  // and an attached file, each a base64 data URL inside the JSON. Vercel stops
  // a function's request body at 4.5 MB, and base64 is four bytes for three,
  // so this leaves a 3 MB file (FILE_MAX_BYTES) its 4 MB of request and room
  // for the rest of the object. The save action's own 2 MB raw screenshot cap
  // still applies inside it.
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 4_300_000) { await reader.cancel(); throw new ReviewError("That is too large to send. Try a smaller section or a smaller file.", 413) } chunks.push(value) }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ReviewError("Invalid request.")
    return parsed as Record<string, unknown>
  } catch { throw new ReviewError("Invalid request.") }
}
function failure(error: unknown) {
  if (error instanceof NotConfigured) return json({ error: error.message, configured: false }, error.status)
  if (error instanceof ReviewError) return json({ error: error.message }, error.status)
  // Never log PINs, credentials, submitted text, or email transport payloads;
  // the error's name is enough to tell a provider failure from a code path.
  console.error("[review] Request failed", error instanceof Error ? error.name : typeof error)
  return json({ error: "Review is temporarily unavailable. Your saved changes are safe. Please retry." }, 503)
}
export async function GET(request: NextRequest) {
  try {
    const s = service(), batchId = request.nextUrl.searchParams.get("batch"), asset = request.nextUrl.searchParams.get("asset"), file = request.nextUrl.searchParams.get("file")
    const batch = batchId ? await s.readBatch(batchId, request.headers.get("authorization")?.replace(/^Bearer /, "") || "") : null
    const workspace = batch ? null : await s.workspace(identity(request))
    const reachable = batch?.notes || [...(workspace?.notes || []), ...(workspace?.batches.flatMap(b => b.notes) || [])]
    if (asset) {
      if (!reachable.some(n => n.asset === asset)) throw new ReviewError("Snapshot not found.", 404)
      const image = await s.store.getImage(asset)
      if (!image) throw new ReviewError("Snapshot not found.", 404)
      return new Response(Buffer.from(image), { headers: { ...headers, "Content-Type": "image/jpeg" } })
    }
    if (file) {
      // Mirrors the asset branch: a file is readable only through a change the
      // caller can already read, or through this browser's own upload ledger
      // for one it has attached but not yet saved. It is served as a download
      // rather than a document, so a PDF a reviewer attached never renders in
      // this origin.
      const known = reachable.flatMap(n => n.attachments || []).find(a => a.id === file) || (workspace?.uploads || []).find(u => u.id === file)
      if (!known) throw new ReviewError("File not found.", 404)
      const stored = await s.store.getFile(file)
      if (!stored) throw new ReviewError("File not found.", 404)
      const name = known.name.replace(/[^A-Za-z0-9._ -]/g, "") || "attachment"
      return new Response(Buffer.from(stored.bytes), { headers: { ...headers, "Content-Type": stored.contentType, "Content-Disposition": `attachment; filename="${name}"` } })
    }
    return json(batch ? { batch } : { workspace, version: process.env.REVIEW_SOURCE_VERSION || "unknown-build" })
  } catch (error) { return failure(error) }
}
export async function POST(request: NextRequest) {
  try {
    const data = await body(request), s = service()
    if (data.action === "request") {
      const old = request.cookies.get(COOKIE)?.value, id = validIdentity(old) ? old : newIdentity()
      // Only a header the declared front end writes (REVIEW_TRUSTED_PROXY, or Vercel's own); otherwise one local bucket.
      const ip = clientIp(request.headers)
      // Who is asking. The service mails a code only to an address on the
      // site's reviewer list, and answers every address alike; 254 is the RFC
      // address ceiling.
      const email = typeof data.email === "string" ? data.email.trim() : ""
      if (!email || email.length > 254) throw new ReviewError("Enter your email address.")
      await s.requestPin(id, ip, email)
      const response = json({ enterPin: true })
      response.cookies.set(COOKIE, id, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "strict", path: "/", maxAge: 365 * 86400 })
      return response
    }
    const id = identity(request)
    if (data.action === "verify") { await s.verify(id, typeof data.pin === "string" ? data.pin : ""); return json({ workspace: await s.workspace(id), version: process.env.REVIEW_SOURCE_VERSION || "unknown-build" }) }
    if (data.action === "logout") { await s.logout(id); return json({ ok: true }) }
    await s.authorize(id)
    if (data.action === "save") {
      let asset: string | undefined
      if (!data.id && typeof data.screenshot === "string" && data.screenshot) {
        if (!data.screenshot.startsWith("data:image/jpeg;base64,")) throw new ReviewError("Invalid snapshot format.")
        const raw = Buffer.from(data.screenshot.slice(23), "base64")
        if (raw.length > 2_000_000 || raw[0] !== 0xff || raw[1] !== 0xd8) throw new ReviewError("Invalid snapshot.")
        const normalized = await sharp(raw, { limitInputPixels: 16_000_000 }).resize({ width: 1600, height: 1800, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer()
        asset = randomUUID(); await s.store.image(asset, normalized)
      }
      return json({ workspace: await s.save(id, Number(data.revision), { id: typeof data.id === "string" ? data.id : undefined, comment: data.comment, anchor: data.anchor, asset, attachments: data.attachments, capture: typeof data.capture === "string" ? data.capture : "Snapshot unavailable" }) })
    }
    if (data.action === "attach") {
      // The file arrives as a data URL, so only the base64 payload after the
      // comma is decoded; what the URL claims the type is never read, because
      // the service decides that from the bytes.
      const value = typeof data.file === "string" ? data.file : ""
      const marker = value.indexOf(";base64,")
      if (!value.startsWith("data:") || marker < 0) throw new ReviewError("Invalid file format.")
      const bytes = new Uint8Array(Buffer.from(value.slice(marker + 8), "base64"))
      return json({ attachment: await s.attach(id, { name: data.name, bytes }) })
    }
    if (data.action === "remove") return json({ workspace: await s.remove(id, Number(data.revision), String(data.id)) })
    // Any authenticated reviewer of this site may revoke any batch of the site;
    // the service checks the session and answers 404 for an unknown id.
    if (data.action === "revoke") { await s.revoke(id, String(data.id)); return json({ ok: true }) }
    if (data.action === "send") { const batch = await s.send(id, Number(data.revision)); return json({ sent: { id: batch.id, count: batch.notes.length }, workspace: await s.workspace(id) }) }
    throw new ReviewError("Unknown review action.")
  } catch (error) { return failure(error) }
}
