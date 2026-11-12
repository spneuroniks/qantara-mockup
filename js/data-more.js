/* Services 8 to 14. Programmes, thresholds, formulas, fees, validity periods and firms are all made up for the mockup. */
const st = {
  quote: { key: "quote", type: "quote", title: "Quote and engagement", est: "1–2 days" },
  pay: { key: "voucher", type: "pay", title: "Pay the official fees", deadlineDays: 14, est: "Your choice, within 14 days" },
  conds: { key: "conds", type: "conds", title: "Close the points raised", est: "2–6 weeks" },
  kyc: (title, checkLabel, est) => ({ key: "docs", type: "kyc", pack: !!checkLabel, checkLabel, title, est: est || "1–2 weeks" }),
  partner: (title, partnerType, extra) => Object.assign({ key: "partner", type: "partner", partnerType, title, est: "2–4 weeks" }, extra || {}),
  auth: (key, title, extra) => Object.assign({ key, type: "authority", title, est: "2–6 weeks" }, extra || {}),
  task: (key, title) => ({ key, type: "task", title, est: "1–3 days" }),
  cert: (title, label, days) => ({ key: "cert", type: "task", cert: { label, days }, title, est: "1 day" }),
  form: (title, ask) => ({ key: "form", type: "form", title, ask, est: "Your choice" }),
};
const more = (service, o) => Object.assign({ service, body: "authority", by: "Qantara team", gov: [], days: [20, 40], authority: "The authority", portal: "The authority's portal" }, o);
const yes = (v) => v === "yes";
Object.assign(Q.ROUTES, {
  "pc-foundation": more("08", { name: "Family foundation", pick: "Hold shares, property or savings in a foundation with your own rules", qFee: 22000, by: "A licensed provider registers it; Qantara advises", authority: "The foundations registry", gov: [["Registration fee", 3700]],
    fields: [["assets", "What goes into the foundation?", ["Shares in my company", "Property", "Cash and investments"]], ["council", "How many council members will it have?", "number"], ["guardian", "Will a guardian be named?", "yesno"]],
    checks: (v) => [["At least two council members (sample rule)", Number(v.council) >= 2]],
    disclose: ["A licensed corporate service provider is the provider of record and registers the foundation. Qantara advises and coordinates.", "The charter is prepared by the licensed provider, not by Qantara."],
    docs: (v, co, u) => [["Passport copy", u.name], ["Source-of-wealth statement with evidence", u.name], ["List of assets going in", u.name]],
    steps: [st.quote, st.kyc("Identity, source of wealth and role checks", "Role and eligibility checks"), st.partner("Licensed provider prepares the charter and files it", "Licensed corporate service provider"), { key: "sign", type: "sign", doc: "Foundation charter", signText: "prepared by the licensed provider", title: "Sign the foundation charter", est: "1–3 days" }, st.pay, st.cert("Registration recorded", "Foundation", 365)] }),
  "pc-will": more("08", { name: "Registered will", pick: "A will for your UAE assets, registered so it can be relied on", qFee: 6000, by: "A law firm drafts it; Qantara coordinates", authority: "The wills registry", gov: [["Will registration fee", 5000]],
    fields: [["adult", "Are you 21 or older?", "yesno"], ["witnesses", "Can two adult witnesses attend the signing?", "yesno"], ["assets", "What should the will cover?", ["Everything I own in the UAE", "My company shares only", "Property only"]]],
    checks: (v) => [["Old enough to make this will (sample rule)", yes(v.adult)], ["Two adult witnesses can attend", yes(v.witnesses)]],
    disclose: ["The will is drafted by a law firm you engage through the platform. Qantara does not draft it and is not paid by the law firm."],
    docs: (v, co, u) => [["Passport copy", u.name], ["List of UAE assets", u.name], ["ID of the first witness", "Witness 1"], ["ID of the second witness", "Witness 2"]],
    steps: [st.quote, st.kyc("Identity and witness documents", "Eligibility and witness checks"), st.partner("Law firm drafts the will", "Law firm"), st.pay, { key: "signing", type: "appt", title: "Signing before the registry officer", est: "1–2 weeks", bring: "Your original passport. Both witnesses attend with their IDs." }, st.cert("Will registration recorded", "Will", null)] }),
  "va-licence": more("09", { name: "Virtual-asset licence", pick: "A licence to run a virtual-asset business", needsCompany: true, qFee: 60000, days: [120, 240], body: "regulator", by: "A law firm prepares the application; Qantara coordinates", authority: "Virtual-asset regulator (sample)", portal: "Regulator's portal", gov: [["Application fee", 40000]],
    warn: "may not carry on or market the virtual-asset activity",
    fields: [["activity", "Which activity?", ["Exchange", "Broker-dealer", "Custody", "Advisory"]], ["custody", "Will the business hold clients' assets?", "yesno"]],
    checks: () => [["Classified as a regulated activity: a licence is needed (sample classification)", true]],
    disclose: ["Until the licence is issued the company may not carry on or market the activity. This warning stays on the case.", "The application is prepared by a law firm. Qantara coordinates and tracks it."],
    docs: (v, co) => co.owners.map((o) => ["Source-of-funds evidence", o.name]).concat([["Business plan", co.company], ["Technology and custody description", co.company]]),
    steps: [st.quote, st.kyc("Screening of owners and funding", "Screening before release to the law firm"), st.partner("Law firm prepares the licence application", "Law firm"), st.pay,
      st.auth("approval", "Initial approval from the regulator", { conds: [["Pay in the required capital", "client"], ["Appoint the compliance officer", "client"], ["Technology audit report filed", "qantara"]] }), st.conds, st.auth("licence", "Licence issued", { licence: true }), st.task("handover", "Hand-over: licence and reporting dates")] }),
  "cz-a": more("10", { name: "Citizenship programme A (sample)", pick: "A second passport through a government donation or investment", qFee: 15000, minInvest: 850000, by: "A licensed agent files; Qantara refers and coordinates", authority: "The programme's government unit", days: [90, 180] }),
  "cz-b": more("10", { name: "Residency programme B (sample)", pick: "Residency in another country through investment", qFee: 12000, minInvest: 1100000, by: "A licensed agent files; Qantara refers and coordinates", authority: "The programme's government unit", days: [120, 240] }),
  "icv": more("11", { name: "ICV certificate", pick: "A yearly In-Country Value certificate for tenders", needsCompany: true, qFee: 9000, by: "Qantara prepares; an approved certifying body issues", authority: "The certifying body", days: [15, 30],
    fields: [["year", "Financial year", "text"], ["audited", "Are the audited statements for that year ready?", "yesno"], ["sameAuditor", "Is the certifying body also your auditor?", "yesno"]],
    checks: (v) => [["Audited statements for the year are ready", yes(v.audited)], ["Financial year given", !!v.year]],
    disclose: ["The certificate is issued by an approved certifying body, which is independent of Qantara and bills you directly.", "The score shown in the mockup uses a made-up formula, not the official one."],
    docs: (v, co) => [["Audited financial statements, " + v.year, co.company], ["Supplier spend list for the year", co.company], ["Payroll evidence", co.company]],
    form: { intro: "Fill in the workbook. The figures must agree with your audited statements.", fields: [["goods", "Share of purchases from certified UAE suppliers, %", "number"], ["emirati", "Emirati payroll for the year, AED", "number"], ["payroll", "Total payroll for the year, AED", "number"], ["assets", "Net fixed assets inside the UAE, AED", "number"], ["revenue", "Revenue for the year, AED", "number"]],
      check: (f) => (f.goods > 100 ? "The share of purchases cannot be more than 100%." : f.emirati > f.payroll ? "Emirati payroll cannot be more than total payroll." : !f.revenue || !f.payroll ? "Revenue and total payroll are needed." : ""),
      summary: (f) => { const a = Math.round(f.goods * 0.5), b = Math.round(Math.min(100, (300 * f.emirati) / f.payroll) * 0.3), c = Math.round(Math.min(100, (100 * f.assets) / f.revenue) * 0.2); return [["Goods and services", a + " points"], ["Emirati payroll", b + " points"], ["Investment in the UAE", c + " points"], ["Estimated score (sample formula)", a + b + c + " of 100"]]; } },
    steps: [st.quote, st.form("Fill in the ICV workbook", "Fill in the ICV workbook"), st.kyc("Supporting documents and reconciliation", "Reconciliation to the audited statements"), { key: "approve", type: "sign", report: true, doc: "the ICV figures", title: "Authorised signatory approves the figures", est: "1–2 days" }, st.partner("Certifying body verifies and issues the certificate", "ICV certifying body"), st.cert("Certificate recorded", "ICV certificate", 420)] }),
  "iso": more("12", { name: "ISO certification, preparation", pick: "Get ready for an ISO certificate from an independent body", needsCompany: true, qFee: 7000, by: "Qantara prepares; an unrelated certification body audits", authority: "The certification body", days: [45, 90],
    fields: [["standard", "Which standard?", ["ISO 9001, quality", "ISO 27001, information security", "ISO 14001, environment"]], ["related", "Has any certification body related to Qantara certified this company, or agreed to?", "yesno"]],
    checks: (v) => [["Impartiality: no certification body related to Qantara is involved", v.related === "no"]],
    disclose: ["Qantara helps you prepare. It does not certify, and the certification body must be unrelated to Qantara.", "For two years after this work Qantara will not refer you to a related certification body (sample period).", "The certification body bills you directly."],
    docs: (v, co) => [["Policies and procedures for the standard", co.company], ["Internal audit report", co.company], ["Management review minutes", co.company]],
    form: { intro: "Mark where the company stands today on each requirement. Anything not fully met becomes a task.", fields: ["Context and scope", "Leadership and policy", "Risks and objectives", "Training and records", "Day-to-day controls", "Internal audit and review"].map((l, i) => ["g" + i, l, ["Met", "Partly met", "Not met"]]),
      check: () => "", summary: (f) => { const vals = Object.values(f); return [["Met", vals.filter((x) => x === "Met").length + " of " + vals.length], ["Partly met", String(vals.filter((x) => x === "Partly met").length)], ["Not met", String(vals.filter((x) => x === "Not met").length)]]; } },
    steps: [st.quote, st.form("Gap assessment against the standard", "Complete the gap assessment"), st.kyc("System documents and audit readiness", "Readiness for the certification audit"), st.partner("Independent certification audit", "Certification body (unrelated)", { conds: [["Close the finding on document control, with evidence", "client"], ["Close the finding on supplier records, with evidence", "qantara"]] }), st.conds, st.cert("Certificate recorded", "ISO certificate", 1095)] }),
  "adnoc": more("13", { name: "ADNOC supplier registration", pick: "Register as a supplier and get ready to prequalify", needsCompany: true, qFee: 5000, authority: "The buyer's supplier team", portal: "The buyer's supplier portal", days: [10, 25],
    fields: [["categories", "Which supply categories will you apply for?", "text"], ["match", "Does your trade licence cover those categories?", "yesno"]],
    checks: (v, co) => [["Trade licence is valid", co.licence.expires > Q.day()], ["Licence activity covers the categories", yes(v.match)]],
    disclose: ["Registration with the buyer is free. Qantara's fee is for preparing and tracking it.", "Registration does not guarantee prequalification or any order."],
    docs: (v, co) => [["Company profile", co.company], ["Bank letter", co.company], ["Tax registration certificate", co.company]],
    steps: [st.quote, st.kyc("Eligibility and documents", "Eligibility and document checks"), st.auth("register", "Supplier registration submitted and reviewed"), st.cert("Supplier number recorded", "Supplier number", null)] }),
  "tm-direct": more("14", { name: "Trademark registration, filed by Qantara", needsCompany: true, qFee: 4500, authority: "The trademark office", portal: "The trademark office's portal", days: [90, 150] }),
  "tm-agent": more("14", { name: "Trademark registration, filed by a registered agent", needsCompany: true, qFee: 4500, by: "A registered trademark agent files; Qantara coordinates", authority: "The trademark office", days: [90, 150] }),
});
const czFields = [["invest", "How much do you plan to invest, in AED?", "number"], ["countries", "Countries you have lived in for the last 10 years, separated by commas", "text"], ["refused", "Have you ever been refused a visa, residency or citizenship anywhere?", "yesno"]];
["cz-a", "cz-b"].forEach((id) => Object.assign(Q.ROUTES[id], { fields: czFields,
  checks: (v) => [["Investment is at least the programme minimum of AED " + Q.ROUTES[id].minInvest.toLocaleString("en-US") + " (sample)", Number(v.invest) >= Q.ROUTES[id].minInvest], ["Residence history given", !!v.countries]],
  disclose: ["No fee is quoted until Qantara's own pre-screen is done. A pre-screen can end in a decision not to proceed.", "A licensed agent prepares and files the application. Qantara refers you and coordinates.", "The agent pays Qantara a referral fee: sample, 10% of the agent's own fee. It does not change what you pay."],
  docs: (v, co, u) => [["Passport copy", u.name], ["Source-of-funds evidence for the investment", u.name]].concat(v.countries.split(",").map((x) => x.trim()).filter(Boolean).map((x) => ["Police certificate, " + x, u.name])).concat(yes(v.refused) ? [["Signed declaration of every earlier refusal", u.name]] : []),
  steps: [{ key: "docs", type: "kyc", title: "Pre-screen before any fee is quoted", est: "1–2 weeks" }, st.quote, st.partner("Licensed agent prepares and files the application", "Licensed citizenship agent"), st.auth("decision", "Government due diligence and decision"), st.cert("Approval recorded", "Approval", null)] }));
