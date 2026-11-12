/* Partner onboarding, done on the site. A new firm works through a task list; compliance reviews it, approves it
   or sends one item back with a reason. A firm that is not approved cannot be given work or see any.
   The tasks follow the research in ux-plan.md. They are a proposal, not a checked legal list. Every firm is made up. */
Q.PARTNERS.push({ id: "p-sahel", name: "Sahel Legal Translation", type: "Legal translator", licence: "", validDays: 0 });
Q.USERS.push({ id: "u-yusuf", name: "Yusuf Rahman", role: "partner", partnerId: "p-sahel", title: "Sahel Legal Translation", email: "yusuf@sahel.example" });

const OB_FILE_HINT = "PDF, JPG or PNG, up to 10 MB. In colour, all four corners visible, not expired.";
const OB_TASKS = [
  { key: "firm", title: "Give the firm and licence details", short: "Firm and licence", why: "Qantara may only pass work to a firm that holds the right licence or registration for it, and must be able to show that it checked.",
    fields: [["legal", "Legal name, exactly as on the trade licence", "text"], ["tl", "Trade licence number", "text"], ["emirate", "Emirate or free zone", "text"], ["reg", "Licence or registration number for this work", "text"], ["regBy", "Issued by", "text"], ["regExp", "Valid until", "date"], ["regFile", "Copy of the licence or registration", "file"]] },
  { key: "owners", title: "List the owners and managers", short: "Owners and managers", why: "Owners with 25% or more and the managers are screened against sanctions lists before any client work is shared.",
    rows: [["name", "Full name", "text"], ["role", "Role", ["Owner", "Manager", "Owner and manager"]], ["nat", "Nationality", "text"]], add: "Add a person" },
  { key: "dd", title: "Answer the due-diligence questions", short: "Due-diligence questions", why: "Qantara stays responsible for work it hands over, so it records how each firm handles client checks, records, insurance and conflicts.",
    fields: [["aml", "Does the firm have a written anti-money-laundering policy?", "yesno"], ["records", "Does the firm keep client records for at least five years?", "yesno"], ["subs", "Will any of this work be passed to another firm?", "yesno"], ["action", "Any regulatory action against the firm or its owners in the last five years?", "yesno"],
      ["insurer", "Professional indemnity insurer", "text"], ["cover", "Cover, in AED", "number"], ["insExp", "Insurance valid until", "date"], ["insFile", "Insurance certificate", "file"], ["conflict", "We will tell Qantara before accepting any task where we have a conflict of interest", "check"]] },
  { key: "dpa", title: "Agree the data-protection terms", short: "Data-protection terms", why: "Client documents are personal data. These terms say what your firm may do with them.",
    terms: ["Your firm uses client data only to do the task it was given, on Qantara's instructions.", "You see only the documents the client agreed to share for that task.", "You keep the data secure and give each person their own login.", "You tell Qantara of any data incident within 24 hours (sample time limit).", "When the task ends you return or delete the data, and say which.", "You do not pass data to another firm without Qantara's written consent."],
    fields: [["breachName", "Who Qantara should call about a data incident", "text"], ["breachEmail", "Their email", "email"], ["sign", "Sign by typing your full name", "sign"]] },
  { key: "terms", title: "Agree the service terms and fees", short: "Service terms and fees", why: "A written agreement sets the scope, the fees and how either side can end it.",
    terms: ["Scope: tasks Qantara hands to your firm inside this platform, each with a written brief.", "Each task is accepted or declined by your firm before work starts.", "Qantara may ask for records of the work for up to five years.", "Either side may end the agreement with 30 days' notice (sample period). Open tasks are finished or handed back."],
    fields: [["feeBasis", "How the firm charges", ["A fixed fee for each task", "An hourly rate", "A fee for each certificate or filing"]], ["sign", "Sign by typing your full name", "sign"]] },
  { key: "users", title: "Name the people who will sign in", short: "People who will sign in", why: "Each person has their own login with a second step. Shared logins are not allowed, so every action carries a name.",
    rows: [["name", "Full name", "text"], ["email", "Work email", "email"], ["admin", "Access", ["Can do tasks", "Administrator: can also add people"]]], add: "Add a person" },
  { key: "bank", title: "Give the bank details for payment", short: "Bank details", why: "Payments go only to an account in the firm's own name. Any later change is confirmed by a call back to a number already on file.",
    fields: [["acct", "Account name", "text"], ["iban", "IBAN", "text"], ["bankFile", "Bank letter confirming the account", "file"]] },
];
const obTask = (k) => OB_TASKS.find((t) => t.key === k);
const obOf = (pid) => Q.state.onb[pid] || null;
Q.onbStatus = (p) => (!p ? "none" : obOf(p.id) ? obOf(p.id).status : "approved"); // no firm: never "approved"
const OB_STATUS = { invited: ["Invited", "plain"], progress: ["In progress", ""], submitted: ["Under review", "dark"], changes: ["Changes requested", "warn"], approved: ["Approved", "ok"], declined: ["Declined", "bad"] };
Q.onbTag = (p) => Q.tag(...OB_STATUS[Q.onbStatus(p)]);
const obEditable = (o) => ["invited", "progress", "changes"].includes(o.status);
const obAllDone = (o) => OB_TASKS.every((t) => o.done[t.key] && !o.back[t.key]);

