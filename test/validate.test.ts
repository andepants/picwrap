import { describe, expect, it } from "vitest";
import {
  generateId,
  isValidId,
  MAX_FILE_BYTES,
  MAX_FILES,
  normalizeTitle,
  sniffImageType,
  validateUpload,
} from "../src/validate";
import { file, GIF, JPEG, PNG, WEBP } from "./fixtures";

function form(title: string | null, files: (File | string)[]): FormData {
  const f = new FormData();
  if (title !== null) f.set("title", title);
  for (const x of files) f.append("files", x);
  return f;
}

describe("sniffImageType", () => {
  it("recognises the four allowed formats by magic bytes", () => {
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(JPEG)).toBe("image/jpeg");
    expect(sniffImageType(GIF)).toBe("image/gif");
    expect(sniffImageType(WEBP)).toBe("image/webp");
  });

  it("rejects everything else, including SVG and HTML", () => {
    const enc = new TextEncoder();
    expect(sniffImageType(enc.encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniffImageType(enc.encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImageType(enc.encode("RIFF\0\0\0\0WAVEfmt "))).toBeNull();
    expect(sniffImageType(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});

describe("normalizeTitle", () => {
  it("trims, collapses whitespace, strips control characters and caps length", () => {
    expect(normalizeTitle("  Beach\n\tday  ")).toBe("Beach day");
    expect(normalizeTitle("a\u0000b")).toBe("a b");
    expect(normalizeTitle("x".repeat(500))).toHaveLength(120);
    expect(normalizeTitle("   ")).toBeNull();
    expect(normalizeTitle(null)).toBeNull();
  });
});

describe("validateUpload", () => {
  it("accepts valid images and trusts the sniffed type, not the declared one", async () => {
    const r = await validateUpload(form("Trip", [file(PNG, "a.jpg", "image/jpeg"), file(JPEG)]));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.images.map((i) => i.type)).toEqual(["image/png", "image/jpeg"]);
  });

  it("rejects a missing title", async () => {
    expect(await validateUpload(form(null, [file(PNG)]))).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects no files and string-valued file fields", async () => {
    expect(await validateUpload(form("t", []))).toMatchObject({ ok: false, status: 400 });
    expect(await validateUpload(form("t", ["not a file"]))).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a file with an image MIME type but non-image bytes", async () => {
    const fake = file(new TextEncoder().encode("<script>alert(1)</script>"), "x.png", "image/png");
    expect(await validateUpload(form("t", [fake]))).toMatchObject({ ok: false, status: 415 });
  });

  it("enforces the per-file size cap", async () => {
    const big = new Uint8Array(MAX_FILE_BYTES + 1);
    big.set(PNG);
    expect(await validateUpload(form("t", [file(big)]))).toMatchObject({ ok: false, status: 413 });
  });

  it("enforces the file-count cap", async () => {
    const many = Array.from({ length: MAX_FILES + 1 }, () => file(PNG));
    expect(await validateUpload(form("t", many))).toMatchObject({ ok: false, status: 413 });
  });
});

describe("ids", () => {
  it("generates ids that match the validation pattern", () => {
    const ids = new Set(Array.from({ length: 200 }, generateId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(isValidId(id)).toBe(true);
  });

  it("rejects ids that could be used for key or path tricks", () => {
    for (const bad of ["", "../../etc", "gallery:abc", "a".repeat(13), "abc def ghij"]) {
      expect(isValidId(bad)).toBe(false);
    }
  });
});
