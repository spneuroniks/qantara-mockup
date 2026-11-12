/* Staff screens for service 1, business setup. */
const pendingDocs = (c) => c.docs.filter((d) => d.status === "uploaded");
const docsDone = (c) => c.docs.every((d) => d.status === "accepted");
const onKyc = (c) => Q.cur(c) && Q.cur(c).type === "kyc";
/* Ready for the compliance officer: every document accepted and screening recorded, approval still missing. */
Q.kycReady = (c) => onKyc(c) && !Q.cur(c).plain && docsDone(c) && !!c.kyc.screening && !c.kyc.approvedBy;

Q.staffNext = (c) => {
  const s = Q.cur(c);
  if (!s) return "Nothing. The case is complete";
  if (c.rebank) return "Record why the bank refused and choose the next bank";
  const h = Q.holder(c);
  if (s.type === "kyc" && pendingDocs(c).length) return "Check " + pendingDocs(c).length + " uploaded document(s)" + (h === "client" ? "; the client still owes " + Q.docsOpen(c).length : "");
  if (h === "client") return "Waiting for the client: " + Q.lc1(Q.clientAsk(c));
  if (h === "authority") return "Waiting for " + Q.ROUTES[c.route].authority + ". Record the outcome when it arrives";
  if (s.type === "kyc" && s.plain) return pendingDocs(c).length ? "Check " + pendingDocs(c).length + " uploaded item(s)" : "Everything is in. Close the request list";
  if (s.type === "agent") return "Waiting for the registered tax agent's approval";
  if (s.type === "second") return "Waiting for a second person to check the pack";
  if (s.type === "partner") { const t = Q.stepTask(c, s); return !t ? "Hand this step to a partner: " + s.partnerType.toLowerCase() : t.status === "returned" ? "Check the work " + Q.partner(t.partnerId).name + " returned" : "Waiting for " + Q.partner(t.partnerId).name; }
  if (s.type === "conds") return c.conds.every((x) => x.done) ? "All conditions are met. Confirm and continue" : "Close Qantara's open conditions: " + c.conds.filter((x) => x.owner !== "client" && !x.done).length;
  if (s.type === "kyc") return pendingDocs(c).length ? "Check " + pendingDocs(c).length + " uploaded document(s)" : !c.kyc.screening ? (s.pack ? "Run the readiness checks on the pack" : "Run sanctions and PEP screening") : "Waiting for the compliance officer's approval";
  if (s.type === "appt") return c.appts[s.key] ? "Record the result of the " + s.title.toLowerCase() : "Book the " + s.title.toLowerCase() + " and record it";
  if (s.type === "authority") return "Submit on " + Q.lc1(Q.ROUTES[c.route].portal) + " and record the reference";
  if (s.type === "upload") return "Check the client's " + s.doc.toLowerCase();
  return "Do this step and record it";
};

Q.screens.queue = () => {
  const cs = Q.state.cases.slice().sort((a, b) => (Q.holder(a) === "qantara" ? 0 : 1) - (Q.holder(b) === "qantara" ? 0 : 1));
  const n = (h) => cs.filter((c) => Q.holder(c) === h).length;
  return Q.shell("queue", `<h1>Work queue</h1><p class="muted">All services. Cases waiting on Qantara come first.</p>
    <div class="grid4"><div class="card stat"><b>${n("qantara")}</b><span>with Qantara</span></div><div class="card stat"><b>${n("client")}</b><span>with the client</span></div>
      <div class="card stat"><b>${n("authority") + n("partner")}</b><span>with an authority or a partner</span></div><div class="card stat"><b>${n("done")}</b><span>complete</span></div></div>
    <div class="card flat"><table><tr><th>Case</th><th>Company and client</th><th>Service</th><th>Step</th><th>Held by</th><th>Next action</th></tr>
    ${cs.map((c) => `<tr class="link" data-href="#/staff/case/${c.id}"><td class="num">${c.id}</td><td><b>${Q.esc(c.company)}</b><div class="small muted">${Q.esc(c.clientName)}</div></td><td>${Q.esc(Q.SERVICES[c.service])}<div class="small muted">${Q.esc(Q.ROUTES[c.route].name)}</div></td>
      <td>${Q.cur(c) ? (c.stepIndex + 1) + "/" + Q.steps(c).length + " " + Q.esc(Q.cur(c).title) : "Complete"}</td><td>${Q.holderTag(c)}</td><td class="small">${Q.esc(Q.staffNext(c))}</td></tr>`).join("")}</table></div>`);
};

