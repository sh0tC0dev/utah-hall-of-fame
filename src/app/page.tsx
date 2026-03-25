export const dynamic = "force-dynamic";

import Image from "next/image";
import { Nav } from "./components/Nav";
import { InducteeGrid } from "./components/InducteeGrid";
import { PersonIcon } from "./components/PersonIcon";
import { inductees } from "./data";
import styles from "./page.module.css";

function SectionDivider() {
  return (
    <div className={styles.sectionDivider}>
      <span className={styles.lineLeft} />
      <span className={styles.ornament} />
      <span className={styles.lineRight} />
    </div>
  );
}

function SpotlightCard() {
  return (
    <div className={styles.spotlightCard}>
      <div className={styles.spotlightFrame}>
        <span className={styles.ribbon}>2026</span>
        <div className={styles.photoPlaceholder}>
          <PersonIcon size={55} opacity={0.2} />
        </div>
      </div>
      <p className={styles.spotlightName}>To Be Announced</p>
      <p className={styles.yearLabel}>Inductee</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className={styles.pageWrapper}>
      <Nav />

      {/* HERO */}
      <section className={styles.hero} id="top">
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

      {/* CLASS OF 2026 */}
      <section className={styles.spotlight} id="class-2026">
        <div className={styles.spotlightHeader}>
          <h2 className={styles.sectionTitle}>Class of 2026</h2>
          <p className={styles.subtitle}>This Year&apos;s Inductees</p>
        </div>
        <div className={styles.spotlightGrid}>
          <SpotlightCard />
          <SpotlightCard />
          <SpotlightCard />
        </div>
      </section>

      <SectionDivider />

      {/* THE HALL */}
      <section className={styles.hallSection} id="inductees">
        <div className={styles.hallHeader}>
          <h2 className={styles.sectionTitle}>The Hall</h2>
          <p className={styles.subtitle}>In Order of Induction</p>
        </div>
        <InducteeGrid inductees={inductees} />
      </section>

      <SectionDivider />

      {/* ABOUT */}
      <section className={styles.aboutSection} id="about">
        <h2 className={styles.aboutTitle}>About the Hall of Fame</h2>
        <p className={styles.aboutText}>
          The Utah Trapshooting Hall of Fame was established to recognize and
          honor the individuals who have made extraordinary contributions to the
          sport of trapshooting in Utah &mdash; whether through exceptional
          competitive achievement, decades of dedicated service, or tireless
          promotion of the sport we love.
        </p>
        <p className={styles.aboutText}>
          Inductees are selected by the Utah State Trapshooting Association board
          based on their lasting impact on the Utah trapshooting community. From
          pioneers who built the foundation of our sport to champions who carried
          our flag at the highest levels of competition, each member of this Hall
          represents the best of what it means to be a Utah trapshooter.
        </p>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <Image
          src="/hof-logo.png"
          alt=""
          width={80}
          height={80}
          className={styles.footerLogo}
        />
        <p className={styles.footerText}>
          Utah Trapshooting Hall of Fame &middot;{" "}
          <a
            href="http://www.utahtrap.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Utah State Trapshooting Association
          </a>
        </p>
      </footer>
    </div>
  );
}
