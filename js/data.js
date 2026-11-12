/* Dummy data for the mockup. Every person, company, reference, fee and duration here is made up.
   Nothing in this file is a real price, a real rule or a real person. */
const Q = (window.Q = {});

Q.USERS = [
  { id: "u-layla", name: "Layla Haddad", role: "client", title: "Client", email: "layla@haddad.example" },
  { id: "u-daniel", name: "Daniel Weber", role: "client", title: "Client", email: "daniel@weber.example" },
  { id: "u-omar", name: "Omar Siddiqui", role: "staff", title: "Setup adviser", email: "omar@qantara.example" },
  { id: "u-priya", name: "Priya Nair", role: "staff", compliance: true, title: "Compliance officer", email: "priya@qantara.example" },
  { id: "u-rashid", name: "Rashid Khan", role: "partner", partnerId: "p-harbor", title: "Harbor Registered Agents", email: "rashid@harbor.example" },
  { id: "u-elena", name: "Elena Petrova", role: "partner", partnerId: "p-audit", title: "Northgate Audit", email: "elena@northgate.example" },
  { id: "u-noura", name: "Noura Al Sayed", role: "partner", partnerId: "p-alreem", title: "Al Reem Legal", email: "noura@alreem.example" },
  { id: "u-zara", name: "Zara Malik", role: "partner", partnerId: "p-pixel", title: "Pixel and Palm Agency", email: "zara@pixelpalm.example" },
  { id: "u-ivan", name: "Ivan Costa", role: "partner", partnerId: "p-crest", title: "Crestline Fiduciary", email: "ivan@crestline.example" },
  { id: "u-mei", name: "Mei Tan", role: "partner", partnerId: "p-meridian", title: "Meridian Citizenship Agents", email: "mei@meridian.example" },
  { id: "u-sana", name: "Sana Iqbal", role: "partner", partnerId: "p-certa", title: "Certa ICV Certifiers", email: "sana@certa.example" },
  { id: "u-luca", name: "Luca Moretti", role: "partner", partnerId: "p-isocert", title: "Summit Certification", email: "luca@summit.example" },
  { id: "u-fatima", name: "Fatima Noor", role: "partner", partnerId: "p-mark", title: "Markwell Trademark Agents", email: "fatima@markwell.example" },
  { id: "u-hana", name: "Hana Al Farsi", role: "staff", taxAgent: true, title: "Registered tax agent", email: "hana@qantara.example" },
];

