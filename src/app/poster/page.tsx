import type { Metadata } from "next";
import { inductees } from "../data";

export const metadata: Metadata = {
  title: "Poster",
  robots: { index: false, follow: false },
};

export default function PosterPage() {
  const sorted = [...inductees].sort((a, b) => {
    const ya = a.year ?? 0;
    const yb = b.year ?? 0;
    if (ya !== yb) return yb - ya;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <style>{`
        @page { size: 17in 21in; margin: 0; }
        body > nav, body > div:has(> footer), body > footer { display: none !important; }
        html, body { margin: 0 !important; padding: 0 !important; background: #111d35; }
        .poster-root {
          width: 17in;
          height: 21in;
          background: #111d35;
          color: #f5ebe0;
          font-family: 'EB Garamond', Georgia, serif;
          position: relative;
          overflow: hidden;
          padding: 0.45in 0.55in 0.4in;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .poster-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25in;
          text-align: left;
          padding-bottom: 0.15in;
          border-bottom: 1px solid rgba(201, 168, 76, 0.35);
        }
        .poster-logo {
          width: 1.1in;
          height: auto;
          flex-shrink: 0;
        }
        .poster-header-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .poster-eyebrow {
          font-size: 9pt;
          letter-spacing: 0.35em;
          color: #c9a84c;
          text-transform: uppercase;
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 500;
          margin-bottom: 0.04in;
        }
        .poster-title {
          font-size: 36pt;
          font-weight: 700;
          line-height: 1;
          color: #f5ebe0;
          font-family: 'Playfair Display', Georgia, serif;
          margin: 0;
        }
        .poster-title-accent {
          color: #c9a84c;
          font-style: italic;
        }
        .poster-sub {
          font-size: 9pt;
          letter-spacing: 0.2em;
          color: #e8dcc8;
          text-transform: uppercase;
          margin-top: 0.06in;
        }

        .featured-section {
          padding: 0.18in 0 0.15in;
          border-bottom: 1px solid rgba(201, 168, 76, 0.35);
        }
        .featured-heading {
          text-align: center;
          margin-bottom: 0.18in;
        }
        .featured-eyebrow {
          font-size: 10pt;
          letter-spacing: 0.4em;
          color: #c9a84c;
          text-transform: uppercase;
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 500;
        }
        .featured-title {
          font-size: 24pt;
          font-family: 'Playfair Display', Georgia, serif;
          color: #f5ebe0;
          margin: 0.03in 0 0;
          font-weight: 700;
        }
        .featured-title em {
          color: #c9a84c;
          font-style: italic;
        }
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.25in;
          padding: 0 0.3in;
        }
        .featured-card {
          background: #f5ebe0;
          border: 2.5px solid #c9a84c;
          padding: 0.1in;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          text-align: center;
          box-shadow: 0 0 0 1px #111d35 inset, 0 4px 16px rgba(0,0,0,0.3);
        }
        .featured-photo-wrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border: 1px solid #a8872e;
          background: #111d35;
        }
        .featured-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          display: block;
        }
        .featured-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 13pt;
          font-weight: 700;
          color: #1b2a4a;
          margin-top: 0.1in;
          line-height: 1.1;
        }
        .featured-year-label {
          font-size: 8.5pt;
          color: #a8872e;
          letter-spacing: 0.25em;
          margin-top: 0.04in;
          font-weight: 700;
          text-transform: uppercase;
        }

        .roster-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-top: 0.2in;
          min-height: 0;
        }
        .roster-heading {
          text-align: center;
          margin-bottom: 0.12in;
        }
        .roster-heading .featured-eyebrow { font-size: 9pt; }

        .poster-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          grid-template-rows: repeat(5, minmax(0, 1fr));
          gap: 0.1in;
          min-height: 0;
        }
        .poster-card {
          background: #f5ebe0;
          border: 2px solid #c9a84c;
          border-radius: 2px;
          padding: 0.08in;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          text-align: center;
          box-shadow: 0 0 0 1px #111d35 inset;
          min-height: 0;
          overflow: hidden;
        }
        .poster-photo-wrap {
          width: 100%;
          flex: 1 1 auto;
          min-height: 0;
          overflow: hidden;
          border: 1px solid #a8872e;
          background: #111d35;
        }
        .poster-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          display: block;
        }
        .poster-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 8.5pt;
          font-weight: 600;
          color: #1b2a4a;
          line-height: 1.1;
          margin-top: 0.05in;
          padding: 0 0.02in;
          word-break: break-word;
          hyphens: auto;
        }
        .poster-year {
          font-size: 7pt;
          color: #a8872e;
          letter-spacing: 0.15em;
          margin-top: 0.02in;
          font-weight: 600;
        }
        .poster-footer {
          text-align: center;
          font-size: 9pt;
          letter-spacing: 0.25em;
          color: #c9a84c;
          text-transform: uppercase;
          padding-top: 0.12in;
          margin-top: 0.1in;
          border-top: 1px solid rgba(201, 168, 76, 0.3);
        }
      `}</style>
      <div className="poster-root">
        <header className="poster-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hof-logo.png" alt="Utah Trapshooting Hall of Fame" className="poster-logo" />
          <div className="poster-header-text">
            <div className="poster-eyebrow">Est. 1979 &middot; Utah State Trapshooting Association</div>
            <h1 className="poster-title">
              The <span className="poster-title-accent">Hall of Fame</span>
            </h1>
            <div className="poster-sub">{inductees.length} Inductees &middot; 1986&ndash;2026</div>
          </div>
        </header>

        <section className="roster-section">
          <div className="roster-heading">
            <div className="featured-eyebrow">Full Roster</div>
          </div>
          <div className="poster-grid">
            {sorted.map((person) => (
              <div key={person.slug} className="poster-card">
                <div className="poster-photo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.photo} alt={person.name} className="poster-photo" />
                </div>
                <div className="poster-name">{person.name}</div>
                {person.year && <div className="poster-year">{person.year}</div>}
              </div>
            ))}
          </div>
        </section>

        <div className="poster-footer">utahtraphalloffame.com</div>
      </div>
    </>
  );
}
