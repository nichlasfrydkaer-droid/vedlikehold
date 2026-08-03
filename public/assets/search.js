const OPENVERSE_ENDPOINT = "https://api.openverse.org/v1/images/";
const INTERNET_ARCHIVE_ENDPOINT = "https://archive.org/advancedsearch.php";
const INTERNET_ARCHIVE_EMBED_BASE = "https://archive.org/embed/";
const INTERNET_ARCHIVE_THUMB_BASE = "https://archive.org/services/img/";

const form = document.querySelector("[data-search-form]");
const input = form.querySelector("input[name='q']");
const submitButton = form.querySelector("button[type='submit']");
const status = document.querySelector("[data-search-status]");
const results = document.querySelector("[data-search-results]");
const filters = [...document.querySelectorAll("[data-media-filter]")];
const dialog = document.querySelector("[data-media-dialog]");
const dialogTitle = document.querySelector("[data-media-dialog-title]");
const videoFrame = document.querySelector("[data-video-frame]");
const dialogClose = document.querySelector("[data-dialog-close]");

let activeRequest;
let activeMediaType = "all";
let lastTrigger;

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function safeArchiveIdentifier(value) {
  return typeof value === "string" && /^[A-Za-z0-9._-]+$/.test(value) ? value : null;
}

function textValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function clearResults() {
  results.replaceChildren();
}

function setBusy(busy) {
  input.disabled = busy;
  submitButton.disabled = busy;
  filters.forEach((filter) => {
    filter.disabled = busy;
  });
  submitButton.textContent = busy ? "Søker …" : "Søk";
}

function createDetails({ title: itemTitle, attribution, source, licenseUrl, licenseLabel }) {
  const details = document.createElement("div");
  details.className = "media-result-details";

  const title = document.createElement("strong");
  title.textContent = itemTitle || "Uten tittel";

  const creator = document.createElement("span");
  creator.textContent = attribution || "Ukjent opphavsperson";

  const meta = document.createElement("div");
  meta.className = "media-result-meta";

  const sourceBadge = document.createElement("span");
  sourceBadge.className = "source-badge";
  sourceBadge.textContent = source;
  meta.append(sourceBadge);

  if (licenseLabel) {
    const license = licenseUrl ? document.createElement("a") : document.createElement("span");
    license.className = "media-result-license";
    license.textContent = licenseLabel;
    if (licenseUrl) {
      license.href = licenseUrl;
      license.target = "_blank";
      license.rel = "noopener noreferrer";
    }
    meta.append(license);
  }

  details.append(title, creator, meta);
  return details;
}

function renderOpenverseImages(items) {
  for (const item of items) {
    const pageUrl = safeHttpUrl(item.foreign_landing_url);
    const thumbnailUrl = safeHttpUrl(item.thumbnail);
    const licenseUrl = safeHttpUrl(item.license_url);
    if (!pageUrl || !thumbnailUrl) continue;

    const article = document.createElement("article");
    article.className = "media-result";

    const sourceLink = document.createElement("a");
    sourceLink.className = "media-result-preview";
    sourceLink.href = pageUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.setAttribute("aria-label", `Se kilden til ${item.title || "bildet"}`);

    const image = document.createElement("img");
    image.src = thumbnailUrl;
    image.alt = item.title || "Bilderesultat";
    image.loading = "lazy";
    image.decoding = "async";

    sourceLink.append(image);
    article.append(sourceLink, createDetails({
      title: item.title,
      attribution: item.creator ? `Av ${item.creator}` : "Ukjent opphavsperson",
      source: "Openverse",
      licenseUrl,
      licenseLabel: item.license ? String(item.license).toUpperCase() : "Lisensinfo"
    }));
    results.append(article);
  }
}

function openArchiveVideo(item, trigger) {
  const identifier = safeArchiveIdentifier(item.identifier);
  if (!identifier) return;

  lastTrigger = trigger;
  dialogTitle.textContent = textValue(item.title) || "Video";

  const iframe = document.createElement("iframe");
  iframe.src = `${INTERNET_ARCHIVE_EMBED_BASE}${encodeURIComponent(identifier)}`;
  iframe.title = dialogTitle.textContent;
  iframe.allow = "fullscreen; autoplay";
  iframe.allowFullscreen = true;
  iframe.loading = "eager";
  videoFrame.replaceChildren(iframe);
  dialog.showModal();
}

function closeVideo() {
  if (dialog.open) dialog.close();
  videoFrame.replaceChildren();
  lastTrigger?.focus();
}

