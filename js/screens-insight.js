/* Voluntary integrations and the client's business overview. Connections are read-only and optional;
   nothing else on the platform depends on them. All figures are made up. */
Q.PROVIDERS = [
  { id: "zoho-books", name: "Zoho Books", kind: "ledger", reads: "Invoices, bills, bank transactions and the profit and loss" },
  { id: "xero", name: "Xero", kind: "ledger", reads: "Invoices, bills, bank transactions and the profit and loss" },
  { id: "quickbooks", name: "QuickBooks Online", kind: "ledger", reads: "Invoices, bills, bank transactions and the profit and loss" },
  { id: "wafeq", name: "Wafeq", kind: "ledger", reads: "Invoices, bills, bank transactions and the profit and loss" },
  { id: "zoho-crm", name: "Zoho CRM", kind: "sales", reads: "Open deals and their value" },
  { id: "bank-feed", name: "Bank feed", kind: "bank", reads: "Account balances and transactions, through a licensed open-finance provider" },
];
Q.KINDS = [["ledger", "Accounting software", "One at a time. This is what fills the business overview."], ["sales", "Sales", "Adds your open deals to the overview."], ["bank", "Bank", "Adds your cash balance to the overview."]];
const integOf = (coId) => Q.state.integ[coId] || {};
const ledgerOf = (coId) => Q.PROVIDERS.find((p) => p.kind === "ledger" && integOf(coId)[p.id]);
const pickCo = (id) => { const cos = companiesOf(Q.user().id); return cos.find((c) => c.id === id) || cos[0] || null; };
const coTabs = (base, co) => { const cos = companiesOf(Q.user().id); return cos.length > 1 ? `<div class="tabs">${cos.map((c) => `<a href="${base}/${c.id}" class="${c.id === co.id ? "on" : ""}">${Q.esc(c.company)}</a>`).join("")}</div>` : ""; };

Q.screens.integrations = (coId) => {
  const co = pickCo(coId), u = Q.user(), wa = Q.state.wa[u.id], dr = Q.state.integDraft;
  if (!co) return Q.shell("integ", `<h1>Integrations</h1><div class="card"><p class="muted">Integrations open once you have a licensed company.</p></div>`);
  const mine = integOf(co.id);
  return Q.shell("integ", `<h1>Integrations</h1><p class="muted">All optional. Qantara does its work without them. Connect one only if you want to see your own numbers here or send documents more easily.</p>
    <div class="note">Every connection is read-only. Qantara never writes to your software, never moves money and never sees your password: you sign in at the provider. You can disconnect at any time.</div>
    ${coTabs("#/integrations", co)}
    ${Q.KINDS.map(([kind, title, hint]) => `<div class="stack-s"><h2>${title}</h2><p class="small muted">${hint}</p></div><div class="grid2">${Q.PROVIDERS.filter((p) => p.kind === kind).map((p) => { const on = mine[p.id], other = kind === "ledger" && !on && ledgerOf(co.id); return `<div class="card"><div class="card-h"><h3>${Q.esc(p.name)}</h3>${on ? Q.tag("Connected", "ok") : Q.tag("Not connected", "plain")}</div>
        <p class="small muted">Reads: ${Q.esc(p.reads)}.</p>
        ${on ? `<p class="small">Connected ${Q.fmtDate(on.since)} · last read ${Q.fmtDate(on.lastRead)}</p><div class="row"><button class="btn sm ghost" data-act="integOff" data-id="${co.id}" data-p="${p.id}">Disconnect</button></div>`
          : dr && dr.coId === co.id && dr.pid === p.id ? `<label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input id="integ-ok" type="checkbox" style="width:auto;margin-top:4px"><span>I agree that Qantara may read this data for ${Q.esc(co.company)}, to show it to me and to my Qantara adviser. Nobody else sees it.</span></label><div id="act-err"></div><div class="row"><button class="btn sm" data-act="integOn" data-id="${co.id}" data-p="${p.id}">Continue to ${Q.esc(p.name)} to sign in</button><button class="btn sm ghost" data-act="integCancel">Cancel</button></div>`
          : other ? `<p class="small muted">${Q.esc(other.name)} is connected. Disconnect it first to switch.</p>` : `<div><button class="btn sm" data-act="integAsk" data-id="${co.id}" data-p="${p.id}">Connect</button></div>`}</div>`; }).join("")}</div>`).join("")}
    <div class="stack-s"><h2>WhatsApp</h2><p class="small muted">For your whole account. Send invoices, statements and receipts from your phone; they are filed for you.</p></div>
    <div class="card"><div class="card-h"><h3>Send documents by WhatsApp</h3>${wa ? Q.tag("Linked: " + wa.number, "ok") : Q.tag("Not linked", "plain")}</div>
      ${wa ? `<p class="small">Linked ${Q.fmtDate(wa.since)}. Only this number is accepted for your account.</p><div class="row"><a class="btn sm" href="#/whatsapp">Open WhatsApp</a><button class="btn sm ghost" data-act="waOff">Unlink</button></div>`
        : `<div class="field-row"><label>Your WhatsApp number<input id="wa-num" placeholder="+971 50 000 0000"></label><button class="btn sm" data-act="waOn">Link this number</button></div><div id="wa-err"></div><p class="small muted">Documents from a number that is not linked are not accepted. Never send a password or a one-time code.</p>`}</div>`);
};
Q.actions.integAsk = (d) => { Q.state.integDraft = { coId: d.id, pid: d.p }; Q.save(); Q.render(); };
Q.actions.integCancel = () => { Q.state.integDraft = null; Q.save(); Q.render(); };
Q.actions.integOn = (d) => {
  const co = myCompany(d.id), p = Q.PROVIDERS.find((x) => x.id === d.p);
  if (!co || !p) throw new Error("Unknown company or provider");
  // No connection without recorded consent.
  if (!document.getElementById("integ-ok").checked) { document.getElementById("act-err").innerHTML = `<div class="note bad">Tick the box to agree before connecting.</div>`; return; }
  if (p.kind === "ledger" && ledgerOf(co.id)) throw new Error("Another accounting connection is already active.");
  (Q.state.integ[co.id] = Q.state.integ[co.id] || {})[p.id] = { since: Q.day(), lastRead: Q.day(), consent: Q.day() };
  Q.state.integDraft = null; Q.save(); Q.render();
};
Q.actions.integOff = (d) => { const co = myCompany(d.id); if (!co) throw new Error("Unknown company"); if (!confirm("Disconnect? Qantara stops reading, and the figures read so far are removed from your overview.")) return; delete Q.state.integ[co.id][d.p]; Q.save(); Q.render(); };

