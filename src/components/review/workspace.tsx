"use client"
/* eslint-disable @next/next/no-img-element -- Private snapshots use authenticated object/data URLs, never the public image optimizer. */

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { Anchor, Attachment, Batch, Note, Workspace as WorkspaceData } from "@/lib/review/types"
import { FILES_PER_NOTE, FILE_MAX_BYTES, formatBytes, refusalLine } from "@/lib/review/files"
import { anchorFor, locate, snapshot } from "./capture"
import { fitImage, toDataUrl } from "./files"
import { persistable } from "./persist"
import { storage } from "./storage"
import styles from "./review.module.css"

const empty: WorkspaceData = { revision: 0, notes: [], batches: [] }
type Draft = { id?: string; comment: string; anchor: Anchor; screenshot?: string; capture: string; attachments?: Attachment[] }
type Result = { workspace?: WorkspaceData & { reviewer?: string }; version?: string; sent?: { id: string; count: number }; batch?: Batch; error?: string; configured?: boolean; attachment?: Attachment }
/**
 * Brings a slide-based section to the slide a note was collected on. The
 * capture records `data-slide` from the nearest `[data-slide]` ancestor, so the
 * generic answer is the tab that declares the same value; a host with its own
 * carousel API can listen for the event instead, or as well.
 */
function showSlide(slide: string) {
  if (!slide) return
  const tab = document.querySelector<HTMLElement>(`[role="tab"][data-slide="${CSS.escape(slide)}"]`)
  tab?.click()
  window.dispatchEvent(new CustomEvent("shotco-review-show-slide", { detail: { slide } }))
}
function Modal({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; ref.current?.showModal(); return () => { previous?.focus({ preventScroll: true }) } }, [])
  return <dialog ref={ref} className={styles.dialog} data-review-ui="true" aria-label={title} onCancel={e => { e.preventDefault(); close() }}><div className={styles.heading}><div><span className={styles.brand}>SHOTCO REVIEW</span><h2>{title}</h2></div><button type="button" aria-label="Close review panel" className={styles.iconButton} onClick={close}>×</button></div>{children}</dialog>
}
function Photo({ note, batchId, access }: { note: Note; batchId?: string; access?: string }) {
  const [src, setSrc] = useState("")
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!note.asset) return
    let url = "", stopped = false
    fetch(`/api/review?asset=${encodeURIComponent(note.asset)}${batchId ? `&batch=${batchId}` : ""}`, { headers: access ? { Authorization: `Bearer ${access}` } : {}, cache: "no-store" }).then(r => r.ok ? r.blob() : null).then(blob => { if (blob && !stopped) { url = URL.createObjectURL(blob); setSrc(url) } else if (!stopped) setFailed(true) }).catch(() => { if (!stopped) setFailed(true) })
    return () => { stopped = true; if (url) URL.revokeObjectURL(url) }
  }, [note.asset, batchId, access])
  // Private authenticated images use object URLs rather than a public image optimizer.
  return src ? <a href={src} target="_blank" rel="noreferrer" className={styles.photoLink}><img src={src} alt="Captured section when this change was collected" className={styles.photo} /><span>Open snapshot ↗</span></a> : <p className={styles.small}>{note.asset ? failed ? "Snapshot could not load. Reopen this panel to retry." : "Loading snapshot…" : note.capture}</p>
}
/**
 * One file a reviewer attached, fetched through the same authenticated,
 * object-URL route `Photo` uses, so there is one image-loading mechanism here
 * and not two. The anchor downloads the file under its stored name; an image
 * also shows a small preview of the very bytes the download would give.
 */
