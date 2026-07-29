import { parse as yamlParse, stringify as yamlStringify, parseDocument as yamlParseDocument, ScalarTag } from "yaml";

// Custom YAML tag definition for translation tag "!t"
export const tTag: ScalarTag = {
  tag: "!t",
  default: false,
  resolve(value: string) {
    return value;
  },
};

export const yamlOptions = {
  customTags: [tTag],
};

/**
 * Safely parse YAML string with custom tag support (!t).
 */
export function parseYaml(content: string): any {
  if (!content) return {};
  try {
    return yamlParse(content, yamlOptions);
  } catch (error) {
    console.warn("YAML parse warning/error:", error);
    return yamlParse(content);
  }
}

/**
 * Safely stringify object to YAML.
 */
export function stringifyYaml(data: any): string {
  if (!data) return "";
  return yamlStringify(data, yamlOptions);
}

/**
 * Parse YAML document for CST/AST node lookups (e.g. SyncTeX line location).
 */
export function parseYamlDocument(content: string) {
  return yamlParseDocument(content, yamlOptions);
}
