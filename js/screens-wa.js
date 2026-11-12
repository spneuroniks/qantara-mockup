/* WhatsApp stand-in. The client sends a document from their phone; the platform files it against what is
   still needed, or puts it in the staff inbox to sort. No real messages are sent. */
Q.WA_NUMBER = "+971 4 000 0000 (sample)";
const WA_FILES = [
  ["Bank statement.pdf", "Bank statement"], ["Sales invoices.zip", "Sales invoices"], ["Bills and receipts.pdf", "Purchase bills"], ["Payroll summary.xlsx", "Payroll summary"],
  ["Passport photo page.jpg", "Passport copy"], ["Photo of a taxi receipt.jpg", null], ["Supplier contract.pdf", null],
];
const waChat = () => (Q.state.waChat[Q.user().id] = Q.state.waChat[Q.user().id] || [{ text: "Hello. Send a photo or a file of anything your accountant needs: invoices, statements, receipts. We file it for you." }]);
const stillNeeded = (clientId) => Q.state.cases.filter((c) => c.clientId === clientId && c.status === "open").flatMap((c) => c.docs.filter((d) => d.status === "missing" || d.status === "rejected").map((d) => ({ c, d })));

Q.screens.whatsapp = () => {
  const u = Q.user(), wa = Q.state.wa[u.id];
  if (!wa) return Q.shell("wa", `<h1>WhatsApp</h1><div class="card"><h2>Send documents from your phone</h2><p class="muted">Optional. Link your WhatsApp number once; after that, anything you send is filed against what your accountant still needs.</p><div><a class="btn" href="#/integrations">Link my number</a></div></div>`);
  const need = stillNeeded(u.id);
  return Q.shell("wa", `<h1>WhatsApp</h1><p class="muted">A stand-in for the WhatsApp chat on your phone. Send to ${Q.WA_NUMBER} from ${Q.esc(wa.number)}.</p>
    <div class="main-side" style="grid-template-columns:minmax(0,420px) minmax(0,1fr)">
      <div class="phone"><div class="phone-h"><span class="avatar" style="background:var(--rail-accent);color:var(--on-accent)">Q</span><div><b>Qantara</b><div class="small" style="opacity:.75">Business account</div></div></div>
        <div class="phone-b" id="wa-body">${waChat().map((m) => `<div class="bub ${m.me ? "me" : ""}">${m.file ? `<div class="file">📎 ${Q.esc(m.file)}</div>` : ""}${Q.esc(m.text || "")}</div>`).join("")}</div>
        <div class="phone-f"><label>Attach<select id="wa-file">${WA_FILES.map(([f], i) => `<option value="${i}">${Q.esc(f)}</option>`).join("")}</select></label>
          <div class="row"><input id="wa-cap" placeholder="Add a note (optional)" style="flex:1"><button class="btn" data-act="waSend">Send</button></div></div></div>
      <div class="stack"><div class="card"><h3>Still needed from you (${need.length})</h3>${need.map(({ c, d }) => `<div class="small"><b>${Q.esc(d.title)}</b><br><span class="muted">${Q.esc(c.company)} · ${Q.esc(Q.ROUTES[c.route].name)} · ${c.id}</span></div>`).join("") || `<p class="small muted">Nothing is outstanding. Anything you send goes to your adviser to file.</p>`}</div>
        <div class="card"><h3>How it works</h3><div class="stack-s small"><div>1. You send a file or photo.</div><div>2. If it matches something still needed, it is filed there and you get a reply saying where.</div><div>3. If not, your adviser sorts it. Nothing is lost.</div><div class="muted">Never send a password or a one-time code. Only your linked number is accepted.</div></div></div></div></div>`);
};
Q.actions.waOn = () => { const n = Q.val("wa-num"); if (!/^\+?[\d ]{8,}$/.test(n)) { document.getElementById("wa-err").innerHTML = `<div class="note bad">Enter a phone number with its country code.</div>`; return; } Q.state.wa[Q.user().id] = { number: n, since: Q.day() }; Q.save(); Q.render(); };
Q.actions.waOff = () => { if (!confirm("Unlink this number? Documents sent from it will no longer be accepted.")) return; delete Q.state.wa[Q.user().id]; Q.save(); Q.render(); };
Q.actions.waSend = () => {
  const u = Q.user(), wa = Q.state.wa[u.id];
  if (!wa) throw new Error("No linked WhatsApp number for this account."); // fail closed: unlinked senders are refused
  const [file, match] = WA_FILES[Number(Q.val("wa-file"))], cap = Q.val("wa-cap"), chat = waChat();
  chat.push({ me: true, file, text: cap });
  const hit = match ? stillNeeded(u.id).find(({ d }) => d.title.startsWith(match)) : null;
  const item = { id: "IN-" + (500 + Q.state.inbox.length), clientId: u.id, clientName: u.name, from: wa.number, file, caption: cap, date: Q.day(), via: "WhatsApp" };
  if (hit) {
    Object.assign(hit.d, { status: "uploaded", reason: "", file: file + " · by WhatsApp" });
    Q.log(hit.c, "Sent by WhatsApp: " + hit.d.title);
    Object.assign(item, { status: "filed", caseId: hit.c.id, filedAs: hit.d.title });
    const left = hit.c.docs.filter((d) => d.status === "missing" || d.status === "rejected").length;
    chat.push({ text: `Got it. Filed for ${hit.c.company} as "${hit.d.title}" (${hit.c.id}). ${left ? left + " item(s) still needed for this case." : "That was the last item needed for this case."}` });
  } else {
    item.status = "to-sort";
    chat.push({ text: "Got it. This does not match anything we are waiting for, so your adviser will file it. You do not need to do anything." });
  }
  Q.state.inbox.unshift(item); Q.save(); Q.render();
  const body = document.getElementById("wa-body"); body.scrollTop = body.scrollHeight;
};

