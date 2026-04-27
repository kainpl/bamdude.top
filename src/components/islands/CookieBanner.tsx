import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { setConsent, getConsent, loadGtag } from '../../lib/analytics';

interface Labels {
  title: string;
  body: string;
  accept: string;
  reject: string;
  customize: string;
  analyticsLabel: string;
  save: string;
}

export function CookieBanner({ labels }: { labels: Labels }) {
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    setOpen(consent === null);
    // Astro is MPA — every page is a fresh document with the default-deny
    // consent stub. If the user already granted consent on a previous page,
    // re-fire the consent update + load gtag.js here so analytics tracks
    // every page, not only the one where they clicked Accept.
    if (consent === 'granted') {
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
      loadGtag();
    }
    const onSettings = () => { flushSync(() => { setOpen(true); setCustomizing(true); }); };
    window.addEventListener('cookie:settings', onSettings);
    return () => window.removeEventListener('cookie:settings', onSettings);
  }, []);

  if (!open) return null;

  const accept = () => { setConsent('granted'); setOpen(false); };
  const reject = () => { setConsent('denied'); setOpen(false); };
  const save = () => { setConsent(analytics ? 'granted' : 'denied'); setOpen(false); };

  return (
    <div role="dialog" aria-label="Cookie consent" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 rounded-2xl border border-bambu-border bg-bambu-bg-secondary shadow-2xl p-5">
      <h3 className="font-bold">{labels.title}</h3>
      <p className="mt-2 text-sm text-bambu-text-secondary">{labels.body}</p>
      {customizing && (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.currentTarget.checked)} />
          <span>{labels.analyticsLabel}</span>
        </label>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!customizing && (
          <>
            <button type="button" onClick={accept} className="rounded-md px-4 py-2 text-sm font-semibold bg-bambu-green text-white">{labels.accept}</button>
            <button type="button" onClick={reject} className="rounded-md px-4 py-2 text-sm font-semibold border border-bambu-border">{labels.reject}</button>
            <button type="button" onClick={() => setCustomizing(true)} className="rounded-md px-4 py-2 text-sm font-semibold">{labels.customize}</button>
          </>
        )}
        {customizing && (
          <button type="button" onClick={save} className="rounded-md px-4 py-2 text-sm font-semibold bg-bambu-green text-white">{labels.save}</button>
        )}
      </div>
    </div>
  );
}
