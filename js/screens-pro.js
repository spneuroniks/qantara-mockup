/* Service 5, PRO and compliance: one calendar across services, licence renewal, change of ownership, sanctions screening. */
const daysTo = (iso) => Math.round((new Date(iso + "T00:00:00Z") - new Date(Q.day() + "T00:00:00Z")) / 86400000);
const openPro = (coId, route) => Q.byService("05").find((c) => c.companyCase === coId && c.route === route && c.status === "open");
const companiesOf = (clientId) => Q.state.cases.filter((c) => c.service === "01" && c.status === "complete" && (!clientId || c.clientId === clientId));

/* The calendar is built from recorded facts (licence dates, visas, open cases), never typed in by hand. */
Q.obligations = (clientId) => {
  const out = [], R = Q.PRO_RULES;
  const add = (co, label, due, who, missed, link, done) => out.push({ co, label, due, who, missed, link, done: !!done, days: daysTo(due) });
  companiesOf(clientId).forEach((co) => {
    const ren = openPro(co.id, "pro-renewal"), link = ren ? ren.id : null;
    add(co, "Office lease or desk agreement renewal", Q.addDays(co.licence.expires, -R.leaseDaysBeforeLicence), "You", "The licence cannot be renewed without it", link, ren && ren.stepIndex > 0);
    add(co, "Trade licence renewal", co.licence.expires, "Qantara", "Sample: AED 200 for each month late", link);
    add(co, "Establishment card renewal", co.licence.expires, "Qantara", "Sample: AED 100 a month, and visas are blocked", link);
    Q.byService("05").filter((c) => c.companyCase === co.id && c.route === "pro-change" && c.status === "open").forEach((c) => add(co, "Tell the registrar of the ownership change", c.changeDue, "Qantara", "Sample: a warning, then AED 15,000", c.id));
    Q.byService("04").filter((c) => c.companyCase === co.id && c.visa).forEach((c) => add(co, "Residence visa renewal, " + c.person.name, c.visa.expires, "Qantara", "Sample: AED 50 for each day overstayed", c.id));
  });
  Q.state.cases.filter((c) => c.status === "open" && (!clientId || c.clientId === clientId)).forEach((c) => {
    const s = Q.cur(c);
    if (s.type === "pay") add(c, (s.proof ? "Tax payment due: " : "Government fees due: ") + Q.ROUTES[c.route].name, c.voucherDue, "You", s.proof ? "Sample: a late-payment penalty on the unpaid tax" : "The application is cancelled", c.id);
    if (c.permitDue) add(c, "Finish the visa steps, " + c.person.name, c.permitDue, "You and Qantara", "The entry permit lapses", c.id);
  });
  return out.sort((a, b) => a.days - b.days);
};
const dueTag = (o) => (o.done ? Q.tag("Done", "ok") : !Number.isFinite(o.days) ? Q.tag("No date set: check", "bad") : o.days < 0 ? Q.tag("Overdue by " + -o.days + " days", "bad") : o.days <= 30 ? Q.tag("Due in " + o.days + " days", "warn") : Q.tag(o.days + " days left", "plain"));
const obTable = (list, staff) => `<div class="card flat"><table><tr><th>Due</th><th>What</th><th>Company</th><th>Who acts</th><th>If it is missed</th><th>Status</th></tr>
  ${list.map((o) => `<tr ${o.link ? `class="link" data-href="${staff ? "#/staff/case/" : "#/case/"}${o.link}"` : ""}><td class="num">${Q.fmtDate(o.due)}</td><td><b>${Q.esc(o.label)}</b>${o.link ? `<div class="small muted">Case ${o.link} open</div>` : ""}</td><td>${Q.esc(o.co.company)}${staff ? `<div class="small muted">${Q.esc(o.co.clientName)}${Q.state.plans[o.co.companyCase || o.co.id] ? "" : " · no compliance plan"}</div>` : ""}</td><td>${Q.esc(staff ? o.who.replace("You", "The client") : o.who)}</td><td class="small">${Q.esc(o.missed)}</td><td>${dueTag(o)}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">No dates yet. They appear once a company has its licence.</td></tr>`}</table></div>`;
