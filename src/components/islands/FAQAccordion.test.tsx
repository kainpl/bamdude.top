import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FAQAccordion } from './FAQAccordion';

const items = [
  { q: 'Q1', a: 'A1' },
  { q: 'Q2', a: 'A2' },
];

describe('FAQAccordion', () => {
  it('starts with all answers hidden', () => {
    render(<FAQAccordion items={items} />);
    expect(screen.queryByText('A1')).not.toBeVisible();
  });

  it('expands on click', async () => {
    const u = userEvent.setup();
    render(<FAQAccordion items={items} />);
    await u.click(screen.getByRole('button', { name: 'Q1' }));
    expect(screen.getByText('A1')).toBeVisible();
  });

  it('collapses on second click', async () => {
    const u = userEvent.setup();
    render(<FAQAccordion items={items} />);
    const btn = screen.getByRole('button', { name: 'Q1' });
    await u.click(btn);
    await u.click(btn);
    expect(screen.queryByText('A1')).not.toBeVisible();
  });

  it('allows multiple open at the same time', async () => {
    const u = userEvent.setup();
    render(<FAQAccordion items={items} />);
    await u.click(screen.getByRole('button', { name: 'Q1' }));
    await u.click(screen.getByRole('button', { name: 'Q2' }));
    expect(screen.getByText('A1')).toBeVisible();
    expect(screen.getByText('A2')).toBeVisible();
  });
});
