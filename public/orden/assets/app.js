import { ApiError, endpoints, setCsrfToken } from "./api.js";

const app = document.querySelector("#app");
const state = { user: null, users: [], configured: true, busy: false, mobileMenu: false };

const icons = {
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`,
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function route() {
  const path = location.pathname.replace(/\/+$/, "") || "/orden";
  if (!path.startsWith("/orden")) return "home";
  if (path === "/orden/login") return "login";
  if (path === "/orden/brugere") return "users";
  return "home";
}

function navigate(path) {
  history.pushState({}, "", path);
  state.mobileMenu = false;
  if (path === "/orden/brugere" && state.user?.role === "system_admin") {
    loadUsers().catch((error) => { toast(error.message, "error"); render(); });
  } else {
    render();
  }
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

function brand() {
  return `<a class="brand" href="/orden" data-link><span class="brand-mark">OV</span><span><strong>Ordensvagt</strong><small>Stævneadministration</small></span></a>`;
}

function loginView() {
  if (!state.configured) {
    return `<main class="login-shell"><section class="login-card setup-card">${brand()}<div class="login-heading"><span class="eyebrow">Fase 1 er installeret</span><h1>Første administrator mangler</h1><p>Systemet er sikkert lukket for offentlig registrering. Den første administratorkonto oprettes direkte i den separate database.</p></div><div class="notice notice--info"><strong>Næste skridt</strong><span>Oplys det ønskede navn og den ønskede e-mail til den, der installerer systemet.</span></div></section></main>`;
  }
  return `<main class="login-shell">
    <section class="login-card">
      ${brand()}
      <div class="login-heading"><span class="eyebrow">Sikker administration</span><h1>Velkommen tilbage</h1><p>Log ind for at planlægge og afvikle ordensvagttjenesten.</p></div>
      <form id="login-form" class="form-stack">
        <label>E-mailadresse<input name="email" type="email" autocomplete="username" inputmode="email" required autofocus></label>
        <label>Adgangskode<input name="password" type="password" autocomplete="current-password" required></label>
        <p class="form-error" hidden></p>
        <button class="button button--primary button--large" type="submit">Log ind</button>
      </form>
      <p class="privacy-note">Personoplysninger behandles kun som led i stævneadministrationen.</p>
    </section>
    <aside class="login-visual"><div><span class="visual-kicker">Rolig koordinering</span><h2>Alt det vigtige samlet ét sted.</h2><p>Planlæg bemanding, følg fremmøde og bevar overblikket under hele stævnet.</p></div></aside>
  </main>`;
}

function eventTypeLabel(value) {
  return value === "regional" ? "Regionalstævne" : "Kredsstævne";
}

function navItem(path, label, icon, current, disabled = false) {
  if (disabled) return `<span class="nav-item is-disabled" aria-disabled="true">${icons[icon]}<span>${label}</span><small>Kommer senere</small></span>`;
  return `<a class="nav-item ${current === path ? "is-active" : ""}" href="${path}" data-link>${icons[icon]}<span>${label}</span></a>`;
}

function shell(content, pageTitle) {
  const current = location.pathname.replace(/\/+$/, "") || "/orden";
  const canManageUsers = state.user.role === "system_admin";
  const selector = state.user.eventTypes.length > 1
    ? `<label class="type-select"><span>Stævnetype</span><select id="event-type-select">${state.user.eventTypes.map((type) => `<option value="${type}" ${type === state.user.selectedEventType ? "selected" : ""}>${eventTypeLabel(type)}</option>`).join("")}</select></label>`
    : `<div class="type-pill">${eventTypeLabel(state.user.selectedEventType)}</div>`;
  return `<div class="app-shell ${state.mobileMenu ? "menu-open" : ""}">
    <button class="menu-backdrop" aria-label="Luk menu"></button>
    <aside class="sidebar">
      <div class="sidebar-top">${brand()}<button class="icon-button close-menu" aria-label="Luk menu">${icons.close}</button></div>
      <nav aria-label="Hovedmenu">
        ${navItem("/orden", "Forside", "home", current)}
        ${navItem("/orden/staevner", "Stævner", "calendar", current, true)}
        ${canManageUsers ? navItem("/orden/brugere", "Brugere", "users", current) : ""}
        ${navItem("/orden/grunddata", "Grundopsætning", "shield", current, true)}
      </nav>
      <div class="sidebar-footer"><div class="user-mini"><span>${escapeHtml(state.user.name.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(state.user.name)}</strong><small>${state.user.role === "system_admin" ? "Systemadministrator" : "Ordensansvarlig"}</small></div></div><button id="logout-button" class="nav-item nav-button">${icons.logout}<span>Log ud</span></button></div>
    </aside>
    <div class="main-column">
      <header class="topbar"><button class="icon-button open-menu" aria-label="Åbn menu">${icons.menu}</button><div><span class="topbar-label">Ordensvagttjeneste</span><strong>${escapeHtml(pageTitle)}</strong></div>${selector}</header>
      ${content}
    </div>
  </div>`;
}

function homeView() {
  const type = eventTypeLabel(state.user.selectedEventType).toLowerCase();
  return shell(`<main class="page page--home">
    <section class="hero-panel"><div><span class="eyebrow">${escapeHtml(eventTypeLabel(state.user.selectedEventType))}</span><h1>Goddag, ${escapeHtml(state.user.name.split(" ")[0])}</h1><p>Fundamentet er klar. Når næste fase åbnes, kan du oprette grunddata og begynde planlægningen.</p></div><div class="phase-badge"><span>Fase 1</span><strong>Fundament</strong><small>Aktiv og sikret</small></div></section>
    <section class="action-grid" aria-label="Stævnehandlinger">
      <article class="action-card action-card--primary"><div class="action-icon">${icons.calendar}</div><div><span class="eyebrow">Planlægning</span><h2>Opret nyt stævne</h2><p>Oprettelsesguiden bliver aktiveret i fase 3, når grundopsætningen er på plads.</p></div><button class="button button--muted" disabled>Tilgængelig i fase 3</button></article>
      <article class="action-card"><div class="action-icon">${icons.shield}</div><div><span class="eyebrow">Næste stævne</span><h2>Intet kommende ${escapeHtml(type)}</h2><p>Her vises det førstkommende stævne med direkte adgang til plan og dashboard.</p></div><span class="empty-chip">Ingen data endnu</span></article>
    </section>
    <section class="content-card"><div class="section-heading"><div><span class="eyebrow">Implementeringsstatus</span><h2>Et sikkert, separat fundament</h2></div></div><div class="status-grid"><div><span class="status-check">✓</span><strong>Sikker login</strong><p>Separate sessioner og beskyttelse mod misbrug.</p></div><div><span class="status-check">✓</span><strong>Rolleadgang</strong><p>Administrator og ordensansvarlig kontrolleres på serveren.</p></div><div><span class="status-check">✓</span><strong>Stævnetyper</strong><p>Kreds- og regionalstævner er adskilt fra begyndelsen.</p></div></div></section>
  </main>`, "Forside");
}

function roleLabel(role) {
  return role === "system_admin" ? "Systemadministrator" : "Ordensansvarlig";
}

function accessLabel(types) {
  if (types.length === 2) return "Kreds- og regionalstævner";
  return types[0] === "regional" ? "Regionalstævner" : "Kredsstævner";
}

function usersView() {
  return shell(`<main class="page">
    <section class="page-heading"><div><span class="eyebrow">Adgangskontrol</span><h1>Brugere</h1><p>Opret konti og bestem, hvilke stævnetyper den enkelte må administrere.</p></div><button id="show-create-user" class="button button--primary">+ Opret bruger</button></section>
    <section id="create-user-panel" class="content-card form-panel" hidden>
      <div class="section-heading"><div><h2>Ny brugerkonto</h2><p>Brugeren kan senere deaktiveres uden at historikken slettes.</p></div><button class="icon-button" id="hide-create-user" aria-label="Luk">${icons.close}</button></div>
      <form id="create-user-form" class="user-form">
        <label>Navn<input name="name" required minlength="2" maxlength="120"></label>
        <label>E-mailadresse<input name="email" type="email" required></label>
        <label>Midlertidig adgangskode<input name="password" type="password" minlength="12" required><small>Mindst 12 tegn med bogstaver og tal.</small></label>
        <label>Rolle<select name="role"><option value="order_responsible">Ordensansvarlig</option><option value="system_admin">Systemadministrator</option></select></label>
        <fieldset><legend>Adgang til stævnetyper</legend><label class="check-row"><input type="checkbox" name="eventTypes" value="circuit" checked><span>Kredsstævner</span></label><label class="check-row"><input type="checkbox" name="eventTypes" value="regional"><span>Regionalstævner</span></label></fieldset>
        <p class="form-error full-width" hidden></p><div class="form-actions full-width"><button type="button" class="button button--secondary" id="cancel-create-user">Annullér</button><button type="submit" class="button button--primary">Opret bruger</button></div>
      </form>
    </section>
    <section class="content-card users-card"><div class="section-heading"><div><h2>Brugerkonti</h2><p>${state.users.length} ${state.users.length === 1 ? "bruger" : "brugere"} i systemet</p></div></div><div class="user-list">${state.users.map((user) => `<article class="user-row ${user.active ? "" : "is-inactive"}" data-user-id="${user.id}"><span class="avatar">${escapeHtml(user.name.slice(0, 1).toUpperCase())}</span><div class="user-identity"><strong>${escapeHtml(user.name)}</strong><a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a></div><div class="user-meta"><span>${escapeHtml(roleLabel(user.role))}</span><small>${escapeHtml(accessLabel(user.eventTypes))}</small></div><span class="state-chip ${user.active ? "is-active" : ""}">${user.active ? "Aktiv" : "Deaktiveret"}</span><button class="button button--secondary edit-user" data-id="${user.id}">Redigér</button></article>`).join("")}</div></section>
    <section id="edit-user-panel" class="content-card form-panel" hidden></section>
  </main>`, "Brugere");
}

function editUserPanel(user) {
  return `<div class="section-heading"><div><h2>Redigér ${escapeHtml(user.name)}</h2><p>Tom adgangskode beholder den nuværende.</p></div><button class="icon-button" id="hide-edit-user" aria-label="Luk">${icons.close}</button></div><form id="edit-user-form" class="user-form" data-id="${user.id}"><label>Navn<input name="name" value="${escapeHtml(user.name)}" required></label><label>E-mailadresse<input name="email" type="email" value="${escapeHtml(user.email)}" required></label><label>Ny adgangskode<input name="password" type="password" minlength="12" placeholder="Behold nuværende"><small>Mindst 12 tegn med bogstaver og tal.</small></label><label>Rolle<select name="role"><option value="order_responsible" ${user.role === "order_responsible" ? "selected" : ""}>Ordensansvarlig</option><option value="system_admin" ${user.role === "system_admin" ? "selected" : ""}>Systemadministrator</option></select></label><fieldset><legend>Adgang til stævnetyper</legend><label class="check-row"><input type="checkbox" name="eventTypes" value="circuit" ${user.eventTypes.includes("circuit") ? "checked" : ""}><span>Kredsstævner</span></label><label class="check-row"><input type="checkbox" name="eventTypes" value="regional" ${user.eventTypes.includes("regional") ? "checked" : ""}><span>Regionalstævner</span></label></fieldset><label class="check-row active-toggle"><input type="checkbox" name="active" ${user.active ? "checked" : ""}><span>Kontoen er aktiv</span></label><p class="form-error full-width" hidden></p><div class="form-actions full-width"><button type="button" class="button button--secondary" id="cancel-edit-user">Annullér</button><button type="submit" class="button button--primary">Gem ændringer</button></div></form>`;
}

function render() {
  const current = route();
  if (!state.user) app.innerHTML = loginView();
  else if (current === "users" && state.user.role === "system_admin") app.innerHTML = usersView();
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
  element.textContent = error.message;
  element.hidden = false;
}

function setFormBusy(form, busy) {
  for (const element of form.elements) element.disabled = busy;
  form.classList.toggle("is-busy", busy);
}

function bindEvents() {
  document.querySelectorAll("[data-link]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); navigate(link.getAttribute("href")); }));
  document.querySelector(".open-menu")?.addEventListener("click", () => { state.mobileMenu = true; document.querySelector(".app-shell")?.classList.add("menu-open"); });
  const closeMenu = () => { state.mobileMenu = false; document.querySelector(".app-shell")?.classList.remove("menu-open"); };
  document.querySelector(".close-menu")?.addEventListener("click", closeMenu);
  document.querySelector(".menu-backdrop")?.addEventListener("click", closeMenu);
  document.querySelector("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true);
    try { const data = new FormData(form); const result = await endpoints.login(data.get("email"), data.get("password")); state.user = result.user; navigate("/orden"); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
  document.querySelector("#logout-button")?.addEventListener("click", async () => {
    try { await endpoints.logout(); } catch (error) { if (error.status !== 401) toast(error.message, "error"); }
    setCsrfToken(""); state.user = null; history.replaceState({}, "", "/orden/login"); render();
  });
  document.querySelector("#event-type-select")?.addEventListener("change", async (event) => {
    const previous = state.user.selectedEventType; const next = event.target.value; event.target.disabled = true;
    try { await endpoints.selectEventType(next); state.user.selectedEventType = next; render(); toast(`Skiftet til ${eventTypeLabel(next).toLowerCase()}.`); }
    catch (error) { state.user.selectedEventType = previous; render(); toast(error.message, "error"); }
  });
  const createPanel = document.querySelector("#create-user-panel");
  document.querySelector("#show-create-user")?.addEventListener("click", () => { createPanel.hidden = false; createPanel.scrollIntoView({ behavior: "smooth", block: "start" }); createPanel.querySelector("input")?.focus(); });
  const hideCreate = () => { if (createPanel) createPanel.hidden = true; };
  document.querySelector("#hide-create-user")?.addEventListener("click", hideCreate);
  document.querySelector("#cancel-create-user")?.addEventListener("click", hideCreate);
  document.querySelector("#create-user-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true);
    try { await endpoints.createUser(formPayload(form)); await loadUsers(); toast("Brugeren er oprettet."); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
  document.querySelectorAll(".edit-user").forEach((button) => button.addEventListener("click", () => {
    const user = state.users.find((item) => item.id === button.dataset.id); const panel = document.querySelector("#edit-user-panel"); panel.innerHTML = editUserPanel(user); panel.hidden = false; panel.scrollIntoView({ behavior: "smooth", block: "start" }); bindEditForm(panel);
  }));
}

function bindEditForm(panel) {
  const hide = () => { panel.hidden = true; panel.innerHTML = ""; };
  panel.querySelector("#hide-edit-user")?.addEventListener("click", hide);
  panel.querySelector("#cancel-edit-user")?.addEventListener("click", hide);
  panel.querySelector("#edit-user-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true);
    try { await endpoints.updateUser(form.dataset.id, formPayload(form, true)); await loadUsers(); toast("Ændringerne er gemt."); }
    catch (error) { showFormError(form, error); setFormBusy(form, false); }
  });
}

async function loadUsers() {
  const result = await endpoints.users(); state.users = result.users; render();
}

async function init() {
  try {
    const result = await endpoints.me(); state.user = result.user;
    if (route() === "users" && state.user.role === "system_admin") await loadUsers(); else render();
  } catch (error) {
    if (!(error instanceof ApiError) || ![401, 403].includes(error.status)) console.warn(error);
    try { const status = await endpoints.setupStatus(); state.configured = status.configured; } catch { state.configured = true; }
    state.user = null; if (route() !== "login") history.replaceState({}, "", "/orden/login"); render();
  }
}

window.addEventListener("popstate", () => { if (state.user && route() === "users" && !state.users.length) loadUsers().catch((error) => toast(error.message, "error")); else render(); });
init();
