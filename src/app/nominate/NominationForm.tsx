"use client";

import { useState } from "react";
import styles from "./NominationForm.module.css";

interface Championship {
  event: string;
  year: string;
  location: string;
}

export function NominationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [championships, setChampionships] = useState<Championship[]>(
    Array(6).fill(null).map(() => ({ event: "", year: "", location: "" }))
  );

  function updateChampionship(index: number, field: keyof Championship, value: string) {
    setChampionships((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      nomineeName: data.get("nomineeName"),
      nomineeAddress: data.get("nomineeAddress"),
      nomineeCity: data.get("nomineeCity"),
      nomineeState: data.get("nomineeState"),
      nomineeZip: data.get("nomineeZip"),
      residentTenYears: data.get("residentTenYears"),
      age: data.get("age"),
      dateOfBirth: data.get("dateOfBirth"),
      yearStarted: data.get("yearStarted"),
      lastYearCompeted: data.get("lastYearCompeted"),
      championships,
      administrativeExcellence: data.get("administrativeExcellence"),
      isIndustryRep: data.get("isIndustryRep"),
      hasMemorabilia: data.get("hasMemorabilia"),
      memorabiliaDescription: data.get("memorabiliaDescription"),
      isDeceased: data.get("isDeceased"),
      dateOfDeath: data.get("dateOfDeath"),
      relativeName: data.get("relativeName"),
      relativeRelationship: data.get("relativeRelationship"),
      relativeAddress: data.get("relativeAddress"),
      relativePhone: data.get("relativePhone"),
      relativeCity: data.get("relativeCity"),
      relativeState: data.get("relativeState"),
      relativeZip: data.get("relativeZip"),
      submitterName: data.get("submitterName"),
      submitterDate: new Date().toLocaleDateString(),
    };
    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or download the PDF and mail it in.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.successMessage}>
        <h2 className={styles.successTitle}>Nomination Submitted</h2>
        <p className={styles.successText}>
          Thank you for your nomination. The selection committee will review it at their next meeting.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Nominee Information</legend>
        <div className={styles.field}>
          <label htmlFor="nomineeName" className={styles.label}>Name of Nominee</label>
          <input type="text" id="nomineeName" name="nomineeName" required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="nomineeAddress" className={styles.label}>Address</label>
          <input type="text" id="nomineeAddress" name="nomineeAddress" className={styles.input} />
        </div>
        <div className={styles.row3}>
          <div className={styles.field}>
            <label htmlFor="nomineeCity" className={styles.label}>City</label>
            <input type="text" id="nomineeCity" name="nomineeCity" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="nomineeState" className={styles.label}>State</label>
            <input type="text" id="nomineeState" name="nomineeState" defaultValue="UT" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="nomineeZip" className={styles.label}>Zip</label>
            <input type="text" id="nomineeZip" name="nomineeZip" className={styles.input} />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="residentTenYears" className={styles.label}>Resident of Utah and ATA member for 10+ years?</label>
          <select id="residentTenYears" name="residentTenYears" required className={styles.select}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="age" className={styles.label}>Age</label>
            <input type="text" id="age" name="age" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="dateOfBirth" className={styles.label}>Date of Birth</label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" className={styles.input} />
          </div>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="yearStarted" className={styles.label}>Year Started Competitive Trapshooting</label>
            <input type="text" id="yearStarted" name="yearStarted" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="lastYearCompeted" className={styles.label}>Last Year of Competition</label>
            <input type="text" id="lastYearCompeted" name="lastYearCompeted" className={styles.input} />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Shooting Merit</legend>
        <p className={styles.fieldsetDesc}>List 6 major championships won per ATA rules</p>
        {championships.map((champ, i) => (
          <div key={i} className={styles.champRow}>
            <span className={styles.champNum}>{i + 1}.</span>
            <input type="text" placeholder="Event" value={champ.event} onChange={(e) => updateChampionship(i, "event", e.target.value)} className={styles.input} aria-label={`Championship ${i + 1} event`} />
            <input type="text" placeholder="Year" value={champ.year} onChange={(e) => updateChampionship(i, "year", e.target.value)} className={`${styles.input} ${styles.inputSmall}`} aria-label={`Championship ${i + 1} year`} />
            <input type="text" placeholder="Location" value={champ.location} onChange={(e) => updateChampionship(i, "location", e.target.value)} className={styles.input} aria-label={`Championship ${i + 1} location`} />
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Administrative Excellence</legend>
        <div className={styles.field}>
          <label htmlFor="administrativeExcellence" className={styles.label}>Describe the nominee&apos;s contributions</label>
          <textarea id="administrativeExcellence" name="administrativeExcellence" rows={5} className={styles.textarea} />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Additional Information</legend>
        <div className={styles.field}>
          <label htmlFor="isIndustryRep" className={styles.label}>Is the nominee an Industry Representative?</label>
          <select id="isIndustryRep" name="isIndustryRep" className={styles.select}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="hasMemorabilia" className={styles.label}>Does the nominee have memorabilia to contribute?</label>
          <select id="hasMemorabilia" name="hasMemorabilia" className={styles.select}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="memorabiliaDescription" className={styles.label}>If yes, describe the items</label>
          <textarea id="memorabiliaDescription" name="memorabiliaDescription" rows={3} className={styles.textarea} />
        </div>
        <div className={styles.field}>
          <label htmlFor="isDeceased" className={styles.label}>Is the nominee deceased?</label>
          <select id="isDeceased" name="isDeceased" className={styles.select}>
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="dateOfDeath" className={styles.label}>If deceased, date of death</label>
          <input type="date" id="dateOfDeath" name="dateOfDeath" className={styles.input} />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Nearest Relative</legend>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="relativeName" className={styles.label}>Name</label>
            <input type="text" id="relativeName" name="relativeName" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="relativeRelationship" className={styles.label}>Relationship</label>
            <input type="text" id="relativeRelationship" name="relativeRelationship" className={styles.input} />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="relativeAddress" className={styles.label}>Address</label>
          <input type="text" id="relativeAddress" name="relativeAddress" className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="relativePhone" className={styles.label}>Phone</label>
          <input type="tel" id="relativePhone" name="relativePhone" className={styles.input} />
        </div>
        <div className={styles.row3}>
          <div className={styles.field}>
            <label htmlFor="relativeCity" className={styles.label}>City</label>
            <input type="text" id="relativeCity" name="relativeCity" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="relativeState" className={styles.label}>State</label>
            <input type="text" id="relativeState" name="relativeState" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="relativeZip" className={styles.label}>Zip</label>
            <input type="text" id="relativeZip" name="relativeZip" className={styles.input} />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Submitted By</legend>
        <div className={styles.field}>
          <label htmlFor="submitterName" className={styles.label}>Your Name</label>
          <input type="text" id="submitterName" name="submitterName" required className={styles.input} />
        </div>
      </fieldset>

      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" disabled={submitting} className={styles.submitBtn}>
        {submitting ? "Submitting..." : "Submit Nomination"}
      </button>
    </form>
  );
}
