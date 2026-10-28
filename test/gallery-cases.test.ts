import { describe, expect, it } from "vitest";
import { renderGalleryPage } from "../src/html";
import { isLocale } from "../src/i18n";
import { MAX_FILES, MAX_TITLE_LENGTH } from "../src/validate";
import { BATCHES } from "./gallery-cases";

const batches = Object.entries(BATCHES);

describe("gallery render cases", () => {
  it("loads every batch", () => {
    expect(batches.length).toBeGreaterThanOrEqual(45);
  });

  describe.each(batches)("%s", (_name, batch) => {
    it("cases are well-formed", () => {
      expect(batch.cases.length).toBeGreaterThan(0);
      for (const c of batch.cases) {
        expect(c.title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
        expect(c.imageCount).toBeGreaterThanOrEqual(1);
        expect(c.imageCount).toBeLessThanOrEqual(MAX_FILES);
        expect(isLocale(c.locale), c.locale).toBe(true);
      }
    });

    it("escapes every title and renders one tile per image", () => {
      for (const c of batch.cases) {
        if (!isLocale(c.locale)) throw new Error(`unknown locale ${c.locale}`);
        const page = renderGalleryPage(
          { id: "abcdefghijkm", title: c.title, createdAt: "2026-01-01T00:00:00.000Z", imageCount: c.imageCount },
          c.locale,
        );
        expect(page).toContain(`<h1 class="g-title">${c.expectedTitleHtml}</h1>`);
        expect(page).toContain(`<title>${c.expectedTitleHtml} · PicWrap</title>`);
        if (/[<>"']/.test(c.title)) expect(page, c.title).not.toContain(c.title);
        expect(page.match(/class="tile"/g)).toHaveLength(c.imageCount);
        expect(page).toContain(`<html lang="${c.locale}">`);
      }
    });
  });
});
