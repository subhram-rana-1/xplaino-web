import React from 'react';
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
    <div className={styles.promoWrapper}>
      <section className={styles.promo}>
        <PromoText />
        <PromoVideo />
      </section>
    </div>
  );
};

Promo.displayName = 'Promo';

