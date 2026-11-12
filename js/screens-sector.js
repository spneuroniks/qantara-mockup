/* Service 2, sector licensing: wizard, regulated roles, conditions of an approval, and the "may not operate yet" gate. */
const SWIZ = ["Company", "Sector", "Check and send"];
const sectorCases = (coId) => Q.byService("02").filter((c) => c.companyCase === coId);
const sdraft = () => Q.state.sdraft || (Q.state.sdraft = { step: 0, companyId: "", route: "", ack: false, err: "" });
Q.actions.sectorStart = (d) => { Q.state.sdraft = null; sdraft().companyId = d.id; Q.save(); Q.go("#/sector/new"); };

Q.screens.sectorWizard = () => {
  const d = sdraft(), cos = visaCompanies(), co = d.companyId ? Q.getCase(d.companyId) : null;
  if (!cos.length) return Q.shell("sector", `<h1>Sector licensing</h1><div class="note warn">A sector licence sits on top of a trade licence. You need a licensed mainland or free zone company first.</div><a class="btn" href="#/setup/new" style="justify-self:start">Start a new company</a>`);
  const panes = [
    () => `<div class="stack-s"><h2>Which company needs the licence?</h2></div><div class="grid2">${cos.map((c) => `<button class="choice ${c.id === d.companyId ? "on" : ""}" data-act="swizCompany" data-id="${c.id}"><div class="card-h"><h3>${Q.esc(c.company)}</h3>${Q.tag("Trade licence active", "ok")}</div>
        <dl><dt>Trade licence</dt><dd>${Q.esc(c.licence.no)}</dd><dt>Activity</dt><dd>${Q.esc(Q.activity(c.activity).name)}</dd><dt>Sector licences</dt><dd>${sectorCases(c.id).map((x) => Q.esc(Q.ROUTES[x.route].name)).join(", ") || "None"}</dd></dl></button>`).join("")}</div>`,
    () => `<div class="stack-s"><h2>Which regulated activity?</h2><p class="muted">Sample fees and times. Until the licence is active the company may not start the activity.</p></div>
      <div class="grid2">${Q.SECTORS.map((id) => { const r = Q.ROUTES[id]; return `<button class="choice ${id === d.route ? "on" : ""}" data-act="swizRoute" data-id="${id}"><h3>${Q.esc(r.sector)}</h3><p class="small muted">${Q.esc(r.name)} from the ${Q.esc(r.authority.toLowerCase())}</p>
        <dl><dt>Regulator's fees</dt><dd class="num">${Q.aed(r.gov.reduce((n, g) => n + g[1], 0))}</dd><dt>Qantara fee</dt><dd class="num">${Q.aed(r.qFee)} + VAT</dd><dt>Estimate</dt><dd>${r.days[0]}–${r.days[1]} working days</dd><dt>People you must name</dt><dd>${r.roles.join(", ")}</dd><dt>In person</dt><dd>${Q.esc(r.steps.find((s) => s.type === "appt").title)}</dd></dl></button>`; }).join("")}</div>`,
    () => { const r = Q.ROUTES[d.route]; return `<div class="grid2"><div class="card"><h2>Your application</h2><table><tr><td class="muted">Company</td><td>${Q.esc(co.company)}</td></tr><tr><td class="muted">Licence sought</td><td>${Q.esc(r.name)}</td></tr><tr><td class="muted">Regulator</td><td>${Q.esc(r.authority)}</td></tr><tr><td class="muted">Estimate</td><td>${r.days[0]}–${r.days[1]} working days</td></tr></table>
          <div class="note warn">Until the licence is active, ${Q.esc(co.company)} ${Q.esc(r.notYet)}.</div></div><div class="card"><h2>Estimated cost</h2>${Q.quoteTable({ route: d.route, quote: Q.buildQuote(d.route) })}</div></div>
      <div class="card"><label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="s-ack" type="checkbox" style="width:auto;margin-top:4px" ${d.ack ? "checked" : ""}><span>I understand that the regulator decides, that an approval can come with conditions that must be met first, that durations are estimates, and that the company must not start the activity before the licence is active.</span></label></div>`; },
  ];
  return Q.wiz({ active: "sector", svc: "02", title: "Apply for a sector licence", steps: SWIZ, step: d.step, body: panes[d.step](), err: d.err, back: "swizBack", next: "swizNext", cancel: "swizCancel", why: ["A sector licence sits on top of a trade licence.", "The regulator, its fees and the people you must name depend on the activity.", "The regulator decides, and may approve with conditions."][d.step] });
};
const swizStay = () => { Q.save(); Q.render(); };
Q.actions.swizCompany = (x) => { const d = sdraft(); d.companyId = x.id; d.err = ""; swizStay(); };
Q.actions.swizRoute = (x) => { const d = sdraft(); d.route = x.id; d.err = ""; swizStay(); };
Q.actions.swizBack = () => { const d = sdraft(); d.err = ""; d.step--; swizStay(); };
Q.actions.swizCancel = () => { Q.state.sdraft = null; Q.save(); Q.go("#/home"); };
Q.actions.swizNext = () => {
  const d = sdraft();
  if (d.step === 2) d.ack = document.getElementById("s-ack").checked;
  d.err = d.step === 0 && !visaCompanies().some((c) => c.id === d.companyId) ? "Choose the company." : d.step === 1 && !Q.SECTORS.includes(d.route) ? "Choose the regulated activity."
    : d.step === 1 && sectorCases(d.companyId).some((c) => c.route === d.route) ? "This company already has a case for that licence." : d.step === 2 && !d.ack ? "Tick the box to confirm you have read the points above." : "";
  if (d.err) return swizStay();
  if (d.step < 2) { d.step++; return swizStay(); }
  const co = Q.getCase(d.companyId);
  const c = Q.newCase({ service: "02", companyCase: co.id, clientId: co.clientId, clientName: co.clientName, company: co.company, route: d.route, activity: co.activity, owners: co.owners, visas: 0, docs: [], roles: {}, conds: [] });
  Q.log(c, "Asked Qantara for a " + Q.ROUTES[d.route].name.toLowerCase()); Q.state.cases.unshift(c); Q.state.sdraft = null; Q.save(); Q.go("#/sent/" + c.id);
};

