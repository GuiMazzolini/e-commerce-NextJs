import { z } from "zod";
import { MAX_CART_QUANTITY } from "@/app/lib/cart-limits";

/**
 * Request body schemas for every route that accepts JSON.
 *
 * The type checks here are what stop MongoDB operator injection: a body like
 * `{"productId": {"$gt": ""}}` used to pass a truthiness check and reach
 * `findOne({ id: productId })` as a live query operator.
 */

/**
 * Stripe caps a metadata value at 500 characters and the whole cart is packed
 * into one (see encodeCartItemsMetadata), so distinct line items are capped
 * well below the point where that encoding can overflow.
 */
export const MAX_CART_LINE_ITEMS = 25;

export const productIdSchema = z.string().trim().min(1).max(64);

export const cartItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
});

export const cartPostSchema = z.object({ productId: productIdSchema });

export const cartPatchSchema = z.object({
  productId: productIdSchema,
  // 0 removes the line item.
  quantity: z.number().int().min(0).max(MAX_CART_QUANTITY),
});

export const cartDeleteSchema = z.object({ productId: productIdSchema });

export const cartMergeSchema = z.object({
  items: z.array(cartItemSchema).max(MAX_CART_LINE_ITEMS),
});

export const guestCheckoutSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(MAX_CART_LINE_ITEMS),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(200),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const passwordChangeSchema = z.object({
  // Absent when an OAuth account is setting a password for the first time.
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: z.string().min(8).max(200),
});

/** ISO 3166-1 alpha-2, matching the countries Checkout accepts. */
export const addressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).nullish().transform((v) => v || null),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).nullish().transform((v) => v || null),
  postalCode: z.string().trim().min(1).max(20),
  country: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase()),
});

export const adminProductCreateSchema = z.object({
  id: productIdSchema.optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  imageUrl: z.url().max(2000),
  price: z.number().finite().nonnegative().max(1_000_000),
  stock: z.number().int().nonnegative().max(1_000_000),
});

/** PATCH accepts any subset, but rejects an entirely empty body. */
export const adminProductUpdateSchema = adminProductCreateSchema
  .omit({ id: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });
