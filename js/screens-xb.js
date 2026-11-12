/* Service 7, cross-border tax coordination. Every flag is a question for a named kind of adviser, never an answer. */
const XB_NOTE = `<div class="note warn"><b>Not tax advice.</b> Qantara gathers data and coordinates. A qualified adviser in that country answers the question and files.</div>`;
const xbProfile = (co, o) => ((Q.state.xb[co.id] || {})[o.name]) || null;
const xbCases = (co, o, route) => Q.byService("07").filter((c) => c.companyCase === co.id && c.xb.owner === o.name && c.route === route);
/* A flag is raised on "yes" and also on "not sure": an unknown is a question too. */
Q.xbFlags = (co) => { const out = []; co.owners.filter((o) => o.kind === "person").forEach((o) => { const p = xbProfile(co, o); if (!p) return; Q.XB.forEach(([k, route]) => { if (p[k] === "yes" || p[k] === "unsure") out.push({ co, o, route, unsure: p[k] === "unsure" }); }); }); return out; };

Q.screens.crossborder = () => {
  const cos = companiesOf(Q.user().id);
  const sel = (co, o, k, v) => `<select data-xb="${co.id}" data-owner="${Q.esc(o.name)}" data-k="${k}"><option value="">Choose</option>${[["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]].map(([val, l]) => `<option value="${val}" ${v === val ? "selected" : ""}>${l}</option>`).join("")}</select>`;
  return Q.shell("xb", `<h1>Cross-border tax</h1><p class="muted">For owners with tax ties to the United States, India or Germany. We spot the questions, gather the data and work with your adviser there.</p>${XB_NOTE}
    ${cos.map((co) => { const flags = Q.xbFlags(co), people = co.owners.filter((o) => o.kind === "person"); return `<div class="card"><h2>${Q.esc(co.company)}</h2>
      <h3>Owners' tax ties</h3><table><tr><th>Owner</th>${Q.XB.map(([, , label]) => `<th style="white-space:normal">${label}</th>`).join("")}</tr>
        ${people.map((o) => { const p = xbProfile(co, o) || {}; return `<tr><td><b>${Q.esc(o.name)}</b><div class="small muted">${o.pct}% · ${Q.esc(o.nationality)}</div></td>${Q.XB.map(([k]) => `<td>${sel(co, o, k, p[k])}</td>`).join("")}</tr>`; }).join("")}</table>
      <div id="xb-err-${co.id}"></div><div><button class="btn sm" data-act="xbSave" data-id="${co.id}">Save and check for questions</button></div>
      ${Q.state.xb[co.id] ? `<h3>Questions for an adviser (${flags.length})</h3>${flags.map((f) => { const r = Q.ROUTES[f.route], cs = xbCases(co, f.o, f.route)[0]; return `<div class="callout"><div class="card-h"><b>${Q.esc(r.question(f.o, co))}</b>${Q.tag(r.country, "dark")}</div>
          <table><tr><td class="muted">Who answers</td><td>${Q.esc(r.adviserKind)}</td></tr><tr><td class="muted">Data needed</td><td>${Q.esc(r.dataNeeded)}</td></tr><tr><td class="muted">What sets the date</td><td>${Q.esc(r.driver)}</td></tr>${f.unsure ? `<tr><td class="muted">Raised because</td><td>The answer above was "not sure"</td></tr>` : ""}</table>
          <p class="small muted">This is a question, not a conclusion, and not foreign tax advice.</p>
          <div>${cs ? `<a class="btn sm ghost" href="#/case/${cs.id}">Open the coordination case, ${cs.id}</a>` : `<button class="btn sm" data-act="xbStart" data-id="${co.id}" data-owner="${Q.esc(f.o.name)}" data-route="${f.route}">Start coordination with my adviser</button>`}</div></div>`; }).join("") || `<div class="note ok">No questions raised from these answers. Tell us if an owner's situation changes.</div>`}` : ""}</div>`; }).join("") || `<div class="card"><p class="muted">You have no licensed company yet.</p></div>`}`);
};
Q.actions.xbSave = (d) => {
  const co = myCompany(d.id); if (!co) throw new Error("Unknown company " + d.id);
  const next = {}; let missing = false;
  document.querySelectorAll(`[data-xb="${co.id}"]`).forEach((el) => { (next[el.dataset.owner] = next[el.dataset.owner] || {})[el.dataset.k] = el.value; if (!el.value) missing = true; });
  if (missing) { document.getElementById("xb-err-" + co.id).innerHTML = `<div class="note bad">Answer every question for every owner. "Not sure" is a valid answer.</div>`; return; }
  Q.state.xb[co.id] = next; Q.save(); Q.render();
};
Q.actions.xbStart = (d) => {
  const co = myCompany(d.id), o = co && co.owners.find((x) => x.name === d.owner), r = Q.ROUTES[d.route];
  if (!o || !r || r.service !== "07" || xbCases(co, o, d.route).length) throw new Error("Coordination cannot start for " + d.owner);
  const c = Q.newCase({ service: "07", companyCase: co.id, clientId: co.clientId, clientName: co.clientName, company: co.company, route: d.route, activity: co.activity, owners: co.owners, visas: 0, docs: [], kyc: Object.assign({}, co.kyc), xb: { owner: o.name, pct: o.pct, year: new Date().getFullYear() - 1 } });
  Q.state.cases.unshift(c); Q.log(c, "Asked for " + r.country + " coordination for " + o.name); Q.save(); Q.go("#/case/" + c.id);
};

/* ---- Pieces the shared case screens call ---- */
Q.about["07"] = (c) => { const r = Q.ROUTES[c.route], x = c.xb; return `<div class="card"><h3>About this coordination</h3><div class="stack-s small">
    <div><span class="muted">Owner and year</span><br>${Q.esc(x.owner)}, ${x.pct}% · tax year ${x.year}</div><div><span class="muted">Country</span><br>${Q.esc(r.country)}</div>
    <div><span class="muted">The question</span><br>${Q.esc(r.question({ name: x.owner, pct: x.pct }, c))}</div>
    <div><span class="muted">Adviser</span><br>${x.adviser ? Q.esc(x.adviser + ", " + x.firm) : "Not named yet"}</div>
    ${x.filingDate ? `<div><span class="muted">Filing date, from the adviser</span><br>${Q.fmtDate(x.filingDate)}</div><div><span class="muted">Data room due</span><br>${Q.fmtDate(x.roomDue)}</div>` : ""}
    <div><span class="muted">Fees</span><br>Qantara's fee covers data and coordination. Your adviser bills you directly.</div></div></div>${XB_NOTE}`; };
Q.doneNote["07"] = (c) => `<div class="note ok">${Q.esc(c.xb.adviser)} confirmed the filing for ${Q.esc(c.xb.owner)}. The confirmation is on record and next year's date is set.</div>`;
Q.forms["07"] = (c) => { const r = Q.ROUTES[c.route]; return `<p>You engage your own adviser: ${Q.esc(r.adviserKind.toLowerCase())}. Tell us who it is and the filing date they gave you. We work back from that date.</p>
  <div class="field-row"><label>Adviser's name<input id="xb-adv"></label><label>Firm<input id="xb-firm"></label><label>Filing date the adviser gave<input id="xb-date" type="date" min="${Q.day(1)}"></label></div>
  <label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="xb-letter" type="checkbox" style="width:auto;margin-top:4px"><span>I have signed an engagement letter with this adviser and uploaded it.</span></label>
  <label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="xb-consent" type="checkbox" style="width:auto;margin-top:4px"><span>I agree in writing that Qantara may share the data room for this case with this adviser, after I have approved its contents.</span></label>
  <div id="act-err"></div><div><button class="btn" data-act="xbAdviser" data-id="${c.id}">Save</button></div>`; };
Q.actions.xbAdviser = (d) => {
  const adv = Q.val("xb-adv"), firm = Q.val("xb-firm"), date = Q.val("xb-date"), bad = (m) => { document.getElementById("act-err").innerHTML = `<div class="note bad">${Q.esc(m)}</div>`; };
  if (!adv || !firm || !date) return bad("Give the adviser's name, the firm and the filing date.");
  if (daysTo(date) <= 0) return bad("The filing date must be in the future.");
  if (!document.getElementById("xb-letter").checked || !document.getElementById("xb-consent").checked) return bad("Both boxes are needed: the engagement letter and your consent to share.");
  act((c) => { Object.assign(c.xb, { adviser: adv, firm, filingDate: date, roomDue: Q.addDays(date, -Q.XB_RULES.roomDaysBeforeFiling), consent: Q.day() }); Q.log(c, "Named the adviser (" + adv + ", " + firm + "), gave the filing date and consented to sharing"); Q.advance(c); })(d);
};
const packList = (c) => `<table>${Q.XB_PACK.map((p) => `<tr><td>${Q.esc(p)}</td><td class="right">${Q.tag("From the company's records", "plain")}</td></tr>`).join("")}<tr><td>Currency statement</td><td class="right small">Amounts are in AED. No conversion is made.</td></tr></table>`;
const reportBase = Q.reportBody;
Q.reportBody = (c) => (c.service !== "07" ? reportBase(c) : `<p>This is what will be shared with <b>${Q.esc(c.xb.adviser)}, ${Q.esc(c.xb.firm)}</b>, and with nobody else. Approve by typing your full name.</p>${packList(c)}<p class="small muted">Prepared by ${Q.esc(c.xb.preparedBy)}, checked by ${Q.esc(c.xb.checkedBy)}.</p>`);
Q.roomPanel = (c) => `<p>Build the data room for ${Q.esc(c.xb.owner)}, tax year ${c.xb.year}, from the company's closed books. Due ${Q.fmtDate(c.xb.roomDue)}, ${Q.XB_RULES.roomDaysBeforeFiling} days before the adviser's filing date.</p>${packList(c)}
  <label>Note for the record<input id="task-note" placeholder="e.g. Statements taken from the closed books for the year"></label><div><button class="btn" data-act="taskDone" data-id="${c.id}">Pack built: send for a second check</button></div>`;
Q.secondPanel = (c) => { const same = c.xb.preparedBy === Q.user().name; return `<p>Prepared by ${Q.esc(c.xb.preparedBy)}. A different person must check the pack before the client sees it.</p>${packList(c)}
  <div>${same ? Q.tag("You prepared this pack. Someone else must check it", "warn") : `<button class="btn" data-act="xbSecond" data-id="${c.id}">Checked: release to the client for approval</button>`}</div>`; };
Q.actions.xbSecond = sact((c) => { if (Q.cur(c).type !== "second" || c.xb.preparedBy === Q.user().name) throw new Error("The second check must be done by a different person."); c.xb.checkedBy = Q.user().name; Q.log(c, "Second check done"); Q.advance(c); });
/* Remember who built the pack, so the second check cannot be the same person. */
const taskDoneBase = Q.actions.taskDone;
Q.actions.taskDone = (d) => { const c = Q.getCase(d.id); if (c && c.service === "07" && Q.cur(c) && Q.cur(c).dataRoom) c.xb.preparedBy = Q.user().name; taskDoneBase(d); };
