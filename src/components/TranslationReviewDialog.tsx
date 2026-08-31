"use client";

import { Download, Languages, X } from "lucide-react";
import { useTranslations } from "../i18n/use-translations";
import type { TranslationReviewPayload } from "../lib/api";

interface TranslationReviewDialogProps {
  open: boolean;
  review: TranslationReviewPayload | null;
  onClose: () => void;
  onApply: () => void;
  onDownload: () => void;
}

export function TranslationReviewDialog({
  open,
  review,
  onClose,
  onApply,
  onDownload,
}: TranslationReviewDialogProps) {
  const t = useTranslations();

  if (!open || !review) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
              <Languages className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{t("Review Translation")}</h2>
              <p className="text-xs text-gray-500">
                {t("Target language")}: {review.target_language.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close")}
            title={t("Close")}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6 overflow-y-auto">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("Translated Variant")}</h3>
            <textarea
              readOnly
              value={review.variant.translated}
              className="w-full min-h-[260px] rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs font-mono text-gray-700 resize-y"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("Translated Selector")}</h3>
            <textarea
              readOnly
              value={review.selector.translated}
              className="w-full min-h-[260px] rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs font-mono text-gray-700 resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/70">
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("Download translated document")}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {t("Cancel")}
            </button>
            <button
              onClick={onApply}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              {t("Use translation")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
