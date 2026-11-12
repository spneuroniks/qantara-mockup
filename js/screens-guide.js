/* What ties the platform together: one service catalogue, a "before you start" page for every service,
   one confirmation page after every request, and a home page that leads with the next thing to do.
   Fees and times are read from the same sample tables the cases use. */
const svcRoutes = (n) => Object.values(Q.ROUTES).filter((r) => r.service === n);
const svcFee = (n) => { const f = svcRoutes(n).map((r) => r.qFee).filter(Boolean); return f.length ? "From " + Q.aed(Math.min(...f)) + " + VAT" : ""; };
const svcDays = (n) => { const d = svcRoutes(n).map((r) => r.days).filter(Boolean); return d.length ? Math.min(...d.map((x) => x[0])) + "–" + Math.max(...d.map((x) => x[1])) + " working days" : ""; };

Q.GROUPS = [
  ["Set up and run a company", ["01", "02", "03", "04", "05"]],
  ["Money and tax", ["06", "07"]],
  ["Owners and wealth", ["08", "09", "10"]],
  ["Certifications and growth", ["11", "12", "13", "18", "14", "15", "16"]],
];
Q.CATALOG = {
  "01": { go: "#/setup/new", get: "A licensed company: mainland, free zone or offshore.", by: "Qantara team", need: ["A passport copy for each owner", "Proof of home address for each owner", "What the business will do", "A name you would like"] },
  "02": { go: "#/sector/new", co: true, get: "The regulator's approval on top of your trade licence, for healthcare or financial services.", by: "Qantara team", need: ["A licensed company", "The names of the key people the regulator asks for", "Details of the premises"] },
  "03": { go: "#/bank/new", co: true, get: "A prepared file and an application to a bank that fits your company.", by: "Qantara prepares; the bank decides", time: "Set by the bank you choose", need: ["A licensed company", "Expected money in and out each month", "Your main customers' and suppliers' countries", "The company's country of tax residence"] },
  "04": { go: "#/visa/new", co: true, get: "A residence visa for an owner, an employee or a family member.", by: "Qantara team", need: ["A licensed company with a free visa place", "The person's passport, valid for 6 more months", "For an employee: job title and salary"] },
  "05": { go: "#/compliance", co: true, get: "Renewals done for you and every deadline in one calendar.", by: "Qantara team", fee: () => "From " + Q.aed(Q.PLANS.essentials.fee) + " a month", time: "Starts the same day", need: ["A licensed company", "Nothing else: the dates are read from your licence"] },
  "06": { go: "#/accounting", co: true, get: "Monthly books, VAT returns and the corporate tax return.", by: "Qantara team; a registered tax agent signs returns", fee: () => Q.aed(Q.ACC_PLAN.fee) + " a month", time: "Starts the same day", need: ["A licensed company", "Bank statements, sales invoices and bills each month"] },
  "07": { go: "#/crossborder", co: true, get: "Tax questions in the US, India or Germany spotted early and handed to an adviser there.", by: "Qantara gathers and coordinates; your adviser in that country advises", time: "Set by your adviser's filing date", need: ["A licensed company", "Each owner's tax ties to those countries", "Your adviser's contact, if you have one"] },
  "08": { go: "#/start/08", get: "A family foundation or a registered will.", by: "A licensed provider or law firm; Qantara coordinates", need: ["Your passport", "Evidence of where your wealth comes from", "A list of the assets involved"] },
  "09": { go: "#/start/09", co: true, get: "A licence to run a virtual-asset business.", by: "A law firm prepares; Qantara coordinates", need: ["A licensed company", "A business plan", "A description of your technology and custody"] },
  "10": { go: "#/start/10", get: "A second passport or residency through a government programme.", by: "A licensed agent files; Qantara pre-screens and refers", fee: () => "Quoted after the pre-screen", need: ["Your passport", "The amount you plan to invest", "The countries you have lived in for 10 years"] },
  "11": { go: "#/start/11", co: true, get: "The yearly In-Country Value certificate for tenders.", by: "Qantara prepares; a certifying body issues", need: ["A licensed company", "Audited statements for the year", "Supplier spend and payroll figures"] },
  "12": { go: "#/start/12", co: true, get: "Your company made ready for an ISO certificate.", by: "Qantara prepares; an unrelated body certifies", need: ["A licensed company", "The standard you want", "Your current policies and records"] },
  "13": { go: "#/start/13", co: true, get: "Registration as a supplier with ADNOC, Abu Dhabi Government, DEWA or TAQA, or a municipality classification.", by: "Qantara team; the buyer or municipality decides", need: ["A licensed company", "The buyer you want to supply", "The supply categories you want", "A bank letter and tax certificate"] },
  "18": { go: "#/start/18", co: true, get: "The conformity certificate a regulated product needs before it is sold in the UAE.", by: "Qantara prepares; a testing body tests; the ministry issues", need: ["A licensed company", "The product and what you do with it", "The product's specification and label", "Any laboratory test reports you have"] },
  "14": { go: "#/start/14", co: true, get: "A registered UAE trademark for ten years.", by: "Qantara, or a registered agent for owners abroad", need: ["A licensed company", "The name or logo to protect", "How many classes of goods or services"] },
  "15": { go: "#/legal", get: "A licensed law firm for a contract, an agreement or a dispute.", by: "The law firm you choose. Qantara is not a law firm", fee: () => "Set by the law firm", time: "Set by the law firm", need: ["The kind of matter", "The names of the other parties, for the conflict check"] },
  "16": { go: "#/marketing", co: true, get: "Brand, website and social media, with every item approved by you.", by: "A partner agency; Qantara bills you", fee: () => "Sample: AED 6,000 a month", time: "First items within 2 weeks", need: ["A licensed company", "What you want marketing to do", "The channels you use"] },
};
const cat = (n) => { const c = Q.CATALOG[n]; return Object.assign({ n, name: Q.SERVICES[n], fee: () => svcFee(n), time: svcDays(n) }, c, { fee: c.fee || (() => svcFee(n)), time: c.time || svcDays(n) }); };
const licensed = () => mine().filter((c) => c.service === "01" && c.status === "complete" && c.route !== "offshore");
const openFor = (n) => mine().filter((c) => c.service === n && c.status === "open");
/* Requests started but not sent. Each wizard keeps its own draft; this lists them in one place. */
Q.drafts = () => { const s = Q.state, out = []; if (s.draft && (s.draft.step || s.draft.activity)) out.push(["01", "#/setup/new"]); if (s.sdraft && s.sdraft.companyId) out.push(["02", "#/sector/new"]); if (s.bdraft && s.bdraft.companyId) out.push(["03", "#/bank/new"]); if (s.vdraft && s.vdraft.companyId) out.push(["04", "#/visa/new"]); if (s.mdraft && (s.mdraft.step || Object.keys(s.mdraft.v).length)) out.push([s.mdraft.svc, "#/start/" + s.mdraft.svc]); return out; };

