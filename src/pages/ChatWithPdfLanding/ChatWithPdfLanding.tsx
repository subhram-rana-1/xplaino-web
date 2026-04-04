import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Highlighter, Users, Upload, Bot, CheckCircle, FileText, RotateCcw, Lock, UserCheck, CreditCard } from 'lucide-react';
import { VideoModal } from '@/pages/Home/components/FeatureSet/VideoModal/VideoModal';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import pdfIcon from '@/assets/images/pdf.webp';
import styles from './ChatWithPdfLanding.module.css';

const PROMO_VIDEO_URL = 'https://bmicorrect.com/website/features/videos/pdf-chat.webm';
const CYCLING_WORDS = ['Research', 'Legal Docs', 'PDF Docs'];

const STATS = [
  { icon: <FileText size={28} />, value: '10K+', label: 'Documents Analyzed' },
  { icon: <MessageSquare size={28} />, value: '100K+', label: 'Questions Answered' },
  { icon: <Users size={28} />, value: '3K+', label: 'Happy Users' },
  { icon: <CheckCircle size={28} />, value: '99%', label: 'Accuracy Rate' },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: <Upload size={28} />,
    title: 'Upload',
    description: 'Drop your PDF file — research paper, contract, textbook, or any document.',
  },
  {
    step: 2,
    icon: <MessageSquare size={28} />,
    title: 'Ask',
    description: 'Type any question, or pick a saved custom prompt you built for this use case.',
  },
  {
    step: 3,
    icon: <Bot size={28} />,
    title: 'Get Answers',
    description: 'AI responds with precise answers, citations, and relevant highlights.',
  },
];

const FEATURES = [
  {
    icon: <MessageSquare size={26} />,
    title: 'Ask Anything',
    description: 'Conversational AI that understands context across your entire document — not just keyword search.',
  },
  {
    icon: <RotateCcw size={26} />,
    title: 'Custom Prompts',
    description: 'Build prompts once for your specific workflow — summarise clauses, extract data, explain terms — and reuse them every session.',
  },
  {
    icon: <Highlighter size={26} />,
    title: 'Highlight & Notes',
    description: 'Mark key passages and drop personal notes directly on the page. Everything is saved automatically.',
  },
  {
    icon: <Users size={26} />,
    title: 'Share & Collaborate',
    description: 'Invite teammates, share annotated PDFs, and leave threaded comments — all in real time.',
  },
];

export const ChatWithPdfLanding: React.FC = () => {
  usePageTitle('Chat with PDF – Xplaino AI');
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Cycle words every 2 s with slide-up transition
  useEffect(() => {
    const t = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % CYCLING_WORDS.length);
        setAnimating(false);
      }, 300);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  // IntersectionObserver autoplay for the promo video
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

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
    observer.observe(container);

    const rect = container.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visibleRatio = Math.max(0, Math.min(vh, rect.bottom) - Math.max(0, rect.top)) / rect.height;
    if (visibleRatio >= 0.5) video.play().catch(() => {});

    return () => observer.disconnect();
  }, []);

  const handleCta = useCallback(() => {
    navigate('/tools/pdf');
  }, [navigate]);

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heading}>
            Chat with your{' '}
            <span className={`${styles.cyclingWord} ${animating ? styles.cyclingWordExit : styles.cyclingWordEnter}`}>
              {CYCLING_WORDS[wordIdx]}
            </span>
          </h1>

          <div className={styles.miniFeatureGrid}>
            {[
              { icon: <Upload size={16} />, label: 'Upload & Ask Anything' },
              { icon: <RotateCcw size={16} />, label: 'Write Prompt Once, Reuse' },
              { icon: <Highlighter size={16} />, label: 'Highlight & Add Notes' },
              { icon: <Users size={16} />, label: 'Share & Collaborate' },
            ].map((item) => (
              <div key={item.label} className={styles.miniFeatureItem}>
                <span className={styles.miniFeatureIcon}>{item.icon}</span>
                <span className={styles.miniFeatureLabel}>{item.label}</span>
              </div>
            ))}
          </div>

          <button className={styles.ctaButton} onClick={handleCta}>
            <img src={pdfIcon} alt="" aria-hidden className={styles.ctaIcon} />
            Upload your PDF — It's Free
          </button>

          <div className={styles.secureRow}>
            <span className={styles.secureTag}>
              <Lock size={13} className={styles.secureTagIcon} />
              100% secure, end to end encrypted
            </span>
            <span className={styles.secureTagDivider}>·</span>
            <span className={styles.secureTag}>
              <UserCheck size={13} className={styles.secureTagIcon} />
              No sign up required
            </span>
            <span className={styles.secureTagDivider}>·</span>
            <span className={styles.secureTag}>
              <CreditCard size={13} className={styles.secureTagIcon} />
              No credit card
            </span>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div
            ref={containerRef}
            className={styles.videoContainer}
            onClick={() => setIsModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Watch Chat with PDF demo"
            onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
          >
            <video
              ref={videoRef}
              className={styles.video}
              src={PROMO_VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
              title="Chat with PDF — Xplaino"
            />
            <div className={styles.playOverlay}>
              <div className={styles.playIcon}>▶</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statIcon}>{s.icon}</div>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className={styles.howSection}>
        <h2 className={styles.sectionTitle}>How It Works</h2>

        <div className={styles.stepsRow}>
          {HOW_IT_WORKS.map((item, i) => (
            <React.Fragment key={item.step}>
              <div className={styles.step}>
                <div className={styles.stepCircle}>
                  <span className={styles.stepNumber}>{item.step}</span>
                </div>
                <div className={styles.stepIcon}>{item.icon}</div>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDesc}>{item.description}</p>
              </div>
              {i < HOW_IT_WORKS.length - 1 && (
                <div className={styles.stepConnector} aria-hidden />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────────── */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Why choose Xplaino PDF?</h2>
        <p className={styles.sectionSubtitle}>Everything you need to work smarter with documents</p>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureCardIcon}>{f.icon}</div>
              <h3 className={styles.featureCardTitle}>{f.title}</h3>
              <p className={styles.featureCardDesc}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA strip ─────────────────────────────────────────────── */}
      <section className={styles.bottomCta}>
        <h2 className={styles.bottomCtaTitle}>Ready to understand your documents faster?</h2>
        <p className={styles.bottomCtaSubtitle}>
          Join thousands of users who save hours analysing documents with AI. No signup required.
        </p>
        <button className={styles.ctaButton} onClick={handleCta}>
          <img src={pdfIcon} alt="" aria-hidden className={styles.ctaIcon} />
          Upload your PDF — It's Free
        </button>
        <p className={styles.bottomCtaNote}>No credit card · Free to start</p>
      </section>

      <VideoModal
        isOpen={isModalOpen}
        videoUrl={PROMO_VIDEO_URL}
        title="Chat with PDF — Xplaino AI PDF Reader"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

ChatWithPdfLanding.displayName = 'ChatWithPdfLanding';
