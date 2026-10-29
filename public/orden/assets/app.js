import { ApiError, endpoints, setApiLocale, setCsrfToken } from "./api.js";
import { formatDate, getLocale, getLocales, initI18n, setLocale, t } from "./i18n.js";

const app = document.querySelector("#app");
const state = { user: null, users: [], base: { guards: [], posts: [], contacts: [], settings: null }, events: [], venues: [], event: null, eventWizardStep: 1, planning: null, planningDay: 0, planningSlot: null, planningSearch: "", planningGuardMenu: null, dashboard: null, dashboardMode: "planning", attendanceOpen: false, alarmOpen: false, checkInCodes: [], checkInCodesOpen: false, publicCheckIn: null, publicCheckInError: "", publicCheckInResult: null, countingDraft: [{ name: "", guardId: "" }], publicCounting: null, publicCountingError: "", configured: true, mobileMenu: false, setupComplete: false };
let dashboardClockTimer = null;
let countingRefreshTimer = null;

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
  scan: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`,
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
  if (path === "/orden/innsjekking") return "public-checkin";
  if (path === "/orden/opptelling") return "public-counting";
  if (path === "/orden/brukere" || path === "/orden/brugere") return "users";
  if (path === "/orden/innstillinger") return "settings";
  if (path === "/orden/grunnoppsett") return "base";
  if (path === "/orden/ordensvakter") return "base-guards";
  if (path === "/orden/ordensposter") return "base-posts";
  if (path === "/orden/kontaktpersoner") return "base-contacts";
  if (path === "/orden/grunninnstillinger") return "base-defaults";
  if (path === "/orden/stevner") return "events";
  if (path === "/orden/stevne") return "event-wizard";
  if (path === "/orden/vaktplan") return "planning";
  if (path === "/orden/dashboard") return "dashboard";
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
  } else if (path.startsWith("/orden/vaktplan")) {
    loadPlanning().catch((error) => { toast(errorText(error), "error"); render(); });
  } else if (path.startsWith("/orden/dashboard")) {
    loadDashboard().catch((error) => { toast(errorText(error), "error"); render(); });
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

function publicCheckInView() {
  const languageSelect = `<label class="public-language"><span>${escapeHtml(t("common.language"))}</span><select id="public-locale-select">${localeOptions()}</select></label>`;
  if (state.publicCheckInError) return `<main class="checkin-public"><section class="checkin-public-card">${brand()}${languageSelect}<div class="checkin-public-state is-error"><span>!</span><h1>${escapeHtml(t("checkin.unavailableTitle"))}</h1><p>${escapeHtml(errorText({ code: state.publicCheckInError }))}</p></div></section></main>`;
  if (!state.publicCheckIn) return `<main class="boot-screen"><div class="brand-mark">OV</div><p>${escapeHtml(t("app.loading"))}</p></main>`;
  const portal = state.publicCheckIn;
  if (state.publicCheckInResult) {
    const checkedIn = state.publicCheckInResult.action === "checkin";
    return `<main class="checkin-public"><section class="checkin-public-card">${brand()}${languageSelect}<div class="checkin-event"><span class="eyebrow">${escapeHtml(portal.venueName)}</span><h1>${escapeHtml(portal.eventName)}</h1></div><div class="checkin-public-state is-success"><span>✓</span><h2>${escapeHtml(t(checkedIn ? "checkin.successInTitle" : "checkin.successOutTitle"))}</h2><p>${escapeHtml(t(checkedIn ? "checkin.successInBody" : "checkin.successOutBody", { name: state.publicCheckInResult.guardName }))}</p><button id="checkin-again" class="button button--secondary button--large">${escapeHtml(t("checkin.another"))}</button></div></section></main>`;
  }
  return `<main class="checkin-public"><section class="checkin-public-card">${brand()}${languageSelect}<div class="checkin-event"><span class="eyebrow">${escapeHtml(portal.venueName)} · ${escapeHtml(dateLabel(portal.startDate, portal.endDate))}</span><h1>${escapeHtml(portal.eventName)}</h1><p>${escapeHtml(t("checkin.publicIntro"))}</p></div><form id="public-checkin-form" class="form-stack"><label>${escapeHtml(t("checkin.personalCode"))}<input name="code" class="checkin-code-input" inputmode="text" autocomplete="one-time-code" minlength="8" maxlength="9" placeholder="XXXX-XXXX" required autofocus></label><p class="form-error" hidden></p><div class="checkin-public-actions"><button class="button button--primary button--large" type="submit" name="action" value="checkin">${escapeHtml(t("terms.checkIn"))}</button><button class="button button--secondary button--large" type="submit" name="action" value="checkout">${escapeHtml(t("terms.checkOut"))}</button></div></form><p class="privacy-note">${escapeHtml(t("checkin.privacy"))}</p></section></main>`;
}

function publicCountingView() {
  const languageSelect = `<label class="public-language"><span>${escapeHtml(t("common.language"))}</span><select id="public-locale-select">${localeOptions()}</select></label>`;
  if (state.publicCountingError) return `<main class="checkin-public"><section class="checkin-public-card">${brand()}${languageSelect}<div class="checkin-public-state is-error"><span>!</span><h1>${escapeHtml(t("counting.unavailable"))}</h1><p>${escapeHtml(errorText({ code: state.publicCountingError }))}</p></div></section></main>`;
  if (!state.publicCounting) return `<main class="boot-screen"><div class="brand-mark">OV</div><p>${escapeHtml(t("app.loading"))}</p></main>`;
  const item = state.publicCounting;
  const status = item.status;
  return `<main class="checkin-public"><section class="checkin-public-card">${brand()}${languageSelect}<div class="checkin-event"><span class="eyebrow">${escapeHtml(item.venueName)} · ${escapeHtml(formatDate(`${item.date}T12:00:00Z`))} ${escapeHtml(item.scheduledTime)}</span><h1>${escapeHtml(item.roundName)}</h1><p>${escapeHtml(item.eventName)}</p></div><div class="counting-section-heading"><span>${escapeHtml(t("counting.section"))}</span><h2>${escapeHtml(item.sectionName)}</h2><p>${escapeHtml(t("counting.responsible", { name: item.guardName }))}</p><span class="counting-status is-${escapeHtml(status)}">${escapeHtml(t(`status.${status === "in_progress" ? "inProgress" : status}`))}</span></div>${status === "awaiting" ? `<button id="start-counting" class="button button--primary button--large counting-main-action">${escapeHtml(t("counting.start"))}</button>` : `<form id="public-counting-form" class="form-stack"><label>${escapeHtml(t("counting.participants"))}<input name="count" class="counting-number" type="number" min="0" max="100000" step="1" value="${item.attendeeCount ?? ""}" required autofocus></label><p class="form-error" hidden></p><button class="button button--primary button--large" type="submit">${escapeHtml(t(status === "completed" ? "counting.correct" : "counting.confirm"))}</button></form>`}</section></main>`;
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
  const currentNav = ["/orden/stevne", "/orden/vaktplan", "/orden/dashboard"].includes(current) ? "/orden/stevner" : current;
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

function eventHref(event) {
  return event.status === "draft" ? `/orden/stevne?id=${encodeURIComponent(event.id)}` : `/orden/dashboard?id=${encodeURIComponent(event.id)}`;
}

function homeView() {
  const type = eventTypeLabel(state.user.selectedEventType).toLocaleLowerCase(getLocale());
  const upcoming = state.events.find((event) => event.endDate >= todayString() && !["completed", "cancelled"].includes(event.status));
  const upcomingCard = upcoming
    ? `<a class="action-card action-card-link" href="${eventHref(upcoming)}" data-link><div class="action-icon">${icons.shield}</div><div><span class="eyebrow">${escapeHtml(t("home.nextEvent"))}</span><h2>${escapeHtml(upcoming.name)}</h2><p>${escapeHtml(dateLabel(upcoming.startDate, upcoming.endDate))} · ${escapeHtml(upcoming.venue.name)}, ${escapeHtml(upcoming.venue.city)}</p></div><span class="empty-chip">${escapeHtml(eventStatusLabel(upcoming.status))}</span></a>`
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
  return `<a class="event-row" href="${eventHref(event)}" data-link><span class="event-date-badge"><strong>${escapeHtml(new Intl.DateTimeFormat(getLocale(), { day: "2-digit" }).format(new Date(`${event.startDate}T12:00:00Z`)))}</strong><small>${escapeHtml(new Intl.DateTimeFormat(getLocale(), { month: "short" }).format(new Date(`${event.startDate}T12:00:00Z`)))}</small></span><div><strong>${escapeHtml(event.name)}</strong><small>${escapeHtml(dateLabel(event.startDate, event.endDate))} · ${escapeHtml(event.venue.name)}, ${escapeHtml(event.venue.city)}</small></div><span class="state-chip ${event.status === "planning" || event.status === "ready" ? "is-active" : ""}">${escapeHtml(eventStatusLabel(event.status))}</span><span class="event-arrow">→</span></a>`;
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
  return `<section class="content-card wizard-card"><div class="review-status ${completed ? "is-complete" : ""}"><span>${completed ? "✓" : "3"}</span><div><h2>${escapeHtml(t(completed ? "event.createdTitle" : "event.reviewTitle"))}</h2><p>${escapeHtml(t(completed ? "event.createdBody" : "event.reviewIntro"))}</p></div></div><div class="event-review"><div><span>${escapeHtml(t("event.generatedName"))}</span><strong>${escapeHtml(event.name)}</strong></div><div><span>${escapeHtml(t("event.date"))}</span><strong>${escapeHtml(dateLabel(event.startDate, event.endDate))}</strong></div><div><span>${escapeHtml(t("event.venue"))}</span><strong>${escapeHtml(event.venue.name)}</strong><small>${escapeHtml([event.venue.address, event.venue.postalCode, event.venue.city, event.venue.country].filter(Boolean).join(", "))}</small></div><div class="wide"><span>${escapeHtml(t("event.shifts"))}</span><ul>${daySummary}</ul></div></div><div class="wizard-actions"><button class="button button--secondary wizard-back" data-step="1">${escapeHtml(t("event.editDateVenue"))}</button><button class="button button--secondary wizard-back" data-step="2">${escapeHtml(t("event.editShifts"))}</button>${completed ? `<a class="button button--secondary button-link" href="/orden/vaktplan?id=${encodeURIComponent(event.id)}" data-link>${escapeHtml(t("planning.open"))}</a><a class="button button--primary button-link" href="/orden/dashboard?id=${encodeURIComponent(event.id)}" data-link>${escapeHtml(t("dashboard.open"))}</a>` : `<button id="complete-event-setup" class="button button--primary">${escapeHtml(t("event.completeSetup"))}</button>`}</div></section>`;
}

function eventWizardView() {
  const title = state.event?.name || t("event.create");
  const content = state.eventWizardStep === 1 ? eventStepOne() : state.eventWizardStep === 2 ? eventStepTwo() : eventStepThree();
  return shell(`<main class="page event-wizard"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(t("event.wizardIntro"))}</p></div><span class="save-state">✓ ${escapeHtml(t("event.savedContinuously"))}</span></section>${wizardHeader()}${content}</main>`, title);
}

function planningAssignment(shiftId, postId) {
  return state.planning?.assignments.find((item) => item.shiftId === shiftId && item.postId === postId) || null;
}

function planningEligibility(guard, day, shift, post) {
  if (!guard.active) return { eligible: false, reason: "planning.reasonInactive" };
  if (guard.disabledForEvent) return { eligible: false, reason: "planning.reasonEventDisabled" };
  const weekday = new Date(`${day.date}T12:00:00Z`).getUTCDay();
  if (guard.availableWeekdays.length && !guard.availableWeekdays.includes(weekday)) return { eligible: false, reason: "planning.reasonDay" };
  if ((guard.availableFrom && shift.startTime < guard.availableFrom) || (guard.availableTo && shift.endTime > guard.availableTo)) return { eligible: false, reason: "planning.reasonTime" };
  if (guard.allowedPostIds.length && (!post.sourcePostId || !guard.allowedPostIds.includes(post.sourcePostId))) return { eligible: false, reason: "planning.reasonPost" };
  const sameShiftElsewhere = state.planning.assignments.some((assignment) => assignment.guardId === guard.id && assignment.shiftId === shift.id && assignment.postId !== post.id);
  if (sameShiftElsewhere) return { eligible: false, reason: "planning.reasonAssigned" };
  return { eligible: true, reason: null };
}

function guardOptionList() {
  if (!state.planningSlot) return "";
  const day = state.planning.days[state.planningSlot.dayIndex];
  const shift = day.shifts.find((item) => item.id === state.planningSlot.shiftId);
  const post = state.planning.posts.find((item) => item.id === state.planningSlot.postId);
  const query = state.planningSearch.trim().toLocaleLowerCase(getLocale());
  const guards = state.planning.guards.filter((guard) => !query || [guard.name, guard.phone, guard.preferences, guard.restrictions].join(" ").toLocaleLowerCase(getLocale()).includes(query));
  if (!guards.length) return `<p class="base-empty">${escapeHtml(t("planning.noGuardsFound"))}</p>`;
  return guards.map((guard) => {
    const eligibility = planningEligibility(guard, day, shift, post);
    const selected = planningAssignment(shift.id, post.id)?.guardId === guard.id;
    const details = [guard.preferences && `${t("base.preferences")}: ${guard.preferences}`, guard.restrictions && `${t("base.restrictions")}: ${guard.restrictions}`, guard.availability].filter(Boolean).join(" · ");
    return `<article class="guard-option ${eligibility.eligible ? "" : "is-unavailable"} ${selected ? "is-selected" : ""}"><button class="guard-select" data-guard-id="${guard.id}" ${eligibility.eligible ? "" : "disabled"}><span class="guard-avatar">${escapeHtml(guard.name.slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(guard.name)}</strong><small>${escapeHtml(eligibility.eligible ? (details || guard.phone || t("planning.available")) : t(eligibility.reason))}</small></span>${selected ? `<span class="selected-check">✓</span>` : ""}</button><button class="guard-disable-menu" data-guard-id="${guard.id}" aria-label="${escapeHtml(t("planning.disableGuard"))}" title="${escapeHtml(t("planning.disableGuard"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.7 10.7 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.1 3.2M6.6 6.6C3.5 8.6 2 12 2 12s3 8 10 8a10.7 10.7 0 0 0 5.4-1.4"/></svg></button></article>`;
  }).join("");
}

function guardDisablePanel() {
  if (!state.planningGuardMenu) return "";
  const guard = state.planning.guards.find((item) => item.id === state.planningGuardMenu);
  if (!guard) return "";
  if (guard.disabledForEvent) return `<section class="disable-panel"><strong>${escapeHtml(guard.name)}</strong><p>${escapeHtml(t("planning.disabledForEvent"))}</p><div><button class="button button--secondary cancel-disable">${escapeHtml(t("common.cancel"))}</button><button class="button button--primary enable-event-guard" data-guard-id="${guard.id}">${escapeHtml(t("planning.enableForEvent"))}</button></div></section>`;
  return `<section class="disable-panel"><strong>${escapeHtml(t("planning.disableTitle", { name: guard.name }))}</strong><p>${escapeHtml(t("planning.disableIntro"))}</p><div><button class="button button--secondary cancel-disable">${escapeHtml(t("common.cancel"))}</button><button class="button button--secondary disable-guard" data-guard-id="${guard.id}" data-scope="event">${escapeHtml(t("planning.disableEvent"))}</button><button class="button button--danger disable-guard" data-guard-id="${guard.id}" data-scope="indefinite">${escapeHtml(t("planning.disableIndefinite"))}</button></div></section>`;
}

function planningModal() {
  if (!state.planningSlot) return "";
  const day = state.planning.days[state.planningSlot.dayIndex];
  const shift = day.shifts.find((item) => item.id === state.planningSlot.shiftId);
  const post = state.planning.posts.find((item) => item.id === state.planningSlot.postId);
  const assignment = planningAssignment(shift.id, post.id);
  return `<div class="modal-backdrop" id="planning-modal-backdrop"><section class="planning-modal" role="dialog" aria-modal="true" aria-labelledby="planning-modal-title"><header><div><span class="eyebrow">${escapeHtml(post.code)} · ${escapeHtml(shift.startTime)}–${escapeHtml(shift.endTime)}</span><h2 id="planning-modal-title">${escapeHtml(t("planning.chooseGuard"))}</h2></div><button class="icon-button close-planning-modal" aria-label="${escapeHtml(t("common.close"))}">${icons.close}</button></header>${guardDisablePanel()}<label class="guard-search"><span>${escapeHtml(t("common.search"))}</span><input id="planning-guard-search" type="search" value="${escapeHtml(state.planningSearch)}" placeholder="${escapeHtml(t("planning.searchPlaceholder"))}" autofocus></label><div id="guard-options" class="guard-options">${guardOptionList()}</div><footer><a href="/orden/ordensvakter" data-link>${escapeHtml(t("planning.manageGuards"))}</a>${assignment ? `<button id="remove-planning-assignment" class="button button--secondary">${escapeHtml(t("planning.removeAssignment"))}</button>` : ""}</footer></section></div>`;
}

function planningView() {
  const planning = state.planning;
  if (!planning) return shell(`<main class="page"><p>${escapeHtml(t("app.loading"))}</p></main>`, t("terms.dutyPlan"));
  const day = planning.days[Math.min(state.planningDay, Math.max(0, planning.days.length - 1))];
  const dayTabs = planning.days.length > 1 ? `<div class="planning-days" role="tablist">${planning.days.map((item, index) => `<button class="planning-day ${index === state.planningDay ? "is-active" : ""}" data-day-index="${index}"><span>${escapeHtml(t("event.dayNumber", { number: item.dayNumber }))}</span><strong>${escapeHtml(formatDate(`${item.date}T12:00:00Z`))}</strong></button>`).join("")}</div>` : "";
  const empty = !planning.posts.length ? `<section class="content-card planning-empty"><div class="action-icon">${icons.pin}</div><h2>${escapeHtml(t("planning.noPostsTitle"))}</h2><p>${escapeHtml(t("planning.noPostsBody"))}</p><a class="button button--primary button-link" href="/orden/ordensposter" data-link>${escapeHtml(t("planning.managePosts"))}</a></section>` : "";
  const table = planning.posts.length ? `<div class="planning-table-wrap"><table class="planning-table"><thead><tr><th><span>${escapeHtml(t("planning.post"))}</span></th>${day.shifts.map((shift, index) => `<th><strong>${escapeHtml(t("event.shiftNumber", { number: index + 1 }))}</strong><small>${escapeHtml(shift.startTime)}–${escapeHtml(shift.endTime)}</small></th>`).join("")}</tr></thead><tbody>${planning.posts.map((post) => `<tr><th><strong>${escapeHtml(post.code)}</strong><span>${escapeHtml(post.shortName)}</span>${post.notes ? `<small>${escapeHtml(post.notes)}</small>` : ""}</th>${day.shifts.map((shift) => { const assignment = planningAssignment(shift.id, post.id); return `<td><button class="planning-cell ${assignment ? "is-filled" : ""}" data-day-index="${state.planningDay}" data-shift-id="${shift.id}" data-post-id="${post.id}">${assignment ? `<span class="guard-avatar">${escapeHtml(assignment.guardName.slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(assignment.guardName)}</strong><small>${escapeHtml(t("planning.changeGuard"))}</small></span>` : `<span class="cell-plus">+</span><span>${escapeHtml(t("planning.choosePerson"))}</span>`}</button></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>` : "";
  return shell(`<main class="page planning-page"><section class="page-heading planning-heading"><div><span class="eyebrow">${escapeHtml(dateLabel(planning.event.startDate, planning.event.endDate))} · ${escapeHtml(planning.event.venue.name)}</span><h1>${escapeHtml(planning.event.name)}</h1><p>${escapeHtml(t("planning.intro"))}</p></div><div class="planning-summary"><span>${escapeHtml(t("planning.unfilled"))}</span><strong>${planning.missingCount}</strong><small>${escapeHtml(t("planning.ofSlots", { total: planning.totalSlots }))}</small></div></section><div class="planning-toolbar"><span class="save-state">✓ ${escapeHtml(t("planning.autoSaved"))}</span><a class="button button--secondary button-link" href="/orden/stevne?id=${encodeURIComponent(planning.event.id)}" data-link>${escapeHtml(t("planning.editEvent"))}</a></div>${dayTabs}${empty}${table}${planningModal()}</main>`, t("terms.dutyPlan"));
}

function osloNow() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}`, clock: `${values.hour}:${values.minute}:${values.second}` };
}

function dashboardContext() {
  const dashboard = state.dashboard;
  const now = osloNow();
  const day = dashboard.days.find((item) => item.date === now.date) || dashboard.days[0];
  const currentShift = day?.date === now.date ? day.shifts.find((shift) => shift.startTime <= now.time && shift.endTime > now.time) || null : null;
  const allShifts = dashboard.days.flatMap((eventDay) => eventDay.shifts.map((shift) => ({ ...shift, day: eventDay })));
  const nextShift = allShifts.find((shift) => `${shift.day.date}T${shift.startTime}` > `${now.date}T${now.time}`) || null;
  const expectedIds = new Set(dashboard.assignments.map((assignment) => assignment.guardId));
  const checkedInIds = new Set(dashboard.attendance.filter((entry) => !entry.checkedOutAt).map((entry) => entry.guardId));
  const currentAssignedIds = new Set(currentShift ? dashboard.assignments.filter((assignment) => assignment.shiftId === currentShift.id).map((assignment) => assignment.guardId) : []);
  const missingIds = [...expectedIds].filter((id) => !checkedInIds.has(id));
  const reserveIds = [...checkedInIds].filter((id) => !currentAssignedIds.has(id));
  const unstaffed = currentShift
    ? dashboard.posts.filter((post) => !dashboard.assignments.some((assignment) => assignment.shiftId === currentShift.id && assignment.postId === post.id))
    : dashboard.posts.filter((post) => day?.shifts.some((shift) => !dashboard.assignments.some((assignment) => assignment.shiftId === shift.id && assignment.postId === post.id)));
  return { now, day, currentShift, nextShift, expectedIds, checkedInIds, currentAssignedIds, missingIds, reserveIds, unstaffed };
}

function nextShiftText(context) {
  if (!context.nextShift) return t("dashboard.noMoreShifts");
  if (context.nextShift.day.date !== context.now.date) return `${formatDate(`${context.nextShift.day.date}T12:00:00Z`)} · ${context.nextShift.startTime}`;
  const [nowHour, nowMinute] = context.now.time.split(":").map(Number);
  const [shiftHour, shiftMinute] = context.nextShift.startTime.split(":").map(Number);
  const minutes = Math.max(0, shiftHour * 60 + shiftMinute - nowHour * 60 - nowMinute);
  if (minutes < 60) return t("dashboard.minutesUntil", { count: minutes });
  const hours = Math.floor(minutes / 60); const remainder = minutes % 60;
  return t("dashboard.hoursUntil", { hours, minutes: remainder });
}

function dashboardMetric(icon, label, value, detail, tone = "") {
  return `<article class="dashboard-metric ${tone ? `is-${tone}` : ""}"><span class="metric-icon">${icon}</span><div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></div></article>`;
}

function attendanceModal() {
  if (!state.attendanceOpen) return "";
  const context = dashboardContext();
  const expected = context.expectedIds;
  const guards = [...state.dashboard.guards].sort((a, b) => Number(expected.has(b.id)) - Number(expected.has(a.id)) || a.name.localeCompare(b.name, getLocale()));
  const rows = guards.map((guard) => {
    const checkedIn = context.checkedInIds.has(guard.id);
    const session = state.dashboard.attendance.filter((entry) => entry.guardId === guard.id).at(-1);
    const detail = session ? ` · ${t(checkedIn ? "dashboard.arrivedAt" : "dashboard.leftAt", { time: new Intl.DateTimeFormat(getLocale(), { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Oslo" }).format(new Date(checkedIn ? session.checkedInAt : session.checkedOutAt)) })}` : "";
    return `<article class="attendance-row"><span class="guard-avatar">${escapeHtml(guard.name.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(guard.name)}</strong><small>${escapeHtml(expected.has(guard.id) ? t("dashboard.expected") : t("dashboard.notScheduled"))}${escapeHtml(detail)}</small></div><span class="attendance-state ${checkedIn ? "is-in" : ""}">${escapeHtml(t(checkedIn ? "dashboard.present" : "dashboard.notPresent"))}</span><button class="button ${checkedIn ? "button--secondary" : "button--primary"} attendance-action" data-guard-id="${guard.id}" data-action="${checkedIn ? "checkout" : "checkin"}">${escapeHtml(t(checkedIn ? "terms.checkOut" : "terms.checkIn"))}</button></article>`;
  }).join("");
  const dateTime = new Intl.DateTimeFormat(getLocale(), { dateStyle: "medium", timeStyle: "short", hourCycle: "h23", timeZone: "Europe/Oslo" });
  const history = [...state.dashboard.attendance].reverse().map((entry) => {
    const guard = state.dashboard.guards.find((item) => item.id === entry.guardId);
    const source = t(`checkin.source.${entry.checkInSource}`);
    const out = entry.checkedOutAt ? t("checkin.historyOut", { time: dateTime.format(new Date(entry.checkedOutAt)) }) : t("checkin.stillPresent");
    return `<article><div><strong>${escapeHtml(guard?.name || t("terms.orderGuard"))}</strong><small>${escapeHtml(t("checkin.historyIn", { time: dateTime.format(new Date(entry.checkedInAt)) }))} · ${escapeHtml(out)}</small></div><span>${escapeHtml(source)}</span></article>`;
  }).join("");
  return `<div class="modal-backdrop" id="attendance-backdrop"><section class="planning-modal attendance-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-title"><header><div><span class="eyebrow">${escapeHtml(t("dashboard.manualRegistration"))}</span><h2 id="attendance-title">${escapeHtml(t("dashboard.attendance"))}</h2></div><button class="icon-button close-attendance" aria-label="${escapeHtml(t("common.close"))}">${icons.close}</button></header><div class="attendance-list">${rows}</div><section class="attendance-history"><h3>${escapeHtml(t("checkin.history"))}</h3>${history || `<p>${escapeHtml(t("checkin.noHistory"))}</p>`}</section></section></div>`;
}

function checkInDashboardCard() {
  const settings = state.dashboard.checkIn || { configured: false };
  if (!settings.configured) return `<article class="content-card checkin-admin-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("checkin.qrNfc"))}</span><h2>${escapeHtml(t("checkin.prepareTitle"))}</h2><p>${escapeHtml(t("checkin.prepareBody"))}</p></div><span class="action-icon">${icons.scan}</span></div><button id="configure-checkin" class="button button--primary">${escapeHtml(t("checkin.prepare"))}</button></article>`;
  return `<article class="content-card checkin-admin-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("checkin.qrNfc"))}</span><h2>${escapeHtml(t("checkin.adminTitle"))}</h2><p>${escapeHtml(t("checkin.activePeriod", { from: formatDate(`${settings.validFrom}T12:00:00Z`), until: formatDate(`${settings.validUntil}T12:00:00Z`) }))}</p></div><span class="state-chip ${settings.active ? "is-active" : ""}">${escapeHtml(t(settings.active ? "checkin.active" : "checkin.inactive"))}</span></div><div class="checkin-admin-content"><div class="checkin-qr" aria-label="${escapeHtml(t("checkin.qrCode"))}">${settings.qrSvg || ""}</div><div class="checkin-link-list"><div><span>${escapeHtml(t("checkin.qrLink"))}</span><code>${escapeHtml(settings.qrUrl)}</code><button class="icon-button copy-value" data-copy="${escapeHtml(settings.qrUrl)}" aria-label="${escapeHtml(t("checkin.copyLink"))}">${icons.copy}</button></div><div><span>${escapeHtml(t("checkin.nfcLink"))}</span><code>${escapeHtml(settings.nfcUrl)}</code><button class="icon-button copy-value" data-copy="${escapeHtml(settings.nfcUrl)}" aria-label="${escapeHtml(t("checkin.copyLink"))}">${icons.copy}</button></div><p>${escapeHtml(t("checkin.credentialsReady", { count: settings.credentialCount }))}</p></div></div><div class="dashboard-actions"><button id="toggle-checkin" class="button button--secondary" data-active="${settings.active}">${escapeHtml(t(settings.active ? "checkin.deactivate" : "checkin.activate"))}</button><button id="regenerate-checkin" class="button button--secondary">${escapeHtml(t("checkin.regenerate"))}</button></div></article>`;
}

function checkInCodesModal() {
  if (!state.checkInCodesOpen || !state.checkInCodes.length) return "";
  return `<div class="modal-backdrop" id="checkin-codes-backdrop"><section class="planning-modal checkin-codes-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-codes-title"><header><div><span class="eyebrow">${escapeHtml(t("checkin.personalCodes"))}</span><h2 id="checkin-codes-title">${escapeHtml(t("checkin.codesReadyTitle"))}</h2><p>${escapeHtml(t("checkin.codesReadyBody"))}</p></div><button class="icon-button close-checkin-codes" aria-label="${escapeHtml(t("common.close"))}">${icons.close}</button></header><div class="checkin-code-actions"><button id="copy-all-checkin-codes" class="button button--secondary">${icons.copy}${escapeHtml(t("checkin.copyAll"))}</button><button class="button button--secondary print-checkin-codes">${escapeHtml(t("checkin.print"))}</button></div><div class="checkin-code-list">${state.checkInCodes.map((item) => `<article><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.email || item.phone || t("checkin.noContact"))}</small></div><code>${escapeHtml(item.code)}</code><button class="icon-button copy-value" data-copy="${escapeHtml(item.code)}" aria-label="${escapeHtml(t("checkin.copyCode"))}">${icons.copy}</button></article>`).join("")}</div></section></div>`;
}

