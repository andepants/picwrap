import { renderGalleryPage, renderNotFound } from "./html";
import { pickLocale, type Locale } from "./i18n";
import { generateId, isValidId, MAX_FILES, validateUpload, type ImageMime } from "./validate";

/** Galleries and their images expire after 30 days to stay inside KV free-tier storage. */
export const GALLERY_TTL_SECONDS = 30 * 24 * 60 * 60;

/** The subset of KVNamespace the app uses, so tests can pass an in-memory fake. */
export interface KV {
  get(key: string, type: "text"): Promise<string | null>;
  getWithMetadata<M>(
    key: string,
    type: "arrayBuffer",
  ): Promise<{ value: ArrayBuffer | null; metadata: M | null }>;
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView,
    options?: { expirationTtl?: number; metadata?: unknown },
  ): Promise<void>;
}

export interface Env {
  GALLERIES: KV;
  ASSETS?: { fetch(req: Request): Promise<Response> };
}

export interface Gallery {
  id: string;
  title: string;
  createdAt: string;
  images: { type: ImageMime; bytes: number }[];
}

const galleryKey = (id: string) => `gallery:${id}`;
const imageKey = (id: string, index: number) => `img:${id}:${index}`;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

const HTML_CSP =
  "default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS },
  });
}

function html(body: string, status = 200, locale?: Locale): Response {
  const langHeaders: Record<string, string> = locale
    ? { "Content-Language": locale, Vary: "Accept-Language" }
    : {};
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": HTML_CSP,
      ...langHeaders,
      ...SECURITY_HEADERS,
    },
  });
}

export async function getGallery(env: Env, id: string): Promise<Gallery | null> {
  if (!isValidId(id)) return null;
  const raw = await env.GALLERIES.get(galleryKey(id), "text");
  return raw ? (JSON.parse(raw) as Gallery) : null;
}

export async function createGallery(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return json({ error: "Expected multipart/form-data." }, 415);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Could not read the upload." }, 400);
  }
  const result = await validateUpload(form);
  if (!result.ok) return json({ error: result.error }, result.status);

  const id = generateId();
  const ttl = { expirationTtl: GALLERY_TTL_SECONDS };
  await Promise.all(
    result.images.map((img, i) =>
      env.GALLERIES.put(imageKey(id, i), img.bytes, { ...ttl, metadata: { type: img.type } }),
    ),
  );
  const gallery: Gallery = {
    id,
    title: result.title,
    createdAt: new Date().toISOString(),
    images: result.images.map((img) => ({ type: img.type, bytes: img.bytes.byteLength })),
  };
  // Write the gallery record last so a half-finished upload is never visible.
  await env.GALLERIES.put(galleryKey(id), JSON.stringify(gallery), ttl);
  return json({ id, url: `/g/${id}` }, 201);
}

async function serveImage(env: Env, id: string, indexRaw: string): Promise<Response> {
  const index = Number(indexRaw);
  if (!isValidId(id) || !/^\d{1,2}$/.test(indexRaw) || index >= MAX_FILES) {
    return new Response("Not found", { status: 404 });
  }
  const { value, metadata } = await env.GALLERIES.getWithMetadata<{ type: ImageMime }>(
    imageKey(id, index),
    "arrayBuffer",
  );
  if (!value || !metadata) return new Response("Not found", { status: 404 });
  return new Response(value, {
    headers: {
      "Content-Type": metadata.type,
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      ...SECURITY_HEADERS,
    },
  });
}

export async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/api/galleries") {
    if (method !== "POST") return json({ error: "Method not allowed." }, 405);
    return createGallery(request, env);
  }

  let m = pathname.match(/^\/api\/galleries\/([^/]+)$/);
  if (m && method === "GET") {
    const gallery = await getGallery(env, m[1]!);
    if (!gallery) return json({ error: "Gallery not found." }, 404);
    return json({
      ...gallery,
      images: gallery.images.map((img, i) => ({ ...img, url: `/i/${gallery.id}/${i}` })),
    });
  }

  m = pathname.match(/^\/g\/([^/]+)\/?$/);
  if (m && method === "GET") {
    const locale = pickLocale(request.headers.get("Accept-Language"));
    const gallery = await getGallery(env, m[1]!);
    if (!gallery) return html(renderNotFound(locale), 404, locale);
    return html(
      renderGalleryPage(
        {
          id: gallery.id,
          title: gallery.title,
          createdAt: gallery.createdAt,
          imageCount: gallery.images.length,
        },
        locale,
      ),
      200,
      locale,
    );
  }

  m = pathname.match(/^\/i\/([^/]+)\/([^/]+)$/);
  if (m && method === "GET") return serveImage(env, m[1]!, m[2]!);

  if (env.ASSETS) return env.ASSETS.fetch(request);
  return new Response("Not found", { status: 404 });
}
