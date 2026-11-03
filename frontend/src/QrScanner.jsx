import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QrScanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("oerms-qr-reader", {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      rememberLastUsedCamera: true
    }, false);
    scanner.render((decodedText) => onScan(decodedText), () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, [onScan]);
  return <div className="qr-scanner"><div id="oerms-qr-reader"/><p>Allow camera access and point it at an OERMS ticket QR code.</p></div>;
}
