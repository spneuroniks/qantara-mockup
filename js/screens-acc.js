/* Service 6, accounting, VAT and corporate tax: monthly books, the VAT return and its approval chain. */
const accCases = (coId, route) => Q.byService("06").filter((c) => c.companyCase === coId && c.route === route);
const monthState = (co, ym) => { const a = Q.state.acc[co.id]; if (a.closed.includes(ym)) return "closed"; return accCases(co.id, "acc-books").some((c) => c.period === ym && c.status === "open") ? "open" : "todo"; };
const vatCase = (co) => accCases(co.id, "acc-vat").find((c) => c.period === Q.periodLabel());
const figures = (rows) => `<table>${rows.map(([l, n, bold]) => `<tr ${bold ? `class="total"` : ""}><td>${Q.esc(l)}</td><td class="right num">${Q.aed(n)}</td></tr>`).join("")}</table><p class="small muted">Figures read from the ledger. Qantara does not keep a second set of books.</p>`;
const monthRows = (l) => [["Sales", l.sales], ["Purchases and costs", l.purchases], ["Result for the month", l.sales - l.purchases, true], ["VAT charged on sales", l.vatOut], ["VAT paid on purchases", l.vatIn]];
const vatRows = (t) => [["Sales in the period", t.sales], ["VAT charged on sales", t.vatOut], ["VAT paid on purchases", t.vatIn], ["VAT payable", t.net, true]];

Q.screens.accounting = () => {
  const cos = companiesOf(Q.user().id);
  return Q.shell("acc", `<h1>Accounting and tax</h1><p class="muted">Books each month, VAT each tax period, and the dates that follow from them.</p>
    ${cos.map((co) => {
      const a = Q.state.acc[co.id];
      if (!a) return `<div class="card"><div class="card-h"><h3>${Q.esc(co.company)}</h3>${Q.tag("No accounting plan", "warn")}</div><p class="small muted">${Q.esc(Q.ACC_PLAN.covers)}. Sample price.</p><div><button class="btn sm" data-act="accPlan" data-id="${co.id}">Add ${Q.ACC_PLAN.name}: ${Q.aed(Q.ACC_PLAN.fee)} a month</button></div></div>`;
      const months = Q.periodMonths(), next = months.find((ym) => monthState(co, ym) === "todo"), allClosed = months.every((ym) => monthState(co, ym) === "closed"), v = vatCase(co), t = Q.vatFigures(co.id);
      return `<div class="card"><div class="card-h"><h2>${Q.esc(co.company)}</h2>${Q.tag(Q.ACC_PLAN.name + " plan · " + Q.aed(a.fee) + " a month", "ok")}</div>
        <div class="grid2"><div class="stack-s"><h3>Books</h3><table>${months.map((ym) => { const st = monthState(co, ym), cs = accCases(co.id, "acc-books").find((c) => c.period === ym); return `<tr ${cs ? `class="link" data-href="#/case/${cs.id}"` : ""}><td>${Q.ymLabel(ym)}</td><td class="right num">${Q.aed(Q.ledger(co.id, ym).sales)} sales</td><td class="right">${Q.tag({ closed: "Closed", open: "In progress", todo: "Not started" }[st], { closed: "ok", open: "warn", todo: "plain" }[st])}</td></tr>`; }).join("")}</table>
            ${next && !months.some((ym) => monthState(co, ym) === "open") ? `<div><button class="btn sm" data-act="accBooks" data-id="${co.id}" data-ym="${next}">Start the books for ${Q.ymLabel(next)}</button></div>` : ""}
            <p class="small muted">Ledger: Sample Books, connected read-only. Bank statements arrive by upload.</p></div>
          <div class="stack-s"><h3>VAT, ${Q.periodLabel()}</h3><table><tr><td>VAT payable, from the ledger</td><td class="right num">${Q.aed(t.net)}</td></tr><tr><td>Return and payment due</td><td class="right num">${Q.fmtDate(Q.vatDue())}</td></tr><tr><td>Status</td><td class="right">${v ? (v.status === "complete" ? Q.tag("Filed and paid", "ok") : Q.holderTag(v)) : Q.tag("Not started", "plain")}</td></tr></table>
            ${v ? `<div><a class="btn sm ghost" href="#/case/${v.id}">Open the VAT return, ${v.id}</a></div>` : allClosed ? `<div><button class="btn sm" data-act="accVat" data-id="${co.id}">Start the VAT return</button></div>` : `<div class="note">The return starts once all three months are closed, so it is built on final figures.</div>`}</div></div>
        <div class="grid2"><div class="stack-s"><h3>Corporate tax</h3><table><tr><td>Return and payment due</td><td class="right num">${Q.fmtDate(a.corpTaxDue)}</td></tr><tr><td>Small-business relief test</td><td class="right">${Q.tag("Rule to be confirmed by an adviser", "warn")}</td></tr><tr><td>Audit</td><td class="right">Arranged with a licensed audit firm</td></tr></table></div>
          <div class="stack-s"><h3>E-invoicing readiness</h3><table><tr><td>In scope</td><td class="right">${Q.tag("Phase to be confirmed", "warn")}</td></tr><tr><td>Customers missing a required field</td><td class="right num">3 of 14</td></tr><tr><td>Approved provider chosen</td><td class="right">${Q.tag("Not yet", "plain")}</td></tr></table></div></div></div>`;
    }).join("") || `<div class="card"><p class="muted">You have no licensed company yet.</p></div>`}`);
};

