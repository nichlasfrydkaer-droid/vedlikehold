const SEARCH_ENDPOINT = "/search/api";

const form = document.querySelector("[data-search-form]");
const input = form.querySelector("input[name='q']");
const submitButton = form.querySelector("button[type='submit']");
const status = document.querySelector("[data-search-status]");
const results = document.querySelector("[data-search-results]");
const filters = [...document.querySelectorAll("[data-media-filter]")];
const dialog = document.querySelector("[data-media-dialog]");
const dialogTitle = document.querySelector("[data-media-dialog-title]");
const dialogType = document.querySelector("[data-media-dialog-type]");
const mediaFrame = document.querySelector("[data-media-frame]");
const mediaError = document.querySelector("[data-media-error]");
const dialogClose = document.querySelector("[data-dialog-close]");

let activeRequest;
let activeFilter = "all";
let currentItems = [];
let lastTrigger;

function setBusy(busy) {
  input.disabled = busy;
  submitButton.disabled = busy;
  filters.forEach((filter) => { filter.disabled = busy; });
  submitButton.textContent = busy ? "Søker …" : "Søk";
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "Video";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function closeMedia() {
  if (dialog.open) dialog.close();
  mediaFrame.replaceChildren();
  mediaError.hidden = true;
  lastTrigger?.focus();
}

function openMedia(item, trigger, imageOnly) {
  lastTrigger = trigger;
  dialogTitle.textContent = item.title;
  dialogType.textContent = imageOnly ? "Forhåndsvisning" : "PeerTube-video";
  mediaError.hidden = true;

  const media = document.createElement(imageOnly ? "img" : "video");
  media.src = imageOnly ? item.thumbnailUrl : item.videoUrl;
  if (imageOnly) {
    media.alt = item.title;
  } else {
    media.controls = true;
    media.preload = "metadata";
    media.playsInline = true;
    media.setAttribute("aria-label", item.title);
  }
  media.addEventListener("error", () => { mediaError.hidden = false; });
  mediaFrame.replaceChildren(media);
  dialog.showModal();
}

function renderItems() {
  results.replaceChildren();
  const imageOnly = activeFilter === "images";
  for (const item of currentItems) {
    const article = document.createElement("article");
    article.className = "media-result";

    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "media-result-preview";
    preview.setAttribute("aria-label", imageOnly ? `Vis bilde fra ${item.title}` : `Spill av ${item.title}`);
    preview.addEventListener("click", () => openMedia(item, preview, imageOnly));

    const image = document.createElement("img");
    image.src = item.thumbnailUrl;
    image.alt = item.title;
    image.loading = "lazy";
    image.decoding = "async";
    preview.append(image);

    if (!imageOnly) {
      const play = document.createElement("span");
      play.className = "play-icon";
      play.textContent = "▶";
      play.setAttribute("aria-hidden", "true");
      preview.append(play);
    }

    const details = document.createElement("div");
    details.className = "media-result-details";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const creator = document.createElement("span");
    creator.textContent = item.creator;
    const meta = document.createElement("div");
    meta.className = "media-result-meta";
    const type = document.createElement("span");
    type.className = "source-badge";
    type.textContent = imageOnly ? "Bilde" : formatDuration(item.durationSeconds);
    meta.append(type);
    details.append(title, creator, meta);
    article.append(preview, details);
    results.append(article);
  }
  status.textContent = currentItems.length
    ? `${currentItems.length} resultater.`
    : "Ingen resultater. Prøv et annet søk.";
}

async function search(query) {
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  results.replaceChildren();
  setBusy(true);
  status.textContent = "Søker etter medier …";
  try {
    const url = new URL(SEARCH_ENDPOINT, window.location.origin);
    url.searchParams.set("q", query);
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("search-failed");
    const payload = await response.json();
    if (controller.signal.aborted) return;
    currentItems = Array.isArray(payload.results) ? payload.results : [];
    renderItems();
  } catch (error) {
    if (controller.signal.aborted) return;
    currentItems = [];
    results.replaceChildren();
    status.textContent = "Søket er midlertidig utilgjengelig. Prøv igjen.";
  } finally {
    if (activeRequest === controller) setBusy(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (query.length < 2) {
    status.textContent = "Skriv minst to tegn.";
    input.focus();
    return;
  }
  search(query);
});

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    activeFilter = filter.dataset.mediaFilter;
    filters.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === filter)));
    renderItems();
  });
});

dialogClose.addEventListener("click", closeMedia);
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMedia();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeMedia();
});
