import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import type { PatientStatus } from './patients.api';
import { usePatients } from './patients.hooks';
import { PatientFormDialog } from './PatientFormDialog';
import { PatientsTable } from './PatientsTable';

/** Patient list (active or discharged) + button to add a new patient. */
export function PatientsPage() {
  const [status, setStatus] = useState<PatientStatus>('active');
  const { data: patients, isPending, isError, refetch } = usePatients(status);
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Todos los pacientes de la plataforma.'
              : 'Los pacientes que tienes asignados.'}
          </p>
        </div>
        <PatientFormDialog />
      </div>

      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as PatientStatus)}
      >
        <TabsList>
          <TabsTrigger value="active">En seguimiento</TabsTrigger>
          <TabsTrigger value="discharged">Finalizados</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending ? (
        <p className="text-muted-foreground">Cargando pacientes…</p>
      ) : isError ? (
        <div className="rounded-md border border-destructive/50 p-4 text-destructive">
          <p>No se pudieron cargar los pacientes.</p>
          <button className="mt-2 underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : patients.length === 0 ? (
        <p className="text-muted-foreground">
          {status === 'active'
            ? 'No hay pacientes en seguimiento. Añade el primero con «Nuevo paciente».'
            : 'No hay pacientes con el seguimiento finalizado.'}
        </p>
      ) : (
        <PatientsTable
          patients={patients}
          showPhysiotherapist={isAdmin}
          discharged={status === 'discharged'}
        />
      )}
    </div>
  );
}
