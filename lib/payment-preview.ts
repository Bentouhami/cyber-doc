type PaymentPreview = {
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  changeGiven: string;
};

function toCents(value: string) {
  if (value === "") return 0;
  const amount = Number(value);
  const cents = Math.round(amount * 100);
  return Number.isFinite(amount) && amount >= 0 && Number.isSafeInteger(cents) &&
    Math.abs(amount * 100 - cents) < 1e-8
    ? cents
    : null;
}

export function calculatePaymentPreview(
  chargedTotal: string,
  amountPaid: string,
): PaymentPreview {
  const chargedCents = toCents(chargedTotal);
  const paidCents = toCents(amountPaid);
  if (chargedCents === null || chargedCents <= 0 || paidCents === null) {
    return { paymentStatus: "UNPAID", changeGiven: "0.00" };
  }

  return {
    paymentStatus:
      paidCents >= chargedCents ? "PAID" : paidCents > 0 ? "PARTIAL" : "UNPAID",
    changeGiven: (Math.max(0, paidCents - chargedCents) / 100).toFixed(2),
  };
}