const obStats = (list) => { const live = list.filter((o) => !o.done); return `<div class="grid3"><div class="card stat"><b>${live.filter((o) => !(o.days >= 0)).length}</b><span>overdue or undated</span></div><div class="card stat"><b>${live.filter((o) => o.days >= 0 && o.days <= 30).length}</b><span>due in the next 30 days</span></div><div class="card stat"><b>${live.filter((o) => o.days > 30).length}</b><span>later</span></div></div>`; };

Q.screens.compliance = () => {
  const u = Q.user(), list = Q.obligations(u.id), cos = companiesOf(u.id);
  return Q.shell("pro", `<h1>Compliance calendar</h1><p class="muted">Every date across your companies and services, in one list. Built from your licences, visas and open cases.</p>
    ${obStats(list)}${obTable(list, false)}
    <h2>Your companies</h2>
    ${cos.map((co) => { const plan = Q.state.plans[co.id], ren = openPro(co.id, "pro-renewal"), chg = openPro(co.id, "pro-change"); return `<div class="card"><div class="card-h"><h3>${Q.esc(co.company)}</h3>${plan ? Q.tag(Q.PLANS[plan.plan].name + " plan · " + Q.aed(plan.fee) + " a month", "ok") : Q.tag("No compliance plan", "warn")}</div>
      ${plan ? `<p class="small muted">${Q.esc(Q.PLANS[plan.plan].covers)}. Since ${Q.fmtDate(plan.since)}. Government fees are charged at cost.</p>
        <div class="row">${ren ? `<a class="btn sm ghost" href="#/case/${ren.id}">Open the renewal, ${ren.id}</a>` : `<button class="btn sm" data-act="proRenew" data-id="${co.id}">Start the licence renewal</button>`}
          ${chg ? `<a class="btn sm ghost" href="#/case/${chg.id}">Open the ownership change, ${chg.id}</a>` : `<a class="btn sm ghost" href="#/compliance/change/${co.id}">Report a change of ownership</a>`}</div>`
        : `<p class="small muted">The dates above are tracked either way. With a plan, Qantara does the renewals and filings for you.</p>
        <div class="row">${Object.entries(Q.PLANS).map(([id, p]) => `<button class="btn sm ${id === "full" ? "" : "ghost"}" data-act="proPlan" data-id="${co.id}" data-plan="${id}">${p.name}: ${Q.aed(p.fee)} a month</button>`).join("")}</div>
        <p class="small muted">${Object.values(Q.PLANS).map((p) => p.name + ": " + p.covers.toLowerCase()).join(". ")}. Sample prices.</p>`}</div>`; }).join("") || `<div class="card"><p class="muted">You have no licensed company yet.</p></div>`}`);
};

const myCompany = (id) => companiesOf(Q.user().id).find((c) => c.id === id) || null;
const proCase = (co, route, extra) => {
  const q = Object.assign(Q.buildQuote(route), { accepted: true, signed: true, depositPaid: true, covered: true });
  const c = Q.newCase(Object.assign({ service: "05", companyCase: co.id, clientId: co.clientId, clientName: co.clientName, company: co.company, route, activity: co.activity, owners: co.owners, visas: 0, quote: q, docs: [] }, extra));
  Q.state.cases.unshift(c);
  return c;
};
Q.actions.proPlan = (d) => { const co = myCompany(d.id); if (!co || !Q.PLANS[d.plan]) throw new Error("Unknown company or plan"); if (!confirm("Add the " + Q.PLANS[d.plan].name + " plan for " + co.company + " at " + Q.aed(Q.PLANS[d.plan].fee) + " a month?")) return; Q.state.plans[co.id] = { plan: d.plan, fee: Q.PLANS[d.plan].fee, since: Q.day() }; Q.save(); Q.render(); };
Q.actions.proRenew = (d) => {
  const co = myCompany(d.id);
  if (!co || !Q.state.plans[co.id] || openPro(co.id, "pro-renewal")) throw new Error("Renewal cannot start for " + d.id);
  const c = proCase(co, "pro-renewal", { kyc: Object.assign({}, co.kyc) });
  Q.log(c, "Started the licence renewal. Details carried over from " + co.id);
  Q.save(); Q.go("#/case/" + c.id);
};

