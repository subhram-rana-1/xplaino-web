import { authConfig } from '@/config/auth.config';
import { fetchWithAuth, fetchPublic, extractErrorMessage } from './api-client';

export interface HighlightColour {
  id: string;
  hexcode: string;
}

export interface PdfHighlight {
  id: string;
  highlightColourId: string;
  startText: string;
  endText: string;
}

export async function getHighlightColours(): Promise<HighlightColour[]> {
  const res = await fetchPublic(`${authConfig.catenBaseUrl}/api/highlight/colours`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to fetch highlight colours'));
  }
  const data = await res.json();
  return data.colours as HighlightColour[];
}

export async function getPdfHighlights(pdfId: string, accessToken: string | null = null): Promise<PdfHighlight[]> {
  const fetcher = accessToken ? fetchWithAuth : fetchPublic;
  const res = await fetcher(
    `${authConfig.catenBaseUrl}/api/highlight/pdf/${pdfId}?limit=1000`,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to fetch highlights'));
  }
  const data = await res.json();
  return data.highlights as PdfHighlight[];
}

export async function createHighlight(
  pdfId: string,
  highlightColourId: string,
  startText: string,
  endText: string,
): Promise<PdfHighlight> {
  const res = await fetchWithAuth(`${authConfig.catenBaseUrl}/api/highlight/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfId, highlightColourId, startText, endText }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to create highlight'));
  }
  return res.json() as Promise<PdfHighlight>;
}

export async function deleteHighlight(highlightId: string): Promise<void> {
  const res = await fetchWithAuth(
    `${authConfig.catenBaseUrl}/api/highlight/pdf/${highlightId}`,
    { method: 'DELETE' },
  );
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Failed to delete highlight'));
  }
}
