/* Service 4, visas and residency. Fees, thresholds, validity periods and time limits are all made up. */
const vstep = {
  quote: { key: "quote", type: "quote", title: "Quote and engagement", est: "1–2 days" },
  docs: { key: "docs", type: "kyc", pack: true, checkLabel: "Eligibility checks before filing", title: "Documents and eligibility checks", est: "2–5 days" },
  pay: { key: "voucher", type: "pay", title: "Pay the government fees", deadlineDays: 14, est: "Your choice, within 14 days" },
  work: { key: "work", type: "authority", title: "Work permit", est: "3–5 working days" },
  permit: { key: "permit", type: "authority", permit: 60, title: "Entry permit or change of status", est: "2–5 working days" },
  medical: { key: "medical", type: "appt", title: "Medical fitness test", est: "1–3 days", bring: "Your original passport and the entry permit. Results go to Qantara." },
  bio: { key: "bio", type: "appt", title: "Emirates ID biometrics", est: "1–3 days", bring: "Your original passport. Fingerprints and a photo are taken." },
  insurance: { key: "insurance", type: "task", insurance: true, title: "Health insurance in place", est: "1–2 days" },
  residence: { key: "residence", type: "authority", visa: true, title: "Residence visa and Emirates ID issued", est: "2–5 working days" },
  handover: { key: "handover", type: "task", title: "Hand-over: expiry dates and reminders", est: "1 day" },
};
const visa = (o) => Object.assign({ service: "04", body: "authority", by: "Qantara team", authority: "Immigration authority (ICP or GDRFA)", portal: "Immigration smart services", years: 2 }, o);
const S = vstep;
Object.assign(Q.ROUTES, {
  "visa-investor": visa({ name: "Investor residence visa", who: "For an owner of the company", qFee: 3000, days: [10, 15],
    gov: [["Entry permit or change of status", 1150], ["Medical fitness test", 320], ["Emirates ID, 2 years", 370], ["Residence visa", 500]],
    steps: [S.quote, S.docs, S.pay, S.permit, S.medical, S.bio, S.insurance, S.residence, S.handover] }),
  "visa-employee": visa({ name: "Employment residence visa", who: "For someone the company employs", qFee: 3500, days: [15, 25], authority: "Labour ministry and immigration authority", portal: "Labour and immigration systems",
    gov: [["Work permit and labour contract", 1250], ["Entry permit or change of status", 1150], ["Medical fitness test", 320], ["Emirates ID, 2 years", 370], ["Residence visa", 500]],
    steps: [S.quote, S.docs, S.pay, S.work, S.permit, S.medical, S.bio, S.insurance, S.residence, S.handover] }),
  "visa-family": visa({ name: "Family residence visa", who: "For the husband, wife or child of a visa holder", qFee: 2500, days: [10, 15],
    gov: [["Entry permit or change of status", 950], ["Medical fitness test", 320], ["Emirates ID, 2 years", 370], ["Residence visa", 500]],
    steps: [S.quote, S.docs, S.pay, S.permit, S.medical, S.bio, S.insurance, S.residence, S.handover] }),
});
Q.VISAS = ["visa-investor", "visa-employee", "visa-family"];
Q.VISA_RULES = { passportMonths: 6, familySalary: 4000, adultAge: 18 }; // sample thresholds
