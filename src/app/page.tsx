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
      <ScrollReveal>
        <div className={styles.featuredWrap}>
          <div className={styles.featuredFrame}>
            <span className={styles.ribbon}>2026</span>
            <div className={styles.photoPlaceholder}>
              <PersonIcon size={80} opacity={0.2} />
            </div>
          </div>
          <div className={styles.featuredDetails}>
            <p className={styles.featuredHonor}>We are honored to welcome</p>
            <h3 className={styles.featuredName}>Jon Smith</h3>
            <p className={styles.featuredLabel}>2026 Inductee</p>
            <p className={styles.featuredBio}>
              A six-time ATA champion and tireless ambassador for Utah
              trapshooting, Jon Smith has dedicated over three decades to
              growing the sport at every level. From mentoring junior
              shooters to organizing state-level competitions, his impact
              on the Utah trapshooting community is immeasurable.
            </p>
            <Link href="/inductees/hortense-wood" className={styles.featuredBtn}>
              See Full Bio &rarr;
            </Link>
          </div>
        </div>
      </ScrollReveal>
    );
  }

  return (
    <div className={styles.spotlightGrid}>
      {featured.map((person, i) => (
        <ScrollReveal key={person.slug} delay={i * 150}>
          <div className={styles.featuredWrap}>
            <div className={styles.featuredFrame}>
              <span className={styles.ribbon}>{person.year ?? "2026"}</span>
              <div className={styles.spotlightPhotoWrap}>
                <Image
                  src={person.photo}
                  alt={person.name}
                  fill
                  sizes="300px"
                  className={styles.spotlightPhoto}
                />
              </div>
            </div>
            <div className={styles.featuredDetails}>
              <p className={styles.featuredHonor}>We are honored to welcome</p>
              <h3 className={styles.featuredName}>{person.name}</h3>
              <p className={styles.featuredLabel}>{person.year ?? "2026"} Inductee</p>
              {person.bio && (
                <p className={styles.featuredBio}>{person.bio}</p>
              )}
              <Link href={`/inductees/${person.slug}`} className={styles.featuredBtn}>
                See Full Bio &rarr;
              </Link>
            </div>
          </div>
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
            <p className={styles.heroPreTitle}>Utah Trapshooting</p>
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
