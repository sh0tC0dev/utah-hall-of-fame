import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Image
        src="/hof-logo.png"
        alt=""
        width={80}
        height={80}
        className={styles.footerLogo}
      />
      <p className={styles.address}>
        Utah Trapshooting Hall of Fame
        <br />
        PO Box 84 &middot; Springville, UT 84663
      </p>
      <p className={styles.footerText}>
        A 501(c)(3) nonprofit corporation &middot;{" "}
        <a
          href="http://www.utahtrap.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          Utah State Trapshooting Association
        </a>
      </p>
      <Link href="/contact?subject=donate" className={styles.donateLink}>
        Support the Hall
      </Link>
    </footer>
  );
}
