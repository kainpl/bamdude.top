import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItem { q: string; a: string; }

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <ul className="divide-y divide-bambu-border rounded-2xl border border-bambu-border bg-bambu-bg-secondary overflow-hidden">
      {items.map((it, idx) => {
        const isOpen = open.has(idx);
        return (
          <li key={idx}>
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${idx}`}
              className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-bambu-bg transition"
            >
              <span className="font-semibold">{it.q}</span>
              <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              id={`faq-panel-${idx}`}
              hidden={!isOpen}
              className="px-6 pb-5 text-bambu-text-secondary leading-relaxed"
            >
              {it.a}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
