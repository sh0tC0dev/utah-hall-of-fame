# Utah Hall of Fame Site Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the single-page Utah Trapshooting Hall of Fame site into a multi-page site with inductee directory, nomination form, contact form, eligibility info, and trustee listing.

**Architecture:** Next.js 16 App Router with file-based routing. Static data in `data.ts` (no database). CSS Modules + Tailwind 4 for styling (existing approach). Resend for form email delivery. All inductee photos served locally from `public/inductees/`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS 4, CSS Modules, Resend, Vercel

**Spec:** `docs/superpowers/specs/2026-03-25-site-rebuild-design.md`

---

### Task 1: Migrate Photos to Local

Copy all 36 inductee photos from the ZIP extraction at `/tmp/utah-hof-content/Hall of Fame pics/` to `public/inductees/` with kebab-case filenames. Move the existing `public/martins.jpg` there too.

**Files:**
- Create: `public/inductees/` directory with 36 photos
- Remove: `public/martins.jpg` (moved into `public/inductees/`)

- [ ] **Step 1: Create the inductees directory and copy all photos with kebab-case names**

```bash
mkdir -p public/inductees

# Copy each photo from the ZIP extraction, renaming to kebab-case
cp "/tmp/utah-hof-content/Hall of Fame pics/Hortense Wood.jpg" public/inductees/hortense-wood.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Pat Miller.jpg" public/inductees/pat-miller.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Sam Sharman.jpg" public/inductees/sam-sharman.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/E.L. Ford.jpg" public/inductees/el-ford.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/C.H. Reilly.jpg" public/inductees/ch-reilly.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Gus Becker.jpg" public/inductees/gus-becker.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Ron Sellers.jpg" public/inductees/ron-sellers.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Arvin Labrum.jpg" public/inductees/arvin-labrum.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Ken Adamson.jpg" public/inductees/ken-adamson.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Ann Christie.jpg" public/inductees/ann-christie.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/O.J. Coon.jpg" public/inductees/oj-coon.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Josephine Leavitt.jpg" public/inductees/josephine-leavitt.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/John Browning.jpg" public/inductees/john-browning.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Tom Lynott.jpg" public/inductees/tom-lynott.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Walt Langhorst.jpg" public/inductees/walt-langhorst.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Dean Hurd.jpg" public/inductees/dean-hurd.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Randy Freston.jpg" public/inductees/randy-freston.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/H. Barr Carlisle.jpg" public/inductees/h-barr-carlisle.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Dale Amos.jpg" public/inductees/dale-amos.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Ron Christensen.jpg" public/inductees/ron-christensen.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Doug Westenskow.jpg" public/inductees/doug-westenskow.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Brent Epperson.jpg" public/inductees/brent-epperson.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/William Hunter.jpg" public/inductees/bill-hunter.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Jim Duke.jpg" public/inductees/jim-duke.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Larry Mitchell.jpg" public/inductees/larry-mitchell.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Joe Sudbury.jpeg" public/inductees/joe-sudbury-sr.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Linda Nicholl.jpg" public/inductees/linda-nicholl.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Joe Mabey.jpg" public/inductees/joe-mabey.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Bll Salt.jpg" public/inductees/bill-salt.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Bob Spencer.jpeg" public/inductees/bob-spencer.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Gene Majers.jpg" public/inductees/gene-majers.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Stanley Jorgenson.jpeg" public/inductees/stanley-jorgenson.jpg
cp public/martins.jpg public/inductees/bill-and-leeann-martin.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Ardith Stitt.jpg" public/inductees/ardith-stitt.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Sharred Oaks.jpg" public/inductees/sharred-oaks.jpg
cp "/tmp/utah-hof-content/Hall of Fame pics/Leslie Ford Hight.jpg" public/inductees/leslie-ford-hight.jpg
```

- [ ] **Step 2: Copy the nomination PDF to public**

```bash
cp "/tmp/utah-hof-content/HOF_nomination_form_digital_corrected.pdf" public/HOF_nomination_form.pdf
```

- [ ] **Step 3: Remove the old martins.jpg from public root**

```bash
rm public/martins.jpg
```

- [ ] **Step 4: Verify all 36 photos exist**

```bash
ls -la public/inductees/ | wc -l
# Expected: 37 (36 files + 1 header line)
```

- [ ] **Step 5: Commit**

```bash
git add public/inductees/ public/HOF_nomination_form.pdf
git rm public/martins.jpg
git commit -m "feat: migrate all inductee photos to local public/inductees/"
```

---

### Task 2: Expand Data Model

Update `data.ts` with the expanded `Inductee` interface (slug, year, category, bio, featured) and update all entries to use local photo paths.

**Files:**
- Modify: `src/app/data.ts`

- [ ] **Step 1: Rewrite data.ts with expanded interface and all 36 inductees**

Replace the entire contents of `src/app/data.ts` with:

```ts
export interface Inductee {
  name: string;
  slug: string;
  photo: string;
  year: number | null;
  category: "shooting" | "administrative" | "both" | null;
  bio: string | null;
  featured: boolean;
}

export const inductees: Inductee[] = [
  { name: "Hortense Wood", slug: "hortense-wood", photo: "/inductees/hortense-wood.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Pat Miller", slug: "pat-miller", photo: "/inductees/pat-miller.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Sam Sharman", slug: "sam-sharman", photo: "/inductees/sam-sharman.jpg", year: null, category: null, bio: null, featured: false },
  { name: "E.L. Ford", slug: "el-ford", photo: "/inductees/el-ford.jpg", year: null, category: null, bio: null, featured: false },
  { name: "C.H. Reilly", slug: "ch-reilly", photo: "/inductees/ch-reilly.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Gus Becker", slug: "gus-becker", photo: "/inductees/gus-becker.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ron Sellers", slug: "ron-sellers", photo: "/inductees/ron-sellers.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Arvin Labrum", slug: "arvin-labrum", photo: "/inductees/arvin-labrum.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ken Adamson", slug: "ken-adamson", photo: "/inductees/ken-adamson.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ann Christie", slug: "ann-christie", photo: "/inductees/ann-christie.jpg", year: null, category: null, bio: null, featured: false },
  { name: "O.J. Coon", slug: "oj-coon", photo: "/inductees/oj-coon.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Josephine Leavitt", slug: "josephine-leavitt", photo: "/inductees/josephine-leavitt.jpg", year: null, category: null, bio: null, featured: false },
  { name: "John M. Browning", slug: "john-browning", photo: "/inductees/john-browning.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Tom Lynott", slug: "tom-lynott", photo: "/inductees/tom-lynott.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Walter Langhorst", slug: "walt-langhorst", photo: "/inductees/walt-langhorst.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Dean Hurd", slug: "dean-hurd", photo: "/inductees/dean-hurd.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Randy Freston", slug: "randy-freston", photo: "/inductees/randy-freston.jpg", year: null, category: null, bio: null, featured: false },
  { name: "H. Barr Carlisle", slug: "h-barr-carlisle", photo: "/inductees/h-barr-carlisle.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Dale Amos", slug: "dale-amos", photo: "/inductees/dale-amos.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ron Christensen", slug: "ron-christensen", photo: "/inductees/ron-christensen.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Doug Westenskow", slug: "doug-westenskow", photo: "/inductees/doug-westenskow.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Brent Epperson", slug: "brent-epperson", photo: "/inductees/brent-epperson.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Bill Hunter", slug: "bill-hunter", photo: "/inductees/bill-hunter.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Jim Duke", slug: "jim-duke", photo: "/inductees/jim-duke.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Larry Mitchell", slug: "larry-mitchell", photo: "/inductees/larry-mitchell.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Joe Sudbury Sr.", slug: "joe-sudbury-sr", photo: "/inductees/joe-sudbury-sr.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Linda Nicholl", slug: "linda-nicholl", photo: "/inductees/linda-nicholl.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Joe Mabey", slug: "joe-mabey", photo: "/inductees/joe-mabey.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Bill Salt", slug: "bill-salt", photo: "/inductees/bill-salt.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Bob Spencer", slug: "bob-spencer", photo: "/inductees/bob-spencer.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Gene Majers", slug: "gene-majers", photo: "/inductees/gene-majers.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Stanley Jorgenson", slug: "stanley-jorgenson", photo: "/inductees/stanley-jorgenson.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Bill & LeeAnn Martin", slug: "bill-and-leeann-martin", photo: "/inductees/bill-and-leeann-martin.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ardith Stitt", slug: "ardith-stitt", photo: "/inductees/ardith-stitt.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Sharred Oaks", slug: "sharred-oaks", photo: "/inductees/sharred-oaks.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Leslie (Ford) Hight", slug: "leslie-ford-hight", photo: "/inductees/leslie-ford-hight.jpg", year: null, category: null, bio: null, featured: false },
];

/** Helper to find an inductee by slug */
export function getInducteeBySlug(slug: string): Inductee | undefined {
  return inductees.find((i) => i.slug === slug);
}

/** Helper to get featured inductees */
export function getFeaturedInductees(): Inductee[] {
  return inductees.filter((i) => i.featured);
}
```