/* Firms invited from the staff screen live in the saved state; this adds them to the lists the rest of the mockup reads,
   and copies an approved firm's licence onto its record. A firm that is not approved has no valid licence on record. */
Q.syncFirms = () => {
  Q.PARTNERS = Q.PARTNERS.filter((p) => !p.id.startsWith("x-")); for (let i = Q.USERS.length - 1; i >= 0; i--) if (Q.USERS[i].id.startsWith("x-")) Q.USERS.splice(i, 1);
  (Q.state.xfirms || []).forEach((f) => { Q.PARTNERS.push({ id: f.id, name: f.name, type: f.type, licence: "", validDays: 0 }); Q.USERS.push({ id: f.userId, name: f.contact, role: "partner", partnerId: f.id, title: f.name, email: f.email }); });
  Object.keys(Q.state.onb).forEach((pid) => { const p = Q.partner(pid), o = Q.state.onb[pid], f = o.data.firm || {}; if (!p) return;
    p.licence = f.reg || ""; p.validDays = o.status === "approved" && f.regExp ? Math.round((new Date(f.regExp) - new Date(Q.day())) / 86400000) : 0; });
};
const obSeedBase = Q.seed;
Q.seed = () => { obSeedBase(); Q.state.xfirms = []; Q.state.onb = { "p-sahel": { status: "invited", invitedBy: "Priya Nair", invitedOn: Q.day(-1), data: { firm: { legal: "Sahel Legal Translation LLC" } }, done: {}, back: {}, log: [] } }; Q.syncFirms(); Q.save(); };

const obMe = () => { const u = Q.user(); if (!u || u.role !== "partner") throw new Error("Partner login needed."); const p = Q.partner(u.partnerId), o = obOf(p.id); if (!o) throw new Error("This firm has no onboarding record."); return { u, p, o }; };
const obInput = (id, type, val) => (Array.isArray(type) ? `<select id="${id}"><option value="">Choose</option>${type.map((x) => `<option ${val === x ? "selected" : ""}>${Q.esc(x)}</option>`).join("")}</select>`
  : type === "yesno" ? `<select id="${id}"><option value="">Choose</option><option value="yes" ${val === "yes" ? "selected" : ""}>Yes</option><option value="no" ${val === "no" ? "selected" : ""}>No</option></select>`
  : `<input id="${id}" type="${type === "date" ? "date" : type === "number" ? "number" : type === "email" ? "email" : "text"}" value="${Q.esc(val == null ? "" : val)}" ${type === "date" ? `min="${Q.day(1)}"` : ""}>`);
const obShow = (v) => (v === "yes" ? "Yes" : v === "no" ? "No" : v === true ? "Agreed" : /^\d{4}-\d\d-\d\d$/.test(v || "") ? Q.fmtDate(v) : /^\d{5,}$/.test(v || "") ? Number(v).toLocaleString("en-US") : v || "—");

