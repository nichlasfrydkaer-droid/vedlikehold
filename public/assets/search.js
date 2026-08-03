const OPENVERSE_ENDPOINT = "https://api.openverse.org/v1/images/";

const form = document.querySelector("[data-search-form]");
const input = form.querySelector("input[name='q']");
const submitButton = form.querySelector("button[type='submit']");
const status = document.querySelector("[data-search-status]");
const results = document.querySelector("[data-search-results]");

let activeRequest;

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function clearResults() {
  results.replaceChildren();
}

function setBusy(busy) {
  input.disabled = busy;
  submitButton.disabled = busy;
  submitButton.textContent = busy ? "Søker …" : "Søk";
}

function renderImages(items) {
  for (const item of items) {
    const pageUrl = safeHttpUrl(item.foreign_landing_url);
    const thumbnailUrl = safeHttpUrl(item.thumbnail);
    const licenseUrl = safeHttpUrl(item.license_url);
    if (!pageUrl || !thumbnailUrl) continue;

    const article = document.createElement("article");
    article.className = "image-result";

    const sourceLink = document.createElement("a");
    sourceLink.className = "image-result-preview";
    sourceLink.href = pageUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";

    const image = document.createElement("img");
    image.src = thumbnailUrl;
    image.alt = item.title || "Bilderesultat";
    image.loading = "lazy";
    image.decoding = "async";

    const details = document.createElement("div");
    details.className = "image-result-details";

    const title = document.createElement("strong");
    title.textContent = item.title || "Uten tittel";

    const attribution = document.createElement("span");
    attribution.textContent = item.creator ? `Av ${item.creator}` : "Ukjent opphavsperson";

    sourceLink.append(image);
    details.append(title, attribution);

    if (item.license) {
      const license = licenseUrl ? document.createElement("a") : document.createElement("span");
      license.className = "image-result-license";
      license.textContent = item.license.toUpperCase();
      if (licenseUrl) {
        license.href = licenseUrl;
        license.target = "_blank";
        license.rel = "noopener noreferrer";
      }
      details.append(license);
    }

    article.append(sourceLink, details);
    results.append(article);
  }
}

async function search(query) {
  activeRequest?.abort();
  activeRequest = new AbortController();
  clearResults();
  setBusy(true);
  status.textContent = "Søker etter bilder …";

  const url = new URL(OPENVERSE_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "30");
  url.searchParams.set("mature", "false");

  try {
    const response = await fetch(url, {
      signal: activeRequest.signal,
      headers: { accept: "application/json" }
    });
    if (!response.ok) throw new Error("search-failed");
    const payload = await response.json();
    const items = Array.isArray(payload.results) ? payload.results : [];
    renderImages(items);
    const visibleCount = results.childElementCount;
    status.textContent = visibleCount
      ? `${visibleCount} bilder med åpen lisens`
      : "Ingen bilder funnet. Prøv et annet søk.";
  } catch (error) {
    if (error.name === "AbortError") return;
    status.textContent = "Bildesøket er midlertidig utilgjengelig. Prøv igjen.";
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  const browserUrl = new URL(location.href);
  browserUrl.searchParams.set("q", query);
  history.replaceState(null, "", browserUrl);
  search(query);
});

const initialQuery = new URL(location.href).searchParams.get("q")?.trim();
if (initialQuery) {
  input.value = initialQuery;
  search(initialQuery);
}
