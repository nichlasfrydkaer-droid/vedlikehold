import { ApiError, endpoints, setApiLocale, setCsrfToken } from "./api.js";
import { formatDate, getLocale, getLocales, initI18n, setLocale, t } from "./i18n.js";

const app = document.querySelector("#app");
const state = { user: null, users: [], base: { guards: [], posts: [], contacts: [], settings: null }, events: [], venues: [], event: null, eventWizardStep: 1, configured: true, mobileMenu: false, setupComplete: false };

const icons = {
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 1-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  badge: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10 3.05V3h4v.05a1.7 1.7 0 0 0 1.03 1.52 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function errorText(error) {
  return t(`errors.${error?.code || "request_error"}`, error?.parameters || {});
}

function route() {
  const path = location.pathname.replace(/\/+$/, "") || "/orden";
  if (!path.startsWith("/orden")) return "home";
  if (path === "/orden/login") return "login";
  if (path === "/orden/opprett-passord") return "setup-password";
  if (path === "/orden/brukere" || path === "/orden/brugere") return "users";
  if (path === "/orden/innstillinger") return "settings";
  if (path === "/orden/grunnoppsett") return "base";
  if (path === "/orden/ordensvakter") return "base-guards";
  if (path === "/orden/ordensposter") return "base-posts";
  if (path === "/orden/kontaktpersoner") return "base-contacts";
  if (path === "/orden/grunninnstillinger") return "base-defaults";
  if (path === "/orden/stevner") return "events";
  if (path === "/orden/stevne") return "event-wizard";
  return "home";
}

function isBaseRoute(value = route()) {
  return value === "base" || value.startsWith("base-");
}

function navigate(path) {
  history.pushState({}, "", path);
  state.mobileMenu = false;
  if (path === "/orden/brukere" && state.user?.role === "system_admin") {
    loadUsers().catch((error) => { toast(errorText(error), "error"); render(); });
  } else if (path === "/orden") {
    loadEvents().catch((error) => { toast(errorText(error), "error"); render(); });
  } else if (path === "/orden/stevner") {
    loadEvents().catch((error) => { toast(errorText(error), "error"); render(); });
  } else if (path.startsWith("/orden/stevne")) {
    loadEventWorkspace().catch((error) => { toast(errorText(error), "error"); render(); });
  } else if (isBaseRoute()) loadBaseData().catch((error) => { toast(errorText(error), "error"); render(); });
  else render();
}

function toast(message, kind = "success") {
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
  element.className = `toast toast--${kind}`;
  element.setAttribute("role", "status");
  element.textContent = message;
  document.body.append(element);
  setTimeout(() => element.remove(), 4500);
}

function localeOptions(selected = getLocale()) {
  return getLocales().map(({ code, name }) => `<option value="${escapeHtml(code)}" ${code === selected ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
}

function brand() {
  return `<a class="brand" href="/orden" data-link><span class="brand-mark">OV</span><span><strong>${escapeHtml(t("brand.name"))}</strong><small>${escapeHtml(t("brand.subtitle"))}</small></span></a>`;
}

function loginView() {
  const languageSelect = `<label class="public-language"><span>${escapeHtml(t("common.language"))}</span><select id="public-locale-select">${localeOptions()}</select></label>`;
  if (!state.configured) {
    return `<main class="login-shell"><section class="login-card setup-card">${brand()}${languageSelect}<div class="login-heading"><span class="eyebrow">${escapeHtml(t("setup.phaseReady"))}</span><h1>${escapeHtml(t("setup.adminMissing"))}</h1><p>${escapeHtml(t("setup.adminMissingBody"))}</p></div><div class="notice notice--info"><strong>${escapeHtml(t("setup.nextStep"))}</strong><span>${escapeHtml(t("setup.nextStepBody"))}</span></div></section></main>`;
  }
  return `<main class="login-shell"><section class="login-card">${brand()}${languageSelect}<div class="login-heading"><span class="eyebrow">${escapeHtml(t("auth.secureAdministration"))}</span><h1>${escapeHtml(t("auth.welcomeBack"))}</h1><p>${escapeHtml(t("auth.loginIntro"))}</p></div><form id="login-form" class="form-stack"><label>${escapeHtml(t("auth.email"))}<input name="email" type="email" autocomplete="username" inputmode="email" required autofocus></label><label>${escapeHtml(t("auth.password"))}<input name="password" type="password" autocomplete="current-password" required></label><p class="form-error" hidden></p><button class="button button--primary button--large" type="submit">${escapeHtml(t("auth.login"))}</button></form><p class="privacy-note">${escapeHtml(t("auth.privacy"))}</p></section><aside class="login-visual"><div><span class="visual-kicker">${escapeHtml(t("auth.visualKicker"))}</span><h2>${escapeHtml(t("auth.visualTitle"))}</h2><p>${escapeHtml(t("auth.visualBody"))}</p></div></aside></main>`;
}

function setupPasswordView() {
  const token = new URLSearchParams(location.search).get("token") || "";
  const languageSelect = `<label class="public-language"><span>${escapeHtml(t("common.language"))}</span><select id="public-locale-select">${localeOptions()}</select></label>`;
  if (state.setupComplete) {
    return `<main class="login-shell"><section class="login-card setup-card">${brand()}${languageSelect}<div class="login-heading"><span class="eyebrow">${escapeHtml(t("accountSetup.completeEyebrow"))}</span><h1>${escapeHtml(t("accountSetup.completeTitle"))}</h1><p>${escapeHtml(t("accountSetup.completeBody"))}</p></div><a class="button button--primary button--large button-link" href="/orden/login" data-link>${escapeHtml(t("accountSetup.goToLogin"))}</a></section><aside class="login-visual"><div><span class="visual-kicker">${escapeHtml(t("auth.visualKicker"))}</span><h2>${escapeHtml(t("auth.visualTitle"))}</h2><p>${escapeHtml(t("auth.visualBody"))}</p></div></aside></main>`;
  }
  return `<main class="login-shell"><section class="login-card setup-card">${brand()}${languageSelect}<div class="login-heading"><span class="eyebrow">${escapeHtml(t("accountSetup.eyebrow"))}</span><h1>${escapeHtml(t("accountSetup.title"))}</h1><p>${escapeHtml(t(token ? "accountSetup.intro" : "accountSetup.missingToken"))}</p></div>${token ? `<form id="setup-password-form" class="form-stack"><label>${escapeHtml(t("accountSetup.password"))}<input name="password" type="password" autocomplete="new-password" minlength="12" required autofocus><small>${escapeHtml(t("users.passwordHint"))}</small></label><label>${escapeHtml(t("accountSetup.confirmPassword"))}<input name="passwordConfirm" type="password" autocomplete="new-password" minlength="12" required></label><p class="form-error" hidden></p><button class="button button--primary button--large" type="submit">${escapeHtml(t("accountSetup.submit"))}</button></form>` : `<a class="button button--secondary button--large button-link" href="/orden/login" data-link>${escapeHtml(t("accountSetup.goToLogin"))}</a>`}</section><aside class="login-visual"><div><span class="visual-kicker">${escapeHtml(t("auth.visualKicker"))}</span><h2>${escapeHtml(t("auth.visualTitle"))}</h2><p>${escapeHtml(t("auth.visualBody"))}</p></div></aside></main>`;
}

function eventTypeLabel(value) {
  return t(value === "regional" ? "eventType.regional" : "eventType.circuit");
}

function navItem(path, labelKey, icon, current, disabled = false) {
  const label = t(labelKey);
  if (disabled) return `<span class="nav-item is-disabled" aria-disabled="true">${icons[icon]}<span>${escapeHtml(label)}</span><small>${escapeHtml(t("common.notYet"))}</small></span>`;
  return `<a class="nav-item ${current === path ? "is-active" : ""}" href="${path}" data-link>${icons[icon]}<span>${escapeHtml(label)}</span></a>`;
}

function roleLabel(role) {
  return t(role === "system_admin" ? "role.systemAdmin" : "role.orderResponsible");
}

function shell(content, pageTitle) {
  const current = location.pathname.replace(/\/+$/, "") || "/orden";
  const currentNav = current === "/orden/stevne" ? "/orden/stevner" : current;
  const canManageUsers = state.user.role === "system_admin";
  const selector = state.user.eventTypes.length > 1
    ? `<label class="type-select"><span>${escapeHtml(t("eventType.label"))}</span><select id="event-type-select">${state.user.eventTypes.map((type) => `<option value="${type}" ${type === state.user.selectedEventType ? "selected" : ""}>${escapeHtml(eventTypeLabel(type))}</option>`).join("")}</select></label>`
    : `<div class="type-pill">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</div>`;
  return `<div class="app-shell ${state.mobileMenu ? "menu-open" : ""}"><button class="menu-backdrop" aria-label="${escapeHtml(t("common.closeMenu"))}"></button><aside class="sidebar"><div class="sidebar-top">${brand()}<button class="icon-button close-menu" aria-label="${escapeHtml(t("common.closeMenu"))}">${icons.close}</button></div><nav aria-label="${escapeHtml(t("common.mainMenu"))}">${navItem("/orden", "nav.home", "home", currentNav)}${navItem("/orden/stevner", "nav.events", "calendar", currentNav)}<div class="nav-divider"></div>${navItem("/orden/ordensvakter", "nav.guards", "badge", currentNav)}${navItem("/orden/ordensposter", "nav.posts", "pin", currentNav)}${navItem("/orden/kontaktpersoner", "nav.contacts", "phone", currentNav)}${navItem("/orden/grunninnstillinger", "nav.defaults", "clock", currentNav)}<div class="nav-divider"></div>${canManageUsers ? navItem("/orden/brukere", "nav.users", "users", currentNav) : ""}${navItem("/orden/innstillinger", "nav.settings", "settings", currentNav)}</nav><div class="sidebar-footer"><div class="user-mini"><span>${escapeHtml(state.user.name.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(state.user.name)}</strong><small>${escapeHtml(roleLabel(state.user.role))}</small></div></div><button id="logout-button" class="nav-item nav-button">${icons.logout}<span>${escapeHtml(t("auth.logout"))}</span></button></div></aside><div class="main-column"><header class="topbar"><button class="icon-button open-menu" aria-label="${escapeHtml(t("common.openMenu"))}">${icons.menu}</button><div><span class="topbar-label">${escapeHtml(t("app.title"))}</span><strong>${escapeHtml(pageTitle)}</strong></div>${selector}</header>${content}</div></div>`;
}

function todayString() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function dateLabel(startDate, endDate = startDate) {
  const start = formatDate(`${startDate}T12:00:00Z`);
  return startDate === endDate ? start : `${start} – ${formatDate(`${endDate}T12:00:00Z`)}`;
}

function eventStatusLabel(status) {
  return t(`event.status.${status}`);
}

function homeView() {
  const type = eventTypeLabel(state.user.selectedEventType).toLocaleLowerCase(getLocale());
  const upcoming = state.events.find((event) => event.endDate >= todayString() && !["completed", "cancelled"].includes(event.status));
  const upcomingCard = upcoming
    ? `<a class="action-card action-card-link" href="/orden/stevne?id=${encodeURIComponent(upcoming.id)}" data-link><div class="action-icon">${icons.shield}</div><div><span class="eyebrow">${escapeHtml(t("home.nextEvent"))}</span><h2>${escapeHtml(upcoming.name)}</h2><p>${escapeHtml(dateLabel(upcoming.startDate, upcoming.endDate))} · ${escapeHtml(upcoming.venue.name)}, ${escapeHtml(upcoming.venue.city)}</p></div><span class="empty-chip">${escapeHtml(eventStatusLabel(upcoming.status))}</span></a>`
    : `<article class="action-card"><div class="action-icon">${icons.shield}</div><div><span class="eyebrow">${escapeHtml(t("home.nextEvent"))}</span><h2>${escapeHtml(t("home.noUpcoming", { type }))}</h2><p>${escapeHtml(t("home.nextEventBody"))}</p></div><span class="empty-chip">${escapeHtml(t("home.noData"))}</span></article>`;
  return shell(`<main class="page page--home"><section class="hero-panel"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(t("home.greeting", { name: state.user.name.split(" ")[0] }))}</h1><p>${escapeHtml(t("home.eventFoundationBody"))}</p></div><div class="phase-badge"><span>${escapeHtml(t("home.phase"))}</span><strong>${escapeHtml(t("home.eventCreation"))}</strong><small>${escapeHtml(t("home.savedContinuously"))}</small></div></section><section class="action-grid" aria-label="${escapeHtml(t("home.eventActions"))}"><a class="action-card action-card--primary action-card-link" href="/orden/stevne" data-link><div class="action-icon">${icons.calendar}</div><div><span class="eyebrow">${escapeHtml(t("home.planning"))}</span><h2>${escapeHtml(t("home.createEvent"))}</h2><p>${escapeHtml(t("home.createEventReady"))}</p></div><span class="button button--primary">${escapeHtml(t("event.create"))}</span></a>${upcomingCard}</section></main>`, t("nav.home"));
}

function accessLabel(types) {
  if (types.length === 2) return t("eventType.both");
  return t(types[0] === "regional" ? "eventType.regionalPlural" : "eventType.circuitPlural");
}

function usersView() {
  const noun = t(state.users.length === 1 ? "common.userOne" : "common.userMany");
  return shell(`<main class="page"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(t("users.accessControl"))}</span><h1>${escapeHtml(t("users.title"))}</h1><p>${escapeHtml(t("users.intro"))}</p></div><button id="show-create-user" class="button button--primary">+ ${escapeHtml(t("users.create"))}</button></section><section id="create-user-panel" class="content-card form-panel" hidden><div class="section-heading"><div><h2>${escapeHtml(t("users.newAccount"))}</h2><p>${escapeHtml(t("users.newAccountBody"))}</p></div><button class="icon-button" id="hide-create-user" aria-label="${escapeHtml(t("common.close"))}">${icons.close}</button></div><form id="create-user-form" class="user-form"><label>${escapeHtml(t("users.name"))}<input name="name" required minlength="2" maxlength="120"></label><label>${escapeHtml(t("auth.email"))}<input name="email" type="email" required></label><label>${escapeHtml(t("users.temporaryPassword"))}<input name="password" type="password" minlength="12" required><small>${escapeHtml(t("users.passwordHint"))}</small></label><label>${escapeHtml(t("users.role"))}<select name="role"><option value="order_responsible">${escapeHtml(t("role.orderResponsible"))}</option><option value="system_admin">${escapeHtml(t("role.systemAdmin"))}</option></select></label><fieldset><legend>${escapeHtml(t("users.eventAccess"))}</legend><label class="check-row"><input type="checkbox" name="eventTypes" value="circuit" checked><span>${escapeHtml(t("eventType.circuitPlural"))}</span></label><label class="check-row"><input type="checkbox" name="eventTypes" value="regional"><span>${escapeHtml(t("eventType.regionalPlural"))}</span></label></fieldset><p class="form-error full-width" hidden></p><div class="form-actions full-width"><button type="button" class="button button--secondary" id="cancel-create-user">${escapeHtml(t("common.cancel"))}</button><button type="submit" class="button button--primary">${escapeHtml(t("users.create"))}</button></div></form></section><section class="content-card users-card"><div class="section-heading"><div><h2>${escapeHtml(t("users.accounts"))}</h2><p>${escapeHtml(t("users.count", { count: state.users.length, noun }))}</p></div></div><div class="user-list">${state.users.map((user) => `<article class="user-row ${user.active ? "" : "is-inactive"}" data-user-id="${user.id}"><span class="avatar">${escapeHtml(user.name.slice(0, 1).toUpperCase())}</span><div class="user-identity"><strong>${escapeHtml(user.name)}</strong><a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a></div><div class="user-meta"><span>${escapeHtml(roleLabel(user.role))}</span><small>${escapeHtml(accessLabel(user.eventTypes))}</small></div><span class="state-chip ${user.active ? "is-active" : ""}">${escapeHtml(t(user.active ? "common.active" : "common.inactive"))}</span><button class="button button--secondary edit-user" data-id="${user.id}">${escapeHtml(t("common.edit"))}</button></article>`).join("")}</div></section><section id="edit-user-panel" class="content-card form-panel" hidden></section></main>`, t("users.title"));
}

function editUserPanel(user) {
  return `<div class="section-heading"><div><h2>${escapeHtml(t("users.editTitle", { name: user.name }))}</h2><p>${escapeHtml(t("users.emptyPassword"))}</p></div><button class="icon-button" id="hide-edit-user" aria-label="${escapeHtml(t("common.close"))}">${icons.close}</button></div><form id="edit-user-form" class="user-form" data-id="${user.id}"><label>${escapeHtml(t("users.name"))}<input name="name" value="${escapeHtml(user.name)}" required></label><label>${escapeHtml(t("auth.email"))}<input name="email" type="email" value="${escapeHtml(user.email)}" required></label><label>${escapeHtml(t("users.newPassword"))}<input name="password" type="password" minlength="12" placeholder="${escapeHtml(t("users.keepPassword"))}"><small>${escapeHtml(t("users.passwordHint"))}</small></label><label>${escapeHtml(t("users.role"))}<select name="role"><option value="order_responsible" ${user.role === "order_responsible" ? "selected" : ""}>${escapeHtml(t("role.orderResponsible"))}</option><option value="system_admin" ${user.role === "system_admin" ? "selected" : ""}>${escapeHtml(t("role.systemAdmin"))}</option></select></label><fieldset><legend>${escapeHtml(t("users.eventAccess"))}</legend><label class="check-row"><input type="checkbox" name="eventTypes" value="circuit" ${user.eventTypes.includes("circuit") ? "checked" : ""}><span>${escapeHtml(t("eventType.circuitPlural"))}</span></label><label class="check-row"><input type="checkbox" name="eventTypes" value="regional" ${user.eventTypes.includes("regional") ? "checked" : ""}><span>${escapeHtml(t("eventType.regionalPlural"))}</span></label></fieldset><label class="check-row active-toggle"><input type="checkbox" name="active" ${user.active ? "checked" : ""}><span>${escapeHtml(t("users.accountActive"))}</span></label><p class="form-error full-width" hidden></p><div class="form-actions full-width"><button type="button" class="button button--secondary" id="cancel-edit-user">${escapeHtml(t("common.cancel"))}</button><button type="submit" class="button button--primary">${escapeHtml(t("users.saveChanges"))}</button></div></form>`;
}

function settingsView() {
  return shell(`<main class="page"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(t("settings.personal"))}</span><h1>${escapeHtml(t("settings.title"))}</h1><p>${escapeHtml(t("settings.intro"))}</p></div></section><section class="content-card settings-card"><div class="settings-copy"><div class="action-icon">${icons.settings}</div><div><h2>${escapeHtml(t("settings.languageTitle"))}</h2><p>${escapeHtml(t("settings.languageBody"))}</p></div></div><label class="settings-control"><span>${escapeHtml(t("common.language"))}</span><select id="settings-locale-select">${localeOptions(state.user.locale || getLocale())}</select></label></section></main>`, t("settings.title"));
}

function eventCard(event) {
  return `<a class="event-row" href="/orden/stevne?id=${encodeURIComponent(event.id)}" data-link><span class="event-date-badge"><strong>${escapeHtml(new Intl.DateTimeFormat(getLocale(), { day: "2-digit" }).format(new Date(`${event.startDate}T12:00:00Z`)))}</strong><small>${escapeHtml(new Intl.DateTimeFormat(getLocale(), { month: "short" }).format(new Date(`${event.startDate}T12:00:00Z`)))}</small></span><div><strong>${escapeHtml(event.name)}</strong><small>${escapeHtml(dateLabel(event.startDate, event.endDate))} · ${escapeHtml(event.venue.name)}, ${escapeHtml(event.venue.city)}</small></div><span class="state-chip ${event.status === "planning" || event.status === "ready" ? "is-active" : ""}">${escapeHtml(eventStatusLabel(event.status))}</span><span class="event-arrow">→</span></a>`;
}

function eventsView() {
  const today = todayString();
  const upcoming = state.events.filter((event) => event.endDate >= today && !["completed", "cancelled"].includes(event.status));
  const history = state.events.filter((event) => event.endDate < today || ["completed", "cancelled"].includes(event.status)).reverse();
  const list = (items, emptyKey) => items.length ? `<div class="event-list">${items.map(eventCard).join("")}</div>` : `<p class="base-empty">${escapeHtml(t(emptyKey))}</p>`;
  return shell(`<main class="page"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(t("event.titlePlural"))}</h1><p>${escapeHtml(t("event.listIntro"))}</p></div><a class="button button--primary button-link" href="/orden/stevne" data-link>+ ${escapeHtml(t("event.create"))}</a></section><section class="content-card"><div class="section-heading"><div><h2>${escapeHtml(t("event.upcoming"))}</h2><p>${escapeHtml(t("event.upcomingCount", { count: upcoming.length }))}</p></div></div>${list(upcoming, "event.noUpcoming")}</section><section class="content-card event-history"><div class="section-heading"><div><h2>${escapeHtml(t("event.history"))}</h2><p>${escapeHtml(t("event.historyIntro"))}</p></div></div>${list(history, "event.noHistory")}</section></main>`, t("event.titlePlural"));
}

function wizardHeader() {
  const steps = ["event.stepDateVenue", "event.stepShifts", "event.stepReview"];
  return `<ol class="wizard-steps">${steps.map((key, index) => `<li class="${state.eventWizardStep === index + 1 ? "is-current" : state.eventWizardStep > index + 1 ? "is-complete" : ""}"><span>${state.eventWizardStep > index + 1 ? "✓" : index + 1}</span><strong>${escapeHtml(t(key))}</strong></li>`).join("")}</ol>`;
}

function eventStepOne() {
  const event = state.event;
  const selectedVenueId = event?.venueId && state.venues.some((venue) => venue.id === event.venueId) ? event.venueId : state.venues[0]?.id || "__new__";
  const newSelected = selectedVenueId === "__new__";
  const options = state.venues.map((venue) => `<option value="${escapeHtml(venue.id)}" ${venue.id === selectedVenueId ? "selected" : ""}>${escapeHtml(venue.name)} · ${escapeHtml(venue.city)}</option>`).join("");
  return `<section class="content-card wizard-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("event.step", { current: 1, total: 3 }))}</span><h2>${escapeHtml(t("event.dateVenueTitle"))}</h2><p>${escapeHtml(t("event.dateVenueIntro", { type: eventTypeLabel(state.user.selectedEventType).toLocaleLowerCase(getLocale()) }))}</p></div></div><form id="event-details-form" class="wizard-form"><label>${escapeHtml(t("event.startDate"))}<input name="startDate" type="date" value="${escapeHtml(event?.startDate || "")}" required><small>${escapeHtml(t(state.user.selectedEventType === "regional" ? "event.regionalDuration" : "event.circuitDuration"))}</small></label><label>${escapeHtml(t("event.venue"))}<select name="venueId" id="event-venue-select">${options}<option value="__new__" ${newSelected ? "selected" : ""}>+ ${escapeHtml(t("event.newVenue"))}</option></select><small>${escapeHtml(t("event.venueSavedHint"))}</small></label><fieldset id="new-venue-fields" class="wide venue-fields" ${newSelected ? "" : "hidden"}><legend>${escapeHtml(t("event.newVenue"))}</legend><div class="venue-grid"><label>${escapeHtml(t("event.venueName"))}<input name="venueName" maxlength="120"></label><label>${escapeHtml(t("event.address"))}<input name="address" autocomplete="street-address"></label><label>${escapeHtml(t("event.postalCode"))}<input name="postalCode" autocomplete="postal-code"></label><label>${escapeHtml(t("event.city"))}<input name="city" autocomplete="address-level2"></label><label>${escapeHtml(t("event.country"))}<input name="country" autocomplete="country-name"></label><label>${escapeHtml(t("base.notes"))}<input name="venueNotes"></label></div></fieldset><p class="form-error wide" hidden></p><div class="form-actions wide"><a class="button button--secondary button-link" href="/orden/stevner" data-link>${escapeHtml(t("common.cancel"))}</a><button class="button button--primary" type="submit">${escapeHtml(t("event.saveContinue"))}</button></div></form></section>`;
}

