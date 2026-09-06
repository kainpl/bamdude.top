import { OGImageRoute } from 'astro-og-canvas';
import { t, locales } from '../../i18n';
import { ogStyle } from '../../og/style';

// The OG image and the og:title / og:description meta-tags are shown
// side-by-side in social previews (Telegram, Twitter, etc.). If the
// image text mirrors the meta-tags the card looks like the same line
// printed twice. So image carries the brand slogan; meta-tags
// (BaseLayout ← pages.home.*) carry the SEO/feature description.
const pages = Object.fromEntries(locales.map((l) => [l, {
  title: t(l).hero.title,
  description: 'bamdude.top · self-hosted · AGPL-3.0',
}]));

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getSlug: (path) => path,
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    ...ogStyle(),
  }),
});
