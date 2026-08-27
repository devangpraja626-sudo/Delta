/* ===========================================================
   DELTA — frontend application logic
   Talks to the Express API on the same origin (/api/*).
=========================================================== */

const API = "/api";
const TOKEN_KEY = "delta_token";

const state = {
  user: null,        // { id, email, role, onboardingStage, isVerified }
  pendingRole: null,  // role chosen before/while signing up
};

// ---------- storage ----------
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ---------- fetch helper ----------
async function api(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(API + path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---------- toast ----------
let toastTimer;
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.style.display = "none"), 3200);
}

// ---------- modal ----------
const overlay = document.getElementById("modal-overlay");
const modalBox = document.getElementById("modal-box");

function openModal(html) {
  modalBox.innerHTML = `<button class="modal-close" id="modal-close-btn" aria-label="Close">✕</button>${html}`;
  overlay.hidden = false;
  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
}
function closeModal() {
  overlay.hidden = true;
  modalBox.innerHTML = "";
}
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

// ---------- view switching ----------
const landingView = document.getElementById("landing-view");
const appView = document.getElementById("app-view");

function showLanding() {
  landingView.style.display = "";
  appView.hidden = true;
  appView.innerHTML = "";
}
function showApp() {
  landingView.style.display = "none";
  appView.hidden = false;
}

/* ===========================================================
   AUTH
=========================================================== */

