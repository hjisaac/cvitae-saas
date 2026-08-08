"use client";

import { useState, useEffect, useRef } from "react";
import { User, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

interface UserMenuProps {
  onOpenSettings: () => void;
}

export function UserMenu({ onOpenSettings }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative pointer-events-auto">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg border-2 border-white/50"
        title={t("Open user settings and account menu")}
      >
        U
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-1">
            <button
              onClick={() => { onOpenSettings(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <User className="w-3.5 h-3.5 text-gray-400" />
              {t("Profile settings")}
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors text-left">
              <LogOut className="w-3.5 h-3.5" />
              {t("Log out")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
