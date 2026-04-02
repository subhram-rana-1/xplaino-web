import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './CwsWalkthrough.module.css';

export const CWS_WALKTHROUGH_KEY = 'xplaino-cws-walkthrough-seen';

interface StepConfig {
  selector: string;
  title: string;
  body: React.ReactNode;
  padding: number;
}

const STEPS: StepConfig[] = [
  {
    selector: '[data-walkthrough="features-btn"]',
    title: 'Features',
    body: 'Explore everything Xplaino can do on webpages — summarise, translate, word-lookup, image explanation and more.',
    padding: 6,
  },
  {
    selector: '[data-walkthrough="dashboard-report"]',
    title: 'Dashboard & Report Issue',
    body: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li><strong>Dashboard</strong> — Track saved items, highlights & notes</li>
        <li><strong>Report Issue</strong> — Report bugs or issues directly to us</li>
      </ul>
    ),
    padding: 6,
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CwsWalkthroughProps {
  onComplete: () => void;
}

export const CwsWalkthrough: React.FC<CwsWalkthroughProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const measureTarget = useCallback(() => {
    const el = document.querySelector(STEPS[step].selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = STEPS[step].padding;
    setRect({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });
  }, [step]);

  useLayoutEffect(() => {
    measureTarget();
  }, [measureTarget]);

  useEffect(() => {
    const handleResize = () => measureTarget();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [measureTarget]);

  const handleOk = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      try {
        localStorage.setItem(CWS_WALKTHROUGH_KEY, 'true');
      } catch { /* noop */ }
      onComplete();
    }
  };

  if (!rect) return null;

  const tooltipTop = rect.top + rect.height + 12;
  const tooltipLeft = Math.max(12, rect.left);
  const currentStep = STEPS[step];

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={handleOk} />
      <div
        className={styles.spotlight}
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
      <div
        className={styles.tooltip}
        key={step}
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className={styles.tooltipTitle}>
          {currentStep.title}
        </div>
        <div className={styles.tooltipBody}>{currentStep.body}</div>
        <button className={styles.okButton} onClick={handleOk}>
          {step < STEPS.length - 1 ? 'OK, Next' : 'Got it!'}
        </button>
      </div>
    </>,
    document.body
  );
};
