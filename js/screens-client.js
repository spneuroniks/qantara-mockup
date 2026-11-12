/* Client screens for service 1, business setup. */
const mine = () => Q.state.cases.filter((c) => c.clientId === Q.user().id);
/* Authentication is not authorisation: a client only ever gets their own case. */
const myCase = (id) => mine().find((c) => c.id === id) || null;
const notFound = (active) => Q.shell(active, `<h1>Not found</h1><p class="muted">This case does not exist or is not yours.</p><a class="btn ghost" href="#/home" style="justify-self:start">Back to home</a>`);
const pct = (c) => Math.round((100 * (c.status === "complete" ? Q.steps(c).length : c.stepIndex)) / Q.steps(c).length);
const caseLink = (c) => (c.status === "complete" && c.service === "01" ? "#/company/" + c.id : "#/case/" + c.id);
const doneText = (c) => (c.licence ? (c.licence.label || "Licence") + " " + c.licence.no + (c.licence.expires ? " · renews " + Q.fmtDate(c.licence.expires) : "") : c.account ? "Account open · " + c.account.iban : c.visa ? "Residence visa issued · renews " + Q.fmtDate(c.visa.expires) : c.renewedTo ? "Licence renewed to " + Q.fmtDate(c.renewedTo) : c.change ? "Registers updated" : c.period ? Q.accDoneText(c) : c.xb ? "Adviser confirmed the filing" : "Complete");

Q.screens.home = () => {
  const cs = mine();
  const asks = cs.filter((c) => Q.clientAsk(c));
  const dates = [];
  cs.forEach((c) => {
    if (Q.cur(c) && Q.cur(c).type === "pay") dates.push([c.voucherDue, "Government fees due", c]);
    if (c.licence && c.licence.expires) dates.push([c.licence.expires, (c.licence.label || "Licence") + " renewal", c]);
    if (c.permitDue && c.status === "open") dates.push([c.permitDue, "Last day to finish the visa steps", c]);
    if (c.visa) dates.push([c.visa.expires, "Residence visa renewal, " + c.person.name, c]);
  });
  dates.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return Q.shell("home", `
    <div class="spread"><div><h1>Welcome back, ${Q.esc(Q.user().name.split(" ")[0])}</h1><p class="muted">Everything about your companies in one place.</p></div>
      <a class="btn" href="#/setup/new">Start a new company</a></div>
    <div class="grid3">
      <div class="card stat"><b>${asks.length}</b><span>waiting for you</span></div>
      <div class="card stat"><b>${cs.filter((c) => c.status === "open").length}</b><span>cases in progress</span></div>
      <div class="card stat"><b>${cs.filter((c) => c.status === "complete").length}</b><span>cases complete</span></div>
    </div>
    ${asks.length ? `<div class="stack-s"><h2>Needs you</h2>${asks.map((c) => `<div class="callout"><div class="spread"><div><b>${Q.esc(Q.clientAsk(c))}</b><div class="small muted">${Q.esc(c.company)} · ${Q.esc(Q.cur(c).title)}</div></div><a class="btn" href="#/case/${c.id}">Open</a></div></div>`).join("")}</div>` : `<div class="note ok">Nothing is waiting for you today.</div>`}
    <div class="main-side">
      <div class="stack-s"><h2>Your cases</h2>
        ${cs.map((c) => `<a class="card" href="${caseLink(c)}" style="text-decoration:none;color:inherit">
          <div class="card-h"><h3>${Q.esc(c.company)}</h3>${Q.holderTag(c)}</div>
          <div class="small muted">${Q.esc(Q.SERVICES[c.service])} · ${Q.esc(Q.ROUTES[c.route].name)} · ${c.id}</div>
          <div class="progress"><i style="width:${pct(c)}%"></i></div>
          <div class="small muted">${c.status === "complete" ? Q.esc(doneText(c)) : "Step " + (c.stepIndex + 1) + " of " + Q.steps(c).length + ": " + Q.esc(Q.cur(c).title)}</div></a>`).join("") || `<div class="card"><p class="muted">You have no companies yet.</p></div>`}
      </div>
      <div class="card"><h3>Coming up</h3>${dates.map(([d, label, c]) => `<div><b class="num">${Q.fmtDate(d)}</b><div class="small muted">${label} · ${Q.esc(c.company)}</div></div>`).join("") || `<p class="muted small">No dates yet.</p>`}</div>
    </div>`);
};

