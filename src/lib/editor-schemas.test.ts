import { describe, expect, it } from "vitest";
import { getEditorSchema, isStaleSelectorSchema } from "./editor-schemas";

describe("editor schemas", () => {
  it("bundles the current selector schema shape", () => {
    const schema = getEditorSchema("selector", "en");

    expect(schema.properties).toHaveProperty("__selection_type");
    expect(schema.properties).toHaveProperty("sections");
    expect(schema.$defs.CVSectionConfig.properties).toHaveProperty("selector");
    expect(schema.$defs.CVSectionConfig.properties).not.toHaveProperty("type");
    expect(schema.$defs.CVSectionConfig.properties).not.toHaveProperty("__selection_type");
  });

  it("detects stale selector schemas from an old backend", () => {
    expect(isStaleSelectorSchema({
      properties: { locale: {}, labels: {}, sections: {} },
      $defs: {
        CVSectionConfig: {
          properties: { name: {}, type: {}, items: {}, __selection_type: {} },
        },
      },
    })).toBe(true);

    expect(isStaleSelectorSchema(getEditorSchema("selector", "en"))).toBe(false);
  });
});
