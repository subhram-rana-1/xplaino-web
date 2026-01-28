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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  // Check if the video URL is a YouTube embed
  const isYouTubeEmbed = videoUrl.includes('youtube.com/embed');
  
  // Extract YouTube video ID and build URL with parameters for autoplay and looping
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = url.split('/embed/')[1]?.split('?')[0];
    if (!videoId) return url;
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&cc_load_policy=0&fs=0&color=white&autohide=1&vq=hd720`;
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!isYouTubeEmbed) return;

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
  }, [isYouTubeEmbed]);

  // Initialize YouTube player
  useEffect(() => {
    if (!isYouTubeEmbed || !isApiReady || !iframeRef.current) return;

    youtubePlayerRef.current = new window.YT.Player(iframeRef.current, {
      events: {
        onReady: () => {
          setIsPlayerReady(true);
        }
      }
    });

    return () => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
        youtubePlayerRef.current.destroy();
        setIsPlayerReady(false);
      }
    };
  }, [isYouTubeEmbed, isApiReady]);

  // IntersectionObserver for viewport-based autoplay
  useEffect(() => {
    if (!containerRef.current) return;
    
    // For YouTube videos, wait until player is ready
    if (isYouTubeEmbed && !isPlayerReady) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (isYouTubeEmbed && youtubePlayerRef.current) {
              try {
                youtubePlayerRef.current.seekTo(0, true);
                youtubePlayerRef.current.playVideo();
              } catch (error) {
                console.log('YouTube player control error:', error);
              }
            } else if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch((error) => {
                console.log('Autoplay prevented:', error);
              });
            }
          } else {
            if (isYouTubeEmbed && youtubePlayerRef.current) {
              try {
                youtubePlayerRef.current.pauseVideo();
              } catch (error) {
                console.log('YouTube player control error:', error);
              }
            } else if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    const currentContainer = containerRef.current;
    observer.observe(currentContainer);

    // Check if already in viewport when observer is set up (50% threshold)
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
      if (isYouTubeEmbed && youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.seekTo(0, true);
          youtubePlayerRef.current.playVideo();
        } catch (error) {
          console.log('YouTube player control error:', error);
        }
      } else if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((error) => {
          console.log('Autoplay prevented:', error);
        });
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [isYouTubeEmbed, isPlayerReady]);

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
          {isYouTubeEmbed ? (
            <iframe
              ref={iframeRef}
              className={styles.video}
              src={getYouTubeEmbedUrl(videoUrl)}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              className={styles.video}
              src={videoUrl}
              loop
              muted
              playsInline
            />
          )}
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
        videoUrl={isYouTubeEmbed ? `${videoUrl.split('?')[0]}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&vq=hd720` : videoUrl}
        title={title}
        bullets={bullets}
        sourceElement={videoSectionRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

FeatureContainer.displayName = 'FeatureContainer';
