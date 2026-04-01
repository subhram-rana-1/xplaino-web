import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import { ChromeButton } from '@/shared/components/ChromeButton';
import { PdfButton } from '@/shared/components/PdfButton';
import { PromoText } from './PromoText/PromoText';
import { PromoVideo } from './PromoVideo/PromoVideo';
import styles from './Promo.module.css';

/**
 * Promo - Promo section component with text and video
 * 
 * @returns JSX element
 */
export const Promo: React.FC = () => {
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
            <PdfButton />
            <ChromeButton />
          </div>
        </section>
      </div>
    </ScrollReveal>
  );
};

Promo.displayName = 'Promo';

