import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// `next lint` was removed in Next 16 (the old script died on "Invalid project
// directory provided: .../lint" — exiting non-zero while linting nothing), so
// the lint script now invokes eslint directly against this flat config.
// Pattern proven portfolio-wide 2026-08-13: import the Next flat configs
// directly, no FlatCompat, and name every build-output dir in ignores because
// ESLint never reads .gitignore.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".next.OLD-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".vercel/**",
  ]),
  // Portfolio-wide decision 2026-08-13: react-hooks/set-state-in-effect stays
  // visible as a warning, not an error. Today's single instance was read and
  // classified: src/app/contact/ContactForm.tsx pre-fills the form subject
  // from the URL (?subject=donate|scholarship) via useSearchParams inside an
  // effect — the reset-on-prop-change / hydration-init idiom, not a defect.
  // "warn" not "off" so future instances still surface. The `files` key is
  // required — without it ESLint fails with "could not find plugin react-hooks".
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
]);

export default eslintConfig;
