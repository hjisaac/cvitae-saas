"use client";

import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { Sparkles, FileText, Download, Play, Loader2, Menu, Eye, Code, Sliders as FormIcon, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { parseDocument, stringify, parse } from "yaml";

import { 
  generatePDF, 
  fetchProfiles, 
  fetchFileContent, 
  saveFileContent, 
  fetchSchema, 
  resolveSyncTex 
} from "../../lib/api";

// Dynamically load PDFViewer with SSR disabled since it uses canvas/window APIs
const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

// Dynamically import RJSF Form to prevent SSR issues
const RJSFForm = dynamic(() => import("@rjsf/core").then(mod => mod.default), { ssr: false });
import validator from "@rjsf/validator-ajv8";

export default function Home() {
  const t = useTranslations();
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("general");
  const [activeFileType, setActiveFileType] = useState<string>("variant"); // selector or variant or general
  
  // Editor and Data States
  const [yamlContent, setYamlContent] = useState<string>("");
  const [filePath, setFilePath] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"code" | "form">("code");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  
  // Dynamic Form schema
  const [formSchema, setFormSchema] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  // Monaco editor instance ref
  const editorRef = useRef<any>(null);

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles()
      .then(p => {
        setProfiles(p);
        if (p.length > 0 && !p.includes(selectedProfile)) {
          setSelectedProfile(p[0]);
        }
      })
      .catch(err => console.error("Error loading profiles:", err));
  }, []);

  // Fetch active file content when profile or file type changes
  useEffect(() => {
    if (!selectedProfile) return;
    
    fetchFileContent(selectedProfile, activeFileType)
      .then(data => {
        setYamlContent(data.content);
        setFilePath(data.filepath);
        
        // Sync to Form Data
        try {
          const parsed = parse(data.content) || {};
          setFormData(parsed);
        } catch (e) {
          // YAML might be empty or invalid initially
          setFormData({});
        }
      })
      .catch(err => console.error("Error loading file content:", err));
  }, [selectedProfile, activeFileType]);

  // Load JSON schema based on active file type (selector or variant)
  useEffect(() => {
    const schemaType = activeFileType === "selector" ? "selector" : "variant";
    fetchSchema(schemaType)
      .then(schema => {
        // Strip out YAML custom tags ($ref, etc.) if they confuse RJSF
        setFormSchema(schema);
      })
      .catch(err => console.error("Error loading schema:", err));
  }, [activeFileType]);

  // Track Monaco Editor load
  const handleEditorDidMount = (editorInstance: any) => {
    editorRef.current = editorInstance;
  };

  // Convert YAML to Form Object when Editor content changes
  const handleYamlChange = (value: string | undefined) => {
    const val = value || "";
    setYamlContent(val);
    
    try {
      const parsed = parse(val);
      if (parsed && typeof parsed === "object") {
        setFormData(parsed);
      }
    } catch (e) {
      // Ignore parse errors while user is active typing
    }
  };

  // Convert Form Object to YAML when Form field changes
  const handleFormChange = (event: any) => {
    const newFormData = event.formData;
    setFormData(newFormData);
    try {
      const newYaml = stringify(newFormData);
      setYamlContent(newYaml);
    } catch (e) {
      console.error("Error stringifying form data:", e);
    }
  };

  // Save changes to disk
  const saveMutation = useMutation({
    mutationFn: () => saveFileContent(selectedProfile, activeFileType, yamlContent),
    onSuccess: (data) => {
      alert(`Saved successfully to ${data.filepath}`);
    },
    onError: (err: any) => {
      alert(`Error saving file: ${err.message}`);
    }
  });

  // Render PDF
  const renderMutation = useMutation({
    mutationFn: (content: string) => generatePDF(content),
    onSuccess: (blob) => setPdfBlob(blob),
    onError: (error: any) => {
      console.error(error);
      alert("Error generating PDF. Check console logs.");
    }
  });

  // SyncTeX Click Resolution
  const handlePdfClick = async (page: number, x: number, y: number) => {
    try {
      const result = await resolveSyncTex(page, x, y);
      const path = result.yaml_path;
      if (!path) return;

      if (activeTab === "code") {
        // Code view highlight
        if (editorRef.current) {
          const doc = parseDocument(yamlContent);
          const pathKeys = path.split(".");
          const node = doc.getIn(pathKeys, true);
          
          if (node && (node as any).range) {
            const charOffset = (node as any).range[0];
            const linesBefore = yamlContent.substring(0, charOffset).split("\n");
            const lineNumber = linesBefore.length;

            editorRef.current.revealLineInCenter(lineNumber);
            editorRef.current.setPosition({ lineNumber, column: 1 });
            editorRef.current.focus();
          }
        }
      } else {
        // Form view highlight and focus
        const elementId = `root_${path.replace(/\./g, "_")}`;
        const inputElement = document.getElementById(elementId);
        if (inputElement) {
          inputElement.scrollIntoView({ behavior: "smooth", block: "center" });
          inputElement.focus();
          
          // Flash highlight styling
          inputElement.classList.add("ring-4", "ring-orange-300", "transition-all");
          setTimeout(() => {
            inputElement.classList.remove("ring-4", "ring-orange-300");
          }, 1500);
        }
      }
    } catch (err) {
      console.warn("SyncTeX location could not be resolved:", err);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-white/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-[var(--accent)]" />
            <h1 className="font-semibold text-lg tracking-tight">{t("CVitae Tailor")}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            className="glass-panel px-4 py-2 text-sm font-medium hover:bg-white/80 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            {t("AI Tailor")}
          </button>
          <button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="glass-panel px-4 py-2 text-sm font-medium hover:bg-white/80 transition-colors flex items-center gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-gray-600" />}
            Save File
          </button>
          <button 
            onClick={() => renderMutation.mutate(yamlContent)}
            disabled={renderMutation.isPending}
            className="bg-[var(--accent)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {renderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {renderMutation.isPending ? t("Rendering") : t("Render PDF")}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <aside 
          className={`border-r border-[var(--border)] bg-white/80 backdrop-blur-md transition-all duration-300 flex flex-col ${
            sidebarOpen ? "w-64" : "w-0 overflow-hidden border-none"
          }`}
        >
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">CV Variants</h2>
            <div className="flex flex-col gap-1">
              {profiles.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedProfile(p)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedProfile === p 
                      ? "bg-orange-50 text-[var(--accent)]" 
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active Workspace Files</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveFileType("variant")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  activeFileType === "variant"
                    ? "border-[var(--accent)] bg-orange-50/50 text-[var(--accent)]"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Variant Overrides</div>
                <div className="text-xs text-gray-400 mt-0.5 font-normal">Manage CV summary, titles & role overrides</div>
              </button>

              <button
                onClick={() => setActiveFileType("selector")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  activeFileType === "selector"
                    ? "border-[var(--accent)] bg-orange-50/50 text-[var(--accent)]"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Selector File</div>
                <div className="text-xs text-gray-400 mt-0.5 font-normal">Choose which sections and job items to include</div>
              </button>

              <button
                onClick={() => setActiveFileType("general")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  activeFileType === "general"
                    ? "border-[var(--accent)] bg-orange-50/50 text-[var(--accent)]"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Base DB (general.yaml)</div>
                <div className="text-xs text-gray-400 mt-0.5 font-normal">View/Edit canonical database of experience</div>
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-[var(--border)] bg-gray-50">
            <div className="text-xs font-medium text-gray-400 uppercase">Editing file:</div>
            <div className="text-xs text-gray-600 font-mono mt-1 break-all bg-white p-2 rounded border border-gray-200">
              {filePath || "loading..."}
            </div>
          </div>
        </aside>

        {/* Dynamic Split Layout */}
        <main className="flex-1 overflow-hidden p-4">
          <PanelGroup direction="horizontal" className="h-full rounded-xl border border-[var(--border)] overflow-hidden shadow-sm bg-white">
            
            {/* Left Pane: Toggleable Editor */}
            <Panel defaultSize={50} minSize={30} className="flex flex-col h-full bg-[#fcfcfc]">
              {/* Tab Toggles */}
              <div className="px-4 py-2 border-b border-[var(--border)] bg-[#f5f4f1] flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("code")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                      activeTab === "code"
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    YAML Editor
                  </button>
                  <button
                    onClick={() => setActiveTab("form")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                      activeTab === "form"
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <FormIcon className="w-3.5 h-3.5" />
                    Visual Form
                  </button>
                </div>
                <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <span className="font-sans font-semibold text-gray-500 uppercase tracking-wider">{t("Variant Configuration")}</span>
                  <span className="text-gray-300">|</span>
                  <span>YAML Schema Validated</span>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === "code" ? (
                  <Editor
                    height="100%"
                    defaultLanguage="yaml"
                    value={yamlContent}
                    onChange={handleYamlChange}
                    onMount={handleEditorDidMount}
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
                ) : (
                  <div className="h-full w-full overflow-y-auto p-6 rjsf-beige-form">
                    {formSchema ? (
                      <RJSFForm
                        schema={formSchema}
                        validator={validator}
                        formData={formData}
                        onChange={handleFormChange}
                        children={true} // Removes standard submit button
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading form schema...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Panel>

            {/* Draggable Divider */}
            <PanelResizeHandle className="w-1 bg-[var(--border)] hover:bg-[var(--accent)] hover:w-1.5 transition-all cursor-col-resize active:bg-[var(--accent)]" />

            {/* Right Pane: Live PDF Preview */}
            <Panel defaultSize={50} minSize={30} className="flex flex-col h-full bg-gray-50/50 relative">
              <div className="px-4 py-2 border-b border-[var(--border)] bg-[#f5f4f1] flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("Live Preview")}</span>
                {pdfBlob && (
                  <button 
                    onClick={() => window.open(URL.createObjectURL(pdfBlob))}
                    className="text-gray-500 hover:text-[var(--accent)] transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 relative overflow-hidden">
                {pdfBlob ? (
                  <PDFViewer 
                    pdfBlob={pdfBlob} 
                    onPdfClick={handlePdfClick} 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 gap-3 h-full bg-[#e8e6e1] shadow-inner">
                    <FileText className="w-12 h-12 opacity-50" />
                    <p className="text-sm font-medium">{t("Click \"Render PDF\" to generate preview")}</p>
                  </div>
                )}
              </div>
            </Panel>

          </PanelGroup>
        </main>
      </div>
    </div>
  );
}