Q.screens.cases = () => Q.shell("cases", `<div class="spread"><h1>My cases</h1><a class="btn" href="#/setup/new">Start a new company</a></div>
  <div class="card flat"><table><tr><th>Case</th><th>Company</th><th>Service</th><th>Current step</th><th>Status</th><th>Opened</th></tr>
  ${mine().map((c) => `<tr class="link" data-href="${caseLink(c)}"><td class="num">${c.id}</td><td><b>${Q.esc(c.company)}</b></td><td>${Q.esc(Q.SERVICES[c.service])}<div class="small muted">${Q.esc(Q.ROUTES[c.route].name)}</div></td><td>${Q.esc(Q.cur(c) ? Q.cur(c).title : doneText(c))}</td><td>${Q.holderTag(c)}</td><td class="num">${Q.fmtDate(c.opened)}</td></tr>`).join("")}</table></div>`);

/* ---- One case ---- */
const stepAction = (c) => {
  const s = Q.cur(c), q = c.quote;
  if (s && s.type === "partner" && Q.holder(c) === "client") return "";
  if (!s) return Q.doneNote[c.service] ? Q.doneNote[c.service](c) : `<div class="note ok">The set-up is complete. The company profile holds the licence, the registers and the dates to watch.</div>`;
  if (Q.holder(c) !== "client") return `<div class="note">${Q.esc(Q.waitText(c))}. Estimate for this step: ${Q.esc(s ? s.est : "")}. Estimates are ranges, not promised dates.</div>`;
  let body = "";
  if (s.type === "quote") {
    if (!q.accepted) body = `${Q.quoteTable(c)}<p class="small muted">${c.service === "03" ? "Qantara's fee is for preparing the file. The bank decides whether to open the account." : "Government fees are collected later, when the authority issues its voucher. Today you only commit to Qantara's fee."}</p><div><button class="btn" data-act="acceptQuote" data-id="${c.id}">Accept the quote</button></div>`;
    else if (!q.signed) body = `<p>Engagement letter for ${Q.esc(c.company)}. Sign by typing your full name.</p><div class="field-row"><label>Full name<input id="sign-name" placeholder="${Q.esc(Q.user().name)}"></label><button class="btn" data-act="signEngagement" data-id="${c.id}">Sign</button></div><div id="act-err"></div>`;
    else body = `<p>Pay Qantara's fee to start the work: <b class="num">${Q.aed(q.qFee + q.vat)}</b> (fee ${Q.aed(q.qFee)} + VAT ${Q.aed(q.vat)}).</p><div><button class="btn" data-act="payDeposit" data-id="${c.id}">Pay ${Q.aed(q.qFee + q.vat)}</button></div>`;
  } else if (s.type === "kyc") body = `<p>We need ${Q.docsOpen(c).length} more document${Q.docsOpen(c).length === 1 ? "" : "s"} ${Q.packText[c.service] || "to check who owns and runs the company. You upload each one once; it is reused for later services"}.</p><div><a class="btn" href="#/case/${c.id}/documents">Go to documents</a></div>`;
  else if (s.type === "apply") body = Q.bankApplyBody(c);
  else if (s.type === "appt") body = Q.apptClientBody(c);
  else if (s.type === "form") body = Q.forms[c.service](c);
  else if (s.type === "conds") body = Q.condsClient(c);
  else if (s.type === "sign") body = `${s.report ? Q.reportBody(c) : `<p><b>${Q.esc(s.doc)}</b> for ${Q.esc(c.company)}, ${Q.esc(s.signText || "prepared by Qantara from the owners and shares on file")}. Read it, then sign by typing your full name.</p>`}<div class="field-row"><label>Full name<input id="sign-name" placeholder="${Q.esc(Q.user().name)}"></label><button class="btn" data-act="signDoc" data-id="${c.id}">Sign</button></div><div id="act-err"></div>`;
  else if (s.type === "upload") body = `<p>Upload your <b>${Q.esc(s.doc.toLowerCase())}</b>. Qantara checks it before the licence application goes in.</p><div><button class="btn" data-act="uploadPremises" data-id="${c.id}">Upload file</button></div>`;
  else if (s.type === "pay" && s.proof) body = Q.taxPayBody(c);
  else if (s.type === "pay") body = `<table>${q.gov.map((g) => `<tr><td>${Q.esc(g.label)}</td><td class="right num">${Q.aed(g.amount)}</td></tr>`).join("")}<tr class="total"><td>Government fees</td><td class="right num">${Q.aed(Q.govTotal(c))}</td></tr></table>
      <div class="note warn">Pay by <b>${Q.fmtDate(c.voucherDue)}</b>. If the voucher lapses, the application is cancelled and has to start again.</div><div><button class="btn" data-act="payGov" data-id="${c.id}">Pay ${Q.aed(Q.govTotal(c))}</button></div>`;
  return `<div class="callout"><div class="card-h"><h2>${Q.esc(Q.stepAsk(c))}</h2>${Q.tag("Needs you", "warn")}</div>${body}</div>`;
};

