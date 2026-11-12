/* Service 7, cross-border tax coordination. Qantara gathers data and coordinates; a qualified adviser in the
   owner's country answers. Nothing here is tax advice. The fee and the timings are made up. */
const xbSteps = [
  { key: "quote", type: "quote", title: "Quote and Qantara's scope letter", est: "1–2 days" },
  { key: "adviser", type: "form", ask: "Name your adviser and the filing date", title: "Your adviser, the filing date and your consent", est: "Your choice" },
  { key: "room", type: "task", dataRoom: true, title: "Data room built from the company's records", est: "5–10 days" },
  { key: "second", type: "second", title: "Checked by a second person", est: "1 day" },
  { key: "approve", type: "sign", report: true, doc: "what is shared with your adviser", title: "You approve what is shared", est: "1–2 days" },
  { key: "review", type: "authority", title: "Adviser's review, questions and filing", est: "The adviser's time" },
  { key: "close", type: "task", title: "Filing confirmation on record; next year's date set", est: "1 day" },
];
const xb = (o) => Object.assign({ service: "07", body: "adviser", by: "Qantara coordinates; your adviser advises", qFee: 4000, gov: [], days: [10, 20], portal: "the shared data room", steps: xbSteps }, o);
Object.assign(Q.ROUTES, {
  "xb-us": xb({ name: "United States coordination", country: "United States", authority: "The owner's US tax adviser", adviserKind: "A US tax adviser (CPA or enrolled agent)",
    question: (o, co) => `Does ${o.name}'s ${o.pct}% holding in ${co.company} bring US reporting for a foreign company and for foreign accounts?`,
    dataNeeded: "Ownership and dates, the company's financial statements, its bank accounts and who can sign on them",
    driver: "The owner's US filing date, with any extension, as the adviser gives it" }),
  "xb-in": xb({ name: "India coordination", country: "India", authority: "The owner's Indian tax adviser", adviserKind: "An Indian chartered accountant",
    question: (o, co) => `What must ${o.name} report in India about the ${o.pct}% holding in ${co.company} and about money sent abroad?`,
    dataNeeded: "Ownership and dates, money sent out of India by April–March year, dividends received",
    driver: "The owner's Indian return date, as the adviser gives it" }),
  "xb-de": xb({ name: "Germany coordination", country: "Germany", authority: "The owner's German tax adviser", adviserKind: "A German tax adviser (Steuerberater)",
    question: (o, co) => `Do German rules on foreign companies, or on leaving Germany, apply to ${o.name}'s ${o.pct}% holding in ${co.company}?`,
    dataNeeded: "The ownership structure, the company's income and tax paid, and the date German residence ended if it did",
    driver: "The owner's German return date and any yearly confirmation date, as the adviser gives them" }),
});
Q.XB = [["us", "xb-us", "US citizen or green card holder"], ["in", "xb-in", "Tax resident of India"], ["de", "xb-de", "Tax resident of Germany, or left Germany in the last 10 years"]];
Q.XB_PACK = ["Ownership record with dates", "The company's financial statements for the year", "Company bank accounts: highest and year-end balance, and who can sign", "Dividends and other payments to the owner"];
Q.XB_RULES = { roomDaysBeforeFiling: 30 }; // sample