/* ---- Business overview ---- */
const monthsBack = (n) => Array.from({ length: n }, (_, i) => Q.ym(n - i));
const k = (n) => (n >= 1000 ? Math.round(n / 1000) + "k" : String(n));
const barChart = (rows) => {
  const W = 640, H = 250, L = 44, R = 8, T = 10, B = 28, max = Math.ceil(Math.max(...rows.map((r) => Math.max(r.sales, r.costs))) / 20000) * 20000;
  const y = (v) => T + (H - T - B) * (1 - v / max), gw = (W - L - R) / rows.length, bw = 22, gap = 2;
  const bar = (x, v, cls) => { const top = y(v), h = H - B - top; return `<path class="${cls}" d="M${x},${H - B} v${-(h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${h - 4} z"/>`; };
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sales and costs for the last ${rows.length} months">
    ${[0, 0.25, 0.5, 0.75, 1].map((f) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}"/><text x="${L - 6}" y="${y(max * f) + 4}" text-anchor="end">${k(max * f)}</text>`).join("")}
    ${rows.map((r, i) => { const cx = L + gw * i + gw / 2; return `${bar(cx - bw - gap / 2, r.sales, "s1")}${bar(cx + gap / 2, r.costs, "s2")}<text x="${cx}" y="${H - 9}" text-anchor="middle">${Q.ymLabel(r.ym).split(" ")[0]}</text>
      <rect class="hit" x="${L + gw * i}" y="${T}" width="${gw}" height="${H - T - B}" data-tip="${Q.esc(Q.ymLabel(r.ym))}|Sales ${Q.aed(r.sales)}|Costs ${Q.aed(r.costs)}|Result ${Q.aed(r.sales - r.costs)}"/>`; }).join("")}
  </svg><div class="tip"></div></div>`;
};
Q.screens.overview = (coId) => {
  const co = pickCo(coId);
  if (!co) return Q.shell("overview", `<h1>Business overview</h1><div class="card"><p class="muted">The overview opens once you have a licensed company.</p></div>`);
  const led = ledgerOf(co.id), on = integOf(co.id);
  if (!led) return Q.shell("overview", `<h1>Business overview</h1>${coTabs("#/overview", co)}<div class="card"><h2>See how ${Q.esc(co.company)} is doing</h2><p class="muted">This page is optional. Connect your accounting software and it shows your sales, costs and what you are owed, read straight from your own books.</p><div><a class="btn" href="#/integrations/${co.id}">Choose what to connect</a></div><p class="small muted">Nothing else on the platform needs it.</p></div>`);
  const rows = monthsBack(6).map((ym) => { const l = Q.ledger(co.id, ym); return { ym, sales: l.sales, costs: l.purchases }; });
  const last = rows[5], prev = rows[4], seed = last.sales % 97, ch = Math.round((100 * (last.sales - prev.sales)) / prev.sales);
  const stale = daysTo(on[led.id].lastRead) < -2;
  const tile = (label, val, sub) => `<div class="card stat"><span>${label}</span><b style="font-size:24px">${val}</b><span>${sub}</span></div>`;
  return Q.shell("overview", `<div class="spread"><div><h1>Business overview</h1><p class="muted">${Q.esc(co.company)} · read from ${Q.esc(led.name)}, your own books · last read ${Q.fmtDate(on[led.id].lastRead)}</p></div><div class="row"><button class="btn ghost sm" data-act="integRefresh" data-id="${co.id}">Read again now</button><a class="btn ghost sm" href="#/integrations/${co.id}">Manage connections</a></div></div>
    ${coTabs("#/overview", co)}${stale ? `<div class="note warn">These figures were last read more than two days ago.</div>` : ""}
    <div class="grid4">${tile("Sales, " + Q.ymLabel(last.ym), Q.aed(last.sales), `<span class="delta">${ch >= 0 ? "▲" : "▼"} ${Math.abs(ch)}%</span> on the month before`)}
      ${tile("Costs, " + Q.ymLabel(last.ym), Q.aed(last.costs), "Purchases and running costs")}${tile("Result, " + Q.ymLabel(last.ym), Q.aed(last.sales - last.costs), "Sales less costs, before tax")}
      ${tile("Customers owe you", Q.aed(18000 + seed * 400), (3 + (seed % 5)) + " unpaid invoices")}</div>
    <div class="card"><div class="card-h"><h2>Sales and costs, last 6 months</h2><div class="legend"><span><i style="background:var(--series-1)"></i>Sales</span><span><i style="background:var(--series-2)"></i>Costs</span></div></div>
      ${barChart(rows)}
      <details><summary class="small muted">Show as a table</summary><table><tr><th>Month</th><th class="right">Sales</th><th class="right">Costs</th><th class="right">Result</th></tr>${rows.map((r) => `<tr><td>${Q.ymLabel(r.ym)}</td><td class="right num">${Q.aed(r.sales)}</td><td class="right num">${Q.aed(r.costs)}</td><td class="right num">${Q.aed(r.sales - r.costs)}</td></tr>`).join("")}</table></details></div>
    <div class="grid3">${tile("Bills to pay", Q.aed(9000 + seed * 250), "Due in the next 30 days")}
      ${on["bank-feed"] ? tile("Cash in the bank", Q.aed(140000 + seed * 1500), "From your bank feed") : `<div class="card"><span class="muted small">Cash in the bank</span><p class="small">Connect a bank feed to see it here.</p><a class="btn ghost sm" href="#/integrations/${co.id}" style="justify-self:start">Connect</a></div>`}
      ${on["zoho-crm"] ? tile("Open deals", Q.aed(210000 + seed * 2000), (6 + (seed % 7)) + " deals, from Zoho CRM") : `<div class="card"><span class="muted small">Open deals</span><p class="small">Connect Zoho CRM to see them here.</p><a class="btn ghost sm" href="#/integrations/${co.id}" style="justify-self:start">Connect</a></div>`}</div>
    <p class="small muted">A high-level view of your own figures. It is not a set of accounts and not advice. Tax dates are on the <a href="#/compliance">compliance calendar</a>.</p>`);
};
Q.actions.integRefresh = (d) => { const co = myCompany(d.id); if (!co) throw new Error("Unknown company"); Object.values(Q.state.integ[co.id]).forEach((x) => (x.lastRead = Q.day())); Q.save(); Q.render(); };
document.addEventListener("mousemove", (e) => {
  const hit = e.target.closest ? e.target.closest(".chart .hit") : null, tip = document.querySelector(".chart .tip");
  if (!tip) return;
  if (!hit) { tip.style.display = "none"; return; }
  const [head, ...lines] = hit.dataset.tip.split("|"), box = tip.parentElement.getBoundingClientRect();
  tip.innerHTML = `<b>${Q.esc(head)}</b>${lines.map(Q.esc).join("<br>")}`;
  tip.style.display = "block"; tip.style.left = e.clientX - box.left + "px"; tip.style.top = e.clientY - box.top - 12 + "px";
});