Q.screens.services = () => Q.shell("services", `<h1>Services</h1><p class="muted">Everything Qantara can do for you, in one list. Each one starts with a short page that says what you will need. Sample fees and times.</p>
  ${Q.GROUPS.map(([g, ns]) => `<div class="stack-s"><h2>${g}</h2><div class="grid3">${ns.map((n) => { const c = cat(n), open = openFor(n), locked = c.co && !licensed().length;
    return `<a class="card svc" href="#/services/${n}"><div class="card-h"><h3>${Q.esc(c.name)}</h3>${open.length ? Q.tag(open.length + " in progress", "") : locked ? Q.tag("Needs a company first", "plain") : ""}</div><p class="small">${Q.esc(c.get)}</p>
      <dl class="mini"><dt>Time</dt><dd>${Q.esc(c.time)}</dd><dt>Fee</dt><dd>${Q.esc(c.fee())}</dd></dl><span class="more">See what you need</span></a>`; }).join("")}</div></div>`).join("")}`);

Q.screens.service = (n) => {
  if (!Q.CATALOG[n]) return notFound("services");
  const c = cat(n), open = openFor(n), locked = c.co && !licensed().length, draft = Q.drafts().find(([s]) => s === n);
  const routes = svcRoutes(n), steps = routes.length ? routes[0].steps : [];
  return Q.shell("services", `<div class="crumbs"><a href="#/services">Services</a> / ${Q.esc(c.name)}</div><h1>${Q.esc(c.name)}</h1><p class="lead">${Q.esc(c.get)}</p>
    <div class="main-side"><div class="stack">
      <div class="card"><h2>Before you start</h2><p class="small muted">Have these ready. Anything already on your file is not asked for again.</p><ul class="ticks">${c.need.map((x) => `<li>${Q.esc(x)}</li>`).join("")}</ul></div>
      ${steps.length ? `<div class="card"><h2>How it goes</h2><p class="small muted">${routes.length > 1 ? "The usual steps. They change a little with the option you pick." : "Each step shows who holds it: you, Qantara, a partner or the authority."}</p>
        <ol class="flow">${steps.map((s) => `<li><b>${Q.esc(s.title)}</b><span class="small muted">${Q.esc(/^Your choice/.test(s.est) ? Q.lc1(s.est) : "about " + s.est)}</span></li>`).join("")}</ol></div>` : ""}
      ${locked ? `<div class="note warn">This service is for a licensed mainland or free zone company, and you do not have one yet. Set up the company first; your details carry over.</div>` : ""}
      ${open.length ? `<div class="note">You already have ${open.length} open request(s) for this service: ${open.map((x) => `<a href="#/case/${x.id}">${x.id}</a>`).join(", ")}.</div>` : ""}
      <div class="row">${locked ? `<a class="btn" href="#/services/01">Set up a company first</a>` : `<a class="btn" href="${c.go}">${draft ? "Continue where you left off" : n === "05" || n === "06" || n === "07" ? "Open " + Q.esc(c.name.toLowerCase()) : "Start now"}</a>`}<a class="btn ghost" href="#/services">Back to all services</a></div>
    </div>
    <div class="stack"><div class="card"><h3>At a glance</h3><dl class="facts"><dt>Time</dt><dd>${Q.esc(c.time)}. An estimate, not a promise.</dd><dt>Fee</dt><dd>${Q.esc(c.fee())}. Sample figure; official fees are passed on at cost.</dd><dt>Who does the work</dt><dd>${Q.esc(c.by)}</dd></dl></div>
      ${Q.helpCard()}</div></div>`);
};
Q.helpCard = () => `<div class="card"><h3>Need help?</h3><p class="small muted">Your adviser answers in Messages, usually the same working day. Nothing is sent until you press the last button.</p><a class="btn ghost sm" href="#/messages" style="justify-self:start">Ask your adviser</a></div>`;

