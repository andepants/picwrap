export {};

const tiles = Array.from(document.querySelectorAll<HTMLButtonElement>("#grid .tile"));
const lightbox = document.querySelector<HTMLElement>("#lightbox")!;
const lbImg = document.querySelector<HTMLImageElement>("#lb-img")!;
const lbCap = document.querySelector<HTMLElement>("#lb-cap")!;
const total = tiles.length;
let current = 0;
let lastFocus: HTMLElement | null = null;

function show(index: number): void {
  current = (index + total) % total;
  const thumb = tiles[current]!.querySelector("img")!;
  lbImg.src = thumb.src;
  lbImg.alt = thumb.alt;
  lbCap.textContent = `${current + 1} / ${total}`;
}

function open(index: number): void {
  lastFocus = document.activeElement as HTMLElement | null;
  show(index);
  lightbox.hidden = false;
  document.body.classList.add("lb-open");
  document.querySelector<HTMLButtonElement>("#lb-close")!.focus();
}

function close(): void {
  lightbox.hidden = true;
  document.body.classList.remove("lb-open");
  lastFocus?.focus();
}

tiles.forEach((tile) => {
  tile.addEventListener("click", () => open(Number(tile.dataset.index) + 1));
});
document.querySelector("#lb-close")!.addEventListener("click", close);
document.querySelector("#lb-prev")!.addEventListener("click", () => show(current - 1));
document.querySelector("#lb-next")!.addEventListener("click", () => show(current + 1));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) close();
});
document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") close();
  else if (e.key === "ArrowRight") show(current + 1);
  else if (e.key === "ArrowLeft") show(current - 1);
});

const copy = document.querySelector<HTMLButtonElement>("#copy");
copy?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copy.textContent = "Copied!";
  } catch {
    copy.textContent = window.location.href;
  }
  setTimeout(() => (copy.textContent = "Copy link"), 1800);
});