- [ ] **Step 2: Update next.config.ts — remove remotePatterns since all photos are now local**

Replace `next.config.ts` contents with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 3: Verify the dev server starts without errors**

```bash
cd ~/Desktop/dev/utah-hall-of-fame && npm run dev -- -p 3050
# Check localhost:3050 loads without errors
```

- [ ] **Step 4: Commit**

```bash
git add src/app/data.ts next.config.ts
git commit -m "feat: expand inductee data model with slugs, year, category, bio fields"
```

---

### Task 3: Shared Layout — Nav, Footer, Root Layout

Convert the single-page layout into a multi-page layout. The Nav switches from hash-based scroll links to route-based links. Footer becomes a shared component. Root layout wraps all pages with Nav + Footer.

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/components/Nav.tsx`
- Modify: `src/app/components/Nav.module.css`
- Create: `src/app/components/Footer.tsx`
- Create: `src/app/components/Footer.module.css`
- Create: `src/app/components/SectionDivider.tsx`
- Create: `src/app/components/PageWrapper.tsx`

- [ ] **Step 1: Create the Footer component**

Create `src/app/components/Footer.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Image
        src="/hof-logo.png"
        alt=""
        width={80}
        height={80}
        className={styles.footerLogo}
      />
      <p className={styles.address}>
        Utah Trapshooting Hall of Fame
        <br />
        PO Box 84 &middot; Springville, UT 84663
      </p>
      <p className={styles.footerText}>
        A 501(c)(3) nonprofit corporation &middot;{" "}
        <a
          href="http://www.utahtrap.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          Utah State Trapshooting Association
        </a>
      </p>
      <Link href="/contact?subject=donate" className={styles.donateLink}>
        Support the Hall
      </Link>
    </footer>
  );
}
```

- [ ] **Step 2: Create Footer.module.css**

Create `src/app/components/Footer.module.css`. Copy the footer styles from `page.module.css` (lines 469-547) and add styles for the new address and donate link:

```css
.footer {
  background: linear-gradient(180deg, var(--color-navy) 0%, var(--color-navy-deep) 100%);
  padding: 3rem 2rem;
  text-align: center;
  position: relative;
}

.footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    transparent 5%,
    var(--color-burnt-orange) 20%,
    var(--color-sunset-gold) 40%,
    var(--color-warm-gold) 50%,
    var(--color-sunset-gold) 60%,
    var(--color-burnt-orange) 80%,
    transparent 95%
  );
  box-shadow: 0 -2px 12px rgba(201, 168, 76, 0.2);
}

.footer::after {
  content: "";
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, rgba(201, 168, 76, 0.04) 0%, transparent 100%);
  pointer-events: none;
}

.footerLogo {
  width: 80px;
  height: auto;
  display: block;
  margin: 0 auto 1.2rem;
  opacity: 0.6;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.address {
  font-family: var(--font-cormorant);
  font-size: 0.88rem;
  color: rgba(245, 235, 224, 0.55);
  letter-spacing: 0.1em;
  line-height: 1.7;
  margin-bottom: 0.8rem;
}

.footerText {
  font-family: var(--font-cormorant);
  font-size: 0.85rem;
  color: rgba(245, 235, 224, 0.4);
  letter-spacing: 0.1em;
  margin-bottom: 1.2rem;
}

.footerLink {
  color: var(--color-sandstone-light);
  text-decoration: none;
  transition: color 0.3s, text-shadow 0.3s;
}

.footerLink:hover {
  color: var(--color-parchment);
  text-shadow: 0 0 12px rgba(232, 201, 160, 0.2);
}

.donateLink {
  display: inline-block;
  font-family: var(--font-cormorant);
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-navy-deep);
  background: linear-gradient(180deg, var(--color-warm-gold), var(--color-deep-gold));
  padding: 0.6rem 1.8rem;
  text-decoration: none;
  transition: opacity 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(168, 135, 46, 0.3);
}

.donateLink:hover {
  opacity: 0.9;
  box-shadow: 0 4px 16px rgba(168, 135, 46, 0.4);
}
```

- [ ] **Step 3: Rewrite Nav.tsx for route-based navigation**

Replace `src/app/components/Nav.tsx` with:

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Nav.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/inductees", label: "Inductees" },
  { href: "/eligibility", label: "Eligibility" },
  { href: "/nominate", label: "Nominate" },
  { href: "/trustees", label: "Trustees" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.navLinks}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href))
                ? styles.active
                : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <Link href="/contact?subject=donate" className={styles.donateBtn}>
        Donate
      </Link>
    </nav>
  );
}
```

- [ ] **Step 4: Update Nav.module.css — add donate button styling**

Add the following to the end of `src/app/components/Nav.module.css`:

```css
.navLinks {
  display: flex;
  align-items: center;
  gap: 3rem;
}

.donateBtn {
  font-family: var(--font-cormorant);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-navy-deep);
  background: linear-gradient(180deg, var(--color-warm-gold), var(--color-deep-gold));
  padding: 0.45rem 1.2rem;
  text-decoration: none;
  transition: opacity 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 6px rgba(168, 135, 46, 0.3);
}

.donateBtn:hover {
  opacity: 0.9;
  box-shadow: 0 3px 12px rgba(168, 135, 46, 0.4);
}
```

And update the `.nav` rule to use `justify-content: space-between` and the responsive rules:

```css
.nav {
  background: linear-gradient(180deg, var(--color-navy) 0%, var(--color-navy-deep) 100%);
  padding: 1.1rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow:
    0 4px 20px rgba(17, 29, 53, 0.5),
    0 1px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}
```

Update responsive breakpoints:

```css
@media (max-width: 768px) {
  .nav {
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
  }
  .navLinks {
    gap: 1.2rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .navLink {
    font-size: 0.75rem;
    letter-spacing: 0.12em;
  }
  .donateBtn {
    font-size: 0.72rem;
  }
}
```

- [ ] **Step 5: Create SectionDivider as a reusable component**

Create `src/app/components/SectionDivider.tsx`:

```tsx
import { ScrollReveal } from "./ScrollReveal";
import styles from "./SectionDivider.module.css";

export function SectionDivider() {
  return (
    <ScrollReveal>
      <div className={styles.sectionDivider}>
        <span className={styles.lineLeft} />
        <span className={styles.ornament} />
        <span className={styles.lineRight} />
      </div>
    </ScrollReveal>
  );
}
```

Create `src/app/components/SectionDivider.module.css` — copy the `.sectionDivider`, `.lineLeft`, `.lineRight`, and `.ornament` styles from `page.module.css` (lines 162-241).

- [ ] **Step 6: Create PageWrapper component**

Create `src/app/components/PageWrapper.tsx` — a simple wrapper for consistent page padding on interior pages:

```tsx
import styles from "./PageWrapper.module.css";

export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`${styles.pageWrapper} ${className ?? ""}`}>
      {children}
    </main>
  );
}
```

Create `src/app/components/PageWrapper.module.css`:

```css
.pageWrapper {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem 4rem;
}

@media (max-width: 768px) {
  .pageWrapper {
    padding: 2rem 1.5rem 3rem;
  }
}
```

- [ ] **Step 7: Update root layout.tsx — add Nav and Footer to all pages**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import {
  Playfair_Display,
  Libre_Baskerville,
  Cormorant_Garamond,
  IM_Fell_English,
} from "next/font/google";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-baskerville",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const fell = IM_Fell_English({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-fell",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Utah Trapshooting Hall of Fame",
    template: "%s | Utah Trapshooting Hall of Fame",
  },
  description:
    "Dedicated to preserving the legacy of those who built, championed, and elevated the sport of trapshooting in the great state of Utah.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${baskerville.variable} ${cormorant.variable} ${fell.variable}`}
    >
      <body>
        <Nav />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/layout.tsx src/app/components/Nav.tsx src/app/components/Nav.module.css \
  src/app/components/Footer.tsx src/app/components/Footer.module.css \
  src/app/components/SectionDivider.tsx src/app/components/SectionDivider.module.css \
  src/app/components/PageWrapper.tsx src/app/components/PageWrapper.module.css
git commit -m "feat: shared layout with route-based Nav, Footer, and page wrapper"
```

---

### Task 4: Redesign Home Page

Strip the home page down to hero + featured inductee spotlight + quick links. Remove the full inductee grid and about section (they move to their own pages). Remove `force-dynamic`. Remove Nav/Footer rendering from page (now in layout).

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

- [ ] **Step 1: Rewrite page.tsx**

Replace `src/app/page.tsx` with:

```tsx
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "./components/ScrollReveal";
import { SectionDivider } from "./components/SectionDivider";
import { PersonIcon } from "./components/PersonIcon";
import { getFeaturedInductees } from "./data";
import styles from "./page.module.css";

