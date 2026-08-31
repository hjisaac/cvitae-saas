"use client";

import { useRef, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { ChevronDown, Check, CopyPlus, LogIn } from "lucide-react";
import { useTranslations } from "../i18n/use-translations";
import { sanitizeVariantName } from "../lib/guest-draft";

interface VariantComboboxProps {
  profiles: string[];
  selectedProfile: string;
  canCreateVariants: boolean;
  onSelectProfile: (profile: string) => void;
  onCreateFromCurrent: (name: string) => void;
  onOpenSignIn?: () => void;
}

const formatProfileNameToLabel = (profile: string | undefined | null) =>
  (profile || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function profileMatchesQuery(profile: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const label = formatProfileNameToLabel(profile).toLowerCase();
  return profile.toLowerCase().includes(normalizedQuery) || label.includes(normalizedQuery);
}

function GuestVariantCombobox({
  selectedProfile,
  onOpenSignIn,
}: {
  selectedProfile: string;
  onOpenSignIn?: () => void;
}) {
  const t = useTranslations();
  const variantTooltip = t(
    "Choose a CV profile to edit; variants let you customize content and details for different job targets",
  );

  return (
    <Popover className="relative w-[min(100%,13rem)]">
      <PopoverButton
        data-testid="variant-selector-trigger"
        title={variantTooltip}
        className="group flex h-10 w-full items-center gap-1 rounded-2xl border border-gray-200 bg-white/50 pl-3 pr-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-md transition-colors hover:bg-white/70 data-[open]:border-[var(--accent)]/40 data-[open]:ring-1 data-[open]:ring-[var(--accent)]/20"
      >
        <img src="/logo.png" alt="" className="h-4 w-4 shrink-0 object-contain" />
        <span className="min-w-0 flex-1 truncate text-left">
          {formatProfileNameToLabel(selectedProfile)}
        </span>
        <span
          data-testid="variant-selector-button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors group-data-[open]:text-gray-600 group-data-[open]:[&_svg]:rotate-180"
        >
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        </span>
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl backdrop-blur-xl [--anchor-gap:0.5rem]"
      >
        <div
          data-testid="variant-option-general"
          className="flex items-center justify-between rounded-lg bg-orange-50/60 px-3 py-2 text-[var(--accent)]"
        >
          <span className="truncate text-xs font-semibold">
            {formatProfileNameToLabel(selectedProfile)}
          </span>
          <Check className="h-3.5 w-3.5 shrink-0" />
        </div>

        <div className="mt-2 border-t border-gray-100 pt-2">
          <p className="px-1 pb-2 text-xs leading-relaxed text-gray-600">
            {t("Sign in to manage multiple CV variants")}
          </p>
          <button
            type="button"
            data-testid="variant-sign-in-button"
            onClick={onOpenSignIn}
            title={t("Sign in")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <LogIn className="h-3.5 w-3.5" />
            {t("Sign in")}
          </button>
        </div>
      </PopoverPanel>
    </Popover>
  );
}

export function VariantCombobox({
  profiles,
  selectedProfile,
  canCreateVariants,
  onSelectProfile,
  onCreateFromCurrent,
  onOpenSignIn,
}: VariantComboboxProps) {
  const [query, setQuery] = useState("");
  const [newVariantName, setNewVariantName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const filtered = profiles.filter((profile) => profileMatchesQuery(profile, query));
  const defaultDuplicateName = `${selectedProfile}_copy`;
  const variantTooltip = t(
    "Choose a CV profile to edit; variants let you customize content and details for different job targets",
  );

  const resetCreateForm = () => {
    setCreateError(null);
    setNewVariantName("");
  };

  const handleCreate = () => {
    if (!canCreateVariants) {
      return;
    }

    const sanitized =
      sanitizeVariantName(newVariantName) || sanitizeVariantName(defaultDuplicateName);

    if (!sanitized) {
      setCreateError(t("Variant name is required"));
      return;
    }

    if (profiles.includes(sanitized)) {
      setCreateError(t("Variant already exists"));
      return;
    }

    onCreateFromCurrent(sanitized);
    resetCreateForm();
    setQuery("");
    inputRef.current?.blur();
  };

  if (!canCreateVariants) {
    return <GuestVariantCombobox selectedProfile={selectedProfile} onOpenSignIn={onOpenSignIn} />;
  }

  return (
    <Combobox
      immediate
      value={selectedProfile}
      onChange={(value) => {
        if (value) {
          onSelectProfile(value);
        }
      }}
      onClose={() => {
        setQuery("");
        resetCreateForm();
      }}
    >
      <div className="relative w-[min(100%,13rem)]">
        <div
          className="flex h-10 items-center gap-1 rounded-2xl border border-gray-200 bg-white/50 pl-3 pr-1 shadow-sm backdrop-blur-md transition-colors hover:bg-white/70"
          title={variantTooltip}
          data-testid="variant-selector-trigger"
        >
          <img src="/logo.png" alt="" className="h-4 w-4 shrink-0 object-contain" />
          <ComboboxInput
            ref={inputRef}
            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-gray-700 outline-none placeholder:text-gray-400"
            displayValue={(profile: string) => formatProfileNameToLabel(profile)}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search variants")}
            aria-label={t("Choose a CV document to edit")}
          />
          <ComboboxButton
            data-testid="variant-selector-button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/80 hover:text-gray-600 data-[open]:text-gray-600 data-[open]:[&_svg]:rotate-180"
            aria-label={t("Open variant list")}
            title={t("Open variant list")}
          >
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          anchor="bottom start"
          className="z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white/95 shadow-xl backdrop-blur-xl [--anchor-gap:0.5rem]"
        >
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">{t("No variants found")}</div>
            ) : (
              filtered.map((profile) => (
                <ComboboxOption
                  key={profile}
                  value={profile}
                  data-testid={`variant-option-${profile}`}
                  className="flex cursor-pointer items-center justify-between px-3 py-2 text-left text-gray-700 transition-colors data-[focus]:bg-gray-50 data-[selected]:font-semibold data-[selected]:text-[var(--accent)]"
                >
                  <span className="truncate text-xs font-medium">
                    {formatProfileNameToLabel(profile)}
                  </span>
                  {profile === selectedProfile && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                  )}
                </ComboboxOption>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50/80 p-2">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {t("Create new from current")}
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newVariantName}
                onChange={(event) => {
                  setNewVariantName(event.target.value);
                  setCreateError(null);
                }}
                placeholder={defaultDuplicateName}
                data-testid="new-variant-name-input"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[var(--accent)]"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleCreate();
                  }
                }}
              />
              <button
                type="button"
                data-testid="create-variant-button"
                aria-label={t("Create new from current")}
                title={t("Create new from current")}
                onClick={handleCreate}
                className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                <CopyPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("Create")}</span>
              </button>
            </div>
            {createError && (
              <p className="mt-1.5 px-1 text-[11px] text-red-600" data-testid="create-variant-error">
                {createError}
              </p>
            )}
          </div>
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