const accCase = (co, route, extra) => {
  const q = Object.assign(Q.buildQuote(route), { accepted: true, signed: true, depositPaid: true, covered: true }, extra.quoteExtra || {});
  delete extra.quoteExtra;
  const c = Q.newCase(Object.assign({ service: "06", companyCase: co.id, clientId: co.clientId, clientName: co.clientName, company: co.company, route, activity: co.activity, owners: co.owners, visas: 0, quote: q, docs: [], kyc: Object.assign({}, co.kyc) }, extra));
  Q.state.cases.unshift(c);
  return c;
};
Q.actions.accPlan = (d) => {
  const co = myCompany(d.id); if (!co) throw new Error("Unknown company " + d.id);
  if (!confirm("Add the " + Q.ACC_PLAN.name + " plan for " + co.company + " at " + Q.aed(Q.ACC_PLAN.fee) + " a month?")) return;
  // The demo starts with two of the three months already closed, so one month and the VAT return can be walked through.
  Q.state.acc[co.id] = { fee: Q.ACC_PLAN.fee, since: Q.day(), closed: Q.periodMonths().slice(0, 2), corpTaxDue: Q.addDays(Q.day(), 200) };
  Q.save(); Q.render();
};
Q.actions.accBooks = (d) => {
  const co = myCompany(d.id); if (!co || !Q.state.acc[co.id] || monthState(co, d.ym) !== "todo") throw new Error("Books cannot start for " + d.id + " " + d.ym);
  const m = Q.ymLabel(d.ym);
  const docs = ["Bank statement", "Sales invoices", "Purchase bills and receipts", "Payroll summary"].map((t, i) => ({ id: "a" + i, title: t + ", " + m, forWho: co.company, status: "missing" }));
  const c = accCase(co, "acc-books", { period: d.ym, docs });
  Q.log(c, "Opened the books for " + m); Q.save(); Q.go("#/case/" + c.id);
};
Q.actions.accVat = (d) => {
  const co = myCompany(d.id); if (!co || !Q.state.acc[co.id] || vatCase(co) || !Q.periodMonths().every((ym) => monthState(co, ym) === "closed")) throw new Error("The VAT return cannot start for " + d.id);
  const t = Q.vatFigures(co.id);
  const c = accCase(co, "acc-vat", { period: Q.periodLabel(), vat: t, taxDue: Q.vatDue(), quoteExtra: { gov: [{ label: "VAT payable, " + Q.periodLabel(), amount: t.net }] } });
  Q.log(c, "Opened the VAT return for " + Q.periodLabel()); Q.save(); Q.go("#/case/" + c.id);
};

