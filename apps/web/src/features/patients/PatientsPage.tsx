import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { usePatients } from './patients.hooks';
import { PatientFormDialog } from './PatientFormDialog';
import { PatientsTable } from './PatientsTable';

type Filter = 'active' | 'noProgram' | 'noApp' | 'discharged';

/** Lowercase without accents, so "jose" finds "José" */
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Patients worklist: program and app status at a glance, filters and search. */
export function PatientsPage() {
  const [filter, setFilter] = useState<Filter>('active');
  const [search, setSearch] = useState('');
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  // The active list is always needed (header counts); discharged only on demand
  const active = usePatients('active');
  const discharged = usePatients('discharged', filter === 'discharged');
  const current = filter === 'discharged' ? discharged : active;
  const { isPending, isError, refetch } = current;

  const activePatients = active.data;
  const withoutProgram = activePatients?.filter((p) => !p.activeProgram) ?? [];

  const byFilter =
    filter === 'discharged'
      ? discharged.data
      : filter === 'noProgram'
        ? withoutProgram
        : filter === 'noApp'
          ? activePatients?.filter((p) => !p.appConnected)
          : activePatients;

  const query = search.trim();
  const patients = query
    ? byFilter?.filter((p) =>
        normalize(p.identity?.fullName ?? '').includes(normalize(query)),
      )
    : byFilter;

  const emptyMessage = query
    ? `Ningún paciente coincide con «${query}».`
    : {
        active: 'Aún no tienes pacientes. Pulsa «Nuevo paciente» para empezar.',
        noProgram: 'Todos tus pacientes tienen programa.',
        noApp: 'Todos tus pacientes tienen la app conectada.',
        discharged: 'No hay seguimientos finalizados.',
      }[filter];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pacientes"
        description={
          activePatients && (
            <>
              <strong className="text-foreground">
                {activePatients.length}
              </strong>{' '}
              en seguimiento
              {withoutProgram.length > 0 && (
                <>
                  {' · '}
                  <strong className="text-foreground">
                    {withoutProgram.length}
                  </strong>{' '}
                  sin programa
                </>
              )}
            </>
          )
        }
        actions={<PatientFormDialog />}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 basis-60">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar paciente"
            placeholder="Buscar por nombre"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 bg-card pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="active">En seguimiento</TabsTrigger>
            <TabsTrigger value="noProgram">Sin programa</TabsTrigger>
            <TabsTrigger value="noApp">Sin app</TabsTrigger>
            <TabsTrigger value="discharged">Finalizados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isPending ? (
        <p className="text-muted-foreground">Cargando pacientes…</p>
      ) : isError ? (
        <div className="rounded-md border border-destructive/50 p-4 text-destructive">
          <p>No se pudieron cargar los pacientes.</p>
          <button className="mt-2 underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : !patients || patients.length === 0 ? (
        <p className="py-6 text-muted-foreground">{emptyMessage}</p>
      ) : (
        <PatientsTable
          patients={patients}
          showPhysiotherapist={isAdmin}
          discharged={filter === 'discharged'}
        />
      )}
    </div>
  );
}
