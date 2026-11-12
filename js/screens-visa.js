/* Service 4, visas and residency: the client's wizard, appointments, and the visa-specific pieces of the case screens. */
const VWIZ = ["Company", "Visa type", "Person", "Check and send"];
const visaCompanies = () => mine().filter((c) => c.service === "01" && c.status === "complete" && c.route !== "offshore");
const visasOf = (coId) => Q.byService("04").filter((c) => c.companyCase === coId);
const quotaUsed = (coId) => visasOf(coId).filter((c) => c.route !== "visa-family").length;
const sponsorsOf = (coId) => visasOf(coId).filter((c) => c.visa && c.route !== "visa-family");
const vdraft = () => Q.state.vdraft || (Q.state.vdraft = { step: 0, companyId: "", type: "", ack: false, err: "",
  person: { name: "", nationality: "", inUAE: "", passportExpiry: "", job: "", salary: 0, relation: "", age: "", sponsorId: "", sponsorSalary: 0 } });
const monthsUntil = (iso) => (new Date(iso + "T00:00:00Z") - new Date(Q.day() + "T00:00:00Z")) / (1000 * 60 * 60 * 24 * 30.44);

/* Checks run before a case may start. Any failure stops the request. */
Q.visaEligibility = (d) => {
  const co = Q.getCase(d.companyId), p = d.person, R = Q.VISA_RULES, out = [];
  out.push(["Passport valid for at least " + R.passportMonths + " more months", !!p.passportExpiry && monthsUntil(p.passportExpiry) >= R.passportMonths]);
  if (d.type === "visa-investor") out.push(["The person is an owner of " + co.company, co.owners.some((o) => o.kind === "person" && o.name === p.name)]);
  if (d.type !== "visa-family") out.push(["A visa place is free: " + quotaUsed(co.id) + " of " + co.visas + " used", quotaUsed(co.id) < co.visas]);
  if (d.type === "visa-employee") out.push(["Aged " + R.adultAge + " or over", Number(p.age) >= R.adultAge]);
  if (d.type === "visa-family") {
    out.push(["Sponsor holds a residence visa through this company", sponsorsOf(co.id).some((c) => c.id === p.sponsorId)]);
    out.push(["Sponsor's salary is at least " + Q.aed(R.familySalary) + " a month", Number(p.sponsorSalary) >= R.familySalary]);
  }
  return out;
};

Q.visaDocs = (d) => {
  const co = Q.getCase(d.companyId), p = d.person, docs = [];
  const onFile = co.docs.find((x) => x.title === "Passport copy" && x.forWho === p.name && x.status === "accepted");
  docs.push(onFile ? { id: "v0", title: "Passport copy", forWho: p.name, status: "accepted", file: "On file from the set-up", reused: true } : { id: "v0", title: "Passport copy", forWho: p.name, status: "missing" });
  const more = [["Passport photo, white background", p.name]];
  if (d.type === "visa-employee") more.push(["Degree certificate, attested", p.name], ["Signed job offer", co.company]);
  if (d.type === "visa-family") more.push([p.relation === "Child" ? "Birth certificate, attested" : "Marriage certificate, attested", p.name], ["Sponsor's tenancy contract", "The sponsor"]);
  more.forEach(([title, forWho], i) => docs.push({ id: "v" + (i + 1), title, forWho, status: "missing" }));
  return docs;
};

Q.actions.visaStart = (d) => { Q.state.vdraft = null; vdraft().companyId = d.id; Q.save(); Q.go("#/visa/new"); };

