/**
 * The kit version a host site runs. Hosts copy source files rather than
 * installing a package, so package.json never reaches them; this constant is
 * the one copy that does. It is stamped into every batch manifest
 * (`changes.json` → `kitVersion`) and into the last line of every batch
 * email, so Atlas learns which version each site runs from the batches it
 * receives. `tests/version.test.mjs` pins it to package.json and CHANGELOG.md.
 */
export const KIT_VERSION = "0.5.2"
