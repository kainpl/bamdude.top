import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenshotsTabs } from './ScreenshotsTabs';

const tabs = [
  { id: 'web', label: 'Web', src: '/a.png', alt: 'Web UI' },
  { id: 'tg', label: 'Telegram', src: '/b.png', alt: 'Telegram bot' },
  { id: 'mobile', label: 'Mobile', src: '/c.png', alt: 'Mobile' },
];

describe('ScreenshotsTabs', () => {
  it('renders all tabs and shows the first by default', () => {
    render(<ScreenshotsTabs tabs={tabs} />);
    expect(screen.getByAltText('Web UI')).toBeInTheDocument();
  });

  it('switches image on tab click', async () => {
    const u = userEvent.setup();
    render(<ScreenshotsTabs tabs={tabs} />);
    await u.click(screen.getByRole('tab', { name: 'Telegram' }));
    expect(screen.getByAltText('Telegram bot')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', async () => {
    const u = userEvent.setup();
    render(<ScreenshotsTabs tabs={tabs} />);
    await u.click(screen.getByRole('tab', { name: 'Mobile' }));
    expect(screen.getByRole('tab', { name: 'Mobile' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Web' })).toHaveAttribute('aria-selected', 'false');
  });
});
