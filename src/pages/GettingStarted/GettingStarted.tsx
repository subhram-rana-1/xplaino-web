import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { HighlightedCoupon } from '@/shared/components/HighlightedCoupon';
import { ChromeTryFeaturesButton } from '@/shared/components/ChromeButton/ChromeTryFeaturesButton';
import styles from './GettingStarted.module.css';

const DEMO_ARTICLES = [
  {
    title: 'Biomolecules: The Building Blocks of Life',
    diagram: 'biomolecules',
    paragraphs: [
      'Biomolecules are organic compounds essential for life. They are produced by living organisms and perform critical functions such as storing energy, transmitting genetic information, and catalyzing chemical reactions. The four major classes of biomolecules are carbohydrates, lipids, proteins, and nucleic acids.',
      'Carbohydrates serve as the primary source of energy for cells. They range from simple sugars like glucose to complex polymers such as starch and cellulose. Lipids, including fats, oils, and phospholipids, form cell membranes, store energy, and act as signaling molecules. Unlike carbohydrates, lipids are hydrophobic and do not dissolve readily in water.',
      'Proteins are made up of amino acids linked by peptide bonds. They carry out most of the work inside cells—acting as enzymes, structural components, and transporters. Nucleic acids, DNA and RNA, store and transmit genetic information. DNA holds the instructions for building proteins, while RNA helps translate those instructions into action.',
      'Understanding biomolecules is fundamental to biology and medicine. From the sugars in your breakfast to the proteins in your muscles, these molecules shape how living systems function. By studying their structure and interactions, scientists develop new drugs, improve nutrition, and unravel the mysteries of disease.',
    ],
  },
];

const BIOMOLECULES_DIAGRAM_URL = 'https://cdn.testbook.com/1737704974941-biomolecules%20concept%20map.png/1737704976.png';

const WorkflowDiagram: React.FC = () => (
  <svg
    viewBox="0 0 520 140"
    className={styles.workflowDiagram}
    aria-label="Process flow: Select text, double-click word, hover image, then Xplaino explains"
  >
    <defs>
      <marker id="wf-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#4A5568" />
      </marker>
    </defs>
    <rect x="0" y="25" width="110" height="55" rx="8" fill="#e0f7f4" stroke="#14b8a6" strokeWidth="1.5" />
    <text x="55" y="55" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0a5d52">Select text</text>
    <path d="M110 52 L145 52" stroke="#4A5568" strokeWidth="2" markerEnd="url(#wf-arrow)" fill="none" />
    <rect x="150" y="25" width="110" height="55" rx="8" fill="#e0f7f4" stroke="#14b8a6" strokeWidth="1.5" />
    <text x="205" y="55" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0a5d52">Double-click word</text>
    <path d="M260 52 L295 52" stroke="#4A5568" strokeWidth="2" markerEnd="url(#wf-arrow)" fill="none" />
    <rect x="300" y="25" width="110" height="55" rx="8" fill="#e0f7f4" stroke="#14b8a6" strokeWidth="1.5" />
    <text x="355" y="55" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0a5d52">Hover image</text>
    <path d="M355 80 L355 105 L435 105 L435 52" stroke="#4A5568" strokeWidth="2" markerEnd="url(#wf-arrow)" fill="none" />
    <rect x="420" y="25" width="100" height="90" rx="8" fill="#0d8070" />
    <text x="470" y="55" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">Xplaino</text>
    <text x="470" y="75" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.95)">Explain</text>
    <text x="470" y="92" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.95)">Summarize</text>
    <text x="470" y="109" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.95)">Translate</text>
  </svg>
);

/**
 * GettingStarted - Onboarding page with demo article for Xplaino practice
 *
 * Displays a random sample article so new users can try summarization,
 * word lookup, and text selection. Includes a tip about refreshing tabs.
 *
 * @returns JSX element
 */
export const GettingStarted: React.FC = () => {
  const location = useLocation();

  const hideInstallExtensionButton = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('source') === 'cws';
  }, [location.search]);

  const article = useMemo(
    () => DEMO_ARTICLES[0], // Biomolecules article (with diagram) shown by default
    []
  );

  const modKey = useMemo(
    () => (typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'),
    []
  );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainRow}>
        <aside className={styles.leftSidebar}>
          <div className={styles.sidebarCoupon}>
            <HighlightedCoupon placement="sidebar" />
          </div>
          <div className={styles.userInstructionSection}>
            <h2 className={styles.userInstructionHeading}>User instruction</h2>
            <div className={styles.refreshTabsBanner}>
              After installing, refresh any open tabs or open a new one to activate Xplaino.
            </div>
            <div className={styles.sidebarGuide}>
              <span className={styles.guideLabel}>Use guide</span>
              <ul className={styles.instructionsList}>
                <li>Select text</li>
                <li>Hover over an image</li>
                <li>Double-click word</li>
              </ul>
              <span className={styles.shortcutsLabel}>Shortcuts</span>
              <div className={styles.shortcuts}>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutAction}>Summarize page</span>
                  <span className={styles.shortcutKeyCombo}>{modKey} M</span>
                </div>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutAction}>Translate page</span>
                  <span className={styles.shortcutKeyCombo}>{modKey} K</span>
                </div>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutAction}>Ask about page</span>
                  <span className={styles.shortcutKeyCombo}>{modKey} B</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div className={styles.mainCenter}>
          <div className={styles.centerContent}>
            {!hideInstallExtensionButton && (
              <div className={styles.installExtensionWrapper}>
                <ChromeTryFeaturesButton />
              </div>
            )}
            <header className={styles.headerSection}>
              <h1 className={styles.title}>Lets try the extension here first</h1>
              <span className={styles.sampleBadge}>Sample article for practice</span>
            </header>

            <article className={styles.article}>
            <h2 className={styles.articleTitle}>{article.title}</h2>
            <div className={styles.articleBody}>
              {article.paragraphs.slice(0, 2).map((paragraph, index) => (
                <p key={index} className={styles.paragraph}>{paragraph}</p>
              ))}
              <figure className={styles.workflowFigure}>
                {article.diagram === 'biomolecules' ? (
                  <img
                    src={BIOMOLECULES_DIAGRAM_URL}
                    alt="Four major classes of biomolecules: carbohydrates, proteins, lipids, nucleic acids"
                    className={styles.workflowDiagram}
                  />
                ) : (
                  <WorkflowDiagram />
                )}
                <figcaption className={styles.workflowCaption}>
                  {article.diagram === 'biomolecules'
                    ? 'Four major classes of biomolecules — hover to try Xplaino'
                    : 'Process flow — hover over this diagram to try Xplaino'}
                </figcaption>
              </figure>
              {article.paragraphs.slice(2).map((paragraph, index) => (
                <p key={index + 2} className={styles.paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
          </div>
        </div>
      </div>
    </div>
  );
};

GettingStarted.displayName = 'GettingStarted';
