import sharp from "sharp"
import { ACCEPTED, type FileKind } from "./files.ts"

/**
 * What these bytes actually are, decided by the bytes alone.
 *
 * The MIME type a browser declares is never read: a reviewer can rename
 * anything, and the file is served back to a browser later. A PDF is taken on
 * its `%PDF-` header and stored exactly as received, because re-encoding one
 * is not something this kit does; everything else goes through sharp, and only
 * JPEG, PNG and WebP survive the format check. Those three are re-encoded into
 * their own format after a resize to 4000 px on the long side, which is what
 * strips the file down to pixels: sharp drops EXIF, ICC and any other metadata
 * chunk unless `withMetadata()` asks it to keep them, so the camera, software
 * and GPS tags a phone photograph carries do not reach Atlas or the host's
 * Blob store. Anything else, and any sharp failure, is null, which the caller
 * turns into a refusal.
 */
export async function inspectFile(bytes: Uint8Array): Promise<{ kind: FileKind; type: string; ext: string; bytes: Uint8Array } | null> {
  if (bytes.length >= 5 && Buffer.from(bytes.subarray(0, 5)).toString("latin1") === "%PDF-") return { kind: "pdf", type: ACCEPTED.pdf, ext: "pdf", bytes }
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000 })
    const format = (await image.metadata()).format
    if (format !== "jpeg" && format !== "png" && format !== "webp") return null
    const fitted = image.resize({ width: 4000, height: 4000, fit: "inside", withoutEnlargement: true })
    const encoded = format === "jpeg" ? fitted.jpeg({ quality: 85 }) : format === "png" ? fitted.png() : fitted.webp({ quality: 85 })
    return { kind: format, type: ACCEPTED[format], ext: format, bytes: new Uint8Array(await encoded.toBuffer()) }
  } catch { return null }
}
