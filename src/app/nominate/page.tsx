import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "../components/ScrollReveal";
import { NominationForm } from "./NominationForm";
import styles from "./NominationForm.module.css";

export const metadata: Metadata = {
  title: "Nominate",
  description: "Submit a nomination for the Utah Trapshooting Hall of Fame.",
};

export default function NominatePage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Nomination Form</h1>
        <p className={styles.subtitle}>Utah Trapshooting Hall of Fame</p>
        <p className={styles.pdfLink}>
          Prefer to mail it in?{" "}
          <Link href="/HOF_nomination_form.pdf" target="_blank" className={styles.link}>
            Download the PDF
          </Link>
        </p>
      </ScrollReveal>
      <NominationForm />
    </div>
  );
}
