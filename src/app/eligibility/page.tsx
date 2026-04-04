import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "../components/ScrollReveal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Eligibility",
  description: "Eligibility criteria and selection requirements for the Utah Trapshooting Hall of Fame.",
};

const criteria = [
  { title: "Potential Inductees", text: "The Utah Trapshooting Hall of Fame Selection committee shall receive and review nominations for potential inductees. Sources should submit the achievements of their nominee in detail. A potential inductee may be selected based on shooting merit, administrative merit or a combination of both." },
  { title: "Shooting Merit", text: "Inductee shall have received six (6) major ATA championships in either Singles, Handicap, Doubles, HOA, and HAA; at State, Division or National level (Grand or Satellite Grands)." },
  { title: "Administrative Merit", text: "Inductee shall have performed exceptional, outstanding, and unselfish work for Utah trapshooting over a period of many years. Such work must have been undertaken in a voluntary manner and could not have occurred simultaneously while engaged as a salaried person in the trapshooting field or during the course of earning profits in the trapshooting field." },
  { title: "Basic Eligibility Criteria", text: "To be eligible for consideration the potential inductee shall have been a member of the ATA (Life or Annual) for not less than ten (10) years and have been a resident of the State of Utah for not less than ten (10) years." },
  { title: "Limitations", text: "No more than two people may be inducted into the Utah Trapshooters Hall of Fame each year. The trustees may allow more than two if there have been several years without inductions. Inductees can be living or deceased, but only one deceased person may be inducted each year." },
  { title: "Nominee Resume", text: "The selection committee will be given as much information as possible for each candidate. The information should include years as an ATA member, years as a Utah State resident, and any other information to be considered for selection." },
  { title: "Selection", text: "Each year, at the selection committee meeting, the selection committee members shall consider the merits of each nominee and selection will be by ballot, oral or by motion, with a majority in favor. Three (3) members will constitute a quorum and proxy votes are not allowed." },
  { title: "Records", text: "The secretary shall record meeting minutes, including record of votes, at each selection committee meeting." },
  { title: "Non-Participation", text: "A Utah Trapshooting Hall of Fame committee member may not vote when an immediate family member (including self) is being considered for induction and should not be present when the vote is taken." },
];

export default function EligibilityPage() {
  return (
    <div className={styles.page}>
      <ScrollReveal>
        <h1 className={styles.title}>Eligibility &amp; Selection</h1>
        <p className={styles.subtitle}>Requirements for Induction</p>
      </ScrollReveal>
      <ol className={styles.criteriaList}>
        {criteria.map((item, i) => (
          <ScrollReveal key={i} delay={i * 50}>
            <li className={styles.criteriaItem}>
              <h3 className={styles.criteriaTitle}>{i + 1}. {item.title}</h3>
              <p className={styles.criteriaText}>{item.text}</p>
            </li>
          </ScrollReveal>
        ))}
      </ol>
      <ScrollReveal>
        <div className={styles.cta}>
          <Link href="/nominate" className={styles.ctaButton}>Submit a Nomination &rarr;</Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