/* ---- Partner: the task list, shown at the start and on every return ---- */
const obNone = () => Q.shell("ptasks", `<h1>Firm record</h1><p class="muted">This firm was approved before onboarding moved onto the site, so it has no record here.</p><a class="btn ghost" href="#/partner/tasks" style="justify-self:start">Go to our tasks</a>`);
Q.screens.onboarding = () => {
  if (!obOf(Q.user().partnerId)) return obNone();
  const { u, p, o } = obMe(), n = OB_TASKS.filter((t) => o.done[t.key] && !o.back[t.key]).length, edit = obEditable(o), next = OB_TASKS.find((t) => !o.done[t.key] || o.back[t.key]);
  const head = o.status === "submitted" ? `<div class="panel"><div class="small">Under review</div><h2>No action is needed from you</h2><p>Sent on ${Q.fmtDate(o.submittedOn)}. Qantara's compliance officer is checking the licence, screening the owners and reading your answers. You will get an email when it is decided, usually within 3 working days (sample).</p></div>`
    : o.status === "approved" ? `<div class="panel ok"><div class="small">Approved</div><h2>${Q.esc(p.name)} can take work</h2><p>Approved on ${Q.fmtDate(o.approvedOn)} by ${Q.esc(o.approvedBy)}.</p><div class="row"><a class="btn ghost" href="#/partner/tasks">Go to our tasks</a></div></div>`
    : o.status === "declined" ? `<div class="panel"><div class="small">Not approved</div><h2>Qantara cannot work with the firm at this time</h2><p>${Q.esc(o.declineWhy || "")}</p></div>`
    : o.status === "changes" ? `<div class="panel"><div class="small">Changes requested</div><h2>${Object.keys(o.back).length} item(s) to correct</h2><p>Only the items marked below are open. Everything else is kept as you sent it.</p><div class="row"><a class="btn" href="#/partner/onboarding/${Object.keys(o.back)[0]}">Correct the first item</a></div></div>`
    : `<div class="panel"><div class="small">Join Qantara as a partner firm · ${n} of ${OB_TASKS.length} done</div><h2>${n ? "Carry on where you left off" : "Welcome, " + Q.esc(u.name.split(" ")[0])}</h2><p>${Q.esc(p.name)} was invited by ${Q.esc(o.invitedBy)} as a ${Q.esc(p.type.toLowerCase())}. Complete the tasks in any order. Your answers are saved as you go.</p><div class="row">${next ? `<a class="btn" href="#/partner/onboarding/${next.key}">${n ? "Continue: " : "Start: "}${Q.esc(next.short.toLowerCase())}</a>` : `<a class="btn" href="#/partner/onboarding/send">Check and send</a>`}</div></div>`;
  return Q.shell("onboarding", `<h1>Partner onboarding</h1>${head}
    <div class="main-side"><div class="stack">
      <div class="card flat"><table><tr><th>Task</th><th>Status</th></tr>${OB_TASKS.map((t, i) => { const back = o.back[t.key], done = o.done[t.key] && !back; return `<tr ${edit || true ? `class="link" data-href="#/partner/onboarding/${t.key}"` : ""}><td><b>${i + 1}. ${Q.esc(t.title)}</b>${back ? `<div class="small" style="color:var(--bad-ink)">Qantara asked: ${Q.esc(back)}</div>` : ""}</td><td>${back ? Q.tag("Changes requested", "warn") : done ? Q.tag("Completed", "ok") : Q.tag("Not started", "plain")}</td></tr>`; }).join("")}
        <tr ${edit && obAllDone(o) ? `class="link" data-href="#/partner/onboarding/send"` : ""}><td><b>${OB_TASKS.length + 1}. Check your answers and send</b></td><td>${o.status === "submitted" || o.status === "approved" ? Q.tag("Completed", "ok") : obAllDone(o) ? Q.tag("Ready", "") : Q.tag("Cannot start yet", "plain")}</td></tr></table></div>
      ${edit && obAllDone(o) ? `<div><a class="btn" href="#/partner/onboarding/send">Check your answers and send</a></div>` : ""}</div>
      <div class="stack">${edit ? "" : "<!--"}<div class="card"><h3>Have these ready</h3><ul class="ticks small"><li>Trade licence</li><li>Licence or registration for the work, in date</li><li>Names of owners and managers</li><li>Professional indemnity insurance certificate</li><li>A bank letter in the firm's name</li><li>Someone who can sign for the firm</li></ul></div>${edit ? "" : "-->"}
        <div class="card"><h3>Need help?</h3><p class="small muted">Write to ${Q.esc(o.invitedBy)} at Qantara. Nothing is sent until you press "Send for review".</p></div></div></div>`);
};

