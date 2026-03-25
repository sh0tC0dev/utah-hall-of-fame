"use client";

import { useState, useCallback, useEffect } from "react";
import type { Inductee } from "../data";
import { PersonIcon } from "./PersonIcon";
import styles from "./InducteeGrid.module.css";

function InducteePhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={styles.noPhoto}>
        <PersonIcon />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={styles.photoImg}
      onError={() => setFailed(true)}
    />
  );
}

export function InducteeGrid({ inductees }: { inductees: Inductee[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const closeModal = useCallback(() => {
    setSelectedIndex(null);
    document.body.style.overflow = "";
  }, []);

  const openModal = useCallback((index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  const selected = selectedIndex !== null ? inductees[selectedIndex] : null;

  return (
    <>
      <div className={styles.inducteeGrid}>
        {inductees.map((person, i) => (
          <div
            key={person.name}
            className={styles.inducteeCard}
            style={{ animationDelay: `${Math.min(i * 0.05, 1.5)}s` }}
          >
            <div
              className={styles.inducteeFrame}
              onClick={() => openModal(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openModal(i);
              }}
              aria-label={`View ${person.name}`}
            >
              <div className={styles.frameOuter}>
                <div className={styles.frameInner}>
                  <div className={styles.frameMat}>
                    <div className={styles.framePhoto}>
                      <InducteePhoto src={person.photo} alt={person.name} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.nameplate}>
              <span className={styles.inducteeName}>{person.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <div
        className={`${styles.modalOverlay} ${selected ? styles.active : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        {selected && (
          <div className={styles.modal}>
            <button
              className={styles.modalClose}
              onClick={closeModal}
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className={styles.modalContent}>
              <div className={styles.modalFrame}>
                <div className={styles.frameOuter}>
                  <div className={styles.frameInner}>
                    <div className={styles.frameMat}>
                      <div className={styles.framePhoto}>
                        <ModalPhoto src={selected.photo} alt={selected.name} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className={styles.modalName}>{selected.name}</h3>
              <p className={styles.inductionYear}>Hall of Fame Inductee</p>
              <div className={styles.modalBio}>
                <em>
                  Biography coming soon. The Utah Trapshooting Hall of Fame is
                  compiling detailed histories of each inductee to honor their
                  contributions to the sport.
                </em>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ModalPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={styles.noPhoto}>
        <PersonIcon size={50} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={styles.modalPhotoImg}
      onError={() => setFailed(true)}
    />
  );
}
