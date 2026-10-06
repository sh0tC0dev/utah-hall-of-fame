import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { reviewEnabled } from "@/lib/review/enabled"
export const metadata: Metadata = { title: "Client Review", robots: { index: false, follow: false }, referrer: "no-referrer" }
// Gated on the same flag as the footer launcher, so the whole surface appears
// together: with the tool off this is the host's own not-found page, not a
// public URL carrying ShotCo copy inside the client's layout.
export default function ReviewPage() {
  if (!reviewEnabled()) notFound()
  return <main id="main" style={{ minHeight: "100vh", padding: "50px 24px", background: "#f3f5f8", color: "#092137" }}><Link href="/">← Back to Website</Link><h1 style={{ fontSize: "2rem", fontWeight: 800, marginTop: 24 }}>Client review</h1><p>Your private website review workspace.</p><noscript>Please enable JavaScript to access client review.</noscript></main>
}
