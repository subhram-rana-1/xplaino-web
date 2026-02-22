import React, { useRef, useState, useEffect } from 'react';
import { VideoModal } from '../../FeatureSet/VideoModal/VideoModal';
import styles from './PromoVideo.module.css';

const PROMO_VIDEO_URL = 'https://bmicorrect.com/website/website_1902_720_2.webm';

/**
 * PromoVideo - Interactive promo video player with modal
 *
 * @returns JSX element
 */
export const PromoVideo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVideoClick = () => {
    setIsModalOpen(true);
  };

  // IntersectionObserver for viewport-based autoplay
  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    const video = videoRef.current;

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

    const currentContainer = containerRef.current;
    observer.observe(currentContainer);

    const rect = currentContainer.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(viewportHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const elementHeight = rect.height;
    const isInViewport = (visibleHeight / elementHeight) >= 0.5;

    if (isInViewport) {
      video.play().catch(() => {});
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={styles.promoVideo}
        onClick={handleVideoClick}
      >
        <video
          ref={videoRef}
          className={styles.video}
          src={PROMO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          title="Web Research & Second Brain – Summarize, Translate & Understand Any Webpage"
        />
      </div>
      <VideoModal
        isOpen={isModalOpen}
        videoUrl={PROMO_VIDEO_URL}
        title="Web Research & Second Brain – Summarize, Translate & Understand Any Webpage"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

PromoVideo.displayName = 'PromoVideo';