function eventStepTwo() {
  const event = state.event;
  if (!event) return "";
  const days = event.days.map((day, dayIndex) => `<article class="schedule-day" data-day-index="${dayIndex}"><header><div><span class="eyebrow">${escapeHtml(t("event.dayNumber", { number: day.dayNumber }))}</span><h3>${escapeHtml(formatDate(`${day.date}T12:00:00Z`))}</h3></div><div class="day-controls"><label>${escapeHtml(t("event.dayStart"))}<input type="time" class="day-start" value="${day.dayStart}"></label><label>${escapeHtml(t("event.dayEnd"))}<input type="time" class="day-end" value="${day.dayEnd}"></label><label>${escapeHtml(t("event.shiftCount"))}<input type="number" class="day-shift-count" min="1" max="12" value="${day.shifts.length}"></label></div></header><div class="shift-list">${day.shifts.map((shift, shiftIndex) => `<div class="shift-row" data-shift-index="${shiftIndex}"><strong>${escapeHtml(t("event.shiftNumber", { number: shiftIndex + 1 }))}</strong><label>${escapeHtml(t("event.from"))}<input type="time" class="shift-start" value="${shift.startTime}"></label><span>→</span><label>${escapeHtml(t("event.to"))}<input type="time" class="shift-end" value="${shift.endTime}"></label></div>`).join("")}</div></article>`).join("");
  return `<section class="content-card wizard-card wizard-card--wide"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("event.step", { current: 2, total: 3 }))}</span><h2>${escapeHtml(t("event.shiftsTitle"))}</h2><p>${escapeHtml(t("event.shiftsIntro"))}</p></div></div><div class="schedule-days">${days}</div><p id="schedule-error" class="form-error" hidden></p><div class="wizard-actions"><button class="button button--secondary wizard-back" data-step="1">${escapeHtml(t("common.back"))}</button><button id="save-event-schedule" class="button button--primary">${escapeHtml(t("event.saveContinue"))}</button></div></section>`;
}

