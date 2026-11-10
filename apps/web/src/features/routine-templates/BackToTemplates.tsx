import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

/** "‹ Plantillas" link at the top of the template pages (same look as the patient wizard's). */
export function BackToTemplates() {
  return (
    <Link
      to="/templates"
      className="mb-3.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
    >
      <ChevronLeft className="size-4" />
      Plantillas
    </Link>
  );
}
