"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, FileText, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface VariantControlsProps {
  profiles: string[];
  selectedProfile: string;
  activeFileType: string;
  isFormView: boolean;
  onSelectProfile: (profile: string) => void;
  onToggleFileType: () => void;
  onToggleViewType: (isForm: boolean) => void;
}

const toLabel = (p: string | undefined | null) =>
  (p || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function VariantControls({
  profiles,
  selectedProfile,
  activeFileType,
  isFormView,
  onSelectProfile,
  onToggleFileType,
  onToggleViewType
}: VariantControlsProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = profiles.filter(p => p.toLowerCase().includes(query.toLowerCase()));
  const isYamlTab = activeFileType === "variant" || activeFileType === "selector";

  return (
    <div className="flex items-center gap-3 pointer-events-auto">
      {/* Variant Dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          title={t("Choose a CV profile to edit; variants let you customize content and details for different job targets")}
          className="flex items-center justify-between gap-2 pl-3 pr-4 h-10 bg-white/50 hover:bg-white/70 active:bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] text-xs font-semibold text-gray-700 min-w-[150px]"
        >
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
            <span>{toLabel(selectedProfile)}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-gray-50">
              <div className="relative flex items-center bg-gray-50 rounded-lg px-2">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t("Search variants")}
                  className="flex-1 w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 rounded-lg outline-none text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-[var(--accent)]"
                  autoFocus
                />
              </div>
            </div>
            <div className="py-1 max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">{t("No variants found")}</p>
              ) : filtered.map(p => {
                const active = p === selectedProfile;
                return (
                  <button key={p} onClick={() => { onSelectProfile(p); setOpen(false); setQuery(""); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                      active ? "text-[var(--accent)] bg-orange-50/60 font-semibold" : "text-gray-700"
                    }`}>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{toLabel(p)}</span>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Switch Toggle (Variant vs Selector) */}
      {isYamlTab && (
        <button
          onClick={onToggleFileType}
          title={activeFileType === "variant" ? t("Edit the Selector file to include or exclude specific sections, skills, or items in this CV") : t("Edit the Variant file to customize the text, dates, and descriptions for this target profile")}
          className="flex items-center gap-2 px-4 h-10 bg-white/50 hover:bg-white/70 active:bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm text-xs font-semibold text-gray-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {activeFileType === "variant" ? (
            <>
              <FileText className="w-4 h-4 text-orange-500" />
              <span>{t("Show Selector")}</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-blue-500" />
              <span>{t("Show Variant")}</span>
            </>
          )}
        </button>
      )}

      {/* Code vs Form Toggle */}
      <div className="relative flex bg-white/30 p-1 h-10 rounded-2xl backdrop-blur-md border border-gray-200/50 select-none" title={t("Switch between raw YAML code editing and a visual form editor")}>
        {/* Sliding active indicator */}
        <div 
          className="absolute top-1 bottom-1 rounded-xl bg-[var(--accent)] shadow-sm transition-all duration-300 ease-in-out"
          style={{
            width: "56px",
            transform: `translateX(${isFormView ? "56px" : "0px"})`
          }}
        />
        <button onClick={() => onToggleViewType(false)}
          className={`relative z-10 px-3 h-full rounded-xl text-xs font-semibold transition-colors duration-200 ${
            !isFormView ? "text-white" : "text-gray-500 hover:text-gray-700"
          }`}>
          {t("YAML")}
        </button>
        <button onClick={() => onToggleViewType(true)}
          className={`relative z-10 px-3 h-full rounded-xl text-xs font-semibold transition-colors duration-200 ${
            isFormView ? "text-white" : "text-gray-500 hover:text-gray-700"
          }`}>
          {t("Form")}
        </button>
      </div>
    </div>
  );
}
