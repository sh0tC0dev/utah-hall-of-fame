import type { Anchor } from "@/lib/review/types"
const imageSource = (element: Element) => {
  const value = element instanceof HTMLImageElement ? element.getAttribute("src") || "" : element.tagName.toLowerCase() === "image" ? element.getAttribute("href") || "" : ""
  if (!value) return ""
  try { const url = new URL(value, location.href); return url.searchParams.get("url") || (url.origin === location.origin ? url.pathname + url.search : url.href) } catch { return value }
}
export function selectorFor(element: Element) {
  const parts: string[] = []
  for (let current: Element | null = element; current && current !== document.body; current = current.parentElement) {
    if (current.id) { parts.unshift("#" + CSS.escape(current.id)); break }
    const siblings = current.parentElement ? [...current.parentElement.children].filter(s => s.tagName === current!.tagName) : [current]
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(current) + 1})`)
  }
  return parts.join(" > ") || "body"
}
export function anchorFor(element: Element, event: MouseEvent, version: string): Anchor {
  const r = element.getBoundingClientRect(), x = event.detail ? event.clientX : r.x + r.width / 2, y = event.detail ? event.clientY : r.y + r.height / 2
  return { selector: selectorFor(element), tag: element.tagName.toLowerCase(), text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 400), image: imageSource(element), alt: element.getAttribute("alt") || element.getAttribute("aria-label") || "",
    x: Math.max(0, Math.min(1, (x - r.x) / (r.width || 1))), y: Math.max(0, Math.min(1, (y - r.y) / (r.height || 1))), pageX: x + scrollX, pageY: y + scrollY,
    rect: { x: r.x, y: r.y, width: r.width, height: r.height }, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scrollX, scrollY },
    slide: element.closest("[data-slide]")?.getAttribute("data-slide") || "", url: location.pathname + location.search, origin: location.origin, fragment: location.hash, renderedImage: element instanceof HTMLImageElement ? element.currentSrc : "", title: document.title, browser: navigator.userAgent, version }
}
export function locate(anchor: Anchor): Element | null {
  try {
    const el = document.querySelector(anchor.selector)
    if (!el || !el.checkVisibility() || el.tagName.toLowerCase() !== anchor.tag) return null
    if (anchor.slide && document.querySelector('[aria-roledescription="carousel"]')?.getAttribute("data-slide") !== anchor.slide) return null
    if (anchor.image && imageSource(el) !== anchor.image) return null
    if (!anchor.image && anchor.text && (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 400) !== anchor.text) return null
    return el
  } catch { return null }
}
export async function snapshot(element: Element) {
  const { toCanvas } = await import("html-to-image")
  let context = element.closest("article, figure, li[id], section, header, footer") || element
  if (context.getBoundingClientRect().height > 2200) context = element.parentElement || element
  if (context.getBoundingClientRect().height > 2200) context = element
  const r = context.getBoundingClientRect()
  if (!r.width || !r.height || r.height > 5000) throw new Error("Capture unavailable")
  let background = "#ffffff"
  for (let parent: Element | null = context; parent; parent = parent.parentElement) {
    const color = getComputedStyle(parent).backgroundColor
    if (color !== "transparent" && color !== "rgba(0, 0, 0, 0)") { background = color; break }
  }
  await document.fonts.ready
  // No preferredFontFormat option. In html-to-image 1.11.13 its format filter reuses a
  // global regex across @font-face rules and strips the src from every second
  // one, which drew sosclays.com's Bebas Neue headings in the default serif.
  const canvas = await toCanvas(context as HTMLElement, { pixelRatio: Math.min(1, 1400 / r.width, 1800 / r.height), quality: .9, includeQueryParams: true, backgroundColor: background,
    filter: node => !(node instanceof Element && (node.closest('[data-review-ui], [data-review-private]') || node.matches('input,textarea,select,[contenteditable="true"],iframe,video,source'))),
  })
  // Mark the selected element in the saved context, independent of page overlays.
  const selected = element.getBoundingClientRect(), draw = canvas.getContext("2d")
  if (draw) {
    const sx = canvas.width / r.width, sy = canvas.height / r.height
    draw.strokeStyle = "#087bff"; draw.lineWidth = 3
    draw.strokeRect((selected.x - r.x) * sx + 1, (selected.y - r.y) * sy + 1, Math.max(1, selected.width * sx - 2), Math.max(1, selected.height * sy - 2))
  }
  const screenshot = canvas.toDataURL("image/jpeg", .9)
  if (screenshot.length > 2_500_000) throw new Error("Capture too large")
  return screenshot
}
