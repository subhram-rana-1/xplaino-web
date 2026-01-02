import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiExternalLink, FiTrash2, FiCopy, FiCheck } from 'react-icons/fi';
import styles from './FolderBookmark.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllSavedParagraphs } from '@/shared/services/paragraphs.service';
import { getAllSavedLinksByFolderId } from '@/shared/services/links.service';
import { getSavedWordsByFolderId } from '@/shared/services/words.service';
import { getAllSavedImagesByFolderId } from '@/shared/services/images.service';
import type { GetAllSavedParagraphsResponse } from '@/shared/types/paragraphs.types';
import type { GetAllSavedLinksResponse } from '@/shared/types/links.types';
import type { GetSavedWordsResponse } from '@/shared/types/words.types';
import type { GetAllSavedImagesResponse } from '@/shared/types/images.types';
import { FolderIcon } from '@/shared/components/FolderIcon';
import { Toast } from '@/shared/components/Toast';

/**
 * FolderBookmark - Folder detail page with tabbed content
 * 
 * @returns JSX element
 */
export const FolderBookmark: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'paragraph' | 'link' | 'word' | 'image'>('paragraph');
  
  // Data states for each tab
  const [paragraphsData, setParagraphsData] = useState<GetAllSavedParagraphsResponse | null>(null);
  const [paragraphsLoading, setParagraphsLoading] = useState(false);
  const [paragraphsError, setParagraphsError] = useState<string | null>(null);
  
  const [linksData, setLinksData] = useState<GetAllSavedLinksResponse | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  
  const [wordsData, setWordsData] = useState<GetSavedWordsResponse | null>(null);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [wordsError, setWordsError] = useState<string | null>(null);
  
  const [imagesData, setImagesData] = useState<GetAllSavedImagesResponse | null>(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  
  // Track which tabs have loaded data
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const [refreshingTab, setRefreshingTab] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [copiedWordId, setCopiedWordId] = useState<string | null>(null);

  // Get folder data from navigation state if available
  const folder = (location.state as { folder?: { id: string; name: string } })?.folder;
  const folderName = folder?.name || `Folder ${folderId}`;

  // Fetch functions
  const fetchParagraphs = useCallback(async (forceRefresh = false) => {
    if (!accessToken || !folderId) return;
    if (!forceRefresh && loadedTabs.has('paragraph')) return;

    setParagraphsLoading(true);
    setParagraphsError(null);
    try {
      const data = await getAllSavedParagraphs(accessToken, folderId, 0, 20);
      setParagraphsData(data);
      setLoadedTabs(prev => new Set(prev).add('paragraph'));
    } catch (error) {
      console.error('Error fetching paragraphs:', error);
      setParagraphsError(error instanceof Error ? error.message : 'Failed to fetch paragraphs');
    } finally {
      setParagraphsLoading(false);
    }
  }, [accessToken, folderId, loadedTabs]);

  const fetchLinks = useCallback(async (forceRefresh = false) => {
    if (!accessToken || !folderId) return;
    if (!forceRefresh && loadedTabs.has('link')) return;

    setLinksLoading(true);
    setLinksError(null);
    try {
      const data = await getAllSavedLinksByFolderId(accessToken, folderId, 0, 20);
      setLinksData(data);
      setLoadedTabs(prev => new Set(prev).add('link'));
    } catch (error) {
      console.error('Error fetching links:', error);
      setLinksError(error instanceof Error ? error.message : 'Failed to fetch links');
    } finally {
      setLinksLoading(false);
    }
  }, [accessToken, folderId, loadedTabs]);

  const fetchWords = useCallback(async (forceRefresh = false) => {
    if (!accessToken || !folderId) return;
    if (!forceRefresh && loadedTabs.has('word')) return;

    setWordsLoading(true);
    setWordsError(null);
    try {
      const data = await getSavedWordsByFolderId(accessToken, folderId, 0, 20);
      setWordsData(data);
      setLoadedTabs(prev => new Set(prev).add('word'));
    } catch (error) {
      console.error('Error fetching words:', error);
      setWordsError(error instanceof Error ? error.message : 'Failed to fetch words');
    } finally {
      setWordsLoading(false);
    }
  }, [accessToken, folderId, loadedTabs]);

  const fetchImages = useCallback(async (forceRefresh = false) => {
    if (!accessToken || !folderId) return;
    if (!forceRefresh && loadedTabs.has('image')) return;

    setImagesLoading(true);
    setImagesError(null);
    try {
      const data = await getAllSavedImagesByFolderId(accessToken, folderId, 0, 20);
      setImagesData(data);
      setLoadedTabs(prev => new Set(prev).add('image'));
    } catch (error) {
      console.error('Error fetching images:', error);
      setImagesError(error instanceof Error ? error.message : 'Failed to fetch images');
    } finally {
      setImagesLoading(false);
    }
  }, [accessToken, folderId, loadedTabs]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!accessToken || !folderId) return;

    switch (activeTab) {
      case 'paragraph':
        if (!loadedTabs.has('paragraph')) {
          fetchParagraphs();
        }
        break;
      case 'link':
        if (!loadedTabs.has('link')) {
          fetchLinks();
        }
        break;
      case 'word':
        if (!loadedTabs.has('word')) {
          fetchWords();
        }
        break;
      case 'image':
        if (!loadedTabs.has('image')) {
          fetchImages();
        }
        break;
    }
  }, [activeTab, accessToken, folderId, loadedTabs, fetchParagraphs, fetchLinks, fetchWords, fetchImages]);

  // Refresh handlers
  const handleRefreshParagraphs = async () => {
    setRefreshingTab('paragraph');
    try {
      await fetchParagraphs(true);
      setToast({ message: 'Paragraphs refreshed successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to refresh paragraphs', type: 'error' });
    } finally {
      setRefreshingTab(null);
    }
  };

  const handleRefreshLinks = async () => {
    setRefreshingTab('link');
    try {
      await fetchLinks(true);
      setToast({ message: 'Links refreshed successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to refresh links', type: 'error' });
    } finally {
      setRefreshingTab(null);
    }
  };

  const handleRefreshWords = async () => {
    setRefreshingTab('word');
    try {
      await fetchWords(true);
      setToast({ message: 'Words refreshed successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to refresh words', type: 'error' });
    } finally {
      setRefreshingTab(null);
    }
  };

  const handleRefreshImages = async () => {
    setRefreshingTab('image');
    try {
      await fetchImages(true);
      setToast({ message: 'Images refreshed successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to refresh images', type: 'error' });
    } finally {
      setRefreshingTab(null);
    }
  };

  const handleCopyWord = (word: string, wordId: string) => {
    navigator.clipboard.writeText(word);
    setCopiedWordId(wordId);
    setTimeout(() => setCopiedWordId(null), 2000);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getFirst7Words = (content: string): string => {
    const words = content.trim().split(/\s+/);
    return words.slice(0, 7).join(' ');
  };

  const handleSourceLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sourceUrl: string, content: string) => {
    e.preventDefault();
    const first7Words = getFirst7Words(content);
    const encodedContent = encodeURIComponent(first7Words);
    
    try {
      const url = new URL(sourceUrl);
      url.searchParams.set('xlpaino_content', encodedContent);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      const separator = sourceUrl.includes('?') ? '&' : '?';
      const urlWithParam = `${sourceUrl}${separator}xlpaino_content=${encodedContent}`;
      window.open(urlWithParam, '_blank', 'noopener,noreferrer');
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'paragraph':
        if (paragraphsLoading) {
          return <div className={styles.loading}>Loading paragraphs...</div>;
        }
        if (paragraphsError) {
          return <div className={styles.error}>Error: {paragraphsError}</div>;
        }
        if (!paragraphsData) {
          return <div className={styles.emptyState}>No data available</div>;
        }
        return (
          <div className={styles.paragraphsContent}>
            {/* Sub-folders */}
            {paragraphsData.sub_folders.length > 0 && (
              <div className={styles.foldersSection}>
                <h3 className={styles.sectionTitle}>Folders</h3>
                <div className={styles.foldersGrid}>
                  {paragraphsData.sub_folders.map((subFolder) => (
                    <div
                      key={subFolder.id}
                      className={styles.folderCard}
                      onClick={() => navigate(`/user/dashboard/bookmark/${subFolder.id}`, {
                        state: { folder: { id: subFolder.id, name: subFolder.name } }
                      })}
                    >
                      <FolderIcon size={32} />
                      <span className={styles.folderCardName}>{subFolder.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Paragraphs */}
            {paragraphsData.saved_paragraphs.length > 0 && (
              <div className={styles.paragraphsSection}>
                <h3 className={styles.sectionTitle}>Paragraphs</h3>
                <div className={styles.paragraphsList}>
                  {paragraphsData.saved_paragraphs.map((para) => (
                    <div key={para.id} className={styles.paragraphItem}>
                      <div className={styles.paragraphHeader}>
                        <h4 className={styles.paragraphName}>{para.name || 'Untitled Paragraph'}</h4>
                      </div>
                      <p className={styles.paragraphContent}>{para.content}</p>
                      {para.source_url && (
                        <a
                          href={para.source_url}
                          onClick={(e) => handleSourceLinkClick(e, para.source_url, para.content)}
                          className={styles.sourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiExternalLink /> Source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {paragraphsData.sub_folders.length === 0 && paragraphsData.saved_paragraphs.length === 0 && (
              <div className={styles.emptyState}>No paragraphs or folders in this folder</div>
            )}
          </div>
        );

      case 'link':
        if (linksLoading) {
          return <div className={styles.loading}>Loading links...</div>;
        }
        if (linksError) {
          return <div className={styles.error}>Error: {linksError}</div>;
        }
        if (!linksData) {
          return <div className={styles.emptyState}>No data available</div>;
        }
        return (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Type</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {linksData.saved_links.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.noData}>No links found</td>
                  </tr>
                ) : (
                  linksData.saved_links.map((link) => (
                    <tr key={link.id}>
                      <td>{link.name || 'Untitled Link'}</td>
                      <td>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                          {link.url}
                        </a>
                      </td>
                      <td>{link.type}</td>
                      <td>{formatDate(link.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      case 'word':
        if (wordsLoading) {
          return <div className={styles.loading}>Loading words...</div>;
        }
        if (wordsError) {
          return <div className={styles.error}>Error: {wordsError}</div>;
        }
        if (!wordsData) {
          return <div className={styles.emptyState}>No data available</div>;
        }
        return (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Word</th>
                  <th>Meaning</th>
                  <th>Source</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {wordsData.words.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.noData}>No words found</td>
                  </tr>
                ) : (
                  wordsData.words.map((word) => (
                    <tr key={word.id}>
                      <td>
                        <div className={styles.wordCell}>
                          <button
                            className={styles.copyButton}
                            onClick={() => handleCopyWord(word.word, word.id)}
                            title="Copy word"
                          >
                            {copiedWordId === word.id ? <FiCheck /> : <FiCopy />}
                          </button>
                          <span>{word.word}</span>
                        </div>
                      </td>
                      <td>{word.contextualMeaning || 'No meaning available'}</td>
                      <td>
                        <a href={word.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                          {word.sourceUrl}
                        </a>
                      </td>
                      <td>{formatDate(word.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      case 'image':
        if (imagesLoading) {
          return <div className={styles.loading}>Loading images...</div>;
        }
        if (imagesError) {
          return <div className={styles.error}>Error: {imagesError}</div>;
        }
        if (!imagesData) {
          return <div className={styles.emptyState}>No data available</div>;
        }
        return (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Image</th>
                  <th>Source URL</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {imagesData.images.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.noData}>No images found</td>
                  </tr>
                ) : (
                  imagesData.images.map((image) => (
                    <tr key={image.id}>
                      <td>{image.name || 'Untitled Image'}</td>
                      <td>
                        <img
                          src={image.imageUrl}
                          alt={image.name || 'Image'}
                          className={styles.imagePreview}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </td>
                      <td>
                        <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                          {image.sourceUrl}
                        </a>
                      </td>
                      <td>{formatDate(image.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  const getRefreshHandler = (tab: string) => {
    switch (tab) {
      case 'paragraph': return handleRefreshParagraphs;
      case 'link': return handleRefreshLinks;
      case 'word': return handleRefreshWords;
      case 'image': return handleRefreshImages;
      default: return () => {};
    }
  };

  const isLoading = (tab: string) => {
    switch (tab) {
      case 'paragraph': return paragraphsLoading;
      case 'link': return linksLoading;
      case 'word': return wordsLoading;
      case 'image': return imagesLoading;
      default: return false;
    }
  };

  return (
    <div className={styles.folderBookmark}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/user/dashboard')}
          >
            <FiArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <h1 className={styles.heading}>{folderName}</h1>
          <div className={styles.headerSpacer}></div>
        </div>

        <div className={styles.tabContainer}>
          <div className={styles.tabs}>
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'paragraph' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('paragraph')}
              >
                Paragraphs
              </button>
              <button
                className={styles.refreshButton}
                onClick={() => getRefreshHandler('paragraph')()}
                disabled={isLoading('paragraph') || refreshingTab === 'paragraph'}
                title="Refresh paragraphs"
              >
                <FiRefreshCw className={refreshingTab === 'paragraph' ? styles.spin : ''} />
              </button>
            </div>
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'link' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('link')}
              >
                Links
              </button>
              <button
                className={styles.refreshButton}
                onClick={() => getRefreshHandler('link')()}
                disabled={isLoading('link') || refreshingTab === 'link'}
                title="Refresh links"
              >
                <FiRefreshCw className={refreshingTab === 'link' ? styles.spin : ''} />
              </button>
            </div>
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'word' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('word')}
              >
                Words
              </button>
              <button
                className={styles.refreshButton}
                onClick={() => getRefreshHandler('word')()}
                disabled={isLoading('word') || refreshingTab === 'word'}
                title="Refresh words"
              >
                <FiRefreshCw className={refreshingTab === 'word' ? styles.spin : ''} />
              </button>
            </div>
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'image' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('image')}
              >
                Images
              </button>
              <button
                className={styles.refreshButton}
                onClick={() => getRefreshHandler('image')()}
                disabled={isLoading('image') || refreshingTab === 'image'}
                title="Refresh images"
              >
                <FiRefreshCw className={refreshingTab === 'image' ? styles.spin : ''} />
              </button>
            </div>
          </div>
          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

FolderBookmark.displayName = 'FolderBookmark';
