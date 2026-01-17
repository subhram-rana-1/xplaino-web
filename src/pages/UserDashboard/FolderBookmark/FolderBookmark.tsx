import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiExternalLink, FiCopy, FiCheck, FiInfo, FiX, FiGlobe, FiEye, FiEyeOff, FiBookOpen, FiPlus, FiChevronDown, FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { SiYoutube, SiLinkedin, SiX, SiReddit, SiFacebook, SiInstagram } from 'react-icons/si';
import styles from './FolderBookmark.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllSavedParagraphs, deleteSavedParagraph, moveSavedParagraphToFolder, askAISavedParagraphs } from '@/shared/services/paragraphs.service';
import { getAllSavedLinksByFolderId, saveLink, deleteSavedLink, moveSavedLinkToFolder } from '@/shared/services/links.service';
import { getSavedWordsByFolderId, deleteSavedWord, moveSavedWordToFolder } from '@/shared/services/words.service';
import { getAllSavedImagesByFolderId, deleteSavedImage, moveSavedImageToFolder } from '@/shared/services/images.service';
import { getAllFolders } from '@/shared/services/folders.service';
import { getUserSettings } from '@/shared/services/user-settings.service';
import type { GetAllSavedParagraphsResponse } from '@/shared/types/paragraphs.types';
import type { GetAllSavedLinksResponse } from '@/shared/types/links.types';
import type { GetSavedWordsResponse } from '@/shared/types/words.types';
import type { GetAllSavedImagesResponse } from '@/shared/types/images.types';
import { FolderIcon } from '@/shared/components/FolderIcon';
import { Toast } from '@/shared/components/Toast';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ActionMenu } from '@/shared/components/ActionMenu';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FolderSelectionModal } from '@/shared/components/FolderSelectionModal';
import { AskAIButton } from '@/shared/components/AskAIButton';
import { AskAISidePanel } from '@/shared/components/AskAISidePanel';
import { OnHoverMessage } from '@/shared/components/OnHoverMessage';
import type { SavedParagraph } from '@/shared/types/paragraphs.types';
import { UserQuestionType } from '@/shared/types/paragraphs.types';
import type { SavedLink } from '@/shared/types/links.types';
import type { SavedWord } from '@/shared/types/words.types';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';

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
  const [paragraphsLoadingMore, setParagraphsLoadingMore] = useState(false);
  const [paragraphsError, setParagraphsError] = useState<string | null>(null);
  const [paragraphsHasMore, setParagraphsHasMore] = useState(false);
  
  const [linksData, setLinksData] = useState<GetAllSavedLinksResponse | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksLoadingMore, setLinksLoadingMore] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [linksHasMore, setLinksHasMore] = useState(false);
  
  const [wordsData, setWordsData] = useState<GetSavedWordsResponse | null>(null);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [wordsLoadingMore, setWordsLoadingMore] = useState(false);
  const [wordsError, setWordsError] = useState<string | null>(null);
  const [wordsHasMore, setWordsHasMore] = useState(false);
  
  const [imagesData, setImagesData] = useState<GetAllSavedImagesResponse | null>(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesLoadingMore, setImagesLoadingMore] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [imagesHasMore, setImagesHasMore] = useState(false);
  
  // Track which tabs have loaded data
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [copiedWordId, setCopiedWordId] = useState<string | null>(null);
  const [copiedParagraphId, setCopiedParagraphId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string | null; sourceUrl: string; id?: string; createdAt?: string } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageModalClosing, setIsImageModalClosing] = useState(false);
  const [selectedParagraph, setSelectedParagraph] = useState<SavedParagraph | null>(null);
  const [isParagraphModalOpen, setIsParagraphModalOpen] = useState(false);
  const [isParagraphModalClosing, setIsParagraphModalClosing] = useState(false);
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isAddLinkModalClosing, setIsAddLinkModalClosing] = useState(false);
  const [addLinkForm, setAddLinkForm] = useState({ name: '', url: '' });
  const [selectedLinkSummary, setSelectedLinkSummary] = useState<{ summary: string; url: string; name: string | null } | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isSummaryModalClosing, setIsSummaryModalClosing] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isNameColumnVisible, setIsNameColumnVisible] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  
  // Delete and move state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'paragraph' | 'link' | 'word' | 'image'; id: string; name?: string } | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<{ type: 'paragraph' | 'link' | 'word' | 'image'; id: string; currentFolderId?: string | null } | null>(null);
  const [folders, setFolders] = useState<FolderWithSubFolders[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [hoveredInfoId, setHoveredInfoId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [tooltipData, setTooltipData] = useState<{ bookmarkTime: string; source: string } | null>(null);
  const infoIconRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipShowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  
  // Ask AI Panel state (persisted across panel close/route changes)
  const [isAskAIPanelOpen, setIsAskAIPanelOpen] = useState(false);
  const [scrollContainerHeight, setScrollContainerHeight] = useState<number | undefined>(undefined);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [selectedAskAIOption, setSelectedAskAIOption] = useState<string | null>(null);
  const [askAIChatMessages, setAskAIChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [askAIStreamingText, setAskAIStreamingText] = useState('');
  const [isAskAIRequesting, setIsAskAIRequesting] = useState(false);
  const [askAIAbortController, setAskAIAbortController] = useState<AbortController | null>(null);
  const [initialContext, setInitialContext] = useState<string[]>([]);
  
  // Checkbox selection state
  const [isCheckboxColumnVisible, setIsCheckboxColumnVisible] = useState(false);
  const [selectedParagraphIds, setSelectedParagraphIds] = useState<Set<string>>(new Set());
  const [showSelectParagraphMessage, setShowSelectParagraphMessage] = useState(false);
  const [isMessageFadingOut, setIsMessageFadingOut] = useState(false);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // User language preference
  const [userNativeLanguage, setUserNativeLanguage] = useState<string | null>(null);
  
  // Link type filter state
  const [selectedLinkTypes, setSelectedLinkTypes] = useState<Set<string>>(new Set());
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const [isTypeFilterClosing, setIsTypeFilterClosing] = useState(false);
  const typeFilterRef = useRef<HTMLDivElement>(null);

  const handleInfoIconClick = useCallback((id: string, bookmarkTime: string, source: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // If clicking the same icon, toggle tooltip
    if (hoveredInfoId === id && tooltipPosition) {
      setHoveredInfoId(null);
      setTooltipPosition(null);
      setTooltipData(null);
      return;
    }
    // Clear any pending timeouts
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    if (tooltipShowTimeoutRef.current) {
      clearTimeout(tooltipShowTimeoutRef.current);
      tooltipShowTimeoutRef.current = null;
    }
    const target = e.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 20,
        left: rect.left + rect.width / 2
      });
      setTooltipData({ bookmarkTime, source });
      setHoveredInfoId(id);
    }
  }, [hoveredInfoId, tooltipPosition]);

  // Get icon component based on link type
  const getTypeIcon = (type: string) => {
    const iconProps = { size: 20, className: styles.typeIcon };
    switch (type.toUpperCase()) {
      case 'WEBPAGE':
        return <FiGlobe {...iconProps} />;
      case 'YOUTUBE':
        return <SiYoutube {...iconProps} />;
      case 'LINKEDIN':
        return <SiLinkedin {...iconProps} />;
      case 'TWITTER':
        return <SiX {...iconProps} />;
      case 'REDDIT':
        return <SiReddit {...iconProps} />;
      case 'FACEBOOK':
        return <SiFacebook {...iconProps} />;
      case 'INSTAGRAM':
        return <SiInstagram {...iconProps} />;
      default:
        return <FiGlobe {...iconProps} />;
    }
  };

  // Auto-close Ask AI panel when switching away from paragraph tab
  useEffect(() => {
    if (activeTab !== 'paragraph' && isAskAIPanelOpen) {
      setIsAskAIPanelOpen(false);
    }
  }, [activeTab, isAskAIPanelOpen]);

  // Calculate scroll container height when panel is open
  useEffect(() => {
    if (!isAskAIPanelOpen) {
      setScrollContainerHeight(undefined);
      return;
    }

    const calculateScrollHeight = () => {
      const viewportHeight = window.innerHeight;
      const footer = document.querySelector('footer');
      
      // Get container's top position
      const containerElement = document.querySelector(`.${styles.container}`);
      if (!containerElement) return;
      
      const containerTop = containerElement.getBoundingClientRect().top;
      
      if (!footer) {
        // No footer, use viewport bottom
        const height = viewportHeight - containerTop;
        setScrollContainerHeight(height);
        return;
      }
      
      const footerTop = footer.getBoundingClientRect().top;
      
      // Height is minimum of (viewport bottom, footer top) minus container top
      const maxBottom = Math.min(viewportHeight, footerTop);
      const height = maxBottom - containerTop;
      setScrollContainerHeight(Math.max(100, height)); // Minimum 100px
    };

    calculateScrollHeight();
    window.addEventListener('resize', calculateScrollHeight);

    return () => {
      window.removeEventListener('resize', calculateScrollHeight);
    };
  }, [isAskAIPanelOpen, styles.container]);

  // Calculate available width when panel is open
  useEffect(() => {
    if (!isAskAIPanelOpen) {
      setContainerWidth(undefined);
      return;
    }

    const calculateWidth = () => {
      const viewportWidth = window.innerWidth;
      const leftSidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('aside');
      const leftSidebarWidth = leftSidebar ? leftSidebar.getBoundingClientRect().width : 0;
      
      // Available width = viewport - left sidebar - Ask AI panel (560px) - some padding
      const availableWidth = viewportWidth - leftSidebarWidth - 560 - 32; // 32px for padding
      setContainerWidth(Math.max(400, availableWidth)); // Minimum 400px
    };

    calculateWidth();
    window.addEventListener('resize', calculateWidth);

    return () => {
      window.removeEventListener('resize', calculateWidth);
    };
  }, [isAskAIPanelOpen]);

  // Get folder data from navigation state if available
  const folder = (location.state as { folder?: { id: string; name: string } })?.folder;
  const folderName = folder?.name || `Folder ${folderId}`;

  // Fetch functions
  const fetchParagraphs = useCallback(async (forceRefresh = false, append = false) => {
    if (!accessToken || !folderId) return;
    if (!forceRefresh && !append && loadedTabs.has('paragraph')) return;

    const offset = append && paragraphsData ? paragraphsData.offset + paragraphsData.limit : 0;
    
    if (append) {
      setParagraphsLoadingMore(true);
    } else {
      setParagraphsLoading(true);
      setParagraphsError(null);
      if (forceRefresh) {
        setParagraphsData(null);
      }
    }
    
    try {
      const data = await getAllSavedParagraphs(accessToken, folderId, offset, 20);
      if (append && paragraphsData) {
        // Append new data to existing
        setParagraphsData({
          ...data,
          saved_paragraphs: [...paragraphsData.saved_paragraphs, ...data.saved_paragraphs],
          sub_folders: paragraphsData.sub_folders.length > 0 ? paragraphsData.sub_folders : data.sub_folders,
        });
      } else {
        setParagraphsData(data);
        setLoadedTabs(prev => new Set(prev).add('paragraph'));
      }
      setParagraphsHasMore(data.has_next);
    } catch (error) {
      console.error('Error fetching paragraphs:', error);
      if (!append) {
        setParagraphsError(error instanceof Error ? error.message : 'Failed to fetch paragraphs');
      }
    } finally {
      setParagraphsLoading(false);
      setParagraphsLoadingMore(false);
    }
  }, [accessToken, folderId, loadedTabs, paragraphsData]);

  const fetchLinks = useCallback(async (forceRefresh = false, append = false) => {
    if (!accessToken || !folderId) return;
    if (!forceRefresh && !append && loadedTabs.has('link')) return;

    const offset = append && linksData ? linksData.offset + linksData.limit : 0;
    
    if (append) {
      setLinksLoadingMore(true);
    } else {
      setLinksLoading(true);
      setLinksError(null);
      if (forceRefresh) {
        setLinksData(null);
      }
    }
    
    try {
      const data = await getAllSavedLinksByFolderId(accessToken, folderId, offset, 20);
      if (append && linksData) {
        setLinksData({
          ...data,
          saved_links: [...linksData.saved_links, ...data.saved_links],
          sub_folders: linksData.sub_folders.length > 0 ? linksData.sub_folders : data.sub_folders,
        });
      } else {
        setLinksData(data);
        setLoadedTabs(prev => new Set(prev).add('link'));
      }
      setLinksHasMore(data.has_next);
    } catch (error) {
      console.error('Error fetching links:', error);
      if (!append) {
        setLinksError(error instanceof Error ? error.message : 'Failed to fetch links');
      }
    } finally {
      setLinksLoading(false);
      setLinksLoadingMore(false);
    }
  }, [accessToken, folderId, loadedTabs, linksData]);

  const fetchWords = useCallback(async (forceRefresh = false, append = false) => {
    if (!accessToken || !folderId) return;
    if (!forceRefresh && !append && loadedTabs.has('word')) return;

    const offset = append && wordsData ? wordsData.offset + wordsData.limit : 0;
    
    if (append) {
      setWordsLoadingMore(true);
    } else {
      setWordsLoading(true);
      setWordsError(null);
      if (forceRefresh) {
        setWordsData(null);
      }
    }
    
    try {
      const data = await getSavedWordsByFolderId(accessToken, folderId, offset, 20);
      if (append && wordsData) {
        setWordsData({
          ...data,
          words: [...wordsData.words, ...data.words],
        });
      } else {
        setWordsData(data);
        setLoadedTabs(prev => new Set(prev).add('word'));
      }
      // Calculate hasMore for words (no has_next in response)
      const hasMore = data.offset + data.limit < data.total;
      setWordsHasMore(hasMore);
    } catch (error) {
      console.error('Error fetching words:', error);
      if (!append) {
        setWordsError(error instanceof Error ? error.message : 'Failed to fetch words');
      }
    } finally {
      setWordsLoading(false);
      setWordsLoadingMore(false);
    }
  }, [accessToken, folderId, loadedTabs, wordsData]);

  const fetchImages = useCallback(async (forceRefresh = false, append = false) => {
    if (!accessToken || !folderId) return;
    if (!forceRefresh && !append && loadedTabs.has('image')) return;

    const offset = append && imagesData ? imagesData.offset + imagesData.limit : 0;
    
    if (append) {
      setImagesLoadingMore(true);
    } else {
      setImagesLoading(true);
      setImagesError(null);
      if (forceRefresh) {
        setImagesData(null);
      }
    }
    
    try {
      const data = await getAllSavedImagesByFolderId(accessToken, folderId, offset, 20);
      if (append && imagesData) {
        setImagesData({
          ...data,
          images: [...imagesData.images, ...data.images],
        });
      } else {
        setImagesData(data);
        setLoadedTabs(prev => new Set(prev).add('image'));
      }
      setImagesHasMore(data.has_next);
    } catch (error) {
      console.error('Error fetching images:', error);
      if (!append) {
        setImagesError(error instanceof Error ? error.message : 'Failed to fetch images');
      }
    } finally {
      setImagesLoading(false);
      setImagesLoadingMore(false);
    }
  }, [accessToken, folderId, loadedTabs, imagesData]);

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

  // Fetch user settings on mount to get native language preference
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!accessToken) return;
      
      try {
        const settingsResponse = await getUserSettings(accessToken);
        setUserNativeLanguage(settingsResponse.settings.nativeLanguage);
      } catch (error) {
        console.error('Error fetching user settings:', error);
        // Don't show error to user, just continue with null language
      }
    };

    fetchUserSettings();
  }, [accessToken]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (tooltipShowTimeoutRef.current) {
        clearTimeout(tooltipShowTimeoutRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      if (messageFadeTimeoutRef.current) {
        clearTimeout(messageFadeTimeoutRef.current);
      }
    };
  }, []);

  const handleCloseTypeFilter = useCallback(() => {
    if (isTypeFilterOpen && !isTypeFilterClosing) {
      setIsTypeFilterClosing(true);
      setTimeout(() => {
        setIsTypeFilterOpen(false);
        setIsTypeFilterClosing(false);
      }, 200); // Match animation duration
    }
  }, [isTypeFilterOpen, isTypeFilterClosing]);

  const handleToggleTypeFilter = useCallback(() => {
    if (isTypeFilterOpen) {
      handleCloseTypeFilter();
    } else {
      setIsTypeFilterOpen(true);
      setIsTypeFilterClosing(false);
    }
  }, [isTypeFilterOpen, handleCloseTypeFilter]);

  // Close type filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        handleCloseTypeFilter();
      }
    };

    if (isTypeFilterOpen && activeTab === 'link') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isTypeFilterOpen, activeTab, handleCloseTypeFilter]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hoveredInfoId && tooltipPosition) {
        const target = event.target as HTMLElement;
        const iconElement = infoIconRefs.current[hoveredInfoId];
        
        // Don't close if clicking on the icon
        if (iconElement?.contains(target)) {
          return;
        }
        
        // Check if clicking on tooltip
        const tooltipElement = document.querySelector('[class*="tooltip"]');
        if (tooltipElement?.contains(target)) {
          return;
        }
        
        setHoveredInfoId(null);
        setTooltipPosition(null);
        setTooltipData(null);
      }
    };

    if (hoveredInfoId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hoveredInfoId, tooltipPosition]);

  // Handle closing image modal with animation
  const handleCloseImageModal = useCallback(() => {
    setIsImageModalClosing(true);
    setTimeout(() => {
      setIsImageModalOpen(false);
      setIsImageModalClosing(false);
      setSelectedImage(null);
    }, 300); // Match animation duration
  }, []);

  // Handle opening paragraph modal
  const handleOpenParagraphModal = (para: SavedParagraph) => {
    setSelectedParagraph(para);
    setIsParagraphModalOpen(true);
  };

  // Handle closing paragraph modal with animation
  const handleCloseParagraphModal = useCallback(() => {
    setIsParagraphModalClosing(true);
    setTimeout(() => {
      setIsParagraphModalOpen(false);
      setIsParagraphModalClosing(false);
      setSelectedParagraph(null);
    }, 300);
  }, []);

  // Handle opening summary modal
  const handleOpenSummaryModal = (link: SavedLink) => {
    if (link.summary) {
      setSelectedLinkSummary({ summary: link.summary, url: link.url, name: link.name });
      setIsSummaryModalOpen(true);
    }
  };

  // Handle closing summary modal with animation
  const handleCloseSummaryModal = useCallback(() => {
    setIsSummaryModalClosing(true);
    setTimeout(() => {
      setIsSummaryModalOpen(false);
      setIsSummaryModalClosing(false);
      setSelectedLinkSummary(null);
    }, 300);
  }, []);

  // Handle closing add link modal with animation
  const handleCloseAddLinkModal = useCallback(() => {
    setIsAddLinkModalClosing(true);
    setTimeout(() => {
      setIsAddLinkModalOpen(false);
      setIsAddLinkModalClosing(false);
      setAddLinkForm({ name: '', url: '' });
    }, 300);
  }, []);

  // Handle ESC key to close image modal and prevent body scroll
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageModalOpen && !isImageModalClosing) {
        handleCloseImageModal();
      }
    };

    if (isImageModalOpen) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      // Prevent body scroll and compensate for scrollbar
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.addEventListener('keydown', handleEscKey);
    } else {
      // Restore body scroll and remove padding
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isImageModalOpen, isImageModalClosing, handleCloseImageModal]);

  // Handle ESC key to close paragraph modal and prevent body scroll
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isParagraphModalOpen && !isParagraphModalClosing) {
        handleCloseParagraphModal();
      }
    };

    if (isParagraphModalOpen) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      // Prevent body scroll and compensate for scrollbar
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.addEventListener('keydown', handleEscKey);
    } else {
      // Restore body scroll and remove padding
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isParagraphModalOpen, isParagraphModalClosing, handleCloseParagraphModal]);

  // Handle ESC key to close add link modal and prevent body scroll
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddLinkModalOpen && !isAddLinkModalClosing) {
        handleCloseAddLinkModal();
      }
    };

    if (isAddLinkModalOpen) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      // Prevent body scroll and compensate for scrollbar
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.addEventListener('keydown', handleEscKey);
    } else {
      // Restore body scroll and remove padding
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isAddLinkModalOpen, isAddLinkModalClosing, handleCloseAddLinkModal]);

  // Global refresh handler - refreshes all tabs without changing the active tab
  const handleRefreshAll = useCallback(async () => {
    if (!accessToken || !folderId || isRefreshingAll) return;

    setIsRefreshingAll(true);

    // Reset pagination flags so fresh data starts from the beginning
    setParagraphsHasMore(false);
    setLinksHasMore(false);
    setWordsHasMore(false);
    setImagesHasMore(false);

    try {
      const results = await Promise.allSettled([
        fetchParagraphs(true),
        fetchLinks(true),
        fetchWords(true),
        fetchImages(true),
      ]);

      const allRejected = results.every((r) => r.status === 'rejected');

      if (allRejected) {
        setToast({
          message: 'Failed to refresh data. Please try again.',
          type: 'error',
        });
      } else {
        // Show success state for 1 second
        setShowRefreshSuccess(true);
        setTimeout(() => {
          setShowRefreshSuccess(false);
        }, 1000);
      }
    } finally {
      setIsRefreshingAll(false);
    }
  }, [
    accessToken,
    folderId,
    isRefreshingAll,
    fetchParagraphs,
    fetchLinks,
    fetchWords,
    fetchImages,
  ]);

  // Scroll detection for infinite scroll (using window scroll)
  useEffect(() => {
    if (activeTab !== 'paragraph' || paragraphsLoading || paragraphsLoadingMore || !paragraphsHasMore) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Load more when user is 300px from bottom
      if (scrollHeight - scrollTop - clientHeight < 300) {
        fetchParagraphs(false, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, paragraphsLoading, paragraphsLoadingMore, paragraphsHasMore, fetchParagraphs]);

  useEffect(() => {
    if (activeTab !== 'link' || linksLoading || linksLoadingMore || !linksHasMore) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollHeight - scrollTop - clientHeight < 300) {
        fetchLinks(false, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, linksLoading, linksLoadingMore, linksHasMore, fetchLinks]);

  useEffect(() => {
    if (activeTab !== 'word' || wordsLoading || wordsLoadingMore || !wordsHasMore) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollHeight - scrollTop - clientHeight < 300) {
        fetchWords(false, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, wordsLoading, wordsLoadingMore, wordsHasMore, fetchWords]);

  useEffect(() => {
    if (activeTab !== 'image' || imagesLoading || imagesLoadingMore || !imagesHasMore) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollHeight - scrollTop - clientHeight < 300) {
        fetchImages(false, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, imagesLoading, imagesLoadingMore, imagesHasMore, fetchImages]);

  const handleCopyWord = (word: string, wordId: string) => {
    navigator.clipboard.writeText(word);
    setCopiedWordId(wordId);
    setTimeout(() => setCopiedWordId(null), 2000);
  };

  const handleCopyParagraph = (content: string, paragraphId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedParagraphId(paragraphId);
    setTimeout(() => setCopiedParagraphId(null), 2000);
  };

  const handleCopyLink = (url: string, linkId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  // Handle saving link
  const handleSaveLink = async () => {
    if (!addLinkForm.url.trim()) {
      setToast({ message: 'URL is required', type: 'error' });
      return;
    }

    if (!accessToken || !folderId) {
      setToast({ message: 'Authentication required', type: 'error' });
      return;
    }

    setIsSavingLink(true);
    try {
      await saveLink(accessToken, {
        url: addLinkForm.url.trim(),
        name: addLinkForm.name.trim() || null,
        folder_id: folderId,
        summary: null,
        metadata: null,
      });
      setToast({ message: 'Link saved successfully', type: 'success' });
      handleCloseAddLinkModal();
      // Refresh links data
      await fetchLinks(true);
    } catch (error) {
      console.error('Error saving link:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to save link',
        type: 'error' 
      });
    } finally {
      setIsSavingLink(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (type: 'paragraph' | 'link' | 'word' | 'image', id: string, name?: string) => {
    setDeleteConfirm({ type, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !accessToken) return;

    try {
      switch (deleteConfirm.type) {
        case 'paragraph':
          await deleteSavedParagraph(accessToken, deleteConfirm.id);
          setToast({ message: 'Paragraph deleted successfully', type: 'success' });
          await fetchParagraphs(true);
          break;
        case 'link':
          await deleteSavedLink(accessToken, deleteConfirm.id);
          setToast({ message: 'Link deleted successfully', type: 'success' });
          await fetchLinks(true);
          break;
        case 'word':
          await deleteSavedWord(accessToken, deleteConfirm.id);
          setToast({ message: 'Word deleted successfully', type: 'success' });
          await fetchWords(true);
          break;
        case 'image':
          await deleteSavedImage(accessToken, deleteConfirm.id);
          setToast({ message: 'Image deleted successfully', type: 'success' });
          await fetchImages(true);
          break;
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to delete item',
        type: 'error' 
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Move handlers
  const handleMoveClick = async (type: 'paragraph' | 'link' | 'word' | 'image', id: string, currentFolderId?: string | null) => {
    if (!accessToken) return;
    
    setMoveItem({ type, id, currentFolderId });
    setIsFolderModalOpen(true);
    setFoldersLoading(true);
    
    try {
      const foldersData = await getAllFolders(accessToken);
      setFolders(foldersData.folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to fetch folders',
        type: 'error' 
      });
    } finally {
      setFoldersLoading(false);
    }
  };

  const handleFolderSelect = async (folderId: string | null) => {
    if (!moveItem || !accessToken) return;

    try {
      switch (moveItem.type) {
        case 'paragraph':
          await moveSavedParagraphToFolder(accessToken, moveItem.id, folderId);
          setToast({ message: 'Paragraph moved successfully', type: 'success' });
          await fetchParagraphs(true);
          break;
        case 'link':
          await moveSavedLinkToFolder(accessToken, moveItem.id, folderId);
          setToast({ message: 'Link moved successfully', type: 'success' });
          await fetchLinks(true);
          break;
        case 'word':
          await moveSavedWordToFolder(accessToken, moveItem.id, folderId);
          setToast({ message: 'Word moved successfully', type: 'success' });
          await fetchWords(true);
          break;
        case 'image':
          await moveSavedImageToFolder(accessToken, moveItem.id, folderId);
          setToast({ message: 'Image moved successfully', type: 'success' });
          await fetchImages(true);
          break;
      }
    } catch (error) {
      console.error('Error moving item:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to move item',
        type: 'error' 
      });
    } finally {
      setMoveItem(null);
      setIsFolderModalOpen(false);
    }
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

  const getFirst10Words = (content: string): string => {
    const words = content.trim().split(/\s+/);
    return words.slice(0, 10).join(' ');
  };

  const handleParagraphSourceClick = (e: React.MouseEvent<HTMLAnchorElement>, sourceUrl: string, content: string) => {
    e.preventDefault();
    e.stopPropagation();
    const first10Words = getFirst10Words(content);
    
    let finalUrl: string;
    try {
      const url = new URL(sourceUrl);
      // searchParams.set() automatically encodes, so don't encode manually
      url.searchParams.set('xplaino_text', first10Words);
      finalUrl = url.toString();
    } catch {
      // If relative URL, make it absolute
      try {
        const url = new URL(sourceUrl, window.location.origin);
        // searchParams.set() automatically encodes, so don't encode manually
        url.searchParams.set('xplaino_text', first10Words);
        finalUrl = url.toString();
      } catch {
        // Fallback: manually construct URL with query param (need to encode here)
        const separator = sourceUrl.includes('?') ? '&' : '?';
        const encodedContent = encodeURIComponent(first10Words);
        finalUrl = `${sourceUrl}${separator}xplaino_text=${encodedContent}`;
      }
    }
    
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper to show select paragraph message with auto-hide
  const showMessageWithAutoHide = useCallback(() => {
    // Clear any existing timeouts
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    if (messageFadeTimeoutRef.current) {
      clearTimeout(messageFadeTimeoutRef.current);
      messageFadeTimeoutRef.current = null;
    }
    
    setShowSelectParagraphMessage(true);
    setIsMessageFadingOut(false);
    
    // Start fade out after 2.5 seconds
    messageTimeoutRef.current = setTimeout(() => {
      setIsMessageFadingOut(true);
      // Remove from DOM after fade out animation (0.5s)
      messageFadeTimeoutRef.current = setTimeout(() => {
        setShowSelectParagraphMessage(false);
        setIsMessageFadingOut(false);
      }, 500);
    }, 2500);
  }, []);

  // Hide message immediately when user selects a paragraph
  useEffect(() => {
    if (selectedParagraphIds.size > 0 && showSelectParagraphMessage) {
      // Clear timeouts
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
      if (messageFadeTimeoutRef.current) {
        clearTimeout(messageFadeTimeoutRef.current);
        messageFadeTimeoutRef.current = null;
      }
      // Hide message
      setShowSelectParagraphMessage(false);
      setIsMessageFadingOut(false);
    }
  }, [selectedParagraphIds, showSelectParagraphMessage]);

  // Ask AI handlers
  const handleAskAIButtonClick = useCallback(() => {
    // If there's existing initial context, reopen panel with chat history
    if (initialContext.length > 0) {
      setIsAskAIPanelOpen(true);
      return false; // Don't open dropdown
    }
    
    // If checkboxes are not visible, show them on first click
    if (!isCheckboxColumnVisible) {
      setIsCheckboxColumnVisible(true);
      showMessageWithAutoHide();
      return false; // Don't open dropdown yet
    }
    
    // If checkboxes are visible but no paragraphs selected, hide checkboxes
    if (selectedParagraphIds.size === 0) {
      setIsCheckboxColumnVisible(false);
      return false; // Don't open dropdown
    }
    
    // If checkboxes are visible and paragraphs selected, allow dropdown to open
    return true;
  }, [initialContext, isCheckboxColumnVisible, selectedParagraphIds, showMessageWithAutoHide]);

  // Helper function to build initial context from selected paragraphs
  const buildInitialContext = useCallback((): string[] => {
    if (!paragraphsData) return [];
    
    const context: string[] = [];
    for (const paraId of selectedParagraphIds) {
      const para = paragraphsData.saved_paragraphs.find(p => p.id === paraId);
      if (para) {
        // Format with name if available
        if (para.name) {
          context.push(`**${para.name}**\n\n${para.content}`);
        } else {
          context.push(para.content);
        }
      }
    }
    return context;
  }, [paragraphsData, selectedParagraphIds]);

  // Helper function to handle streaming AI response
  const handleAIStream = useCallback(async (
    userQuestionType: UserQuestionType,
    userQuestion?: string
  ) => {
    if (!accessToken) {
      setToast({ message: 'Authentication required', type: 'error' });
      return;
    }

    // Use stored initial context or build from selected paragraphs
    let contextToUse = initialContext;
    if (contextToUse.length === 0) {
      contextToUse = buildInitialContext();
      if (contextToUse.length === 0) {
        setToast({ message: 'Please select at least one paragraph', type: 'error' });
        return;
      }
      setInitialContext(contextToUse);
    }

    // Create abort controller
    const controller = new AbortController();
    setAskAIAbortController(controller);
    setIsAskAIRequesting(true);
    setAskAIStreamingText('');

    try {
      let accumulatedText = '';
      
      for await (const response of askAISavedParagraphs(
        accessToken,
        contextToUse,
        userQuestionType,
        askAIChatMessages,
        userQuestion,
        userNativeLanguage,
        controller.signal
      )) {
        if ('chunk' in response) {
          // Stream chunk
          accumulatedText = response.accumulated;
          setAskAIStreamingText(accumulatedText);
        } else if (response.type === 'complete') {
          // Completion - use the accumulated text to ensure we have the full response
          const finalContent = accumulatedText || response.answer;
          setAskAIStreamingText('');
          // Only add to chat if we have content
          if (finalContent && finalContent.trim().length > 0) {
            setAskAIChatMessages(prev => [
              ...prev,
              { role: 'assistant' as const, content: finalContent }
            ]);
          }
        } else if (response.type === 'error') {
          // Error
          setToast({ 
            message: response.error_message || 'An error occurred', 
            type: 'error' 
          });
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name !== 'AbortError') {
          console.error('Error in AI stream:', error);
          setToast({ message: error.message, type: 'error' });
        }
      }
    } finally {
      setIsAskAIRequesting(false);
      setAskAIAbortController(null);
    }
  }, [accessToken, initialContext, buildInitialContext, askAIChatMessages, userNativeLanguage]);

  const handleAskAIOptionSelect = useCallback((option: string) => {
    // This should not be called if no paragraphs are selected (prevented by handleAskAIButtonClick)
    // But adding validation as safety check
    if (selectedParagraphIds.size === 0) {
      return;
    }

    // Build and store initial context from selected paragraphs (only if not already set)
    if (initialContext.length === 0) {
      const context = buildInitialContext();
      setInitialContext(context);
    }

    setSelectedAskAIOption(option);
    setIsAskAIPanelOpen(true);

    // Map option to question type and start streaming immediately for SHORT_SUMMARY and DESCRIPTIVE_NOTE
    if (option === 'Short summary') {
      // Add user question to chat first
      setAskAIChatMessages((prev) => [...prev, { role: 'user' as const, content: 'Generate a short summary about the selected paragraphs' }]);
      handleAIStream(UserQuestionType.SHORT_SUMMARY);
    } else if (option === 'Descriptive note') {
      // Add user question to chat first
      setAskAIChatMessages((prev) => [...prev, { role: 'user' as const, content: 'Generate a descriptive note on the selected paragraphs' }]);
      handleAIStream(UserQuestionType.DESCRIPTIVE_NOTE);
    }
    // For 'Ask AI' option, wait for user input (handled in handleAskAIInputSubmit)
  }, [selectedParagraphIds, initialContext, buildInitialContext, handleAIStream]);

  const handleAskAIClose = useCallback(() => {
    setIsAskAIPanelOpen(false);
    // Don't clear chat messages, initial context, or selected option
    // Chat persists across panel close and route changes
  }, []);

  const handleAskAIInputSubmit = useCallback((text: string) => {
    // Map text to question type
    let questionType: UserQuestionType;
    let userQuestion: string | undefined;
    
    if (text === 'Generate a short summary about the selected paragraphs') {
      questionType = UserQuestionType.SHORT_SUMMARY;
      userQuestion = undefined;
      // Add user question to chat first
      setAskAIChatMessages((prev) => [...prev, { role: 'user' as const, content: text }]);
    } else if (text === 'Generate a descriptive note on the selected paragraphs') {
      questionType = UserQuestionType.DESCRIPTIVE_NOTE;
      userQuestion = undefined;
      // Add user question to chat first
      setAskAIChatMessages((prev) => [...prev, { role: 'user' as const, content: text }]);
    } else {
      questionType = UserQuestionType.CUSTOM;
      userQuestion = text;
      // Add user message to chat for custom questions
      setAskAIChatMessages((prev) => [...prev, { role: 'user' as const, content: text }]);
    }
    
    // Call API with appropriate question type
    handleAIStream(questionType, userQuestion);
  }, [handleAIStream]);

  const handleAskAIStopRequest = useCallback(() => {
    // Save the partially received content before stopping
    if (askAIStreamingText && askAIStreamingText.trim().length > 0) {
      setAskAIChatMessages(prev => [
        ...prev,
        { role: 'assistant' as const, content: askAIStreamingText }
      ]);
    }
    
    // Clear streaming text
    setAskAIStreamingText('');
    
    // Abort the ongoing streaming request
    if (askAIAbortController) {
      askAIAbortController.abort();
      setAskAIAbortController(null);
    }
    setIsAskAIRequesting(false);
  }, [askAIAbortController, askAIStreamingText]);

  // Clear chat history handler - only clears chat, keeps initial context
  const handleClearChatHistory = useCallback(() => {
    setAskAIChatMessages([]);
    setAskAIStreamingText('');
    
    // Abort any ongoing request
    if (askAIAbortController) {
      askAIAbortController.abort();
      setAskAIAbortController(null);
    }
    setIsAskAIRequesting(false);
  }, [askAIAbortController]);

  // Reset/Delete handler - clears all Ask AI state
  const handleResetAskAI = useCallback(() => {
    // Close the panel
    setIsAskAIPanelOpen(false);
    
    // Hide checkboxes
    setIsCheckboxColumnVisible(false);
    
    // Hide message if showing
    setShowSelectParagraphMessage(false);
    setIsMessageFadingOut(false);
    
    // Clear all Ask AI state variables
    setInitialContext([]);
    setSelectedAskAIOption(null);
    setAskAIChatMessages([]);
    setAskAIStreamingText('');
    
    // Clear selected paragraphs
    setSelectedParagraphIds(new Set());
    
    // Abort any ongoing request
    if (askAIAbortController) {
      askAIAbortController.abort();
      setAskAIAbortController(null);
    }
    setIsAskAIRequesting(false);
  }, [askAIAbortController]);

  const handleWordSourceClick = (e: React.MouseEvent<HTMLAnchorElement>, sourceUrl: string, word: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!word || !word.trim()) {
      console.error('Word value is empty');
      return;
    }
    
    const trimmedWord = word.trim();
    
    let finalUrl: string;
    try {
      const url = new URL(sourceUrl);
      // searchParams.set() automatically encodes, so don't encode manually
      url.searchParams.set('xplaino_text', trimmedWord);
      finalUrl = url.toString();
    } catch {
      // If relative URL, make it absolute
      try {
        const url = new URL(sourceUrl, window.location.origin);
        // searchParams.set() automatically encodes, so don't encode manually
        url.searchParams.set('xplaino_text', trimmedWord);
        finalUrl = url.toString();
      } catch {
        // Fallback: manually construct URL with query param (need to encode here)
        const separator = sourceUrl.includes('?') ? '&' : '?';
        const encodedWord = encodeURIComponent(trimmedWord);
        finalUrl = `${sourceUrl}${separator}xplaino_text=${encodedWord}`;
      }
    }
    
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
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
        // Paragraph table columns
        const paragraphColumns: Column<SavedParagraph>[] = [
          // Checkbox column for selection
          {
            key: 'checkbox',
            header: 'Select all',
            align: 'center',
            width: '60px',
            hidden: !isCheckboxColumnVisible,
            headerRender: () => (
              <div>
                <input
                  type="checkbox"
                  className={styles.selectAllCheckbox}
                  checked={
                    paragraphsData.saved_paragraphs.length > 0 &&
                    selectedParagraphIds.size === paragraphsData.saved_paragraphs.length
                  }
                  disabled={initialContext.length > 0}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate =
                        selectedParagraphIds.size > 0 &&
                        selectedParagraphIds.size < paragraphsData.saved_paragraphs.length;
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Select all paragraphs
                      const allIds = new Set(paragraphsData.saved_paragraphs.map((p) => p.id));
                      setSelectedParagraphIds(allIds);
                    } else {
                      // Deselect all
                      setSelectedParagraphIds(new Set());
                    }
                  }}
                  aria-label="Select all paragraphs"
                />
              </div>
            ),
            render: (para) => (
              <input
                type="checkbox"
                className={styles.rowCheckbox}
                checked={selectedParagraphIds.has(para.id)}
                disabled={initialContext.length > 0}
                onChange={(e) => {
                  e.stopPropagation();
                  const newSelected = new Set(selectedParagraphIds);
                  if (e.target.checked) {
                    newSelected.add(para.id);
                  } else {
                    newSelected.delete(para.id);
                  }
                  setSelectedParagraphIds(newSelected);
                }}
                aria-label={`Select paragraph ${para.name || para.id}`}
              />
            ),
          },
          {
            key: 'name',
            header: 'Name',
            align: 'left',
            width: '300px',
            hidden: !isNameColumnVisible,
            headerRender: () => (
                          <div className={styles.columnHeaderWithIcon}>
                            <span>Name</span>
                            {isNameColumnVisible && (
                              <button
                                className={styles.eyeToggleButtonHeader}
                                onClick={() => setIsNameColumnVisible(false)}
                                title="Hide name column"
                                aria-label="Hide name column"
                              >
                                <FiEyeOff />
                              </button>
                            )}
                          </div>
            ),
            render: (para) => para.name || <span className={styles.noSummary}>—</span>,
          },
          {
            key: 'content',
            header: 'Content',
            align: 'left',
            className: styles.contentColumn,
            render: (para) => {
              const isHovered = hoveredRowId === para.id;
              return (
                <div className={styles.contentCellWithCopy}>
                  <button
                    className={`${styles.copyButton} ${isHovered ? styles.visible : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyParagraph(para.content, para.id);
                    }}
                    title="Copy content"
                  >
                    {copiedParagraphId === para.id ? <FiCheck /> : <FiCopy />}
                  </button>
                  <div 
                    className={styles.contentCellClickable}
                    onClick={() => handleOpenParagraphModal(para)}
                  >
                    {para.content.length > 150
                      ? `${para.content.substring(0, 150)}...`
                      : para.content}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'source',
            header: 'Source',
            align: 'left',
            render: (para) => {
              const paraId = para.id;
              const isHovered = hoveredRowId === paraId;
              return (
                          <div className={styles.sourceCell}>
                            {para.source_url ? (
                        <a
                          href={para.source_url}
                          onClick={(e) => handleParagraphSourceClick(e, para.source_url, para.content)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.iconLink}
                          title={para.source_url}
                              >
                                <FiExternalLink />
                              </a>
                            ) : (
                              <span className={styles.noSource}>—</span>
                            )}
                              <div 
                                ref={(el) => {
                                  if (el) {
                        infoIconRefs.current[paraId] = el;
                                  }
                                }}
                    className={`${styles.infoIconContainer} ${isHovered ? styles.infoIconVisible : styles.infoIconHidden}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                      handleInfoIconClick(paraId, formatDate(para.created_at), para.source_url || 'No source', e);
                                }}
                              >
                                <FiInfo className={styles.infoIcon} />
                              </div>
                  <ActionMenu
                    onDelete={() => handleDeleteClick('paragraph', para.id, para.name || undefined)}
                    onMove={() => handleMoveClick('paragraph', para.id, para.folder_id)}
                    isVisible={isHovered}
                    className={styles.actionIconsInCell}
                    showMove={true}
                  />
                    </div>
              );
            },
          },
        ];

        return (
          <>
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
            {/* Paragraphs Table */}
            {paragraphsData.saved_paragraphs.length > 0 ? (
              <>
                <div className={styles.tableControls}>
                  {/* Show names button and helper message on left */}
                  <div className={styles.tableControlsLeft}>
                    {!isNameColumnVisible && (
                      <button
                        className={styles.eyeToggleButton}
                        onClick={() => setIsNameColumnVisible(true)}
                        title="Show name column"
                        aria-label="Show name column"
                      >
                        <FiEye />
                        <span>Show Name</span>
                      </button>
                    )}
                    {showSelectParagraphMessage && (
                      <div
                        className={`${styles.selectParagraphMessage} ${
                          isMessageFadingOut ? styles.selectParagraphMessageFadeOut : ''
                        }`}
                      >
                        <span>Select paragraphs</span>
                      </div>
                    )}
                  </div>
                  {/* Ask AI Button and Reset Button on right - hidden when side panel is open */}
                  {!isAskAIPanelOpen && (
                    <div className={styles.askAIButtonContainer}>
                      <AskAIButton 
                        onOptionSelect={handleAskAIOptionSelect}
                        onButtonClick={handleAskAIButtonClick}
                        isPanelOpen={initialContext.length > 0}
                      />
                      {/* Remove chat button - shown when initial context exists */}
                      {initialContext.length > 0 && (
                        <>
                          <button
                            ref={resetButtonRef}
                            className={styles.resetButton}
                            onClick={handleResetAskAI}
                            aria-label="Remove chat"
                          >
                            <FiTrash2 size={18} />
                          </button>
                          {resetButtonRef.current && (
                            <OnHoverMessage
                              message="Remove chat"
                              targetRef={resetButtonRef}
                              position="bottom"
                              offset={8}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <DataTable
                  columns={paragraphColumns}
                  data={paragraphsData.saved_paragraphs}
                  emptyMessage="No paragraphs found"
                  rowKey={(para) => para.id}
                  onRowHover={(para) => {
                    if (para) {
                      setHoveredRowId(para.id);
                    } else {
                      setHoveredRowId(null);
                      if (hoveredInfoId && !infoIconRefs.current[hoveredInfoId]) {
                        setHoveredInfoId(null);
                        setTooltipPosition(null);
                        setTooltipData(null);
                      }
                    }
                  }}
                />
                {paragraphsLoadingMore && (
                  <div className={styles.loadingMore}>Loading more...</div>
                )}
              </>
            ) : paragraphsData.sub_folders.length === 0 ? (
              <div className={styles.emptyState}>No paragraphs or folders in this folder</div>
            ) : null}
          </>
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

        // Link table columns
        const linkColumns: Column<SavedLink>[] = [
          {
            key: 'name',
            header: 'Name',
            align: 'left',
            width: '250px',
            className: styles.nameColumn,
            render: (link) => link.name || '',
          },
          {
            key: 'url',
            header: 'URL',
            align: 'left',
            width: '400px',
            className: styles.urlColumn,
            render: (link) => {
              const isHovered = hoveredRowId === link.id;
              
              // Ensure URL has protocol for proper external navigation
              const getFullUrl = (url: string): string => {
                if (!url) return '#';
                if (url.startsWith('http://') || url.startsWith('https://')) {
                  return url;
                }
                return `https://${url}`;
              };

              const fullUrl = getFullUrl(link.url);

              return (
                <div className={styles.urlCellWithCopy}>
                  <button
                    className={`${styles.copyButton} ${isHovered ? styles.visible : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(link.url, link.id);
                    }}
                    title="Copy URL"
                  >
                    {copiedLinkId === link.id ? <FiCheck /> : <FiCopy />}
                  </button>
                  <a 
                    href={fullUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.urlLink}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {link.url}
                  </a>
                </div>
              );
            },
          },
          {
            key: 'type',
            header: 'Type',
            align: 'left',
            render: (link) => {
              return (
                <div className={styles.typeCell}>
                  <div className={styles.typeIconWrapper}>
                    {getTypeIcon(link.type)}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'summary',
            header: 'Summary',
            align: 'center',
            render: (link) => {
              const linkId = link.id;
              const isHovered = hoveredRowId === linkId;
              return (
                <div className={styles.summaryCell}>
                  {link.summary ? (
                    <button
                      className={styles.summaryIconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSummaryModal(link);
                      }}
                      title="View summary"
                      aria-label="View summary"
                    >
                      <FiBookOpen className={styles.summaryIcon} />
                    </button>
                  ) : (
                    <span className={styles.noSummary}>—</span>
                  )}
                  <div 
                    ref={(el) => {
                      if (el) {
                        infoIconRefs.current[linkId] = el;
                      }
                    }}
                    className={`${styles.infoIconContainer} ${isHovered ? styles.infoIconVisible : styles.infoIconHidden}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInfoIconClick(linkId, formatDate(link.created_at), link.url || 'No source', e);
                    }}
                  >
                    <FiInfo className={styles.infoIcon} />
                  </div>
                  <ActionMenu
                    onDelete={() => handleDeleteClick('link', link.id, link.name || undefined)}
                    onMove={() => handleMoveClick('link', link.id, link.folder_id)}
                    isVisible={isHovered}
                    className={styles.actionIconsInCell}
                    showMove={true}
                  />
                </div>
              );
            },
          },
        ];

        // Get unique link types for filter
        const uniqueTypes = Array.from(new Set(linksData.saved_links.map(link => link.type.toUpperCase()))).sort();
        const linkTypes = ['WEBPAGE', 'YOUTUBE', 'LINKEDIN', 'TWITTER', 'REDDIT', 'FACEBOOK', 'INSTAGRAM'];
        const availableTypes = linkTypes.filter(type => uniqueTypes.includes(type));
        
        // Filter links based on selected types
        const filteredLinks = selectedLinkTypes.size === 0 
          ? linksData.saved_links 
          : linksData.saved_links.filter(link => selectedLinkTypes.has(link.type.toUpperCase()));

        const handleTypeFilterToggle = (type: string) => {
          setSelectedLinkTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
              newSet.delete(type);
            } else {
              newSet.add(type);
            }
            return newSet;
          });
        };

        return (
          <>
            <div className={styles.tableHeaderWithButton}>
              <div className={styles.typeFilterContainer} ref={typeFilterRef}>
                <button
                  className={styles.typeFilterButton}
                  onClick={handleToggleTypeFilter}
                  title="Filter by type"
                >
                  <span>Filter types</span>
                  <FiChevronDown className={`${styles.filterChevron} ${isTypeFilterOpen ? styles.filterChevronOpen : ''}`} />
                </button>
                {(isTypeFilterOpen || isTypeFilterClosing) && (
                  <div className={`${styles.typeFilterDropdown} ${isTypeFilterClosing ? styles.typeFilterDropdownClosing : ''}`}>
                    {availableTypes.map((type) => (
                      <label key={type} className={styles.typeFilterOption}>
                        <input
                          type="checkbox"
                          checked={selectedLinkTypes.has(type)}
                          onChange={() => handleTypeFilterToggle(type)}
                        />
                        <span>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                className={styles.addButton}
                onClick={() => setIsAddLinkModalOpen(true)}
                title="Add new link"
              >
                <FiPlus />
                <span>Add link</span>
              </button>
            </div>
            <div className={styles.linkTableWrapper}>
              <DataTable
                columns={linkColumns}
                data={filteredLinks}
                emptyMessage="No links found"
                rowKey={(link) => link.id}
                onRowHover={(link) => {
                  if (link) {
                    setHoveredRowId(link.id);
                  } else {
                    setHoveredRowId(null);
                    if (hoveredInfoId && !infoIconRefs.current[hoveredInfoId]) {
                      setHoveredInfoId(null);
                      setTooltipPosition(null);
                      setTooltipData(null);
                    }
                  }
                }}
              />
            </div>
            {linksLoadingMore && (
              <div className={styles.loadingMore}>Loading more...</div>
            )}
          </>
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

        // Word table columns
        const wordColumns: Column<SavedWord>[] = [
          {
            key: 'word',
            header: 'Word',
            align: 'left',
            render: (word) => {
              const isHovered = hoveredRowId === word.id;
              return (
                <div className={styles.wordCell}>
                  <button
                    className={`${styles.copyButton} ${isHovered ? styles.visible : ''}`}
                    onClick={() => handleCopyWord(word.word, word.id)}
                    title="Copy word"
                  >
                    {copiedWordId === word.id ? <FiCheck /> : <FiCopy />}
                  </button>
                  <span>{word.word}</span>
                </div>
              );
            },
          },
          {
            key: 'meaning',
            header: 'Meaning',
            align: 'left',
            render: (word) => word.contextualMeaning || 'No meaning available',
          },
          {
            key: 'source',
            header: 'Source',
            align: 'left',
            render: (word) => {
              const wordId = word.id;
              const isHovered = hoveredRowId === wordId;
              return (
                <div className={styles.sourceCell}>
                  {word.sourceUrl ? (
                    <a 
                      href={word.sourceUrl}
                      onClick={(e) => handleWordSourceClick(e, word.sourceUrl, word.word)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.iconLink}
                      title={word.sourceUrl}
                    >
                      <FiExternalLink />
                    </a>
                  ) : (
                    <span className={styles.noSource}>—</span>
                  )}
                  <div 
                    ref={(el) => {
                      if (el) {
                        infoIconRefs.current[wordId] = el;
                      }
                    }}
                    className={`${styles.infoIconContainer} ${isHovered ? styles.infoIconVisible : styles.infoIconHidden}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInfoIconClick(wordId, formatDate(word.createdAt), word.sourceUrl || 'No source', e);
                    }}
                  >
                    <FiInfo className={styles.infoIcon} />
                  </div>
                  <ActionMenu
                    onDelete={() => handleDeleteClick('word', word.id)}
                    onMove={() => handleMoveClick('word', word.id, word.folderId)}
                    isVisible={isHovered}
                    className={styles.actionIconsInCell}
                    showMove={true}
                  />
                </div>
              );
            },
          },
        ];

        return (
          <>
            <DataTable
              columns={wordColumns}
              data={wordsData.words}
              emptyMessage="No words found"
              rowKey={(word) => word.id}
              onRowHover={(word) => {
                if (word) {
                  setHoveredRowId(word.id);
                } else {
                  setHoveredRowId(null);
                  if (hoveredInfoId && !infoIconRefs.current[hoveredInfoId]) {
                    setHoveredInfoId(null);
                    setTooltipPosition(null);
                    setTooltipData(null);
                  }
                }
              }}
            />
            {wordsLoadingMore && (
              <div className={styles.loadingMore}>Loading more...</div>
            )}
          </>
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
          <>
            {imagesData.images.length === 0 ? (
              <div className={styles.emptyState}>No images found</div>
            ) : (
              <>
                <div className={styles.imagesGrid}>
                  {imagesData.images.map((image) => (
                    <div
                      key={image.id}
                      className={styles.imageCard}
                      onMouseEnter={() => setHoveredRowId(image.id)}
                      onMouseLeave={() => {
                        setHoveredRowId(null);
                        if (hoveredInfoId !== image.id) {
                          setHoveredInfoId(null);
                          setTooltipPosition(null);
                          setTooltipData(null);
                        }
                      }}
                    >
                      <div className={styles.imageCardWrapper}>
                        <img
                          src={image.imageUrl}
                          alt={image.name || 'Image'}
                          className={styles.imagePreview}
                          onClick={() => {
                            setSelectedImage({
                              url: image.imageUrl,
                              name: image.name,
                              sourceUrl: image.sourceUrl,
                              id: image.id,
                              createdAt: image.createdAt
                            });
                            setIsImageModalOpen(true);
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {/* Source icon on top right */}
                        {image.sourceUrl && (
                          <a
                            href={image.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.imageCardSourceIcon}
                            title={image.sourceUrl}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FiExternalLink />
                          </a>
                        )}
                        {/* Info icon on top left (shown on hover) */}
                        <div
                          ref={(el) => {
                            if (el) {
                              infoIconRefs.current[image.id] = el;
                            }
                          }}
                          className={`${styles.imageCardInfoIcon} ${hoveredRowId === image.id ? styles.infoIconVisible : styles.infoIconHidden}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInfoIconClick(image.id, formatDate(image.createdAt), image.sourceUrl || 'No source', e);
                          }}
                        >
                          <FiInfo className={styles.infoIcon} />
                        </div>
                        {/* Action menu on bottom right (shown on hover) */}
                        <div className={styles.imageCardActions}>
                          <ActionMenu
                            onDelete={() => handleDeleteClick('image', image.id, image.name || undefined)}
                            onMove={() => handleMoveClick('image', image.id, image.folderId)}
                            isVisible={hoveredRowId === image.id}
                            className={styles.actionIconsOnImage}
                            showMove={true}
                          />
                        </div>
                      </div>
                      {image.name && (
                        <div className={styles.imageCardName}>{image.name}</div>
                      )}
                    </div>
                  ))}
                </div>
                {imagesLoadingMore && (
                  <div className={styles.loadingMore}>Loading more...</div>
                )}
              </>
            )}
            {/* Image Modal */}
            {isImageModalOpen && selectedImage && (
              <div 
                className={`${styles.imageModalOverlay} ${isImageModalClosing ? styles.imageModalOverlayClosing : ''}`}
                onClick={handleCloseImageModal}
              >
                <div 
                  className={`${styles.imageModal} ${isImageModalClosing ? styles.imageModalClosing : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.imageModalHeader}>
                    <div className={styles.imageModalTitle}>
                      {selectedImage.name || ''}
                    </div>
                    <div className={styles.imageModalIcons}>
                      {selectedImage.sourceUrl && (
                        <a
                          href={selectedImage.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.imageModalSource}
                          title={selectedImage.sourceUrl}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiExternalLink />
                        </a>
                      )}
                      {selectedImage.id && (
                        <div
                          className={styles.imageModalInfoIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedImage.id) {
                              const target = e.currentTarget as HTMLElement;
                              if (target) {
                                const rect = target.getBoundingClientRect();
                                setTooltipPosition({
                                  top: rect.top - 20,
                                  left: rect.left + rect.width / 2
                                });
                                setTooltipData({ 
                                  bookmarkTime: selectedImage.createdAt ? formatDate(selectedImage.createdAt) : 'N/A', 
                                  source: selectedImage.sourceUrl || 'No source' 
                                });
                                setHoveredInfoId(selectedImage.id);
                              }
                            }
                          }}
                        >
                          <FiInfo className={styles.infoIcon} />
                        </div>
                      )}
                      <button
                        className={styles.imageModalClose}
                        onClick={handleCloseImageModal}
                        aria-label="Close"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                  <div className={styles.imageModalContent}>
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.name || 'Image'}
                      className={styles.imageModalImage}
                    />
                  </div>
                </div>
          </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  const anyTabLoading =
    paragraphsLoading || linksLoading || wordsLoading || imagesLoading;

  return (
    <div className={styles.folderBookmark}>
      <div 
        className={`${styles.container} ${isAskAIPanelOpen ? styles.containerWithPanel : ''}`}
        style={isAskAIPanelOpen ? {
          width: containerWidth ? `${containerWidth}px` : 'calc(100vw - 560px)',
          maxWidth: 'none',
          maxHeight: scrollContainerHeight ? `${scrollContainerHeight}px` : undefined,
          overflowX: 'auto',
          overflowY: 'auto',
        } : undefined}
      >
        <div className={styles.headerSection}>
          <div className={styles.headerActionsRow}>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/user/dashboard/bookmark')}
            >
              <FiArrowLeft />
              <span>Back to Dashboard</span>
            </button>
            <button
              className={`${styles.refreshAllButton} ${showRefreshSuccess ? styles.refreshAllButtonSuccess : ''}`}
              onClick={handleRefreshAll}
              disabled={isRefreshingAll || anyTabLoading}
              title="Refresh all tabs"
            >
              {showRefreshSuccess ? (
                <>
                  <FiCheck />
                  <span>Data fetched</span>
                </>
              ) : (
                <>
                  <FiRefreshCw
                    className={isRefreshingAll ? styles.spin : ''}
                  />
                  <span>Refresh all</span>
                </>
              )}
            </button>
          </div>
          <h1 className={styles.heading}>{folderName}</h1>
        </div>

        <div className={styles.tabContainer}>
          <div className={styles.tabs}>
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'paragraph' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('paragraph')}
              >
                <span>Paragraphs</span>
              </button>
            </div>
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'link' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('link')}
              >
                <span>Links</span>
              </button>
            </div>
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'word' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('word')}
              >
                <span>Words</span>
              </button>
            </div>
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${activeTab === 'image' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('image')}
              >
                <span>Images</span>
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
      {/* Tooltip */}
      {hoveredInfoId && tooltipPosition && tooltipData && (
        <div
          className={styles.tooltip}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Prevent closing when clicking on tooltip itself
          }}
        >
          <div>Bookmark time: {tooltipData.bookmarkTime}</div>
          <div>Source: {tooltipData.source}</div>
        </div>
      )}

      {/* Paragraph Content Modal */}
      {isParagraphModalOpen && selectedParagraph && (
        <div 
          className={`${styles.paragraphModalOverlay} ${isParagraphModalClosing ? styles.paragraphModalOverlayClosing : ''}`}
          onClick={handleCloseParagraphModal}
        >
          <div 
            className={`${styles.paragraphModal} ${isParagraphModalClosing ? styles.paragraphModalClosing : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.paragraphModalHeader}>
              <div className={styles.paragraphModalTitle}>
                {selectedParagraph.name || 'Paragraph Content'}
              </div>
              <div className={styles.paragraphModalIcons}>
                {selectedParagraph.source_url && (
                  <a
                    href={selectedParagraph.source_url}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleParagraphSourceClick(e, selectedParagraph.source_url, selectedParagraph.content);
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.paragraphModalSource}
                    title={selectedParagraph.source_url}
                  >
                    <FiExternalLink />
                  </a>
                )}
                <button
                  className={styles.paragraphModalCopy}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyParagraph(selectedParagraph.content, selectedParagraph.id);
                  }}
                  title="Copy paragraph"
                >
                  {copiedParagraphId === selectedParagraph.id ? <FiCheck /> : <FiCopy />}
                </button>
                <button
                  className={styles.paragraphModalClose}
                  onClick={handleCloseParagraphModal}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div className={styles.paragraphModalContent}>
              <div className={styles.paragraphModalText}>
                {selectedParagraph.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Summary Modal */}
      {isSummaryModalOpen && selectedLinkSummary && (
        <div 
          className={`${styles.summaryModalOverlay} ${isSummaryModalClosing ? styles.summaryModalOverlayClosing : ''}`}
          onClick={handleCloseSummaryModal}
        >
          <div 
            className={`${styles.summaryModal} ${isSummaryModalClosing ? styles.summaryModalClosing : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.summaryModalHeader}>
              <div className={styles.summaryModalHeaderContent}>
                {selectedLinkSummary.name && (
                  <div className={styles.summaryModalName}>
                    {selectedLinkSummary.name}
                  </div>
                )}
                <div className={styles.summaryModalSubtitle}>
                  Summary of{' '}
                  <a
                    href={selectedLinkSummary.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.summaryModalUrl}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selectedLinkSummary.url}
                  </a>
                </div>
              </div>
              <button
                className={styles.summaryModalClose}
                onClick={handleCloseSummaryModal}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
            <div className={styles.summaryModalContent}>
              <div className={styles.summaryModalText}>
                <ReactMarkdown>{selectedLinkSummary.summary}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {isAddLinkModalOpen && (
        <div 
          className={`${styles.addLinkModalOverlay} ${isAddLinkModalClosing ? styles.addLinkModalOverlayClosing : ''}`}
          onClick={handleCloseAddLinkModal}
        >
          <div 
            className={`${styles.addLinkModal} ${isAddLinkModalClosing ? styles.addLinkModalClosing : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.addLinkModalHeader}>
              <h2 className={styles.addLinkModalTitle}>Add New Link</h2>
              <button
                className={styles.addLinkModalClose}
                onClick={handleCloseAddLinkModal}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
            <div className={styles.addLinkModalBody}>
              <div className={styles.addLinkFormGroup}>
                <label htmlFor="link-url" className={styles.addLinkLabel}>
                  URL <span className={styles.required}>*</span>
                </label>
                <input
                  id="link-url"
                  type="url"
                  className={styles.addLinkInput}
                  placeholder="https://example.com"
                  value={addLinkForm.url}
                  onChange={(e) => setAddLinkForm({ ...addLinkForm, url: e.target.value })}
                  maxLength={1024}
                  required
                  autoFocus
                />
              </div>
              <div className={styles.addLinkFormGroup}>
                <label htmlFor="link-name" className={styles.addLinkLabel}>
                  Name
                </label>
                <input
                  id="link-name"
                  type="text"
                  className={styles.addLinkInput}
                  placeholder="Enter link name"
                  value={addLinkForm.name}
                  onChange={(e) => setAddLinkForm({ ...addLinkForm, name: e.target.value })}
                  maxLength={100}
                />
              </div>
            </div>
            <div className={styles.addLinkModalFooter}>
              <button
                className={styles.addLinkCancelButton}
                onClick={handleCloseAddLinkModal}
              >
                Cancel
              </button>
              <button
                className={styles.addLinkSaveButton}
                onClick={handleSaveLink}
                disabled={isSavingLink || !addLinkForm.url.trim()}
              >
                {isSavingLink ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Confirm Delete"
          message={
            deleteConfirm.name
              ? `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
              : 'Are you sure you want to delete this item? This action cannot be undone.'
          }
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Folder Selection Modal */}
      {isFolderModalOpen && moveItem && (
        <FolderSelectionModal
          isOpen={isFolderModalOpen}
          onClose={() => {
            setIsFolderModalOpen(false);
            setMoveItem(null);
          }}
          onSelect={handleFolderSelect}
          folders={folders}
          isLoading={foldersLoading}
          currentFolderId={moveItem.currentFolderId}
        />
      )}

      {/* Ask AI Side Panel */}
      <AskAISidePanel
        isOpen={isAskAIPanelOpen}
        onClose={handleAskAIClose}
        selectedPrompt={selectedAskAIOption || undefined}
        onInputSubmit={handleAskAIInputSubmit}
        onStopRequest={handleAskAIStopRequest}
        onClearChat={handleClearChatHistory}
        isRequesting={isAskAIRequesting}
        chatMessages={askAIChatMessages}
        streamingText={askAIStreamingText}
      />
    </div>
  );
};

FolderBookmark.displayName = 'FolderBookmark';
