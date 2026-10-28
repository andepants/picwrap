import { describe, expect, it } from "vitest";
import { escapeHtml, renderGalleryPage, renderNotFound } from "../src/html";
import { DEFAULT_LOCALE, LOCALES, isLocale, photoCount, pickLocale, t, type Locale } from "../src/i18n";

const codes = Object.keys(LOCALES) as Locale[];
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("locale packs", () => {
  it("ship at least 20 locales with English as the default", () => {
    expect(codes.length).toBeGreaterThanOrEqual(20);
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it.each(codes)("%s has every key, non-empty, with the same placeholders as English", (code) => {
    const en = LOCALES.en;
    const pack = LOCALES[code];
    expect(Object.keys(pack).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const value = pack[key];
      if (typeof value === "string") {
        expect(value.trim(), `${code}.${key}`).not.toBe("");
        expect(placeholders(value), `${code}.${key}`).toEqual(placeholders(en[key] as string));
      }
    }
    for (const form of Object.values(pack.photoCount)) expect(placeholders(form)).toEqual(["count"]);
  });

  it.each(codes)("%s contains no markup", (code) => {
    expect(JSON.stringify(LOCALES[code])).not.toMatch(/[<>]/);
  });
});

describe("pickLocale", () => {
  it.each([
    [null, "en"],
    ["", "en"],
    ["fr-CA,fr;q=0.9,en;q=0.8", "fr"],
    ["xx, de;q=0.5", "de"],
    ["es;q=0.2, ja;q=0.8", "ja"],
    ["pt-BR", "pt"],
    ["en;q=0, ko", "ko"],
    ["*", "en"],
    ["tlh, xx-YY", "en"],
  ])("%j -> %s", (header, expected) => {
    expect(pickLocale(header)).toBe(expected);
  });

  it("rejects prototype keys", () => {
    expect(isLocale("constructor")).toBe(false);
    expect(pickLocale("__proto__, constructor")).toBe("en");
  });
});

describe("messages", () => {
  it("fills placeholders", () => {
    expect(t("en", "openPhoto", { n: 2, total: 5 })).toBe("Open photo 2 of 5");
    expect(t("de", "openPhoto", { n: 2, total: 5 })).toBe("Foto 2 von 5 öffnen");
  });

  it("uses each locale's plural rules", () => {
    expect(photoCount("en", 1)).toBe("1 photo");
    expect(photoCount("en", 3)).toBe("3 photos");
    expect(photoCount("pl", 1)).toBe("1 zdjęcie");
    expect(photoCount("pl", 3)).toBe("3 zdjęcia");
    expect(photoCount("pl", 5)).toBe("5 zdjęć");
    expect(photoCount("ja", 4)).toBe("写真 4 枚");
  });
});

describe("localized rendering", () => {
  const view = { id: "abcdefghijkm", title: "Garden", createdAt: "2026-01-01T00:00:00.000Z", imageCount: 2 };

  it("keeps the English page text unchanged by default", () => {
    const page = renderGalleryPage(view);
    expect(page).toContain('<html lang="en">');
    expect(page).toContain(">Copy link</button>");
    expect(page).toContain('aria-label="Open photo 1 of 2"');
    expect(page).toContain('alt="Photo 2"');
    expect(page).toContain('<p class="muted">2 photos</p>');
    expect(page).toContain('aria-label="Photo viewer"');
  });

  it.each(codes)("renders the gallery and not-found pages in %s", (code) => {
    const page = renderGalleryPage(view, code);
    expect(page).toContain(`<html lang="${code}">`);
    expect(page).toContain(escapeHtml(photoCount(code, 2)));
    expect(page.match(/class="tile"/g)).toHaveLength(2);
    expect(renderNotFound(code)).toContain(`<h1>${escapeHtml(t(code, "notFoundTitle"))}</h1>`);
  });
});
