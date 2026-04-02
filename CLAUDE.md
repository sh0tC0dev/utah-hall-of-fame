# Utah Hall of Fame — USTA Inductee Showcase

Static showcase site for the Utah State Trapshooting Association Hall of Fame.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + Resend (contact)
- Vercel
- No database — inductee data is static

## Dev
- Port: 3004
- `cd ~/Desktop/dev/utah-hall-of-fame && npm run dev`

## Deploy
- `cd ~/Desktop/dev/utah-hall-of-fame && vercel --prod --yes`
- Vercel Project ID: `prj_EtK1jGrApZpPJIRHMYO025lSF0O4`

## Design
- Heritage theme: dark navy, parchment, gold accents
- 35 inductees displayed
- Awaiting client feedback

## Architecture
- `src/app/` — inductee pages, layout
- `src/components/` — inductee cards, UI
