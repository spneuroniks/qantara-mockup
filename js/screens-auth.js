/* Sign-in: UAE Pass or email, then a one-time code. Any code works in the mockup. */
Q.screens = {};
Q.actions = {};

const loginArt = `<div class="login-art">
  <div class="brand">${Q.logo}<div><b style="font-size:24px">Qantara</b><span>A Neuroniks Limited initiative</span></div></div>
  <div class="stack"><h1>One place for your company in the UAE.</h1>
    <p>Set up the company, see every step, share each document once and know what is due next.</p></div>
  <ul><li><b>1</b>Every step shows who holds it: you, Qantara or the authority</li><li><b>2</b>Qantara's fee and government fees are always shown apart</li><li><b>3</b>One personal login for each person, with a second step</li></ul>
</div>`;

Q.screens.login = () => `<div class="login">${loginArt}
  <div class="login-form"><div class="login-box">
    <div class="stack-s"><h1>Sign in</h1><p class="muted">Use your own login. Accounts are never shared.</p></div>
    <button class="btn wide" data-act="pickUser" data-id="u-layla">Sign in with UAE Pass</button>
    <div class="or">or</div>
    <label>Email<input id="login-email" type="email" placeholder="you@company.example" autocomplete="off"></label>
    <button class="btn ghost wide" data-act="emailLogin">Send me a one-time code</button>
    <div id="login-err"></div>
    <div class="or">demo accounts</div>
    <div class="stack-s">${Q.USERS.filter((u) => u.role !== "partner").map((u) => `<button class="acct" data-act="pickUser" data-id="${u.id}"><span class="avatar">${Q.initials(u.name)}</span><span><b>${Q.esc(u.name)}</b><br><span class="small muted">${Q.esc(u.email)}</span></span>${Q.tag(u.title, u.role === "client" ? "plain" : "dark")}</button>`).join("")}</div>
    <details><summary class="small muted" style="cursor:pointer">Partner firm accounts (${Q.USERS.filter((u) => u.role === "partner").length})</summary><div class="stack-s" style="margin-top:8px">${Q.USERS.filter((u) => u.role === "partner").map((u) => `<button class="acct" data-act="pickUser" data-id="${u.id}"><span class="avatar">${Q.initials(u.name)}</span><span><b>${Q.esc(u.name)}</b><br><span class="small muted">${Q.esc(u.email)}</span></span>${Q.tag(u.title, "plain")}</button>`).join("")}</div></details>
    <p class="small muted">Mockup: pick any account. Nothing is sent anywhere.</p>
  </div></div></div>`;

Q.screens.code = () => {
  const u = Q.USERS.find((x) => x.id === Q.state.pendingUser);
  if (!u) return Q.screens.login();
  return `<div class="login">${loginArt}
  <div class="login-form"><div class="login-box">
    <div class="stack-s"><h1>Enter your code</h1><p class="muted">We sent a six-digit code to ${Q.esc(u.email)}. This second step is required for every account.</p></div>
    <div class="code">${[0, 1, 2, 3, 4, 5].map((i) => `<input inputmode="numeric" maxlength="1" value="${"482915"[i]}" aria-label="Digit ${i + 1}">`).join("")}</div>
    <button class="btn wide" data-act="verify">Verify and continue</button>
    <button class="btn ghost wide" data-act="signOut">Use a different account</button>
    <p class="small muted">Mockup: the code is filled in for you and any code works.</p>
  </div></div></div>`;
};

Q.actions.pickUser = (d) => { Q.state.pendingUser = d.id; Q.save(); Q.go("#/login/code"); };
Q.actions.emailLogin = () => {
  const email = Q.val("login-email").toLowerCase();
  const u = Q.USERS.find((x) => x.email === email);
  if (!u) { document.getElementById("login-err").innerHTML = `<div class="note bad">No account uses that email. Pick one of the demo accounts below.</div>`; return; }
  Q.actions.pickUser({ id: u.id });
};
Q.actions.verify = () => { Q.state.userId = Q.state.pendingUser; Q.state.pendingUser = null; Q.save(); Q.go(Q.homeOf(Q.user())); };
/* Only a partner account has a firm to look up. Clients and staff must never reach that lookup. */
Q.homeOf = (u) => (u.role === "client" ? "#/home" : u.role === "staff" ? "#/staff/queue" : u.role === "partner" ? (Q.onbStatus(Q.partner(u.partnerId)) === "approved" ? "#/partner/tasks" : "#/partner/onboarding") : "#/login");
Q.actions.signOut = () => { Q.state.userId = null; Q.state.pendingUser = null; Q.save(); Q.go("#/login"); };
Q.actions.menu = (d, el) => { const open = el.closest(".rail").classList.toggle("open"); el.setAttribute("aria-expanded", open); el.textContent = open ? "Close" : "Menu"; };
Q.actions.reset = () => { if (confirm("Restore the demo data to its starting point?")) { Q.seed(); Q.go("#/login"); } };
Q.actions.sendMsg = (d) => { const text = Q.val("msg-text"); if (!text) return; Q.getCase(d.id).messages.push({ from: Q.user().name, t: Q.day(), text }); Q.save(); Q.render(); };
