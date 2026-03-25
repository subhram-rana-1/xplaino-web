export interface HighlightedPageSummary {
  pageUrl: string;
  pageUrlHash: string;
  highlightCount: number;
  lastHighlightedAt: string;
}

export interface PaginatedHighlightedPagesResponse {
  pages: HighlightedPageSummary[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface WebHighlight {
  id: string;
  pageUrl: string;
  selectedText: string;
  color: string;
  note: string | null;
  createdAt: string;
}

export interface GetWebHighlightsResponse {
  highlights: WebHighlight[];
}
