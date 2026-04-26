import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

beforeEach(() => {
  document.documentElement.className = '';
  localStorage.clear();
});

describe('ThemeToggle', () => {
  it('renders a button labelled by the current mode', () => {
    render(<ThemeToggle labels={{ system: 'System', light: 'Light', dark: 'Dark', label: 'Theme' }} />);
    expect(screen.getByRole('button', { name: /Theme/ })).toBeInTheDocument();
  });

  it('cycles system → light → dark → system on click', async () => {
    const u = userEvent.setup();
    render(<ThemeToggle labels={{ system: 'System', light: 'Light', dark: 'Dark', label: 'Theme' }} />);
    const btn = screen.getByRole('button', { name: /Theme/ });
    await u.click(btn);
    expect(localStorage.getItem('theme')).toBe('light');
    await u.click(btn);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    await u.click(btn);
    expect(localStorage.getItem('theme')).toBe('system');
  });

  it('reads existing localStorage value on mount', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle labels={{ system: 'System', light: 'Light', dark: 'Dark', label: 'Theme' }} />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
