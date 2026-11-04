import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QrScanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("oerms-qr-reader", {
      fps: 8,
      qrbox: { width: 220, height: 220 },
      rememberLastUsedCamera: true
    }, false);
    let scanHandled = false;
    scanner.render((decodedText) => {
      if (scanHandled) return;
      scanHandled = true;
      // One scan per scanner session prevents repeated API requests while a QR
      // code remains in view. Close and reopen the scanner to scan another ticket.
      scanner.pause(true);
      Promise.resolve(onScan(decodedText)).catch(() => {
        scanHandled = false;
        scanner.resume();
      });
    }, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, [onScan]);
  return <div className="qr-scanner"><div id="oerms-qr-reader"/><p>Allow camera access and point it at an OERMS ticket QR code.</p></div>;
}
