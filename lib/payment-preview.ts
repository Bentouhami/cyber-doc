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

export function calculateChargedTotalPreview(
  unitPrice: string,
  copies: number,
  discount: string,
  surcharge = "0",
) {
  const unitCents = toCents(unitPrice);
  const discountCents = toCents(discount);
  const surchargeCents = toCents(surcharge);
  if (
    unitCents === null ||
    discountCents === null ||
    surchargeCents === null ||
    !Number.isSafeInteger(copies) ||
    copies < 1
  ) {
    return "";
  }

  const chargedCents = unitCents * copies - discountCents + surchargeCents;
  return chargedCents >= 0 && Number.isSafeInteger(chargedCents)
    ? (chargedCents / 100).toFixed(2)
    : "";
}

export function calculatePaymentPreview(
  chargedTotal: string,
  amountPaid: string,
): PaymentPreview {
  if (chargedTotal === "") {
    return { paymentStatus: "UNPAID", changeGiven: "0.00" };
  }
  const chargedCents = toCents(chargedTotal);
  const paidCents = toCents(amountPaid);
  if (chargedCents === null || chargedCents < 0 || paidCents === null) {
    return { paymentStatus: "UNPAID", changeGiven: "0.00" };
  }

  return {
    paymentStatus:
      paidCents >= chargedCents ? "PAID" : paidCents > 0 ? "PARTIAL" : "UNPAID",
    changeGiven: (Math.max(0, paidCents - chargedCents) / 100).toFixed(2),
  };
}
