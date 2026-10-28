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

export function renderGalleryPage(g: GalleryView): string {
  const title = escapeHtml(g.title);
  const tiles = Array.from({ length: g.imageCount }, (_, i) => {
    const src = `/i/${g.id}/${i}`;
    return `<li><button class="tile" type="button" data-index="${i}" aria-label="Open photo ${i + 1} of ${g.imageCount}"><img src="${src}" alt="Photo ${i + 1}" loading="lazy" decoding="async"></button></li>`;
  }).join("\n");
  const count = `${g.imageCount} photo${g.imageCount === 1 ? "" : "s"}`;
  return `<!doctype html>
<html lang="en">
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
<header class="bar"><a class="brand" href="/">PicWrap</a><button class="btn ghost" id="copy" type="button">Copy link</button></header>
<main class="wrap">
<h1 class="g-title">${title}</h1>
<p class="muted">${count}</p>
<ul class="grid" id="grid">
${tiles}
</ul>
</main>
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" hidden>
<button class="lb-btn lb-close" id="lb-close" type="button" aria-label="Close">×</button>
<button class="lb-btn lb-prev" id="lb-prev" type="button" aria-label="Previous photo">‹</button>
<figure><img id="lb-img" alt=""><figcaption id="lb-cap"></figcaption></figure>
<button class="lb-btn lb-next" id="lb-next" type="button" aria-label="Next photo">›</button>
</div>
<script type="module" src="/js/gallery.js"></script>
</body>
</html>`;
}

export function renderNotFound(): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gallery not found · PicWrap</title><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css"></head>
<body><header class="bar"><a class="brand" href="/">PicWrap</a></header>
<main class="wrap center"><h1>Gallery not found</h1><p class="muted">It may have expired. Galleries are kept for 30 days.</p><p><a class="btn" href="/">Make a new one</a></p></main></body></html>`;
}