/* ---- Partner: one task per page ---- */
Q.screens.onbTask = (key) => {
  if (!obOf(Q.user().partnerId)) return obNone();
  const { u, p, o } = obMe();
  if (key === "send") return obSend(u, p, o);
  const t = obTask(key); if (!t) return Q.shell("onboarding", `<h1>Not found</h1><a class="btn ghost" href="#/partner/onboarding" style="justify-self:start">Back to the task list</a>`);
  const d = o.data[key] || (o.data[key] = {}), edit = obEditable(o) && (o.status !== "changes" || !!o.back[key]), i = OB_TASKS.indexOf(t);
  if (t.rows && !d.rows) d.rows = [{}];
  const field = ([id, label, type]) => type === "file" ? `<div class="stack-s"><b class="small">${Q.esc(label)}</b>${d[id] ? `<div class="row"><span>📎 ${Q.esc(d[id])}</span>${edit ? `<button class="btn link" data-act="obAttach" data-k="${key}" data-f="${id}">Replace</button>` : ""}</div>` : edit ? `<div><button class="btn ghost sm" data-act="obAttach" data-k="${key}" data-f="${id}">Attach a file</button></div>` : `<span class="muted">Not attached</span>`}<span class="small muted">${OB_FILE_HINT}</span></div>`
    : type === "check" ? `<label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="ob-${id}" type="checkbox" style="width:auto;margin-top:4px" ${d[id] ? "checked" : ""} ${edit ? "" : "disabled"}><span>${Q.esc(label)}</span></label>`
    : type === "sign" ? `<label>${Q.esc(label)}${edit ? `<input id="ob-${id}" value="${Q.esc(d[id] || "")}" placeholder="${Q.esc(u.name)}">` : `<div style="font-weight:400">${Q.esc(d[id] || "—")}</div>`}<span class="small muted" style="font-weight:400">Signing as ${Q.esc(u.name)} for ${Q.esc(p.name)}, ${Q.fmtDate(Q.day())}.</span></label>`
    : `<label>${Q.esc(label)}${edit ? obInput("ob-" + id, type, d[id]) : `<div style="font-weight:400">${Q.esc(obShow(d[id]))}</div>`}</label>`;
  const body = `${o.back[key] ? `<div class="note warn"><b>Qantara asked for a change.</b> ${Q.esc(o.back[key])}</div>` : ""}
    <div class="card">${t.terms ? `<ul style="margin:0;padding-left:18px">${t.terms.map((x) => `<li>${Q.esc(x)}</li>`).join("")}</ul><p class="small muted">Sample terms for the mockup. The real agreement is drafted by a lawyer.</p>` : ""}
      ${t.rows ? `<table><tr>${t.rows.map(([, l]) => `<th>${Q.esc(l)}</th>`).join("")}<th></th></tr>${d.rows.map((r, n) => `<tr>${t.rows.map(([id, , type]) => `<td>${edit ? obInput(`ob-${id}-${n}`, type, r[id]) : Q.esc(obShow(r[id]))}</td>`).join("")}<td>${edit && d.rows.length > 1 ? `<button class="btn link" data-act="obDelRow" data-k="${key}" data-n="${n}">Remove</button>` : ""}</td></tr>`).join("")}</table>${edit ? `<div><button class="btn ghost sm" data-act="obAddRow" data-k="${key}">${t.add}</button></div>` : ""}` : ""}
      ${(t.fields || []).map(field).join("")}</div>
    <div class="row">${edit ? `<button class="btn" data-act="obSave" data-k="${key}">Save and continue</button>` : ""}<a class="btn ghost" href="#/partner/onboarding">Back to the task list</a></div>
    ${edit ? `<p class="small muted">Saved on this device as you go. You can leave and come back.</p>` : `<p class="small muted">This item cannot be changed while it is ${o.status === "approved" ? "approved" : "under review"}.</p>`}`;
  return Q.shell("onboarding", `<div class="crumbs"><a href="#/partner/onboarding">Partner onboarding</a> / ${Q.esc(t.short)}</div>
    <div class="wiz-head"><h1>${Q.esc(t.title)}</h1><div class="wiz-pos">Task ${i + 1} of ${OB_TASKS.length + 1}</div></div>
    ${o.err && o.errKey === key ? `<div class="errsum" role="alert"><b>There is a problem</b><div>${Q.esc(o.err)}</div></div>` : ""}
    <div class="main-side"><div class="stack">${body}</div><div class="card"><h3>Why we ask</h3><p class="small muted">${Q.esc(t.why)}</p></div></div>`);
};
const obSend = (u, p, o) => {
  const ready = obAllDone(o), edit = obEditable(o);
  return Q.shell("onboarding", `<div class="crumbs"><a href="#/partner/onboarding">Partner onboarding</a> / Check and send</div>
    <div class="wiz-head"><h1>Check your answers and send</h1><div class="wiz-pos">Task ${OB_TASKS.length + 1} of ${OB_TASKS.length + 1}</div></div>
    ${o.err && o.errKey === "send" ? `<div class="errsum" role="alert"><b>There is a problem</b><div>${Q.esc(o.err)}</div></div>` : ""}
    ${ready ? "" : `<div class="note warn">Some tasks are not complete yet. Finish them before sending.</div>`}
    ${OB_TASKS.map((t) => obSummary(t, o, edit ? `<a class="small" href="#/partner/onboarding/${t.key}">Change</a>` : "")).join("")}
    ${edit ? `<div class="card"><label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="ob-declare" type="checkbox" style="width:auto;margin-top:4px"><span>I confirm that these answers are true and complete, and that I may sign for ${Q.esc(p.name)}.</span></label></div>
      <div class="row"><button class="btn" data-act="obSubmit" ${ready ? "" : "disabled"}>Send for review</button><a class="btn ghost" href="#/partner/onboarding">Back to the task list</a></div>` : `<div><a class="btn ghost" href="#/partner/onboarding">Back to the task list</a></div>`}`);
};
const obSummary = (t, o, action) => { const d = o.data[t.key] || {}; return `<div class="card"><div class="card-h"><h3>${Q.esc(t.short)}</h3><span>${o.back[t.key] ? Q.tag("Changes requested", "warn") : o.done[t.key] ? "" : Q.tag("Not complete", "plain")} ${action}</span></div>
  ${t.rows ? `<table><tr>${t.rows.map(([, l]) => `<th>${Q.esc(l)}</th>`).join("")}</tr>${(d.rows || []).map((r) => `<tr>${t.rows.map(([id]) => `<td>${Q.esc(obShow(r[id]))}</td>`).join("")}</tr>`).join("")}</table>` : ""}
  ${t.fields ? `<table>${t.fields.map(([id, label]) => `<tr><td class="muted small" style="width:55%">${Q.esc(label)}</td><td class="small">${Q.esc(obShow(d[id]))}</td></tr>`).join("")}</table>` : ""}</div>`; };