function eventStepThree() {
  const event = state.event;
  if (!event) return "";
  const daySummary = event.days.map((day) => `<li><strong>${escapeHtml(formatDate(`${day.date}T12:00:00Z`))}</strong><span>${escapeHtml(day.dayStart)}–${escapeHtml(day.dayEnd)} · ${escapeHtml(t("event.shiftCountValue", { count: day.shifts.length }))}</span></li>`).join("");
  const completed = event.status !== "draft";
  return `<section class="content-card wizard-card"><div class="review-status ${completed ? "is-complete" : ""}"><span>${completed ? "✓" : "3"}</span><div><h2>${escapeHtml(t(completed ? "event.createdTitle" : "event.reviewTitle"))}</h2><p>${escapeHtml(t(completed ? "event.createdBody" : "event.reviewIntro"))}</p></div></div><div class="event-review"><div><span>${escapeHtml(t("event.generatedName"))}</span><strong>${escapeHtml(event.name)}</strong></div><div><span>${escapeHtml(t("event.date"))}</span><strong>${escapeHtml(dateLabel(event.startDate, event.endDate))}</strong></div><div><span>${escapeHtml(t("event.venue"))}</span><strong>${escapeHtml(event.venue.name)}</strong><small>${escapeHtml([event.venue.address, event.venue.postalCode, event.venue.city, event.venue.country].filter(Boolean).join(", "))}</small></div><div class="wide"><span>${escapeHtml(t("event.shifts"))}</span><ul>${daySummary}</ul></div></div><div class="wizard-actions"><button class="button button--secondary wizard-back" data-step="1">${escapeHtml(t("event.editDateVenue"))}</button><button class="button button--secondary wizard-back" data-step="2">${escapeHtml(t("event.editShifts"))}</button>${completed ? `<a class="button button--primary button-link" href="/orden/stevner" data-link>${escapeHtml(t("event.backToEvents"))}</a>` : `<button id="complete-event-setup" class="button button--primary">${escapeHtml(t("event.completeSetup"))}</button>`}</div></section>`;
}