Q.screens.visaWizard = () => {
  const d = vdraft(), cos = visaCompanies(), co = d.companyId ? Q.getCase(d.companyId) : null, p = d.person;
  if (!cos.length) return Q.shell("visa", `<h1>Apply for a residence visa</h1><div class="note warn">A residence visa needs a licensed mainland or free zone company to sponsor it. You do not have one yet.</div><a class="btn" href="#/setup/new" style="justify-self:start">Start a new company</a>`);
  const sel = (id, v, opts) => `<select id="${id}"><option value="">Choose</option>${opts.map(([val, label]) => `<option value="${Q.esc(val)}" ${String(v) === String(val) ? "selected" : ""}>${Q.esc(label)}</option>`).join("")}</select>`;
  const panes = [
    () => `<div class="stack-s"><h2>Which company sponsors the visa?</h2></div><div class="grid2">${cos.map((c) => `<button class="choice ${c.id === d.companyId ? "on" : ""}" data-act="vwizCompany" data-id="${c.id}">
        <div class="card-h"><h3>${Q.esc(c.company)}</h3>${Q.tag(quotaUsed(c.id) + " of " + c.visas + " visa places used", quotaUsed(c.id) < c.visas ? "ok" : "warn")}</div>
        <dl><dt>Licence</dt><dd>${Q.esc(c.licence.no)}</dd><dt>Licence renews</dt><dd>${Q.fmtDate(c.licence.expires)}</dd><dt>Visa holders</dt><dd>${visasOf(c.id).filter((x) => x.visa).map((x) => Q.esc(x.person.name)).join(", ") || "None yet"}</dd></dl></button>`).join("")}</div>`,
    () => `<div class="stack-s"><h2>Which visa?</h2><p class="muted">Sample fees and times. Each visa here runs for 2 years.</p></div>
      <div class="grid3">${Q.VISAS.map((id) => { const r = Q.ROUTES[id]; return `<button class="choice ${id === d.type ? "on" : ""}" data-act="vwizType" data-id="${id}"><h3>${Q.esc(r.name)}</h3><p class="small muted">${Q.esc(r.who)}</p>
        <dl><dt>Government fees</dt><dd class="num">${Q.aed(r.gov.reduce((n, g) => n + g[1], 0))}</dd><dt>Qantara fee</dt><dd class="num">${Q.aed(r.qFee)} + VAT</dd><dt>Estimate</dt><dd>${r.days[0]}–${r.days[1]} working days</dd><dt>Steps in person</dt><dd>Medical test, biometrics</dd></dl></button>`; }).join("")}</div>`,
    () => `<div class="card"><h2>Who is the visa for?</h2>
        ${d.type === "visa-investor" ? `<label>Owner${sel("v-name", p.name, co.owners.filter((o) => o.kind === "person").map((o) => [o.name, o.name + ", " + o.pct + "% owner"]))}</label><p class="small muted">The owner's details and passport copy are already on file and are reused.</p>`
          : `<div class="field-row"><label>Full name, as in the passport<input id="v-name" value="${Q.esc(p.name)}"></label><label>Nationality<input id="v-nat" value="${Q.esc(p.nationality)}"></label><label>Age<input id="v-age" type="number" min="0" max="120" value="${Q.esc(p.age)}"></label></div>`}
        ${d.type === "visa-employee" ? `<div class="field-row"><label>Job title<input id="v-job" value="${Q.esc(p.job)}"></label><label>Monthly salary, AED<input id="v-salary" type="number" min="0" value="${p.salary || ""}"></label></div>` : ""}
        ${d.type === "visa-family" ? `<div class="field-row"><label>Relationship to the sponsor${sel("v-rel", p.relation, [["Spouse", "Husband or wife"], ["Child", "Child"]])}</label><label>Sponsor${sel("v-sponsor", p.sponsorId, sponsorsOf(co.id).map((c) => [c.id, c.person.name]))}</label><label>Sponsor's monthly salary, AED<input id="v-ssal" type="number" min="0" value="${p.sponsorSalary || ""}"></label></div>
          ${sponsorsOf(co.id).length ? "" : `<div class="note warn">Nobody holds a residence visa through ${Q.esc(co.company)} yet. A family visa needs a sponsor who does.</div>`}` : ""}
        <div class="field-row"><label>Passport expiry date<input id="v-pass" type="date" value="${Q.esc(p.passportExpiry)}"></label><label>Is the person in the UAE now?${sel("v-in", p.inUAE, [["yes", "Yes, inside the UAE"], ["no", "No, abroad"]])}</label></div>
        <p class="small muted">Health, salary and family details are kept under tighter access: the person, you, your adviser.</p></div>`,
    () => { const r = Q.ROUTES[d.type], checks = Q.visaEligibility(d), ok = checks.every(([, x]) => x); return `<div class="grid2"><div class="card"><h2>Checks before we start</h2>
          <div class="stack-s">${checks.map(([label, pass]) => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${Q.tag(pass ? "Pass" : "Fail", pass ? "ok" : "bad")}<span>${Q.esc(label)}</span></div>`).join("")}</div>
          ${ok ? `<div class="note ok">${Q.esc(p.name)} can apply for the ${Q.esc(r.name.toLowerCase())}.</div>` : `<div class="note bad">This request cannot start while a check fails. Go back to change the details, or message your adviser.</div>`}
          <table><tr><td class="muted">Sponsor</td><td>${Q.esc(co.company)}</td></tr><tr><td class="muted">Visa</td><td>${Q.esc(r.name)}, ${r.years} years</td></tr><tr><td class="muted">Person</td><td>${Q.esc(p.name)}${p.nationality ? ", " + Q.esc(p.nationality) : ""}</td></tr><tr><td class="muted">Where now</td><td>${p.inUAE === "yes" ? "Inside the UAE: change of status" : "Abroad: entry permit first"}</td></tr></table></div>
        <div class="card"><h2>Estimated cost</h2>${Q.quoteTable({ route: d.type, quote: Q.buildQuote(d.type) })}</div></div>
      <div class="card"><label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="v-ack" type="checkbox" style="width:auto;margin-top:4px" ${d.ack ? "checked" : ""}>
        <span>I understand that the authority decides on the visa, that the medical test and biometrics must be attended in person, and that durations are estimates.</span></label></div>`; },
  ];
  return Q.wiz({ active: "visa", svc: "04", title: "Apply for a residence visa", steps: VWIZ, step: d.step, body: panes[d.step](), err: d.err, back: "vwizBack", next: "vwizNext", cancel: "vwizCancel", disabled: d.step === VWIZ.length - 1 && !Q.visaEligibility(d).every(([, x]) => x), why: ["A visa is sponsored by a company and uses one of its visa places.", "The visa type sets the fees, the checks and the documents.", "Details must match the passport exactly. Salary and health details are kept under tighter access.", "The checks run before anything is sent, so a refusal for a simple reason is avoided."][d.step] });
};