/* ---- Partner actions ---- */
const obRead = (o, key) => { const t = obTask(key), d = o.data[key] || (o.data[key] = {});
  (t.fields || []).forEach(([id, , type]) => { if (type === "file") return; const el = document.getElementById("ob-" + id); if (el) d[id] = type === "check" ? el.checked : el.value.trim(); });
  if (t.rows) d.rows.forEach((r, n) => t.rows.forEach(([id]) => { const el = document.getElementById(`ob-${id}-${n}`); if (el) r[id] = el.value.trim(); }));
  return d; };
const obCheck = (o, key, u) => { const t = obTask(key), d = o.data[key];
  for (const [id, label, type] of t.fields || []) {
    if (type === "check" ? !d[id] : !d[id]) return type === "file" ? "Attach: " + Q.lc1(label) + "." : type === "check" ? "Tick the box to confirm: " + Q.lc1(label) + "." : "Enter: " + Q.lc1(label) + ".";
    if (type === "date" && d[id] <= Q.day()) return label + " must be a date in the future. An expired document cannot be accepted.";
    if (type === "email" && !/^\S+@\S+\.\S+$/.test(d[id])) return "Enter an email address like name@firm.example.";
    if (type === "sign" && d[id].toLowerCase() !== u.name.toLowerCase()) return "Type your full name, " + u.name + ", exactly, to sign.";
  }
  if (t.rows) { if (d.rows.some((r) => t.rows.some(([id]) => !r[id]))) return "Fill in every box for each person, or remove the empty row."; if (t.rows.some(([, , ty]) => ty === "email") && d.rows.some((r) => !/^\S+@\S+\.\S+$/.test(r.email))) return "Enter a work email address for each person."; }
  if (key === "users" && new Set(d.rows.map((r) => r.email.toLowerCase())).size !== d.rows.length) return "Each person needs their own email. Shared logins are not allowed.";
  if (key === "users" && !d.rows.some((r) => /^Administrator/.test(r.admin))) return "Choose at least one administrator.";
  if (key === "bank") { const legal = (o.data.firm || {}).legal; if (!o.done.firm || !legal) return "Complete \"Firm and licence\" first, so the account name can be checked against the legal name.";
    if (d.acct.toLowerCase() !== legal.toLowerCase()) return "The account name must match the firm's legal name: " + legal + ".";
    if (!/^AE\d{21}$/.test(d.iban.replace(/\s/g, "").toUpperCase())) return "Enter a UAE IBAN: AE followed by 21 digits."; }
  return ""; };
