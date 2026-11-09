import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { StatusMarker } from '@/components/status-marker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDaysLong } from '@/features/programs/programs.labels';
import type { PatientListItem } from './patients.api';
import { ageFromBirthDate, formatDate } from './patients.labels';

interface PatientsTableProps {
  patients: PatientListItem[];
  showPhysiotherapist: boolean; // admins see whose patient it is
  discharged: boolean; // the discharged list shows the discharge date, not program/app
}

/** Worklist of patients. The whole row opens the record; the name is a real link too. */
export function PatientsTable({
  patients,
  showPhysiotherapist,
  discharged,
}: PatientsTableProps) {
  const navigate = useNavigate();

  const openRecord = (event: MouseEvent, id: string) => {
    // The link navigates by itself
    if ((event.target as HTMLElement).closest('a')) return;
    void navigate(`/patients/${id}`);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            {!discharged && <TableHead>Programa</TableHead>}
            {!discharged && <TableHead>App</TableHead>}
            {showPhysiotherapist && <TableHead>Fisioterapeuta</TableHead>}
            <TableHead>{discharged ? 'Finalizado el' : 'Desde'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow
              key={patient.id}
              className="cursor-pointer"
              onClick={(event) => openRecord(event, patient.id)}
            >
              <TableCell>
                <Link
                  to={`/patients/${patient.id}`}
                  className="text-base font-semibold hover:underline"
                >
                  {patient.identity?.fullName ?? 'Sin nombre'}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {patient.identity
                    ? `${ageFromBirthDate(patient.identity.birthDate)} años`
                    : '—'}
                  {patient.stage && ` · Estadio ${patient.stage}`}
                </div>
              </TableCell>
              {!discharged && (
                <TableCell>
                  {patient.activeProgram ? (
                    <>
                      <div className="font-medium">
                        {patient.activeProgram.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDaysLong(patient.activeProgram.days)}
                      </div>
                    </>
                  ) : (
                    <StatusMarker tone="action">
                      Sin programa: crear ahora
                    </StatusMarker>
                  )}
                </TableCell>
              )}
              {!discharged && (
                <TableCell>
                  {patient.appConnected ? (
                    <StatusMarker tone="ok">Conectada</StatusMarker>
                  ) : (
                    <StatusMarker tone="off">Sin conectar</StatusMarker>
                  )}
                </TableCell>
              )}
              {showPhysiotherapist && (
                <TableCell>{patient.physiotherapist.fullName}</TableCell>
              )}
              <TableCell className="text-muted-foreground tabular-nums">
                {formatDate(
                  discharged && patient.dischargedAt
                    ? patient.dischargedAt
                    : patient.createdAt,
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
