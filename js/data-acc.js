/* Service 6, accounting, VAT and corporate tax. The ledger figures, plan price, tax periods and due dates are all made up. */
const acc = (o) => Object.assign({ service: "06", body: "authority", by: "Qantara team", qFee: 0, gov: [], days: [3, 7], authority: "Federal Tax Authority", portal: "EmaraTax" }, o);
Object.assign(Q.ROUTES, {
  "acc-books": acc({ name: "Monthly books", authority: "No authority involved", portal: "The ledger",
    steps: [
      { key: "request", type: "kyc", plain: true, title: "Send us the month's papers", est: "By the 5th of the next month" },
      { key: "books", type: "task", ledger: true, title: "Books reconciled in the ledger", est: "3–5 days" },
      { key: "approve", type: "sign", report: true, doc: "the month's report", title: "Approve the month's report", est: "1–2 days" },
    ] }),
  "acc-vat": acc({ name: "VAT return", govLabel: "Tax payable to the authority. You pay it to the authority yourself", payLabel: "VAT paid", days: [5, 10],
    steps: [
      { key: "working", type: "task", vatFile: true, title: "VAT working file prepared from the ledger", est: "2–3 days" },
      { key: "approve", type: "sign", report: true, doc: "the VAT return", title: "Approve the VAT return", est: "1–2 days" },
      { key: "agent", type: "agent", title: "Approved by the registered tax agent", est: "1 day" },
      { key: "file", type: "authority", title: "Return filed with the tax authority", est: "Same day" },
      { key: "voucher", type: "pay", proof: true, title: "Pay the tax and record the proof", est: "By the due date" },
    ] }),
});
Q.ACC_PLAN = { name: "Books and tax", fee: 1800, covers: "Monthly books, VAT returns, the corporate tax return and the audit file" };
Q.ACC_RULES = { vatDueDays: 28, corpTaxMonths: 9, vatRate: 5 }; // sample values

/* Tax period in the demo: the three full months before this one. */
const monthStart = (back) => { const d = new Date(Q.day() + "T00:00:00Z"); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - back); return d; };
Q.ym = (back) => monthStart(back).toISOString().slice(0, 7);
Q.ymLabel = (ym) => new Date(ym + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
Q.periodMonths = () => [Q.ym(3), Q.ym(2), Q.ym(1)];
Q.periodLabel = () => Q.ymLabel(Q.ym(3)).split(" ")[0] + "–" + Q.ymLabel(Q.ym(1));
Q.periodEnd = () => Q.addDays(monthStart(0).toISOString().slice(0, 10), -1);
Q.vatDue = () => Q.addDays(Q.periodEnd(), Q.ACC_RULES.vatDueDays);

/* Stand-in for a read-only connection to the client's accounting software. Whole dirhams only. */
Q.ledger = (coId, ym) => {
  const seed = (coId + ym).split("").reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const sales = 60000 + (seed % 40) * 1000, purchases = Math.round(sales * 0.55 / 100) * 100;
  return { sales, purchases, vatOut: Math.round((sales * Q.ACC_RULES.vatRate) / 100), vatIn: Math.round((purchases * Q.ACC_RULES.vatRate) / 100) };
};
Q.vatFigures = (coId) => { const t = { sales: 0, purchases: 0, vatOut: 0, vatIn: 0 }; Q.periodMonths().forEach((ym) => { const l = Q.ledger(coId, ym); Object.keys(t).forEach((k) => (t[k] += l[k])); }); t.net = t.vatOut - t.vatIn; return t; };