const obGuard = (key) => { const x = obMe(); if (!obEditable(x.o) || (x.o.status === "changes" && !x.o.back[key])) throw new Error("This item is not open for changes."); return x; };
Q.actions.obAttach = (d) => { const { o } = obGuard(d.k), data = obRead(o, d.k), t = obTask(d.k), label = t.fields.find(([id]) => id === d.f)[1]; data[d.f] = label.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 28) + ".pdf"; o.err = ""; Q.save(); Q.render(); };
Q.actions.obAddRow = (d) => { const { o } = obGuard(d.k); obRead(o, d.k).rows.push({}); Q.save(); Q.render(); };
Q.actions.obDelRow = (d) => { const { o } = obGuard(d.k); obRead(o, d.k).rows.splice(Number(d.n), 1); Q.save(); Q.render(); };
Q.actions.obSave = (d) => { const { u, o } = obGuard(d.k); obRead(o, d.k); if (o.status === "invited") o.status = "progress";
  o.err = obCheck(o, d.k, u); o.errKey = d.k; if (o.err) { o.done[d.k] = false; Q.save(); return Q.render(); }
  o.done[d.k] = true; delete o.back[d.k]; Q.save(); const next = OB_TASKS.find((t) => !o.done[t.key] || o.back[t.key]); Q.go(next ? "#/partner/onboarding/" + next.key : "#/partner/onboarding/send"); };
Q.actions.obSubmit = () => { const { u, p, o } = obMe(); if (!obEditable(o)) throw new Error("Already sent.");
  // Fail closed: re-check every task at the moment of sending.
  const bad = OB_TASKS.find((t) => !o.data[t.key] || obCheck(o, t.key, u)); o.errKey = "send";
  o.err = bad ? "\"" + bad.short + "\" is not complete: " + obCheck(o, bad.key, u) : Object.keys(o.back).length ? "Correct the items Qantara asked about first." : !document.getElementById("ob-declare").checked ? "Tick the box to confirm the answers are true and complete." : "";
  if (o.err) { Q.save(); return Q.render(); }
  o.status = "submitted"; o.submittedOn = Q.day(); o.submittedBy = u.name; o.screening = null; o.log.push({ t: Q.day(), who: u.name, what: "Sent for review" }); Q.save(); Q.go("#/partner/onboarding"); };

