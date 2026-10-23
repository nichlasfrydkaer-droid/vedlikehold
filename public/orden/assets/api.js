const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://127.0.0.1:8787"
  : "https://orden-api.vedlikeholdsystem.no";

let csrfToken = sessionStorage.getItem("ordenCsrfToken") || "";

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
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
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  } catch {
    throw new ApiError("Der kunne ikke oprettes forbindelse til systemet.", 0, "network_error");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data?.error?.message || "Der opstod en fejl.", response.status, data?.error?.code || "request_error");
  if (data.csrfToken) setCsrfToken(data.csrfToken);
  return data;
}

export const endpoints = {
  setupStatus: () => api("/v1/setup/status"),
  login: (email, password) => api("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api("/v1/auth/me"),
  logout: () => api("/v1/auth/logout", { method: "POST" }),
  selectEventType: (eventType) => api("/v1/auth/event-type", { method: "POST", body: JSON.stringify({ eventType }) }),
  users: () => api("/v1/admin/users"),
  createUser: (payload) => api("/v1/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) => api(`/v1/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
};