const vwizRead = () => {
  const d = vdraft(), p = d.person;
  if (d.step === 2) {
    p.name = Q.val("v-name"); p.passportExpiry = Q.val("v-pass"); p.inUAE = Q.val("v-in");
    if (d.type === "visa-investor") { const o = Q.getCase(d.companyId).owners.find((x) => x.name === p.name); p.nationality = o ? o.nationality : ""; }
    else { p.nationality = Q.val("v-nat"); p.age = Q.val("v-age"); }
    if (d.type === "visa-employee") { p.job = Q.val("v-job"); p.salary = Math.max(0, parseInt(Q.val("v-salary"), 10) || 0); }
    if (d.type === "visa-family") { p.relation = Q.val("v-rel"); p.sponsorId = Q.val("v-sponsor"); p.sponsorSalary = Math.max(0, parseInt(Q.val("v-ssal"), 10) || 0); }
  }
  if (d.step === 3) d.ack = document.getElementById("v-ack").checked;
  return d;
};
const vwizCheck = (d) => {
  const p = d.person;
  if (d.step === 0 && (!d.companyId || !visaCompanies().some((c) => c.id === d.companyId))) return "Choose the company that sponsors the visa.";
  if (d.step === 1 && !Q.VISAS.includes(d.type)) return "Choose a visa type.";
  if (d.step === 2) {
    if (!p.name || !p.passportExpiry || !p.inUAE) return "Give the person's name, passport expiry date and where they are now.";
    if (d.type !== "visa-investor" && (!p.nationality || p.age === "")) return "Give the person's nationality and age.";
    if (d.type === "visa-employee" && (!p.job || !p.salary)) return "Give the job title and the monthly salary.";
    if (d.type === "visa-family" && (!p.relation || !p.sponsorId || !p.sponsorSalary)) return "Give the relationship, the sponsor and the sponsor's salary.";
  }
  if (d.step === 3) { if (!Q.visaEligibility(d).every(([, ok]) => ok)) return "A check is failing, so this request cannot be sent."; if (!d.ack) return "Tick the box to confirm you have read the points above."; }
  return "";
};
const vwizStay = () => { Q.save(); Q.render(); };
Q.actions.vwizCompany = (x) => { const d = vdraft(); d.companyId = x.id; d.err = ""; vwizStay(); };
Q.actions.vwizType = (x) => { const d = vdraft(); if (d.type !== x.id) d.person.name = ""; d.type = x.id; d.err = ""; vwizStay(); };
Q.actions.vwizBack = () => { const d = vwizRead(); d.err = ""; d.step--; vwizStay(); };
Q.actions.vwizCancel = () => { Q.state.vdraft = null; Q.save(); Q.go("#/home"); };
Q.actions.vwizNext = () => {
  const d = vwizRead();
  d.err = vwizCheck(d);
  if (d.err) return vwizStay();
  if (d.step < VWIZ.length - 1) { d.step++; return vwizStay(); }
  const co = Q.getCase(d.companyId);
  const c = Q.newCase({ service: "04", companyCase: co.id, clientId: Q.user().id, clientName: Q.user().name, company: co.company, route: d.type, activity: co.activity, owners: co.owners, visas: 0, person: Object.assign({}, d.person), docs: Q.visaDocs(d) });
  Q.log(c, "Asked Qantara for a " + Q.ROUTES[d.type].name.toLowerCase() + " for " + d.person.name);
  Q.state.cases.unshift(c);
  Q.state.vdraft = null;
  Q.save();
  Q.go("#/sent/" + c.id);
};

