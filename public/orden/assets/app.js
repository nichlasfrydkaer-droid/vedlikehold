import { ApiError, endpoints, setApiLocale, setCsrfToken } from "./api.js";
import { getLocale, getLocales, initI18n, setLocale, t } from "./i18n.js";

const app = document.querySelector("#app");
const state = { user: null, users: [], base: { guards: [], posts: [], contacts: [], settings: null }, configured: true, mobileMenu: false, setupComplete: false };

const icons = {
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 1-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
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
  return "home";
}

function navigate(path) {
  history.pushState({}, "", path);
  state.mobileMenu = false;
  if (path === "/orden/brukere" && state.user?.role === "system_admin") {
    loadUsers().catch((error) => { toast(errorText(error), "error"); render(); });
  } else if (path === "/orden/grunnoppsett") loadBaseData().catch((error) => { toast(errorText(error), "error"); render(); });
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
  const canManageUsers = state.user.role === "system_admin";
  const selector = state.user.eventTypes.length > 1
    ? `<label class="type-select"><span>${escapeHtml(t("eventType.label"))}</span><select id="event-type-select">${state.user.eventTypes.map((type) => `<option value="${type}" ${type === state.user.selectedEventType ? "selected" : ""}>${escapeHtml(eventTypeLabel(type))}</option>`).join("")}</select></label>`
    : `<div class="type-pill">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</div>`;
  return `<div class="app-shell ${state.mobileMenu ? "menu-open" : ""}"><button class="menu-backdrop" aria-label="${escapeHtml(t("common.closeMenu"))}"></button><aside class="sidebar"><div class="sidebar-top">${brand()}<button class="icon-button close-menu" aria-label="${escapeHtml(t("common.closeMenu"))}">${icons.close}</button></div><nav aria-label="${escapeHtml(t("common.mainMenu"))}">${navItem("/orden", "nav.home", "home", current)}${navItem("/orden/stevner", "nav.events", "calendar", current, true)}${canManageUsers ? navItem("/orden/brukere", "nav.users", "users", current) : ""}${navItem("/orden/grunnoppsett", "nav.baseData", "shield", current)}${navItem("/orden/innstillinger", "nav.settings", "settings", current)}</nav><div class="sidebar-footer"><div class="user-mini"><span>${escapeHtml(state.user.name.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(state.user.name)}</strong><small>${escapeHtml(roleLabel(state.user.role))}</small></div></div><button id="logout-button" class="nav-item nav-button">${icons.logout}<span>${escapeHtml(t("auth.logout"))}</span></button></div></aside><div class="main-column"><header class="topbar"><button class="icon-button open-menu" aria-label="${escapeHtml(t("common.openMenu"))}">${icons.menu}</button><div><span class="topbar-label">${escapeHtml(t("app.title"))}</span><strong>${escapeHtml(pageTitle)}</strong></div>${selector}</header>${content}</div></div>`;
}

