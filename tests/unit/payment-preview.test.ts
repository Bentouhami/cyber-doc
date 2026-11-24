import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateChargedTotalPreview,
  calculatePaymentPreview,
} from "../../lib/payment-preview";

describe("payment preview", () => {
  it("applies a total customer discount without changing the unit price", () => {
    assert.equal(calculateChargedTotalPreview("25", 2, ""), "50.00");
    assert.equal(calculateChargedTotalPreview("25", 2, "5"), "45.00");
    assert.deepEqual(calculatePaymentPreview("0.00", ""), {
      paymentStatus: "PAID",
      changeGiven: "0.00",
    });
    assert.equal(calculateChargedTotalPreview("25", 2, "55"), "");
  });

  it("calculates exact change for a multi-copy total", () => {
    assert.deepEqual(calculatePaymentPreview("59.97", "100"), {
      paymentStatus: "PAID",
      changeGiven: "40.03",
    });
  });

  it("keeps change at zero for partial and empty payments", () => {
    assert.deepEqual(calculatePaymentPreview("59.97", "20"), {
      paymentStatus: "PARTIAL",
      changeGiven: "0.00",
    });
    assert.deepEqual(calculatePaymentPreview("59.97", ""), {
      paymentStatus: "UNPAID",
      changeGiven: "0.00",
    });
  });
});
