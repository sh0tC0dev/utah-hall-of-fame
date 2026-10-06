import type { Anchor, Attachment } from "@/lib/review/types";

export type PersistableDraft = {
  id?: string;
  comment: string;
  anchor: Anchor;
  screenshot?: string;
  capture: string;
  attachments?: Attachment[];
};

/**
 * One unfinished comment, reduced to what browser storage may hold.
 *
 * Screenshots are data URLs of up to 2.5 MB (capture.ts caps them), so no
 * persisted draft keeps one. The capture line therefore has to stop
 * describing a snapshot the stored copy no longer carries. `workspace.tsx` had that rewrite in its unsaved-draft effect
 * and not in its parked-draft effect, so a comment parked by Add Comment and
 * reopened after a reload still read "Section snapshot; form fields and
 * embedded media omitted" with no image behind it, and saving it sent that
 * sentence to Atlas beside `"screenshot": null`. Both effects now persist
 * through here, which is the only place that decides what a stored draft says
 * about its snapshot.
 *
 * Attachments are the opposite case and are kept: they are metadata (id, name,
 * type, size) for files the server already holds, a few dozen bytes each, and
 * dropping them would make a reopened draft save a comment without the files
 * its reviewer had already attached. The ids are the server's, so a stored
 * draft carries nothing a browser could not ask for again.
 *
 * Pure and storage-free on purpose: the caller writes the result through
 * `./storage`, which owns the try/catch. `workspace.tsx` calls it from both
 * draft effects, and `tests/source.test.mjs` fails if either stops.
 */
export function persistable<T extends PersistableDraft>(draft: T): T {
  return {
    ...draft,
    screenshot: undefined,
    capture: draft.screenshot ? "Snapshot unavailable after page reload" : draft.capture,
  };
}
