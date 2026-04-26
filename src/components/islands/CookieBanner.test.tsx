import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieBanner } from './CookieBanner';

const labels = {
  title: 'We use a cookie',
  body: 'Body',
  accept: 'Accept',
  reject: 'Reject',
  customize: 'Customize',
  analyticsLabel: 'Analytics',
  save: 'Save',
};

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllEnvs();
  // mock gtag spy
  (window as any).gtag = vi.fn();
  document.head.querySelectorAll('script[data-gtag]').forEach((n) => n.remove());
});

describe('CookieBanner', () => {
  it('shows when no consent stored', () => {
    render(<CookieBanner labels={labels} />);
    expect(screen.getByText('We use a cookie')).toBeInTheDocument();
  });

  it('hides when consent already granted', () => {
    localStorage.setItem('consent', 'granted');
    render(<CookieBanner labels={labels} />);
    expect(screen.queryByText('We use a cookie')).not.toBeInTheDocument();
  });

  it('on Accept stores granted, calls gtag(consent, update, granted), and (when GA_ID set) injects gtag script', async () => {
    vi.stubEnv('PUBLIC_GA_ID', 'G-TEST');
    const u = userEvent.setup();
    render(<CookieBanner labels={labels} />);
    await u.click(screen.getByRole('button', { name: 'Accept' }));
    expect(localStorage.getItem('consent')).toBe('granted');
    expect((window as any).gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'granted' });
    expect(document.querySelector('script[data-gtag]')).not.toBeNull();
  });

  it('on Reject stores denied and does not inject gtag', async () => {
    vi.stubEnv('PUBLIC_GA_ID', 'G-TEST');
    const u = userEvent.setup();
    render(<CookieBanner labels={labels} />);
    await u.click(screen.getByRole('button', { name: 'Reject' }));
    expect(localStorage.getItem('consent')).toBe('denied');
    expect(document.querySelector('script[data-gtag]')).toBeNull();
  });

  it('reopens via window event "cookie:settings"', () => {
    localStorage.setItem('consent', 'denied');
    render(<CookieBanner labels={labels} />);
    expect(screen.queryByText('We use a cookie')).not.toBeInTheDocument();
    window.dispatchEvent(new Event('cookie:settings'));
    expect(screen.getByText('We use a cookie')).toBeInTheDocument();
  });
});