function eventWizardView() {
  const title = state.event?.name || t("event.create");
  const content = state.eventWizardStep === 1 ? eventStepOne() : state.eventWizardStep === 2 ? eventStepTwo() : eventStepThree();
  return shell(`<main class="page event-wizard"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(t("event.wizardIntro"))}</p></div><span class="save-state">✓ ${escapeHtml(t("event.savedContinuously"))}</span></section>${wizardHeader()}${content}</main>`, title);
}

const baseMeta = {
  guards: { title: "base.guards", intro: "base.guardsIntro", empty: "base.emptyGuards", add: "base.newGuard", edit: "base.editGuard", save: "base.saveGuard", icon: "badge" },
  posts: { title: "base.posts", intro: "base.postsIntro", empty: "base.emptyPosts", add: "base.newPost", edit: "base.editPost", save: "base.savePost", icon: "pin" },
  contacts: { title: "base.contacts", intro: "base.contactsIntro", empty: "base.emptyContacts", add: "base.newContact", edit: "base.editContact", save: "base.saveContact", icon: "phone" },
};

function baseTitle(entity, item) {
  if (entity === "guards") return item.name;
  if (entity === "posts") return `${item.code} · ${item.shortName}`;
  return item.category;
}

function baseDetails(entity, item) {
  if (entity === "guards") return [item.phone, item.email, item.availability, item.restrictions, item.preferences];
  if (entity === "posts") return [item.notes];
  return [item.name, item.phone, item.notes];
}

