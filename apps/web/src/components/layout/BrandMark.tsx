/** Logo mark: a teal circle with a breathing/pulse line. Decorative (the name goes next to it). */
export function BrandMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="var(--primary)" />
      <path
        d="M7 15h4l2-4 4 8 2-4h4"
        fill="none"
        stroke="var(--background)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