/* The panel that changes with the current step. */
const workPanel = (c) => {
  const s = Q.cur(c), u = Q.user(), r = Q.ROUTES[c.route];
  if (!s) return `<div class="note ok">Case complete. The client now sees the company profile.</div>`;
  const h = Q.holder(c);
  let body = "";
  if (c.rebank) return Q.rebankPanel(c);
  const nudge = `<div><button class="btn ghost" data-act="nudge" data-id="${c.id}">Send the client a reminder</button></div>`;
  if (h === "client" && s.type !== "kyc" && s.type !== "conds") body = `<p>Nothing for Qantara to do until the client acts.</p>${nudge}`;
  else if (s.type === "partner") body = Q.partnerStepPanel(c);
  else if (s.type === "conds") body = Q.condsStaff(c, h === "client" ? nudge : "");
  else if (s.type === "kyc" && s.plain) body = Q.requestListPanel(c, h === "client" ? nudge : "");
  else if (s.type === "agent") body = Q.agentPanel(c);
  else if (s.type === "second") body = Q.secondPanel(c);
  else if (s.dataRoom) body = Q.roomPanel(c);
  else if (s.ledger) body = Q.ledgerPanel(c);
  else if (s.vatFile) body = Q.vatPanel(c);
  else if (s.type === "kyc") {
    const pend = pendingDocs(c);
    body = `${pend.length ? `<table><tr><th>Uploaded, to check</th><th></th></tr>${pend.map((d) => `<tr><td><b>${Q.esc(d.title)}</b><div class="small muted">${Q.esc(d.forWho)} · ${Q.esc(d.file)}</div></td><td class="right"><div class="row" style="justify-content:flex-end"><button class="btn sm" data-act="docAccept" data-id="${c.id}" data-doc="${d.id}">Accept</button><button class="btn ghost sm" data-act="docReject" data-id="${c.id}" data-doc="${d.id}">Send back</button></div></td></tr>`).join("")}</table>` : ""}
      <table><tr><td>Documents accepted</td><td class="right">${Q.tag(c.docs.filter((d) => d.status === "accepted").length + " of " + c.docs.length, docsDone(c) ? "ok" : "warn")}</td></tr>
        <tr><td>${s.pack ? s.checkLabel || "Readiness checks on the pack" : "Sanctions and PEP screening"}</td><td class="right">${c.kyc.screening ? Q.tag(c.kyc.screening, c.kyc.risk === "Low" ? "ok" : "warn") : docsDone(c) ? `<button class="btn sm" data-act="screen" data-id="${c.id}">${s.pack ? "Run the checks" : "Run screening"}</button>` : Q.tag("After documents", "plain")}</td></tr>
        <tr><td>Risk rating</td><td class="right">${c.kyc.risk ? Q.tag(c.kyc.risk, c.kyc.risk === "Low" ? "ok" : "warn") : Q.tag("Not rated", "plain")}</td></tr>
        <tr><td>Compliance officer's approval</td><td class="right">${c.kyc.approvedBy ? Q.tag("Approved by " + c.kyc.approvedBy, "ok") : Q.kycReady(c) ? (u.compliance ? `<button class="btn sm" data-act="kycApprove" data-id="${c.id}">Approve and release</button>` : Q.tag("Waiting for Priya Nair", "warn")) : Q.tag("Not ready", "plain")}</td></tr></table>
      ${h === "client" ? `<p class="small">The client still owes ${Q.docsOpen(c).length} document(s).</p>${nudge}` : ""}
      ${s.pack && c.checks ? `<table><tr><th>Check</th><th class="right">Result</th></tr>${c.checks.map(([label, ok, note]) => `<tr><td>${Q.esc(label)}</td><td class="right">${Q.tag(ok ? "Pass" : note || "Fail", ok ? "ok" : "bad")}</td></tr>`).join("")}</table>` : ""}
      <div class="note">${s.pack ? "The pack is never shown as ready while a check fails or could not be run. Nothing leaves Qantara until the compliance officer approves." : "Nothing can be submitted to an authority until the compliance officer approves. A screening that could not be run counts as not cleared."}</div>`;
  } else if (s.type === "authority") {
    const sub = c.sub[s.key] || { state: "prepare", round: 0 };
    body = sub.state === "submitted"
      ? `<p>Submitted on ${Q.esc(r.portal)}, reference <b class="num">${Q.esc(sub.ref)}</b>, round ${sub.round}. Record what ${Q.esc(r.authority)} decided.</p>
         ${s.licence ? `<label>Licence or certificate number<input id="lic-no" placeholder="e.g. 1234567"></label>` : ""}${s.visa ? Q.visaIssueFields(c) : ""}
         <label>The ${r.body}'s question or reason, if it was returned${c.service === "03" ? " or refused" : ""}<input id="req-text" placeholder="e.g. Clearer passport copy for the second owner"></label><div id="act-err"></div>
         <div class="row"><button class="btn" data-act="subApprove" data-id="${c.id}">Record: approved</button><button class="btn ghost" data-act="subReturn" data-id="${c.id}">Record: returned with a question</button>${c.service === "03" ? `<button class="btn ghost" data-act="subRefuse" data-id="${c.id}">Record: refused</button>` : ""}</div>`
      : `<p>${sub.round ? "The " + r.body + " returned round " + sub.round + ". Answer the question, then record the new reference." : "Submit this step by hand on the " + r.body + "'s system, then record it here."}</p>
         <div class="field-row"><label>System<input value="${Q.esc(r.portal)}" disabled></label><label>Portal account used<input value="${Q.esc(u.email)}" disabled></label><label>Reference given by the ${r.body}<input id="sub-ref" placeholder="e.g. APP-204518"></label></div><div id="act-err"></div>
         <div><button class="btn" data-act="subSubmit" data-id="${c.id}">Record the submission</button></div>`;
  } else if (s.type === "upload") body = `<p>The client uploaded <b>${Q.esc(c.premises.file)}</b>. Check the dates, the address and the registration number.</p><div><button class="btn" data-act="premisesOk" data-id="${c.id}">Accept the tenancy contract</button></div>`;
  else if (s.account) body = Q.accountForm(c);
  else if (s.cert) body = Q.certForm(c);
  else if (s.type === "appt") body = Q.apptStaffBody(c);
  else if (s.insurance) body = Q.insuranceForm(c);
  else body = `<label>Note for the record<input id="task-note" placeholder="What was done, and any reference"></label><div><button class="btn" data-act="taskDone" data-id="${c.id}">Mark this step done</button></div>${s.key === "agent" ? `<div class="note warn">Offshore companies are incorporated through a registered agent. Only the documents the agent needs are shared.</div>` : ""}`;
  return `<div class="callout"><div class="card-h"><h2>${Q.esc(s.title)}</h2>${Q.holderTag(c)}</div><p class="small muted">${Q.esc(Q.staffNext(c))}</p>${body}</div>`;
};

