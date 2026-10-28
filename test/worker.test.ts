import { describe, expect, it } from "vitest";
import { GALLERY_TTL_SECONDS, handle } from "../src/app";
import { file, JPEG, PNG, uploadRequest } from "./fixtures";
import { makeEnv } from "./memory-kv";

async function create(env: ReturnType<typeof makeEnv>, title: string, files = [file(PNG), file(JPEG)]) {
  const res = await handle(uploadRequest(title, files), env);
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; url: string };
}

describe("POST /api/galleries", () => {
  it("stores the gallery and its images with a TTL under generated keys", async () => {
    const env = makeEnv();
    const { id, url } = await create(env, "Garden");
    expect(url).toBe(`/g/${id}`);
    expect([...env.GALLERIES.store.keys()].sort()).toEqual(
      [`gallery:${id}`, `img:${id}:0`, `img:${id}:1`].sort(),
    );
    for (const entry of env.GALLERIES.store.values()) expect(entry.ttl).toBe(GALLERY_TTL_SECONDS);
  });

  it("returns a 4xx JSON error for invalid uploads and stores nothing", async () => {
    const env = makeEnv();
    const bad = file(new TextEncoder().encode("hello"), "evil.png", "image/png");
    const res = await handle(uploadRequest("x", [bad]), env);
    expect(res.status).toBe(415);
    expect(await res.json()).toHaveProperty("error");
    expect(env.GALLERIES.store.size).toBe(0);
  });

  it("rejects non-multipart bodies and other methods", async () => {
    const env = makeEnv();
    const post = new Request("https://picwrap.test/api/galleries", { method: "POST", body: "{}" });
    expect((await handle(post, env)).status).toBe(415);
    expect((await handle(new Request("https://picwrap.test/api/galleries"), env)).status).toBe(405);
  });
});

describe("gallery fetch", () => {
  it("returns gallery JSON with image URLs", async () => {
    const env = makeEnv();
    const { id } = await create(env, "Garden");
    const res = await handle(new Request(`https://picwrap.test/api/galleries/${id}`), env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; images: { url: string; type: string }[] };
    expect(body.title).toBe("Garden");
    expect(body.images).toEqual([
      expect.objectContaining({ url: `/i/${id}/0`, type: "image/png" }),
      expect.objectContaining({ url: `/i/${id}/1`, type: "image/jpeg" }),
    ]);
  });

  it("renders the share page with an escaped title, grid tiles and a CSP", async () => {
    const env = makeEnv();
    const { id } = await create(env, `<img src=x onerror=alert(1)> "Tom's" & co`);
    const res = await handle(new Request(`https://picwrap.test/g/${id}`), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Security-Policy")).toContain("script-src 'self'");
    const page = await res.text();
    expect(page).not.toContain("<img src=x");
    expect(page).toContain("&lt;img src=x onerror=alert(1)&gt; &quot;Tom&#39;s&quot; &amp; co");
    expect(page.match(/class="tile"/g)).toHaveLength(2);
    expect(page).toContain('data-index="0"');
  });

  it("localizes the share page from Accept-Language and falls back to English", async () => {
    const env = makeEnv();
    const { id } = await create(env, "Garten");
    const de = await handle(
      new Request(`https://picwrap.test/g/${id}`, { headers: { "Accept-Language": "de-AT,de;q=0.9" } }),
      env,
    );
    expect(de.headers.get("Content-Language")).toBe("de");
    expect(de.headers.get("Vary")).toBe("Accept-Language");
    const page = await de.text();
    expect(page).toContain('<html lang="de">');
    expect(page).toContain(">Link kopieren</button>");
    expect(page).toContain("2 Fotos");

    const fallback = await handle(
      new Request(`https://picwrap.test/g/${id}`, { headers: { "Accept-Language": "tlh" } }),
      env,
    );
    expect(fallback.headers.get("Content-Language")).toBe("en");
    expect(await fallback.text()).toContain("2 photos");

    const missing = await handle(
      new Request("https://picwrap.test/g/abcdefghijkm", { headers: { "Accept-Language": "fr" } }),
      env,
    );
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain("Galerie introuvable");
  });

  it("serves image bytes with the sniffed content type and nosniff", async () => {
    const env = makeEnv();
    const { id } = await create(env, "Garden");
    const res = await handle(new Request(`https://picwrap.test/i/${id}/1`), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(JPEG);
  });

  it("404s for unknown or malformed ids and indexes", async () => {
    const env = makeEnv();
    const { id } = await create(env, "Garden");
    for (const path of [
      "/g/abcdefghijkm",
      "/g/..%2F..%2Fgallery",
      "/api/galleries/nope",
      `/i/${id}/7`,
      `/i/${id}/-1`,
      `/i/${id}/0x1`,
    ]) {
      expect((await handle(new Request(`https://picwrap.test${path}`), env)).status, path).toBe(404);
    }
  });
});
