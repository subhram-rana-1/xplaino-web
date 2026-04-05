import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BookMarked, FileText, LayoutDashboard, Users, Star, ChromeIcon, MessageSquare, Highlighter, ImageIcon, NotebookPen, UserCheck, CreditCard, Share2 } from 'lucide-react';
import { VideoModal } from '@/pages/Home/components/FeatureSet/VideoModal/VideoModal';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { CHROME_STORE_URL } from '@/config/features.config';
import { trackCtaConversion } from '@/shared/utils/trackConversion';
import chromeIcon from '@/assets/images/google-chrome-icon.png';
import styles from '@/pages/ChatWithPdfLanding/ChatWithPdfLanding.module.css';

const PROMO_VIDEO_URL = 'https://bmicorrect.com/website/website_1902_720_2.webm';
const CYCLING_WORDS = ['Learnings & Insights', 'Articles & Images', 'Passages & Inline Notes'];

const STATS = [
  { icon: <Star size={28} />, value: '4.9★', label: 'Chrome Store Rating' },
  { icon: <BookMarked size={28} />, value: '5K+', label: 'Saved Items' },
  { icon: <Share2 size={28} />, value: '100+', label: 'Shares' },
  { icon: <Users size={28} />, value: '30+', label: 'Countries So Far' },
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
    icon: <BookMarked size={28} />,
    title: 'Save Items',
    description: 'Click to save a page link, image, or any selected text in one action — right from the page.',
  },
  {
    step: 3,
    icon: <LayoutDashboard size={28} />,
    title: 'Access Anytime',
    description: 'Everything lands in your personal dashboard, organised by source and category for instant recall.',
  },
];

const FEATURES = [
  {
    icon: <BookMarked size={26} />,
    title: 'Save Pages & Images',
    description: 'Bookmark any page link or image from the web to your personal dashboard in one click. Always there when you need it.',
  },
  {
    icon: <FileText size={26} />,
    title: 'Save Words & Paragraphs',
    description: 'Select any text on a page and save it with its source reference — never lose a great quote or insight again.',
  },
  {
    icon: <LayoutDashboard size={26} />,
    title: 'Track Your Learnings',
    description: 'Your personal knowledge dashboard organises everything you save by source, type, and date for easy recall and review.',
  },
  {
    icon: <Share2 size={26} />,
    title: 'Share & Collaborate',
    description: 'Share your curated collection with teammates to build a shared knowledge base 10× faster than working alone.',
  },
];

export const BookmarksDashboardLanding: React.FC = () => {
  usePageTitle('Bookmarks & Dashboard – Xplaino AI');
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
            Save &amp; organise your{' '}
            <span className={`${styles.cyclingWord} ${animating ? styles.cyclingWordExit : styles.cyclingWordEnter}`}>
              {CYCLING_WORDS[wordIdx]}
            </span>
          </h1>

          <div className={styles.miniFeatureGrid}>
            {[
              { icon: <BookMarked size={16} />, label: 'Save Pages & Images' },
              { icon: <FileText size={16} />, label: 'Save Text & Paragraphs' },
              { icon: <LayoutDashboard size={16} />, label: 'Personal Dashboard' },
              { icon: <Users size={16} />, label: 'Share & Collaborate' },
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
            Build your knowledge base — Add to Chrome — It's Free
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
            aria-label="Watch Bookmarks & Dashboard demo"
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
              title="Bookmarks & Dashboard — Xplaino AI Extension"
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
        <h2 className={styles.sectionTitle}>Why choose Xplaino<br />for bookmarks &amp; dashboard?</h2>
        <p className={styles.sectionSubtitle}>Everything you need to capture, organise and share what you learn online</p>

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
            { icon: <MessageSquare size={22} />, label: 'Chat with Webpage', desc: 'Ask AI questions on any article or webpage — no copy-pasting needed.' },
            { icon: <Highlighter size={22} />, label: 'Web Highlighter & Notes', desc: 'Highlight text and add notes on any website, saved automatically.' },
            { icon: <ImageIcon size={22} />, label: 'Chat with Images', desc: 'Ask AI about any chart, diagram, or image on any webpage instantly.' },
            { icon: <NotebookPen size={22} />, label: 'Chat with PDF', desc: 'Upload any PDF and ask AI questions for instant, precise answers.' },
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
        <h2 className={styles.bottomCtaTitle}>Your second brain starts with a single save.</h2>
        <p className={styles.bottomCtaSubtitle}>
          Everything you discover online — pages, images, paragraphs — captured, organised, and accessible whenever you need it.
        </p>
        <button className={styles.ctaButton} onClick={handleCta}>
          <img src={chromeIcon} alt="" aria-hidden className={styles.ctaIcon} />
          Build your knowledge base — Add to Chrome — It's Free
        </button>
        <p className={styles.bottomCtaNote}>Free to install · 4.9★ Chrome Web Store</p>
      </section>

      <VideoModal
        isOpen={isModalOpen}
        videoUrl={PROMO_VIDEO_URL}
        title="Bookmarks & Dashboard — Xplaino AI Extension"
        sourceElement={containerRef.current}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

BookmarksDashboardLanding.displayName = 'BookmarksDashboardLanding';
