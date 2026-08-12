import selectorSchemaEn from "./schemas/en/selector.schema.json";
import variantSchemaEn from "./schemas/en/variant.schema.json";
import selectorSchemaFr from "./schemas/fr/selector.schema.json";
import variantSchemaFr from "./schemas/fr/variant.schema.json";

export type EditorSchemaKind = "selector" | "variant";

const SCHEMAS = {
  en: {
    selector: selectorSchemaEn,
    variant: variantSchemaEn,
  },
  fr: {
    selector: selectorSchemaFr,
    variant: variantSchemaFr,
  },
} as const;

export function getEditorSchema(type: EditorSchemaKind, locale: string = "en") {
  const localized = locale in SCHEMAS ? SCHEMAS[locale as keyof typeof SCHEMAS] : SCHEMAS.en;
  return localized[type];
}

/** Detect schemas from a stale backend that predates selector harmonization. */
export function isStaleSelectorSchema(schema: unknown): boolean {
  if (!schema || typeof schema !== "object") {
    return true;
  }

  const properties = (schema as { properties?: Record<string, unknown> }).properties ?? {};
  const sectionDef = (schema as { $defs?: { CVSectionConfig?: { properties?: Record<string, unknown> } } }).$defs
    ?.CVSectionConfig?.properties ?? {};

  return !("__selection_type" in properties) || !("selector" in sectionDef) || "type" in sectionDef;
}
