"use client";

import { useState, useEffect, useRef } from "react";
import { User, LogOut, LogIn } from "lucide-react";
import { useTranslations } from "../i18n/use-translations";
import type { AuthSession } from "../lib/auth/types";

interface UserMenuProps {
  session: AuthSession | null;
  onOpenSettings: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function UserMenu({ session, onOpenSettings, onSignIn, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const user = session?.user;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) {
    return (
      <button
        data-testid="user-menu-sign-in"
        onClick={onSignIn}
        title={t("Sign in")}
        className="h-10 flex items-center gap-2 bg-white/70 text-gray-700 px-4 rounded-2xl text-sm font-semibold hover:bg-white transition-colors shadow-sm border border-gray-200"
      >
        <LogIn className="w-4 h-4" />
        {t("Sign in")}
      </button>
    );
  }

  const initials = initialsFromName(user.name);

  return (
    <div ref={ref} className="relative pointer-events-auto">
      <button
        data-testid="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        title={t("Open user settings and account menu")}
        className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg border-2 border-white/50 overflow-hidden"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          data-testid="user-menu-dropdown"
          role="menu"
          className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="p-1">
            <button
              data-testid="user-menu-profile-settings"
              role="menuitem"
              onClick={() => { onOpenSettings(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <User className="w-3.5 h-3.5 text-gray-400" />
              {t("Profile settings")}
            </button>
            <button
              data-testid="user-menu-sign-out"
              role="menuitem"
              onClick={() => { onSignOut(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t("Log out")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
