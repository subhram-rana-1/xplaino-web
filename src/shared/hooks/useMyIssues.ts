/**
 * Custom hook for managing issues state
 */

import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { issuesAtom } from '@/shared/atoms/issues.atom';
import { getMyIssues } from '@/shared/services/issues.service';
import type { IssuesState } from '@/shared/atoms/issues.atom';

export interface UseMyIssuesReturn {
  state: IssuesState;
  fetchIssues: (accessToken: string, statuses?: string[]) => Promise<void>;
  resetIssues: () => void;
}

export function useMyIssues(): UseMyIssuesReturn {
  const [state, setState] = useAtom(issuesAtom);

  const fetchIssues = useCallback(
    async (accessToken: string, statuses?: string[]) => {
      setState((prev) => {
        if (prev.isLoading) {
          return prev;
        }
        return { ...prev, isLoading: true };
      });

      try {
        const response = await getMyIssues(accessToken, statuses);
        setState({
          issues: response.issues,
          isLoading: false,
          isLoaded: true,
        });
      } catch (error) {
        console.error('Error fetching issues:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [setState]
  );

  const resetIssues = useCallback(() => {
    setState({
      issues: [],
      isLoading: false,
      isLoaded: false,
    });
  }, [setState]);

  return {
    state,
    fetchIssues,
    resetIssues,
  };
}

