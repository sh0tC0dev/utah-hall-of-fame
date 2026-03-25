"use client";

import { useState, useCallback } from "react";
import styles from "./Nav.module.css";

const links = [
  { href: "#top", label: "The Hall" },
  { href: "#class-2026", label: "Class of 2026" },
  { href: "#inductees", label: "Inductees" },
  { href: "#about", label: "About" },
];

export function Nav() {
  const [activeLink, setActiveLink] = useState("#top");

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setActiveLink(href);
    },
    []
  );

  return (
    <nav className={styles.nav}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={`${styles.navLink} ${activeLink === link.href ? styles.active : ""}`}
          onClick={(e) => handleClick(e, link.href)}
        >
          {link.label}
        </a>
      ))}
      <a
        href="http://www.utahtrap.com"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.navLink}
      >
        USTA
      </a>
    </nav>
  );
}
