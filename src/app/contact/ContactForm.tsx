"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export function ContactForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const s = searchParams.get("subject");
    if (s === "donate") {
      setSubject("I'd like to donate");
    } else if (s === "scholarship") {
      setSubject("Interested in Youth Scholarship");
    }
  }, [searchParams]);

  function scrollToForm() {
    setSubject("I'd like to donate");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <div className={styles.successMessage}>
          <h2 className={styles.successTitle}>Message Sent</h2>
          <p className={styles.successText}>
            Thank you for reaching out. We&apos;ll get back to you soon.
          </p>
        </div>
        <DonateCard onDonateClick={scrollToForm} />
      </>
    );
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="contactName" className={styles.label}>Name</label>
          <input type="text" id="contactName" value={name} onChange={(e) => setName(e.target.value)} required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactEmail" className={styles.label}>Email</label>
          <input type="email" id="contactEmail" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactSubject" className={styles.label}>Subject</label>
          <input type="text" id="contactSubject" value={subject} onChange={(e) => setSubject(e.target.value)} className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="contactMessage" className={styles.label}>Message</label>
          <textarea id="contactMessage" value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className={styles.textarea} />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
      <DonateCard onDonateClick={scrollToForm} />
    </>
  );
}

function DonateCard({ onDonateClick }: { onDonateClick: () => void }) {
  return (
    <div className={styles.nonprofitCard}>
      <h3 className={styles.nonprofitTitle}>Support the Hall of Fame</h3>
      <p className={styles.nonprofitText}>
        The Utah Trapshooting Hall of Fame is a 501(c)(3) nonprofit
        corporation. Your contributions help preserve Utah&apos;s trapshooting
        heritage for future generations.
      </p>
      <button type="button" className={styles.donateCta} onClick={onDonateClick}>
        I&apos;d Like to Donate
      </button>
    </div>
  );
}
