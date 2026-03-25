import type { Metadata } from "next";
import { Suspense } from "react";
import { ScrollReveal } from "../components/ScrollReveal";
import { ContactForm } from "./ContactForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the Utah Trapshooting Hall of Fame.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>Utah Trapshooting Hall of Fame</p>
      </ScrollReveal>

      <Suspense>
        <ContactForm />
      </Suspense>

      <ScrollReveal>
        <div className={styles.address}>
          <p>Utah Trapshooting Hall of Fame</p>
          <p>PO Box 84</p>
          <p>Springville, UT 84663</p>
        </div>
      </ScrollReveal>
    </div>
  );
}
