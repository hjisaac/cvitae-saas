"use client";

import { LogIn, X } from "lucide-react";
import { useTranslations } from "../i18n/use-translations";
import { SignInOAuthButtons } from "./SignInOAuthButtons";

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SignInDialog({ open, onClose }: SignInDialogProps) {
  const t = useTranslations();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        data-testid="sign-in-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-dialog-title"
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 id="sign-in-dialog-title" className="text-sm font-semibold text-gray-900">
                {t("Sign in")}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t("Sign in to manage multiple CV variants")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close")}
            title={t("Close")}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <SignInOAuthButtons />
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            data-testid="sign-in-dialog-close"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
