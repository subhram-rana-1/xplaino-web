import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare, Copy, Sparkles, MoreVertical,
  List, AlignJustify, FileText, Scale, Search, GraduationCap, Plus, BookMarked, ExternalLink,
} from 'lucide-react';
import styles from './PdfSelectionTrigger.module.css';
import type { HighlightColour } from '@/shared/services/pdfHighlightService';
import { normalisePdfText } from './pdfTextNormalise';
import type { CustomPromptResponse } from '@/shared/types/customPrompt.types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface SelectionState {
  text: string;
  x: number;
  y: number;
}

interface PdfSelectionTriggerProps {
  /** Container ref of the PDF content area to listen for selection events */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Hex color of the currently active highlight color */
  activeColour: string;
  /** All available highlight colours from the API */
  highlightColours: HighlightColour[];
  /** Currently selected colour id */
  selectedColourId: string | null;
  /** Called when user picks a different highlight colour */
  onColourChange: (id: string) => void;
  /** Called with startText and endText when user confirms highlight */
  onHighlight: (startText: string, endText: string, colourIdOverride?: string) => Promise<void>;
  /** Called when the highlight API call fails */
  onError?: (message: string) => void;
  /** Whether the user is currently logged in */
  isLoggedIn?: boolean;
  /** Called when user tries to highlight without being logged in */
  onLoginRequired?: () => void;
  /** Called when user clicks "Write a note" on a text selection */
  onWriteNote?: (startText: string, endText: string, clientY: number) => void;
  /** Called when user clicks "Explain" on a text selection */
  onExplain?: (startText: string, endText: string, selectedText: string, clientY: number) => void;
  /** Called when user clicks "Ask AI" or "+ Custom prompt" — opens side panel focused on input */
  onAskAI?: (startText: string, endText: string, selectedText: string, clientY: number) => void;
  /** Called when user picks a preset prompt from the 3-dot popover */
  onPromptSelect?: (startText: string, endText: string, selectedText: string, clientY: number, prompt: string) => void;
  /**
   * When set, intercepts Highlight and Note clicks instead of performing the action.
   * Used for public PDFs where the viewer cannot annotate but can make a copy.
   */
  onCopyRequired?: () => void;
  /** Called when user clicks "Add custom prompt" — opens the create custom prompt modal */
  onAddCustomPrompt?: () => void;
  /** User's saved custom prompts to show at the bottom of the 3-dot popover */
  customPrompts?: CustomPromptResponse[];
  /** Called when user picks a saved custom prompt — passes the prompt title and text separately */
  onCustomPromptSelect?: (title: string, startText: string, endText: string, selectedText: string, clientY: number, promptText: string) => void;
  /** Called when user clicks "Chat with PDF" — sends selected text to the RAG chat panel */
  onChatWithSelection?: (selectedText: string) => void;
}

const ICON_URL = 'https://bmicorrect.com/extension/icons/extension-tooltip-v2.ico';
const MAX_ANCHOR_CHARS = 50;
const WIDTH_ANIMATION_DURATION = 400;

/**
 * Listens for text selections inside the PDF content area and shows the
 * extension-style teal dot icon. On hover the dot shrinks and a pill-shaped
 * button group expands with Highlight, Write a Note and Copy actions.
 */
