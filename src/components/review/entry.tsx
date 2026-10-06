"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { storage } from "./storage"
const Workspace = dynamic(() => import("./workspace"), { ssr: false })
export function ReviewEntry({ enabled, page = false }: { enabled: boolean; page?: boolean }) {
  const [open, setOpen] = useState(page)
  useEffect(() => {
    // This mounts on every route for every visitor, so nothing here may throw.
    // Storage goes through ./storage, which swallows the SecurityError a
    // storage-denying browser raises from the localStorage getter itself;
    // before that guard the throw took the whole page to the root error screen.
    // When the tool is off nothing is read at all.
    if (!enabled) return
    const show = () => setOpen(true)
    window.addEventListener("shotco-review-open", show)
    if (storage.get("shotco-review-active") === "true" || location.pathname === "/review") show()
    return () => window.removeEventListener("shotco-review-open", show)
  }, [enabled])
  if (!enabled) return null
  return open ? <Workspace onClose={() => { storage.remove("shotco-review-active"); setOpen(false) }} /> : null
}
export function ReviewTrigger() {
  return <button type="button" data-review-ui="true" onClick={() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); window.dispatchEvent(new Event("shotco-review-open")) }} aria-label="Open client review" title="Client review" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, cursor: "pointer", color: "inherit", borderRadius: 8 }}><svg width="1.2em" height="1.2em" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M24 13.4a10.1 10.1 0 0 1-10.2 10.1c-1.6 0-3.1-.3-4.4-1L4 24l1.4-5.1a10.1 10.1 0 1 1 18.6-5.5Z"/><path d="M14 9v9M9.5 13.5h9"/></svg></button>
}
