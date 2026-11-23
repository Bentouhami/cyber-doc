import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculatePaymentPreview } from "../../lib/payment-preview";

describe("payment preview", () => {
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