function FeaturedSpotlight() {
  const featured = getFeaturedInductees();

  if (featured.length === 0) {
    return (
      <div className={styles.spotlightGrid}>
        <ScrollReveal>
          <div className={styles.spotlightCard}>
            <div className={styles.spotlightFrame}>
              <span className={styles.ribbon}>2026</span>
              <div className={styles.photoPlaceholder}>
                <PersonIcon size={55} opacity={0.2} />
              </div>
            </div>
            <p className={styles.spotlightName}>Coming Soon</p>
            <p className={styles.yearLabel}>Class of 2026</p>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className={styles.spotlightGrid}>
      {featured.map((person, i) => (
        <ScrollReveal key={person.slug} delay={i * 150}>
          <Link href={`/inductees/${person.slug}`} className={styles.spotlightCardLink}>
            <div className={styles.spotlightCard}>
              <div className={styles.spotlightFrame}>
                <span className={styles.ribbon}>{person.year ?? "2026"}</span>
                <div className={styles.spotlightPhotoWrap}>
                  <Image
                    src={person.photo}
                    alt={person.name}
                    fill
                    sizes="200px"
                    className={styles.spotlightPhoto}
                  />
                </div>
              </div>
              <p className={styles.spotlightName}>{person.name}</p>
              <p className={styles.yearLabel}>Inductee</p>
            </div>
          </Link>
        </ScrollReveal>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.logoFrame}>
            <Image
              src="/hof-logo.png"
              alt="Utah Trapshooting Hall of Fame"
              width={640}
              height={820}
              className={styles.heroLogo}
              priority
            />
          </div>
          <div className={styles.heroTextSide}>
            <p className={styles.heroPreTitle}>Utah State Trapshooting</p>
            <h1 className={styles.heroTitle}>Hall of Fame</h1>
            <div className={styles.heroRule} />
            <p className={styles.est}>Honoring Utah&apos;s Finest</p>
            <p className={styles.heroDescription}>
              Dedicated to preserving the legacy of those who built, championed,
              and elevated the sport of trapshooting in the great state of Utah.
              These men and women represent the very best of our tradition.
            </p>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* FEATURED INDUCTEE SPOTLIGHT */}
      <section className={styles.spotlight}>
        <ScrollReveal>
          <div className={styles.spotlightHeader}>
            <h2 className={styles.sectionTitle}>Class of 2026</h2>
            <p className={styles.subtitle}>This Year&apos;s Inductees</p>
          </div>
        </ScrollReveal>
        <FeaturedSpotlight />
      </section>

      <SectionDivider />

      {/* QUICK LINKS */}
      <section className={styles.quickLinks}>
        <ScrollReveal>
          <div className={styles.quickLinksGrid}>
            <Link href="/inductees" className={styles.quickLinkCard}>
              <h3 className={styles.quickLinkTitle}>View All Inductees</h3>
              <p className={styles.quickLinkDesc}>
                Explore the complete Hall of Fame
              </p>
            </Link>
            <Link href="/nominate" className={styles.quickLinkCard}>
              <h3 className={styles.quickLinkTitle}>Nominate Someone</h3>
              <p className={styles.quickLinkDesc}>
                Submit a nomination for consideration
              </p>
            </Link>
            <Link href="/contact?subject=donate" className={styles.quickLinkCard}>
              <h3 className={styles.quickLinkTitle}>Support the Hall</h3>
              <p className={styles.quickLinkDesc}>
                Help preserve Utah&apos;s trapshooting heritage
              </p>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Update page.module.css**

Keep the hero, spotlight, and divider styles. Remove the hall section, about section, and footer styles (footer is now a component). Add quick links styles and `spotlightCardLink` / `spotlightPhotoWrap` styles:

```css
/* Add after the spotlight styles */

.spotlightCardLink {
  text-decoration: none;
  color: inherit;
}

.spotlightPhotoWrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.spotlightPhoto {
  object-fit: cover;
  filter: sepia(0.15) contrast(1.05) brightness(0.95) saturate(0.85);
}

/* ═══════════════════ QUICK LINKS ═══════════════════ */
.quickLinks {
  padding: 0 2rem 4rem;
}

.quickLinksGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.quickLinkCard {
  display: block;
  text-decoration: none;
  text-align: center;
  padding: 2.5rem 2rem;
  background: rgba(250, 246, 239, 0.5);
  border: 1px solid rgba(212, 165, 116, 0.2);
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
  cursor: pointer;
}

.quickLinkCard:hover {
  border-color: var(--color-sandstone);
  box-shadow: 0 4px 20px rgba(42, 30, 20, 0.1);
  transform: translateY(-3px);
}

.quickLinkTitle {
  font-family: var(--font-playfair);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--color-navy);
  margin-bottom: 0.5rem;
}

.quickLinkDesc {
  font-family: var(--font-fell);
  font-size: 0.95rem;
  color: var(--color-text-mid);
  font-style: italic;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .quickLinksGrid {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
}
```

Remove from `page.module.css`: `.pageWrapper`, `.hallSection`, `.hallHeader`, `.aboutSection`, `.aboutTitle`, `.aboutText`, `.footer`, `.footerLogo`, `.footerText`, `.footerCredit`, `.footerLink` styles and the `.sectionDivider` / `.ornament` / `.lineLeft` / `.lineRight` styles (moved to SectionDivider component).

- [ ] **Step 3: Verify home page renders correctly**

```bash
# Check localhost:3050 — should show hero + spotlight + quick links, no inductee grid
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/page.module.css
git commit -m "feat: redesign home page — hero, featured spotlight, quick links"
```

---

### Task 5: Inductees Grid Page (`/inductees`)

New page with the full inductee grid, sort controls (alpha/year), and live search. Cards link to individual inductee pages instead of opening a modal.

**Files:**
- Create: `src/app/inductees/page.tsx`
- Create: `src/app/inductees/page.module.css`
- Modify: `src/app/components/InducteeGrid.tsx` — remove modal, add link behavior
- Modify: `src/app/components/InducteeGrid.module.css` — remove modal styles

- [ ] **Step 1: Create the inductees page**

Create `src/app/inductees/page.tsx`:

```tsx
import type { Metadata } from "next";
import { inductees } from "../data";
import { InducteeBrowser } from "./InducteeBrowser";

export const metadata: Metadata = {
  title: "Inductees",
  description: "All members of the Utah Trapshooting Hall of Fame.",
};

export default function InducteesPage() {
  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <section style={{ padding: "3rem 2rem 1rem", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontWeight: 800,
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
            color: "var(--color-navy)",
            letterSpacing: "0.05em",
            marginBottom: "0.3rem",
          }}
        >
          The Hall
        </h1>
        <p
          style={{
            fontFamily: "var(--font-cormorant)",
            fontWeight: 600,
            fontSize: "1.05rem",
            color: "var(--color-burnt-orange)",
            letterSpacing: "0.28em",
            textTransform: "uppercase" as const,
          }}
        >
          {inductees.length} Inductees
        </p>
      </section>
      <InducteeBrowser inductees={inductees} />
    </div>
  );
}
```

- [ ] **Step 2: Create the InducteeBrowser client component**

Create `src/app/inductees/InducteeBrowser.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Inductee } from "../data";
import { PersonIcon } from "../components/PersonIcon";
import styles from "./InducteeBrowser.module.css";

type SortMode = "alpha" | "year";

function InducteePhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={styles.noPhoto}>
        <PersonIcon />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="132px"
      className={styles.photoImg}
      onError={() => setFailed(true)}
    />
  );
}

export function InducteeBrowser({ inductees }: { inductees: Inductee[] }) {
  const [sort, setSort] = useState<SortMode>("alpha");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = inductees;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }

    if (sort === "alpha") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => {
        if (a.year === null && b.year === null) return 0;
        if (a.year === null) return 1;
        if (b.year === null) return -1;
        return b.year - a.year;
      });
    }

    return list;
  }, [inductees, sort, search]);

  return (
    <div className={styles.browser}>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
          aria-label="Search inductees"
        />
        <div className={styles.sortButtons}>
          <button
            className={`${styles.sortBtn} ${sort === "alpha" ? styles.sortActive : ""}`}
            onClick={() => setSort("alpha")}
          >
            A–Z
          </button>
          <button
            className={`${styles.sortBtn} ${sort === "year" ? styles.sortActive : ""}`}
            onClick={() => setSort("year")}
          >
            By Year
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.noResults}>No inductees match your search.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((person) => (
            <Link
              key={person.slug}
              href={`/inductees/${person.slug}`}
              className={styles.cardLink}
            >
              <div className={styles.card}>
                <div className={styles.frame}>
                  <div className={styles.frameOuter}>
                    <div className={styles.frameInner}>
                      <div className={styles.frameMat}>
                        <div className={styles.framePhoto}>
                          <InducteePhoto src={person.photo} alt={person.name} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.nameplate}>
                  <span className={styles.name}>{person.name}</span>
                </div>
                {person.year && (
                  <span className={styles.yearBadge}>{person.year}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create InducteeBrowser.module.css**

Create `src/app/inductees/InducteeBrowser.module.css`. Reuse the frame/nameplate styles from `InducteeGrid.module.css` (the `.frameOuter`, `.frameInner`, `.frameMat`, `.framePhoto`, `.photoImg`, `.noPhoto`, `.nameplate`, `.inducteeName` rules). Add new controls and search styles:

```css
.browser {
  padding: 0 2rem 4rem;
}

.controls {
  max-width: 1200px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.searchInput {
  font-family: var(--font-baskerville);
  font-size: 0.95rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-sandstone-light);
  background: var(--color-cream);
  color: var(--color-text-dark);
  width: 280px;
  transition: border-color 0.3s;
}

.searchInput::placeholder {
  color: var(--color-text-light);
}

.searchInput:focus {
  outline: none;
  border-color: var(--color-warm-gold);
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.2);
}

.sortButtons {
  display: flex;
  gap: 0;
}

.sortBtn {
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--color-sandstone-light);
  background: var(--color-cream);
  color: var(--color-text-mid);
  cursor: pointer;
  transition: background 0.3s, color 0.3s;
}

.sortBtn:first-child {
  border-right: none;
}

.sortBtn.sortActive {
  background: var(--color-navy);
  color: var(--color-warm-gold);
  border-color: var(--color-navy);
}

.noResults {
  text-align: center;
  font-family: var(--font-fell);
  font-style: italic;
  color: var(--color-text-mid);
  font-size: 1.05rem;
  padding: 3rem 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.cardLink {
  text-decoration: none;
  color: inherit;
}

.card {
  text-align: center;
}

.frame {
  position: relative;
  width: 160px;
  height: 200px;
  margin: 0 auto 1rem;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.frame:hover {
  transform: translateY(-5px);
}

/* Copy frame layer styles from InducteeGrid.module.css */
.frameOuter {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg,
    var(--color-sandstone-light) 0%,
    var(--color-sandstone) 20%,
    var(--color-sandstone-dark) 50%,
    var(--color-sandstone) 80%,
    var(--color-sandstone-light) 100%
  );
  border: 1px solid rgba(42, 30, 20, 0.15);
  box-shadow:
    0 4px 16px rgba(42, 30, 20, 0.18),
    0 2px 6px rgba(42, 30, 20, 0.12),
    0 8px 30px rgba(42, 30, 20, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.4s;
}

.frame:hover .frameOuter {
  box-shadow:
    0 8px 28px rgba(42, 30, 20, 0.25),
    0 3px 10px rgba(42, 30, 20, 0.18),
    0 16px 50px rgba(42, 30, 20, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.frameInner {
  position: absolute;
  inset: 7px;
  background: linear-gradient(135deg,
    var(--color-parchment-dark) 0%,
    var(--color-sandstone-light) 50%,
    var(--color-parchment-dark) 100%
  );
  box-shadow: inset 0 1px 3px rgba(42, 30, 20, 0.15);
}

.frameMat {
  position: absolute;
  inset: 4px;
  background: var(--color-cream);
  box-shadow:
    inset 0 0 8px rgba(42, 30, 20, 0.08),
    inset 0 2px 4px rgba(42, 30, 20, 0.04);
}

.framePhoto {
  position: absolute;
  inset: 10px;
  background: var(--color-parchment-dark);
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(42, 30, 20, 0.15);
}

.photoImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: sepia(0.2) contrast(1.05) brightness(0.95) saturate(0.82);
  transition: filter 0.4s, transform 0.4s;
}

.frame:hover .photoImg {
  filter: sepia(0.05) contrast(1.08) brightness(1) saturate(0.95);
  transform: scale(1.03);
}

.noPhoto {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 40% 40%, var(--color-parchment-light), var(--color-parchment-dark) 80%);
}

.nameplate {
  display: inline-block;
  background: linear-gradient(180deg,
    #e5cc82 0%, #dcc07a 15%, #c9a84c 50%, #b89438 85%, #a88530 100%
  );
  padding: 0.375rem 1rem 0.3125rem;
  border-radius: 1px;
  box-shadow:
    0 2px 5px rgba(42, 30, 20, 0.25),
    0 1px 2px rgba(42, 30, 20, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15),
    inset 1px 0 0 rgba(255, 255, 255, 0.15),
    inset -1px 0 0 rgba(0, 0, 0, 0.05);
}

.name {
  font-family: var(--font-cormorant);
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--color-warm-black);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1.3;
}

.yearBadge {
  display: block;
  margin-top: 0.4rem;
  font-family: var(--font-cormorant);
  font-size: 0.75rem;
  color: var(--color-burnt-orange);
  letter-spacing: 0.15em;
  font-weight: 600;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
    gap: 2rem 1.5rem;
  }
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  .searchInput {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem 1rem;
  }
  .frame {
    width: 140px;
    height: 175px;
  }
}
```

- [ ] **Step 4: Verify the inductees page loads at /inductees**

```bash
# Navigate to localhost:3050/inductees — should show search bar, sort toggle, and grid of 36 inductees
```

- [ ] **Step 5: Commit**

```bash
git add src/app/inductees/
git commit -m "feat: inductees page with search and sort controls"
```

---

### Task 6: Individual Inductee Page (`/inductees/[slug]`)

Dynamic route showing a single inductee with large photo, details, and prev/next navigation.

**Files:**
- Create: `src/app/inductees/[slug]/page.tsx`
- Create: `src/app/inductees/[slug]/page.module.css`

- [ ] **Step 1: Create the dynamic inductee page**

Create `src/app/inductees/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { inductees, getInducteeBySlug } from "../../data";
import { PersonIcon } from "../../components/PersonIcon";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return inductees.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = getInducteeBySlug(slug);
  if (!person) return { title: "Not Found" };
  return {
    title: person.name,
    description: `${person.name} — Utah Trapshooting Hall of Fame inductee.`,
  };
}

function InducteePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 90vw, 300px"
      className={styles.photoImg}
    />
  );
}