function renderArchiveItems(items) {
  for (const item of items) {
    const identifier = safeArchiveIdentifier(item.identifier);
    if (!identifier) continue;

    const isVideo = item.mediatype === "movies";
    const article = document.createElement("article");
    article.className = "media-result";

    const preview = document.createElement(isVideo ? "button" : "a");
    preview.className = "media-result-preview";
    if (isVideo) {
      preview.type = "button";
      preview.setAttribute("aria-label", `Spill av ${textValue(item.title) || "video"}`);
      preview.addEventListener("click", () => openArchiveVideo(item, preview));
    } else {
      preview.href = `https://archive.org/details/${encodeURIComponent(identifier)}`;
      preview.target = "_blank";
      preview.rel = "noopener noreferrer";
      preview.setAttribute("aria-label", `Se kilden til ${textValue(item.title) || "bildet"}`);
    }

    const image = document.createElement("img");
    image.src = `${INTERNET_ARCHIVE_THUMB_BASE}${encodeURIComponent(identifier)}`;
    image.alt = textValue(item.title) || (isVideo ? "Videoresultat" : "Bilderesultat");
    image.loading = "lazy";
    image.decoding = "async";
    preview.append(image);

    if (isVideo) {
      const playIcon = document.createElement("span");
      playIcon.className = "play-icon";
      playIcon.textContent = "▶";
      playIcon.setAttribute("aria-hidden", "true");
      preview.append(playIcon);
    }

    const creator = textValue(item.creator);
    const year = textValue(item.year || item.date);
    const attribution = [creator ? `Av ${creator}` : "", year].filter(Boolean).join(" · ") || "Ukjent opphavsperson";

    article.append(preview, createDetails({
      title: textValue(item.title),
      attribution,
      source: isVideo ? "Internet Archive · Video" : "Internet Archive",
      licenseUrl: safeHttpUrl(textValue(item.licenseurl)),
      licenseLabel: item.licenseurl ? "Lisens" : "Kontroller rettigheter"
    }));
    results.append(article);
  }
}

function openverseRequest(query, signal) {
  if (activeMediaType === "video") return Promise.resolve([]);

  const url = new URL(OPENVERSE_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", activeMediaType === "all" ? "12" : "20");
  url.searchParams.set("mature", "false");

  return fetch(url, { signal, headers: { accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("openverse-search-failed");
      return response.json();
    })
    .then((payload) => Array.isArray(payload.results) ? payload.results : []);
}

function archiveRequest(query, signal) {
  const mediaQuery = activeMediaType === "video"
    ? "mediatype:movies"
    : activeMediaType === "images"
      ? "mediatype:image"
      : "mediatype:(movies OR image)";
  const url = new URL(INTERNET_ARCHIVE_ENDPOINT);
  url.searchParams.set("q", `${mediaQuery} AND (${query})`);
  ["identifier", "title", "creator", "year", "date", "mediatype", "licenseurl"].forEach((field) => {
    url.searchParams.append("fl[]", field);
  });
  url.searchParams.set("rows", activeMediaType === "all" ? "12" : "20");
  url.searchParams.set("page", "1");
  url.searchParams.set("output", "json");

  return fetch(url, { signal, headers: { accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("archive-search-failed");
      return response.json();
    })
    .then((payload) => Array.isArray(payload?.response?.docs) ? payload.response.docs : []);
}

async function search(query) {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  clearResults();
  setBusy(true);
  status.textContent = "Søker etter medier …";

  try {
    const requests = [archiveRequest(query, request.signal)];
    if (activeMediaType !== "video") requests.unshift(openverseRequest(query, request.signal));
    const settled = await Promise.allSettled(requests);
    if (request.signal.aborted) return;

    let openverseItems = [];
    let archiveItems = [];
    if (activeMediaType === "video") {
      archiveItems = settled[0].status === "fulfilled" ? settled[0].value : [];
    } else {
      openverseItems = settled[0].status === "fulfilled" ? settled[0].value : [];
      archiveItems = settled[1].status === "fulfilled" ? settled[1].value : [];
    }
    if (settled.every((request) => request.status === "rejected")) throw new Error("search-failed");

    renderOpenverseImages(openverseItems);
    renderArchiveItems(archiveItems);
    const visibleCount = results.childElementCount;
    status.textContent = visibleCount
      ? `${visibleCount} medier funnet`
      : "Ingen medier funnet. Prøv et annet søk.";
  } catch (error) {
    if (error.name === "AbortError") return;
    status.textContent = "Mediesøket er midlertidig utilgjengelig. Prøv igjen.";
  } finally {
    if (activeRequest === request) {
      activeRequest = undefined;
      setBusy(false);
    }
  }
}

function updateBrowserUrl(query) {
  const browserUrl = new URL(location.href);
  if (query) browserUrl.searchParams.set("q", query);
  browserUrl.searchParams.set("type", activeMediaType);
  history.replaceState(null, "", browserUrl);
}

function selectMediaType(mediaType, shouldSearch = true) {
  activeMediaType = ["all", "images", "video"].includes(mediaType) ? mediaType : "all";
  filters.forEach((filter) => {
    filter.setAttribute("aria-pressed", String(filter.dataset.mediaFilter === activeMediaType));
  });
  const query = input.value.trim();
  updateBrowserUrl(query);
  if (shouldSearch && query) search(query);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  updateBrowserUrl(query);
  search(query);
});

filters.forEach((filter) => {
  filter.addEventListener("click", () => selectMediaType(filter.dataset.mediaFilter));
});

dialogClose.addEventListener("click", closeVideo);
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeVideo();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeVideo();
});

const browserUrl = new URL(location.href);
const initialQuery = browserUrl.searchParams.get("q")?.trim();
selectMediaType(browserUrl.searchParams.get("type") || "all", false);
if (initialQuery) {
  input.value = initialQuery;
  search(initialQuery);
}