function renderAuthForm(mode = "signup", presetRole = null) {
  const isSignup = mode === "signup";
  openModal(`
    <div class="modal-eyebrow">${isSignup ? "Join Delta" : "Welcome back"}</div>
    <h2>${isSignup ? "Create your account" : "Sign in"}</h2>
    <div id="auth-error"></div>
    <form id="auth-form">
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="auth-email" placeholder="you@example.com" required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="auth-password" placeholder="At least 6 characters" minlength="6" required />
      </div>
      <button type="submit" class="btn form-submit">${isSignup ? "Continue" : "Sign in"}</button>
    </form>
    <div class="modal-foot">
      ${isSignup ? "Already have an account?" : "New to Delta?"}
      <button id="auth-switch">${isSignup ? "Sign in" : "Create an account"}</button>
    </div>
  `);

  document.getElementById("auth-switch").addEventListener("click", () =>
    renderAuthForm(isSignup ? "login" : "signup", presetRole)
  );

  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const errBox = document.getElementById("auth-error");
    errBox.innerHTML = "";

    try {
      const data = await api(isSignup ? "/auth/signup" : "/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(data.token);
      state.user = data.user;
      closeModal();
      await routeAfterAuth(presetRole);
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${err.message}</div>`;
    }
  });
}

// Decide what to show right after login/signup, based on onboarding progress
async function routeAfterAuth(presetRole) {
  const status = await api("/onboarding/status");
  state.user = { ...state.user, ...status };

  if (!status.role) {
    renderRoleStep(presetRole);
  } else if (status.onboardingStage === "profile_details") {
    renderProfileStep(status.role);
  } else if (status.onboardingStage === "id_verification") {
    renderIdStep();
  } else {
    showDashboard(status.role);
  }
}

/* ===========================================================
   ONBOARDING — Interface 1: role
=========================================================== */

function renderRoleStep(presetRole) {
  const roles = [
    { id: "founder", title: "Founder", desc: "I'm building something and want to pitch it, find capital and expertise." },
    { id: "investor", title: "Investor", desc: "I want to discover and back startups that fit my thesis." },
    { id: "consultant", title: "Consultant", desc: "I want to advise founders and offer my expertise." },
  ];

  openModal(`
    <div class="modal-eyebrow">Step 1 of 3</div>
    <h2>Who are you joining as?</h2>
    <div id="role-error"></div>
    <div class="role-pick">
      ${roles.map(r => `
        <button data-role="${r.id}" class="role-pick-btn">
          <strong>${r.title}</strong>
          <span>${r.desc}</span>
        </button>
      `).join("")}
    </div>
  `);

  modalBox.querySelectorAll(".role-pick-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const role = btn.dataset.role;
        const data = await api("/onboarding/role", { method: "POST", body: { role } });
        state.user.role = data.user.role;
        renderProfileStep(role);
      } catch (err) {
        document.getElementById("role-error").innerHTML = `<div class="form-error">${err.message}</div>`;
      }
    });
  });

  // If a role was preselected from the landing page, auto-submit it
  if (presetRole) {
    const match = modalBox.querySelector(`.role-pick-btn[data-role="${presetRole}"]`);
    if (match) match.click();
  }
}

/* ===========================================================
   ONBOARDING — Interface 2: profile details + vision
=========================================================== */

function renderProfileStep(role) {
  const roleFields = {
    founder: `
      <div class="form-row">
        <div class="form-group">
          <label>Startup name</label>
          <input type="text" id="f-startupName" placeholder="e.g. Nimbus" />
        </div>
        <div class="form-group">
          <label>Stage</label>
          <select id="f-stage">
            <option value="idea">Idea</option>
            <option value="mvp">MVP</option>
            <option value="early_traction">Early traction</option>
            <option value="growth">Growth</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Domain</label>
          <input type="text" id="f-domain" placeholder="e.g. Fintech, HealthTech" />
        </div>
        <div class="form-group">
          <label>Tech or non-tech</label>
          <select id="f-isTech">
            <option value="true">Tech startup</option>
            <option value="false">Non-tech startup</option>
          </select>
        </div>
      </div>`,
    consultant: `
      <div class="form-row">
        <div class="form-group">
          <label>Expertise areas (comma-separated)</label>
          <input type="text" id="c-expertise" placeholder="Marketing, Legal, Product" />
        </div>
        <div class="form-group">
          <label>Years of experience</label>
          <input type="number" id="c-years" min="0" />
        </div>
      </div>
      <div class="form-group">
        <label>Consultancy name (optional)</label>
        <input type="text" id="c-name" placeholder="e.g. Northstar Advisory" />
      </div>`,
    investor: `
      <div class="form-row">
        <div class="form-group">
          <label>Investor type</label>
          <select id="i-type">
            <option value="angel">Angel</option>
            <option value="vc">VC</option>
            <option value="family_office">Family office</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
        <div class="form-group">
          <label>Ticket size</label>
          <input type="text" id="i-ticket" placeholder="e.g. $10k - $50k" />
        </div>
      </div>
      <div class="form-group">
        <label>Preferred domains (comma-separated)</label>
        <input type="text" id="i-domains" placeholder="Fintech, EdTech, Tech, Non-Tech" />
      </div>`,
  };

  openModal(`
    <div class="modal-eyebrow">Step 2 of 3</div>
    <h2>Tell us about you</h2>
    <div id="profile-error"></div>
    <form id="profile-form">
      <div class="form-row">
        <div class="form-group">
          <label>Full name</label>
          <input type="text" id="p-fullName" required />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" id="p-phone" required />
        </div>
      </div>
      <div class="form-group">
        <label>Location</label>
        <input type="text" id="p-location" placeholder="City, Country" />
      </div>
      ${roleFields[role] || ""}
      <div class="form-group">
        <label>Your vision for joining Delta</label>
        <textarea id="p-vision" placeholder="What are you hoping to achieve here?" required></textarea>
      </div>
      <button type="submit" class="btn form-submit">Continue to ID verification</button>
    </form>
  `);

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errBox = document.getElementById("profile-error");
    errBox.innerHTML = "";

    const payload = {
      fullName: document.getElementById("p-fullName").value.trim(),
      phone: document.getElementById("p-phone").value.trim(),
      location: document.getElementById("p-location").value.trim(),
      vision: document.getElementById("p-vision").value.trim(),
    };

    if (role === "founder") {
      payload.founderDetails = {
        startupName: document.getElementById("f-startupName").value.trim(),
        stage: document.getElementById("f-stage").value,
        domain: document.getElementById("f-domain").value.trim(),
        isTechStartup: document.getElementById("f-isTech").value === "true",
      };
    } else if (role === "consultant") {
      payload.consultantDetails = {
        expertiseAreas: document.getElementById("c-expertise").value.split(",").map(s => s.trim()).filter(Boolean),
        yearsOfExperience: Number(document.getElementById("c-years").value) || 0,
        consultancyName: document.getElementById("c-name").value.trim(),
      };
    } else if (role === "investor") {
      payload.investorDetails = {
        investorType: document.getElementById("i-type").value,
        ticketSize: document.getElementById("i-ticket").value.trim(),
        preferredDomains: document.getElementById("i-domains").value.split(",").map(s => s.trim()).filter(Boolean),
      };
    }

    try {
      await api("/onboarding/profile", { method: "POST", body: payload });
      renderIdStep();
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${err.message}</div>`;
    }
  });
}

