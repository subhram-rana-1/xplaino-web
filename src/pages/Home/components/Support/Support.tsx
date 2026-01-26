import React, { useRef, useEffect } from 'react';
import styles from './Support.module.css';

/**
 * Support - Support section with text on left and video on right
 * 
 * @returns JSX element
 */
export const Support: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const bullets = [
    'Report any issue directly from the extension — your time and money matter to us, so we prioritize resolving it fast',
    'Get real support from real people who care about your experience, not bots or endless FAQs',
    'Request new features you\'d find useful in your day-to-day — your ideas help shape what we build next'
  ];

  return (
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
        <div className={styles.videoSection}>
          <video
            ref={videoRef}
            className={styles.video}
            src=""
            loop
            muted
            playsInline
          />
        </div>
      </div>
    </section>
  );
};

Support.displayName = 'Support';
