import { useEffect, useState } from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';

type Mode = 'system' | 'light' | 'dark';
const ORDER: Mode[] = ['system', 'light', 'dark'];

interface Labels { system: string; light: string; dark: string; label: string; }

function resolve(mode: Mode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return mode;
}

function apply(mode: Mode) {
  const r = resolve(mode);
  document.documentElement.classList.toggle('dark', r === 'dark');
}

export function ThemeToggle({ labels }: { labels: Labels }) {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Mode | null) ?? 'system';
    setMode(stored);
    apply(stored);

    if (stored === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => apply('system');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, []);

  const next = () => {
    const idx = ORDER.indexOf(mode);
    const n = ORDER[(idx + 1) % ORDER.length];
    setMode(n);
    localStorage.setItem('theme', n);
    apply(n);
  };

  const Icon = mode === 'system' ? Monitor : mode === 'light' ? Sun : Moon;
  const labelText = mode === 'system' ? labels.system : mode === 'light' ? labels.light : labels.dark;

  return (
    <button type="button" onClick={next} aria-label={`${labels.label}: ${labelText}`}
      className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-bambu-border hover:border-bambu-green transition">
      <Icon size={18} />
    </button>
  );
}
