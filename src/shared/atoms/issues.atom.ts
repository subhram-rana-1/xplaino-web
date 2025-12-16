import { atom } from 'jotai';
import type { IssueResponse } from '@/shared/types/issues.types';

export interface IssuesState {
  issues: IssueResponse[];
  isLoading: boolean;
  isLoaded: boolean;
}

const initialIssuesState: IssuesState = {
  issues: [],
  isLoading: false,
  isLoaded: false,
};

export const issuesAtom = atom<IssuesState>(initialIssuesState);

