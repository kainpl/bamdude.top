/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA_ID: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_GITHUB_REPO: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
