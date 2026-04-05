const ADS_CONVERSION_ID = 'AW-17952418173/aBGQCMiQp5UcEP3SsPBC';

export function trackCtaConversion() {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: ADS_CONVERSION_ID,
      value: 1.0,
      currency: 'INR',
    });
  }
}
