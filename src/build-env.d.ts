// Values Vite writes into the code at build time (see `define` in vite.config.ts).

/** Full address of the site's home page, ending in "/" (config/site.ts). */
declare const __SITE_URL__: string;

/** False for preview builds, which search engines shouldn't index (config/site.ts). */
declare const __SITE_INDEXABLE__: boolean;
