# Utah Trapshooting Hall of Fame — Site Rebuild Design

**Date:** 2026-03-25
**Status:** Approved
**Domain:** utahtraphalloffame.com (DNS cutover deferred until client approval)
**Staging:** utah-hall-of-fame.vercel.app

---

## Overview

Expand the current single-page Utah Trapshooting Hall of Fame site into a full multi-page site. The existing heritage aesthetic ("Museum Wing at Golden Hour") is preserved — dark navy hero, parchment body, gold accents, serif fonts, CSS Modules. No component library. All inductee photos move from external utahtrap.com URLs to local files in `public/inductees/`.

## Architecture

### Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + CSS Modules (existing approach, unchanged)
- Resend for form email delivery
- No database — static data in `data.ts`
- No shadcn/ui — custom heritage design throughout
- Vercel deployment

### Routes

```
/                   Home — hero + featured inductee spotlight + quick links
/inductees          Full inductee grid with sort + search
/inductees/[slug]   Individual inductee page (photo + bio placeholder)
/eligibility        9 eligibility criteria + link to /nominate
/nominate           Online nomination form (mirrors PDF)
/trustees           5 trustees with contact info
/contact            Contact form + 501(c)(3) callout + donate CTA
```

### Shared Layout

- **Nav (sticky):** Home | Inductees | Eligibility | Nominate | Trustees | Contact | [Donate button]
  - Donate is a gold-accented button (not a plain link), links to `/contact?subject=donate`
- **Footer (every page):** Logo (existing `hof-logo.png` — do NOT use the ZIP logo), mailing address, USTA link, 501(c)(3) note, donate button

### Data Model

Expand `data.ts`:

```ts
interface Inductee {
  name: string;
  slug: string;          // URL-safe: "hortense-wood", "bill-and-leeann-martin"
  photo: string;         // local path: "/inductees/hortense-wood.jpg"
  year: number | null;   // induction year — null until Ed provides them
  category: 'shooting' | 'administrative' | 'both' | null;
  bio: string | null;    // null for now, populated in rev 2
  featured: boolean;     // true = show in home page spotlight
}
```

All 36 inductee photos copied from ZIP to `public/inductees/` with kebab-case filenames. The `martins.jpg` already in `public/` moves to `public/inductees/bill-and-leeann-martin.jpg`. Remote utahtrap.com URLs eliminated entirely.

---

## Page Designs

### Home (`/`)

**Hero** — Keep existing design unchanged. Dark navy background, logo left (existing `hof-logo.png`), title/subtitle right, gold rule separator, entrance animations.

**Featured Inductee Spotlight** — Replaces the current 3 "TBA" placeholder cards. Single larger spotlight card, centered, with bigger photo frame, name, and year ribbon. When no inductee has `featured: true`, shows "Class of 2026 — Coming Soon" with PersonIcon fallback. Multiple featured inductees display side by side in the same row.

**Quick Links** — Row of 3 cards below the spotlight:
- "View All Inductees" → `/inductees`
- "Nominate Someone" → `/nominate`
- "Support the Hall" → `/contact?subject=donate`

**Removed from home:** Full inductee grid (→ `/inductees`), About section (→ content distributed across Eligibility and Contact pages).

### Inductees (`/inductees`)

**Search** — Text input at top. Client-side string matching on name, filters grid live.

**Sort controls** — Toggle: Alphabetical (A-Z) | By Year (newest first). Inductees with `year: null` sort to the end in year view under a "Year Unknown" heading.

**Grid** — Same heritage frame cards (multi-layer wood-grain, brass nameplate). Responsive: 4 columns desktop, 3 tablet, 2 mobile.

**Click behavior** — Navigates to `/inductees/[slug]` (replaces current modal behavior).

### Individual Inductee (`/inductees/[slug]`)

**Layout:**
- Large framed portrait: left on desktop, top on mobile
- Name, induction year (if available), category badge (Shooting Merit / Administrative Merit / Both — if available)
- Bio section: displays bio text, or *"Biography coming soon."* in italic serif when null