function countingDashboardCard() {
  const rounds = state.dashboard.countingRounds || [];
  const guardOptions = (selected) => `<option value="">${escapeHtml(t("counting.chooseGuard"))}</option>${state.dashboard.guards.filter((guard) => guard.active).map((guard) => `<option value="${guard.id}" ${guard.id === selected ? "selected" : ""}>${escapeHtml(guard.name)}</option>`).join("")}`;
  const roundList = rounds.length ? rounds.map((round) => `<article class="counting-round"><header><div><strong>${escapeHtml(round.name)}</strong><small>${escapeHtml(formatDate(`${round.date}T12:00:00Z`))} · ${escapeHtml(round.scheduledTime)}</small></div><span class="counting-status is-${round.status}">${escapeHtml(t(`status.${round.status === "in_progress" ? "inProgress" : round.status}`))}</span></header><div class="counting-total"><strong>${round.attendeeTotal}</strong><span>${escapeHtml(t(round.provisional ? "counting.provisionalTotal" : "counting.finalTotal"))}</span><small>${escapeHtml(t("counting.sectionsDone", { complete: round.completed, total: round.totalSections }))}</small></div><div class="counting-section-list">${round.sections.map((section) => `<div><span class="counting-dot is-${section.status}"></span><div><strong>${escapeHtml(section.name)}</strong><small>${escapeHtml(section.guardName)}</small></div><b>${section.attendeeCount ?? "–"}</b><button class="icon-button copy-value" data-copy="${escapeHtml(section.url)}" aria-label="${escapeHtml(t("counting.copyLink"))}">${icons.copy}</button></div>`).join("")}</div></article>`).join("") : `<p class="base-empty">${escapeHtml(t("counting.noRounds"))}</p>`;
  const dayOptions = state.dashboard.days.map((day) => `<option value="${day.id}">${escapeHtml(formatDate(`${day.date}T12:00:00Z`))}</option>`).join("");
  const rows = state.countingDraft.map((section, index) => `<div class="counting-draft-row"><label>${escapeHtml(t("counting.sectionName"))}<input name="sectionName" data-index="${index}" value="${escapeHtml(section.name)}" required></label><label>${escapeHtml(t("counting.responsibleGuard"))}<select name="guardId" data-index="${index}" required>${guardOptions(section.guardId)}</select></label></div>`).join("");
  return `<article class="content-card dashboard-counting-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("terms.counting"))}</span><h2>${escapeHtml(t("counting.dashboardTitle"))}</h2><p>${escapeHtml(t("counting.dashboardIntro"))}</p></div></div><div class="counting-rounds">${roundList}</div><details class="counting-create"><summary>${escapeHtml(t("counting.newRound"))}</summary><form id="counting-round-form" class="compact-form"><label>${escapeHtml(t("counting.day"))}<select name="dayId" required>${dayOptions}</select></label><label>${escapeHtml(t("counting.time"))}<input name="scheduledTime" type="time" value="11:40" required></label><label class="wide">${escapeHtml(t("counting.roundName"))}<input name="name" value="${escapeHtml(t("counting.defaultName"))}" required></label><div class="wide counting-draft">${rows}</div><button id="add-counting-section" class="button button--secondary wide" type="button">+ ${escapeHtml(t("counting.addSection"))}</button><p class="form-error wide" hidden></p><div class="form-actions wide"><button class="button button--primary" type="submit">${escapeHtml(t("counting.createRound"))}</button></div></form></details></article>`;
}