/* ===========================================================
   ONBOARDING — Interface 3: government ID proof
=========================================================== */

function renderIdStep() {
  openModal(`
    <div class="modal-eyebrow">Step 3 of 3</div>
    <h2>Verify your identity</h2>
    <p class="form-hint" style="margin-bottom:18px;">A valid government ID keeps every profile on Delta real.</p>
    <div id="id-error"></div>
    <form id="id-form">
      <div class="form-row">
        <div class="form-group">
          <label>ID type</label>
          <select id="id-type">
            <option value="passport">Passport</option>
            <option value="national_id">National ID</option>
            <option value="driving_license">Driving license</option>
            <option value="voter_id">Voter ID</option>
            <option value="aadhar">Aadhar</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>ID number</label>
          <input type="text" id="id-number" required />
        </div>
      </div>
      <div class="form-group">
        <label>Front of document</label>
        <input type="file" id="id-front" accept="image/*,.pdf" required />
      </div>
      <div class="form-group">
        <label>Back of document (optional)</label>
        <input type="file" id="id-back" accept="image/*,.pdf" />
      </div>
      <button type="submit" class="btn form-submit">Submit &amp; finish joining</button>
    </form>
  `);

  document.getElementById("id-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errBox = document.getElementById("id-error");
    errBox.innerHTML = "";

    const front = document.getElementById("id-front").files[0];
    if (!front) {
      errBox.innerHTML = `<div class="form-error">Front-side document is required</div>`;
      return;
    }

    const form = new FormData();
    form.append("idType", document.getElementById("id-type").value);
    form.append("idNumber", document.getElementById("id-number").value.trim());
    form.append("documentFront", front);
    const back = document.getElementById("id-back").files[0];
    if (back) form.append("documentBack", back);

    try {
      await api("/onboarding/id-verification", { method: "POST", body: form, isForm: true });
      const status = await api("/onboarding/status");
      state.user = { ...state.user, ...status };
      closeModal();
      if (status.onboardingStage === "completed") {
        toast("You're verified — welcome to Delta.");
        showDashboard(status.role);
      } else {
        toast("ID submitted. Your access will unlock once it's reviewed.");
        showLanding();
      }
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${err.message}</div>`;
    }
  });
}

/* ===========================================================
   DASHBOARDS
=========================================================== */

function appBar(role) {
  return `
    <div class="app-bar">
      <div class="app-bar-left">
        <div class="logo"><span class="mark"></span>DELTA</div>
        <span class="role-badge">${role}</span>
      </div>
      <button class="btn ghost small" id="logout-btn">Sign out</button>
    </div>
  `;
}

function showDashboard(role) {
  showApp();
  if (role === "founder") renderFounderDashboard();
  else if (role === "consultant") renderConsultantDashboard();
  else if (role === "investor") renderInvestorDashboard();

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearToken();
    state.user = null;
    showLanding();
    toast("Signed out.");
  });
}

function setTab(tabs, active, onSwitch) {
  const tabBar = document.querySelector(".tabs");
  tabBar.innerHTML = tabs.map(t =>
    `<button class="tab-btn ${t.id === active ? "active" : ""}" data-tab="${t.id}">${t.label}</button>`
  ).join("");
  tabBar.querySelectorAll(".tab-btn").forEach(btn =>
    btn.addEventListener("click", () => onSwitch(btn.dataset.tab))
  );
}

function resultCard({ title, meta, desc, actionLabel, onAction }) {
  const div = document.createElement("div");
  div.className = "result-item";
  div.innerHTML = `
    <h4>${title}</h4>
    <div class="result-meta">${meta}</div>
    <div class="result-desc">${desc}</div>
    <div class="result-actions">
      <button class="btn ghost small connect-btn">${actionLabel}</button>
    </div>
  `;
  div.querySelector(".connect-btn").addEventListener("click", onAction);
  return div;
}

async function connectWith(userId) {
  try {
    await api("/connections/request", { method: "POST", body: { recipientId: userId } });
    toast("Connection request sent.");
  } catch (err) {
    toast(err.message);
  }
}

/* ---------- Founder dashboard ---------- */

function renderFounderDashboard() {
  appView.innerHTML = `
    ${appBar("founder")}
    <div class="tabs"></div>
    <div class="app-panel" id="panel"></div>
  `;
  document.getElementById("logout-btn"); // ensures element exists before listener attach below
  const tabs = [
    { id: "pitch", label: "My pitches" },
    { id: "investors", label: "Search investors" },
    { id: "consultants", label: "Search consultants" },
    { id: "portfolio", label: "Portfolio / resume" },
  ];
  let active = "pitch";
  const switchTo = (id) => { active = id; setTab(tabs, active, switchTo); renderFounderPanel(id); };
  setTab(tabs, active, switchTo);
  renderFounderPanel(active);

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearToken(); state.user = null; showLanding(); toast("Signed out.");
  });
}

async function renderFounderPanel(tab) {
  const panel = document.getElementById("panel");

  if (tab === "pitch") {
    panel.innerHTML = `
      <div class="app-grid">
        <div class="panel-card">
          <h3>Pitch a new idea</h3>
          <form id="pitch-form">
            <div class="form-group"><label>Startup name</label><input type="text" id="pf-name" required /></div>
            <div class="form-group"><label>Tagline</label><input type="text" id="pf-tagline" /></div>
            <div class="form-group"><label>Description</label><textarea id="pf-desc" required></textarea></div>
            <div class="form-row">
              <div class="form-group"><label>Domain</label><input type="text" id="pf-domain" required /></div>
              <div class="form-group"><label>Stage</label>
                <select id="pf-stage">
                  <option value="idea">Idea</option><option value="mvp">MVP</option>
                  <option value="early_traction">Early traction</option><option value="growth">Growth</option>
                </select>
              </div>
            </div>
            <div class="form-group"><label>Tech or non-tech</label>
              <select id="pf-tech"><option value="true">Tech</option><option value="false">Non-tech</option></select>
            </div>
            <div class="form-group"><label>Funding ask</label><input type="text" id="pf-ask" placeholder="e.g. $100k for 10%" /></div>
            <button type="submit" class="btn form-submit">Publish pitch</button>
          </form>
        </div>
        <div class="panel-card">
          <h3>Your pitches</h3>
          <div class="result-list" id="my-pitches"><div class="empty-state">Loading…</div></div>
        </div>
      </div>
    `;

    document.getElementById("pitch-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api("/founder/pitch", { method: "POST", body: {
          startupName: document.getElementById("pf-name").value.trim(),
          tagline: document.getElementById("pf-tagline").value.trim(),
          description: document.getElementById("pf-desc").value.trim(),
          domain: document.getElementById("pf-domain").value.trim(),
          stage: document.getElementById("pf-stage").value,
          isTechStartup: document.getElementById("pf-tech").value === "true",
          fundingAsk: document.getElementById("pf-ask").value.trim(),
        }});
        toast("Pitch published.");
        e.target.reset();
        loadMyPitches();
      } catch (err) { toast(err.message); }
    });

    loadMyPitches();
  }

  if (tab === "investors" || tab === "consultants") {
    const isInv = tab === "investors";
    panel.innerHTML = `
      <div class="panel-card" style="margin-bottom:22px;">
        <h3>Search ${isInv ? "investors" : "consultants"}</h3>
        <div class="filter-row">
          <input type="text" id="search-q" placeholder="Keyword" />
          <input type="text" id="search-domain" placeholder="${isInv ? "Domain" : "Expertise"}" />
          <button class="btn small" id="search-btn">Search</button>
        </div>
      </div>
      <div class="result-list" id="search-results"><div class="empty-state">Enter a filter and search.</div></div>
    `;
    document.getElementById("search-btn").addEventListener("click", () => runSearch(isInv ? "investors" : "consultants", "/founder"));
  }

  if (tab === "portfolio") renderPortfolioForm(panel, "/founder/portfolio");
}

async function loadMyPitches() {
  const list = document.getElementById("my-pitches");
  try {
    const { pitches } = await api("/founder/pitch/mine");
    if (!pitches.length) { list.innerHTML = `<div class="empty-state">No pitches yet — publish your first one.</div>`; return; }
    list.innerHTML = "";
    pitches.forEach(p => {
      const div = document.createElement("div");
      div.className = "result-item";
      div.innerHTML = `
        <h4>${p.startupName}</h4>
        <div class="result-meta">${p.domain} · ${p.stage.replace("_"," ")} · ${p.isTechStartup ? "Tech" : "Non-tech"} · ${p.views} views</div>
        <div class="result-desc">${p.tagline || p.description.slice(0, 120)}</div>
      `;
      list.appendChild(div);
    });
  } catch (err) { list.innerHTML = `<div class="empty-state">${err.message}</div>`; }
}

async function runSearch(kind, basePath) {
  const results = document.getElementById("search-results");
  results.innerHTML = `<div class="empty-state">Searching…</div>`;
  const q = document.getElementById("search-q").value.trim();
  const domainVal = document.getElementById("search-domain").value.trim();
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (domainVal) params.set(kind === "investors" ? "domain" : "expertise", domainVal);

  try {
    const data = await api(`${basePath}/search/${kind}?${params.toString()}`);
    const items = data.investors || data.consultants || [];
    if (!items.length) { results.innerHTML = `<div class="empty-state">No matches. Try a broader search.</div>`; return; }
    results.innerHTML = "";
    items.forEach(profile => {
      const detail = kind === "investors"
        ? `${profile.investorDetails?.investorType || "investor"} · ${(profile.investorDetails?.preferredDomains || []).join(", ") || "any domain"}`
        : `${(profile.consultantDetails?.expertiseAreas || []).join(", ") || "generalist"} · ${profile.consultantDetails?.yearsOfExperience || 0} yrs`;
      results.appendChild(resultCard({
        title: profile.fullName,
        meta: detail,
        desc: profile.vision?.slice(0, 140) || "",
        actionLabel: "Connect",
        onAction: () => connectWith(profile.user._id || profile.user),
      }));
    });
  } catch (err) { results.innerHTML = `<div class="empty-state">${err.message}</div>`; }
}

function renderPortfolioForm(panel, path) {
  panel.innerHTML = `
    <div class="panel-card">
      <h3>Portfolio / résumé</h3>
      <form id="portfolio-form">
        <div class="form-group"><label>Headline</label><input type="text" id="pt-headline" placeholder="e.g. Product-focused founder" /></div>
        <div class="form-group"><label>Summary</label><textarea id="pt-summary"></textarea></div>
        <div class="form-group"><label>Skills (comma-separated)</label><input type="text" id="pt-skills" /></div>
        <button type="submit" class="btn form-submit">Save</button>
      </form>
    </div>
  `;
  document.getElementById("portfolio-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api(path, { method: "PUT", body: {
        type: "portfolio",
        headline: document.getElementById("pt-headline").value.trim(),
        summary: document.getElementById("pt-summary").value.trim(),
        skills: document.getElementById("pt-skills").value.split(",").map(s => s.trim()).filter(Boolean),
      }});
      toast("Saved.");
    } catch (err) { toast(err.message); }
  });
}

/* ---------- Consultant dashboard ---------- */

function renderConsultantDashboard() {
  appView.innerHTML = `${appBar("consultant")}<div class="tabs"></div><div class="app-panel" id="panel"></div>`;
  const tabs = [
    { id: "founders", label: "Search founders" },
    { id: "consultancy", label: "My consultancy" },
    { id: "investors", label: "Search investors" },
    { id: "resume", label: "Resume" },
  ];
  let active = "founders";
  const switchTo = (id) => { active = id; setTab(tabs, active, switchTo); renderConsultantPanel(id); };
  setTab(tabs, active, switchTo);
  renderConsultantPanel(active);

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearToken(); state.user = null; showLanding(); toast("Signed out.");
  });
}

async function renderConsultantPanel(tab) {
  const panel = document.getElementById("panel");

  if (tab === "founders") {
    panel.innerHTML = `
      <div class="panel-card" style="margin-bottom:22px;">
        <h3>Search founders</h3>
        <div class="filter-row">
          <input type="text" id="search-q" placeholder="Keyword" />
          <input type="text" id="search-domain" placeholder="Domain" />
          <button class="btn small" id="search-founders-btn">Search</button>
        </div>
      </div>
      <div class="result-list" id="search-results"><div class="empty-state">Enter a filter and search.</div></div>
    `;
    document.getElementById("search-founders-btn").addEventListener("click", async () => {
      const results = document.getElementById("search-results");
      results.innerHTML = `<div class="empty-state">Searching…</div>`;
      const q = document.getElementById("search-q").value.trim();
      const domainVal = document.getElementById("search-domain").value.trim();
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (domainVal) params.set("domain", domainVal);
      try {
        const { founders } = await api(`/consultant/search/founders?${params.toString()}`);
        if (!founders.length) { results.innerHTML = `<div class="empty-state">No matches.</div>`; return; }
        results.innerHTML = "";
        founders.forEach(p => {
          results.appendChild(resultCard({
            title: p.startupName,
            meta: `${p.domain} · ${p.stage.replace("_"," ")} · ${p.isTechStartup ? "Tech" : "Non-tech"}`,
            desc: p.tagline || p.description.slice(0, 140),
            actionLabel: "Connect",
            onAction: () => connectWith(p.founder._id || p.founder),
          }));
        });
      } catch (err) { results.innerHTML = `<div class="empty-state">${err.message}</div>`; }
    });
  }

  if (tab === "consultancy") {
    panel.innerHTML = `
      <div class="panel-card">
        <h3>Create your consultancy</h3>
        <form id="consultancy-form">
          <div class="form-group"><label>Name</label><input type="text" id="cy-name" required /></div>
          <div class="form-group"><label>Description</label><textarea id="cy-desc"></textarea></div>
          <div class="form-group"><label>Services offered (comma-separated)</label><input type="text" id="cy-services" placeholder="Legal, Fundraising, Product" /></div>
          <div class="form-group"><label>Domains focus (comma-separated)</label><input type="text" id="cy-domains" placeholder="Fintech, HealthTech" /></div>
          <button type="submit" class="btn form-submit">Create consultancy</button>
        </form>
      </div>
      <div class="panel-card" style="margin-top:22px;">
        <h3>Your consultancies</h3>
        <div class="result-list" id="my-consultancies"><div class="empty-state">Loading…</div></div>
      </div>
    `;
    document.getElementById("consultancy-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api("/consultant/consultancy", { method: "POST", body: {
          name: document.getElementById("cy-name").value.trim(),
          description: document.getElementById("cy-desc").value.trim(),
          servicesOffered: document.getElementById("cy-services").value.split(",").map(s => s.trim()).filter(Boolean),
          domainsFocus: document.getElementById("cy-domains").value.split(",").map(s => s.trim()).filter(Boolean),
        }});
        toast("Consultancy created.");
        e.target.reset();
        loadMyConsultancies();
      } catch (err) { toast(err.message); }
    });
    loadMyConsultancies();
  }

  if (tab === "investors") {
    panel.innerHTML = `
      <div class="panel-card" style="margin-bottom:22px;">
        <h3>Search investors</h3>
        <div class="filter-row">
          <input type="text" id="search-q" placeholder="Keyword" />
          <input type="text" id="search-domain" placeholder="Domain" />
          <button class="btn small" id="search-btn">Search</button>
        </div>
      </div>
      <div class="result-list" id="search-results"><div class="empty-state">Enter a filter and search.</div></div>
    `;
    document.getElementById("search-btn").addEventListener("click", () => runSearch("investors", "/consultant"));
  }

  if (tab === "resume") renderPortfolioForm(panel, "/consultant/resume");
}

async function loadMyConsultancies() {
  const list = document.getElementById("my-consultancies");
  try {
    const { consultancy } = await api("/consultant/consultancy/mine");
    if (!consultancy.length) { list.innerHTML = `<div class="empty-state">No consultancy yet.</div>`; return; }
    list.innerHTML = "";
    consultancy.forEach(c => {
      const div = document.createElement("div");
      div.className = "result-item";
      div.innerHTML = `<h4>${c.name}</h4><div class="result-meta">${(c.servicesOffered||[]).join(", ")}</div><div class="result-desc">${c.description||""}</div>`;
      list.appendChild(div);
    });
  } catch (err) { list.innerHTML = `<div class="empty-state">${err.message}</div>`; }
}

/* ---------- Investor dashboard ---------- */

function renderInvestorDashboard() {
  appView.innerHTML = `${appBar("investor")}<div class="tabs"></div><div class="app-panel" id="panel"></div>`;
  const tabs = [
    { id: "startups", label: "Search startups" },
    { id: "consultants", label: "Search consultants" },
  ];
  let active = "startups";
  const switchTo = (id) => { active = id; setTab(tabs, active, switchTo); renderInvestorPanel(id); };
  setTab(tabs, active, switchTo);
  renderInvestorPanel(active);

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearToken(); state.user = null; showLanding(); toast("Signed out.");
  });
}

async function renderInvestorPanel(tab) {
  const panel = document.getElementById("panel");

  if (tab === "startups") {
    panel.innerHTML = `
      <div class="panel-card" style="margin-bottom:22px;">
        <h3>Search startups by preference</h3>
        <div class="filter-row">
          <input type="text" id="s-q" placeholder="Keyword" />
          <input type="text" id="s-domain" placeholder="Domain (e.g. Fintech)" />
          <select id="s-tech">
            <option value="">Tech or non-tech</option>
            <option value="true">Tech only</option>
            <option value="false">Non-tech only</option>
          </select>
          <select id="s-stage">
            <option value="">Any stage</option>
            <option value="idea">Idea</option>
            <option value="mvp">MVP</option>
            <option value="early_traction">Early traction</option>
            <option value="growth">Growth</option>
          </select>
          <button class="btn small" id="s-btn">Search</button>
        </div>
      </div>
      <div class="result-list" id="search-results"><div class="empty-state">Set your preferences and search.</div></div>
    `;
    document.getElementById("s-btn").addEventListener("click", async () => {
      const results = document.getElementById("search-results");
      results.innerHTML = `<div class="empty-state">Searching…</div>`;
      const params = new URLSearchParams();
      const q = document.getElementById("s-q").value.trim();
      const domainVal = document.getElementById("s-domain").value.trim();
      const tech = document.getElementById("s-tech").value;
      const stage = document.getElementById("s-stage").value;
      if (q) params.set("q", q);
      if (domainVal) params.set("domain", domainVal);
      if (tech) params.set("isTechStartup", tech);
      if (stage) params.set("stage", stage);

      try {
        const { startups } = await api(`/investor/search/startups?${params.toString()}`);
        if (!startups.length) { results.innerHTML = `<div class="empty-state">No startups match yet — widen your filters.</div>`; return; }
        results.innerHTML = "";
        startups.forEach(p => {
          results.appendChild(resultCard({
            title: p.startupName,
            meta: `${p.domain} · ${p.stage.replace("_"," ")} · ${p.isTechStartup ? "Tech" : "Non-tech"} · ${p.views} views`,
            desc: p.tagline || p.description.slice(0, 140),
            actionLabel: "Connect",
            onAction: () => connectWith(p.founder._id || p.founder),
          }));
        });
      } catch (err) { results.innerHTML = `<div class="empty-state">${err.message}</div>`; }
    });
  }

  if (tab === "consultants") {
    panel.innerHTML = `
      <div class="panel-card" style="margin-bottom:22px;">
        <h3>Search consultants</h3>
        <div class="filter-row">
          <input type="text" id="search-q" placeholder="Keyword" />
          <input type="text" id="search-domain" placeholder="Expertise" />
          <button class="btn small" id="search-btn">Search</button>
        </div>
      </div>
      <div class="result-list" id="search-results"><div class="empty-state">Enter a filter and search.</div></div>
    `;
    document.getElementById("search-btn").addEventListener("click", () => runSearch("consultants", "/investor"));
  }
}

/* ===========================================================
   PAGE ENTRY
=========================================================== */

function bindLandingButtons() {
  document.getElementById("signin-btn").addEventListener("click", (e) => {
    e.preventDefault();
    renderAuthForm("login");
  });
  document.getElementById("getstarted-btn").addEventListener("click", (e) => {
    e.preventDefault();
    renderAuthForm("signup");
  });
  document.querySelectorAll(".role-enter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      renderAuthForm("signup", btn.dataset.role);
    });
  });
}

async function boot() {
  bindLandingButtons();

  if (!getToken()) { showLanding(); return; }

  try {
    const me = await api("/auth/me");
    state.user = me.user;
    const status = await api("/onboarding/status");
    state.user = { ...state.user, ...status };

    if (!status.role || status.onboardingStage !== "completed") {
      showLanding();
      toast("Pick up where you left off — continue joining Delta.");
    } else {
      showDashboard(status.role);
    }
  } catch (err) {
    clearToken();
    showLanding();
  }
}

document.addEventListener("DOMContentLoaded", boot);