const caseLabel = (c) => `${Q.esc(c.company)} · ${Q.esc(Q.ROUTES[c.route].name)} · ${Q.esc(c.id)}`;
const docRows = (c, list) => list.map((d) => `<tr><td><b>${Q.esc(d.title)}</b><div class="small muted">${Q.esc(d.forWho)}${d.reason ? " · Returned: " + Q.esc(d.reason) : ""}</div></td>
  <td>${Q.tag({ missing: "Needed", uploaded: "Being checked", accepted: "Accepted", rejected: "Sent back" }[d.status], { missing: "warn", uploaded: "", accepted: "ok", rejected: "bad" }[d.status])}</td>
  <td class="right">${d.status === "missing" || d.status === "rejected" ? `<button class="btn sm" data-act="uploadDoc" data-id="${c.id}" data-doc="${d.id}">Upload</button>` : `<span class="small muted">${Q.esc(d.file || "On file")}</span>`}</td></tr>`).join("");

const payRows = (c) => c.payments.map((p) => `<tr><td class="num">${Q.fmtDate(p.date)}</td><td>${Q.esc(p.label)}</td><td>${Q.tag(p.kind === "gov" ? "Government, at cost" : "Qantara", p.kind === "gov" ? "dark" : "")}</td><td class="num">${Q.esc(p.ref)}</td><td class="right num">${Q.aed(p.amount)}</td></tr>`).join("");