function baseRows(entity) {
  const items = state.base[entity];
  if (!items.length) return `<p class="base-empty">${escapeHtml(t(baseMeta[entity].empty))}</p>`;
  return `<div class="base-list">${items.map((item) => `<article class="base-row ${item.active ? "" : "is-inactive"}"><div><strong>${escapeHtml(baseTitle(entity, item))}</strong><small>${escapeHtml(baseDetails(entity, item).filter(Boolean).join(" · ") || t("base.noDetails"))}</small></div><span class="state-chip ${item.active ? "is-active" : ""}">${escapeHtml(t(item.active ? "common.active" : "common.inactive"))}</span><div class="row-actions"><button class="button button--secondary base-edit" data-entity="${entity}" data-id="${item.id}">${escapeHtml(t("common.edit"))}</button><button class="button button--secondary base-toggle" data-entity="${entity}" data-id="${item.id}" data-active="${item.active}">${escapeHtml(t(item.active ? "base.deactivate" : "base.activate"))}</button></div></article>`).join("")}</div>`;
}

function baseForm(entity, item = null) {
  const editing = Boolean(item);
  const value = (key) => escapeHtml(item?.[key] || "");
  const fields = entity === "guards"
    ? `<label>${escapeHtml(t("users.name"))}<input name="name" value="${value("name")}" required maxlength="120"></label><label>${escapeHtml(t("base.phone"))}<input name="phone" type="tel" value="${value("phone")}" autocomplete="tel"></label><label>${escapeHtml(t("base.emailOptional"))}<input name="email" type="email" value="${value("email")}" autocomplete="email"></label><label>${escapeHtml(t("base.availability"))}<input name="availability" value="${value("availability")}"></label><label class="wide">${escapeHtml(t("base.restrictions"))}<textarea name="restrictions">${value("restrictions")}</textarea></label><label class="wide">${escapeHtml(t("base.preferences"))}<textarea name="preferences">${value("preferences")}</textarea></label><label class="wide">${escapeHtml(t("base.notes"))}<textarea name="notes">${value("notes")}</textarea></label>`
    : entity === "posts"
      ? `<label>${escapeHtml(t("base.postCode"))}<input name="code" value="${value("code")}" required maxlength="12" placeholder="3B"><small>${escapeHtml(t("base.postCodeHint"))}</small></label><label>${escapeHtml(t("base.shortName"))}<input name="shortName" value="${value("shortName")}" required maxlength="120"></label><label class="wide">${escapeHtml(t("base.notes"))}<textarea name="notes">${value("notes")}</textarea></label>`
      : `<label>${escapeHtml(t("base.category"))}<input name="category" value="${value("category")}" required maxlength="80" placeholder="${escapeHtml(t("base.categoryHint"))}"></label><label>${escapeHtml(t("base.contactNameOptional"))}<input name="name" value="${value("name")}" maxlength="120"></label><label>${escapeHtml(t("base.phone"))}<input name="phone" type="tel" value="${value("phone")}" autocomplete="tel" required></label><label class="wide">${escapeHtml(t("base.notes"))}<textarea name="notes">${value("notes")}</textarea></label>`;
  return `<form class="compact-form base-record-form" data-entity="${entity}" data-mode="${editing ? "edit" : "create"}" ${editing ? `data-id="${item.id}"` : ""}>${fields}<p class="form-error wide" hidden></p><div class="form-actions wide"><button type="button" class="button button--secondary base-form-cancel">${escapeHtml(t("common.cancel"))}</button><button class="button button--primary" type="submit">${escapeHtml(t(editing ? baseMeta[entity].save : baseMeta[entity].add))}</button></div></form>`;
}