/* ---- Staff: everything that came in, and what still needs sorting ---- */
Q.screens.inbox = () => {
  const list = Q.state.inbox;
  return Q.shell("inbox", `<h1>Document inbox</h1><p class="muted">Documents clients sent by WhatsApp. Matched ones are already on the case, waiting for the usual check.</p>
    <div class="card flat"><table><tr><th>Received</th><th>Client</th><th>File</th><th>Filed</th><th></th></tr>
    ${list.map((x) => { const opts = stillNeeded(x.clientId); return `<tr><td class="num">${Q.fmtDate(x.date)}<div class="small muted">${Q.esc(x.via)} · ${Q.esc(x.from)}</div></td><td>${Q.esc(x.clientName)}</td><td><b>${Q.esc(x.file)}</b>${x.caption ? `<div class="small muted">"${Q.esc(x.caption)}"</div>` : ""}</td>
      <td>${x.status === "filed" ? `${Q.tag("On the case", "ok")}<div class="small"><a href="#/staff/case/${x.caseId}">${x.caseId}</a> · ${Q.esc(x.filedAs)}</div>` : x.status === "kept" ? Q.tag("Kept on the client's file", "") : Q.tag("To sort", "warn")}</td>
      <td class="right">${x.status === "to-sort" ? `<div class="row" style="justify-content:flex-end;flex-wrap:nowrap"><select id="sort-${x.id}" style="max-width:240px"><option value="">Keep on the client's file</option>${opts.map(({ c, d }) => `<option value="${c.id}|${d.id}">${Q.esc(d.title)} · ${c.id}</option>`).join("")}</select><button class="btn sm" data-act="inboxSort" data-id="${x.id}">File</button></div>` : ""}</td></tr>`; }).join("") || `<tr><td colspan="5" class="muted">Nothing has come in yet.</td></tr>`}</table></div>`);
};
Q.actions.inboxSort = (d) => {
  const x = Q.state.inbox.find((i) => i.id === d.id); if (!x || x.status !== "to-sort") throw new Error("Nothing to sort for " + d.id);
  const pick = Q.val("sort-" + x.id);
  if (!pick) x.status = "kept";
  else { const [caseId, docId] = pick.split("|"), c = Q.getCase(caseId), doc = c && c.clientId === x.clientId && c.docs.find((y) => y.id === docId); if (!doc) throw new Error("That item is not on this client's cases."); Object.assign(doc, { status: "uploaded", reason: "", file: x.file + " · by WhatsApp" }); Q.log(c, "Filed from the inbox: " + x.file + " as " + doc.title); Object.assign(x, { status: "filed", caseId, filedAs: doc.title }); }
  Q.save(); Q.render();
};