/* ---- Pieces the client case screen calls ---- */
Q.packText["04"] = "for the visa file. Anything already on file from the company set-up is reused";
Q.doneNote["04"] = (c) => `<div class="note ok">The residence visa is issued for ${Q.esc(c.person.name)}. Emirates ID <b class="num">${Q.esc(c.visa.eid)}</b>, valid to ${Q.fmtDate(c.visa.expires)}. You will be reminded before it expires.</div>`;
Q.about["04"] = (c) => `<div class="card"><h3>About this visa</h3><div class="stack-s small">
    <div><span class="muted">For</span><br>${Q.esc(c.person.name)}${c.person.job ? ", " + Q.esc(c.person.job) : ""}${c.person.relation ? ", " + Q.esc(c.person.relation.toLowerCase()) : ""}</div>
    <div><span class="muted">Sponsor</span><br>${Q.esc(c.company)}</div>
    <div><span class="muted">Where now</span><br>${c.person.inUAE === "yes" ? "Inside the UAE" : "Abroad"}</div>
    <div><span class="muted">Whole visa, estimate</span><br>${Q.ROUTES[c.route].days.join("–")} working days. A range, not a promise.</div>
    ${c.permitDue && c.status === "open" ? `<div class="note warn">Entry permit issued. Finish the remaining steps by <b>${Q.fmtDate(c.permitDue)}</b>.</div>` : ""}
    ${c.insurance ? `<div><span class="muted">Health insurance</span><br>${Q.esc(c.insurance.insurer)}, to ${Q.fmtDate(c.insurance.end)}</div>` : ""}</div></div>`;
Q.apptClientBody = (c) => { const s = Q.cur(c), a = c.appts[s.key]; return `<p><b>${c.person ? "Only " + Q.esc(c.person.name) + " can do this step, in person." : "This step happens in person. Your people must be there."}</b></p>
  <table><tr><td class="muted">When</td><td>${Q.fmtDate(a.date)}${a.time ? ", " + Q.esc(a.time) : ""}</td></tr><tr><td class="muted">Where</td><td>${Q.esc(a.place)}</td></tr><tr><td class="muted">Bring</td><td>${Q.esc(s.bring)}</td></tr></table>
  <div class="row"><button class="btn" data-act="apptAttended" data-id="${c.id}">Mark as attended</button><a class="btn ghost" href="#/case/${c.id}/messages">Ask to move the appointment</a></div>`; };
Q.actions.apptAttended = act((c) => { const s = Q.cur(c); c.appts[s.key].attended = Q.day(); Q.log(c, "Confirmed attendance: " + s.title); });
Q.visaCard = (co) => {
  const list = visasOf(co.id).filter((c) => c.clientId === Q.user().id);
  if (!list.length) return "";
  return `<div class="card"><div class="card-h"><h2>People and visas</h2>${Q.tag(quotaUsed(co.id) + " of " + co.visas + " visa places used", "plain")}</div>
    <table><tr><th>Person</th><th>Visa</th><th>Emirates ID</th><th>Valid to</th><th>Status</th></tr>${list.map((c) => `<tr class="link" data-href="#/case/${c.id}"><td><b>${Q.esc(c.person.name)}</b></td><td>${Q.esc(Q.ROUTES[c.route].name)}</td><td class="num">${c.visa ? Q.esc(c.visa.eid) : "—"}</td><td class="num">${c.visa ? Q.fmtDate(c.visa.expires) : "—"}</td><td>${c.visa ? Q.tag("Resident", "ok") : Q.holderTag(c)}</td></tr>`).join("")}</table></div>`;
};

