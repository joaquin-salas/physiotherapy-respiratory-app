import { createPortal } from 'react-dom';
import { ConnectionSheet } from './ConnectionSheet';
import type { PairingCode } from './devices.api';

/**
 * The connection sheet on screen (a framed preview) plus the copy that gets printed.
 * The printed copy lives outside the page (a portal into <body>), so the print styles
 * in index.css can hide everything else and print only `.print-only`.
 */
export function ConnectionSheetPreview({ pairing }: { pairing: PairingCode }) {
  return (
    <>
      <div className="rounded-md border shadow-sm">
        <ConnectionSheet pairing={pairing} />
      </div>
      {createPortal(
        <div className="print-only">
          <ConnectionSheet pairing={pairing} />
        </div>,
        document.body,
      )}
    </>
  );
}
