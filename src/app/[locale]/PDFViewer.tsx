"use client";

import { useState, useEffect } from "react";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "../../i18n/use-translations";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

interface PDFViewerProps {
  pdfBlob: Blob;
  onPdfClick: (page: number, x: number, y: number, yFraction?: number, pdfDocument?: any) => void;
}

export default function PDFViewer({ pdfBlob, onPdfClick }: PDFViewerProps) {
  const t = useTranslations();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.1);
  const [pdfComponents, setPdfComponents] = useState<{ Document: any; Page: any } | null>(null);
  const [pdfDocInstance, setPdfDocInstance] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Polyfill Promise.withResolvers if missing in current environment
    if (typeof (Promise as any).withResolvers === "undefined") {
      (Promise as any).withResolvers = function () {
        let resolve: any, reject: any;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    }

    import("react-pdf")
      .then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
        setPdfComponents({ Document: mod.Document, Page: mod.Page });
      })
      .catch((err) => {
        console.error("Failed to load react-pdf:", err);
      });
  }, []);

  const handlePageDoubleClick = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const pdfX = clickX / scale;
    const pdfY = clickY / scale;
    const yFraction = rect.height > 0 ? clickY / rect.height : 0.5;

    onPdfClick(pageNumber, pdfX, pdfY, yFraction, pdfDocInstance);
  };

  if (!pdfComponents) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#e8e6e1] text-gray-500 gap-2 shadow-inner">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>{t("Initializing PDF engine...")}</span>
      </div>
    );
  }

  const { Document, Page } = pdfComponents;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--border)] bg-[#f5f4f1] justify-end">
        <button 
          onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title={t("Zoom Out")}
          aria-label={t("Zoom Out")}
        >
          <ZoomOut className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-xs font-semibold text-gray-500">{Math.round(scale * 100)}%</span>
        <button 
          onClick={() => setScale(s => Math.min(s + 0.1, 2.0))}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title={t("Zoom In")}
          aria-label={t("Zoom In")}
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 p-4 bg-[#e8e6e1] overflow-y-auto flex flex-col items-center gap-4 shadow-inner">
        <Document
          file={pdfBlob}
          onLoadSuccess={(pdfDoc: any) => {
            setPdfDocInstance(pdfDoc);
            if (pdfDoc.numPages !== numPages) {
              setNumPages(pdfDoc.numPages);
            }
          }}
          loading={
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("Loading PDF document...")}</span>
            </div>
          }
        >
          {Array.from(new Array(numPages || 0), (el, index) => (
            <div 
              key={`page_${index + 1}`} 
              data-testid="pdf-page-container"
              className="pdf-page-container shadow-xl bg-white rounded-sm border border-gray-200 relative cursor-crosshair overflow-hidden"
              onDoubleClick={(e) => handlePageDoubleClick(e, index + 1)}
              onClick={(e) => {
                if (e.detail === 2) {
                  handlePageDoubleClick(e, index + 1);
                }
              }}
            >
              <Page 
                pageNumber={index + 1} 
                scale={scale} 
                renderTextLayer={true} 
                renderAnnotationLayer={false} 
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