const tmFields = [["mark", "The name or logo to protect", "text"], ["classes", "How many classes of goods or services?", "number"], ["base", "Where is the owner of the mark based?", ["In the UAE", "Outside the UAE"]]];
const tmCommon = { fields: tmFields, checks: (v) => [["A mark is given", !!v.mark], ["Between 1 and 45 classes", Number(v.classes) >= 1 && Number(v.classes) <= 45]],
  disclose: ["A search lowers the risk of a refusal but cannot remove it. The trademark office decides.", "Official fees are charged per class, at cost."],
  docs: () => [], govFor: (v) => [{ label: "Official fees, " + v.classes + " class(es)", amount: 6500 * Number(v.classes) }] };
Object.assign(Q.ROUTES["tm-direct"], tmCommon, { steps: [st.quote, st.task("search", "Similarity search recorded"), st.pay, st.auth("file", "Application filed and examined"), st.task("publish", "Publication period passed with no opposition"), st.cert("Registration recorded", "Trademark", 3650)] });
Object.assign(Q.ROUTES["tm-agent"], tmCommon, { steps: [st.quote, st.task("search", "Similarity search recorded"), st.pay, st.partner("Registered agent files the application", "Registered trademark agent"), st.task("publish", "Publication period passed with no opposition"), st.cert("Registration recorded", "Trademark", 3650)] });

