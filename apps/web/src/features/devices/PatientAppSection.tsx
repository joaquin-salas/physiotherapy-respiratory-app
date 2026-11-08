import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Patient } from '@/features/patients/patients.api';
import { formatDate } from '@/features/patients/patients.labels';
import { ConnectionSheet } from './ConnectionSheet';
import type { DeviceStatus, PairingCode } from './devices.api';
import {
  useCreatePairingCode,
  useDeviceStatus,
  useDisconnectDevice,
} from './devices.hooks';
import { PATIENT_APP_NAME } from './devices.labels';

/** "App del paciente" block of the patient record: connection status, sheet, disconnect */
export function PatientAppSection({ patient }: { patient: Patient }) {
  const { data: status, isPending, isError, refetch } = useDeviceStatus(
    patient.id,
  );
  const followUpEnded = !!patient.dischargedAt;

  return (
    <section className="rounded-lg border p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">App del paciente</h2>
        {status && !followUpEnded && (
          <div className="flex gap-2">
            {status.device && <DisconnectButton patientId={patient.id} />}
            <ConnectionSheetButton patientId={patient.id} status={status} />
          </div>
        )}
      </div>

      {isPending && <p className="text-muted-foreground">Cargando…</p>}
      {isError && (
        <p className="text-destructive">
          No se pudo cargar el estado de la app.{' '}
          <button className="underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </p>
      )}
      {status && (
        <StatusText status={status} followUpEnded={followUpEnded} />
      )}
    </section>
  );
}

function StatusText({
  status,
  followUpEnded,
}: {
  status: DeviceStatus;
  followUpEnded: boolean;
}) {
  if (followUpEnded) {
    return (
      <p className="text-muted-foreground">
        Seguimiento finalizado: la app está desconectada.
      </p>
    );
  }
  if (status.device) {
    const { name, connectedAt, lastUsedAt } = status.device;
    return (
      <p>
        Conectada{name && ` en ${name}`} desde el {formatDate(connectedAt)}.{' '}
        <span className="text-muted-foreground">
          Último uso: {formatDate(lastUsedAt)}.
        </span>
      </p>
    );
  }
  if (status.pendingCodeExpiresAt) {
    return (
      <p>
        Sin conectar. Hay una hoja de conexión pendiente de usar, válida hasta
        el {formatDate(status.pendingCodeExpiresAt)}.
      </p>
    );
  }
  return (
    <p className="text-muted-foreground">
      Sin conectar. Prepare la hoja de conexión para la bolsa del paciente.
    </p>
  );
}

/**
 * Creates a new code and shows the sheet as a preview, with "Imprimir hoja de conexión".
 * If there's already a device or an unused sheet, asks first: the new sheet replaces it.
 */
function ConnectionSheetButton({
  patientId,
  status,
}: {
  patientId: string;
  status: DeviceStatus;
}) {
  const createCode = useCreatePairingCode(patientId);
  const [pairing, setPairing] = useState<PairingCode | null>(null);

  const generate = () =>
    createCode.mutate(undefined, { onSuccess: (data) => setPairing(data) });

  // A device or an unused sheet already exists: the new sheet replaces it
  const replaces = !!(status.device || status.pendingCodeExpiresAt);
  const label = replaces ? 'Nueva hoja de conexión' : 'Preparar hoja de conexión';

  return (
    <>
      {replaces ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={createCode.isPending}>{label}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Preparar una hoja nueva?</AlertDialogTitle>
              <AlertDialogDescription>
                {status.pendingCodeExpiresAt &&
                  'La hoja anterior dejará de funcionar. '}
                {status.device &&
                  'Cuando el paciente use la hoja nueva, la app se desconectará del dispositivo actual.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={generate}>
                Preparar hoja nueva
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button disabled={createCode.isPending} onClick={generate}>
          {label}
        </Button>
      )}

      <Dialog
        open={pairing !== null}
        onOpenChange={(open) => !open && setPairing(null)}
      >
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Hoja de conexión</DialogTitle>
            <DialogDescription>
              Imprímala y métala en la bolsa del paciente. El código solo se
              muestra ahora: si cierra sin imprimir, tendrá que preparar otra.
            </DialogDescription>
          </DialogHeader>

          {pairing && (
            <>
              {/* Preview */}
              <div className="rounded-md border shadow-sm">
                <ConnectionSheet pairing={pairing} />
              </div>
              {/* The printed copy: outside the dialog, so the print styles can show only this */}
              {createPortal(
                <div className="print-only">
                  <ConnectionSheet pairing={pairing} />
                </div>,
                document.body,
              )}
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPairing(null)}>
              Cerrar
            </Button>
            <Button onClick={() => window.print()}>
              Imprimir hoja de conexión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** "Desconectar" (with confirmation), e.g. when the patient loses the phone */
function DisconnectButton({ patientId }: { patientId: string }) {
  const disconnect = useDisconnectDevice(patientId);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={disconnect.isPending}>
          Desconectar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desconectar la app?</AlertDialogTitle>
          <AlertDialogDescription>
            La app {PATIENT_APP_NAME} dejará de funcionar en el dispositivo del
            paciente. Para volver a conectarla necesitará una hoja de conexión
            nueva.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => disconnect.mutate()}>
            Desconectar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
