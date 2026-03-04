import { useState, useEffect, useCallback } from 'react';
import {
  getPdfNotes,
  createPdfNote as apiCreatePdfNote,
  updatePdfNote as apiUpdatePdfNote,
  deletePdfNote as apiDeletePdfNote,
  type PdfNote,
} from '@/shared/services/pdfNoteService';

interface UsePdfNotesOptions {
  pdfId: string | undefined;
  accessToken: string | null;
}

interface UsePdfNotesReturn {
  notes: PdfNote[];
  createNote: (startText: string, endText: string, content: string) => Promise<PdfNote>;
  updateNote: (noteId: string, content: string) => Promise<PdfNote>;
  deleteNote: (noteId: string) => Promise<void>;
}

export function usePdfNotes({ pdfId, accessToken }: UsePdfNotesOptions): UsePdfNotesReturn {
  const [notes, setNotes] = useState<PdfNote[]>([]);

  useEffect(() => {
    if (!pdfId || !accessToken) return;
    let cancelled = false;
    getPdfNotes(pdfId)
      .then((ns) => {
        if (!cancelled) setNotes(ns);
      })
      .catch(() => {
        // Notes unavailable — silently degrade
      });
    return () => {
      cancelled = true;
    };
  }, [pdfId, accessToken]);

  const createNote = useCallback(
    async (startText: string, endText: string, content: string): Promise<PdfNote> => {
      if (!pdfId) throw new Error('No PDF id');
      const note = await apiCreatePdfNote(pdfId, startText, endText, content);
      setNotes((prev) => [...prev, note]);
      return note;
    },
    [pdfId],
  );

  const updateNote = useCallback(async (noteId: string, content: string): Promise<PdfNote> => {
    const updated = await apiUpdatePdfNote(noteId, content);
    setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    return updated;
  }, []);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    await apiDeletePdfNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  return { notes, createNote, updateNote, deleteNote };
}