/* How each service starts. routeOf picks the route from the answers where the client does not choose it. */
Q.SVC = {
  "08": { title: "Private-client structuring", intro: "Foundations and wills for owners and families.", routes: ["pc-foundation", "pc-will"] },
  "09": { title: "Digital-asset licensing", intro: "A licence for a virtual-asset business, prepared with a law firm.", routes: ["va-licence"] },
  "10": { title: "Citizenship and residency abroad", intro: "Government programmes, filed by a licensed agent after our own pre-screen.", routes: ["cz-a", "cz-b"] },
  "11": { title: "ICV certification", intro: "The yearly In-Country Value certificate.", routes: ["icv"] },
  "12": { title: "ISO certification", intro: "Preparation for certification by an independent body.", routes: ["iso"] },
  "13": { title: "ADNOC supplier registration", intro: "Supplier registration and readiness to prequalify.", routes: ["adnoc"] },
  "14": { title: "Trademark registration", intro: "Register a mark in the UAE for ten years.", routes: ["tm-direct"], routeOf: (v) => (v.base === "Outside the UAE" ? "tm-agent" : "tm-direct") },
};
Q.MORE_NAV = [["#/start/08", "Private clients", "s08"], ["#/start/09", "Digital-asset licence", "s09"], ["#/start/10", "Citizenship abroad", "s10"], ["#/start/11", "ICV certificate", "s11"], ["#/start/12", "ISO certification", "s12"], ["#/start/13", "ADNOC registration", "s13"], ["#/start/14", "Trademarks", "s14"], ["#/legal", "Legal services", "legal"], ["#/marketing", "Marketing", "mkt"]];
