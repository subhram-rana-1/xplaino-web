import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import { ChromeButton } from '@/shared/components/ChromeButton';
import { PromoText } from './PromoText/PromoText';
import { PromoVideo } from './PromoVideo/PromoVideo';
import pdfIcon from '@/assets/images/pdf.webp';
import styles from './Promo.module.css';

/**
 * Promo - Promo section component with text and video
 * 
 * @returns JSX element
 */
export const Promo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.promoWrapper}>
        <section className={styles.promo}>
          <div className={styles.promoLeft}>
            <PromoText />
          </div>
          <div className={styles.promoRight}>
            <PromoVideo />
          </div>
          <div className={styles.buttonRow}>
            <button
              className={styles.pdfButton}
              onClick={() => navigate('/tools/pdf')}
            >
              <img src={pdfIcon} alt="" aria-hidden className={styles.pdfButtonIcon} />
              <span className={styles.pdfButtonText}>Try PDF for Free</span>
            </button>
            <ChromeButton />
          </div>
        </section>
      </div>
    </ScrollReveal>
  );
};

Promo.displayName = 'Promo';

