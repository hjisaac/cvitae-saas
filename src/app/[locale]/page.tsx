"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { FileText, Play, Loader2, Eye, AlertCircle, X } from "lucide-react";
import { useLocale } from "../../i18n/use-locale";
import { useTranslations } from "../../i18n/use-translations";
import { useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Ajv from "ajv";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import {
  createVariant,
  generatePDF,
  getVariant,
  listVariants,
  resolveSyncTex,
  translateDocument,
  type TranslationReviewPayload,
  type VariantDetail,
  type VariantSummary,
} from "../../lib/api";
import { getEditorSchema } from "../../lib/editor-schemas";
import { DEFAULT_SELECTOR_YAML, DEFAULT_VARIANT_YAML } from "../../lib/default-starter-content";
import {
  duplicateGuestVariant,
  isLegacyGuestSelectorYaml,
  loadGuestDraft,
  saveGuestDraft,
  switchGuestVariant,
  upsertActiveVariantSnapshot,
  type GuestDraft,
  type GuestDraftInput,
} from "../../lib/guest-draft";
import { extractPageLineCount, projectPdfClickToYamlLine } from "../../lib/synctex-projection";
import { captureError } from "../../lib/error";
import { getLegacySelectorValidationErrors, validateYamlForEditor } from "../../lib/editor-validation";
import { parseYaml, stringifyYaml } from "../../lib/yaml";
import { BASE_PROFILE } from "../../lib/constants";
import { useSession } from "../../lib/use-session";

// Isolated UI components
import { SettingsDialog } from "../../components/SettingsDialog";
import { SignInDialog } from "../../components/SignInDialog";
import { TranslationReviewDialog } from "../../components/TranslationReviewDialog";
import { UserMenu } from "../../components/UserMenu";
import { VariantControls } from "../../components/VariantControls";
import { DraggableAIBox } from "../../components/DraggableAIBox";

const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

const ajv = new Ajv({ allErrors: true, strict: false });

const GUEST_MIGRATED_KEY = "cvitae_guest_migrated";

type EditorFileKind = "variant" | "selector";

// Main Page

export default function Home() {

  const t = useTranslations();
  const locale = useLocale();

  const [activeVariantDetail, setActiveVariantDetail] = useState<VariantDetail | null>(null);
  const [guestDraft, setGuestDraft] = useState<GuestDraft | null>(null);
  const [activeFileType, setActiveFileType] = useState<EditorFileKind>("variant");
  const [yamlContent, setYamlContent] = useState<string>("");
  const [monacoInstance, setMonacoInstance] = useState<any>(null);
  const [variantSchema, setVariantSchema] = useState<any>(null);
  const [selectorSchema, setSelectorSchema] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [validationPanelOpen, setValidationPanelOpen] = useState<boolean>(true);
  const [isFormView, setIsFormView] = useState<boolean>(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("#D86F45");
  const [aiAlwaysExpanded, setAiAlwaysExpanded] = useState(false);
  const [documentLanguage, setDocumentLanguage] = useState<"en" | "fr">(locale === "fr" ? "fr" : "en");
  const [translationReview, setTranslationReview] = useState<TranslationReviewPayload | null>(null);
  const [translationReviewOpen, setTranslationReviewOpen] = useState(false);
  const [accountVariants, setAccountVariants] = useState<VariantSummary[]>([]);

  const editorRef = useRef<any>(null);
  const migratedGuestRef = useRef(false);

  // Sync accent colour to CSS var
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
    document.documentElement.style.setProperty("--accent-hover", accentColor);
  }, [accentColor]);

  const handleToggleFileType = () => {
    setActiveFileType(prev => prev === "variant" ? "selector" : "variant");
  };

  const { session, isAuthenticated, loading: sessionLoading, refresh: refreshSession } = useSession();

  const canCreateVariants = isAuthenticated;
  const selectedVariantName = isAuthenticated
    ? activeVariantDetail?.name ?? BASE_PROFILE
    : guestDraft?.activeVariantName ?? BASE_PROFILE;
  const profileOptions = isAuthenticated
    ? accountVariants.map((variant) => variant.name).sort()
    : guestDraft
      ? Object.keys(guestDraft.variants).sort()
      : [BASE_PROFILE];

  const persistEditorToDraft = (
    draft: GuestDraftInput,
    content: string,
    fileType: EditorFileKind,
  ): GuestDraftInput =>
    upsertActiveVariantSnapshot(
      draft,
      fileType === "variant"
        ? { variantContent: content }
        : { selectorContent: content },
    );

  const buildGuestVariantDetail = (draft: GuestDraft, variantName: string): VariantDetail => {
    const snapshot = draft.variants[variantName];

    return {
      id: `guest-${variantName}`,
      name: variantName,
      template_id: null,
      language: snapshot.language,
      content: snapshot.variantContent,
      created_at: draft.updatedAt,
      updated_at: draft.updatedAt,
      selector: {
        id: `guest-selector-${variantName}`,
        variant_id: `guest-${variantName}`,
        content: snapshot.selectorContent,
        created_at: draft.updatedAt,
        updated_at: draft.updatedAt,
      },
    };
  };

  useEffect(() => {
    setGuestDraft(loadGuestDraft({
      variantContent: DEFAULT_VARIANT_YAML,
      selectorContent: DEFAULT_SELECTOR_YAML,
      language: locale === "fr" ? "fr" : "en",
    }));
  }, [locale]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (!authError) return;

    const messages: Record<string, string> = {
      oauth_not_configured: t("Google sign-in is not configured on this server."),
      invalid_oauth_state: t("Sign-in expired. Please try again."),
      oauth_failed: t("Google sign-in failed. Please try again."),
    };
    setErrorMsg(messages[authError] ?? t("Sign-in failed. Please try again."));

    const url = new URL(window.location.href);
    url.searchParams.delete("auth_error");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAccountVariants([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const summaries = await listVariants();
        if (cancelled) return;
        setAccountVariants(summaries);

        const preferred = summaries.find((variant) => variant.name === "general") ?? summaries[0];
        if (!preferred) return;

        const detail = await getVariant(preferred.id);
        if (!cancelled) {
          setActiveVariantDetail(detail);
        }
      } catch (error) {
        console.error("Failed to load account variants:", error);
        captureError(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, sessionLoading]);

  useEffect(() => {
    if (!isAuthenticated || sessionLoading || !guestDraft || migratedGuestRef.current) {
      return;
    }

    if (typeof window !== "undefined" && window.localStorage.getItem(GUEST_MIGRATED_KEY)) {
      migratedGuestRef.current = true;
      return;
    }

    migratedGuestRef.current = true;
    const snapshot = guestDraft.variants[guestDraft.activeVariantName];
    if (!snapshot) return;

    (async () => {
      try {
        const importedName = `imported-${guestDraft.activeVariantName}`;
        const detail = await createVariant({
          name: importedName,
          content: snapshot.variantContent,
          selector_content: snapshot.selectorContent,
          language: snapshot.language,
        });
        const summaries = await listVariants();
        setAccountVariants(summaries);
        setActiveVariantDetail(detail);
        window.localStorage.setItem(GUEST_MIGRATED_KEY, "1");
      } catch (error) {
        console.error("Guest draft migration failed:", error);
      }
    })();
  }, [isAuthenticated, sessionLoading, guestDraft]);

  useEffect(() => {
    if (isAuthenticated || !guestDraft) return;
    setActiveVariantDetail(buildGuestVariantDetail(guestDraft, guestDraft.activeVariantName));
  }, [guestDraft, isAuthenticated]);

  const handleSelectProfile = async (profileName: string) => {
    if (isAuthenticated) {
      const summary = accountVariants.find((variant) => variant.name === profileName);
      if (!summary) return;

      try {
        const detail = await getVariant(summary.id);
        setActiveVariantDetail(detail);
      } catch (error) {
        console.error("Failed to load variant:", error);
        captureError(error);
      }
      return;
    }

    setGuestDraft((current) => {
      if (!current || profileName === current.activeVariantName) {
        return current;
      }

      const withEditor = persistEditorToDraft(current, yamlContent, activeFileType);
      const switched = switchGuestVariant(withEditor, profileName);
      return switched ? saveGuestDraft(switched) : current;
    });
  };

  const handleCreateFromCurrent = async (name: string) => {
    if (!canCreateVariants) {
      return;
    }

    if (isAuthenticated && activeVariantDetail) {
      try {
        const content =
          activeFileType === "variant" ? yamlContent : activeVariantDetail.content;
        const selectorContent =
          activeFileType === "selector" ? yamlContent : activeVariantDetail.selector.content;

        const detail = await createVariant({
          name,
          content,
          selector_content: selectorContent,
          source_variant_id: activeVariantDetail.id,
          language: activeVariantDetail.language,
        });
        const summaries = await listVariants();
        setAccountVariants(summaries);
        setActiveVariantDetail(detail);
      } catch (error) {
        console.error("Failed to create variant:", error);
        captureError(error);
        setErrorMsg(t("Failed to create variant. Please try again."));
      }
      return;
    }

    setGuestDraft((current) => {
      if (!current) {
        return current;
      }

      const withEditor = persistEditorToDraft(current, yamlContent, activeFileType);
      const duplicated = duplicateGuestVariant(withEditor, name);
      return duplicated ? saveGuestDraft(duplicated) : current;
    });
  };

  useEffect(() => {
    if (!activeVariantDetail) {
      setYamlContent("");
      return;
    }

    setYamlContent(
      activeFileType === "variant"
        ? activeVariantDetail.content
        : activeVariantDetail.selector.content,
    );
  }, [activeFileType, activeVariantDetail]);

  const handleEditorDidMount = (ed: any, monaco: any) => { 
    editorRef.current = ed; 
    setMonacoInstance(monaco);
  };

  const activeSchema = activeFileType === "variant" ? variantSchema : selectorSchema;

  const validateFn = useMemo(() => {
    if (!activeSchema) return null;
    try {
      return ajv.compile(activeSchema);
    } catch (err) {
      console.error("Failed to compile schema validator:", err);
      return null;
    }
  }, [activeSchema]);

  // Load bundled editor schemas (kept in sync with core-engine via src/lib/schemas/*).
  useEffect(() => {
    setVariantSchema(getEditorSchema("variant", locale));
    setSelectorSchema(getEditorSchema("selector", locale));
  }, [locale]);

  // Live YAML Validation & Monaco Markers mapping
  useEffect(() => {
    if (!monacoInstance || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    if (!yamlContent) {
      monacoInstance.editor.setModelMarkers(model, "owner", []);
      setValidationErrors([]);
      return;
    }

    try {
      if (activeFileType === "selector" && isLegacyGuestSelectorYaml(yamlContent)) {
        const legacyResult = getLegacySelectorValidationErrors(
          yamlContent,
          monacoInstance.MarkerSeverity.Error,
          t,
        );
        monacoInstance.editor.setModelMarkers(model, "owner", legacyResult.markers);
        setValidationErrors(legacyResult.errors);
        return;
      }

      if (!activeSchema) return;

      const result = validateYamlForEditor(
        yamlContent,
        validateFn,
        monacoInstance.MarkerSeverity.Error,
        t,
      );
      monacoInstance.editor.setModelMarkers(model, "owner", result.markers);
      setValidationErrors(result.errors);
    } catch (e: any) {
      console.error("Validation loop encountered an error:", e);
    }
  }, [yamlContent, validateFn, monacoInstance, t, activeSchema, activeFileType]);

  const handleJumpToErrorLine = (lineNumber: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  };

  const handleFormChange = (formData: any) => {
    try {
      const newYaml = stringifyYaml(formData);
      handleYamlChange(newYaml);
    } catch (e) {
      console.error("Failed to stringify form change:", e);
    }
  };
  
  const handleYamlChange = (v: string | undefined) => {
    const content = v || "";
    setYamlContent(content);

    if (!isAuthenticated) {
      setGuestDraft((current) => {
        if (!current) return current;

        return saveGuestDraft(
          persistEditorToDraft(current, content, activeFileType),
        );
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      await refreshSession();
      setAccountVariants([]);
      setActiveVariantDetail(null);
      setGuestDraft(loadGuestDraft({
        variantContent: DEFAULT_VARIANT_YAML,
        selectorContent: DEFAULT_SELECTOR_YAML,
        language: locale === "fr" ? "fr" : "en",
      }));
    } catch (error) {
      console.error("Sign out failed:", error);
      captureError(error);
    }
  };

  const renderMutation = useMutation({
    mutationFn: (content: string) => generatePDF(content),
    onSuccess: blob => { setErrorMsg(null); setPdfBlob(blob); },
    onError: (error: any) => {
      console.error("Render failed:", error);
      captureError(error);
      setErrorMsg(t("The server encountered a problem compiling your PDF. Please try again later."));
    },
  });

  const translateMutation = useMutation({
    mutationFn: () => {
      if (!activeVariantDetail) {
        throw new Error("No active variant to translate.");
      }
      return translateDocument(
        activeVariantDetail.content,
        activeVariantDetail.selector.content,
        activeVariantDetail.language,
        documentLanguage,
      );
    },
    onSuccess: (review) => {
      setTranslationReview(review);
      setTranslationReviewOpen(true);
      setErrorMsg(null);
    },
    onError: (error: any) => {
      console.error("Translation failed:", error);
      captureError(error);
      setErrorMsg(t("The server encountered a problem translating your CV. Please try again later."));
    },
  });

  const handleApplyTranslation = () => {
    if (!translationReview) return;

    setGuestDraft((current) => {
      if (!current) return current;

      return saveGuestDraft(
        upsertActiveVariantSnapshot(current, {
          language: translationReview.target_language,
          variantContent: translationReview.variant.translated,
          selectorContent: translationReview.selector.translated,
        }),
      );
    });

    setYamlContent(activeFileType === "variant"
      ? translationReview.variant.translated
      : translationReview.selector.translated);
    setTranslationReviewOpen(false);
  };

  const handleDownloadTranslation = () => {
    if (!translationReview) return;

    const blob = new Blob([JSON.stringify(translationReview, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedVariantName}-${translationReview.target_language}-translation.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

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

  let parsedYamlJson: any = null;
  let yamlSyntaxError: string | null = null;
  try {
    if (yamlContent) {
      parsedYamlJson = parseYaml(yamlContent) || {};
    }
  } catch (e: any) {
    yamlSyntaxError = e.message;
  }

  return (
    <div className="h-screen w-full relative bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden">
      <h1 className="sr-only">{t("CVitae Tailor")}</h1>
      
      {/* ═══════════════════════ WORKSPACE (Background) ════════════════════ */}
      <div className="absolute inset-0 z-0">
        <PanelGroup direction="horizontal" className="h-full">

          <Panel defaultSize={55} minSize={30} className="flex flex-col h-full relative">
            <span className="sr-only">{t("Variant Configuration")}</span>
            <div className="flex-1 relative bg-white min-h-0 flex flex-col">
               <div className="flex-1 min-h-0 relative">
                  {!isFormView ? (
                    <Editor
                      height="100%"
                      defaultLanguage="yaml"
                      language="yaml"
                      value={yamlContent}
                      onChange={handleYamlChange}
                      onMount={handleEditorDidMount}
                      theme="light"
                      options={{ minimap: { enabled: false }, fontSize: 13, lineHeight: 24, padding: { top: 80 }, scrollBeyondLastLine: false, smoothScrolling: true, cursorBlinking: "smooth" }}
                    />
                  ) : (
                    <div className="h-full w-full overflow-y-auto bg-gray-50 rjsf-form-container pt-20">
                      {yamlSyntaxError ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2 p-6">
                          <AlertCircle className="w-8 h-8 shrink-0" />
                          <p className="text-sm font-semibold">{t("YAML Syntax Error")}</p>
                          <p className="text-xs text-gray-500 text-center max-w-md">{yamlSyntaxError}</p>
                          <button 
                            onClick={() => setIsFormView(false)}
                            className="mt-3 px-4 py-2 bg-[var(--accent)] text-white text-xs font-semibold rounded-lg shadow"
                          >
                            {t("Switch to Code View")}
                          </button>
                        </div>
                      ) : activeSchema ? (
                        <Form
                          schema={activeSchema}
                          validator={validator}
                          formData={parsedYamlJson}
                          onChange={(e) => handleFormChange(e.formData)}
                          children={<></>}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                          {t("Loading form schema...")}
                        </div>
                      )}
                    </div>
                  )}
               </div>

               {/* Collapsible Bottom Validation Panel */}
               {!isFormView && validationErrors.length > 0 && (
                 <div
                   data-testid="validation-panel"
                   className="border-t border-gray-200 bg-white z-10 flex flex-col shadow-inner select-none"
                 >
                   <div 
                     onClick={() => setValidationPanelOpen(!validationPanelOpen)}
                     className="flex items-center justify-between px-4 py-2 bg-red-50/60 cursor-pointer border-b border-red-100/50 hover:bg-red-50 transition-colors"
                   >
                     <div className="flex items-center gap-2 text-red-700">
                       <AlertCircle className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase tracking-wider">
                         {t("Validation Errors")} (<span data-testid="validation-error-count">{validationErrors.length}</span>)
                       </span>
                     </div>
                     <span className="text-[11px] font-semibold text-red-600">
                       {validationPanelOpen ? t("Hide") : t("Show")}
                     </span>
                   </div>
                   
                   {validationPanelOpen && (
                     <div className="max-h-36 overflow-y-auto px-4 py-2 flex flex-col gap-1">
                       {validationErrors.map((err, idx) => (
                         <div 
                           key={idx}
                           data-testid="validation-error-item"
                           data-line={err.line}
                           onClick={() => handleJumpToErrorLine(err.line)}
                           className="py-1 text-xs text-gray-700 hover:text-red-600 cursor-pointer flex justify-between items-start gap-4 transition-colors group"
                         >
                           <span className="flex-1 font-medium">{err.message}</span>
                           <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono group-hover:bg-red-50 group-hover:text-red-500 transition-colors shrink-0">
                             {t("Line {line}", { line: err.line })}
                           </span>
                         </div>
                       ))}
                     </div>
                   )}
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
            profiles={profileOptions} 
            selectedProfile={selectedVariantName}
            canCreateVariants={canCreateVariants}
            activeFileType={activeFileType}
            isFormView={isFormView}
            onSelectProfile={handleSelectProfile}
            onCreateFromCurrent={handleCreateFromCurrent}
            onOpenSignIn={() => setSignInOpen(true)}
            onToggleFileType={handleToggleFileType}
            onToggleViewType={setIsFormView}
          />
        </div>

        {/* Center: Empty Space */}
        <div className="flex-1"></div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3 pb-3 pointer-events-auto">
          <label
            className="flex items-center gap-2 px-3 h-10 rounded-2xl bg-white/50 backdrop-blur-md border border-gray-200 text-xs font-semibold text-gray-700"
            title={t("Choose the language used for CV labels and PDF output")}
          >
            <span>{t("Language")}</span>
            <select
              value={documentLanguage}
              onChange={(e) => setDocumentLanguage(e.target.value as "en" | "fr")}
              className="bg-transparent outline-none text-xs font-semibold"
              aria-label={t("Choose the language used for CV labels and PDF output")}
            >
              <option value="en">{t("English")}</option>
              <option value="fr">{t("French")}</option>
            </select>
          </label>

          <button
            onClick={() => translateMutation.mutate()}
            disabled={translateMutation.isPending || !activeVariantDetail}
            title={t("Translate the CV content into the selected target language")}
            className="h-10 flex items-center gap-2 bg-white/70 text-gray-700 px-4 rounded-2xl text-sm font-semibold hover:bg-white transition-colors shadow-sm border border-gray-200 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {translateMutation.isPending ? t("Rendering") : t("Translate CV")}
          </button>

          <button
            onClick={() => renderMutation.mutate(yamlContent)}
            disabled={renderMutation.isPending || !yamlContent}
            title={t("Compile the LaTeX template with your configurations to preview the generated PDF")}
            className="h-10 flex items-center gap-2 bg-[var(--accent)] text-white px-5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
          >
            {renderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {renderMutation.isPending ? t("Rendering") : t("Render PDF")}
          </button>

          <UserMenu
            session={session}
            onOpenSettings={() => setSettingsOpen(true)}
            onSignIn={() => setSignInOpen(true)}
            onSignOut={handleSignOut}
          />
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
            <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">{t("System Alert")}</span>
            <span className="text-xs leading-normal font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700 transition-colors shrink-0 ml-3" aria-label={t("Close")}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════ SETTINGS DIALOG ═══════════════════════════ */}
      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        accentColor={accentColor}
        onAccentChange={setAccentColor}
        aiAlwaysExpanded={aiAlwaysExpanded}
        onAiAlwaysExpandedChange={setAiAlwaysExpanded}
      />

      <TranslationReviewDialog
        open={translationReviewOpen}
        review={translationReview}
        onClose={() => setTranslationReviewOpen(false)}
        onApply={handleApplyTranslation}
        onDownload={handleDownloadTranslation}
      />
    </div>
  );
}
