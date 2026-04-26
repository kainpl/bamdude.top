import { useState } from 'react';

export interface Tab { id: string; label: string; src: string; alt: string; }

export function ScreenshotsTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div role="tablist" className="flex gap-2 justify-center mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-semibold border transition ${
              active === tab.id
                ? 'bg-bambu-green text-white border-bambu-green'
                : 'border-bambu-border hover:border-bambu-green'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden border border-bambu-border shadow-[0_0_64px_rgba(0,174,66,0.15)]">
        <img src={current.src} alt={current.alt} loading="lazy" className="w-full h-auto block" />
      </div>
    </div>
  );
}
