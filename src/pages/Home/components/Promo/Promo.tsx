import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import { ChromeButton } from '@/shared/components/ChromeButton';
import { PdfButton } from '@/shared/components/PdfButton';
import { PromoText } from './PromoText/PromoText';
import { PromoVideo } from './PromoVideo/PromoVideo';
import { UserCheck, CreditCard } from 'lucide-react';
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
            <div className={styles.ctaGroup}>
              <PdfButton />
              <span className={styles.ctaProof}><strong className={styles.ctaProofNumber}>3K+</strong> Happy users</span>
            </div>
            <div className={styles.ctaGroup}>
              <ChromeButton label="Add to Chrome — It's Free" />
              <span className={styles.ctaProof}>
                <span className={styles.ctaProofStar}>★</span>
                <strong className={styles.ctaProofNumber}>4.9</strong>
                <span> · Chrome Web Store</span>
              </span>
            </div>
          </div>
          <div className={styles.trustRow}>
            <span className={styles.trustTag}>
              <UserCheck size={13} className={styles.trustTagIcon} />
              No signup required
            </span>
            <span className={styles.trustDivider}>·</span>
            <span className={styles.trustTag}>
              <CreditCard size={13} className={styles.trustTagIcon} />
              No credit card required
            </span>
          </div>
          <p className={styles.trustedBy}>
            Trusted by Professionals, Researchers &amp; Students
          </p>
        </section>
      </div>
    </ScrollReveal>
  );
};

Promo.displayName = 'Promo';

