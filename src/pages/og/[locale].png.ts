import { OGImageRoute } from 'astro-og-canvas';
import { t, locales } from '../../i18n';

const pages = Object.fromEntries(locales.map((l) => [l, {
  title: l === 'en' ? 'BamDude — Self-hosted print management for Bambu Lab' : 'BamDude — Self-host для Bambu Lab',
  description: t(l).hero.subtitle,
}]));

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  param: 'locale',
  getSlug: (path) => path,
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[10, 10, 10], [0, 90, 30]],
    border: { color: [0, 174, 66], width: 8, side: 'inline-start' },
    padding: 80,
    font: {
      title: { families: ['Inter'], weight: 'ExtraBold', color: [255, 255, 255] },
      description: { families: ['Inter'], weight: 'Normal', color: [200, 200, 200] },
    },
  }),
});