/* ---- Staff: invite a firm, review it, approve it or send an item back ---- */
const obStaff = () => { const u = Q.user(); if (!u || u.role !== "staff") throw new Error("Staff login needed."); return u; };
Q.screens.partnerFirms = () => { const types = [...new Set(Q.PARTNERS.map((p) => p.type))].sort(), waiting = Q.PARTNERS.filter((p) => Q.onbStatus(p) === "submitted");
  return Q.shell("partners", `<h1>Partner firms</h1><p class="muted">Every firm works inside the platform. A firm that is not approved, or whose licence has lapsed, cannot be given work.</p>
  ${waiting.length ? `<div class="panel"><div class="small">Waiting for review</div><h2>${waiting.map((p) => Q.esc(p.name)).join(", ")}</h2><div class="row"><a class="btn" href="#/staff/partner/${waiting[0].id}">Review the onboarding</a></div></div>` : ""}
  <div class="card flat"><table><tr><th>Firm</th><th>Status held</th><th>Licence</th><th>Valid to</th><th class="right">Open tasks</th><th>Onboarding</th><th></th></tr>${Q.PARTNERS.map((p) => { const st = Q.onbStatus(p), has = !!obOf(p.id); return `<tr ${has ? `class="link" data-href="#/staff/partner/${p.id}"` : ""}><td><b>${Q.esc(p.name)}</b></td><td>${Q.esc(p.type)}</td><td class="num">${Q.esc(p.licence || "—")}</td><td class="num">${p.licence ? Q.fmtDate(Q.day(p.validDays)) : "—"}</td><td class="right num">${Q.state.ptasks.filter((t) => t.partnerId === p.id && t.status !== "accepted").length}</td><td>${Q.onbTag(p)}</td><td>${st !== "approved" ? Q.tag("Cannot be given work", "plain") : p.validDays > 0 ? Q.tag("Can take work", "ok") : Q.tag("Licence lapsed: blocked", "bad")}</td></tr>`; }).join("")}</table></div>
  <div class="card"><h2>Invite a firm</h2><p class="small muted">The firm's contact gets a login and completes onboarding on the site. Nothing can be handed to the firm until compliance approves it.</p>
    <div class="field-row"><label>Firm name<input id="inv-name"></label><label>Status the firm holds<select id="inv-type"><option value="">Choose</option>${types.map((t) => `<option>${Q.esc(t)}</option>`).join("")}</select></label></div>
    <div class="field-row"><label>Contact's full name<input id="inv-contact"></label><label>Contact's work email<input id="inv-email" type="email"></label></div><div id="act-err"></div><div><button class="btn" data-act="obInvite">Send the invitation</button></div></div>`); };
Q.actions.obInvite = () => { const u = obStaff(), name = Q.val("inv-name"), type = Q.val("inv-type"), contact = Q.val("inv-contact"), email = Q.val("inv-email");
  const err = !name || !type || !contact ? "Give the firm's name, the status it holds and a contact." : !/^\S+@\S+\.\S+$/.test(email) ? "Enter the contact's work email." : Q.PARTNERS.some((p) => p.name.toLowerCase() === name.toLowerCase()) ? "A firm with this name is already on the list." : "";
  if (err) { document.getElementById("act-err").innerHTML = `<div class="note bad">${Q.esc(err)}</div>`; return; }
  const id = "x-" + (Q.state.xfirms.length + 1); Q.state.xfirms.push({ id, name, type, contact, email, userId: id + "-u" });
  Q.state.onb[id] = { status: "invited", invitedBy: u.name, invitedOn: Q.day(), data: { firm: { legal: name } }, done: {}, back: {}, log: [{ t: Q.day(), who: u.name, what: "Invited " + contact }] }; Q.syncFirms(); Q.save(); Q.render(); };
