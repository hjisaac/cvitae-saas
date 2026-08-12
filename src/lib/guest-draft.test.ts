import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  duplicateGuestVariant,
  isLegacyGuestSelectorYaml,
  isLegacyGuestVariantYaml,
  isSupportedGuestDraft,
  isValidGuestSelectorYaml,
  resolveUniqueVariantName,
  sanitizeVariantName,
} from "./guest-draft";

const variantYaml = readFileSync(join(__dirname, "default-variant.yaml"), "utf8");
const selectorYaml = readFileSync(join(__dirname, "default-selector.yaml"), "utf8");

const LEGACY_VARIANT_YAML = `name: Example
sections:
  - name: Work Experience
    type: work_experience
    entries: []
`;

const LEGACY_SELECTOR_YAML = `locale: en
sections:
  - name: null
    type: summary
    items: null
    __selection_type: include
  - name: null
    type: work_experience
    items:
      - instadeep
    __selection_type: include
`;

describe("guest draft compatibility", () => {
  it("rejects the old merged sections-based variant layout", () => {
    expect(isLegacyGuestVariantYaml(LEGACY_VARIANT_YAML)).toBe(true);
  });

  it("accepts the current variant starter content", () => {
    expect(isLegacyGuestVariantYaml(variantYaml)).toBe(false);
  });

  it("rejects selector files with per-section __selection_type or type", () => {
    expect(isLegacyGuestSelectorYaml(LEGACY_SELECTOR_YAML)).toBe(true);
    expect(isValidGuestSelectorYaml(LEGACY_SELECTOR_YAML)).toBe(false);
  });

  it("accepts the current selector starter content", () => {
    expect(isLegacyGuestSelectorYaml(selectorYaml)).toBe(false);
    expect(isValidGuestSelectorYaml(selectorYaml)).toBe(true);
  });

  it("supports the bundled default guest draft", () => {
    expect(isSupportedGuestDraft({
      activeVariantName: "general",
      variants: {
        general: {
          variantContent: variantYaml,
          selectorContent: selectorYaml,
          language: "en",
        },
      },
    })).toBe(true);
  });

  it("sanitizes variant names for storage keys", () => {
    expect(sanitizeVariantName("Agentic AI Intern")).toBe("agentic_ai_intern");
  });

  it("duplicates the active variant under a unique name", () => {
    const draft = {
      activeVariantName: "general",
      variants: {
        general: {
          variantContent: variantYaml,
          selectorContent: selectorYaml,
          language: "en",
        },
      },
    };

    const duplicated = duplicateGuestVariant(draft, "general_copy");
    expect(duplicated?.activeVariantName).toBe("general_copy");
    expect(duplicated?.variants.general_copy.variantContent).toBe(variantYaml);
    expect(resolveUniqueVariantName(draft, "general")).toBe("general_2");
  });
});
