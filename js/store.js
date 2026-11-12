/* State lives in this browser only (localStorage). "Reset demo data" in the menu restores the seed. */
Q.KEY = "qantara-mockup-v10";
Q.VAT = 5; // per cent, on Qantara's own fee only

Q.day = (offset) => { const d = new Date(); d.setDate(d.getDate() + (offset || 0)); return d.toISOString().slice(0, 10); };
Q.addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

Q.kycDocs = (owners) => {
  const docs = [];
  owners.forEach((o) => {
    if (o.kind === "company") {
      docs.push({ id: "d" + docs.length, title: "Certificate of incorporation, legalised", forWho: o.name, status: "missing" });
      docs.push({ id: "d" + docs.length, title: "Board resolution to hold the shares, legalised", forWho: o.name, status: "missing" });
    } else {
      docs.push({ id: "d" + docs.length, title: "Passport copy", forWho: o.name, status: "missing" });
      docs.push({ id: "d" + docs.length, title: "Proof of home address", forWho: o.name, status: "missing" });
    }
  });
  docs.push({ id: "d" + docs.length, title: "Source of funds statement", forWho: "The company", status: "missing" });
  return docs;
};

Q.buildQuote = (routeId) => {
  const r = Q.ROUTES[routeId];
  return { qFee: r.qFee, vat: Math.round((r.qFee * Q.VAT) / 100), gov: r.gov.map(([label, amount]) => ({ label, amount })), accepted: false, signed: false, depositPaid: false, govPaid: false };
};

Q.newCase = (o) => {
  const c = Object.assign({
    id: "QS-" + (1000 + Q.state.seq++), service: "01", status: "open", stepIndex: 0, opened: Q.day(), sub: {}, premises: {}, licence: null,
    kyc: { screening: null, risk: null, approvedBy: null }, requests: [], submissions: [], messages: [], notes: [], log: [], payments: [], appts: {}, conds: [],
  }, o);
  c.docs = c.docs || Q.kycDocs(c.owners);
  c.quote = c.quote || Q.buildQuote(c.route);
  return c;
};

Q.seed = () => {
  Q.state = { seq: 41, userId: null, pendingUser: null, draft: null, cases: [], plans: {}, acc: {}, xb: {}, integ: {}, wa: {}, waChat: {}, inbox: [], ptasks: [], matters: [], mkt: {}, screen: { lastRun: Q.day(-3), runs: 0, alerts: [] } };
  const mk = (o, upTo, extra) => {
    const c = Q.newCase(o);
    const steps = Q.ROUTES[c.route].steps;
    c.stepIndex = upTo;
    if (upTo > 0) { Object.assign(c.quote, { accepted: true, signed: true, depositPaid: true }); c.payments.push({ kind: "qantara", label: "Qantara service fee with VAT", amount: c.quote.qFee + c.quote.vat, date: Q.addDays(c.opened, 1), ref: "INV-" + c.id.slice(3) }); }
    if (upTo > 1) { c.docs.forEach((d) => (d.status = "accepted")); c.kyc = { screening: "No match", risk: "Low", approvedBy: "Priya Nair" }; }
    steps.slice(0, upTo).forEach((s, i) => {
      if (s.type === "authority") { c.sub[s.key] = { state: "approved", ref: "REF-" + c.id.slice(3) + "-" + (i + 1), round: 1 }; c.submissions.push({ step: s.title, authority: Q.ROUTES[c.route].authority, portal: Q.ROUTES[c.route].portal, ref: c.sub[s.key].ref, by: "Omar Siddiqui", date: Q.day(-20 + i * 2), outcome: "Approved" }); }
      if (s.type === "pay") { c.quote.govPaid = true; c.payments.push({ kind: "gov", label: "Government fees, " + Q.ROUTES[c.route].authority, amount: Q.govTotal(c), date: Q.addDays(c.opened, 12), ref: "RCT-" + c.id.slice(3) }); }
      c.log.push({ t: Q.day(-22 + i * 2), who: s.type === "authority" || s.type === "task" ? "Omar Siddiqui" : o.clientName, what: "Completed: " + s.title });
    });
    Object.assign(c, extra || {});
    Q.state.cases.push(c);
    return c;
  };
  const layla = [{ name: "Layla Haddad", kind: "person", pct: 60, nationality: "Jordan" }, { name: "Karim Haddad", kind: "person", pct: 40, nationality: "Jordan" }];
  mk({ clientId: "u-layla", clientName: "Layla Haddad", company: "Haddad Trading LLC", route: "dxb-mainland", activity: "S-4610", owners: layla, visas: 3, opened: Q.day(-23) }, 4, {
    messages: [{ from: "Omar Siddiqui", t: Q.day(-2), text: "Your trade name is reserved. The memorandum is ready for you to sign in the Progress tab." }],
  });
  mk({ clientId: "u-layla", clientName: "Layla Haddad", company: "Cedar Ridge Consulting FZ-LLC", route: "freezone", activity: "S-7020", owners: [{ name: "Layla Haddad", kind: "person", pct: 100, nationality: "Jordan" }], visas: 1, opened: Q.day(-345) }, 8, {
    status: "complete", licence: { no: "FZ-000418", issued: Q.day(-325), expires: Q.day(40) },
  });
  mk({ clientId: "u-daniel", clientName: "Daniel Weber", company: "Weber Digital LLC", route: "dxb-mainland", activity: "S-6201", owners: [{ name: "Daniel Weber", kind: "person", pct: 51, nationality: "Germany" }, { name: "Weber Holding GmbH", kind: "company", pct: 49, nationality: "Germany" }], visas: 2, opened: Q.day(-6) }, 1, {});
  const w = Q.state.cases[2];
  w.docs.forEach((d, i) => (d.status = i < 2 ? "uploaded" : "missing"));
  mk({ clientId: "u-daniel", clientName: "Daniel Weber", company: "Northlight Holdings Ltd", route: "offshore", activity: "S-7020", owners: [{ name: "Daniel Weber", kind: "person", pct: 100, nationality: "Germany" }], visas: 0, opened: Q.day(-9) }, 2, {});
  Q.save();
};

