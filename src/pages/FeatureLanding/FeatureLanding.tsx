import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import { VideoModal } from '@/pages/Home/components/FeatureSet/VideoModal/VideoModal';
import { getFeatureBySlug, CHROME_STORE_URL, WEBPAGE_FEATURES, PDF_FEATURES } from '@/config/features.config';
import { trackCtaConversion } from '@/shared/utils/trackConversion';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import chromeIcon from '@/assets/images/google-chrome-icon.png';
import pdfIcon from '@/assets/images/pdf.webp';
import styles from './FeatureLanding.module.css';

interface FeatureLandingProps {
  slug: string;
}

/**
 * FeatureLanding - Data-driven Google Ads landing page for a single Xplaino feature.
 * Layout: text left, video + compact other-features grid right — all above the fold.
 */
export const FeatureLanding: React.FC<FeatureLandingProps> = ({ slug }) => {
  const feature = getFeatureBySlug(slug);
  usePageTitle(feature ? `${feature.navTitle} – Xplaino AI` : 'Xplaino AI');
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // IntersectionObserver-based autoplay (same pattern as PromoVideo)
  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const container = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(container);

    const rect = container.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visibleHeight = Math.max(0, Math.min(vh, rect.bottom) - Math.max(0, rect.top));
    if (visibleHeight / rect.height >= 0.5) {
      video.play().catch(() => {});
    }

    return () => observer.disconnect();
  }, []);

  const handleCtaClick = () => {
    if (!feature) return;
    if (feature.ctaAction === 'extension') {
      trackCtaConversion();
      window.open(CHROME_STORE_URL, '_blank', 'noopener,noreferrer');
    } else {
      trackCtaConversion(() => navigate('/tools/pdf'));
    }
  };

  if (!feature) {
    return (
      <div className={styles.notFound}>
        <h1>Feature not found</h1>
      </div>
    );
  }

  // Split heading into before-highlight and highlight parts
  const highlightIdx = feature.heading.indexOf(feature.headingHighlight);
  const headingBefore = highlightIdx > 0 ? feature.heading.slice(0, highlightIdx) : '';
  const headingAfter =
    highlightIdx >= 0
      ? feature.heading.slice(highlightIdx + feature.headingHighlight.length)
      : '';

  const otherFeatures =
    feature.ctaAction === 'extension'
      ? WEBPAGE_FEATURES.filter((f) => f.slug !== slug)
      : PDF_FEATURES.filter((f) => f.slug !== slug);

  return (
    <div className={styles.page}>
      <ScrollReveal variant="fadeUp">
        <div className={styles.promoWrapper}>
          <section className={styles.promo}>
            {/* ── Left: copy ─────────────────────────────────────────────── */}
            <div className={styles.promoLeft}>
              <div className={styles.promoText}>
                <h1 className={styles.heading}>
                  {headingBefore}
                  <span className={styles.headingHighlight}>{feature.headingHighlight}</span>
                  {headingAfter}
                </h1>
                <p className={styles.description}>{feature.description}</p>
                <p className={styles.tagline}>{feature.tagline}</p>
                {/* Rating + CTA grouped with extra top margin */}
                <div className={styles.ctaGroup}>
                  {feature.ctaAction === 'extension' && (
                    <div className={styles.ratingRow}>
                      <span className={styles.ratingStars}>★★★★★</span>
                      <span className={styles.ratingScore}>4.9/5</span>
                      <span className={styles.ratingLabel}>on Chrome Web Store</span>
                    </div>
                  )}
                  <button className={styles.ctaButton} onClick={handleCtaClick}>
                    <img
                      src={feature.ctaAction === 'extension' ? chromeIcon : pdfIcon}
                      alt=""
                      aria-hidden
                      className={styles.ctaIcon}
                    />
                    {feature.ctaLabel}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right: video + compact features grid ────────────────────── */}
            <div className={styles.promoRight}>
              <div className={styles.rightColumn}>
                {/* Video */}
                <div
                  ref={containerRef}
                  className={styles.videoContainer}
                  onClick={() => setIsModalOpen(true)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Watch ${feature.navTitle} demo`}
                  onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
                >
                  <video
                    ref={videoRef}
                    className={styles.video}
                    src={feature.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    title={feature.videoTitle}
                  />
                  <div className={styles.playOverlay}>
                    <div className={styles.playIcon}>▶</div>
                  </div>
                </div>

                {/* Compact other-features grid */}
                {(otherFeatures.length > 0 || (feature.additionalChips && feature.additionalChips.length > 0)) && (
                  <div className={styles.featuresGrid}>
                    <p className={styles.featuresGridLabel}>
                      {feature.ctaAction === 'extension'
                        ? 'One install. Everything unlocked.'
                        : 'More inside the PDF tool.'}
                    </p>
                    <div className={styles.featuresGridItems}>
                      {otherFeatures.map((f) => (
                        <div key={f.slug} className={styles.featureChip}>
                          <span className={styles.featureChipDot} aria-hidden />
                          <span className={styles.featureChipName}>{f.navTitle}</span>
                        </div>
                      ))}
                      {feature.additionalChips?.map((label) => (
                        <div key={label} className={styles.featureChip}>
                          <span className={styles.featureChipDot} aria-hidden />
                          <span className={styles.featureChipName}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </ScrollReveal>

      <VideoModal
        isOpen={isModalOpen}
        videoUrl={feature.videoUrl}
        title={feature.videoTitle}
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

FeatureLanding.displayName = 'FeatureLanding';
