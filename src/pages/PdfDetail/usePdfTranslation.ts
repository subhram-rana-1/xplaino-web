import { useState, useEffect, useRef, useCallback } from 'react';
import {
  extractPageParagraphs,
  translateParagraphs,
  type TranslatedParagraph,
} from '@/shared/services/pdfTranslationService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageTranslationState =
  | { status: 'idle' }
  | { status: 'translating' }
  | { status: 'translated'; paragraphs: TranslatedParagraph[] }
  | { status: 'error'; message: string };

export type PageTranslations = Record<number, PageTranslationState>;

interface UsePdfTranslationParams {
  pdfDoc: any | null;
  numPages: number | null;
  targetLanguage: string | null;
  accessToken: string | null;
  /** Scroll container for the IntersectionObserver root (the .mainArea div). */
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

interface UsePdfTranslationResult {
  pageTranslations: PageTranslations;
  resetTranslation: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * usePdfTranslation
 *
 * Manages on-demand per-page PDF translation.
 *
 * - When targetLanguage is set, attaches an IntersectionObserver to all page refs.
 * - When a page enters the viewport, translates it plus the next 2 pages.
 * - Translation is skipped for pages already translating or translated.
 */
export function usePdfTranslation({
  pdfDoc,
  numPages,
  targetLanguage,
  accessToken,
  scrollContainerRef,
}: UsePdfTranslationParams): UsePdfTranslationResult {
  const [pageTranslations, setPageTranslations] = useState<PageTranslations>({});

  // Track which pages are already queued to avoid duplicate work
  const queuedRef = useRef<Set<number>>(new Set());
  // AbortControllers per page so we can cancel if translation is reset
  const abortControllersRef = useRef<Map<number, AbortController>>(new Map());
  // Stable ref for targetLanguage so the observer callback always sees current value
  const targetLanguageRef = useRef<string | null>(targetLanguage);
  const accessTokenRef = useRef<string | null>(accessToken);
  useEffect(() => { targetLanguageRef.current = targetLanguage; }, [targetLanguage]);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);
  // Stable ref for pdfDoc
  const pdfDocRef = useRef<any>(pdfDoc);
  useEffect(() => { pdfDocRef.current = pdfDoc; }, [pdfDoc]);

  // -------------------------------------------------------------------------
  // Core: translate a single page
  // -------------------------------------------------------------------------
  const translatePage = useCallback(async (pageNumber: number) => {
    const lang = targetLanguageRef.current;
    const doc = pdfDocRef.current;
    if (!lang || !doc) return;

    setQueuedPage(pageNumber);

    setPageTranslations((prev) => ({
      ...prev,
      [pageNumber]: { status: 'translating' },
    }));

    const abortController = new AbortController();
    abortControllersRef.current.set(pageNumber, abortController);

    try {
      const pageProxy = await doc.getPage(pageNumber);
      const rawParagraphs = await extractPageParagraphs(pageProxy);

      if (abortController.signal.aborted) return;

      const translated = await translateParagraphs(
        rawParagraphs,
        lang,
        accessTokenRef.current,
        abortController.signal,
      );

      if (abortController.signal.aborted) return;

      setPageTranslations((prev) => ({
        ...prev,
        [pageNumber]: { status: 'translated', paragraphs: translated },
      }));
    } catch (err) {
      if (abortController.signal.aborted) return;
      setPageTranslations((prev) => ({
        ...prev,
        [pageNumber]: {
          status: 'error',
          message: err instanceof Error ? err.message : 'Translation failed',
        },
      }));
      // Remove from queued so a retry is possible in future
      queuedRef.current.delete(pageNumber);
    } finally {
      abortControllersRef.current.delete(pageNumber);
    }
  }, []);

  function setQueuedPage(pageNumber: number) {
    queuedRef.current.add(pageNumber);
  }

  function isPageQueued(pageNumber: number): boolean {
    return queuedRef.current.has(pageNumber);
  }

  // -------------------------------------------------------------------------
  // Schedule: translate visible page + next 3
  // -------------------------------------------------------------------------
  const scheduleTranslation = useCallback(
    (visiblePageNumber: number) => {
      const total = numPages ?? 0;
      const pagesToTranslate = [
        visiblePageNumber,
        visiblePageNumber + 1,
        visiblePageNumber + 2,
        visiblePageNumber + 3,
      ].filter((n) => n >= 1 && n <= total && !isPageQueued(n));

      pagesToTranslate.forEach((n) => {
        translatePage(n);
      });
    },
    [numPages, translatePage],
  );

  // -------------------------------------------------------------------------
  // IntersectionObserver: attach when targetLanguage is set + pages are ready
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!targetLanguage || !numPages || !pdfDoc) return;

    const root = scrollContainerRef.current;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // The data-page attribute is set on pageWrapper divs in PdfDetail
          const pageNumber = parseInt(
            (entry.target as HTMLElement).dataset.page ?? '0',
            10,
          );
          if (pageNumber >= 1 && !isPageQueued(pageNumber)) {
            scheduleTranslation(pageNumber);
          }
        }
      },
      {
        root,
        rootMargin: '200px 0px',
        threshold: 0.01,
      },
    );

    // Track which elements are already registered so we never double-observe.
    const observedSet = new Set<Element>();

    const observeNew = () => {
      const container = scrollContainerRef.current ?? document.body;
      container.querySelectorAll<HTMLElement>('[data-page]').forEach((el) => {
        if (!observedSet.has(el)) {
          intersectionObserver.observe(el);
          observedSet.add(el);
        }
      });
    };

    // Observe pages already in the DOM (those visible at translate time).
    observeNew();

    // react-pdf lazily renders pages as the user scrolls. Watch for new page
    // divs being inserted and register them with the IntersectionObserver
    // immediately so they are translated when they enter the viewport.
    const mutationObserver = new MutationObserver(observeNew);
    mutationObserver.observe(root ?? document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
    // We intentionally list numPages and pdfDoc as dependencies so the observer
    // re-attaches when the document finishes loading.
  }, [targetLanguage, numPages, pdfDoc, scheduleTranslation, scrollContainerRef]);

  // -------------------------------------------------------------------------
  // Reset: abort all in-flight translations and clear state
  // -------------------------------------------------------------------------
  const resetTranslation = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    queuedRef.current.clear();
    setPageTranslations({});
  }, []);

  // Reset whenever targetLanguage changes (user picks a different language)
  const prevTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevTargetRef.current !== null && prevTargetRef.current !== targetLanguage) {
      resetTranslation();
    }
    prevTargetRef.current = targetLanguage;
  }, [targetLanguage, resetTranslation]);

  return { pageTranslations, resetTranslation };
}