function baseOverviewView() {
  const type = eventTypeLabel(state.user.selectedEventType).toLocaleLowerCase(getLocale());
  const cards = Object.entries(baseMeta).map(([entity, meta]) => `<a class="setup-card-link" href="/orden/${entity === "guards" ? "ordensvakter" : entity === "posts" ? "ordensposter" : "kontaktpersoner"}" data-link><span class="action-icon">${icons[meta.icon]}</span><div><h2>${escapeHtml(t(meta.title))}</h2><p>${escapeHtml(t(meta.intro))}</p></div><strong>${escapeHtml(t("base.registered", { count: state.base[entity].length }))} →</strong></a>`).join("");
  return shell(`<main class="page"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(t("base.title"))}</h1><p>${escapeHtml(t("base.overviewIntro", { type }))}</p></div></section><div class="setup-grid">${cards}<a class="setup-card-link" href="/orden/grunninnstillinger" data-link><span class="action-icon">${icons.clock}</span><div><h2>${escapeHtml(t("base.defaults"))}</h2><p>${escapeHtml(t("base.defaultsIntro"))}</p></div><strong>${escapeHtml(t("base.openSection"))} →</strong></a></div></main>`, t("base.title"));
}

function baseEntityView(entity) {
  const meta = baseMeta[entity];
  const items = state.base[entity];
  const activeCount = items.filter((item) => item.active).length;
  return shell(`<main class="page"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(t(meta.title))}</h1><p>${escapeHtml(t(meta.intro))}</p></div><button id="show-base-create" class="button button--primary">+ ${escapeHtml(t(meta.add))}</button></section><p class="scope-note">${escapeHtml(t("base.separateDataNotice"))}</p><section id="base-create-panel" class="content-card form-panel" hidden><div class="section-heading"><h2>${escapeHtml(t(meta.add))}</h2><button class="icon-button base-form-cancel" aria-label="${escapeHtml(t("common.close"))}">${icons.close}</button></div>${baseForm(entity)}</section><section id="base-edit-panel" class="content-card form-panel" hidden></section><section class="content-card"><div class="section-heading"><div><h2>${escapeHtml(t("base.listTitle"))}</h2><p>${escapeHtml(t("base.activeSummary", { active: activeCount, total: items.length }))}</p></div></div>${baseRows(entity)}</section></main>`, t(meta.title));
}

function baseDefaultsView() {
  const settings = state.base.settings || { shiftCount: 3, dayStart: "08:00", dayEnd: "17:00" };
  return shell(`<main class="page"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(t("base.defaults"))}</h1><p>${escapeHtml(t("base.defaultsIntro"))}</p></div></section><p class="scope-note">${escapeHtml(t("base.separateDataNotice"))}</p><section class="content-card defaults-card"><div class="section-heading"><div><h2>${escapeHtml(t("base.defaults"))}</h2><p>${escapeHtml(t("base.defaultsBody"))}</p></div></div><form id="base-settings-form" class="compact-form"><label>${escapeHtml(t("base.defaultShiftCount"))}<input name="shiftCount" type="number" min="1" max="12" value="${settings.shiftCount}" required></label><label>${escapeHtml(t("base.defaultDayStart"))}<input name="dayStart" type="time" value="${settings.dayStart}" required></label><label>${escapeHtml(t("base.defaultDayEnd"))}<input name="dayEnd" type="time" value="${settings.dayEnd}" required></label><p class="form-error wide" hidden></p><div class="form-actions wide"><button class="button button--primary" type="submit">${escapeHtml(t("common.save"))}</button></div></form></section></main>`, t("base.defaults"));
}

function render() {
  const current = route();
  if (current === "setup-password") app.innerHTML = setupPasswordView();
  else if (!state.user) app.innerHTML = loginView();
  else if (current === "users" && state.user.role === "system_admin") app.innerHTML = usersView();
  else if (current === "settings") app.innerHTML = settingsView();
  else if (current === "events") app.innerHTML = eventsView();
  else if (current === "event-wizard") app.innerHTML = eventWizardView();
  else if (current === "base") app.innerHTML = baseOverviewView();
  else if (current === "base-guards") app.innerHTML = baseEntityView("guards");
  else if (current === "base-posts") app.innerHTML = baseEntityView("posts");
  else if (current === "base-contacts") app.innerHTML = baseEntityView("contacts");
  else if (current === "base-defaults") app.innerHTML = baseDefaultsView();
  else app.innerHTML = homeView();
  bindEvents();
}

function formPayload(form, includeActive = false) {
  const data = new FormData(form);
  const payload = { name: data.get("name"), email: data.get("email"), password: data.get("password"), role: data.get("role"), eventTypes: data.getAll("eventTypes") };
  if (!payload.password) delete payload.password;
  if (includeActive) payload.active = data.get("active") === "on";
  return payload;
}

function showFormError(form, error) {
  const element = form.querySelector(".form-error");
  element.textContent = errorText(error);
  element.hidden = false;
}

function setFormBusy(form, busy) {
  for (const element of form.elements) element.disabled = busy;
  form.classList.toggle("is-busy", busy);
}

async function changeLocale(locale, persist) {
  const previous = getLocale();
  await setLocale(locale);
  setApiLocale(getLocale());
  if (!persist) return render();
  try {
    const result = await endpoints.updatePreferences(getLocale());
    state.user.locale = result.locale;
    render();
    toast(t("settings.languageSaved", { language: getLocales().find(({ code }) => code === result.locale)?.name || result.locale }));
  } catch (error) {
    await setLocale(previous); setApiLocale(previous); render(); toast(errorText(error), "error");
  }
}

function bindBaseRecordForm(form) {
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentForm = event.currentTarget;
    const data = Object.fromEntries(new FormData(currentForm));
    setFormBusy(currentForm, true);
    try {
      if (currentForm.dataset.mode === "edit") await endpoints.updateBaseItem(currentForm.dataset.entity, currentForm.dataset.id, data);
      else await endpoints.createBaseItem(currentForm.dataset.entity, data);
      await loadBaseData();
      toast(t(currentForm.dataset.mode === "edit" ? "base.updated" : "base.created"));
    } catch (error) {
      showFormError(currentForm, error);
      setFormBusy(currentForm, false);
    }
  });
}

