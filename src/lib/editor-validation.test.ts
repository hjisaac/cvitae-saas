import { describe, expect, it, vi } from "vitest";
import Ajv from "ajv";
import { getLegacySelectorValidationErrors, validateYamlForEditor } from "./editor-validation";

describe("validateYamlForEditor", () => {
  it("flags unknown fields when the schema forbids additional properties", () => {
    const schema = {
      type: "object",
      required: ["contact"],
      properties: {
        contact: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "value"],
            properties: {
              name: { type: "string" },
              value: { type: "string" },
            },
          },
        },
      },
    };

    const ajv = new Ajv({ allErrors: true, strict: false });
    const validateFn = ajv.compile(schema);
    const t = vi.fn((key: string) => key);

    const result = validateYamlForEditor(
      "contact:\n  - name: location\n    value: Cape Town\n    ieie: bad",
      validateFn,
      8,
      t,
    );

    expect(result.errors.some((error) => error.message === "Unknown field")).toBe(true);
    expect(result.errors[0]?.line).toBe(4);
    expect(t).toHaveBeenCalledWith("Unknown field");
  });

  it("flags legacy selector layout with per-section selection mode and type", () => {
    const t = vi.fn((key: string) => key);
    const yaml = `sections:
  - type: summary
    __selection_type: include
`;

    const result = getLegacySelectorValidationErrors(yaml, 8, t);

    expect(result.errors.some((error) => error.message === "Selection mode belongs at file root")).toBe(true);
    expect(result.errors.some((error) => error.message === "Use selector instead of type for sections")).toBe(true);
  });
});
