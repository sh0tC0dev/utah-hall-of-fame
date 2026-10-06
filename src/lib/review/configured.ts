// Mirrors BlobReviewStore's own namespace test in ./store.ts.
const NAMESPACE = /^[a-z0-9-]+$/
/** The route's floor for REVIEW_SECRET, in characters. */
export const SECRET_MIN_LENGTH = 32

/** One `@`, no whitespace, no angle brackets: a bare address, not a header. */
const ADDRESS = /^[^\s@<>]+@[^\s@<>]+$/

/**
 * The site's reviewer list, read from `REVIEW_ACCESS_EMAILS`: comma separated,
 * trimmed, lowercased, deduped, in the order written. Entries that are not a
 * bare address are dropped rather than mailed. The service lowercases a request's
 * address before comparing it against this list, so the lowercasing here is what
 * lets the list itself be written in any case.
 */
export function parseReviewers(value: string | undefined): string[] {
  const out: string[] = []
  for (const entry of (value ?? "").split(",")) {
    const address = entry.trim().toLowerCase()
    if (ADDRESS.test(address) && !out.includes(address)) out.push(address)
  }
  return out
}

/**
 * `REVIEW_TRUSTED_PROXY`: the front end a host declares it runs behind, which
 * decides the two things the route reads from forwarded headers (the PIN
 * request's client address and whether an http Origin is accepted). Unset or
 * empty keeps the default: Vercel's own header on Vercel, one shared "local"
 * bucket elsewhere. `google-front-end` is Cloud Run on a direct domain mapping
 * with no load balancer. Any other value is a mistake, answered as null, which
 * reviewConfigured() turns into its "not set up" 503 instead of falling back
 * to the default; the value is exact, like `REVIEW_ENABLED`.
 */
export function trustedProxy(env: NodeJS.ProcessEnv = process.env): "google-front-end" | "" | null {
  const value = env.REVIEW_TRUSTED_PROXY ?? ""
  return value === "" || value === "google-front-end" ? value : null
}

/**
 * The caller's address for the PIN request's per-ip ceiling, read only from a
 * header the declared front end writes. Under `google-front-end` it is the
 * RIGHTMOST X-Forwarded-For entry, the one Google's front end appends; every
 * entry left of it is whatever the client sent, so an empty rightmost slot is
 * "unknown", never a step left. Behind an HTTPS load balancer the client is
 * second from the right instead, which is why the mode is declared, not
 * detected. On Vercel it is the first x-vercel-forwarded-for entry; anywhere
 * else every caller shares the "local" bucket.
 */
export function clientIp(headers: Headers, env: NodeJS.ProcessEnv = process.env): string {
  if (trustedProxy(env) === "google-front-end") return headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown"
  return env.VERCEL ? headers.get("x-vercel-forwarded-for")?.split(",")[0] || "unknown" : "local"
}

/**
 * Whether a JSON POST's Origin is this site: its host must match Host and its
 * scheme must be https, except that off Vercel an http Origin is accepted for
 * local development. Under `google-front-end` that exception needs `next dev`
 * (NODE_ENV development) as well, because Google's front end answers http with
 * a redirect, so an http Origin on the live host is never one of its pages.
 */
export function originAllowed(origin: string | null, host: string | null, env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    const url = new URL(origin || "")
    const http = !env.VERCEL && (trustedProxy(env) !== "google-front-end" || env.NODE_ENV === "development")
    return url.host === host && (url.protocol === "https:" || (http && url.protocol === "http:"))
  } catch { return false }
}

export type Configured =
  | { ok: true }
  | { ok: false; reason: "disabled" | "identity" | "storage" | "credentials" | "proxy" }

/**
 * The request-time question: can /api/review serve a request right now?
 *
 * The whole set the route needs, checked on the server where the deployment's
 * own environment answers: the flag, the identity trio (`REVIEW_SITE_NAME`,
 * `REVIEW_REPOSITORY`, a parseable `REVIEW_SITE_URL`), the two storage slugs
 * `store.ts` validates, then the credentials (`REVIEW_SECRET` at its length
 * floor, at least one usable address in `REVIEW_ACCESS_EMAILS`, `RESEND_API_KEY`,
 * `BLOB_READ_WRITE_TOKEN`), and last a `REVIEW_TRUSTED_PROXY` that is unset or
 * a mode trustedProxy() knows.
 *
 * The reason is coarse on purpose: the route turns it into a 503 whose message
 * says "not set up" rather than which value is missing, so nothing about the
 * configuration reaches a browser. The public surface is gated on the flag
 * alone (./enabled.ts); a site whose flag is on but whose configuration is
 * incomplete shows the launcher and answers every request through this check,
 * and the workspace tells the reviewer the tool is not set up on this site
 * instead of offering a PIN no mail could carry.
 */
export function reviewConfigured(env: NodeJS.ProcessEnv = process.env): Configured {
  if (env.REVIEW_ENABLED !== "true") return { ok: false, reason: "disabled" }
  if (!env.REVIEW_SITE_NAME || !env.REVIEW_REPOSITORY || !env.REVIEW_SITE_URL) return { ok: false, reason: "identity" }
  try { void new URL(env.REVIEW_SITE_URL) } catch { return { ok: false, reason: "identity" } }
  if (!NAMESPACE.test(env.REVIEW_SITE_ID ?? "") || !NAMESPACE.test(env.REVIEW_STORAGE_NAMESPACE ?? "")) return { ok: false, reason: "storage" }
  if (!env.REVIEW_SECRET || env.REVIEW_SECRET.length < SECRET_MIN_LENGTH) return { ok: false, reason: "credentials" }
  if (!parseReviewers(env.REVIEW_ACCESS_EMAILS).length || !env.RESEND_API_KEY || !env.BLOB_READ_WRITE_TOKEN) return { ok: false, reason: "credentials" }
  if (trustedProxy(env) === null) return { ok: false, reason: "proxy" }
  return { ok: true }
}
