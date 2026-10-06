import { get, put, list as blobList, del as blobDel, BlobPreconditionFailedError } from "@vercel/blob"
import type { ReviewStore } from "./types"

// Strong reads and compare-and-swap writes keep concurrent tabs/functions from
// losing comments or bypassing PIN attempt limits. No process-memory persistence.
export class BlobReviewStore implements ReviewStore {
  private prefix: string
  constructor() {
    const site = process.env.REVIEW_SITE_ID || ""
    const environment = process.env.REVIEW_STORAGE_NAMESPACE || ""
    if (!/^[a-z0-9-]+$/.test(site) || !/^[a-z0-9-]+$/.test(environment)) throw new Error("Invalid review namespace")
    this.prefix = `shotco-review/${site}/${environment}/`
  }
  private async load<T>(key: string) {
    // Compression produces a weak ETag, which cannot be used for atomic writes.
    const result = await get(this.prefix + key + ".json", { access: "private", useCache: false, headers: { "Accept-Encoding": "identity" } })
    if (!result || !result.stream) return null
    return { value: await new Response(result.stream).json() as T, etag: result.blob.etag }
  }
  async read<T>(key: string) { return (await this.load<T>(key))?.value ?? null }
  async change<T, R>(key: string, initial: () => T, update: (value: T) => R): Promise<R> {
    for (let attempt = 0; attempt < 8; attempt++) {
      const old = await this.load<T>(key)
      const value = old?.value ?? initial()
      const answer = update(value)
      try {
        await put(this.prefix + key + ".json", JSON.stringify(value), {
          access: "private", contentType: "application/json", addRandomSuffix: false,
          ...(old ? { ifMatch: old.etag } : { allowOverwrite: false }),
        })
        return answer
      } catch (error) {
        // A concurrent creator can win the first write. Reread before retrying.
        if (!(error instanceof BlobPreconditionFailedError) && !(error instanceof Error && /already exists/i.test(error.message))) throw error
        await new Promise(resolve => setTimeout(resolve, 40 * (attempt + 1)))
      }
    }
    throw new Error("Review storage is busy; retry")
  }
  async image(key: string, bytes: Uint8Array) {
    await put(this.prefix + `images/${key}.jpg`, Buffer.from(bytes), { access: "private", contentType: "image/jpeg", addRandomSuffix: false, allowOverwrite: false })
  }
  async getImage(key: string) {
    const result = await get(this.prefix + `images/${key}.jpg`, { access: "private", useCache: false, headers: { "Accept-Encoding": "identity" } })
    return result?.stream ? new Uint8Array(await new Response(result.stream).arrayBuffer()) : null
  }
  // Attached files keep their own content type; `allowOverwrite: false` is what
  // stops a repeated key from replacing a file a saved change already names.
  async putFile(key: string, bytes: Uint8Array, contentType: string) {
    await put(this.prefix + `files/${key}`, Buffer.from(bytes), { access: "private", contentType, addRandomSuffix: false, allowOverwrite: false })
  }
  async getFile(key: string) {
    const result = await get(this.prefix + `files/${key}`, { access: "private", useCache: false, headers: { "Accept-Encoding": "identity" } })
    if (!result?.stream) return null
    return { bytes: new Uint8Array(await new Response(result.stream).arrayBuffer()), contentType: result.blob.contentType || "application/octet-stream" }
  }
  // One bounded page of the objects under this store's prefix, for the retention
  // sweep. `prefix` keeps the listing inside this client's namespace and `limit`
  // caps this listing to a single page, so a store with thousands of objects
  // cannot make this call unbounded. `uploadedAt` is the object's last write,
  // returned as epoch ms; the sweep uses it only for orphaned images and files,
  // not for batches. `hasMore` is passed through because `limit` is a maximum: a
  // short page can still be incomplete, and the sweep needs to know.
  async list(limit: number) {
    const { blobs, hasMore } = await blobList({ prefix: this.prefix, limit })
    return { blobs: blobs.map(b => ({ pathname: b.pathname, uploadedAt: b.uploadedAt.getTime() })), hasMore }
  }
  // Deletes only pathnames the sweep obtained from `list`, and re-checks the
  // prefix so a stray pathname can never delete outside this client's namespace.
  async del(pathnames: string[]) {
    const scoped = pathnames.filter(p => p.startsWith(this.prefix))
    if (scoped.length) await blobDel(scoped)
  }
}
