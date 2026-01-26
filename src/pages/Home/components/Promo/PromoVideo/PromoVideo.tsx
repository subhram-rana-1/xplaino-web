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
          src="https://ik.imagekit.io/subhram/xplaino/website-videos/promo-v2.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
      <VideoModal
        isOpen={isModalOpen}
        videoUrl="https://ik.imagekit.io/subhram/xplaino/website-videos/promo-v2.mp4"
        title="Maximise your contextual understanding with AI"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

PromoVideo.displayName = 'PromoVideo';

