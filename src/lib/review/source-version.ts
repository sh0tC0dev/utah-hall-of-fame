import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"

/** Runs git with the given arguments and returns its trimmed stdout. */
export type GitRunner = (args: string[]) => string
const git: GitRunner = args => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()

/**
 * The build revision stamped onto every collected change, so Atlas can compare
 * what the reviewer was looking at against what is in the repository.
 *
 * Build-time only: next.config.ts calls this once and exposes the result as
 * `process.env.REVIEW_SOURCE_VERSION`. It shells out to git, so it must never be
 * imported by a component or a request handler.
 *
 * `VERCEL_GIT_COMMIT_SHA` is absent on a prebuilt CLI deploy, which is how the
 * ShotCo sites ship, so the local checkout is the branch that runs there:
 * a clean tree stamps the short sha; a dirty tree stamps
 * `<sha>:source-<first 8 of sha256 of git status --porcelain>`, the same shape
 * the kit's Atlas test uses. The suffix hashes the LIST of dirty paths, not
 * their contents: it says "not exactly this commit" and is stable for the same
 * set of dirty paths. Anything that fails leaves "unknown-build" rather than
 * taking the build down.
 */
export function reviewSourceVersion(env: NodeJS.ProcessEnv = process.env, run: GitRunner = git): string {
  const configured = env.REVIEW_SOURCE_VERSION || env.VERCEL_GIT_COMMIT_SHA
  if (configured) return configured
  try {
    const sha = run(["rev-parse", "--short", "HEAD"])
    if (!sha) return "unknown-build"
    const uncommitted = run(["status", "--porcelain"])
    if (!uncommitted) return sha
    return `${sha}:source-${createHash("sha256").update(uncommitted).digest("hex").slice(0, 8)}`
  } catch {
    return "unknown-build"
  }
}
