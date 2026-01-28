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

  const youtubeVideoId = 'ziaFZV3RRbI';

  return (
    <>
      <div 
        ref={containerRef} 
        className={styles.promoVideo}
        onClick={handleVideoClick}
      >
        <iframe
          className={styles.video}
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&modestbranding=1&vq=hd720`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <VideoModal
        isOpen={isModalOpen}
        videoUrl={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&vq=hd720`}
        title="Maximise your contextual understanding with AI"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

PromoVideo.displayName = 'PromoVideo';

