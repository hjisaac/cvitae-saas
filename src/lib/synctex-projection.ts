/**
 * SyncTeX Line Projection & Inference Utility
 * 
 * Provides stateless, scale-independent line projection from PDF page click coordinates
 * to the corresponding line in the source YAML editor.
 */

// ============================================================================
// CONSTANTS (No Magic Numbers)
// ============================================================================

/** Baseline grouping tolerance in PDF points (1/72 inch) */
export const BASELINE_TOLERANCE_PTS = 2.0;

/** Default Letter paper height in PDF points (11 inches * 72 pt/in) */
export const DEFAULT_LETTER_PAGE_HEIGHT_PTS = 792.0;

/** Index of Y-translation coordinate in PDF.js 2D transform matrix [a, b, c, d, e, f] */
export const PDF_TRANSFORM_Y_INDEX = 5;

/** 1-based initial line number for text editors */
export const FIRST_LINE_INDEX = 1;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ProjectionParams {
  /** 1-based page number clicked by the user */
  clickedPage: number;
  /** Vertical click position fraction on target page (0.0 at top, 1.0 at bottom) */
  yFraction: number;
  /** Array of text line counts for each PDF page [page1Lines, page2Lines, ...] */
  pageLineCounts: number[];
  /** Total number of lines in the source YAML document */
  totalYamlLines: number;
}

export interface SyncTexResolveResult {
  targetLine: number;
  confidence: number;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Calculates the number of distinct text baselines for a single PDF page
 * using PDF.js `getTextContent()` transformation matrices.
 */
export async function extractPageLineCount(pdfPage: any): Promise<number> {
  try {
    const textContent = await pdfPage.getTextContent();
    const uniqueYPositions = new Set<number>();

    for (const item of textContent.items) {
      if (item && item.str && item.str.trim().length > 0 && Array.isArray(item.transform)) {
        const rawY = item.transform[PDF_TRANSFORM_Y_INDEX];
        if (typeof rawY === "number" && !isNaN(rawY)) {
          // Group Y-coordinates within tolerance to account for font baselines
          const roundedY = Math.round(rawY / BASELINE_TOLERANCE_PTS) * BASELINE_TOLERANCE_PTS;
          uniqueYPositions.add(roundedY);
        }
      }
    }

    return uniqueYPositions.size > 0 ? uniqueYPositions.size : 1;
  } catch (error) {
    console.warn("Failed to extract PDF page line count via PDF.js API:", error);
    return 1;
  }
}

/**
 * Projects a double-click position (page + yFraction) to the target YAML line number.
 * 
 * Formula:
 *   Total PDF Lines = Sum(N_i for all pages)
 *   Clicked PDF Line = Sum(N_i for pages < clickedPage) + (yFraction * N_clickedPage)
 *   Target YAML Line = Math.round((Clicked PDF Line / Total PDF Lines) * Total YAML Lines)
 */
export function projectPdfClickToYamlLine(params: ProjectionParams): SyncTexResolveResult {
  const { clickedPage, yFraction, pageLineCounts, totalYamlLines } = params;

  if (totalYamlLines <= 0 || pageLineCounts.length === 0) {
    return { targetLine: FIRST_LINE_INDEX, confidence: 0.0 };
  }

  // 1. Calculate total PDF lines across all pages
  const totalPdfLines = pageLineCounts.reduce((acc, count) => acc + count, 0);
  if (totalPdfLines <= 0) {
    return { targetLine: FIRST_LINE_INDEX, confidence: 0.0 };
  }

  // 2. Sum full line counts for all pages prior to the clicked page
  let priorPdfLines = 0;
  const targetPageIndex = Math.max(0, Math.min(clickedPage - 1, pageLineCounts.length - 1));

  for (let i = 0; i < targetPageIndex; i++) {
    priorPdfLines += pageLineCounts[i];
  }

  // 3. Add fractional line offset on the clicked page
  const currentPageLines = pageLineCounts[targetPageIndex] || 1;
  const currentFractionalLines = Math.max(0.0, Math.min(1.0, yFraction)) * currentPageLines;
  const clickedPdfLineIndex = priorPdfLines + currentFractionalLines;

  // 4. Map ratio to target YAML line number
  const lineRatio = clickedPdfLineIndex / totalPdfLines;
  const rawTargetLine = Math.round(lineRatio * totalYamlLines);
  const targetLine = Math.max(FIRST_LINE_INDEX, Math.min(rawTargetLine, totalYamlLines));

  return {
    targetLine,
    confidence: 0.95,
  };
}
