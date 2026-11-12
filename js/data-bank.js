/* Service 3, bank account opening. The banks, their rules, fees and timings are all made up. */
Q.BANK_STEPS = [
  { key: "quote", type: "quote", title: "Quote and engagement", est: "1–2 days" },
  { key: "pack", type: "kyc", pack: true, title: "Bank pack: documents and checks", est: "3–7 days" },
  { key: "apply", type: "apply", title: "Apply in the bank's own app", est: "1 day, done by you" },
  { key: "decision", type: "authority", title: "The bank's review and decision", est: "The bank's stated time" },
  { key: "activate", type: "task", account: true, title: "Account opened: record the details", est: "1 day" },
  { key: "handover", type: "task", title: "Hand-over: conditions and dates to watch", est: "1 day" },
];
const bank = (o) => Object.assign({ service: "03", body: "bank", gov: [], qFee: 3500, by: "Qantara prepares; the bank decides", steps: Q.BANK_STEPS, days: [0, 0] }, o);
Object.assign(Q.ROUTES, {
  "bank-a": bank({ name: "Bank A · digital business account", authority: "Bank A (sample bank)", portal: "Bank A app", monthly: 99, minBal: 0, transfer: 20, opening: "1–3 working days",
    rules: [["Owned by individuals only, with no company among the owners", (p) => !p.layered], ["At least one signatory lives in the UAE", (p) => p.resident], ["No trade with sanctioned countries", (p) => !p.sanctioned]] }),
  "bank-b": bank({ name: "Bank B · local business account", authority: "Bank B (sample bank)", portal: "Bank B branch and app", monthly: 250, minBal: 50000, transfer: 45, opening: "4–8 weeks",
    rules: [["At least one signatory lives in the UAE", (p) => p.resident], ["No trade with sanctioned countries", (p) => !p.sanctioned]] }),
  "bank-c": bank({ name: "Bank C · international bank", authority: "Bank C (sample bank)", portal: "Bank C relationship manager", monthly: 500, minBal: 500000, transfer: 0, opening: "6–10 weeks",
    rules: [["Expected money in of AED 1,000,000 a month or more", (p) => p.monthlyIn >= 1000000], ["No trade with sanctioned countries", (p) => !p.sanctioned]] }),
});
Q.BANKS = ["bank-a", "bank-b", "bank-c"];
Q.bankMatch = (p, id) => Q.ROUTES[id].rules.map(([label, test]) => [label, !!test(p)]);
Q.bankPasses = (p, id) => Q.bankMatch(p, id).every(([, ok]) => ok);

/* The pack starts from what the set-up already holds; only the bank-specific items are asked for. */
Q.bankDocs = (co) => {
  const docs = co.docs.map((d, i) => ({ id: "r" + i, title: d.title, forWho: d.forWho, status: "accepted", file: "On file from the set-up", reused: true }));
  docs.push({ id: "r-lic", title: "Trade licence " + co.licence.no, forWho: co.company, status: "accepted", file: "On file from the set-up", reused: true });
  [["Bank statements, latest 3 months", "The owners"], ["CV or profile of the signatory", "The signatory"], ["Proof of business: lease, contracts or invoices", co.company], ["Signed resolution to open the account", co.company]]
    .forEach(([title, forWho], i) => docs.push({ id: "n" + i, title, forWho, status: "missing" }));
  return docs;
};
