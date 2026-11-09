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
import { WEEKDAYS } from '@/features/programs/programs.api';
import {
  AdherenceLegendHeader,
  AdherenceWeek,
  type AdherenceLevel,
  type DayResult,
} from './AdherenceWeek';
import type { PatientListItem } from './patients.api';
import { ageFromBirthDate, formatDate } from './patients.labels';

// MOCKUP: example data only in development, so production never shows invented adherence.
// Replace with the real level + week from the API once workout logging exists.
const ADHERENCE_PREVIEW = import.meta.env.DEV;
const PREVIEW_LEVELS: AdherenceLevel[] = ['good', 'low', 'missed'];

function adherence(patient: PatientListItem): {
  level: AdherenceLevel;
  week: DayResult[];
} {
  // Last 7 days, oldest first; a day is planned if it's one of the program's days (real data)
  const planned = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const weekday = WEEKDAYS[(date.getDay() + 6) % 7]; // getDay(): 0 = Sunday
    return patient.activeProgram?.days.includes(weekday) ?? false;
  });

  if (!patient.activeProgram || !patient.appConnected || !ADHERENCE_PREVIEW) {
    return { level: 'unknown', week: planned.map(() => 'rest') };
  }

  // Stable example level per patient (same one on every reload)
  const hash = [...patient.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const level = PREVIEW_LEVELS[hash % PREVIEW_LEVELS.length];
  let plannedIndex = 0;
  const week = planned.map((isPlanned): DayResult => {
    if (!isPlanned) return 'rest';
    const n = plannedIndex++;
    if (level === 'good') return 'done';
    if (level === 'low') return n % 2 === 0 ? 'miss' : 'done';
    return n === 0 ? 'done' : 'miss';
  });
  return { level, week };
}

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
            {!discharged && (
              <TableHead className="w-0">
                <AdherenceLegendHeader preview={ADHERENCE_PREVIEW} />
              </TableHead>
            )}
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
              {!discharged && (
                <TableCell>
                  <AdherenceWeek {...adherence(patient)} />
                </TableCell>
              )}
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