function communicationsDashboardCard() {
  const data = state.dashboard.communications || { provider: { status: "not_configured" }, messages: [] };
  const assignedIds = [...new Set(state.dashboard.assignments.map((assignment) => assignment.guardId))];
  const guards = assignedIds.map((id) => state.dashboard.guards.find((guard) => guard.id === id)).filter((guard) => guard?.phone);
  const recipientChoices = guards.map((guard) => `<label class="message-recipient"><input type="checkbox" name="recipientGuardIds" value="${guard.id}"><span>${escapeHtml(guard.name)}</span><small>${escapeHtml(guard.phone)}</small></label>`).join("");
  const log = data.messages?.length ? data.messages.slice(0, 10).map((item) => `<article class="message-log-row"><div><strong>${escapeHtml(t(`communications.type.${item.type}`))}</strong><small>${escapeHtml(t("communications.recipientCount", { count: item.recipients.length }))} · ${escapeHtml(new Intl.DateTimeFormat(getLocale(), { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Oslo" }).format(new Date(item.createdAt)))}</small></div><p>${escapeHtml(item.message)}</p><span class="delivery-status is-${item.status}">${escapeHtml(t(`communications.status.${item.status}`))}</span></article>`).join("") : `<p class="base-empty">${escapeHtml(t("communications.noMessages"))}</p>`;
  const recipients = `<fieldset class="wide message-recipients"><legend>${escapeHtml(t("communications.recipients"))}</legend><div class="message-recipient-actions"><button type="button" class="select-all-recipients">${escapeHtml(t("communications.selectAll"))}</button><button type="button" class="clear-recipients">${escapeHtml(t("communications.clearAll"))}</button></div>${recipientChoices || `<p>${escapeHtml(t("communications.noRecipients"))}</p>`}</fieldset>`;
  return `<article class="content-card communications-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("communications.eyebrow"))}</span><h2>${escapeHtml(t("communications.title"))}</h2><p>${escapeHtml(t("communications.intro"))}</p></div><span class="provider-state is-${data.provider.status}">${escapeHtml(t(`communications.provider.${data.provider.status}`))}</span></div><div class="provider-notice"><strong>${escapeHtml(t("communications.oneWayTitle"))}</strong><p>${escapeHtml(t("communications.oneWayBody"))}</p></div><form id="event-message-form" class="compact-form"><label>${escapeHtml(t("communications.messageType"))}<select name="type"><option value="general">${escapeHtml(t("communications.type.general"))}</option><option value="call">${escapeHtml(t("communications.type.call"))}</option></select></label><label class="wide">${escapeHtml(t("communications.message"))}<textarea name="message" maxlength="2000" required></textarea></label>${recipients}<p class="form-error wide" hidden></p><div class="form-actions wide"><button class="button button--primary" type="submit">${escapeHtml(t("communications.sendIndividually"))}</button></div></form><details class="alarm-panel"><summary>! ${escapeHtml(t("alarm.open"))}</summary><form id="alarm-form" class="compact-form"><label>${escapeHtml(t("alarm.situation"))}<select name="situationType"><option value="fire">${escapeHtml(t("alarm.fire"))}</option><option value="evacuation">${escapeHtml(t("alarm.evacuation"))}</option><option value="medical">${escapeHtml(t("alarm.medical"))}</option><option value="security">${escapeHtml(t("alarm.security"))}</option><option value="other">${escapeHtml(t("alarm.other"))}</option></select></label><label class="wide">${escapeHtml(t("alarm.message"))}<textarea name="message" maxlength="2000" required></textarea></label>${recipients}<div class="alarm-warning wide"><strong>${escapeHtml(t("alarm.notEmergencyReplacement"))}</strong><span>${escapeHtml(t("alarm.deliveryWarning"))}</span></div><label class="check-row wide"><input type="checkbox" name="confirmed" required>${escapeHtml(t("alarm.confirm"))}</label><p class="form-error wide" hidden></p><div class="form-actions wide"><button class="button button--danger" type="submit">${escapeHtml(t("alarm.activate"))}</button></div></form></details><div class="message-log"><h3>${escapeHtml(t("communications.log"))}</h3>${log}</div></article>`;
}

