/**
 * Browser-side preparation of a file a reviewer picked.
 *
 * Nothing here decides whether a file is acceptable: the server does that from
 * the bytes it receives (src/lib/review/files.ts). This only gets a photograph
 * from a modern phone, which is routinely eight to twelve megabytes, under the
 * per-request ceiling so it can be sent at all.
 */

/** The longest edge a shrunk image keeps, in CSS pixels. */
const FIT_MAX_EDGE = 2400

/**
 * Redraw an image at most FIT_MAX_EDGE on its longest side and hand back JPEG
 * bytes. JPEG has no alpha, so a large PNG loses its transparency here; the
 * compose dialog says so, and a PNG small enough to send is never redrawn.
 */
export async function fitImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, FIT_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("This browser could not prepare that image.")
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("This browser could not prepare that image.")), "image/jpeg", .85))
  } finally { bitmap.close() }
}

/** The blob as a `data:` URL, which is how the route takes an attached file. */
export function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("That file could not be read."))
    reader.readAsDataURL(blob)
  })
}
