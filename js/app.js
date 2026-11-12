/* Router and click handling. Routes are hash-based so the mockup runs from a plain local folder. */
Q.routes = [
  [/^#\/login$/, () => Q.screens.login(), "any"],
  [/^#\/login\/code$/, () => Q.screens.code(), "any"],
  [/^#\/home$/, () => Q.screens.home(), "client"],
  [/^#\/cases$/, () => Q.screens.cases(), "client"],
  [/^#\/services$/, () => Q.screens.services(), "client"],
  [/^#\/services\/(\d\d)$/, (m) => Q.screens.service(m[1]), "client"],
  [/^#\/sent\/([\w-]+)$/, (m) => Q.screens.sent(m[1]), "client"],
  [/^#\/documents$/, () => Q.screens.documents(), "client"],
  [/^#\/payments$/, () => Q.screens.payments(), "client"],
  [/^#\/messages$/, () => Q.screens.messages(), "client"],
  [/^#\/setup\/new$/, () => Q.screens.wizard(), "client"],
  [/^#\/bank\/new$/, () => Q.screens.bankWizard(), "client"],
  [/^#\/sector\/new$/, () => Q.screens.sectorWizard(), "client"],
  [/^#\/visa\/new$/, () => Q.screens.visaWizard(), "client"],
  [/^#\/compliance$/, () => Q.screens.compliance(), "client"],
  [/^#\/accounting$/, () => Q.screens.accounting(), "client"],
  [/^#\/crossborder$/, () => Q.screens.crossborder(), "client"],
  [/^#\/whatsapp$/, () => Q.screens.whatsapp(), "client"],
  [/^#\/start\/(\d\d)$/, (m) => Q.screens.start(m[1]), "client"],
  [/^#\/legal$/, () => Q.screens.legal(), "client"],
  [/^#\/legal\/([\w-]+)$/, (m) => Q.screens.matter(m[1]), "client"],
  [/^#\/marketing(?:\/([\w-]+))?$/, (m) => Q.screens.marketing(m[1]), "client"],
  [/^#\/staff\/legal$/, () => Q.screens.staffLegal(), "staff"],
  [/^#\/staff\/marketing$/, () => Q.screens.staffMarketing(), "staff"],
  [/^#\/partner\/matter\/([\w-]+)$/, (m) => Q.screens.partnerMatter(m[1]), "partner"],
  [/^#\/partner\/marketing$/, () => Q.screens.partnerMarketing(), "partner"],
  [/^#\/staff\/inbox$/, () => Q.screens.inbox(), "staff"],
  [/^#\/staff\/partners$/, () => Q.screens.partnerFirms(), "staff"],
  [/^#\/partner\/tasks$/, () => Q.screens.partnerTasks(), "partner"],
  [/^#\/partner\/onboarding$/, () => Q.screens.onboarding(), "partner"],
  [/^#\/partner\/onboarding\/(\w+)$/, (m) => Q.screens.onbTask(m[1]), "partner"],
  [/^#\/staff\/partner\/([\w-]+)$/, (m) => Q.screens.partnerReview(m[1]), "staff"],
  [/^#\/partner\/task\/([\w-]+)$/, (m) => Q.screens.partnerTask(m[1]), "partner"],
  [/^#\/overview(?:\/([\w-]+))?$/, (m) => Q.screens.overview(m[1]), "client"],
  [/^#\/integrations(?:\/([\w-]+))?$/, (m) => Q.screens.integrations(m[1]), "client"],
  [/^#\/compliance\/change\/([\w-]+)$/, (m) => Q.screens.ownerChange(m[1]), "client"],
  [/^#\/staff\/deadlines$/, () => Q.screens.deadlines(), "staff"],
  [/^#\/staff\/screening$/, () => Q.screens.screening(), "staff"],
  [/^#\/case\/([\w-]+)(?:\/(\w+))?$/, (m) => Q.screens.clientCase(m[1], m[2] || "progress"), "client"],
  [/^#\/company\/([\w-]+)$/, (m) => Q.screens.company(m[1]), "client"],
  [/^#\/staff\/queue$/, () => Q.screens.queue(), "staff"],
  [/^#\/staff\/kyc$/, () => Q.screens.kycQueue(), "staff"],
  [/^#\/staff\/reports$/, () => Q.screens.reports(), "staff"],
  [/^#\/staff\/rules$/, () => Q.screens.rules(), "staff"],
  [/^#\/staff\/case\/([\w-]+)(?:\/(\w+))?$/, (m) => Q.screens.staffCase(m[1], m[2] || "work"), "staff"],
];

Q.render = () => {
  const app = document.getElementById("app");
  const u = Q.user();
  const hash = location.hash || "#/login";
  for (const [re, fn, role] of Q.routes) {
    const m = hash.match(re);
    if (!m) continue;
    // Fail closed: a screen for another role, or any screen without a login, goes back to sign-in.
    if (role !== "any" && (!u || u.role !== role)) { location.hash = "#/login"; return; }
    // Fail closed: a partner firm that is not approved sees its onboarding and nothing else.
    if (role === "partner" && Q.onbStatus(Q.partner(u.partnerId)) !== "approved" && !hash.startsWith("#/partner/onboarding")) { location.hash = "#/partner/onboarding"; return; }
    app.innerHTML = Q.plural(fn(m));
    const chat = document.getElementById("wa-body"); if (chat) chat.scrollTop = chat.scrollHeight;
    window.scrollTo(0, 0);
    return;
  }
  location.hash = u ? Q.homeOf(u) : "#/login";
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (el) {
    const fn = Q.actions[el.dataset.act];
    if (!fn) throw new Error("No action named " + el.dataset.act);
    e.preventDefault();
    fn(el.dataset, el);
    return;
  }
  const row = e.target.closest("[data-href]");
  if (row) location.hash = row.dataset.href;
});
window.addEventListener("hashchange", Q.render);
Q.load();
if (!Q.state.onb) Q.seed();
Q.syncFirms();
Q.render();
