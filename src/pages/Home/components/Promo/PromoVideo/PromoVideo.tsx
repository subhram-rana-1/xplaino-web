import React, { useRef, useState } from 'react';
import { VideoModal } from '../../FeatureSet/VideoModal/VideoModal';
import styles from './PromoVideo.module.css';

/**
 * PromoVideo - Interactive promo video player with modal
 * 
 * @returns JSX element
 */
export const PromoVideo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVideoClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div 
        ref={containerRef} 
        className={styles.promoVideo}
        onClick={handleVideoClick}
      >
        <video
          className={styles.video}
          src="https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
      <VideoModal
        isOpen={isModalOpen}
        videoUrl="https://static-web.maxai.photos/videos/landing/homepage-v3/primary.mp4?t=1"
        title="Maximise your contextual understanding with AI"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

PromoVideo.displayName = 'PromoVideo';

