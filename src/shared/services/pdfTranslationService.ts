/**
 * PDF Translation Service
 *
 * Extracts text from a PDF page using pdfjs-dist's getTextContent() API,
 * groups the raw text items into logical paragraphs using Y-proximity
 * heuristics, and translates them via Chrome's built-in Translator API
 * (Chrome 138+) with a transparent fallback to the backend SSE endpoint.
 */

import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, fetchPublic } from './api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NormalizedBBox {
  /** Left edge as fraction of page width (0–1). */
  left: number;
  /** Top edge as fraction of page height (0–1), measured from top of page. */
  top: number;
  /** Width as fraction of page width (0–1). */
  width: number;
  /** Height as fraction of page height (0–1). */
  height: number;
  /** Font size as fraction of page height — used to size overlay text. */
  fontSize: number;
}

export interface RawParagraph {
  text: string;
  bbox: NormalizedBBox;
}

export interface TranslatedParagraph {
  originalText: string;
  translatedText: string;
  bbox: NormalizedBBox;
}

// ---------------------------------------------------------------------------
// Text extraction + paragraph grouping
// ---------------------------------------------------------------------------

interface RawTextItem {
  str: string;
  transform: number[];
  width: number;
  hasEOL?: boolean;
}

/**
 * Extract logical paragraphs from a pdfjs PDFPageProxy.
 *
 * Algorithm:
 *   1. Call page.getTextContent() to get raw TextItem[].
 *   2. Sort items top-to-bottom (pdfjs Y-axis is bottom-up, so sort by Y desc).
 *   3. Group items with |yDiff| < fontSize * 0.5 into the same "line".
 *   4. Group consecutive lines with yGap < lineHeight * 1.6 into the same "paragraph".
 *   5. Compute a normalized bounding box for each paragraph.
 *
 * The returned bboxes use CSS coordinates: origin at top-left of page,
 * values are fractions of page dimensions so they work directly as percentages
 * on an overlay div that covers the page canvas.
 */
export async function extractPageParagraphs(pageProxy: any): Promise<RawParagraph[]> {
  const viewport = pageProxy.getViewport({ scale: 1 });
  const pageWidth: number = viewport.width;
  const pageHeight: number = viewport.height;

  const content = await pageProxy.getTextContent();
  const rawItems: RawTextItem[] = (content.items as any[]).filter(
    (item) => typeof item.str === 'string' && item.str.trim().length > 0,
  );

  if (rawItems.length === 0) return [];

  // Sort by Y descending (top of page first in visual terms), then X ascending
  const sorted = [...rawItems].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > 0.5) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  // --- Step 1: group into lines (items with very close Y values) ---
  const lines: RawTextItem[][] = [];
  let currentLine: RawTextItem[] = [];

  for (const item of sorted) {
    const fontSize = getFontSize(item);
    if (currentLine.length === 0) {
      currentLine.push(item);
    } else {
      const lastY = currentLine[currentLine.length - 1].transform[5];
      const currentY = item.transform[5];
      if (Math.abs(currentY - lastY) < fontSize * 0.6) {
        currentLine.push(item);
      } else {
        lines.push(currentLine);
        currentLine = [item];
      }
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);

  // --- Step 2: group lines into paragraphs ---
  const paragraphGroups: RawTextItem[][][] = [];
  let currentParagraph: RawTextItem[][] = [];

  for (let i = 0; i < lines.length; i++) {
    if (currentParagraph.length === 0) {
      currentParagraph.push(lines[i]);
    } else {
      const prevLine = currentParagraph[currentParagraph.length - 1];
      // Bottom of previous line (in pdfjs Y-up coordinates)
      const prevLineBottom = Math.min(...prevLine.map((it) => it.transform[5]));
      // Top of current line
      const currentLineTop = Math.max(
        ...lines[i].map((it) => it.transform[5] + getFontSize(it)),
      );
      const prevFontSize = getFontSize(prevLine[0]);
      const lineHeight = prevFontSize * 1.5;

      if (prevLineBottom - currentLineTop > lineHeight * 1.6) {
        // Large gap → new paragraph
        paragraphGroups.push(currentParagraph);
        currentParagraph = [lines[i]];
      } else {
        currentParagraph.push(lines[i]);
      }
    }
  }
  if (currentParagraph.length > 0) paragraphGroups.push(currentParagraph);

  // --- Step 3: convert to RawParagraph[] ---
  const results: RawParagraph[] = [];

  for (const paragraphLines of paragraphGroups) {
    const allItems = paragraphLines.flat();
    const text = allItems
      .map((it) => it.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length < 3) continue;

    // Bounding box in pdfjs user space (Y-up, origin at bottom-left)
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    let representativeFontSize = 12;

    for (const item of allItems) {
      const x = item.transform[4];
      const y = item.transform[5];
      const fs = getFontSize(item);
      const w = item.width > 0 ? item.width : fs * item.str.length * 0.55;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + w);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + fs);
      representativeFontSize = fs;
    }

    // Convert to CSS space: (top-left origin, Y down), normalized 0-1
    const bbox: NormalizedBBox = {
      left: Math.max(0, minX / pageWidth),
      top: Math.max(0, (pageHeight - maxY) / pageHeight),
      width: Math.min(1, (maxX - minX) / pageWidth),
      height: Math.min(1, (maxY - minY) / pageHeight),
      fontSize: representativeFontSize / pageHeight,
    };

    results.push({ text, bbox });
  }

  return results;
}

