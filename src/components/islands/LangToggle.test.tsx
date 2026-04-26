import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LangToggle } from './LangToggle';

const originalLocation = window.location;

beforeEach(() => {
  localStorage.clear();
  // @ts-expect-error mutable test setup
  delete window.location;
  // @ts-expect-error
  window.location = { ...originalLocation, pathname: '/', assign: vi.fn(), replace: vi.fn() };
});

describe('LangToggle', () => {
  it('renders the alternate locale code', () => {
    render(<LangToggle currentLocale="en" labelLang="Language" labelEn="English" labelUk="Українська" />);
    expect(screen.getByRole('button', { name: /Language/ })).toHaveTextContent(/UK/);
  });

  it('navigates to /uk/ from / on click and saves preference', async () => {
    const u = userEvent.setup();
    render(<LangToggle currentLocale="en" labelLang="Language" labelEn="English" labelUk="Українська" />);
    await u.click(screen.getByRole('button', { name: /Language/ }));
    expect(window.location.assign).toHaveBeenCalledWith('/uk/');
    expect(localStorage.getItem('lang')).toBe('uk');
  });

  it('navigates from /uk/ to / when current is uk', async () => {
    window.location.pathname = '/uk/';
    const u = userEvent.setup();
    render(<LangToggle currentLocale="uk" labelLang="Language" labelEn="English" labelUk="Українська" />);
    await u.click(screen.getByRole('button', { name: /Language/ }));
    expect(window.location.assign).toHaveBeenCalledWith('/');
    expect(localStorage.getItem('lang')).toBe('en');
  });
});
