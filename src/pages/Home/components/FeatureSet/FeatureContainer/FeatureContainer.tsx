import React, { useRef, useState, useEffect } from 'react';
import { VideoModal } from '../VideoModal/VideoModal';
import styles from './FeatureContainer.module.css';

interface FeatureContainerProps {
  title: string;
  videoUrl: string;
  bullets: string[];
  icon?: string;
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
  icon
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play().catch((error) => {
              console.log('Autoplay prevented:', error);
            });
          } else if (videoRef.current) {
            videoRef.current.pause();
          }
        });
      },
      {
        threshold: 0.3,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const handleVideoClick = () => {
    setIsModalOpen(true);
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  return (
    <>
      <div 
        ref={containerRef}
        className={`${styles.featureContainer} ${isExpanded ? styles.expanded : ''}`}
      >
        {/* Video Section - clickable to open modal */}
        <div 
          ref={videoSectionRef}
          className={styles.videoSection} 
          onClick={handleVideoClick}
        >
          <video
            ref={videoRef}
            className={styles.video}
            src={videoUrl}
            loop
            muted
            playsInline
          />
        </div>

        {/* Title Section - always visible below video */}
        <div className={styles.titleSection}>
          <h3 className={styles.heading}>
            {icon && <span className={styles.icon}>{icon}</span>}
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