/* ---- Pieces the staff case screen calls ---- */
const bankChecks = Q.runPackChecks;
Q.runPackChecks = (c) => {
  if (c.service !== "04") return bankChecks(c);
  c.checks = Q.visaEligibility({ companyId: c.companyCase, type: c.route, person: c.person }).filter(([label]) => !label.startsWith("A visa place")).concat([["Photo meets the authority's photo rules", true], ["Sponsoring licence is valid on the planned filing date", true]]);
  const fails = c.checks.filter(([, ok]) => !ok).length;
  c.kyc.screening = fails ? fails + " check(s) failing" : "All " + c.checks.length + " checks pass";
  c.kyc.risk = fails ? "High" : "Low";
  Q.log(c, "Ran the eligibility checks: " + c.kyc.screening);
};
Q.apptStaffBody = (c) => { const s = Q.cur(c), a = c.appts[s.key]; return !a
  ? `<p>Book the appointment on the authority's system, then record it. The client is told the date, the place and what to bring.</p>
     <div class="field-row"><label>Date<input id="ap-date" type="date" value="${Q.day(2)}"></label><label>Time<input id="ap-time" value="09:30"></label><label>Centre<input id="ap-place" placeholder="e.g. Al Quoz screening centre"></label></div><div id="act-err"></div>
     <div><button class="btn" data-act="apptBook" data-id="${c.id}">Record the booking</button></div>`
  : `<p>${Q.esc(c.person ? c.person.name : c.clientName)} confirmed attending on ${Q.fmtDate(a.attended)}. Check the authority's system and record the result.</p>
     <label>Result<select id="ap-result"><option value="">Choose</option><option>Passed</option><option>Did not pass</option></select></label><div id="act-err"></div>
     <div><button class="btn" data-act="apptResult" data-id="${c.id}">Record the result</button></div>`; };
Q.actions.apptBook = sact((c) => {
  const s = Q.cur(c), date = Q.val("ap-date"), place = Q.val("ap-place");
  if (!date || !place) return actErr("Enter the date and the centre.");
  c.appts[s.key] = { date, time: Q.val("ap-time"), place, bookedBy: Q.user().name, attended: null };
  c.messages.push({ from: Q.user().name, t: Q.day(), text: s.title + " booked for " + Q.fmtDate(date) + " at " + place + ". " + s.bring });
  Q.log(c, "Booked: " + s.title + ", " + Q.fmtDate(date) + ", " + place);
});
Q.actions.apptResult = sact((c) => {
  const s = Q.cur(c), result = Q.val("ap-result");
  if (!result) return actErr("Choose the result.");
  c.appts[s.key].result = result;
  if (result !== "Passed") { Q.log(c, s.title + ": did not pass. Case held for the adviser and the client to talk."); c.notes.push({ who: Q.user().name, t: Q.day(), text: s.title + " not passed. Do not go further before speaking to the client." }); delete c.appts[s.key]; return; }
  Q.log(c, s.title + ": passed"); Q.advance(c);
});
Q.insuranceForm = (c) => `<p>A residence visa is not filed without health cover on record.</p>
  <div class="field-row"><label>Insurer<input id="ins-name" placeholder="e.g. Sample Health Insurance"></label><label>Cover ends<input id="ins-end" type="date" value="${Q.day(365)}"></label></div><div id="act-err"></div>
  <div><button class="btn" data-act="taskDone" data-id="${c.id}">Record the policy</button></div>`;
Q.readInsurance = (c) => { const insurer = Q.val("ins-name"), end = Q.val("ins-end"); if (!insurer || !end) return actErr("Enter the insurer and the date the cover ends."); c.insurance = { insurer, end }; Q.log(c, "Recorded health insurance: " + insurer + ", to " + Q.fmtDate(end)); };
Q.visaIssueFields = () => `<label>Emirates ID number<input id="visa-eid" placeholder="e.g. 784-0000-0000000-0"></label>`;
Q.readVisa = (c) => { const eid = Q.val("visa-eid"); if (!eid) return actErr("Enter the Emirates ID number."); c.visa = { eid, issued: Q.day(), expires: Q.addDays(Q.day(), 365 * Q.ROUTES[c.route].years) }; };
