"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Nav.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/inductees", label: "Inductees" },
  { href: "/eligibility", label: "Eligibility" },
  { href: "/nominate", label: "Nominate" },
  { href: "/trustees", label: "Trustees" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.navLinks}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href))
                ? styles.active
                : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <Link href="/contact?subject=donate" className={styles.donateBtn}>
        Donate
      </Link>
    </nav>
  );
}