function getFontSize(item: RawTextItem): number {
  return Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------

/**
 * Translate all paragraphs on a page to the target language.
 *
 * Strategy:
 *   1. Try window.Translator (Chrome 138+ built-in) — no bridge needed since
 *      the web app runs in the main browser world.
 *      All paragraphs are translated concurrently via Promise.all() — no global
 *      timeout that could abort a long page mid-way. Cancellation is handled
 *      by the AbortSignal passed in from the hook.
 *   2. On any failure or unavailability → fall back to the backend SSE endpoint.
 */
export async function translateParagraphs(
  paragraphs: RawParagraph[],
  targetLangCode: string,
  accessToken: string | null,
  signal?: AbortSignal,
): Promise<TranslatedParagraph[]> {
  if (paragraphs.length === 0) return [];

  // Detect source language from a sample of the text
  const sampleText = paragraphs
    .slice(0, 3)
    .map((p) => p.text)
    .join(' ')
    .slice(0, 200);
  const sourceLang = await detectSourceLanguage(sampleText);

  // Try Chrome built-in Translator first
  const chromeTranslator = (window as any).Translator;
  if (chromeTranslator && typeof chromeTranslator.availability === 'function') {
    try {
      const availability = await Promise.race([
        chromeTranslator.availability({
          sourceLanguage: sourceLang,
          targetLanguage: targetLangCode.toLowerCase(),
        }),
        new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 3_000)),
      ]);

      if (availability !== 'unavailable' && availability !== 'timeout') {
        const translator = await chromeTranslator.create({
          sourceLanguage: sourceLang,
          targetLanguage: targetLangCode.toLowerCase(),
        });

        // Translate all paragraphs concurrently — no global timeout so long
        // pages aren't cut short. The AbortSignal handles user cancellation.
        const translated = await Promise.all(
          paragraphs.map(async (p) => {
            if (signal?.aborted) throw new Error('aborted');
            const translatedText: string = await translator.translate(p.text);
            return { originalText: p.text, translatedText, bbox: p.bbox };
          }),
        );

        return translated;
      }
    } catch {
      // Fall through to backend
    }
  }

  return translateViaBackend(paragraphs, targetLangCode, accessToken, signal);
}

async function detectSourceLanguage(sampleText: string): Promise<string> {
  // Try <html lang> first
  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.length >= 2) {
    return htmlLang.toLowerCase().slice(0, 2);
  }

  // Try Chrome LanguageDetector if available
  const detector = (window as any).LanguageDetector;
  if (detector && typeof detector.create === 'function' && sampleText.length > 10) {
    try {
      const instance = await detector.create();
      const results = await instance.detect(sampleText);
      if (results?.[0]?.detectedLanguage) {
        return results[0].detectedLanguage.toLowerCase().slice(0, 2);
      }
    } catch {
      // Ignore
    }
  }

  return 'en';
}

const TRANSLATION_BATCH_SIZE = 5;

/**
 * Translate all paragraphs via the backend SSE endpoint, chunked into
 * batches of TRANSLATION_BATCH_SIZE to prevent timeouts on large pages.
 */
async function translateViaBackend(
  paragraphs: RawParagraph[],
  targetLangCode: string,
  accessToken: string | null,
  signal?: AbortSignal,
): Promise<TranslatedParagraph[]> {
  const results: TranslatedParagraph[] = [];

  for (let i = 0; i < paragraphs.length; i += TRANSLATION_BATCH_SIZE) {
    if (signal?.aborted) break;
    const batch = paragraphs.slice(i, i + TRANSLATION_BATCH_SIZE);
    // Re-index IDs within each batch so they are always para_0..para_N
    const batchResults = await translateSingleBatchViaBackend(
      batch,
      targetLangCode,
      accessToken,
      signal,
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Send one SSE request for a single batch of paragraphs (≤ TRANSLATION_BATCH_SIZE).
 */
async function translateSingleBatchViaBackend(
  paragraphs: RawParagraph[],
  targetLangCode: string,
  accessToken: string | null,
  signal?: AbortSignal,
): Promise<TranslatedParagraph[]> {
  const texts = paragraphs.map((p, i) => ({ id: `para_${i}`, text: p.text }));
  const translationMap = new Map<string, string>();

  const url = `${authConfig.catenBaseUrl}/api/v2/translate`;
  const body = JSON.stringify({
    targetLangugeCode: targetLangCode,
    texts,
  });

  const fetchFn = accessToken ? fetchWithAuth : fetchPublic;
  const response = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Translation request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body from translation endpoint');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') {
        return paragraphs.map((p, i) => ({
          originalText: p.text,
          translatedText: translationMap.get(`para_${i}`) ?? p.text,
          bbox: p.bbox,
        }));
      }

      try {
        const event = JSON.parse(data);
        if (event.id && event.translatedText) {
          translationMap.set(event.id, event.translatedText);
        }
      } catch {
        // Malformed SSE line — skip
      }
    }
  }

  // Stream ended without [DONE]
  return paragraphs.map((p, i) => ({
    originalText: p.text,
    translatedText: translationMap.get(`para_${i}`) ?? p.text,
    bbox: p.bbox,
  }));
}