function buildClientShifts(dayStart, dayEnd, count) {
  const toMinutes = (value) => { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; };
  const fromMinutes = (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  const start = toMinutes(dayStart); const end = toMinutes(dayEnd);
  if (!Number.isInteger(count) || count < 1 || count > 12 || !Number.isFinite(start) || !Number.isFinite(end) || end - start < count) return null;
  const boundaries = Array.from({ length: count + 1 }, (_, index) => fromMinutes(Math.round(start + ((end - start) * index) / count)));
  return Array.from({ length: count }, (_, index) => ({ position: index + 1, startTime: boundaries[index], endTime: boundaries[index + 1] }));
}

function regenerateEventDay(dayIndex, dayStart, dayEnd, count) {
  const shifts = buildClientShifts(dayStart, dayEnd, count);
  if (!shifts) return false;
  state.event.days[dayIndex] = { ...state.event.days[dayIndex], dayStart, dayEnd, shiftCount: count, shifts };
  render();
  return true;
}

function showScheduleError() {
  const element = document.querySelector("#schedule-error");
  if (!element) return;
  element.textContent = t("errors.invalid_shift_schedule");
  element.hidden = false;
}

function bindEventWizard() {
  const venueSelect = document.querySelector("#event-venue-select");
  const venueFields = document.querySelector("#new-venue-fields");
  const syncVenueFields = () => {
    if (!venueSelect || !venueFields) return;
    const isNew = venueSelect.value === "__new__";
    venueFields.hidden = !isNew;
    for (const name of ["venueName", "address", "city"]) venueFields.querySelector(`[name="${name}"]`)?.toggleAttribute("required", isNew);
  };
  venueSelect?.addEventListener("change", syncVenueFields);
  syncVenueFields();

  document.querySelector("#event-details-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = { startDate: data.get("startDate") };
    if (data.get("venueId") === "__new__") payload.newVenue = { name: data.get("venueName"), address: data.get("address"), postalCode: data.get("postalCode"), city: data.get("city"), country: data.get("country"), notes: data.get("venueNotes") };
    else payload.venueId = data.get("venueId");
    setFormBusy(form, true);
    try {
      const result = state.event ? await endpoints.updateEvent(state.event.id, payload) : await endpoints.createEvent(payload);
      state.event = result.event;
      state.eventWizardStep = 2;
      history.replaceState({}, "", `/orden/stevne?id=${encodeURIComponent(state.event.id)}`);
      render();
      toast(t("event.saved"));
    } catch (error) {
      showFormError(form, error);
      setFormBusy(form, false);
    }
  });

  document.querySelectorAll(".wizard-back").forEach((button) => button.addEventListener("click", () => { state.eventWizardStep = Number(button.dataset.step); render(); }));
  document.querySelectorAll(".schedule-day").forEach((dayElement) => {
    const dayIndex = Number(dayElement.dataset.dayIndex);
    const regenerate = () => {
      const start = dayElement.querySelector(".day-start").value;
      const end = dayElement.querySelector(".day-end").value;
      const count = Number(dayElement.querySelector(".day-shift-count").value);
      if (!regenerateEventDay(dayIndex, start, end, count)) showScheduleError();
    };
    dayElement.querySelectorAll(".day-start, .day-end, .day-shift-count").forEach((input) => input.addEventListener("change", regenerate));
    dayElement.querySelectorAll(".shift-row").forEach((shiftElement) => {
      const shiftIndex = Number(shiftElement.dataset.shiftIndex);
      shiftElement.querySelector(".shift-start")?.addEventListener("change", (inputEvent) => {
        const value = inputEvent.target.value;
        const day = state.event.days[dayIndex];
        day.shifts[shiftIndex].startTime = value;
        if (shiftIndex === 0) { day.dayStart = value; dayElement.querySelector(".day-start").value = value; }
        else { day.shifts[shiftIndex - 1].endTime = value; dayElement.querySelectorAll(".shift-end")[shiftIndex - 1].value = value; }
      });
      shiftElement.querySelector(".shift-end")?.addEventListener("change", (inputEvent) => {
        const value = inputEvent.target.value;
        const day = state.event.days[dayIndex];
        day.shifts[shiftIndex].endTime = value;
        if (shiftIndex === day.shifts.length - 1) { day.dayEnd = value; dayElement.querySelector(".day-end").value = value; }
        else { day.shifts[shiftIndex + 1].startTime = value; dayElement.querySelectorAll(".shift-start")[shiftIndex + 1].value = value; }
      });
    });
  });

  document.querySelector("#save-event-schedule")?.addEventListener("click", async (event) => {
    const button = event.currentTarget; button.disabled = true;
    try {
      const days = state.event.days.map((day) => ({ dayStart: day.dayStart, dayEnd: day.dayEnd, shifts: day.shifts.map(({ startTime, endTime }) => ({ startTime, endTime })) }));
      const result = await endpoints.updateEventSchedule(state.event.id, { days });
      state.event = result.event; state.eventWizardStep = 3; render(); toast(t("event.saved"));
    } catch (error) { button.disabled = false; const element = document.querySelector("#schedule-error"); element.textContent = errorText(error); element.hidden = false; }
  });

  document.querySelector("#complete-event-setup")?.addEventListener("click", async (event) => {
    const button = event.currentTarget; button.disabled = true;
    try { const result = await endpoints.completeEventSetup(state.event.id); state.event = result.event; state.eventWizardStep = 3; render(); toast(t("event.createdToast")); }
    catch (error) { button.disabled = false; toast(errorText(error), "error"); }
  });
}

