import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "../components/ScrollReveal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Youth Scholarship",
  description:
    "Utah Trapshooting Hall of Fame Youth Scholarship Program — supporting student trapshooters pursuing higher education.",
};

export default function ScholarshipPage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Youth Scholarship Program</h1>
        <p className={styles.subtitle}>Supporting Student Trapshooters</p>
      </ScrollReveal>

      <ScrollReveal>
        <p className={styles.intro}>
          Every year, the Utah Trapshooting Hall of Fame solicits applications
          from students who intend to further their education at an institution
          of higher learning following high school. A scholarship of{" "}
          <span className={styles.amount}>$500 to $1,000</span> (at the
          discretion of the trustees) will be awarded to a qualified recipient.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className={styles.sectionTitle}>Eligibility Requirements</h2>
        <ul className={styles.requirementsList}>
          <li className={styles.requirementItem}>
            <span className={styles.bullet}>&#9670;</span>
            Must be a resident of Utah
          </li>
          <li className={styles.requirementItem}>
            <span className={styles.bullet}>&#9670;</span>
            Must have shot 500 singles and 500 handicap targets during the
            preceding 12 months
          </li>
        </ul>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className={styles.sectionTitle}>Application Materials</h2>
        <ul className={styles.applicationList}>
          <li className={styles.applicationItem}>
            Completed Scholarship Personal Data Application
          </li>
          <li className={styles.applicationItem}>
            A short essay (300 words or less) with the theme of how
            participation in organized sports can be a lifelong benefit
          </li>
          <li className={styles.applicationItem}>
            List of number of years trapshooting, major wins, records, etc.
          </li>
          <li className={styles.applicationItem}>
            Two letters of recommendation from a certified instructor, ATA
            delegate, or guidance counselor
          </li>
        </ul>
      </ScrollReveal>

      <ScrollReveal>
        <p className={styles.deadline}>
          All application materials must be received by the Hall of Fame
          Secretary no later than{" "}
          <span className={styles.deadlineDate}>May 31st</span> each year.
        </p>
        <p className={styles.recognition}>
          The selectee will be recognized at the Utah State Shoot.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <div className={styles.contactCard}>
          <h3 className={styles.contactCardTitle}>
            For More Information, Contact
          </h3>
          <p className={styles.contactPerson}>
            <span className={styles.contactName}>Ed Wehking</span>, President
            <br />
            <a href="tel:801-231-8046" className={styles.contactLink}>
              (801) 231-8046
            </a>{" "}
            &middot;{" "}
            <a href="mailto:ed.wehking@comcast.net" className={styles.contactLink}>
              ed.wehking@comcast.net
            </a>
          </p>
          <p className={styles.contactPerson}>
            <span className={styles.contactName}>John Vosnos</span>, Secretary
            <br />
            <a href="tel:801-824-1318" className={styles.contactLink}>
              (801) 824-1318
            </a>{" "}
            &middot;{" "}
            <a href="mailto:John.vosnos@yahoo.com" className={styles.contactLink}>
              John.vosnos@yahoo.com
            </a>
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className={styles.cta}>
          <Link
            href="/contact?subject=scholarship"
            className={styles.ctaButton}
          >
            Inquire About Scholarships &rarr;
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