Q.screens.ownerChange = (coId) => {
  const co = myCompany(coId);
  if (!co || !Q.state.plans[co.id]) return Q.shell("pro", `<h1>Not available</h1><p class="muted">Add a compliance plan for this company first.</p><a class="btn ghost" href="#/compliance" style="justify-self:start">Back</a>`);
  const people = co.owners;
  return Q.shell("pro", `<div class="crumbs"><a href="#/compliance">Compliance calendar</a> / Change of ownership</div><h1>Report a change of ownership</h1><p class="muted">${Q.esc(co.company)}. The registrar must be told within ${Q.PRO_RULES.changeNoticeDays} days of the change (sample time limit), so the clock starts from the date you give.</p>
    <div class="grid2"><div class="card"><h2>The transfer</h2>
      <label>Shares move from<select id="ch-from">${people.map((o) => `<option value="${Q.esc(o.name)}">${Q.esc(o.name)}, ${o.pct}%</option>`).join("")}</select></label>
      <div class="field-row"><label>To: full name<input id="ch-to"></label><label>Nationality or country<input id="ch-nat"></label></div>
      <div class="field-row"><label>Share moved, %<input id="ch-pct" type="number" min="1" max="100"></label><label>Date of the change<input id="ch-date" type="date" value="${Q.day()}" max="${Q.day()}"></label></div>
      <div id="act-err"></div><div class="row"><button class="btn" data-act="proChange" data-id="${co.id}">Send to Qantara</button><a class="btn ghost" href="#/compliance">Cancel</a></div></div>
      <div class="card"><h2>Owners today</h2>${Q.ownChart(co)}</div></div>`);
};
Q.actions.proChange = (d) => {
  const co = myCompany(d.id), bad = (m) => { document.getElementById("act-err").innerHTML = `<div class="note bad">${Q.esc(m)}</div>`; };
  if (!co || !Q.state.plans[co.id]) throw new Error("Change cannot start for " + d.id);
  const from = co.owners.find((o) => o.name === Q.val("ch-from")), toName = Q.val("ch-to"), toNat = Q.val("ch-nat"), pct = Number(Q.val("ch-pct")), date = Q.val("ch-date");
  if (!from || !toName || !toNat || !date) return bad("Fill in who the shares move to, their nationality and the date.");
  if (!(pct > 0 && pct <= from.pct)) return bad(from.name + " holds " + from.pct + "%. Enter a share between 1 and " + from.pct + ".");
  if (toName === from.name) return bad("The shares must move to a different person.");
  if (daysTo(date) > 0) return bad("The date of the change cannot be in the future.");
  const isNew = !co.owners.some((o) => o.name === toName);
  const docs = (isNew ? [["Passport copy", toName], ["Proof of home address", toName]] : []).concat([["Share transfer agreement, signed", co.company], ["Beneficial-owner statement from the new holder", toName]]).map(([title, forWho], i) => ({ id: "c" + i, title, forWho, status: "missing" }));
  const c = proCase(co, "pro-change", { docs, change: { from: from.name, toName, toNat, pct, date }, changeDue: Q.addDays(date, Q.PRO_RULES.changeNoticeDays) });
  Q.log(c, "Reported a transfer of " + pct + "% from " + from.name + " to " + toName + ", dated " + Q.fmtDate(date));
  Q.save(); Q.go("#/case/" + c.id);
};

