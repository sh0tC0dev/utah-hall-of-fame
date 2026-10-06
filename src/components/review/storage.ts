// Browser storage that never throws. A browser that denies site storage
// (block-all-cookies settings) throws SecurityError from the localStorage
// getter itself, and a quota-full browser throws from setItem; a throw inside a
// React effect reaches the nearest error boundary, which on this site is Next's
// root screen. Every review component reads and writes storage through this
// object, so a denied or full store degrades to "nothing remembered".
export const storage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key) } catch { return null }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value) } catch { /* Denied or full: nothing remembered. */ }
  },
  remove(key: string): void {
    try { localStorage.removeItem(key) } catch { /* Denied: nothing to forget. */ }
  },
}