/* ---- Regulated roles: named once, then each person gets a fit-and-proper file ---- */
Q.forms["02"] = (c) => { const r = Q.ROUTES[c.route], known = c.owners.filter((o) => o.kind === "person").map((o) => o.name); return `<p>The regulator expects a named person in each of these roles. Someone we already hold on file is not asked for their identity documents again.</p>
  <datalist id="known-people">${known.map((n) => `<option value="${Q.esc(n)}">`).join("")}</datalist>
  <table><tr><th>Role</th><th>Person</th></tr>${r.roles.map((role, i) => `<tr><td><b>${Q.esc(role)}</b></td><td><input id="role-${i}" list="known-people" placeholder="Full name"></td></tr>`).join("")}</table>
  ${r.consultants ? `<label>Design consultant, from the regulator's pre-qualified list<select id="role-cons"><option value="">Choose</option>${r.consultants.map((x) => `<option>${Q.esc(x)}</option>`).join("")}</select></label>` : ""}
  <div id="act-err"></div><div><button class="btn" data-act="sectorRoles" data-id="${c.id}">Save the roles</button></div>`; };
Q.actions.sectorRoles = (d) => {
  const c0 = myCase(d.id), r = Q.ROUTES[c0.route], names = r.roles.map((_, i) => Q.val("role-" + i)), cons = r.consultants ? Q.val("role-cons") : "", bad = (m) => { document.getElementById("act-err").innerHTML = `<div class="note bad">${Q.esc(m)}</div>`; };
  if (names.some((n) => !n)) return bad("Every role needs a named person. An unfilled role stops the application.");
  if (r.consultants && !r.consultants.includes(cons)) return bad("Choose a design consultant from the regulator's pre-qualified list.");
  act((c) => {
    r.roles.forEach((role, i) => (c.roles[role] = names[i]));
    if (cons) c.consultant = cons;
    const co = Q.getCase(c.companyCase), docs = r.docs.map((t) => [t, c.company]);
    [...new Set(names)].forEach((n) => { docs.push(["Fit-and-proper file: CV, qualifications and declarations", n]); if (!co.owners.some((o) => o.name === n)) docs.push(["Passport copy", n]); });
    c.docs = docs.map(([title, forWho], i) => ({ id: "s" + i, title, forWho, status: "missing" }));
    Q.log(c, "Named the regulated roles: " + r.roles.map((role, i) => role + " " + names[i]).join("; ")); Q.advance(c);
  })(d);
};
const rolesTable = (c) => `<table>${Object.entries(c.roles).map(([role, n]) => `<tr><td class="muted">${Q.esc(role)}</td><td>${Q.esc(n)}</td></tr>`).join("") || `<tr><td class="muted">No roles named yet</td></tr>`}${c.consultant ? `<tr><td class="muted">Design consultant</td><td>${Q.esc(c.consultant)}</td></tr>` : ""}</table>`;

/* ---- Conditions attached to an approval: each one tracked, none skipped ---- */
const condRows = (c, mine) => c.conds.map((x, i) => `<tr><td><b>${Q.esc(x.text)}</b><div class="small muted">${x.done ? "Done " + Q.fmtDate(x.done) + " · " + Q.esc(x.by) : "Open"}</div></td><td>${Q.tag(x.owner === "client" ? "Client" : "Qantara", x.owner === "client" ? "warn" : "")}</td>
  <td class="right">${x.done ? Q.tag("Met", "ok") : x.owner === mine ? `<button class="btn sm" data-act="condDone" data-id="${c.id}" data-i="${i}">Mark met, with proof</button>` : Q.tag("Waiting", "plain")}</td></tr>`).join("");
Q.condsClient = (c) => `<p>The regulator approved the application with conditions. The licence is not active until every one is met.</p><table><tr><th>Condition</th><th>Who</th><th></th></tr>${condRows(c, "client")}</table>`;
Q.condsStaff = (c, nudge) => { const all = c.conds.every((x) => x.done); return `<table><tr><th>Condition</th><th>Who</th><th></th></tr>${condRows(c, "qantara")}</table>${nudge}<div id="act-err"></div>
  <div><button class="btn" data-act="condsClose" data-id="${c.id}" ${all ? "" : "disabled"}>All conditions met: continue</button></div><div class="note">The case cannot move on, and the client is not shown as able to operate, while a condition is open.</div>`; };
Q.actions.condDone = (d) => {
  const c = Q.getCase(d.id), u = Q.user(), x = c && c.conds[Number(d.i)];
  // A client may only close their own condition on their own case; staff only Qantara's.
  if (!x || x.done || (u.role === "client" ? c.clientId !== u.id || x.owner !== "client" : x.owner !== "qantara")) throw new Error("This condition is not yours to close.");
  x.done = Q.day(); x.by = u.name; Q.log(c, "Condition met: " + x.text); Q.save(); Q.render();
};
Q.actions.condsClose = sact((c) => { if (!c.conds.every((x) => x.done)) return actErr("A condition is still open."); Q.advance(c); });
/* When the regulator approves with conditions, turn them into tracked items. */
const subApproveAcc = Q.actions.subApprove;
Q.actions.subApprove = (d) => { const c = Q.getCase(d.id), s = c && Q.cur(c); subApproveAcc(d); if (s && s.conds && Q.cur(c) !== s) { c.conds = s.conds.map(([text, owner]) => ({ text, owner, done: null })); Q.log(c, "Approval came with " + c.conds.length + " conditions"); Q.save(); Q.render(); } };

/* ---- Shared case-screen pieces ---- */
Q.packText["02"] = "for the application. Each is kept under version control once filed";
Q.about["02"] = (c) => { const r = Q.ROUTES[c.route]; return `<div class="card"><h3>About this licence</h3><div class="stack-s small"><div><span class="muted">Regulator</span><br>${Q.esc(r.authority)}</div>
    <div><span class="muted">Whole application, estimate</span><br>${r.days[0]}–${r.days[1]} working days. A range, not a promise.</div></div><h3>Regulated roles</h3>${rolesTable(c)}
    ${c.status === "open" ? `<div class="note warn">Until the licence is active, ${Q.esc(c.company)} ${Q.esc(r.notYet)}.</div>` : ""}</div>`; };
Q.doneNote["02"] = (c) => `<div class="note ok">The ${Q.esc(Q.ROUTES[c.route].name.toLowerCase())} is active: ${Q.esc(c.licence.no)}, valid to ${Q.fmtDate(c.licence.expires)}. The renewal date is on your compliance calendar.</div>`;
const visaChecks = Q.runPackChecks;
Q.runPackChecks = (c) => {
  if (c.service !== "02") return visaChecks(c);
  const r = Q.ROUTES[c.route], co = Q.getCase(c.companyCase);
  c.checks = [["Every regulated role has a named person", r.roles.every((role) => !!c.roles[role])], ["A fit-and-proper file is on record for each of them", true], ["Trade licence valid on the planned filing date", daysTo(co.licence.expires) > 0]];
  if (r.consultants) c.checks.push(["Design consultant is on the regulator's pre-qualified list", r.consultants.includes(c.consultant)]);
  const fails = c.checks.filter(([, ok]) => !ok).length;
  c.kyc.screening = fails ? fails + " check(s) failing" : "All " + c.checks.length + " checks pass"; c.kyc.risk = fails ? "High" : "Low"; Q.log(c, "Ran the readiness checks: " + c.kyc.screening);
};
Q.sectorCard = (co) => { const list = sectorCases(co.id).filter((c) => c.clientId === Q.user().id); if (!list.length) return ""; return `<div class="card"><h2>Sector licences</h2>${list.map((c) => { const r = Q.ROUTES[c.route]; return `
    <div class="stack-s"><div class="card-h"><h3><a href="#/case/${c.id}" style="color:inherit">${Q.esc(r.name)}</a></h3>${c.status === "complete" ? Q.tag("Active to " + Q.fmtDate(c.licence.expires), "ok") : Q.tag("Not active", "bad")}</div>
    ${c.status === "complete" ? `<p class="small muted">${Q.esc(c.licence.no)} · ${Q.esc(r.authority)}</p>` : `<div class="note bad"><b>Regulated activity.</b> ${Q.esc(co.company)} ${Q.esc(r.notYet)} until this licence is active.</div>`}${rolesTable(c)}</div>`; }).join("")}</div>`; };
/* A sector licence's renewal joins the one calendar. */
const obligationsAcc = Q.obligations;
Q.obligations = (clientId) => { const out = obligationsAcc(clientId); Q.byService("02").filter((c) => c.status === "complete" && (!clientId || c.clientId === clientId)).forEach((c) => out.push({ co: c, label: Q.ROUTES[c.route].name + " renewal", due: c.licence.expires, who: "Qantara", missed: "Sample: the regulated activity must stop", link: c.id, done: false, days: daysTo(c.licence.expires) })); return out.sort((x, y) => x.days - y.days); };
