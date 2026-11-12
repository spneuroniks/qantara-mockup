/* Service 2, sector licensing: a regulator's approval on top of the trade licence. The regulators are stand-ins;
   the fees, roles, conditions, lists and durations are all made up. */
const sec = (o) => Object.assign({ service: "02", body: "regulator", by: "Qantara team", days: [60, 120] }, o);
const secStep = {
  quote: { key: "quote", type: "quote", title: "Quote and engagement", est: "1–2 days" },
  roles: { key: "roles", type: "form", ask: "Name the people for the regulated roles", title: "People in the regulated roles", est: "Your choice" },
  docs: { key: "docs", type: "kyc", pack: true, checkLabel: "Readiness checks on the application", title: "Application documents and checks", est: "2–4 weeks" },
  pay: { key: "voucher", type: "pay", title: "Pay the regulator's application fee", deadlineDays: 14, est: "Your choice, within 14 days" },
  conds: { key: "conds", type: "conds", title: "Meet the conditions of the approval", est: "4–10 weeks" },
  handover: { key: "handover", type: "task", title: "Hand-over: licence, roles register and renewal date", est: "1 day" },
};
Object.assign(Q.ROUTES, {
  "sec-health": sec({ name: "Health facility licence", sector: "Healthcare clinic", authority: "Health authority (sample regulator)", portal: "Health licensing portal", qFee: 18000,
    notYet: "may not treat patients or advertise", gov: [["Facility licence application", 5200], ["Final inspection", 3100]],
    roles: ["Medical director"], consultants: ["Atlas Health Design (sample)", "Meridian Medical Architects (sample)"],
    docs: ["Schematic design drawings", "Detailed design drawings, with medical equipment", "Medical-waste and infection-control plan"],
    steps: [secStep.quote, secStep.roles, secStep.docs, secStep.pay,
      { key: "approval", type: "authority", title: "New facility application: approval of the plans", est: "3–6 weeks",
        conds: [["Fit out the premises exactly to the approved plans", "client"], ["Civil defence approval of the premises", "client"], ["Medical-waste contract signed", "client"], ["Connect to the health-records exchange", "qantara"]] },
      secStep.conds,
      { key: "inspect", type: "appt", title: "Final inspection by the regulator", est: "1–2 weeks", bring: "The premises exactly as approved, with the medical director on site. Inspectors cannot accept changes made on site." },
      { key: "licence", type: "authority", licence: true, title: "Facility licence activated", est: "1–2 weeks" }, secStep.handover] }),
  "sec-fin": sec({ name: "Financial services permission", sector: "Financial services firm", authority: "Financial regulator (sample regulator)", portal: "Regulator's portal", qFee: 45000, days: [120, 240],
    notYet: "may not carry on or promote the regulated activity", gov: [["Application fee", 36000]],
    roles: ["Senior executive officer", "Compliance officer", "Money-laundering reporting officer", "Finance officer"],
    docs: ["Regulatory business plan", "Risk, compliance and anti-money-laundering policies", "Financial projections, 3 years"],
    steps: [secStep.quote, secStep.roles, secStep.docs, secStep.pay,
      { key: "interview", type: "appt", title: "Regulator's interviews of the key people", est: "2–4 weeks", bring: "Each person named for a regulated role attends. Bring the business plan as filed." },
      { key: "approval", type: "authority", title: "Application review and in-principle approval", est: "2–4 months",
        conds: [["Pay in the required capital and show the bank's proof", "client"], ["Appoint the auditor", "client"], ["Sign the office lease", "client"], ["Register the approved people with the regulator", "qantara"]] },
      secStep.conds,
      { key: "licence", type: "authority", licence: true, title: "Financial services permission issued", est: "2–4 weeks" }, secStep.handover] }),
});
Q.SECTORS = ["sec-health", "sec-fin"];