Q.screens.clientCase = (id, tab) => {
  const c = myCase(id);
  if (!c) return notFound("cases");
  const r = Q.ROUTES[c.route], a = Q.activity(c.activity);
  const open = Q.docsOpen(c), rest = c.docs.filter((d) => !open.includes(d));
  const panes = {
    progress: () => `<div class="main-side"><div class="stack">${Q.consentCallouts(c)}${stepAction(c)}<div class="card"><h2>Steps</h2>${Q.stepList(c, true)}</div></div>
      <div class="stack">${Q.about[c.service] ? Q.about[c.service](c) : `<div class="card"><h3>About this set-up</h3><div class="stack-s small">
        <div><span class="muted">Activity</span><br>${Q.esc(a.name)} (${Q.esc(a.licence)} licence)</div>
        <div><span class="muted">Authority</span><br>${Q.esc(r.authority)}</div>
        <div><span class="muted">Visas planned</span><br>${c.visas}</div>
        <div><span class="muted">Whole set-up, estimate</span><br>${r.days[0]}–${r.days[1]} working days. A range, not a promise.</div>
        <div><span class="muted">Delivered by</span><br>${Q.esc(r.by)}</div></div></div>`}
        ${Q.partnersClientCard(c)}<div class="card"><h3>Your adviser</h3><div class="row"><span class="avatar">OS</span><div><b>Omar Siddiqui</b><div class="small muted">Setup adviser</div></div></div><a class="btn ghost sm" href="#/case/${c.id}/messages" style="justify-self:start">Message</a></div></div></div>`,
    documents: () => `${open.length ? `<div class="card flat"><table><tr><th>Still needed from you (${open.length})</th><th>Status</th><th></th></tr>${docRows(c, open)}</table></div>` : `<div class="note ok">You have given us everything on the list.</div>`}
      ${rest.length ? `<div class="card flat"><table><tr><th>Received (${rest.length})</th><th>Status</th><th></th></tr>${docRows(c, rest)}</table></div>` : ""}
      <p class="small muted">The list is built from who owns the company and where it is being set up. Each document is asked for once.</p>`,
    fees: () => `<div class="grid2"><div class="card"><div class="card-h"><h2>Quote</h2>${Q.tag(c.quote.accepted ? "Accepted" : "Awaiting your answer", c.quote.accepted ? "ok" : "warn")}</div>${Q.quoteTable(c)}</div>
      <div class="card"><h2>Payments made</h2>${c.payments.length ? `<table><tr><th>Date</th><th>For</th><th>To</th><th>Receipt</th><th class="right">Amount</th></tr>${payRows(c)}</table>` : `<p class="muted">No payments yet.</p>`}</div></div>`,
    people: () => `<div class="card"><h2>Who owns ${Q.esc(c.company)}</h2>${Q.ownChart(c)}<p class="small muted">Anyone holding 25% or more is recorded as a beneficial owner.</p></div>`,
    messages: () => `<div class="card">${Q.msgList(c)}</div>`,
    history: () => `<div class="card flat">${Q.logTable(c)}</div>`,
  };
  if (!panes[tab]) return notFound("cases");
  return Q.shell("cases", `<div class="crumbs"><a href="#/cases">My cases</a> / ${c.id}</div>
    <div class="spread"><div><h1>${Q.esc(c.company)}</h1><p class="muted">${Q.esc(Q.SERVICES[c.service])} · ${Q.esc(r.name)} · opened ${Q.fmtDate(c.opened)}</p></div><div class="row">${Q.holderTag(c)}${(c.service === "01" && c.status === "complete") || c.companyCase ? `<a class="btn ${c.status === "complete" ? "" : "ghost"}" href="#/company/${c.companyCase || c.id}">Open company profile</a>` : ""}</div></div>
    ${Q.tabs("#/case/" + c.id, [["progress", "Progress"], ["documents", "Documents" + (open.length ? " (" + open.length + ")" : "")], ["fees", "Fees and payments"], ["people", "Owners"], ["messages", "Messages"], ["history", "History"]], tab)}
    ${panes[tab]()}`);
};

