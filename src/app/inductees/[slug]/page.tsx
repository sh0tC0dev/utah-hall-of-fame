import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { inductees, getInducteeBySlug } from "../../data";
import styles from "./page.module.css";

export function generateStaticParams() {
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
                    <Image
                      src={person.photo}
                      alt={person.name}
                      fill
                      sizes="(max-width: 768px) 90vw, 300px"
                      className={styles.photoImg}
                    />
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
              person.bio.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
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
