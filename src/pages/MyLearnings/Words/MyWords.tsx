import React, { useEffect, useState, useMemo } from 'react';
import { FiCopy, FiExternalLink, FiTrash2, FiCheck } from 'react-icons/fi';
import styles from './MyWords.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { LoginModal } from '@/shared/components/LoginModal';
import { useMyWords } from '@/shared/hooks/useMyWords';
import { ChromeButton } from '@/shared/components/ChromeButton';
import { Toast } from '@/shared/components/Toast';
import type { SavedWord } from '@/shared/types/words.types';

/**
 * MyWords - My Words page component
 * 
 * @returns JSX element
 */
export const MyWords: React.FC = () => {
  const { isLoggedIn, accessToken } = useAuth();
  const { state, fetchWords, deleteWord } = useMyWords();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedWordId, setCopiedWordId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (isLoggedIn && accessToken && !state.isLoaded && !state.isLoading) {
      fetchWords(0, 20, accessToken).catch((error) => {
        console.error('Error fetching words:', error);
      });
    }
  }, [isLoggedIn, accessToken, state.isLoaded, state.isLoading, fetchWords]);

  // Refetch if offset changed and we need new data
  useEffect(() => {
    if (isLoggedIn && accessToken && state.isLoaded && !state.isLoading) {
      // Check if we need to refetch due to pagination change
      const needsRefetch = state.words.length === 0 && state.offset > 0 && state.total > 0;
      if (needsRefetch) {
        fetchWords(state.offset, state.limit, accessToken).catch((error) => {
          console.error('Error fetching words:', error);
        });
      }
    }
  }, [state.offset, isLoggedIn, accessToken, state.isLoaded, state.isLoading, state.words.length, state.total, fetchWords]);

  // Filter words based on search query (substring matching)
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) {
      return state.words;
    }
    const query = searchQuery.toLowerCase();
    return state.words.filter((word) => 
      word.word.toLowerCase().includes(query) ||
      (word.contextual_meaning && word.contextual_meaning.toLowerCase().includes(query))
    );
  }, [state.words, searchQuery]);

  // Function to highlight matching text (handles all occurrences)
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) {
      return text;
    }
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let index = textLower.indexOf(queryLower, lastIndex);
    
    while (index !== -1) {
      // Add text before the match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      // Add highlighted match
      parts.push(
        <span key={index} className={styles.highlight}>
          {text.substring(index, index + query.length)}
        </span>
      );
      lastIndex = index + query.length;
      index = textLower.indexOf(queryLower, lastIndex);
    }
    
    // Add remaining text after last match
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
  };

  const handleCopy = async (word: string, wordId: string) => {
    try {
      await navigator.clipboard.writeText(word);
      setCopiedWordId(wordId);
      setTimeout(() => {
        setCopiedWordId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy word:', error);
    }
  };

  const handleDelete = async (wordId: string) => {
    if (!accessToken) return;

    try {
      setDeletingId(wordId);
      await deleteWord(wordId, accessToken);
      setToast({ message: 'Word deleted successfully' });
      // If we deleted and need to refetch, it will be handled by the hook
      if (state.words.length === 0 && state.offset > 0) {
        await fetchWords(state.offset, state.limit, accessToken);
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      // Error is already handled by the hook (reverts optimistic update)
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrevious = () => {
    if (state.offset > 0 && accessToken) {
      const newOffset = Math.max(0, state.offset - state.limit);
      fetchWords(newOffset, state.limit, accessToken).catch((error) => {
        console.error('Error fetching words:', error);
      });
    }
  };

  const handleNext = () => {
    if (state.offset + state.limit < state.total && accessToken) {
      const newOffset = state.offset + state.limit;
      fetchWords(newOffset, state.limit, accessToken).catch((error) => {
        console.error('Error fetching words:', error);
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.myWords}>
        <LoginModal actionText="view your saved words" />
      </div>
    );
  }

  const startIndex = state.offset + 1;
  const endIndex = Math.min(state.offset + state.limit, state.total);
  const canGoPrevious = state.offset > 0;
  const canGoNext = state.offset + state.limit < state.total;

  return (
    <div className={styles.myWords}>
      <div className={styles.container}>
        <h1 className={styles.heading}>My Words</h1>
        {state.isLoading && state.words.length === 0 ? (
          <div className={styles.loading}>Loading...</div>
        ) : state.words.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyHeading}>No saved words yet</h2>
            <p className={styles.emptyMessage}>
              Start gathering important words, meanings and the source webpages
            </p>
            <div className={styles.chromeButtonContainer}>
              <ChromeButton />
            </div>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search words"
              />
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Word</th>
                    <th>Meaning</th>
                    <th>Source</th>
                    <th>Saved On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.noResults}>
                        No words found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredWords.map((word) => (
                      <tr key={word.id}>
                        <td>
                          <div className={styles.wordCell}>
                            <div className={styles.copyButtonWrapper}>
                              <button
                                className={styles.copyButton}
                                onClick={() => handleCopy(word.word, word.id)}
                                aria-label={`Copy ${word.word}`}
                                title="Copy word"
                              >
                                {copiedWordId === word.id ? (
                                  <FiCheck className={styles.checkIcon} />
                                ) : (
                                  <FiCopy />
                                )}
                              </button>
                              {copiedWordId === word.id && (
                                <div className={styles.copiedTooltip}>Copied</div>
                              )}
                            </div>
                            <span className={styles.wordText}>
                              {highlightText(word.word, searchQuery)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.meaningCell}>
                            {word.contextual_meaning ? (
                              highlightText(word.contextual_meaning, searchQuery)
                            ) : (
                              'No meaning available'
                            )}
                          </div>
                        </td>
                        <td>
                          <a
                            href={(() => {
                              try {
                                const url = new URL(word.sourceUrl);
                                url.searchParams.set('xplaino_word', word.word);
                                return url.toString();
                              } catch {
                                // If sourceUrl is not a valid URL, append query param
                                const separator = word.sourceUrl.includes('?') ? '&' : '?';
                                return `${word.sourceUrl}${separator}xplaino_word=${encodeURIComponent(word.word)}`;
                              }
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                            aria-label={`Open source in new tab`}
                          >
                            <FiExternalLink />
                          </a>
                        </td>
                        <td>
                          <div className={styles.dateCell}>
                            {new Date(word.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDelete(word.id)}
                            disabled={deletingId === word.id}
                            aria-label={`Delete ${word.word}`}
                            title="Delete word"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {state.total > 0 && searchQuery.trim() === '' && (
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  Showing {startIndex}-{endIndex} of {state.total}
                </div>
                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationButton}
                    onClick={handlePrevious}
                    disabled={!canGoPrevious || state.isLoading}
                  >
                    Previous
                  </button>
                  <button
                    className={styles.paginationButton}
                    onClick={handleNext}
                    disabled={!canGoNext || state.isLoading}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

MyWords.displayName = 'MyWords';

