"use client";

import { X, Palette, Languages, Sparkles, CreditCard, Zap, Crown, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { ACCENT_PRESETS, LOCALE_TABS } from "../lib/constants";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  accentColor: string;
  onAccentChange: (color: string) => void;
  aiAlwaysExpanded: boolean;
  onAiAlwaysExpandedChange: (expanded: boolean) => void;
  activeFileType: string;
  onOpenLanguage: (locale: string) => void;
}

export function SettingsDialog({
  open,
  onClose,
  accentColor,
  onAccentChange,
  aiAlwaysExpanded,
  onAiAlwaysExpandedChange,
  activeFileType,
  onOpenLanguage
}: SettingsDialogProps) {
  const t = useTranslations();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "80vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{t("Settings")}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{t("Preferences & subscription")}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">

          {/* Appearance & AI */}
          <div className="px-6 py-5 border-b border-gray-50 flex flex-col gap-6">
            
            {/* Accent Color */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">{t("Appearance")}</span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">{t("Accent colour")}</p>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_PRESETS.map(({ color, label }) => {
                  const active = accentColor === color;
                  return (
                    <button key={color} onClick={() => onAccentChange(color)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${
                        active ? "shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                      style={active ? { borderColor: color, background: `${color}12` } : {}}>
                      <span className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: color }} />
                      <span className="text-[11px] font-medium text-gray-600 truncate">{label}</span>
                      {active && <Check className="w-3 h-3 ml-auto flex-shrink-0" style={{ color }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Translations */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Languages className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">{t("Translations")}</span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">{t("Edit language files for the CV")}</p>
              <div className="relative flex bg-gray-100/80 p-1 h-10 rounded-2xl border border-gray-200/50 w-full select-none">
                {/* Sliding active indicator */}
                <div 
                  className="absolute top-1 bottom-1 rounded-xl bg-[var(--accent)] shadow-sm transition-all duration-300 ease-in-out"
                  style={{
                    width: "calc(50% - 4px)",
                    left: activeFileType === "locale_fr" ? "calc(50% + 2px)" : "2px"
                  }}
                />
                {LOCALE_TABS.map(l => {
                  const active = activeFileType === l.key;
                  return (
                    <button key={l.key} onClick={() => { onOpenLanguage(l.key); onClose(); }}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-3 h-full rounded-xl text-xs font-semibold transition-colors duration-200 ${
                        active ? "text-white" : "text-gray-500 hover:text-gray-700"
                      }`}>
                      {l.label} ({l.title.split(' ')[0]})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Preferences */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">{t("AI Assistant")}</span>
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-medium text-gray-700">{t("Always expanded")}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{t("Keep the AI box fully open by default")}</p>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${aiAlwaysExpanded ? "bg-[var(--accent)]" : "bg-gray-200"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${aiAlwaysExpanded ? "translate-x-4 shadow-sm" : "translate-x-0.5"}`} />
                </div>
                {/* visually hidden checkbox */}
                <input type="checkbox" className="sr-only" checked={aiAlwaysExpanded} onChange={e => onAiAlwaysExpandedChange(e.target.checked)} />
              </label>
            </div>
            
          </div>

          {/* Subscription */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">{t("Subscription")}</span>
            </div>
            {/* Free Plan */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{t("Free Plan")}</p>
                    <p className="text-[10px] text-gray-400">{t("3 variants · PDF export")}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{t("Current")}</span>
              </div>
            </div>
            {/* Pro Plan */}
            <div className="rounded-xl border-2 p-4" style={{ borderColor: accentColor, background: `${accentColor}08` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}>
                    <Crown className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{t("Pro Plan")}</p>
                    <p className="text-[10px] text-gray-500">{t("Unlimited variants · AI Tailor")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-800">$9<span className="text-[10px] font-normal text-gray-400">/{t("mo")}</span></span>
                  <button className="text-[11px] font-semibold text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: accentColor }}>
                    {t("Upgrade")}
                  </button>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {[
                  "Unlimited CV variants",
                  "AI-powered CV tailoring",
                  "All language translations",
                  "Priority PDF rendering",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: accentColor }} />
                    {t(f)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
