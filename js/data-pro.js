/* Service 5, PRO and compliance. Plans, fees, time limits and penalties are all made up. */
const pro = (o) => Object.assign({ service: "05", body: "authority", by: "Qantara team", qFee: 0, days: [5, 10] }, o);
Object.assign(Q.ROUTES, {
  "pro-renewal": pro({ name: "Trade licence renewal", authority: "The licensing authority", portal: "Licensing portal",
    gov: [["Licence renewal, one year", 9200], ["Establishment card renewal", 1900]],
    steps: [
      { key: "premises", type: "upload", title: "Renew the office lease first", doc: "Renewed tenancy contract or desk agreement", est: "Your landlord's time" },
      { key: "voucher", type: "pay", title: "Pay the renewal fees", deadlineDays: 30, est: "Your choice, within 30 days" },
      { key: "renew", type: "authority", renew: true, title: "Licence renewed by the authority", est: "1–3 working days" },
      { key: "handover", type: "task", title: "Update the calendar and tell the bank", est: "1 day" },
    ] }),
  "pro-change": pro({ name: "Change of ownership", authority: "The company registrar", portal: "Registrar portal", days: [5, 15],
    gov: [["Amendment fee", 1600]],
    steps: [
      { key: "kyc", type: "kyc", title: "Identity checks on the new owner", est: "2–5 days" },
      { key: "voucher", type: "pay", title: "Pay the amendment fee", deadlineDays: 10, est: "Your choice, within 10 days" },
      { key: "notify", type: "authority", title: "Tell the registrar of the change", est: "2–5 working days" },
      { key: "registers", type: "task", applyChange: true, title: "Update both registers", est: "Same day" },
    ] }),
});
Q.PLANS = { essentials: { name: "Essentials", fee: 1500, covers: "Renewals and the compliance calendar" }, full: { name: "Full", fee: 3500, covers: "Renewals, registers, ownership changes and government errands" } };
Q.PRO_RULES = { leaseDaysBeforeLicence: 30, changeNoticeDays: 15, alertDays: 10 }; // sample time limits
