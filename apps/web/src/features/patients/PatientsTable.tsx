import { Link } from 'react-router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Patient } from './patients.api';
import { ageFromBirthDate, formatDate } from './patients.labels';

interface PatientsTableProps {
  patients: Patient[];
  showPhysiotherapist: boolean; // admins see whose patient it is
  discharged: boolean; // the discharged list shows the discharge date
}

/** Displays a list of patients. Each name links to the patient's record. */
export function PatientsTable({
  patients,
  showPhysiotherapist,
  discharged,
}: PatientsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead className="text-center">Edad</TableHead>
          <TableHead>Diagnóstico</TableHead>
          <TableHead>Estadio</TableHead>
          {showPhysiotherapist && <TableHead>Fisioterapeuta</TableHead>}
          <TableHead>
            {discharged ? 'Finalizado el' : 'En seguimiento desde'}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>
              <Link
                to={`/patients/${patient.id}`}
                className="font-medium hover:underline"
              >
                {patient.identity?.fullName ?? 'Sin nombre'}
              </Link>
            </TableCell>
            <TableCell className="text-center">
              {patient.identity
                ? ageFromBirthDate(patient.identity.birthDate)
                : '—'}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {patient.diagnosis}
            </TableCell>
            <TableCell>{patient.stage ?? '—'}</TableCell>
            {showPhysiotherapist && (
              <TableCell>{patient.physiotherapist.fullName}</TableCell>
            )}
            <TableCell>
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
  );
}
