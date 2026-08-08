"use client";

import { X, Palette, CreditCard, Check, Zap, Crown } from "lucide-react";

// ─── Accent colour presets ───────────────────────────────────────────────────
export const ACCENT_PRESETS = [
  { color: "#D86F45", label: "Terracotta" },
  { color: "#4F7CBA", label: "Slate Blue" },
  { color: "#6B8F5E", label: "Sage" },
  { color: "#8B5E9E", label: "Mauve" },
  { color: "#C0874A", label: "Amber" },
  { color: "#4A8B7F", label: "Teal" },
  { color: "#B5485A", label: "Crimson" },
  { color: "#2C7A7B", label: "Cyan" },
];

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  accentColor: string;
  onAccentChange: (color: string) => void;
}

export function SettingsDialog({
  open,
  onClose,
  accentColor,
  onAccentChange,
}: SettingsDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "85vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Settings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage your preferences and subscription</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Appearance ───────────────────────────────────────────── */}
            <section className="px-6 py-5 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Appearance</h3>
              </div>

              <div className="mb-1">
                <p className="text-xs font-medium text-gray-500 mb-3">Accent colour</p>
                <div className="grid grid-cols-4 gap-2">
                  {ACCENT_PRESETS.map(({ color, label }) => {
                    const isActive = accentColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => onAccentChange(color)}
                        className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all duration-150 ${
                          isActive
                            ? "border-[var(--accent)] bg-orange-50/50 shadow-sm"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                        style={isActive ? { borderColor: color } : {}}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium text-gray-600 truncate">{label}</span>
                        {isActive && (
                          <Check
                            className="w-3.5 h-3.5 ml-auto flex-shrink-0"
                            style={{ color }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Subscription ─────────────────────────────────────────── */}
            <section className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Subscription</h3>
              </div>

              {/* Current plan */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Free Plan</p>
                      <p className="text-[11px] text-gray-400">3 CV variants · PDF export · Community templates</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                </div>
              </div>

              {/* Pro plan */}
              <div
                className="rounded-xl border-2 p-4 relative overflow-hidden"
                style={{ borderColor: accentColor, background: `${accentColor}08` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Crown className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Pro Plan</p>
                      <p className="text-[11px] text-gray-500">Unlimited variants · AI Tailor · Priority support</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-800">$9<span className="text-xs font-normal text-gray-400">/mo</span></span>
                    <button
                      className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
                      style={{ backgroundColor: accentColor }}
                    >
                      Upgrade
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
                    <li key={f} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <Check className="w-3 h-3 flex-shrink-0" style={{ color: accentColor }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
