import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import { getEditorSchema } from "./editor-schemas";
import { parseYaml, parseYamlDocumentWithLines } from "./yaml";

const variantYaml = readFileSync(join(__dirname, "default-variant.yaml"), "utf8");
const selectorYaml = readFileSync(join(__dirname, "default-selector.yaml"), "utf8");

describe("default starter content", () => {
  it("parses the bundled variant YAML without syntax errors", () => {
    const { doc } = parseYamlDocumentWithLines(variantYaml);
    expect(doc.errors ?? []).toEqual([]);
  });

  it("parses the bundled selector YAML without syntax errors", () => {
    const { doc } = parseYamlDocumentWithLines(selectorYaml);
    expect(doc.errors ?? []).toEqual([]);
  });

  it("includes the fields required by the variant schema", () => {
    const parsed = parseYaml(variantYaml);

    expect(parsed.name).toBeTruthy();
    expect(Array.isArray(parsed.work_experience)).toBe(true);
    expect(Array.isArray(parsed.personal_projects)).toBe(true);
    expect(Array.isArray(parsed.education)).toBe(true);
    expect(parsed.skills).toBeTruthy();
    expect(parsed.languages).toBeTruthy();
    expect(Array.isArray(parsed.referees)).toBe(true);
  });

  it("includes selector-level selection mode and sections", () => {
    const parsed = parseYaml(selectorYaml);

    expect(parsed.__selection_type).toBe("include");
    expect(Array.isArray(parsed.sections)).toBe(true);
    expect(parsed.sections.some((section: { selector: string }) => section.selector === "work_experience")).toBe(true);
  });

  it("validates against the bundled variant schema", () => {
    const schema = getEditorSchema("variant", "en");
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const parsed = parseYaml(variantYaml);

    expect(validate(parsed), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it("validates the selector YAML against the bundled selector schema", () => {
    const schema = getEditorSchema("selector", "en");
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const parsed = parseYaml(selectorYaml);

    expect(validate(parsed), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });
});