function homeView() {
  const type = eventTypeLabel(state.user.selectedEventType).toLocaleLowerCase(getLocale());
  return shell(`<main class="page page--home"><section class="hero-panel"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(t("home.greeting", { name: state.user.name.split(" ")[0] }))}</h1><p>${escapeHtml(t("home.foundationBody"))}</p></div><div class="phase-badge"><span>${escapeHtml(t("home.phase"))}</span><strong>${escapeHtml(t("home.foundation"))}</strong><small>${escapeHtml(t("home.secured"))}</small></div></section><section class="action-grid" aria-label="${escapeHtml(t("home.eventActions"))}"><article class="action-card action-card--primary"><div class="action-icon">${icons.calendar}</div><div><span class="eyebrow">${escapeHtml(t("home.planning"))}</span><h2>${escapeHtml(t("home.createEvent"))}</h2><p>${escapeHtml(t("home.createEventLater"))}</p></div><button class="button button--muted" disabled>${escapeHtml(t("home.availablePhase3"))}</button></article><article class="action-card"><div class="action-icon">${icons.shield}</div><div><span class="eyebrow">${escapeHtml(t("home.nextEvent"))}</span><h2>${escapeHtml(t("home.noUpcoming", { type }))}</h2><p>${escapeHtml(t("home.nextEventBody"))}</p></div><span class="empty-chip">${escapeHtml(t("home.noData"))}</span></article></section><section class="content-card"><div class="section-heading"><div><span class="eyebrow">${escapeHtml(t("home.implementationStatus"))}</span><h2>${escapeHtml(t("home.safeFoundation"))}</h2></div></div><div class="status-grid"><div><span class="status-check">✓</span><strong>${escapeHtml(t("home.secureLogin"))}</strong><p>${escapeHtml(t("home.secureLoginBody"))}</p></div><div><span class="status-check">✓</span><strong>${escapeHtml(t("home.roleAccess"))}</strong><p>${escapeHtml(t("home.roleAccessBody"))}</p></div><div><span class="status-check">✓</span><strong>${escapeHtml(t("home.eventTypes"))}</strong><p>${escapeHtml(t("home.eventTypesBody"))}</p></div></div></section></main>`, t("nav.home"));
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

function baseRows(entity, emptyKey) {
  const items = state.base[entity];
  if (!items.length) return `<p class="base-empty">${escapeHtml(t(emptyKey))}</p>`;
  return `<div class="base-list">${items.map((item) => {
    const title = entity === "guards" ? item.name : entity === "posts" ? `${item.code} · ${item.shortName}` : item.category;
    const details = entity === "guards" ? [item.phone, item.email, item.availability] : entity === "posts" ? [item.notes] : [item.name, item.phone];
    return `<article class="base-row ${item.active ? "" : "is-inactive"}"><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(details.filter(Boolean).join(" · "))}</small></div><span class="state-chip ${item.active ? "is-active" : ""}">${escapeHtml(t(item.active ? "common.active" : "common.inactive"))}</span><button class="button button--secondary base-toggle" data-entity="${entity}" data-id="${item.id}" data-active="${item.active}">${escapeHtml(t(item.active ? "base.deactivate" : "base.activate"))}</button></article>`;
  }).join("")}</div>`;
}

