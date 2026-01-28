import React, { useRef, useState, useEffect } from 'react';
import { VideoModal } from '../FeatureSet/VideoModal/VideoModal';
import styles from './Support.module.css';

/**
 * Support - Support section with text on left and video on right
 * 
 * @returns JSX element
 */
export const Support: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const handleVideoClick = () => {
    setIsModalOpen(true);
  };

  const youtubeVideoId = 'Z-ULCeNCCBo';

  const bullets = [
    'Report any issue directly from the extension — your time and money matter to us, so we prioritize resolving it fast',
    'Get real support from real people who care about your experience, not bots or endless FAQs',
    'Request new features you\'d find useful in your day-to-day — your ideas help shape what we build next'
  ];

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
    if (!videoSectionRef.current || !isPlayerReady || !playerRef.current) return;

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

    const currentVideoSection = videoSectionRef.current;
    observer.observe(currentVideoSection);

    // Check if already in viewport when player becomes ready (50% threshold)
    const rect = currentVideoSection.getBoundingClientRect();
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
      <div className={styles.supportWrapper}>
        <section className={styles.support} ref={containerRef}>
          <div className={styles.container}>
            {/* Left side - Text content */}
            <div className={styles.textSection}>
              <h2 className={styles.heading}>
                <span className={styles.icon}>💚</span>
                We've got your back — always
              </h2>
              <ul className={styles.bulletList}>
                {bullets.map((bullet, index) => (
                  <li key={index} className={styles.bulletItem}>{bullet}</li>
                ))}
              </ul>
            </div>

            {/* Right side - Video */}
            <div 
              ref={videoSectionRef}
              className={styles.videoSection} 
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
          </div>
        </section>
      </div>
      <VideoModal
        isOpen={isModalOpen}
        videoUrl={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&vq=hd720`}
        title="We've got your back — always"
        bullets={bullets}
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

Support.displayName = 'Support';
