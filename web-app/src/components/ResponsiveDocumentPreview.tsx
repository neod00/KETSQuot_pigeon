'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

const A4_WIDTH_PX = 210 * 96 / 25.4;
const A4_HEIGHT_PX = 297 * 96 / 25.4;

export default function ResponsiveDocumentPreview({ children, label }: { children: ReactNode; label: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ scale: 1, height: A4_HEIGHT_PX });

  useEffect(() => {
    const frame = frameRef.current;
    const documentNode = documentRef.current;
    if (!frame || !documentNode) return;

    const update = () => {
      const availableWidth = Math.min(frame.clientWidth, A4_WIDTH_PX);
      const scale = availableWidth / A4_WIDTH_PX;
      const sourceHeight = Math.max(documentNode.scrollHeight, A4_HEIGHT_PX);
      setMetrics({ scale, height: sourceHeight * scale });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    observer.observe(documentNode);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="responsive-preview" style={{ height: metrics.height }} aria-label={label}>
      <div ref={documentRef} className="responsive-preview-document" style={{ transform: `scale(${metrics.scale})` }}>
        {children}
      </div>
      <style jsx>{`
        .responsive-preview {
          position: relative;
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          overflow: hidden;
        }
        .responsive-preview-document {
          position: absolute;
          top: 0;
          left: 0;
          width: 210mm;
          transform-origin: top left;
        }
        @media print {
          .responsive-preview {
            width: 210mm !important;
            max-width: none !important;
            height: auto !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .responsive-preview-document {
            position: static !important;
            width: 210mm !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
