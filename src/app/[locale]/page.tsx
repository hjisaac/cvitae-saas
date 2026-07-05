"use client";

import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { Sparkles, FileText, Download, Play } from "lucide-react";
import dummyCVData from "./dummy-cv.json";

import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Editor");
  const [yamlContent, setYamlContent] = useState(JSON.stringify(dummyCVData, null, 2));
  const [loading, setLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const generatePDF = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: yamlContent,
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      setPdfBlob(blob);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-white/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="font-semibold text-lg tracking-tight">{t('title')}</h1>
        </div>
        <div className="flex gap-4">
          <button 
            className="glass-panel px-4 py-2 text-sm font-medium hover:bg-white/80 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            {t('ai_tailor')}
          </button>
          <button 
            onClick={generatePDF}
            disabled={loading}
            className="bg-[var(--accent)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {loading ? t('rendering') : t('render_pdf')}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden p-4">
        <PanelGroup direction="horizontal" className="h-full rounded-xl border border-[var(--border)] overflow-hidden shadow-sm bg-white">
          
          {/* Left Pane: Code Editor */}
          <Panel defaultSize={50} minSize={30} className="flex flex-col h-full bg-[#fcfcfc]">
            <div className="px-4 py-2 border-b border-[var(--border)] bg-[#f5f4f1] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('variant_config')}
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={yamlContent}
                onChange={(val) => setYamlContent(val || "")}
                theme="light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineHeight: 24,
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                }}
              />
            </div>
          </Panel>

          {/* Draggable Divider */}
          <PanelResizeHandle className="w-1 bg-[var(--border)] hover:bg-[var(--accent)] hover:w-1.5 transition-all cursor-col-resize active:bg-[var(--accent)]" />

          {/* Right Pane: Live PDF Preview */}
          <Panel defaultSize={50} minSize={30} className="flex flex-col h-full bg-gray-50/50 relative">
            <div className="px-4 py-2 border-b border-[var(--border)] bg-[#f5f4f1] flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('live_preview')}</span>
              {pdfBlob && (
                <button 
                  onClick={() => window.open(URL.createObjectURL(pdfBlob))}
                  className="text-gray-500 hover:text-[var(--accent)] transition-colors"
                  title={t('download_pdf')}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 p-4 bg-[#e8e6e1] overflow-auto flex justify-center shadow-inner relative">
              {pdfBlob ? (
                <iframe
                  src={URL.createObjectURL(pdfBlob)}
                  className="w-full h-full max-w-4xl bg-white shadow-xl rounded-sm border border-gray-200"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 gap-3 h-full">
                  <FileText className="w-12 h-12 opacity-50" />
                  <p className="text-sm font-medium">{t('click_to_generate')}</p>
                </div>
              )}
            </div>
          </Panel>

        </PanelGroup>
      </main>
    </div>
  );
}
