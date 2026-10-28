export {};

const MAX_FILES = 20;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const form = document.querySelector<HTMLFormElement>("#upload")!;
const input = document.querySelector<HTMLInputElement>("#files")!;
const drop = document.querySelector<HTMLElement>("#drop")!;
const previews = document.querySelector<HTMLUListElement>("#previews")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const submit = document.querySelector<HTMLButtonElement>("#submit")!;

const selected: File[] = [];

function setStatus(message: string, isError = false): void {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function render(): void {
  previews.replaceChildren(
    ...selected.map((file, i) => {
      const li = document.createElement("li");
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.alt = "";
      img.onload = () => URL.revokeObjectURL(img.src);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${file.name}`);
      remove.onclick = () => {
        selected.splice(i, 1);
        render();
      };
      li.append(img, remove);
      return li;
    }),
  );
  submit.disabled = selected.length === 0;
  drop.classList.toggle("has-files", selected.length > 0);
}

function add(files: FileList | File[]): void {
  const problems: string[] = [];
  for (const file of Array.from(files)) {
    if (!ACCEPTED.includes(file.type)) problems.push(`${file.name}: not an image we support`);
    else if (file.size > MAX_FILE_BYTES) problems.push(`${file.name}: larger than 5 MB`);
    else if (selected.length >= MAX_FILES) problems.push(`Only ${MAX_FILES} photos per gallery`);
    else selected.push(file);
  }
  setStatus(problems.join(" · "), problems.length > 0);
  render();
}

input.addEventListener("change", () => {
  if (input.files) add(input.files);
  input.value = "";
});
for (const ev of ["dragenter", "dragover"]) {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("over");
  });
}
for (const ev of ["dragleave", "drop"]) {
  drop.addEventListener(ev, () => drop.classList.remove("over"));
}
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer?.files) add(e.dataTransfer.files);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = new FormData();
  body.set("title", (form.elements.namedItem("title") as HTMLInputElement).value);
  for (const file of selected) body.append("files", file, file.name);
  submit.disabled = true;
  setStatus("Uploading…");
  try {
    const res = await fetch("/api/galleries", { method: "POST", body });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) throw new Error(data.error ?? `Upload failed (${res.status})`);
    window.location.assign(data.url);
  } catch (err) {
    setStatus(err instanceof Error ? err.message : "Upload failed", true);
    submit.disabled = selected.length === 0;
  }
});

render();
