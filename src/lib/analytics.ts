declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const CONSENT_KEY = 'consent';

export type Consent = 'granted' | 'denied';

export function getConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(CONSENT_KEY);
  return v === 'granted' || v === 'denied' ? v : null;
}

export function setConsent(value: Consent) {
  localStorage.setItem(CONSENT_KEY, value);
  window.gtag?.('consent', 'update', { analytics_storage: value });
  if (value === 'granted') loadGtag();
}

export function loadGtag() {
  const id = import.meta.env.PUBLIC_GA_ID;
  if (!id) return;
  if (document.querySelector('script[data-gtag]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  s.setAttribute('data-gtag', '');
  document.head.appendChild(s);
  window.gtag?.('js', new Date());
  window.gtag?.('config', id, { anonymize_ip: true });
}
