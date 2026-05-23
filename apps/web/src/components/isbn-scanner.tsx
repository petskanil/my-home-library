"use client";

import { useEffect, useRef } from "react";

type IsbnScannerProps = {
  onScan: (isbn: string) => void;
  onClose: () => void;
};

export default function IsbnScanner({ onScan, onClose }: IsbnScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Prefer native BarcodeDetector when available
        const hasBarcodeDetector = typeof (window as any).BarcodeDetector !== "undefined";
        if (hasBarcodeDetector && videoRef.current) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "code_39"] });
            const poll = async () => {
              if (!videoRef.current) return;
              try {
                const results = await detector.detect(videoRef.current);
                if (results && results.length) {
                  onScan(results[0].rawValue || results[0].rawText || "");
                } else {
                  requestAnimationFrame(poll);
                }
              } catch {
                requestAnimationFrame(poll);
              }
            };
            requestAnimationFrame(poll);
            readerRef.current = { stop: () => {} };
            return;
          } catch (err) {
            // fall through to ZXing fallback
          }
        }

        // ZXing fallback
        const { BrowserMultiFormatReader } = await import("@zxing/library");
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;
        if (videoRef.current) {
          codeReader.decodeFromVideoDevice(null, videoRef.current, (result: any, err: any) => {
            if (result) {
              onScan(result.getText());
            }
          });
        }
      } catch (err) {
        // ignore; user will see no camera
      }
    }

    start();

    return () => {
      mounted = false;
      try {
        if (readerRef.current && typeof readerRef.current.reset === "function") readerRef.current.reset();
      } catch {}
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-md overflow-hidden w-full max-w-md">
        <div className="relative" style={{ height: 360 }}>
          <video ref={videoRef} className="w-full h-full object-cover bg-black" playsInline />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[88%] h-28 border-2 border-white rounded-md bg-white/10" />
          </div>
        </div>
        <div className="p-3 flex items-center justify-between">
          <button
            className="px-3 py-2 rounded-md btn-secondary"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
