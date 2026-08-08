import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  retrieveMock,
  insertOneMock,
  updateOneProductsMock,
  updateOneCartsMock,
  sendEmailMock,
} = vi.hoisted(() => ({
  retrieveMock: vi.fn(),
  insertOneMock: vi.fn(),
  updateOneProductsMock: vi.fn(),
  updateOneCartsMock: vi.fn(),
  sendEmailMock: vi.fn(),
}));

vi.mock("@/app/lib/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: retrieveMock,
      },
    },
  }),
}));

vi.mock("@/app/api/db", () => ({
  connectToDB: async () => ({
    db: {
      collection: (name: string) => {
        if (name === "orders") {
          return { insertOne: insertOneMock };
        }
        if (name === "products") {
          return { updateOne: updateOneProductsMock };
        }
        if (name === "carts") {
          return { updateOne: updateOneCartsMock };
        }
        throw new Error(`Unexpected collection: ${name}`);
      },
    },
  }),
}));

vi.mock("@/app/lib/email", () => ({
  sendOrderConfirmationEmail: sendEmailMock,
}));

import { fulfillCheckoutSession } from "@/app/lib/orders";

describe("fulfillCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateOneProductsMock.mockResolvedValue({ modifiedCount: 1 });
    updateOneCartsMock.mockResolvedValue({ modifiedCount: 1 });
    sendEmailMock.mockResolvedValue(undefined);

    retrieveMock.mockResolvedValue({
      id: "cs_test_abc",
      payment_status: "paid",
      client_reference_id: "buyer@example.com",
      metadata: {
        userId: "buyer@example.com",
        cartItems: "hat:2",
      },
      customer_details: { email: "buyer@example.com" },
      customer_email: null,
      amount_subtotal: 4000,
      amount_total: 4500,
      currency: "usd",
      total_details: { amount_shipping: 500 },
      collected_information: null,
      line_items: {
        data: [
          {
            description: "Hat",
            quantity: 2,
            price: { unit_amount: 2000 },
          },
        ],
      },
    });
  });

  it("decrements stock and emails only on the first fulfillment", async () => {
    insertOneMock
      .mockResolvedValueOnce({ insertedId: "1" })
      .mockRejectedValueOnce({ code: 11000 });

    const first = await fulfillCheckoutSession("cs_test_abc");
    const second = await fulfillCheckoutSession("cs_test_abc");

    expect(first).toEqual({ paid: true, fulfilled: true });
    expect(second).toEqual({ paid: true, fulfilled: true });

    expect(updateOneProductsMock).toHaveBeenCalledTimes(1);
    expect(updateOneProductsMock).toHaveBeenCalledWith(
      { id: "hat", stock: { $gte: 2 } },
      { $inc: { stock: -2 } }
    );

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(updateOneCartsMock).toHaveBeenCalledTimes(2);
  });

  it("does not fulfill unpaid sessions", async () => {
    retrieveMock.mockResolvedValueOnce({
      id: "cs_test_unpaid",
      payment_status: "unpaid",
    });

    const result = await fulfillCheckoutSession("cs_test_unpaid");
    expect(result).toEqual({ paid: false, fulfilled: false });
    expect(insertOneMock).not.toHaveBeenCalled();
    expect(updateOneProductsMock).not.toHaveBeenCalled();
  });
});
