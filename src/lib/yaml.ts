import YAML, { parse as yamlParse, stringify as yamlStringify, parseDocument as yamlParseDocument, ScalarTag } from "yaml";

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

const yamlFormatOptions = {
  ...yamlOptions,
  indent: 2,
  lineWidth: 4096,
  defaultKeyType: "PLAIN" as const,
  defaultStringType: "QUOTE_DOUBLE" as const,
  defaultCollectionStyle: "block" as const,
  flowCollectionPadding: false,
};

function stripNullish(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map(stripNullish)
      .filter((item) => item !== undefined);
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      const cleaned = stripNullish(nested);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result;
  }

  return value;
}

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
 * Safely stringify object to YAML using block-style collections (ruamel-compatible layout).
 */
export function stringifyYaml(data: any): string {
  if (!data) return "";
  const cleaned = stripNullish(data);
  return yamlStringify(cleaned, yamlFormatOptions);
}

/**
 * Parse YAML document for CST/AST node lookups (e.g. SyncTeX line location).
 */
export function parseYamlDocument(content: string) {
  return yamlParseDocument(content, yamlOptions);
}

/**
 * Parse a YAML document with line counting enabled for editor diagnostics.
 */
export function parseYamlDocumentWithLines(content: string) {
  const lineCounter = new YAML.LineCounter();
  const doc = yamlParseDocument(content, { ...yamlOptions, lineCounter });
  return { doc, lineCounter };
}

/**
 * Resolve a YAML node by JSON pointer path segments.
 */
export function findYamlNodeByPath(node: any, path: string[]): any {
  let current = node;

  for (const part of path) {
    if (!current) return null;

    if (current.type === "MAP" || current.items?.[0]?.key !== undefined) {
      const pair = current.items?.find((item: any) => {
        const key = item.key?.value ?? item.key;
        return String(key) === String(part);
      });
      current = pair?.value ?? null;
      continue;
    }

    if (current.type === "SEQ" || Array.isArray(current.items)) {
      const index = Number.parseInt(part, 10);
      if (!Number.isNaN(index) && current.items?.[index]) {
        current = current.items[index];
        continue;
      }
    }

    return null;
  }

  return current;
}