function bindEvents() {
  document.querySelectorAll("[data-link]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); navigate(link.getAttribute("href")); }));
  document.querySelector("#public-locale-select")?.addEventListener("change", (event) => changeLocale(event.target.value, false));
  document.querySelector("#settings-locale-select")?.addEventListener("change", (event) => changeLocale(event.target.value, true));
  document.querySelector(".open-menu")?.addEventListener("click", () => { state.mobileMenu = true; document.querySelector(".app-shell")?.classList.add("menu-open"); });
  const closeMenu = () => { state.mobileMenu = false; document.querySelector(".app-shell")?.classList.remove("menu-open"); };
  document.querySelector(".close-menu")?.addEventListener("click", closeMenu);
  document.querySelector(".menu-backdrop")?.addEventListener("click", closeMenu);
  document.querySelector("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setFormBusy(form, true);
    try { const result = await endpoints.login(data.get("email"), data.get("password")); state.user = result.user; if (state.user.locale && state.user.locale !== getLocale()) { await setLocale(state.user.locale); setApiLocale(state.user.locale); } navigate("/orden"); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
  document.querySelector("#setup-password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const password = String(data.get("password") || ""); const confirmation = String(data.get("passwordConfirm") || "");
    const errorElement = form.querySelector(".form-error");
    if (password !== confirmation) { errorElement.textContent = t("accountSetup.passwordMismatch"); errorElement.hidden = false; return; }
    setFormBusy(form, true);
    try { const token = new URLSearchParams(location.search).get("token") || ""; await endpoints.completeSetup(token, password); state.setupComplete = true; history.replaceState({}, "", "/orden/opprett-passord"); render(); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
  document.querySelector("#logout-button")?.addEventListener("click", async () => { try { await endpoints.logout(); } catch (error) { if (error.status !== 401) toast(errorText(error), "error"); } setCsrfToken(""); state.user = null; history.replaceState({}, "", "/orden/login"); render(); });
  document.querySelector("#event-type-select")?.addEventListener("change", async (event) => { const previous = state.user.selectedEventType; const next = event.target.value; event.target.disabled = true; try { await endpoints.selectEventType(next); state.user.selectedEventType = next; state.event = null; if (isBaseRoute()) await loadBaseData(); else if (["events", "home", "event-wizard"].includes(route())) { if (route() === "event-wizard") history.replaceState({}, "", "/orden/stevner"); await loadEvents(); } else render(); toast(t("eventType.changed", { type: eventTypeLabel(next).toLocaleLowerCase(getLocale()) })); } catch (error) { state.user.selectedEventType = previous; render(); toast(errorText(error), "error"); } });
  const createPanel = document.querySelector("#create-user-panel");
  document.querySelector("#show-create-user")?.addEventListener("click", () => { createPanel.hidden = false; createPanel.scrollIntoView({ behavior: "smooth", block: "start" }); createPanel.querySelector("input")?.focus(); });
  const hideCreate = () => { if (createPanel) createPanel.hidden = true; };
  document.querySelector("#hide-create-user")?.addEventListener("click", hideCreate);
  document.querySelector("#cancel-create-user")?.addEventListener("click", hideCreate);
  document.querySelector("#create-user-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const payload = formPayload(form); setFormBusy(form, true); try { await endpoints.createUser(payload); await loadUsers(); toast(t("users.created")); } catch (error) { showFormError(form, error); setFormBusy(form, false); } });
  document.querySelectorAll(".edit-user").forEach((button) => button.addEventListener("click", () => { const user = state.users.find((item) => item.id === button.dataset.id); const panel = document.querySelector("#edit-user-panel"); panel.innerHTML = editUserPanel(user); panel.hidden = false; panel.scrollIntoView({ behavior: "smooth", block: "start" }); bindEditForm(panel); }));
  const baseCreatePanel = document.querySelector("#base-create-panel");
  document.querySelector("#show-base-create")?.addEventListener("click", () => { baseCreatePanel.hidden = false; baseCreatePanel.scrollIntoView({ behavior: "smooth", block: "start" }); baseCreatePanel.querySelector("input")?.focus(); });
  baseCreatePanel?.querySelectorAll(".base-form-cancel").forEach((button) => button.addEventListener("click", () => { baseCreatePanel.hidden = true; }));
  document.querySelectorAll(".base-record-form").forEach(bindBaseRecordForm);
  document.querySelectorAll(".base-edit").forEach((button) => button.addEventListener("click", () => {
    const item = state.base[button.dataset.entity].find((entry) => entry.id === button.dataset.id);
    const panel = document.querySelector("#base-edit-panel");
    if (!item || !panel) return;
    panel.innerHTML = `<div class="section-heading"><h2>${escapeHtml(t(baseMeta[button.dataset.entity].edit))}</h2><button class="icon-button base-form-cancel" aria-label="${escapeHtml(t("common.close"))}">${icons.close}</button></div>${baseForm(button.dataset.entity, item)}`;
    panel.hidden = false;
    panel.querySelectorAll(".base-form-cancel").forEach((control) => control.addEventListener("click", () => { panel.hidden = true; }));
    bindBaseRecordForm(panel.querySelector(".base-record-form"));
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    panel.querySelector("input")?.focus();
  }));
  document.querySelectorAll(".base-toggle").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; try { await endpoints.updateBaseItem(button.dataset.entity, button.dataset.id, { active: button.dataset.active !== "true" }); await loadBaseData(); toast(t("base.updated")); } catch (error) { button.disabled = false; toast(errorText(error), "error"); } }));
  document.querySelector("#base-settings-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); data.shiftCount = Number(data.shiftCount); setFormBusy(form, true); try { await endpoints.updateBaseSettings(data); await loadBaseData(); toast(t("base.saved")); } catch (error) { showFormError(form, error); setFormBusy(form, false); } });
  bindEventWizard();
}

function bindEditForm(panel) {
  const hide = () => { panel.hidden = true; panel.innerHTML = ""; };
  panel.querySelector("#hide-edit-user")?.addEventListener("click", hide);
  panel.querySelector("#cancel-edit-user")?.addEventListener("click", hide);
  panel.querySelector("#edit-user-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const payload = formPayload(form, true); setFormBusy(form, true); try { await endpoints.updateUser(form.dataset.id, payload); await loadUsers(); toast(t("common.saved")); } catch (error) { showFormError(form, error); setFormBusy(form, false); } });
}

async function loadUsers() {
  const result = await endpoints.users(); state.users = result.users; render();
}

async function loadBaseData() {
  const [guards, posts, contacts, settings] = await Promise.all([endpoints.baseItems("guards"), endpoints.baseItems("posts"), endpoints.baseItems("contacts"), endpoints.baseSettings()]);
  state.base = { guards: guards.items, posts: posts.items, contacts: contacts.items, settings: settings.settings };
  render();
}

async function loadEvents() {
  const result = await endpoints.events();
  state.events = result.events;
  render();
}

async function loadEventWorkspace() {
  const id = new URLSearchParams(location.search).get("id");
  const venuesPromise = endpoints.venues();
  const eventPromise = id ? endpoints.event(id) : Promise.resolve({ event: null });
  const [venues, eventResult] = await Promise.all([venuesPromise, eventPromise]);
  state.venues = venues.venues;
  state.event = eventResult.event;
  state.eventWizardStep = state.event ? (state.event.status === "draft" ? Math.max(1, state.event.wizardStep) : 3) : 1;
  render();
}

async function init() {
  await initI18n();
  setApiLocale(getLocale());
  const bootMessage = document.querySelector("#boot-message");
  if (bootMessage) bootMessage.textContent = t("app.loading");
  try {
    const result = await endpoints.me(); state.user = result.user;
    if (state.user.locale && state.user.locale !== getLocale()) { await setLocale(state.user.locale); setApiLocale(state.user.locale); }
    if (route() === "users" && state.user.role === "system_admin") await loadUsers();
    else if (isBaseRoute()) await loadBaseData();
    else if (route() === "event-wizard") await loadEventWorkspace();
    else if (["home", "events"].includes(route())) await loadEvents();
    else render();
  } catch (error) {
    if (!(error instanceof ApiError) || ![401, 403].includes(error.status)) console.warn(error);
    try { const status = await endpoints.setupStatus(); state.configured = status.configured; } catch { state.configured = true; }
    state.user = null; if (!["login", "setup-password"].includes(route())) history.replaceState({}, "", "/orden/login"); render();
  }
}

window.addEventListener("popstate", () => { if (!state.user) return render(); if (route() === "users" && !state.users.length) loadUsers().catch((error) => toast(errorText(error), "error")); else if (isBaseRoute()) loadBaseData().catch((error) => toast(errorText(error), "error")); else if (route() === "event-wizard") loadEventWorkspace().catch((error) => toast(errorText(error), "error")); else if (["home", "events"].includes(route())) loadEvents().catch((error) => toast(errorText(error), "error")); else render(); });
init().catch((error) => { console.error(error); });
