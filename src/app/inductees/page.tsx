import type { Metadata } from "next";
import { inductees } from "../data";
import { InducteeBrowser } from "./InducteeBrowser";
import { ScrollReveal } from "../components/ScrollReveal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inductees",
  description: "All members of the Utah Trapshooting Hall of Fame.",
};

export default function InducteesPage() {
  return (
    <div>
      <section className={styles.header}>
        <ScrollReveal>
          <h1 className={styles.title}>The Hall</h1>
          <p className={styles.subtitle}>{inductees.length} Inductees</p>
        </ScrollReveal>
      </section>
      <InducteeBrowser inductees={inductees} />
    </div>
  );
}