export default async function InducteePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = getInducteeBySlug(slug);
  if (!person) notFound();

  const index = inductees.findIndex((i) => i.slug === slug);
  const prev = index > 0 ? inductees[index - 1] : null;
  const next = index < inductees.length - 1 ? inductees[index + 1] : null;

  const categoryLabels: Record<string, string> = {
    shooting: "Shooting Merit",
    administrative: "Administrative Merit",
    both: "Shooting & Administrative Merit",
  };

  return (
    <div className={styles.page}>
      <Link href="/inductees" className={styles.backLink}>
        &larr; Back to Hall of Fame
      </Link>

      <div className={styles.content}>
        <div className={styles.portraitWrap}>
          <div className={styles.frame}>
            <div className={styles.frameOuter}>
              <div className={styles.frameInner}>
                <div className={styles.frameMat}>
                  <div className={styles.framePhoto}>
                    <InducteePhoto src={person.photo} alt={person.name} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.details}>
          <h1 className={styles.name}>{person.name}</h1>
          {person.year && (
            <p className={styles.year}>Inducted {person.year}</p>
          )}
          {person.category && (
            <span className={styles.categoryBadge}>
              {categoryLabels[person.category]}
            </span>
          )}
          <div className={styles.bio}>
            {person.bio ? (
              <p>{person.bio}</p>
            ) : (
              <p>
                <em>
                  Biography coming soon. The Utah Trapshooting Hall of Fame is
                  compiling detailed histories of each inductee to honor their
                  contributions to the sport.
                </em>
              </p>
            )}
          </div>
        </div>
      </div>

      <nav className={styles.prevNext}>
        {prev ? (
          <Link href={`/inductees/${prev.slug}`} className={styles.prevNextLink}>
            &larr; {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/inductees/${next.slug}`} className={styles.prevNextLink}>
            {next.name} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Create the page styles**

Create `src/app/inductees/[slug]/page.module.css`:

```css
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 2rem 4rem;
}

.backLink {
  display: inline-block;
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-burnt-orange);
  text-decoration: none;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 2rem;
  transition: color 0.3s;
}

.backLink:hover {
  color: var(--color-navy);
}

.content {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
}

.portraitWrap {
  flex-shrink: 0;
}

.frame {
  position: relative;
  width: 260px;
  height: 320px;
}

/* Reuse frame layer styles */
.frameOuter {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg,
    var(--color-sandstone-light) 0%,
    var(--color-sandstone) 20%,
    var(--color-sandstone-dark) 50%,
    var(--color-sandstone) 80%,
    var(--color-sandstone-light) 100%
  );
  border: 1px solid rgba(42, 30, 20, 0.15);
  box-shadow:
    0 8px 30px rgba(42, 30, 20, 0.2),
    0 3px 10px rgba(42, 30, 20, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.frameInner {
  position: absolute;
  inset: 10px;
  background: linear-gradient(135deg,
    var(--color-parchment-dark) 0%,
    var(--color-sandstone-light) 50%,
    var(--color-parchment-dark) 100%
  );
  box-shadow: inset 0 1px 3px rgba(42, 30, 20, 0.15);
}

.frameMat {
  position: absolute;
  inset: 5px;
  background: var(--color-cream);
  box-shadow:
    inset 0 0 8px rgba(42, 30, 20, 0.08),
    inset 0 2px 4px rgba(42, 30, 20, 0.04);
}

.framePhoto {
  position: absolute;
  inset: 12px;
  background: var(--color-parchment-dark);
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(42, 30, 20, 0.15);
}

.photoImg {
  object-fit: cover;
  filter: sepia(0.12) contrast(1.04) saturate(0.88);
}

.details {
  flex: 1;
  min-width: 0;
}

.name {
  font-family: var(--font-playfair);
  font-weight: 800;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  color: var(--color-navy);
  margin-bottom: 0.5rem;
}

.year {
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-burnt-orange);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 0.8rem;
}

.categoryBadge {
  display: inline-block;
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-cream);
  background: var(--color-navy);
  padding: 0.3rem 1rem;
  margin-bottom: 1.5rem;
}

