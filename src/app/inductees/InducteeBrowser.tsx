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
            <Link key={person.slug} href={`/inductees/${person.slug}`} className={styles.cardLink}>
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
                {person.year && <span className={styles.yearBadge}>{person.year}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
