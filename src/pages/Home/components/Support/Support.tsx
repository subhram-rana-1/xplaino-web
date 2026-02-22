import React, { useRef, useState, useEffect } from 'react';
import { ScrollReveal } from '@/shared/components/ScrollReveal';
import { VideoModal } from '../FeatureSet/VideoModal/VideoModal';
import styles from './Support.module.css';

const SUPPORT_VIDEO_URL = 'https://bmicorrect.com/website/features/videos/custoemr-centric.webm';

/**
 * Support - Support section with text on left and video on right
 *
 * @returns JSX element
 */
export const Support: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVideoClick = () => {
    setIsModalOpen(true);
  };

  const description = 'Report issues right from the extension, get real support from real people — not bots or endless FAQs — and share feature ideas that help shape what we build next.';

  // IntersectionObserver for viewport-based autoplay
  useEffect(() => {
    if (!videoSectionRef.current || !videoRef.current) return;

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

    const currentVideoSection = videoSectionRef.current;
    observer.observe(currentVideoSection);

    const rect = currentVideoSection.getBoundingClientRect();
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
      <ScrollReveal variant="fadeUp">
        <div className={styles.supportWrapper}>
        <section className={styles.support} ref={containerRef}>
          <div className={styles.container}>
            {/* Left side - Text content */}
            <div className={styles.textSection}>
              <h2 className={styles.heading}>
                <span className={styles.icon}>💚</span>
                We've got your back — always
              </h2>
              <p className={styles.description}>{description}</p>
            </div>

            {/* Right side - Video */}
            <div
              ref={videoSectionRef}
              className={styles.videoSection}
              onClick={handleVideoClick}
            >
              <video
                ref={videoRef}
                className={styles.video}
                src={SUPPORT_VIDEO_URL}
                autoPlay
                muted
                loop
                playsInline
                title="We've got your back — always"
              />
            </div>
          </div>
        </section>
        </div>
      </ScrollReveal>
      <VideoModal
        isOpen={isModalOpen}
        videoUrl={SUPPORT_VIDEO_URL}
        title="We've got your back — always"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

Support.displayName = 'Support';