.bio {
  font-family: var(--font-fell);
  font-size: 1.05rem;
  line-height: 2;
  color: var(--color-text-mid);
  border-top: 1px solid var(--color-sandstone-light);
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.prevNext {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(212, 165, 116, 0.2);
}

.prevNextLink {
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-burnt-orange);
  text-decoration: none;
  letter-spacing: 0.1em;
  transition: color 0.3s;
}

.prevNextLink:hover {
  color: var(--color-navy);
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
    align-items: center;
  }
  .frame {
    width: 220px;
    height: 270px;
  }
  .details {
    text-align: center;
  }
}
```

- [ ] **Step 3: Verify an inductee page renders**

```bash
# Navigate to localhost:3050/inductees/hortense-wood — should show portrait, name, bio placeholder, prev/next
```

- [ ] **Step 4: Commit**

```bash
git add src/app/inductees/\[slug\]/
git commit -m "feat: individual inductee pages with prev/next navigation"
```

---

### Task 7: Eligibility Page (`/eligibility`)

Static content page with the 9 eligibility criteria and a CTA to nominate.

**Files:**
- Create: `src/app/eligibility/page.tsx`
- Create: `src/app/eligibility/page.module.css`

- [ ] **Step 1: Create the eligibility page**

Create `src/app/eligibility/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "../components/ScrollReveal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Eligibility",
  description:
    "Eligibility criteria and selection requirements for the Utah Trapshooting Hall of Fame.",
};

const criteria = [
  {
    title: "Potential Inductees",
    text: "The Utah Trapshooting Hall of Fame Selection committee shall receive and review nominations for potential inductees. Sources should submit the achievements of their nominee in detail. A potential inductee may be selected based on shooting merit, administrative merit or a combination of both.",
  },
  {
    title: "Shooting Merit",
    text: "Inductee shall have received six (6) major ATA championships in either Singles, Handicap, Doubles, HOA, and HAA; at State, Division or National level (Grand or Satellite Grands).",
  },
  {
    title: "Administrative Merit",
    text: "Inductee shall have performed exceptional, outstanding, and unselfish work for Utah trapshooting over a period of many years. Such work must have been undertaken in a voluntary manner and could not have occurred simultaneously while engaged as a salaried person in the trapshooting field or during the course of earning profits in the trapshooting field.",
  },
  {
    title: "Basic Eligibility Criteria",
    text: "To be eligible for consideration the potential inductee shall have been a member of the ATA (Life or Annual) for not less than ten (10) years and have been a resident of the State of Utah for not less than ten (10) years.",
  },
  {
    title: "Limitations",
    text: "A maximum of two (2) persons may be inducted into the Utah Trapshooters Hall of Fame in each year. Inductees may be living or deceased, with only one deceased inductee per year.",
  },
  {
    title: "Nominee Resume",
    text: "The selection committee will be given as much information as possible for each candidate. The information should include years as an ATA member, years as a Utah State resident, and any other information to be considered for selection.",
  },
  {
    title: "Selection",
    text: "Each year, at the selection committee meeting, the selection committee members shall consider the merits of each nominee and selection will be by ballot, oral or by motion, with a majority in favor. Three (3) members will constitute a quorum and proxy votes are not allowed.",
  },
  {
    title: "Records",
    text: "The secretary shall record meeting minutes, including record of votes, at each selection committee meeting.",
  },
  {
    title: "Non-Participation",
    text: "A Utah Trapshooting Hall of Fame committee member may not vote when an immediate family member (including self) is being considered for induction and should not be present when the vote is taken.",
  },
];

export default function EligibilityPage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Eligibility &amp; Selection</h1>
        <p className={styles.subtitle}>Requirements for Induction</p>
      </ScrollReveal>

      <ol className={styles.criteriaList}>
        {criteria.map((item, i) => (
          <ScrollReveal key={i} delay={i * 50}>
            <li className={styles.criteriaItem}>
              <h3 className={styles.criteriaTitle}>
                {i + 1}. {item.title}
              </h3>
              <p className={styles.criteriaText}>{item.text}</p>
            </li>
          </ScrollReveal>
        ))}
      </ol>

      <ScrollReveal>
        <div className={styles.cta}>
          <Link href="/nominate" className={styles.ctaButton}>
            Submit a Nomination &rarr;
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
```

- [ ] **Step 2: Create the eligibility page styles**

Create `src/app/eligibility/page.module.css`:

```css
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 2rem 4rem;
}

.title {
  font-family: var(--font-playfair);
  font-weight: 800;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--color-navy);
  text-align: center;
  margin-bottom: 0.3rem;
}

.subtitle {
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-burnt-orange);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 3rem;
}

.criteriaList {
  list-style: none;
  padding: 0;
}

.criteriaItem {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(212, 165, 116, 0.15);
}

.criteriaItem:last-child {
  border-bottom: none;
}

.criteriaTitle {
  font-family: var(--font-playfair);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--color-navy);
  margin-bottom: 0.6rem;
}

.criteriaText {
  font-family: var(--font-fell);
  font-size: 1rem;
  line-height: 1.9;
  color: var(--color-text-mid);
}

.cta {
  text-align: center;
  padding-top: 2rem;
}

.ctaButton {
  display: inline-block;
  font-family: var(--font-cormorant);
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-navy-deep);
  background: linear-gradient(180deg, var(--color-warm-gold), var(--color-deep-gold));
  padding: 0.8rem 2.5rem;
  text-decoration: none;
  transition: opacity 0.3s, box-shadow 0.3s;
  box-shadow: 0 3px 12px rgba(168, 135, 46, 0.3);
}

.ctaButton:hover {
  opacity: 0.9;
  box-shadow: 0 5px 20px rgba(168, 135, 46, 0.4);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/eligibility/
git commit -m "feat: eligibility page with 9 criteria and nomination CTA"
```

---

### Task 8: Trustees Page (`/trustees`)

**Files:**
- Create: `src/app/trustees/page.tsx`
- Create: `src/app/trustees/page.module.css`

- [ ] **Step 1: Create the trustees page**

Create `src/app/trustees/page.tsx`:

```tsx
import type { Metadata } from "next";
import { ScrollReveal } from "../components/ScrollReveal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Trustees",
  description: "Utah Trapshooting Hall of Fame selection committee trustees.",
};

const trustees = [
  { name: "Ed Wehking", email: "ed.wehking@comcast.net", phone: "801-231-8046" },
  { name: "Joe Sudbury", email: "dsudbury@gatekeepers.com", phone: "801-597-3957" },
  { name: "Quint Sudbury", email: "Quint@jqh20cut.com", phone: "801-597-6210" },
  { name: "John Vosnos", email: "john.vosnos@yahoo.com", phone: "801-824-1318" },
  { name: "Pam Wright", email: "pwright719@yahoo.com", phone: "801-380-3181" },
];

