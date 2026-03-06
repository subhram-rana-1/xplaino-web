import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, FileText } from 'lucide-react';
import { getAllPdfs } from '@/shared/services/pdf.service';
import type { PdfResponse } from '@/shared/types/pdf.types';
import styles from './PdfSelectorPopover.module.css';

export interface PdfSelectorPopoverProps {
  folderId: string | undefined;
  currentPdfId: string | undefined;
  currentPdfName?: string;
  accessToken: string | null;
  onSelect: (pdf: PdfResponse) => void;
}

export const PdfSelectorPopover: React.FC<PdfSelectorPopoverProps> = ({
  folderId,
  currentPdfId,
  currentPdfName,
  accessToken,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfs, setPdfs] = useState<PdfResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min((pdfs.length || 3) * 44, 260);
      const spaceBelow = window.innerHeight - rect.bottom;

      const top = spaceBelow < estimatedHeight + 8 && rect.top > estimatedHeight + 8
        ? rect.top + window.scrollY - estimatedHeight - 4
        : rect.bottom + window.scrollY + 4;

      setPopoverPosition({ top, left: rect.left + window.scrollX });
    } else {
      setPopoverPosition(null);
    }
  }, [isOpen, pdfs.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const handleOpen = async () => {
    if (isOpen) { setIsOpen(false); return; }
    setIsOpen(true);
    if (!folderId || !accessToken) return;
    setLoading(true);
    try {
      const result = await getAllPdfs(accessToken, folderId);
      setPdfs(result.pdfs ?? []);
    } catch {
      setPdfs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (pdf: PdfResponse) => {
    setIsOpen(false);
    onSelect(pdf);
  };

  if (!folderId) return null;

  const popoverContent = isOpen && popoverPosition ? (
    <div
      ref={popoverRef}
      className={`${styles.popover} ${styles.popoverOpen}`}
      style={{ top: popoverPosition.top, left: popoverPosition.left }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {loading ? (
        <div className={styles.loadingMsg}>Loading…</div>
      ) : pdfs.length === 0 ? (
        <div className={styles.loadingMsg}>No PDFs in folder</div>
      ) : (
        pdfs.map((pdf) => (
          <button
            key={pdf.id}
            className={`${styles.pdfItem} ${pdf.id === currentPdfId ? styles.pdfItemActive : ''}`}
            onClick={() => handleSelect(pdf)}
            title={pdf.file_name}
          >
            <FileText className={styles.pdfIcon} />
            <span className={styles.pdfName}>
              {pdf.file_name.length > 22 ? `${pdf.file_name.slice(0, 22)}...` : pdf.file_name}
            </span>
          </button>
        ))
      )}
    </div>
  ) : null;

  const displayPdfName = currentPdfName
    ? (currentPdfName.length > 14 ? `${currentPdfName.slice(0, 14)}...` : currentPdfName)
    : 'Select PDF';

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>PDF</span>
      <button
        ref={buttonRef}
        className={styles.triggerButton}
        onClick={handleOpen}
      >
        <span className={styles.triggerValue}>{displayPdfName}</span>
        <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </button>
      {popoverContent && createPortal(popoverContent, document.body)}
    </div>
  );
};

PdfSelectorPopover.displayName = 'PdfSelectorPopover';
