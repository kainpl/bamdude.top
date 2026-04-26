import { Languages } from 'lucide-react';

interface Props { currentLocale: 'en' | 'uk'; labelLang: string; labelEn: string; labelUk: string; }

export function LangToggle({ currentLocale, labelLang }: Props) {
  const target = currentLocale === 'en' ? 'uk' : 'en';

  const onClick = () => {
    const path = target === 'en'
      ? window.location.pathname.replace(/^\/uk\/?/, '/') || '/'
      : window.location.pathname.startsWith('/uk') ? window.location.pathname : `/uk${window.location.pathname === '/' ? '/' : window.location.pathname}`;
    localStorage.setItem('lang', target);
    window.location.assign(path);
  };

  return (
    <button type="button" onClick={onClick}
      aria-label={`${labelLang}: ${target === 'en' ? 'EN' : 'UK'}`}
      className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-bambu-border hover:border-bambu-green transition text-xs font-semibold">
      <Languages size={16} />
      <span>{target.toUpperCase()}</span>
    </button>
  );
}
