import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { inductees } from "../data";
import { InducteeBrowser } from "./InducteeBrowser";
import { ScrollReveal } from "../components/ScrollReveal";
import { PersonIcon } from "../components/PersonIcon";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inductees",
  description: "All members of the Utah Trapshooting Hall of Fame.",
};

function FeaturedPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="200px"
      className={styles.featuredPhoto}
    />
  );
}

export default function InducteesPage() {
  const featured = inductees.filter((i) => i.featured);
  const rest = inductees.filter((i) => !i.featured);

  return (
    <div>
      <section className={styles.header}>
        <ScrollReveal>
          <h1 className={styles.title}>The Hall</h1>
          <p className={styles.subtitle}>{inductees.length} Inductees</p>
        </ScrollReveal>
      </section>

      {featured.length > 0 && (
        <section className={styles.featuredSection}>
          <ScrollReveal>
            <h2 className={styles.featuredTitle}>Class of 2026</h2>
            <p className={styles.featuredSubtitle}>This Year&apos;s Inductees</p>
          </ScrollReveal>
          <div className={styles.featuredGrid}>
            {featured.map((person, i) => (
              <ScrollReveal key={person.slug} delay={i * 120}>
                <Link href={`/inductees/${person.slug}`} className={styles.featuredCard}>
                  <div className={styles.featuredFrame}>
                    <div className={styles.featuredPhotoWrap}>
                      <FeaturedPhoto src={person.photo} alt={person.name} />
                    </div>
                  </div>
                  <div className={styles.featuredNameplate}>
                    <span className={styles.featuredName}>{person.name}</span>
                  </div>
                  <span className={styles.featuredYear}>2026 Inductee</span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      <InducteeBrowser inductees={rest} />
    </div>
  );
}