function FileLink({ file, batchId, access }: { file: Attachment; batchId?: string; access?: string }) {
  const [src, setSrc] = useState("")
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let url = "", stopped = false
    fetch(`/api/review?file=${encodeURIComponent(file.id)}${batchId ? `&batch=${batchId}` : ""}`, { headers: access ? { Authorization: `Bearer ${access}` } : {}, cache: "no-store" }).then(r => r.ok ? r.blob() : null).then(blob => { if (blob && !stopped) { url = URL.createObjectURL(blob); setSrc(url) } else if (!stopped) setFailed(true) }).catch(() => { if (!stopped) setFailed(true) })
    return () => { stopped = true; if (url) URL.revokeObjectURL(url) }
  }, [file.id, batchId, access])
  return <div className={styles.attachment}>
    {src && file.type.startsWith("image/") && <img src={src} alt={`Attached file: ${file.name}`} className={styles.thumb} />}
    <p className={styles.small}>{src ? <a href={src} download={file.name}>{file.name}</a> : file.name} · {formatBytes(file.size)}{src ? "" : failed ? " · could not load" : " · loading"}</p>
  </div>
}
export default function ReviewWorkspace({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const jump = useRef<Anchor | null>(null)
  const [auth, setAuth] = useState<"loading" | "request" | "pin" | "ready" | "report" | "unavailable">(() => typeof location !== "undefined" && location.pathname === "/review" && new URLSearchParams(location.hash.slice(1)).has("batch") ? "report" : "loading")
  const [data, setData] = useState<WorkspaceData>(empty)
  // Who this session belongs to, as the server reports it; the address the
  // browser last asked with is a per-browser convenience, not an identity.
  const [reviewer, setReviewer] = useState("")
  const [email, setEmail] = useState(() => storage.get("shotco-review-email") || "")
  const [panel, setPanel] = useState<"list" | "compose" | "history" | "sent" | null>(null)
  const [sentCount, setSentCount] = useState(0)
  const [selecting, setSelecting] = useState(false)
  const [showQuickStart, setShowQuickStart] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(() => { try { return JSON.parse(storage.get("shotco-review-unsaved") || "null") } catch { return null } })
  const [parkedDrafts, setParkedDrafts] = useState<Draft[]>(() => { try { return JSON.parse(storage.get("shotco-review-parked") || "[]") } catch { return [] } })
  const [capturing, setCapturing] = useState(false)
  const [uploading, setUploading] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  // Which sent reports this reviewer has revoked in this session, and which row
  // is awaiting the confirm click, so a misclick cannot break a client link.
  const [revoked, setRevoked] = useState<string[]>([])
  const [confirmRevoke, setConfirmRevoke] = useState("")
  const [pin, setPin] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [version, setVersion] = useState("local-review")
  const [report, setReport] = useState<Batch | null>(null)
  const [reportAccess] = useState(() => typeof location !== "undefined" ? new URLSearchParams(location.hash.slice(1)).get("key") || "" : "")
  const [highlight, setHighlight] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [pins, setPins] = useState<{ note: Note; index: number; x: number; y: number }[]>([])
  const captureRun = useRef(0)
  const initialized = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const call = useCallback(async (payload?: Record<string, unknown>) => {
    const response = await fetch("/api/review", { method: payload ? "POST" : "GET", credentials: "same-origin", cache: "no-store", headers: payload ? { "Content-Type": "application/json" } : undefined, body: payload ? JSON.stringify(payload) : undefined })
    const result: Result = await response.json()
    if (!response.ok) {
      // The server answers configured:false whenever the flag is on but the
      // deployment lacks a value the API needs: the surface is gated on the
      // flag alone, so this is where an incomplete deployment is told apart
      // from a reviewer who still needs a PIN.
      if (result.configured === false) { setAuth("unavailable"); throw new Error(result.error || "Client review is not set up on this site yet.") }
      if (response.status === 401) setAuth("pin")
      // A refused request (cooldown or cap) still offers the PIN box: a live
      // code may already be in the inbox.
      if (response.status === 429 && payload?.action === "request") { setAuth("pin"); setCooldown(60) }
      if (response.status === 409 || payload?.action === "send") { const fresh = await fetch("/api/review", { cache: "no-store" }); if (fresh.ok) { const r = await fresh.json(); setData(r.workspace) } }
      throw new Error(result.error || "Please retry. Your saved changes are safe.")
    }
    if (result.workspace) { setData(result.workspace); if (result.workspace.reviewer) setReviewer(result.workspace.reviewer) }
    if (result.version) setVersion(result.version)
    return result
  }, [])
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const fragment = new URLSearchParams(location.hash.slice(1)), batch = fragment.get("batch"), key = fragment.get("key")
    if (location.pathname === "/review" && batch && key) {
      fetch(`/api/review?batch=${encodeURIComponent(batch)}`, { cache: "no-store", headers: { Authorization: `Bearer ${key}` } }).then(async r => { const value = await r.json(); if (!r.ok) throw new Error(value.error); setReport(value.batch) }).catch(e => setError(e.message))
      return
    }
    fetch("/api/review", { cache: "no-store" }).then(async response => {
      const value: Result = await response.json()
      if (value.configured === false) { setAuth("unavailable"); return }
      if (!response.ok) throw new Error("Access required")
      setData(value.workspace ?? empty); if (value.workspace?.reviewer) setReviewer(value.workspace.reviewer); if (value.version) setVersion(value.version); setAuth("ready"); storage.set("shotco-review-active", "true")
    }).catch(() => setAuth("request"))

  }, [])
  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])
  // Both stored drafts go through persistable(): it drops the screenshot and
  // rewrites the capture line so a reopened draft never claims a snapshot the
  // stored copy does not carry. Unfinished text survives an accidental reload;
  // screenshots stay server-side after Save.
  useEffect(() => {
    storage.set("shotco-review-parked", JSON.stringify(parkedDrafts.map(persistable)))
  }, [parkedDrafts])
  useEffect(() => {
    if (draft) storage.set("shotco-review-unsaved", JSON.stringify(persistable(draft)))
    else storage.remove("shotco-review-unsaved")
  }, [draft])
  useEffect(() => {
    const active = selecting || panel === "compose"
    document.documentElement.dataset.reviewSelecting = String(active)
    window.dispatchEvent(new Event("shotco-review-selection"))
    return () => { delete document.documentElement.dataset.reviewSelecting; window.dispatchEvent(new Event("shotco-review-selection")) }
  }, [selecting, panel])
  useEffect(() => {
    if (!selecting) return
    const selectingClass = styles.selecting
    if (selectingClass === undefined) return
    document.documentElement.classList.add(selectingClass)
    const target = (event: Event) => {
      const element = event.target instanceof Element ? event.target : null
      if (!element || element.closest('[data-review-ui], dialog, [data-review-private]')) return null
      return element instanceof SVGElement ? element.closest("svg") : element
    }
    const move = (e: PointerEvent) => { const el = target(e); setHighlight(el ? el.getBoundingClientRect().toJSON() : null) }
    const click = (e: MouseEvent) => {
      const el = target(e); if (!el) return
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation()
      if (el.matches('input,textarea,select,[contenteditable="true"]')) { setError("Select the surrounding section instead of a form field."); return }
      setShowQuickStart(false)
      const anchor = anchorFor(el, e, version), run = ++captureRun.current
      setDraft({ comment: "", anchor, capture: "Capturing section snapshot…" }); setPanel("compose"); setSelecting(false); setCapturing(true); setError("")
      snapshot(el).then(image => { if (run === captureRun.current) setDraft(d => d ? { ...d, screenshot: image, capture: "Section snapshot; form fields and embedded media omitted" } : d) }).catch(() => { if (run === captureRun.current) setDraft(d => d ? { ...d, capture: "Snapshot unavailable; element and window details saved" } : d) }).finally(() => { if (run === captureRun.current) setCapturing(false) })
    }
    const clearHighlight = () => setHighlight(null)
    window.addEventListener("scroll", clearHighlight, true); window.addEventListener("resize", clearHighlight)
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setSelecting(false) }
    document.addEventListener("pointermove", move); document.addEventListener("click", click, true); document.addEventListener("keydown", key)
    return () => { document.documentElement.classList.remove(selectingClass); window.removeEventListener("scroll", clearHighlight, true); window.removeEventListener("resize", clearHighlight); document.removeEventListener("pointermove", move); document.removeEventListener("click", click, true); document.removeEventListener("keydown", key) }
  }, [selecting, version])
  useEffect(() => {
    if (auth !== "ready") return
    let frame = 0
    const refresh = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setPins(data.notes.flatMap((note, index) => {
      if (note.anchor.url.split("?")[0] !== location.pathname) return []
      const el = locate(note.anchor); if (!el) return []
      const r = el.getBoundingClientRect(); return [{ note, index, x: r.x + r.width * note.anchor.x, y: r.y + r.height * note.anchor.y }]
    }))) }
    refresh(); window.addEventListener("scroll", refresh, true); window.addEventListener("resize", refresh)
    const observer = new MutationObserver(refresh)
    const carousel = document.querySelector('[aria-roledescription="carousel"]')
    if (carousel) observer.observe(carousel, { attributes: true, attributeFilter: ["data-slide"] })
    const timer = setTimeout(refresh, 600)
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); observer.disconnect(); window.removeEventListener("scroll", refresh, true); window.removeEventListener("resize", refresh) }
  }, [data.notes, pathname, auth])
  useEffect(() => {
    if (!jump.current) return
    const anchor = jump.current
    const timer = setTimeout(() => {
      showSlide(anchor.slide)
      setTimeout(() => { const element = locate(anchor); if (element) element.scrollIntoView({ block: "center" }); else setNotice("This element has changed. Open its saved snapshot for context."); jump.current = null }, 350)
    }, 500)
    return () => clearTimeout(timer)
  }, [pathname])
  async function perform(task: () => Promise<void>) {
    if (busy) return
    setBusy(true); setError(""); try { await task() } catch (e) { setError(e instanceof Error ? e.message : "Please retry.") } finally { setBusy(false) }
  }
  /**
   * Send each chosen file to the server, which is what decides whether it is
   * acceptable. A photograph over the per-file ceiling is redrawn smaller
   * first; anything still over it, a PDF included, is refused here without a
   * request, because the request could not carry it. A refusal does not stop
   * the others: every refused file is collected and named once at the end,
   * and `perform` shows that one message in the dialog.
   */
  async function addFiles(chosen: File[]) {
    if (!chosen.length) return
    if ((draft?.attachments?.length ?? 0) + chosen.length > FILES_PER_NOTE) throw new Error(`A change carries up to ${FILES_PER_NOTE} files.`)
    // One refused file does not stop the others: every refusal is collected
    // and named once at the end, so nothing is skipped in silence.
    const skipped: Array<{ name: string; reason: string }> = []
    for (const file of chosen) {
      setUploading(`Uploading ${file.name}…`)
      try {
        const fitted = file.size > FILE_MAX_BYTES && file.type.startsWith("image/") ? await fitImage(file) : file
        if (fitted.size > FILE_MAX_BYTES) throw new Error(`larger than ${formatBytes(FILE_MAX_BYTES)}`)
        const result = await call({ action: "attach", name: file.name, file: await toDataUrl(fitted) })
        const added = result.attachment
        if (added) setDraft(d => d ? { ...d, attachments: [...(d.attachments || []), added] } : d)
      } catch (e) { skipped.push({ name: file.name, reason: e instanceof Error ? e.message : "not attached" }) } finally { setUploading("") }
    }
    if (skipped.length) throw new Error(refusalLine(skipped))
  }
  function visit(note: Note) {
    setPanel(null)
    if (location.pathname !== note.anchor.url.split("?")[0]) { jump.current = note.anchor; router.push(note.anchor.url); return }
    showSlide(note.anchor.slide)
    setTimeout(() => { const el = locate(note.anchor); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); else setNotice("This element has changed. Open its saved snapshot to see the original context.") }, 350)
  }
  function startComment(workspace: WorkspaceData = data) {
    setError("")
    setPanel(null)
    if (workspace.pending) {
      setSelecting(false)
      setNotice("Use Changes to finish sending your batch before adding another comment.")
      return
    }
    if (draft?.comment.trim()) setParkedDrafts(items => [...items, draft])
    setDraft(null)
    setSelecting(true)
    setNotice("")
  }
  const closePanel = () => { if (!busy && !capturing) { if (draft && !draft.comment.trim()) setDraft(null); setPanel(null) } }
  const messages = <>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}</>
  if (auth === "loading") return <div className={styles.toolbar} data-review-ui="true" role="status">Opening client review…</div>
  if (auth === "unavailable") return <Modal title="Client review" close={onClose}>
    <p className={styles.intro} role="status">Client review is not set up on this site yet. Nothing was recorded. If you expected to review this site, let ShotCo know.</p>
    <div className={styles.actions}><button type="button" className={styles.primary} onClick={onClose}>Back to Website</button></div>
  </Modal>
  if (auth === "request" || auth === "pin") return <Modal title={auth === "request" ? "Client review" : "Enter your PIN"} close={onClose}>
    <p className={styles.intro}>{auth === "request" ? "Request access to collect and send website changes." : email.trim() ? `If ${email.trim()} can review this site, a code is on its way. Nothing after a few minutes? Try again later, or ask ShotCo.` : "Enter your six-digit access PIN."}</p>
    {messages}
    {auth === "pin" && error && cooldown > 0 && <p className={styles.small}>Already have a code from an earlier request? Enter it below. Otherwise choose Request Access again once the timer ends.</p>}
    {auth === "request" ? <form onSubmit={e => { e.preventDefault(); perform(async () => { await call({ action: "request", email: email.trim() }); storage.set("shotco-review-email", email.trim()); setAuth("pin"); setCooldown(60) }) }}>
      <label className={styles.label} htmlFor="review-email">Your email</label><input id="review-email" className={styles.emailInput} value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" maxLength={254} required autoFocus />
      <div className={styles.actions}><button className={styles.primary} disabled={busy || !email.trim()}>{busy ? "Please wait…" : "Request Access"}</button></div>
    </form> : <form onSubmit={e => { e.preventDefault(); perform(async () => {
      const result = await call({ action: "verify", pin }).catch(async error => {
        // A right code whose save ran past the check's floor answers 401 but
        // still lands (0.5.2), so read the session once before showing the error.
        await new Promise(resolve => setTimeout(resolve, 1500))
        return call().catch(() => { throw error })
      })
      setAuth("ready"); setPin(""); storage.set("shotco-review-active", "true"); if (result.workspace?.pending) startComment(result.workspace); else { setPanel(null); setSelecting(false); setShowQuickStart(true) } }) }}>
      <label className={styles.label} htmlFor="review-pin">Access PIN</label><input id="review-pin" className={styles.pinInput} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus />
      <div className={styles.actions}><button className={styles.primary} disabled={busy || pin.length !== 6}>{busy ? "Checking…" : "Start Reviewing"}</button><button type="button" className={styles.secondary} disabled={busy || cooldown > 0} onClick={() => email.trim() ? perform(async () => { await call({ action: "request", email: email.trim() }); setCooldown(60) }) : setAuth("request")}>{cooldown ? `Request Access (${cooldown}s)` : "Request Access"}</button></div>
    </form>}
  </Modal>
  if (auth === "report") return <Modal title={report ? `${report.notes.length} submitted ${report.notes.length === 1 ? "change" : "changes"}` : "Review batch"} close={() => { router.push("/"); onClose() }}>
    {messages}{!report && !error && <p>Loading review…</p>}{report && <><p className={styles.small}>{report.siteName || "Website"} · {new Date(report.createdAt).toLocaleString()} · {report.id.slice(0, 8)}{report.reviewer ? ` · ${report.reviewer}` : ""}</p>{report.notes.map((n, i) => <article className={styles.card} key={n.id}><h3>Change {i + 1}</h3><p className={styles.comment}>{n.comment}</p><a href={n.anchor.url} target="_blank" rel="noreferrer">{n.anchor.url}</a><p className={styles.small}>{n.anchor.alt || n.anchor.text || n.anchor.tag} · {n.anchor.viewport.width} × {n.anchor.viewport.height}{n.anchor.slide ? ` · ${n.anchor.slide} slide` : ""}</p><Photo note={n} batchId={report.id} access={reportAccess} />{(n.attachments || []).map(file => <FileLink key={file.id} file={file} batchId={report.id} access={reportAccess} />)}<details><summary>Page details</summary><pre className={styles.details}>{JSON.stringify(n.anchor, null, 2)}</pre></details></article>)}</>}
  </Modal>
  return <div data-review-ui="true" className={styles.root}>
    {highlight && selecting && <div className={styles.highlight} style={{ left: highlight.x, top: highlight.y, width: highlight.width, height: highlight.height }} />}
    {!selecting && pins.map(p => <button key={p.note.id} className={styles.marker} style={{ left: p.x, top: p.y }} aria-label={`Edit change ${p.index + 1}`} onClick={() => { setDraft({ ...p.note }); setPanel("compose") }}>{p.index + 1}</button>)}
    <div className={styles.toolbar} aria-label="Website review controls"><span className={styles.brand}>SHOTCO REVIEW</span><button className={!selecting ? styles.selected : ""} aria-pressed={!selecting} onClick={() => setSelecting(false)}>Browse</button><button className={selecting ? styles.selected : ""} aria-pressed={selecting} disabled={busy || capturing} onClick={() => startComment()}>Add Comment</button><button onClick={() => { setSelecting(false); setPanel("list") }}>Changes <span className={styles.count}>{data.notes.length}</span></button><button className={styles.send} disabled={!data.notes.length || busy} onClick={() => { setSelecting(false); setPanel("list") }}>Send Changes</button><button aria-label="Exit review mode" onClick={onClose}>×</button></div>
    {showQuickStart && <Modal title="Ready to Review?" close={() => { setShowQuickStart(false); startComment() }}>
      <p className={styles.intro}>Click or tap an item, write your comment, then <strong>Save Change</strong>. Choose <strong>Send Changes</strong> when you’re finished. Use <strong>Browse</strong> to navigate.</p>
      <div className={styles.actions}><button className={styles.primary} onClick={() => { setShowQuickStart(false); startComment() }}>GO</button></div>
    </Modal>}
    {selecting && <div className={styles.hint} role="status">Click or tap something to comment. Press Esc to browse.</div>}
    {!panel && (error || notice) && <div className={styles.toast}>{messages}<button onClick={() => { setError(""); setNotice("") }} aria-label="Dismiss notice">×</button></div>}
    {panel === "compose" && draft && <Modal title={draft.id ? "Edit change" : "Add a change"} close={closePanel}>
      <p className={styles.small}>{draft.anchor.title} · {draft.anchor.alt || draft.anchor.tag}</p>
      <form onSubmit={e => { e.preventDefault(); perform(async () => { await call({ action: "save", revision: data.revision, ...draft }); setDraft(null); setPanel(null); setSelecting(true); setNotice("") }) }}>
        <label className={styles.label} htmlFor="review-comment">What would you like changed?</label><textarea id="review-comment" value={draft.comment} onChange={e => setDraft({ ...draft, comment: e.target.value })} maxLength={4000} rows={5} autoFocus required placeholder="Describe the change you would like…" />
        {capturing ? <p role="status">Capturing section snapshot…</p> : draft.screenshot ? <div className={styles.capturePreview}><img src={draft.screenshot} alt="Section snapshot for this change" /><p className={styles.small}>{draft.capture}</p></div> : draft.id && data.notes.some(n => n.id === draft.id) ? <Photo note={data.notes.find(n => n.id === draft.id)!} /> : <p className={styles.small}>{draft.capture}</p>}
        <div className={styles.attachRow}>
          <button type="button" className={styles.secondary} disabled={busy || capturing} onClick={() => fileInput.current?.click()}>Attach Files</button>
          <input ref={fileInput} id="review-files" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple hidden disabled={busy || capturing} onChange={e => { const chosen = Array.from(e.target.files ?? []); e.target.value = ""; perform(() => addFiles(chosen)) }} />
          <span className={styles.small}>JPEG, PNG, WebP or PDF, up to 3 MB each, 5 per change. A photo larger than that is shrunk before it is sent, which drops transparency from a PNG.</span>
        </div>
        {uploading && <p className={styles.small} role="status">{uploading}</p>}
        {(draft.attachments || []).map(file => <p className={styles.attached} key={file.id}><span>{file.name} · {formatBytes(file.size)}</span><button type="button" className={styles.textButton} disabled={busy} onClick={() => setDraft(d => d ? { ...d, attachments: (d.attachments || []).filter(x => x.id !== file.id) } : d)}>Remove</button></p>)}
        {messages}<div className={styles.actions}><button className={styles.primary} disabled={busy || capturing || !draft.comment.trim()}>{busy ? "Saving…" : "Save Change"}</button><button type="button" className={styles.secondary} disabled={busy || capturing} onClick={() => { setDraft(null); setPanel("list") }}>Discard</button></div>
      </form>
    </Modal>}
    {panel === "sent" && <Modal title="Changes Sent" close={closePanel}>
      <p className={styles.intro} role="status">Your {sentCount} {sentCount === 1 ? "change has" : "changes have"} been sent to our team.</p>
      <div className={styles.actions}><button className={styles.primary} onClick={closePanel}>Done</button><button className={styles.secondary} onClick={() => startComment()}>Continue Reviewing</button></div>
    </Modal>}
    {panel === "list" && <Modal title={`Changes collected: ${data.notes.length}`} close={closePanel}>
      <p className={styles.intro}>Collect changes across the site. Nothing is submitted until you send this batch.</p>{messages}
      {parkedDrafts.map((saved, index) => <button key={index} className={styles.secondary} onClick={() => { if (draft?.comment.trim()) setParkedDrafts(items => [...items.filter((_, i) => i !== index), draft]); else setParkedDrafts(items => items.filter((_, i) => i !== index)); setDraft(saved); setPanel("compose") }}>Continue Unfinished Comment: {saved.comment.slice(0, 50)}</button>)}
      {draft && <button className={styles.secondary} onClick={() => setPanel("compose")}>Continue Unfinished Comment</button>}
      {!data.notes.length && <div className={styles.empty}><h3>Your next changes start here.</h3><p>Choose Add Comment, then select an image, heading, or section.</p></div>}
      {data.notes.map((n, i) => <article className={styles.card} key={n.id}><div className={styles.cardTop}><strong><span className={styles.count}>{i + 1}</span> {n.anchor.title}</strong><button className={styles.textButton} onClick={() => visit(n)}>View on Page ↗</button></div><p className={styles.comment}>{n.comment}</p><p className={styles.small}>{n.anchor.url} · {n.anchor.viewport.width} × {n.anchor.viewport.height}{n.anchor.slide && ` · ${n.anchor.slide} slide`}{n.attachments?.length ? ` · ${n.attachments.length} attached file${n.attachments.length === 1 ? "" : "s"}` : ""}</p><details><summary>Snapshot & context</summary><Photo note={n} /><p className={styles.small}>{n.anchor.alt || n.anchor.text || n.anchor.tag}</p>{(n.attachments || []).map(file => <FileLink key={file.id} file={file} />)}</details><div className={styles.actions}><button className={styles.secondary} disabled={busy || !!data.pending} onClick={() => { setDraft({ ...n }); setPanel("compose") }}>Edit</button><button className={styles.textButton} disabled={busy || !!data.pending} onClick={() => perform(async () => { await call({ action: "remove", revision: data.revision, id: n.id }) })}>Remove</button></div></article>)}
      {data.pending && <p className={styles.notice}>This batch is saved for delivery. Retry to confirm its submission; it will not be sent twice.</p>}
      <div className={styles.stickyActions}><button className={styles.primary} disabled={busy || !data.notes.length || !!draft} onClick={() => perform(async () => { const result = await call({ action: "send", revision: data.revision }); setSentCount(result.sent?.count || 0); setNotice(""); setSelecting(false); setPanel("sent") })}>{busy ? "Sending…" : data.pending ? "Retry Sending Changes" : `Send ${data.notes.length || ""} Change${data.notes.length === 1 ? "" : "s"}`}</button><button className={styles.secondary} disabled={busy || capturing} onClick={() => startComment()}>Add Comment</button></div>
      <div className={styles.actions}><button className={styles.textButton} onClick={() => setPanel("history")}>Recent Sent Batches ({data.batches.length})</button><button className={styles.textButton} disabled={busy} onClick={() => perform(async () => { await call({ action: "logout" }); storage.remove("shotco-review-active"); onClose() })}>Lock Review</button>{reviewer && <span className={styles.small}>Reviewing as {reviewer}</span>}</div>
    </Modal>}
    {panel === "history" && <Modal title="Sent changes" close={closePanel}>{messages}{!data.batches.length && <p>No batches sent yet.</p>}{data.batches.map(b => { const isRevoked = b.revokedAt !== undefined || revoked.includes(b.id); return <details className={styles.card} key={b.id}><summary>{b.notes.length} {b.notes.length === 1 ? "change" : "changes"} · {new Date(b.sentAt || b.createdAt).toLocaleString()}{isRevoked ? " · Link revoked" : ""}</summary>{b.notes.map((n, i) => <article className={styles.card} key={n.id}><h3>Change {i + 1}</h3><p className={styles.comment}>{n.comment}</p><p className={styles.small}>{n.anchor.url}</p><Photo note={n} /></article>)}{isRevoked ? <p className={styles.small} role="status">This report link is revoked. The client sees a link that is no longer available.</p> : confirmRevoke === b.id ? <div className={styles.actions}><span className={styles.small}>Revoke this link? The client can no longer open this report.</span><button className={styles.textButton} disabled={busy} onClick={() => perform(async () => { await call({ action: "revoke", id: b.id }); setRevoked(r => [...r, b.id]); setConfirmRevoke("") })}>Revoke Link</button><button className={styles.textButton} disabled={busy} onClick={() => setConfirmRevoke("")}>Keep Link</button></div> : <div className={styles.actions}><button className={styles.textButton} disabled={busy} onClick={() => setConfirmRevoke(b.id)}>Revoke Link</button></div>}</details> })}<button className={styles.secondary} onClick={() => setPanel("list")}>Back to Collected Changes</button></Modal>}
  </div>
}