function dashboardView() {
  const dashboard = state.dashboard;
  if (!dashboard) return shell(`<main class="page"><p>${escapeHtml(t("app.loading"))}</p></main>`, t("dashboard.title"));
  const context = dashboardContext();
  const arrived = context.checkedInIds.size;
  const expected = context.expectedIds.size;
  const currentLabel = context.currentShift ? `${context.currentShift.startTime}–${context.currentShift.endTime}` : t("dashboard.noActiveShift");
  const assignmentTotal = dashboard.days.reduce((sum, day) => sum + day.shifts.length * dashboard.posts.length, 0);
  const fillPercent = assignmentTotal ? Math.round((dashboard.assignments.length / assignmentTotal) * 100) : 0;
  const contactCards = dashboard.contacts.length ? dashboard.contacts.map((contact) => `<a class="dashboard-contact" href="tel:${escapeHtml(contact.phone.replace(/\s/g, ""))}"><span>${icons.phone}</span><div><strong>${escapeHtml(contact.category)}</strong><small>${escapeHtml([contact.name, contact.phone].filter(Boolean).join(" · "))}</small></div><b>→</b></a>`).join("") : `<p class="base-empty">${escapeHtml(t("dashboard.noContacts"))}</p>`;
  const checkInCard = `${checkInDashboardCard()}${countingDashboardCard()}${communicationsDashboardCard()}`;
  const nextShift = context.nextShift ? `${formatDate(`${context.nextShift.day.date}T12:00:00Z`)} · ${context.nextShift.startTime}–${context.nextShift.endTime}` : t("dashboard.noMoreShifts");
  return shell(`<main class="page dashboard-page"><section class="dashboard-hero"><div class="dashboard-event"><span class="eyebrow">${escapeHtml(dashboard.event.venue.name)} · ${escapeHtml(dateLabel(dashboard.event.startDate, dashboard.event.endDate))}</span><h1>${escapeHtml(dashboard.event.name)}</h1><div class="mode-switch"><button class="dashboard-mode ${state.dashboardMode === "planning" ? "is-active" : ""}" data-mode="planning">${escapeHtml(t("dashboard.planningMode"))}</button><button class="dashboard-mode ${state.dashboardMode === "operation" ? "is-active" : ""}" data-mode="operation">${escapeHtml(t("dashboard.operationMode"))}</button></div></div><div class="dashboard-clock"><span>${escapeHtml(t("dashboard.localTime"))}</span><strong id="live-clock">${escapeHtml(context.now.clock)}</strong><small>${escapeHtml(formatDate(`${context.now.date}T12:00:00Z`))}</small></div><div class="next-shift"><span>${escapeHtml(t("dashboard.nextShift"))}</span><strong>${escapeHtml(nextShift)}</strong><small id="next-shift-countdown">${escapeHtml(nextShiftText(context))}</small></div></section><section class="dashboard-metrics">${dashboardMetric("✓", t("dashboard.arrived"), String(arrived), t("dashboard.ofExpected", { expected }), "green")}${dashboardMetric("!", t("dashboard.missing"), String(context.missingIds.length), t("dashboard.notCheckedIn"), context.missingIds.length ? "amber" : "green")}${dashboardMetric("R", t("terms.reserves"), String(context.reserveIds.length), t("dashboard.presentNotOnDuty"), "blue")}${dashboardMetric("P", t("dashboard.unstaffedPosts"), String(context.unstaffed.length), context.currentShift ? currentLabel : t("dashboard.forSelectedDay"), context.unstaffed.length ? "red" : "green")}</section><section class="dashboard-grid"><article class="content-card dashboard-shift-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("dashboard.shiftStatus"))}</span><h2>${escapeHtml(currentLabel)}</h2></div><span class="state-chip ${context.currentShift ? "is-active" : ""}">${escapeHtml(t(context.currentShift ? "dashboard.shiftActive" : "dashboard.waiting"))}</span></div><div class="readiness"><div><span>${escapeHtml(t("dashboard.planCoverage"))}</span><strong>${fillPercent}%</strong></div><progress max="100" value="${fillPercent}"></progress><small>${escapeHtml(t("dashboard.assignmentsComplete", { complete: dashboard.assignments.length, total: assignmentTotal }))}</small></div><div class="dashboard-actions"><a class="button button--primary button-link" href="/orden/vaktplan?id=${encodeURIComponent(dashboard.event.id)}" data-link>${escapeHtml(t("planning.open"))}</a><button id="open-attendance" class="button button--secondary">${escapeHtml(t("dashboard.manageAttendance"))}</button></div></article><article class="content-card dashboard-roster-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("dashboard.overview"))}</span><h2>${escapeHtml(t("dashboard.attendance"))}</h2></div><button id="open-attendance-secondary" class="button button--secondary">${escapeHtml(t("dashboard.openList"))}</button></div><div class="roster-summary"><div><strong>${arrived}</strong><span>${escapeHtml(t("dashboard.present"))}</span></div><div><strong>${context.missingIds.length}</strong><span>${escapeHtml(t("dashboard.missing"))}</span></div><div><strong>${context.reserveIds.length}</strong><span>${escapeHtml(t("terms.reserves"))}</span></div></div></article>${checkInCard}<article class="content-card dashboard-contacts-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("dashboard.quickAccess"))}</span><h2>${escapeHtml(t("terms.contacts"))}</h2></div></div><div class="dashboard-contacts">${contactCards}</div></article></section>${attendanceModal()}${checkInCodesModal()}</main>`, t("dashboard.title"));
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
  const guardWeekdays = item?.availableWeekdays || [];
  const weekdayFields = Array.from({ length: 7 }, (_, day) => `<label class="check-row"><input type="checkbox" name="availableWeekdays" value="${day}" ${guardWeekdays.includes(day) ? "checked" : ""}><span>${escapeHtml(t(`planning.weekday.${day}`))}</span></label>`).join("");
  const allowedPosts = item?.allowedPostIds || [];
  const postFields = state.base.posts.length ? state.base.posts.filter((post) => post.active).map((post) => `<label class="check-row"><input type="checkbox" name="allowedPostIds" value="${post.id}" ${allowedPosts.includes(post.id) ? "checked" : ""}><span>${escapeHtml(post.code)} · ${escapeHtml(post.shortName)}</span></label>`).join("") : `<small>${escapeHtml(t("planning.noPostRestrictions"))}</small>`;
  const fields = entity === "guards"
    ? `<label>${escapeHtml(t("users.name"))}<input name="name" value="${value("name")}" required maxlength="120"></label><label>${escapeHtml(t("base.phone"))}<input name="phone" type="tel" value="${value("phone")}" autocomplete="tel"></label><label>${escapeHtml(t("base.emailOptional"))}<input name="email" type="email" value="${value("email")}" autocomplete="email"></label><label>${escapeHtml(t("base.availability"))}<input name="availability" value="${value("availability")}"></label><fieldset class="wide availability-fieldset"><legend>${escapeHtml(t("planning.structuredAvailability"))}</legend><div class="availability-times"><label>${escapeHtml(t("planning.availableFrom"))}<input name="availableFrom" type="time" value="${value("availableFrom")}"></label><label>${escapeHtml(t("planning.availableTo"))}<input name="availableTo" type="time" value="${value("availableTo")}"></label></div><div class="weekday-grid">${weekdayFields}</div><small>${escapeHtml(t("planning.availabilityEmptyHint"))}</small></fieldset><fieldset class="wide availability-fieldset"><legend>${escapeHtml(t("planning.allowedPosts"))}</legend><div class="post-choice-grid">${postFields}</div><small>${escapeHtml(t("planning.allowedPostsHint"))}</small></fieldset><label class="wide">${escapeHtml(t("base.restrictions"))}<textarea name="restrictions">${value("restrictions")}</textarea></label><label class="wide">${escapeHtml(t("base.preferences"))}<textarea name="preferences">${value("preferences")}</textarea></label><label class="wide">${escapeHtml(t("base.notes"))}<textarea name="notes">${value("notes")}</textarea></label>`
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
  if (dashboardClockTimer) { clearInterval(dashboardClockTimer); dashboardClockTimer = null; }
  if (countingRefreshTimer) { clearInterval(countingRefreshTimer); countingRefreshTimer = null; }
  const current = route();
  if (current === "public-counting") app.innerHTML = publicCountingView();
  else if (current === "public-checkin") app.innerHTML = publicCheckInView();
  else if (current === "setup-password") app.innerHTML = setupPasswordView();
  else if (!state.user) app.innerHTML = loginView();
  else if (current === "users" && state.user.role === "system_admin") app.innerHTML = usersView();
  else if (current === "settings") app.innerHTML = settingsView();
  else if (current === "events") app.innerHTML = eventsView();
  else if (current === "event-wizard") app.innerHTML = eventWizardView();
  else if (current === "planning") app.innerHTML = planningView();
  else if (current === "dashboard") app.innerHTML = dashboardView();
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
    const formData = new FormData(currentForm);
    const data = Object.fromEntries(formData);
    if (currentForm.dataset.entity === "guards") {
      data.availableWeekdays = formData.getAll("availableWeekdays").map(Number);
      data.allowedPostIds = formData.getAll("allowedPostIds");
    }
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

function applyPlanningResult(result, closeModal = false) {
  state.planning = result.planning;
  if (closeModal) { state.planningSlot = null; state.planningSearch = ""; state.planningGuardMenu = null; }
  render();
}

function bindGuardOptionActions() {
  document.querySelectorAll(".guard-select").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const result = await endpoints.assignGuard(state.planning.event.id, state.planningSlot.shiftId, state.planningSlot.postId, button.dataset.guardId);
      applyPlanningResult(result, true);
      toast(t("planning.assignmentSaved"));
    } catch (error) { button.disabled = false; toast(errorText(error), "error"); }
  }));
  document.querySelectorAll(".guard-disable-menu").forEach((button) => button.addEventListener("click", () => { state.planningGuardMenu = button.dataset.guardId; render(); }));
}

