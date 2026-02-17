const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const USER_ID = "2";

export async function updateCartQuantity(
  productId: string,
  quantity: number
) {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${USER_ID}/cart`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, quantity }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update quantity");
  }

  return response.json();
}

export async function removeCartItem(productId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${USER_ID}/cart`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove item");
  }

  return response.json();
}
