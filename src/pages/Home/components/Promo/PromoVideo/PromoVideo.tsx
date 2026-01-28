import React, { useRef, useState, useEffect } from 'react';
import { VideoModal } from '../../FeatureSet/VideoModal/VideoModal';
import styles from './PromoVideo.module.css';

/**
 * PromoVideo - Interactive promo video player with modal
 * 
 * @returns JSX element
 */
export const PromoVideo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const handleVideoClick = () => {
    setIsModalOpen(true);
  };

  const youtubeVideoId = 'ziaFZV3RRbI';

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already fully ready
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    // Check if script is already added
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Store previous callback to chain them
    const previousCallback = window.onYouTubeIframeAPIReady;
    
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      setIsApiReady(true);
    };
    
    // Poll for API readiness in case callback was missed
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    if (!isApiReady || !iframeRef.current) return;

    playerRef.current = new window.YT.Player(iframeRef.current, {
      events: {
        onReady: () => {
          setIsPlayerReady(true);
        }
      }
    });

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        setIsPlayerReady(false);
      }
    };
  }, [isApiReady]);

  // IntersectionObserver for viewport-based autoplay
  useEffect(() => {
    if (!containerRef.current || !isPlayerReady || !playerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && playerRef.current) {
            try {
              playerRef.current.seekTo(0, true);
              playerRef.current.playVideo();
            } catch (error) {
              console.log('YouTube player control error:', error);
            }
          } else if (playerRef.current) {
            try {
              playerRef.current.pauseVideo();
            } catch (error) {
              console.log('YouTube player control error:', error);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const currentContainer = containerRef.current;
    observer.observe(currentContainer);

    // Check if already in viewport when player becomes ready (50% threshold)
    const rect = currentContainer.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Calculate visible height
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(viewportHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const elementHeight = rect.height;
    
    // Check if at least 50% is visible
    const isInViewport = (visibleHeight / elementHeight) >= 0.5;
    
    if (isInViewport) {
      try {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      } catch (error) {
        console.log('YouTube player control error:', error);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [isPlayerReady]);

  return (
    <>
      <div 
        ref={containerRef} 
        className={styles.promoVideo}
        onClick={handleVideoClick}
      >
        <iframe
          ref={iframeRef}
          className={styles.video}
          src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&origin=${window.location.origin}&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&modestbranding=1&vq=hd720`}
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

