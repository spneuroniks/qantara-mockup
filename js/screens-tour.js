/* Guided tour: a fixed walk through the mockup for a first-time visitor. Each stop signs in as one demo account
   and opens one screen; a bar across the top says what the screen shows. The tour adds no data of its own.
   Every stop's address is worked out from the demo data. A stop with nothing to show stops the tour with an error. */
const tourCase = (userId, open) => { const c = Q.state.cases.find((x) => x.clientId === userId && (!open || x.status === "open")); return c ? "#/case/" + c.id : null; };
const tourTask = (partnerId) => { const t = Q.state.ptasks.find((x) => x.partnerId === partnerId && x.status === "assigned"); return t ? "#/partner/task/" + t.id : null; };

const tourAs = (s) => { const u = Q.USERS.find((x) => x.id === s.user); return "Seen as " + (u.role === "client" ? "a client" : u.role === "partner" ? "a partner firm" : "Qantara staff: " + Q.lc1(u.title)); };

Q.TOUR = [
  { user: "u-layla", name: "The client's home page", to: () => "#/home",
    say: "You are signed in as a client. The page leads with the one thing she has to do next, then shows where each of her companies stands." },
  { user: "u-layla", name: "One case, step by step", to: () => tourCase("u-layla", true),
    say: "One company being set up. Each step shows who holds it now: the client, Qantara or the authority. The tabs hold her documents, fees and messages." },
  { user: "u-layla", name: "Every service in one list", to: () => "#/services",
    say: "The services Qantara plans to offer, in four groups. Each opens a page that says what the client needs, who does the work and how it goes." },
  { user: "u-layla", name: "The compliance calendar", to: () => "#/compliance",
    say: "Renewals and filing dates for her companies. The dates are worked out from what is on record, such as the licence expiry, and each one shows who acts." },
  { user: "u-omar", name: "The staff work queue", to: () => "#/staff/queue",
    say: "Now signed in as a Qantara adviser. The same cases, seen from the inside: who holds each one and what staff do next." },
  { user: "u-priya", name: "Deadlines across all clients", to: () => "#/staff/deadlines",
    say: "Now the compliance officer. Every client's dates in one list, so a renewal or filing is seen before it is due." },
  { user: "u-rashid", name: "What a partner firm sees", to: () => tourTask("p-harbor"),
    say: "Now a partner firm, a registered agent. It sees the one task Qantara gave it and the documents the client agreed to share, and no other part of the client's file." },
];

const tourArt = `<div class="login-art">
  <div class="brand">${Q.logo}<div><b style="font-size:24px">Qantara</b><span>A Neuroniks Limited initiative</span></div></div>
  <div class="stack"><h1>A guided look at the platform.</h1>
    <p>The same cases, seen by a client, by Qantara staff and by a partner firm.</p></div>
  <ul><li><b>1</b>This is a clickable mockup. The platform itself is not built yet</li><li><b>2</b>Every person, company, fee and date in it is made up</li><li><b>3</b>Nothing you click or type is sent anywhere</li></ul>
</div>`;

Q.screens.tour = () => `<div class="login">${tourArt}
  <div class="login-form"><div class="login-box">
    <div class="stack-s"><h1>Take the tour</h1><p class="muted">${Q.TOUR.length} screens, about five minutes. You can click around at any stop; "Next" carries on from where the tour was.</p></div>
    <ol class="flow">${Q.TOUR.map((s) => `<li><b>${Q.esc(s.name)}</b><span class="small muted">${Q.esc(tourAs(s))}</span></li>`).join("")}</ol>
    <button class="btn wide" data-act="tourStart">Start the tour</button>
    <a class="btn ghost wide" href="#/login">Skip the tour and sign in</a>
    <p class="small muted">Starting the tour puts the demo data back to its starting point and signs you in as each demo account in turn.</p>
  </div></div></div>`;

Q.screens.tourEnd = () => `<div class="login">${tourArt}
  <div class="login-form"><div class="login-box">
    <div class="stack-s"><h1>That is the tour</h1><p class="muted">You saw ${Q.TOUR.length} screens as a client, as Qantara staff and as a partner firm.</p></div>
    <div class="note warn">What you saw is a mockup. It shows how the platform is meant to work. It is not the working platform, and no fee, time or rule in it is a real one.</div>
    <a class="btn wide" href="#/login">Explore on your own</a>
    <button class="btn ghost wide" data-act="tourStart">Take the tour again</button>
    <p class="small muted">To explore, pick any demo account on the sign-in page. "Reset demo data" in the left menu restores the starting point.</p>
  </div></div></div>`;

/* The bar shown above every screen while the tour is running. */
Q.tourBar = () => {
  const t = Q.state.tour; if (!t) return "";
  const s = Q.TOUR[t.i], last = t.i === Q.TOUR.length - 1;
  if (!s) throw new Error("Tour is at stop " + t.i + ", which does not exist");
  return `<div class="tour" role="region" aria-label="Guided tour"><div class="tour-say"><b>Tour · ${t.i + 1} of ${Q.TOUR.length} · ${Q.esc(s.name)}</b><span>${Q.esc(s.say)}</span></div>
    <div class="tour-nav">${t.i > 0 ? `<button data-act="tourBack">Back</button>` : ""}<button class="go" data-act="tourNext">${last ? "Finish the tour" : "Next: " + Q.esc(Q.lc1(Q.TOUR[t.i + 1].name))}</button><button data-act="tourLeave">Leave the tour</button></div></div>`;
};

Q.tourGo = (i) => {
  const s = Q.TOUR[i];
  if (!s) throw new Error("No tour stop " + i);
  const hash = s.to();
  if (!hash) throw new Error('The tour stop "' + s.name + '" has nothing to show in the demo data');
  Q.state.userId = s.user; Q.state.pendingUser = null; Q.state.tour = { i }; Q.save(); Q.go(hash);
};
const tourStop = () => { Q.state.tour = null; Q.state.userId = null; Q.state.pendingUser = null; Q.save(); };
Q.actions.tourStart = () => { Q.seed(); Q.tourGo(0); };
Q.actions.tourBack = () => Q.tourGo(Math.max(0, Q.state.tour.i - 1));
Q.actions.tourNext = () => { const i = Q.state.tour.i + 1; if (i < Q.TOUR.length) return Q.tourGo(i); tourStop(); Q.go("#/tour/end"); };
Q.actions.tourLeave = () => { tourStop(); Q.go("#/login"); };
