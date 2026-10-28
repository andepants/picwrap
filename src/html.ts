import { DEFAULT_LOCALE, photoCount, t, type Locale } from "./i18n";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]!);
}

export interface GalleryView {
  id: string;
  title: string;
  createdAt: string;
  imageCount: number;
}

export function renderGalleryPage(g: GalleryView, locale: Locale = DEFAULT_LOCALE): string {
  const title = escapeHtml(g.title);
  const msg = (key: Parameters<typeof t>[1], vars?: Record<string, number>) =>
    escapeHtml(t(locale, key, vars));
  const tiles = Array.from({ length: g.imageCount }, (_, i) => {
    const src = `/i/${g.id}/${i}`;
    const label = msg("openPhoto", { n: i + 1, total: g.imageCount });
    const alt = msg("photoAlt", { n: i + 1 });
    return `<li><button class="tile" type="button" data-index="${i}" aria-label="${label}"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></button></li>`;
  }).join("\n");
  const count = escapeHtml(photoCount(locale, g.imageCount));
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · PicWrap</title>
<meta property="og:title" content="${title}">
<meta property="og:image" content="/i/${g.id}/0">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body class="gallery-page">
<header class="bar"><a class="brand" href="/">PicWrap</a><button class="btn ghost" id="copy" type="button">${msg("copyLink")}</button></header>
<main class="wrap">
<h1 class="g-title">${title}</h1>
<p class="muted">${count}</p>
<ul class="grid" id="grid">
${tiles}
</ul>
</main>
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="${msg("viewer")}" hidden>
<button class="lb-btn lb-close" id="lb-close" type="button" aria-label="${msg("close")}">×</button>
<button class="lb-btn lb-prev" id="lb-prev" type="button" aria-label="${msg("previous")}">‹</button>
<figure><img id="lb-img" alt=""><figcaption id="lb-cap"></figcaption></figure>
<button class="lb-btn lb-next" id="lb-next" type="button" aria-label="${msg("next")}">›</button>
</div>
<script type="module" src="/js/gallery.js"></script>
</body>
</html>`;
}

export function renderNotFound(locale: Locale = DEFAULT_LOCALE): string {
  const heading = escapeHtml(t(locale, "notFoundTitle"));
  const body = escapeHtml(t(locale, "notFoundBody"));
  const makeNew = escapeHtml(t(locale, "makeNew"));
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${heading} · PicWrap</title><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css"></head>
<body><header class="bar"><a class="brand" href="/">PicWrap</a></header>
<main class="wrap center"><h1>${heading}</h1><p class="muted">${body}</p><p><a class="btn" href="/">${makeNew}</a></p></main></body></html>`;
}