Q.screens.staffCase = (id, tab) => {
  const c = Q.getCase(id);
  if (!c) return Q.shell("queue", `<h1>Not found</h1><a class="btn ghost" href="#/staff/queue" style="justify-self:start">Back to the queue</a>`);
  const r = Q.ROUTES[c.route], a = Q.activity(c.activity);
  const panes = {
    work: () => `<div class="main-side"><div class="stack">${workPanel(c)}<div class="card"><h2>Playbook: ${Q.esc(r.name)}</h2>${Q.stepList(c, false)}</div></div>
      <div class="stack"><div class="card"><h3>Case facts</h3><div class="stack-s small">
          <div><span class="muted">Client</span><br>${Q.esc(c.clientName)}</div><div><span class="muted">Activity</span><br>${Q.esc(a.name)} · ${Q.esc(a.code)} · ${Q.esc(a.licence)}</div>
          <div><span class="muted">Other approvals</span><br>${a.approvals.length ? Q.esc(a.approvals.join("; ")) : "None"}</div>
          <div><span class="muted">Authority and system</span><br>${Q.esc(r.authority)} · ${Q.esc(r.portal)}</div>
          <div><span class="muted">Engagement</span><br>${c.quote.signed ? "Signed" : "Not signed"} · fee ${c.quote.depositPaid ? "paid" : "not paid"}</div>
          <div><span class="muted">Identity checks</span><br>${c.kyc.approvedBy ? "Approved by " + Q.esc(c.kyc.approvedBy) : "Not approved"}</div></div></div>
        <div class="card"><h3>Internal notes</h3>${c.notes.map((n) => `<div class="small"><b>${Q.esc(n.who)}</b> · ${Q.fmtDate(n.t)}<br>${Q.esc(n.text)}</div>`).join("") || `<p class="small muted">None. The client never sees these.</p>`}
          <div class="row"><input id="note-text" placeholder="Add a note" style="flex:1"><button class="btn ghost sm" data-act="addNote" data-id="${c.id}">Add</button></div></div></div></div>`,
    people: () => `<div class="grid2"><div class="card"><h2>Ownership</h2>${Q.ownChart(c)}</div>
      <div class="card flat"><table><tr><th>Document</th><th>For</th><th>Status</th></tr>${c.docs.map((d) => `<tr><td>${Q.esc(d.title)}</td><td>${Q.esc(d.forWho)}</td><td>${Q.tag({ missing: "Not received", uploaded: "To check", accepted: "Accepted", rejected: "Sent back" }[d.status], { missing: "plain", uploaded: "warn", accepted: "ok", rejected: "bad" }[d.status])}</td></tr>`).join("")}</table></div></div>`,
    filings: () => `<div class="card flat"><table><tr><th>Date</th><th>Step</th><th>Authority and system</th><th>Reference</th><th>Filed by</th><th>Outcome</th></tr>${c.submissions.map((x) => `<tr><td class="num">${Q.fmtDate(x.date)}</td><td>${Q.esc(x.step)}</td><td>${Q.esc(x.authority)}<div class="small muted">${Q.esc(x.portal)}</div></td><td class="num">${Q.esc(x.ref)}</td><td>${Q.esc(x.by)}</td><td>${Q.tag(x.outcome, x.outcome === "Approved" ? "ok" : x.outcome === "Returned" ? "bad" : "dark")}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">Nothing submitted yet.</td></tr>`}</table></div>
      <div class="card flat"><table><tr><th>Date</th><th>Round</th><th>Authority's question</th><th>Owner</th><th>Status</th></tr>${c.requests.map((x) => `<tr><td class="num">${Q.fmtDate(x.date)}</td><td class="num">${x.round}</td><td>${Q.esc(x.text)}</td><td>${Q.esc(x.owner)}</td><td>${Q.tag(x.open ? "Open" : "Answered", x.open ? "warn" : "ok")}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">No questions from the authority.</td></tr>`}</table></div>${c.service === "03" ? Q.bankHistoryCard(c) : ""}`,
    fees: () => `<div class="grid2"><div class="card"><div class="card-h"><h2>Quote</h2>${Q.tag(c.quote.accepted ? "Accepted" : "Not accepted yet", c.quote.accepted ? "ok" : "warn")}</div>${Q.quoteTable(c)}<p class="small muted">Fee table: sample figures, checked ${Q.fmtDate(Q.day(-30))}.</p></div>
      <div class="card"><h2>Payments received</h2>${c.payments.length ? `<table>${c.payments.map((p) => `<tr><td class="num">${Q.fmtDate(p.date)}</td><td>${Q.esc(p.label)}<div class="small muted">${Q.esc(p.ref)}</div></td><td class="right num">${Q.aed(p.amount)}</td></tr>`).join("")}</table>` : `<p class="muted">None yet.</p>`}</div></div>`,
    partners: () => Q.partnersPane(c),
    messages: () => `<div class="card">${Q.msgList(c)}</div>`,
    history: () => `<div class="card flat">${Q.logTable(c)}</div>`,
  };
  if (!panes[tab]) tab = "work";
  return Q.shell("queue", `<div class="crumbs"><a href="#/staff/queue">Work queue</a> / ${c.id}</div>
    <div class="spread"><div><h1>${Q.esc(c.company)}</h1><p class="muted">${Q.esc(c.clientName)} · ${Q.esc(r.name)} · opened ${Q.fmtDate(c.opened)}</p></div><div class="row">${Q.frozen(c) ? Q.tag("Screening alert open: filings blocked", "bad") : ""}${Q.holderTag(c)}</div></div>
    ${Q.tabs("#/staff/case/" + c.id, [["work", "Work"], ["people", "Owners and documents"], ["filings", "Filings and questions"], ["fees", "Fees"], ["partners", "Partners" + (Q.state.ptasks.filter((t) => t.caseId === c.id && t.status === "returned").length ? " (1)" : "")], ["messages", "Messages"], ["history", "History"]], tab)}
    ${panes[tab]()}`);
};

