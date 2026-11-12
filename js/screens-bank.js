/* Service 3, bank account opening: the client's application wizard and the bank-specific pieces of the case screens. */
const BWIZ = ["Company", "Business profile", "Choose a bank", "Check and send"];
const myCompanies = () => mine().filter((c) => c.service === "01" && c.status === "complete");
const openBankCase = (companyId) => Q.byService("03").find((c) => c.companyCase === companyId && c.status === "open");
const bdraft = () => Q.state.bdraft || (Q.state.bdraft = { step: 0, companyId: "", bank: "", ack: false, err: "",
  p: { purpose: "", monthlyIn: 0, monthlyOut: 0, customers: "", suppliers: "", resident: "", sanctioned: "", pep: "", taxCountry: "", tin: "" } });
const yn = (id, v) => `<select id="${id}"><option value="">Choose</option><option value="yes" ${v === true ? "selected" : ""}>Yes</option><option value="no" ${v === false ? "selected" : ""}>No</option></select>`;
const profileFor = (d) => Object.assign({}, d.p, { layered: Q.getCase(d.companyId).owners.some((o) => o.kind === "company") });
const bankFacts = (r) => `<dl><dt>Monthly fee</dt><dd class="num">${Q.aed(r.monthly)}</dd><dt>Minimum balance</dt><dd class="num">${Q.aed(r.minBal)}</dd><dt>International transfer</dt><dd class="num">${r.transfer ? Q.aed(r.transfer) + " each" : "Included"}</dd><dt>Stated opening time</dt><dd>${Q.esc(r.opening)}</dd></dl>`;

Q.actions.bankStart = (d) => { Q.state.bdraft = null; bdraft().companyId = d.id; Q.save(); Q.go("#/bank/new"); };

