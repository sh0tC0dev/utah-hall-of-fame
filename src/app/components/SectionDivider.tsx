import { ScrollReveal } from "./ScrollReveal";
import styles from "./SectionDivider.module.css";

export function SectionDivider() {
  return (
    <ScrollReveal>
      <div className={styles.sectionDivider}>
        <span className={styles.lineLeft} />
        <span className={styles.ornament} />
        <span className={styles.lineRight} />
      </div>
    </ScrollReveal>
  );
}
