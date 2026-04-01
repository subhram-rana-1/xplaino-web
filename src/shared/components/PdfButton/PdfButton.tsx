import React from 'react';
import { useNavigate } from 'react-router-dom';
import pdfIcon from '@/assets/images/pdf.webp';
import styles from './PdfButton.module.css';

/**
 * PdfButton - Reusable PDF tool CTA button
 */
export const PdfButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button className={styles.pdfButton} onClick={() => navigate('/tools/pdf')}>
      <img src={pdfIcon} alt="" aria-hidden className={styles.pdfButtonIcon} />
      <span className={styles.pdfButtonText}>Try PDF — It's Free</span>
    </button>
  );
};

PdfButton.displayName = 'PdfButton';