function baseView() {
  const settings = state.base.settings || { shiftCount: 3, dayStart: "08:00", dayEnd: "17:00" };
  return shell(`<main class="page"><section class="page-heading"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>${escapeHtml(t("base.title"))}</h1><p>${escapeHtml(t("base.intro", { type: eventTypeLabel(state.user.selectedEventType).toLocaleLowerCase(getLocale()) }))}</p></div></section><div class="base-grid">
    <section class="content-card base-card"><div class="section-heading"><h2>${escapeHtml(t("base.guards"))}</h2></div><form class="compact-form base-create" data-entity="guards"><label>${escapeHtml(t("users.name"))}<input name="name" required></label><label>${escapeHtml(t("base.phone"))}<input name="phone" type="tel"></label><label>${escapeHtml(t("base.emailOptional"))}<input name="email" type="email"></label><label>${escapeHtml(t("base.availability"))}<input name="availability"></label><label>${escapeHtml(t("base.preferences"))}<input name="preferences"></label><label class="wide">${escapeHtml(t("base.notes"))}<textarea name="notes"></textarea></label><p class="form-error wide" hidden></p><button class="button button--primary wide" type="submit">${escapeHtml(t("base.addGuard"))}</button></form>${baseRows("guards", "base.emptyGuards")}</section>
    <section class="content-card base-card"><div class="section-heading"><h2>${escapeHtml(t("base.posts"))}</h2></div><form class="compact-form base-create" data-entity="posts"><label>${escapeHtml(t("base.postCode"))}<input name="code" required maxlength="12" placeholder="3B"><small>${escapeHtml(t("base.postCodeHint"))}</small></label><label>${escapeHtml(t("base.shortName"))}<input name="shortName" required></label><label class="wide">${escapeHtml(t("base.notes"))}<textarea name="notes"></textarea></label><p class="form-error wide" hidden></p><button class="button button--primary wide" type="submit">${escapeHtml(t("base.addPost"))}</button></form>${baseRows("posts", "base.emptyPosts")}</section>
    <section class="content-card base-card"><div class="section-heading"><h2>${escapeHtml(t("base.contacts"))}</h2></div><form class="compact-form base-create" data-entity="contacts"><label>${escapeHtml(t("base.category"))}<input name="category" required placeholder="${escapeHtml(t("base.categoryHint"))}"></label><label>${escapeHtml(t("users.name"))}<input name="name"></label><label>${escapeHtml(t("base.phone"))}<input name="phone" type="tel" required></label><label class="wide">${escapeHtml(t("base.notes"))}<textarea name="notes"></textarea></label><p class="form-error wide" hidden></p><button class="button button--primary wide" type="submit">${escapeHtml(t("base.addContact"))}</button></form>${baseRows("contacts", "base.emptyContacts")}</section>
    <section class="content-card base-card"><div class="section-heading"><div><h2>${escapeHtml(t("base.defaults"))}</h2><p>${escapeHtml(t("base.defaultsBody"))}</p></div></div><form id="base-settings-form" class="compact-form"><label>${escapeHtml(t("base.defaultShiftCount"))}<input name="shiftCount" type="number" min="1" max="12" value="${settings.shiftCount}" required></label><label>${escapeHtml(t("base.defaultDayStart"))}<input name="dayStart" type="time" value="${settings.dayStart}" required></label><label>${escapeHtml(t("base.defaultDayEnd"))}<input name="dayEnd" type="time" value="${settings.dayEnd}" required></label><p class="form-error wide" hidden></p><button class="button button--primary wide" type="submit">${escapeHtml(t("common.save"))}</button></form></section>
  </div></main>`, t("base.title"));
}

