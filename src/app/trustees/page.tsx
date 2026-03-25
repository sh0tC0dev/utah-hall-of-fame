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
              <a href={`mailto:${t.email}`} className={styles.contactLink}>{t.email}</a>
              <a href={`tel:${t.phone}`} className={styles.contactLink}>{t.phone}</a>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
