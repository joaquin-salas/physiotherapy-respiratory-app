import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Patient, PatientInput } from './patients.api';
import { useUpdatePatient } from './patients.hooks';
import { PatientForm } from './PatientForm';

/** "Editar" button + dialog with the patient's data. New patients use the wizard (/patients/new). */
export function EditPatientDialog({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);
  const updatePatient = useUpdatePatient(patient.id);

  async function save(input: PatientInput) {
    await updatePatient.mutateAsync(input);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil />
          Editar
        </Button>
      </DialogTrigger>

      {/* The content unmounts when closed, so every opening starts from the saved data */}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar paciente</DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <PatientForm id="edit-patient-form" patient={patient} onSubmit={save} />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-patient-form"
            disabled={updatePatient.isPending}
          >
            {updatePatient.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
