import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, fetchPublic, extractErrorMessage } from './api-client';

export interface PdfNote {
  id: string;
  pdfId: string;
  startText: string;
  endText: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function createPdfNote(
  pdfId: string,
  startText: string,
  endText: string,
  content: string,
): Promise<PdfNote> {
  const res = await fetchWithAuth(`${authConfig.catenBaseUrl}/api/pdf-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfId, startText, endText, content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to create note'));
  }
  return res.json() as Promise<PdfNote>;
}

export async function getPdfNotes(pdfId: string, accessToken: string | null = null): Promise<PdfNote[]> {
  const fetcher = accessToken ? fetchWithAuth : fetchPublic;
  const res = await fetcher(`${authConfig.catenBaseUrl}/api/pdf-note/pdf/${pdfId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to fetch notes'));
  }
  const data = await res.json();
  return data.notes as PdfNote[];
}

export async function updatePdfNote(noteId: string, content: string): Promise<PdfNote> {
  const res = await fetchWithAuth(`${authConfig.catenBaseUrl}/api/pdf-note/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to update note'));
  }
  return res.json() as Promise<PdfNote>;
}

export async function deletePdfNote(noteId: string): Promise<void> {
  const res = await fetchWithAuth(`${authConfig.catenBaseUrl}/api/pdf-note/${noteId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to delete note'));
  }
}