const act = (fn) => (d) => { const c = myCase(d.id); if (!c) throw new Error("Case not found for this user: " + d.id); fn(c, d); Q.save(); Q.render(); };
const needName = () => { const n = Q.val("sign-name"); if (!n) document.getElementById("act-err").innerHTML = `<div class="note bad">Type your full name to sign.</div>`; return n; };
Q.actions.acceptQuote = act((c) => { c.quote.accepted = true; Q.log(c, "Accepted the quote"); });
Q.actions.signEngagement = (d) => { const n = needName(); if (n) act((c) => { c.quote.signed = true; Q.log(c, "Signed the engagement letter as " + n); })(d); };
Q.actions.payDeposit = act((c) => { c.quote.depositPaid = true; c.payments.push({ kind: "qantara", label: "Qantara service fee with VAT", amount: c.quote.qFee + c.quote.vat, date: Q.day(), ref: "INV-" + c.id.slice(3) }); Q.log(c, "Paid Qantara's fee"); Q.advance(c); });
Q.actions.uploadDoc = act((c, d) => { const doc = c.docs.find((x) => x.id === d.doc); doc.status = "uploaded"; doc.reason = ""; doc.file = doc.title.toLowerCase().replace(/[^a-z]+/g, "-") + ".pdf"; Q.log(c, "Uploaded: " + doc.title + " (" + doc.forWho + ")"); });
Q.actions.signDoc = (d) => { const n = needName(); if (n) act((c) => { Q.log(c, "Signed " + Q.cur(c).doc + " as " + n); Q.advance(c); })(d); };
Q.actions.uploadPremises = act((c) => { c.premises = { uploaded: true, file: "tenancy-contract.pdf" }; Q.log(c, "Uploaded the tenancy contract"); });
Q.actions.payGov = act((c) => { c.quote.govPaid = true; c.payments.push({ kind: "gov", label: (Q.ROUTES[c.route].payLabel || "Government fees") + ", " + Q.ROUTES[c.route].authority, amount: Q.govTotal(c), date: Q.day(), ref: "RCT-" + c.id.slice(3) }); Q.log(c, "Paid the government fees"); Q.advance(c); });

/* ---- Cross-case lists ---- */
Q.screens.documents = () => Q.shell("documents", `<h1>Documents</h1><p class="muted">Every document you have shared, across all your companies.</p>
  ${mine().filter((c) => c.docs.length).map((c) => `<div class="card flat"><table class="doclist"><tr><th>${caseLabel(c)}</th><th>Status</th><th></th></tr>${docRows(c, c.docs)}</table></div>`).join("")}`);
Q.screens.payments = () => Q.shell("payments", `<h1>Payments</h1><p class="muted">Qantara's fees and government fees are always recorded apart.</p>
  ${mine().filter((c) => c.payments.length).map((c) => `<div class="card flat"><table><tr><th colspan="5">${caseLabel(c)}</th></tr>${payRows(c)}</table></div>`).join("") || `<div class="card"><p class="muted">No payments yet.</p></div>`}
  ${mine().some((c) => !c.payments.length) ? `<p class="small muted">Cases with nothing paid yet: ${mine().filter((c) => !c.payments.length).map((c) => Q.esc(c.id)).join(", ")}.</p>` : ""}`);
Q.screens.messages = () => Q.shell("messages", `<h1>Messages</h1><div class="card flat"><table><tr><th>Case</th><th>Latest message</th><th></th></tr>
  ${mine().map((c) => { const m = c.messages[c.messages.length - 1]; return `<tr class="link" data-href="#/case/${c.id}/messages"><td><b>${Q.esc(c.company)}</b><div class="small muted">${Q.esc(Q.ROUTES[c.route].name)} · ${Q.esc(c.id)}</div></td><td>${m ? Q.esc(m.from + ": " + m.text) : `<span class="muted">No messages yet</span>`}</td><td class="num">${m ? Q.fmtDate(m.t) : ""}</td></tr>`; }).join("")}</table></div>`);

