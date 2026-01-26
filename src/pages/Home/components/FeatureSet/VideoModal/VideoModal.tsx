import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './VideoModal.module.css';

interface VideoModalProps {
  isOpen: boolean;
  videoUrl: string;
  title: string;
  sourceElement?: HTMLElement | null;
  onClose: () => void;
}

/**
 * VideoModal - Modal component for playing videos with controls
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, videoUrl, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const wasOpenRef = useRef<boolean>(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  }, [onClose]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      wasOpenRef.current = true;
      // Store current scroll position
      scrollPositionRef.current = window.scrollY;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    } else if (!isOpen && wasOpenRef.current) {
      setIsClosing(false);
      wasOpenRef.current = false;
      // Restore scroll position
      const scrollY = scrollPositionRef.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
      scrollPositionRef.current = 0;
    }
    
    return () => {
      // Cleanup on unmount
      if (document.body.style.position === 'fixed') {
        const scrollY = scrollPositionRef.current;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen && !isClosing) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div 
        className={`${styles.modalContent} ${isClosing ? styles.modalClosing : isOpen ? styles.modalOpening : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close modal">
          ×
        </button>
        <h3 className={styles.modalTitle}>{title}</h3>
        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            className={styles.video}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
        <div className={styles.controls}>
          <button className={styles.controlButton} onClick={handlePlayPause}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className={styles.seekBar}
          />
          <span className={styles.time}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

VideoModal.displayName = 'VideoModal';
