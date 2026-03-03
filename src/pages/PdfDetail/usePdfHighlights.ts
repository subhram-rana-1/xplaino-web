import { useState, useEffect, useCallback } from 'react';
import {
  getHighlightColours,
  getPdfHighlights,
  createHighlight as apiCreateHighlight,
  deleteHighlight as apiDeleteHighlight,
  type HighlightColour,
  type PdfHighlight,
} from '@/shared/services/pdfHighlightService';

interface UsePdfHighlightsOptions {
  pdfId: string | undefined;
  accessToken: string | null;
}

interface UsePdfHighlightsReturn {
  colours: HighlightColour[];
  selectedColourId: string | null;
  setSelectedColourId: (id: string) => void;
  highlights: PdfHighlight[];
  createHighlight: (startText: string, endText: string) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;
}

export function usePdfHighlights({
  pdfId,
  accessToken,
}: UsePdfHighlightsOptions): UsePdfHighlightsReturn {
  const [colours, setColours] = useState<HighlightColour[]>([]);
  const [selectedColourId, setSelectedColourId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<PdfHighlight[]>([]);

  // Fetch available colours (public endpoint, no auth needed)
  useEffect(() => {
    let cancelled = false;
    getHighlightColours()
      .then((cols) => {
        if (cancelled) return;
        setColours(cols);
        if (cols.length > 0) setSelectedColourId(prev => prev === null ? cols[0].id : prev);
      })
      .catch(() => {
        // Colours unavailable — silently degrade
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch highlights for this PDF (auth required)
  useEffect(() => {
    if (!pdfId || !accessToken) return;
    let cancelled = false;
    getPdfHighlights(pdfId)
      .then((hs) => {
        if (!cancelled) setHighlights(hs);
      })
      .catch(() => {
        // Highlights unavailable — silently degrade
      });
    return () => {
      cancelled = true;
    };
  }, [pdfId, accessToken]);

  const createHighlight = useCallback(
    async (startText: string, endText: string) => {
      if (!pdfId || !selectedColourId) return;
      const newHighlight = await apiCreateHighlight(pdfId, selectedColourId, startText, endText);
      setHighlights((prev) => [...prev, newHighlight]);
    },
    [pdfId, selectedColourId],
  );

  const deleteHighlight = useCallback(async (id: string) => {
    await apiDeleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return {
    colours,
    selectedColourId,
    setSelectedColourId,
    highlights,
    createHighlight,
    deleteHighlight,
  };
}
