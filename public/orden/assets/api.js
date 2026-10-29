const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://127.0.0.1:8787"
  : "https://orden-api.vedlikeholdsystem.no";

let csrfToken = sessionStorage.getItem("ordenCsrfToken") || "";
let apiLocale = localStorage.getItem("ordenLocale") || "nb-NO";

export class ApiError extends Error {
  constructor(status, code, parameters = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.parameters = parameters;
  }
}

export function setApiLocale(locale) {
  apiLocale = locale || "nb-NO";
}

export function setCsrfToken(token) {
  csrfToken = token || "";
  if (csrfToken) sessionStorage.setItem("ordenCsrfToken", csrfToken);
  else sessionStorage.removeItem("ordenCsrfToken");
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET" && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  headers.set("Accept-Language", apiLocale);
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  } catch {
    throw new ApiError(0, "network_error");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data?.error?.code || "request_error", data?.error?.parameters || {});
  if (data.csrfToken) setCsrfToken(data.csrfToken);
  return data;
}

export const endpoints = {
  setupStatus: () => api("/v1/setup/status"),
  completeSetup: (token, password) => api("/v1/auth/complete-setup", { method: "POST", body: JSON.stringify({ token, password }) }),
  login: (email, password) => api("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api("/v1/auth/me"),
  logout: () => api("/v1/auth/logout", { method: "POST" }),
  selectEventType: (eventType) => api("/v1/auth/event-type", { method: "POST", body: JSON.stringify({ eventType }) }),
  updatePreferences: (locale) => api("/v1/auth/preferences", { method: "PATCH", body: JSON.stringify({ locale }) }),
  users: () => api("/v1/admin/users"),
  createUser: (payload) => api("/v1/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) => api(`/v1/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  baseItems: (entity) => api(`/v1/base/${entity}`),
  createBaseItem: (entity, payload) => api(`/v1/base/${entity}`, { method: "POST", body: JSON.stringify(payload) }),
  updateBaseItem: (entity, id, payload) => api(`/v1/base/${entity}/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  baseSettings: () => api("/v1/base/settings"),
  updateBaseSettings: (payload) => api("/v1/base/settings", { method: "PATCH", body: JSON.stringify(payload) }),
  venues: () => api("/v1/venues"),
  events: () => api("/v1/events"),
  event: (id) => api(`/v1/events/${id}`),
  createEvent: (payload) => api("/v1/events", { method: "POST", body: JSON.stringify(payload) }),
  updateEvent: (id, payload) => api(`/v1/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateEventSchedule: (id, payload) => api(`/v1/events/${id}/schedule`, { method: "PUT", body: JSON.stringify(payload) }),
  completeEventSetup: (id) => api(`/v1/events/${id}/complete`, { method: "POST" }),
};