**Navigation:**
- "Back to Hall of Fame" link at top → `/inductees`
- Previous / Next inductee links at bottom (array order)

### Eligibility (`/eligibility`)

Centered content column. The 9 criteria from the requirements document, each as a numbered item with bolded title and description text.

**Criteria:**
1. Potential Inductees — committee receives and reviews nominations
2. Shooting Merit — 6 major ATA championships required
3. Administrative Merit — exceptional voluntary work for Utah trapshooting
4. Basic Eligibility — ATA member 10+ years, Utah resident 10+ years
5. Limitations — max 2 per year, only 1 deceased per year
6. Nominee Resume — years as ATA member, Utah resident, other info
7. Selection — ballot/oral/motion, majority vote, 3-member quorum
8. Records — secretary records minutes and votes
9. Non-Participation — family members may not vote or be present

**CTA at bottom:** Gold button "Submit a Nomination →" → `/nominate`

### Nomination Form (`/nominate`)

Full online form mirroring the PDF. Sections:

**Nominee Information:**
- Name, Address, City, State, Zip
- Resident of Utah and ATA member for 10 years? (yes/no)
- Age of shooter, Date of Birth
- Year started competitive trapshooting with ATA
- Last year of competition

**Shooting Merit** — "List 6 major championships won per ATA rules":
- 6 repeating row groups: Event (text), Year (number), Location (text)

**Administrative Excellence:**
- Single textarea for listing contributions

**Additional Questions:**
- Is the nominee an Industry Representative? (yes/no)
- Does the nominee have memorabilia to contribute? (yes/no + description textarea)
- If deceased, date of death (date input)

**Nearest Relative:**
- Name, Relationship, Address, Phone, City, State, Zip

**Submitter:**
- Name, Date

**Submit behavior:** Sends formatted email to Ed Wehking via Resend. Displays success message after submission. No database storage.

**PDF download link** at top: "Prefer to mail it in? Download the PDF" → serves `public/HOF_nomination_form.pdf`

### Trustees (`/trustees`)

Brief intro paragraph explaining the role of the selection committee.

5 trustee cards, each with:
- Name
- Email
- Phone number
- No photos (none provided)

Heritage card styling consistent with site design.

**Trustees:**
| Name | Email | Phone |
|------|-------|-------|
| Ed Wehking | ed.wehking@comcast.net | 801-231-8046 |
| Joe Sudbury | dsudbury@gatekeepers.com | 801-597-3957 |
| Quint Sudbury | Quint@jqh20cut.com | 801-597-6210 |
| John Vosnos | john.vosnos@yahoo.com | 801-824-1318 |
| Pam Wright | pwright719@yahoo.com | 801-380-3181 |

### Contact (`/contact`)

**Contact form:** Name, Email, Subject (text input), Message textarea. Sends via Resend to Ed.

**Subject pre-fill:** When accessed via `/contact?subject=donate`, subject auto-fills to "I'd like to donate."

