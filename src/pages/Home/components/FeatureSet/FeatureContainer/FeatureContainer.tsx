import React, { useRef, useState, useEffect } from 'react';
import { VideoModal } from '../VideoModal/VideoModal';
import styles from './FeatureContainer.module.css';

interface FeatureContainerProps {
  title: string;
  videoUrl: string;
  bullets: string[];
  icon?: string;
  thumbnailImage?: string;
}

/**
 * FeatureContainer - Compact feature card with video and expandable description
 * Shows video + title by default, reveals description below on hover (desktop) or tap (mobile)
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const FeatureContainer: React.FC<FeatureContainerProps> = ({ 
  title, 
  videoUrl, 
  bullets,
  thumbnailImage
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInCenter, setIsInCenter] = useState(false);
  
  // IntersectionObserver for scroll-based scaling on mobile
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInCenter(entry.intersectionRatio > 0.6);
        });
      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
        rootMargin: '-20% 0px -20% 0px'
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // After collapsing on mobile, force reflow so border-radius repaints (fixes sharp corners until click outside)
  useEffect(() => {
    if (isExpanded) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void containerRef.current?.offsetHeight;
      });
    });
    return () => cancelAnimationFrame(id);
  }, [isExpanded]);

  const handleVideoClick = () => {
    setIsModalOpen(true);
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <>
      <div 
        ref={containerRef}
        className={`${styles.featureContainer} ${isExpanded ? styles.expanded : ''} ${isInCenter ? styles.centered : ''}`}
      >
        {/* Video Section - shows video first frame as thumbnail, opens modal on click */}
        <div 
          ref={videoSectionRef}
          className={styles.videoSection} 
          onClick={handleVideoClick}
        >
          <div className={styles.thumbnailWrapper}>
            {thumbnailImage ? (
              <img
                src={thumbnailImage}
                alt=""
                className={styles.thumbnail}
                aria-hidden
              />
            ) : (
              <video
                src={videoUrl}
                preload="auto"
                muted
                playsInline
                aria-hidden
                className={styles.thumbnail}
              />
            )}
            <div className={styles.playOverlay} aria-hidden="true">
              <span className={styles.playIcon}>▶</span>
            </div>
          </div>
        </div>

        {/* Title Section - always visible below video */}
        <div className={styles.titleSection}>
          <h3 className={styles.heading}>
            {title}
          </h3>
          
          {/* Expand indicator for mobile */}
          <button 
            className={styles.expandButton}
            onClick={handleExpandToggle}
            aria-label={isExpanded ? "Collapse description" : "Expand description"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        {/* Description Section - expands on hover (desktop) or tap (mobile) */}
        <div className={styles.descriptionSection}>
          <ul className={styles.bulletList}>
            {bullets.map((bullet, index) => (
              <li key={index} className={styles.bulletItem}>{bullet}</li>
            ))}
          </ul>
        </div>
      </div>

      <VideoModal
        isOpen={isModalOpen}
        videoUrl={videoUrl}
        title={title}
        bullets={bullets}
        sourceElement={videoSectionRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

FeatureContainer.displayName = 'FeatureContainer';