/* Where a company can be set up. Fees and durations are sample figures. */
Q.ROUTES = {
  "dxb-mainland": {
    name: "Dubai mainland LLC", authority: "Dubai Department of Economy and Tourism", portal: "Invest in Dubai",
    trade: "Anywhere in the UAE", visas: "Yes, tied to office size", office: "Registered tenancy needed",
    days: [10, 20], qFee: 12000, by: "Qantara team",
    gov: [["Initial approval", 200], ["Trade name reservation", 650], ["Memorandum notarisation", 1500], ["Trade licence, first year", 9800], ["Establishment card", 2100]],
    steps: [
      { key: "quote", type: "quote", title: "Quote and engagement", est: "1–2 days" },
      { key: "kyc", type: "kyc", title: "Identity checks", est: "2–5 days" },
      { key: "approval", type: "authority", title: "Initial approval", est: "1–3 working days" },
      { key: "name", type: "authority", title: "Trade name reservation", est: "Same day to 2 days" },
      { key: "moa", type: "sign", title: "Sign the memorandum of association", doc: "Memorandum of association", est: "1–3 days" },
      { key: "premises", type: "upload", title: "Office lease and tenancy registration", doc: "Registered tenancy contract", est: "2–7 days" },
      { key: "voucher", type: "pay", title: "Pay the licence fee voucher", deadlineDays: 30, est: "Your choice, within 30 days" },
      { key: "licence", type: "authority", licence: true, title: "Trade licence issued", est: "1–3 working days" },
      { key: "card", type: "task", title: "Establishment card and labour file", est: "3–5 days" },
      { key: "handover", type: "task", title: "Hand-over: registers, calendar and company profile", est: "1 day" },
    ],
  },
  "auh-mainland": {
    name: "Abu Dhabi mainland LLC", authority: "Abu Dhabi Department of Economic Development", portal: "TAMM",
    trade: "Anywhere in the UAE", visas: "Yes, tied to office size", office: "Registered tenancy needed",
    days: [10, 22], qFee: 12500, by: "Qantara team",
    gov: [["Initial approval", 150], ["Trade name reservation", 500], ["Memorandum notarisation", 1400], ["Trade licence, first year", 8900], ["Establishment card", 2000]],
    steps: null, // same playbook as Dubai mainland in this mockup
  },
  "freezone": {
    name: "Free zone company", authority: "Free zone authority (sample zone)", portal: "Zone client portal",
    trade: "Inside the zone and abroad", visas: "Yes, by package", office: "Flexi-desk included",
    days: [5, 12], qFee: 8500, by: "Qantara team",
    gov: [["Company registration", 3500], ["Licence package, first year", 12900], ["Establishment card", 1800]],
    steps: [
      { key: "quote", type: "quote", title: "Quote and engagement", est: "1–2 days" },
      { key: "kyc", type: "kyc", title: "Identity checks", est: "2–5 days" },
      { key: "approval", type: "authority", title: "Application and name approval", est: "2–4 working days" },
      { key: "moa", type: "sign", title: "Sign the incorporation documents", doc: "Articles of association", est: "1–2 days" },
      { key: "voucher", type: "pay", title: "Pay the zone fees", deadlineDays: 30, est: "Your choice, within 30 days" },
      { key: "licence", type: "authority", licence: true, title: "Licence issued", est: "2–5 working days" },
      { key: "card", type: "task", title: "Establishment card", est: "3–5 days" },
      { key: "handover", type: "task", title: "Hand-over: registers, calendar and company profile", est: "1 day" },
    ],
  },
  "offshore": {
    name: "RAK ICC offshore company", authority: "RAK International Corporate Centre", portal: "Registered agent portal",
    trade: "Outside the UAE only", visas: "No", office: "Registered agent's address",
    days: [5, 10], qFee: 7000, by: "Through a registered agent",
    gov: [["Incorporation fee", 4200], ["Registered agent, first year", 3600]],
    steps: [
      { key: "quote", type: "quote", title: "Quote and engagement", est: "1–2 days" },
      { key: "kyc", type: "kyc", title: "Identity checks", est: "2–5 days" },
      { key: "agent", type: "partner", partnerType: "Registered agent", title: "Registered agent prepares the incorporation", est: "3–5 days" },
      { key: "voucher", type: "pay", title: "Pay the incorporation fees", deadlineDays: 30, est: "Your choice, within 30 days" },
      { key: "licence", type: "authority", licence: true, title: "Certificate of incorporation issued", est: "3–5 working days" },
      { key: "handover", type: "task", title: "Hand-over: registers, calendar and company profile", est: "1 day" },
    ],
  },
};
Q.ROUTES["auh-mainland"].steps = Q.ROUTES["dxb-mainland"].steps;
Object.values(Q.ROUTES).forEach((r) => { r.service = "01"; r.body = "authority"; });
Q.SERVICES = { "01": "Business setup", "02": "Sector licensing", "03": "Bank account opening", "04": "Visas and residency", "05": "PRO and compliance", "06": "Accounting, VAT and corporate tax", "07": "Cross-border tax coordination", "08": "Private-client structuring", "09": "Digital-asset licensing", "10": "Citizenship and residency abroad", "11": "ICV certification", "12": "ISO certification", "13": "Supplier registration", "14": "Trademark registration", "15": "Legal services", "16": "Marketing and content", "18": "Product conformity certificate" };
/* Per-service pieces the shared case screens call: about card, completion note, document-step text. */
Q.about = {}; Q.doneNote = {}; Q.packText = {}; Q.forms = {};

Q.ACTIVITIES = [
  { code: "S-4610", name: "General trading", licence: "Commercial", approvals: [] },
  { code: "S-6201", name: "IT consultancy", licence: "Professional", approvals: [] },
  { code: "S-7020", name: "Management consultancy", licence: "Professional", approvals: [] },
  { code: "S-4791", name: "E-commerce through websites", licence: "Commercial", approvals: [] },
  { code: "S-5610", name: "Restaurant", licence: "Commercial", approvals: ["Municipality food safety approval"] },
  { code: "S-7911", name: "Inbound tour operator", licence: "Commercial", approvals: ["Tourism department approval"] },
  { code: "S-8620", name: "Medical clinic", licence: "Professional", approvals: ["Health authority licence (service 2, sector licensing)"] },
];

Q.NAME_RULES = [
  ["More than three letters", (n) => n.replace(/[^a-z]/gi, "").length > 3],
  ["Ends with the legal form", (n, suffix) => n.trim().toUpperCase().endsWith(suffix)],
  ["No restricted words", (n) => !/\b(bank|royal|emirates|insurance|god)\b/i.test(n)],
];

Q.SERVICES_NEXT = [];