const sact = (fn) => (d) => { const c = Q.getCase(d.id); if (!c) throw new Error("Case not found: " + d.id); if (fn(c, d) === false) return; Q.save(); Q.render(); };
const actErr = (msg) => { document.getElementById("act-err").innerHTML = `<div class="note bad">${Q.esc(msg)}</div>`; return false; };
Q.actions.nudge = sact((c) => { c.messages.push({ from: Q.user().name, t: Q.day(), text: "A reminder: " + Q.lc1(Q.clientAsk(c)) + ". Open the case to do it." }); Q.log(c, "Sent the client a reminder"); });
Q.actions.docAccept = sact((c, d) => { const doc = c.docs.find((x) => x.id === d.doc); doc.status = "accepted"; Q.log(c, "Accepted: " + doc.title + " (" + doc.forWho + ")"); });
Q.actions.docReject = sact((c, d) => { const doc = c.docs.find((x) => x.id === d.doc); const reason = prompt("Why is it being sent back? The client sees this.", "The copy is cut off. Please upload the full page."); if (!reason) return false; doc.status = "rejected"; doc.reason = reason; Q.log(c, "Sent back: " + doc.title + ". " + reason); });
Q.actions.screen = sact((c) => { if (Q.cur(c).pack) return Q.runPackChecks(c); c.kyc.screening = "No match"; c.kyc.risk = c.owners.some((o) => o.kind === "company") ? "Medium" : "Low"; Q.log(c, "Ran sanctions and PEP screening: no match. Risk rated " + c.kyc.risk); });
Q.actions.kycApprove = sact((c) => { if (!Q.user().compliance || !Q.kycReady(c)) throw new Error("Only the compliance officer can approve, and only when the file is ready."); c.kyc.approvedBy = Q.user().name; Q.log(c, "Compliance officer approved the identity checks"); Q.advance(c); });
Q.actions.subSubmit = sact((c) => {
  if (Q.frozen(c)) return actErr("Blocked: a sanctions screening alert is open on this client. Nothing is filed until the compliance officer closes it.");
  // Fail closed: no filing without an approved identity file and a paid engagement.
  if (!c.kyc.approvedBy || !c.quote.depositPaid) return actErr("Blocked: the identity checks are not approved or the engagement is not paid.");
  const ref = Q.val("sub-ref"); if (!ref) return actErr("Enter the reference the authority gave.");
  const s = Q.cur(c), r = Q.ROUTES[c.route], prev = c.sub[s.key] || { round: 0 };
  c.requests.forEach((x) => { if (x.step === s.key) x.open = false; });
  c.sub[s.key] = { state: "submitted", ref, round: prev.round + 1 };
  c.submissions.push({ step: s.title, authority: r.authority, portal: r.portal, ref, by: Q.user().name, date: Q.day(), outcome: "Waiting" });
  Q.log(c, "Submitted " + s.title + " on " + r.portal + ", reference " + ref);
});
const lastSub = (c) => c.submissions[c.submissions.length - 1];
Q.actions.subApprove = sact((c) => {
  const s = Q.cur(c);
  if (s.licence) { const no = Q.val("lic-no"); if (!no) return actErr("Enter the licence or certificate number."); c.licence = { no, issued: Q.day(), expires: Q.addDays(Q.day(), 365) }; }
  if (s.visa && Q.readVisa(c) === false) return false;
  if (s.permit) c.permitDue = Q.addDays(Q.day(), s.permit);
  if (s.renew) Q.applyRenewal(c);
  c.sub[s.key].state = "approved"; lastSub(c).outcome = "Approved"; Q.log(c, "Authority approved: " + s.title); Q.advance(c);
});
Q.actions.subReturn = sact((c) => {
  const s = Q.cur(c), text = Q.val("req-text"); if (!text) return actErr("Write down what the authority asked for.");
  c.sub[s.key].state = "prepare"; lastSub(c).outcome = "Returned";
  c.requests.push({ step: s.key, date: Q.day(), round: c.sub[s.key].round, text, owner: Q.user().name, open: true }); Q.log(c, "Authority returned " + s.title + ": " + text);
});
Q.actions.premisesOk = sact((c) => { Q.log(c, "Accepted the tenancy contract"); Q.advance(c); });
Q.actions.taskDone = sact((c) => { if (Q.cur(c).account && Q.readAccount(c) === false) return false; if (Q.cur(c).cert && Q.readCert(c) === false) return false; if (Q.cur(c).insurance && Q.readInsurance(c) === false) return false; if (Q.cur(c).applyChange) Q.applyOwnerChange(c); const n = Q.val("task-note"); if (n) c.notes.push({ who: Q.user().name, t: Q.day(), text: n }); Q.advance(c); });
Q.actions.addNote = sact((c) => { const n = Q.val("note-text"); if (!n) return false; c.notes.push({ who: Q.user().name, t: Q.day(), text: n }); });

