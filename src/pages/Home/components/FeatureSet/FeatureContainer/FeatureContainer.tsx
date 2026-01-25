import React, { useRef, useState, useEffect } from 'react';
import { VideoModal } from '../VideoModal/VideoModal';
import styles from './FeatureContainer.module.css';

interface FeatureContainerProps {
  title: string;
  videoUrl: string;
  bullets: string[];
  isReversed?: boolean; // If true, content on right, video on left
}

/**
 * FeatureContainer - Container with content and video in alternating layout
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const FeatureContainer: React.FC<FeatureContainerProps> = ({ 
  title, 
  videoUrl, 
  bullets,
  isReversed = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        threshold: 0.5,
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

  return (
    <>
      <div className={`${styles.featureContainer} ${isReversed ? styles.reversed : ''}`}>
        <div className={styles.contentSection}>
          <h3 className={styles.heading}>{title}</h3>
          <ul className={styles.bulletList}>
            {bullets.map((bullet, index) => (
              <li key={index} className={styles.bulletItem}>{bullet}</li>
            ))}
          </ul>
        </div>
        <div 
          ref={containerRef} 
          className={styles.videoSection} 
          onClick={handleVideoClick}
        >
          <video
            ref={videoRef}
            className={styles.video}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>
      <VideoModal
        isOpen={isModalOpen}
        videoUrl={videoUrl}
        title={title}
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

FeatureContainer.displayName = 'FeatureContainer';