/* ---- Company profile, once the licence is issued ---- */
Q.screens.company = (id) => {
  const c = myCase(id);
  if (!c || c.status !== "complete" || c.service !== "01") return notFound("cases");
  const r = Q.ROUTES[c.route];
  return Q.shell("cases", `<div class="crumbs"><a href="#/cases">My cases</a> / ${c.id} / Company profile</div>
    <div class="spread"><div><h1>${Q.esc(c.company)}</h1><p class="muted">${Q.esc(r.name)} · ${Q.esc(Q.activity(c.activity).name)}</p></div>${Q.tag("Licence active", "ok")}</div>
    <div class="grid3">
      <div class="card stat"><span>Licence number</span><b style="font-size:22px">${Q.esc(c.licence.no)}</b><span>${Q.esc(r.authority)}</span></div>
      <div class="card stat"><span>Issued</span><b style="font-size:22px">${Q.fmtDate(c.licence.issued)}</b></div>
      <div class="card stat"><span>Renewal due</span><b style="font-size:22px">${Q.fmtDate(c.licence.expires)}</b><span>You will be reminded</span></div>
    </div>
    <div class="grid2">
      <div class="card"><h2>Dates the platform is tracking</h2><table>
        <tr><td>Trade licence renewal</td><td class="right num">${Q.fmtDate(c.licence.expires)}</td></tr>
        <tr><td>Establishment card renewal</td><td class="right num">${Q.fmtDate(c.licence.expires)}</td></tr>
        <tr><td>Corporate tax registration</td><td class="right">${Q.tag("Rule to be confirmed by an adviser", "warn")}</td></tr>
        <tr><td>Beneficial-owner register: tell the registrar of changes</td><td class="right">Within 15 days of a change</td></tr></table></div>
      <div class="card"><h2>Owners on the register</h2>${Q.ownChart(c)}</div>
    </div>
    ${Q.sectorCard(c)}
    ${Q.moreCard(c)}
    ${Q.registerCard(c)}
    ${Q.visaCard(c)}
    ${Q.bankAccountsCard(c)}
    <div class="card"><h2>What next for this company</h2><p class="muted small">Your company details and documents carry over. You will not be asked for them again.</p>
      <div class="row"><button class="btn sm" data-act="sectorStart" data-id="${c.id}">02 Sector licensing</button><button class="btn sm" data-act="bankStart" data-id="${c.id}">03 Bank account opening</button><button class="btn sm" data-act="visaStart" data-id="${c.id}">04 Visas and residency</button><a class="btn sm" href="#/compliance">05 PRO and compliance</a><a class="btn sm" href="#/accounting">06 Accounting and tax</a><a class="btn sm" href="#/crossborder">07 Cross-border tax</a>${Q.moreButtons(c)}${Q.SERVICES_NEXT.map(([n, name]) => `<span class="tag plain" title="Not in this mockup yet">${n} ${Q.esc(name)} · soon</span>`).join("")}</div></div>
    <div class="row"><a class="btn ghost" href="#/case/${c.id}">See the set-up case</a></div>`);
};

/* ---- New company wizard ---- */
const WIZ = ["Business", "Location", "Owners", "Name", "Check and send"];
const SUFFIX = { "dxb-mainland": "LLC", "auh-mainland": "LLC", freezone: "FZ-LLC", offshore: "LTD" };
const draft = () => Q.state.draft || (Q.state.draft = { step: 0, activity: "", visas: 1, route: "", owners: [{ name: Q.user().name, kind: "person", nationality: "", pct: 100 }], company: "", ack: false, err: "" });
const nameChecks = (d) => Q.NAME_RULES.map(([label, test]) => [label.replace("the legal form", SUFFIX[d.route]), test(d.company, SUFFIX[d.route])]);

