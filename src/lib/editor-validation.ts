import { findYamlNodeByPath, parseYamlDocumentWithLines } from "./yaml";

const ERROR_KEYWORD_REQUIRED = "required";
const ERROR_KEYWORD_TYPE = "type";
const ERROR_KEYWORD_ADDITIONAL_PROPERTIES = "additionalProperties";
const TYPE_STRING = "string";
const TYPE_INTEGER = "integer";
const TYPE_NUMBER = "number";
const TYPE_ARRAY = "array";
const TYPE_OBJECT = "object";
const DEFAULT_MARKER_LENGTH = 5;

export interface ValidationListItem {
  message: string;
  line: number;
  col?: number;
  path?: string;
}

export interface EditorValidationResult {
  markers: Array<{
    severity: number;
    message: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }>;
  errors: ValidationListItem[];
}

type Translator = (key: string) => string;

export function getFriendlyErrorMessage(error: any, t: Translator) {
  switch (error.keyword) {
    case ERROR_KEYWORD_REQUIRED:
      return t("Field required");
    case ERROR_KEYWORD_ADDITIONAL_PROPERTIES:
      return t("Unknown field");
    case ERROR_KEYWORD_TYPE:
      if (error.params.type === TYPE_STRING) return t("Input should be a valid string");
      if (error.params.type === TYPE_INTEGER || error.params.type === TYPE_NUMBER) return t("Input should be a valid integer");
      if (error.params.type === TYPE_ARRAY) return t("Input should be a valid list");
      if (error.params.type === TYPE_OBJECT) return t("Input should be a valid dictionary");
      return error.message;
    default:
      return error.message;
  }
}

function getSchemaErrorPathParts(error: any): string[] {
  const pathParts = error.instancePath.split("/").filter(Boolean);

  if (error.keyword === ERROR_KEYWORD_ADDITIONAL_PROPERTIES && error.params?.additionalProperty) {
    pathParts.push(String(error.params.additionalProperty));
  }

  return pathParts;
}

function resolveSchemaErrorPosition(
  error: any,
  doc: any,
  lineCounter: any,
): { line: number; col: number; length: number } {
  const pathParts = getSchemaErrorPathParts(error);
  const targetNode = findYamlNodeByPath(doc.contents, pathParts);

  if (!targetNode?.range) {
    return { line: 1, col: 1, length: DEFAULT_MARKER_LENGTH };
  }

  const startPos = lineCounter.linePos(targetNode.range[0]);
  const endPos = lineCounter.linePos(targetNode.range[1] - 1);

  return {
    line: startPos.line,
    col: startPos.col,
    length: Math.max(
      DEFAULT_MARKER_LENGTH,
      endPos.line === startPos.line
        ? Math.max(1, endPos.col - startPos.col)
        : targetNode.range[1] - targetNode.range[0],
    ),
  };
}

export function getLegacySelectorValidationErrors(
  yamlContent: string,
  markerSeverity: number,
  t: (key: string) => string,
): EditorValidationResult {
  const lines = yamlContent.split("\n");
  const errors: ValidationListItem[] = [];

  lines.forEach((line, index) => {
    if (/^\s+__selection_type:/.test(line)) {
      errors.push({
        message: t("Selection mode belongs at file root"),
        line: index + 1,
      });
    } else if (/^\s+-\s+type:/.test(line) || /^\s{4,}type:/.test(line)) {
      errors.push({
        message: t("Use selector instead of type for sections"),
        line: index + 1,
      });
    }
  });

  const markers = errors.map((error) => ({
    severity: markerSeverity,
    message: error.message,
    startLineNumber: error.line,
    startColumn: 1,
    endLineNumber: error.line,
    endColumn: 40,
  }));

  return { markers, errors };
}

export function validateYamlForEditor(
  yamlContent: string,
  validateFn: any,
  markerSeverity: number,
  t: Translator,
): EditorValidationResult {
  const { doc, lineCounter } = parseYamlDocumentWithLines(yamlContent);

  if (doc.errors?.length) {
    return {
      markers: doc.errors.map((error: any) => {
        const linePos = error.linePos || { line: 1, col: 1 };
        return {
          severity: markerSeverity,
          message: error.message,
          startLineNumber: linePos.line,
          startColumn: linePos.col,
          endLineNumber: linePos.line,
          endColumn: linePos.col + DEFAULT_MARKER_LENGTH,
        };
      }),
      errors: doc.errors.map((error: any) => ({
        message: error.message,
        line: error.linePos?.line || 1,
        col: error.linePos?.col || 1,
      })),
    };
  }

  if (!validateFn) {
    return { markers: [], errors: [] };
  }

  const parsed = doc.toJS() || {};
  const valid = validateFn(parsed);
  if (valid || !validateFn.errors) {
    return { markers: [], errors: [] };
  }

  const markers = validateFn.errors.map((error: any) => {
    const { line, col, length } = resolveSchemaErrorPosition(error, doc, lineCounter);

    return {
      severity: markerSeverity,
      message: getFriendlyErrorMessage(error, t),
      startLineNumber: line,
      startColumn: col,
      endLineNumber: line,
      endColumn: col + length,
    };
  });

  const errors = validateFn.errors.map((error: any) => {
    const { line } = resolveSchemaErrorPosition(error, doc, lineCounter);

    return {
      message: getFriendlyErrorMessage(error, t),
      path: error.instancePath,
      line,
    };
  });

  return { markers, errors };
}
