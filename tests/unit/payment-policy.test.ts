import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculatePaymentState,
  canAddDocumentCopies,
  cashPaymentUpdateSchema,
  catalogPriceSchema,
  documentCopiesSchema,
  MAX_DOCUMENT_COPIES,
  paymentUpdateSchema,
  resolveCatalogPrice,
} from "../../lib/payment-policy";

const existing = {
  totalCopies: 2,
  standardPrice: 25,
  negotiatedPrice: null,
  unitPrice: 25,
  discount: 0,
  surcharge: 0,
  amountPaid: 0,
  paidAt: null,
  currency: "MAD",
};

describe("payment boundary policy", () => {
  it("preserves a managed catalog price and falls back only when absent", () => {
    assert.equal(resolveCatalogPrice(35, 20), 35);
    assert.equal(resolveCatalogPrice(undefined, 20), 20);
    assert.equal(resolveCatalogPrice(-1, undefined), null);
  });

  it("rejects client outputs, negative money, excess precision and other currencies", () => {
    for (const payload of [
      { amountPaid: -1 },
      { amountPaid: 1.001 },
      { amountPaid: 10, paymentStatus: "PAID" },
      { amountPaid: 10, chargedTotal: 10 },
      { amountPaid: 10, changeGiven: 0 },
      { amountPaid: 10, paidAt: "2026-10-30T12:00:00.000Z" },
      { amountPaid: 10, currency: "EUR" },
    ]) assert.equal(paymentUpdateSchema.safeParse(payload).success, false);
  });

  it("allows cashiers to submit only the received amount and bounds catalog prices", () => {
    assert.equal(cashPaymentUpdateSchema.safeParse({ amountPaid: 60 }).success, true);
    assert.equal(cashPaymentUpdateSchema.safeParse({ amountPaid: 60, unitPrice: 1 }).success, false);
    assert.equal(catalogPriceSchema.safeParse(10.25).success, true);
    assert.equal(catalogPriceSchema.safeParse(-1).success, false);
    assert.equal(catalogPriceSchema.safeParse(10.001).success, false);
  });

  it("bounds document copies to the PostgreSQL integer range", () => {
    assert.equal(documentCopiesSchema.safeParse(MAX_DOCUMENT_COPIES).success, true);
    assert.equal(documentCopiesSchema.safeParse(MAX_DOCUMENT_COPIES + 1).success, false);
    assert.equal(canAddDocumentCopies(MAX_DOCUMENT_COPIES - 1, 1), true);
    assert.equal(canAddDocumentCopies(MAX_DOCUMENT_COPIES, 1), false);
  });

  it("derives total, status, change and paid timestamp on the server", () => {
    const now = new Date("2026-10-30T12:00:00.000Z");
    const result = calculatePaymentState(existing, { unitPrice: 25, amountPaid: 60 }, now);
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.value, {
      standardPrice: 25,
      negotiatedPrice: null,
      unitPrice: 25,
      discount: 0,
      surcharge: 0,
      chargedTotal: 50,
      amountPaid: 60,
      changeGiven: 10,
      paidAt: now,
      paymentStatus: "PAID",
      currency: "MAD",
    });
  });

  it("derives partial and unpaid states", () => {
    const partial = calculatePaymentState(existing, { amountPaid: 10 }, new Date());
    const unpaid = calculatePaymentState(existing, { amountPaid: 0 }, new Date());
    assert.equal(partial.success && partial.value.paymentStatus, "PARTIAL");
    assert.equal(partial.success && partial.value.changeGiven, 0);
    assert.equal(partial.success && partial.value.paidAt, null);
    assert.equal(unpaid.success && unpaid.value.paymentStatus, "UNPAID");
    assert.equal(unpaid.success && unpaid.value.paidAt, null);
  });

  it("rejects negative and out-of-range derived totals", () => {
    const negative = calculatePaymentState(existing, { discount: 60 }, new Date());
    const overflow = calculatePaymentState(
      { ...existing, unitPrice: 99_999_999.99 },
      {},
      new Date(),
    );
    assert.equal(negative.success ? "" : negative.code, "NEGATIVE_CHARGED_TOTAL");
    assert.equal(overflow.success ? "" : overflow.code, "CHARGED_TOTAL_OUT_OF_RANGE");
  });
});