/* One confirmation page after every request: reference, what happens next, how you will be told. */
Q.screens.sent = (id) => {
  const c = myCase(id); if (!c) return notFound("cases");
  const steps = Q.steps(c), who = { client: "You", qantara: "Qantara", authority: "The authority", partner: "A partner firm" };
  const holderOf = (s) => (["quote", "sign", "upload", "pay", "form"].includes(s.type) ? "client" : s.type === "authority" ? "authority" : s.type === "partner" ? "partner" : s.type === "kyc" ? "client" : "qantara");
  return Q.shell("cases", `<div class="panel ok"><div class="small">Request sent</div><h1>${Q.esc(Q.ROUTES[c.route].name)}</h1><p>Your reference is <b class="num">${c.id}</b>. It is saved under My cases.</p></div>
    <div class="main-side"><div class="card"><h2>What happens next</h2><ol class="flow">${steps.slice(0, 4).map((s, i) => `<li class="${i === 0 ? "now" : ""}"><b>${Q.esc(s.title)}</b><span class="small muted">${who[holderOf(s)]} · ${Q.esc(/^Your choice/.test(s.est) ? Q.lc1(s.est) : "about " + s.est)}</span></li>`).join("")}${steps.length > 4 ? `<li><span class="small muted">and ${steps.length - 4} more step(s), listed on the case</span></li>` : ""}</ol>
        <p class="small muted">You get a message each time a step is done or something is needed from you. Durations are estimates; the authority or body named decides.</p>
        <div class="row"><a class="btn" href="#/case/${c.id}">Go to the first step</a><a class="btn ghost" href="#/home">Back to home</a></div></div>
      ${Q.helpCard()}</div>`);
};

