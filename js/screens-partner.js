/* Partner firms: their own login, a workspace limited to the tasks handed to them, and the staff side of a hand-off.
   The firms, licences and people are all made up. */
Q.PARTNERS = [
  { id: "p-harbor", name: "Harbor Registered Agents", type: "Registered agent", licence: "RA-0192", validDays: 300 },
  { id: "p-oldquay", name: "Old Quay Agents", type: "Registered agent", licence: "RA-0077", validDays: -20 },
  { id: "p-audit", name: "Northgate Audit", type: "Licensed auditor", licence: "AUD-3310", validDays: 210 },
  { id: "p-lingua", name: "Lingua Legal Translation", type: "Legal translator", licence: "LT-5521", validDays: 150 },
];
Q.partner = (id) => Q.PARTNERS.find((p) => p.id === id);
const partnerValid = (p) => p.validDays > 0;
const tasksOf = (caseId) => Q.state.ptasks.filter((t) => t.caseId === caseId);
const tStatus = (t) => Q.tag({ consent: "Waiting for the client's consent", assigned: "With the partner", returned: "Returned: to check", accepted: "Accepted" }[t.status], { consent: "warn", assigned: "dark", returned: "warn", accepted: "ok" }[t.status]);
const sharedDocs = (t) => { const c = Q.getCase(t.caseId); return c.docs.filter((d) => t.docIds.includes(d.id)); };
const thread = (t, canAnswer) => t.requests.map((r, i) => `<div class="small"><b>${Q.esc(r.by)}</b> · ${Q.fmtDate(r.date)}<br>${Q.esc(r.q)}${r.a ? `<div class="note" style="margin-top:6px"><b>${Q.esc(r.aBy)}</b> · ${Q.fmtDate(r.aDate)}<br>${Q.esc(r.a)}</div>` : canAnswer ? `<div class="row" style="margin-top:6px"><input id="ans-${t.id}-${i}" placeholder="Answer" style="flex:1"><button class="btn sm" data-act="ptAnswer" data-id="${t.id}" data-i="${i}">Answer</button></div>` : `<div class="muted">Waiting for Qantara's answer</div>`}</div>`).join("");

/* The demo opens with one task already with a partner, so the partner login has something to show. */
const seedBase = Q.seed;
Q.seed = () => {
  seedBase();
  const c = Q.state.cases.find((x) => x.route === "offshore");
  Q.state.ptasks.push({ id: "PT-201", caseId: c.id, partnerId: "p-harbor", stepKey: "agent", title: "Prepare and file the incorporation", brief: "Offshore company for one individual owner. Identity checks are approved. File the incorporation and return the pack with the registry's reference.", due: Q.day(6), docIds: c.docs.slice(0, 2).map((d) => d.id), status: "assigned", created: Q.day(-1), by: "Omar Siddiqui", consent: Q.day(-1), requests: [], ret: null });
  Q.save();
};

/* ---- Staff: the Partners tab on a case ---- */
Q.partnersPane = (c) => {
  const s = Q.cur(c), list = tasksOf(c.id), stepOpen = s && s.type === "partner" && !Q.stepTask(c, s), docs = c.docs.filter((d) => d.status === "accepted");
  return `${list.map((t) => { const p = Q.partner(t.partnerId); return `<div class="card"><div class="card-h"><h3>${Q.esc(t.title)}</h3>${tStatus(t)}</div>
      <p class="small muted">${Q.esc(p.name)} · ${Q.esc(p.type)} · due ${Q.fmtDate(t.due)} · handed over by ${Q.esc(t.by)} on ${Q.fmtDate(t.created)}</p><p>${Q.esc(t.brief)}</p>
      <p class="small"><b>Shared with the partner:</b> ${sharedDocs(t).map((d) => Q.esc(d.title + " (" + d.forWho + ")")).join("; ") || "No documents"}. Nothing else on the case is visible to them.</p>
      ${t.requests.length ? `<h3>Questions from the partner</h3>${thread(t, true)}` : ""}
      ${t.ret ? `<div class="note"><b>Returned ${Q.fmtDate(t.ret.date)} by ${Q.esc(t.ret.by)}</b><br>${Q.esc(t.ret.note)}<br>File: ${Q.esc(t.ret.file)}${t.ret.ref ? " · Authority reference: " + Q.esc(t.ret.ref) : ""}</div>` : ""}
      ${t.status === "returned" ? `<div class="row"><button class="btn sm" data-act="ptAccept" data-id="${t.id}">Accept the work</button><button class="btn sm ghost" data-act="ptSendBack" data-id="${t.id}">Send back</button></div>` : ""}</div>`; }).join("") || `<p class="muted">Nothing on this case has been handed to a partner.</p>`}
    <div class="card"><h2>Hand a task to a partner</h2>
      <div class="field-row"><label>Partner firm<select id="pt-partner"><option value="">Choose</option>${Q.PARTNERS.map((p) => `<option value="${p.id}" ${partnerValid(p) ? "" : "disabled"}>${Q.esc(p.name)} · ${Q.esc(p.type)}${partnerValid(p) ? "" : Q.onbStatus(p) !== "approved" ? " (onboarding not approved)" : " (licence lapsed)"}</option>`).join("")}</select></label><label>Due<input id="pt-due" type="date" value="${Q.day(7)}" min="${Q.day(1)}"></label></div>
      <label>Task<input id="pt-title" value="${stepOpen ? Q.esc(s.title) : ""}" placeholder="e.g. Legal translation of the memorandum"></label>
      <label>Brief: what to do and what to return<textarea id="pt-brief"></textarea></label>
      <div class="stack-s"><b class="small">Documents to share. Only these are visible to the partner.</b>${docs.map((d) => `<label style="display:flex;gap:8px;font-weight:400"><input type="checkbox" data-ptdoc="${d.id}" style="width:auto">${Q.esc(d.title)} · ${Q.esc(d.forWho)}</label>`).join("") || `<span class="small muted">No accepted documents on this case yet.</span>`}</div>
      ${stepOpen ? `<label style="display:flex;gap:8px;font-weight:400"><input id="pt-step" type="checkbox" checked style="width:auto">This is the case's current step (${Q.esc(s.partnerType)} needed)</label>` : ""}
      <div id="act-err"></div><div><button class="btn" data-act="ptCreate" data-id="${c.id}">Ask the client's consent and hand over</button></div>
      <p class="small muted">The partner sees the task, the brief and the ticked documents. They never see fees, risk ratings, other cases or other partners.</p></div>`;
};
Q.partnerStepPanel = (c) => { const s = Q.cur(c), t = Q.stepTask(c, s); return !t ? `<p>This step is done by a partner holding the right status: <b>${Q.esc(s.partnerType.toLowerCase())}</b>. Qantara keeps the rest of the case.</p><div><a class="btn" href="#/staff/case/${c.id}/partners">Hand over to a partner</a></div>`
  : `<p><b>${Q.esc(Q.partner(t.partnerId).name)}</b> · due ${Q.fmtDate(t.due)}</p><div class="row">${tStatus(t)}<a class="btn sm ghost" href="#/staff/case/${c.id}/partners">Open the hand-over</a></div>`; };
Q.actions.ptCreate = sact((c) => {
  const p = Q.partner(Q.val("pt-partner")), title = Q.val("pt-title"), brief = Q.val("pt-brief"), due = Q.val("pt-due"), s = Q.cur(c), stepBox = document.getElementById("pt-step"), forStep = !!(stepBox && stepBox.checked);
  // Fail closed: nothing leaves Qantara without approved identity checks, an open screening alert blocks it, and a lapsed partner cannot be chosen.
  if (!c.kyc.approvedBy) return actErr("Blocked: the identity checks on this client are not approved, so nothing can be shared outside Qantara.");
  if (Q.frozen(c)) return actErr("Blocked: a sanctions screening alert is open on this client.");
  if (!p || !partnerValid(p)) return actErr("Choose a partner whose licence is in date.");
  if (!title || !brief || !due) return actErr("Give the task, the brief and the due date.");
  if (forStep && p.type !== s.partnerType) return actErr("This step needs a " + s.partnerType.toLowerCase() + ". " + p.name + " is a " + p.type.toLowerCase() + ".");
  const docIds = [...document.querySelectorAll("[data-ptdoc]")].filter((el) => el.checked).map((el) => el.dataset.ptdoc);
  Q.state.ptasks.push({ id: "PT-" + (202 + Q.state.ptasks.length), caseId: c.id, partnerId: p.id, stepKey: forStep ? s.key : null, title, brief, due, docIds, status: "consent", created: Q.day(), by: Q.user().name, requests: [], ret: null });
  Q.log(c, "Asked the client's consent to hand \"" + title + "\" to " + p.name + " with " + docIds.length + " document(s)");
});
const pt = (id) => { const t = Q.state.ptasks.find((x) => x.id === id); if (!t) throw new Error("No partner task " + id); return t; };
Q.actions.ptAnswer = (d) => { const t = pt(d.id), a = Q.val("ans-" + t.id + "-" + d.i); if (!a) return; Object.assign(t.requests[Number(d.i)], { a, aBy: Q.user().name, aDate: Q.day() }); Q.log(Q.getCase(t.caseId), "Answered a question from " + Q.partner(t.partnerId).name); Q.save(); Q.render(); };
Q.actions.ptAccept = (d) => { const t = pt(d.id), c = Q.getCase(t.caseId); if (t.status !== "returned") throw new Error("Nothing returned to accept."); t.status = "accepted"; Q.log(c, "Accepted the work returned by " + Q.partner(t.partnerId).name + ": " + t.title); if (t.stepKey && Q.cur(c) && Q.cur(c).key === t.stepKey) Q.advance(c); Q.save(); Q.render(); };
Q.actions.ptSendBack = (d) => { const t = pt(d.id), why = prompt("What needs to change? The partner sees this.", "The registry reference is missing."); if (!why) return; t.requests.push({ q: "Sent back by Qantara: " + why, by: Q.user().name, date: Q.day(), a: "", sentBack: true }); t.status = "assigned"; Q.log(Q.getCase(t.caseId), "Sent the work back to " + Q.partner(t.partnerId).name + ": " + why); Q.save(); Q.render(); };

/* ---- Client: consent before anything is shared, and who is working on the case ---- */
Q.consentCallouts = (c) => Q.state.ptasks.filter((t) => t.caseId === c.id && t.status === "consent").map((t) => { const p = Q.partner(t.partnerId); return `<div class="callout"><div class="card-h"><h2>Agree to share documents with ${Q.esc(p.name)}</h2>${Q.tag("Needs you", "warn")}</div>
  <p>Qantara would like <b>${Q.esc(p.name)}</b> (${Q.esc(p.type.toLowerCase())}, licence ${Q.esc(p.licence)}) to do this part of your case: <b>${Q.esc(t.title)}</b>. They work inside this platform, so you still see everything here.</p>
  <table><tr><th>They would see</th></tr>${sharedDocs(t).map((d) => `<tr><td>${Q.esc(d.title)} · ${Q.esc(d.forWho)}</td></tr>`).join("") || `<tr><td class="muted">No documents, only the task</td></tr>`}</table>
  <p class="small muted">They do not see your fees, your other cases or anything not listed.</p><div><button class="btn" data-act="ptConsent" data-id="${t.id}">I agree</button></div></div>`; }).join("");
Q.actions.ptConsent = (d) => { const t = pt(d.id), c = myCase(t.caseId); if (!c || t.status !== "consent") throw new Error("This consent is not yours to give."); t.status = "assigned"; t.consent = Q.day(); Q.log(c, "Agreed to share " + t.docIds.length + " document(s) with " + Q.partner(t.partnerId).name); Q.save(); Q.render(); };
Q.partnersClientCard = (c) => { const list = tasksOf(c.id).filter((t) => t.status !== "consent"); return list.length ? `<div class="card"><h3>Partners on this case</h3>${list.map((t) => `<div class="small"><b>${Q.esc(Q.partner(t.partnerId).name)}</b> · ${Q.esc(Q.partner(t.partnerId).type)}<br><span class="muted">${Q.esc(t.title)} · ${t.status === "accepted" ? "done" : "in progress, due " + Q.fmtDate(t.due)}</span></div>`).join("")}</div>` : ""; };

/* ---- Partner workspace ---- */
const myTask = (id) => Q.state.ptasks.find((t) => t.id === id && t.partnerId === Q.user().partnerId && t.status !== "consent") || null;
Q.screens.partnerTasks = () => {
  const u = Q.user(), p = Q.partner(u.partnerId), list = Q.state.ptasks.filter((t) => t.partnerId === u.partnerId && t.status !== "consent");
  return Q.shell("ptasks", `<h1>Our tasks</h1><p class="muted">${Q.esc(p.name)} · ${Q.esc(p.type)} · licence ${Q.esc(p.licence)}. You see only the work Qantara has handed to your firm.</p>
    <div class="card flat"><table><tr><th>Task</th><th>For</th><th>What to do</th><th>Due</th><th>Status</th></tr>${list.map((t) => `<tr class="link" data-href="#/partner/task/${t.id}"><td class="num">${t.id}</td><td>${Q.esc(Q.getCase(t.caseId).company)}</td><td><b>${Q.esc(t.title)}</b></td><td class="num">${Q.fmtDate(t.due)}</td><td>${Q.tag({ assigned: "To do", returned: "Returned to Qantara", accepted: "Accepted" }[t.status], { assigned: "warn", returned: "", accepted: "ok" }[t.status])}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Nothing has been handed to your firm.</td></tr>`}</table></div>`);
};
Q.screens.partnerTask = (id) => {
  const t = myTask(id);
  if (!t) return Q.shell("ptasks", `<h1>Not found</h1><p class="muted">This task does not exist or was not handed to your firm.</p><a class="btn ghost" href="#/partner/tasks" style="justify-self:start">Back</a>`);
  const c = Q.getCase(t.caseId);
  return Q.shell("ptasks", `<div class="crumbs"><a href="#/partner/tasks">Our tasks</a> / ${t.id}</div><div class="spread"><div><h1>${Q.esc(t.title)}</h1><p class="muted">For ${Q.esc(c.company)} · handed over by ${Q.esc(t.by)}, Qantara · due ${Q.fmtDate(t.due)}</p></div>${Q.tag({ assigned: "To do", returned: "Returned to Qantara", accepted: "Accepted" }[t.status], { assigned: "warn", returned: "", accepted: "ok" }[t.status])}</div>
    <div class="main-side"><div class="stack"><div class="card"><h2>Brief</h2><p>${Q.esc(t.brief)}</p></div>
      <div class="card flat"><table><tr><th>Documents shared with you (${t.docIds.length})</th><th></th></tr>${sharedDocs(t).map((d) => `<tr><td><b>${Q.esc(d.title)}</b><div class="small muted">${Q.esc(d.forWho)}</div></td><td class="right"><span class="small muted">${Q.esc(d.file || "On file")}</span></td></tr>`).join("") || `<tr><td colspan="2" class="muted">None.</td></tr>`}</table></div>
      <div class="card"><h2>Questions to Qantara</h2>${thread(t, false) || `<p class="small muted">None asked.</p>`}${t.status === "assigned" ? `<div class="row"><input id="pq-text" placeholder="Ask Qantara a question" style="flex:1"><button class="btn ghost" data-act="pqAsk" data-id="${t.id}">Ask</button></div>` : ""}</div>
      ${t.status === "assigned" ? `<div class="callout"><h2>Return your work</h2><label>What was done<textarea id="pr-note"></textarea></label><div class="field-row"><label>File you are returning<input id="pr-file" placeholder="e.g. Incorporation pack.pdf"></label><label>Authority's reference, if you filed<input id="pr-ref" placeholder="e.g. REG-88213"></label></div><div id="act-err"></div><div><button class="btn" data-act="prReturn" data-id="${t.id}">Return to Qantara</button></div></div>`
        : `<div class="note ${t.status === "accepted" ? "ok" : ""}"><b>Returned ${Q.fmtDate(t.ret.date)}</b><br>${Q.esc(t.ret.note)}<br>File: ${Q.esc(t.ret.file)}${t.ret.ref ? " · reference " + Q.esc(t.ret.ref) : ""}${t.status === "accepted" ? "<br>Qantara has accepted this work." : ""}</div>`}</div>
      <div class="card"><h3>What you can see</h3><div class="stack-s small"><div>This task, its brief and the documents listed.</div><div class="muted">Not shown to you: the client's other cases, Qantara's fees, risk ratings, and other partners' work.</div><div class="muted">The client's consent to share was recorded on ${Q.fmtDate(t.consent)}.</div></div></div></div>`);
};
Q.actions.pqAsk = (d) => { const t = myTask(d.id), q = Q.val("pq-text"); if (!t) throw new Error("Not your task."); if (!q) return; t.requests.push({ q, by: Q.user().name + ", " + Q.partner(t.partnerId).name, date: Q.day(), a: "" }); Q.save(); Q.render(); };
Q.actions.prReturn = (d) => {
  const t = myTask(d.id), note = Q.val("pr-note"), file = Q.val("pr-file");
  if (!t || t.status !== "assigned") throw new Error("Not your task to return.");
  if (!note || !file) { document.getElementById("act-err").innerHTML = `<div class="note bad">Say what was done and name the file you are returning.</div>`; return; }
  t.ret = { note, file, ref: Q.val("pr-ref"), date: Q.day(), by: Q.user().name }; t.status = "returned";
  const c = Q.getCase(t.caseId); c.log.push({ t: Q.day(), who: Q.user().name + " (" + Q.partner(t.partnerId).name + ")", what: "Returned: " + t.title });
  if (t.ret.ref) c.submissions.push({ step: t.title, authority: Q.ROUTES[c.route].authority, portal: "Filed by " + Q.partner(t.partnerId).name, ref: t.ret.ref, by: Q.user().name, date: Q.day(), outcome: "Filed by partner" });
  Q.save(); Q.render();
};

/* ---- Staff: the register of partner firms ---- */
Q.screens.partnerFirms = () => Q.shell("partners", `<h1>Partner firms</h1><p class="muted">Every firm works inside the platform. A firm whose licence has lapsed cannot be given work.</p>
  <div class="card flat"><table><tr><th>Firm</th><th>Status held</th><th>Licence</th><th>Valid to</th><th class="right">Open tasks</th><th></th></tr>${Q.PARTNERS.map((p) => `<tr><td><b>${Q.esc(p.name)}</b></td><td>${Q.esc(p.type)}</td><td class="num">${Q.esc(p.licence)}</td><td class="num">${Q.fmtDate(Q.day(p.validDays))}</td><td class="right num">${Q.state.ptasks.filter((t) => t.partnerId === p.id && t.status !== "accepted").length}</td><td>${partnerValid(p) ? Q.tag("Can take work", "ok") : Q.tag("Licence lapsed: blocked", "bad")}</td></tr>`).join("")}</table></div>`);
