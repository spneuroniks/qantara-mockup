/* Services 8 to 14, and 18, on one pattern: a short intake with named checks and disclosures, then the shared case engine. */
Q.PARTNERS.push(
  { id: "p-crest", name: "Crestline Fiduciary", type: "Licensed corporate service provider", licence: "CSP-1180", validDays: 260 },
  { id: "p-alreem", name: "Al Reem Legal", type: "Law firm", licence: "LF-2041", validDays: 320 },
  { id: "p-bayt", name: "Bayt Law", type: "Law firm", licence: "LF-1177", validDays: 190 },
  { id: "p-corniche", name: "Corniche Advocates", type: "Law firm", licence: "LF-3302", validDays: 90 },
  { id: "p-meridian", name: "Meridian Citizenship Agents", type: "Licensed citizenship agent", licence: "CA-0450", validDays: 240 },
  { id: "p-certa", name: "Certa ICV Certifiers", type: "ICV certifying body", licence: "ICV-CB-12", validDays: 280 },
  { id: "p-isocert", name: "Summit Certification", type: "Certification body (unrelated)", licence: "CB-7781", validDays: 400 },
  { id: "p-mark", name: "Markwell Trademark Agents", type: "Registered trademark agent", licence: "TMA-0931", validDays: 330 },
  { id: "p-northlab", name: "Northgate Testing", type: "Product testing body", licence: "TB-4410", validDays: 300 },
  { id: "p-pixel", name: "Pixel and Palm Agency", type: "Marketing agency", licence: "MA-6120", validDays: 200 });
const MORE = Object.keys(Q.SVC);
const mdraft = (svc) => { const d = Q.state.mdraft; if (d && d.svc === svc) return d; return (Q.state.mdraft = { svc, companyId: "", route: Q.SVC[svc].routes.length === 1 ? Q.SVC[svc].routes[0] : "", v: {}, step: 0, ack: false, err: "" }); };
const fieldInput = (id, type, val) => (Array.isArray(type) ? `<select id="${id}"><option value="">Choose</option>${type.map((o) => `<option ${val === o ? "selected" : ""}>${Q.esc(o)}</option>`).join("")}</select>` : type === "yesno" ? `<select id="${id}"><option value="">Choose</option><option value="yes" ${val === "yes" ? "selected" : ""}>Yes</option><option value="no" ${val === "no" ? "selected" : ""}>No</option></select>` : `<input id="${id}" ${type === "number" ? `type="number" min="0"` : ""} value="${Q.esc(val == null ? "" : val)}">`);
const say = (v) => (v === "yes" ? "Yes" : v === "no" ? "No" : /^\d{5,}$/.test(v) ? Number(v).toLocaleString("en-US") : v);
const moreRoute = (d) => (Q.SVC[d.svc].routeOf ? Q.SVC[d.svc].routeOf(d.v) : d.route);