/* ---- Pieces the shared case screens call ---- */
Q.packText["06"] = "to close the month. A reminder goes out until each item is in";
Q.accDoneText = (c) => (c.vat ? "VAT return filed and paid, " + c.period : "Books closed, " + Q.ymLabel(c.period));
Q.doneNote["06"] = (c) => `<div class="note ok">${c.vat ? "The VAT return for " + Q.esc(c.period) + " is filed and the payment proof is on record." : "The books for " + Q.ymLabel(c.period) + " are closed and approved."}</div>`;
Q.about["06"] = (c) => `<div class="card"><h3>About this ${c.vat ? "return" : "month"}</h3><div class="stack-s small">
    <div><span class="muted">Period</span><br>${c.vat ? Q.esc(c.period) : Q.ymLabel(c.period)}</div>
    ${c.vat ? `<div><span class="muted">VAT payable</span><br><b class="num">${Q.aed(c.vat.net)}</b></div><div><span class="muted">Return and payment due</span><br>${Q.fmtDate(c.taxDue)}</div>
      <div><span class="muted">Approvals, in order</span><br>${c.clientApproved ? "You: approved" : "You: waiting"} · ${c.agentBy ? "Tax agent: " + Q.esc(c.agentBy) : "Tax agent: waiting"}</div>${c.filedRef ? `<div><span class="muted">Authority's confirmation</span><br>${Q.esc(c.filedRef)}</div>` : ""}`
      : `<div><span class="muted">Ledger</span><br>Sample Books, read-only</div>`}
    <div><span class="muted">Qantara's fee</span><br>Covered by your ${Q.esc(Q.ACC_PLAN.name)} plan</div></div></div>`;
Q.reportBody = (c) => `<p>${c.vat ? "This is the VAT return for <b>" + Q.esc(c.period) + "</b>. Nothing is filed until you approve it and the registered tax agent approves it after you." : "This is the report for <b>" + Q.ymLabel(c.period) + "</b>."} Approve by typing your full name.</p>${figures(c.vat ? vatRows(c.vat) : monthRows(Q.ledger(c.companyCase, c.period)))}`;
Q.taxPayBody = (c) => `<table><tr><td>VAT payable, ${Q.esc(c.period)}</td><td class="right num"><b>${Q.aed(c.vat.net)}</b></td></tr><tr><td>The authority must receive it by</td><td class="right num"><b>${Q.fmtDate(c.voucherDue)}</b></td></tr><tr><td>Filed under</td><td class="right num">${Q.esc(c.filedRef || "")}</td></tr></table>
  <div class="note warn">You pay the tax to the authority from your own bank. Qantara never holds or moves your tax money. Then record the payment here with its proof.</div>
  <div><button class="btn" data-act="payGov" data-id="${c.id}">I have paid: upload the proof</button></div>`;

/* Signing the report doubles as the client's approval; closing a month updates the plan record. */
const signDocBase = Q.actions.signDoc;
Q.actions.signDoc = (d) => {
  const c = myCase(d.id), before = c && c.stepIndex;
  signDocBase(d);
  if (!c || c.service !== "06" || c.stepIndex === before && c.status === "open") return;
  if (c.vat) c.clientApproved = Q.day(); else Q.state.acc[c.companyCase].closed.push(c.period);
  Q.save(); Q.render();
};

