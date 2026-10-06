/**
 * The build-time question: does this site show the review surface at all?
 *
 * Only the flag. The root layout, the footer launcher and /review read this,
 * and on a prebuilt deploy they read it where the HTML is generated, which is
 * the build machine. Credentials are not required there and must not be:
 * `vercel pull` writes Sensitive values as the literal "[SENSITIVE]", so a
 * gate that inspected them at build time would ship the surface off from any
 * tree that had been re-pulled while the API behind it stayed fully
 * configured; Stockdale's 0.1.0 host adaptation had such a gate. Whether the
 * tool can actually serve a request is `reviewConfigured()` in
 * ./configured.ts, answered on the server when the tool is used.
 */
export function reviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.REVIEW_ENABLED === "true"
}
