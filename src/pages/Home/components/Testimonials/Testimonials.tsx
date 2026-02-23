import React from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import styles from './Testimonials.module.css';

const TESTIMONIAL_IMAGE_BASE = 'https://bmicorrect.com/website/testimonials/images/testimoinal';
const testimonialCount = 6;

/**
 * Testimonials - User testimonials section "They love Xplaino" with screenshot images
 *
 * @returns JSX element
 */
export const Testimonials: React.FC = () => {
  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section} aria-labelledby="testimonials-heading">
          <h2 id="testimonials-heading" className={styles.heading}>
            They love Xplaino
          </h2>
          <div className={styles.list}>
            {Array.from({ length: testimonialCount }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                className={`${styles.imageWrapper} ${num % 2 === 1 ? styles.alignLeft : styles.alignRight}`}
              >
                <img
                  src={`${TESTIMONIAL_IMAGE_BASE}-${num}.webp`}
                  alt={`Testimonial ${num}`}
                  className={styles.image}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </ScrollReveal>
  );
};

Testimonials.displayName = 'Testimonials';