/* ---- Staff panels ---- */
Q.requestListPanel = (c, nudge) => { const pend = c.docs.filter((d) => d.status === "uploaded"), done = c.docs.every((d) => d.status === "accepted"); return `
  ${pend.length ? `<table><tr><th>Uploaded, to check</th><th></th></tr>${pend.map((d) => `<tr><td><b>${Q.esc(d.title)}</b><div class="small muted">${Q.esc(d.file)}</div></td><td class="right"><div class="row" style="justify-content:flex-end"><button class="btn sm" data-act="docAccept" data-id="${c.id}" data-doc="${d.id}">Accept</button><button class="btn ghost sm" data-act="docReject" data-id="${c.id}" data-doc="${d.id}">Send back</button></div></td></tr>`).join("")}</table>` : ""}
  <table><tr><td>Items received and accepted</td><td class="right">${Q.tag(c.docs.filter((d) => d.status === "accepted").length + " of " + c.docs.length, done ? "ok" : "warn")}</td></tr></table>
  ${nudge}<div id="act-err"></div><div><button class="btn" data-act="listClose" data-id="${c.id}" ${done ? "" : "disabled"}>Everything is in: start the books</button></div>`; };
Q.actions.listClose = sact((c) => { if (!c.docs.every((d) => d.status === "accepted")) return actErr("Not every item has been received and accepted."); Q.advance(c); });
Q.ledgerPanel = (c) => `<p>Reconcile ${Q.ymLabel(c.period)} in the ledger, then close the month here.</p>${figures(monthRows(Q.ledger(c.companyCase, c.period)))}
  <table><tr><td>Bank statement covers the whole month</td><td class="right">${Q.tag("No gaps", "ok")}</td></tr><tr><td>Sales with no emirate of supply</td><td class="right">${Q.tag("None", "ok")}</td></tr></table>
  <label>Note for the record<input id="task-note" placeholder="e.g. Two receipts queried and answered"></label><div><button class="btn" data-act="taskDone" data-id="${c.id}">Books reconciled: send the report to the client</button></div>`;
Q.vatPanel = (c) => `<p>The working file is filled from the closed months in the ledger. Check it before it goes to the client.</p>${figures(vatRows(c.vat))}
  <label>Note for the record<input id="task-note" placeholder="e.g. Checked against the ledger VAT report"></label><div><button class="btn" data-act="taskDone" data-id="${c.id}">Working file ready: send to the client</button></div>`;
Q.agentPanel = (c) => `<p>The client approved this return on ${Q.fmtDate(c.clientApproved)}. A registered tax agent must approve it before it is filed.</p>${figures(vatRows(c.vat))}<div id="act-err"></div>
  <div>${Q.user().taxAgent ? `<button class="btn" data-act="agentApprove" data-id="${c.id}">Approve as registered tax agent</button>` : Q.tag("Waiting for Hana Al Farsi, registered tax agent", "warn")}</div>`;
Q.actions.agentApprove = sact((c) => {
  if (!Q.user().taxAgent || Q.cur(c).type !== "agent" || !c.clientApproved) throw new Error("Only the registered tax agent can approve, and only after the client has.");
  c.agentBy = Q.user().name; Q.log(c, "Registered tax agent approved the return"); Q.advance(c);
});
/* Keep the authority's confirmation reference on the case when the filing is recorded as accepted. */
const subApproveBase = Q.actions.subApprove;
Q.actions.subApprove = (d) => { const c = Q.getCase(d.id), filing = c && c.vat && Q.cur(c) && Q.cur(c).key === "file" ? c.sub.file.ref : null; subApproveBase(d); if (filing) { c.filedRef = filing; Q.save(); Q.render(); } };

/* Tax dates join the one calendar. */
const obligationsBase = Q.obligations;
Q.obligations = (clientId) => {
  const out = obligationsBase(clientId);
  companiesOf(clientId).forEach((co) => {
    const a = Q.state.acc[co.id]; if (!a) return;
    const v = vatCase(co), add = (label, due, who, missed, link, done) => out.push({ co, label, due, who, missed, link, done: !!done, days: daysTo(due) });
    if (!v || Q.cur(v) && Q.cur(v).type !== "pay") add("VAT return, " + Q.periodLabel(), Q.vatDue(), "Qantara, after your approval", "Sample: a late-filing penalty", v ? v.id : null, v && v.status === "complete");
    add("Corporate tax return and payment", a.corpTaxDue, "Qantara, after your approval", "Sample: a late-filing penalty", null);
  });
  return out.sort((x, y) => x.days - y.days);
};