export default function TrusteesPage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Board of Trustees</h1>
        <p className={styles.subtitle}>Selection Committee</p>
        <p className={styles.intro}>
          The Hall of Fame selection committee is responsible for reviewing
          nominations and selecting inductees each year. Committee members
          volunteer their time to preserve and honor Utah&apos;s trapshooting heritage.
        </p>
      </ScrollReveal>

      <div className={styles.grid}>
        {trustees.map((t, i) => (
          <ScrollReveal key={t.name} delay={i * 100}>
            <div className={styles.card}>
              <h3 className={styles.trusteeName}>{t.name}</h3>
              <a href={`mailto:${t.email}`} className={styles.contactLink}>
                {t.email}
              </a>
              <a href={`tel:${t.phone}`} className={styles.contactLink}>
                {t.phone}
              </a>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create trustees page styles**

Create `src/app/trustees/page.module.css`:

```css
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem 4rem;
}

.title {
  font-family: var(--font-playfair);
  font-weight: 800;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--color-navy);
  text-align: center;
  margin-bottom: 0.3rem;
}

.subtitle {
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-burnt-orange);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 1.5rem;
}

.intro {
  font-family: var(--font-fell);
  font-size: 1rem;
  line-height: 1.9;
  color: var(--color-text-mid);
  text-align: center;
  max-width: 600px;
  margin: 0 auto 3rem;
  font-style: italic;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.card {
  text-align: center;
  padding: 2rem 1.5rem;
  background: rgba(250, 246, 239, 0.5);
  border: 1px solid rgba(212, 165, 116, 0.2);
  transition: border-color 0.3s;
}

.card:hover {
  border-color: var(--color-sandstone);
}

.trusteeName {
  font-family: var(--font-playfair);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--color-navy);
  margin-bottom: 0.8rem;
}

.contactLink {
  display: block;
  font-family: var(--font-cormorant);
  font-size: 0.9rem;
  color: var(--color-burnt-orange);
  text-decoration: none;
  letter-spacing: 0.05em;
  margin-bottom: 0.3rem;
  transition: color 0.3s;
}

.contactLink:hover {
  color: var(--color-navy);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/trustees/
git commit -m "feat: trustees page with contact info cards"
```

---

### Task 9: Install Resend + API Routes

Install the `resend` package and create API routes for the nomination and contact forms.

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/app/api/nominate/route.ts`
- Create: `src/app/api/contact/route.ts`

- [ ] **Step 1: Install resend**

```bash
cd ~/Desktop/dev/utah-hall-of-fame && npm install resend
```

- [ ] **Step 2: Create the nomination API route**

Create `src/app/api/nominate/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "ed.wehking@comcast.net";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      nomineeName,
      nomineeAddress,
      nomineeCity,
      nomineeState,
      nomineeZip,
      residentTenYears,
      age,
      dateOfBirth,
      yearStarted,
      lastYearCompeted,
      championships,
      administrativeExcellence,
      isIndustryRep,
      hasMemorabilia,
      memorabiliaDescription,
      isDeceased,
      dateOfDeath,
      relativeName,
      relativeRelationship,
      relativeAddress,
      relativePhone,
      relativeCity,
      relativeState,
      relativeZip,
      submitterName,
      submitterDate,
    } = body;

    // Format championships table
    const champsRows = (championships ?? [])
      .filter((c: { event: string }) => c.event?.trim())
      .map(
        (c: { event: string; year: string; location: string }, i: number) =>
          `  ${i + 1}. ${c.event} (${c.year}) — ${c.location}`
      )
      .join("\n");

    const emailBody = `
UTAH TRAPSHOOTING HALL OF FAME
NOMINATION FORM SUBMISSION

══════════════════════════════════════
NOMINEE INFORMATION
══════════════════════════════════════
Name: ${nomineeName}
Address: ${nomineeAddress}, ${nomineeCity}, ${nomineeState} ${nomineeZip}
Resident of Utah & ATA member 10+ years: ${residentTenYears}
Age: ${age}
Date of Birth: ${dateOfBirth}
Year Started Competitive Trapshooting: ${yearStarted}
Last Year of Competition: ${lastYearCompeted}

══════════════════════════════════════
SHOOTING MERIT — Major Championships
══════════════════════════════════════
${champsRows || "  None listed"}

══════════════════════════════════════
ADMINISTRATIVE EXCELLENCE
══════════════════════════════════════
${administrativeExcellence || "None listed"}

══════════════════════════════════════
ADDITIONAL INFORMATION
══════════════════════════════════════
Industry Representative: ${isIndustryRep}
Has Memorabilia to Contribute: ${hasMemorabilia}
${memorabiliaDescription ? `Memorabilia Details: ${memorabiliaDescription}` : ""}
${isDeceased === "yes" ? `Deceased — Date of Death: ${dateOfDeath}` : "Not deceased"}

══════════════════════════════════════
NEAREST RELATIVE
══════════════════════════════════════
Name: ${relativeName ?? "N/A"}
Relationship: ${relativeRelationship ?? "N/A"}
Address: ${relativeAddress ?? "N/A"}, ${relativeCity ?? ""}, ${relativeState ?? ""} ${relativeZip ?? ""}
Phone: ${relativePhone ?? "N/A"}

══════════════════════════════════════
SUBMITTED BY
══════════════════════════════════════
Name: ${submitterName}
Date: ${submitterDate}
    `.trim();

    await resend.emails.send({
      from: "Utah HOF <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      subject: `HOF Nomination: ${nomineeName}`,
      text: emailBody,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Nomination email error:", error);
    return NextResponse.json(
      { error: "Failed to send nomination" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create the contact API route**

Create `src/app/api/contact/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "ed.wehking@comcast.net";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Utah HOF <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Contact: ${subject || "General Inquiry"}`,
      text: `From: ${name} (${email})\nSubject: ${subject || "General Inquiry"}\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ package.json package-lock.json
git commit -m "feat: Resend API routes for nomination and contact forms"
```

---

### Task 10: Nomination Form Page (`/nominate`)

Full form matching the PDF structure with client-side validation and submission.

**Files:**
- Create: `src/app/nominate/page.tsx`
- Create: `src/app/nominate/NominationForm.tsx`
- Create: `src/app/nominate/NominationForm.module.css`

- [ ] **Step 1: Create the nominate page**

Create `src/app/nominate/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "../components/ScrollReveal";
import { NominationForm } from "./NominationForm";
import styles from "./NominationForm.module.css";

export const metadata: Metadata = {
  title: "Nominate",
  description: "Submit a nomination for the Utah Trapshooting Hall of Fame.",
};

export default function NominatePage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Nomination Form</h1>
        <p className={styles.subtitle}>Utah Trapshooting Hall of Fame</p>
        <p className={styles.pdfLink}>
          Prefer to mail it in?{" "}
          <Link href="/HOF_nomination_form.pdf" target="_blank" className={styles.link}>
            Download the PDF
          </Link>
        </p>
      </ScrollReveal>
      <NominationForm />
    </div>
  );
}
```

- [ ] **Step 2: Create the NominationForm client component**

Create `src/app/nominate/NominationForm.tsx`. This is a large form — implement it as a single client component with sections matching the PDF:

```tsx
"use client";

import { useState } from "react";
import styles from "./NominationForm.module.css";

interface Championship {
  event: string;
  year: string;
  location: string;
}

export function NominationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [championships, setChampionships] = useState<Championship[]>(
    Array(6).fill(null).map(() => ({ event: "", year: "", location: "" }))
  );

  function updateChampionship(index: number, field: keyof Championship, value: string) {
    setChampionships((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      nomineeName: data.get("nomineeName"),
      nomineeAddress: data.get("nomineeAddress"),
      nomineeCity: data.get("nomineeCity"),
      nomineeState: data.get("nomineeState"),
      nomineeZip: data.get("nomineeZip"),
      residentTenYears: data.get("residentTenYears"),
      age: data.get("age"),
      dateOfBirth: data.get("dateOfBirth"),
      yearStarted: data.get("yearStarted"),
      lastYearCompeted: data.get("lastYearCompeted"),
      championships,
      administrativeExcellence: data.get("administrativeExcellence"),
      isIndustryRep: data.get("isIndustryRep"),
      hasMemorabilia: data.get("hasMemorabilia"),
      memorabiliaDescription: data.get("memorabiliaDescription"),
      isDeceased: data.get("isDeceased"),
      dateOfDeath: data.get("dateOfDeath"),
      relativeName: data.get("relativeName"),
      relativeRelationship: data.get("relativeRelationship"),
      relativeAddress: data.get("relativeAddress"),
      relativePhone: data.get("relativePhone"),
      relativeCity: data.get("relativeCity"),
      relativeState: data.get("relativeState"),
      relativeZip: data.get("relativeZip"),
      submitterName: data.get("submitterName"),
      submitterDate: new Date().toLocaleDateString(),
    };

    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to send");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or download the PDF and mail it in.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.successMessage}>
        <h2 className={styles.successTitle}>Nomination Submitted</h2>
        <p className={styles.successText}>
          Thank you for your nomination. The selection committee will review it
          at their next meeting.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* ── Nominee Information ── */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Nominee Information</legend>
        <div className={styles.field}>
          <label htmlFor="nomineeName" className={styles.label}>Name of Nominee</label>
          <input type="text" id="nomineeName" name="nomineeName" required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="nomineeAddress" className={styles.label}>Address</label>
          <input type="text" id="nomineeAddress" name="nomineeAddress" className={styles.input} />
        </div>
        <div className={styles.row3}>
          <div className={styles.field}>
            <label htmlFor="nomineeCity" className={styles.label}>City</label>
            <input type="text" id="nomineeCity" name="nomineeCity" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="nomineeState" className={styles.label}>State</label>
            <input type="text" id="nomineeState" name="nomineeState" defaultValue="UT" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="nomineeZip" className={styles.label}>Zip</label>
            <input type="text" id="nomineeZip" name="nomineeZip" className={styles.input} />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="residentTenYears" className={styles.label}>
            Resident of Utah and ATA member for 10+ years?
          </label>
          <select id="residentTenYears" name="residentTenYears" required className={styles.select}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="age" className={styles.label}>Age</label>
            <input type="text" id="age" name="age" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="dateOfBirth" className={styles.label}>Date of Birth</label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" className={styles.input} />
          </div>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="yearStarted" className={styles.label}>Year Started Competitive Trapshooting</label>
            <input type="text" id="yearStarted" name="yearStarted" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="lastYearCompeted" className={styles.label}>Last Year of Competition</label>
            <input type="text" id="lastYearCompeted" name="lastYearCompeted" className={styles.input} />
          </div>
        </div>
      </fieldset>

      {/* ── Shooting Merit ── */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Shooting Merit</legend>
        <p className={styles.fieldsetDesc}>List 6 major championships won per ATA rules</p>
        {championships.map((champ, i) => (
          <div key={i} className={styles.champRow}>
            <span className={styles.champNum}>{i + 1}.</span>
            <input
              type="text"
              placeholder="Event"
              value={champ.event}
              onChange={(e) => updateChampionship(i, "event", e.target.value)}
              className={styles.input}
              aria-label={`Championship ${i + 1} event`}
            />
            <input
              type="text"
              placeholder="Year"
              value={champ.year}
              onChange={(e) => updateChampionship(i, "year", e.target.value)}
              className={`${styles.input} ${styles.inputSmall}`}
              aria-label={`Championship ${i + 1} year`}
            />
            <input
              type="text"
              placeholder="Location"
              value={champ.location}
              onChange={(e) => updateChampionship(i, "location", e.target.value)}
              className={styles.input}
              aria-label={`Championship ${i + 1} location`}
            />
          </div>
        ))}
      </fieldset>

      {/* ── Administrative Excellence ── */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Administrative Excellence</legend>
        <div className={styles.field}>
          <label htmlFor="administrativeExcellence" className={styles.label}>
            Describe the nominee&apos;s contributions
          </label>
          <textarea
            id="administrativeExcellence"
            name="administrativeExcellence"
            rows={5}
            className={styles.textarea}
          />
        </div>
      </fieldset>

      {/* ── Additional Questions ── */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Additional Information</legend>
        <div className={styles.field}>
          <label htmlFor="isIndustryRep" className={styles.label}>
            Is the nominee an Industry Representative?
          </label>
          <select id="isIndustryRep" name="isIndustryRep" className={styles.select}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="hasMemorabilia" className={styles.label}>
            Does the nominee have memorabilia to contribute?
          </label>
          <select id="hasMemorabilia" name="hasMemorabilia" className={styles.select}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="memorabiliaDescription" className={styles.label}>
            If yes, describe the items
          </label>
          <textarea
            id="memorabiliaDescription"
            name="memorabiliaDescription"
            rows={3}
            className={styles.textarea}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="isDeceased" className={styles.label}>
            Is the nominee deceased?
          </label>
          <select id="isDeceased" name="isDeceased" className={styles.select}>
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="dateOfDeath" className={styles.label}>
            If deceased, date of death
          </label>
          <input type="date" id="dateOfDeath" name="dateOfDeath" className={styles.input} />
        </div>
      </fieldset>

      {/* ── Nearest Relative ── */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Nearest Relative</legend>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="relativeName" className={styles.label}>Name</label>
            <input type="text" id="relativeName" name="relativeName" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="relativeRelationship" className={styles.label}>Relationship</label>
            <input type="text" id="relativeRelationship" name="relativeRelationship" className={styles.input} />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="relativeAddress" className={styles.label}>Address</label>
          <input type="text" id="relativeAddress" name="relativeAddress" className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="relativePhone" className={styles.label}>Phone</label>
          <input type="tel" id="relativePhone" name="relativePhone" className={styles.input} />
        </div>
        <div className={styles.row3}>
          <div className={styles.field}>
            <label htmlFor="relativeCity" className={styles.label}>City</label>
            <input type="text" id="relativeCity" name="relativeCity" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="relativeState" className={styles.label}>State</label>
            <input type="text" id="relativeState" name="relativeState" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="relativeZip" className={styles.label}>Zip</label>
            <input type="text" id="relativeZip" name="relativeZip" className={styles.input} />
          </div>
        </div>
      </fieldset>

      {/* ── Submitter ── */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Submitted By</legend>
        <div className={styles.field}>
          <label htmlFor="submitterName" className={styles.label}>Your Name</label>
          <input type="text" id="submitterName" name="submitterName" required className={styles.input} />
        </div>
      </fieldset>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" disabled={submitting} className={styles.submitBtn}>
        {submitting ? "Submitting..." : "Submit Nomination"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create NominationForm.module.css**

Create `src/app/nominate/NominationForm.module.css` with form styling that matches the heritage aesthetic:

```css
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 2rem 4rem;
}

.title {
  font-family: var(--font-playfair);
  font-weight: 800;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--color-navy);
  text-align: center;
  margin-bottom: 0.3rem;
}

.subtitle {
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-burnt-orange);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 1rem;
}

.pdfLink {
  text-align: center;
  font-family: var(--font-fell);
  font-size: 0.9rem;
  color: var(--color-text-mid);
  margin-bottom: 2rem;
}

.link {
  color: var(--color-burnt-orange);
  text-decoration: underline;
  transition: color 0.3s;
}

.link:hover {
  color: var(--color-navy);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.fieldset {
  border: 1px solid rgba(212, 165, 116, 0.2);
  padding: 2rem;
  margin-bottom: 2rem;
  background: rgba(250, 246, 239, 0.3);
}

.legend {
  font-family: var(--font-playfair);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--color-navy);
  padding: 0 0.8rem;
}

.fieldsetDesc {
  font-family: var(--font-fell);
  font-size: 0.9rem;
  color: var(--color-text-mid);
  font-style: italic;
  margin-bottom: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.label {
  display: block;
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-dark);
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

.input,
.select,
.textarea {
  width: 100%;
  font-family: var(--font-baskerville);
  font-size: 0.95rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--color-sandstone-light);
  background: var(--color-cream);
  color: var(--color-text-dark);
  transition: border-color 0.3s;
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: var(--color-warm-gold);
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.2);
}

.inputSmall {
  max-width: 100px;
}

.textarea {
  resize: vertical;
  line-height: 1.7;
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.row3 {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

.champRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.champNum {
  font-family: var(--font-cormorant);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text-mid);
  width: 1.5rem;
  flex-shrink: 0;
}

.error {
  font-family: var(--font-baskerville);
  color: #b91c1c;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
}

.submitBtn {
  display: block;
  width: 100%;
  font-family: var(--font-cormorant);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-navy-deep);
  background: linear-gradient(180deg, var(--color-warm-gold), var(--color-deep-gold));
  padding: 0.9rem 2rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s, box-shadow 0.3s;
  box-shadow: 0 3px 12px rgba(168, 135, 46, 0.3);
}

.submitBtn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 5px 20px rgba(168, 135, 46, 0.4);
}

.submitBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.successMessage {
  text-align: center;
  padding: 4rem 2rem;
}

.successTitle {
  font-family: var(--font-playfair);
  font-weight: 700;
  font-size: 1.8rem;
  color: var(--color-navy);
  margin-bottom: 1rem;
}

.successText {
  font-family: var(--font-fell);
  font-size: 1.05rem;
  color: var(--color-text-mid);
  line-height: 1.8;
}

@media (max-width: 768px) {
  .row2,
  .row3 {
    grid-template-columns: 1fr;
  }
  .champRow {
    flex-wrap: wrap;
  }
  .inputSmall {
    max-width: none;
  }
  .fieldset {
    padding: 1.5rem 1rem;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/nominate/
git commit -m "feat: online nomination form with all PDF fields"
```

---

### Task 11: Contact Page (`/contact`)

Contact form with subject pre-fill from query param and 501(c)(3) callout.

**Files:**
- Create: `src/app/contact/page.tsx`
- Create: `src/app/contact/ContactForm.tsx`
- Create: `src/app/contact/page.module.css`

- [ ] **Step 1: Create the contact page**

Create `src/app/contact/page.tsx`:

```tsx
import type { Metadata } from "next";
import { ScrollReveal } from "../components/ScrollReveal";
import { ContactForm } from "./ContactForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the Utah Trapshooting Hall of Fame.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>Utah Trapshooting Hall of Fame</p>
      </ScrollReveal>

      <ContactForm />

      <ScrollReveal>
        <div className={styles.nonprofitCard}>
          <h3 className={styles.nonprofitTitle}>Support the Hall of Fame</h3>
          <p className={styles.nonprofitText}>
            The Utah Trapshooting Hall of Fame is a 501(c)(3) nonprofit
            corporation. Your contributions help preserve Utah&apos;s trapshooting
            heritage for future generations.
          </p>
          <button
            type="button"
            className={styles.donateBtn}
            onClick={() => {
              // This will be handled client-side — scroll to form and set subject
            }}
          >
            I&apos;d Like to Donate
          </button>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className={styles.address}>
          <p>Utah Trapshooting Hall of Fame</p>
          <p>PO Box 84</p>
          <p>Springville, UT 84663</p>
        </div>
      </ScrollReveal>
    </div>
  );
}
```

Wait — the donate button click needs client-side behavior but the page is a server component. Let's make ContactForm handle both the form and the donate button interaction.

- [ ] **Step 2: Create the ContactForm client component**

Create `src/app/contact/ContactForm.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export function ContactForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const s = searchParams.get("subject");
    if (s === "donate") {
      setSubject("I'd like to donate");
    }
  }, [searchParams]);

  function scrollToForm() {
    setSubject("I'd like to donate");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <div className={styles.successMessage}>
          <h2 className={styles.successTitle}>Message Sent</h2>
          <p className={styles.successText}>
            Thank you for reaching out. We&apos;ll get back to you soon.
          </p>
        </div>
        <DonateCard onDonateClick={scrollToForm} />
      </>
    );
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="contactName" className={styles.label}>Name</label>
          <input
            type="text"
            id="contactName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactEmail" className={styles.label}>Email</label>
          <input
            type="email"
            id="contactEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactSubject" className={styles.label}>Subject</label>
          <input
            type="text"
            id="contactSubject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactMessage" className={styles.label}>Message</label>
          <textarea
            id="contactMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className={styles.textarea}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
      <DonateCard onDonateClick={scrollToForm} />
    </>
  );
}