**501(c)(3) callout** — Styled card below the form:
> "The Utah Trapshooting Hall of Fame is a 501(c)(3) nonprofit corporation. Your contributions help preserve Utah's trapshooting heritage."
> [I'd Like to Donate] button → scrolls to form with subject pre-filled

**Mailing address:**
Utah Trapshooting Hall of Fame
PO Box 84
Springville UT 84663

---

## Email Configuration

- **Provider:** Resend
- **Recipient:** Ed Wehking (ed.wehking@comcast.net) for all form submissions
- **From address:** Resend's default `onboarding@resend.dev` until a custom domain is verified in Resend. Can switch to `noreply@utahtraphalloffame.com` after DNS cutover.
- **Env vars:** `RESEND_API_KEY`, `CONTACT_EMAIL` (Ed's address)

---

## Photo Migration

All inductee photos move from utahtrap.com URLs to `public/inductees/`:

| Inductee | Source File (from ZIP) | Target Path |
|----------|----------------------|-------------|
| Hortense Wood | Hortense Wood.jpg | /inductees/hortense-wood.jpg |
| Pat Miller | Pat Miller.jpg | /inductees/pat-miller.jpg |
| Sam Sharman | Sam Sharman.jpg | /inductees/sam-sharman.jpg |
| E.L. Ford | E.L. Ford.jpg | /inductees/el-ford.jpg |
| C.H. Reilly | C.H. Reilly.jpg | /inductees/ch-reilly.jpg |
| Gus Becker | Gus Becker.jpg | /inductees/gus-becker.jpg |
| Ron Sellers | Ron Sellers.jpg | /inductees/ron-sellers.jpg |
| Arvin Labrum | Arvin Labrum.jpg | /inductees/arvin-labrum.jpg |
| Ken Adamson | Ken Adamson.jpg | /inductees/ken-adamson.jpg |
| Ann Christie | Ann Christie.jpg | /inductees/ann-christie.jpg |
| O.J. Coon | O.J. Coon.jpg | /inductees/oj-coon.jpg |
| Josephine Leavitt | Josephine Leavitt.jpg | /inductees/josephine-leavitt.jpg |
| John M. Browning | John Browning.jpg | /inductees/john-browning.jpg |
| Tom Lynott | Tom Lynott.jpg | /inductees/tom-lynott.jpg |
| Walter Langhorst | Walt Langhorst.jpg | /inductees/walt-langhorst.jpg |
| Dean Hurd | Dean Hurd.jpg | /inductees/dean-hurd.jpg |
| Randy Freston | Randy Freston.jpg | /inductees/randy-freston.jpg |
| H. Barr Carlisle | H. Barr Carlisle.jpg | /inductees/h-barr-carlisle.jpg |
| Dale Amos | Dale Amos.jpg | /inductees/dale-amos.jpg |
| Ron Christensen | Ron Christensen.jpg | /inductees/ron-christensen.jpg |
| Doug Westenskow | Doug Westenskow.jpg | /inductees/doug-westenskow.jpg |
| Brent Epperson | Brent Epperson.jpg | /inductees/brent-epperson.jpg |
| Bill Hunter | William Hunter.jpg | /inductees/bill-hunter.jpg |
| Jim Duke | Jim Duke.jpg | /inductees/jim-duke.jpg |
| Larry Mitchell | Larry Mitchell.jpg | /inductees/larry-mitchell.jpg |
| Joe Sudbury Sr. | Joe Sudbury.jpeg | /inductees/joe-sudbury-sr.jpg |
| Linda Nicholl | Linda Nicholl.jpg | /inductees/linda-nicholl.jpg |
| Joe Mabey | Joe Mabey.jpg | /inductees/joe-mabey.jpg |
| Bill Salt | Bll Salt.jpg | /inductees/bill-salt.jpg |
| Bob Spencer | Bob Spencer.jpeg | /inductees/bob-spencer.jpg |
| Gene Majers | Gene Majers.jpg | /inductees/gene-majers.jpg |
| Stanley Jorgenson | Stanley Jorgenson.jpeg | /inductees/stanley-jorgenson.jpg |
| Bill & LeeAnn Martin | martins.jpg (already in public/) | /inductees/bill-and-leeann-martin.jpg |
| Ardith Stitt | Ardith Stitt.jpg | /inductees/ardith-stitt.jpg |
| Sharred Oaks | Sharred Oaks.jpg | /inductees/sharred-oaks.jpg |
| Leslie (Ford) Hight | Leslie Ford Hight.jpg | /inductees/leslie-ford-hight.jpg |

After migration, remove the `remotePatterns` config from `next.config.ts` (no more external image URLs).

---

## New Dependency

- `resend` — email delivery for nomination and contact forms

No other new dependencies.

---

## Out of Scope (Rev 2)

- Inductee bios (waiting on content from client)
- Induction year data (waiting on Ed)
- Category classifications (shooting/administrative/both)
- DNS cutover to utahtraphalloffame.com
- Supabase migration (if data volume ever warrants it)