export const PdfSelectionTrigger: React.FC<PdfSelectionTriggerProps> = ({
  containerRef,
  activeColour,
  highlightColours,
  selectedColourId,
  onColourChange,
  onHighlight,
  onError,
  isLoggedIn = true,
  onLoginRequired,
  onWriteNote,
  onExplain,
  onAskAI,
  onPromptSelect,
  onCopyRequired,
  onAddCustomPrompt,
  customPrompts,
  onCustomPromptSelect,
  onChatWithSelection,
}) => {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showButtonGroup, setShowButtonGroup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [isHighlightBtnHovered, setIsHighlightBtnHovered] = useState(false);
  const [isColourPanelHovered, setIsColourPanelHovered] = useState(false);
  const [isColourPanelMounted, setIsColourPanelMounted] = useState(false);
  const [isColourPanelVisible, setIsColourPanelVisible] = useState(false);

  const containerElRef = useRef<HTMLDivElement>(null);
  const buttonGroupRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMeasuredWidthRef = useRef(0);
  const colourPanelLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colourPanelFadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showOptionsPopover, setShowOptionsPopover] = useState(false);
  const optionsHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsHovering(false);
    setShowButtonGroup(false);
  }, []);

  // ── Selection detection ────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = (e: MouseEvent) => {
      if (mouseupTimerRef.current) clearTimeout(mouseupTimerRef.current);

      mouseupTimerRef.current = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

        const selectedText = sel.toString().trim();

        const range = sel.getRangeAt(0);
        const ancestor = range.commonAncestorContainer;
        const el = ancestor instanceof Element ? ancestor : ancestor.parentElement;
        if (!el) return;

        const isInPdfTextLayer =
          el.closest('.react-pdf__Page__textContent') !== null ||
          el.closest('.react-pdf__Page') !== null;
        if (!isInPdfTextLayer) return;

        setSelection({
          text: selectedText,
          x: e.clientX + 24,
          y: e.clientY + 8,
        });
        setIsHovering(false);
        setShowButtonGroup(false);
      }, 10);
    };

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        clearSelection();
      }
    };

    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (mouseupTimerRef.current) clearTimeout(mouseupTimerRef.current);
    };
  }, [containerRef, clearSelection]);

  // ── Button group width animation (mirrors extension logic) ─────────────
  useEffect(() => {
    const element = buttonGroupRef.current;
    if (!element) return;

    if (!showButtonGroup) {
      setAnimationComplete(false);

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      const currentWidthValue = element.style.getPropertyValue('--button-group-width');
      const currentWidth = currentWidthValue ? parseFloat(currentWidthValue) : lastMeasuredWidthRef.current;

      if (currentWidth > 0) {
        setIsClosing(true);
        element.style.setProperty('--button-group-width', `${currentWidth}px`);
        void element.offsetWidth;

        requestAnimationFrame(() => {
          element.style.setProperty('--button-group-width', '0px');
        });

        closingTimeoutRef.current = setTimeout(() => {
          setIsClosing(false);
        }, WIDTH_ANIMATION_DURATION + 50);
      } else {
        element.style.setProperty('--button-group-width', '0px');
        setIsClosing(false);
      }
      return;
    }

    // Opening
    setAnimationComplete(false);
    setIsClosing(false);

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!element) return;

        const currentWidthValue = element.style.getPropertyValue('--button-group-width');
        const currentWidth = currentWidthValue ? parseFloat(currentWidthValue) : 0;

        const savedMaxWidth = element.style.maxWidth;
        element.style.maxWidth = 'none';
        element.style.width = 'auto';
        element.style.setProperty('--button-group-width', 'auto');
        void element.offsetWidth;

        const naturalWidth = element.scrollWidth;
        lastMeasuredWidthRef.current = naturalWidth;

        element.style.maxWidth = savedMaxWidth || '600px';
        element.style.width = '';

        if (currentWidth === 0) {
          element.style.setProperty('--button-group-width', '38px');
          void element.offsetWidth;
        }

        requestAnimationFrame(() => {
          if (!element) return;
          element.style.setProperty('--button-group-width', `${naturalWidth}px`);

          animationTimeoutRef.current = setTimeout(() => {
            setAnimationComplete(true);
          }, WIDTH_ANIMATION_DURATION + 100);
        });
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [showButtonGroup]);

  // ── Hover handlers ─────────────────────────────────────────────────────
  const handleIconMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsHovering(true);
    setShowButtonGroup(true);
  }, []);

  const handleContainerMouseLeave = useCallback((e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget;
    const isStillInContainer =
      relatedTarget instanceof Node && containerElRef.current?.contains(relatedTarget);

    if (!isStillInContainer) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowButtonGroup(false);
        setIsHovering(false);
      }, 200);
    }
  }, []);

  const handleContainerMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovering(true);
    setShowButtonGroup(true);
  }, []);

  // ── Colour panel hover handlers ────────────────────────────────────────
  const showColourPanel = useCallback(() => {
    if (colourPanelLeaveTimerRef.current) clearTimeout(colourPanelLeaveTimerRef.current);
    if (colourPanelFadeOutTimerRef.current) clearTimeout(colourPanelFadeOutTimerRef.current);
    setIsColourPanelMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsColourPanelVisible(true));
    });
  }, []);

  const hideColourPanel = useCallback(() => {
    setIsColourPanelVisible(false);
    colourPanelFadeOutTimerRef.current = setTimeout(() => setIsColourPanelMounted(false), 220);
  }, []);

  const handleHighlightBtnMouseEnter = useCallback(() => {
    if (colourPanelLeaveTimerRef.current) clearTimeout(colourPanelLeaveTimerRef.current);
    setIsHighlightBtnHovered(true);
    showColourPanel();
  }, [showColourPanel]);

  const handleHighlightBtnMouseLeave = useCallback(() => {
    colourPanelLeaveTimerRef.current = setTimeout(() => {
      setIsHighlightBtnHovered(false);
      if (!isColourPanelHovered) hideColourPanel();
    }, 120);
  }, [isColourPanelHovered, hideColourPanel]);

  const handleColourPanelMouseEnter = useCallback(() => {
    if (colourPanelLeaveTimerRef.current) clearTimeout(colourPanelLeaveTimerRef.current);
    setIsColourPanelHovered(true);
  }, []);

  const handleColourPanelMouseLeave = useCallback(() => {
    colourPanelLeaveTimerRef.current = setTimeout(() => {
      setIsColourPanelHovered(false);
      setIsHighlightBtnHovered(false);
      hideColourPanel();
    }, 120);
  }, [hideColourPanel]);

  const handleColourSelect = useCallback(async (id: string) => {
    if (!selection || isHighlighting) return;

    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    if (onCopyRequired) {
      onCopyRequired();
      return;
    }

    onColourChange(id);
    hideColourPanel();

    const normalisedText = normalisePdfText(selection.text);
    const startText = normalisedText.slice(0, MAX_ANCHOR_CHARS);
    const endText = normalisedText.slice(-MAX_ANCHOR_CHARS);

    setIsHighlighting(true);
    try {
      await onHighlight(startText, endText, id);
      window.getSelection()?.removeAllRanges();
      clearSelection();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to save highlight');
    } finally {
      setIsHighlighting(false);
    }
  }, [selection, isHighlighting, isLoggedIn, onLoginRequired, onCopyRequired, onColourChange, hideColourPanel, onHighlight, clearSelection, onError]);

  // ── Action handlers ────────────────────────────────────────────────────
  const handleHighlightClick = useCallback(async () => {
    if (!selection || isHighlighting) return;

    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    if (onCopyRequired) {
      onCopyRequired();
      return;
    }

    const normalisedText = normalisePdfText(selection.text);
    const startText = normalisedText.slice(0, MAX_ANCHOR_CHARS);
    const endText = normalisedText.slice(-MAX_ANCHOR_CHARS);

    setIsHighlighting(true);
    try {
      await onHighlight(startText, endText);
      window.getSelection()?.removeAllRanges();
      clearSelection();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to save highlight');
    } finally {
      setIsHighlighting(false);
    }
  }, [selection, isHighlighting, isLoggedIn, onLoginRequired, onCopyRequired, onHighlight, clearSelection, onError]);

  const handleCopyClick = useCallback(() => {
    // Try to copy the live DOM selection directly — most reliable for
    // preserving whitespace/line breaks from the PDF text layer.
    const winSel = window.getSelection();
    let copied = false;
    if (winSel && !winSel.isCollapsed) {
      try {
        copied = document.execCommand('copy');
      } catch {
        // fall through to clipboard API
      }
    }

    if (!copied && selection) {
      navigator.clipboard.writeText(selection.text).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = selection.text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
    }

    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, clearSelection]);

  const handleWriteNoteClick = useCallback(() => {
    if (!selection) return;

    if (isLoggedIn && onCopyRequired) {
      onCopyRequired();
      return;
    }

    const normalisedText = normalisePdfText(selection.text);
    const startText = normalisedText.slice(0, MAX_ANCHOR_CHARS);
    const endText = normalisedText.slice(-MAX_ANCHOR_CHARS);
    onWriteNote?.(startText, endText, selection.y);
    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, isLoggedIn, onCopyRequired, onWriteNote, clearSelection]);

  const handleExplainClick = useCallback(() => {
    if (!selection) return;
    const normalisedText = normalisePdfText(selection.text);
    const startText = normalisedText.slice(0, MAX_ANCHOR_CHARS);
    const endText = normalisedText.slice(-MAX_ANCHOR_CHARS);
    onExplain?.(startText, endText, selection.text, selection.y);
    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, onExplain, clearSelection]);

  const handleOptionsMouseEnter = useCallback(() => {
    if (optionsHideTimerRef.current) clearTimeout(optionsHideTimerRef.current);
    setShowOptionsPopover(true);
  }, []);

  const handleOptionsMouseLeave = useCallback(() => {
    optionsHideTimerRef.current = setTimeout(() => setShowOptionsPopover(false), 150);
  }, []);

  const handleAskAIOptionClick = useCallback(() => {
    if (!selection) return;
    setShowOptionsPopover(false);
    const normalisedText = normalisePdfText(selection.text);
    const startText = normalisedText.slice(0, MAX_ANCHOR_CHARS);
    const endText = normalisedText.slice(-MAX_ANCHOR_CHARS);
    onAskAI?.(startText, endText, selection.text, selection.y);
    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, onAskAI, clearSelection]);

  const handlePromptOptionClick = useCallback((prompt: string) => {
    if (!selection) return;
    setShowOptionsPopover(false);
    const normalisedText = normalisePdfText(selection.text);
    const startText = normalisedText.slice(0, MAX_ANCHOR_CHARS);
    const endText = normalisedText.slice(-MAX_ANCHOR_CHARS);
    onPromptSelect?.(startText, endText, selection.text, selection.y, prompt);
    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, onPromptSelect, clearSelection]);

  const handleAddCustomPromptClick = useCallback(() => {
    setShowOptionsPopover(false);
    window.getSelection()?.removeAllRanges();
    clearSelection();
    onAddCustomPrompt?.();
  }, [clearSelection, onAddCustomPrompt]);

  const handleChatWithSelectionClick = useCallback(() => {
    if (!selection) return;
    setShowOptionsPopover(false);
    onChatWithSelection?.(selection.text);
    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, onChatWithSelection, clearSelection]);

  const handleCustomPromptOptionClick = useCallback((title: string, promptText: string) => {
    if (!selection) return;
    setShowOptionsPopover(false);
    const normalisedText = normalisePdfText(selection.text);
    const startText = normalisedText.slice(0, MAX_ANCHOR_CHARS);
    const endText = normalisedText.slice(-MAX_ANCHOR_CHARS);
    if (onCustomPromptSelect) {
      onCustomPromptSelect(title, startText, endText, selection.text, selection.y, promptText);
    } else {
      onPromptSelect?.(startText, endText, selection.text, selection.y, promptText);
    }
    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selection, onCustomPromptSelect, onPromptSelect, clearSelection]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (mouseupTimerRef.current) clearTimeout(mouseupTimerRef.current);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      if (closingTimeoutRef.current) clearTimeout(closingTimeoutRef.current);
      if (colourPanelLeaveTimerRef.current) clearTimeout(colourPanelLeaveTimerRef.current);
      if (colourPanelFadeOutTimerRef.current) clearTimeout(colourPanelFadeOutTimerRef.current);
      if (optionsHideTimerRef.current) clearTimeout(optionsHideTimerRef.current);
    };
  }, []);

  if (!selection || typeof document === 'undefined') return null;

  const iconButtonClass = [
    styles.xplainoIconButton,
    isHovering ? styles.xplainoIconButtonHidden : styles.xplainoIconButtonVisible,
  ].join(' ');

  const buttonGroupClass = [
    styles.buttonGroup,
    showButtonGroup ? styles.buttonGroupVisible : '',
    isClosing ? styles.buttonGroupClosing : '',
    animationComplete ? styles.buttonGroupAnimationComplete : '',
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      ref={containerElRef}
      className={styles.container}
      style={{ left: selection.x, top: selection.y }}
      onMouseLeave={handleContainerMouseLeave}
      onMouseEnter={handleContainerMouseEnter}
    >
      {/* Teal dot icon */}
      <button
        className={iconButtonClass}
        onMouseEnter={handleIconMouseEnter}
        aria-label="Xplaino Actions"
        type="button"
      >
        <img src={ICON_URL} alt="Xplaino" className={styles.xplainoIcon} />
      </button>

      {/* Pill button group */}
      <div
        ref={buttonGroupRef}
        className={buttonGroupClass}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Explain */}
        {onExplain && (
          <div className={styles.actionButtonWrapper}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleExplainClick}
              aria-label="Explain selection"
            >
              <ExplainIcon />
            </button>
            <span className={styles.tooltip}>Explain</span>
          </div>
        )}

        {/* 3-dot options button */}
        {(onAskAI || onPromptSelect) && (
          <div
            className={`${styles.actionButtonWrapper} ${styles.optionsWrapper}`}
            onMouseEnter={handleOptionsMouseEnter}
            onMouseLeave={handleOptionsMouseLeave}
          >
            <button
              type="button"
              className={styles.actionButton}
              aria-label="More options"
              aria-haspopup="true"
              aria-expanded={showOptionsPopover}
            >
              <MoreVertical size={17} />
            </button>
            <span className={styles.tooltip}>More</span>

            {showOptionsPopover && (
              <div
                className={styles.optionsPopover}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {onAskAI && (
                  <button
                    type="button"
                    className={styles.optionItem}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); handleAskAIOptionClick(); }}
                  >
                    <Sparkles size={15} />
                    <span>Ask AI</span>
                  </button>
                )}

                {onChatWithSelection && (
                  <button
                    type="button"
                    className={styles.optionItem}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); handleChatWithSelectionClick(); }}
                  >
                    <MessageSquare size={15} />
                    <span>Chat with PDF</span>
                  </button>
                )}

                {onPromptSelect && (
                  <>
                    <button type="button" className={styles.optionItem} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handlePromptOptionClick('What are the key points of this text?'); }}>
                      <List size={15} /><span>Key points</span>
                    </button>
                    <button type="button" className={styles.optionItem} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handlePromptOptionClick('Convert this text into concise bullet points.'); }}>
                      <AlignJustify size={15} /><span>Convert to bullet points</span>
                    </button>
                    <button type="button" className={styles.optionItem} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handlePromptOptionClick('Summarize this text in 3-4 sentences.'); }}>
                      <FileText size={15} /><span>Summarize</span>
                    </button>
                    <button type="button" className={styles.optionItem} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handlePromptOptionClick('What are the key legal implications of this text?'); }}>
                      <Scale size={15} /><span>Legal implications</span>
                    </button>
                    <button type="button" className={styles.optionItem} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handlePromptOptionClick('What research gaps or open questions does this text raise?'); }}>
                      <Search size={15} /><span>Research gaps</span>
                    </button>
                    <button type="button" className={styles.optionItem} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handlePromptOptionClick('Create concise study notes from this text.'); }}>
                      <GraduationCap size={15} /><span>Create study notes</span>
                    </button>
                  </>
                )}

                {customPrompts && customPrompts.length > 0 && (
                  <>
                    <hr className={styles.optionsSeparator} />
                    {customPrompts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={styles.optionItem}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomPromptOptionClick(p.title, stripHtml(p.description) || p.title);
                        }}
                      >
                        <BookMarked size={15} />
                        <span>{p.title}</span>
                      </button>
                    ))}
                  </>
                )}

                <button
                  type="button"
                  className={`${styles.optionItem} ${styles.optionItemCustom}`}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); handleAddCustomPromptClick(); }}
                >
                  <Plus size={15} />
                  <span>Add custom prompt</span>
                </button>

                <a
                  href="/user/account/custom-prompt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.optionItem} ${styles.optionItemLink}`}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={15} />
                  <span>View all custom prompts</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Highlight — coloured circle with hover colour panel below */}
        <div className={`${styles.actionButtonWrapper} ${styles.highlightWrapper}`}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.highlightActionButton}`}
            onClick={handleHighlightClick}
            disabled={isHighlighting}
            aria-label="Highlight selected text"
            onMouseEnter={handleHighlightBtnMouseEnter}
            onMouseLeave={handleHighlightBtnMouseLeave}
          >
            {isHighlighting ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <span
                className={styles.colorCircle}
                style={{ background: activeColour }}
              />
            )}
          </button>
          {isColourPanelMounted && (
            <div
              className={[
                styles.colorPickerPopover,
                isColourPanelVisible ? styles.colorPickerVisible : styles.colorPickerHidden,
                isHighlightBtnHovered && !isColourPanelHovered ? styles.colourPanelDimmed : '',
              ].filter(Boolean).join(' ')}
              onMouseEnter={handleColourPanelMouseEnter}
              onMouseLeave={handleColourPanelMouseLeave}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {highlightColours.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.colourDot} ${c.id === selectedColourId ? styles.colourDotSelected : ''}`}
                  style={{ background: c.hexcode }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleColourSelect(c.id)}
                  aria-label={`Select colour ${c.hexcode}`}
                >
                  {c.id === selectedColourId && (
                    <span className={styles.colourCheck} aria-hidden="true">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <span className={styles.tooltip}>Highlight</span>
        </div>

        {/* Write a note */}
        <div className={styles.actionButtonWrapper}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleWriteNoteClick}
            aria-label="Write a note"
          >
            <NoteIcon />
          </button>
          <span className={styles.tooltip}>Write a note</span>
        </div>

        {/* Copy with formatting */}
        <div className={styles.actionButtonWrapper}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleCopyClick}
            aria-label="Copy selection"
          >
            <CopyIcon />
          </button>
          <span className={styles.tooltip}>Copy selection</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Icon components ──────────────────────────────────────────────────────────

function NoteIcon() {
  return <MessageSquare size={17} aria-hidden="true" />;
}

function CopyIcon() {
  return <Copy size={17} aria-hidden="true" />;
}

function ExplainIcon() {
  return <Sparkles size={17} aria-hidden="true" />;
}

PdfSelectionTrigger.displayName = 'PdfSelectionTrigger';
