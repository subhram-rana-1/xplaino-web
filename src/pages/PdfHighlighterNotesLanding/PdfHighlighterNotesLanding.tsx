import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackCtaConversion } from '@/shared/utils/trackConversion';
import { Highlighter, MessageSquare, NotebookPen, Users, Upload, Share2, Lock, CreditCard, Globe, Bookmark } from 'lucide-react';
import { VideoModal } from '@/pages/Home/components/FeatureSet/VideoModal/VideoModal';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import pdfIcon from '@/assets/images/pdf.webp';
import styles from '@/pages/ChatWithPdfLanding/ChatWithPdfLanding.module.css';

const PROMO_VIDEO_URL = 'https://bmicorrect.com/website/features/videos/pdf-highlight-and-notes.webm';
const CYCLING_WORDS = ['Research', 'Notes', 'PDFs'];

const STATS = [
  { icon: <Highlighter size={28} />, value: '500K+', label: 'Highlights Created' },
  { icon: <NotebookPen size={28} />, value: '200K+', label: 'Notes Written' },
  { icon: <Users size={28} />, value: '3K+', label: 'Happy Users' },
  { icon: <Lock size={28} />, value: '100%', label: 'Data Secure' },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: <Upload size={28} />,
    title: 'Upload',
    description: 'Drop your PDF — any research paper, contract, or textbook.',
  },
  {
    step: 2,
    icon: <Highlighter size={28} />,
    title: 'Highlight & Annotate',
    description: 'Select text, add personal notes, and pin comments directly on the page.',
  },
  {
    step: 3,
    icon: <Share2 size={28} />,
    title: 'Share & Collaborate',
    description: 'Invite others and sync annotations in real time across every device.',
  },
];

const FEATURES = [
  {
    icon: <Highlighter size={26} />,
    title: 'Text Highlights',
    description: 'Select any passage and highlight it in one click. Highlights persist across every session.',
  },
  {
    icon: <NotebookPen size={26} />,
    title: 'Personal Notes',
    description: 'Add margin notes tied to exact page locations. Your private workspace, always saved automatically.',
  },
  {
    icon: <MessageSquare size={26} />,
    title: 'Pinned Comments',
    description: 'Leave contextual comments anywhere on the page. Reply, resolve, and keep discussions in context.',
  },
  {
    icon: <Users size={26} />,
    title: 'Share & Collaborate',
    description: 'Invite teammates or classmates. All annotations sync in real time across every device.',
  },
];

export const PdfHighlighterNotesLanding: React.FC = () => {
  usePageTitle('PDF Highlighter & Notes – Xplaino AI');
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

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
    trackCtaConversion(() => navigate('/tools/pdf'));
  }, [navigate]);

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heading} style={{ display: 'block' }}>
            Highlight &amp; Add notes in your{' '}
            <span className={`${styles.cyclingWord} ${animating ? styles.cyclingWordExit : styles.cyclingWordEnter}`}>
              {CYCLING_WORDS[wordIdx]}
            </span>
          </h1>

          <div className={styles.miniFeatureGrid}>
            {[
              { icon: <Highlighter size={16} />, label: 'Highlight & Add Notes' },
              { icon: <MessageSquare size={16} />, label: 'Pin Comments Anywhere' },
              { icon: <NotebookPen size={16} />, label: 'Personal Saved Notes' },
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
            aria-label="Watch PDF Highlighter & Notes demo"
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
              title="PDF Highlighter & Notes — Xplaino"
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
        <p className={styles.sectionSubtitle}>Everything you need to annotate and collaborate on documents</p>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureCardIcon}>{f.icon}</div>
              <h3 className={styles.featureCardTitle}>{f.title}</h3>
              <p className={styles.featureCardDesc}>{f.description}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2.5rem 0 1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--teal-rgba-10, rgba(26,158,143,0.15))' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary, #999)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Also included</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--teal-rgba-10, rgba(26,158,143,0.15))' }} />
        </div>
        <div className={styles.featuresGrid}>
          {[
            { icon: <MessageSquare size={22} />, label: 'Chat with PDF', desc: 'Ask AI anything about your PDF and get instant, precise answers.' },
            { icon: <Globe size={22} />, label: 'Chat with Webpage', desc: 'Ask AI questions on any article or webpage — no copy-pasting needed.' },
            { icon: <Bookmark size={22} />, label: 'Web Highlighter & Notes', desc: 'Highlight text and save notes on any website, synced to your dashboard.' },
            { icon: <Users size={22} />, label: 'Share & Collaborate', desc: 'Invite teammates to view and annotate documents together in real time.' },
          ].map((item) => (
            <div key={item.label} className={styles.featureCard}>
              <div className={styles.featureCardIcon}>{item.icon}</div>
              <h3 className={styles.featureCardTitle}>{item.label}</h3>
              <p className={styles.featureCardDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA strip ─────────────────────────────────────────────── */}
      <section className={styles.bottomCta}>
        <h2 className={styles.bottomCtaTitle}>Ready to organise imporant things smarter?</h2>
        <p className={styles.bottomCtaSubtitle}>
          Join thousands of students and teams who highlight, annotate and collaborate on PDFs — no signup needed.
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
        title="PDF Highlighter & Notes — Xplaino AI PDF Tool"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

PdfHighlighterNotesLanding.displayName = 'PdfHighlighterNotesLanding';