Q.screens.kycQueue = () => {
  const ready = Q.state.cases.filter(Q.kycReady), u = Q.user();
  const coming = Q.state.cases.filter((c) => onKyc(c) && !Q.cur(c).plain && !Q.kycReady(c));
  return Q.shell("kyc", `<h1>Compliance approvals</h1><p class="muted">Identity files ready for the compliance officer. ${u.compliance ? "" : "You can see the queue; only the compliance officer can approve."}</p>
    <div class="card flat"><table><tr><th>Case</th><th>Company</th><th>Owners</th><th>Screening</th><th>Risk</th><th></th></tr>
    ${ready.map((c) => `<tr><td class="num">${c.id}</td><td><b>${Q.esc(c.company)}</b><div class="small muted">${Q.esc(c.clientName)}</div></td><td>${c.owners.map((o) => Q.esc(o.name) + " " + o.pct + "%").join("<br>")}</td><td>${Q.tag(c.kyc.screening, "ok")}</td><td>${Q.tag(c.kyc.risk, c.kyc.risk === "Low" ? "ok" : "warn")}</td><td class="right"><a class="btn sm ghost" href="#/staff/case/${c.id}">Open the file</a></td></tr>`).join("") || `<tr><td colspan="6" class="muted">Nothing is waiting for approval.</td></tr>`}</table></div>
    <h2>Not ready yet</h2><div class="card flat"><table><tr><th>Case</th><th>Company</th><th>What is missing</th></tr>
    ${coming.map((c) => `<tr class="link" data-href="#/staff/case/${c.id}"><td class="num">${c.id}</td><td>${Q.esc(c.company)}</td><td>${Q.esc(Q.staffNext(c))}</td></tr>`).join("") || `<tr><td colspan="3" class="muted">No files in preparation.</td></tr>`}</table></div>`);
};