/* ---- Pieces the shared case screens call ---- */
Q.about["05"] = (c) => { const co = Q.getCase(c.companyCase); return `<div class="card"><h3>About this case</h3><div class="stack-s small">
    ${c.change ? `<div><span class="muted">Transfer</span><br>${c.change.pct}% from ${Q.esc(c.change.from)} to ${Q.esc(c.change.toName)}</div><div><span class="muted">Date of the change</span><br>${Q.fmtDate(c.change.date)}</div>
      ${c.status === "open" ? `<div class="note ${daysTo(c.changeDue) <= 5 ? "bad" : "warn"}">The registrar must be told by <b>${Q.fmtDate(c.changeDue)}</b>: ${daysTo(c.changeDue) < 0 ? "overdue" : daysTo(c.changeDue) + " days left"}.</div>` : ""}`
      : `<div><span class="muted">Licence</span><br>${Q.esc(co.licence.no)}</div><div><span class="muted">${c.renewedTo ? "Renewed to" : "Expires"}</span><br>${Q.fmtDate(co.licence.expires)}${c.renewedTo ? "" : ", " + daysTo(co.licence.expires) + " days left"}</div>
      <div><span class="muted">Carried over</span><br>Company details, owners and identity checks from ${co.id}. Only what has changed is asked for.</div>
      <div><span class="muted">Relies on this licence</span><br>${Q.byService("04").filter((x) => x.companyCase === co.id && x.visa).length} residence visa(s), ${Q.byService("03").filter((x) => x.companyCase === co.id && x.account).length} bank account(s)</div>`}
    <div><span class="muted">Qantara's fee</span><br>Covered by your ${Q.esc(Q.PLANS[Q.state.plans[co.id].plan].name)} plan</div></div></div>`; };
Q.doneNote["05"] = (c) => `<div class="note ok">${c.change ? "The registrar has been told and both registers are updated. The earlier version is kept in the register history on the company profile." : "The licence is renewed to " + Q.fmtDate(c.renewedTo) + ". The calendar is updated."}</div>`;
Q.applyRenewal = (c) => { const co = Q.getCase(c.companyCase); co.licence.expires = Q.addDays(co.licence.expires, 365); c.renewedTo = co.licence.expires; Q.log(c, "Licence renewed to " + Q.fmtDate(c.renewedTo)); };
const snap = (owners) => owners.map((o) => Object.assign({}, o));
Q.applyOwnerChange = (c) => {
  const co = Q.getCase(c.companyCase), ch = c.change;
  co.registerVersions = co.registerVersions || [{ date: co.licence.issued, reason: "First register, at licence issue", owners: snap(co.owners) }];
  const owners = snap(co.owners), from = owners.find((o) => o.name === ch.from), to = owners.find((o) => o.name === ch.toName);
  from.pct -= ch.pct;
  if (to) to.pct += ch.pct; else owners.push({ name: ch.toName, kind: "person", nationality: ch.toNat, pct: ch.pct });
  co.owners = owners.filter((o) => o.pct > 0);
  co.registerVersions.push({ date: Q.day(), reason: "Transfer of " + ch.pct + "% from " + ch.from + " to " + ch.toName + ", dated " + Q.fmtDate(ch.date) + " (case " + c.id + ")", owners: snap(co.owners) });
  Q.log(c, "Updated the beneficial-owner and shareholder registers");
};
Q.registerCard = (co) => (co.registerVersions ? `<div class="card"><h2>Register history</h2><table><tr><th>From</th><th>Reason</th><th>Owners</th></tr>${co.registerVersions.slice().reverse().map((v, i) => `<tr><td class="num">${Q.fmtDate(v.date)}${i === 0 ? " " + Q.tag("Current", "ok") : ""}</td><td>${Q.esc(v.reason)}</td><td>${v.owners.map((o) => Q.esc(o.name) + " " + o.pct + "%").join("<br>")}</td></tr>`).join("")}</table><p class="small muted">Earlier versions are kept, never overwritten.</p></div>` : "");

/* ---- Staff: firm-wide deadlines ---- */
Q.screens.deadlines = () => { const list = Q.obligations(null); return Q.shell("deadlines", `<h1>Deadlines</h1><p class="muted">Every client's dates in one list, soonest first.</p>${obStats(list)}${obTable(list, true)}`); };