Q.screens.wizard = () => {
  const d = draft(), a = Q.activity(d.activity), r = Q.ROUTES[d.route];
  const total = d.owners.reduce((n, o) => n + (Number(o.pct) || 0), 0);
  const panes = [
    () => `<div class="card"><h2>What will the company do?</h2>
        <label>Main business activity<select id="w-activity"><option value="">Choose an activity</option>${Q.ACTIVITIES.map((x) => `<option value="${x.code}" ${x.code === d.activity ? "selected" : ""}>${Q.esc(x.name)}</option>`).join("")}</select></label>
        ${a ? `<div class="note ${a.approvals.length ? "warn" : ""}"><b>${Q.esc(a.licence)} licence.</b> ${a.approvals.length ? "This activity also needs: " + Q.esc(a.approvals.join("; ")) + ". We add it to your case as its own step." : "No other authority's approval is needed for this activity."}</div>` : ""}
        <label>How many residence visas do you expect to need in the first year?<input id="w-visas" type="number" min="0" max="50" value="${d.visas}"></label></div>`,
    () => `<div class="stack-s"><h2>Where should it be set up?</h2><p class="muted">Sample figures for comparison. Your quote lists every fee line by line.</p></div>
      <div class="grid2">${Object.entries(Q.ROUTES).filter(([, x]) => x.service === "01").map(([id, x]) => `<button class="choice ${id === d.route ? "on" : ""}" data-act="wizRoute" data-id="${id}">
        <div class="card-h"><h3>${Q.esc(x.name)}</h3>${Q.tag(x.by, x.by === "Qantara team" ? "" : "dark")}</div>
        <dl><dt>Can trade</dt><dd>${Q.esc(x.trade)}</dd><dt>Visas</dt><dd>${Q.esc(x.visas)}</dd><dt>Office</dt><dd>${Q.esc(x.office)}</dd>
        <dt>Government fees</dt><dd class="num">${Q.aed(x.gov.reduce((n, g) => n + g[1], 0))}</dd><dt>Qantara fee</dt><dd class="num">${Q.aed(x.qFee)} + VAT</dd><dt>Estimate</dt><dd>${x.days[0]}–${x.days[1]} working days</dd></dl></button>`).join("")}</div>
      ${d.route === "offshore" && d.visas > 0 ? `<div class="note warn">You said you need ${d.visas} visa${d.visas === 1 ? "" : "s"}. An offshore company cannot sponsor visas.</div>` : ""}`,
    () => `<div class="card"><div class="card-h"><h2>Who will own the company?</h2>${Q.tag("Shares add up to " + total + "%", total === 100 ? "ok" : "bad")}</div>
        <table><tr><th>Name</th><th>Type</th><th>Nationality or country</th><th>Share %</th><th></th></tr>
        ${d.owners.map((o, i) => `<tr><td><input data-o="${i}" data-f="name" value="${Q.esc(o.name)}"></td>
          <td><select data-o="${i}" data-f="kind"><option value="person" ${o.kind === "person" ? "selected" : ""}>Person</option><option value="company" ${o.kind === "company" ? "selected" : ""}>Company</option></select></td>
          <td><input data-o="${i}" data-f="nationality" value="${Q.esc(o.nationality)}"></td><td><input data-o="${i}" data-f="pct" type="number" min="0" max="100" value="${o.pct}" style="width:90px"></td>
          <td class="right">${d.owners.length > 1 ? `<button class="btn ghost sm" data-act="wizDelOwner" data-i="${i}">Remove</button>` : ""}</td></tr>`).join("")}</table>
        <div><button class="btn ghost sm" data-act="wizAddOwner">Add an owner</button></div>
        <p class="small muted">Anyone with 25% or more is a beneficial owner and goes through identity checks. For a company owner we also ask who is behind it.</p></div>`,
    () => `<div class="card"><h2>What will it be called?</h2>
        <label>Proposed trade name<input id="w-company" value="${Q.esc(d.company)}" placeholder="Example Trading ${SUFFIX[d.route]}"></label>
        <div><button class="btn ghost sm" data-act="wizCheckName">Check the name</button></div>
        ${d.company ? `<div class="stack-s">${nameChecks(d).map(([label, ok]) => `<div class="row">${Q.tag(ok ? "Pass" : "Fix", ok ? "ok" : "bad")}<span>${Q.esc(label)}</span></div>`).join("")}</div><p class="small muted">These are first checks. ${Q.esc(r.authority)} makes the final decision on the name.</p>` : ""}</div>`,
    () => `<div class="grid2"><div class="card"><h2>Your set-up</h2><table>
          <tr><td class="muted">Company</td><td>${Q.esc(d.company)}</td></tr><tr><td class="muted">Where</td><td>${Q.esc(r.name)}</td></tr>
          <tr><td class="muted">Activity</td><td>${Q.esc(a.name)}</td></tr><tr><td class="muted">Owners</td><td>${d.owners.map((o) => Q.esc(o.name) + " " + o.pct + "%").join("<br>")}</td></tr>
          <tr><td class="muted">Visas</td><td>${d.visas}</td></tr><tr><td class="muted">Estimate</td><td>${r.days[0]}–${r.days[1]} working days</td></tr></table></div>
        <div class="card"><h2>Estimated cost</h2>${Q.quoteTable({ route: d.route, quote: Q.buildQuote(d.route) })}</div></div>
      <div class="card"><label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="w-ack" type="checkbox" style="width:auto;margin-top:4px" ${d.ack ? "checked" : ""}>
        <span>I understand that durations are estimates, that the authority decides on the name and the licence, and that government fees are charged at cost on top of Qantara's fee.</span></label></div>`,
  ];
  return Q.wiz({ active: "setup", svc: "01", title: "Start a new company", steps: WIZ, step: d.step, body: panes[d.step](), err: d.err, back: "wizBack", next: "wizNext", cancel: "wizCancel", why: ["The activity decides the licence type and any extra approval.", "Each place has its own fees, time and rules on visas and offices.", "Anyone with 25% or more goes through identity checks. The register must add up to 100%.", "The authority decides on the name. These first checks catch the common refusals.", "Check everything before it goes. Use Back to change an answer."][d.step] });
};

