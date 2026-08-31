"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "../i18n/use-translations";
import { VariantCombobox } from "./VariantCombobox";

interface VariantControlsProps {
  profiles: string[];
  selectedProfile: string;
  canCreateVariants: boolean;
  activeFileType: string;
  isFormView: boolean;
  onSelectProfile: (profile: string) => void;
  onCreateFromCurrent: (name: string) => void;
  onOpenSignIn?: () => void;
  onToggleFileType: () => void;
  onToggleViewType: (isForm: boolean) => void;
}

export function VariantControls({
  profiles,
  selectedProfile,
  canCreateVariants,
  activeFileType,
  isFormView,
  onSelectProfile,
  onCreateFromCurrent,
  onOpenSignIn,
  onToggleFileType,
  onToggleViewType,
}: VariantControlsProps) {
  const t = useTranslations();
  const isYamlTab = activeFileType === "variant" || activeFileType === "selector";

  return (
    <div className="pointer-events-auto flex items-center gap-3">
      <VariantCombobox
        profiles={profiles}
        selectedProfile={selectedProfile}
        canCreateVariants={canCreateVariants}
        onSelectProfile={onSelectProfile}
        onCreateFromCurrent={onCreateFromCurrent}
        onOpenSignIn={onOpenSignIn}
      />

      {isYamlTab && (
        <button
          type="button"
          data-testid="file-type-toggle"
          onClick={onToggleFileType}
          title={
            activeFileType === "variant"
              ? t("Edit the Variant file to customize the text, dates, and descriptions for this target profile")
              : t("Edit the Selector file to include or exclude specific sections, skills, or items in this CV")
          }
          className="flex h-10 items-center gap-2 rounded-2xl border border-gray-200 bg-white/50 px-4 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/70 active:bg-white/80 hover:scale-[1.01] active:scale-[0.99]"
        >
          {activeFileType === "variant" ? (
            <>
              <FileText className="h-4 w-4 text-orange-500" />
              <span>{t("Show Sections")}</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 text-blue-500" />
              <span>{t("Show Content")}</span>
            </>
          )}
        </button>
      )}

      <div
        className="relative flex h-10 select-none rounded-2xl border border-gray-200/50 bg-white/30 p-1 backdrop-blur-md"
        title={t("Switch between raw YAML code editing and a visual form editor")}
      >
        <div
          className="absolute top-1 bottom-1 rounded-xl bg-[var(--accent)] shadow-sm transition-all duration-300 ease-in-out"
          style={{
            width: "56px",
            transform: `translateX(${isFormView ? "56px" : "0px"})`,
          }}
        />
        <button
          type="button"
          onClick={() => onToggleViewType(false)}
          className={`relative z-10 h-full rounded-xl px-3 text-xs font-semibold transition-colors duration-200 ${
            !isFormView ? "text-white" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t("YAML")}
        </button>
        <button
          type="button"
          onClick={() => onToggleViewType(true)}
          className={`relative z-10 h-full rounded-xl px-3 text-xs font-semibold transition-colors duration-200 ${
            isFormView ? "text-white" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t("Form")}
        </button>
      </div>
    </div>
  );
}