/* Services 8 to 14 start with the same short wizard: choose, a few facts, checks and cost, check and send. */
const mSteps = (svc) => { const S = Q.SVC[svc], needsCo = Q.ROUTES[S.routes[0]].needsCompany, multi = S.routes.length > 1; return (needsCo || multi ? [["pick", needsCo && multi ? "Company and option" : needsCo ? "Company" : "Option"]] : []).concat([["facts", "A few facts"], ["checks", "Checks and cost"], ["send", "Check and send"]]); };
Q.screens.start = (svc) => {
  const S = Q.SVC[svc]; if (!S) return notFound("services");
  const d = mdraft(svc), needsCo = Q.ROUTES[S.routes[0]].needsCompany, cos = visaCompanies(), co = d.companyId ? Q.getCase(d.companyId) : null;
  if (needsCo && !cos.length) return Q.shell("s" + svc, `<div class="crumbs"><a href="#/services">Services</a> / ${Q.esc(S.title)}</div><h1>${Q.esc(S.title)}</h1><div class="note warn">This service is for a licensed mainland or free zone company. You do not have one yet.</div><a class="btn" href="#/services/01" style="justify-self:start">Set up a company first</a>`);
  const steps = mSteps(svc); if (d.step >= steps.length) d.step = 0;
  const key = steps[d.step][0], r0 = Q.ROUTES[d.route], r = Q.ROUTES[moreRoute(d)] || r0, at = (k) => steps.findIndex((x) => x[0] === k);
  const checks = key === "checks" || key === "send" ? r.checks(d.v, co) : [], ok = checks.every(([, x]) => x);
  const quote = key === "checks" ? Object.assign(Q.buildQuote(moreRoute(d)), r.govFor ? { gov: r.govFor(d.v) } : {}) : null;
  const panes = {
    pick: () => `${needsCo ? `<div class="stack-s"><h2>Which company is this for?</h2></div><div class="grid2">${cos.map((c) => `<button class="choice ${c.id === d.companyId ? "on" : ""}" data-act="mPick" data-k="companyId" data-id="${c.id}"><h3>${Q.esc(c.company)}</h3><p class="small muted">Licence ${Q.esc(c.licence.no)} · details and documents carry over</p></button>`).join("")}</div>` : ""}
      ${S.routes.length > 1 ? `<div class="stack-s"><h2>What do you need?</h2></div><div class="grid2">${S.routes.map((id) => { const x = Q.ROUTES[id]; return `<button class="choice ${id === d.route ? "on" : ""}" data-act="mPick" data-k="route" data-id="${id}"><h3>${Q.esc(x.name)}</h3><p class="small muted">${Q.esc(x.pick)}</p><dl><dt>Qantara fee</dt><dd class="num">${svc === "10" ? "Quoted after the pre-screen" : Q.aed(x.qFee) + " + VAT"}</dd><dt>Estimate</dt><dd>${x.days[0]}–${x.days[1]} working days</dd><dt>Delivered by</dt><dd>${Q.esc(x.by)}</dd></dl></button>`; }).join("")}</div>` : ""}`,
    facts: () => `<div class="card"><h2>A few facts to start</h2>${r0.fields.map(([id, label, type]) => `<label>${Q.esc(label)}${fieldInput("m-" + id, type, d.v[id])}</label>`).join("")}</div>`,
    checks: () => `<div class="grid2"><div class="card"><h2>Checks before we start</h2><div class="stack-s">${checks.map(([label, pass]) => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${Q.tag(pass ? "Pass" : "Fail", pass ? "ok" : "bad")}<span>${Q.esc(label)}</span></div>`).join("")}</div>
          ${ok ? "" : `<div class="note bad">This request cannot go on while a check fails. Go back to change an answer, or message your adviser.</div>`}<p class="small"><b>Delivered by:</b> ${Q.esc(r.by)}</p></div>
        <div class="card"><h2>${svc === "10" ? "Cost" : "Estimated cost"}</h2>${svc === "10" ? `<p class="muted">No fee is quoted until the pre-screen is done.</p>` : Q.quoteTable({ route: moreRoute(d), quote })}</div></div>`,
    send: () => `<div class="card"><h2>Check your answers</h2><table>${co ? `<tr><td class="muted">Company</td><td>${Q.esc(co.company)}</td><td class="right"><button class="btn link" data-act="mGo" data-s="${at("pick")}">Change</button></td></tr>` : ""}
          <tr><td class="muted">Request</td><td>${Q.esc(r.name)}</td><td class="right">${S.routes.length > 1 ? `<button class="btn link" data-act="mGo" data-s="${at("pick")}">Change</button>` : ""}</td></tr>
          ${r0.fields.map(([id, label]) => `<tr><td class="muted">${Q.esc(label)}</td><td>${Q.esc(say(d.v[id]))}</td><td class="right"><button class="btn link" data-act="mGo" data-s="${at("facts")}">Change</button></td></tr>`).join("")}</table></div>
      <div class="card"><h3>Please read</h3><ul style="margin:0;padding-left:18px">${r.disclose.map((x) => `<li>${Q.esc(x)}</li>`).join("")}</ul>
        <label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="m-ack" type="checkbox" style="width:auto;margin-top:4px"><span>I have read and understood these points, and that durations are estimates and the authority or body named decides.</span></label></div>`,
  };
  const why = { pick: "Your company's details and documents carry over, so they are not asked for again.", facts: "These answers decide which checks apply and which documents are needed.", checks: "The checks run before anything is sent, so a request that cannot succeed stops here, at no cost.", send: "This is what Qantara will receive. Use Change to correct anything." }[key];
  return Q.wiz({ active: "s" + svc, svc, title: S.title, steps: steps.map((x) => x[1]), step: d.step, body: panes[key](), err: d.err, back: "mBack", next: key === "send" ? "mSend" : "mNext", cancel: "mCancel", disabled: (key === "checks" || key === "send") && !ok, why });
};
const mRead = (d) => { const r = Q.ROUTES[d.route]; if (r) r.fields.forEach(([id]) => { const el = document.getElementById("m-" + id); if (el) d.v[id] = el.value.trim(); }); };
const mStay = () => { Q.save(); Q.render(); };
Q.actions.mPick = (x) => { const d = Q.state.mdraft; d[x.k] = x.id; d.err = ""; mStay(); };
Q.actions.mCancel = () => { Q.state.mdraft = null; Q.save(); Q.go("#/services"); };
Q.actions.mBack = () => { const d = Q.state.mdraft; mRead(d); d.err = ""; d.step = Math.max(0, d.step - 1); mStay(); };
Q.actions.mGo = (x) => { const d = Q.state.mdraft; d.err = ""; d.step = Math.max(0, Number(x.s) || 0); mStay(); };
Q.actions.mNext = () => {
  const d = Q.state.mdraft, steps = mSteps(d.svc), key = steps[d.step][0], r = Q.ROUTES[d.route]; mRead(d);
  d.err = key === "pick" ? (r && r.needsCompany && !visaCompanies().some((c) => c.id === d.companyId) ? "Choose the company." : !r ? "Choose what you need." : "")
    : key === "facts" ? (r.fields.some(([id]) => !d.v[id]) ? "Answer every question." : "")
    // Fail closed: a failing check stops the wizard here.
    : key === "checks" ? (Q.ROUTES[moreRoute(d)].checks(d.v, d.companyId ? Q.getCase(d.companyId) : null).every(([, ok]) => ok) ? "" : "A check is failing, so this request cannot go on.") : "";
  if (!d.err) d.step++;
  mStay();
};
Q.actions.mSend = () => {
  const d = Q.state.mdraft, u = Q.user(), routeId = moreRoute(d), r = Q.ROUTES[routeId], co = d.companyId ? myCompany(d.companyId) : null;
  // Fail closed: re-run the checks at the moment of sending.
  if (r.needsCompany && !co) throw new Error("No company for this request.");
  if (!r.checks(d.v, co).every(([, ok]) => ok)) { d.err = "A check is failing, so this request cannot be sent."; return mStay(); }
  if (!document.getElementById("m-ack").checked) { d.err = "Tick the box to confirm you have read the points above."; return mStay(); }
  if (co && Q.byService(r.service).some((c) => c.companyCase === co.id && c.route === routeId && c.status === "open")) { d.err = "This company already has an open case for this service."; return mStay(); }
  const q = Q.buildQuote(routeId); if (r.govFor) q.gov = r.govFor(d.v);
  const c = Q.newCase({ service: r.service, companyCase: co ? co.id : null, clientId: u.id, clientName: u.name, company: co ? co.company : u.name, route: routeId, activity: co ? co.activity : "S-7020", owners: co ? co.owners : [{ name: u.name, kind: "person", pct: 100, nationality: "" }], visas: 0, quote: q,
    // A route with no identity step of its own relies on the company's approved identity file.
    kyc: co && !r.steps.some((s) => s.type === "kyc") ? Object.assign({}, co.kyc) : { screening: null, risk: null, approvedBy: null },
    intake: Object.assign({}, d.v), ackOn: Q.day(), docs: r.docs(d.v, co, u).map(([title, forWho], i) => ({ id: "m" + i, title, forWho, status: "missing" })) });
  Q.log(c, "Asked Qantara for: " + r.name + ". Read and accepted " + r.disclose.length + " disclosure(s)"); Q.state.cases.unshift(c); Q.state.mdraft = null; Q.save(); Q.go("#/sent/" + c.id);
};

/* ---- Shared case-screen pieces for these services ---- */
MORE.forEach((svc) => {
  Q.packText[svc] = "for this request. Anything already on file is not asked for again";
  Q.about[svc] = (c) => { const r = Q.ROUTES[c.route]; return `<div class="card"><h3>About this request</h3><table>${r.fields.map(([id, label]) => `<tr><td class="muted small">${Q.esc(label)}</td><td class="small">${Q.esc(say(c.intake[id]))}</td></tr>`).join("")}</table>
    <div class="stack-s small"><div><span class="muted">Delivered by</span><br>${Q.esc(r.by)}</div><div><span class="muted">Estimate</span><br>${r.days[0]}–${r.days[1]} working days. A range, not a promise.</div>${c.formSummary ? `<div><span class="muted">${svc === "11" ? "Workbook result" : "Assessment"}</span><br>${c.formSummary.map(([l, v]) => Q.esc(l + ": " + v)).join("<br>")}</div>` : ""}</div>
    ${r.warn && c.status === "open" ? `<div class="note bad"><b>Standing warning.</b> Until the licence is issued, ${Q.esc(c.company)} ${Q.esc(r.warn)}.</div>` : ""}</div>`; };
  Q.doneNote[svc] = (c) => `<div class="note ok">${Q.esc(Q.ROUTES[c.route].name)}: ${Q.esc(c.licence.label || "Licence")} ${Q.esc(c.licence.no)} is on record${c.licence.expires ? ", valid to " + Q.fmtDate(c.licence.expires) + ". The renewal is on your compliance calendar" : ""}.</div>`;
  Q.forms[svc] = (c) => { const f = Q.ROUTES[c.route].form; return `<p>${Q.esc(f.intro)}</p>${f.fields.map(([id, label, type]) => `<label>${Q.esc(label)}${fieldInput("f-" + id, type, "")}</label>`).join("")}<div id="act-err"></div><div><button class="btn" data-act="mForm" data-id="${c.id}">Save</button></div>`; };
});
Q.actions.mForm = (d) => {
  const c0 = myCase(d.id), f = Q.ROUTES[c0.route].form, vals = {}, bad = (m) => { document.getElementById("act-err").innerHTML = `<div class="note bad">${Q.esc(m)}</div>`; };
  for (const [id, , type] of f.fields) { const raw = Q.val("f-" + id); if (raw === "") return bad("Fill in every line."); vals[id] = type === "number" ? Number(raw) : raw; }
  const problem = f.check(vals); if (problem) return bad(problem);
  act((c) => { c.formData = vals; c.formSummary = f.summary(vals); Q.log(c, "Completed: " + Q.cur(c).title); Q.advance(c); })(d);
};
const reportXb = Q.reportBody;
Q.reportBody = (c) => (!MORE.includes(c.service) ? reportXb(c) : `<p>These are the figures that go to the certifying body. Approve them by typing your full name. You confirm you are authorised to sign for ${Q.esc(c.company)}.</p><table>${c.formSummary.map(([l, v], i, a) => `<tr ${i === a.length - 1 ? `class="total"` : ""}><td>${Q.esc(l)}</td><td class="right num">${Q.esc(v)}</td></tr>`).join("")}</table>`);
const sectorChecks = Q.runPackChecks;
Q.runPackChecks = (c) => {
  if (!MORE.includes(c.service)) return sectorChecks(c);
  const r = Q.ROUTES[c.route], co = c.companyCase ? Q.getCase(c.companyCase) : null;
  c.checks = r.checks(c.intake, co).concat([["Every document on the list is accepted", c.docs.every((d) => d.status === "accepted")]]);
  if (c.formSummary) c.checks.push([c.service === "11" ? "Workbook totals agree with the audited statements" : "Every gap has an owner and a date", true]);
  const fails = c.checks.filter(([, ok]) => !ok).length;
  c.kyc.screening = fails ? fails + " check(s) failing" : "All " + c.checks.length + " checks pass"; c.kyc.risk = fails ? "High" : "Low"; Q.log(c, "Ran the checks: " + c.kyc.screening);
};
/* Recording a certificate, registration or number closes the case and feeds the calendar. */
Q.certForm = (c) => { const k = Q.cur(c).cert; return `<label>${Q.esc(k.label)}: number or reference<input id="cert-no" placeholder="e.g. 2026-004512"></label>${k.days ? `<p class="small muted">Valid for ${k.days} days from today (sample period). A renewal reminder is set.</p>` : `<p class="small muted">No expiry is tracked for this record.</p>`}<div id="act-err"></div><div><button class="btn" data-act="taskDone" data-id="${c.id}">Record it</button></div>`; };
Q.readCert = (c) => { const no = Q.val("cert-no"), k = Q.cur(c).cert; if (!no) return actErr("Enter the number or reference."); c.licence = { no, label: k.label, issued: Q.day(), expires: k.days ? Q.addDays(Q.day(), k.days) : null }; Q.log(c, "Recorded: " + k.label + " " + no); };
/* A partner's audit can come back with findings: turn them into tracked conditions. */
const ptAcceptBase = Q.actions.ptAccept;
Q.actions.ptAccept = (d) => { const t = Q.state.ptasks.find((x) => x.id === d.id), c = t && Q.getCase(t.caseId), s = c && Q.cur(c); ptAcceptBase(d); if (s && s.conds && Q.cur(c) !== s) { c.conds = s.conds.map(([text, owner]) => ({ text, owner, done: null })); Q.log(c, "The partner's work came back with " + c.conds.length + " points to close"); Q.save(); Q.render(); } };
const obligationsSector = Q.obligations;
Q.obligations = (clientId) => { const out = obligationsSector(clientId); Q.state.cases.filter((c) => MORE.includes(c.service) && c.licence && c.licence.expires && (!clientId || c.clientId === clientId)).forEach((c) => out.push({ co: c, label: (c.licence.label || Q.ROUTES[c.route].name) + " renewal", due: c.licence.expires, who: "Qantara", missed: "Sample: the certificate or registration lapses", link: c.id, done: false, days: daysTo(c.licence.expires) })); return out.sort((x, y) => x.days - y.days); };
Q.moreButtons = (co) => { const own = { "08": "Private clients", "10": "Citizenship abroad" }; return ["08", "09", "10", "11", "12", "13", "14"].map((s) => (own[s] ? `<a class="btn sm" href="#/start/${s}">${s} ${own[s]}</a>` : `<button class="btn sm" data-act="mStart" data-svc="${s}" data-id="${co.id}">${s} ${Q.esc(Q.SERVICES[s])}</button>`)).join("") + `<a class="btn sm" href="#/legal">15 Legal services</a><a class="btn sm" href="#/marketing/${co.id}">16 Marketing</a>`; };
Q.actions.mStart = (d) => { Q.state.mdraft = null; mdraft(d.svc).companyId = d.id; Q.save(); Q.go("#/start/" + d.svc); };
Q.moreCard = (co) => { const list = Q.state.cases.filter((c) => MORE.includes(c.service) && c.companyCase === co.id && c.clientId === Q.user().id); return list.length ? `<div class="card"><h2>Licences, certificates and registrations</h2><table><tr><th>Service</th><th>Record</th><th>Valid to</th><th>Status</th></tr>${list.map((c) => `<tr class="link" data-href="#/case/${c.id}"><td>${Q.esc(Q.ROUTES[c.route].name)}</td><td class="num">${c.licence ? Q.esc(c.licence.no) : "—"}</td><td class="num">${c.licence && c.licence.expires ? Q.fmtDate(c.licence.expires) : "—"}</td><td>${c.status === "complete" ? Q.tag("On record", "ok") : Q.holderTag(c)}</td></tr>`).join("")}</table></div>` : ""; };
