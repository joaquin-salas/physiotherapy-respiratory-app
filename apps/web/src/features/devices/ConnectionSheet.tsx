import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '@/features/patients/patients.labels';
import type { PairingCode } from './devices.api';
import { formatPairingCode, PATIENT_APP_NAME } from './devices.labels';

/**
 * The connection sheet that goes in the patient's equipment bag. Shown as a preview
 * and printed. No name or other personal data: if the sheet is lost, it reveals nothing.
 * The QR holds `respira://pair?code=...`, which the patient app recognizes.
 */
export function ConnectionSheet({ pairing }: { pairing: PairingCode }) {
  return (
    <div className="flex flex-col items-center gap-6 bg-white p-8 text-center text-black">
      <h1 className="text-3xl font-bold">
        Conecte la app {PATIENT_APP_NAME}
      </h1>

      <ol className="flex flex-col gap-2 text-left text-xl">
        <li>1. Abra la app {PATIENT_APP_NAME} en su móvil o tableta.</li>
        <li>2. Pulse «Escanear código».</li>
        <li>3. Apunte la cámara a este código:</li>
      </ol>

      <QRCodeSVG
        value={`respira://pair?code=${pairing.code}`}
        size={240}
        level="M"
        marginSize={2}
        title="Código QR de conexión"
      />

      <div className="flex flex-col gap-2">
        <p className="text-lg">
          Si no puede escanearlo, pulse «Escribir el código» y escriba:
        </p>
        <p className="font-mono text-4xl font-bold tracking-widest">
          {formatPairingCode(pairing.code)}
        </p>
      </div>

      <p className="text-base">
        Este código sirve una sola vez y es válido hasta el{' '}
        {formatDate(pairing.expiresAt)}.
        <br />
        Si tiene dudas, consulte con su fisioterapeuta.
      </p>
    </div>
  );
}