/* Read whatever the current step shows into the draft. */
const wizRead = () => {
  const d = draft();
  if (d.step === 0) { d.activity = Q.val("w-activity"); d.visas = Math.max(0, parseInt(Q.val("w-visas"), 10) || 0); }
  if (d.step === 2) document.querySelectorAll("[data-o]").forEach((el) => { d.owners[el.dataset.o][el.dataset.f] = el.dataset.f === "pct" ? Number(el.value) || 0 : el.value.trim(); });
  if (d.step === 3) d.company = Q.val("w-company");
  if (d.step === 4) d.ack = document.getElementById("w-ack").checked;
  return d;
};
const wizCheck = (d) => {
  if (d.step === 0 && !d.activity) return "Choose a business activity.";
  if (d.step === 1 && !d.route) return "Choose where the company should be set up.";
  if (d.step === 2) {
    if (d.owners.some((o) => !o.name || !o.nationality)) return "Give every owner a name and a nationality or country.";
    if (d.owners.reduce((n, o) => n + o.pct, 0) !== 100) return "The shares must add up to exactly 100%.";
  }
  if (d.step === 3) { if (!d.company) return "Enter a proposed trade name."; if (nameChecks(d).some(([, ok]) => !ok)) return "The name does not pass the first checks yet."; }
  if (d.step === 4 && !d.ack) return "Tick the box to confirm you have read the points above.";
  return "";
};
const wizStay = () => { Q.save(); Q.render(); };
Q.actions.wizNext = () => {
  const d = wizRead();
  d.err = wizCheck(d);
  if (d.err) return wizStay();
  if (d.step < WIZ.length - 1) { d.step++; return wizStay(); }
  const c = Q.newCase({ clientId: Q.user().id, clientName: Q.user().name, company: d.company, route: d.route, activity: d.activity, owners: d.owners, visas: d.visas });
  Q.log(c, "Asked Qantara to set up " + d.company);
  Q.state.cases.unshift(c);
  Q.state.draft = null;
  Q.save();
  Q.go("#/sent/" + c.id);
};
Q.actions.wizBack = () => { const d = wizRead(); d.err = ""; d.step--; wizStay(); };
Q.actions.wizCancel = () => { Q.state.draft = null; Q.save(); Q.go("#/home"); };
Q.actions.wizRoute = (x) => { const d = draft(); d.route = x.id; d.err = ""; wizStay(); };
Q.actions.wizAddOwner = () => { const d = wizRead(); d.owners.push({ name: "", kind: "person", nationality: "", pct: 0 }); wizStay(); };
Q.actions.wizDelOwner = (x) => { const d = wizRead(); d.owners.splice(Number(x.i), 1); wizStay(); };
Q.actions.wizCheckName = () => { const d = wizRead(); d.err = ""; wizStay(); };
document.addEventListener("change", (e) => { if (e.target.id === "w-activity") { wizRead(); wizStay(); } });