function bindPlanning() {
  document.querySelectorAll(".planning-day").forEach((button) => button.addEventListener("click", () => { state.planningDay = Number(button.dataset.dayIndex); state.planningSlot = null; render(); }));
  document.querySelectorAll(".planning-cell").forEach((button) => button.addEventListener("click", () => {
    state.planningSlot = { dayIndex: Number(button.dataset.dayIndex), shiftId: button.dataset.shiftId, postId: button.dataset.postId };
    state.planningSearch = "";
    state.planningGuardMenu = null;
    render();
  }));
  const closeModal = () => { state.planningSlot = null; state.planningSearch = ""; state.planningGuardMenu = null; render(); };
  document.querySelector(".close-planning-modal")?.addEventListener("click", closeModal);
  document.querySelector("#planning-modal-backdrop")?.addEventListener("click", (event) => { if (event.target === event.currentTarget) closeModal(); });
  document.querySelector("#planning-guard-search")?.addEventListener("input", (event) => {
    state.planningSearch = event.target.value;
    const options = document.querySelector("#guard-options");
    if (options) { options.innerHTML = guardOptionList(); bindGuardOptionActions(); }
  });
  document.querySelector("#remove-planning-assignment")?.addEventListener("click", async (event) => {
    const button = event.currentTarget; button.disabled = true;
    try { const result = await endpoints.assignGuard(state.planning.event.id, state.planningSlot.shiftId, state.planningSlot.postId, null); applyPlanningResult(result, true); toast(t("planning.assignmentRemoved")); }
    catch (error) { button.disabled = false; toast(errorText(error), "error"); }
  });
  document.querySelectorAll(".cancel-disable").forEach((button) => button.addEventListener("click", () => { state.planningGuardMenu = null; render(); }));
  document.querySelectorAll(".disable-guard").forEach((button) => button.addEventListener("click", async () => {
    const count = state.planning.assignments.filter((assignment) => assignment.guardId === button.dataset.guardId).length;
    if (count && !window.confirm(t("planning.disableConfirm", { count }))) return;
    button.disabled = true;
    try { const result = await endpoints.setPlanningGuardDisabled(state.planning.event.id, button.dataset.guardId, { scope: button.dataset.scope, disabled: true, confirm: count > 0 }); applyPlanningResult(result); toast(t("planning.guardDisabled")); }
    catch (error) { button.disabled = false; toast(errorText(error), "error"); }
  }));
  document.querySelectorAll(".enable-event-guard").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { const result = await endpoints.setPlanningGuardDisabled(state.planning.event.id, button.dataset.guardId, { scope: "event", disabled: false }); applyPlanningResult(result); toast(t("planning.guardEnabled")); }
    catch (error) { button.disabled = false; toast(errorText(error), "error"); }
  }));
  bindGuardOptionActions();
}

