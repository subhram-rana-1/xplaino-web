import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MessageSquare, Globe, ChromeIcon, Bot, Highlighter, RotateCcw, Star, MousePointerClick, Languages, UserCheck, CreditCard, NotebookPen, Users } from 'lucide-react';
import { VideoModal } from '@/pages/Home/components/FeatureSet/VideoModal/VideoModal';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { CHROME_STORE_URL } from '@/config/features.config';
import { trackCtaConversion } from '@/shared/utils/trackConversion';
import chromeIcon from '@/assets/images/google-chrome-icon.png';
import styles from '@/pages/ChatWithPdfLanding/ChatWithPdfLanding.module.css';

const PROMO_VIDEO_URL = 'https://bmicorrect.com/website/features/videos/chat-with-webpage.webm';
const CYCLING_WORDS = ['Webpages', 'Research Papers', 'Articles'];

const STATS = [
  { icon: <Star size={28} />, value: '4.9★', label: 'Chrome Store Rating' },
  { icon: <Globe size={28} />, value: '5K+', label: 'Webpages Analyzed' },
  { icon: <Bot size={28} />, value: '60K+', label: 'Questions Answered' },
  { icon: <Languages size={28} />, value: '50+', label: 'Languages Supported' },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: <ChromeIcon size={28} />,
    title: 'Install',
    description: 'Add Xplaino to Chrome in one click. It activates automatically on every page you visit.',
  },
  {
    step: 2,
    icon: <MessageSquare size={28} />,
    title: 'Ask',
    description: 'Open the extension on any page and type your question — or pick a saved custom prompt.',
  },
  {
    step: 3,
    icon: <Bot size={28} />,
    title: 'Get Answers',
    description: 'AI reads the full page and responds instantly with accurate, contextual answers.',
  },
];

const FEATURES = [
  {
    icon: <MessageSquare size={26} />,
    title: 'Ask Anything About Any Page',
    description: 'Conversational AI that reads and understands the full page content — not just a keyword search.',
  },
  {
    icon: <Highlighter size={26} />,
    title: 'Works Everywhere',
    description: 'News articles, research papers, documentation, product pages — the extension is active on every website.',
  },
  {
    icon: <RotateCcw size={26} />,
    title: 'Reusable Custom Questions',
    description: 'Write a question once for your specific workflow and reuse it on any page you visit. One setup, endless reuse.',
  },
  {
    icon: <MousePointerClick size={26} />,
    title: 'Chat on Selected Text',
    description: 'Highlight any passage and ask AI about just that section for focused, precise answers in context.',
  },
];

export const ChatWithWebpageLanding: React.FC = () => {
  usePageTitle('Chat with Webpage – Xplaino AI');
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
    trackCtaConversion();
    window.open(CHROME_STORE_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heading} style={{ display: 'block' }}>
            Chat with your
            <br />
            <span className={`${styles.cyclingWord} ${animating ? styles.cyclingWordExit : styles.cyclingWordEnter}`}>
              {CYCLING_WORDS[wordIdx]}
            </span>
          </h1>

          <div className={styles.miniFeatureGrid}>
            {[
              { icon: <MessageSquare size={16} />, label: 'Ask Anything on Any Page' },
              { icon: <RotateCcw size={16} />, label: 'Write Question Once, Reuse' },
              { icon: <MousePointerClick size={16} />, label: 'Select Text & Ask AI' },
              { icon: <Globe size={16} />, label: 'Works on Every Website' },
            ].map((item) => (
              <div key={item.label} className={styles.miniFeatureItem}>
                <span className={styles.miniFeatureIcon}>{item.icon}</span>
                <span className={styles.miniFeatureLabel}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', marginBottom: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '26px', letterSpacing: '3px', color: '#f5a623', lineHeight: 1 }}>★★★★★</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary, #1a9e8f)' }}>4.9 / 5</span>
              <span style={{ fontSize: '15px', color: '#666', fontWeight: 500 }}>on Chrome Web Store</span>
            </span>
          </div>

          <button className={styles.ctaButton} style={{ marginTop: '0.5rem' }} onClick={handleCta}>
            <img src={chromeIcon} alt="" aria-hidden className={styles.ctaIcon} />
            Understand page faster — Add to Chrome — It's Free
          </button>

                    <div className={styles.secureRow}>
            <span className={styles.secureTag}>
              <UserCheck size={13} className={styles.secureTagIcon} />
              No sign up required
            </span>
            <span className={styles.secureTagDivider}>·</span>
            <span className={styles.secureTag}>
              <CreditCard size={13} className={styles.secureTagIcon} />
              No credit card required
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
            aria-label="Watch Chat with Webpage demo"
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
              title="Chat with Any Webpage — Xplaino AI Extension"
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
        <h2 className={styles.sectionTitle}>Why choose Xplaino for webpages?</h2>
        <p className={styles.sectionSubtitle}>Everything you need to read smarter and get answers faster</p>

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
            { icon: <Highlighter size={22} />, label: 'Highlight & Notes on Webpages', desc: 'Highlight text and add notes on any website, saved automatically.' },
            { icon: <MessageSquare size={22} />, label: 'Chat with PDF', desc: 'Upload any PDF and ask AI questions for instant, precise answers.' },
            { icon: <NotebookPen size={22} />, label: 'Highlight & Notes on PDF', desc: 'Annotate PDF pages with highlights, notes, and pinned comments.' },
            { icon: <Users size={22} />, label: 'Share & Collaborate', desc: 'Invite teammates to annotate and discuss documents together.' },
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
        <h2 className={styles.bottomCtaTitle}>Double your research output — without reading twice as much.</h2>
        <p className={styles.bottomCtaSubtitle}>
          Stop re-reading the same paragraph. Ask AI once and get the answer — on any article, research paper, or webpage, in any language.
        </p>
        <button className={styles.ctaButton} onClick={handleCta}>
          <img src={chromeIcon} alt="" aria-hidden className={styles.ctaIcon} />
          Understand page faster — Add to Chrome — It's Free
        </button>
        <p className={styles.bottomCtaNote}>Free to install · 4.9★ Chrome Web Store</p>
      </section>

      <VideoModal
        isOpen={isModalOpen}
        videoUrl={PROMO_VIDEO_URL}
        title="Chat with Any Webpage — Xplaino AI Extension"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

ChatWithWebpageLanding.displayName = 'ChatWithWebpageLanding';
