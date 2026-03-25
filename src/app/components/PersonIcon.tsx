export function PersonIcon({ size = 36, opacity = 0.15 }: { size?: number; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      style={{ width: size, height: size, opacity }}
    >
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="rgba(27,42,74,0.15)"
      />
      <circle cx="12" cy="7" r="4" stroke="rgba(27,42,74,0.15)" />
    </svg>
  );
}