Q.save = () => localStorage.setItem(Q.KEY, JSON.stringify(Q.state));
Q.load = () => {
  const raw = localStorage.getItem(Q.KEY);
  if (!raw) return Q.seed();
  try { Q.state = JSON.parse(raw); } catch (err) { console.warn("Saved mockup data could not be read; restoring the seed.", err); Q.seed(); }
};

Q.user = () => Q.USERS.find((u) => u.id === Q.state.userId) || null;
Q.getCase = (id) => Q.state.cases.find((c) => c.id === id);
Q.steps = (c) => Q.ROUTES[c.route].steps;
Q.cur = (c) => (c.status === "complete" ? null : Q.steps(c)[c.stepIndex]);
Q.activity = (code) => Q.ACTIVITIES.find((a) => a.code === code);
Q.log = (c, what) => c.log.push({ t: Q.day(), who: Q.user().name, what });
Q.govTotal = (c) => c.quote.gov.reduce((n, g) => n + g.amount, 0);
Q.docsOpen = (c) => c.docs.filter((d) => d.status === "missing" || d.status === "rejected");

/* Who holds the case right now: client, qantara or authority. */
Q.holder = (c) => {
  const s = Q.cur(c);
  if (!s) return "done";
  if (c.rebank) return "qantara";
  if (s.type === "partner") { const t = Q.stepTask(c, s); return !t || t.status === "returned" ? "qantara" : t.status === "consent" ? "client" : t.status === "assigned" ? "partner" : "qantara"; }
  if (s.type === "apply" || s.type === "form") return "client";
  if (s.type === "conds") return (c.conds || []).some((x) => x.owner === "client" && !x.done) ? "client" : "qantara";
  if (s.type === "appt") { const a = c.appts[s.key]; return a && !a.attended ? "client" : "qantara"; }
  if (s.type === "quote" || s.type === "sign" || s.type === "pay") return "client";
  if (s.type === "kyc") return Q.docsOpen(c).length ? "client" : "qantara";
  if (s.type === "upload") return c.premises.uploaded ? "qantara" : "client";
  if (s.type === "authority") return (c.sub[s.key] || {}).state === "submitted" ? "authority" : "qantara";
  return "qantara";
};
Q.holderName = { client: "The client", qantara: "Qantara", authority: "The authority", partner: "The partner", done: "Complete" };
Q.pendingConsent = (c) => Q.state.ptasks.find((t) => t.caseId === c.id && t.status === "consent");
Q.stepTask = (c, s) => Q.state.ptasks.find((t) => t.caseId === c.id && t.stepKey === s.key);
Q.byService = (s) => Q.state.cases.filter((c) => c.service === s);

/* What the client is being asked to do, in words. Empty when nothing is needed from them. */
Q.clientAsk = (c) => { const pc = Q.pendingConsent(c); return pc ? "Agree to share documents with " + Q.partner(pc.partnerId).name : Q.stepAsk(c); };
Q.stepAsk = (c) => {
  const s = Q.cur(c);
  if (!s || Q.holder(c) !== "client" || s.type === "partner") return "";
  if (s.type === "quote") return !c.quote.accepted ? "Review and accept the quote" : !c.quote.signed ? "Sign the engagement letter" : "Pay Qantara's fee to start";
  if (s.type === "kyc") return "Upload " + Q.docsOpen(c).length + " document" + (Q.docsOpen(c).length === 1 ? "" : "s");
  if (s.type === "appt") return "Attend: " + s.title + " on " + Q.fmtDate(c.appts[s.key].date);
  if (s.type === "form") return s.ask;
  if (s.type === "conds") return "Meet " + c.conds.filter((x) => x.owner === "client" && !x.done).length + " condition(s) of the approval";
  if (s.type === "apply") return "Apply in the " + Q.ROUTES[c.route].portal;
  if (s.type === "sign") return (s.report ? "Approve " : "Sign: ") + s.doc;
  if (s.type === "upload") return "Upload: " + s.doc;
  if (s.type === "pay") return (s.proof ? "Pay the tax to the authority by " : "Pay the government fees by ") + Q.fmtDate(c.voucherDue);
  return "";
};

/* Move to the next step. Sets the 30-day clock when a payment step opens. */
Q.advance = (c) => {
  const steps = Q.steps(c);
  Q.log(c, "Completed: " + steps[c.stepIndex].title);
  c.stepIndex++;
  if (c.stepIndex >= steps.length) { c.status = "complete"; Q.log(c, "Case complete. Company profile opened."); return; }
  const s = steps[c.stepIndex];
  if (s.type === "pay") c.voucherDue = c.taxDue || Q.addDays(Q.day(), s.deadlineDays);
};
