/**
 * Utilities for extracting surrounding context from PDF text layers,
 * used to build the `text` field for the /api/v2/simplify request.
 *
 * Ported from the extension's extractSurroundingContextForText(), adapted
 * for the react-pdf text layer structure.
 */

import { normalisePdfText } from './pdfTextNormalise';

const CONTEXT_WORDS = 15;

/**
 * Given the text container element of a PDF page and the selected text anchors,
 * return the concatenated string: [15 words before] + [selected text] + [15 words after].
 *
 * Falls back to just the selected text if the page text layer is unavailable.
 */
export function extractSurroundingContext(
  selectedText: string,
  startText: string,
  endText: string,
  pageContainerEl: HTMLElement | null,
): string {
  if (!pageContainerEl) return selectedText;

  const textContainer = pageContainerEl.querySelector('.react-pdf__Page__textContent');
  if (!textContainer) return selectedText;

  const spans = Array.from(
    textContainer.querySelectorAll('span[role="presentation"], span'),
  ).filter((s) => s.textContent && s.textContent.trim().length > 0) as HTMLElement[];

  if (spans.length === 0) return selectedText;

  // Build full concatenated text from spans
  let fullText = '';
  for (const span of spans) {
    fullText += span.textContent ?? '';
  }

  const normFull = normalisePdfText(fullText);
  const normStart = normalisePdfText(startText);
  const normEnd = normalisePdfText(endText || startText);

  if (!normStart) return selectedText;

  // Find the selection start in the normalised full text
  const startIdx = normFull.indexOf(normStart);
  if (startIdx === -1) return selectedText;

  // Find the selection end
  const endSearchStart = startIdx + normStart.length - normEnd.length;
  let endIdxEnd = normFull.indexOf(normEnd, Math.max(startIdx, endSearchStart)) + normEnd.length;
  if (endIdxEnd < startIdx) endIdxEnd = startIdx + normStart.length;

  // Extract surrounding words
  const textBefore = normFull.slice(0, startIdx);
  const textAfter = normFull.slice(endIdxEnd);

  const wordsBefore = textBefore.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordsAfter = textAfter.trim().split(/\s+/).filter((w) => w.length > 0);

  const contextBefore = wordsBefore.slice(-CONTEXT_WORDS).join(' ');
  const contextAfter = wordsAfter.slice(0, CONTEXT_WORDS).join(' ');

  return [contextBefore, selectedText, contextAfter].filter(Boolean).join(' ');
}

/**
 * Compute the character start index of the selected text within the full
 * page text, for the textStartIndex field of the SimplifyRequest.
 * Returns 0 if the page container is unavailable.
 */
export function computeTextStartIndex(
  startText: string,
  pageContainerEl: HTMLElement | null,
): number {
  if (!pageContainerEl) return 0;

  const textContainer = pageContainerEl.querySelector('.react-pdf__Page__textContent');
  if (!textContainer) return 0;

  const spans = Array.from(
    textContainer.querySelectorAll('span[role="presentation"], span'),
  ).filter((s) => s.textContent && s.textContent.trim().length > 0) as HTMLElement[];

  let fullText = '';
  for (const span of spans) {
    fullText += span.textContent ?? '';
  }

  const normFull = normalisePdfText(fullText);
  const normStart = normalisePdfText(startText);
  const idx = normFull.indexOf(normStart);
  return idx === -1 ? 0 : idx;
}