/* Home leads with the one next thing to do, then where each company stands. */
const stage = (label, state, href, hint) => `<a class="stage ${state}" ${href ? `href="${href}"` : ""}><span class="st">${{ done: "Done", now: "In progress", todo: "Not started", off: "Cannot start yet" }[state]}</span><b>${label}</b><span class="small">${hint}</span></a>`;
const journey = (co) => {
  const lic = co.status === "complete", id = co.id, of = (n) => Q.byService(n).filter((c) => c.companyCase === id), st = (list) => (list.some((c) => c.status === "open") ? "now" : list.length ? "done" : "todo"), gate = (s) => (lic ? s : "off");
  const bank = of("03"), visa = of("04"), plan = Q.state.plans[id], acc = Q.state.acc[id], off = co.route === "offshore";
  return `<div class="card"><div class="card-h"><h3>${Q.esc(co.company)}</h3>${lic ? `<a class="small" href="#/company/${id}">Company profile</a>` : Q.holderTag(co)}</div><div class="journey">
    ${stage("Company", lic ? "done" : "now", lic ? "#/company/" + id : "#/case/" + id, lic ? "Licence " + Q.esc(co.licence.no) : "Step " + (co.stepIndex + 1) + " of " + Q.steps(co).length)}
    ${off ? "" : stage("Bank account", gate(st(bank)), lic ? (bank[0] ? "#/case/" + bank[0].id : "#/services/03") : "", lic ? (bank.length ? Q.esc(Q.ROUTES[bank[0].route].name) : "Open an account") : "After the licence")}
    ${off ? "" : stage("Visas", gate(st(visa)), lic ? (visa.find((c) => c.status === "open") ? "#/case/" + visa.find((c) => c.status === "open").id : "#/services/04") : "", lic ? (visa.length ? visa.length + " visa request(s)" : "Apply for a visa") : "After the licence")}
    ${stage("Compliance", gate(plan ? "done" : "todo"), lic ? "#/compliance" : "", lic ? (plan ? Q.esc(Q.PLANS[plan.plan] ? Q.PLANS[plan.plan].name : "On a") + " plan" : "Choose a plan") : "After the licence")}
    ${off ? "" : stage("Books and tax", gate(acc ? "done" : "todo"), lic ? "#/accounting" : "", lic ? (acc ? "Plan active" : "Add books and tax") : "After the licence")}</div></div>`;
};
Q.screens.home = () => {
  const cs = mine(), asks = cs.filter((c) => Q.clientAsk(c)), first = asks[0], cos = cs.filter((c) => c.service === "01"), drafts = Q.drafts(), u = Q.user();
  const due = cs.length ? Q.obligations(u.id).filter((o) => !o.done && !(o.days > 30)).slice(0, 4) : [];
  if (!cs.length) return Q.shell("home", `<h1>Welcome, ${Q.esc(u.name.split(" ")[0])}</h1>
    <div class="panel"><div class="small">Start here</div><h2>Set up your company</h2><p>Five short steps. You answer questions; Qantara prepares and files. You see every step and who holds it.</p><div class="row"><a class="btn" href="#/services/01">See what you need</a><a class="btn ghost" href="#/services">Look at all services</a></div></div>
    ${drafts.length ? `<div class="note">You have a request you did not finish: ${drafts.map(([n, h]) => `<a href="${h}">${Q.esc(Q.SERVICES[n])}</a>`).join(", ")}.</div>` : ""}
    <div class="grid3"><div class="card"><h3>1. Answer</h3><p class="small muted">Each service asks a few questions, one topic at a time, and checks them as you go.</p></div><div class="card"><h3>2. Follow</h3><p class="small muted">Your case shows every step, who holds it and an estimate.</p></div><div class="card"><h3>3. Stay on time</h3><p class="small muted">Renewals and filing dates appear in your calendar before they are due.</p></div></div>`);
  return Q.shell("home", `<h1>Welcome back, ${Q.esc(u.name.split(" ")[0])}</h1>
    ${first ? `<div class="panel"><div class="small">Your next step${asks.length > 1 ? " · 1 of " + asks.length : ""}</div><h2>${Q.esc(Q.clientAsk(first))}</h2><p>${Q.esc(first.company)} · ${Q.esc(Q.ROUTES[first.route].name)} · step ${first.stepIndex + 1} of ${Q.steps(first).length}</p><div class="row"><a class="btn" href="#/case/${first.id}">Do this now</a></div></div>`
      : `<div class="panel ok"><div class="small">Your next step</div><h2>Nothing is waiting for you</h2><p>${cs.some((c) => c.status === "open") ? "Your open cases are with Qantara, a partner or the authority. You will get a message when something is needed." : "Everything is complete."}</p><div class="row"><a class="btn ghost" href="#/services">Start another service</a></div></div>`}
    ${asks.length > 1 ? `<div class="stack-s"><h2>Also waiting for you</h2><div class="card flat"><table>${asks.slice(1).map((c) => `<tr class="link" data-href="#/case/${c.id}"><td><b>${Q.esc(Q.clientAsk(c))}</b><div class="small muted">${Q.esc(c.company)} · ${Q.esc(Q.ROUTES[c.route].name)}</div></td><td class="right"><span class="more">Open</span></td></tr>`).join("")}</table></div></div>` : ""}
    ${drafts.length ? `<div class="note">Not finished yet: ${drafts.map(([n, h]) => `<a href="${h}">${Q.esc(Q.SERVICES[n])}</a>`).join(", ")}. Your answers are saved.</div>` : ""}
    ${cos.length ? `<div class="stack-s"><h2>Where each company stands</h2>${cos.map(journey).join("")}</div>` : ""}
    <div class="main-side"><div class="stack-s"><div class="card-h"><h2>Open cases</h2><a class="small" href="#/cases">All cases</a></div>
        ${cs.filter((c) => c.status === "open").map((c) => `<a class="card" href="#/case/${c.id}" style="text-decoration:none;color:inherit"><div class="card-h"><h3>${Q.esc(Q.ROUTES[c.route].name)}</h3>${Q.holderTag(c)}</div><div class="small muted">${Q.esc(c.company)} · ${c.id}</div><div class="progress"><i style="width:${pct(c)}%"></i></div><div class="small muted">Step ${c.stepIndex + 1} of ${Q.steps(c).length}: ${Q.esc(Q.cur(c).title)}</div></a>`).join("") || `<div class="card"><p class="muted">No open cases. <a href="#/services">Start a service</a>.</p></div>`}</div>
      <div class="card"><div class="card-h"><h3>Coming up</h3><a class="small" href="#/compliance">Calendar</a></div>${due.map((o) => `<div><b class="num">${Q.fmtDate(o.due)}</b><div class="small muted">${Q.esc(o.label)} · ${Q.esc(o.co.company)}</div></div>`).join("") || `<p class="muted small">Nothing is due in the next 30 days.</p>`}</div></div>`);
};
