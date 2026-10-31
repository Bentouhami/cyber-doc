import { z } from "zod";

export const PAYMENT_CURRENCY = "MAD" as const;
export const MAX_MONEY_AMOUNT = 99_999_999.99;

const moneySchema = z
  .number()
  .nonnegative()
  .max(MAX_MONEY_AMOUNT)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    "Money values support at most two decimal places",
  );

export const paymentUpdateSchema = z
  .object({
    standardPrice: moneySchema.optional(),
    negotiatedPrice: moneySchema.optional(),
    unitPrice: moneySchema.optional(),
    discount: moneySchema.optional(),
    surcharge: moneySchema.optional(),
    amountPaid: moneySchema.optional(),
    currency: z.literal(PAYMENT_CURRENCY).optional(),
  })
  .strict()
  .refine(
    (value) =>
      [
        value.standardPrice,
        value.negotiatedPrice,
        value.unitPrice,
        value.discount,
        value.surcharge,
        value.amountPaid,
      ].some((entry) => entry !== undefined),
    "At least one payment value is required",
  );

export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>;

export type ExistingPaymentState = {
  totalCopies: number;
  standardPrice: number | null;
  negotiatedPrice: number | null;
  unitPrice: number | null;
  discount: number | null;
  surcharge: number | null;
  amountPaid: number | null;
  paidAt: Date | null;
  currency: string;
};

type PaymentCalculationError = {
  success: false;
  code:
    | "INVALID_PAYMENT_STATE"
    | "UNSUPPORTED_CURRENCY"
    | "PRICE_REQUIRED"
    | "NEGATIVE_CHARGED_TOTAL"
    | "CHARGED_TOTAL_OUT_OF_RANGE";
  message: string;
};

type PaymentCalculationSuccess = {
  success: true;
  value: {
    standardPrice: number | null;
    negotiatedPrice: number | null;
    unitPrice: number;
    discount: number;
    surcharge: number;
    chargedTotal: number;
    amountPaid: number;
    changeGiven: number;
    paidAt: Date | null;
    paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
    currency: typeof PAYMENT_CURRENCY;
  };
};

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (value: number) => value / 100;
const maxCents = toCents(MAX_MONEY_AMOUNT);

export function calculatePaymentState(
  existing: ExistingPaymentState,
  input: PaymentUpdate,
  now = new Date(),
): PaymentCalculationSuccess | PaymentCalculationError {
  if (!Number.isSafeInteger(existing.totalCopies) || existing.totalCopies < 1) {
    return {
      success: false,
      code: "INVALID_PAYMENT_STATE",
      message: "Document copy count is invalid",
    };
  }
  if (existing.currency !== PAYMENT_CURRENCY || input.currency && input.currency !== PAYMENT_CURRENCY) {
    return {
      success: false,
      code: "UNSUPPORTED_CURRENCY",
      message: "Only MAD cash payments are supported",
    };
  }

  const standardPrice = input.standardPrice ?? existing.standardPrice;
  const negotiatedPrice = input.negotiatedPrice ?? existing.negotiatedPrice;
  const unitPrice =
    input.unitPrice ?? existing.unitPrice ?? negotiatedPrice ?? standardPrice;
  if (unitPrice === null) {
    return {
      success: false,
      code: "PRICE_REQUIRED",
      message: "A unit price is required before recording payment",
    };
  }

  const discount = input.discount ?? existing.discount ?? 0;
  const surcharge = input.surcharge ?? existing.surcharge ?? 0;
  const amountPaid = input.amountPaid ?? existing.amountPaid ?? 0;
  const chargedCents =
    toCents(unitPrice) * existing.totalCopies -
    toCents(discount) +
    toCents(surcharge);
  if (chargedCents < 0) {
    return {
      success: false,
      code: "NEGATIVE_CHARGED_TOTAL",
      message: "Discount exceeds the priced document total",
    };
  }
  if (chargedCents > maxCents) {
    return {
      success: false,
      code: "CHARGED_TOTAL_OUT_OF_RANGE",
      message: "Charged total exceeds the supported monetary range",
    };
  }

  const paidCents = toCents(amountPaid);
  const paymentStatus =
    paidCents >= chargedCents
      ? "PAID"
      : paidCents > 0
        ? "PARTIAL"
        : "UNPAID";
  const changeCents = Math.max(0, paidCents - chargedCents);

  return {
    success: true,
    value: {
      standardPrice,
      negotiatedPrice,
      unitPrice: fromCents(toCents(unitPrice)),
      discount: fromCents(toCents(discount)),
      surcharge: fromCents(toCents(surcharge)),
      chargedTotal: fromCents(chargedCents),
      amountPaid: fromCents(paidCents),
      changeGiven: fromCents(changeCents),
      paidAt:
        paymentStatus === "PAID" ? existing.paidAt ?? now : null,
      paymentStatus,
      currency: PAYMENT_CURRENCY,
    },
  };
}
