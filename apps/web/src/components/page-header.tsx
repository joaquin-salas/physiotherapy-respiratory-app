import type { ReactNode } from 'react';

/** Title (+ optional description) on the left, actions on the right, ruled underneath. */
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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-5">
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
  );
}
