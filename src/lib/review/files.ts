/**
 * What a reviewer may attach to a change, and how big.
 *
 * The attachment limits the service, the compose dialog and the tests share
 * are named here once and read from here. Two bounds live elsewhere on
 * purpose: the route's body ceiling is its own literal (4,300,000) sized
 * from FILE_MAX_BYTES, and the pixel bounds sit beside the code that resizes
 * (./inspect.ts on the server, src/components/review/files.ts in the
 * browser). tests/source.test.mjs compares the dialog's accept list and hint
 * against these values rather than retyping them and pins the route literal,
 * so a constant that moves reddens the suite instead of leaving the copy
 * lying.
 *
 * Nothing in this file imports sharp, and that is what lets the browser read
 * it. Deciding a file's kind does need sharp, so it lives next door in
 * ./inspect.ts: a client component importing a module with sharp behind it
 * puts a native Node package in the browser bundle, and the build stops on
 * detect-libc's `Can't resolve 'fs'`.
 */
export const ACCEPTED = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" } as const
export type FileKind = keyof typeof ACCEPTED

/**
 * Per file, as the server receives it. A Vercel function's request body stops
 * at 4.5 MB and a file travels as base64 inside JSON, which is four bytes for
 * every three, so 3 MB of file is 4 MB of request: this is the ceiling one
 * JSON request can carry.
 */
export const FILE_MAX_BYTES = 3_000_000
/** Files on one change. */
export const FILES_PER_NOTE = 5
/** Uploaded files a workspace may hold before any of them is saved onto a change. */
export const UPLOADS_PENDING_MAX = 20
/**
 * Every attachment in one batch, summed. Resend's ceiling is 40 MB per
 * message measured after base64, and every attachment travels base64 (four
 * bytes for three), so 20 MB of files is 26.7 MB on the wire and the batch's
 * section screenshots (1600 px JPEG at quality 75, up to 20) and changes.json
 * share the 13.3 MB left.
 */
export const BATCH_FILES_MAX_BYTES = 20_000_000
/** Characters in a stored file name, extension included. */
export const NAME_MAX = 80

/**
 * A file name safe to store, to put in an email and to hand back as a
 * download. Path segments are dropped, so a name carrying `../` cannot point
 * anywhere; only letters, digits, dot, underscore, space and hyphen survive;
 * and the extension is replaced by the one the detected kind gives, so a
 * `.exe` a reviewer picked is stored and mailed as the `.jpeg` it really is.
 * A name left with nothing in it becomes `attachment.<ext>`.
 */
export function safeName(input: unknown, ext: string): string {
  const last = (typeof input === "string" ? input : "").split(/[\\/]/).pop() || ""
  const cleaned = last.replace(/[^A-Za-z0-9._ -]/g, "").replace(/ +/g, " ").trim().replace(/^\.+/, "").trim()
  const dot = cleaned.lastIndexOf(".")
  const base = (dot > 0 ? cleaned.slice(0, dot) : cleaned).trim().slice(0, NAME_MAX - ext.length - 1).trim()
  return base ? `${base}.${ext}` : `attachment.${ext}`
}

/**
 * The one line the dialog shows when some of the picked files were not taken.
 *
 * Two kinds of reason arrive here and they are written differently. The
 * server's refusal is a whole sentence ending in a full stop ("Attach a JPEG,
 * PNG, WebP or PDF file."); the browser's own size refusal is a clause
 * ("larger than 3 MB"). Joining either straight onto the file name produced
 * "refused.gif Attach a JPEG, PNG, WebP or PDF file.." on the live 0.4.0
 * drive, two stops and a sentence starting mid-line. Each reason is put in
 * brackets after its name with a trailing full stop trimmed, so both shapes
 * read the same way and the line ends once.
 */
export function refusalLine(refused: Array<{ name: string; reason: string }>): string {
  const parts = refused.map(({ name, reason }) => `${name} (${reason.trim().replace(/\.+$/, "")})`)
  return `Not attached: ${parts.join("; ")}.`
}

/**
 * A byte count as a person writes it, for the email text and the dialog's file
 * list. Decimal units, so the numbers read as the limits above are written.
 */
export function formatBytes(n: number): string {
  if (n < 1000) return `${n} B`
  if (n < 1_000_000) return `${Math.round(n / 1000)} KB`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} MB`
}