Q.screens.reports = () => {
  const cs = Q.state.cases, by = {};
  cs.forEach((c) => { const k = Q.ROUTES[c.route].name; by[k] = by[k] || { open: 0, done: 0, returned: 0 }; by[k][c.status === "complete" ? "done" : "open"]++; by[k].returned += c.requests.length; });
  const fees = cs.reduce((n, c) => n + c.payments.filter((p) => p.kind === "qantara").reduce((m, p) => m + p.amount, 0), 0);
  const gov = cs.reduce((n, c) => n + c.payments.filter((p) => p.kind === "gov").reduce((m, p) => m + p.amount, 0), 0);
  return Q.shell("reports", `<h1>Reports</h1><p class="muted">All services, all cases in the demo data.</p>
    <div class="grid4"><div class="card stat"><b>${cs.filter((c) => c.status === "open").length}</b><span>open cases</span></div><div class="card stat"><b>${cs.reduce((n, c) => n + c.requests.length, 0)}</b><span>returns from authorities</span></div>
      <div class="card stat"><b style="font-size:22px">${Q.aed(fees)}</b><span>Qantara fees received, with VAT</span></div><div class="card stat"><b style="font-size:22px">${Q.aed(gov)}</b><span>government fees passed on</span></div></div>
    <div class="card flat"><table><tr><th>Where</th><th class="right">Open</th><th class="right">Complete</th><th class="right">Returns</th></tr>${Object.entries(by).map(([k, v]) => `<tr><td>${Q.esc(k)}</td><td class="right num">${v.open}</td><td class="right num">${v.done}</td><td class="right num">${v.returned}</td></tr>`).join("")}</table></div>`);
};

