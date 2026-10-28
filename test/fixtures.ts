export const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
export const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46]);
export const GIF = new TextEncoder().encode("GIF89a\u0001\u0000\u0001\u0000");
export const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);

export function file(bytes: Uint8Array, name = "photo.png", type = "image/png"): File {
  return new File([bytes as Uint8Array<ArrayBuffer>], name, { type });
}

export function uploadRequest(title: string | null, files: File[]): Request {
  const form = new FormData();
  if (title !== null) form.set("title", title);
  for (const f of files) form.append("files", f, f.name);
  return new Request("https://picwrap.test/api/galleries", { method: "POST", body: form });
}
