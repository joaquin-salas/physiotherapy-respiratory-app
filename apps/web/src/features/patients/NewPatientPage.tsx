import { ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useBlocker, useNavigate } from 'react-router';
import { PageHeader } from '@/components/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { PatientInput } from './patients.api';
import { useCreatePatient } from './patients.hooks';
import { PatientForm } from './PatientForm';
import { WizardFrame } from './PatientWizard';

/** Step 1 of the wizard: personal and clinical data. "Guardar y continuar" creates the patient. */
export function NewPatientPage() {
  const navigate = useNavigate();
  const createPatient = useCreatePatient();
  const [dirty, setDirty] = useState(false);
  const saved = useRef(false); // once created, leaving the page is the normal flow

  // Leaving with typed data that isn't saved: ask first
  const blocker = useBlocker(() => dirty && !saved.current);

  async function save(input: PatientInput) {
    const created = await createPatient.mutateAsync(input);
    saved.current = true;
    await navigate(`/patients/${created.id}/setup?step=program`, {
      replace: true, // "back" from step 2 shouldn't reopen an empty step 1
    });
  }

  return (
    <WizardFrame
      step={0}
      header={
        <PageHeader
          title="Nuevo paciente"
          description="Tres pasos. Solo el primero es obligatorio; el resto puede hacerlo más tarde desde la ficha."
        />
      }
      footer={
        <>
          <Button variant="ghost" className="h-11 px-4" asChild>
            <Link to="/patients">Cancelar</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Los campos con * son obligatorios. El paciente se crea al
              continuar.
            </span>
            <Button
              type="submit"
              form="new-patient-form"
              className="h-11 px-4"
              disabled={createPatient.isPending}
            >
              {createPatient.isPending ? 'Guardando…' : 'Guardar y continuar'}
              <ChevronRight />
            </Button>
          </div>
        </>
      }
    >
      <PatientForm
        id="new-patient-form"
        onSubmit={save}
        onDirtyChange={setDirty}
      />

      <AlertDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Se perderán los datos que ha escrito. El paciente no se creará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WizardFrame>
  );
}
