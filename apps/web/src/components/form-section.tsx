import type { ReactNode } from 'react';

/**
 * Title + short explanation and a 2-column grid of fields. The title goes on the left when the
 * container is wide (full pages) and on top when it's narrow (dialogs): the <form> needs `@container`.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-x-10 gap-y-4 @3xl:grid-cols-[15rem_1fr]">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid content-start gap-x-5 gap-y-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}
