const STORAGE_KEY = "cvitae:guest-draft:v4";
const LEGACY_STORAGE_KEYS = [
  "cvitae:guest-draft",
  "cvitae:guest-draft:v2",
  "cvitae:guest-draft:v3",
] as const;

export interface GuestVariantSnapshot {
  variantContent: string;
  selectorContent: string;
  language: string;
}

export interface GuestDraft {
  activeVariantName: string;
  variants: Record<string, GuestVariantSnapshot>;
  updatedAt: string;
}

export type GuestDraftInput = Omit<GuestDraft, "updatedAt">;

export interface GuestDraftStarterDefaults {
  variantContent: string;
  selectorContent: string;
  language: string;
  variantName?: string;
}

/** Old bundled starter used a merged `sections:` layout — not a valid variant file. */
export function isLegacyGuestVariantYaml(content: string): boolean {
  if (!content.trim()) {
    return true;
  }

  return /\nsections:\s*\n/.test(content) || !/\nwork_experience:\s*\n/.test(content);
}

/**
 * Rejects selector files that use the old per-section `type` / `__selection_type` layout
 * or form-dumped null placeholders.
 */
export function isLegacyGuestSelectorYaml(content: string): boolean {
  if (!content.trim()) {
    return true;
  }

  if (/^\s+__selection_type:/m.test(content)) {
    return true;
  }

  if (/^\s+-\s+type:/m.test(content) || /^\s{4,}type:/m.test(content)) {
    return true;
  }

  if (/^\s+name:\s*null\s*$/m.test(content) || /^\s+items:\s*null\s*$/m.test(content)) {
    return true;
  }

  return false;
}

export function isValidGuestSelectorYaml(content: string): boolean {
  if (!content.trim()) {
    return false;
  }

  if (isLegacyGuestSelectorYaml(content)) {
    return false;
  }

  return /^__selection_type:\s/m.test(content) && /^sections:\s*$/m.test(content);
}

function isSupportedVariantSnapshot(snapshot: GuestVariantSnapshot): boolean {
  return !isLegacyGuestVariantYaml(snapshot.variantContent)
    && isValidGuestSelectorYaml(snapshot.selectorContent);
}

export function isSupportedGuestDraft(draft: GuestDraftInput): boolean {
  if (!draft.activeVariantName || !draft.variants[draft.activeVariantName]) {
    return false;
  }

  return Object.values(draft.variants).every(isSupportedVariantSnapshot);
}

export function sanitizeVariantName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 48);
}

export function createInitialGuestDraft(defaults: GuestDraftStarterDefaults): GuestDraftInput {
  const variantName = defaults.variantName ?? "general";

  return {
    activeVariantName: variantName,
    variants: {
      [variantName]: {
        variantContent: defaults.variantContent,
        selectorContent: defaults.selectorContent,
        language: defaults.language,
      },
    },
  };
}

export function getActiveVariantSnapshot(draft: GuestDraftInput): GuestVariantSnapshot {
  return draft.variants[draft.activeVariantName];
}

export function upsertActiveVariantSnapshot(
  draft: GuestDraftInput,
  update: Partial<GuestVariantSnapshot>,
): GuestDraftInput {
  const active = draft.activeVariantName;

  return {
    ...draft,
    variants: {
      ...draft.variants,
      [active]: {
        ...draft.variants[active],
        ...update,
      },
    },
  };
}

export function switchGuestVariant(draft: GuestDraftInput, variantName: string): GuestDraftInput | null {
  if (!draft.variants[variantName]) {
    return null;
  }

  return {
    ...draft,
    activeVariantName: variantName,
  };
}

export function resolveUniqueVariantName(draft: GuestDraftInput, preferredName: string): string {
  const base = sanitizeVariantName(preferredName) || `${draft.activeVariantName}_copy`;
  if (!draft.variants[base]) {
    return base;
  }

  let index = 2;
  while (draft.variants[`${base}_${index}`]) {
    index += 1;
  }

  return `${base}_${index}`;
}

export function duplicateGuestVariant(
  draft: GuestDraftInput,
  preferredName: string,
): GuestDraftInput | null {
  const newName = resolveUniqueVariantName(draft, preferredName);
  const source = draft.variants[draft.activeVariantName];

  return {
    activeVariantName: newName,
    variants: {
      ...draft.variants,
      [newName]: {
        variantContent: source.variantContent,
        selectorContent: source.selectorContent,
        language: source.language,
      },
    },
  };
}

function migrateLegacyV3Draft(parsed: Partial<GuestDraft> & {
  variantContent?: string;
  selectorContent?: string;
  language?: string;
}): GuestDraftInput | null {
  if (!parsed.variantContent || !parsed.selectorContent) {
    return null;
  }

  const snapshot: GuestVariantSnapshot = {
    variantContent: parsed.variantContent,
    selectorContent: parsed.selectorContent,
    language: parsed.language ?? "en",
  };

  if (!isSupportedVariantSnapshot(snapshot)) {
    return null;
  }

  return {
    activeVariantName: "general",
    variants: {
      general: snapshot,
    },
  };
}

export function loadGuestDraft(defaults: GuestDraftStarterDefaults): GuestDraft {
  const fallback = createInitialGuestDraft(defaults);

  if (typeof window === "undefined") {
    return { ...fallback, updatedAt: new Date(0).toISOString() };
  }

  try {
    const v4Raw = window.localStorage.getItem(STORAGE_KEY);
    if (v4Raw) {
      const parsed = JSON.parse(v4Raw) as Partial<GuestDraft>;
      const draft: GuestDraftInput = {
        activeVariantName: parsed.activeVariantName ?? fallback.activeVariantName,
        variants: parsed.variants ?? fallback.variants,
      };

      if (isSupportedGuestDraft(draft)) {
        const active = draft.activeVariantName;
        const snapshot = draft.variants[active];
        const normalized = snapshot
          ? { activeVariantName: active, variants: { [active]: snapshot } }
          : draft;

        return {
          ...normalized,
          updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
        };
      }

      window.localStorage.removeItem(STORAGE_KEY);
    }

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyRaw = window.localStorage.getItem(legacyKey);
      if (!legacyRaw) {
        continue;
      }

      const parsed = JSON.parse(legacyRaw) as Partial<GuestDraft> & {
        variantContent?: string;
        selectorContent?: string;
        language?: string;
      };
      const migrated = migrateLegacyV3Draft(parsed);

      if (migrated && isSupportedGuestDraft(migrated)) {
        return {
          ...migrated,
          updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
        };
      }
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(legacyKey);
  }

  return { ...fallback, updatedAt: new Date(0).toISOString() };
}

export function saveGuestDraft(draft: GuestDraftInput): GuestDraft {
  const next: GuestDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

export const guestDraftStorageKey = STORAGE_KEY;
