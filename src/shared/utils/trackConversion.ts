const ADS_CONVERSION_ID = 'AW-17952418173/aBGQCMiQp5UcEP3SsPBC';
const SAFETY_TIMEOUT_MS = 1000;

/**
 * Fires a Google Ads conversion event.
 *
 * @param onComplete – optional callback invoked after gtag confirms the event
 *   (or after a 1 s safety timeout, whichever comes first).
 *   Omit for fire-and-forget (e.g. when the page stays open after window.open).
 */
export function trackCtaConversion(onComplete?: () => void) {
  if (typeof window.gtag !== 'function') {
    onComplete?.();
    return;
  }

  let called = false;
  const done = () => {
    if (called) return;
    called = true;
    onComplete?.();
  };

  window.gtag('event', 'conversion', {
    send_to: ADS_CONVERSION_ID,
    value: 1.0,
    currency: 'INR',
    event_callback: done,
  });

  if (onComplete) {
    setTimeout(done, SAFETY_TIMEOUT_MS);
  }
}