Q.screens.rules = () => Q.shell("rules", `<h1>Rules and fee tables</h1><p class="muted">What every case reads from. Staff change these here, not in code. Read-only in this mockup.</p>
  ${Object.values(Q.ROUTES).map((r) => `<div class="card"><div class="card-h"><h2>${Q.esc(r.name)}</h2><div class="row">${Q.tag("Version 1", "plain")}${Q.tag("Checked " + Q.fmtDate(Q.day(-30)), "plain")}${Q.tag(r.by, r.by === "Qantara team" ? "" : "dark")}</div></div>
    <p class="small muted">${Q.esc(Q.SERVICES[r.service])} · ${Q.esc(r.authority)} · system: ${Q.esc(r.portal)}</p>
    ${r.rules ? `<div><h3>Eligibility rules</h3><table>${r.rules.map(([l]) => `<tr><td>${Q.esc(l)}</td></tr>`).join("")}</table></div>` : ""}
    <div class="grid2"><div><h3>Playbook</h3><table>${r.steps.map((s, i) => `<tr><td class="num">${i + 1}</td><td>${Q.esc(s.title)}</td><td class="small muted">${Q.esc(s.est)}</td></tr>`).join("")}</table></div>
      <div><h3>Fee table</h3><table>${r.gov.map(([l, n]) => `<tr><td>${Q.esc(l)}</td><td class="right num">${Q.aed(n)}</td></tr>`).join("")}<tr><td>Qantara service fee, before VAT</td><td class="right num">${Q.aed(r.qFee)}</td></tr></table></div></div></div>`).join("")}`);