Q.screens.bankWizard = () => {
  const d = bdraft(), cos = myCompanies(), co = d.companyId ? Q.getCase(d.companyId) : null, p = d.p;
  if (!cos.length) return Q.shell("bank", `<h1>Open a bank account</h1><div class="note warn">A bank account needs a licensed company first. None of your companies has its licence yet.</div><a class="btn" href="#/setup/new" style="justify-self:start">Start a new company</a>`);
  const panes = [
    () => `<div class="stack-s"><h2>Which company is the account for?</h2></div><div class="grid2">${cos.map((c) => `<button class="choice ${c.id === d.companyId ? "on" : ""}" data-act="bwizCompany" data-id="${c.id}">
        <div class="card-h"><h3>${Q.esc(c.company)}</h3>${openBankCase(c.id) ? Q.tag("Application already open", "warn") : Q.tag("Licence active", "ok")}</div>
        <dl><dt>Licence</dt><dd>${Q.esc(c.licence.no)}</dd><dt>Owners</dt><dd>${c.owners.map((o) => Q.esc(o.name) + " " + o.pct + "%").join(", ")}</dd><dt>Already on file</dt><dd>${c.docs.length + 1} documents, reused for the bank</dd></dl></button>`).join("")}</div>`,
    () => `<div class="card"><h2>About the business</h2><p class="small muted">Banks ask these questions. You answer once; the answers are reused for every bank.</p>
        <label>What is the account for?<input id="b-purpose" value="${Q.esc(p.purpose)}" placeholder="e.g. Receive client fees and pay suppliers"></label>
        <div class="field-row"><label>Expected money in, AED a month<input id="b-in" type="number" min="0" value="${p.monthlyIn || ""}"></label><label>Expected money out, AED a month<input id="b-out" type="number" min="0" value="${p.monthlyOut || ""}"></label></div>
        <div class="field-row"><label>Main customers' countries<input id="b-cust" value="${Q.esc(p.customers)}" placeholder="e.g. UAE, Germany"></label><label>Main suppliers' countries<input id="b-supp" value="${Q.esc(p.suppliers)}" placeholder="e.g. UAE, India"></label></div></div>
      <div class="card"><h2>Declarations</h2>
        <div class="field-row"><label>Does a signatory live in the UAE with a valid residence visa?${yn("b-res", p.resident)}</label><label>Any trade with a sanctioned country?${yn("b-sanc", p.sanctioned)}</label><label>Is any owner a politically exposed person?${yn("b-pep", p.pep)}</label></div>
        <div class="field-row"><label>Company's country of tax residence<input id="b-tax" value="${Q.esc(p.taxCountry)}" placeholder="e.g. United Arab Emirates"></label><label>Tax number there, if it has one<input id="b-tin" value="${Q.esc(p.tin)}" placeholder="Leave empty if none yet"></label></div>
        <p class="small muted">Only you, your adviser and the compliance officer see these answers.</p></div>`,
    () => { const pf = profileFor(d); return `<div class="stack-s"><h2>Which bank?</h2><p class="muted">Each bank is checked against your company. Where a bank would not accept it, the rule is named. Sample figures, checked ${Q.fmtDate(Q.day(-30))}.</p></div>
      <div class="grid3">${Q.BANKS.map((id) => { const r = Q.ROUTES[id], ok = Q.bankPasses(pf, id); return `<button class="choice ${id === d.bank ? "on" : ""}" ${ok ? `data-act="bwizBank" data-id="${id}"` : `disabled style="cursor:not-allowed;opacity:0.75"`}>
        <div class="card-h"><h3>${Q.esc(r.name)}</h3>${Q.tag(ok ? "Your company fits" : "Does not fit", ok ? "ok" : "bad")}</div>${bankFacts(r)}
        <div class="stack-s small">${Q.bankMatch(pf, id).map(([label, pass]) => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${Q.tag(pass ? "Pass" : "Fail", pass ? "ok" : "bad")}<span>${Q.esc(label)}</span></div>`).join("")}</div></button>`; }).join("")}</div>
      ${Q.BANKS.some((id) => Q.bankPasses(pf, id)) ? "" : `<div class="note warn">No bank on our list fits these answers as they stand. ${pf.sanctioned ? "A declared link to a sanctioned country goes to the compliance officer before any bank is approached. " : ""}Message your adviser to talk it through.</div>`}`; },
    () => { const r = Q.ROUTES[d.bank]; return `<div class="grid2"><div class="card"><h2>Your application</h2><table>
          <tr><td class="muted">Company</td><td>${Q.esc(co.company)}</td></tr><tr><td class="muted">Bank</td><td>${Q.esc(r.name)}</td></tr><tr><td class="muted">Account purpose</td><td>${Q.esc(p.purpose)}</td></tr>
          <tr><td class="muted">Money in / out a month</td><td class="num">${Q.aed(p.monthlyIn)} / ${Q.aed(p.monthlyOut)}</td></tr><tr><td class="muted">Bank's stated opening time</td><td>${Q.esc(r.opening)}</td></tr></table></div>
        <div class="card"><h2>Qantara's fee</h2>${Q.quoteTable({ route: d.bank, quote: Q.buildQuote(d.bank) })}</div></div>
      <div class="card"><label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="b-ack" type="checkbox" style="width:auto;margin-top:4px" ${d.ack ? "checked" : ""}>
        <span>I understand that the bank alone decides whether to open the account, that Qantara prepares the file and cannot promise an account, and that only I apply and sign in at the bank. I will not share a banking login or one-time code with anyone.</span></label></div>`; },
  ];
  return Q.wiz({ active: "bank", svc: "03", title: "Open a bank account", steps: BWIZ, step: d.step, body: panes[d.step](), err: d.err, back: "bwizBack", next: "bwizNext", cancel: "bwizCancel", why: ["The bank file reuses what is already on the company's record.", "Banks ask these questions. You answer once and the answers are reused.", "Each bank has its own rules. A bank your company does not fit cannot be chosen.", "The bank alone decides. Qantara prepares the file and tracks it."][d.step] });
};

const toBool = (v) => (v === "yes" ? true : v === "no" ? false : "");
const bwizRead = () => {
  const d = bdraft(), p = d.p;
  if (d.step === 1) Object.assign(p, { purpose: Q.val("b-purpose"), monthlyIn: Math.max(0, parseInt(Q.val("b-in"), 10) || 0), monthlyOut: Math.max(0, parseInt(Q.val("b-out"), 10) || 0), customers: Q.val("b-cust"), suppliers: Q.val("b-supp"),
    resident: toBool(Q.val("b-res")), sanctioned: toBool(Q.val("b-sanc")), pep: toBool(Q.val("b-pep")), taxCountry: Q.val("b-tax"), tin: Q.val("b-tin") });
  if (d.step === 3) d.ack = document.getElementById("b-ack").checked;
  return d;
};
const bwizCheck = (d) => {
  const p = d.p;
  if (d.step === 0) { if (!d.companyId || !myCompanies().some((c) => c.id === d.companyId)) return "Choose the company the account is for."; if (openBankCase(d.companyId)) return "This company already has a bank application open. Finish that one first."; }
  if (d.step === 1) { if (!p.purpose || !p.customers || !p.suppliers || !p.taxCountry) return "Answer every question about the business. Only the tax number may be left empty."; if (!p.monthlyIn) return "Give the expected money in each month."; if ([p.resident, p.sanctioned, p.pep].includes("")) return "Answer all three declarations with yes or no."; }
  if (d.step === 2 && (!d.bank || !Q.bankPasses(profileFor(d), d.bank))) return "Choose a bank your company fits.";
  if (d.step === 3 && !d.ack) return "Tick the box to confirm you have read the points above.";
  return "";
};
const bwizStay = () => { Q.save(); Q.render(); };
Q.actions.bwizCompany = (x) => { const d = bdraft(); d.companyId = x.id; d.err = ""; bwizStay(); };
Q.actions.bwizBank = (x) => { const d = bdraft(); d.bank = x.id; d.err = ""; bwizStay(); };
Q.actions.bwizBack = () => { const d = bwizRead(); d.err = ""; d.step--; bwizStay(); };
Q.actions.bwizCancel = () => { Q.state.bdraft = null; Q.save(); Q.go("#/home"); };
Q.actions.bwizNext = () => {
  const d = bwizRead();
  d.err = bwizCheck(d);
  if (d.err) return bwizStay();
  if (d.step < BWIZ.length - 1) { d.step++; return bwizStay(); }
  const co = Q.getCase(d.companyId);
  const c = Q.newCase({ service: "03", companyCase: co.id, clientId: Q.user().id, clientName: Q.user().name, company: co.company, route: d.bank, activity: co.activity, owners: co.owners, visas: 0, profile: profileFor(d), docs: Q.bankDocs(co), bankHistory: [] });
  Q.log(c, "Asked Qantara to prepare a bank application to " + Q.ROUTES[d.bank].authority);
  Q.state.cases.unshift(c);
  Q.state.bdraft = null;
  Q.save();
  Q.go("#/sent/" + c.id);
};

/* ---- Pieces the client case screen calls ---- */
Q.packText["03"] = "to complete the bank pack. Everything from your company set-up is already on file";
Q.bankApplyBody = (c) => { const r = Q.ROUTES[c.route]; return `<p>Your pack is ready and approved. <b>Only you can do this step:</b> apply in the ${Q.esc(r.portal)} yourself, with the pack below. The bank checks your identity directly with you.</p>
  <div class="note warn">Never give anyone a banking login or a one-time code. Qantara will not ask for one.</div>
  <div><button class="btn ghost sm" data-act="packDownload" data-id="${c.id}">Download the pack (${c.docs.length} documents, one indexed file)</button></div>
  <div class="field-row"><label>Application reference the bank gave you<input id="apply-ref" placeholder="e.g. BA-2026-00318"></label><button class="btn" data-act="bankApplied" data-id="${c.id}">I have applied</button></div><div id="act-err"></div>`; };
Q.bankDoneNote = (c) => `<div class="note ok">The account is open. IBAN <b class="num">${Q.esc(c.account.iban)}</b>. The conditions the bank set are on the company profile, and you will be warned before one is at risk.</div>`;
Q.bankAbout = (c) => { const r = Q.ROUTES[c.route]; return `<div class="card"><h3>About this application</h3>${bankFacts(r).replace("<dl>", `<dl style="margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13.5px">`)}
  <p class="small muted">The bank's own figures (sample). Qantara prepares the file; the bank decides.</p>
  ${c.bankHistory.length ? `<h3>Banks approached before</h3>${c.bankHistory.map((h) => `<div class="small">${Q.esc(h.bank)} · ${Q.tag("Refused", "bad")}<br><span class="muted">${Q.fmtDate(h.date)} · ${Q.esc(h.reason)}</span></div>`).join("")}` : ""}</div>`; };
Q.bankAccountsCard = (co) => {
  const accts = Q.byService("03").filter((c) => c.companyCase === co.id && c.clientId === Q.user().id);
  if (!accts.length) return "";
  return `<div class="card"><h2>Bank accounts</h2><table><tr><th>Bank</th><th>IBAN</th><th class="right">Monthly fee</th><th class="right">Minimum balance</th><th>Status</th></tr>${accts.map((c) => `<tr class="link" data-href="#/case/${c.id}"><td>${Q.esc(Q.ROUTES[c.route].authority)}</td><td class="num">${c.account ? Q.esc(c.account.iban) : "—"}</td><td class="right num">${c.account ? Q.aed(c.account.monthly) : "—"}</td><td class="right num">${c.account ? Q.aed(c.account.minBal) : "—"}</td><td>${c.account ? Q.tag("Open", "ok") : Q.holderTag(c)}</td></tr>`).join("")}</table>
    ${accts.some((c) => c.account) ? `<p class="small muted">Watched for you: the minimum balance, and the trade licence renewal the bank relies on.</p>` : ""}</div>`;
};
Q.actions.packDownload = act((c) => { Q.log(c, "Downloaded the bank pack"); });
Q.actions.bankApplied = (d) => {
  const ref = Q.val("apply-ref");
  if (!ref) { document.getElementById("act-err").innerHTML = `<div class="note bad">Enter the reference the bank gave you.</div>`; return; }
  act((c) => {
    const r = Q.ROUTES[c.route];
    Q.log(c, "Applied at " + r.authority + " in person or in its app, reference " + ref);
    c.submissions.push({ step: "Application", authority: r.authority, portal: r.portal, ref, by: Q.user().name + " (client)", date: Q.day(), outcome: "Waiting" });
    Q.advance(c);
    c.sub.decision = { state: "submitted", ref, round: 1 };
  })(d);
};

Q.about["03"] = (c) => Q.bankAbout(c); Q.doneNote["03"] = (c) => Q.bankDoneNote(c);
/* ---- Pieces the staff case screen calls ---- */
Q.runPackChecks = (c) => {
  const p = c.profile;
  c.checks = [
    ["Names and shares match across the licence, the memorandum and the answers", true],
    ["No document will be older than the bank's limit on the day of applying", true],
    ["Company still fits the chosen bank's rules", Q.bankPasses(p, c.route)],
    ["A signatory lives in the UAE", p.resident === true],
    ["Sanctioned-country trade declared as none", p.sanctioned === false, "Declared yes"],
    ["No politically exposed owner declared", p.pep === false, "Declared yes"],
  ];
  const fails = c.checks.filter(([, ok]) => !ok).length;
  c.kyc.screening = fails ? fails + " check(s) for the compliance officer" : "All " + c.checks.length + " checks pass";
  c.kyc.risk = fails ? "High" : "Low";
  Q.log(c, "Ran the readiness checks: " + c.kyc.screening);
};
Q.accountForm = (c) => { const r = Q.ROUTES[c.route]; return `<p>Record what the bank opened. These figures drive the warnings the client gets later.</p>
  <div class="field-row"><label>IBAN<input id="acc-iban" placeholder="e.g. AE00 0000 0000 0000 0000 000"></label><label>Monthly fee, AED<input id="acc-fee" type="number" value="${r.monthly}"></label><label>Minimum balance, AED<input id="acc-min" type="number" value="${r.minBal}"></label></div>
  <label>Anything the bank still wants, and by when<input id="task-note" placeholder="e.g. Original Emirates ID within 90 days"></label><div id="act-err"></div>
  <div><button class="btn" data-act="taskDone" data-id="${c.id}">Record the account</button></div>`; };
Q.readAccount = (c) => {
  const iban = Q.val("acc-iban");
  if (!iban) return actErr("Enter the IBAN the bank issued.");
  c.account = { iban, monthly: Math.max(0, parseInt(Q.val("acc-fee"), 10) || 0), minBal: Math.max(0, parseInt(Q.val("acc-min"), 10) || 0), opened: Q.day(), undertaking: Q.val("task-note") };
  Q.log(c, "Recorded the opened account, IBAN " + iban);
};
Q.actions.subRefuse = sact((c) => {
  const reason = Q.val("req-text");
  if (!reason) return actErr("Write the reason the bank gave, or that it gave none.");
  const r = Q.ROUTES[c.route];
  c.bankHistory.push({ bank: r.authority, date: Q.day(), reason });
  lastSub(c).outcome = "Refused";
  c.sub.decision = null; delete c.sub.decision;
  c.stepIndex = Q.steps(c).findIndex((s) => s.key === "apply");
  c.rebank = true;
  Q.log(c, r.authority + " refused the application: " + reason);
});
Q.rebankPanel = (c) => {
  const tried = c.bankHistory.map((h) => h.bank);
  const options = Q.BANKS.filter((id) => !tried.includes(Q.ROUTES[id].authority));
  const last = c.bankHistory[c.bankHistory.length - 1];
  return `<div class="callout"><div class="card-h"><h2>Refused by ${Q.esc(last.bank)}</h2>${Q.tag("With Qantara", "")}</div>
    <p>Reason given: ${Q.esc(last.reason)}. Before the client applies anywhere else, record what caused it and what changes in the pack.</p>
    <label>Cause, and what is different this time<input id="rb-note" placeholder="e.g. Turnover estimate had no contracts behind it; two signed contracts added"></label>
    <label>Next bank<select id="rb-bank"><option value="">Choose</option>${options.map((id) => `<option value="${id}" ${Q.bankPasses(c.profile, id) ? "" : "disabled"}>${Q.esc(Q.ROUTES[id].name)}${Q.bankPasses(c.profile, id) ? "" : " (company does not fit)"}</option>`).join("")}</select></label><div id="act-err"></div>
    <div><button class="btn" data-act="rebank" data-id="${c.id}">Move the case to this bank</button></div>
    ${options.some((id) => Q.bankPasses(c.profile, id)) ? "" : `<div class="note bad">No remaining bank in the catalogue fits this company. Talk to the client before going further.</div>`}</div>`;
};
Q.actions.rebank = sact((c) => {
  const note = Q.val("rb-note"), id = Q.val("rb-bank");
  if (!note) return actErr("Record the cause and what changes before trying another bank.");
  if (!id || !Q.bankPasses(c.profile, id)) return actErr("Choose a bank this company fits.");
  c.notes.push({ who: Q.user().name, t: Q.day(), text: "After refusal: " + note });
  c.route = id; c.rebank = false;
  c.messages.push({ from: Q.user().name, t: Q.day(), text: "We have moved your application to " + Q.ROUTES[id].authority + ". The pack is updated. Please apply there when you are ready." });
  Q.log(c, "Moved the case to " + Q.ROUTES[id].authority + ". " + note);
});
Q.bankHistoryCard = (c) => `<div class="card flat"><table><tr><th>Banks approached</th><th>Date</th><th>Outcome</th><th>Reason</th></tr>${c.bankHistory.map((h) => `<tr><td>${Q.esc(h.bank)}</td><td class="num">${Q.fmtDate(h.date)}</td><td>${Q.tag("Refused", "bad")}</td><td>${Q.esc(h.reason)}</td></tr>`).join("")}<tr><td>${Q.esc(Q.ROUTES[c.route].authority)}</td><td></td><td>${Q.tag(c.account ? "Account open" : "Current", c.account ? "ok" : "")}</td><td></td></tr></table></div>`;
