// Upload validation: everything here is pure so it can be unit-tested without Workers.

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per image
export const MAX_FILES = 20;
export const MAX_TITLE_LENGTH = 120;

export type ImageMime = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

/** Identify an image by its magic bytes. The client-declared MIME type is never trusted. */
export function sniffImageType(bytes: Uint8Array): ImageMime | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    b.length >= 6 &&
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
    (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61
  ) {
    return "image/gif";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/** Trim, strip control characters, collapse whitespace, cap length. Returns null if empty. */
export function normalizeTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return Array.from(cleaned).slice(0, MAX_TITLE_LENGTH).join("");
}

export interface ValidImage {
  bytes: Uint8Array;
  type: ImageMime;
}

export type ValidationResult =
  | { ok: true; title: string; images: ValidImage[] }
  | { ok: false; status: number; error: string };

/** Validate a multipart upload: `title` field plus one or more `files` entries. */
export async function validateUpload(form: FormData): Promise<ValidationResult> {
  const title = normalizeTitle(form.get("title"));
  if (!title) return { ok: false, status: 400, error: "A title is required." };

  const entries = form.getAll("files");
  const files = entries.filter((e): e is File => typeof e !== "string");
  if (files.length !== entries.length) {
    return { ok: false, status: 400, error: "Every 'files' entry must be a file." };
  }
  if (files.length === 0) return { ok: false, status: 400, error: "Add at least one image." };
  if (files.length > MAX_FILES) {
    return { ok: false, status: 413, error: `At most ${MAX_FILES} images per gallery.` };
  }

  const images: ValidImage[] = [];
  for (const [i, file] of files.entries()) {
    if (file.size === 0) return { ok: false, status: 400, error: `Image ${i + 1} is empty.` };
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, status: 413, error: `Image ${i + 1} is larger than 5 MB.` };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) {
      return {
        ok: false,
        status: 415,
        error: `Image ${i + 1} is not a JPEG, PNG, GIF or WebP file.`,
      };
    }
    images.push({ bytes, type });
  }
  return { ok: true, title, images };
}

const ID_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ID_LENGTH = 12;
export const ID_PATTERN = new RegExp(`^[${ID_ALPHABET}]{${ID_LENGTH}}$`);

/** Random, URL-safe gallery id. Keys are always generated, never derived from user input. */
export function generateId(): string {
  const out: string[] = [];
  const buf = new Uint8Array(1);
  // Rejection sampling keeps the distribution uniform.
  while (out.length < ID_LENGTH) {
    crypto.getRandomValues(buf);
    const v = buf[0]!;
    if (v < 256 - (256 % ID_ALPHABET.length)) out.push(ID_ALPHABET[v % ID_ALPHABET.length]!);
  }
  return out.join("");
}

export function isValidId(id: string): boolean {
  return ID_PATTERN.test(id);
}