function DonateCard({ onDonateClick }: { onDonateClick: () => void }) {
  return (
    <div className={styles.nonprofitCard}>
      <h3 className={styles.nonprofitTitle}>Support the Hall of Fame</h3>
      <p className={styles.nonprofitText}>
        The Utah Trapshooting Hall of Fame is a 501(c)(3) nonprofit
        corporation. Your contributions help preserve Utah&apos;s trapshooting
        heritage for future generations.
      </p>
      <button type="button" className={styles.donateCta} onClick={onDonateClick}>
        I&apos;d Like to Donate
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Simplify the contact page (server component)**

Update `src/app/contact/page.tsx` — since ContactForm now handles the donate card:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { ScrollReveal } from "../components/ScrollReveal";
import { ContactForm } from "./ContactForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the Utah Trapshooting Hall of Fame.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>Utah Trapshooting Hall of Fame</p>
      </ScrollReveal>

      <Suspense>
        <ContactForm />
      </Suspense>

      <ScrollReveal>
        <div className={styles.address}>
          <p>Utah Trapshooting Hall of Fame</p>
          <p>PO Box 84</p>
          <p>Springville, UT 84663</p>
        </div>
      </ScrollReveal>
    </div>
  );
}
```

Note: `useSearchParams()` requires a `<Suspense>` boundary in Next.js 16.

- [ ] **Step 4: Create contact page styles**

Create `src/app/contact/page.module.css`:

```css
.page {
  max-width: 700px;
  margin: 0 auto;
  padding: 3rem 2rem 4rem;
}

