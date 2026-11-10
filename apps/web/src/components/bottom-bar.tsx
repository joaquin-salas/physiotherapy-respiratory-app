import type { ReactNode } from 'react';

/**
 * Bar pinned to the bottom of the window with a form page's buttons, always visible while scrolling.
 * The page must leave room for it at the end (pb-24).
 */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    // Right of the sidebar (left-60 = its w-60). The background spans the whole width; the
    // buttons use the same centered column as the content (AppLayout).
    <div className="fixed right-0 bottom-0 left-60 border-t bg-card px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-3.5">
        {children}
      </div>
    </div>
  );
}
