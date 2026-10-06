export type Anchor = {
  selector: string; tag: string; text: string; image: string; alt: string;
  x: number; y: number; pageX: number; pageY: number;
  rect: { x: number; y: number; width: number; height: number };
  viewport: { width: number; height: number; dpr: number; scrollX: number; scrollY: number };
  origin?: string; fragment?: string; renderedImage?: string;
  slide: string; url: string; title: string; browser: string; version: string;
}
// One file a reviewer attached. `id` is both the uuid the service minted and
// the storage key; `name`, `type` and `size` describe the bytes as stored, not
// as the browser declared them.
export type Attachment = { id: string; name: string; type: string; size: number }
// `attachments` is optional because notes stored by earlier versions have none.
export type Note = { id: string; comment: string; anchor: Anchor; createdAt: number; asset?: string; capture: string; attachments?: Attachment[] }
export type Batch = {
  // `reviewer` is optional because batches stored by 0.1.0 and 0.2.0 have none.
  // `expiresAt` (epoch ms) is stamped when the batch is sent, as send time plus
  // the retention window. Absent, the expiry falls back to `sentAt` (or
  // `createdAt` if the report was never sent) plus the window: expiry is
  // uniform, with no never-expires case, so a record 0.4.x stored needs no
  // migration. `revokedAt` (epoch ms) is the first time a reviewer revoked the
  // batch; absent means not revoked.
  siteName?: string; repository?: string; reviewer?: string; packageVersion?: 2; id: string; notes: Note[]; createdAt: number; sentAt?: number; expiresAt?: number; revokedAt?: number; providerId?: string; from: string; to: string; cc?: string; siteUrl: string }
// `uploads` is this browser's ledger of files it has attached but not yet saved
// onto a change: the only record that says an id is its own to use. It is
// optional for the same reason `attachments` is.
export type Workspace = { revision: number; notes: Note[]; batches: Batch[]; pending?: Batch; uploads?: (Attachment & { createdAt: number })[] }
export type ReviewData = { revision: number; notes: Note[]; batches: Batch[]; pending?: Batch }
export interface ReviewStore {
  read<T>(key: string): Promise<T | null>;
  change<T, R>(key: string, initial: () => T, update: (value: T) => R): Promise<R>;
  image(key: string, bytes: Uint8Array): Promise<void>;
  getImage(key: string): Promise<Uint8Array | null>;
  // Attached files, which unlike screenshots are not all JPEG, so the type
  // travels with the bytes in both directions.
  putFile(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  getFile(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null>;
  // The retention sweep reads one bounded page of the objects under this
  // store's prefix, each with its Blob `uploadedAt` as epoch ms, and deletes
  // the pathnames it decides are past retention. Both stay inside the prefix:
  // `list` filters on it and `del` only removes pathnames `list` returned.
  // `limit` is a MAXIMUM, so a short page can still be incomplete; `hasMore`
  // reports whether a further page exists, and the sweep gates its orphan pass
  // on it rather than inferring completeness from a short page alone.
  list(limit: number): Promise<{ blobs: { pathname: string; uploadedAt: number }[]; hasMore: boolean }>;
  del(pathnames: string[]): Promise<void>;
}
// This type is the Resend request body itself, so `reply_to` keeps Resend's
// own field name rather than a camel-cased one.
export type Mail = { from: string; to: string[]; cc?: string[]; bcc?: string[]; reply_to?: string; subject: string; text: string; attachments?: { filename: string; content: string }[] }
export type Mailer = (mail: Mail, idempotencyKey: string) => Promise<string>