function render() {
  const current = route();
  if (current === "setup-password") app.innerHTML = setupPasswordView();
  else if (!state.user) app.innerHTML = loginView();
  else if (current === "users" && state.user.role === "system_admin") app.innerHTML = usersView();
  else if (current === "settings") app.innerHTML = settingsView();
  else if (current === "base") app.innerHTML = baseView();
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

function bindEvents() {
  document.querySelectorAll("[data-link]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); navigate(link.getAttribute("href")); }));
  document.querySelector("#public-locale-select")?.addEventListener("change", (event) => changeLocale(event.target.value, false));
  document.querySelector("#settings-locale-select")?.addEventListener("change", (event) => changeLocale(event.target.value, true));
  document.querySelector(".open-menu")?.addEventListener("click", () => { state.mobileMenu = true; document.querySelector(".app-shell")?.classList.add("menu-open"); });
  const closeMenu = () => { state.mobileMenu = false; document.querySelector(".app-shell")?.classList.remove("menu-open"); };
  document.querySelector(".close-menu")?.addEventListener("click", closeMenu);
  document.querySelector(".menu-backdrop")?.addEventListener("click", closeMenu);
  document.querySelector("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true);
    try { const data = new FormData(form); const result = await endpoints.login(data.get("email"), data.get("password")); state.user = result.user; if (state.user.locale && state.user.locale !== getLocale()) { await setLocale(state.user.locale); setApiLocale(state.user.locale); } navigate("/orden"); }
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
  document.querySelector("#event-type-select")?.addEventListener("change", async (event) => { const previous = state.user.selectedEventType; const next = event.target.value; event.target.disabled = true; try { await endpoints.selectEventType(next); state.user.selectedEventType = next; if (route() === "base") await loadBaseData(); else render(); toast(t("eventType.changed", { type: eventTypeLabel(next).toLocaleLowerCase(getLocale()) })); } catch (error) { state.user.selectedEventType = previous; render(); toast(errorText(error), "error"); } });
  const createPanel = document.querySelector("#create-user-panel");
  document.querySelector("#show-create-user")?.addEventListener("click", () => { createPanel.hidden = false; createPanel.scrollIntoView({ behavior: "smooth", block: "start" }); createPanel.querySelector("input")?.focus(); });
  const hideCreate = () => { if (createPanel) createPanel.hidden = true; };
  document.querySelector("#hide-create-user")?.addEventListener("click", hideCreate);
  document.querySelector("#cancel-create-user")?.addEventListener("click", hideCreate);
  document.querySelector("#create-user-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true); try { await endpoints.createUser(formPayload(form)); await loadUsers(); toast(t("users.created")); } catch (error) { showFormError(form, error); setFormBusy(form, false); } });
  document.querySelectorAll(".edit-user").forEach((button) => button.addEventListener("click", () => { const user = state.users.find((item) => item.id === button.dataset.id); const panel = document.querySelector("#edit-user-panel"); panel.innerHTML = editUserPanel(user); panel.hidden = false; panel.scrollIntoView({ behavior: "smooth", block: "start" }); bindEditForm(panel); }));
  document.querySelectorAll(".base-create").forEach((form) => form.addEventListener("submit", async (event) => { event.preventDefault(); const currentForm = event.currentTarget; setFormBusy(currentForm, true); const data = Object.fromEntries(new FormData(currentForm)); try { await endpoints.createBaseItem(currentForm.dataset.entity, data); await loadBaseData(); toast(t("base.created")); } catch (error) { showFormError(currentForm, error); setFormBusy(currentForm, false); } }));
  document.querySelectorAll(".base-toggle").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; try { await endpoints.updateBaseItem(button.dataset.entity, button.dataset.id, { active: button.dataset.active !== "true" }); await loadBaseData(); toast(t("base.updated")); } catch (error) { button.disabled = false; toast(errorText(error), "error"); } }));
  document.querySelector("#base-settings-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true); const data = Object.fromEntries(new FormData(form)); data.shiftCount = Number(data.shiftCount); try { await endpoints.updateBaseSettings(data); await loadBaseData(); toast(t("base.saved")); } catch (error) { showFormError(form, error); setFormBusy(form, false); } });
}

function bindEditForm(panel) {
  const hide = () => { panel.hidden = true; panel.innerHTML = ""; };
  panel.querySelector("#hide-edit-user")?.addEventListener("click", hide);
  panel.querySelector("#cancel-edit-user")?.addEventListener("click", hide);
  panel.querySelector("#edit-user-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true); try { await endpoints.updateUser(form.dataset.id, formPayload(form, true)); await loadUsers(); toast(t("common.saved")); } catch (error) { showFormError(form, error); setFormBusy(form, false); } });
}

async function loadUsers() {
  const result = await endpoints.users(); state.users = result.users; render();
}

async function loadBaseData() {
  const [guards, posts, contacts, settings] = await Promise.all([endpoints.baseItems("guards"), endpoints.baseItems("posts"), endpoints.baseItems("contacts"), endpoints.baseSettings()]);
  state.base = { guards: guards.items, posts: posts.items, contacts: contacts.items, settings: settings.settings };
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
    else if (route() === "base") await loadBaseData();
    else render();
  } catch (error) {
    if (!(error instanceof ApiError) || ![401, 403].includes(error.status)) console.warn(error);
    try { const status = await endpoints.setupStatus(); state.configured = status.configured; } catch { state.configured = true; }
    state.user = null; if (!["login", "setup-password"].includes(route())) history.replaceState({}, "", "/orden/login"); render();
  }
}

window.addEventListener("popstate", () => { if (state.user && route() === "users" && !state.users.length) loadUsers().catch((error) => toast(errorText(error), "error")); else if (state.user && route() === "base") loadBaseData().catch((error) => toast(errorText(error), "error")); else render(); });
init().catch((error) => { console.error(error); });
