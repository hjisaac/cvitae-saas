"use client";

import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { FileText, Play, Loader2, Eye, AlertCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  generatePDF, fetchProfiles, fetchFileContent,
  resolveSyncTex,
} from "../../lib/api";
import { extractPageLineCount, projectPdfClickToYamlLine } from "../../lib/synctex-projection";
import { captureError } from "../../lib/error";

// Isolated UI components
import { SettingsDialog } from "../../components/SettingsDialog";
import { UserMenu } from "../../components/UserMenu";
import { VariantControls } from "../../components/VariantControls";
import { DraggableAIBox } from "../../components/DraggableAIBox";

const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

// Main Page



export default function Home() {

  const t = useTranslations();

  const [profiles, setProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("general");
  const [activeFileType, setActiveFileType] = useState<string>("variant");
  const [yamlContent, setYamlContent] = useState<string>("");
  const [isFormView, setIsFormView] = useState<boolean>(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [schemaValidated, setSchemaValidated] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("#D86F45");
  const [aiAlwaysExpanded, setAiAlwaysExpanded] = useState(false);

  const editorRef = useRef<any>(null);

  // Sync accent colour to CSS var
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
    document.documentElement.style.setProperty("--accent-hover", accentColor);
  }, [accentColor]);

  const handleOpenVariant = (profile: string) => {
    setSelectedProfile(profile);
    setActiveFileType("variant");
  };

  const handleOpenLanguage = (locale: string) => {
    setActiveFileType(locale);
  };

  const handleToggleFileType = () => {
    setActiveFileType(prev => prev === "variant" ? "selector" : "variant");
  };

  useEffect(() => {
    if (!selectedProfile || !activeFileType) return;
    fetchFileContent(selectedProfile, activeFileType)
      .then(data => setYamlContent(data.content))
      .catch(() => setErrorMsg(`Could not load ${activeFileType} content.`));
  }, [selectedProfile, activeFileType]);

  useEffect(() => {
    fetchProfiles()
      .then(p => {
        setProfiles(p);
        if (p.length > 0) {
          const defaultProfile = p.includes("general") ? "general" : p[0];
          setSelectedProfile(defaultProfile);
        }
      })
      .catch(() => setErrorMsg("Could not load profiles. Is the backend running?"));
  }, []);

  const handleEditorDidMount = (ed: any, monaco: any) => { 
    editorRef.current = ed; 
  };
  
  const handleYamlChange = (v: string | undefined) => {
    setYamlContent(v || "");
  };

  const renderMutation = useMutation({
    mutationFn: (content: string) => generatePDF(content),
    onSuccess: blob => { setErrorMsg(null); setPdfBlob(blob); },
    onError: (error: any) => {
      console.error("Render failed:", error);
      captureError(error);
      setErrorMsg("The server encountered a problem compiling your PDF. Please try again later.");
    },
  });

  const handlePdfClick = async (page: number, x: number, y: number, yFraction?: number, pdfDoc?: any) => {
    if (!yamlContent) return;
    try {
      let targetLine: number | null = null;
      if (pdfDoc && typeof yFraction === "number") {
        try {
          const counts: number[] = [];
          for (let p = 1; p <= (pdfDoc.numPages || 1); p++)
            counts.push(await extractPageLineCount(await pdfDoc.getPage(p)));
          const proj = projectPdfClickToYamlLine({ clickedPage: page, yFraction, pageLineCounts: counts, totalYamlLines: yamlContent.split("\n").length });
          if (proj.confidence > 0 && proj.targetLine > 0) targetLine = proj.targetLine;
        } catch { /* fall through */ }
      }
      if (!targetLine) {
        const r = await resolveSyncTex(page, x, y);
        if (r.tex_line > 0) {
          const lines = yamlContent.split("\n");
          targetLine = Math.min(lines.length, Math.max(1, Math.round((r.tex_line / Math.max(1, lines.length)) * lines.length)));
        }
      }
      if (targetLine && editorRef.current) {
        editorRef.current.revealLineInCenter(targetLine);
        editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
        editorRef.current.focus();
      }
    } catch { /* silent */ }
  };

  return (
    <div className="h-screen w-full relative bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden">
      <h1 className="sr-only">{t("CVitae Tailor")}</h1>
      
      {/* ═══════════════════════ WORKSPACE (Background) ════════════════════ */}
      <div className="absolute inset-0 z-0">
        <PanelGroup direction="horizontal" className="h-full">

          <Panel defaultSize={55} minSize={30} className="flex flex-col h-full relative">
            <span className="sr-only">{t("Variant Configuration")}</span>
            <div className="flex-1 relative bg-white">
               {!isFormView ? (
                 <Editor
                   height="100%"
                   defaultLanguage={activeFileType.startsWith("locale_") ? "json" : "yaml"}
                   language={activeFileType.startsWith("locale_") ? "json" : "yaml"}
                   value={yamlContent}
                   onChange={handleYamlChange}
                   onMount={handleEditorDidMount}
                   theme="light"
                   options={{ minimap: { enabled: false }, fontSize: 13, lineHeight: 24, padding: { top: 80 }, scrollBeyondLastLine: false, smoothScrolling: true, cursorBlinking: "smooth" }}
                 />
               ) : (
                 <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                   Dynamic Form View Placeholder
                 </div>
               )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-px bg-[var(--border)] hover:bg-[var(--accent)] hover:w-1 transition-all cursor-col-resize z-10" />

          <Panel defaultSize={45} minSize={25} className="flex flex-col h-full bg-[#ECEAE6] relative z-0">
            <span className="sr-only">{t("Live Preview")}</span>
            {pdfBlob ? (
              <PDFViewer pdfBlob={pdfBlob} onPdfClick={handlePdfClick} />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 gap-3 h-full">
                <Eye className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">{t("Click \"Render PDF\" to generate preview")}</p>
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>

      {/* ═══════════════════════ TRANSPARENT HEADER ════════════════ */}
      <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-end px-4 h-16 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm pointer-events-none">
        
        {/* Left Side Controls */}
        <div className="flex items-center gap-3 pb-3 pointer-events-auto">
          <VariantControls 
            profiles={profiles} 
            selectedProfile={selectedProfile}
            activeFileType={activeFileType}
            isFormView={isFormView}
            onSelectProfile={setSelectedProfile} 
            onToggleFileType={handleToggleFileType}
            onToggleViewType={setIsFormView}
          />
        </div>

        {/* Center: Empty Space */}
        <div className="flex-1"></div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3 pb-3 pointer-events-auto">
          <button
            onClick={() => renderMutation.mutate(yamlContent)}
            disabled={renderMutation.isPending || !yamlContent}
            title={t("Compile the LaTeX template with your configurations to preview the generated PDF")}
            className="h-10 flex items-center gap-2 bg-[var(--accent)] text-white px-5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
          >
            {renderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {renderMutation.isPending ? t("Rendering") : t("Render PDF")}
          </button>

          <UserMenu onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </header>

      {/* Floating Draggable AI */}
      <DraggableAIBox 
        alwaysExpanded={aiAlwaysExpanded} 
        yamlContent={yamlContent} 
        onYamlChange={handleYamlChange} 
      />

      {/* ═══════════════════════ ERROR TOAST ═══════════════════════════════ */}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-50/95 border border-red-200 text-red-900 px-4 py-3 rounded-xl shadow-xl backdrop-blur-md max-w-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">System Alert</span>
            <span className="text-xs leading-normal font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700 transition-colors shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════ SETTINGS DIALOG ═══════════════════════════ */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        accentColor={accentColor}
        onAccentChange={setAccentColor}
        aiAlwaysExpanded={aiAlwaysExpanded}
        onAiAlwaysExpandedChange={setAiAlwaysExpanded}
        activeFileType={activeFileType}
        onOpenLanguage={handleOpenLanguage}
      />
    </div>
  );
}
