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

// ── PDF Note Comments ─────────────────────────────────────────────────────────

export interface PdfNoteComment {
  id: string;
  pdfNoteId: string;
  userId: string;
  content: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export async function getPdfNoteComments(noteId: string): Promise<PdfNoteComment[]> {
  const res = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf-note-comment/note/${noteId}`,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to fetch comments'));
  }
  const data = await res.json();
  return data.comments as PdfNoteComment[];
}

export async function createPdfNoteComment(
  pdfNoteId: string,
  content: string,
): Promise<PdfNoteComment> {
  const res = await fetchWithAuth(`${authConfig.catenBaseUrl}/api/pdf-note-comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfNoteId, content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to create comment'));
  }
  return res.json() as Promise<PdfNoteComment>;
}

export async function updatePdfNoteComment(
  commentId: string,
  content: string,
): Promise<PdfNoteComment> {
  const res = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/pdf-note-comment/${commentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to update comment'));
  }
  return res.json() as Promise<PdfNoteComment>;
}
