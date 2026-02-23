import React, { useRef, useCallback } from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import { FaQuoteLeft } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './QuoteTestimonials.module.css';

const SCROLL_STEP = 340;
const IMAGE_BASE = 'https://bmicorrect.com/website/testimonials/images';

const testimonials = [
  {
    quote: 'It feels like having a research assistant built into my browser.',
    outcome: 'I can analyze academic papers, translate foreign journals, and save insights without breaking my workflow.',
    name: 'Ahmed M.',
    role: 'Researcher',
    location: 'Egypt',
    image: 'ahmed.webp',
  },
  {
    quote: 'I stopped bookmarking articles and started actually understanding them.',
    outcome: 'Xplaino helps me summarize research papers in minutes and keeps everything organized for revision.',
    name: 'Emma K.',
    role: 'Student',
    location: 'USA',
    image: 'emma.webp',
  },
  {
    quote: 'This completely changed how I process reports.',
    outcome: 'Instead of skimming long documents, I now get structured summaries and retain key insights.',
    name: 'Marco R.',
    role: 'Professional',
    location: 'Italy',
    image: 'macro.webp',
  },
  {
    quote: 'Reading foreign content no longer slows me down.',
    outcome: 'I can translate and understand articles instantly without losing context.',
    name: 'Sofia L.',
    role: 'Language Learner',
    location: 'Spain',
    image: 'sofia.webp',
  },
  {
    quote: 'Summaries and translations in one place — no more switching tools.',
    outcome: 'My thesis research got faster and my notes stay linked to the source.',
    name: 'Lukas B.',
    role: 'Student',
    location: 'Germany',
    image: 'lucas.webp',
  },
  {
    quote: 'Finally, a tool that respects how I actually read and learn.',
    outcome: 'I use it daily for papers and client reports across three languages.',
    name: 'Fatima Al-H.',
    role: 'Consultant',
    location: 'UAE',
    image: 'fatima.webp',
  },
];

/**
 * QuoteTestimonials - Outcome-based testimonials after Feature Grid, before Differentiation
 * Placement: high-conversion spot for external validation.
 *
 * @returns JSX element
 */
export const QuoteTestimonials: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
    }
  }, []);

  return (
    <ScrollReveal variant="fadeUp">
      <div className={styles.wrapper}>
        <section className={styles.section} aria-labelledby="quote-testimonials-heading">
          <h2 id="quote-testimonials-heading" className={styles.heading}>
            Trusted by Professionals, Researchers & Students
          </h2>
          <div className={styles.carouselWrapper}>
            <button
              type="button"
              className={styles.scrollBtn}
              onClick={scrollLeft}
              aria-label="Scroll testimonials left"
            >
              <FiChevronLeft />
            </button>
            <div
              ref={scrollRef}
              className={styles.scrollContainer}
              role="region"
              aria-label="Testimonials carousel"
            >
              <div className={styles.grid}>
                {testimonials.map((t, index) => (
                  <article key={index} className={styles.card}>
                    <span className={styles.quoteIcon} aria-hidden>
                      <FaQuoteLeft />
                    </span>
                    <p className={styles.quote}>{t.quote}</p>
                    <p className={styles.outcome}>{t.outcome}</p>
                    <footer className={styles.footer}>
                      <img
                        src={`${IMAGE_BASE}/${t.image}`}
                        alt=""
                        className={styles.avatar}
                        width={40}
                        height={40}
                        loading="lazy"
                      />
                      <div className={styles.footerText}>
                        <span className={styles.name}>— {t.name}</span>
                        <span className={styles.role}>{t.role} · {t.location}</span>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
            </div>
            <button
              type="button"
              className={styles.scrollBtn}
              onClick={scrollRight}
              aria-label="Scroll testimonials right"
            >
              <FiChevronRight />
            </button>
          </div>
        </section>
      </div>
    </ScrollReveal>
  );
};

QuoteTestimonials.displayName = 'QuoteTestimonials';
