/* Small helpers shared by every screen. */
Q.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
Q.aed = (n) => "AED " + Number(n).toLocaleString("en-US");
Q.fmtDate = (iso) => (iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—");
Q.initials = (name) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
Q.tag = (text, kind) => `<span class="tag ${kind || ""}">${Q.esc(text)}</span>`;
Q.holderTag = (c) => { const h = Q.holder(c); return Q.tag(h === "done" ? "Complete" : "With " + (h === "authority" ? Q.ROUTES[c.route].body : h === "qantara" ? "Qantara" : h === "client" && Q.user() && Q.user().role === "client" ? "you" : Q.holderName[h].toLowerCase().replace("the ", "")), h === "client" ? "warn" : h === "authority" || h === "partner" ? "dark" : h === "done" ? "ok" : ""); };
/* Lower-case the first letter only, and not when the word is an acronym such as ICV. */
Q.lc1 = (s) => (/^[A-Z][a-z ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
/* "2 document(s)" reads as "2 documents", "1 document(s)" as "1 document". Applied once, when a screen is drawn. */
Q.plural = (html) => html.replace(/\b(\d+) ((?:[A-Za-z-]+ ){0,2}[A-Za-z-]+)\((e?s)\)/g, (m, n, w, s) => n + " " + w + (n === "1" ? "" : s));
Q.val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
Q.go = (hash) => { if (location.hash === hash) Q.render(); else location.hash = hash; };

Q.logo = `<svg width="38" height="26" viewBox="0 0 44 30" aria-hidden="true"><path d="M2 26 C2 10 12 4 22 4 C32 4 42 10 42 26" fill="none" stroke="#a7c0ff" stroke-width="3" stroke-linecap="round"/><path d="M2 26 H42" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><path d="M12 26 V14 M22 26 V8 M32 26 V14" stroke="#ffffff" stroke-width="2"/></svg>`;

const NAV_KEY = { setup: "services", sector: "services", bank: "services", visa: "services", acc: "services", xb: "services", legal: "services", mkt: "services", pro: "calendar", overview: "connect", integ: "connect", wa: "connect" };
Q.shell = (active, body) => {
  const u = Q.user(), raw = active;
  active = NAV_KEY[active] || (/^s\d\d$/.test(active) ? "services" : active);
  const svcOf = { acc: "06", xb: "07", legal: "15", mkt: "16" }[raw];
  if (u.role === "client" && svcOf && body.trim().startsWith("<h1>")) body = `<div class="crumbs"><a href="#/services">Services</a> / <a href="#/services/${svcOf}">${Q.esc(Q.SERVICES[svcOf])}</a></div>` + body;
  if (u.role === "client" && ["overview", "integ", "wa"].includes(raw)) body = `<div class="tabs">${[["#/overview", "Overview", "overview"], ["#/integrations", "Connections", "integ"], ["#/whatsapp", "WhatsApp", "wa"]].map(([h, l, k]) => `<a href="${h}" class="${k === raw ? "on" : ""}">${l}</a>`).join("")}</div>` + body;
  const mine = Q.state.cases.filter((c) => c.clientId === u.id);
  const asks = mine.filter((c) => Q.clientAsk(c)).length;
  const waiting = Q.state.cases.filter((c) => Q.holder(c) === "qantara").length;
  const kycWait = Q.state.cases.filter((c) => Q.kycReady(c)).length;
  const item = (hash, label, key, count) => `<a href="${hash}" class="${active === key ? "on" : ""}"><span>${label}</span>${count ? `<span class="count">${count}</span>` : ""}</a>`;
  const off = (label) => `<a class="off" title="Not in this mockup yet"><span>${label}</span></a>`;
  const nav = u.role === "partner" ? (Q.onbStatus(Q.partner(u.partnerId)) !== "approved" ? `<div class="nav-h">${Q.esc(u.title)}</div>${item("#/partner/onboarding", "Onboarding", "onboarding")}` : "") || `<div class="nav-h">${Q.esc(u.title)}</div>${Q.state.onb[u.partnerId] ? item("#/partner/onboarding", "Firm record", "onboarding") : ""}${item("#/partner/tasks", "Our tasks", "ptasks", Q.state.ptasks.filter((t) => t.partnerId === u.partnerId && t.status === "assigned").length)}${Q.partner(u.partnerId).type === "Marketing agency" ? item("#/partner/marketing", "Client content", "pmkt") : ""}` : u.role === "client"
    ? `<div class="nav-h">My workspace</div>${item("#/home", "Home", "home", asks)}${item("#/services", "Services", "services")}${item("#/cases", "My cases", "cases")}${item("#/compliance", "Calendar", "calendar", mine.length ? Q.obligations(u.id).filter((o) => !(o.days > 30) && !o.done).length : 0)}${item("#/documents", "Documents", "documents")}${item("#/payments", "Payments", "payments")}${item("#/messages", "Messages", "messages")}
       <div class="nav-h">Your business</div>${item("#/overview", "Business overview", "connect")}`
    : `<div class="nav-h">Work</div>${item("#/staff/queue", "Work queue", "queue", waiting)}${item("#/staff/inbox", "Document inbox", "inbox", Q.state.inbox.filter((x) => x.status === "to-sort").length)}${item("#/staff/kyc", "Compliance approvals", "kyc", kycWait)}${item("#/staff/deadlines", "Deadlines", "deadlines")}${item("#/staff/screening", "Sanctions screening", "screening", Q.state.screen.alerts.filter((a) => a.status === "open").length)}${item("#/staff/legal", "Legal matters", "slegal")}${item("#/staff/marketing", "Marketing approvals", "smkt", Object.values(Q.state.mkt).reduce((n, m) => n + m.items.filter((i) => i.stage === "compliance").length, 0))}${item("#/staff/reports", "Reports", "reports")}
       <div class="nav-h">Set-up of the platform</div>${item("#/staff/rules", "Rules and fee tables", "rules")}${item("#/staff/partners", "Partner firms", "partners")}`;
  return `<div class="shell">
    <aside class="rail">
      <div class="brand">${Q.logo}<div><b>Qantara</b><span>A Neuroniks Limited initiative</span></div></div><button class="menu-btn" data-act="menu" aria-expanded="false">Menu</button>
      <nav class="nav">${nav}</nav>
      <div class="rail-foot"><div class="who"><b>${Q.esc(u.name)}</b><span>${Q.esc(u.title)}</span></div>
        <button data-act="signOut">Sign out / switch user</button><button data-act="reset">Reset demo data</button></div>
    </aside>
    <div class="content"><div class="demo">Mockup with made-up data. No figure, name, fee or duration on this screen is real.</div><main class="page">${body}</main></div>
  </div>`;
};

/* One frame for every wizard: where you are, a way back, one topic, problems at the top, a button that says what it does. */
Q.wiz = (o) => {
  const n = o.steps.length, i = o.step, last = i === n - 1;
  return Q.shell(o.active, `<div class="crumbs"><a href="#/services">Services</a> / ${o.svc ? `<a href="#/services/${o.svc}">${Q.esc(Q.SERVICES[o.svc])}</a> / ` : ""}${o.svc && Q.SERVICES[o.svc] === o.title ? "New request" : Q.esc(o.title)}</div>
    <div class="wiz-head"><h1>${Q.esc(o.title)}</h1><div class="wiz-pos">Step ${i + 1} of ${n}: ${Q.esc(o.steps[i])}</div>
      <ol class="wiz-steps">${o.steps.map((w, k) => `<li class="${k === i ? "on" : k < i ? "done" : ""}"><span>${k < i ? "✓" : k + 1}</span>${Q.esc(w)}</li>`).join("")}</ol></div>
    ${o.err ? `<div class="errsum" role="alert"><b>There is a problem</b><div>${Q.esc(o.err)}</div></div>` : ""}
    <div class="main-side"><div class="stack">${o.body}
      <div class="row">${i > 0 ? `<button class="btn ghost" data-act="${o.back}">Back</button>` : ""}<button class="btn" data-act="${o.next}" ${o.disabled ? "disabled" : ""}>${last ? Q.esc(o.sendLabel || "Send to Qantara") : "Continue to " + Q.esc(Q.lc1(o.steps[i + 1]))}</button><button class="btn link" data-act="${o.cancel}">Cancel this request</button></div>
      <p class="small muted">Your answers are saved on this device as you go. You can leave and come back. Nothing is sent until the last step.</p></div>
      <div class="stack">${o.why ? `<div class="card"><h3>Why we ask</h3><p class="small muted">${Q.esc(o.why)}</p></div>` : ""}${Q.helpCard()}</div></div>`);
};

Q.stepList = (c, forClient) => {
  const steps = Q.steps(c);
  return `<div class="steps">${steps.map((s, i) => {
    const state = c.status === "complete" || i < c.stepIndex ? "done" : i === c.stepIndex ? "now" : "todo";
    const right = state === "done" ? Q.tag("Done", "ok") : state === "now" ? Q.holderTag(c) : `<span class="small muted">Estimate: ${Q.esc(s.est)}</span>`;
    const sub = state === "now" ? `<div class="small muted">${Q.esc(forClient ? (Q.clientAsk(c) || Q.waitText(c)) : Q.staffNext(c))} · ${/^Your choice/.test(s.est) ? "timing: " + Q.esc(Q.lc1(s.est)) : "estimate " + Q.esc(s.est)}</div>` : "";
    return `<div class="step ${state}"><div class="dot">${state === "done" ? "✓" : i + 1}</div><div><b>${Q.esc(s.title)}</b>${sub}</div><div>${right}</div></div>`;
  }).join("")}</div>`;
};
Q.waitText = (c) => (Q.holder(c) === "partner" ? "With " + Q.partner(Q.stepTask(c, Q.cur(c)).partnerId).name + ", working with Qantara on this case. Nothing needed from you" : Q.holder(c) === "authority" ? "Submitted. Waiting for " + Q.ROUTES[c.route].authority : "Qantara is working on this. Nothing needed from you");

Q.quoteTable = (c) => {
  const q = c.quote;
  return `<table>
    <tr><td class="sub" colspan="2">Qantara's fee</td></tr>
    <tr><td>${q.covered ? "Covered by your compliance plan" : "Service fee, " + Q.esc(Q.ROUTES[c.route].name)}</td><td class="right num">${Q.aed(q.qFee)}</td></tr>
    <tr><td>VAT at ${Q.VAT}%</td><td class="right num">${Q.aed(q.vat)}</td></tr>
    ${q.gov.length ? `<tr><td class="sub" colspan="2">${Q.esc(Q.ROUTES[c.route].govLabel || "Government fees, passed on at cost with the receipt in your name")}</td></tr>` : Q.ROUTES[c.route].body === "bank" ? `<tr><td class="sub" colspan="2">The bank's own charges are set by the bank and paid to the bank</td></tr>` : ""}
    ${q.gov.map((g) => `<tr><td>${Q.esc(g.label)}</td><td class="right num">${Q.aed(g.amount)}</td></tr>`).join("")}
    <tr class="total"><td>Total</td><td class="right num">${Q.aed(q.qFee + q.vat + Q.govTotal(c))}</td></tr>
  </table>`;
};

Q.ownChart = (c) => `<div class="own">
  <div class="own-box co"><b>${Q.esc(c.company)}</b><div class="small">${Q.esc(Q.ROUTES[c.route].name)}</div></div><div class="own-line"></div>
  <div class="own-row">${c.owners.map((o) => `<div class="own-box"><div class="own-pct num">${o.pct}%</div><b>${Q.esc(o.name)}</b><div class="small muted">${o.kind === "company" ? "Company" : "Person"} · ${Q.esc(o.nationality)}</div>${o.kind === "company" ? Q.tag("Owners behind it needed", "warn") : o.pct >= 25 ? Q.tag("Beneficial owner", "dark") : ""}</div>`).join("")}</div>
</div>`;

Q.logTable = (c) => `<table><tr><th>Date</th><th>Who</th><th>What</th></tr>${c.log.slice().reverse().map((l) => `<tr><td class="num">${Q.fmtDate(l.t)}</td><td>${Q.esc(l.who)}</td><td>${Q.esc(l.what)}</td></tr>`).join("") || `<tr><td colspan="3" class="muted">Nothing recorded yet.</td></tr>`}</table>`;

Q.msgList = (c) => `<div class="msgs">${c.messages.map((m) => `<div class="msg ${m.from === Q.user().name ? "me" : ""}"><small>${Q.esc(m.from)} · ${Q.fmtDate(m.t)}</small>${Q.esc(m.text)}</div>`).join("") || `<p class="muted">No messages on this case yet.</p>`}</div>
  <div class="row"><input id="msg-text" placeholder="Write a message" style="flex:1"><button class="btn" data-act="sendMsg" data-id="${c.id}">Send</button></div>`;

Q.tabs = (base, tabs, on) => `<div class="tabs">${tabs.map(([k, label]) => `<a href="${base}/${k}" class="${k === on ? "on" : ""}">${label}</a>`).join("")}</div>`;
