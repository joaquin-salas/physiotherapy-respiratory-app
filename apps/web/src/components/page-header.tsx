import type { ReactNode } from 'react';

/** Title (+ optional description) on the left, actions on the right, a heartbeat line underneath. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2.5">
        <div>
          <h1 className="text-4xl leading-none font-bold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2.5 text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      <HeartbeatRule />
    </div>
  );
}

/**
 * A flat 2px line with one pulse near the start, the same shape as the logo's line
 * (BrandMark: flat, up, deep down, up, flat).
 *
 * Drawn as ONE svg (no viewBox, so 1 unit = 1 px) instead of divs + an svg: separate pieces
 * were smoothed separately and showed a blurry patch where they met. The flat line sits at
 * y=11 with a 2px stroke, i.e. exactly on pixel rows 10–12, so it renders sharp.
 */
function HeartbeatRule() {
  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="22"
      className="block text-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {/* Flat start, the pulse, and flat again up to x=64 */}
      <path d="M0 11H24l4-8 8 16 4-8H64" strokeLinejoin="round" />
      {/* The rest of the width: <line> accepts percentages, a path doesn't */}
      <line x1="64" y1="11" x2="100%" y2="11" />
    </svg>
  );
}