function updateDashboardClock() {
  if (!state.dashboard || route() !== "dashboard") return;
  const context = dashboardContext();
  const clock = document.querySelector("#live-clock");
  const countdown = document.querySelector("#next-shift-countdown");
  if (clock) clock.textContent = context.now.clock;
  if (countdown) countdown.textContent = nextShiftText(context);
}

function bindDashboard() {
  document.querySelectorAll(".dashboard-mode").forEach((button) => button.addEventListener("click", () => { state.dashboardMode = button.dataset.mode; render(); }));
  const openAttendance = () => { state.attendanceOpen = true; render(); };
  document.querySelector("#open-attendance")?.addEventListener("click", openAttendance);
  document.querySelector("#open-attendance-secondary")?.addEventListener("click", openAttendance);
  const closeAttendance = () => { state.attendanceOpen = false; render(); };
  document.querySelector(".close-attendance")?.addEventListener("click", closeAttendance);
  document.querySelector("#attendance-backdrop")?.addEventListener("click", (event) => { if (event.target === event.currentTarget) closeAttendance(); });
  document.querySelectorAll(".attendance-action").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const result = await endpoints.updateAttendance(state.dashboard.event.id, button.dataset.guardId, button.dataset.action);
      state.dashboard = result.dashboard;
      render();
      toast(t(button.dataset.action === "checkin" ? "dashboard.checkedIn" : "dashboard.checkedOut"));
    } catch (error) { button.disabled = false; toast(errorText(error), "error"); }
  }));
  const applyCheckInResult = (result) => {
    state.dashboard.checkIn = result.checkIn;
    state.checkInCodes = result.codes || [];
    state.checkInCodesOpen = state.checkInCodes.length > 0;
    render();
  };
  document.querySelector("#configure-checkin")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try { applyCheckInResult(await endpoints.configureCheckIn(state.dashboard.event.id)); }
    catch (error) { event.currentTarget.disabled = false; toast(errorText(error), "error"); }
  });
  document.querySelector("#regenerate-checkin")?.addEventListener("click", async (event) => {
    if (!window.confirm(t("checkin.regenerateConfirm"))) return;
    event.currentTarget.disabled = true;
    try { applyCheckInResult(await endpoints.regenerateCheckInCodes(state.dashboard.event.id)); }
    catch (error) { event.currentTarget.disabled = false; toast(errorText(error), "error"); }
  });
  document.querySelector("#toggle-checkin")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try { const result = await endpoints.setCheckInActive(state.dashboard.event.id, event.currentTarget.dataset.active !== "true"); state.dashboard.checkIn = result.checkIn; render(); toast(t("common.saved")); }
    catch (error) { event.currentTarget.disabled = false; toast(errorText(error), "error"); }
  });
  const closeCodes = () => { state.checkInCodesOpen = false; render(); };
  document.querySelector(".close-checkin-codes")?.addEventListener("click", closeCodes);
  document.querySelector("#checkin-codes-backdrop")?.addEventListener("click", (event) => { if (event.target === event.currentTarget) closeCodes(); });
  document.querySelector("#copy-all-checkin-codes")?.addEventListener("click", async () => {
    const text = state.checkInCodes.map((item) => `${item.name}: ${item.code}`).join("\n");
    try { await navigator.clipboard.writeText(text); toast(t("checkin.copied")); } catch { toast(t("errors.copy_failed"), "error"); }
  });
  document.querySelector(".print-checkin-codes")?.addEventListener("click", () => window.print());
  document.querySelectorAll(".copy-value").forEach((button) => button.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(button.dataset.copy); toast(t("checkin.copied")); } catch { toast(t("errors.copy_failed"), "error"); }
  }));
  const captureCountingDraft = () => {
    const form = document.querySelector("#counting-round-form");
    if (!form) return;
    const names = [...form.querySelectorAll('[name="sectionName"]')]; const guards = [...form.querySelectorAll('[name="guardId"]')];
    state.countingDraft = names.map((input, index) => ({ name: input.value, guardId: guards[index]?.value || "" }));
  };
  document.querySelector("#add-counting-section")?.addEventListener("click", () => { captureCountingDraft(); state.countingDraft.push({ name: "", guardId: "" }); render(); document.querySelector(".counting-create")?.setAttribute("open", ""); });
  document.querySelector("#counting-round-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const names = data.getAll("sectionName"); const guardIds = data.getAll("guardId");
    const payload = { dayId: data.get("dayId"), scheduledTime: data.get("scheduledTime"), name: data.get("name"), sections: names.map((name, index) => ({ name, guardId: guardIds[index] })) };
    setFormBusy(form, true);
    try { const result = await endpoints.createCountingRound(state.dashboard.event.id, payload); state.dashboard.countingRounds = result.rounds; state.countingDraft = [{ name: "", guardId: "" }]; render(); toast(t("counting.created")); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
  document.querySelectorAll(".select-all-recipients").forEach((button) => button.addEventListener("click", () => button.closest("form")?.querySelectorAll('[name="recipientGuardIds"]').forEach((input) => { input.checked = true; })));
  document.querySelectorAll(".clear-recipients").forEach((button) => button.addEventListener("click", () => button.closest("form")?.querySelectorAll('[name="recipientGuardIds"]').forEach((input) => { input.checked = false; })));
  document.querySelector("#event-message-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const payload = { type: data.get("type"), message: data.get("message"), recipientGuardIds: data.getAll("recipientGuardIds") };
    setFormBusy(form, true);
    try { const result = await endpoints.sendEventMessage(state.dashboard.event.id, payload); state.dashboard.communications = result.communications; render(); toast(t(result.delivery.status === "sent" ? "communications.sent" : "communications.blocked"), result.delivery.status === "sent" ? "success" : "error"); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
  document.querySelector("#alarm-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const payload = { situationType: data.get("situationType"), message: data.get("message"), confirmed: data.get("confirmed") === "on", recipientGuardIds: data.getAll("recipientGuardIds") };
    setFormBusy(form, true);
    try { const result = await endpoints.activateAlarm(state.dashboard.event.id, payload); state.dashboard.communications = result.communications; render(); toast(t(result.delivery.status === "sent" ? "alarm.sent" : "alarm.blocked"), result.delivery.status === "sent" ? "success" : "error"); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
  if (route() === "dashboard") {
    updateDashboardClock();
    dashboardClockTimer = setInterval(updateDashboardClock, 1000);
    countingRefreshTimer = setInterval(async () => {
      try { const result = await endpoints.counting(state.dashboard.event.id); if (JSON.stringify(result.rounds) !== JSON.stringify(state.dashboard.countingRounds || [])) { state.dashboard.countingRounds = result.rounds; render(); } } catch { /* next poll retries */ }
    }, 5000);
  }
}

function bindEvents() {
  document.querySelectorAll("[data-link]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); navigate(link.getAttribute("href")); }));
  document.querySelector("#public-locale-select")?.addEventListener("change", (event) => changeLocale(event.target.value, false));
  document.querySelector("#public-checkin-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget; const submitter = event.submitter; const code = new FormData(form).get("code");
    setFormBusy(form, true);
    try {
      const token = new URLSearchParams(location.search).get("token") || "";
      const source = new URLSearchParams(location.search).get("source") === "nfc" ? "nfc" : "qr";
      state.publicCheckInResult = await endpoints.publicCheckIn(token, code, submitter?.value || "checkin", source);
      render();
    } catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
  document.querySelector(".checkin-code-input")?.addEventListener("input", (event) => {
    const raw = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    event.target.value = raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
  });
  document.querySelector("#checkin-again")?.addEventListener("click", () => { state.publicCheckInResult = null; render(); });
  document.querySelector("#start-counting")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try { const token = new URLSearchParams(location.search).get("token") || ""; const result = await endpoints.startCounting(token); state.publicCounting = result.counting; render(); }
    catch (error) { event.currentTarget.disabled = false; toast(errorText(error), "error"); }
  });
  document.querySelector("#public-counting-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const count = Number(new FormData(form).get("count")); setFormBusy(form, true);
    try { const token = new URLSearchParams(location.search).get("token") || ""; const result = await endpoints.submitCounting(token, count, state.publicCounting.revision); state.publicCounting = result.counting; render(); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
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
  document.querySelector("#event-type-select")?.addEventListener("change", async (event) => { const previous = state.user.selectedEventType; const next = event.target.value; event.target.disabled = true; try { await endpoints.selectEventType(next); state.user.selectedEventType = next; state.event = null; state.planning = null; state.dashboard = null; if (isBaseRoute()) await loadBaseData(); else if (["events", "home", "event-wizard", "planning", "dashboard"].includes(route())) { if (["event-wizard", "planning", "dashboard"].includes(route())) history.replaceState({}, "", "/orden/stevner"); await loadEvents(); } else render(); toast(t("eventType.changed", { type: eventTypeLabel(next).toLocaleLowerCase(getLocale()) })); } catch (error) { state.user.selectedEventType = previous; render(); toast(errorText(error), "error"); } });
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
  bindPlanning();
  bindDashboard();
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

async function loadPlanning() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { history.replaceState({}, "", "/orden/stevner"); return loadEvents(); }
  const result = await endpoints.initializePlanning(id);
  state.planning = result.planning;
  state.planningDay = Math.min(state.planningDay, Math.max(0, state.planning.days.length - 1));
  state.planningSlot = null;
  state.planningGuardMenu = null;
  render();
}

async function loadDashboard() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { history.replaceState({}, "", "/orden/stevner"); return loadEvents(); }
  const result = await endpoints.initializeDashboard(id);
  state.dashboard = result.dashboard;
  state.attendanceOpen = false;
  state.checkInCodes = [];
  state.checkInCodesOpen = false;
  render();
}

async function loadPublicCheckIn() {
  const token = new URLSearchParams(location.search).get("token") || "";
  state.publicCheckIn = null;
  state.publicCheckInResult = null;
  state.publicCheckInError = "";
  if (!token) { state.publicCheckInError = "checkin_portal_not_found"; render(); return; }
  try { const result = await endpoints.publicCheckInPortal(token); state.publicCheckIn = result.portal; }
  catch (error) { state.publicCheckInError = error?.code || "request_error"; }
  render();
}

async function loadPublicCounting() {
  const token = new URLSearchParams(location.search).get("token") || "";
  state.publicCounting = null; state.publicCountingError = "";
  if (!token) { state.publicCountingError = "counting_link_not_found"; render(); return; }
  try { const result = await endpoints.publicCounting(token); state.publicCounting = result.counting; }
  catch (error) { state.publicCountingError = error?.code || "request_error"; }
  render();
}

async function init() {
  await initI18n();
  setApiLocale(getLocale());
  const bootMessage = document.querySelector("#boot-message");
  if (bootMessage) bootMessage.textContent = t("app.loading");
  if (route() === "public-checkin") { await loadPublicCheckIn(); return; }
  if (route() === "public-counting") { await loadPublicCounting(); return; }
  try {
    const result = await endpoints.me(); state.user = result.user;
    if (state.user.locale && state.user.locale !== getLocale()) { await setLocale(state.user.locale); setApiLocale(state.user.locale); }
    if (route() === "users" && state.user.role === "system_admin") await loadUsers();
    else if (isBaseRoute()) await loadBaseData();
    else if (route() === "event-wizard") await loadEventWorkspace();
    else if (route() === "planning") await loadPlanning();
    else if (route() === "dashboard") await loadDashboard();
    else if (["home", "events"].includes(route())) await loadEvents();
    else render();
  } catch (error) {
    if (!(error instanceof ApiError) || ![401, 403].includes(error.status)) console.warn(error);
    try { const status = await endpoints.setupStatus(); state.configured = status.configured; } catch { state.configured = true; }
    state.user = null; if (!["login", "setup-password"].includes(route())) history.replaceState({}, "", "/orden/login"); render();
  }
}

window.addEventListener("popstate", () => { if (route() === "public-checkin") return loadPublicCheckIn(); if (route() === "public-counting") return loadPublicCounting(); if (!state.user) return render(); if (route() === "users" && !state.users.length) loadUsers().catch((error) => toast(errorText(error), "error")); else if (isBaseRoute()) loadBaseData().catch((error) => toast(errorText(error), "error")); else if (route() === "event-wizard") loadEventWorkspace().catch((error) => toast(errorText(error), "error")); else if (route() === "planning") loadPlanning().catch((error) => toast(errorText(error), "error")); else if (route() === "dashboard") loadDashboard().catch((error) => toast(errorText(error), "error")); else if (["home", "events"].includes(route())) loadEvents().catch((error) => toast(errorText(error), "error")); else render(); });
init().catch((error) => { console.error(error); });