.title {
  font-family: var(--font-playfair);
  font-weight: 800;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--color-navy);
  text-align: center;
  margin-bottom: 0.3rem;
}

.subtitle {
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-burnt-orange);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 2.5rem;
}

.form {
  margin-bottom: 3rem;
}

.field {
  margin-bottom: 1.2rem;
}

.label {
  display: block;
  font-family: var(--font-cormorant);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-dark);
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

.input,
.textarea {
  width: 100%;
  font-family: var(--font-baskerville);
  font-size: 0.95rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--color-sandstone-light);
  background: var(--color-cream);
  color: var(--color-text-dark);
  transition: border-color 0.3s;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: var(--color-warm-gold);
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.2);
}

.textarea {
  resize: vertical;
  line-height: 1.7;
}

.error {
  font-family: var(--font-baskerville);
  color: #b91c1c;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
}

.submitBtn {
  display: block;
  width: 100%;
  font-family: var(--font-cormorant);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-navy-deep);
  background: linear-gradient(180deg, var(--color-warm-gold), var(--color-deep-gold));
  padding: 0.9rem 2rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s, box-shadow 0.3s;
  box-shadow: 0 3px 12px rgba(168, 135, 46, 0.3);
}

.submitBtn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 5px 20px rgba(168, 135, 46, 0.4);
}

.submitBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nonprofitCard {
  text-align: center;
  padding: 2.5rem 2rem;
  background: rgba(250, 246, 239, 0.5);
  border: 1px solid rgba(212, 165, 116, 0.2);
  margin-bottom: 2rem;
}

.nonprofitTitle {
  font-family: var(--font-playfair);
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--color-navy);
  margin-bottom: 0.8rem;
}

.nonprofitText {
  font-family: var(--font-fell);
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text-mid);
  font-style: italic;
  margin-bottom: 1.2rem;
}

.donateCta {
  font-family: var(--font-cormorant);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-navy-deep);
  background: linear-gradient(180deg, var(--color-warm-gold), var(--color-deep-gold));
  padding: 0.6rem 1.8rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(168, 135, 46, 0.3);
}

.donateCta:hover {
  opacity: 0.9;
  box-shadow: 0 4px 16px rgba(168, 135, 46, 0.4);
}

.address {
  text-align: center;
  font-family: var(--font-cormorant);
  font-size: 0.9rem;
  color: var(--color-text-mid);
  letter-spacing: 0.1em;
  line-height: 1.8;
}

.successMessage {
  text-align: center;
  padding: 3rem 0;
}

.successTitle {
  font-family: var(--font-playfair);
  font-weight: 700;
  font-size: 1.6rem;
  color: var(--color-navy);
  margin-bottom: 0.8rem;
}

.successText {
  font-family: var(--font-fell);
  font-size: 1.05rem;
  color: var(--color-text-mid);
  line-height: 1.8;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/contact/
git commit -m "feat: contact page with form, 501(c)(3) callout, and donate CTA"
```

---

### Task 12: Cleanup and Final Touches

Remove unused files, clean up the old InducteeGrid component (no longer used on any page), and add env var documentation.

**Files:**
- Remove: `src/app/components/InducteeGrid.tsx`
- Remove: `src/app/components/InducteeGrid.module.css`
- Create: `.env.local.example`

- [ ] **Step 1: Remove the old InducteeGrid component**

```bash
cd ~/Desktop/dev/utah-hall-of-fame
git rm src/app/components/InducteeGrid.tsx src/app/components/InducteeGrid.module.css
```

- [ ] **Step 2: Clean up page.module.css — remove any leftover styles**

Remove from `src/app/page.module.css` the `.pageWrapper`, `.hallSection`, `.hallHeader`, `.aboutSection`, `.aboutTitle`, `.aboutText`, `.footer*` rules if they still exist after Task 4.

- [ ] **Step 3: Create .env.local.example**

Create `.env.local.example`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_EMAIL=ed.wehking@comcast.net
```

- [ ] **Step 4: Add .env*.local to .gitignore if not already there**

Check `.gitignore` and add if missing:

```
.env*.local
```

- [ ] **Step 5: Verify full build succeeds**

```bash
cd ~/Desktop/dev/utah-hall-of-fame && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: cleanup unused components, add env var example"
```

---

## Task Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Migrate photos to local | `public/inductees/` |
| 2 | Expand data model | `data.ts`, `next.config.ts` |
| 3 | Shared layout (Nav, Footer) | `layout.tsx`, `Nav.tsx`, `Footer.tsx` |
| 4 | Redesign home page | `page.tsx`, `page.module.css` |
| 5 | Inductees grid page | `/inductees/` |
| 6 | Individual inductee page | `/inductees/[slug]/` |
| 7 | Eligibility page | `/eligibility/` |
| 8 | Trustees page | `/trustees/` |
| 9 | Resend API routes | `/api/nominate/`, `/api/contact/` |
| 10 | Nomination form | `/nominate/` |
| 11 | Contact page | `/contact/` |
| 12 | Cleanup | Remove old files, env docs |