/* ---- Staff: sanctions screening. The client is never shown any of this. ---- */
Q.frozen = (c) => Q.state.screen.alerts.some((a) => a.clientId === c.clientId && a.status !== "cleared");
const screenedPeople = () => { const seen = {}; Q.state.cases.forEach((c) => { c.owners.forEach((o) => (seen[o.name] = c)); if (c.person) seen[c.person.name] = c; }); return seen; };
Q.screens.screening = () => {
  const sc = Q.state.screen, u = Q.user(), n = Object.keys(screenedPeople()).length;
  return Q.shell("screening", `<h1>Sanctions screening</h1><p class="muted">Everyone on file is re-screened each time a list changes. Clients are never told about an alert.</p>
    <div class="grid3"><div class="card stat"><b>${n}</b><span>people and companies on file</span></div><div class="card stat"><b style="font-size:22px">${Q.fmtDate(sc.lastRun)}</b><span>last full re-screen</span></div><div class="card stat"><b>${sc.alerts.filter((a) => a.status === "open").length}</b><span>open alerts</span></div></div>
    <div class="row"><button class="btn" data-act="screenAll">Record a list update and re-screen everyone</button><span class="small muted">A screen that could not run counts as not cleared.</span></div>
    <div class="card flat"><table><tr><th>Opened</th><th>Person</th><th>Client</th><th>Match</th><th>Decide by</th><th>Status</th><th></th></tr>
    ${sc.alerts.map((a) => `<tr><td class="num">${Q.fmtDate(a.opened)}</td><td><b>${Q.esc(a.person)}</b></td><td>${Q.esc(a.clientName)}</td><td>${Q.esc(a.type)}</td><td class="num">${Q.fmtDate(a.due)}</td>
      <td>${Q.tag({ open: "Open: filings blocked", cleared: "Cleared", confirmed: "Confirmed: file frozen" }[a.status], { open: "warn", cleared: "ok", confirmed: "bad" }[a.status])}${a.reason ? `<div class="small muted">${Q.esc(a.reason)} · ${Q.esc(a.by)}</div>` : ""}</td>
      <td class="right">${a.status === "open" ? (u.compliance ? `<div class="row" style="justify-content:flex-end"><button class="btn sm" data-act="alertClear" data-id="${a.id}">Clear</button><button class="btn sm ghost" data-act="alertConfirm" data-id="${a.id}">Confirm match</button></div>` : Q.tag("Waiting for Priya Nair", "warn")) : ""}</td></tr>`).join("") || `<tr><td colspan="7" class="muted">No alerts.</td></tr>`}</table></div>
    <p class="small muted">Sample time limit: ${Q.PRO_RULES.alertDays} days to settle a partial match. While an alert is open or confirmed, nothing is filed for that client.</p>`);
};
Q.actions.screenAll = () => {
  const sc = Q.state.screen, seen = screenedPeople();
  sc.lastRun = Q.day(); sc.runs++;
  // The demo raises one partial match on the first re-screen so the alert flow can be seen.
  const name = "Karim Haddad";
  if (sc.runs === 1 && seen[name]) sc.alerts.push({ id: "AL-" + (100 + sc.alerts.length), person: name, clientId: seen[name].clientId, clientName: seen[name].clientName, type: "Partial name match", opened: Q.day(), due: Q.addDays(Q.day(), Q.PRO_RULES.alertDays), status: "open" });
  Q.save(); Q.render();
};
const closeAlert = (status, ask, fallback) => (d) => {
  if (!Q.user().compliance) throw new Error("Only the compliance officer can close an alert.");
  const a = Q.state.screen.alerts.find((x) => x.id === d.id), reason = prompt(ask, fallback);
  if (!a || !reason) return;
  Object.assign(a, { status, reason, by: Q.user().name, closed: Q.day() }); Q.save(); Q.render();
};
Q.actions.alertClear = closeAlert("cleared", "Why is this not a match? The reason is kept with the alert.", "Different date of birth and nationality from the listed person.");
Q.actions.alertConfirm = closeAlert("confirmed", "Record the basis for confirming the match. The client's file is frozen.", "Identity details match the listed person.");