Q.screens.partnerReview = (pid) => { const u = Q.user(), p = Q.partner(pid), o = p && obOf(pid);
  if (!o) return Q.shell("partners", `<h1>Not found</h1><p class="muted">This firm has no onboarding record.</p><a class="btn ghost" href="#/staff/partners" style="justify-self:start">Back to partner firms</a>`);
  const sub = o.status === "submitted", dd = o.data.dd || {}, flags = [dd.aml === "no" && "No written anti-money-laundering policy", dd.records === "no" && "Does not keep records for five years", dd.subs === "yes" && "Will pass work to another firm", dd.action === "yes" && "Regulatory action in the last five years"].filter(Boolean);
  return Q.shell("partners", `<div class="crumbs"><a href="#/staff/partners">Partner firms</a> / ${Q.esc(p.name)}</div><div class="spread"><div><h1>${Q.esc(p.name)}</h1><p class="muted">${Q.esc(p.type)} · invited by ${Q.esc(o.invitedBy)} on ${Q.fmtDate(o.invitedOn)}${o.submittedOn ? " · sent " + Q.fmtDate(o.submittedOn) : ""}</p></div>${Q.onbTag(p)}</div>
    ${!sub ? `<div class="note">${{ invited: "The firm has not started yet.", progress: "The firm is still filling this in. Nothing to review yet.", changes: "Waiting for the firm to correct the items sent back.", approved: "Approved on " + Q.fmtDate(o.approvedOn) + " by " + Q.esc(o.approvedBy || "") + ".", declined: "Declined: " + Q.esc(o.declineWhy || "") }[o.status]}</div>` : ""}
    <div class="main-side"><div class="stack">${OB_TASKS.map((t) => obSummary(t, o, sub ? `<button class="btn link" data-act="obBack" data-id="${pid}" data-k="${t.key}">Send back</button>` : "")).join("")}</div>
      <div class="stack"><div class="card"><h3>Review</h3>
          <div class="stack-s small"><div><span class="muted">Answers to look at</span><br>${flags.length ? flags.map((f) => Q.tag("Flag", "warn") + " " + Q.esc(f)).join("<br>") : "No answer raised a flag."}</div>
            <div><span class="muted">Sanctions screening of owners and managers</span><br>${o.screening ? Q.esc(o.screening) : "Not run yet"}</div></div>
          ${sub ? `<div id="act-err"></div><div class="stack-s"><button class="btn ghost" data-act="obScreen" data-id="${pid}">Run the screening</button>
            <button class="btn" data-act="obApprove" data-id="${pid}" ${u.compliance && o.screening && !Object.keys(o.back).length ? "" : "disabled"}>Approve the firm</button>
            ${Object.keys(o.back).length ? `<button class="btn" data-act="obReturn" data-id="${pid}">Return ${Object.keys(o.back).length} item(s) to the firm</button>` : ""}
            <button class="btn link" data-act="obDecline" data-id="${pid}">Decline the firm</button></div>
            <p class="small muted">${u.compliance ? "Approval needs a completed screening and no item marked to send back." : "Only the compliance officer can approve a firm."}</p>` : ""}</div>
        <div class="card"><h3>History</h3><div class="stack-s small">${o.log.slice().reverse().map((l) => `<div><b>${Q.fmtDate(l.t)}</b> · ${Q.esc(l.who)}<br><span class="muted">${Q.esc(l.what)}</span></div>`).join("") || `<span class="muted">Nothing yet.</span>`}</div></div></div></div>`); };
const obRev = (d) => { const u = obStaff(), p = Q.partner(d.id), o = p && obOf(d.id); if (!o || o.status !== "submitted") throw new Error("This firm is not waiting for review."); return { u, p, o }; };
Q.actions.obScreen = (d) => { const { u, o } = obRev(d); const n = ((o.data.owners || {}).rows || []).length; o.screening = "No match for " + n + " people, checked " + Q.fmtDate(Q.day()) + " by " + u.name + " (sample result)"; o.log.push({ t: Q.day(), who: u.name, what: "Screened " + n + " owners and managers: no match" }); Q.save(); Q.render(); };
Q.actions.obBack = (d) => { const { u, o } = obRev(d), why = prompt("What must the firm change? They see this text.", "The copy of the licence is not readable. Attach a clearer copy."); if (!why) return; o.back[d.k] = why; o.log.push({ t: Q.day(), who: u.name, what: "Marked \"" + obTask(d.k).short + "\" to send back: " + why }); Q.save(); Q.render(); };
Q.actions.obReturn = (d) => { const { u, o } = obRev(d); if (!Object.keys(o.back).length) throw new Error("Nothing is marked to send back."); o.status = "changes"; o.log.push({ t: Q.day(), who: u.name, what: "Returned " + Object.keys(o.back).length + " item(s) to the firm" }); Q.syncFirms(); Q.save(); Q.render(); };
Q.actions.obApprove = (d) => { const { u, p, o } = obRev(d);
  // Fail closed: only compliance approves, only after a screening, and never with an item still marked for change.
  const err = !u.compliance ? "Only the compliance officer can approve a firm." : !o.screening ? "Run the sanctions screening first." : Object.keys(o.back).length ? "An item is marked to send back. Return it to the firm instead." : (o.data.firm || {}).regExp <= Q.day() ? "The firm's licence has expired." : "";
  if (err) { document.getElementById("act-err").innerHTML = `<div class="note bad">${Q.esc(err)}</div>`; return; }
  o.status = "approved"; o.approvedBy = u.name; o.approvedOn = Q.day(); o.log.push({ t: Q.day(), who: u.name, what: "Approved " + p.name }); Q.syncFirms(); Q.save(); Q.render(); };
Q.actions.obDecline = (d) => { const { u, o } = obRev(d), why = prompt("Why is the firm declined? They see this text.", ""); if (!why) return; o.status = "declined"; o.declineWhy = why; o.log.push({ t: Q.day(), who: u.name, what: "Declined: " + why }); Q.syncFirms(); Q.save(); Q.render(); };
